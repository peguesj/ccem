import { z } from 'zod';

/** Pagination parameters for cursor-based pagination */
export interface PaginationParams {
  /** Cursor for the next page */
  cursor?: string;
  /** Maximum number of items per page */
  limit?: number;
}

/** Paginated response wrapper */
export interface PaginatedResponse<T> {
  /** Array of result items */
  data: T[];
  /** Cursor for the next page, null if no more pages */
  next_cursor: string | null;
  /** Total count of items (if available) */
  total?: number;
}

/** Standard error response from the API */
export interface ErrorResponse {
  /** Error message */
  error: string;
  /** Optional error details */
  details?: unknown;
}

/** Zod schema for PaginationParams */
export const PaginationParamsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().positive().optional(),
});

/** Zod schema for ErrorResponse */
export const ErrorResponseSchema = z.object({
  error: z.string(),
  details: z.unknown().optional(),
});
