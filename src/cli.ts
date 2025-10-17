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
import { Menu } from './tui/Menu.js';

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
    const menuItems = [
      { id: '1', title: 'Configuration Manager', icon: '⚙️' },
      { id: '2', title: 'Merge Configurations', icon: '🔀' },
      { id: '3', title: 'Fork Discovery', icon: '🔍' },
      { id: '4', title: 'Backup & Restore', icon: '💾' },
      { id: '5', title: 'Security Audit', icon: '🔒' },
      { id: '6', title: 'Settings', icon: '🎛️' },
      { id: '7', title: 'Exit', icon: '🚪' }
    ];

    const { clear } = render(
      React.createElement(Menu, {
        items: menuItems,
        onSelect: (item) => {
          if (item.id === '7') {
            clear();
            process.exit(0);
          }
          console.log(`Selected: ${item.title}`);
        },
        onExit: () => {
          clear();
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
  .action((options) => {
    console.log('Merge command not yet implemented');
    console.log('Strategy:', options.strategy);
    console.log('Output:', options.output || 'stdout');
  });

program
  .command('backup')
  .description('Create backup of current configuration')
  .option('-o, --output <path>', 'Output path for backup')
  .option('-c, --compress <level>', 'Compression level (1-9)', '9')
  .action((options) => {
    console.log('Backup command not yet implemented');
    console.log('Output:', options.output || './backup.tar.gz');
    console.log('Compression:', options.compress);
  });

program
  .command('restore')
  .description('Restore configuration from backup')
  .argument('<backup-path>', 'Path to backup file')
  .option('-f, --force', 'Force restore without confirmation')
  .action((backupPath, options) => {
    console.log('Restore command not yet implemented');
    console.log('Backup path:', backupPath);
    console.log('Force:', options.force || false);
  });

program
  .command('fork-discover')
  .description('Discover fork points from conversation history')
  .option('-c, --chat <path>', 'Path to conversation history')
  .option('-o, --output <path>', 'Output path for analysis')
  .action((options) => {
    console.log('Fork discovery command not yet implemented');
    console.log('Chat history:', options.chat || 'stdin');
    console.log('Output:', options.output || 'stdout');
  });

program
  .command('audit')
  .description('Run security audit on configuration')
  .option('-c, --config <path>', 'Path to configuration file')
  .option('-s, --severity <level>', 'Minimum severity to report (low|medium|high|critical)', 'medium')
  .action((options) => {
    console.log('Security audit command not yet implemented');
    console.log('Config:', options.config || '.claude/');
    console.log('Severity:', options.severity);
  });

program
  .command('validate')
  .description('Validate configuration schema')
  .argument('<config-path>', 'Path to configuration file')
  .action((configPath) => {
    console.log('Validation command not yet implemented');
    console.log('Config path:', configPath);
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
