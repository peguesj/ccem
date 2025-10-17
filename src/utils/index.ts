/**
 * Utilities barrel exports.
 *
 * @packageDocumentation
 * @module utils
 * @version 1.0.0
 */

// Error handling
export {
  CCEMError,
  ConfigNotFoundError,
  ValidationError,
  MergeConflictError,
  BackupError,
  SecurityError,
  PermissionError,
  ForkDiscoveryError,
  formatError,
  handleError,
  getErrorSuggestions,
  type ErrorFormatOptions,
  type ErrorSuggestion
} from './errors.js';

// Logging
export {
  Logger,
  LogLevel,
  logger,
  type LogEntry,
  type LoggerOptions
} from './logger.js';

// Formatting
export {
  colorize,
  bold,
  dim,
  success,
  error,
  warning,
  info,
  table,
  list,
  separator,
  formatBytes,
  formatDuration,
  truncate,
  center,
  keyValue,
  box,
  percentage,
  symbols
} from './format.js';

// Messages
export {
  startMessages,
  progressMessages,
  successMessages,
  errorMessages,
  warningMessages,
  infoMessages,
  formatConflictSummary,
  formatMergeStats,
  formatAuditSummary
} from './messages.js';
