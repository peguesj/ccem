/**
 * Queryable Tab Interface System
 * docsmax-style tabs with search, filter, and live data binding
 * Version: 1.0.0
 */

class QueryableTabs {
  constructor(container, config = {}) {
    this.container = container;
    this.config = {
      debounceMs: config.debounceMs || 200,
      searchPlaceholder: config.searchPlaceholder || 'Search...',
      tabs: config.tabs || [],
      ...config
    };

    this.currentTab = null;
    this.searchQuery = '';
    this.filterState = {};
    this.debounceTimer = null;
    this.data = new Map();

    this.init();
  }

  init() {
    this.render();
    this.attachEventListeners();
  }

  render() {
    const html = `
      <div class="queryable-tabs">
        <div class="tabs-header">
          <div class="tab-buttons">
            ${this.config.tabs.map((tab, i) => `
              <button class="tab-btn" data-tab-id="${tab.id}" data-tab-index="${i}">
                ${tab.icon ? `<span class="tab-icon">${tab.icon}</span>` : ''}
                ${tab.label}
                ${tab.count ? `<span class="tab-count">${tab.count}</span>` : ''}
              </button>
            `).join('')}
          </div>
          <div class="tabs-controls">
            <input
              type="text"
              class="tab-search"
              placeholder="${this.config.searchPlaceholder}"
              aria-label="Search tabs"
            />
            <div class="filter-pills"></div>
          </div>
        </div>

        <div class="tabs-content">
          ${this.config.tabs.map(tab => `
            <div class="tab-panel" data-tab-id="${tab.id}" style="display: none;">
              <div class="tab-panel-header">
                <h2>${tab.label}</h2>
                ${tab.description ? `<p class="tab-description">${tab.description}</p>` : ''}
              </div>
              <div class="tab-panel-body">
                <div class="loading-state">Loading...</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <style>
        .queryable-tabs {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: rgba(10, 10, 15, 0.8);
          border-radius: 12px;
          overflow: hidden;
        }

        .tabs-header {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 12px;
          border-bottom: 1px solid rgba(99, 102, 241, 0.1);
          background: rgba(15, 15, 25, 0.6);
        }

        .tab-buttons {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }

        .tab-btn {
          padding: 8px 12px;
          background: rgba(51, 65, 85, 0.5);
          border: 1px solid rgba(99, 102, 241, 0.2);
          color: #e2e8f0;
          border-radius: 6px;
          cursor: pointer;
          font-size: 11px;
          font-family: Inter, sans-serif;
          font-weight: 500;
          transition: all 150ms ease;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .tab-btn:hover {
          background: rgba(99, 102, 241, 0.2);
          border-color: rgba(99, 102, 241, 0.4);
        }

        .tab-btn.active {
          background: rgba(99, 102, 241, 0.3);
          border-color: #818cf8;
          color: #818cf8;
        }

        .tab-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 4px;
          background: rgba(99, 102, 241, 0.2);
          border-radius: 3px;
          font-size: 10px;
          font-weight: 600;
        }

        .tabs-controls {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .tab-search {
          flex: 1;
          padding: 8px 12px;
          background: rgba(30, 30, 45, 0.8);
          border: 1px solid rgba(99, 102, 241, 0.2);
          color: #e2e8f0;
          border-radius: 6px;
          font-size: 12px;
          font-family: Inter, monospace;
          transition: all 150ms ease;
        }

        .tab-search:focus {
          outline: none;
          border-color: #818cf8;
          background: rgba(30, 30, 45, 1);
          box-shadow: 0 0 8px rgba(99, 102, 241, 0.2);
        }

        .filter-pills {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }

        .tabs-content {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }

        .tab-panel {
          animation: fadeIn 200ms ease;
        }

        .tab-panel-header {
          margin-bottom: 16px;
        }

        .tab-panel-header h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #818cf8;
        }

        .tab-description {
          margin: 4px 0 0;
          font-size: 12px;
          color: #94a3b8;
        }

        .tab-panel-body {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .loading-state {
          padding: 24px;
          text-align: center;
          color: #94a3b8;
          font-size: 12px;
        }

        .search-result {
          padding: 12px;
          background: rgba(30, 30, 45, 0.4);
          border-left: 2px solid #818cf8;
          border-radius: 4px;
          font-size: 12px;
          line-height: 1.4;
          transition: all 150ms ease;
        }

        .search-result:hover {
          background: rgba(99, 102, 241, 0.1);
        }

        .search-result-highlight {
          background: rgba(251, 191, 36, 0.2);
          padding: 0 2px;
          color: #fbbf24;
          font-weight: 600;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @media (prefers-reduced-motion: reduce) {
          .tab-btn, .tab-search, .search-result, .tab-panel {
            transition: none;
          }
          .tab-panel {
            animation: none;
          }
        }
      </style>
    `;

    this.container.innerHTML = html;
  }

  attachEventListeners() {
    // Tab button clicks
    this.container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.switchTab(e.target.closest('.tab-btn').dataset.tabId));
    });

    // Search input with debounce
    const searchInput = this.container.querySelector('.tab-search');
    searchInput.addEventListener('input', (e) => {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.search(e.target.value);
      }, this.config.debounceMs);
    });

    // Activate first tab
    if (this.config.tabs.length > 0) {
      this.switchTab(this.config.tabs[0].id);
    }
  }

  switchTab(tabId) {
    // Update active button
    this.container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tabId === tabId);
    });

    // Update active panel
    this.container.querySelectorAll('.tab-panel').forEach(panel => {
      panel.style.display = panel.dataset.tabId === tabId ? 'flex' : 'none';
    });

    this.currentTab = tabId;

    // Load tab data if not cached
    if (!this.data.has(tabId)) {
      this.loadTabData(tabId);
    }
  }

  async loadTabData(tabId) {
    const panel = this.container.querySelector(`[data-tab-id="${tabId}"] .tab-panel-body`);
    const tab = this.config.tabs.find(t => t.id === tabId);

    if (!tab || !tab.dataSource) return;

    try {
      const data = typeof tab.dataSource === 'function'
        ? await tab.dataSource()
        : tab.dataSource;

      this.data.set(tabId, data);
      this.renderTabData(tabId, data);
    } catch (err) {
      console.error(`Failed to load tab data for ${tabId}:`, err);
      panel.innerHTML = '<div class="loading-state">Failed to load data</div>';
    }
  }

  renderTabData(tabId, data) {
    const panel = this.container.querySelector(`[data-tab-id="${tabId}"] .tab-panel-body`);

    if (Array.isArray(data)) {
      panel.innerHTML = data.map((item, i) => `
        <div class="search-result" data-index="${i}">
          ${typeof item === 'object' ? `
            <div class="search-result-title">${item.title || item.name || ''}</div>
            <div class="search-result-content">${item.content || item.description || ''}</div>
          ` : `<div>${item}</div>`}
        </div>
      `).join('');
    } else if (typeof data === 'object') {
      panel.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    }
  }

  search(query) {
    this.searchQuery = query.toLowerCase();

    const results = this.container.querySelectorAll('.search-result');
    let visibleCount = 0;

    results.forEach(result => {
      const text = result.textContent.toLowerCase();
      const matches = text.includes(this.searchQuery);
      result.style.display = matches ? 'block' : 'none';
      if (matches) visibleCount++;
    });

    // Highlight matches
    if (this.searchQuery) {
      results.forEach(result => {
        if (result.style.display !== 'none') {
          this.highlightMatches(result, this.searchQuery);
        }
      });
    }
  }

  highlightMatches(element, query) {
    const regex = new RegExp(`(${query})`, 'gi');
    element.innerHTML = element.innerHTML.replace(regex, '<span class="search-result-highlight">$1</span>');
  }

  /**
   * Register new tab data source
   */
  registerTab(tabId, dataSource) {
    this.data.delete(tabId);
    const tab = this.config.tabs.find(t => t.id === tabId);
    if (tab) {
      tab.dataSource = dataSource;
    }
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = QueryableTabs;
}
