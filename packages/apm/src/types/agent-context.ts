import { z } from 'zod';
import { ToolCallStatusSchema } from './tool-call.js';

// --- Agent Context ---

/** Zod schema for AgentContext */
export const AgentContextSchema = z.object({
  agent_id: z.string(),
  current_phase: z.string().optional(),
  current_tool: z.string().optional(),
  formation_id: z.string().optional(),
  squadron_id: z.string().optional(),
  last_event_type: z.string().optional(),
  upm_story_id: z.string().optional(),
  updated_at: z.string().optional(),
});

/** Real-time AG-UI context for an agent */
export type AgentContext = z.infer<typeof AgentContextSchema>;

// --- Execution Context ---

/** Impact level for execution context */
export const ImpactLevelSchema = z.enum(['low', 'medium', 'high', 'critical']);
export type ImpactLevel = z.infer<typeof ImpactLevelSchema>;

/** Zod schema for ExecutionContext */
export const ExecutionContextSchema = z.object({
  tool_name: z.string().optional(),
  tool_purpose: z.string().optional(),
  affected_files: z.array(z.string()).optional(),
  estimated_impact: ImpactLevelSchema.optional(),
});

/** Execution context for an approval request */
export type ExecutionContext = z.infer<typeof ExecutionContextSchema>;

// --- Tool Call Summary ---

/** Zod schema for ToolCallSummary */
export const ToolCallSummarySchema = z.object({
  tool_call_id: z.string(),
  tool_name: z.string(),
  status: ToolCallStatusSchema,
  started_at: z.string().optional(),
  duration_ms: z.number().optional(),
});

/** Abbreviated tool call for context endpoints */
export type ToolCallSummary = z.infer<typeof ToolCallSummarySchema>;

// --- Response types ---

/** Response from GET /api/v2/agents/contexts */
export interface AgentContextsResponse {
  contexts: Record<string, AgentContext>;
}

/** Response from GET /api/v2/agents/{id}/context */
export interface AgentContextDetailResponse {
  agent_id: string;
  context: AgentContext;
  activity_label?: string;
  recent_tool_calls?: ToolCallSummary[];
}

/** Response from GET /api/v2/agents/{id}/context/events */
export interface AgentContextEventsResponse {
  agent_id: string;
  events: Record<string, unknown>[];
  count: number;
}
