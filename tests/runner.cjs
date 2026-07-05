/**
 * tests/runner.cjs - 轻量测试运行器
 * 用法：node tests/runner.cjs [test_file.cjs ...]
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const TESTS_DIR = __dirname;
const JS_DIR = path.resolve(TESTS_DIR, '..', 'js');

let totalPassed = 0, totalFailed = 0, totalSkipped = 0;

const C = {
  reset: '\x1b[0m', red: '\x1b[31m', green: '\x1b[32m',
  yellow: '\x1b[33m', blue: '\x1b[34m', gray: '\x1b[90m', bold: '\x1b[1m'
};

function mockCanvas() {
  return {
    getContext: () => ({
      fillRect: () => {}, clearRect: () => {}, fillText: () => {}, strokeText: () => {},
      fill: () => {}, stroke: () => {}, beginPath: () => {}, closePath: () => {},
      moveTo: () => {}, lineTo: () => {}, arc: () => {}, ellipse: () => {},
      save: () => {}, restore: () => {}, translate: () => {}, rotate: () => {}, scale: () => {},
      createLinearGradient: () => ({ addColorStop: () => {} }),
      createRadialGradient: () => ({ addColorStop: () => {} })
    }),
    width: 540, height: 780,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 540, height: 780 }),
    addEventListener: () => {}
  };
}

function loadModules() {
  const ctx = {
    window: { addEventListener: () => {}, ontouchstart: null }, document: { addEventListener: () => {}, getElementById: () => mockCanvas() },
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    requestAnimationFrame: () => 0,
    // performance: { now: () => Date.now() },  // 移除 mock，让沙箱用真实 performance
    navigator: { maxTouchPoints: 0 },
    Math, Date, Set, Map, Array, Object, console, parseInt, parseFloat, isNaN, JSON,
    setTimeout, clearTimeout, Number, String, Boolean
  };
  ctx.global = ctx; ctx.self = ctx;
  // globalThis 模拟（vm 沙箱不自动创建）
  Object.defineProperty(ctx, 'globalThis', { get: () => ctx, configurable: false });
  // 用真实 performance 替代 mock（让 PerfMonitor.benchmark 能测到时间）
  ctx.performance = require('perf_hooks').performance;
  vm.createContext(ctx);

  const order = [
    'utils.js', 'audio.js', 'config.js', 'effects.js', 'bullets.js',
    'performance.js',
    'enemies.js', 'player.js', 'levels.js', 'difficulty.js',
    'touch.js', 'shop.js', 'shipSelect.js', 'achievements.js',
    'replay.js', 'gameInput.js', 'gameLogic.js', 'game.js'
  ];

  // 单文件多导出（如 enemies.js 含 Enemy/Boss/PowerUp 三个 class）
  const moduleMap = {
    'audio.js': ['Audio'],
    'utils.js': ['Utils'],
    'effects.js': ['Effects'],
    'bullets.js': ['Bullet'],
    'performance.js': ['PerfMonitor'],
    'enemies.js': ['Enemy', 'Boss', 'PowerUp'],
    'player.js': ['Player'],
    'levels.js': ['Levels'],
    'difficulty.js': ['Difficulty'],
    'touch.js': ['Touch'],
    'shop.js': ['Shop'],
    'shipSelect.js': ['ShipSelect'],
    'achievements.js': ['Achievements'],
    'replay.js': ['Replay'],
    'config.js': ['Config'],
    'gameInput.js': ['GameInput'],
    'gameLogic.js': ['GameLogic'],
    'game.js': ['Game']
  };

  // 哪些 module 是 class（ES6 class 不暴露到 global，需用 (0, eval) 间接 eval 取出）
  const classFiles = new Set(['bullets.js', 'enemies.js', 'player.js', 'game.js', 'performance.js']);

  const modules = {};
  for (const f of order) {
    const fp = path.join(JS_DIR, f);
    if (!fs.existsSync(fp)) continue;
    let c = fs.readFileSync(fp, 'utf8');
    c = c.replace(/^const /gm, 'var ').replace(/^let /gm, 'var ');
    vm.runInContext(c, ctx, { filename: f });

    // 该文件导出的所有名字
    const exports = moduleMap[f] || [f.replace('.js', '')];
    for (const exportName of exports) {
      try {
        // class 用 (0, eval)("X") 间接 eval 取词法引用
        // var/const 用直接引用
        const expr = classFiles.has(f) ? `(0, eval)("${exportName}")` : exportName;
        modules[exportName] = vm.runInContext(expr, ctx);
      } catch (e) {
        // 静默失败
      }
    }
  }
  return { ctx, modules };
}

function describe(name, fn) {
  console.log(`\n${C.bold}${C.blue}  ${name}${C.reset}`);
  fn();
}

// 测试 promise 列表（用于 main 等待）
const testPromises = [];

function it(name, fn) {
  // 支持 async 测试
  const run = async () => {
    try {
      await fn();
      totalPassed++;
      console.log(`    ${C.green}✓${C.reset} ${name}`);
    } catch (e) {
      totalFailed++;
      console.log(`    ${C.red}✗${C.reset} ${name}`);
      console.log(`      ${C.red}${e.message}${C.reset}`);
    }
  };
  testPromises.push(run());
}

function skip(name) {
  totalSkipped++;
  console.log(`    ${C.yellow}○${C.reset} ${name} (skipped)`);
}

function check(name, condition, hint) {
  if (!condition) {
    throw new Error(hint || `期望真值，但得到 ${condition}`);
  }
}

function checkEq(name, actual, expected) {
  if (actual !== expected) {
    throw new Error(`期望 ${JSON.stringify(expected)}，实际 ${JSON.stringify(actual)}`);
  }
}

function checkClose(name, actual, expected, tolerance = 0.01) {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`期望 ${expected} (±${tolerance})，实际 ${actual}`);
  }
}

function checkInRange(name, value, min, max) {
  if (value < min || value > max) {
    throw new Error(`期望 ${min} <= ${value} <= ${max}`);
  }
}

// ★ 重要：无论作为主程序还是被 require，都导出 API
// 注入到 global，让测试文件直接用 describe/it/check
global.describe = describe;
global.it = it;
global.skip = skip;
global.check = check;
global.checkEq = checkEq;
global.checkClose = checkClose;
global.checkInRange = checkInRange;

module.exports = { loadModules, mockCanvas, describe, it, skip, check, checkEq, checkClose, checkInRange };

// 主程序才执行
async function main() {
  const args = process.argv.slice(2);
  const files = args.length > 0 ? args : fs.readdirSync(TESTS_DIR)
    .filter(f => /^test-.*\.cjs$/.test(f))
    .sort();

  if (files.length === 0) {
    console.log('没有找到测试文件');
    process.exit(1);
  }

  console.log(`${C.bold}${C.gray}=== Thunder Fighter 测试套件 ===${C.reset}`);
  console.log(`${C.gray}运行 ${files.length} 个测试文件${C.reset}\n`);

  const startTime = Date.now();

  for (const f of files) {
    const fp = path.join(TESTS_DIR, f);
    if (!fs.existsSync(fp)) {
      console.log(`${C.red}✗ 找不到 ${f}${C.reset}`);
      totalFailed++;
      continue;
    }
    try {
      require(fp);
    } catch (e) {
      console.log(`${C.red}✗ ${f} 加载失败: ${e.message}${C.reset}`);
      totalFailed++;
    }
  }

  // 等待所有 async 测试完成
  await Promise.all(testPromises);

  const elapsed = Date.now() - startTime;
  console.log(`\n${C.bold}=== 结果 ===${C.reset}`);
  console.log(`  ${C.green}通过: ${totalPassed}${C.reset}  ${C.red}失败: ${totalFailed}${C.reset}  ${C.yellow}跳过: ${totalSkipped}${C.reset}`);
  console.log(`  ${C.gray}耗时: ${elapsed}ms${C.reset}\n`);

  process.exit(totalFailed > 0 ? 1 : 0);
}

if (require.main === module) {
  main().catch(e => {
    console.error('Runner error:', e);
    process.exit(1);
  });
}
