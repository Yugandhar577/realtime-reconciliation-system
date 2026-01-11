// In-memory reconciliation state store

class StateStore {
  constructor() {
    this.store = new Map();
    this.processedEventIds = new Set();
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

  upsert(txId, patch) {
    const existing = this.get(txId);
    if (existing) {
      const updated = { ...existing, ...patch, lastUpdatedAt: Date.now() };
      this.set(txId, updated);
      return updated;
    } else {
      const newEntry = {
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
}

module.exports = StateStore;