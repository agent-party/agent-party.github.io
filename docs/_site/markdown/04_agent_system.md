# Agent System

This document provides a comprehensive guide to the Agent Party agent system, including templates, instances, lifecycle management, and transition governance.

## Agent Architecture

### Agent Concepts

Agent Party distinguishes between two core agent concepts:

1. **Agent Templates**: Immutable blueprints that define capabilities, personality, and parameters
2. **Agent Instances**: Runtime incarnations of templates that maintain state and track resources

This separation enables:
- Consistent agent creation and configuration
- Versioning and governance of agent capabilities
- Performance analysis across multiple instances
- Efficient resource tracking and token accounting

### Agent Templates

Templates define what an agent is capable of doing and how it approaches tasks.

#### Template Properties

- **Core Attributes**: Name, description, and metadata
- **Capabilities**: Specific skills and functions the agent can perform
- **Personality**: Character traits that influence agent behavior
- **Model Parameters**: Configuration for the underlying AI model
- **Cost Profile**: Expected token usage and resource requirements
- **Governance Rules**: Defines which transitions require approval

#### Template Construction

Templates can be created through two primary methods:

##### Automated Construction (Talent Scout)

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  Task         │     │  Talent Scout │     │  Template     │
│  Analysis     │────►│  Agent        │────►│  Registry     │
└───────────────┘     └───────────────┘     └───────────────┘
```

1. Talent Scout analyzes task requirements to identify needed capabilities
2. System queries existing templates to find matching capabilities
3. If no suitable template exists, Talent Scout generates new template specifications
4. Template is validated against capability requirements
5. Performance metrics are projected based on similar templates
6. New template is registered in Neo4j with "proposed" status
7. Depending on settings, may require approval before use

##### Manual Construction (Human)

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  Template     │     │  Validation   │     │  Template     │
│  Designer UI  │────►│  Service      │────►│  Registry     │
└───────────────┘     └───────────────┘     └───────────────┘
```

1. Interface allows humans to define template parameters
2. System validates capabilities against known models
3. Cost estimator provides projected token usage
4. Template compatibility checked against existing ecosystem
5. Template is registered with "human_created" flag
6. System tracks performance to compare with automated templates

#### Template Versioning

Templates support versioning to allow evolution while maintaining backward compatibility:

```
┌───────────┐
│ Template  │
│ v1.0.0    │
└─────┬─────┘
      │
┌─────▼─────┐     ┌───────────┐
│ Template  │────►│ Template  │
│ v1.1.0    │     │ v2.0.0    │
└─────┬─────┘     └───────────┘
      │
┌─────▼─────┐
│ Template  │
│ v1.2.0    │
└───────────┘
```

- **Patch Versions**: Fix issues without changing capabilities (1.0.0 → 1.0.1)
- **Minor Versions**: Add capabilities non-disruptively (1.0.0 → 1.1.0)
- **Major Versions**: Significant capability or behavior changes (1.0.0 → 2.0.0)

### Agent Instances

Instances are runtime incarnations of templates, created to perform specific tasks as part of teams.

#### Instance Properties

- **Core Attributes**: ID, name, and instantiation details
- **Current State**: Position in the lifecycle state machine
- **Resource Metrics**: Token usage, time metrics, and costs
- **Performance Data**: Capability efficiency and collaboration statistics
- **Relationships**: Team memberships and collaboration history
- **Embeddings**: Vector representations for GNN recommendations

#### Instance Creation

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  Template     │     │  Agent        │     │  Lifecycle    │
│  Registry     │────►│  Factory      │────►│  Manager      │
└───────────────┘     └───────────────┘     └───────────────┘
```

1. System selects appropriate template for task requirements
2. Agent Factory creates instance from template
3. Resources are allocated according to template specifications
4. Instance is registered in the PROVISIONED state
5. Lifecycle Manager begins state transition process

## Agent Lifecycle Management

### Lifecycle States

Agent instances progress through a defined sequence of states:

```
┌────────────┐     ┌────────────┐     ┌────────────┐     ┌────────────┐
│            │     │            │     │            │     │            │
│  TEMPLATE  │────►│ PROVISIONED│────►│INITIALIZED │────►│  RUNNING   │
│            │     │            │     │            │     │            │
└────────────┘     └────────────┘     └────────────┘     └─────┬──────┘
                                                               │
┌────────────┐     ┌────────────┐     ┌────────────┐     ┌────▼──────┐
│            │     │            │     │            │     │            │
│  ARCHIVED  │◄────│ COMPLETED  │◄────│   FAILED   │◄────│   PAUSED   │
│            │     │            │     │            │     │            │
└────────────┘     └────────────┘     └────────────┘     └────────────┘
```

1. **TEMPLATE**: The blueprint definition, not yet instantiated
2. **PROVISIONED**: Resources allocated, but agent not yet initialized
3. **INITIALIZED**: Agent loaded with task context and ready to execute
4. **RUNNING**: Actively processing and generating outputs
5. **PAUSED**: Temporarily halted, awaiting resumption
6. **COMPLETED**: Successfully finished assigned work
7. **FAILED**: Encountered unrecoverable error or exceeded constraints
8. **ARCHIVED**: No longer active, but preserved for analysis

#### State Transition Events

Each state transition is recorded as an event in Kafka and stored in Neo4j:

```python
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

### Transition Types

The system supports three distinct types of transitions between states:

#### 1. Automatic Transitions

System-initiated transitions that occur based on predetermined criteria:

```
[INITIALIZED] ──automatic──> [RUNNING]
```

- Executed by the system without human intervention
- Based on programmatic conditions like initialization completion
- Recorded with `transition_type: "automatic"`
- Always validate against capability permissions and budget constraints
- Can trigger cascade transitions in dependent agents

Example:
```python
async def auto_transition_to_running(agent_id: str) -> None:
    """Automatically transition agent to RUNNING state once initialized."""
    
    # Check if agent is in correct state
    agent = await agent_repository.get_agent_by_id(agent_id)
    if agent.status != "initialized":
        raise InvalidStateTransition(f"Agent {agent_id} not in INITIALIZED state")
    
    # Verify budget constraints
    if not await budget_service.has_sufficient_budget(agent_id):
        await transition_to_paused(agent_id, "Insufficient budget")
        return
        
    # Execute transition
    await lifecycle_manager.transition_agent(
        agent_id=agent_id,
        new_state="running",
        reason="Initialization complete",
        approver="system",
        transition_type="automatic"
    )
```

#### 2. Human-in-the-Loop (HITL) Approval

Transitions that require explicit human verification before proceeding:

```
[RUNNING] ──pending_approval──> [PENDING_APPROVAL] ──human_approved──> [COMPLETED]
```

- Notification sent to designated approver
- System waits in intermediate "pending_approval" state
- Human can approve, reject, or modify the transition
- All approval actions are logged with approver identity
- Timeout mechanisms prevent indefinite waiting
- Critical for high-risk or high-cost operations

Example:
```python
async def request_human_approval(agent_id: str, target_state: str) -> None:
    """Request human approval for a state transition."""
    
    # Create approval request
    request_id = await approval_service.create_request(
        agent_id=agent_id,
        current_state=agent.status,
        requested_state=target_state,
        reason="Task completion requires verification",
        timeout_seconds=3600  # 1 hour timeout
    )
    
    # Transition to pending state
    await lifecycle_manager.transition_agent(
        agent_id=agent_id,
        new_state="pending_approval",
        reason=f"Awaiting human approval (request {request_id})",
        approver="system",
        transition_type="pending_approval",
        metadata={"approval_request_id": request_id}
    )
    
    # Send notification to approvers
    await notification_service.notify_approvers(
        request_id=request_id,
        message=f"Agent {agent_id} requires approval to transition to {target_state}",
        priority="medium"
    )
```

#### 3. Manager Agent Approval

Specialized agents with oversight capabilities that approve transitions on behalf of humans:

```
[RUNNING] ──manager_review──> [PENDING_APPROVAL] ──manager_approved──> [COMPLETED]
```

- Manager agents apply predefined policies to transitions
- Can escalate to human approval when needed
- Always log decision rationale for auditability
- Optimizes for efficiency while maintaining governance
- Configured with domain-specific approval thresholds

Example:
```python
async def request_manager_approval(agent_id: str, target_state: str) -> None:
    """Request approval from a manager agent."""
    
    # Identify appropriate manager agent
    manager_id = await governance_service.get_manager_for_agent(agent_id)
    
    # Create task for manager agent
    task_id = await task_service.create_task(
        title=f"Approve state transition for agent {agent_id}",
        description=f"Review transition from {agent.status} to {target_state}",
        priority=3,
        required_capabilities=["agent_governance", "policy_enforcement"],
        metadata={
            "agent_id": agent_id,
            "current_state": agent.status,
            "requested_state": target_state,
            "token_usage": agent.token_count,
            "performance_metrics": await metrics_service.get_agent_metrics(agent_id)
        }
    )
    
    # Assign task to manager
    await task_service.assign_agent(task_id, manager_id)
    
    # Transition to pending state
    await lifecycle_manager.transition_agent(
        agent_id=agent_id,
        new_state="pending_approval",
        reason=f"Awaiting manager approval (task {task_id})",
        approver="system",
        transition_type="manager_review",
        metadata={"approval_task_id": task_id}
    )
```

### Transition Governance

Each agent template defines governance rules that specify approval requirements:

```json
{
  "governance_rules": {
    "transitions": {
      "provisioned_to_initialized": {
        "approval": "automatic"
      },
      "initialized_to_running": {
        "approval": "automatic"
      },
      "running_to_paused": {
        "approval": "automatic",
        "conditions": {
          "token_threshold_exceeded": true,
          "timeout_exceeded": true,
          "error_count_exceeded": true
        }
      },
      "running_to_completed": {
        "approval": "human",
        "timeout_seconds": 3600,
        "escalation_path": "team_manager",
        "conditions": {
          "cost_above": 100000,
          "sensitive_data_accessed": true
        }
      },
      "paused_to_running": {
        "approval": "manager",
        "escalation_path": "team_manager"
      },
      "any_to_failed": {
        "approval": "automatic"
      },
      "completed_to_archived": {
        "approval": "automatic",
        "delay_hours": 72
      }
    },
    "budget_thresholds": {
      "warn_at": 70,
      "pause_at": 90,
      "require_approval_above": 80
    },
    "performance_conditions": {
      "auto_approve_if_reliability_above": 0.95,
      "always_require_approval_if_reliability_below": 0.7
    }
  }
}
```

#### Approval Selection Logic

The system determines the appropriate approval type based on multiple factors:

```python
async def determine_approval_type(
    agent_id: str,
    current_state: str,
    target_state: str
) -> str:
    """Determine the type of approval needed for a state transition."""
    
    agent = await agent_repository.get_agent_by_id(agent_id)
    template = await template_repository.get_template_by_id(agent.template_id)
    
    # Get governance rules
    transition_key = f"{current_state}_to_{target_state}"
    fallback_key = f"any_to_{target_state}"
    
    rules = template.governance_rules.get("transitions", {})
    transition_rules = rules.get(transition_key) or rules.get(fallback_key)
    
    if not transition_rules:
        # Default to most restrictive option if no rules defined
        return "human"
    
    base_approval = transition_rules.get("approval", "human")
    
    # Check conditions that might escalate approval requirements
    if base_approval == "automatic":
        # Check budget thresholds
        budget_usage_percent = (agent.token_count / agent.token_budget) * 100
        budget_threshold = template.governance_rules.get("budget_thresholds", {})
        
        if budget_usage_percent >= budget_threshold.get("require_approval_above", 80):
            return "human"
        
        # Check performance conditions
        perf_conditions = template.governance_rules.get("performance_conditions", {})
        if agent.reliability_score <= perf_conditions.get("always_require_approval_if_reliability_below", 0.7):
            return "human"
    
    # Check if specific conditions require escalation
    conditions = transition_rules.get("conditions", {})
    for condition_name, required in conditions.items():
        if required and await condition_service.check_condition(agent_id, condition_name):
            return "human"
    
    # Apply performance-based automatic approvals
    if base_approval in ["human", "manager"]:
        perf_conditions = template.governance_rules.get("performance_conditions", {})
        auto_threshold = perf_conditions.get("auto_approve_if_reliability_above", 0.95)
        
        if agent.reliability_score >= auto_threshold:
            return "automatic"
    
    return base_approval
```

## Data Model Integration

The agent lifecycle is represented in Neo4j using:

```cypher
// Template structure
CREATE (t:AgentTemplate {id: "template123", name: "Researcher"})
CREATE (tv:TemplateVersion {id: "tv456", template_id: "template123", version: "1.2.0"})
CREATE (t)-[:HAS_VERSION]->(tv)
CREATE (tv)-[:DEFINES_PARAMETERS]->(:ModelParameters {id: "params789"})
CREATE (tv)-[:REQUIRES]->(:Capability {id: "cap001", name: "research"})

// Agent instance and lifecycle
CREATE (a:Agent {id: "agent001", name: "ResearcherBot"})
CREATE (a)-[:INSTANTIATES]->(tv)
CREATE (s1:AgentState {id: "state001", name: "provisioned", timestamp: datetime()})
CREATE (s2:AgentState {id: "state002", name: "initialized", timestamp: datetime()})
CREATE (a)-[:HAS_STATE {timestamp: datetime()}]->(s1)
CREATE (a)-[:HAS_STATE {timestamp: datetime()}]->(s2)

// Transition approvers
CREATE (system:System {id: "system"})
CREATE (user:User {id: "user001", name: "Admin"})
CREATE (manager:Agent {id: "manager001", name: "TeamManager"})
CREATE (a)-[:TRANSITIONED_BY {timestamp: datetime(), reason: "Provisioning complete"}]->(system)
CREATE (a)-[:TRANSITIONED_BY {timestamp: datetime(), reason: "Context loaded"}]->(user)
```

## Agent Observability and Metrics

For each agent instance, the system tracks:

### State-Based Metrics

- **Time Metrics**:
  - Time spent in each state
  - Total lifetime of the agent
  - Time-to-completion for tasks
  - Waiting times for approvals

- **Resource Metrics**:
  - Token consumption per state
  - Tokens per task completion
  - Memory usage
  - API call counts

### Transition Metrics

- **Approval Metrics**:
  - Transition approval times
  - Approval request counts
  - Approval distribution by type
  - Rejection reasons

- **Quality Metrics**:
  - Success rate of transitions
  - Error rates by state
  - Recovery attempts
  - State reversion counts

### Collaboration Metrics

- **Team Performance**:
  - Collaboration success scores
  - Communication efficiency
  - Task contributions
  - Role effectiveness

- **Compatibility Metrics**:
  - Agent pairing scores
  - Team cohesion metrics
  - Cross-capability synergies

All metrics feed back into the template design process, allowing Talent Scout to refine templates based on real-world performance of instances.

## Implementation Components

### Core Classes

```python
class AgentLifecycleManager:
    """Manages agent lifecycle transitions and states."""
    
    def __init__(
        self,
        agent_repository: AgentRepository,
        template_repository: TemplateRepository,
        event_publisher: EventPublisher,
        approval_service: ApprovalService,
        condition_service: ConditionService,
        metrics_service: MetricsService
    ):
        self.agent_repository = agent_repository
        self.template_repository = template_repository
        self.event_publisher = event_publisher
        self.approval_service = approval_service
        self.condition_service = condition_service
        self.metrics_service = metrics_service
    
    async def transition_agent(
        self,
        agent_id: str,
        new_state: str,
        reason: str,
        approver: str,
        transition_type: str,
        metadata: dict = None
    ) -> None:
        """
        Transition an agent to a new state.
        
        Args:
            agent_id: Unique identifier for the agent
            new_state: Target state to transition to
            reason: Reason for the transition
            approver: Entity that approved the transition
            transition_type: Type of transition (automatic, human, manager)
            metadata: Additional transition metadata
        
        Raises:
            InvalidStateTransition: If the transition is not allowed
            AgentNotFound: If the agent does not exist
        """
        # Implementation details
        ...
    
    async def request_transition(
        self,
        agent_id: str,
        target_state: str,
        reason: str,
        requested_by: str
    ) -> str:
        """
        Request a state transition for an agent.
        
        Args:
            agent_id: Unique identifier for the agent
            target_state: Desired state to transition to
            reason: Reason for requesting the transition
            requested_by: Entity requesting the transition
            
        Returns:
            str: ID of the transition request
            
        Raises:
            AgentNotFound: If the agent does not exist
            InvalidStateTransition: If the transition is not valid
        """
        # Implementation details
        ...
```

```python
class AgentFactory:
    """Factory for creating agent instances from templates."""
    
    def __init__(
        self,
        template_repository: TemplateRepository,
        agent_repository: AgentRepository,
        capability_service: CapabilityService,
        lifecycle_manager: AgentLifecycleManager,
        event_publisher: EventPublisher
    ):
        self.template_repository = template_repository
        self.agent_repository = agent_repository
        self.capability_service = capability_service
        self.lifecycle_manager = lifecycle_manager
        self.event_publisher = event_publisher
    
    async def create_agent(
        self,
        template_id: str,
        template_version: str = None,
        name: str = None,
        token_budget: int = None,
        metadata: dict = None
    ) -> str:
        """
        Create a new agent instance from a template.
        
        Args:
            template_id: ID of the template to instantiate
            template_version: Specific version to use (default: latest)
            name: Name for the new agent (default: generated)
            token_budget: Token budget override (default: template default)
            metadata: Additional agent metadata
            
        Returns:
            str: ID of the newly created agent
            
        Raises:
            TemplateNotFound: If template doesn't exist
            TemplateVersionNotFound: If version doesn't exist
            ResourceAllocationFailed: If provisioning fails
        """
        # Implementation details
        ...
```

### Service Interfaces

```python
class ApprovalService(Protocol):
    """Service for managing approval workflows."""
    
    async def create_request(
        self, 
        agent_id: str, 
        current_state: str,
        requested_state: str, 
        reason: str,
        timeout_seconds: int = 3600
    ) -> str:
        """Create an approval request."""
        ...
    
    async def approve_request(
        self, 
        request_id: str, 
        approver_id: str, 
        notes: str = None
    ) -> None:
        """Approve a pending request."""
        ...
    
    async def reject_request(
        self, 
        request_id: str, 
        approver_id: str, 
        reason: str
    ) -> None:
        """Reject a pending request."""
        ...
    
    async def get_pending_requests(
        self, 
        approver_id: str = None
    ) -> List[Dict[str, Any]]:
        """Get pending approval requests."""
        ...
```

```python
class ConditionService(Protocol):
    """Service for evaluating condition predicates."""
    
    async def check_condition(
        self,
        agent_id: str,
        condition_name: str
    ) -> bool:
        """
        Check if a named condition is true for an agent.
        
        Args:
            agent_id: Agent to check condition for
            condition_name: Name of the condition to evaluate
            
        Returns:
            bool: True if condition is met, False otherwise
        """
        ...
    
    async def register_condition(
        self,
        condition_name: str,
        evaluation_function: Callable[[str], Awaitable[bool]]
    ) -> None:
        """Register a new condition evaluator."""
        ...
```
