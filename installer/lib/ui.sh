#!/bin/bash
# CCEM Installer — UI helpers: colors, spinners, summary table

# Colors (disabled if NO_COLOR is set or stdout is not a terminal)
if [[ -z "${NO_COLOR:-}" ]] && [[ -t 1 ]]; then
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[0;33m'
  BLUE='\033[0;34m'
  CYAN='\033[0;36m'
  BOLD='\033[1m'
  DIM='\033[2m'
  RESET='\033[0m'
else
  RED='' GREEN='' YELLOW='' BLUE='' CYAN='' BOLD='' DIM='' RESET=''
fi

_SPINNER_PID=""

info()    { echo -e "${BLUE}[INFO]${RESET} $*"; }
success() { echo -e "${GREEN}[OK]${RESET}   $*"; }
warn()    { echo -e "${YELLOW}[WARN]${RESET} $*"; }
error()   { echo -e "${RED}[ERR]${RESET}  $*" >&2; }
fatal()   { error "$@"; exit 1; }
header()  { echo -e "\n${BOLD}${CYAN}==> $*${RESET}"; }
step()    { echo -e "  ${DIM}-->$RESET $*"; }

verbose() {
  if [[ "${VERBOSE:-0}" == "1" ]]; then
    echo -e "${DIM}[DBG] $*${RESET}"
  fi
}

# Spinner — call spinner_start "message" before long ops, spinner_stop after
spinner_start() {
  local msg="${1:-Working...}"
  if [[ ! -t 1 ]]; then
    echo "$msg"
    return
  fi
  (
    local chars='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
    local i=0
    while true; do
      printf "\r  ${CYAN}%s${RESET} %s" "${chars:$i:1}" "$msg"
      i=$(( (i + 1) % ${#chars} ))
      sleep 0.1
    done
  ) &
  _SPINNER_PID=$!
  disown "$_SPINNER_PID" 2>/dev/null
}

spinner_stop() {
  if [[ -n "$_SPINNER_PID" ]]; then
    kill "$_SPINNER_PID" 2>/dev/null
    wait "$_SPINNER_PID" 2>/dev/null || true
    _SPINNER_PID=""
    printf "\r\033[K"
  fi
}

# Print a bordered summary table
# Usage: summary_table "Component" "Status"
#        summary_table "APM Server (3031)" "OK"
_SUMMARY_ROWS=()

summary_add() {
  local component="$1" status="$2"
  _SUMMARY_ROWS+=("$component|$status")
}

summary_print() {
  local width=50
  echo ""
  echo -e "${BOLD}  Component                    Status${RESET}"
  printf '  %s\n' "$(printf '%.0s─' $(seq 1 $width))"
  for row in "${_SUMMARY_ROWS[@]}"; do
    local comp="${row%%|*}"
    local stat="${row#*|}"
    local color="$GREEN"
    local icon="✓"
    case "$stat" in
      OK|INSTALLED) color="$GREEN"; icon="✓" ;;
      FAILED)       color="$RED";   icon="✗" ;;
      SKIPPED)      color="$YELLOW"; icon="–" ;;
    esac
    printf "  %-30s ${color}%s %s${RESET}\n" "$comp" "$icon" "$stat"
  done
  echo ""
}

# Confirm prompt — returns 0 (yes) or 1 (no)
# Skipped if AUTO_YES=1
confirm() {
  local msg="${1:-Continue?}"
  if [[ "${AUTO_YES:-0}" == "1" ]]; then
    return 0
  fi
  echo -en "${BOLD}${msg} [y/N] ${RESET}"
  read -r answer
  case "$answer" in
    [yY]|[yY][eE][sS]) return 0 ;;
    *) return 1 ;;
  esac
}

# Print the install plan before execution
print_plan() {
  header "CCEM v4.0.0 Installation Plan"
  echo ""
  echo -e "  ${BOLD}Platform:${RESET}     $PLATFORM ($ARCH)"
  echo -e "  ${BOLD}CCEM_HOME:${RESET}    $CCEM_HOME"
  echo -e "  ${BOLD}Shell:${RESET}        $USER_SHELL"
  echo -e "  ${BOLD}Pkg Manager:${RESET}  ${PKG_MANAGER:-none}"
  echo ""
  echo "  Components to install:"
  echo "    - APM v4 Phoenix Server (Erlang/Elixir/Node)"
  [[ "${SKIP_CLI:-0}" != "1" ]] && echo "    - TypeScript CLI (@ccem/core)"
  [[ "${SKIP_HOOKS:-0}" != "1" ]] && echo "    - Claude Code Hooks (6 lifecycle scripts)"
  [[ "$PLATFORM" == "darwin" && "${SKIP_AGENT:-0}" != "1" ]] && echo "    - CCEMHelper (macOS menubar app)"
  [[ "${SKIP_SERVICE:-0}" != "1" ]] && echo "    - System service ($(service_type_name))"
  echo ""
}

service_type_name() {
  case "$PLATFORM" in
    darwin) echo "launchd" ;;
    linux)  echo "systemd" ;;
    *)      echo "none" ;;
  esac
}
