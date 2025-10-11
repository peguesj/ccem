#!/usr/bin/env python3
"""
Post-Merge Security Audit Hook
Triggered once per project after merge to audit security flags
"""
import json
import os
import sys
from pathlib import Path

# Security flags to audit
SECURITY_AUDITS = [
    {
        "flag": "bypassPermissions",
        "project": "idfwu",
        "risk": "high",
        "description": "Bypass permissions mode was enabled. This allows unrestricted access.",
        "recommendation": "Review if this is still needed. Consider using specific permissions instead."
    },
    {
        "flag": "Bash(:*:*)",
        "project": "idfwu",
        "risk": "high",
        "description": "Overly permissive bash pattern allows any command execution.",
        "recommendation": "Replace with specific command patterns for better security."
    }
]

def main():
    # Read input from stdin (hook context)
    try:
        input_data = json.load(sys.stdin)
    except:
        input_data = {}

    audit_file = Path.home() / ".claude" / "ccem" / "security-audit-status.json"

    # Check if audit has already been completed
    if audit_file.exists():
        with open(audit_file) as f:
            status = json.load(f)
            if status.get("completed", False):
                # Audit already done, skip
                sys.exit(0)

    # Present security audit
    print("\\n" + "="*70)
    print("🔒 SECURITY AUDIT - Post-Merge Configuration Review")
    print("="*70 + "\\n")

    print("The following security-sensitive configurations were found during merge:\\n")

    for i, audit in enumerate(SECURITY_AUDITS, 1):
        print(f"{i}. [{audit['risk'].upper()} RISK] {audit['flag']}")
        print(f"   Project: {audit['project']}")
        print(f"   Issue: {audit['description']}")
        print(f"   Recommendation: {audit['recommendation']}")
        print()

    print("These flags were NOT carried over to user-level for security reasons.")
    print("If you need these permissions, please add them explicitly with proper scoping.\\n")

    # Mark audit as completed
    audit_file.parent.mkdir(parents=True, exist_ok=True)
    with open(audit_file, 'w') as f:
        json.dump({
            "completed": True,
            "timestamp": input_data.get("timestamp", "unknown"),
            "audits": SECURITY_AUDITS
        }, f, indent=2)

    print("Security audit completed. This message will not appear again.")
    print("="*70 + "\\n")

if __name__ == "__main__":
    main()
