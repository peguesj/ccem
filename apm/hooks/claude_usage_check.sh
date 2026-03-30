#!/bin/bash
# PreToolUse hook: check usage thresholds, warn if intensive usage detected

# DevDrive: ensure HooksEnv is mounted
HOOKS_ENV="/Volumes/HooksEnv"
if [ ! -d "$HOOKS_ENV" ] && [ -f "$HOME/DevDrive/hooks-env.dmg.sparseimage" ]; then
  hdiutil attach "$HOME/DevDrive/hooks-env.dmg.sparseimage" -mountpoint "$HOOKS_ENV" -quiet -nobrowse 2>/dev/null || true
fi
[ -d "$HOOKS_ENV" ] && export PATH="$HOOKS_ENV/python-venv/bin:$HOOKS_ENV/npm-global/bin:$PATH"
# This hook NEVER blocks execution (always exits 0).
# It writes a warning to stderr if the current project is at intensive effort level.

APM_URL="http://localhost:3032"
PROJECT=$(basename "$PWD")

# Attempt to fetch summary; skip silently if APM is not running
SUMMARY=$(curl -s --max-time 2 "$APM_URL/api/usage/summary" 2>/dev/null)

if [ $? -eq 0 ] && [ -n "$SUMMARY" ]; then
  # Check if this project has intensive effort level
  PROJECT_EFFORT=$(echo "$SUMMARY" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    projects = data.get('summary', {}).get('projects', {})
    project = projects.get('$PROJECT', {})
    effort = project.get('effort_level', 'low')
    print(effort)
except Exception:
    print('unknown')
" 2>/dev/null)

  if [ "$PROJECT_EFFORT" = "intensive" ]; then
    echo "CCEM APM: Intensive usage detected for project '$PROJECT' (>100 tool calls/session). Consider using a lighter model for simple tasks." >&2
  fi
fi

# Never block — always exit 0
exit 0
