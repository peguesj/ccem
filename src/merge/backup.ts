import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * File information in snapshot.
 *
 * @interface FileInfo
 * @version 0.4.0
 * @since 0.4.0
 */
export interface FileInfo {
  /** File path relative to source */
  path: string;
  /** SHA256 checksum */
  checksum: string;
  /** File size in bytes */
  size: number;
  /** Last modified time */
  modifiedTime: Date;
}

/**
 * Snapshot information.
 *
 * @interface SnapshotInfo
 * @version 0.4.0
 * @since 0.4.0
 */
export interface SnapshotInfo {
  /** Snapshot timestamp */
  timestamp: Date;
  /** Source path */
  sourcePath: string;
  /** Number of files */
  fileCount: number;
  /** File details */
  files: FileInfo[];
}

/**
 * Backup metadata.
 *
 * @interface BackupMetadata
 * @version 0.4.0
 * @since 0.4.0
 */
export interface BackupMetadata {
  /** Backup is valid */
  isValid: boolean;
  /** Validation errors */
  errors: string[];
  /** Backup timestamp */
  timestamp: Date;
  /** Source path */
  sourcePath: string;
  /** Compression level (1-9) */
  compressionLevel: number;
  /** Number of files */
  fileCount: number;
  /** Total size in bytes */
  totalSize: number;
  /** Backup version */
  version: string;
  /** SHA256 checksum */
  checksum: string;
}

/**
 * Calculates SHA256 checksum of a file.
 *
 * @param filePath - Path to file
 * @returns Hexadecimal checksum
 *
 * @version 0.4.0
 * @since 0.4.0
 */
function calculateChecksum(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

/**
 * Recursively gets all files in directory.
 *
 * @param dirPath - Directory path
 * @param basePath - Base path for relative paths
 * @returns Array of file paths
 *
 * @version 0.4.0
 * @since 0.4.0
 */
function getAllFiles(dirPath: string, basePath: string = dirPath): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllFiles(fullPath, basePath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Creates a compressed tar.gz backup of a directory.
 *
 * @param sourcePath - Path to directory to backup
 * @param outputDir - Optional output directory (defaults to source parent)
 * @returns Path to created backup file
 * @throws {Error} If source path does not exist or backup creation fails
 *
 * @example
 * ```typescript
 * const backupPath = await createBackup('/path/to/config');
 * console.log(`Backup created at: ${backupPath}`);
 * ```
 *
 * @version 0.4.0
 * @since 0.4.0
 */
export async function createBackup(
  sourcePath: string,
  outputDir?: string
): Promise<string> {
  // Validate source path
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source path does not exist: ${sourcePath}`);
  }

  if (!fs.statSync(sourcePath).isDirectory()) {
    throw new Error(`Source path is not a directory: ${sourcePath}`);
  }

  // Determine output path
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupName = `backup-${timestamp}.tar.gz`;
  const outputPath = outputDir
    ? path.join(outputDir, backupName)
    : path.join(path.dirname(sourcePath), backupName);

  // Create tar.gz with level 9 compression
  const sourceDir = path.basename(sourcePath);
  const sourceParent = path.dirname(sourcePath);

  try {
    // Using tar command for proper gzip level 9 compression
    await execAsync(
      `tar -czf "${outputPath}" -C "${sourceParent}" "${sourceDir}"`,
      {
        env: { ...process.env, GZIP: '-9' }
      }
    );

    // Create metadata file
    const files = getAllFiles(sourcePath);
    const metadata = {
      timestamp: new Date().toISOString(),
      sourcePath,
      compressionLevel: 9,
      fileCount: files.length,
      version: '0.4.0'
    };

    const metadataPath = outputPath + '.meta';
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    return outputPath;
  } catch (error) {
    throw new Error(`Failed to create backup: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Validates backup integrity and extracts metadata.
 *
 * @param backupPath - Path to backup file
 * @returns Backup metadata with validation results
 *
 * @example
 * ```typescript
 * const metadata = await validateBackup('/path/to/backup.tar.gz');
 * if (metadata.isValid) {
 *   console.log(`Valid backup with ${metadata.fileCount} files`);
 * }
 * ```
 *
 * @version 0.4.0
 * @since 0.4.0
 */
export async function validateBackup(backupPath: string): Promise<BackupMetadata> {
  const errors: string[] = [];
  let isValid = true;

  // Check if backup exists
  if (!fs.existsSync(backupPath)) {
    errors.push('Backup file does not exist');
    isValid = false;
  }

  // Initialize metadata with defaults
  let metadata: BackupMetadata = {
    isValid,
    errors,
    timestamp: new Date(),
    sourcePath: '',
    compressionLevel: 9,
    fileCount: 0,
    totalSize: 0,
    version: '0.4.0',
    checksum: ''
  };

  if (!isValid) {
    return metadata;
  }

  try {
    // Verify gzip header
    const header = fs.readFileSync(backupPath, { encoding: null });
    if (header.length < 2 || header[0] !== 0x1f || header[1] !== 0x8b) {
      errors.push('Invalid gzip header');
      isValid = false;
    }

    // Calculate checksum
    const checksum = calculateChecksum(backupPath);

    // Get file stats
    const stats = fs.statSync(backupPath);

    // Try to list tar contents to verify integrity
    try {
      await execAsync(`tar -tzf "${backupPath}" > /dev/null 2>&1`);
    } catch (tarError) {
      errors.push('Corrupted tar archive - cannot list contents');
      isValid = false;
    }

    // Try to read metadata file
    const metadataPath = backupPath + '.meta';
    if (fs.existsSync(metadataPath)) {
      const metaContent = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
      metadata = {
        isValid,
        errors,
        timestamp: new Date(metaContent.timestamp),
        sourcePath: metaContent.sourcePath,
        compressionLevel: metaContent.compressionLevel || 9,
        fileCount: metaContent.fileCount || 0,
        totalSize: stats.size,
        version: metaContent.version || '0.4.0',
        checksum
      };
    } else {
      // No metadata file, try to list contents
      try {
        const { stdout } = await execAsync(`tar -tzf "${backupPath}" | wc -l`);
        const fileCount = parseInt(stdout.trim(), 10);

        metadata = {
          isValid,
          errors,
          timestamp: new Date(stats.mtime),
          sourcePath: '',
          compressionLevel: 9,
          fileCount,
          totalSize: stats.size,
          version: '0.4.0',
          checksum
        };
      } catch (listError) {
        errors.push('Failed to list backup contents');
        isValid = false;
      }
    }

    metadata.isValid = isValid;
    metadata.errors = errors;

    return metadata;
  } catch (error) {
    return {
      isValid: false,
      errors: [
        ...errors,
        `Validation failed: ${error instanceof Error ? error.message : String(error)}`
      ],
      timestamp: new Date(),
      sourcePath: '',
      compressionLevel: 9,
      fileCount: 0,
      totalSize: 0,
      version: '0.4.0',
      checksum: ''
    };
  }
}

/**
 * Restores files from a backup to specified location.
 *
 * @param backupPath - Path to backup file
 * @param restorePath - Path to restore to
 * @throws {Error} If backup is invalid or restore fails
 *
 * @example
 * ```typescript
 * await restoreBackup('/path/to/backup.tar.gz', '/path/to/restore');
 * console.log('Restore complete');
 * ```
 *
 * @version 0.4.0
 * @since 0.4.0
 */
export async function restoreBackup(
  backupPath: string,
  restorePath: string
): Promise<void> {
  // Validate backup
  const metadata = await validateBackup(backupPath);
  if (!metadata.isValid) {
    throw new Error(`Invalid backup: ${metadata.errors.join(', ')}`);
  }

  // Create restore directory if needed
  if (!fs.existsSync(restorePath)) {
    fs.mkdirSync(restorePath, { recursive: true });
  }

  try {
    // Extract backup
    await execAsync(`tar -xzf "${backupPath}" -C "${restorePath}" --strip-components=1`);
  } catch (error) {
    throw new Error(`Failed to restore backup: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Creates a snapshot of directory with file checksums.
 *
 * @param sourcePath - Path to directory to snapshot
 * @returns Snapshot information
 * @throws {Error} If source path is invalid
 *
 * @example
 * ```typescript
 * const snapshot = await createSnapshot('/path/to/config');
 * console.log(`Snapshot contains ${snapshot.fileCount} files`);
 * ```
 *
 * @version 0.4.0
 * @since 0.4.0
 */
export async function createSnapshot(sourcePath: string): Promise<SnapshotInfo> {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source path does not exist: ${sourcePath}`);
  }

  if (!fs.statSync(sourcePath).isDirectory()) {
    throw new Error(`Source path is not a directory: ${sourcePath}`);
  }

  const files: FileInfo[] = [];
  const allFiles = getAllFiles(sourcePath);

  for (const filePath of allFiles) {
    const stats = fs.statSync(filePath);
    const relativePath = path.relative(sourcePath, filePath);

    files.push({
      path: relativePath,
      checksum: calculateChecksum(filePath),
      size: stats.size,
      modifiedTime: stats.mtime
    });
  }

  return {
    timestamp: new Date(),
    sourcePath,
    fileCount: files.length,
    files
  };
}
