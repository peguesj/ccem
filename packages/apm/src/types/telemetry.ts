import { z } from 'zod';

/** A single telemetry data bucket */
export interface TelemetryBucket {
  /** ISO-8601 timestamp for this bucket */
  timestamp: string;
  /** Tasks started in this bucket */
  started: number;
  /** Tasks completed in this bucket */
  completed: number;
  /** Tasks failed in this bucket */
  failed: number;
  /** Active tasks at this point */
  active: number;
}

/** Telemetry summary statistics */
export interface TelemetrySummary {
  /** Total tasks started */
  total_started: number;
  /** Total tasks completed */
  total_completed: number;
  /** Total tasks failed */
  total_failed: number;
  /** Currently active tasks */
  active_now: number;
}

/** Telemetry response with buckets and summary */
export interface TelemetryResponse {
  /** Time-series buckets (12 x 5-min, last hour) */
  buckets: TelemetryBucket[];
  /** Summary statistics */
  summary: TelemetrySummary;
}

/** Zod schema for TelemetryBucket */
export const TelemetryBucketSchema = z.object({
  timestamp: z.string(),
  started: z.number(),
  completed: z.number(),
  failed: z.number(),
  active: z.number(),
});

/** Zod schema for TelemetrySummary */
export const TelemetrySummarySchema = z.object({
  total_started: z.number(),
  total_completed: z.number(),
  total_failed: z.number(),
  active_now: z.number(),
});

/** Zod schema for TelemetryResponse */
export const TelemetryResponseSchema = z.object({
  buckets: z.array(TelemetryBucketSchema),
  summary: TelemetrySummarySchema,
});
