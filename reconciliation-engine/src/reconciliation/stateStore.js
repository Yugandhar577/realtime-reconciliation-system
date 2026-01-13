// In-memory reconciliation state store

class StateStore {
  constructor() {
    this.store = new Map();
    this.processedEventIds = new Set();
    this.completedTransactions = [];
    this.maxCompletedTransactions = 1000; // Keep last 1000 completed transactions
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
    return this.processedEventIds.has(eventId);
  }

  markEventProcessed(eventId) {
    this.processedEventIds.add(eventId);
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
  getRecentTransactions(limit = 50) {
    return this.completedTransactions
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
  }

  getTransaction(txId) {
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
    let total = 0;
    let matched = 0;
    let mismatched = 0;
    let missing = 0;

    for (const entry of this.store.values()) {
      total++;
      const status = this.getStatus(entry);
      if (status === 'MATCHED') matched++;
      else if (status === 'MISMATCHED') mismatched++;
      else if (status.includes('MISSING')) missing++;
    }

    return {
      totalTransactions: total,
      matchedTransactions: matched,
      mismatchedTransactions: mismatched,
      missingTransactions: missing,
      averageLatency: 0, // TODO: calculate
      systemHealth: total > 0 ? 'healthy' : 'warning'
    };
  }

  searchTransactions({ status, severity, startDate, endDate, limit = 50 }) {
    let results = Array.from(this.store.values());

    if (status) {
      results = results.filter(entry => this.getStatus(entry) === status);
    }

    if (severity) {
      results = results.filter(entry => this.getSeverity(entry) === severity);
    }

    if (startDate) {
      const start = new Date(startDate).getTime();
      results = results.filter(entry => entry.firstSeenAt >= start);
    }

    if (endDate) {
      const end = new Date(endDate).getTime();
      results = results.filter(entry => entry.firstSeenAt <= end);
    }

    return results
      .sort((a, b) => b.lastUpdatedAt - a.lastUpdatedAt)
      .slice(0, limit)
      .map(entry => ({
        transactionId: entry.transactionId || 'unknown',
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
      }));
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

    // Calculate stats from completed transactions
    for (const transaction of this.completedTransactions) {
      stats.total++;
      const status = transaction.classification;
      if (status === 'MATCHED') stats.matched++;
      else if (status === 'MISMATCHED') stats.mismatched++;
      else if (status.includes('MISSING')) stats.missing++;

      const severity = transaction.severity;
      if (stats.bySeverity[severity] !== undefined) {
        stats.bySeverity[severity]++;
      }
    }

    // Recent activity (last 24 hours, hourly)
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const hourlyBuckets = {};

    for (const entry of this.store.values()) {
      if (entry.firstSeenAt >= oneDayAgo) {
        const hour = Math.floor(entry.firstSeenAt / (60 * 60 * 1000));
        hourlyBuckets[hour] = (hourlyBuckets[hour] || 0) + 1;
      }
    }

    stats.recentActivity = Object.entries(hourlyBuckets)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([timestamp, count]) => ({
        timestamp: new Date(Number(timestamp) * 60 * 60 * 1000).toISOString(),
        count
      }));

    return stats;
  }

  getRecentTransactions(limit = 50) {
    console.log('getRecentTransactions called, completedTransactions length:', this.completedTransactions.length);
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