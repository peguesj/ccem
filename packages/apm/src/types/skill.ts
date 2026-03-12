import { z } from 'zod';

/** A tracked skill invocation */
export interface Skill {
  /** Skill name */
  name: string;
  /** Number of times the skill has been invoked */
  invocations: number;
  /** ISO-8601 timestamp of the last invocation */
  last_invoked: string;
  /** Project associated with the invocation */
  project?: string;
  /** Session ID of the invocation */
  session_id?: string;
}

/** A skill in the registry with health metadata */
export interface SkillRegistry {
  /** Skill name */
  name: string;
  /** Skill description */
  description: string;
  /** Filesystem path to the skill */
  path: string;
  /** Health score (0-100) */
  health_score: number;
  /** Trigger keywords */
  triggers?: string[];
}

/** Result of a skill audit operation */
export interface SkillAuditResult {
  /** Total skills audited */
  total: number;
  /** Number of healthy skills */
  healthy: number;
  /** Number of skills with issues */
  issues: number;
  /** Detailed audit findings */
  findings: SkillAuditFinding[];
}

/** Individual finding from a skill audit */
export interface SkillAuditFinding {
  /** Skill name */
  skill: string;
  /** Finding type */
  type: string;
  /** Finding message */
  message: string;
  /** Severity level */
  severity: 'info' | 'warning' | 'error';
}

/** Payload for tracking a skill invocation */
export interface TrackSkillPayload {
  /** Skill name */
  name: string;
  /** Project name */
  project?: string;
  /** Session ID */
  session_id?: string;
}

/** Zod schema for Skill */
export const SkillSchema = z.object({
  name: z.string(),
  invocations: z.number(),
  last_invoked: z.string(),
  project: z.string().optional(),
  session_id: z.string().optional(),
});

/** Zod schema for SkillRegistry */
export const SkillRegistrySchema = z.object({
  name: z.string(),
  description: z.string(),
  path: z.string(),
  health_score: z.number(),
  triggers: z.array(z.string()).optional(),
});

/** Zod schema for SkillAuditResult */
export const SkillAuditResultSchema = z.object({
  total: z.number(),
  healthy: z.number(),
  issues: z.number(),
  findings: z.array(z.object({
    skill: z.string(),
    type: z.string(),
    message: z.string(),
    severity: z.enum(['info', 'warning', 'error']),
  })),
});
