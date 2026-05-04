#!/bin/bash
# ccem SessionEnd / Stop hook
# Marks session complete in APM and emits a final summary notification.
# Always exits 0 (non-blocking).

source "$HOME/Developer/ccem/apm/hooks/hook_common.sh"

INPUT=$(cat)
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // "unknown"' 2>/dev/null || echo "unknown")

load_state "$SESSION_ID"

# Emit final status
PAYLOAD=$(jq -n \
  --arg agent_id "session-${SESSION_ID}" \
  --arg status "idle" \
  --arg message "Session ended (ccem)" \
  --arg formation_id "$FORMATION_ID" \
  '{agent_id: $agent_id, status: $status, message: $message, formation_id: $formation_id}' 2>/dev/null)

curl -s -X POST "$APM_URL/api/heartbeat" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" >> "$LOG" 2>&1

# Mark session complete in the state dir
STATE_FILE="$STATE_DIR/${SESSION_ID}.json"
if [ -f "$STATE_FILE" ]; then
  jq '. + {"status": "complete", "ended_at": "'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'"}' \
    "$STATE_FILE" > "${STATE_FILE}.tmp" && mv "${STATE_FILE}.tmp" "$STATE_FILE" 2>/dev/null || true
fi

exit 0
