#!/bin/bash
# CCEM Project Migration/Fork Handler
# Migrate Claude Code configuration and chat history to new directory

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CCEM_DIR="$HOME/.claude/ccem"
PREFS_FILE="$CCEM_DIR/preferences.json"

# Functions
print_header() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Get default projects directory from preferences
get_default_projects_dir() {
    if [ -f "$PREFS_FILE" ]; then
        # Extract default_projects_dir from JSON (simple grep approach)
        DEFAULT_DIR=$(grep -o '"default_projects_dir"[[:space:]]*:[[:space:]]*"[^"]*"' "$PREFS_FILE" | cut -d'"' -f4)
    fi

    if [ -z "$DEFAULT_DIR" ]; then
        DEFAULT_DIR="$HOME/Developer"
    fi

    echo "$DEFAULT_DIR"
}

# Set default projects directory
set_default_projects_dir() {
    local dir="$1"
    mkdir -p "$CCEM_DIR"

    if [ -f "$PREFS_FILE" ]; then
        # Update existing preferences
        # Simple approach: add if not exists
        if ! grep -q "default_projects_dir" "$PREFS_FILE"; then
            # Add to JSON (before last closing brace)
            sed -i'.bak' '$ d' "$PREFS_FILE"
            echo ",  \"default_projects_dir\": \"$dir\"" >> "$PREFS_FILE"
            echo "}" >> "$PREFS_FILE"
            rm "$PREFS_FILE.bak"
        fi
    else
        # Create new preferences file
        cat > "$PREFS_FILE" <<EOF
{
  "version": "1.0.0",
  "default_projects_dir": "$dir"
}
EOF
    fi

    print_success "Default projects directory set to: $dir"
}

# Main migration function
migrate_project() {
    local source_dir="$1"
    local target_dir="$2"
    local include_history="$3"
    local include_settings="$4"
    local analyze_files="$5"

    print_header "🚀 CCEM Project Migration/Fork"

    echo ""
    echo "Source: $source_dir"
    echo "Target: $target_dir"
    echo "Include History: $include_history"
    echo "Include Settings: $include_settings"
    echo "Analyze Files: $analyze_files"
    echo ""

    # Validate source directory
    if [ ! -d "$source_dir/.claude" ]; then
        print_error "Source directory does not have .claude configuration"
        exit 1
    fi

    # Create target directory
    if [ -d "$target_dir" ]; then
        print_warning "Target directory already exists"
        read -p "Continue? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_error "Migration cancelled"
            exit 1
        fi
    fi

    mkdir -p "$target_dir/.claude"
    print_success "Created target directory: $target_dir"

    # Copy .claude configuration
    if [ "$include_settings" = "true" ]; then
        if [ -f "$source_dir/.claude/settings.local.json" ]; then
            cp "$source_dir/.claude/settings.local.json" "$target_dir/.claude/"
            print_success "Copied settings.local.json"
        fi

        if [ -d "$source_dir/.claude/commands" ]; then
            cp -r "$source_dir/.claude/commands" "$target_dir/.claude/"
            print_success "Copied custom commands"
        fi

        if [ -d "$source_dir/.claude/agents" ]; then
            cp -r "$source_dir/.claude/agents" "$target_dir/.claude/"
            print_success "Copied agent definitions"
        fi

        if [ -d "$source_dir/.claude/hooks" ]; then
            cp -r "$source_dir/.claude/hooks" "$target_dir/.claude/"
            print_success "Copied hooks"
        fi
    fi

    # Copy chat history if requested
    if [ "$include_history" = "true" ]; then
        if [ -f "$source_dir/.claude/history.jsonl" ]; then
            cp "$source_dir/.claude/history.jsonl" "$target_dir/.claude/"
            print_success "Copied chat history"
        else
            print_warning "No chat history found in source"
        fi
    fi

    # Analyze files if requested
    if [ "$analyze_files" = "true" ]; then
        print_header "📊 Analyzing Project Files"

        echo ""
        echo "File Statistics:"
        find "$source_dir" -type f -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/.next/*" | wc -l | xargs echo "  Total files:"

        echo ""
        echo "File Types:"
        find "$source_dir" -type f -not -path "*/node_modules/*" -not -path "*/.git/*" | sed 's/.*\.//' | sort | uniq -c | sort -rn | head -10

        echo ""
        echo "Largest files:"
        find "$source_dir" -type f -not -path "*/node_modules/*" -not -path "*/.git/*" -exec ls -lh {} \; | sort -k5 -hr | head -5 | awk '{print "  " $9 " (" $5 ")"}'

        echo ""
    fi

    print_header "✨ Migration Complete"

    echo ""
    echo "Next steps:"
    echo "  1. cd $target_dir"
    echo "  2. Review migrated configuration"
    echo "  3. Run: /ccem inspect project"
    echo "  4. Initialize git if needed: git init"
    echo ""
}

# Usage information
usage() {
    cat <<EOF
Usage: $0 <target-dir> [options]

Options:
    --from <dir>        Source directory (default: current)
    --include-history   Include chat history (default: false)
    --include-settings  Include project settings (default: true)
    --analyze           Analyze files (default: true)
    --fork              Create independent fork
    --help              Show this help message

Examples:
    $0 ~/my-new-project
    $0 new-feature --from ~/Developer/lcc --include-history
    $0 ~/experiment --fork --analyze

EOF
}

# Parse arguments
if [ $# -eq 0 ] || [ "$1" = "--help" ]; then
    usage
    exit 0
fi

TARGET_DIR="$1"
shift

SOURCE_DIR="$(pwd)"
INCLUDE_HISTORY="false"
INCLUDE_SETTINGS="true"
ANALYZE_FILES="true"

while [[ $# -gt 0 ]]; do
    case $1 in
        --from)
            SOURCE_DIR="$2"
            shift 2
            ;;
        --include-history)
            INCLUDE_HISTORY="true"
            shift
            ;;
        --include-settings)
            INCLUDE_SETTINGS="true"
            shift
            ;;
        --analyze)
            ANALYZE_FILES="true"
            shift
            ;;
        --fork)
            # Fork implies full copy
            INCLUDE_HISTORY="true"
            INCLUDE_SETTINGS="true"
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Resolve target directory
if [[ "$TARGET_DIR" != /* ]]; then
    # Relative path - use default projects directory
    DEFAULT_PROJECTS_DIR=$(get_default_projects_dir)

    # Ask user if this should be the default
    if [ ! -f "$PREFS_FILE" ] || ! grep -q "default_projects_dir" "$PREFS_FILE"; then
        echo ""
        print_warning "No default projects directory set"
        read -p "Use $DEFAULT_PROJECTS_DIR as default? (Y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Nn]$ ]]; then
            set_default_projects_dir "$DEFAULT_PROJECTS_DIR"
        fi
    fi

    TARGET_DIR="$DEFAULT_PROJECTS_DIR/$TARGET_DIR"
fi

# Execute migration
migrate_project "$SOURCE_DIR" "$TARGET_DIR" "$INCLUDE_HISTORY" "$INCLUDE_SETTINGS" "$ANALYZE_FILES"
