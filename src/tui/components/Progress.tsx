/**
 * Progress indicator components.
 *
 * @packageDocumentation
 * @module tui/components/Progress
 * @version 1.0.0
 */

import React from 'react';
import { Box, Text } from 'ink';

/**
 * Progress bar props.
 *
 * @interface ProgressBarProps
 * @version 1.0.0
 */
export interface ProgressBarProps {
  /** Current progress value */
  current: number;
  /** Total/maximum value */
  total: number;
  /** Label to display above progress bar */
  label?: string;
  /** Width of progress bar in characters */
  width?: number;
  /** Show percentage */
  showPercentage?: boolean;
  /** Show count (current/total) */
  showCount?: boolean;
  /** Color of progress bar */
  color?: string;
}

/**
 * Progress bar component for showing determinate progress.
 *
 * @param props - Progress bar props
 * @returns Progress bar component
 *
 * @example
 * ```tsx
 * <ProgressBar
 *   current={45}
 *   total={100}
 *   label="Processing files..."
 *   showPercentage
 * />
 * ```
 *
 * @version 1.0.0
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  label,
  width = 40,
  showPercentage = true,
  showCount = false,
  color = 'green'
}) => {
  const percentage = Math.min(100, Math.round((current / total) * 100));
  const filled = Math.round((width * percentage) / 100);
  const empty = width - filled;

  const bar = '█'.repeat(filled) + '░'.repeat(empty);

  return (
    <Box flexDirection="column">
      {label && (
        <Text color="cyan">{label}</Text>
      )}
      <Box>
        <Text color={color}>[{bar}]</Text>
        {showPercentage && (
          <Text color="yellow"> {percentage}%</Text>
        )}
        {showCount && (
          <Text dimColor> ({current}/{total})</Text>
        )}
      </Box>
    </Box>
  );
};

/**
 * Spinner types.
 */
export type SpinnerType = 'dots' | 'line' | 'arrow' | 'bounce' | 'arc';

/**
 * Spinner frame sets.
 */
const spinnerFrames: Record<SpinnerType, string[]> = {
  dots: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  line: ['|', '/', '-', '\\'],
  arrow: ['←', '↖', '↑', '↗', '→', '↘', '↓', '↙'],
  bounce: ['⠁', '⠂', '⠄', '⠂'],
  arc: ['◜', '◠', '◝', '◞', '◡', '◟']
};

/**
 * Spinner props.
 *
 * @interface SpinnerProps
 * @version 1.0.0
 */
export interface SpinnerProps {
  /** Label to display next to spinner */
  label?: string;
  /** Spinner type/animation */
  type?: SpinnerType;
  /** Color of spinner */
  color?: string;
}

/**
 * Spinner component for showing indeterminate progress.
 *
 * @param props - Spinner props
 * @returns Spinner component
 *
 * @example
 * ```tsx
 * <Spinner label="Loading..." type="dots" />
 * ```
 *
 * @version 1.0.0
 */
export const Spinner: React.FC<SpinnerProps> = ({
  label,
  type = 'dots',
  color = 'cyan'
}) => {
  const [frame, setFrame] = React.useState(0);
  const frames = spinnerFrames[type];

  React.useEffect(() => {
    const timer = setInterval(() => {
      setFrame(prev => (prev + 1) % frames.length);
    }, 80);

    return () => clearInterval(timer);
  }, [frames.length]);

  return (
    <Box>
      <Text color={color}>{frames[frame]} </Text>
      {label && <Text>{label}</Text>}
    </Box>
  );
};

/**
 * Step indicator props.
 *
 * @interface StepsProps
 * @version 1.0.0
 */
export interface StepsProps {
  /** Array of step labels */
  steps: string[];
  /** Current step index (0-based) */
  currentStep: number;
  /** Show checkmarks for completed steps */
  showCompleted?: boolean;
}

/**
 * Step indicator component for showing multi-step progress.
 *
 * @param props - Steps props
 * @returns Steps component
 *
 * @example
 * ```tsx
 * <Steps
 *   steps={['Analyze', 'Merge', 'Validate']}
 *   currentStep={1}
 *   showCompleted
 * />
 * ```
 *
 * @version 1.0.0
 */
export const Steps: React.FC<StepsProps> = ({
  steps,
  currentStep,
  showCompleted = true
}) => {
  return (
    <Box flexDirection="column">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isPending = index > currentStep;

        let symbol = '○';
        let color = 'white';

        if (isCompleted && showCompleted) {
          symbol = '✓';
          color = 'green';
        } else if (isCurrent) {
          symbol = '●';
          color = 'cyan';
        } else if (isPending) {
          symbol = '○';
          color = 'gray';
        }

        return (
          <Box key={index}>
            <Text color={color}>{symbol} </Text>
            <Text
              color={isCurrent ? 'cyan' : isCompleted ? 'green' : 'gray'}
              bold={isCurrent}
            >
              {step}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
};

/**
 * Status bar props.
 *
 * @interface StatusBarProps
 * @version 1.0.0
 */
export interface StatusBarProps {
  /** Status message */
  message: string;
  /** Status type */
  type?: 'info' | 'success' | 'warning' | 'error' | 'loading';
  /** Show spinner for loading state */
  showSpinner?: boolean;
}

/**
 * Status bar component for showing current operation status.
 *
 * @param props - Status bar props
 * @returns Status bar component
 *
 * @example
 * ```tsx
 * <StatusBar message="Merging configurations..." type="loading" showSpinner />
 * ```
 *
 * @version 1.0.0
 */
export const StatusBar: React.FC<StatusBarProps> = ({
  message,
  type = 'info',
  showSpinner = false
}) => {
  const symbols = {
    info: 'ℹ',
    success: '✓',
    warning: '⚠',
    error: '✗',
    loading: '●'
  };

  const colors = {
    info: 'cyan',
    success: 'green',
    warning: 'yellow',
    error: 'red',
    loading: 'cyan'
  };

  return (
    <Box>
      {showSpinner && type === 'loading' ? (
        <Spinner type="dots" color={colors[type]} />
      ) : (
        <Text color={colors[type]}>{symbols[type]} </Text>
      )}
      <Text color={colors[type]}>{message}</Text>
    </Box>
  );
};
