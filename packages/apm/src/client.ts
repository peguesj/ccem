import { buildUrl } from './utils/url.js';
import { retry } from './utils/retry.js';
import type { RetryOptions } from './utils/retry.js';
import { SSEStream } from './streams/sse.js';
import type { SSEStreamOptions } from './streams/sse.js';
import type { PaginatedResponse, PaginationParams } from './types/common.js';
import type {
  Agent, AgentRegisterPayload, AgentUpdatePayload, AgentDiscoverResult,
} from './types/agent.js';
import type { Session } from './types/session.js';
import type { Notification, NotificationPayload } from './types/notification.js';
import type { RalphData, RalphFlowchart } from './types/ralph.js';
import type { SlashCommand, RegisterCommandPayload } from './types/command.js';
import type {
  BackgroundTask, CreateTaskPayload, UpdateTaskPayload,
  InputRequest, SyncTasksPayload, RequestInputPayload, RespondInputPayload,
} from './types/task.js';
import type {
  Skill, SkillRegistry, SkillAuditResult, TrackSkillPayload,
} from './types/skill.js';
import type { Project, PlaneUpdate, ProjectUpdatePayload } from './types/project.js';
import type {
  UpmExecution, UpmRegisterPayload, UpmEventPayload, UpmAgentPayload,
} from './types/upm.js';
import type {
  Port, PortScanResult, PortAssignPayload, PortClash, PortSetPrimaryPayload,
} from './types/port.js';
import type { Environment, ExecResult, ExecPayload } from './types/environment.js';
import type {
  FleetMetrics, AgentMetrics, AgentMetricsParams,
  SLO, Alert, AlertRule, AlertListParams, CreateAlertRulePayload,
} from './types/metrics.js';
import type { TelemetryResponse } from './types/telemetry.js';
import type { AuditEntry, AuditListParams } from './types/audit.js';
import type {
  Formation, CreateFormationPayload,
  Workflow, CreateWorkflowPayload, UpdateWorkflowPayload,
  VerifyResult, DoubleVerifyPayload,
} from './types/formation.js';
import type {
  AgUiEvent, AgUiState, AgUiRouterStats, AgUiDiagnostics, MigrationStatus,
  EmitAgUiEventPayload, AgUiStreamParams,
} from './types/ag-ui.js';
import type { ToolCall, ToolCallStats, ToolCallListParams } from './types/tool-call.js';
import type {
  GenerativeUIComponent, CreateGenerativeUIPayload, UpdateGenerativeUIPayload,
} from './types/generative-ui.js';
import type { Approval, ApprovalRequest } from './types/approval.js';
import type { ChatMessage, SendMessagePayload } from './types/chat.js';
import type {
  A2AEnvelope, A2AStats, A2ASendPayload, A2AAckPayload,
  A2ABroadcastPayload, A2AFanOutPayload,
} from './types/a2a.js';
import type { IntakeEvent, IntakeWatcher, IntakeSubmitPayload } from './types/intake.js';
import type {
  ReloadResult, ExportParams, ImportResult,
} from './types/config.js';

/** APMClient configuration options */
export interface APMClientOptions {
  /** Base URL of the APM server (default: "http://localhost:3032") */
  baseUrl?: string;
  /** Default retry options for all requests */
  retry?: RetryOptions;
  /** Default headers to include with every request */
  headers?: Record<string, string>;
  /** Default request timeout in milliseconds */
  timeout?: number;
}

/**
 * Client SDK for the CCEM APM server REST API.
 *
 * Provides a namespace-based API for all APM endpoints.
 *
 * @example
 * ```typescript
 * const apm = new APMClient({ baseUrl: 'http://localhost:3032' });
 * const agents = await apm.agents.list();
 * ```
 */
export class APMClient {
  private baseUrl: string;
  private retryOptions: RetryOptions;
  private defaultHeaders: Record<string, string>;
  private timeout: number | undefined;

  /** Health check endpoints */
  readonly health: HealthAPI;
  /** Agent management endpoints */
  readonly agents: AgentsAPI;
  /** Session management endpoints */
  readonly sessions: SessionsAPI;
  /** Notification endpoints */
  readonly notifications: NotificationsAPI;
  /** Data endpoints */
  readonly data: DataAPI;
  /** Ralph fix loop endpoints */
  readonly ralph: RalphAPI;
  /** Slash command endpoints */
  readonly commands: CommandsAPI;
  /** Task and input management endpoints */
  readonly tasks: TasksAPI;
  /** Skill tracking and registry endpoints */
  readonly skills: SkillsAPI;
  /** Project management endpoints */
  readonly projects: ProjectsAPI;
  /** UPM (Unified Project Management) endpoints */
  readonly upm: UpmAPI;
  /** Port management endpoints */
  readonly ports: PortsAPI;
  /** Environment management endpoints */
  readonly environments: EnvironmentsAPI;
  /** Server configuration endpoints */
  readonly config: ConfigAPI;
  /** Fleet and agent metrics endpoints */
  readonly metrics: MetricsAPI;
  /** SLO endpoints */
  readonly slos: SlosAPI;
  /** Alert endpoints */
  readonly alerts: AlertsAPI;
  /** Audit log endpoints */
  readonly audit: AuditAPI;
  /** Formation management endpoints */
  readonly formations: FormationsAPI;
  /** Workflow management endpoints */
  readonly workflows: WorkflowsAPI;
  /** Double verification endpoints */
  readonly verify: VerifyAPI;
  /** AG-UI protocol endpoints */
  readonly agUi: AgUiAPI;
  /** Tool call tracking endpoints */
  readonly toolCalls: ToolCallsAPI;
  /** Generative UI endpoints */
  readonly generativeUi: GenerativeUiAPI;
  /** Approval workflow endpoints */
  readonly approvals: ApprovalsAPI;
  /** Chat endpoints */
  readonly chat: ChatAPI;
  /** Agent-to-agent communication endpoints */
  readonly a2a: A2aAPI;
  /** Intake event endpoints */
  readonly intake: IntakeAPI;
  /** Hook deployment endpoints */
  readonly hooks: HooksAPI;
  /** Project scanner endpoints */
  readonly scanner: ScannerAPI;

  constructor(options: APMClientOptions = {}) {
    this.baseUrl = (options.baseUrl ?? 'http://localhost:3032').replace(/\/+$/, '');
    this.retryOptions = options.retry ?? {};
    this.defaultHeaders = options.headers ?? {};
    this.timeout = options.timeout;

    this.health = new HealthAPI(this);
    this.agents = new AgentsAPI(this);
    this.sessions = new SessionsAPI(this);
    this.notifications = new NotificationsAPI(this);
    this.data = new DataAPI(this);
    this.ralph = new RalphAPI(this);
    this.commands = new CommandsAPI(this);
    this.tasks = new TasksAPI(this);
    this.skills = new SkillsAPI(this);
    this.projects = new ProjectsAPI(this);
    this.upm = new UpmAPI(this);
    this.ports = new PortsAPI(this);
    this.environments = new EnvironmentsAPI(this);
    this.config = new ConfigAPI(this);
    this.metrics = new MetricsAPI(this);
    this.slos = new SlosAPI(this);
    this.alerts = new AlertsAPI(this);
    this.audit = new AuditAPI(this);
    this.formations = new FormationsAPI(this);
    this.workflows = new WorkflowsAPI(this);
    this.verify = new VerifyAPI(this);
    this.agUi = new AgUiAPI(this);
    this.toolCalls = new ToolCallsAPI(this);
    this.generativeUi = new GenerativeUiAPI(this);
    this.approvals = new ApprovalsAPI(this);
    this.chat = new ChatAPI(this);
    this.a2a = new A2aAPI(this);
    this.intake = new IntakeAPI(this);
    this.hooks = new HooksAPI(this);
    this.scanner = new ScannerAPI(this);
  }

  /** Make a GET request */
  async get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    const url = buildUrl(this.baseUrl, path, params);
    return retry(async () => {
      const controller = this.createAbortController();
      const response = await fetch(url, {
        method: 'GET',
        headers: { ...this.defaultHeaders, Accept: 'application/json' },
        signal: controller?.signal,
      });
      return this.handleResponse<T>(response);
    }, this.retryOptions);
  }

  /** Make a POST request */
  async post<T>(path: string, body?: unknown): Promise<T> {
    const url = buildUrl(this.baseUrl, path);
    return retry(async () => {
      const controller = this.createAbortController();
      const response = await fetch(url, {
        method: 'POST',
        headers: { ...this.defaultHeaders, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller?.signal,
      });
      return this.handleResponse<T>(response);
    }, this.retryOptions);
  }

  /** Make a PATCH request */
  async patch<T>(path: string, body?: unknown): Promise<T> {
    const url = buildUrl(this.baseUrl, path);
    return retry(async () => {
      const controller = this.createAbortController();
      const response = await fetch(url, {
        method: 'PATCH',
        headers: { ...this.defaultHeaders, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller?.signal,
      });
      return this.handleResponse<T>(response);
    }, this.retryOptions);
  }

  /** Make a PUT request */
  async put<T>(path: string, body?: unknown): Promise<T> {
    const url = buildUrl(this.baseUrl, path);
    return retry(async () => {
      const controller = this.createAbortController();
      const response = await fetch(url, {
        method: 'PUT',
        headers: { ...this.defaultHeaders, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller?.signal,
      });
      return this.handleResponse<T>(response);
    }, this.retryOptions);
  }

  /** Make a DELETE request */
  async delete<T>(path: string): Promise<T> {
    const url = buildUrl(this.baseUrl, path);
    return retry(async () => {
      const controller = this.createAbortController();
      const response = await fetch(url, {
        method: 'DELETE',
        headers: { ...this.defaultHeaders, Accept: 'application/json' },
        signal: controller?.signal,
      });
      return this.handleResponse<T>(response);
    }, this.retryOptions);
  }

  /** Create an SSE stream for a given path */
  createSSEStream(path: string, options?: SSEStreamOptions): SSEStream {
    const url = buildUrl(this.baseUrl, path);
    return new SSEStream(url, {
      headers: this.defaultHeaders,
      ...options,
    });
  }

  private createAbortController(): AbortController | undefined {
    if (!this.timeout) return undefined;
    const controller = new AbortController();
    setTimeout(() => controller.abort(), this.timeout);
    return controller;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorBody: string;
      try {
        errorBody = await response.text();
      } catch {
        errorBody = response.statusText;
      }
      throw new APMClientError(
        `APM API error: ${response.status} ${response.statusText}`,
        response.status,
        errorBody,
      );
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return response.json() as Promise<T>;
    }

    return response.text() as unknown as T;
  }
}

/** Error thrown by APMClient for non-2xx responses */
export class APMClientError extends Error {
  /** HTTP status code */
  readonly status: number;
  /** Response body text */
  readonly body: string;

  constructor(message: string, status: number, body: string) {
    super(message);
    this.name = 'APMClientError';
    this.status = status;
    this.body = body;
  }
}

// --- Namespace API classes ---

class HealthAPI {
  constructor(private client: APMClient) {}

  /** Check server health */
  async check(): Promise<Record<string, unknown>> {
    return this.client.get('/health');
  }

  /** Get server status */
  async status(): Promise<Record<string, unknown>> {
    return this.client.get('/api/status');
  }
}

class AgentsAPI {
  constructor(private client: APMClient) {}

  /** List all agents (v1) */
  async list(): Promise<Agent[]> {
    return this.client.get('/api/agents');
  }

  /** List agents with pagination (v2) */
  async listV2(params?: PaginationParams): Promise<PaginatedResponse<Agent>> {
    return this.client.get('/api/v2/agents', params as Record<string, string | number | boolean | undefined>);
  }

  /** Get a specific agent by ID */
  async get(id: string): Promise<Agent> {
    return this.client.get(`/api/v2/agents/${encodeURIComponent(id)}`);
  }

  /** Register a new agent */
  async register(payload: AgentRegisterPayload): Promise<Agent> {
    return this.client.post('/api/register', payload);
  }

  /** Send a heartbeat for an agent */
  async heartbeat(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this.client.post('/api/heartbeat', payload);
  }

  /** Discover available agents */
  async discover(): Promise<AgentDiscoverResult> {
    return this.client.get('/api/agents/discover');
  }

  /** Control an agent (connect, disconnect, restart) */
  async control(id: string, action: string): Promise<Record<string, unknown>> {
    return this.client.post(`/api/v2/agents/${encodeURIComponent(id)}/control`, { action });
  }
}

class SessionsAPI {
  constructor(private client: APMClient) {}

  /** List sessions with optional pagination */
  async list(params?: PaginationParams): Promise<PaginatedResponse<Session>> {
    return this.client.get('/api/v2/sessions', params as Record<string, string | number | boolean | undefined>);
  }
}

class NotificationsAPI {
  constructor(private client: APMClient) {}

  /** List all notifications */
  async list(): Promise<Notification[]> {
    return this.client.get('/api/notifications');
  }

  /** Add a new notification */
  async add(payload: NotificationPayload): Promise<Notification> {
    return this.client.post('/api/notify', payload);
  }

  /** Mark all notifications as read */
  async readAll(): Promise<Record<string, unknown>> {
    return this.client.post('/api/notifications/read-all');
  }
}

class DataAPI {
  constructor(private client: APMClient) {}

  /** Get aggregated APM data */
  async get(): Promise<Record<string, unknown>> {
    return this.client.get('/api/data');
  }
}

class RalphAPI {
  constructor(private client: APMClient) {}

  /** Get Ralph fix loop data */
  async get(): Promise<RalphData> {
    return this.client.get('/api/ralph');
  }

  /** Get Ralph flowchart visualization */
  async flowchart(): Promise<RalphFlowchart> {
    return this.client.get('/api/ralph/flowchart');
  }
}

class CommandsAPI {
  constructor(private client: APMClient) {}

  /** List registered slash commands */
  async list(): Promise<SlashCommand[]> {
    return this.client.get('/api/commands');
  }

  /** Register a new slash command */
  async register(payload: RegisterCommandPayload): Promise<SlashCommand> {
    return this.client.post('/api/commands', payload);
  }
}

class TasksAPI {
  constructor(private client: APMClient) {}

  /** List background tasks */
  async listBg(): Promise<BackgroundTask[]> {
    return this.client.get('/api/bg-tasks');
  }

  /** Get a specific background task */
  async getBg(id: string): Promise<BackgroundTask> {
    return this.client.get(`/api/bg-tasks/${encodeURIComponent(id)}`);
  }

  /** Create a new background task */
  async createBg(payload: CreateTaskPayload): Promise<BackgroundTask> {
    return this.client.post('/api/bg-tasks', payload);
  }

  /** Update a background task */
  async updateBg(id: string, payload: UpdateTaskPayload): Promise<BackgroundTask> {
    return this.client.patch(`/api/bg-tasks/${encodeURIComponent(id)}`, payload);
  }

  /** Stop a running background task */
  async stopBg(id: string): Promise<Record<string, unknown>> {
    return this.client.post(`/api/bg-tasks/${encodeURIComponent(id)}/stop`);
  }

  /** Delete a background task */
  async deleteBg(id: string): Promise<Record<string, unknown>> {
    return this.client.delete(`/api/bg-tasks/${encodeURIComponent(id)}`);
  }

  /** Get logs for a background task */
  async getBgLogs(id: string): Promise<{ logs: string }> {
    return this.client.get(`/api/bg-tasks/${encodeURIComponent(id)}/logs`);
  }

  /** Sync tasks from Claude Code */
  async syncTasks(payload: SyncTasksPayload): Promise<Record<string, unknown>> {
    return this.client.post('/api/tasks/sync', payload);
  }

  /** Get pending input requests */
  async pendingInput(): Promise<InputRequest[]> {
    return this.client.get('/api/input/pending');
  }

  /** Request input from the user */
  async requestInput(payload: RequestInputPayload): Promise<InputRequest> {
    return this.client.post('/api/input/request', payload);
  }

  /** Respond to an input request */
  async respondInput(payload: RespondInputPayload): Promise<InputRequest> {
    return this.client.post('/api/input/respond', payload);
  }
}

class SkillsAPI {
  constructor(private client: APMClient) {}

  /** List tracked skill invocations */
  async list(): Promise<Skill[]> {
    return this.client.get('/api/skills');
  }

  /** Track a skill invocation */
  async track(payload: TrackSkillPayload): Promise<Record<string, unknown>> {
    return this.client.post('/api/skills/track', payload);
  }

  /** Get the skills registry */
  async registry(): Promise<SkillRegistry[]> {
    return this.client.get('/api/skills/registry');
  }

  /** Run a full skill audit */
  async audit(): Promise<SkillAuditResult> {
    return this.client.post('/api/skills/audit');
  }

  /** Get health score for a specific skill */
  async health(name: string): Promise<{ health_score: number }> {
    return this.client.get(`/api/skills/${encodeURIComponent(name)}/health`);
  }

  /** Get details for a specific skill */
  async get(name: string): Promise<SkillRegistry> {
    return this.client.get(`/api/skills/${encodeURIComponent(name)}`);
  }
}

class ProjectsAPI {
  constructor(private client: APMClient) {}

  /** List tracked projects */
  async list(): Promise<Project[]> {
    return this.client.get('/api/projects');
  }

  /** Update a project */
  async update(payload: ProjectUpdatePayload): Promise<Project> {
    return this.client.patch('/api/projects', payload);
  }

  /** Update a Plane project */
  async updatePlane(payload: PlaneUpdate): Promise<Record<string, unknown>> {
    return this.client.post('/api/plane/update', payload);
  }
}

class UpmAPI {
  constructor(private client: APMClient) {}

  /** Register a UPM execution */
  async register(payload: UpmRegisterPayload): Promise<UpmExecution> {
    return this.client.post('/api/upm/register', payload);
  }

  /** Send a UPM event */
  async event(payload: UpmEventPayload): Promise<Record<string, unknown>> {
    return this.client.post('/api/upm/event', payload);
  }

  /** Register a UPM agent */
  async agent(payload: UpmAgentPayload): Promise<Record<string, unknown>> {
    return this.client.post('/api/upm/agent', payload);
  }

  /** Get UPM status */
  async status(): Promise<Record<string, unknown>> {
    return this.client.get('/api/upm/status');
  }
}

class PortsAPI {
  constructor(private client: APMClient) {}

  /** List tracked ports */
  async list(): Promise<Port[]> {
    return this.client.get('/api/ports');
  }

  /** Scan for active ports */
  async scan(): Promise<PortScanResult> {
    return this.client.post('/api/ports/scan');
  }

  /** Assign a port to a service */
  async assign(payload: PortAssignPayload): Promise<Port> {
    return this.client.post('/api/ports/assign', payload);
  }

  /** Get port clashes */
  async clashes(): Promise<PortClash[]> {
    return this.client.get('/api/ports/clashes');
  }

  /** Set a primary port for a service */
  async setPrimary(payload: PortSetPrimaryPayload): Promise<Record<string, unknown>> {
    return this.client.post('/api/ports/set-primary', payload);
  }
}

class EnvironmentsAPI {
  constructor(private client: APMClient) {}

  /** List managed environments */
  async list(): Promise<Environment[]> {
    return this.client.get('/api/environments');
  }

  /** Get a specific environment */
  async get(name: string): Promise<Environment> {
    return this.client.get(`/api/environments/${encodeURIComponent(name)}`);
  }

  /** Execute a command in an environment */
  async exec(name: string, payload: ExecPayload): Promise<ExecResult> {
    return this.client.post(`/api/environments/${encodeURIComponent(name)}/exec`, payload);
  }

  /** Start a session in an environment */
  async startSession(name: string): Promise<Record<string, unknown>> {
    return this.client.post(`/api/environments/${encodeURIComponent(name)}/session/start`);
  }

  /** Stop a session in an environment */
  async stopSession(name: string): Promise<Record<string, unknown>> {
    return this.client.post(`/api/environments/${encodeURIComponent(name)}/session/stop`);
  }
}

class ConfigAPI {
  constructor(private client: APMClient) {}

  /** Reload server configuration */
  async reload(): Promise<ReloadResult> {
    return this.client.post('/api/config/reload');
  }

  /** Get the OpenAPI specification */
  async openapi(): Promise<Record<string, unknown>> {
    return this.client.get('/api/v2/openapi.json');
  }

  /** Export data */
  async export(params?: ExportParams): Promise<unknown> {
    const queryParams: Record<string, string | number | boolean | undefined> = params
      ? { format: params.format, from: params.from, to: params.to }
      : undefined as unknown as Record<string, string | number | boolean | undefined>;
    return this.client.get('/api/v2/export', queryParams);
  }

  /** Import data */
  async import(data: unknown): Promise<ImportResult> {
    return this.client.post('/api/v2/import', data);
  }
}

class MetricsAPI {
  constructor(private client: APMClient) {}

  /** Get fleet-wide metrics */
  async fleet(): Promise<FleetMetrics> {
    return this.client.get('/api/v2/metrics');
  }

  /** Get metrics for a specific agent */
  async agent(agentId: string, params?: AgentMetricsParams): Promise<AgentMetrics> {
    return this.client.get(
      `/api/v2/metrics/${encodeURIComponent(agentId)}`,
      params as Record<string, string | number | boolean | undefined>,
    );
  }

  /** Get telemetry data */
  async telemetry(): Promise<TelemetryResponse> {
    return this.client.get('/api/telemetry');
  }
}

class SlosAPI {
  constructor(private client: APMClient) {}

  /** List all SLOs */
  async list(): Promise<SLO[]> {
    return this.client.get('/api/v2/slos');
  }

  /** Get a specific SLO by name */
  async get(name: string): Promise<SLO> {
    return this.client.get(`/api/v2/slos/${encodeURIComponent(name)}`);
  }
}

class AlertsAPI {
  constructor(private client: APMClient) {}

  /** List alerts with optional filters */
  async list(params?: AlertListParams): Promise<Alert[]> {
    return this.client.get('/api/v2/alerts', params as Record<string, string | number | boolean | undefined>);
  }

  /** List alert rules */
  async rules(): Promise<AlertRule[]> {
    return this.client.get('/api/v2/alerts/rules');
  }

  /** Create a new alert rule */
  async createRule(payload: CreateAlertRulePayload): Promise<AlertRule> {
    return this.client.post('/api/v2/alerts/rules', payload);
  }
}

class AuditAPI {
  constructor(private client: APMClient) {}

  /** List audit entries with optional filters */
  async list(params?: AuditListParams): Promise<AuditEntry[]> {
    return this.client.get('/api/v2/audit', params as Record<string, string | number | boolean | undefined>);
  }
}

class FormationsAPI {
  constructor(private client: APMClient) {}

  /** List all formations */
  async list(): Promise<Formation[]> {
    return this.client.get('/api/v2/formations');
  }

  /** Create a new formation */
  async create(payload: CreateFormationPayload): Promise<Formation> {
    return this.client.post('/api/v2/formations', payload);
  }

  /** Get a specific formation */
  async get(id: string): Promise<Formation> {
    return this.client.get(`/api/v2/formations/${encodeURIComponent(id)}`);
  }

  /** Get agents in a formation */
  async agents(id: string): Promise<Agent[]> {
    return this.client.get(`/api/v2/formations/${encodeURIComponent(id)}/agents`);
  }

  /** Control a formation */
  async control(id: string, action: string): Promise<Record<string, unknown>> {
    return this.client.post(`/api/v2/formations/${encodeURIComponent(id)}/control`, { action });
  }

  /** Control a squadron within a formation */
  async controlSquadron(id: string, action: string): Promise<Record<string, unknown>> {
    return this.client.post(`/api/v2/squadrons/${encodeURIComponent(id)}/control`, { action });
  }
}

class WorkflowsAPI {
  constructor(private client: APMClient) {}

  /** List all workflows */
  async list(): Promise<Workflow[]> {
    return this.client.get('/api/v2/workflows');
  }

  /** Create a new workflow */
  async create(payload: CreateWorkflowPayload): Promise<Workflow> {
    return this.client.post('/api/v2/workflows', payload);
  }

  /** Get a specific workflow */
  async get(id: string): Promise<Workflow> {
    return this.client.get(`/api/v2/workflows/${encodeURIComponent(id)}`);
  }

  /** Update a workflow */
  async update(id: string, payload: UpdateWorkflowPayload): Promise<Workflow> {
    return this.client.patch(`/api/v2/workflows/${encodeURIComponent(id)}`, payload);
  }
}

class VerifyAPI {
  constructor(private client: APMClient) {}

  /** Request double verification */
  async double(payload: DoubleVerifyPayload): Promise<VerifyResult> {
    return this.client.post('/api/v2/verify/double', payload);
  }

  /** Get verification status */
  async status(id: string): Promise<VerifyResult> {
    return this.client.get(`/api/v2/verify/${encodeURIComponent(id)}`);
  }
}

class AgUiAPI {
  constructor(private client: APMClient) {}

  /** Emit an AG-UI event */
  async emit(event: EmitAgUiEventPayload): Promise<AgUiEvent> {
    return this.client.post('/api/v2/ag-ui/emit', event);
  }

  /** Stream AG-UI events via SSE */
  streamEvents(params?: AgUiStreamParams & SSEStreamOptions): SSEStream {
    const queryParams: Record<string, string> = {};
    if (params?.types) queryParams['types'] = params.types.join(',');
    if (params?.last_event_id) queryParams['last_event_id'] = params.last_event_id;

    const queryString = Object.keys(queryParams).length
      ? '?' + new URLSearchParams(queryParams).toString()
      : '';

    return this.client.createSSEStream(`/api/v2/ag-ui/events${queryString}`, params);
  }

  /** Stream events for a specific agent via SSE */
  streamAgentEvents(agentId: string, options?: SSEStreamOptions): SSEStream {
    return this.client.createSSEStream(
      `/api/v2/ag-ui/events/${encodeURIComponent(agentId)}`,
      options,
    );
  }

  /** Get AG-UI state for an agent */
  async getState(agentId: string): Promise<AgUiState> {
    return this.client.get(`/api/v2/ag-ui/state/${encodeURIComponent(agentId)}`);
  }

  /** Set AG-UI state for an agent */
  async setState(agentId: string, state: Record<string, unknown>): Promise<AgUiState> {
    return this.client.put(`/api/v2/ag-ui/state/${encodeURIComponent(agentId)}`, state);
  }

  /** Patch AG-UI state for an agent */
  async patchState(agentId: string, patch: Record<string, unknown>): Promise<AgUiState> {
    return this.client.patch(`/api/v2/ag-ui/state/${encodeURIComponent(agentId)}`, patch);
  }

  /** Get event router statistics */
  async routerStats(): Promise<AgUiRouterStats> {
    return this.client.get('/api/v2/ag-ui/router/stats');
  }

  /** Get AG-UI diagnostics */
  async diagnostics(): Promise<AgUiDiagnostics> {
    return this.client.get('/api/v2/ag-ui/diagnostics');
  }

  /** Get AG-UI migration status */
  async migration(): Promise<MigrationStatus> {
    return this.client.get('/api/v2/ag-ui/migration');
  }
}

class ToolCallsAPI {
  constructor(private client: APMClient) {}

  /** List tool calls with optional filters */
  async list(params?: ToolCallListParams): Promise<ToolCall[]> {
    return this.client.get('/api/v2/tool-calls', params as Record<string, string | number | boolean | undefined>);
  }

  /** Get aggregated tool call statistics */
  async stats(): Promise<ToolCallStats> {
    return this.client.get('/api/v2/tool-calls/stats');
  }

  /** Stream tool calls via SSE */
  stream(options?: SSEStreamOptions): SSEStream {
    return this.client.createSSEStream('/api/v2/tool-calls/stream', options);
  }

  /** Get tool calls for a specific agent */
  async byAgent(agentId: string): Promise<ToolCall[]> {
    return this.client.get(`/api/v2/tool-calls/agent/${encodeURIComponent(agentId)}`);
  }

  /** Get a specific tool call */
  async get(id: string): Promise<ToolCall> {
    return this.client.get(`/api/v2/tool-calls/${encodeURIComponent(id)}`);
  }
}

class GenerativeUiAPI {
  constructor(private client: APMClient) {}

  /** List generative UI components */
  async list(): Promise<GenerativeUIComponent[]> {
    return this.client.get('/api/v2/generative-ui/components');
  }

  /** Create a generative UI component */
  async create(payload: CreateGenerativeUIPayload): Promise<GenerativeUIComponent> {
    return this.client.post('/api/v2/generative-ui/components', payload);
  }

  /** Get a specific generative UI component */
  async get(id: string): Promise<GenerativeUIComponent> {
    return this.client.get(`/api/v2/generative-ui/components/${encodeURIComponent(id)}`);
  }

  /** Update a generative UI component */
  async update(id: string, payload: UpdateGenerativeUIPayload): Promise<GenerativeUIComponent> {
    return this.client.put(`/api/v2/generative-ui/components/${encodeURIComponent(id)}`, payload);
  }

  /** Delete a generative UI component */
  async delete(id: string): Promise<Record<string, unknown>> {
    return this.client.delete(`/api/v2/generative-ui/components/${encodeURIComponent(id)}`);
  }
}

class ApprovalsAPI {
  constructor(private client: APMClient) {}

  /** List all approvals */
  async list(): Promise<Approval[]> {
    return this.client.get('/api/v2/approvals');
  }

  /** Get a specific approval */
  async get(id: string): Promise<Approval> {
    return this.client.get(`/api/v2/approvals/${encodeURIComponent(id)}`);
  }

  /** Request a new approval */
  async request(payload: ApprovalRequest): Promise<Approval> {
    return this.client.post('/api/v2/approvals/request', payload);
  }

  /** Approve an approval request */
  async approve(id: string): Promise<Approval> {
    return this.client.post(`/api/v2/approvals/${encodeURIComponent(id)}/approve`);
  }

  /** Reject an approval request */
  async reject(id: string, reason?: string): Promise<Approval> {
    return this.client.post(`/api/v2/approvals/${encodeURIComponent(id)}/reject`, reason ? { reason } : undefined);
  }
}

class ChatAPI {
  constructor(private client: APMClient) {}

  /** Get messages for a chat scope */
  async messages(scope: string): Promise<ChatMessage[]> {
    return this.client.get(`/api/v2/chat/${encodeURIComponent(scope)}`);
  }

  /** Send a message to a chat scope */
  async send(scope: string, payload: SendMessagePayload): Promise<ChatMessage> {
    return this.client.post(`/api/v2/chat/${encodeURIComponent(scope)}/send`, payload);
  }

  /** Clear all messages in a chat scope */
  async clear(scope: string): Promise<Record<string, unknown>> {
    return this.client.delete(`/api/v2/chat/${encodeURIComponent(scope)}`);
  }
}

class A2aAPI {
  constructor(private client: APMClient) {}

  /** Send an A2A message */
  async send(envelope: A2ASendPayload): Promise<A2AEnvelope> {
    return this.client.post('/api/v2/a2a/send', envelope);
  }

  /** Get messages for an agent */
  async messages(agentId: string): Promise<A2AEnvelope[]> {
    return this.client.get(`/api/v2/a2a/messages/${encodeURIComponent(agentId)}`);
  }

  /** Acknowledge an A2A message */
  async ack(payload: A2AAckPayload): Promise<Record<string, unknown>> {
    return this.client.post('/api/v2/a2a/ack', payload);
  }

  /** Get A2A communication statistics */
  async stats(): Promise<A2AStats> {
    return this.client.get('/api/v2/a2a/stats');
  }

  /** Get A2A message history for an agent */
  async history(agentId: string): Promise<A2AEnvelope[]> {
    return this.client.get(`/api/v2/a2a/history/${encodeURIComponent(agentId)}`);
  }

  /** Broadcast an A2A message to all agents */
  async broadcast(payload: A2ABroadcastPayload): Promise<Record<string, unknown>> {
    return this.client.post('/api/v2/a2a/broadcast', payload);
  }

  /** Fan out an A2A message to specific agents */
  async fanOut(payload: A2AFanOutPayload): Promise<Record<string, unknown>> {
    return this.client.post('/api/v2/a2a/fan-out', payload);
  }

  /** Stream A2A messages for an agent via SSE */
  stream(agentId: string, options?: SSEStreamOptions): SSEStream {
    return this.client.createSSEStream(
      `/api/v2/a2a/stream/${encodeURIComponent(agentId)}`,
      options,
    );
  }
}

class IntakeAPI {
  constructor(private client: APMClient) {}

  /** Submit an intake event */
  async submit(payload: IntakeSubmitPayload): Promise<IntakeEvent> {
    return this.client.post('/api/intake', payload);
  }

  /** List intake events */
  async list(): Promise<IntakeEvent[]> {
    return this.client.get('/api/intake');
  }

  /** List intake watchers */
  async watchers(): Promise<IntakeWatcher[]> {
    return this.client.get('/api/intake/watchers');
  }
}

class HooksAPI {
  constructor(private client: APMClient) {}

  /** Deploy hooks */
  async deploy(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this.client.post('/api/hooks/deploy', payload);
  }
}

class ScannerAPI {
  constructor(private client: APMClient) {}

  /** Trigger a project scan */
  async scan(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    return this.client.post('/api/scanner/scan', payload);
  }

  /** Get scanner results */
  async results(): Promise<Record<string, unknown>> {
    return this.client.get('/api/scanner/results');
  }

  /** Get scanner status */
  async status(): Promise<Record<string, unknown>> {
    return this.client.get('/api/scanner/status');
  }
}
