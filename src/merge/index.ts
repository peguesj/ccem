/**
 * Merge system barrel exports.
 *
 * @packageDocumentation
 * @module merge
 * @version 0.4.0
 * @since 0.4.0
 */

// Merge strategies
export {
  recommendedMerge,
  defaultMerge,
  conservativeMerge,
  hybridMerge,
  customMerge,
  type MergeConfig,
  type MergeConflict,
  type MergeStats,
  type MergeResult,
  type CustomMergeRules
} from './strategies.js';

// Conflict detection
export {
  detectConflicts,
  type ConflictType,
  type ConflictSeverity,
  type ResolutionStrategy,
  type ConflictContext,
  type DetectedConflict,
  type ConflictSummary,
  type ConflictReport
} from './conflict-detector.js';

// Backup system
export {
  createBackup,
  validateBackup,
  restoreBackup,
  createSnapshot,
  type FileInfo,
  type SnapshotInfo,
  type BackupMetadata
} from './backup.js';

// Security audit
export {
  auditMerge,
  type IssueSeverity,
  type IssueType,
  type RiskLevel,
  type SecurityIssue,
  type AuditSummary,
  type SecurityAuditResult
} from './security-audit.js';
