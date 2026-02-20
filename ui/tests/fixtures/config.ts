/**
 * Test Fixtures - Configuration Data
 *
 * Provides mock configuration data for testing
 */

export const mockConfig = {
  version: '1.0.0',
  settings: {
    theme: 'dark',
    notifications: true,
    autoSave: true,
  },
  mcp: {
    servers: [
      {
        id: 'server1',
        name: 'Test Server',
        enabled: true,
        command: 'node',
        args: ['server.js'],
      },
    ],
  },
  commands: {
    custom: [
      {
        id: 'test-command',
        name: 'Test Command',
        description: 'A test command',
      },
    ],
  },
};

export const mockInvalidConfig = {
  version: '1.0.0',
  // Missing required fields
  settings: {},
};

export const mockEmptyConfig = {
  version: '1.0.0',
  settings: {
    theme: 'dark',
    notifications: false,
    autoSave: false,
  },
  mcp: {
    servers: [],
  },
  commands: {
    custom: [],
  },
};
