# CCEM Implementation Checkpoints

This file contains the historical record of all implementation checkpoints for CCEM versions and features. This is a reference document for completed work and is not needed in every session.

## Implementation Checkpoints — ralph/upm-module-ccem-apm

### Wave 1: Foundation (Independent)
- [x] **CP-35**: UPM.ProjectRegistry GenServer + ETS + scan_and_sync (US-001)
- [x] **CP-36**: UPM.PMIntegrationStore + adapter_for/1 test_connection delegation (US-002)
- [x] **CP-37**: UPM.VCSIntegrationStore + sync_type enum (US-003)
- [x] **CP-38**: UPM.WorkItemStore + detect_drift/1 + detect_drift_all/0 (US-004)
- After Wave 1: `mix compile --warnings-as-errors` ✓ PASS

### Wave 2: Adapters + Sync (depends on Wave 1)
- [x] **CP-39**: PM Adapters — PMAdapter behaviour + Plane/Linear/Jira/Monday/MSProject (US-005, US-006)
- [x] **CP-40**: VCS Adapters — VCSAdapter behaviour + GitHub/AzureDevOps (US-007)
- [x] **CP-41**: UPM.SyncEngine GenServer — 5-min scheduled sync + drift detection (US-008)
- After Wave 2: `mix compile --warnings-as-errors` ✓ PASS

### Wave 3: REST + LiveView + CCEMHelper (depends on Wave 2)
- [x] **CP-42**: UpmController — 22 REST endpoints at /api/upm/* (US-009)
- [x] **CP-43**: Router — browser + API routes for UPM (US-009)
- [x] **CP-44**: UpmLive — /upm, /upm/:id, /upm/:id/board + Kanban board (US-010)
- [x] **CP-45**: UPM nav item added to all 19 LiveViews (US-010)
- [x] **CP-46**: CCEMHelper UPMMonitor + UPMModels + MenuBar UPM section (US-011)
- [x] **CP-47**: v4.1.0 CHANGELOG + mix.exs version bump (US-012)
- After Wave 3: `mix compile --warnings-as-errors` ✓ PASS | `swift build -c release` ✓ PASS

## Implementation Checkpoints — ralph/apm-v4-formation-ux-integration

### Wave 1: Foundation (Independent)
- [x] **CP-01**: Add live-integration-testing MCPs to CCEM project scope (US-001)
- [x] **CP-02**: SkillHookDeployer GenServer + hook deployment endpoint (US-002)
- [x] **CP-03**: WorkflowSchemaStore — unified ship/upm/ralph integration layer (US-003)
- [x] **CP-04**: AgentRegistry upgrade — explicit squadron/swarm/cluster hierarchy (US-004)
- [x] **CP-05**: FormationStore GenServer + /api/v2/formations REST endpoints (US-005)
- After Wave 1: `mix compile` must pass with 0 warnings ✓ PASS (EXIT:0)

### Wave 2: Integration (depends on Wave 1)
- [x] **CP-06**: OpenAPI spec update — formation endpoints + workflow schema components (US-006)
- [x] **CP-07**: dependency_graph.js — formation grouping + orthogonal elbow connectors (US-007)
- [x] **CP-08**: FormationLive fix — persist completed formations + deep-link from notifications (US-008)
- [x] **CP-09**: ShipIntegration API endpoints via WorkflowSchemaStore (US-009)
- [x] **CP-10**: Auto-start APM + hook deployment on agentic skill launch (US-010)
- After Wave 2: `mix compile` must pass; verify /formation?id=<id> deep-link works ✓ PASS (EXIT:0)

### Wave 3: UX + Integration Layer (depends on Wave 2)
- [x] **CP-11**: formation_graph.js redesign — squadron/swarm swim lanes (US-011)
- [x] **CP-12**: Dashboard layout refactor — sidebar nav + quadrant panels (US-012)
- [x] **CP-13**: Notification panel — tabbed categories + richer cards (US-013)
- [x] **CP-14**: double-verify endpoint — POST /api/v2/verify/double (US-014)
- [x] **CP-15**: deploy:agents-v2 APM hook support — wave tracking + toasts (US-015)
- [x] **CP-16**: Update ccem-apm SKILL.md + command reference (US-016)
- [x] **CP-17**: Bump to v2.4.0 — mix.exs, CHANGELOG, CCEMHelper rebuild (US-017)
- After Wave 3: `/upm verify` — integration tests against http://localhost:3032 ✓ PASS (compile EXIT:0)

## DRTW — Don't Reinvent The Wheel

This project enforces the DRTW principle via `~/.claude/skills/drtw/SKILL.md`.

Before implementing any new feature or utility in CCEM:
1. Check `package.json` (Node packages already installed)
2. Check `mix.exs` in `apm-v4/` (Elixir deps already installed)
3. Run `/drtw <description>` to discover existing solutions
4. Check https://www.aitmpl.com/skills for community skills
5. Only build custom after exhausting L1–L4

**For CCEM-specific patterns**:
- APM notifications: use existing `POST /api/notify` endpoint
- Agent heartbeats: use existing `POST /api/heartbeat` endpoint
- Formation tracking: use existing `POST /api/upm/register` endpoint
- Background tasks: use existing `BackgroundTasksStore` GenServer
- Project scanning: use existing `ProjectScanner` GenServer

**Hook integration**: DRTW discovery hook fires on Write/Edit operations
automatically from user-scope settings.json.

## Implementation Checkpoints — ralph/ccem-v2-5-expanded-features

### Wave 1: Foundation (Independent — 4 worktrees parallel)
- [x] **CP-18**: APMServerManager Swift service — start/stop APM (US-001) [WT: ccem-agent-ui]
- [x] **CP-19**: CCEMHelper telemetry models + APMClient.fetchTelemetry() (US-004) [WT: ccem-agent-ui]
- [x] **CP-20**: APM v4 GET /api/telemetry endpoint (US-006) [WT: ccem-agent-ui]
- [x] **CP-21**: APM v4 BackgroundTasksStore GenServer (US-007) [WT: ccem-claude-native]
- [x] **CP-22**: APM v4 ProjectScanner GenServer (US-011) [WT: apm-project-scanner]
- [x] **CP-23**: APM v4 ActionEngine GenServer (US-014) [WT: apm-actions]
- After Wave 1: `mix compile` must pass; `swift build` in CCEMHelper must pass

### Wave 2: Integration (depends on Wave 1)
- [x] **CP-24**: CCEMHelper MenuBarView — start APM button in disconnected state (US-002) [WT: ccem-agent-ui]
- [x] **CP-25**: CCEMHelper MenuBarView — telemetry usage chart (US-005) [WT: ccem-agent-ui]
- [x] **CP-26**: CCEMHelper background tasks section in MenuBarView (US-010) [WT: ccem-claude-native]
- [x] **CP-27**: APM v4 background tasks REST API endpoints (US-008) [WT: ccem-claude-native]
- [x] **CP-28**: APM v4 project scanner REST API endpoints (US-012) [WT: apm-project-scanner]
- [x] **CP-29**: APM v4 actions REST API endpoints (US-015) [WT: apm-actions]
- After Wave 2: `mix compile` must pass; `swift build` must pass

### Wave 3: UX + LiveViews (depends on Wave 2)
- [x] **CP-30**: CCEMHelper MenuBarView — consistent sections + Start/Stop APM (US-003) [WT: ccem-agent-ui]
- [x] **CP-31**: APM v4 TasksLive LiveView (US-009) [WT: ccem-claude-native]
- [x] **CP-32**: APM v4 ScannerLive LiveView (US-013) [WT: apm-project-scanner]
- [x] **CP-33**: APM v4 ActionsLive LiveView (US-016) [WT: apm-actions]
- After Wave 3: `mix compile` must pass; `swift build` must pass

### Wave 4: Release (depends on Wave 3)
- [x] **CP-34**: APM v4 bump to v2.5.0, CHANGELOG, OpenAPI spec (US-017) [WT: apm-actions]
- After Wave 4: merge all worktrees → main; `mix compile`; `swift build`

## Implementation Checkpoints — ralph/ccem-dynamic-apm-v4-2

### Wave 1: Foundation (Independent)
- [x] **CP-48**: SkillsRegistryStore GenServer — health scoring, ETS cache, list_skills/health_score (US-001)
- [x] **CP-49**: BackgroundTasksStore enhanced — agent_name/definition/invoking_process/log_path/runtime_ms + PubSub (US-002)
- [x] **CP-50**: ProjectScanner scan_claude_native/1 — hooks, MCPs, active ports, CLAUDE.md sections (US-003)
- After Wave 1: `mix compile --warnings-as-errors` ✓ PASS

### Wave 2: API (depends on Wave 1)
- [x] **CP-51**: SkillsController REST API — GET /api/skills/registry, /:name, /:name/health, POST /api/skills/audit (US-004)
- [x] **CP-52**: Enhanced Tasks API — GET /tasks/:id/logs, POST /tasks/:id/stop, PATCH /tasks/:id (US-005)
- [x] **CP-53**: ActionEngine skill-audit — fix_skill_frontmatter, complete_skill_description, add_skill_triggers, backfill_project_memory, update_hooks (US-006)
- After Wave 2: `mix compile --warnings-as-errors` ✓ PASS

### Wave 3: UI + Release (depends on Wave 2)
- [x] **CP-54**: SkillsLive health dashboard — three-tier health view, Audit All, Fix buttons, detail panel (US-007)
- [x] **CP-55**: CCEMHelper UI consistency pass — telemetry chart, task runtime/logs, Start/Stop APM (US-008)
- [x] **CP-56**: v4.2.0 CHANGELOG + mix.exs bump (US-009)
- After Wave 3: `mix compile --warnings-as-errors` ✓ PASS | `swift build -c release` ✓ PASS

## Implementation Checkpoints — ralph/ccem-v5-1-management-suite

### Wave 1: Foundation (Independent)
- [x] **CP-57**: GettingStartedWizard modal slideshow (US-009) [CCEM-152]
- [x] **CP-58**: Showcase SVG diagrams in wizard slides (US-010) [CCEM-153]
- [x] **CP-59**: TooltipOverlay JS hook — guided tour (US-011) [CCEM-154]
- [x] **CP-60**: Agent control REST endpoints (US-012) [CCEM-155]
- [x] **CP-61**: ChatStore GenServer — message persistence (US-013) [CCEM-156]
- After Wave 1: `mix compile --warnings-as-errors` PASS

### Wave 2: Interactive Inspector + CCEMHelper SSE (depends on Wave 1)
- [x] **CP-62**: InspectorChatLive — contextual AG-UI chat (US-001) [CCEM-144]
- [x] **CP-63**: AgentControlPanel — connect/disconnect/restart (US-002) [CCEM-145]
- [x] **CP-64**: SSE LiveView hook — inspector_chat.js (US-003) [CCEM-146]
- [x] **CP-65**: Scope breadcrumb navigation (US-004) [CCEM-147]
- [x] **CP-66**: APMClient v2 — configurable port + SSE (US-005) [CCEM-148]
- After Wave 2: `mix compile --warnings-as-errors` PASS + `swift build -c release` PASS

### Wave 3: CCEMHelper Management + Release (depends on Wave 2)
- [x] **CP-67**: Agent management actions in MenuBarView (US-006) [CCEM-149]
- [x] **CP-68**: CCEMHelper mini-chat view (US-007) [CCEM-150]
- [x] **CP-69**: Dynamic port config + multi-server (US-008) [CCEM-151]
- [x] **CP-70**: v5.1.0 bump — CHANGELOG, mix.exs, OpenAPI (US-014) [CCEM-157]
- After Wave 3: `mix compile --warnings-as-errors` PASS + `swift build -c release` PASS

## Showcase

- **Assets**: `~/Developer/ccem/showcase/` (project scope)
- **Client**: `showcase/client/` — pure SVG diagram engine, WCAG AA, anime.js animations
- **Data**: `showcase/data/` — design system, narratives, redaction rules, speaker notes
- **Skill**: `/showcase` at `~/.claude/skills/showcase/SKILL.md` (user-scope skill definition)
- **Dev Server**: `python3 -m http.server 8080` from `showcase/client/`

## Implementation Checkpoints — ralph/ccem-agui-hex-integration

### Wave 1: Foundation
- [x] **CP-87**: Add ag_ui_ex Hex dependency to mix.exs (US-001)
- After Wave 1: `mix compile --warnings-as-errors` ✓ PASS

### Wave 2: Core Module Updates (Independent)
- [x] **CP-88**: EventStream uses AgUi.Core.Events.EventType constants (US-002)
- [x] **CP-89**: HookBridge uses EventType constants (US-003)
- [x] **CP-90**: EventRouter uses compile-time module attributes from EventType (US-004)
- [x] **CP-91**: ChatStore uses EventType module attributes for pattern matching (US-005)
- After Wave 2: `mix compile --warnings-as-errors` ✓ PASS

### Wave 3: Controllers + LiveView (depends on Wave 2)
- [x] **CP-92**: AgUiController updated (US-006)
- [x] **CP-93**: AgUiV2Controller adds EventType.valid?/1 validation (US-007)
- [x] **CP-94**: AgUiLive uses EventType.all/0 for filter list (US-008)
- [x] **CP-95**: ApiController HookBridge integration verified (US-009)
- After Wave 3: `mix compile --warnings-as-errors` ✓ PASS

### Wave 4: Tests + Release (depends on Wave 3)
- [x] **CP-96**: Tests updated + ag_ui_ex integration tests (US-010)
- [x] **CP-97**: v5.3.0 release — CHANGELOG, version bump, docs (US-011)
- After Wave 4: `mix compile --warnings-as-errors` ✓ PASS | 13 tests, 0 failures

## Implementation Checkpoints — ralph/ccem-v6-0-0

### Wave 1: Performance + Foundation (Independent — 5 parallel)
- [x] **CP-98**: Fix WebSocket long-poll fallback causing 5-7s latency (US-001) [CCEM-169]
- [x] **CP-99**: Code-split app.js bundle — D3 lazy per route, mermaid on /docs (US-002) [CCEM-170]
- [x] **CP-100**: Scope showcase-styles.css to /showcase routes only (US-003) [CCEM-171]
- [x] **CP-101**: Dependency graph redesign — agentic hierarchy (Session→Formation→Squadron→Swarm→Agent→Task) (US-004) [CCEM-172]
- [x] **CP-102**: ShowcaseDataStore CCEM project path resolution (US-005) [CCEM-173]
- After Wave 1: `mix compile --warnings-as-errors` ✓ PASS

### Wave 2: Port Intelligence + CCEM UI (depends on Wave 1)
- [x] **CP-103**: ActionEngine port actions: register_all_ports + update_port_namespace (US-006) [CCEM-179]
- [x] **CP-104**: ActionEngine port actions: analyze_port_assignment + smart_reassign_ports (US-007) [CCEM-180]
- [x] **CP-105**: PortsLive intelligence dashboard — conflict viz + utilization heatmap (US-008) [CCEM-181]
- [x] **CP-106**: CCEM UI sidebar transformation — dual-section dynamic nav (US-009) [CCEM-182]
- [x] **CP-107**: CCEM UI dynamic header branding + /ccem overview route (US-010) [CCEM-183]
- [x] **CP-108**: Skills audit + update: ccem-apm, ccem, upm skill files (US-011) [CCEM-184]
- [x] **CP-109**: Memory leak validation: ShowcaseEngine global listener audit (US-012) [CCEM-185]
- After Wave 2: `mix compile --warnings-as-errors` ✓ PASS

### Wave 3: Docs + Release (depends on Wave 2)
- [x] **CP-110**: Update /docs LiveView: showcase + port management + CCEM UI sections (US-013) [CCEM-186]
- [x] **CP-111**: Add @moduledoc/@doc/@spec to all v6.0.0 new modules (US-014) [CCEM-187]
- [x] **CP-112**: Update OpenAPI 3.0.3 spec for v6.0.0 new endpoints (US-015) [CCEM-188]
- [x] **CP-113**: v6.0.0 release — mix.exs bump to 6.0.0, CHANGELOG, CCEMHelper rebuild (US-016) [CCEM-189]
- After Wave 3: `mix compile --warnings-as-errors` ✓ PASS | `swift build -c release` ✓ PASS

### PM Squadron (parallel to all waves)
- [x] **CP-114**: Plane backlog audit — close resolved issues, version/commit report (US-017) [CCEM-190]
- [x] **CP-115**: Create Plane issues CCEM-169 through CCEM-189 for v6.0.0 feature set (US-018) [CCEM-191]
- [x] **CP-116**: Board state verification + drift sync (US-019) [CCEM-192]

### Orchestrator
- [x] **CP-117**: Formation deployment — fmt-ccem-v6-20260316 — all waves complete (US-020) [CCEM-193]

## Implementation Checkpoints — ralph/ccem-v6-1-0

### Wave 1: Activity + Inspector (Independent)
- [x] **CP-118**: AgentActivityLog GenServer — ring buffer 200 events, lifecycle/tool/thinking/text topics, PubSub broadcast, GET /api/agents/activity-log (US-031)
- [x] **CP-119**: ShowcaseLive activity_log assign + handle_info({:activity_log_entry}) + showcase:activity push_event (US-032a)
- [x] **CP-120**: ShowcaseEngine Activity tab — D3.js force-directed graph, pulse rings for active agents, 30-event pull-down log (US-032b)
- [x] **CP-121**: Showcase Feature Inspector — right-column panel, acceptance criteria checklist, related agents, status mini-timeline (US-033)
- [x] **CP-122**: Showcase Template System — TEMPLATES registry, engine/formation layouts, applyTemplate dispatch, showcase:template-changed event (US-034)
- [x] **CP-123**: Project Dropdown UX — categorize_projects/2 helper, Active/Recently Active/Other sections (US-035)
- After Wave 1: `mix compile --warnings-as-errors` ✓ PASS

## Implementation Checkpoints — ralph/ccem-v6-2-0

### Wave 1: Controller Extraction + Component Decomposition (Independent)
- [x] **CP-124**: UpmApiController — domain controller extracted from ApiController for UPM execution tracking (US-036)
- [x] **CP-125**: FormationApiController — domain controller for formation CRUD: list, get, create, update, agents (US-037)
- [x] **CP-126**: ShowcaseApiController — domain controller for showcase data REST API: index, show, reload (US-038)
- [x] **CP-127**: AgentPanel Component — extracted from DashboardLive Agent Fleet section, tier/status/type badges, filter support (US-039)
- [x] **CP-128**: PortPanel Component — extracted from DashboardLive Ports tab, clash alerts, remediation display, project port configs (US-040)
- [x] **CP-129**: LiveView Integration Tests — 14 ExUnit tests: 8 DashboardLive + 6 ShowcaseLive (US-041)
- After Wave 1: `mix compile --warnings-as-errors` ✓ PASS

## Implementation Checkpoints — ralph/ccem-usage-management

### Wave 1: Backend + Hooks (parallel)
- [x] **CP-118**: ClaudeUsageStore GenServer — ETS token/model tracking + PubSub (US-042) [CCEM-226]
- [x] **CP-119**: UsageController REST API — 5 endpoints at /api/usage/* (US-043) [CCEM-227]
- [x] **CP-120**: UsageLive LiveView — /usage dashboard with model breakdown + effort badges (US-044) [CCEM-228]
- [x] **CP-121**: Claude Code Hooks — PostToolUse usage recorder + PreToolUse threshold checker (US-045) [CCEM-229]
- After Wave 1: `mix compile --warnings-as-errors` ✓ PASS (pre-existing beam-reload warnings excluded)

### Wave 2: Integration (parallel)
- [x] **CP-122**: CCEM APM Skill + usage_constraints.md memory file (US-046) [CCEM-230]
- [x] **CP-123**: Plane PM — CCEM-226 through CCEM-230 created + set to Done
- [x] **CP-124**: CCEMHelper — UsageModels.swift, fetchUsageSummary(), usageSection in MenuBarView
- After Wave 2: `swift build -c release` ✓ PASS

### Wave 3: Release
- [x] **CP-125**: v6.3.0 — CHANGELOG, priv/docs/changelog.md, api-reference.md, mix.exs bump (US-016)
- After Wave 3: `mix compile --warnings-as-errors` ✓ PASS | `swift build -c release` ✓ PASS

## CCEM APM Integration

- **APM Dashboard**: http://localhost:3032
- **APM Config**: /Users/jeremiah/Developer/ccem/apm/apm_config.json
- **APM Port**: 3032
- **Skills Path**: ~/.claude/skills/
- **APM Log**: /Volumes/DDRV902/logs/apm_server.log

## Formation Deploy

`/formation deploy` — always run as a background task. Return status messaging only upon completion.

## Attribution Policy

Never include "Generated with Claude Code", "Co-Authored-By: Claude", or any AI/Claude attribution in:
- Pull request bodies or titles
- Commit messages
- Issue comments
- Any externally submitted content (GitHub, GitLab, etc.)

This is a hard rule with no exceptions.

## Implementation Checkpoints — ralph/agentlock-notifications-namespace-ux

### Wave 1: Foundation (3 parallel — independent)
- [x] **CP-178**: `ApmV5.NamespaceResolver` GenServer + ETS cache — agent_label/session_label/gate_label (US-001) [CCEM-297]
- [x] **CP-179**: 20s default timeouts — PendingDecisions @ttl_seconds 20, DecisionGate @default_timeout_ms 20_000, hook single 15s poll (US-002) [CCEM-298]
- [x] **CP-180**: `PendingDecisions.add/5` fires immediate `POST /api/notify` fire-and-forget Task (US-003) [CCEM-299]
- After Wave 1: `mix compile --warnings-as-errors` ✓ PASS

### Wave 2: UI + CCEMHelper (depends on Wave 1)
- [x] **CP-181**: `AuthorizationLive` countdown approval banners — PubSub subscribe, countdown-timer JS hook, inline Approve/Deny (US-004) [CCEM-300]
- [x] **CP-182**: Human-readable display names — AgentPanel + SessionManagerLive + DashboardLive + AuthorizationLive audit log (US-005) [CCEM-301]
- [x] **CP-183**: CCEMHelper pendingPollTask 8s→3s + `PendingDecision.displayName` + human-readable notification body (US-006) [CCEM-302]
- After Wave 2: `mix compile --warnings-as-errors` ✓ PASS | `swift build -c release` ✓ PASS

### Wave 3: Release
- [x] **CP-184**: v8.5.0 — mix.exs bump, CHANGELOG, OpenAPI display_name fields, CCEMHelper rebuild (US-007) [CCEM-303]
- After Wave 3: `mix compile --warnings-as-errors` ✓ PASS | `swift build -c release` ✓ PASS

## Implementation Checkpoints — ralph/ccem-skills-ux-v640

### Wave 1: Foundation (4 parallel agents)
- [x] **CP-130**: WCAG AA infrastructure — skip links, ARIA landmarks, keyboard nav, focus-visible, contrast (US-001) [CCEM-231]
- [x] **CP-131**: Skill card grid — health ring SVG, collapsible tier groups, responsive 3/2/1-col (US-002) [CCEM-232]
- [x] **CP-132**: Skill detail slide-in drawer — 5-dim health bars, frontmatter preview, Escape-dismiss (US-003) [CCEM-233]
- [x] **CP-133**: Search + filter bar — debounced search, tier/methodology/source dropdowns, empty state (US-004) [CCEM-234]
- After Wave 1: `mix compile --warnings-as-errors` PASS

### Wave 2: Fix Wizard + Redesigns (depends on Wave 1)
- [x] **CP-134**: Guided Fix Wizard — 4-step Diagnose/Preview/Apply/Verify in drawer (US-005) [CCEM-235]
- [x] **CP-135**: Session tab redesign — horizontal invocation timeline, remove co-occurrence matrix (US-006) [CCEM-236]
- [x] **CP-136**: AG-UI tab improvements — hook health cards, guided repair wizard (US-007) [CCEM-237]
- [x] **CP-137**: skills.js hook — keyboard shortcuts (/ arrow Enter Escape), CSS slide transition (US-008) [CCEM-238]
- After Wave 2: `mix compile --warnings-as-errors` PASS

### Wave 3: Release (depends on Wave 2)
- [x] **CP-138**: v6.4.0 release — CHANGELOG, mix.exs bump, /docs update, showcase features (US-009) [CCEM-239]
- After Wave 3: `mix compile --warnings-as-errors` PASS | `swift build -c release` PASS

## Implementation Checkpoints — ralph/ccem-v7-0-0-agentlock

### Wave 1: Foundation (5 parallel — independent GenServers)
- [x] **CP-139**: ApmV5.Auth.Types — shared structs, risk levels, trust levels, context sources (US-001) [CCEM-240]
- [x] **CP-140**: ApmV5.Auth.PolicyEngine — stateless risk evaluation, default tool map (US-002) [CCEM-241]
- [x] **CP-141**: ApmV5.Auth.TokenStore — GenServer + ETS, atk_ tokens, SHA-256 param binding (US-003) [CCEM-242]
- [x] **CP-142**: ApmV5.Auth.SessionStore — dual-indexed ETS, 15-min TTL, monotonic trust (US-004) [CCEM-243]
- [x] **CP-143**: ApmV5.Auth.RateLimiter — sliding window per {user, tool} (US-005) [CCEM-244]
- After Wave 1: `mix compile --warnings-as-errors` PASS

### Wave 2: Advanced Auth + API (depends on Wave 1)
- [x] **CP-144**: ApmV5.Auth.ContextTracker — trust/provenance, monotonic degradation (US-006) [CCEM-245]
- [x] **CP-145**: ApmV5.Auth.MemoryGate — persistence auth, 7 prohibited patterns (US-007) [CCEM-246]
- [x] **CP-146**: ApmV5.Auth.RedactionEngine — 7 regex patterns, auto/manual/none modes (US-008) [CCEM-247]
- [x] **CP-147**: ApmV5.Auth.AuthorizationGate — central Layer 2 enforcement (US-009) [CCEM-248]
- [x] **CP-148**: AuthController + Router + Supervision — 19 endpoints, 5 GenServers (US-010) [CCEM-249]
- After Wave 2: `mix compile --warnings-as-errors` PASS

### Wave 3: Visualization + Process Management (depends on Wave 2)
- [x] **CP-149**: AuthorizationLive — 4-tab dashboard (US-011) [CCEM-250]
- [x] **CP-150**: RoutingLive — D3.js auth flow graph (US-012) [CCEM-251]
- [x] **CP-151**: ApmV5.Auth.AgentLifecycle — state machine module (US-013) [CCEM-252]
- [x] **CP-152**: ActionEngine — 5 new authorization actions (US-014) [CCEM-253]
- After Wave 3: `mix compile --warnings-as-errors` PASS

### Wave 4: Hooks + CCEMHelper (depends on Wave 3)
- [x] **CP-153**: agentlock_pre_tool.sh — PreToolUse authorization hook (US-015) [CCEM-254]
- [x] **CP-154**: agentlock_post_tool.sh — PostToolUse execution recording (US-016) [CCEM-255]
- [x] **CP-155**: agentlock_context.sh — context tracking hook (US-017) [CCEM-256]
- [x] **CP-156**: AuthorizationModels.swift — Swift structs (US-018) [CCEM-257]
- [x] **CP-157**: CCEMHelper auth integration — APMClient + MenuBarView (US-019) [CCEM-258]
- After Wave 4: `mix compile --warnings-as-errors` PASS | `swift build -c release` PASS

### Wave 5: Showcase + Release (depends on Wave 4)
- [x] **CP-158**: features.json + showcase.js — 8 v7.0.0 features, auth pipeline phase (US-020) [CCEM-259]
- [x] **CP-159**: mix.exs bump to v7.0.0 (US-022) [CCEM-261]
- After Wave 5: `mix compile --warnings-as-errors` PASS | `swift build -c release` PASS
- PR: https://github.com/peguesj/ccem-apm/pull/9

## Implementation Checkpoints — feat/plugin-engine-plane-pm (v7.3.0)

### Wave 1: Foundation
- [x] **CP-160**: `ApmV5.Plugins.PluginBehaviour` — @behaviour contract with plugin_name/0, plugin_description/0, plugin_version/0, list_endpoints/0, handle_action/3, optional inspector_section/1
- [x] **CP-161**: `ApmV5.Plugins.PluginRegistry` — GenServer + ETS `:plugin_registry`, auto-registers default plugins on init
- [x] **CP-162**: `ApmV5.Plugins.Plane.PlanePlugin` — Plane PM plugin: list_issues, get_issue, list_projects, board_state, search_issues; backed by PlaneClient; CCEM project pre-configured
- After Wave 1: `mix compile --warnings-as-errors` ✓ PASS

### Wave 2: API + LiveView + Hooks
- [x] **CP-163**: `ApmV5Web.V2.PluginController` — REST: index, show, action (POST), board (GET), issues (GET) at `/api/v2/plugins/*`
- [x] **CP-164**: Router — `GET /api/v2/plugins`, `GET /api/v2/plugins/:name`, `POST /api/v2/plugins/:name/action`, `GET /api/v2/plugins/:name/board`, `GET /api/v2/plugins/:name/issues`
- [x] **CP-165**: `PluginDashboardLive /plugins` — tabbed: MCP Servers, Discovered, Registered (engine), Plane PM board with Kanban columns + issue inspector pull-out drawer; PubSub `"apm:plugins"`
- [x] **CP-166**: `application.ex` — `ApmV5.Plugins.PluginRegistry` added to supervision tree
- [x] **CP-167**: `pre_tool_use.sh` — `plugin_context` enrichment: detects plugin engine paths/actions, emits `{engine, plugin_name}` in heartbeat context
- [x] **CP-168**: v7.3.0 — mix.exs bump, CHANGELOG, CLAUDE.md checkpoints
- After Wave 2: `mix compile --warnings-as-errors` ✓ PASS

## Implementation Checkpoints — session-management + ccemhelper-settings (v8.1.0)

### Wave 1: Session Manager (CCEM↔APM connector)
- [x] **CP-169**: `ApmV5.SessionManager` — GenServer + ETS `:session_manager_cache`, polls `~/Developer/ccem/apm/sessions/*.json` every 30s, enriches with agents/ports/plugins/claude_config, PubSub `"apm:sessions"`
- [x] **CP-170**: `ApmV5Web.SessionManagerLive` — `/sessions` + `/sessions/:id`, split-panel, 5 tabs (Overview/Claude Config/Agents/Ports/Plugins), 10s refresh
- [x] **CP-171**: Router + sidebar — `live "/sessions"` + `live "/sessions/:id"` routes; `hero-computer-desktop` Sessions nav item
- [x] **CP-172**: Supervision tree — `ApmV5.SessionManager` after `ClaudeUsageStore`
- After Wave 1: `mix compile --warnings-as-errors` ✓ PASS

### Wave 2: CCEMHelper Settings/About/Help
- [x] **CP-173**: `Views/SettingsView.swift` — APM URL + connection test, notification toggles, Launch at Login, `@AppStorage` keys `io.pegues.ccem.*`
- [x] **CP-174**: `Views/AboutView.swift` — version/build from bundle, GitHub link, Open APM Dashboard
- [x] **CP-175**: `Views/HelpView.swift` — Quick Start, Keyboard Shortcuts, Troubleshooting; private sub-views
- [x] **CP-176**: `MenuBarView.swift` — footer section with Settings/About/Help sheet buttons; 3 `@State` vars
- After Wave 2: `swift build -c release` ✓ PASS

### Wave 3: Release
- [x] **CP-177**: v8.1.0 — mix.exs bump, @server_version, @app_version, CHANGELOG, CLAUDE.md checkpoints
- After Wave 3: `mix compile --warnings-as-errors` ✓ PASS | `swift build -c release` ✓ PASS

## Implementation Checkpoints — v8.2.0–v8.4.0

### v8.2.0 (AgentLock Refinements)
- [x] agent_name propagated through auth pipeline; tool_input forwarded; destructive command detection
- [x] POST /api/v2/notifications/test endpoint; CCEMHelper delivers macOS banner within 10s
- [x] CCEMHelper Settings {} scene; UNUserNotificationCenter delegate in init()
- [x] agentlock_pre_tool.sh Gap9 fix — polls pending/:id?wait=30, receives token_id on approval
- [x] PendingDecisions TTL filter; UserDefaults register(defaults:) with all toggles true
- [x] APMClient portKey aligned to io.pegues.ccem.apmPort; AuthAuditEntry.id stored let

### v8.3.0 (Notification Coverage + GettingStarted SVG)
- [x] Universal notification coverage — all 19 subsystems broadcast to PubSub via NotificationBroadcaster
- [x] GettingStartedShowcase: SVG_FALLBACKS[5] inline SVGs per slide; Lottie replaces on CDN load
- [x] CoWork awareness in SessionManager; reads ~/.claude/teams/ + ~/.claude/tasks/

### v8.4.0 (Agent Inspector + Showcase Sync + UPM Decision Gate + Formation Views + UPM Inspector)
- [x] UPM plan inspector pull-out column in WorkflowLive — toggle_inspector / select_story / close_inspector
- [x] Formation multi-view modes: Graph TD/LR, Hierarchical List, Card Grid (formation_live.ex)
- [x] ApmV5.AgUi.AgentContextStore GenServer — tracks AG-UI context per agent_id
- [x] ApmV5.Upm.DecisionGate GenServer — interactive decision gating (CCEMHelper notify + osascript)
- [x] ApmV5Web.ShowcaseChannel Phoenix Channel — WebSocket sync for showcase (showcase:* topic)
- [x] ShowcaseSyncHook / ShowcaseSyncClient — JS hook + client for real-time showcase sync
- [x] AgentPanel enhanced — activity label, formation hierarchy badges, AG-UI context
- [x] DashboardLive inspector tab — AG-UI context panel, formation breadcrumb, UPM decision banner
- [x] Coalesce foundation: CoalesceOrchestrator, CoalesceSupervisor, SkillLogicEngine, SwarmCoordinator
- [x] mix.exs bumped to 8.4.0; @server_version / @app_version updated
- After: `mix compile --warnings-as-errors` ✓ PASS

## Implementation Checkpoints — v8.5.0 (AgentLock 20s + Namespace UX + Remote Tunnel)

### AgentLock + Namespace UX
- [x] ApmV5.NamespaceResolver GenServer — human-readable scoped labels (project/role/task-slug) via ETS :namespace_cache
- [x] PendingDecisions TTL: 120s → 20s; sweep_ms: 15s → 3s
- [x] DecisionGate default_timeout_ms: 120s → 20s; expire_check_ms: 15s → 3s
- [x] AuthorizationLive: PubSub subscribe agentlock:pending; real-time countdown banners (CountdownTimer hook)
- [x] agentlock_pre_tool.sh: poll loop reduced to 1 attempt, --max-time 18, ?wait=15
- [x] CCEMHelper PendingDecision.displayName + notificationBody; pendingPollTask interval 8s → 3s
- [x] mix.exs bumped to 8.5.0

### ccem-relay (Azure Remote Tunnel)
- [x] ccem-relay Phoenix project scaffolded at ~/Developer/ccem/ccem-relay/
- [x] CcemRelay.TunnelRegistry GenServer + ETS :tunnel_registry (register_apm/deregister_apm/register_pending/pop_pending)
- [x] CcemRelayWeb.UserSocket + TunnelChannel: tunnel:local (APM) + tunnel:browser:* (remote browsers)
- [x] CcemRelayWeb.ProxyController: HTTP → WebSocket tunnel frame, 15s timeout receive loop
- [x] HealthController + TunnelStatusController + Router (catch-all proxy)
- [x] Dockerfile (hexpm/elixir:1.17.3 builder + debian:bookworm runtime) — BUILT ✓
- [x] azure-deploy.sh (ACR + Container Apps + secrets + FQDN output)

### apm-v4 Tunnel Client
- [x] ApmV5.Tunnel.Client GenServer — :gun ~> 2.2 outbound WebSocket, Phoenix v2 framing, http_request proxy via :httpc, auto-reconnect
- [x] ApmV5.Tunnel.Supervisor — conditional start (only if TUNNEL_RELAY_URL set)
- [x] application.ex: ApmV5.Tunnel.Supervisor added before Endpoint
- [x] mix.exs: {:gun, "~> 2.2"} dep added
- After: `mix compile --warnings-as-errors` ✓ PASS (both projects)

### Azure Deployment — COMPLETE ✓
- [x] az login — device code auth completed
- [x] ACR create + docker push ccemregistry.azurecr.io/ccem-relay:latest
- [x] az containerapp create — ccem-relay in ccem-env, ccem-rg
- [x] Public URL: https://ccem-relay.wonderfulflower-c29529fc.eastus.azurecontainerapps.io
- [x] Set TUNNEL_SECRET + TUNNEL_RELAY_URL on local APM + session_init.sh (persistent)
- [x] End-to-end proxy verified: `GET /api/status` returns local APM JSON through tunnel

### Multi-Project Tunnel Routing — COMPLETE ✓ (ralph/ccem-multi-project-tunnel)
- [x] ApmV5.Tunnel.Client: `target_project` routing in `proxy_request/3` → `resolve_project_port/1`
- [x] `fetch_port_manifest/0`: queries `/api/ports` REST API for full project→port map, fallback to PortManager configs
- [x] On channel join: sends `register_projects` frame to relay; refreshes every 60s
- [x] ccem-relay: `/p/{project}/...` path prefix routing, strips prefix before forwarding
- [x] ccem-relay TunnelRegistry: `register_project_ports/1`, `get_project_ports/0`, `get_project_port/1`
- [x] ccem-relay TunnelChannel: `handle_in("register_projects", ...)` → TunnelRegistry storage
- [x] ccem-relay: `GET /tunnel/projects` endpoint showing all registered project→port mappings
- [x] Relay deployed: 8 projects auto-discovered, clean 60s refresh cycle
- [x] Routing verified: `GET /p/apm/api/status`, `GET /api/status` (default) both work
- [x] session_init.sh: CCEMHelper launch added alongside APM start

## Implementation Checkpoints — v8.6.0 (AgentLock Notification Reliability + In-Browser Approval Modal)

### AgentLock Notification Fixes
- [x] NotificationLive: agentlock category now shows phx-click Approve/Reject buttons (was broken `<a href>` GET links)
- [x] approve_action/reject_action handlers call PendingDecisions.decide/2 with request_id from notification metadata
- [x] POST-method actions filtered from inline href list (no duplicate broken links)
- [x] GET /api/v2/auth/decide route added — browser-clickable ?request_id=&decision=approve|deny → redirects to /authorization
- [x] NamespaceResolver.cached/1 and put_cache/1 rescue ArgumentError — no crash when GenServer restarts

### CCEMHelper Direct Notification Delivery (US-001)
- [x] AGENTLOCK_APPROVAL UNNotificationCategory registered in CCEMHelperApp.init()
- [x] Approve/Deny UNNotificationAction buttons in macOS banner (identifier: APPROVE / DENY)
- [x] didReceive resolves pending_id from userInfo, calls POST /api/v2/auth/pending/:id/approve|deny
- [x] Notification content: title "AgentLock: [displayName]", body "[tool] requires approval · [risk] risk"

### CCEMHelper Test Notification (US-002)
- [x] "Test Notification" button in SettingsView — fires direct UNUserNotificationContent, no APM round-trip
- [x] Shows permission alert if not granted, links to System Settings > Notifications

### APM In-Browser Approval Modal (US-003)
- [x] AuthorizationLive: full-screen overlay modal (z-[9999], backdrop-blur) with agent name, tool, risk, 20s CountdownTimer, Approve/Deny
- [x] DashboardLive: compact floating banner strip above UPM panel; subscribe agentlock:pending PubSub; inline Approve/Deny + deep-link
- [x] approve_gate/deny_gate handle_event dispatches to PendingDecisions.decide/2

### Release
- [x] mix.exs bumped to 8.6.0; @server_version + @app_version updated
- [x] CHANGELOG.md v8.6.0 entry
- [x] swift build -c release ✓ PASS
- [x] mix compile --warnings-as-errors ✓ PASS
- [x] Plane: CCEM-304 through CCEM-307 → Done
- After: `mix compile --warnings-as-errors` ✓ PASS | `swift build -c release` ✓ PASS | APM 8.6.0 running

## Implementation Checkpoints — ralph/ccem-v890-platform-refactor (v8.9.0)

### Wave 1: Behaviour Contracts + JS Graphs (Independent)
- [x] **CP-185**: PluginBehaviour optional callbacks nav_items/0, settings_path/0, plugin_live_module/0, plugin_integrations/0 (US-002)
- [x] **CP-186**: IntegrationBehaviour required_plugin/0 + target_native_feature/0; symbiosis wiring in IntegrationRegistry (US-016)
- [x] **CP-187**: Formation graph TB layout mode + namespace bounding rectangle hulls + auto-collapse >50 nodes (US-007)
- [x] **CP-188**: Dashboard dep graph project grouping + inactive project collapse; toggle_project_collapse handler (US-008)
- After Wave 1: `mix compile --warnings-as-errors` ✓ PASS

### Wave 2: GenServer + UI (depends on Wave 1)
- [x] **CP-189**: AgentRegistry agent_name/agent_type/agent_definition fields; normalize_agent_type/1; BackgroundTasksStore fire-and-forget on register (US-006)
- [x] **CP-190**: NotificationLive grouped view by category; buffer cap 2000; RoutingLive recent_decisions (US-004/US-020)
- [x] **CP-191**: SessionManager JSONL scan (load_jsonl_sessions/0); NamespaceResolver agent_name lookup (US-005/US-021)
- [x] **CP-192**: SessionTimelineLive swim-lane redesign; time-window selector (US-013)
- [x] **CP-193**: UsageLive token breakdown stacked bars; expanded_projects accordion (US-012)
- [x] **CP-194**: SkillsLive fix wizard async preview; step navigation; duplicate defp fix (US-011)
- [x] **CP-195**: RalphPluginLive at /plugins/ralph (US-009)
- After Wave 2: `mix compile --warnings-as-errors` ✓ PASS

### Wave 3: PlanePmAlign + Release Prep (depends on Wave 2)
- [x] **CP-196**: ApmV5.PlanePmAlign GenServer — persistent_service, 5min Plane poll, "plane:sync" PubSub (US-018)
- [x] **CP-197**: V2.PlaneController — GET /api/v2/plane/sync-status + POST /api/v2/plane/sync (US-018)
- [x] **CP-198**: Plugin/Integration symbiosis: AgUiIntegration, AgentLockIntegration, cross-reference helpers (US-016)
- [x] **CP-199**: mix.exs → 8.9.0; @server_version/@app_version → "8.9.0"; CHANGELOG v8.9.0 entry (US-019)
- After Wave 3: `mix compile --warnings-as-errors` ✓ PASS

### Wave 4: Docs + AG-UI Plugin (depends on Wave 3)
- [x] **CP-200**: priv/docs changelog, api-reference, docs.json updated for v8.9.0 (US-015)
- [x] **CP-201**: AgUiPluginLive at /plugins/ag_ui — Events/Agents/Config tabs; sidebar nav (US-017)
- [x] **CP-202**: SimpleAgentsPlugin coalesced to v2.0.0 (11 actions: workspace_info, list_agents, list_tools, list_traces, get_trace, list_tasks, get_metrics, trace_summary, provider_stats, list_workflows, parity_status)
- After Wave 4: `mix compile --warnings-as-errors` ✓ PASS | commit 44f47bb

## Implementation Checkpoints -- ralph/ccem-v8-10-0-consolidated

### Wave 1: Agent Alignment Registry + Dashboard Widget Design (Independent)
- [x] **CP-220**: AgentIdentity module -- 67-agent manifest with referential integrity validation (US-220)
- [x] **CP-221**: WidgetRegistry GenServer -- 8 core widget schemas (agent_fleet, formation_monitor, notification_hub, upm_status, metrics_overview, skill_health, port_status, recent_activity) (US-221)
- [x] **CP-222**: LayoutStore GenServer -- 6 presets + 12 scenario layouts from priv/dashboard/presets.json (US-222)
- [x] **CP-223**: AlignmentLive at /alignment -- D3.js agent dependency graph (US-220)
- After Wave 1: `mix compile --warnings-as-errors` ✓ PASS

### Wave 2: AutoApproval Policies + Command Context Enrichment (Independent)
- [x] **CP-224**: AutoApprovalStore GenServer -- hierarchical scope matching (agent > formation > session > project), AND logic, TTL expiry, ETS-backed (US-223)
- [x] **CP-225**: AutoApprovalController -- 6 REST endpoints at /api/v2/auth/auto-approval-policies (US-224)
- [x] **CP-226**: AutoApprovalStore tests -- 27 comprehensive tests, 100% passing (US-225)
- [x] **CP-227**: CommandContextExtractor -- 40+ patterns, action_type/action_detail/approval_reasoning (US-226)
- [x] **CP-228**: CommandContextExtractor tests -- 28 comprehensive tests, 100% passing (US-227)
- After Wave 2: `mix compile --warnings-as-errors` ✓ PASS | 55 tests, 0 failures

### Wave 3: Authorization Pipeline Integration (depends on Wave 2)
- [x] **CP-229**: PendingDecisions enrichment -- CommandContextExtractor.analyze/2 on all escalations (US-228)
- [x] **CP-230**: AuthorizationGate auto-approval pipeline -- find_matching/6 before PendingDecisions escalation (US-231)
- [x] **CP-231**: Audit log enrichment -- action_type, action_detail, approval_reasoning in all entries (US-232)
- After Wave 3: `mix compile --warnings-as-errors` ✓ PASS

### Wave 4: Platform Integration (depends on Wave 1 + Wave 3)
- [x] **CP-232**: Router -- auto-approval-policies routes + alignment live route wired (US-224)
- [x] **CP-233**: AuthSupervisor -- AutoApprovalStore added to supervision tree (US-223)
- [x] **CP-234**: Application.ex -- WidgetRegistry + LayoutStore in supervision tree (US-221)
- After Wave 4: `mix compile --warnings-as-errors` ✓ PASS

### Wave 5: Release + Documentation (depends on all waves)
- [x] **CP-235**: mix.exs version bump 8.9.0 -> 8.10.0 (US-239)
- [x] **CP-236**: @server_version + @app_version -> "8.10.0" (US-239)
- [x] **CP-237**: priv/docs/changelog.md v8.10.0 entry (US-242)
- [x] **CP-238**: priv/docs/versions.json v8.10.0 entry (US-242)
- [x] **CP-239**: priv/docs/docs.json version bump + description updates (US-242)
- [x] **CP-240**: priv/docs/developer/api-reference.md v8.10.0 additions (US-242)
- [x] **CP-241**: CLAUDE.md checkpoints CP-220 through CP-244 (US-238)
- [x] **CP-242**: CLAUDE.md current version -> v8.10.0 (US-238)
- After Wave 5: `mix compile --warnings-as-errors` ✓ PASS
