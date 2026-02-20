/**
 * Monaco Code Editor Wrapper
 * TypeScript wrapper for Monaco editor with clean API
 */

import type {
  Monaco,
  IStandaloneCodeEditor,
  ICodeEditor,
  CodeEditorConfig,
  EditorLanguage,
  EditorTheme,
} from '../../types/monaco';
import { loadMonaco } from './MonacoLoader';

/**
 * Default editor options
 */
const DEFAULT_OPTIONS: Partial<CodeEditorConfig> = {
  language: 'typescript',
  theme: 'vs-dark',
  readOnly: false,
  lineNumbers: 'on',
  minimap: true,
  wordWrap: 'off',
  tabSize: 2,
  fontSize: 14,
  formatOnPaste: true,
  formatOnType: false,
};

/**
 * Code Editor implementation
 */
export class CodeEditor implements ICodeEditor {
  private editor: IStandaloneCodeEditor | null = null;
  private monaco: Monaco | null = null;
  private config: CodeEditorConfig;
  private isDisposed = false;

  constructor(config: CodeEditorConfig) {
    this.config = { ...DEFAULT_OPTIONS, ...config };
  }

  /**
   * Initialize the editor
   * Must be called before using the editor
   */
  async initialize(): Promise<void> {
    if (this.isDisposed) {
      throw new Error('Cannot initialize disposed editor');
    }

    if (this.editor) {
      throw new Error('Editor already initialized');
    }

    // Load Monaco
    this.monaco = await loadMonaco();

    // Create editor instance
    this.editor = this.monaco.editor.create(this.config.container, {
      value: this.config.value || '',
      language: this.config.language || 'typescript',
      theme: this.config.theme || 'vs-dark',
      readOnly: this.config.readOnly || false,
      lineNumbers: this.config.lineNumbers || 'on',
      minimap: {
        enabled: this.config.minimap !== false,
      },
      wordWrap: this.config.wordWrap || 'off',
      tabSize: this.config.tabSize || 2,
      fontSize: this.config.fontSize || 14,
      formatOnPaste: this.config.formatOnPaste !== false,
      formatOnType: this.config.formatOnType || false,
      automaticLayout: true,
      scrollBeyondLastLine: false,
      renderWhitespace: 'selection',
      rulers: [80, 120],
      folding: true,
      foldingStrategy: 'indentation',
      showFoldingControls: 'mouseover',
      matchBrackets: 'always',
      glyphMargin: true,
      lightbulb: {
        enabled: true,
      },
    });

    // Setup change listener
    if (this.config.onChange) {
      this.editor.onDidChangeModelContent((event) => {
        if (this.config.onChange && this.editor) {
          this.config.onChange(this.editor.getValue(), event);
        }
      });
    }
  }

  /**
   * Get current editor value
   */
  getValue(): string {
    if (!this.editor) {
      throw new Error('Editor not initialized');
    }
    return this.editor.getValue();
  }

  /**
   * Set editor value
   */
  setValue(value: string): void {
    if (!this.editor) {
      throw new Error('Editor not initialized');
    }
    this.editor.setValue(value);
  }

  /**
   * Set editor language
   */
  setLanguage(language: EditorLanguage): void {
    if (!this.editor || !this.monaco) {
      throw new Error('Editor not initialized');
    }

    const model = this.editor.getModel();
    if (model) {
      this.monaco.editor.setModelLanguage(model, language);
    }
  }

  /**
   * Set editor theme
   */
  setTheme(theme: EditorTheme): void {
    if (!this.monaco) {
      throw new Error('Editor not initialized');
    }
    this.monaco.editor.setTheme(theme);
  }

  /**
   * Set read-only mode
   */
  setReadOnly(readOnly: boolean): void {
    if (!this.editor) {
      throw new Error('Editor not initialized');
    }
    this.editor.updateOptions({ readOnly });
  }

  /**
   * Focus the editor
   */
  focus(): void {
    if (!this.editor) {
      throw new Error('Editor not initialized');
    }
    this.editor.focus();
  }

  /**
   * Layout the editor (call on resize)
   */
  layout(): void {
    if (!this.editor) {
      throw new Error('Editor not initialized');
    }
    this.editor.layout();
  }

  /**
   * Dispose the editor
   */
  dispose(): void {
    if (this.editor) {
      this.editor.dispose();
      this.editor = null;
    }
    this.monaco = null;
    this.isDisposed = true;
  }

  /**
   * Get underlying Monaco editor instance
   */
  getEditor(): IStandaloneCodeEditor | null {
    return this.editor;
  }

  /**
   * Get Monaco instance
   */
  getMonaco(): Monaco | null {
    return this.monaco;
  }

  /**
   * Check if editor is initialized
   */
  isInitialized(): boolean {
    return this.editor !== null;
  }

  /**
   * Set cursor position
   */
  setCursorPosition(lineNumber: number, column: number): void {
    if (!this.editor) {
      throw new Error('Editor not initialized');
    }
    this.editor.setPosition({ lineNumber, column });
    this.editor.revealLineInCenter(lineNumber);
  }

  /**
   * Get cursor position
   */
  getCursorPosition(): { lineNumber: number; column: number } | null {
    if (!this.editor) {
      throw new Error('Editor not initialized');
    }
    const position = this.editor.getPosition();
    return position ? { lineNumber: position.lineNumber, column: position.column } : null;
  }

  /**
   * Insert text at cursor
   */
  insertTextAtCursor(text: string): void {
    if (!this.editor) {
      throw new Error('Editor not initialized');
    }
    const position = this.editor.getPosition();
    if (position) {
      this.editor.executeEdits('', [
        {
          range: {
            startLineNumber: position.lineNumber,
            startColumn: position.column,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          },
          text,
        },
      ]);
    }
  }

  /**
   * Format document
   */
  async formatDocument(): Promise<void> {
    if (!this.editor) {
      throw new Error('Editor not initialized');
    }
    await this.editor.getAction('editor.action.formatDocument')?.run();
  }

  /**
   * Undo last change
   */
  undo(): void {
    if (!this.editor) {
      throw new Error('Editor not initialized');
    }
    this.editor.trigger('keyboard', 'undo', null);
  }

  /**
   * Redo last undone change
   */
  redo(): void {
    if (!this.editor) {
      throw new Error('Editor not initialized');
    }
    this.editor.trigger('keyboard', 'redo', null);
  }
}

/**
 * Create a new code editor instance
 */
export async function createCodeEditor(config: CodeEditorConfig): Promise<ICodeEditor> {
  const editor = new CodeEditor(config);
  await editor.initialize();
  return editor;
}
