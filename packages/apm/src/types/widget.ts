import { z } from 'zod';

// --- Widget ---

/** Zod schema for Widget */
export const WidgetSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string().optional(),
  category: z.string().optional(),
  editable: z.boolean().optional(),
  pinnable: z.boolean().optional(),
  supported_scopes: z.array(z.string()).optional(),
  default_config: z.record(z.unknown()).optional(),
  config_schema: z.record(z.unknown()).optional(),
  display_order: z.number().optional(),
  col_span: z.number().optional(),
  min_width: z.number().optional(),
  min_height: z.number().optional(),
});

/** A dashboard widget definition */
export type Widget = z.infer<typeof WidgetSchema>;

// --- Widget Config ---

/** Zod schema for WidgetConfig */
export const WidgetConfigSchema = z.object({
  widget_id: z.string(),
  config: z.record(z.unknown()),
  pinned: z.boolean().optional(),
});

/** Per-session widget configuration override */
export type WidgetConfig = z.infer<typeof WidgetConfigSchema>;

// --- Layout Preset ---

/** Zod schema for WidgetPlacement */
export const WidgetPlacementSchema = z.object({
  widget_id: z.string(),
  col: z.number().optional(),
  row: z.number().optional(),
  col_span: z.number().optional(),
  row_span: z.number().optional(),
});

/** A widget placement in the layout grid */
export type WidgetPlacement = z.infer<typeof WidgetPlacementSchema>;

/** Zod schema for LayoutPreset */
export const LayoutPresetSchema = z.object({
  id: z.string(),
  name: z.string(),
  placements: z.array(WidgetPlacementSchema),
});

/** A named layout preset with widget placements */
export type LayoutPreset = z.infer<typeof LayoutPresetSchema>;

// --- Payloads ---

/** Payload for PATCH /api/v2/widgets/:id/config */
export interface UpdateWidgetConfigPayload {
  session_id: string;
  config: Record<string, unknown>;
}

/** Payload for POST /api/v2/dashboard/layout */
export interface SaveLayoutPayload {
  session_id: string;
  placements: WidgetPlacement[];
}

/** Payload for POST /api/v2/dashboard/pin */
export interface PinWidgetPayload {
  session_id: string;
  widget_id: string;
}
