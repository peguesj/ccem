/**
 * Fork Discovery System barrel export.
 *
 * Exports all fork discovery components for easy importing.
 *
 * @module fork
 * @version 0.5.0
 * @since 0.5.0
 */

// Chat History Analyzer
export {
  parseConversation,
  identifyForkPoints,
  clusterByTopic,
  extractDependencies,
  identifyConversationPhases,
  extractFileReferences
} from './chat-analyzer.js';

export type {
  MessageRole,
  Message,
  Conversation,
  ForkPointType,
  ForkPoint,
  TopicCluster,
  PhaseType,
  ConversationPhase,
  ParsedConversation
} from './chat-analyzer.js';

// Git Worktree Detector
export {
  detectWorktrees,
  analyzeWorktreeStructure,
  identifyParallelDevelopment,
  mapBranchesToPhases
} from './worktree-detector.js';

export type {
  Worktree,
  WorktreeAnalysis,
  DevelopmentPatternType,
  DevelopmentPattern,
  BranchMapping
} from './worktree-detector.js';

// Context Extraction Engine
export {
  extractByTopic,
  extractByFile,
  extractByTimeRange,
  buildDependencyGraph
} from './context-extractor.js';

export type {
  Context,
  NodeType,
  DependencyNode,
  DependencyEdge,
  DependencyGraph
} from './context-extractor.js';

// Conversation-to-Code Mapper
export {
  mapConversationToCode,
  trackImplementation,
  identifyOrphans,
  generateTraceabilityReport
} from './conversation-mapper.js';

export type {
  ImplementationStatusType,
  FileMapping,
  UserRequest,
  ConversationMapping,
  ImplementationDetail,
  ImplementationStatus,
  OrphanType,
  OrphanedConversation,
  TraceabilityReport
} from './conversation-mapper.js';
