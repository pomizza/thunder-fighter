# 测试套件

持久化、自动化测试，覆盖雷霆战机所有核心模块。

## 🚀 运行

```bash
# 跑全部测试
cd thunder_shooter && node tests/runner.cjs

# 跑单个文件
node tests/runner.cjs test-config.cjs

# 跑多个文件
node tests/runner.cjs test-config.cjs test-achievements.cjs
```

## 📋 测试文件

| 文件 | 覆盖模块 | 测试项数 | 说明 |
|------|----------|----------|------|
| `test-config.cjs` | Config | 3 | 时序常量、Game 类常量 |
| `test-achievements.cjs` | Achievements | 7 | 10 成就、解锁、通知 |
| `test-difficulty.cjs` | Difficulty | 5 | 3 档参数、循环切换 |
| `test-shipSelect.cjs` | ShipSelect | 5 | 3 战机、API、属性 |
| `test-shop.cjs` | Shop | 4 | 4 商品、价格、字段 |
| `test-replay.cjs` | Replay | 5 | 录制/回放/暂停 |
| `test-gameflow.cjs` | 集成 | 6 | 完整游戏流程、状态机 |
| **总计** | **7 模块** | **34 项** | **100% 通过** |

## 🏗️ 架构

### 1. 测试运行器（`runner.cjs`）

- **`describe(name, fn)`**：定义测试套件
- **`it(name, fn)`**：定义测试项
- **`check(name, condition, hint?)`**：断言（condition 为真则通过）
- **`checkEq(name, actual, expected)`**：严格相等断言
- **`checkClose(name, actual, expected, tolerance)`**：浮点近似断言
- **`checkInRange(name, value, min, max)`**：范围断言
- **`skip(name)`**：跳过测试

### 2. 模块加载机制

用 `vm.createContext()` 把所有 JS 模块加载到 Node 沙箱，模拟浏览器环境。

**关键 hack：`(0, eval)` 间接 eval 提取 ES6 class**

```js
// 背景：ES6 class 不会自动挂到 globalThis
class Boss { ... }
console.log(typeof globalThis.Boss);  // undefined ❌

// 解决：用间接 eval 取词法引用
const Boss = (0, eval)("Boss");
console.log(typeof Boss);  // "function" ✓
```

**`runner.cjs` 中的实现**：
```js
const classFiles = new Set(['bullets.js', 'enemies.js', 'player.js', 'game.js']);

for (const f of order) {
  vm.runInContext(c, ctx, { filename: f });
  const exports = moduleMap[f] || [f.replace('.js', '')];
  for (const exportName of exports) {
    const expr = classFiles.has(f) ? `(0, eval)("${exportName}")` : exportName;
    modules[exportName] = vm.runInContext(expr, ctx);
  }
}
```

**moduleMap 配置**（单文件多 class 用数组）：
```js
const moduleMap = {
  'audio.js': ['Audio'],
  'utils.js': ['Utils'],
  'bullets.js': ['Bullet'],
  'enemies.js': ['Enemy', 'Boss', 'PowerUp'],  // 同一文件 3 个 class
  'player.js': ['Player'],
  'game.js': ['Game'],
  // 其他 var/const 暴露的模块
  'config.js': ['Config'],
  'levels.js': ['Levels'],
  // ...
};
```

**为什么这样做**：
- ✅ **0 生产代码改动**（方案 B）：20 轮成果完全保留
- ✅ **隔离性**：测试代码和生产代码边界清晰
- ✅ **可回退**：删除 `tests/` 目录即完全回退
- ⚠️ **依赖 JS 内部机制**：如果未来 Node 升级改变了 eval 行为可能失效

### 3. Mock Canvas

测试时不需要真实 canvas，`mockCanvas()` 提供最小化 API：

```js
function mockCanvas() {
  return {
    getContext: () => ({ fillRect: () => {}, /* ... */ }),
    width: 540, height: 780,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 540, height: 780 })
  };
}
```

draw 函数可以调用，但**不绘制任何东西**（仅验证不抛错）。

## ➕ 添加新测试

### 基础示例

```cjs
const { loadModules } = require('./runner.cjs');

describe('我的新模块', () => {
  it('应该满足条件', () => {
    const { modules } = loadModules();
    check('foo === bar', modules.MyModule.foo === 'bar');
  });
});
```

### 测试 ES6 class（构造实例）

```cjs
describe('Player 构造', () => {
  it('创建实例', () => {
    const { modules } = loadModules();
    const Player = modules.Player;
    const fakeGame = { W: 540, H: 780, enemies: [], enemyBullets: [] };
    const p = new Player(fakeGame, modules.ShipSelect.ships[0]);
    check('alive=true', p.alive === true);
    check('hp=5', p.hp === 5);
  });
});
```

### 私有变量的处理

❌ **不要直接访问私有变量**：
```js
// 错误：stats 是 IIFE 内部变量，外部访问不到
A.stats.kills = 99;  // 报错或静默失败
```

✅ **用触发器 + 副作用验证**：
```js
it('resetStats 重置', () => {
  const { modules } = loadModules();
  const A = modules.Achievements;
  A.unlocked = {};
  A.resetStats();
  A.onKill(false);
  A.resetStats();
  check('不抛错', true);
  check('已解锁的不丢', A.isUnlocked('first_blood') === true);
});
```

如果必须访问私有变量，**改源码**用 `module.exports` / `globalThis.X` 暴露。

### 已知 API 误用陷阱

| 错误 | 正确 | 说明 |
|------|------|------|
| `D.setLevel('NORMAL')` | `D.set('NORMAL')` | Difficulty API 是 `set` |
| `D.LEVELS.some(...)` | `'EASY' in D.LEVELS` | LEVELS 是 object 不是 array |
| `A.stats.kills` | 用 `onKill` 触发 | stats 是私有变量 |
| `it.hasOwnProperty('canBuy')` | 只检查 cost/desc | Shop items 没 canBuy 字段 |

### 浮点比较

```js
// ❌ 严格相等可能失败
check('等于 0.5', v === 0.5);

// ✅ 用 checkClose
checkClose('近似 0.5', v, 0.5, 0.01);  // 误差 0.01
```

### 跑新测试

```bash
node tests/runner.cjs test-我的新测试.cjs
```

## 🐛 常见错误

### "X is not a constructor"
- **原因**：class 没加入 `moduleMap` 或没在 `classFiles` 集合中
- **修复**：在 `runner.cjs` 的 `classFiles` 和 `moduleMap` 中添加该文件

### "X is not a function"
- **原因**：`moduleMap` 中 key 拼错，或 var 暴露名错
- **修复**：检查对应源文件的 `const X = ...` 名

### 测试在浏览器 OK 但 Node 失败
- **原因**：依赖了浏览器 API（`window`/`document`/`localStorage`）
- **修复**：在测试文件中 mock 这些 API

## 📊 当前状态

| 指标 | 数值 |
|------|------|
| 测试文件 | 7 |
| 测试项 | 34 |
| 通过率 | 100% |
| 覆盖模块 | Config / Achievements / Difficulty / ShipSelect / Shop / Replay / Game |
| 耗时 | ~40ms |
| 外部依赖 | 0 |
