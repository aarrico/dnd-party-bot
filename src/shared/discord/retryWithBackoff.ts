/**
 * Retry configuration options
 */
export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial delay in milliseconds (default: 1000) */
  initialDelayMs?: number;
  /** Maximum delay in milliseconds (default: 10000) */
  maxDelayMs?: number;
  /** Multiplier for exponential backoff (default: 2) */
  backoffMultiplier?: number;
  /** Function to determine if an error should trigger a retry */
  shouldRetry?: (error: unknown) => boolean;
  /** Optional callback for logging retry attempts */
  onRetry?: (attempt: number, error: unknown, delayMs: number) => void;
}

/**
 * Default retry options
 */
import { createScopedLogger } from '#shared/logging/logger.js';

const logger = createScopedLogger('RetryWithBackoff');

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  shouldRetry: isRetryableError,
  onRetry: (attempt, error, delayMs) => {
    const err = error as { message?: string; code?: string };
    logger.warn('Retrying operation', {
      attempt,
      delayMs,
      error: err?.message || err?.code || 'Unknown error',
    });
  },
};

/**
 * Determines if an error is retryable (network/connection errors)
 */
export function isRetryableError(error: unknown): boolean {
  const err = error as {
    code?: string | number;
    status?: number;
    message?: string;
  };
  // Check for socket/connection errors
  if (err.code === 'UND_ERR_SOCKET' || err.code === 'ECONNRESET') {
    return true;
  }

  // Check for Discord API rate limits (should be handled by discord.js, but just in case)
  if (err.code === 50027 || err.status === 429) {
    return true;
  }

  // Check for temporary server errors
  if (err.status && err.status >= 500 && err.status < 600) {
    return true;
  }

  // Check for gateway/connection issues
  if (
    err.message &&
    (err.message.includes('other side closed') ||
      err.message.includes('socket hang up') ||
      err.message.includes('ECONNRESET') ||
      err.message.includes('ETIMEDOUT') ||
      err.message.includes('ENOTFOUND') ||
      err.message.includes('getaddrinfo'))
  ) {
    return true;
  }

  return false;
}

/**
 * Calculate delay for the next retry attempt using exponential backoff with jitter
 */
export function calculateDelay(
  attempt: number,
  initialDelayMs: number,
  maxDelayMs: number,
  backoffMultiplier: number
): number {
  const exponentialDelay =
    initialDelayMs * Math.pow(backoffMultiplier, attempt - 1);
  const cappedDelay = Math.min(exponentialDelay, maxDelayMs);

  // Add jitter (randomness) to prevent thundering herd
  const jitter = Math.random() * 0.3 * cappedDelay; // 0-30% jitter

  return Math.floor(cappedDelay + jitter);
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry an async operation with exponential backoff
 *
 * @param fn - The async function to retry
 * @param options - Retry configuration options
 * @returns The result of the successful function execution
 * @throws The last error if all retries are exhausted
 *
 * @example
 * ```typescript
 * const result = await retryWithBackoff(
 *   async () => await someDiscordApiCall(),
 *   { maxRetries: 3, initialDelayMs: 1000 }
 * );
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 1; attempt <= opts.maxRetries + 1; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error;

      // If this is the last attempt or error is not retryable, throw
      if (attempt > opts.maxRetries || !opts.shouldRetry(error)) {
        throw error;
      }

      // Calculate delay for next retry
      const delayMs = calculateDelay(
        attempt,
        opts.initialDelayMs,
        opts.maxDelayMs,
        opts.backoffMultiplier
      );

      // Call the retry callback if provided
      opts.onRetry(attempt, error, delayMs);

      // Wait before retrying
      await sleep(delayMs);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError;
}

/**
 * Create a wrapped version of an async function with automatic retry
 *
 * @param fn - The async function to wrap
 * @param options - Retry configuration options
 * @returns A wrapped function with automatic retry
 *
 * @example
 * ```typescript
 * const fetchUserWithRetry = withRetry(
 *   async (userId: string) => await client.users.fetch(userId),
 *   { maxRetries: 3 }
 * );
 *
 * const user = await fetchUserWithRetry('123456789');
 * ```
 */
export function withRetry<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  options: RetryOptions = {}
): (...args: TArgs) => Promise<TReturn> {
  return async (...args: TArgs): Promise<TReturn> => {
    return retryWithBackoff(() => fn(...args), options);
  };
}
