# Code Style and Conventions

## Elixir (APM v4)
- **Formatter**: `mix format` with Phoenix LiveView HTML formatter plugin
- **Linter**: Credo (`mix credo`) + Sobelow for security
- **Naming**: Standard Elixir conventions — snake_case for functions/variables, CamelCase for modules
- **Module prefix**: `ApmV5.` for business logic, `ApmV5Web.` for web layer
- **Plugin system**: Modules implement `ApmV5.Plugins.PluginBehaviour` with scopes like `:security`, `:memory`, `:orchestration`
- **GenServers**: ETS-backed stores (e.g., WidgetConfigStore, ObservationCache, LayoutStore)
- **PubSub**: Phoenix.PubSub for real-time updates between LiveView components
- **LiveView**: Phoenix LiveView with function components in `ApmV5Web.Components`
- **Tests**: ExUnit with tags for filtering (`:memory`, `:orchestration`, `:widgetization`)

## TypeScript (@ccem/core, @ccem/apm)
- **Strict typing**: Always, never use `any` without justification
- **Validation**: Zod schemas for runtime type validation
- **Module system**: ESM (`"type": "module"`)
- **Testing**: Jest for core, Vitest for @ccem/apm SDK
- **Formatting**: Prettier
- **Linting**: ESLint with @typescript-eslint

## Swift (CCEMHelper)
- Standard Swift/AppKit conventions for macOS menu bar app

## General
- No emojis in code unless explicitly requested
- Prefer editing existing files over creating new ones
- `mix compile --warnings-as-errors` is a required gate before marking Elixir work complete
- `npx tsc --noEmit` required before marking TypeScript work complete
