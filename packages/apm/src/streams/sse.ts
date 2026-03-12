/** A parsed Server-Sent Event */
export interface SSEvent {
  /** Event type (defaults to "message") */
  type: string;
  /** Event data (parsed as JSON if possible, otherwise raw string) */
  data: unknown;
  /** Event ID */
  id?: string;
  /** Retry interval in milliseconds */
  retry?: number;
}

/** Options for SSEStream */
export interface SSEStreamOptions {
  /** Maximum number of reconnection attempts (default: 5) */
  maxReconnects?: number;
  /** Initial reconnect delay in milliseconds (default: 1000) */
  reconnectDelay?: number;
  /** Backoff multiplier for reconnect delay (default: 2) */
  backoff?: number;
  /** Additional headers to send with the request */
  headers?: Record<string, string>;
  /** AbortSignal for cancellation */
  signal?: AbortSignal;
}

/**
 * SSEStream wraps native fetch() ReadableStream for Server-Sent Events
 * with automatic reconnection and exponential backoff.
 *
 * @example
 * ```typescript
 * const stream = new SSEStream('http://localhost:3032/api/v2/ag-ui/events');
 * for await (const event of stream) {
 *   console.log(event.type, event.data);
 * }
 * ```
 */
export class SSEStream implements AsyncIterable<SSEvent> {
  private url: string;
  private options: Required<Omit<SSEStreamOptions, 'signal' | 'headers'>> & Pick<SSEStreamOptions, 'signal' | 'headers'>;
  private lastEventId: string | undefined;

  constructor(url: string, options: SSEStreamOptions = {}) {
    this.url = url;
    this.options = {
      maxReconnects: options.maxReconnects ?? 5,
      reconnectDelay: options.reconnectDelay ?? 1000,
      backoff: options.backoff ?? 2,
      headers: options.headers,
      signal: options.signal,
    };
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<SSEvent, void, undefined> {
    let reconnects = 0;
    let delay = this.options.reconnectDelay;

    while (reconnects <= this.options.maxReconnects) {
      try {
        const headers: Record<string, string> = {
          Accept: 'text/event-stream',
          'Cache-Control': 'no-cache',
          ...this.options.headers,
        };

        if (this.lastEventId) {
          headers['Last-Event-ID'] = this.lastEventId;
        }

        const response = await fetch(this.url, {
          headers,
          signal: this.options.signal,
        });

        if (!response.ok) {
          throw new Error(`SSE connection failed: ${response.status} ${response.statusText}`);
        }

        if (!response.body) {
          throw new Error('SSE response has no body');
        }

        // Reset reconnect state on successful connection
        reconnects = 0;
        delay = this.options.reconnectDelay;

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const events = this.parseEvents(buffer);
            buffer = events.remaining;

            for (const event of events.parsed) {
              if (event.id) {
                this.lastEventId = event.id;
              }
              if (event.retry !== undefined) {
                delay = event.retry;
              }
              yield event;
            }
          }
        } finally {
          reader.releaseLock();
        }

        // Stream ended normally, exit
        return;
      } catch (error) {
        // If aborted, don't reconnect
        if (this.options.signal?.aborted) {
          return;
        }

        reconnects++;
        if (reconnects > this.options.maxReconnects) {
          throw error;
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= this.options.backoff;
      }
    }
  }

  /** Parse SSE text buffer into events */
  private parseEvents(buffer: string): { parsed: SSEvent[]; remaining: string } {
    const parsed: SSEvent[] = [];
    const blocks = buffer.split('\n\n');

    // Last block might be incomplete
    const remaining = blocks.pop() ?? '';

    for (const block of blocks) {
      if (!block.trim()) continue;

      let eventType = 'message';
      let data = '';
      let id: string | undefined;
      let retry: number | undefined;

      for (const line of block.split('\n')) {
        if (line.startsWith(':')) continue; // Comment

        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) continue;

        const field = line.slice(0, colonIndex);
        const value = line.slice(colonIndex + 1).trimStart();

        switch (field) {
          case 'event':
            eventType = value;
            break;
          case 'data':
            data += (data ? '\n' : '') + value;
            break;
          case 'id':
            id = value;
            break;
          case 'retry': {
            const parsed = parseInt(value, 10);
            if (!isNaN(parsed)) retry = parsed;
            break;
          }
        }
      }

      if (!data && !eventType) continue;

      let parsedData: unknown = data;
      try {
        parsedData = JSON.parse(data);
      } catch {
        // Keep as string
      }

      parsed.push({ type: eventType, data: parsedData, id, retry });
    }

    return { parsed, remaining };
  }
}
