#!/bin/bash
# CCEM SubagentStart hook
# Injects formation metadata into the pending handoff for child agents
# so they inherit CCEM project context in the APM dashboard.
# Always exits 0 (non-blocking).

source "$HOME/Developer/ccem/apm/hooks/hook_common.sh"

INPUT=$(cat)
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // "unknown"' 2>/dev/null || echo "unknown")
SUBAGENT_ID=$(echo "$INPUT" | jq -r '.subagent_id // ""' 2>/dev/null || echo "")
SUBAGENT_TYPE=$(echo "$INPUT" | jq -r '.subagent_type // "unknown"' 2>/dev/null || echo "unknown")

load_state "$SESSION_ID"

# Write enriched pending handoff for the subagent
if [ -n "$SUBAGENT_ID" ]; then
  PENDING_FILE="$STATE_DIR/pending_${SUBAGENT_ID}.json"
  cat > "$PENDING_FILE" << ENDJSON
{
  "parent_session_id": "$SESSION_ID",
  "trace_id": "$TRACE_ID",
  "formation_id": "${FORMATION_ID:-ccem-${SESSION_ID}}",
  "formation_role": "agent",
  "agent_level": $((AGENT_LEVEL + 1)),
  "parent_span_id": "$(new_span_id)",
  "project": "ccem",
  "subagent_type": "$SUBAGENT_TYPE"
}
ENDJSON

  # Notify APM of subagent spawn
  PAYLOAD=$(jq -n \
    --arg agent_id "session-${SESSION_ID}" \
    --arg status "working" \
    --arg message "Spawning ${SUBAGENT_TYPE} agent (level $((AGENT_LEVEL + 1)))" \
    --arg formation_id "${FORMATION_ID:-ccem-${SESSION_ID}}" \
    '{agent_id: $agent_id, status: $status, message: $message, formation_id: $formation_id}' 2>/dev/null)

  curl -s -X POST "$APM_URL/api/heartbeat" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD" >> "$LOG" 2>&1 &
fi

exit 0
