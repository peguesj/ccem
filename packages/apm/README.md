# @agent-j/apm

[![npm](https://img.shields.io/badge/npm-3.1.0-blue.svg)](https://www.npmjs.com/package/@agent-j/apm)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

TypeScript client SDK for the CCEM APM v9.1.2 server REST API.

## Install

```bash
npm i @agent-j/apm@latest
```

## What's new in 3.1.0

- **HarnessAPI** (`client.harness.*`) — Claude Code Harness plugin telemetry: hook event ring buffer, session.json polling, plans, settings (`/api/v2/harness/*`)
- **OrchestrationAPI** (`client.orchestration.*`) — DAG-based orchestration runs with 6 types (pipeline, workflow, maintenance, sync, formation, autonomous), replay support (`/api/v2/orchestrations/*`)
- **MemoryAPI** (`client.memory.*`) — claude-mem integration: observations, semantic search, timeline, stats (`/api/v2/memory/*`)
- **WidgetsAPI** (`client.widgets.*`) — pinnable dashboard widgets, per-session config, 12-col grid layout (`/api/v2/widgets`, `/api/v2/dashboard/{layout,pin}`)
- Hook max-payload v9.1.1 types — `HookTelemetry` now includes `session_id`, `project`, `working_dir`, `git_branch`, memory write detection, skill invocation tracking, and pattern heartbeat fields

## Quickstart

```typescript
import { APMClient } from '@agent-j/apm';

const apm = new APMClient({ baseUrl: 'http://localhost:3032' });

// Query Claude Code Harness health
const health = await apm.harness.health();
console.log(health.status, health.monitor_alive);

// List recent hook telemetry events
const hooks = await apm.harness.hooks();
hooks.events.forEach(e => console.log(e.hook, e.tool, e.ts));

// Search memory observations
const results = await apm.memory.search({ q: 'auth flow', limit: 10 });
results.observations.forEach(o => console.log(o.content));
```

## API surface

| Namespace | Description |
|---|---|
| `client.agents` | Agent registration, fleet list, heartbeat, discover |
| `client.sessions` | Session list (paginated) |
| `client.harness` | Harness health, hook telemetry buffer, session snapshot, plans, settings |
| `client.orchestration` | Orchestration runs (CRUD + replay), 6 run types |
| `client.memory` | Memory observations, semantic search, timeline, health stats |
| `client.widgets` | Widget registry, per-session config, dashboard layout, pin |
| `client.auth` | 3-layer AgentLock auth (PolicyEngine → AuthorizationGate → TokenStore), 18 endpoints |
| `client.approvals` | Approval workflow, history, audit log |
| `client.coalesce` | Skill sync runs, gates, preview, apply, diff |
| `client.agentContext` | Execution context payloads, per-agent context events |
| `client.formations` | Formation CRUD, agent membership, squadron control |
| `client.upm` | UPM registration, events, agents, blocking gates |
| `client.metrics` | Fleet metrics, per-agent metrics, SLOs, alerts |
| `client.audit` | Audit log (paginated, filterable) |
| `client.notifications` | Notification list, add, mark-read |
| `client.agUi` | AG-UI SSE stream, state management (RFC 6902 patch) |
| `client.toolCalls` | Tool call list, stats, SSE stream |
| `client.a2a` | Agent-to-agent messaging, broadcast, fan-out |
| `client.ralph` | Ralph fix loop data, flowchart |
| `client.skills` | Skill registry, tracking, audit |
| `client.projects` | Project list, update, Plane sync |
| `client.ports` | Port scan, assign, clash detection |
| `client.environments` | Environment exec, session start/stop |
| `client.config` | Config reload, OpenAPI spec, export/import |
| `client.health` | Health check, server status |

## Types

All Zod schemas and inferred TypeScript types are re-exported from `@agent-j/apm`:

| Schema | Type | Added |
|---|---|---|
| `HarnessHealthSchema` | `HarnessHealth` | 3.1.0 |
| `HarnessHookEventSchema` | `HarnessHookEvent` | 3.1.0 |
| `HarnessHooksResponseSchema` | `HarnessHooksResponse` | 3.1.0 |
| `HarnessSessionSchema` | `HarnessSession` | 3.1.0 |
| `HarnessPlanSchema` | `HarnessPlan` | 3.1.0 |
| `OrchestrationRunSchema` | `OrchestrationRun` | 3.1.0 |
| `OrchestrationStepSchema` | `OrchestrationStep` | 3.1.0 |
| `OrchestrationTypeSchema` | `OrchestrationType` | 3.1.0 |
| `WidgetSchema` | `Widget` | 3.0.0 |
| `WidgetConfigSchema` | `WidgetConfig` | 3.0.0 |
| `WidgetPlacementSchema` | `WidgetPlacement` | 3.0.0 |
| `LayoutPresetSchema` | `LayoutPreset` | 3.0.0 |
| `AuthDecisionSchema` | `AuthDecision` | 3.0.0 |
| `AuthSessionSchema` | `AuthSession` | 3.0.0 |
| `CoalesceRunSummarySchema` | `CoalesceRunSummary` | 3.0.0 |
| `GateSchema` | `Gate` | 3.0.0 |
| `AgentContextSchema` | `AgentContext` | 3.0.0 |
| `NotificationSchema` | `Notification` | <3.0.0 |
| `FormationSchema` | `Formation` | <3.0.0 |

For the full type listing see `src/types/index.ts`.

## Compatibility matrix

| APM server | @agent-j/apm | @ccem/core |
|---|---|---|
| v9.1.2 | **3.1.0** | **5.1.0** |
| v9.1.1 | 3.0.0 | 5.0.0 |
| v9.0.x | 2.x | 4.x |

## Examples

### Subscribe to AgentLock authorization events

```typescript
import { APMClient } from '@agent-j/apm';

const apm = new APMClient({ baseUrl: 'http://localhost:3032' });

const stream = apm.agUi.streamEvents({ types: ['tool_call_start', 'tool_call_end'] });
for await (const event of stream) {
  if (event.type === 'tool_call_start') {
    const decision = await apm.auth.authorize({
      agent_id: event.agent_id,
      tool: event.tool_name,
      input: event.input,
    });
    if (decision.decision === 'deny') {
      console.warn('blocked:', event.tool_name, decision.reason);
    }
  }
}
```

### Query orchestration runs

```typescript
const apm = new APMClient();

const runs = await apm.orchestration.list();
console.log(`${runs.total} runs, ${runs.running_count} active`);

const latest = runs.runs[0];
if (latest.status === 'failed') {
  const replayed = await apm.orchestration.replay(latest.id);
  console.log('replayed as', replayed.run_id);
}
```

### Search memory observations

```typescript
const apm = new APMClient();

const { observations } = await apm.memory.search({ q: 'agent registration', limit: 5 });
for (const obs of observations) {
  console.log(obs.id, obs.content.slice(0, 80));
}

const stats = await apm.memory.stats();
console.log('total observations:', stats.total_count);
```

### Pin a dashboard widget

```typescript
const apm = new APMClient();

const widgets = await apm.widgets.list();
const projectsWidget = widgets.find(w => w.name === 'projects');

await apm.widgets.pin({
  session_id: 'my-session',
  widget_id: projectsWidget.id,
});

await apm.widgets.saveLayout({
  session_id: 'my-session',
  placements: [
    { widget_id: projectsWidget.id, col: 1, row: 1, col_span: 4 },
  ],
});
```

## Changelog

### 3.1.0
- Add `HarnessAPI` with 5 endpoints (health, hooks, session, plans, settings)
- Add `OrchestrationAPI` with CRUD + replay, `OrchestrationRun`/`OrchestrationStep`/`OrchestrationType` Zod schemas
- Add `MemoryAPI` with observations, search, timeline, stats endpoints
- Add `MemoryObservation`, `MemorySearchResult`, `MemoryTimeline` types
- Update `HookTelemetry` for v9.1.1 max-payload fields (session_id, project, working_dir, git_branch, memory_writes, skill_invocations, pattern_heartbeat)

### 3.0.0
- Add `AuthAPI` (18 authorization endpoints), `CoalesceAPI`, `AgentContextAPI`
- Add `WidgetsAPI` with dashboard layout and pin endpoints
- New Zod schemas: `AuthDecision`, `AuthSession`, `AuthTool`, `CoalesceRunSummary`, `Gate`, `Widget`, `WidgetConfig`, `LayoutPreset`, `AgentContext`
- Extend `ApprovalsAPI` with history and audit log; extend `UpmAPI` with 5 gate endpoints
- Version bump to 3.0.0, 128 tests passing

## License

MIT — [Jeremiah Pegues](https://github.com/peguesj)
