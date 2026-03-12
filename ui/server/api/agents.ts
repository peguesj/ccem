/**
 * Agent Management API Endpoints
 *
 * Proxies to CCEM APM server via @ccem/apm client SDK.
 * Falls back to local mock data if APM is unavailable.
 */
import { Router, Request, Response } from 'express';
import { APMClient } from '@ccem/apm';
import type {
  Agent,
  AgentDetail,
  AssignTaskRequest,
  AssignTaskResponse,
  ListAgentsResponse,
  ErrorResponse,
} from '../types/index.js';

const router = Router();

// APM client for proxying to real APM server
const apm = new APMClient({ baseUrl: 'http://localhost:3032' });

// Local fallback data store (used when APM is unavailable)
const localAgents = new Map<string, AgentDetail>();

/**
 * GET /api/agents
 * List all agents — proxies to APM server, falls back to local data
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Try real APM first
    const apmAgents = await apm.agents.list();
    const agentList: Agent[] = apmAgents.map((a) => ({
      id: a.id,
      type: a.role ?? 'agent',
      status: a.status === 'active' ? 'running' : a.status === 'error' ? 'error' : 'idle',
      current_task: a.task_subject,
    }));

    const running = agentList.filter((a) => a.status === 'running').length;
    const idle = agentList.filter((a) => a.status === 'idle').length;

    const response: ListAgentsResponse = {
      agents: agentList,
      total: agentList.length,
      running,
      idle,
    };

    res.json(response);
  } catch {
    // Fallback to local data
    const agentList: Agent[] = Array.from(localAgents.values()).map(
      ({ completed_tasks, metrics, current_task, ...agent }) => ({
        ...agent,
        current_task: current_task?.description,
      })
    );

    const response: ListAgentsResponse = {
      agents: agentList,
      total: agentList.length,
      running: agentList.filter((a) => a.status === 'running').length,
      idle: agentList.filter((a) => a.status === 'idle').length,
    };

    res.json(response);
  }
});

/**
 * GET /api/agents/:id/status
 * Get detailed status of a specific agent
 */
router.get('/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const agent = localAgents.get(id);

  if (!agent) {
    const error: ErrorResponse = {
      error: 'not_found',
      message: 'Agent not found',
      details: {
        agent_id: id,
      },
    };
    return res.status(404).json(error);
  }

  res.json(agent);
});

/**
 * POST /api/agents/:id/task
 * Assign a task to a specific agent
 */
router.post('/:id/task', (req: Request, res: Response) => {
  const { id } = req.params;
  const body = req.body as AssignTaskRequest;

  const agent = localAgents.get(id);

  if (!agent) {
    const error: ErrorResponse = {
      error: 'not_found',
      message: 'Agent not found',
      details: {
        agent_id: id,
      },
    };
    return res.status(404).json(error);
  }

  // Validate request
  if (!body.task_id || !body.description) {
    const error: ErrorResponse = {
      error: 'invalid_request',
      message: 'Invalid task assignment',
      details: {
        field: !body.task_id ? 'task_id' : 'description',
        reason: !body.task_id ? 'Task ID is required' : 'Description is required',
      },
    };
    return res.status(400).json(error);
  }

  // Check if agent is busy
  if (agent.status === 'running' && agent.current_task) {
    const response: AssignTaskResponse = {
      agent_id: id,
      task_id: body.task_id,
      status: 'accepted',
      estimated_duration: 30,
      queue_position: 1, // Task will be queued
    };
    return res.json(response);
  }

  // Assign task to agent
  agent.current_task = {
    id: body.task_id,
    description: body.description,
    status: 'assigned',
    started_at: new Date().toISOString(),
    progress: 0,
    priority: body.priority,
    params: body.params,
  };
  agent.status = 'running';

  const response: AssignTaskResponse = {
    agent_id: id,
    task_id: body.task_id,
    status: 'accepted',
    estimated_duration: 30,
    queue_position: 0,
  };

  res.json(response);
});

export default router;
