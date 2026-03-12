import { z } from 'zod';

/** An intake event */
export interface IntakeEvent {
  /** Unique event identifier */
  id: string;
  /** Event type */
  type: string;
  /** Event data */
  data: Record<string, unknown>;
  /** ISO-8601 timestamp */
  timestamp: string;
}

/** An intake watcher configuration */
export interface IntakeWatcher {
  /** Unique watcher identifier */
  id: string;
  /** File or event pattern to watch */
  pattern: string;
  /** Callback URL to notify */
  callback_url?: string;
}

/** Payload for submitting an intake event */
export interface IntakeSubmitPayload {
  /** Event type */
  type: string;
  /** Event data */
  data: Record<string, unknown>;
}

/** Zod schema for IntakeEvent */
export const IntakeEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  data: z.record(z.unknown()),
  timestamp: z.string(),
});

/** Zod schema for IntakeWatcher */
export const IntakeWatcherSchema = z.object({
  id: z.string(),
  pattern: z.string(),
  callback_url: z.string().optional(),
});
