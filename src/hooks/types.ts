/**
 * Type definitions for CCEM Hook System
 */

export interface HookContext {
  /** User message/prompt */
  userMessage: string;
  /** Assistant response */
  assistantResponse?: string;
  /** Tools used during execution */
  toolsUsed?: string[];
  /** Project identifier */
  project: string;
  /** Timestamp */
  timestamp: Date;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

export interface ToolHookContext extends HookContext {
  /** Tool name */
  tool: string;
  /** Tool parameters */
  params: Record<string, any>;
  /** Tool result */
  result?: any;
}

export interface ErrorHookContext extends HookContext {
  /** Error object */
  error: Error;
  /** Execution context when error occurred */
  executionContext?: Record<string, any>;
}

export interface HookHandler {
  (context: HookContext): Promise<any>;
}

export interface ServerConfig {
  /** Server name/identifier */
  name: string;
  /** Server base URL */
  url: string;
  /** Authentication configuration */
  auth: {
    type: 'bearer' | 'jwt' | 'api-key' | 'none';
    tokenEnv?: string;
  };
  /** Retry configuration */
  retry?: {
    maxAttempts: number;
    backoff: 'linear' | 'exponential';
    initialDelayMs?: number;
  };
  /** Request timeout in milliseconds */
  timeoutMs?: number;
  /** Enable/disable server */
  enabled?: boolean;
}

export interface HookConfig {
  /** Hook name */
  name: string;
  /** Enable/disable hook */
  enabled: boolean;
  /** Path to hook handler */
  handler: string;
  /** Target servers for submission */
  servers: string[];
  /** Execute hook asynchronously */
  async: boolean;
  /** Hook type */
  type: 'pre-execution' | 'post-execution' | 'tool' | 'error';
  /** Tool names to trigger on (for tool hooks) */
  tools?: string[];
}

export interface HookRegistry {
  hooks: {
    'pre-execution': HookConfig[];
    'post-execution': HookConfig[];
    'tools': HookConfig[];
    'errors': HookConfig[];
  };
}

export interface ServerRegistry {
  servers: Record<string, ServerConfig>;
}

export interface HookSubmissionResult {
  success: boolean;
  server: string;
  statusCode?: number;
  responseData?: any;
  error?: string;
}

export interface HookExecutionResult {
  hookName: string;
  success: boolean;
  submissions: HookSubmissionResult[];
  executionTimeMs: number;
  error?: string;
}
