import {
  detectWorktrees,
  analyzeWorktreeStructure,
  identifyParallelDevelopment,
  mapBranchesToPhases,
  Worktree,
  WorktreeAnalysis,
  BranchMapping
} from '@/fork/worktree-detector';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Git Worktree Detector', () => {
  let testRepoPath: string;

  beforeEach(async () => {
    // Create temporary test directory
    testRepoPath = join(tmpdir(), `ccem-test-${Date.now()}`);
    await fs.mkdir(testRepoPath, { recursive: true });
  });

  afterEach(async () => {
    // Cleanup test directory
    try {
      await fs.rm(testRepoPath, { recursive: true, force: true });
    } catch (err) {
      // Ignore cleanup errors
    }
  });

  describe('detectWorktrees', () => {
    it('should detect worktrees in repository', async () => {
      // This test works with the actual CCEM repository
      const cwd = process.cwd();
      const worktrees = await detectWorktrees(cwd);

      expect(Array.isArray(worktrees)).toBe(true);
      // Should at least have main worktree
      expect(worktrees.length).toBeGreaterThanOrEqual(1);
    });

    it('should parse worktree information correctly', async () => {
      const cwd = process.cwd();
      const worktrees = await detectWorktrees(cwd);

      if (worktrees.length > 0) {
        const worktree = worktrees[0];
        expect(worktree).toHaveProperty('path');
        expect(worktree).toHaveProperty('branch');
        expect(worktree).toHaveProperty('commit');
        expect(typeof worktree?.path).toBe('string');
      }
    });

    it('should handle repository without worktrees', async () => {
      // Use test directory that's not a git repo
      const worktrees = await detectWorktrees(testRepoPath);

      expect(worktrees).toEqual([]);
    });

    it('should identify main worktree', async () => {
      const cwd = process.cwd();
      const worktrees = await detectWorktrees(cwd);

      const mainWorktree = worktrees.find(w => w.isMain);
      expect(mainWorktree).toBeDefined();
    });

    it('should include commit hash for each worktree', async () => {
      const cwd = process.cwd();
      const worktrees = await detectWorktrees(cwd);

      for (const worktree of worktrees) {
        expect(worktree.commit).toBeDefined();
        expect(typeof worktree.commit).toBe('string');
        if (worktree.commit) {
          expect(worktree.commit.length).toBeGreaterThan(0);
        }
      }
    });

    it('should detect bare worktrees', async () => {
      const cwd = process.cwd();
      const worktrees = await detectWorktrees(cwd);

      // Bare worktrees have isBare flag
      worktrees.forEach(w => {
        expect(w).toHaveProperty('isBare');
        expect(typeof w.isBare).toBe('boolean');
      });
    });

    it('should handle detached HEAD state', async () => {
      const cwd = process.cwd();
      const worktrees = await detectWorktrees(cwd);

      // Should handle detached state gracefully
      worktrees.forEach(w => {
        expect(w).toHaveProperty('isDetached');
        expect(typeof w.isDetached).toBe('boolean');
      });
    });
  });

  describe('analyzeWorktreeStructure', () => {
    it('should analyze worktree structure', async () => {
      const cwd = process.cwd();
      const analysis = await analyzeWorktreeStructure(cwd);

      expect(analysis).toHaveProperty('totalWorktrees');
      expect(analysis).toHaveProperty('branches');
      expect(analysis).toHaveProperty('hasParallelDevelopment');
      expect(typeof analysis.totalWorktrees).toBe('number');
    });

    it('should identify unique branches', async () => {
      const cwd = process.cwd();
      const analysis = await analyzeWorktreeStructure(cwd);

      expect(Array.isArray(analysis.branches)).toBe(true);
      // Should have at least main branch
      expect(analysis.branches.length).toBeGreaterThanOrEqual(1);
    });

    it('should detect parallel development', async () => {
      const cwd = process.cwd();
      const analysis = await analyzeWorktreeStructure(cwd);

      expect(typeof analysis.hasParallelDevelopment).toBe('boolean');
      // Parallel development exists if multiple worktrees
      if (analysis.totalWorktrees > 1) {
        expect(analysis.hasParallelDevelopment).toBe(true);
      }
    });

    it('should calculate worktree statistics', async () => {
      const cwd = process.cwd();
      const analysis = await analyzeWorktreeStructure(cwd);

      expect(analysis).toHaveProperty('mainWorktree');
      expect(analysis).toHaveProperty('featureWorktrees');
      expect(typeof analysis.featureWorktrees).toBe('number');
    });

    it('should handle single worktree repository', async () => {
      const cwd = process.cwd();
      const analysis = await analyzeWorktreeStructure(cwd);

      if (analysis.totalWorktrees === 1) {
        expect(analysis.hasParallelDevelopment).toBe(false);
        expect(analysis.featureWorktrees).toBe(0);
      }
    });

    it('should identify divergence points', async () => {
      const cwd = process.cwd();
      const analysis = await analyzeWorktreeStructure(cwd);

      expect(analysis).toHaveProperty('divergencePoints');
      expect(Array.isArray(analysis.divergencePoints)).toBe(true);
    });
  });

  describe('identifyParallelDevelopment', () => {
    it('should identify parallel development patterns', async () => {
      const cwd = process.cwd();
      const patterns = await identifyParallelDevelopment(cwd);

      expect(Array.isArray(patterns)).toBe(true);
    });

    it('should detect feature development pattern', async () => {
      const cwd = process.cwd();
      const patterns = await identifyParallelDevelopment(cwd);

      patterns.forEach(pattern => {
        expect(pattern).toHaveProperty('type');
        expect(pattern).toHaveProperty('worktrees');
        expect(pattern).toHaveProperty('description');
      });
    });

    it('should return empty array for single worktree', async () => {
      const cwd = process.cwd();
      const analysis = await analyzeWorktreeStructure(cwd);

      if (analysis.totalWorktrees === 1) {
        const patterns = await identifyParallelDevelopment(cwd);
        expect(patterns).toEqual([]);
      }
    });

    it('should categorize development patterns', async () => {
      const cwd = process.cwd();
      const patterns = await identifyParallelDevelopment(cwd);

      const validTypes = ['feature', 'maintenance', 'review', 'hotfix'];
      patterns.forEach(pattern => {
        expect(validTypes).toContain(pattern.type);
      });
    });

    it('should include worktree references in patterns', async () => {
      const cwd = process.cwd();
      const patterns = await identifyParallelDevelopment(cwd);

      patterns.forEach(pattern => {
        expect(Array.isArray(pattern.worktrees)).toBe(true);
        pattern.worktrees.forEach(wt => {
          expect(typeof wt).toBe('string');
        });
      });
    });
  });

  describe('mapBranchesToPhases', () => {
    it('should map branches to conversation phases', async () => {
      const cwd = process.cwd();
      const mapping = await mapBranchesToPhases(cwd);

      expect(Array.isArray(mapping)).toBe(true);
    });

    it('should include branch metadata', async () => {
      const cwd = process.cwd();
      const mapping = await mapBranchesToPhases(cwd);

      mapping.forEach(m => {
        expect(m).toHaveProperty('branch');
        expect(m).toHaveProperty('worktreePath');
        expect(typeof m.branch).toBe('string');
      });
    });

    it('should detect phase from branch name', async () => {
      const cwd = process.cwd();
      const mapping = await mapBranchesToPhases(cwd);

      mapping.forEach(m => {
        expect(m).toHaveProperty('phase');
        // Phase can be null if not detectable
        if (m.phase !== null) {
          expect(typeof m.phase).toBe('string');
        }
      });
    });

    it('should identify feature branches', async () => {
      const cwd = process.cwd();
      const mapping = await mapBranchesToPhases(cwd);

      // Feature branches might have 'feature' in name
      const featureBranches = mapping.filter(m =>
        m.branch.includes('feature') || m.branch.includes('feat')
      );

      featureBranches.forEach(fb => {
        expect(fb.phase).toBeTruthy();
      });
    });

    it('should handle main/master branch', async () => {
      const cwd = process.cwd();
      const mapping = await mapBranchesToPhases(cwd);

      const mainBranch = mapping.find(m =>
        m.branch === 'main' || m.branch === 'master'
      );

      expect(mainBranch).toBeDefined();
    });

    it('should include commit information', async () => {
      const cwd = process.cwd();
      const mapping = await mapBranchesToPhases(cwd);

      mapping.forEach(m => {
        expect(m).toHaveProperty('commit');
        expect(typeof m.commit).toBe('string');
      });
    });

    it('should detect divergence from main', async () => {
      const cwd = process.cwd();
      const mapping = await mapBranchesToPhases(cwd);

      mapping.forEach(m => {
        expect(m).toHaveProperty('divergedFromMain');
        expect(typeof m.divergedFromMain).toBe('boolean');
      });
    });
  });
});
