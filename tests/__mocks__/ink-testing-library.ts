import React from 'react';

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

/**
 * Recursively render React elements to string
 */
const renderToString = (element: any, depth = 0): string => {
  if (!element) return '';
  if (element === true || element === false) return '';
  if (typeof element === 'string') return element;
  if (typeof element === 'number') return String(element);

  // Handle React elements
  if (React.isValidElement(element)) {
    const props = element.props as any;
    const elementType = element.type;

    // If it's a function component, we need to call it to render it
    if (typeof elementType === 'function') {
      try {
        // Check if it's a class component (has prototype.render or prototype.isReactComponent)
        const isClassComponent =
          elementType.prototype &&
          (elementType.prototype.render || elementType.prototype.isReactComponent);

        let rendered;
        if (isClassComponent) {
          // For class components, instantiate and call render
          const instance = new (elementType as any)(props);
          rendered = instance.render();
        } else {
          // For function components, just call the function
          rendered = (elementType as Function)(props);
        }

        return renderToString(rendered, depth + 1);
      } catch (error) {
        // If rendering fails, try to extract children
        const children = props?.children;
        if (children) {
          if (Array.isArray(children)) {
            return children.map(c => renderToString(c, depth + 1)).join('');
          }
          return renderToString(children, depth + 1);
        }
        return '';
      }
    }

    // For built-in elements (Box, Text, etc), extract children
    const children = props?.children;

    if (!children) return '';

    if (Array.isArray(children)) {
      return children.map(c => renderToString(c, depth + 1)).join('');
    }

    return renderToString(children, depth + 1);
  }

  // Handle arrays
  if (Array.isArray(element)) {
    return element.map(e => renderToString(e, depth + 1)).join('');
  }

  return '';
};

/**
 * Mock render function for ink-testing-library
 */
export const render = (tree: React.ReactElement) => {
  const stdout = new MockStdout();
  const stderr = new MockStderr();
  const stdin = new MockStdin();

  let currentTree = tree;

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

/**
 * Mock cleanup function
 */
export const cleanup = () => {
  // Mock cleanup
};
