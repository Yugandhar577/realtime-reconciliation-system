# Gateway Producer

A Node.js application that simulates Payment Gateway transaction events and publishes them to Kafka for reconciliation processing.

## Overview

The Gateway Producer generates realistic payment gateway transaction events that mimic payment processor behavior. It includes:

- **Transaction Simulation**: Creates payment transactions with gateway-specific data
- **Fault Injection**: Simulates gateway failures, timeouts, and processing errors
- **Kafka Publishing**: Publishes events to the `gateway.transactions` topic
- **Realistic Scenarios**: Models various payment methods and failure modes

## Architecture

### Components

- **Producer**: Main application orchestrator
- **Config**: Environment and Kafka configuration
- **Fault Injector**: Simulates gateway failures and network issues

### Data Flow

```
Payment Generator → Fault Injector → Kafka Producer → gateway.transactions
```

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `KAFKA_BROKERS` | `localhost:9092` | Kafka broker addresses |
| `TRANSACTION_RATE` | `8` | Transactions per second |
| `FAULT_INJECTION_ENABLED` | `false` | Enable fault simulation |
| `TIMEOUT_PROBABILITY` | `0.15` | Probability of gateway timeouts |
| `DECLINE_PROBABILITY` | `0.08` | Probability of payment declines |
| `BURST_MODE` | `false` | Enable burst transaction mode |

### Transaction Configuration

Transactions are generated with the following characteristics:

- **Amount Range**: ₹50 - ₹50,000
- **Currency**: Always INR
- **Payment Methods**: CARD, UPI, NET_BANKING, WALLET
- **Status Distribution**: SUCCESS (85%), FAILED (10%), PENDING (3%), DECLINED (2%)

## Transaction Schema

### Gateway Transaction Event

```json
{
  "eventId": "GW_EVT_20231201_001",
  "transactionId": "TXN_20231201_001",
  "timestamp": "2023-12-01T10:30:05.000Z",
  "source": "GATEWAY",
  "data": {
    "amount": 5000.00,
    "currency": "INR",
    "status": "SUCCESS",
    "paymentMethod": "CARD",
    "cardType": "CREDIT",
    "merchantId": "MERCH_12345",
    "terminalId": "TERM_001",
    "authCode": "AUTH_123456",
    "rrn": "RRN_7890123456",
    "description": "Online purchase at merchant",
    "customerEmail": "customer@example.com",
    "gatewayReference": "GW_REF_20231201_001"
  },
  "metadata": {
    "version": "1.0",
    "processedAt": "2023-12-01T10:30:05.000Z",
    "gatewayId": "PAYMENT_GW_V3",
    "processingTimeMs": 1250
  }
}
```

### Field Descriptions

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `eventId` | string | Unique event identifier | Yes |
| `transactionId` | string | Business transaction ID | Yes |
| `timestamp` | ISO string | Event creation timestamp | Yes |
| `source` | string | Always "GATEWAY" | Yes |
| `data.amount` | number | Transaction amount | Yes |
| `data.currency` | string | Currency code (INR) | Yes |
| `data.status` | string | SUCCESS/FAILED/PENDING/DECLINED | Yes |
| `data.paymentMethod` | string | CARD/UPI/NET_BANKING/WALLET | Yes |
| `data.cardType` | string | CREDIT/DEBIT (for card payments) | No |
| `data.merchantId` | string | Merchant identifier | Yes |
| `data.terminalId` | string | Terminal/POS identifier | No |
| `data.authCode` | string | Authorization code | No |
| `data.rrn` | string | Retrieval Reference Number | No |
| `data.description` | string | Transaction description | No |
| `data.customerEmail` | string | Customer email | No |
| `data.gatewayReference` | string | Gateway internal reference | Yes |

## Fault Injection

### Available Fault Types

1. **Timeout Injection**
   - **Purpose**: Simulate gateway processing timeouts
   - **Configuration**: `TIMEOUT_PROBABILITY`, `TIMEOUT_MIN_MS`, `TIMEOUT_MAX_MS`
   - **Effect**: Transactions delayed beyond reconciliation window

2. **Decline Injection**
   - **Purpose**: Simulate payment authorization failures
   - **Configuration**: `DECLINE_PROBABILITY`
   - **Effect**: Transactions marked as DECLINED

3. **Status Corruption**
   - **Purpose**: Simulate gateway response errors
   - **Configuration**: `STATUS_CORRUPTION_PROBABILITY`
   - **Effect**: Random status changes

4. **Network Failure**
   - **Purpose**: Simulate connectivity issues
   - **Configuration**: `NETWORK_FAILURE_PROBABILITY`
   - **Effect**: Transactions dropped or severely delayed

### Fault Injection API

The producer exposes an HTTP API for runtime fault control:

```bash
# Enable timeout injection
curl -X POST http://localhost:3003/fault/timeout \
  -H "Content-Type: application/json" \
  -d '{"probability": 0.3, "minTimeout": 30000, "maxTimeout": 120000}'

# Enable decline injection
curl -X POST http://localhost:3003/fault/decline \
  -H "Content-Type: application/json" \
  -d '{"probability": 0.15}'

# Trigger network failure
curl -X POST http://localhost:3003/fault/network \
  -H "Content-Type: application/json" \
  -d '{"probability": 0.2, "duration": 60000}'

# Reset all faults
curl -X POST http://localhost:3003/fault/reset
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

- **Topic**: `gateway.transactions`
- **Partitions**: 3 (configurable)
- **Replication Factor**: 1 (development), 3 (production)
- **Retention**: 7 days
- **Key**: `transactionId` (for partitioning)

### Message Delivery

- **Guarantees**: At-least-once delivery
- **Idempotency**: Enabled via eventId deduplication
- **Error Handling**: Retry with exponential backoff

## Payment Method Distribution

The producer simulates realistic payment method usage patterns:

| Payment Method | Percentage | Typical Amount Range |
|----------------|------------|---------------------|
| CARD | 60% | ₹100 - ₹50,000 |
| UPI | 25% | ₹50 - ₹10,000 |
| NET_BANKING | 10% | ₹500 - ₹1,00,000 |
| WALLET | 5% | ₹50 - ₹5,000 |

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
TRANSACTION_RATE=30 npm start
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
docker build -t gateway-producer .

# Run with local Kafka
docker run --network host \
  -e KAFKA_BROKERS=localhost:9092 \
  gateway-producer
```

## Monitoring & Observability

### Metrics

The producer exposes metrics via HTTP endpoint:

```bash
# Get current metrics
curl http://localhost:3003/metrics
```

**Response:**
```json
{
  "transactionsGenerated": 12840,
  "transactionsPublished": 12805,
  "paymentMethods": {
    "CARD": 7680,
    "UPI": 3200,
    "NET_BANKING": 1280,
    "WALLET": 640
  },
  "faultsInjected": {
    "timeouts": 192,
    "declines": 102,
    "networkFailures": 51
  },
  "kafkaMetrics": {
    "messagesSent": 12805,
    "errors": 0,
    "latency": 52
  },
  "uptime": "1h 45m 12s"
}
```

### Logging

- **Levels**: ERROR, WARN, INFO, DEBUG
- **Format**: JSON with structured fields
- **Destinations**: Console, files

### Health Checks

```bash
# Health endpoint
curl http://localhost:3003/health

# Response
{
  "status": "healthy",
  "kafka": "connected",
  "lastTransaction": "2023-12-01T10:30:05.000Z"
}
```

## Deployment

### Docker Configuration

```yaml
gateway-producer:
  build: ./producers/gateway-producer
  environment:
    - KAFKA_BROKERS=kafka:29092
    - TRANSACTION_RATE=15
    - FAULT_INJECTION_ENABLED=false
  ports:
    - "3003:3003"
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

**High latency:**
- Monitor gateway processing time simulation
- Check fault injection settings
- Review transaction rate vs system capacity

**Message publishing errors:**
- Check topic existence and permissions
- Verify message format compliance
- Monitor broker disk space

**Fault injection not working:**
- Verify FAULT_INJECTION_ENABLED=true
- Check probability values (0.0-1.0)
- Review API endpoint responses

### Performance Tuning

- **Transaction Rate**: Adjust based on reconciliation capacity
- **Batch Size**: Increase for higher throughput
- **Compression**: Enable for large message volumes
- **Partitioning**: Scale partitions for parallel processing

## API Reference

### HTTP Endpoints

#### GET /health
Returns producer health status.

#### GET /metrics
Returns detailed metrics and statistics.

#### POST /fault/timeout
Configure timeout fault injection.

**Request Body:**
```json
{
  "probability": 0.2,
  "minTimeout": 15000,
  "maxTimeout": 60000
}
```

#### POST /fault/decline
Configure decline fault injection.

**Request Body:**
```json
{
  "probability": 0.1
}
```

#### POST /fault/network
Configure network failure injection.

**Request Body:**
```json
{
  "probability": 0.15,
  "duration": 30000
}
```

#### POST /fault/reset
Reset all fault injections.

### Configuration Schema

```typescript
interface GatewayProducerConfig {
  kafkaBrokers: string;
  transactionRate: number;
  faultInjection: {
    enabled: boolean;
    timeout: {
      probability: number;
      minTimeout: number;
      maxTimeout: number;
    };
    decline: {
      probability: number;
    };
    network: {
      probability: number;
      duration: number;
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
  --topic gateway.transactions \
  --from-beginning
```

### Fault Injection Testing

```bash
# Test timeout injection
curl -X POST http://localhost:3003/fault/timeout \
  -d '{"probability": 1.0, "minTimeout": 65000}'

# Monitor reconciliation timeouts
# Check reconciliation-engine logs for MISSING alerts
```

## Security Considerations

- **Message Encryption**: Enable SSL/TLS for Kafka connections
- **Authentication**: Use SASL for broker authentication
- **Input Validation**: Validate all configuration inputs
- **Rate Limiting**: Implement API rate limiting for fault injection endpoints
- **Data Masking**: Ensure sensitive payment data is properly masked

## Reconciliation Scenarios

### Successful Reconciliation
- CBS and Gateway amounts match
- Statuses are both SUCCESS
- Timestamps within acceptable drift
- Result: MATCHED classification

### Amount Mismatch
- CBS: ₹5000, Gateway: ₹4950
- Both SUCCESS status
- Result: MISMATCHED (HIGH severity)

### Status Mismatch
- CBS: SUCCESS, Gateway: DECLINED
- Result: MISMATCHED (HIGH severity)

### Missing Gateway Transaction
- CBS transaction exists
- Gateway transaction delayed >60 seconds
- Result: MISSING_GATEWAY classification

### Timeout Scenarios
- Transactions not reconciled within time windows
- Automatic finalization with MISSING status
- Alert generation for investigation