import {
  detectConflicts,
  ConflictReport,
  ConflictType,
  ConflictSeverity,
  ResolutionStrategy
} from '@/merge/conflict-detector';
import { MergeConfig } from '@/merge/strategies';

describe('Conflict Detector', () => {
  const config1: MergeConfig = {
    permissions: ['Read(*)', 'Write(src/*)'],
    mcpServers: { linear: { enabled: true, apiKey: 'key1' } },
    settings: { theme: 'dark', tabSize: 2 }
  };

  const config2: MergeConfig = {
    permissions: ['Read(src/*)', 'Write(tests/*)'],
    mcpServers: { linear: { enabled: true, apiKey: 'key2' } },
    settings: { theme: 'light', tabSize: 2 }
  };

  describe('Permission Conflicts', () => {
    it('should detect permission overlap conflicts', () => {
      const report = detectConflicts([config1, config2]);

      const permissionConflicts = report.conflicts.filter(
        c => c.type === 'permission-overlap'
      );
      expect(permissionConflicts.length).toBeGreaterThan(0);
    });

    it('should detect permission scope hierarchy', () => {
      const globalConfig = {
        permissions: ['Read(*)'],
        mcpServers: {},
        settings: {}
      };

      const specificConfig = {
        permissions: ['Read(src/*)'],
        mcpServers: {},
        settings: {}
      };

      const report = detectConflicts([globalConfig, specificConfig]);

      const hierarchyConflict = report.conflicts.find(
        c => c.type === 'permission-hierarchy'
      );
      expect(hierarchyConflict).toBeDefined();
    });

    it('should suggest resolution for permission conflicts', () => {
      const report = detectConflicts([config1, config2]);

      const permissionConflicts = report.conflicts.filter(
        c => c.type === 'permission-overlap' || c.type === 'permission-hierarchy'
      );

      permissionConflicts.forEach(conflict => {
        expect(conflict.resolutionStrategies).toBeDefined();
        expect(conflict.resolutionStrategies.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Setting Value Conflicts', () => {
    it('should detect setting value conflicts', () => {
      const report = detectConflicts([config1, config2]);

      const settingConflicts = report.conflicts.filter(
        c => c.type === 'setting-value'
      );
      expect(settingConflicts.length).toBeGreaterThan(0);

      const themeConflict = settingConflicts.find(c => c.path === 'settings.theme');
      expect(themeConflict).toBeDefined();
      expect(themeConflict?.values).toContain('dark');
      expect(themeConflict?.values).toContain('light');
    });

    it('should not flag identical settings as conflicts', () => {
      const report = detectConflicts([config1, config2]);

      const tabSizeConflict = report.conflicts.find(
        c => c.path === 'settings.tabSize'
      );
      expect(tabSizeConflict).toBeUndefined();
    });

    it('should provide context for setting conflicts', () => {
      const report = detectConflicts([config1, config2]);

      const settingConflicts = report.conflicts.filter(
        c => c.type === 'setting-value'
      );

      settingConflicts.forEach(conflict => {
        expect(conflict.context).toBeDefined();
        expect(conflict.context.affectedProjects).toBeDefined();
        expect(conflict.context.affectedProjects.length).toBeGreaterThan(0);
      });
    });
  });

  describe('MCP Server Conflicts', () => {
    it('should detect MCP server configuration conflicts', () => {
      const report = detectConflicts([config1, config2]);

      const mcpConflicts = report.conflicts.filter(
        c => c.type === 'mcp-config'
      );
      expect(mcpConflicts.length).toBeGreaterThan(0);
    });

    it('should identify specific MCP conflict fields', () => {
      const report = detectConflicts([config1, config2]);

      const linearConflict = report.conflicts.find(
        c => c.type === 'mcp-config' && c.path.includes('linear')
      );
      expect(linearConflict).toBeDefined();
    });

    it('should suggest resolution strategies for MCP conflicts', () => {
      const report = detectConflicts([config1, config2]);

      const mcpConflicts = report.conflicts.filter(
        c => c.type === 'mcp-config'
      );

      mcpConflicts.forEach(conflict => {
        expect(conflict.resolutionStrategies).toBeDefined();
        expect(conflict.resolutionStrategies).toContain('manual-review');
      });
    });
  });

  describe('Resolution Suggestions', () => {
    it('should provide multiple resolution strategies', () => {
      const report = detectConflicts([config1, config2]);

      report.conflicts.forEach(conflict => {
        expect(conflict.resolutionStrategies).toBeInstanceOf(Array);
        expect(conflict.resolutionStrategies.length).toBeGreaterThan(0);
      });
    });

    it('should include recommended resolution', () => {
      const report = detectConflicts([config1, config2]);

      report.conflicts.forEach(conflict => {
        expect(conflict.recommendedResolution).toBeDefined();
        expect(conflict.resolutionStrategies).toContain(
          conflict.recommendedResolution
        );
      });
    });

    it('should provide resolution rationale', () => {
      const report = detectConflicts([config1, config2]);

      report.conflicts.forEach(conflict => {
        expect(conflict.resolutionRationale).toBeDefined();
        expect(typeof conflict.resolutionRationale).toBe('string');
        expect(conflict.resolutionRationale.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Conflict Severity', () => {
    it('should assign severity levels to conflicts', () => {
      const report = detectConflicts([config1, config2]);

      report.conflicts.forEach(conflict => {
        expect(conflict.severity).toBeDefined();
        expect(['low', 'medium', 'high', 'critical']).toContain(
          conflict.severity
        );
      });
    });

    it('should mark MCP conflicts as high severity', () => {
      const report = detectConflicts([config1, config2]);

      const mcpConflicts = report.conflicts.filter(
        c => c.type === 'mcp-config'
      );

      mcpConflicts.forEach(conflict => {
        expect(['high', 'critical']).toContain(conflict.severity);
      });
    });

    it('should mark permission overlaps as medium severity', () => {
      const report = detectConflicts([config1, config2]);

      const permConflicts = report.conflicts.filter(
        c => c.type === 'permission-overlap'
      );

      permConflicts.forEach(conflict => {
        expect(['medium', 'high']).toContain(conflict.severity);
      });
    });
  });

  describe('Conflict Report Summary', () => {
    it('should provide summary statistics', () => {
      const report = detectConflicts([config1, config2]);

      expect(report.summary).toBeDefined();
      expect(report.summary.totalConflicts).toBe(report.conflicts.length);
      expect(report.summary.conflictsByType).toBeDefined();
      expect(report.summary.conflictsBySeverity).toBeDefined();
    });

    it('should categorize conflicts by type', () => {
      const report = detectConflicts([config1, config2]);

      const types: ConflictType[] = [
        'permission-overlap',
        'permission-hierarchy',
        'setting-value',
        'mcp-config'
      ];

      types.forEach(type => {
        expect(report.summary.conflictsByType[type]).toBeDefined();
        expect(typeof report.summary.conflictsByType[type]).toBe('number');
      });
    });

    it('should categorize conflicts by severity', () => {
      const report = detectConflicts([config1, config2]);

      const severities: ConflictSeverity[] = ['low', 'medium', 'high', 'critical'];

      severities.forEach(severity => {
        expect(report.summary.conflictsBySeverity[severity]).toBeDefined();
        expect(typeof report.summary.conflictsBySeverity[severity]).toBe('number');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty config arrays', () => {
      const report = detectConflicts([]);

      expect(report.conflicts).toEqual([]);
      expect(report.summary.totalConflicts).toBe(0);
    });

    it('should handle single config without conflicts', () => {
      const report = detectConflicts([config1]);

      expect(report.conflicts).toEqual([]);
      expect(report.summary.totalConflicts).toBe(0);
    });

    it('should handle deeply nested conflicts', () => {
      const nested1 = {
        permissions: [],
        mcpServers: {},
        settings: {
          editor: {
            formatting: {
              tabSize: 2,
              insertSpaces: true
            }
          }
        }
      };

      const nested2 = {
        permissions: [],
        mcpServers: {},
        settings: {
          editor: {
            formatting: {
              tabSize: 4,
              insertSpaces: true
            }
          }
        }
      };

      const report = detectConflicts([nested1, nested2]);

      const nestedConflict = report.conflicts.find(
        c => c.path.includes('editor.formatting.tabSize')
      );
      expect(nestedConflict).toBeDefined();
    });

    it('should handle null and undefined values', () => {
      const withNull = {
        permissions: [],
        mcpServers: {},
        settings: { theme: null }
      };

      const withUndefined = {
        permissions: [],
        mcpServers: {},
        settings: { theme: undefined }
      };

      const report = detectConflicts([withNull, withUndefined]);

      expect(report).toBeDefined();
      expect(report.conflicts).toBeDefined();
    });
  });
});
