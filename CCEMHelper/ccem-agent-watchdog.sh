#!/usr/bin/env bash
# CCEM Agent Watchdog
# - Rebuilds/restarts CCEMAgent on source changes and crash recovery
# - Bootstraps io.pegues.agent-j.labs.ccem.apm-server launchd helper on startup
# - Health-polls APM server every APM_HEALTH_INTERVAL seconds
# - Force-restarts APM via launchctl kickstart after APM_MAX_FAILS consecutive failures
set -uo pipefail

AGENT_DIR="/Users/jeremiah/Developer/ccem/CCEMAgent"
LOG="/tmp/ccem-agent-watchdog.log"
PIDFILE="/tmp/ccem-agent.pid"
REBUILD_FLAG="/tmp/ccem-agent-rebuild"
MIN_RESTART_INTERVAL=5
POLL_INTERVAL=3

# ── APM supervision ────────────────────────────────────────────────────────────
APM_LABEL="io.pegues.agent-j.labs.ccem.apm-server"
APM_PLIST="${HOME}/Library/LaunchAgents/io.pegues.agent-j.labs.ccem.apm-server.plist"
APM_PORT=3032
APM_HEALTH_URL="http://localhost:${APM_PORT}/api/status"
APM_HEALTH_INTERVAL=60   # seconds between health checks
APM_MAX_FAILS=5          # consecutive failures before force-restart
APM_TIMEOUT=5            # curl timeout per check
APM_STARTUP_GRACE=150    # seconds after restart before counting failures

_apm_fail_count=0
_apm_last_check=0
_apm_last_restart=0
# ──────────────────────────────────────────────────────────────────────────────

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

cleanup() {
    log "Watchdog shutting down — leaving APM server running (managed by launchd)"
    kill_agent
    [[ -n "${FSWATCH_PID:-}" ]] && kill "$FSWATCH_PID" 2>/dev/null || true
    rm -f "$REBUILD_FLAG"
    exit 0
}
trap cleanup SIGTERM SIGINT SIGHUP

# ── CCEMAgent lifecycle ────────────────────────────────────────────────────────

kill_agent() {
    if [[ -f "$PIDFILE" ]]; then
        local pid
        pid=$(cat "$PIDFILE" 2>/dev/null || true)
        if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
            log "Killing agent PID $pid"
            kill "$pid" 2>/dev/null || true
            for _ in $(seq 1 10); do
                kill -0 "$pid" 2>/dev/null || break
                sleep 0.5
            done
            kill -0 "$pid" 2>/dev/null && kill -9 "$pid" 2>/dev/null || true
        fi
        rm -f "$PIDFILE"
    fi
    pkill -f 'CCEMAgent.app/Contents/MacOS/CCEMAgent' 2>/dev/null || true
    pkill -f '.build/release/CCEMAgent' 2>/dev/null || true
}

build_agent() {
    log "Building CCEMAgent (build-app.sh)..."
    cd "$AGENT_DIR"
    if bash build-app.sh >> "$LOG" 2>&1; then
        log "Build succeeded (.app bundle updated)"
        return 0
    else
        log "Build FAILED"
        return 1
    fi
}

start_agent() {
    local app_bundle="$AGENT_DIR/.build/CCEMAgent.app"
    local binary="$app_bundle/Contents/MacOS/CCEMAgent"
    if [[ ! -x "$binary" ]]; then
        log "App bundle binary not found, attempting build"
        build_agent || return 1
        # Rebuild .app bundle after swift build
        bash "$AGENT_DIR/build-app.sh" >> "$LOG" 2>&1 || {
            log "build-app.sh failed"
            return 1
        }
    fi
    log "Starting CCEMAgent from .app bundle"
    open -a "$app_bundle"
    sleep 1
    # Find the launched PID
    local pid
    pid=$(pgrep -f "CCEMAgent.app/Contents/MacOS/CCEMAgent" 2>/dev/null | head -1)
    if [[ -n "$pid" ]]; then
        echo "$pid" > "$PIDFILE"
        log "Agent started with PID $pid"
    else
        log "Agent launched but PID not found"
    fi
}

agent_is_running() {
    if [[ -f "$PIDFILE" ]]; then
        local pid
        pid=$(cat "$PIDFILE" 2>/dev/null || true)
        [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null && return 0
    fi
    # Fallback: check by process name
    pgrep -f 'CCEMAgent.app/Contents/MacOS/CCEMAgent' &>/dev/null && return 0
    return 1
}

swift_fingerprint() {
    find "$AGENT_DIR/Sources" -name '*.swift' -exec stat -f '%m %N' {} + 2>/dev/null | sort
}

# ── APM server helpers ─────────────────────────────────────────────────────────

# Returns 0 if launchd knows about the APM service (loaded, regardless of state)
apm_service_loaded() {
    launchctl list "$APM_LABEL" &>/dev/null
}

# Bootstrap the APM plist into the user session if not already loaded
apm_bootstrap() {
    if [[ ! -f "$APM_PLIST" ]]; then
        log "APM plist not found: $APM_PLIST — skipping bootstrap"
        return 1
    fi
    if apm_service_loaded; then
        log "APM service already loaded ($APM_LABEL)"
        return 0
    fi
    log "Bootstrapping APM launchd service from $APM_PLIST"
    launchctl bootstrap "gui/$(id -u)" "$APM_PLIST" 2>/dev/null && \
        log "APM bootstrap OK" || \
        log "APM bootstrap returned non-zero (may already be loaded)"
    # Reset supervision counters so startup grace applies to the new instance
    _apm_fail_count=0
    _apm_last_restart=$(date +%s)
}

# HTTP health check — returns 0 if APM is healthy
apm_health_ok() {
    curl -sf --max-time "$APM_TIMEOUT" "$APM_HEALTH_URL" >/dev/null 2>&1
}

# Force-kickstart the APM service through launchd
apm_kickstart() {
    log "APM kickstart: launchctl kickstart -k gui/$(id -u)/${APM_LABEL}"
    launchctl kickstart -k "gui/$(id -u)/${APM_LABEL}" 2>>"$LOG" || {
        log "kickstart failed, trying stop+start"
        launchctl stop  "$APM_LABEL" 2>/dev/null || true
        sleep 2
        launchctl start "$APM_LABEL" 2>/dev/null || true
    }
    _apm_fail_count=0
    _apm_last_restart=$(date +%s)
    log "APM restart issued — waiting ${APM_HEALTH_INTERVAL}s before next health check"
}

# Called every POLL_INTERVAL; runs health check only every APM_HEALTH_INTERVAL seconds
apm_supervise() {
    local now
    now=$(date +%s)
    local since_check=$(( now - _apm_last_check ))
    local since_restart=$(( now - _apm_last_restart ))

    # Not time yet
    (( since_check < APM_HEALTH_INTERVAL )) && return

    _apm_last_check=$now

    # Startup grace period: don't count failures while APM is still initialising
    if (( since_restart < APM_STARTUP_GRACE )); then
        log "APM health check skipped — startup grace (${since_restart}s / ${APM_STARTUP_GRACE}s)"
        return
    fi

    if apm_health_ok; then
        if (( _apm_fail_count > 0 )); then
            log "APM health restored (was ${_apm_fail_count} consecutive fails)"
        fi
        _apm_fail_count=0
    else
        _apm_fail_count=$(( _apm_fail_count + 1 ))
        log "APM health check FAILED (${_apm_fail_count}/${APM_MAX_FAILS}) at ${APM_HEALTH_URL}"

        if (( _apm_fail_count >= APM_MAX_FAILS )); then
            # Throttle: don't restart more often than APM_STARTUP_GRACE
            if (( since_restart >= APM_STARTUP_GRACE )); then
                log "APM exceeded ${APM_MAX_FAILS} failures — force-restarting via launchctl"
                apm_kickstart
            else
                log "APM restart throttled (last restart ${since_restart}s ago)"
            fi
        fi
    fi
}

# ── File watching (CCEMAgent sources) ─────────────────────────────────────────

FSWATCH_PID=""
if command -v fswatch &>/dev/null; then
    log "Using fswatch for file monitoring"
    fswatch -o -r --include='\.swift$' --exclude='.*' "$AGENT_DIR/Sources" | while read -r _; do
        touch "$REBUILD_FLAG"
    done &
    FSWATCH_PID=$!
else
    log "fswatch not found, using polling (${POLL_INTERVAL}s interval)"
fi

LAST_FINGERPRINT=$(swift_fingerprint)
LAST_RESTART=0

# ── Startup sequence ───────────────────────────────────────────────────────────

log "=== CCEM Watchdog started (PID $$) ==="

# 1. Bootstrap APM launchd service (starts APM if not already running)
apm_bootstrap

# Anchor restart clock to now so startup grace applies immediately
_apm_last_restart=$(date +%s)

# 2. Brief wait so APM can come up before CCEMAgent tries to connect
log "Waiting 4 s for APM server to initialise..."
sleep 4

# 3. Skip initial health check — startup grace handles this
log "APM startup grace active for ${APM_STARTUP_GRACE}s (health checks suppressed during init)"
_apm_last_check=$(date +%s)

# 4. Start CCEMAgent
build_agent && start_agent || log "Initial CCEMAgent start failed, will retry"
LAST_RESTART=$(date +%s)

# ── Main loop ──────────────────────────────────────────────────────────────────

while true; do
    rebuild=0

    # Check fswatch flag file
    if [[ -f "$REBUILD_FLAG" ]]; then
        rm -f "$REBUILD_FLAG"
        rebuild=1
    fi

    # Poll fallback if no fswatch
    if [[ -z "$FSWATCH_PID" ]]; then
        current=$(swift_fingerprint)
        if [[ "$current" != "$LAST_FINGERPRINT" ]]; then
            LAST_FINGERPRINT="$current"
            rebuild=1
        fi
    fi

    # Handle CCEMAgent rebuild
    if [[ "$rebuild" -eq 1 ]]; then
        now=$(date +%s)
        elapsed=$(( now - LAST_RESTART ))
        if (( elapsed >= MIN_RESTART_INTERVAL )); then
            log "Source change detected, rebuilding CCEMAgent..."
            kill_agent
            if build_agent; then
                start_agent
                LAST_RESTART=$(date +%s)
            else
                log "Build failed, CCEMAgent not restarted"
            fi
        fi
    fi

    # CCEMAgent crash recovery
    if [[ "$rebuild" -eq 0 ]] && ! agent_is_running; then
        now=$(date +%s)
        elapsed=$(( now - LAST_RESTART ))
        if (( elapsed >= MIN_RESTART_INTERVAL )); then
            log "CCEMAgent not running (crash?), restarting..."
            start_agent
            LAST_RESTART=$(date +%s)
        fi
    fi

    # APM health supervision (runs on its own interval inside)
    apm_supervise

    sleep "$POLL_INTERVAL"
done
