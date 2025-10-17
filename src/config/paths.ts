/**
 * Path utilities for Claude Code configuration files.
 *
 * @packageDocumentation
 * @module config/paths
 * @version 1.0.0
 */

import { homedir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { existsSync } from 'node:fs';

/**
 * Gets the user configuration directory (~/.claude/).
 *
 * @returns Absolute path to user config directory
 *
 * @example
 * ```typescript
 * const userDir = getUserConfigDir();
 * // Returns: /Users/username/.claude
 * ```
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export function getUserConfigDir(): string {
  return join(homedir(), '.claude');
}

/**
 * Gets the project configuration directory (./.claude/).
 *
 * @param projectPath - Optional project root path (defaults to cwd)
 * @returns Absolute path to project config directory
 *
 * @example
 * ```typescript
 * const projectDir = getProjectConfigDir();
 * // Returns: /path/to/project/.claude
 *
 * const customDir = getProjectConfigDir('/custom/project');
 * // Returns: /custom/project/.claude
 * ```
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export function getProjectConfigDir(projectPath?: string): string {
  const root = projectPath ?? process.cwd();
  return join(root, '.claude');
}

/**
 * Resolves a relative config path to absolute.
 *
 * @param relativePath - Relative path to resolve
 * @param basePath - Optional base path (defaults to cwd)
 * @returns Absolute path
 *
 * @example
 * ```typescript
 * const absPath = resolveConfigPath('./config.json');
 * // Returns: /path/to/cwd/config.json
 *
 * const customPath = resolveConfigPath('config.json', '/base/path');
 * // Returns: /base/path/config.json
 * ```
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export function resolveConfigPath(relativePath: string, basePath?: string): string {
  const base = basePath ?? process.cwd();
  return resolve(base, relativePath);
}

/**
 * Gets the full path to user config.json.
 *
 * @returns Absolute path to user config file
 *
 * @example
 * ```typescript
 * const configPath = getUserConfigPath();
 * // Returns: /Users/username/.claude/config.json
 * ```
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export function getUserConfigPath(): string {
  return join(getUserConfigDir(), 'config.json');
}

/**
 * Gets the full path to project config.json.
 *
 * @param projectPath - Optional project root path (defaults to cwd)
 * @returns Absolute path to project config file
 *
 * @example
 * ```typescript
 * const configPath = getProjectConfigPath();
 * // Returns: /path/to/project/.claude/config.json
 * ```
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export function getProjectConfigPath(projectPath?: string): string {
  return join(getProjectConfigDir(projectPath), 'config.json');
}

/**
 * Gets the full path to user permissions.json.
 *
 * @returns Absolute path to user permissions file
 *
 * @example
 * ```typescript
 * const permPath = getUserPermissionsPath();
 * // Returns: /Users/username/.claude/permissions.json
 * ```
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export function getUserPermissionsPath(): string {
  return join(getUserConfigDir(), 'permissions.json');
}

/**
 * Gets the full path to project permissions.json.
 *
 * @param projectPath - Optional project root path (defaults to cwd)
 * @returns Absolute path to project permissions file
 *
 * @example
 * ```typescript
 * const permPath = getProjectPermissionsPath();
 * // Returns: /path/to/project/.claude/permissions.json
 * ```
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export function getProjectPermissionsPath(projectPath?: string): string {
  return join(getProjectConfigDir(projectPath), 'permissions.json');
}

/**
 * Checks if a .claude directory exists at the given path.
 *
 * @param path - Path to check
 * @returns True if .claude directory exists
 *
 * @example
 * ```typescript
 * const hasConfig = hasClaudeDirectory('/path/to/project');
 * // Returns: true if /path/to/project/.claude exists
 * ```
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export function hasClaudeDirectory(path: string): boolean {
  const claudeDir = join(path, '.claude');
  return existsSync(claudeDir);
}

/**
 * Checks if a config file exists at the given path.
 *
 * @param path - Path to config file
 * @returns True if file exists
 *
 * @example
 * ```typescript
 * const exists = configExists('/path/.claude/config.json');
 * // Returns: true if file exists
 * ```
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export function configExists(path: string): boolean {
  return existsSync(path);
}

/**
 * Gets the parent directory of a path.
 *
 * @param path - Path to get parent of
 * @returns Parent directory path
 *
 * @example
 * ```typescript
 * const parent = getParentDir('/path/to/file.json');
 * // Returns: /path/to
 * ```
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export function getParentDir(path: string): string {
  return dirname(path);
}

/**
 * Normalizes a config path by resolving relative paths and symlinks.
 *
 * @param path - Path to normalize
 * @returns Normalized absolute path
 *
 * @example
 * ```typescript
 * const normalized = normalizePath('./config/../.claude/config.json');
 * // Returns: /absolute/path/.claude/config.json
 * ```
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export function normalizePath(path: string): string {
  return resolve(path);
}
