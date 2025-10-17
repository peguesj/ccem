import React from 'react';
import { Box, Text } from 'ink';

/**
 * Error display component props.
 *
 * @interface ErrorDisplayProps
 * @version 1.0.0
 * @since 1.0.0
 */
export interface ErrorDisplayProps {
  /** Error title */
  title: string;
  /** Error message */
  message: string;
  /** Stack trace or additional details */
  details?: string | undefined;
  /** Action callback */
  onDismiss?: () => void | undefined;
}

/**
 * Error display component for showing error information.
 *
 * @param props - Error display component props
 * @returns Rendered error display component
 *
 * @example
 * ```tsx
 * <ErrorDisplay
 *   title="Configuration Error"
 *   message="Failed to load config file"
 *   details={error.stack}
 * />
 * ```
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  title,
  message,
  details
}) => {
  return (
    <Box flexDirection="column" borderStyle="round" borderColor="red" paddingX={1}>
      <Text color="red" bold>
        ✗ {title}
      </Text>
      <Text color="red">{message}</Text>
      {details && (
        <>
          <Box marginTop={1}>
            <Text dimColor>Details:</Text>
          </Box>
          <Box marginLeft={2}>
            <Text dimColor>{details}</Text>
          </Box>
        </>
      )}
      <Box marginTop={1}>
        <Text dimColor>Press ESC to go back</Text>
      </Box>
    </Box>
  );
};
