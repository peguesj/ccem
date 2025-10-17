import {
  mapConversationToCode,
  trackImplementation,
  identifyOrphans,
  generateTraceabilityReport,
  ConversationMapping,
  ImplementationStatus,
  TraceabilityReport,
} from '@/fork/conversation-mapper';
import { Conversation } from '@/fork/chat-analyzer';

describe('Conversation-to-Code Mapper', () => {
  const sampleConversation: Conversation = {
    messages: [
      { role: 'user', content: 'Create a TUI menu component', timestamp: '2025-10-17T00:00:00Z' },
      {
        role: 'assistant',
        content: 'Creating Menu.tsx with React and Ink',
        timestamp: '2025-10-17T00:01:00Z',
      },
      {
        role: 'user',
        content: 'Add keyboard navigation support',
        timestamp: '2025-10-17T00:05:00Z',
      },
      {
        role: 'assistant',
        content: 'Adding arrow key navigation to Menu.tsx',
        timestamp: '2025-10-17T00:06:00Z',
      },
      { role: 'user', content: 'Create tests for the menu', timestamp: '2025-10-17T00:10:00Z' },
      {
        role: 'assistant',
        content: 'Creating tests/Menu.test.tsx',
        timestamp: '2025-10-17T00:11:00Z',
      },
      { role: 'user', content: 'Add schema validation system', timestamp: '2025-10-17T00:15:00Z' },
      {
        role: 'assistant',
        content: 'Implementing validator.ts with Zod',
        timestamp: '2025-10-17T00:16:00Z',
      },
    ],
    files: ['Menu.tsx', 'tests/Menu.test.tsx', 'validator.ts'],
    timestamp: '2025-10-17T00:00:00Z',
  };

  describe('mapConversationToCode', () => {
    it('should map conversation messages to code artifacts', () => {
      const mapping = mapConversationToCode(sampleConversation);

      expect(mapping).toHaveProperty('messages');
      expect(mapping).toHaveProperty('files');
      expect(mapping).toHaveProperty('mappings');
      expect(Array.isArray(mapping.mappings)).toBe(true);
    });

    it('should create mappings for each file', () => {
      const mapping = mapConversationToCode(sampleConversation);

      sampleConversation.files.forEach((file) => {
        expect(mapping.mappings.some((m) => m.file === file)).toBe(true);
      });
    });

    it('should associate messages with files', () => {
      const mapping = mapConversationToCode(sampleConversation);

      mapping.mappings.forEach((m) => {
        expect(m).toHaveProperty('relatedMessages');
        expect(Array.isArray(m.relatedMessages)).toBe(true);
        if (m.relatedMessages.length > 0) {
          expect(typeof m.relatedMessages[0]).toBe('number');
        }
      });
    });

    it('should identify user requests', () => {
      const mapping = mapConversationToCode(sampleConversation);

      expect(mapping).toHaveProperty('userRequests');
      expect(Array.isArray(mapping.userRequests)).toBe(true);
      expect(mapping.userRequests.length).toBeGreaterThan(0);
    });

    it('should track implementation status', () => {
      const mapping = mapConversationToCode(sampleConversation);

      mapping.mappings.forEach((m) => {
        expect(m).toHaveProperty('implementationStatus');
        expect(['implemented', 'partial', 'not-implemented']).toContain(m.implementationStatus);
      });
    });

    it('should handle empty conversation', () => {
      const emptyConv: Conversation = {
        messages: [],
        files: [],
        timestamp: '2025-10-17T00:00:00Z',
      };

      const mapping = mapConversationToCode(emptyConv);

      expect(mapping.mappings).toEqual([]);
      expect(mapping.userRequests).toEqual([]);
    });

    it('should include timestamps', () => {
      const mapping = mapConversationToCode(sampleConversation);

      mapping.mappings.forEach((m) => {
        expect(m).toHaveProperty('createdAt');
        expect(typeof m.createdAt).toBe('string');
      });
    });
  });

  describe('trackImplementation', () => {
    it('should track implementation of user requests', () => {
      const status = trackImplementation(sampleConversation);

      expect(status).toHaveProperty('totalRequests');
      expect(status).toHaveProperty('implemented');
      expect(status).toHaveProperty('partial');
      expect(status).toHaveProperty('notImplemented');
      expect(typeof status.totalRequests).toBe('number');
    });

    it('should calculate implementation percentage', () => {
      const status = trackImplementation(sampleConversation);

      expect(status).toHaveProperty('implementationRate');
      expect(typeof status.implementationRate).toBe('number');
      expect(status.implementationRate).toBeGreaterThanOrEqual(0);
      expect(status.implementationRate).toBeLessThanOrEqual(100);
    });

    it('should identify implemented requests', () => {
      const status = trackImplementation(sampleConversation);

      expect(status.implemented).toBeGreaterThan(0);
      // We have files, so some requests should be implemented
    });

    it('should detect partial implementations', () => {
      const status = trackImplementation(sampleConversation);

      expect(status).toHaveProperty('partial');
      expect(typeof status.partial).toBe('number');
    });

    it('should list pending requests', () => {
      const status = trackImplementation(sampleConversation);

      expect(status).toHaveProperty('pendingRequests');
      expect(Array.isArray(status.pendingRequests)).toBe(true);
    });

    it('should include details for each request', () => {
      const status = trackImplementation(sampleConversation);

      expect(status).toHaveProperty('details');
      expect(Array.isArray(status.details)).toBe(true);
      status.details.forEach((detail) => {
        expect(detail).toHaveProperty('request');
        expect(detail).toHaveProperty('status');
        expect(detail).toHaveProperty('files');
      });
    });

    it('should handle conversation with no requests', () => {
      const conv: Conversation = {
        messages: [
          {
            role: 'assistant',
            content: 'Information about TypeScript',
            timestamp: '2025-10-17T00:00:00Z',
          },
        ],
        files: [],
        timestamp: '2025-10-17T00:00:00Z',
      };

      const status = trackImplementation(conv);

      expect(status.totalRequests).toBe(0);
      expect(status.implementationRate).toBe(0);
    });
  });

  describe('identifyOrphans', () => {
    it('should identify orphaned conversations', () => {
      const orphans = identifyOrphans(sampleConversation);

      expect(Array.isArray(orphans)).toBe(true);
    });

    it('should detect discussed but not implemented features', () => {
      const convWithOrphans: Conversation = {
        messages: [
          {
            role: 'user',
            content: 'Create authentication system',
            timestamp: '2025-10-17T00:00:00Z',
          },
          {
            role: 'assistant',
            content: 'I will create auth.ts',
            timestamp: '2025-10-17T00:01:00Z',
          },
          { role: 'user', content: 'Create validation', timestamp: '2025-10-17T00:05:00Z' },
          {
            role: 'assistant',
            content: 'Creating validator.ts',
            timestamp: '2025-10-17T00:06:00Z',
          },
        ],
        files: ['validator.ts'], // auth.ts was discussed but not created
        timestamp: '2025-10-17T00:00:00Z',
      };

      const orphans = identifyOrphans(convWithOrphans);

      expect(orphans.length).toBeGreaterThan(0);
    });

    it('should include orphan details', () => {
      const convWithOrphans: Conversation = {
        messages: [
          {
            role: 'user',
            content: 'Create dashboard component',
            timestamp: '2025-10-17T00:00:00Z',
          },
          {
            role: 'assistant',
            content: 'Planning Dashboard.tsx',
            timestamp: '2025-10-17T00:01:00Z',
          },
        ],
        files: [],
        timestamp: '2025-10-17T00:00:00Z',
      };

      const orphans = identifyOrphans(convWithOrphans);

      if (orphans.length > 0) {
        orphans.forEach((orphan) => {
          expect(orphan).toHaveProperty('type');
          expect(orphan).toHaveProperty('description');
          expect(orphan).toHaveProperty('messageIndex');
        });
      }
    });

    it('should handle conversation with no orphans', () => {
      const conv: Conversation = {
        messages: [
          { role: 'user', content: 'Create Menu.tsx', timestamp: '2025-10-17T00:00:00Z' },
          { role: 'assistant', content: 'Creating Menu.tsx', timestamp: '2025-10-17T00:01:00Z' },
        ],
        files: ['Menu.tsx'],
        timestamp: '2025-10-17T00:00:00Z',
      };

      const orphans = identifyOrphans(conv);

      expect(orphans).toEqual([]);
    });

    it('should categorize orphan types', () => {
      const orphans = identifyOrphans(sampleConversation);

      const validTypes = ['unimplemented', 'partial', 'discussed'];
      orphans.forEach((orphan) => {
        expect(validTypes).toContain(orphan.type);
      });
    });

    it('should include suggested actions', () => {
      const convWithOrphans: Conversation = {
        messages: [
          { role: 'user', content: 'Add error handling', timestamp: '2025-10-17T00:00:00Z' },
        ],
        files: [],
        timestamp: '2025-10-17T00:00:00Z',
      };

      const orphans = identifyOrphans(convWithOrphans);

      orphans.forEach((orphan) => {
        expect(orphan).toHaveProperty('suggestedAction');
        expect(typeof orphan.suggestedAction).toBe('string');
      });
    });
  });

  describe('generateTraceabilityReport', () => {
    it('should generate comprehensive traceability report', () => {
      const report = generateTraceabilityReport(sampleConversation);

      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('mappings');
      expect(report).toHaveProperty('implementationStatus');
      expect(report).toHaveProperty('orphans');
    });

    it('should include summary statistics', () => {
      const report = generateTraceabilityReport(sampleConversation);

      expect(report.summary).toHaveProperty('totalMessages');
      expect(report.summary).toHaveProperty('totalFiles');
      expect(report.summary).toHaveProperty('totalMappings');
      expect(report.summary.totalMessages).toBe(sampleConversation.messages.length);
      expect(report.summary.totalFiles).toBe(sampleConversation.files.length);
    });

    it('should include generation timestamp', () => {
      const report = generateTraceabilityReport(sampleConversation);

      expect(report).toHaveProperty('generatedAt');
      expect(typeof report.generatedAt).toBe('string');
    });

    it('should calculate coverage metrics', () => {
      const report = generateTraceabilityReport(sampleConversation);

      expect(report).toHaveProperty('coverage');
      expect(report.coverage).toHaveProperty('messagesCovered');
      expect(report.coverage).toHaveProperty('coveragePercentage');
      expect(typeof report.coverage.coveragePercentage).toBe('number');
    });

    it('should identify high-value mappings', () => {
      const report = generateTraceabilityReport(sampleConversation);

      expect(report).toHaveProperty('highValueMappings');
      expect(Array.isArray(report.highValueMappings)).toBe(true);
    });

    it('should include recommendations', () => {
      const report = generateTraceabilityReport(sampleConversation);

      expect(report).toHaveProperty('recommendations');
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    it('should handle empty conversation', () => {
      const emptyConv: Conversation = {
        messages: [],
        files: [],
        timestamp: '2025-10-17T00:00:00Z',
      };

      const report = generateTraceabilityReport(emptyConv);

      expect(report.summary.totalMessages).toBe(0);
      expect(report.summary.totalFiles).toBe(0);
      expect(report.coverage.coveragePercentage).toBe(0);
    });

    it('should format report for export', () => {
      const report = generateTraceabilityReport(sampleConversation);

      expect(report).toHaveProperty('exportFormat');
      expect(report.exportFormat).toBe('json');
    });
  });
});
