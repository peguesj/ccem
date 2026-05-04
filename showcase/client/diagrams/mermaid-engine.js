/**
 * Mermaid Diagram Engine
 * Runtime Mermaid/PlantUML → SVG rendering with caching
 * Version: 1.0.0
 */

class MermaidEngine {
  constructor(config = {}) {
    this.config = {
      theme: config.theme || 'dark',
      startOnLoad: false,
      securityLevel: 'loose',
      logLevel: 'error',
      ...config
    };

    this.cache = new Map();
    this.renderQueue = [];
    this.isRendering = false;
    this.onRender = config.onRender || (() => {});

    this.initMermaid();
  }

  initMermaid() {
    if (typeof mermaid !== 'undefined') {
      mermaid.initialize(this.config);
      mermaid.contentLoaderAsync = async () => {};
    }
  }

  /**
   * Queue a diagram for rendering
   * @param {string} id - Unique diagram ID
   * @param {string} definition - Mermaid diagram definition
   * @param {HTMLElement} target - Target DOM element
   * @param {Object} options - Render options
   */
  async render(id, definition, target, options = {}) {
    const cacheKey = `${id}:${definition.hash || ''}`;

    if (this.cache.has(cacheKey)) {
      target.innerHTML = this.cache.get(cacheKey);
      this.onRender({id, cached: true});
      return this.cache.get(cacheKey);
    }

    return new Promise((resolve) => {
      this.renderQueue.push({id, definition, target, options, resolve});
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.isRendering || this.renderQueue.length === 0) return;

    this.isRendering = true;
    const {id, definition, target, options, resolve} = this.renderQueue.shift();

    try {
      const svg = await this.renderMermaid(definition, id);
      target.innerHTML = svg;

      const cacheKey = `${id}:${definition.hash || ''}`;
      this.cache.set(cacheKey, svg);

      this.onRender({id, cached: false, duration_ms: options.duration_ms || 0});
      resolve(svg);
    } catch (err) {
      console.error(`[MermaidEngine] Render failed for ${id}:`, err);
      target.innerHTML = `<div class="error">Diagram failed to render: ${id}</div>`;
      resolve(null);
    } finally {
      this.isRendering = false;
      if (this.renderQueue.length > 0) {
        setTimeout(() => this.processQueue(), 50);
      }
    }
  }

  async renderMermaid(definition, id) {
    if (typeof mermaid === 'undefined') {
      return '<div class="error">Mermaid not loaded</div>';
    }

    try {
      const {svg} = await mermaid.render(id, definition);
      return svg;
    } catch (err) {
      throw new Error(`Mermaid render failed: ${err.message}`);
    }
  }

  /**
   * Render all diagrams in a container
   * @param {HTMLElement} container - Container with [data-diagram] elements
   */
  async renderAll(container) {
    const diagrams = container.querySelectorAll('[data-diagram]');
    const promises = Array.from(diagrams).map(el => {
      const definition = el.textContent;
      const id = el.dataset.diagramId || `diagram-${Math.random().toString(36).substr(2, 9)}`;
      return this.render(id, definition, el, {parent: container});
    });

    return Promise.all(promises);
  }

  clearCache() {
    this.cache.clear();
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MermaidEngine;
}
