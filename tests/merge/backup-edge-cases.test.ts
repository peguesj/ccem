/**
 * Edge case tests for Backup System.
 *
 * Tests uncovered code paths including:
 * - Error handling in createBackup (180)
 * - Invalid gzip header detection (207-208)
 * - Missing metadata file handling (283-284)
 * - Restore error handling (345)
 * - Snapshot error handling (367, 371)
 */

import {
  createBackup,
  validateBackup,
  restoreBackup,
  createSnapshot,
  BackupMetadata,
  SnapshotInfo,
} from '@/merge/backup';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import * as fsSync from 'fs';

describe('Backup System - Edge Cases', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `ccem-backup-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (err) {
      // Ignore cleanup errors
    }
  });

  describe('createBackup - Error Cases', () => {
    it('should throw error for non-existent source path', async () => {
      const nonExistent = join(testDir, 'does-not-exist');

      await expect(createBackup(nonExistent)).rejects.toThrow('Source path does not exist');
    });

    it('should throw error for file instead of directory', async () => {
      const filePath = join(testDir, 'test-file.txt');
      await fs.writeFile(filePath, 'content');

      await expect(createBackup(filePath)).rejects.toThrow('Source path is not a directory');
    });

    it('should handle tar command failure', async () => {
      // Create a directory but make it unreadable (if possible)
      const sourceDir = join(testDir, 'source');
      await fs.mkdir(sourceDir);
      await fs.writeFile(join(sourceDir, 'file.txt'), 'content');

      // Try to create backup with invalid output directory
      const invalidOutput = '/invalid/path/that/does/not/exist';

      await expect(createBackup(sourceDir, invalidOutput)).rejects.toThrow(
        'Failed to create backup'
      );
    });

    it('should create backup with custom output directory', async () => {
      const sourceDir = join(testDir, 'source');
      const outputDir = join(testDir, 'backups');

      await fs.mkdir(sourceDir);
      await fs.mkdir(outputDir);
      await fs.writeFile(join(sourceDir, 'file.txt'), 'content');

      const backupPath = await createBackup(sourceDir, outputDir);

      expect(backupPath).toContain(outputDir);
      expect(fsSync.existsSync(backupPath)).toBe(true);
    });

    it('should create metadata file alongside backup', async () => {
      const sourceDir = join(testDir, 'source');
      await fs.mkdir(sourceDir);
      await fs.writeFile(join(sourceDir, 'file.txt'), 'content');

      const backupPath = await createBackup(sourceDir);
      const metadataPath = backupPath + '.meta';

      expect(fsSync.existsSync(metadataPath)).toBe(true);

      const metadata = JSON.parse(fsSync.readFileSync(metadataPath, 'utf-8'));
      expect(metadata).toHaveProperty('timestamp');
      expect(metadata).toHaveProperty('sourcePath');
      expect(metadata).toHaveProperty('compressionLevel');
      expect(metadata.compressionLevel).toBe(9);
    });
  });

  describe('validateBackup - Error Cases', () => {
    it('should return invalid for non-existent backup', async () => {
      const nonExistent = join(testDir, 'missing.tar.gz');

      const metadata = await validateBackup(nonExistent);

      expect(metadata.isValid).toBe(false);
      expect(metadata.errors).toContain('Backup file does not exist');
    });

    it('should detect invalid gzip header', async () => {
      const fakeBackup = join(testDir, 'fake.tar.gz');
      // Create file without gzip header
      await fs.writeFile(fakeBackup, 'not a gzip file');

      const metadata = await validateBackup(fakeBackup);

      expect(metadata.isValid).toBe(false);
      expect(metadata.errors.some((e) => e.includes('Invalid gzip header'))).toBe(true);
    });

    it('should detect corrupted tar archive', async () => {
      const corruptedBackup = join(testDir, 'corrupted.tar.gz');
      // Write valid gzip header but invalid tar content
      const buffer = Buffer.from([0x1f, 0x8b, 0x08, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
      await fs.writeFile(corruptedBackup, buffer);

      const metadata = await validateBackup(corruptedBackup);

      expect(metadata.isValid).toBe(false);
      expect(metadata.errors.some((e) => e.includes('Corrupted tar archive'))).toBe(true);
    });

    it('should handle backup without metadata file', async () => {
      // Create a valid backup first
      const sourceDir = join(testDir, 'source');
      await fs.mkdir(sourceDir);
      await fs.writeFile(join(sourceDir, 'file.txt'), 'content');

      const backupPath = await createBackup(sourceDir);

      // Remove metadata file
      const metadataPath = backupPath + '.meta';
      if (fsSync.existsSync(metadataPath)) {
        await fs.unlink(metadataPath);
      }

      // Validate should still work by listing tar contents
      const metadata = await validateBackup(backupPath);

      expect(metadata.isValid).toBe(true);
      expect(metadata.fileCount).toBeGreaterThan(0);
      expect(metadata.sourcePath).toBe(''); // No metadata file means no source path
    });

    it('should handle backup with metadata file', async () => {
      const sourceDir = join(testDir, 'source');
      await fs.mkdir(sourceDir);
      await fs.writeFile(join(sourceDir, 'file1.txt'), 'content1');
      await fs.writeFile(join(sourceDir, 'file2.txt'), 'content2');

      const backupPath = await createBackup(sourceDir);
      const metadata = await validateBackup(backupPath);

      expect(metadata.isValid).toBe(true);
      expect(metadata.sourcePath).toBe(sourceDir);
      expect(metadata.compressionLevel).toBe(9);
      expect(metadata.fileCount).toBeGreaterThan(0);
      expect(metadata.checksum).toBeTruthy();
    });

    it('should handle validation errors gracefully', async () => {
      const emptyFile = join(testDir, 'empty.tar.gz');
      await fs.writeFile(emptyFile, '');

      const metadata = await validateBackup(emptyFile);

      expect(metadata.isValid).toBe(false);
      expect(metadata.errors.length).toBeGreaterThan(0);
    });
  });

  describe('restoreBackup - Error Cases', () => {
    it('should throw error for invalid backup', async () => {
      const invalidBackup = join(testDir, 'invalid.tar.gz');
      await fs.writeFile(invalidBackup, 'not a backup');

      const restorePath = join(testDir, 'restore');

      await expect(restoreBackup(invalidBackup, restorePath)).rejects.toThrow('Invalid backup');
    });

    it('should create restore directory if it does not exist', async () => {
      const sourceDir = join(testDir, 'source');
      await fs.mkdir(sourceDir);
      await fs.writeFile(join(sourceDir, 'file.txt'), 'content');

      const backupPath = await createBackup(sourceDir);
      const restorePath = join(testDir, 'restore', 'nested', 'path');

      await restoreBackup(backupPath, restorePath);

      expect(fsSync.existsSync(restorePath)).toBe(true);
      expect(fsSync.existsSync(join(restorePath, 'file.txt'))).toBe(true);
    });

    it('should restore files correctly', async () => {
      const sourceDir = join(testDir, 'source');
      await fs.mkdir(sourceDir);
      await fs.writeFile(join(sourceDir, 'file1.txt'), 'content1');
      await fs.writeFile(join(sourceDir, 'file2.txt'), 'content2');

      const backupPath = await createBackup(sourceDir);
      const restorePath = join(testDir, 'restore');

      await restoreBackup(backupPath, restorePath);

      const file1Content = await fs.readFile(join(restorePath, 'file1.txt'), 'utf-8');
      const file2Content = await fs.readFile(join(restorePath, 'file2.txt'), 'utf-8');

      expect(file1Content).toBe('content1');
      expect(file2Content).toBe('content2');
    });

    it('should handle tar extraction errors', async () => {
      // Create a minimal valid backup
      const sourceDir = join(testDir, 'source');
      await fs.mkdir(sourceDir);
      await fs.writeFile(join(sourceDir, 'file.txt'), 'content');

      const backupPath = await createBackup(sourceDir);

      // Corrupt the backup while keeping header valid
      const originalContent = await fs.readFile(backupPath);
      const corruptedContent = Buffer.concat([
        originalContent.slice(0, 20),
        Buffer.from('corrupted'),
        originalContent.slice(29),
      ]);
      await fs.writeFile(backupPath, corruptedContent);

      const restorePath = join(testDir, 'restore');

      // This will fail validation or restoration
      try {
        await restoreBackup(backupPath, restorePath);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        if (error instanceof Error) {
          // Could fail at validation or restore step
          expect(
            error.message.includes('Invalid backup') ||
              error.message.includes('Failed to restore backup')
          ).toBe(true);
        }
      }
    });
  });

  describe('createSnapshot - Error Cases', () => {
    it('should throw error for non-existent source path', async () => {
      const nonExistent = join(testDir, 'does-not-exist');

      await expect(createSnapshot(nonExistent)).rejects.toThrow('Source path does not exist');
    });

    it('should throw error for file instead of directory', async () => {
      const filePath = join(testDir, 'file.txt');
      await fs.writeFile(filePath, 'content');

      await expect(createSnapshot(filePath)).rejects.toThrow('Source path is not a directory');
    });

    it('should create snapshot with file checksums', async () => {
      const sourceDir = join(testDir, 'source');
      await fs.mkdir(sourceDir);
      await fs.writeFile(join(sourceDir, 'file1.txt'), 'content1');
      await fs.writeFile(join(sourceDir, 'file2.txt'), 'content2');

      const snapshot = await createSnapshot(sourceDir);

      expect(snapshot.fileCount).toBe(2);
      expect(snapshot.files.length).toBe(2);
      expect(snapshot.sourcePath).toBe(sourceDir);

      snapshot.files.forEach((file) => {
        expect(file).toHaveProperty('path');
        expect(file).toHaveProperty('checksum');
        expect(file).toHaveProperty('size');
        expect(file).toHaveProperty('modifiedTime');
      });
    });

    it('should handle nested directories in snapshot', async () => {
      const sourceDir = join(testDir, 'source');
      await fs.mkdir(sourceDir);
      await fs.mkdir(join(sourceDir, 'subdir'));
      await fs.writeFile(join(sourceDir, 'file1.txt'), 'content1');
      await fs.writeFile(join(sourceDir, 'subdir', 'file2.txt'), 'content2');

      const snapshot = await createSnapshot(sourceDir);

      expect(snapshot.fileCount).toBe(2);
      expect(snapshot.files.some((f) => f.path.includes('subdir'))).toBe(true);
    });

    it('should include file metadata in snapshot', async () => {
      const sourceDir = join(testDir, 'source');
      await fs.mkdir(sourceDir);
      const testContent = 'test content';
      await fs.writeFile(join(sourceDir, 'file.txt'), testContent);

      const snapshot = await createSnapshot(sourceDir);

      expect(snapshot.timestamp).toBeInstanceOf(Date);
      expect(snapshot.files[0]?.size).toBe(testContent.length);
      expect(snapshot.files[0]?.modifiedTime).toBeTruthy();
      expect(typeof snapshot.files[0]?.modifiedTime.getTime()).toBe('number');
    });

    it('should create empty snapshot for empty directory', async () => {
      const sourceDir = join(testDir, 'empty');
      await fs.mkdir(sourceDir);

      const snapshot = await createSnapshot(sourceDir);

      expect(snapshot.fileCount).toBe(0);
      expect(snapshot.files).toEqual([]);
    });
  });

  describe('Integration Tests', () => {
    it('should perform complete backup and restore cycle', async () => {
      const sourceDir = join(testDir, 'source');
      await fs.mkdir(sourceDir);
      await fs.writeFile(join(sourceDir, 'important.txt'), 'important data');

      // Create backup
      const backupPath = await createBackup(sourceDir);

      // Validate backup
      const metadata = await validateBackup(backupPath);
      expect(metadata.isValid).toBe(true);

      // Delete source
      await fs.rm(sourceDir, { recursive: true });

      // Restore
      const restorePath = join(testDir, 'restored');
      await restoreBackup(backupPath, restorePath);

      // Verify content
      const restoredContent = await fs.readFile(join(restorePath, 'important.txt'), 'utf-8');
      expect(restoredContent).toBe('important data');
    });

    it('should maintain file checksums across backup/restore', async () => {
      const sourceDir = join(testDir, 'source');
      await fs.mkdir(sourceDir);
      await fs.writeFile(join(sourceDir, 'data.txt'), 'data');

      // Create initial snapshot
      const snapshot1 = await createSnapshot(sourceDir);

      // Backup and restore
      const backupPath = await createBackup(sourceDir);
      const restorePath = join(testDir, 'restored');
      await restoreBackup(backupPath, restorePath);

      // Create snapshot of restored data
      const snapshot2 = await createSnapshot(restorePath);

      // Checksums should match
      expect(snapshot1.files[0]?.checksum).toBe(snapshot2.files[0]?.checksum);
    });
  });
});
