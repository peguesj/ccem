import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

/**
 * File selector item interface.
 *
 * @interface FileItem
 * @version 1.0.0
 * @since 1.0.0
 */
export interface FileItem {
  /** File name */
  name: string;
  /** File path */
  path: string;
  /** Is directory */
  isDirectory: boolean;
  /** File size in bytes (for files) */
  size?: number;
}

/**
 * File selector component props.
 *
 * @interface FileSelectorProps
 * @version 1.0.0
 * @since 1.0.0
 */
export interface FileSelectorProps {
  /** Files to display */
  files: FileItem[];
  /** Current directory path */
  currentPath: string;
  /** Callback when file is selected */
  onSelect: (file: FileItem) => void;
  /** Callback when cancelled */
  onCancel: () => void;
  /** Maximum height for the file list */
  maxHeight?: number;
}

/**
 * File selector component for browsing and selecting files.
 *
 * @param props - File selector component props
 * @returns Rendered file selector component
 *
 * @example
 * ```tsx
 * <FileSelector
 *   files={fileList}
 *   currentPath="/path/to/dir"
 *   onSelect={(file) => handleFileSelect(file)}
 *   onCancel={() => setShowSelector(false)}
 * />
 * ```
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export const FileSelector: React.FC<FileSelectorProps> = ({
  files,
  currentPath,
  onSelect,
  onCancel,
  maxHeight = 10
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex(Math.max(0, selectedIndex - 1));
    }

    if (key.downArrow) {
      setSelectedIndex(Math.min(files.length - 1, selectedIndex + 1));
    }

    if (key.return) {
      const selectedFile = files[selectedIndex];
      if (selectedFile) {
        onSelect(selectedFile);
      }
    }

    if (key.escape) {
      onCancel();
    }
  });

  const formatSize = (bytes?: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <Box flexDirection="column">
      <Text bold color="cyan">
        Select File
      </Text>
      <Text dimColor>Current: {currentPath}</Text>
      <Text dimColor>─────────────────────────────────────</Text>
      <Box flexDirection="column">
        {files.slice(0, maxHeight).map((file, index) => (
          <Box key={file.path} gap={1}>
            <Text
              color={index === selectedIndex ? 'green' : 'white'}
              bold={index === selectedIndex}
            >
              {index === selectedIndex ? '> ' : '  '}
              {file.isDirectory ? '📁' : '📄'} {file.name}
            </Text>
            {!file.isDirectory && file.size && (
              <Text dimColor>{formatSize(file.size)}</Text>
            )}
          </Box>
        ))}
      </Box>
      <Box marginTop={1}>
        <Text dimColor>↑/↓: Navigate | Enter: Select | ESC: Cancel</Text>
      </Box>
    </Box>
  );
};
