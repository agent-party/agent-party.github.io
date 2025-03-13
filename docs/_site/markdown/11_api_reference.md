# API Reference Guide

This document provides a comprehensive reference for all API endpoints in the Agent Party system, organized by service domain.

## 1. Authentication and Authorization

### 1.1 Authentication

#### POST /api/v1/auth/login

Authenticates a user and returns a JWT token.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (200 OK):**
```json
{
  "access_token": "string",
  "token_type": "bearer",
  "expires_in": 3600
}
```

**Response (401 Unauthorized):**
```json
{
  "detail": "Invalid credentials"
}
```

#### POST /api/v1/auth/refresh

Refreshes an existing token.

**Request Headers:**
- Authorization: Bearer {token}

**Response (200 OK):**
```json
{
  "access_token": "string",
  "token_type": "bearer",
  "expires_in": 3600
}
```

### 1.2 User Management

#### GET /api/v1/users/me

Returns the current user's profile.

**Request Headers:**
- Authorization: Bearer {token}

**Response (200 OK):**
```json
{
  "id": "uuid",
  "username": "string",
  "email": "string",
  "full_name": "string",
  "roles": ["string"],
  "is_active": true,
  "created_at": "datetime"
}
```

#### PUT /api/v1/users/me

Updates the current user's profile.

**Request Headers:**
- Authorization: Bearer {token}

**Request Body:**
```json
{
  "full_name": "string",
  "email": "string",
  "password": "string"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "username": "string",
  "email": "string",
  "full_name": "string",
  "roles": ["string"],
  "is_active": true,
  "updated_at": "datetime"
}
```

## 2. Agent Management

### 2.1 Agent Operations

#### GET /api/v1/agents

Returns a list of agents with optional filtering.

**Request Parameters:**
- status (optional): Filter by agent status
- role (optional): Filter by agent role
- page (optional): Page number (default: 1)
- limit (optional): Items per page (default: 20)

**Response (200 OK):**
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "string",
      "role": "string",
      "personality": "string",
      "model": "string",
      "status": "string",
      "created_at": "datetime",
      "updated_at": "datetime",
      "capabilities": [
        {
          "name": "string",
          "proficiency": 0.0
        }
      ]
    }
  ],
  "total": 0,
  "page": 1,
  "limit": 20,
  "pages": 1
}
```

#### POST /api/v1/agents

Creates a new agent.

**Request Body:**
```json
{
  "name": "string",
  "role": "string",
  "personality": "string",
  "model": "string",
  "parameters": {
    "temperature": 0.7
  },
  "capabilities": [
    {
      "name": "string",
      "proficiency": 0.9
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "name": "string",
  "role": "string",
  "personality": "string",
  "model": "string",
  "status": "initializing",
  "created_at": "datetime",
  "updated_at": "datetime",
  "capabilities": [
    {
      "name": "string",
      "proficiency": 0.9
    }
  ]
}
```

#### GET /api/v1/agents/{agent_id}

Returns details of a specific agent.

**Path Parameters:**
- agent_id: UUID of the agent

**Response (200 OK):**
```json
{
  "id": "uuid",
  "name": "string",
  "role": "string",
  "personality": "string",
  "model": "string",
  "status": "string",
  "created_at": "datetime",
  "updated_at": "datetime",
  "capabilities": [
    {
      "name": "string",
      "proficiency": 0.9
    }
  ],
  "token_usage": {
    "total_tokens": 0,
    "total_cost": 0.0
  }
}
```

#### PATCH /api/v1/agents/{agent_id}

Updates an existing agent.

**Path Parameters:**
- agent_id: UUID of the agent

**Request Body:**
```json
{
  "name": "string",
  "role": "string",
  "personality": "string",
  "parameters": {
    "temperature": 0.5
  }
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "name": "string",
  "role": "string",
  "personality": "string",
  "model": "string",
  "status": "string",
  "created_at": "datetime",
  "updated_at": "datetime",
  "capabilities": [
    {
      "name": "string",
      "proficiency": 0.9
    }
  ]
}
```

#### DELETE /api/v1/agents/{agent_id}

Deletes an agent.

**Path Parameters:**
- agent_id: UUID of the agent

**Response (204 No Content)**

### 2.2 Agent Status Management

#### PUT /api/v1/agents/{agent_id}/status

Updates the status of an agent.

**Path Parameters:**
- agent_id: UUID of the agent

**Request Body:**
```json
{
  "status": "string",
  "reason": "string"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "status": "string",
  "previous_status": "string",
  "updated_at": "datetime"
}
```

### 2.3 Agent Capabilities

#### GET /api/v1/agents/{agent_id}/capabilities

Returns capabilities of a specific agent.

**Path Parameters:**
- agent_id: UUID of the agent

**Response (200 OK):**
```json
{
  "agent_id": "uuid",
  "capabilities": [
    {
      "name": "string",
      "proficiency": 0.9,
      "certified": true,
      "last_used": "datetime"
    }
  ]
}
```

#### POST /api/v1/agents/{agent_id}/capabilities

Adds a capability to an agent.

**Path Parameters:**
- agent_id: UUID of the agent

**Request Body:**
```json
{
  "name": "string",
  "proficiency": 0.9,
  "certified": true
}
```

**Response (201 Created):**
```json
{
  "name": "string",
  "proficiency": 0.9,
  "certified": true,
  "last_used": null
}
```

## 3. Team Management

### 3.1 Team Operations

#### GET /api/v1/teams

Returns a list of teams with optional filtering.

**Request Parameters:**
- status (optional): Filter by team status
- page (optional): Page number (default: 1)
- limit (optional): Items per page (default: 20)

**Response (200 OK):**
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "string",
      "status": "string",
      "created_at": "datetime",
      "updated_at": "datetime",
      "task": {
        "id": "uuid",
        "description": "string"
      },
      "members": [
        {
          "agent_id": "uuid",
          "name": "string",
          "role": "string"
        }
      ]
    }
  ],
  "total": 0,
  "page": 1,
  "limit": 20,
  "pages": 1
}
```

#### POST /api/v1/teams

Creates a new team.

**Request Body:**
```json
{
  "name": "string",
  "task_id": "uuid",
  "agent_ids": [
    {
      "agent_id": "uuid",
      "role": "string"
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "name": "string",
  "status": "forming",
  "created_at": "datetime",
  "updated_at": "datetime",
  "task": {
    "id": "uuid",
    "description": "string"
  },
  "members": [
    {
      "agent_id": "uuid",
      "name": "string",
      "role": "string"
    }
  ]
}
```

#### POST /api/v1/teams/recommended

Creates a recommended team based on task requirements.

**Request Body:**
```json
{
  "task_id": "uuid",
  "name": "string",
  "team_size": 5
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "name": "string",
  "status": "forming",
  "created_at": "datetime",
  "updated_at": "datetime",
  "task": {
    "id": "uuid",
    "description": "string"
  },
  "members": [
    {
      "agent_id": "uuid",
      "name": "string",
      "role": "string",
      "match_score": 0.95
    }
  ],
  "recommendation_quality": 0.92
}
```

## 4. Task Management

### 4.1 Task Operations

#### GET /api/v1/tasks

Returns a list of tasks with optional filtering.

**Request Parameters:**
- status (optional): Filter by task status
- type (optional): Filter by task type
- priority (optional): Filter by priority level
- page (optional): Page number (default: 1)
- limit (optional): Items per page (default: 20)

**Response (200 OK):**
```json
{
  "items": [
    {
      "id": "uuid",
      "description": "string",
      "type": "string",
      "priority": 0,
      "status": "string",
      "created_at": "datetime",
      "updated_at": "datetime",
      "required_capabilities": [
        {
          "name": "string",
          "importance": 0.9
        }
      ],
      "assigned_team": {
        "id": "uuid",
        "name": "string"
      }
    }
  ],
  "total": 0,
  "page": 1,
  "limit": 20,
  "pages": 1
}
```

#### POST /api/v1/tasks

Creates a new task.

**Request Body:**
```json
{
  "description": "string",
  "type": "string",
  "priority": 3,
  "required_capabilities": [
    {
      "name": "string",
      "importance": 0.9
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "description": "string",
  "type": "string",
  "priority": 3,
  "status": "submitted",
  "created_at": "datetime",
  "updated_at": "datetime",
  "required_capabilities": [
    {
      "name": "string",
      "importance": 0.9
    }
  ]
}
```

#### PUT /api/v1/tasks/{task_id}/status

Updates the status of a task.

**Path Parameters:**
- task_id: UUID of the task

**Request Body:**
```json
{
  "status": "string",
  "reason": "string"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "status": "string",
  "previous_status": "string",
  "updated_at": "datetime"
}
```

#### POST /api/v1/tasks/{task_id}/assign

Assigns a task to a team.

**Path Parameters:**
- task_id: UUID of the task

**Request Body:**
```json
{
  "team_id": "uuid",
  "expected_completion": "datetime"
}
```

**Response (200 OK):**
```json
{
  "task_id": "uuid",
  "team_id": "uuid",
  "status": "assigned",
  "assigned_at": "datetime",
  "expected_completion": "datetime"
}
```

## 5. Interaction API

### 5.1 Messaging

#### GET /api/v1/messages

Retrieves messages with optional filtering.

**Request Parameters:**
- sender_id (optional): Filter by sender
- recipient_id (optional): Filter by recipient
- since (optional): Filter by timestamp
- page (optional): Page number (default: 1)
- limit (optional): Items per page (default: 20)

**Response (200 OK):**
```json
{
  "items": [
    {
      "id": "uuid",
      "sender_id": "uuid",
      "sender_name": "string",
      "recipient_id": "uuid",
      "recipient_name": "string",
      "content": "string",
      "content_type": "text",
      "timestamp": "datetime",
      "in_response_to": "uuid"
    }
  ],
  "total": 0,
  "page": 1,
  "limit": 20,
  "pages": 1
}
```

#### POST /api/v1/messages

Sends a new message.

**Request Body:**
```json
{
  "sender_id": "uuid",
  "recipient_id": "uuid",
  "content": "string",
  "content_type": "text",
  "context_ids": ["uuid"],
  "in_response_to": "uuid"
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "sender_id": "uuid",
  "sender_name": "string",
  "recipient_id": "uuid",
  "recipient_name": "string",
  "content": "string",
  "content_type": "text",
  "timestamp": "datetime",
  "in_response_to": "uuid",
  "context_ids": ["uuid"]
}
```

## 6. Analytics API

### 6.1 Agent Analytics

#### GET /api/v1/analytics/agents/token-usage

Returns token usage analytics for agents.

**Request Parameters:**
- start_date: Start date for analytics
- end_date: End date for analytics
- agent_id (optional): Filter by specific agent
- model (optional): Filter by model type

**Response (200 OK):**
```json
{
  "total_tokens": 0,
  "total_cost": 0.0,
  "prompt_tokens": 0,
  "completion_tokens": 0,
  "agents": [
    {
      "agent_id": "uuid",
      "agent_name": "string",
      "tokens": 0,
      "cost": 0.0
    }
  ],
  "models": [
    {
      "model": "string",
      "tokens": 0,
      "cost": 0.0
    }
  ],
  "daily_usage": [
    {
      "date": "string",
      "tokens": 0,
      "cost": 0.0
    }
  ]
}
```

### 6.2 Task Analytics

#### GET /api/v1/analytics/tasks/performance

Returns performance analytics for tasks.

**Request Parameters:**
- start_date: Start date for analytics
- end_date: End date for analytics
- task_type (optional): Filter by task type

**Response (200 OK):**
```json
{
  "total_tasks": 0,
  "completed_tasks": 0,
  "failed_tasks": 0,
  "average_completion_time_hours": 0.0,
  "by_type": [
    {
      "type": "string",
      "count": 0,
      "completion_rate": 0.0,
      "average_time_hours": 0.0
    }
  ],
  "by_priority": [
    {
      "priority": 0,
      "count": 0,
      "completion_rate": 0.0,
      "average_time_hours": 0.0
    }
  ]
}
```

## 7. Admin API

### 7.1 System Health

#### GET /api/v1/admin/health

Returns system health status.

**Request Headers:**
- Authorization: Bearer {admin_token}

**Response (200 OK):**
```json
{
  "status": "healthy",
  "components": [
    {
      "name": "database",
      "status": "healthy",
      "response_time_ms": 5
    },
    {
      "name": "kafka",
      "status": "healthy",
      "response_time_ms": 10
    },
    {
      "name": "redis",
      "status": "healthy",
      "response_time_ms": 3
    }
  ],
  "uptime_hours": 120.5,
  "version": "1.0.0"
}
```

### 7.2 Token Budget Management

#### GET /api/v1/admin/budgets

Returns token budget information.

**Request Headers:**
- Authorization: Bearer {admin_token}

**Request Parameters:**
- entity_type (optional): Filter by entity type
- entity_id (optional): Filter by entity ID

**Response (200 OK):**
```json
{
  "items": [
    {
      "entity_id": "uuid",
      "entity_type": "agent",
      "entity_name": "string",
      "budget_type": "token",
      "budget_value": 10000,
      "current_usage": 4500,
      "usage_percentage": 45.0,
      "status": "under_budget",
      "reset_period": "monthly",
      "last_reset": "datetime"
    }
  ],
  "total": 0,
  "page": 1,
  "limit": 20,
  "pages": 1
}
```

#### POST /api/v1/admin/budgets

Creates or updates a token budget.

**Request Headers:**
- Authorization: Bearer {admin_token}

**Request Body:**
```json
{
  "entity_id": "uuid",
  "entity_type": "agent",
  "budget_type": "token",
  "budget_value": 10000,
  "alert_threshold": 0.8,
  "hard_limit": false,
  "reset_period": "monthly"
}
```

**Response (201 Created):**
```json
{
  "entity_id": "uuid",
  "entity_type": "agent",
  "entity_name": "string",
  "budget_type": "token",
  "budget_value": 10000,
  "current_usage": 0,
  "usage_percentage": 0.0,
  "status": "under_budget",
  "alert_threshold": 0.8,
  "hard_limit": false,
  "reset_period": "monthly",
  "created_at": "datetime"
}
```

## 8. Error Responses

All API endpoints follow a consistent error response format:

### 400 Bad Request

```json
{
  "detail": "Invalid request parameters",
  "errors": [
    {
      "field": "string",
      "message": "string"
    }
  ]
}
```

### 401 Unauthorized

```json
{
  "detail": "Authentication required"
}
```

### 403 Forbidden

```json
{
  "detail": "Not enough permissions"
}
```

### 404 Not Found

```json
{
  "detail": "Resource not found"
}
```

### 409 Conflict

```json
{
  "detail": "Resource conflict",
  "conflict_reason": "string"
}
```

### 422 Unprocessable Entity

```json
{
  "detail": "Validation error",
  "errors": [
    {
      "field": "string",
      "message": "string"
    }
  ]
}
```

### 429 Too Many Requests

```json
{
  "detail": "Too many requests",
  "retry_after": 60
}
```

### 500 Internal Server Error

```json
{
  "detail": "Internal server error",
  "error_id": "uuid"
}
```
