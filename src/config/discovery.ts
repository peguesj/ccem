/**
 * Configuration discovery utilities for finding Claude Code config files.
 *
 * @packageDocumentation
 * @module config/discovery
 * @version 1.0.0
 */

import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import type { ConfigLocation } from './types.js';
import {
  getUserConfigDir,
  getUserConfigPath,
  getUserPermissionsPath,
  getProjectConfigPath,
  getProjectPermissionsPath,
  hasClaudeDirectory,
  configExists
} from './paths.js';

/**
 * Finds all .claude directories starting from a given path.
 * Searches recursively up to a maximum depth.
 *
 * @param startPath - Path to start searching from
 * @param maxDepth - Maximum directory depth to search (default: 5)
 * @returns Array of paths containing .claude directories
 *
 * @example
 * ```typescript
 * const dirs = await findClaudeDirectories('/path/to/project');
 * // Returns: ['/path/to/project/.claude', '/path/to/.claude']
 * ```
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export async function findClaudeDirectories(
  startPath: string,
  maxDepth: number = 5
): Promise<string[]> {
  const found: string[] = [];

  async function search(currentPath: string, depth: number): Promise<void> {
    if (depth > maxDepth) {
      return;
    }

    // Check if current path has .claude directory
    if (hasClaudeDirectory(currentPath)) {
      found.push(join(currentPath, '.claude'));
    }

    // Try to read directory contents
    try {
      const entries = await readdir(currentPath, { withFileTypes: true });

      // Search subdirectories
      const subdirs = entries.filter(entry =>
        entry.isDirectory() &&
        !entry.name.startsWith('.') &&
        entry.name !== 'node_modules'
      );

      for (const subdir of subdirs) {
        const subdirPath = join(currentPath, subdir.name);
        await search(subdirPath, depth + 1);
      }
    } catch (error) {
      // Ignore permission errors and continue
      if ((error as NodeJS.ErrnoException).code !== 'EACCES') {
        // Only log unexpected errors
        // console.error(`Error reading directory ${currentPath}:`, error);
      }
    }
  }

  await search(startPath, 0);
  return found;
}

/**
 * Discovers configuration files starting from a search path.
 * Includes both user-level and project-level configs.
 *
 * @param searchPath - Optional path to start search (defaults to cwd)
 * @returns Array of configuration locations
 *
 * @example
 * ```typescript
 * const configs = await discoverConfigs('/path/to/project');
 * // Returns: [
 * //   { root: '/Users/user', configPath: '/Users/user/.claude/config.json', type: 'user' },
 * //   { root: '/path/to/project', configPath: '/path/to/project/.claude/config.json', type: 'project' }
 * // ]
 * ```
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export async function discoverConfigs(searchPath?: string): Promise<ConfigLocation[]> {
  const locations: ConfigLocation[] = [];
  const startPath = searchPath ?? process.cwd();

  // Always check user config
  const userConfigDir = getUserConfigDir();
  const userConfigPath = getUserConfigPath();
  const userPermissionsPath = getUserPermissionsPath();

  if (configExists(userConfigPath)) {
    const location: ConfigLocation = {
      root: userConfigDir,
      configPath: userConfigPath,
      type: 'user'
    };

    if (configExists(userPermissionsPath)) {
      location.permissionsPath = userPermissionsPath;
    }

    locations.push(location);
  }

  // Find project configs
  const claudeDirs = await findClaudeDirectories(startPath);

  for (const claudeDir of claudeDirs) {
    const projectRoot = claudeDir.replace('/.claude', '');
    const projectConfigPath = getProjectConfigPath(projectRoot);
    const projectPermissionsPath = getProjectPermissionsPath(projectRoot);

    if (configExists(projectConfigPath)) {
      const location: ConfigLocation = {
        root: projectRoot,
        configPath: projectConfigPath,
        type: 'project'
      };

      if (configExists(projectPermissionsPath)) {
        location.permissionsPath = projectPermissionsPath;
      }

      locations.push(location);
    }
  }

  return locations;
}

/**
 * Finds the nearest .claude directory by walking up the directory tree.
 *
 * @param startPath - Path to start searching from (defaults to cwd)
 * @returns Path to nearest .claude directory or null if not found
 *
 * @example
 * ```typescript
 * const nearestConfig = await findNearestConfig();
 * // Returns: '/path/to/project/.claude' or null
 * ```
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export async function findNearestConfig(startPath?: string): Promise<string | null> {
  let currentPath = startPath ?? process.cwd();
  const root = '/';

  while (currentPath !== root) {
    if (hasClaudeDirectory(currentPath)) {
      return join(currentPath, '.claude');
    }

    // Move up one directory
    const parentPath = join(currentPath, '..');

    // Avoid infinite loop if parent is same as current
    if (parentPath === currentPath) {
      break;
    }

    currentPath = parentPath;
  }

  return null;
}

/**
 * Gets configuration location for a specific directory.
 *
 * @param dirPath - Directory path to get config for
 * @param type - Type of config location
 * @returns Configuration location or null if not found
 *
 * @example
 * ```typescript
 * const location = await getConfigLocation('/path/to/project', 'project');
 * // Returns: { root: '/path/to/project', configPath: '...', type: 'project' }
 * ```
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export async function getConfigLocation(
  dirPath: string,
  type: 'user' | 'project'
): Promise<ConfigLocation | null> {
  if (type === 'user') {
    const userConfigDir = getUserConfigDir();
    const userConfigPath = getUserConfigPath();
    const userPermissionsPath = getUserPermissionsPath();

    if (configExists(userConfigPath)) {
      const location: ConfigLocation = {
        root: userConfigDir,
        configPath: userConfigPath,
        type: 'user'
      };

      if (configExists(userPermissionsPath)) {
        location.permissionsPath = userPermissionsPath;
      }

      return location;
    }
  } else {
    const projectConfigPath = getProjectConfigPath(dirPath);
    const projectPermissionsPath = getProjectPermissionsPath(dirPath);

    if (configExists(projectConfigPath)) {
      const location: ConfigLocation = {
        root: dirPath,
        configPath: projectConfigPath,
        type: 'project'
      };

      if (configExists(projectPermissionsPath)) {
        location.permissionsPath = projectPermissionsPath;
      }

      return location;
    }
  }

  return null;
}

/**
 * Checks if a directory contains a valid Claude Code configuration.
 *
 * @param dirPath - Directory path to check
 * @returns True if valid config exists
 *
 * @example
 * ```typescript
 * const isValid = await hasValidConfig('/path/to/project');
 * // Returns: true if config.json exists in .claude directory
 * ```
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export async function hasValidConfig(dirPath: string): Promise<boolean> {
  const claudeDir = join(dirPath, '.claude');
  const configPath = join(claudeDir, 'config.json');

  return existsSync(claudeDir) && existsSync(configPath);
}

/**
 * Lists all configuration files in a .claude directory.
 *
 * @param claudeDir - Path to .claude directory
 * @returns Array of config file names
 *
 * @example
 * ```typescript
 * const files = await listConfigFiles('/path/.claude');
 * // Returns: ['config.json', 'permissions.json']
 * ```
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export async function listConfigFiles(claudeDir: string): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await readdir(claudeDir);

    for (const entry of entries) {
      if (entry.endsWith('.json')) {
        files.push(entry);
      }
    }
  } catch (error) {
    // Return empty array if directory doesn't exist or can't be read
    return [];
  }

  return files;
}
