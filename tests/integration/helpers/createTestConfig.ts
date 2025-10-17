/**
 * Test configuration generator for integration tests
 *
 * @packageDocumentation
 * @module tests/integration/helpers
 */

import * as fs from 'fs';
import * as path from 'path';
import { MergeConfig } from '../../../src/merge/strategies.js';

/**
 * Test config options
 */
export interface TestConfigOptions {
  /** Include permissions */
  includePermissions?: boolean;
  /** Include MCP servers */
  includeMcpServers?: boolean;
  /** Include settings */
  includeSettings?: boolean;
  /** Custom permissions */
  permissions?: string[];
  /** Custom MCP servers */
  mcpServers?: Record<string, { enabled: boolean; [key: string]: any }>;
  /** Custom settings */
  settings?: Record<string, any>;
}

/**
 * Creates a test configuration
 *
 * @param options - Configuration options
 * @returns Merge config
 */
export function createTestConfig(options: TestConfigOptions = {}): MergeConfig {
  const config: MergeConfig = {
    permissions: [],
    mcpServers: {},
    settings: {}
  };

  if (options.includePermissions || options.permissions) {
    config.permissions = options.permissions || [
      'read:files',
      'write:files',
      'execute:shell'
    ];
  }

  if (options.includeMcpServers || options.mcpServers) {
    config.mcpServers = options.mcpServers || {
      'test-server': {
        enabled: true,
        url: 'http://localhost:3000',
        timeout: 5000
      },
      'another-server': {
        enabled: false,
        url: 'http://localhost:4000'
      }
    };
  }

  if (options.includeSettings || options.settings) {
    config.settings = options.settings || {
      theme: 'dark',
      tabSize: 2,
      autoSave: true,
      fontSize: 14
    };
  }

  return config;
}

/**
 * Creates a temporary .claude directory with test config
 *
 * @param basePath - Base path for .claude directory
 * @param config - Configuration to write
 * @returns Path to created .claude directory
 */
export function createTestClaudeDir(
  basePath: string,
  config: MergeConfig
): string {
  const claudeDir = path.join(basePath, '.claude');

  // Create directory structure
  fs.mkdirSync(claudeDir, { recursive: true });
  fs.mkdirSync(path.join(claudeDir, 'commands'), { recursive: true });
  fs.mkdirSync(path.join(claudeDir, 'hooks'), { recursive: true });

  // Write config.json
  fs.writeFileSync(
    path.join(claudeDir, 'config.json'),
    JSON.stringify({
      version: '1.0.0',
      permissions: config.permissions,
      mcpServers: config.mcpServers,
      settings: config.settings
    }, null, 2)
  );

  // Write commands.json
  fs.writeFileSync(
    path.join(claudeDir, 'commands.json'),
    JSON.stringify({
      '/test': {
        description: 'Test command',
        command: 'echo "test"'
      }
    }, null, 2)
  );

  return claudeDir;
}

/**
 * Creates multiple test configs with variations
 *
 * @param count - Number of configs to create
 * @param variations - Whether to add variations
 * @returns Array of test configs
 */
export function createMultipleTestConfigs(
  count: number,
  variations: boolean = true
): MergeConfig[] {
  const configs: MergeConfig[] = [];

  for (let i = 0; i < count; i++) {
    const config = createTestConfig({
      includePermissions: true,
      includeMcpServers: true,
      includeSettings: true
    });

    if (variations) {
      // Add variations to create conflicts
      config.settings.theme = i % 2 === 0 ? 'dark' : 'light';
      config.settings.fontSize = 14 + i;
      config.permissions.push(`custom-perm-${i}`);
      config.mcpServers[`server-${i}`] = {
        enabled: true,
        url: `http://localhost:${3000 + i}`
      };
    }

    configs.push(config);
  }

  return configs;
}

/**
 * Creates conflicting test configs
 *
 * @returns Array of two configs with conflicts
 */
export function createConflictingConfigs(): [MergeConfig, MergeConfig] {
  const config1 = createTestConfig({
    permissions: ['read:files', 'write:files'],
    mcpServers: {
      'shared-server': {
        enabled: true,
        url: 'http://localhost:3000',
        timeout: 5000
      }
    },
    settings: {
      theme: 'dark',
      tabSize: 2,
      autoSave: true
    }
  });

  const config2 = createTestConfig({
    permissions: ['read:files', 'execute:shell'],
    mcpServers: {
      'shared-server': {
        enabled: false,
        url: 'http://localhost:4000',
        timeout: 10000
      }
    },
    settings: {
      theme: 'light',
      tabSize: 4,
      autoSave: false
    }
  });

  return [config1, config2];
}

/**
 * Creates test conversation history
 *
 * @param messageCount - Number of messages
 * @returns Conversation history string
 */
export function createTestConversationHistory(messageCount: number): string {
  const messages: string[] = [];

  for (let i = 0; i < messageCount; i++) {
    messages.push(
      `[${new Date(Date.now() - (messageCount - i) * 60000).toISOString()}] User: Test message ${i}`,
      `[${new Date(Date.now() - (messageCount - i) * 60000 + 5000).toISOString()}] Assistant: Response ${i}`
    );
  }

  return messages.join('\n');
}
