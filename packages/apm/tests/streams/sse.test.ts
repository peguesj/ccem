import { describe, it, expect } from 'vitest';
import { SSEStream } from '../../src/streams/sse.js';
import type { SSEvent } from '../../src/streams/sse.js';

/**
 * The SSEStream.parseEvents method is private, so we test it by
 * subclassing and exposing it for unit testing.
 */
class TestableSSEStream extends SSEStream {
  /** Expose the private parseEvents method for testing */
  public testParseEvents(buffer: string): { parsed: SSEvent[]; remaining: string } {
    // Access via prototype to call the private method
    return (this as unknown as { parseEvents(b: string): { parsed: SSEvent[]; remaining: string } }).parseEvents(buffer);
  }
}

describe('SSEStream parseEvents', () => {
  const stream = new TestableSSEStream('http://localhost:3032/api/v2/ag-ui/events');

  it('parses a single event', () => {
    const buffer = 'data: hello world\n\n';
    const result = stream.testParseEvents(buffer);

    expect(result.parsed).toHaveLength(1);
    expect(result.parsed[0].type).toBe('message');
    expect(result.parsed[0].data).toBe('hello world');
    expect(result.remaining).toBe('');
  });

  it('parses multiple events', () => {
    const buffer = 'data: first\n\ndata: second\n\n';
    const result = stream.testParseEvents(buffer);

    expect(result.parsed).toHaveLength(2);
    expect(result.parsed[0].data).toBe('first');
    expect(result.parsed[1].data).toBe('second');
  });

  it('handles incomplete buffer', () => {
    const buffer = 'data: partial';
    const result = stream.testParseEvents(buffer);

    expect(result.parsed).toHaveLength(0);
    expect(result.remaining).toBe('data: partial');
  });

  it('parses event with custom type', () => {
    const buffer = 'event: agent_update\ndata: payload\n\n';
    const result = stream.testParseEvents(buffer);

    expect(result.parsed).toHaveLength(1);
    expect(result.parsed[0].type).toBe('agent_update');
    expect(result.parsed[0].data).toBe('payload');
  });

  it('parses JSON data', () => {
    const json = JSON.stringify({ id: 'abc', status: 'active' });
    const buffer = `data: ${json}\n\n`;
    const result = stream.testParseEvents(buffer);

    expect(result.parsed).toHaveLength(1);
    expect(result.parsed[0].data).toEqual({ id: 'abc', status: 'active' });
  });

  it('handles comments (lines starting with colon)', () => {
    const buffer = ': this is a comment\ndata: real data\n\n';
    const result = stream.testParseEvents(buffer);

    expect(result.parsed).toHaveLength(1);
    expect(result.parsed[0].data).toBe('real data');
  });

  it('parses event with id field', () => {
    const buffer = 'id: evt-123\ndata: payload\n\n';
    const result = stream.testParseEvents(buffer);

    expect(result.parsed).toHaveLength(1);
    expect(result.parsed[0].id).toBe('evt-123');
    expect(result.parsed[0].data).toBe('payload');
  });

  it('parses event with retry field', () => {
    const buffer = 'retry: 5000\ndata: payload\n\n';
    const result = stream.testParseEvents(buffer);

    expect(result.parsed).toHaveLength(1);
    expect(result.parsed[0].retry).toBe(5000);
  });

  it('parses multi-line data', () => {
    const buffer = 'data: line1\ndata: line2\n\n';
    const result = stream.testParseEvents(buffer);

    expect(result.parsed).toHaveLength(1);
    expect(result.parsed[0].data).toBe('line1\nline2');
  });

  it('handles mixed complete and incomplete events', () => {
    const buffer = 'data: complete\n\ndata: incom';
    const result = stream.testParseEvents(buffer);

    expect(result.parsed).toHaveLength(1);
    expect(result.parsed[0].data).toBe('complete');
    expect(result.remaining).toBe('data: incom');
  });

  it('ignores non-standard retry values', () => {
    const buffer = 'retry: notanumber\ndata: payload\n\n';
    const result = stream.testParseEvents(buffer);

    expect(result.parsed).toHaveLength(1);
    expect(result.parsed[0].retry).toBeUndefined();
  });
});
