/**
 * Diagram Animation System
 * anime.js progressive reveal + Lottie transitions
 * Version: 1.0.0
 */

class DiagramAnimator {
  constructor(config = {}) {
    this.config = {
      progressiveRevealDelay: config.progressiveRevealDelay || 30,
      nodeStaggerDelay: config.nodeStaggerDelay || 50,
      edgeStaggerDelay: config.edgeStaggerDelay || 40,
      easing: config.easing || 'easeInOutQuad',
      duration: config.duration || 1000,
      ...config
    };

    this.timelines = new Map();
    this.activeAnimations = new Set();
  }

  /**
   * Progressive reveal animation for SVG diagrams
   * @param {SVGElement} svg - SVG element to animate
   * @param {Object} options - Animation options
   */
  progressiveReveal(svg, options = {}) {
    const id = `anim-${Math.random().toString(36).substr(2, 9)}`;
    const timeline = anime.timeline({
      easing: options.easing || this.config.easing
    });

    const nodes = svg.querySelectorAll('g[class*="node"], g[class*="actor"], g[class*="entity"]');
    const edges = svg.querySelectorAll('line[class*="edge"], path[class*="edge"], g[class*="edge-path"]');

    // Animate nodes with stagger
    nodes.forEach((node, i) => {
      timeline.add({
        targets: node,
        opacity: [0, 1],
        transform: ['translate(0, 10px)', 'translate(0, 0)'],
        duration: options.duration || this.config.duration,
        offset: `-=${this.config.duration}+${i * this.config.nodeStaggerDelay}`
      }, 0);
    });

    // Animate edges with stagger
    edges.forEach((edge, i) => {
      const isPath = edge.tagName === 'path';
      if (isPath) {
        timeline.add({
          targets: edge,
          strokeDashoffset: [anime.setDashoffset, 0],
          opacity: [0, 1],
          duration: options.duration || this.config.duration,
          offset: `-=${this.config.duration}+${nodes.length * this.config.nodeStaggerDelay + i * this.config.edgeStaggerDelay}`
        }, 0);
      } else {
        timeline.add({
          targets: edge,
          opacity: [0, 1],
          duration: options.duration || this.config.duration,
          offset: `-=${this.config.duration}+${nodes.length * this.config.nodeStaggerDelay + i * this.config.edgeStaggerDelay}`
        }, 0);
      }
    });

    this.timelines.set(id, timeline);
    this.activeAnimations.add(id);

    return {id, timeline, play: () => timeline.play(), pause: () => timeline.pause()};
  }

  /**
   * Wave deploy animation for formation topologies
   * @param {HTMLElement} container - Container with wave sections
   */
  waveAnimation(container) {
    const waves = container.querySelectorAll('[data-wave]');
    const timeline = anime.timeline({easing: 'easeInOutQuad'});

    waves.forEach((wave, waveIndex) => {
      const agents = wave.querySelectorAll('[data-agent]');

      timeline.add({
        targets: wave,
        opacity: [0, 1],
        transform: ['translateY(20px)', 'translateY(0)'],
        duration: 600,
        offset: `+=${waveIndex * 200}`
      }, 0);

      agents.forEach((agent, agentIndex) => {
        timeline.add({
          targets: agent,
          opacity: [0, 1],
          scale: [0.8, 1],
          duration: 400,
          offset: `-=${600}+${agentIndex * 80}`
        }, 0);
      });
    });

    return timeline;
  }

  /**
   * Lottie transition animation
   * @param {HTMLElement} container - Container for Lottie animation
   * @param {string} animationUrl - URL to Lottie JSON
   */
  lottieTransition(container, animationUrl) {
    const player = document.createElement('lottie-player');
    player.src = animationUrl;
    player.setAttribute('background', 'transparent');
    player.setAttribute('speed', '1');
    player.setAttribute('style', 'width: 100%; height: 100%;');

    container.innerHTML = '';
    container.appendChild(player);

    return {
      play: () => player.play ? player.play() : null,
      pause: () => player.pause ? player.pause() : null,
      destroy: () => player.remove()
    };
  }

  /**
   * Pause all active animations
   */
  pauseAll() {
    this.timelines.forEach(timeline => timeline.pause());
  }

  /**
   * Resume all active animations
   */
  resumeAll() {
    this.timelines.forEach(timeline => timeline.play());
  }

  /**
   * Clear all animations
   */
  clear() {
    this.pauseAll();
    this.timelines.clear();
    this.activeAnimations.clear();
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DiagramAnimator;
}
