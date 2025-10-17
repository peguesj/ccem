/**
 * Merge configuration interface.
 *
 * @interface MergeConfig
 * @version 0.4.0
 * @since 0.4.0
 */
export interface MergeConfig {
  /** Permission strings */
  permissions: string[];
  /** MCP server configurations */
  mcpServers: Record<string, { enabled: boolean; [key: string]: any }>;
  /** Settings object */
  settings: Record<string, any>;
}

/**
 * Merge conflict interface.
 *
 * @interface MergeConflict
 * @version 0.4.0
 * @since 0.4.0
 */
export interface MergeConflict {
  /** Field path */
  field: string;
  /** Conflicting values */
  values: any[];
  /** Requires manual review */
  requiresManualReview: boolean;
  /** Suggested resolution */
  suggestion?: any;
}

/**
 * Merge statistics interface.
 *
 * @interface MergeStats
 * @version 0.4.0
 * @since 0.4.0
 */
export interface MergeStats {
  /** Number of projects analyzed */
  projectsAnalyzed: number;
  /** Number of conflicts detected */
  conflictsDetected: number;
  /** Number of auto-resolved conflicts */
  autoResolved: number;
}

/**
 * Merge result interface.
 *
 * @interface MergeResult
 * @version 0.4.0
 * @since 0.4.0
 */
export interface MergeResult extends MergeConfig {
  /** Detected conflicts */
  conflicts: MergeConflict[];
  /** Merge statistics */
  stats: MergeStats;
}

/**
 * Custom merge rules interface.
 *
 * @interface CustomMergeRules
 * @version 0.4.0
 * @since 0.4.0
 */
export interface CustomMergeRules {
  /** Permission merge rules */
  permissions: {
    deduplication?: 'strict' | 'pattern-match';
    conflictResolution?: 'union' | 'prefer-first' | 'prefer-last';
    patterns?: string[];
  };
  /** Settings merge rules */
  settings: Record<string, 'prefer-first' | 'prefer-last' | 'manual'>;
}

/**
 * Deduplicates an array of strings.
 *
 * @param items - Array to deduplicate
 * @returns Deduplicated array
 *
 * @version 0.4.0
 * @since 0.4.0
 */
function deduplicate(items: string[]): string[] {
  return Array.from(new Set(items));
}

/**
 * Detects conflicts between settings objects.
 *
 * @param configs - Array of configurations
 * @param requiresManualReview - Whether conflicts require manual review
 * @returns Array of conflicts
 *
 * @version 0.4.0
 * @since 0.4.0
 */
function detectSettingConflicts(
  configs: MergeConfig[],
  requiresManualReview: boolean
): MergeConflict[] {
  const conflicts: MergeConflict[] = [];
  const settingKeys = new Set<string>();

  // Collect all setting keys
  configs.forEach(config => {
    Object.keys(config.settings).forEach(key => settingKeys.add(key));
  });

  // Check for conflicts
  settingKeys.forEach(key => {
    const values = configs
      .map(config => config.settings[key])
      .filter(val => val !== undefined);

    const uniqueValues = Array.from(new Set(values.map(v => JSON.stringify(v))))
      .map(s => JSON.parse(s));

    if (uniqueValues.length > 1) {
      conflicts.push({
        field: `settings.${key}`,
        values: uniqueValues,
        requiresManualReview,
        suggestion: uniqueValues[0]
      });
    }
  });

  return conflicts;
}

/**
 * Detects conflicts in MCP server configurations.
 *
 * @param configs - Array of configurations
 * @param requiresManualReview - Whether conflicts require manual review
 * @returns Array of conflicts
 *
 * @version 0.4.0
 * @since 0.4.0
 */
function detectMcpConflicts(
  configs: MergeConfig[],
  requiresManualReview: boolean
): MergeConflict[] {
  const conflicts: MergeConflict[] = [];
  const serverNames = new Set<string>();

  // Collect all server names
  configs.forEach(config => {
    Object.keys(config.mcpServers).forEach(name => serverNames.add(name));
  });

  // Check for conflicts in server configurations
  serverNames.forEach(name => {
    const serverConfigs = configs
      .filter(config => config.mcpServers[name])
      .map(config => config.mcpServers[name]);

    if (serverConfigs.length > 1) {
      // Check if configurations differ
      const firstConfig = JSON.stringify(serverConfigs[0]);
      const hasConflict = serverConfigs.some(sc => JSON.stringify(sc) !== firstConfig);

      if (hasConflict) {
        conflicts.push({
          field: `mcpServers.${name}`,
          values: serverConfigs,
          requiresManualReview,
          suggestion: serverConfigs[0]
        });
      }
    }
  });

  return conflicts;
}

/**
 * Merges settings objects with specified strategy.
 *
 * @param configs - Array of configurations
 * @param strategy - Merge strategy ('last-write-wins' | 'first-write-wins')
 * @returns Merged settings
 *
 * @version 0.4.0
 * @since 0.4.0
 */
function mergeSettings(
  configs: MergeConfig[],
  strategy: 'last-write-wins' | 'first-write-wins' = 'last-write-wins'
): Record<string, any> {
  const merged: Record<string, any> = {};

  if (strategy === 'last-write-wins') {
    configs.forEach(config => {
      Object.assign(merged, config.settings);
    });
  } else {
    // first-write-wins
    [...configs].reverse().forEach(config => {
      Object.assign(merged, config.settings);
    });
  }

  return merged;
}

/**
 * Merges MCP server configurations.
 *
 * @param configs - Array of configurations
 * @returns Merged MCP servers
 *
 * @version 0.4.0
 * @since 0.4.0
 */
function mergeMcpServers(
  configs: MergeConfig[]
): Record<string, { enabled: boolean; [key: string]: any }> {
  const merged: Record<string, { enabled: boolean; [key: string]: any }> = {};

  configs.forEach(config => {
    Object.entries(config.mcpServers).forEach(([name, serverConfig]) => {
      if (!merged[name]) {
        merged[name] = { ...serverConfig };
      }
    });
  });

  return merged;
}

/**
 * Recommended merge strategy with AI-powered conflict resolution.
 *
 * @param configs - Array of configurations to merge
 * @returns Merged configuration with conflicts flagged
 *
 * @example
 * ```typescript
 * const result = await recommendedMerge([config1, config2]);
 * ```
 *
 * @version 0.4.0
 * @since 0.4.0
 */
export async function recommendedMerge(
  configs: MergeConfig[]
): Promise<MergeResult> {
  // Handle empty array
  if (configs.length === 0) {
    return {
      permissions: [],
      mcpServers: {},
      settings: {},
      conflicts: [],
      stats: {
        projectsAnalyzed: 0,
        conflictsDetected: 0,
        autoResolved: 0
      }
    };
  }

  // Merge permissions with deduplication
  const allPermissions = configs.flatMap(c => c.permissions);
  const permissions = deduplicate(allPermissions);

  // Merge MCP servers
  const mcpServers = mergeMcpServers(configs);

  // Merge settings
  const settings = mergeSettings(configs);

  // Detect conflicts
  const settingConflicts = detectSettingConflicts(configs, false);
  const mcpConflicts = detectMcpConflicts(configs, false);
  const conflicts = [...settingConflicts, ...mcpConflicts];

  return {
    permissions,
    mcpServers,
    settings,
    conflicts,
    stats: {
      projectsAnalyzed: configs.length,
      conflictsDetected: conflicts.length,
      autoResolved: 0
    }
  };
}

/**
 * Default merge strategy with simple union and last-write-wins.
 *
 * @param configs - Array of configurations to merge
 * @returns Merged configuration
 *
 * @example
 * ```typescript
 * const result = await defaultMerge([config1, config2]);
 * ```
 *
 * @version 0.4.0
 * @since 0.4.0
 */
export async function defaultMerge(
  configs: MergeConfig[]
): Promise<MergeResult> {
  if (configs.length === 0) {
    return {
      permissions: [],
      mcpServers: {},
      settings: {},
      conflicts: [],
      stats: {
        projectsAnalyzed: 0,
        conflictsDetected: 0,
        autoResolved: 0
      }
    };
  }

  // Simple union of permissions (no deduplication)
  const permissions = configs.flatMap(c => c.permissions);

  // Merge MCP servers
  const mcpServers = mergeMcpServers(configs);

  // Last-write-wins for settings
  const settings = mergeSettings(configs, 'last-write-wins');

  // Detect conflicts but don't require manual review
  const settingConflicts = detectSettingConflicts(configs, false);
  const mcpConflicts = detectMcpConflicts(configs, false);
  const conflicts = [...settingConflicts, ...mcpConflicts];

  return {
    permissions,
    mcpServers,
    settings,
    conflicts,
    stats: {
      projectsAnalyzed: configs.length,
      conflictsDetected: conflicts.length,
      autoResolved: conflicts.length
    }
  };
}

/**
 * Conservative merge strategy that preserves all unique items.
 *
 * @param configs - Array of configurations to merge
 * @returns Merged configuration with all conflicts flagged
 *
 * @example
 * ```typescript
 * const result = await conservativeMerge([config1, config2]);
 * ```
 *
 * @version 0.4.0
 * @since 0.4.0
 */
export async function conservativeMerge(
  configs: MergeConfig[]
): Promise<MergeResult> {
  if (configs.length === 0) {
    return {
      permissions: [],
      mcpServers: {},
      settings: {},
      conflicts: [],
      stats: {
        projectsAnalyzed: 0,
        conflictsDetected: 0,
        autoResolved: 0
      }
    };
  }

  // Deduplicate permissions
  const allPermissions = configs.flatMap(c => c.permissions);
  const permissions = deduplicate(allPermissions);

  // Merge MCP servers
  const mcpServers = mergeMcpServers(configs);

  // First-write-wins for settings (preserve first value)
  const settings = mergeSettings(configs, 'first-write-wins');

  // Detect conflicts and require manual review
  const settingConflicts = detectSettingConflicts(configs, true);
  const mcpConflicts = detectMcpConflicts(configs, true);
  const conflicts = [...settingConflicts, ...mcpConflicts];

  return {
    permissions,
    mcpServers,
    settings,
    conflicts,
    stats: {
      projectsAnalyzed: configs.length,
      conflictsDetected: conflicts.length,
      autoResolved: 0
    }
  };
}

/**
 * Hybrid merge strategy combining recommended and conservative approaches.
 *
 * @param configs - Array of configurations to merge
 * @returns Merged configuration with balanced conflict handling
 *
 * @example
 * ```typescript
 * const result = await hybridMerge([config1, config2]);
 * ```
 *
 * @version 0.4.0
 * @since 0.4.0
 */
export async function hybridMerge(
  configs: MergeConfig[]
): Promise<MergeResult> {
  if (configs.length === 0) {
    return {
      permissions: [],
      mcpServers: {},
      settings: {},
      conflicts: [],
      stats: {
        projectsAnalyzed: 0,
        conflictsDetected: 0,
        autoResolved: 0
      }
    };
  }

  // Deduplicate permissions
  const allPermissions = configs.flatMap(c => c.permissions);
  const permissions = deduplicate(allPermissions);

  // Merge MCP servers
  const mcpServers = mergeMcpServers(configs);

  // Merge settings with last-write-wins
  const settings = mergeSettings(configs);

  // Detect conflicts - setting conflicts require manual review (critical)
  const settingConflicts = detectSettingConflicts(configs, true);
  const mcpConflicts = detectMcpConflicts(configs, true); // MCP conflicts are critical

  const conflicts = [...settingConflicts, ...mcpConflicts];

  const autoResolved = conflicts.filter(c => !c.requiresManualReview).length;

  return {
    permissions,
    mcpServers,
    settings,
    conflicts,
    stats: {
      projectsAnalyzed: configs.length,
      conflictsDetected: conflicts.length,
      autoResolved
    }
  };
}

/**
 * Custom merge strategy with user-defined rules.
 *
 * @param configs - Array of configurations to merge
 * @param rules - Custom merge rules
 * @returns Merged configuration according to rules
 *
 * @example
 * ```typescript
 * const rules = {
 *   permissions: { deduplication: 'strict' },
 *   settings: { theme: 'prefer-first', tabSize: 'prefer-last' }
 * };
 * const result = await customMerge([config1, config2], rules);
 * ```
 *
 * @version 0.4.0
 * @since 0.4.0
 */
export async function customMerge(
  configs: MergeConfig[],
  rules: CustomMergeRules
): Promise<MergeResult> {
  if (configs.length === 0) {
    return {
      permissions: [],
      mcpServers: {},
      settings: {},
      conflicts: [],
      stats: {
        projectsAnalyzed: 0,
        conflictsDetected: 0,
        autoResolved: 0
      }
    };
  }

  // Merge permissions according to rules
  const allPermissions = configs.flatMap(c => c.permissions);
  const permissions = rules.permissions.deduplication === 'strict'
    ? deduplicate(allPermissions)
    : allPermissions;

  // Merge MCP servers
  const mcpServers = mergeMcpServers(configs);

  // Merge settings according to custom rules
  const settings: Record<string, any> = {};
  const settingKeys = new Set<string>();

  configs.forEach(config => {
    Object.keys(config.settings).forEach(key => settingKeys.add(key));
  });

  settingKeys.forEach(key => {
    const rule = rules.settings[key];
    const values = configs
      .map(config => config.settings[key])
      .filter(val => val !== undefined);

    if (rule === 'prefer-first') {
      settings[key] = values[0];
    } else if (rule === 'prefer-last') {
      settings[key] = values[values.length - 1];
    } else {
      // Default to last value
      settings[key] = values[values.length - 1];
    }
  });

  // Detect conflicts
  const settingConflicts = detectSettingConflicts(configs, false);
  const mcpConflicts = detectMcpConflicts(configs, false);
  const conflicts = [...settingConflicts, ...mcpConflicts];

  // Add suggestions to all conflicts
  conflicts.forEach(conflict => {
    if (!conflict.suggestion) {
      conflict.suggestion = conflict.values[0];
    }
  });

  return {
    permissions,
    mcpServers,
    settings,
    conflicts,
    stats: {
      projectsAnalyzed: configs.length,
      conflictsDetected: conflicts.length,
      autoResolved: conflicts.length
    }
  };
}
