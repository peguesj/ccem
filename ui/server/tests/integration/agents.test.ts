/**
 * Integration tests for Agent API endpoints
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { startTestServer } from '../utils/test-server.js';
import type {
  ListAgentsResponse,
  AgentDetail,
  AssignTaskRequest,
  AssignTaskResponse,
  ErrorResponse,
} from '../../types/index.js';

describe('Agent API Endpoints', () => {
  let app: Express;
  let url: string;
  let cleanup: () => Promise<void>;

  beforeAll(async () => {
    const testServer = await startTestServer();
    app = testServer.app;
    url = testServer.url;
    cleanup = testServer.cleanup;
  });

  afterAll(async () => {
    await cleanup();
  });

  describe('GET /api/agents', () => {
    it('should list all agents', async () => {
      const response = await request(app).get('/api/agents').expect(200);

      const data = response.body as ListAgentsResponse;
      expect(data).toHaveProperty('agents');
      expect(data).toHaveProperty('total');
      expect(data).toHaveProperty('running');
      expect(data).toHaveProperty('idle');
      expect(Array.isArray(data.agents)).toBe(true);
      expect(typeof data.total).toBe('number');
      expect(typeof data.running).toBe('number');
      expect(typeof data.idle).toBe('number');
    });

    it('should include agent summary fields', async () => {
      const response = await request(app).get('/api/agents').expect(200);

      const data = response.body as ListAgentsResponse;
      expect(data.agents.length).toBeGreaterThan(0);

      const agent = data.agents[0];
      expect(agent).toHaveProperty('id');
      expect(agent).toHaveProperty('type');
      expect(agent).toHaveProperty('status');
      expect(agent).toHaveProperty('session_id');
      expect(agent).toHaveProperty('current_task');
      expect(agent).toHaveProperty('tasks_completed');
      expect(agent).toHaveProperty('uptime_seconds');
      expect(agent).toHaveProperty('performance');

      // Should NOT include detailed fields
      expect(agent).not.toHaveProperty('completed_tasks');
      expect(agent).not.toHaveProperty('metrics');
    });

    it('should correctly count running and idle agents', async () => {
      const response = await request(app).get('/api/agents').expect(200);

      const data = response.body as ListAgentsResponse;
      const runningCount = data.agents.filter(
        (a) => a.status === 'running'
      ).length;
      const idleCount = data.agents.filter((a) => a.status === 'idle').length;

      expect(data.running).toBe(runningCount);
      expect(data.idle).toBe(idleCount);
      expect(data.total).toBe(data.agents.length);
    });

    it('should have performance metrics', async () => {
      const response = await request(app).get('/api/agents').expect(200);

      const data = response.body as ListAgentsResponse;
      const agent = data.agents[0];

      expect(agent.performance).toBeDefined();
      expect(agent.performance).toHaveProperty('avg_task_duration');
      expect(agent.performance).toHaveProperty('success_rate');
      expect(typeof agent.performance.avg_task_duration).toBe('number');
      expect(typeof agent.performance.success_rate).toBe('number');
      expect(agent.performance.success_rate).toBeGreaterThanOrEqual(0);
      expect(agent.performance.success_rate).toBeLessThanOrEqual(1);
    });
  });

  describe('GET /api/agents/:id/status', () => {
    it('should get agent detailed status', async () => {
      // Get list of agents first
      const listResp = await request(app).get('/api/agents').expect(200);
      const agents = listResp.body.agents;
      expect(agents.length).toBeGreaterThan(0);

      const agentId = agents[0].id;

      // Get detailed status
      const response = await request(app)
        .get(`/api/agents/${agentId}/status`)
        .expect(200);

      const agent = response.body as AgentDetail;
      expect(agent.id).toBe(agentId);
      expect(agent).toHaveProperty('type');
      expect(agent).toHaveProperty('status');
      expect(agent).toHaveProperty('session_id');
      expect(agent).toHaveProperty('current_task');
      expect(agent).toHaveProperty('tasks_completed');
      expect(agent).toHaveProperty('uptime_seconds');
      expect(agent).toHaveProperty('performance');
      expect(agent).toHaveProperty('completed_tasks');
      expect(agent).toHaveProperty('metrics');

      expect(Array.isArray(agent.completed_tasks)).toBe(true);
    });

    it('should include detailed metrics', async () => {
      const listResp = await request(app).get('/api/agents').expect(200);
      const agentId = listResp.body.agents[0].id;

      const response = await request(app)
        .get(`/api/agents/${agentId}/status`)
        .expect(200);

      const agent = response.body as AgentDetail;
      expect(agent.metrics).toBeDefined();
      expect(agent.metrics).toHaveProperty('total_tasks');
      expect(agent.metrics).toHaveProperty('success_count');
      expect(agent.metrics).toHaveProperty('error_count');
      expect(agent.metrics).toHaveProperty('avg_duration');
      expect(agent.metrics).toHaveProperty('cpu_usage');
      expect(agent.metrics).toHaveProperty('memory_mb');

      expect(typeof agent.metrics.total_tasks).toBe('number');
      expect(typeof agent.metrics.success_count).toBe('number');
      expect(typeof agent.metrics.error_count).toBe('number');
      expect(typeof agent.metrics.avg_duration).toBe('number');
      expect(typeof agent.metrics.cpu_usage).toBe('number');
      expect(typeof agent.metrics.memory_mb).toBe('number');
    });

    it('should return 404 for non-existent agent', async () => {
      const response = await request(app)
        .get('/api/agents/agent_nonexistent/status')
        .expect(404);

      const error = response.body as ErrorResponse;
      expect(error).toHaveProperty('error');
      expect(error.error).toBe('not_found');
      expect(error).toHaveProperty('message');
      expect(error.message).toContain('not found');
      expect(error).toHaveProperty('details');
      expect(error.details).toHaveProperty('agent_id');
      expect(error.details?.agent_id).toBe('agent_nonexistent');
    });

    it('should have empty completed tasks for idle agent', async () => {
      const listResp = await request(app).get('/api/agents').expect(200);
      const idleAgent = listResp.body.agents.find(
        (a: any) => a.status === 'idle'
      );

      if (idleAgent) {
        const response = await request(app)
          .get(`/api/agents/${idleAgent.id}/status`)
          .expect(200);

        const agent = response.body as AgentDetail;
        expect(agent.completed_tasks).toEqual([]);
        expect(agent.current_task).toBeUndefined();
      }
    });
  });

  describe('POST /api/agents/:id/task', () => {
    it('should assign task to idle agent', async () => {
      // Find an idle agent
      const listResp = await request(app).get('/api/agents').expect(200);
      const idleAgent = listResp.body.agents.find(
        (a: any) => a.status === 'idle'
      );
      expect(idleAgent).toBeDefined();

      const taskReq: AssignTaskRequest = {
        task_id: 'task_001',
        description: 'Test task assignment',
        priority: 'high',
        params: {
          key: 'value',
        },
      };

      const response = await request(app)
        .post(`/api/agents/${idleAgent.id}/task`)
        .send(taskReq)
        .expect(200);

      const data = response.body as AssignTaskResponse;
      expect(data).toHaveProperty('agent_id');
      expect(data.agent_id).toBe(idleAgent.id);
      expect(data).toHaveProperty('task_id');
      expect(data.task_id).toBe('task_001');
      expect(data).toHaveProperty('status');
      expect(data.status).toBe('accepted');
      expect(data).toHaveProperty('estimated_duration');
      expect(data).toHaveProperty('queue_position');
      expect(data.queue_position).toBe(0);
    });

    it('should queue task for busy agent', async () => {
      // Find an idle agent and assign a task to make it busy
      const listResp = await request(app).get('/api/agents').expect(200);
      const idleAgent = listResp.body.agents.find(
        (a: any) => a.status === 'idle'
      );
      expect(idleAgent).toBeDefined();

      // Assign first task
      const firstTask: AssignTaskRequest = {
        task_id: 'task_001',
        description: 'First task',
        priority: 'high',
      };

      await request(app)
        .post(`/api/agents/${idleAgent.id}/task`)
        .send(firstTask)
        .expect(200);

      // Assign second task (should be queued)
      const secondTask: AssignTaskRequest = {
        task_id: 'task_002',
        description: 'Second task',
        priority: 'medium',
      };

      const response = await request(app)
        .post(`/api/agents/${idleAgent.id}/task`)
        .send(secondTask)
        .expect(200);

      const data = response.body as AssignTaskResponse;
      expect(data.status).toBe('accepted');
      expect(data.queue_position).toBe(1);
    });

    it('should reject task without task_id', async () => {
      const listResp = await request(app).get('/api/agents').expect(200);
      const agentId = listResp.body.agents[0].id;

      const taskReq = {
        description: 'Test task',
        priority: 'high',
      };

      const response = await request(app)
        .post(`/api/agents/${agentId}/task`)
        .send(taskReq)
        .expect(400);

      const error = response.body as ErrorResponse;
      expect(error.error).toBe('invalid_request');
      expect(error.message).toContain('task assignment');
      expect(error.details?.field).toBe('task_id');
    });

    it('should reject task without description', async () => {
      const listResp = await request(app).get('/api/agents').expect(200);
      const agentId = listResp.body.agents[0].id;

      const taskReq = {
        task_id: 'task_001',
        priority: 'high',
      };

      const response = await request(app)
        .post(`/api/agents/${agentId}/task`)
        .send(taskReq)
        .expect(400);

      const error = response.body as ErrorResponse;
      expect(error.error).toBe('invalid_request');
      expect(error.details?.field).toBe('description');
    });

    it('should return 404 for non-existent agent', async () => {
      const taskReq: AssignTaskRequest = {
        task_id: 'task_001',
        description: 'Test task',
        priority: 'high',
      };

      const response = await request(app)
        .post('/api/agents/agent_nonexistent/task')
        .send(taskReq)
        .expect(404);

      const error = response.body as ErrorResponse;
      expect(error.error).toBe('not_found');
      expect(error.details?.agent_id).toBe('agent_nonexistent');
    });

    it('should accept task with optional params', async () => {
      const listResp = await request(app).get('/api/agents').expect(200);
      const agentId = listResp.body.agents[0].id;

      const taskReq: AssignTaskRequest = {
        task_id: 'task_with_params',
        description: 'Task with parameters',
        priority: 'low',
        params: {
          target: 'test.ts',
          operation: 'analyze',
          deep: true,
        },
      };

      const response = await request(app)
        .post(`/api/agents/${agentId}/task`)
        .send(taskReq)
        .expect(200);

      const data = response.body as AssignTaskResponse;
      expect(data.status).toBe('accepted');

      // Verify the task was assigned with params
      const statusResp = await request(app)
        .get(`/api/agents/${agentId}/status`)
        .expect(200);

      const agent = statusResp.body as AgentDetail;
      if (agent.current_task) {
        expect(agent.current_task.params).toEqual(taskReq.params);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON in POST', async () => {
      const listResp = await request(app).get('/api/agents').expect(200);
      const agentId = listResp.body.agents[0].id;

      const response = await request(app)
        .post(`/api/agents/${agentId}/task`)
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.status).toBe(400);
    });

    it('should return proper error format', async () => {
      const response = await request(app)
        .get('/api/agents/nonexistent/status')
        .expect(404);

      const error = response.body as ErrorResponse;
      expect(error).toHaveProperty('error');
      expect(error).toHaveProperty('message');
      expect(typeof error.error).toBe('string');
      expect(typeof error.message).toBe('string');
    });
  });
});
