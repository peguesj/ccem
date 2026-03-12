import { z } from 'zod';

/** A notification from the APM system */
export interface Notification {
  /** Unique notification identifier */
  id: string;
  /** Notification type (e.g., info, warning, error) */
  type: string;
  /** Human-readable notification message */
  message: string;
  /** ISO-8601 timestamp when the notification was created */
  timestamp: string;
  /** Whether the notification has been read */
  read: boolean;
  /** Project associated with the notification */
  project?: string;
  /** Notification category for filtering */
  category?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/** Payload for adding a new notification */
export interface NotificationPayload {
  /** Notification type */
  type: string;
  /** Notification message */
  message: string;
  /** Project to associate */
  project?: string;
  /** Notification category */
  category?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/** Zod schema for Notification */
export const NotificationSchema = z.object({
  id: z.string(),
  type: z.string(),
  message: z.string(),
  timestamp: z.string(),
  read: z.boolean(),
  project: z.string().optional(),
  category: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});
