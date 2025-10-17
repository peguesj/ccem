#!/usr/bin/env node

/**
 * CCEM CLI Entry Point
 *
 * Command-line interface for Claude Code Environment Manager.
 * Provides interactive TUI and command-line operations.
 *
 * @packageDocumentation
 * @module cli
 * @version 1.0.0
 */

import { Command } from 'commander';
import React from 'react';
import { render } from 'ink';
import { App } from './tui/App.js';
import {
  handleMerge,
  handleBackup,
  handleRestore,
  handleForkDiscover,
  handleAudit,
  handleValidate
} from './cli/commands.js';

const program = new Command();

program
  .name('ccem')
  .description('Claude Code Environment Manager - TUI-based configuration management')
  .version('1.0.0');

program
  .command('interactive')
  .alias('tui')
  .description('Launch interactive TUI menu')
  .action(() => {
    const { clear, unmount } = render(
      React.createElement(App, {
        initialView: 'menu',
        onExit: () => {
          clear();
          unmount();
          process.exit(0);
        }
      })
    );
  });

program
  .command('merge')
  .description('Merge configurations from multiple projects')
  .option('-s, --strategy <type>', 'Merge strategy (recommended|default|conservative|hybrid|custom)', 'recommended')
  .option('-o, --output <path>', 'Output path for merged configuration')
  .option('-c, --config <paths...>', 'Configuration paths to merge')
  .action(async (options) => {
    try {
      await handleMerge(options);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('backup')
  .description('Create backup of current configuration')
  .option('-o, --output <path>', 'Output path for backup')
  .option('-c, --compress <level>', 'Compression level (1-9)', '9')
  .option('-s, --source <path>', 'Source directory to backup')
  .action(async (options) => {
    try {
      await handleBackup(options);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('restore')
  .description('Restore configuration from backup')
  .argument('<backup-path>', 'Path to backup file')
  .option('-f, --force', 'Force restore without confirmation')
  .option('-t, --target <path>', 'Target directory for restore')
  .action(async (backupPath, options) => {
    try {
      await handleRestore(backupPath, options);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('fork-discover')
  .description('Discover fork points from conversation history')
  .option('-c, --chat <path>', 'Path to conversation history')
  .option('-o, --output <path>', 'Output path for analysis')
  .action(async (options) => {
    try {
      await handleForkDiscover(options);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('audit')
  .description('Run security audit on configuration')
  .option('-c, --config <path>', 'Path to configuration file')
  .option('-s, --severity <level>', 'Minimum severity to report (low|medium|high|critical)', 'medium')
  .action(async (options) => {
    try {
      await handleAudit(options);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Validate configuration schema')
  .argument('<config-path>', 'Path to configuration file')
  .action(async (configPath) => {
    try {
      await handleValidate(configPath);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Default action: show interactive TUI
program.action(() => {
  program.help();
});

// Parse command-line arguments
program.parse(process.argv);

// If no command specified, show help
if (!process.argv.slice(2).length) {
  program.help();
}
