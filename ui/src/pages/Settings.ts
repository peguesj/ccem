/**
 * CCEM-UI Settings Page
 * Application settings and preferences
 */

/**
 * Settings interface
 */
export interface AppSettings {
  theme: 'dark' | 'light' | 'auto';
  model: 'sonnet' | 'opus' | 'haiku';
  autosave: boolean;
  notifications: boolean;
  logging: 'verbose' | 'normal' | 'minimal';
  maxAgents: number;
  apiKey: string;
}

/**
 * Settings page component
 */
export class SettingsPage {
  private element: HTMLElement | null = null;
  private settings: AppSettings;

  /**
   * Creates a new SettingsPage instance
   */
  constructor() {
    this.settings = this.getDefaultSettings();
    console.log('[SCREEN] SettingsPage initialized');
  }

  /**
   * Get default settings
   * @returns Default settings
   */
  private getDefaultSettings(): AppSettings {
    return {
      theme: 'dark',
      model: 'sonnet',
      autosave: true,
      notifications: true,
      logging: 'verbose',
      maxAgents: 10,
      apiKey: '',
    };
  }

  /**
   * Render the settings screen
   * @returns Screen element
   */
  render(): HTMLElement {
    const screen = document.createElement('div');
    screen.className = 'screen settings-screen';
    screen.style.cssText = `
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    `;

    screen.innerHTML = `
      <h2 class="mb-6">Settings</h2>

      <!-- General Settings -->
      <div class="card mb-6">
        <div class="card-header">
          <h3>General</h3>
        </div>
        <div class="card-body">
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">Theme</label>
            <select class="input" id="themeSelect">
              <option value="dark" ${this.settings.theme === 'dark' ? 'selected' : ''}>Dark</option>
              <option value="light" ${this.settings.theme === 'light' ? 'selected' : ''}>Light</option>
              <option value="auto" ${this.settings.theme === 'auto' ? 'selected' : ''}>Auto</option>
            </select>
          </div>

          <div class="mb-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" id="autosaveCheck" ${this.settings.autosave ? 'checked' : ''}>
              <span class="text-sm">Enable autosave</span>
            </label>
          </div>

          <div class="mb-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" id="notificationsCheck" ${this.settings.notifications ? 'checked' : ''}>
              <span class="text-sm">Enable notifications</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Model Settings -->
      <div class="card mb-6">
        <div class="card-header">
          <h3>Model Configuration</h3>
        </div>
        <div class="card-body">
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">Default Model</label>
            <select class="input" id="modelSelect">
              <option value="sonnet" ${this.settings.model === 'sonnet' ? 'selected' : ''}>Sonnet 4.5</option>
              <option value="opus" ${this.settings.model === 'opus' ? 'selected' : ''}>Opus 4</option>
              <option value="haiku" ${this.settings.model === 'haiku' ? 'selected' : ''}>Haiku 3.5</option>
            </select>
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">API Key</label>
            <input type="password"
                   class="input"
                   id="apiKeyInput"
                   placeholder="sk-ant-..."
                   value="${this.settings.apiKey}">
            <p class="text-xs text-tertiary mt-1">Your API key is stored locally and never sent to external servers</p>
          </div>
        </div>
      </div>

      <!-- Agent Settings -->
      <div class="card mb-6">
        <div class="card-header">
          <h3>Agent Configuration</h3>
        </div>
        <div class="card-body">
          <div class="mb-4">
            <label class="block text-sm font-medium mb-2" id="maxAgentsLabel">
              Maximum Concurrent Agents: ${this.settings.maxAgents}
            </label>
            <input type="range"
                   class="w-full"
                   id="maxAgentsRange"
                   min="1"
                   max="20"
                   value="${this.settings.maxAgents}"
                   style="width: 100%;">
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium mb-2">Logging Level</label>
            <select class="input" id="loggingSelect">
              <option value="verbose" ${this.settings.logging === 'verbose' ? 'selected' : ''}>Verbose</option>
              <option value="normal" ${this.settings.logging === 'normal' ? 'selected' : ''}>Normal</option>
              <option value="minimal" ${this.settings.logging === 'minimal' ? 'selected' : ''}>Minimal</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Data Management -->
      <div class="card mb-6">
        <div class="card-header">
          <h3>Data Management</h3>
        </div>
        <div class="card-body">
          <div class="flex gap-3">
            <button class="btn btn-secondary" id="exportDataBtn">Export Data</button>
            <button class="btn btn-secondary" id="importDataBtn">Import Data</button>
            <button class="btn btn-danger" id="clearDataBtn">Clear All Data</button>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-3">
        <button class="btn btn-secondary" id="resetBtn">Reset to Defaults</button>
        <button class="btn btn-primary" id="saveBtn">Save Settings</button>
      </div>

      <!-- Save notification -->
      <div id="saveNotification" class="hidden" style="
        position: fixed;
        bottom: 24px;
        right: 24px;
        padding: 16px 24px;
        background: var(--color-success);
        color: white;
        border-radius: 8px;
        box-shadow: var(--shadow-lg);
        z-index: 1000;
      ">
        ✓ Settings saved successfully
      </div>
    `;

    // Attach event listeners
    const maxAgentsRange = screen.querySelector('#maxAgentsRange') as HTMLInputElement;
    maxAgentsRange?.addEventListener('input', (e: Event) => {
      const target = e.target as HTMLInputElement;
      const label = screen.querySelector('#maxAgentsLabel');
      if (label) {
        label.textContent = `Maximum Concurrent Agents: ${target.value}`;
      }
    });

    screen.querySelector('#saveBtn')?.addEventListener('click', () => this.saveSettings());
    screen.querySelector('#resetBtn')?.addEventListener('click', () => this.resetSettings());
    screen.querySelector('#exportDataBtn')?.addEventListener('click', () => this.exportData());
    screen.querySelector('#importDataBtn')?.addEventListener('click', () => this.importData());
    screen.querySelector('#clearDataBtn')?.addEventListener('click', () => this.clearData());

    this.element = screen;
    return screen;
  }

  /**
   * Save settings
   */
  private saveSettings(): void {
    if (!this.element) return;

    const themeSelect = this.element.querySelector('#themeSelect') as HTMLSelectElement;
    const modelSelect = this.element.querySelector('#modelSelect') as HTMLSelectElement;
    const autosaveCheck = this.element.querySelector('#autosaveCheck') as HTMLInputElement;
    const notificationsCheck = this.element.querySelector('#notificationsCheck') as HTMLInputElement;
    const loggingSelect = this.element.querySelector('#loggingSelect') as HTMLSelectElement;
    const maxAgentsRange = this.element.querySelector('#maxAgentsRange') as HTMLInputElement;
    const apiKeyInput = this.element.querySelector('#apiKeyInput') as HTMLInputElement;

    this.settings = {
      theme: themeSelect.value as AppSettings['theme'],
      model: modelSelect.value as AppSettings['model'],
      autosave: autosaveCheck.checked,
      notifications: notificationsCheck.checked,
      logging: loggingSelect.value as AppSettings['logging'],
      maxAgents: parseInt(maxAgentsRange.value),
      apiKey: apiKeyInput.value,
    };

    // Save to localStorage
    localStorage.setItem('ccem-settings', JSON.stringify(this.settings));

    console.log('[SETTINGS-SCREEN] Settings saved:', this.settings);

    // Show notification
    const notification = this.element.querySelector('#saveNotification') as HTMLElement;
    if (notification) {
      notification.classList.remove('hidden');
      setTimeout(() => {
        notification.classList.add('hidden');
      }, 3000);
    }
  }

  /**
   * Reset settings to defaults
   */
  private resetSettings(): void {
    if (!confirm('Are you sure you want to reset all settings to defaults?')) {
      return;
    }

    this.settings = this.getDefaultSettings();
    localStorage.removeItem('ccem-settings');

    console.log('[SETTINGS-SCREEN] Settings reset to defaults');

    // Re-render
    if (this.element && this.element.parentNode) {
      const newElement = this.render();
      this.element.parentNode.replaceChild(newElement, this.element);
    }
  }

  /**
   * Export data
   */
  private exportData(): void {
    console.log('[SETTINGS-SCREEN] Exporting data');
    alert('Export functionality would be implemented here');
  }

  /**
   * Import data
   */
  private importData(): void {
    console.log('[SETTINGS-SCREEN] Importing data');
    alert('Import functionality would be implemented here');
  }

  /**
   * Clear all data
   */
  private clearData(): void {
    if (!confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      return;
    }

    localStorage.clear();
    console.log('[SETTINGS-SCREEN] All data cleared');
    alert('All data has been cleared');
  }

  /**
   * Load settings from localStorage
   */
  loadSettings(): void {
    const saved = localStorage.getItem('ccem-settings');
    if (saved) {
      this.settings = JSON.parse(saved) as AppSettings;
      console.log('[SETTINGS-SCREEN] Settings loaded from localStorage');
    }
  }

  /**
   * Mount the screen
   * @param containerId - Container element ID
   */
  mount(containerId: string): void {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('[SETTINGS-SCREEN] Container not found:', containerId);
      return;
    }

    this.loadSettings();
    container.innerHTML = '';
    container.appendChild(this.render());

    console.log('[SETTINGS-SCREEN] Mounted');
  }

  /**
   * Unmount the screen
   */
  unmount(): void {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
      console.log('[SETTINGS-SCREEN] Unmounted');
    }
  }
}

export default SettingsPage;
