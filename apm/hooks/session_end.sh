#!/bin/bash
# SessionEnd hook - fires when a Claude Code session terminates
# Marks the agent as done in APM and cleans up session state.
# Always exits 0 to never block Claude Code.

source "$HOME/Developer/ccem/apm/hooks/hook_common.sh"

INPUT=$(cat)
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // "unknown"' 2>/dev/null || echo "unknown")
REASON=$(echo "$INPUT" | jq -r '.reason // "unknown"' 2>/dev/null || echo "unknown")

load_state "$SESSION_ID"

PAYLOAD=$(jq -n \
  --arg agent_id "session-${SESSION_ID}" \
  --arg status "done" \
  --arg message "Session ended: ${REASON}" \
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

# Clean up session state; leave pending handoff files for child sessions
rm -f "$STATE_DIR/${SESSION_ID}.json"

exit 0
