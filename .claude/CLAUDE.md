# CCEM Project Memory

## APM Server Lifecycle Rules

**ALWAYS start CCEMAgent alongside the APM server:**
```bash
# Start APM
cd ~/Developer/ccem/apm-v4
nohup mix phx.server > ~/Developer/ccem/apm/hooks/apm_server.log 2>&1 &
echo $! > .apm.pid

# Start CCEMAgent immediately after
open -a CCEMAgent
```

**When updating CCEM or CCEM APM source:**
1. Rebuild CCEMAgent: `cd ~/Developer/ccem/CCEMAgent && swift build -c release`
2. Relaunch: `open -a CCEMAgent`
3. Restart APM if server-side changes: kill + restart `mix phx.server`

**Force kill APM when stalled:**
```bash
lsof -ti:3031 | xargs kill -9 2>/dev/null
pkill -9 -f "mix phx.server"
```

## Key Paths

| Resource | Path |
|----------|------|
| APM server | `~/Developer/ccem/apm-v4/` |
| APM PID | `~/Developer/ccem/apm-v4/.apm.pid` |
| APM log | `~/Developer/ccem/apm/hooks/apm_server.log` |
| APM config | `~/Developer/ccem/apm/apm_config.json` |
| CCEMAgent source | `~/Developer/ccem/CCEMAgent/` |
| ccem-apm skill | `~/.claude/skills/ccem-apm/SKILL.md` |
| ccem-apm command | `~/.claude/commands/ccem-apm.md` |

## OpenAPI Endpoints

Both serve the full 56-path OpenAPI 3.0.3 spec:
- `GET http://localhost:3031/api/v2/openapi.json` (canonical)
- `GET http://localhost:3031/api/openapi.json` (v1 alias)

## Current Version: v2.3.3
