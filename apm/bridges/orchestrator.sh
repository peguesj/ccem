#!/usr/bin/env bash
# =============================================================================
# CCEM APM Bridge Orchestrator
# =============================================================================
# Monitors shared resources between LFG and yj-devdrive sessions.
# Detects changes, logs drift, and emits APM notifications.
#
# Usage:
#   orchestrator.sh start    # Start monitoring in background
#   orchestrator.sh stop     # Stop monitoring
#   orchestrator.sh status   # Show current state
#   orchestrator.sh check    # Run a single sync check
# =============================================================================
set -uo pipefail

readonly BRIDGE_DIR="$(cd "$(dirname "$0")" && pwd)"
readonly BRIDGE_CONFIG="$BRIDGE_DIR/lfg-devdrive.json"
readonly LOG_FILE="$BRIDGE_DIR/orchestrator.log"
readonly PID_FILE="$BRIDGE_DIR/.orchestrator.pid"
readonly STATE_FILE="$BRIDGE_DIR/.orchestrator_state.json"
readonly APM_PORT=3031

# Source and consumer paths
readonly DEVDRIVE_ROOT="$HOME/tools/yj-devdrive"
readonly LFG_ROOT="$HOME/tools/@yj/lfg"

# Watch targets
readonly BTAU_CLI="$DEVDRIVE_ROOT/btau/cli.py"
readonly BTAU_CORE="$DEVDRIVE_ROOT/btau/core"
readonly DTF_CATEGORIES="$DEVDRIVE_ROOT/dtf/categories"
readonly DTF_CORE="$DEVDRIVE_ROOT/dtf"
readonly LFG_BTAU="$LFG_ROOT/lib/btau.sh"
readonly LFG_DTF="$LFG_ROOT/lib/clean.sh"

log() {
    local level="$1"; shift
    echo "$(date '+%Y-%m-%d %H:%M:%S') [orchestrator] [$level] $*" >> "$LOG_FILE"
    [[ "$level" == "ALERT" ]] && echo "[ALERT] $*"
}

# Get file checksum for change detection
file_hash() {
    [[ -f "$1" ]] && md5 -q "$1" 2>/dev/null || echo "missing"
}

# Get directory hash (composite of all files)
dir_hash() {
    [[ -d "$1" ]] && find "$1" -type f -exec md5 -q {} \; 2>/dev/null | md5 -q || echo "missing"
}

# Send notification to APM dashboard
notify_apm() {
    local title="$1"
    local message="$2"
    local severity="${3:-info}"
    curl -s -X POST "http://localhost:${APM_PORT}/api/notify" \
        -H "Content-Type: application/json" \
        -d "{\"title\":\"$title\",\"message\":\"$message\",\"severity\":\"$severity\"}" \
        >/dev/null 2>&1 || true
}

# Run a single sync check
run_check() {
    local changes=0
    local prev_state="{}"
    [[ -f "$STATE_FILE" ]] && prev_state=$(cat "$STATE_FILE")

    # Current hashes
    local btau_cli_hash=$(file_hash "$BTAU_CLI")
    local btau_core_hash=$(dir_hash "$BTAU_CORE")
    local dtf_core_hash=$(dir_hash "$DTF_CORE")
    local lfg_btau_hash=$(file_hash "$LFG_BTAU")
    local lfg_dtf_hash=$(file_hash "$LFG_DTF")

    # Previous hashes
    local prev_btau_cli=$(echo "$prev_state" | python3 -c "import sys,json; print(json.load(sys.stdin).get('btau_cli',''))" 2>/dev/null || echo "")
    local prev_btau_core=$(echo "$prev_state" | python3 -c "import sys,json; print(json.load(sys.stdin).get('btau_core',''))" 2>/dev/null || echo "")
    local prev_dtf_core=$(echo "$prev_state" | python3 -c "import sys,json; print(json.load(sys.stdin).get('dtf_core',''))" 2>/dev/null || echo "")

    # Detect changes in source (yj-devdrive)
    if [[ "$btau_cli_hash" != "$prev_btau_cli" && -n "$prev_btau_cli" ]]; then
        log ALERT "btau/cli.py changed in yj-devdrive -- LFG btau wrapper may need update"
        notify_apm "Bridge: btau CLI Changed" "yj-devdrive updated btau/cli.py. Check lfg btau compatibility." "warning"
        changes=$((changes + 1))
    fi

    if [[ "$btau_core_hash" != "$prev_btau_core" && -n "$prev_btau_core" ]]; then
        log ALERT "btau/core/ changed in yj-devdrive -- LFG btau bridge may be affected"
        notify_apm "Bridge: btau Core Changed" "yj-devdrive updated btau/core/. Verify LFG integration." "warning"
        changes=$((changes + 1))
    fi

    if [[ "$dtf_core_hash" != "$prev_dtf_core" && -n "$prev_dtf_core" ]]; then
        log ALERT "dtf/ changed in yj-devdrive -- LFG clean module may need sync"
        notify_apm "Bridge: DTF Core Changed" "yj-devdrive updated dtf/. Verify LFG clean cache list." "warning"
        changes=$((changes + 1))
    fi

    # Save state
    cat > "$STATE_FILE" <<STATEEOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "btau_cli": "$btau_cli_hash",
  "btau_core": "$btau_core_hash",
  "dtf_core": "$dtf_core_hash",
  "lfg_btau": "$lfg_btau_hash",
  "lfg_dtf": "$lfg_dtf_hash",
  "changes_detected": $changes,
  "devdrive_exists": $([ -d "$DEVDRIVE_ROOT" ] && echo true || echo false),
  "lfg_exists": $([ -d "$LFG_ROOT" ] && echo true || echo false)
}
STATEEOF

    if (( changes > 0 )); then
        log INFO "Check complete: $changes change(s) detected"
    else
        log INFO "Check complete: no changes"
    fi

    echo "$changes"
}

# Background monitoring loop
monitor_loop() {
    log INFO "Orchestrator started (PID: $$)"
    echo $$ > "$PID_FILE"

    # Initial baseline
    run_check > /dev/null

    while true; do
        sleep 30
        run_check > /dev/null
    done
}

show_status() {
    echo "=== CCEM APM Bridge Orchestrator ==="
    echo ""

    if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
        echo "Status: RUNNING (PID: $(cat "$PID_FILE"))"
    else
        echo "Status: STOPPED"
    fi

    echo ""
    echo "Bridge: LFG <-> yj-devdrive"
    echo "Source: $DEVDRIVE_ROOT"
    echo "Consumer: $LFG_ROOT"
    echo ""

    if [[ -f "$STATE_FILE" ]]; then
        echo "Last Check:"
        python3 -c "
import json
s = json.load(open('$STATE_FILE'))
print(f'  Time: {s[\"timestamp\"]}')
print(f'  Changes: {s[\"changes_detected\"]}')
print(f'  devdrive: {\"OK\" if s[\"devdrive_exists\"] else \"MISSING\"}'  )
print(f'  lfg: {\"OK\" if s[\"lfg_exists\"] else \"MISSING\"}')
" 2>/dev/null || echo "  (unable to parse state)"
    fi

    echo ""
    if [[ -f "$LOG_FILE" ]]; then
        echo "Recent Log:"
        tail -5 "$LOG_FILE" | sed 's/^/  /'
    fi
}

case "${1:-status}" in
    start)
        if [[ -f "$PID_FILE" ]] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
            echo "Orchestrator already running (PID: $(cat "$PID_FILE"))"
            exit 0
        fi
        nohup bash -c "
            PID_FILE='$PID_FILE'
            echo \$\$ > \"\$PID_FILE\"
            while true; do
                '$BRIDGE_DIR/orchestrator.sh' check >/dev/null 2>&1
                sleep 30
            done
        " >> "$LOG_FILE" 2>&1 &
        BGPID=$!
        echo "$BGPID" > "$PID_FILE"
        echo "Orchestrator started (PID: $BGPID)"
        ;;
    stop)
        if [[ -f "$PID_FILE" ]]; then
            kill "$(cat "$PID_FILE")" 2>/dev/null && echo "Orchestrator stopped" || echo "Not running"
            rm -f "$PID_FILE"
        else
            echo "Not running"
        fi
        ;;
    check)
        changes=$(run_check)
        echo "Changes detected: $changes"
        ;;
    status)
        show_status
        ;;
    *)
        echo "Usage: orchestrator.sh {start|stop|status|check}"
        exit 1
        ;;
esac
