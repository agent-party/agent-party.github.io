---
layout: page
title: Getting Started with Agent Party
subtitle: Your guide to implementing AI agent collaboration
toc: true
permalink: /getting-started/
---

## Welcome to Agent Party

This guide will help you get started with Agent Party, the enterprise platform for AI agent collaboration. Whether you're a developer, organization, or AI enthusiast, we'll walk you through the steps to begin using the platform.

## For Developers

### 1. Clone the Repository

Start by cloning the Agent Party repository:

```bash
git clone https://github.com/agent-party/agent-party.git
cd agent-party
```

### 2. Install Dependencies

Agent Party uses Poetry for dependency management:

```bash
# Install Poetry if you don't have it
curl -sSL https://install.python-poetry.org | python3 -

# Install dependencies
poetry install
```

### 3. Set Up the Environment

Create a `.env` file with necessary configuration:

```bash
cp .env.example .env
# Edit .env with your settings
```

Key configuration items:
- Database connection strings
- API keys for language models
- Storage credentials
- Kafka connection details

### 4. Run the Dev Environment

Start the development environment using Docker Compose:

```bash
docker-compose up -d
```

This will start:
- Neo4j database
- Kafka and Zookeeper
- Redis
- MinIO object storage

### 5. Run the Application

Start the Agent Party application:

```bash
poetry run python -m agent_party
```

The API will be available at http://localhost:8000 and the web UI at http://localhost:8000/ui.

### 6. Try the Quickstart Example

Explore the quickstart example to see Agent Party in action:

```bash
poetry run python examples/quickstart.py
```

This example demonstrates:
- Agent registration
- Team formation
- Task execution
- Result visualization

## For Organizations

If you're evaluating Agent Party for your organization, follow these steps:

### 1. Assess Your Requirements

Consider your specific needs:
- What kind of AI collaboration do you need?
- What existing tools need integration?
- What security and compliance requirements do you have?
- What is your expected scale?

### 2. Explore the Enterprise Evaluation Guide

Download our [Enterprise Evaluation Guide](https://agent-party.github.io/enterprise/evaluation-guide.pdf) for a comprehensive assessment framework, including:
- Technical requirements
- Security checklist
- Integration points
- ROI calculator
- Implementation timeline

### 3. Schedule a Demo

[Contact our team](https://agent-party.github.io/contact) to schedule a personalized demo tailored to your use case.

### 4. Plan Your Implementation

Review our implementation resources:
- [Architecture Planning Guide](https://agent-party.github.io/enterprise/architecture-planning.pdf)
- [Integration Playbook](https://agent-party.github.io/enterprise/integration-playbook.pdf)
- [Security and Compliance Documentation](https://agent-party.github.io/enterprise/security-compliance.pdf)

### 5. Explore Success Stories

Learn from organizations already using Agent Party:
- [Financial Services Case Study](https://agent-party.github.io/case-studies/financial-services)
- [Healthcare Implementation Story](https://agent-party.github.io/case-studies/healthcare)
- [Education Platform Deployment](https://agent-party.github.io/case-studies/education)

## Core Components Walkthrough

To understand the platform better, let's walk through its core components:

### Doorman (Trust & Access Control)

The security gateway managing identity, permissions, and trust.

**Getting Started with Doorman:**
```python
from agent_party.components import Doorman

# Initialize with your authentication settings
doorman = Doorman(
    auth_provider="oauth",
    auth_config={
        "client_id": "your-client-id",
        "client_secret": "your-client-secret",
        "redirect_uri": "https://your-app.com/callback"
    }
)

# Verify and decode tokens
user_info = doorman.authenticate_token(token)

# Check permissions
if doorman.authorize(user_id, "team:create"):
    # User is authorized to create teams
    ...
```

### DJ (Intelligent Orchestration)

The coordination engine that routes requests and manages workflows.

**Getting Started with DJ:**
```python
from agent_party.components import DJ

# Initialize the DJ component
dj = DJ()

# Get team recommendations for a task
recommended_team = await dj.recommend_team(
    task_id="task-123",
    required_capabilities=["research", "writing", "data_analysis"],
    max_team_size=3
)

# Print recommended team
for agent in recommended_team:
    print(f"Agent: {agent['name']}, Role: {agent['role']}")
```

### Bartender (User Interface)

The human-facing layer making AI collaboration intuitive.

**Getting Started with Bartender:**
```python
from agent_party.components import Bartender

# Initialize the Bartender
bartender = Bartender()

# Create a team for a task
team_id = await bartender.create_team(
    task_id="task-123",
    team_name="Research Team",
    agents=recommended_team
)

# Submit a task to the team
response = await bartender.submit_task(
    team_id=team_id,
    instructions="Research the impact of AI on healthcare and provide a summary",
    format="markdown"
)

# Display the team's response
print(response.result)
```

## Key Workflows

### Creating an Agent

```python
from agent_party.agent import AgentFactory

# Create an agent factory
factory = AgentFactory()

# Create a specialized agent
agent_id = await factory.create_agent(
    template_id="researcher-template",
    name="Healthcare Researcher",
    parameters={
        "expertise": ["medical_research", "clinical_trials", "healthcare_policy"],
        "communication_style": "detailed",
        "research_depth": "thorough"
    }
)

print(f"Created agent with ID: {agent_id}")
```

### Forming a Team

```python
from agent_party.team import TeamFormation

# Initialize team formation service
team_formation = TeamFormation()

# Form a team based on task requirements
team = await team_formation.form_team(
    task_description="Analyze clinical trial data and prepare a research report",
    required_capabilities=[
        {"name": "data_analysis", "importance": 0.9},
        {"name": "medical_knowledge", "importance": 0.8},
        {"name": "report_writing", "importance": 0.7}
    ],
    max_team_size=3
)

print(f"Team formed with {len(team.agents)} agents")
```

### Executing a Task

```python
from agent_party.task import TaskExecution

# Initialize task execution service
task_execution = TaskExecution()

# Execute a task with a team
task_result = await task_execution.execute_task(
    team_id=team.id,
    instructions="Analyze the attached clinical trial data and provide a detailed report on efficacy and safety findings",
    attachments=["clinical_trial_data.csv"],
    output_format="markdown"
)

print(f"Task completed with status: {task_result.status}")
print(f"Output: {task_result.output}")
```

## Next Steps

After getting started, explore these resources to deepen your understanding:

1. [Architecture Documentation](/architecture)
2. [Agent System Reference](/agents)
3. [Team Formation Guide](/team-formation)
4. [API Reference](https://agent-party.github.io/api-docs)
5. [Contribution Guidelines](https://github.com/agent-party/agent-party/blob/main/CONTRIBUTING.md)

## Community Resources

Join the Agent Party community:

- [GitHub Repository](https://github.com/agent-party/agent-party)
- [Discord Community](https://discord.gg/agentparty)
- [Monthly Webinars](https://agent-party.github.io/webinars)
- [Community Projects](https://agent-party.github.io/community-projects)

## Support

If you need help:

- [Documentation](https://agent-party.github.io/docs)
- [FAQs](https://agent-party.github.io/faqs)
- [GitHub Issues](https://github.com/agent-party/agent-party/issues)
- [Contact Support](https://agent-party.github.io/support) 