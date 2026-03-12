import type { PaginatedResponse } from '../types/common.js';

/**
 * Async generator that paginates through all pages of a cursor-based API.
 *
 * @param fetchPage - A function that fetches a single page given an optional cursor
 * @yields Each item from every page
 *
 * @example
 * ```typescript
 * for await (const agent of paginateAll((cursor) => apm.agents.listV2({ cursor, limit: 50 }))) {
 *   console.log(agent.name);
 * }
 * ```
 */
export async function* paginateAll<T>(
  fetchPage: (cursor?: string) => Promise<PaginatedResponse<T>>,
): AsyncGenerator<T, void, undefined> {
  let cursor: string | undefined = undefined;

  do {
    const page = await fetchPage(cursor);
    for (const item of page.data) {
      yield item;
    }
    cursor = page.next_cursor ?? undefined;
  } while (cursor);
}
