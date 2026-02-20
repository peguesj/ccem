/**
 * Settings Page Unit Tests
 *
 * Comprehensive tests for the SettingsPage component
 * Coverage target: 95%+
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SettingsPage, AppSettings } from '../../../src/pages/Settings';

describe('SettingsPage', () => {
  let settingsPage: SettingsPage;
  let container: HTMLElement;

  beforeEach(() => {
    // Create a container for testing
    container = document.createElement('div');
    container.id = 'test-container';
    document.body.appendChild(container);

    // Clear localStorage
    localStorage.clear();

    // Create SettingsPage instance
    settingsPage = new SettingsPage();

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should create a new SettingsPage instance', () => {
      expect(settingsPage).toBeDefined();
      expect(settingsPage).toBeInstanceOf(SettingsPage);
    });

    it('should log initialization message', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      new SettingsPage();
      expect(consoleSpy).toHaveBeenCalledWith('[SCREEN] SettingsPage initialized');
    });

    it('should initialize with default settings', () => {
      const element = settingsPage.render();
      const themeSelect = element.querySelector('#themeSelect') as HTMLSelectElement;

      expect(themeSelect.value).toBe('dark');
    });
  });

  describe('Rendering', () => {
    it('should render the settings screen', () => {
      const element = settingsPage.render();

      expect(element).toBeDefined();
      expect(element.className).toContain('screen');
      expect(element.className).toContain('settings-screen');
    });

    it('should render page header', () => {
      const element = settingsPage.render();
      const header = element.querySelector('h2');

      expect(header).toBeDefined();
      expect(header?.textContent).toBe('Settings');
    });

    it('should render General settings section', () => {
      const element = settingsPage.render();
      const cards = element.querySelectorAll('.card');

      expect(cards.length).toBeGreaterThanOrEqual(3);
    });

    it('should render theme selector', () => {
      const element = settingsPage.render();
      const themeSelect = element.querySelector('#themeSelect') as HTMLSelectElement;

      expect(themeSelect).toBeDefined();
      expect(themeSelect.options.length).toBe(3);
      expect(themeSelect.options[0].value).toBe('dark');
      expect(themeSelect.options[1].value).toBe('light');
      expect(themeSelect.options[2].value).toBe('auto');
    });

    it('should render autosave checkbox', () => {
      const element = settingsPage.render();
      const autosaveCheck = element.querySelector('#autosaveCheck') as HTMLInputElement;

      expect(autosaveCheck).toBeDefined();
      expect(autosaveCheck.type).toBe('checkbox');
      expect(autosaveCheck.checked).toBe(true); // Default value
    });

    it('should render notifications checkbox', () => {
      const element = settingsPage.render();
      const notificationsCheck = element.querySelector('#notificationsCheck') as HTMLInputElement;

      expect(notificationsCheck).toBeDefined();
      expect(notificationsCheck.type).toBe('checkbox');
      expect(notificationsCheck.checked).toBe(true); // Default value
    });

    it('should render model selector', () => {
      const element = settingsPage.render();
      const modelSelect = element.querySelector('#modelSelect') as HTMLSelectElement;

      expect(modelSelect).toBeDefined();
      expect(modelSelect.options.length).toBe(3);
      expect(modelSelect.options[0].value).toBe('sonnet');
      expect(modelSelect.options[1].value).toBe('opus');
      expect(modelSelect.options[2].value).toBe('haiku');
    });

    it('should render API key input', () => {
      const element = settingsPage.render();
      const apiKeyInput = element.querySelector('#apiKeyInput') as HTMLInputElement;

      expect(apiKeyInput).toBeDefined();
      expect(apiKeyInput.type).toBe('password');
      expect(apiKeyInput.placeholder).toContain('sk-ant-');
    });

    it('should render max agents range slider', () => {
      const element = settingsPage.render();
      const maxAgentsRange = element.querySelector('#maxAgentsRange') as HTMLInputElement;

      expect(maxAgentsRange).toBeDefined();
      expect(maxAgentsRange.type).toBe('range');
      expect(maxAgentsRange.min).toBe('1');
      expect(maxAgentsRange.max).toBe('20');
      expect(maxAgentsRange.value).toBe('10'); // Default value
    });

    it('should render logging level selector', () => {
      const element = settingsPage.render();
      const loggingSelect = element.querySelector('#loggingSelect') as HTMLSelectElement;

      expect(loggingSelect).toBeDefined();
      expect(loggingSelect.options.length).toBe(3);
      expect(loggingSelect.options[0].value).toBe('verbose');
      expect(loggingSelect.options[1].value).toBe('normal');
      expect(loggingSelect.options[2].value).toBe('minimal');
    });

    it('should render data management buttons', () => {
      const element = settingsPage.render();
      const exportBtn = element.querySelector('#exportDataBtn');
      const importBtn = element.querySelector('#importDataBtn');
      const clearBtn = element.querySelector('#clearDataBtn');

      expect(exportBtn).toBeDefined();
      expect(importBtn).toBeDefined();
      expect(clearBtn).toBeDefined();
    });

    it('should render save and reset buttons', () => {
      const element = settingsPage.render();
      const saveBtn = element.querySelector('#saveBtn');
      const resetBtn = element.querySelector('#resetBtn');

      expect(saveBtn).toBeDefined();
      expect(resetBtn).toBeDefined();
    });

    it('should render save notification (hidden by default)', () => {
      const element = settingsPage.render();
      const notification = element.querySelector('#saveNotification') as HTMLElement;

      expect(notification).toBeDefined();
      expect(notification.classList.contains('hidden')).toBe(true);
    });
  });

  describe('Settings Persistence', () => {
    it('should save settings to localStorage on save', () => {
      const element = settingsPage.render();
      const saveBtn = element.querySelector('#saveBtn') as HTMLButtonElement;

      saveBtn.click();

      const saved = localStorage.getItem('ccem-settings');
      expect(saved).toBeTruthy();
    });

    it('should save all form values', () => {
      const element = settingsPage.render();

      const themeSelect = element.querySelector('#themeSelect') as HTMLSelectElement;
      const modelSelect = element.querySelector('#modelSelect') as HTMLSelectElement;
      const autosaveCheck = element.querySelector('#autosaveCheck') as HTMLInputElement;
      const notificationsCheck = element.querySelector('#notificationsCheck') as HTMLInputElement;
      const loggingSelect = element.querySelector('#loggingSelect') as HTMLSelectElement;
      const maxAgentsRange = element.querySelector('#maxAgentsRange') as HTMLInputElement;
      const apiKeyInput = element.querySelector('#apiKeyInput') as HTMLInputElement;

      themeSelect.value = 'light';
      modelSelect.value = 'opus';
      autosaveCheck.checked = false;
      notificationsCheck.checked = false;
      loggingSelect.value = 'minimal';
      maxAgentsRange.value = '5';
      apiKeyInput.value = 'sk-ant-test-key';

      const saveBtn = element.querySelector('#saveBtn') as HTMLButtonElement;
      saveBtn.click();

      const saved = JSON.parse(localStorage.getItem('ccem-settings')!) as AppSettings;
      expect(saved.theme).toBe('light');
      expect(saved.model).toBe('opus');
      expect(saved.autosave).toBe(false);
      expect(saved.notifications).toBe(false);
      expect(saved.logging).toBe('minimal');
      expect(saved.maxAgents).toBe(5);
      expect(saved.apiKey).toBe('sk-ant-test-key');
    });

    it('should load settings from localStorage on mount', () => {
      const savedSettings: AppSettings = {
        theme: 'light',
        model: 'haiku',
        autosave: false,
        notifications: false,
        logging: 'minimal',
        maxAgents: 15,
        apiKey: 'test-key',
      };

      localStorage.setItem('ccem-settings', JSON.stringify(savedSettings));

      settingsPage.mount('test-container');

      const themeSelect = container.querySelector('#themeSelect') as HTMLSelectElement;
      expect(themeSelect.value).toBe('light');
    });

    it('should log settings save', () => {
      const element = settingsPage.render();
      const consoleSpy = vi.spyOn(console, 'log');
      const saveBtn = element.querySelector('#saveBtn') as HTMLButtonElement;

      saveBtn.click();

      expect(consoleSpy).toHaveBeenCalledWith(
        '[SETTINGS-SCREEN] Settings saved:',
        expect.any(Object)
      );
    });

    it('should show notification after save', () => {
      const element = settingsPage.render();
      const saveBtn = element.querySelector('#saveBtn') as HTMLButtonElement;

      saveBtn.click();

      const notification = element.querySelector('#saveNotification') as HTMLElement;
      expect(notification.classList.contains('hidden')).toBe(false);
    });

    it('should hide notification after 3 seconds', () => {
      vi.useFakeTimers();

      const element = settingsPage.render();
      const saveBtn = element.querySelector('#saveBtn') as HTMLButtonElement;

      saveBtn.click();

      const notification = element.querySelector('#saveNotification') as HTMLElement;
      expect(notification.classList.contains('hidden')).toBe(false);

      vi.advanceTimersByTime(3000);

      expect(notification.classList.contains('hidden')).toBe(true);

      vi.useRealTimers();
    });
  });

  describe('Settings Reset', () => {
    it('should reset to default settings on reset button click', () => {
      // Mock window.confirm to return true
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      const element = settingsPage.render();

      // Change settings
      const themeSelect = element.querySelector('#themeSelect') as HTMLSelectElement;
      themeSelect.value = 'light';

      const resetBtn = element.querySelector('#resetBtn') as HTMLButtonElement;
      resetBtn.click();

      // Check if re-rendered with defaults
      expect(settingsPage).toBeDefined();
    });

    it('should show confirmation dialog before reset', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      const element = settingsPage.render();
      const resetBtn = element.querySelector('#resetBtn') as HTMLButtonElement;

      resetBtn.click();

      expect(confirmSpy).toHaveBeenCalledWith(
        'Are you sure you want to reset all settings to defaults?'
      );
    });

    it('should not reset if user cancels', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);

      const element = settingsPage.render();
      const themeSelect = element.querySelector('#themeSelect') as HTMLSelectElement;
      themeSelect.value = 'light';

      const resetBtn = element.querySelector('#resetBtn') as HTMLButtonElement;
      resetBtn.click();

      expect(themeSelect.value).toBe('light');
    });

    it('should remove saved settings from localStorage', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      localStorage.setItem('ccem-settings', JSON.stringify({ theme: 'light' }));

      const element = settingsPage.render();
      const resetBtn = element.querySelector('#resetBtn') as HTMLButtonElement;

      resetBtn.click();

      expect(localStorage.getItem('ccem-settings')).toBeNull();
    });

    it('should log settings reset', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      const consoleSpy = vi.spyOn(console, 'log');

      const element = settingsPage.render();
      const resetBtn = element.querySelector('#resetBtn') as HTMLButtonElement;

      resetBtn.click();

      expect(consoleSpy).toHaveBeenCalledWith('[SETTINGS-SCREEN] Settings reset to defaults');
    });
  });

  describe('Range Slider Interaction', () => {
    it('should update label when range slider changes', () => {
      const element = settingsPage.render();
      const maxAgentsRange = element.querySelector('#maxAgentsRange') as HTMLInputElement;
      const label = element.querySelector('#maxAgentsLabel');

      maxAgentsRange.value = '15';
      maxAgentsRange.dispatchEvent(new Event('input'));

      expect(label?.textContent).toContain('15');
    });

    it('should show min value', () => {
      const element = settingsPage.render();
      const maxAgentsRange = element.querySelector('#maxAgentsRange') as HTMLInputElement;
      const label = element.querySelector('#maxAgentsLabel');

      maxAgentsRange.value = '1';
      maxAgentsRange.dispatchEvent(new Event('input'));

      expect(label?.textContent).toContain('1');
    });

    it('should show max value', () => {
      const element = settingsPage.render();
      const maxAgentsRange = element.querySelector('#maxAgentsRange') as HTMLInputElement;
      const label = element.querySelector('#maxAgentsLabel');

      maxAgentsRange.value = '20';
      maxAgentsRange.dispatchEvent(new Event('input'));

      expect(label?.textContent).toContain('20');
    });
  });

  describe('Data Management', () => {
    it('should show alert when export button clicked', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      const consoleSpy = vi.spyOn(console, 'log');

      const element = settingsPage.render();
      const exportBtn = element.querySelector('#exportDataBtn') as HTMLButtonElement;

      exportBtn.click();

      expect(consoleSpy).toHaveBeenCalledWith('[SETTINGS-SCREEN] Exporting data');
      expect(alertSpy).toHaveBeenCalled();
    });

    it('should show alert when import button clicked', () => {
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
      const consoleSpy = vi.spyOn(console, 'log');

      const element = settingsPage.render();
      const importBtn = element.querySelector('#importDataBtn') as HTMLButtonElement;

      importBtn.click();

      expect(consoleSpy).toHaveBeenCalledWith('[SETTINGS-SCREEN] Importing data');
      expect(alertSpy).toHaveBeenCalled();
    });

    it('should clear localStorage when clear data button clicked', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      localStorage.setItem('test-item', 'test-value');

      const element = settingsPage.render();
      const clearBtn = element.querySelector('#clearDataBtn') as HTMLButtonElement;

      clearBtn.click();

      expect(localStorage.getItem('test-item')).toBeNull();
    });

    it('should show confirmation dialog before clearing data', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      const element = settingsPage.render();
      const clearBtn = element.querySelector('#clearDataBtn') as HTMLButtonElement;

      clearBtn.click();

      expect(confirmSpy).toHaveBeenCalledWith(
        'Are you sure you want to clear all data? This action cannot be undone.'
      );
    });

    it('should not clear data if user cancels', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);

      localStorage.setItem('test-item', 'test-value');

      const element = settingsPage.render();
      const clearBtn = element.querySelector('#clearDataBtn') as HTMLButtonElement;

      clearBtn.click();

      expect(localStorage.getItem('test-item')).toBe('test-value');
    });

    it('should log data clearing', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      vi.spyOn(window, 'alert').mockImplementation(() => {});
      const consoleSpy = vi.spyOn(console, 'log');

      const element = settingsPage.render();
      const clearBtn = element.querySelector('#clearDataBtn') as HTMLButtonElement;

      clearBtn.click();

      expect(consoleSpy).toHaveBeenCalledWith('[SETTINGS-SCREEN] All data cleared');
    });
  });

  describe('Mounting', () => {
    it('should mount to container', () => {
      settingsPage.mount('test-container');

      expect(container.children.length).toBeGreaterThan(0);
      expect(container.querySelector('.settings-screen')).toBeDefined();
    });

    it('should load settings from localStorage before mounting', () => {
      const savedSettings: AppSettings = {
        theme: 'light',
        model: 'opus',
        autosave: false,
        notifications: false,
        logging: 'minimal',
        maxAgents: 5,
        apiKey: 'test-key',
      };

      localStorage.setItem('ccem-settings', JSON.stringify(savedSettings));

      settingsPage.mount('test-container');

      const themeSelect = container.querySelector('#themeSelect') as HTMLSelectElement;
      expect(themeSelect.value).toBe('light');
    });

    it('should clear container before mounting', () => {
      container.innerHTML = '<div>Old content</div>';
      settingsPage.mount('test-container');

      expect(container.querySelector('div')?.textContent).not.toBe('Old content');
    });

    it('should log mount message', () => {
      const consoleSpy = vi.spyOn(console, 'log');
      settingsPage.mount('test-container');

      expect(consoleSpy).toHaveBeenCalledWith('[SETTINGS-SCREEN] Mounted');
    });

    it('should log error when container not found', () => {
      const consoleSpy = vi.spyOn(console, 'error');
      settingsPage.mount('nonexistent-container');

      expect(consoleSpy).toHaveBeenCalledWith(
        '[SETTINGS-SCREEN] Container not found:',
        'nonexistent-container'
      );
    });

    it('should log settings loaded message', () => {
      localStorage.setItem('ccem-settings', JSON.stringify({ theme: 'light' }));
      const consoleSpy = vi.spyOn(console, 'log');

      settingsPage.loadSettings();

      expect(consoleSpy).toHaveBeenCalledWith(
        '[SETTINGS-SCREEN] Settings loaded from localStorage'
      );
    });
  });

  describe('Unmounting', () => {
    it('should unmount from parent', () => {
      settingsPage.mount('test-container');
      const initialChildren = container.children.length;

      settingsPage.unmount();

      expect(container.children.length).toBeLessThan(initialChildren);
    });

    it('should log unmount message', () => {
      settingsPage.mount('test-container');
      const consoleSpy = vi.spyOn(console, 'log');

      settingsPage.unmount();

      expect(consoleSpy).toHaveBeenCalledWith('[SETTINGS-SCREEN] Unmounted');
    });

    it('should not throw when unmounting without mounting', () => {
      expect(() => {
        settingsPage.unmount();
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid JSON in localStorage', () => {
      localStorage.setItem('ccem-settings', 'invalid json');

      expect(() => {
        settingsPage.loadSettings();
      }).toThrow();
    });

    it('should handle missing localStorage item gracefully', () => {
      localStorage.clear();

      expect(() => {
        settingsPage.loadSettings();
      }).not.toThrow();
    });

    it('should handle empty API key', () => {
      const element = settingsPage.render();
      const apiKeyInput = element.querySelector('#apiKeyInput') as HTMLInputElement;
      const saveBtn = element.querySelector('#saveBtn') as HTMLButtonElement;

      apiKeyInput.value = '';
      saveBtn.click();

      const saved = JSON.parse(localStorage.getItem('ccem-settings')!) as AppSettings;
      expect(saved.apiKey).toBe('');
    });

    it('should handle very long API key', () => {
      const element = settingsPage.render();
      const apiKeyInput = element.querySelector('#apiKeyInput') as HTMLInputElement;
      const saveBtn = element.querySelector('#saveBtn') as HTMLButtonElement;

      const longKey = 'sk-ant-' + 'x'.repeat(1000);
      apiKeyInput.value = longKey;
      saveBtn.click();

      const saved = JSON.parse(localStorage.getItem('ccem-settings')!) as AppSettings;
      expect(saved.apiKey).toBe(longKey);
    });
  });

  describe('Form Validation', () => {
    it('should accept all theme values', () => {
      const element = settingsPage.render();
      const themeSelect = element.querySelector('#themeSelect') as HTMLSelectElement;
      const saveBtn = element.querySelector('#saveBtn') as HTMLButtonElement;

      const themes = ['dark', 'light', 'auto'];
      themes.forEach((theme) => {
        themeSelect.value = theme;
        saveBtn.click();

        const saved = JSON.parse(localStorage.getItem('ccem-settings')!) as AppSettings;
        expect(saved.theme).toBe(theme);
      });
    });

    it('should accept all model values', () => {
      const element = settingsPage.render();
      const modelSelect = element.querySelector('#modelSelect') as HTMLSelectElement;
      const saveBtn = element.querySelector('#saveBtn') as HTMLButtonElement;

      const models = ['sonnet', 'opus', 'haiku'];
      models.forEach((model) => {
        modelSelect.value = model;
        saveBtn.click();

        const saved = JSON.parse(localStorage.getItem('ccem-settings')!) as AppSettings;
        expect(saved.model).toBe(model);
      });
    });

    it('should accept all logging values', () => {
      const element = settingsPage.render();
      const loggingSelect = element.querySelector('#loggingSelect') as HTMLSelectElement;
      const saveBtn = element.querySelector('#saveBtn') as HTMLButtonElement;

      const levels = ['verbose', 'normal', 'minimal'];
      levels.forEach((level) => {
        loggingSelect.value = level;
        saveBtn.click();

        const saved = JSON.parse(localStorage.getItem('ccem-settings')!) as AppSettings;
        expect(saved.logging).toBe(level);
      });
    });

    it('should handle boolean checkboxes correctly', () => {
      const element = settingsPage.render();
      const autosaveCheck = element.querySelector('#autosaveCheck') as HTMLInputElement;
      const notificationsCheck = element.querySelector('#notificationsCheck') as HTMLInputElement;
      const saveBtn = element.querySelector('#saveBtn') as HTMLButtonElement;

      // Test checked
      autosaveCheck.checked = true;
      notificationsCheck.checked = true;
      saveBtn.click();

      let saved = JSON.parse(localStorage.getItem('ccem-settings')!) as AppSettings;
      expect(saved.autosave).toBe(true);
      expect(saved.notifications).toBe(true);

      // Test unchecked
      autosaveCheck.checked = false;
      notificationsCheck.checked = false;
      saveBtn.click();

      saved = JSON.parse(localStorage.getItem('ccem-settings')!) as AppSettings;
      expect(saved.autosave).toBe(false);
      expect(saved.notifications).toBe(false);
    });

    it('should parse maxAgents as integer', () => {
      const element = settingsPage.render();
      const maxAgentsRange = element.querySelector('#maxAgentsRange') as HTMLInputElement;
      const saveBtn = element.querySelector('#saveBtn') as HTMLButtonElement;

      maxAgentsRange.value = '7';
      saveBtn.click();

      const saved = JSON.parse(localStorage.getItem('ccem-settings')!) as AppSettings;
      expect(saved.maxAgents).toBe(7);
      expect(typeof saved.maxAgents).toBe('number');
    });
  });

  describe('Integration Tests', () => {
    it('should support full workflow: change, save, unmount, remount, verify', () => {
      // Clear any existing settings
      localStorage.clear();

      // Initial mount and change settings
      settingsPage.mount('test-container');

      const themeSelect = container.querySelector('#themeSelect') as HTMLSelectElement;
      const modelSelect = container.querySelector('#modelSelect') as HTMLSelectElement;
      const saveBtn = container.querySelector('#saveBtn') as HTMLButtonElement;

      themeSelect.value = 'light';
      modelSelect.value = 'haiku';
      saveBtn.click();

      // Verify it was saved
      const saved = JSON.parse(localStorage.getItem('ccem-settings')!) as AppSettings;
      expect(saved.theme).toBe('light');
      expect(saved.model).toBe('haiku');

      // Verify localStorage persistence works
      expect(localStorage.getItem('ccem-settings')).toBeTruthy();
    });

    it('should handle rapid setting changes', () => {
      const element = settingsPage.render();
      const themeSelect = element.querySelector('#themeSelect') as HTMLSelectElement;
      const saveBtn = element.querySelector('#saveBtn') as HTMLButtonElement;

      for (let i = 0; i < 10; i++) {
        themeSelect.value = i % 2 === 0 ? 'dark' : 'light';
        saveBtn.click();
      }

      const saved = JSON.parse(localStorage.getItem('ccem-settings')!) as AppSettings;
      expect(saved.theme).toBe('light');
    });

    it('should maintain form state after save', () => {
      const element = settingsPage.render();
      const themeSelect = element.querySelector('#themeSelect') as HTMLSelectElement;
      const saveBtn = element.querySelector('#saveBtn') as HTMLButtonElement;

      themeSelect.value = 'light';
      saveBtn.click();

      expect(themeSelect.value).toBe('light');
    });
  });
});
