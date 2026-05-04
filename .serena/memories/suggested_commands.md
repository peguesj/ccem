# Suggested Commands

## APM Server (Elixir/Phoenix) — from `apm-v4/`
```bash
# Start dev server
cd ~/Developer/ccem/apm-v4 && mix phx.server

# Compile with warnings-as-errors (required gate)
cd ~/Developer/ccem/apm-v4 && mix compile --warnings-as-errors

# Run all tests
cd ~/Developer/ccem/apm-v4 && mix test

# Run tagged tests
cd ~/Developer/ccem/apm-v4 && mix test --only memory
cd ~/Developer/ccem/apm-v4 && mix test --only orchestration
cd ~/Developer/ccem/apm-v4 && mix test --only widgetization

# Format code
cd ~/Developer/ccem/apm-v4 && mix format

# Lint
cd ~/Developer/ccem/apm-v4 && mix credo
cd ~/Developer/ccem/apm-v4 && mix sobelow

# Full precommit check
cd ~/Developer/ccem/apm-v4 && mix precommit

# Install deps
cd ~/Developer/ccem/apm-v4 && mix deps.get

# Build assets
cd ~/Developer/ccem/apm-v4 && mix assets.build
```

## @ccem/core (TypeScript) — from project root
```bash
npm test              # Jest tests
npm run build         # TypeScript compile
npm run typecheck     # tsc --noEmit
npm run lint          # ESLint
npm run format        # Prettier
```

## @ccem/apm SDK — from `packages/apm/`
```bash
cd packages/apm && npm test    # Vitest tests
cd packages/apm && npm run build
```

## CCEMHelper (Swift) — from `CCEMHelper/`
```bash
cd ~/Developer/ccem/CCEMHelper && swift build -c release
open -a CCEMHelper
```

## Utilities
```bash
# Kill APM server
lsof -ti:3032 | xargs kill -9 2>/dev/null

# Check server status
curl -s http://localhost:3032/api/health | python3 -m json.tool

# OpenAPI spec
curl -s http://localhost:3032/api/v2/openapi.json | python3 -m json.tool
```
