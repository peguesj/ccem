import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { ProgressBar, StatusMessage, ConfirmDialog } from './components/index.js';

/**
 * Backup view state.
 *
 * @version 1.0.0
 * @since 1.0.0
 */
type BackupViewState = 'menu' | 'list' | 'creating' | 'restoring' | 'confirm' | 'success' | 'error';

/**
 * Backup operation type.
 *
 * @version 1.0.0
 * @since 1.0.0
 */
type BackupOperation = 'create' | 'restore' | 'list';

/**
 * Backup view component props.
 *
 * @interface BackupViewProps
 * @version 1.0.0
 * @since 1.0.0
 */
export interface BackupViewProps {
  /** Source path for backup */
  sourcePath: string;
  /** Available backups */
  backups?: Array<{ name: string; path: string; size: number; date: Date }>;
  /** Callback when operation completes */
  onComplete: (operation: BackupOperation, result: any) => void;
  /** Callback when cancelled */
  onCancel: () => void;
}

/**
 * Backup view component for backup and restore operations.
 *
 * @param props - Backup view component props
 * @returns Rendered backup view component
 *
 * @example
 * ```tsx
 * <BackupView
 *   sourcePath="/path/to/config"
 *   backups={existingBackups}
 *   onComplete={(op, result) => handleBackupComplete(op, result)}
 *   onCancel={() => goBack()}
 * />
 * ```
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export const BackupView: React.FC<BackupViewProps> = ({
  sourcePath,
  backups = [],
  onComplete,
  onCancel
}) => {
  const [state, setState] = useState<BackupViewState>('menu');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [pendingOperation, setPendingOperation] = useState<BackupOperation | null>(null);
  const [message, setMessage] = useState('');

  const menuItems = [
    { id: 'create', label: 'Create New Backup', icon: '💾' },
    { id: 'restore', label: 'Restore from Backup', icon: '♻️' },
    { id: 'list', label: 'View Existing Backups', icon: '📋' }
  ];

  useInput((input, key) => {
    if (state === 'menu') {
      if (key.upArrow) {
        setSelectedIndex(Math.max(0, selectedIndex - 1));
      }

      if (key.downArrow) {
        setSelectedIndex(Math.min(menuItems.length - 1, selectedIndex + 1));
      }

      if (key.return) {
        const selected = menuItems[selectedIndex];
        if (selected) {
          handleMenuSelection(selected.id as BackupOperation);
        }
      }
    }

    if (state === 'list') {
      if (key.upArrow) {
        setSelectedIndex(Math.max(0, selectedIndex - 1));
      }

      if (key.downArrow) {
        setSelectedIndex(Math.min(backups.length - 1, selectedIndex + 1));
      }

      if (key.return && backups.length > 0) {
        setPendingOperation('restore');
        setState('confirm');
      }
    }

    if (key.escape) {
      if (state === 'menu') {
        onCancel();
      } else if (state === 'list') {
        setState('menu');
        setSelectedIndex(0);
      }
    }
  });

  const handleMenuSelection = (operation: BackupOperation) => {
    if (operation === 'list') {
      setState('list');
      setSelectedIndex(0);
    } else {
      setPendingOperation(operation);
      setState('confirm');
    }
  };

  const performOperation = async () => {
    if (!pendingOperation) return;

    if (pendingOperation === 'create') {
      setState('creating');
      setProgress(0);

      // Simulate backup creation
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setMessage('Backup created successfully');
            setState('success');
            return 100;
          }
          return prev + 10;
        });
      }, 200);
    } else if (pendingOperation === 'restore') {
      setState('restoring');
      setProgress(0);

      // Simulate restore
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setMessage('Configuration restored successfully');
            setState('success');
            return 100;
          }
          return prev + 10;
        });
      }, 200);
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleString();
  };

  // Menu view
  if (state === 'menu') {
    return (
      <Box flexDirection="column">
        <Text bold color="cyan">
          Backup & Restore
        </Text>
        <Text dimColor>─────────────────────────────────────</Text>
        <Box marginBottom={1}>
          <Text dimColor>
            Source: {sourcePath}
          </Text>
        </Box>
        {menuItems.map((item, i) => (
          <Box key={item.id} marginBottom={1}>
            <Text
              color={i === selectedIndex ? 'green' : 'white'}
              bold={i === selectedIndex}
            >
              {i === selectedIndex ? '> ' : '  '}
              {item.icon} {item.label}
            </Text>
          </Box>
        ))}
        <Box marginTop={1}>
          <Text dimColor>
            ↑/↓: Navigate | Enter: Select | ESC: Exit
          </Text>
        </Box>
      </Box>
    );
  }

  // List backups view
  if (state === 'list') {
    return (
      <Box flexDirection="column">
        <Text bold color="cyan">
          Existing Backups ({backups.length})
        </Text>
        <Text dimColor>─────────────────────────────────────</Text>
        {backups.length === 0 ? (
          <Text dimColor>No backups found</Text>
        ) : (
          backups.map((backup, i) => (
            <Box key={backup.path} flexDirection="column" marginBottom={1}>
              <Text
                color={i === selectedIndex ? 'green' : 'white'}
                bold={i === selectedIndex}
              >
                {i === selectedIndex ? '> ' : '  '}
                {backup.name}
              </Text>
              {i === selectedIndex && (
                <Box marginLeft={4} flexDirection="column">
                  <Text dimColor>Path: {backup.path}</Text>
                  <Text dimColor>Size: {formatSize(backup.size)}</Text>
                  <Text dimColor>Date: {formatDate(backup.date)}</Text>
                </Box>
              )}
            </Box>
          ))
        )}
        <Box marginTop={1}>
          <Text dimColor>
            {backups.length > 0 ? '↑/↓: Navigate | Enter: Restore | ' : ''}ESC: Back
          </Text>
        </Box>
      </Box>
    );
  }

  // Confirm dialog
  if (state === 'confirm' && pendingOperation) {
    const messages = {
      create: 'Create a new backup of the current configuration?',
      restore: `Restore configuration from backup? This will overwrite current settings.`,
      list: ''
    };

    return (
      <ConfirmDialog
        title={`Confirm ${pendingOperation}`}
        message={messages[pendingOperation]}
        onConfirm={performOperation}
        onCancel={() => setState('menu')}
      />
    );
  }

  // Creating/Restoring view
  if (state === 'creating' || state === 'restoring') {
    const label = state === 'creating' ? 'Creating backup...' : 'Restoring configuration...';

    return (
      <Box flexDirection="column">
        <Text bold color="cyan">
          {state === 'creating' ? 'Creating Backup' : 'Restoring Configuration'}
        </Text>
        <Text dimColor>─────────────────────────────────────</Text>
        <Box marginTop={1}>
          <ProgressBar current={progress} total={100} label={label} />
        </Box>
        <Box marginTop={1}>
          <Text dimColor>
            Please wait...
          </Text>
        </Box>
      </Box>
    );
  }

  // Success view
  if (state === 'success') {
    return (
      <Box flexDirection="column">
        <Text bold color="cyan">
          Operation Complete
        </Text>
        <Text dimColor>─────────────────────────────────────</Text>
        <Box marginTop={1}>
          <StatusMessage type="success" message={message} />
        </Box>
        <Box marginTop={1}>
          <Text dimColor>
            Press ESC to return
          </Text>
        </Box>
      </Box>
    );
  }

  return null;
};
