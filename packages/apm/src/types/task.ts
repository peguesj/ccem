import { z } from 'zod';

/** Background task status values */
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';

/** Input request status values */
export type InputRequestStatus = 'pending' | 'responded';

/** A background task tracked by APM */
export interface BackgroundTask {
  /** Unique task identifier */
  id: string;
  /** Task name */
  name: string;
  /** Task definition/description */
  definition: string;
  /** Process that invoked this task */
  invoking_process: string;
  /** Project the task belongs to */
  project: string;
  /** Current task status */
  status: TaskStatus;
  /** Process ID if running */
  pid?: number;
  /** Task logs */
  logs?: string;
  /** Runtime in seconds */
  runtime_seconds?: number;
  /** Name of the agent running this task */
  agent_name?: string;
  /** Path to log file */
  log_path?: string;
  /** ISO-8601 creation timestamp */
  created_at: string;
  /** ISO-8601 last update timestamp */
  updated_at: string;
}

/** Payload for creating a background task */
export interface CreateTaskPayload {
  /** Task name */
  name: string;
  /** Task definition */
  definition: string;
  /** Invoking process */
  invoking_process: string;
  /** Project name */
  project: string;
  /** Agent name */
  agent_name?: string;
  /** Log path */
  log_path?: string;
}

/** Payload for updating a background task */
export interface UpdateTaskPayload {
  /** Updated status */
  status?: TaskStatus;
  /** Updated logs */
  logs?: string;
  /** Updated runtime */
  runtime_seconds?: number;
  /** Updated PID */
  pid?: number;
}

/** An input request from a running task */
export interface InputRequest {
  /** Unique request identifier */
  id: string;
  /** Prompt message displayed to the user */
  prompt: string;
  /** Current request status */
  status: InputRequestStatus;
  /** User response if provided */
  response?: string;
}

/** Payload for syncing tasks */
export interface SyncTasksPayload {
  /** Tasks to sync */
  tasks: Partial<BackgroundTask>[];
}

/** Payload for requesting input */
export interface RequestInputPayload {
  /** Prompt message */
  prompt: string;
  /** Associated task ID */
  task_id?: string;
}

/** Payload for responding to an input request */
export interface RespondInputPayload {
  /** Input request ID */
  id: string;
  /** User response */
  response: string;
}

/** Zod schema for TaskStatus */
export const TaskStatusSchema = z.enum(['pending', 'running', 'completed', 'failed']);

/** Zod schema for BackgroundTask */
export const BackgroundTaskSchema = z.object({
  id: z.string(),
  name: z.string(),
  definition: z.string(),
  invoking_process: z.string(),
  project: z.string(),
  status: TaskStatusSchema,
  pid: z.number().optional(),
  logs: z.string().optional(),
  runtime_seconds: z.number().optional(),
  agent_name: z.string().optional(),
  log_path: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

/** Zod schema for InputRequest */
export const InputRequestSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  status: z.enum(['pending', 'responded']),
  response: z.string().optional(),
});
