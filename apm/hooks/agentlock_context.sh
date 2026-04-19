#!/bin/bash
# AgentLock Context Tracking Hook — CCEM APM v9.0.0
# Records context writes for trust degradation tracking.
# Enhanced: includes memory system entries, active skills, expanded tool mapping.
# Triggered as PostToolUse for Write/Edit/WebFetch/Read/Agent/Grep/Glob tools.
# Fire-and-forget: always exits 0, never blocks.

source "$HOME/Developer/ccem/apm/hooks/hook_common.sh"

INPUT=$(cat)
SESSION_ID=$(echo "$INPUT" | _jq "unknown" -r '.session_id // "unknown"')
TOOL_NAME=$(echo "$INPUT" | _jq "unknown" -r '.tool_name // "unknown"')
TOOL_USE_ID=$(echo "$INPUT" | _jq "" -r '.tool_use_id // ""')
CWD=$(echo "$INPUT" | _jq "" -r '.cwd // ""')
PROJECT_NAME=$(basename "$CWD" 2>/dev/null || echo "unknown")
TIMESTAMP=$(now_iso)

# Resolve agent identity
AGENT_ID=$(echo "$INPUT" | _jq "" -r '.agent_id // ""')
if [ -z "$AGENT_ID" ]; then
  AGENT_ID=$(echo "$INPUT" | _jq "" -r '.parent_tool_use_id // ""')
fi
EFFECTIVE_AGENT_ID="${AGENT_ID:-$SESSION_ID}"

# ── Expanded tool → source_type mapping ─────────────────────────────────────
SOURCE="tool_output"
case "$TOOL_NAME" in
  Write|Edit|MultiEdit|NotebookEdit) SOURCE="file_write" ;;
  Read|Grep|Glob|LS)                 SOURCE="file_read" ;;
  WebFetch|WebSearch)                SOURCE="web_content" ;;
  Bash)                              SOURCE="shell_execution" ;;
  Agent|Task)                        SOURCE="peer_agent" ;;
  TodoWrite|TodoRead)                SOURCE="task_management" ;;
  mcp__*)                            SOURCE="mcp_tool" ;;
  *)                                 SOURCE="tool_output" ;;
esac

# ── Memory system entries ────────────────────────────────────────────────────
MEMORY_ENTRIES=$(python3 -c "
import os, json
entries = []
mem_file = os.path.expanduser('~/.claude/projects/-Users-jeremiah-Developer/memory/MEMORY.md')
try:
    with open(mem_file) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and not line.startswith('---'):
                entries.append(line[:100])
            if len(entries) >= 8:
                break
except:
    pass
print(json.dumps(entries))
" 2>/dev/null || echo "[]")

# ── Active skills list ───────────────────────────────────────────────────────
ACTIVE_SKILLS=$(python3 -c "
import os, json
skills_dir = os.path.expanduser('~/.claude/skills/')
try:
    skills = sorted([d for d in os.listdir(skills_dir) if os.path.isdir(os.path.join(skills_dir, d))])
    print(json.dumps(skills[:25]))
except:
    print('[]')
" 2>/dev/null || echo "[]")

# ── Active patterns (from reference registry) ────────────────────────────────
ACTIVE_PATTERNS=$(python3 -c "
import os, json
patterns = []
reg_file = os.path.expanduser('~/.claude/config/reference-registry.json')
try:
    with open(reg_file) as f:
        d = json.load(f)
        if isinstance(d, dict):
            patterns = list(d.keys())[:10]
        elif isinstance(d, list):
            patterns = [str(item.get('name', item))[:50] for item in d[:10]]
except:
    pass
print(json.dumps(patterns))
" 2>/dev/null || echo "[]")

# Generate content hash from tool_use_id (lightweight, no file reading)
CONTENT_HASH=$(echo -n "$TOOL_USE_ID" | shasum -a 256 | cut -d' ' -f1)

# ── Record context write with full context payload ───────────────────────────
curl -s --max-time 3 -X POST "$APM_URL/api/v2/auth/context/write" \
  -H "Content-Type: application/json" \
  -d "{
    \"session_id\": \"auth_sess_$SESSION_ID\",
    \"agent_id\": \"$EFFECTIVE_AGENT_ID\",
    \"tool_name\": \"$TOOL_NAME\",
    \"tool_use_id\": \"$TOOL_USE_ID\",
    \"source\": \"$SOURCE\",
    \"content_hash\": \"$CONTENT_HASH\",
    \"timestamp\": \"$TIMESTAMP\",
    \"context\": {
      \"working_directory\": \"$CWD\",
      \"project\": \"$PROJECT_NAME\",
      \"memory_entries\": $MEMORY_ENTRIES,
      \"active_skills\": $ACTIVE_SKILLS,
      \"active_patterns\": $ACTIVE_PATTERNS,
      \"model\": \"claude-sonnet-4-6\"
    }
  }" >/dev/null 2>&1 &

exit 0
