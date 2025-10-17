/**
 * CLI Integration Tests
 *
 * Tests all CLI commands end-to-end with real file operations
 *
 * @packageDocumentation
 * @module tests/integration
 */

import * as path from 'path';
import {
  execCLI,
  execCLIExpectSuccess,
  execCLIExpectFailure,
  createTestEnvironment,
  createTestConfig,
  createConflictingConfigs,
  TestEnvironment
} from './helpers/index.js';

describe('CLI Integration Tests', () => {
  let testEnv: TestEnvironment;

  beforeEach(() => {
    testEnv = createTestEnvironment();
  });

  afterEach(() => {
    testEnv.cleanup();
  });

  describe('Help Command', () => {
    it('should display help with no arguments', async () => {
      const result = await execCLI([]);

      expect(result.stdout).toContain('Claude Code Environment Manager');
      expect(result.stdout).toContain('Usage:');
      expect(result.stdout).toContain('Commands:');
    });

    it('should display help with --help flag', async () => {
      const result = await execCLIExpectSuccess(['--help']);

      expect(result.stdout).toContain('Claude Code Environment Manager');
      expect(result.stdout).toContain('interactive');
      expect(result.stdout).toContain('merge');
      expect(result.stdout).toContain('backup');
    });

    it('should display version with --version flag', async () => {
      const result = await execCLIExpectSuccess(['--version']);

      expect(result.stdout).toContain('1.0.0');
    });
  });

  describe('Interactive/TUI Command', () => {
    it('should launch interactive TUI', async () => {
      const result = await execCLI(['interactive'], {
        timeout: 2000,
        input: '\x1B' // ESC to exit
      });

      expect(result.stdout).toContain('Main Menu');
      expect(result.stdout).toContain('Configuration Manager');
      expect(result.stdout).toContain('Merge Configurations');
    });

    it('should launch with tui alias', async () => {
      const result = await execCLI(['tui'], {
        timeout: 2000,
        input: '\x1B'
      });

      expect(result.stdout).toContain('Main Menu');
    });
  });

  describe('Merge Command', () => {
    it('should display not implemented message', async () => {
      const result = await execCLI(['merge']);

      expect(result.stdout).toContain('Merge command not yet implemented');
      expect(result.stdout).toContain('Strategy: recommended');
    });

    it('should accept strategy option', async () => {
      const result = await execCLI(['merge', '--strategy', 'conservative']);

      expect(result.stdout).toContain('Strategy: conservative');
    });

    it('should accept output option', async () => {
      const outputPath = testEnv.getPath('merged.json');
      const result = await execCLI(['merge', '--output', outputPath]);

      expect(result.stdout).toContain(`Output: ${outputPath}`);
    });

    it('should use default output when not specified', async () => {
      const result = await execCLI(['merge']);

      expect(result.stdout).toContain('Output: stdout');
    });

    it('should accept short option flags', async () => {
      const result = await execCLI(['merge', '-s', 'hybrid', '-o', '/tmp/out.json']);

      expect(result.stdout).toContain('strategy: hybrid');
      expect(result.stdout).toContain('/tmp/out.json');
    });

    it('should reject invalid strategy', async () => {
      const result = await execCLIExpectFailure(['merge', '--strategy', 'invalid']);

      expect(result.stderr).toContain('invalid');
    });
  });

  describe('Backup Command', () => {
    it('should create backup with default options', async () => {
      const result = await execCLI(['backup']);

      expect(result.stdout).toContain('Creating backup');
      expect(result.stdout).toContain('Compression level: 9');
    });

    it('should accept output option', async () => {
      const outputPath = testEnv.getPath('backup.tar.gz');
      const result = await execCLI(['backup', '--output', outputPath]);

      expect(result.stdout).toContain(`Output: ${outputPath}`);
    });

    it('should use default output path', async () => {
      const result = await execCLI(['backup']);

      expect(result.stdout).toContain('Output: ./backup.tar.gz');
    });

    it('should accept compression level', async () => {
      const result = await execCLI(['backup', '--compress', '5']);

      expect(result.stdout).toContain('Compression: 5');
    });

    it('should accept short option flags', async () => {
      const result = await execCLI(['backup', '-o', '/tmp/backup.tar.gz', '-c', '7']);

      expect(result.stdout).toContain('Output: /tmp/backup.tar.gz');
      expect(result.stdout).toContain('Compression: 7');
    });

    it('should reject invalid compression level', async () => {
      const result = await execCLIExpectFailure(['backup', '--compress', '10']);

      expect(result.stderr.length).toBeGreaterThan(0);
    });
  });

  describe('Restore Command', () => {
    it('should display not implemented message', async () => {
      const backupPath = '/tmp/backup.tar.gz';
      const result = await execCLI(['restore', backupPath]);

      expect(result.stdout).toContain('Restore command not yet implemented');
      expect(result.stdout).toContain(`Backup path: ${backupPath}`);
      expect(result.stdout).toContain('Force: false');
    });

    it('should require backup path argument', async () => {
      const result = await execCLIExpectFailure(['restore']);

      expect(result.stderr).toContain('required');
    });

    it('should accept force option', async () => {
      const result = await execCLI(['restore', '/tmp/backup.tar.gz', '--force']);

      expect(result.stdout).toContain('Force: true');
    });

    it('should accept short force flag', async () => {
      const result = await execCLI(['restore', '/tmp/backup.tar.gz', '-f']);

      expect(result.stdout).toContain('Force: true');
    });
  });

  describe('Fork Discovery Command', () => {
    it('should display not implemented message', async () => {
      const result = await execCLI(['fork-discover']);

      expect(result.stdout).toContain('Fork discovery command not yet implemented');
      expect(result.stdout).toContain('Chat history: stdin');
      expect(result.stdout).toContain('Output: stdout');
    });

    it('should accept chat history path', async () => {
      const chatPath = testEnv.getPath('chat.json');
      const result = await execCLI(['fork-discover', '--chat', chatPath]);

      expect(result.stdout).toContain(`Chat history: ${chatPath}`);
    });

    it('should accept output option', async () => {
      const outputPath = testEnv.getPath('forks.json');
      const result = await execCLI(['fork-discover', '--output', outputPath]);

      expect(result.stdout).toContain(`Output: ${outputPath}`);
    });

    it('should accept short option flags', async () => {
      const result = await execCLI([
        'fork-discover',
        '-c', '/tmp/chat.json',
        '-o', '/tmp/forks.json'
      ]);

      expect(result.stdout).toContain('Chat history: /tmp/chat.json');
      expect(result.stdout).toContain('Output: /tmp/forks.json');
    });
  });

  describe('Audit Command', () => {
    it('should display not implemented message', async () => {
      const result = await execCLI(['audit']);

      expect(result.stdout).toContain('Security audit command not yet implemented');
      expect(result.stdout).toContain('Config: .claude/');
      expect(result.stdout).toContain('Severity: medium');
    });

    it('should accept config path', async () => {
      const configPath = testEnv.getPath('.claude');
      const result = await execCLI(['audit', '--config', configPath]);

      expect(result.stdout).toContain(`Config: ${configPath}`);
    });

    it('should accept severity level', async () => {
      const result = await execCLI(['audit', '--severity', 'critical']);

      expect(result.stdout).toContain('Severity: critical');
    });

    it('should use default severity', async () => {
      const result = await execCLI(['audit']);

      expect(result.stdout).toContain('Severity: medium');
    });

    it('should accept short option flags', async () => {
      const result = await execCLI(['audit', '-c', '/tmp/.claude', '-s', 'high']);

      expect(result.stdout).toContain('Config: /tmp/.claude');
      expect(result.stdout).toContain('Severity: high');
    });

    it('should reject invalid severity level', async () => {
      const result = await execCLIExpectFailure(['audit', '--severity', 'invalid']);

      expect(result.stderr).toContain('invalid');
    });
  });

  describe('Validate Command', () => {
    it('should display not implemented message', async () => {
      const configPath = testEnv.getPath('config.json');
      const result = await execCLI(['validate', configPath]);

      expect(result.stdout).toContain('Validation command not yet implemented');
      expect(result.stdout).toContain(`Config path: ${configPath}`);
    });

    it('should require config path argument', async () => {
      const result = await execCLIExpectFailure(['validate']);

      expect(result.stderr).toContain('required');
    });

    it('should accept relative paths', async () => {
      const result = await execCLI(['validate', './config.json']);

      expect(result.stdout).toContain('Config path: ./config.json');
    });

    it('should accept absolute paths', async () => {
      const absolutePath = testEnv.getPath('config.json');
      const result = await execCLI(['validate', absolutePath]);

      expect(result.stdout).toContain(`Config path: ${absolutePath}`);
    });
  });

  describe('Command Execution', () => {
    it('should handle invalid commands gracefully', async () => {
      const result = await execCLIExpectFailure(['invalid-command']);

      expect(result.stderr).toContain('unknown');
    });

    it('should handle missing required arguments', async () => {
      const result = await execCLIExpectFailure(['restore']);

      expect(result.stderr).toContain('required');
    });

    it('should timeout long-running commands', async () => {
      await expect(
        execCLI(['interactive'], { timeout: 100 })
      ).rejects.toThrow('timed out');
    });

    it('should propagate errors correctly', async () => {
      const result = await execCLIExpectFailure(['--invalid-flag']);

      expect(result.exitCode).not.toBe(0);
      expect(result.success).toBe(false);
    });
  });

  describe('Environment and Options', () => {
    it('should respect working directory option', async () => {
      const projectDir = testEnv.createProject('test-project');
      const result = await execCLI(['audit'], { cwd: projectDir });

      expect(result.stdout).toContain('Security audit');
    });

    it('should respect environment variables', async () => {
      const result = await execCLI(['--help'], {
        env: { NODE_ENV: 'test' }
      });

      expect(result.success).toBe(true);
    });

    it('should handle stdin input', async () => {
      const result = await execCLI(['interactive'], {
        input: '\x1B', // ESC key
        timeout: 2000
      });

      expect(result.stdout).toContain('Main Menu');
    });
  });

  describe('Performance', () => {
    it('should execute help command quickly', async () => {
      const result = await execCLIExpectSuccess(['--help']);

      expect(result.executionTime).toBeLessThan(2000);
    });

    it('should execute version command quickly', async () => {
      const result = await execCLIExpectSuccess(['--version']);

      expect(result.executionTime).toBeLessThan(1000);
    });

    it('should handle multiple rapid commands', async () => {
      const promises = Array.from({ length: 5 }, () =>
        execCLI(['--version'])
      );

      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.stdout).toContain('1.0.0');
      });
    });
  });
});
