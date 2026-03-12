import { z } from 'zod';

/** Session status values */
export type SessionStatus = 'active' | 'completed' | 'error';

/** A Claude Code session tracked by APM */
export interface Session {
  /** Unique session identifier */
  id: string;
  /** Project the session belongs to */
  project: string;
  /** Agent ID associated with this session */
  agent_id: string;
  /** ISO-8601 timestamp when the session started */
  started_at: string;
  /** ISO-8601 timestamp when the session ended */
  ended_at?: string;
  /** Current session status */
  status: SessionStatus;
}

/** Zod schema for SessionStatus */
export const SessionStatusSchema = z.enum(['active', 'completed', 'error']);

/** Zod schema for Session */
export const SessionSchema = z.object({
  id: z.string(),
  project: z.string(),
  agent_id: z.string(),
  started_at: z.string(),
  ended_at: z.string().optional(),
  status: SessionStatusSchema,
});
