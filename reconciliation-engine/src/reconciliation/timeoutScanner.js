// Timeout scanner for late vs missing transactions

const { T1_LATE_MS, T2_MISSING_MS } = require('../config/thresholds');

class TimeoutScanner {
  constructor(stateStore, reconciler) {
    this.stateStore = stateStore;
    this.reconciler = reconciler;
    this.intervalId = null;
  }

  start() {
    this.intervalId = setInterval(() => {
      this.scan();
    }, 5000); // Scan every 5 seconds

    console.log('Timeout scanner started');
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Timeout scanner stopped');
    }
  }

  scan() {
    const pendingEntries = this.stateStore.getAllPending();
    const now = Date.now();

    for (const { txId, entry } of pendingEntries) {
      const age = now - entry.firstSeenAt;
      const derivedState = this.stateStore.getDerivedState(txId);

      if (!derivedState.hasCBS && !derivedState.hasGateway) {
        // This shouldn't happen, but skip
        continue;
      }

      if (!derivedState.hasCBS || !derivedState.hasGateway) {
        // Only one side exists
        if (age > T1_LATE_MS) {
          // Emit LATE_ARRIVAL (optional)
          console.log(`Late arrival for transaction ${txId}, age: ${age}ms`);
        }

        if (age > T2_MISSING_MS) {
          // Emit MISSING and finalize
          const missingType = derivedState.hasCBS ? 'MISSING_GATEWAY' : 'MISSING_CBS';
          const classification = {
            status: missingType,
            anomalies: [missingType],
            severity: 'HIGH',
            recommendedAction: 'INVESTIGATE_MISSING'
          };

          // Create a mock result for missing side
          const result = {
            transactionId: txId,
            classification: missingType,
            severity: 'HIGH',
            summary: `Transaction ${missingType}`,
            timeline: {
              firstSeenAt: new Date(entry.firstSeenAt).toISOString(),
              lastUpdatedAt: new Date(entry.lastUpdatedAt).toISOString()
            },
            createdAt: new Date().toISOString(),
            anomalies: [missingType],
            recommendedAction: 'INVESTIGATE_MISSING'
          };

          // Emit the result
          this.reconciler.finalize(txId, entry, classification);

          console.log(`Finalized missing transaction ${txId} after ${age}ms`);
        }
      }
    }
  }
}

module.exports = TimeoutScanner;