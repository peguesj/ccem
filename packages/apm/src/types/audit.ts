import { z } from 'zod';

/** An audit log entry */
export interface AuditEntry {
  /** Unique entry identifier */
  id: string;
  /** ISO-8601 timestamp */
  timestamp: string;
  /** Action performed */
  action: string;
  /** Actor who performed the action */
  actor: string;
  /** Resource affected */
  resource: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/** Query parameters for listing audit entries */
export interface AuditListParams {
  /** Filter by action */
  action?: string;
  /** Filter by actor */
  actor?: string;
  /** Filter by resource */
  resource?: string;
  /** Limit results */
  limit?: number;
  /** Cursor for pagination */
  cursor?: string;
}

/** Zod schema for AuditEntry */
export const AuditEntrySchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  action: z.string(),
  actor: z.string(),
  resource: z.string(),
  metadata: z.record(z.unknown()).optional(),
});
