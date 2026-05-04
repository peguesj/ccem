import { z } from 'zod';
import { ExecutionContextSchema } from './agent-context.js';
import type { ExecutionContext } from './agent-context.js';

/** Approval status values (v9.0.0: added 'timeout') */
export const ApprovalStatusSchema = z.enum(['pending', 'approved', 'rejected', 'timeout']);
export type ApprovalStatus = z.infer<typeof ApprovalStatusSchema>;

/** Risk level for approvals */
export const ApprovalRiskLevelSchema = z.enum(['low', 'medium', 'high', 'critical']);

/** Keyboard shortcuts for an approval modal */
export const KeyboardShortcutsSchema = z.object({
  approve: z.string().optional(),
  reject: z.string().optional(),
  dismiss: z.string().optional(),
  details: z.string().optional(),
});

/** An approval record (legacy v1 shape, still used by list endpoint) */
export interface Approval {
  /** Unique approval identifier */
  id: string;
  /** Approval type */
  type: string;
  /** Who requested the approval */
  requester: string;
  /** Current approval status */
  status: ApprovalStatus;
  /** Reason for approval/rejection */
  reason?: string;
  /** Who made the decision */
  decided_by?: string;
  /** ISO-8601 timestamp of the decision */
  decided_at?: string;
  /** ISO-8601 creation timestamp */
  created_at: string;
}

/** Zod schema for Approval */
export const ApprovalSchema = z.object({
  id: z.string(),
  type: z.string(),
  requester: z.string(),
  status: ApprovalStatusSchema,
  reason: z.string().optional(),
  decided_by: z.string().optional(),
  decided_at: z.string().optional(),
  created_at: z.string(),
});

/** Approval request with execution context (v9.0.0) */
export interface ApprovalRequest {
  /** Unique request identifier */
  id?: string;
  /** Tool name */
  tool_name?: string;
  /** Agent requesting approval */
  agent_id?: string;
  /** Session ID */
  session_id?: string;
  /** Human-readable agent label */
  display_name?: string;
  /** Execution context describing what the tool will do */
  execution_context?: ExecutionContext;
  /** Risk level of the operation */
  risk_level?: 'low' | 'medium' | 'high' | 'critical';
  /** Grouping key for batched notifications */
  group_key?: string;
  /** Current status */
  status?: ApprovalStatus;
  /** Decision value */
  decision?: string;
  /** When the decision was made */
  decided_at?: string;
  /** When the approval expires */
  expires_at?: string;
  /** When the request was created */
  inserted_at?: string;
  /** Keyboard shortcuts */
  keyboard_shortcuts?: {
    approve?: string;
    reject?: string;
    dismiss?: string;
    details?: string;
  };
  // Legacy fields
  /** Approval type (legacy) */
  type?: string;
  /** Description of what needs approval (legacy) */
  description?: string;
  /** Additional metadata (legacy) */
  metadata?: Record<string, unknown>;
}

/** Zod schema for ApprovalRequest (v9.0.0) */
export const ApprovalRequestSchema = z.object({
  id: z.string().optional(),
  tool_name: z.string().optional(),
  agent_id: z.string().optional(),
  session_id: z.string().optional(),
  display_name: z.string().optional(),
  execution_context: ExecutionContextSchema.optional(),
  risk_level: ApprovalRiskLevelSchema.optional(),
  group_key: z.string().optional(),
  status: ApprovalStatusSchema.optional(),
  decision: z.string().optional(),
  decided_at: z.string().optional(),
  expires_at: z.string().optional(),
  inserted_at: z.string().optional(),
  keyboard_shortcuts: KeyboardShortcutsSchema.optional(),
  type: z.string().optional(),
  description: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

// --- Approval Audit Entry (v9.0.0) ---

/** Method of approval decision */
export const ApprovalMethodSchema = z.enum([
  'keyboard_shortcut', 'button_click', 'api', 'auto_approval', 'timeout',
]);
export type ApprovalMethod = z.infer<typeof ApprovalMethodSchema>;

/** Zod schema for ApprovalAuditEntry */
export const ApprovalAuditEntrySchema = z.object({
  id: z.string().optional(),
  tool_name: z.string().optional(),
  agent_id: z.string().optional(),
  session_id: z.string().optional(),
  decision: z.enum(['approved', 'rejected', 'timeout']),
  method: ApprovalMethodSchema.optional(),
  reason: z.string().nullable().optional(),
  risk_level: ApprovalRiskLevelSchema.optional(),
  context_snapshot: ExecutionContextSchema.optional(),
  timestamp: z.string().optional(),
});

/** Audit log entry for an approval decision */
export type ApprovalAuditEntry = z.infer<typeof ApprovalAuditEntrySchema>;

/** Response from GET /api/v2/approvals/history */
export interface ApprovalHistoryResponse {
  entries: ApprovalAuditEntry[];
  total: number;
  next_cursor?: string | null;
}
