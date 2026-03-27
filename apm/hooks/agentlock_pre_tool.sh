#!/bin/bash
# AgentLock PreToolUse Authorization Hook — CCEM APM v8.2.0
# Checks tool authorization, applies redaction for sensitive params (updatedInput),
# blocks on explicit deny. Fail-open on APM unavailability.
#
# Claude Code v2.1.85+: supports updatedInput return to mutate params before execution.

source "$HOME/Developer/ccem/apm/hooks/hook_common.sh"

INPUT=$(cat)
SESSION_ID=$(echo "$INPUT" | _jq "unknown" -r '.session_id // "unknown"')
TOOL_NAME=$(echo "$INPUT" | _jq "unknown" -r '.tool_name // "unknown"')
TOOL_USE_ID=$(echo "$INPUT" | _jq "" -r '.tool_use_id // ""')
CWD=$(echo "$INPUT" | _jq "" -r '.cwd // ""')
PROJECT_NAME=$(basename "$CWD" 2>/dev/null || echo "unknown")

# Extract tool input for param hashing and redaction
TOOL_INPUT=$(echo "$INPUT" | _jq "{}" '.tool_input // {}')

# ── Agent identity resolution ───────────────────────────────────────────────
# parent_tool_use_id is set for subagents; fall back to session_id
AGENT_ID=$(echo "$INPUT" | _jq "" -r '.agent_id // ""')
if [ -z "$AGENT_ID" ]; then
  AGENT_ID=$(echo "$INPUT" | _jq "" -r '.parent_tool_use_id // ""')
fi
EFFECTIVE_AGENT_ID="${AGENT_ID:-$SESSION_ID}"

# Look up agent name from APM registry (1s timeout, fail gracefully)
AGENT_NAME=$(curl -s --max-time 1 "$APM_URL/api/agents" 2>/dev/null | \
  python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    agents = data if isinstance(data, list) else data.get('agents', [])
    aid = '$EFFECTIVE_AGENT_ID'
    m = next((a for a in agents if a.get('agent_id') == aid or a.get('id') == aid), None)
    print((m.get('agent_name') or m.get('name') or 'agent') if m else 'agent')
except:
    print('agent')
" 2>/dev/null || echo "agent")

# ── Redaction check (updatedInput path) ─────────────────────────────────────
# For content-bearing tools: check APM RedactionEngine; return mutated params
# instead of hard-blocking, preserving Claude Code v2.1.85 updatedInput path.
apply_redaction() {
  local tool="$1"
  local tool_input="$2"

  local redact_result
  redact_result=$(curl -s --max-time 2 -X POST "$APM_URL/api/v2/auth/redact" \
    -H "Content-Type: application/json" \
    -d "{\"tool_name\": \"$tool\", \"tool_input\": $tool_input}" 2>/dev/null)

  local was_redacted
  was_redacted=$(echo "$redact_result" | _jq "false" -r '.was_redacted // "false"')

  if [ "$was_redacted" = "true" ]; then
    local redacted_input
    redacted_input=$(echo "$redact_result" | _jq "{}" '.redacted_input // {}')
    # updatedInput: mutate params before execution (no hard block)
    echo "{\"updatedInput\": $redacted_input}"
    exit 0
  fi
}

case "$TOOL_NAME" in
  Write|Edit|MultiEdit|Bash)
    apply_redaction "$TOOL_NAME" "$TOOL_INPUT"
    ;;
esac

# ── Authorization request ────────────────────────────────────────────────────
AUTH_RESULT=$(curl -s --max-time 3 -X POST "$APM_URL/api/v2/auth/authorize" \
  -H "Content-Type: application/json" \
  -d "{
    \"agent_id\": \"$EFFECTIVE_AGENT_ID\",
    \"agent_name\": \"$AGENT_NAME\",
    \"session_id\": \"auth_sess_$SESSION_ID\",
    \"tool_name\": \"$TOOL_NAME\",
    \"role\": \"agent\",
    \"params\": {
      \"cwd\": \"$CWD\",
      \"project\": \"$PROJECT_NAME\",
      \"tool_input\": $TOOL_INPUT
    }
  }" 2>/dev/null)

# Parse result
ALLOWED=$(echo "$AUTH_RESULT" | _jq "true" -r '.allowed // "true"')
TOKEN_ID=$(echo "$AUTH_RESULT" | _jq "" -r '.token_id // ""')
REASON=$(echo "$AUTH_RESULT" | _jq "" -r '.reason // ""')
DETAIL=$(echo "$AUTH_RESULT" | _jq "" -r '.detail // ""')

# Store token for PostToolUse consumption
if [ -n "$TOKEN_ID" ]; then
  mkdir -p "$STATE_DIR"
  echo "$TOKEN_ID" > "$STATE_DIR/${TOOL_USE_ID}.atk"
fi

# If explicitly denied, block the tool call
if [ "$ALLOWED" = "false" ]; then
  # Check if this is an approval_required escalation (not a hard deny)
  if [ "$REASON" = "approval_required" ]; then
    REQUEST_ID=$(echo "$DETAIL" | grep -oE 'pending-[a-f0-9]+' | head -1)
    if [ -n "$REQUEST_ID" ]; then
      echo "[AgentLock] Waiting for human approval: $REQUEST_ID ($TOOL_NAME)" >&2
      for attempt in 1 2; do
        POLL_RESULT=$(curl -s --max-time 35 "$APM_URL/api/v2/auth/pending/$REQUEST_ID?wait=30" 2>/dev/null)
        POLL_STATUS=$(echo "$POLL_RESULT" | _jq "" -r '.entry.status // .status // ""')
        POLL_TOKEN=$(echo "$POLL_RESULT" | _jq "" -r '.entry.token_id // .token_id // ""')
        if [ "$POLL_STATUS" = "approved" ] && [ -n "$POLL_TOKEN" ]; then
          mkdir -p "$STATE_DIR"
          echo "$POLL_TOKEN" > "$STATE_DIR/${TOOL_USE_ID}.atk"
          echo "[AgentLock] Approved by human, token stored: $POLL_TOKEN" >&2
          exit 0
        elif [ "$POLL_STATUS" = "denied" ]; then
          echo "[AgentLock] Denied by human for $TOOL_NAME" >&2
          exit 2
        fi
        echo "[AgentLock] Poll attempt $attempt: no decision yet for $REQUEST_ID" >&2
      done
      echo "[AgentLock] Approval timeout for $TOOL_NAME ($REQUEST_ID)" >&2
    fi
  else
    echo "[AgentLock] Authorization denied for $TOOL_NAME: $DETAIL ($REASON)" >&2
  fi
  exit 2
fi

# Default: allow (fail-open)
exit 0
