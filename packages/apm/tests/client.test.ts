import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { APMClient, APMClientError } from '../src/client.js';

// Helper to create a mock Response
function mockResponse(body: unknown, options: { status?: number; statusText?: string; contentType?: string } = {}): Response {
  const { status = 200, statusText = 'OK', contentType = 'application/json' } = options;
  const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);

  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    headers: new Headers({ 'content-type': contentType }),
    json: () => Promise.resolve(typeof body === 'string' ? JSON.parse(body) : body),
    text: () => Promise.resolve(bodyStr),
    body: null,
    bodyUsed: false,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
    bytes: () => Promise.resolve(new Uint8Array()),
    formData: () => Promise.resolve(new FormData()),
    clone: () => mockResponse(body, options),
    redirected: false,
    type: 'basic' as ResponseType,
    url: '',
  } as Response;
}

describe('APMClient', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('uses default baseUrl when no options provided', () => {
      const client = new APMClient();
      // Verify by making a request and checking the URL
      fetchMock.mockResolvedValue(mockResponse({ status: 'ok' }));
      client.health.check();
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3032/health',
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('uses custom baseUrl', () => {
      const client = new APMClient({ baseUrl: 'http://myhost:4000' });
      fetchMock.mockResolvedValue(mockResponse({ status: 'ok' }));
      client.health.check();
      expect(fetchMock).toHaveBeenCalledWith(
        'http://myhost:4000/health',
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('strips trailing slash from custom baseUrl', () => {
      const client = new APMClient({ baseUrl: 'http://myhost:4000/' });
      fetchMock.mockResolvedValue(mockResponse({ status: 'ok' }));
      client.health.check();
      expect(fetchMock).toHaveBeenCalledWith(
        'http://myhost:4000/health',
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('includes custom headers in requests', async () => {
      const client = new APMClient({
        headers: { 'X-Custom': 'test-value' },
        retry: { maxRetries: 0 },
      });
      fetchMock.mockResolvedValue(mockResponse({ status: 'ok' }));
      await client.health.check();
      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({ 'X-Custom': 'test-value' }),
        }),
      );
    });
  });

  describe('health namespace', () => {
    it('check() calls GET /health', async () => {
      const client = new APMClient({ retry: { maxRetries: 0 } });
      fetchMock.mockResolvedValue(mockResponse({ status: 'ok' }));

      const result = await client.health.check();
      expect(result).toEqual({ status: 'ok' });
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3032/health',
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('status() calls GET /api/status', async () => {
      const client = new APMClient({ retry: { maxRetries: 0 } });
      fetchMock.mockResolvedValue(mockResponse({ version: '5.4.0' }));

      const result = await client.health.status();
      expect(result).toEqual({ version: '5.4.0' });
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3032/api/status',
        expect.objectContaining({ method: 'GET' }),
      );
    });
  });

  describe('agents namespace', () => {
    it('list() calls GET /api/agents', async () => {
      const client = new APMClient({ retry: { maxRetries: 0 } });
      const agents = [{ id: 'agent-1', name: 'test' }];
      fetchMock.mockResolvedValue(mockResponse(agents));

      const result = await client.agents.list();
      expect(result).toEqual(agents);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3032/api/agents',
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('register() sends POST to /api/register with payload', async () => {
      const client = new APMClient({ retry: { maxRetries: 0 } });
      const payload = { agent_id: 'agent-1', project: 'ccem', role: 'worker', status: 'active' };
      const created = { id: 'agent-1', ...payload };
      fetchMock.mockResolvedValue(mockResponse(created));

      const result = await client.agents.register(payload as never);
      expect(result).toEqual(created);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3032/api/register',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(payload),
        }),
      );
    });

    it('get() calls GET /api/v2/agents/:id', async () => {
      const client = new APMClient({ retry: { maxRetries: 0 } });
      const agent = { id: 'agent-1', name: 'test' };
      fetchMock.mockResolvedValue(mockResponse(agent));

      const result = await client.agents.get('agent-1');
      expect(result).toEqual(agent);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3032/api/v2/agents/agent-1',
        expect.objectContaining({ method: 'GET' }),
      );
    });
  });

  describe('error handling', () => {
    it('throws APMClientError on non-2xx response', async () => {
      const client = new APMClient({ retry: { maxRetries: 0 } });
      fetchMock.mockResolvedValue(
        mockResponse('{"error":"not found"}', { status: 404, statusText: 'Not Found' }),
      );

      await expect(client.agents.list()).rejects.toThrow(APMClientError);
    });

    it('error includes status and body', async () => {
      const client = new APMClient({ retry: { maxRetries: 0 } });
      fetchMock.mockResolvedValue(
        mockResponse('{"error":"server error"}', { status: 500, statusText: 'Internal Server Error' }),
      );

      try {
        await client.health.check();
        expect.fail('should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(APMClientError);
        const error = e as APMClientError;
        expect(error.status).toBe(500);
        expect(error.body).toBe('{"error":"server error"}');
        expect(error.message).toContain('500');
      }
    });

    it('error name is APMClientError', async () => {
      const client = new APMClient({ retry: { maxRetries: 0 } });
      fetchMock.mockResolvedValue(
        mockResponse('bad', { status: 400, statusText: 'Bad Request' }),
      );

      try {
        await client.health.check();
        expect.fail('should have thrown');
      } catch (e) {
        expect((e as APMClientError).name).toBe('APMClientError');
      }
    });
  });

  describe('namespace API coverage', () => {
    // Verify all 28 namespaces are initialized and accessible
    const namespaceNames = [
      'health', 'agents', 'sessions', 'notifications', 'data', 'ralph',
      'commands', 'tasks', 'skills', 'projects', 'upm', 'ports',
      'environments', 'config', 'metrics', 'slos', 'alerts', 'audit',
      'formations', 'workflows', 'verify', 'agUi', 'toolCalls',
      'generativeUi', 'approvals', 'chat', 'a2a', 'intake', 'hooks', 'scanner',
    ] as const;

    it('all namespaces are defined on the client', () => {
      const client = new APMClient();
      for (const ns of namespaceNames) {
        expect(client[ns as keyof APMClient], `namespace "${ns}" should be defined`).toBeDefined();
        expect(typeof client[ns as keyof APMClient], `namespace "${ns}" should be an object`).toBe('object');
      }
    });

    // Spot-check representative methods from various namespaces
    const namespaceCases: Array<{ ns: string; method: string; httpMethod: string; urlPattern: string }> = [
      { ns: 'sessions', method: 'list', httpMethod: 'GET', urlPattern: '/api/v2/sessions' },
      { ns: 'notifications', method: 'list', httpMethod: 'GET', urlPattern: '/api/notifications' },
      { ns: 'data', method: 'get', httpMethod: 'GET', urlPattern: '/api/data' },
      { ns: 'ralph', method: 'get', httpMethod: 'GET', urlPattern: '/api/ralph' },
      { ns: 'commands', method: 'list', httpMethod: 'GET', urlPattern: '/api/commands' },
      { ns: 'tasks', method: 'listBg', httpMethod: 'GET', urlPattern: '/api/bg-tasks' },
      { ns: 'skills', method: 'list', httpMethod: 'GET', urlPattern: '/api/skills' },
      { ns: 'projects', method: 'list', httpMethod: 'GET', urlPattern: '/api/projects' },
      { ns: 'upm', method: 'status', httpMethod: 'GET', urlPattern: '/api/upm/status' },
      { ns: 'ports', method: 'list', httpMethod: 'GET', urlPattern: '/api/ports' },
      { ns: 'environments', method: 'list', httpMethod: 'GET', urlPattern: '/api/environments' },
      { ns: 'metrics', method: 'fleet', httpMethod: 'GET', urlPattern: '/api/v2/metrics' },
      { ns: 'slos', method: 'list', httpMethod: 'GET', urlPattern: '/api/v2/slos' },
      { ns: 'alerts', method: 'rules', httpMethod: 'GET', urlPattern: '/api/v2/alerts/rules' },
      { ns: 'audit', method: 'list', httpMethod: 'GET', urlPattern: '/api/v2/audit' },
      { ns: 'formations', method: 'list', httpMethod: 'GET', urlPattern: '/api/v2/formations' },
      { ns: 'workflows', method: 'list', httpMethod: 'GET', urlPattern: '/api/v2/workflows' },
      { ns: 'approvals', method: 'list', httpMethod: 'GET', urlPattern: '/api/v2/approvals' },
      { ns: 'intake', method: 'list', httpMethod: 'GET', urlPattern: '/api/intake' },
      { ns: 'scanner', method: 'results', httpMethod: 'GET', urlPattern: '/api/scanner/results' },
    ];

    for (const { ns, method, httpMethod, urlPattern } of namespaceCases) {
      it(`${ns}.${method}() calls ${httpMethod} ${urlPattern}`, async () => {
        const client = new APMClient({ retry: { maxRetries: 0 } });
        fetchMock.mockResolvedValue(mockResponse([]));

        const namespace = client[ns as keyof APMClient] as Record<string, (...args: unknown[]) => Promise<unknown>>;
        await namespace[method]();

        expect(fetchMock).toHaveBeenCalledWith(
          expect.stringContaining(urlPattern),
          expect.objectContaining({ method: httpMethod }),
        );
      });
    }
  });

  describe('POST with body', () => {
    it('notifications.add() sends correct JSON body', async () => {
      const client = new APMClient({ retry: { maxRetries: 0 } });
      const payload = { type: 'info', title: 'Test', message: 'Hello' };
      fetchMock.mockResolvedValue(mockResponse({ id: 'n-1', ...payload }));

      await client.notifications.add(payload as never);

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3032/api/notify',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(payload),
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        }),
      );
    });
  });

  describe('non-JSON response', () => {
    it('returns text when content-type is not application/json', async () => {
      const client = new APMClient({ retry: { maxRetries: 0 } });
      fetchMock.mockResolvedValue(mockResponse('plain text', {
        status: 200,
        contentType: 'text/plain',
      }));

      const result = await client.health.check();
      expect(result).toBe('plain text');
    });
  });
});
