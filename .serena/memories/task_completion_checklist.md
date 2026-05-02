# Task Completion Checklist

Before marking any task complete, run the appropriate checks:

## Elixir (APM v4) changes
1. `cd ~/Developer/ccem/apm-v4 && mix compile --warnings-as-errors` — MUST pass
2. `cd ~/Developer/ccem/apm-v4 && mix format --check-formatted` — code formatted
3. `cd ~/Developer/ccem/apm-v4 && mix test` — all tests pass
4. If CCEMHelper was changed: `cd ~/Developer/ccem/CCEMHelper && swift build -c release`

## TypeScript changes
1. `npx tsc --noEmit` — type check passes
2. `npm test` — all tests pass
3. `npm run lint` — no lint errors

## @ccem/apm SDK changes
1. `cd packages/apm && npx tsc --noEmit`
2. `cd packages/apm && npm test`

## General
- Build first, then test
- Check for running dev servers before starting new ones: `lsof -ti:3000,3001,3002,3032`
- Never commit .env files or secrets
