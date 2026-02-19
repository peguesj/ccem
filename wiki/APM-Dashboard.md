# APM Dashboard

The Agentic Performance Monitor (APM) dashboard provides real-time visibility into Claude Code agent activity across all your projects. It is served by the APM v4 Phoenix server on port 3031.

## Accessing the Dashboard

```
http://localhost:3031
```

If multiple projects are registered, the root URL shows a **project selector** landing page. Click any project card to view its dedicated dashboard. The currently active project is highlighted with a blue border.

## Dashboard Layout

The main project dashboard has two panels:

### Left Panel (Main Content)

**Stat Cards** -- Six metrics displayed at the top:
- **Agents**: Total registered agents for this project
- **Done**: Number of agents with `completed` status
- **Tokens In**: Total input tokens consumed across all agents
- **Tokens Out**: Total output tokens generated
- **Tool Calls**: Total tool invocations
- **API Calls**: Total API round-trips

**Progress Bar** -- Visual indicator of completion percentage (completed agents / total agents).

**Dependency Graph** -- D3.js force-directed graph showing agent relationships:
- Nodes are color-coded by tier: blue (T1), purple (T2), orange (T3)
- Node fill indicates status: green (completed), yellow (running), gray (pending)
- Edges show dependency relationships between agents
- Click any node to select it and open the inspector

**Agent Fleet** -- Table of all agents with columns for name, tokens in, tokens out, tool calls, output size (KB), and status. Click any row to inspect the agent.

**Bottom Grid** -- Task list and event log side by side.

### Right Panel (Tabs)

**Inspector** -- Detailed view of the selected agent:
- Agent metadata (name, ID, tier, status)
- Token usage breakdown (in, out, cache)
- Tool and API call counts
- Output file size
- Plane PM context (if registered)
- Upstream and downstream dependencies
- Mini dependency subgraph
- Last output message snippet

**Ralph** -- Ralph methodology display:
- Project name and branch
- Story progress (passed/total with progress bar)
- Story list with ID, title, pass/fail badge, module, priority, and notes
- Toggle to flowchart view showing D3.js node graph of stories (green = pass, red = fail)

**Commands** -- Registered slash commands organized by category. Each shows name, description, and status (active/available/completed).

**TODOs** -- Active and completed task lists synced via the `/api/tasks/sync` endpoint.

## Notifications

The bell icon in the top-right header shows unread notification count. Click it to open the notification dropdown:

- **Categories**: info (blue), success (green), warning (yellow), error (red), input (purple), system (gray)
- **Mark all read**: Clears unread badges
- **Browser notifications**: When the tab is not focused, critical notifications trigger native browser notifications (requires permission)

## Real-Time Updates

The dashboard auto-refreshes every 2 seconds via polling (v3 Python) or PubSub WebSocket (v4 Phoenix LiveView). Changes to agent status, token counts, notifications, and Ralph progress appear without manual refresh.

## Agent Discovery

Agents are discovered automatically by scanning the project's `tasks_dir` for `*.output` files. The `AgentDiscovery` GenServer (v4) polls every 5 seconds. You can also trigger a manual scan:

```bash
curl http://localhost:3031/api/agents/discover?project=my-project
```

Agent status is determined by parsing the JSONL output file tail:
- `idle`: Empty output file
- `running`: Output file exists but no `stop_reason: end_turn` found
- `completed`: `stop_reason: end_turn` detected in file tail

## LiveView Pages (v4 Only)

| URL | Description |
|-----|-------------|
| `/` | Main dashboard with project selector |
| `/apm-all` | All-projects overview |
| `/ralph` | Dedicated Ralph flowchart view |
| `/skills` | Skills tracking |
| `/timeline` | Session timeline |

## API Access

All dashboard data is available programmatically via the REST API. See the [APM v4 API Reference](../docs/apm-v4-api.md) for complete endpoint documentation.

Common queries:

```bash
# Server health
curl http://localhost:3031/health

# All dashboard data for active project
curl http://localhost:3031/api/data

# Data for a specific project
curl http://localhost:3031/api/data?project=ccem

# Ralph progress
curl http://localhost:3031/api/ralph

# List all projects
curl http://localhost:3031/api/projects
```
