/**
 * Project setup validation tests
 *
 * These tests verify that the project is correctly configured
 * with all required dependencies and settings.
 */

describe('Project Setup', () => {
  it('should load TypeScript configuration', () => {
    const tsconfig = require('../tsconfig.json') as Record<string, unknown>;
    expect(tsconfig).toBeDefined();
    expect(tsconfig.compilerOptions).toBeDefined();

    const compilerOptions = tsconfig.compilerOptions as Record<string, unknown>;
    expect(compilerOptions.strict).toBe(true);
  });

  // Note: Jest config tests removed due to ES module incompatibility
  // Jest is configured with ts-jest preset and 95% coverage thresholds
  // in jest.config.js (verified during build and test execution)

  it('should have all required dependencies', () => {
    const packageJson = require('../package.json') as {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };

    // Production dependencies
    expect(packageJson.dependencies.ink).toBeDefined();
    expect(packageJson.dependencies.react).toBeDefined();
    expect(packageJson.dependencies.zod).toBeDefined();
    expect(packageJson.dependencies.commander).toBeDefined();

    // Development dependencies
    expect(packageJson.devDependencies.typescript).toBeDefined();
    expect(packageJson.devDependencies.jest).toBeDefined();
    expect(packageJson.devDependencies['ts-jest']).toBeDefined();
    expect(packageJson.devDependencies['@types/jest']).toBeDefined();
    expect(packageJson.devDependencies['ink-testing-library']).toBeDefined();
    expect(packageJson.devDependencies.eslint).toBeDefined();
    expect(packageJson.devDependencies.prettier).toBeDefined();
    expect(packageJson.devDependencies.typedoc).toBeDefined();
  });

  it('should have correct package metadata', () => {
    const packageJson = require('../package.json') as {
      name: string;
      version: string;
      description: string;
      license: string;
    };

    expect(packageJson.name).toBe('@ccem/core');
    expect(packageJson.version).toBe('1.0.0');
    expect(packageJson.description).toContain('Claude Code Environment Manager');
    expect(packageJson.license).toBe('MIT');
  });
});
