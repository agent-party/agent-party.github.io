# Agent Party MVP - Functional Specification for AI Coder

## 1. Overview

This specification outlines the Minimum Viable Product (MVP) for Agent Party, a multi-agent collaboration platform using Python, FastAPI WebSockets, Neo4j, Kafka, Redis, and MinIO. The MVP will demonstrate real-time agent visualization and basic team formation.

## 2. Technology Stack

- **Python 3.10+**: Primary programming language
- **FastAPI**: WebSocket API and web server
- **Neo4j**: Graph database for storing agent data and relationships
- **Kafka**: Event streaming for reliable message processing
- **Redis**: In-memory data store for caching and quick lookups
- **MinIO**: Object storage for artifacts
- **Model Context Protocol (MCP)**: Standard for agent context handling

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

#### 3.1.2 Neo4j Relationships

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
```

#### 3.1.3 Agent Service (Python)

```python
class AgentService:
    def __init__(self, neo4j_repository, kafka_producer, redis_client):
        self.neo4j_repository = neo4j_repository
        self.kafka_producer = kafka_producer
        self.redis_client = redis_client

    async def create_agent_from_template(self, template_id, team_id=None):
        # Get template from Neo4j
        template = await self.neo4j_repository.get_template(template_id)
        
        # Create agent with template settings
        agent_id = str(uuid.uuid4())
        agent = {
            "id": agent_id,
            "name": f"{template['role']}_{agent_id[:8]}",
            "role": template["role"],
            "personality": template.get("personality", "neutral"),
            "model": template["model"],
            "parameters": template["parameters"],
            "status": "idle",
            "color_scheme": self._generate_color_scheme(template["role"]),
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        # Store in Neo4j
        await self.neo4j_repository.create_agent(agent, template_id, team_id)
        
        # Publish to Kafka
        await self.kafka_producer.send(
            "agent_events",
            key=agent_id,
            value={"event_type": "agent_created", "agent_id": agent_id}
        )
        
        # Store in Redis for quick access
        await self.redis_client.set(
            f"agent:{agent_id}",
            json.dumps(agent),
            ex=3600  # 1 hour expiry
        )
        
        return agent_id

    def _generate_color_scheme(self, role):
        # Basic colors based on role
        color_map = {
            "researcher": {"primary": "#4285F4", "secondary": "#FBBC05"},
            "writer": {"primary": "#34A853", "secondary": "#EA4335"},
            "critic": {"primary": "#9C27B0", "secondary": "#FFC107"},
            "coordinator": {"primary": "#FF5722", "secondary": "#03A9F4"}
        }
        
        return json.dumps(color_map.get(role, {"primary": "#9E9E9E", "secondary": "#607D8B"}))
```

### 3.2 Team Component

#### 3.2.1 Team Data Model (Neo4j)

```python
team_properties = {
    "id": "unique_string_uuid4",
    "name": "string",
    "task": "string",  # Short description of the task
    "status": "string",  # forming, working, completed, error
    "created_at": "timestamp",
    "updated_at": "timestamp",
    "completed_at": "timestamp_or_null"
}

task_properties = {
    "id": "unique_string_uuid4",
    "description": "string",
    "type": "string",  # research, content-creation, analysis, etc.
    "status": "string",  # submitted, in-progress, completed, error
    "created_at": "timestamp",
    "completed_at": "timestamp_or_null"
}
```

#### 3.2.2 Team Service (Python)

```python
class TeamService:
    def __init__(self, neo4j_repository, kafka_producer, agent_service):
        self.neo4j_repository = neo4j_repository
        self.kafka_producer = kafka_producer
        self.agent_service = agent_service

    async def create_team_for_task(self, task_description, agent_templates):
        # Create task
        task_id = str(uuid.uuid4())
        task = {
            "id": task_id,
            "description": task_description,
            "type": self._determine_task_type(task_description),
            "status": "submitted",
            "created_at": datetime.now().isoformat()
        }
        await self.neo4j_repository.create_task(task)
        
        # Create team
        team_id = str(uuid.uuid4())
        team = {
            "id": team_id,
            "name": f"Team for {task_description[:20]}...",
            "task": task_description,
            "status": "forming",
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        await self.neo4j_repository.create_team(team, task_id)
        
        # Create agents for team
        agent_ids = []
        for template_id in agent_templates:
            agent_id = await self.agent_service.create_agent_from_template(template_id, team_id)
            agent_ids.append(agent_id)
        
        # Publish team created event
        await self.kafka_producer.send(
            "team_events",
            key=team_id,
            value={
                "event_type": "team_created",
                "team_id": team_id,
                "task_id": task_id,
                "agent_ids": agent_ids
            }
        )
        
        return team_id, task_id

    def _determine_task_type(self, description):
        # MVP: Simple keyword-based determination
        keywords = {
            "research": ["research", "find", "search", "investigate"],
            "content-creation": ["write", "create", "generate", "compose"],
            "analysis": ["analyze", "evaluate", "assess", "review"]
        }
        
        for task_type, words in keywords.items():
            if any(word in description.lower() for word in words):
                return task_type
        
        return "general"
```

### 3.3 SVG Visualization Component

#### 3.3.1 Agent SVG Generator

```python
class AgentSVGGenerator:
    def generate_agent_svg(self, agent):
        role = agent["role"]
        personality = agent["personality"]
        colors = json.loads(agent["color_scheme"])
        
        # Base shape based on role
        shape_map = {
            "researcher": "circle",
            "writer": "square",
            "critic": "hexagon",
            "coordinator": "diamond"
        }
        shape = shape_map.get(role, "circle")
        
        # Expression based on personality and status
        expression = self._get_expression(personality, agent["status"])
        
        # Generate the SVG
        svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <style>
                @keyframes pulse {{
                    0% {{ transform: scale(1); }}
                    50% {{ transform: scale(1.05); }}
                    100% {{ transform: scale(1); }}
                }}
                .working {{ animation: pulse 2s infinite ease-in-out; }}
            </style>
            {self._generate_shape(shape, colors, agent["status"])}
            {self._generate_face(expression, colors)}
            <text x="50" y="120" text-anchor="middle" font-family="Arial" font-size="10" fill="#333">{agent["name"]}</text>
        </svg>"""
        
        return svg
    
    def _generate_shape(self, shape, colors, status):
        base_class = 'working' if status == 'working' else ''
        
        if shape == "circle":
            return f'<circle class="{base_class}" cx="50" cy="50" r="40" fill="{colors["primary"]}" />'
        elif shape == "square":
            return f'<rect class="{base_class}" x="10" y="10" width="80" height="80" fill="{colors["primary"]}" />'
        elif shape == "hexagon":
            points = " ".join([f"{50 + 40*math.cos(math.radians(60*i))},{50 + 40*math.sin(math.radians(60*i))}" for i in range(6)])
            return f'<polygon class="{base_class}" points="{points}" fill="{colors["primary"]}" />'
        elif shape == "diamond":
            return f'<polygon class="{base_class}" points="50,10 90,50 50,90 10,50" fill="{colors["primary"]}" />'
        
        # Default to circle
        return f'<circle class="{base_class}" cx="50" cy="50" r="40" fill="{colors["primary"]}" />'
    
    def _generate_face(self, expression, colors):
        if expression == "neutral":
            return f"""
                <circle cx="35" cy="40" r="5" fill="{colors["secondary"]}" />
                <circle cx="65" cy="40" r="5" fill="{colors["secondary"]}" />
                <line x1="35" y1="65" x2="65" y2="65" stroke="{colors["secondary"]}" stroke-width="3" />
            """
        elif expression == "happy":
            return f"""
                <circle cx="35" cy="40" r="5" fill="{colors["secondary"]}" />
                <circle cx="65" cy="40" r="5" fill="{colors["secondary"]}" />
                <path d="M 35 65 Q 50 80 65 65" stroke="{colors["secondary"]}" stroke-width="3" fill="none" />
            """
        elif expression == "thinking":
            return f"""
                <circle cx="35" cy="40" r="5" fill="{colors["secondary"]}" />
                <circle cx="65" cy="40" r="5" fill="{colors["secondary"]}" />
                <line x1="35" y1="65" x2="65" y2="65" stroke="{colors["secondary"]}" stroke-width="3" />
                <circle cx="80" cy="30" r="8" fill="none" stroke="{colors["secondary"]}" stroke-width="2" />
                <text x="80" y="33" text-anchor="middle" font-family="Arial" font-size="12" fill="{colors["secondary"]}">?</text>
            """
        
        # Default to neutral
        return f"""
            <circle cx="35" cy="40" r="5" fill="{colors["secondary"]}" />
            <circle cx="65" cy="40" r="5" fill="{colors["secondary"]}" />
            <line x1="35" y1="65" x2="65" y2="65" stroke="{colors["secondary"]}" stroke-width="3" />
        """
    
    def _get_expression(self, personality, status):
        if status == "working":
            return "thinking"
        elif personality == "creative" or personality == "supportive":
            return "happy"
        else:
            return "neutral"
```

### 3.4 WebSocket Interface

#### 3.4.1 FastAPI WebSocket Handler

```python
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import json
import asyncio
from aiokafka import AIOKafkaConsumer

app = FastAPI()

class AgentVisualizationManager:
    def __init__(self, neo4j_repository, svg_generator):
        self.active_connections = []
        self.neo4j_repository = neo4j_repository
        self.svg_generator = svg_generator
        self.consumer_task = None
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        if not self.consumer_task or self.consumer_task.done():
            self.consumer_task = asyncio.create_task(self.consume_events())
    
    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
    
    async def send_initial_state(self, websocket: WebSocket):
        agents = await self.neo4j_repository.get_all_agents()
        teams = await self.neo4j_repository.get_all_teams()
        
        # Transform agents with SVG representation
        for agent in agents:
            agent["svg"] = self.svg_generator.generate_agent_svg(agent)
        
        await websocket.send_json({
            "type": "initial_state",
            "data": {
                "agents": agents,
                "teams": teams
            }
        })
    
    async def broadcast(self, message):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                # Connection might be closed
                pass
    
    async def consume_events(self):
        consumer = AIOKafkaConsumer(
            "agent_events", "team_events",
            bootstrap_servers='localhost:9092',
            group_id="visualization_consumer",
            value_deserializer=lambda v: json.loads(v.decode('utf-8'))
        )
        
        await consumer.start()
        
        try:
            async for msg in consumer:
                if msg.topic == "agent_events":
                    if msg.value["event_type"] == "agent_created":
                        agent_id = msg.value["agent_id"]
                        agent = await self.neo4j_repository.get_agent(agent_id)
                        agent["svg"] = self.svg_generator.generate_agent_svg(agent)
                        
                        await self.broadcast({
                            "type": "agent_added",
                            "data": agent
                        })
                    
                    elif msg.value["event_type"] == "agent_updated":
                        agent_id = msg.value["agent_id"]
                        agent = await self.neo4j_repository.get_agent(agent_id)
                        agent["svg"] = self.svg_generator.generate_agent_svg(agent)
                        
                        await self.broadcast({
                            "type": "agent_updated",
                            "data": agent
                        })
                
                elif msg.topic == "team_events":
                    if msg.value["event_type"] == "team_created":
                        team_id = msg.value["team_id"]
                        team = await self.neo4j_repository.get_team_with_agents(team_id)
                        
                        # Add SVGs to agents
                        for agent in team["agents"]:
                            agent["svg"] = self.svg_generator.generate_agent_svg(agent)
                        
                        await self.broadcast({
                            "type": "team_created",
                            "data": team
                        })
        finally:
            await consumer.stop()

# Initialize the manager in your application
visualization_manager = AgentVisualizationManager(neo4j_repository, AgentSVGGenerator())

@app.websocket("/ws/visualization")
async def websocket_endpoint(websocket: WebSocket):
    await visualization_manager.connect(websocket)
    await visualization_manager.send_initial_state(websocket)
    
    try:
        while True:
            # Keep the connection alive
            data = await websocket.receive_text()
            # You can handle client messages here if needed
    except WebSocketDisconnect:
        visualization_manager.disconnect(websocket)
```

### 3.5 Neo4j Repository

#### 3.5.1 Neo4j Repository Implementation

```python
from neo4j import AsyncGraphDatabase

class Neo4jRepository:
    def __init__(self, uri, username, password):
        self.driver = AsyncGraphDatabase.driver(uri, auth=(username, password))
    
    async def close(self):
        await self.driver.close()
    
    async def create_agent(self, agent, template_id, team_id=None):
        async with self.driver.session() as session:
            # Create agent node
            query = """
            CREATE (a:Agent {
                id: $id,
                name: $name,
                role: $role,
                personality: $personality,
                model: $model,
                parameters: $parameters,
                status: $status,
                color_scheme: $color_scheme,
                created_at: $created_at,
                updated_at: $updated_at
            })
            WITH a
            MATCH (t:Template {id: $template_id})
            CREATE (a)-[:BASED_ON]->(t)
            """
            
            parameters = {
                **agent,
                "template_id": template_id
            }
            
            if team_id:
                query += """
                WITH a
                MATCH (team:Team {id: $team_id})
                CREATE (a)-[:MEMBER_OF]->(team)
                """
                parameters["team_id"] = team_id
            
            query += "RETURN a.id"
            
            result = await session.run(query, parameters)
            record = await result.single()
            return record["a.id"]
    
    async def get_agent(self, agent_id):
        async with self.driver.session() as session:
            result = await session.run(
                """
                MATCH (a:Agent {id: $agent_id})
                RETURN a {.*} as agent
                """,
                {"agent_id": agent_id}
            )
            record = await result.single()
            return record["agent"] if record else None
    
    async def get_all_agents(self):
        async with self.driver.session() as session:
            result = await session.run(
                """
                MATCH (a:Agent)
                RETURN a {.*} as agent
                ORDER BY a.created_at DESC
                """
            )
            return [record["agent"] for record in await result.fetch()]
    
    async def create_template(self, template):
        async with self.driver.session() as session:
            result = await session.run(
                """
                CREATE (t:Template {
                    id: $id,
                    name: $name,
                    description: $description,
                    role: $role,
                    model: $model,
                    parameters: $parameters,
                    created_at: $created_at
                })
                RETURN t.id
                """,
                template
            )
            record = await result.single()
            return record["t.id"]
    
    async def get_template(self, template_id):
        async with self.driver.session() as session:
            result = await session.run(
                """
                MATCH (t:Template {id: $template_id})
                RETURN t {.*} as template
                """,
                {"template_id": template_id}
            )
            record = await result.single()
            return record["template"] if record else None
    
    async def create_team(self, team, task_id):
        async with self.driver.session() as session:
            result = await session.run(
                """
                CREATE (team:Team {
                    id: $id,
                    name: $name,
                    task: $task,
                    status: $status,
                    created_at: $created_at,
                    updated_at: $updated_at
                })
                WITH team
                MATCH (task:Task {id: $task_id})
                CREATE (team)-[:WORKS_ON]->(task)
                RETURN team.id
                """,
                {**team, "task_id": task_id}
            )
            record = await result.single()
            return record["team.id"]
    
    async def get_team_with_agents(self, team_id):
        async with self.driver.session() as session:
            result = await session.run(
                """
                MATCH (team:Team {id: $team_id})
                OPTIONAL MATCH (agent:Agent)-[:MEMBER_OF]->(team)
                WITH team, collect(agent {.*}) as agents
                RETURN {
                    team: team {.*},
                    agents: agents
                } as team_data
                """,
                {"team_id": team_id}
            )
            record = await result.single()
            return record["team_data"] if record else None
    
    async def get_all_teams(self):
        async with self.driver.session() as session:
            result = await session.run(
                """
                MATCH (team:Team)
                RETURN team {.*} as team
                ORDER BY team.created_at DESC
                """
            )
            return [record["team"] for record in await result.fetch()]
    
    async def create_task(self, task):
        async with self.driver.session() as session:
            result = await session.run(
                """
                CREATE (task:Task {
                    id: $id,
                    description: $description,
                    type: $type,
                    status: $status,
                    created_at: $created_at
                })
                RETURN task.id
                """,
                task
            )
            record = await result.single()
            return record["task.id"]
```

### 3.6 Kafka Event Handlers

#### 3.6.1 Kafka Producer

```python
from aiokafka import AIOKafkaProducer
import json

class KafkaProducerService:
    def __init__(self, bootstrap_servers='localhost:9092'):
        self.producer = None
        self.bootstrap_servers = bootstrap_servers
    
    async def start(self):
        self.producer = AIOKafkaProducer(
            bootstrap_servers=self.bootstrap_servers,
            value_serializer=lambda v: json.dumps(v).encode('utf-8')
        )
        await self.producer.start()
    
    async def stop(self):
        if self.producer:
            await self.producer.stop()
    
    async def send(self, topic, key, value):
        if not self.producer:
            await self.start()
        
        await self.producer.send_and_wait(
            topic,
            value=value,
            key=key.encode('utf-8') if key else None
        )
```

#### 3.6.2 Kafka Consumer Base Class

```python
from aiokafka import AIOKafkaConsumer
import json
import asyncio

class KafkaConsumerService:
    def __init__(self, topics, group_id, bootstrap_servers='localhost:9092'):
        self.topics = topics if isinstance(topics, list) else [topics]
        self.group_id = group_id
        self.bootstrap_servers = bootstrap_servers
        self.consumer = None
        self.running = False
    
    async def start(self):
        self.consumer = AIOKafkaConsumer(
            *self.topics,
            bootstrap_servers=self.bootstrap_servers,
            group_id=self.group_id,
            value_deserializer=lambda v: json.loads(v.decode('utf-8')),
            auto_offset_reset="latest"
        )
        await self.consumer.start()
        self.running = True
        asyncio.create_task(self.consume())
    
    async def stop(self):
        self.running = False
        if self.consumer:
            await self.consumer.stop()
    
    async def consume(self):
        try:
            async for msg in self.consumer:
                await self.process_message(msg)
        finally:
            await self.stop()
    
    async def process_message(self, msg):
        # Override this method in subclasses
        pass
```

### 3.7 Redis Client

```python
import redis.asyncio as redis
import json

class RedisService:
    def __init__(self, host='localhost', port=6379, db=0):
        self.redis = redis.Redis(host=host, port=port, db=db, decode_responses=True)
    
    async def set(self, key, value, ex=None):
        if isinstance(value, (dict, list)):
            value = json.dumps(value)
        return await self.redis.set(key, value, ex=ex)
    
    async def get(self, key, as_json=False):
        value = await self.redis.get(key)
        if as_json and value:
            return json.loads(value)
        return value
    
    async def delete(self, key):
        return await self.redis.delete(key)
    
    async def exists(self, key):
        return await self.redis.exists(key)
    
    async def close(self):
        await self.redis.close()
```

### 3.8 Model Context Protocol (MCP) Integration

```python
class MCPService:
    def __init__(self, neo4j_repository):
        self.neo4j_repository = neo4j_repository
    
    async def create_context(self, agent_id, context_type, content):
        context_id = str(uuid.uuid4())
        context = {
            "id": context_id,
            "content": json.dumps(content),
            "type": context_type,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        async with self.neo4j_repository.driver.session() as session:
            await session.run(
                """
                CREATE (c:Context {
                    id: $id,
                    content: $content,
                    type: $type,
                    created_at: $created_at,
                    updated_at: $updated_at
                })
                WITH c
                MATCH (a:Agent {id: $agent_id})
                CREATE (a)-[:MAINTAINS]->(c)
                RETURN c.id
                """,
                {**context, "agent_id": agent_id}
            )
        
        return context_id
    
    async def update_context(self, context_id, content):
        async with self.neo4j_repository.driver.session() as session:
            await session.run(
                """
                MATCH (c:Context {id: $context_id})
                SET c.content = $content,
                    c.updated_at = $updated_at
                RETURN c.id
                """,
                {
                    "context_id": context_id,
                    "content": json.dumps(content),
                    "updated_at": datetime.now().isoformat()
                }
            )
    
    async def get_agent_contexts(self, agent_id, context_type=None):
        query = """
        MATCH (a:Agent {id: $agent_id})-[:MAINTAINS]->(c:Context)
        """
        
        if context_type:
            query += "WHERE c.type = $context_type "
        
        query += """
        RETURN c {.*} as context
        ORDER BY c.updated_at DESC
        """
        
        params = {"agent_id": agent_id}
        if context_type:
            params["context_type"] = context_type
        
        async with self.neo4j_repository.driver.session() as session:
            result = await session.run(query, params)
            contexts = [record["context"] for record in await result.fetch()]
            
            # Parse JSON content
            for context in contexts:
                context["content"] = json.loads(context["content"])
            
            return contexts
    
    def format_message_context(self, role, content):
        """Format a message following MCP format"""
        return {
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat()
        }
    
    def format_agent_context(self, agent):
        """Format agent definition following MCP format"""
        return {
            "agent_id": agent["id"],
            "name": agent["name"],
            "role": agent["role"],
            "personality": agent["personality"],
            "capabilities": self._derive_capabilities(agent["role"]),
            "timestamp": datetime.now().isoformat()
        }
    
    def _derive_capabilities(self, role):
        """Derive capabilities based on role"""
        capabilities = {
            "researcher": ["information_gathering", "analysis", "verification"],
            "writer": ["content_creation", "editing", "creative_writing"],
            "critic": ["evaluation", "critique", "improvement_suggestions"],
            "coordinator": ["task_delegation", "progress_tracking", "team_management"]
        }
        
        return capabilities.get(role, [])
```

## 4. Implementation Tests

### 4.1 Unit Tests

```python
import pytest
import uuid
from datetime import datetime
import json

# Agent Service Tests
@pytest.mark.asyncio
async def test_create_agent_from_template(mocker):
    # Mock dependencies
    mock_neo4j = mocker.AsyncMock()
    mock_kafka = mocker.AsyncMock()
    mock_redis = mocker.AsyncMock()
    
    # Mock template data
    template_id = str(uuid.uuid4())
    template = {
        "id": template_id,
        "name": "Test Template",
        "role": "researcher",
        "