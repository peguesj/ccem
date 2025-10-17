/**
 * CLI execution helper for integration tests
 *
 * @packageDocumentation
 * @module tests/integration/helpers
 */

import { spawn } from 'child_process';
import * as path from 'path';

/**
 * CLI execution result
 */
export interface CLIResult {
  /** Exit code */
  exitCode: number;
  /** Standard output */
  stdout: string;
  /** Standard error */
  stderr: string;
  /** Execution time in milliseconds */
  executionTime: number;
  /** Whether command succeeded */
  success: boolean;
}

/**
 * CLI execution options
 */
export interface CLIOptions {
  /** Working directory */
  cwd?: string;
  /** Environment variables */
  env?: Record<string, string>;
  /** Input to pipe to stdin */
  input?: string;
  /** Timeout in milliseconds */
  timeout?: number;
}

/**
 * Executes a CLI command and captures output
 *
 * @param args - Command arguments
 * @param options - Execution options
 * @returns CLI result
 *
 * @example
 * ```typescript
 * const result = await execCLI(['merge', '--strategy', 'recommended']);
 * expect(result.success).toBe(true);
 * expect(result.stdout).toContain('Merge complete');
 * ```
 */
export async function execCLI(
  args: string[],
  options: CLIOptions = {}
): Promise<CLIResult> {
  const startTime = Date.now();

  // Path to CLI executable
  const cliPath = path.join(__dirname, '../../../dist/cli.js');

  return new Promise((resolve, reject) => {
    const child = spawn('node', [cliPath, ...args], {
      cwd: options.cwd || process.cwd(),
      env: {
        ...process.env,
        ...options.env,
        NODE_ENV: 'test'
      },
      timeout: options.timeout || 10000
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    // Handle input
    if (options.input) {
      child.stdin?.write(options.input);
      child.stdin?.end();
    }

    // Handle timeout
    const timeoutId = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
    }, options.timeout || 10000);

    child.on('close', (exitCode) => {
      clearTimeout(timeoutId);

      const executionTime = Date.now() - startTime;

      if (timedOut) {
        reject(new Error(`Command timed out after ${options.timeout || 10000}ms`));
        return;
      }

      resolve({
        exitCode: exitCode || 0,
        stdout,
        stderr,
        executionTime,
        success: exitCode === 0
      });
    });

    child.on('error', (error) => {
      clearTimeout(timeoutId);
      reject(error);
    });
  });
}

/**
 * Executes CLI command and expects success
 *
 * @param args - Command arguments
 * @param options - Execution options
 * @returns CLI result
 * @throws {Error} If command fails
 */
export async function execCLIExpectSuccess(
  args: string[],
  options: CLIOptions = {}
): Promise<CLIResult> {
  const result = await execCLI(args, options);

  if (!result.success) {
    throw new Error(
      `CLI command failed with exit code ${result.exitCode}\n` +
      `stdout: ${result.stdout}\n` +
      `stderr: ${result.stderr}`
    );
  }

  return result;
}

/**
 * Executes CLI command and expects failure
 *
 * @param args - Command arguments
 * @param options - Execution options
 * @returns CLI result
 * @throws {Error} If command succeeds
 */
export async function execCLIExpectFailure(
  args: string[],
  options: CLIOptions = {}
): Promise<CLIResult> {
  const result = await execCLI(args, options);

  if (result.success) {
    throw new Error(
      `Expected CLI command to fail but it succeeded\n` +
      `stdout: ${result.stdout}\n` +
      `stderr: ${result.stderr}`
    );
  }

  return result;
}
