import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@server': resolve(__dirname, './server'),
      '@tests': resolve(__dirname, './tests'),
    },
  },

  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8638',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },

  test: {
    // Use happy-dom for DOM environment simulation
    environment: 'happy-dom',

    // Global test setup
    globals: true,

    // Setup files to run before tests
    setupFiles: [resolve(__dirname, './tests/setup.ts')],

    // Test file patterns
    include: [
      'tests/unit/**/*.test.{ts,tsx}',
      'tests/integration/**/*.test.{ts,tsx}',
    ],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}', 'server/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.{ts,js}',
        '**/types/**',
        'src/test/',
      ],
      // TDD coverage targets - 95% minimum
      thresholds: {
        lines: 95,
        functions: 95,
        branches: 95,
        statements: 95,
      },
    },

    // Timeout settings
    testTimeout: 10000,
    hookTimeout: 10000,

    // Reporter configuration
    reporters: ['verbose', 'html'],
    outputFile: {
      html: './test-results/index.html',
    },

    // Bail on first failure in CI
    bail: process.env.CI ? 1 : 0,

    // Parallel test execution
    isolate: true,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
      },
    },
  },
});
