/**
 * CCEM Showcase — Roadmap-Based GIMME-Style Live Dashboard
 *
 * Identical pattern to GIMME /showcase:
 *   Left   — Feature cards (Card/Hierarchy toggle, wave + progress filters, roadmap polling)
 *   Center — Architecture SVG + AG-UI chat options
 *   Right  — Live resource inspector (polls APM every 10s)
 *
 * Orchestration status bar: APM/Project badges, UPM pipeline stepper, formation crumbs
 * Roadmap modal: SVG wave rail with animated circles + story dots
 * Bottom bar: AG-UI prompt input + footer
 *
 * No build step. Served via `python3 -m http.server 8080` from showcase/client/
 * APM endpoint: http://localhost:3032
 */

// ─── Constants ──────────────────────────────────────────────────────────────────

const APM_BASE = window.CCEM_APM_BASE_URL || 'http://localhost:3032';
const POLL_INTERVAL = 10_000;
const VERSION = 'v7.0.0';

const WAVE_COLORS = {
  1: { hex: '#10b981', stroke: '#34d399', fill: '#10b981', text: 'text-emerald-400', bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/30', pill: 'text-emerald-400 bg-emerald-500/10 ring-emerald-500/30', border: 'border-emerald-500/20', bar: 'bg-emerald-500' },
  2: { hex: '#3b82f6', stroke: '#60a5fa', fill: '#3b82f6', text: 'text-blue-400', bg: 'bg-blue-500/10', ring: 'ring-blue-500/30', pill: 'text-blue-400 bg-blue-500/10 ring-blue-500/30', border: 'border-blue-500/20', bar: 'bg-blue-500' },
  3: { hex: '#a855f7', stroke: '#c084fc', fill: '#a855f7', text: 'text-purple-400', bg: 'bg-purple-500/10', ring: 'ring-purple-500/30', pill: 'text-purple-400 bg-purple-500/10 ring-purple-500/30', border: 'border-purple-500/20', bar: 'bg-purple-500' },
  4: { hex: '#f59e0b', stroke: '#fbbf24', fill: '#f59e0b', text: 'text-amber-400', bg: 'bg-amber-500/10', ring: 'ring-amber-500/30', pill: 'text-amber-400 bg-amber-500/10 ring-amber-500/30', border: 'border-amber-500/20', bar: 'bg-amber-500' },
  5: { hex: '#ef4444', stroke: '#f87171', fill: '#ef4444', text: 'text-rose-400', bg: 'bg-rose-500/10', ring: 'ring-rose-500/30', pill: 'text-rose-400 bg-rose-500/10 ring-rose-500/30', border: 'border-rose-500/20', bar: 'bg-rose-500' },
};

const WAVE_LABELS = {
  1: 'Foundation',
  2: 'Core',
  3: 'Dashboard',
  4: 'Tools',
  5: 'Integration',
};

const VERSION_META = {
  '5.0.0': { label: 'v5.0.0', name: 'Foundation', text: 'text-amber-400', pill: 'text-amber-400 bg-amber-500/10 ring-amber-500/30', border: 'border-amber-500/20', bar: 'bg-amber-500', hex: '#f59e0b' },
  '5.1.0': { label: 'v5.1.0', name: 'Platform',   text: 'text-blue-400',  pill: 'text-blue-400 bg-blue-500/10 ring-blue-500/30',   border: 'border-blue-500/20',  bar: 'bg-blue-500',  hex: '#3b82f6' },
  '5.3.0': { label: 'v5.3.0', name: 'Native',     text: 'text-purple-400',pill: 'text-purple-400 bg-purple-500/10 ring-purple-500/30',border: 'border-purple-500/20',bar: 'bg-purple-500',hex: '#a855f7' },
  '6.0.0': { label: 'v6.0.0', name: 'Intelligence',  text: 'text-emerald-400', pill: 'text-emerald-400 bg-emerald-500/10 ring-emerald-500/30',  border: 'border-emerald-500/20', bar: 'bg-emerald-500', hex: '#10b981' },
  '6.1.0': { label: 'v6.1.0', name: 'Observability', text: 'text-cyan-400',    pill: 'text-cyan-400 bg-cyan-500/10 ring-cyan-500/30',              border: 'border-cyan-500/20',    bar: 'bg-cyan-500',    hex: '#06b6d4' },
  '6.2.0': { label: 'v6.2.0', name: 'Architecture',  text: 'text-violet-400',  pill: 'text-violet-400 bg-violet-500/10 ring-violet-500/30',        border: 'border-violet-500/20',  bar: 'bg-violet-500',  hex: '#8b5cf6' },
  '6.4.0': { label: 'v6.4.0', name: 'Skills UX',     text: 'text-pink-400',    pill: 'text-pink-400 bg-pink-500/10 ring-pink-500/30',              border: 'border-pink-500/20',    bar: 'bg-pink-500',    hex: '#ec4899' },
  '7.0.0': { label: 'v7.0.0', name: 'Security',       text: 'text-red-400',     pill: 'text-red-400 bg-red-500/10 ring-red-500/30',                border: 'border-red-500/20',     bar: 'bg-red-500',     hex: '#ef4444' },
};
const VERSION_ORDER = ['5.0.0', '5.1.0', '5.3.0', '6.0.0', '6.1.0', '6.2.0', '6.4.0', '7.0.0'];

const STATUS_COLORS = {
  green:   { dot: 'bg-emerald-500 shadow-emerald-500/60 shadow-sm', text: 'text-emerald-400' },
  amber:   { dot: 'bg-yellow-500 shadow-yellow-500/60 shadow-sm',   text: 'text-yellow-400' },
  red:     { dot: 'bg-red-500 shadow-red-500/60 shadow-sm',         text: 'text-red-400' },
  unknown: { dot: 'bg-zinc-600',                                     text: 'text-zinc-500' },
};

// ─── Feature Data (static, roadmap status resolved from live polling) ──────────

const FEATURES = [
  // ── v5.0.0: Foundation ─────────────────────────────────────────────────────────
  { id: 'US-001', wave: 1, version: '5.0.0', title: 'AG-UI Protocol',          description: '33 typed event categories via ag_ui_ex Hex package. SSE transport, compile-time EventType constants.', packages: [{ name: 'ag_ui_ex', stars: 'Hex', url: 'https://hex.pm/packages/ag_ui_ex' }, { name: 'AG-UI Protocol', url: 'https://docs.ag-ui.com' }] },
  { id: 'US-002', wave: 1, version: '5.0.0', title: 'Event Router',            description: 'Central dispatch: routes AG-UI events to AgentRegistry, FormationStore, Dashboard, Metrics.', packages: [{ name: 'GenServer', url: 'https://hexdocs.pm/elixir/GenServer.html' }, { name: 'PubSub', url: 'https://hexdocs.pm/phoenix_pubsub' }] },
  { id: 'US-003', wave: 1, version: '5.0.0', title: 'Event Stream',            description: 'Emit and retrieve events. PubSub broadcast to all subscribers. Time-ordered ETS storage. 12 ExUnit tests.', packages: [{ name: 'ETS', url: 'https://www.erlang.org/doc/man/ets.html' }] },
  { id: 'US-004', wave: 1, version: '5.0.0', title: 'Hook Bridge',             description: 'Translates legacy register/heartbeat/notify into AG-UI event types. Zero-config backward compat.', packages: [{ name: 'translate_*', url: '#' }] },
  { id: 'US-005', wave: 1, version: '5.0.0', title: 'State Manager',           description: 'Per-agent versioned state with JSON Patch delta emission. ETS-backed, microsecond reads.', packages: [{ name: 'ETS', url: 'https://www.erlang.org/doc/man/ets.html' }] },
  { id: 'US-006', wave: 2, version: '5.0.0', title: 'Agent Registry',          description: 'Lifecycle tracking for all agents. Squadron/swarm/cluster hierarchy. 30s heartbeat, 90s stale threshold.', packages: [{ name: 'GenServer', url: 'https://hexdocs.pm/elixir/GenServer.html' }] },
  { id: 'US-007', wave: 2, version: '5.0.0', title: 'Formation Model',         description: 'Hierarchical agent coordination via FormationStore. Formation → Squadron → Swarm → Agent. POST /api/v2/formations.', packages: [{ name: 'FormationStore', url: '#' }] },

  // ── v5.1.0: Platform ───────────────────────────────────────────────────────────
  { id: 'US-008', wave: 2, version: '5.1.0', title: 'Metrics Collector',       description: 'Per-agent, per-project token economics. 12 x 5-min buckets, full last-hour time-series. GET /api/telemetry.', packages: [{ name: 'Telemetry', url: 'https://hexdocs.pm/telemetry' }] },
  { id: 'US-009', wave: 2, version: '5.1.0', title: 'Chat Store',              description: 'Scoped message persistence. AG-UI TEXT_MESSAGE event integration. PubSub real-time. 27 ExUnit tests.', packages: [{ name: 'GenServer', url: 'https://hexdocs.pm/elixir/GenServer.html' }] },
  { id: 'US-010', wave: 3, version: '5.1.0', title: '19+ LiveView Dashboards', description: 'Real-time Phoenix LiveView pages: agents, formations, analytics, health, tasks, scanner, actions, skills, notifications, AG-UI, conversations, ports, UPM Kanban.', packages: [{ name: 'Phoenix LiveView', stars: '6.2k', url: 'https://hexdocs.pm/phoenix_live_view' }, { name: 'daisyUI', stars: '36k', url: 'https://daisyui.com' }] },
  { id: 'US-011', wave: 3, version: '5.1.0', title: 'Sidebar Navigation',      description: 'Unified sidebar across all 19+ views. Dual-section dynamic nav, active page highlighting, icon labels.', packages: [{ name: 'Phoenix Components', url: 'https://hexdocs.pm/phoenix/components.html' }] },
  { id: 'US-012', wave: 3, version: '5.1.0', title: 'Notification Panel',      description: 'Tabbed categories with toast overlays. Wave completion toasts. Read/unread tracking. POST /api/notify.', packages: [{ name: 'PubSub', url: 'https://hexdocs.pm/phoenix_pubsub' }] },
  { id: 'US-013', wave: 3, version: '5.1.0', title: 'Health Check System',     description: 'HealthCheckRunner with 15-second auto-refresh. Overall status badge aggregating server, APM, and service health.', packages: [{ name: 'GenServer', url: 'https://hexdocs.pm/elixir/GenServer.html' }] },
  { id: 'US-014', wave: 3, version: '5.1.0', title: 'AG-UI Dashboard',         description: 'Live AG-UI event viewer at /ag-ui. State inspector. Protocol stats. SSE streaming via EventStream PubSub.', packages: [{ name: 'AgUiLive', url: '#' }, { name: 'AG-UI SSE', url: 'https://docs.ag-ui.com/concepts/streaming' }] },
  { id: 'US-015', wave: 3, version: '5.1.0', title: 'Conversation Monitor',    description: 'Real-time conversation tracking across scopes via ChatStore. Message history viewer. ActivityTracker inference.', packages: [{ name: 'ChatStore', url: '#' }] },

  // ── v5.3.0: Native ─────────────────────────────────────────────────────────────
  { id: 'US-016', wave: 4, version: '5.3.0', title: 'CCEMAgent',               description: 'Native macOS menubar companion. Swift/AppKit @Observable. Telemetry AreaMark + LineMark chart. Start/Stop APM. Mini-chat.', packages: [{ name: 'Swift', url: 'https://swift.org' }, { name: 'AppKit', url: 'https://developer.apple.com/documentation/appkit' }] },
  { id: 'US-017', wave: 4, version: '5.3.0', title: 'Skill Health Monitor',    description: 'SkillsRegistryStore GenServer with ETS health scoring. Three-tier health view. Audit engine via ActionEngine.', packages: [{ name: 'SkillsLive', url: '#' }] },
  { id: 'US-018', wave: 4, version: '5.3.0', title: 'Project Scanner',         description: 'Auto-discovery of developer directories: projects, stacks, active ports, hooks, MCPs, CLAUDE.md sections.', packages: [{ name: 'ProjectScanner', url: '#' }] },
  { id: 'US-019', wave: 4, version: '5.3.0', title: 'Background Task Manager', description: 'BackgroundTasksStore GenServer tracks Claude Code background tasks: name, definition, log_path, runtime_ms. PubSub.', packages: [{ name: 'BackgroundTasksStore', url: '#' }] },
  { id: 'US-020', wave: 4, version: '5.3.0', title: 'Action Engine',           description: 'ActionEngine GenServer with extensible action catalog. Async via Task.start/1. Run modal in /actions LiveView.', packages: [{ name: 'ActionEngine', url: '#' }] },

  // ── v6.0.0: Intelligence ───────────────────────────────────────────────────────
  { id: 'US-021', wave: 5, version: '6.0.0', title: 'UAT Testing Panel',       description: '14 test cases across 6 categories exercising the live AG-UI subsystem in-browser. Results per test with pass/fail and latency.', packages: [{ name: 'UatLive', url: '#' }] },
  { id: 'US-022', wave: 5, version: '6.0.0', title: 'Showcase Generator',      description: 'IP-safe architecture diagrams via ShowcaseDataStore. C4 abstraction. Pure SVG engine, WCAG AA, anime.js animations.', packages: [{ name: 'SVG', url: '#' }, { name: 'anime.js', url: 'https://animejs.com' }] },
  { id: 'US-023', wave: 5, version: '6.0.0', title: 'Cross-Platform Installer',description: 'Modular install.sh with libs: ui, detect, deps, build, hooks, service. --prefix, --dry-run, --yes flags. User-level services.', packages: [{ name: 'bash', url: '#' }] },
  { id: 'US-024', wave: 5, version: '6.0.0', title: 'UPM Orchestration',       description: 'End-to-end: /upm plan → build → verify → ship. Formation deployment with squadron/swarm hierarchy. 22 REST endpoints.', packages: [{ name: 'UPM', url: '#' }, { name: 'Plane PM', url: 'https://plane.so' }] },
  { id: 'US-025', wave: 5, version: '6.0.0', title: 'OpenAPI 3.0.3 Spec',      description: '56 endpoints across 21 categories. Canonical at GET /api/v2/openapi.json. Scalar interactive docs at /api/docs.', packages: [{ name: 'OpenAPI 3.0.3', url: 'https://swagger.io/specification/' }, { name: 'Scalar', url: 'https://scalar.com' }] },
  { id: 'US-026', wave: 5, version: '6.0.0', title: 'Port Management',         description: 'PortsLive intelligence dashboard with conflict visualization and utilization heatmap. ActionEngine port actions. REST at /api/v2/ports.', packages: [{ name: 'PortRegistryStore', url: '#' }] },
  { id: 'US-027', wave: 5, version: '6.0.0', title: 'Approval Gates',          description: 'Formation-level approval workflow. POST /api/v2/approvals/request. Wave-gate blocking until approval received.', packages: [{ name: 'FormationStore', url: '#' }] },
  { id: 'US-028', wave: 5, version: '6.0.0', title: '5-Level Formation Graph', description: 'Full D3.js formation tree at /formation: Formation → Squadron → Swarm → Cluster → Agent. Wave swim lanes. Inspector panel with 16 metadata fields.', packages: [{ name: 'D3.js', stars: 'v7', url: 'https://d3js.org' }] },
  { id: 'US-029', wave: 5, version: '6.0.0', title: 'Screenshot Skill',        description: '/screenshot skill handles macOS HEIC filenames. Subcommands: default, last N, incremental, setup, status. Auto-converts HEIC→PNG via sips.', packages: [{ name: 'sips', url: '#' }] },
  { id: 'US-030', wave: 5, version: '6.0.0', title: 'Skill Dependency Graph',  description: 'Visualized skill ecosystem for CCEM: /idea → /ralph → /upm → /formation → /deploy:agents-v2 → /live-integration-testing. Skills toggle in APM dep graph.', packages: [{ name: 'D3.js', stars: 'v7', url: 'https://d3js.org' }] },
];

// ─── State ──────────────────────────────────────────────────────────────────────

let apmState = { connected: false, status: null, agents: [], lastPoll: null, pollCount: 0, apmConn: 'off', projectConn: 'off' };
let orchState = { phase: 'ship', formationId: null, wave: 5, totalWaves: 5, agentsActive: 0, agentsTotal: 0, tsc: 'PASS', lastEvent: null, lastEventAt: null, storiesDone: FEATURES.length, storiesTotal: FEATURES.length };
let liveMap = new Map(); // id -> { id, title, wave, passes, status }
let viewMode = 'card'; // 'card' | 'hierarchy'
let waveFilter = null;
let progressFilter = 'all'; // 'all' | 'done' | 'in-progress' | 'planned'
let roadmapOpen = false;

// Derive status from liveMap or default
function resolveStatus(featureId, wave) {
  const live = liveMap.get(featureId);
  if (!live) return 'done'; // all current features are done
  if (live.passes) return 'done';
  if (live.status === 'in_progress') return 'in-progress';
  return 'planned';
}

// ─── APM Polling ────────────────────────────────────────────────────────────────

async function pollAPM() {
  const updates = {};
  try {
    const [statusRes, agentsRes, formRes, upmRes] = await Promise.allSettled([
      fetch(`${APM_BASE}/api/status`, { signal: AbortSignal.timeout(3000) }),
      fetch(`${APM_BASE}/api/agents`, { signal: AbortSignal.timeout(3000) }),
      fetch(`${APM_BASE}/api/v2/formations`, { signal: AbortSignal.timeout(3000) }),
      fetch(`${APM_BASE}/api/upm/status`, { signal: AbortSignal.timeout(3000) }),
    ]);

    if (statusRes.status === 'fulfilled' && statusRes.value.ok) {
      apmState.status = await statusRes.value.json();
      apmState.connected = true;
      apmState.apmConn = 'polling';
    } else {
      apmState.connected = false;
      apmState.apmConn = 'off';
    }

    if (agentsRes.status === 'fulfilled' && agentsRes.value.ok) {
      const body = await agentsRes.value.json();
      apmState.agents = Array.isArray(body) ? body : (body.agents || []);
      orchState.agentsTotal = apmState.agents.length;
      orchState.agentsActive = apmState.agents.filter(a => a.status === 'active' || a.status === 'working').length;
    }

    if (formRes.status === 'fulfilled' && formRes.value.ok) {
      const body = await formRes.value.json();
      const arr = Array.isArray(body) ? body : (body.data || []);
      const active = arr.find(f => f.status === 'active' || f.state === 'active');
      const target = active || arr[arr.length - 1];
      if (target) orchState.formationId = target.id || target.formation_id || null;
    }

    if (upmRes.status === 'fulfilled' && upmRes.value.ok) {
      const d = await upmRes.value.json();
      if (d.active) {
        const sess = (typeof d.session === 'object' && d.session) ? d.session : {};
        if (['idle','plan','build','verify','ship'].includes(sess.phase)) orchState.phase = sess.phase;
        if (typeof sess.wave === 'number') orchState.wave = sess.wave;
        if (typeof sess.total_waves === 'number') orchState.totalWaves = sess.total_waves;
        if (sess.tsc_gate === 'PASS' || sess.tsc_gate === 'FAIL') orchState.tsc = sess.tsc_gate;
      }
    }

    apmState.lastPoll = new Date();
    apmState.pollCount++;
  } catch {
    apmState.connected = false;
    apmState.apmConn = 'off';
  }
  renderOrchestrationStatus();
  renderInspector();
}

// ─── Orchestration Status Bar ───────────────────────────────────────────────────

function renderOrchestrationStatus() {
  const bar = document.getElementById('orchestration-bar');
  if (!bar) return;

  const connDot = (conn) => conn === 'live' ? 'bg-emerald-400 shadow-emerald-400/60 shadow-sm animate-pulse' : conn === 'polling' ? 'bg-emerald-400/70 shadow-sm' : 'bg-zinc-600';
  const connText = (conn) => conn === 'live' ? 'text-emerald-400' : conn === 'polling' ? 'text-emerald-400/70' : 'text-zinc-600';
  const connLabel = (conn) => conn === 'live' ? 'sse' : conn === 'polling' ? 'rest' : 'off';

  const phases = ['plan', 'build', 'verify', 'auth', 'ship'];
  const activeIdx = orchState.phase !== 'idle' ? phases.indexOf(orchState.phase) : -1;
  const phaseColors = { plan: 'text-blue-400', build: 'text-emerald-400', verify: 'text-purple-400', auth: 'text-red-400', ship: 'text-pink-400' };
  const phaseBg = { plan: 'bg-blue-500/10 ring-blue-500/20', build: 'bg-emerald-500/10 ring-emerald-500/20', verify: 'bg-purple-500/10 ring-purple-500/20', auth: 'bg-red-500/10 ring-red-500/20', ship: 'bg-pink-500/10 ring-pink-500/20' };

  const stepper = phases.map((step, i) => {
    const isActive = step === orchState.phase;
    const isDone = activeIdx > i && orchState.phase !== 'idle';
    const cls = isActive ? `font-bold ring-1 ${phaseColors[step]} ${phaseBg[step]}` : isDone ? 'text-zinc-500 line-through' : 'text-zinc-700';
    return `<span class="text-[10px] font-mono px-1.5 py-0.5 rounded transition ${cls}">${step}</span>${i < phases.length - 1 ? `<span class="text-[10px] mx-0.5 ${isDone || isActive ? 'text-zinc-600' : 'text-zinc-800'}">›</span>` : ''}`;
  }).join('');

  const fmtId = orchState.formationId ? (orchState.formationId.length > 18 ? orchState.formationId.slice(-14) : orchState.formationId) : '—';
  const wavePct = orchState.totalWaves ? Math.round(((orchState.wave - 1) / orchState.totalWaves) * 100) : 0;
  const storyPct = orchState.storiesTotal ? Math.round((orchState.storiesDone / orchState.storiesTotal) * 100) : 0;
  const tscCls = orchState.tsc === 'PASS' ? 'text-emerald-400 bg-emerald-500/10 ring-emerald-500/20' : orchState.tsc === 'FAIL' ? 'text-red-400 bg-red-500/10 ring-red-500/20' : 'text-zinc-700';

  bar.innerHTML = `
    <div class="mx-auto flex h-full max-w-[1600px] items-center px-6 overflow-x-auto gap-0">
      <!-- Connections -->
      <span class="inline-flex items-center gap-1.5">
        <span class="h-1.5 w-1.5 rounded-full flex-shrink-0 ${connDot(apmState.apmConn)}"></span>
        <span class="font-mono text-[10px] ${connText(apmState.apmConn)}">APM<span class="ml-1 text-zinc-700">:${connLabel(apmState.apmConn)}</span></span>
      </span>
      <span class="mx-2.5 text-zinc-800 text-[10px]">&middot;</span>
      <span class="inline-flex items-center gap-1.5">
        <span class="h-1.5 w-1.5 rounded-full flex-shrink-0 ${connDot(apmState.projectConn)}"></span>
        <span class="font-mono text-[10px] ${connText(apmState.projectConn)}">Project<span class="ml-1 text-zinc-700">:${connLabel(apmState.projectConn)}</span></span>
      </span>

      <!-- Divider -->
      <span class="h-4 w-px bg-zinc-800 mx-3 flex-shrink-0"></span>

      <!-- Pipeline Stepper -->
      ${stepper}

      <span class="h-4 w-px bg-zinc-800 mx-3 flex-shrink-0"></span>

      <!-- Formation crumbs -->
      <span class="text-[10px] font-mono text-zinc-400" title="${orchState.formationId || ''}"><span class="text-zinc-600">fmt:</span>${fmtId}</span>
      <span class="mx-2 text-zinc-800 text-[10px]">›</span>
      <span class="inline-flex items-center gap-1.5">
        <span class="text-[10px] font-mono text-zinc-300">W<span class="text-yellow-400">${orchState.wave || '—'}</span>${orchState.totalWaves != null ? `<span class="text-zinc-600">/${orchState.totalWaves}</span>` : ''}</span>
        ${orchState.totalWaves != null ? `<span class="h-1 w-12 rounded-full bg-zinc-800 overflow-hidden"><span class="h-full block bg-yellow-500/60 transition-all duration-500" style="width:${wavePct}%"></span></span>` : ''}
      </span>
      <span class="mx-2 text-zinc-800 text-[10px]">›</span>
      <span class="inline-flex items-center gap-1 text-[10px] font-mono ${orchState.agentsActive > 0 ? 'text-emerald-400' : 'text-zinc-600'}">
        ${orchState.agentsActive > 0 ? '<span class="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>' : ''}
        ${orchState.agentsActive > 0 ? `<span class="text-emerald-400">${orchState.agentsActive}</span><span class="text-zinc-600">/${orchState.agentsTotal} agents</span>` : orchState.agentsTotal > 0 ? `<span class="text-zinc-500">${orchState.agentsTotal} agents</span>` : '<span class="text-zinc-700">agents:—</span>'}
      </span>
      <span class="mx-2 text-zinc-800 text-[10px]">›</span>
      ${orchState.tsc ? `<span class="text-[10px] font-mono font-bold rounded px-1.5 py-0.5 ring-1 ${tscCls}">tsc:${orchState.tsc}</span>` : '<span class="text-[10px] font-mono text-zinc-700">tsc:—</span>'}

      ${orchState.storiesTotal > 0 ? `
        <span class="mx-2 text-zinc-800 text-[10px]">›</span>
        <span class="inline-flex items-center gap-1.5 text-[10px] font-mono">
          <span class="text-zinc-600">stories:</span>
          <span class="${orchState.storiesDone === orchState.storiesTotal ? 'text-emerald-400' : 'text-zinc-400'}">${orchState.storiesDone}</span>
          <span class="text-zinc-700">/${orchState.storiesTotal}</span>
          <span class="h-1 w-8 rounded-full bg-zinc-800 overflow-hidden"><span class="h-full block bg-zinc-500/60 transition-all" style="width:${storyPct}%"></span></span>
        </span>
      ` : ''}

      <!-- Right side: Roadmap button -->
      <span class="ml-auto flex-shrink-0 text-[9px] font-mono text-zinc-800 pl-4 mr-3">
        ${apmState.apmConn === 'live' ? 'SSE:APM' : apmState.apmConn === 'polling' ? 'REST:APM' : 'APM:offline'}
      </span>
      <button type="button" onclick="toggleRoadmap()" class="flex-shrink-0 rounded border border-zinc-700/60 bg-zinc-800/50 px-2.5 py-1 text-[10px] font-mono text-zinc-400 hover:bg-zinc-700/60 hover:text-zinc-200 transition" title="Show feature roadmap progress">
        Roadmap ↗
      </button>
    </div>
  `;
}

// ─── Roadmap Modal ──────────────────────────────────────────────────────────────

function toggleRoadmap() {
  roadmapOpen = !roadmapOpen;
  renderRoadmapModal();
}

function renderRoadmapModal() {
  const el = document.getElementById('roadmap-modal');
  if (!el) return;
  if (!roadmapOpen) { el.innerHTML = ''; return; }

  const byWave = {};
  FEATURES.forEach(f => { byWave[f.wave] = [...(byWave[f.wave] || []), f]; });
  const waves = Object.keys(byWave).map(Number).sort((a, b) => a - b);
  const totalDone = FEATURES.filter(f => resolveStatus(f.id, f.wave) === 'done').length;
  const pct = Math.round((totalDone / FEATURES.length) * 100);

  function waveIcon(wave, allDone) {
    const c = WAVE_COLORS[wave] || WAVE_COLORS[1];
    const check = allDone ? `<path d="M9 14l3.5 3.5L19 10" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>` : `<text x="14" y="19" text-anchor="middle" fill="${c.stroke}" font-size="11" font-weight="bold" font-family="monospace">${wave}</text>`;
    const pulse = allDone ? '' : `<circle cx="14" cy="14" r="12" fill="transparent" stroke="${c.stroke}" stroke-width="2" opacity="0.4"><animate attributeName="r" from="12" to="14" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" from="0.4" to="0" dur="2s" repeatCount="indefinite"/></circle>`;
    return `<svg width="28" height="28" viewBox="0 0 28 28" class="flex-shrink-0"><circle cx="14" cy="14" r="12" fill="${allDone ? c.fill : 'transparent'}" stroke="${c.stroke}" stroke-width="2"/>${check}${pulse}</svg>`;
  }

  function storyDot(passes, wave, delay) {
    const c = WAVE_COLORS[wave] || WAVE_COLORS[1];
    const pulse = passes ? '' : `<circle cx="6" cy="6" r="5" fill="transparent" stroke="${c.stroke}" stroke-width="1.5" opacity="0"><animate attributeName="opacity" values="0;0.5;0" dur="${2 + delay * 0.3}s" repeatCount="indefinite" begin="${delay * 0.2}s"/></circle>`;
    return `<svg width="12" height="12" viewBox="0 0 12 12" class="flex-shrink-0 mt-0.5"><circle cx="6" cy="6" r="5" fill="${passes ? c.fill : '#27272a'}" stroke="${passes ? c.stroke : '#3f3f46'}" stroke-width="1.5"/>${pulse}</svg>`;
  }

  const waveGroups = waves.map(w => {
    const stories = byWave[w];
    const c = WAVE_COLORS[w] || WAVE_COLORS[1];
    const allDone = stories.every(s => resolveStatus(s.id, w) === 'done');
    const doneCt = stories.filter(s => resolveStatus(s.id, w) === 'done').length;

    const storyRows = stories.map((s, i) => {
      const passes = resolveStatus(s.id, w) === 'done';
      return `<div class="flex items-start gap-2">${storyDot(passes, w, i)}<div class="flex items-baseline gap-1.5 min-w-0"><span class="text-[10px] font-mono text-zinc-600 flex-shrink-0">${s.id}</span><span class="text-[11px] truncate ${passes ? 'text-zinc-300 line-through decoration-zinc-600' : 'text-zinc-400'}">${s.title}</span></div></div>`;
    }).join('');

    const connector = w < Math.max(...waves) ? `<div class="w-px flex-1 min-h-[16px]" style="background:linear-gradient(to bottom,${c.stroke}40,transparent)"></div>` : '';

    return `
      <div class="flex gap-4">
        <div class="flex flex-col items-center gap-0 flex-shrink-0">${waveIcon(w, allDone)}${connector}</div>
        <div class="flex-1 pb-5">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-[11px] font-bold font-mono ${c.text}">WAVE ${w}</span>
            <span class="text-[10px] font-mono text-zinc-600">${doneCt}/${stories.length}</span>
            ${allDone ? `<span class="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ring-1 ${c.text} ${c.bg}" style="border-color:${c.stroke}40">SHIPPED</span>` : ''}
          </div>
          <div class="space-y-1.5">${storyRows}</div>
        </div>
      </div>
    `;
  }).join('');

  el.innerHTML = `
    <div class="fixed inset-0 z-[60] overflow-y-auto bg-black/70 backdrop-blur-sm" onclick="toggleRoadmap()">
      <div class="flex min-h-full items-center justify-center p-4">
        <div class="relative w-full max-w-lg rounded-2xl border border-zinc-700/60 bg-zinc-950/98 shadow-2xl shadow-black/80 overflow-hidden" onclick="event.stopPropagation()">
          <div class="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800">
            <div class="flex items-center gap-3">
              <span class="text-sm font-bold text-zinc-100">Feature Roadmap</span>
              <span class="text-[10px] font-mono text-zinc-500">${totalDone}/${FEATURES.length} stories</span>
            </div>
            <button type="button" onclick="toggleRoadmap()" class="text-zinc-600 hover:text-zinc-300 transition text-lg leading-none">&times;</button>
          </div>
          <div class="px-5 pt-3 pb-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-[10px] font-mono text-zinc-500">overall progress</span>
              <span class="text-[10px] font-mono text-zinc-400 ml-auto">${pct}%</span>
            </div>
            <div class="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
              <div class="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-700" style="width:${pct}%"></div>
            </div>
          </div>
          <div class="px-5 py-4 overflow-y-auto max-h-[70vh]">
            ${VERSION_ORDER.map(ver => {
              const verStories = byWave ? FEATURES.filter(f => f.version === ver) : [];
              const vm = VERSION_META[ver];
              const verDone = verStories.filter(s => resolveStatus(s.id, s.wave) === 'done').length;
              const allVerDone = verDone === verStories.length;
              const verWaves = [...new Set(verStories.map(f => f.wave))].sort((a,b) => a - b);
              if (verStories.length === 0) return '';
              const verPct = Math.round((verDone / verStories.length) * 100);
              const versionBanner = `
                <div class="flex items-center gap-2 mb-3 pb-1.5 border-b ${vm.border}">
                  <span class="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ring-1 ${vm.pill}">${vm.label}</span>
                  <span class="text-[11px] font-semibold ${vm.text}">${vm.name}</span>
                  <div class="flex-1 mx-1 h-0.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div class="h-full rounded-full ${vm.bar} transition-all" style="width:${verPct}%"></div>
                  </div>
                  <span class="text-[9px] font-mono text-zinc-600">${verDone}/${verStories.length}</span>
                  ${allVerDone ? `<span class="text-[8px] font-mono font-bold px-1 py-0.5 rounded ring-1 ${vm.pill}">SHIPPED</span>` : ''}
                </div>
              `;
              const waveGroupsHtml = verWaves.map(w => {
                const stories = verStories.filter(s => s.wave === w);
                const c = WAVE_COLORS[w] || WAVE_COLORS[1];
                const allDone = stories.every(s => resolveStatus(s.id, w) === 'done');
                const doneCt = stories.filter(s => resolveStatus(s.id, w) === 'done').length;
                const storyRows = stories.map((s, i) => {
                  const passes = resolveStatus(s.id, w) === 'done';
                  return `<div class="flex items-start gap-2">${storyDot(passes, w, i)}<div class="flex items-baseline gap-1.5 min-w-0"><span class="text-[10px] font-mono text-zinc-600 flex-shrink-0">${s.id}</span><span class="text-[11px] truncate ${passes ? 'text-zinc-300 line-through decoration-zinc-600' : 'text-zinc-400'}">${s.title}</span></div></div>`;
                }).join('');
                return `
                  <div class="flex gap-4 mb-1">
                    <div class="flex flex-col items-center gap-0 flex-shrink-0">${waveIcon(w, allDone)}</div>
                    <div class="flex-1 pb-4">
                      <div class="flex items-center gap-2 mb-2">
                        <span class="text-[11px] font-bold font-mono ${c.text}">WAVE ${w}</span>
                        <span class="text-[10px] font-mono text-zinc-600">${doneCt}/${stories.length}</span>
                        ${allDone ? `<span class="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ring-1 ${c.text} ${c.bg}" style="border-color:${c.stroke}40">SHIPPED</span>` : ''}
                      </div>
                      <div class="space-y-1.5">${storyRows}</div>
                    </div>
                  </div>
                `;
              }).join('');
              return `<div class="mb-4">${versionBanner}${waveGroupsHtml}</div>`;
            }).join('')}
          </div>
          <div class="px-5 py-2.5 border-t border-zinc-800/60 flex items-center justify-between">
            <span class="text-[9px] font-mono text-zinc-700">main</span>
            <span class="text-[9px] font-mono text-zinc-700">Live &middot; polls every 10s</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ─── Feature Cards (Left Panel) ─────────────────────────────────────────────────

function renderFeatureCards() {
  const container = document.getElementById('features-container');
  if (!container) return;

  const waves = [...new Set(FEATURES.map(f => f.wave))].sort((a, b) => a - b);
  const withStatus = FEATURES.map(f => ({ ...f, liveStatus: resolveStatus(f.id, f.wave) }));
  const filtered = withStatus.filter(f => {
    if (waveFilter !== null && f.wave !== waveFilter) return false;
    if (progressFilter === 'done' && f.liveStatus !== 'done') return false;
    if (progressFilter === 'in-progress' && f.liveStatus !== 'in-progress') return false;
    if (progressFilter === 'planned' && f.liveStatus !== 'planned') return false;
    return true;
  });
  const totalDone = withStatus.filter(f => f.liveStatus === 'done').length;

  const statusLabel = { done: 'DONE', 'in-progress': 'IN PROGRESS', planned: 'planned' };
  const statusColor = { done: 'text-emerald-400 bg-emerald-500/10 ring-emerald-500/20', 'in-progress': 'text-blue-400 bg-blue-500/10 ring-blue-500/20', planned: 'text-zinc-600 bg-zinc-800/40 ring-zinc-700/30' };
  const statusDot = { done: '●', 'in-progress': '◑', planned: '○' };

  // View toggle
  const viewToggle = `
    <div class="flex items-center gap-0.5 rounded-lg border border-zinc-700/60 bg-zinc-800/40 p-0.5">
      <button type="button" onclick="setViewMode('card')" class="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium transition ${viewMode === 'card' ? 'bg-zinc-700 text-zinc-200 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="1" width="4.5" height="4.5" rx="0.7"/><rect x="7.5" y="1" width="4.5" height="4.5" rx="0.7"/><rect x="1" y="7.5" width="4.5" height="4.5" rx="0.7"/><rect x="7.5" y="7.5" width="4.5" height="4.5" rx="0.7"/></svg>
        Cards
      </button>
      <button type="button" onclick="setViewMode('hierarchy')" class="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium transition ${viewMode === 'hierarchy' ? 'bg-zinc-700 text-zinc-200 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="2.5" cy="6.5" r="1.2"/><circle cx="10.5" cy="2.5" r="1.2"/><circle cx="10.5" cy="10.5" r="1.2"/><line x1="3.7" y1="6.5" x2="7.5" y2="6.5"/><line x1="7.5" y1="2.5" x2="9.3" y2="2.5"/><line x1="7.5" y1="10.5" x2="9.3" y2="10.5"/><line x1="7.5" y1="2.5" x2="7.5" y2="10.5"/></svg>
        Hierarchy
      </button>
    </div>
  `;

  // Wave filter pills
  const waveFilters = `
    <div class="flex flex-wrap gap-1 mb-1.5">
      <button type="button" onclick="setWaveFilter(null)" class="text-[9px] font-mono px-2 py-0.5 rounded-full ring-1 transition ${waveFilter === null ? 'text-zinc-200 bg-zinc-700 ring-zinc-600' : 'text-zinc-500 bg-transparent ring-zinc-700 hover:text-zinc-300'}">All waves</button>
      ${waves.map(w => {
        const c = WAVE_COLORS[w];
        const active = waveFilter === w;
        return `<button type="button" onclick="setWaveFilter(${w})" class="text-[9px] font-semibold px-2 py-0.5 rounded-full ring-1 transition ${active ? c.pill : 'text-zinc-600 ring-zinc-700 hover:text-zinc-300'}"}>W${w}</button>`;
      }).join('')}
    </div>
  `;

  // Progress filter
  const progressFilters = [
    { id: 'all', label: 'All' }, { id: 'done', label: 'Done' },
    { id: 'in-progress', label: 'Active' }, { id: 'planned', label: 'Planned' },
  ].map(({ id, label }) =>
    `<button type="button" onclick="setProgressFilter('${id}')" class="text-[9px] px-2 py-0.5 rounded-full ring-1 transition ${progressFilter === id ? 'text-zinc-200 bg-zinc-700 ring-zinc-600' : 'text-zinc-600 ring-zinc-700/60 hover:text-zinc-400'}">${label}</button>`
  ).join('');

  // Header
  let html = `
    <div class="sticky top-0 z-10 bg-zinc-950/95 backdrop-blur-sm pb-2 border-b border-zinc-800/60 mb-3 flex-shrink-0">
      <div class="mb-2 flex items-center justify-between">
        <div>
          <h2 class="text-[11px] font-bold text-zinc-300">Feature Roadmap</h2>
          <p class="text-[9px] text-zinc-600 font-mono">${totalDone}/${FEATURES.length} stories &middot; ${waves.length} waves</p>
        </div>
        ${viewToggle}
      </div>
      ${waveFilters}
      <div class="flex gap-1">${progressFilters}</div>
    </div>
  `;

  // Helpers for rendering a card
  function cardHtml(f) {
    const c = WAVE_COLORS[f.wave];
    const vm = VERSION_META[f.version] || {};
    return `
      <div class="rounded-lg border ${f.liveStatus === 'done' ? c.border : 'border-zinc-800'} bg-zinc-900/60 p-3 space-y-2">
        <div class="flex items-center gap-2">
          <span class="text-[9px] font-bold px-1.5 py-0.5 rounded ring-1 ${c.pill}">W${f.wave}</span>
          <span class="text-[9px] font-mono text-zinc-600">${f.id}</span>
          ${vm.pill ? `<span class="text-[8px] font-mono px-1.5 py-0.5 rounded ring-1 ${vm.pill}">${vm.label}</span>` : ''}
          <span class="ml-auto text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ring-1 ${statusColor[f.liveStatus]}">${statusLabel[f.liveStatus]}</span>
        </div>
        <h3 class="text-[11px] font-semibold text-zinc-200">${f.title}</h3>
        <p class="text-[10px] text-zinc-500 leading-relaxed">${f.description}</p>
        ${f.packages.length > 0 ? `<div class="flex flex-wrap gap-1">${f.packages.map(pkg => `<a href="${pkg.url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] text-zinc-400 hover:text-zinc-200 transition">${pkg.name}${pkg.stars ? ` <span class="text-zinc-600">${pkg.stars}</span>` : ''}</a>`).join('')}</div>` : ''}
      </div>
    `;
  }

  // Helpers for rendering a wave accordion row (hierarchy view)
  function storyRowHtml(f) {
    const dotColor = statusColor[f.liveStatus].split(' ')[0];
    return `
      <div class="w-full flex items-start gap-2 py-1 px-1.5 rounded hover:bg-zinc-800/50 transition text-left">
        <span class="flex-shrink-0 text-[9px] font-mono ${dotColor} mt-0.5">${statusDot[f.liveStatus]}</span>
        <div class="flex-1 min-w-0">
          <div class="flex items-baseline gap-1.5 flex-wrap">
            <span class="text-[9px] font-mono text-zinc-600">${f.id}</span>
            <span class="text-[11px] font-medium ${f.liveStatus === 'done' ? 'text-zinc-400 line-through decoration-zinc-600' : 'text-zinc-300'} leading-tight">${f.title}</span>
          </div>
        </div>
        <span class="flex-shrink-0 text-[8px] font-mono px-1 py-0.5 rounded ring-1 ${statusColor[f.liveStatus]} ml-1">${statusLabel[f.liveStatus]}</span>
      </div>
    `;
  }

  function waveAccordionHtml(w, wFeatures) {
    const c = WAVE_COLORS[w];
    const doneCt = wFeatures.filter(f => f.liveStatus === 'done').length;
    const allDone = doneCt === wFeatures.length;
    return `
      <div class="rounded-lg border border-zinc-800/60 bg-zinc-900/30 overflow-hidden">
        <div class="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-zinc-800/40 transition text-left cursor-pointer" onclick="this.nextElementSibling.classList.toggle('hidden')">
          <span class="text-zinc-600"><svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 2.5L7.5 5.5L3.5 8.5"/></svg></span>
          <span class="text-[10px] font-bold ${c.text}">W${w}</span>
          <span class="text-[10px] font-medium text-zinc-400">${WAVE_LABELS[w]}</span>
          <span class="ml-auto text-[9px] font-mono text-zinc-600">${doneCt}/${wFeatures.length}</span>
          ${allDone ? `<span class="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ring-1 ${c.pill}">SHIPPED</span>` : ''}
        </div>
        <div class="px-2 pb-2 space-y-0.5 border-t border-zinc-800/60">${wFeatures.map(storyRowHtml).join('')}</div>
      </div>
    `;
  }

  // Content
  if (filtered.length === 0) {
    html += '<p class="text-[10px] font-mono text-zinc-700 text-center py-8">No stories match the current filters.</p>';
  } else if (waveFilter !== null) {
    // Single-wave view — no version banner needed
    if (viewMode === 'card') {
      html += `<div class="space-y-2.5">${filtered.map(cardHtml).join('')}</div>`;
    } else {
      html += `<div class="space-y-2">${waveAccordionHtml(waveFilter, filtered)}</div>`;
    }
  } else {
    // All waves — group by version with visual separators
    html += '<div class="space-y-5">';
    VERSION_ORDER.forEach(ver => {
      const verFeatures = filtered.filter(f => f.version === ver);
      if (verFeatures.length === 0) return;
      const vm = VERSION_META[ver];
      const verDone = verFeatures.filter(f => f.liveStatus === 'done').length;
      const allDone = verDone === verFeatures.length;
      const pct = Math.round((verDone / verFeatures.length) * 100);

      // Version banner
      html += `
        <div>
          <div class="flex items-center gap-2.5 mb-2.5 pb-2 border-b ${vm.border}">
            <span class="text-[10px] font-bold font-mono px-2 py-0.5 rounded ring-1 ${vm.pill}">${vm.label}</span>
            <span class="text-[12px] font-semibold ${vm.text}">${vm.name}</span>
            <div class="flex-1 mx-2 h-1 rounded-full bg-zinc-800 overflow-hidden">
              <div class="h-full rounded-full ${vm.bar} transition-all duration-500" style="width:${pct}%"></div>
            </div>
            <span class="text-[9px] font-mono text-zinc-600">${verDone}/${verFeatures.length}</span>
            ${allDone ? `<span class="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ring-1 ${vm.pill}">SHIPPED</span>` : ''}
          </div>
      `;

      if (viewMode === 'card') {
        html += `<div class="space-y-2.5">${verFeatures.map(cardHtml).join('')}</div>`;
      } else {
        const verWaves = [...new Set(verFeatures.map(f => f.wave))].sort((a, b) => a - b);
        html += '<div class="space-y-2">';
        verWaves.forEach(w => {
          const wFeatures = verFeatures.filter(f => f.wave === w);
          if (wFeatures.length > 0) html += waveAccordionHtml(w, wFeatures);
        });
        html += '</div>';
      }

      html += '</div>'; // end version group
    });
    html += '</div>';
  }

  container.innerHTML = html;
}

function setViewMode(mode) { viewMode = mode; renderFeatureCards(); }
function setWaveFilter(wave) { waveFilter = waveFilter === wave ? null : wave; renderFeatureCards(); }
function setProgressFilter(filter) { progressFilter = filter; renderFeatureCards(); }

// ─── Architecture SVG ───────────────────────────────────────────────────────────

// Architecture diagram tab state
let archTab = 'system'; // 'system' | 'npm'
let npmSvgCache = null;

function renderArchitecture() {
  const container = document.getElementById('architecture-container');
  if (!container) return;

  const agentCount = apmState.agents?.length || 0;
  const apmDot = apmState.connected ? '#10b981' : '#ef4444';

  const tabClass = (id) => id === archTab
    ? 'px-3 py-1.5 text-[11px] font-semibold rounded-md transition-all bg-zinc-800 text-zinc-200 ring-1 ring-zinc-700'
    : 'px-3 py-1.5 text-[11px] font-medium rounded-md transition-all text-zinc-500 hover:text-zinc-400 hover:bg-zinc-800/40';

  const systemSvg = `<svg viewBox="0 0 800 420" xmlns="http://www.w3.org/2000/svg" class="w-full" role="img" aria-label="CCEM System Architecture">
          <defs>
            <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <marker id="arrow" viewBox="0 0 10 7" refX="10" refY="3.5" markerWidth="8" markerHeight="6" orient="auto-start-reverse"><path d="M0,0 L10,3.5 L0,7" fill="#52525b"/></marker>
          </defs>
          <g class="arch-node" style="animation-delay:0.1s"><rect x="180" y="12" width="440" height="70" rx="8" fill="#18181b" stroke="#6366f180" stroke-width="1.5"/><text x="400" y="34" text-anchor="middle" fill="#a5b4fc" font-size="10" font-weight="600" font-family="Inter,sans-serif">BROWSER</text><text x="235" y="58" text-anchor="middle" fill="#a1a1aa" font-size="9" font-family="Inter,sans-serif">Dashboard</text><text x="340" y="58" text-anchor="middle" fill="#a1a1aa" font-size="9" font-family="Inter,sans-serif">19 LiveViews</text><text x="455" y="58" text-anchor="middle" fill="#a1a1aa" font-size="9" font-family="Inter,sans-serif">Notifications</text><text x="565" y="58" text-anchor="middle" fill="#a1a1aa" font-size="9" font-family="Inter,sans-serif">AG-UI Live</text></g>
          <line x1="400" y1="82" x2="400" y2="108" stroke="#52525b" stroke-width="1" marker-end="url(#arrow)" class="arch-edge" stroke-dasharray="4 4"/>
          <g class="arch-node" style="animation-delay:0.2s"><rect x="180" y="108" width="440" height="70" rx="8" fill="#18181b" stroke="#3b82f680" stroke-width="1.5"/><text x="400" y="130" text-anchor="middle" fill="#93c5fd" font-size="10" font-weight="600" font-family="Inter,sans-serif">PHOENIX API LAYER</text><text x="255" y="155" text-anchor="middle" fill="#a1a1aa" font-size="9" font-family="Inter,sans-serif">REST (56 endpoints)</text><text x="400" y="155" text-anchor="middle" fill="#a1a1aa" font-size="9" font-family="Inter,sans-serif">AG-UI SSE</text><text x="530" y="155" text-anchor="middle" fill="#a1a1aa" font-size="9" font-family="Inter,sans-serif">OpenAPI 3.0.3</text></g>
          <line x1="400" y1="178" x2="400" y2="204" stroke="#52525b" stroke-width="1" marker-end="url(#arrow)" class="arch-edge" stroke-dasharray="4 4"/>
          <g class="arch-node" style="animation-delay:0.3s"><rect x="40" y="204" width="720" height="100" rx="8" fill="#18181b" stroke="#a855f780" stroke-width="1.5"/><text x="400" y="226" text-anchor="middle" fill="#c4b5fd" font-size="10" font-weight="600" font-family="Inter,sans-serif">OTP GENSERVERS</text><rect x="60" y="240" width="120" height="28" rx="4" fill="#10b98115" stroke="#10b98140" stroke-width="1"/><text x="120" y="258" text-anchor="middle" fill="#6ee7b7" font-size="8" font-family="'Fira Code',monospace">AgentRegistry</text><rect x="195" y="240" width="110" height="28" rx="4" fill="#10b98115" stroke="#10b98140" stroke-width="1"/><text x="250" y="258" text-anchor="middle" fill="#6ee7b7" font-size="8" font-family="'Fira Code',monospace">EventRouter</text><rect x="320" y="240" width="110" height="28" rx="4" fill="#10b98115" stroke="#10b98140" stroke-width="1"/><text x="375" y="258" text-anchor="middle" fill="#6ee7b7" font-size="8" font-family="'Fira Code',monospace">StateManager</text><rect x="445" y="240" width="110" height="28" rx="4" fill="#10b98115" stroke="#10b98140" stroke-width="1"/><text x="500" y="258" text-anchor="middle" fill="#6ee7b7" font-size="8" font-family="'Fira Code',monospace">FormationStore</text><rect x="570" y="240" width="120" height="28" rx="4" fill="#10b98115" stroke="#10b98140" stroke-width="1"/><text x="630" y="258" text-anchor="middle" fill="#6ee7b7" font-size="8" font-family="'Fira Code',monospace">MetricsCollector</text><rect x="60" y="275" width="95" height="22" rx="4" fill="#3b82f610" stroke="#3b82f630" stroke-width="1"/><text x="107" y="290" text-anchor="middle" fill="#93c5fd" font-size="7" font-family="'Fira Code',monospace">ChatStore</text><rect x="170" y="275" width="115" height="22" rx="4" fill="#3b82f610" stroke="#3b82f630" stroke-width="1"/><text x="227" y="290" text-anchor="middle" fill="#93c5fd" font-size="7" font-family="'Fira Code',monospace">SkillsRegistry</text><rect x="300" y="275" width="115" height="22" rx="4" fill="#3b82f610" stroke="#3b82f630" stroke-width="1"/><text x="357" y="290" text-anchor="middle" fill="#93c5fd" font-size="7" font-family="'Fira Code',monospace">BackgroundTasks</text><rect x="430" y="275" width="115" height="22" rx="4" fill="#3b82f610" stroke="#3b82f630" stroke-width="1"/><text x="487" y="290" text-anchor="middle" fill="#93c5fd" font-size="7" font-family="'Fira Code',monospace">ProjectScanner</text><rect x="560" y="275" width="105" height="22" rx="4" fill="#3b82f610" stroke="#3b82f630" stroke-width="1"/><text x="612" y="290" text-anchor="middle" fill="#93c5fd" font-size="7" font-family="'Fira Code',monospace">ActionEngine</text></g>
          <g class="arch-node" style="animation-delay:0.4s"><rect x="40" y="340" width="200" height="65" rx="8" fill="#18181b" stroke="#f59e0b60" stroke-width="1.5" stroke-dasharray="6 3"/><text x="140" y="362" text-anchor="middle" fill="#fcd34d" font-size="10" font-weight="600" font-family="Inter,sans-serif">CLAUDE CODE</text><text x="100" y="385" text-anchor="middle" fill="#a1a1aa" font-size="8" font-family="Inter,sans-serif">Session Hooks</text><text x="180" y="385" text-anchor="middle" fill="#a1a1aa" font-size="8" font-family="Inter,sans-serif">Agents</text></g>
          <line x1="140" y1="340" x2="200" y2="304" stroke="#f59e0b50" stroke-width="1" marker-end="url(#arrow)" class="arch-edge" stroke-dasharray="4 4"/>
          <g class="arch-node" style="animation-delay:0.5s"><rect x="560" y="340" width="200" height="65" rx="8" fill="#18181b" stroke="#ef444460" stroke-width="1.5" stroke-dasharray="6 3"/><text x="660" y="362" text-anchor="middle" fill="#fca5a5" font-size="10" font-weight="600" font-family="Inter,sans-serif">CCEMAGENT</text><text x="620" y="385" text-anchor="middle" fill="#a1a1aa" font-size="8" font-family="Inter,sans-serif">macOS MenuBar</text><text x="710" y="385" text-anchor="middle" fill="#a1a1aa" font-size="8" font-family="Inter,sans-serif">Swift/AppKit</text></g>
          <line x1="660" y1="340" x2="600" y2="304" stroke="#ef444450" stroke-width="1" marker-end="url(#arrow)" class="arch-edge" stroke-dasharray="4 4"/>
          <g class="arch-node" style="animation-delay:0.6s"><rect x="290" y="340" width="220" height="65" rx="8" fill="#18181b" stroke="#6366f140" stroke-width="1" stroke-dasharray="6 3"/><text x="400" y="362" text-anchor="middle" fill="#a5b4fc" font-size="10" font-weight="600" font-family="Inter,sans-serif">EXTERNAL INTEGRATIONS</text><text x="340" y="385" text-anchor="middle" fill="#a1a1aa" font-size="8" font-family="Inter,sans-serif">Plane PM</text><text x="410" y="385" text-anchor="middle" fill="#a1a1aa" font-size="8" font-family="Inter,sans-serif">Linear</text><text x="470" y="385" text-anchor="middle" fill="#a1a1aa" font-size="8" font-family="Inter,sans-serif">GitHub</text></g>
          <line x1="400" y1="340" x2="400" y2="304" stroke="#6366f140" stroke-width="1" marker-end="url(#arrow)" class="arch-edge" stroke-dasharray="4 4"/>
          <circle cx="18" cy="18" r="6" fill="${apmDot}" filter="url(#glow-green)" class="dot-pulse"/><text x="30" y="22" fill="#a1a1aa" font-size="8" font-family="'Fira Code',monospace">APM ${apmState.connected ? 'LIVE' : 'OFFLINE'}</text>
        </svg>`;

  container.innerHTML = `
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-bold text-zinc-300">Architecture</h2>
        <div class="flex items-center gap-2">
          <span class="inline-block h-2 w-2 rounded-full dot-pulse" style="background:${apmDot}"></span>
          <span class="text-[10px] font-mono text-zinc-600">${agentCount} agents registered</span>
        </div>
      </div>
      <div class="flex items-center gap-1 rounded-lg bg-zinc-900/80 p-1 ring-1 ring-zinc-800">
        <button data-arch-tab="system" class="${tabClass('system')}">System</button>
        <button data-arch-tab="npm" class="${tabClass('npm')}">npm Packages</button>
      </div>
      <div class="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 overflow-hidden">
        <div id="arch-diagram-system" style="display:${archTab === 'system' ? 'block' : 'none'}">
          ${systemSvg}
        </div>
        <div id="arch-diagram-npm" style="display:${archTab === 'npm' ? 'block' : 'none'}">
          <div id="npm-svg-host"></div>
        </div>
      </div>
    </div>
  `;

  // Attach tab click handlers
  container.querySelectorAll('[data-arch-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      archTab = btn.dataset.archTab;
      renderArchitecture();
    });
  });

  // Load npm SVG (fetch once, then cache)
  if (archTab === 'npm') {
    const host = document.getElementById('npm-svg-host');
    if (npmSvgCache) {
      host.innerHTML = npmSvgCache;
    } else {
      host.innerHTML = '<p class="text-center text-xs text-zinc-600 py-8">Loading diagram...</p>';
      fetch('diagrams/npm-packages.svg')
        .then(r => r.text())
        .then(svg => {
          npmSvgCache = svg;
          const current = document.getElementById('npm-svg-host');
          if (current) current.innerHTML = svg;
        })
        .catch(() => {
          const current = document.getElementById('npm-svg-host');
          if (current) current.innerHTML = '<p class="text-center text-xs text-red-400 py-8">Failed to load npm-packages.svg</p>';
        });
    }
  }
}

// ─── Inspector Panel (Right) ────────────────────────────────────────────────────

function renderInspector() {
  const container = document.getElementById('inspector-container');
  if (!container) return;

  const now = apmState.lastPoll ? apmState.lastPoll.toLocaleTimeString() : 'loading...';
  const overall = apmState.connected ? 'green' : 'red';

  let html = `
    <div class="flex items-center justify-between">
      <h2 class="text-sm font-bold text-zinc-300">Resource Inspector</h2>
      <div class="flex items-center gap-1.5">
        <span class="inline-block h-2 w-2 rounded-full ${STATUS_COLORS[overall].dot}"></span>
        <span class="text-[10px] text-zinc-600">${now}</span>
      </div>
    </div>
    <p class="text-[10px] text-zinc-600">Auto-refresh every 10s</p>
  `;

  const services = [
    { label: 'CCEM APM', status: apmState.connected ? 'green' : 'red', detail: apmState.connected ? 'localhost:3032' : 'unreachable' },
    { label: 'AG-UI EventRouter', status: apmState.connected ? 'green' : 'unknown', detail: apmState.connected ? 'routing' : 'unknown' },
    { label: 'CCEMAgent', status: 'amber', detail: 'menubar app' },
  ];
  html += inspectorSection('Services', services.map(s => `<div class="flex items-center justify-between py-1.5"><div class="flex items-center gap-2 min-w-0"><span class="inline-block h-2 w-2 flex-shrink-0 rounded-full ${STATUS_COLORS[s.status].dot}"></span><span class="text-xs text-zinc-300 truncate">${s.label}</span></div><span class="text-[10px] font-mono ${STATUS_COLORS[s.status].text} truncate max-w-[140px]">${s.detail}</span></div>`).join(''));

  if (apmState.status) {
    const st = apmState.status;
    html += inspectorSection('APM Status', [
      inspectorRow('Server', st.server || 'APM v5', 'green'),
      inspectorRow('Uptime', st.uptime || 'unknown'),
      inspectorRow('Agents', String(apmState.agents?.length || 0)),
      inspectorRow('Version', st.version || VERSION),
    ].join(''));
  }

  if (apmState.agents && apmState.agents.length > 0) {
    html += inspectorSection(`Agents (${apmState.agents.length})`, apmState.agents.slice(0, 8).map(a => `<div class="flex items-center justify-between py-1.5"><div class="flex items-center gap-2 min-w-0"><span class="inline-block h-2 w-2 flex-shrink-0 rounded-full ${a.status === 'active' ? STATUS_COLORS.green.dot : STATUS_COLORS.unknown.dot}"></span><span class="text-[10px] text-zinc-400 truncate font-mono">${a.agent_id || a.id || 'unknown'}</span></div><span class="text-[9px] font-mono text-zinc-600">${a.status || 'idle'}</span></div>`).join(''));
  }

  html += inspectorSection('Git', [inspectorRow('Branch', 'main'), inspectorRow('Version', VERSION), inspectorRow('Repo', 'peguesj/ccem-apm')].join(''));
  html += inspectorSection('Stack', [inspectorRow('Runtime', 'Elixir/OTP 27'), inspectorRow('Framework', 'Phoenix 1.7'), inspectorRow('UI', 'LiveView + daisyUI'), inspectorRow('Protocol', 'AG-UI (ag_ui_ex)'), inspectorRow('Agent', 'Swift/AppKit'), inspectorRow('Installer', 'Bash modular')].join(''));
  html += inspectorSection('DRTW Libraries', [inspectorRow('ag_ui_ex', 'v0.1.0 (Hex)'), inspectorRow('Phoenix', 'v1.7.x'), inspectorRow('LiveView', 'v1.0.x'), inspectorRow('Jason', 'JSON codec'), inspectorRow('Bandit', 'HTTP server'), inspectorRow('Tailwind', 'v3.x (CDN)')].join(''));
  html += inspectorSection('Key Endpoints', [inspectorRow('/api/status', 'GET', 'green'), inspectorRow('/api/agents', 'GET', 'green'), inspectorRow('/api/register', 'POST', 'green'), inspectorRow('/api/heartbeat', 'POST', 'green'), inspectorRow('/api/ag-ui/events', 'SSE', 'green'), inspectorRow('/api/v2/openapi.json', 'GET', 'green'), inspectorRow('/uat', 'LiveView', 'green')].join(''));

  container.innerHTML = html;
}

function inspectorSection(title, content) {
  return `<div class="space-y-1"><h3 class="text-[10px] font-bold uppercase tracking-wider text-zinc-600">${title}</h3><div class="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 divide-y divide-zinc-800/60">${content}</div></div>`;
}

function inspectorRow(label, value, dot) {
  return `<div class="flex items-center justify-between py-1.5"><div class="flex items-center gap-2">${dot ? `<span class="inline-block h-2 w-2 flex-shrink-0 rounded-full ${STATUS_COLORS[dot]?.dot || ''}"></span>` : ''}<span class="text-xs text-zinc-400">${label}</span></div><span class="font-mono text-[10px] text-zinc-300 truncate max-w-[140px]" title="${value}">${value}</span></div>`;
}

// ─── Bottom Bar ─────────────────────────────────────────────────────────────────

function renderBottomBar() {
  const bar = document.getElementById('bottom-bar');
  if (!bar) return;

  bar.innerHTML = `
    <div class="mx-auto flex w-full max-w-[1600px] items-center gap-3 px-6 py-3">
      <span class="flex-shrink-0 rounded bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-500 ring-1 ring-emerald-500/20">AG-UI</span>
      <input type="text" disabled placeholder="AG-UI chat coming soon — roadmap US-047 (WebSocket channel)" class="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none disabled:opacity-50"/>
      <button type="button" disabled class="flex-shrink-0 rounded-lg bg-zinc-700 px-4 py-2 text-xs font-bold text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed">Send</button>
    </div>
    <div class="border-t border-zinc-800/60 bg-zinc-950/60">
      <div class="mx-auto flex w-full max-w-[1600px] flex-wrap items-center justify-between gap-2 px-6 py-2">
        <div class="flex items-center gap-3 text-[10px] text-zinc-600 font-mono">
          <span class="text-zinc-500 font-semibold">CCEM ${VERSION}</span>
          <span>&middot;</span>
          <span>main</span>
          <span>&middot;</span>
          <span>&copy; 2026 LGTM / Jeremiah Pegues</span>
        </div>
        <div class="flex items-center gap-3 text-[10px] text-zinc-700">
          <a href="https://docs.ag-ui.com" target="_blank" rel="noopener noreferrer" class="hover:text-zinc-500 transition">AG-UI Protocol</a>
          <span>&middot;</span>
          <a href="https://github.com/peguesj/ccem" target="_blank" rel="noopener noreferrer" class="hover:text-zinc-500 transition">GitHub</a>
          <span>&middot;</span>
          <a href="https://github.com/peguesj/ccem-apm" target="_blank" rel="noopener noreferrer" class="hover:text-zinc-500 transition">APM Repo</a>
          <span>&middot;</span>
          <a href="http://localhost:3032" target="_blank" rel="noopener noreferrer" class="hover:text-zinc-500 transition">Dashboard</a>
          <span>&middot;</span>
          <span class="text-zinc-800">AG-UI SSE &middot; 56 endpoints</span>
        </div>
      </div>
    </div>
  `;
}

// ─── AG-UI SSE ──────────────────────────────────────────────────────────────────

let sseSource = null;
let formationProgress = new Map(); // month -> {pct, done, total, status, current}
let formationSummary = { alive: 0, total: 0, avg_pct: 0 };

function connectSSE() {
  if (sseSource) { try { sseSource.close(); } catch {} sseSource = null; }
  try {
    sseSource = new EventSource(`${APM_BASE}/api/v2/ag-ui/events`);

    sseSource.addEventListener('STATE_SNAPSHOT', (e) => {
      try {
        const d = JSON.parse(e.data);
        if (d.data && Array.isArray(d.data.agents)) {
          apmState.agents = d.data.agents;
          apmState.connected = true;
          apmState.apmConn = 'sse';
          orchState.agentsTotal = apmState.agents.length;
          orchState.agentsActive = apmState.agents.filter(a => a.status === 'active' || a.status === 'working').length;
          renderOrchestrationStatus();
          renderInspector();
        }
      } catch {}
    });

    sseSource.addEventListener('CUSTOM', (e) => {
      try {
        const ev = JSON.parse(e.data);
        const d = ev.data || {};
        if (d.event === 'formation_progress' && d.month) {
          formationProgress.set(d.month, { pct: d.pct || 0, done: d.done || 0, total: d.total || 0, status: d.status, current: d.current || '' });
          renderOrchestrationStatus();
        } else if (d.event === 'formation_summary') {
          formationSummary = { alive: d.alive || 0, total: d.total || 0, avg_pct: d.avg_pct || 0 };
          orchState.agentsActive = d.alive || orchState.agentsActive;
          renderOrchestrationStatus();
        }
      } catch {}
    });

    sseSource.addEventListener('message', () => {
      apmState.apmConn = 'sse';
      apmState.connected = true;
    });

    sseSource.onerror = () => {
      apmState.apmConn = 'polling';
      if (sseSource) { try { sseSource.close(); } catch {} sseSource = null; }
      setTimeout(connectSSE, 8000);
    };
  } catch {
    apmState.apmConn = 'polling';
  }
}

// ─── Init ───────────────────────────────────────────────────────────────────────

function init() {
  document.getElementById('version-badge').textContent = VERSION;
  document.getElementById('git-info').textContent = `${VERSION} · main`;

  renderOrchestrationStatus();
  renderFeatureCards();
  renderArchitecture();
  renderInspector();
  renderBottomBar();
  renderRoadmapModal();

  // AG-UI SSE primary — REST polling fallback
  connectSSE();

  pollAPM().then(() => {
    renderArchitecture();
  });

  setInterval(async () => {
    await pollAPM();
    renderArchitecture();
  }, POLL_INTERVAL);
}

init();
