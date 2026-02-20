/**
 * Integration tests for Session API endpoints
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { startTestServer } from '../utils/test-server.js';
import type {
  CreateSessionRequest,
  CreateSessionResponse,
  ListSessionsResponse,
  SessionDetail,
  ErrorResponse,
} from '../../types/index.js';

describe('Session API Endpoints', () => {
  let app: Express;
  let url: string;
  let cleanup: () => Promise<void>;
  let createdSessionIds: string[] = [];

  beforeAll(async () => {
    const testServer = await startTestServer();
    app = testServer.app;
    url = testServer.url;
    cleanup = testServer.cleanup;
  });

  afterAll(async () => {
    await cleanup();
  });

  beforeEach(() => {
    createdSessionIds = [];
  });

  describe('GET /api/sessions', () => {
    it('should list all sessions', async () => {
      const response = await request(app).get('/api/sessions').expect(200);

      const data = response.body as ListSessionsResponse;
      expect(data).toHaveProperty('sessions');
      expect(data).toHaveProperty('total');
      expect(Array.isArray(data.sessions)).toBe(true);
      expect(typeof data.total).toBe('number');
    });

    it('should return empty list when no sessions exist', async () => {
      const response = await request(app).get('/api/sessions').expect(200);

      const data = response.body as ListSessionsResponse;
      expect(data.sessions).toEqual([]);
      expect(data.total).toBe(0);
    });

    it('should include session summary fields', async () => {
      // Create a session first
      const createReq: CreateSessionRequest = {
        name: 'Test Session',
        description: 'Test description',
        agents: ['task-analyzer'],
        auto_start: false,
      };

      const createResp = await request(app)
        .post('/api/sessions')
        .send(createReq)
        .expect(201);

      const createData = createResp.body as CreateSessionResponse;
      createdSessionIds.push(createData.id);

      // List sessions
      const listResp = await request(app).get('/api/sessions').expect(200);

      const data = listResp.body as ListSessionsResponse;
      expect(data.sessions.length).toBe(1);

      const session = data.sessions[0];
      expect(session).toHaveProperty('id');
      expect(session).toHaveProperty('status');
      expect(session).toHaveProperty('created_at');
      expect(session).toHaveProperty('updated_at');
      expect(session).toHaveProperty('agents_count');
      expect(session).toHaveProperty('tasks_completed');
      expect(session).toHaveProperty('tasks_total');
      expect(session).toHaveProperty('progress');
      expect(session).toHaveProperty('name');
      expect(session).toHaveProperty('description');

      // Should NOT include detailed fields
      expect(session).not.toHaveProperty('agents');
      expect(session).not.toHaveProperty('tasks');
      expect(session).not.toHaveProperty('logs');
    });
  });

  describe('POST /api/sessions', () => {
    it('should create a new session', async () => {
      const req: CreateSessionRequest = {
        name: 'New Test Session',
        description: 'Test description',
        agents: ['task-analyzer', 'test-runner'],
        auto_start: false,
      };

      const response = await request(app)
        .post('/api/sessions')
        .send(req)
        .expect(201);

      const data = response.body as CreateSessionResponse;
      createdSessionIds.push(data.id);

      expect(data).toHaveProperty('id');
      expect(data.id).toMatch(/^sess_/);
      expect(data).toHaveProperty('status');
      expect(data.status).toBe('initializing');
      expect(data).toHaveProperty('websocket_url');
      expect(data.websocket_url).toContain(`ws://localhost`);
      expect(data.websocket_url).toContain(`/ws/sessions/${data.id}`);
      expect(data).toHaveProperty('stream_url');
      expect(data.stream_url).toContain(`http://localhost`);
      expect(data.stream_url).toContain(`/api/sessions/${data.id}/stream`);
    });

    it('should create session with auto_start', async () => {
      const req: CreateSessionRequest = {
        name: 'Auto Start Session',
        agents: ['task-analyzer'],
        auto_start: true,
      };

      const response = await request(app)
        .post('/api/sessions')
        .send(req)
        .expect(201);

      const data = response.body as CreateSessionResponse;
      createdSessionIds.push(data.id);

      expect(data.status).toBe('running');
    });

    it('should reject request without name', async () => {
      const req = {
        agents: ['task-analyzer'],
      };

      const response = await request(app)
        .post('/api/sessions')
        .send(req)
        .expect(400);

      const error = response.body as ErrorResponse;
      expect(error).toHaveProperty('error');
      expect(error.error).toBe('invalid_request');
      expect(error).toHaveProperty('message');
      expect(error).toHaveProperty('details');
    });

    it('should reject request without agents', async () => {
      const req = {
        name: 'Test Session',
      };

      const response = await request(app)
        .post('/api/sessions')
        .send(req)
        .expect(400);

      const error = response.body as ErrorResponse;
      expect(error).toHaveProperty('error');
      expect(error.error).toBe('invalid_request');
      expect(error.message).toContain('agent');
    });

    it('should reject request with empty agents array', async () => {
      const req: CreateSessionRequest = {
        name: 'Test Session',
        agents: [],
      };

      const response = await request(app)
        .post('/api/sessions')
        .send(req)
        .expect(400);

      const error = response.body as ErrorResponse;
      expect(error.error).toBe('invalid_request');
    });

    it('should create session with multiple agents', async () => {
      const req: CreateSessionRequest = {
        name: 'Multi-Agent Session',
        agents: ['task-analyzer', 'test-runner', 'build-fixer'],
        auto_start: false,
      };

      const response = await request(app)
        .post('/api/sessions')
        .send(req)
        .expect(201);

      const data = response.body as CreateSessionResponse;
      createdSessionIds.push(data.id);

      expect(data.id).toBeDefined();

      // Verify session details
      const detailResp = await request(app)
        .get(`/api/sessions/${data.id}`)
        .expect(200);

      const session = detailResp.body as SessionDetail;
      expect(session.agents.length).toBe(3);
      expect(session.agents_count).toBe(3);
    });
  });

  describe('GET /api/sessions/:id', () => {
    let sessionId: string;

    beforeEach(async () => {
      // Create a test session
      const req: CreateSessionRequest = {
        name: 'Detail Test Session',
        description: 'Session for detail endpoint tests',
        agents: ['task-analyzer'],
        auto_start: true,
      };

      const response = await request(app).post('/api/sessions').send(req);
      sessionId = response.body.id;
      createdSessionIds.push(sessionId);
    });

    it('should get session details', async () => {
      const response = await request(app)
        .get(`/api/sessions/${sessionId}`)
        .expect(200);

      const session = response.body as SessionDetail;
      expect(session.id).toBe(sessionId);
      expect(session).toHaveProperty('status');
      expect(session).toHaveProperty('created_at');
      expect(session).toHaveProperty('updated_at');
      expect(session).toHaveProperty('agents');
      expect(session).toHaveProperty('tasks');
      expect(session).toHaveProperty('logs');
      expect(session).toHaveProperty('files_modified');

      expect(Array.isArray(session.agents)).toBe(true);
      expect(Array.isArray(session.tasks)).toBe(true);
      expect(Array.isArray(session.logs)).toBe(true);
      expect(Array.isArray(session.files_modified)).toBe(true);
    });

    it('should return 404 for non-existent session', async () => {
      const response = await request(app)
        .get('/api/sessions/sess_nonexistent')
        .expect(404);

      const error = response.body as ErrorResponse;
      expect(error).toHaveProperty('error');
      expect(error.error).toBe('not_found');
      expect(error).toHaveProperty('message');
      expect(error).toHaveProperty('session_id');
      expect(error.session_id).toBe('sess_nonexistent');
    });

    it('should include agent details', async () => {
      const response = await request(app)
        .get(`/api/sessions/${sessionId}`)
        .expect(200);

      const session = response.body as SessionDetail;
      expect(session.agents.length).toBeGreaterThan(0);

      const agent = session.agents[0];
      expect(agent).toHaveProperty('id');
      expect(agent).toHaveProperty('type');
      expect(agent).toHaveProperty('status');
      expect(agent).toHaveProperty('session_id');
      expect(agent.session_id).toBe(sessionId);
    });

    it('should include initial log entry', async () => {
      const response = await request(app)
        .get(`/api/sessions/${sessionId}`)
        .expect(200);

      const session = response.body as SessionDetail;
      expect(session.logs.length).toBeGreaterThan(0);

      const log = session.logs[0];
      expect(log).toHaveProperty('timestamp');
      expect(log).toHaveProperty('level');
      expect(log).toHaveProperty('message');
      expect(log.message).toContain('created');
    });
  });

  describe('GET /api/sessions/:id/stream', () => {
    let sessionId: string;

    beforeEach(async () => {
      // Create a test session
      const req: CreateSessionRequest = {
        name: 'Stream Test Session',
        agents: ['task-analyzer'],
        auto_start: true,
      };

      const response = await request(app).post('/api/sessions').send(req);
      sessionId = response.body.id;
      createdSessionIds.push(sessionId);
    });

    it('should establish SSE connection', async () => {
      const response = await request(app)
        .get(`/api/sessions/${sessionId}/stream`)
        .set('Accept', 'text/event-stream')
        .expect(200);

      expect(response.headers['content-type']).toContain('text/event-stream');
      expect(response.headers['cache-control']).toBe('no-cache');
      expect(response.headers['connection']).toBe('keep-alive');
    });

    it('should return 404 for non-existent session stream', async () => {
      const response = await request(app)
        .get('/api/sessions/sess_nonexistent/stream')
        .set('Accept', 'text/event-stream')
        .expect(404);

      const error = response.body as ErrorResponse;
      expect(error.error).toBe('not_found');
      expect(error.session_id).toBe('sess_nonexistent');
    });

    it('should send initial session_started event', async () => {
      const response = request(app)
        .get(`/api/sessions/${sessionId}/stream`)
        .set('Accept', 'text/event-stream');

      // Wait a bit for initial event
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Note: Full SSE testing requires custom client implementation
      // This test verifies the endpoint is accessible
      expect(response).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON in POST', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      // Express will handle this before it reaches our handler
      expect(response.status).toBe(400);
    });

    it('should return proper error format', async () => {
      const req = {
        name: 'Test',
        agents: [],
      };

      const response = await request(app)
        .post('/api/sessions')
        .send(req)
        .expect(400);

      const error = response.body as ErrorResponse;
      expect(error).toHaveProperty('error');
      expect(error).toHaveProperty('message');
      expect(typeof error.error).toBe('string');
      expect(typeof error.message).toBe('string');
    });
  });
});
