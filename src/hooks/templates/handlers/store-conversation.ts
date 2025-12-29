/**
 * VIKI Conversation Storage Hook
 * Stores complete conversations to VIKI for analytics and retrieval
 */

import { HookContext } from '../../../types.js';
import { submitToServers } from '../../../utils/submit.js';

interface ConversationSubmission {
  conversation_id: string;
  project: string;
  user_message: string;
  assistant_response: string;
  tools_used: string[];
  timestamp: string;
}

/**
 * Post-execution hook handler
 * Stores conversation after Claude Code completes execution
 */
export default async function handler(context: HookContext) {
  if (!context.assistantResponse) {
    // No response yet, skip storage
    return { stored: false, reason: 'no_response' };
  }

  const conversation: ConversationSubmission = {
    conversation_id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    project: context.project,
    user_message: context.userMessage,
    assistant_response: context.assistantResponse,
    tools_used: context.toolsUsed || [],
    timestamp: new Date().toISOString(),
  };

  // Submit to VIKI
  const servers = [
    {
      name: 'viki',
      url: process.env.VIKI_URL || 'https://viki.yjos.lgtm.build',
      auth: {
        type: 'bearer' as const,
        tokenEnv: 'VIKI_API_TOKEN',
      },
      retry: {
        maxAttempts: 3,
        backoff: 'exponential' as const,
        initialDelayMs: 1000,
      },
      timeoutMs: 5000,
      enabled: true,
    },
  ];

  const results = await submitToServers(
    servers,
    '/api/v1/hooks/conversations',
    conversation
  );

  const success = results.every((r) => r.success);

  return {
    stored: success,
    conversation_id: conversation.conversation_id,
    results,
  };
}
