import React from 'react';
import { Box, Text } from 'ink';

/**
 * Status message types.
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export type StatusType = 'info' | 'success' | 'warning' | 'error';

/**
 * Status message component props.
 *
 * @interface StatusMessageProps
 * @version 1.0.0
 * @since 1.0.0
 */
export interface StatusMessageProps {
  /** Message type */
  type: StatusType;
  /** Message text */
  message: string;
  /** Optional details */
  details?: string;
}

/**
 * Status message component for displaying feedback to users.
 *
 * @param props - Status message component props
 * @returns Rendered status message component
 *
 * @example
 * ```tsx
 * <StatusMessage type="success" message="Operation completed" />
 * ```
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export const StatusMessage: React.FC<StatusMessageProps> = ({
  type,
  message,
  details
}) => {
  const icons = {
    info: 'ℹ️',
    success: '✓',
    warning: '⚠️',
    error: '✗'
  };

  const colors = {
    info: 'blue',
    success: 'green',
    warning: 'yellow',
    error: 'red'
  } as const;

  return (
    <Box flexDirection="column">
      <Box>
        <Text color={colors[type]} bold>
          {icons[type]} {message}
        </Text>
      </Box>
      {details && (
        <Box marginLeft={2}>
          <Text dimColor>{details}</Text>
        </Box>
      )}
    </Box>
  );
};
