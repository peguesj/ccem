import { z } from 'zod';

// --- Auth Decision ---

/** Risk level for authorization decisions and tools */
export const RiskLevelSchema = z.enum(['low', 'medium', 'high', 'critical']);
export type RiskLevel = z.infer<typeof RiskLevelSchema>;

/** Authorization decision values */
export const AuthDecisionStatusSchema = z.enum(['permit', 'deny', 'escalate']);
export type AuthDecisionStatus = z.infer<typeof AuthDecisionStatusSchema>;

/** Zod schema for AuthDecision */
export const AuthDecisionSchema = z.object({
  ok: z.boolean(),
  decision: AuthDecisionStatusSchema,
  reason: z.string().optional(),
  risk_level: RiskLevelSchema.optional(),
  token_id: z.string().optional(),
});

/** An authorization decision result */
export type AuthDecision = z.infer<typeof AuthDecisionSchema>;

// --- Auth Session ---

/** Zod schema for AuthSession */
export const AuthSessionSchema = z.object({
  session_id: z.string(),
  user_id: z.string(),
  role: z.string(),
  scope: z.string().optional(),
  trust_ceiling: z.string().optional(),
  tool_calls: z.number().optional(),
  denied_count: z.number().optional(),
  expires_at: z.string().optional(),
  created_at: z.string().optional(),
});

/** An authorization session */
export type AuthSession = z.infer<typeof AuthSessionSchema>;

// --- Auth Tool ---

/** Zod schema for AuthTool */
export const AuthToolSchema = z.object({
  name: z.string(),
  risk_level: RiskLevelSchema.optional(),
  requires_approval: z.boolean().optional(),
  description: z.string().optional(),
  registered_at: z.string().optional(),
});

/** A registered authorization tool */
export type AuthTool = z.infer<typeof AuthToolSchema>;

// --- Payloads ---

/** Payload for POST /api/v2/auth/authorize */
export interface AuthorizePayload {
  agent_id: string;
  session_id: string;
  tool_name: string;
  params?: Record<string, unknown>;
}

/** Payload for POST /api/v2/auth/execute */
export interface AuthExecutePayload {
  token_id: string;
  result?: Record<string, unknown>;
}

/** Payload for POST /api/v2/auth/sessions (create session) */
export interface CreateAuthSessionPayload {
  user_id: string;
  role: string;
  scope?: string;
  ttl_seconds?: number;
  metadata?: Record<string, unknown>;
}

/** Payload for POST /api/v2/auth/tools (register tool) */
export interface RegisterAuthToolPayload {
  name: string;
  risk_level?: RiskLevel;
  requires_approval?: boolean;
  description?: string;
  metadata?: Record<string, unknown>;
}

/** Payload for POST /api/v2/auth/memory/authorize-read */
export interface MemoryAuthReadPayload {
  session_id: string;
  path: string;
  sensitivity?: string;
}

/** Payload for POST /api/v2/auth/memory/authorize-write */
export interface MemoryAuthWritePayload {
  session_id: string;
  path: string;
  sensitivity?: string;
  content_hash?: string;
}

/** Payload for POST /api/v2/auth/context/write */
export interface AuthContextWritePayload {
  session_id: string;
  path: string;
  scope?: string;
  sensitivity?: string;
  metadata?: Record<string, unknown>;
}

/** Payload for POST /api/v2/auth/redact */
export interface AuthRedactPayload {
  content: string;
  sensitivity?: string;
  rules?: string[];
}

/** Result of a redact operation */
export interface AuthRedactResult {
  ok: boolean;
  redacted: string;
  redactions_applied: number;
}

/** Auth summary response */
export interface AuthSummary {
  total_authorized: number;
  total_denied: number;
  active_sessions: number;
  registered_tools: number;
  risk_distribution: Record<string, unknown>;
  tokens: Record<string, unknown>;
}
