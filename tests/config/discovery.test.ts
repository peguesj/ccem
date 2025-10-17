/**
 * Tests for config/discovery module.
 *
 * @packageDocumentation
 * @module tests/config/discovery
 */

import { join } from 'node:path';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { existsSync } from 'node:fs';
import {
  findClaudeDirectories,
  discoverConfigs,
  findNearestConfig,
  getConfigLocation,
  hasValidConfig,
  listConfigFiles
} from '../../src/config/discovery.js';

describe('config/discovery', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'ccem-discovery-test-'));
  });

  afterEach(async () => {
    if (existsSync(tempDir)) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  describe('findClaudeDirectories', () => {
    it('should find .claude directory in root', async () => {
      const claudeDir = join(tempDir, '.claude');
      await mkdir(claudeDir);

      const dirs = await findClaudeDirectories(tempDir);
      expect(dirs).toContain(claudeDir);
    });

    it('should find nested .claude directories', async () => {
      const project1 = join(tempDir, 'project1', '.claude');
      const project2 = join(tempDir, 'project2', '.claude');

      await mkdir(project1, { recursive: true });
      await mkdir(project2, { recursive: true });

      const dirs = await findClaudeDirectories(tempDir);
      expect(dirs).toContain(project1);
      expect(dirs).toContain(project2);
    });

    it('should not search node_modules', async () => {
      const nodeModules = join(tempDir, 'node_modules', '.claude');
      await mkdir(nodeModules, { recursive: true });

      const dirs = await findClaudeDirectories(tempDir);
      expect(dirs).not.toContain(nodeModules);
    });

    it('should respect maxDepth', async () => {
      const deep = join(tempDir, 'a', 'b', 'c', 'd', 'e', 'f', '.claude');
      await mkdir(deep, { recursive: true });

      const dirs = await findClaudeDirectories(tempDir, 3);
      expect(dirs).not.toContain(deep);
    });

    it('should return empty array for directory without .claude', async () => {
      const dirs = await findClaudeDirectories(tempDir);
      expect(dirs).toEqual([]);
    });

    it('should handle permission errors gracefully', async () => {
      // This test may not work on all systems due to permission requirements
      const dirs = await findClaudeDirectories('/root/nonexistent');
      expect(Array.isArray(dirs)).toBe(true);
    });
  });

  describe('discoverConfigs', () => {
    it('should discover user config', async () => {
      // User config discovery depends on actual filesystem
      const configs = await discoverConfigs(tempDir);
      expect(Array.isArray(configs)).toBe(true);
    });

    it('should discover project configs', async () => {
      const claudeDir = join(tempDir, '.claude');
      await mkdir(claudeDir);
      await writeFile(
        join(claudeDir, 'config.json'),
        JSON.stringify({ permissions: [] })
      );

      const configs = await discoverConfigs(tempDir);
      const projectConfig = configs.find(c => c.type === 'project' && c.root === tempDir);
      expect(projectConfig).toBeDefined();
    });

    it('should include permissions path if exists', async () => {
      const claudeDir = join(tempDir, '.claude');
      await mkdir(claudeDir);
      await writeFile(
        join(claudeDir, 'config.json'),
        JSON.stringify({ permissions: [] })
      );
      await writeFile(
        join(claudeDir, 'permissions.json'),
        JSON.stringify(['read:files'])
      );

      const configs = await discoverConfigs(tempDir);
      const projectConfig = configs.find(c => c.type === 'project' && c.root === tempDir);
      expect(projectConfig?.permissionsPath).toBeDefined();
    });

    it('should not include configs without config.json', async () => {
      const claudeDir = join(tempDir, '.claude');
      await mkdir(claudeDir);
      // No config.json created

      const configs = await discoverConfigs(tempDir);
      const projectConfig = configs.find(c => c.type === 'project' && c.root === tempDir);
      expect(projectConfig).toBeUndefined();
    });
  });

  describe('findNearestConfig', () => {
    it('should find .claude in current directory', async () => {
      const claudeDir = join(tempDir, '.claude');
      await mkdir(claudeDir);

      const nearest = await findNearestConfig(tempDir);
      expect(nearest).toBe(claudeDir);
    });

    it('should find .claude in parent directory', async () => {
      const claudeDir = join(tempDir, '.claude');
      const subDir = join(tempDir, 'sub');
      await mkdir(claudeDir);
      await mkdir(subDir);

      const nearest = await findNearestConfig(subDir);
      expect(nearest).toBe(claudeDir);
    });

    it('should return null if no .claude found', async () => {
      const nearest = await findNearestConfig(tempDir);
      expect(nearest).toBeNull();
    });

    it('should stop at filesystem root', async () => {
      const deep = join(tempDir, 'very', 'deep', 'path');
      await mkdir(deep, { recursive: true });

      const nearest = await findNearestConfig(deep);
      expect(nearest).toBeNull();
    });
  });

  describe('getConfigLocation', () => {
    it('should get user config location', async () => {
      // This depends on actual user config existing
      const location = await getConfigLocation(tempDir, 'user');
      // May or may not exist, but should not throw
      expect(location === null || location.type === 'user').toBe(true);
    });

    it('should get project config location', async () => {
      const claudeDir = join(tempDir, '.claude');
      await mkdir(claudeDir);
      await writeFile(
        join(claudeDir, 'config.json'),
        JSON.stringify({ permissions: [] })
      );

      const location = await getConfigLocation(tempDir, 'project');
      expect(location).toBeDefined();
      expect(location?.type).toBe('project');
      expect(location?.root).toBe(tempDir);
    });

    it('should return null for non-existent project config', async () => {
      const location = await getConfigLocation(tempDir, 'project');
      expect(location).toBeNull();
    });
  });

  describe('hasValidConfig', () => {
    it('should return true for valid config', async () => {
      const claudeDir = join(tempDir, '.claude');
      await mkdir(claudeDir);
      await writeFile(
        join(claudeDir, 'config.json'),
        JSON.stringify({ permissions: [] })
      );

      const isValid = await hasValidConfig(tempDir);
      expect(isValid).toBe(true);
    });

    it('should return false without .claude directory', async () => {
      const isValid = await hasValidConfig(tempDir);
      expect(isValid).toBe(false);
    });

    it('should return false without config.json', async () => {
      const claudeDir = join(tempDir, '.claude');
      await mkdir(claudeDir);

      const isValid = await hasValidConfig(tempDir);
      expect(isValid).toBe(false);
    });
  });

  describe('listConfigFiles', () => {
    it('should list JSON files in .claude directory', async () => {
      const claudeDir = join(tempDir, '.claude');
      await mkdir(claudeDir);
      await writeFile(join(claudeDir, 'config.json'), '{}');
      await writeFile(join(claudeDir, 'permissions.json'), '[]');
      await writeFile(join(claudeDir, 'other.txt'), 'text');

      const files = await listConfigFiles(claudeDir);
      expect(files).toContain('config.json');
      expect(files).toContain('permissions.json');
      expect(files).not.toContain('other.txt');
    });

    it('should return empty array for non-existent directory', async () => {
      const files = await listConfigFiles(join(tempDir, 'nonexistent'));
      expect(files).toEqual([]);
    });

    it('should return empty array for directory without JSON files', async () => {
      const claudeDir = join(tempDir, '.claude');
      await mkdir(claudeDir);
      await writeFile(join(claudeDir, 'readme.txt'), 'text');

      const files = await listConfigFiles(claudeDir);
      expect(files).toEqual([]);
    });
  });
});
