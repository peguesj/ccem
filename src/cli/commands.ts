/**
 * CLI command implementations.
 *
 * @module cli/commands
 * @version 1.0.0
 * @since 1.0.0
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import {
  recommendedMerge,
  defaultMerge,
  conservativeMerge,
  hybridMerge,
  customMerge,
  type MergeConfig,
  type MergeResult,
  type CustomMergeRules
} from '../merge/strategies.js';
import {
  createBackup,
  validateBackup,
  restoreBackup
} from '../merge/backup.js';
import {
  auditMerge,
  type SecurityAuditResult
} from '../merge/security-audit.js';
import {
  validateSchema,
  ValidationError
} from '../schema/validator.js';
import {
  parseConversation,
  identifyForkPoints,
  type Conversation,
  type ForkPoint
} from '../fork/chat-analyzer.js';
import { z } from 'zod';

/**
 * Discovers .claude directories in the current directory.
 *
 * @returns Array of .claude directory paths
 */
async function discoverClaudeConfigs(): Promise<string[]> {
  const configs: string[] = [];
  const cwd = process.cwd();

  // Check for .claude in current directory
  const localClaudePath = path.join(cwd, '.claude');
  try {
    const stat = await fs.stat(localClaudePath);
    if (stat.isDirectory()) {
      configs.push(localClaudePath);
    }
  } catch {
    // Directory doesn't exist, skip
  }

  return configs;
}

/**
 * Reads a configuration file and parses it as MergeConfig.
 *
 * @param configPath - Path to configuration file or directory
 * @returns Parsed configuration
 */
async function readConfig(configPath: string): Promise<MergeConfig> {
  let actualPath = configPath;

  // If it's a directory, look for common config files
  const stat = await fs.stat(configPath);
  if (stat.isDirectory()) {
    const possibleFiles = [
      'config.json',
      'claude.json',
      'configuration.json',
      'settings.json'
    ];

    let found = false;
    for (const file of possibleFiles) {
      const filePath = path.join(configPath, file);
      try {
        await fs.access(filePath);
        actualPath = filePath;
        found = true;
        break;
      } catch {
        continue;
      }
    }

    if (!found) {
      throw new Error(`No configuration file found in directory: ${configPath}`);
    }
  }

  const content = await fs.readFile(actualPath, 'utf-8');
  const data = JSON.parse(content);

  // Convert to MergeConfig format
  const config: MergeConfig = {
    permissions: data.permissions || [],
    mcpServers: data.mcpServers || data.mcp_servers || {},
    settings: data.settings || {}
  };

  return config;
}

/**
 * Formats a merge result for display.
 *
 * @param result - Merge result to format
 * @returns Formatted string
 */
function formatMergeResult(result: MergeResult): string {
  const lines: string[] = [];

  lines.push('=== Merge Result ===\n');
  lines.push(`Projects Analyzed: ${result.stats.projectsAnalyzed}`);
  lines.push(`Conflicts Detected: ${result.stats.conflictsDetected}`);
  lines.push(`Auto-Resolved: ${result.stats.autoResolved}\n`);

  lines.push(`Permissions: ${result.permissions.length} total`);
  lines.push(`MCP Servers: ${Object.keys(result.mcpServers).length} servers`);
  lines.push(`Settings: ${Object.keys(result.settings).length} keys\n`);

  if (result.conflicts.length > 0) {
    lines.push('=== Conflicts ===');
    result.conflicts.forEach((conflict, idx) => {
      lines.push(`\n${idx + 1}. ${conflict.field}`);
      lines.push(`   Manual Review: ${conflict.requiresManualReview ? 'YES' : 'NO'}`);
      lines.push(`   Values: ${conflict.values.map(v => JSON.stringify(v)).join(', ')}`);
      if (conflict.suggestion) {
        lines.push(`   Suggestion: ${JSON.stringify(conflict.suggestion)}`);
      }
    });
  }

  return lines.join('\n');
}

/**
 * Formats a security audit result for display.
 *
 * @param audit - Security audit result
 * @returns Formatted string with color codes
 */
function formatAuditResult(audit: SecurityAuditResult): string {
  const lines: string[] = [];

  // Colors using ANSI escape codes
  const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    green: '\x1b[32m',
    blue: '\x1b[34m',
    gray: '\x1b[90m'
  };

  const riskColors = {
    critical: colors.red,
    high: colors.red,
    medium: colors.yellow,
    low: colors.green
  };

  lines.push(`\n${colors.blue}=== Security Audit Report ===${colors.reset}\n`);
  lines.push(`Overall Status: ${audit.passed ? colors.green + 'PASSED' : colors.red + 'FAILED'}${colors.reset}`);
  lines.push(`Risk Level: ${riskColors[audit.riskLevel]}${audit.riskLevel.toUpperCase()}${colors.reset}\n`);

  lines.push(`${colors.blue}Summary:${colors.reset}`);
  lines.push(`  Total Issues: ${audit.summary.totalIssues}`);
  lines.push(`  ${colors.red}Critical: ${audit.summary.criticalIssues}${colors.reset}`);
  lines.push(`  ${colors.red}High: ${audit.summary.highIssues}${colors.reset}`);
  lines.push(`  ${colors.yellow}Medium: ${audit.summary.mediumIssues}${colors.reset}`);
  lines.push(`  ${colors.gray}Low: ${audit.summary.lowIssues}${colors.reset}\n`);

  if (audit.issues.length > 0) {
    lines.push(`${colors.blue}Issues:${colors.reset}`);
    audit.issues.forEach((issue, idx) => {
      const severityColor = issue.severity === 'critical' || issue.severity === 'high'
        ? colors.red
        : issue.severity === 'medium'
          ? colors.yellow
          : colors.gray;

      lines.push(`\n${idx + 1}. ${severityColor}[${issue.severity.toUpperCase()}]${colors.reset} ${issue.type}`);
      lines.push(`   Field: ${issue.affectedField}`);
      lines.push(`   ${issue.description}`);
      lines.push(`   ${colors.blue}→${colors.reset} ${issue.recommendation}`);
    });
  }

  if (audit.recommendations.length > 0) {
    lines.push(`\n${colors.blue}Top Recommendations:${colors.reset}`);
    audit.recommendations.forEach((rec, idx) => {
      lines.push(`${idx + 1}. ${rec}`);
    });
  }

  return lines.join('\n');
}

/**
 * Merge command handler.
 *
 * @param options - Command options
 */
export async function handleMerge(options: {
  strategy: string;
  output?: string;
  config?: string[];
}): Promise<void> {
  try {
    console.log(`Starting merge with strategy: ${options.strategy}`);

    // Discover or use provided configs
    const configPaths = options.config || await discoverClaudeConfigs();

    if (configPaths.length === 0) {
      throw new Error('No configuration files found. Specify paths with --config option.');
    }

    console.log(`Found ${configPaths.length} configuration(s)`);

    // Read all configs
    const configs: MergeConfig[] = [];
    for (const configPath of configPaths) {
      console.log(`Reading config: ${configPath}`);
      const config = await readConfig(configPath);
      configs.push(config);
    }

    // Perform merge based on strategy
    let result: MergeResult;
    switch (options.strategy) {
      case 'recommended':
        result = await recommendedMerge(configs);
        break;
      case 'default':
        result = await defaultMerge(configs);
        break;
      case 'conservative':
        result = await conservativeMerge(configs);
        break;
      case 'hybrid':
        result = await hybridMerge(configs);
        break;
      default:
        throw new Error(`Unknown strategy: ${options.strategy}`);
    }

    // Format output
    const output = JSON.stringify(result, null, 2);

    // Write to file or stdout
    if (options.output) {
      await fs.writeFile(options.output, output, 'utf-8');
      console.log(`\nMerged configuration written to: ${options.output}`);
    } else {
      console.log('\n' + output);
    }

    // Display summary
    console.log('\n' + formatMergeResult(result));
  } catch (error) {
    console.error('Error during merge:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/**
 * Backup command handler.
 *
 * @param options - Command options
 */
export async function handleBackup(options: {
  output?: string;
  compress: string;
  source?: string;
}): Promise<void> {
  try {
    const sourcePath = options.source || path.join(process.cwd(), '.claude');

    console.log(`Creating backup of: ${sourcePath}`);
    console.log(`Compression level: ${options.compress}`);

    // Check if source exists
    try {
      await fs.access(sourcePath);
    } catch {
      throw new Error(`Source directory does not exist: ${sourcePath}`);
    }

    // Create backup
    const backupPath = await createBackup(
      sourcePath,
      options.output ? path.dirname(options.output) : undefined
    );

    console.log(`\n✓ Backup created successfully!`);
    console.log(`  Location: ${backupPath}`);
    console.log(`  Size: ${(await fs.stat(backupPath)).size} bytes`);

    // Validate backup
    const metadata = await validateBackup(backupPath);
    console.log(`  Files: ${metadata.fileCount}`);
    console.log(`  Valid: ${metadata.isValid ? 'YES' : 'NO'}`);
  } catch (error) {
    console.error('Error creating backup:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/**
 * Restore command handler.
 *
 * @param backupPath - Path to backup file
 * @param options - Command options
 */
export async function handleRestore(
  backupPath: string,
  options: { force: boolean; target?: string }
): Promise<void> {
  try {
    console.log(`Validating backup: ${backupPath}`);

    // Validate backup first
    const metadata = await validateBackup(backupPath);

    if (!metadata.isValid) {
      console.error('✗ Backup validation failed:');
      metadata.errors.forEach(err => console.error(`  - ${err}`));
      process.exit(1);
    }

    console.log('✓ Backup is valid');
    console.log(`  Files: ${metadata.fileCount}`);
    console.log(`  Created: ${metadata.timestamp.toISOString()}`);
    console.log(`  Source: ${metadata.sourcePath || 'unknown'}`);

    // Get restore target
    const restorePath = options.target || path.join(process.cwd(), '.claude');

    // Confirm unless --force
    if (!options.force) {
      console.log(`\nThis will restore to: ${restorePath}`);
      console.log('WARNING: This will overwrite existing files!');
      console.log('Use --force flag to skip this confirmation.');
      process.exit(0);
    }

    console.log(`\nRestoring to: ${restorePath}`);

    // Perform restore
    await restoreBackup(backupPath, restorePath);

    console.log('\n✓ Restore completed successfully!');
  } catch (error) {
    console.error('Error restoring backup:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/**
 * Fork discovery command handler.
 *
 * @param options - Command options
 */
export async function handleForkDiscover(options: {
  chat?: string;
  output?: string;
}): Promise<void> {
  try {
    console.log('Analyzing conversation history...');

    let conversationData: any;

    // Read conversation from file or stdin
    if (options.chat) {
      const content = await fs.readFile(options.chat, 'utf-8');
      conversationData = JSON.parse(content);
    } else {
      throw new Error('Please specify conversation history with --chat option');
    }

    // Parse conversation
    const conversation: Conversation = {
      messages: conversationData.messages || [],
      files: conversationData.files || [],
      timestamp: conversationData.timestamp || new Date().toISOString(),
      metadata: conversationData.metadata || {}
    };

    console.log(`  Messages: ${conversation.messages.length}`);
    console.log(`  Files: ${conversation.files.length}`);

    // Identify fork points
    const forkPoints = await identifyForkPoints(conversation);

    console.log(`\nFound ${forkPoints.length} potential fork points\n`);

    // Format results
    const results = {
      conversation: {
        messageCount: conversation.messages.length,
        fileCount: conversation.files.length,
        timestamp: conversation.timestamp
      },
      forkPoints: forkPoints.map((fp, idx) => ({
        id: idx + 1,
        type: fp.type,
        score: fp.score || 0,
        context: fp.context,
        files: fp.files,
        trainingData: fp.trainingData
      }))
    };

    // Output results
    const output = JSON.stringify(results, null, 2);

    if (options.output) {
      await fs.writeFile(options.output, output, 'utf-8');
      console.log(`Analysis written to: ${options.output}`);
    } else {
      console.log(output);
    }
  } catch (error) {
    console.error('Error during fork discovery:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/**
 * Audit command handler.
 *
 * @param options - Command options
 */
export async function handleAudit(options: {
  config?: string;
  severity: string;
}): Promise<void> {
  try {
    const configPath = options.config || path.join(process.cwd(), '.claude');

    console.log(`Auditing configuration: ${configPath}`);

    // Read config
    const config = await readConfig(configPath);

    // Create a mock MergeResult for auditing
    const mergeResult: MergeResult = {
      ...config,
      conflicts: [],
      stats: {
        projectsAnalyzed: 1,
        conflictsDetected: 0,
        autoResolved: 0
      }
    };

    // Run audit
    const audit = await auditMerge(mergeResult);

    // Filter by severity if needed
    const severityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
    const minSeverity = severityOrder[options.severity as keyof typeof severityOrder] || 1;

    const filteredAudit = {
      ...audit,
      issues: audit.issues.filter(issue =>
        severityOrder[issue.severity] >= minSeverity
      )
    };

    // Display results
    console.log(formatAuditResult(filteredAudit));

    // Exit with error code if audit failed
    if (!audit.passed) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Error during audit:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

/**
 * Validate command handler.
 *
 * @param configPath - Path to configuration file
 */
export async function handleValidate(configPath: string): Promise<void> {
  try {
    console.log(`Validating configuration: ${configPath}`);

    // Read config file
    const content = await fs.readFile(configPath, 'utf-8');
    const data = JSON.parse(content);

    // Define a basic schema for configuration
    const configSchema = z.object({
      permissions: z.array(z.string()).optional(),
      mcpServers: z.record(z.object({
        enabled: z.boolean(),
      })).optional(),
      mcp_servers: z.record(z.object({
        enabled: z.boolean(),
      })).optional(),
      settings: z.record(z.any()).optional()
    });

    // Validate
    validateSchema(data, configSchema);

    console.log('\n✓ Configuration is valid!');
    console.log(`  Permissions: ${data.permissions?.length || 0}`);
    console.log(`  MCP Servers: ${Object.keys(data.mcpServers || data.mcp_servers || {}).length}`);
    console.log(`  Settings: ${Object.keys(data.settings || {}).length}`);
  } catch (error) {
    console.error('\n✗ Validation failed:');

    if (error instanceof ValidationError) {
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    } else if (error instanceof Error) {
      console.error(`  ${error.message}`);
    } else {
      console.error(`  ${String(error)}`);
    }

    process.exit(1);
  }
}
