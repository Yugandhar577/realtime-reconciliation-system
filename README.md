# Realtime Reconciliation System

A real-time transaction reconciliation system that matches transactions between Core Banking System (CBS) and Payment Gateway systems using event-driven architecture.

## Architecture

- **Event Streaming**: Kafka for real-time message processing
- **State Management**: In-memory store with Redis persistence
- **Real-time UI**: WebSocket for live updates, REST API for data
- **Fault Injection**: Configurable fault scenarios for testing
- **Docker**: Containerized deployment

## Components

- `producers/`: Kafka producers for CBS and Gateway transactions
- `reconciliation-engine/`: Core reconciliation logic with consumers, classifiers, and emitters
- `frontend-dashboard/`: React dashboard for monitoring
- `demo-control/`: Scripts for triggering test scenarios

## Prerequisites

- Docker and Docker Compose
- Node.js 14+ and npm

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd realtime-reconciliation-system
   ```

2. **Start infrastructure**
   ```bash
   docker-compose up -d
   ```

3. **Install dependencies**
   ```bash
   # Reconciliation Engine
   cd reconciliation-engine
   npm install

   # Frontend
   cd ../frontend-dashboard
   npm install

   # Producers (if running locally)
   cd ../producers/corebank-producer
   npm install
   cd ../gateway-producer
   npm install
   ```

4. **Start services**
   ```bash
   # Terminal 1: Reconciliation Engine
   cd reconciliation-engine
   npm start

   # Terminal 2: Frontend
   cd frontend-dashboard
   npm run dev

   # Terminal 3: Producers (optional, for testing)
   cd producers/corebank-producer
   npm start
   ```

5. **Access the dashboard**
   - Frontend: http://localhost:3000/
   - API: http://localhost:3001/api
   - WebSocket: ws://localhost:8080

## Configuration

- Kafka brokers: `localhost:9092` (Docker) or `kafka:29092` (internal)
- Redis: `localhost:6379` (Docker) or `redis:6379` (internal)
- API Port: 3001
- WebSocket Port: 8080
- Frontend Port: 3000

## Development

- Use `docker-compose logs` to monitor services
- Frontend hot-reload with `npm run dev`
- Producers support fault injection via transaction config