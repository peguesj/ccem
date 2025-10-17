/**
 * Formatting utilities for terminal output.
 *
 * @packageDocumentation
 * @module utils/format
 * @version 1.0.0
 */

/**
 * ANSI color codes.
 */
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',

  // Foreground colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  // Background colors
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

/**
 * Symbols for status messages.
 */
export const symbols = {
  success: '✓',
  error: '✗',
  warning: '⚠',
  info: 'ℹ',
  question: '?',
  pointer: '›',
  bullet: '•',
  arrow: '→',
  check: '✓',
  cross: '✗',
  star: '★',
  box: '▪',
  circle: '●',
  line: '─',
  corner: '└',
  branch: '├'
};

/**
 * Colorizes text.
 *
 * @param text - Text to colorize
 * @param color - Color name
 * @returns Colorized text
 */
export function colorize(text: string, color: keyof typeof colors): string {
  return `${colors[color]}${text}${colors.reset}`;
}

/**
 * Makes text bold.
 *
 * @param text - Text to make bold
 * @returns Bold text
 */
export function bold(text: string): string {
  return `${colors.bold}${text}${colors.reset}`;
}

/**
 * Makes text dim.
 *
 * @param text - Text to make dim
 * @returns Dim text
 */
export function dim(text: string): string {
  return `${colors.dim}${text}${colors.reset}`;
}

/**
 * Creates a success message.
 *
 * @param message - Message text
 * @returns Formatted success message
 */
export function success(message: string): string {
  return `${colorize(symbols.success, 'green')} ${message}`;
}

/**
 * Creates an error message.
 *
 * @param message - Message text
 * @returns Formatted error message
 */
export function error(message: string): string {
  return `${colorize(symbols.error, 'red')} ${message}`;
}

/**
 * Creates a warning message.
 *
 * @param message - Message text
 * @returns Formatted warning message
 */
export function warning(message: string): string {
  return `${colorize(symbols.warning, 'yellow')} ${message}`;
}

/**
 * Creates an info message.
 *
 * @param message - Message text
 * @returns Formatted info message
 */
export function info(message: string): string {
  return `${colorize(symbols.info, 'cyan')} ${message}`;
}

/**
 * Formats a table for terminal output.
 *
 * @param headers - Table headers
 * @param rows - Table rows
 * @returns Formatted table string
 */
export function table(headers: string[], rows: string[][]): string {
  // Calculate column widths
  const widths = headers.map((header, i) => {
    const cellWidths = rows.map(row => (row[i] || '').length);
    return Math.max(header.length, ...cellWidths);
  });

  // Format header
  const headerRow = headers.map((h, i) => h.padEnd(widths[i] || 0)).join('  ');
  const separator = widths.map(w => symbols.line.repeat(w)).join('  ');

  // Format rows
  const bodyRows = rows.map(row =>
    row.map((cell, i) => (cell || '').padEnd(widths[i] || 0)).join('  ')
  );

  return [
    bold(headerRow),
    dim(separator),
    ...bodyRows
  ].join('\n');
}

/**
 * Formats a list for terminal output.
 *
 * @param items - List items
 * @param symbol - Symbol to use for bullets
 * @returns Formatted list string
 */
export function list(items: string[], symbol = symbols.bullet): string {
  return items.map(item => `  ${symbol} ${item}`).join('\n');
}

/**
 * Creates a horizontal line separator.
 *
 * @param width - Width of separator (defaults to 80)
 * @param char - Character to use
 * @returns Separator string
 */
export function separator(width = 80, char = symbols.line): string {
  return dim(char.repeat(width));
}

/**
 * Formats bytes to human-readable size.
 *
 * @param bytes - Number of bytes
 * @returns Formatted size string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Formats duration in milliseconds to human-readable string.
 *
 * @param ms - Duration in milliseconds
 * @returns Formatted duration string
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
}

/**
 * Truncates text to specified length with ellipsis.
 *
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Centers text within specified width.
 *
 * @param text - Text to center
 * @param width - Total width
 * @returns Centered text
 */
export function center(text: string, width: number): string {
  const padding = Math.max(0, width - text.length);
  const leftPad = Math.floor(padding / 2);
  const rightPad = padding - leftPad;
  return ' '.repeat(leftPad) + text + ' '.repeat(rightPad);
}

/**
 * Formats a key-value pair.
 *
 * @param key - Key name
 * @param value - Value
 * @param indent - Indentation level
 * @returns Formatted key-value string
 */
export function keyValue(key: string, value: string, indent = 0): string {
  const padding = '  '.repeat(indent);
  return `${padding}${dim(key + ':')} ${value}`;
}

/**
 * Creates a box around text.
 *
 * @param text - Text to box
 * @param padding - Padding inside box
 * @returns Boxed text
 */
export function box(text: string, padding = 1): string {
  const lines = text.split('\n');
  const maxWidth = Math.max(...lines.map(l => l.length));
  const width = maxWidth + (padding * 2);

  const top = '┌' + '─'.repeat(width) + '┐';
  const bottom = '└' + '─'.repeat(width) + '┘';
  const padStr = ' '.repeat(padding);

  const content = lines.map(line => {
    const padded = line + ' '.repeat(maxWidth - line.length);
    return '│' + padStr + padded + padStr + '│';
  });

  return [top, ...content, bottom].join('\n');
}

/**
 * Formats a progress percentage.
 *
 * @param current - Current value
 * @param total - Total value
 * @returns Formatted percentage string
 */
export function percentage(current: number, total: number): string {
  const pct = Math.round((current / total) * 100);
  return `${pct}%`;
}
