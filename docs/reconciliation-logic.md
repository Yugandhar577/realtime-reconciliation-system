# Reconciliation Logic

## Overview

The reconciliation engine uses a rules-based classification system to determine transaction matching status. Transactions are evaluated based on presence of both CBS and Gateway events, amount matching, and various business rule validations.

## Decision Rules

### Primary Classification Logic

1. **Both Events Present**: When both CBS and Gateway events exist for a transaction ID
2. **Single Event Present**: When only one side's event is received (timeout scenario)
3. **Event Matching**: Business rule validation for matching transactions

### Matching Criteria

#### Amount Matching
- **Tolerance**: 0 INR (exact match required)
- **Comparison**: `Math.abs(cbsEvent.amount - gatewayEvent.amount) > 0`
- **Result**: `AMOUNT_MISMATCH` anomaly if difference > 0

#### Currency Matching
- **Rule**: `cbsEvent.currency !== gatewayEvent.currency`
- **Result**: `CURRENCY_MISMATCH` anomaly (HIGH severity)

#### Status Matching
- **Rule**: `cbsEvent.status !== gatewayEvent.status`
- **Result**: `STATUS_MISMATCH` anomaly (MEDIUM severity)

#### Time Drift Validation
- **Threshold**: 60,000ms (1 minute)
- **Calculation**: `Math.abs(cbsTime - gatewayTime)`
- **Result**: `TIME_DRIFT` anomaly if difference > threshold

### Timeout Rules

#### Late Arrival Detection
- **Threshold**: T1_LATE_MS = 15,000ms (15 seconds)
- **Trigger**: When one event is missing after T1
- **Action**: Log warning (no finalization)

#### Missing Transaction Detection
- **Threshold**: T2_MISSING_MS = 60,000ms (1 minute)
- **Trigger**: When one event is still missing after T2
- **Action**: Finalize with MISSING status

## Classification Table

| Scenario | CBS Event | Gateway Event | Status | Severity | Anomalies | Recommended Action |
|----------|-----------|---------------|--------|----------|-----------|-------------------|
| **Perfect Match** | ✅ | ✅ | MATCHED | LOW | None | NONE |
| **Amount Mismatch** | ✅ | ✅ | MISMATCHED | HIGH | AMOUNT_MISMATCH | IMMEDIATE_INVESTIGATION |
| **Currency Mismatch** | ✅ | ✅ | MISMATCHED | HIGH | CURRENCY_MISMATCH | BLOCK_AND_INVESTIGATE |
| **Status Mismatch** | ✅ | ✅ | MISMATCHED | MEDIUM | STATUS_MISMATCH | REVIEW_AND_CORRECT |
| **Time Drift** | ✅ | ✅ | MISMATCHED | MEDIUM-HIGH | TIME_DRIFT | MONITOR |
| **Missing CBS** | ❌ | ✅ | MISSING_CBS | HIGH | MISSING_CBS | INVESTIGATE_MISSING |
| **Missing Gateway** | ✅ | ❌ | MISSING_GATEWAY | HIGH | MISSING_GATEWAY | INVESTIGATE_MISSING |
| **Duplicate Events** | ✅ (2+) | ✅ (2+) | MISMATCHED | MEDIUM | DUPLICATE | REVIEW_AND_CORRECT |

## Severity Calculation

### Amount-Based Severity
```javascript
const diff = Math.abs(cbsAmount - gatewayAmount);
if (diff >= 10000) return 'HIGH';        // ≥ ₹10,000
else if (diff >= 1000) return 'MEDIUM';  // ≥ ₹1,000
else if (diff > 0) return 'LOW';         // > ₹0
```

### Time-Based Severity
```javascript
const timeDiff = Math.abs(cbsTime - gatewayTime);
if (timeDiff >= 60000) return 'HIGH';     // ≥ 1 minute
else if (timeDiff >= 30000) return 'MEDIUM'; // ≥ 30 seconds
else if (timeDiff >= 5000) return 'LOW';     // ≥ 5 seconds
```

### Overall Severity Logic
1. **HIGH**: Currency mismatches, large amount differences, missing transactions
2. **MEDIUM**: Status mismatches, moderate time drift, duplicates
3. **LOW**: Small amount differences, minor time drift, perfect matches

## Recommended Actions

### IMMEDIATE_INVESTIGATION
- **Trigger**: Amount mismatches > ₹1,000
- **Action**: Alert operations team immediately
- **Escalation**: May require transaction reversal

### BLOCK_AND_INVESTIGATE
- **Trigger**: Currency mismatches
- **Action**: Block transaction processing, investigate immediately
- **Escalation**: Critical business impact

### REVIEW_AND_CORRECT
- **Trigger**: Status mismatches, duplicates
- **Action**: Manual review and correction in systems
- **Escalation**: Operational issue resolution

### INVESTIGATE_MISSING
- **Trigger**: Missing CBS or Gateway events
- **Action**: Check system connectivity and logs
- **Escalation**: Infrastructure or integration issue

### MONITOR
- **Trigger**: Time drift, small amount differences
- **Action**: Log for trending analysis
- **Escalation**: Performance monitoring

### NONE
- **Trigger**: Perfect matches
- **Action**: No action required
- **Escalation**: Normal operation

## State Management

### Transaction States
- **pending**: Initial state when first event received
- **matched**: Both events present, all rules pass
- **mismatched**: Both events present, validation failures
- **missing_cbs**: Only Gateway event, CBS timeout
- **missing_gateway**: Only CBS event, Gateway timeout

### State Transitions
```
pending → matched     (both events + validation pass)
pending → mismatched  (both events + validation fail)
pending → missing_cbs    (gateway only + timeout)
pending → missing_gateway (cbs only + timeout)
```

## Fault Injection Support

The system supports configurable fault injection for testing:

### Available Fault Types
- **GATEWAY_TIMEOUT**: Gateway event delayed/fails
- **CBS_FAILURE**: CBS transaction fails with error
- **AMOUNT_MISMATCH**: Gateway reports different amount
- **NONE**: Normal operation

### Configuration Format
```json
{
  "faultConfig": {
    "enabled": true,
    "type": "AMOUNT_MISMATCH",
    "target": "GATEWAY"
  }
}
```

## Performance Metrics

### Reconciliation Latency
- **Target**: < 100ms for matched transactions
- **Timeout**: 15s (T1) and 60s (T2) for missing detection

### Throughput
- **Target**: 1000+ transactions per second
- **Scaling**: Horizontal via Kafka partitions

### Accuracy
- **Target**: 100% detection of configured mismatch rules
- **False Positives**: < 0.1% under normal conditions