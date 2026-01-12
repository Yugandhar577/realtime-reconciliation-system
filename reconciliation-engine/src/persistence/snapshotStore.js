// State snapshots using Redis

const redisClient = require('./redisClient');

const SNAPSHOT_KEY = 'recon:snapshot';

class SnapshotStore {
  constructor(stateStore) {
    this.stateStore = stateStore;
    this.saveInterval = null;
  }

  startPeriodicSave(intervalMs = 30000) { // Save every 30 seconds
    this.saveInterval = setInterval(() => {
      this.saveSnapshot();
    }, intervalMs);

    console.log('Periodic snapshot saving started');
  }

  stopPeriodicSave() {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
      this.saveInterval = null;
      console.log('Periodic snapshot saving stopped');
    }
  }

  async saveSnapshot() {
    try {
      const pendingEntries = this.stateStore.getAllPending();

      // Serialize minimal state (only necessary fields)
      const snapshot = pendingEntries.map(({ txId, entry }) => ({
        txId,
        cbsEvent: entry.cbsEvent,
        gatewayEvent: entry.gatewayEvent,
        firstSeenAt: entry.firstSeenAt,
        lastUpdatedAt: entry.lastUpdatedAt,
        status: entry.status,
        anomalies: entry.anomalies,
        seenEventIds: Array.from(entry.seenEventIds),
        seenSources: Array.from(entry.seenSources)
      }));

      await redisClient.set(SNAPSHOT_KEY, JSON.stringify(snapshot));
      console.log(`Snapshot saved with ${snapshot.length} pending entries`);
    } catch (error) {
      console.error('Error saving snapshot:', error);
    }
  }

  async loadSnapshot() {
    try {
      const snapshotData = await redisClient.get(SNAPSHOT_KEY);
      if (!snapshotData) {
        console.log('No snapshot found');
        return;
      }

      const snapshot = JSON.parse(snapshotData);

      // Hydrate into stateStore
      for (const item of snapshot) {
        const entry = {
          transactionId: item.txId, // Ensure transactionId is set for backward compatibility
          ...item,
          seenEventIds: new Set(item.seenEventIds),
          seenSources: new Set(item.seenSources)
        };
        this.stateStore.set(item.txId, entry);
      }

      console.log(`Loaded ${snapshot.length} entries from snapshot`);
    } catch (error) {
      console.error('Error loading snapshot:', error);
    }
  }

  async clearSnapshot() {
    try {
      await redisClient.del(SNAPSHOT_KEY);
      console.log('Snapshot cleared');
    } catch (error) {
      console.error('Error clearing snapshot:', error);
    }
  }
}

module.exports = SnapshotStore;