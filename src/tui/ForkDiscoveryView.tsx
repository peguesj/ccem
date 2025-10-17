import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { ProgressBar, StatusMessage, ErrorDisplay } from './components/index.js';

/**
 * Fork point interface (TUI-specific).
 *
 * @interface ForkPoint
 * @version 1.0.0
 * @since 1.0.0
 */
interface ForkPoint {
  /** Fork point ID */
  id: string;
  /** Message where fork occurred */
  message: string;
  /** Timestamp */
  timestamp: Date;
  /** Number of branches from this point */
  branches: number;
  /** Context */
  context?: string;
}

/**
 * Fork discovery result interface.
 *
 * @interface ForkDiscoveryResult
 * @version 1.0.0
 * @since 1.0.0
 */
export interface ForkDiscoveryResult {
  /** Total fork points found */
  totalForks: number;
  /** Fork points */
  forks: ForkPoint[];
  /** Total messages analyzed */
  messagesAnalyzed: number;
}

/**
 * Fork discovery view state.
 *
 * @version 1.0.0
 * @since 1.0.0
 */
type ForkDiscoveryViewState = 'input' | 'processing' | 'results' | 'error';

/**
 * Fork discovery view component props.
 *
 * @interface ForkDiscoveryViewProps
 * @version 1.0.0
 * @since 1.0.0
 */
export interface ForkDiscoveryViewProps {
  /** Conversation file path */
  conversationPath?: string;
  /** Callback when analysis completes */
  onComplete: (result: ForkDiscoveryResult) => void;
  /** Callback when cancelled */
  onCancel: () => void;
}

/**
 * Fork discovery view component for analyzing conversation forks.
 *
 * @param props - Fork discovery view component props
 * @returns Rendered fork discovery view component
 *
 * @example
 * ```tsx
 * <ForkDiscoveryView
 *   conversationPath="/path/to/conversation.json"
 *   onComplete={(result) => handleForkResult(result)}
 *   onCancel={() => goBack()}
 * />
 * ```
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export const ForkDiscoveryView: React.FC<ForkDiscoveryViewProps> = ({
  conversationPath,
  onComplete,
  onCancel
}) => {
  const [state, setState] = useState<ForkDiscoveryViewState>(
    conversationPath ? 'processing' : 'input'
  );
  const [result, setResult] = useState<ForkDiscoveryResult | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((input, key) => {
    if (state === 'input') {
      if (key.return) {
        startAnalysis();
      }
    }

    if (state === 'results' && result) {
      if (key.upArrow) {
        setSelectedIndex(Math.max(0, selectedIndex - 1));
      }

      if (key.downArrow) {
        setSelectedIndex(Math.min(result.forks.length - 1, selectedIndex + 1));
      }

      if (key.return) {
        onComplete(result);
      }
    }

    if (key.escape) {
      onCancel();
    }
  });

  const startAnalysis = async () => {
    setState('processing');
    setProgress(0);

    try {
      // Simulate analysis
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 5, 90));
      }, 150);

      // Simulate fork discovery
      await new Promise(resolve => setTimeout(resolve, 3000));

      clearInterval(progressInterval);
      setProgress(100);

      // Mock result
      const mockResult: ForkDiscoveryResult = {
        totalForks: 3,
        messagesAnalyzed: 150,
        forks: [
          {
            id: 'fork-1',
            message: 'Implement authentication system',
            timestamp: new Date('2024-01-15T10:30:00'),
            branches: 2,
            context: 'Started with OAuth, later switched to JWT'
          },
          {
            id: 'fork-2',
            message: 'Database schema design',
            timestamp: new Date('2024-01-16T14:20:00'),
            branches: 3,
            context: 'Multiple approaches for relationships'
          },
          {
            id: 'fork-3',
            message: 'UI framework selection',
            timestamp: new Date('2024-01-17T09:15:00'),
            branches: 2,
            context: 'Compared React vs Vue'
          }
        ]
      };

      setResult(mockResult);
      setState('results');
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setState('error');
    }
  };

  // Auto-start if path provided
  React.useEffect(() => {
    if (conversationPath && state === 'processing') {
      startAnalysis();
    }
  }, [conversationPath]);

  // Input view
  if (state === 'input') {
    return (
      <Box flexDirection="column">
        <Text bold color="cyan">
          Fork Discovery
        </Text>
        <Text dimColor>─────────────────────────────────────</Text>
        <Box marginTop={1}>
          <Text>
            Analyze conversation history to discover fork points
          </Text>
        </Box>
        <Box marginTop={1} flexDirection="column">
          <Text bold>What are fork points?</Text>
          <Box marginLeft={2}>
            <Text dimColor>
              • Decision points where multiple approaches were discussed
            </Text>
          </Box>
          <Box marginLeft={2}>
            <Text dimColor>
              • Alternative implementations that were explored
            </Text>
          </Box>
          <Box marginLeft={2}>
            <Text dimColor>
              • Changes in direction during development
            </Text>
          </Box>
        </Box>
        <Box marginTop={2} flexDirection="column">
          <Text bold>To analyze:</Text>
          <Box marginLeft={2}>
            <Text dimColor>
              Provide conversation file via --chat flag
            </Text>
          </Box>
          <Box marginLeft={2}>
            <Text dimColor>
              Example: ccem fork-discover --chat conversation.json
            </Text>
          </Box>
        </Box>
        <Box marginTop={2}>
          <Text dimColor>
            Press Enter to analyze | ESC: Cancel
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
          Analyzing Conversation
        </Text>
        <Text dimColor>─────────────────────────────────────</Text>
        <Box marginTop={1}>
          <ProgressBar
            current={progress}
            total={100}
            label="Scanning for fork points..."
          />
        </Box>
        <Box marginTop={1} flexDirection="column">
          <Text dimColor>• Parsing conversation history</Text>
          <Text dimColor>• Identifying decision points</Text>
          <Text dimColor>• Mapping conversation branches</Text>
          <Text dimColor>• Extracting context</Text>
        </Box>
      </Box>
    );
  }

  // Results view
  if (state === 'results' && result) {
    return (
      <Box flexDirection="column">
        <Text bold color="cyan">
          Fork Discovery Results
        </Text>
        <Text dimColor>─────────────────────────────────────</Text>
        <Box marginTop={1}>
          <StatusMessage
            type="success"
            message={`Found ${result.totalForks} fork point${result.totalForks !== 1 ? 's' : ''}`}
            details={`Analyzed ${result.messagesAnalyzed} messages`}
          />
        </Box>
        {result.forks.length > 0 && (
          <Box flexDirection="column" marginTop={1}>
            <Text bold>Fork Points:</Text>
            {result.forks.map((fork, i) => {
              const isSelected = i === selectedIndex;
              const boxProps: any = {
                key: fork.id,
                flexDirection: 'column' as const,
                marginTop: 1
              };
              if (isSelected) {
                boxProps.borderStyle = 'round';
                boxProps.borderColor = 'green';
                boxProps.paddingX = 1;
              }
              return (
              <Box {...boxProps}>
                <Text
                  color={i === selectedIndex ? 'green' : 'white'}
                  bold={i === selectedIndex}
                >
                  {i === selectedIndex ? '> ' : '  '}
                  Fork {i + 1}: {fork.message}
                </Text>
                <Box marginLeft={4} flexDirection="column">
                  <Text dimColor>
                    Branches: {fork.branches} | Time: {fork.timestamp.toLocaleString()}
                  </Text>
                  {isSelected && fork.context && (
                    <Box marginTop={1}>
                      <Text color="cyan">Context: {fork.context}</Text>
                    </Box>
                  )}
                </Box>
              </Box>
              );
            })}
          </Box>
        )}
        <Box marginTop={2} flexDirection="column">
          <Text bold>Traceability Report:</Text>
          <Box marginLeft={2}>
            <Text dimColor>
              • Total decision points: {result.totalForks}
            </Text>
          </Box>
          <Box marginLeft={2}>
            <Text dimColor>
              • Conversation coverage: {result.messagesAnalyzed} messages
            </Text>
          </Box>
          <Box marginLeft={2}>
            <Text dimColor>
            • Average branches per fork:{' '}
            {(
              result.forks.reduce((sum, f) => sum + f.branches, 0) /
              result.totalForks
            ).toFixed(1)}
            </Text>
          </Box>
        </Box>
        <Box marginTop={1}>
          <Text dimColor>
            {result.forks.length > 0 ? '↑/↓: Navigate | ' : ''}
            Enter: Export | ESC: Exit
          </Text>
        </Box>
      </Box>
    );
  }

  // Error view
  if (state === 'error' && error) {
    return (
      <ErrorDisplay
        title="Fork Discovery Failed"
        message={error.message}
        details={error.stack}
      />
    );
  }

  return null;
};
