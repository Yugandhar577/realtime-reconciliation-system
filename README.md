# Realtime Reconciliation System

A comprehensive real-time transaction reconciliation system that processes and matches transactions between Core Banking System (CBS) and Payment Gateway in real-time using Apache Kafka, Redis, and WebSocket technologies.

## Features

- **Real-time Transaction Processing**: Processes transactions from CBS and Gateway producers
- **Automatic Reconciliation**: Matches transactions with configurable timeout handling
- **Real-time Dashboard**: React-based frontend with live updates via WebSocket
- **Fault Injection**: Configurable fault scenarios for testing
- **Alert System**: Real-time alerts for mismatches and anomalies
- **State Persistence**: Redis-based state management with periodic snapshots
- **Docker Containerization**: Complete containerized deployment

## Architecture

The system consists of:

- **Infrastructure**: Apache Kafka (message broker), Redis (state store), Zookeeper
- **Producers**: Corebank Producer and Gateway Producer (simulate transaction sources)
- **Reconciliation Engine**: Main processing engine with Kafka consumers, state management, and WebSocket server
- **Frontend Dashboard**: React application with real-time visualization
- **Demo Control**: Scripts for triggering fault scenarios and bursts

## Quick Start

### Prerequisites

- Docker and Docker Compose
- At least 4GB RAM available for containers
- Ports 3000, 3001, 8080, 9092, 6379 available

### Start the System

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd realtime-reconciliation-system
   ```

2. **Start all services with Docker Compose**
   ```bash
   docker-compose up -d
   ```

   On Windows PowerShell, you can run a full reset + startup (including volume cleanup) with one command:
   ```powershell
   .\scripts\start-reset.ps1
   ```

   This will start:
   - Zookeeper (Kafka dependency)
   - Kafka message broker
   - Redis database
   - Reconciliation Engine (API + WebSocket server)
   - Corebank Producer (simulates CBS transactions)
   - Gateway Producer (simulates Gateway transactions)
   - Frontend Dashboard (React app)

3. **Wait for services to be healthy** (usually 30-60 seconds)
   ```bash
   docker-compose ps
   ```

4. **Access the dashboard**
   - Open http://localhost:3000 in your browser
   - The system will automatically start processing transactions

### API Endpoints

- **Health Check**: `GET http://localhost:3001/api/health`
- **Recent Transactions**: `GET http://localhost:3001/api/transactions/recent`
- **System Metrics**: `GET http://localhost:3001/api/metrics`
- **Fault Injection**: `POST http://localhost:3001/api/faults`

### Demo Scripts

Use the demo control scripts to test different scenarios:

```bash
# Trigger a burst of transactions
node demo-control/scripts/trigger-burst.js

# Introduce artificial delays
node demo-control/scripts/trigger-delay.js

# Simulate message drops
node demo-control/scripts/trigger-drop.js
```

## Development

### Local Development Setup

If you want to develop locally without Docker:

1. **Start infrastructure services**
   ```bash
   docker-compose up -d zookeeper kafka redis
   ```

2. **Install dependencies for each service**
   ```bash
   # Reconciliation Engine
   cd reconciliation-engine
   npm install

   # Frontend Dashboard
   cd ../frontend-dashboard
   npm install

   # Producers
   cd ../producers/corebank-producer
   npm install

   cd ../gateway-producer
   npm install
   ```

3. **Start services individually**
   ```bash
   # Terminal 1: Reconciliation Engine
   cd reconciliation-engine
   npm start

   # Terminal 2: Frontend Dashboard
   cd frontend-dashboard
   npm run dev

   # Terminal 3: Corebank Producer
   cd producers/corebank-producer
   npm start

   # Terminal 4: Gateway Producer
   cd producers/gateway-producer
   npm start
   ```

### Environment Variables

Key environment variables (automatically set in Docker):

- `KAFKA_BROKERS`: Kafka broker addresses (default: `kafka:29092`)
- `REDIS_HOST`: Redis host (default: `redis`)
- `REDIS_PORT`: Redis port (default: `6379`)
- `API_PORT`: API server port (default: `3001`)
- `WEBSOCKET_PORT`: WebSocket server port (default: `8080`)

## Monitoring and Troubleshooting

### Check Service Health

```bash
# View all services
docker-compose ps

# Check logs
docker-compose logs reconciliation-engine
docker-compose logs frontend-dashboard

# Test API
curl http://localhost:3001/api/health
```

### Common Issues

1. **Port conflicts**: Ensure ports 3000, 3001, 8080, 9092, 6379 are available
2. **Memory issues**: Ensure at least 4GB RAM is available
3. **Slow startup**: Kafka and Zookeeper take time to initialize
4. **Kafka cluster ID conflicts**: If you see `InconsistentClusterIdException`, clean up volumes:
   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

### Reset the System

```bash
# Stop and remove all containers and volumes
docker-compose down -v

# Restart fresh
docker-compose up -d
```

Windows one-command reset + startup:

```powershell
.\scripts\start-reset.ps1
```

## Project Structure

```
├── docker-compose.yml          # Complete container orchestration
├── reconciliation-engine/      # Main processing engine
│   ├── src/
│   │   ├── index.js           # Main orchestrator
│   │   ├── consumers/         # Kafka consumers
│   │   ├── alerts/            # API and WebSocket servers
│   │   ├── reconciliation/    # Core reconciliation logic
│   │   └── persistence/       # Redis and snapshot handling
├── frontend-dashboard/        # React dashboard
│   ├── src/
│   │   ├── components/        # UI components
│   │   ├── pages/            # Dashboard pages
│   │   └── services/         # API and WebSocket clients
├── producers/                 # Transaction producers
│   ├── corebank-producer/
│   └── gateway-producer/
├── demo-control/              # Demo scripts and controls
└── docs/                      # Documentation
```

## Technology Stack

- **Backend**: Node.js, Express.js
- **Message Broker**: Apache Kafka
- **Database**: Redis
- **Frontend**: React, TypeScript, Vite
- **Real-time**: WebSocket
- **Containerization**: Docker, Docker Compose
- **UI Components**: Radix UI, Tailwind CSS

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `docker-compose up -d`
5. Submit a pull request

## License

See LICENSE file for details.