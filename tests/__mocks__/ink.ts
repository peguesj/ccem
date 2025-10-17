import React from 'react';

// Mock ink components for testing
export const Box = ({ children, ...props }: any) => React.createElement('box', props, children);
export const Text = ({ children, ...props }: any) => React.createElement('text', props, children);

// Mock useInput hook
export const useInput = (handler: (input: string, key: any) => void) => {
  // Store handler for manual invocation in tests if needed
};

// Mock Stdout
class MockStdout {
  frames: string[] = [];
  private _lastFrame?: string;

  columns = 80;

  write = (frame: string) => {
    this.frames.push(frame);
    this._lastFrame = frame;
  };

  lastFrame = () => this._lastFrame;
}

// Mock Stderr
class MockStderr {
  frames: string[] = [];
  private _lastFrame?: string;

  write = (frame: string) => {
    this.frames.push(frame);
    this._lastFrame = frame;
  };

  lastFrame = () => this._lastFrame;
}

// Mock Stdin
class MockStdin {
  isTTY = true;

  write = (data: string) => {
    // Mock implementation
  };

  setEncoding() {}
  setRawMode() {}
  resume() {}
  pause() {}
}

// Mock render function that returns proper Instance
export const render = (tree: React.ReactElement) => {
  const stdout = new MockStdout();
  const stderr = new MockStderr();
  const stdin = new MockStdin();

  let currentTree = tree;

  // Simple render logic - just convert tree to string
  const renderToString = (element: any): string => {
    if (!element) return '';
    if (element === true || element === false) return '';
    if (typeof element === 'string') return element;
    if (typeof element === 'number') return String(element);

    // Handle React elements
    if (React.isValidElement(element)) {
      const props = element.props as any;
      const children = props?.children;

      if (!children) return '';

      if (Array.isArray(children)) {
        return children.map(renderToString).join('');
      }

      return renderToString(children);
    }

    // Handle arrays
    if (Array.isArray(element)) {
      return element.map(renderToString).join('');
    }

    return '';
  };

  // Initial render
  const frame = renderToString(tree);
  stdout.write(frame);

  const instance = {
    rerender: (newTree: React.ReactElement) => {
      currentTree = newTree;
      const newFrame = renderToString(newTree);
      stdout.write(newFrame);
    },
    unmount: () => {
      // Mock unmount
    },
    cleanup: () => {
      stdout.frames = [];
      stderr.frames = [];
    },
    stdout,
    stderr,
    stdin,
    get frames() {
      return stdout.frames;
    },
    lastFrame: () => stdout.lastFrame()
  };

  return instance;
};
