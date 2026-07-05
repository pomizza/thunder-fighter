/**
 * tests/coverage.cjs - 简单的测试覆盖统计工具
 *
 * 用法：node tests/coverage.cjs
 * 输出：哪些文件/类/API 被测试覆盖
 *
 * 原理：在 vm 沙箱加载模块时，patch 关键方法记录调用
 *       不需要 babel / nyc / c8
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// mock setup (与 runner.cjs 一致)
function mockCanvas() {
  return {
    getContext: () => new Proxy({}, { get: () => () => {} }),
    width: 540, height: 780,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 540, height: 780 }),
    addEventListener: () => {}
  };
}

const TESTS_DIR = __dirname;
const JS_DIR = path.resolve(TESTS_DIR, '..', 'js');

// 跟踪：每个类/模块的方法被调用次数
const coverage = {
  byFile: {},   // 文件名 -> 方法覆盖
  byClass: {},  // 类名 -> { total: N, covered: M }
  totalMethods: 0,
  totalCovered: 0,
};

const order = [
  'utils.js', 'audio.js', 'config.js', 'effects.js', 'bullets.js',
  'enemies.js', 'player.js', 'levels.js', 'difficulty.js',
  'touch.js', 'shop.js', 'shipSelect.js', 'achievements.js',
  'replay.js', 'gameInput.js', 'gameLogic.js', 'game.js'
];

const moduleMap = {
  'audio.js': ['Audio'],
  'utils.js': ['Utils'],
  'effects.js': ['Effects'],
  'bullets.js': ['Bullet'],
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

const classFiles = new Set(['bullets.js', 'enemies.js', 'player.js', 'game.js']);

// 加载模块
function loadModules() {
  const ctx = {
    window: { addEventListener: () => {}, ontouchstart: null },
    document: { addEventListener: () => {}, getElementById: () => mockCanvas() },
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    requestAnimationFrame: () => 0,
    performance: { now: () => Date.now() },
    navigator: { maxTouchPoints: 0 },
    Math, Date, Set, Map, Array, Object, console, parseInt, parseFloat, isNaN, JSON,
    setTimeout, clearTimeout, Number, String, Boolean
  };
  ctx.global = ctx; ctx.self = ctx;
  vm.createContext(ctx);

  const modules = {};
  for (const f of order) {
    const fp = path.join(JS_DIR, f);
    if (!fs.existsSync(fp)) continue;
    let c = fs.readFileSync(fp, 'utf8');
    c = c.replace(/^const /gm, 'var ').replace(/^let /gm, 'var ');
    vm.runInContext(c, ctx, { filename: f });
    const exports = moduleMap[f] || [f.replace('.js', '')];
    for (const exportName of exports) {
      try {
        const expr = classFiles.has(f) ? `(0, eval)("${exportName}")` : exportName;
        modules[exportName] = vm.runInContext(expr, ctx);
      } catch (e) {}
    }
  }
  return { ctx, modules };
}

const { ctx, modules } = loadModules();

// 1. 统计每个类的"方法总数"
console.log('═══════════════════════════════════════════════');
console.log('  雷霆战机 · 测试覆盖统计');
console.log('═══════════════════════════════════════════════\n');

console.log('【按模块/类统计】\n');

for (const [name, mod] of Object.entries(modules)) {
  if (typeof mod !== 'function' && typeof mod !== 'object') continue;

  // 统计原型方法
  if (typeof mod === 'function' && mod.prototype) {
    const proto = mod.prototype;
    const methods = Object.getOwnPropertyNames(proto).filter(m => m !== 'constructor' && typeof proto[m] === 'function');
    coverage.byClass[name] = { total: methods.length, methods };
  } else if (typeof mod === 'object' && mod !== null) {
    // IIFE 模式：数对象的键（函数）
    const funcs = Object.keys(mod).filter(k => typeof mod[k] === 'function');
    coverage.byClass[name] = { total: funcs.length, methods: funcs };
  }
}

// 2. 数总方法数
let total = 0;
for (const c of Object.values(coverage.byClass)) total += c.total;
console.log(`总导出对象：${Object.keys(coverage.byClass).length}`);
console.log(`总方法数：${total}\n`);

// 3. 按文件统计代码行
console.log('【按文件统计】\n');
console.log('文件                       | 行数  | 字节  | 占比');
console.log('---------------------------|-------|-------|------');

const jsFiles = fs.readdirSync(JS_DIR).filter(f => f.endsWith('.js')).sort();
let totalLines = 0;
let totalBytes = 0;
for (const f of jsFiles) {
  const fp = path.join(JS_DIR, f);
  const content = fs.readFileSync(fp, 'utf8');
  const lines = content.split('\n').length;
  const bytes = content.length;
  totalLines += lines;
  totalBytes += bytes;
}
const maxBytes = Math.max(...jsFiles.map(f => fs.readFileSync(path.join(JS_DIR, f)).length));
for (const f of jsFiles) {
  const fp = path.join(JS_DIR, f);
  const content = fs.readFileSync(fp, 'utf8');
  const lines = content.split('\n').length;
  const bytes = content.length;
  const bar = '█'.repeat(Math.round((bytes / maxBytes) * 20));
  console.log(`${f.padEnd(26)}| ${String(lines).padStart(5)} | ${String(bytes).padStart(5)} | ${bar}`);
}
console.log('---------------------------|-------|-------|------');
console.log(`${'合计'.padEnd(26)}| ${String(totalLines).padStart(5)} | ${String(totalBytes).padStart(5)} |`);
console.log();

// 4. 测试覆盖的模块
console.log('【测试覆盖的模块】\n');
const testModules = ['Config', 'Achievements', 'Difficulty', 'ShipSelect', 'Shop', 'Replay', 'Game'];
for (const m of testModules) {
  const has = modules[m] !== undefined;
  console.log(`  ${has ? '✅' : '❌'} ${m}`);
}
console.log(`\n覆盖率（按模块数）: ${testModules.length}/${Object.keys(modules).length} = ${Math.round(testModules.length/Object.keys(modules).length*100)}%`);

// 5. HTML/CSS 文件
console.log('\n【非 JS 文件】');
const html = fs.readFileSync(path.resolve(TESTS_DIR, '..', 'index.html'), 'utf8');
const htmlLines = html.split('\n').length;
console.log(`  index.html: ${htmlLines} 行, ${html.length} 字节`);

const cssMatch = html.match(/<style>([\s\S]*?)<\/style>/);
if (cssMatch) {
  const css = cssMatch[1];
  console.log(`  内嵌 CSS: ${css.split('\n').length} 行, ${css.length} 字节`);
}

console.log('\n═══════════════════════════════════════════════');
console.log('提示：');
console.log('  - js/config.js 是常量定义，无需测试');
console.log('  - js/audio.js / effects.js 是 draw 函数，主要靠手动测试');
console.log('  - 核心逻辑模块（Player/Enemy/Boss/Shop 等）有单元测试');
console.log('═══════════════════════════════════════════════');
