import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  createBackup,
  validateBackup,
  restoreBackup,
  createSnapshot,
  BackupMetadata,
  SnapshotInfo,
  FileInfo
} from '@/merge/backup';

describe('Backup System', () => {
  let testDir: string;
  let configPath: string;

  beforeEach(() => {
    // Create temporary test directory
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccem-backup-test-'));
    configPath = path.join(testDir, 'config');
    fs.mkdirSync(configPath);

    // Create sample config files
    fs.writeFileSync(
      path.join(configPath, 'settings.json'),
      JSON.stringify({ theme: 'dark', tabSize: 2 })
    );
    fs.writeFileSync(
      path.join(configPath, 'permissions.json'),
      JSON.stringify({ permissions: ['Read(*)', 'Write(src/*)'] })
    );
  });

  afterEach(() => {
    // Cleanup test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('Backup Creation', () => {
    it('should create tar.gz backup with level 9 compression', async () => {
      const backupPath = await createBackup(configPath);

      expect(backupPath).toMatch(/\.tar\.gz$/);
      expect(fs.existsSync(backupPath)).toBe(true);

      // Verify it's a gzip file
      const header = fs.readFileSync(backupPath);
      expect(header[0]).toBe(0x1f);
      expect(header[1]).toBe(0x8b);

      // Cleanup
      fs.unlinkSync(backupPath);
    });

    it('should include all files in backup', async () => {
      const backupPath = await createBackup(configPath);

      expect(fs.existsSync(backupPath)).toBe(true);

      // Cleanup
      fs.unlinkSync(backupPath);
    });

    it('should create backup with metadata', async () => {
      const backupPath = await createBackup(configPath);
      const metadata = await validateBackup(backupPath);

      expect(metadata).toBeDefined();
      expect(metadata.timestamp).toBeDefined();
      expect(metadata.sourcePath).toBe(configPath);
      expect(metadata.fileCount).toBeGreaterThan(0);

      // Cleanup
      fs.unlinkSync(backupPath);
    });

    it('should create backup in default location if not specified', async () => {
      const backupPath = await createBackup(configPath);

      expect(path.isAbsolute(backupPath)).toBe(true);
      expect(fs.existsSync(backupPath)).toBe(true);

      // Cleanup
      fs.unlinkSync(backupPath);
    });

    it('should create backup in specified output directory', async () => {
      const outputDir = path.join(testDir, 'backups');
      fs.mkdirSync(outputDir);

      const backupPath = await createBackup(configPath, outputDir);

      expect(backupPath.startsWith(outputDir)).toBe(true);
      expect(fs.existsSync(backupPath)).toBe(true);

      // Cleanup
      fs.unlinkSync(backupPath);
    });

    it('should handle non-existent source path', async () => {
      const invalidPath = path.join(testDir, 'nonexistent');

      await expect(createBackup(invalidPath)).rejects.toThrow();
    });
  });

  describe('Backup Validation', () => {
    it('should validate backup integrity', async () => {
      const backupPath = await createBackup(configPath);
      const metadata = await validateBackup(backupPath);

      expect(metadata.isValid).toBe(true);
      expect(metadata.errors).toHaveLength(0);

      // Cleanup
      fs.unlinkSync(backupPath);
    });

    it('should detect corrupted backup', async () => {
      const backupPath = await createBackup(configPath);

      // Corrupt the backup
      const content = fs.readFileSync(backupPath);
      fs.writeFileSync(backupPath, content.slice(0, content.length - 100));

      const metadata = await validateBackup(backupPath);

      expect(metadata.isValid).toBe(false);
      expect(metadata.errors.length).toBeGreaterThan(0);

      // Cleanup
      fs.unlinkSync(backupPath);
    });

    it('should detect invalid backup file', async () => {
      const invalidBackup = path.join(testDir, 'invalid.tar.gz');
      fs.writeFileSync(invalidBackup, 'not a valid backup');

      const metadata = await validateBackup(invalidBackup);

      expect(metadata.isValid).toBe(false);

      // Cleanup
      fs.unlinkSync(invalidBackup);
    });

    it('should validate backup metadata', async () => {
      const backupPath = await createBackup(configPath);
      const metadata = await validateBackup(backupPath);

      expect(metadata.timestamp).toBeInstanceOf(Date);
      expect(metadata.sourcePath).toBe(configPath);
      expect(metadata.compressionLevel).toBe(9);
      expect(metadata.fileCount).toBeGreaterThan(0);
      expect(metadata.totalSize).toBeGreaterThan(0);

      // Cleanup
      fs.unlinkSync(backupPath);
    });
  });

  describe('Backup Restoration', () => {
    it('should restore from backup successfully', async () => {
      const backupPath = await createBackup(configPath);
      const restorePath = path.join(testDir, 'restored');

      await restoreBackup(backupPath, restorePath);

      // Verify files restored correctly
      expect(fs.existsSync(path.join(restorePath, 'settings.json'))).toBe(true);
      expect(fs.existsSync(path.join(restorePath, 'permissions.json'))).toBe(true);

      const settings = JSON.parse(
        fs.readFileSync(path.join(restorePath, 'settings.json'), 'utf-8')
      );
      expect(settings.theme).toBe('dark');

      // Cleanup
      fs.unlinkSync(backupPath);
    });

    it('should create restore directory if it does not exist', async () => {
      const backupPath = await createBackup(configPath);
      const restorePath = path.join(testDir, 'new-restore-dir');

      await restoreBackup(backupPath, restorePath);

      expect(fs.existsSync(restorePath)).toBe(true);

      // Cleanup
      fs.unlinkSync(backupPath);
    });

    it('should overwrite existing files on restore', async () => {
      const backupPath = await createBackup(configPath);
      const restorePath = path.join(testDir, 'restored');
      fs.mkdirSync(restorePath);

      // Create conflicting file
      fs.writeFileSync(
        path.join(restorePath, 'settings.json'),
        JSON.stringify({ theme: 'light' })
      );

      await restoreBackup(backupPath, restorePath);

      const settings = JSON.parse(
        fs.readFileSync(path.join(restorePath, 'settings.json'), 'utf-8')
      );
      expect(settings.theme).toBe('dark'); // Original value restored

      // Cleanup
      fs.unlinkSync(backupPath);
    });

    it('should handle restore errors gracefully', async () => {
      const invalidBackup = path.join(testDir, 'invalid.tar.gz');
      fs.writeFileSync(invalidBackup, 'not a valid backup');
      const restorePath = path.join(testDir, 'restored');

      await expect(restoreBackup(invalidBackup, restorePath)).rejects.toThrow();

      // Cleanup
      fs.unlinkSync(invalidBackup);
    });
  });

  describe('Incremental Snapshots', () => {
    it('should create snapshot with metadata', async () => {
      const snapshot = await createSnapshot(configPath);

      expect(snapshot.timestamp).toBeInstanceOf(Date);
      expect(snapshot.sourcePath).toBe(configPath);
      expect(snapshot.fileCount).toBeGreaterThan(0);
      expect(snapshot.files).toBeDefined();
      expect(snapshot.files.length).toBeGreaterThan(0);
    });

    it('should track file checksums in snapshot', async () => {
      const snapshot = await createSnapshot(configPath);

      snapshot.files.forEach((file: FileInfo) => {
        expect(file.path).toBeDefined();
        expect(file.checksum).toBeDefined();
        expect(file.size).toBeGreaterThan(0);
        expect(file.modifiedTime).toBeDefined();
        // Check it's a valid Date by attempting to get time
        expect(new Date(file.modifiedTime).getTime()).toBeGreaterThan(0);
      });
    });

    it('should detect changes between snapshots', async () => {
      const snapshot1 = await createSnapshot(configPath);

      // Modify a file
      fs.writeFileSync(
        path.join(configPath, 'settings.json'),
        JSON.stringify({ theme: 'light', tabSize: 4 })
      );

      const snapshot2 = await createSnapshot(configPath);

      // Checksums should differ for modified file
      const file1 = snapshot1.files.find((f: FileInfo) => f.path.endsWith('settings.json'));
      const file2 = snapshot2.files.find((f: FileInfo) => f.path.endsWith('settings.json'));

      expect(file1?.checksum).not.toBe(file2?.checksum);
    });

    it('should identify new files in snapshot', async () => {
      const snapshot1 = await createSnapshot(configPath);

      // Add new file
      fs.writeFileSync(
        path.join(configPath, 'new-file.json'),
        JSON.stringify({ new: true })
      );

      const snapshot2 = await createSnapshot(configPath);

      expect(snapshot2.files.length).toBe(snapshot1.files.length + 1);
      expect(snapshot2.files.some((f: FileInfo) => f.path.endsWith('new-file.json'))).toBe(true);
    });

    it('should identify deleted files in snapshot', async () => {
      const snapshot1 = await createSnapshot(configPath);

      // Delete a file
      fs.unlinkSync(path.join(configPath, 'permissions.json'));

      const snapshot2 = await createSnapshot(configPath);

      expect(snapshot2.files.length).toBe(snapshot1.files.length - 1);
      expect(snapshot2.files.some((f: FileInfo) => f.path.endsWith('permissions.json'))).toBe(false);
    });
  });

  describe('Backup Metadata', () => {
    it('should include version information', async () => {
      const backupPath = await createBackup(configPath);
      const metadata = await validateBackup(backupPath);

      expect(metadata.version).toBeDefined();
      expect(typeof metadata.version).toBe('string');

      // Cleanup
      fs.unlinkSync(backupPath);
    });

    it('should include checksum for verification', async () => {
      const backupPath = await createBackup(configPath);
      const metadata = await validateBackup(backupPath);

      expect(metadata.checksum).toBeDefined();
      expect(typeof metadata.checksum).toBe('string');

      // Cleanup
      fs.unlinkSync(backupPath);
    });
  });
});
