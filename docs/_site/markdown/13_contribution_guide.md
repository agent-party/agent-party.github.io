# Contribution Guide

This guide outlines the process for contributing to the Agent Party project, including development workflows, quality standards, and code review procedures.

## 1. Development Principles

### 1.1 Test-Driven Development

Agent Party follows a strict test-driven development (TDD) approach:

1. **Write Tests First**: Always start by writing tests that define the expected behavior
2. **Target 100% Coverage**: All code must be tested; use strategic exclusions (`# pragma: no cover`) only when necessary
3. **Module-by-Module Approach**: Complete testing for one module before moving to the next
4. **Progressive Complexity**: Start with smaller, simpler modules to build momentum

```python
# Example of a well-tested function with typed parameters
async def find_agent_by_capability(
    capability_name: str, min_proficiency: float = 0.5
) -> List[AgentModel]:
    """
    Find agents with specified capability and minimum proficiency level.
    
    Args:
        capability_name: Name of the capability to search for
        min_proficiency: Minimum proficiency level (0.0-1.0)
        
    Returns:
        List of agents matching the criteria
        
    Raises:
        ValidationError: If capability_name is empty or min_proficiency is out of range
    """
    # Function implementation
    ...
```

### 1.2 Quality Standards

Code quality is prioritized over delivery speed:

1. **SOLID Principles**: Adhere to Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion
2. **Protocol Interfaces**: Define clear service contracts using Protocol classes
3. **Type Annotations**: Use comprehensive typing with mypy validation
4. **Proper Error Handling**: Implement specific exceptions and validation
5. **Code Formatting**: All code must pass black, isort, and flake8

```python
# Example Protocol interface
class AgentRepositoryProtocol(Protocol):
    """Repository interface for agent operations."""
    
    async def create(self, agent: AgentModel) -> str:
        """
        Create a new agent in the database.
        
        Args:
            agent: Agent model with data to store
            
        Returns:
            ID of the created agent
            
        Raises:
            AgentCreationError: If agent creation fails
            ValidationError: If agent data is invalid
        """
        ...
    
    async def get_by_id(self, agent_id: str) -> Optional[AgentModel]:
        """
        Retrieve an agent by ID.
        
        Args:
            agent_id: Unique identifier of the agent
            
        Returns:
            Agent model if found, None otherwise
        """
        ...
```

### 1.3 Performance Awareness

All contributors should be mindful of performance:

1. **Decorators**: Use `@log_execution_time` for monitoring critical methods
2. **Query Optimization**: Ensure Neo4j queries have appropriate indices
3. **Transaction Management**: Use explicit transactions for multi-operation sequences
4. **Resource Efficiency**: Be aware of memory and CPU usage in algorithms
5. **Benchmarking**: Include performance tests for critical operations

```python
# Example of performance-aware method
@log_execution_time
async def find_optimal_team_composition(
    task_id: str, max_team_size: int = 5
) -> List[Dict[str, Any]]:
    """
    Find optimal team composition for a task using graph neural network recommendations.
    
    Args:
        task_id: ID of the task
        max_team_size: Maximum number of agents in the team
        
    Returns:
        List of agent records with match scores
    """
    # Implementation with transaction handling
    async with self._driver.session() as session:
        async with session.begin_transaction() as tx:
            # Optimized query with proper indices
            result = await tx.run(
                """
                MATCH (t:Task {id: $task_id})
                MATCH (a:Agent)-[h:HAS_CAPABILITY]->(c:Capability)<-[r:REQUIRES]-(t)
                WHERE a.status = 'idle' AND h.proficiency >= r.preferred_proficiency
                WITH a, t, sum(h.proficiency * r.importance) as match_score
                ORDER BY match_score DESC
                LIMIT $max_team_size
                RETURN a.id as agent_id, a.name as name, match_score
                """,
                task_id=task_id,
                max_team_size=max_team_size
            )
            return [record async for record in result]
```

## 2. Development Workflow

### 2.1 Setting Up Development Environment

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/agent-party/agent-party.git
   cd agent-party
   ```

2. **Create a Virtual Environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install Dependencies**:
   ```bash
   pip install -e ".[dev]"
   ```

4. **Setup Pre-commit Hooks**:
   ```bash
   pre-commit install
   ```

5. **Setup Development Databases**:
   ```bash
   docker-compose up -d neo4j kafka redis
   ```

6. **Run Tests to Verify Setup**:
   ```bash
   pytest
   ```

### 2.2 Development Process

1. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Implement Using TDD**:
   - Write tests first
   - Implement the minimal code to pass tests
   - Refactor while keeping tests passing

3. **Run Quality Checks**:
   ```bash
   # Run tests with coverage
   pytest --cov=agent_party tests/ --cov-report=term-missing --cov-report=xml

   # Run type checking
   mypy src/agent_party

   # Run linters
   black src tests
   isort src tests
   flake8 src tests
   ```

4. **Create Pull Request**:
   - Push your branch
   - Create a PR with clear description
   - Link to relevant issues
   - Wait for CI checks to complete

### 2.3 Sprint Workflow

Contributions should align with the current sprint:

1. **Sprint Planning**:
   - Review the sprint board for assigned tasks
   - Understand task requirements and acceptance criteria
   - Break down complex tasks into smaller increments

2. **Daily Progress**:
   - Update task status on the sprint board
   - Communicate blockers early
   - Maintain working code at all times

3. **Sprint Review**:
   - Demonstrate completed features
   - Collect feedback for improvements
   - Document any technical decisions made

4. **Sprint Retrospective**:
   - Identify what went well
   - Suggest process improvements
   - Update documentation based on learnings

## 3. Code Structure

### 3.1 Service Architecture

Follow the established service architecture pattern:

1. **Service Registry**: All services must be registered with ServiceRegistry
2. **Protocol Interfaces**: Define interfaces before implementation
3. **Service Scoping**: Use appropriate scoping (singleton, transient, scoped)
4. **Dependency Injection**: Use constructor injection for dependencies

```python
# Example of service registration
class ServiceRegistry:
    """Registry for all services with dependency injection."""
    
    _instance = None
    _services: Dict[Type, Any] = {}
    
    @classmethod
    def register_singleton(cls, interface: Type, implementation: Any) -> None:
        """Register a singleton service implementation."""
        cls._services[interface] = implementation
    
    @classmethod
    def get(cls, interface: Type) -> Any:
        """Get a service implementation for the given interface."""
        if interface not in cls._services:
            raise ServiceNotFoundError(f"Service not found for interface: {interface}")
        return cls._services[interface]

# Usage
ServiceRegistry.register_singleton(AgentRepositoryProtocol, Neo4jAgentRepository(driver))
```

### 3.2 Repository Implementation

Database access follows the repository pattern:

1. **Interface First**: Define repository interface before implementation
2. **Query Optimization**: Use appropriate indices and query patterns
3. **Transaction Management**: Use explicit transactions for multi-operation sequences
4. **Error Handling**: Implement proper error handling and validation

```python
# Example Neo4j repository implementation
class Neo4jAgentRepository(AgentRepositoryProtocol):
    """Neo4j implementation of the agent repository."""
    
    def __init__(self, driver: neo4j.AsyncDriver):
        self._driver = driver
    
    @log_execution_time
    async def create(self, agent: AgentModel) -> str:
        """Create a new agent in the database."""
        try:
            async with self._driver.session() as session:
                # Use transactions for data consistency
                result = await session.execute_write(
                    self._create_agent_tx, agent.dict()
                )
                return result
        except neo4j.exceptions.ConstraintError as e:
            raise AgentCreationError(f"Agent already exists: {str(e)}")
        except Exception as e:
            # Log the error with details
            logger.error(f"Failed to create agent: {str(e)}", exc_info=True)
            raise AgentCreationError(f"Failed to create agent: {str(e)}")
    
    @staticmethod
    async def _create_agent_tx(tx: neo4j.AsyncTransaction, agent_data: Dict[str, Any]) -> str:
        """Transaction function to create an agent."""
        # Optimize query with MERGE to prevent duplicates
        query = """
        MERGE (a:Agent {id: $id})
        ON CREATE SET 
            a.name = $name,
            a.role = $role,
            a.personality = $personality,
            a.model = $model,
            a.status = $status,
            a.created_at = datetime(),
            a.updated_at = datetime()
        RETURN a.id as id
        """
        result = await tx.run(query, **agent_data)
        record = await result.single()
        return record["id"]
```

### 3.3 Event Processing

Event-driven architecture principles:

1. **Schema Definition**: Use Pydantic for event schema definition
2. **Idempotent Handlers**: Ensure event handlers are safely replayable
3. **Error Recovery**: Implement proper error recovery for failed events
4. **Event Validation**: Validate events before processing

```python
# Example event definition
class AgentCreatedEvent(BaseModel):
    """Event emitted when a new agent is created."""
    
    event_id: UUID
    event_type: Literal["agent.created"]
    timestamp: datetime
    version: str = "1.0"
    producer: str
    agent_id: UUID
    name: str
    role: str
    model: str
    personality: str
    cost_per_token: float
    created_by: Optional[UUID] = None

# Example event handler
class AgentEventHandler:
    """Handler for agent-related events."""
    
    def __init__(self, agent_repository: AgentRepositoryProtocol):
        self.agent_repository = agent_repository
    
    @log_execution_time
    async def handle_agent_created(self, event: AgentCreatedEvent) -> None:
        """
        Handle agent created event.
        
        Idempotent implementation - safe to replay the same event multiple times.
        """
        # Check if agent already exists (idempotence)
        existing_agent = await self.agent_repository.get_by_id(str(event.agent_id))
        if existing_agent:
            logger.info(f"Agent already exists, skipping creation: {event.agent_id}")
            return
        
        # Create agent from event data
        agent = AgentModel(
            id=str(event.agent_id),
            name=event.name,
            role=event.role,
            personality=event.personality,
            model=event.model,
            status="initializing",
            cost_per_token=event.cost_per_token,
            created_at=event.timestamp,
            updated_at=event.timestamp
        )
        
        await self.agent_repository.create(agent)
        logger.info(f"Agent created from event: {event.agent_id}")
```

## 4. Testing Strategy

### 4.1 Testing Approach

Follow these testing principles:

1. **Module-Focused Testing**: Complete one module before moving to the next
2. **Test Categories**:
   - Unit tests: Test individual functions and methods
   - Integration tests: Test interactions between components
   - End-to-end tests: Test complete workflows
   - Performance tests: Verify system meets performance requirements

3. **Mocking Strategy**:
   - Use proper mocking for external dependencies
   - Create test fixtures for database setup/teardown
   - Use integration tests with test containers for external services

### 4.2 Writing Tests

Use pytest for all tests:

```python
# Example unit test
import pytest
from unittest.mock import AsyncMock, patch

@pytest.mark.asyncio
async def test_agent_repository_create():
    # Setup
    mock_driver = AsyncMock()
    mock_session = AsyncMock()
    mock_driver.session.return_value.__aenter__.return_value = mock_session
    mock_session.execute_write.return_value = "test-agent-id"
    
    agent_repo = Neo4jAgentRepository(mock_driver)
    agent = AgentModel(
        name="Test Agent",
        role="assistant",
        personality="helpful",
        model="gpt-4",
        status="initializing"
    )
    
    # Execute
    result = await agent_repo.create(agent)
    
    # Assert
    assert result == "test-agent-id"
    mock_session.execute_write.assert_called_once()
    
@pytest.mark.asyncio
async def test_agent_repository_create_handles_constraint_error():
    # Setup
    mock_driver = AsyncMock()
    mock_session = AsyncMock()
    mock_driver.session.return_value.__aenter__.return_value = mock_session
    mock_session.execute_write.side_effect = neo4j.exceptions.ConstraintError("Duplicate agent")
    
    agent_repo = Neo4jAgentRepository(mock_driver)
    agent = AgentModel(
        name="Test Agent",
        role="assistant",
        personality="helpful",
        model="gpt-4",
        status="initializing"
    )
    
    # Execute & Assert
    with pytest.raises(AgentCreationError, match="Agent already exists"):
        await agent_repo.create(agent)
```

### 4.3 Integration Testing

For Neo4j and other dependencies:

```python
# Example integration test with Neo4j test container
import pytest
import asyncio
from testcontainers.neo4j import Neo4jContainer

@pytest.fixture(scope="module")
async def neo4j_container():
    container = Neo4jContainer("neo4j:4.4")
    container.start()
    
    # Create Neo4j driver
    uri = f"neo4j://{container.get_container_host_ip()}:{container.get_exposed_port(7687)}"
    driver = neo4j.AsyncGraphDatabase.driver(
        uri, auth=("neo4j", container.password)
    )
    
    # Setup schema
    async with driver.session() as session:
        await session.run("CREATE CONSTRAINT agent_id IF NOT EXISTS FOR (a:Agent) REQUIRE a.id IS UNIQUE")
    
    yield driver
    
    # Cleanup
    await driver.close()
    container.stop()

@pytest.mark.asyncio
async def test_agent_repository_integration(neo4j_container):
    # Setup
    repo = Neo4jAgentRepository(neo4j_container)
    agent = AgentModel(
        name="Integration Test Agent",
        role="assistant",
        personality="helpful",
        model="gpt-4",
        status="initializing"
    )
    
    # Execute
    agent_id = await repo.create(agent)
    
    # Assert
    retrieved_agent = await repo.get_by_id(agent_id)
    assert retrieved_agent is not None
    assert retrieved_agent.name == "Integration Test Agent"
    assert retrieved_agent.role == "assistant"
    
    # Cleanup
    await repo.delete(agent_id)
```

## 5. Code Review Process

### 5.1 Pull Request Requirements

All PRs must meet these requirements:

1. **Tests**: Include comprehensive tests with 100% coverage
2. **Documentation**: Update relevant documentation and docstrings
3. **Quality Checks**: Pass all linting and type checking
4. **Performance**: No significant performance regressions
5. **Dependencies**: No unnecessary dependencies added

### 5.2 Review Checklist

Reviewers will check for:

1. **Code Quality**:
   - Follows SOLID principles
   - Proper error handling
   - Performance considerations
   - Clean and maintainable code

2. **Testing Quality**:
   - Tests cover both positive and negative cases
   - Edge cases are tested
   - Mocks are used appropriately
   - Integration tests where needed

3. **Documentation**:
   - Clear docstrings with types
   - Updated README or documentation
   - Architecture decisions documented

4. **Security and Performance**:
   - No security vulnerabilities
   - Efficient database queries
   - Proper transaction handling
   - Resource usage considerations

### 5.3 Merge Process

Only merge code that:

1. Has been approved by at least one reviewer
2. Passes all CI checks
3. Has no merge conflicts
4. Maintains or improves code quality metrics

## 6. Documentation Standards

### 6.1 Code Documentation

All code should be documented following these guidelines:

1. **Docstrings**: Use Google style docstrings with type information
2. **Comments**: Explain "why" not just "what"
3. **Examples**: Include examples for complex functionality
4. **Architecture**: Document architectural decisions and rationales

```python
def calculate_collaboration_score(
    interaction_count: int, success_rate: float, duration_days: int
) -> float:
    """
    Calculate a collaboration score between agents based on their interaction history.
    
    The score is computed using a weighted formula that considers the number of 
    successful interactions, their success rate, and the duration of collaboration.
    Higher values indicate stronger collaboration patterns.
    
    Args:
        interaction_count: Number of interactions between agents
        success_rate: Rate of successful interactions (0.0-1.0)
        duration_days: Duration of collaboration in days
        
    Returns:
        A collaboration score between 0.0 and 1.0
        
    Examples:
        >>> calculate_collaboration_score(100, 0.9, 30)
        0.85
        >>> calculate_collaboration_score(10, 0.5, 5)
        0.3
    """
    # Calculate base score from success rate
    base_score = success_rate * 0.6
    
    # Apply logarithmic scaling to interaction count
    # (more interactions provide diminishing returns)
    interaction_factor = min(1.0, math.log(interaction_count + 1) / math.log(100)) * 0.3
    
    # Apply time decay factor
    # (recent collaborations are weighted more heavily)
    time_factor = min(1.0, duration_days / 90) * 0.1
    
    return base_score + interaction_factor + time_factor
```

### 6.2 Project Documentation

Maintain comprehensive project documentation:

1. **README**: Keep the main README up to date
2. **Architecture**: Document system architecture and components
3. **API Reference**: Maintain accurate API documentation
4. **Developer Guides**: Update guides for development workflows
5. **Decision Records**: Document architecture decisions

## 7. Release Process

### 7.1 Version Management

Follow semantic versioning:

1. **Major**: Breaking changes to APIs or core functionality
2. **Minor**: New features without breaking changes
3. **Patch**: Bug fixes and minor improvements

### 7.2 Release Steps

1. **Create Release Branch**:
   ```bash
   git checkout -b release/v1.2.0
   ```

2. **Update Version**:
   ```bash
   # Update version in pyproject.toml and __init__.py
   ```

3. **Run Final Tests**:
   ```bash
   pytest --cov=agent_party tests/
   ```

4. **Create Pull Request**:
   - Create a PR from release branch to main
   - Wait for approvals and CI checks

5. **Merge and Tag**:
   ```bash
   git checkout main
   git pull
   git tag -a v1.2.0 -m "Release v1.2.0"
   git push origin v1.2.0
   ```

6. **Publish Release**:
   - Create GitHub release with release notes
   - If applicable, publish to PyPI

## 8. Troubleshooting Common Development Issues

### 8.1 Test Failures

1. **Database Connection Issues**:
   ```bash
   # Check Neo4j connection
   python -c "from neo4j import GraphDatabase; \
     conn = GraphDatabase.driver('neo4j://localhost:7687', auth=('neo4j', 'password')); \
     print(conn.verify_connectivity())"
   ```

2. **Test Dependencies**:
   ```bash
   # Ensure all test dependencies are installed
   pip install -e ".[dev,test]"
   ```

3. **Async Test Issues**:
   ```python
   # Ensure proper event loop handling in async tests
   @pytest.mark.asyncio
   async def test_async_function():
       # Test implementation
   ```

### 8.2 Common Errors

1. **Type Checking Errors**:
   ```bash
   # Run mypy with verbose output
   mypy --show-error-codes src/agent_party
   ```

2. **Linting Errors**:
   ```bash
   # Fix common formatting issues automatically
   black src tests
   isort src tests
   ```

3. **Import Errors**:
   ```bash
   # Check package installation
   pip install -e .
   ```
