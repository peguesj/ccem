import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

/**
 * Confirm dialog component props.
 *
 * @interface ConfirmDialogProps
 * @version 1.0.0
 * @since 1.0.0
 */
export interface ConfirmDialogProps {
  /** Dialog title */
  title: string;
  /** Dialog message */
  message: string;
  /** Callback when confirmed */
  onConfirm: () => void;
  /** Callback when cancelled */
  onCancel: () => void;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
}

/**
 * Confirm dialog component for user confirmation.
 *
 * @param props - Confirm dialog component props
 * @returns Rendered confirm dialog component
 *
 * @example
 * ```tsx
 * <ConfirmDialog
 *   title="Delete Configuration"
 *   message="Are you sure you want to delete this configuration?"
 *   onConfirm={() => deleteConfig()}
 *   onCancel={() => setShowDialog(false)}
 * />
 * ```
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Yes',
  cancelText = 'No'
}) => {
  const [selected, setSelected] = useState<'confirm' | 'cancel'>('cancel');

  useInput((input, key) => {
    if (key.leftArrow || key.rightArrow) {
      setSelected(selected === 'confirm' ? 'cancel' : 'confirm');
    }

    if (key.return) {
      if (selected === 'confirm') {
        onConfirm();
      } else {
        onCancel();
      }
    }

    if (key.escape) {
      onCancel();
    }
  });

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="yellow"
      paddingX={1}
    >
      <Text color="yellow" bold>
        {title}
      </Text>
      <Text>{message}</Text>
      <Box marginTop={1} gap={2}>
        <Text
          color={selected === 'confirm' ? 'green' : 'white'}
          bold={selected === 'confirm'}
        >
          {selected === 'confirm' ? '> ' : '  '}
          {confirmText}
        </Text>
        <Text
          color={selected === 'cancel' ? 'red' : 'white'}
          bold={selected === 'cancel'}
        >
          {selected === 'cancel' ? '> ' : '  '}
          {cancelText}
        </Text>
      </Box>
      <Box marginTop={1}>
        <Text dimColor>Use arrow keys to select, Enter to confirm</Text>
      </Box>
    </Box>
  );
};
