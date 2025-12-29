# CCEM UI Server - API Quick Reference

## Base URL
```
http://localhost:8638
```

## REST Endpoints

### Health & Status
```bash
GET /health                          # Server health check
GET /session-view                    # HTML monitoring page
```

### Sessions
```bash
GET    /api/sessions                 # List all sessions
GET    /api/sessions/:id             # Get session details
POST   /api/sessions                 # Create new session
GET    /api/sessions/:id/stream      # SSE stream (real-time updates)
```

### Agents
```bash
GET    /api/agents                   # List all agents
GET    /api/agents/:id/status        # Get agent status
POST   /api/agents/:id/task          # Assign task to agent
```

## WebSocket
```
ws://localhost:8638/ws/sessions/:id
```

### Client → Server
```javascript
// Subscribe to channels
{ type: 'subscribe', channels: ['agents', 'tasks', 'logs', 'files'] }

// Send agent command
{ type: 'agent_command', agent_id: 'agent_001', command: 'pause|resume|cancel' }

// Assign task
{ type: 'task_assign', task_id: 'task_001', agent_id: 'agent_002' }
```

### Server → Client
```javascript
// Agent update
{ type: 'agent_update', data: {...}, timestamp: '...' }

// Task update
{ type: 'task_update', data: {...}, timestamp: '...' }

// Log entry
{ type: 'log_entry', data: {...}, timestamp: '...' }

// File change
{ type: 'file_change', data: {...}, timestamp: '...' }
```

## Request Examples

### Create Session
```bash
curl -X POST http://localhost:8638/api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Fix Build",
    "agents": ["task-analyzer", "build-fixer"],
    "auto_start": true
  }'
```

**Response:**
```json
{
  "id": "sess_abc123",
  "status": "running",
  "websocket_url": "ws://localhost:8638/ws/sessions/sess_abc123",
  "stream_url": "http://localhost:8638/api/sessions/sess_abc123/stream"
}
```

### List Agents
```bash
curl http://localhost:8638/api/agents
```

**Response:**
```json
{
  "agents": [
    {
      "id": "agent_001",
      "type": "task-analyzer",
      "status": "idle",
      "tasks_completed": 0
    }
  ],
  "total": 3,
  "running": 0,
  "idle": 3
}
```

### Assign Task
```bash
curl -X POST http://localhost:8638/api/agents/agent_001/task \
  -H "Content-Type: application/json" \
  -d '{
    "task_id": "task_010",
    "description": "Run tests",
    "priority": "high",
    "params": {
      "test_pattern": "**/*.test.ts",
      "coverage": true
    }
  }'
```

**Response:**
```json
{
  "agent_id": "agent_001",
  "task_id": "task_010",
  "status": "accepted",
  "estimated_duration": 30,
  "queue_position": 0
}
```

### Get Session Details
```bash
curl http://localhost:8638/api/sessions/sess_abc123
```

**Response:**
```json
{
  "id": "sess_abc123",
  "status": "running",
  "agents": [...],
  "tasks": [...],
  "files_modified": [...],
  "logs": [...]
}
```

## WebSocket Example

```javascript
// Connect
const ws = new WebSocket('ws://localhost:8638/ws/sessions/sess_abc123');

// Subscribe
ws.send(JSON.stringify({
  type: 'subscribe',
  channels: ['agents', 'tasks', 'logs']
}));

// Listen for updates
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  console.log('Received:', msg.type, msg.data);
};

// Send command
ws.send(JSON.stringify({
  type: 'agent_command',
  agent_id: 'agent_001',
  command: 'pause'
}));
```

## SSE Example

```javascript
const eventSource = new EventSource(
  'http://localhost:8638/api/sessions/sess_abc123/stream'
);

eventSource.addEventListener('agent_started', (e) => {
  console.log('Agent started:', JSON.parse(e.data));
});

eventSource.addEventListener('task_progress', (e) => {
  console.log('Progress:', JSON.parse(e.data));
});

eventSource.addEventListener('session_complete', (e) => {
  console.log('Done:', JSON.parse(e.data));
  eventSource.close();
});
```

## Error Responses

All errors follow this format:
```json
{
  "error": "error_code",
  "message": "Human-readable message",
  "details": {...}
}
```

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (invalid_request)
- `404` - Not Found (not_found)
- `429` - Too Many Requests (rate_limited)
- `500` - Server Error (internal_error)

## Development

```bash
# Install dependencies
npm install

# Start dev server (with hot reload)
npm run dev

# Type check
npm run typecheck

# Build for production
npm run build

# Run production server
npm start

# Test API
./test-api.sh
```

## Configuration

Environment variables:
- `PORT` - Server port (default: 8638)
- `HOST` - Server host (default: localhost)

## Rate Limits

- API Requests: 100 req/min per client
- WebSocket Messages: 50 msg/sec per connection
- SSE Connections: 5 concurrent per client
