#!/bin/bash
# PreToolUse hook — CCEM APM 7.0.0
# Fires before each tool call. Emits detailed heartbeat with tool context,
# UPM formation metadata, input summary, and distributed tracing spans.
# Always exits 0 to never block Claude Code.

source "$HOME/Developer/ccem/apm/hooks/hook_common.sh"

INPUT=$(cat)
SESSION_ID=$(echo "$INPUT" | _jq "unknown" -r '.session_id // "unknown"')
TOOL_NAME=$(echo "$INPUT" | _jq "unknown" -r '.tool_name // "unknown"')
TOOL_USE_ID=$(echo "$INPUT" | _jq "" -r '.tool_use_id // ""')
CWD=$(echo "$INPUT" | _jq "" -r '.cwd // ""')
PROJECT_NAME=$(basename "$CWD" 2>/dev/null || echo "unknown")

# Extract tool input for contextual payload enrichment
TOOL_INPUT=$(echo "$INPUT" | _jq "{}" '.tool_input // {}')

# Bash: capture command
BASH_CMD=""
if [ "$TOOL_NAME" = "Bash" ]; then
  BASH_CMD=$(echo "$TOOL_INPUT" | _jq "" -r '.command // ""' | head -c 200)
fi

# Write/Edit: capture file path
FILE_PATH=""
if [ "$TOOL_NAME" = "Write" ] || [ "$TOOL_NAME" = "Edit" ]; then
  FILE_PATH=$(echo "$TOOL_INPUT" | _jq "" -r '.file_path // ""')
fi

# Agent: capture subagent type and description
SUBAGENT_TYPE=""
AGENT_DESC=""
AGENT_ISOLATION=""
if [ "$TOOL_NAME" = "Agent" ]; then
  SUBAGENT_TYPE=$(echo "$TOOL_INPUT" | _jq "" -r '.subagent_type // "general-purpose"')
  AGENT_DESC=$(echo "$TOOL_INPUT" | _jq "" -r '.description // ""')
  AGENT_ISOLATION=$(echo "$TOOL_INPUT" | _jq "" -r '.isolation // ""')
fi

# Grep/Glob: capture pattern
SEARCH_PATTERN=""
if [ "$TOOL_NAME" = "Grep" ] || [ "$TOOL_NAME" = "Glob" ]; then
  SEARCH_PATTERN=$(echo "$TOOL_INPUT" | _jq "" -r '.pattern // ""' | head -c 100)
fi

# Read: capture file path
if [ "$TOOL_NAME" = "Read" ]; then
  FILE_PATH=$(echo "$TOOL_INPUT" | _jq "" -r '.file_path // ""')
fi

# Skill: capture skill name
SKILL_NAME=""
if [ "$TOOL_NAME" = "Skill" ]; then
  SKILL_NAME=$(echo "$TOOL_INPUT" | _jq "" -r '.skill // ""')
fi

# Summarize input keys for general context
INPUT_KEYS=$(echo "$TOOL_INPUT" | _jq "" -r 'if type == "object" then (keys | join(", ")) else "raw" end')

# Plugin context: detect if tool involves plugin engine paths or actions (v7.3.0)
PLUGIN_CONTEXT=""
PLUGIN_NAME=""
if echo "$FILE_PATH$BASH_CMD$AGENT_DESC" | grep -qi "plugin\|plane_plugin\|PluginRegistry\|/api/v2/plugins"; then
  PLUGIN_CONTEXT="plugin_engine"
  if echo "$FILE_PATH$BASH_CMD$AGENT_DESC" | grep -qi "plane"; then
    PLUGIN_NAME="plane"
  fi
fi

load_state "$SESSION_ID"

SPAN_ID=$(new_span_id)
NOW=$(now_ms)
NOW_ISO=$(now_iso)

# Persist span start + tool metadata for PostToolUse duration calc and enrichment
if [ "$HAS_JQ" = "1" ]; then
  jq -n \
    --arg start_ms "$NOW" \
    --arg span_id "$SPAN_ID" \
    --arg tool_name "$TOOL_NAME" \
    --arg tool_use_id "$TOOL_USE_ID" \
    --arg project "$PROJECT_NAME" \
    --arg file_path "$FILE_PATH" \
    --arg bash_cmd "$BASH_CMD" \
    --arg subagent_type "$SUBAGENT_TYPE" \
    --arg skill_name "$SKILL_NAME" \
    '{
      start_ms: ($start_ms | tonumber),
      span_id: $span_id,
      tool_name: $tool_name,
      tool_use_id: $tool_use_id,
      project: $project,
      file_path: $file_path,
      bash_cmd: $bash_cmd,
      subagent_type: $subagent_type,
      skill_name: $skill_name
    }' > "$STATE_DIR/${SESSION_ID}_${TOOL_USE_ID}.json"
fi

# Build APM 7.0.0 heartbeat payload with full context
PAYLOAD=$(jq -n \
  --arg agent_id "session-${SESSION_ID}" \
  --arg status "working" \
  --arg message "Tool: ${TOOL_NAME} | Starting" \
  --arg formation_id "$FORMATION_ID" \
  --arg formation_role "$FORMATION_ROLE" \
  --arg trace_id "$TRACE_ID" \
  --arg span_id "$SPAN_ID" \
  --arg parent_span_id "$PARENT_SPAN_ID" \
  --arg tool_name "$TOOL_NAME" \
  --arg tool_use_id "$TOOL_USE_ID" \
  --arg project "$PROJECT_NAME" \
  --arg cwd "$CWD" \
  --arg input_keys "$INPUT_KEYS" \
  --arg bash_cmd "$BASH_CMD" \
  --arg file_path "$FILE_PATH" \
  --arg subagent_type "$SUBAGENT_TYPE" \
  --arg agent_desc "$AGENT_DESC" \
  --arg agent_isolation "$AGENT_ISOLATION" \
  --arg search_pattern "$SEARCH_PATTERN" \
  --arg skill_name "$SKILL_NAME" \
  --arg timestamp "$NOW_ISO" \
  --arg agent_level "$AGENT_LEVEL" \
  --arg parent_session_id "$PARENT_SESSION_ID" \
  --arg plugin_context "$PLUGIN_CONTEXT" \
  --arg plugin_name "$PLUGIN_NAME" \
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
      input_keys: $input_keys,
      bash_command: (if $bash_cmd != "" then $bash_cmd else null end),
      file_path: (if $file_path != "" then $file_path else null end),
      search_pattern: (if $search_pattern != "" then $search_pattern else null end),
      subagent_type: (if $subagent_type != "" then $subagent_type else null end),
      agent_description: (if $agent_desc != "" then $agent_desc else null end),
      agent_isolation: (if $agent_isolation != "" then $agent_isolation else null end),
      skill_name: (if $skill_name != "" then $skill_name else null end)
    },
    context: {
      project: $project,
      cwd: $cwd,
      formation_role: $formation_role,
      agent_level: ($agent_level | tonumber),
      parent_session_id: (if $parent_session_id != "" then $parent_session_id else null end),
      timestamp: $timestamp,
      plugin_context: (if $plugin_context != "" then {engine: $plugin_context, plugin_name: (if $plugin_name != "" then $plugin_name else null end)} else null end)
    }
  }' 2>/dev/null)

curl -s -X POST "$APM_URL/api/heartbeat" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" >> "$LOG" 2>&1 &

# Emit AG-UI TOOL_CALL_START event (fire-and-forget, never blocks)
if [ -n "$TOOL_NAME" ] && [ "$TOOL_NAME" != "unknown" ]; then
  TOOL_CALL_ID="tc-${SESSION_ID:0:8}-${TOOL_USE_ID:-$(date +%s)}"
  curl -s -X POST "${APM_URL}/api/v2/ag-ui/tool" \
    -H "Content-Type: application/json" \
    -d "{\"agent_id\":\"${SESSION_ID}\",\"tool_name\":\"${TOOL_NAME}\",\"action\":\"start\",\"tool_call_id\":\"${TOOL_CALL_ID}\"}" \
    >/dev/null 2>&1 &
fi

exit 0
