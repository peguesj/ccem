import * as TUI from '@/tui';
import { Menu, MenuItem, MenuProps } from '@/tui/Menu';

describe('TUI Module', () => {
  it('should export Menu component', () => {
    expect(TUI.Menu).toBeDefined();
    expect(TUI.Menu).toBe(Menu);
  });

  it('should export MenuItem interface', () => {
    // Type check - will fail at compile time if not exported
    const item: MenuItem = {
      id: '1',
      title: 'Test',
      icon: '🔍',
    };
    expect(item).toBeDefined();
  });

  it('should export MenuProps interface', () => {
    // Type check - will fail at compile time if not exported
    const props: MenuProps = {
      items: [{ id: '1', title: 'Test', icon: '🔍' }],
    };
    expect(props).toBeDefined();
  });

  it('should have correct module structure', () => {
    // Verify all expected exports are present
    expect(TUI).toHaveProperty('Menu');
  });
});
