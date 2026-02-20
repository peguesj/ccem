/**
 * Test suite for VIKI Message Analysis Hook
 * Tests message analysis functionality with various message types
 */

import { analyzeMessage } from '../../src/hooks/templates/handlers/analyze-message.js';
import { HookContext } from '../../src/hooks/types.js';

describe('VIKI Message Analysis Hook', () => {
  const baseContext: HookContext = {
    userMessage: '',
    project: 'test-project',
    timestamp: new Date(),
    metadata: {},
  };

  describe('analyzeMessage', () => {
    it('should detect data-related categories and keywords', async () => {
      const context: HookContext = {
        ...baseContext,
        userMessage: 'I need to backfill vector embeddings for conversations',
      };

      const analysis = await analyzeMessage(context);

      expect(analysis.detected_categories).toContain('data');
      expect(analysis.detected_keywords).toContain('backfill');
      expect(analysis.detected_keywords).toContain('vector');
      expect(analysis.detected_keywords).toContain('embedding');
      expect(analysis.detected_keywords).toContain('conversation');
      expect(analysis.project).toBe('test-project');
    });

    it('should detect search-related categories', async () => {
      const context: HookContext = {
        ...baseContext,
        userMessage: 'How do I query the similarity search for user messages?',
      };

      const analysis = await analyzeMessage(context);

      expect(analysis.detected_categories).toContain('search');
      expect(analysis.detected_keywords).toContain('query');
      expect(analysis.detected_keywords).toContain('similarity');
      expect(analysis.detected_keywords).toContain('search');
    });

    it('should detect infrastructure-related categories', async () => {
      const context: HookContext = {
        ...baseContext,
        userMessage: 'Deploy the Azure infrastructure using Terraform',
      };

      const analysis = await analyzeMessage(context);

      expect(analysis.detected_categories).toContain('infrastructure');
      expect(analysis.detected_keywords).toContain('deploy');
      expect(analysis.detected_keywords).toContain('azure');
      expect(analysis.detected_keywords).toContain('infrastructure');
      expect(analysis.detected_keywords).toContain('terraform');
    });

    it('should detect database-related categories', async () => {
      const context: HookContext = {
        ...baseContext,
        userMessage: 'Create a PostgreSQL migration for pgvector schema changes',
      };

      const analysis = await analyzeMessage(context);

      expect(analysis.detected_categories).toContain('database');
      expect(analysis.detected_keywords).toContain('postgres');
      expect(analysis.detected_keywords).toContain('pgvector');
      expect(analysis.detected_keywords).toContain('schema');
      expect(analysis.detected_keywords).toContain('migration');
    });

    it('should detect API-related categories', async () => {
      const context: HookContext = {
        ...baseContext,
        userMessage: 'Add a new FastAPI endpoint for processing requests',
      };

      const analysis = await analyzeMessage(context);

      expect(analysis.detected_categories).toContain('api');
      expect(analysis.detected_keywords).toContain('fastapi');
      expect(analysis.detected_keywords).toContain('endpoint');
      expect(analysis.detected_keywords).toContain('request');
    });

    it('should detect testing-related categories', async () => {
      const context: HookContext = {
        ...baseContext,
        userMessage: 'Run pytest with coverage for integration tests',
      };

      const analysis = await analyzeMessage(context);

      expect(analysis.detected_categories).toContain('testing');
      expect(analysis.detected_keywords).toContain('test');
      expect(analysis.detected_keywords).toContain('pytest');
      expect(analysis.detected_keywords).toContain('coverage');
      expect(analysis.detected_keywords).toContain('integration');
    });

    it('should detect debugging-related categories', async () => {
      const context: HookContext = {
        ...baseContext,
        userMessage: 'Fix the bug causing an error in the API',
      };

      const analysis = await analyzeMessage(context);

      expect(analysis.detected_categories).toContain('debugging');
      expect(analysis.detected_keywords).toContain('fix');
      expect(analysis.detected_keywords).toContain('bug');
      expect(analysis.detected_keywords).toContain('error');
    });

    it('should detect feature development categories', async () => {
      const context: HookContext = {
        ...baseContext,
        userMessage: 'Implement a new feature for user analytics',
      };

      const analysis = await analyzeMessage(context);

      expect(analysis.detected_categories).toContain('feature');
      expect(analysis.detected_categories).toContain('analytics');
      expect(analysis.detected_keywords).toContain('implement');
      expect(analysis.detected_keywords).toContain('analytics');
    });

    it('should identify code queries correctly', async () => {
      const codeQueries = [
        'Write a function to parse JSON',
        'Implement a class for data processing',
        'Fix the error in this method',
        'Debug the authentication bug',
        'Create a new API endpoint',
        'Refactor the database query',
      ];

      for (const message of codeQueries) {
        const analysis = await analyzeMessage({
          ...baseContext,
          userMessage: message,
        });

        expect(analysis.is_code_query).toBe(true);
      }
    });

    it('should not identify non-code queries as code queries', async () => {
      const nonCodeQueries = [
        'What is the status of the deployment?',
        'When was the last backfill run?',
        'How many users are active?',
      ];

      for (const message of nonCodeQueries) {
        const analysis = await analyzeMessage({
          ...baseContext,
          userMessage: message,
        });

        expect(analysis.is_code_query).toBe(false);
      }
    });

    it('should generate suggested files for detected categories', async () => {
      const context: HookContext = {
        ...baseContext,
        userMessage: 'Update the search API and write tests',
      };

      const analysis = await analyzeMessage(context);

      expect(analysis.suggested_files.length).toBeGreaterThan(0);
      expect(analysis.suggested_files).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/search/),
          expect.stringMatching(/test/),
        ])
      );
    });

    it('should generate suggested commands for detected categories', async () => {
      const context: HookContext = {
        ...baseContext,
        userMessage: 'Run tests and check coverage',
      };

      const analysis = await analyzeMessage(context);

      expect(analysis.suggested_commands.length).toBeGreaterThan(0);
      expect(analysis.suggested_commands).toEqual(
        expect.arrayContaining([expect.stringMatching(/test/)])
      );
    });

    it('should generate unique message IDs', async () => {
      const context: HookContext = {
        ...baseContext,
        userMessage: 'Test message',
      };

      const analysis1 = await analyzeMessage(context);
      const analysis2 = await analyzeMessage(context);

      expect(analysis1.message_id).not.toBe(analysis2.message_id);
      expect(analysis1.message_id).toMatch(/^msg_\d+_[a-z0-9]+$/);
    });

    it('should include timestamp in ISO format', async () => {
      const context: HookContext = {
        ...baseContext,
        userMessage: 'Test message',
      };

      const analysis = await analyzeMessage(context);

      expect(analysis.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );
    });

    it('should handle multiple overlapping categories', async () => {
      const context: HookContext = {
        ...baseContext,
        userMessage:
          'Deploy the FastAPI service and run pytest with database migrations',
      };

      const analysis = await analyzeMessage(context);

      expect(analysis.detected_categories).toContain('infrastructure');
      expect(analysis.detected_categories).toContain('api');
      expect(analysis.detected_categories).toContain('testing');
      expect(analysis.detected_categories).toContain('database');
      expect(analysis.detected_categories.length).toBeGreaterThanOrEqual(4);
    });

    it('should handle empty messages gracefully', async () => {
      const context: HookContext = {
        ...baseContext,
        userMessage: '',
      };

      const analysis = await analyzeMessage(context);

      expect(analysis.detected_categories).toEqual([]);
      expect(analysis.detected_keywords).toEqual([]);
      expect(analysis.is_code_query).toBe(false);
      expect(analysis.suggested_files).toEqual([]);
      expect(analysis.suggested_commands).toEqual([]);
    });

    it('should be case-insensitive', async () => {
      const context: HookContext = {
        ...baseContext,
        userMessage: 'DEPLOY INFRASTRUCTURE WITH TERRAFORM',
      };

      const analysis = await analyzeMessage(context);

      expect(analysis.detected_categories).toContain('infrastructure');
      expect(analysis.detected_keywords).toContain('deploy');
      expect(analysis.detected_keywords).toContain('infrastructure');
      expect(analysis.detected_keywords).toContain('terraform');
    });
  });
});
