import { z } from 'zod';

/** Approval status values */
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

/** An approval record */
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

/** Payload for requesting an approval */
export interface ApprovalRequest {
  /** Approval type */
  type: string;
  /** Description of what needs approval */
  description: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/** Zod schema for ApprovalStatus */
export const ApprovalStatusSchema = z.enum(['pending', 'approved', 'rejected']);

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

/** Zod schema for ApprovalRequest */
export const ApprovalRequestSchema = z.object({
  type: z.string(),
  description: z.string(),
  metadata: z.record(z.unknown()).optional(),
});
