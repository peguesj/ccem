import { z } from 'zod';

/** A formation of agents */
export interface Formation {
  /** Unique formation identifier */
  id: string;
  /** Formation name */
  name: string;
  /** Project the formation belongs to */
  project: string;
  /** Formation status */
  status: string;
  /** Number of waves in the formation */
  waves: number;
  /** Agent IDs in the formation */
  agents: string[];
  /** ISO-8601 creation timestamp */
  created_at: string;
}

/** Payload for creating a formation */
export interface CreateFormationPayload {
  /** Formation name */
  name: string;
  /** Project name */
  project: string;
  /** Number of waves */
  waves?: number;
  /** Initial configuration */
  config?: Record<string, unknown>;
}

/** A workflow definition */
export interface Workflow {
  /** Unique workflow identifier */
  id: string;
  /** Workflow type (e.g., ship, upm, ralph) */
  type: string;
  /** Workflow name */
  name: string;
  /** Workflow configuration */
  config: Record<string, unknown>;
  /** Current workflow status */
  status: string;
  /** ISO-8601 creation timestamp */
  created_at: string;
  /** ISO-8601 last update timestamp */
  updated_at: string;
}

/** Payload for creating a workflow */
export interface CreateWorkflowPayload {
  /** Workflow type */
  type: string;
  /** Workflow name */
  name: string;
  /** Workflow configuration */
  config: Record<string, unknown>;
}

/** Payload for updating a workflow */
export interface UpdateWorkflowPayload {
  /** Updated status */
  status?: string;
  /** Updated configuration */
  config?: Record<string, unknown>;
}

/** Verification status values */
export type VerifyStatus = 'pending' | 'passed' | 'failed';

/** Result item from a verification */
export interface VerifyResultItem {
  /** Check name */
  name: string;
  /** Whether the check passed */
  passed: boolean;
  /** Optional message */
  message?: string;
}

/** Result of a double-verification */
export interface VerifyResult {
  /** Unique verification identifier */
  id: string;
  /** Verification status */
  status: VerifyStatus;
  /** Individual verification results */
  results: VerifyResultItem[];
}

/** Payload for requesting double-verification */
export interface DoubleVerifyPayload {
  /** Items to verify */
  checks: string[];
  /** Context or scope */
  context?: Record<string, unknown>;
}

/** Zod schema for Formation */
export const FormationSchema = z.object({
  id: z.string(),
  name: z.string(),
  project: z.string(),
  status: z.string(),
  waves: z.number(),
  agents: z.array(z.string()),
  created_at: z.string(),
});

/** Zod schema for Workflow */
export const WorkflowSchema = z.object({
  id: z.string(),
  type: z.string(),
  name: z.string(),
  config: z.record(z.unknown()),
  status: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

/** Zod schema for VerifyResult */
export const VerifyResultSchema = z.object({
  id: z.string(),
  status: z.enum(['pending', 'passed', 'failed']),
  results: z.array(z.object({
    name: z.string(),
    passed: z.boolean(),
    message: z.string().optional(),
  })),
});
