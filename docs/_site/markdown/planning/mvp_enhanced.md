# Agent Party MVP - Enhanced Functional Specification

## 1. Overview

This specification outlines the Minimum Viable Product (MVP) for Agent Party, a multi-agent collaboration platform using Python, FastAPI WebSockets, Neo4j, Kafka, Redis, and MinIO. The MVP will demonstrate real-time agent visualization and basic team formation with a focus on reliability, testability, and maintainability.

## 2. Technology Stack & Architecture

- **Python 3.10+**: Primary programming language with type hints
- **FastAPI**: WebSocket API and web server
- **Neo4j**: Graph database for storing agent data and relationships
- **Kafka**: Event streaming for reliable message processing
- **Redis**: In-memory data store for caching and quick lookups
- **MinIO**: Object storage for artifacts
- **Model Context Protocol (MCP)**: Standard for agent context handling

### 2.1 Core Architectural Patterns

#### 2.1.1 Service Registry & Dependency Injection

The system will utilize our modernized Service Registry for dependency injection, allowing components to be:
- Registered with appropriate lifecycles (singleton, transient, scoped)
- Retrieved with proper dependency resolution
- Tested with mock implementations

```python
# Example service registration
from agent_party.utils.service_registry import ServiceRegistry, ServiceScope, service_factory

@service_factory(["neo4j_connection"])
def create_agent_service(neo4j_connection):
    return AgentServiceImpl(neo4j_connection)

# Register the service
ServiceRegistry.register(
    "agent_service", 
    AgentService, 
    create_agent_service,
    scope=ServiceScope.SINGLETON
)
```

#### 2.1.2 Configuration Management

Configuration will be managed through our modernized Configuration Registry, providing:
- Environment-specific configuration
- Secret management
- Default values with overrides
- Typed configuration access

```python
from agent_party.utils.config_registry_modernized import ConfigRegistry

# Register configurations
ConfigRegistry.register_config(
    "neo4j", 
    {
        "uri": "bolt://localhost:7687",
        "username": "neo4j",
        "password": "password",
        "database": "agent_party",
        "connection_timeout": 30,
        "max_connection_lifetime": 3600
    }
)

# Access configuration
neo4j_config = ConfigRegistry.get_config("neo4j")
```

#### 2.1.3 Protocol-Based Interfaces

All components will use typing.Protocol for interface definitions, enabling:
- Clear contracts between services
- Type safety with mypy
- Easier testing with mocks
- Runtime flexibility

```python
from typing import Protocol, List, Dict, Any

class AgentService(Protocol):
    async def create_agent_from_template(self, template_id: str, team_id: str = None) -> str:
        ...
    
    async def get_agent(self, agent_id: str) -> Dict[str, Any]:
        ...
    
    async def update_agent_status(self, agent_id: str, status: str) -> None:
        ...
```

## 3. Core Components Specification

### 3.1 Agent Component

#### 3.1.1 Agent Data Model (Neo4j)

```python
# Agent Node Properties
agent_properties = {
    "id": "unique_string_uuid4",
    "name": "string",
    "role": "string",  # researcher, writer, critic, etc.
    "personality": "string",  # analytical, creative, supportive, etc.
    "model": "string",  # gpt-4, claude-3, etc.
    "parameters": "json_string",  # model parameters as JSON
    "cost_per_token": "float",
    "status": "string",  # idle, working, error
    "color_scheme": "json_string",  # colors for SVG representation
    "created_at": "timestamp",
    "updated_at": "timestamp"
}

# Template Node Properties
template_properties = {
    "id": "unique_string_uuid4",
    "name": "string",
    "description": "string",
    "role": "string",
    "model": "string",
    "parameters": "json_string",
    "created_at": "timestamp"
}

# Context Node Properties
context_properties = {
    "id": "unique_string_uuid4",
    "content": "json_string",  # MCP formatted context
    "type": "string",  # memory, task, conversation, etc.
    "created_at": "timestamp",
    "updated_at": "timestamp"
}
```

#### 3.1.2 Neo4j Relationships & Optimizations

```cypher
// Create constraints
CREATE CONSTRAINT IF NOT EXISTS ON (a:Agent) ASSERT a.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS ON (t:Template) ASSERT t.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS ON (c:Context) ASSERT c.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS ON (team:Team) ASSERT team.id IS UNIQUE;
CREATE CONSTRAINT IF NOT EXISTS ON (task:Task) ASSERT task.id IS UNIQUE;

// Define indexes
CREATE INDEX IF NOT EXISTS FOR (a:Agent) ON (a.role);
CREATE INDEX IF NOT EXISTS FOR (a:Agent) ON (a.status);
CREATE INDEX IF NOT EXISTS FOR (t:Template) ON (t.role);
CREATE INDEX IF NOT EXISTS FOR (task:Task) ON (task.status);
CREATE INDEX IF NOT EXISTS FOR (team:Team) ON (team.status);

// Performance-optimized relationship indices
CREATE INDEX IF NOT EXISTS FOR ()-[r:MEMBER_OF]->() ON (r.joined_at);
CREATE INDEX IF NOT EXISTS FOR ()-[r:ASSIGNED_TO]->() ON (r.assigned_at);
```

#### 3.1.3 Agent Service Interface (Protocol)

```python
from typing import Protocol, Dict, List, Any, Optional
from datetime import datetime

class AgentService(Protocol):
    """Protocol for agent management service"""
    
    async def create_agent_from_template(
        self, 
        template_id: str, 
        team_id: Optional[str] = None
    ) -> str:
        """
        Create a new agent from a template.
        
        Args:
            template_id: ID of the template to use
            team_id: Optional team ID to assign agent to
            
        Returns:
            ID of the newly created agent
            
        Raises:
            EntityNotFoundError: If template not found
            Neo4jConnectionError: If database connection fails
        """
        ...
    
    async def get_agent(self, agent_id: str) -> Dict[str, Any]:
        """
        Get agent details by ID.
        
        Args:
            agent_id: ID of the agent
            
        Returns:
            Agent details dictionary
            
        Raises:
            EntityNotFoundError: If agent not found
        """
        ...
    
    async def update_agent_status(
        self, 
        agent_id: str, 
        status: str, 
        metadata: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Update agent status.
        
        Args:
            agent_id: ID of the agent
            status: New status value
            metadata: Optional status metadata
            
        Raises:
            EntityNotFoundError: If agent not found
            InvalidStatusError: If status is invalid
        """
        ...
    
    async def find_agents_by_criteria(
        self, 
        criteria: Dict[str, Any],
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Find agents matching the given criteria.
        
        Args:
            criteria: Search criteria dictionary
            limit: Maximum number of results
            offset: Pagination offset
            
        Returns:
            List of matching agent dictionaries
        """
        ...
```
