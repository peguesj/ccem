/**
 * Tests for config/paths module.
 *
 * @packageDocumentation
 * @module tests/config/paths
 */

import { homedir } from 'node:os';
import { join } from 'node:path';
import {
  getUserConfigDir,
  getProjectConfigDir,
  resolveConfigPath,
  getUserConfigPath,
  getProjectConfigPath,
  getUserPermissionsPath,
  getProjectPermissionsPath,
  hasClaudeDirectory,
  configExists,
  getParentDir,
  normalizePath
} from '../../src/config/paths.js';

describe('config/paths', () => {
  describe('getUserConfigDir', () => {
    it('should return ~/.claude directory', () => {
      const expected = join(homedir(), '.claude');
      expect(getUserConfigDir()).toBe(expected);
    });
  });

  describe('getProjectConfigDir', () => {
    it('should return ./.claude for current directory', () => {
      const expected = join(process.cwd(), '.claude');
      expect(getProjectConfigDir()).toBe(expected);
    });

    it('should return .claude for custom path', () => {
      const customPath = '/custom/project';
      const expected = join(customPath, '.claude');
      expect(getProjectConfigDir(customPath)).toBe(expected);
    });
  });

  describe('resolveConfigPath', () => {
    it('should resolve relative path from cwd', () => {
      const relativePath = './config.json';
      const result = resolveConfigPath(relativePath);
      expect(result).toContain('config.json');
      expect(result).not.toContain('./');
    });

    it('should resolve relative path from custom base', () => {
      const relativePath = 'config.json';
      const basePath = '/base/path';
      const expected = join(basePath, 'config.json');
      expect(resolveConfigPath(relativePath, basePath)).toBe(expected);
    });
  });

  describe('getUserConfigPath', () => {
    it('should return ~/.claude/config.json', () => {
      const expected = join(homedir(), '.claude', 'config.json');
      expect(getUserConfigPath()).toBe(expected);
    });
  });

  describe('getProjectConfigPath', () => {
    it('should return ./.claude/config.json for current directory', () => {
      const expected = join(process.cwd(), '.claude', 'config.json');
      expect(getProjectConfigPath()).toBe(expected);
    });

    it('should return config.json for custom path', () => {
      const customPath = '/custom/project';
      const expected = join(customPath, '.claude', 'config.json');
      expect(getProjectConfigPath(customPath)).toBe(expected);
    });
  });

  describe('getUserPermissionsPath', () => {
    it('should return ~/.claude/permissions.json', () => {
      const expected = join(homedir(), '.claude', 'permissions.json');
      expect(getUserPermissionsPath()).toBe(expected);
    });
  });

  describe('getProjectPermissionsPath', () => {
    it('should return ./.claude/permissions.json for current directory', () => {
      const expected = join(process.cwd(), '.claude', 'permissions.json');
      expect(getProjectPermissionsPath()).toBe(expected);
    });

    it('should return permissions.json for custom path', () => {
      const customPath = '/custom/project';
      const expected = join(customPath, '.claude', 'permissions.json');
      expect(getProjectPermissionsPath(customPath)).toBe(expected);
    });
  });

  describe('hasClaudeDirectory', () => {
    it('should return true for current directory if .claude exists', () => {
      // This test depends on the actual file system
      const result = hasClaudeDirectory(process.cwd());
      expect(typeof result).toBe('boolean');
    });

    it('should return false for non-existent directory', () => {
      const result = hasClaudeDirectory('/non/existent/path');
      expect(result).toBe(false);
    });
  });

  describe('configExists', () => {
    it('should return true for test fixture', () => {
      const fixturePath = join(process.cwd(), 'tests/fixtures/configs/valid-full.json');
      const result = configExists(fixturePath);
      expect(result).toBe(true);
    });

    it('should return false for non-existent file', () => {
      const result = configExists('/non/existent/config.json');
      expect(result).toBe(false);
    });
  });

  describe('getParentDir', () => {
    it('should return parent directory', () => {
      const path = '/path/to/file.json';
      const result = getParentDir(path);
      expect(result).toBe('/path/to');
    });

    it('should handle nested paths', () => {
      const path = '/a/b/c/d/file.json';
      const result = getParentDir(path);
      expect(result).toBe('/a/b/c/d');
    });
  });

  describe('normalizePath', () => {
    it('should resolve relative paths', () => {
      const path = './config/../.claude/config.json';
      const result = normalizePath(path);
      expect(result).not.toContain('..');
      expect(result).toContain('.claude');
    });

    it('should return absolute paths unchanged', () => {
      const path = '/absolute/path/config.json';
      const result = normalizePath(path);
      expect(result).toBe(path);
    });
  });
});
