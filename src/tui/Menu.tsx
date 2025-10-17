import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';

/**
 * Menu item interface.
 *
 * @interface MenuItem
 * @version 0.3.0
 * @since 0.3.0
 */
export interface MenuItem {
  /** Unique identifier */
  id: string;
  /** Display title */
  title: string;
  /** Icon emoji */
  icon: string;
}

/**
 * Menu component props.
 *
 * @interface MenuProps
 * @version 0.3.0
 * @since 0.3.0
 */
export interface MenuProps {
  /** Menu items to display */
  items: MenuItem[];
  /** Callback when item is selected */
  onSelect?: (item: MenuItem) => void;
  /** Callback when menu is exited */
  onExit?: () => void;
}

/**
 * Interactive menu component with keyboard navigation.
 *
 * Supports arrow keys for navigation, Enter for selection, and Escape to exit.
 *
 * @param props - Menu component props
 * @returns Rendered menu component
 *
 * @example
 * ```tsx
 * <Menu
 *   items={menuItems}
 *   onSelect={(item) => console.log('Selected:', item)}
 *   onExit={() => console.log('Exited')}
 * />
 * ```
 *
 * @version 0.3.0
 * @since 0.3.0
 */
export const Menu: React.FC<MenuProps> = ({ items, onSelect, onExit }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex(Math.max(0, selectedIndex - 1));
    }

    if (key.downArrow) {
      setSelectedIndex(Math.min(items.length - 1, selectedIndex + 1));
    }

    if (key.return) {
      const selectedItem = items[selectedIndex];
      if (selectedItem) {
        onSelect?.(selectedItem);
      }
    }

    if (key.escape) {
      onExit?.();
    }
  });

  return (
    <Box flexDirection="column">
      <Text bold color="cyan">
        Main Menu
      </Text>
      <Text dimColor>─────────────────────────────────────</Text>
      {items.map((item, index) => (
        <Text
          key={item.id}
          color={index === selectedIndex ? 'green' : 'white'}
          bold={index === selectedIndex}
        >
          {index === selectedIndex ? '> ' : '  '}
          {item.icon} {item.title}
        </Text>
      ))}
    </Box>
  );
};
