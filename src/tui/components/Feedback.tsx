/**
 * User feedback components for displaying messages.
 *
 * @packageDocumentation
 * @module tui/components/Feedback
 * @version 1.0.0
 */

import React from 'react';
import { Box, Text } from 'ink';

/**
 * Message type.
 */
export type MessageType = 'success' | 'error' | 'warning' | 'info';

/**
 * Message props.
 *
 * @interface MessageProps
 * @version 1.0.0
 */
export interface MessageProps {
  /** Message type */
  type: MessageType;
  /** Main message text */
  message: string;
  /** Optional details/description */
  details?: string;
  /** Show icon */
  showIcon?: boolean;
  /** Custom icon override */
  icon?: string;
}

/**
 * Message component for displaying styled feedback messages.
 *
 * @param props - Message props
 * @returns Message component
 *
 * @example
 * ```tsx
 * <Message
 *   type="success"
 *   message="Configuration merged successfully"
 *   details="Output: /path/to/config.json"
 * />
 * ```
 *
 * @version 1.0.0
 */
export const Message: React.FC<MessageProps> = ({
  type,
  message,
  details,
  showIcon = true,
  icon
}) => {
  const config = {
    success: { icon: '✓', color: 'green' },
    error: { icon: '✗', color: 'red' },
    warning: { icon: '⚠', color: 'yellow' },
    info: { icon: 'ℹ', color: 'cyan' }
  };

  const { icon: defaultIcon, color } = config[type];
  const displayIcon = icon || defaultIcon;

  return (
    <Box flexDirection="column">
      <Box>
        {showIcon && (
          <Text color={color}>{displayIcon} </Text>
        )}
        <Text color={color} bold>
          {message}
        </Text>
      </Box>
      {details && (
        <Box marginLeft={showIcon ? 2 : 0}>
          <Text dimColor>{details}</Text>
        </Box>
      )}
    </Box>
  );
};

/**
 * Success message component.
 *
 * @param props - Message props (excluding type)
 * @returns Success message component
 *
 * @example
 * ```tsx
 * <Success message="Operation completed successfully" />
 * ```
 *
 * @version 1.0.0
 */
export const Success: React.FC<Omit<MessageProps, 'type'>> = (props) => (
  <Message type="success" {...props} />
);

/**
 * Error message component.
 *
 * @param props - Message props (excluding type)
 * @returns Error message component
 *
 * @example
 * ```tsx
 * <Error message="Configuration file not found" />
 * ```
 *
 * @version 1.0.0
 */
export const ErrorMessage: React.FC<Omit<MessageProps, 'type'>> = (props) => (
  <Message type="error" {...props} />
);

/**
 * Warning message component.
 *
 * @param props - Message props (excluding type)
 * @returns Warning message component
 *
 * @example
 * ```tsx
 * <Warning message="Conflicts detected" details="2 conflicts require review" />
 * ```
 *
 * @version 1.0.0
 */
export const Warning: React.FC<Omit<MessageProps, 'type'>> = (props) => (
  <Message type="warning" {...props} />
);

/**
 * Info message component.
 *
 * @param props - Message props (excluding type)
 * @returns Info message component
 *
 * @example
 * ```tsx
 * <Info message="Found 3 configurations to merge" />
 * ```
 *
 * @version 1.0.0
 */
export const Info: React.FC<Omit<MessageProps, 'type'>> = (props) => (
  <Message type="info" {...props} />
);

/**
 * Summary box props.
 *
 * @interface SummaryProps
 * @version 1.0.0
 */
export interface SummaryProps {
  /** Summary title */
  title: string;
  /** Summary items as key-value pairs */
  items: Array<{ label: string; value: string; color?: string }>;
  /** Show border around summary */
  showBorder?: boolean;
}

/**
 * Summary box component for displaying key-value information.
 *
 * @param props - Summary props
 * @returns Summary component
 *
 * @example
 * ```tsx
 * <Summary
 *   title="Merge Results"
 *   items={[
 *     { label: 'Projects analyzed', value: '3' },
 *     { label: 'Conflicts detected', value: '2', color: 'yellow' }
 *   ]}
 * />
 * ```
 *
 * @version 1.0.0
 */
export const Summary: React.FC<SummaryProps> = ({
  title,
  items,
  showBorder = false
}) => {
  const boxProps: any = { flexDirection: 'column' as const };
  if (showBorder) {
    boxProps.borderStyle = 'single';
    boxProps.padding = 1;
  }
  return (
    <Box {...boxProps}>
      <Text bold color="cyan">
        {title}
      </Text>
      <Text dimColor>{'─'.repeat(title.length)}</Text>
      {items.map((item, index) => (
        <Box key={index} marginTop={index > 0 ? 0 : 1}>
          <Text dimColor>{item.label}: </Text>
          <Text color={item.color || 'white'}>{item.value}</Text>
        </Box>
      ))}
    </Box>
  );
};

/**
 * Alert box props.
 *
 * @interface AlertProps
 * @version 1.0.0
 */
export interface AlertProps {
  /** Alert type */
  type: MessageType;
  /** Alert title */
  title: string;
  /** Alert message */
  message: string;
  /** Show border */
  showBorder?: boolean;
}

/**
 * Alert box component for displaying prominent messages.
 *
 * @param props - Alert props
 * @returns Alert component
 *
 * @example
 * ```tsx
 * <Alert
 *   type="warning"
 *   title="Manual Review Required"
 *   message="2 conflicts need your attention"
 * />
 * ```
 *
 * @version 1.0.0
 */
export const Alert: React.FC<AlertProps> = ({
  type,
  title,
  message,
  showBorder = true
}) => {
  const colors = {
    success: 'green',
    error: 'red',
    warning: 'yellow',
    info: 'cyan'
  };

  const color = colors[type];

  const boxProps: any = { flexDirection: 'column' as const, padding: 1 };
  if (showBorder) {
    boxProps.borderStyle = 'single';
    boxProps.borderColor = color;
  }

  return (
    <Box {...boxProps}>
      <Text bold color={color}>
        {title}
      </Text>
      <Text color={color}>{message}</Text>
    </Box>
  );
};

/**
 * List props.
 *
 * @interface ListProps
 * @version 1.0.0
 */
export interface ListProps {
  /** List items */
  items: string[];
  /** Bullet symbol */
  bullet?: string;
  /** Item color */
  color?: string;
  /** Show numbers instead of bullets */
  numbered?: boolean;
}

/**
 * List component for displaying items.
 *
 * @param props - List props
 * @returns List component
 *
 * @example
 * ```tsx
 * <List items={['Item 1', 'Item 2', 'Item 3']} bullet="•" />
 * ```
 *
 * @version 1.0.0
 */
export const List: React.FC<ListProps> = ({
  items,
  bullet = '•',
  color = 'white',
  numbered = false
}) => {
  return (
    <Box flexDirection="column">
      {items.map((item, index) => (
        <Box key={index}>
          <Text dimColor>
            {numbered ? `${index + 1}.` : bullet}{' '}
          </Text>
          <Text color={color}>{item}</Text>
        </Box>
      ))}
    </Box>
  );
};
