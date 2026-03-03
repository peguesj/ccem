#!/usr/bin/env python3
"""APM v3 - Agentic Performance Monitor
Full-featured dashboard with browser notifications, user input hooks,
TODO tracking, Ralph methodology display, slash commands, and D3.js graphs.

Forked from project scratchpad to ~/Developer/ccem/apm/
"""

import http.server
import json
import os
import time
import re
import threading
from datetime import datetime, timezone
from pathlib import Path

PORT = 3031
APM_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(APM_DIR, "apm_config.json")

# --- v4 Multi-Project Configuration ---
_DEFAULT_V4 = {
    "version": "4.0.0",
    "port": 3031,
    "active_project": None,
    "projects": [],
}


def load_config():
    """Load APM config. Handles both v4 (multi-project) and v3 (flat) formats.
    Always returns a dict with: version, port, active_project, projects."""
    if not os.path.exists(CONFIG_PATH):
        return dict(_DEFAULT_V4)
    try:
        with open(CONFIG_PATH) as f:
            raw = json.load(f)
    except Exception:
        return dict(_DEFAULT_V4)

    # v4: has version 4.x and projects array
    if raw.get("version", "").startswith("4.") and "projects" in raw:
        return {
            "version": raw["version"],
            "port": raw.get("port", 3031),
            "active_project": raw.get("active_project"),
            "projects": raw.get("projects", []),
        }

    # v3 backward compat: wrap flat config into v4 structure
    pname = raw.get("project_name", "default")
    proj = {"name": pname}
    for key in ("root", "project_root", "tasks_dir", "prd_json", "session_id", "session_jsonl", "todo_md"):
        if key in raw:
            proj[key] = raw[key]
    return {
        "version": "4.0.0",
        "port": raw.get("port", 3031),
        "active_project": pname,
        "projects": [proj],
    }


def get_project(name):
    """Return project config dict by name, or None."""
    for proj in CFG.get("projects", []):
        if proj.get("name") == name:
            return proj
    return None


def get_active_project():
    """Return the active project config dict, or None."""
    active = CFG.get("active_project")
    if not active:
        return None
    return get_project(active)


def reload_config():
    """Re-read config from disk and update globals."""
    global CFG, TASKS_DIR, SESSION_ID
    CFG = load_config()
    active = get_active_project()
    if active:
        TASKS_DIR = active.get("tasks_dir", os.path.join(APM_DIR, "tasks"))
        SESSION_ID = active.get("session_id", active.get("sessions", [{}])[0].get("session_id", "unknown") if active.get("sessions") else "unknown")
    else:
        TASKS_DIR = os.path.join(APM_DIR, "tasks")
        SESSION_ID = "unknown"


# --- Per-Project Data Isolation ---
PROJECTS_DATA = {}  # {"project_name": {"agents": {}, "tasks": [], "plane_pm": {}, "commands": [], "notifications": []}}


def ensure_project_data(name):
    """Initialize data namespace for a project if not exists."""
    if name not in PROJECTS_DATA:
        PROJECTS_DATA[name] = {
            "agents": {},
            "tasks": [],
            "plane_pm": {},
            "commands": [],
            "notifications": [],
        }
    return PROJECTS_DATA[name]


def _resolve_project(project_name=None):
    """Resolve project name: explicit > active_project config > 'default'."""
    return project_name or CFG.get("active_project") or "default"


# --- Module-level init ---
CFG = load_config()
_active = get_active_project()
TASKS_DIR = _active.get("tasks_dir", os.path.join(APM_DIR, "tasks")) if _active else os.path.join(APM_DIR, "tasks")
SESSION_ID = "unknown"
if _active:
    if _active.get("session_id"):
        SESSION_ID = _active["session_id"]
    elif _active.get("sessions"):
        SESSION_ID = _active["sessions"][0].get("session_id", "unknown")
del _active
SERVER_START_TIME = time.time()

# Initialize project data namespaces for all configured projects
for _p in CFG.get("projects", []):
    ensure_project_data(_p["name"])

# --- Notification System ---
_notifications = []
_notification_id = 0
_notification_lock = threading.Lock()

# --- User Input Queue ---
_input_requests = []
_input_responses = {}
_input_id = 0
_input_lock = threading.Lock()

# --- Dynamic Registries (populated via API, not hardcoded) ---
AGENTS = {}
TASKS = []
PLANE_PM = {}
SLASH_COMMANDS = []


def register_agent(agent_id, name="unknown", tier=1, status="idle", deps=None, metadata=None, project_name=None):
    """Register or update an agent. Stores in project namespace + global."""
    agent = {
        "name": name,
        "tier": tier,
        "status": status,
        "deps": deps or [],
        "plane": metadata or {},
    }
    proj = _resolve_project(project_name)
    data = ensure_project_data(proj)
    data["agents"][agent_id] = agent
    AGENTS[agent_id] = agent


def _extract_agent_name(output_file, fallback):
    """Extract a meaningful agent name from JSONL output file."""
    try:
        with open(output_file, "r") as f:
            tool_names = []
            for i, line in enumerate(f):
                if i >= 30:
                    break
                try:
                    d = json.loads(line.strip())
                    msg = d.get("message", {})
                    content = msg.get("content", [])
                    if not isinstance(content, list):
                        continue
                    for c in content:
                        if not isinstance(c, dict):
                            continue
                        if c.get("type") == "text":
                            text = c.get("text", "").strip()
                            if len(text) > 20:
                                # Clean up and truncate
                                name = text.replace("\n", " ")[:50].strip()
                                if name:
                                    return name
                        if c.get("type") == "tool_use" and c.get("name"):
                            tool_names.append(c["name"])
                except (json.JSONDecodeError, KeyError, TypeError):
                    pass
            if tool_names:
                return f"Agent ({', '.join(tool_names[:3])})"
    except Exception:
        pass
    return fallback


def _detect_agent_status(output_file):
    """Detect agent completion status from output file tail."""
    try:
        size = os.path.getsize(output_file)
        if size == 0:
            return "idle"
        with open(output_file, "rb") as f:
            f.seek(max(0, size - 10000))
            tail = f.read().decode("utf-8", errors="ignore")
            if '"stop_reason":"end_turn"' in tail or '"stop_reason": "end_turn"' in tail:
                return "completed"
        return "running"
    except Exception:
        return "discovered"


def discover_agents(tasks_dir=None, project_name=None):
    """Scan tasks directory for *.output files and register agents."""
    proj = _resolve_project(project_name)
    scan_dir = tasks_dir or TASKS_DIR
    if not os.path.isdir(scan_dir):
        return []
    data = ensure_project_data(proj)
    discovered = []
    for fname in os.listdir(scan_dir):
        if not fname.endswith(".output"):
            continue
        agent_id = fname.replace(".output", "")
        if agent_id not in data["agents"]:
            output_path = os.path.join(scan_dir, fname)
            agent_name = _extract_agent_name(output_path, agent_id)
            status = _detect_agent_status(output_path)
            register_agent(agent_id, name=agent_name, tier=1, status=status, project_name=proj)
            discovered.append(agent_id)
    return discovered


def get_ralph_flowchart_data(project_name=None):
    """Return D3-ready nodes and edges for Ralph flowchart."""
    ralph = get_ralph_data(project_name=project_name)
    if not ralph or not ralph.get("stories"):
        return {"nodes": [], "edges": []}
    stories = sorted(ralph["stories"], key=lambda s: s.get("priority", 999))
    nodes = []
    for s in stories:
        nodes.append({
            "id": s["id"],
            "title": s.get("title", ""),
            "priority": s.get("priority", 0),
            "status": "passed" if s.get("passes") else "failed",
            "module": s.get("module", ""),
            "notes": s.get("notes", ""),
        })
    edges = []
    for i in range(len(nodes) - 1):
        edges.append({"source": nodes[i]["id"], "target": nodes[i + 1]["id"]})
    return {"nodes": nodes, "edges": edges}


def add_notification(title, body, category="info", agent_id=None, requires_input=False, input_options=None):
    global _notification_id
    with _notification_lock:
        _notification_id += 1
        notif = {
            "id": _notification_id,
            "title": title,
            "body": body,
            "category": category,
            "agent_id": agent_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "read": False,
            "requires_input": requires_input,
            "input_options": input_options,
        }
        _notifications.insert(0, notif)
        if len(_notifications) > 200:
            _notifications.pop()
        return _notification_id


def add_input_request(prompt, options, context=None):
    global _input_id
    with _input_lock:
        _input_id += 1
        req = {
            "id": _input_id,
            "prompt": prompt,
            "options": options,
            "context": context or {},
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "responded": False,
            "response": None,
        }
        _input_requests.insert(0, req)
        add_notification(
            "Input Required",
            prompt,
            category="input",
            requires_input=True,
            input_options=options
        )
        return _input_id


def get_agent_output_stats(agent_id, tasks_dir=None):
    scan_dir = tasks_dir or TASKS_DIR
    output_file = os.path.join(scan_dir, f"{agent_id}.output")
    if not os.path.exists(output_file):
        return {"lines": 0, "tokens_in": 0, "tokens_out": 0, "tokens_cache": 0,
                "tokens_total": 0, "tools_used": 0, "last_message": "", "file_size": 0, "api_calls": 0}
    file_size = os.path.getsize(output_file)
    lines = tokens_in = tokens_out = tokens_cache = tools_used = api_calls = 0
    last_text = ""
    try:
        with open(output_file, "r") as f:
            for line in f:
                lines += 1
                try:
                    d = json.loads(line.strip())
                    msg = d.get("message", {})
                    usage = msg.get("usage", {})
                    t_in = usage.get("input_tokens", 0)
                    t_out = usage.get("output_tokens", 0)
                    cache_create = usage.get("cache_creation_input_tokens", 0)
                    cache_read = usage.get("cache_read_input_tokens", 0)
                    if t_in or t_out:
                        api_calls += 1
                        tokens_in += t_in
                        tokens_out += t_out
                        tokens_cache += cache_create + cache_read
                    content = msg.get("content", [])
                    if isinstance(content, list):
                        for c in content:
                            if not isinstance(c, dict):
                                continue
                            if c.get("type") == "tool_use":
                                tools_used += 1
                            if c.get("type") == "text":
                                t = c.get("text", "")
                                if len(t) > 10:
                                    last_text = t[:300]
                    role = msg.get("role", "")
                    if role == "user":
                        user_content = msg.get("content", [])
                        if isinstance(user_content, list):
                            for uc in user_content:
                                if isinstance(uc, dict) and uc.get("type") == "tool_result":
                                    tools_used += 1
                except (json.JSONDecodeError, KeyError, TypeError):
                    pass
    except Exception:
        pass
    return {
        "lines": lines, "tokens_in": tokens_in, "tokens_out": tokens_out,
        "tokens_cache": tokens_cache, "tokens_total": tokens_in + tokens_out + tokens_cache,
        "tools_used": tools_used, "api_calls": api_calls,
        "last_message": last_text, "file_size": file_size,
    }


def check_agent_completion(agent_id, tasks_dir=None):
    scan_dir = tasks_dir or TASKS_DIR
    output_file = os.path.join(scan_dir, f"{agent_id}.output")
    if not os.path.exists(output_file):
        return False
    try:
        with open(output_file, "rb") as f:
            f.seek(max(0, os.path.getsize(output_file) - 10000))
            tail = f.read().decode("utf-8", errors="ignore")
            return '"stop_reason":"end_turn"' in tail or '"stop_reason": "end_turn"' in tail
    except Exception:
        return False


def get_ralph_data(project_name=None):
    proj = _resolve_project(project_name)
    prd_path = None
    proj_cfg = get_project(proj)
    if proj_cfg:
        prd_path = proj_cfg.get("prd_json")
    if not prd_path:
        prd_path = CFG.get("prd_json", "")
    if not prd_path or not os.path.exists(prd_path):
        return None
    try:
        with open(prd_path) as f:
            prd = json.load(f)
        stories = prd.get("userStories", [])
        return {
            "project": prd.get("project", ""),
            "branch": prd.get("branchName", ""),
            "description": prd.get("description", ""),
            "agent_config": prd.get("agentConfig", {}),
            "stories": [{
                "id": s["id"],
                "title": s["title"],
                "priority": s.get("priority", 0),
                "passes": s.get("passes", False),
                "module": s.get("module", ""),
                "namespace": s.get("namespace", ""),
                "notes": s.get("notes", ""),
            } for s in stories],
            "total": len(stories),
            "passed": sum(1 for s in stories if s.get("passes")),
        }
    except Exception:
        return None


def get_api_data(project_name=None):
    now = datetime.now(timezone.utc).isoformat()
    proj = _resolve_project(project_name)
    proj_cfg = get_project(proj)
    proj_tasks_dir = proj_cfg.get("tasks_dir") if proj_cfg else None
    proj_data = ensure_project_data(proj)
    # Auto-discover agents if project has no agents yet
    if not proj_data["agents"] and proj_tasks_dir:
        discover_agents(tasks_dir=proj_tasks_dir, project_name=proj)
    agents_src = proj_data["agents"] if proj_data["agents"] else AGENTS
    agents_data = []
    total_tokens_in = total_tokens_out = total_tokens_cache = total_tools = total_api_calls = 0
    newly_completed = []

    for aid, info in agents_src.items():
        stats = get_agent_output_stats(aid, tasks_dir=proj_tasks_dir)
        was_running = info["status"] == "running"
        if info["status"] != "completed" and check_agent_completion(aid, tasks_dir=proj_tasks_dir):
            info["status"] = "completed"
            if was_running:
                newly_completed.append(info["name"])
        agents_data.append({
            "id": aid, "name": info["name"], "tier": info["tier"],
            "status": info["status"], "deps": info.get("deps", []),
            "plane": info.get("plane", {}),
            "lines": stats["lines"], "tokens_in": stats["tokens_in"],
            "tokens_out": stats["tokens_out"], "tokens_cache": stats["tokens_cache"],
            "tokens_total": stats["tokens_total"], "tools_used": stats["tools_used"],
            "api_calls": stats["api_calls"],
            "file_size_kb": round(stats["file_size"] / 1024, 1),
            "last_message": stats["last_message"],
        })
        total_tokens_in += stats["tokens_in"]
        total_tokens_out += stats["tokens_out"]
        total_tokens_cache += stats["tokens_cache"]
        total_tools += stats["tools_used"]
        total_api_calls += stats["api_calls"]

    for name in newly_completed:
        add_notification(f"Agent Completed", f'"{name}" has finished execution', category="success", agent_id=None)

    completed = sum(1 for a in agents_data if a["status"] == "completed")
    running = sum(1 for a in agents_data if a["status"] == "running")
    edges = []
    for aid, info in agents_src.items():
        for dep in info.get("deps", []):
            edges.append({"source": dep, "target": aid})

    unread_count = sum(1 for n in _notifications if not n["read"])

    return {
        "timestamp": now,
        "session_id": SESSION_ID,
        "project": proj,
        "summary": {
            "total_agents": len(agents_data), "completed": completed, "running": running,
            "total_tokens_in": total_tokens_in, "total_tokens_out": total_tokens_out,
            "total_tokens_cache": total_tokens_cache,
            "total_tokens": total_tokens_in + total_tokens_out + total_tokens_cache,
            "total_tool_calls": total_tools, "total_api_calls": total_api_calls,
        },
        "agents": agents_data, "edges": edges, "tasks": TASKS, "plane": PLANE_PM,
        "notifications": {"unread": unread_count, "recent": _notifications[:20]},
        "ralph": get_ralph_data(project_name=proj),
        "slash_commands": SLASH_COMMANDS,
        "input_requests": [r for r in _input_requests if not r["responded"]][:5],
    }


# --- Initialize with startup notification ---
add_notification("APM v4 Started", "Agentic Performance Monitor v4 initialized with multi-project support, browser notifications, Ralph display, and slash command panel.", category="system")


DASHBOARD_HTML = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>APM v3 - Agent Performance Monitor</title>
<script src="https://d3js.org/d3.v7.min.js"></script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #0a0e17; color: #c9d1d9; font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace; font-size: 13px; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }

  /* Header */
  .header { background: linear-gradient(135deg, #161b22 0%, #0d1117 100%); border-bottom: 1px solid #30363d; padding: 8px 16px; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; z-index: 100; }
  .header h1 { font-size: 14px; color: #58a6ff; font-weight: 600; }
  .header .meta { color: #8b949e; font-size: 11px; display: flex; align-items: center; gap: 12px; }
  .live-dot { display: inline-block; width: 8px; height: 8px; background: #3fb950; border-radius: 50%; margin-right: 6px; animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
  @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }

  /* Bell / Notification */
  .bell-container { position: relative; cursor: pointer; }
  .bell-icon { width: 20px; height: 20px; fill: #8b949e; transition: fill 0.2s; }
  .bell-icon:hover { fill: #58a6ff; }
  .bell-badge { position: absolute; top: -4px; right: -6px; background: #f85149; color: #fff; font-size: 9px; font-weight: 700; min-width: 16px; height: 16px; border-radius: 8px; display: flex; align-items: center; justify-content: center; padding: 0 4px; }
  .bell-badge.hidden { display: none; }
  .notif-dropdown { position: absolute; top: 32px; right: 0; width: 380px; max-height: 480px; background: #161b22; border: 1px solid #30363d; border-radius: 8px; box-shadow: 0 8px 32px rgba(0,0,0,0.5); z-index: 200; display: none; overflow: hidden; }
  .notif-dropdown.open { display: block; animation: fadeIn 0.15s ease; }
  .notif-dropdown-header { padding: 10px 14px; border-bottom: 1px solid #30363d; display: flex; justify-content: space-between; align-items: center; }
  .notif-dropdown-header h3 { font-size: 12px; color: #e6edf3; }
  .notif-dropdown-header .mark-read { font-size: 10px; color: #58a6ff; cursor: pointer; }
  .notif-dropdown-body { max-height: 400px; overflow-y: auto; }
  .notif-item { padding: 10px 14px; border-bottom: 1px solid #21262d; cursor: pointer; transition: background 0.15s; }
  .notif-item:hover { background: #1c2128; }
  .notif-item.unread { border-left: 3px solid #58a6ff; }
  .notif-item .notif-title { font-size: 11px; font-weight: 600; color: #e6edf3; margin-bottom: 2px; }
  .notif-item .notif-body { font-size: 10px; color: #8b949e; line-height: 1.3; }
  .notif-item .notif-time { font-size: 9px; color: #484f58; margin-top: 3px; }
  .notif-cat { display: inline-block; padding: 1px 6px; border-radius: 8px; font-size: 9px; font-weight: 600; margin-right: 4px; }
  .notif-cat.success { background: #23863533; color: #3fb950; }
  .notif-cat.info { background: #1f6feb33; color: #58a6ff; }
  .notif-cat.warning { background: #9e6a0333; color: #d29922; }
  .notif-cat.input { background: #8957e533; color: #bc8cff; }
  .notif-cat.system { background: #484f5833; color: #8b949e; }
  .notif-cat.error { background: #f8514933; color: #f85149; }

  /* Layout */
  .main-layout { display: flex; flex: 1; overflow: hidden; }
  .left-panel { flex: 1; overflow-y: auto; padding: 10px; }
  .right-panel { width: 380px; border-left: 1px solid #30363d; background: #0d1117; overflow-y: auto; flex-shrink: 0; }

  /* Tabs (right panel) */
  .tab-bar { display: flex; border-bottom: 1px solid #30363d; background: #161b22; flex-shrink: 0; }
  .tab-btn { flex: 1; padding: 8px 4px; text-align: center; font-size: 10px; color: #8b949e; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; text-transform: uppercase; letter-spacing: 0.5px; }
  .tab-btn:hover { color: #c9d1d9; background: #1c2128; }
  .tab-btn.active { color: #58a6ff; border-bottom-color: #58a6ff; }
  .tab-content { display: none; overflow-y: auto; flex: 1; }
  .tab-content.active { display: block; }

  /* Stat cards */
  .grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; margin-bottom: 10px; }
  .stat-card { background: #161b22; border: 1px solid #30363d; border-radius: 6px; padding: 8px; text-align: center; }
  .stat-card .value { font-size: 20px; font-weight: 700; color: #58a6ff; }
  .stat-card .label { font-size: 9px; color: #8b949e; margin-top: 2px; text-transform: uppercase; letter-spacing: 1px; }

  /* Progress bar */
  .progress-bar { height: 4px; background: #21262d; border-radius: 2px; margin-bottom: 10px; overflow: hidden; }
  .progress-fill { height: 100%; background: linear-gradient(90deg, #3fb950, #58a6ff, #bc8cff); border-radius: 2px; transition: width 0.8s ease; }

  /* D3 Graph */
  .graph-container { background: #161b22; border: 1px solid #30363d; border-radius: 6px; margin-bottom: 10px; overflow: hidden; }
  .graph-title { font-size: 9px; color: #8b949e; text-transform: uppercase; letter-spacing: 1.5px; padding: 6px 10px; border-bottom: 1px solid #21262d; }
  #dep-graph { width: 100%; }
  .node circle { stroke-width: 2px; cursor: pointer; transition: r 0.2s; }
  .node circle:hover { r: 18; }
  .node text { fill: #c9d1d9; font-size: 9px; font-family: 'SF Mono', monospace; pointer-events: none; }
  .link { stroke-opacity: 0.5; fill: none; }
  .tier-label { fill: #484f58; font-size: 10px; font-family: 'SF Mono', monospace; text-transform: uppercase; letter-spacing: 2px; }

  /* Section */
  .section { margin-bottom: 10px; }
  .section-title { font-size: 9px; color: #8b949e; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px; }

  /* Agent rows */
  .agent-row { background: #161b22; border: 1px solid #30363d; border-radius: 6px; padding: 6px 10px; margin-bottom: 4px; display: grid; grid-template-columns: 24px 1fr 60px 50px 50px 50px 70px; align-items: center; gap: 6px; transition: all 0.2s; cursor: pointer; font-size: 11px; }
  .agent-row:hover { border-color: #58a6ff; background: #161b2288; }
  .agent-row.selected { border-color: #58a6ff; box-shadow: 0 0 0 1px #58a6ff33; }
  .tier-badge { width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 700; }
  .tier-1 { background: #1f6feb33; color: #58a6ff; border: 1px solid #1f6feb; }
  .tier-2 { background: #8957e533; color: #bc8cff; border: 1px solid #8957e5; }
  .tier-3 { background: #f0883e33; color: #f0883e; border: 1px solid #f0883e; }
  .agent-name { font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .agent-name .id { color: #484f58; font-size: 9px; }
  .metric { text-align: right; }
  .metric .val { color: #e6edf3; font-weight: 600; }
  .metric .unit { color: #484f58; font-size: 8px; }
  .status { padding: 2px 6px; border-radius: 10px; font-size: 9px; font-weight: 600; text-align: center; display: inline-block; }
  .status.completed { background: #23863533; color: #3fb950; border: 1px solid #23863566; }
  .status.running { background: #9e6a0333; color: #d29922; border: 1px solid #9e6a0366; animation: pulse 2s infinite; }
  .status.pending { background: #484f5833; color: #8b949e; border: 1px solid #484f5866; }
  .status.in_progress { background: #9e6a0333; color: #d29922; border: 1px solid #9e6a0366; }

  .col-header { font-size: 8px; color: #484f58; text-transform: uppercase; letter-spacing: 1px; padding: 2px 10px; display: grid; grid-template-columns: 24px 1fr 60px 50px 50px 50px 70px; gap: 6px; }

  /* Bottom panels */
  .bottom-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .task-list { background: #161b22; border: 1px solid #30363d; border-radius: 6px; overflow: hidden; max-height: 180px; overflow-y: auto; }
  .task-row { display: grid; grid-template-columns: 32px 1fr 80px; padding: 4px 8px; border-bottom: 1px solid #21262d; align-items: center; font-size: 10px; }
  .task-row:last-child { border-bottom: none; }
  .task-id { color: #484f58; }

  /* Right panel inspector */
  .inspector-header { padding: 10px 14px; border-bottom: 1px solid #30363d; background: #161b22; }
  .inspector-header h2 { font-size: 11px; color: #58a6ff; text-transform: uppercase; letter-spacing: 1px; }
  .inspector-section { padding: 10px 14px; border-bottom: 1px solid #21262d; }
  .inspector-section h3 { font-size: 9px; color: #8b949e; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
  .inspector-row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 10px; }
  .inspector-row .key { color: #8b949e; }
  .inspector-row .val { color: #e6edf3; font-weight: 500; }
  .plane-state { display: flex; gap: 4px; flex-wrap: wrap; padding: 4px 0; }
  .plane-pill { padding: 2px 6px; border-radius: 10px; font-size: 9px; font-weight: 600; }
  .module-bar { height: 5px; background: #21262d; border-radius: 3px; margin: 2px 0 4px; overflow: hidden; }
  .module-fill { height: 100%; border-radius: 3px; }
  .module-item { margin-bottom: 3px; font-size: 10px; }
  .module-name { color: #c9d1d9; }
  .module-count { color: #484f58; float: right; }
  #inspector-dep-graph { width: 100%; background: #0d1117; border-radius: 4px; }
  .no-selection { color: #484f58; font-size: 11px; text-align: center; padding: 30px 16px; }

  /* Ralph panel */
  .ralph-story { background: #161b22; border: 1px solid #30363d; border-radius: 6px; padding: 8px 12px; margin-bottom: 4px; }
  .ralph-story .story-id { color: #58a6ff; font-weight: 700; font-size: 10px; }
  .ralph-story .story-title { font-size: 11px; color: #e6edf3; margin-top: 2px; }
  .ralph-story .story-meta { font-size: 9px; color: #8b949e; margin-top: 3px; }
  .ralph-story .pass-badge { display: inline-block; padding: 1px 8px; border-radius: 8px; font-size: 9px; font-weight: 600; }
  .ralph-story .pass-badge.pass { background: #23863533; color: #3fb950; }
  .ralph-story .pass-badge.fail { background: #f8514933; color: #f85149; }

  /* Slash commands panel */
  .cmd-item { display: flex; justify-content: space-between; align-items: center; padding: 6px 12px; border-bottom: 1px solid #21262d; font-size: 10px; }
  .cmd-item .cmd-name { color: #bc8cff; font-weight: 600; }
  .cmd-item .cmd-desc { color: #8b949e; font-size: 9px; flex: 1; margin: 0 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .cmd-status { padding: 1px 6px; border-radius: 8px; font-size: 8px; font-weight: 600; }
  .cmd-status.active { background: #23863533; color: #3fb950; }
  .cmd-status.available { background: #1f6feb33; color: #58a6ff; }
  .cmd-status.completed { background: #484f5833; color: #8b949e; }

  /* Input request card */
  .input-card { background: #161b22; border: 1px solid #8957e5; border-radius: 8px; padding: 12px; margin: 8px 14px; }
  .input-card h4 { font-size: 11px; color: #bc8cff; margin-bottom: 8px; }
  .input-card .input-prompt { font-size: 11px; color: #e6edf3; margin-bottom: 8px; }
  .input-option { display: block; width: 100%; padding: 6px 10px; margin-bottom: 4px; background: #21262d; border: 1px solid #30363d; border-radius: 4px; color: #c9d1d9; font-size: 11px; cursor: pointer; text-align: left; font-family: inherit; transition: all 0.15s; }
  .input-option:hover { border-color: #58a6ff; background: #1c2128; color: #e6edf3; }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: #0a0e17; }
  ::-webkit-scrollbar-thumb { background: #30363d; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #484f58; }
</style>
</head>
<body>

<div class="header">
  <h1><span class="live-dot"></span>APM v3</h1>
  <div class="meta">
    <span id="project"></span>
    <span>|</span>
    <span id="clock"></span>
    <span>|</span>
    <span id="refresh-indicator" style="color:#3fb950">LIVE</span>
    <div class="bell-container" onclick="toggleNotifDropdown(event)">
      <svg class="bell-icon" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
      </svg>
      <div class="bell-badge hidden" id="bell-badge">0</div>
      <div class="notif-dropdown" id="notif-dropdown">
        <div class="notif-dropdown-header">
          <h3>Notifications</h3>
          <span class="mark-read" onclick="markAllRead(event)">Mark all read</span>
        </div>
        <div class="notif-dropdown-body" id="notif-list"></div>
      </div>
    </div>
  </div>
</div>

<div class="main-layout">
  <div class="left-panel">
    <div class="grid">
      <div class="stat-card"><div class="value" id="s-agents">10</div><div class="label">Agents</div></div>
      <div class="stat-card"><div class="value" id="s-completed" style="color:#3fb950">0</div><div class="label">Done</div></div>
      <div class="stat-card"><div class="value" id="s-tokens-in" style="color:#d29922">0</div><div class="label">Tokens In</div></div>
      <div class="stat-card"><div class="value" id="s-tokens-out" style="color:#f0883e">0</div><div class="label">Tokens Out</div></div>
      <div class="stat-card"><div class="value" id="s-tools" style="color:#bc8cff">0</div><div class="label">Tool Calls</div></div>
      <div class="stat-card"><div class="value" id="s-api" style="color:#58a6ff">0</div><div class="label">API Calls</div></div>
    </div>

    <div class="progress-bar"><div class="progress-fill" id="progress" style="width:0%"></div></div>

    <div class="graph-container">
      <div class="graph-title">Dependency Graph</div>
      <svg id="dep-graph"></svg>
    </div>

    <div class="section">
      <div class="section-title">Agent Fleet</div>
      <div class="col-header"><span></span><span>Agent</span><span style="text-align:right">In</span><span style="text-align:right">Out</span><span style="text-align:right">Tools</span><span style="text-align:right">KB</span><span style="text-align:center">Status</span></div>
      <div id="agents"></div>
    </div>

    <div class="bottom-grid">
      <div class="section">
        <div class="section-title">Task List</div>
        <div class="task-list" id="tasks"></div>
      </div>
      <div class="section">
        <div class="section-title">Event Log</div>
        <div class="task-list" id="event-log" style="font-size:10px;max-height:180px;overflow-y:auto"></div>
      </div>
    </div>
  </div>

  <div class="right-panel" style="display:flex;flex-direction:column;">
    <div class="tab-bar">
      <div class="tab-btn active" data-tab="inspector" onclick="switchTab('inspector')">Inspector</div>
      <div class="tab-btn" data-tab="ralph" onclick="switchTab('ralph')">Ralph</div>
      <div class="tab-btn" data-tab="commands" onclick="switchTab('commands')">Commands</div>
      <div class="tab-btn" data-tab="todos" onclick="switchTab('todos')">TODOs</div>
    </div>

    <!-- Inspector Tab -->
    <div class="tab-content active" id="tab-inspector" style="flex:1;overflow-y:auto;">
      <div id="inspector-content">
        <div class="no-selection">Click an agent or graph node to inspect</div>
      </div>
    </div>

    <!-- Ralph Tab -->
    <div class="tab-content" id="tab-ralph" style="flex:1;overflow-y:auto;">
      <div style="padding:10px 14px;">
        <div class="inspector-section" style="border:none;padding:0;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <h3>Ralph Methodology</h3>
            <button id="ralph-view-toggle" onclick="toggleRalphView()" style="background:#21262d;border:1px solid #30363d;color:#c9d1d9;padding:3px 10px;border-radius:4px;cursor:pointer;font-size:10px;font-family:inherit;">Flowchart</button>
          </div>
          <div id="ralph-summary" style="margin-bottom:10px;"></div>
          <div id="ralph-flowchart" style="display:none;">
            <svg id="ralph-flow-svg" width="100%" height="280" style="background:#0d1117;border:1px solid #30363d;border-radius:6px;"></svg>
          </div>
          <div id="ralph-stories"></div>
        </div>
      </div>
    </div>

    <!-- Commands Tab -->
    <div class="tab-content" id="tab-commands" style="flex:1;overflow-y:auto;">
      <div style="padding:10px 14px;">
        <div class="inspector-section" style="border:none;padding:0;">
          <h3>Slash Commands</h3>
          <div id="commands-list" style="background:#161b22;border:1px solid #30363d;border-radius:6px;overflow:hidden;margin-top:8px;"></div>
        </div>
      </div>
    </div>

    <!-- TODOs Tab -->
    <div class="tab-content" id="tab-todos" style="flex:1;overflow-y:auto;">
      <div style="padding:10px 14px;">
        <div class="inspector-section" style="border:none;padding:0;">
          <h3>Active Task List</h3>
          <div id="todos-active" style="margin-top:8px;"></div>
          <h3 style="margin-top:14px;">Completed Tasks</h3>
          <div id="todos-completed" style="margin-top:8px;"></div>
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Input modal overlay -->
<div id="input-modal" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);z-index:300;display:none;align-items:center;justify-content:center;">
  <div style="background:#161b22;border:1px solid #30363d;border-radius:12px;padding:20px;max-width:420px;width:90%;box-shadow:0 16px 48px rgba(0,0,0,0.5);">
    <h3 id="input-modal-title" style="color:#bc8cff;font-size:13px;margin-bottom:12px;">Input Required</h3>
    <p id="input-modal-prompt" style="color:#c9d1d9;font-size:12px;margin-bottom:16px;"></p>
    <div id="input-modal-options"></div>
    <button onclick="closeInputModal()" style="margin-top:8px;padding:6px 16px;background:#21262d;border:1px solid #30363d;color:#8b949e;border-radius:4px;cursor:pointer;font-family:inherit;">Dismiss</button>
  </div>
</div>

<script>
let prevData = null;
let selectedAgent = null;
const eventLog = [];
let notifPermission = 'default';
let notifDropdownOpen = false;

function fmt(n) { return n >= 1000000 ? (n/1000000).toFixed(1)+'M' : n >= 1000 ? (n/1000).toFixed(1)+'K' : n.toString(); }

// --- Browser Notifications ---
async function requestNotifPermission() {
  if ('Notification' in window) {
    notifPermission = await Notification.requestPermission();
  }
}
requestNotifPermission();

function sendBrowserNotif(title, body, tag) {
  if (notifPermission === 'granted' && document.hidden) {
    try {
      new Notification(title, { body, icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">⚡</text></svg>', tag: tag || 'apm-' + Date.now(), silent: false });
    } catch(e) {}
  }
}

// --- Notification Dropdown ---
function toggleNotifDropdown(e) {
  e.stopPropagation();
  notifDropdownOpen = !notifDropdownOpen;
  document.getElementById('notif-dropdown').classList.toggle('open', notifDropdownOpen);
}

function markAllRead(e) {
  e.stopPropagation();
  fetch('/api/notifications/read-all', {method:'POST'});
  document.querySelectorAll('.notif-item.unread').forEach(el => el.classList.remove('unread'));
  document.getElementById('bell-badge').classList.add('hidden');
}

document.addEventListener('click', () => {
  notifDropdownOpen = false;
  document.getElementById('notif-dropdown').classList.remove('open');
});

// --- Tab Switching ---
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
  document.getElementById(`tab-${tab}`).classList.add('active');
}

// --- Agent Selection ---
function selectAgent(agentId) {
  selectedAgent = agentId;
  document.querySelectorAll('.agent-row').forEach(r => r.classList.remove('selected'));
  const row = document.querySelector(`[data-agent="${agentId}"]`);
  if (row) row.classList.add('selected');
  switchTab('inspector');
  updateInspector();
  highlightGraphNode(agentId);
}

// --- Inspector ---
function updateInspector() {
  const el = document.getElementById('inspector-content');
  if (!prevData || !selectedAgent) {
    el.innerHTML = '<div class="no-selection">Click an agent or graph node to inspect</div>';
    return;
  }
  const agent = prevData.agents.find(a => a.id === selectedAgent);
  if (!agent) return;
  const plane = agent.plane || {};
  const deps = agent.deps || [];
  const depAgents = deps.map(d => prevData.agents.find(a => a.id === d)).filter(Boolean);
  const downstream = prevData.agents.filter(a => (a.deps||[]).includes(selectedAgent));
  const tc = {1:'#58a6ff',2:'#bc8cff',3:'#f0883e'};

  let html = `
    <div class="inspector-section">
      <h3>Agent Details</h3>
      <div class="inspector-row"><span class="key">Name</span><span class="val">${agent.name}</span></div>
      <div class="inspector-row"><span class="key">ID</span><span class="val" style="color:#484f58">${agent.id}</span></div>
      <div class="inspector-row"><span class="key">Tier</span><span class="val" style="color:${tc[agent.tier]}">${agent.tier}</span></div>
      <div class="inspector-row"><span class="key">Status</span><span class="val"><span class="status ${agent.status}">${agent.status}</span></span></div>
      <div class="inspector-row"><span class="key">Tokens In</span><span class="val">${fmt(agent.tokens_in)}</span></div>
      <div class="inspector-row"><span class="key">Tokens Out</span><span class="val">${fmt(agent.tokens_out)}</span></div>
      <div class="inspector-row"><span class="key">Cache</span><span class="val">${fmt(agent.tokens_cache)}</span></div>
      <div class="inspector-row"><span class="key">Tools</span><span class="val">${agent.tools_used}</span></div>
      <div class="inspector-row"><span class="key">API Calls</span><span class="val">${agent.api_calls}</span></div>
      <div class="inspector-row"><span class="key">Output</span><span class="val">${agent.file_size_kb} KB</span></div>
    </div>
    <div class="inspector-section">
      <h3>Plane PM Context</h3>
      ${Object.entries(plane).map(([k,v]) => `<div class="inspector-row"><span class="key">${k}</span><span class="val">${v}</span></div>`).join('')}
    </div>
    <div class="inspector-section">
      <h3>Dependencies (${deps.length} up, ${downstream.length} down)</h3>
      ${depAgents.map(d => `<div class="inspector-row" style="cursor:pointer" onclick="selectAgent('${d.id}')"><span class="key" style="color:${tc[d.tier]}">[T${d.tier}] ${d.name}</span><span class="val"><span class="status ${d.status}">${d.status}</span></span></div>`).join('')}
      ${downstream.map(d => `<div class="inspector-row" style="cursor:pointer" onclick="selectAgent('${d.id}')"><span class="key" style="color:${tc[d.tier]}">-> ${d.name}</span><span class="val"><span class="status ${d.status}">${d.status}</span></span></div>`).join('')}
    </div>
    <div class="inspector-section">
      <h3>Dep Subgraph</h3>
      <svg id="inspector-dep-graph" height="140"></svg>
    </div>`;

  if (prevData.plane) {
    const p = prevData.plane;
    html += `
      <div class="inspector-section">
        <h3>Project</h3>
        <div class="inspector-row"><span class="key">Name</span><span class="val">${p.project_name}</span></div>
        <div class="inspector-row"><span class="key">Issues</span><span class="val">${p.total_issues}</span></div>
        <div class="plane-state">${Object.entries(p.states).map(([n,s]) => `<span class="plane-pill" style="background:${s.color}22;color:${s.color};border:1px solid ${s.color}44">${n}: ${s.count}</span>`).join('')}</div>
      </div>`;
  }

  if (agent.last_message) {
    html += `<div class="inspector-section"><h3>Last Output</h3><div style="color:#8b949e;font-size:9px;word-break:break-all;max-height:80px;overflow:hidden">${agent.last_message.replace(/</g,'&lt;')}</div></div>`;
  }
  el.innerHTML = html;
  drawMiniGraph(selectedAgent);
}

// --- Mini Dep Graph ---
function drawMiniGraph(agentId) {
  if (!prevData) return;
  const svg = d3.select('#inspector-dep-graph');
  svg.selectAll('*').remove();
  const w = 346, h = 140;
  svg.attr('viewBox', `0 0 ${w} ${h}`);
  const agent = prevData.agents.find(a => a.id === agentId);
  if (!agent) return;
  const relIds = new Set([agentId, ...(agent.deps||[])]);
  prevData.agents.filter(a => (a.deps||[]).includes(agentId)).forEach(a => relIds.add(a.id));
  const nodes = prevData.agents.filter(a => relIds.has(a.id)).map(a => ({...a}));
  const edges = prevData.edges.filter(e => relIds.has(e.source) && relIds.has(e.target));
  const tc = {1:'#1f6feb',2:'#8957e5',3:'#f0883e'};
  const sf = {completed:'#23863566',running:'#9e6a0366',pending:'#484f5866'};
  const tg = {};
  nodes.forEach(n => { if(!tg[n.tier]) tg[n.tier]=[]; tg[n.tier].push(n); });
  const ts = Object.keys(tg).sort();
  const xS = w/(ts.length+1);
  ts.forEach((t,i) => { const g=tg[t]; const yS=h/(g.length+1); g.forEach((n,j) => { n.x=xS*(i+1); n.y=yS*(j+1); }); });
  const nm = {}; nodes.forEach(n => nm[n.id]=n);
  svg.selectAll('.ml').data(edges).enter().append('line').attr('x1',d=>(nm[d.source]||{}).x||0).attr('y1',d=>(nm[d.source]||{}).y||0).attr('x2',d=>(nm[d.target]||{}).x||0).attr('y2',d=>(nm[d.target]||{}).y||0).attr('stroke','#30363d').attr('stroke-width',1.5);
  const g = svg.selectAll('.mn').data(nodes).enter().append('g').attr('transform',d=>`translate(${d.x},${d.y})`);
  g.append('circle').attr('r',d=>d.id===agentId?12:9).attr('fill',d=>sf[d.status]||'#484f5866').attr('stroke',d=>d.id===agentId?'#58a6ff':tc[d.tier]).attr('stroke-width',d=>d.id===agentId?2.5:1.5);
  g.append('text').text(d=>'T'+d.tier).attr('text-anchor','middle').attr('dy',3).attr('fill','#c9d1d9').attr('font-size',8);
}

// --- Main Dependency Graph ---
function drawGraph(data) {
  const svg = d3.select('#dep-graph');
  const container = svg.node().parentElement;
  const w = container.clientWidth;
  const h = 180;
  svg.attr('viewBox', `0 0 ${w} ${h}`).attr('height', h);
  svg.selectAll('*').remove();
  const tc = {1:'#1f6feb',2:'#8957e5',3:'#f0883e'};
  const sf = {completed:'#23863566',running:'#9e6a0366',pending:'#484f5866'};
  const nodes = data.agents.map(a => ({...a}));
  const edges = data.edges;
  const tg = {};
  nodes.forEach(n => { if(!tg[n.tier]) tg[n.tier]=[]; tg[n.tier].push(n); });
  const ts = Object.keys(tg).sort();
  const xS = w/(ts.length+1);
  ts.forEach((t,i) => { const g=tg[t]; const yS=h/(g.length+1); g.forEach((n,j) => { n.x=xS*(i+1); n.y=yS*(j+1); }); });
  const nm = {}; nodes.forEach(n => nm[n.id]=n);
  ts.forEach((t,i) => {
    svg.append('rect').attr('x',xS*(i+0.5)).attr('y',0).attr('width',xS).attr('height',h).attr('fill',tc[t]+'08').attr('rx',6);
    svg.append('text').text(`TIER ${t}`).attr('class','tier-label').attr('x',xS*(i+1)).attr('y',h-4).attr('text-anchor','middle');
  });
  svg.append('defs').append('marker').attr('id','arrow').attr('viewBox','0 0 10 10').attr('refX',22).attr('refY',5).attr('markerWidth',6).attr('markerHeight',6).attr('orient','auto').append('path').attr('d','M 0 0 L 10 5 L 0 10 z').attr('fill','#30363d');
  edges.forEach(e => {
    const s=nm[e.source], t=nm[e.target];
    if(!s||!t) return;
    const mx=(s.x+t.x)/2;
    svg.append('path').attr('class','link').attr('d',`M${s.x},${s.y} C${mx},${s.y} ${mx},${t.y} ${t.x},${t.y}`).attr('stroke','#30363d').attr('stroke-width',1.5).attr('marker-end','url(#arrow)');
  });
  const g = svg.selectAll('.node').data(nodes).enter().append('g').attr('class','node').attr('transform',d=>`translate(${d.x},${d.y})`).style('cursor','pointer').on('click',(ev,d)=>selectAgent(d.id));
  g.append('circle').attr('r',d=>d.id===selectedAgent?15:12).attr('fill',d=>sf[d.status]||'#484f5866').attr('stroke',d=>d.id===selectedAgent?'#58a6ff':tc[d.tier]).attr('stroke-width',d=>d.id===selectedAgent?3:2);
  g.filter(d=>d.status==='running').append('circle').attr('r',16).attr('fill','none').attr('stroke','#d2992244').attr('stroke-width',1.5).attr('stroke-dasharray','4 4').style('animation','spin 3s linear infinite');
  g.append('text').text(d=>d.name.length>14?d.name.substring(0,12)+'..':d.name).attr('text-anchor','middle').attr('dy',-16).attr('font-size',8);
  g.append('text').text(d=>d.status==='completed'?'OK':d.status==='running'?'RUN':'--').attr('text-anchor','middle').attr('dy',4).attr('font-size',8).attr('fill',d=>d.status==='completed'?'#3fb950':d.status==='running'?'#d29922':'#8b949e');
}

function highlightGraphNode(id) {
  d3.selectAll('.node circle').attr('stroke-width',d=>d.id===id?3:2).attr('stroke',d=>d.id===id?'#58a6ff':{1:'#1f6feb',2:'#8957e5',3:'#f0883e'}[d.tier]).attr('r',d=>d.id===id?15:12);
}

// --- Ralph Panel ---
let ralphView = 'list';
function toggleRalphView() {
  const btn = document.getElementById('ralph-view-toggle');
  const list = document.getElementById('ralph-stories');
  const chart = document.getElementById('ralph-flowchart');
  if (ralphView === 'list') {
    ralphView = 'flowchart'; btn.textContent = 'List';
    list.style.display = 'none'; chart.style.display = 'block';
  } else {
    ralphView = 'list'; btn.textContent = 'Flowchart';
    list.style.display = 'block'; chart.style.display = 'none';
  }
}

function renderRalphFlow(stories) {
  const svg = document.getElementById('ralph-flow-svg');
  if (!svg || !stories || stories.length === 0) return;
  const sorted = stories.slice().sort((a,b) => (a.priority||999) - (b.priority||999));
  const w = svg.clientWidth || 340;
  const h = 280;
  svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
  const nW = 100, nH = 44, gap = 30;
  const cols = Math.min(sorted.length, Math.max(2, Math.floor(w / (nW + gap))));
  const rows = Math.ceil(sorted.length / cols);
  let html = '<defs><marker id="ra" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="#30363d"/></marker></defs>';
  const pos = [];
  sorted.forEach((s, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const x = 20 + col * (nW + gap), y = 20 + row * (nH + gap + 10);
    pos.push({x: x + nW/2, y: y + nH/2});
    const c = s.passes ? '#3fb950' : '#f85149';
    html += `<rect x="${x}" y="${y}" width="${nW}" height="${nH}" rx="6" fill="${c}22" stroke="${c}" stroke-width="1.5"/>`;
    html += `<text x="${x+nW/2}" y="${y+16}" text-anchor="middle" fill="${c}" font-size="10" font-weight="700">${s.id}</text>`;
    const t = (s.title||'').length > 13 ? (s.title||'').substring(0,11)+'..' : (s.title||'');
    html += `<text x="${x+nW/2}" y="${y+30}" text-anchor="middle" fill="#c9d1d9" font-size="8">${t}</text>`;
    html += `<title>${(s.title||'')} ${s.passes?'PASS':'FAIL'} ${s.notes||''}</title>`;
  });
  for (let i = 0; i < pos.length - 1; i++) {
    const a = pos[i], b = pos[i+1];
    html += `<line x1="${a.x+nW/2}" y1="${a.y}" x2="${b.x-nW/2}" y2="${b.y}" stroke="#30363d" stroke-width="1.5" marker-end="url(#ra)"/>`;
  }
  svg.innerHTML = html;
}

function updateRalph(data) {
  const r = data.ralph;
  const sum = document.getElementById('ralph-summary');
  const list = document.getElementById('ralph-stories');
  if (!r) { sum.innerHTML = '<div style="color:#484f58">No prd.json found</div>'; list.innerHTML=''; renderRalphFlow([]); return; }
  sum.innerHTML = `
    <div class="inspector-row"><span class="key">Project</span><span class="val">${r.project}</span></div>
    <div class="inspector-row"><span class="key">Branch</span><span class="val" style="color:#58a6ff">${r.branch}</span></div>
    <div class="inspector-row"><span class="key">Progress</span><span class="val" style="color:#3fb950">${r.passed}/${r.total} passed</span></div>
    <div class="progress-bar" style="margin:6px 0"><div class="progress-fill" style="width:${r.total>0?Math.round(r.passed/r.total*100):0}%"></div></div>`;
  list.innerHTML = r.stories.map(s => `
    <div class="ralph-story">
      <span class="story-id">${s.id}</span> <span class="pass-badge ${s.passes?'pass':'fail'}">${s.passes?'PASS':'FAIL'}</span>
      <div class="story-title">${s.title}</div>
      <div class="story-meta">${s.module} | ${s.namespace} | P${s.priority}</div>
      ${s.notes ? `<div class="story-meta" style="color:#58a6ff">${s.notes}</div>` : ''}
    </div>
  `).join('');
  renderRalphFlow(r.stories);
}

// --- Commands Panel ---
function updateCommands(data) {
  const el = document.getElementById('commands-list');
  const cmds = data.slash_commands || [];
  const cats = {};
  cmds.forEach(c => { if(!cats[c.category]) cats[c.category]=[]; cats[c.category].push(c); });
  let html = '';
  for (const [cat, items] of Object.entries(cats)) {
    html += `<div style="padding:4px 12px;background:#0d1117;font-size:8px;color:#484f58;text-transform:uppercase;letter-spacing:1px;">${cat}</div>`;
    html += items.map(c => `
      <div class="cmd-item">
        <span class="cmd-name">/${c.name}</span>
        <span class="cmd-desc">${c.description}</span>
        <span class="cmd-status ${c.status}">${c.status}</span>
      </div>
    `).join('');
  }
  el.innerHTML = html;
}

// --- TODOs Panel ---
function updateTodos(data) {
  const active = (data.tasks||[]).filter(t => t.status !== 'completed');
  const done = (data.tasks||[]).filter(t => t.status === 'completed');
  document.getElementById('todos-active').innerHTML = active.length ? active.map(t => `
    <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #21262d;font-size:10px;">
      <span style="color:#484f58">#${t.id}</span>
      <span style="flex:1;margin:0 8px;color:#e6edf3">${t.subject}</span>
      <span class="status ${t.status}">${t.status.replace('_',' ')}</span>
    </div>
  `).join('') : '<div style="color:#484f58;font-size:10px;">No active tasks</div>';
  document.getElementById('todos-completed').innerHTML = done.slice(0,15).map(t => `
    <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #21262d;font-size:10px;">
      <span style="color:#484f58">#${t.id}</span>
      <span style="flex:1;margin:0 8px;color:#8b949e">${t.subject}</span>
      <span class="status completed">done</span>
    </div>
  `).join('');
}

// --- Notifications Panel ---
function updateNotifications(data) {
  const notifs = data.notifications || {};
  const badge = document.getElementById('bell-badge');
  if (notifs.unread > 0) { badge.textContent = notifs.unread; badge.classList.remove('hidden'); } else { badge.classList.add('hidden'); }
  const list = document.getElementById('notif-list');
  const recent = notifs.recent || [];
  list.innerHTML = recent.length ? recent.map(n => {
    const t = new Date(n.timestamp).toLocaleTimeString('en-US',{hour12:false,hour:'2-digit',minute:'2-digit'});
    return `<div class="notif-item ${n.read?'':'unread'}">
      <div class="notif-title"><span class="notif-cat ${n.category}">${n.category}</span>${n.title}</div>
      <div class="notif-body">${n.body}</div>
      <div class="notif-time">${t}</div>
    </div>`;
  }).join('') : '<div style="padding:20px;color:#484f58;text-align:center;font-size:11px;">No notifications</div>';
}

// --- Input Modal ---
function showInputModal(req) {
  document.getElementById('input-modal-prompt').textContent = req.prompt;
  const opts = document.getElementById('input-modal-options');
  opts.innerHTML = (req.options||[]).map((o,i) => `<button class="input-option" onclick="submitInput(${req.id},'${o.replace(/'/g,"\\'")}')">${o}</button>`).join('');
  document.getElementById('input-modal').style.display = 'flex';
}
function closeInputModal() { document.getElementById('input-modal').style.display = 'none'; }
function submitInput(id, choice) {
  fetch('/api/input/respond', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,choice})});
  closeInputModal();
}

// --- Event Log ---
function addEvent(msg, type) {
  const t = new Date().toLocaleTimeString('en-US',{hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'});
  eventLog.unshift({time:t,msg,type});
  if(eventLog.length>50) eventLog.pop();
}

// --- Main Refresh ---
let prevNotifIds = new Set();

async function refresh() {
  try {
    const res = await fetch('/api/data');
    const data = await res.json();
    document.getElementById('project').textContent = data.project;
    document.getElementById('s-agents').textContent = data.summary.total_agents;
    document.getElementById('s-completed').textContent = data.summary.completed;
    document.getElementById('s-tokens-in').textContent = fmt(data.summary.total_tokens_in);
    document.getElementById('s-tokens-out').textContent = fmt(data.summary.total_tokens_out);
    document.getElementById('s-tools').textContent = data.summary.total_tool_calls;
    document.getElementById('s-api').textContent = data.summary.total_api_calls;
    document.getElementById('progress').style.width = Math.round((data.summary.completed/data.summary.total_agents)*100)+'%';

    // Detect changes for notifications
    if (prevData) {
      data.agents.forEach(a => {
        const p = prevData.agents.find(x => x.id === a.id);
        if (p && p.status !== a.status && a.status === 'completed') {
          addEvent(`Agent "${a.name}" completed`, 'success');
          sendBrowserNotif('Agent Completed', `"${a.name}" has finished execution`, 'agent-'+a.id);
        }
        if (p && a.tools_used > p.tools_used) {
          addEvent(`${a.name}: +${a.tools_used-p.tools_used} tools`, 'info');
        }
      });
    }

    // Browser notifications for new server-side notifications
    const newNotifs = (data.notifications.recent||[]).filter(n => !prevNotifIds.has(n.id));
    newNotifs.forEach(n => {
      prevNotifIds.add(n.id);
      if (n.category !== 'system') sendBrowserNotif(n.title, n.body, 'notif-'+n.id);
    });

    // Check for input requests
    if (data.input_requests && data.input_requests.length > 0) {
      showInputModal(data.input_requests[0]);
    }

    prevData = data;
    drawGraph(data);

    // Agent fleet
    document.getElementById('agents').innerHTML = data.agents.map(a => `
      <div class="agent-row ${a.id===selectedAgent?'selected':''}" data-agent="${a.id}" onclick="selectAgent('${a.id}')">
        <div class="tier-badge tier-${a.tier}">T${a.tier}</div>
        <div class="agent-name">${a.name} <span class="id">${a.id}</span></div>
        <div class="metric"><span class="val">${fmt(a.tokens_in)}</span> <span class="unit">in</span></div>
        <div class="metric"><span class="val">${fmt(a.tokens_out)}</span> <span class="unit">out</span></div>
        <div class="metric"><span class="val">${a.tools_used}</span></div>
        <div class="metric"><span class="val">${a.file_size_kb}</span></div>
        <div><span class="status ${a.status}">${a.status}</span></div>
      </div>
    `).join('');

    // Tasks
    document.getElementById('tasks').innerHTML = data.tasks.map(t => `
      <div class="task-row"><span class="task-id">#${t.id}</span><span>${t.subject}</span><span><span class="status ${t.status}">${t.status.replace('_',' ')}</span></span></div>
    `).join('');

    // Event log
    document.getElementById('event-log').innerHTML = eventLog.map(e => `
      <div style="padding:3px 8px;border-bottom:1px solid #21262d;"><span style="color:#484f58;margin-right:6px;">${e.time}</span><span style="color:${e.type==='success'?'#3fb950':'#c9d1d9'}">${e.msg}</span></div>
    `).join('');

    // Right panels
    updateNotifications(data);
    updateRalph(data);
    updateCommands(data);
    updateTodos(data);
    if (selectedAgent) updateInspector();

    const ind = document.getElementById('refresh-indicator');
    ind.style.color = '#58a6ff';
    setTimeout(() => ind.style.color = '#3fb950', 200);
  } catch(e) { console.error('Refresh:', e); }
}

function updateClock() { document.getElementById('clock').textContent = new Date().toLocaleTimeString('en-US',{hour12:false}); }

setInterval(refresh, 2000);
setInterval(updateClock, 1000);
refresh();
updateClock();
addEvent('APM v3 initialized', 'system');
</script>
</body>
</html>"""


def _build_landing_html():
    """Build the project selector landing page."""
    projects = CFG.get("projects", [])
    active = CFG.get("active_project", "")
    cards = ""
    for p in projects:
        name = p.get("name", "unknown")
        status = p.get("status", "active")
        sessions = p.get("sessions", [])
        active_sessions = [s for s in sessions if s.get("status") == "active"]
        data = ensure_project_data(name)
        agent_count = len(data["agents"])
        ralph = get_ralph_data(project_name=name)
        ralph_prog = ""
        if ralph and ralph.get("total", 0) > 0:
            ralph_prog = f'{ralph["passed"]}/{ralph["total"]} stories passed'
        is_active = "border-color:#58a6ff;box-shadow:0 0 12px #58a6ff33;" if name == active else ""
        cards += f'''
        <a href="/project/{name}/" style="text-decoration:none;color:inherit;">
        <div style="background:#161b22;border:1px solid #30363d;border-radius:8px;padding:16px;{is_active}transition:all 0.2s;cursor:pointer;" onmouseover="this.style.borderColor='#58a6ff'" onmouseout="this.style.borderColor='{('#58a6ff' if name == active else '#30363d')}'">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <span style="font-size:16px;font-weight:700;color:#e6edf3;">{name}</span>
            <span style="padding:2px 8px;border-radius:10px;font-size:10px;font-weight:600;background:{'#23863533' if status=='active' else '#484f5833'};color:{'#3fb950' if status=='active' else '#8b949e'};">{status}</span>
          </div>
          <div style="font-size:11px;color:#8b949e;margin-bottom:4px;">Sessions: {len(active_sessions)} active / {len(sessions)} total</div>
          <div style="font-size:11px;color:#8b949e;margin-bottom:4px;">Agents: {agent_count}</div>
          {f'<div style="font-size:11px;color:#58a6ff;">{ralph_prog}</div>' if ralph_prog else ''}
          {f'<div style="font-size:10px;color:#484f58;margin-top:4px;">active project</div>' if name == active else ''}
        </div>
        </a>'''

    return f'''<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>CCEM APM v4 - Project Selector</title>
<meta http-equiv="refresh" content="5">
<style>
*{{margin:0;padding:0;box-sizing:border-box;}}
body{{background:#0a0e17;color:#c9d1d9;font-family:'SF Mono','Fira Code',monospace;font-size:13px;}}
.header{{background:linear-gradient(135deg,#161b22,#0d1117);border-bottom:1px solid #30363d;padding:12px 24px;display:flex;justify-content:space-between;align-items:center;}}
.header h1{{font-size:16px;color:#58a6ff;font-weight:600;}}
.header .meta{{color:#8b949e;font-size:11px;}}
.live-dot{{display:inline-block;width:8px;height:8px;background:#3fb950;border-radius:50%;margin-right:6px;animation:pulse 2s infinite;}}
@keyframes pulse{{0%,100%{{opacity:1;}}50%{{opacity:0.4;}}}}
.grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;padding:24px;max-width:1200px;margin:0 auto;}}
</style></head><body>
<div class="header">
  <h1><span class="live-dot"></span>CCEM APM v4</h1>
  <div class="meta">{len(projects)} project(s) | Uptime: {round(time.time()-SERVER_START_TIME)}s</div>
</div>
<div class="grid">{cards}</div>
</body></html>'''


class MonitorHandler(http.server.BaseHTTPRequestHandler):
    def _parse_path(self):
        """Parse path, extracting project name from /project/{name}/... routes."""
        from urllib.parse import urlparse, parse_qs
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/") or "/"
        qs = parse_qs(parsed.query)
        project_name = qs.get("project", [None])[0]
        m = re.match(r"^/project/([^/]+)(/.*)?$", path)
        if m:
            project_name = m.group(1)
            path = m.group(2) or "/"
            if not path.startswith("/"):
                path = "/" + path
        return path, qs, project_name

    def do_GET(self):
        path, qs, project_name = self._parse_path()

        # --- Global endpoints ---
        if path == "/health":
            projects_health = []
            for p in CFG.get("projects", []):
                name = p.get("name", "")
                data = ensure_project_data(name)
                projects_health.append({
                    "name": name,
                    "status": p.get("status", "unknown"),
                    "agent_count": len(data["agents"]),
                    "session_count": len(p.get("sessions", [])),
                })
            active_proj = get_active_project()
            self._json_response({
                "status": "ok",
                "uptime": round(time.time() - SERVER_START_TIME, 1),
                "total_projects": len(CFG.get("projects", [])),
                "active_project": CFG.get("active_project", ""),
                "projects": projects_health,
                "project": CFG.get("active_project", ""),
                "session_id": SESSION_ID,
            })
        elif path == "/api/projects":
            projects_list = []
            for p in CFG.get("projects", []):
                name = p.get("name", "")
                data = ensure_project_data(name)
                ralph = get_ralph_data(project_name=name)
                projects_list.append({
                    "name": name,
                    "root": p.get("root", ""),
                    "status": p.get("status", "unknown"),
                    "agent_count": len(data["agents"]),
                    "session_count": len(p.get("sessions", [])),
                    "ralph_passed": ralph.get("passed", 0) if ralph else 0,
                    "ralph_total": ralph.get("total", 0) if ralph else 0,
                })
            self._json_response({"projects": projects_list, "active_project": CFG.get("active_project", "")})
        elif path == "/api/data":
            self._json_response(get_api_data(project_name=project_name))
        elif path == "/api/notifications":
            self._json_response({"notifications": _notifications[:50]})
        elif path == "/api/ralph":
            self._json_response(get_ralph_data(project_name=project_name) or {})
        elif path == "/api/ralph/flowchart":
            self._json_response(get_ralph_flowchart_data(project_name=project_name))
        elif path == "/api/commands":
            self._json_response({"commands": SLASH_COMMANDS})
        elif path == "/api/agents/discover":
            if project_name:
                proj_cfg = get_project(project_name)
                td = proj_cfg.get("tasks_dir") if proj_cfg else None
                found = discover_agents(tasks_dir=td, project_name=project_name)
                data = ensure_project_data(project_name)
                self._json_response({"discovered": found, "total_agents": len(data["agents"]), "project": project_name})
            else:
                found = discover_agents()
                self._json_response({"discovered": found, "total_agents": len(AGENTS)})
        elif path == "/api/input/pending":
            with _input_lock:
                pending = [r for r in _input_requests if not r["responded"]]
            self._json_response({"requests": pending[:10]})
        elif path == "/" and project_name is None:
            # Landing page: project selector
            self.send_response(200)
            self.send_header("Content-Type", "text/html")
            self.send_header("Cache-Control", "no-cache")
            self.end_headers()
            self.wfile.write(_build_landing_html().encode())
        elif path == "/" and project_name:
            # Project-scoped dashboard: inject project name into JS
            if not get_project(project_name):
                self._json_response({"error": f"Project '{project_name}' not found"}, code=404)
                return
            dashboard = DASHBOARD_HTML.replace(
                "fetch('/api/data')",
                f"fetch('/project/{project_name}/api/data')"
            ).replace(
                "APM v3</h1>",
                f'APM v4 - {project_name}</h1>'
            ).replace(
                '<div class="meta">',
                f'<div class="meta"><a href="/" style="color:#58a6ff;text-decoration:none;margin-right:8px;">All Projects</a>'
            )
            self.send_response(200)
            self.send_header("Content-Type", "text/html")
            self.send_header("Cache-Control", "no-cache")
            self.end_headers()
            self.wfile.write(dashboard.encode())
        elif self.path == "/index.html":
            self.send_response(200)
            self.send_header("Content-Type", "text/html")
            self.send_header("Cache-Control", "no-cache")
            self.end_headers()
            self.wfile.write(DASHBOARD_HTML.encode())
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        path, qs, project_name = self._parse_path()

        if path == "/api/notifications/read-all":
            with _notification_lock:
                for n in _notifications:
                    n["read"] = True
            self._json_response({"ok": True})
        elif path == "/api/input/respond":
            body = self._read_body()
            req_id = body.get("id")
            choice = body.get("choice")
            with _input_lock:
                for r in _input_requests:
                    if r["id"] == req_id:
                        r["responded"] = True
                        r["response"] = choice
                        _input_responses[req_id] = choice
                        add_notification("Input Received", f'User chose: "{choice}"', category="info")
                        break
            self._json_response({"ok": True, "id": req_id, "choice": choice})
        elif path == "/api/notifications/add":
            body = self._read_body()
            nid = add_notification(
                body.get("title", "Notification"),
                body.get("body", ""),
                body.get("category", "info"),
                body.get("agent_id"),
            )
            self._json_response({"ok": True, "id": nid})
        elif path == "/api/input/request":
            body = self._read_body()
            rid = add_input_request(
                body.get("prompt", ""),
                body.get("options", []),
                body.get("context"),
            )
            self._json_response({"ok": True, "id": rid})
        elif path == "/api/agents/register":
            body = self._read_body()
            agent_id = body.get("id")
            if not agent_id:
                self._json_response({"error": "Missing required field: id"})
                return
            pn = body.get("project_name") or project_name
            register_agent(
                agent_id=agent_id,
                name=body.get("name", agent_id),
                tier=body.get("tier", 1),
                status=body.get("status", "idle"),
                deps=body.get("deps", []),
                metadata=body.get("metadata", {}),
                project_name=pn,
            )
            self._json_response({"ok": True, "id": agent_id, "project": _resolve_project(pn)})
        elif path == "/api/agents/update":
            body = self._read_body()
            agent_id = body.get("id")
            if agent_id and agent_id in AGENTS:
                for key in ["status", "tier", "name", "deps", "plane"]:
                    if key in body:
                        AGENTS[agent_id][key] = body[key]
                self._json_response({"ok": True})
            else:
                self._json_response({"error": "Agent not found"})
        elif path == "/api/tasks/sync":
            body = self._read_body()
            global TASKS
            if isinstance(body, list):
                TASKS = body
            elif isinstance(body, dict) and "tasks" in body:
                TASKS = body["tasks"]
            self._json_response({"ok": True, "count": len(TASKS)})
        elif path == "/api/config/reload":
            reload_config()
            for p in CFG.get("projects", []):
                ensure_project_data(p["name"])
            self._json_response({"ok": True, "active_project": CFG.get("active_project"), "total_projects": len(CFG.get("projects", []))})
        elif path == "/api/plane/update":
            body = self._read_body()
            global PLANE_PM
            PLANE_PM = body
            self._json_response({"ok": True})
        elif path == "/api/commands":
            body = self._read_body()
            global SLASH_COMMANDS
            if isinstance(body, list):
                SLASH_COMMANDS = body
            else:
                SLASH_COMMANDS.append(body)
            self._json_response({"ok": True, "count": len(SLASH_COMMANDS)})
        else:
            self.send_response(404)
            self.end_headers()

    def _read_body(self):
        length = int(self.headers.get("Content-Length", 0))
        if length:
            try:
                return json.loads(self.rfile.read(length))
            except Exception:
                return {}
        return {}

    def _json_response(self, data, code=200):
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def log_message(self, format, *args):
        pass


if __name__ == "__main__":
    discover_agents()
    server = http.server.HTTPServer(("0.0.0.0", PORT), MonitorHandler)
    print(f"CCEM APM v4 running at http://localhost:{PORT}")
    print(f"Config: {CONFIG_PATH}")
    print(f"Active project: {CFG.get('active_project', 'none')}")
    print(f"Projects: {[p['name'] for p in CFG.get('projects', [])]}")
    server.serve_forever()
