/**
 * test-performance.cjs - PerfMonitor 模块测试
 */
const { loadModules } = require('./runner.cjs');

describe('PerfMonitor 模块', () => {
  it('类已加载', () => {
    const { modules } = loadModules();
    check('PerfMonitor 是 class', typeof modules.PerfMonitor === 'function');
  });

  it('可以创建实例', () => {
    const { modules } = loadModules();
    const PerfMonitor = modules.PerfMonitor;
    const p = new PerfMonitor();
    check('实例存在', p !== undefined);
    check('tick 函数', typeof p.tick === 'function');
    check('draw 函数', typeof p.draw === 'function');
  });

  it('初始 FPS 为 0', () => {
    const { modules } = loadModules();
    const p = new modules.PerfMonitor();
    check('getFps() === 0', p.getFps() === 0);
  });

  it('tick 后更新统计', () => {
    const { modules } = loadModules();
    const p = new modules.PerfMonitor();
    for (let i = 0; i < 30; i++) p.tick(0.016);
    check('30帧后 FPS 仍 0', p.getFps() === 0);
    const stats = p.getFrameStats();
    check('平均帧时间 ≈ 16ms', Math.abs(stats.avg - 16) < 1);
  });

  it('1s 后 FPS 更新', () => {
    const { modules } = loadModules();
    const p = new modules.PerfMonitor();
    for (let i = 0; i < 65; i++) {
      p.tick(1/60);
    }
    check('FPS 在 50-70 之间', p.getFps() >= 50 && p.getFps() <= 70);
  });

  it('toggle 切换可见性', () => {
    const { modules } = loadModules();
    const p = new modules.PerfMonitor();
    check('初始不可见', p.visible === false);
    p.toggle();
    check('toggle 后可见', p.visible === true);
    p.toggle();
    check('再 toggle 不可见', p.visible === false);
  });

  it('benchmark 静态方法工作', () => {
    const { modules } = loadModules();
    const PerfMonitor = modules.PerfMonitor;
    let x = 0;
    const result = PerfMonitor.benchmark(() => {
      x++;
      let s = 0;
      for (let i = 0; i < 100; i++) s += Math.sqrt(i);
      return s;
    }, 100);
    check('iterations=100', result.iterations === 100);
    check('avg > 0', result.avg > 0);
    check('min <= avg', result.min <= result.avg);
    check('max >= avg', result.max >= result.avg);
  });

  it('reset 清空统计', () => {
    const { modules } = loadModules();
    const PerfMonitor = modules.PerfMonitor;
    const p = new PerfMonitor();
    p.tick(0.016);
    p.tick(0.020);
    p.reset();
    check('reset 后 FPS=0', p.getFps() === 0);
    check('reset 后 minFps=Infinity', p.minFps === Infinity);
  });

  // === 新增内存监控测试 ===
  it('getMemoryMB 返回数字', () => {
    const { modules } = loadModules();
    const p = new modules.PerfMonitor();
    const mem = p.getMemoryMB();
    check('mem 是数字', typeof mem === 'number');
    check('mem >= 0', mem >= 0);
  });

  it('getPeakMemoryMB 初始为基线', () => {
    const { modules } = loadModules();
    const p = new modules.PerfMonitor();
    const peak = p.getPeakMemoryMB();
    check('peak 是数字', typeof peak === 'number');
    check('peak >= 0', peak >= 0);
  });

  it('getMemoryGrowthMB 返回差值', () => {
    const { modules } = loadModules();
    const p = new modules.PerfMonitor();
    const growth = p.getMemoryGrowthMB();
    check('growth 是数字', typeof growth === 'number');
  });

  it('takeSnapshot 返回完整快照', () => {
    const { modules } = loadModules();
    const p = new modules.PerfMonitor();
    p.tick(0.016);
    p.tick(0.020);
    const snap = p.takeSnapshot();
    check('有 ts', typeof snap.ts === 'number');
    check('有 uptimeSec', typeof snap.uptimeSec === 'number');
    check('uptimeSec >= 0', snap.uptimeSec >= 0);
    check('有 fps', typeof snap.fps === 'number');
    check('有 minFps', typeof snap.minFps === 'number');
    check('有 maxFps', typeof snap.maxFps === 'number');
    check('有 avgFrameMs', typeof snap.avgFrameMs === 'number');
    check('有 memMB', typeof snap.memMB === 'number');
    check('有 peakMemMB', typeof snap.peakMemMB === 'number');
    check('有 memGrowthMB', typeof snap.memGrowthMB === 'number');
    check('有 samples', typeof snap.samples === 'number');
  });

  it('getLongTermCount 初始为 0', () => {
    const { modules } = loadModules();
    const p = new modules.PerfMonitor();
    check('longTerm = 0', p.getLongTermCount() === 0);
  });

  it('reset 后 longTermSamples 也清空', () => {
    const { modules } = loadModules();
    const p = new modules.PerfMonitor();
    p.longTermSamples.push({ fps: 60, mem: 10, ts: 0 });
    p.reset();
    check('reset 后 longTerm 清空', p.longTermSamples.length === 0);
  });

  it('reset 后 peakMemory 重置到基线', () => {
    const { modules } = loadModules();
    const p = new modules.PerfMonitor();
    p.peakMemory = 999999;
    p.reset();
    check('reset 后 peakMemory == memoryBaseline', p.peakMemory === p.memoryBaseline);
  });

  it('getFrameStats 返回完整字段', () => {
    const { modules } = loadModules();
    const p = new modules.PerfMonitor();
    for (let i = 0; i < 5; i++) p.tick(0.016);
    const stats = p.getFrameStats();
    check('有 avg', typeof stats.avg === 'number');
    check('有 min', typeof stats.min === 'number');
    check('有 max', typeof stats.max === 'number');
    check('有 p95', typeof stats.p95 === 'number');
  });
});
