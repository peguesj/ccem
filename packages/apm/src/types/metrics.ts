import { z } from 'zod';

/** Fleet-wide metrics summary */
export interface FleetMetrics {
  /** Total registered agents */
  total_agents: number;
  /** Currently active agents */
  active: number;
  /** Idle agents */
  idle: number;
  /** Agents in error state */
  error: number;
  /** Average health score across all agents */
  avg_health_score: number;
}

/** Metrics for a specific agent */
export interface AgentMetrics {
  /** Agent identifier */
  agent_id: string;
  /** Agent uptime in seconds */
  uptime: number;
  /** Total heartbeat count */
  heartbeat_count: number;
  /** Error rate (0-1) */
  error_rate: number;
}

/** SLO status values */
export type SLOStatus = 'ok' | 'at_risk' | 'breached';

/** A Service Level Objective */
export interface SLO {
  /** SLO name */
  name: string;
  /** Target value (0-100) */
  target: number;
  /** Current measured value */
  current: number;
  /** SLO status */
  status: SLOStatus;
  /** Remaining error budget (0-100) */
  error_budget_remaining: number;
}

/** Alert severity values */
export type AlertSeverity = 'info' | 'warning' | 'critical';

/** Alert comparator values */
export type AlertComparator = 'gt' | 'gte' | 'lt' | 'lte' | 'eq';

/** An alert triggered by a metric threshold breach */
export interface Alert {
  /** Unique alert identifier */
  id: string;
  /** Associated alert rule ID */
  rule_id: string;
  /** Alert severity */
  severity: AlertSeverity;
  /** Metric value that triggered the alert */
  value: number;
  /** ISO-8601 timestamp when the alert was triggered */
  timestamp: string;
  /** Whether the alert has been acknowledged */
  acknowledged: boolean;
}

/** An alert rule configuration */
export interface AlertRule {
  /** Unique rule identifier */
  id: string;
  /** Human-readable rule name */
  name: string;
  /** Metric to monitor */
  metric: string;
  /** Threshold value */
  threshold: number;
  /** Comparison operator */
  comparator: AlertComparator;
  /** Alert severity when triggered */
  severity: AlertSeverity;
  /** Whether the rule is enabled */
  enabled: boolean;
  /** Optional scope filter */
  scope?: string;
  /** Time window in seconds */
  window_s?: number;
  /** Number of consecutive breaches before alerting */
  consecutive_breaches?: number;
}

/** Payload for creating an alert rule */
export interface CreateAlertRulePayload {
  /** Rule name */
  name: string;
  /** Metric to monitor */
  metric: string;
  /** Threshold value */
  threshold: number;
  /** Comparison operator */
  comparator: AlertComparator;
  /** Alert severity */
  severity: AlertSeverity;
  /** Whether the rule starts enabled */
  enabled?: boolean;
  /** Scope filter */
  scope?: string;
  /** Time window in seconds */
  window_s?: number;
  /** Consecutive breaches count */
  consecutive_breaches?: number;
}

/** Query parameters for listing alerts */
export interface AlertListParams {
  /** Filter by severity */
  severity?: AlertSeverity;
  /** Filter acknowledged state */
  acknowledged?: boolean;
  /** Limit results */
  limit?: number;
}

/** Query parameters for agent metrics */
export interface AgentMetricsParams {
  /** Time range start (ISO-8601) */
  from?: string;
  /** Time range end (ISO-8601) */
  to?: string;
}

/** Zod schema for FleetMetrics */
export const FleetMetricsSchema = z.object({
  total_agents: z.number(),
  active: z.number(),
  idle: z.number(),
  error: z.number(),
  avg_health_score: z.number(),
});

/** Zod schema for AgentMetrics */
export const AgentMetricsSchema = z.object({
  agent_id: z.string(),
  uptime: z.number(),
  heartbeat_count: z.number(),
  error_rate: z.number(),
});

/** Zod schema for SLO */
export const SLOSchema = z.object({
  name: z.string(),
  target: z.number(),
  current: z.number(),
  status: z.enum(['ok', 'at_risk', 'breached']),
  error_budget_remaining: z.number(),
});

/** Zod schema for Alert */
export const AlertSchema = z.object({
  id: z.string(),
  rule_id: z.string(),
  severity: z.enum(['info', 'warning', 'critical']),
  value: z.number(),
  timestamp: z.string(),
  acknowledged: z.boolean(),
});

/** Zod schema for AlertRule */
export const AlertRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  metric: z.string(),
  threshold: z.number(),
  comparator: z.enum(['gt', 'gte', 'lt', 'lte', 'eq']),
  severity: z.enum(['info', 'warning', 'critical']),
  enabled: z.boolean(),
  scope: z.string().optional(),
  window_s: z.number().optional(),
  consecutive_breaches: z.number().optional(),
});
