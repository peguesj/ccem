/**
 * CCEM-UI Components
 * Centralized export for all UI components
 */

// Router
export { Router } from './Router';
export type {
  RouteConfig,
  RouteMatch,
  CurrentRoute,
  RouteChangeDetail,
  NotFoundDetail,
  RouteHandler,
} from './Router';

// Navigation
export { Navigation } from './Navigation';
export type { NavigationEventDetail } from './Navigation';

// AgentCard
export { AgentCard } from './AgentCard';
export type { Agent, AgentStatus, AgentClickHandler } from './AgentCard';

// ChatCard
export { ChatCard } from './ChatCard';
export type { Chat, ChatMessage, ChatClickHandler } from './ChatCard';

// CommandPalette
export { CommandPalette } from './CommandPalette';
export type {
  CommandItem,
  CommandCategory,
  CommandExecuteHandler,
} from './CommandPalette';

// Terminal
export { Terminal } from './Terminal';
export type { LogLevel, LogEntry } from './Terminal';

// Editor
export {
  monacoLoader,
  loadMonaco,
  getMonacoState,
  isMonacoReady,
  CodeEditor,
  createCodeEditor,
  DiffEditor,
  createDiffEditor,
  calculateDiffStats,
} from './editor';
export type {
  Monaco,
  IStandaloneCodeEditor,
  IStandaloneDiffEditor,
  ITextModel,
  IModelContentChangedEvent,
  EditorLanguage,
  EditorTheme,
  CodeEditorConfig,
  DiffEditorConfig,
  MonacoLoaderState,
  ICodeEditor,
  IDiffEditor,
  ILineChange,
  DiffStats,
} from './editor';

// Default exports
export { default as RouterDefault } from './Router';
export { default as NavigationDefault } from './Navigation';
export { default as AgentCardDefault } from './AgentCard';
export { default as ChatCardDefault } from './ChatCard';
export { default as CommandPaletteDefault } from './CommandPalette';
export { default as TerminalDefault } from './Terminal';
