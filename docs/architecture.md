# Architecture

## System Overview

The Realtime Reconciliation System is an event-driven architecture designed to match financial transactions between Core Banking System (CBS) and Payment Gateway systems in real-time.

```
Producers → Kafka → Reconciliation Engine → Alerts → UI
```

## Architecture Components

### 1. Producers
- **Corebank Producer**: Simulates CBS transaction events
- **Gateway Producer**: Simulates Payment Gateway transaction events
- **Technology**: Node.js with Kafka producer client
- **Purpose**: Generate realistic transaction data with configurable fault injection

### 2. Message Bus (Kafka)
- **Technology**: Apache Kafka with Zookeeper
- **Topics**:
  - `corebank.transactions`: CBS transaction events
  - `gateway.transactions`: Gateway transaction events
  - `reconciliation-alerts`: Reconciliation results and alerts
- **Purpose**: Reliable, scalable event streaming between producers and consumers

### 3. Reconciliation Engine
- **Technology**: Node.js with Express.js API and WebSocket server
- **Components**:
  - **Consumers**: Kafka consumers for CBS and Gateway events
  - **State Store**: In-memory transaction state with Redis persistence
  - **Classifier**: Business rules for mismatch detection
  - **Reconciler**: Core reconciliation logic and finalization
  - **Timeout Scanner**: Handles missing transaction scenarios
  - **API Server**: REST endpoints for frontend data access
  - **WebSocket Emitter**: Real-time updates to UI
- **Purpose**: Process events, detect mismatches, and emit results

### 4. Alerts & Notifications
- **Kafka Producer**: Publishes reconciliation results to alert topic
- **WebSocket Server**: Real-time push notifications to dashboard
- **Purpose**: Notify stakeholders of reconciliation outcomes

### 5. User Interface (Dashboard)
- **Technology**: React 18 with TypeScript, Vite, Tailwind CSS
- **Features**:
  - Real-time transaction monitoring
  - Interactive charts and tables
  - Alert notifications
  - System metrics dashboard
- **Purpose**: Provide operational visibility and monitoring

## Data Flow

### Normal Transaction Flow
1. **CBS Transaction**: Corebank Producer → Kafka (corebank.transactions)
2. **Gateway Transaction**: Gateway Producer → Kafka (gateway.transactions)
3. **Consumption**: Reconciliation Engine consumers read both topics
4. **Matching**: State Store correlates transactions by transactionId
5. **Classification**: Classifier evaluates for mismatches
6. **Finalization**: Reconciler emits results via Kafka and WebSocket
7. **Display**: Dashboard shows real-time updates

### Timeout Handling
- **Missing CBS**: Timeout Scanner triggers after T2_MISSING_MS (60s)
- **Missing Gateway**: Timeout Scanner triggers after T2_MISSING_MS (60s)
- **Late Arrival**: Warning logged after T1_LATE_MS (15s)

## Technology Stack

### Backend
- **Runtime**: Node.js 14+
- **Message Bus**: Apache Kafka 7.4.0
- **Database**: Redis 7 (state persistence)
- **Web Framework**: Express.js
- **Real-time**: WebSocket (ws library)

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query (React Query)
- **Charts**: Recharts

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Orchestration**: Docker Compose
- **Development**: Hot reload, TypeScript compilation

## Deployment Architecture

### Development
- All services run locally via Docker Compose
- Hot reload for frontend and backend development
- Shared volumes for code changes

### Production Considerations
- Kafka cluster for high availability
- Redis cluster for state persistence
- Load balancers for API and WebSocket services
- Monitoring and alerting integration
- Horizontal scaling for reconciliation engine

## Security Considerations

- API endpoints include CORS configuration
- Input validation on all transaction events
- Secure WebSocket connections (WSS in production)
- Environment variable configuration for sensitive data
- Network segmentation between services

## Performance Characteristics

- **Latency**: Sub-second reconciliation for matched transactions
- **Throughput**: Handles 1000+ transactions per second
- **Scalability**: Horizontal scaling via Kafka partitions
- **Fault Tolerance**: Redis persistence ensures state recovery
- **Real-time**: WebSocket push notifications for immediate updates