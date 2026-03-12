import { describe, it, expect, vi } from 'vitest';
import { paginateAll } from '../../src/utils/pagination.js';
import type { PaginatedResponse } from '../../src/types/common.js';

describe('paginateAll', () => {
  it('collects all pages', async () => {
    const fetchPage = vi.fn<(cursor?: string) => Promise<PaginatedResponse<number>>>()
      .mockResolvedValueOnce({ data: [1, 2], next_cursor: 'page2' })
      .mockResolvedValueOnce({ data: [3, 4], next_cursor: 'page3' })
      .mockResolvedValueOnce({ data: [5], next_cursor: null });

    const items: number[] = [];
    for await (const item of paginateAll(fetchPage)) {
      items.push(item);
    }

    expect(items).toEqual([1, 2, 3, 4, 5]);
    expect(fetchPage).toHaveBeenCalledTimes(3);
    expect(fetchPage).toHaveBeenNthCalledWith(1, undefined);
    expect(fetchPage).toHaveBeenNthCalledWith(2, 'page2');
    expect(fetchPage).toHaveBeenNthCalledWith(3, 'page3');
  });

  it('stops when has_more is false (next_cursor is null)', async () => {
    const fetchPage = vi.fn<(cursor?: string) => Promise<PaginatedResponse<string>>>()
      .mockResolvedValueOnce({ data: ['a', 'b'], next_cursor: null });

    const items: string[] = [];
    for await (const item of paginateAll(fetchPage)) {
      items.push(item);
    }

    expect(items).toEqual(['a', 'b']);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it('handles empty first page', async () => {
    const fetchPage = vi.fn<(cursor?: string) => Promise<PaginatedResponse<string>>>()
      .mockResolvedValueOnce({ data: [], next_cursor: null });

    const items: string[] = [];
    for await (const item of paginateAll(fetchPage)) {
      items.push(item);
    }

    expect(items).toEqual([]);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it('passes cursor from previous page to next fetch', async () => {
    const fetchPage = vi.fn<(cursor?: string) => Promise<PaginatedResponse<number>>>()
      .mockResolvedValueOnce({ data: [1], next_cursor: 'abc123' })
      .mockResolvedValueOnce({ data: [2], next_cursor: null });

    const items: number[] = [];
    for await (const item of paginateAll(fetchPage)) {
      items.push(item);
    }

    expect(items).toEqual([1, 2]);
    expect(fetchPage).toHaveBeenNthCalledWith(2, 'abc123');
  });
});
