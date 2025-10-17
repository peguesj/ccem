/**
 * Conversation-to-Code Mapper for CCEM Fork Discovery System.
 *
 * Maps conversation messages to generated code artifacts, tracks implementation
 * of user requests, and identifies orphaned conversations.
 *
 * @module fork/conversation-mapper
 * @version 0.5.0
 * @since 0.5.0
 */

import { Conversation, Message } from './chat-analyzer';

/**
 * Implementation status type.
 *
 * @typedef {'implemented' | 'partial' | 'not-implemented'} ImplementationStatusType
 * @version 0.5.0
 * @since 0.5.0
 */
export type ImplementationStatusType = 'implemented' | 'partial' | 'not-implemented';

/**
 * File mapping interface.
 *
 * @interface FileMapping
 * @version 0.5.0
 * @since 0.5.0
 */
export interface FileMapping {
  /** File path */
  file: string;
  /** Related message indices */
  relatedMessages: number[];
  /** Implementation status */
  implementationStatus: ImplementationStatusType;
  /** Creation timestamp */
  createdAt: string;
}

/**
 * User request interface.
 *
 * @interface UserRequest
 * @version 0.5.0
 * @since 0.5.0
 */
export interface UserRequest {
  /** Request content */
  request: string;
  /** Message index */
  messageIndex: number;
  /** Request timestamp */
  timestamp: string;
}

/**
 * Conversation mapping interface.
 *
 * @interface ConversationMapping
 * @version 0.5.0
 * @since 0.5.0
 */
export interface ConversationMapping {
  /** All messages */
  messages: Message[];
  /** All files */
  files: string[];
  /** File mappings */
  mappings: FileMapping[];
  /** User requests */
  userRequests: UserRequest[];
}

/**
 * Implementation detail interface.
 *
 * @interface ImplementationDetail
 * @version 0.5.0
 * @since 0.5.0
 */
export interface ImplementationDetail {
  /** Request content */
  request: string;
  /** Implementation status */
  status: ImplementationStatusType;
  /** Related files */
  files: string[];
}

/**
 * Implementation status interface.
 *
 * @interface ImplementationStatus
 * @version 0.5.0
 * @since 0.5.0
 */
export interface ImplementationStatus {
  /** Total requests */
  totalRequests: number;
  /** Implemented count */
  implemented: number;
  /** Partial implementation count */
  partial: number;
  /** Not implemented count */
  notImplemented: number;
  /** Implementation rate percentage */
  implementationRate: number;
  /** Pending requests */
  pendingRequests: string[];
  /** Implementation details */
  details: ImplementationDetail[];
}

/**
 * Orphan type.
 *
 * @typedef {'unimplemented' | 'partial' | 'discussed'} OrphanType
 * @version 0.5.0
 * @since 0.5.0
 */
export type OrphanType = 'unimplemented' | 'partial' | 'discussed';

/**
 * Orphaned conversation interface.
 *
 * @interface OrphanedConversation
 * @version 0.5.0
 * @since 0.5.0
 */
export interface OrphanedConversation {
  /** Orphan type */
  type: OrphanType;
  /** Description */
  description: string;
  /** Message index */
  messageIndex: number;
  /** Suggested action */
  suggestedAction: string;
}

/**
 * Traceability report interface.
 *
 * @interface TraceabilityReport
 * @version 0.5.0
 * @since 0.5.0
 */
export interface TraceabilityReport {
  /** Report summary */
  summary: {
    totalMessages: number;
    totalFiles: number;
    totalMappings: number;
  };
  /** Conversation mappings */
  mappings: FileMapping[];
  /** Implementation status */
  implementationStatus: ImplementationStatus;
  /** Orphaned conversations */
  orphans: OrphanedConversation[];
  /** Report generation timestamp */
  generatedAt: string;
  /** Coverage metrics */
  coverage: {
    messagesCovered: number;
    coveragePercentage: number;
  };
  /** High-value mappings */
  highValueMappings: FileMapping[];
  /** Recommendations */
  recommendations: string[];
  /** Export format */
  exportFormat: 'json' | 'markdown' | 'html';
}

/**
 * Maps conversation to code artifacts.
 *
 * @param conversation - Conversation to map
 * @returns Conversation mapping
 *
 * @example
 * ```typescript
 * const mapping = mapConversationToCode(conversation);
 * console.log(`Mapped ${mapping.mappings.length} files`);
 * ```
 *
 * @version 0.5.0
 * @since 0.5.0
 */
export function mapConversationToCode(conversation: Conversation): ConversationMapping {
  const mappings: FileMapping[] = [];
  const userRequests: UserRequest[] = [];

  // Extract user requests
  conversation.messages.forEach((message, index) => {
    if (message.role === 'user') {
      userRequests.push({
        request: message.content,
        messageIndex: index,
        timestamp: message.timestamp
      });
    }
  });

  // Create mappings for each file
  for (const file of conversation.files) {
    const relatedMessages: number[] = [];

    // Find messages mentioning this file
    conversation.messages.forEach((message, index) => {
      if (message.content.includes(file) || message.content.includes(file.split('/').pop() ?? '')) {
        relatedMessages.push(index);
      }
    });

    // Determine implementation status
    const hasTest = conversation.files.some(f =>
      f !== file && (f.includes('test') || f.includes('spec')) && f.includes(file.split('/').pop()?.replace(/\.(ts|tsx|js|jsx)$/, '') ?? '')
    );

    const implementationStatus: ImplementationStatusType =
      hasTest ? 'implemented' : relatedMessages.length > 0 ? 'partial' : 'not-implemented';

    // Find creation timestamp
    const creationMessage = conversation.messages.find(m =>
      m.role === 'assistant' && m.content.includes(file)
    );

    mappings.push({
      file,
      relatedMessages,
      implementationStatus,
      createdAt: creationMessage?.timestamp ?? conversation.timestamp
    });
  }

  return {
    messages: conversation.messages,
    files: conversation.files,
    mappings,
    userRequests
  };
}

/**
 * Tracks implementation of user requests.
 *
 * @param conversation - Conversation to track
 * @returns Implementation status
 *
 * @example
 * ```typescript
 * const status = trackImplementation(conversation);
 * console.log(`Implementation rate: ${status.implementationRate}%`);
 * ```
 *
 * @version 0.5.0
 * @since 0.5.0
 */
export function trackImplementation(conversation: Conversation): ImplementationStatus {
  const mapping = mapConversationToCode(conversation);
  const details: ImplementationDetail[] = [];

  let implemented = 0;
  let partial = 0;
  let notImplemented = 0;

  // Analyze each user request
  for (const request of mapping.userRequests) {
    const relatedFiles: string[] = [];
    let status: ImplementationStatusType = 'not-implemented';

    // Find files related to this request
    for (const fileMapping of mapping.mappings) {
      if (fileMapping.relatedMessages.includes(request.messageIndex) ||
          fileMapping.relatedMessages.includes(request.messageIndex + 1)) {
        relatedFiles.push(fileMapping.file);
        if (fileMapping.implementationStatus === 'implemented') {
          status = 'implemented';
        } else if (status !== 'implemented' && fileMapping.implementationStatus === 'partial') {
          status = 'partial';
        }
      }
    }

    // If no direct file association, check if files were created around request time
    if (relatedFiles.length === 0) {
      for (const fileMapping of mapping.mappings) {
        const creationIdx = conversation.messages.findIndex(m =>
          m.timestamp === fileMapping.createdAt
        );
        if (creationIdx > request.messageIndex && creationIdx <= request.messageIndex + 3) {
          relatedFiles.push(fileMapping.file);
          if (fileMapping.implementationStatus === 'implemented') {
            status = 'implemented';
          } else if (status !== 'implemented') {
            status = 'partial';
          }
        }
      }
    }

    if (relatedFiles.length === 0) {
      // Check if request was acknowledged in conversation
      const wasAcknowledged = conversation.messages.some(
        (m, idx) => idx > request.messageIndex && m.role === 'assistant' && idx <= request.messageIndex + 2
      );
      status = wasAcknowledged ? 'partial' : 'not-implemented';
    }

    details.push({
      request: request.request,
      status,
      files: relatedFiles
    });

    if (status === 'implemented') implemented++;
    else if (status === 'partial') partial++;
    else notImplemented++;
  }

  const totalRequests = mapping.userRequests.length;
  const implementationRate = totalRequests > 0 ? (implemented / totalRequests) * 100 : 0;

  const pendingRequests = details
    .filter(d => d.status === 'not-implemented')
    .map(d => d.request);

  return {
    totalRequests,
    implemented,
    partial,
    notImplemented,
    implementationRate,
    pendingRequests,
    details
  };
}

/**
 * Identifies orphaned conversations (discussed but not implemented).
 *
 * @param conversation - Conversation to analyze
 * @returns Array of orphaned conversations
 *
 * @example
 * ```typescript
 * const orphans = identifyOrphans(conversation);
 * console.log(`Found ${orphans.length} orphaned conversations`);
 * ```
 *
 * @version 0.5.0
 * @since 0.5.0
 */
export function identifyOrphans(conversation: Conversation): OrphanedConversation[] {
  const orphans: OrphanedConversation[] = [];
  const implementedFiles = new Set(conversation.files);

  // Look for files mentioned but not created
  conversation.messages.forEach((message, index) => {
    if (message.role === 'assistant') {
      // Extract file mentions from message
      const filePattern = /\b[\w/.-]+\.(?:ts|tsx|js|jsx|json|md)\b/g;
      const matches = message.content.match(filePattern);

      if (matches) {
        for (const match of matches) {
          if (!implementedFiles.has(match)) {
            orphans.push({
              type: 'unimplemented',
              description: `File "${match}" was mentioned but not created`,
              messageIndex: index,
              suggestedAction: `Create ${match} as discussed`
            });
          }
        }
      }
    }
  });

  // Look for user requests without implementation
  const status = trackImplementation(conversation);
  for (const detail of status.details) {
    if (detail.status === 'not-implemented' && detail.files.length === 0) {
      const requestMsg = conversation.messages.find(m =>
        m.role === 'user' && m.content === detail.request
      );
      const msgIndex = requestMsg ? conversation.messages.indexOf(requestMsg) : -1;

      orphans.push({
        type: 'discussed',
        description: `Request "${detail.request.substring(0, 50)}..." was discussed but not implemented`,
        messageIndex: msgIndex,
        suggestedAction: 'Implement this feature or clarify requirements'
      });
    }
  }

  return orphans;
}

/**
 * Generates comprehensive traceability report.
 *
 * @param conversation - Conversation to analyze
 * @returns Traceability report
 *
 * @example
 * ```typescript
 * const report = generateTraceabilityReport(conversation);
 * console.log(JSON.stringify(report, null, 2));
 * ```
 *
 * @version 0.5.0
 * @since 0.5.0
 */
export function generateTraceabilityReport(conversation: Conversation): TraceabilityReport {
  const mapping = mapConversationToCode(conversation);
  const implementationStatus = trackImplementation(conversation);
  const orphans = identifyOrphans(conversation);

  // Calculate coverage
  const messagesCovered = new Set<number>();
  for (const fileMapping of mapping.mappings) {
    fileMapping.relatedMessages.forEach(idx => messagesCovered.add(idx));
  }

  const coveragePercentage =
    conversation.messages.length > 0
      ? (messagesCovered.size / conversation.messages.length) * 100
      : 0;

  // Identify high-value mappings (with most messages and implemented)
  const highValueMappings = mapping.mappings
    .filter(m => m.implementationStatus === 'implemented' && m.relatedMessages.length >= 2)
    .sort((a, b) => b.relatedMessages.length - a.relatedMessages.length)
    .slice(0, 5);

  // Generate recommendations
  const recommendations: string[] = [];
  if (implementationStatus.implementationRate < 50) {
    recommendations.push('Implementation rate is below 50%. Consider completing pending requests.');
  }
  if (orphans.length > 0) {
    recommendations.push(`${orphans.length} orphaned conversation(s) detected. Review and implement or remove.`);
  }
  if (coveragePercentage < 60) {
    recommendations.push('Message coverage is low. Ensure all discussions are reflected in code.');
  }
  if (highValueMappings.length === 0) {
    recommendations.push('No high-value mappings found. Consider adding tests to implementations.');
  }

  return {
    summary: {
      totalMessages: conversation.messages.length,
      totalFiles: conversation.files.length,
      totalMappings: mapping.mappings.length
    },
    mappings: mapping.mappings,
    implementationStatus,
    orphans,
    generatedAt: new Date().toISOString(),
    coverage: {
      messagesCovered: messagesCovered.size,
      coveragePercentage
    },
    highValueMappings,
    recommendations,
    exportFormat: 'json'
  };
}
