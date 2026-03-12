import { z } from 'zod';

/** A generative UI component */
export interface GenerativeUIComponent {
  /** Unique component identifier */
  id: string;
  /** Component type (e.g., card, chart, form) */
  type: string;
  /** Component properties */
  props: Record<string, unknown>;
  /** Child components */
  children?: GenerativeUIComponent[];
  /** ISO-8601 creation timestamp */
  created_at: string;
  /** ISO-8601 last update timestamp */
  updated_at: string;
}

/** Payload for creating a generative UI component */
export interface CreateGenerativeUIPayload {
  /** Component type */
  type: string;
  /** Component properties */
  props: Record<string, unknown>;
  /** Child components */
  children?: CreateGenerativeUIPayload[];
}

/** Payload for updating a generative UI component */
export interface UpdateGenerativeUIPayload {
  /** Updated type */
  type?: string;
  /** Updated properties */
  props?: Record<string, unknown>;
  /** Updated children */
  children?: GenerativeUIComponent[];
}

/** Zod schema for GenerativeUIComponent */
export const GenerativeUIComponentSchema: z.ZodType<GenerativeUIComponent> = z.lazy(() =>
  z.object({
    id: z.string(),
    type: z.string(),
    props: z.record(z.unknown()),
    children: z.array(GenerativeUIComponentSchema).optional(),
    created_at: z.string(),
    updated_at: z.string(),
  })
);
