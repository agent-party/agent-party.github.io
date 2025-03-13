# Troubleshooting Guide

This guide provides solutions to common issues encountered when working with the Agent Party system. It covers development, deployment, operational, and integration troubleshooting scenarios.

## 1. Development Issues

### 1.1 Environment Setup

#### Neo4j Connection Issues

**Symptoms:**
- `Neo4jConnectionError` exceptions
- Unable to connect to Neo4j database
- Tests failing with database connection errors

**Possible Solutions:**
1. Verify Neo4j is running with `docker ps` or Neo4j Desktop
2. Check connection parameters in `.env` file
3. Ensure Neo4j ports (7474/7687) are accessible
4. Check for network restrictions or firewall issues
5. Verify credentials are correct

```bash
# Example: Testing Neo4j connection
python -c "from neo4j import GraphDatabase; \
  conn = GraphDatabase.driver('neo4j://localhost:7687', auth=('neo4j', 'password')); \
  print(conn.verify_connectivity())"
```

#### Kafka Connection Issues

**Symptoms:**
- `KafkaConnectionError` exceptions
- Events not being processed
- Services failing to start with Kafka errors

**Possible Solutions:**
1. Verify Kafka is running with `docker ps`
2. Check bootstrap server configuration
3. Ensure topic exists with correct configuration
4. Check for network restrictions or firewall issues

```bash
# Example: Testing Kafka connection
python -c "from kafka import KafkaProducer; \
  producer = KafkaProducer(bootstrap_servers='localhost:9092'); \
  print('Connected')"
```

#### Redis Connection Issues

**Symptoms:**
- `RedisConnectionError` exceptions
- Session management failing
- Rate limiting not working

**Possible Solutions:**
1. Verify Redis is running with `docker ps`
2. Check Redis connection parameters
3. Try connecting with redis-cli to verify connectivity
4. Check for network restrictions or firewall issues

```bash
# Example: Testing Redis connection
python -c "import redis; \
  client = redis.Redis(host='localhost', port=6379, db=0); \
  print(client.ping())"
```

### 1.2 Code Issues

#### Type Checking Errors

**Symptoms:**
- mypy reporting type errors
- CI/CD builds failing on type checks

**Possible Solutions:**
1. Run mypy locally to identify issues: `mypy src/agent_party`
2. Add missing type annotations as required
3. Use Protocol classes for interface definitions
4. Check for stubs for third-party packages: `pip install types-redis`

#### Test Failures

**Symptoms:**
- Unit tests failing
- Integration tests timing out

**Possible Solutions:**
1. Run specific failing test with verbose output: `pytest test_file.py::test_name -v`
2. Check test database fixtures for proper cleanup
3. Verify mocks are configured correctly
4. Ensure aiohttp test client is being used for async tests
5. Check for transaction isolation issues in Neo4j tests

```bash
# Example: Run tests with coverage
pytest --cov=agent_party tests/ --cov-report=term-missing
```

#### Model Training Failures

**Symptoms:**
- GNN training scripts failing
- Model prediction errors
- Embedding generation errors

**Possible Solutions:**
1. Check input data quality and preprocessing steps
2. Verify PyTorch/TensorFlow versions match requirements
3. Check CUDA configuration for GPU acceleration
4. Ensure enough memory is available for training
5. Review model hyperparameters for inappropriate values

## 2. Deployment Issues

### 2.1 Container Issues

#### Docker Build Failures

**Symptoms:**
- Docker build errors
- Missing dependencies in container

**Possible Solutions:**
1. Validate Dockerfile for correct base image and dependencies
2. Check for conflicting requirements in requirements.txt
3. Ensure build context contains all necessary files
4. Try building with no-cache option: `docker build --no-cache -t agent-party .`

#### Container Startup Failures

**Symptoms:**
- Container exits immediately after starting
- Health checks failing

**Possible Solutions:**
1. Check container logs: `docker logs <container_id>`
2. Verify environment variables are properly set
3. Check for permissions issues on mounted volumes
4. Ensure dependent services are available before startup
5. Inspect Docker health check configuration

### 2.2 Kubernetes Issues

#### Pod Scheduling Problems

**Symptoms:**
- Pods stuck in Pending state
- Pods failing to schedule

**Possible Solutions:**
1. Check for resource constraints: `kubectl describe pod <pod_name>`
2. Verify node selector/affinity configuration
3. Check for taints/tolerations issues
4. Ensure persistent volume claims can be fulfilled

#### Service Discovery Issues

**Symptoms:**
- Services unable to communicate
- DNS resolution failures

**Possible Solutions:**
1. Check service definitions: `kubectl get svc`
2. Verify ClusterIP services are accessible
3. Check CoreDNS functionality
4. Ensure network policies allow required traffic
5. Verify service ports match container ports

### 2.3 Database Migration Issues

**Symptoms:**
- Failed Neo4j schema migrations
- Missing indices or constraints

**Possible Solutions:**
1. Manually verify Neo4j constraints and indices: `CALL db.constraints(); CALL db.indexes();`
2. Check migration script logs for errors
3. Verify migration scripts are being applied in the correct order
4. If necessary, run manual Cypher queries to create missing schema elements
5. Consider backup and restore if schema is significantly broken

## 3. Operational Issues

### 3.1 Performance Problems

#### Neo4j Query Performance

**Symptoms:**
- Slow query execution
- High database CPU usage
- Timeouts on graph operations

**Possible Solutions:**
1. Run `EXPLAIN` or `PROFILE` to analyze query plans
2. Check for missing indices on frequently queried properties
3. Optimize Cypher queries by reducing pattern complexity
4. Consider adding composite indices for common query patterns
5. Increase connection pool size for high concurrency

```cypher
// Example: Check query plan for performance issues
EXPLAIN MATCH (a:Agent)-[:HAS_CAPABILITY]->(c:Capability)
WHERE a.status = 'active' AND c.name = 'python_coding'
RETURN a.name, c.proficiency
```

#### Event Processing Bottlenecks

**Symptoms:**
- Kafka consumer lag increasing
- Events processed slowly
- Message timeout errors

**Possible Solutions:**
1. Check consumer group lag: `kafka-consumer-groups --bootstrap-server localhost:9092 --group agent_party_group --describe`
2. Increase consumer parallelism by adding more partitions
3. Optimize event handler processing logic
4. Consider batch processing for high-volume events
5. Implement back-pressure mechanisms

#### API Response Latency

**Symptoms:**
- Slow API response times
- Request timeouts
- High CPU/memory usage

**Possible Solutions:**
1. Implement API response time monitoring
2. Add caching for frequently accessed endpoints
3. Optimize database queries in API handlers
4. Consider asynchronous processing for long-running operations
5. Scale horizontally by adding more API instances

### 3.2 Reliability Issues

#### System Recovery Problems

**Symptoms:**
- Failed recovery from checkpoints
- Inconsistent state after recovery
- Missing events during recovery

**Possible Solutions:**
1. Check system checkpoint data for integrity
2. Verify event journal is complete and ordered
3. Implement idempotent event handlers to prevent duplication
4. Add more comprehensive logging during recovery processes
5. Consider implementing compensating transactions

#### Token Budget Enforcement Issues

**Symptoms:**
- Token budgets not properly enforced
- Budget alerts not triggering
- Cost tracking discrepancies

**Possible Solutions:**
1. Check token accounting records for inconsistencies
2. Verify budget threshold calculations
3. Ensure budget check is performed before operations
4. Add more detailed logging for budget enforcement
5. Implement reconciliation process for token accounting

### 3.3 Monitoring Issues

**Symptoms:**
- Missing metrics in monitoring dashboards
- Alerts not triggering
- Log data incomplete

**Possible Solutions:**
1. Check Prometheus or metrics collection configuration
2. Verify log aggregation pipeline
3. Ensure instrumentation code is functioning
4. Check alert rule configuration
5. Validate monitoring infrastructure connectivity

## 4. Integration Issues

### 4.1 Model API Integration

**Symptoms:**
- Model API errors
- Token counting discrepancies
- Model response parsing failures

**Possible Solutions:**
1. Check model API credentials and permissions
2. Verify network connectivity to model provider
3. Ensure request format follows latest API specification
4. Implement proper error handling for API rate limits
5. Add retry mechanisms with exponential backoff

### 4.2 External System Integration

**Symptoms:**
- Failed messages to external systems
- Authentication errors on external APIs
- Data format mismatches

**Possible Solutions:**
1. Verify API keys and credentials
2. Check network connectivity and firewall rules
3. Validate request/response payload formats
4. Implement proper error handling and retry logic
5. Add circuit breakers for failing external dependencies

## 5. Common Error Codes and Solutions

### 5.1 Agent Party Error Codes

| Error Code | Description | Resolution |
|------------|-------------|------------|
| `AP-DB-001` | Neo4j connection failure | Check Neo4j connection parameters and availability |
| `AP-DB-002` | Neo4j constraint violation | Ensure data conforms to database constraints |
| `AP-DB-003` | Neo4j query timeout | Optimize query or increase timeout settings |
| `AP-MSG-001` | Kafka message publish failure | Check Kafka availability and topic configuration |
| `AP-MSG-002` | Kafka consumer group error | Verify consumer group setup and partition assignment |
| `AP-CACHE-001` | Redis connection failure | Check Redis connection parameters and availability |
| `AP-API-001` | External API request failure | Validate API credentials and request format |
| `AP-API-002` | Model API rate limit exceeded | Implement rate limiting and queuing mechanisms |
| `AP-SYS-001` | Configuration error | Check environment variables and config files |
| `AP-AUTH-001` | Authentication failure | Verify user credentials and token validity |
| `AP-AUTH-002` | Authorization failure | Check user permissions for the requested operation |

### 5.2 Critical Error Recovery

For critical system errors that require manual intervention:

1. **Database Corruption**
   - Stop all services writing to Neo4j
   - Restore from latest backup: `neo4j-admin load --from=/path/to/backup --database=neo4j`
   - Replay event journal from backup timestamp
   - Verify data integrity before restarting services

2. **Event Stream Corruption**
   - Stop all Kafka consumers
   - Reset consumer group offsets: `kafka-consumer-groups --bootstrap-server localhost:9092 --group agent_party_group --reset-offsets --to-timestamp <timestamp> --execute`
   - Restart consumers in sequence
   - Monitor for processing errors

3. **Critical Service Failure**
   - Check service logs for root cause
   - Restart failed service with increased logging
   - Verify dependent services are functioning
   - Check for resource exhaustion (CPU/memory/disk)
   - Consider rolling back to previous version if issue persists

## 6. Debugging Techniques

### 6.1 Debug Modes

Enable debug mode in the configuration to get more detailed logs:

```python
# In .env file
DEBUG=true
LOG_LEVEL=DEBUG
```

### 6.2 Log Analysis

Key log files to check for different components:

- API Service: `/var/log/agent-party/api.log`
- Event Processor: `/var/log/agent-party/event_processor.log`
- Agent Lifecycle Manager: `/var/log/agent-party/lifecycle.log`
- Team Assembly Service: `/var/log/agent-party/team_assembly.log`

### 6.3 Diagnostic Commands

```bash
# Check system status
agent-party-cli status

# Verify Neo4j schema
agent-party-cli db verify-schema

# Test event publishing
agent-party-cli events publish --type test.event --payload '{"test": true}'

# Validate configuration
agent-party-cli config validate

# Run system health check
agent-party-cli health
```

## 7. Getting Help

If issues persist after trying the solutions in this guide:

1. Check the [GitHub Issues](https://github.com/agent-party/agent-party/issues) for similar problems
2. Review the development documentation for more detailed information
3. Join the Agent Party community channel for real-time assistance
4. Submit a detailed bug report with logs, environment details, and steps to reproduce

Remember to include relevant diagnostics when seeking help:

- System version information
- Environment configuration (sanitized of secrets)
- Relevant log excerpts
- Steps to reproduce the issue
- Any error messages or codes
