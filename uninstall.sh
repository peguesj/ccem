#!/bin/bash
# ============================================================================
# CCEM v4.0.0 Uninstaller
# ============================================================================
# Reverses all actions performed by install.sh:
#   1. Stops APM server
#   2. Removes launchd/systemd services
#   3. Removes CCEM hooks from Claude Code settings.json
#   4. Removes ~/.ccem/ directory
#   5. Removes source line from shell RC
#   6. Optionally removes $CCEM_HOME
#
# Usage: ./uninstall.sh [--yes]
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load defaults for service labels
if [[ -f "$SCRIPT_DIR/installer/defaults.conf" ]]; then
  source "$SCRIPT_DIR/installer/defaults.conf"
fi
if [[ -f "$SCRIPT_DIR/installer/lib/service.sh" ]]; then
  source "$SCRIPT_DIR/installer/lib/service.sh"
fi

# Fallback values if defaults.conf not found
LAUNCHD_SERVER_LABEL="${LAUNCHD_SERVER_LABEL:-io.pegues.agent-j.labs.ccem.apm-server}"
LAUNCHD_AGENT_LABEL="${LAUNCHD_AGENT_LABEL:-io.pegues.agent-j.labs.ccem.agent}"
SYSTEMD_UNIT="${SYSTEMD_UNIT:-ccem-apm.service}"
CLAUDE_SETTINGS="${CLAUDE_SETTINGS:-$HOME/.claude/settings.json}"
CCEM_APM_PORT="${CCEM_APM_PORT:-3031}"
CCEM_HOME="${CCEM_HOME:-$HOME/Developer/ccem}"

AUTO_YES=0
[[ "${1:-}" == "--yes" || "${1:-}" == "-y" ]] && AUTO_YES=1

# Colors
if [[ -t 1 ]]; then
  RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'
  BOLD='\033[1m'; RESET='\033[0m'
else
  RED=''; GREEN=''; YELLOW=''; BOLD=''; RESET=''
fi

info()    { echo -e "${GREEN}[OK]${RESET}   $*"; }
warn()    { echo -e "${YELLOW}[WARN]${RESET} $*"; }
error()   { echo -e "${RED}[ERR]${RESET}  $*" >&2; }

confirm() {
  local msg="${1:-Continue?}"
  if [[ "$AUTO_YES" == "1" ]]; then return 0; fi
  echo -en "${BOLD}${msg} [y/N] ${RESET}"
  read -r answer
  case "$answer" in [yY]|[yY][eE][sS]) return 0 ;; *) return 1 ;; esac
}

echo -e "\n${BOLD}CCEM v4.0.0 Uninstaller${RESET}\n"

if ! confirm "This will remove CCEM services, hooks, and configuration. Continue?"; then
  echo "Aborted."
  exit 0
fi

# Step 1: Stop APM server
echo -e "\n${BOLD}Step 1: Stopping APM Server${RESET}"
if lsof -ti:${CCEM_APM_PORT} &>/dev/null 2>&1; then
  lsof -ti:${CCEM_APM_PORT} | xargs kill 2>/dev/null || true
  info "Killed processes on port ${CCEM_APM_PORT}"
else
  info "No process on port ${CCEM_APM_PORT}"
fi
# Also kill any mix phx.server processes
pkill -f "mix phx.server" 2>/dev/null || true
# Kill CCEMAgent if running
pkill -f "CCEMAgent" 2>/dev/null || true

# Step 2: Remove services
echo -e "\n${BOLD}Step 2: Removing Services${RESET}"
if type uninstall_service &>/dev/null; then
  uninstall_service
else
  # Inline fallback
  case "$(uname -s | tr '[:upper:]' '[:lower:]')" in
    darwin)
      for label in "$LAUNCHD_SERVER_LABEL" "$LAUNCHD_AGENT_LABEL"; do
        local_plist="$HOME/Library/LaunchAgents/${label}.plist"
        if [[ -f "$local_plist" ]]; then
          launchctl bootout "gui/$(id -u)/${label}" 2>/dev/null \
            || launchctl unload "$local_plist" 2>/dev/null || true
          rm -f "$local_plist"
          info "Removed $label"
        fi
      done
      ;;
    linux)
      if systemctl --user is-active "$SYSTEMD_UNIT" &>/dev/null; then
        systemctl --user stop "$SYSTEMD_UNIT" 2>/dev/null || true
        systemctl --user disable "$SYSTEMD_UNIT" 2>/dev/null || true
      fi
      rm -f "$HOME/.config/systemd/user/$SYSTEMD_UNIT"
      systemctl --user daemon-reload 2>/dev/null || true
      info "Removed $SYSTEMD_UNIT"
      ;;
  esac
fi

# Step 3: Remove CCEM hooks from Claude Code settings.json
echo -e "\n${BOLD}Step 3: Removing Claude Code Hooks${RESET}"
if [[ -f "$CLAUDE_SETTINGS" ]]; then
  # Backup first
  cp "$CLAUDE_SETTINGS" "${CLAUDE_SETTINGS}.bak.$(date +%s)"
  info "Backed up settings.json"

  # Determine hooks directory to filter out
  local_hooks_dir="$CCEM_HOME/apm/hooks"

  # Remove entries whose command references our hooks directory
  tmp_file=$(mktemp)
  if jq --arg hdir "$local_hooks_dir" '
    .hooks //= {} |
    .hooks |= with_entries(
      .value |= [
        .[]
        | select(
            (.hooks // [])
            | all(.command | tostring | contains($hdir) | not)
          )
      ]
    ) |
    # Clean up empty lifecycle arrays
    .hooks |= with_entries(select(.value | length > 0))
  ' "$CLAUDE_SETTINGS" > "$tmp_file" 2>/dev/null; then
    if jq empty "$tmp_file" 2>/dev/null; then
      mv "$tmp_file" "$CLAUDE_SETTINGS"
      info "Removed CCEM hooks from settings.json"
    else
      rm -f "$tmp_file"
      warn "Could not validate cleaned settings.json — left backup in place"
    fi
  else
    rm -f "$tmp_file"
    warn "jq filtering failed — settings.json unchanged"
  fi
else
  info "No settings.json found — nothing to clean"
fi

# Step 4: Remove ~/.ccem/ directory
echo -e "\n${BOLD}Step 4: Removing ~/.ccem/${RESET}"
if [[ -d "$HOME/.ccem" ]]; then
  rm -rf "$HOME/.ccem"
  info "Removed ~/.ccem/"
else
  info "~/.ccem/ not found"
fi

# Step 5: Remove source line from shell RC files
echo -e "\n${BOLD}Step 5: Cleaning Shell Configuration${RESET}"
for rc_file in "$HOME/.zshrc" "$HOME/.bashrc" "$HOME/.profile"; do
  if [[ -f "$rc_file" ]] && grep -qF '.ccem/env' "$rc_file"; then
    # Remove the source line and the comment above it
    sed -i.bak '/# CCEM Environment/d' "$rc_file"
    sed -i.bak '/.ccem\/env/d' "$rc_file"
    rm -f "${rc_file}.bak"
    info "Cleaned $rc_file"
  fi
done

# Step 6: Remove PID files and session state
echo -e "\n${BOLD}Step 6: Cleaning State Files${RESET}"
rm -f "$CCEM_HOME/apm-v4/.apm.pid" 2>/dev/null || true
rm -rf "$CCEM_HOME/apm/.hook_state" 2>/dev/null || true
rm -rf "$CCEM_HOME/apm/sessions" 2>/dev/null || true
info "Removed PID and session state files"

# Step 7: Optionally remove CCEM_HOME
echo -e "\n${BOLD}Step 7: Remove CCEM Installation?${RESET}"
echo "  CCEM_HOME: $CCEM_HOME"
if confirm "Delete $CCEM_HOME? (This removes all CCEM source code!)"; then
  rm -rf "$CCEM_HOME"
  info "Removed $CCEM_HOME"
else
  info "Kept $CCEM_HOME"
fi

echo -e "\n${BOLD}Uninstall complete.${RESET}"
echo ""
echo "  Open a new terminal or run 'source ~/.zshrc' to apply shell changes."
echo ""
