import { z } from 'zod';

/** A2A envelope type values */
export type A2AEnvelopeType = 'request' | 'reply' | 'broadcast' | 'fan_out';

/** An agent-to-agent communication envelope */
export interface A2AEnvelope {
  /** Unique envelope identifier */
  id: string;
  /** Sender agent ID */
  from: string;
  /** Recipient agent ID */
  to: string;
  /** Message type */
  type: A2AEnvelopeType;
  /** Message payload */
  payload: Record<string, unknown>;
  /** Correlation ID for request/reply chains */
  correlation_id?: string;
  /** Time-to-live in seconds */
  ttl?: number;
  /** ISO-8601 creation timestamp */
  created_at: string;
}

/** A2A communication statistics */
export interface A2AStats {
  /** Total messages sent */
  total_sent: number;
  /** Total messages delivered */
  total_delivered: number;
  /** Total expired messages */
  total_expired: number;
  /** Queue depths per agent */
  queue_depths: Record<string, number>;
}

/** Payload for sending an A2A message */
export interface A2ASendPayload {
  /** Recipient agent ID */
  to: string;
  /** Message type */
  type: A2AEnvelopeType;
  /** Message payload */
  payload: Record<string, unknown>;
  /** Correlation ID */
  correlation_id?: string;
  /** Time-to-live in seconds */
  ttl?: number;
}

/** Payload for acknowledging an A2A message */
export interface A2AAckPayload {
  /** Envelope ID to acknowledge */
  id: string;
  /** Agent ID acknowledging */
  agent_id: string;
}

/** Payload for broadcasting an A2A message */
export interface A2ABroadcastPayload {
  /** Message payload */
  payload: Record<string, unknown>;
  /** Message type */
  type?: A2AEnvelopeType;
  /** Time-to-live in seconds */
  ttl?: number;
}

/** Payload for fan-out A2A message */
export interface A2AFanOutPayload {
  /** Target agent IDs */
  targets: string[];
  /** Message payload */
  payload: Record<string, unknown>;
  /** Message type */
  type?: A2AEnvelopeType;
  /** Time-to-live in seconds */
  ttl?: number;
}

/** Zod schema for A2AEnvelopeType */
export const A2AEnvelopeTypeSchema = z.enum(['request', 'reply', 'broadcast', 'fan_out']);

/** Zod schema for A2AEnvelope */
export const A2AEnvelopeSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  type: A2AEnvelopeTypeSchema,
  payload: z.record(z.unknown()),
  correlation_id: z.string().optional(),
  ttl: z.number().optional(),
  created_at: z.string(),
});

/** Zod schema for A2AStats */
export const A2AStatsSchema = z.object({
  total_sent: z.number(),
  total_delivered: z.number(),
  total_expired: z.number(),
  queue_depths: z.record(z.number()),
});
