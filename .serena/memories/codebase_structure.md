# Codebase Structure

```
ccem/
├── src/                          # @ccem/core TypeScript source
│   ├── cli.ts                    # CLI entry point
│   ├── index.ts                  # Library entry point
│   ├── cli/                      # CLI command handlers
│   ├── config/                   # Configuration management
│   ├── hooks/                    # Hook system
│   ├── merge/                    # Merge logic
│   ├── fork/                     # Fork logic
│   ├── schema/                   # JSON schemas
│   ├── tui/                      # Terminal UI (Ink/React)
│   ├── types/                    # TypeScript type definitions
│   └── utils/                    # Utilities
├── packages/
│   └── apm/                      # @ccem/apm npm SDK (TypeScript)
│       └── src/
│           ├── client.ts         # API client
│           └── types/            # Zod schemas
├── apm-v4/                       # APM Phoenix server (Elixir)
│   ├── lib/
│   │   ├── apm_v5/               # Business logic
│   │   │   ├── plugins/          # Plugin system (security, memory, orchestration)
│   │   │   ├── auth/             # Authorization & sessions
│   │   │   ├── integrations/     # External integrations (claude-mem, etc.)
│   │   │   ├── orchestration/    # DAG-based orchestration engine
│   │   │   ├── coalesce/         # Skill coalescing
│   │   │   ├── upm/              # Unified Project Management
│   │   │   ├── ag_ui/            # AG-UI protocol
│   │   │   └── ...               # GenServers, stores, registries
│   │   └── apm_v5_web/           # Phoenix web layer
│   │       ├── router.ex         # Routes
│   │       ├── live/             # LiveView modules
│   │       ├── controllers/      # REST API controllers
│   │       ├── components/       # Function components
│   │       └── channels/         # WebSocket channels
│   ├── config/                   # Mix config (dev, test, prod, runtime)
│   ├── test/                     # ExUnit tests
│   ├── priv/static/              # Static assets
│   └── assets/                   # JS/CSS source (esbuild + tailwind)
├── CCEMHelper/                   # macOS Swift menu bar app
├── ccem-relay/                   # WebSocket relay (submodule)
├── showcase/                     # Showcase data & viewer
├── apm/                          # APM config, hooks, sessions
├── scripts/                      # Build/deploy scripts
└── docs/                         # Documentation
```

## Key architectural patterns
- **Plugin system**: `PluginBehaviour` with scoped atoms (`:security`, `:memory`, `:orchestration`)
- **ETS stores**: GenServers backed by ETS for in-memory state
- **PubSub**: Phoenix.PubSub for real-time LiveView updates
- **REST API**: `/api/v2/*` endpoints with OpenAPI 3.0.3 spec
- **WebSocket**: Phoenix Channels for live updates
- **AG-UI**: Agent-UI protocol integration
