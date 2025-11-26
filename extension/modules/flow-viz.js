/**
 * @file Real-time flow visualization module
 * Renders animated particles showing TD requests flowing from browser to server
 */

/**
 * Represents a single request as an animated particle
 */
class Particle {
  /**
   * @param {object} request - Request data
   * @param {number} canvasWidth - Canvas width for positioning
   * @param {number} canvasHeight - Canvas height for positioning
   */
  constructor(request, canvasWidth, canvasHeight) {
    this.request = request;
    this.x = 50; // Start position (left side)
    this.y = canvasHeight / 2 + (Math.random() - 0.5) * 40; // Random vertical offset
    this.targetX = canvasWidth - 50; // End position (right side)
    this.speed = 2 + Math.random(); // Random speed variation
    this.radius = 4;
    this.alpha = 1.0;
    this.completed = false;
    this.fadeOut = false;

    // Color based on status
    this.color = this.getColorFromStatus(request.status);
  }

  /**
   * Get particle color based on HTTP status
   * @param {number|string} status - HTTP status code
   * @returns {string} RGB color string
   */
  getColorFromStatus(status) {
    const statusNum = parseInt(status);
    if (isNaN(statusNum)) return 'rgb(59, 130, 246)'; // Blue for pending

    if (statusNum >= 200 && statusNum < 300) return 'rgb(34, 197, 94)'; // Green
    if (statusNum >= 300 && statusNum < 400) return 'rgb(234, 179, 8)'; // Yellow
    if (statusNum >= 400) return 'rgb(239, 68, 68)'; // Red

    return 'rgb(59, 130, 246)'; // Blue default
  }

  /**
   * Update particle position
   * @param {number} deltaTime - Time since last frame
   */
  update(deltaTime) {
    if (this.completed) {
      // Fade out after completion
      this.alpha -= 0.02;
      return;
    }

    // Move particle
    this.x += this.speed;

    // Check if reached destination
    if (this.x >= this.targetX) {
      this.completed = true;
      this.fadeOut = true;
    }
  }

  /**
   * Draw particle on canvas
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;

    // Draw glow
    ctx.shadowBlur = 10;
    ctx.shadowColor = this.color;

    // Draw particle
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Check if particle should be removed
   * @returns {boolean}
   */
  isDead() {
    return this.alpha <= 0;
  }
}

/**
 * Manages the flow visualization canvas and particles
 */
export class FlowVisualization {
  /**
   * @param {string} canvasId - Canvas element ID
   */
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.error(`Canvas element ${canvasId} not found`);
      return;
    }

    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.isRunning = false;
    this.lastTime = 0;
    this.maxParticles = 100;

    // Metrics tracking
    this.requestHistory = []; // Last 60 seconds of requests
    this.completedRequests = []; // Last 20 completed for latency calc
    this.lastMetricsUpdate = 0;
    this.metricsUpdateInterval = 500; // Update every 500ms

    // DOM elements for metrics
    this.metricRps = document.getElementById('metricRps');
    this.metricLatency = document.getElementById('metricLatency');
    this.metricSuccess = document.getElementById('metricSuccess');
    this.metricActive = document.getElementById('metricActive');

    // Set canvas size
    this.resize();

    // Handle window resize
    window.addEventListener('resize', () => this.resize());
  }

  /**
   * Resize canvas to match container
   */
  resize() {
    const container = this.canvas.parentElement;
    this.canvas.width = container.clientWidth;
    this.canvas.height = 200; // Fixed height
  }

  /**
   * Add a new request as a particle
   * @param {object} request - Request data
   */
  addRequest(request) {
    // Prevent too many particles
    if (this.particles.length >= this.maxParticles) {
      this.particles.shift(); // Remove oldest
    }

    const particle = new Particle(request, this.canvas.width, this.canvas.height);
    this.particles.push(particle);

    // Track for metrics
    const now = Date.now();
    this.requestHistory.push({ time: now, status: request.status });

    // Clean old history (keep last 60 seconds)
    this.requestHistory = this.requestHistory.filter((r) => now - r.time < 60000);
  }

  /**
   * Start the animation loop
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.animate();
  }

  /**
   * Stop the animation loop
   */
  stop() {
    this.isRunning = false;
  }

  /**
   * Clear all particles
   */
  clear() {
    this.particles = [];
  }

  /**
   * Main animation loop
   * @param {number} currentTime - Current timestamp
   */
  animate(currentTime = 0) {
    if (!this.isRunning) return;

    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Update and render
    this.update(deltaTime);
    this.render();

    // Update metrics periodically
    if (currentTime - this.lastMetricsUpdate > this.metricsUpdateInterval) {
      this.updateMetrics();
      this.lastMetricsUpdate = currentTime;
    }

    // Continue loop
    requestAnimationFrame((time) => this.animate(time));
  }

  /**
   * Update all particles
   * @param {number} deltaTime - Time since last frame
   */
  update(deltaTime) {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update(deltaTime);

      // Remove dead particles
      if (this.particles[i].isDead()) {
        this.particles.splice(i, 1);
      }
    }
  }

  /**
   * Render the visualization
   */
  render() {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(15, 23, 42, 0.05)');
    gradient.addColorStop(1, 'rgba(15, 23, 42, 0.02)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw flow line
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.2)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(50, height / 2);
    ctx.lineTo(width - 50, height / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw labels
    ctx.fillStyle = 'rgba(100, 116, 139, 0.8)';
    ctx.font = '12px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🌐 Browser', 10, height / 2 - 10);
    ctx.textAlign = 'right';
    ctx.fillText('🏢 Treasure Data', width - 10, height / 2 - 10);

    // Draw particles
    for (const particle of this.particles) {
      particle.draw(ctx);
    }
  }

  /**
   * Update metrics display
   */
  updateMetrics() {
    const now = Date.now();

    // Requests per second (last 1 second)
    const lastSecond = this.requestHistory.filter((r) => now - r.time < 1000);
    const rps = lastSecond.length;
    if (this.metricRps) {
      this.metricRps.textContent = rps.toFixed(1);
    }

    // Average latency (mock - would need actual timing data)
    // For now, show a placeholder
    if (this.metricLatency) {
      this.metricLatency.textContent = '~150ms';
    }

    // Success rate (2xx / total)
    const total = this.requestHistory.length;
    if (total > 0) {
      const successful = this.requestHistory.filter((r) => {
        const status = parseInt(r.status);
        return status >= 200 && status < 300;
      }).length;
      const successRate = ((successful / total) * 100).toFixed(0);
      if (this.metricSuccess) {
        this.metricSuccess.textContent = `${successRate}%`;
      }
    } else {
      if (this.metricSuccess) {
        this.metricSuccess.textContent = '100%';
      }
    }

    // Active requests (particles not yet completed)
    const active = this.particles.filter((p) => !p.completed).length;
    if (this.metricActive) {
      this.metricActive.textContent = active.toString();
    }
  }
}
