import { describe, it, expect } from 'vitest';
import { buildUrl } from '../../src/utils/url.js';

describe('buildUrl', () => {
  it('builds URL from base and path', () => {
    const url = buildUrl('http://localhost:3032', '/api/agents');
    expect(url).toBe('http://localhost:3032/api/agents');
  });

  it('builds URL with query params', () => {
    const url = buildUrl('http://localhost:3032', '/api/agents', {
      limit: 10,
      status: 'active',
    });
    expect(url).toBe('http://localhost:3032/api/agents?limit=10&status=active');
  });

  it('omits undefined params', () => {
    const url = buildUrl('http://localhost:3032', '/api/agents', {
      limit: 10,
      cursor: undefined,
    });
    expect(url).toBe('http://localhost:3032/api/agents?limit=10');
  });

  it('strips trailing slashes from base', () => {
    const url = buildUrl('http://localhost:3032/', '/api/agents');
    expect(url).toBe('http://localhost:3032/api/agents');
  });

  it('strips multiple trailing slashes from base', () => {
    const url = buildUrl('http://localhost:3032///', '/api/agents');
    expect(url).toBe('http://localhost:3032/api/agents');
  });

  it('adds leading slash to path if missing', () => {
    const url = buildUrl('http://localhost:3032', 'api/agents');
    expect(url).toBe('http://localhost:3032/api/agents');
  });

  it('handles boolean query params', () => {
    const url = buildUrl('http://localhost:3032', '/api/agents', {
      verbose: true,
    });
    expect(url).toBe('http://localhost:3032/api/agents?verbose=true');
  });

  it('handles all params undefined', () => {
    const url = buildUrl('http://localhost:3032', '/api/agents', {
      cursor: undefined,
      limit: undefined,
    });
    expect(url).toBe('http://localhost:3032/api/agents');
  });
});
