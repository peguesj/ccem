#!/bin/bash
# Configuration Reporter Hook
# Reports updated configuration and CCEM command availability on session start

CCEM_DIR="$HOME/.claude/ccem"
REPORT_FILE="$CCEM_DIR/last-report.txt"

# Check if we've already reported in this session
if [ -f "$REPORT_FILE" ]; then
    LAST_REPORT=$(cat "$REPORT_FILE")
    CURRENT_TIME=$(date +%s)
    # Only report once per hour
    if [ $(($CURRENT_TIME - $LAST_REPORT)) -lt 3600 ]; then
        exit 0
    fi
fi

# Create report
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 CCEM Configuration Update"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✓ Project settings have been consolidated to user-level"
echo "✓ 83 unique permissions now available across all projects"
echo "✓ 4 MCP servers configured (linear, atlassian, ruv-swarm, claude-flow)"
echo ""
echo "🎯 New Command Available: /ccem"
echo ""
echo "Usage:"
echo "  /ccem inspect [scope]     - Inspect configuration"
echo "  /ccem merge [strategy]    - Merge project settings"
echo "  /ccem migrate <dir>       - Migrate/fork project to new directory"
echo "  /ccem optimize            - Optimize configuration"
echo "  /ccem backup              - Create configuration backup"
echo "  /ccem --help              - Show detailed help"
echo ""
echo "Examples:"
echo "  /ccem inspect user        - View user-level configuration"
echo "  /ccem migrate ~/myproj    - Fork current project to ~/myproj"
echo "  /ccem backup --compress   - Create compressed backup"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Mark as reported
mkdir -p "$CCEM_DIR"
date +%s > "$REPORT_FILE"
