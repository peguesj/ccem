/**
 * Custom error classes and error handling utilities.
 *
 * @packageDocumentation
 * @module utils/errors
 * @version 1.0.0
 */

/**
 * Base CCEM error class with error codes and additional context.
 *
 * @class CCEMError
 * @extends Error
 * @version 1.0.0
 */
export class CCEMError extends Error {
  /**
   * Creates a new CCEM error.
   *
   * @param message - Human-readable error message
   * @param code - Error code for programmatic handling
   * @param details - Additional error context and details
   */
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'CCEMError';
    Object.setPrototypeOf(this, CCEMError.prototype);
  }
}

/**
 * Configuration file not found error.
 *
 * @class ConfigNotFoundError
 * @extends CCEMError
 * @version 1.0.0
 */
export class ConfigNotFoundError extends CCEMError {
  constructor(path: string) {
    super(
      `Configuration file not found at: ${path}`,
      'CONFIG_NOT_FOUND',
      { path }
    );
    this.name = 'ConfigNotFoundError';
    Object.setPrototypeOf(this, ConfigNotFoundError.prototype);
  }
}

/**
 * Configuration validation error.
 *
 * @class ValidationError
 * @extends CCEMError
 * @version 1.0.0
 */
export class ValidationError extends CCEMError {
  constructor(message: string, validationErrors: unknown) {
    super(
      `Configuration validation failed: ${message}`,
      'VALIDATION_ERROR',
      { validationErrors }
    );
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Merge conflict error.
 *
 * @class MergeConflictError
 * @extends CCEMError
 * @version 1.0.0
 */
export class MergeConflictError extends CCEMError {
  constructor(conflictCount: number, conflicts: unknown) {
    super(
      `Merge operation found ${conflictCount} conflict${conflictCount === 1 ? '' : 's'} requiring manual review`,
      'MERGE_CONFLICT',
      { conflictCount, conflicts }
    );
    this.name = 'MergeConflictError';
    Object.setPrototypeOf(this, MergeConflictError.prototype);
  }
}

/**
 * Backup operation error.
 *
 * @class BackupError
 * @extends CCEMError
 * @version 1.0.0
 */
export class BackupError extends CCEMError {
  constructor(message: string, operation: string) {
    super(
      `Backup operation failed: ${message}`,
      'BACKUP_ERROR',
      { operation }
    );
    this.name = 'BackupError';
    Object.setPrototypeOf(this, BackupError.prototype);
  }
}

/**
 * Security audit error.
 *
 * @class SecurityError
 * @extends CCEMError
 * @version 1.0.0
 */
export class SecurityError extends CCEMError {
  constructor(message: string, issueCount: number) {
    super(
      `Security audit found ${issueCount} issue${issueCount === 1 ? '' : 's'}: ${message}`,
      'SECURITY_ERROR',
      { issueCount }
    );
    this.name = 'SecurityError';
    Object.setPrototypeOf(this, SecurityError.prototype);
  }
}

/**
 * Permission denied error.
 *
 * @class PermissionError
 * @extends CCEMError
 * @version 1.0.0
 */
export class PermissionError extends CCEMError {
  constructor(path: string, operation: string) {
    super(
      `Permission denied: Cannot ${operation} ${path}`,
      'PERMISSION_DENIED',
      { path, operation }
    );
    this.name = 'PermissionError';
    Object.setPrototypeOf(this, PermissionError.prototype);
  }
}

/**
 * Fork discovery error.
 *
 * @class ForkDiscoveryError
 * @extends CCEMError
 * @version 1.0.0
 */
export class ForkDiscoveryError extends CCEMError {
  constructor(message: string, source?: string) {
    super(
      `Fork discovery failed: ${message}`,
      'FORK_DISCOVERY_ERROR',
      { source }
    );
    this.name = 'ForkDiscoveryError';
    Object.setPrototypeOf(this, ForkDiscoveryError.prototype);
  }
}

/**
 * Error formatting options.
 *
 * @interface ErrorFormatOptions
 * @version 1.0.0
 */
export interface ErrorFormatOptions {
  /** Include stack trace in output */
  includeStack?: boolean;
  /** Include error details in output */
  includeDetails?: boolean;
  /** Include suggestions for resolution */
  includeSuggestions?: boolean;
  /** Colorize output for terminal */
  colorize?: boolean;
}

/**
 * Suggestion for resolving an error.
 *
 * @interface ErrorSuggestion
 * @version 1.0.0
 */
export interface ErrorSuggestion {
  /** Suggestion text */
  text: string;
  /** Command to run (if applicable) */
  command?: string;
}

/**
 * Gets suggestions for resolving common errors.
 *
 * @param error - Error to get suggestions for
 * @returns Array of suggestions
 * @version 1.0.0
 */
export function getErrorSuggestions(error: Error): ErrorSuggestion[] {
  if (error instanceof ConfigNotFoundError) {
    return [
      { text: "Check if .claude/ directory exists" },
      { text: "Run 'ccem init' to create initial config", command: "ccem init" },
      { text: "Verify file permissions" }
    ];
  }

  if (error instanceof ValidationError) {
    return [
      { text: "Check configuration file syntax (JSON format)" },
      { text: "Validate against schema", command: "ccem validate" },
      { text: "Review error details for specific validation failures" }
    ];
  }

  if (error instanceof MergeConflictError) {
    return [
      { text: "Review conflicts manually", command: "ccem audit" },
      { text: "Use interactive conflict resolution" },
      { text: "Try a different merge strategy" }
    ];
  }

  if (error instanceof BackupError) {
    return [
      { text: "Check available disk space" },
      { text: "Verify write permissions" },
      { text: "Ensure backup directory exists" }
    ];
  }

  if (error instanceof PermissionError) {
    return [
      { text: "Check file/directory permissions" },
      { text: "Run with appropriate user privileges" },
      { text: "Verify ownership of configuration files" }
    ];
  }

  if (error instanceof SecurityError) {
    return [
      { text: "Review security audit report", command: "ccem audit" },
      { text: "Fix critical security issues first" },
      { text: "Consult documentation for security best practices" }
    ];
  }

  if (error instanceof ForkDiscoveryError) {
    return [
      { text: "Check conversation history format" },
      { text: "Ensure chat export is complete" },
      { text: "Try different discovery parameters" }
    ];
  }

  // Generic suggestions for unknown errors
  return [
    { text: "Check application logs for more details" },
    { text: "Verify all prerequisites are met" },
    { text: "Consult documentation", command: "ccem --help" }
  ];
}

/**
 * Formats error for display in terminal.
 *
 * @param error - Error to format
 * @param options - Formatting options
 * @returns Formatted error string
 * @version 1.0.0
 */
export function formatError(error: Error, options: ErrorFormatOptions = {}): string {
  const {
    includeStack = false,
    includeDetails = true,
    includeSuggestions = true,
    colorize = true
  } = options;

  const lines: string[] = [];

  // Error symbol and message
  const symbol = colorize ? '\x1b[31m✗\x1b[0m' : '✗';
  const errorName = colorize ? `\x1b[1m${error.name}\x1b[0m` : error.name;
  lines.push(`${symbol} ${errorName}`);
  lines.push('');

  // Error message (indented)
  const message = colorize ? `\x1b[31m${error.message}\x1b[0m` : error.message;
  lines.push(`  ${message}`);
  lines.push('');

  // Error details (if available and requested)
  if (includeDetails && error instanceof CCEMError && error.details) {
    const detailsHeader = colorize ? '\x1b[2mDetails:\x1b[0m' : 'Details:';
    lines.push(`  ${detailsHeader}`);

    const detailsStr = typeof error.details === 'object'
      ? JSON.stringify(error.details, null, 2)
      : String(error.details);

    detailsStr.split('\n').forEach(line => {
      lines.push(`    ${line}`);
    });
    lines.push('');
  }

  // Suggestions
  if (includeSuggestions) {
    const suggestions = getErrorSuggestions(error);
    if (suggestions.length > 0) {
      const suggestionsHeader = colorize ? '\x1b[33mSuggestions:\x1b[0m' : 'Suggestions:';
      lines.push(`  ${suggestionsHeader}`);

      suggestions.forEach(suggestion => {
        const bullet = colorize ? '\x1b[33m•\x1b[0m' : '•';
        lines.push(`  ${bullet} ${suggestion.text}`);
        if (suggestion.command) {
          const cmd = colorize ? `\x1b[36m${suggestion.command}\x1b[0m` : suggestion.command;
          lines.push(`    Command: ${cmd}`);
        }
      });
      lines.push('');
    }
  }

  // Stack trace (if requested)
  if (includeStack && error.stack) {
    const stackHeader = colorize ? '\x1b[2mStack trace:\x1b[0m' : 'Stack trace:';
    lines.push(`  ${stackHeader}`);

    error.stack.split('\n').slice(1).forEach(line => {
      lines.push(`    ${line.trim()}`);
    });
    lines.push('');
  }

  // Help footer
  const helpText = colorize ? '\x1b[2mFor help: ccem --help\x1b[0m' : 'For help: ccem --help';
  lines.push(`  ${helpText}`);

  return lines.join('\n');
}

/**
 * Handles error by formatting and logging it.
 *
 * @param error - Error to handle
 * @param options - Formatting options
 * @version 1.0.0
 */
export function handleError(error: Error, options: ErrorFormatOptions = {}): void {
  const formatted = formatError(error, options);
  console.error(formatted);

  // Exit with appropriate code
  if (error instanceof CCEMError) {
    process.exit(1);
  } else {
    // Unknown error
    process.exit(2);
  }
}
