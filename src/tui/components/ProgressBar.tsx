import React from 'react';
import { Box, Text } from 'ink';

/**
 * Progress bar component props.
 *
 * @interface ProgressBarProps
 * @version 1.0.0
 * @since 1.0.0
 */
export interface ProgressBarProps {
  /** Current progress (0-100) */
  progress: number;
  /** Label for the progress bar */
  label?: string;
  /** Width of the progress bar */
  width?: number;
  /** Show percentage text */
  showPercentage?: boolean;
}

/**
 * Progress bar component for displaying operation progress.
 *
 * @param props - Progress bar component props
 * @returns Rendered progress bar component
 *
 * @example
 * ```tsx
 * <ProgressBar progress={75} label="Processing..." />
 * ```
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  width = 30,
  showPercentage = true
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const filledWidth = Math.round((clampedProgress / 100) * width);
  const emptyWidth = width - filledWidth;

  const filled = '█'.repeat(filledWidth);
  const empty = '░'.repeat(emptyWidth);

  return (
    <Box flexDirection="column">
      {label && <Text dimColor>{label}</Text>}
      <Box>
        <Text color="cyan">{filled}</Text>
        <Text dimColor>{empty}</Text>
        {showPercentage && (
          <Text color="green"> {clampedProgress.toFixed(0)}%</Text>
        )}
      </Box>
    </Box>
  );
};
