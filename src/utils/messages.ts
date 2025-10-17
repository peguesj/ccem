/**
 * Predefined message templates for consistent UX.
 *
 * @packageDocumentation
 * @module utils/messages
 * @version 1.0.0
 */

/**
 * Operation start messages.
 */
export const startMessages = {
  discover: '🔍 Discovering configurations...',
  analyze: '🔬 Analyzing conflicts...',
  merge: '🔀 Merging configurations...',
  backup: '💾 Creating backup...',
  restore: '♻️ Restoring from backup...',
  audit: '🔒 Running security audit...',
  validate: '✓ Validating configuration...',
  compress: '📦 Compressing files...',
  decompress: '📂 Decompressing archive...'
};

/**
 * Operation progress messages.
 */
export const progressMessages = {
  scanning: (count: number) => `Scanning... (${count} found)`,
  processing: (current: number, total: number) => `Processing ${current}/${total}`,
  analyzing: (count: number) => `Analyzing... (${count} conflicts found)`,
  merging: (count: number) => `Merging ${count} configuration${count === 1 ? '' : 's'}...`,
  compressing: (percent: number) => `Compressing... ${percent}%`,
  validating: (field: string) => `Validating ${field}...`
};

/**
 * Success messages.
 */
export const successMessages = {
  merged: (count: number, output: string) =>
    `Configuration merged successfully\n  ${count} project${count === 1 ? '' : 's'} merged\n  Output: ${output}`,

  backup: (path: string, size: string) =>
    `Backup created successfully\n  Path: ${path}\n  Size: ${size}`,

  restored: (path: string) =>
    `Configuration restored successfully\n  From: ${path}`,

  validated: (path: string) =>
    `Configuration is valid\n  File: ${path}`,

  audit: (issueCount: number) =>
    issueCount === 0
      ? 'Security audit passed with no issues'
      : `Security audit completed\n  ${issueCount} issue${issueCount === 1 ? '' : 's'} found`,

  discovered: (count: number) =>
    `Discovered ${count} fork point${count === 1 ? '' : 's'}`
};

/**
 * Error messages.
 */
export const errorMessages = {
  configNotFound: (path: string) =>
    `Configuration file not found\n\n  Could not find config at: ${path}\n  \n  Suggestions:\n  • Check if .claude/ directory exists\n  • Run 'ccem init' to create initial config\n  • Verify file permissions`,

  invalidConfig: (errors: string[]) =>
    `Configuration validation failed\n\n  ${errors.map(e => `• ${e}`).join('\n  ')}`,

  mergeConflict: (count: number) =>
    `Merge operation found ${count} conflict${count === 1 ? '' : 's'}\n\n  Manual review required\n  Run 'ccem audit' to view conflicts`,

  backupFailed: (reason: string) =>
    `Backup operation failed\n\n  ${reason}\n  \n  Suggestions:\n  • Check available disk space\n  • Verify write permissions\n  • Ensure backup directory exists`,

  restoreFailed: (reason: string) =>
    `Restore operation failed\n\n  ${reason}\n  \n  Suggestions:\n  • Verify backup file integrity\n  • Check target directory permissions\n  • Ensure sufficient disk space`,

  permissionDenied: (path: string, operation: string) =>
    `Permission denied\n\n  Cannot ${operation} ${path}\n  \n  Suggestions:\n  • Check file/directory permissions\n  • Run with appropriate user privileges\n  • Verify ownership of configuration files`,

  securityIssues: (critical: number, high: number) =>
    `Security audit found critical issues\n\n  ${critical} critical issue${critical === 1 ? '' : 's'}\n  ${high} high severity issue${high === 1 ? '' : 's'}\n  \n  Review required before proceeding`
};

/**
 * Warning messages.
 */
export const warningMessages = {
  conflicts: (count: number) =>
    `${count} conflict${count === 1 ? '' : 's'} detected`,

  securityIssues: (count: number, severity: string) =>
    `${count} ${severity} security issue${count === 1 ? '' : 's'} found`,

  deprecatedConfig: (field: string) =>
    `Deprecated configuration field: ${field}`,

  backupRecommended: 'Creating backup before merge is recommended',

  destructiveOperation: 'This operation cannot be undone',

  largeFile: (size: string) =>
    `Large file detected (${size}), operation may take longer`
};

/**
 * Info messages.
 */
export const infoMessages = {
  foundConfigs: (count: number) =>
    `Found ${count} configuration${count === 1 ? '' : 's'} to merge`,

  analyzingConflicts: (count: number) =>
    `Analyzing ${count} configuration${count === 1 ? '' : 's'} for conflicts...`,

  applyingStrategy: (strategy: string) =>
    `Applying merge strategy: ${strategy}`,

  creatingBackup: (path: string) =>
    `Creating backup at: ${path}`,

  restoringBackup: (path: string) =>
    `Restoring from: ${path}`,

  runningAudit: (severity: string) =>
    `Running security audit (minimum severity: ${severity})`,

  validatingSchema: (path: string) =>
    `Validating configuration schema: ${path}`
};

/**
 * Formats a conflict summary message.
 *
 * @param permissions - Permission conflicts
 * @param mcpServers - MCP server conflicts
 * @param settings - Settings conflicts
 * @param autoResolved - Auto-resolved conflicts
 * @returns Formatted message
 */
export function formatConflictSummary(
  permissions: number,
  mcpServers: number,
  settings: number,
  autoResolved: number
): string {
  const lines = ['Conflict Analysis:'];

  if (permissions > 0) {
    lines.push(`  ✓ ${permissions} permission conflict${permissions === 1 ? '' : 's'}`);
  }
  if (mcpServers > 0) {
    lines.push(`  ✓ ${mcpServers} MCP server conflict${mcpServers === 1 ? '' : 's'}`);
  }
  if (settings > 0) {
    lines.push(`  ✓ ${settings} setting conflict${settings === 1 ? '' : 's'}`);
  }

  if (autoResolved > 0) {
    lines.push(`\n  ✓ Auto-resolved ${autoResolved} conflict${autoResolved === 1 ? '' : 's'}`);
  }

  const total = permissions + mcpServers + settings;
  const remaining = total - autoResolved;

  if (remaining > 0) {
    lines.push(`  ⚠ ${remaining} conflict${remaining === 1 ? '' : 's'} require${remaining === 1 ? 's' : ''} manual review`);
  }

  return lines.join('\n');
}

/**
 * Formats merge statistics message.
 *
 * @param projectsAnalyzed - Number of projects
 * @param permissionsMerged - Permissions merged
 * @param serversMerged - MCP servers merged
 * @param settingsMerged - Settings merged
 * @returns Formatted message
 */
export function formatMergeStats(
  projectsAnalyzed: number,
  permissionsMerged: number,
  serversMerged: number,
  settingsMerged: number
): string {
  return [
    'Merge Statistics:',
    `  Projects analyzed: ${projectsAnalyzed}`,
    `  Permissions merged: ${permissionsMerged}`,
    `  MCP servers merged: ${serversMerged}`,
    `  Settings merged: ${settingsMerged}`
  ].join('\n');
}

/**
 * Formats security audit summary.
 *
 * @param critical - Critical issues
 * @param high - High severity issues
 * @param medium - Medium severity issues
 * @param low - Low severity issues
 * @returns Formatted message
 */
export function formatAuditSummary(
  critical: number,
  high: number,
  medium: number,
  low: number
): string {
  const lines = ['Security Audit Summary:'];

  if (critical > 0) {
    lines.push(`  🔴 ${critical} critical issue${critical === 1 ? '' : 's'}`);
  }
  if (high > 0) {
    lines.push(`  🟠 ${high} high severity issue${high === 1 ? '' : 's'}`);
  }
  if (medium > 0) {
    lines.push(`  🟡 ${medium} medium severity issue${medium === 1 ? '' : 's'}`);
  }
  if (low > 0) {
    lines.push(`  🟢 ${low} low severity issue${low === 1 ? '' : 's'}`);
  }

  const total = critical + high + medium + low;
  if (total === 0) {
    lines.push('  ✓ No issues found');
  }

  return lines.join('\n');
}
