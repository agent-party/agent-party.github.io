# Team Formation

This document outlines the team formation process in Agent Party, focusing on the GNN recommendation engine, capability matching, and collaboration optimization.

## Team Formation Overview

### Core Concepts

Team formation in Agent Party follows a structured process:

1. **Task Analysis**: Extracting required capabilities and parameters
2. **Capability Matching**: Finding agents with required skills
3. **Collaboration Analysis**: Evaluating historical agent interactions 
4. **GNN-Based Recommendations**: Using graph neural networks for optimal team composition
5. **Team Assembly**: Finalizing team structure and roles
6. **Performance Feedback**: Collecting outcomes to improve future recommendations

### Team Formation Pipeline

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  Task         │     │  Capability   │     │  GNN          │
│  Analysis     │────►│  Matching     │────►│  Engine (DJ)  │
└───────────────┘     └───────────────┘     └───────────────┘
                                                    │
┌───────────────┐     ┌───────────────┐     ┌──────▼────────┐
│  Performance  │     │  Team         │     │  Bartender    │
│  Feedback     │◄────│  Assembly     │◄────│  Service      │
└───────────────┘     └───────────────┘     └───────────────┘
```

### Evolutionary Orchestration Model

The Agent Party system implements an evolutionary orchestration model where team performance influences future team compositions. The system:

1. **Learns from Experience**: Captures historical team performance data
2. **Evolves Collaborations**: Optimizes team compositions based on success patterns
3. **Adapts to Domains**: Specializes recommendations by task domain and context
4. **Balances Objectives**: Considers time, cost, and quality metrics simultaneously

## GNN Recommendation Engine

### Multi-Objective Optimization

The GNN-based recommendation engine (DJ) optimizes team formation across three dimensions:

1. **Time Efficiency**
   - Task completion duration (lower is better)
   - Process latency and overhead (minimize)
   - Resource utilization efficiency (maximize)
   - Speed of iterative improvements (maximize)

2. **Cost Effectiveness**
   - API usage costs (lower is better)
   - Computational resource requirements (minimize)
   - Human intervention frequency (optimize)
   - Training and improvement expenses (minimize)

3. **Quality Outcomes**
   - Task success metrics (domain-specific targets)
   - Output accuracy and relevance (maximize)
   - Downstream utility of outputs (maximize)
   - Process reliability and predictability (maximize)

These dimensions are combined into a weighted objective function:

```python
def combined_score(team: TeamComposition, weights: Dict[str, float]) -> float:
    """
    Calculate team's overall fitness score using weighted dimensions.
    
    Args:
        team: Candidate team composition
        weights: Weights for each dimension (time_weight, cost_weight, quality_weight)
        
    Returns:
        Combined fitness score
    """
    time_score = calculate_time_score(team)
    cost_score = calculate_cost_score(team)
    quality_score = calculate_quality_score(team)
    
    return (
        weights["time_weight"] * time_score +
        weights["cost_weight"] * cost_score +
        weights["quality_weight"] * quality_score
    )
```

### Acceptance Workflow Integration

The system implements a multi-stage acceptance workflow for team outputs:

1. **Automatic Validation**
   - Completeness checks
   - Structural validation
   - Consistency verification
   - Time/cost target compliance

2. **Human Review**
   - Quality assessment
   - Content moderation
   - Subjective evaluation
   - Improvement recommendations

3. **Manager Approval**
   - Policy compliance verification
   - Final acceptance decisions
   - Resource allocation adjustments
   - Process improvement guidance

This workflow creates a feedback loop that enhances the GNN's ability to recommend optimal teams:

```
Output → Validation → Human Review → Manager Approval → Performance Metrics
  ↑                        |                 |                ↓
  └────────────────────────┴─────────────────┘────────────────┘
                            Feedback Loop
```

## Capability Matching

### Capability Model

Capabilities are the foundation of agent-task matching:

```python
class Capability(BaseModel):
    """Represents a specific skill or function that agents can perform."""
    
    id: str
    name: str
    description: str
    category: str
    token_cost: int
    required_model: Optional[str] = None
    compatibility: List[str] = Field(default_factory=list)
    embeddings: Optional[List[float]] = None
```

### Basic Capability Matching

The system implements a foundational matching algorithm to identify agents with required capabilities:

```python
async def find_matching_agents(
    task_id: str, 
    capability_threshold: float = 0.7
) -> List[Dict[str, Any]]:
    """
    Find agents that match the capabilities required by a task.
    
    Args:
        task_id: ID of the task to match agents for
        capability_threshold: Minimum proficiency threshold (0-1)
        
    Returns:
        List of agent records with matching scores
    """
    # Get task requirements
    task = await task_repository.get_task_by_id(task_id)
    required_capabilities = task.required_capabilities
    
    # Find agents with matching capabilities
    matching_agents = await agent_repository.find_agents_with_capabilities(
        capabilities=required_capabilities,
        min_proficiency=capability_threshold
    )
    
    # Calculate capability coverage scores
    scored_agents = []
    for agent in matching_agents:
        coverage = calculate_capability_coverage(
            agent_capabilities=agent.capabilities,
            required_capabilities=required_capabilities
        )
        
        scored_agents.append({
            "agent_id": agent.id,
            "name": agent.name,
            "capability_score": coverage,
            "reliability_score": agent.reliability_score,
            "capabilities": agent.capabilities
        })
    
    return sorted(scored_agents, key=lambda x: x["capability_score"], reverse=True)
```

### Capability Coverage Calculation

```python
def calculate_capability_coverage(
    agent_capabilities: List[Dict[str, Any]],
    required_capabilities: List[Dict[str, Any]]
) -> float:
    """
    Calculate how well an agent's capabilities cover task requirements.
    
    Args:
        agent_capabilities: Agent's capabilities with proficiency
        required_capabilities: Capabilities required by the task
        
    Returns:
        float: Coverage score (0-1)
    """
    if not required_capabilities:
        return 1.0
        
    total_score = 0.0
    
    # Create a lookup for agent capabilities
    agent_cap_map = {cap["name"]: cap["proficiency"] for cap in agent_capabilities}
    
    for req_cap in required_capabilities:
        cap_name = req_cap["name"]
        importance = req_cap.get("importance", 1.0)
        
        if cap_name in agent_cap_map:
            # Score is the product of proficiency and importance
            proficiency = agent_cap_map[cap_name]
            total_score += proficiency * importance
        
    # Normalize by total importance
    total_importance = sum(cap.get("importance", 1.0) for cap in required_capabilities)
    return total_score / total_importance
```

## GNN Recommendation Engine (DJ)

The GNN Recommendation Engine (DJ) uses graph neural networks to predict optimal team compositions based on historical performance and collaboration patterns.

### Architecture Overview

```
┌───────────────────────────────────────────────────────────────┐
│                    GNN Recommendation Engine                  │
│                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │ Graph Data  │  │ GraphSAGE   │  │ Team Score  │           │
│  │ Processor   │  │ Model       │  │ Predictor   │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
│         │                │                │                   │
│         ▼                ▼                ▼                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│  │ Node        │  │ Message     │  │ Embedding   │           │
│  │ Features    │  │ Passing     │  │ Generator   │           │
│  └─────────────┘  └─────────────┘  └─────────────┘           │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### Graph Representation

The GNN system models the Agent Party ecosystem as a heterogeneous graph:

#### Node Types:
- **Agent nodes**: Represent agent instances with capability and performance features
- **Capability nodes**: Represent distinct skills and functions
- **Task nodes**: Represent specific tasks with requirements and priorities

#### Edge Types:
- **Agent-Agent edges** (WORKED_WITH): Past collaborations with success scores
- **Agent-Capability edges** (HAS_CAPABILITY): Agent's proficiency with capabilities
- **Task-Capability edges** (REQUIRES): Task requirements with importance weights

### GraphSAGE Implementation

The recommendation engine uses GraphSAGE, a graph neural network architecture that generates embeddings by sampling and aggregating features from node neighborhoods:

```python
class GraphSAGEModel(torch.nn.Module):
    """GraphSAGE model for learning node embeddings in the collaboration graph."""
    
    def __init__(
        self,
        in_channels: Dict[str, int],
        hidden_channels: int,
        out_channels: int,
        num_layers: int,
        dropout: float = 0.2
    ):
        super().__init__()
        
        # Node type-specific encoders
        self.node_encoders = torch.nn.ModuleDict()
        for node_type, in_size in in_channels.items():
            self.node_encoders[node_type] = torch.nn.Linear(in_size, hidden_channels)
        
        # GraphSAGE convolution layers
        self.convs = torch.nn.ModuleList()
        for _ in range(num_layers):
            conv = HeteroConv({
                ('Agent', 'WORKED_WITH', 'Agent'): SAGEConv(
                    hidden_channels, hidden_channels
                ),
                ('Agent', 'HAS_CAPABILITY', 'Capability'): SAGEConv(
                    hidden_channels, hidden_channels
                ),
                ('Capability', 'HAS_CAPABILITY_REV', 'Agent'): SAGEConv(
                    hidden_channels, hidden_channels
                ),
                ('Task', 'REQUIRES', 'Capability'): SAGEConv(
                    hidden_channels, hidden_channels
                ),
                ('Capability', 'REQUIRES_REV', 'Task'): SAGEConv(
                    hidden_channels, hidden_channels
                ),
            })
            self.convs.append(conv)
        
        # Output layer
        self.lin = torch.nn.Linear(hidden_channels, out_channels)
        self.dropout = torch.nn.Dropout(dropout)
    
    def forward(self, x_dict, edge_index_dict):
        # Initial node feature encoding
        for node_type, x in x_dict.items():
            x_dict[node_type] = self.node_encoders[node_type](x)
            
        # Message passing layers
        for conv in self.convs:
            x_dict = conv(x_dict, edge_index_dict)
            x_dict = {key: value.relu() for key, value in x_dict.items()}
            x_dict = {key: self.dropout(value) for key, value in x_dict.items()}
            
        # Final transformation
        return {key: self.lin(x) for key, x in x_dict.items()}
```

### Collaboration Prediction

The GNN model predicts the success probability of agent collaborations:

```python
class CollaborationPredictor:
    """Predicts success probability for agent collaborations using GNN embeddings."""
    
    def __init__(self, model, data_processor):
        self.model = model
        self.data_processor = data_processor
        
    async def predict_collaboration_success(
        self, agent_ids: List[str], task_id: str
    ) -> float:
        """
        Predict the success probability for a team of agents on a specific task.
        
        Args:
            agent_ids: List of agent IDs forming the team
            task_id: ID of the task to be performed
            
        Returns:
            float: Predicted success probability (0-1)
        """
        # Get node embeddings
        graph_data = await self.data_processor.get_subgraph(agent_ids, task_id)
        node_embeddings = self.model(graph_data.x_dict, graph_data.edge_index_dict)
        
        # Extract agent and task embeddings
        agent_embeds = torch.stack([
            node_embeddings['Agent'][graph_data.agent_idx[agent_id]] 
            for agent_id in agent_ids
        ])
        task_embed = node_embeddings['Task'][graph_data.task_idx[task_id]]
        
        # Calculate team embedding (mean pooling)
        team_embed = torch.mean(agent_embeds, dim=0)
        
        # Compute team-task compatibility
        compatibility = torch.cosine_similarity(team_embed, task_embed, dim=0)
        
        # Compute pairwise agent compatibilities
        agent_compatibilities = []
        for i in range(len(agent_ids)):
            for j in range(i+1, len(agent_ids)):
                agent_i_embed = agent_embeds[i]
                agent_j_embed = agent_embeds[j]
                pair_compat = torch.cosine_similarity(agent_i_embed, agent_j_embed, dim=0)
                agent_compatibilities.append(pair_compat)
        
        # Overall success probability
        if agent_compatibilities:
            mean_agent_compat = torch.mean(torch.stack(agent_compatibilities))
            success_prob = (compatibility * 0.6) + (mean_agent_compat * 0.4)
        else:
            success_prob = compatibility
            
        return success_prob.item()
```

### Team Recommendation Process

The team recommendation process integrates capability matching with GNN predictions:

```python
async def recommend_team(
    task_id: str,
    max_team_size: int = 5,
    capability_threshold: float = 0.7,
    min_reliability: float = 0.5,
    use_gnn: bool = True
) -> List[Dict[str, Any]]:
    """
    Recommend an optimal team for a given task.
    
    Args:
        task_id: ID of the task to recommend a team for
        max_team_size: Maximum number of agents in the team
        capability_threshold: Minimum capability proficiency
        min_reliability: Minimum agent reliability score
        use_gnn: Whether to use GNN predictions for team optimization
        
    Returns:
        List of recommended agent records with role assignments
    """
    # Get task details
    task = await task_repository.get_task_by_id(task_id)
    
    # Find capability-matching agents
    matching_agents = await find_matching_agents(
        task_id=task_id,
        capability_threshold=capability_threshold
    )
    
    # Filter by reliability
    candidates = [a for a in matching_agents if a["reliability_score"] >= min_reliability]
    
    if not candidates:
        raise NoSuitableAgentsFound(f"No suitable agents found for task {task_id}")
    
    if not use_gnn:
        # Basic team formation using greedy capability coverage
        return optimize_team_by_capability(
            candidates=candidates,
            required_capabilities=task.required_capabilities,
            max_team_size=max_team_size
        )
    
    # Advanced team formation using GNN
    return await optimize_team_by_gnn(
        task_id=task_id,
        candidates=candidates,
        max_team_size=max_team_size
    )
```

### GNN-Based Team Optimization

```python
async def optimize_team_by_gnn(
    task_id: str,
    candidates: List[Dict[str, Any]],
    max_team_size: int
) -> List[Dict[str, Any]]:
    """
    Optimize team composition using GNN collaboration predictions.
    
    Args:
        task_id: ID of the task
        candidates: Pre-filtered agent candidates
        max_team_size: Maximum team size
        
    Returns:
        Optimized team with role assignments
    """
    # Get GNN model
    model = await gnn_service.get_model()
    predictor = CollaborationPredictor(model, gnn_service.data_processor)
    
    # Start with empty team
    best_team = []
    best_score = 0.0
    
    # Try different team sizes
    for team_size in range(1, min(max_team_size, len(candidates)) + 1):
        # Try different combinations
        for team_candidates in combinations(candidates, team_size):
            team_agent_ids = [a["agent_id"] for a in team_candidates]
            
            # Calculate capability coverage
            capability_score = calculate_team_capability_coverage(
                team_candidates, 
                task_id
            )
            
            # Predict collaboration success
            collab_score = await predictor.predict_collaboration_success(
                team_agent_ids, 
                task_id
            )
            
            # Combined score (weighted)
            score = (capability_score * 0.6) + (collab_score * 0.4)
            
            if score > best_score:
                best_score = score
                best_team = list(team_candidates)
    
    # Assign roles based on capability matching
    return await assign_team_roles(best_team, task_id)
```

## Team Assembly Service (Bartender)

The Bartender service handles the final team assembly process, transforming recommendations into operational teams.

### Responsibilities

- **Team Creation**: Establishing team records in Neo4j
- **Role Assignment**: Assigning specific roles to team members
- **Agent Provisioning**: Triggering agent lifecycle transitions
- **Team Communication**: Establishing communication paths

### Implementation

```python
class TeamAssemblyService:
    """Service for assembling and managing teams (Bartender)."""
    
    def __init__(
        self,
        team_repository: TeamRepository,
        agent_repository: AgentRepository,
        task_repository: TaskRepository,
        agent_factory: AgentFactory,
        lifecycle_manager: AgentLifecycleManager,
        event_publisher: EventPublisher
    ):
        self.team_repository = team_repository
        self.agent_repository = agent_repository
        self.task_repository = task_repository
        self.agent_factory = agent_factory
        self.lifecycle_manager = lifecycle_manager
        self.event_publisher = event_publisher
    
    async def assemble_team(
        self,
        task_id: str,
        recommended_agents: List[Dict[str, Any]],
        team_name: Optional[str] = None,
        formation_method: str = "recommended"
    ) -> str:
        """
        Assemble a team based on recommendations.
        
        Args:
            task_id: ID of the task
            recommended_agents: List of agent records with role assignments
            team_name: Optional team name (generated if not provided)
            formation_method: How the team was formed
            
        Returns:
            str: ID of the newly created team
        """
        # Create team record
        team_id = await self.team_repository.create_team({
            "name": team_name or f"Team-{uuid.uuid4().hex[:8]}",
            "task_id": task_id,
            "formation_method": formation_method,
            "size": len(recommended_agents),
            "status": "forming"
        })
        
        # Add agents to team
        for agent_data in recommended_agents:
            agent_id = agent_data["agent_id"]
            role = agent_data["assigned_role"]
            
            # Add team membership relationship
            await self.team_repository.add_agent_to_team(
                agent_id=agent_id,
                team_id=team_id,
                role=role
            )
            
            # Initialize agent if needed
            agent = await self.agent_repository.get_agent_by_id(agent_id)
            if agent.status == "provisioned":
                await self.lifecycle_manager.transition_agent(
                    agent_id=agent_id,
                    new_state="initialized",
                    reason=f"Joining team {team_id} for task {task_id}",
                    approver="system",
                    transition_type="automatic"
                )
        
        # Update team status
        await self.team_repository.update_team_status(team_id, "assembled")
        
        # Publish team assembled event
        await self.event_publisher.publish_event(
            "team_events",
            EventFactory.create_team_assembled_event(
                team_id=team_id,
                task_id=task_id,
                agent_roles={a["agent_id"]: a["assigned_role"] for a in recommended_agents}
            )
        )
        
        return team_id
```

## Performance Feedback Loop

The system implements a feedback loop to continuously improve team recommendations:

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  Team         │     │  Performance  │     │  Collaboration│
│  Completion   │────►│  Evaluation   │────►│  Scoring      │
└───────────────┘     └───────────────┘     └───────────────┘
                                                    │
┌───────────────┐     ┌───────────────┐     ┌──────▼────────┐
│  GNN          │     │  Weight       │     │  Score        │
│  Retraining   │◄────│  Adjustment   │◄────│  Storage      │
└───────────────┘     └───────────────┘     └───────────────┘
```

### Recording Collaboration Outcomes

```python
async def record_team_performance(
    team_id: str,
    success_rating: float,
    completion_time: int,
    token_usage: int,
    collaboration_metrics: Dict[str, Any]
) -> None:
    """
    Record team performance after task completion.
    
    Args:
        team_id: Team ID
        success_rating: Overall success rating (0-1)
        completion_time: Time to completion in seconds
        token_usage: Total tokens consumed
        collaboration_metrics: Detailed metrics about collaboration
    """
    # Get team and agent data
    team = await team_repository.get_team_by_id(team_id)
    team_agents = await team_repository.get_team_agents(team_id)
    
    # Update team performance record
    await team_repository.update_team_performance(
        team_id=team_id,
        performance_score=success_rating,
        completion_time=completion_time,
        token_usage=token_usage
    )
    
    # Record pairwise collaboration scores
    for i, agent_i in enumerate(team_agents):
        for j, agent_j in enumerate(team_agents):
            if i >= j:  # Skip self-pairs and duplicates
                continue
                
            # Calculate collaboration score between these agents
            pair_key = f"{agent_i['id']},{agent_j['id']}"
            pair_score = collaboration_metrics.get(
                pair_key, 
                success_rating  # Default to overall team score
            )
            
            # Record or update collaboration relationship
            await agent_repository.record_collaboration(
                agent_1_id=agent_i["id"],
                agent_2_id=agent_j["id"],
                task_id=team["task_id"],
                team_id=team_id,
                success_score=pair_score
            )
    
    # Publish performance event
    await event_publisher.publish_event(
        "team_events",
        EventFactory.create_team_performance_event(
            team_id=team_id,
            task_id=team["task_id"],
            success_rating=success_rating,
            completion_time=completion_time,
            token_usage=token_usage,
            collaboration_metrics=collaboration_metrics
        )
    )
```

### Updating Agent Reliability Scores

```python
async def update_agent_reliability(agent_id: str) -> None:
    """
    Update an agent's reliability score based on historical performance.
    
    Args:
        agent_id: Agent ID to update
    """
    # Get agent's collaboration history
    collaborations = await agent_repository.get_agent_collaborations(agent_id)
    
    if not collaborations:
        return  # No data to update
    
    # Calculate weighted average of recent collaborations
    total_weight = 0
    weighted_sum = 0
    
    for collab in collaborations:
        # More recent collaborations have higher weight
        age_days = (datetime.now() - collab["timestamp"]).days
        recency_weight = math.exp(-0.05 * age_days)  # Exponential decay
        
        weighted_sum += collab["success_score"] * recency_weight
        total_weight += recency_weight
    
    if total_weight > 0:
        new_reliability = weighted_sum / total_weight
        
        # Update agent reliability score
        await agent_repository.update_agent_reliability(
            agent_id=agent_id,
            reliability_score=new_reliability
        )
```

## GNN Model Training

### Training Pipeline

```python
async def train_gnn_model(
    config: GNNTrainingConfig
) -> None:
    """
    Train the GNN model for team recommendations.
    
    Args:
        config: Training configuration parameters
    """
    # Prepare training data
    train_data, val_data, test_data = await data_processor.prepare_dataset(
        val_split=config.validation_split,
        test_split=config.test_split,
        random_seed=config.random_seed
    )
    
    # Initialize model
    model = GraphSAGEModel(
        in_channels=data_processor.get_feature_dimensions(),
        hidden_channels=config.hidden_channels,
        out_channels=config.output_dimensions,
        num_layers=config.num_layers,
        dropout=config.dropout
    )
    
    # Configure training
    device = torch.device('cuda' if config.use_gpu and torch.cuda.is_available() else 'cpu')
    model = model.to(device)
    optimizer = torch.optim.Adam(
        model.parameters(),
        lr=config.learning_rate,
        weight_decay=config.weight_decay
    )
    
    # Training loop
    best_val_loss = float('inf')
    patience_counter = 0
    
    for epoch in range(config.num_epochs):
        # Training step
        model.train()
        optimizer.zero_grad()
        
        # Forward pass
        out = model(train_data.x_dict.to(device), train_data.edge_index_dict.to(device))
        
        # Loss calculation
        loss = calculate_loss(out, train_data)
        loss.backward()
        optimizer.step()
        
        # Validation
        model.eval()
        with torch.no_grad():
            val_out = model(val_data.x_dict.to(device), val_data.edge_index_dict.to(device))
            val_loss = calculate_loss(val_out, val_data)
        
        # Early stopping
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            patience_counter = 0
            # Save best model
            torch.save(model.state_dict(), f"{config.save_path}/best_model.pt")
        else:
            patience_counter += 1
            if patience_counter >= config.early_stopping_patience:
                logger.info(f"Early stopping at epoch {epoch}")
                break
    
    # Evaluate on test set
    model.eval()
    with torch.no_grad():
        test_out = model(test_data.x_dict.to(device), test_data.edge_index_dict.to(device))
        test_loss = calculate_loss(test_out, test_data)
        test_metrics = calculate_metrics(test_out, test_data)
    
    # Log results
    logger.info(f"Test loss: {test_loss:.4f}")
    for metric_name, metric_value in test_metrics.items():
        logger.info(f"Test {metric_name}: {metric_value:.4f}")
    
    # Save model metadata
    await model_repository.save_model_metadata({
        "model_type": "GraphSAGE",
        "timestamp": datetime.now().isoformat(),
        "hidden_channels": config.hidden_channels,
        "num_layers": config.num_layers,
        "test_metrics": test_metrics,
        "feature_dimensions": data_processor.get_feature_dimensions(),
        "output_dimensions": config.output_dimensions,
        "path": f"{config.save_path}/best_model.pt"
    })
```

## Implementation Components

### Service Registry Setup

```python
def register_team_formation_services(registry: ServiceRegistry) -> None:
    """Register team formation services with the service registry."""
    
    # Register data processor
    graph_data_processor = GraphDataProcessor(
        neo4j_repository=registry.get_service(Neo4jRepository)
    )
    registry.register(GraphDataProcessor, graph_data_processor)
    
    # Register GNN service
    gnn_service = GNNService(
        data_processor=graph_data_processor,
        model_repository=registry.get_service(ModelRepository),
        config=registry.get_service(ConfigService).get_gnn_config()
    )
    registry.register(GNNService, gnn_service)
    
    # Register team recommendation service
    team_recommender = TeamRecommendationService(
        agent_repository=registry.get_service(AgentRepository),
        task_repository=registry.get_service(TaskRepository),
        capability_repository=registry.get_service(CapabilityRepository),
        gnn_service=gnn_service
    )
    registry.register(TeamRecommendationService, team_recommender)
    
    # Register team assembly service (Bartender)
    team_assembly = TeamAssemblyService(
        team_repository=registry.get_service(TeamRepository),
        agent_repository=registry.get_service(AgentRepository),
        task_repository=registry.get_service(TaskRepository),
        agent_factory=registry.get_service(AgentFactory),
        lifecycle_manager=registry.get_service(AgentLifecycleManager),
        event_publisher=registry.get_service(EventPublisher)
    )
    registry.register(TeamAssemblyService, team_assembly)
