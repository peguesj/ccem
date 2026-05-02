import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { APMClient } from '../src/client.js';
import {
  AuthDecisionSchema, AuthSessionSchema, AuthToolSchema,
  CoalesceRunSummarySchema, GateSchema, GateDecisionSchema,
  AgentContextSchema, ExecutionContextSchema, ToolCallSummarySchema,
  ApprovalRequestSchema, ApprovalAuditEntrySchema,
  WidgetSchema, WidgetConfigSchema, LayoutPresetSchema,
} from '../src/types/index.js';

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

describe('New API Classes (v3.0.0)', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let client: APMClient;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    client = new APMClient({ retry: { maxRetries: 0 } });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --- Zod Schema Validation Tests ---

  describe('Auth Zod Schemas', () => {
    it('AuthDecisionSchema parses valid data', () => {
      const result = AuthDecisionSchema.parse({
        ok: true,
        decision: 'permit',
        reason: 'Tool is low risk',
        risk_level: 'low',
        token_id: 'tok_123',
      });
      expect(result.decision).toBe('permit');
      expect(result.ok).toBe(true);
    });

    it('AuthDecisionSchema rejects invalid decision', () => {
      expect(() => AuthDecisionSchema.parse({
        ok: true,
        decision: 'invalid_value',
      })).toThrow();
    });

    it('AuthSessionSchema parses valid data', () => {
      const result = AuthSessionSchema.parse({
        session_id: 'sess_1',
        user_id: 'user_1',
        role: 'admin',
        scope: 'global',
        trust_ceiling: 'high',
        tool_calls: 42,
        denied_count: 3,
      });
      expect(result.session_id).toBe('sess_1');
      expect(result.tool_calls).toBe(42);
    });

    it('AuthToolSchema parses valid data', () => {
      const result = AuthToolSchema.parse({
        name: 'Bash',
        risk_level: 'high',
        requires_approval: true,
        description: 'Execute shell commands',
      });
      expect(result.name).toBe('Bash');
      expect(result.risk_level).toBe('high');
    });
  });

  describe('Coalesce Zod Schemas', () => {
    it('CoalesceRunSummarySchema parses valid data', () => {
      const result = CoalesceRunSummarySchema.parse({
        run_id: 'run_1',
        scope: 'all',
        status: 'complete',
        dry_run: false,
        affected_skill_count: 12,
        diff_count: 34,
      });
      expect(result.run_id).toBe('run_1');
    });

    it('GateSchema parses valid data', () => {
      const result = GateSchema.parse({
        gate_id: 'gate_1',
        question: 'Deploy to production?',
        status: 'pending',
        options: ['Deploy', 'Cancel'],
      });
      expect(result.status).toBe('pending');
    });

    it('GateDecisionSchema parses valid data', () => {
      const result = GateDecisionSchema.parse({
        gate_id: 'gate_1',
        decision: 'approved',
        reason: 'Tests passed',
        method: 'api',
      });
      expect(result.decision).toBe('approved');
    });

    it('GateSchema rejects invalid status', () => {
      expect(() => GateSchema.parse({
        gate_id: 'gate_1',
        status: 'invalid',
      })).toThrow();
    });
  });

  describe('Agent Context Zod Schemas', () => {
    it('AgentContextSchema parses valid data', () => {
      const result = AgentContextSchema.parse({
        agent_id: 'agent_1',
        current_phase: 'building',
        current_tool: 'Write',
        formation_id: 'form_1',
        squadron_id: 'sq_1',
      });
      expect(result.agent_id).toBe('agent_1');
    });

    it('ExecutionContextSchema parses valid data', () => {
      const result = ExecutionContextSchema.parse({
        tool_name: 'Write',
        tool_purpose: 'Create a file',
        affected_files: ['/src/index.ts'],
        estimated_impact: 'medium',
      });
      expect(result.tool_name).toBe('Write');
      expect(result.affected_files).toHaveLength(1);
    });

    it('ExecutionContextSchema rejects invalid impact', () => {
      expect(() => ExecutionContextSchema.parse({
        estimated_impact: 'extreme',
      })).toThrow();
    });

    it('ToolCallSummarySchema parses valid data', () => {
      const result = ToolCallSummarySchema.parse({
        tool_call_id: 'tc_1',
        tool_name: 'Read',
        status: 'completed',
        duration_ms: 150,
      });
      expect(result.status).toBe('completed');
    });
  });

  describe('Expanded Approval Zod Schemas', () => {
    it('ApprovalRequestSchema parses v9.0.0 data', () => {
      const result = ApprovalRequestSchema.parse({
        id: 'apr_1',
        tool_name: 'Bash',
        agent_id: 'agent_1',
        session_id: 'sess_1',
        display_name: 'Build Agent',
        execution_context: {
          tool_name: 'Bash',
          tool_purpose: 'Run build',
          affected_files: [],
          estimated_impact: 'low',
        },
        risk_level: 'medium',
        group_key: 'agent_1',
        status: 'pending',
        keyboard_shortcuts: {
          approve: 'Cmd+Y',
          reject: 'Cmd+N',
          dismiss: 'Escape',
        },
      });
      expect(result.tool_name).toBe('Bash');
      expect(result.execution_context?.tool_purpose).toBe('Run build');
    });

    it('ApprovalAuditEntrySchema parses valid data', () => {
      const result = ApprovalAuditEntrySchema.parse({
        id: 'audit_1',
        tool_name: 'Write',
        agent_id: 'agent_2',
        decision: 'approved',
        method: 'keyboard_shortcut',
        risk_level: 'high',
        timestamp: '2026-04-18T12:00:00Z',
      });
      expect(result.method).toBe('keyboard_shortcut');
    });

    it('ApprovalAuditEntrySchema rejects invalid method', () => {
      expect(() => ApprovalAuditEntrySchema.parse({
        decision: 'approved',
        method: 'telepathy',
      })).toThrow();
    });
  });

  describe('Widget Zod Schemas', () => {
    it('WidgetSchema parses valid data', () => {
      const result = WidgetSchema.parse({
        id: 'projects',
        name: 'Projects',
        category: 'monitoring',
        editable: true,
        pinnable: true,
        supported_scopes: ['global', 'project'],
        display_order: 1,
        col_span: 4,
      });
      expect(result.id).toBe('projects');
      expect(result.pinnable).toBe(true);
    });

    it('WidgetConfigSchema parses valid data', () => {
      const result = WidgetConfigSchema.parse({
        widget_id: 'projects',
        config: { refresh_interval: 5000 },
        pinned: false,
      });
      expect(result.widget_id).toBe('projects');
    });

    it('LayoutPresetSchema parses valid data', () => {
      const result = LayoutPresetSchema.parse({
        id: 'default',
        name: 'Default Layout',
        placements: [
          { widget_id: 'projects', col: 0, row: 0, col_span: 4 },
          { widget_id: 'agents', col: 4, row: 0, col_span: 8 },
        ],
      });
      expect(result.placements).toHaveLength(2);
    });
  });

  // --- AuthAPI Client Tests ---

  describe('auth namespace', () => {
    it('authorize() calls POST /api/v2/auth/authorize', async () => {
      fetchMock.mockResolvedValue(mockResponse({ ok: true, decision: 'permit', risk_level: 'low' }));
      const result = await client.auth.authorize({
        agent_id: 'a1', session_id: 's1', tool_name: 'Bash',
      });
      expect(result.decision).toBe('permit');
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3032/api/v2/auth/authorize',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('listSessions() calls GET /api/v2/auth/sessions', async () => {
      fetchMock.mockResolvedValue(mockResponse({ ok: true, sessions: [], count: 0 }));
      const result = await client.auth.listSessions();
      expect(result.sessions).toEqual([]);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3032/api/v2/auth/sessions',
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('createSession() calls POST /api/v2/auth/sessions', async () => {
      fetchMock.mockResolvedValue(mockResponse({ ok: true, session_id: 'new_sess' }));
      const result = await client.auth.createSession({ user_id: 'u1', role: 'admin' });
      expect(result.session_id).toBe('new_sess');
    });

    it('destroySession() calls DELETE /api/v2/auth/sessions/:id', async () => {
      fetchMock.mockResolvedValue(mockResponse({ ok: true }));
      await client.auth.destroySession('sess_1');
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3032/api/v2/auth/sessions/sess_1',
        expect.objectContaining({ method: 'DELETE' }),
      );
    });

    it('listTools() calls GET /api/v2/auth/tools', async () => {
      fetchMock.mockResolvedValue(mockResponse([{ name: 'Bash', risk_level: 'high' }]));
      const result = await client.auth.listTools();
      expect(result).toHaveLength(1);
    });

    it('registerTool() calls POST /api/v2/auth/tools', async () => {
      fetchMock.mockResolvedValue(mockResponse({ name: 'Write', risk_level: 'medium' }));
      const result = await client.auth.registerTool({ name: 'Write', risk_level: 'medium' });
      expect(result.name).toBe('Write');
    });

    it('redact() calls POST /api/v2/auth/redact', async () => {
      fetchMock.mockResolvedValue(mockResponse({ ok: true, redacted: '***', redactions_applied: 1 }));
      const result = await client.auth.redact({ content: 'secret-key-123' });
      expect(result.redactions_applied).toBe(1);
    });

    it('summary() calls GET /api/v2/auth/summary', async () => {
      fetchMock.mockResolvedValue(mockResponse({ total_authorized: 100, active_sessions: 3 }));
      const result = await client.auth.summary();
      expect(result.total_authorized).toBe(100);
    });

    it('authorizeMemoryRead() calls POST /api/v2/auth/memory/authorize-read', async () => {
      fetchMock.mockResolvedValue(mockResponse({ ok: true, decision: 'permit' }));
      const result = await client.auth.authorizeMemoryRead({ session_id: 's1', path: '/memory/vault' });
      expect(result.decision).toBe('permit');
    });

    it('execute() calls POST /api/v2/auth/execute', async () => {
      fetchMock.mockResolvedValue(mockResponse({ ok: true }));
      await client.auth.execute({ token_id: 'tok_1' });
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3032/api/v2/auth/execute',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  // --- CoalesceAPI Client Tests ---

  describe('coalesce namespace', () => {
    it('start() calls POST /api/v2/coalesce/start', async () => {
      fetchMock.mockResolvedValue(mockResponse({ run_id: 'run_1', scope: 'all' }));
      const result = await client.coalesce.start({ scope: 'all' });
      expect(result.run_id).toBe('run_1');
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3032/api/v2/coalesce/start',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('list() calls GET /api/v2/coalesce', async () => {
      fetchMock.mockResolvedValue(mockResponse({ runs: [], total: 0, pending_gates: 0 }));
      const result = await client.coalesce.list();
      expect(result.runs).toEqual([]);
    });

    it('get() calls GET /api/v2/coalesce/:id', async () => {
      fetchMock.mockResolvedValue(mockResponse({ run_id: 'r1', status: 'complete' }));
      await client.coalesce.get('r1');
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3032/api/v2/coalesce/r1',
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('cancel() calls DELETE /api/v2/coalesce/:id', async () => {
      fetchMock.mockResolvedValue(mockResponse({ ok: true }));
      await client.coalesce.cancel('r1');
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3032/api/v2/coalesce/r1',
        expect.objectContaining({ method: 'DELETE' }),
      );
    });

    it('diff() calls GET /api/v2/coalesce/:id/diff', async () => {
      fetchMock.mockResolvedValue(mockResponse({ diffs: [] }));
      await client.coalesce.diff('r1');
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3032/api/v2/coalesce/r1/diff',
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('apply() calls POST /api/v2/coalesce/:id/apply', async () => {
      fetchMock.mockResolvedValue(mockResponse({ ok: true }));
      await client.coalesce.apply('r1');
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3032/api/v2/coalesce/r1/apply',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('gateDecide() calls POST /api/v2/coalesce/:id/gate/:gate_id/decide', async () => {
      fetchMock.mockResolvedValue(mockResponse({ ok: true }));
      await client.coalesce.gateDecide('r1', 'g1', { decision: 'approve' });
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3032/api/v2/coalesce/r1/gate/g1/decide',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('preview() calls POST /api/v2/coalesce/preview', async () => {
      fetchMock.mockResolvedValue(mockResponse({ preview: true }));
      await client.coalesce.preview({ scope: 'all' });
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3032/api/v2/coalesce/preview',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  // --- AgentContextAPI Client Tests ---

  describe('agentContext namespace', () => {
    it('list() calls GET /api/v2/agents/contexts', async () => {
      fetchMock.mockResolvedValue(mockResponse({ contexts: {} }));
      const result = await client.agentContext.list();
      expect(result.contexts).toEqual({});
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3032/api/v2/agents/contexts',
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('get() calls GET /api/v2/agents/:id/context', async () => {
      fetchMock.mockResolvedValue(mockResponse({
        agent_id: 'a1',
        context: { agent_id: 'a1', current_tool: 'Read' },
        recent_tool_calls: [],
      }));
      const result = await client.agentContext.get('a1');
      expect(result.agent_id).toBe('a1');
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3032/api/v2/agents/a1/context',
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('events() calls GET /api/v2/agents/:id/context/events', async () => {
      fetchMock.mockResolvedValue(mockResponse({ agent_id: 'a1', events: [], count: 0 }));
      const result = await client.agentContext.events('a1');
      expect(result.count).toBe(0);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3032/api/v2/agents/a1/context/events',
        expect.objectContaining({ method: 'GET' }),
      );
    });
  });

  // --- Extended UpmAPI Gate Tests ---

  describe('upm gate endpoints', () => {
    it('createGate() calls POST /api/v2/upm/gate', async () => {
      fetchMock.mockResolvedValue(mockResponse({ gate_id: 'g1', decision: 'approved' }));
      const result = await client.upm.createGate({ question: 'Deploy?' });
      expect(result.gate_id).toBe('g1');
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3032/api/v2/upm/gate',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('listGates() calls GET /api/v2/upm/gates', async () => {
      fetchMock.mockResolvedValue(mockResponse({ gates: [], pending_count: 0 }));
      const result = await client.upm.listGates();
      expect(result.gates).toEqual([]);
    });

    it('getGate() calls GET /api/v2/upm/gate/:id', async () => {
      fetchMock.mockResolvedValue(mockResponse({ gate_id: 'g1', status: 'pending' }));
      await client.upm.getGate('g1');
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3032/api/v2/upm/gate/g1',
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('approveGate() calls POST /api/v2/upm/gate/:id/approve', async () => {
      fetchMock.mockResolvedValue(mockResponse({ ok: true }));
      await client.upm.approveGate('g1');
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3032/api/v2/upm/gate/g1/approve',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('rejectGate() calls POST /api/v2/upm/gate/:id/reject', async () => {
      fetchMock.mockResolvedValue(mockResponse({ ok: true }));
      await client.upm.rejectGate('g1', 'Not ready');
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3032/api/v2/upm/gate/g1/reject',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  // --- Extended ApprovalsAPI Tests ---

  describe('approvals extended endpoints', () => {
    it('history() calls GET /api/v2/approvals/history', async () => {
      fetchMock.mockResolvedValue(mockResponse({ entries: [], total: 0, next_cursor: null }));
      const result = await client.approvals.history();
      expect(result.entries).toEqual([]);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3032/api/v2/approvals/history',
        expect.objectContaining({ method: 'GET' }),
      );
    });

    it('logAudit() calls POST /api/v2/approvals/log', async () => {
      const entry = {
        tool_name: 'Bash',
        agent_id: 'a1',
        decision: 'approved' as const,
        method: 'api' as const,
        timestamp: '2026-04-18T12:00:00Z',
      };
      fetchMock.mockResolvedValue(mockResponse({ ...entry, id: 'audit_1' }));
      const result = await client.approvals.logAudit(entry);
      expect(result.id).toBe('audit_1');
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:3032/api/v2/approvals/log',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  // --- Client Constructor Tests ---

  describe('client constructor', () => {
    it('exposes auth namespace', () => {
      expect(client.auth).toBeDefined();
      expect(typeof client.auth.authorize).toBe('function');
      expect(typeof client.auth.listTools).toBe('function');
      expect(typeof client.auth.redact).toBe('function');
    });

    it('exposes coalesce namespace', () => {
      expect(client.coalesce).toBeDefined();
      expect(typeof client.coalesce.start).toBe('function');
      expect(typeof client.coalesce.gateDecide).toBe('function');
    });

    it('exposes agentContext namespace', () => {
      expect(client.agentContext).toBeDefined();
      expect(typeof client.agentContext.list).toBe('function');
      expect(typeof client.agentContext.get).toBe('function');
      expect(typeof client.agentContext.events).toBe('function');
    });

    it('exposes extended upm gate methods', () => {
      expect(typeof client.upm.createGate).toBe('function');
      expect(typeof client.upm.listGates).toBe('function');
      expect(typeof client.upm.approveGate).toBe('function');
    });

    it('exposes extended approvals methods', () => {
      expect(typeof client.approvals.history).toBe('function');
      expect(typeof client.approvals.logAudit).toBe('function');
    });
  });
});
