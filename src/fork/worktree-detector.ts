/**
 * Git Worktree Detector for CCEM Fork Discovery System.
 *
 * Detects and analyzes git worktrees to identify parallel development opportunities
 * and map branches to conversation phases.
 *
 * @module fork/worktree-detector
 * @version 0.5.0
 * @since 0.5.0
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Worktree interface.
 *
 * @interface Worktree
 * @version 0.5.0
 * @since 0.5.0
 */
export interface Worktree {
  /** Worktree path */
  path: string;
  /** Branch name */
  branch: string;
  /** Commit hash */
  commit: string;
  /** Is main worktree */
  isMain: boolean;
  /** Is bare worktree */
  isBare: boolean;
  /** Is detached HEAD */
  isDetached: boolean;
}

/**
 * Worktree analysis interface.
 *
 * @interface WorktreeAnalysis
 * @version 0.5.0
 * @since 0.5.0
 */
export interface WorktreeAnalysis {
  /** Total number of worktrees */
  totalWorktrees: number;
  /** Unique branches */
  branches: string[];
  /** Has parallel development */
  hasParallelDevelopment: boolean;
  /** Main worktree path */
  mainWorktree: string | null;
  /** Number of feature worktrees */
  featureWorktrees: number;
  /** Divergence points */
  divergencePoints: string[];
}

/**
 * Development pattern type.
 *
 * @typedef {'feature' | 'maintenance' | 'review' | 'hotfix'} DevelopmentPatternType
 * @version 0.5.0
 * @since 0.5.0
 */
export type DevelopmentPatternType = 'feature' | 'maintenance' | 'review' | 'hotfix';

/**
 * Development pattern interface.
 *
 * @interface DevelopmentPattern
 * @version 0.5.0
 * @since 0.5.0
 */
export interface DevelopmentPattern {
  /** Pattern type */
  type: DevelopmentPatternType;
  /** Worktree paths involved */
  worktrees: string[];
  /** Pattern description */
  description: string;
}

/**
 * Branch mapping interface.
 *
 * @interface BranchMapping
 * @version 0.5.0
 * @since 0.5.0
 */
export interface BranchMapping {
  /** Branch name */
  branch: string;
  /** Worktree path */
  worktreePath: string;
  /** Conversation phase (if detectable) */
  phase: string | null;
  /** Commit hash */
  commit: string;
  /** Diverged from main */
  divergedFromMain: boolean;
}

/**
 * Detects git worktrees in repository.
 *
 * @param repoPath - Path to git repository
 * @returns Array of worktree information
 *
 * @example
 * ```typescript
 * const worktrees = await detectWorktrees('/path/to/repo');
 * worktrees.forEach(wt => {
 *   console.log(`${wt.branch} at ${wt.path}`);
 * });
 * ```
 *
 * @version 0.5.0
 * @since 0.5.0
 */
export async function detectWorktrees(repoPath: string): Promise<Worktree[]> {
  try {
    const { stdout } = await execAsync('git worktree list --porcelain', {
      cwd: repoPath
    });

    return parseWorktreeOutput(stdout);
  } catch (error) {
    // Not a git repository or no worktrees
    return [];
  }
}

/**
 * Analyzes worktree structure in repository.
 *
 * @param repoPath - Path to git repository
 * @returns Worktree analysis
 *
 * @example
 * ```typescript
 * const analysis = await analyzeWorktreeStructure('/path/to/repo');
 * console.log(`Total worktrees: ${analysis.totalWorktrees}`);
 * console.log(`Parallel development: ${analysis.hasParallelDevelopment}`);
 * ```
 *
 * @version 0.5.0
 * @since 0.5.0
 */
export async function analyzeWorktreeStructure(repoPath: string): Promise<WorktreeAnalysis> {
  const worktrees = await detectWorktrees(repoPath);

  const branches = [...new Set(worktrees.map(w => w.branch))];
  const mainWorktree = worktrees.find(w => w.isMain);
  const featureWorktrees = worktrees.filter(w => !w.isMain && !w.isBare).length;

  // Detect divergence points (simplified - commits where branches diverged)
  const divergencePoints: string[] = [];
  if (worktrees.length > 1) {
    // For now, mark commits of non-main worktrees as potential divergence points
    worktrees
      .filter(w => !w.isMain)
      .forEach(w => {
        if (!divergencePoints.includes(w.commit)) {
          divergencePoints.push(w.commit);
        }
      });
  }

  return {
    totalWorktrees: worktrees.length,
    branches,
    hasParallelDevelopment: worktrees.length > 1,
    mainWorktree: mainWorktree?.path ?? null,
    featureWorktrees,
    divergencePoints
  };
}

/**
 * Identifies parallel development patterns.
 *
 * @param repoPath - Path to git repository
 * @returns Array of development patterns
 *
 * @example
 * ```typescript
 * const patterns = await identifyParallelDevelopment('/path/to/repo');
 * patterns.forEach(p => {
 *   console.log(`${p.type}: ${p.description}`);
 * });
 * ```
 *
 * @version 0.5.0
 * @since 0.5.0
 */
export async function identifyParallelDevelopment(
  repoPath: string
): Promise<DevelopmentPattern[]> {
  const worktrees = await detectWorktrees(repoPath);

  if (worktrees.length <= 1) {
    return [];
  }

  const patterns: DevelopmentPattern[] = [];

  // Identify feature development
  const featureWorktrees = worktrees.filter(w =>
    w.branch.includes('feature') || w.branch.includes('feat')
  );

  if (featureWorktrees.length > 0) {
    patterns.push({
      type: 'feature',
      worktrees: featureWorktrees.map(w => w.path),
      description: `Feature development in ${featureWorktrees.length} parallel worktree(s)`
    });
  }

  // Identify hotfix pattern
  const hotfixWorktrees = worktrees.filter(w =>
    w.branch.includes('hotfix') || w.branch.includes('fix')
  );

  if (hotfixWorktrees.length > 0) {
    patterns.push({
      type: 'hotfix',
      worktrees: hotfixWorktrees.map(w => w.path),
      description: `Hotfix development in ${hotfixWorktrees.length} worktree(s)`
    });
  }

  // Identify maintenance branches
  const maintenanceWorktrees = worktrees.filter(w =>
    w.branch.includes('maint') || w.branch.includes('release')
  );

  if (maintenanceWorktrees.length > 0) {
    patterns.push({
      type: 'maintenance',
      worktrees: maintenanceWorktrees.map(w => w.path),
      description: `Maintenance in ${maintenanceWorktrees.length} worktree(s)`
    });
  }

  // Identify review worktrees
  const reviewWorktrees = worktrees.filter(w =>
    w.branch.includes('review') || w.branch.includes('pr')
  );

  if (reviewWorktrees.length > 0) {
    patterns.push({
      type: 'review',
      worktrees: reviewWorktrees.map(w => w.path),
      description: `Code review in ${reviewWorktrees.length} worktree(s)`
    });
  }

  return patterns;
}

/**
 * Maps branches to conversation phases.
 *
 * @param repoPath - Path to git repository
 * @returns Array of branch mappings
 *
 * @example
 * ```typescript
 * const mappings = await mapBranchesToPhases('/path/to/repo');
 * mappings.forEach(m => {
 *   console.log(`${m.branch} -> ${m.phase || 'unknown phase'}`);
 * });
 * ```
 *
 * @version 0.5.0
 * @since 0.5.0
 */
export async function mapBranchesToPhases(repoPath: string): Promise<BranchMapping[]> {
  const worktrees = await detectWorktrees(repoPath);

  const mappings: BranchMapping[] = [];

  for (const worktree of worktrees) {
    const phase = detectPhaseFromBranch(worktree.branch);
    const divergedFromMain = await checkDivergenceFromMain(
      repoPath,
      worktree.branch,
      worktree.isMain
    );

    mappings.push({
      branch: worktree.branch,
      worktreePath: worktree.path,
      phase,
      commit: worktree.commit,
      divergedFromMain
    });
  }

  return mappings;
}

/**
 * Parses git worktree list --porcelain output.
 *
 * @param output - Git command output
 * @returns Array of worktrees
 *
 * @internal
 * @version 0.5.0
 * @since 0.5.0
 */
function parseWorktreeOutput(output: string): Worktree[] {
  const worktrees: Worktree[] = [];
  const lines = output.trim().split('\n');

  let currentWorktree: Partial<Worktree> = {};

  for (const line of lines) {
    if (line.startsWith('worktree ')) {
      if (currentWorktree.path) {
        worktrees.push(finalizeWorktree(currentWorktree));
      }
      currentWorktree = {
        path: line.substring('worktree '.length),
        isMain: false,
        isBare: false,
        isDetached: false
      };
    } else if (line.startsWith('HEAD ')) {
      currentWorktree.commit = line.substring('HEAD '.length);
    } else if (line.startsWith('branch ')) {
      currentWorktree.branch = line.substring('branch '.length).replace('refs/heads/', '');
    } else if (line === 'bare') {
      currentWorktree.isBare = true;
    } else if (line === 'detached') {
      currentWorktree.isDetached = true;
      currentWorktree.branch = 'HEAD (detached)';
    } else if (line === '') {
      // Empty line indicates end of worktree block
      if (currentWorktree.path) {
        worktrees.push(finalizeWorktree(currentWorktree));
        currentWorktree = {};
      }
    }
  }

  // Handle last worktree if no trailing empty line
  if (currentWorktree.path) {
    worktrees.push(finalizeWorktree(currentWorktree));
  }

  // Mark first worktree as main
  if (worktrees.length > 0) {
    const mainIdx = worktrees.findIndex(w => !w.isBare);
    if (mainIdx >= 0) {
      const main = worktrees[mainIdx];
      if (main) {
        main.isMain = true;
      }
    }
  }

  return worktrees;
}

/**
 * Finalizes worktree object with defaults.
 *
 * @param worktree - Partial worktree object
 * @returns Complete worktree
 *
 * @internal
 * @version 0.5.0
 * @since 0.5.0
 */
function finalizeWorktree(worktree: Partial<Worktree>): Worktree {
  return {
    path: worktree.path ?? '',
    branch: worktree.branch ?? 'unknown',
    commit: worktree.commit ?? '',
    isMain: worktree.isMain ?? false,
    isBare: worktree.isBare ?? false,
    isDetached: worktree.isDetached ?? false
  };
}

/**
 * Detects conversation phase from branch name.
 *
 * @param branch - Branch name
 * @returns Phase name or null
 *
 * @internal
 * @version 0.5.0
 * @since 0.5.0
 */
function detectPhaseFromBranch(branch: string): string | null {
  const lower = branch.toLowerCase();

  if (lower.includes('feature') || lower.includes('feat')) {
    return 'implementation';
  } else if (lower.includes('test')) {
    return 'testing';
  } else if (lower.includes('fix') || lower.includes('hotfix')) {
    return 'refactoring';
  } else if (lower.includes('release') || lower.includes('deploy')) {
    return 'deployment';
  } else if (lower.includes('research') || lower.includes('spike')) {
    return 'research';
  } else if (lower === 'main' || lower === 'master') {
    return 'planning';
  }

  return null;
}

/**
 * Checks if branch has diverged from main.
 *
 * @param repoPath - Repository path
 * @param branch - Branch name
 * @param isMain - Is main branch
 * @returns True if diverged
 *
 * @internal
 * @version 0.5.0
 * @since 0.5.0
 */
async function checkDivergenceFromMain(
  repoPath: string,
  branch: string,
  isMain: boolean
): Promise<boolean> {
  if (isMain) {
    return false;
  }

  try {
    // Check if branch has commits not in main
    const { stdout } = await execAsync(
      `git rev-list --count main..${branch}`,
      { cwd: repoPath }
    );

    const commitCount = parseInt(stdout.trim(), 10);
    return commitCount > 0;
  } catch (error) {
    // If command fails, assume diverged
    return true;
  }
}
