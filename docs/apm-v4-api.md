# APM v4 API Reference

All endpoints are served by the APM v4 Phoenix server on port 3031. CORS headers (`Access-Control-Allow-Origin: *`) are included on all API responses. API authentication is enforced via the `ApiAuth` plug using bearer tokens from `apm_config.json`.

## Base URL

```
http://localhost:3031
```

## Project Scoping

Many endpoints support project scoping via the `?project=<name>` query parameter. When omitted, the active project from `apm_config.json` is used.

---

## Health & Status

### GET /health

Server health check (v3 compatible, outside `/api` scope).

**Response**:
```json
{
  "status": "ok",
  "uptime": 3600.5,
  "total_projects": 10,
  "active_project": "ccem",
  "projects": [
    {"name": "ccem", "status": "active", "agent_count": 3, "session_count": 2}
  ],
  "session_id": "7cb282f4-..."
}
```

### GET /api/status

Server status with version and capability info.

---

## Projects

### GET /api/projects

List all registered projects with summary data.

**Response**:
```json
{
  "projects": [
    {
      "name": "ccem",
      "root": "/Users/jeremiah/Developer/ccem",
      "status": "active",
      "agent_count": 3,
      "session_count": 2,
      "ralph_passed": 19,
      "ralph_total": 19
    }
  ],
  "active_project": "ccem"
}
```

---

## Data Aggregation

### GET /api/data

Master aggregation endpoint. Returns all dashboard data for the active (or specified) project.

**Query params**: `?project=<name>`

**Response**:
```json
{
  "timestamp": "2026-02-19T15:00:00Z",
  "session_id": "7cb282f4-...",
  "project": "ccem",
  "summary": {
    "total_agents": 5,
    "completed": 3,
    "running": 2,
    "total_tokens_in": 150000,
    "total_tokens_out": 45000,
    "total_tokens_cache": 80000,
    "total_tokens": 275000,
    "total_tool_calls": 340,
    "total_api_calls": 120
  },
  "agents": [...],
  "edges": [{"source": "agent-1", "target": "agent-2"}],
  "tasks": [...],
  "plane": {},
  "notifications": {"unread": 2, "recent": [...]},
  "ralph": {...},
  "slash_commands": [...],
  "input_requests": [...]
}
```

---

## Agents

### GET /api/agents

List all registered agents.

### POST /api/register

Register a new agent (original v4 endpoint).

**Body**:
```json
{
  "id": "agent-abc",
  "name": "Schema Validator",
  "tier": 1,
  "status": "running",
  "deps": ["agent-xyz"],
  "metadata": {"linear_issue": "PEG-123"},
  "project_name": "ccem"
}
```

### POST /api/agents/register

Alias for `/api/register` (v3 compatibility).

### POST /api/agents/update

Update an existing agent's fields.

**Body**:
```json
{
  "id": "agent-abc",
  "status": "completed",
  "tier": 2
}
```

### GET /api/agents/discover

Trigger an agent discovery scan of `tasks_dir/*.output` files. Returns newly discovered agents.

**Query params**: `?project=<name>`

**Response**:
```json
{
  "discovered": ["agent-1", "agent-2"],
  "total_agents": 5,
  "project": "ccem"
}
```

### POST /api/heartbeat

Agent heartbeat (token usage, status update).

---

## Notifications

### GET /api/notifications

List recent notifications (up to 50).

**Response**:
```json
{
  "notifications": [
    {
      "id": 1,
      "title": "Agent Completed",
      "body": "Schema Validator has finished execution",
      "category": "success",
      "agent_id": "agent-abc",
      "timestamp": "2026-02-19T15:00:00Z",
      "read": false
    }
  ]
}
```

### POST /api/notifications/add

Add a notification.

**Body**:
```json
{
  "title": "Build Failed",
  "body": "TypeScript compilation error in src/merge/",
  "category": "error",
  "agent_id": "agent-abc"
}
```

**Categories**: `info`, `success`, `warning`, `error`, `input`, `system`

### POST /api/notifications/read-all

Mark all notifications as read.

### POST /api/notify

Alias for notification creation (original v4 endpoint).

---

## Ralph Methodology

### GET /api/ralph

Get Ralph PRD data for the active project. Returns user stories with pass/fail status.

**Query params**: `?project=<name>`

**Response**:
```json
{
  "project": "CCEM APM v4",
  "branch": "ralph/apm-v4-gap-closure",
  "description": "Close v3 backward-compatibility gaps...",
  "stories": [
    {
      "id": "US-013",
      "title": "ConfigLoader GenServer for apm_config.json",
      "priority": 1,
      "passes": true,
      "module": "",
      "namespace": "",
      "notes": "Implemented by PID 9591 session"
    }
  ],
  "total": 19,
  "passed": 19
}
```

### GET /api/ralph/flowchart

D3.js-compatible nodes and edges for the Ralph flowchart.

**Response**:
```json
{
  "nodes": [
    {
      "id": "US-013",
      "title": "ConfigLoader GenServer",
      "priority": 1,
      "status": "passed",
      "module": "",
      "notes": ""
    }
  ],
  "edges": [
    {"source": "US-013", "target": "US-014"}
  ]
}
```

---

## Commands

### GET /api/commands

List registered slash commands for the active project.

### POST /api/commands

Register slash commands. Accepts a single command object or an array.

**Body**:
```json
{
  "name": "fix",
  "description": "Run the fix loop methodology",
  "category": "development",
  "status": "available"
}
```

---

## Input Queue

### GET /api/input/pending

Get unresponded input requests (up to 10).

**Response**:
```json
{
  "requests": [
    {
      "id": 1,
      "prompt": "Choose merge strategy",
      "options": ["recommended", "conservative", "hybrid"],
      "context": {},
      "timestamp": "2026-02-19T15:00:00Z",
      "responded": false,
      "response": null
    }
  ]
}
```

### POST /api/input/request

Create an input request.

**Body**:
```json
{
  "prompt": "Approve deployment to production?",
  "options": ["Approve", "Reject", "Defer"],
  "context": {"environment": "production"}
}
```

### POST /api/input/respond

Respond to an input request.

**Body**:
```json
{
  "id": 1,
  "choice": "Approve"
}
```

---

## Tasks

### POST /api/tasks/sync

Replace the active project's task list.

**Body**:
```json
{
  "tasks": [
    {"id": 1, "subject": "Implement merge engine", "status": "completed"},
    {"id": 2, "subject": "Add security audit", "status": "in_progress"}
  ]
}
```

---

## Configuration

### POST /api/config/reload

Trigger ConfigLoader to re-read `apm_config.json` from disk. Broadcasts config change via PubSub. Called automatically by `session_init.sh` after registering a new session.

**Response**:
```json
{
  "ok": true,
  "active_project": "ccem",
  "total_projects": 10
}
```

---

## Plane PM

### POST /api/plane/update

Update the active project's Plane PM context (issue counts, states, etc.).

**Body**:
```json
{
  "project_name": "ccem",
  "total_issues": 25,
  "states": {
    "Backlog": {"count": 10, "color": "#8b949e"},
    "In Progress": {"count": 5, "color": "#d29922"},
    "Done": {"count": 10, "color": "#3fb950"}
  }
}
```

---

## Skills

### GET /api/skills

List tracked skill invocations.

### POST /api/skills/track

Record a skill invocation.

---

## Environments (CCEM Environment Manager)

### GET /api/environments

List all discovered Claude Code environments (projects with `.claude/` directories).

**Response**:
```json
{
  "environments": [
    {
      "name": "ccem",
      "root": "/Users/jeremiah/Developer/ccem",
      "has_claude_md": true,
      "session_count": 5,
      "last_session_date": "2026-02-19T14:58:02Z"
    }
  ]
}
```

### GET /api/environments/:name

Full detail for a specific environment: CLAUDE.md content, hooks list, recent sessions, configuration.

### POST /api/environments/:name/exec

Execute a shell command in the environment's project root.

**Body**:
```json
{
  "command": "mix test",
  "timeout": 60
}
```

**Response**:
```json
{
  "exit_code": 0,
  "output": "233 tests, 0 failures\n"
}
```

**Safety**: Dangerous commands are rejected. Timeout defaults to 30s, max 120s. Localhost-only.

### POST /api/environments/:name/session/start

Launch a Claude Code session in the specified environment.

**Body**:
```json
{
  "with_ccem": true
}
```

### POST /api/environments/:name/session/stop

Stop a running Claude Code session in the specified environment.

---

## v2 REST API

Advanced endpoints under `/api/v2/`:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v2/agents` | List agents with filtering |
| GET | `/api/v2/agents/:id` | Get agent detail |
| GET | `/api/v2/sessions` | List sessions |
| GET | `/api/v2/metrics` | Fleet-wide metrics |
| GET | `/api/v2/metrics/:agent_id` | Per-agent metrics |
| GET | `/api/v2/slos` | List SLO definitions |
| GET | `/api/v2/slos/:name` | Get SLO detail |
| GET | `/api/v2/alerts` | List alerts |
| GET | `/api/v2/alerts/rules` | List alert rules |
| POST | `/api/v2/alerts/rules` | Create alert rule |
| GET | `/api/v2/audit` | Audit log |
| GET | `/api/v2/openapi.json` | OpenAPI spec |

---

## Other Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v2/export` | Export all data |
| POST | `/api/v2/import` | Import data |
| GET | `/api/ag-ui/events` | AG-UI SSE event stream |
| GET | `/api/a2ui/components` | A2UI component listing |

---

## LiveView Pages

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `DashboardLive` | Main dashboard with project selector |
| `/apm-all` | `AllProjectsLive` | All-projects overview grid |
| `/ralph` | `RalphFlowchartLive` | Ralph methodology flowchart |
| `/skills` | `SkillsLive` | Skills tracking view |
| `/timeline` | `SessionTimelineLive` | Session timeline |
| `/dev/dashboard` | Phoenix LiveDashboard | (dev only) System metrics |
