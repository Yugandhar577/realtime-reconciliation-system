# Demo Script

## Overview

This demo showcases the Realtime Reconciliation System's ability to match financial transactions between Core Banking System (CBS) and Payment Gateway systems. The demo includes normal operations, failure scenarios, and recovery mechanisms.

## Prerequisites

1. **Docker Desktop**: Running and healthy
2. **Node.js**: Version 14+ installed
3. **Browser**: Modern browser for dashboard access

## Demo Setup

### Step 1: Start Infrastructure
```bash
# Start Kafka, Redis, and Zookeeper
docker-compose up -d

# Verify services are running
docker ps
```

### Step 2: Start Reconciliation Engine
```bash
cd reconciliation-engine
npm install
npm start
```

### Step 3: Start Frontend Dashboard
```bash
cd frontend-dashboard
npm install
npm run dev
```

### Step 4: Access Dashboard
- **URL**: http://localhost:8080/
- **API**: http://localhost:3001/api
- **WebSocket**: ws://localhost:8080/

## Demo Scenarios

## Scenario 1: Normal Transaction Flow

### Step-by-Step Demo

1. **Start Producers**
   ```bash
   # Terminal 1: CBS Producer
   cd producers/corebank-producer
   npm install
   npm start

   # Terminal 2: Gateway Producer
   cd producers/gateway-producer
   npm install
   npm start
   ```

2. **Observe Dashboard**
   - Transactions appear in real-time
   - Status shows "MATCHED"
   - Green indicators for successful reconciliation
   - Charts update with throughput metrics

3. **Expected Results**
   - Transactions reconcile within <100ms
   - WebSocket updates push immediately
   - API endpoints return current metrics

## Scenario 2: Amount Mismatch Detection

### Setup Fault Injection

1. **Modify Gateway Producer**
   Edit `producers/gateway-producer/src/producer.js` to inject fault:

   ```javascript
   // Add to transaction object
   transaction.faultConfig = {
     enabled: true,
     type: 'AMOUNT_MISMATCH',
     target: 'GATEWAY'
   };
   ```

2. **Restart Gateway Producer**
   ```bash
   # Stop with Ctrl+C, then restart
   npm start
   ```

3. **Observe Results**
   - Transactions show "MISMATCHED" status
   - Red alerts in dashboard
   - "AMOUNT_MISMATCH" anomaly listed
   - HIGH severity classification

## Scenario 3: Missing Transaction Handling

### Simulate Gateway Failure

1. **Stop Gateway Producer**
   ```bash
   # Press Ctrl+C in gateway producer terminal
   ```

2. **Continue CBS Transactions**
   - CBS producer keeps sending transactions
   - Dashboard shows transactions pending

3. **Wait for Timeout**
   - After 15 seconds: Late arrival warning logged
   - After 60 seconds: Transactions marked "MISSING_GATEWAY"
   - HIGH severity alerts generated

4. **Recovery**
   ```bash
   # Restart gateway producer
   npm start
   ```
   - New transactions reconcile normally
   - Backlog shows historical missing transactions

## Scenario 4: System Recovery

### Simulate Infrastructure Failure

1. **Stop Kafka**
   ```bash
   docker-compose stop kafka zookeeper
   ```

2. **Observe Behavior**
   - Producers show connection errors
   - Engine attempts reconnection
   - Dashboard shows connection status

3. **Restart Kafka**
   ```bash
   docker-compose start kafka zookeeper
   ```

4. **Verify Recovery**
   - Services reconnect automatically
   - State restored from Redis persistence
   - Transactions resume processing

## Scenario 5: High Load Testing

### Generate Burst Traffic

1. **Use Demo Control Scripts**
   ```bash
   cd demo-control/scripts
   node trigger-burst.js
   ```

2. **Monitor Performance**
   - Dashboard shows throughput charts
   - WebSocket handles real-time updates
   - API responds to metrics queries

## Demo Narrative

### Opening Script
"Welcome to the Realtime Reconciliation System demo. This system automatically matches financial transactions between our core banking system and payment gateway in real-time, detecting mismatches and system failures instantly."

### Normal Operations
"Let's start with normal operations. As you can see, transactions are flowing through the system and reconciling perfectly. The dashboard shows real-time updates via WebSocket connections."

### Failure Injection
"Now let's simulate a common issue: amount mismatches. By injecting a fault in the gateway producer, we can see how the system immediately detects and alerts on the discrepancy."

### Timeout Handling
"When systems fail, our timeout scanner ensures we don't wait indefinitely. After 60 seconds, missing transactions are flagged for investigation."

### Recovery Demonstration
"The system is designed for high availability. When infrastructure recovers, the system automatically reconnects and resumes processing with state preserved in Redis."

### Performance Showcase
"Under load, the system maintains sub-second reconciliation times and handles thousands of transactions per minute through our Kafka-based architecture."

## Troubleshooting

### Common Issues

**Dashboard not loading:**
- Check if frontend is running on port 8080
- Verify CORS settings in API server

**No transactions appearing:**
- Verify Kafka is running: `docker ps`
- Check producer logs for connection errors
- Ensure topics exist: `docker exec -it kafka kafka-topics --list --bootstrap-server localhost:9092`

**WebSocket connection failed:**
- Engine must be running on port 8080
- Check firewall settings
- Verify WebSocket server startup logs

**API calls failing:**
- Engine must be running on port 3001
- Check API server logs
- Verify CORS configuration

### Logs to Monitor

**Reconciliation Engine:**
```bash
# View logs
docker-compose logs reconciliation-engine -f
```

**Kafka Topics:**
```bash
# List topics
docker exec -it kafka kafka-topics --list --bootstrap-server localhost:9092

# Consume messages
docker exec -it kafka kafka-console-consumer --topic corebank.transactions --bootstrap-server localhost:9092 --from-beginning
```

**Redis State:**
```bash
# Check persistence
docker exec -it redis redis-cli KEYS "*"
```

## Demo Checklist

- [ ] Infrastructure services running
- [ ] Reconciliation engine started
- [ ] Frontend dashboard accessible
- [ ] Producers generating transactions
- [ ] Normal reconciliation working
- [ ] Fault injection tested
- [ ] Timeout scenarios demonstrated
- [ ] Recovery mechanisms shown
- [ ] Performance under load verified
- [ ] All participants can access dashboard

## Key Takeaways

1. **Real-time Processing**: Sub-second reconciliation with WebSocket updates
2. **Fault Detection**: Comprehensive mismatch classification and alerting
3. **High Availability**: Automatic recovery with state persistence
4. **Scalability**: Kafka-based architecture handles high throughput
5. **Observability**: Rich dashboard with metrics and real-time monitoring