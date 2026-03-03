#!/bin/bash
# PostToolUse hook - fires after each successful tool call
# Reads JSON from stdin, calculates tool duration, emits heartbeat to APM.
# Always exits 0 to never block Claude Code.

source "$HOME/Developer/ccem/apm/hooks/hook_common.sh"

INPUT=$(cat)
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // "unknown"' 2>/dev/null || echo "unknown")
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // "unknown"' 2>/dev/null || echo "unknown")
TOOL_USE_ID=$(echo "$INPUT" | jq -r '.tool_use_id // ""' 2>/dev/null || echo "")
CWD=$(echo "$INPUT" | jq -r '.cwd // ""' 2>/dev/null || echo "")
PROJECT_NAME=$(basename "$CWD")

load_state "$SESSION_ID"

# Calculate duration from span start file
SPAN_FILE="$STATE_DIR/${SESSION_ID}_${TOOL_USE_ID}.json"
START_MS=0
if [ -f "$SPAN_FILE" ]; then
  START_MS=$(jq -r '.start_ms // 0' "$SPAN_FILE" 2>/dev/null || echo "0")
  rm -f "$SPAN_FILE"
fi
NOW_MS=$(now_ms)
DURATION_MS=$((NOW_MS - START_MS))

PAYLOAD=$(jq -n \
  --arg agent_id "session-${SESSION_ID}" \
  --arg status "working" \
  --arg message "Tool: ${TOOL_NAME} | Done (${DURATION_MS}ms)" \
  --arg formation_id "$FORMATION_ID" \
  '{
    agent_id: $agent_id,
    status: $status,
    message: $message,
    formation_id: $formation_id
  }' 2>/dev/null)

curl -s -X POST "$APM_URL/api/heartbeat" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" >> "$LOG" 2>&1 &

exit 0
