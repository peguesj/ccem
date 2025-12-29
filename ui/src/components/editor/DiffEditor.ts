/**
 * Monaco Diff Editor Wrapper
 * Side-by-side diff viewer with change tracking
 */

import type {
  Monaco,
  IStandaloneDiffEditor,
  IDiffEditor,
  DiffEditorConfig,
  EditorLanguage,
  EditorTheme,
  ILineChange,
  DiffStats,
} from '../../types/monaco';
import { loadMonaco } from './MonacoLoader';

/**
 * Default diff editor options
 */
const DEFAULT_OPTIONS: Partial<DiffEditorConfig> = {
  language: 'typescript',
  theme: 'vs-dark',
  readOnly: true,
  renderSideBySide: true,
  lineNumbers: 'on',
  minimap: false,
};

/**
 * Diff Editor implementation
 */
export class DiffEditor implements IDiffEditor {
  private editor: IStandaloneDiffEditor | null = null;
  private monaco: Monaco | null = null;
  private config: DiffEditorConfig;
  private isDisposed = false;

  constructor(config: DiffEditorConfig) {
    this.config = { ...DEFAULT_OPTIONS, ...config };
  }

  /**
   * Initialize the diff editor
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

    // Create models for original and modified content
    const originalModel = this.monaco.editor.createModel(
      this.config.original,
      this.config.language || 'typescript',
      this.config.originalPath
        ? this.monaco.Uri.file(this.config.originalPath)
        : undefined
    );

    const modifiedModel = this.monaco.editor.createModel(
      this.config.modified,
      this.config.language || 'typescript',
      this.config.modifiedPath
        ? this.monaco.Uri.file(this.config.modifiedPath)
        : undefined
    );

    // Create diff editor instance
    this.editor = this.monaco.editor.createDiffEditor(this.config.container, {
      theme: this.config.theme || 'vs-dark',
      readOnly: this.config.readOnly !== false,
      renderSideBySide: this.config.renderSideBySide !== false,
      lineNumbers: this.config.lineNumbers || 'on',
      minimap: {
        enabled: this.config.minimap || false,
      },
      automaticLayout: true,
      scrollBeyondLastLine: false,
      renderWhitespace: 'selection',
      rulers: [80, 120],
      folding: true,
      matchBrackets: 'always',
      glyphMargin: true,
      // Diff-specific options
      enableSplitViewResizing: true,
      renderIndicators: true,
      ignoreTrimWhitespace: true,
      renderOverviewRuler: true,
      diffCodeLens: true,
      diffAlgorithm: 'advanced',
    });

    // Set the diff models
    this.editor.setModel({
      original: originalModel,
      modified: modifiedModel,
    });
  }

  /**
   * Get original editor value
   */
  getOriginalValue(): string {
    if (!this.editor) {
      throw new Error('Editor not initialized');
    }
    const model = this.editor.getOriginalEditor().getModel();
    return model ? model.getValue() : '';
  }

  /**
   * Get modified editor value
   */
  getModifiedValue(): string {
    if (!this.editor) {
      throw new Error('Editor not initialized');
    }
    const model = this.editor.getModifiedEditor().getModel();
    return model ? model.getValue() : '';
  }

  /**
   * Set original value
   */
  setOriginalValue(value: string): void {
    if (!this.editor) {
      throw new Error('Editor not initialized');
    }
    const model = this.editor.getOriginalEditor().getModel();
    if (model) {
      model.setValue(value);
    }
  }

  /**
   * Set modified value
   */
  setModifiedValue(value: string): void {
    if (!this.editor) {
      throw new Error('Editor not initialized');
    }
    const model = this.editor.getModifiedEditor().getModel();
    if (model) {
      model.setValue(value);
    }
  }

  /**
   * Set language for both editors
   */
  setLanguage(language: EditorLanguage): void {
    if (!this.editor || !this.monaco) {
      throw new Error('Editor not initialized');
    }

    const originalModel = this.editor.getOriginalEditor().getModel();
    const modifiedModel = this.editor.getModifiedEditor().getModel();

    if (originalModel) {
      this.monaco.editor.setModelLanguage(originalModel, language);
    }
    if (modifiedModel) {
      this.monaco.editor.setModelLanguage(modifiedModel, language);
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
   * Get line changes
   */
  getLineChanges(): ILineChange[] {
    if (!this.editor) {
      throw new Error('Editor not initialized');
    }

    const changes = this.editor.getLineChanges();
    if (!changes) {
      return [];
    }

    return changes.map(change => ({
      originalStartLineNumber: change.originalStartLineNumber,
      originalEndLineNumber: change.originalEndLineNumber,
      modifiedStartLineNumber: change.modifiedStartLineNumber,
      modifiedEndLineNumber: change.modifiedEndLineNumber,
    }));
  }

  /**
   * Get diff statistics
   */
  getDiffStats(): DiffStats {
    const changes = this.getLineChanges();

    let additions = 0;
    let deletions = 0;

    changes.forEach(change => {
      const originalLines = change.originalEndLineNumber - change.originalStartLineNumber + 1;
      const modifiedLines = change.modifiedEndLineNumber - change.modifiedStartLineNumber + 1;

      // If original has no lines, it's an addition
      if (change.originalStartLineNumber === 0) {
        additions += modifiedLines;
      }
      // If modified has no lines, it's a deletion
      else if (change.modifiedStartLineNumber === 0) {
        deletions += originalLines;
      }
      // Otherwise, it's a modification (count as both)
      else {
        const diff = modifiedLines - originalLines;
        if (diff > 0) {
          additions += diff;
        } else if (diff < 0) {
          deletions += Math.abs(diff);
        }
      }
    });

    return {
      additions,
      deletions,
      total: additions + deletions,
    };
  }

  /**
   * Navigate to next diff
   */
  goToNextDiff(): void {
    if (!this.editor) {
      throw new Error('Editor not initialized');
    }
    this.editor.getModifiedEditor().getAction('editor.action.diffReview.next')?.run();
  }

  /**
   * Navigate to previous diff
   */
  goToPreviousDiff(): void {
    if (!this.editor) {
      throw new Error('Editor not initialized');
    }
    this.editor.getModifiedEditor().getAction('editor.action.diffReview.prev')?.run();
  }

  /**
   * Toggle inline/side-by-side view
   */
  toggleRenderSideBySide(): void {
    if (!this.editor) {
      throw new Error('Editor not initialized');
    }
    // Toggle between side-by-side and inline view
    const currentSideBySide = this.config.renderSideBySide !== false;
    this.config.renderSideBySide = !currentSideBySide;
    this.editor.updateOptions({ renderSideBySide: this.config.renderSideBySide });
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
      // Dispose models
      const originalModel = this.editor.getOriginalEditor().getModel();
      const modifiedModel = this.editor.getModifiedEditor().getModel();

      this.editor.dispose();

      if (originalModel) {
        originalModel.dispose();
      }
      if (modifiedModel) {
        modifiedModel.dispose();
      }

      this.editor = null;
    }
    this.monaco = null;
    this.isDisposed = true;
  }

  /**
   * Get underlying Monaco diff editor instance
   */
  getEditor(): IStandaloneDiffEditor | null {
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
   * Get original editor instance
   */
  getOriginalEditor() {
    if (!this.editor) {
      throw new Error('Editor not initialized');
    }
    return this.editor.getOriginalEditor();
  }

  /**
   * Get modified editor instance
   */
  getModifiedEditor() {
    if (!this.editor) {
      throw new Error('Editor not initialized');
    }
    return this.editor.getModifiedEditor();
  }
}

/**
 * Create a new diff editor instance
 */
export async function createDiffEditor(config: DiffEditorConfig): Promise<IDiffEditor> {
  const editor = new DiffEditor(config);
  await editor.initialize();
  return editor;
}

/**
 * Calculate diff statistics from two strings
 */
export function calculateDiffStats(original: string, modified: string): DiffStats {
  const originalLines = original.split('\n');
  const modifiedLines = modified.split('\n');

  let additions = 0;
  let deletions = 0;

  // Simple line-based diff
  const maxLength = Math.max(originalLines.length, modifiedLines.length);

  for (let i = 0; i < maxLength; i++) {
    const originalLine = originalLines[i];
    const modifiedLine = modifiedLines[i];

    if (originalLine === undefined) {
      additions++;
    } else if (modifiedLine === undefined) {
      deletions++;
    } else if (originalLine !== modifiedLine) {
      // Count as both addition and deletion for simplicity
      additions++;
      deletions++;
    }
  }

  return {
    additions,
    deletions,
    total: additions + deletions,
  };
}
