import {
  extractByTopic,
  extractByFile,
  extractByTimeRange,
  buildDependencyGraph,
  Context,
  DependencyGraph,
  DependencyNode
} from '@/fork/context-extractor';
import { Conversation, Message } from '@/fork/chat-analyzer';

describe('Context Extraction Engine', () => {
  const sampleConversation: Conversation = {
    messages: [
      { role: 'user', content: 'Create TUI menu system', timestamp: '2025-10-17T00:00:00Z' },
      { role: 'assistant', content: 'Creating Menu.tsx', timestamp: '2025-10-17T00:01:00Z' },
      { role: 'user', content: 'Add tests for Menu', timestamp: '2025-10-17T00:05:00Z' },
      { role: 'assistant', content: 'Creating tests/Menu.test.tsx', timestamp: '2025-10-17T00:06:00Z' },
      { role: 'user', content: 'Create schema validator', timestamp: '2025-10-17T00:10:00Z' },
      { role: 'assistant', content: 'Creating validator.ts', timestamp: '2025-10-17T00:11:00Z' }
    ],
    files: ['Menu.tsx', 'tests/Menu.test.tsx', 'validator.ts', 'tests/validator.test.ts'],
    timestamp: '2025-10-17T00:00:00Z'
  };

  describe('extractByTopic', () => {
    it('should extract context by specific topic', () => {
      const context = extractByTopic(sampleConversation, 'menu');

      expect(context.messages.length).toBeGreaterThan(0);
      expect(context.messages.some(m => m.content.toLowerCase().includes('menu'))).toBe(true);
    });

    it('should include related files', () => {
      const context = extractByTopic(sampleConversation, 'menu');

      expect(context.files.some(f => f.includes('Menu'))).toBe(true);
    });

    it('should preserve message order', () => {
      const context = extractByTopic(sampleConversation, 'menu');

      for (let i = 1; i < context.messages.length; i++) {
        const prev = context.messages[i - 1];
        const curr = context.messages[i];
        if (prev && curr) {
          expect(new Date(prev.timestamp) <= new Date(curr.timestamp)).toBe(true);
        }
      }
    });

    it('should handle topic not found', () => {
      const context = extractByTopic(sampleConversation, 'nonexistent');

      expect(context.messages).toEqual([]);
      expect(context.files).toEqual([]);
    });

    it('should be case-insensitive', () => {
      const context1 = extractByTopic(sampleConversation, 'MENU');
      const context2 = extractByTopic(sampleConversation, 'menu');

      expect(context1.messages.length).toBe(context2.messages.length);
    });

    it('should include metadata', () => {
      const context = extractByTopic(sampleConversation, 'menu');

      expect(context).toHaveProperty('extractedAt');
      expect(context).toHaveProperty('topic');
      expect(context.topic).toBe('menu');
    });

    it('should calculate completeness score', () => {
      const context = extractByTopic(sampleConversation, 'menu');

      expect(context).toHaveProperty('completeness');
      expect(typeof context.completeness).toBe('number');
      expect(context.completeness).toBeGreaterThanOrEqual(0);
      expect(context.completeness).toBeLessThanOrEqual(100);
    });
  });

  describe('extractByFile', () => {
    it('should extract context related to specific file', () => {
      const context = extractByFile(sampleConversation, 'Menu.tsx');

      expect(context.messages.length).toBeGreaterThan(0);
      expect(context.files).toContain('Menu.tsx');
    });

    it('should include messages mentioning the file', () => {
      const context = extractByFile(sampleConversation, 'Menu.tsx');

      expect(context.messages.some(m => m.content.includes('Menu'))).toBe(true);
    });

    it('should include related files', () => {
      const context = extractByFile(sampleConversation, 'Menu.tsx');

      // Should include test file for Menu.tsx
      expect(context.files.some(f => f.includes('test') && f.includes('Menu'))).toBe(true);
    });

    it('should handle file not found', () => {
      const context = extractByFile(sampleConversation, 'nonexistent.ts');

      expect(context.messages).toEqual([]);
      expect(context.files).toEqual([]);
    });

    it('should support partial file names', () => {
      const context = extractByFile(sampleConversation, 'validator');

      expect(context.messages.length).toBeGreaterThan(0);
      expect(context.files.some(f => f.includes('validator'))).toBe(true);
    });

    it('should include file metadata', () => {
      const context = extractByFile(sampleConversation, 'Menu.tsx');

      expect(context).toHaveProperty('targetFile');
      expect(context.targetFile).toBe('Menu.tsx');
    });

    it('should detect file dependencies', () => {
      const context = extractByFile(sampleConversation, 'Menu.tsx');

      expect(context).toHaveProperty('dependencies');
      expect(Array.isArray(context.dependencies)).toBe(true);
    });
  });

  describe('extractByTimeRange', () => {
    it('should extract messages within time range', () => {
      const startTime = '2025-10-17T00:00:00Z';
      const endTime = '2025-10-17T00:05:00Z';

      const context = extractByTimeRange(sampleConversation, startTime, endTime);

      expect(context.messages.length).toBeGreaterThan(0);
      context.messages.forEach(m => {
        const msgTime = new Date(m.timestamp).getTime();
        expect(msgTime).toBeGreaterThanOrEqual(new Date(startTime).getTime());
        expect(msgTime).toBeLessThanOrEqual(new Date(endTime).getTime());
      });
    });

    it('should include files created in time range', () => {
      const startTime = '2025-10-17T00:00:00Z';
      const endTime = '2025-10-17T00:05:00Z';

      const context = extractByTimeRange(sampleConversation, startTime, endTime);

      expect(context.files.length).toBeGreaterThan(0);
    });

    it('should handle time range with no messages', () => {
      const startTime = '2025-10-18T00:00:00Z';
      const endTime = '2025-10-18T01:00:00Z';

      const context = extractByTimeRange(sampleConversation, startTime, endTime);

      expect(context.messages).toEqual([]);
    });

    it('should handle invalid time range', () => {
      const startTime = '2025-10-17T00:10:00Z';
      const endTime = '2025-10-17T00:05:00Z'; // End before start

      const context = extractByTimeRange(sampleConversation, startTime, endTime);

      expect(context.messages).toEqual([]);
    });

    it('should include time range metadata', () => {
      const startTime = '2025-10-17T00:00:00Z';
      const endTime = '2025-10-17T00:05:00Z';

      const context = extractByTimeRange(sampleConversation, startTime, endTime);

      expect(context).toHaveProperty('startTime');
      expect(context).toHaveProperty('endTime');
      expect(context.startTime).toBe(startTime);
      expect(context.endTime).toBe(endTime);
    });

    it('should calculate duration', () => {
      const startTime = '2025-10-17T00:00:00Z';
      const endTime = '2025-10-17T00:05:00Z';

      const context = extractByTimeRange(sampleConversation, startTime, endTime);

      expect(context).toHaveProperty('duration');
      expect(context.duration).toBe(300000); // 5 minutes in ms
    });
  });

  describe('buildDependencyGraph', () => {
    it('should build dependency graph from conversation', () => {
      const graph = buildDependencyGraph(sampleConversation);

      expect(graph).toHaveProperty('nodes');
      expect(graph).toHaveProperty('edges');
      expect(Array.isArray(graph.nodes)).toBe(true);
      expect(Array.isArray(graph.edges)).toBe(true);
    });

    it('should create node for each file', () => {
      const graph = buildDependencyGraph(sampleConversation);

      expect(graph.nodes.length).toBeGreaterThanOrEqual(sampleConversation.files.length);
      sampleConversation.files.forEach(file => {
        expect(graph.nodes.some(n => n.id === file)).toBe(true);
      });
    });

    it('should identify file types', () => {
      const graph = buildDependencyGraph(sampleConversation);

      graph.nodes.forEach(node => {
        expect(node).toHaveProperty('type');
        expect(['source', 'test', 'config', 'documentation']).toContain(node.type);
      });
    });

    it('should create edges for dependencies', () => {
      const graph = buildDependencyGraph(sampleConversation);

      // Test files should have edges to source files
      const testNodes = graph.nodes.filter(n => n.type === 'test');
      testNodes.forEach(testNode => {
        const hasEdge = graph.edges.some(e => e.from === testNode.id || e.to === testNode.id);
        expect(hasEdge).toBe(true);
      });
    });

    it('should handle empty conversation', () => {
      const emptyConv: Conversation = {
        messages: [],
        files: [],
        timestamp: '2025-10-17T00:00:00Z'
      };

      const graph = buildDependencyGraph(emptyConv);

      expect(graph.nodes).toEqual([]);
      expect(graph.edges).toEqual([]);
    });

    it('should detect circular dependencies', () => {
      const graph = buildDependencyGraph(sampleConversation);

      expect(graph).toHaveProperty('hasCircularDependencies');
      expect(typeof graph.hasCircularDependencies).toBe('boolean');
    });

    it('should calculate graph metrics', () => {
      const graph = buildDependencyGraph(sampleConversation);

      expect(graph).toHaveProperty('metrics');
      expect(graph.metrics).toHaveProperty('totalNodes');
      expect(graph.metrics).toHaveProperty('totalEdges');
      expect(graph.metrics.totalNodes).toBe(graph.nodes.length);
      expect(graph.metrics.totalEdges).toBe(graph.edges.length);
    });

    it('should identify orphaned nodes', () => {
      const graph = buildDependencyGraph(sampleConversation);

      expect(graph).toHaveProperty('orphanedNodes');
      expect(Array.isArray(graph.orphanedNodes)).toBe(true);
      // Orphaned nodes have no edges
      graph.orphanedNodes.forEach(nodeId => {
        const hasEdge = graph.edges.some(e => e.from === nodeId || e.to === nodeId);
        expect(hasEdge).toBe(false);
      });
    });
  });
});
