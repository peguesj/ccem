/**
 * Context Extraction Engine for CCEM Fork Discovery System.
 *
 * Extracts conversation contexts by topic, file, or time range and builds
 * dependency graphs to understand code relationships.
 *
 * @module fork/context-extractor
 * @version 0.5.0
 * @since 0.5.0
 */

import { Conversation, Message } from './chat-analyzer.js';

/**
 * Extracted context interface.
 *
 * @interface Context
 * @version 0.5.0
 * @since 0.5.0
 */
export interface Context {
  /** Extracted messages */
  messages: Message[];
  /** Related files */
  files: string[];
  /** Extraction timestamp */
  extractedAt: string;
  /** Topic filter (if applicable) */
  topic?: string;
  /** Target file (if applicable) */
  targetFile?: string;
  /** Time range start (if applicable) */
  startTime?: string;
  /** Time range end (if applicable) */
  endTime?: string;
  /** Duration in milliseconds (if applicable) */
  duration?: number;
  /** Context completeness score (0-100) */
  completeness: number;
  /** File dependencies */
  dependencies?: string[];
}

/**
 * Node type in dependency graph.
 *
 * @typedef {'source' | 'test' | 'config' | 'documentation'} NodeType
 * @version 0.5.0
 * @since 0.5.0
 */
export type NodeType = 'source' | 'test' | 'config' | 'documentation';

/**
 * Dependency graph node interface.
 *
 * @interface DependencyNode
 * @version 0.5.0
 * @since 0.5.0
 */
export interface DependencyNode {
  /** Node identifier (file path) */
  id: string;
  /** Node type */
  type: NodeType;
  /** Node label */
  label?: string;
}

/**
 * Dependency graph edge interface.
 *
 * @interface DependencyEdge
 * @version 0.5.0
 * @since 0.5.0
 */
export interface DependencyEdge {
  /** Source node */
  from: string;
  /** Target node */
  to: string;
  /** Edge type */
  type: 'imports' | 'tests' | 'references';
}

/**
 * Dependency graph interface.
 *
 * @interface DependencyGraph
 * @version 0.5.0
 * @since 0.5.0
 */
export interface DependencyGraph {
  /** Graph nodes */
  nodes: DependencyNode[];
  /** Graph edges */
  edges: DependencyEdge[];
  /** Has circular dependencies */
  hasCircularDependencies: boolean;
  /** Orphaned nodes (no connections) */
  orphanedNodes: string[];
  /** Graph metrics */
  metrics: {
    totalNodes: number;
    totalEdges: number;
    averageDegree?: number;
  };
}

/**
 * Extracts conversation context by topic.
 *
 * @param conversation - Conversation to extract from
 * @param topic - Topic to extract
 * @returns Extracted context
 *
 * @example
 * ```typescript
 * const context = extractByTopic(conversation, 'menu');
 * console.log(`Found ${context.messages.length} messages about menu`);
 * ```
 *
 * @version 0.5.0
 * @since 0.5.0
 */
export function extractByTopic(conversation: Conversation, topic: string): Context {
  const lowerTopic = topic.toLowerCase();

  // Filter messages containing topic
  const messages = conversation.messages.filter(m =>
    m.content.toLowerCase().includes(lowerTopic)
  );

  // Filter files related to topic
  const files = conversation.files.filter(f =>
    f.toLowerCase().includes(lowerTopic) ||
    messages.some(m => m.content.includes(f))
  );

  // Calculate completeness score
  const completeness = calculateCompleteness(messages, files);

  return {
    messages,
    files,
    extractedAt: new Date().toISOString(),
    topic,
    completeness
  };
}

/**
 * Extracts conversation context by file.
 *
 * @param conversation - Conversation to extract from
 * @param fileName - File name or pattern
 * @returns Extracted context
 *
 * @example
 * ```typescript
 * const context = extractByFile(conversation, 'Menu.tsx');
 * console.log(`File mentioned in ${context.messages.length} messages`);
 * ```
 *
 * @version 0.5.0
 * @since 0.5.0
 */
export function extractByFile(conversation: Conversation, fileName: string): Context {
  // Find all files matching the name (partial match supported)
  const matchingFiles = conversation.files.filter(f =>
    f.includes(fileName) || fileName.includes(f)
  );

  if (matchingFiles.length === 0) {
    return {
      messages: [],
      files: [],
      extractedAt: new Date().toISOString(),
      targetFile: fileName,
      completeness: 0,
      dependencies: []
    };
  }

  // Find messages mentioning the file
  const messages = conversation.messages.filter(m =>
    matchingFiles.some(f => m.content.includes(f) || m.content.includes(fileName))
  );

  // Find related files (tests, dependencies)
  const relatedFiles = findRelatedFiles(fileName, conversation.files);

  const allFiles = [...new Set([...matchingFiles, ...relatedFiles])];
  const completeness = calculateCompleteness(messages, allFiles);

  return {
    messages,
    files: allFiles,
    extractedAt: new Date().toISOString(),
    targetFile: fileName,
    completeness,
    dependencies: relatedFiles
  };
}

/**
 * Extracts conversation context by time range.
 *
 * @param conversation - Conversation to extract from
 * @param startTime - Start timestamp (ISO 8601)
 * @param endTime - End timestamp (ISO 8601)
 * @returns Extracted context
 *
 * @example
 * ```typescript
 * const context = extractByTimeRange(
 *   conversation,
 *   '2025-10-17T00:00:00Z',
 *   '2025-10-17T01:00:00Z'
 * );
 * ```
 *
 * @version 0.5.0
 * @since 0.5.0
 */
export function extractByTimeRange(
  conversation: Conversation,
  startTime: string,
  endTime: string
): Context {
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();

  // Validate time range
  if (start > end) {
    return {
      messages: [],
      files: [],
      extractedAt: new Date().toISOString(),
      startTime,
      endTime,
      duration: 0,
      completeness: 0
    };
  }

  // Filter messages within time range
  const messages = conversation.messages.filter(m => {
    const msgTime = new Date(m.timestamp).getTime();
    return msgTime >= start && msgTime <= end;
  });

  // Extract files mentioned in time range
  const files: string[] = [];
  for (const message of messages) {
    for (const file of conversation.files) {
      if (message.content.includes(file) && !files.includes(file)) {
        files.push(file);
      }
    }
  }

  const duration = end - start;
  const completeness = calculateCompleteness(messages, files);

  return {
    messages,
    files,
    extractedAt: new Date().toISOString(),
    startTime,
    endTime,
    duration,
    completeness
  };
}

/**
 * Builds dependency graph from conversation.
 *
 * @param conversation - Conversation to analyze
 * @returns Dependency graph
 *
 * @example
 * ```typescript
 * const graph = buildDependencyGraph(conversation);
 * console.log(`Graph has ${graph.nodes.length} nodes and ${graph.edges.length} edges`);
 * ```
 *
 * @version 0.5.0
 * @since 0.5.0
 */
export function buildDependencyGraph(conversation: Conversation): DependencyGraph {
  if (conversation.files.length === 0) {
    return {
      nodes: [],
      edges: [],
      hasCircularDependencies: false,
      orphanedNodes: [],
      metrics: {
        totalNodes: 0,
        totalEdges: 0
      }
    };
  }

  // Create nodes for each file
  const nodes: DependencyNode[] = conversation.files.map(file => ({
    id: file,
    type: detectNodeType(file),
    label: file
  }));

  // Create edges based on relationships
  const edges: DependencyEdge[] = [];

  for (const file of conversation.files) {
    // Test files have edges to source files
    if (file.includes('test') || file.includes('spec')) {
      const sourceFile = findSourceFileForTest(file, conversation.files);
      if (sourceFile) {
        edges.push({
          from: file,
          to: sourceFile,
          type: 'tests'
        });
      }
    }

    // Find imports in messages
    for (const message of conversation.messages) {
      if (message.content.includes(file) && message.content.includes('import')) {
        // Look for other files mentioned in same message
        for (const otherFile of conversation.files) {
          if (otherFile !== file && message.content.includes(otherFile)) {
            edges.push({
              from: file,
              to: otherFile,
              type: 'imports'
            });
          }
        }
      }
    }
  }

  // Detect circular dependencies
  const hasCircularDependencies = detectCircularDependencies(edges);

  // Find orphaned nodes
  const orphanedNodes = nodes
    .filter(node => !edges.some(e => e.from === node.id || e.to === node.id))
    .map(node => node.id);

  // Calculate metrics
  const metrics = {
    totalNodes: nodes.length,
    totalEdges: edges.length,
    averageDegree: nodes.length > 0 ? (edges.length * 2) / nodes.length : 0
  };

  return {
    nodes,
    edges,
    hasCircularDependencies,
    orphanedNodes,
    metrics
  };
}

/**
 * Calculates context completeness score.
 *
 * @param messages - Extracted messages
 * @param files - Extracted files
 * @returns Completeness score (0-100)
 *
 * @internal
 * @version 0.5.0
 * @since 0.5.0
 */
function calculateCompleteness(messages: Message[], files: string[]): number {
  let score = 0;

  // Messages contribute up to 50 points
  score += Math.min(messages.length * 10, 50);

  // Files contribute up to 30 points
  score += Math.min(files.length * 5, 30);

  // Test files add 20 points
  const hasTests = files.some(f => f.includes('test') || f.includes('spec'));
  if (hasTests) {
score += 20;
}

  return Math.min(score, 100);
}

/**
 * Finds files related to target file.
 *
 * @param fileName - Target file name
 * @param allFiles - All available files
 * @returns Related files
 *
 * @internal
 * @version 0.5.0
 * @since 0.5.0
 */
function findRelatedFiles(fileName: string, allFiles: string[]): string[] {
  const related: string[] = [];

  // Find test files
  const baseName = fileName.replace(/\.(ts|tsx|js|jsx)$/, '');
  for (const file of allFiles) {
    if (
      file !== fileName &&
      (file.includes(baseName) ||
        (file.includes('test') && file.includes(fileName.split('/').pop() ?? '')))
    ) {
      related.push(file);
    }
  }

  return related;
}

/**
 * Detects node type from file name.
 *
 * @param fileName - File name
 * @returns Node type
 *
 * @internal
 * @version 0.5.0
 * @since 0.5.0
 */
function detectNodeType(fileName: string): NodeType {
  if (fileName.includes('test') || fileName.includes('spec')) {
    return 'test';
  } else if (fileName.endsWith('.json') || fileName.endsWith('.yml') || fileName.endsWith('.yaml')) {
    return 'config';
  } else if (fileName.endsWith('.md') || fileName.includes('doc')) {
    return 'documentation';
  } else {
    return 'source';
  }
}

/**
 * Finds source file for test file.
 *
 * @param testFile - Test file name
 * @param allFiles - All available files
 * @returns Source file name or null
 *
 * @internal
 * @version 0.5.0
 * @since 0.5.0
 */
function findSourceFileForTest(testFile: string, allFiles: string[]): string | null {
  // Remove test directory and test suffix
  const sourceFile = testFile
    .replace(/tests?\//, '')
    .replace(/\/__tests__\//, '/')
    .replace(/\.test\.(ts|tsx|js|jsx)$/, '.$1')
    .replace(/\.spec\.(ts|tsx|js|jsx)$/, '.$1');

  // Check if source file exists
  if (allFiles.includes(sourceFile)) {
    return sourceFile;
  }

  // Try finding by base name
  const baseName = testFile.split('/').pop()?.replace(/\.test\.(ts|tsx|js|jsx)$/, '');
  if (baseName) {
    for (const file of allFiles) {
      if (file.includes(baseName) && !file.includes('test') && !file.includes('spec')) {
        return file;
      }
    }
  }

  return null;
}

/**
 * Detects circular dependencies in edges.
 *
 * @param edges - Graph edges
 * @returns True if circular dependencies exist
 *
 * @internal
 * @version 0.5.0
 * @since 0.5.0
 */
function detectCircularDependencies(edges: DependencyEdge[]): boolean {
  // Build adjacency list
  const adj = new Map<string, string[]>();

  for (const edge of edges) {
    const neighbors = adj.get(edge.from);
    if (neighbors) {
      neighbors.push(edge.to);
    } else {
      adj.set(edge.from, [edge.to]);
    }
  }

  // DFS to detect cycles
  const visited = new Set<string>();
  const recStack = new Set<string>();

  function hasCycle(node: string): boolean {
    visited.add(node);
    recStack.add(node);

    const neighbors = adj.get(node) ?? [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (hasCycle(neighbor)) {
return true;
}
      } else if (recStack.has(neighbor)) {
        return true;
      }
    }

    recStack.delete(node);
    return false;
  }

  for (const node of adj.keys()) {
    if (!visited.has(node)) {
      if (hasCycle(node)) {
return true;
}
    }
  }

  return false;
}
