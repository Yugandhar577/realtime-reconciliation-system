# JSON Schema Contracts

## Overview

This document defines the JSON schema contracts for all data structures used in the Realtime Reconciliation System. These schemas ensure consistent data exchange between producers, the reconciliation engine, and consumers.

## Core Banking System (CBS) Event Schema

### Schema Definition

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "CBS Transaction Event",
  "type": "object",
  "required": ["eventId", "transactionId", "source", "eventType", "amount", "currency", "status", "processedAt"],
  "properties": {
    "eventId": {
      "type": "string",
      "description": "Unique event identifier",
      "pattern": "^CBS_EVT_.*",
      "example": "CBS_EVT_1640995200000_123"
    },
    "transactionId": {
      "type": "string",
      "description": "Business transaction identifier",
      "minLength": 1,
      "maxLength": 50,
      "example": "TXN_20231201_001"
    },
    "source": {
      "type": "string",
      "enum": ["CBS"],
      "description": "Event source system"
    },
    "eventType": {
      "type": "string",
      "enum": ["DEBIT", "CREDIT"],
      "description": "Type of banking transaction",
      "example": "DEBIT"
    },
    "senderAccountId": {
      "type": ["string", "null"],
      "description": "Account ID of the sender",
      "example": "ACC_123456789"
    },
    "receiverAccountId": {
      "type": ["string", "null"],
      "description": "Account ID of the receiver",
      "example": "ACC_987654321"
    },
    "amount": {
      "type": "number",
      "description": "Transaction amount in rupees",
      "minimum": 0,
      "maximum": 10000000,
      "multipleOf": 0.01,
      "example": 1500.50
    },
    "currency": {
      "type": "string",
      "enum": ["INR"],
      "description": "Transaction currency",
      "example": "INR"
    },
    "status": {
      "type": "string",
      "enum": ["SUCCESS", "FAILED", "PENDING"],
      "description": "Transaction processing status",
      "example": "SUCCESS"
    },
    "failureReason": {
      "type": ["string", "null"],
      "description": "Reason for failure if applicable",
      "enum": ["INSUFFICIENT_FUNDS", "ACCOUNT_BLOCKED", "TECHNICAL_ERROR", null],
      "example": null
    },
    "ledgerRef": {
      "type": "string",
      "description": "Reference to ledger entry",
      "pattern": "^LEDGER_.*",
      "example": "LEDGER_TXN_20231201_001"
    },
    "balanceBefore": {
      "type": "number",
      "description": "Account balance before transaction",
      "minimum": 0,
      "example": 10000.00
    },
    "balanceAfter": {
      "type": "number",
      "description": "Account balance after transaction",
      "minimum": 0,
      "example": 8500.00
    },
    "processedAt": {
      "type": "string",
      "format": "date-time",
      "description": "ISO 8601 timestamp of processing",
      "example": "2023-12-01T10:30:00.000Z"
    },
    "faultConfig": {
      "type": "object",
      "description": "Optional fault injection configuration for testing",
      "properties": {
        "enabled": { "type": "boolean" },
        "type": {
          "type": "string",
          "enum": ["CBS_FAILURE", "NONE"]
        },
        "target": {
          "type": "string",
          "enum": ["CBS"]
        }
      }
    }
  }
}
```

### Example CBS Event

```json
{
  "eventId": "CBS_EVT_1640995200000_123",
  "transactionId": "TXN_20231201_001",
  "source": "CBS",
  "eventType": "DEBIT",
  "senderAccountId": "ACC_123456789",
  "receiverAccountId": "ACC_987654321",
  "amount": 1500.50,
  "currency": "INR",
  "status": "SUCCESS",
  "failureReason": null,
  "ledgerRef": "LEDGER_TXN_20231201_001",
  "balanceBefore": 10000.00,
  "balanceAfter": 8500.00,
  "processedAt": "2023-12-01T10:30:00.000Z"
}
```

## Payment Gateway Event Schema

### Schema Definition

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Gateway Transaction Event",
  "type": "object",
  "required": ["eventId", "transactionId", "source", "amount", "currency", "status", "receivedAt"],
  "properties": {
    "eventId": {
      "type": "string",
      "description": "Unique event identifier",
      "pattern": "^GW_EVT_.*",
      "example": "GW_EVT_1640995200000_456"
    },
    "transactionId": {
      "type": "string",
      "description": "Business transaction identifier (matches CBS)",
      "minLength": 1,
      "maxLength": 50,
      "example": "TXN_20231201_001"
    },
    "source": {
      "type": "string",
      "enum": ["GATEWAY"],
      "description": "Event source system"
    },
    "amount": {
      "type": "number",
      "description": "Transaction amount in rupees",
      "minimum": 0,
      "maximum": 10000000,
      "multipleOf": 0.01,
      "example": 1500.50
    },
    "currency": {
      "type": "string",
      "enum": ["INR"],
      "description": "Transaction currency",
      "example": "INR"
    },
    "status": {
      "type": "string",
      "enum": ["SUCCESS", "FAILED", "TIMEOUT", "PENDING"],
      "description": "Payment processing status",
      "example": "SUCCESS"
    },
    "failureReason": {
      "type": ["string", "null"],
      "description": "Reason for failure if applicable",
      "enum": ["CARD_DECLINED", "NETWORK_ERROR", "TIMEOUT", "INSUFFICIENT_FUNDS", null],
      "example": null
    },
    "paymentMethod": {
      "type": "string",
      "description": "Payment method used",
      "enum": ["CREDIT_CARD", "DEBIT_CARD", "UPI", "NET_BANKING", "WALLET"],
      "example": "CREDIT_CARD"
    },
    "cardLastFour": {
      "type": ["string", "null"],
      "description": "Last four digits of payment card",
      "pattern": "^\\d{4}$",
      "example": "1234"
    },
    "merchantId": {
      "type": "string",
      "description": "Merchant identifier",
      "example": "MERCH_001"
    },
    "receivedAt": {
      "type": "string",
      "format": "date-time",
      "description": "ISO 8601 timestamp when payment was received",
      "example": "2023-12-01T10:30:05.000Z"
    },
    "respondedAt": {
      "type": ["string", "null"],
      "format": "date-time",
      "description": "ISO 8601 timestamp when response was sent",
      "example": "2023-12-01T10:30:10.000Z"
    },
    "processingFee": {
      "type": "number",
      "description": "Gateway processing fee",
      "minimum": 0,
      "maximum": 1000,
      "multipleOf": 0.01,
      "example": 15.00
    },
    "faultConfig": {
      "type": "object",
      "description": "Optional fault injection configuration for testing",
      "properties": {
        "enabled": { "type": "boolean" },
        "type": {
          "type": "string",
          "enum": ["GATEWAY_TIMEOUT", "AMOUNT_MISMATCH", "NONE"]
        },
        "target": {
          "type": "string",
          "enum": ["GATEWAY"]
        }
      }
    }
  }
}
```

### Example Gateway Event

```json
{
  "eventId": "GW_EVT_1640995200000_456",
  "transactionId": "TXN_20231201_001",
  "source": "GATEWAY",
  "amount": 1500.50,
  "currency": "INR",
  "status": "SUCCESS",
  "failureReason": null,
  "paymentMethod": "CREDIT_CARD",
  "cardLastFour": "1234",
  "merchantId": "MERCH_001",
  "receivedAt": "2023-12-01T10:30:05.000Z",
  "respondedAt": "2023-12-01T10:30:10.000Z",
  "processingFee": 15.00
}
```

## Reconciliation Alert Schema

### Schema Definition

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Reconciliation Alert",
  "type": "object",
  "required": ["transactionId", "classification", "severity", "summary", "timeline", "createdAt", "anomalies", "recommendedAction"],
  "properties": {
    "transactionId": {
      "type": "string",
      "description": "Business transaction identifier",
      "example": "TXN_20231201_001"
    },
    "classification": {
      "type": "string",
      "enum": ["MATCHED", "MISMATCHED", "MISSING_CBS", "MISSING_GATEWAY"],
      "description": "Reconciliation classification result",
      "example": "MATCHED"
    },
    "severity": {
      "type": "string",
      "enum": ["LOW", "MEDIUM", "HIGH"],
      "description": "Severity level of the reconciliation result",
      "example": "LOW"
    },
    "summary": {
      "type": "string",
      "description": "Human-readable summary of the reconciliation result",
      "example": "Transaction TXN_20231201_001 successfully reconciled"
    },
    "cbsEventId": {
      "type": ["string", "null"],
      "description": "CBS event ID if present",
      "example": "CBS_EVT_1640995200000_123"
    },
    "gatewayEventId": {
      "type": ["string", "null"],
      "description": "Gateway event ID if present",
      "example": "GW_EVT_1640995200000_456"
    },
    "timeline": {
      "type": "object",
      "description": "Timeline of events in the reconciliation process",
      "properties": {
        "processedAt": {
          "type": ["string", "null"],
          "format": "date-time",
          "description": "CBS processing timestamp",
          "example": "2023-12-01T10:30:00.000Z"
        },
        "receivedAt": {
          "type": ["string", "null"],
          "format": "date-time",
          "description": "Gateway received timestamp",
          "example": "2023-12-01T10:30:05.000Z"
        },
        "respondedAt": {
          "type": ["string", "null"],
          "format": "date-time",
          "description": "Gateway response timestamp",
          "example": "2023-12-01T10:30:10.000Z"
        },
        "firstSeenAt": {
          "type": "string",
          "format": "date-time",
          "description": "First time transaction was seen by reconciler",
          "example": "2023-12-01T10:30:02.000Z"
        },
        "lastUpdatedAt": {
          "type": "string",
          "format": "date-time",
          "description": "Last update timestamp",
          "example": "2023-12-01T10:30:15.000Z"
        }
      },
      "required": ["firstSeenAt", "lastUpdatedAt"]
    },
    "createdAt": {
      "type": "string",
      "format": "date-time",
      "description": "Alert creation timestamp",
      "example": "2023-12-01T10:30:15.000Z"
    },
    "anomalies": {
      "type": "array",
      "description": "List of detected anomalies",
      "items": {
        "type": "string",
        "enum": [
          "AMOUNT_MISMATCH",
          "CURRENCY_MISMATCH",
          "STATUS_MISMATCH",
          "TIME_DRIFT",
          "DUPLICATE",
          "MISSING_CBS",
          "MISSING_GATEWAY"
        ]
      },
      "example": []
    },
    "recommendedAction": {
      "type": "string",
      "enum": [
        "NONE",
        "MONITOR",
        "REVIEW_AND_CORRECT",
        "IMMEDIATE_INVESTIGATION",
        "BLOCK_AND_INVESTIGATE",
        "INVESTIGATE_MISSING"
      ],
      "description": "Recommended action based on reconciliation result",
      "example": "NONE"
    }
  }
}
```

### Example Reconciliation Alert

```json
{
  "transactionId": "TXN_20231201_001",
  "classification": "MATCHED",
  "severity": "LOW",
  "summary": "Transaction TXN_20231201_001 successfully reconciled",
  "cbsEventId": "CBS_EVT_1640995200000_123",
  "gatewayEventId": "GW_EVT_1640995200000_456",
  "timeline": {
    "processedAt": "2023-12-01T10:30:00.000Z",
    "receivedAt": "2023-12-01T10:30:05.000Z",
    "respondedAt": "2023-12-01T10:30:10.000Z",
    "firstSeenAt": "2023-12-01T10:30:02.000Z",
    "lastUpdatedAt": "2023-12-01T10:30:15.000Z"
  },
  "createdAt": "2023-12-01T10:30:15.000Z",
  "anomalies": [],
  "recommendedAction": "NONE"
}
```

## API Response Schemas

### Transaction Summary Response

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Transaction Summary",
  "type": "object",
  "required": ["id", "transactionId", "status", "severity", "summary", "createdAt", "anomalies", "timeline"],
  "properties": {
    "id": {
      "type": "string",
      "description": "Unique identifier for the summary"
    },
    "transactionId": {
      "type": "string",
      "description": "Business transaction identifier"
    },
    "status": {
      "type": "string",
      "enum": ["MATCHED", "MISMATCHED", "MISSING_CBS", "MISSING_GATEWAY"]
    },
    "severity": {
      "type": "string",
      "enum": ["LOW", "MEDIUM", "HIGH"]
    },
    "summary": {
      "type": "string",
      "description": "Human-readable summary"
    },
    "createdAt": {
      "type": "string",
      "format": "date-time"
    },
    "anomalies": {
      "type": "array",
      "items": { "type": "string" }
    },
    "timeline": {
      "type": "object",
      "properties": {
        "processedAt": { "type": ["string", "null"], "format": "date-time" },
        "receivedAt": { "type": ["string", "null"], "format": "date-time" },
        "respondedAt": { "type": ["string", "null"], "format": "date-time" },
        "firstSeenAt": { "type": "string", "format": "date-time" },
        "lastUpdatedAt": { "type": "string", "format": "date-time" }
      }
    }
  }
}
```

### System Metrics Response

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "System Metrics",
  "type": "object",
  "required": ["totalTransactions", "matchedTransactions", "mismatchedTransactions", "missingTransactions", "averageLatency", "systemHealth"],
  "properties": {
    "totalTransactions": { "type": "number", "minimum": 0 },
    "matchedTransactions": { "type": "number", "minimum": 0 },
    "mismatchedTransactions": { "type": "number", "minimum": 0 },
    "missingTransactions": { "type": "number", "minimum": 0 },
    "averageLatency": { "type": "number", "minimum": 0 },
    "systemHealth": {
      "type": "string",
      "enum": ["healthy", "warning", "critical"]
    }
  }
}
```

## Validation Rules

### Common Validation Rules

1. **Transaction ID Consistency**: CBS and Gateway events must have matching `transactionId`
2. **Amount Precision**: All monetary values must be to 2 decimal places
3. **Timestamp Format**: All timestamps must be ISO 8601 format
4. **Required Fields**: All required fields must be present and non-null
5. **Enum Values**: String fields with enums must use valid values only

### Schema Evolution

- **Backward Compatibility**: New optional fields can be added
- **Versioning**: Schema changes require version negotiation
- **Validation**: Strict validation in development, lenient in production
- **Documentation**: Schema changes must update this document

## Implementation Notes

### TypeScript Interfaces

The JSON schemas correspond to these TypeScript interfaces:

```typescript
interface CBSEvent {
  eventId: string;
  transactionId: string;
  source: 'CBS';
  eventType: 'DEBIT' | 'CREDIT';
  // ... other fields
}

interface GatewayEvent {
  eventId: string;
  transactionId: string;
  source: 'GATEWAY';
  // ... other fields
}

interface ReconciliationAlert {
  transactionId: string;
  classification: 'MATCHED' | 'MISMATCHED' | 'MISSING_CBS' | 'MISSING_GATEWAY';
  // ... other fields
}
```

### Testing

- **Unit Tests**: Validate schema compliance for all event types
- **Integration Tests**: End-to-end schema validation
- **Fault Injection**: Test schema handling of malformed data
- **Performance**: Validate schema validation doesn't impact throughput