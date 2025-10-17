import { MergeConfig } from './strategies';

/**
 * Conflict type enumeration.
 *
 * @version 0.4.0
 * @since 0.4.0
 */
export type ConflictType =
  | 'permission-overlap'
  | 'permission-hierarchy'
  | 'setting-value'
  | 'mcp-config';

/**
 * Conflict severity levels.
 *
 * @version 0.4.0
 * @since 0.4.0
 */
export type ConflictSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Resolution strategy options.
 *
 * @version 0.4.0
 * @since 0.4.0
 */
export type ResolutionStrategy =
  | 'prefer-first'
  | 'prefer-last'
  | 'manual-review'
  | 'merge-union'
  | 'use-more-specific'
  | 'use-more-general';

/**
 * Conflict context information.
 *
 * @interface ConflictContext
 * @version 0.4.0
 * @since 0.4.0
 */
export interface ConflictContext {
  /** Projects affected by this conflict */
  affectedProjects: number[];
  /** Additional context information */
  metadata?: Record<string, any>;
}

/**
 * Detected conflict information.
 *
 * @interface DetectedConflict
 * @version 0.4.0
 * @since 0.4.0
 */
export interface DetectedConflict {
  /** Conflict type */
  type: ConflictType;
  /** Path to conflicting field */
  path: string;
  /** Conflicting values */
  values: any[];
  /** Conflict severity */
  severity: ConflictSeverity;
  /** Available resolution strategies */
  resolutionStrategies: ResolutionStrategy[];
  /** Recommended resolution */
  recommendedResolution: ResolutionStrategy;
  /** Rationale for recommended resolution */
  resolutionRationale: string;
  /** Conflict context */
  context: ConflictContext;
}

/**
 * Conflict summary statistics.
 *
 * @interface ConflictSummary
 * @version 0.4.0
 * @since 0.4.0
 */
export interface ConflictSummary {
  /** Total number of conflicts */
  totalConflicts: number;
  /** Conflicts by type */
  conflictsByType: Record<ConflictType, number>;
  /** Conflicts by severity */
  conflictsBySeverity: Record<ConflictSeverity, number>;
}

/**
 * Complete conflict report.
 *
 * @interface ConflictReport
 * @version 0.4.0
 * @since 0.4.0
 */
export interface ConflictReport {
  /** Detected conflicts */
  conflicts: DetectedConflict[];
  /** Summary statistics */
  summary: ConflictSummary;
}

/**
 * Checks if permission pattern is more general than another.
 *
 * @param perm1 - First permission
 * @param perm2 - Second permission
 * @returns True if perm1 is more general
 *
 * @version 0.4.0
 * @since 0.4.0
 */
function isMoreGeneral(perm1: string, perm2: string): boolean {
  // Extract the path from permission (e.g., "Read(*)" -> "*")
  const match1 = perm1.match(/\((.*?)\)/);
  const match2 = perm2.match(/\((.*?)\)/);

  if (!match1 || !match2 || !match1[1] || !match2[1]) return false;

  const path1 = match1[1];
  const path2 = match2[1];

  // "*" is more general than specific paths
  if (path1 === '*' && path2 !== '*') return true;
  if (path1 !== '*' && path2 === '*') return false;

  // Shorter paths are more general
  return path1.length < path2.length && path2.startsWith(path1.replace('*', ''));
}

/**
 * Detects permission conflicts between configurations.
 *
 * @param configs - Array of configurations
 * @returns Array of permission conflicts
 *
 * @version 0.4.0
 * @since 0.4.0
 */
function detectPermissionConflicts(configs: MergeConfig[]): DetectedConflict[] {
  const conflicts: DetectedConflict[] = [];
  const allPermissions = configs.flatMap((config, idx) =>
    config.permissions.map(perm => ({ perm, projectIdx: idx }))
  );

  // Check for overlaps and hierarchies
  for (let i = 0; i < allPermissions.length; i++) {
    for (let j = i + 1; j < allPermissions.length; j++) {
      const perm1 = allPermissions[i];
      const perm2 = allPermissions[j];

      if (!perm1 || !perm2) continue;

      // Extract action (Read, Write, etc.)
      const action1 = perm1.perm.split('(')[0];
      const action2 = perm2.perm.split('(')[0];

      // Only check same action type
      if (action1 === action2) {
        if (isMoreGeneral(perm1.perm, perm2.perm)) {
          conflicts.push({
            type: 'permission-hierarchy',
            path: `permissions.${action1}`,
            values: [perm1.perm, perm2.perm],
            severity: 'medium',
            resolutionStrategies: ['use-more-general', 'use-more-specific', 'merge-union'],
            recommendedResolution: 'use-more-general',
            resolutionRationale: 'Using more general permission provides broader access while maintaining security boundaries',
            context: {
              affectedProjects: [perm1.projectIdx, perm2.projectIdx]
            }
          });
        } else if (isMoreGeneral(perm2.perm, perm1.perm)) {
          conflicts.push({
            type: 'permission-hierarchy',
            path: `permissions.${action1}`,
            values: [perm2.perm, perm1.perm],
            severity: 'medium',
            resolutionStrategies: ['use-more-general', 'use-more-specific', 'merge-union'],
            recommendedResolution: 'use-more-general',
            resolutionRationale: 'Using more general permission provides broader access while maintaining security boundaries',
            context: {
              affectedProjects: [perm2.projectIdx, perm1.projectIdx]
            }
          });
        } else if (perm1.perm !== perm2.perm) {
          // Different but potentially overlapping permissions
          conflicts.push({
            type: 'permission-overlap',
            path: `permissions.${action1}`,
            values: [perm1.perm, perm2.perm],
            severity: 'medium',
            resolutionStrategies: ['merge-union', 'manual-review'],
            recommendedResolution: 'merge-union',
            resolutionRationale: 'Combining permissions ensures all required access is maintained',
            context: {
              affectedProjects: [perm1.projectIdx, perm2.projectIdx]
            }
          });
        }
      }
    }
  }

  return conflicts;
}

/**
 * Deeply compares two values.
 *
 * @param val1 - First value
 * @param val2 - Second value
 * @returns True if values are equal
 *
 * @version 0.4.0
 * @since 0.4.0
 */
function deepEqual(val1: any, val2: any): boolean {
  return JSON.stringify(val1) === JSON.stringify(val2);
}

/**
 * Gets all keys from nested object with dot notation.
 *
 * @param obj - Object to extract keys from
 * @param prefix - Key prefix
 * @returns Array of key paths
 *
 * @version 0.4.0
 * @since 0.4.0
 */
function getNestedKeys(obj: Record<string, any>, prefix = ''): string[] {
  const keys: string[] = [];

  Object.keys(obj).forEach(key => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...getNestedKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  });

  return keys;
}

/**
 * Gets nested value from object using dot notation.
 *
 * @param obj - Object to get value from
 * @param path - Dot notation path
 * @returns Value at path or undefined
 *
 * @version 0.4.0
 * @since 0.4.0
 */
function getNestedValue(obj: Record<string, any>, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Detects setting value conflicts between configurations.
 *
 * @param configs - Array of configurations
 * @returns Array of setting conflicts
 *
 * @version 0.4.0
 * @since 0.4.0
 */
function detectSettingConflicts(configs: MergeConfig[]): DetectedConflict[] {
  const conflicts: DetectedConflict[] = [];
  const allKeys = new Set<string>();

  // Collect all nested setting keys
  configs.forEach(config => {
    getNestedKeys(config.settings, 'settings').forEach(key => allKeys.add(key));
  });

  // Check each key for conflicts
  allKeys.forEach(keyPath => {
    const values = configs.map((config, idx) => ({
      value: getNestedValue(config, keyPath),
      projectIdx: idx
    })).filter(v => v.value !== undefined);

    const uniqueValues = Array.from(
      new Set(values.map(v => JSON.stringify(v.value)))
    ).map(s => JSON.parse(s));

    if (uniqueValues.length > 1) {
      conflicts.push({
        type: 'setting-value',
        path: keyPath,
        values: uniqueValues,
        severity: 'low',
        resolutionStrategies: ['prefer-first', 'prefer-last', 'manual-review'],
        recommendedResolution: 'prefer-last',
        resolutionRationale: 'Using most recent setting value maintains latest preferences',
        context: {
          affectedProjects: values.map(v => v.projectIdx)
        }
      });
    }
  });

  return conflicts;
}

/**
 * Detects MCP server configuration conflicts.
 *
 * @param configs - Array of configurations
 * @returns Array of MCP conflicts
 *
 * @version 0.4.0
 * @since 0.4.0
 */
function detectMcpConflicts(configs: MergeConfig[]): DetectedConflict[] {
  const conflicts: DetectedConflict[] = [];
  const serverNames = new Set<string>();

  // Collect all server names
  configs.forEach(config => {
    Object.keys(config.mcpServers).forEach(name => serverNames.add(name));
  });

  // Check each server for conflicts
  serverNames.forEach(serverName => {
    const serverConfigs = configs
      .map((config, idx) => ({
        config: config.mcpServers[serverName],
        projectIdx: idx
      }))
      .filter(s => s.config !== undefined);

    if (serverConfigs.length > 1) {
      const firstConfig = serverConfigs[0];
      if (!firstConfig) return;

      const hasConflict = serverConfigs.some(
        s => !deepEqual(s.config, firstConfig.config)
      );

      if (hasConflict) {
        conflicts.push({
          type: 'mcp-config',
          path: `mcpServers.${serverName}`,
          values: serverConfigs.map(s => s.config),
          severity: 'high',
          resolutionStrategies: ['manual-review', 'prefer-first', 'prefer-last'],
          recommendedResolution: 'manual-review',
          resolutionRationale: 'MCP server configurations require careful review to ensure correct integration',
          context: {
            affectedProjects: serverConfigs.map(s => s.projectIdx)
          }
        });
      }
    }
  });

  return conflicts;
}

/**
 * Creates conflict summary from detected conflicts.
 *
 * @param conflicts - Array of detected conflicts
 * @returns Conflict summary
 *
 * @version 0.4.0
 * @since 0.4.0
 */
function createSummary(conflicts: DetectedConflict[]): ConflictSummary {
  const conflictsByType: Record<ConflictType, number> = {
    'permission-overlap': 0,
    'permission-hierarchy': 0,
    'setting-value': 0,
    'mcp-config': 0
  };

  const conflictsBySeverity: Record<ConflictSeverity, number> = {
    'low': 0,
    'medium': 0,
    'high': 0,
    'critical': 0
  };

  conflicts.forEach(conflict => {
    conflictsByType[conflict.type]++;
    conflictsBySeverity[conflict.severity]++;
  });

  return {
    totalConflicts: conflicts.length,
    conflictsByType,
    conflictsBySeverity
  };
}

/**
 * Detects all conflicts between multiple configurations.
 *
 * @param configs - Array of configurations to analyze
 * @returns Complete conflict report with suggestions
 *
 * @example
 * ```typescript
 * const report = detectConflicts([config1, config2]);
 * console.log(`Found ${report.summary.totalConflicts} conflicts`);
 * ```
 *
 * @version 0.4.0
 * @since 0.4.0
 */
export function detectConflicts(configs: MergeConfig[]): ConflictReport {
  // Handle empty or single config
  if (configs.length <= 1) {
    return {
      conflicts: [],
      summary: {
        totalConflicts: 0,
        conflictsByType: {
          'permission-overlap': 0,
          'permission-hierarchy': 0,
          'setting-value': 0,
          'mcp-config': 0
        },
        conflictsBySeverity: {
          'low': 0,
          'medium': 0,
          'high': 0,
          'critical': 0
        }
      }
    };
  }

  // Detect all types of conflicts
  const permissionConflicts = detectPermissionConflicts(configs);
  const settingConflicts = detectSettingConflicts(configs);
  const mcpConflicts = detectMcpConflicts(configs);

  const conflicts = [
    ...permissionConflicts,
    ...settingConflicts,
    ...mcpConflicts
  ];

  return {
    conflicts,
    summary: createSummary(conflicts)
  };
}
