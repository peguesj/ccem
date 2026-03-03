#!/bin/bash
# PreToolUse hook - fires before each tool call
# Reads JSON from stdin, emits heartbeat to APM, writes span start time for duration calc.
# Always exits 0 to never block Claude Code.

source "$HOME/Developer/ccem/apm/hooks/hook_common.sh"

INPUT=$(cat)
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // "unknown"' 2>/dev/null || echo "unknown")
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // "unknown"' 2>/dev/null || echo "unknown")
TOOL_USE_ID=$(echo "$INPUT" | jq -r '.tool_use_id // ""' 2>/dev/null || echo "")
CWD=$(echo "$INPUT" | jq -r '.cwd // ""' 2>/dev/null || echo "")
PROJECT_NAME=$(basename "$CWD")

load_state "$SESSION_ID"

SPAN_ID=$(new_span_id)
NOW=$(now_ms)

# Persist span start for PostToolUse duration calculation
echo "{\"start_ms\": $NOW, \"span_id\": \"$SPAN_ID\"}" > "$STATE_DIR/${SESSION_ID}_${TOOL_USE_ID}.json"

PAYLOAD=$(jq -n \
  --arg agent_id "session-${SESSION_ID}" \
  --arg status "working" \
  --arg message "Tool: ${TOOL_NAME} | Starting" \
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
