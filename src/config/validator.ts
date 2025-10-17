/**
 * Configuration validation utilities.
 *
 * @packageDocumentation
 * @module config/validator
 * @version 1.0.0
 */

import type {
  ClaudeConfig,
  ConfigValidationResult,
  ConfigValidationError,
  McpServerConfig
} from './types.js';

/**
 * Validates a Claude Code configuration object.
 *
 * @param config - Configuration to validate
 * @returns Validation result with errors and warnings
 *
 * @example
 * ```typescript
 * const result = validateConfig(config);
 * if (!result.valid) {
 *   console.error('Invalid config:', result.errors);
 * }
 * ```
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export function validateConfig(config: ClaudeConfig): ConfigValidationResult {
  const errors: ConfigValidationError[] = [];
  const warnings: string[] = [];

  // Validate config is an object
  if (typeof config !== 'object' || config === null) {
    errors.push({
      path: 'root',
      message: 'Configuration must be an object',
      expected: 'object',
      actual: typeof config
    });
    return { valid: false, errors, warnings };
  }

  // Validate permissions
  if ('permissions' in config) {
    const permErrors = validatePermissions(config.permissions);
    errors.push(...permErrors);
  }

  // Validate MCP servers
  if ('mcpServers' in config) {
    const mcpErrors = validateMcpServers(config.mcpServers);
    errors.push(...mcpErrors);
  }

  // Validate settings
  if ('settings' in config) {
    const settingsErrors = validateSettings(config.settings);
    errors.push(...settingsErrors);
  }

  // Add warnings for unknown top-level fields
  const knownFields = ['permissions', 'mcpServers', 'settings'];
  const unknownFields = Object.keys(config).filter(key => !knownFields.includes(key));

  for (const field of unknownFields) {
    warnings.push(`Unknown configuration field: ${field}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validates permissions array.
 *
 * @param permissions - Permissions to validate
 * @returns Array of validation errors
 *
 * @version 1.0.0
 * @since 1.0.0
 */
function validatePermissions(permissions: unknown): ConfigValidationError[] {
  const errors: ConfigValidationError[] = [];

  if (!Array.isArray(permissions)) {
    errors.push({
      path: 'permissions',
      message: 'Permissions must be an array',
      expected: 'array',
      actual: typeof permissions
    });
    return errors;
  }

  permissions.forEach((perm, index) => {
    if (typeof perm !== 'string') {
      errors.push({
        path: `permissions[${index}]`,
        message: 'Permission must be a string',
        expected: 'string',
        actual: typeof perm
      });
    } else if (perm.trim() === '') {
      errors.push({
        path: `permissions[${index}]`,
        message: 'Permission cannot be empty',
        expected: 'non-empty string',
        actual: perm
      });
    }
  });

  return errors;
}

/**
 * Validates MCP servers configuration.
 *
 * @param mcpServers - MCP servers to validate
 * @returns Array of validation errors
 *
 * @version 1.0.0
 * @since 1.0.0
 */
function validateMcpServers(mcpServers: unknown): ConfigValidationError[] {
  const errors: ConfigValidationError[] = [];

  if (typeof mcpServers !== 'object' || mcpServers === null || Array.isArray(mcpServers)) {
    errors.push({
      path: 'mcpServers',
      message: 'MCP servers must be an object',
      expected: 'object',
      actual: Array.isArray(mcpServers) ? 'array' : typeof mcpServers
    });
    return errors;
  }

  const servers = mcpServers as Record<string, unknown>;

  for (const [name, config] of Object.entries(servers)) {
    const serverErrors = validateMcpServerConfig(name, config);
    errors.push(...serverErrors);
  }

  return errors;
}

/**
 * Validates a single MCP server configuration.
 *
 * @param name - Server name
 * @param config - Server configuration
 * @returns Array of validation errors
 *
 * @version 1.0.0
 * @since 1.0.0
 */
function validateMcpServerConfig(
  name: string,
  config: unknown
): ConfigValidationError[] {
  const errors: ConfigValidationError[] = [];
  const basePath = `mcpServers.${name}`;

  if (typeof config !== 'object' || config === null || Array.isArray(config)) {
    errors.push({
      path: basePath,
      message: 'MCP server configuration must be an object',
      expected: 'object',
      actual: Array.isArray(config) ? 'array' : typeof config
    });
    return errors;
  }

  const serverConfig = config as Partial<McpServerConfig>;

  // Validate required 'enabled' field
  if (!('enabled' in serverConfig)) {
    errors.push({
      path: `${basePath}.enabled`,
      message: 'MCP server must have "enabled" field',
      expected: 'boolean',
      actual: undefined
    });
  } else if (typeof serverConfig.enabled !== 'boolean') {
    errors.push({
      path: `${basePath}.enabled`,
      message: 'MCP server "enabled" must be a boolean',
      expected: 'boolean',
      actual: typeof serverConfig.enabled
    });
  }

  // Validate optional 'command' field
  if ('command' in serverConfig && typeof serverConfig.command !== 'string') {
    errors.push({
      path: `${basePath}.command`,
      message: 'MCP server "command" must be a string',
      expected: 'string',
      actual: typeof serverConfig.command
    });
  }

  // Validate optional 'args' field
  if ('args' in serverConfig) {
    if (!Array.isArray(serverConfig.args)) {
      errors.push({
        path: `${basePath}.args`,
        message: 'MCP server "args" must be an array',
        expected: 'array',
        actual: typeof serverConfig.args
      });
    } else {
      serverConfig.args.forEach((arg, index) => {
        if (typeof arg !== 'string') {
          errors.push({
            path: `${basePath}.args[${index}]`,
            message: 'MCP server arg must be a string',
            expected: 'string',
            actual: typeof arg
          });
        }
      });
    }
  }

  // Validate optional 'env' field
  if ('env' in serverConfig) {
    if (typeof serverConfig.env !== 'object' || serverConfig.env === null || Array.isArray(serverConfig.env)) {
      errors.push({
        path: `${basePath}.env`,
        message: 'MCP server "env" must be an object',
        expected: 'object',
        actual: Array.isArray(serverConfig.env) ? 'array' : typeof serverConfig.env
      });
    } else {
      const env = serverConfig.env as Record<string, unknown>;
      for (const [key, value] of Object.entries(env)) {
        if (typeof value !== 'string') {
          errors.push({
            path: `${basePath}.env.${key}`,
            message: 'Environment variable must be a string',
            expected: 'string',
            actual: typeof value
          });
        }
      }
    }
  }

  return errors;
}

/**
 * Validates settings object.
 *
 * @param settings - Settings to validate
 * @returns Array of validation errors
 *
 * @version 1.0.0
 * @since 1.0.0
 */
function validateSettings(settings: unknown): ConfigValidationError[] {
  const errors: ConfigValidationError[] = [];

  if (typeof settings !== 'object' || settings === null || Array.isArray(settings)) {
    errors.push({
      path: 'settings',
      message: 'Settings must be an object',
      expected: 'object',
      actual: Array.isArray(settings) ? 'array' : typeof settings
    });
    return errors;
  }

  // Settings can contain arbitrary key-value pairs
  // No specific validation needed beyond ensuring it's an object

  return errors;
}

/**
 * Validates that a permission string is in the correct format.
 *
 * @param permission - Permission string to validate
 * @returns True if valid format
 *
 * @example
 * ```typescript
 * isValidPermission('read:files'); // true
 * isValidPermission('write:*'); // true
 * isValidPermission('invalid'); // false (no colon)
 * ```
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export function isValidPermission(permission: string): boolean {
  // Basic format: action:resource
  // More specific validation could be added here
  return /^[a-z]+:[a-z*]+$/i.test(permission) || permission === '*';
}

/**
 * Validates that an MCP server name is valid.
 *
 * @param name - Server name to validate
 * @returns True if valid name
 *
 * @example
 * ```typescript
 * isValidServerName('my-server'); // true
 * isValidServerName('server_123'); // true
 * isValidServerName('invalid@name'); // false
 * ```
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export function isValidServerName(name: string): boolean {
  // Server names should be alphanumeric with hyphens/underscores
  return /^[a-z0-9_-]+$/i.test(name);
}

/**
 * Checks if a configuration has required fields.
 *
 * @param config - Configuration to check
 * @returns True if all required fields are present
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export function hasRequiredFields(config: ClaudeConfig): boolean {
  // All fields are technically optional, but we expect at least one
  return (
    ('permissions' in config && Array.isArray(config.permissions)) ||
    ('mcpServers' in config && typeof config.mcpServers === 'object') ||
    ('settings' in config && typeof config.settings === 'object')
  );
}

/**
 * Validates configuration structure deeply.
 *
 * @param config - Configuration to validate
 * @returns True if structure is valid
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export function isValidConfigStructure(config: unknown): config is ClaudeConfig {
  if (typeof config !== 'object' || config === null) {
    return false;
  }

  const result = validateConfig(config as ClaudeConfig);
  return result.valid;
}
