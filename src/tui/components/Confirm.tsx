/**
 * Confirmation dialog components.
 *
 * @packageDocumentation
 * @module tui/components/Confirm
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

/**
 * Confirm dialog props.
 *
 * @interface ConfirmProps
 * @version 1.0.0
 */
export interface ConfirmProps {
  /** Confirmation message/question */
  message: string;
  /** Callback when user confirms (yes) */
  onConfirm: () => void;
  /** Callback when user cancels (no) */
  onCancel: () => void;
  /** Default to 'yes' (true) or 'no' (false) */
  defaultYes?: boolean;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Show warning style */
  warning?: boolean;
}

/**
 * Confirmation dialog component with yes/no options.
 *
 * @param props - Confirm props
 * @returns Confirm component
 *
 * @example
 * ```tsx
 * <Confirm
 *   message="Delete configuration backup?"
 *   onConfirm={() => deleteBackup()}
 *   onCancel={() => console.log('Cancelled')}
 *   warning
 * />
 * ```
 *
 * @version 1.0.0
 */
export const Confirm: React.FC<ConfirmProps> = ({
  message,
  onConfirm,
  onCancel,
  defaultYes = false,
  confirmText = 'Yes',
  cancelText = 'No',
  warning = false
}) => {
  const [selected, setSelected] = useState(defaultYes ? 'yes' : 'no');

  useInput((input, key) => {
    if (key.leftArrow || key.rightArrow) {
      setSelected(selected === 'yes' ? 'no' : 'yes');
    }

    if (input === 'y' || input === 'Y') {
      setSelected('yes');
    }

    if (input === 'n' || input === 'N') {
      setSelected('no');
    }

    if (key.return) {
      if (selected === 'yes') {
        onConfirm();
      } else {
        onCancel();
      }
    }

    if (key.escape) {
      onCancel();
    }
  });

  const messageColor = warning ? 'yellow' : 'cyan';

  return (
    <Box flexDirection="column">
      <Box>
        <Text color={messageColor} bold>
          {warning ? '⚠ ' : '? '}
          {message}
        </Text>
      </Box>
      <Box marginTop={1}>
        <Box marginRight={2}>
          <Text
            color={selected === 'yes' ? 'green' : 'white'}
            bold={selected === 'yes'}
            inverse={selected === 'yes'}
          >
            {selected === 'yes' ? '▸ ' : '  '}
            {confirmText}
          </Text>
        </Box>
        <Box>
          <Text
            color={selected === 'no' ? 'red' : 'white'}
            bold={selected === 'no'}
            inverse={selected === 'no'}
          >
            {selected === 'no' ? '▸ ' : '  '}
            {cancelText}
          </Text>
        </Box>
      </Box>
      <Box marginTop={1}>
        <Text dimColor>
          Use arrow keys or y/n to select, Enter to confirm, Esc to cancel
        </Text>
      </Box>
    </Box>
  );
};

/**
 * Select option interface.
 *
 * @interface SelectOption
 * @version 1.0.0
 */
export interface SelectOption<T = string> {
  /** Option label */
  label: string;
  /** Option value */
  value: T;
  /** Option description */
  description?: string;
  /** Disable this option */
  disabled?: boolean;
}

/**
 * Select props.
 *
 * @interface SelectProps
 * @version 1.0.0
 */
export interface SelectProps<T = string> {
  /** Prompt message */
  message: string;
  /** Available options */
  options: SelectOption<T>[];
  /** Callback when option is selected */
  onSelect: (value: T) => void;
  /** Callback when cancelled */
  onCancel?: () => void;
  /** Default selected index */
  defaultIndex?: number;
}

/**
 * Select component for choosing from multiple options.
 *
 * @param props - Select props
 * @returns Select component
 *
 * @example
 * ```tsx
 * <Select
 *   message="Choose merge strategy:"
 *   options={[
 *     { label: 'Recommended', value: 'recommended' },
 *     { label: 'Conservative', value: 'conservative' }
 *   ]}
 *   onSelect={(value) => console.log('Selected:', value)}
 * />
 * ```
 *
 * @version 1.0.0
 */
export function Select<T = string>({
  message,
  options,
  onSelect,
  onCancel,
  defaultIndex = 0
}: SelectProps<T>): React.ReactElement {
  const [selectedIndex, setSelectedIndex] = useState(defaultIndex);

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex(prev => {
        let newIndex = prev - 1;
        // Skip disabled options
        while (newIndex >= 0 && options[newIndex]?.disabled) {
          newIndex--;
        }
        return newIndex >= 0 ? newIndex : prev;
      });
    }

    if (key.downArrow) {
      setSelectedIndex(prev => {
        let newIndex = prev + 1;
        // Skip disabled options
        while (newIndex < options.length && options[newIndex]?.disabled) {
          newIndex++;
        }
        return newIndex < options.length ? newIndex : prev;
      });
    }

    if (key.return) {
      const selected = options[selectedIndex];
      if (selected && !selected.disabled) {
        onSelect(selected.value);
      }
    }

    if (key.escape && onCancel) {
      onCancel();
    }
  });

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text color="cyan" bold>
          ? {message}
        </Text>
      </Box>
      {options.map((option, index) => {
        const isSelected = index === selectedIndex;
        const isDisabled = option.disabled ?? false;

        return (
          <Box key={index} flexDirection="column">
            <Box>
              <Text
                color={isDisabled ? 'gray' : isSelected ? 'cyan' : 'white'}
                bold={isSelected}
              >
                {isSelected ? '▸ ' : '  '}
                {option.label}
              </Text>
            </Box>
            {option.description && isSelected && (
              <Box marginLeft={2}>
                <Text dimColor>{option.description}</Text>
              </Box>
            )}
          </Box>
        );
      })}
      <Box marginTop={1}>
        <Text dimColor>
          Use arrow keys to navigate, Enter to select
          {onCancel && ', Esc to cancel'}
        </Text>
      </Box>
    </Box>
  );
}

/**
 * Input props.
 *
 * @interface InputProps
 * @version 1.0.0
 */
export interface InputProps {
  /** Prompt message */
  message: string;
  /** Callback when input is submitted */
  onSubmit: (value: string) => void;
  /** Callback when cancelled */
  onCancel?: () => void;
  /** Default value */
  defaultValue?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Validation function */
  validate?: (value: string) => string | null;
}

/**
 * Input component for text entry.
 *
 * @param props - Input props
 * @returns Input component
 *
 * @example
 * ```tsx
 * <Input
 *   message="Enter output path:"
 *   placeholder="/path/to/output"
 *   onSubmit={(value) => console.log('Value:', value)}
 *   validate={(v) => v.length > 0 ? null : 'Path is required'}
 * />
 * ```
 *
 * @version 1.0.0
 */
export const Input: React.FC<InputProps> = ({
  message,
  onSubmit,
  onCancel,
  defaultValue = '',
  placeholder = '',
  validate
}) => {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);

  useInput((input, key) => {
    if (key.return) {
      if (validate) {
        const validationError = validate(value);
        if (validationError) {
          setError(validationError);
          return;
        }
      }
      onSubmit(value);
    }

    if (key.escape && onCancel) {
      onCancel();
    }

    if (key.backspace || key.delete) {
      setValue(prev => prev.slice(0, -1));
      setError(null);
    } else if (!key.return && !key.escape && input) {
      setValue(prev => prev + input);
      setError(null);
    }
  });

  return (
    <Box flexDirection="column">
      <Box>
        <Text color="cyan" bold>
          ? {message}
        </Text>
      </Box>
      <Box marginTop={1}>
        <Text color="green">▸ </Text>
        <Text>
          {value || (
            <Text dimColor>{placeholder}</Text>
          )}
          <Text inverse> </Text>
        </Text>
      </Box>
      {error && (
        <Box marginTop={1}>
          <Text color="red">✗ {error}</Text>
        </Box>
      )}
      <Box marginTop={1}>
        <Text dimColor>
          Enter to submit
          {onCancel && ', Esc to cancel'}
        </Text>
      </Box>
    </Box>
  );
};
