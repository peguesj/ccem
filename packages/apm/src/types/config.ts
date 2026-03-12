import { z } from 'zod';

/** Export format values */
export type ExportFormat = 'json' | 'csv';

/** Server configuration */
export interface ServerConfig {
  /** Server version */
  version: string;
  /** Server port */
  port: number;
  /** Environment (dev, prod) */
  environment: string;
  /** Additional configuration */
  [key: string]: unknown;
}

/** Result of a config reload operation */
export interface ReloadResult {
  /** Whether the reload was successful */
  success: boolean;
  /** Reload message */
  message: string;
}

/** Parameters for data export */
export interface ExportParams {
  /** Export format */
  format: ExportFormat;
  /** Optional date range start */
  from?: string;
  /** Optional date range end */
  to?: string;
}

/** Result of a data import operation */
export interface ImportResult {
  /** Whether the import was successful */
  success: boolean;
  /** Number of items imported */
  imported: number;
  /** Import message */
  message: string;
}

/** Zod schema for ExportFormat */
export const ExportFormatSchema = z.enum(['json', 'csv']);

/** Zod schema for ReloadResult */
export const ReloadResultSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

/** Zod schema for ImportResult */
export const ImportResultSchema = z.object({
  success: z.boolean(),
  imported: z.number(),
  message: z.string(),
});
