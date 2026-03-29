#!/usr/bin/env bash
# Finder stability watchdog — monitors for I/O-frozen Finder and recovers it
# Triggered by launchd every 30 seconds
# Label: io.pegues.agent-j.labs.finder-watchdog

LOG="/Users/jeremiah/Developer/ccem/apm/hooks/finder_watchdog.log"
APM_URL="http://localhost:3032"
PROBLEM_VOLUMES=("/Volumes/YJ_MORE" "/Volumes/YJ_WIN")

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG"
}

apm_notify() {
  local type="$1" title="$2" message="$3"
  curl -s -X POST "${APM_URL}/api/notify" \
    -H "Content-Type: application/json" \
    -d "{\"type\":\"${type}\",\"title\":\"${title}\",\"message\":\"${message}\",\"project\":\"ccem\"}" \
    >/dev/null 2>&1 &
}

trim_log() {
  if [[ -f "$LOG" ]]; then
    local lines
    lines=$(wc -l < "$LOG")
    if (( lines > 500 )); then
      local tmp
      tmp=$(mktemp)
      tail -n 500 "$LOG" > "$tmp" && mv "$tmp" "$LOG"
    fi
  fi
}

# --- Get Finder PID and state ---
FINDER_PID=$(pgrep -x "Finder" 2>/dev/null | head -1)

if [[ -z "$FINDER_PID" ]]; then
  log "INFO  Finder not running — relaunching"
  open -a Finder 2>/dev/null
  apm_notify "info" "Finder Watchdog" "Finder was not running — relaunched"
  trim_log
  exit 0
fi

# Get process state (first character of stat column)
FINDER_STAT=$(ps -o stat= -p "$FINDER_PID" 2>/dev/null | tr -d ' ')
STAT_FIRST="${FINDER_STAT:0:1}"

# Healthy states: S (sleeping/interruptible), R (running), I (idle)
if [[ "$STAT_FIRST" == "S" || "$STAT_FIRST" == "R" || "$STAT_FIRST" == "I" ]]; then
  # Finder is healthy — nothing to do
  trim_log
  exit 0
fi

# --- Finder is in a bad state ---
log "WARN  Finder (PID ${FINDER_PID}) is in bad state: ${FINDER_STAT} — recovering"

apm_notify "warning" "Finder Watchdog" "Finder frozen (state: ${FINDER_STAT}) — recovering..."

# Step 1: Force unmount known problem volumes
for vol in "${PROBLEM_VOLUMES[@]}"; do
  if mount | grep -q " ${vol} " 2>/dev/null; then
    log "INFO  Force unmounting ${vol}"
    diskutil unmount force "${vol}" 2>/dev/null
  fi
done

# Step 2: Wait and check if Finder recovered on its own
sleep 2

FINDER_PID_AFTER=$(pgrep -x "Finder" 2>/dev/null | head -1)
if [[ -n "$FINDER_PID_AFTER" ]]; then
  STAT_AFTER=$(ps -o stat= -p "$FINDER_PID_AFTER" 2>/dev/null | tr -d ' ')
  STAT_AFTER_FIRST="${STAT_AFTER:0:1}"
  if [[ "$STAT_AFTER_FIRST" == "S" || "$STAT_AFTER_FIRST" == "R" || "$STAT_AFTER_FIRST" == "I" ]]; then
    log "OK    Finder recovered after volume unmount (state: ${STAT_AFTER})"
    apm_notify "info" "Finder Watchdog" "Finder recovered after volume unmount"
    trim_log
    exit 0
  fi
fi

# Step 3: Still frozen — wait up to 5 more seconds
sleep 3

FINDER_PID_CHECK=$(pgrep -x "Finder" 2>/dev/null | head -1)
if [[ -n "$FINDER_PID_CHECK" ]]; then
  STAT_CHECK=$(ps -o stat= -p "$FINDER_PID_CHECK" 2>/dev/null | tr -d ' ')
  STAT_CHECK_FIRST="${STAT_CHECK:0:1}"
  if [[ "$STAT_CHECK_FIRST" != "S" && "$STAT_CHECK_FIRST" != "R" && "$STAT_CHECK_FIRST" != "I" ]]; then
    log "WARN  Finder still frozen (state: ${STAT_CHECK}) — force killing"
    killall -9 Finder 2>/dev/null
    sleep 2
    open -a Finder 2>/dev/null
    log "INFO  Finder killed and relaunched"
    apm_notify "warning" "Finder Watchdog" "Finder required force kill and relaunch"
    trim_log
    exit 0
  fi
fi

# Finder came good between checks
log "OK    Finder recovered (self-healed)"
apm_notify "info" "Finder Watchdog" "Finder self-recovered"
trim_log
exit 0
