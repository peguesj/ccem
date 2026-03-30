# Showcase-Fleet Formation Coordination Summary
**Updated**: 2026-03-30T03:00:00Z
**Project**: lily-ai-phx (v1.15.1)
**Formation**: fmt-20260330-showcase-fleet

## Executive Summary

The showcase-fleet formation is fully configured and ready to deploy. All infrastructure is in place and verified:

- HTTP web server running on port 3001 ✓
- APM running on port 3032 ✓
- Project data directory configured ✓
- Web symlink active ✓
- Output paths writable ✓

**Status**: READY FOR FORMATION START

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Showcase-Fleet Formation                    │
└─────────────────────────────────────────────────────────────────┘
                                                                   
     Wave 1: Discovery               Wave 2: Generation
     ─────────────────              ─────────────────
     ┌──────────────┐                ┌──────────────┐
     │Codebase      │                │Diagram       │
     │Analyst       │──────┐  ┌─────▶│Renderer      │
     └──────────────┘      │  │      └──────────────┘
                           │  │
     ┌──────────────┐      │  │      ┌──────────────┐
     │Narrative     │      │  │      │Redaction     │
     │Architect     │──────┼──┼─────▶│Engine        │
     └──────────────┘      │  │      └──────────────┘
                           │  │
                           │  │      ┌──────────────┐
                           │  └─────▶│Content       │
                           │         │Composer      │
                           │         └──────────────┘
                           │                │
                           │                ▼
                      Wave 3: Assembly
                      ────────────────
                           │         ┌──────────────┐
                           └────────▶│UI Builder    │
                                     └──────────────┘
                                              │
                                              ▼
                                     ┌──────────────┐
                                     │QA Validator  │
                                     └──────────────┘
                                              │
                                              ▼
                     /Users/jeremiah/Developer/ccem/showcase/
                     data/projects/lily-ai-phx/
                                              │
                          ┌────────┬──────────┤
                          ▼        ▼          ▼
                    Features    Diagrams   Narratives
                    JSONs       (*.mmd)    + Content
```

---

## Critical Paths & Configuration

### Output Location
```
Base Path: /Users/jeremiah/Developer/ccem/showcase/data/projects/lily-ai-phx
Diagrams:  /Users/jeremiah/Developer/ccem/showcase/data/projects/lily-ai-phx/diagrams
Web Root:  /Users/jeremiah/Developer/ccem/showcase/client
```

### Web Access
```
HTTP Server: http://localhost:3001 (port 3001, Python http.server)
Web Symlink: /client/data -> ../data (verified)
Client URL:  http://localhost:3001/client/index.html?project=lily-ai-phx
```

### APM Integration
```
APM Server:   http://localhost:3032 (port 3032, NOT 3031)
Showcase API: GET http://localhost:3032/api/showcase/lily-ai-phx
```

---

## Formation Waves

### Wave 1: Discovery Squadron (1-2 hours)

**Purpose**: Analyze architecture and build narratives

**Agents**:
- **Codebase Analyst** (w1-codebase-analyst)
  - Scans `/Users/jeremiah/Developer/lily-ai-phx`
  - Outputs: `architecture-report.json`
  - Focus: C4 Context + Container diagrams, service boundaries, data flows

- **Narrative Architect** (w1-narrative-architect)
  - Builds investor/partner/demo story arcs
  - Outputs: `narrative-arcs.json`
  - Frameworks: Geoffrey Moore positioning, Amazon Working Backwards, storyboard

**Output Files**:
```
/data/projects/lily-ai-phx/architecture-report.json
/data/projects/lily-ai-phx/narrative-arcs.json
```

**Verification**:
```bash
curl http://localhost:3032/api/showcase/lily-ai-phx | python3 -m json.tool
```

---

### Wave 2: Generation Squadron (2-3 hours)

**Purpose**: Generate diagrams, redact for IP protection, compose narratives

**Agents**:
- **Diagram Renderer** (w2-diagram-renderer)
  - Generates Mermaid diagrams from architecture report
  - Outputs: 5 .mmd files (C4 Context, Container, Process Flow, Deployment, Journey)

- **Redaction Engine** (w2-redaction-engine)
  - Applies IP protection rules
  - Anonymizes service names, tech stack, metrics per audience level
  - Validates no leakage

- **Content Composer** (w2-content-composer)
  - Writes narrative blocks, speaker notes, slide content
  - Outputs: JSON files with narrative, speaker notes, slides

**Output Files**:
```
/data/projects/lily-ai-phx/diagrams/architecture-c4-context.mmd
/data/projects/lily-ai-phx/diagrams/architecture-c4-container.mmd
/data/projects/lily-ai-phx/diagrams/process-flow.mmd
/data/projects/lily-ai-phx/diagrams/deployment-topology.mmd
/data/projects/lily-ai-phx/diagrams/user-journey.mmd
/data/projects/lily-ai-phx/narrative-content.json
/data/projects/lily-ai-phx/content-blocks.json
/data/projects/lily-ai-phx/speaker-notes.json
/data/projects/lily-ai-phx/slides.json
```

**Immediate Web Access**:
```
http://localhost:3001/client/data/projects/lily-ai-phx/diagrams/architecture-c4-context.mmd
http://localhost:3001/client/data/projects/lily-ai-phx/narrative-content.json
```

---

### Wave 3: Presentation Squadron (30 min)

**Purpose**: Assemble HTML showcase and validate IP safety

**Agents**:
- **UI Builder** (w3-ui-builder)
  - Assembles glassmorphism HTML with Mermaid rendering
  - Outputs: HTML, CSS, JS (optional; main client already exists)

- **QA Validator** (w3-qa-validator)
  - Runs IP leakage checks
  - Validates diagram accuracy
  - Outputs: validation-report.json

**Output Files**:
```
/data/projects/lily-ai-phx/validation-report.json
/data/projects/lily-ai-phx/showcase.html (optional)
/data/projects/lily-ai-phx/presenter.html (optional)
/data/projects/lily-ai-phx/styles.css (optional)
/data/projects/lily-ai-phx/showcase.js (optional)
```

**Final Verification**:
```bash
# Showcase client loads all data
open http://localhost:3001/client/index.html?project=lily-ai-phx

# Validation report available
curl http://localhost:3001/client/data/projects/lily-ai-phx/validation-report.json
```

---

## Data Loading Flow

The showcase client automatically handles data loading in this priority order:

### 1. APM API (Primary)
```
GET http://localhost:3032/api/showcase/lily-ai-phx
Returns: features, narratives, design_system, speaker_notes, slides, redaction_rules
```

### 2. Local Project Files (Fallback)
```
/data/projects/lily-ai-phx/features.json (already exists with 8 features)
/data/projects/lily-ai-phx/narrative-content.json (generated by Wave 2)
/data/projects/lily-ai-phx/diagram-design-system.json (design tokens)
```

### 3. Default Files (Last Resort)
```
/data/features.json (generic defaults)
/data/narrative-content.json (defaults)
```

**No additional configuration needed** — the client handles all loading automatically based on the `?project=lily-ai-phx` URL parameter.

---

## Environment Variables for Agents

All agents should be configured with these environment variables:

```bash
export PROJECT_ID="lily-ai-phx"
export OUTPUT_BASE="/Users/jeremiah/Developer/ccem/showcase/data/projects/lily-ai-phx"
export DIAGRAMS_PATH="/Users/jeremiah/Developer/ccem/showcase/data/projects/lily-ai-phx/diagrams"
export APM_BASE_URL="http://localhost:3032"
export WEB_PORT="3001"
export WEB_HOST="http://localhost:3001"
export PROJECT_REPO="/Users/jeremiah/Developer/lily-ai-phx"
export PROJECT_VERSION="1.15.1"
```

---

## Quick Verification Commands

Before and after formation deployment, use these commands to verify setup:

```bash
# 1. Check HTTP server
lsof -ti:3001

# 2. Check APM server
curl http://localhost:3032/api/status

# 3. Check project data directory
ls -la /Users/jeremiah/Developer/ccem/showcase/data/projects/lily-ai-phx/

# 4. Check output path is writable
touch /Users/jeremiah/Developer/ccem/showcase/data/projects/lily-ai-phx/.write-test && rm $_

# 5. Check web symlink
ls -la /Users/jeremiah/Developer/ccem/showcase/client/data

# 6. Test HTTP file access
curl http://localhost:3001/client/data/projects/lily-ai-phx/features.json | head

# 7. Test APM endpoint
curl http://localhost:3032/api/showcase/lily-ai-phx | python3 -m json.tool | head

# 8. Open showcase client
open "http://localhost:3001/client/index.html?project=lily-ai-phx"
```

---

## Troubleshooting Guide

### Issue: Files not accessible at HTTP URL
**Cause**: Agent wrote to wrong path or HTTP server issue
**Solution**:
1. Verify agent output path: `ls -la /Users/jeremiah/Developer/ccem/showcase/data/projects/lily-ai-phx/`
2. Check HTTP server: `lsof -ti:3001`
3. Refresh browser: Cmd+Shift+R
4. Test direct URL: `curl http://localhost:3001/client/data/projects/lily-ai-phx/features.json`

### Issue: APM endpoint returns empty data
**Cause**: Agents didn't populate APM intake or local files
**Solution**:
1. Check APM is running: `curl http://localhost:3032/api/status`
2. Verify local files exist: `ls -la /Users/jeremiah/Developer/ccem/showcase/data/projects/lily-ai-phx/`
3. Check agent logs for write errors
4. Test APM manually: `curl -X POST http://localhost:3032/api/intake -d '{"source":"test"}'`

### Issue: Port conflict
**Cause**: Another process using port 3001 or 3032
**Solution**:
```bash
# Port 3001
lsof -ti:3001 | xargs kill -9
cd /Users/jeremiah/Developer/ccem/showcase
python3 -m http.server 3001 &

# Port 3032
# Check CCEM APM status — do NOT kill if in use
lsof -ti:3032
```

### Issue: Diagram files not rendering in client
**Cause**: Mermaid diagrams malformed or not loading
**Solution**:
1. Verify diagram file exists: `ls -la /Users/jeremiah/Developer/ccem/showcase/data/projects/lily-ai-phx/diagrams/`
2. Check file format: `head -5 architecture-c4-context.mmd`
3. Check browser console for rendering errors
4. Validate Mermaid syntax: https://mermaid-js.github.io/mermaid/#/

---

## Formation Start Command

Once all verifications pass, start the formation with:

```bash
/formation deploy fmt-20260330-showcase-fleet --config /Users/jeremiah/Developer/ccem/showcase/formation-config.json
```

The formation will execute 3 sequential waves with concurrent agents within each wave.

---

## Expected Timeline

| Wave | Duration | Agents | Output |
|------|----------|--------|--------|
| 1 | 1-2 hours | 2 | Architecture report, narrative arcs |
| 2 | 2-3 hours | 3 | 5 Mermaid diagrams, content JSON files |
| 3 | 30 min | 2 | Validation report, optional HTML |
| **Total** | **4-6 hours** | **7** | **All files immediately accessible** |

---

## Post-Formation Verification

After formation completes, verify output:

```bash
# 1. Check all expected files exist
ls -la /Users/jeremiah/Developer/ccem/showcase/data/projects/lily-ai-phx/

# 2. Verify diagrams directory populated
ls -la /Users/jeremiah/Developer/ccem/showcase/data/projects/lily-ai-phx/diagrams/

# 3. Test web access
curl -I http://localhost:3001/client/data/projects/lily-ai-phx/diagrams/architecture-c4-context.mmd

# 4. Test APM endpoint
curl http://localhost:3032/api/showcase/lily-ai-phx | python3 -m json.tool

# 5. Open showcase in browser
open "http://localhost:3001/client/index.html?project=lily-ai-phx"
```

---

## Files Created for Formation Coordination

This task created the following coordination documents:

1. **FORMATION_AGENT_CONFIG.json**
   - Critical paths, web URLs, environment variables
   - Quick reference for agents
   - Verification checklist

2. **AGENT_OUTPUT_SPEC.md**
   - Detailed file format specifications for each agent
   - Example JSON structures
   - Mermaid diagram templates
   - Immediate access pattern documentation

3. **QUICK_START_AGENTS.sh**
   - Automated verification script (all checks passed ✓)
   - Environment variable setup
   - Quick test commands
   - Troubleshooting guide

4. **FORMATION_COORDINATION_SUMMARY.md** (this file)
   - Architecture overview
   - Wave-by-wave execution plan
   - Data loading flow
   - Complete troubleshooting guide

---

## Key Takeaways for Agents

1. **Output Location**: All files go to `/Users/jeremiah/Developer/ccem/showcase/data/projects/lily-ai-phx/`
2. **Immediate Access**: Once written, files are instantly accessible at `http://localhost:3001/client/data/projects/lily-ai-phx/`
3. **APM Integration**: APM endpoint at `http://localhost:3032/api/showcase/lily-ai-phx` serves all data
4. **No Configuration Needed**: HTML client auto-loads data based on `?project=lily-ai-phx` URL parameter
5. **Environment Variables**: Use provided ENV vars for consistent path handling

---

**Status**: READY TO DEPLOY
**Last Verified**: 2026-03-30T03:00:00Z
**All Checks Passing**: ✓ (HTTP server, APM, directories, symlinks, endpoints)
