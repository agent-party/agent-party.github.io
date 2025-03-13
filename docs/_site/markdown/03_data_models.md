# Data Models

This document defines the core data models, database schemas, and event structures used throughout the Agent Party system. These models form the foundation for all system operations and interactions.

## Neo4j Graph Schema

### Core Nodes

#### Agent

Represents an instantiated AI agent within the system.

```cypher
CREATE (a:Agent {
    id: "uuid4_string",                  // Unique identifier
    name: "string",                      // Display name
    status: "string",                    // Current lifecycle state
    created_at: "timestamp",             // Creation timestamp
    updated_at: "timestamp",             // Last update timestamp
    personality: "string",               // Personality traits
    model: "string",                     // Base model identifier
    parameters: "json_string",           // Model configuration parameters
    cost_profile: "json_string",         // Token usage estimates
    reliability_score: "float",          // Historical reliability (0-1)
    token_count: "integer",              // Total tokens consumed
    embeddings: "float_array"            // GNN-generated embeddings
})
```

#### AgentTemplate

Blueprint for creating agent instances.

```cypher
CREATE (t:AgentTemplate {
    id: "uuid4_string",                  // Unique identifier
    name: "string",                      // Template name
    description: "string",               // Detailed description
    created_at: "timestamp",             // Creation timestamp
    created_by: "string",                // Creator (user or system)
    status: "string",                    // published, draft, deprecated
    version_count: "integer",            // Number of versions
    is_auto_generated: "boolean",        // Created by Talent Scout
    approval_required: "boolean",        // Requires human approval
    template_category: "string",         // Template classification
    governance_rules: "json_string"      // State transition rules
})
```

#### TemplateVersion

Versioned implementation of an agent template.

```cypher
CREATE (tv:TemplateVersion {
    id: "uuid4_string",                  // Unique identifier
    template_id: "uuid4_string",         // Parent template ID
    version: "string",                   // Semantic version number
    created_at: "timestamp",             // Creation timestamp
    model: "string",                     // Base model identifier
    parameters: "json_string",           // Model configuration parameters
    personality: "string",               // Personality traits
    cost_profile: "json_string",         // Token usage estimates
    performance_metrics: "json_string",  // Historical performance data
    is_deprecated: "boolean"             // Version deprecation flag
})
```

#### Team

A collection of agents assembled to complete a task.

```cypher
CREATE (t:Team {
    id: "uuid4_string",                  // Unique identifier
    name: "string",                      // Team name
    created_at: "timestamp",             // Creation timestamp
    status: "string",                    // forming, active, completed, failed
    size: "integer",                     // Number of agent members
    task_id: "uuid4_string",             // Associated task ID
    formation_method: "string",          // manual, recommended, auto
    performance_score: "float",          // Overall team effectiveness
    token_budget: "integer",             // Allocated token budget
    token_usage: "integer",              // Actual token consumption
    completion_time: "integer"           // Time to completion (seconds)
})
```

#### Task

A job to be completed by a team of agents.

```cypher
CREATE (t:Task {
    id: "uuid4_string",                  // Unique identifier
    title: "string",                     // Short descriptive title
    description: "string",               // Detailed requirements
    created_at: "timestamp",             // Creation timestamp
    status: "string",                    // submitted, analyzed, in_progress, etc.
    priority: "integer",                 // Priority level (1-5)
    complexity: "float",                 // Estimated complexity (0-1)
    required_capabilities: "json_array", // Needed capabilities
    created_by: "uuid4_string",          // User who created the task
    estimated_completion: "timestamp",   // Projected completion time
    completed_at: "timestamp",           // Actual completion time
    token_budget: "integer",             // Allocated token budget
    token_usage: "integer"               // Actual token consumption
})
```

#### Capability

A specific skill or function that agents can perform.

```cypher
CREATE (c:Capability {
    id: "uuid4_string",                  // Unique identifier
    name: "string",                      // Capability name
    description: "string",               // Detailed description
    category: "string",                  // Functional category
    created_at: "timestamp",             // Creation timestamp
    token_cost: "integer",               // Average token cost to use
    required_model: "string",            // Minimum model requirement
    embeddings: "float_array",           // Vector representation
    compatibility: "json_array"          // Compatible capabilities
})
```

#### AgentState

A specific lifecycle state of an agent instance.

```cypher
CREATE (s:AgentState {
    id: "uuid4_string",                  // Unique identifier
    name: "string",                      // State name
    timestamp: "timestamp",              // When state was entered
    duration: "integer",                 // Time spent in state (seconds)
    transition_reason: "string",         // Reason for entering state
    token_count: "integer",              // Tokens used in this state
    metrics: "json_string",              // State-specific metrics
    notes: "string"                      // Additional context
})
```

#### User

A human user of the system.

```cypher
CREATE (u:User {
    id: "uuid4_string",                  // Unique identifier
    username: "string",                  // Username
    email: "string",                     // Email address
    created_at: "timestamp",             // Account creation time
    roles: "json_array",                 // System roles
    preferences: "json_string",          // User preferences
    token_budget: "integer",             // Allocated token budget
    approved_capabilities: "json_array"  // Approved capability usage
})
```

### Key Relationships

```cypher
// Agent lifecycle and structure relationships
CREATE (a:Agent)-[:INSTANTIATES]->(tv:TemplateVersion)
CREATE (a:Agent)-[:HAS_STATE {timestamp: timestamp()}]->(s:AgentState)
CREATE (a:Agent)-[:TRANSITIONED_BY {timestamp: timestamp()}]->(approver)
CREATE (a:Agent)-[:HAS_CAPABILITY {proficiency: float}]->(c:Capability)
CREATE (a:Agent)-[:CREATED {timestamp: timestamp()}]->(output)

// Template relationships
CREATE (t:AgentTemplate)-[:HAS_VERSION]->(tv:TemplateVersion)
CREATE (t:AgentTemplate)-[:DEFINES_CAPABILITIES]->(c:Capability)
CREATE (tv:TemplateVersion)-[:REQUIRES_MODEL]->(m:Model)

// Team relationships
CREATE (a:Agent)-[:MEMBER_OF {role: "string", joined_at: timestamp()}]->(t:Team)
CREATE (t:Team)-[:WORKS_ON]->(task:Task)
CREATE (t:Team)-[:ASSEMBLED_BY]->(assembler)

// Task relationships
CREATE (task:Task)-[:REQUIRES]->(c:Capability)
CREATE (task:Task)-[:REQUESTED_BY]->(u:User)
CREATE (task:Task)-[:RESULTED_IN]->(product)

// Collaboration relationships
CREATE (a1:Agent)-[:WORKED_WITH {
    success_score: float,
    task_count: integer,
    last_collaboration: timestamp()
}]->(a2:Agent)
```

### Indices and Constraints

```cypher
// Unique constraints
CREATE CONSTRAINT IF NOT EXISTS ON (a:Agent) ASSERT a.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS ON (t:AgentTemplate) ASSERT t.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS ON (tv:TemplateVersion) ASSERT (tv.template_id, tv.version) IS NODE KEY;
CREATE CONSTRAINT IF NOT EXISTS ON (t:Team) ASSERT t.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS ON (t:Task) ASSERT t.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS ON (c:Capability) ASSERT c.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS ON (s:AgentState) ASSERT s.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS ON (u:User) ASSERT u.id IS UNIQUE;

// Performance indices
CREATE INDEX IF NOT EXISTS FOR (a:Agent) ON (a.status);
CREATE INDEX IF NOT EXISTS FOR (a:Agent) ON (a.reliability_score);
CREATE INDEX IF NOT EXISTS FOR (t:Team) ON (t.status);
CREATE INDEX IF NOT EXISTS FOR (t:Task) ON (t.status);
CREATE INDEX IF NOT EXISTS FOR (c:Capability) ON (c.category);
CREATE INDEX IF NOT EXISTS FOR ()-[r:WORKED_WITH]->() ON (r.success_score);
CREATE INDEX IF NOT EXISTS FOR ()-[r:HAS_CAPABILITY]->() ON (r.proficiency);
CREATE INDEX IF NOT EXISTS FOR ()-[r:MEMBER_OF]->() ON (r.role);
```

## GNN Model Data Structures

### Node Types and Features

```python
# Agent node features
agent_features = {
    "reliability_score": float,  # Historical reliability (0-1)
    "capability_count": int,     # Number of capabilities
    "avg_proficiency": float,    # Average capability proficiency
    "token_efficiency": float,   # Tokens per task completion
    "embeddings": np.ndarray     # Pre-computed embeddings
}

# Capability node features
capability_features = {
    "token_cost": int,           # Average token cost
    "usage_frequency": float,    # How often capability is used
    "compatibility_count": int,  # Number of compatible capabilities
    "embeddings": np.ndarray     # Pre-computed embeddings
}

# Task node features
task_features = {
    "complexity": float,         # Task complexity (0-1)
    "priority": int,             # Priority level (1-5)
    "capability_count": int,     # Number of required capabilities
    "token_budget": int,         # Allocated token budget
    "embeddings": np.ndarray     # Pre-computed embeddings
}
```

### Edge Types and Features

```python
# Agent-Agent collaboration edge
collaboration_edge_features = {
    "success_score": float,      # Collaboration success (0-1)
    "task_count": int,           # Number of shared tasks
    "recency": float,            # How recent was collaboration
    "compatibility": float       # Compatibility score
}

# Agent-Capability edge
capability_edge_features = {
    "proficiency": float,        # Proficiency level (0-1)
    "usage_count": int,          # How often agent uses capability
    "token_efficiency": float    # Tokens used per capability use
}

# Task-Capability edge
requirement_edge_features = {
    "importance": float,         # How critical to task success
    "complexity": float          # How complex is this requirement
}
```

### GraphSAGE Model Configuration

```python
model_config = {
    "hidden_channels": 128,       # Hidden layer dimensions
    "num_layers": 2,              # Number of message passing layers
    "dropout": 0.2,               # Dropout probability
    "node_types": [               # Heterogeneous node types
        "Agent", "Capability", "Task"
    ],
    "edge_types": [               # Heterogeneous edge types
        ("Agent", "WORKED_WITH", "Agent"),
        ("Agent", "HAS_CAPABILITY", "Capability"),
        ("Task", "REQUIRES", "Capability")
    ],
    "learning_rate": 0.001,       # Training learning rate
    "weight_decay": 5e-4,         # L2 regularization
    "use_skip_connections": True, # Skip connections in GNN
    "aggregation": "mean"         # Neighborhood aggregation method
}
```

## Kafka Event Schema

### Core Event Structure

All events in the system share a common base structure:

```python
class BaseEvent(BaseModel):
    """Base event structure for all Kafka events."""
    
    event_id: str                  # Unique event identifier
    event_type: str                # Event type identifier
    event_version: str             # Schema version for the event 
    timestamp: datetime            # When the event was generated
    producer: str                  # Service that produced the event
    correlation_id: str            # For event tracing/grouping
    payload: Dict[str, Any]        # Event-specific data payload
```

### Agent Lifecycle Events

```python
class AgentProvisionedEvent(BaseEvent):
    """Event when an agent is initially provisioned."""
    
    event_type: Literal["agent_provisioned"]
    payload: Dict[str, Any] = {
        "agent_id": str,           # Unique agent identifier
        "template_id": str,        # Template ID used
        "template_version": str,   # Template version
        "provisioner": str,        # ID of the provisioning entity
        "parameters": dict,        # Agent initialization parameters
        "resource_allocation": dict # Allocated resources
    }

class AgentStateTransitionEvent(BaseEvent):
    """Event when an agent changes state."""
    
    event_type: Literal["agent_state_transition"]
    payload: Dict[str, Any] = {
        "agent_id": str,           # Agent identifier
        "previous_state": str,     # State before transition
        "new_state": str,          # State after transition
        "transition_reason": str,  # Why transition occurred
        "transition_approver": str, # Who/what approved transition
        "token_count": int,        # Tokens used in previous state
        "duration": int,           # Time in previous state (seconds)
        "metrics": dict            # State-specific metrics
    }
```

### Team Events

```python
class TeamAssembledEvent(BaseEvent):
    """Event when a team is fully assembled."""
    
    event_type: Literal["team_assembled"]
    payload: Dict[str, Any] = {
        "team_id": str,            # Team identifier
        "task_id": str,            # Associated task
        "assembler_id": str,       # Entity that assembled the team
        "member_count": int,       # Number of team members
        "formation_method": str,   # How team was formed
        "agent_roles": dict,       # Mapping of agents to roles
        "token_budget": int,       # Team's token budget
        "estimated_completion_time": datetime # Projected completion
    }

class TeamPerformanceEvent(BaseEvent):
    """Event recording team performance metrics."""
    
    event_type: Literal["team_performance"]
    payload: Dict[str, Any] = {
        "team_id": str,            # Team identifier
        "task_id": str,            # Associated task
        "success_rating": float,   # Overall success (0-1)
        "completion_time": int,    # Time to completion (seconds)
        "token_usage": int,        # Tokens consumed by team
        "budget_variance": float,  # % over/under budget
        "collaboration_metrics": dict, # Team collaboration metrics
        "capability_metrics": dict  # Capability utilization metrics
    }
```

### Task Events

```python
class TaskSubmittedEvent(BaseEvent):
    """Event when a task is submitted to the system."""
    
    event_type: Literal["task_submitted"]
    payload: Dict[str, Any] = {
        "task_id": str,            # Task identifier
        "title": str,              # Task title
        "description": str,        # Detailed requirements
        "submitted_by": str,       # User who submitted task
        "priority": int,           # Priority level (1-5)
        "token_budget": int,       # Allocated token budget
        "deadline": datetime       # Expected completion deadline
    }

class TaskAnalyzedEvent(BaseEvent):
    """Event when task analysis is completed."""
    
    event_type: Literal["task_analyzed"]
    payload: Dict[str, Any] = {
        "task_id": str,            # Task identifier
        "analyzer_id": str,        # Entity that analyzed the task
        "extracted_capabilities": list, # Required capabilities
        "complexity": float,       # Estimated complexity (0-1)
        "token_estimate": int,     # Estimated token usage
        "time_estimate": int,      # Estimated completion time (seconds)
        "recommended_team_size": int # Suggested team size
    }
```

## FastAPI Models

### Input Models

```python
class CreateAgentTemplateRequest(BaseModel):
    """Request to create a new agent template."""
    
    name: str
    description: str
    model: str
    parameters: Dict[str, Any]
    personality: str
    capabilities: List[str]
    is_auto_generated: bool = False
    approval_required: bool = True
    governance_rules: Dict[str, Any] = {}
    
    class Config:
        schema_extra = {
            "example": {
                "name": "Research Assistant",
                "description": "Specialized in data analysis and insight extraction",
                "model": "gpt-4",
                "parameters": {"temperature": 0.3, "max_tokens": 2000},
                "personality": "analytical, detail-oriented, thorough",
                "capabilities": ["data_analysis", "report_generation"],
                "is_auto_generated": False,
                "approval_required": True,
                "governance_rules": {
                    "transitions": {
                        "initialized_to_running": {"approval": "automatic"},
                        "running_to_completed": {"approval": "automatic"},
                        "running_to_paused": {"approval": "human", "timeout": 3600}
                    }
                }
            }
        }
```

### Response Models

```python
class AgentStateResponse(BaseModel):
    """Response containing agent state information."""
    
    agent_id: str
    name: str
    current_state: str
    state_timestamp: datetime
    previous_state: Optional[str] = None
    time_in_state: int
    capabilities: List[Dict[str, Any]]
    team_id: Optional[str] = None
    task_id: Optional[str] = None
    token_usage: int
    token_budget: int
    
    class Config:
        schema_extra = {
            "example": {
                "agent_id": "a1b2c3d4-e5f6-7890-abcd-1234567890ab",
                "name": "Research Bot Alpha",
                "current_state": "running",
                "state_timestamp": "2025-03-12T18:25:43.511Z",
                "previous_state": "initialized",
                "time_in_state": 1205,
                "capabilities": [
                    {"name": "data_analysis", "proficiency": 0.85},
                    {"name": "report_generation", "proficiency": 0.72}
                ],
                "team_id": "team123",
                "task_id": "task456",
                "token_usage": 1230,
                "token_budget": 10000
            }
        }
```

### WebSocket Message Models

```python
class WSMessage(BaseModel):
    """Base WebSocket message structure."""
    
    message_type: str
    timestamp: datetime
    payload: Dict[str, Any]

class AgentUpdateMessage(WSMessage):
    """WebSocket message for agent updates."""
    
    message_type: Literal["agent_update"]
    payload: Dict[str, Any] = {
        "agent_id": str,
        "previous_state": Optional[str],
        "new_state": str,
        "svg": str,
        "animation_type": str,
        "token_usage": int,
        "message": Optional[str]
    }

class TeamUpdateMessage(WSMessage):
    """WebSocket message for team updates."""
    
    message_type: Literal["team_update"]
    payload: Dict[str, Any] = {
        "team_id": str,
        "status": str,
        "members": List[Dict[str, Any]],
        "connections": List[Dict[str, Any]],
        "task_progress": float,
        "message": Optional[str]
    }
```

## Pydantic Configuration Models

```python
class DatabaseConfig(BaseModel):
    """Neo4j database configuration."""
    
    uri: str
    username: str
    password: SecretStr
    max_connection_pool_size: int = 50
    connection_timeout: int = 30
    connection_acquisition_timeout: int = 60
    max_transaction_retry_time: int = 30
    
class KafkaConfig(BaseModel):
    """Kafka configuration."""
    
    bootstrap_servers: List[str]
    security_protocol: str = "PLAINTEXT"
    sasl_mechanism: Optional[str] = None
    sasl_username: Optional[str] = None
    sasl_password: Optional[SecretStr] = None
    group_id: str
    auto_offset_reset: str = "earliest"
    enable_auto_commit: bool = True
    
class AgentRuntimeConfig(BaseModel):
    """Configuration for agent runtime environment."""
    
    default_token_budget: int = 10000
    default_timeout: int = 300
    max_consecutive_errors: int = 3
    retry_backoff_seconds: int = 5
    models: Dict[str, Dict[str, Any]]
    prompt_templates: Dict[str, str]
    capability_registry: str
```

## GNN Data Configuration

```python
class GNNTrainingConfig(BaseModel):
    """Configuration for GNN training process."""
    
    model_type: str = "GraphSAGE"
    hidden_channels: int = 128
    num_layers: int = 2
    dropout: float = 0.2
    learning_rate: float = 0.001
    weight_decay: float = 5e-4
    batch_size: int = 32
    num_epochs: int = 100
    early_stopping_patience: int = 10
    validation_split: float = 0.2
    test_split: float = 0.1
    random_seed: int = 42
    use_gpu: bool = True
    save_path: str = "models/gnn"
    
class SyntheticDataConfig(BaseModel):
    """Configuration for synthetic data generation."""
    
    num_agents: int = 50
    num_capabilities: int = 20
    num_tasks: int = 100
    num_teams: int = 30
    capability_distribution: str = "zipf"
    collaboration_density: float = 0.3
    success_rate_mean: float = 0.7
    success_rate_std: float = 0.15
    random_seed: int = 42
```
