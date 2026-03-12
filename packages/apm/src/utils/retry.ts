/** Options for the retry utility */
export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial delay in milliseconds between retries (default: 1000) */
  delay?: number;
  /** Backoff multiplier applied to delay after each retry (default: 2) */
  backoff?: number;
}

/**
 * Retry a function with exponential backoff.
 *
 * @param fn - The async function to retry
 * @param options - Retry configuration options
 * @returns The result of the function if it succeeds
 * @throws The last error if all retries are exhausted
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const { maxRetries = 3, delay = 1000, backoff = 2 } = options;
  let lastError: unknown;
  let currentDelay = delay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, currentDelay));
        currentDelay *= backoff;
      }
    }
  }

  throw lastError;
}
