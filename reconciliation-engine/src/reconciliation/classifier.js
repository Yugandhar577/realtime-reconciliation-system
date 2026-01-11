// Mismatch detection rules

const { AMOUNT_TOLERANCE, TIME_DRIFT_THRESHOLD_MS, SEVERITY_THRESHOLDS } = require('../config/thresholds');

class Classifier {
  evaluate(entry) {
    const anomalies = [];
    let severity = 'LOW';

    if (entry.cbsEvent && entry.gatewayEvent) {
      // Amount mismatch
      if (Math.abs(entry.cbsEvent.amount - entry.gatewayEvent.amount) > AMOUNT_TOLERANCE) {
        anomalies.push('AMOUNT_MISMATCH');
        const diff = Math.abs(entry.cbsEvent.amount - entry.gatewayEvent.amount);
        if (diff >= SEVERITY_THRESHOLDS.HIGH.amount) severity = 'HIGH';
        else if (diff >= SEVERITY_THRESHOLDS.MEDIUM.amount) severity = 'MEDIUM';
      }

      // Currency mismatch
      if (entry.cbsEvent.currency !== entry.gatewayEvent.currency) {
        anomalies.push('CURRENCY_MISMATCH');
        severity = 'HIGH';
      }

      // Status mismatch
      if (entry.cbsEvent.status !== entry.gatewayEvent.status) {
        anomalies.push('STATUS_MISMATCH');
        severity = 'MEDIUM';
      }

      // Time drift
      const cbsTime = new Date(entry.cbsEvent.processedAt).getTime();
      const gatewayTime = new Date(entry.gatewayEvent.respondedAt || entry.gatewayEvent.receivedAt).getTime();
      const timeDiff = Math.abs(cbsTime - gatewayTime);
      if (timeDiff > TIME_DRIFT_THRESHOLD_MS) {
        anomalies.push('TIME_DRIFT');
        if (timeDiff >= SEVERITY_THRESHOLDS.HIGH.timeDrift) severity = 'HIGH';
        else if (timeDiff >= SEVERITY_THRESHOLDS.MEDIUM.timeDrift) severity = 'MEDIUM';
      }
    }

    // Duplicate check
    if (entry.seenEventIds.size > 2 || entry.seenSources.size > 2) {
      anomalies.push('DUPLICATE');
      severity = 'MEDIUM';
    }

    const status = anomalies.length === 0 ? 'MATCHED' : 'MISMATCHED';

    return {
      status,
      anomalies,
      severity,
      recommendedAction: this.getRecommendedAction(status, severity, anomalies)
    };
  }

  getRecommendedAction(status, severity, anomalies) {
    if (status === 'MATCHED') return 'NONE';

    if (severity === 'HIGH') return 'IMMEDIATE_INVESTIGATION';
    if (anomalies.includes('CURRENCY_MISMATCH')) return 'BLOCK_AND_INVESTIGATE';
    if (anomalies.includes('AMOUNT_MISMATCH')) return 'REVIEW_AND_CORRECT';

    return 'MONITOR';
  }
}

module.exports = Classifier;