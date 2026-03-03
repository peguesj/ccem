#!/bin/bash
# CCEM Installer — Build functions for each component

build_apm_server() {
  header "Phase 3: Building APM v4 Phoenix Server"

  local apm_dir="$CCEM_HOME/apm-v4"

  if [[ ! -d "$apm_dir" ]]; then
    fatal "APM v4 directory not found at $apm_dir"
  fi

  if [[ "${DRY_RUN:-0}" == "1" ]]; then
    step "[dry-run] Would build APM server in $apm_dir"
    return 0
  fi

  cd "$apm_dir"

  spinner_start "Updating submodules..."
  git submodule update --init --recursive 2>&1 | tail -5
  spinner_stop

  spinner_start "Installing Hex and Rebar..."
  mix local.hex --force --if-missing
  mix local.rebar --force --if-missing
  spinner_stop

  spinner_start "Fetching dependencies (mix deps.get)..."
  mix deps.get
  spinner_stop

  spinner_start "Setting up assets (esbuild + tailwind)..."
  mix assets.setup
  spinner_stop

  spinner_start "Building assets..."
  mix assets.build
  spinner_stop

  spinner_start "Compiling Elixir..."
  if mix compile; then
    spinner_stop
    success "APM v4 Phoenix server compiled successfully"
    return 0
  else
    spinner_stop
    error "mix compile failed"
    return 1
  fi
}

build_typescript_cli() {
  header "Phase 4: Building TypeScript CLI"

  if [[ "${SKIP_CLI:-0}" == "1" ]]; then
    info "Skipping TypeScript CLI (--skip-cli)"
    return 0
  fi

  if [[ "${DRY_RUN:-0}" == "1" ]]; then
    step "[dry-run] Would build CLI in $CCEM_HOME"
    return 0
  fi

  cd "$CCEM_HOME"

  spinner_start "Installing npm dependencies..."
  npm install 2>&1 | tail -3
  spinner_stop

  spinner_start "Building TypeScript..."
  if npm run build 2>&1; then
    spinner_stop
  else
    spinner_stop
    error "npm run build failed"
    return 1
  fi

  if [[ -f "$CCEM_HOME/dist/cli.js" ]]; then
    success "TypeScript CLI built (dist/cli.js)"
  else
    error "dist/cli.js not found after build"
    return 1
  fi

  # Optional: npm link for global ccem command
  if confirm "Create global 'ccem' command (npm link)?"; then
    npm link 2>&1 || warn "npm link failed (non-fatal, you can run it later)"
  fi

  return 0
}

build_ccem_agent() {
  header "Phase 5: Building CCEMAgent"

  if [[ "$PLATFORM" != "darwin" ]]; then
    info "Skipping CCEMAgent (Linux — macOS only)"
    return 0
  fi

  if [[ "${SKIP_AGENT:-0}" == "1" ]]; then
    info "Skipping CCEMAgent (--skip-agent)"
    return 0
  fi

  local agent_dir="$CCEM_HOME/CCEMAgent"

  if [[ ! -d "$agent_dir" ]]; then
    warn "CCEMAgent directory not found at $agent_dir — skipping"
    return 0
  fi

  if [[ "${DRY_RUN:-0}" == "1" ]]; then
    step "[dry-run] Would build CCEMAgent in $agent_dir"
    return 0
  fi

  cd "$agent_dir"

  spinner_start "Building CCEMAgent (swift build -c release)..."
  if swift build -c release 2>&1; then
    spinner_stop
  else
    spinner_stop
    error "swift build failed"
    return 1
  fi

  spinner_start "Creating .app bundle..."
  if [[ -f "build-app.sh" ]]; then
    bash build-app.sh 2>&1
    spinner_stop
  else
    spinner_stop
    warn "build-app.sh not found, skipping .app bundle creation"
    return 0
  fi

  local app_binary="$agent_dir/.build/CCEMAgent.app/Contents/MacOS/CCEMAgent"
  if [[ -x "$app_binary" ]]; then
    success "CCEMAgent built: $agent_dir/.build/CCEMAgent.app"
  else
    error "CCEMAgent binary not found or not executable"
    return 1
  fi

  # Optional: copy to ~/Applications
  if confirm "Copy CCEMAgent.app to ~/Applications?"; then
    mkdir -p "$HOME/Applications"
    cp -R "$agent_dir/.build/CCEMAgent.app" "$HOME/Applications/CCEMAgent.app"
    success "Copied to ~/Applications/CCEMAgent.app"
  fi

  return 0
}

init_config_and_state() {
  header "Phase 6: Initializing Config & State"

  if [[ "${DRY_RUN:-0}" == "1" ]]; then
    step "[dry-run] Would create directories and default config"
    return 0
  fi

  # Create required directories
  mkdir -p "$CCEM_HOME/apm/sessions"
  mkdir -p "$CCEM_HOME/apm/.hook_state"
  mkdir -p "$HOME/.claude/projects"
  step "Created directories: apm/sessions, apm/.hook_state, ~/.claude/projects"

  # Create apm_config.json from schema defaults if absent
  local config_file="$CCEM_HOME/apm/apm_config.json"
  if [[ ! -f "$config_file" ]]; then
    cat > "$config_file" << ENDJSON
{
  "\$schema": "./apm_config_v4.schema.json",
  "version": "4.0.0",
  "port": ${CCEM_APM_PORT},
  "active_project": "",
  "projects": []
}
ENDJSON
    success "Created default apm_config.json"
  else
    info "apm_config.json already exists — preserving"
  fi

  return 0
}
