#!/bin/bash
# AgentLock PreToolUse Authorization Hook — CCEM APM v9.0.0
# Sends max-payload authorization requests with full context (memory, skills,
# patterns, agent identity). FAIL-OPEN: never exits 2. Auth is advisory only.
# Reports all grant/deny decisions to /api/v2/notifications for audit.
#
# Claude Code v2.1.85+: supports updatedInput return to mutate params before execution.

source "$HOME/Developer/ccem/apm/hooks/hook_common.sh"

INPUT=$(cat)
SESSION_ID=$(echo "$INPUT" | _jq "unknown" -r '.session_id // "unknown"')
TOOL_NAME=$(echo "$INPUT" | _jq "unknown" -r '.tool_name // "unknown"')
TOOL_USE_ID=$(echo "$INPUT" | _jq "" -r '.tool_use_id // ""')
CWD=$(echo "$INPUT" | _jq "" -r '.cwd // ""')
PROJECT_NAME=$(basename "$CWD" 2>/dev/null || echo "unknown")
TIMESTAMP=$(now_iso)

# Extract tool input for param hashing and redaction
TOOL_INPUT=$(echo "$INPUT" | _jq "{}" '.tool_input // {}')

# ── Agent identity resolution ───────────────────────────────────────────────
# parent_tool_use_id is set for subagents; fall back to session_id
AGENT_ID=$(echo "$INPUT" | _jq "" -r '.agent_id // ""')
if [ -z "$AGENT_ID" ]; then
  AGENT_ID=$(echo "$INPUT" | _jq "" -r '.parent_tool_use_id // ""')
fi
EFFECTIVE_AGENT_ID="${AGENT_ID:-$SESSION_ID}"
MODEL="claude-sonnet-4-6"
USER_ID="jeremiah"

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

# ── Context assembly ─────────────────────────────────────────────────────────
# Gather memory summary (1 line per entry, truncated for payload efficiency)
MEMORY_ENTRIES=$(python3 -c "
import os, json
entries = []
mem_file = os.path.expanduser('~/.claude/projects/-Users-jeremiah-Developer/memory/MEMORY.md')
try:
    with open(mem_file) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and not line.startswith('---'):
                entries.append(line[:120])
            if len(entries) >= 10:
                break
except:
    pass
print(json.dumps(entries))
" 2>/dev/null || echo "[]")

# Gather active skills list (directory names from ~/.claude/skills/)
ACTIVE_SKILLS=$(python3 -c "
import os, json
skills_dir = os.path.expanduser('~/.claude/skills/')
try:
    skills = [d for d in os.listdir(skills_dir) if os.path.isdir(os.path.join(skills_dir, d))]
    print(json.dumps(sorted(skills)[:30]))
except:
    print('[]')
" 2>/dev/null || echo "[]")

# Gather active patterns (claude-flow or project patterns if available)
ACTIVE_PATTERNS=$(python3 -c "
import os, json
patterns = []
# Check for project-level patterns config
for p in ['~/.claude/config/reference-registry.json']:
    try:
        with open(os.path.expanduser(p)) as f:
            d = json.load(f)
            if isinstance(d, dict):
                patterns = list(d.keys())[:10]
            break
    except:
        pass
print(json.dumps(patterns))
" 2>/dev/null || echo "[]")

# Get Claude Code version if available
CC_VERSION=$(claude --version 2>/dev/null | head -1 | tr -d '\n' || echo "unknown")

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

# ── Authorization request (max-payload) ─────────────────────────────────────
AUTH_RESULT=$(curl -s --max-time 3 -X POST "$APM_URL/api/v2/auth/authorize" \
  -H "Content-Type: application/json" \
  -d "$(python3 -c "
import json, sys

payload = {
    'tool_name': '${TOOL_NAME}',
    'tool_use_id': '${TOOL_USE_ID}',
    'session_id': 'auth_sess_${SESSION_ID}',
    'user_id': '${USER_ID}',
    'agent_id': '${EFFECTIVE_AGENT_ID}',
    'agent_name': '${AGENT_NAME}',
    'role': 'agent',
    'params': {
        'cwd': '${CWD}',
        'project': '${PROJECT_NAME}',
        'tool_input': json.loads('${TOOL_INPUT}'.replace(\"'\", \"'\")) if '${TOOL_INPUT}' else {}
    },
    'context': {
        'working_directory': '${CWD}',
        'memory_entries': ${MEMORY_ENTRIES},
        'active_skills': ${ACTIVE_SKILLS},
        'active_patterns': ${ACTIVE_PATTERNS},
        'claude_code_version': '${CC_VERSION}',
        'model': '${MODEL}'
    },
    'invocation_metadata': {
        'hook_version': '2.0',
        'timestamp': '${TIMESTAMP}',
        'parent_agent_id': None
    }
}
print(json.dumps(payload))
" 2>/dev/null || echo "{
    \"tool_name\": \"$TOOL_NAME\",
    \"tool_use_id\": \"$TOOL_USE_ID\",
    \"session_id\": \"auth_sess_$SESSION_ID\",
    \"user_id\": \"$USER_ID\",
    \"agent_id\": \"$EFFECTIVE_AGENT_ID\",
    \"agent_name\": \"$AGENT_NAME\",
    \"role\": \"agent\",
    \"params\": {
      \"cwd\": \"$CWD\",
      \"project\": \"$PROJECT_NAME\",
      \"tool_input\": $TOOL_INPUT
    },
    \"context\": {
      \"working_directory\": \"$CWD\",
      \"memory_entries\": $MEMORY_ENTRIES,
      \"active_skills\": $ACTIVE_SKILLS,
      \"active_patterns\": $ACTIVE_PATTERNS,
      \"claude_code_version\": \"$CC_VERSION\",
      \"model\": \"$MODEL\"
    },
    \"invocation_metadata\": {
      \"hook_version\": \"2.0\",
      \"timestamp\": \"$TIMESTAMP\",
      \"parent_agent_id\": null
    }
  }")" 2>/dev/null)

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

# ── Audit notification (fire-and-forget) ────────────────────────────────────
# Report both grants and denies to notifications for full audit trail
AUDIT_STATUS="granted"
[ "$ALLOWED" = "false" ] && AUDIT_STATUS="denied"

curl -s --max-time 2 -X POST "$APM_URL/api/v2/notifications" \
  -H "Content-Type: application/json" \
  -d "{
    \"type\": \"agentlock_pre_tool\",
    \"status\": \"$AUDIT_STATUS\",
    \"message\": \"AgentLock [$AUDIT_STATUS] $TOOL_NAME for agent $EFFECTIVE_AGENT_ID\",
    \"session\": \"$SESSION_ID\",
    \"tool_name\": \"$TOOL_NAME\",
    \"tool_use_id\": \"$TOOL_USE_ID\",
    \"agent_id\": \"$EFFECTIVE_AGENT_ID\",
    \"reason\": \"$REASON\",
    \"timestamp\": \"$TIMESTAMP\"
  }" >/dev/null 2>&1 &

# ── FAIL-OPEN: advisory logging only, never block Claude Code execution ──────
# Auth denials are logged and reported but NEVER block tool execution.
# exit 2 is PROHIBITED — it would block Claude Code. Auth is advisory only.
if [ "$ALLOWED" = "false" ]; then
  echo "[AgentLock] Advisory: auth returned denied for $TOOL_NAME (reason: $REASON, detail: $DETAIL) — proceeding fail-open" >&2
fi

# Always exit 0 — Claude Code execution is NEVER blocked by AgentLock
exit 0
