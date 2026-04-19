#!/bin/bash
# CCEM APM v9.0.0 Session Initialization Hook
# Called from Claude Code SessionStart hook to ensure APM server is running
# and register the current session within the multi-project config.
# Max-payload: session_id, project, working_dir, git_branch, timestamp.
#
# Architecture: Single server on port 3032 with multi-project namespacing.
# Config uses v4 schema with projects array -- sessions APPEND, never overwrite.
# Sessions are tracked in ~/Developer/ccem/apm/sessions/{session_id}.json
#
# Usage: bash ~/Developer/ccem/apm/hooks/session_init.sh
# Input: JSON from stdin (Claude Code hook payload with session_id, cwd, etc.)

set -euo pipefail

# ── DevDrive: mount DDRV900 (900HOOKS) sparse image if not already mounted ──────────────
_HOOKS_ENV="/Volumes/DDRV900"
_SPARSEIMAGE="$HOME/DevDrive/900HOOKS.dmg.sparseimage"
if [ ! -d "$_HOOKS_ENV" ] && [ -f "$_SPARSEIMAGE" ]; then
  hdiutil attach "$_SPARSEIMAGE" -mountpoint "$_HOOKS_ENV" -quiet -nobrowse 2>/dev/null || true
fi

APM_DIR="$HOME/Developer/ccem/apm"
APM_V4_DIR="$HOME/Developer/ccem/apm-v4"
APM_PORT=3032
SESSIONS_DIR="$APM_DIR/sessions"
LOG_FILE="$APM_DIR/hooks/apm_hook.log"
PID_FILE="/Volumes/DDRV902/pid/.apm.pid"
CONFIG_FILE="$APM_DIR/apm_config.json"

mkdir -p "$SESSIONS_DIR" "$(dirname "$LOG_FILE")"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') [APM-HOOK-v4] $1" >> "$LOG_FILE"
}

# Read hook input from stdin
INPUT=$(cat 2>/dev/null || echo '{}')

# Extract session metadata
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // "unknown"' 2>/dev/null || echo "unknown")
CWD=$(echo "$INPUT" | jq -r '.cwd // "unknown"' 2>/dev/null || pwd)

log "Session init: $SESSION_ID (cwd: $CWD)"

# Derive project name from working directory
PROJECT_NAME=$(basename "$CWD" 2>/dev/null || echo "unknown")

# Check if APM server is already running on the configured port
is_apm_running() {
    # 1. PID file check — validate the process is actually BEAM/mix, not a reused PID
    if [ -f "$PID_FILE" ]; then
        local pid
        pid=$(cat "$PID_FILE" 2>/dev/null || echo "")
        if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            # Verify it's actually a BEAM/Elixir process, not a stale PID reused by the OS
            if ps -p "$pid" -o command= 2>/dev/null | grep -qE "beam|elixir|mix"; then
                return 0
            else
                log "WARN: PID $pid exists but is not BEAM — removing stale PID file"
                rm -f "$PID_FILE"
            fi
        else
            # PID file exists but process is dead — clean up
            log "WARN: Stale PID file (PID $pid dead) — removing"
            rm -f "$PID_FILE"
        fi
    fi
    # 2. Fallback: check if port is in use (use netstat — lsof hangs with many connections)
    if netstat -anp tcp 2>/dev/null | grep -q "\.${APM_PORT} .*LISTEN"; then
        return 0
    fi
    return 1
}

# Kill zombie or wedged BEAM processes that may hold the port
cleanup_stale_beam() {
    # Find BEAM processes listening on our port that are stuck (state T or D)
    local stale_pids
    stale_pids=$(ps aux | grep "beam.smp" | grep -v grep | awk '{print $2, $8}' | while read pid state; do
        if [ "$state" = "T" ] || [ "$state" = "U" ] || [ "$state" = "D" ]; then
            echo "$pid"
        fi
    done)
    if [ -n "$stale_pids" ]; then
        log "WARN: Found stale BEAM processes: $stale_pids — sending SIGKILL"
        echo "$stale_pids" | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
}

# Start APM v4 Phoenix server if not running
# Uses flock to prevent concurrent invocations from racing (CCEM-392)
start_apm() {
    if [ ! -d "$APM_V4_DIR" ]; then
        log "ERROR: APM v4 dir not found at $APM_V4_DIR"
        return 1
    fi

    # Pre-flight: ensure epmd is running (BEAM distributed-protocol daemon)
    epmd -daemon 2>/dev/null || true

    # Pre-flight: clean up any zombie BEAM processes holding the port
    cleanup_stale_beam

    # Pre-flight: check if port is already occupied by something else
    if netstat -anp tcp 2>/dev/null | grep -q "\.${APM_PORT} .*LISTEN"; then
        log "WARN: Port $APM_PORT already occupied (not by our PID) — attempting to reclaim"
        # Find the PID holding the port via netstat + ps
        local blocking_pid
        blocking_pid=$(netstat -anv -p tcp 2>/dev/null | grep "\.${APM_PORT} .*LISTEN" | awk '{print $9}' | head -1)
        if [ -n "$blocking_pid" ] && [ "$blocking_pid" != "0" ]; then
            log "Killing blocking process PID $blocking_pid on port $APM_PORT"
            kill -9 "$blocking_pid" 2>/dev/null || true
            sleep 2
        fi
    fi

    log "Starting APM v4 Phoenix on port $APM_PORT..."
    (cd "$APM_V4_DIR" && PORT=$APM_PORT \
      TUNNEL_RELAY_URL="wss://ccem-relay.wonderfulflower-c29529fc.eastus.azurecontainerapps.io/ws" \
      TUNNEL_SECRET="da53c96eee10ea9289900a7dd0cf647ee28cfebfa84254e3b03a247fdce545bd" \
      nohup mix phx.server > "/Volumes/DDRV902/logs/apm_server.log" 2>&1) &
    local pid=$!
    echo "$pid" > "$PID_FILE"
    log "APM v4 Phoenix started (PID: $pid)"

    # Launch CCEMHelper alongside APM (mandatory per CLAUDE.md)
    open -a CCEMHelper 2>/dev/null || true

    # Wait for server to initialize with timeout (max 10s)
    local attempts=0
    local max_attempts=5
    while [ $attempts -lt $max_attempts ]; do
        sleep 2
        attempts=$((attempts + 1))
        if netstat -anp tcp 2>/dev/null | grep -q "\.${APM_PORT} .*LISTEN"; then
            log "APM v4 Phoenix confirmed running on port $APM_PORT (after ${attempts}x2s)"
            return 0
        fi
        # Check if the process died during startup
        if ! kill -0 "$pid" 2>/dev/null; then
            log "ERROR: APM process (PID $pid) died during startup — check /Volumes/DDRV902/logs/apm_server.log"
            rm -f "$PID_FILE"
            return 1
        fi
    done

    # Final check — process alive but port not confirmed
    if kill -0 "$pid" 2>/dev/null; then
        log "WARN: APM process running (PID $pid) but port $APM_PORT not confirmed after ${max_attempts}x2s — may still be compiling"
        return 0
    else
        log "ERROR: APM process died — check logs"
        rm -f "$PID_FILE"
        return 1
    fi
}

# Register session in per-session file
register_session() {
    local session_file="$SESSIONS_DIR/${SESSION_ID}.json"

    # Detect JSONL path from Claude Code projects directory
    local jsonl_base="$HOME/.claude/projects"
    local encoded_cwd
    encoded_cwd=$(echo "$CWD" | sed 's|[/_]|-|g')
    local jsonl_path="${jsonl_base}/${encoded_cwd}/${SESSION_ID}.jsonl"

    # Try to find tasks directory for this session
    local tasks_dir="/private/tmp/claude-503/${encoded_cwd}/tasks"
    if [ ! -d "$tasks_dir" ]; then
        tasks_dir=$(ls -d /private/tmp/claude-503/${encoded_cwd}/d*/tasks 2>/dev/null | head -1 || echo "")
    fi

    # Look for prd.json in project
    local prd_json=""
    if [ -f "${CWD}/.claude/ralph/prd.json" ]; then
        prd_json="${CWD}/.claude/ralph/prd.json"
    fi

    # Look for TODO in project
    local todo_md=""
    for f in "${CWD}/.claude/plans/"*TODO*.md; do
        if [ -f "$f" ]; then
            todo_md="$f"
            break
        fi
    done

    # Detect Plane plugin context from project CLAUDE.md
    local plugin_context=""
    local plane_project_id=""
    if [ -f "${CWD}/.claude/CLAUDE.md" ]; then
        plane_project_id=$(grep -oE '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' "${CWD}/.claude/CLAUDE.md" 2>/dev/null | head -1)
        [ -n "$plane_project_id" ] && plugin_context="plane"
    fi

    cat > "$session_file" << ENDJSON
{
  "session_id": "$SESSION_ID",
  "project_name": "$PROJECT_NAME",
  "project_root": "$CWD",
  "start_time": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "status": "active",
  "session_jsonl": "$jsonl_path",
  "tasks_dir": "$tasks_dir",
  "prd_json": "$prd_json",
  "todo_md": "$todo_md",
  "apm_port": $APM_PORT,
  "plugin_context": "$plugin_context",
  "plane_project_id": "$plane_project_id"
}
ENDJSON

    log "Session registered: $session_file"
}

# UPSERT project into the v4 multi-project config (NEVER overwrites other projects)
update_apm_config() {
    local now
    now=$(date -u +%Y-%m-%dT%H:%M:%SZ)

    local encoded_cwd
    encoded_cwd=$(echo "$CWD" | sed 's|[/_]|-|g')
    local tasks_dir="/private/tmp/claude-503/${encoded_cwd}/tasks"
    local jsonl_base="$HOME/.claude/projects"
    local jsonl_path="${jsonl_base}/${encoded_cwd}/${SESSION_ID}.jsonl"
    local prd_json=""
    [ -f "${CWD}/.claude/ralph/prd.json" ] && prd_json="${CWD}/.claude/ralph/prd.json"

    # Ensure config exists with v4 structure
    if [ ! -f "$CONFIG_FILE" ] || ! jq -e '.version == "4.0.0"' "$CONFIG_FILE" >/dev/null 2>&1; then
        log "Initializing v4 config (migrating or creating fresh)"
        cat > "$CONFIG_FILE" << ENDJSON
{
  "\$schema": "./apm_config_v4.schema.json",
  "version": "4.0.0",
  "port": $APM_PORT,
  "active_project": "$PROJECT_NAME",
  "projects": []
}
ENDJSON
    fi

    # Check if project already exists in the array
    local project_exists
    project_exists=$(jq --arg name "$PROJECT_NAME" '[.projects[] | select(.name == $name)] | length' "$CONFIG_FILE" 2>/dev/null || echo "0")

    if [ "$project_exists" -gt "0" ]; then
        # Project exists: upsert session into its sessions array, update active_project
        local session_exists
        session_exists=$(jq --arg name "$PROJECT_NAME" --arg sid "$SESSION_ID" \
            '[.projects[] | select(.name == $name) | .sessions[]? | select(.session_id == $sid)] | length' \
            "$CONFIG_FILE" 2>/dev/null || echo "0")

        if [ "$session_exists" -eq "0" ]; then
            # Add new session to existing project
            jq --arg name "$PROJECT_NAME" --arg sid "$SESSION_ID" --arg jsonl "$jsonl_path" --arg now "$now" \
                '(.projects[] | select(.name == $name) | .sessions) += [{
                    "session_id": $sid,
                    "session_jsonl": $jsonl,
                    "start_time": $now,
                    "status": "active"
                }] | .active_project = $name' \
                "$CONFIG_FILE" > "${CONFIG_FILE}.tmp" && mv "${CONFIG_FILE}.tmp" "$CONFIG_FILE"
            log "Added session $SESSION_ID to existing project $PROJECT_NAME"
        else
            # Session already exists, just update active_project
            jq --arg name "$PROJECT_NAME" '.active_project = $name' \
                "$CONFIG_FILE" > "${CONFIG_FILE}.tmp" && mv "${CONFIG_FILE}.tmp" "$CONFIG_FILE"
            log "Session $SESSION_ID already registered, updated active_project to $PROJECT_NAME"
        fi
    else
        # New project: append to projects array
        jq --arg name "$PROJECT_NAME" --arg root "$CWD" --arg tasks "$tasks_dir" \
           --arg prd "$prd_json" --arg sid "$SESSION_ID" --arg jsonl "$jsonl_path" --arg now "$now" \
            '.projects += [{
                "name": $name,
                "root": $root,
                "tasks_dir": $tasks,
                "prd_json": $prd,
                "todo_md": "",
                "status": "active",
                "registered_at": $now,
                "sessions": [{
                    "session_id": $sid,
                    "session_jsonl": $jsonl,
                    "start_time": $now,
                    "status": "active"
                }]
            }] | .active_project = $name' \
            "$CONFIG_FILE" > "${CONFIG_FILE}.tmp" && mv "${CONFIG_FILE}.tmp" "$CONFIG_FILE"
        log "Registered new project $PROJECT_NAME with session $SESSION_ID"
    fi

    log "APM v4 config updated (active_project: $PROJECT_NAME, total projects: $(jq '.projects | length' "$CONFIG_FILE"))"
}

# Main execution
# ---------------------------------------------------------------------------
# Trace context propagation (added for multi-agent telemetry)
# ---------------------------------------------------------------------------
STATE_DIR="$HOME/Developer/ccem/apm/.hook_state"
mkdir -p "$STATE_DIR"

# Check for a pending handoff written by a parent session's SubagentStart hook.
# If found: inherit trace_id, formation_id, parent_span_id, agent_level.
# If not found: generate a fresh trace_id for this solo session.
init_trace_context() {
    local pending_file="$STATE_DIR/pending_${SESSION_ID}.json"
    local state_file="$STATE_DIR/${SESSION_ID}.json"

    if [ -f "$pending_file" ]; then
        log "Inheriting trace context from parent (handoff: $pending_file)"
        TRACE_ID=$(jq -r '.trace_id // ""' "$pending_file" 2>/dev/null || echo "")
        FORMATION_ID=$(jq -r '.formation_id // ""' "$pending_file" 2>/dev/null || echo "")
        PARENT_SPAN_ID=$(jq -r '.parent_span_id // ""' "$pending_file" 2>/dev/null || echo "")
        FORMATION_ROLE=$(jq -r '.formation_role // "agent"' "$pending_file" 2>/dev/null || echo "agent")
        AGENT_LEVEL=$(jq -r '.agent_level // 1' "$pending_file" 2>/dev/null || echo "1")
        PARENT_SESSION_ID=$(jq -r '.parent_session_id // ""' "$pending_file" 2>/dev/null || echo "")
        rm -f "$pending_file"
    else
        TRACE_ID=$(openssl rand -hex 16)
        FORMATION_ID=""
        PARENT_SPAN_ID=""
        FORMATION_ROLE="solo"
        AGENT_LEVEL=0
        PARENT_SESSION_ID=""
    fi

    # Write state for use by PreToolUse/PostToolUse/SubagentStart hooks
    cat > "$state_file" << STATEJSON
{
  "session_id": "$SESSION_ID",
  "trace_id": "$TRACE_ID",
  "formation_id": "$FORMATION_ID",
  "parent_span_id": "$PARENT_SPAN_ID",
  "formation_role": "$FORMATION_ROLE",
  "agent_level": $AGENT_LEVEL,
  "parent_session_id": "$PARENT_SESSION_ID",
  "project_name": "$PROJECT_NAME",
  "started_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
STATEJSON
    log "Trace context initialized: trace_id=$TRACE_ID role=$FORMATION_ROLE level=$AGENT_LEVEL"
}


main() {
    # CCEM-124: Clean up stale hook state files older than 24 hours
    if [ -d "$STATE_DIR" ]; then
        find "$STATE_DIR" -name "*.json" -mtime +1 -delete 2>/dev/null
        log "Hook state TTL cleanup: removed files older than 24h from $STATE_DIR"
    fi

    # CCEM-392: mkdir mutex prevents concurrent session_init calls from
    # racing to start multiple BEAM instances on the same port.
    # mkdir is atomic on POSIX — only one process succeeds.
    local lock_dir="/tmp/.ccem-apm-init.lock"
    if is_apm_running; then
        log "APM server already running on port $APM_PORT"
    else
        if mkdir "$lock_dir" 2>/dev/null; then
            # We hold the lock — clean up on exit
            trap 'rmdir "$lock_dir" 2>/dev/null' EXIT
            # Double-check after acquiring lock
            if ! is_apm_running; then
                start_apm || log "WARN: Could not start APM server (non-fatal)"
            fi
            rmdir "$lock_dir" 2>/dev/null
            trap - EXIT
        else
            # Another init is running — stale lock safety valve (60s)
            local lock_age
            lock_age=$(( $(date +%s) - $(stat -f %m "$lock_dir" 2>/dev/null || echo "0") ))
            if [ "$lock_age" -gt 60 ]; then
                log "WARN: Stale lock (${lock_age}s old) — removing"
                rmdir "$lock_dir" 2>/dev/null
            else
                log "Another session_init is starting APM — skipping"
            fi
        fi
    fi

    init_trace_context
    register_session
    update_apm_config

    # Notify running APM server to reload config and register the session agent
    if is_apm_running; then
        curl -s -X POST "http://localhost:${APM_PORT}/api/config/reload" >/dev/null 2>&1 || true
        log "Sent config reload to APM server"

        # Register this session as an agent in the AgentRegistry so that
        # subsequent heartbeats from PreToolUse/PostToolUse hooks are accepted.
        # Without this, POST /api/heartbeat returns 404 (agent not found).
        # Detect Plane plugin context for registration payload
        local reg_plugin_context=""
        if [ -f "${CWD}/.claude/CLAUDE.md" ]; then
            local reg_plane_id
            reg_plane_id=$(grep -oE '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' "${CWD}/.claude/CLAUDE.md" 2>/dev/null | head -1)
            [ -n "$reg_plane_id" ] && reg_plugin_context="plane"
        fi

        local register_payload
        register_payload=$(jq -n \
          --arg agent_id "session-${SESSION_ID}" \
          --arg project "$PROJECT_NAME" \
          --arg role "$FORMATION_ROLE" \
          --arg status "active" \
          --arg formation_id "$FORMATION_ID" \
          --arg session_id "$SESSION_ID" \
          --arg plugin_context "$reg_plugin_context" \
          '{
            agent_id: $agent_id,
            project: $project,
            role: $role,
            status: $status,
            formation_id: $formation_id,
            session_id: $session_id,
            plugin_context: (if $plugin_context != "" then $plugin_context else null end)
          }' 2>/dev/null)
        curl -s -X POST "http://localhost:${APM_PORT}/api/register" \
          -H "Content-Type: application/json" \
          -d "$register_payload" >/dev/null 2>&1 || true
        log "Registered session agent: session-${SESSION_ID}"

        # Create a formal AgentLock auth session so that agentlock_pre_tool.sh
        # tokens are bound to a real session_id (not ephemeral per-call).
        # Without this, /api/v2/auth/sessions always shows 0 active sessions
        # even while tools are being authorized.
        local auth_session_payload
        auth_session_payload=$(jq -n \
          --arg session_id "auth_sess_${SESSION_ID}" \
          --arg user_id "jeremiah" \
          --arg project "$PROJECT_NAME" \
          --arg role "$FORMATION_ROLE" \
          '{
            session_id: $session_id,
            user_id: $user_id,
            metadata: {
              project: $project,
              role: $role
            }
          }' 2>/dev/null)
        curl -s -X POST "http://localhost:${APM_PORT}/api/v2/auth/sessions" \
          -H "Content-Type: application/json" \
          -d "$auth_session_payload" >/dev/null 2>&1 || true
        log "Created AgentLock auth session: auth_sess_${SESSION_ID}"
    fi

    # Output success for hook system
    cat << ENDJSON
{
  "success": true,
  "apm_running": true,
  "apm_port": $APM_PORT,
  "session_id": "$SESSION_ID",
  "project_name": "$PROJECT_NAME",
  "apm_url": "http://localhost:$APM_PORT"
}
ENDJSON
}

main
