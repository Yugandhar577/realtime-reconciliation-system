# Docker Setup

Complete Docker containerization setup for the Realtime Reconciliation System, including Kafka, Redis, and all application services.

## Overview

The Docker setup provides a complete development and testing environment with:

- **Kafka**: Event streaming platform for transaction messages
- **Zookeeper**: Kafka coordination service
- **Redis**: In-memory data store for state persistence
- **Reconciliation Engine**: Core reconciliation processing service
- **Corebank Producer**: CBS transaction simulator
- **Gateway Producer**: Payment gateway simulator
- **Frontend Dashboard**: React-based monitoring interface

## Architecture

### Service Dependencies

```
Frontend Dashboard (Port 8080)
    ↓
Reconciliation Engine (Ports 3001, 8080)
    ↓
Kafka (Port 9092) + Zookeeper (Port 2181)
Redis (Port 6379)
    ↓
Corebank Producer + Gateway Producer
```

### Network Configuration

- **Internal Network**: Services communicate via Docker network
- **External Access**: Key ports exposed to host machine
- **Service Discovery**: Services use container names for communication

## Quick Start

### Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- 4GB RAM available
- 10GB disk space

### Start All Services

```bash
# From project root directory
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Verify Installation

```bash
# Check service health
docker-compose ps

# Test Kafka connectivity
docker-compose exec kafka kafka-topics --list --bootstrap-server localhost:9092

# Test Redis connectivity
docker-compose exec redis redis-cli ping
```

## Service Configuration

### Kafka Configuration

**Image**: `confluentinc/cp-kafka:7.4.0`

**Environment Variables**:
```yaml
KAFKA_BROKER_ID: 1
KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092,PLAINTEXT_INTERNAL://kafka:29092
KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 1
KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 1
```

**Ports**:
- `9092`: External access from host
- `29092`: Internal access from containers

**Topics Created**:
- `corebank.transactions`: CBS transaction events
- `gateway.transactions`: Gateway transaction events
- `reconciliation-alerts`: Reconciliation results

### Zookeeper Configuration

**Image**: `confluentinc/cp-zookeeper:7.4.0`

**Environment Variables**:
```yaml
ZOOKEEPER_CLIENT_PORT: 2181
ZOOKEEPER_TICK_TIME: 2000
```

**Port**: `2181`

### Redis Configuration

**Image**: `redis:7-alpine`

**Port**: `6379`

**Persistence**: In-memory only (development setup)

### Reconciliation Engine

**Build Context**: `./reconciliation-engine`

**Environment Variables**:
```yaml
KAFKA_BROKERS: kafka:29092
REDIS_URL: redis://redis:6379
API_PORT: 3001
WS_PORT: 8080
```

**Ports**:
- `3001`: REST API
- `8080`: WebSocket server

### Corebank Producer

**Build Context**: `./producers/corebank-producer`

**Environment Variables**:
```yaml
KAFKA_BROKERS: kafka:29092
TRANSACTION_RATE: 10
FAULT_INJECTION_ENABLED: false
```

**Port**: `3002` (for fault injection API)

### Gateway Producer

**Build Context**: `./producers/gateway-producer`

**Environment Variables**:
```yaml
KAFKA_BROKERS: kafka:29092
TRANSACTION_RATE: 8
FAULT_INJECTION_ENABLED: false
```

**Port**: `3003` (for fault injection API)

## Development Workflow

### Building Images

```bash
# Build all images
docker-compose build

# Build specific service
docker-compose build reconciliation-engine

# Rebuild without cache
docker-compose build --no-cache
```

### Running Individual Services

```bash
# Start only Kafka and Zookeeper
docker-compose up kafka zookeeper

# Start producers only
docker-compose up corebank-producer gateway-producer

# Start with dependencies
docker-compose up reconciliation-engine
```

### Debugging Services

```bash
# View service logs
docker-compose logs reconciliation-engine

# Follow logs in real-time
docker-compose logs -f reconciliation-engine

# View last 100 lines
docker-compose logs --tail=100 kafka

# Execute commands in running container
docker-compose exec reconciliation-engine sh
docker-compose exec kafka bash
```

### Environment Overrides

Create environment-specific compose files:

```bash
# Development with debug logging
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Production configuration
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up
```

## Kafka Management

### Topic Management

```bash
# List all topics
docker-compose exec kafka kafka-topics --list --bootstrap-server localhost:9092

# Create topic manually
docker-compose exec kafka kafka-topics --create \
  --topic test-topic \
  --bootstrap-server localhost:9092 \
  --partitions 3 \
  --replication-factor 1

# Describe topic
docker-compose exec kafka kafka-topics --describe \
  --topic corebank.transactions \
  --bootstrap-server localhost:9092
```

### Message Inspection

```bash
# Consume messages from topic
docker-compose exec kafka kafka-console-consumer \
  --topic corebank.transactions \
  --bootstrap-server localhost:9092 \
  --from-beginning

# Produce test message
docker-compose exec kafka kafka-console-producer \
  --topic test-topic \
  --bootstrap-server localhost:9092
```

### Consumer Group Management

```bash
# List consumer groups
docker-compose exec kafka kafka-consumer-groups \
  --list --bootstrap-server localhost:9092

# Describe consumer group
docker-compose exec kafka kafka-consumer-groups \
  --describe --group reconciler-group \
  --bootstrap-server localhost:9092
```

## Redis Management

### Data Inspection

```bash
# Connect to Redis CLI
docker-compose exec redis redis-cli

# Inside Redis CLI
127.0.0.1:6379> KEYS *
127.0.0.1:6379> GET recon:snapshot
127.0.0.1:6379> TTL recon:snapshot
```

### Monitoring

```bash
# Redis info
docker-compose exec redis redis-cli INFO

# Memory usage
docker-compose exec redis redis-cli INFO memory
```

## Fault Injection Testing

### Corebank Producer Faults

```bash
# Enable delay injection
curl -X POST http://localhost:3002/fault/delay \
  -H "Content-Type: application/json" \
  -d '{"probability": 0.2, "minDelay": 5000, "maxDelay": 15000}'

# Enable drop injection
curl -X POST http://localhost:3002/fault/drop \
  -H "Content-Type: application/json" \
  -d '{"probability": 0.1}'
```

### Gateway Producer Faults

```bash
# Enable timeout injection
curl -X POST http://localhost:3003/fault/timeout \
  -H "Content-Type: application/json" \
  -d '{"probability": 0.3, "minTimeout": 30000, "maxTimeout": 120000}'

# Enable decline injection
curl -X POST http://localhost:3003/fault/decline \
  -H "Content-Type: application/json" \
  -d '{"probability": 0.15}'
```

## Performance Tuning

### Resource Allocation

```yaml
# docker-compose.yml
services:
  kafka:
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
        reservations:
          memory: 1G
          cpus: '0.5'
```

### Kafka Tuning

```yaml
environment:
  KAFKA_HEAP_OPTS: "-Xmx1g -Xms1g"
  KAFKA_JVM_PERFORMANCE_OPTS: "-server -XX:+UseG1GC -XX:MaxGCPauseMillis=20"
```

### Redis Tuning

```yaml
command: redis-server --maxmemory 512mb --maxmemory-policy allkeys-lru
```

## Troubleshooting

### Common Issues

**Services fail to start:**
```bash
# Check dependencies
docker-compose up zookeeper kafka

# Check logs for errors
docker-compose logs kafka
```

**Kafka connection refused:**
```bash
# Verify Kafka is healthy
docker-compose ps kafka

# Check Kafka logs
docker-compose logs kafka

# Test connectivity
docker-compose exec kafka kafka-broker-api-versions --bootstrap-server localhost:9092
```

**Out of memory errors:**
```bash
# Increase Docker memory limit
# Or reduce service resource usage
docker system prune -a
```

**Port conflicts:**
```bash
# Check port usage
netstat -tulpn | grep :9092

# Change host ports in docker-compose.yml
ports:
  - "9093:9092"  # Changed host port
```

**Slow performance:**
```bash
# Check resource usage
docker stats

# Monitor disk I/O
docker system df

# Clean up unused resources
docker system prune
```

### Health Checks

```bash
# Check all services
docker-compose ps

# Individual service health
docker-compose exec kafka kafka-cluster cluster-id --bootstrap-server localhost:9092
docker-compose exec redis redis-cli ping
```

### Log Analysis

```bash
# Search for errors
docker-compose logs | grep ERROR

# Follow specific service logs
docker-compose logs -f reconciliation-engine | grep -i error

# Export logs for analysis
docker-compose logs > all_logs.txt
```

## Production Deployment

### Security Hardening

```yaml
# Enable authentication
environment:
  KAFKA_SASL_ENABLED_MECHANISMS: PLAIN
  KAFKA_SASL_MECHANISM_INTER_BROKER_PROTOCOL: PLAIN

# SSL/TLS encryption
environment:
  KAFKA_SSL_KEYSTORE_LOCATION: /etc/kafka/ssl/kafka.keystore.jks
  KAFKA_SSL_TRUSTSTORE_LOCATION: /etc/kafka/ssl/kafka.truststore.jks
```

### High Availability

```yaml
# Multiple Kafka brokers
services:
  kafka-1:
    environment:
      KAFKA_BROKER_ID: 1
  kafka-2:
    environment:
      KAFKA_BROKER_ID: 2
  kafka-3:
    environment:
      KAFKA_BROKER_ID: 3
```

### Monitoring

```yaml
# Prometheus metrics
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
```

## Backup and Recovery

### Kafka Data Backup

```bash
# Backup Kafka data
docker run --rm -v kafka_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/kafka-backup.tar.gz -C /data .
```

### Redis Data Backup

```bash
# Redis persistence
services:
  redis:
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
```

### Configuration Backup

```bash
# Backup compose file
cp docker-compose.yml docker-compose.yml.backup

# Backup environment files
cp .env .env.backup
```

## Development Tips

### Hot Reload

For development with hot reload, mount source code:

```yaml
reconciliation-engine:
  build: ./reconciliation-engine
  volumes:
    - ./reconciliation-engine:/app
    - /app/node_modules
  command: npm run dev
```

### IDE Integration

```bash
# VS Code with Docker extension
# Attach to running container
# Debug Node.js applications
```

### Testing in Docker

```bash
# Run tests in container
docker-compose exec reconciliation-engine npm test

# Integration tests
docker-compose exec reconciliation-engine npm run test:integration
```

## API Endpoints

### Reconciliation Engine
- **REST API**: http://localhost:3001
- **WebSocket**: ws://localhost:8080
- **Health**: http://localhost:3001/health

### Producers
- **Corebank**: http://localhost:3002
- **Gateway**: http://localhost:3003

### External Services
- **Kafka**: localhost:9092
- **Redis**: localhost:6379
- **Zookeeper**: localhost:2181

## Resource Requirements

### Minimum Requirements
- **CPU**: 2 cores
- **RAM**: 4GB
- **Disk**: 10GB

### Recommended Requirements
- **CPU**: 4 cores
- **RAM**: 8GB
- **Disk**: 20GB SSD

### Scaling Considerations

- **Kafka**: Add brokers for higher throughput
- **Redis**: Cluster for high availability
- **Application Services**: Horizontal scaling with load balancer