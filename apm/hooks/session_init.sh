#!/bin/bash
# CCEM APM v4 Session Initialization Hook
# Called from Claude Code SessionStart hook to ensure APM server is running
# and register the current session within the multi-project config.
#
# Architecture: Single server on port 3032 with multi-project namespacing.
# Config uses v4 schema with projects array -- sessions APPEND, never overwrite.
# Sessions are tracked in ~/Developer/ccem/apm/sessions/{session_id}.json
#
# Usage: bash ~/Developer/ccem/apm/hooks/session_init.sh
# Input: JSON from stdin (Claude Code hook payload with session_id, cwd, etc.)

set -euo pipefail

APM_DIR="$HOME/Developer/ccem/apm"
APM_V4_DIR="$HOME/Developer/ccem/apm-v4"
APM_PORT=3032
SESSIONS_DIR="$APM_DIR/sessions"
LOG_FILE="$APM_DIR/hooks/apm_hook.log"
PID_FILE="$APM_V4_DIR/.apm.pid"
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
    if [ -f "$PID_FILE" ]; then
        local pid
        pid=$(cat "$PID_FILE" 2>/dev/null || echo "")
        if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            return 0
        fi
    fi
    # Fallback: check if port is in use (use netstat - lsof hangs with many connections)
    if netstat -anp tcp 2>/dev/null | grep -q "\.${APM_PORT} .*LISTEN"; then
        return 0
    fi
    return 1
}

# Start APM v4 Phoenix server if not running
start_apm() {
    if [ ! -d "$APM_V4_DIR" ]; then
        log "ERROR: APM v4 dir not found at $APM_V4_DIR"
        return 1
    fi

    log "Starting APM v4 Phoenix on port $APM_PORT..."
    (cd "$APM_V4_DIR" && PORT=$APM_PORT nohup mix phx.server > "$APM_DIR/hooks/apm_server.log" 2>&1) &
    local pid=$!
    echo "$pid" > "$PID_FILE"
    log "APM v4 Phoenix started (PID: $pid)"

    # Wait for server to initialize (use netstat - lsof hangs with many connections)
    sleep 4

    if netstat -anp tcp 2>/dev/null | grep -q "\.${APM_PORT} .*LISTEN"; then
        log "APM v4 Phoenix confirmed running on port $APM_PORT"
        return 0
    else
        log "WARN: Could not confirm port $APM_PORT via netstat; proceeding"
        return 0
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
  "apm_port": $APM_PORT
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
    if is_apm_running; then
        log "APM server already running on port $APM_PORT"
    else
        start_apm || log "WARN: Could not start APM server (non-fatal)"
    fi

    init_trace_context
    register_session
    update_apm_config

    # Notify running APM server to reload config
    if is_apm_running; then
        curl -s -X POST "http://localhost:${APM_PORT}/api/config/reload" >/dev/null 2>&1 || true
        log "Sent config reload to APM server"
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
