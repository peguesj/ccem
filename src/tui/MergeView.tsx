import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { ProgressBar, StatusMessage, ErrorDisplay } from './components/index.js';
import {
  recommendedMerge,
  defaultMerge,
  conservativeMerge,
  hybridMerge,
  type MergeResult,
  type MergeConfig
} from '../merge/strategies.js';

/**
 * Merge strategy type.
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export type MergeStrategy = 'recommended' | 'default' | 'conservative' | 'hybrid';

/**
 * Merge view state.
 *
 * @version 1.0.0
 * @since 1.0.0
 */
type MergeViewState = 'strategy' | 'processing' | 'results' | 'error';

/**
 * Merge view component props.
 *
 * @interface MergeViewProps
 * @version 1.0.0
 * @since 1.0.0
 */
export interface MergeViewProps {
  /** Configurations to merge */
  configs: MergeConfig[];
  /** Callback when merge completes */
  onComplete: (result: MergeResult) => void;
  /** Callback when cancelled */
  onCancel: () => void;
}

/**
 * Merge view component for configuration merging.
 *
 * @param props - Merge view component props
 * @returns Rendered merge view component
 *
 * @example
 * ```tsx
 * <MergeView
 *   configs={[config1, config2]}
 *   onComplete={(result) => saveResult(result)}
 *   onCancel={() => goBack()}
 * />
 * ```
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export const MergeView: React.FC<MergeViewProps> = ({
  configs,
  onComplete,
  onCancel
}) => {
  const [state, setState] = useState<MergeViewState>('strategy');
  const [selectedStrategy, setSelectedStrategy] = useState<MergeStrategy>('recommended');
  const [result, setResult] = useState<MergeResult | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);

  const strategies: Array<{ id: MergeStrategy; name: string; description: string }> = [
    {
      id: 'recommended',
      name: 'Recommended (AI-Powered)',
      description: 'Smart conflict detection with suggestions'
    },
    {
      id: 'default',
      name: 'Default',
      description: 'Simple union with last-write-wins'
    },
    {
      id: 'conservative',
      name: 'Conservative',
      description: 'Preserve all unique items, flag conflicts'
    },
    {
      id: 'hybrid',
      name: 'Hybrid',
      description: 'Balanced approach with critical conflict detection'
    }
  ];

  const currentStrategyIndex = strategies.findIndex(s => s.id === selectedStrategy);

  useInput((input, key) => {
    if (state === 'strategy') {
      if (key.upArrow) {
        const newIndex = Math.max(0, currentStrategyIndex - 1);
        setSelectedStrategy(strategies[newIndex]!.id);
      }

      if (key.downArrow) {
        const newIndex = Math.min(strategies.length - 1, currentStrategyIndex + 1);
        setSelectedStrategy(strategies[newIndex]!.id);
      }

      if (key.return) {
        performMerge();
      }
    }

    if (state === 'results' && key.return) {
      if (result) {
        onComplete(result);
      }
    }

    if (key.escape) {
      onCancel();
    }
  });

  const performMerge = async () => {
    setState('processing');
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      let mergeResult: MergeResult;
      switch (selectedStrategy) {
        case 'recommended':
          mergeResult = await recommendedMerge(configs);
          break;
        case 'conservative':
          mergeResult = await conservativeMerge(configs);
          break;
        case 'hybrid':
          mergeResult = await hybridMerge(configs);
          break;
        default:
          mergeResult = await defaultMerge(configs);
      }

      clearInterval(progressInterval);
      setProgress(100);
      setResult(mergeResult);
      setState('results');
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setState('error');
    }
  };

  // Strategy selection view
  if (state === 'strategy') {
    return (
      <Box flexDirection="column">
        <Text bold color="cyan">
          Select Merge Strategy
        </Text>
        <Text dimColor>─────────────────────────────────────</Text>
        <Box marginBottom={1}>
          <Text dimColor>
            Merging {configs.length} configuration{configs.length > 1 ? 's' : ''}
          </Text>
        </Box>
        {strategies.map(strategy => (
          <Box key={strategy.id} flexDirection="column" marginBottom={1}>
            <Text
              color={strategy.id === selectedStrategy ? 'green' : 'white'}
              bold={strategy.id === selectedStrategy}
            >
              {strategy.id === selectedStrategy ? '> ' : '  '}
              {strategy.name}
            </Text>
            <Box marginLeft={4}>
              <Text dimColor>{strategy.description}</Text>
            </Box>
          </Box>
        ))}
        <Box marginTop={1}>
          <Text dimColor>
            ↑/↓: Navigate | Enter: Start Merge | ESC: Cancel
          </Text>
        </Box>
      </Box>
    );
  }

  // Processing view
  if (state === 'processing') {
    return (
      <Box flexDirection="column">
        <Text bold color="cyan">
          Merging Configurations
        </Text>
        <Text dimColor>─────────────────────────────────────</Text>
        <Box marginTop={1} marginBottom={1}>
          <ProgressBar
            current={progress}
            total={100}
            label={`Processing with ${selectedStrategy} strategy...`}
          />
        </Box>
        <Text dimColor>Please wait...</Text>
      </Box>
    );
  }

  // Results view
  if (state === 'results' && result) {
    return (
      <Box flexDirection="column">
        <Text bold color="cyan">
          Merge Complete
        </Text>
        <Text dimColor>─────────────────────────────────────</Text>
        <StatusMessage
          type="success"
          message="Configuration merge completed successfully"
        />
        <Box flexDirection="column" marginTop={1}>
          <Text bold>Statistics:</Text>
          <Text>  Projects analyzed: {result.stats.projectsAnalyzed}</Text>
          <Text>  Conflicts detected: {result.stats.conflictsDetected}</Text>
          <Text>  Auto-resolved: {result.stats.autoResolved}</Text>
          <Text>  Permissions merged: {result.permissions.length}</Text>
          <Text>  MCP servers: {Object.keys(result.mcpServers).length}</Text>
          <Text>  Settings: {Object.keys(result.settings).length}</Text>
        </Box>
        {result.conflicts.length > 0 && (
          <Box flexDirection="column" marginTop={1}>
            <Text bold color="yellow">
              Conflicts Requiring Attention:
            </Text>
            {result.conflicts.slice(0, 5).map((conflict, i) => (
              <Box key={i} marginLeft={2}>
                <Text color="yellow">
                  • {conflict.field} ({conflict.values.length} values)
                </Text>
              </Box>
            ))}
            {result.conflicts.length > 5 && (
              <Box marginLeft={2}>
                <Text dimColor>
                  ... and {result.conflicts.length - 5} more
                </Text>
              </Box>
            )}
          </Box>
        )}
        <Box marginTop={1}>
          <Text dimColor>
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
        title="Merge Failed"
        message={error.message}
        details={error.stack}
      />
    );
  }

  return null;
};
