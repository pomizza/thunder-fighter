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
    const p = new modules.PerfMonitor();
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
    for (let i = 0; i < 30; i++) p.tick(0.016);  // ~60 FPS
    // 30 * 0.016 = 0.48s，未满 1s，FPS 还是 0
    check('30帧后 FPS 仍 0', p.getFps() === 0);
    // 但帧时间已记录
    const stats = p.getFrameStats();
    check('平均帧时间 ≈ 16ms', Math.abs(stats.avg - 16) < 1);
  });

  it('1s 后 FPS 更新', () => {
    const { modules } = loadModules();
    const p = new modules.PerfMonitor();
    // 模拟 1 秒的 60 FPS
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
    let x = 0;
    // 加重负载确保可测到时间
    const result = modules.PerfMonitor.benchmark(() => {
      x++;
      // 跑一些计算
      let s = 0;
      for (let i = 0; i < 100; i++) s += Math.sqrt(i);
      return s;
    }, 100);
    check('iterations=100', result.iterations === 100);
    check('avg > 0', result.avg > 0);
    check('min <= avg', result.min <= result.avg);
    check('max >= avg', result.max >= result.avg);
    check('p50 in range', result.p50 >= result.min && result.p50 <= result.max);
    check('x 已增加', x === 110)
  });

  it('reset 清空统计', () => {
    const { modules } = loadModules();
    const p = new modules.PerfMonitor();
    p.tick(0.016);
    p.tick(0.020);
    p.reset();
    check('reset 后 FPS=0', p.getFps() === 0);
    check('reset 后 minFps=Infinity', p.minFps === Infinity);
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
