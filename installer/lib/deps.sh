#!/bin/bash
# CCEM Installer — Dependency installation (brew/apt/dnf)

install_dependencies() {
  header "Installing Dependencies"

  case "$PLATFORM" in
    darwin) install_deps_macos ;;
    linux)  install_deps_linux ;;
  esac
}

install_deps_macos() {
  # Install Homebrew if missing
  if [[ -z "$PKG_MANAGER" ]]; then
    warn "Homebrew not found."
    if confirm "Install Homebrew?"; then
      info "Installing Homebrew..."
      /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
      # Re-source brew shellenv
      if [[ -f /opt/homebrew/bin/brew ]]; then
        eval "$(/opt/homebrew/bin/brew shellenv)"
      elif [[ -f /usr/local/bin/brew ]]; then
        eval "$(/usr/local/bin/brew shellenv)"
      fi
      PKG_MANAGER="brew"
    else
      fatal "Cannot install dependencies without a package manager."
    fi
  fi

  local to_install=()

  # Erlang
  if [[ "$CHECK_ERLANG" != "1" ]]; then
    if ! has_version_manager_for erl; then
      to_install+=(erlang)
    else
      info "Erlang managed by version manager, skipping brew install"
    fi
  fi

  # Elixir
  if [[ "$CHECK_ELIXIR" != "1" ]]; then
    if ! has_version_manager_for elixir; then
      to_install+=(elixir)
    else
      info "Elixir managed by version manager, skipping brew install"
    fi
  fi

  # Node.js
  if [[ "$CHECK_NODE" != "1" ]]; then
    if ! has_version_manager_for node; then
      to_install+=(node)
    else
      info "Node.js managed by version manager, skipping brew install"
    fi
  fi

  # jq
  if [[ "$CHECK_JQ" != "1" ]]; then
    to_install+=(jq)
  fi

  # curl (usually present on macOS, but just in case)
  if [[ "$CHECK_CURL" != "1" ]]; then
    to_install+=(curl)
  fi

  if [[ ${#to_install[@]} -eq 0 ]]; then
    success "All dependencies already satisfied"
    return 0
  fi

  info "Installing via Homebrew: ${to_install[*]}"
  if [[ "${DRY_RUN:-0}" == "1" ]]; then
    step "[dry-run] brew install ${to_install[*]}"
    return 0
  fi

  brew install "${to_install[@]}"

  # Swift check — cannot install via brew, needs Xcode
  if [[ "${SKIP_AGENT:-0}" != "1" && "$CHECK_SWIFT" != "1" ]]; then
    if ! command -v swift &>/dev/null; then
      warn "Swift is not installed. CCEMHelper requires Xcode or Xcode Command Line Tools."
      echo "  Install with: xcode-select --install"
      echo "  Or download Xcode from the App Store."
      SKIP_AGENT=1
    fi
  fi
}

install_deps_linux() {
  local need_erlang_repo=0
  local need_node_repo=0

  [[ "$CHECK_ERLANG" != "1" || "$CHECK_ELIXIR" != "1" ]] && need_erlang_repo=1
  [[ "$CHECK_NODE" != "1" ]] && need_node_repo=1

  case "$PKG_MANAGER" in
    apt) install_deps_apt "$need_erlang_repo" "$need_node_repo" ;;
    dnf|yum) install_deps_dnf "$need_erlang_repo" "$need_node_repo" ;;
    *)
      fatal "No supported package manager found (need apt or dnf/yum)."
      ;;
  esac
}

install_deps_apt() {
  local need_erlang_repo="$1" need_node_repo="$2"

  if [[ "${DRY_RUN:-0}" == "1" ]]; then
    step "[dry-run] Would configure apt repos and install packages"
    return 0
  fi

  # Add Erlang Solutions repo for modern Erlang/Elixir
  if [[ "$need_erlang_repo" == "1" ]]; then
    info "Adding Erlang Solutions repository..."
    local erlang_list="/etc/apt/sources.list.d/erlang-solutions.list"
    if [[ ! -f "$erlang_list" ]]; then
      curl -fsSL https://packages.erlang-solutions.com/ubuntu/erlang_solutions.asc \
        | sudo gpg --dearmor -o /usr/share/keyrings/erlang-solutions-archive-keyring.gpg
      local codename
      codename=$(lsb_release -cs 2>/dev/null || echo "jammy")
      echo "deb [signed-by=/usr/share/keyrings/erlang-solutions-archive-keyring.gpg] https://packages.erlang-solutions.com/ubuntu ${codename} contrib" \
        | sudo tee "$erlang_list" >/dev/null
    fi
  fi

  # Add NodeSource repo for Node 18+
  if [[ "$need_node_repo" == "1" ]]; then
    info "Adding NodeSource repository..."
    if ! command -v node &>/dev/null || (( $(node -v 2>/dev/null | grep -oE '[0-9]+' | head -1) < MIN_NODE_MAJOR )); then
      curl -fsSL https://deb.nodesource.com/setup_${MIN_NODE_MAJOR}.x | sudo -E bash -
    fi
  fi

  sudo apt-get update -qq

  local pkgs=()
  [[ "$CHECK_ERLANG" != "1" ]] && pkgs+=(erlang)
  [[ "$CHECK_ELIXIR" != "1" ]] && pkgs+=(elixir)
  [[ "$CHECK_NODE" != "1" ]] && pkgs+=(nodejs)
  [[ "$CHECK_JQ" != "1" ]] && pkgs+=(jq)
  [[ "$CHECK_CURL" != "1" ]] && pkgs+=(curl)
  command -v lsof &>/dev/null || pkgs+=(lsof)
  command -v openssl &>/dev/null || pkgs+=(openssl)

  if [[ ${#pkgs[@]} -gt 0 ]]; then
    info "Installing: ${pkgs[*]}"
    sudo apt-get install -y "${pkgs[@]}"
  fi
}

install_deps_dnf() {
  local need_erlang_repo="$1" need_node_repo="$2"
  local installer="$PKG_MANAGER"

  if [[ "${DRY_RUN:-0}" == "1" ]]; then
    step "[dry-run] Would configure repos and install packages via $installer"
    return 0
  fi

  # Erlang Solutions repo
  if [[ "$need_erlang_repo" == "1" ]]; then
    info "Adding Erlang Solutions repository..."
    sudo $installer install -y \
      https://packages.erlang-solutions.com/erlang-solutions-2.0-1.noarch.rpm 2>/dev/null || true
  fi

  # NodeSource repo
  if [[ "$need_node_repo" == "1" ]]; then
    info "Adding NodeSource repository..."
    curl -fsSL https://rpm.nodesource.com/setup_${MIN_NODE_MAJOR}.x | sudo bash -
  fi

  local pkgs=()
  [[ "$CHECK_ERLANG" != "1" ]] && pkgs+=(erlang)
  [[ "$CHECK_ELIXIR" != "1" ]] && pkgs+=(elixir)
  [[ "$CHECK_NODE" != "1" ]] && pkgs+=(nodejs)
  [[ "$CHECK_JQ" != "1" ]] && pkgs+=(jq)
  [[ "$CHECK_CURL" != "1" ]] && pkgs+=(curl)
  command -v lsof &>/dev/null || pkgs+=(lsof)
  command -v openssl &>/dev/null || pkgs+=(openssl)

  if [[ ${#pkgs[@]} -gt 0 ]]; then
    info "Installing: ${pkgs[*]}"
    sudo $installer install -y "${pkgs[@]}"
  fi
}
