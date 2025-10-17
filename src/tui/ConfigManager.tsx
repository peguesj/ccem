import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { type MergeConfig } from '../merge/strategies.js';

/**
 * Config manager view state.
 *
 * @version 1.0.0
 * @since 1.0.0
 */
type ConfigManagerState = 'overview' | 'permissions' | 'mcpServers' | 'settings';

/**
 * Config manager component props.
 *
 * @interface ConfigManagerProps
 * @version 1.0.0
 * @since 1.0.0
 */
export interface ConfigManagerProps {
  /** Configuration to display */
  config: MergeConfig;
  /** Callback when cancelled */
  onCancel: () => void;
}

/**
 * Config manager view component for browsing configurations.
 *
 * @param props - Config manager component props
 * @returns Rendered config manager component
 *
 * @example
 * ```tsx
 * <ConfigManager
 *   config={currentConfig}
 *   onCancel={() => goBack()}
 * />
 * ```
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export const ConfigManager: React.FC<ConfigManagerProps> = ({
  config,
  onCancel
}) => {
  const [state, setState] = useState<ConfigManagerState>('overview');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((input, key) => {
    if (state === 'overview') {
      if (key.upArrow) {
        setSelectedIndex(Math.max(0, selectedIndex - 1));
      }

      if (key.downArrow) {
        setSelectedIndex(Math.min(2, selectedIndex + 1));
      }

      if (key.return) {
        const sections: ConfigManagerState[] = ['permissions', 'mcpServers', 'settings'];
        setState(sections[selectedIndex]!);
        setSelectedIndex(0);
      }
    } else {
      // In detail view
      const items = getItemsForState(state);

      if (key.upArrow) {
        setSelectedIndex(Math.max(0, selectedIndex - 1));
      }

      if (key.downArrow) {
        setSelectedIndex(Math.min(items.length - 1, selectedIndex + 1));
      }
    }

    if (key.escape) {
      if (state === 'overview') {
        onCancel();
      } else {
        setState('overview');
        setSelectedIndex(0);
      }
    }
  });

  const getItemsForState = (currentState: ConfigManagerState): string[] => {
    switch (currentState) {
      case 'permissions':
        return config.permissions;
      case 'mcpServers':
        return Object.keys(config.mcpServers);
      case 'settings':
        return Object.keys(config.settings);
      default:
        return [];
    }
  };

  // Overview view
  if (state === 'overview') {
    const sections = [
      {
        name: 'Permissions',
        count: config.permissions.length,
        icon: '🔐'
      },
      {
        name: 'MCP Servers',
        count: Object.keys(config.mcpServers).length,
        icon: '🔌'
      },
      {
        name: 'Settings',
        count: Object.keys(config.settings).length,
        icon: '⚙️'
      }
    ];

    return (
      <Box flexDirection="column">
        <Text bold color="cyan">
          Configuration Manager
        </Text>
        <Text dimColor>─────────────────────────────────────</Text>
        <Box marginBottom={1}>
          <Text>Browse and inspect configuration</Text>
        </Box>
        {sections.map((section, i) => (
          <Box key={section.name} marginBottom={1}>
            <Text
              color={i === selectedIndex ? 'green' : 'white'}
              bold={i === selectedIndex}
            >
              {i === selectedIndex ? '> ' : '  '}
              {section.icon} {section.name} ({section.count})
            </Text>
          </Box>
        ))}
        <Box marginTop={1}>
          <Text dimColor>
            ↑/↓: Navigate | Enter: View Details | ESC: Exit
          </Text>
        </Box>
      </Box>
    );
  }

  // Permissions detail view
  if (state === 'permissions') {
    const maxVisible = 10;
    const visiblePermissions = config.permissions.slice(
      Math.max(0, selectedIndex - maxVisible + 1),
      selectedIndex + 1
    );

    return (
      <Box flexDirection="column">
        <Text bold color="cyan">
          Permissions ({config.permissions.length})
        </Text>
        <Text dimColor>─────────────────────────────────────</Text>
        {visiblePermissions.map((permission, i) => {
          const actualIndex = selectedIndex - (visiblePermissions.length - 1) + i;
          const isSelected = actualIndex === selectedIndex;

          return (
            <Text
              key={actualIndex}
              color={isSelected ? 'green' : 'white'}
              bold={isSelected}
            >
              {isSelected ? '> ' : '  '}
              {permission}
            </Text>
          );
        })}
        {config.permissions.length > maxVisible && (
          <Box marginTop={1}>
            <Text dimColor>
              Showing {selectedIndex + 1} of {config.permissions.length}
            </Text>
          </Box>
        )}
        <Box marginTop={1}>
          <Text dimColor>
            ↑/↓: Navigate | ESC: Back
          </Text>
        </Box>
      </Box>
    );
  }

  // MCP Servers detail view
  if (state === 'mcpServers') {
    const serverNames = Object.keys(config.mcpServers);
    const selectedServer = serverNames[selectedIndex];
    const serverConfig = selectedServer ? config.mcpServers[selectedServer] : null;

    return (
      <Box flexDirection="column">
        <Text bold color="cyan">
          MCP Servers ({serverNames.length})
        </Text>
        <Text dimColor>─────────────────────────────────────</Text>
        <Box flexDirection="column">
          {serverNames.map((name, i) => (
            <Box key={name} flexDirection="column" marginBottom={1}>
              <Text
                color={i === selectedIndex ? 'green' : 'white'}
                bold={i === selectedIndex}
              >
                {i === selectedIndex ? '> ' : '  '}
                {name}
              </Text>
              {i === selectedIndex && serverConfig && (
                <Box marginLeft={4} flexDirection="column">
                  <Text dimColor>
                    Enabled: {serverConfig.enabled ? 'Yes' : 'No'}
                  </Text>
                  {Object.entries(serverConfig)
                    .filter(([key]) => key !== 'enabled')
                    .map(([key, value]) => (
                      <Text key={key} dimColor>
                        {key}: {JSON.stringify(value)}
                      </Text>
                    ))}
                </Box>
              )}
            </Box>
          ))}
        </Box>
        <Box marginTop={1}>
          <Text dimColor>
            ↑/↓: Navigate | ESC: Back
          </Text>
        </Box>
      </Box>
    );
  }

  // Settings detail view
  if (state === 'settings') {
    const settingKeys = Object.keys(config.settings);
    const selectedKey = settingKeys[selectedIndex];
    const selectedValue = selectedKey ? config.settings[selectedKey] : null;

    return (
      <Box flexDirection="column">
        <Text bold color="cyan">
          Settings ({settingKeys.length})
        </Text>
        <Text dimColor>─────────────────────────────────────</Text>
        <Box flexDirection="column">
          {settingKeys.map((key, i) => (
            <Box key={key} flexDirection="column" marginBottom={1}>
              <Text
                color={i === selectedIndex ? 'green' : 'white'}
                bold={i === selectedIndex}
              >
                {i === selectedIndex ? '> ' : '  '}
                {key}
              </Text>
              {i === selectedIndex && (
                <Box marginLeft={4}>
                  <Text color="cyan">
                    {JSON.stringify(config.settings[key], null, 2)}
                  </Text>
                </Box>
              )}
            </Box>
          ))}
        </Box>
        <Box marginTop={1}>
          <Text dimColor>
            ↑/↓: Navigate | ESC: Back
          </Text>
        </Box>
      </Box>
    );
  }

  return null;
};
