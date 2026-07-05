/**
 * performance.js - FPS 计数器 + 性能基准
 *
 * 用法：
 *   const perf = new PerfMonitor();
 *   每帧: perf.tick(dt);
 *   绘制: perf.draw(ctx, x, y);
 *   基准: PerfMonitor.benchmark(fn, 1000);
 */

class PerfMonitor {
  constructor() {
    this.frameCount = 0;
    this.totalTime = 0;
    this.lastSecondFps = 0;
    this.minFps = Infinity;
    this.maxFps = 0;
    this.frameTimes = [];  // 最近 60 帧时间
    this.maxFrameSamples = 60;
    this.startTime = Date.now();
    this.visible = false;  // 默认隐藏，按 F3 切换
  }

  /**
   * 每帧调用
   * @param {number} dt - 帧间隔（秒）
   */
  tick(dt) {
    this.frameCount++;
    this.totalTime += dt;

    // 记录帧时间
    this.frameTimes.push(dt);
    if (this.frameTimes.length > this.maxFrameSamples) {
      this.frameTimes.shift();
    }

    // 追踪 min/max
    const instantFps = 1 / Math.max(0.001, dt);
    this.minFps = Math.min(this.minFps, instantFps);
    this.maxFps = Math.max(this.maxFps, instantFps);

    // 每秒更新一次 FPS
    if (this.totalTime >= 1.0) {
      this.lastSecondFps = Math.round(this.frameCount / this.totalTime);
      this.frameCount = 0;
      this.totalTime = 0;
    }
  }

  /**
   * 获取当前 FPS
   */
  getFps() {
    return this.lastSecondFps;
  }

  /**
   * 获取最近帧时间统计
   */
  getFrameStats() {
    if (this.frameTimes.length === 0) return { avg: 0, min: 0, max: 0, p95: 0 };
    const sorted = [...this.frameTimes].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    return {
      avg: (sum / sorted.length) * 1000,  // ms
      min: sorted[0] * 1000,
      max: sorted[sorted.length - 1] * 1000,
      p95: sorted[Math.floor(sorted.length * 0.95)] * 1000,
    };
  }

  /**
   * 切换可见性
   */
  toggle() {
    this.visible = !this.visible;
    return this.visible;
  }

  /**
   * 绘制到 canvas 左上角
   */
  draw(ctx, x = 10, y = 10) {
    if (!this.visible) return;
    const stats = this.getFrameStats();
    const lines = [
      `FPS: ${this.getFps()}`,
      `Frame: ${stats.avg.toFixed(1)}ms (${stats.min.toFixed(1)}-${stats.max.toFixed(1)})`,
      `P95: ${stats.p95.toFixed(1)}ms`,
    ];
    ctx.save();
    ctx.font = '11px monospace';
    ctx.textBaseline = 'top';

    // 背景
    const maxW = Math.max(...lines.map(l => ctx.measureText(l).width));
    const bgX = x - 4, bgY = y - 4, bgW = maxW + 8, bgH = lines.length * 14 + 6;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(bgX, bgY, bgW, bgH);
    ctx.strokeStyle = 'rgba(80,140,255,0.4)';
    ctx.strokeRect(bgX, bgY, bgW, bgH);

    // 文字
    ctx.fillStyle = '#aaffaa';
    ctx.fillText(lines[0], x, y);
    ctx.fillStyle = '#aaccff';
    ctx.fillText(lines[1], x, y + 14);
    ctx.fillStyle = '#8888ff';
    ctx.fillText(lines[2], x, y + 28);

    ctx.restore();
  }

  /**
   * 静态方法：基准测试
   * @param {Function} fn - 要测试的函数
   * @param {number} iterations - 迭代次数
   * @returns {Object} { avg, min, max, p95, total }
   */
  static benchmark(fn, iterations = 1000) {
    // 直接用 globalThis.performance（避免 this 绑定问题）
    const perf = (typeof globalThis !== 'undefined' && globalThis.performance) ? globalThis.performance : null;
    const now = perf && perf.now ? perf.now.bind(perf) : Date.now;
    const times = [];
    // 预热
    for (let i = 0; i < 10; i++) fn();

    for (let i = 0; i < iterations; i++) {
      const start = now();
      fn();
      const end = now();
      times.push(end - start);  // ms
    }

    const sorted = [...times].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    return {
      iterations,
      avg: sum / sorted.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      total: sum,
    };
  }

  /**
   * 重置统计
   */
  reset() {
    this.frameCount = 0;
    this.totalTime = 0;
    this.lastSecondFps = 0;
    this.minFps = Infinity;
    this.maxFps = 0;
    this.frameTimes = [];
  }
}

// 全局实例
const perf = new PerfMonitor();
