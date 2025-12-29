/**
 * Test Fixtures - Command Data
 *
 * Provides mock command data for testing
 */

export const mockCommands = [
  {
    id: 'cmd1',
    name: 'Test Command 1',
    description: 'First test command',
    options: ['--flag1', '--flag2'],
  },
  {
    id: 'cmd2',
    name: 'Test Command 2',
    description: 'Second test command',
    options: ['--verbose'],
  },
];

export const mockCommandResult = {
  success: true,
  output: 'Command executed successfully',
  exitCode: 0,
  duration: 123,
};

export const mockCommandError = {
  success: false,
  error: 'Command execution failed',
  exitCode: 1,
  duration: 45,
};
