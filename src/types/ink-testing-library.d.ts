declare module 'ink-testing-library' {
  import { ReactElement } from 'react';
  import { EventEmitter } from 'events';

  class Stdout extends EventEmitter {
    get columns(): number;
    readonly frames: string[];
    write: (frame: string) => void;
    lastFrame: () => string | undefined;
  }

  class Stderr extends EventEmitter {
    readonly frames: string[];
    write: (frame: string) => void;
    lastFrame: () => string | undefined;
  }

  class Stdin extends EventEmitter {
    isTTY: boolean;
    write: (data: string) => void;
    setEncoding(): void;
    setRawMode(): void;
    resume(): void;
    pause(): void;
  }

  type Instance = {
    rerender: (tree: ReactElement) => void;
    unmount: () => void;
    cleanup: () => void;
    stdout: Stdout;
    stderr: Stderr;
    stdin: Stdin;
    frames: string[];
    lastFrame: () => string | undefined;
  };

  export const render: (tree: ReactElement) => Instance;
  export const cleanup: () => void;
}
