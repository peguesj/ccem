/**
 * Configuration file reader utilities.
 *
 * @packageDocumentation
 * @module config/reader
 * @version 1.0.0
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import type { ClaudeConfig, ReadOptions } from './types.js';
import { validateConfig } from './validator.js';

/**
 * Default configuration object.
 *
 * @version 1.0.0
 * @since 1.0.0
 */
const DEFAULT_CONFIG: ClaudeConfig = {
  permissions: [],
  mcpServers: {},
  settings: {}
};

/**
 * Reads a configuration file from disk.
 *
 * @param path - Path to config file
 * @param options - Read options
 * @returns Parsed configuration object
 * @throws Error if file doesn't exist and throwOnMissing is true
 *
 * @example
 * ```typescript
 * const config = await readConfig('/path/.claude/config.json');
 * // Returns: { permissions: [...], mcpServers: {...}, settings: {...} }
 *
 * const configWithDefaults = await readConfig('/path/.claude/config.json', {
 *   mergeDefaults: true,
 *   validate: true
 * });
 * ```
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export async function readConfig(
  path: string,
  options: ReadOptions = {}
): Promise<ClaudeConfig> {
  const {
    throwOnMissing = false,
    validate = false,
    mergeDefaults = false
  } = options;

  // Check if file exists
  if (!existsSync(path)) {
    if (throwOnMissing) {
      throw new Error(`Config file not found: ${path}`);
    }
    return mergeDefaults ? { ...DEFAULT_CONFIG } : {};
  }

  try {
    // Read file contents
    const contents = await readFile(path, 'utf-8');

    // Parse JSON
    const config = JSON.parse(contents) as ClaudeConfig;

    // Merge with defaults if requested
    const finalConfig = mergeDefaults
      ? { ...DEFAULT_CONFIG, ...config }
      : config;

    // Validate if requested
    if (validate) {
      const validation = validateConfig(finalConfig);
      if (!validation.valid) {
        const errorMessages = validation.errors.map(e => e.message).join(', ');
        throw new Error(`Invalid configuration: ${errorMessages}`);
      }
    }

    return finalConfig;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in config file ${path}: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Reads multiple configuration files.
 *
 * @param paths - Array of config file paths
 * @param options - Read options
 * @returns Array of parsed configurations
 *
 * @example
 * ```typescript
 * const configs = await readMultipleConfigs([
 *   '/user/.claude/config.json',
 *   '/project/.claude/config.json'
 * ]);
 * // Returns: [{ permissions: [...] }, { permissions: [...] }]
 * ```
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export async function readMultipleConfigs(
  paths: string[],
  options: ReadOptions = {}
): Promise<ClaudeConfig[]> {
  const configs: ClaudeConfig[] = [];

  for (const path of paths) {
    try {
      const config = await readConfig(path, options);
      configs.push(config);
    } catch (error) {
      // If throwOnMissing is false, skip missing files
      if (options.throwOnMissing || !(error instanceof Error && error.message.includes('not found'))) {
        throw error;
      }
    }
  }

  return configs;
}

/**
 * Reads permissions from a permissions.json file.
 *
 * @param path - Path to permissions file
 * @returns Array of permission strings
 *
 * @example
 * ```typescript
 * const permissions = await readPermissions('/path/.claude/permissions.json');
 * // Returns: ['read:files', 'write:files', 'execute:commands']
 * ```
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export async function readPermissions(path: string): Promise<string[]> {
  if (!existsSync(path)) {
    return [];
  }

  try {
    const contents = await readFile(path, 'utf-8');
    const data = JSON.parse(contents);

    // Handle both array format and object format
    if (Array.isArray(data)) {
      return data;
    }

    if (typeof data === 'object' && data !== null && 'permissions' in data) {
      return Array.isArray(data.permissions) ? data.permissions : [];
    }

    return [];
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in permissions file ${path}: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Reads a configuration field by path.
 *
 * @param config - Configuration object
 * @param fieldPath - Dot-separated field path (e.g., 'settings.theme')
 * @returns Field value or undefined
 *
 * @example
 * ```typescript
 * const theme = readConfigField(config, 'settings.theme');
 * // Returns: 'dark'
 *
 * const serverEnabled = readConfigField(config, 'mcpServers.myServer.enabled');
 * // Returns: true
 * ```
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export function readConfigField(
  config: ClaudeConfig,
  fieldPath: string
): unknown {
  const parts = fieldPath.split('.');
  let current: unknown = config;

  for (const part of parts) {
    if (typeof current !== 'object' || current === null) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

/**
 * Checks if a config file is valid JSON.
 *
 * @param path - Path to config file
 * @returns True if valid JSON
 *
 * @example
 * ```typescript
 * const isValid = await isValidJson('/path/.claude/config.json');
 * // Returns: true
 * ```
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export async function isValidJson(path: string): Promise<boolean> {
  if (!existsSync(path)) {
    return false;
  }

  try {
    const contents = await readFile(path, 'utf-8');
    JSON.parse(contents);
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets the default configuration object.
 *
 * @returns Default configuration
 *
 * @example
 * ```typescript
 * const defaults = getDefaultConfig();
 * // Returns: { permissions: [], mcpServers: {}, settings: {} }
 * ```
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export function getDefaultConfig(): ClaudeConfig {
  return { ...DEFAULT_CONFIG };
}

/**
 * Merges two configurations with the second taking precedence.
 *
 * @param base - Base configuration
 * @param override - Configuration to merge on top
 * @returns Merged configuration
 *
 * @example
 * ```typescript
 * const merged = mergeConfigs(userConfig, projectConfig);
 * // Project config overrides user config
 * ```
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export function mergeConfigs(
  base: ClaudeConfig,
  override: ClaudeConfig
): ClaudeConfig {
  return {
    ...base,
    ...override,
    permissions: [
      ...(base.permissions ?? []),
      ...(override.permissions ?? [])
    ],
    mcpServers: {
      ...(base.mcpServers ?? {}),
      ...(override.mcpServers ?? {})
    },
    settings: {
      ...(base.settings ?? {}),
      ...(override.settings ?? {})
    }
  };
}
