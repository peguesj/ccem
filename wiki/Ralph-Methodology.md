# Ralph Methodology

Ralph is the autonomous agent methodology used within CCEM for PRD-driven development. A Ralph agent reads a structured PRD (Product Requirements Document) in JSON format, implements each user story in priority order, validates the implementation through automated checks, and commits the result -- all without human intervention.

## How Ralph Works

### The PRD File (prd.json)

Every Ralph-driven project has a `prd.json` file that defines the work to be done:

```json
{
  "project": "Project Name",
  "branchName": "ralph/feature-branch",
  "description": "What this work achieves",
  "userStories": [
    {
      "id": "US-001",
      "title": "Feature title",
      "description": "Full description of the user story",
      "acceptanceCriteria": [
        "Criterion 1",
        "Criterion 2"
      ],
      "priority": 1,
      "passes": false,
      "module": "optional module name",
      "namespace": "optional namespace",
      "notes": ""
    }
  ]
}
```

Key fields:
- **priority**: Determines implementation order (lowest number first)
- **passes**: Boolean indicating whether the story's acceptance criteria are met. Ralph sets this to `true` after successful implementation.
- **acceptanceCriteria**: The specific conditions that must be satisfied for the story to pass.

### The Ralph Execution Cycle

Each iteration of a Ralph agent follows this exact sequence:

1. **Read** `prd.json` and `progress.txt`
2. **Checkout** the branch specified in `branchName`
3. **Find** the highest-priority story where `passes: false`
4. **Implement** that single story completely (write code, create files, wire everything up)
5. **Run quality checks** (e.g., `mix compile --warnings-as-errors` and `mix test` for Elixir, or `npm test` and `npx tsc --noEmit` for TypeScript)
6. **If checks pass**: Commit with message `feat: [Story ID] - [Story Title]`
7. **Update** `prd.json` to set the story's `passes: true`
8. **Append** progress to `progress.txt` documenting what was done, files changed, and learnings
9. **Stop** (one story per iteration)

### Stop Condition

When all stories have `passes: true`, the Ralph agent responds with:
```
<promise>COMPLETE</promise>
```

### Progress Tracking

The `progress.txt` file accumulates a record of each completed story:

```
## US-013 - ConfigLoader GenServer for apm_config.json
- Implemented ConfigLoader GenServer at lib/apm_v4/config_loader.ex
- Added to supervision tree
- 8 test cases passing
- Files: lib/apm_v4/config_loader.ex, test/apm_v4/config_loader_test.exs
- Learning: ETS table must be named for cross-process access
---
```

## Ralph and CCEM APM

The APM dashboard provides real-time visibility into Ralph's progress through two mechanisms:

### Ralph Panel (Dashboard)

The right-panel "Ralph" tab displays:
- Project name and branch
- Progress bar (passed stories / total stories)
- Story list with pass/fail badges, titles, priority, module, and notes
- Flowchart view with D3.js visualization (green nodes = passed, red = failed, edges show linear story progression)

### Ralph API Endpoints

```bash
# Get Ralph data for the active project
curl http://localhost:3031/api/ralph

# Get D3.js flowchart data
curl http://localhost:3031/api/ralph/flowchart
```

The API reads the `prd_json` path from the project's configuration in `apm_config.json`. When a Ralph agent updates `prd.json` (setting `passes: true`), the next dashboard refresh reflects the change.

## Setting Up Ralph for a Project

### 1. Create the PRD

Create a `prd.json` file in your project root (or at `.claude/ralph/prd.json`):

```json
{
  "project": "My Project",
  "branchName": "ralph/my-feature",
  "description": "Implement the widget system",
  "userStories": [
    {
      "id": "US-001",
      "title": "Widget data model",
      "description": "Create the core widget data types and validation",
      "acceptanceCriteria": [
        "Widget type defined with required fields",
        "Zod schema for validation",
        "Unit tests pass"
      ],
      "priority": 1,
      "passes": false
    },
    {
      "id": "US-002",
      "title": "Widget CRUD operations",
      "description": "Implement create, read, update, delete for widgets",
      "acceptanceCriteria": [
        "All CRUD functions implemented",
        "Error handling for invalid input",
        "Integration tests pass"
      ],
      "priority": 2,
      "passes": false
    }
  ]
}
```

### 2. Create the Progress File

Create an empty `progress.txt`:

```bash
touch progress.txt
```

### 3. Configure the CLAUDE.md

Add a project-level `.claude/CLAUDE.md` (or include in the project root's CLAUDE.md) with the Ralph workflow instructions. The key instruction is that the agent must read `prd.json`, find the highest-priority incomplete story, implement it, run quality checks, commit, and update the PRD.

### 4. Register with APM

If the `prd.json` path is set in `apm_config.json` (either automatically by `session_init.sh` if the file exists at `.claude/ralph/prd.json`, or manually), the APM dashboard will display Ralph progress.

### 5. Run

Launch a Claude Code session in the project directory. The Ralph agent will begin executing the workflow automatically based on the CLAUDE.md instructions.

## Real-World Example: APM v4

The APM v4 Phoenix application was built entirely by Ralph agents. The `prd.json` at `/Users/jeremiah/Developer/ccem/apm-v4/prd.json` defined 19 user stories covering:

- GenServer architecture (ConfigLoader, ProjectStore, AgentDiscovery, EnvironmentScanner, CommandRunner)
- REST API endpoints (19 v3-compatible + v4-only endpoints)
- LiveView dashboard components
- Hook integration (session_init.sh, LFG state.sh)
- V3 backward-compatibility test suite (233 tests)

All 19 stories were implemented autonomously, each passing compilation and test checks before being committed. The total effort produced a production-ready Phoenix application that serves as the replacement for the Python v3 APM server.

## Design Principles

1. **One story per iteration**: Keeps commits atomic and reversible. Each commit corresponds to exactly one user story.

2. **Quality gates before progress**: The story is only marked as passing after compilation and tests succeed. This prevents cascading failures.

3. **Priority ordering**: Stories are implemented in priority order, allowing dependencies to be naturally resolved (earlier stories create the foundations that later stories build on).

4. **Self-documenting**: The combination of `prd.json` (what to build), `progress.txt` (what was built), and git history (how it was built) creates comprehensive documentation as a side effect of development.

5. **Observable**: The APM dashboard provides real-time visibility into which stories are complete, making it easy to track progress and identify blockers.
