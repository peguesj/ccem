#!/usr/bin/env bash
# apm-server-wrapper.sh
# launchd entry point for CCEM APM v4 (mix phx.server)
# Invoked by io.pegues.agent-j.labs.ccem.apm-server launchd agent.
# launchd's KeepAlive handles restart-on-crash; health polling in
# ccem-agent-watchdog.sh handles hung-but-alive cases.

set -uo pipefail

APM_DIR="${HOME}/Developer/ccem/apm-v4"
PIDFILE="${APM_DIR}/.apm.pid"
LOG="${HOME}/Developer/ccem/apm/hooks/apm_server.log"

# Ensure log directory exists
mkdir -p "$(dirname "$LOG")"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] [apm-wrapper] $*"; }

# Build PATH: Homebrew arm64 → Homebrew x86 → system
export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/usr/sbin:/bin:/sbin:${PATH:-}"

# Verify mix is available
if ! command -v mix &>/dev/null; then
    log "ERROR: mix not found in PATH=${PATH}"
    exit 1
fi

# Source persistent secrets (generated on first install)
SECRETS_FILE="${HOME}/.config/ccem/apm.env"
if [[ -f "$SECRETS_FILE" ]]; then
    set -a
    # shellcheck source=/dev/null
    source "$SECRETS_FILE"
    set +a
fi

# dev mode: no compiled assets or SECRET_KEY_BASE required for local use
# Set to 'prod' only after running `mix assets.deploy` and setting SECRET_KEY_BASE
export MIX_ENV="${MIX_ENV:-dev}"
export ELIXIR_ERL_OPTIONS="+P 1048576"
export ERL_CRASH_DUMP_SECONDS=0      # suppress crash dump on exit

cd "$APM_DIR" || { log "ERROR: cannot cd to $APM_DIR"; exit 1; }

log "Starting CCEM APM v4 on port 3032 (MIX_ENV=${MIX_ENV})"
log "APM_DIR=${APM_DIR}"

# Write our own PID so watchdog / APMServerManager can signal us
echo $$ > "$PIDFILE"

# Compile deps if needed (fast no-op if already compiled)
mix deps.compile --quiet >> "$LOG" 2>&1 || true

# Run the Phoenix server — launchd stdout/stderr goes to its log paths
exec mix phx.server
