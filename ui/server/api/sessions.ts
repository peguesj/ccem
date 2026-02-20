/**
 * Session Management API Endpoints
 */
import { Router, Request, Response } from 'express';
import type {
  Session,
  SessionDetail,
  CreateSessionRequest,
  CreateSessionResponse,
  ListSessionsResponse,
  ErrorResponse,
  SSEEvent,
} from '../types/index.js';

const router = Router();

// Mock data store (replace with actual CCEM integration later)
const sessions = new Map<string, SessionDetail>();
const sseClients = new Map<string, Set<Response>>();

// Helper to generate session ID
function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Helper to create mock session
function createMockSession(req: CreateSessionRequest): SessionDetail {
  const id = generateSessionId();
  const now = new Date().toISOString();

  return {
    id,
    status: req.auto_start ? 'running' : 'initializing',
    created_at: now,
    updated_at: now,
    agents_count: req.agents.length,
    tasks_completed: 0,
    tasks_total: 0,
    progress: 0,
    name: req.name,
    description: req.description,
    agents: req.agents.map((type, idx) => ({
      id: `agent_${idx + 1}`,
      type,
      status: req.auto_start ? 'running' : 'idle',
      session_id: id,
      tasks_completed: 0,
    })),
    tasks: [],
    files_modified: [],
    logs: [
      {
        timestamp: now,
        level: 'info',
        message: `Session ${id} created`,
      },
    ],
  };
}

/**
 * GET /api/sessions
 * List all active and historical sessions
 */
router.get('/', (req: Request, res: Response) => {
  const sessionList: Session[] = Array.from(sessions.values()).map(
    ({ agents, tasks, files_modified, logs, ...session }) => session
  );

  const response: ListSessionsResponse = {
    sessions: sessionList,
    total: sessionList.length,
  };

  res.json(response);
});

/**
 * GET /api/sessions/:id
 * Get detailed information about a specific session
 */
router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const session = sessions.get(id);

  if (!session) {
    const error: ErrorResponse = {
      error: 'not_found',
      message: 'Session not found',
      session_id: id,
    };
    return res.status(404).json(error);
  }

  res.json(session);
});

/**
 * POST /api/sessions
 * Create a new session
 */
router.post('/', (req: Request, res: Response) => {
  const body = req.body as CreateSessionRequest;

  // Validate request
  if (!body.name || !body.agents || body.agents.length === 0) {
    const error: ErrorResponse = {
      error: 'invalid_request',
      message: 'Invalid session configuration',
      details: {
        field: body.agents ? 'name' : 'agents',
        reason: body.agents ? 'Name is required' : 'At least one agent type required',
      },
    };
    return res.status(400).json(error);
  }

  const session = createMockSession(body);
  sessions.set(session.id, session);

  const response: CreateSessionResponse = {
    id: session.id,
    status: session.status,
    websocket_url: `ws://localhost:8638/ws/sessions/${session.id}`,
    stream_url: `http://localhost:8638/api/sessions/${session.id}/stream`,
  };

  res.status(201).json(response);
});

/**
 * GET /api/sessions/:id/stream
 * Server-Sent Events stream for real-time session updates
 */
router.get('/:id/stream', (req: Request, res: Response) => {
  const { id } = req.params;
  const session = sessions.get(id);

  if (!session) {
    const error: ErrorResponse = {
      error: 'not_found',
      message: 'Session not found',
      session_id: id,
    };
    return res.status(404).json(error);
  }

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

  // Add client to SSE clients set
  if (!sseClients.has(id)) {
    sseClients.set(id, new Set());
  }
  sseClients.get(id)!.add(res);

  // Send initial connection event
  const initialEvent: SSEEvent = {
    event: 'session_started',
    data: {
      session_id: id,
      timestamp: new Date().toISOString(),
    },
  };
  res.write(`event: ${initialEvent.event}\n`);
  res.write(`data: ${JSON.stringify(initialEvent.data)}\n\n`);

  // Send heartbeat every 30 seconds
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30000);

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
    const clients = sseClients.get(id);
    if (clients) {
      clients.delete(res);
      if (clients.size === 0) {
        sseClients.delete(id);
      }
    }
  });
});

/**
 * Helper function to broadcast SSE event to all clients of a session
 */
export function broadcastSSE(sessionId: string, event: SSEEvent): void {
  const clients = sseClients.get(sessionId);
  if (!clients) return;

  const eventStr = `event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`;

  clients.forEach((client) => {
    try {
      client.write(eventStr);
    } catch (error) {
      // Client disconnected, remove from set
      clients.delete(client);
    }
  });
}

export default router;
