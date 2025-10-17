/**
 * Configuration management layer for Claude Code Environment Manager.
 *
 * Provides comprehensive utilities for discovering, reading, writing, validating,
 * and comparing Claude Code configuration files.
 *
 * @packageDocumentation
 * @module config
 * @version 1.0.0
 */

// Types
export type {
  ClaudeConfig,
  ConfigLocation,
  ConfigLocationType,
  McpServerConfig,
  ConfigDiff,
  ConfigChange,
  ConfigChangeType,
  ConfigValidationError,
  ConfigValidationResult,
  ReadOptions,
  WriteOptions
} from './types.js';

// Discovery
export {
  discoverConfigs,
  findClaudeDirectories,
  findNearestConfig,
  getConfigLocation,
  hasValidConfig,
  listConfigFiles
} from './discovery.js';

// Reader
export {
  readConfig,
  readMultipleConfigs,
  readPermissions,
  readConfigField,
  isValidJson,
  getDefaultConfig,
  mergeConfigs
} from './reader.js';

// Writer
export {
  writeConfig,
  updateConfig,
  createBackup,
  writePermissions,
  setConfigField,
  deleteConfigField,
  addPermission,
  removePermission
} from './writer.js';

// Validator
export {
  validateConfig,
  isValidPermission,
  isValidServerName,
  hasRequiredFields,
  isValidConfigStructure
} from './validator.js';

// Paths
export {
  getUserConfigDir,
  getProjectConfigDir,
  resolveConfigPath,
  getUserConfigPath,
  getProjectConfigPath,
  getUserPermissionsPath,
  getProjectPermissionsPath,
  hasClaudeDirectory,
  configExists,
  getParentDir,
  normalizePath
} from './paths.js';

// Compare
export {
  compareConfigs,
  areConfigsIdentical,
  getDiffSummary,
  formatDiff,
  filterDiff
} from './compare.js';
