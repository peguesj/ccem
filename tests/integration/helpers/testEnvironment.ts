/**
 * Test environment setup and teardown utilities
 *
 * @packageDocumentation
 * @module tests/integration/helpers
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { createTestClaudeDir, createTestConfig } from './createTestConfig.js';
import type { MergeConfig } from '../../../src/merge/strategies.js';

/**
 * Test environment
 */
export class TestEnvironment {
  private tempDirs: string[] = [];
  public rootDir: string;

  constructor() {
    // Create unique temp directory for this test run
    this.rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ccem-test-'));
    this.tempDirs.push(this.rootDir);
  }

  /**
   * Creates a temporary directory
   *
   * @param name - Optional directory name
   * @returns Path to created directory
   */
  createTempDir(name?: string): string {
    const dirPath = name
      ? path.join(this.rootDir, name)
      : fs.mkdtempSync(path.join(this.rootDir, 'temp-'));

    fs.mkdirSync(dirPath, { recursive: true });
    this.tempDirs.push(dirPath);

    return dirPath;
  }

  /**
   * Creates a project directory with .claude config
   *
   * @param name - Project name
   * @param config - Optional config
   * @returns Path to project directory
   */
  createProject(name: string, config?: MergeConfig): string {
    const projectDir = this.createTempDir(name);
    const testConfig = config || createTestConfig({
      includePermissions: true,
      includeMcpServers: true,
      includeSettings: true
    });

    createTestClaudeDir(projectDir, testConfig);

    return projectDir;
  }

  /**
   * Creates multiple projects for merge testing
   *
   * @param count - Number of projects
   * @returns Array of project paths
   */
  createMultipleProjects(count: number): string[] {
    const projects: string[] = [];

    for (let i = 0; i < count; i++) {
      const projectDir = this.createProject(`project-${i}`);
      projects.push(projectDir);
    }

    return projects;
  }

  /**
   * Creates a file in the test environment
   *
   * @param relativePath - Path relative to root
   * @param content - File content
   * @returns Absolute file path
   */
  createFile(relativePath: string, content: string): string {
    const filePath = path.join(this.rootDir, relativePath);
    const dir = path.dirname(filePath);

    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, content);

    return filePath;
  }

  /**
   * Reads a file from the test environment
   *
   * @param relativePath - Path relative to root
   * @returns File content
   */
  readFile(relativePath: string): string {
    const filePath = path.join(this.rootDir, relativePath);
    return fs.readFileSync(filePath, 'utf-8');
  }

  /**
   * Checks if file exists in test environment
   *
   * @param relativePath - Path relative to root
   * @returns True if file exists
   */
  fileExists(relativePath: string): boolean {
    const filePath = path.join(this.rootDir, relativePath);
    return fs.existsSync(filePath);
  }

  /**
   * Gets absolute path within test environment
   *
   * @param relativePath - Path relative to root
   * @returns Absolute path
   */
  getPath(relativePath: string): string {
    return path.join(this.rootDir, relativePath);
  }

  /**
   * Lists files in directory
   *
   * @param relativePath - Directory path relative to root
   * @returns Array of file names
   */
  listFiles(relativePath: string = ''): string[] {
    const dirPath = path.join(this.rootDir, relativePath);

    if (!fs.existsSync(dirPath)) {
      return [];
    }

    return fs.readdirSync(dirPath);
  }

  /**
   * Cleans up all temporary directories and files
   */
  cleanup(): void {
    for (const dir of this.tempDirs) {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    }
    this.tempDirs = [];
  }

  /**
   * Gets statistics about test environment
   *
   * @returns Environment stats
   */
  getStats(): {
    tempDirs: number;
    totalFiles: number;
    totalSize: number;
  } {
    let totalFiles = 0;
    let totalSize = 0;

    const countFiles = (dir: string): void => {
      if (!fs.existsSync(dir)) return;

      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          countFiles(fullPath);
        } else {
          totalFiles++;
          totalSize += fs.statSync(fullPath).size;
        }
      }
    };

    countFiles(this.rootDir);

    return {
      tempDirs: this.tempDirs.length,
      totalFiles,
      totalSize
    };
  }
}

/**
 * Creates and manages test environment
 *
 * @returns Test environment
 */
export function createTestEnvironment(): TestEnvironment {
  return new TestEnvironment();
}
