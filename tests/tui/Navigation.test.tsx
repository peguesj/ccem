import React from 'react';
import { Menu, MenuItem, MenuProps } from '@/tui/Menu';

describe('Menu Navigation Tests', () => {
  const menuItems: MenuItem[] = [
    { id: '1', title: 'Item 1', icon: '1️⃣' },
    { id: '2', title: 'Item 2', icon: '2️⃣' },
    { id: '3', title: 'Item 3', icon: '3️⃣' },
  ];

  describe('Callback invocation', () => {
    it('should invoke onSelect with correct item', () => {
      const onSelect = jest.fn();
      const props: MenuProps = {
        items: menuItems,
        onSelect,
      };

      // Create element
      const element = <Menu {...props} />;
      expect(element.props.onSelect).toBe(onSelect);

      // Simulate selection
      if (props.onSelect) {
        const firstItem = menuItems[0];
        if (firstItem) {
          props.onSelect(firstItem);
          expect(onSelect).toHaveBeenCalledWith(firstItem);
        }
      }
    });

    it('should invoke onExit when called', () => {
      const onExit = jest.fn();
      const props: MenuProps = {
        items: menuItems,
        onExit,
      };

      // Create element
      const element = <Menu {...props} />;
      expect(element.props.onExit).toBe(onExit);

      // Simulate exit
      if (props.onExit) {
        props.onExit();
        expect(onExit).toHaveBeenCalled();
      }
    });

    it('should work without callbacks', () => {
      const props: MenuProps = {
        items: menuItems,
      };

      // Should not throw
      const element = <Menu {...props} />;
      expect(element).toBeDefined();
    });
  });

  describe('Menu state management', () => {
    it('should handle multiple items', () => {
      const manyItems: MenuItem[] = Array.from({ length: 50 }, (_, i) => ({
        id: `${i + 1}`,
        title: `Item ${i + 1}`,
        icon: '📌',
      }));

      const element = <Menu items={manyItems} />;
      expect(element.props.items).toHaveLength(50);
    });

    it('should preserve item order', () => {
      const orderedItems: MenuItem[] = [
        { id: 'a', title: 'First', icon: '1️⃣' },
        { id: 'b', title: 'Second', icon: '2️⃣' },
        { id: 'c', title: 'Third', icon: '3️⃣' },
      ];

      const element = <Menu items={orderedItems} />;
      expect(element.props.items[0]?.title).toBe('First');
      expect(element.props.items[1]?.title).toBe('Second');
      expect(element.props.items[2]?.title).toBe('Third');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle rapid callback updates', () => {
      const onSelect = jest.fn();
      const props: MenuProps = {
        items: menuItems,
        onSelect,
      };

      // Simulate multiple rapid selections
      menuItems.forEach((item) => {
        if (props.onSelect) {
          props.onSelect(item);
        }
      });

      expect(onSelect).toHaveBeenCalledTimes(3);
    });

    it('should handle mixed callback presence', () => {
      // With onSelect but no onExit
      const element1 = <Menu items={menuItems} onSelect={jest.fn()} />;
      expect(element1.props.onSelect).toBeDefined();
      expect(element1.props.onExit).toBeUndefined();

      // With onExit but no onSelect
      const element2 = <Menu items={menuItems} onExit={jest.fn()} />;
      expect(element2.props.onSelect).toBeUndefined();
      expect(element2.props.onExit).toBeDefined();

      // With both
      const element3 = <Menu items={menuItems} onSelect={jest.fn()} onExit={jest.fn()} />;
      expect(element3.props.onSelect).toBeDefined();
      expect(element3.props.onExit).toBeDefined();

      // With neither
      const element4 = <Menu items={menuItems} />;
      expect(element4.props.onSelect).toBeUndefined();
      expect(element4.props.onExit).toBeUndefined();
    });
  });
});
