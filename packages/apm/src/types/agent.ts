import { z } from 'zod';

/** Agent status values */
export type AgentStatus = 'active' | 'idle' | 'error' | 'offline';

/** Registered agent in the APM system */
export interface Agent {
  /** Unique agent identifier */
  id: string;
  /** Human-readable agent name */
  name: string;
  /** Project the agent belongs to */
  project: string;
  /** Agent role (e.g., orchestrator, squadron_lead) */
  role: string;
  /** Current agent status */
  status: AgentStatus;
  /** ISO-8601 timestamp when the agent was registered */
  registered_at: string;
  /** ISO-8601 timestamp of the last heartbeat */
  last_heartbeat: string;
  /** Computed health score (0-100) */
  health_score?: number;
  /** Formation ID if part of a formation */
  formation_id?: string;
  /** Role within a formation */
  formation_role?: string;
  /** Parent agent ID in the hierarchy */
  parent_agent_id?: string;
  /** Wave number for phased deployments */
  wave?: number;
  /** Description of the agent's current task */
  task_subject?: string;
  /** Session ID the agent belongs to */
  session_id?: string;
}

/** Payload for registering a new agent */
export interface AgentRegisterPayload {
  /** Unique agent identifier */
  agent_id: string;
  /** Project the agent belongs to */
  project: string;
  /** Agent role */
  role?: string;
  /** Initial status */
  status?: AgentStatus;
  /** Formation ID */
  formation_id?: string;
  /** Formation role */
  formation_role?: string;
  /** Parent agent ID */
  parent_agent_id?: string;
  /** Wave number */
  wave?: number;
  /** Task description */
  task_subject?: string;
  /** Session ID */
  session_id?: string;
}

/** Payload for updating an existing agent */
export interface AgentUpdatePayload {
  /** Updated status */
  status?: AgentStatus;
  /** Updated task subject */
  task_subject?: string;
  /** Updated health score */
  health_score?: number;
}

/** Result from agent discovery */
export interface AgentDiscoverResult {
  /** Discovered agents */
  agents: Agent[];
  /** Discovery timestamp */
  discovered_at: string;
}

/** Zod schema for AgentStatus */
export const AgentStatusSchema = z.enum(['active', 'idle', 'error', 'offline']);

/** Zod schema for Agent */
export const AgentSchema = z.object({
  id: z.string(),
  name: z.string(),
  project: z.string(),
  role: z.string(),
  status: AgentStatusSchema,
  registered_at: z.string(),
  last_heartbeat: z.string(),
  health_score: z.number().optional(),
  formation_id: z.string().optional(),
  formation_role: z.string().optional(),
  parent_agent_id: z.string().optional(),
  wave: z.number().optional(),
  task_subject: z.string().optional(),
  session_id: z.string().optional(),
});

/** Zod schema for AgentRegisterPayload */
export const AgentRegisterPayloadSchema = z.object({
  agent_id: z.string(),
  project: z.string(),
  role: z.string().optional(),
  status: AgentStatusSchema.optional(),
  formation_id: z.string().optional(),
  formation_role: z.string().optional(),
  parent_agent_id: z.string().optional(),
  wave: z.number().optional(),
  task_subject: z.string().optional(),
  session_id: z.string().optional(),
});
