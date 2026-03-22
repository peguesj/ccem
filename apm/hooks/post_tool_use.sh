#!/bin/bash
# PostToolUse hook — CCEM APM 6.2.0
# Fires after each tool call. Calculates duration, captures tool outcome metadata,
# emits enriched heartbeat with span completion. Always exits 0.

source "$HOME/Developer/ccem/apm/hooks/hook_common.sh"

INPUT=$(cat)
SESSION_ID=$(echo "$INPUT" | _jq "unknown" -r '.session_id // "unknown"')
TOOL_NAME=$(echo "$INPUT" | _jq "unknown" -r '.tool_name // "unknown"')
TOOL_USE_ID=$(echo "$INPUT" | _jq "" -r '.tool_use_id // ""')
CWD=$(echo "$INPUT" | _jq "" -r '.cwd // ""')
PROJECT_NAME=$(basename "$CWD" 2>/dev/null || echo "unknown")

load_state "$SESSION_ID"

# Recover span start data + pre-tool metadata
SPAN_FILE="$STATE_DIR/${SESSION_ID}_${TOOL_USE_ID}.json"
START_MS=0
SPAN_ID=""
PRE_TOOL_NAME=""
PRE_FILE_PATH=""
PRE_BASH_CMD=""
PRE_SUBAGENT=""
PRE_SKILL=""
if [ -f "$SPAN_FILE" ]; then
  START_MS=$(_jq "0" -r '.start_ms // 0' "$SPAN_FILE")
  SPAN_ID=$(_jq "" -r '.span_id // ""' "$SPAN_FILE")
  PRE_TOOL_NAME=$(_jq "" -r '.tool_name // ""' "$SPAN_FILE")
  PRE_FILE_PATH=$(_jq "" -r '.file_path // ""' "$SPAN_FILE")
  PRE_BASH_CMD=$(_jq "" -r '.bash_cmd // ""' "$SPAN_FILE")
  PRE_SUBAGENT=$(_jq "" -r '.subagent_type // ""' "$SPAN_FILE")
  PRE_SKILL=$(_jq "" -r '.skill_name // ""' "$SPAN_FILE")
  rm -f "$SPAN_FILE"
fi

NOW_MS=$(now_ms)
NOW_ISO=$(now_iso)
DURATION_MS=$((NOW_MS - START_MS))

# Classify duration for dashboard display
DURATION_CLASS="fast"
if [ "$DURATION_MS" -gt 5000 ]; then
  DURATION_CLASS="slow"
elif [ "$DURATION_MS" -gt 1000 ]; then
  DURATION_CLASS="normal"
fi

# Extract output summary from tool response (if available)
TOOL_OUTPUT=$(echo "$INPUT" | _jq "" '.tool_output // ""')
OUTPUT_LENGTH=$(echo "$TOOL_OUTPUT" | wc -c | tr -d ' ')
OUTPUT_PREVIEW=$(echo "$TOOL_OUTPUT" | _jq "" -r 'if type == "string" then .[0:150] else (tostring | .[0:150]) end' 2>/dev/null || echo "")

# Build APM 6.2.0 completion payload
PAYLOAD=$(jq -n \
  --arg agent_id "session-${SESSION_ID}" \
  --arg status "working" \
  --arg message "Tool: ${TOOL_NAME} | Done (${DURATION_MS}ms)" \
  --arg formation_id "$FORMATION_ID" \
  --arg formation_role "$FORMATION_ROLE" \
  --arg trace_id "$TRACE_ID" \
  --arg span_id "$SPAN_ID" \
  --arg parent_span_id "$PARENT_SPAN_ID" \
  --arg tool_name "$TOOL_NAME" \
  --arg tool_use_id "$TOOL_USE_ID" \
  --arg project "$PROJECT_NAME" \
  --arg cwd "$CWD" \
  --arg duration_ms "$DURATION_MS" \
  --arg duration_class "$DURATION_CLASS" \
  --arg file_path "$PRE_FILE_PATH" \
  --arg bash_cmd "$PRE_BASH_CMD" \
  --arg subagent_type "$PRE_SUBAGENT" \
  --arg skill_name "$PRE_SKILL" \
  --arg output_length "$OUTPUT_LENGTH" \
  --arg output_preview "$OUTPUT_PREVIEW" \
  --arg timestamp "$NOW_ISO" \
  --arg agent_level "$AGENT_LEVEL" \
  --arg parent_session_id "$PARENT_SESSION_ID" \
  '{
    agent_id: $agent_id,
    status: $status,
    message: $message,
    formation_id: $formation_id,
    trace: {
      trace_id: $trace_id,
      span_id: $span_id,
      parent_span_id: $parent_span_id
    },
    tool: {
      name: $tool_name,
      use_id: $tool_use_id,
      file_path: (if $file_path != "" then $file_path else null end),
      bash_command: (if $bash_cmd != "" then $bash_cmd else null end),
      subagent_type: (if $subagent_type != "" then $subagent_type else null end),
      skill_name: (if $skill_name != "" then $skill_name else null end)
    },
    timing: {
      duration_ms: ($duration_ms | tonumber),
      duration_class: $duration_class,
      started_at_ms: '"$START_MS"',
      completed_at_ms: '"$NOW_MS"'
    },
    output: {
      length_bytes: ($output_length | tonumber),
      preview: (if $output_preview != "" then $output_preview else null end)
    },
    context: {
      project: $project,
      cwd: $cwd,
      formation_role: $formation_role,
      agent_level: ($agent_level | tonumber),
      parent_session_id: (if $parent_session_id != "" then $parent_session_id else null end),
      timestamp: $timestamp
    }
  }' 2>/dev/null)

curl -s -X POST "$APM_URL/api/heartbeat" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" >> "$LOG" 2>&1 &

# Emit AG-UI TOOL_CALL_END event (fire-and-forget, never blocks)
if [ -n "$TOOL_NAME" ] && [ "$TOOL_NAME" != "unknown" ]; then
  TOOL_CALL_ID="tc-${SESSION_ID:0:8}-${TOOL_USE_ID:-$(date +%s)}"
  curl -s -X POST "${APM_URL}/api/v2/ag-ui/tool" \
    -H "Content-Type: application/json" \
    -d "{\"agent_id\":\"${SESSION_ID}\",\"tool_name\":\"${TOOL_NAME}\",\"action\":\"end\",\"tool_call_id\":\"${TOOL_CALL_ID}\",\"duration_ms\":${DURATION_MS},\"result_type\":\"text\"}" \
    >/dev/null 2>&1 &
fi

exit 0
