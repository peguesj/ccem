import { z } from 'zod';

/** A managed environment */
export interface Environment {
  /** Environment name */
  name: string;
  /** Filesystem path */
  path: string;
  /** Environment status */
  status: string;
  /** Active sessions in this environment */
  sessions?: string[];
}

/** Result of executing a command in an environment */
export interface ExecResult {
  /** Standard output */
  stdout: string;
  /** Standard error */
  stderr: string;
  /** Process exit code */
  exit_code: number;
}

/** Payload for executing a command in an environment */
export interface ExecPayload {
  /** Command to execute */
  command: string;
  /** Arguments to pass */
  args?: string[];
  /** Working directory override */
  cwd?: string;
}

/** Zod schema for Environment */
export const EnvironmentSchema = z.object({
  name: z.string(),
  path: z.string(),
  status: z.string(),
  sessions: z.array(z.string()).optional(),
});

/** Zod schema for ExecResult */
export const ExecResultSchema = z.object({
  stdout: z.string(),
  stderr: z.string(),
  exit_code: z.number(),
});
