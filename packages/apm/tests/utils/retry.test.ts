import { describe, it, expect, vi } from 'vitest';
import { retry } from '../../src/utils/retry.js';

describe('retry', () => {
  it('succeeds on first try', async () => {
    const fn = vi.fn().mockResolvedValue('ok');
    const result = await retry(fn);
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('succeeds after failures', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('ok');

    const result = await retry(fn, { maxRetries: 3, delay: 1, backoff: 1 });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('throws after max retries exhausted', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('always fails'));

    await expect(
      retry(fn, { maxRetries: 2, delay: 1, backoff: 1 }),
    ).rejects.toThrow('always fails');

    // 1 initial + 2 retries = 3 total
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('applies exponential backoff', async () => {
    vi.useFakeTimers();

    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('ok');

    const promise = retry(fn, { maxRetries: 3, delay: 100, backoff: 2 });

    // Advance past the first delay (100ms)
    await vi.advanceTimersByTimeAsync(100);
    // Advance past the second delay (200ms = 100 * 2)
    await vi.advanceTimersByTimeAsync(200);

    const result = await promise;
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);

    vi.useRealTimers();
  });

  it('uses default options when none provided', async () => {
    const fn = vi.fn().mockResolvedValue(42);
    const result = await retry(fn);
    expect(result).toBe(42);
  });

  it('throws the last error when all retries fail', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('error 1'))
      .mockRejectedValueOnce(new Error('error 2'))
      .mockRejectedValueOnce(new Error('error 3'))
      .mockRejectedValueOnce(new Error('error 4'));

    await expect(
      retry(fn, { maxRetries: 3, delay: 1, backoff: 1 }),
    ).rejects.toThrow('error 4');
  });
});
