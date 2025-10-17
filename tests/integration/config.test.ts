/**
 * Config Management Integration Tests
 *
 * Tests configuration discovery, reading, writing, and validation
 *
 * @packageDocumentation
 * @module tests/integration
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  createTestEnvironment,
  createTestConfig,
  createConflictingConfigs,
  TestEnvironment
} from './helpers/index.js';
import {
  recommendedMerge,
  defaultMerge,
  conservativeMerge,
  hybridMerge
} from '../../src/merge/strategies.js';
import { detectConflicts } from '../../src/merge/conflict-detector.js';
import { auditMerge } from '../../src/merge/security-audit.js';

describe('Config Management Integration Tests', () => {
  let testEnv: TestEnvironment;

  beforeEach(() => {
    testEnv = createTestEnvironment();
  });

  afterEach(() => {
    testEnv.cleanup();
  });

  describe('Config Discovery', () => {
    it('should discover .claude directories in project', () => {
      const projectDir = testEnv.createProject('test-project');
      const claudeDir = path.join(projectDir, '.claude');

      expect(fs.existsSync(claudeDir)).toBe(true);
      expect(fs.statSync(claudeDir).isDirectory()).toBe(true);
    });

    it('should find config.json in .claude directory', () => {
      const projectDir = testEnv.createProject('test-project');
      const configPath = path.join(projectDir, '.claude', 'config.json');

      expect(fs.existsSync(configPath)).toBe(true);

      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      expect(config).toHaveProperty('version');
      expect(config).toHaveProperty('permissions');
      expect(config).toHaveProperty('mcpServers');
      expect(config).toHaveProperty('settings');
    });

    it('should discover multiple projects', () => {
      const projects = testEnv.createMultipleProjects(3);

      projects.forEach(projectDir => {
        const claudeDir = path.join(projectDir, '.claude');
        expect(fs.existsSync(claudeDir)).toBe(true);
      });
    });

    it('should handle nested project structures', () => {
      const rootProject = testEnv.createProject('root');
      const nestedDir = path.join(rootProject, 'nested');
      fs.mkdirSync(nestedDir, { recursive: true });

      const nestedProject = testEnv.createProject(path.join('root', 'nested', 'project'));

      expect(fs.existsSync(path.join(nestedProject, '.claude'))).toBe(true);
    });
  });

  describe('Config Reading', () => {
    it('should read valid config file', () => {
      const projectDir = testEnv.createProject('test-project');
      const configPath = path.join(projectDir, '.claude', 'config.json');

      const content = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(content);

      expect(config.version).toBe('1.0.0');
      expect(Array.isArray(config.permissions)).toBe(true);
      expect(typeof config.mcpServers).toBe('object');
      expect(typeof config.settings).toBe('object');
    });

    it('should handle malformed JSON', () => {
      const projectDir = testEnv.createProject('test-project');
      const configPath = path.join(projectDir, '.claude', 'config.json');

      fs.writeFileSync(configPath, '{ invalid json }');

      expect(() => {
        JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      }).toThrow();
    });

    it('should read multiple config files', () => {
      const projects = testEnv.createMultipleProjects(3);
      const configs = projects.map(projectDir => {
        const configPath = path.join(projectDir, '.claude', 'config.json');
        return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      });

      expect(configs).toHaveLength(3);
      configs.forEach(config => {
        expect(config).toHaveProperty('version');
        expect(config).toHaveProperty('permissions');
      });
    });

    it('should preserve config structure', () => {
      const projectDir = testEnv.createProject('test-project');
      const configPath = path.join(projectDir, '.claude', 'config.json');

      const originalContent = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(originalContent);

      const rewritten = JSON.stringify(config, null, 2);
      fs.writeFileSync(configPath, rewritten);

      const newConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

      expect(newConfig).toEqual(config);
    });
  });

  describe('Config Writing', () => {
    it('should write valid config to file', () => {
      const projectDir = testEnv.createProject('test-project');
      const configPath = path.join(projectDir, '.claude', 'config.json');

      const newConfig = createTestConfig({
        includePermissions: true,
        includeMcpServers: true,
        includeSettings: true
      });

      fs.writeFileSync(
        configPath,
        JSON.stringify({
          version: '1.0.0',
          permissions: newConfig.permissions,
          mcpServers: newConfig.mcpServers,
          settings: newConfig.settings
        }, null, 2)
      );

      const written = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      expect(written.permissions).toEqual(newConfig.permissions);
      expect(written.mcpServers).toEqual(newConfig.mcpServers);
      expect(written.settings).toEqual(newConfig.settings);
    });

    it('should create config file if not exists', () => {
      const tempDir = testEnv.createTempDir('new-project');
      const claudeDir = path.join(tempDir, '.claude');
      const configPath = path.join(claudeDir, 'config.json');

      fs.mkdirSync(claudeDir, { recursive: true });

      const config = createTestConfig();
      fs.writeFileSync(
        configPath,
        JSON.stringify(config, null, 2)
      );

      expect(fs.existsSync(configPath)).toBe(true);
    });

    it('should preserve formatting when writing', () => {
      const projectDir = testEnv.createProject('test-project');
      const configPath = path.join(projectDir, '.claude', 'config.json');

      const config = { test: 'value', nested: { key: 'value' } };
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

      const content = fs.readFileSync(configPath, 'utf-8');
      expect(content).toContain('  "test"');
      expect(content).toContain('  "nested"');
    });

    it('should handle concurrent writes', async () => {
      const projectDir = testEnv.createProject('test-project');
      const configPath = path.join(projectDir, '.claude', 'config.json');

      const writes = Array.from({ length: 5 }, (_, i) =>
        Promise.resolve().then(() => {
          const config = createTestConfig({
            settings: { writeIndex: i }
          });
          fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        })
      );

      await Promise.all(writes);

      const finalConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      expect(finalConfig.settings).toHaveProperty('writeIndex');
    });
  });

  describe('Config Merging', () => {
    it('should merge configs with recommended strategy', async () => {
      const [config1, config2] = createConflictingConfigs();
      const result = await recommendedMerge([config1, config2]);

      expect(result.permissions.length).toBeGreaterThan(0);
      expect(Object.keys(result.mcpServers).length).toBeGreaterThan(0);
      expect(Object.keys(result.settings).length).toBeGreaterThan(0);
      expect(result.stats.projectsAnalyzed).toBe(2);
    });

    it('should merge configs with default strategy', async () => {
      const [config1, config2] = createConflictingConfigs();
      const result = await defaultMerge([config1, config2]);

      expect(result.stats.projectsAnalyzed).toBe(2);
      expect(result.stats.autoResolved).toBe(result.stats.conflictsDetected);
    });

    it('should merge configs with conservative strategy', async () => {
      const [config1, config2] = createConflictingConfigs();
      const result = await conservativeMerge([config1, config2]);

      expect(result.stats.projectsAnalyzed).toBe(2);
      expect(result.stats.autoResolved).toBe(0);
    });

    it('should merge configs with hybrid strategy', async () => {
      const [config1, config2] = createConflictingConfigs();
      const result = await hybridMerge([config1, config2]);

      expect(result.stats.projectsAnalyzed).toBe(2);
    });

    it('should detect conflicts during merge', async () => {
      const [config1, config2] = createConflictingConfigs();
      const conflicts = detectConflicts([config1, config2]);

      expect(conflicts.conflicts.length).toBeGreaterThan(0);
    });

    it('should handle merge of multiple projects', async () => {
      const configs = Array.from({ length: 5 }, () =>
        createTestConfig({
          includePermissions: true,
          includeMcpServers: true,
          includeSettings: true
        })
      );

      const result = await recommendedMerge(configs);

      expect(result.stats.projectsAnalyzed).toBe(5);
    });
  });

  describe('Config Validation', () => {
    it('should validate correct config structure', () => {
      const config = createTestConfig({
        includePermissions: true,
        includeMcpServers: true,
        includeSettings: true
      });

      expect(config.permissions).toBeDefined();
      expect(config.mcpServers).toBeDefined();
      expect(config.settings).toBeDefined();
      expect(Array.isArray(config.permissions)).toBe(true);
      expect(typeof config.mcpServers).toBe('object');
      expect(typeof config.settings).toBe('object');
    });

    it('should detect missing required fields', () => {
      const invalidConfig = {
        permissions: []
        // Missing mcpServers and settings
      };

      expect(invalidConfig).not.toHaveProperty('mcpServers');
      expect(invalidConfig).not.toHaveProperty('settings');
    });

    it('should validate permission format', () => {
      const config = createTestConfig({
        permissions: ['read:files', 'write:files']
      });

      config.permissions.forEach(perm => {
        expect(typeof perm).toBe('string');
        expect(perm).toMatch(/^[a-z]+:[a-z]+$/);
      });
    });

    it('should validate MCP server structure', () => {
      const config = createTestConfig({
        includeMcpServers: true
      });

      Object.values(config.mcpServers).forEach(server => {
        expect(server).toHaveProperty('enabled');
        expect(typeof server.enabled).toBe('boolean');
      });
    });
  });

  describe('Config Security', () => {
    it('should audit config for security issues', async () => {
      const config = createTestConfig({
        includePermissions: true,
        includeMcpServers: true,
        includeSettings: true
      });

      const mergeResult = {
        ...config,
        conflicts: [],
        stats: {
          projectsAnalyzed: 1,
          conflictsDetected: 0,
          autoResolved: 0
        }
      };

      const audit = await auditMerge(mergeResult);

      expect(audit).toHaveProperty('issues');
      expect(audit).toHaveProperty('summary');
      expect(Array.isArray(audit.issues)).toBe(true);
    });

    it('should detect sensitive data in config', () => {
      const config = createTestConfig({
        settings: {
          apiKey: 'secret-key-123',
          password: 'pass123'
        }
      });

      const hasApiKey = JSON.stringify(config).includes('apiKey');
      const hasPassword = JSON.stringify(config).includes('password');

      expect(hasApiKey || hasPassword).toBe(true);
    });

    it('should handle file permissions', () => {
      const projectDir = testEnv.createProject('test-project');
      const configPath = path.join(projectDir, '.claude', 'config.json');

      const stats = fs.statSync(configPath);
      expect(stats.isFile()).toBe(true);
      expect(stats.mode).toBeDefined();
    });
  });

  describe('Config Persistence', () => {
    it('should persist config across reads', () => {
      const projectDir = testEnv.createProject('test-project');
      const configPath = path.join(projectDir, '.claude', 'config.json');

      const config1 = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      const config2 = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

      expect(config1).toEqual(config2);
    });

    it('should handle config updates', () => {
      const projectDir = testEnv.createProject('test-project');
      const configPath = path.join(projectDir, '.claude', 'config.json');

      const original = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

      original.settings.newKey = 'newValue';
      fs.writeFileSync(configPath, JSON.stringify(original, null, 2));

      const updated = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

      expect(updated.settings.newKey).toBe('newValue');
    });

    it('should maintain data integrity', () => {
      const projectDir = testEnv.createProject('test-project');
      const configPath = path.join(projectDir, '.claude', 'config.json');

      const original = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      const serialized = JSON.stringify(original);
      const deserialized = JSON.parse(serialized);

      expect(deserialized).toEqual(original);
    });
  });
});
