import { z } from 'zod';

/** A UPM execution instance */
export interface UpmExecution {
  /** Unique execution identifier */
  id: string;
  /** Project name */
  project: string;
  /** Execution status */
  status: string;
  /** ISO-8601 creation timestamp */
  created_at: string;
}

/** A UPM event */
export interface UpmEvent {
  /** Event type */
  type: string;
  /** Event payload data */
  data: Record<string, unknown>;
  /** ISO-8601 event timestamp */
  timestamp: string;
}

/** A UPM agent assignment */
export interface UpmAgent {
  /** Agent identifier */
  agent_id: string;
  /** Work item the agent is assigned to */
  work_item_id?: string;
  /** Wave number */
  wave?: number;
}

/** Payload for registering a UPM execution */
export interface UpmRegisterPayload {
  /** Project name */
  project: string;
  /** Execution metadata */
  metadata?: Record<string, unknown>;
}

/** Payload for sending a UPM event */
export interface UpmEventPayload {
  /** Event type */
  type: string;
  /** Event data */
  data: Record<string, unknown>;
}

/** Payload for registering a UPM agent */
export interface UpmAgentPayload {
  /** Agent ID */
  agent_id: string;
  /** Work item ID */
  work_item_id?: string;
  /** Wave number */
  wave?: number;
}

/** Zod schema for UpmExecution */
export const UpmExecutionSchema = z.object({
  id: z.string(),
  project: z.string(),
  status: z.string(),
  created_at: z.string(),
});

/** Zod schema for UpmEvent */
export const UpmEventSchema = z.object({
  type: z.string(),
  data: z.record(z.unknown()),
  timestamp: z.string(),
});

/** Zod schema for UpmAgent */
export const UpmAgentSchema = z.object({
  agent_id: z.string(),
  work_item_id: z.string().optional(),
  wave: z.number().optional(),
});
