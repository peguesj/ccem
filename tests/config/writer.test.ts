/**
 * Tests for config/writer module.
 *
 * @packageDocumentation
 * @module tests/config/writer
 */

import { join } from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { existsSync } from 'node:fs';
import {
  writeConfig,
  updateConfig,
  createBackup,
  writePermissions,
  setConfigField,
  deleteConfigField,
  addPermission,
  removePermission
} from '../../src/config/writer.js';
import { readConfig } from '../../src/config/reader.js';
import type { ClaudeConfig } from '../../src/config/types.js';

describe('config/writer', () => {
  let tempDir: string;
  let testConfigPath: string;

  beforeEach(async () => {
    // Create temporary directory for tests
    tempDir = await mkdtemp(join(tmpdir(), 'ccem-test-'));
    testConfigPath = join(tempDir, 'config.json');
  });

  afterEach(async () => {
    // Clean up temporary directory
    if (existsSync(tempDir)) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  describe('writeConfig', () => {
    it('should write valid config to file', async () => {
      const config: ClaudeConfig = {
        permissions: ['read:files'],
        mcpServers: {},
        settings: {}
      };

      await writeConfig(testConfigPath, config, { backup: false, createDirs: true });
      expect(existsSync(testConfigPath)).toBe(true);

      const written = await readConfig(testConfigPath);
      expect(written).toEqual(config);
    });

    it('should create parent directories when createDirs is true', async () => {
      const nestedPath = join(tempDir, 'nested', 'dir', 'config.json');
      const config: ClaudeConfig = {
        permissions: []
      };

      await writeConfig(nestedPath, config, { createDirs: true, backup: false });
      expect(existsSync(nestedPath)).toBe(true);
    });

    it('should create backup when requested', async () => {
      const config: ClaudeConfig = { permissions: [] };

      // Write initial config
      await writeConfig(testConfigPath, config, { backup: false });

      // Update with backup
      const updated: ClaudeConfig = { permissions: ['read:files'] };
      await writeConfig(testConfigPath, updated, { backup: true });

      // Check backup exists
      const files = await import('node:fs/promises').then(m => m.readdir(tempDir));
      const backups = files.filter(f => f.startsWith('config.json.backup'));
      expect(backups.length).toBeGreaterThan(0);
    });

    it('should throw on invalid config when validation enabled', async () => {
      const invalidConfig: ClaudeConfig = {
        permissions: 'invalid' as unknown as string[]
      };

      await expect(
        writeConfig(testConfigPath, invalidConfig, { validate: true, backup: false })
      ).rejects.toThrow('Invalid configuration');
    });

    it('should format JSON with specified spaces', async () => {
      const config: ClaudeConfig = {
        permissions: ['read:files']
      };

      await writeConfig(testConfigPath, config, { spaces: 4, backup: false });

      const fs = await import('node:fs/promises');
      const content = await fs.readFile(testConfigPath, 'utf-8');
      expect(content).toContain('    '); // 4 spaces
    });
  });

  describe('updateConfig', () => {
    it('should update existing config', async () => {
      const initial: ClaudeConfig = {
        permissions: ['read:files'],
        settings: { theme: 'light' }
      };

      await writeConfig(testConfigPath, initial, { backup: false });

      const updates: Partial<ClaudeConfig> = {
        permissions: ['write:files']
      };

      await updateConfig(testConfigPath, updates, { backup: false });

      const updated = await readConfig(testConfigPath);
      expect(updated.permissions).toEqual(['write:files']);
      expect(updated.settings).toEqual({ theme: 'light' });
    });

    it('should throw for non-existent file', async () => {
      const nonExistent = join(tempDir, 'nonexistent.json');
      await expect(
        updateConfig(nonExistent, { permissions: [] })
      ).rejects.toThrow('Config file not found');
    });

    it('should merge nested objects', async () => {
      const initial: ClaudeConfig = {
        settings: { theme: 'light', fontSize: 12 }
      };

      await writeConfig(testConfigPath, initial, { backup: false });

      const updates: Partial<ClaudeConfig> = {
        settings: { theme: 'dark' }
      };

      await updateConfig(testConfigPath, updates, { backup: false });

      const updated = await readConfig(testConfigPath);
      expect(updated.settings).toEqual({ theme: 'dark', fontSize: 12 });
    });
  });

  describe('createBackup', () => {
    it('should create backup file', async () => {
      const config: ClaudeConfig = { permissions: [] };
      await writeConfig(testConfigPath, config, { backup: false });

      const backupPath = await createBackup(testConfigPath);
      expect(existsSync(backupPath)).toBe(true);
      expect(backupPath).toContain('.backup-');
    });

    it('should throw for non-existent file', async () => {
      const nonExistent = join(tempDir, 'nonexistent.json');
      await expect(createBackup(nonExistent)).rejects.toThrow('File not found');
    });
  });

  describe('writePermissions', () => {
    it('should write permissions array', async () => {
      const permPath = join(tempDir, 'permissions.json');
      const permissions = ['read:files', 'write:files'];

      await writePermissions(permPath, permissions, { backup: false, createDirs: true });

      const fs = await import('node:fs/promises');
      const content = await fs.readFile(permPath, 'utf-8');
      const written = JSON.parse(content);
      expect(written).toEqual(permissions);
    });
  });

  describe('setConfigField', () => {
    it('should set top-level field', async () => {
      const config: ClaudeConfig = { permissions: [] };
      await writeConfig(testConfigPath, config, { backup: false });

      await setConfigField(testConfigPath, 'permissions', ['read:files'], { backup: false });

      const updated = await readConfig(testConfigPath);
      expect(updated.permissions).toEqual(['read:files']);
    });

    it('should set nested field', async () => {
      const config: ClaudeConfig = { settings: {} };
      await writeConfig(testConfigPath, config, { backup: false });

      await setConfigField(testConfigPath, 'settings.theme', 'dark', { backup: false });

      const updated = await readConfig(testConfigPath);
      expect(updated.settings?.theme).toBe('dark');
    });

    it('should create nested path if not exists', async () => {
      const config: ClaudeConfig = {};
      await writeConfig(testConfigPath, config, { backup: false });

      await setConfigField(testConfigPath, 'settings.ui.theme', 'dark', { backup: false });

      const updated = await readConfig(testConfigPath);
      expect((updated.settings as Record<string, unknown>)?.ui).toBeDefined();
    });
  });

  describe('deleteConfigField', () => {
    it('should delete top-level field', async () => {
      const config: ClaudeConfig = { permissions: [], settings: {} };
      await writeConfig(testConfigPath, config, { backup: false });

      await deleteConfigField(testConfigPath, 'settings', { backup: false });

      const updated = await readConfig(testConfigPath);
      expect(updated.settings).toBeUndefined();
    });

    it('should delete nested field', async () => {
      const config: ClaudeConfig = {
        settings: { theme: 'dark', fontSize: 12 }
      };
      await writeConfig(testConfigPath, config, { backup: false });

      await deleteConfigField(testConfigPath, 'settings.theme', { backup: false });

      const updated = await readConfig(testConfigPath);
      expect(updated.settings?.theme).toBeUndefined();
      expect(updated.settings?.fontSize).toBe(12);
    });

    it('should not throw for non-existent field', async () => {
      const config: ClaudeConfig = { permissions: [] };
      await writeConfig(testConfigPath, config, { backup: false });

      await expect(
        deleteConfigField(testConfigPath, 'nonexistent', { backup: false })
      ).resolves.not.toThrow();
    });
  });

  describe('addPermission', () => {
    it('should add permission to config', async () => {
      const config: ClaudeConfig = { permissions: ['read:files'] };
      await writeConfig(testConfigPath, config, { backup: false });

      await addPermission(testConfigPath, 'write:files', { backup: false });

      const updated = await readConfig(testConfigPath);
      expect(updated.permissions).toContain('write:files');
    });

    it('should not add duplicate permission', async () => {
      const config: ClaudeConfig = { permissions: ['read:files'] };
      await writeConfig(testConfigPath, config, { backup: false });

      await addPermission(testConfigPath, 'read:files', { backup: false });

      const updated = await readConfig(testConfigPath);
      expect(updated.permissions?.filter(p => p === 'read:files')).toHaveLength(1);
    });

    it('should initialize permissions if not exists', async () => {
      const config: ClaudeConfig = {};
      await writeConfig(testConfigPath, config, { backup: false });

      await addPermission(testConfigPath, 'read:files', { backup: false });

      const updated = await readConfig(testConfigPath);
      expect(updated.permissions).toEqual(['read:files']);
    });
  });

  describe('removePermission', () => {
    it('should remove permission from config', async () => {
      const config: ClaudeConfig = {
        permissions: ['read:files', 'write:files']
      };
      await writeConfig(testConfigPath, config, { backup: false });

      await removePermission(testConfigPath, 'write:files', { backup: false });

      const updated = await readConfig(testConfigPath);
      expect(updated.permissions).toEqual(['read:files']);
    });

    it('should not throw for non-existent permission', async () => {
      const config: ClaudeConfig = { permissions: ['read:files'] };
      await writeConfig(testConfigPath, config, { backup: false });

      await expect(
        removePermission(testConfigPath, 'nonexistent', { backup: false })
      ).resolves.not.toThrow();
    });
  });
});
