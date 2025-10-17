import React, { useState } from 'react';
import { Box } from 'ink';
import { Menu, type MenuItem } from './Menu.js';
import { ConfigManager } from './ConfigManager.js';
import { MergeView } from './MergeView.js';
import { AuditView } from './AuditView.js';
import { BackupView } from './BackupView.js';
import { ForkDiscoveryView } from './ForkDiscoveryView.js';
import { type MergeConfig, type MergeResult } from '../merge/strategies.js';
import { type SecurityAuditResult } from '../merge/security-audit.js';

/**
 * Application view types.
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export type AppView =
  | 'menu'
  | 'config'
  | 'merge'
  | 'audit'
  | 'backup'
  | 'fork'
  | 'settings';

/**
 * App component props.
 *
 * @interface AppProps
 * @version 1.0.0
 * @since 1.0.0
 */
export interface AppProps {
  /** Initial view to display */
  initialView?: AppView;
  /** Configuration data (if available) */
  config?: MergeConfig;
  /** Configurations to merge (for merge view) */
  configs?: MergeConfig[];
  /** Callback when app exits */
  onExit: () => void;
}

/**
 * Main application component with view routing.
 *
 * @param props - App component props
 * @returns Rendered app component
 *
 * @example
 * ```tsx
 * <App
 *   initialView="menu"
 *   onExit={() => process.exit(0)}
 * />
 * ```
 *
 * @version 1.0.0
 * @since 1.0.0
 */
export const App: React.FC<AppProps> = ({
  initialView = 'menu',
  config,
  configs = [],
  onExit
}) => {
  const [currentView, setCurrentView] = useState<AppView>(initialView);
  const [currentConfig, setCurrentConfig] = useState<MergeConfig>(
    config || {
      permissions: [],
      mcpServers: {},
      settings: {}
    }
  );
  const [mergeResult, setMergeResult] = useState<MergeResult | null>(null);

  // Menu items
  const menuItems: MenuItem[] = [
    { id: 'config', title: 'Configuration Manager', icon: '⚙️' },
    { id: 'merge', title: 'Merge Configurations', icon: '🔀' },
    { id: 'fork', title: 'Fork Discovery', icon: '🔍' },
    { id: 'backup', title: 'Backup & Restore', icon: '💾' },
    { id: 'audit', title: 'Security Audit', icon: '🔒' },
    { id: 'settings', title: 'Settings', icon: '🎛️' },
    { id: 'exit', title: 'Exit', icon: '🚪' }
  ];

  // Handle menu selection
  const handleMenuSelect = (item: MenuItem) => {
    if (item.id === 'exit') {
      onExit();
      return;
    }

    setCurrentView(item.id as AppView);
  };

  // Handle merge completion
  const handleMergeComplete = (result: MergeResult) => {
    setMergeResult(result);
    setCurrentConfig(result);
    // Could navigate to audit or back to menu
    setCurrentView('menu');
  };

  // Handle audit completion
  const handleAuditComplete = (result: SecurityAuditResult) => {
    // Could save result or navigate
    setCurrentView('menu');
  };

  // Handle backup completion
  const handleBackupComplete = (operation: string, result: any) => {
    setCurrentView('menu');
  };

  // Handle fork discovery completion
  const handleForkComplete = (result: any) => {
    setCurrentView('menu');
  };

  // Navigation back to menu
  const goToMenu = () => {
    setCurrentView('menu');
  };

  // Render current view
  const renderView = () => {
    switch (currentView) {
      case 'menu':
        return (
          <Menu items={menuItems} onSelect={handleMenuSelect} onExit={onExit} />
        );

      case 'config':
        return <ConfigManager config={currentConfig} onCancel={goToMenu} />;

      case 'merge':
        return (
          <MergeView
            configs={configs.length > 0 ? configs : [currentConfig]}
            onComplete={handleMergeComplete}
            onCancel={goToMenu}
          />
        );

      case 'audit':
        return (
          <AuditView
            config={mergeResult || {
              ...currentConfig,
              conflicts: [],
              stats: {
                projectsAnalyzed: 0,
                conflictsDetected: 0,
                autoResolved: 0
              }
            }}
            onComplete={handleAuditComplete}
            onCancel={goToMenu}
          />
        );

      case 'backup':
        return (
          <BackupView
            sourcePath="~/.claude"
            backups={[
              {
                name: 'backup-2024-01-15.tar.gz',
                path: '/backups/backup-2024-01-15.tar.gz',
                size: 1024 * 512,
                date: new Date('2024-01-15')
              },
              {
                name: 'backup-2024-01-14.tar.gz',
                path: '/backups/backup-2024-01-14.tar.gz',
                size: 1024 * 498,
                date: new Date('2024-01-14')
              }
            ]}
            onComplete={handleBackupComplete}
            onCancel={goToMenu}
          />
        );

      case 'fork':
        return (
          <ForkDiscoveryView
            onComplete={handleForkComplete}
            onCancel={goToMenu}
          />
        );

      case 'settings':
        // Settings view not implemented yet - return to menu
        setCurrentView('menu');
        return (
          <Menu items={menuItems} onSelect={handleMenuSelect} onExit={onExit} />
        );

      default:
        return (
          <Menu items={menuItems} onSelect={handleMenuSelect} onExit={onExit} />
        );
    }
  };

  return <Box>{renderView()}</Box>;
};
