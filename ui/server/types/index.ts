/**
 * Type definitions for CCEM UI Server
 */

// Session Types
export type SessionStatus = 'running' | 'paused' | 'complete' | 'error' | 'initializing';

export interface Session {
  id: string;
  status: SessionStatus;
  created_at: string;
  updated_at: string;
  agents_count: number;
  tasks_completed: number;
  tasks_total: number;
  progress: number;
  name?: string;
  description?: string;
}

export interface SessionDetail extends Session {
  agents: Agent[];
  tasks: Task[];
  files_modified: string[];
  logs: LogEntry[];
}

export interface CreateSessionRequest {
  name: string;
  description?: string;
  agents: string[];
  auto_start?: boolean;
}

export interface CreateSessionResponse {
  id: string;
  status: SessionStatus;
  websocket_url: string;
  stream_url: string;
}

// Agent Types
export type AgentStatus = 'running' | 'idle' | 'complete' | 'error';

export interface Agent {
  id: string;
  type: string;
  status: AgentStatus;
  session_id?: string;
  current_task?: string;
  progress?: number;
  tasks_completed?: number;
  uptime_seconds?: number;
  performance?: {
    avg_task_duration: number;
    success_rate: number;
  };
}

export interface AgentDetail {
  id: string;
  type: string;
  status: AgentStatus;
  session_id?: string;
  current_task?: TaskDetail;
  tasks_completed?: number;
  uptime_seconds?: number;
  performance?: {
    avg_task_duration: number;
    success_rate: number;
  };
  completed_tasks: CompletedTask[];
  metrics: AgentMetrics;
}

export interface AgentMetrics {
  total_tasks: number;
  success_count: number;
  error_count: number;
  avg_duration: number;
  cpu_usage: number;
  memory_mb: number;
}

export interface CompletedTask {
  id: string;
  description: string;
  completed_at: string;
  duration_seconds: number;
  status: 'success' | 'error';
}

// Task Types
export type TaskStatus = 'queued' | 'assigned' | 'in_progress' | 'complete' | 'failed';
export type TaskPriority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  description: string;
  status: TaskStatus;
  assigned_to?: string;
  progress?: number;
}

export interface TaskDetail extends Task {
  started_at?: string;
  completed_at?: string;
  duration_seconds?: number;
  priority?: TaskPriority;
  params?: Record<string, unknown>;
}

export interface AssignTaskRequest {
  task_id: string;
  description: string;
  priority: TaskPriority;
  params?: Record<string, unknown>;
}

export interface AssignTaskResponse {
  agent_id: string;
  task_id: string;
  status: 'accepted' | 'rejected';
  estimated_duration?: number;
  queue_position?: number;
}

// Log Types
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  agent_id?: string;
  source?: string;
  message: string;
  context?: Record<string, unknown>;
}

// WebSocket Message Types
export type WSClientMessageType = 'subscribe' | 'agent_command' | 'task_assign';
export type WSServerMessageType = 'agent_update' | 'task_update' | 'log_entry' | 'file_change';

export interface WSClientMessage {
  type: WSClientMessageType;
  [key: string]: unknown;
}

export interface WSSubscribeMessage extends WSClientMessage {
  type: 'subscribe';
  channels: string[];
}

export interface WSAgentCommandMessage extends WSClientMessage {
  type: 'agent_command';
  agent_id: string;
  command: 'pause' | 'resume' | 'cancel';
  params?: Record<string, unknown>;
}

export interface WSTaskAssignMessage extends WSClientMessage {
  type: 'task_assign';
  task_id: string;
  agent_id: string;
}

export interface WSServerMessage {
  type: WSServerMessageType;
  data: unknown;
  timestamp: string;
}

export interface WSAgentUpdateMessage extends WSServerMessage {
  type: 'agent_update';
  data: {
    agent_id: string;
    status: AgentStatus;
    progress: number;
    message: string;
  };
}

export interface WSTaskUpdateMessage extends WSServerMessage {
  type: 'task_update';
  data: {
    task_id: string;
    status: TaskStatus;
    progress: number;
    agent_id?: string;
  };
}

export interface WSLogEntryMessage extends WSServerMessage {
  type: 'log_entry';
  data: LogEntry;
}

export interface WSFileChangeMessage extends WSServerMessage {
  type: 'file_change';
  data: {
    path: string;
    operation: 'created' | 'modified' | 'deleted' | 'renamed';
    agent_id?: string;
  };
}

// SSE Event Types
export type SSEEventType =
  | 'agent_started'
  | 'agent_idle'
  | 'agent_running'
  | 'agent_complete'
  | 'agent_error'
  | 'task_queued'
  | 'task_started'
  | 'task_progress'
  | 'task_complete'
  | 'task_failed'
  | 'file_created'
  | 'file_modified'
  | 'file_deleted'
  | 'session_started'
  | 'session_complete'
  | 'session_error';

export interface SSEEvent {
  event: SSEEventType;
  data: unknown;
}

// Error Response Types
export interface ErrorResponse {
  error: string;
  message: string;
  details?: Record<string, unknown>;
  request_id?: string;
  session_id?: string;
  retry_after?: number;
}

// API Response Types
export interface ListSessionsResponse {
  sessions: Session[];
  total: number;
}

export interface ListAgentsResponse {
  agents: Agent[];
  total: number;
  running: number;
  idle: number;
}
