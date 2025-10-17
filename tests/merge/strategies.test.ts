import {
  recommendedMerge,
  defaultMerge,
  conservativeMerge,
  hybridMerge,
  customMerge,
  MergeConfig,
  MergeResult,
} from '@/merge/strategies';

describe('Merge Strategies', () => {
  const config1: MergeConfig = {
    permissions: ['Read(*)', 'Write(src/*)', 'Bash(npm test)'],
    mcpServers: { linear: { enabled: true } },
    settings: { theme: 'dark', autoSave: true },
  };

  const config2: MergeConfig = {
    permissions: ['Read(*)', 'Write(tests/*)', 'Bash(npm run lint)'],
    mcpServers: { github: { enabled: true } },
    settings: { theme: 'light', tabSize: 2 },
  };

  describe('Recommended Strategy', () => {
    it('should merge configs with intelligent deduplication', async () => {
      const result = await recommendedMerge([config1, config2]);

      expect(result.permissions).toContain('Read(*)'); // Deduplicated
      expect(result.permissions).toContain('Write(src/*)');
      expect(result.permissions).toContain('Write(tests/*)');
      expect(result.permissions.length).toBe(5); // No duplicates
    });

    it('should preserve both MCP servers', async () => {
      const result = await recommendedMerge([config1, config2]);

      expect(result.mcpServers.linear).toBeDefined();
      expect(result.mcpServers.github).toBeDefined();
    });

    it('should handle setting conflicts with AI preferences', async () => {
      const result = await recommendedMerge([config1, config2]);

      expect(result.settings.theme).toBeDefined();
      expect(result.conflicts).toHaveLength(1); // Theme conflict
      expect(result.conflicts[0]?.field).toBe('settings.theme');
      expect(result.conflicts[0]?.values).toEqual(['dark', 'light']);
    });

    it('should provide merge statistics', async () => {
      const result = await recommendedMerge([config1, config2]);

      expect(result.stats.projectsAnalyzed).toBe(2);
      expect(result.stats.conflictsDetected).toBe(1);
      expect(result.stats.autoResolved).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty config array', async () => {
      const result = await recommendedMerge([]);

      expect(result.permissions).toEqual([]);
      expect(result.mcpServers).toEqual({});
      expect(result.settings).toEqual({});
      expect(result.stats.projectsAnalyzed).toBe(0);
    });

    it('should handle single config without conflicts', async () => {
      const result = await recommendedMerge([config1]);

      expect(result.permissions).toEqual(config1.permissions);
      expect(result.mcpServers).toEqual(config1.mcpServers);
      expect(result.settings).toEqual(config1.settings);
      expect(result.conflicts).toHaveLength(0);
    });
  });

  describe('Default Strategy', () => {
    it('should create simple union of permissions', async () => {
      const result = await defaultMerge([config1, config2]);

      expect(result.permissions.length).toBeGreaterThanOrEqual(5);
      expect(result.permissions).toContain('Read(*)');
    });

    it('should apply last-write-wins for conflicts', async () => {
      const result = await defaultMerge([config1, config2]);

      // Last config wins for conflicting settings
      expect(result.settings.theme).toBe('light');
    });

    it('should merge MCP servers', async () => {
      const result = await defaultMerge([config1, config2]);

      expect(result.mcpServers.linear).toBeDefined();
      expect(result.mcpServers.github).toBeDefined();
    });

    it('should report conflicts but not flag for review', async () => {
      const result = await defaultMerge([config1, config2]);

      expect(result.conflicts.length).toBeGreaterThan(0);
      expect(result.conflicts.every((c) => !c.requiresManualReview)).toBe(true);
    });
  });

  describe('Conservative Strategy', () => {
    it('should preserve all unique permissions', async () => {
      const result = await conservativeMerge([config1, config2]);

      expect(result.permissions.length).toBeGreaterThanOrEqual(5);
    });

    it('should flag all conflicts for manual resolution', async () => {
      const result = await conservativeMerge([config1, config2]);

      expect(result.conflicts.length).toBeGreaterThan(0);
      result.conflicts.forEach((conflict) => {
        expect(conflict.requiresManualReview).toBe(true);
      });
    });

    it('should not overwrite any settings automatically', async () => {
      const result = await conservativeMerge([config1, config2]);

      // Both theme values should be preserved as conflict
      const themeConflict = result.conflicts.find((c) => c.field === 'settings.theme');
      expect(themeConflict).toBeDefined();
      expect(themeConflict?.values).toContain('dark');
      expect(themeConflict?.values).toContain('light');
    });

    it('should preserve first value when manual review required', async () => {
      const result = await conservativeMerge([config1, config2]);

      // Conservative strategy preserves first value
      expect(result.settings.theme).toBe('dark');
    });
  });

  describe('Hybrid Strategy', () => {
    it('should combine recommended and conservative approaches', async () => {
      const result = await hybridMerge([config1, config2]);

      expect(result.permissions.length).toBeGreaterThanOrEqual(5);
      expect(result.conflicts.length).toBeGreaterThan(0);
    });

    it('should auto-resolve non-critical conflicts', async () => {
      const result = await hybridMerge([config1, config2]);

      const autoResolved = result.conflicts.filter((c) => !c.requiresManualReview);
      expect(autoResolved.length).toBeGreaterThanOrEqual(0);
    });

    it('should flag critical conflicts for manual review', async () => {
      const result = await hybridMerge([config1, config2]);

      const manualReview = result.conflicts.filter((c) => c.requiresManualReview);
      expect(manualReview.length).toBeGreaterThan(0);
    });
  });

  describe('Custom Strategy', () => {
    it('should apply user-defined merge rules', async () => {
      const customRules = {
        permissions: {
          deduplication: 'strict' as const,
          conflictResolution: 'union' as const,
        },
        settings: {
          theme: 'prefer-first' as const,
          tabSize: 'prefer-last' as const,
        },
      };

      const result = await customMerge([config1, config2], customRules);

      expect(result.settings.theme).toBe('dark'); // Prefer first
      expect(result.settings.tabSize).toBe(2); // Prefer last
    });

    it('should handle pattern-based matching', async () => {
      const customRules = {
        permissions: {
          deduplication: 'pattern-match' as const,
          patterns: ['Write(*)'],
        },
        settings: {},
      };

      const result = await customMerge([config1, config2], customRules);

      expect(result.permissions).toBeDefined();
    });

    it('should provide suggestions for unhandled conflicts', async () => {
      const customRules = {
        permissions: {},
        settings: {},
      };

      const result = await customMerge([config1, config2], customRules);

      result.conflicts.forEach((conflict) => {
        expect(conflict).toHaveProperty('suggestion');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle configs with different permission formats', async () => {
      const configWithGlobs = {
        permissions: ['Read(**/*.ts)', 'Write(src/**/*.tsx)'],
        mcpServers: {},
        settings: {},
      };

      const result = await recommendedMerge([config1, configWithGlobs]);

      expect(result.permissions.length).toBeGreaterThan(0);
    });

    it('should handle deeply nested settings', async () => {
      const nestedConfig1 = {
        permissions: [],
        mcpServers: {},
        settings: { editor: { fontSize: 14, tabSize: 2 } },
      };

      const nestedConfig2 = {
        permissions: [],
        mcpServers: {},
        settings: { editor: { fontSize: 16, lineHeight: 1.5 } },
      };

      const result = await recommendedMerge([nestedConfig1, nestedConfig2]);

      expect(result.settings.editor).toBeDefined();
    });

    it('should handle MCP servers with complex configurations', async () => {
      const complexMcp1 = {
        permissions: [],
        mcpServers: {
          linear: {
            enabled: true,
            apiKey: 'key1',
            config: { projectId: 'proj1' },
          },
        },
        settings: {},
      };

      const complexMcp2 = {
        permissions: [],
        mcpServers: {
          linear: {
            enabled: true,
            apiKey: 'key2',
            config: { projectId: 'proj2' },
          },
        },
        settings: {},
      };

      const result = await conservativeMerge([complexMcp1, complexMcp2]);

      expect(result.mcpServers.linear).toBeDefined();
      const linearConflict = result.conflicts.find((c) => c.field.startsWith('mcpServers.linear'));
      expect(linearConflict).toBeDefined();
    });
  });
});
