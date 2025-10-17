/**
 * Mock input helper for testing interactive CLI/TUI
 *
 * @packageDocumentation
 * @module tests/integration/helpers
 */

/**
 * Simulates keyboard input sequence
 *
 * @param keys - Array of key sequences
 * @returns Input string for CLI
 *
 * @example
 * ```typescript
 * const input = mockKeyboardInput(['↓', '↓', '↵']); // Down, Down, Enter
 * ```
 */
export function mockKeyboardInput(keys: string[]): string {
  const keyMap: Record<string, string> = {
    '↑': '\x1B[A',    // Up arrow
    '↓': '\x1B[B',    // Down arrow
    '→': '\x1B[C',    // Right arrow
    '←': '\x1B[D',    // Left arrow
    '↵': '\n',        // Enter
    'ESC': '\x1B',    // Escape
    'TAB': '\t',      // Tab
    'SPACE': ' ',     // Space
    'BACKSPACE': '\x7F' // Backspace
  };

  return keys.map(key => keyMap[key] || key).join('');
}

/**
 * Creates a mock stdin stream for testing
 */
export class MockStdin {
  private data: string[] = [];
  private callbacks: Array<(data: string) => void> = [];

  /**
   * Writes data to mock stdin
   */
  write(data: string): void {
    this.data.push(data);
    this.callbacks.forEach(cb => cb(data));
  }

  /**
   * Registers callback for data events
   */
  on(event: string, callback: (data: string) => void): void {
    if (event === 'data') {
      this.callbacks.push(callback);
    }
  }

  /**
   * Gets all written data
   */
  getData(): string[] {
    return [...this.data];
  }

  /**
   * Clears mock data
   */
  clear(): void {
    this.data = [];
  }
}

/**
 * Creates a sequence of menu selections
 *
 * @param selections - Array of menu item indices to select
 * @returns Input string
 *
 * @example
 * ```typescript
 * const input = mockMenuSelection([0, 1, 2]); // Navigate to item 2 and select
 * ```
 */
export function mockMenuSelection(selections: number[]): string {
  const inputs: string[] = [];

  let currentIndex = 0;
  for (const targetIndex of selections) {
    // Navigate to target
    while (currentIndex < targetIndex) {
      inputs.push('↓');
      currentIndex++;
    }
    while (currentIndex > targetIndex) {
      inputs.push('↑');
      currentIndex--;
    }
    // Select
    inputs.push('↵');
  }

  return mockKeyboardInput(inputs);
}

/**
 * Creates input for text entry
 *
 * @param text - Text to enter
 * @param submit - Whether to submit with Enter
 * @returns Input string
 */
export function mockTextInput(text: string, submit: boolean = true): string {
  const input = text.split('').join('');
  return submit ? input + mockKeyboardInput(['↵']) : input;
}

/**
 * Creates input for confirmation prompt
 *
 * @param confirm - Whether to confirm (true) or cancel (false)
 * @returns Input string
 */
export function mockConfirmation(confirm: boolean): string {
  return confirm ? mockKeyboardInput(['y', '↵']) : mockKeyboardInput(['n', '↵']);
}

/**
 * Creates complex interaction sequence
 *
 * @param interactions - Array of interaction steps
 * @returns Input string
 *
 * @example
 * ```typescript
 * const input = mockInteractionSequence([
 *   { type: 'menu', index: 1 },
 *   { type: 'text', value: 'test.txt' },
 *   { type: 'confirm', value: true }
 * ]);
 * ```
 */
export function mockInteractionSequence(
  interactions: Array<
    | { type: 'menu'; index: number }
    | { type: 'text'; value: string }
    | { type: 'confirm'; value: boolean }
    | { type: 'keys'; keys: string[] }
  >
): string {
  const inputs: string[] = [];

  for (const interaction of interactions) {
    switch (interaction.type) {
      case 'menu':
        inputs.push(mockMenuSelection([interaction.index]));
        break;
      case 'text':
        inputs.push(mockTextInput(interaction.value));
        break;
      case 'confirm':
        inputs.push(mockConfirmation(interaction.value));
        break;
      case 'keys':
        inputs.push(mockKeyboardInput(interaction.keys));
        break;
    }
  }

  return inputs.join('');
}
