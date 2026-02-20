/**
 * Monaco Editor Components
 * Exports all editor-related components and utilities
 */

// Loader
export {
  monacoLoader,
  loadMonaco,
  getMonacoState,
  isMonacoReady,
} from './MonacoLoader';

// Code Editor
export {
  CodeEditor,
  createCodeEditor,
} from './CodeEditor';

// Diff Editor
export {
  DiffEditor,
  createDiffEditor,
  calculateDiffStats,
} from './DiffEditor';

// Types (re-export for convenience)
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
} from '../../types/monaco';
