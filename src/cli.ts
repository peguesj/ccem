#!/usr/bin/env node

/**
 * CCEM CLI Entry Point
 *
 * Command-line interface for Claude Code Environment Manager.
 * Provides interactive TUI and command-line operations.
 *
 * @packageDocumentation
 * @module cli
 * @version 4.0.0
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
  .version('4.0.0');

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

program
  .command('docksock [action]')
  .description('Docker socket repair utility (macOS)')
  .option('--force', 'Skip confirmation prompts')
  .option('--verbose', 'Show diagnostic detail')
  .option('--no-restart', 'Repair socket only, skip Docker restart')
  .action(async (action: string | undefined, options: { force?: boolean; verbose?: boolean; restart?: boolean }) => {
    const { execSync } = await import('child_process');
    const { existsSync } = await import('fs');
    const os = await import('os');
    const path = await import('path');

    const home = os.homedir();
    const symlinkPath = path.join(home, '.docker', 'run', 'docker.sock');
    const rawSocketPath = path.join(home, 'Library', 'Containers', 'com.docker.docker', 'Data', 'docker.raw.sock');

    const run = (cmd: string): string | null => {
      try { return execSync(cmd, { timeout: 10000, encoding: 'utf-8' }).trim(); }
      catch { return null; }
    };

    const isSocket = (p: string) => existsSync(p);
    const dockerWorks = () => run('docker info') !== null;

    const verbose = (msg: string) => { if (options.verbose) console.log(`  [dbg] ${msg}`); };

    const getStatus = (): string => {
      verbose(`symlink: ${symlinkPath} exists=${isSocket(symlinkPath)}`);
      verbose(`raw: ${rawSocketPath} exists=${isSocket(rawSocketPath)}`);
      if (isSocket(symlinkPath) && dockerWorks()) return 'ok';
      if (!isSocket(rawSocketPath)) {
        const dockerRunning = run('pgrep -f "Docker Desktop"');
        return dockerRunning ? 'missing_raw_socket' : 'docker_not_running';
      }
      return 'missing_symlink';
    };

    const repair = (): boolean => {
      execSync(`mkdir -p "${path.dirname(symlinkPath)}"`);
      try { execSync(`rm -f "${symlinkPath}"`); } catch {}
      try {
        execSync(`ln -sf "${rawSocketPath}" "${symlinkPath}"`);
        console.log(`  Symlink: ${symlinkPath} -> ${rawSocketPath}`);
        return true;
      } catch (e) {
        console.error(`  Failed to create symlink: ${e}`);
        return false;
      }
    };

    switch (action || 'status') {
      case 'status': {
        const s = getStatus();
        console.log(`Docker socket: ${s}`);
        if (s === 'ok') { run('docker info')?.split('\n').filter(l => /Server Version|Containers|Images/.test(l)).forEach(l => console.log(`  ${l.trim()}`)); }
        process.exit(s === 'ok' ? 0 : 1);
        break;
      }
      case 'repair': {
        const s = getStatus();
        if (s === 'ok') { console.log('Docker socket: OK (no repair needed)'); process.exit(0); }
        if (s === 'missing_symlink') {
          if (repair() && dockerWorks()) { console.log('Docker socket repaired'); process.exit(0); }
        }
        if ((s === 'missing_raw_socket' || s === 'docker_not_running') && options.restart !== false) {
          console.log('Raw socket missing — restarting Docker Desktop...');
          run('pkill -f "Docker Desktop"'); run('pkill -f "com.docker"');
          execSync('sleep 2');
          run('open -a Docker');
          console.log('Waiting for Docker engine...');
          for (let i = 0; i < 30; i++) {
            execSync('sleep 2');
            if (isSocket(rawSocketPath)) { repair(); break; }
          }
          if (dockerWorks()) { console.log('Docker socket repaired after restart'); process.exit(0); }
        }
        console.error('Repair failed');
        process.exit(1);
        break;
      }
      case 'restart': {
        console.log('Restarting Docker Desktop...');
        run('pkill -f "Docker Desktop"'); run('pkill -f "com.docker"');
        execSync('sleep 3');
        try { execSync(`rm -f "${symlinkPath}"`); } catch {}
        run('open -a Docker');
        console.log('Waiting for Docker engine...');
        for (let i = 0; i < 30; i++) {
          execSync('sleep 2');
          if (isSocket(rawSocketPath)) { repair(); break; }
        }
        if (dockerWorks()) { console.log('Docker fully operational'); process.exit(0); }
        console.log('Docker started but daemon not yet responding');
        process.exit(1);
        break;
      }
      case 'nuke': {
        if (!options.force) {
          console.log('WARNING: This removes all Docker containers, images, and volumes.');
          console.log('Use --force to confirm.');
          process.exit(1);
        }
        console.log('Nuking Docker VM state...');
        run('pkill -f "Docker Desktop"'); run('pkill -f "com.docker"');
        execSync('sleep 3');
        execSync(`rm -rf "${path.join(home, 'Library/Containers/com.docker.docker/Data/vms')}"`, { stdio: 'ignore' });
        execSync(`rm -f "${rawSocketPath}"`, { stdio: 'ignore' });
        execSync(`rm -f "${symlinkPath}"`, { stdio: 'ignore' });
        run('open -a Docker');
        console.log('Docker VM data cleared. Restarting...');
        for (let i = 0; i < 30; i++) {
          execSync('sleep 2');
          if (isSocket(rawSocketPath)) { repair(); break; }
        }
        process.exit(0);
        break;
      }
      default:
        console.error(`Unknown action: ${action}. Use: status, repair, restart, nuke`);
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
