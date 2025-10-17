import { z } from 'zod';

/**
 * UUID schema validator.
 *
 * @version 0.2.0
 * @since 0.2.0
 */
const uuidSchema = z.string().uuid('Invalid UUID format');

/**
 * Menu type enumeration.
 *
 * @version 0.2.0
 * @since 0.2.0
 */
export const menuTypeSchema = z.enum(['root', 'submenu', 'action', 'view']);

/**
 * TUI structure schema for menu items.
 *
 * @version 0.2.0
 * @since 0.2.0
 */
export const tuiStructureSchema = z.object({
  id: uuidSchema,
  title: z.string().min(1, 'Title cannot be empty'),
  type: menuTypeSchema,
  parent_id: uuidSchema.nullable().optional(),
  icon: z.string().optional(),
  description: z.string().optional(),
  shortcut: z.string().optional(),
  order: z.number().int().min(0).optional()
});

/**
 * Inferred TypeScript type from TUI structure schema.
 *
 * @version 0.2.0
 * @since 0.2.0
 */
export type TUIStructure = z.infer<typeof tuiStructureSchema>;
