/**
 * Configuration file writer utilities.
 *
 * @packageDocumentation
 * @module config/writer
 * @version 1.0.0
 */

import { writeFile, rename, mkdir, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import type { ClaudeConfig, WriteOptions } from './types.js';
import { validateConfig } from './validator.js';

/**
 * Writes a configuration object to a file.
 * Uses atomic write (write to temp, then rename).
 *
 * @param path - Path to config file
 * @param config - Configuration to write
 * @param options - Write options
 * @throws Error if validation fails or write fails
 *
 * @example
 * ```typescript
 * await writeConfig('/path/.claude/config.json', config, {
 *   backup: true,
 *   validate: true,
 *   createDirs: true
 * });
 * ```
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export async function writeConfig(
  path: string,
  config: ClaudeConfig,
  options: WriteOptions = {}
): Promise<void> {
  const {
    backup = true,
    validate = true,
    createDirs = true,
    spaces = 2
  } = options;

  // Validate if requested
  if (validate) {
    const validation = validateConfig(config);
    if (!validation.valid) {
      const errorMessages = validation.errors.map(e => e.message).join(', ');
      throw new Error(`Invalid configuration: ${errorMessages}`);
    }
  }

  // Create parent directories if requested
  if (createDirs) {
    const dir = dirname(path);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
  }

  // Create backup if file exists and backup is requested
  if (backup && existsSync(path)) {
    await createBackup(path);
  }

  // Write to temporary file first (atomic write)
  const tempPath = `${path}.tmp`;
  const content = JSON.stringify(config, null, spaces);

  try {
    await writeFile(tempPath, content, 'utf-8');
    await rename(tempPath, path);
  } catch (error) {
    // Clean up temp file if write failed
    if (existsSync(tempPath)) {
      try {
        await rename(tempPath, path);
      } catch {
        // Ignore cleanup errors
      }
    }
    throw error;
  }
}

/**
 * Updates specific fields in a configuration file.
 *
 * @param path - Path to config file
 * @param updates - Partial configuration with updates
 * @param options - Write options
 * @throws Error if file doesn't exist or update fails
 *
 * @example
 * ```typescript
 * await updateConfig('/path/.claude/config.json', {
 *   settings: { theme: 'dark' }
 * });
 * ```
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export async function updateConfig(
  path: string,
  updates: Partial<ClaudeConfig>,
  options: WriteOptions = {}
): Promise<void> {
  if (!existsSync(path)) {
    throw new Error(`Config file not found: ${path}`);
  }

  // Read existing config
  const { readConfig } = await import('./reader.js');
  const existing = await readConfig(path);

  // Merge updates with existing config
  const merged: ClaudeConfig = {
    ...existing,
    ...updates
  };

  if (updates.permissions !== undefined) {
    merged.permissions = updates.permissions;
  } else if (existing.permissions !== undefined) {
    merged.permissions = existing.permissions;
  }

  if (updates.mcpServers !== undefined || existing.mcpServers !== undefined) {
    merged.mcpServers = {
      ...(existing.mcpServers ?? {}),
      ...(updates.mcpServers ?? {})
    };
  }

  if (updates.settings !== undefined || existing.settings !== undefined) {
    merged.settings = {
      ...(existing.settings ?? {}),
      ...(updates.settings ?? {})
    };
  }

  // Write merged config
  await writeConfig(path, merged, options);
}

/**
 * Creates a backup of a configuration file.
 *
 * @param path - Path to config file
 * @returns Path to backup file
 *
 * @example
 * ```typescript
 * const backupPath = await createBackup('/path/.claude/config.json');
 * // Returns: /path/.claude/config.json.backup-1234567890
 * ```
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export async function createBackup(path: string): Promise<string> {
  if (!existsSync(path)) {
    throw new Error(`File not found: ${path}`);
  }

  const timestamp = Date.now();
  const backupPath = `${path}.backup-${timestamp}`;

  await copyFile(path, backupPath);
  return backupPath;
}

/**
 * Writes permissions to a permissions.json file.
 *
 * @param path - Path to permissions file
 * @param permissions - Array of permission strings
 * @param options - Write options
 *
 * @example
 * ```typescript
 * await writePermissions('/path/.claude/permissions.json', [
 *   'read:files',
 *   'write:files'
 * ]);
 * ```
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export async function writePermissions(
  path: string,
  permissions: string[],
  options: WriteOptions = {}
): Promise<void> {
  const {
    backup = true,
    createDirs = true,
    spaces = 2
  } = options;

  // Create parent directories if requested
  if (createDirs) {
    const dir = dirname(path);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }
  }

  // Create backup if file exists
  if (backup && existsSync(path)) {
    await createBackup(path);
  }

  // Write permissions
  const content = JSON.stringify(permissions, null, spaces);
  await writeFile(path, content, 'utf-8');
}

/**
 * Sets a configuration field by path.
 *
 * @param path - Path to config file
 * @param fieldPath - Dot-separated field path (e.g., 'settings.theme')
 * @param value - Value to set
 * @param options - Write options
 *
 * @example
 * ```typescript
 * await setConfigField('/path/.claude/config.json', 'settings.theme', 'dark');
 * await setConfigField('/path/.claude/config.json', 'mcpServers.myServer.enabled', true);
 * ```
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export async function setConfigField(
  path: string,
  fieldPath: string,
  value: unknown,
  options: WriteOptions = {}
): Promise<void> {
  if (!existsSync(path)) {
    throw new Error(`Config file not found: ${path}`);
  }

  // Read existing config
  const { readConfig } = await import('./reader.js');
  const config = await readConfig(path);

  // Set field value
  const parts = fieldPath.split('.');
  let current: Record<string, unknown> = config;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!part) continue;

    if (!(part in current) || typeof current[part] !== 'object' || current[part] === null) {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }

  const lastPart = parts[parts.length - 1];
  if (lastPart) {
    current[lastPart] = value;
  }

  // Write updated config
  await writeConfig(path, config, options);
}

/**
 * Deletes a configuration field by path.
 *
 * @param path - Path to config file
 * @param fieldPath - Dot-separated field path to delete
 * @param options - Write options
 *
 * @example
 * ```typescript
 * await deleteConfigField('/path/.claude/config.json', 'settings.theme');
 * ```
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export async function deleteConfigField(
  path: string,
  fieldPath: string,
  options: WriteOptions = {}
): Promise<void> {
  if (!existsSync(path)) {
    throw new Error(`Config file not found: ${path}`);
  }

  // Read existing config
  const { readConfig } = await import('./reader.js');
  const config = await readConfig(path);

  // Delete field
  const parts = fieldPath.split('.');
  let current: Record<string, unknown> = config;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!part) continue;

    if (!(part in current) || typeof current[part] !== 'object' || current[part] === null) {
      return; // Field doesn't exist, nothing to delete
    }
    current = current[part] as Record<string, unknown>;
  }

  const lastPart = parts[parts.length - 1];
  if (lastPart && lastPart in current) {
    delete current[lastPart];
  }

  // Write updated config
  await writeConfig(path, config, options);
}

/**
 * Adds a permission to a config file.
 *
 * @param path - Path to config file
 * @param permission - Permission string to add
 * @param options - Write options
 *
 * @example
 * ```typescript
 * await addPermission('/path/.claude/config.json', 'read:files');
 * ```
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export async function addPermission(
  path: string,
  permission: string,
  options: WriteOptions = {}
): Promise<void> {
  if (!existsSync(path)) {
    throw new Error(`Config file not found: ${path}`);
  }

  // Read existing config
  const { readConfig } = await import('./reader.js');
  const config = await readConfig(path);

  // Add permission if not already present
  const permissions = config.permissions ?? [];
  if (!permissions.includes(permission)) {
    permissions.push(permission);
  }

  // Write updated config
  await writeConfig(
    path,
    { ...config, permissions },
    options
  );
}

/**
 * Removes a permission from a config file.
 *
 * @param path - Path to config file
 * @param permission - Permission string to remove
 * @param options - Write options
 *
 * @example
 * ```typescript
 * await removePermission('/path/.claude/config.json', 'read:files');
 * ```
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export async function removePermission(
  path: string,
  permission: string,
  options: WriteOptions = {}
): Promise<void> {
  if (!existsSync(path)) {
    throw new Error(`Config file not found: ${path}`);
  }

  // Read existing config
  const { readConfig } = await import('./reader.js');
  const config = await readConfig(path);

  // Remove permission
  const permissions = (config.permissions ?? []).filter(p => p !== permission);

  // Write updated config
  await writeConfig(
    path,
    { ...config, permissions },
    options
  );
}
