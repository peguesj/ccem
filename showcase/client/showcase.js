/**
 * CCEM Showcase — GIMME-Style Live Dashboard
 *
 * Three-column layout with live APM polling:
 *   Left   — Feature cards grouped by wave (CCEM capabilities)
 *   Center — Architecture SVG + Wave progress board + Narrative content
 *   Right  — Resource inspector (polls APM every 10s)
 *
 * No build step. Served via `python3 -m http.server 8080` from showcase/client/
 * APM endpoint: http://localhost:3032
 */

// ─── Constants ──────────────────────────────────────────────────────────────────

const APM_BASE = 'http://localhost:3032';
const POLL_INTERVAL = 10_000; // 10s
const VERSION = 'v5.3.0';

const WAVE_COLORS = {
  1: { hex: '#10b981', name: 'emerald', label: 'Foundation',   bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.3)', text: '#6ee7b7' },
  2: { hex: '#3b82f6', name: 'blue',    label: 'Core',         bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.3)', text: '#93c5fd' },
  3: { hex: '#a855f7', name: 'purple',  label: 'Dashboard',    bg: 'rgba(168,85,247,0.08)', border: 'rgba(168,85,247,0.3)', text: '#c4b5fd' },
  4: { hex: '#f59e0b', name: 'amber',   label: 'Tools',        bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.3)', text: '#fcd34d' },
  5: { hex: '#ef4444', name: 'red',     label: 'Integration',  bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.3)',  text: '#fca5a5' },
};

const STATUS_COLORS = {
  green:   { dot: 'bg-emerald-500 shadow-emerald-500/60 shadow-sm', text: 'text-emerald-400' },
  amber:   { dot: 'bg-yellow-500 shadow-yellow-500/60 shadow-sm',   text: 'text-yellow-400' },
  red:     { dot: 'bg-red-500 shadow-red-500/60 shadow-sm',         text: 'text-red-400' },
  unknown: { dot: 'bg-zinc-600',                                     text: 'text-zinc-500' },
};

// ─── Feature Data ───────────────────────────────────────────────────────────────

const FEATURES = [
  // Wave 1: Foundation
  { id: 'ag-ui-protocol', title: 'AG-UI Protocol', wave: 1, status: 'done',
    desc: '30 typed event categories via ag_ui_ex Hex package. SSE transport, compile-time constants.',
    tags: ['ag_ui_ex', 'SSE', 'EventType'] },
  { id: 'event-router', title: 'Event Router', wave: 1, status: 'done',
    desc: 'Central dispatch: routes AG-UI events to AgentRegistry, FormationStore, Dashboard, Metrics.',
    tags: ['GenServer', 'PubSub', 'cast'] },
  { id: 'event-stream', title: 'Event Stream', wave: 1, status: 'done',
    desc: 'Emit and retrieve events. PubSub broadcast to all subscribers. Time-ordered.',
    tags: ['ETS', 'PubSub', 'emit/1'] },
  { id: 'hook-bridge', title: 'Hook Bridge', wave: 1, status: 'done',
    desc: 'Translates legacy register/heartbeat/notify into AG-UI event types. Zero-config.',
    tags: ['translate_*', 'backward-compat'] },
  { id: 'state-manager', title: 'State Manager', wave: 1, status: 'done',
    desc: 'Per-agent state with versioning. Simplified JSON Patch (add/remove/replace).',
    tags: ['ETS', 'delta', 'snapshot'] },

  // Wave 2: Core
  { id: 'agent-registry', title: 'Agent Registry', wave: 2, status: 'done',
    desc: 'Lifecycle tracking for all agents. Squadron/swarm/cluster hierarchy. Fire-and-forget registration.',
    tags: ['GenServer', 'ETS', '<1ms'] },
  { id: 'formation-model', title: 'Formation Model', wave: 2, status: 'done',
    desc: 'Hierarchical agent coordination. Squadrons > Swarms > Clusters > Agents.',
    tags: ['FormationStore', 'UpmStore'] },
  { id: 'metrics-collector', title: 'Metrics Collector', wave: 2, status: 'done',
    desc: 'Per-agent, per-project token economics. 12 x 5-min buckets, time-series.',
    tags: ['telemetry', 'cost-attribution'] },
  { id: 'chat-store', title: 'Chat Store', wave: 2, status: 'done',
    desc: 'Scoped message persistence. AG-UI TEXT_MESSAGE integration. PubSub real-time.',
    tags: ['GenServer', 'send_message/3'] },

  // Wave 3: Dashboard
  { id: 'liveview-dashboard', title: '19+ LiveView Dashboards', wave: 3, status: 'done',
    desc: 'Real-time Phoenix LiveView pages: agents, formations, analytics, health, tasks, scanner, actions, skills, notifications.',
    tags: ['Phoenix', 'LiveView', 'daisyUI'] },
  { id: 'sidebar-nav', title: 'Sidebar Navigation', wave: 3, status: 'done',
    desc: 'Unified sidebar across all 19 views. Active page highlighting, icon labels.',
    tags: ['component', 'sidebar_nav'] },
  { id: 'notification-panel', title: 'Notification Panel', wave: 3, status: 'done',
    desc: 'Tabbed categories: All, Agent, Formation, UPM, Skill. Toast overlays. Read/unread.',
    tags: ['PubSub', 'tabbed', 'toast'] },
  { id: 'health-checks', title: 'Health Check System', wave: 3, status: 'done',
    desc: 'HealthCheckRunner with 15-second refresh. Overall status badge. Manual run.',
    tags: ['runner', 'badge', 'auto-refresh'] },
  { id: 'ag-ui-live', title: 'AG-UI Dashboard', wave: 3, status: 'done',
    desc: 'Live AG-UI event viewer. State inspector. Protocol stats.',
    tags: ['AgUiLive', 'SSE', 'events'] },
  { id: 'conversation-monitor', title: 'Conversation Monitor', wave: 3, status: 'done',
    desc: 'Real-time conversation tracking across scopes. Message history viewer.',
    tags: ['ConversationMonitorLive', 'ChatStore'] },

  // Wave 4: Tools
  { id: 'ccem-agent', title: 'CCEMAgent', wave: 4, status: 'done',
    desc: 'Native macOS menubar companion. Swift/AppKit. Telemetry charts, task management, start/stop APM.',
    tags: ['Swift', 'AppKit', 'menubar'] },
  { id: 'skill-health', title: 'Skill Health Monitor', wave: 4, status: 'done',
    desc: 'SkillsRegistryStore with health scoring. Audit engine. Fix frontmatter/triggers.',
    tags: ['SkillsLive', 'audit', 'health'] },
  { id: 'project-scanner', title: 'Project Scanner', wave: 4, status: 'done',
    desc: 'Auto-discovery of projects, stacks, ports, hooks, MCPs, CLAUDE.md sections.',
    tags: ['ProjectScanner', 'scan_claude_native'] },
  { id: 'bg-tasks', title: 'Background Task Manager', wave: 4, status: 'done',
    desc: 'Track Claude Code background tasks. Logs, stop, delete. 5s auto-refresh.',
    tags: ['BackgroundTasksStore', 'REST'] },
  { id: 'action-engine', title: 'Action Engine', wave: 4, status: 'done',
    desc: '4-action catalog: update_hooks, add_memory_pointer, backfill_apm_config, analyze_project.',
    tags: ['ActionEngine', 'async'] },

  // Wave 5: Integration
  { id: 'uat-testing', title: 'UAT Testing Panel', wave: 5, status: 'done',
    desc: '14 test cases across 6 categories. Live in-browser AG-UI subsystem exerciser.',
    tags: ['UatLive', '14 tests', 'exerciser'] },
  { id: 'showcase', title: 'Showcase Generator', wave: 5, status: 'done',
    desc: 'IP-safe architecture diagrams. C4 abstraction. GIMME-style live dashboard.',
    tags: ['SVG', 'WCAG AA', 'redaction'] },
  { id: 'installer', title: 'Cross-Platform Installer', wave: 5, status: 'done',
    desc: 'Modular install.sh with libs: ui, detect, deps, build, hooks, service.',
    tags: ['bash', 'modular', 'launchd'] },
  { id: 'upm-orchestration', title: 'UPM Orchestration', wave: 5, status: 'done',
    desc: 'End-to-end: plan > build > verify > ship. Formation deployment. Plane PM sync.',
    tags: ['UPM', 'formation', 'Plane'] },
  { id: 'openapi-spec', title: 'OpenAPI 3.0.3 Spec', wave: 5, status: 'done',
    desc: '56 endpoints across 21 categories. Scalar interactive docs at /api/docs.',
    tags: ['56 paths', 'Scalar', 'REST'] },
];

// ─── APM State ──────────────────────────────────────────────────────────────────

let apmState = {
  connected: false,
  status: null,
  agents: [],
  lastPoll: null,
  pollCount: 0,
};

// ─── Polling ────────────────────────────────────────────────────────────────────

async function pollAPM() {
  try {
    const [statusRes, agentsRes] = await Promise.allSettled([
      fetch(`${APM_BASE}/api/status`, { signal: AbortSignal.timeout(3000) }),
      fetch(`${APM_BASE}/api/agents`, { signal: AbortSignal.timeout(3000) }),
    ]);

    if (statusRes.status === 'fulfilled' && statusRes.value.ok) {
      apmState.status = await statusRes.value.json();
      apmState.connected = true;
    } else {
      apmState.connected = false;
    }

    if (agentsRes.status === 'fulfilled' && agentsRes.value.ok) {
      apmState.agents = await agentsRes.value.json();
    }

    apmState.lastPoll = new Date();
    apmState.pollCount++;
  } catch {
    apmState.connected = false;
  }
  renderInspector();
  renderStatusBar();
}

// ─── Renderers ──────────────────────────────────────────────────────────────────

function renderFeatureCards() {
  const container = document.getElementById('features-container');
  if (!container) return;

  let html = `
    <div class="flex items-center justify-between mb-3">
      <h2 class="text-sm font-bold text-zinc-300">Capabilities</h2>
      <span class="text-[10px] font-mono text-zinc-600">${FEATURES.length} features</span>
    </div>
    <div class="flex flex-wrap gap-1 mb-4" id="wave-filters">
      <button class="wave-filter active rounded-full px-2 py-0.5 text-[9px] font-medium ring-1 ring-zinc-600/40 bg-zinc-800/60 text-zinc-300 transition" data-wave="all">All</button>
      ${Object.entries(WAVE_COLORS).map(([w, c]) => `
        <button class="wave-filter rounded-full px-2 py-0.5 text-[9px] font-medium ring-1 transition"
          data-wave="${w}"
          style="color:${c.text}; border-color:${c.border}; background:${c.bg}">
          W${w}
        </button>
      `).join('')}
    </div>
  `;

  for (const [waveNum, waveConfig] of Object.entries(WAVE_COLORS)) {
    const waveFeatures = FEATURES.filter(f => f.wave === parseInt(waveNum));
    if (waveFeatures.length === 0) continue;

    html += `
      <div class="wave-group mb-4" data-wave="${waveNum}">
        <div class="section-toggle flex items-center gap-2 mb-2 cursor-pointer" data-target="wave-${waveNum}">
          <span class="chevron text-zinc-600 text-[10px] transition-transform">&#9660;</span>
          <span class="inline-block h-2 w-2 rounded-full" style="background:${waveConfig.hex}"></span>
          <span class="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Wave ${waveNum}: ${waveConfig.label}</span>
          <span class="text-[9px] font-mono text-zinc-700">${waveFeatures.length}</span>
        </div>
        <div class="section-body space-y-1.5 stagger-children" id="wave-${waveNum}">
          ${waveFeatures.map(f => renderFeatureCard(f, waveConfig)).join('')}
        </div>
      </div>
    `;
  }

  container.innerHTML = html;

  container.querySelectorAll('.section-toggle').forEach(el => {
    el.addEventListener('click', () => {
      el.classList.toggle('collapsed');
    });
  });

  container.querySelectorAll('.wave-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      const wave = btn.dataset.wave;
      container.querySelectorAll('.wave-filter').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      container.querySelectorAll('.wave-group').forEach(g => {
        g.style.display = (wave === 'all' || g.dataset.wave === wave) ? '' : 'none';
      });
    });
  });
}

function renderFeatureCard(feature, waveConfig) {
  const statusBadge = feature.status === 'done'
    ? `<span class="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[8px] font-bold text-emerald-400 ring-1 ring-emerald-500/30">
        <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3 5.5L6.5 2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        DONE</span>`
    : feature.status === 'in_progress'
    ? `<span class="rounded-full bg-blue-500/15 px-1.5 py-0.5 text-[8px] font-bold text-blue-400 ring-1 ring-blue-500/30">ACTIVE</span>`
    : `<span class="rounded-full bg-zinc-800/60 px-1.5 py-0.5 text-[8px] font-bold text-zinc-500 ring-1 ring-zinc-700/30">PLANNED</span>`;

  return `
    <div class="feature-card rounded-lg border border-zinc-800/60 bg-zinc-900/40 p-2.5 space-y-1.5"
         style="border-left: 2px solid ${waveConfig.hex}40">
      <div class="flex items-start justify-between gap-2">
        <span class="text-xs font-medium text-zinc-200 leading-tight">${feature.title}</span>
        ${statusBadge}
      </div>
      <p class="text-[10px] text-zinc-500 leading-relaxed">${feature.desc}</p>
      <div class="flex flex-wrap gap-1">
        ${feature.tags.map(t => `<span class="rounded bg-zinc-800/80 px-1 py-0.5 text-[8px] font-mono text-zinc-600">${t}</span>`).join('')}
      </div>
    </div>
  `;
}

// ─── Architecture SVG ───────────────────────────────────────────────────────────

function renderArchitecture() {
  const container = document.getElementById('architecture-container');
  if (!container) return;

  const agentCount = apmState.agents?.length || 0;
  const apmDot = apmState.connected ? '#10b981' : '#ef4444';

  container.innerHTML = `
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-bold text-zinc-300">System Architecture</h2>
        <div class="flex items-center gap-2">
          <span class="inline-block h-2 w-2 rounded-full dot-pulse" style="background:${apmDot}"></span>
          <span class="text-[10px] font-mono text-zinc-600">${agentCount} agents registered</span>
        </div>
      </div>

      <div class="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 overflow-hidden">
        <svg viewBox="0 0 800 420" xmlns="http://www.w3.org/2000/svg" class="w-full" role="img" aria-label="CCEM System Architecture Diagram">
          <defs>
            <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <marker id="arrow" viewBox="0 0 10 7" refX="10" refY="3.5" markerWidth="8" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,3.5 L0,7" fill="#52525b"/>
            </marker>
          </defs>

          <!-- Layer: Browser / Dashboard -->
          <g class="arch-node" style="animation-delay:0.1s">
            <rect x="180" y="12" width="440" height="70" rx="8" fill="#18181b" stroke="#6366f180" stroke-width="1.5"/>
            <text x="400" y="34" text-anchor="middle" fill="#a5b4fc" font-size="10" font-weight="600" font-family="Inter,sans-serif">BROWSER</text>
            <text x="235" y="58" text-anchor="middle" fill="#a1a1aa" font-size="9" font-family="Inter,sans-serif">Dashboard</text>
            <text x="340" y="58" text-anchor="middle" fill="#a1a1aa" font-size="9" font-family="Inter,sans-serif">19 LiveViews</text>
            <text x="455" y="58" text-anchor="middle" fill="#a1a1aa" font-size="9" font-family="Inter,sans-serif">Notifications</text>
            <text x="565" y="58" text-anchor="middle" fill="#a1a1aa" font-size="9" font-family="Inter,sans-serif">AG-UI Live</text>
          </g>

          <!-- Edge: Browser → API -->
          <line x1="400" y1="82" x2="400" y2="108" stroke="#52525b" stroke-width="1" marker-end="url(#arrow)" class="arch-edge" stroke-dasharray="4 4"/>

          <!-- Layer: Phoenix API -->
          <g class="arch-node" style="animation-delay:0.2s">
            <rect x="180" y="108" width="440" height="70" rx="8" fill="#18181b" stroke="#3b82f680" stroke-width="1.5"/>
            <text x="400" y="130" text-anchor="middle" fill="#93c5fd" font-size="10" font-weight="600" font-family="Inter,sans-serif">PHOENIX API LAYER</text>
            <text x="255" y="155" text-anchor="middle" fill="#a1a1aa" font-size="9" font-family="Inter,sans-serif">REST (56 endpoints)</text>
            <text x="400" y="155" text-anchor="middle" fill="#a1a1aa" font-size="9" font-family="Inter,sans-serif">AG-UI SSE</text>
            <text x="530" y="155" text-anchor="middle" fill="#a1a1aa" font-size="9" font-family="Inter,sans-serif">OpenAPI 3.0.3</text>
          </g>

          <!-- Edge: API → GenServers -->
          <line x1="400" y1="178" x2="400" y2="204" stroke="#52525b" stroke-width="1" marker-end="url(#arrow)" class="arch-edge" stroke-dasharray="4 4"/>

          <!-- Layer: GenServers (OTP) -->
          <g class="arch-node" style="animation-delay:0.3s">
            <rect x="40" y="204" width="720" height="100" rx="8" fill="#18181b" stroke="#a855f780" stroke-width="1.5"/>
            <text x="400" y="226" text-anchor="middle" fill="#c4b5fd" font-size="10" font-weight="600" font-family="Inter,sans-serif">OTP GENSERVERS</text>

            <rect x="60" y="240" width="120" height="28" rx="4" fill="#10b98115" stroke="#10b98140" stroke-width="1"/>
            <text x="120" y="258" text-anchor="middle" fill="#6ee7b7" font-size="8" font-family="'Fira Code',monospace">AgentRegistry</text>

            <rect x="195" y="240" width="110" height="28" rx="4" fill="#10b98115" stroke="#10b98140" stroke-width="1"/>
            <text x="250" y="258" text-anchor="middle" fill="#6ee7b7" font-size="8" font-family="'Fira Code',monospace">EventRouter</text>

            <rect x="320" y="240" width="110" height="28" rx="4" fill="#10b98115" stroke="#10b98140" stroke-width="1"/>
            <text x="375" y="258" text-anchor="middle" fill="#6ee7b7" font-size="8" font-family="'Fira Code',monospace">StateManager</text>

            <rect x="445" y="240" width="110" height="28" rx="4" fill="#10b98115" stroke="#10b98140" stroke-width="1"/>
            <text x="500" y="258" text-anchor="middle" fill="#6ee7b7" font-size="8" font-family="'Fira Code',monospace">FormationStore</text>

            <rect x="570" y="240" width="120" height="28" rx="4" fill="#10b98115" stroke="#10b98140" stroke-width="1"/>
            <text x="630" y="258" text-anchor="middle" fill="#6ee7b7" font-size="8" font-family="'Fira Code',monospace">MetricsCollector</text>

            <rect x="60" y="275" width="95" height="22" rx="4" fill="#3b82f610" stroke="#3b82f630" stroke-width="1"/>
            <text x="107" y="290" text-anchor="middle" fill="#93c5fd" font-size="7" font-family="'Fira Code',monospace">ChatStore</text>

            <rect x="170" y="275" width="115" height="22" rx="4" fill="#3b82f610" stroke="#3b82f630" stroke-width="1"/>
            <text x="227" y="290" text-anchor="middle" fill="#93c5fd" font-size="7" font-family="'Fira Code',monospace">SkillsRegistry</text>

            <rect x="300" y="275" width="115" height="22" rx="4" fill="#3b82f610" stroke="#3b82f630" stroke-width="1"/>
            <text x="357" y="290" text-anchor="middle" fill="#93c5fd" font-size="7" font-family="'Fira Code',monospace">BackgroundTasks</text>

            <rect x="430" y="275" width="115" height="22" rx="4" fill="#3b82f610" stroke="#3b82f630" stroke-width="1"/>
            <text x="487" y="290" text-anchor="middle" fill="#93c5fd" font-size="7" font-family="'Fira Code',monospace">ProjectScanner</text>

            <rect x="560" y="275" width="105" height="22" rx="4" fill="#3b82f610" stroke="#3b82f630" stroke-width="1"/>
            <text x="612" y="290" text-anchor="middle" fill="#93c5fd" font-size="7" font-family="'Fira Code',monospace">ActionEngine</text>
          </g>

          <!-- External: Claude Code (left) -->
          <g class="arch-node" style="animation-delay:0.4s">
            <rect x="40" y="340" width="200" height="65" rx="8" fill="#18181b" stroke="#f59e0b60" stroke-width="1.5" stroke-dasharray="6 3"/>
            <text x="140" y="362" text-anchor="middle" fill="#fcd34d" font-size="10" font-weight="600" font-family="Inter,sans-serif">CLAUDE CODE</text>
            <text x="100" y="385" text-anchor="middle" fill="#a1a1aa" font-size="8" font-family="Inter,sans-serif">Session Hooks</text>
            <text x="180" y="385" text-anchor="middle" fill="#a1a1aa" font-size="8" font-family="Inter,sans-serif">Agents</text>
          </g>

          <line x1="140" y1="340" x2="200" y2="304" stroke="#f59e0b50" stroke-width="1" marker-end="url(#arrow)" class="arch-edge" stroke-dasharray="4 4"/>

          <!-- External: CCEMAgent (right) -->
          <g class="arch-node" style="animation-delay:0.5s">
            <rect x="560" y="340" width="200" height="65" rx="8" fill="#18181b" stroke="#ef444460" stroke-width="1.5" stroke-dasharray="6 3"/>
            <text x="660" y="362" text-anchor="middle" fill="#fca5a5" font-size="10" font-weight="600" font-family="Inter,sans-serif">CCEMAGENT</text>
            <text x="620" y="385" text-anchor="middle" fill="#a1a1aa" font-size="8" font-family="Inter,sans-serif">macOS MenuBar</text>
            <text x="710" y="385" text-anchor="middle" fill="#a1a1aa" font-size="8" font-family="Inter,sans-serif">Swift/AppKit</text>
          </g>

          <line x1="660" y1="340" x2="600" y2="304" stroke="#ef444450" stroke-width="1" marker-end="url(#arrow)" class="arch-edge" stroke-dasharray="4 4"/>

          <!-- External: Integrations (center bottom) -->
          <g class="arch-node" style="animation-delay:0.6s">
            <rect x="290" y="340" width="220" height="65" rx="8" fill="#18181b" stroke="#6366f140" stroke-width="1" stroke-dasharray="6 3"/>
            <text x="400" y="362" text-anchor="middle" fill="#a5b4fc" font-size="10" font-weight="600" font-family="Inter,sans-serif">EXTERNAL INTEGRATIONS</text>
            <text x="340" y="385" text-anchor="middle" fill="#a1a1aa" font-size="8" font-family="Inter,sans-serif">Plane PM</text>
            <text x="410" y="385" text-anchor="middle" fill="#a1a1aa" font-size="8" font-family="Inter,sans-serif">Linear</text>
            <text x="470" y="385" text-anchor="middle" fill="#a1a1aa" font-size="8" font-family="Inter,sans-serif">GitHub</text>
          </g>

          <line x1="400" y1="340" x2="400" y2="304" stroke="#6366f140" stroke-width="1" marker-end="url(#arrow)" class="arch-edge" stroke-dasharray="4 4"/>

          <!-- Live indicator -->
          <circle cx="18" cy="18" r="6" fill="${apmDot}" filter="url(#glow-green)" class="dot-pulse"/>
          <text x="30" y="22" fill="#a1a1aa" font-size="8" font-family="'Fira Code',monospace">APM ${apmState.connected ? 'LIVE' : 'OFFLINE'}</text>
        </svg>
      </div>
    </div>
  `;
}

// ─── Wave Progress Board ────────────────────────────────────────────────────────

function renderWaveBoard() {
  const container = document.getElementById('wave-board-container');
  if (!container) return;

  const waves = Object.entries(WAVE_COLORS);
  const totalDone = FEATURES.filter(f => f.status === 'done').length;

  let html = `
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-bold text-zinc-300">Implementation Progress</h2>
        <span class="text-[10px] font-mono text-zinc-500">${totalDone}/${FEATURES.length} complete</span>
      </div>
      <div class="grid grid-cols-5 gap-2">
  `;

  for (const [waveNum, waveConfig] of waves) {
    const waveFeatures = FEATURES.filter(f => f.wave === parseInt(waveNum));
    const done = waveFeatures.filter(f => f.status === 'done').length;
    const pct = Math.round((done / waveFeatures.length) * 100);

    html += `
      <div class="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 space-y-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1.5">
            <span class="inline-block h-2 w-2 rounded-full" style="background:${waveConfig.hex}"></span>
            <span class="text-[9px] font-bold uppercase tracking-wider" style="color:${waveConfig.text}">W${waveNum}</span>
          </div>
          <span class="text-[9px] font-mono text-zinc-600">${done}/${waveFeatures.length}</span>
        </div>
        <div class="text-[10px] text-zinc-400 font-medium">${waveConfig.label}</div>
        <div class="h-1 w-full rounded-full bg-zinc-800 overflow-hidden">
          <div class="h-full rounded-full transition-all duration-700" style="width:${pct}%; background:${waveConfig.hex}"></div>
        </div>
        <div class="space-y-0.5">
          ${waveFeatures.map(f => {
            const isDone = f.status === 'done';
            return `
              <div class="flex items-center gap-1.5 py-0.5" style="opacity:${isDone ? 1 : 0.4}">
                ${isDone
                  ? `<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" fill="${waveConfig.hex}30" stroke="${waveConfig.hex}" stroke-width="1"/><path d="M3 5L4.5 6.5L7 3.5" stroke="white" stroke-width="1" stroke-linecap="round"/></svg>`
                  : `<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" fill="none" stroke="#3f3f46" stroke-width="1" stroke-dasharray="2 2"/></svg>`
                }
                <span class="text-[9px] ${isDone ? 'text-zinc-400' : 'text-zinc-600'} truncate">${f.title}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  html += `</div></div>`;
  container.innerHTML = html;
}

// ─── Narrative Content ──────────────────────────────────────────────────────────

function renderNarrative(narrative = 'investor') {
  const container = document.getElementById('narrative-content');
  if (!container) return;

  const narratives = {
    investor: {
      title: 'Investor Narrative',
      sections: [
        { heading: 'The AI Development Explosion', body: '70% of developers use AI assistants daily. 46% of new code is AI-generated. The question is no longer whether developers will use AI \u2014 it is whether anyone can see what these agents are doing.', accent: '#6366f1', stat: '70%', statLabel: 'AI Assistant Adoption' },
        { heading: 'The Blind Spot Problem', body: 'A fleet of trucks with no GPS. Teams know code was committed and tests passed. They do not know which agent wrote which code, how many tokens were burned on dead ends, or whether two agents conflicted.', accent: '#6366f1', stat: '30%', statLabel: 'AI code needing rework by 2027' },
        { heading: 'Infrastructure Monitoring Parallel', body: 'Every infrastructure shift creates a monitoring category. Bare Metal \u2192 Nagios. Cloud \u2192 Datadog. Containers \u2192 Prometheus. AI Agents \u2192 ???', accent: '#818cf8', stat: '$40B+', statLabel: 'Combined APM market' },
        { heading: 'Introducing CCEM', body: 'Real-time APM for AI agents. One dashboard replaces blind faith with full situational awareness. Agent Registration, Formation Tracking, Token Economics, Environment Awareness.', accent: '#34d399', stat: '<1ms', statLabel: 'Registration overhead' },
        { heading: 'Traction & Validation', body: 'Production-grade, battle-tested. 56 API endpoints, 19+ real-time dashboards, 30 AG-UI event types. Not a mockup.', accent: '#34d399', stat: '56', statLabel: 'API Endpoints' },
        { heading: 'The Open Standard Play', body: 'AG-UI: OpenTelemetry for AI Agents. 30 event types, SSE transport. Community SDK contribution. First mover on the open protocol layer.', accent: '#818cf8', stat: '30', statLabel: 'AG-UI Event Types' },
        { heading: 'Vision: The AI Agent Control Plane', body: 'Not a tool. A control plane. Observe \u2192 Attribute \u2192 Govern \u2192 Optimize. The monitoring category for AI agents does not exist yet. We are building it.', accent: '#fbbf24', stat: '$45B', statLabel: 'AI dev tools by 2028' },
      ]
    },
    partner: {
      title: 'Partner Integration',
      sections: [
        { heading: 'Integration Landscape', body: '8-15 tools per developer. Zero unified agent visibility. IDE, AI assistants, VCS, CI/CD, PM, Monitoring \u2014 none know what the AI agents are doing.', accent: '#6366f1', stat: '8-15', statLabel: 'Tools per developer' },
        { heading: 'Bidirectional Architecture', body: 'Inbound telemetry from agents. Outbound intelligence to integrations. REST POST for registration/heartbeat, SSE/AG-UI for status events.', accent: '#818cf8', stat: '56', statLabel: 'REST endpoints' },
        { heading: 'PM Adapter Framework', body: 'Five callbacks: list_projects, list_work_items, create_work_item, update_work_item, test_connection. Plane + Linear reference implementations.', accent: '#34d399', stat: '5', statLabel: 'Adapter callbacks' },
        { heading: 'OpenAPI-First', body: '56-path OpenAPI 3.0.3 spec. Scalar interactive docs. Machine-readable integration surface.', accent: '#818cf8', stat: '3.0.3', statLabel: 'OpenAPI version' },
      ]
    },
    'product-demo': {
      title: 'Product Demo',
      sections: [
        { heading: 'Before CCEM', body: 'Developers launch AI agents and hope for the best. No visibility into what agents are doing, what they cost, or when they fail.', accent: '#ef4444', stat: '0', statLabel: 'Agent visibility' },
        { heading: 'With CCEM', body: 'Real-time dashboard showing every agent, its formation hierarchy, cost, and status. Native menubar companion. Fire-and-forget integration.', accent: '#10b981', stat: '19+', statLabel: 'Live dashboards' },
        { heading: 'How It Works', body: 'Agents register via REST POST (<1ms overhead). Heartbeats stream through. Events flow through AG-UI protocol. Dashboard updates in real-time via Phoenix LiveView.', accent: '#3b82f6', stat: '<1ms', statLabel: 'Registration overhead' },
      ]
    },
    internal: {
      title: 'Internal Technical Deep-Dive',
      sections: [
        { heading: 'OTP Architecture', body: 'Supervision tree with 10+ GenServers. ETS for hot reads. PubSub for real-time broadcast. Phoenix LiveView for zero-JS dashboard.', accent: '#a855f7', stat: '10+', statLabel: 'GenServers' },
        { heading: 'AG-UI Integration', body: 'ag_ui_ex Hex package (v0.1.0). 30 event type constants. EventRouter dispatches to AgentRegistry, FormationStore, Dashboard, MetricsCollector.', accent: '#10b981', stat: '30', statLabel: 'Event types' },
        { heading: 'Formation Model', body: 'Squadron > Swarm > Cluster > Agent. UpmStore + FormationStore GenServers. Wave-based deployment with TypeScript gating between waves.', accent: '#3b82f6', stat: '4', statLabel: 'Hierarchy levels' },
        { heading: 'Test Infrastructure', body: '14 UAT test cases across 6 categories: ag_ui_ex, event_stream, event_router, hook_bridge, state_manager, chat_store, e2e lifecycle.', accent: '#f59e0b', stat: '14', statLabel: 'UAT test cases' },
      ]
    },
  };

  const n = narratives[narrative] || narratives.investor;

  let html = `
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-bold text-zinc-300">${n.title}</h2>
        <span class="text-[10px] font-mono text-zinc-600">${n.sections.length} sections</span>
      </div>
      <div class="space-y-3 stagger-children">
  `;

  for (const section of n.sections) {
    html += `
      <div class="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 space-y-2">
        <div class="flex items-start justify-between">
          <h3 class="text-xs font-semibold text-zinc-200">${section.heading}</h3>
          ${section.stat ? `
            <div class="text-right flex-shrink-0 ml-4">
              <div class="text-lg font-bold" style="color:${section.accent}">${section.stat}</div>
              <div class="text-[8px] text-zinc-600 uppercase tracking-wider">${section.statLabel}</div>
            </div>
          ` : ''}
        </div>
        <p class="text-[11px] text-zinc-400 leading-relaxed">${section.body}</p>
      </div>
    `;
  }

  html += `</div></div>`;
  container.innerHTML = html;
}

// ─── Inspector Panel ────────────────────────────────────────────────────────────

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

  // Services
  const services = [
    { label: 'CCEM APM', status: apmState.connected ? 'green' : 'red', detail: apmState.connected ? 'localhost:3032' : 'unreachable' },
    { label: 'AG-UI EventRouter', status: apmState.connected ? 'green' : 'unknown', detail: apmState.connected ? 'routing' : 'unknown' },
    { label: 'CCEMAgent', status: 'amber', detail: 'menubar app' },
  ];

  html += inspectorSection('Services', services.map(s => `
    <div class="flex items-center justify-between py-1.5">
      <div class="flex items-center gap-2 min-w-0">
        <span class="inline-block h-2 w-2 flex-shrink-0 rounded-full ${STATUS_COLORS[s.status].dot}"></span>
        <span class="text-xs text-zinc-300 truncate">${s.label}</span>
      </div>
      <span class="text-[10px] font-mono ${STATUS_COLORS[s.status].text} truncate max-w-[140px]">${s.detail}</span>
    </div>
  `).join(''));

  // APM Data
  if (apmState.status) {
    const st = apmState.status;
    html += inspectorSection('APM Status', [
      inspectorRow('Server', st.server || 'APM v5', 'green'),
      inspectorRow('Uptime', st.uptime || 'unknown'),
      inspectorRow('Agents', String(apmState.agents?.length || 0)),
      inspectorRow('Version', st.version || VERSION),
    ].join(''));
  }

  // Agents list
  if (apmState.agents && apmState.agents.length > 0) {
    const rows = apmState.agents.slice(0, 8).map(a => `
      <div class="flex items-center justify-between py-1.5">
        <div class="flex items-center gap-2 min-w-0">
          <span class="inline-block h-2 w-2 flex-shrink-0 rounded-full ${a.status === 'active' ? STATUS_COLORS.green.dot : STATUS_COLORS.unknown.dot}"></span>
          <span class="text-[10px] text-zinc-400 truncate font-mono">${a.agent_id || a.id || 'unknown'}</span>
        </div>
        <span class="text-[9px] font-mono text-zinc-600">${a.status || 'idle'}</span>
      </div>
    `).join('');
    html += inspectorSection(`Agents (${apmState.agents.length})`, rows);
  }

  // Git
  html += inspectorSection('Git', [
    inspectorRow('Branch', 'main'),
    inspectorRow('Version', VERSION),
    inspectorRow('Submodule', 'apm-v4'),
  ].join(''));

  // Stack
  html += inspectorSection('Stack', [
    inspectorRow('Runtime', 'Elixir/OTP 27'),
    inspectorRow('Framework', 'Phoenix 1.7'),
    inspectorRow('UI', 'LiveView + daisyUI'),
    inspectorRow('Protocol', 'AG-UI (ag_ui_ex)'),
    inspectorRow('Agent', 'Swift/AppKit'),
    inspectorRow('Installer', 'Bash modular'),
  ].join(''));

  // DRTW Libraries
  html += inspectorSection('DRTW Libraries', [
    inspectorRow('ag_ui_ex', 'v0.1.0 (Hex)'),
    inspectorRow('Phoenix', 'v1.7.x'),
    inspectorRow('LiveView', 'v1.0.x'),
    inspectorRow('Jason', 'JSON codec'),
    inspectorRow('Bandit', 'HTTP server'),
    inspectorRow('Tailwind', 'v3.x (CDN)'),
  ].join(''));

  // Endpoints
  html += inspectorSection('Key Endpoints', [
    inspectorRow('/api/status', 'GET', 'green'),
    inspectorRow('/api/agents', 'GET', 'green'),
    inspectorRow('/api/register', 'POST', 'green'),
    inspectorRow('/api/heartbeat', 'POST', 'green'),
    inspectorRow('/api/ag-ui/events', 'SSE', 'green'),
    inspectorRow('/api/v2/openapi.json', 'GET', 'green'),
    inspectorRow('/uat', 'LiveView', 'green'),
  ].join(''));

  container.innerHTML = html;
}

function inspectorSection(title, content) {
  return `
    <div class="space-y-1">
      <h3 class="text-[10px] font-bold uppercase tracking-wider text-zinc-600">${title}</h3>
      <div class="rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 divide-y divide-zinc-800/60">
        ${content}
      </div>
    </div>
  `;
}

function inspectorRow(label, value, dot) {
  return `
    <div class="flex items-center justify-between py-1.5">
      <div class="flex items-center gap-2">
        ${dot ? `<span class="inline-block h-2 w-2 flex-shrink-0 rounded-full ${STATUS_COLORS[dot]?.dot || ''}"></span>` : ''}
        <span class="text-xs text-zinc-400">${label}</span>
      </div>
      <span class="font-mono text-[10px] text-zinc-300 truncate max-w-[140px]" title="${value}">${value}</span>
    </div>
  `;
}

// ─── Status Bar ─────────────────────────────────────────────────────────────────

function renderStatusBar() {
  const el = document.getElementById('apm-status');
  if (!el) return;
  if (apmState.connected) {
    el.innerHTML = `<span class="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1"></span>APM: connected`;
    el.className = 'font-mono text-emerald-500';
  } else {
    el.innerHTML = `<span class="inline-block h-1.5 w-1.5 rounded-full bg-red-500 mr-1"></span>APM: offline`;
    el.className = 'font-mono text-red-400';
  }
}

// ─── Narrative Tab Switching ────────────────────────────────────────────────────

function initNarrativeTabs() {
  document.querySelectorAll('.narrative-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.narrative-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const narrative = tab.dataset.narrative;
      document.getElementById('active-narrative').textContent =
        narrative.charAt(0).toUpperCase() + narrative.slice(1).replace('-', ' ');
      renderNarrative(narrative);
    });
  });
  const defaultTab = document.querySelector('.narrative-tab[data-narrative="investor"]');
  if (defaultTab) defaultTab.classList.add('active');
}

// ─── Git Info ───────────────────────────────────────────────────────────────────

function renderGitInfo() {
  const el = document.getElementById('git-info');
  if (el) el.textContent = `${VERSION} \u00B7 main`;
}

// ─── Init ───────────────────────────────────────────────────────────────────────

async function init() {
  renderGitInfo();
  renderFeatureCards();
  renderArchitecture();
  renderWaveBoard();
  renderNarrative('investor');
  renderInspector();
  initNarrativeTabs();

  await pollAPM();

  setInterval(async () => {
    await pollAPM();
    renderArchitecture();
  }, POLL_INTERVAL);
}

init();
