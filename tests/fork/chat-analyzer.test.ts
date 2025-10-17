import {
  parseConversation,
  identifyForkPoints,
  clusterByTopic,
  extractDependencies,
  identifyConversationPhases,
  extractFileReferences,
  Conversation,
  Message,
  ForkPoint,
  TopicCluster,
  ConversationPhase
} from '@/fork/chat-analyzer';

describe('Chat History Analyzer', () => {
  describe('parseConversation', () => {
    it('should parse basic conversation', () => {
      const conversation: Conversation = {
        messages: [
          { role: 'user', content: 'Create a TUI menu system', timestamp: '2025-10-17T00:00:00Z' },
          { role: 'assistant', content: 'Creating Menu.tsx...', timestamp: '2025-10-17T00:01:00Z' }
        ],
        files: ['Menu.tsx', 'tests/Menu.test.tsx'],
        timestamp: '2025-10-17T00:00:00Z'
      };

      const parsed = parseConversation(conversation);

      expect(parsed.messageCount).toBe(2);
      expect(parsed.fileReferences).toContain('Menu.tsx');
      expect(parsed.fileReferences).toContain('tests/Menu.test.tsx');
    });

    it('should handle empty conversation', () => {
      const conversation: Conversation = {
        messages: [],
        files: [],
        timestamp: '2025-10-17T00:00:00Z'
      };

      const parsed = parseConversation(conversation);

      expect(parsed.messageCount).toBe(0);
      expect(parsed.fileReferences).toEqual([]);
      expect(parsed.duration).toBeUndefined();
    });

    it('should calculate duration from timestamps', () => {
      const conversation: Conversation = {
        messages: [
          { role: 'user', content: 'Start', timestamp: '2025-10-17T00:00:00Z' },
          { role: 'assistant', content: 'End', timestamp: '2025-10-17T01:30:00Z' }
        ],
        files: [],
        timestamp: '2025-10-17T00:00:00Z'
      };

      const parsed = parseConversation(conversation);

      expect(parsed.duration).toBe(5400000); // 1.5 hours in milliseconds
    });

    it('should extract unique file references', () => {
      const conversation: Conversation = {
        messages: [
          { role: 'user', content: 'Test', timestamp: '2025-10-17T00:00:00Z' }
        ],
        files: ['test.ts', 'test.ts', 'other.ts'],
        timestamp: '2025-10-17T00:00:00Z'
      };

      const parsed = parseConversation(conversation);

      expect(parsed.fileReferences).toEqual(['test.ts', 'other.ts']);
      expect(parsed.fileReferences.length).toBe(2);
    });

    it('should handle metadata', () => {
      const conversation: Conversation = {
        messages: [],
        files: [],
        timestamp: '2025-10-17T00:00:00Z',
        metadata: { project: 'ccem', version: '1.0.0' }
      };

      const parsed = parseConversation(conversation);

      expect(parsed.metadata).toEqual({ project: 'ccem', version: '1.0.0' });
    });
  });

  describe('identifyForkPoints', () => {
    it('should identify conversation-based fork point', () => {
      const conversation: Conversation = {
        messages: [
          { role: 'user', content: 'Create a TUI menu system with React and Ink', timestamp: '2025-10-17T00:00:00Z' },
          { role: 'assistant', content: 'Creating Menu.tsx with React components', timestamp: '2025-10-17T00:01:00Z' },
          { role: 'user', content: 'Add keyboard navigation', timestamp: '2025-10-17T00:02:00Z' }
        ],
        files: ['Menu.tsx', 'tests/Menu.test.tsx', 'types.ts'],
        timestamp: '2025-10-17T00:00:00Z'
      };

      const forkPoints = identifyForkPoints(conversation);

      expect(forkPoints.length).toBeGreaterThan(0);
      expect(forkPoints[0]).toHaveProperty('type');
      expect(forkPoints[0]).toHaveProperty('context');
      expect(forkPoints[0]).toHaveProperty('files');
      expect(forkPoints[0]?.type).toBe('conversation-based');
    });

    it('should identify training-data fork point', () => {
      const conversation: Conversation = {
        messages: [
          { role: 'user', content: 'TRAINING: Create schema definitions', timestamp: '2025-10-17T00:00:00Z' },
          { role: 'assistant', content: 'Creating training-data.json', timestamp: '2025-10-17T00:01:00Z' }
        ],
        files: ['training-data.json', 'schema.json'],
        timestamp: '2025-10-17T00:00:00Z'
      };

      const forkPoints = identifyForkPoints(conversation);

      const trainingFork = forkPoints.find(fp => fp.type === 'training-data');
      expect(trainingFork).toBeDefined();
      expect(trainingFork?.trainingData).toBeDefined();
    });

    it('should handle conversation without fork points', () => {
      const conversation: Conversation = {
        messages: [
          { role: 'user', content: 'What is TypeScript?', timestamp: '2025-10-17T00:00:00Z' },
          { role: 'assistant', content: 'TypeScript is...', timestamp: '2025-10-17T00:01:00Z' }
        ],
        files: [],
        timestamp: '2025-10-17T00:00:00Z'
      };

      const forkPoints = identifyForkPoints(conversation);

      expect(forkPoints).toEqual([]);
    });

    it('should identify context-extraction fork point', () => {
      const conversation: Conversation = {
        messages: [
          { role: 'user', content: 'Create schema system', timestamp: '2025-10-17T00:00:00Z' },
          { role: 'assistant', content: 'Working on schemas', timestamp: '2025-10-17T00:01:00Z' },
          { role: 'user', content: 'Create TUI system', timestamp: '2025-10-17T00:10:00Z' },
          { role: 'assistant', content: 'Working on TUI', timestamp: '2025-10-17T00:11:00Z' }
        ],
        files: ['schema.ts', 'tui.tsx', 'other.ts'],
        timestamp: '2025-10-17T00:00:00Z'
      };

      const forkPoints = identifyForkPoints(conversation);

      const contextFork = forkPoints.find(fp => fp.type === 'context-extraction');
      expect(contextFork).toBeDefined();
      expect(contextFork?.context.length).toBeGreaterThan(0);
    });

    it('should score fork points by completeness', () => {
      const conversation: Conversation = {
        messages: [
          { role: 'user', content: 'Create complete system with tests and docs', timestamp: '2025-10-17T00:00:00Z' },
          { role: 'assistant', content: 'Creating system', timestamp: '2025-10-17T00:01:00Z' }
        ],
        files: ['system.ts', 'tests/system.test.ts', 'docs/README.md'],
        timestamp: '2025-10-17T00:00:00Z'
      };

      const forkPoints = identifyForkPoints(conversation);

      expect(forkPoints[0]).toHaveProperty('score');
      expect(forkPoints[0]?.score).toBeGreaterThan(0);
    });
  });

  describe('clusterByTopic', () => {
    it('should cluster related messages by topic', () => {
      const conversation: Conversation = {
        messages: [
          { role: 'user', content: 'Create TUI menu', timestamp: '2025-10-17T00:00:00Z' },
          { role: 'assistant', content: 'Creating Menu.tsx', timestamp: '2025-10-17T00:01:00Z' },
          { role: 'user', content: 'Create schema validator', timestamp: '2025-10-17T00:10:00Z' },
          { role: 'assistant', content: 'Creating validator.ts', timestamp: '2025-10-17T00:11:00Z' }
        ],
        files: ['Menu.tsx', 'validator.ts'],
        timestamp: '2025-10-17T00:00:00Z'
      };

      const clusters = clusterByTopic(conversation);

      expect(clusters.length).toBeGreaterThan(0);
      clusters.forEach(cluster => {
        expect(cluster).toHaveProperty('topic');
        expect(cluster).toHaveProperty('messages');
        expect(Array.isArray(cluster.messages)).toBe(true);
      });
    });

    it('should assign appropriate topic labels', () => {
      const conversation: Conversation = {
        messages: [
          { role: 'user', content: 'Create TUI system with React and Ink', timestamp: '2025-10-17T00:00:00Z' },
          { role: 'assistant', content: 'Building TUI components', timestamp: '2025-10-17T00:01:00Z' }
        ],
        files: [],
        timestamp: '2025-10-17T00:00:00Z'
      };

      const clusters = clusterByTopic(conversation);

      expect(clusters.some(c => c.topic.toLowerCase().includes('tui'))).toBe(true);
    });

    it('should handle single topic conversation', () => {
      const conversation: Conversation = {
        messages: [
          { role: 'user', content: 'Create menu', timestamp: '2025-10-17T00:00:00Z' },
          { role: 'assistant', content: 'Creating menu', timestamp: '2025-10-17T00:01:00Z' }
        ],
        files: [],
        timestamp: '2025-10-17T00:00:00Z'
      };

      const clusters = clusterByTopic(conversation);

      expect(clusters.length).toBe(1);
    });

    it('should include file associations in clusters', () => {
      const conversation: Conversation = {
        messages: [
          { role: 'user', content: 'Create Menu.tsx', timestamp: '2025-10-17T00:00:00Z' }
        ],
        files: ['Menu.tsx', 'tests/Menu.test.tsx'],
        timestamp: '2025-10-17T00:00:00Z'
      };

      const clusters = clusterByTopic(conversation);

      expect(clusters[0]).toHaveProperty('relatedFiles');
      expect(Array.isArray(clusters[0]?.relatedFiles)).toBe(true);
    });

    it('should handle empty conversation', () => {
      const conversation: Conversation = {
        messages: [],
        files: [],
        timestamp: '2025-10-17T00:00:00Z'
      };

      const clusters = clusterByTopic(conversation);

      expect(clusters).toEqual([]);
    });
  });

  describe('extractDependencies', () => {
    it('should extract file dependencies from conversation', () => {
      const conversation: Conversation = {
        messages: [
          { role: 'user', content: 'Create Menu.tsx and tests/Menu.test.tsx', timestamp: '2025-10-17T00:00:00Z' }
        ],
        files: ['Menu.tsx', 'tests/Menu.test.tsx', 'types.ts'],
        timestamp: '2025-10-17T00:00:00Z'
      };

      const deps = extractDependencies(conversation);

      expect(deps['Menu.tsx']).toBeDefined();
      expect(Array.isArray(deps['Menu.tsx'])).toBe(true);
    });

    it('should identify test file dependencies', () => {
      const conversation: Conversation = {
        messages: [],
        files: ['Menu.tsx', 'tests/Menu.test.tsx'],
        timestamp: '2025-10-17T00:00:00Z'
      };

      const deps = extractDependencies(conversation);

      expect(deps['Menu.tsx']).toContain('tests/Menu.test.tsx');
    });

    it('should handle files with no dependencies', () => {
      const conversation: Conversation = {
        messages: [],
        files: ['standalone.ts'],
        timestamp: '2025-10-17T00:00:00Z'
      };

      const deps = extractDependencies(conversation);

      expect(deps['standalone.ts']).toEqual([]);
    });

    it('should detect circular dependencies', () => {
      const conversation: Conversation = {
        messages: [
          { role: 'assistant', content: 'A imports B, B imports A', timestamp: '2025-10-17T00:00:00Z' }
        ],
        files: ['A.ts', 'B.ts'],
        timestamp: '2025-10-17T00:00:00Z'
      };

      const deps = extractDependencies(conversation);

      expect(deps).toBeDefined();
      // Should handle circular deps gracefully
    });

    it('should extract dependencies from import statements', () => {
      const conversation: Conversation = {
        messages: [
          {
            role: 'assistant',
            content: 'import { Menu } from "./Menu"; import "./styles.css"',
            timestamp: '2025-10-17T00:00:00Z'
          }
        ],
        files: ['App.tsx', 'Menu.tsx', 'styles.css'],
        timestamp: '2025-10-17T00:00:00Z'
      };

      const deps = extractDependencies(conversation);

      expect(deps['App.tsx']).toBeDefined();
    });
  });

  describe('identifyConversationPhases', () => {
    it('should identify planning phase', () => {
      const conversation: Conversation = {
        messages: [
          { role: 'user', content: 'We need to design a schema system', timestamp: '2025-10-17T00:00:00Z' },
          { role: 'assistant', content: 'Let me outline the approach', timestamp: '2025-10-17T00:01:00Z' }
        ],
        files: [],
        timestamp: '2025-10-17T00:00:00Z'
      };

      const phases = identifyConversationPhases(conversation);

      expect(phases.some(p => p.phase === 'planning')).toBe(true);
    });

    it('should identify implementation phase', () => {
      const conversation: Conversation = {
        messages: [
          { role: 'assistant', content: 'Creating validator.ts', timestamp: '2025-10-17T00:00:00Z' },
          { role: 'assistant', content: 'Implementing validation logic', timestamp: '2025-10-17T00:01:00Z' }
        ],
        files: ['validator.ts'],
        timestamp: '2025-10-17T00:00:00Z'
      };

      const phases = identifyConversationPhases(conversation);

      expect(phases.some(p => p.phase === 'implementation')).toBe(true);
    });

    it('should identify testing phase', () => {
      const conversation: Conversation = {
        messages: [
          { role: 'user', content: 'Run the tests', timestamp: '2025-10-17T00:00:00Z' },
          { role: 'assistant', content: 'Running npm test...', timestamp: '2025-10-17T00:01:00Z' }
        ],
        files: ['tests/validator.test.ts'],
        timestamp: '2025-10-17T00:00:00Z'
      };

      const phases = identifyConversationPhases(conversation);

      expect(phases.some(p => p.phase === 'testing')).toBe(true);
    });

    it('should order phases chronologically', () => {
      const conversation: Conversation = {
        messages: [
          { role: 'user', content: 'Plan the system', timestamp: '2025-10-17T00:00:00Z' },
          { role: 'assistant', content: 'Implementing...', timestamp: '2025-10-17T00:10:00Z' },
          { role: 'user', content: 'Run tests', timestamp: '2025-10-17T00:20:00Z' }
        ],
        files: [],
        timestamp: '2025-10-17T00:00:00Z'
      };

      const phases = identifyConversationPhases(conversation);

      for (let i = 1; i < phases.length; i++) {
        const prev = phases[i - 1];
        const curr = phases[i];
        if (prev && curr) {
          expect(prev.startTime <= curr.startTime).toBe(true);
        }
      }
    });

    it('should handle single phase conversation', () => {
      const conversation: Conversation = {
        messages: [
          { role: 'user', content: 'Create file', timestamp: '2025-10-17T00:00:00Z' },
          { role: 'assistant', content: 'Creating file', timestamp: '2025-10-17T00:01:00Z' }
        ],
        files: [],
        timestamp: '2025-10-17T00:00:00Z'
      };

      const phases = identifyConversationPhases(conversation);

      expect(phases.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('extractFileReferences', () => {
    it('should extract file references from message content', () => {
      const messages: Message[] = [
        { role: 'user', content: 'Create Menu.tsx and validator.ts', timestamp: '2025-10-17T00:00:00Z' },
        { role: 'assistant', content: 'Working on tests/Menu.test.tsx', timestamp: '2025-10-17T00:01:00Z' }
      ];

      const files = extractFileReferences(messages);

      expect(files).toContain('Menu.tsx');
      expect(files).toContain('validator.ts');
      expect(files).toContain('tests/Menu.test.tsx');
    });

    it('should extract file references from code blocks', () => {
      const messages: Message[] = [
        {
          role: 'assistant',
          content: '```typescript\n// src/validator.ts\nexport function validate() {}\n```',
          timestamp: '2025-10-17T00:00:00Z'
        }
      ];

      const files = extractFileReferences(messages);

      expect(files).toContain('src/validator.ts');
    });

    it('should handle messages without file references', () => {
      const messages: Message[] = [
        { role: 'user', content: 'How does validation work?', timestamp: '2025-10-17T00:00:00Z' }
      ];

      const files = extractFileReferences(messages);

      expect(files).toEqual([]);
    });

    it('should deduplicate file references', () => {
      const messages: Message[] = [
        { role: 'user', content: 'Create test.ts', timestamp: '2025-10-17T00:00:00Z' },
        { role: 'assistant', content: 'Working on test.ts', timestamp: '2025-10-17T00:01:00Z' }
      ];

      const files = extractFileReferences(messages);

      expect(files.filter(f => f === 'test.ts').length).toBe(1);
    });

    it('should extract paths with directories', () => {
      const messages: Message[] = [
        { role: 'user', content: 'Create src/schema/validator.ts', timestamp: '2025-10-17T00:00:00Z' }
      ];

      const files = extractFileReferences(messages);

      expect(files).toContain('src/schema/validator.ts');
    });
  });
});
