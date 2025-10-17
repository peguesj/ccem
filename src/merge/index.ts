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
} from './strategies';

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
} from './conflict-detector';

// Backup system
export {
  createBackup,
  validateBackup,
  restoreBackup,
  createSnapshot,
  type FileInfo,
  type SnapshotInfo,
  type BackupMetadata
} from './backup';

// Security audit
export {
  auditMerge,
  type IssueSeverity,
  type IssueType,
  type RiskLevel,
  type SecurityIssue,
  type AuditSummary,
  type SecurityAuditResult
} from './security-audit';
