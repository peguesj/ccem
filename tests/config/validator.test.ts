/**
 * Tests for config/validator module.
 *
 * @packageDocumentation
 * @module tests/config/validator
 */

import {
  validateConfig,
  isValidPermission,
  isValidServerName,
  hasRequiredFields,
  isValidConfigStructure
} from '../../src/config/validator.js';
import type { ClaudeConfig, McpServerConfig } from '../../src/config/types.js';

describe('config/validator', () => {
  describe('validateConfig', () => {
    it('should validate correct config', () => {
      const config: ClaudeConfig = {
        permissions: ['read:files', 'write:files'],
        mcpServers: {
          'test-server': {
            enabled: true,
            command: 'node',
            args: ['server.js']
          }
        },
        settings: {
          theme: 'dark'
        }
      };

      const result = validateConfig(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject non-object config', () => {
      const result = validateConfig(null as unknown as ClaudeConfig);
      expect(result.valid).toBe(false);
      expect(result.errors[0]?.message).toContain('must be an object');
    });

    it('should reject invalid permissions', () => {
      const config: ClaudeConfig = {
        permissions: 'not-an-array' as unknown as string[]
      };

      const result = validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.path === 'permissions')).toBe(true);
    });

    it('should reject non-string permissions', () => {
      const config: ClaudeConfig = {
        permissions: [123 as unknown as string, 'valid']
      };

      const result = validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.path === 'permissions[0]')).toBe(true);
    });

    it('should reject empty permission strings', () => {
      const config: ClaudeConfig = {
        permissions: ['', 'valid']
      };

      const result = validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('cannot be empty'))).toBe(true);
    });

    it('should reject invalid mcpServers type', () => {
      const config: ClaudeConfig = {
        mcpServers: 'not-an-object' as unknown as Record<string, McpServerConfig>
      };

      const result = validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.path === 'mcpServers')).toBe(true);
    });

    it('should reject mcpServer without enabled field', () => {
      const config: ClaudeConfig = {
        mcpServers: {
          'test-server': {} as { enabled: boolean }
        }
      };

      const result = validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.path.includes('enabled'))).toBe(true);
    });

    it('should reject mcpServer with non-boolean enabled', () => {
      const config: ClaudeConfig = {
        mcpServers: {
          'test-server': {
            enabled: 'yes' as unknown as boolean
          }
        }
      };

      const result = validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.message.includes('boolean'))).toBe(true);
    });

    it('should reject mcpServer with invalid command type', () => {
      const config: ClaudeConfig = {
        mcpServers: {
          'test-server': {
            enabled: true,
            command: 123 as unknown as string
          }
        }
      };

      const result = validateConfig(config);
      expect(result.valid).toBe(false);
    });

    it('should reject mcpServer with invalid args type', () => {
      const config: ClaudeConfig = {
        mcpServers: {
          'test-server': {
            enabled: true,
            args: 'not-an-array' as unknown as string[]
          }
        }
      };

      const result = validateConfig(config);
      expect(result.valid).toBe(false);
    });

    it('should reject mcpServer with non-string args', () => {
      const config: ClaudeConfig = {
        mcpServers: {
          'test-server': {
            enabled: true,
            args: [123 as unknown as string]
          }
        }
      };

      const result = validateConfig(config);
      expect(result.valid).toBe(false);
    });

    it('should reject invalid env type', () => {
      const config: ClaudeConfig = {
        mcpServers: {
          'test-server': {
            enabled: true,
            env: 'not-an-object' as unknown as Record<string, string>
          }
        }
      };

      const result = validateConfig(config);
      expect(result.valid).toBe(false);
    });

    it('should reject non-string env values', () => {
      const config: ClaudeConfig = {
        mcpServers: {
          'test-server': {
            enabled: true,
            env: {
              VAR: 123 as unknown as string
            }
          }
        }
      };

      const result = validateConfig(config);
      expect(result.valid).toBe(false);
    });

    it('should reject invalid settings type', () => {
      const config: ClaudeConfig = {
        settings: 'not-an-object' as unknown as Record<string, unknown>
      };

      const result = validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.path === 'settings')).toBe(true);
    });

    it('should warn about unknown top-level fields', () => {
      const config: ClaudeConfig = {
        permissions: [],
        unknownField: 'value'
      };

      const result = validateConfig(config);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Unknown configuration field');
    });

    it('should accept empty config with all fields', () => {
      const config: ClaudeConfig = {
        permissions: [],
        mcpServers: {},
        settings: {}
      };

      const result = validateConfig(config);
      expect(result.valid).toBe(true);
    });
  });

  describe('isValidPermission', () => {
    it('should accept valid permission format', () => {
      expect(isValidPermission('read:files')).toBe(true);
      expect(isValidPermission('write:files')).toBe(true);
      expect(isValidPermission('execute:commands')).toBe(true);
      expect(isValidPermission('admin:*')).toBe(true);
      expect(isValidPermission('*')).toBe(true);
    });

    it('should reject invalid permission format', () => {
      expect(isValidPermission('invalid')).toBe(false);
      expect(isValidPermission('no-colon')).toBe(false);
      expect(isValidPermission('')).toBe(false);
    });
  });

  describe('isValidServerName', () => {
    it('should accept valid server names', () => {
      expect(isValidServerName('my-server')).toBe(true);
      expect(isValidServerName('server_123')).toBe(true);
      expect(isValidServerName('test-server-v2')).toBe(true);
      expect(isValidServerName('SERVER')).toBe(true);
    });

    it('should reject invalid server names', () => {
      expect(isValidServerName('invalid@name')).toBe(false);
      expect(isValidServerName('server name')).toBe(false);
      expect(isValidServerName('server.name')).toBe(false);
      expect(isValidServerName('')).toBe(false);
    });
  });

  describe('hasRequiredFields', () => {
    it('should return true if config has permissions', () => {
      const config: ClaudeConfig = {
        permissions: []
      };
      expect(hasRequiredFields(config)).toBe(true);
    });

    it('should return true if config has mcpServers', () => {
      const config: ClaudeConfig = {
        mcpServers: {}
      };
      expect(hasRequiredFields(config)).toBe(true);
    });

    it('should return true if config has settings', () => {
      const config: ClaudeConfig = {
        settings: {}
      };
      expect(hasRequiredFields(config)).toBe(true);
    });

    it('should return false for completely empty config', () => {
      const config: ClaudeConfig = {};
      expect(hasRequiredFields(config)).toBe(false);
    });
  });

  describe('isValidConfigStructure', () => {
    it('should return true for valid config', () => {
      const config: ClaudeConfig = {
        permissions: [],
        mcpServers: {},
        settings: {}
      };
      expect(isValidConfigStructure(config)).toBe(true);
    });

    it('should return false for invalid config', () => {
      const config = {
        permissions: 'invalid'
      };
      expect(isValidConfigStructure(config)).toBe(false);
    });

    it('should return false for non-object', () => {
      expect(isValidConfigStructure(null)).toBe(false);
      expect(isValidConfigStructure('string')).toBe(false);
      expect(isValidConfigStructure(123)).toBe(false);
    });
  });
});
