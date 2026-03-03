#!/bin/bash
# CCEM Installer — Claude Code settings.json hook patching

configure_hooks() {
  header "Phase 7: Configuring Claude Code Hooks"

  if [[ "${SKIP_HOOKS:-0}" == "1" ]]; then
    info "Skipping hooks configuration (--skip-hooks)"
    return 0
  fi

  if [[ "${DRY_RUN:-0}" == "1" ]]; then
    step "[dry-run] Would patch $CLAUDE_SETTINGS with CCEM hooks"
    return 0
  fi

  local settings_file="$CLAUDE_SETTINGS"
  local hooks_dir="$CCEM_HOME/apm/hooks"

  # Ensure parent directory exists
  mkdir -p "$(dirname "$settings_file")"

  # Backup existing settings
  if [[ -f "$settings_file" ]]; then
    local backup="${settings_file}.bak.$(date +%s)"
    cp "$settings_file" "$backup"
    step "Backed up settings to $backup"
  else
    # Create minimal settings.json
    echo '{}' > "$settings_file"
    step "Created new $settings_file"
  fi

  # Build the CCEM hooks JSON using jq
  # Each hook maps a lifecycle event to the corresponding script
  local ccem_hooks
  ccem_hooks=$(cat << HOOKJSON
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "bash ${hooks_dir}/session_init.sh"
          }
        ]
      }
    ],
    "SessionEnd": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "bash ${hooks_dir}/session_end.sh"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "bash ${hooks_dir}/pre_tool_use.sh"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "bash ${hooks_dir}/post_tool_use.sh"
          }
        ]
      }
    ],
    "SubagentStart": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "bash ${hooks_dir}/subagent_start.sh"
          }
        ]
      }
    ],
    "SubagentStop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "bash ${hooks_dir}/subagent_stop.sh"
          }
        ]
      }
    ]
  }
}
HOOKJSON
)

  # Merge CCEM hooks into existing settings, preserving non-CCEM hooks
  # Strategy: for each lifecycle event, remove existing CCEM entries (matched by hooks_dir path),
  # then append the CCEM entries
  local tmp_file
  tmp_file=$(mktemp)

  # First, remove any existing CCEM hook entries from each lifecycle
  local cleaned
  cleaned=$(jq --arg hdir "$hooks_dir" '
    # Ensure .hooks exists
    .hooks //= {} |
    # For each lifecycle event, filter out entries whose command contains our hooks_dir
    .hooks |= with_entries(
      .value |= [
        .[]
        | select(
            (.hooks // [])
            | all(.command | tostring | contains($hdir) | not)
          )
      ]
    )
  ' "$settings_file" 2>/dev/null || cat "$settings_file")

  # Now merge the CCEM hooks in
  echo "$cleaned" | jq --argjson new "$ccem_hooks" '
    # Deep merge: for each lifecycle in new.hooks, append to existing array
    .hooks //= {} |
    reduce ($new.hooks | to_entries[]) as $entry (
      .;
      .hooks[$entry.key] = ((.hooks[$entry.key] // []) + $entry.value)
    )
  ' > "$tmp_file"

  # Validate the result is valid JSON
  if jq empty "$tmp_file" 2>/dev/null; then
    mv "$tmp_file" "$settings_file"
    success "Claude Code hooks configured in $settings_file"
  else
    rm -f "$tmp_file"
    error "Generated settings.json was invalid — restoring backup"
    if [[ -n "${backup:-}" && -f "$backup" ]]; then
      cp "$backup" "$settings_file"
    fi
    return 1
  fi

  return 0
}

# Patch hook scripts to use $CCEM_HOME instead of hardcoded paths
patch_hook_paths() {
  local default_path="$HOME/Developer/ccem"

  # Only patch if CCEM_HOME differs from the default
  if [[ "$CCEM_HOME" == "$default_path" ]]; then
    verbose "CCEM_HOME matches default path, no hook patching needed"
    return 0
  fi

  header "Patching Hook Paths"
  info "Replacing hardcoded paths with \$CCEM_HOME ($CCEM_HOME)"

  local hooks_dir="$CCEM_HOME/apm/hooks"

  for script in "$hooks_dir"/*.sh; do
    [[ -f "$script" ]] || continue
    local basename
    basename=$(basename "$script")

    if grep -q "$default_path" "$script"; then
      if [[ "${DRY_RUN:-0}" == "1" ]]; then
        step "[dry-run] Would patch $basename"
      else
        sed -i.bak "s|$default_path|$CCEM_HOME|g" "$script"
        rm -f "${script}.bak"
        step "Patched $basename"
      fi
    else
      verbose "$basename: no hardcoded paths found"
    fi
  done

  success "Hook paths updated"
}
