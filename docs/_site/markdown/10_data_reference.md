# Data Reference Guide

This document provides a comprehensive reference for all data structures used in the Agent Party system. It defines the schemas, models, and enumerations that form the foundation of the system's data architecture.

## 1. Neo4j Graph Schema

### 1.1 Node Types

#### Agent Node

The fundamental entity representing an AI agent in the system.

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| id | UUID | Unique identifier | `"550e8400-e29b-41d4-a716-446655440000"` |
| name | String | Agent name | `"Alice"` |
| role | String | Primary role | `"researcher"` |
| personality | String | Personality type | `"analytical"` |
| model | String | Base AI model | `"gpt-4"` |
| parameters | JSON | Model parameters | `{"temperature": 0.7, "top_p": 1.0}` |
| cost_per_token | Float | Token cost | `0.00005` |
| status | String | Current status | `"idle"` |
| color_scheme | JSON | Visualization colors | `{"primary": "#3498db", "secondary": "#2980b9"}` |
| reliability_score | Float | Reliability metric (0-1) | `0.98` |
| capability_fingerprint | String | Hash of capabilities | `"a1b2c3d4e5f6"` |
| token_budget | Integer | Max tokens per session | `10000` |
| failure_count | Integer | Count of recent failures | `0` |
| created_at | Timestamp | Creation timestamp | `2025-03-12T12:00:00Z` |
| updated_at | Timestamp | Last update timestamp | `2025-03-12T12:30:00Z` |

#### Team Node

A collection of agents working together on a task.

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| id | UUID | Unique identifier | `"550e8400-e29b-41d4-a716-446655440001"` |
| name | String | Team name | `"Discovery Team"` |
| task | String | Task description | `"Research quantum computing"` |
| status | String | Current status | `"working"` |
| token_budget | Integer | Team token allocation | `50000` |
| performance_score | Float | Team effectiveness (0-1) | `0.92` |
| created_at | Timestamp | Creation timestamp | `2025-03-12T12:00:00Z` |
| updated_at | Timestamp | Last update timestamp | `2025-03-12T12:30:00Z` |

#### Task Node

A discrete unit of work to be performed by a team.

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| id | UUID | Unique identifier | `"550e8400-e29b-41d4-a716-446655440002"` |
| description | String | Task description | `"Research quantum computing advances in 2024"` |
| type | String | Task category | `"research"` |
| priority | Integer | Importance (1-5) | `2` |
| status | String | Current status | `"in_progress"` |
| estimated_cost | Float | Projected token cost | `15.75` |
| actual_cost | Float | Actual token cost | `12.34` |
| created_at | Timestamp | Creation timestamp | `2025-03-12T12:00:00Z` |
| updated_at | Timestamp | Last update timestamp | `2025-03-12T14:30:00Z` |
| completed_at | Timestamp | Completion timestamp | `null` |

#### Capability Node

A specific skill or ability that an agent can possess.

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| id | UUID | Unique identifier | `"550e8400-e29b-41d4-a716-446655440003"` |
| name | String | Capability name | `"python_coding"` |
| description | String | Detailed description | `"Ability to write Python code"` |
| category | String | Capability category | `"technical"` |
| rarity | Float | Availability score (0-1) | `0.3` |
| created_at | Timestamp | Creation timestamp | `2025-03-12T12:00:00Z` |

#### Context Node

Information or data relevant to an agent or team's operations.

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| id | UUID | Unique identifier | `"550e8400-e29b-41d4-a716-446655440004"` |
| type | String | Context type | `"reference_document"` |
| name | String | Context name | `"Quantum Computing Primer"` |
| content | String | Context data | `"Quantum computing uses quantum bits or qubits..."` |
| source | String | Origin of context | `"arxiv:2201.00000"` |
| token_count | Integer | Size in tokens | `3500` |
| metadata | JSON | Additional info | `{"format": "pdf", "pages": 12}` |
| created_at | Timestamp | Creation timestamp | `2025-03-12T12:00:00Z` |

#### TokenUsage Node

Records token usage for accounting purposes.

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| id | UUID | Unique identifier | `"550e8400-e29b-41d4-a716-446655440005"` |
| agent_id | UUID | Agent reference | `"550e8400-e29b-41d4-a716-446655440000"` |
| task_id | UUID | Task reference | `"550e8400-e29b-41d4-a716-446655440002"` |
| prompt_tokens | Integer | Input token count | `250` |
| completion_tokens | Integer | Output token count | `150` |
| total_tokens | Integer | Total tokens used | `400` |
| model | String | AI model used | `"gpt-4"` |
| cost | Float | Token cost in USD | `0.02` |
| timestamp | Timestamp | Usage timestamp | `2025-03-12T14:45:00Z` |

### 1.2 Relationship Types

#### HAS_CAPABILITY

Connects an Agent to a Capability.

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| proficiency | Float | Skill level (0-1) | `0.85` |
| certified | Boolean | Certification status | `true` |
| last_used | Timestamp | Last usage timestamp | `2025-03-10T09:30:00Z` |

#### MEMBER_OF

Connects an Agent to a Team.

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| joined_at | Timestamp | Join timestamp | `2025-03-12T13:00:00Z` |
| role | String | Team role | `"lead_researcher"` |
| status | String | Membership status | `"active"` |

#### ASSIGNED_TO

Connects a Team to a Task.

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| assigned_at | Timestamp | Assignment timestamp | `2025-03-12T13:30:00Z` |
| expected_completion | Timestamp | Expected completion | `2025-03-15T17:00:00Z` |
| priority | Integer | Assignment priority | `1` |

#### REQUIRES

Connects a Task to a Capability.

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| importance | Float | Requirement importance (0-1) | `0.9` |
| preferred_proficiency | Float | Desired skill level | `0.7` |

#### INTERACTED_WITH

Connects two Agents that have communicated.

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| timestamp | Timestamp | Interaction time | `2025-03-12T14:45:00Z` |
| message_id | UUID | Reference to message | `"550e8400-e29b-41d4-a716-446655440005"` |
| interaction_type | String | Type of interaction | `"question_answer"` |

#### HAS_CONTEXT

Connects an Agent or Team to Context information.

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| added_at | Timestamp | Context addition time | `2025-03-12T13:45:00Z` |
| importance | Float | Context importance (0-1) | `0.8` |
| access_count | Integer | Number of accesses | `5` |

### 1.3 Neo4j Constraints and Indices

#### Node Uniqueness Constraints

```cypher
CREATE CONSTRAINT agent_id IF NOT EXISTS FOR (a:Agent) REQUIRE a.id IS UNIQUE;
CREATE CONSTRAINT team_id IF NOT EXISTS FOR (t:Team) REQUIRE t.id IS UNIQUE;
CREATE CONSTRAINT task_id IF NOT EXISTS FOR (ta:Task) REQUIRE ta.id IS UNIQUE;
CREATE CONSTRAINT capability_id IF NOT EXISTS FOR (c:Capability) REQUIRE c.id IS UNIQUE;
CREATE CONSTRAINT context_id IF NOT EXISTS FOR (ctx:Context) REQUIRE ctx.id IS UNIQUE;
```

#### Search Indices

```cypher
CREATE INDEX agent_search IF NOT EXISTS FOR (a:Agent) ON (a.name, a.role);
CREATE INDEX capability_search IF NOT EXISTS FOR (c:Capability) ON (c.name);
CREATE INDEX task_search IF NOT EXISTS FOR (t:Task) ON (t.description, t.type);
CREATE INDEX team_search IF NOT EXISTS FOR (team:Team) ON (team.name);
CREATE INDEX context_search IF NOT EXISTS FOR (ctx:Context) ON (ctx.type);
CREATE INDEX token_usage_search IF NOT EXISTS FOR (tu:TokenUsage) ON (tu.timestamp, tu.model);
CREATE INDEX system_state_search IF NOT EXISTS FOR (ss:SystemState) ON (ss.checkpoint_id, ss.component);
CREATE INDEX session_search IF NOT EXISTS FOR (s:Session) ON (s.start_time, s.session_type);

// Composite indices for analytics queries
CREATE INDEX token_analytics IF NOT EXISTS FOR (tu:TokenUsage) ON (tu.model, tu.timestamp, tu.cost);
CREATE INDEX reliability_tracking IF NOT EXISTS FOR (a:Agent) ON (a.reliability_score, a.failure_count);
CREATE INDEX budget_monitoring IF NOT EXISTS FOR (t:Task) ON (t.estimated_cost, t.actual_cost);
```

#### Relationship Indices

```cypher
CREATE INDEX member_of_idx IF NOT EXISTS FOR ()-[r:MEMBER_OF]->() ON (r.joined_at);
CREATE INDEX assigned_to_idx IF NOT EXISTS FOR ()-[r:ASSIGNED_TO]->() ON (r.assigned_at);
CREATE INDEX has_capability_idx IF NOT EXISTS FOR ()-[r:HAS_CAPABILITY]->() ON (r.proficiency);
CREATE INDEX interaction_idx IF NOT EXISTS FOR ()-[r:INTERACTED_WITH]->() ON (r.timestamp);
CREATE INDEX uses_tokens_idx IF NOT EXISTS FOR ()-[r:USES_TOKENS]->() ON (r.timestamp);
CREATE INDEX has_checkpoint_idx IF NOT EXISTS FOR ()-[r:HAS_CHECKPOINT]->() ON (r.checkpoint_time);
CREATE INDEX part_of_session_idx IF NOT EXISTS FOR ()-[r:PART_OF_SESSION]->() ON (r.joined_at);

// GNN-specific indices for performance
CREATE INDEX collaboration_success_idx IF NOT EXISTS FOR ()-[r:COLLABORATED_WITH]->() ON (r.success_score);
CREATE INDEX capability_match_idx IF NOT EXISTS FOR ()-[r:REQUIRES]->() ON (r.importance, r.preferred_proficiency);
CREATE INDEX team_performance_idx IF NOT EXISTS FOR (t:Team) ON (t.performance_score, t.task_type);
```

## 2. GNN Model Specification

The "DJ" recommendation engine uses Graph Neural Networks to analyze agent relationships and optimize team composition.

### 2.1 GNN Node Types

#### GNNModel Node

Represents a trained GNN model for team composition recommendations.

| Property | Type | Description | Example |
|----------|------|-------------|----------|
| id | UUID | Unique identifier | `"550e8400-e29b-41d4-a716-446655440010"` |
| name | String | Model name | `"TeamComposerV1"` |
| version | String | Model version | `"1.0.5"` |
| architecture | String | GNN architecture | `"GraphSAGE"` |
| embedding_dim | Integer | Node embedding dimension | `128` |
| performance_score | Float | Accuracy metric (0-1) | `0.86` |
| training_timestamp | Timestamp | Last training time | `2025-03-12T10:15:00Z` |
| training_samples | Integer | Number of training examples | `15420` |
| hyperparameters | JSON | Model parameters | `{"learning_rate": 0.001, "layers": 3}` |
| features | JSON | Node features used | `{"agent": ["role", "reliability_score"], "task": ["type", "priority"]}` |

#### GNNEmbedding Node

Stores learned embeddings for entities in the graph.

| Property | Type | Description | Example |
|----------|------|-------------|----------|
| id | UUID | Unique identifier | `"550e8400-e29b-41d4-a716-446655440011"` |
| entity_id | UUID | Reference to entity | `"550e8400-e29b-41d4-a716-446655440000"` |
| entity_type | String | Type of entity | `"Agent"` |
| model_id | UUID | GNN model ID | `"550e8400-e29b-41d4-a716-446655440010"` |
| embedding | Binary | Vector embedding | Binary data |
| embedding_timestamp | Timestamp | Creation timestamp | `2025-03-12T10:30:00Z` |

#### CollaborationRecord Node

Records historical collaboration between agents.

| Property | Type | Description | Example |
|----------|------|-------------|----------|
| id | UUID | Unique identifier | `"550e8400-e29b-41d4-a716-446655440012"` |
| task_id | UUID | Associated task | `"550e8400-e29b-41d4-a716-446655440002"` |
| team_id | UUID | Associated team | `"550e8400-e29b-41d4-a716-446655440001"` |
| success_score | Float | Collaboration quality (0-1) | `0.92` |
| interaction_count | Integer | Number of interactions | `47` |
| task_type | String | Type of task performed | `"research"` |
| timestamp | Timestamp | Record timestamp | `2025-03-12T18:45:00Z` |

### 2.2 GNN Relationship Types

#### COLLABORATED_WITH

Connects two Agents that have successfully collaborated.

| Property | Type | Description | Example |
|----------|------|-------------|----------|
| success_score | Float | Collaboration quality (0-1) | `0.88` |
| task_count | Integer | Number of shared tasks | `12` |
| last_collaboration | Timestamp | Most recent | `2025-03-10T14:30:00Z` |
| synergy_score | Float | Compatibility metric | `0.91` |

#### TRAINED_WITH

Connects GNNModel to training data.

| Property | Type | Description | Example |
|----------|------|-------------|----------|
| training_date | Timestamp | Training timestamp | `2025-03-01T09:00:00Z` |
| validation_score | Float | Performance metric | `0.84` |
| training_duration | Integer | Training time (seconds) | `3600` |

#### HAS_EMBEDDING

Connects an entity to its GNNEmbedding.

| Property | Type | Description | Example |
|----------|------|-------------|----------|
| created_at | Timestamp | Creation timestamp | `2025-03-12T10:30:00Z` |
| version | String | Embedding version | `"1.0"` |
| quality_score | Float | Embedding quality (0-1) | `0.95` |

## 3. Event Schema

All events in the Agent Party system follow a defined schema to ensure consistency across services.

### 3.1 Common Event Properties

| Property | Type | Description | Example |
|----------|------|-------------|---------|
| event_id | UUID | Unique event identifier | `"550e8400-e29b-41d4-a716-446655440006"` |
| event_type | String | Event type identifier | `"agent.created"` |
| timestamp | ISO Datetime | Event occurrence time | `"2025-03-12T12:00:00Z"` |
| version | String | Schema version | `"1.0"` |
| producer | String | Service that produced event | `"agent_service"` |

### 3.2 Agent Events

```python
class AgentCreatedEvent(BaseModel):
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

class AgentUpdatedEvent(BaseModel):
    event_id: UUID
    event_type: Literal["agent.updated"]
    timestamp: datetime
    version: str = "1.0"
    producer: str
    agent_id: UUID
    updated_fields: Dict[str, Any]
    updated_by: Optional[UUID] = None

class AgentStatusChangedEvent(BaseModel):
    event_id: UUID
    event_type: Literal["agent.status_changed"]
    timestamp: datetime
    version: str = "1.0"
    producer: str
    agent_id: UUID
    previous_status: str
    new_status: str
    reason: Optional[str] = None
    changed_by: Optional[UUID] = None
```

### 3.3 Team Events

```python
class TeamCreatedEvent(BaseModel):
    event_id: UUID
    event_type: Literal["team.created"]
    timestamp: datetime
    version: str = "1.0"
    producer: str
    team_id: UUID
    name: str
    task_id: Optional[UUID] = None
    created_by: Optional[UUID] = None

class TeamMemberAddedEvent(BaseModel):
    event_id: UUID
    event_type: Literal["team.member_added"]
    timestamp: datetime
    version: str = "1.0"
    producer: str
    team_id: UUID
    agent_id: UUID
    role: str
    added_by: Optional[UUID] = None
```

### 3.4 Task Events

```python
class TaskCreatedEvent(BaseModel):
    event_id: UUID
    event_type: Literal["task.created"]
    timestamp: datetime
    version: str = "1.0"
    producer: str
    task_id: UUID
    description: str
    type: str
    priority: int
    created_by: UUID
    required_capabilities: Optional[List[Dict[str, Any]]] = None

class TaskAssignedEvent(BaseModel):
    event_id: UUID
    event_type: Literal["task.assigned"]
    timestamp: datetime
    version: str = "1.0"
    producer: str
    task_id: UUID
    team_id: UUID
    assigned_by: Optional[UUID] = None
    expected_completion: Optional[datetime] = None

class TaskStatusChangedEvent(BaseModel):
    event_id: UUID
    event_type: Literal["task.status_changed"]
    timestamp: datetime
    version: str = "1.0"
    producer: str
    task_id: UUID
    previous_status: str
    new_status: str
    reason: Optional[str] = None
    changed_by: Optional[UUID] = None
```

## 4. API Models

### 4.1 Request Models

```python
class CreateAgentRequest(BaseModel):
    name: str
    role: str
    personality: str
    model: str
    parameters: Optional[Dict[str, Any]] = None
    capabilities: Optional[List[Dict[str, Any]]] = None
    
    class Config:
        schema_extra = {
            "example": {
                "name": "Alice",
                "role": "researcher",
                "personality": "analytical",
                "model": "gpt-4",
                "parameters": {"temperature": 0.7},
                "capabilities": [
                    {"name": "python_coding", "proficiency": 0.9},
                    {"name": "data_analysis", "proficiency": 0.8}
                ]
            }
        }

class CreateTeamRequest(BaseModel):
    name: str
    task_id: Optional[UUID] = None
    agent_ids: Optional[List[Dict[str, Any]]] = None
    
    class Config:
        schema_extra = {
            "example": {
                "name": "Research Team Alpha",
                "task_id": "550e8400-e29b-41d4-a716-446655440002",
                "agent_ids": [
                    {"agent_id": "550e8400-e29b-41d4-a716-446655440000", "role": "lead"},
                    {"agent_id": "550e8400-e29b-41d4-a716-446655440010", "role": "member"}
                ]
            }
        }

class CreateTaskRequest(BaseModel):
    description: str
    type: str
    priority: int = 3
    required_capabilities: Optional[List[Dict[str, Any]]] = None
    
    class Config:
        schema_extra = {
            "example": {
                "description": "Research quantum computing advances in 2024",
                "type": "research",
                "priority": 2,
                "required_capabilities": [
                    {"name": "research_skills", "importance": 0.9},
                    {"name": "quantum_physics_knowledge", "importance": 0.8}
                ]
            }
        }
```

### 4.2 Response Models

```python
class AgentResponse(BaseModel):
    id: UUID
    name: str
    role: str
    personality: str
    model: str
    status: str
    created_at: datetime
    updated_at: datetime
    capabilities: Optional[List[Dict[str, Any]]] = None

class TeamResponse(BaseModel):
    id: UUID
    name: str
    status: str
    created_at: datetime
    updated_at: datetime
    task: Optional[Dict[str, Any]] = None
    members: Optional[List[Dict[str, Any]]] = None

class TaskResponse(BaseModel):
    id: UUID
    description: str
    type: str
    priority: int
    status: str
    created_at: datetime
    updated_at: datetime
    required_capabilities: Optional[List[Dict[str, Any]]] = None
    assigned_team: Optional[Dict[str, Any]] = None
```

## 5. Configuration Schema

### 5.1 Database Configuration

```python
class Neo4jConfig(BaseModel):
    uri: str
    username: str
    password: SecretStr
    database: str = "neo4j"
    max_connection_lifetime: int = 3600
    max_connection_pool_size: int = 50
    connection_acquisition_timeout: int = 60
    connection_timeout: int = 30
    max_transaction_retry_time: int = 30
```

### 5.2 Kafka Configuration

```python
class KafkaConfig(BaseModel):
    bootstrap_servers: str
    security_protocol: str = "PLAINTEXT"
    sasl_mechanism: Optional[str] = None
    sasl_username: Optional[str] = None
    sasl_password: Optional[SecretStr] = None
    client_id: str = "agent_party"
    group_id: str = "agent_party_group"
    auto_offset_reset: str = "earliest"
    enable_auto_commit: bool = True
```

### 5.3 Redis Configuration

```python
class RedisConfig(BaseModel):
    host: str
    port: int = 6379
    db: int = 0
    password: Optional[SecretStr] = None
    socket_timeout: int = 5
    socket_connect_timeout: int = 5
    connection_pool_size: int = 10
```

## 6. Token Accounting and Reliability

### 6.1 Token Accounting Models

```python
class TokenUsageRecord(BaseModel):
    id: UUID
    agent_id: UUID
    task_id: Optional[UUID] = None
    team_id: Optional[UUID] = None
    session_id: UUID
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    model: str
    cost: float
    operation_type: str
    success: bool
    timestamp: datetime

class TokenBudget(BaseModel):
    entity_id: UUID
    entity_type: Literal["agent", "team", "task", "session"]
    budget_type: Literal["token", "cost"]
    budget_value: float
    current_usage: float
    alert_threshold: float = 0.8  # Alert at 80% usage
    hard_limit: bool = False  # Whether to enforce hard limit
    reset_period: Optional[str] = None  # e.g., "daily", "monthly"
    last_reset: Optional[datetime] = None
```

### 6.2 Reliability Models

```python
class SystemCheckpoint(BaseModel):
    id: UUID
    checkpoint_id: str
    component: str
    entity_id: Optional[UUID] = None
    entity_type: Optional[str] = None
    state_data: Dict[str, Any]
    version: str
    trigger_type: str
    recoverable: bool
    created_at: datetime
    valid_until: datetime

class FailureRecord(BaseModel):
    id: UUID
    component: str
    entity_id: Optional[UUID] = None
    entity_type: Optional[str] = None
    failure_type: str
    error_code: str
    error_message: str
    stack_trace: Optional[str] = None
    recovered: bool = False
    recovery_checkpoint_id: Optional[str] = None
    recovery_time_ms: Optional[int] = None
    impact_severity: str  # low, medium, high
    timestamp: datetime
```

## 7. Status and State Enumerations

### 7.1 Agent States

```python
class AgentStatus(str, Enum):
    INITIALIZING = "initializing"
    IDLE = "idle"
    WORKING = "working"
    COLLABORATING = "collaborating"
    PAUSED = "paused"
    ERROR = "error"
    TERMINATED = "terminated"
    RECOVERING = "recovering"  # Agent is recovering from failure
    THROTTLED = "throttled"  # Agent is rate-limited due to token budget
```

### 7.2 Team States

```python
class TeamStatus(str, Enum):
    FORMING = "forming"
    READY = "ready"
    WORKING = "working"
    PAUSED = "paused"
    COMPLETED = "completed"
    ERROR = "error"
    DISBANDED = "disbanded"
    RECOVERING = "recovering"  # Team is restoring from checkpoint
    BUDGET_LIMITED = "budget_limited"  # Team hit budget constraints
```

### 7.3 Task States

```python
class TaskStatus(str, Enum):
    SUBMITTED = "submitted"
    ANALYZING = "analyzing"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    PENDING_REVIEW = "pending_review"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    BUDGET_EXCEEDED = "budget_exceeded"  # Task paused due to budget
    CHECKPOINTING = "checkpointing"  # Task saving progress
    RECOVERING = "recovering"  # Task restoring from checkpoint
```

### 7.4 System Health States

```python
class SystemHealthStatus(str, Enum):
    HEALTHY = "healthy"  # All systems operational
    DEGRADED = "degraded"  # Some components experiencing issues
    UNHEALTHY = "unhealthy"  # Critical components failing
    MAINTENANCE = "maintenance"  # System in maintenance mode
    RECOVERING = "recovering"  # System recovering from failure

class BudgetStatus(str, Enum):
    UNDER_BUDGET = "under_budget"  # Using less than 80% of budget
    NEAR_LIMIT = "near_limit"  # Between 80-100% of budget
    AT_LIMIT = "at_limit"  # At 100% of budget
    EXCEEDED = "exceeded"  # Over budget but allowed to continue
    HARD_LIMITED = "hard_limited"  # Over budget and operations paused
```

## 8. Performance Considerations

### 8.1 Neo4j Query Optimization

When working with the data model, follow these optimization patterns:

1. **Use Parameterized Queries**: Always use parameters instead of string concatenation
2. **Leverage Indexes**: Ensure queries utilize the defined indexes
3. **Limit Result Sizes**: Use LIMIT to restrict large result sets
4. **Projection**: Only return needed properties with specific projections
5. **Batching**: Process large operations in batches of 1000 items

### 8.2 Event Processing Efficiency

For Kafka event processing:

1. **Idempotent Handlers**: Design event handlers to be safely replayable
2. **Event Compression**: Use compression for large event payloads
3. **Batched Processing**: Process events in small batches where possible
4. **Error Recovery**: Implement dead-letter queues for failed events

### 8.3 Transaction Management

For Neo4j transactions:

1. **Explicit Transactions**: Use explicit transactions for multi-operation sequences
2. **Optimistic Locking**: Implement version-based concurrency control
3. **Transaction Timeouts**: Set appropriate timeouts for long-running transactions
4. **Retry Logic**: Implement exponential backoff for transient errors
