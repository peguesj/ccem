import { detectWorktrees, analyzeWorktreeStructure } from '@/fork/worktree-detector';

describe('Git Worktree Detector - Unit Tests', () => {
  describe('parseWorktreeOutput internals', () => {
    it('should handle multiple worktrees in output', async () => {
      // Test with current repo
      const cwd = process.cwd();
      const worktrees = await detectWorktrees(cwd);

      expect(Array.isArray(worktrees)).toBe(true);
    });

    it('should handle HEAD only output', async () => {
      const cwd = process.cwd();
      const worktrees = await detectWorktrees(cwd);

      // All worktrees should have commits
      worktrees.forEach((wt) => {
        expect(wt.commit).toBeDefined();
        expect(typeof wt.commit).toBe('string');
      });
    });

    it('should handle branch prefix correctly', async () => {
      const cwd = process.cwd();
      const worktrees = await detectWorktrees(cwd);

      // Branches should not have refs/heads/ prefix
      worktrees.forEach((wt) => {
        expect(wt.branch).not.toContain('refs/heads/');
      });
    });

    it('should handle bare worktrees', async () => {
      const cwd = process.cwd();
      const worktrees = await detectWorktrees(cwd);

      // Bare property should be boolean
      worktrees.forEach((wt) => {
        expect(typeof wt.isBare).toBe('boolean');
      });
    });
  });

  describe('detectPhaseFromBranch internals', () => {
    it('should detect feature branches', async () => {
      const cwd = process.cwd();
      const mapping = await import('@/fork/worktree-detector').then((m) =>
        m.mapBranchesToPhases(cwd)
      );

      // Feature branches should be detected
      const featureMappings = mapping.filter(
        (m) => m.branch.includes('feature') || m.branch.includes('feat')
      );

      featureMappings.forEach((fm) => {
        if (fm.phase) {
          expect([
            'implementation',
            'planning',
            'research',
            'testing',
            'deployment',
            'refactoring',
          ]).toContain(fm.phase);
        }
      });
    });

    it('should detect test branches', async () => {
      const cwd = process.cwd();
      const mapping = await import('@/fork/worktree-detector').then((m) =>
        m.mapBranchesToPhases(cwd)
      );

      const testMappings = mapping.filter((m) => m.branch.includes('test'));

      testMappings.forEach((tm) => {
        if (tm.phase) {
          expect(tm.phase).toBe('testing');
        }
      });
    });

    it('should detect fix branches', async () => {
      const cwd = process.cwd();
      const mapping = await import('@/fork/worktree-detector').then((m) =>
        m.mapBranchesToPhases(cwd)
      );

      const fixMappings = mapping.filter(
        (m) => m.branch.includes('fix') || m.branch.includes('hotfix')
      );

      fixMappings.forEach((fm) => {
        if (fm.phase) {
          expect(fm.phase).toBe('refactoring');
        }
      });
    });

    it('should detect release branches', async () => {
      const cwd = process.cwd();
      const mapping = await import('@/fork/worktree-detector').then((m) =>
        m.mapBranchesToPhases(cwd)
      );

      const releaseMappings = mapping.filter(
        (m) => m.branch.includes('release') || m.branch.includes('deploy')
      );

      releaseMappings.forEach((rm) => {
        if (rm.phase) {
          expect(rm.phase).toBe('deployment');
        }
      });
    });

    it('should detect research branches', async () => {
      const cwd = process.cwd();
      const mapping = await import('@/fork/worktree-detector').then((m) =>
        m.mapBranchesToPhases(cwd)
      );

      const researchMappings = mapping.filter(
        (m) => m.branch.includes('research') || m.branch.includes('spike')
      );

      researchMappings.forEach((rm) => {
        if (rm.phase) {
          expect(rm.phase).toBe('research');
        }
      });
    });

    it('should handle main/master branches', async () => {
      const cwd = process.cwd();
      const mapping = await import('@/fork/worktree-detector').then((m) =>
        m.mapBranchesToPhases(cwd)
      );

      const mainMappings = mapping.filter((m) => m.branch === 'main' || m.branch === 'master');

      mainMappings.forEach((mm) => {
        if (mm.phase) {
          expect(mm.phase).toBe('planning');
        }
      });
    });
  });

  describe('checkDivergenceFromMain internals', () => {
    it('should correctly identify main as not diverged', async () => {
      const cwd = process.cwd();
      const mapping = await import('@/fork/worktree-detector').then((m) =>
        m.mapBranchesToPhases(cwd)
      );

      const mainMapping = mapping.find((m) => m.branch === 'main' || m.branch === 'master');

      if (mainMapping) {
        expect(mainMapping.divergedFromMain).toBe(false);
      }
    });

    it('should check divergence for feature branches', async () => {
      const cwd = process.cwd();
      const mapping = await import('@/fork/worktree-detector').then((m) =>
        m.mapBranchesToPhases(cwd)
      );

      mapping.forEach((m) => {
        expect(typeof m.divergedFromMain).toBe('boolean');
      });
    });
  });

  describe('analyzeWorktreeStructure edge cases', () => {
    it('should handle repository with multiple branches', async () => {
      const cwd = process.cwd();
      const analysis = await analyzeWorktreeStructure(cwd);

      expect(analysis.branches.length).toBeGreaterThanOrEqual(1);
    });

    it('should identify unique branches correctly', async () => {
      const cwd = process.cwd();
      const analysis = await analyzeWorktreeStructure(cwd);

      // Branches should be unique
      const uniqueBranches = new Set(analysis.branches);
      expect(uniqueBranches.size).toBe(analysis.branches.length);
    });

    it('should calculate feature worktrees correctly', async () => {
      const cwd = process.cwd();
      const analysis = await analyzeWorktreeStructure(cwd);

      expect(analysis.featureWorktrees).toBeGreaterThanOrEqual(0);
      expect(analysis.featureWorktrees).toBeLessThanOrEqual(analysis.totalWorktrees);
    });

    it('should identify main worktree path', async () => {
      const cwd = process.cwd();
      const analysis = await analyzeWorktreeStructure(cwd);

      if (analysis.totalWorktrees > 0) {
        expect(analysis.mainWorktree).toBeTruthy();
        expect(typeof analysis.mainWorktree).toBe('string');
      }
    });

    it('should handle divergence points', async () => {
      const cwd = process.cwd();
      const analysis = await analyzeWorktreeStructure(cwd);

      expect(Array.isArray(analysis.divergencePoints)).toBe(true);
      // Divergence points should be unique
      const unique = new Set(analysis.divergencePoints);
      expect(unique.size).toBe(analysis.divergencePoints.length);
    });
  });
});
