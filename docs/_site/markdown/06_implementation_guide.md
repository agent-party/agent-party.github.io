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

## Test-Driven Development Practice

### Test Structure

Each component should have a corresponding test module structured as follows:

```
tests/
├── unit/                  # Fast tests with mocked dependencies
│   ├── repositories/      # Repository tests
│   ├── services/          # Service tests
│   └── api/               # API endpoint tests
├── integration/           # Tests with actual dependencies
│   ├── repositories/      # Database integration tests
│   ├── messaging/         # Kafka integration tests
│   └── api/               # API integration tests
└── fixtures/              # Shared test fixtures and data
```

### Test-First Workflow

Follow this workflow for implementing any new feature:

1. **Define Interface**: Create Protocol class defining the component contract
2. **Write Tests**: Create unit tests that validate the expected behavior
3. **Implement Feature**: Write the minimum code needed to pass tests
4. **Refactor**: Clean up code while maintaining test coverage
5. **Integration Tests**: Add tests that verify integration with dependencies
6. **Documentation**: Update documentation to reflect implementation

### Neo4j Testing Strategy

For Neo4j database testing:

```python
import pytest
from neo4j.exceptions import DriverError
from testcontainers.neo4j import Neo4jContainer

@pytest.fixture(scope="session")
def neo4j_container():
    """Start Neo4j test container for integration tests."""
    container = Neo4jContainer("neo4j:5.5")
    with container as neo4j:
        yield neo4j
        
@pytest.fixture
def neo4j_session(neo4j_container):
    """Create a new Neo4j session for each test."""
    from neo4j import GraphDatabase
    
    uri = neo4j_container.get_connection_url()
    driver = GraphDatabase.driver(
        uri,
        auth=(neo4j_container.get_username(), neo4j_container.get_password())
    )
    
    # Initialize schema and constraints
    with driver.session() as session:
        session.run("CREATE CONSTRAINT agent_id IF NOT EXISTS FOR (a:Agent) ASSERT a.id IS UNIQUE")
        # Add other schema setup
    
    # Provide session for test
    with driver.session() as session:
        yield session
        
    # Clean up after test
    with driver.session() as session:
        session.run("MATCH (n) DETACH DELETE n")
```

### Test Coverage Metrics

Use pytest with coverage.py to measure test coverage:

```bash
# Run tests with coverage
pytest --cov=agent_party --cov-report=term --cov-report=html:coverage

# Fail if coverage is below threshold
pytest --cov=agent_party --cov-fail-under=95
```

Enable coverage reporting in the CI/CD pipeline:

```yaml
test:
  stage: test
  script:
    - poetry install
    - poetry run pytest --cov=agent_party --cov-report=term --cov-report=xml:coverage.xml
  artifacts:
    paths:
      - coverage.xml
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage.xml
```

### Property-Based Testing

Use Hypothesis for property-based testing of complex data structures:

```python
from hypothesis import given, strategies as st

@given(
    st.lists(
        st.dictionaries(
            keys=st.text(), 
            values=st.one_of(st.text(), st.integers()), 
            min_size=1
        ),
        min_size=1
    )
)
def test_capability_matching_properties(capabilities):
    """Test that capability matching follows expected properties."""
    # Property 1: Adding a capability never reduces match score
    # Property 2: Perfect match has score of 1.0
    # Property 3: No matching capabilities has score of 0.0
    
    # Test implementation
    initial_match = calculate_match_score(task_requirements, agent_capabilities)
    
    # Add one more capability
    enhanced_capabilities = agent_capabilities + [capabilities[0]]
    enhanced_match = calculate_match_score(task_requirements, enhanced_capabilities)
    
    # Property 1: Score never decreases with more capabilities
    assert enhanced_match >= initial_match
```

### Mocking Strategy

Use mocks to isolate units under test:

```python
from unittest.mock import Mock, patch

@pytest.fixture
def mock_neo4j_service():
    """Create a mock Neo4j service for testing."""
    mock = Mock(spec=Neo4jService)
    # Setup expected return values
    mock.get_agent_by_id.return_value = {
        "id": "test-agent",
        "name": "Test Agent",
        "capabilities": ["coding", "testing"]
    }
    return mock
    
def test_agent_service_get_agent(mock_neo4j_service):
    """Test retrieving an agent through the service layer."""
    # Arrange
    service = AgentService(neo4j_service=mock_neo4j_service)
    
    # Act
    agent = service.get_agent("test-agent")
    
    # Assert
    assert agent.id == "test-agent"
    mock_neo4j_service.get_agent_by_id.assert_called_once_with("test-agent")
```

### Performance Testing

Include performance tests with execution time tracking:

```python
@log_execution_time
def test_large_graph_query_performance():
    """Test query performance with a large graph."""
    # Arrange
    service = Neo4jService(config)
    
    # Generate large test dataset
    generate_test_graph(
        nodes=10000,
        relationships=50000
    )
    
    # Act & Assert: Query should complete within timeout
    with timeout(seconds=5):
        result = service.find_collaboration_paths(
            source_id="agent-1",
            target_id="agent-2",
            max_depth=3
        )
        assert result is not None
```

## Architecture Patterns

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

## Acceptance Workflows

### Workflow Architecture

Agent Party implements a multi-stage acceptance workflow for agent outputs and team deliverables:

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  Output       │     │  Automated    │     │  Human        │     │  Manager      │
│  Generation   │────►│  Validation   │────►│  Review       │────►│  Approval     │
└───────────────┘     └───────┬───────┘     └───────┬───────┘     └───────┬───────┘
                              │                     │                     │
                              ▼                     ▼                     ▼
                      ┌───────────────┐     ┌───────────────┐     ┌───────────────┐
                      │  Validation   │     │  Feedback     │     │  Policy       │
                      │  Metrics      │     │  Collection   │     │  Enforcement  │
                      └───────────────┘     └───────────────┘     └───────────────┘
```

Each workflow consists of:

1. **Automatic Validation**: Programmatic verification of outputs
2. **Human Review**: Subject matter expert evaluation
3. **Manager Approval**: Final authority acceptance
4. **Feedback Loops**: Continuous improvement mechanisms

### Workflow Implementation

#### Workflow State Machine

The acceptance workflow is implemented as a state machine:

```python
class WorkflowState(Enum):
    """Workflow states for the acceptance process."""
    
    CREATED = "created"
    VALIDATING = "validating"
    VALIDATION_FAILED = "validation_failed"
    AWAITING_REVIEW = "awaiting_review"
    REVIEW_PASSED = "review_passed"
    REVIEW_FAILED = "review_failed"
    AWAITING_APPROVAL = "awaiting_approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    COMPLETED = "completed"
    ERROR = "error"

class WorkflowTransition(BaseModel):
    """Model for state transitions in a workflow."""
    
    from_state: WorkflowState
    to_state: WorkflowState
    timestamp: datetime
    reason: str
    actor_id: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
```

#### Implementing Validation

Automatic validation ensures outputs meet basic requirements:

```python
class OutputValidator(Protocol):
    """Protocol for output validators."""
    
    async def validate(self, output: Dict[str, Any]) -> ValidationResult:
        """
        Validate an output against predefined criteria.
        
        Args:
            output: Output to validate
            
        Returns:
            Validation result with status and any validation errors
        """
        ...

class ValidationResult(BaseModel):
    """Result of a validation operation."""
    
    valid: bool
    errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    metrics: Dict[str, Any] = Field(default_factory=dict)

class CompositeValidator:
    """Combines multiple validators into a single validation process."""
    
    def __init__(self, validators: List[OutputValidator]):
        self.validators = validators
        
    async def validate(self, output: Dict[str, Any]) -> ValidationResult:
        """Run all validators and combine results."""
        results = await asyncio.gather(*[
            validator.validate(output) for validator in self.validators
        ])
        
        # Combine all validation results
        valid = all(result.valid for result in results)
        errors = [error for result in results for error in result.errors]
        warnings = [warning for result in results for warning in result.warnings]
        
        # Merge metrics
        metrics = {}
        for result in results:
            metrics.update(result.metrics)
            
        return ValidationResult(
            valid=valid,
            errors=errors,
            warnings=warnings,
            metrics=metrics
        )
```

#### Human Review Interface

Human review collects qualitative feedback:

```python
class ReviewRequest(BaseModel):
    """Request for human review of an output."""
    
    id: str
    output_id: str
    output_type: str
    output_data: Dict[str, Any]
    context: Dict[str, Any]
    assigned_reviewer_id: Optional[str] = None
    created_at: datetime
    deadline: Optional[datetime] = None
    priority: int = 1  # 1 (lowest) to 5 (highest)

class ReviewFeedback(BaseModel):
    """Feedback from a human reviewer."""
    
    review_request_id: str
    reviewer_id: str
    decision: Literal["approve", "reject", "revise"]
    feedback: str
    quality_score: int  # 1 (lowest) to 5 (highest)
    categories: List[str] = Field(default_factory=list)
    suggested_improvements: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime
```

#### Manager Approval System

Manager approval enforces organizational policies:

```python
class ApprovalPolicy(BaseModel):
    """Policy for managing approval requirements."""
    
    id: str
    name: str
    description: str
    output_types: List[str]
    conditions: Dict[str, Any]
    required_approvers: int = 1
    escalation_threshold: timedelta = Field(default_factory=lambda: timedelta(hours=24))
    auto_approval_criteria: Optional[Dict[str, Any]] = None

class ApprovalService:
    """Service for managing the approval process."""
    
    def __init__(
        self,
        policy_repository: PolicyRepository,
        workflow_repository: WorkflowRepository,
        notification_service: NotificationService,
        event_publisher: EventPublisher
    ):
        self.policy_repository = policy_repository
        self.workflow_repository = workflow_repository
        self.notification_service = notification_service
        self.event_publisher = event_publisher
        
    async def create_approval_request(
        self,
        output_id: str,
        output_type: str,
        output_data: Dict[str, Any],
        context: Dict[str, Any],
        requester_id: str
    ) -> str:
        """Create a new approval request."""
        # Determine applicable policies
        policies = await self.policy_repository.get_policies_for_output(output_type)
        
        # Create approval workflow
        workflow_id = await self.workflow_repository.create_workflow(
            output_id=output_id,
            output_type=output_type,
            initial_state=WorkflowState.AWAITING_APPROVAL,
            policies=[policy.id for policy in policies],
            requester_id=requester_id,
            context=context
        )
        
        # Check for auto-approval
        for policy in policies:
            if policy.auto_approval_criteria and self._meets_auto_criteria(
                output_data, policy.auto_approval_criteria
            ):
                await self.approve(
                    workflow_id=workflow_id,
                    approver_id="system",
                    reason="Met auto-approval criteria"
                )
                return workflow_id
                
        # Notify potential approvers
        await self._notify_approvers(workflow_id, policies)
        
        # Publish event
        await self.event_publisher.publish_event(
            "approval_request_created",
            {
                "workflow_id": workflow_id,
                "output_id": output_id,
                "output_type": output_type,
                "requester_id": requester_id
            }
        )
        
        return workflow_id
```

### Feedback Integration

Feedback from the acceptance process is used to improve future outputs:

```python
class FeedbackRepository:
    """Repository for storing and retrieving feedback data."""
    
    def __init__(self, neo4j_service: Neo4jService):
        self.neo4j_service = neo4j_service
        
    async def record_feedback(
        self,
        source_id: str,
        source_type: str,
        feedback_type: str,
        content: str,
        metadata: Dict[str, Any] = None
    ) -> str:
        """Record feedback for later analysis and learning."""
        feedback_id = str(uuid.uuid4())
        timestamp = datetime.now()
        
        query = """
        MATCH (source)
        WHERE (source:Agent OR source:Team) AND source.id = $source_id
        CREATE (f:Feedback {
            id: $feedback_id,
            type: $feedback_type,
            content: $content,
            timestamp: $timestamp,
            metadata: $metadata
        })
        CREATE (source)-[:RECEIVED_FEEDBACK]->(f)
        RETURN f.id as feedback_id
        """
        
        parameters = {
            "source_id": source_id,
            "feedback_id": feedback_id,
            "feedback_type": feedback_type,
            "content": content,
            "timestamp": timestamp.isoformat(),
            "metadata": metadata or {}
        }
        
        result = await self.neo4j_service.execute_query(query, parameters, write=True)
        return result[0]["feedback_id"]
        
    async def get_feedback_for_training(
        self,
        limit: int = 100,
        feedback_types: List[str] = None
    ) -> List[Dict[str, Any]]:
        """Retrieve feedback for training the GNN model."""
        query = """
        MATCH (source)-[:RECEIVED_FEEDBACK]->(f:Feedback)
        WHERE source:Agent OR source:Team
        """
        
        parameters = {}
        
        if feedback_types:
            query += " AND f.type IN $feedback_types"
            parameters["feedback_types"] = feedback_types
            
        query += """
        RETURN
            source.id AS source_id,
            LABELS(source)[0] AS source_type,
            f.id AS feedback_id,
            f.type AS feedback_type,
            f.content AS content,
            f.timestamp AS timestamp,
            f.metadata AS metadata
        ORDER BY f.timestamp DESC
        LIMIT $limit
        """
        
        parameters["limit"] = limit
        
        return await self.neo4j_service.execute_query(query, parameters)
```

### Human-in-the-Loop Controls

The system provides interfaces for human control and intervention:

```python
@router.post("/workflows/{workflow_id}/approve")
async def approve_workflow(
    workflow_id: str,
    approval: ApprovalRequest,
    current_user: User = Depends(get_current_user)
):
    """Approve a workflow step."""
    if not await authorization_service.can_approve(current_user.id, workflow_id):
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to approve this workflow"
        )
        
    try:
        result = await approval_service.approve(
            workflow_id=workflow_id,
            approver_id=current_user.id,
            reason=approval.reason,
            metadata=approval.metadata
        )
        return result
    except WorkflowError as e:
        raise HTTPException(status_code=400, detail=str(e))
```

### Implementing Manager Agents

Manager agents can provide automated approvals based on policies:

```python
class ManagerAgent:
    """Agent responsible for approving or rejecting outputs based on policies."""
    
    def __init__(
        self,
        policy_repository: PolicyRepository,
        agent_service: AgentService,
        model_provider: ModelProvider,
        event_publisher: EventPublisher
    ):
        self.policy_repository = policy_repository
        self.agent_service = agent_service
        self.model_provider = model_provider
        self.event_publisher = event_publisher
        
    async def evaluate_approval_request(
        self,
        workflow_id: str,
        output_data: Dict[str, Any],
        context: Dict[str, Any]
    ) -> ApprovalDecision:
        """Evaluate an approval request against policies."""
        # Get applicable policies
        output_type = context.get("output_type")
        policies = await self.policy_repository.get_policies_for_output(output_type)
        
        # Check each policy
        policy_results = []
        for policy in policies:
            result = await self._evaluate_policy(policy, output_data, context)
            policy_results.append(result)
            
        # Make decision
        if all(result.complies for result in policy_results):
            decision = "approve"
            reason = "All policies satisfied"
        else:
            decision = "reject"
            reason = "Failed to satisfy policies: " + ", ".join(
                result.policy_name for result in policy_results if not result.complies
            )
            
        # Record decision
        await self.event_publisher.publish_event(
            "manager_approval_decision",
            {
                "workflow_id": workflow_id,
                "decision": decision,
                "reason": reason,
                "policy_results": [result.dict() for result in policy_results]
            }
        )
        
        return ApprovalDecision(
            workflow_id=workflow_id,
            decision=decision,
            reason=reason,
            policy_results=policy_results,
            timestamp=datetime.now()
        )
```

## Integration Testing Strategy

Agent Party implements a comprehensive integration testing strategy to ensure all components work together seamlessly. This section details the testing approach for Neo4j integration, GNN model validation, and end-to-end workflows.

### Neo4j Test Containers

For Neo4j database testing:

```python
import pytest
from testcontainers.neo4j import Neo4jContainer

@pytest.fixture(scope="session")
def neo4j_container():
    """Start Neo4j test container for integration tests."""
    container = Neo4jContainer("neo4j:5.5")
    with container as neo4j:
        yield neo4j
        
@pytest.fixture
def neo4j_session(neo4j_container):
    """Create a new Neo4j session for each test."""
    from neo4j import GraphDatabase
    
    uri = neo4j_container.get_connection_url()
    driver = GraphDatabase.driver(
        uri,
        auth=(neo4j_container.get_username(), neo4j_container.get_password())
    )
    
    # Initialize schema and constraints
    with driver.session() as session:
        session.run("CREATE CONSTRAINT agent_id IF NOT EXISTS FOR (a:Agent) ASSERT a.id IS UNIQUE")
        # Add other schema setup
    
    # Provide session for test
    with driver.session() as session:
        yield session
        
    # Clean up after test
    with driver.session() as session:
        session.run("MATCH (n) DETACH DELETE n")
```

### Graph Database Integration Tests

Tests for Neo4j service interactions should validate both data persistence and graph traversal operations:

```python
class TestNeo4jIntegration:
    """Integration tests for Neo4j service."""
    
    @pytest.mark.asyncio
    async def test_create_and_retrieve_agent(self, neo4j_service):
        """Test creating and retrieving an agent."""
        # Create test agent
        agent_id = str(uuid.uuid4())
        agent_data = {
            "id": agent_id,
            "name": "Test Agent",
            "type": "human",
            "properties": {
                "expertise": ["python", "testing"],
                "availability": 0.8
            }
        }
        
        # Create agent in database
        result = await neo4j_service.execute_query("""
            CREATE (a:Agent {
                id: $id,
                name: $name,
                type: $type,
                properties: $properties,
                created_at: datetime()
            })
            RETURN a.id as id
        """, agent_data, write=True)
        
        assert result[0]["id"] == agent_id
        
        # Retrieve agent
        retrieved = await neo4j_service.execute_query("""
            MATCH (a:Agent {id: $id})
            RETURN a.id as id, a.name as name, a.type as type, a.properties as properties
        """, {"id": agent_id})
        
        assert len(retrieved) == 1
        assert retrieved[0]["id"] == agent_id
        assert retrieved[0]["name"] == "Test Agent"
        assert "python" in retrieved[0]["properties"]["expertise"]
        
    @pytest.mark.asyncio
    async def test_graph_relationships(self, neo4j_service):
        """Test creating and querying graph relationships."""
        # Create test nodes
        agent1_id = str(uuid.uuid4())
        agent2_id = str(uuid.uuid4())
        capability_id = "python_testing"
        
        # Create agents and capability
        await neo4j_service.execute_query("""
            CREATE (a1:Agent {id: $agent1_id, name: "Agent 1"})
            CREATE (a2:Agent {id: $agent2_id, name: "Agent 2"})
            CREATE (c:Capability {name: $capability_id, description: "Python testing"})
            CREATE (a1)-[:HAS_CAPABILITY {proficiency: 0.9}]->(c)
            CREATE (a2)-[:HAS_CAPABILITY {proficiency: 0.7}]->(c)
            CREATE (a1)-[:COLLABORATED_WITH {projects: 2, success_rate: 0.95}]->(a2)
        """, {
            "agent1_id": agent1_id,
            "agent2_id": agent2_id,
            "capability_id": capability_id
        }, write=True)
        
        # Test relationship query
        result = await neo4j_service.execute_query("""
            MATCH (a1:Agent {id: $agent1_id})-[r:HAS_CAPABILITY]->(c:Capability)
            RETURN c.name as capability, r.proficiency as proficiency
        """, {"agent1_id": agent1_id})
        
        assert len(result) == 1
        assert result[0]["capability"] == capability_id
        assert result[0]["proficiency"] == 0.9
        
        # Test path query
        paths = await neo4j_service.execute_query("""
            MATCH path = (a1:Agent {id: $agent1_id})-[:COLLABORATED_WITH]->(a2:Agent)-[:HAS_CAPABILITY]->(c:Capability)
            RETURN a2.id as collaborator_id, c.name as capability
        """, {"agent1_id": agent1_id})
        
        assert len(paths) == 1
        assert paths[0]["collaborator_id"] == agent2_id
        assert paths[0]["capability"] == capability_id
```

### GNN Model Testing

Testing the Graph Neural Network model requires validating both the model training process and its prediction capabilities:

```python
class TestGNNModelIntegration:
    """Integration tests for the GNN model."""
    
    @pytest.fixture(scope="class")
    async def graph_data_loader(self, neo4j_service):
        """Create a graph data loader using the Neo4j service."""
        return GraphDataLoader(neo4j_service)
    
    @pytest.fixture(scope="class")
    async def gnn_model(self, graph_data_loader):
        """Create and train a test GNN model."""
        model = TeamFormationGNN(
            node_features=64,
            edge_features=16,
            hidden_channels=32,
            num_layers=2
        )
        
        # Load test data
        graph_data = await graph_data_loader.load_training_data(
            limit=100,
            include_node_types=["Agent", "Capability", "Team"],
            include_edge_types=["HAS_CAPABILITY", "MEMBER_OF", "REQUIRES"]
        )
        
        # Train with minimal epochs for testing
        trainer = GNNTrainer(model, lr=0.01)
        await trainer.train(
            graph_data,
            epochs=5,
            batch_size=32,
            validation_split=0.2
        )
        
        return model
    
    @pytest.mark.asyncio
    async def test_team_recommendation(self, gnn_model, graph_data_loader):
        """Test team recommendations from the GNN."""
        # Create test task
        task_data = {
            "id": "test_task",
            "title": "Test Integration",
            "requirements": ["python", "testing", "graph_databases"],
            "priority": 3
        }
        
        # Create recommendation service with the model
        recommender = TeamRecommendationService(
            graph_data_loader=graph_data_loader,
            gnn_model=gnn_model
        )
        
        # Get recommendations
        recommendations = await recommender.recommend_team(
            task=task_data,
            team_size=3,
            diversity_weight=0.3,
            expertise_weight=0.7
        )
        
        # Validate structure of recommendations
        assert len(recommendations) > 0
        assert "team_score" in recommendations[0]
        assert "members" in recommendations[0]
        assert len(recommendations[0]["members"]) <= 3
        
        # Validate that recommended agents have required capabilities
        for recommendation in recommendations:
            for member in recommendation["members"]:
                assert "capabilities" in member
                # At least one member should have each required capability
                member_capabilities = [cap["name"] for cap in member["capabilities"]]
                assert any(req in member_capabilities for req in task_data["requirements"])
    
    @pytest.mark.asyncio
    async def test_model_serialization(self, gnn_model, tmp_path):
        """Test model serialization and deserialization."""
        # Save model
        model_path = tmp_path / "test_model.pt"
        await gnn_model.save(str(model_path))
        
        # Load model
        loaded_model = TeamFormationGNN.load(str(model_path))
        
        # Compare model parameters
        for p1, p2 in zip(gnn_model.parameters(), loaded_model.parameters()):
            assert torch.allclose(p1, p2)
```

### End-to-End Testing

End-to-end tests validate complete workflows from start to finish:

```python
class TestWorkflowsEndToEnd:
    """End-to-end tests for complete system workflows."""
    
    @pytest.fixture(scope="class")
    async def app_client(self, neo4j_service):
        """Create a test client for the FastAPI application."""
        # Set up app with test services
        app = create_test_app(neo4j_service)
        async with AsyncClient(app=app, base_url="http://test") as client:
            yield client
    
    @pytest.mark.asyncio
    async def test_team_formation_workflow(self, app_client, neo4j_service):
        """Test the complete team formation workflow."""
        # 1. Create a new task
        task_response = await app_client.post(
            "/tasks",
            json={
                "title": "Build API Integration",
                "description": "Create integration with external API",
                "requirements": ["python", "api_design", "testing"],
                "priority": 2,
                "deadline": (datetime.now() + timedelta(days=7)).isoformat()
            }
        )
        assert task_response.status_code == 201
        task_id = task_response.json()["id"]
        
        # 2. Request team recommendations
        recommendations_response = await app_client.get(
            f"/tasks/{task_id}/team-recommendations",
            params={"team_size": 3, "diversity_weight": 0.4}
        )
        assert recommendations_response.status_code == 200
        recommendations = recommendations_response.json()
        assert len(recommendations) > 0
        
        # 3. Select a recommended team
        team_selection = recommendations[0]
        team_response = await app_client.post(
            f"/tasks/{task_id}/team",
            json={
                "members": [member["id"] for member in team_selection["members"]]
            }
        )
        assert team_response.status_code == 201
        team_id = team_response.json()["id"]
        
        # 4. Check team formation in database
        team_data = await neo4j_service.execute_query("""
            MATCH (t:Team {id: $team_id})-[:ASSIGNED_TO]->(task:Task {id: $task_id})
            MATCH (a:Agent)-[:MEMBER_OF]->(t)
            RETURN t.id AS team_id, collect(a.id) AS member_ids
        """, {"team_id": team_id, "task_id": task_id})
        
        assert len(team_data) == 1
        assert team_data[0]["team_id"] == team_id
        assert len(team_data[0]["member_ids"]) <= 3
        
        # 5. Test team output submission
        output_response = await app_client.post(
            f"/teams/{team_id}/outputs",
            json={
                "title": "API Integration Implementation",
                "description": "Completed API integration",
                "content_url": "https://example.com/output.zip",
                "metadata": {
                    "language": "python",
                    "lines_of_code": 450,
                    "test_coverage": 0.92
                }
            }
        )
        assert output_response.status_code == 201
        output_id = output_response.json()["id"]
        
        # 6. Test approval workflow
        approval_response = await app_client.post(
            f"/outputs/{output_id}/request-approval",
            json={"reviewer_notes": "Ready for review"}
        )
        assert approval_response.status_code == 200
        workflow_id = approval_response.json()["workflow_id"]
        
        # 7. Verify workflow state
        workflow_response = await app_client.get(f"/workflows/{workflow_id}")
        assert workflow_response.status_code == 200
        assert workflow_response.json()["state"] in ["validating", "awaiting_review"]
        
        # 8. Performance measurement of the complete workflow
        performance_data = await neo4j_service.execute_query("""
            MATCH (w:Workflow {id: $workflow_id})
            RETURN w.created_at as start_time, w.state as current_state
        """, {"workflow_id": workflow_id})
        
        assert len(performance_data) == 1
        assert performance_data[0]["current_state"] is not None
```

### Performance Testing

Performance tests ensure the system can handle expected loads:

```python
@pytest.mark.benchmark
def test_neo4j_query_performance(benchmark):
    # Arrange
    test_text = "This is a sample agent description" * 100
    embedding_service = EmbeddingService()
    
    # Act & Assert
    result = benchmark(embedding_service.embed_text, test_text)
    assert len(result) == 1536  # Expected embedding size
```

### Mocking External Dependencies

For tests involving external services, proper mocking is essential:

```python
@pytest.fixture
def mock_model_provider():
    """Create a mock model provider for testing."""
    mock_provider = MagicMock(spec=ModelProvider)
    
    # Setup the mock to return predefined responses
    async def mock_generate_text(*args, **kwargs):
        prompt = kwargs.get("prompt", "")
        
        # Simulate different responses based on the prompt
        if "team formation" in prompt.lower():
            return {
                "text": "I recommend a team of 3 members with expertise in Python, testing, and graph databases.",
                "tokens": len(prompt.split()) + 20,
                "model": "gpt-4"
            }
        elif "code review" in prompt.lower():
            return {
                "text": "The code looks good. I suggest improving error handling in the database connection.",
                "tokens": len(prompt.split()) + 15,
                "model": "gpt-4"
            }
        else:
            return {
                "text": "I understand your request and can assist with that task.",
                "tokens": len(prompt.split()) + 10,
                "model": "gpt-4"
            }
    
    mock_provider.generate_text.side_effect = mock_generate_text
    return mock_provider


@pytest.mark.asyncio
async def test_agent_interaction(mock_model_provider):
    """Test agent interactions with mocked model provider."""
    # Create agent with mocked model provider
    agent = CognitiveAgent(
        id="test_agent",
        name="Test Agent",
        model_provider=mock_model_provider
    )
    
    # Test agent response
    response = await agent.process_task({
        "type": "team_formation",
        "description": "Form a team for developing a Python API"
    })
    
    # Verify model was called with appropriate parameters
    mock_model_provider.generate_text.assert_called()
    call_args = mock_model_provider.generate_text.call_args
    assert "team formation" in call_args[1]["prompt"].lower()
    
    # Verify agent processes the response correctly
    assert "recommend" in response.lower()
    assert "team" in response.lower()
```

## Observability and Monitoring

Effective observability is critical for understanding and optimizing agent operations. Agent Party implements a comprehensive observability strategy that tracks agent activities, resource usage, and system performance.

### Telemetry Architecture

The telemetry system captures data at multiple levels:

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│                  │     │                  │     │                  │
│  Agent Activity  │────►│  System Metrics  │────►│  Business KPIs   │
│                  │     │                  │     │                  │
└──────────────────┘     └──────────────────┘     └──────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│                  │     │                  │     │                  │
│  Trace Collector │     │  Metric Store    │     │  Analytics       │
│                  │     │                  │     │  Dashboard       │
└──────────────────┘     └──────────────────┘     └──────────────────┘
```

### Agent Telemetry

Agent telemetry tracks all agent operations and model interactions:

```python
class TelemetryRecorder:
    """Records telemetry data for agent operations."""
    
    def __init__(
        self,
        neo4j_service: Neo4jService,
        metric_publisher: MetricPublisher
    ):
        self.neo4j_service = neo4j_service
        self.metric_publisher = metric_publisher
        
    async def record_model_interaction(
        self,
        agent_id: str,
        model_name: str,
        operation: str,
        input_tokens: int,
        output_tokens: int,
        duration_ms: int,
        metadata: Dict[str, Any] = None
    ):
        """Record details of an agent's interaction with a model."""
        metrics = [
            Metric(
                name="agent.model.tokens.input",
                value=input_tokens,
                tags={
                    "agent_id": agent_id,
                    "model": model_name,
                    "operation": operation
                }
            ),
            Metric(
                name="agent.model.tokens.output",
                value=output_tokens,
                tags={
                    "agent_id": agent_id,
                    "model": model_name,
                    "operation": operation
                }
            ),
            Metric(
                name="agent.model.duration_ms",
                value=duration_ms,
                tags={
                    "agent_id": agent_id,
                    "model": model_name,
                    "operation": operation
                }
            )
        ]
        
        await self.metric_publisher.publish_metrics(metrics)
        
        # Store in Neo4j for analysis
        query = """
        MATCH (a:Agent {id: $agent_id})
        CREATE (t:Telemetry:ModelInteraction {
            id: $id,
            model: $model_name,
            operation: $operation,
            input_tokens: $input_tokens,
            output_tokens: $output_tokens,
            duration_ms: $duration_ms,
            timestamp: $timestamp,
            metadata: $metadata
        })
        CREATE (a)-[:PERFORMED]->(t)
        RETURN t.id as telemetry_id
        """
        
        parameters = {
            "agent_id": agent_id,
            "id": str(uuid.uuid4()),
            "model_name": model_name,
            "operation": operation,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "duration_ms": duration_ms,
            "timestamp": datetime.now().isoformat(),
            "metadata": metadata or {}
        }
        
        await self.neo4j_service.execute_query(query, parameters, write=True)
        
    async def record_agent_action(
        self,
        agent_id: str,
        action_type: str,
        action_target: str,
        duration_ms: int,
        success: bool,
        result_summary: Optional[str] = None,
        metadata: Dict[str, Any] = None
    ):
        """Record an action performed by an agent."""
        metrics = [
            Metric(
                name="agent.action.count",
                value=1,
                tags={
                    "agent_id": agent_id,
                    "action_type": action_type,
                    "success": str(success)
                }
            ),
            Metric(
                name="agent.action.duration_ms",
                value=duration_ms,
                tags={
                    "agent_id": agent_id,
                    "action_type": action_type,
                    "success": str(success)
                }
            )
        ]
        
        await self.metric_publisher.publish_metrics(metrics)
        
        # Store in Neo4j for analysis
        query = """
        MATCH (a:Agent {id: $agent_id})
        CREATE (act:AgentAction {
            id: $id,
            type: $action_type,
            target: $action_target,
            duration_ms: $duration_ms,
            success: $success,
            result_summary: $result_summary,
            timestamp: $timestamp,
            metadata: $metadata
        })
        CREATE (a)-[:PERFORMED]->(act)
        RETURN act.id as action_id
        """
        
        parameters = {
            "agent_id": agent_id,
            "id": str(uuid.uuid4()),
            "action_type": action_type,
            "action_target": action_target,
            "duration_ms": duration_ms,
            "success": success,
            "result_summary": result_summary,
            "timestamp": datetime.now().isoformat(),
            "metadata": metadata or {}
        }
        
        await self.neo4j_service.execute_query(query, parameters, write=True)
```

### Cost Accounting

A dedicated cost accounting service tracks resource usage and associated costs:

```python
class CostAccountingService:
    """Service for tracking and reporting on costs."""
    
    def __init__(
        self, 
        telemetry_repository: TelemetryRepository,
        cost_repository: CostRepository,
        config: CostConfig
    ):
        self.telemetry_repository = telemetry_repository
        self.cost_repository = cost_repository
        self.config = config
        
    async def calculate_model_costs(
        self,
        start_time: datetime,
        end_time: datetime,
        agent_ids: Optional[List[str]] = None,
        team_ids: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Calculate model usage costs for a time period.
        
        Args:
            start_time: Start of the time range
            end_time: End of the time range
            agent_ids: Optional list of agent IDs to filter by
            team_ids: Optional list of team IDs to filter by
            
        Returns:
            Dictionary with cost breakdown by model, agent, and operation
        """
        # Retrieve model interactions
        interactions = await self.telemetry_repository.get_model_interactions(
            start_time=start_time,
            end_time=end_time,
            agent_ids=agent_ids,
            team_ids=team_ids
        )
        
        # Calculate costs
        model_costs = {}
        agent_costs = {}
        total_cost = 0.0
        
        for interaction in interactions:
            model = interaction["model"]
            agent_id = interaction["agent_id"]
            input_tokens = interaction["input_tokens"]
            output_tokens = interaction["output_tokens"]
            
            # Get cost rates for the model
            input_rate = self.config.model_rates.get(model, {}).get("input", 0.0)
            output_rate = self.config.model_rates.get(model, {}).get("output", 0.0)
            
            # Calculate cost for this interaction
            input_cost = (input_tokens / 1000) * input_rate
            output_cost = (output_tokens / 1000) * output_rate
            interaction_cost = input_cost + output_cost
            
            # Update totals
            total_cost += interaction_cost
            
            # Update model costs
            if model not in model_costs:
                model_costs[model] = {
                    "input_tokens": 0,
                    "output_tokens": 0,
                    "input_cost": 0.0,
                    "output_cost": 0.0,
                    "total_cost": 0.0
                }
            
            model_costs[model]["input_tokens"] += input_tokens
            model_costs[model]["output_tokens"] += output_tokens
            model_costs[model]["input_cost"] += input_cost
            model_costs[model]["output_cost"] += output_cost
            model_costs[model]["total_cost"] += interaction_cost
            
            # Update agent costs
            if agent_id not in agent_costs:
                agent_costs[agent_id] = {
                    "total_cost": 0.0,
                    "models": {}
                }
            
            agent_costs[agent_id]["total_cost"] += interaction_cost
            
            if model not in agent_costs[agent_id]["models"]:
                agent_costs[agent_id]["models"][model] = 0.0
                
            agent_costs[agent_id]["models"][model] += interaction_cost
        
        # Record the cost summary
        cost_record_id = await self.cost_repository.record_cost_summary(
            start_time=start_time,
            end_time=end_time,
            total_cost=total_cost,
            model_costs=model_costs,
            agent_costs=agent_costs,
            filter_criteria={
                "agent_ids": agent_ids,
                "team_ids": team_ids
            }
        )
        
        return {
            "id": cost_record_id,
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat(),
            "total_cost": total_cost,
            "model_costs": model_costs,
            "agent_costs": agent_costs
        }
        
    async def get_cost_by_capability(
        self,
        start_time: datetime,
        end_time: datetime
    ) -> List[Dict[str, Any]]:
        """
        Get costs broken down by agent capability.
        
        This helps identify which capabilities are most expensive to use.
        
        Args:
            start_time: Start of the time range
            end_time: End of the time range
            
        Returns:
            List of capabilities with associated costs
        """
        query = """
        MATCH (a:Agent)-[:PERFORMED]->(t:Telemetry:ModelInteraction)
        WHERE t.timestamp >= $start_time AND t.timestamp <= $end_time
        MATCH (a)-[r:HAS_CAPABILITY]->(c:Capability)
        WITH c.name AS capability, 
             sum(t.input_tokens) AS total_input_tokens,
             sum(t.output_tokens) AS total_output_tokens,
             t.model AS model
        RETURN 
            capability,
            model,
            total_input_tokens,
            total_output_tokens
        ORDER BY total_input_tokens + total_output_tokens DESC
        """
        
        parameters = {
            "start_time": start_time.isoformat(),
            "end_time": end_time.isoformat()
        }
        
        results = await self.telemetry_repository.execute_query(query, parameters)
        
        # Calculate costs
        capability_costs = []
        for result in results:
            model = result["model"]
            input_tokens = result["total_input_tokens"]
            output_tokens = result["total_output_tokens"]
            
            # Get cost rates
            input_rate = self.config.model_rates.get(model, {}).get("input", 0.0)
            output_rate = self.config.model_rates.get(model, {}).get("output", 0.0)
            
            # Calculate costs
            input_cost = (input_tokens / 1000) * input_rate
            output_cost = (output_tokens / 1000) * output_rate
            total_cost = input_cost + output_cost
            
            capability_costs.append({
                "capability": result["capability"],
                "model": model,
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "input_cost": input_cost,
                "output_cost": output_cost,
                "total_cost": total_cost
            })
            
        return capability_costs
        
    async def get_cost_projections(
        self,
        days_to_project: int = 30,
        budget_threshold: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Project future costs based on historical usage.
        
        Args:
            days_to_project: Number of days to project forward
            budget_threshold: Optional budget threshold to calculate days until reached
            
        Returns:
            Cost projections and budget information
        """
        # Get usage for the last 30 days
        end_time = datetime.now()
        start_time = end_time - timedelta(days=30)
        
        historical_costs = await self.cost_repository.get_daily_costs(
            start_time=start_time,
            end_time=end_time
        )
        
        # Calculate daily average
        total_historical_cost = sum(day["total_cost"] for day in historical_costs)
        avg_daily_cost = total_historical_cost / len(historical_costs) if historical_costs else 0
        
        # Project future costs
        projected_cost = avg_daily_cost * days_to_project
        
        # Calculate days until budget threshold reached
        days_until_threshold = None
        if budget_threshold and avg_daily_cost > 0:
            days_until_threshold = budget_threshold / avg_daily_cost
            
        return {
            "average_daily_cost": avg_daily_cost,
            "projected_days": days_to_project,
            "projected_cost": projected_cost,
            "budget_threshold": budget_threshold,
            "days_until_threshold": days_until_threshold,
            "historical_costs": historical_costs
        }
```

### Performance Monitoring

The system tracks key performance metrics for optimization:

```python
class PerformanceMonitor:
    """Monitors and reports on system performance."""
    
    def __init__(
        self,
        neo4j_service: Neo4jService,
        metric_publisher: MetricPublisher
    ):
        self.neo4j_service = neo4j_service
        self.metric_publisher = metric_publisher
        self.logger = logging.getLogger(__name__)
        
    @log_execution_time
    async def record_query_performance(
        self,
        query_type: str,
        database: str,
        duration_ms: int,
        result_count: int,
        query_parameters_hash: str,
        success: bool
    ):
        """Record performance of database queries."""
        metrics = [
            Metric(
                name="database.query.duration_ms",
                value=duration_ms,
                tags={
                    "query_type": query_type,
                    "database": database,
                    "success": str(success)
                }
            ),
            Metric(
                name="database.query.result_count",
                value=result_count,
                tags={
                    "query_type": query_type,
                    "database": database,
                    "success": str(success)
                }
            )
        ]
        
        await self.metric_publisher.publish_metrics(metrics)
        
        # Log slow queries for investigation
        if duration_ms > 1000:  # More than 1 second
            self.logger.warning(
                f"Slow query detected: {query_type}, duration: {duration_ms}ms, "
                f"result count: {result_count}, params hash: {query_parameters_hash}"
            )
            
    @log_execution_time
    async def record_gnn_performance(
        self,
        operation: str,
        model_version: str,
        input_size: int,
        duration_ms: int,
        success: bool,
        metadata: Dict[str, Any] = None
    ):
        """Record performance metrics for GNN operations."""
        metrics = [
            Metric(
                name="gnn.operation.duration_ms",
                value=duration_ms,
                tags={
                    "operation": operation,
                    "model_version": model_version,
                    "success": str(success)
                }
            ),
            Metric(
                name="gnn.operation.input_size",
                value=input_size,
                tags={
                    "operation": operation,
                    "model_version": model_version
                }
            )
        ]
        
        await self.metric_publisher.publish_metrics(metrics)
        
        # Store in Neo4j for trend analysis
        query = """
        CREATE (p:PerformanceMetric:GNN {
            id: $id,
            operation: $operation,
            model_version: $model_version,
            input_size: $input_size,
            duration_ms: $duration_ms,
            success: $success,
            timestamp: $timestamp,
            metadata: $metadata
        })
        RETURN p.id as id
        """
        
        parameters = {
            "id": str(uuid.uuid4()),
            "operation": operation,
            "model_version": model_version,
            "input_size": input_size,
            "duration_ms": duration_ms,
            "success": success,
            "timestamp": datetime.now().isoformat(),
            "metadata": metadata or {}
        }
        
        await self.neo4j_service.execute_query(query, parameters, write=True)
        
    async def get_performance_summary(
        self,
        start_time: datetime,
        end_time: datetime,
        metrics: List[str] = None
    ) -> Dict[str, Any]:
        """
        Get performance summary for specified metrics.
        
        Args:
            start_time: Start time for the summary period
            end_time: End time for the summary period
            metrics: List of metric names to include, or None for all
            
        Returns:
            Performance summary with statistics for each metric
        """
        # Implementation would query from metrics store
        # This is a placeholder structure
        return {
            "time_range": {
                "start": start_time.isoformat(),
                "end": end_time.isoformat()
            },
            "metrics": {
                "database.query.duration_ms": {
                    "avg": 45.7,
                    "p50": 32.1,
                    "p95": 123.4,
                    "p99": 245.8,
                    "max": 1245.6,
                    "count": 5432
                },
                "gnn.operation.duration_ms": {
                    "avg": 325.4,
                    "p50": 287.9,
                    "p95": 678.3,
                    "p99": 892.1,
                    "max": 1567.2,
                    "count": 142
                },
                "agent.model.duration_ms": {
                    "avg": 1245.7,
                    "p50": 1123.4,
                    "p95": 2345.6,
                    "p99": 3456.7,
                    "max": 5678.9,
                    "count": 987
                }
            },
            "top_slowest_operations": [
                {
                    "metric": "database.query.duration_ms",
                    "tags": {
                        "query_type": "path_traversal",
                        "database": "neo4j"
                    },
                    "value": 1245.6,
                    "timestamp": "2023-06-01T14:23:45.678Z"
                },
                {
                    "metric": "agent.model.duration_ms",
                    "tags": {
                        "model": "gpt-4",
                        "operation": "generate_text",
                        "agent_id": "agent-123"
                    },
                    "value": 5678.9,
                    "timestamp": "2023-06-02T09:12:34.567Z"
                }
            ]
        }
```

### Monitoring Dashboard

The monitoring dashboard provides real-time visibility into system operations:

```python
@router.get("/metrics/dashboard")
async def get_metrics_dashboard(
    current_user: User = Depends(get_current_user),
    time_range: str = "last_24h",
    metric_types: List[str] = Query(None)
):
    """
    Get metrics for the monitoring dashboard.
    
    Args:
        current_user: Authenticated user
        time_range: Time range for metrics (last_24h, last_7d, last_30d, custom)
        metric_types: Types of metrics to include (costs, performance, usage)
        
    Returns:
        Dashboard metrics
    """
    # Authorize access
    if not await authorization_service.can_view_metrics(current_user.id):
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to view metrics"
        )
    
    # Determine time range
    end_time = datetime.now()
    if time_range == "last_24h":
        start_time = end_time - timedelta(hours=24)
    elif time_range == "last_7d":
        start_time = end_time - timedelta(days=7)
    elif time_range == "last_30d":
        start_time = end_time - timedelta(days=30)
    else:
        # Parse custom time range
        try:
            start_time_str, end_time_str = time_range.split(",")
            start_time = datetime.fromisoformat(start_time_str)
            end_time = datetime.fromisoformat(end_time_str)
        except (ValueError, AttributeError):
            raise HTTPException(
                status_code=400,
                detail="Invalid time range format. Use 'last_24h', 'last_7d', 'last_30d', "
                       "or 'start_time,end_time' in ISO format"
            )
    
    # Gather requested metrics
    dashboard_data = {
        "time_range": {
            "start": start_time.isoformat(),
            "end": end_time.isoformat()
        }
    }
    
    if not metric_types or "costs" in metric_types:
        # Get cost metrics
        cost_data = await cost_accounting_service.calculate_model_costs(
            start_time=start_time,
            end_time=end_time
        )
        dashboard_data["costs"] = cost_data
    
    if not metric_types or "performance" in metric_types:
        # Get performance metrics
        performance_data = await performance_monitor.get_performance_summary(
            start_time=start_time,
            end_time=end_time
        )
        dashboard_data["performance"] = performance_data
    
    if not metric_types or "usage" in metric_types:
        # Get usage metrics
        usage_data = await telemetry_repository.get_usage_summary(
            start_time=start_time,
            end_time=end_time
        )
        dashboard_data["usage"] = usage_data
    
    return dashboard_data
```

### Alerting System

The alerting system detects anomalies and threshold violations:

```python
class AlertingService:
    """Service for managing alerts based on metrics."""
    
    def __init__(
        self,
        alert_repository: AlertRepository,
        notification_service: NotificationService,
        telemetry_repository: TelemetryRepository
    ):
        self.alert_repository = alert_repository
        self.notification_service = notification_service
        self.telemetry_repository = telemetry_repository
        self.logger = logging.getLogger(__name__)
        
    async def check_cost_alerts(self):
        """Check for cost threshold alerts."""
        # Get active cost alerts
        cost_alerts = await self.alert_repository.get_active_alerts(
            alert_type="cost_threshold"
        )
        
        for alert in cost_alerts:
            threshold = alert["threshold"]
            period = alert["period"]  # daily, weekly, monthly
            
            # Calculate current period costs
            end_time = datetime.now()
            if period == "daily":
                start_time = end_time - timedelta(days=1)
            elif period == "weekly":
                start_time = end_time - timedelta(weeks=1)
            else:  # monthly
                start_time = end_time - timedelta(days=30)
                
            # Get costs for period
            cost_data = await self.telemetry_repository.get_cost_summary(
                start_time=start_time,
                end_time=end_time
            )
            
            current_cost = cost_data["total_cost"]
            
            # Check if threshold exceeded
            if current_cost > threshold:
                # Create alert record
                alert_id = await self.alert_repository.create_alert(
                    alert_type="cost_threshold",
                    severity="warning",
                    message=f"{period.capitalize()} cost threshold exceeded: "
                            f"${current_cost:.2f} > ${threshold:.2f}",
                    context={
                        "threshold": threshold,
                        "current_cost": current_cost,
                        "period": period,
                        "start_time": start_time.isoformat(),
                        "end_time": end_time.isoformat()
                    }
                )
                
                # Send notification
                await self.notification_service.send_alert_notification(
                    alert_id=alert_id,
                    recipients=alert["notify_users"],
                    channels=alert["notify_channels"]
                )
                
                self.logger.warning(
                    f"Cost threshold alert triggered: {period} cost ${current_cost:.2f} "
                    f"exceeds threshold ${threshold:.2f}"
                )
                
    async def check_performance_alerts(self):
        """Check for performance degradation alerts."""
        # Get active performance alerts
        perf_alerts = await self.alert_repository.get_active_alerts(
            alert_type="performance_degradation"
        )
        
        for alert in perf_alerts:
            metric = alert["metric"]
            threshold = alert["threshold"]
            window = alert["window"]  # in minutes
            
            # Get recent performance data
            end_time = datetime.now()
            start_time = end_time - timedelta(minutes=window)
            
            perf_data = await self.telemetry_repository.get_metric_stats(
                metric=metric,
                start_time=start_time,
                end_time=end_time
            )
            
            # Check if performance threshold exceeded
            if perf_data["avg"] > threshold:
                # Create alert
                alert_id = await self.alert_repository.create_alert(
                    alert_type="performance_degradation",
                    severity="warning",
                    message=f"Performance degradation detected: {metric} "
                            f"avg {perf_data['avg']:.2f} > threshold {threshold:.2f}",
                    context={
                        "metric": metric,
                        "threshold": threshold,
                        "current_avg": perf_data["avg"],
                        "current_p95": perf_data["p95"],
                        "window_minutes": window,
                        "start_time": start_time.isoformat(),
                        "end_time": end_time.isoformat()
                    }
                )
                
                # Send notification
                await self.notification_service.send_alert_notification(
                    alert_id=alert_id,
                    recipients=alert["notify_users"],
                    channels=alert["notify_channels"]
                )
                
                self.logger.warning(
                    f"Performance alert triggered: {metric} avg {perf_data['avg']:.2f} "
                    f"exceeds threshold {threshold:.2f}"
                )
```

## Architecture Patterns
