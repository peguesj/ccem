import { MergeResult } from './strategies';

/**
 * Security issue severity levels.
 *
 * @version 0.4.0
 * @since 0.4.0
 */
export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Security issue types.
 *
 * @version 0.4.0
 * @since 0.4.0
 */
export type IssueType =
  | 'dangerous-permission'
  | 'dangerous-bash'
  | 'insecure-mcp'
  | 'configuration-risk';

/**
 * Overall risk level.
 *
 * @version 0.4.0
 * @since 0.4.0
 */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Security issue details.
 *
 * @interface SecurityIssue
 * @version 0.4.0
 * @since 0.4.0
 */
export interface SecurityIssue {
  /** Issue type */
  type: IssueType;
  /** Severity level */
  severity: IssueSeverity;
  /** Human-readable description */
  description: string;
  /** Recommended remediation */
  recommendation: string;
  /** Affected field path */
  affectedField: string;
}

/**
 * Audit summary statistics.
 *
 * @interface AuditSummary
 * @version 0.4.0
 * @since 0.4.0
 */
export interface AuditSummary {
  /** Total number of issues */
  totalIssues: number;
  /** Critical severity issues */
  criticalIssues: number;
  /** High severity issues */
  highIssues: number;
  /** Medium severity issues */
  mediumIssues: number;
  /** Low severity issues */
  lowIssues: number;
}

/**
 * Security audit result.
 *
 * @interface SecurityAuditResult
 * @version 0.4.0
 * @since 0.4.0
 */
export interface SecurityAuditResult {
  /** Audit passed without critical issues */
  passed: boolean;
  /** Security issues found */
  issues: SecurityIssue[];
  /** Overall risk level */
  riskLevel: RiskLevel;
  /** Audit summary */
  summary: AuditSummary;
  /** Top recommendations */
  recommendations: string[];
}

/**
 * Dangerous bash command patterns.
 */
const DANGEROUS_BASH_PATTERNS = [
  { pattern: /rm\s+-rf\s+\//, severity: 'critical' as const, description: 'Dangerous recursive delete of root' },
  { pattern: /sudo/, severity: 'high' as const, description: 'Privilege escalation with sudo' },
  { pattern: /curl.*\|.*bash/, severity: 'critical' as const, description: 'Remote code execution via curl pipe' },
  { pattern: /wget.*\|.*bash/, severity: 'critical' as const, description: 'Remote code execution via wget pipe' },
  { pattern: /eval/, severity: 'high' as const, description: 'Code injection risk with eval' },
  { pattern: /\$\{.*\}/, severity: 'medium' as const, description: 'Variable expansion injection risk' },
  { pattern: />\s*\/dev\/sd[a-z]/, severity: 'critical' as const, description: 'Direct disk write' },
  { pattern: /dd\s+if=/, severity: 'high' as const, description: 'Low-level disk operations' }
];

/**
 * Dangerous permission patterns.
 */
const DANGEROUS_PERMISSIONS = [
  { pattern: /^Write\(\*\)$/, severity: 'high' as const, description: 'Unrestricted write access' },
  { pattern: /^Write\(\/etc\/\*\)/, severity: 'critical' as const, description: 'Write access to system config' },
  { pattern: /^Write\(\/root\/\*\)/, severity: 'critical' as const, description: 'Write access to root directory' },
  { pattern: /^Write\(\/sys\/\*\)/, severity: 'critical' as const, description: 'Write access to system files' }
];

/**
 * Audits permissions for security issues.
 *
 * @param permissions - Array of permission strings
 * @returns Array of security issues
 *
 * @version 0.4.0
 * @since 0.4.0
 */
function auditPermissions(permissions: string[]): SecurityIssue[] {
  const issues: SecurityIssue[] = [];

  permissions.forEach(permission => {
    // Check for dangerous permission patterns
    DANGEROUS_PERMISSIONS.forEach(({ pattern, severity, description }) => {
      if (pattern.test(permission)) {
        issues.push({
          type: 'dangerous-permission',
          severity,
          description: `${description}: ${permission}`,
          recommendation: 'Restrict permission to specific paths or remove if not required',
          affectedField: `permissions.${permission}`
        });
      }
    });

    // Check for dangerous bash commands
    if (permission.startsWith('Bash(')) {
      const command = permission.slice(5, -1); // Extract command from Bash(...)

      DANGEROUS_BASH_PATTERNS.forEach(({ pattern, severity, description }) => {
        if (pattern.test(command)) {
          issues.push({
            type: 'dangerous-bash',
            severity,
            description: `${description}: ${command}`,
            recommendation: 'Remove dangerous command or use safer alternative',
            affectedField: `permissions.${permission}`
          });
        }
      });
    }
  });

  return issues;
}

/**
 * Audits MCP server configurations for security issues.
 *
 * @param mcpServers - MCP server configurations
 * @returns Array of security issues
 *
 * @version 0.4.0
 * @since 0.4.0
 */
function auditMcpServers(
  mcpServers: Record<string, { enabled: boolean; [key: string]: any }>
): SecurityIssue[] {
  const issues: SecurityIssue[] = [];

  Object.entries(mcpServers).forEach(([name, config]) => {
    if (!config.enabled) return;

    // Check for URL if present
    if (config.url) {
      const url = String(config.url);

      // Require HTTPS for remote servers (but allow localhost HTTP)
      if (url.startsWith('http://') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
        issues.push({
          type: 'insecure-mcp',
          severity: 'medium',
          description: `MCP server "${name}" uses insecure HTTP protocol: ${url}`,
          recommendation: 'Use HTTPS for remote MCP server connections',
          affectedField: `mcpServers.${name}.url`
        });
      }

      // Flag untrusted domains
      if (url.includes('untrusted.com') || url.includes('malicious.com')) {
        issues.push({
          type: 'insecure-mcp',
          severity: 'high',
          description: `MCP server "${name}" connects to potentially unsafe domain: ${url}`,
          recommendation: 'Verify the MCP server source and use trusted endpoints only',
          affectedField: `mcpServers.${name}.url`
        });
      }
    }
  });

  return issues;
}

/**
 * Audits settings for security issues.
 *
 * @param settings - Settings object
 * @returns Array of security issues
 *
 * @version 0.4.0
 * @since 0.4.0
 */
function auditSettings(settings: Record<string, any>): SecurityIssue[] {
  const issues: SecurityIssue[] = [];

  // Check for dangerous settings
  if (settings.allowRemoteExecution === true) {
    issues.push({
      type: 'configuration-risk',
      severity: 'high',
      description: 'Remote code execution is enabled',
      recommendation: 'Disable remote execution unless absolutely necessary',
      affectedField: 'settings.allowRemoteExecution'
    });
  }

  return issues;
}

/**
 * Calculates overall risk level based on issues.
 *
 * @param issues - Array of security issues
 * @returns Overall risk level
 *
 * @version 0.4.0
 * @since 0.4.0
 */
function calculateRiskLevel(issues: SecurityIssue[]): RiskLevel {
  if (issues.length === 0) return 'low';

  const hasCritical = issues.some(i => i.severity === 'critical');
  if (hasCritical) return 'critical';

  const hasHigh = issues.some(i => i.severity === 'high');
  if (hasHigh) return 'high';

  const hasMedium = issues.some(i => i.severity === 'medium');
  if (hasMedium) return 'medium';

  return 'low';
}

/**
 * Creates audit summary from issues.
 *
 * @param issues - Array of security issues
 * @returns Audit summary
 *
 * @version 0.4.0
 * @since 0.4.0
 */
function createSummary(issues: SecurityIssue[]): AuditSummary {
  return {
    totalIssues: issues.length,
    criticalIssues: issues.filter(i => i.severity === 'critical').length,
    highIssues: issues.filter(i => i.severity === 'high').length,
    mediumIssues: issues.filter(i => i.severity === 'medium').length,
    lowIssues: issues.filter(i => i.severity === 'low').length
  };
}

/**
 * Generates top recommendations from issues.
 *
 * @param issues - Array of security issues
 * @returns Array of recommendations
 *
 * @version 0.4.0
 * @since 0.4.0
 */
function generateRecommendations(issues: SecurityIssue[]): string[] {
  // Get unique recommendations, prioritized by severity
  const sortedIssues = [...issues].sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  const recommendations = new Set<string>();
  sortedIssues.forEach(issue => {
    if (recommendations.size < 5) { // Top 5 recommendations
      recommendations.add(issue.recommendation);
    }
  });

  return Array.from(recommendations);
}

/**
 * Performs post-merge security audit.
 *
 * @param mergeResult - Result of merge operation
 * @returns Security audit result
 *
 * @example
 * ```typescript
 * const audit = await auditMerge(mergeResult);
 * if (!audit.passed) {
 *   console.error(`Security issues found: ${audit.issues.length}`);
 * }
 * ```
 *
 * @version 0.4.0
 * @since 0.4.0
 */
export async function auditMerge(
  mergeResult: MergeResult
): Promise<SecurityAuditResult> {
  // Collect all security issues
  const permissionIssues = auditPermissions(mergeResult.permissions);
  const mcpIssues = auditMcpServers(mergeResult.mcpServers);
  const settingIssues = auditSettings(mergeResult.settings);

  const issues = [...permissionIssues, ...mcpIssues, ...settingIssues];

  // Calculate risk level
  const riskLevel = calculateRiskLevel(issues);

  // Create summary
  const summary = createSummary(issues);

  // Generate recommendations
  const recommendations = generateRecommendations(issues);

  // Audit passes if no critical or high severity issues
  const passed = !issues.some(i => i.severity === 'critical' || i.severity === 'high');

  return {
    passed,
    issues,
    riskLevel,
    summary,
    recommendations
  };
}
