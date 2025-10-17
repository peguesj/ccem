/**
 * Logging utilities for CCEM.
 *
 * @packageDocumentation
 * @module utils/logger
 * @version 1.0.0
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Log level enumeration.
 *
 * @enum LogLevel
 * @version 1.0.0
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

/**
 * Log entry interface.
 *
 * @interface LogEntry
 * @version 1.0.0
 */
export interface LogEntry {
  /** Timestamp of log entry */
  timestamp: string;
  /** Log level */
  level: LogLevel;
  /** Log message */
  message: string;
  /** Additional context data */
  context?: Record<string, unknown>;
  /** Stack trace (for errors) */
  stack?: string;
}

/**
 * Logger configuration options.
 *
 * @interface LoggerOptions
 * @version 1.0.0
 */
export interface LoggerOptions {
  /** Minimum log level to output */
  minLevel?: LogLevel;
  /** Enable console output */
  console?: boolean;
  /** Enable file output */
  file?: boolean;
  /** Log file path */
  filePath?: string;
  /** Enable colorized output */
  colorize?: boolean;
}

/**
 * Logger class for application logging.
 *
 * @class Logger
 * @version 1.0.0
 */
export class Logger {
  private options: Required<LoggerOptions>;
  private logFilePath: string;

  /**
   * Creates a new logger instance.
   *
   * @param options - Logger configuration options
   */
  constructor(options: LoggerOptions = {}) {
    this.options = {
      minLevel: options.minLevel ?? LogLevel.INFO,
      console: options.console ?? true,
      file: options.file ?? true,
      filePath: options.filePath ?? path.join(os.homedir(), '.ccem', 'logs', 'ccem.log'),
      colorize: options.colorize ?? true
    };

    this.logFilePath = this.options.filePath;
    this.ensureLogDirectory();
  }

  /**
   * Ensures log directory exists.
   *
   * @private
   */
  private ensureLogDirectory(): void {
    const dir = path.dirname(this.logFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Formats timestamp for log entry.
   *
   * @returns Formatted timestamp
   * @private
   */
  private getTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Gets level name from level number.
   *
   * @param level - Log level
   * @returns Level name
   * @private
   */
  private getLevelName(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return 'DEBUG';
      case LogLevel.INFO: return 'INFO';
      case LogLevel.WARN: return 'WARN';
      case LogLevel.ERROR: return 'ERROR';
      case LogLevel.FATAL: return 'FATAL';
      default: return 'UNKNOWN';
    }
  }

  /**
   * Gets colorized level name.
   *
   * @param level - Log level
   * @returns Colorized level name
   * @private
   */
  private getColorizedLevel(level: LogLevel): string {
    const name = this.getLevelName(level);
    switch (level) {
      case LogLevel.DEBUG: return `\x1b[36m${name}\x1b[0m`; // Cyan
      case LogLevel.INFO: return `\x1b[32m${name}\x1b[0m`; // Green
      case LogLevel.WARN: return `\x1b[33m${name}\x1b[0m`; // Yellow
      case LogLevel.ERROR: return `\x1b[31m${name}\x1b[0m`; // Red
      case LogLevel.FATAL: return `\x1b[35m${name}\x1b[0m`; // Magenta
      default: return name;
    }
  }

  /**
   * Formats log entry for console output.
   *
   * @param entry - Log entry
   * @returns Formatted string
   * @private
   */
  private formatConsoleEntry(entry: LogEntry): string {
    const level = this.options.colorize
      ? this.getColorizedLevel(entry.level)
      : this.getLevelName(entry.level);

    const timestamp = this.options.colorize
      ? `\x1b[2m${entry.timestamp}\x1b[0m`
      : entry.timestamp;

    let output = `[${timestamp}] ${level.padEnd(15)} ${entry.message}`;

    if (entry.context && Object.keys(entry.context).length > 0) {
      const contextStr = JSON.stringify(entry.context, null, 2);
      output += `\n  Context: ${contextStr}`;
    }

    if (entry.stack) {
      output += `\n  Stack:\n${entry.stack.split('\n').map(l => `    ${l}`).join('\n')}`;
    }

    return output;
  }

  /**
   * Formats log entry for file output.
   *
   * @param entry - Log entry
   * @returns Formatted string
   * @private
   */
  private formatFileEntry(entry: LogEntry): string {
    return JSON.stringify(entry) + '\n';
  }

  /**
   * Writes log entry to file.
   *
   * @param entry - Log entry
   * @private
   */
  private writeToFile(entry: LogEntry): void {
    try {
      const formatted = this.formatFileEntry(entry);
      fs.appendFileSync(this.logFilePath, formatted, 'utf8');
    } catch (error) {
      // Silently fail if unable to write to file
      console.error('Failed to write to log file:', error);
    }
  }

  /**
   * Logs a message at specified level.
   *
   * @param level - Log level
   * @param message - Log message
   * @param context - Additional context
   * @param stack - Stack trace (for errors)
   */
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    stack?: string
  ): void {
    if (level < this.options.minLevel) {
      return;
    }

    const entry: LogEntry = {
      timestamp: this.getTimestamp(),
      level,
      message,
      ...(context && { context }),
      ...(stack && { stack })
    };

    if (this.options.console) {
      const formatted = this.formatConsoleEntry(entry);
      if (level >= LogLevel.ERROR) {
        console.error(formatted);
      } else {
        console.log(formatted);
      }
    }

    if (this.options.file) {
      this.writeToFile(entry);
    }
  }

  /**
   * Logs debug message.
   *
   * @param message - Debug message
   * @param context - Additional context
   */
  public debug(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Logs info message.
   *
   * @param message - Info message
   * @param context - Additional context
   */
  public info(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Logs warning message.
   *
   * @param message - Warning message
   * @param context - Additional context
   */
  public warn(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Logs error message.
   *
   * @param message - Error message
   * @param error - Error object (optional)
   * @param context - Additional context
   */
  public error(message: string, error?: Error, context?: Record<string, unknown>): void {
    const stack = error?.stack;
    const errorContext = {
      ...context,
      ...(error ? { errorName: error.name, errorMessage: error.message } : {})
    };
    this.log(LogLevel.ERROR, message, errorContext, stack);
  }

  /**
   * Logs fatal error message.
   *
   * @param message - Fatal error message
   * @param error - Error object (optional)
   * @param context - Additional context
   */
  public fatal(message: string, error?: Error, context?: Record<string, unknown>): void {
    const stack = error?.stack;
    const errorContext = {
      ...context,
      ...(error ? { errorName: error.name, errorMessage: error.message } : {})
    };
    this.log(LogLevel.FATAL, message, errorContext, stack);
  }

  /**
   * Clears log file.
   */
  public clearLogFile(): void {
    try {
      fs.writeFileSync(this.logFilePath, '', 'utf8');
      this.info('Log file cleared');
    } catch (error) {
      console.error('Failed to clear log file:', error);
    }
  }

  /**
   * Gets log file path.
   *
   * @returns Log file path
   */
  public getLogFilePath(): string {
    return this.logFilePath;
  }
}

// Export singleton instance
export const logger = new Logger();
