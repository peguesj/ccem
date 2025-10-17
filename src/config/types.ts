/**
 * Configuration management types and interfaces.
 *
 * @packageDocumentation
 * @module config/types
 * @version 1.0.0
 */

/**
 * Location type for configuration files.
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export type ConfigLocationType = 'user' | 'project';

/**
 * Configuration location interface describing where a config file is located.
 *
 * @interface ConfigLocation
 * @version 1.0.0
 * @since 1.0.0
 */
export interface ConfigLocation {
  /** Root directory containing .claude/ */
  root: string;
  /** Full path to config.json */
  configPath: string;
  /** Full path to permissions.json if exists */
  permissionsPath?: string;
  /** Type of configuration location */
  type: ConfigLocationType;
}

/**
 * MCP server configuration interface.
 *
 * @interface McpServerConfig
 * @version 1.0.0
 * @since 1.0.0
 */
export interface McpServerConfig {
  /** Whether the server is enabled */
  enabled: boolean;
  /** Command to run the server */
  command?: string;
  /** Command arguments */
  args?: string[];
  /** Environment variables */
  env?: Record<string, string>;
  /** Additional configuration properties */
  [key: string]: unknown;
}

/**
 * Claude Code configuration interface.
 *
 * @interface ClaudeConfig
 * @version 1.0.0
 * @since 1.0.0
 */
export interface ClaudeConfig {
  /** Permission strings */
  permissions?: string[];
  /** MCP server configurations */
  mcpServers?: Record<string, McpServerConfig>;
  /** Settings object */
  settings?: Record<string, unknown>;
  /** Additional configuration properties */
  [key: string]: unknown;
}

/**
 * Configuration diff change type.
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export type ConfigChangeType = 'added' | 'removed' | 'modified';

/**
 * Configuration change detail.
 *
 * @interface ConfigChange
 * @version 1.0.0
 * @since 1.0.0
 */
export interface ConfigChange {
  /** Path to the changed field */
  path: string;
  /** Type of change */
  type: ConfigChangeType;
  /** Value before change (for modified and removed) */
  before?: unknown;
  /** Value after change (for modified and added) */
  after?: unknown;
}

/**
 * Configuration diff result.
 *
 * @interface ConfigDiff
 * @version 1.0.0
 * @since 1.0.0
 */
export interface ConfigDiff {
  /** Fields added in second config */
  added: string[];
  /** Fields removed from first config */
  removed: string[];
  /** Fields modified between configs */
  modified: ConfigChange[];
  /** Whether the configs are identical */
  identical: boolean;
}

/**
 * Configuration validation error interface.
 *
 * @interface ConfigValidationError
 * @version 1.0.0
 * @since 1.0.0
 */
export interface ConfigValidationError {
  /** Path to the invalid field */
  path: string;
  /** Error message */
  message: string;
  /** Expected value or type */
  expected?: string;
  /** Actual value received */
  actual?: unknown;
}

/**
 * Configuration validation result.
 *
 * @interface ConfigValidationResult
 * @version 1.0.0
 * @since 1.0.0
 */
export interface ConfigValidationResult {
  /** Whether the config is valid */
  valid: boolean;
  /** Validation errors if invalid */
  errors: ConfigValidationError[];
  /** Warnings (non-critical issues) */
  warnings: string[];
}

/**
 * Read options for config files.
 *
 * @interface ReadOptions
 * @version 1.0.0
 * @since 1.0.0
 */
export interface ReadOptions {
  /** Whether to throw on missing files */
  throwOnMissing?: boolean;
  /** Whether to validate after reading */
  validate?: boolean;
  /** Whether to merge with defaults */
  mergeDefaults?: boolean;
}

/**
 * Write options for config files.
 *
 * @interface WriteOptions
 * @version 1.0.0
 * @since 1.0.0
 */
export interface WriteOptions {
  /** Whether to create backup before writing */
  backup?: boolean;
  /** Whether to validate before writing */
  validate?: boolean;
  /** Whether to create parent directories */
  createDirs?: boolean;
  /** Number of spaces for JSON formatting (default: 2) */
  spaces?: number;
}
