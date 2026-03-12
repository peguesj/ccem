import { z } from 'zod';

/** A registered slash command */
export interface SlashCommand {
  /** Command name (e.g., /fix, /deploy) */
  name: string;
  /** Command description */
  description: string;
  /** Command category for grouping */
  category?: string;
  /** Nested subcommands */
  subcommands?: SlashCommand[];
}

/** Payload for registering a new slash command */
export interface RegisterCommandPayload {
  /** Command name */
  name: string;
  /** Command description */
  description: string;
  /** Command category */
  category?: string;
  /** Nested subcommands */
  subcommands?: RegisterCommandPayload[];
}

/** Zod schema for SlashCommand */
export const SlashCommandSchema: z.ZodType<SlashCommand> = z.lazy(() =>
  z.object({
    name: z.string(),
    description: z.string(),
    category: z.string().optional(),
    subcommands: z.array(SlashCommandSchema).optional(),
  })
);

/** Zod schema for RegisterCommandPayload */
export const RegisterCommandPayloadSchema: z.ZodType<RegisterCommandPayload> = z.lazy(() =>
  z.object({
    name: z.string(),
    description: z.string(),
    category: z.string().optional(),
    subcommands: z.array(RegisterCommandPayloadSchema).optional(),
  })
);
