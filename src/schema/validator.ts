import { z } from 'zod';

/**
 * Validates data against a Zod schema with enhanced error reporting.
 *
 * @param data - The data to validate
 * @param schema - The Zod schema to validate against
 * @returns The validated and typed data
 * @throws {ValidationError} If validation fails with detailed error information
 *
 * @example
 * ```typescript
 * const result = validateSchema(data, mySchema);
 * ```
 *
 * @version 0.2.0
 * @since 0.2.0
 */
export function validateSchema<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Build detailed error message from all issues
      const messages = error.errors.map(err => err.message).join('; ');
      throw new ValidationError(
        `Schema validation failed: ${messages}`,
        error.errors
      );
    }
    throw error;
  }
}

/**
 * Custom validation error with detailed error information.
 *
 * @version 0.2.0
 * @since 0.2.0
 */
export class ValidationError extends Error {
  /**
   * Creates a new ValidationError.
   *
   * @param message - Error message
   * @param errors - Array of Zod validation errors
   */
  constructor(
    message: string,
    public errors: z.ZodIssue[]
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}
