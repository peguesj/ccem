import { z } from 'zod';

/** Tool call status values */
export type ToolCallStatus = 'pending' | 'running' | 'completed' | 'failed';

/** A tracked tool call */
export interface ToolCall {
  /** Unique tool call identifier */
  id: string;
  /** Agent that made the call */
  agent_id: string;
  /** Name of the tool invoked */
  tool_name: string;
  /** Current call status */
  status: ToolCallStatus;
  /** Input parameters passed to the tool */
  input?: Record<string, unknown>;
  /** Output returned by the tool */
  output?: Record<string, unknown>;
  /** ISO-8601 timestamp when the call started */
  started_at: string;
  /** ISO-8601 timestamp when the call completed */
  completed_at?: string;
  /** Duration of the call in milliseconds */
  duration_ms?: number;
}

/** Aggregated tool call statistics */
export interface ToolCallStats {
  /** Total tool calls */
  total: number;
  /** Calls by status */
  by_status: Record<ToolCallStatus, number>;
  /** Calls by tool name */
  by_tool: Record<string, number>;
  /** Average duration in milliseconds */
  avg_duration_ms: number;
}

/** Query parameters for listing tool calls */
export interface ToolCallListParams {
  /** Filter by agent ID */
  agent_id?: string;
  /** Filter by tool name */
  tool_name?: string;
  /** Filter by status */
  status?: ToolCallStatus;
  /** Limit results */
  limit?: number;
  /** Cursor for pagination */
  cursor?: string;
}

/** Zod schema for ToolCallStatus */
export const ToolCallStatusSchema = z.enum(['pending', 'running', 'completed', 'failed']);

/** Zod schema for ToolCall */
export const ToolCallSchema = z.object({
  id: z.string(),
  agent_id: z.string(),
  tool_name: z.string(),
  status: ToolCallStatusSchema,
  input: z.record(z.unknown()).optional(),
  output: z.record(z.unknown()).optional(),
  started_at: z.string(),
  completed_at: z.string().optional(),
  duration_ms: z.number().optional(),
});

/** Zod schema for ToolCallStats */
export const ToolCallStatsSchema = z.object({
  total: z.number(),
  by_status: z.record(ToolCallStatusSchema, z.number()),
  by_tool: z.record(z.number()),
  avg_duration_ms: z.number(),
});
