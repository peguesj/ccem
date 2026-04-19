#!/bin/bash
# PostToolUse hook — CCEM APM 9.0.0
# Fires after each tool call. Calculates duration, captures tool outcome metadata,
# emits enriched heartbeat with span completion.
# Max-payload: session_id, project, tool_name, tool_use_id, timestamp, working_dir,
# git_branch, memory-write notify, skill-track emit, pattern heartbeat. Always exits 0.

source "$HOME/Developer/ccem/apm/hooks/hook_common.sh"

INPUT=$(cat)
SESSION_ID=$(echo "$INPUT" | _jq "unknown" -r '.session_id // "unknown"')
TOOL_NAME=$(echo "$INPUT" | _jq "unknown" -r '.tool_name // "unknown"')
TOOL_USE_ID=$(echo "$INPUT" | _jq "" -r '.tool_use_id // ""')
CWD=$(echo "$INPUT" | _jq "" -r '.cwd // ""')
PROJECT_NAME=$(basename "$CWD" 2>/dev/null || echo "unknown")

# Max-payload: resolve git branch (non-blocking)
GIT_BRANCH=""
if [ -n "$CWD" ]; then
  GIT_BRANCH=$(git -C "$CWD" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
fi

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

# Detect Plane plugin context: check for Plane project ID in local CLAUDE.md
PLUGIN_CONTEXT=""
if [ -n "$CWD" ]; then
  CLAUDE_MD="${CWD}/.claude/CLAUDE.md"
  if [ -f "$CLAUDE_MD" ]; then
    PLANE_ID=$(grep -oE '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' "$CLAUDE_MD" 2>/dev/null | head -1)
    [ -n "$PLANE_ID" ] && PLUGIN_CONTEXT="plane"
  fi
fi

# Max-payload: detect memory write from pre-tool file path
IS_MEMORY_WRITE="false"
MEMORY_FILE_NAME=""
if [ -n "$PRE_FILE_PATH" ]; then
  if echo "$PRE_FILE_PATH" | grep -qE '\.claude/projects/.+/memory/.+\.md$'; then
    IS_MEMORY_WRITE="true"
    MEMORY_FILE_NAME=$(basename "$PRE_FILE_PATH")
  fi
fi

# Max-payload: detect skill invoke from pre-tool bash cmd or skill name
IS_SKILL_INVOKE="false"
INVOKED_SKILL=""
if [ -n "$PRE_SKILL" ]; then
  IS_SKILL_INVOKE="true"
  INVOKED_SKILL="$PRE_SKILL"
elif [ -n "$PRE_BASH_CMD" ]; then
  INVOKED_SKILL=$(echo "$PRE_BASH_CMD" | grep -oE '^/[a-zA-Z][a-zA-Z0-9_:-]+' | head -1 | sed 's|^/||' || echo "")
  [ -n "$INVOKED_SKILL" ] && IS_SKILL_INVOKE="true"
fi

# Build APM 9.0.0 completion payload with max-payload context
PAYLOAD=$(jq -n \
  --arg agent_id "session-${SESSION_ID}" \
  --arg session_id "$SESSION_ID" \
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
  --arg git_branch "$GIT_BRANCH" \
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
  --arg plugin_context "$PLUGIN_CONTEXT" \
  --arg is_memory_write "$IS_MEMORY_WRITE" \
  --arg memory_file_name "$MEMORY_FILE_NAME" \
  --arg is_skill_invoke "$IS_SKILL_INVOKE" \
  --arg invoked_skill "$INVOKED_SKILL" \
  '{
    agent_id: $agent_id,
    session_id: $session_id,
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
      skill_name: (if $skill_name != "" then $skill_name else null end),
      is_memory_write: ($is_memory_write == "true"),
      memory_file: (if $memory_file_name != "" then $memory_file_name else null end),
      is_skill_invoke: ($is_skill_invoke == "true"),
      invoked_skill: (if $invoked_skill != "" then $invoked_skill else null end)
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
      working_dir: $cwd,
      git_branch: (if $git_branch != "" then $git_branch else null end),
      formation_role: $formation_role,
      agent_level: ($agent_level | tonumber),
      parent_session_id: (if $parent_session_id != "" then $parent_session_id else null end),
      timestamp: $timestamp,
      plugin_context: (if $plugin_context != "" then $plugin_context else null end)
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

# Max-payload: emit skill tracking on completion (fire-and-forget)
if [ "$IS_SKILL_INVOKE" = "true" ] && [ -n "$INVOKED_SKILL" ]; then
  SKILL_PAYLOAD=$(jq -n \
    --arg session_id "$SESSION_ID" \
    --arg skill "$INVOKED_SKILL" \
    --arg project "$PROJECT_NAME" \
    --arg timestamp "$NOW_ISO" \
    --arg working_dir "$CWD" \
    --arg git_branch "$GIT_BRANCH" \
    --arg duration_ms "$DURATION_MS" \
    '{
      session_id: $session_id,
      skill: $skill,
      project: $project,
      timestamp: $timestamp,
      args: {
        working_dir: $working_dir,
        git_branch: (if $git_branch != "" then $git_branch else null end),
        duration_ms: ($duration_ms | tonumber)
      }
    }' 2>/dev/null)
  curl -s -X POST "$APM_URL/api/skills/track" \
    -H "Content-Type: application/json" \
    -d "$SKILL_PAYLOAD" >/dev/null 2>&1 &
fi

# Max-payload: emit memory-write completion notification (fire-and-forget)
if [ "$IS_MEMORY_WRITE" = "true" ] && [ -n "$MEMORY_FILE_NAME" ]; then
  # Build a brief content summary from output preview if available
  MEM_SUMMARY="${OUTPUT_PREVIEW:0:120}"
  MEM_PAYLOAD=$(jq -n \
    --arg message "Memory written: $MEMORY_FILE_NAME${MEM_SUMMARY:+ — ${MEM_SUMMARY}}" \
    --arg title "Memory Write Complete" \
    --arg type "info" \
    --arg agent_id "session-${SESSION_ID}" \
    '{message: $message, title: $title, type: $type, agent_id: $agent_id, category: "memory"}' 2>/dev/null)
  curl -s -X POST "$APM_URL/api/notify" \
    -H "Content-Type: application/json" \
    -d "$MEM_PAYLOAD" >/dev/null 2>&1 &
fi

# Max-payload: pattern heartbeat — emit tool usage pattern summary periodically
# Uses a counter file per session; fires every 10 tool calls
PATTERN_COUNTER_FILE="$STATE_DIR/pattern_count_${SESSION_ID}"
PATTERN_COUNT=0
if [ -f "$PATTERN_COUNTER_FILE" ]; then
  PATTERN_COUNT=$(cat "$PATTERN_COUNTER_FILE" 2>/dev/null || echo "0")
fi
PATTERN_COUNT=$((PATTERN_COUNT + 1))
echo "$PATTERN_COUNT" > "$PATTERN_COUNTER_FILE"

if [ "$((PATTERN_COUNT % 10))" -eq "0" ]; then
  PATTERN_PAYLOAD=$(jq -n \
    --arg agent_id "session-${SESSION_ID}" \
    --arg session_id "$SESSION_ID" \
    --arg status "working" \
    --arg message "Pattern summary: tool=$TOOL_NAME project=$PROJECT_NAME branch=$GIT_BRANCH call#=${PATTERN_COUNT}" \
    --arg project "$PROJECT_NAME" \
    --arg working_dir "$CWD" \
    --arg git_branch "$GIT_BRANCH" \
    --arg tool_count "$PATTERN_COUNT" \
    --arg last_tool "$TOOL_NAME" \
    --arg timestamp "$NOW_ISO" \
    '{
      agent_id: $agent_id,
      session_id: $session_id,
      status: $status,
      message: $message,
      context: {
        project: $project,
        working_dir: $working_dir,
        git_branch: (if $git_branch != "" then $git_branch else null end),
        pattern: {
          tool_call_count: ($tool_count | tonumber),
          last_tool: $last_tool,
          reported_at: $timestamp
        }
      }
    }' 2>/dev/null)
  curl -s -X POST "$APM_URL/api/heartbeat" \
    -H "Content-Type: application/json" \
    -d "$PATTERN_PAYLOAD" >/dev/null 2>&1 &
fi

exit 0
