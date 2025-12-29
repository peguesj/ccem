# CCEM UI Server

Backend API server for CCEM UI - provides REST API and WebSocket communication for real-time session monitoring.

## Architecture

```
ui/server/
├── api/              # REST API endpoints
│   ├── sessions.ts   # Session management
│   └── agents.ts     # Agent management
├── ws/               # WebSocket server
│   └── index.ts      # WebSocket manager
├── types/            # TypeScript type definitions
│   └── index.ts      # All type definitions
├── index.ts          # Main server entry point
├── package.json      # Server dependencies
└── tsconfig.json     # TypeScript config
```

## Features

### REST API

**Session Management:**
- `GET /api/sessions` - List all sessions
- `GET /api/sessions/:id` - Get session details
- `POST /api/sessions` - Create new session
- `GET /api/sessions/:id/stream` - SSE stream for real-time updates

**Agent Management:**
- `GET /api/agents` - List all agents
- `GET /api/agents/:id/status` - Get agent status
- `POST /api/agents/:id/task` - Assign task to agent

### WebSocket Protocol

**Connection:**
- `WS /ws/sessions/:id` - Connect to session

**Client → Server Messages:**
- `subscribe` - Subscribe to channels (agents, tasks, logs, files)
- `agent_command` - Send command to agent (pause/resume/cancel)
- `task_assign` - Assign task to specific agent

**Server → Client Messages:**
- `agent_update` - Agent status changed
- `task_update` - Task progress update
- `log_entry` - New log entry
- `file_change` - File created/modified/deleted

### Additional Endpoints

- `GET /health` - Health check
- `GET /session-view` - Session monitoring HTML page

## Development

### Install Dependencies

```bash
npm install
```

### Start Development Server

```bash
npm run dev
```

Server will start on `http://localhost:8638`

### Type Check

```bash
npm run typecheck
```

### Build

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

## Configuration

Environment variables:

- `PORT` - Server port (default: 8638)
- `HOST` - Server host (default: localhost)

## API Examples

### Create Session

```bash
curl -X POST http://localhost:8638/api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Build Fix Session",
    "description": "Fix TypeScript errors",
    "agents": ["task-analyzer", "build-fixer"],
    "auto_start": true
  }'
```

### List Sessions

```bash
curl http://localhost:8638/api/sessions
```

### Get Session Details

```bash
curl http://localhost:8638/api/sessions/sess_abc123
```

### List Agents

```bash
curl http://localhost:8638/api/agents
```

### Assign Task to Agent

```bash
curl -X POST http://localhost:8638/api/agents/agent_001/task \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "task_010",
    "description": "Run test suite",
    "priority": "high",
    "params": {
      "test_pattern": "**/*.test.ts",
      "coverage": true
    }
  }'
```

## WebSocket Example

```javascript
const ws = new WebSocket('ws://localhost:8638/ws/sessions/sess_abc123');

// Subscribe to channels
ws.send(JSON.stringify({
  type: 'subscribe',
  channels: ['agents', 'tasks', 'logs']
}));

// Listen for updates
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};

// Send agent command
ws.send(JSON.stringify({
  type: 'agent_command',
  agent_id: 'agent_001',
  command: 'pause'
}));
```

## SSE Example

```javascript
const eventSource = new EventSource('http://localhost:8638/api/sessions/sess_abc123/stream');

eventSource.addEventListener('agent_started', (event) => {
  const data = JSON.parse(event.data);
  console.log('Agent started:', data);
});

eventSource.addEventListener('task_progress', (event) => {
  const data = JSON.parse(event.data);
  console.log('Task progress:', data);
});

eventSource.addEventListener('session_complete', (event) => {
  const data = JSON.parse(event.data);
  console.log('Session complete:', data);
  eventSource.close();
});
```

## Error Responses

All errors follow this format:

```json
{
  "error": "error_code",
  "message": "Human-readable message",
  "details": {},
  "request_id": "req_xyz789"
}
```

**Error Codes:**
- `invalid_request` (400) - Bad request parameters
- `not_found` (404) - Resource not found
- `rate_limited` (429) - Too many requests
- `internal_error` (500) - Server error

## CORS

Currently configured for development with `origin: *`. Update for production deployment.

## Rate Limits

- API Requests: 100 requests/minute per client
- WebSocket Messages: 50 messages/second per connection
- SSE Connections: 5 concurrent streams per client

## Integration with CCEM Core

Currently using mock data. To integrate with CCEM core:

1. Import CCEM session manager
2. Replace mock data stores with actual CCEM instances
3. Connect WebSocket broadcasts to CCEM events
4. Wire up agent commands to CCEM agent controls

## License

MIT
