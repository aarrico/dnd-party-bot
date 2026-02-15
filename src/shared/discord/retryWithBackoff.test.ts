import { describe, it, expect, vi } from 'vitest';
import {
  isRetryableError,
  calculateDelay,
  retryWithBackoff,
} from './retryWithBackoff.js';

describe('isRetryableError', () => {
  it('retries on socket errors', () => {
    expect(isRetryableError({ code: 'UND_ERR_SOCKET' })).toBe(true);
    expect(isRetryableError({ code: 'ECONNRESET' })).toBe(true);
  });

  it('retries on Discord rate limits', () => {
    expect(isRetryableError({ code: 50027 })).toBe(true);
    expect(isRetryableError({ status: 429 })).toBe(true);
  });

  it('retries on server errors (5xx)', () => {
    expect(isRetryableError({ status: 500 })).toBe(true);
    expect(isRetryableError({ status: 502 })).toBe(true);
    expect(isRetryableError({ status: 503 })).toBe(true);
  });

  it('retries on connection error messages', () => {
    expect(isRetryableError({ message: 'other side closed' })).toBe(true);
    expect(isRetryableError({ message: 'socket hang up' })).toBe(true);
    expect(isRetryableError({ message: 'ECONNRESET' })).toBe(true);
    expect(isRetryableError({ message: 'ETIMEDOUT' })).toBe(true);
    expect(isRetryableError({ message: 'ENOTFOUND' })).toBe(true);
    expect(isRetryableError({ message: 'getaddrinfo failed' })).toBe(true);
  });

  it('does not retry client errors', () => {
    expect(isRetryableError({ status: 400 })).toBe(false);
    expect(isRetryableError({ status: 404 })).toBe(false);
    expect(isRetryableError({ status: 403 })).toBe(false);
  });

  it('does not retry generic errors', () => {
    expect(isRetryableError(new Error('something went wrong'))).toBe(false);
    expect(isRetryableError({})).toBe(false);
  });
});

describe('calculateDelay', () => {
  it('returns initial delay on first attempt', () => {
    const delay = calculateDelay(1, 1000, 10000, 2);
    // Base is 1000, jitter adds 0-30%, so range is 1000-1300
    expect(delay).toBeGreaterThanOrEqual(1000);
    expect(delay).toBeLessThanOrEqual(1300);
  });

  it('increases exponentially', () => {
    const delay = calculateDelay(3, 1000, 100000, 2);
    // Base is 1000 * 2^2 = 4000, jitter adds 0-30%, so range is 4000-5200
    expect(delay).toBeGreaterThanOrEqual(4000);
    expect(delay).toBeLessThanOrEqual(5200);
  });

  it('caps at maxDelayMs', () => {
    const delay = calculateDelay(10, 1000, 5000, 2);
    // Capped at 5000 + up to 30% jitter = max 6500
    expect(delay).toBeLessThanOrEqual(6500);
    expect(delay).toBeGreaterThanOrEqual(5000);
  });
});

describe('retryWithBackoff', () => {
  it('returns result on first success', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await retryWithBackoff(fn, {
      maxRetries: 3,
      onRetry: () => {},
    });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on retryable errors and succeeds', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce({ code: 'ECONNRESET' })
      .mockResolvedValue('ok');

    const result = await retryWithBackoff(fn, {
      maxRetries: 3,
      initialDelayMs: 1,
      onRetry: () => {},
    });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('throws immediately on non-retryable errors', async () => {
    const fn = vi.fn().mockRejectedValue({ status: 404 });

    await expect(
      retryWithBackoff(fn, { maxRetries: 3, onRetry: () => {} })
    ).rejects.toEqual({ status: 404 });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('throws after exhausting retries', async () => {
    const fn = vi.fn().mockRejectedValue({ code: 'ECONNRESET' });

    await expect(
      retryWithBackoff(fn, {
        maxRetries: 2,
        initialDelayMs: 1,
        onRetry: () => {},
      })
    ).rejects.toEqual({ code: 'ECONNRESET' });
    expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
  });
});
