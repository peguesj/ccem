import { z } from 'zod';

/** An AG-UI protocol event */
export interface AgUiEvent {
  /** Unique event identifier */
  id: string;
  /** Event type (e.g., RUN_STARTED, STEP_STARTED) */
  type: string;
  /** ISO-8601 event timestamp */
  timestamp: string;
  /** Agent that emitted the event */
  agent_id?: string;
  /** Event payload data */
  data?: Record<string, unknown>;
  /** Sequence number for ordering */
  sequence?: number;
}

/** AG-UI agent state */
export interface AgUiState {
  /** Agent identifier */
  agent_id: string;
  /** State key-value store */
  state: Record<string, unknown>;
}

/** AG-UI event router statistics */
export interface AgUiRouterStats {
  /** Total events processed */
  total_events: number;
  /** Current subscriber count */
  subscribers: number;
  /** Active topics */
  topics: string[];
}

/** AG-UI diagnostics information */
export interface AgUiDiagnostics {
  /** Server uptime in seconds */
  uptime: number;
  /** Event throughput per second */
  events_per_second: number;
  /** Active connections */
  connections: number;
  /** Memory usage information */
  memory?: Record<string, unknown>;
}

/** AG-UI migration status */
export interface MigrationStatus {
  /** Current migration version */
  version: string;
  /** Whether migration is complete */
  complete: boolean;
  /** Pending migration steps */
  pending: string[];
}

/** Payload for emitting an AG-UI event */
export interface EmitAgUiEventPayload {
  /** Event type */
  type: string;
  /** Agent ID */
  agent_id?: string;
  /** Event data */
  data?: Record<string, unknown>;
}

/** Parameters for streaming events */
export interface AgUiStreamParams {
  /** Filter by event type */
  types?: string[];
  /** Last event ID for reconnection */
  last_event_id?: string;
}

/** Zod schema for AgUiEvent */
export const AgUiEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  timestamp: z.string(),
  agent_id: z.string().optional(),
  data: z.record(z.unknown()).optional(),
  sequence: z.number().optional(),
});

/** Zod schema for AgUiState */
export const AgUiStateSchema = z.object({
  agent_id: z.string(),
  state: z.record(z.unknown()),
});

/** Zod schema for AgUiRouterStats */
export const AgUiRouterStatsSchema = z.object({
  total_events: z.number(),
  subscribers: z.number(),
  topics: z.array(z.string()),
});

/** Zod schema for AgUiDiagnostics */
export const AgUiDiagnosticsSchema = z.object({
  uptime: z.number(),
  events_per_second: z.number(),
  connections: z.number(),
  memory: z.record(z.unknown()).optional(),
});

/** Zod schema for MigrationStatus */
export const MigrationStatusSchema = z.object({
  version: z.string(),
  complete: z.boolean(),
  pending: z.array(z.string()),
});
