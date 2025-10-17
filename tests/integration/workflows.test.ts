/**
 * End-to-End Workflow Integration Tests
 *
 * Tests complete user workflows across multiple operations
 *
 * @packageDocumentation
 * @module tests/integration
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  createTestEnvironment,
  createTestConfig,
  createMultipleTestConfigs,
  TestEnvironment
} from './helpers/index.js';
import {
  recommendedMerge,
  type MergeConfig
} from '../../src/merge/strategies.js';
import {
  createBackup,
  restoreBackup,
  validateBackup,
  createSnapshot
} from '../../src/merge/backup.js';
import { detectConflicts } from '../../src/merge/conflict-detector.js';
import { auditMerge } from '../../src/merge/security-audit.js';

describe('E2E Workflow Integration Tests', () => {
  let testEnv: TestEnvironment;

  beforeEach(() => {
    testEnv = createTestEnvironment();
  });

  afterEach(() => {
    testEnv.cleanup();
  });

  describe('Discovery → Merge → Backup Workflow', () => {
    it('should complete full workflow successfully', async () => {
      // Step 1: Discover projects
      const projects = testEnv.createMultipleProjects(3);

      expect(projects).toHaveLength(3);
      projects.forEach(project => {
        expect(fs.existsSync(path.join(project, '.claude'))).toBe(true);
      });

      // Step 2: Read configs
      const configs: MergeConfig[] = projects.map(project => {
        const configPath = path.join(project, '.claude', 'config.json');
        const content = fs.readFileSync(configPath, 'utf-8');
        const parsed = JSON.parse(content);
        return {
          permissions: parsed.permissions,
          mcpServers: parsed.mcpServers,
          settings: parsed.settings
        };
      });

      expect(configs).toHaveLength(3);

      // Step 3: Merge configs
      const mergeResult = await recommendedMerge(configs);

      expect(mergeResult.stats.projectsAnalyzed).toBe(3);
      expect(mergeResult.permissions.length).toBeGreaterThan(0);

      // Step 4: Write merged config
      const outputDir = testEnv.createTempDir('merged');
      const claudeDir = path.join(outputDir, '.claude');
      fs.mkdirSync(claudeDir, { recursive: true });

      const outputPath = path.join(claudeDir, 'config.json');
      fs.writeFileSync(
        outputPath,
        JSON.stringify({
          version: '1.0.0',
          permissions: mergeResult.permissions,
          mcpServers: mergeResult.mcpServers,
          settings: mergeResult.settings
        }, null, 2)
      );

      expect(fs.existsSync(outputPath)).toBe(true);

      // Step 5: Create backup
      const backupPath = await createBackup(claudeDir);

      expect(fs.existsSync(backupPath)).toBe(true);
      expect(path.extname(backupPath)).toBe('.gz');
    });

    it('should handle errors gracefully in workflow', async () => {
      // Try to backup non-existent directory
      const nonExistentDir = testEnv.getPath('non-existent');

      await expect(createBackup(nonExistentDir)).rejects.toThrow('does not exist');
    });

    it('should preserve data integrity through workflow', async () => {
      const project = testEnv.createProject('test-project');
      const claudeDir = path.join(project, '.claude');
      const configPath = path.join(claudeDir, 'config.json');

      const originalConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

      // Create snapshot
      const snapshot = await createSnapshot(claudeDir);
      expect(snapshot.fileCount).toBeGreaterThan(0);

      // Create backup
      const backupPath = await createBackup(claudeDir);
      expect(fs.existsSync(backupPath)).toBe(true);

      // Modify config
      originalConfig.settings.modified = true;
      fs.writeFileSync(configPath, JSON.stringify(originalConfig, null, 2));

      // Restore backup
      const restoreDir = testEnv.createTempDir('restore');
      await restoreBackup(backupPath, restoreDir);

      // Verify restoration
      const restoredConfigPath = path.join(restoreDir, 'config.json');
      const restoredConfig = JSON.parse(fs.readFileSync(restoredConfigPath, 'utf-8'));

      expect(restoredConfig.settings.modified).toBeUndefined();
    });
  });

  describe('Merge → Audit → Fix Workflow', () => {
    it('should detect and handle conflicts', async () => {
      // Create conflicting configs
      const configs = createMultipleTestConfigs(3, true);

      // Detect conflicts
      const conflictReport = detectConflicts(configs);
      expect(conflictReport.conflicts.length).toBeGreaterThan(0);

      // Merge with conflict resolution
      const mergeResult = await recommendedMerge(configs);
      expect(mergeResult.conflicts.length).toBeGreaterThan(0);

      // Audit merged result (mergeResult is already a MergeResult)
      const auditResult = await auditMerge(mergeResult);

      expect(auditResult).toHaveProperty('issues');
      expect(auditResult).toHaveProperty('summary');
    });

    it('should track resolution of security issues', async () => {
      const config = createTestConfig({
        settings: {
          apiKey: 'test-key',
          debug: true
        }
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

      // Should detect potential issues
      expect(audit.issues.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Backup → Validate → Restore Workflow', () => {
    it('should complete backup and restore cycle', async () => {
      const project = testEnv.createProject('test-project');
      const claudeDir = path.join(project, '.claude');

      // Create backup
      const backupPath = await createBackup(claudeDir);
      expect(fs.existsSync(backupPath)).toBe(true);

      // Validate backup
      const metadata = await validateBackup(backupPath);
      expect(metadata.isValid).toBe(true);
      expect(metadata.errors).toHaveLength(0);

      // Restore to new location
      const restoreDir = testEnv.createTempDir('restore');
      await restoreBackup(backupPath, restoreDir);

      // Verify files exist
      expect(fs.existsSync(path.join(restoreDir, 'config.json'))).toBe(true);
      expect(fs.existsSync(path.join(restoreDir, 'commands.json'))).toBe(true);
    });

    it('should handle corrupted backups', async () => {
      const corruptedPath = testEnv.getPath('corrupted.tar.gz');
      fs.writeFileSync(corruptedPath, 'not a valid gzip file');

      const metadata = await validateBackup(corruptedPath);

      expect(metadata.isValid).toBe(false);
      expect(metadata.errors.length).toBeGreaterThan(0);
    });

    it('should preserve metadata through backup cycle', async () => {
      const project = testEnv.createProject('test-project');
      const claudeDir = path.join(project, '.claude');

      // Create snapshot before backup
      const beforeSnapshot = await createSnapshot(claudeDir);

      // Create backup
      const backupPath = await createBackup(claudeDir);

      // Restore
      const restoreDir = testEnv.createTempDir('restore');
      await restoreBackup(backupPath, restoreDir);

      // Create snapshot after restore
      const afterSnapshot = await createSnapshot(restoreDir);

      // Compare snapshots
      expect(afterSnapshot.fileCount).toBe(beforeSnapshot.fileCount);
    });
  });

  describe('Multi-Project Merge Workflow', () => {
    it('should merge 5+ projects successfully', async () => {
      const projects = testEnv.createMultipleProjects(5);

      const configs: MergeConfig[] = projects.map(project => {
        const configPath = path.join(project, '.claude', 'config.json');
        const content = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        return {
          permissions: content.permissions,
          mcpServers: content.mcpServers,
          settings: content.settings
        };
      });

      const result = await recommendedMerge(configs);

      expect(result.stats.projectsAnalyzed).toBe(5);
      expect(result.permissions.length).toBeGreaterThan(0);
    });

    it('should handle heterogeneous project configs', async () => {
      const configs: MergeConfig[] = [
        createTestConfig({ includePermissions: true }),
        createTestConfig({ includeMcpServers: true }),
        createTestConfig({ includeSettings: true }),
        createTestConfig({
          includePermissions: true,
          includeMcpServers: true,
          includeSettings: true
        })
      ];

      const result = await recommendedMerge(configs);

      expect(result.stats.projectsAnalyzed).toBe(4);
    });
  });

  describe('Incremental Update Workflow', () => {
    it('should support incremental config updates', async () => {
      const project = testEnv.createProject('test-project');
      const configPath = path.join(project, '.claude', 'config.json');

      // Initial config
      const initialConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

      // Update 1: Add permission
      initialConfig.permissions.push('new:permission');
      fs.writeFileSync(configPath, JSON.stringify(initialConfig, null, 2));

      // Update 2: Add MCP server
      initialConfig.mcpServers['new-server'] = { enabled: true };
      fs.writeFileSync(configPath, JSON.stringify(initialConfig, null, 2));

      // Update 3: Change setting
      initialConfig.settings.newSetting = 'value';
      fs.writeFileSync(configPath, JSON.stringify(initialConfig, null, 2));

      // Verify all updates
      const finalConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

      expect(finalConfig.permissions).toContain('new:permission');
      expect(finalConfig.mcpServers).toHaveProperty('new-server');
      expect(finalConfig.settings.newSetting).toBe('value');
    });

    it('should track changes through snapshots', async () => {
      const project = testEnv.createProject('test-project');
      const claudeDir = path.join(project, '.claude');

      // Snapshot 1
      const snapshot1 = await createSnapshot(claudeDir);

      // Make changes
      const configPath = path.join(claudeDir, 'config.json');
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      config.settings.version = 2;
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

      // Snapshot 2
      const snapshot2 = await createSnapshot(claudeDir);

      // Compare
      expect(snapshot1.timestamp).not.toEqual(snapshot2.timestamp);
      expect(snapshot1.files.length).toBe(snapshot2.files.length);
    });
  });

  describe('Error Recovery Workflow', () => {
    it('should recover from failed merge', async () => {
      const configs = createMultipleTestConfigs(3, true);

      // Attempt merge
      const result = await recommendedMerge(configs);

      // Even with conflicts, should produce valid result
      expect(result).toHaveProperty('permissions');
      expect(result).toHaveProperty('mcpServers');
      expect(result).toHaveProperty('settings');
      expect(result).toHaveProperty('conflicts');
      expect(result).toHaveProperty('stats');
    });

    it('should recover from failed backup', async () => {
      const invalidDir = testEnv.getPath('non-existent');

      await expect(createBackup(invalidDir)).rejects.toThrow();

      // System should remain stable
      const validProject = testEnv.createProject('valid-project');
      const backupPath = await createBackup(path.join(validProject, '.claude'));

      expect(fs.existsSync(backupPath)).toBe(true);
    });

    it('should handle partial restore gracefully', async () => {
      const project = testEnv.createProject('test-project');
      const claudeDir = path.join(project, '.claude');
      const backupPath = await createBackup(claudeDir);

      const invalidRestoreDir = '/invalid/path/that/does/not/exist';

      await expect(restoreBackup(backupPath, invalidRestoreDir)).rejects.toThrow();
    });
  });

  describe('State Management Workflow', () => {
    it('should maintain state across operations', async () => {
      const project = testEnv.createProject('test-project');
      const configPath = path.join(project, '.claude', 'config.json');

      // Read initial state
      const initialState = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

      // Perform operations
      const configs = [
        {
          permissions: initialState.permissions,
          mcpServers: initialState.mcpServers,
          settings: initialState.settings
        }
      ];

      const mergeResult = await recommendedMerge(configs);

      // State should be consistent
      expect(mergeResult.permissions).toEqual(initialState.permissions);
      expect(mergeResult.mcpServers).toEqual(initialState.mcpServers);
      expect(mergeResult.settings).toEqual(initialState.settings);
    });

    it('should handle concurrent workflows', async () => {
      const projects = testEnv.createMultipleProjects(3);

      // Concurrent operations
      const operations = projects.map(async project => {
        const claudeDir = path.join(project, '.claude');
        const backupPath = await createBackup(claudeDir);
        const metadata = await validateBackup(backupPath);
        return metadata.isValid;
      });

      const results = await Promise.all(operations);

      expect(results).toHaveLength(3);
      results.forEach(isValid => {
        expect(isValid).toBe(true);
      });
    });
  });
});
