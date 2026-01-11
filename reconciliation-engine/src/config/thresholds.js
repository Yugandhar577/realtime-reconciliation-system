// Thresholds config

const AMOUNT_TOLERANCE = 0; // for INR
const TIME_DRIFT_THRESHOLD_MS = 60000; // 1 minute
const T1_LATE_MS = 15000; // 15 seconds
const T2_MISSING_MS = 60000; // 1 minute

// Severity mapping thresholds
const SEVERITY_THRESHOLDS = {
  LOW: { amount: 100, timeDrift: 5000 },
  MEDIUM: { amount: 1000, timeDrift: 30000 },
  HIGH: { amount: 10000, timeDrift: 60000 }
};

module.exports = {
  AMOUNT_TOLERANCE,
  TIME_DRIFT_THRESHOLD_MS,
  T1_LATE_MS,
  T2_MISSING_MS,
  SEVERITY_THRESHOLDS
};