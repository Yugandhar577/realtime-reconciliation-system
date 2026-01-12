# Reconciliation Engine

The core component of the Realtime Reconciliation System, responsible for processing transaction events, performing reconciliation logic, and emitting results.

## Overview

The reconciliation engine is a Node.js application that:

- Consumes transaction events from Kafka topics
- Maintains transaction state in memory with Redis persistence
- Applies business rules to detect mismatches
- Emits reconciliation results via Kafka and WebSocket
- Provides REST API for dashboard data access

## Architecture

### Components

- **Core Consumer**: Processes CBS transaction events
- **Gateway Consumer**: Processes Payment Gateway transaction events
- **State Store**: In-memory transaction state management
- **Classifier**: Business rules for mismatch detection
- **Reconciler**: Core reconciliation orchestration
- **Timeout Scanner**: Handles missing transaction scenarios
- **API Server**: REST endpoints for frontend
- **WebSocket Emitter**: Real-time updates to dashboard
- **Kafka Producer**: Publishes reconciliation alerts

### Data Flow

```
Kafka Topics → Consumers → State Store → Classifier → Reconciler → Emitters
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `KAFKA_BROKERS` | `localhost:9092` | Kafka broker addresses |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection URL |
| `API_PORT` | `3001` | REST API port |
| `WS_PORT` | `8080` | WebSocket server port |

### Thresholds Configuration

Located in `src/config/thresholds.js`:

```javascript
const AMOUNT_TOLERANCE = 0; // Exact amount matching
const TIME_DRIFT_THRESHOLD_MS = 60000; // 1 minute
const T1_LATE_MS = 15000; // 15 seconds (late warning)
const T2_MISSING_MS = 60000; // 1 minute (missing timeout)
```

## API Endpoints

### GET /api/transactions/recent
Returns recent transactions with pagination.

**Query Parameters:**
- `limit` (number): Maximum transactions to return (default: 50)

### GET /api/transactions/:id
Returns detailed information for a specific transaction.

### GET /api/metrics
Returns system-wide reconciliation metrics.

**Response:**
```json
{
  "totalTransactions": 150,
  "matchedTransactions": 145,
  "mismatchedTransactions": 3,
  "missingTransactions": 2,
  "averageLatency": 85,
  "systemHealth": "healthy"
}
```

### GET /api/transactions/search
Search transactions with filters.

**Query Parameters:**
- `status`: Filter by reconciliation status
- `severity`: Filter by severity level
- `startDate`: ISO date string for start range
- `endDate`: ISO date string for end range
- `limit`: Maximum results (default: 50)

### GET /api/transactions/stats
Returns transaction statistics and activity charts.

## WebSocket Events

### reconciliation-event
Emitted when a transaction reconciliation is completed.

```json
{
  "type": "reconciliation-event",
  "transactionId": "TXN_20231201_001",
  "classification": "MATCHED",
  "severity": "LOW",
  "summary": "Transaction successfully reconciled",
  "anomalies": [],
  "timeline": {
    "firstSeenAt": "2023-12-01T10:30:02.000Z",
    "lastUpdatedAt": "2023-12-01T10:30:15.000Z"
  }
}
```

### stats
System statistics broadcast every 30 seconds.

```json
{
  "type": "stats",
  "data": {
    "activeConnections": 5,
    "timestamp": "2023-12-01T10:30:30.000Z"
  }
}
```

## Reconciliation Logic

### Matching Criteria

1. **Transaction ID**: Must match between CBS and Gateway events
2. **Amount**: Exact match (0 tolerance)
3. **Currency**: Must be INR for both events
4. **Status**: Should be SUCCESS for both events
5. **Timing**: Within acceptable time drift window

### Classification Rules

| Condition | Status | Severity | Action |
|-----------|--------|----------|--------|
| All criteria match | MATCHED | LOW | NONE |
| Amount differs | MISMATCHED | HIGH | IMMEDIATE_INVESTIGATION |
| Currency differs | MISMATCHED | HIGH | BLOCK_AND_INVESTIGATE |
| Status differs | MISMATCHED | MEDIUM | REVIEW_AND_CORRECT |
| Time drift > 1min | MISMATCHED | MEDIUM | MONITOR |
| CBS missing after 1min | MISSING_CBS | HIGH | INVESTIGATE_MISSING |
| Gateway missing after 1min | MISSING_GATEWAY | HIGH | INVESTIGATE_MISSING |

## State Management

### In-Memory Store
- **Purpose**: Fast access to active transaction states
- **Structure**: Map of transactionId → state object
- **Persistence**: Redis snapshots every 30 seconds

### State Object Structure
```javascript
{
  transactionId: "TXN_20231201_001",
  cbsEvent: { /* CBS transaction data */ },
  gatewayEvent: { /* Gateway transaction data */ },
  firstSeenAt: 1701423002000,
  lastUpdatedAt: 1701423015000,
  status: "matched|mismatched|missing_cbs|missing_gateway",
  anomalies: ["AMOUNT_MISMATCH"],
  seenEventIds: Set(["CBS_EVT_123", "GW_EVT_456"]),
  seenSources: Set(["CBS", "GATEWAY"])
}
```

## Timeout Handling

### Late Transaction Detection (T1)
- **Threshold**: 15 seconds
- **Action**: Log warning (no finalization)
- **Purpose**: Alert on potential delays

### Missing Transaction Detection (T2)
- **Threshold**: 60 seconds
- **Action**: Finalize with MISSING status
- **Purpose**: Handle failed or delayed systems

## Kafka Integration

### Topics Consumed
- `corebank.transactions`: CBS transaction events
- `gateway.transactions`: Gateway transaction events

### Topics Produced
- `reconciliation-alerts`: Reconciliation results and alerts

### Consumer Configuration
- **Group ID**: `reconciler-group`
- **Auto Offset Reset**: `earliest`
- **Enable Auto Commit**: `false` (manual commit after processing)

## Redis Persistence

### Snapshot Strategy
- **Frequency**: Every 30 seconds
- **Key**: `recon:snapshot`
- **Content**: Serialized active transaction states
- **Recovery**: Load on startup, merge with existing state

### Data Structure
```json
[
  {
    "txId": "TXN_20231201_001",
    "cbsEvent": { /* event data */ },
    "gatewayEvent": { /* event data */ },
    "firstSeenAt": 1701423002000,
    "lastUpdatedAt": 1701423015000,
    "status": "pending",
    "anomalies": [],
    "seenEventIds": ["CBS_EVT_123", "GW_EVT_456"],
    "seenSources": ["CBS", "GATEWAY"]
  }
]
```

## Monitoring & Observability

### Health Checks
- **Kafka Connectivity**: Consumer group membership
- **Redis Connectivity**: PING/PONG responses
- **WebSocket Server**: Active connections count
- **API Server**: Response times and error rates

### Logging
- **Levels**: ERROR, WARN, INFO, DEBUG
- **Format**: JSON with timestamps and context
- **Destinations**: Console, files (configurable)

### Metrics
- **Transaction Volume**: Per minute/hour rates
- **Reconciliation Success Rate**: Matched vs total
- **Latency**: Average reconciliation time
- **Error Rates**: Failed processing attempts

## Development

### Running Locally

```bash
# Install dependencies
npm install

# Start with development config
npm run dev

# Or start normally
npm start
```

### Testing

```bash
# Run unit tests
npm test

# Run with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

### Debugging

```bash
# Enable debug logging
DEBUG=reconciliation:* npm start

# Debug specific components
DEBUG=reconciliation:consumer npm start
DEBUG=reconciliation:classifier npm start
```

## Deployment

### Docker Configuration

```yaml
reconciliation-engine:
  build: ./reconciliation-engine
  environment:
    - KAFKA_BROKERS=kafka:29092
    - REDIS_URL=redis://redis:6379
  ports:
    - "3001:3001"
    - "8080:8080"
  depends_on:
    - kafka
    - redis
```

### Environment-Specific Configs

- **Development**: Local Kafka/Redis, debug logging
- **Staging**: Remote services, info logging
- **Production**: Clustered services, warn+ logging, monitoring

## Troubleshooting

### Common Issues

**High memory usage:**
- Check for transaction state leaks
- Monitor Redis snapshot sizes
- Review timeout scanner configuration

**Slow reconciliation:**
- Check Kafka consumer lag
- Monitor Redis response times
- Review classifier performance

**WebSocket disconnections:**
- Check network connectivity
- Monitor connection counts
- Review heartbeat configuration

**API timeouts:**
- Check database query performance
- Monitor concurrent request handling
- Review rate limiting settings

### Performance Tuning

- **JVM Heap**: Adjust Node.js memory limits
- **Kafka Consumers**: Increase partition count
- **Redis**: Configure connection pooling
- **WebSocket**: Implement connection limits

## API Reference

### Transaction Object Schema

```typescript
interface TransactionSummary {
  id: string;
  transactionId: string;
  status: 'MATCHED' | 'MISMATCHED' | 'MISSING_CBS' | 'MISSING_GATEWAY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  summary: string;
  createdAt: string;
  anomalies: string[];
  timeline: {
    processedAt?: string;
    receivedAt?: string;
    respondedAt?: string;
    firstSeenAt: string;
    lastUpdatedAt: string;
  };
}
```

### System Metrics Schema

```typescript
interface SystemMetrics {
  totalTransactions: number;
  matchedTransactions: number;
  mismatchedTransactions: number;
  missingTransactions: number;
  averageLatency: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
}
```