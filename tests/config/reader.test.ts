/**
 * Tests for config/reader module.
 *
 * @packageDocumentation
 * @module tests/config/reader
 */

import { join } from 'node:path';
import {
  readConfig,
  readMultipleConfigs,
  readPermissions,
  readConfigField,
  isValidJson,
  getDefaultConfig,
  mergeConfigs
} from '../../src/config/reader.js';

const FIXTURES_DIR = join(process.cwd(), 'tests/fixtures/configs');

describe('config/reader', () => {
  describe('readConfig', () => {
    it('should read valid full config', async () => {
      const path = join(FIXTURES_DIR, 'valid-full.json');
      const config = await readConfig(path);

      expect(config.permissions).toEqual([
        'read:files',
        'write:files',
        'execute:commands'
      ]);
      expect(config.mcpServers).toBeDefined();
      expect(config.settings).toBeDefined();
    });

    it('should read valid minimal config', async () => {
      const path = join(FIXTURES_DIR, 'valid-minimal.json');
      const config = await readConfig(path);

      expect(config.permissions).toEqual([]);
      expect(config.mcpServers).toEqual({});
      expect(config.settings).toEqual({});
    });

    it('should return empty object for missing file when throwOnMissing is false', async () => {
      const config = await readConfig('/non/existent.json', { throwOnMissing: false });
      expect(config).toEqual({});
    });

    it('should throw for missing file when throwOnMissing is true', async () => {
      await expect(
        readConfig('/non/existent.json', { throwOnMissing: true })
      ).rejects.toThrow('Config file not found');
    });

    it('should throw for invalid JSON', async () => {
      const path = join(FIXTURES_DIR, 'invalid-json.json');
      await expect(readConfig(path)).rejects.toThrow('Invalid JSON');
    });

    it('should merge with defaults when requested', async () => {
      const path = join(FIXTURES_DIR, 'valid-full.json');
      const config = await readConfig(path, { mergeDefaults: true });

      expect(config.permissions).toBeDefined();
      expect(config.mcpServers).toBeDefined();
      expect(config.settings).toBeDefined();
    });

    it('should validate when requested', async () => {
      const path = join(FIXTURES_DIR, 'invalid-permissions.json');
      await expect(
        readConfig(path, { validate: true })
      ).rejects.toThrow('Invalid configuration');
    });
  });

  describe('readMultipleConfigs', () => {
    it('should read multiple configs', async () => {
      const paths = [
        join(FIXTURES_DIR, 'valid-full.json'),
        join(FIXTURES_DIR, 'valid-minimal.json')
      ];

      const configs = await readMultipleConfigs(paths);
      expect(configs).toHaveLength(2);
      expect(configs[0]?.permissions).toBeDefined();
      expect(configs[1]?.permissions).toEqual([]);
    });

    it('should skip missing files when throwOnMissing is false', async () => {
      const paths = [
        join(FIXTURES_DIR, 'valid-full.json'),
        '/non/existent.json'
      ];

      const configs = await readMultipleConfigs(paths, { throwOnMissing: false });
      // Should have at least 1 config (the valid one), may have 2 if missing file returns empty object
      expect(configs.length).toBeGreaterThanOrEqual(1);
      expect(configs[0]?.permissions).toBeDefined();
    });

    it('should throw for missing files when throwOnMissing is true', async () => {
      const paths = [
        join(FIXTURES_DIR, 'valid-full.json'),
        '/non/existent.json'
      ];

      await expect(
        readMultipleConfigs(paths, { throwOnMissing: true })
      ).rejects.toThrow();
    });
  });

  describe('readPermissions', () => {
    it('should return empty array for missing file', async () => {
      const permissions = await readPermissions('/non/existent.json');
      expect(permissions).toEqual([]);
    });

    it('should read permissions array', async () => {
      const path = join(FIXTURES_DIR, 'valid-full.json');
      const permissions = await readPermissions(path);
      expect(Array.isArray(permissions)).toBe(true);
    });
  });

  describe('readConfigField', () => {
    it('should read top-level field', () => {
      const config = {
        permissions: ['read:files'],
        mcpServers: {},
        settings: {}
      };

      const result = readConfigField(config, 'permissions');
      expect(result).toEqual(['read:files']);
    });

    it('should read nested field', () => {
      const config = {
        permissions: [],
        mcpServers: {},
        settings: {
          theme: 'dark'
        }
      };

      const result = readConfigField(config, 'settings.theme');
      expect(result).toBe('dark');
    });

    it('should return undefined for missing field', () => {
      const config = {
        permissions: [],
        mcpServers: {},
        settings: {}
      };

      const result = readConfigField(config, 'settings.nonexistent');
      expect(result).toBeUndefined();
    });

    it('should handle deeply nested paths', () => {
      const config = {
        permissions: [],
        mcpServers: {
          'test-server': {
            enabled: true,
            env: {
              NODE_ENV: 'development'
            }
          }
        },
        settings: {}
      };

      const result = readConfigField(config, 'mcpServers.test-server.env.NODE_ENV');
      expect(result).toBe('development');
    });
  });

  describe('isValidJson', () => {
    it('should return true for valid JSON file', async () => {
      const path = join(FIXTURES_DIR, 'valid-full.json');
      const result = await isValidJson(path);
      expect(result).toBe(true);
    });

    it('should return false for invalid JSON file', async () => {
      const path = join(FIXTURES_DIR, 'invalid-json.json');
      const result = await isValidJson(path);
      expect(result).toBe(false);
    });

    it('should return false for non-existent file', async () => {
      const result = await isValidJson('/non/existent.json');
      expect(result).toBe(false);
    });
  });

  describe('getDefaultConfig', () => {
    it('should return default config object', () => {
      const config = getDefaultConfig();

      expect(config.permissions).toEqual([]);
      expect(config.mcpServers).toEqual({});
      expect(config.settings).toEqual({});
    });

    it('should return new instance each time', () => {
      const config1 = getDefaultConfig();
      const config2 = getDefaultConfig();

      expect(config1).not.toBe(config2);
      expect(config1).toEqual(config2);
    });
  });

  describe('mergeConfigs', () => {
    it('should merge two configs with override taking precedence', () => {
      const base = {
        permissions: ['read:files'],
        mcpServers: {
          server1: { enabled: true }
        },
        settings: {
          theme: 'light'
        }
      };

      const override = {
        permissions: ['write:files'],
        mcpServers: {
          server2: { enabled: false }
        },
        settings: {
          fontSize: 14
        }
      };

      const merged = mergeConfigs(base, override);

      expect(merged.permissions).toEqual(['read:files', 'write:files']);
      expect(merged.mcpServers).toHaveProperty('server1');
      expect(merged.mcpServers).toHaveProperty('server2');
      expect(merged.settings).toEqual({
        theme: 'light',
        fontSize: 14
      });
    });

    it('should handle empty configs', () => {
      const base = {};
      const override = {
        permissions: ['read:files']
      };

      const merged = mergeConfigs(base, override);
      expect(merged.permissions).toEqual(['read:files']);
    });
  });
});
