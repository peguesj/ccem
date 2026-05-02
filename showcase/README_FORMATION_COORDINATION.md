# Showcase-Fleet Formation Coordination
**Project**: lily-ai-phx (v1.15.1)
**Status**: READY FOR DEPLOYMENT
**Updated**: 2026-03-30

## Quick Start

The showcase-fleet formation is fully configured. All infrastructure verified and ready.

### 3-Minute Setup
```bash
# 1. Verify infrastructure
/Users/jeremiah/Developer/ccem/showcase/QUICK_START_AGENTS.sh

# 2. Start formation
/formation deploy fmt-20260330-showcase-fleet --config /Users/jeremiah/Developer/ccem/showcase/formation-config.json

# 3. Monitor and view
open "http://localhost:3001/client/index.html?project=lily-ai-phx"
```

---

## Documentation Index

### For Agents
- **[AGENT_OUTPUT_SPEC.md](AGENT_OUTPUT_SPEC.md)** — Detailed specifications for each wave
  - File format examples for architecture reports, diagrams, narratives
  - Expected output paths and JSON structures
  - Mermaid diagram templates
  - **Read this first if you're an agent**

- **[FORMATION_AGENT_CONFIG.json](FORMATION_AGENT_CONFIG.json)** — Quick reference configuration
  - Environment variables
  - Critical paths
  - Output file mappings
  - Verification checklist
  - **Use this for consistent path handling**

### For Coordinators/Operators
- **[FORMATION_COORDINATION_SUMMARY.md](FORMATION_COORDINATION_SUMMARY.md)** — Complete operational guide
  - Architecture overview
  - Wave-by-wave execution plan
  - Data loading flow
  - Troubleshooting procedures
  - **Use this for monitoring and debugging**

- **[QUICK_START_AGENTS.sh](QUICK_START_AGENTS.sh)** — Automated verification
  - Checks all infrastructure
  - Exports environment variables
  - Provides quick test commands
  - **Run this before formation start**

### Reference Files
- **[formation-config.json](formation-config.json)** — Formation blueprint
  - 7 agents across 3 waves
  - Agent specifications and dependencies
  - APM registration settings

- **[projects.json](data/projects.json)** — Project registry
  - lily-ai-phx registered as project ID
  - Data path configured
  - Version and metadata

---

## Infrastructure Status

```
✓ HTTP Server:           port 3001 (running)
✓ APM Server:            port 3032 (running)
✓ Output Directory:      /data/projects/lily-ai-phx/ (writable)
✓ Web Symlink:           client/data -> ../data (active)
✓ APM Endpoint:          /api/showcase/lily-ai-phx (functional)
✓ Project Registration:  lily-ai-phx in projects.json
```

---

## Web Access URLs

Once formation completes, generated files are immediately accessible:

### Showcase Client (Main Interface)
```
http://localhost:3001/client/index.html?project=lily-ai-phx
```
Auto-loads all generated diagrams, features, and narratives

### Direct File Access
```
HTTP: http://localhost:3001/client/data/projects/lily-ai-phx/
APM:  http://localhost:3032/api/showcase/lily-ai-phx
```

### Diagrams (via HTTP)
```
http://localhost:3001/client/data/projects/lily-ai-phx/diagrams/
```

---

## Formation Timeline

| Phase | Duration | Agents | Status |
|-------|----------|--------|--------|
| **Wave 1** | 1-2h | 2 | Architecture analysis + narratives |
| **Wave 2** | 2-3h | 3 | Diagram generation + IP redaction |
| **Wave 3** | 30min | 2 | HTML assembly + QA validation |
| **Total** | 4-6h | 7 | **READY** |

---

## How to Use Each Document

### AGENT_OUTPUT_SPEC.md
**For**: Agents implementing formation tasks
**When**: Before work starts
**Read**:
- Find your wave and agent name
- Review expected output file paths
- Study JSON format examples
- Check verification commands

### FORMATION_AGENT_CONFIG.json
**For**: Setting up agent environment
**When**: During agent initialization
**Use to**:
- Export environment variables
- Verify output paths
- Check critical configuration
- Run verification checklist

### FORMATION_COORDINATION_SUMMARY.md
**For**: Monitoring and debugging
**When**: During and after formation
**Use to**:
- Understand data loading flow
- Troubleshoot issues
- Monitor wave progress
- Verify final outputs

### QUICK_START_AGENTS.sh
**For**: Infrastructure verification
**When**: Before formation start
**Run**: `./QUICK_START_AGENTS.sh`
**Get**:
- All-checks-passed confirmation
- Environment variable exports
- Test commands
- Troubleshooting guide

---

## Agent Output Summary

### All Output Locations
```
/Users/jeremiah/Developer/ccem/showcase/data/projects/lily-ai-phx/

Wave 1 (Discovery):
  • architecture-report.json
  • narrative-arcs.json

Wave 2 (Generation):
  • diagrams/architecture-c4-context.mmd
  • diagrams/architecture-c4-container.mmd
  • diagrams/process-flow.mmd
  • diagrams/deployment-topology.mmd
  • diagrams/user-journey.mmd
  • narrative-content.json
  • content-blocks.json
  • speaker-notes.json
  • slides.json

Wave 3 (Assembly):
  • validation-report.json
  • (optional) showcase.html, presenter.html, styles.css, showcase.js
```

### All URLs Accessible
```
Files Written     Immediately Accessible At
────────────────  ──────────────────────────────────────────────────────
diagrams/*.mmd    http://localhost:3001/client/data/projects/lily-ai-phx/diagrams/
*.json files      http://localhost:3001/client/data/projects/lily-ai-phx/
API metadata      http://localhost:3032/api/showcase/lily-ai-phx
```

---

## Key Points for Agents

1. **Output Always Goes Here**:
   ```
   /Users/jeremiah/Developer/ccem/showcase/data/projects/lily-ai-phx/
   ```

2. **Use Environment Variables** (don't hardcode paths):
   ```
   $OUTPUT_BASE = /Users/jeremiah/Developer/ccem/showcase/data/projects/lily-ai-phx
   $DIAGRAMS_PATH = /Users/jeremiah/Developer/ccem/showcase/data/projects/lily-ai-phx/diagrams
   ```

3. **Files Are Immediately Accessible**:
   - Write to disk → Instantly available at HTTP URL
   - No file moves or manual deployment needed

4. **APM Integration Automatic**:
   - Files written to disk are automatically served by APM
   - APM endpoint returns all project data as JSON

5. **HTML Client Auto-Loads**:
   - Client at `http://localhost:3001/client/index.html?project=lily-ai-phx`
   - Auto-detects project from URL parameter
   - Loads all data without additional configuration

---

## Verification Before Starting

Run this command to verify all infrastructure:

```bash
/Users/jeremiah/Developer/ccem/showcase/QUICK_START_AGENTS.sh
```

All 6 checks should PASS:
- [ ] HTTP server running on port 3001
- [ ] APM server running at http://localhost:3032
- [ ] Output directory exists and writable
- [ ] Web symlink active
- [ ] APM showcase endpoint functional
- [ ] Project registration complete

---

## Starting the Formation

```bash
/formation deploy fmt-20260330-showcase-fleet --config /Users/jeremiah/Developer/ccem/showcase/formation-config.json
```

Formation will execute in 3 waves with 7 total agents.

---

## Monitoring During Formation

### Watch Wave Outputs
```bash
# Wave 1
ls -la /Users/jeremiah/Developer/ccem/showcase/data/projects/lily-ai-phx/architecture-report.json

# Wave 2
ls -la /Users/jeremiah/Developer/ccem/showcase/data/projects/lily-ai-phx/diagrams/

# Wave 3
ls -la /Users/jeremiah/Developer/ccem/showcase/data/projects/lily-ai-phx/validation-report.json
```

### View in Browser
```
http://localhost:3001/client/index.html?project=lily-ai-phx
```
Refreshes automatically as files are added.

---

## Troubleshooting

**Problem**: Files not accessible at HTTP URL
- Check: `ls -la /Users/jeremiah/Developer/ccem/showcase/data/projects/lily-ai-phx/`
- Check: `lsof -ti:3001` (HTTP server running?)
- Fix: `curl http://localhost:3001/client/data/projects/lily-ai-phx/`

**Problem**: APM endpoint empty
- Check: `curl http://localhost:3032/api/status`
- Check: Do files exist on disk?
- Fix: Post test event manually

**Problem**: Port conflicts
- Check: `lsof -ti:3001` and `lsof -ti:3032`
- Never use port 3031 (zombie processes)

**Problem**: Diagrams not rendering
- Check: Mermaid syntax in .mmd files
- Check: Browser console for errors
- Validate: https://mermaid-js.github.io/

---

## File Locations

All coordination files are in:
```
/Users/jeremiah/Developer/ccem/showcase/
├── FORMATION_AGENT_CONFIG.json          (agent config)
├── AGENT_OUTPUT_SPEC.md                 (detailed specs)
├── QUICK_START_AGENTS.sh                (verification script)
├── FORMATION_COORDINATION_SUMMARY.md     (full guide)
├── README_FORMATION_COORDINATION.md      (this file)
├── formation-config.json                (formation blueprint)
├── data/
│   ├── projects.json                    (project registry)
│   └── projects/lily-ai-phx/            (output directory)
└── client/
    └── index.html                       (showcase client)
```

---

## Support

For detailed information, see:
- **Formation Details**: FORMATION_COORDINATION_SUMMARY.md
- **Agent Specs**: AGENT_OUTPUT_SPEC.md
- **Agent Config**: FORMATION_AGENT_CONFIG.json
- **Quick Help**: QUICK_START_AGENTS.sh

---

**Status**: READY FOR DEPLOYMENT
**All Infrastructure**: VERIFIED (6/6 checks passing)
**Last Updated**: 2026-03-30T03:00:00Z
