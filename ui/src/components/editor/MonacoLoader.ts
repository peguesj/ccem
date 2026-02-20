/**
 * Monaco Editor Lazy Loader
 * Handles lazy loading of Monaco editor (~8MB) with loading state management
 */

import type { Monaco, MonacoLoaderState } from '../../types/monaco';

/**
 * Monaco loader singleton
 */
class MonacoLoader {
  private state: MonacoLoaderState = { status: 'idle' };
  private loadPromise: Promise<Monaco> | null = null;
  private callbacks: Array<(monaco: Monaco) => void> = [];

  /**
   * Get current loader state
   */
  getState(): MonacoLoaderState {
    return { ...this.state };
  }

  /**
   * Load Monaco editor
   * Returns cached instance if already loaded
   */
  async load(): Promise<Monaco> {
    // Already loaded
    if (this.state.status === 'loaded' && this.state.monaco) {
      return this.state.monaco;
    }

    // Currently loading
    if (this.loadPromise) {
      return this.loadPromise;
    }

    // Start loading
    this.state = { status: 'loading' };
    this.loadPromise = this.loadMonaco();

    try {
      const monaco = await this.loadPromise;
      this.state = { status: 'loaded', monaco };

      // Execute callbacks
      this.callbacks.forEach(cb => cb(monaco));
      this.callbacks = [];

      return monaco;
    } catch (error) {
      this.state = {
        status: 'error',
        error: error instanceof Error ? error : new Error('Failed to load Monaco editor'),
      };
      this.loadPromise = null;
      throw this.state.error;
    }
  }

  /**
   * Register callback for when Monaco is loaded
   */
  onLoad(callback: (monaco: Monaco) => void): void {
    if (this.state.status === 'loaded' && this.state.monaco) {
      callback(this.state.monaco);
    } else {
      this.callbacks.push(callback);
    }
  }

  /**
   * Check if Monaco is loaded
   */
  isLoaded(): boolean {
    return this.state.status === 'loaded';
  }

  /**
   * Check if Monaco is loading
   */
  isLoading(): boolean {
    return this.state.status === 'loading';
  }

  /**
   * Check if Monaco failed to load
   */
  hasError(): boolean {
    return this.state.status === 'error';
  }

  /**
   * Get error if load failed
   */
  getError(): Error | undefined {
    return this.state.error;
  }

  /**
   * Internal: Load Monaco editor module
   */
  private async loadMonaco(): Promise<Monaco> {
    try {
      // Dynamic import of Monaco
      const monaco = await import('monaco-editor');

      // Configure Monaco
      this.configureMonaco(monaco);

      return monaco;
    } catch (error) {
      const loadError = error instanceof Error
        ? error
        : new Error('Unknown error loading Monaco editor');

      console.error('Failed to load Monaco editor:', loadError);
      throw loadError;
    }
  }

  /**
   * Configure Monaco editor settings
   */
  private configureMonaco(monaco: Monaco): void {
    // Monaco worker configuration is handled by vite-plugin-monaco-editor
    // or manual worker setup in vite.config.ts

    // Configure default editor options
    monaco.editor.defineTheme('ccem-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#0f172a', // slate-900
        'editor.foreground': '#e2e8f0', // slate-200
        'editor.lineHighlightBackground': '#1e293b', // slate-800
        'editor.selectionBackground': '#334155', // slate-700
        'editorCursor.foreground': '#60a5fa', // blue-400
        'editorLineNumber.foreground': '#64748b', // slate-500
        'editorLineNumber.activeForeground': '#94a3b8', // slate-400
      },
    });

    monaco.editor.defineTheme('ccem-light', {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#1e293b', // slate-800
        'editor.lineHighlightBackground': '#f8fafc', // slate-50
        'editor.selectionBackground': '#e0e7ff', // indigo-100
        'editorCursor.foreground': '#3b82f6', // blue-500
        'editorLineNumber.foreground': '#94a3b8', // slate-400
        'editorLineNumber.activeForeground': '#64748b', // slate-500
      },
    });

    // Set default options
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.Latest,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      reactNamespace: 'React',
      allowJs: true,
      typeRoots: ['node_modules/@types'],
    });

    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });
  }

  /**
   * Reset loader state (for testing)
   */
  reset(): void {
    this.state = { status: 'idle' };
    this.loadPromise = null;
    this.callbacks = [];
  }
}

// Export singleton instance
export const monacoLoader = new MonacoLoader();

/**
 * Hook-style loader for easy usage
 */
export async function loadMonaco(): Promise<Monaco> {
  return monacoLoader.load();
}

/**
 * Get current loader state
 */
export function getMonacoState(): MonacoLoaderState {
  return monacoLoader.getState();
}

/**
 * Check if Monaco is ready
 */
export function isMonacoReady(): boolean {
  return monacoLoader.isLoaded();
}
