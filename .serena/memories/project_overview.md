# CCEM - Claude Code Environment Manager

## Purpose
CCEM is a multi-component system for managing Claude Code environments. It consists of:

1. **@ccem/core** (TypeScript/Node.js) — CLI/TUI-based configuration management system for Claude Code, published to npm
2. **APM v4** (Elixir/Phoenix) — Agentic Performance Monitor, a Phoenix LiveView web application that provides real-time agent monitoring, token tracking, D3.js dependency graphs, and a dashboard at http://localhost:3032
3. **@ccem/apm** (TypeScript) — npm client SDK for the APM server API
4. **CCEMHelper** (Swift/AppKit) — macOS menu bar helper app for agent approval UI and notifications
5. **ccem-relay** — WebSocket relay submodule

## Version
- @ccem/core: v5.0.0
- APM server (apm_v5): v9.1.1
- @ccem/apm SDK: v3.0.0

## Author
Jeremiah Pegues (pegues.io)

## Repository
https://github.com/peguesj/ccem.git
