// In-memory reconciliation state store

// TTL for deduplication tracking: 2 hours
const PROCESSED_EVENT_TTL_MS = 2 * 60 * 60 * 1000;
// Max entries before a forced eviction sweep
const PROCESSED_EVENT_MAX = 50_000;

class StateStore {
  constructor() {
    this.store = new Map();
    // Map<eventId, insertedAtMs> — bounded and TTL-evicted to prevent unbounded growth
    this.processedEventIds = new Map();
    this.completedTransactions = [];
    this.maxCompletedTransactions = 1000;
  }

  get(txId) {
    return this.store.get(txId);
  }

  set(txId, entry) {
    this.store.set(txId, entry);
  }

  delete(txId) {
    this.store.delete(txId);
  }

  addCompletedTransaction(result) {
    this.completedTransactions.unshift(result);
    // Keep only the most recent transactions
    if (this.completedTransactions.length > this.maxCompletedTransactions) {
      this.completedTransactions = this.completedTransactions.slice(0, this.maxCompletedTransactions);
    }
  }

  upsert(txId, patch) {
    const existing = this.get(txId);
    if (existing) {
      const updated = { ...existing, ...patch, lastUpdatedAt: Date.now() };
      this.set(txId, updated);
      return updated;
    } else {
      const newEntry = {
        transactionId: txId,
        ...patch,
        firstSeenAt: Date.now(),
        lastUpdatedAt: Date.now(),
        status: 'pending',
        anomalies: [],
        seenEventIds: new Set(),
        seenSources: new Set()
      };
      this.set(txId, newEntry);
      return newEntry;
    }
  }

  getAllPending() {
    const pending = [];
    for (const [txId, entry] of this.store) {
      if (entry.status === 'pending') {
        pending.push({ txId, entry });
      }
    }
    return pending;
  }

  isEventProcessed(eventId) {
    const insertedAt = this.processedEventIds.get(eventId);
    if (insertedAt === undefined) return false;
    // Treat expired entries as unprocessed (evict lazily)
    if (Date.now() - insertedAt > PROCESSED_EVENT_TTL_MS) {
      this.processedEventIds.delete(eventId);
      return false;
    }
    return true;
  }

  markEventProcessed(eventId) {
    this.processedEventIds.set(eventId, Date.now());
    // Periodic eviction: if we hit the cap, sweep out all expired entries
    if (this.processedEventIds.size > PROCESSED_EVENT_MAX) {
      const cutoff = Date.now() - PROCESSED_EVENT_TTL_MS;
      for (const [id, ts] of this.processedEventIds) {
        if (ts < cutoff) this.processedEventIds.delete(id);
      }
    }
  }

  getDerivedState(txId) {
    const entry = this.get(txId);
    if (!entry) return null;

    const now = Date.now();
    return {
      hasCBS: !!entry.cbsEvent,
      hasGateway: !!entry.gatewayEvent,
      ageMs: now - entry.firstSeenAt,
      ...entry
    };
  }

  // API helper methods
  getTransaction(txId) {
    // Check completed transactions first (most common lookup from the detail page)
    const completed = this.completedTransactions.find(tx => tx.transactionId === txId);
    if (completed) return completed;

    // Fall back to in-flight pending entry
    const entry = this.get(txId);
    if (!entry) return null;

    return {
      transactionId: txId,
      status: this.getStatus(entry),
      severity: this.getSeverity(entry),
      summary: this.getSummary(entry),
      createdAt: new Date(entry.firstSeenAt).toISOString(),
      anomalies: entry.anomalies || [],
      timeline: {
        firstSeenAt: new Date(entry.firstSeenAt).toISOString(),
        lastUpdatedAt: new Date(entry.lastUpdatedAt).toISOString(),
        processedAt: entry.cbsEvent?.processedAt,
        receivedAt: entry.gatewayEvent?.processedAt
      }
    };
  }

  getMetrics() {
    let matched = 0;
    let mismatched = 0;
    let missing = 0;
    let latencySum = 0;
    let latencyCount = 0;

    for (const tx of this.completedTransactions) {
      const status = tx.status || tx.classification || '';
      if (status === 'MATCHED') matched++;
      else if (status === 'MISMATCHED') mismatched++;
      else if (status.includes('MISSING')) missing++;

      if (tx.timeDeltaMs != null && !isNaN(tx.timeDeltaMs)) {
        latencySum += tx.timeDeltaMs;
        latencyCount++;
      }
    }

    const total = matched + mismatched + missing;
    const mismatchRate = total > 0 ? (mismatched + missing) / total : 0;

    return {
      totalTransactions: total,
      matchedTransactions: matched,
      mismatchedTransactions: mismatched,
      missingTransactions: missing,
      averageLatency: latencyCount > 0 ? Math.round(latencySum / latencyCount) : 0,
      systemHealth: mismatchRate > 0.1 ? 'critical' : mismatchRate > 0.02 ? 'warning' : 'healthy'
    };
  }

  searchTransactions({ status, severity, startDate, endDate, limit = 50 }) {
    // Search completed transactions (the main dataset)
    let results = [...this.completedTransactions];

    if (status) {
      results = results.filter(tx => (tx.status || tx.classification) === status);
    }

    if (severity) {
      results = results.filter(tx => tx.severity === severity);
    }

    if (startDate) {
      const start = new Date(startDate).getTime();
      results = results.filter(tx => tx.createdAt && Date.parse(tx.createdAt) >= start);
    }

    if (endDate) {
      const end = new Date(endDate).getTime();
      results = results.filter(tx => tx.createdAt && Date.parse(tx.createdAt) <= end);
    }

    return results.slice(0, limit);
  }

  getStats() {
    const stats = {
      total: 0,
      matched: 0,
      mismatched: 0,
      missing: 0,
      bySeverity: { LOW: 0, MEDIUM: 0, HIGH: 0 },
      recentActivity: []
    };

    // Calculate stats from completed transactions history (more reliable for high-throughput)
    for (const transaction of this.completedTransactions) {
      stats.total++;
      const status = transaction.classification;
      if (status === 'MATCHED') stats.matched++;
      else if (status === 'MISMATCHED') stats.mismatched++;
      else if (status && status.includes('MISSING')) stats.missing++;

      const severity = transaction.severity || 'LOW';
      if (stats.bySeverity[severity] !== undefined) {
        stats.bySeverity[severity]++;
      }
    }

    // Recent activity (last 60 minutes, per-minute buckets)
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const minuteBuckets = {};

    for (const tx of this.completedTransactions) {
      // transactions store createdAt as ISO string
      const ts = tx.createdAt ? Date.parse(tx.createdAt) : null;
      if (!ts || isNaN(ts)) continue;
      if (ts < oneHourAgo) continue;
      const minute = Math.floor(ts / (60 * 1000));
      minuteBuckets[minute] = (minuteBuckets[minute] || 0) + 1;
    }

    stats.recentActivity = Object.entries(minuteBuckets)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([minute, count]) => ({
        timestamp: new Date(Number(minute) * 60 * 1000).toISOString(),
        count
      }));

    return stats;
  }

  getRecentTransactions(limit = 50) {
    return this.completedTransactions.slice(0, limit);
  }

  getStatus(entry) {
    if (entry.cbsEvent && entry.gatewayEvent) {
      // Check for mismatches
      const cbsAmount = entry.cbsEvent.amount;
      const gatewayAmount = entry.gatewayEvent.amount;
      if (Math.abs(cbsAmount - gatewayAmount) > 0.01) {
        return 'MISMATCHED';
      }
      return 'MATCHED';
    } else if (entry.cbsEvent) {
      return 'MISSING_GATEWAY';
    } else if (entry.gatewayEvent) {
      return 'MISSING_CBS';
    }
    return 'UNKNOWN';
  }

  getSeverity(entry) {
    const status = this.getStatus(entry);
    if (status === 'MISMATCHED') return 'HIGH';
    if (status.includes('MISSING')) return 'MEDIUM';
    return 'LOW';
  }

  getSummary(entry) {
    const status = this.getStatus(entry);
    const txId = entry.transactionId || 'unknown';
    switch (status) {
      case 'MATCHED':
        return `Transaction ${txId} successfully reconciled`;
      case 'MISMATCHED':
        return `Amount mismatch for transaction ${txId}`;
      case 'MISSING_GATEWAY':
        return `Missing gateway event for CBS transaction ${txId}`;
      case 'MISSING_CBS':
        return `Missing CBS event for gateway transaction ${txId}`;
      default:
        return `Transaction ${txId} in progress`;
    }
  }
}

module.exports = StateStore;