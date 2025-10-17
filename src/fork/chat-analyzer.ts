/**
 * Chat History Analyzer for CCEM Fork Discovery System.
 *
 * Analyzes conversation history to identify fork-worthy contexts, extract file references,
 * cluster messages by topic, and identify conversation phases.
 *
 * @module fork/chat-analyzer
 * @version 0.5.0
 * @since 0.5.0
 */

/**
 * Message role type.
 *
 * @typedef {'user' | 'assistant'} MessageRole
 * @version 0.5.0
 * @since 0.5.0
 */
export type MessageRole = 'user' | 'assistant';

/**
 * Conversation message interface.
 *
 * @interface Message
 * @version 0.5.0
 * @since 0.5.0
 */
export interface Message {
  /** Message role */
  role: MessageRole;
  /** Message content */
  content: string;
  /** Message timestamp */
  timestamp: string;
}

/**
 * Conversation interface.
 *
 * @interface Conversation
 * @version 0.5.0
 * @since 0.5.0
 */
export interface Conversation {
  /** Conversation messages */
  messages: Message[];
  /** Files created/modified in conversation */
  files: string[];
  /** Conversation start timestamp */
  timestamp: string;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Fork point type.
 *
 * @typedef {'conversation-based' | 'context-extraction' | 'training-data' | 'worktree-based'} ForkPointType
 * @version 0.5.0
 * @since 0.5.0
 */
export type ForkPointType = 'conversation-based' | 'context-extraction' | 'training-data' | 'worktree-based';

/**
 * Fork point interface.
 *
 * @interface ForkPoint
 * @version 0.5.0
 * @since 0.5.0
 */
export interface ForkPoint {
  /** Fork point type */
  type: ForkPointType;
  /** Context descriptions */
  context: string[];
  /** Related files */
  files: string[];
  /** Training data (if applicable) */
  trainingData?: Record<string, unknown>;
  /** Fork point score (0-100) */
  score?: number;
}

/**
 * Topic cluster interface.
 *
 * @interface TopicCluster
 * @version 0.5.0
 * @since 0.5.0
 */
export interface TopicCluster {
  /** Topic name/label */
  topic: string;
  /** Messages in cluster */
  messages: Message[];
  /** Related files */
  relatedFiles?: string[];
}

/**
 * Conversation phase type.
 *
 * @typedef {'planning' | 'research' | 'implementation' | 'testing' | 'deployment' | 'refactoring'} PhaseType
 * @version 0.5.0
 * @since 0.5.0
 */
export type PhaseType = 'planning' | 'research' | 'implementation' | 'testing' | 'deployment' | 'refactoring';

/**
 * Conversation phase interface.
 *
 * @interface ConversationPhase
 * @version 0.5.0
 * @since 0.5.0
 */
export interface ConversationPhase {
  /** Phase type */
  phase: PhaseType;
  /** Phase start time */
  startTime: string;
  /** Phase end time */
  endTime?: string;
  /** Messages in phase */
  messages: Message[];
}

/**
 * Parsed conversation metadata.
 *
 * @interface ParsedConversation
 * @version 0.5.0
 * @since 0.5.0
 */
export interface ParsedConversation {
  /** Total message count */
  messageCount: number;
  /** Unique file references */
  fileReferences: string[];
  /** Conversation duration in milliseconds */
  duration?: number;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Parses conversation history and extracts metadata.
 *
 * @param conversation - Conversation to parse
 * @returns Parsed conversation metadata
 *
 * @example
 * ```typescript
 * const parsed = parseConversation(conversation);
 * console.log(`Messages: ${parsed.messageCount}`);
 * console.log(`Files: ${parsed.fileReferences.join(', ')}`);
 * ```
 *
 * @version 0.5.0
 * @since 0.5.0
 */
export function parseConversation(conversation: Conversation): ParsedConversation {
  const messageCount = conversation.messages.length;
  const fileReferences = [...new Set(conversation.files)]; // Deduplicate

  // Calculate duration if we have messages with timestamps
  let duration: number | undefined;
  if (conversation.messages.length >= 2) {
    const firstMsg = conversation.messages[0];
    const lastMsg = conversation.messages[conversation.messages.length - 1];
    if (firstMsg && lastMsg) {
      const start = new Date(firstMsg.timestamp).getTime();
      const end = new Date(lastMsg.timestamp).getTime();
      duration = end - start;
    }
  }

  const result: ParsedConversation = {
    messageCount,
    fileReferences
  };

  if (duration !== undefined) {
    result.duration = duration;
  }

  if (conversation.metadata !== undefined) {
    result.metadata = conversation.metadata;
  }

  return result;
}

/**
 * Identifies fork points in conversation.
 *
 * @param conversation - Conversation to analyze
 * @returns Array of fork points
 *
 * @example
 * ```typescript
 * const forkPoints = identifyForkPoints(conversation);
 * forkPoints.forEach(fp => {
 *   console.log(`Fork type: ${fp.type}, Score: ${fp.score}`);
 * });
 * ```
 *
 * @version 0.5.0
 * @since 0.5.0
 */
export function identifyForkPoints(conversation: Conversation): ForkPoint[] {
  const forkPoints: ForkPoint[] = [];

  // Check for training data fork point
  const hasTrainingDirective = conversation.messages.some(m =>
    m.content.includes('TRAINING:') || m.content.includes('TRAINING ')
  );

  if (hasTrainingDirective) {
    const trainingFiles = conversation.files.filter(f =>
      f.includes('training') || f.includes('schema') || f.includes('example')
    );

    forkPoints.push({
      type: 'training-data',
      context: ['Training data and schemas'],
      files: trainingFiles,
      trainingData: { detected: true },
      score: 85
    });
  }

  // Check for conversation-based fork point (substantial conversation with files)
  if (conversation.messages.length >= 3 && conversation.files.length >= 2) {
    const context = extractContextFromMessages(conversation.messages);

    forkPoints.push({
      type: 'conversation-based',
      context,
      files: conversation.files,
      score: calculateForkScore(conversation)
    });
  }

  // Check for context-extraction fork point (multiple topics)
  const clusters = clusterByTopic(conversation);
  if (clusters.length > 1) {
    forkPoints.push({
      type: 'context-extraction',
      context: clusters.map(c => c.topic),
      files: conversation.files,
      score: 70
    });
  }

  return forkPoints;
}

/**
 * Clusters messages by topic using keyword extraction.
 *
 * @param conversation - Conversation to cluster
 * @returns Array of topic clusters
 *
 * @example
 * ```typescript
 * const clusters = clusterByTopic(conversation);
 * clusters.forEach(cluster => {
 *   console.log(`Topic: ${cluster.topic}, Messages: ${cluster.messages.length}`);
 * });
 * ```
 *
 * @version 0.5.0
 * @since 0.5.0
 */
export function clusterByTopic(conversation: Conversation): TopicCluster[] {
  if (conversation.messages.length === 0) {
    return [];
  }

  const clusters: TopicCluster[] = [];
  const keywords = ['tui', 'menu', 'schema', 'validator', 'merge', 'test', 'config'];

  // Simple keyword-based clustering
  const clusterMap = new Map<string, Message[]>();

  for (const message of conversation.messages) {
    const content = message.content.toLowerCase();
    let assigned = false;

    for (const keyword of keywords) {
      if (content.includes(keyword)) {
        const existing = clusterMap.get(keyword);
        if (existing) {
          existing.push(message);
        } else {
          clusterMap.set(keyword, [message]);
        }
        assigned = true;
        break; // Assign to first matching keyword
      }
    }

    // If no keyword matches, create a general cluster
    if (!assigned) {
      const general = clusterMap.get('general');
      if (general) {
        general.push(message);
      } else {
        clusterMap.set('general', [message]);
      }
    }
  }

  // Convert map to clusters
  for (const [topic, messages] of clusterMap.entries()) {
    const relatedFiles = conversation.files.filter(f =>
      f.toLowerCase().includes(topic) || messages.some(m => m.content.includes(f))
    );

    clusters.push({
      topic: topic.charAt(0).toUpperCase() + topic.slice(1),
      messages,
      relatedFiles
    });
  }

  return clusters;
}

/**
 * Extracts file dependencies from conversation.
 *
 * @param conversation - Conversation to analyze
 * @returns Dependency map (file -> dependencies)
 *
 * @example
 * ```typescript
 * const deps = extractDependencies(conversation);
 * Object.entries(deps).forEach(([file, dependencies]) => {
 *   console.log(`${file} depends on: ${dependencies.join(', ')}`);
 * });
 * ```
 *
 * @version 0.5.0
 * @since 0.5.0
 */
export function extractDependencies(conversation: Conversation): Record<string, string[]> {
  const deps: Record<string, string[]> = {};

  // Initialize all files with empty dependencies
  for (const file of conversation.files) {
    deps[file] = [];
  }

  // Extract test file dependencies
  for (const file of conversation.files) {
    if (file.includes('test') || file.includes('spec')) {
      // Find corresponding source file
      const sourceFile = file.replace(/\.test\.(ts|tsx|js|jsx)$/, '.$1')
        .replace(/tests?\//, '')
        .replace(/\/__tests__\//, '/');

      if (conversation.files.includes(sourceFile)) {
        const sourceDeps = deps[sourceFile];
        if (sourceDeps && !sourceDeps.includes(file)) {
          sourceDeps.push(file);
        }
      }
    }
  }

  // Extract dependencies from import statements in messages
  for (const message of conversation.messages) {
    const importMatches = message.content.match(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/g);
    if (importMatches) {
      for (const match of importMatches) {
        const pathMatch = match.match(/from\s+['"]([^'"]+)['"]/);
        if (pathMatch && pathMatch[1]) {
          const importPath = pathMatch[1];
          // Try to find the importing file from context
          for (const file of conversation.files) {
            if (message.content.includes(file)) {
              const fileDeps = deps[file];
              if (fileDeps && !fileDeps.includes(importPath)) {
                fileDeps.push(importPath);
              }
            }
          }
        }
      }
    }
  }

  return deps;
}

/**
 * Identifies conversation phases (planning, implementation, testing, etc.).
 *
 * @param conversation - Conversation to analyze
 * @returns Array of conversation phases
 *
 * @example
 * ```typescript
 * const phases = identifyConversationPhases(conversation);
 * phases.forEach(phase => {
 *   console.log(`Phase: ${phase.phase}, Messages: ${phase.messages.length}`);
 * });
 * ```
 *
 * @version 0.5.0
 * @since 0.5.0
 */
export function identifyConversationPhases(conversation: Conversation): ConversationPhase[] {
  const phases: ConversationPhase[] = [];

  // Keywords for each phase
  const phaseKeywords: Record<PhaseType, string[]> = {
    planning: ['plan', 'design', 'outline', 'approach', 'strategy', 'need to'],
    research: ['research', 'investigate', 'explore', 'analyze', 'review'],
    implementation: ['create', 'implement', 'build', 'creating', 'implementing', 'building'],
    testing: ['test', 'testing', 'run test', 'npm test', 'jest', 'coverage'],
    deployment: ['deploy', 'deployment', 'release', 'publish'],
    refactoring: ['refactor', 'optimize', 'improve', 'cleanup', 'reorganize']
  };

  let currentPhase: PhaseType | null = null;
  let phaseMessages: Message[] = [];
  let phaseStartTime: string | null = null;

  for (const message of conversation.messages) {
    const content = message.content.toLowerCase();
    let detectedPhase: PhaseType | null = null;

    // Detect phase based on keywords
    for (const [phase, keywords] of Object.entries(phaseKeywords)) {
      if (keywords.some(kw => content.includes(kw))) {
        detectedPhase = phase as PhaseType;
        break;
      }
    }

    if (detectedPhase && detectedPhase !== currentPhase) {
      // Save previous phase if exists
      if (currentPhase && phaseStartTime) {
        phases.push({
          phase: currentPhase,
          startTime: phaseStartTime,
          endTime: message.timestamp,
          messages: [...phaseMessages]
        });
      }

      // Start new phase
      currentPhase = detectedPhase;
      phaseStartTime = message.timestamp;
      phaseMessages = [message];
    } else if (currentPhase) {
      // Continue current phase
      phaseMessages.push(message);
    } else {
      // No phase detected yet, start with implementation as default
      currentPhase = 'implementation';
      phaseStartTime = message.timestamp;
      phaseMessages = [message];
    }
  }

  // Add final phase
  if (currentPhase && phaseStartTime) {
    phases.push({
      phase: currentPhase,
      startTime: phaseStartTime,
      messages: [...phaseMessages]
    });
  }

  return phases;
}

/**
 * Extracts file references from message content.
 *
 * @param messages - Messages to extract from
 * @returns Array of unique file references
 *
 * @example
 * ```typescript
 * const files = extractFileReferences(messages);
 * console.log(`Found files: ${files.join(', ')}`);
 * ```
 *
 * @version 0.5.0
 * @since 0.5.0
 */
export function extractFileReferences(messages: Message[]): string[] {
  const fileRefs = new Set<string>();

  // File extension patterns (supports paths with directories)
  const filePattern = /\b[\w/.-]+\/[\w/.-]+\.(?:ts|tsx|js|jsx|json|md|css|scss|html|yml|yaml|sh|py)\b|\b[\w-]+\.(?:ts|tsx|js|jsx|json|md|css|scss|html|yml|yaml|sh|py)\b/g;

  // Code block comment patterns (e.g., // src/validator.ts)
  const codeBlockPattern = /\/\/\s+([\w/-]+\.(?:ts|tsx|js|jsx|json|md))/g;

  for (const message of messages) {
    // Extract from regular content
    const matches = message.content.match(filePattern);
    if (matches) {
      for (const match of matches) {
        fileRefs.add(match);
      }
    }

    // Extract from code block comments
    const codeBlockMatches = message.content.match(codeBlockPattern);
    if (codeBlockMatches) {
      for (const match of codeBlockMatches) {
        const pathMatch = match.match(/\/\/\s+([\w/-]+\.(?:ts|tsx|js|jsx|json|md))/);
        if (pathMatch && pathMatch[1]) {
          fileRefs.add(pathMatch[1]);
        }
      }
    }
  }

  return Array.from(fileRefs);
}

/**
 * Extracts context descriptions from messages.
 *
 * @param messages - Messages to extract from
 * @returns Array of context descriptions
 *
 * @internal
 * @version 0.5.0
 * @since 0.5.0
 */
function extractContextFromMessages(messages: Message[]): string[] {
  const contexts: string[] = [];

  // Extract first user message as primary context
  const firstUserMsg = messages.find(m => m.role === 'user');
  if (firstUserMsg) {
    // Extract first sentence or up to 100 chars
    const content = firstUserMsg.content.split('.')[0] ?? firstUserMsg.content.substring(0, 100);
    contexts.push(content);
  }

  return contexts.length > 0 ? contexts : ['Conversation context'];
}

/**
 * Calculates fork point score based on conversation completeness.
 *
 * @param conversation - Conversation to score
 * @returns Score from 0-100
 *
 * @internal
 * @version 0.5.0
 * @since 0.5.0
 */
function calculateForkScore(conversation: Conversation): number {
  let score = 50; // Base score

  // Add points for messages
  score += Math.min(conversation.messages.length * 2, 20);

  // Add points for files
  score += Math.min(conversation.files.length * 5, 20);

  // Add points for test files
  const hasTests = conversation.files.some(f => f.includes('test') || f.includes('spec'));
  if (hasTests) score += 10;

  return Math.min(score, 100);
}
