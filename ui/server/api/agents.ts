/**
 * Agent Management API Endpoints
 */
import { Router, Request, Response } from 'express';
import type {
  Agent,
  AgentDetail,
  AssignTaskRequest,
  AssignTaskResponse,
  ListAgentsResponse,
  ErrorResponse,
} from '../types/index.js';

const router = Router();

// Mock data store (replace with actual CCEM integration later)
const agents = new Map<string, AgentDetail>();

// Helper to create mock agent
function createMockAgent(id: string, type: string, sessionId?: string): AgentDetail {
  const now = new Date().toISOString();

  return {
    id,
    type,
    status: 'idle',
    session_id: sessionId,
    tasks_completed: 0,
    uptime_seconds: 0,
    performance: {
      avg_task_duration: 0,
      success_rate: 1.0,
    },
    completed_tasks: [],
    metrics: {
      total_tasks: 0,
      success_count: 0,
      error_count: 0,
      avg_duration: 0,
      cpu_usage: 0,
      memory_mb: 64,
    },
  };
}

// Initialize some mock agents
agents.set('agent_001', createMockAgent('agent_001', 'task-analyzer'));
agents.set('agent_002', createMockAgent('agent_002', 'test-runner'));
agents.set('agent_003', createMockAgent('agent_003', 'build-fixer'));

/**
 * GET /api/agents
 * List all available and running agents
 */
router.get('/', (req: Request, res: Response) => {
  const agentList: Agent[] = Array.from(agents.values()).map(
    ({ completed_tasks, metrics, current_task, ...agent }) => ({
      ...agent,
      current_task: current_task?.description,
    })
  );

  const running = agentList.filter((a) => a.status === 'running').length;
  const idle = agentList.filter((a) => a.status === 'idle').length;

  const response: ListAgentsResponse = {
    agents: agentList,
    total: agentList.length,
    running,
    idle,
  };

  res.json(response);
});

/**
 * GET /api/agents/:id/status
 * Get detailed status of a specific agent
 */
router.get('/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const agent = agents.get(id);

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

  const agent = agents.get(id);

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
