# CCEM APM Navigation Inventory (v9.1.4 → v9.2.0)

**Generated**: 2026-05-14
**Source**: `apm-v4/lib/apm_v5_web/router.ex` + `apm-v4/lib/apm_v5_web/components/sidebar_nav.ex` + `apm-v4/lib/apm_v5_web/components/top_bar.ex`
**Live routes counted**: 62
**Nav groups**: 6 (Observe, Govern, Measure, Intelligence, Extend, AI Platform)

## Structural finding (W2.3 input)

`page_layout.ex` currently renders the topbar INSIDE the center column (right of the sidebar). The desired structure puts the topbar as the parent row spanning the full viewport above `row(sidebar, main, inspector)`. Project switcher (in `top_bar.ex`) renders correctly but is visually constrained to the center column today.

```
CCEM APM (Phoenix LiveView app)
├── Top Bar  (top_bar.ex) — currently nested inside center column [BUG]
│   ├── Project Switcher
│   ├── ⌘K Command Bar
│   └── Presence Stack
├── Sidebar  (sidebar_nav.ex)
│   ├── Observe
│   │   ├── Dashboard (/) → DashboardLive
│   │   ├── Fleet (/fleet) → FleetLive
│   │   ├── Sessions (/sessions) → SessionManagerLive
│   │   ├── Conversations (/conversations) → ConversationMonitorLive
│   │   ├── Formations (/formation) → FormationLive
│   │   ├── Timeline (/timeline) → SessionTimelineLive
│   │   ├── Tool Calls (/tool-calls) → ToolCallLive
│   │   ├── A2A (/a2a) → A2ALive
│   │   └── Architecture (/architecture) → ArchitectureLive
│   ├── Govern
│   │   ├── Authorization (/authorization) → AuthorizationLive
│   │   ├── Routing (/routing) → RoutingLive
│   │   ├── Approvals (/approvals-history) → ApprovalHistoryLive
│   │   ├── Coalesce (/coalesce) → CoalesceLive
│   │   └── UPM (/upm/module) → UpmLive
│   ├── Measure
│   │   ├── Analytics (/analytics) → AnalyticsLive
│   │   ├── Usage (/usage) → UsageLive
│   │   ├── Health (/health) → HealthCheckLive
│   │   ├── Ports (/ports) → PortsLive
│   │   ├── Tasks (/tasks) → TasksLive
│   │   ├── Actions (/actions) → ActionsLive
│   │   ├── Scanner (/scanner) → ScannerLive
│   │   ├── UAT (/uat) → UatLive
│   │   └── DRTW (/drtw) → DrtwLive
│   ├── Intelligence
│   │   ├── Skills (/skills) → SkillsLive [badge: skill_count]
│   │   ├── Skill Drift (/skill-drift) → SkillDriftLive
│   │   ├── Library (/library) → LibraryLive
│   │   ├── Memory (/memory) → MemoryLive
│   │   ├── Orchestration (/orchestration) → OrchestrationLive
│   │   ├── Intake (/intake) → IntakeLive
│   │   └── Alignment (/alignment) → [ORPHAN — no /alignment route, /actions/alignment exists]
│   ├── Extend
│   │   ├── Plugins (/plugins) → PluginDashboardLive [expandable]
│   │   │   ├── (children) → PluginDashboardLive :plugin_show via /plugins/:slug
│   │   │   ├── Ralph Plugin (/plugins/ralph) → RalphPluginLive
│   │   │   ├── AG-UI Plugin (/plugins/ag_ui) → AgUiPluginLive
│   │   │   ├── Claude Code (/plugins/claude-code) → ClaudeCodeDiscoveryLive
│   │   │   ├── Harness (/plugins/harness) → HarnessLive
│   │   │   ├── Open Design (/plugins/open-design) → OpenDesignLive
│   │   │   ├── Composio (/plugins/composio) → ComposioLive
│   │   │   └── Builder (/plugins/builder) → BuilderLive
│   │   ├── Integrations (/integrations) → PluginDashboardLive :integrations_tab [expandable]
│   │   │   ├── AG-UI (/ag-ui) → AgUiLive
│   │   │   ├── Ralph (/ralph) → RalphFlowchartLive
│   │   │   ├── LVM (/integrations/lvm) → LvmStatusLive
│   │   │   └── (children) → PluginDashboardLive :integration_show via /integrations/:slug
│   │   ├── Notifications (/notifications) → NotificationLive [badge: notification_count]
│   │   ├── Showcase (/showcase) → ShowcaseLive
│   │   └── Docs (/docs) → DocsLive
│   └── AI Platform
│       ├── All Projects (/apm-all) → AllProjectsLive
│       ├── AG-UI (/ag-ui) → AgUiLive  [DUP under Extend > Integrations]
│       ├── Ralph (/ralph) → RalphFlowchartLive  [DUP under Extend > Integrations]
│       └── Generative UI (/generative-ui) → GenerativeUILive
└── Main content area
    └── Inspector panel (optional, right side, 280px)
        └── inspector_panel.ex (copilot / context modes)
```

## Orphan routes (in router but not surfaced in sidebar nav)

These 18 routes exist but have no sidebar entry. They are reachable via direct URL, deep links, or other navigation paths (e.g. drilldowns from Dashboard / Sessions / Formations).

| Route | LiveView | Reachable via |
|---|---|---|
| `/workflow/:type` | WorkflowLive | UPM detail links |
| `/docs/*path` | DocsLive | /docs deep link |
| `/backfill` | BackfillLive | conversations/memory drilldown |
| `/observe/conversations` | ConversationMonitorLive | sidebar (/conversations) — alias |
| `/observe/sessions/:session_id` | SessionDetailLive | Sessions list drilldown |
| `/observe/timeline` | SessionTimelineLive | alias for /timeline |
| `/observe/formation` | FormationsLive | alias / new Formation detail |
| `/govern/authorization` | AuthorizationLive | alias for /authorization |
| `/sessions/:id` | SessionManagerLive | Sessions list drilldown |
| `/showcase/:project` | ShowcaseLive | named project deep links |
| `/ccem` | CcemOverviewLive | /ccem direct |
| `/actions/alignment` | AlignmentLive | sidebar shows "/alignment" — mismatch |
| `/plugins/:slug` | PluginDashboardLive | Plugins list children |
| `/integrations/:slug` | PluginDashboardLive | Integrations list children |
| `/upm/module/:project_id` | UpmLive | UPM project drilldown |
| `/upm/module/:project_id/board` | UpmLive | UPM board view |

## Broken / mismatched links

1. **Alignment** — sidebar links to `/alignment` but only `/actions/alignment` exists in router. Fix: update sidebar `href="/actions/alignment"` OR add a `/alignment` route alias.

## Duplicates (same target, multiple nav locations — intentional)

- `/ag-ui` — Extend > Integrations + AI Platform
- `/ralph` — Extend > Integrations + AI Platform
- `/conversations` ≡ `/observe/conversations`
- `/timeline` ≡ `/observe/timeline`
- `/authorization` ≡ `/govern/authorization`

These look intentional for cross-section discoverability.

## Route → Feature mapping summary

| Group | Routes | Primary LiveViews |
|---|---|---|
| Observe | 9 + 4 aliases | Dashboard, Fleet, Sessions, Conversations, Formation(s), Timeline, ToolCall, A2A, Architecture |
| Govern | 5 + 1 alias | Authorization, Routing, ApprovalHistory, Coalesce, Upm |
| Measure | 9 | Analytics, Usage, HealthCheck, Ports, Tasks, Actions, Scanner, Uat, Drtw |
| Intelligence | 7 | Skills, SkillDrift, Library, Memory, Orchestration, Intake, Alignment |
| Extend | 5 + 7 plugin children + 4 integration children | PluginDashboard, AgUi, RalphFlowchart, Notifications, Showcase, Docs |
| AI Platform | 4 | AllProjects, AgUi, RalphFlowchart, GenerativeUi |

Total: 62 live route directives, ~52 distinct LiveView modules.
