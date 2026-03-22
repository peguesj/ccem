#!/bin/bash
# ============================================================================
# CCEM APM v6.4.0 Installation Suite
# Author: Jeremiah Pegues <jeremiah@pegues.io>
# ============================================================================
# Installs: APM v4 Phoenix Server, CCEMHelper (macOS), Claude Code Hooks,
#           TypeScript CLI, and launchd/systemd service.
#
# Usage:
#   ./install-v640.sh [OPTIONS]
#
# Options:
#   --prefix <path>   Set CCEM_HOME (default: $HOME/Developer/ccem)
#   --skip-service    Don't install launchd/systemd service
#   --skip-hooks      Don't patch Claude Code settings.json
#   --skip-agent      Don't build CCEMHelper (macOS only)
#   --skip-cli        Don't build TypeScript CLI
#   --verbose         Show debug output
#   --dry-run         Print what would be done without executing
#   --yes             Skip all confirmation prompts
#   --help            Show this help message
# ============================================================================

set -euo pipefail

CCEM_VERSION="6.4.0"
CCEM_APM_PORT="${CCEM_APM_PORT:-3032}"
CCEM_REPO_URL="https://github.com/peguesj/ccem.git"
CCEM_DEFAULT_HOME="$HOME/Developer/ccem"
LAUNCHD_SERVER_LABEL="io.pegues.agent-j.labs.ccem.apm-server"
LAUNCHD_AGENT_LABEL="io.pegues.agent-j.labs.ccem.helper"

# ---- Flags ----
SKIP_SERVICE=0
SKIP_HOOKS=0
SKIP_AGENT=0
SKIP_CLI=0
VERBOSE=0
DRY_RUN=0
AUTO_YES=0
CUSTOM_PREFIX=""
CCEM_HOME=""
PLATFORM=""
ARCH=""
USER_SHELL=""
SHELL_RC=""

# ---- gum detection ----
HAS_GUM=0
if command -v gum &>/dev/null; then
  HAS_GUM=1
fi

# ============================================================================
# ANSI fallback colors — always define, gum path ignores these where possible
# ============================================================================
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

# ============================================================================
# Banner
# ============================================================================
print_banner() {
  if [[ "$HAS_GUM" == "1" ]]; then
    gum style \
      --border double \
      --border-foreground 33 \
      --padding "1 4" \
      --bold \
      "CCEM APM v${CCEM_VERSION} Installation Suite" \
      "" \
      "Claude Code Environment Manager" \
      "Author: Jeremiah Pegues <jeremiah@pegues.io>"
  else
    echo ""
    echo -e "${BOLD}${CYAN}╔═══════════════════════════════════════════╗${RESET}"
    echo -e "${BOLD}${CYAN}║   CCEM APM v${CCEM_VERSION} Installation Suite     ║${RESET}"
    echo -e "${BOLD}${CYAN}║   Claude Code Environment Manager        ║${RESET}"
    echo -e "${BOLD}${CYAN}║   Author: Jeremiah Pegues                ║${RESET}"
    echo -e "${BOLD}${CYAN}╚═══════════════════════════════════════════╝${RESET}"
    echo ""
  fi
}

# ============================================================================
# Logging
# ============================================================================
info()    { echo -e "${BLUE}[INFO]${RESET}  $*"; }
success() { echo -e "${GREEN}[OK]${RESET}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${RESET}  $*"; }
error()   { echo -e "${RED}[ERR]${RESET}   $*" >&2; }
fatal()   { error "$@"; exit 1; }
step()    { echo -e "  ${DIM}-->${RESET} $*"; }
header() {
  if [[ "$HAS_GUM" == "1" ]]; then
    echo ""
    gum style --bold --foreground 33 "==> $*"
  else
    echo -e "\n${BOLD}${CYAN}==> $*${RESET}"
  fi
}

verbose() {
  if [[ "${VERBOSE:-0}" == "1" ]]; then
    echo -e "${DIM}[DBG] $*${RESET}"
  fi
}

# ============================================================================
# Spinner — uses gum spin if available, falls back to ANSI braille spinner
# ============================================================================
_SPINNER_PID=""

spin() {
  # spin <title> <cmd...>
  local title="$1"; shift
  if [[ "$HAS_GUM" == "1" ]]; then
    gum spin --spinner dot --title "$title" -- "$@"
  else
    # ANSI fallback spinner
    "$@" &
    local bg_pid=$!
    local chars='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
    local i=0
    while kill -0 "$bg_pid" 2>/dev/null; do
      printf "\r  ${CYAN}%s${RESET} %s" "${chars:$i:1}" "$title"
      i=$(( (i + 1) % ${#chars} ))
      sleep 0.1
    done
    printf "\r\033[K"
    wait "$bg_pid"
    return $?
  fi
}

# ============================================================================
# Confirmation — uses gum confirm if available
# ============================================================================
confirm() {
  local msg="${1:-Continue?}"
  if [[ "${AUTO_YES:-0}" == "1" ]]; then
    return 0
  fi
  if [[ "$HAS_GUM" == "1" ]]; then
    gum confirm "$msg"
    return $?
  else
    echo -en "${BOLD}${msg} [y/N] ${RESET}"
    read -r answer
    case "$answer" in
      [yY]|[yY][eE][sS]) return 0 ;;
      *) return 1 ;;
    esac
  fi
}

# ============================================================================
# Input — uses gum input if available
# ============================================================================
prompt_input() {
  local prompt_text="$1"
  local default_val="${2:-}"
  if [[ "$HAS_GUM" == "1" ]]; then
    gum input --placeholder "$default_val" --prompt "$prompt_text: "
  else
    echo -en "${BOLD}${prompt_text}${RESET} [${default_val}]: "
    read -r val
    echo "${val:-$default_val}"
  fi
}

# ============================================================================
# Option chooser — uses gum choose if available
# ============================================================================
choose_option() {
  local prompt_text="$1"; shift
  if [[ "$HAS_GUM" == "1" ]]; then
    echo ""
    gum style --bold "$prompt_text"
    gum choose "$@"
  else
    echo -e "${BOLD}${prompt_text}${RESET}"
    local i=1
    for opt in "$@"; do
      echo "  $i) $opt"
      i=$((i + 1))
    done
    echo -en "Choice [1]: "
    read -r sel
    local idx="${sel:-1}"
    local arr=("$@")
    echo "${arr[$((idx - 1))]}"
  fi
}

# ============================================================================
# Summary table
# ============================================================================
_SUMMARY_ROWS=()

summary_add() {
  _SUMMARY_ROWS+=("$1|$2")
}

summary_print() {
  echo ""
  if [[ "$HAS_GUM" == "1" ]]; then
    local rows=""
    rows+="$(gum style --bold "Component|Status")\n"
    for row in "${_SUMMARY_ROWS[@]}"; do
      local comp="${row%%|*}"
      local stat="${row#*|}"
      local color="2"   # green
      case "$stat" in
        FAILED)  color="1" ;;   # red
        SKIPPED) color="3" ;;   # yellow
      esac
      rows+="${comp}|$(gum style --foreground "$color" "$stat")\n"
    done
    # Print with basic column formatting
    echo -e "${BOLD}  Component                    Status${RESET}"
    printf '  %s\n' "$(printf '%.0s─' $(seq 1 50))"
    for row in "${_SUMMARY_ROWS[@]}"; do
      local comp="${row%%|*}"
      local stat="${row#*|}"
      local color="$GREEN"; local icon="[OK]"
      case "$stat" in
        FAILED)  color="$RED";    icon="[FAILED]" ;;
        SKIPPED) color="$YELLOW"; icon="[SKIPPED]" ;;
      esac
      printf "  %-32s ${color}%s${RESET}\n" "$comp" "$stat"
    done
  else
    echo -e "${BOLD}  Component                    Status${RESET}"
    printf '  %s\n' "$(printf '%.0s─' $(seq 1 50))"
    for row in "${_SUMMARY_ROWS[@]}"; do
      local comp="${row%%|*}"
      local stat="${row#*|}"
      local color="$GREEN"
      case "$stat" in
        FAILED)  color="$RED" ;;
        SKIPPED) color="$YELLOW" ;;
      esac
      printf "  %-32s ${color}%s${RESET}\n" "$comp" "$stat"
    done
  fi
  echo ""
}

# ============================================================================
# Step progress tracker
# ============================================================================
STEP_CURRENT=0
STEP_TOTAL=9

step_progress() {
  STEP_CURRENT=$((STEP_CURRENT + 1))
  if [[ "$HAS_GUM" == "1" ]]; then
    gum style --foreground 8 "  Step ${STEP_CURRENT}/${STEP_TOTAL}: $*"
  else
    echo -e "  ${DIM}[${STEP_CURRENT}/${STEP_TOTAL}]${RESET} $*"
  fi
}

# ============================================================================
# Argument parsing
# ============================================================================
parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --prefix)
        CUSTOM_PREFIX="$2"
        shift 2
        ;;
      --skip-service) SKIP_SERVICE=1; shift ;;
      --skip-hooks)   SKIP_HOOKS=1;   shift ;;
      --skip-agent)   SKIP_AGENT=1;   shift ;;
      --skip-cli)     SKIP_CLI=1;     shift ;;
      --verbose)      VERBOSE=1;      shift ;;
      --dry-run)      DRY_RUN=1; VERBOSE=1; shift ;;
      --yes|-y)       AUTO_YES=1;     shift ;;
      --help|-h)
        cat << HELPEOF
CCEM APM v${CCEM_VERSION} Installation Suite

Usage: ./install-v640.sh [OPTIONS]

Options:
  --prefix <path>   Set CCEM_HOME (default: \$HOME/Developer/ccem)
  --skip-service    Don't install launchd/systemd service
  --skip-hooks      Don't patch Claude Code settings.json
  --skip-agent      Don't build CCEMHelper (macOS only)
  --skip-cli        Don't build TypeScript CLI
  --verbose         Show debug output
  --dry-run         Print what would be done without executing
  --yes             Skip all confirmation prompts
  --help            Show this help message

Dashboard: http://localhost:${CCEM_APM_PORT}
HELPEOF
        exit 0
        ;;
      *)
        error "Unknown option: $1"
        echo "Use --help for usage information."
        exit 1
        ;;
    esac
  done
}

# ============================================================================
# Platform detection
# ============================================================================
detect_platform() {
  case "$(uname -s)" in
    Darwin)  PLATFORM="darwin"; ARCH="$(uname -m)" ;;
    Linux)   PLATFORM="linux";  ARCH="$(uname -m)" ;;
    *)       PLATFORM="unknown"; ARCH="unknown" ;;
  esac

  case "${SHELL:-/bin/bash}" in
    */zsh)  USER_SHELL="zsh";  SHELL_RC="$HOME/.zshrc" ;;
    */bash) USER_SHELL="bash"; SHELL_RC="$HOME/.bashrc" ;;
    *)      USER_SHELL="sh";   SHELL_RC="$HOME/.profile" ;;
  esac

  verbose "Platform: $PLATFORM/$ARCH, Shell: $USER_SHELL"
}

# ============================================================================
# Dependency validation
# ============================================================================
validate_dependencies() {
  header "Checking dependencies"
  local ok=1

  check_dep() {
    local name="$1"; local cmd="$2"
    if command -v "$cmd" &>/dev/null; then
      step "[FOUND]   $name"
    else
      step "[MISSING] $name"
      ok=0
    fi
  }

  check_dep "Elixir / mix"   "mix"
  check_dep "Erlang / erl"   "erl"
  check_dep "Node.js"        "node"
  check_dep "npm"            "npm"
  check_dep "git"            "git"
  if [[ "$PLATFORM" == "darwin" && "$SKIP_AGENT" != "1" ]]; then
    check_dep "Swift"        "swift"
  fi

  [[ "$ok" == "1" ]]
}

# ============================================================================
# Phase 0: Pre-flight
# ============================================================================
preflight() {
  header "Phase 0: Pre-Flight Checks"
  step_progress "Pre-flight"

  detect_platform

  # Resolve CCEM_HOME
  if [[ -n "$CUSTOM_PREFIX" ]]; then
    CCEM_HOME="$CUSTOM_PREFIX"
  elif [[ -n "${CCEM_HOME:-}" ]]; then
    : # already set from environment
  else
    CCEM_HOME="$CCEM_DEFAULT_HOME"
  fi
  export CCEM_HOME

  # Allow user to override CCEM_HOME interactively if no --yes and no --prefix
  if [[ "${AUTO_YES:-0}" != "1" && -z "$CUSTOM_PREFIX" ]]; then
    local entered
    entered="$(prompt_input "CCEM installation directory" "$CCEM_HOME")"
    if [[ -n "$entered" ]]; then
      CCEM_HOME="$entered"
      export CCEM_HOME
    fi
  fi

  verbose "CCEM_HOME: $CCEM_HOME"

  # Clone if missing
  if [[ ! -d "$CCEM_HOME" ]]; then
    warn "CCEM directory not found at $CCEM_HOME"
    if confirm "Clone peguesj/ccem to $CCEM_HOME?"; then
      if [[ "$DRY_RUN" != "1" ]]; then
        git clone --recurse-submodules "$CCEM_REPO_URL" "$CCEM_HOME"
        success "Repository cloned"
      else
        step "[dry-run] git clone $CCEM_REPO_URL $CCEM_HOME"
      fi
    else
      fatal "Cannot proceed without CCEM repository."
    fi
  fi

  # Verify submodule
  if [[ ! -f "$CCEM_HOME/apm-v4/mix.exs" ]]; then
    warn "apm-v4 submodule not initialized — running git submodule update"
    if [[ "$DRY_RUN" != "1" ]]; then
      (cd "$CCEM_HOME" && git submodule update --init --recursive)
    fi
  fi

  success "Pre-flight passed"
}

# ============================================================================
# Phase 1: Dependencies
# ============================================================================
phase_dependencies() {
  step_progress "System dependencies"
  if ! validate_dependencies; then
    warn "One or more dependencies are missing"
    if [[ "$PLATFORM" == "darwin" ]] && command -v brew &>/dev/null; then
      if confirm "Attempt to install missing dependencies via Homebrew?"; then
        if [[ "$DRY_RUN" != "1" ]]; then
          brew install elixir node 2>&1 | tail -5
        else
          step "[dry-run] brew install elixir node"
        fi
        if ! validate_dependencies; then
          fatal "Dependencies still not satisfied. Install Elixir, Erlang, and Node.js, then re-run."
        fi
      else
        fatal "Cannot proceed without required dependencies."
      fi
    else
      fatal "Install Elixir (https://elixir-lang.org/install.html) and Node.js, then re-run."
    fi
  fi
}

# ============================================================================
# Phase 2: Path setup
# ============================================================================
phase_paths() {
  header "Phase 2: Path Setup"
  step_progress "Shell path"

  if [[ "$DRY_RUN" == "1" ]]; then
    step "[dry-run] Would create ~/.ccem/env and patch $SHELL_RC"
    return 0
  fi

  mkdir -p "$HOME/.ccem"
  cat > "$HOME/.ccem/env" << ENVEOF
# CCEM Environment — auto-generated by install-v640.sh v${CCEM_VERSION}
export CCEM_HOME="${CCEM_HOME}"
export PATH="\${CCEM_HOME}/apm-v4:\${CCEM_HOME}/node_modules/.bin:\${PATH}"
ENVEOF

  local source_line='[ -f "$HOME/.ccem/env" ] && source "$HOME/.ccem/env"'
  if [[ -f "$SHELL_RC" ]] && grep -qF '.ccem/env' "$SHELL_RC"; then
    verbose "Shell RC already sources ~/.ccem/env"
  else
    { echo ""; echo "# CCEM Environment"; echo "$source_line"; } >> "$SHELL_RC"
    step "Patched $SHELL_RC"
  fi

  # shellcheck disable=SC1090
  source "$HOME/.ccem/env"
  success "Path setup complete"
}

# ============================================================================
# Phase 3: Build APM server
# ============================================================================
phase_build_apm() {
  header "Phase 3: Building APM v4 Phoenix Server"
  step_progress "APM server build"

  local apm_dir="$CCEM_HOME/apm-v4"

  if [[ ! -d "$apm_dir" ]]; then
    fatal "APM v4 directory not found at $apm_dir"
  fi

  if [[ "$DRY_RUN" == "1" ]]; then
    step "[dry-run] Would build APM server at $apm_dir"
    return 0
  fi

  (
    cd "$apm_dir"
    spin "Installing Hex and Rebar..."    mix local.hex --force --if-missing
    spin "Fetching dependencies..."        mix deps.get
    spin "Building assets..."             bash -c "mix assets.setup && mix assets.build"
    spin "Compiling Elixir..."            mix compile
  )

  success "APM v4 server compiled"
}

# ============================================================================
# Phase 4: Build TypeScript CLI
# ============================================================================
phase_build_cli() {
  header "Phase 4: TypeScript CLI"
  step_progress "TypeScript CLI"

  if [[ "$SKIP_CLI" == "1" ]]; then
    info "Skipped (--skip-cli)"
    return 0
  fi

  if [[ "$DRY_RUN" == "1" ]]; then
    step "[dry-run] Would run npm install && npm run build in $CCEM_HOME"
    return 0
  fi

  (
    cd "$CCEM_HOME"
    spin "Installing npm dependencies..." npm install
    spin "Building TypeScript..."         npm run build
  )

  if [[ -f "$CCEM_HOME/dist/cli.js" ]]; then
    success "TypeScript CLI built (dist/cli.js)"
  else
    warn "dist/cli.js not found — CLI build may have failed"
  fi
}

# ============================================================================
# Phase 5: Build CCEMHelper
# ============================================================================
phase_build_agent() {
  header "Phase 5: CCEMHelper (macOS)"
  step_progress "CCEMHelper build"

  if [[ "$PLATFORM" != "darwin" ]]; then
    info "Skipped (Linux — macOS only)"
    return 0
  fi

  if [[ "$SKIP_AGENT" == "1" ]]; then
    info "Skipped (--skip-agent)"
    return 0
  fi

  local agent_dir="$CCEM_HOME/CCEMHelper"

  if [[ ! -d "$agent_dir" ]]; then
    warn "CCEMHelper directory not found — skipping"
    return 0
  fi

  if [[ "$DRY_RUN" == "1" ]]; then
    step "[dry-run] Would run swift build -c release in $agent_dir"
    return 0
  fi

  (
    cd "$agent_dir"
    spin "Compiling CCEMHelper (release)..." swift build -c release
  )

  if confirm "Copy CCEMHelper.app to ~/Applications?"; then
    if [[ -d "$agent_dir/.build/CCEMHelper.app" ]]; then
      mkdir -p "$HOME/Applications"
      cp -R "$agent_dir/.build/CCEMHelper.app" "$HOME/Applications/CCEMHelper.app"
      success "Copied to ~/Applications/CCEMHelper.app"
    else
      warn "CCEMHelper.app not found; may require build-app.sh"
    fi
  fi

  success "CCEMHelper built"
}

# ============================================================================
# Phase 6: Initialize config
# ============================================================================
phase_init_config() {
  header "Phase 6: Config & State"
  step_progress "Config initialization"

  if [[ "$DRY_RUN" == "1" ]]; then
    step "[dry-run] Would create apm/sessions, apm/.hook_state, apm_config.json"
    return 0
  fi

  mkdir -p "$CCEM_HOME/apm/sessions"
  mkdir -p "$CCEM_HOME/apm/.hook_state"
  mkdir -p "$HOME/.claude/projects"

  local config_file="$CCEM_HOME/apm/apm_config.json"
  if [[ ! -f "$config_file" ]]; then
    cat > "$config_file" << ENDJSON
{
  "\$schema": "./apm_config_v4.schema.json",
  "version": "${CCEM_VERSION}",
  "port": ${CCEM_APM_PORT},
  "active_project": "",
  "projects": []
}
ENDJSON
    success "Created default apm_config.json"
  else
    info "apm_config.json already exists — preserving"
  fi
}

# ============================================================================
# Phase 7: Claude Code hooks
# ============================================================================
phase_hooks() {
  header "Phase 7: Claude Code Hooks"
  step_progress "Hooks installation"

  if [[ "$SKIP_HOOKS" == "1" ]]; then
    info "Skipped (--skip-hooks)"
    return 0
  fi

  local settings_dir="$HOME/.claude"
  local settings_file="$settings_dir/settings.json"

  if [[ "$DRY_RUN" == "1" ]]; then
    step "[dry-run] Would patch $settings_file with SessionStart/Stop hooks"
    return 0
  fi

  mkdir -p "$settings_dir"

  # Create minimal settings.json if absent
  if [[ ! -f "$settings_file" ]]; then
    echo '{}' > "$settings_file"
  fi

  # Patch using python3 (available on macOS/Linux without extra deps)
  if command -v python3 &>/dev/null; then
    python3 - << PYEOF
import json, sys

settings_file = "${settings_file}"
hook_dir = "${CCEM_HOME}/apm/hooks"

with open(settings_file, 'r') as f:
    try:
        data = json.load(f)
    except json.JSONDecodeError:
        data = {}

hooks = data.setdefault('hooks', {})

def ensure_hook(event, script, desc):
    existing = hooks.get(event, [])
    cmd = f"{hook_dir}/{script}"
    already = any(
        (isinstance(h, dict) and h.get('command', '') == cmd) or
        (isinstance(h, str) and h == cmd)
        for h in existing
    )
    if not already:
        existing.append({'command': cmd, 'description': desc, 'timeout': 10})
        hooks[event] = existing

ensure_hook('SessionStart', 'session_init.sh', 'CCEM APM session registration')
ensure_hook('SessionStop',  'session_end.sh',  'CCEM APM session teardown')
ensure_hook('PreToolUse',   'pre_tool.sh',     'CCEM APM pre-tool hook')
ensure_hook('PostToolUse',  'post_tool.sh',    'CCEM APM post-tool hook')

with open(settings_file, 'w') as f:
    json.dump(data, f, indent=2)

print("Hooks patched successfully")
PYEOF
    success "Claude Code hooks installed"
  else
    warn "python3 not found — skipping automatic hook patch"
    info "Manually add hooks from $CCEM_HOME/apm/hooks/ to $settings_file"
  fi
}

# ============================================================================
# Phase 8: launchd / systemd service
# ============================================================================
phase_service() {
  header "Phase 8: System Service"
  step_progress "Service installation"

  if [[ "$SKIP_SERVICE" == "1" ]]; then
    info "Skipped (--skip-service)"
    return 0
  fi

  if [[ "$DRY_RUN" == "1" ]]; then
    step "[dry-run] Would install launchd/systemd service"
    return 0
  fi

  case "$PLATFORM" in
    darwin)
      _install_launchd
      ;;
    linux)
      _install_systemd
      ;;
    *)
      warn "Unsupported platform for service installation: $PLATFORM"
      ;;
  esac
}

_install_launchd() {
  local plist_dir="$HOME/Library/LaunchAgents"
  local plist_file="$plist_dir/${LAUNCHD_SERVER_LABEL}.plist"

  mkdir -p "$plist_dir"

  local mix_bin
  mix_bin="$(command -v mix)"
  local apm_log="$CCEM_HOME/apm/hooks/apm_server.log"

  cat > "$plist_file" << PLISTEOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
    "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LAUNCHD_SERVER_LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${mix_bin}</string>
    <string>phx.server</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${CCEM_HOME}/apm-v4</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>MIX_ENV</key>
    <string>prod</string>
    <key>PHX_SERVER</key>
    <string>true</string>
    <key>PORT</key>
    <string>${CCEM_APM_PORT}</string>
  </dict>
  <key>StandardOutPath</key>
  <string>${apm_log}</string>
  <key>StandardErrorPath</key>
  <string>${apm_log}</string>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <dict>
    <key>SuccessfulExit</key>
    <false/>
  </dict>
</dict>
</plist>
PLISTEOF

  # Unload previous if running
  launchctl unload "$plist_file" 2>/dev/null || true
  launchctl load -w "$plist_file"
  success "launchd service installed: $LAUNCHD_SERVER_LABEL"
}

_install_systemd() {
  local unit_dir="$HOME/.config/systemd/user"
  local unit_file="$unit_dir/ccem-apm.service"
  local mix_bin
  mix_bin="$(command -v mix)"

  mkdir -p "$unit_dir"

  cat > "$unit_file" << UNITEOF
[Unit]
Description=CCEM APM Server v${CCEM_VERSION}
After=network.target

[Service]
Type=simple
WorkingDirectory=${CCEM_HOME}/apm-v4
ExecStart=${mix_bin} phx.server
Restart=on-failure
RestartSec=5
Environment=MIX_ENV=prod
Environment=PHX_SERVER=true
Environment=PORT=${CCEM_APM_PORT}
StandardOutput=append:${CCEM_HOME}/apm/hooks/apm_server.log
StandardError=append:${CCEM_HOME}/apm/hooks/apm_server.log

[Install]
WantedBy=default.target
UNITEOF

  systemctl --user daemon-reload
  systemctl --user enable --now ccem-apm.service
  success "systemd user service installed: ccem-apm.service"
}

# ============================================================================
# Phase 9: Verification
# ============================================================================
phase_verify() {
  header "Phase 9: Verification"
  step_progress "Verifying installation"

  if [[ "$DRY_RUN" == "1" ]]; then
    summary_add "APM Server (${CCEM_APM_PORT})" "SKIPPED"
    summary_add "TypeScript CLI"               "SKIPPED"
    summary_add "Claude Code Hooks"            "SKIPPED"
    summary_add "CCEMHelper"                    "SKIPPED"
    summary_add "System Service"               "SKIPPED"
    summary_print
    return 0
  fi

  # APM server
  if curl -sf --max-time 3 "http://localhost:${CCEM_APM_PORT}/api/status" &>/dev/null || \
     lsof -ti:"$CCEM_APM_PORT" &>/dev/null 2>&1; then
    summary_add "APM Server (${CCEM_APM_PORT})" "OK"
  else
    summary_add "APM Server (${CCEM_APM_PORT})" "FAILED"
  fi

  # CLI
  if [[ "$SKIP_CLI" == "1" ]]; then
    summary_add "TypeScript CLI" "SKIPPED"
  elif [[ -f "$CCEM_HOME/dist/cli.js" ]]; then
    summary_add "TypeScript CLI" "OK"
  else
    summary_add "TypeScript CLI" "FAILED"
  fi

  # Hooks
  if [[ "$SKIP_HOOKS" == "1" ]]; then
    summary_add "Claude Code Hooks" "SKIPPED"
  elif [[ -f "$HOME/.claude/settings.json" ]] && \
       python3 -c "import json; d=json.load(open('$HOME/.claude/settings.json')); d['hooks']['SessionStart']" &>/dev/null 2>&1; then
    summary_add "Claude Code Hooks" "OK"
  else
    summary_add "Claude Code Hooks" "FAILED"
  fi

  # CCEMHelper
  if [[ "$PLATFORM" != "darwin" || "$SKIP_AGENT" == "1" ]]; then
    summary_add "CCEMHelper" "SKIPPED"
  elif [[ -d "$HOME/Applications/CCEMHelper.app" ]] || \
       [[ -d "$CCEM_HOME/CCEMHelper/.build/CCEMHelper.app" ]]; then
    summary_add "CCEMHelper" "OK"
  else
    summary_add "CCEMHelper" "FAILED"
  fi

  # Service
  if [[ "$SKIP_SERVICE" == "1" ]]; then
    summary_add "System Service" "SKIPPED"
  else
    case "$PLATFORM" in
      darwin)
        if launchctl print "gui/$(id -u)/${LAUNCHD_SERVER_LABEL}" &>/dev/null; then
          summary_add "System Service" "OK"
        else
          summary_add "System Service" "FAILED"
        fi
        ;;
      linux)
        if systemctl --user is-enabled ccem-apm.service &>/dev/null; then
          summary_add "System Service" "OK"
        else
          summary_add "System Service" "FAILED"
        fi
        ;;
    esac
  fi

  summary_print
}

# ============================================================================
# Installation plan display
# ============================================================================
print_plan() {
  echo ""
  if [[ "$HAS_GUM" == "1" ]]; then
    gum style --bold "Installation Plan"
    echo ""
    gum style "  Platform     : $PLATFORM ($ARCH)"
    gum style "  CCEM_HOME    : $CCEM_HOME"
    gum style "  Shell        : $USER_SHELL ($SHELL_RC)"
    gum style "  APM Port     : $CCEM_APM_PORT"
    gum style "  TUI          : gum (charmbracelet)"
  else
    echo -e "${BOLD}  Installation Plan${RESET}"
    echo -e "  ${BOLD}Platform:${RESET}     $PLATFORM ($ARCH)"
    echo -e "  ${BOLD}CCEM_HOME:${RESET}    $CCEM_HOME"
    echo -e "  ${BOLD}Shell:${RESET}        $USER_SHELL ($SHELL_RC)"
    echo -e "  ${BOLD}APM Port:${RESET}     $CCEM_APM_PORT"
    echo -e "  ${BOLD}TUI:${RESET}          ANSI fallback (install gum for enhanced UX)"
  fi
  echo ""
  echo "  Components:"
  step "APM v4 Phoenix Server"
  [[ "$SKIP_CLI" != "1" ]]     && step "TypeScript CLI (@ccem/core)"
  [[ "$SKIP_HOOKS" != "1" ]]   && step "Claude Code Hooks"
  [[ "$PLATFORM" == "darwin" && "$SKIP_AGENT" != "1" ]] && step "CCEMHelper (macOS menu bar)"
  [[ "$SKIP_SERVICE" != "1" ]] && step "System service ($(case "$PLATFORM" in darwin) echo launchd;; linux) echo systemd;; *) echo none;; esac))"
  echo ""
}

# ============================================================================
# Main
# ============================================================================
main() {
  parse_args "$@"

  print_banner

  preflight

  print_plan

  if ! confirm "Proceed with installation?"; then
    echo "Aborted."
    exit 0
  fi

  phase_dependencies
  phase_paths
  phase_build_apm
  phase_build_cli
  phase_build_agent
  phase_init_config
  phase_hooks
  phase_service
  phase_verify

  echo ""
  if [[ "$HAS_GUM" == "1" ]]; then
    gum style \
      --border rounded \
      --border-foreground 2 \
      --padding "1 3" \
      --bold \
      "Installation complete!" \
      "" \
      "Dashboard : http://localhost:${CCEM_APM_PORT}" \
      "Config    : $CCEM_HOME/apm/apm_config.json" \
      "Logs      : $CCEM_HOME/apm/hooks/apm_server.log"
  else
    echo -e "${BOLD}${GREEN}Installation complete.${RESET}"
    echo ""
    echo "  Dashboard : http://localhost:${CCEM_APM_PORT}"
    echo "  Config    : $CCEM_HOME/apm/apm_config.json"
    echo "  Logs      : $CCEM_HOME/apm/hooks/apm_server.log"
  fi
  echo ""
  if [[ -n "${SHELL_RC:-}" ]]; then
    echo "  Run: source $SHELL_RC  — to update your current shell"
  fi
  echo ""
}

main "$@"
