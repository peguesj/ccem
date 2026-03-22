#!/bin/bash
# CCEM Installer — Service management (launchd / systemd)

install_service() {
  header "Phase 8: Installing System Service"

  if [[ "${SKIP_SERVICE:-0}" == "1" ]]; then
    info "Skipping service installation (--skip-service)"
    return 0
  fi

  if [[ "${DRY_RUN:-0}" == "1" ]]; then
    step "[dry-run] Would install $(service_type_name) service"
    return 0
  fi

  case "$PLATFORM" in
    darwin) install_launchd_services ;;
    linux)  install_systemd_service ;;
  esac
}

install_launchd_services() {
  local agents_dir="$HOME/Library/LaunchAgents"
  mkdir -p "$agents_dir"

  # Capture current PATH for the plist (so mix/erl/node are found)
  local current_path
  current_path="$PATH"

  # APM Server plist
  local server_plist="$agents_dir/${LAUNCHD_SERVER_LABEL}.plist"
  local template="$INSTALLER_DIR/services/${LAUNCHD_SERVER_LABEL}.plist"

  if [[ -f "$template" ]]; then
    sed \
      -e "s|__CCEM_HOME__|${CCEM_HOME}|g" \
      -e "s|__HOME__|${HOME}|g" \
      -e "s|__PATH__|${current_path}|g" \
      -e "s|__PORT__|${CCEM_APM_PORT}|g" \
      "$template" > "$server_plist"
  else
    warn "Server plist template not found at $template"
    return 1
  fi

  # Unload first if already loaded (idempotent)
  launchctl bootout "gui/$(id -u)/${LAUNCHD_SERVER_LABEL}" 2>/dev/null || true

  if launchctl bootstrap "gui/$(id -u)" "$server_plist" 2>/dev/null; then
    success "Loaded launchd service: $LAUNCHD_SERVER_LABEL"
  else
    # Fallback to legacy load
    launchctl load "$server_plist" 2>/dev/null
    success "Loaded launchd service (legacy): $LAUNCHD_SERVER_LABEL"
  fi

  # CCEMHelper plist (macOS only, skip if --skip-agent)
  if [[ "${SKIP_AGENT:-0}" != "1" ]]; then
    local agent_plist="$agents_dir/${LAUNCHD_AGENT_LABEL}.plist"
    local agent_template="$INSTALLER_DIR/services/${LAUNCHD_AGENT_LABEL}.plist"

    if [[ -f "$agent_template" ]]; then
      sed \
        -e "s|__CCEM_HOME__|${CCEM_HOME}|g" \
        -e "s|__HOME__|${HOME}|g" \
        "$agent_template" > "$agent_plist"

      launchctl bootout "gui/$(id -u)/${LAUNCHD_AGENT_LABEL}" 2>/dev/null || true
      if launchctl bootstrap "gui/$(id -u)" "$agent_plist" 2>/dev/null; then
        success "Loaded launchd service: $LAUNCHD_AGENT_LABEL"
      else
        launchctl load "$agent_plist" 2>/dev/null
        success "Loaded launchd service (legacy): $LAUNCHD_AGENT_LABEL"
      fi
    fi
  fi
}

install_systemd_service() {
  local unit_dir="$HOME/.config/systemd/user"
  mkdir -p "$unit_dir"

  local unit_file="$unit_dir/$SYSTEMD_UNIT"
  local template="$INSTALLER_DIR/services/$SYSTEMD_UNIT"

  # Capture PATH for systemd
  local current_path
  current_path="$PATH"

  if [[ -f "$template" ]]; then
    sed \
      -e "s|__CCEM_HOME__|${CCEM_HOME}|g" \
      -e "s|__HOME__|${HOME}|g" \
      -e "s|__PATH__|${current_path}|g" \
      -e "s|__PORT__|${CCEM_APM_PORT}|g" \
      "$template" > "$unit_file"
  else
    warn "systemd unit template not found at $template"
    return 1
  fi

  systemctl --user daemon-reload
  systemctl --user enable "$SYSTEMD_UNIT"
  systemctl --user start "$SYSTEMD_UNIT"
  success "Enabled and started systemd user unit: $SYSTEMD_UNIT"
}

uninstall_service() {
  case "$(uname -s | tr '[:upper:]' '[:lower:]')" in
    darwin)
      local agents_dir="$HOME/Library/LaunchAgents"

      # APM Server
      local server_plist="$agents_dir/${LAUNCHD_SERVER_LABEL}.plist"
      if [[ -f "$server_plist" ]]; then
        launchctl bootout "gui/$(id -u)/${LAUNCHD_SERVER_LABEL}" 2>/dev/null \
          || launchctl unload "$server_plist" 2>/dev/null || true
        rm -f "$server_plist"
        echo "  Removed launchd service: $LAUNCHD_SERVER_LABEL"
      fi

      # CCEMHelper
      local agent_plist="$agents_dir/${LAUNCHD_AGENT_LABEL}.plist"
      if [[ -f "$agent_plist" ]]; then
        launchctl bootout "gui/$(id -u)/${LAUNCHD_AGENT_LABEL}" 2>/dev/null \
          || launchctl unload "$agent_plist" 2>/dev/null || true
        rm -f "$agent_plist"
        echo "  Removed launchd service: $LAUNCHD_AGENT_LABEL"
      fi
      ;;

    linux)
      if systemctl --user is-active "$SYSTEMD_UNIT" &>/dev/null; then
        systemctl --user stop "$SYSTEMD_UNIT"
        systemctl --user disable "$SYSTEMD_UNIT"
      fi
      rm -f "$HOME/.config/systemd/user/$SYSTEMD_UNIT"
      systemctl --user daemon-reload 2>/dev/null || true
      echo "  Removed systemd service: $SYSTEMD_UNIT"
      ;;
  esac
}
