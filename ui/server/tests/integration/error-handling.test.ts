/**
 * Integration tests for error handling across all endpoints
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { startTestServer } from '../utils/test-server.js';
import type { ErrorResponse } from '../../types/index.js';

describe('Error Handling', () => {
  let app: Express;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const testServer = await startTestServer();
    app = testServer.app;
    cleanup = testServer.cleanup;
  });

  afterAll(async () => {
    await cleanup();
  });

  describe('404 Not Found', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      const error = response.body as ErrorResponse;
      expect(error).toHaveProperty('error');
      expect(error.error).toBe('not_found');
      expect(error).toHaveProperty('message');
      expect(error.message).toContain('/api/nonexistent');
    });

    it('should return 404 for non-existent session', async () => {
      const response = await request(app)
        .get('/api/sessions/nonexistent_id')
        .expect(404);

      const error = response.body as ErrorResponse;
      expect(error.error).toBe('not_found');
      expect(error.message).toContain('not found');
      expect(error).toHaveProperty('session_id');
    });

    it('should return 404 for non-existent agent', async () => {
      const response = await request(app)
        .get('/api/agents/nonexistent_id/status')
        .expect(404);

      const error = response.body as ErrorResponse;
      expect(error.error).toBe('not_found');
      expect(error.message).toContain('not found');
      expect(error.details).toHaveProperty('agent_id');
    });

    it('should handle 404 for POST on non-existent agent', async () => {
      const response = await request(app)
        .post('/api/agents/nonexistent_id/task')
        .send({
          task_id: 'task_001',
          description: 'Test task',
          priority: 'high',
        })
        .expect(404);

      const error = response.body as ErrorResponse;
      expect(error.error).toBe('not_found');
    });

    it('should return 404 for invalid nested routes', async () => {
      const response = await request(app)
        .get('/api/sessions/sess_123/invalid')
        .expect(404);

      const error = response.body as ErrorResponse;
      expect(error.error).toBe('not_found');
    });
  });

  describe('400 Bad Request', () => {
    it('should return 400 for missing required fields in session creation', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .send({
          // Missing name and agents
        })
        .expect(400);

      const error = response.body as ErrorResponse;
      expect(error.error).toBe('invalid_request');
      expect(error).toHaveProperty('details');
    });

    it('should return 400 for empty agents array', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .send({
          name: 'Test',
          agents: [],
        })
        .expect(400);

      const error = response.body as ErrorResponse;
      expect(error.error).toBe('invalid_request');
      expect(error.message).toContain('agent');
    });

    it('should return 400 for missing task_id in task assignment', async () => {
      // Get an agent first
      const listResp = await request(app).get('/api/agents');
      const agentId = listResp.body.agents[0].id;

      const response = await request(app)
        .post(`/api/agents/${agentId}/task`)
        .send({
          description: 'Test task',
          priority: 'high',
        })
        .expect(400);

      const error = response.body as ErrorResponse;
      expect(error.error).toBe('invalid_request');
      expect(error.details?.field).toBe('task_id');
    });

    it('should return 400 for missing description in task assignment', async () => {
      const listResp = await request(app).get('/api/agents');
      const agentId = listResp.body.agents[0].id;

      const response = await request(app)
        .post(`/api/agents/${agentId}/task`)
        .send({
          task_id: 'task_001',
          priority: 'high',
        })
        .expect(400);

      const error = response.body as ErrorResponse;
      expect(error.error).toBe('invalid_request');
      expect(error.details?.field).toBe('description');
    });

    it('should return 400 for malformed JSON', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      expect(response.status).toBe(400);
    });
  });

  describe('Error Response Format', () => {
    it('should have consistent error format', async () => {
      const response = await request(app)
        .get('/api/sessions/nonexistent')
        .expect(404);

      const error = response.body as ErrorResponse;
      expect(error).toHaveProperty('error');
      expect(error).toHaveProperty('message');
      expect(typeof error.error).toBe('string');
      expect(typeof error.message).toBe('string');
    });

    it('should include error details when available', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .send({
          name: 'Test',
          agents: [],
        })
        .expect(400);

      const error = response.body as ErrorResponse;
      expect(error).toHaveProperty('details');
      expect(error.details).toBeDefined();
    });

    it('should include session_id in session-related errors', async () => {
      const response = await request(app)
        .get('/api/sessions/sess_test123')
        .expect(404);

      const error = response.body as ErrorResponse;
      expect(error).toHaveProperty('session_id');
      expect(error.session_id).toBe('sess_test123');
    });

    it('should include agent_id in agent-related errors', async () => {
      const response = await request(app)
        .get('/api/agents/agent_test123/status')
        .expect(404);

      const error = response.body as ErrorResponse;
      expect(error.details).toHaveProperty('agent_id');
      expect(error.details?.agent_id).toBe('agent_test123');
    });
  });

  describe('Content Type Handling', () => {
    it('should handle missing Content-Type header', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .send({
          name: 'Test',
          agents: ['task-analyzer'],
        })
        .expect(201);

      expect(response.status).toBe(201);
    });

    it('should handle application/json Content-Type', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .set('Content-Type', 'application/json')
        .send(
          JSON.stringify({
            name: 'Test',
            agents: ['task-analyzer'],
          })
        )
        .expect(201);

      expect(response.status).toBe(201);
    });
  });

  describe('HTTP Method Validation', () => {
    it('should return 404 for unsupported methods on sessions endpoint', async () => {
      const response = await request(app)
        .put('/api/sessions')
        .expect(404);

      expect(response.status).toBe(404);
    });

    it('should return 404 for unsupported methods on agents endpoint', async () => {
      const response = await request(app)
        .delete('/api/agents')
        .expect(404);

      expect(response.status).toBe(404);
    });
  });

  describe('Query Parameter Handling', () => {
    it('should ignore unknown query parameters', async () => {
      const response = await request(app)
        .get('/api/sessions?unknown=param')
        .expect(200);

      expect(response.status).toBe(200);
    });

    it('should handle empty query string', async () => {
      const response = await request(app).get('/api/sessions?').expect(200);

      expect(response.status).toBe(200);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long session names', async () => {
      const longName = 'A'.repeat(1000);

      const response = await request(app)
        .post('/api/sessions')
        .send({
          name: longName,
          agents: ['task-analyzer'],
        })
        .expect(201);

      expect(response.body.id).toBeDefined();
    });

    it('should handle special characters in session names', async () => {
      const specialName = 'Test @#$%^&*() Session';

      const response = await request(app)
        .post('/api/sessions')
        .send({
          name: specialName,
          agents: ['task-analyzer'],
        })
        .expect(201);

      expect(response.body.id).toBeDefined();
    });

    it('should handle unicode characters in descriptions', async () => {
      const unicodeName = 'Test 测试 テスト';

      const response = await request(app)
        .post('/api/sessions')
        .send({
          name: unicodeName,
          agents: ['task-analyzer'],
        })
        .expect(201);

      expect(response.body.id).toBeDefined();
    });

    it('should handle large agent arrays', async () => {
      const agents = Array(100).fill('task-analyzer');

      const response = await request(app)
        .post('/api/sessions')
        .send({
          name: 'Large Agent Array',
          agents,
        })
        .expect(201);

      expect(response.body.id).toBeDefined();
    });

    it('should handle empty strings', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .send({
          name: '',
          agents: ['task-analyzer'],
        })
        .expect(400);

      expect(response.status).toBe(400);
    });
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('version');
    });

    it('should have valid timestamp', async () => {
      const response = await request(app).get('/health').expect(200);

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp.getTime()).toBeGreaterThan(0);
    });

    it('should have numeric uptime', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(typeof response.body.uptime).toBe('number');
      expect(response.body.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('CORS Handling', () => {
    it('should include CORS headers', async () => {
      const response = await request(app).get('/api/sessions').expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('*');
    });

    it('should handle OPTIONS preflight', async () => {
      const response = await request(app)
        .options('/api/sessions')
        .expect(204);

      expect(response.headers['access-control-allow-methods']).toBeDefined();
    });
  });
});
