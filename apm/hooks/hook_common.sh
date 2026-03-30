#!/bin/bash
# Common variables and functions for all CCEM APM hooks
# Source this file from other hooks: source "$HOME/Developer/ccem/apm/hooks/hook_common.sh"

# DevDrive: ensure HooksEnv is mounted and PATH includes devdrive binaries
HOOKS_ENV="/Volumes/DDRV900"
SPARSEIMAGE="$HOME/DevDrive/900HOOKS.dmg.sparseimage"
if [ ! -d "$HOOKS_ENV" ] && [ -f "$SPARSEIMAGE" ]; then
  hdiutil attach "$SPARSEIMAGE" -mountpoint "$HOOKS_ENV" -quiet -nobrowse 2>/dev/null || true
fi
if [ -d "$HOOKS_ENV" ]; then
  export PATH="$HOOKS_ENV/npm-global/bin:$HOOKS_ENV/python-venv/bin:$PATH"
  export VIRTUAL_ENV="$HOOKS_ENV/python-venv"
fi

APM_URL="http://localhost:3032"
LOG_DIR="$HOME/Developer/ccem/apm/hooks"
LOG="$LOG_DIR/apm_hook.log"
STATE_DIR="$HOME/Developer/ccem/apm/.hook_state"
mkdir -p "$STATE_DIR"

# Check jq availability once; set HAS_JQ for callers
if command -v jq >/dev/null 2>&1; then
  HAS_JQ=1
else
  HAS_JQ=0
fi

# Safe jq wrapper: returns fallback if jq is not installed
_jq() {
  local fallback="$1"; shift
  if [ "$HAS_JQ" = "1" ]; then
    jq "$@" 2>/dev/null || echo "$fallback"
  else
    echo "$fallback"
  fi
}

# Load session state file; sets globals: TRACE_ID, FORMATION_ID, FORMATION_ROLE,
# AGENT_LEVEL, PARENT_SPAN_ID, PARENT_SESSION_ID
load_state() {
  local session_id="$1"
  local state_file="$STATE_DIR/${session_id}.json"
  if [ -f "$state_file" ]; then
    TRACE_ID=$(_jq "" -r '.trace_id // ""' "$state_file")
    FORMATION_ID=$(_jq "" -r '.formation_id // ""' "$state_file")
    FORMATION_ROLE=$(_jq "solo" -r '.formation_role // "solo"' "$state_file")
    AGENT_LEVEL=$(_jq "0" -r '.agent_level // 0' "$state_file")
    PARENT_SPAN_ID=$(_jq "" -r '.parent_span_id // ""' "$state_file")
    PARENT_SESSION_ID=$(_jq "" -r '.parent_session_id // ""' "$state_file")
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
# Note: macOS BSD date does not support %N (nanoseconds), so date +%s%3N returns a
# literal "N" suffix rather than milliseconds. Use python3 directly on macOS.
now_ms() {
  if python3 -c "import time; print(int(time.time()*1000))" 2>/dev/null; then
    return 0
  fi
  # Fallback for systems without python3: use seconds * 1000
  echo $(( $(date +%s) * 1000 ))
}
