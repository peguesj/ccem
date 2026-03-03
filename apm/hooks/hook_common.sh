#!/bin/bash
# Common variables and functions for all CCEM APM hooks
# Source this file from other hooks: source "$HOME/Developer/ccem/apm/hooks/hook_common.sh"

APM_URL="http://localhost:3032"
LOG_DIR="$HOME/Developer/ccem/apm/hooks"
LOG="$LOG_DIR/apm_hook.log"
STATE_DIR="$HOME/Developer/ccem/apm/.hook_state"
mkdir -p "$STATE_DIR"

# Load session state file; sets globals: TRACE_ID, FORMATION_ID, FORMATION_ROLE,
# AGENT_LEVEL, PARENT_SPAN_ID, PARENT_SESSION_ID
load_state() {
  local session_id="$1"
  local state_file="$STATE_DIR/${session_id}.json"
  if [ -f "$state_file" ]; then
    TRACE_ID=$(jq -r '.trace_id // ""' "$state_file" 2>/dev/null || echo "")
    FORMATION_ID=$(jq -r '.formation_id // ""' "$state_file" 2>/dev/null || echo "")
    FORMATION_ROLE=$(jq -r '.formation_role // "solo"' "$state_file" 2>/dev/null || echo "solo")
    AGENT_LEVEL=$(jq -r '.agent_level // 0' "$state_file" 2>/dev/null || echo "0")
    PARENT_SPAN_ID=$(jq -r '.parent_span_id // ""' "$state_file" 2>/dev/null || echo "")
    PARENT_SESSION_ID=$(jq -r '.parent_session_id // ""' "$state_file" 2>/dev/null || echo "")
  else
    TRACE_ID=$(openssl rand -hex 16)
    FORMATION_ID=""
    FORMATION_ROLE="solo"
    AGENT_LEVEL=0
    PARENT_SPAN_ID=""
    PARENT_SESSION_ID=""
  fi
}

# Generate a new 8-byte hex span ID
new_span_id() {
  openssl rand -hex 8
}

# Current timestamp in ISO8601 UTC with millisecond precision
now_iso() {
  date -u +%Y-%m-%dT%H:%M:%S.000Z
}

# Current time in milliseconds since epoch
now_ms() {
  date +%s%3N 2>/dev/null || python3 -c "import time; print(int(time.time()*1000))"
}
