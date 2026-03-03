#!/bin/bash
# CCEM Installer — Platform detection and version checks

detect_platform() {
  PLATFORM="$(uname -s | tr '[:upper:]' '[:lower:]')"
  ARCH="$(uname -m)"
  case "$PLATFORM" in
    darwin|linux) ;;
    *) fatal "Unsupported platform: $PLATFORM (only macOS and Linux are supported)" ;;
  esac
  verbose "Platform: $PLATFORM ($ARCH)"
}

detect_shell() {
  USER_SHELL="$(basename "${SHELL:-/bin/bash}")"
  case "$USER_SHELL" in
    zsh)  SHELL_RC="$HOME/.zshrc" ;;
    bash) SHELL_RC="$HOME/.bashrc" ;;
    *)    SHELL_RC="$HOME/.profile"; warn "Unknown shell '$USER_SHELL', using .profile" ;;
  esac
  verbose "Shell: $USER_SHELL (rc: $SHELL_RC)"
}

detect_package_manager() {
  PKG_MANAGER=""
  if [[ "$PLATFORM" == "darwin" ]]; then
    if command -v brew &>/dev/null; then
      PKG_MANAGER="brew"
    fi
  elif [[ "$PLATFORM" == "linux" ]]; then
    if command -v apt-get &>/dev/null; then
      PKG_MANAGER="apt"
    elif command -v dnf &>/dev/null; then
      PKG_MANAGER="dnf"
    elif command -v yum &>/dev/null; then
      PKG_MANAGER="yum"
    fi
  fi
  verbose "Package manager: ${PKG_MANAGER:-none}"
}

# Check if a version manager (asdf/mise/nix) provides a command
has_version_manager_for() {
  local cmd="$1"
  if command -v asdf &>/dev/null && asdf which "$cmd" &>/dev/null 2>&1; then
    return 0
  fi
  if command -v mise &>/dev/null && mise which "$cmd" &>/dev/null 2>&1; then
    return 0
  fi
  return 1
}

# Version comparison: returns 0 if $1 >= $2 (major.minor)
version_gte() {
  local have="$1" need="$2"
  local have_major have_minor need_major need_minor
  have_major="${have%%.*}"
  have_minor="${have#*.}"; have_minor="${have_minor%%.*}"
  need_major="${need%%.*}"
  need_minor="${need#*.}"; need_minor="${need_minor%%.*}"
  if (( have_major > need_major )); then return 0; fi
  if (( have_major == need_major && have_minor >= need_minor )); then return 0; fi
  return 1
}

# Extract version number from command output
get_erlang_version() {
  erl -eval 'io:fwrite("~s~n", [erlang:system_info(otp_release)]), halt().' -noshell 2>/dev/null || echo "0"
}

get_elixir_version() {
  elixir --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1 || echo "0.0.0"
}

get_node_version() {
  node --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1 || echo "0.0.0"
}

get_swift_version() {
  swift --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+(\.[0-9]+)?' | head -1 || echo "0.0"
}

# Validate all required dependencies meet minimum versions
# Sets CHECK_* vars for downstream use
validate_dependencies() {
  header "Checking Dependencies"
  local all_ok=1

  # Erlang
  if command -v erl &>/dev/null; then
    local erl_ver
    erl_ver=$(get_erlang_version)
    if (( erl_ver >= MIN_ERLANG_MAJOR )); then
      success "Erlang OTP $erl_ver (>= $MIN_ERLANG_MAJOR)"
      CHECK_ERLANG=1
    else
      error "Erlang OTP $erl_ver (need >= $MIN_ERLANG_MAJOR)"
      CHECK_ERLANG=0; all_ok=0
    fi
  else
    error "Erlang not found"
    CHECK_ERLANG=0; all_ok=0
  fi

  # Elixir
  if command -v elixir &>/dev/null; then
    local ex_ver
    ex_ver=$(get_elixir_version)
    if version_gte "$ex_ver" "$MIN_ELIXIR"; then
      success "Elixir $ex_ver (>= $MIN_ELIXIR)"
      CHECK_ELIXIR=1
    else
      error "Elixir $ex_ver (need >= $MIN_ELIXIR)"
      CHECK_ELIXIR=0; all_ok=0
    fi
  else
    error "Elixir not found"
    CHECK_ELIXIR=0; all_ok=0
  fi

  # Node.js
  if command -v node &>/dev/null; then
    local node_ver
    node_ver=$(get_node_version)
    local node_major="${node_ver%%.*}"
    if (( node_major >= MIN_NODE_MAJOR )); then
      success "Node.js v$node_ver (>= $MIN_NODE_MAJOR)"
      CHECK_NODE=1
    else
      error "Node.js v$node_ver (need >= $MIN_NODE_MAJOR)"
      CHECK_NODE=0; all_ok=0
    fi
  else
    error "Node.js not found"
    CHECK_NODE=0; all_ok=0
  fi

  # jq
  if command -v jq &>/dev/null; then
    success "jq $(jq --version 2>/dev/null || echo 'present')"
    CHECK_JQ=1
  else
    error "jq not found"
    CHECK_JQ=0; all_ok=0
  fi

  # curl
  if command -v curl &>/dev/null; then
    success "curl present"
    CHECK_CURL=1
  else
    error "curl not found"
    CHECK_CURL=0; all_ok=0
  fi

  # lsof
  if command -v lsof &>/dev/null; then
    success "lsof present"
  else
    warn "lsof not found (port checks will be limited)"
  fi

  # openssl
  if command -v openssl &>/dev/null; then
    success "openssl present"
  else
    warn "openssl not found (trace ID generation will fall back to /dev/urandom)"
  fi

  # Swift (macOS only)
  CHECK_SWIFT=0
  if [[ "$PLATFORM" == "darwin" && "${SKIP_AGENT:-0}" != "1" ]]; then
    if command -v swift &>/dev/null; then
      local swift_ver
      swift_ver=$(get_swift_version)
      if version_gte "$swift_ver" "$MIN_SWIFT"; then
        success "Swift $swift_ver (>= $MIN_SWIFT)"
        CHECK_SWIFT=1
      else
        error "Swift $swift_ver (need >= $MIN_SWIFT)"
        all_ok=0
      fi
    else
      error "Swift not found (install Xcode or Xcode Command Line Tools)"
      all_ok=0
    fi
  fi

  return $( [[ "$all_ok" == "1" ]] && echo 0 || echo 1 )
}
