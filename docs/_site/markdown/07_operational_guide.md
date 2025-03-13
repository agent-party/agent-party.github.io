# Operational Guide

This document provides guidance for deploying, monitoring, and maintaining the Agent Party system in production environments.

## Deployment Architecture

### Infrastructure Components

The Agent Party system consists of the following core infrastructure components:

```
┌─────────────────────────────────────────────────────────────┐
│                      Load Balancer                          │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                       API Services                          │
└──────┬─────────────────────┬──────────────────────┬─────────┘
       │                     │                      │
┌──────▼──────┐     ┌────────▼────────┐     ┌──────▼──────┐
│   Neo4j     │     │     Kafka       │     │   Redis     │
│  Database   │     │   Event Bus     │     │   Cache     │
└──────┬──────┘     └────────┬────────┘     └──────┬──────┘
       │                     │                     │
┌──────▼──────┐     ┌────────▼────────┐     ┌──────▼──────┐
│  MinIO      │     │  Prometheus/    │     │  Logging    │
│  Storage    │     │   Grafana       │     │  Service    │
└─────────────┘     └─────────────────┘     └─────────────┘
```

### Kubernetes Deployment

The production environment is deployed using Kubernetes for orchestration:

```yaml
# Sample Kubernetes deployment for API service
apiVersion: apps/v1
kind: Deployment
metadata:
  name: agent-party-api
  labels:
    app: agent-party
    component: api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: agent-party
      component: api
  template:
    metadata:
      labels:
        app: agent-party
        component: api
    spec:
      containers:
      - name: api
        image: agent-party/api:latest
        ports:
        - containerPort: 8000
        env:
        - name: NEO4J_URI
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: uri
        - name: KAFKA_BOOTSTRAP_SERVERS
          value: "kafka-service:9092"
        resources:
          limits:
            cpu: "1"
            memory: "1Gi"
          requests:
            cpu: "0.5"
            memory: "512Mi"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Container Images

Container images are built using multi-stage Dockerfiles for efficiency:

```dockerfile
# Build stage
FROM python:3.10-slim AS builder

WORKDIR /app
COPY requirements.txt .
RUN pip wheel --no-cache-dir --wheel-dir /app/wheels -r requirements.txt

# Runtime stage
FROM python:3.10-slim

WORKDIR /app

# Copy wheels from builder stage
COPY --from=builder /app/wheels /app/wheels
COPY --from=builder /app/requirements.txt .

# Install dependencies
RUN pip install --no-cache /app/wheels/*

# Copy application code
COPY src/ /app/src/
COPY alembic/ /app/alembic/
COPY alembic.ini /app/

# Set up non-root user
RUN useradd -m agent-party
USER agent-party

EXPOSE 8000

CMD ["python", "-m", "src.agent_party"]
```

## Database Operations

### Neo4j Management

#### Database Initialization

```bash
# Initialize Neo4j with constraints and indexes
neo4j-admin load --from=backup/initial_schema.dump --database=neo4j --force

# Apply additional constraints via Cypher
cat schema/constraints.cypher | cypher-shell -u neo4j -p $NEO4J_PASSWORD
```

#### Indexing Strategy

Critical indexes for performance optimization:

```cypher
// Agent indexes
CREATE INDEX agent_id_index FOR (a:Agent) ON (a.id);
CREATE INDEX agent_status_index FOR (a:Agent) ON (a.status);

// Capability indexes
CREATE INDEX capability_name_index FOR (c:Capability) ON (c.name);
CREATE INDEX capability_category_index FOR (c:Capability) ON (c.category);

// Team indexes
CREATE INDEX team_id_index FOR (t:Team) ON (t.id);
CREATE INDEX team_status_index FOR (t:Team) ON (t.status);

// Task indexes
CREATE INDEX task_id_index FOR (t:Task) ON (t.id);
CREATE INDEX task_priority_index FOR (t:Task) ON (t.priority);

// Composite indexes
CREATE INDEX agent_template_index FOR (a:Agent) ON (a.template_id, a.version);
```

#### Backup Procedures

```bash
# Daily automated backup
neo4j-admin dump --database=neo4j --to=/backups/neo4j-$(date +%Y%m%d).dump

# Backup verification
neo4j-admin load --from=/backups/neo4j-$(date +%Y%m%d).dump --database=neo4j-verify --force
```

### Kafka Management

#### Topic Configuration

```bash
# Create topics with appropriate retention and replication
kafka-topics --bootstrap-server kafka:9092 --create --topic agent_events --partitions 8 --replication-factor 3 --config retention.ms=604800000

kafka-topics --bootstrap-server kafka:9092 --create --topic team_events --partitions 8 --replication-factor 3 --config retention.ms=604800000

kafka-topics --bootstrap-server kafka:9092 --create --topic task_events --partitions 8 --replication-factor 3 --config retention.ms=604800000

kafka-topics --bootstrap-server kafka:9092 --create --topic system_events --partitions 4 --replication-factor 3 --config retention.ms=1209600000
```

#### Consumer Group Management

```bash
# List consumer groups
kafka-consumer-groups --bootstrap-server kafka:9092 --list

# Describe consumer group lag
kafka-consumer-groups --bootstrap-server kafka:9092 --describe --group agent_event_processor --members

# Reset consumer group offset (emergency use only)
kafka-consumer-groups --bootstrap-server kafka:9092 --group agent_event_processor --topic agent_events --reset-offsets --to-earliest --execute
```

## Monitoring and Observability

### Metrics Collection

The system uses Prometheus for metrics collection and Grafana for visualization:

```yaml
# Prometheus scrape configuration
scrape_configs:
  - job_name: 'agent-party-api'
    scrape_interval: 15s
    kubernetes_sd_configs:
      - role: pod
        namespaces:
          names: ['agent-party']
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_label_app]
        regex: agent-party
        action: keep
      - source_labels: [__meta_kubernetes_pod_label_component]
        regex: api
        action: keep
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        regex: "true"
        action: keep
```

### Key Metrics

Critical metrics to monitor:

1. **Performance Metrics**
   - API response time (95th percentile)
   - Neo4j query execution time
   - Event processing latency
   - GNN model inference time

2. **Resource Metrics**
   - CPU and memory usage
   - Network I/O
   - Disk I/O and usage
   - Connection pool utilization

3. **Business Metrics**
   - Agent instantiation rate
   - Team formation success rate
   - Task completion rate
   - Token consumption rate

### Logging Strategy

The system uses structured JSON logging for better searchability:

```python
# Log configuration
log_config = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "json": {
            "()": "pythonjsonlogger.jsonlogger.JsonFormatter",
            "fmt": "%(asctime)s %(levelname)s %(name)s %(message)s",
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "json",
            "stream": "ext://sys.stdout",
        }
    },
    "loggers": {
        "app": {"handlers": ["console"], "level": "INFO"},
        "neo4j": {"handlers": ["console"], "level": "WARNING"},
        "kafka": {"handlers": ["console"], "level": "WARNING"},
    },
    "root": {"handlers": ["console"], "level": "INFO"},
}
```

### Alerting Rules

```yaml
# Prometheus alerting rules
groups:
- name: agent-party-alerts
  rules:
  # High API latency
  - alert: HighApiLatency
    expr: histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, endpoint)) > 1.0
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High API latency detected"
      description: "95th percentile latency for {{ $labels.endpoint }} is above 1 second"

  # Neo4j connection issues
  - alert: Neo4jConnectionFailures
    expr: rate(neo4j_connection_failures_total[5m]) > 0.1
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "Neo4j connection failures detected"
      description: "Database connection failures rate is above threshold"

  # Kafka lag
  - alert: KafkaConsumerLag
    expr: sum(kafka_consumergroup_lag) by (consumergroup) > 1000
    for: 10m
    labels:
      severity: warning
    annotations:
      summary: "Kafka consumer lag detected"
      description: "Consumer group {{ $labels.consumergroup }} is lagging by more than 1000 messages"
```

## Scaling Strategies

### Horizontal Scaling

The system is designed for horizontal scaling:

1. **API Services**
   - Scale based on CPU utilization (>70%)
   - Use Kubernetes HPA (Horizontal Pod Autoscaler)
   - Ensure proper connection pool configuration

2. **Database**
   - Neo4j causal clustering with read replicas
   - Scale read replicas based on query load
   - Implement connection pooling and load balancing

3. **Event Processing**
   - Scale Kafka consumers independently per topic
   - Increase partitions for higher parallelism
   - Balance consumer groups for even distribution

### Kubernetes Autoscaling

```yaml
apiVersion: autoscaling/v2beta2
kind: HorizontalPodAutoscaler
metadata:
  name: agent-party-api-hpa
  namespace: agent-party
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: agent-party-api
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Database Scaling Considerations

#### Read/Write Separation

For Neo4j database scaling:

```cypher
// Separate heavy read operations with read routing
WITH "bolt+routing://neo4j-cluster:7687" AS uri
CALL dbms.cluster.routing.getRoutingTable({}, uri)
YIELD ttl, servers
RETURN ttl, servers
```

#### Connection Pooling

```python
from neo4j import AsyncGraphDatabase

class Neo4jConnectionPool:
    def __init__(self, uri, auth, max_connections=50, max_idle_time=30):
        self.uri = uri
        self.auth = auth
        self.max_connections = max_connections
        self.max_idle_time = max_idle_time
        self.driver = AsyncGraphDatabase.driver(
            uri, 
            auth=auth,
            max_connection_pool_size=max_connections,
            max_connection_lifetime=max_idle_time
        )
```

## Disaster Recovery

### Backup Strategy

1. **Database Backups**
   - Full daily backups stored in object storage
   - Transaction logs backed up hourly
   - 30-day retention policy
   - Offsite backup copies

2. **Configuration Backups**
   - Infrastructure as Code (Terraform)
   - Kubernetes manifests in Git
   - Secrets managed with Vault

3. **Application State**
   - Event sourcing for rebuilding state
   - Kafka topic replication
   - Snapshot-based recovery points

### Recovery Procedures

#### Database Recovery

```bash
# Restore Neo4j from backup
neo4j-admin load --from=/backups/neo4j-YYYYMMDD.dump --database=neo4j --force

# Validate restore
cypher-shell -u neo4j -p "$NEO4J_PASSWORD" "MATCH (n) RETURN count(n)"

# Apply transaction logs if needed
neo4j-admin transaction-logs apply --from=/logs/transactions/ --database=neo4j
```

#### Application Recovery

```bash
# Roll back to last known good deployment
kubectl rollout undo deployment/agent-party-api

# Scale up replacement services
kubectl scale deployment agent-party-api --replicas=5

# Verify health
kubectl exec -it $(kubectl get pods -l app=agent-party,component=api -o name | head -n 1) -- curl localhost:8000/health
```

## Security Management

### Authentication

The system uses OAuth2 with JWT for API authentication:

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt import PyJWTError, decode

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/token")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid credentials")
    except PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return await user_repository.get_user_by_id(user_id)
```

### Authorization

Role-based access control is implemented for all endpoints:

```python
from enum import Enum
from typing import List
from fastapi import Depends, HTTPException, status

class Role(str, Enum):
    ADMIN = "admin"
    OPERATOR = "operator"
    VIEWER = "viewer"

def has_roles(required_roles: List[Role]):
    async def role_checker(user = Depends(get_current_user)):
        if not set(user.roles).intersection(set(required_roles)):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return user
    return role_checker

@app.post("/agents/", dependencies=[Depends(has_roles([Role.ADMIN]))])
async def create_agent(agent_data: AgentCreate):
    # Only admin can create agents
    return await agent_service.create_agent(agent_data)
```

### Secrets Management

Kubernetes Secrets are used for sensitive configuration:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: db-credentials
  namespace: agent-party
type: Opaque
data:
  uri: bmVvNGo6Ly9uZW80ajoyNzAxNw==  # neo4j://neo4j:27017
  username: bmVvNGo=  # neo4j
  password: cGFzc3dvcmQ=  # password
```

## Troubleshooting Guide

### Common Issues

#### 1. Neo4j Connection Failures

Symptoms:
- `Neo4jConnectionError` in logs
- HTTP 500 errors from API
- Increasing response times

Troubleshooting:
```bash
# Check Neo4j logs
kubectl logs -l app=neo4j -c neo4j

# Verify networking
kubectl exec -it $(kubectl get pods -l app=agent-party,component=api -o name | head -n 1) -- ping neo4j

# Check connection limits
kubectl exec -it $(kubectl get pods -l app=neo4j -o name | head -n 1) -- cypher-shell -u neo4j -p "$NEO4J_PASSWORD" \
  "CALL dbms.listConnections()"
```

#### 2. Kafka Event Processing Delays

Symptoms:
- Consumer lag increasing
- Event-driven operations timing out
- Inconsistent system state

Troubleshooting:
```bash
# Check consumer group lag
kubectl exec -it $(kubectl get pods -l app=kafka-utils -o name | head -n 1) -- \
  kafka-consumer-groups --bootstrap-server kafka:9092 --describe --group agent_event_processor

# Inspect broker metrics
kubectl exec -it $(kubectl get pods -l app=kafka -o name | head -n 1) -- \
  kafka-topics --bootstrap-server kafka:9092 --describe --topic agent_events

# Analyze consumer logs
kubectl logs -l app=agent-party,component=event-processor --tail=100
```

#### 3. Memory Pressure

Symptoms:
- OOMKilled pods
- Increasing response times
- Garbage collection pauses

Troubleshooting:
```bash
# Check memory usage
kubectl top pods -n agent-party

# Analyze memory profiles
kubectl exec -it $(kubectl get pods -l app=agent-party,component=api -o name | head -n 1) -- \
  python -m memory_profiler /app/src/memory_profile.py

# Inspect GC metrics
kubectl port-forward $(kubectl get pods -l app=agent-party,component=api -o name | head -n 1) 5000:5000
# Then access http://localhost:5000/metrics
```

### Diagnostic Commands

```bash
# Health check all components
kubectl get pods -n agent-party

# View recent errors
kubectl logs --selector=app=agent-party --since=30m | grep -i error

# Check API health
curl -X GET https://api.agent-party.example.com/health

# Database consistency check
cypher-shell -u neo4j -p "$NEO4J_PASSWORD" "CALL apoc.meta.stats()"

# Event queue status
kafka-consumer-groups --bootstrap-server kafka:9092 --all-groups --describe
```

## Performance Tuning

### JVM Tuning for Neo4j

```
# neo4j.conf optimizations
dbms.memory.heap.initial_size=4G
dbms.memory.heap.max_size=4G
dbms.memory.pagecache.size=8G
dbms.transaction.concurrent.maximum=64
dbms.index.default_schema_provider=native-btree-1.0
```

### Kafka Optimizations

```properties
# server.properties
num.network.threads=8
num.io.threads=16
socket.send.buffer.bytes=1048576
socket.receive.buffer.bytes=1048576
socket.request.max.bytes=104857600
replica.fetch.max.bytes=10485760
```

### API Performance Tuning

```python
# Uvicorn configuration
config = uvicorn.Config(
    "agent_party.main:app",
    host="0.0.0.0",
    port=8000,
    workers=min(os.cpu_count() * 2 + 1, 8),
    loop="uvloop",
    http="httptools",
    limit_concurrency=1000,
    backlog=2048,
)
```

## Upgrade Procedures

### Rolling Updates

```bash
# Update API service with zero downtime
kubectl set image deployment/agent-party-api api=agent-party/api:1.2.3
```

### Database Schema Migrations

```bash
# Apply database migrations
python -m alembic upgrade head

# Neo4j schema updates (in transaction)
cat schema/migrations/v2.1.0.cypher | cypher-shell -u neo4j -p "$NEO4J_PASSWORD" --format plain
```

### Rollback Procedures

```bash
# Rollback API deployment
kubectl rollout undo deployment/agent-party-api

# Rollback database migration
python -m alembic downgrade -1

# Verify system health after rollback
pytest tests/integration/health_check.py
```
