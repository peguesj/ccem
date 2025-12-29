/**
 * Monaco Editor Type Definitions
 * Augments monaco-editor types for CCEM usage
 */

import type * as monaco from 'monaco-editor';

declare global {
  interface Window {
    monaco?: typeof monaco;
  }
}

export type Monaco = typeof monaco;
export type IStandaloneCodeEditor = monaco.editor.IStandaloneCodeEditor;
export type IStandaloneDiffEditor = monaco.editor.IStandaloneDiffEditor;
export type ITextModel = monaco.editor.ITextModel;
export type IModelContentChangedEvent = monaco.editor.IModelContentChangedEvent;

/**
 * Supported editor languages
 */
export type EditorLanguage =
  | 'typescript'
  | 'javascript'
  | 'json'
  | 'markdown'
  | 'yaml'
  | 'html'
  | 'css'
  | 'shell'
  | 'plaintext';

/**
 * Editor theme options
 */
export type EditorTheme = 'vs-dark' | 'vs-light' | 'hc-black';

/**
 * Code editor configuration
 */
export interface CodeEditorConfig {
  /** Container element to mount editor */
  container: HTMLElement;
  /** Initial content */
  value?: string;
  /** Programming language */
  language?: EditorLanguage;
  /** Editor theme */
  theme?: EditorTheme;
  /** Read-only mode */
  readOnly?: boolean;
  /** Show line numbers */
  lineNumbers?: 'on' | 'off' | 'relative';
  /** Enable minimap */
  minimap?: boolean;
  /** Word wrap */
  wordWrap?: 'on' | 'off' | 'wordWrapColumn' | 'bounded';
  /** Tab size */
  tabSize?: number;
  /** Font size */
  fontSize?: number;
  /** Auto-format on paste */
  formatOnPaste?: boolean;
  /** Auto-format on type */
  formatOnType?: boolean;
  /** Callback when content changes */
  onChange?: (value: string, event: IModelContentChangedEvent) => void;
}

/**
 * Diff editor configuration
 */
export interface DiffEditorConfig {
  /** Container element to mount editor */
  container: HTMLElement;
  /** Original content */
  original: string;
  /** Modified content */
  modified: string;
  /** Programming language */
  language?: EditorLanguage;
  /** Editor theme */
  theme?: EditorTheme;
  /** Read-only mode */
  readOnly?: boolean;
  /** Render side-by-side */
  renderSideBySide?: boolean;
  /** Show line numbers */
  lineNumbers?: 'on' | 'off' | 'relative';
  /** Enable minimap */
  minimap?: boolean;
  /** Original file path (for display) */
  originalPath?: string;
  /** Modified file path (for display) */
  modifiedPath?: string;
}

/**
 * Monaco loader state
 */
export interface MonacoLoaderState {
  /** Loading status */
  status: 'idle' | 'loading' | 'loaded' | 'error';
  /** Monaco instance (when loaded) */
  monaco?: Monaco;
  /** Error message (if failed) */
  error?: Error;
}

/**
 * Editor instance interface
 */
export interface ICodeEditor {
  /** Get current value */
  getValue(): string;
  /** Set value */
  setValue(value: string): void;
  /** Set language */
  setLanguage(language: EditorLanguage): void;
  /** Set theme */
  setTheme(theme: EditorTheme): void;
  /** Set read-only */
  setReadOnly(readOnly: boolean): void;
  /** Focus editor */
  focus(): void;
  /** Layout editor (call on resize) */
  layout(): void;
  /** Dispose editor */
  dispose(): void;
  /** Get underlying Monaco editor instance */
  getEditor(): IStandaloneCodeEditor | null;
}

/**
 * Diff editor instance interface
 */
export interface IDiffEditor {
  /** Get original value */
  getOriginalValue(): string;
  /** Get modified value */
  getModifiedValue(): string;
  /** Set original value */
  setOriginalValue(value: string): void;
  /** Set modified value */
  setModifiedValue(value: string): void;
  /** Set language */
  setLanguage(language: EditorLanguage): void;
  /** Set theme */
  setTheme(theme: EditorTheme): void;
  /** Get line changes */
  getLineChanges(): ILineChange[];
  /** Layout editor (call on resize) */
  layout(): void;
  /** Dispose editor */
  dispose(): void;
  /** Get underlying Monaco diff editor instance */
  getEditor(): IStandaloneDiffEditor | null;
}

/**
 * Line change in diff editor
 */
export interface ILineChange {
  /** Original start line */
  originalStartLineNumber: number;
  /** Original end line */
  originalEndLineNumber: number;
  /** Modified start line */
  modifiedStartLineNumber: number;
  /** Modified end line */
  modifiedEndLineNumber: number;
}

/**
 * Editor stats for diff
 */
export interface DiffStats {
  /** Number of additions */
  additions: number;
  /** Number of deletions */
  deletions: number;
  /** Total changes */
  total: number;
}
