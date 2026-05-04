# CCEM Project Memory

## Authorship & Identifiers

- **Author**: Jeremiah Pegues
- **Organization Domain**: `pegues.io`
- **Reverse-DNS Identifier Prefix**: `io.pegues.agent-j.labs`
- **launchd Labels**:
  - APM Server: `io.pegues.agent-j.labs.ccem.apm-server`
  - CCEMHelper: `io.pegues.agent-j.labs.ccem.helper`
- **Use this prefix** for all launchd plists, bundle identifiers, and reverse-DNS identifiers across CCEM and related projects.

## APM Server Lifecycle Rules

**ALWAYS start CCEMHelper alongside the APM server.** When running `mix phx.server`, ALWAYS also launch CCEMHelper immediately after:
```bash
# Start APM
cd ~/Developer/ccem/apm-v4
nohup mix phx.server > /Volumes/DDRV902/logs/apm_server.log 2>&1 &
echo $! > .apm.pid

# Start CCEMHelper immediately after - MANDATORY
open -a CCEMHelper
```

**When rebuilding CCEMHelper**, ALWAYS run `swift build` from `~/Developer/ccem/CCEMHelper/` and then relaunch:
```bash
cd ~/Developer/ccem/CCEMHelper
swift build -c release
open -a CCEMHelper
```

**When updating CCEM or CCEM APM source:**
1. Rebuild CCEMHelper: `cd ~/Developer/ccem/CCEMHelper && swift build -c release`
2. Relaunch: `open -a CCEMHelper`
3. Restart APM if server-side changes: kill + restart `mix phx.server`

**Formation agent registration rule:** Every formation agent MUST register with APM on spawn using fire-and-forget curl to `/api/register` with full `upm_context` metadata. No exceptions -- this applies to orchestrators, squadron leads, swarm agents, cluster agents, and individual leaf agents. Pattern:
```bash
curl -s -X POST http://localhost:3032/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "<agent_id>",
    "project": "<project>",
    "role": "<formation_role>",
    "status": "active",
    "formation_id": "<formation_id>",
    "formation_role": "<orchestrator|squadron_lead|swarm_agent|cluster_agent|individual>",
    "parent_agent_id": "<parent_agent_id>",
    "wave": <wave_number>,
    "task_subject": "<task description>",
    "session_id": "<session_id>"
  }' >/dev/null 2>&1 &
```

**Force kill APM when stalled:**
```bash
lsof -ti:3032 | xargs kill -9 2>/dev/null
pkill -9 -f "mix phx.server"
```

## Key Paths

| Resource | Path |
|----------|------|
| APM server | `~/Developer/ccem/apm-v4/` |
| APM PID | `~/Developer/ccem/apm-v4/.apm.pid` |
| APM log | `/Volumes/DDRV902/logs/apm_server.log` |
| APM config | `~/Developer/ccem/apm/apm_config.json` |
| CCEMHelper source | `~/Developer/ccem/CCEMHelper/` |
| ccem-apm skill | `~/.claude/skills/ccem-apm/SKILL.md` |
| ccem-apm command | `~/.claude/commands/ccem-apm.md` |
| Showcase skill | `~/.claude/skills/showcase/` |
| Showcase viewer | `~/.claude/skills/showcase/client/index.html` |

## Plane Project

- **Project Name**: CCEM - Claude Code Environment Manager
- **Project ID**: `a20e1d2e-3139-406e-ae03-dc6d1d8cb995`
- **Identifier**: `CCEM`
- **Workspace**: `lgtm`
- **URL**: `https://plane.lgtm.build/lgtm/projects/a20e1d2e-3139-406e-ae03-dc6d1d8cb995/`
- **API Base**: `https://plane.lgtm.build/api/v1/workspaces/lgtm/projects/a20e1d2e-3139-406e-ae03-dc6d1d8cb995/`
- **API Key**: `~/Developer/plane/.claude/claude-code-helper-remote-plane-api-pat.csv`
- **Auth Header**: `X-Api-Key: plane_api_73588ec6f1c34e09b389b8565b7b63c9`
- **States**:
  - Backlog: `111ce4ff-eef9-4622-93e5-ff65d95dc77e`
  - Todo: `8904905c-0b3f-4f97-ab5c-e22747134d77`
  - In Progress: `0d7e0c82-f974-4678-856b-64fd6e993fab`
  - Done: `9bab16dd-4834-4a2a-a00c-3f25516535e1`
  - Cancelled: `80645a72-1150-4fc1-af9c-b1e85c30cd86`

## Related Plane Projects

### AG-UI Elixir SDK (AGUI)
- **Project ID**: `3e16b3ea-6aa8-46c2-8517-b130f6743236`
- **URL**: `https://plane.lgtm.build/lgtm/projects/3e16b3ea-6aa8-46c2-8517-b130f6743236/`
- **Path**: `~/Developer/ag-ui-elixir/ag_ui/`
- **Description**: Port of AG-UI protocol to Phoenix/Elixir (community SDK)

### CCEM APM v5 — AG-UI Integration (CCEM5)
- **Project ID**: `a898419a-b097-496f-994a-c4a8ea54904c`
- **URL**: `https://plane.lgtm.build/lgtm/projects/a898419a-b097-496f-994a-c4a8ea54904c/`
- **Description**: Major version upgrade integrating AG-UI protocol into CCEM APM
- **Status**: 86 issues, all Done. Archival/read-only — no new issues should be created here.
- **Scope boundary**: CCEM5 tracks AG-UI v5 protocol design (EventBus, A2A, Generative UI, State Sync, ToolCallTracker, npm @ccem packages). Features that landed in production are tracked in CCEM main. CCEM5 remains as the design-phase record.
- **Cross-references**: CCEM5 EP-01/EventBus -> CCEM-159/161/213/289; CCEM5 EP-07/ApprovalGate -> CCEM-290/300/306/334; CCEM5 EP-02/Lifecycle -> CCEM-289/293; CCEM5 v5.1.0 -> CCEM-157.
- **Authoritative tracker**: CCEM main (a20e1d2e) is the single source of truth for all active work. CCEM5 is historical reference only.

## OpenAPI Endpoints

Both serve the full 103+ path OpenAPI 3.0.3 spec:
- `GET http://localhost:3032/api/v2/openapi.json` (canonical)
- `GET http://localhost:3032/api/openapi.json` (v1 alias)

## Current Version: v9.1.1


## Implementation Checkpoints

### Wave 1: Descriptors & Context Foundation (Independent — 2 worktrees parallel)
- [x] **CP-56**: Agent descriptor mapping in AgentLockConfig (US-321)
- [x] **CP-57**: Execution context payload schema and integration (US-322)
- After Wave 1: `mix compile --warnings-as-errors` required

### Wave 2: Modal Grouping & UX (depends on Wave 1)
- [x] **CP-58**: Notification grouping with ApprovalQueue debouncing (US-323)
- [x] **CP-59**: ApprovalModal titlebar, keyboard shortcuts, dismiss control (US-324)
- After Wave 2: `mix compile --warnings-as-errors` required

### Wave 3: CCEMHelper, Audit, Docs & Tests (depends on Wave 2)
- [x] **CP-60**: CCEMHelper grouped approval UI with focus management (US-325)
- [x] **CP-61**: ApprovalAuditLog GenServer and APM dashboard audit view (US-326)
- [x] **CP-62**: OpenAPI spec update and AgentLock documentation (US-327)
- [x] **CP-63**: Integration tests for full approval workflow (US-328)
- After Wave 3: `mix compile --warnings-as-errors` ✓ AND `swift build -c release` ✓ required

**Previous checkpoint records (v4.1.0–v8.10.0)** are stored in [checkpoints.md](checkpoints.md) for historical reference.

---

## Security Native Types Feature (v9.1.0) — ccem_security_native_types

### Wave 1: Hook expansion (Python, standalone)
- [x] **CP-64**: Expand `security_reminder_hook.py` — Bash command injection + advisory patterns (US-329)
- [x] **CP-65**: Add WebFetch/WebSearch SSRF detection — block on IMDS/schemes, advisory on private ranges (US-330)
- [x] **CP-66**: Add Agent/Skill prompt injection advisory detection (US-331)
- [x] **CP-67**: Update `hooks.json` matcher to `Edit|Write|MultiEdit|Bash|WebFetch|WebSearch|Agent|Skill` (US-331)
- All copies synced: `claude-code-plugins/1.0.0`, `claude-plugins-official/104d39be10b7`, `claude-plugins-official/unknown`

### Wave 2: Elixir APM backend (depends on Wave 1)
- [x] **CP-68**: Add `:security` as first-class `plugin_scope` atom to `PluginBehaviour` (US-332)
- [x] **CP-69**: Create `ApmV5.Plugins.Security.SecurityGuidancePlugin` with 4 actions + dashboard widget (US-332)
- After Wave 2: `mix compile --warnings-as-errors` ✓

### Wave 3: Tests (depends on Wave 2)
- [x] **CP-70**: 41-test suite for `SecurityGuidancePlugin` — contract, endpoints, all actions, nav, widgets (US-333)
- After Wave 3: `mix test test/apm_v5/plugins/security/` ✓ (41/41)

---

## Hooks Max-Payload Upgrade v9.0.0 — apm_hooks_max_payload

### Wave 1: Identity & Base Payload (4 stories, independent)
- [x] **CP-71**: Hook version headers v7→v9 across all 9 hooks (US-334)
- [x] **CP-72**: Max-payload: session_id + project + working_dir in all hook payloads (US-335)
- [x] **CP-73**: Max-payload: git_branch resolution in pre/post tool hooks (US-336)
- [x] **CP-74**: Agent identity resolution chain in agentlock hooks (US-337)
- After Wave 1: all hooks emit v9 payloads with identity + context fields ✓

### Wave 2: Detection & Enrichment (4 stories, depends on Wave 1)
- [x] **CP-75**: Memory write detection in pre/post tool hooks (US-338)
- [x] **CP-76**: Skill invocation tracking in pre/post tool hooks (US-339)
- [x] **CP-77**: Pattern heartbeat emission every 10 tool calls (US-340)
- [x] **CP-78**: Expanded tool mapping + context enrichment in agentlock_context (US-341)
- After Wave 2: memory writes, skill invocations, and patterns tracked in APM ✓

### Wave 3: Audit & Cleanup (2 stories, depends on Wave 2)
- [x] **CP-79**: Notification audit trail in agentlock_post_tool (US-342)
- [x] **CP-80**: Session end summary with tool count and cleanup (US-343)
- After Wave 3: full audit trail and session lifecycle complete ✓

---

## Coalesce v9.1.1 Skill Sync — coalesce_v911_skill_sync

### Wave 1: Core APM Skills (4 stories, independent)
- [x] **CP-81**: Coalesce: ccem-apm + apm — version refs + endpoint table (US-344)
- [x] **CP-82**: Coalesce: apm-api-reference — OpenAPI alignment (US-345)
- [x] **CP-83**: Coalesce: apm-auth + apm-telemetry — agent identity + telemetry (US-346)
- [x] **CP-84**: Coalesce: formation + orchestrator — telemetry enrichment (US-347)
- After Wave 1: core APM skills reference v9.1.1 max-payload ✓

### Wave 2: Dependent Skills (5 stories, depends on Wave 1)
- [x] **CP-85**: Coalesce: upm — hook telemetry alignment (US-348)
- [x] **CP-86**: Coalesce: ralph + ship — pipeline awareness (US-349)
- [x] **CP-87**: Coalesce: coalesce + doctor + elixir-architect — meta sync (US-350)
- [x] **CP-88**: Coalesce: conversation-mgmt + live-all — notification pipeline (US-351)
- [x] **CP-89**: Coalesce: showcase + idea + dev-vs-prod — peripheral sync (US-352)
- After Wave 2: all dependent skills aligned to v9.1.1 ✓

### Wave 3: Validation & Finalize (3 stories, depends on Wave 2)
- [x] **CP-90**: Coalesce: safesecret + apm-usage — security + usage (US-353)
- [x] **CP-91**: Coalesce: double-verify — regression + frontmatter validation (US-354)
- [x] **CP-92**: Coalesce: CLAUDE.md + SkillsRegistry cache refresh (US-355)
- After Wave 3: all skills validated, cache refreshed, coalesce_applied emitted ✓

---

## Dashboard Widgetization Engine — dashboard_widgetization_engine

### Wave 1: Schema & Backend GenServers (4 stories, independent)
- [x] **CP-93**: Widget config schema — add editable, pinnable, supported_scopes, default_config, display_order to WidgetRegistry (US-356)
- [x] **CP-94**: LayoutStore — add save_widget_config, get_widget_config, set_pinned_widget, get_pinned_widget with PubSub broadcasts (US-357)
- [x] **CP-95**: WidgetConfigStore GenServer — ETS-backed per-session widget config and pinned state (US-358)
- [x] **CP-96**: DashboardScopeEngine GenServer — pin/unpin scope source, broadcast scope to dashboard:scope PubSub topic (US-359)
- After Wave 1: `mix compile --warnings-as-errors` ✓

### Wave 2: LiveView Components & DashboardLive Scope Wiring (4 stories, depends on Wave 1)
- [x] **CP-97**: DashboardLive — subscribe to dashboard:scope PubSub, handle :scope_changed, wire scope assigns (US-360)
- [x] **CP-98**: WidgetEditPanelComponent LiveComponent — inline config editor with dynamic config_schema fields (US-361)
- [x] **CP-99**: WidgetContainerComponent LiveComponent — title bar with edit/pin controls, WidgetResize integration (US-362)
- [x] **CP-100**: DashboardGridComponent LiveComponent — CSS Grid 12-col layout from LayoutStore placements, drag handle affordance (US-363)
- After Wave 2: `mix compile --warnings-as-errors` ✓

### Wave 3: Frontend, Context Pin, Projects Widget, API & DashboardLive Wiring (5 stories, parallel where independent)
- [x] **CP-101**: ContextPinDrillDownComponent — collapsible user/project split panel, subscribes to scope PubSub (US-364)
- [x] **CP-102**: ProjectsWidget LiveComponent — projects list with Select-to-scope, pinnable=true, registered in WidgetRegistry (US-365)
- [x] **CP-103**: DashboardGrid JS hook — native HTML5 drag-reorder, pushEvent layout_reorder, registered in app.js (US-366)
- [x] **CP-104**: DashboardLive — wire WidgetContainerComponent, DashboardGridComponent, all edit/pin/layout event handlers (US-367)
- [x] **CP-105**: API endpoints — GET /api/v2/widgets, PATCH config, GET/POST /api/v2/dashboard/layout, POST /api/v2/dashboard/pin (US-368)
- After Wave 3: `mix compile --warnings-as-errors` ✓

### Wave 4: Integration Tests (depends on Wave 3)
- [x] **CP-106**: Integration tests — WidgetConfigStore, DashboardScopeEngine PubSub, LayoutStore, WidgetRegistry, DashboardLive LiveView, API (US-369)
- After Wave 4: `mix test --only widgetization` ✓ (43/43)

---

## @ccem/apm v3.0.0 Backfill — ccem_npm_backfill_v3

### Wave 1: New Types (4 stories, independent)
- [x] **CP-107**: Add auth types — AuthDecision, AuthSession, AuthTool Zod schemas (US-371)
- [x] **CP-108**: Add coalesce types — CoalesceRunSummary, Gate, GateDecision Zod schemas (US-372)
- [x] **CP-109**: Add agent-context and execution-context Zod schemas (US-373)
- [x] **CP-110**: Add widget types and expand approval types with v9.0.0 fields (US-374)
- After Wave 1: `npx tsc --noEmit` ✓

### Wave 2: New Client API Classes (4 stories, depend on Wave 1)
- [x] **CP-111**: Add AuthAPI class with 18 authorization endpoints (US-375)
- [x] **CP-112**: Add CoalesceAPI class with 8 coalesce endpoints (US-376)
- [x] **CP-113**: Add AgentContextAPI class with 3 context endpoints (US-377)
- [x] **CP-114**: Extend UpmAPI with 5 gate endpoints and ApprovalsAPI with history/audit (US-378)
- After Wave 2: `npx tsc --noEmit` ✓

### Wave 3: Integration, Tests, Version Bump (3 stories, depend on Wave 2)
- [x] **CP-115**: Update index.ts exports and client constructor for new API classes (US-379)
- [x] **CP-116**: Add vitest tests — 51 tests covering all new types and API methods (US-380)
- [x] **CP-117**: Version bump to 3.0.0, update package.json description (US-381)
- After Wave 3: `npm test` ✓ (128/128), `npm run build` ✓

### Wave 4: @ccem/core alignment (1 story)
- [x] **CP-118**: Update @ccem/core version to 5.0.0, align src/index.ts version tag (US-382)
- After Wave 4: `npx tsc --noEmit` ✓

---

## Orchestration System Type — orchestration_system_type

### Wave 1: Core Engine (4 stories, independent)
- [x] **CP-119**: Add :orchestration plugin_scope (US-389)
- [x] **CP-120**: OrchestrationManager GenServer with DAG engine (US-390)
- [x] **CP-121**: OrchestrationRunStore — run history + replay (US-391)
- [x] **CP-122**: Skill topology declaration protocol (US-392)
- After Wave 1: `mix compile --warnings-as-errors` ✓

### Wave 2: LiveView + API + Plugin (4 stories, depends on Wave 1)
- [x] **CP-123**: OrchestrationLive — /orchestration page with D3.js DAG (US-393)
- [x] **CP-124**: API endpoints — /api/v2/orchestrations CRUD + replay (US-394)
- [x] **CP-125**: Sidebar nav + orchestration widget (US-395)
- [x] **CP-126**: OrchestrationPlugin — PluginBehaviour implementation (US-396)
- After Wave 2: `mix compile --warnings-as-errors` ✓

### Wave 3: Skill Integrations (7 stories, parallel)
- [x] **CP-127**: formation topology declaration (US-397)
- [x] **CP-128**: upm topology declaration (US-398)
- [x] **CP-129**: ralph topology declaration (US-399)
- [x] **CP-130**: orchestrator topology declaration (US-400)
- [x] **CP-131**: feature-dev + deploy:agents + fleet topologies (US-401-403)
- After Wave 3: `mix compile --warnings-as-errors` ✓

### Wave 4: Tests + Ship (3 stories, depends on Wave 3)
- [x] **CP-132**: Integration tests (US-404)
- [x] **CP-133**: Skill topology tests (US-405)
- [x] **CP-134**: Final gate + ship (US-406)
- After Wave 4: `mix test --only orchestration` ✓ (69/69)

---

## Claude-Mem APM Plugin — claude_mem_apm_plugin

### Wave 1: Scope & Infrastructure GenServers (3 stories, independent)
- [x] **CP-135**: Add :memory plugin_scope atom to PluginBehaviour (US-410)
- [x] **CP-136**: MemoryClientBridge GenServer — claude-mem worker HTTP + SQLite fallback (US-411)
- [x] **CP-137**: ObservationCache ETS store — TTL, LRU eviction, PubSub (US-412)
- After Wave 1: `mix compile --warnings-as-errors` ✓

### Wave 2: Plugin Core, LiveView & Correlator (3 stories, depends on Wave 1)
- [x] **CP-138**: MemoryPlugin — PluginBehaviour with 5 actions, nav, widget, supervisor children (US-413)
- [x] **CP-139**: MemoryLive — /memory page with Browse, Search, Timeline tabs (US-414)
- [x] **CP-140**: ConversationMemoryCorrelator — observation-session linking (US-415)
- After Wave 2: `mix compile --warnings-as-errors` ✓

### Wave 3: Detail Panel, Dashboard Widget & API (3 stories, depends on Wave 2)
- [x] **CP-141**: MemoryLive observation detail panel with correlation (US-416)
- [x] **CP-142**: Dashboard widget — observation summary, health indicator (US-417)
- [x] **CP-143**: REST API — /api/v2/memory/* 5 endpoints (US-418)
- After Wave 3: `mix compile --warnings-as-errors` ✓

### Wave 4: Cross-Reference, Nav, Integration Upgrade (3 stories, depends on Wave 3)
- [x] **CP-144**: ConversationMonitorLive Memory tab + MemoryLive Sessions section (US-419)
- [x] **CP-145**: Sidebar nav + OpenAPI spec update (US-420)
- [x] **CP-146**: ClaudeMemIntegration delegation to MemoryPlugin (US-421)
- After Wave 4: `mix compile --warnings-as-errors` ✓

### Wave 5: Tests & Final Gate (2 stories, depends on Wave 4)
- [x] **CP-147**: Integration tests — plugin, bridge, cache, correlator, API (US-422)
- [x] **CP-148**: Final compile gate + manual verification (US-423)
- After Wave 5: `mix test --only memory` ✓ AND `mix compile --warnings-as-errors` ✓

---

## Testmaxxing Formation v2 Integration — testmaxxing_formation_v2

### Wave 1: Edge Types, Channel Schema, Agent Metadata (3 stories, independent)
- [x] **CP-149**: Add edge_type to D3 formation graph edges (US-424)
- [x] **CP-150**: Add channel field to notification schema and API (US-425)
- [x] **CP-154**: Agent registration accepts publishes/subscribes/exports/imports metadata (US-429)
- After Wave 1: `mix compile --warnings-as-errors` required

### Wave 2: Tree Builder, DOT Endpoint, Filters, Template, Legend (5 stories, depends on Wave 1)
- [x] **CP-151**: Add pub/sub channel edges to formation tree builder (US-426)
- [x] **CP-152**: DOT graph rendering endpoint and FormationLive tab (US-427)
- [x] **CP-153**: Notification panel channel filter (US-428)
- [x] **CP-155**: Testmaxxing formation template in UpmStore (US-430)
- [x] **CP-156**: FormationLive legend for edge types (US-431)
- After Wave 2: `mix compile --warnings-as-errors` required

### Wave 3: Tests & Final Gate (2 stories, depends on Wave 2)
- [x] **CP-157**: Integration tests — typed edges, channel notifications, DOT endpoint (US-432)
- [x] **CP-158**: Final compile gate and LILY-554 closure (US-433)
- After Wave 3: `mix test --only testmaxxing` ✓ AND `mix compile --warnings-as-errors` ✓

---

## CCEM APM Full Redesign — ccem_apm_redesign (v9.2.0)

**Branch**: `ralph/ccem-apm-redesign` | **Input**: Claude Design handoff `CCEM APM (1).zip`
**Worktree**: `.claude/worktrees/ccem-apm-redesign`
**Formation**: `fmt-20260504-ccem-redesign` | **UPM Session**: `upm-ccem-apm-redesign-20260504`

### Wave 1: Design System Foundation — Tokens + Primitives + Scaffolding (8 stories, independent)
- [x] **CP-159**: DS: tokens.css → Phoenix CSS layer + Geist fonts (US-434)
- [x] **CP-160**: DS: Button LiveComponent (5 variants × 4 sizes) (US-435)
- [x] **CP-161**: DS: Badge + Dot primitives (7 tones, presence animation) (US-436)
- [x] **CP-162**: DS: Input + Kbd chip primitives (US-437)
- [x] **CP-163**: DS: Card + Stat tile + Table primitives (US-438)
- [x] **CP-164**: DS: Segmented control + Toggle primitives (US-439)
- [x] **CP-165**: DS: Scaffolding — Sidebar nav (10 groups, collapsible) (US-440)
- [x] **CP-166**: DS: Scaffolding — Top bar (project switcher, ⌘K trigger, presence) (US-441)
- After Wave 1: `mix compile --warnings-as-errors` required

### Wave 2: AI-Native Components + Layout Shell + DS TDD (8 stories, depends on Wave 1)
- [x] **CP-167**: DS AI: Sparkline + Bars (live 60-point window, animated trailing dot) (US-442)
- [x] **CP-168**: DS AI: StreamingText + Skeleton shimmer (US-443)
- [x] **CP-169**: DS AI: Waveform + Gauge LiveComponents (US-444)
- [x] **CP-170**: DS AI: AgentCard LiveComponent (identicon, sparkline, skill badges) (US-445)
- [x] **CP-171**: DS AI: CommandBar ⌘K (global, focus trap, groups, AI streaming) (US-446)
- [x] **CP-172**: DS AI: GraphNode + Edge (D3.js, animated live edges, PubSub 3s TTL) (US-447)
- [x] **CP-173**: DS AI: Presence stack + Right inspector panel scaffolding (US-448)
- [x] **CP-174**: DS: Motion constants, scanline, page layout shell + DS TDD suite (US-449)
- After Wave 2: `mix compile --warnings-as-errors` required AND `mix test --only design_system` ✓

### Wave 3: Observe Primary + Authorization v9 (4 stories, depends on Wave 2)
- [x] **CP-175**: Observe: Dashboard LiveView (6-up metrics, formation graph, fleet table) (US-450)
- [x] **CP-176**: Observe: Fleet LiveView (agent grid/list, AgentCard, filter rail) (US-451)
- [x] **CP-177**: Observe: Session Detail LiveView (JSONL viewer, tool call trace) (US-452)
- [x] **CP-178**: Govern: Authorization v9 LiveView (20s TTL countdown, policy rules) (US-453)
- After Wave 3: `mix compile --warnings-as-errors` required

### Wave 4: Observe Secondary + TDD (5 stories, depends on Wave 3)
- [ ] **CP-179**: Observe: Formations LiveView (tree + matrix + list + dot layout modes) (US-454)
- [ ] **CP-180**: Observe: Timeline LiveView (swim-lane, 15m→24h window) (US-455)
- [ ] **CP-181**: Observe: Conversations LiveView (live transcript, CoWork split) (US-456)
- [ ] **CP-182**: Observe: Tool Calls + A2A + Architecture LiveViews (US-457)
- [ ] **CP-183**: Observe Wave 3 TDD suite (Dashboard, Fleet, Session Detail, Auth v9) (US-458)
- After Wave 4: `mix compile --warnings-as-errors` required AND `mix test --only observe_wave3` ✓

### Wave 5: Measure Section (3 stories, parallel with Wave 6, depends on Wave 2)
- [ ] **CP-184**: Measure: Analytics + Usage + Health LiveViews (US-459)
- [ ] **CP-185**: Measure: Ports + Tasks + Actions + Scanner LiveViews (US-460)
- [ ] **CP-186**: Measure: UAT + DRTW LiveViews (US-461)
- After Wave 5: `mix compile --warnings-as-errors` required

### Wave 6: Intelligence Section (3 stories, parallel with Wave 5, depends on Wave 2)
- [ ] **CP-187**: Intelligence: Skills + Skill Drift LiveViews (US-462)
- [ ] **CP-188**: Intelligence: Library + Memory LiveViews (US-463)
- [ ] **CP-189**: Intelligence: Orchestration + Intake + Alignment LiveViews (US-464)
- After Wave 6: `mix compile --warnings-as-errors` required

### Wave 7: Govern Remaining + TDD (2 stories, depends on Wave 3)
- [ ] **CP-190**: Govern: Approvals + Routing + Coalesce + UPM LiveViews (US-465)
- [ ] **CP-191**: Govern + Intelligence TDD suite (US-466)
- After Wave 7: `mix compile --warnings-as-errors` required AND `mix test --only govern_intelligence` ✓

### Wave 8: Extend Section (2 stories, depends on Wave 2)
- [ ] **CP-192**: Extend: Plugins + Integrations + AG-UI + Notifications LiveViews (US-467)
- [ ] **CP-193**: Extend: Showcase + Docs LiveViews (US-468)
- After Wave 8: `mix compile --warnings-as-errors` required

### Wave 9: Platform + AI Platform + Final Gate (5 stories, depends on all above)
- [ ] **CP-194**: Platform: Architecture + DRTW + UAT LiveViews (US-469)
- [ ] **CP-195**: AI Platform: LVM Integration LiveView (Claude model cards) (US-470)
- [ ] **CP-196**: AI Platform: Claude Code Discovery + Ralph Plugin LiveViews (US-471)
- [ ] **CP-197**: AI Platform: AG-UI Plugin + Authorization v9 deep page (US-472)
- [ ] **CP-198**: Final: Extend + Platform + AI Platform TDD suite + v9.2.0 compile gate (US-473)
- After Wave 9: `mix test --only platform` ✓ AND `mix compile --warnings-as-errors` ✓ AND version → v9.2.0

---

## Claude Code Harness Plugin — claude_harness_plugin (v9.1.2)

**Branch**: `ralph/harness-plugin` | **Worktree**: main working tree
**Worktree ID**: `wt_e0fd7a08e1adf8de` | **apm-v4 commit**: `68bc331`

### Wave 1: Core GenServers + Plugin + LiveView + API (all independent, deployed in parallel)
- [x] **CP-199**: HarnessPlugin (`:ccem` scope) + HarnessMonitor GenServer (15s session.json poll, PubSub `"harness:state"`) + HookTelemetryBuffer ETS ring buffer (500 cap, subscribes `"apm:hooks"`)
- [x] **CP-200**: HarnessLive at `/plugins/harness` — 3-tab (health/hooks/session), PubSub-subscribed, graceful dead-process handling
- [x] **CP-201**: HarnessController at `/api/v2/harness/*` — 5 endpoints (health, hooks, session, plans, settings) with 503 on dead GenServer

### Wave 2: Integration Wiring (depends on Wave 1, all in single pass)
- [x] **CP-202**: plugin_registry @default_plugins + application.ex supervision + router LiveView + API routes + hook_registry harness hooks + dashboard_live.ex tone helpers fix
- After Wave 2: `mix compile --warnings-as-errors` ✓ (0 errors, 68bc331)
