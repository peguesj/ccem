import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { ProgressBar, StatusMessage, ErrorDisplay } from './components/index.js';
import {
  auditMerge,
  type SecurityAuditResult,
  type SecurityIssue
} from '../merge/security-audit.js';
import { type MergeResult } from '../merge/strategies.js';

/**
 * Audit view state.
 *
 * @version 1.0.0
 * @since 1.0.0
 */
type AuditViewState = 'processing' | 'results' | 'error';

/**
 * Audit view component props.
 *
 * @interface AuditViewProps
 * @version 1.0.0
 * @since 1.0.0
 */
export interface AuditViewProps {
  /** Configuration to audit */
  config: MergeResult;
  /** Callback when audit completes */
  onComplete: (result: SecurityAuditResult) => void;
  /** Callback when cancelled */
  onCancel: () => void;
}

/**
 * Audit view component for security auditing.
 *
 * @param props - Audit view component props
 * @returns Rendered audit view component
 *
 * @example
 * ```tsx
 * <AuditView
 *   config={mergeResult}
 *   onComplete={(result) => handleAuditResult(result)}
 *   onCancel={() => goBack()}
 * />
 * ```
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export const AuditView: React.FC<AuditViewProps> = ({
  config,
  onComplete,
  onCancel
}) => {
  const [state, setState] = useState<AuditViewState>('processing');
  const [result, setResult] = useState<SecurityAuditResult | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);
  const [selectedIssueIndex, setSelectedIssueIndex] = useState(0);

  useEffect(() => {
    performAudit();
  }, []);

  useInput((input, key) => {
    if (state === 'results' && result) {
      if (key.upArrow) {
        setSelectedIssueIndex(Math.max(0, selectedIssueIndex - 1));
      }

      if (key.downArrow) {
        setSelectedIssueIndex(
          Math.min(result.issues.length - 1, selectedIssueIndex + 1)
        );
      }

      if (key.return) {
        onComplete(result);
      }
    }

    if (key.escape) {
      onCancel();
    }
  });

  const performAudit = async () => {
    setState('processing');
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 15, 90));
      }, 100);

      const auditResult = await auditMerge(config);

      clearInterval(progressInterval);
      setProgress(100);
      setResult(auditResult);
      setState('results');
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setState('error');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'red';
      case 'high':
        return 'yellow';
      case 'medium':
        return 'blue';
      case 'low':
        return 'gray';
      default:
        return 'white';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical':
        return 'red';
      case 'high':
        return 'yellow';
      case 'medium':
        return 'blue';
      case 'low':
        return 'green';
      default:
        return 'white';
    }
  };

  // Processing view
  if (state === 'processing') {
    return (
      <Box flexDirection="column">
        <Text bold color="cyan">
          Security Audit
        </Text>
        <Text dimColor>─────────────────────────────────────</Text>
        <Box marginTop={1} marginBottom={1}>
          <ProgressBar current={progress} total={100} label="Analyzing configuration..." />
        </Box>
        <Text dimColor>Scanning for security issues...</Text>
      </Box>
    );
  }

  // Results view
  if (state === 'results' && result) {
    const maxVisibleIssues = 8;
    const visibleIssues = result.issues.slice(0, maxVisibleIssues);

    return (
      <Box flexDirection="column">
        <Text bold color="cyan">
          Security Audit Results
        </Text>
        <Text dimColor>─────────────────────────────────────</Text>
        <Box marginTop={1}>
          <StatusMessage
            type={result.passed ? 'success' : 'warning'}
            message={
              result.passed
                ? 'Configuration passed security audit'
                : 'Security issues detected'
            }
          />
        </Box>
        <Box flexDirection="column" marginTop={1}>
          <Text bold>
            Risk Level:{' '}
            <Text color={getRiskColor(result.riskLevel)}>
              {result.riskLevel.toUpperCase()}
            </Text>
          </Text>
          <Box marginTop={1}>
            <Text bold>Summary:</Text>
          </Box>
          <Box marginLeft={2}>
            <Text>Total Issues: {result.summary.totalIssues}</Text>
          </Box>
          <Box marginLeft={2}>
            <Text color="red">Critical: {result.summary.criticalIssues}</Text>
          </Box>
          <Box marginLeft={2}>
            <Text color="yellow">High: {result.summary.highIssues}</Text>
          </Box>
          <Box marginLeft={2}>
            <Text color="blue">Medium: {result.summary.mediumIssues}</Text>
          </Box>
          <Box marginLeft={2}>
            <Text dimColor>Low: {result.summary.lowIssues}</Text>
          </Box>
        </Box>
        {result.issues.length > 0 && (
          <Box flexDirection="column" marginTop={1}>
            <Text bold>Issues Found:</Text>
            {visibleIssues.map((issue, i) => {
              const isSelected = i === selectedIssueIndex;
              const boxProps: any = {
                key: i,
                flexDirection: 'column' as const,
                marginLeft: 2,
                marginTop: 1
              };
              if (isSelected) {
                boxProps.borderStyle = 'round';
                boxProps.borderColor = 'green';
                boxProps.paddingX = 1;
              }
              return (
              <Box {...boxProps}>
                <Text color={getSeverityColor(issue.severity)} bold>
                  {i === selectedIssueIndex ? '> ' : '  '}
                  [{issue.severity.toUpperCase()}] {issue.type}
                </Text>
                <Box marginLeft={2}>
                  <Text>{issue.description}</Text>
                </Box>
                <Box marginLeft={2}>
                  <Text dimColor>Field: {issue.affectedField}</Text>
                </Box>
                {isSelected && (
                  <Box marginLeft={2}>
                    <Text color="cyan">→ {issue.recommendation}</Text>
                  </Box>
                )}
              </Box>
              );
            })}
            {result.issues.length > maxVisibleIssues && (
              <Box marginLeft={2} marginTop={1}>
                <Text dimColor>
                  ... and {result.issues.length - maxVisibleIssues} more issues
                </Text>
              </Box>
            )}
          </Box>
        )}
        {result.recommendations.length > 0 && (
          <Box flexDirection="column" marginTop={1}>
            <Text bold>Top Recommendations:</Text>
            {result.recommendations.map((rec, i) => (
              <Box key={i} marginLeft={2}>
                <Text color="cyan">
                  {i + 1}. {rec}
                </Text>
              </Box>
            ))}
          </Box>
        )}
        <Box marginTop={1}>
          <Text dimColor>
            {result.issues.length > 0
              ? '↑/↓: Navigate Issues | '
              : ''}
            Enter: Continue | ESC: Cancel
          </Text>
        </Box>
      </Box>
    );
  }

  // Error view
  if (state === 'error' && error) {
    return (
      <ErrorDisplay
        title="Audit Failed"
        message={error.message}
        details={error.stack}
      />
    );
  }

  return null;
};
