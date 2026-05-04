import { z } from 'zod';

// --- Coalesce Run ---

/** Coalesce run status values */
export const CoalesceRunStatusSchema = z.enum([
  'planning', 'intelligence', 'analysis', 'generation',
  'validation', 'applying', 'complete', 'failed',
]);
export type CoalesceRunStatus = z.infer<typeof CoalesceRunStatusSchema>;

/** Zod schema for CoalesceRunSummary (list response) */
export const CoalesceRunSummarySchema = z.object({
  run_id: z.string(),
  scope: z.string().optional(),
  status: z.string(),
  dry_run: z.boolean().optional(),
  affected_skill_count: z.number().optional(),
  diff_count: z.number().optional(),
  started_at: z.string().optional(),
  completed_at: z.string().optional(),
});

/** A coalesce run summary */
export type CoalesceRunSummary = z.infer<typeof CoalesceRunSummarySchema>;

// --- Gate ---

/** Gate status values */
export const GateStatusSchema = z.enum(['pending', 'approved', 'rejected', 'timeout']);
export type GateStatus = z.infer<typeof GateStatusSchema>;

/** Zod schema for Gate */
export const GateSchema = z.object({
  gate_id: z.string(),
  question: z.string().optional(),
  context: z.string().optional(),
  options: z.array(z.string()).optional(),
  status: GateStatusSchema,
  decision: z.string().optional(),
  method: z.string().optional(),
  requested_at: z.string().optional(),
  resolved_at: z.string().optional(),
});

/** A UPM decision gate record */
export type Gate = z.infer<typeof GateSchema>;

// --- Gate Decision ---

/** Gate decision values */
export const GateDecisionValueSchema = z.enum(['approved', 'rejected', 'timeout']);

/** Zod schema for GateDecision */
export const GateDecisionSchema = z.object({
  gate_id: z.string(),
  question: z.string().optional(),
  decision: GateDecisionValueSchema,
  reason: z.string().optional(),
  method: z.string().optional(),
});

/** Result of a blocking gate request */
export type GateDecision = z.infer<typeof GateDecisionSchema>;

// --- Payloads ---

/** Payload for POST /api/v2/coalesce/start */
export interface StartCoalescePayload {
  scope?: string;
  source_url?: string;
  dry_run?: boolean;
  auto_approve?: boolean;
  agent_count?: number;
}

/** Payload for POST /api/v2/coalesce/preview */
export interface CoalescePreviewPayload {
  scope?: string;
  sources?: string[];
}

/** Payload for POST /api/v2/coalesce/{id}/gate/{gate_id}/decide */
export interface CoalesceGateDecidePayload {
  decision?: 'approve' | 'reject' | 'defer';
  reason?: string;
  approver?: string;
}

/** Payload for POST /api/v2/upm/gate (create gate) */
export interface CreateGatePayload {
  question: string;
  context?: string;
  options?: string[];
}

/** Response from POST /api/v2/coalesce/start */
export interface CoalesceStartResult {
  run_id: string;
  formation_id?: string;
  scope?: string;
  dry_run?: boolean;
  message?: string;
  dashboard_url?: string;
}
