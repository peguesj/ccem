/**
 * Configuration comparison utilities.
 *
 * @packageDocumentation
 * @module config/compare
 * @version 1.0.0
 */

import type { ClaudeConfig, ConfigDiff, ConfigChange } from './types.js';

/**
 * Compares two configuration objects and returns differences.
 *
 * @param config1 - First configuration
 * @param config2 - Second configuration
 * @returns Configuration diff showing changes
 *
 * @example
 * ```typescript
 * const diff = compareConfigs(userConfig, projectConfig);
 * if (!diff.identical) {
 *   console.log('Added:', diff.added);
 *   console.log('Removed:', diff.removed);
 *   console.log('Modified:', diff.modified);
 * }
 * ```
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export function compareConfigs(
  config1: ClaudeConfig,
  config2: ClaudeConfig
): ConfigDiff {
  const added: string[] = [];
  const removed: string[] = [];
  const modified: ConfigChange[] = [];

  // Compare permissions
  const permChanges = comparePermissions(
    config1.permissions ?? [],
    config2.permissions ?? []
  );
  added.push(...permChanges.added.map(p => `permissions.${p}`));
  removed.push(...permChanges.removed.map(p => `permissions.${p}`));

  // Compare MCP servers
  const mcpChanges = compareMcpServers(
    config1.mcpServers ?? {},
    config2.mcpServers ?? {}
  );
  added.push(...mcpChanges.added);
  removed.push(...mcpChanges.removed);
  modified.push(...mcpChanges.modified);

  // Compare settings
  const settingsChanges = compareSettings(
    config1.settings ?? {},
    config2.settings ?? {}
  );
  added.push(...settingsChanges.added);
  removed.push(...settingsChanges.removed);
  modified.push(...settingsChanges.modified);

  // Compare other top-level fields
  const knownFields = ['permissions', 'mcpServers', 'settings'];
  const allKeys = new Set([
    ...Object.keys(config1).filter(k => !knownFields.includes(k)),
    ...Object.keys(config2).filter(k => !knownFields.includes(k))
  ]);

  Array.from(allKeys).forEach(key => {
    const val1 = config1[key];
    const val2 = config2[key];

    if (!(key in config1)) {
      added.push(key);
    } else if (!(key in config2)) {
      removed.push(key);
    } else if (JSON.stringify(val1) !== JSON.stringify(val2)) {
      modified.push({
        path: key,
        type: 'modified',
        before: val1,
        after: val2
      });
    }
  });

  const identical = added.length === 0 && removed.length === 0 && modified.length === 0;

  return {
    added,
    removed,
    modified,
    identical
  };
}

/**
 * Compares permissions arrays.
 *
 * @param perms1 - First permissions array
 * @param perms2 - Second permissions array
 * @returns Added and removed permissions
 *
 * @version 1.0.0
 * @since 1.0.0
 */
function comparePermissions(
  perms1: string[],
  perms2: string[]
): { added: string[]; removed: string[] } {
  const set1 = new Set(perms1);
  const set2 = new Set(perms2);

  const added = perms2.filter(p => !set1.has(p));
  const removed = perms1.filter(p => !set2.has(p));

  return { added, removed };
}

/**
 * Compares MCP server configurations.
 *
 * @param servers1 - First MCP servers config
 * @param servers2 - Second MCP servers config
 * @returns Added, removed, and modified servers
 *
 * @version 1.0.0
 * @since 1.0.0
 */
function compareMcpServers(
  servers1: Record<string, unknown>,
  servers2: Record<string, unknown>
): { added: string[]; removed: string[]; modified: ConfigChange[] } {
  const added: string[] = [];
  const removed: string[] = [];
  const modified: ConfigChange[] = [];

  const allServers = new Set([
    ...Object.keys(servers1),
    ...Object.keys(servers2)
  ]);

  Array.from(allServers).forEach(server => {
    const config1 = servers1[server];
    const config2 = servers2[server];

    if (!(server in servers1)) {
      added.push(`mcpServers.${server}`);
    } else if (!(server in servers2)) {
      removed.push(`mcpServers.${server}`);
    } else if (JSON.stringify(config1) !== JSON.stringify(config2)) {
      // Compare nested properties
      const serverChanges = compareObjects(
        config1 as Record<string, unknown>,
        config2 as Record<string, unknown>,
        `mcpServers.${server}`
      );
      modified.push(...serverChanges);
    }
  });

  return { added, removed, modified };
}

/**
 * Compares settings objects.
 *
 * @param settings1 - First settings object
 * @param settings2 - Second settings object
 * @returns Added, removed, and modified settings
 *
 * @version 1.0.0
 * @since 1.0.0
 */
function compareSettings(
  settings1: Record<string, unknown>,
  settings2: Record<string, unknown>
): { added: string[]; removed: string[]; modified: ConfigChange[] } {
  const added: string[] = [];
  const removed: string[] = [];
  const modified: ConfigChange[] = [];

  const allKeys = new Set([
    ...Object.keys(settings1),
    ...Object.keys(settings2)
  ]);

  Array.from(allKeys).forEach(key => {
    const val1 = settings1[key];
    const val2 = settings2[key];

    if (!(key in settings1)) {
      added.push(`settings.${key}`);
    } else if (!(key in settings2)) {
      removed.push(`settings.${key}`);
    } else if (JSON.stringify(val1) !== JSON.stringify(val2)) {
      modified.push({
        path: `settings.${key}`,
        type: 'modified',
        before: val1,
        after: val2
      });
    }
  });

  return { added, removed, modified };
}

/**
 * Compares two objects recursively.
 *
 * @param obj1 - First object
 * @param obj2 - Second object
 * @param basePath - Base path for field names
 * @returns Array of changes
 *
 * @version 1.0.0
 * @since 1.0.0
 */
function compareObjects(
  obj1: Record<string, unknown>,
  obj2: Record<string, unknown>,
  basePath: string
): ConfigChange[] {
  const changes: ConfigChange[] = [];

  const allKeys = new Set([
    ...Object.keys(obj1),
    ...Object.keys(obj2)
  ]);

  Array.from(allKeys).forEach(key => {
    const val1 = obj1[key];
    const val2 = obj2[key];
    const path = `${basePath}.${key}`;

    if (!(key in obj1)) {
      changes.push({
        path,
        type: 'added',
        after: val2
      });
    } else if (!(key in obj2)) {
      changes.push({
        path,
        type: 'removed',
        before: val1
      });
    } else if (JSON.stringify(val1) !== JSON.stringify(val2)) {
      changes.push({
        path,
        type: 'modified',
        before: val1,
        after: val2
      });
    }
  });

  return changes;
}

/**
 * Checks if two configurations are identical.
 *
 * @param config1 - First configuration
 * @param config2 - Second configuration
 * @returns True if configurations are identical
 *
 * @example
 * ```typescript
 * const identical = areConfigsIdentical(config1, config2);
 * ```
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export function areConfigsIdentical(
  config1: ClaudeConfig,
  config2: ClaudeConfig
): boolean {
  return JSON.stringify(config1) === JSON.stringify(config2);
}

/**
 * Gets a summary of configuration differences.
 *
 * @param diff - Configuration diff
 * @returns Human-readable summary
 *
 * @example
 * ```typescript
 * const summary = getDiffSummary(diff);
 * console.log(summary);
 * // "3 added, 1 removed, 2 modified"
 * ```
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export function getDiffSummary(diff: ConfigDiff): string {
  if (diff.identical) {
    return 'No changes';
  }

  const parts: string[] = [];

  if (diff.added.length > 0) {
    parts.push(`${diff.added.length} added`);
  }

  if (diff.removed.length > 0) {
    parts.push(`${diff.removed.length} removed`);
  }

  if (diff.modified.length > 0) {
    parts.push(`${diff.modified.length} modified`);
  }

  return parts.join(', ');
}

/**
 * Formats a diff for display.
 *
 * @param diff - Configuration diff
 * @returns Formatted diff string
 *
 * @example
 * ```typescript
 * const formatted = formatDiff(diff);
 * console.log(formatted);
 * ```
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export function formatDiff(diff: ConfigDiff): string {
  if (diff.identical) {
    return 'Configurations are identical';
  }

  const lines: string[] = [];

  if (diff.added.length > 0) {
    lines.push('\nAdded:');
    diff.added.forEach(field => {
      lines.push(`  + ${field}`);
    });
  }

  if (diff.removed.length > 0) {
    lines.push('\nRemoved:');
    diff.removed.forEach(field => {
      lines.push(`  - ${field}`);
    });
  }

  if (diff.modified.length > 0) {
    lines.push('\nModified:');
    diff.modified.forEach(change => {
      lines.push(`  ~ ${change.path}`);
      lines.push(`    Before: ${JSON.stringify(change.before)}`);
      lines.push(`    After:  ${JSON.stringify(change.after)}`);
    });
  }

  return lines.join('\n');
}

/**
 * Filters diff to only show specific field types.
 *
 * @param diff - Configuration diff
 * @param fieldPrefix - Field prefix to filter by (e.g., 'permissions', 'settings')
 * @returns Filtered diff
 *
 * @example
 * ```typescript
 * const settingsOnly = filterDiff(diff, 'settings');
 * ```
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export function filterDiff(
  diff: ConfigDiff,
  fieldPrefix: string
): ConfigDiff {
  return {
    added: diff.added.filter(field => field.startsWith(fieldPrefix)),
    removed: diff.removed.filter(field => field.startsWith(fieldPrefix)),
    modified: diff.modified.filter(change => change.path.startsWith(fieldPrefix)),
    identical: false
  };
}
