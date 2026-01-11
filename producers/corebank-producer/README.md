# Corebank Producer

A Node.js application that simulates Core Banking System (CBS) transaction events and publishes them to Kafka for reconciliation processing.

## Overview

The Corebank Producer generates realistic banking transaction events that mimic a core banking system's behavior. It includes:

- **Transaction Generation**: Creates debit/credit transactions with realistic data
- **Fault Injection**: Simulates system failures and delays for testing
- **Kafka Publishing**: Publishes events to the `corebank.transactions` topic
- **Configurable Behavior**: Adjustable transaction volumes and failure rates

## Architecture

### Components

- **Producer**: Main application orchestrator
- **Config**: Environment and Kafka configuration
- **Fault Injector**: Simulates system failures and network issues

### Data Flow

```
Transaction Generator → Fault Injector → Kafka Producer → corebank.transactions
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `KAFKA_BROKERS` | `localhost:9092` | Kafka broker addresses |
| `TRANSACTION_RATE` | `10` | Transactions per second |
| `FAULT_INJECTION_ENABLED` | `false` | Enable fault simulation |
| `DELAY_PROBABILITY` | `0.1` | Probability of delayed transactions |
| `DROP_PROBABILITY` | `0.05` | Probability of dropped transactions |
| `BURST_MODE` | `false` | Enable burst transaction mode |

### Transaction Configuration

Transactions are generated with the following characteristics:

- **Amount Range**: ₹100 - ₹100,000
- **Currency**: Always INR
- **Status**: SUCCESS (95%), FAILED (5%)
- **Transaction Types**: DEBIT, CREDIT
- **Account Types**: SAVINGS, CURRENT, LOAN

## Transaction Schema

### CBS Transaction Event

```json
{
  "eventId": "CBS_EVT_20231201_001",
  "transactionId": "TXN_20231201_001",
  "timestamp": "2023-12-01T10:30:02.000Z",
  "source": "CBS",
  "data": {
    "amount": 5000.00,
    "currency": "INR",
    "status": "SUCCESS",
    "transactionType": "DEBIT",
    "accountNumber": "ACC_1234567890",
    "accountType": "SAVINGS",
    "description": "Online transfer to merchant",
    "referenceNumber": "REF_20231201_001",
    "branchCode": "BR001",
    "customerId": "CUST_12345"
  },
  "metadata": {
    "version": "1.0",
    "processedAt": "2023-12-01T10:30:02.000Z",
    "systemId": "CBS_CORE_V2"
  }
}
```

### Field Descriptions

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `eventId` | string | Unique event identifier | Yes |
| `transactionId` | string | Business transaction ID | Yes |
| `timestamp` | ISO string | Event creation timestamp | Yes |
| `source` | string | Always "CBS" | Yes |
| `data.amount` | number | Transaction amount | Yes |
| `data.currency` | string | Currency code (INR) | Yes |
| `data.status` | string | SUCCESS/FAILED | Yes |
| `data.transactionType` | string | DEBIT/CREDIT | Yes |
| `data.accountNumber` | string | Masked account number | Yes |
| `data.accountType` | string | Account type | Yes |
| `data.description` | string | Transaction description | No |
| `data.referenceNumber` | string | System reference | Yes |
| `data.branchCode` | string | Branch identifier | No |
| `data.customerId` | string | Customer identifier | No |

## Fault Injection

### Available Fault Types

1. **Delay Injection**
   - **Purpose**: Simulate network latency or processing delays
   - **Configuration**: `DELAY_PROBABILITY`, `DELAY_MIN_MS`, `DELAY_MAX_MS`
   - **Effect**: Transactions are published with artificial delay

2. **Drop Injection**
   - **Purpose**: Simulate message loss or system failures
   - **Configuration**: `DROP_PROBABILITY`
   - **Effect**: Transactions are silently discarded

3. **Burst Mode**
   - **Purpose**: Simulate traffic spikes
   - **Configuration**: `BURST_MODE`, `BURST_MULTIPLIER`
   - **Effect**: Temporary increase in transaction rate

4. **Status Corruption**
   - **Purpose**: Simulate data corruption or processing errors
   - **Configuration**: `STATUS_CORRUPTION_PROBABILITY`
   - **Effect**: Random status changes (SUCCESS → FAILED)

### Fault Injection API

The producer exposes an HTTP API for runtime fault control:

```bash
# Enable delay injection
curl -X POST http://localhost:3002/fault/delay \
  -H "Content-Type: application/json" \
  -d '{"probability": 0.2, "minDelay": 5000, "maxDelay": 15000}'

# Enable drop injection
curl -X POST http://localhost:3002/fault/drop \
  -H "Content-Type: application/json" \
  -d '{"probability": 0.1}'

# Trigger burst mode
curl -X POST http://localhost:3002/fault/burst \
  -H "Content-Type: application/json" \
  -d '{"duration": 30000, "multiplier": 5}'

# Reset all faults
curl -X POST http://localhost:3002/fault/reset
```

## Kafka Integration

### Producer Configuration

```javascript
const producer = kafka.producer({
  'metadata.broker.list': process.env.KAFKA_BROKERS,
  'compression.codec': 'snappy',
  'batch.num.messages': 1000,
  'queue.buffering.max.ms': 100,
  'acks': 'all'
});
```

### Topic Details

- **Topic**: `corebank.transactions`
- **Partitions**: 3 (configurable)
- **Replication Factor**: 1 (development), 3 (production)
- **Retention**: 7 days
- **Key**: `transactionId` (for partitioning)

### Message Delivery

- **Guarantees**: At-least-once delivery
- **Idempotency**: Enabled via eventId deduplication
- **Error Handling**: Retry with exponential backoff

## Development

### Running Locally

```bash
# Install dependencies
npm install

# Start with default configuration
npm start

# Start with fault injection enabled
FAULT_INJECTION_ENABLED=true npm start

# Start with custom transaction rate
TRANSACTION_RATE=50 npm start
```

### Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Test with Kafka
npm run test:kafka
```

### Docker Development

```bash
# Build image
docker build -t corebank-producer .

# Run with local Kafka
docker run --network host \
  -e KAFKA_BROKERS=localhost:9092 \
  corebank-producer
```

## Monitoring & Observability

### Metrics

The producer exposes metrics via HTTP endpoint:

```bash
# Get current metrics
curl http://localhost:3002/metrics
```

**Response:**
```json
{
  "transactionsGenerated": 15420,
  "transactionsPublished": 15385,
  "faultsInjected": {
    "delays": 154,
    "drops": 35,
    "corruptions": 12
  },
  "kafkaMetrics": {
    "messagesSent": 15385,
    "errors": 0,
    "latency": 45
  },
  "uptime": "2h 15m 30s"
}
```

### Logging

- **Levels**: ERROR, WARN, INFO, DEBUG
- **Format**: JSON with structured fields
- **Destinations**: Console, files

### Health Checks

```bash
# Health endpoint
curl http://localhost:3002/health

# Response
{
  "status": "healthy",
  "kafka": "connected",
  "lastTransaction": "2023-12-01T10:30:02.000Z"
}
```

## Deployment

### Docker Configuration

```yaml
corebank-producer:
  build: ./producers/corebank-producer
  environment:
    - KAFKA_BROKERS=kafka:29092
    - TRANSACTION_RATE=20
    - FAULT_INJECTION_ENABLED=false
  ports:
    - "3002:3002"
  depends_on:
    - kafka
  restart: unless-stopped
```

### Environment-Specific Configs

- **Development**: Local Kafka, fault injection enabled, debug logging
- **Staging**: Remote Kafka, fault injection disabled, info logging
- **Production**: Production Kafka, monitoring enabled, warn+ logging

## Troubleshooting

### Common Issues

**Kafka connection fails:**
- Verify Kafka brokers are accessible
- Check network connectivity
- Validate broker addresses

**High memory usage:**
- Monitor transaction generation rate
- Check for message backlogs
- Review fault injection settings

**Message publishing errors:**
- Check topic existence and permissions
- Verify message format compliance
- Monitor broker disk space

**Fault injection not working:**
- Verify FAULT_INJECTION_ENABLED=true
- Check probability values (0.0-1.0)
- Review API endpoint responses

### Performance Tuning

- **Transaction Rate**: Adjust based on system capacity
- **Batch Size**: Increase for higher throughput
- **Compression**: Enable for large message volumes
- **Partitioning**: Scale partitions for parallel processing

## API Reference

### HTTP Endpoints

#### GET /health
Returns producer health status.

#### GET /metrics
Returns detailed metrics and statistics.

#### POST /fault/delay
Configure delay fault injection.

**Request Body:**
```json
{
  "probability": 0.2,
  "minDelay": 1000,
  "maxDelay": 10000
}
```

#### POST /fault/drop
Configure drop fault injection.

**Request Body:**
```json
{
  "probability": 0.1
}
```

#### POST /fault/burst
Trigger burst mode.

**Request Body:**
```json
{
  "duration": 30000,
  "multiplier": 3
}
```

#### POST /fault/reset
Reset all fault injections.

### Configuration Schema

```typescript
interface ProducerConfig {
  kafkaBrokers: string;
  transactionRate: number;
  faultInjection: {
    enabled: boolean;
    delay: {
      probability: number;
      minDelay: number;
      maxDelay: number;
    };
    drop: {
      probability: number;
    };
    burst: {
      multiplier: number;
    };
  };
}
```

## Integration Testing

### With Reconciliation Engine

```bash
# Start producer with test data
npm run test:integration

# Verify messages in Kafka
kafka-console-consumer --bootstrap-server localhost:9092 \
  --topic corebank.transactions \
  --from-beginning
```

### Fault Injection Testing

```bash
# Test delay injection
curl -X POST http://localhost:3002/fault/delay \
  -d '{"probability": 1.0, "minDelay": 5000}'

# Monitor reconciliation timeouts
# Check reconciliation-engine logs for timeout alerts
```

## Security Considerations

- **Message Encryption**: Enable SSL/TLS for Kafka connections
- **Authentication**: Use SASL for broker authentication
- **Input Validation**: Validate all configuration inputs
- **Rate Limiting**: Implement API rate limiting for fault injection endpoints