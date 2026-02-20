/**
 * Retry utility with exponential and linear backoff strategies
 */

/**
 * Execute a function with retry logic
 *
 * @param fn - Async function to execute
 * @param maxAttempts - Maximum number of retry attempts
 * @param backoffStrategy - Backoff strategy ('linear' or 'exponential')
 * @param initialDelayMs - Initial delay in milliseconds
 * @returns Result of the function
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  backoffStrategy: 'linear' | 'exponential' = 'exponential',
  initialDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry if this was the last attempt
      if (attempt === maxAttempts - 1) {
        break;
      }

      // Calculate delay
      const delay =
        backoffStrategy === 'exponential'
          ? initialDelayMs * Math.pow(2, attempt)
          : initialDelayMs * (attempt + 1);

      // Wait before retrying
      await sleep(delay);
    }
  }

  throw lastError || new Error('Retry failed without error');
}

/**
 * Sleep for specified milliseconds
 *
 * @param ms - Milliseconds to sleep
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry with jitter to prevent thundering herd
 *
 * @param fn - Async function to execute
 * @param maxAttempts - Maximum number of retry attempts
 * @param baseDelayMs - Base delay in milliseconds
 * @param maxDelayMs - Maximum delay in milliseconds
 * @returns Result of the function
 */
export async function retryWithJitter<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelayMs: number = 1000,
  maxDelayMs: number = 30000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxAttempts - 1) {
        break;
      }

      // Exponential backoff with jitter
      const exponentialDelay = Math.min(
        baseDelayMs * Math.pow(2, attempt),
        maxDelayMs
      );
      const jitter = Math.random() * exponentialDelay * 0.3; // 30% jitter
      const delay = exponentialDelay + jitter;

      await sleep(delay);
    }
  }

  throw lastError || new Error('Retry with jitter failed without error');
}
