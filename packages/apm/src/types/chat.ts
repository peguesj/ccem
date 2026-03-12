import { z } from 'zod';

/** A chat message in a scoped conversation */
export interface ChatMessage {
  /** Unique message identifier */
  id: string;
  /** Chat scope (e.g., agent ID, formation ID) */
  scope: string;
  /** Message sender */
  sender: string;
  /** Message content */
  content: string;
  /** ISO-8601 timestamp */
  timestamp: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/** Payload for sending a chat message */
export interface SendMessagePayload {
  /** Message content */
  content: string;
  /** Sender identifier */
  sender: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/** Zod schema for ChatMessage */
export const ChatMessageSchema = z.object({
  id: z.string(),
  scope: z.string(),
  sender: z.string(),
  content: z.string(),
  timestamp: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

/** Zod schema for SendMessagePayload */
export const SendMessagePayloadSchema = z.object({
  content: z.string(),
  sender: z.string(),
  metadata: z.record(z.unknown()).optional(),
});
