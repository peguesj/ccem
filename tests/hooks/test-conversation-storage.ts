/**
 * Test suite for VIKI Conversation Storage Hook
 * Tests conversation storage functionality and server submission
 */

import handler from '../../src/hooks/templates/handlers/store-conversation.js';
import { HookContext } from '../../src/hooks/types.js';
import * as submitModule from '../../src/hooks/utils/submit.js';

// Mock the submitToServers function
jest.mock('../../src/hooks/utils/submit.js', () => ({
  submitToServers: jest.fn(),
}));

describe('VIKI Conversation Storage Hook', () => {
  const mockSubmitToServers = submitModule.submitToServers as jest.MockedFunction<
    typeof submitModule.submitToServers
  >;

  beforeEach(() => {
    jest.clearAllMocks();
    // Set mock environment variables
    process.env.VIKI_URL = 'https://test.viki.example.com';
    process.env.VIKI_API_TOKEN = 'test-token-12345';
  });

  afterEach(() => {
    delete process.env.VIKI_URL;
    delete process.env.VIKI_API_TOKEN;
  });

  describe('handler', () => {
    it('should store conversation with complete context', async () => {
      const context: HookContext = {
        userMessage: 'How do I implement vector search?',
        assistantResponse:
          'To implement vector search, you need to use pgvector...',
        toolsUsed: ['Grep', 'Read', 'Edit'],
        project: 'viki-project',
        timestamp: new Date('2025-12-28T12:00:00Z'),
        metadata: {},
      };

      mockSubmitToServers.mockResolvedValue([
        {
          success: true,
          server: 'viki',
          statusCode: 200,
          responseData: { stored: true },
        },
      ]);

      const result = await handler(context);

      expect(result.stored).toBe(true);
      expect(result.conversation_id).toMatch(/^conv_\d+_[a-z0-9]+$/);
      expect(mockSubmitToServers).toHaveBeenCalledTimes(1);

      // Verify the call arguments
      const [servers, endpoint, data] = mockSubmitToServers.mock.calls[0];
      expect(servers).toHaveLength(1);
      expect(servers[0].name).toBe('viki');
      expect(endpoint).toBe('/api/v1/hooks/conversations');
      expect(data.project).toBe('viki-project');
      expect(data.user_message).toBe('How do I implement vector search?');
      expect(data.assistant_response).toBe(
        'To implement vector search, you need to use pgvector...'
      );
      expect(data.tools_used).toEqual(['Grep', 'Read', 'Edit']);
    });

    it('should not store if no assistant response', async () => {
      const context: HookContext = {
        userMessage: 'Test message',
        project: 'test-project',
        timestamp: new Date(),
        metadata: {},
        // No assistantResponse
      };

      const result = await handler(context);

      expect(result.stored).toBe(false);
      expect(result.reason).toBe('no_response');
      expect(mockSubmitToServers).not.toHaveBeenCalled();
    });

    it('should handle empty assistant response', async () => {
      const context: HookContext = {
        userMessage: 'Test message',
        assistantResponse: '',
        project: 'test-project',
        timestamp: new Date(),
        metadata: {},
      };

      const result = await handler(context);

      // Empty string is falsy, so should not store
      expect(result.stored).toBe(false);
      expect(result.reason).toBe('no_response');
      expect(mockSubmitToServers).not.toHaveBeenCalled();
    });

    it('should handle missing tools_used', async () => {
      const context: HookContext = {
        userMessage: 'Test message',
        assistantResponse: 'Test response',
        project: 'test-project',
        timestamp: new Date(),
        metadata: {},
        // No toolsUsed
      };

      mockSubmitToServers.mockResolvedValue([
        {
          success: true,
          server: 'viki',
          statusCode: 200,
          responseData: { stored: true },
        },
      ]);

      const result = await handler(context);

      expect(result.stored).toBe(true);

      const [, , data] = mockSubmitToServers.mock.calls[0];
      expect(data.tools_used).toEqual([]);
    });

    it('should use environment variable for VIKI URL', async () => {
      process.env.VIKI_URL = 'https://custom.viki.url';

      const context: HookContext = {
        userMessage: 'Test',
        assistantResponse: 'Response',
        project: 'test',
        timestamp: new Date(),
        metadata: {},
      };

      mockSubmitToServers.mockResolvedValue([
        {
          success: true,
          server: 'viki',
          statusCode: 200,
          responseData: { stored: true },
        },
      ]);

      await handler(context);

      const [servers] = mockSubmitToServers.mock.calls[0];
      expect(servers[0].url).toBe('https://custom.viki.url');
    });

    it('should use default VIKI URL if environment variable not set', async () => {
      delete process.env.VIKI_URL;

      const context: HookContext = {
        userMessage: 'Test',
        assistantResponse: 'Response',
        project: 'test',
        timestamp: new Date(),
        metadata: {},
      };

      mockSubmitToServers.mockResolvedValue([
        {
          success: true,
          server: 'viki',
          statusCode: 200,
          responseData: { stored: true },
        },
      ]);

      await handler(context);

      const [servers] = mockSubmitToServers.mock.calls[0];
      expect(servers[0].url).toBe('https://viki.yjos.lgtm.build');
    });

    it('should configure retry settings correctly', async () => {
      const context: HookContext = {
        userMessage: 'Test',
        assistantResponse: 'Response',
        project: 'test',
        timestamp: new Date(),
        metadata: {},
      };

      mockSubmitToServers.mockResolvedValue([
        {
          success: true,
          server: 'viki',
          statusCode: 200,
          responseData: { stored: true },
        },
      ]);

      await handler(context);

      const [servers] = mockSubmitToServers.mock.calls[0];
      expect(servers[0].retry).toEqual({
        maxAttempts: 3,
        backoff: 'exponential',
        initialDelayMs: 1000,
      });
    });

    it('should configure authentication correctly', async () => {
      const context: HookContext = {
        userMessage: 'Test',
        assistantResponse: 'Response',
        project: 'test',
        timestamp: new Date(),
        metadata: {},
      };

      mockSubmitToServers.mockResolvedValue([
        {
          success: true,
          server: 'viki',
          statusCode: 200,
          responseData: { stored: true },
        },
      ]);

      await handler(context);

      const [servers] = mockSubmitToServers.mock.calls[0];
      expect(servers[0].auth).toEqual({
        type: 'bearer',
        tokenEnv: 'VIKI_API_TOKEN',
      });
    });

    it('should set timeout correctly', async () => {
      const context: HookContext = {
        userMessage: 'Test',
        assistantResponse: 'Response',
        project: 'test',
        timestamp: new Date(),
        metadata: {},
      };

      mockSubmitToServers.mockResolvedValue([
        {
          success: true,
          server: 'viki',
          statusCode: 200,
          responseData: { stored: true },
        },
      ]);

      await handler(context);

      const [servers] = mockSubmitToServers.mock.calls[0];
      expect(servers[0].timeoutMs).toBe(5000);
    });

    it('should handle successful submission', async () => {
      const context: HookContext = {
        userMessage: 'Test',
        assistantResponse: 'Response',
        project: 'test',
        timestamp: new Date(),
        metadata: {},
      };

      mockSubmitToServers.mockResolvedValue([
        {
          success: true,
          server: 'viki',
          statusCode: 200,
          responseData: { stored: true },
        },
      ]);

      const result = await handler(context);

      expect(result.stored).toBe(true);
      expect(result.conversation_id).toBeDefined();
      expect(result.results).toHaveLength(1);
      expect(result.results[0].success).toBe(true);
    });

    it('should handle failed submission', async () => {
      const context: HookContext = {
        userMessage: 'Test',
        assistantResponse: 'Response',
        project: 'test',
        timestamp: new Date(),
        metadata: {},
      };

      mockSubmitToServers.mockResolvedValue([
        {
          success: false,
          server: 'viki',
          error: 'Connection timeout',
        },
      ]);

      const result = await handler(context);

      expect(result.stored).toBe(false);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].success).toBe(false);
    });

    it('should generate unique conversation IDs', async () => {
      const context: HookContext = {
        userMessage: 'Test',
        assistantResponse: 'Response',
        project: 'test',
        timestamp: new Date(),
        metadata: {},
      };

      mockSubmitToServers.mockResolvedValue([
        {
          success: true,
          server: 'viki',
          statusCode: 200,
          responseData: { stored: true },
        },
      ]);

      const result1 = await handler(context);
      const result2 = await handler(context);

      expect(result1.conversation_id).not.toBe(result2.conversation_id);
      expect(result1.conversation_id).toMatch(/^conv_\d+_[a-z0-9]+$/);
      expect(result2.conversation_id).toMatch(/^conv_\d+_[a-z0-9]+$/);
    });

    it('should include timestamp in ISO format', async () => {
      const context: HookContext = {
        userMessage: 'Test',
        assistantResponse: 'Response',
        project: 'test',
        timestamp: new Date(),
        metadata: {},
      };

      mockSubmitToServers.mockResolvedValue([
        {
          success: true,
          server: 'viki',
          statusCode: 200,
          responseData: { stored: true },
        },
      ]);

      await handler(context);

      const [, , data] = mockSubmitToServers.mock.calls[0];
      expect(data.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );
    });
  });
});
