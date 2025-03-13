# Implementation Guide

This document provides comprehensive guidance for implementing and developing components of the Agent Party system, ensuring consistency and quality across the codebase.

## Development Approach

### Core Principles

1. **Test-Driven Development**
   - Write tests before implementation code
   - Target 100% test coverage with strategic exclusions
   - Use proper mocking for dependencies and external services
   - Implement property-based testing for complex data structures

2. **Quality First**
   - Follow SOLID principles and clean code practices
   - Use Protocol interfaces for service contracts
   - Implement proper error handling and validation
   - Maintain comprehensive documentation

3. **Incremental Progress**
   - Work on one module at a time until complete
   - Create small, testable increments of functionality
   - Remove debug code and commented-out sections after use
   - Complete all components with 100% test coverage

### Architecture Patterns

#### Service Registry Pattern

All services should be registered with the ServiceRegistry:

```python
def register_services(registry: ServiceRegistry) -> None:
    """Register all application services."""
    
    # Register repositories
    registry.register(AgentRepository, AgentNeo4jRepository(driver))
    registry.register(TemplateRepository, TemplateNeo4jRepository(driver))
    
    # Register core services
    registry.register(AgentFactory, AgentFactoryImpl(
        template_repository=registry.get_service(TemplateRepository),
        agent_repository=registry.get_service(AgentRepository),
        event_publisher=registry.get_service(EventPublisher)
    ))
```

#### Repository Pattern

All database interactions should use the repository pattern:

```python
class AgentRepository(Protocol):
    """Interface for agent data access."""
    
    async def get_agent_by_id(self, agent_id: str) -> Agent:
        """Get agent by ID."""
        ...
    
    async def create_agent(self, agent_data: dict) -> str:
        """Create a new agent."""
        ...
    
    async def update_agent(self, agent_id: str, updates: dict) -> None:
        """Update an existing agent."""
        ...
```

#### Event-Driven Architecture

The system uses event-driven architecture for communication:

```python
class EventPublisher(Protocol):
    """Interface for publishing events."""
    
    async def publish_event(self, topic: str, event: BaseEvent) -> None:
        """Publish an event to Kafka."""
        ...

class KafkaEventPublisher:
    """Kafka implementation of EventPublisher."""
    
    def __init__(self, producer: AIOKafkaProducer):
        self.producer = producer
    
    async def publish_event(self, topic: str, event: BaseEvent) -> None:
        """Publish an event to Kafka."""
        event_data = event.json().encode('utf-8')
        await self.producer.send_and_wait(topic, event_data)
```

## Code Standards

### Type Annotations

All code must include comprehensive type annotations:

```python
# Modern type annotations (preferred)
def create_agent(
    template_id: str,
    parameters: dict[str, Any] | None = None,
    timeout_seconds: int = 30
) -> str:
    """Create a new agent instance."""
    ...

# Use TypedDict for complex dictionary structures
class AgentParameters(TypedDict):
    model: str
    temperature: float
    max_tokens: int
    stop_sequences: list[str]

# Use Protocol for interfaces
class CapabilityService(Protocol):
    async def find_similar_capabilities(
        self, capability_name: str, threshold: float = 0.7
    ) -> list[Capability]:
        """Find capabilities similar to the given name."""
        ...
```

### Docstrings

Follow this format for all docstrings:

```python
def transition_agent_state(
    agent_id: str, 
    target_state: str,
    approver: str | None = None
) -> None:
    """
    Transition an agent to a new state.
    
    Args:
        agent_id: Unique identifier for the agent
        target_state: State to transition the agent to
        approver: Entity that approved the transition
        
    Raises:
        AgentNotFound: If the agent doesn't exist
        InvalidStateTransition: If the transition is not allowed
        
    Returns:
        None
    """
    ...
```

### Code Formatting

- All code must be formatted with `black` and `isort`
- Maximum line length: 100 characters
- Use 4 spaces for indentation (not tabs)
- Follow PEP 8 naming conventions
- Apply consistent spacing around operators

### Error Handling

```python
try:
    result = await service.perform_operation(input_data)
    return result
except ServiceUnavailableError as err:
    logger.error(f"Service unavailable: {err}", exc_info=True)
    raise SystemError(f"Critical dependency failure: {err}") from err
except ValidationError as err:
    logger.warning(f"Validation failed: {err}")
    raise BadRequestError(f"Invalid input: {err}") from err
except Exception as err:
    logger.exception(f"Unexpected error: {err}")
    raise
```

## Testing Strategy

### Module-Focused Testing

The project follows a module-focused testing approach:

1. Complete one module's test coverage before moving to the next
2. Begin with smaller, simpler modules to build momentum
3. Create both positive and negative test cases for all functionality

### Unit Testing

```python
import pytest
from unittest.mock import AsyncMock, patch

@pytest.mark.asyncio
async def test_create_agent_success():
    # Arrange
    template_id = "template-123"
    agent_id = "agent-456"
    mock_repo = AsyncMock()
    mock_repo.create_agent.return_value = agent_id
    mock_publisher = AsyncMock()
    
    service = AgentService(repository=mock_repo, publisher=mock_publisher)
    
    # Act
    result = await service.create_agent(template_id)
    
    # Assert
    assert result == agent_id
    mock_repo.create_agent.assert_called_once_with(
        {"template_id": template_id, "status": "provisioned"}
    )
    mock_publisher.publish_event.assert_called_once()
```

### Integration Testing

```python
@pytest.fixture
async def neo4j_container():
    """Spin up a Neo4j container for testing."""
    container = NeoTestContainer("neo4j:4.4.8")
    await container.start()
    yield container
    await container.stop()

@pytest.mark.asyncio
async def test_agent_repository_integration(neo4j_container):
    # Arrange
    uri = neo4j_container.get_connection_url()
    repo = AgentNeo4jRepository(
        driver=Neo4j.driver(uri, auth=("neo4j", "password"))
    )
    
    # Act
    agent_id = await repo.create_agent({"name": "Test Agent"})
    
    # Assert
    agent = await repo.get_agent_by_id(agent_id)
    assert agent.name == "Test Agent"
```

### Performance Testing

```python
@pytest.mark.benchmark
def test_agent_embedding_performance(benchmark):
    # Arrange
    test_text = "This is a sample agent description" * 100
    embedding_service = EmbeddingService()
    
    # Act & Assert
    result = benchmark(embedding_service.embed_text, test_text)
    assert len(result) == 1536  # Expected embedding size
```

## Performance Optimization

### Neo4j Query Optimization

```python
# Optimized query with proper indexing
@log_execution_time
async def find_agents_with_capabilities(
    self, capabilities: list[str], min_proficiency: float = 0.7
) -> list[dict]:
    """Find agents with the specified capabilities."""
    query = """
    MATCH (a:Agent)
    WHERE a.status = 'active'
    WITH a
    MATCH (a)-[r:HAS_CAPABILITY]->(c:Capability)
    WHERE c.name IN $capabilities AND r.proficiency >= $min_proficiency
    WITH a, collect(c.name) AS matched_capabilities, 
         count(c.name) AS match_count
    WHERE match_count = size($capabilities)
    RETURN a.id AS id, a.name AS name, matched_capabilities
    """
    params = {
        "capabilities": capabilities,
        "min_proficiency": min_proficiency
    }
    
    async with self.driver.session() as session:
        result = await session.run(query, params)
        return [record.data() for record in await result.fetch()]
```

### Caching Strategy

```python
class CachedTemplateService:
    """Service with Redis caching for templates."""
    
    def __init__(self, repository: TemplateRepository, redis: Redis):
        self.repository = repository
        self.redis = redis
        self.cache_ttl = 3600  # 1 hour
    
    async def get_template(self, template_id: str) -> Template:
        """Get a template with caching."""
        # Try cache first
        cache_key = f"template:{template_id}"
        cached = await self.redis.get(cache_key)
        
        if cached:
            return Template.parse_raw(cached)
        
        # Cache miss, get from repository
        template = await self.repository.get_template(template_id)
        
        # Update cache
        await self.redis.set(
            cache_key, 
            template.json(),
            expire=self.cache_ttl
        )
        
        return template
```

### Asynchronous Processing

```python
async def process_batch(batch: list[dict]) -> list[dict]:
    """Process multiple items concurrently."""
    tasks = []
    for item in batch:
        task = asyncio.create_task(process_single(item))
        tasks.append(task)
    
    # Wait for all tasks to complete
    results = await asyncio.gather(*tasks)
    return results
```

## Deployment Architecture

### Container Setup

The system uses Docker Compose for local development and Kubernetes for production:

```yaml
version: '3.8'
services:
  api:
    build: 
      context: .
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - NEO4J_URI=neo4j://neo4j:7687
      - KAFKA_BOOTSTRAP_SERVERS=kafka:9092
      - REDIS_URI=redis://redis:6379
    depends_on:
      - neo4j
      - kafka
      - redis
  
  neo4j:
    image: neo4j:4.4
    ports:
      - "7474:7474"
      - "7687:7687"
    environment:
      - NEO4J_AUTH=neo4j/password
    volumes:
      - neo4j_data:/data
  
  kafka:
    image: confluentinc/cp-kafka:7.0.0
    ports:
      - "9092:9092"
    environment:
      - KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://kafka:9092
      - KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1
    volumes:
      - kafka_data:/var/lib/kafka/data
  
  redis:
    image: redis:6.2
    ports:
      - "6379:6379"

volumes:
  neo4j_data:
  kafka_data:
```

### Continuous Integration

The project uses GitHub Actions for CI/CD:

```yaml
name: Agent Party CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.10'
      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -e ".[dev]"
      - name: Lint
        run: |
          black --check src tests
          isort --check-only src tests
          mypy src
      - name: Test
        run: |
          pytest tests/ --cov=src/ --cov-report=xml
      - name: Upload coverage
        uses: codecov/codecov-action@v1
```

## Monitoring and Observability

### Logging

```python
# Standard logging pattern
import logging
from app.utils.log_formatter import JsonFormatter

logger = logging.getLogger(__name__)

def configure_logging():
    """Configure application logging."""
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())
    
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    root_logger.addHandler(handler)
    
    # Set specific log levels
    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    logging.getLogger("kafka").setLevel(logging.WARNING)
```

### Metrics Collection

```python
from prometheus_client import Counter, Histogram
import time

# Define metrics
REQUEST_COUNT = Counter(
    'request_count', 
    'Count of requests received',
    ['method', 'endpoint', 'status_code']
)

REQUEST_LATENCY = Histogram(
    'request_latency_seconds', 
    'Latency of requests',
    ['method', 'endpoint']
)

# Middleware for FastAPI
@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    start_time = time.time()
    
    response = await call_next(request)
    
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path,
        status_code=response.status_code
    ).inc()
    
    REQUEST_LATENCY.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(time.time() - start_time)
    
    return response
```

## Branch Strategy and Version Control

### Branching Model

The project follows a modified Gitflow branching model:

- **main**: Production-ready code
- **develop**: Integration branch for feature development
- **feature/xxx**: Feature branches created from develop
- **bugfix/xxx**: Bug fix branches created from develop
- **release/x.y.z**: Release preparation branches
- **hotfix/xxx**: Emergency fixes for production

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

Where:
- **type**: feat, fix, docs, style, refactor, test, chore
- **scope**: component affected (e.g., agent, template, db)
- **subject**: Short summary
- **body**: Detailed explanation
- **footer**: Breaking changes, references to issues

Example:
```
feat(agent): implement agent state transition

- Add state machine model
- Implement transition validation
- Add event emission for transitions

Closes #123
```

## Security Considerations

### Authentication & Authorization

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    user = await validate_token(token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user

async def get_admin_user(user = Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return user

@app.get("/agents/", dependencies=[Depends(get_current_user)])
async def read_agents():
    return {"agents": []}

@app.post("/agents/", dependencies=[Depends(get_admin_user)])
async def create_agent():
    return {"status": "created"}
```

### Secret Management

```python
from pydantic import BaseSettings, Field
from functools import lru_cache

class Settings(BaseSettings):
    """Application settings with secret management."""
    
    # Database settings
    db_uri: str = Field(..., env="DB_URI")
    db_username: str = Field(..., env="DB_USERNAME")
    db_password: str = Field(..., env="DB_PASSWORD")
    
    # API keys
    openai_api_key: str = Field(..., env="OPENAI_API_KEY")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

@lru_cache()
def get_settings():
    """Cached settings instance."""
    return Settings()
```

## Troubleshooting

### Common Error Patterns

#### 1. Neo4j Connection Issues

```
ERROR: Neo4j connection failed: Connection refused
```

Troubleshooting:
- Verify Neo4j is running with `docker ps | grep neo4j`
- Check connection string format: `neo4j://hostname:7687`
- Confirm credentials are correct in environment variables
- Check Neo4j logs with `docker logs neo4j-container`

#### 2. Event Processing Failures

```
ERROR: Failed to publish event: KafkaTimeoutError
```

Troubleshooting:
- Verify Kafka broker is up and running
- Check Kafka connectivity with `kafkacat -b localhost:9092 -L`
- Confirm topic exists with `kafka-topics --bootstrap-server localhost:9092 --list`
- Check for network issues between services

#### 3. Redis Cache Failures

```
ERROR: Redis connection failed: Connection reset by peer
```

Troubleshooting:
- Check Redis container status
- Verify connection string format: `redis://hostname:6379`
- Check memory usage and configuration
- Verify network connectivity between services

### Debug Mode

Enable debug mode for more detailed logging:

```python
# In your settings.py
debug_mode: bool = Field(False, env="DEBUG_MODE")

# In application code
if settings.debug_mode:
    logging.getLogger().setLevel(logging.DEBUG)
    logger.debug("Detailed diagnostic information")
```

## Scaling Considerations

### Horizontal Scaling

- API services scale horizontally behind a load balancer
- Database services use clustering (Neo4j causal clusters)
- Kafka uses partitioning for parallel processing
- Redis uses clustering for distributed caching

### Vertical Scaling

- Increase resources for compute-intensive services (GNN model training)
- Optimize memory allocation for graph database operations
- Tune JVM settings for Kafka brokers
- Configure connection pooling appropriately

### Caching Strategy

- Use Redis as a distributed cache
- Implement tiered caching (memory, Redis, disk)
- Cache invalidation based on event processing
- Implement cache warming for predictable workloads

## Next Steps

1. Complete test coverage across all modules
2. Implement comprehensive observability
3. Enhance security measures
4. Optimize performance bottlenecks
5. Develop deployment automation
