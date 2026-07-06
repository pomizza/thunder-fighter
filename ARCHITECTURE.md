# 架构文档 · Thunder Fighter

本文档描述项目的**代码架构**、**模块依赖**、**数据流**和**状态机**。

> 📚 配合阅读：[README.md](README.md) · [PROJECT_LOG.md](PROJECT_LOG.md) · [CHANGELOG.md](CHANGELOG.md)
> 🔍 详细信息：见 [index.html 注释](index.html)（17 模块加载顺序）

---

## 📐 整体架构（6 层结构）

```
┌─────────────────────────────────────────────┐
│  L5 核心层 (Core)                            │
│  game.js (706) ─ 主循环 + 状态机            │
│  gameInput.js (109) ─ 键盘事件路由           │
│  gameLogic.js (217) ─ update 游戏逻辑        │
├─────────────────────────────────────────────┤
│  L4 系统层 (Systems)                         │
│  shipSelect.js ─ 战机选择 (3 架)             │
│  shop.js ─ 关卡间商店 (4 商品)               │
│  touch.js ─ 触屏虚拟摇杆                    │
│  achievements.js ─ 10 成就                  │
│  replay.js ─ 录制/回放                      │
├─────────────────────────────────────────────┤
│  L3 数据层 (Data)                            │
│  levels.js ─ 5 关脚本 + 波次执行器          │
│  difficulty.js ─ 3 难度参数化               │
├─────────────────────────────────────────────┤
│  L2 实体层 (Entities)                        │
│  player.js ─ 玩家战机 (12 方法)              │
│  enemies.js ─ 5 敌机 + Boss + 道具          │
├─────────────────────────────────────────────┤
│  L1 效果层 (Effects)                         │
│  effects.js ─ 粒子/拖尾/震动/星云/流星      │
│  bullets.js ─ 子弹类                        │
│  performance.js ─ FPS 监控 + 性能基准       │
├─────────────────────────────────────────────┤
│  L0 基础层 (Base)                            │
│  audio.js ─ WebAudio 程序化音效             │
│  utils.js ─ 数学/碰撞/输入助手              │
│  config.js ─ 时序/玩家/常量集中             │
└─────────────────────────────────────────────┘
```

**规则**：
- L0 → L1 → L2 → L3 → L4 → L5
- 任何层**只能依赖**比它低（或同层）的模块
- **禁止反向依赖**（L3 不能引用 L5）

---

## 🔗 模块依赖图

### 完整依赖（按层）

```
L5 game.js
  ├─→ gameInput.js (键盘事件)
  ├─→ gameLogic.js (游戏逻辑)
  │     ├─→ player.js
  │     ├─→ enemies.js
  │     ├─→ bullets.js
  │     ├─→ levels.js
  │     └─→ effects.js
  ├─→ shop.js
  ├─→ achievements.js
  ├─→ replay.js
  ├─→ performance.js
  ├─→ shipSelect.js
  ├─→ touch.js
  ├─→ levels.js
  ├─→ player.js
  └─→ enemies.js

L4 shipSelect.js
  └─→ (无依赖，独立系统)

L4 shop.js
  └─→ player.js (读取 hp/weaponLevel)
       └─→ utils.js

L4 touch.js
  └─→ (无依赖)

L4 achievements.js
  └─→ (无依赖)

L4 replay.js
  └─→ (无依赖，独立录制/回放)

L3 levels.js
  └─→ enemies.js (生成敌人)
       └─→ utils.js

L3 difficulty.js
  └─→ (无依赖，参数化)

L2 player.js
  └─→ utils.js

L2 enemies.js
  ├─→ utils.js
  └─→ bullets.js (生成敌弹)

L1 effects.js
  └─→ (无依赖，纯绘制)

L1 bullets.js
  └─→ (无依赖)

L1 performance.js
  └─→ (无依赖)

L0 audio.js
  └─→ (无依赖)

L0 utils.js
  └─→ (无依赖，原子工具)

L0 config.js
  └─→ (无依赖，纯数据)
```

### 依赖深度（最深层）

| 路径 | 深度 |
|------|------|
| `game.js` → `gameLogic.js` → `enemies.js` → `bullets.js` | **L5 → L5 → L2 → L1**（4 层）|
| `game.js` → `gameLogic.js` → `player.js` → `utils.js` | L5 → L5 → L2 → L0（4 层）|
| `game.js` → `shop.js` → `player.js` | L5 → L4 → L2（3 层）|

**最深依赖 = 4 层**（合理范围）

### 循环依赖检查

✅ **零循环依赖**（L5 依赖 L4/L3/L2/L1/L0，单向）

---

## 🎮 状态机

### 游戏状态转换

```
                  ┌─────────────┐
                  │    menu     │ (开始)
                  └──────┬──────┘
                         │ 开始游戏
                         ↓
                  ┌─────────────┐
            ┌────→│ selectShip  │ (选择战机)
            │     └──────┬──────┘
            │            │ 确认
            │            ↓
            │     ┌──────────────┐
            │     │ levelIntro   │ (关卡介绍)
            │     └──────┬──────┘
            │            │ 倒计时结束
            │            ↓
            │     ┌──────────────┐
            │     │   playing    │ (游戏中)
            │     └──────┬──────┘
            │            │ BOSS 死
            │            ↓
            │     ┌──────────────┐
            ├─────│ levelClear   │ (关卡通过)
            │     └──────┬──────┘
            │            │ 商店关闭
            │            ↓
            │     (回到 levelIntro 下一关)
            │
            │     ┌──────────────┐
            ├─────│   paused     │ (暂停)
            │     └──────┬──────┘
            │            │ 取消暂停
            │            ↓
            │        (回到 playing)
            │
            │     ┌──────────────┐
            └─────│  gameover    │ (生命 < 0)
                  └──────┬──────┘
                         │ 返回菜单
                         ↓
                    (回到 menu)

            ┌──────────────┐
            │   victory    │ (通关 5 关)
            └──────────────┘
```

### 状态守卫

**关键守卫**（`gameLogic.js` `update()`）：

```js
if (this.state === 'levelClear' && this.player && this.player.alive
    && this.player.lives >= 0 && this.state !== 'gameover' && window.Shop) {
  Shop.open(...)
} else if (this.state === 'levelClear') {
  this.gameOver()  // 玩家死亡兜底
}
```

**4 重守卫**：
1. 状态必须是 `levelClear`
2. 玩家存在
3. 玩家活着
4. 玩家有命 + 不是 gameover

---

## 📊 数据流

### 游戏循环

```
┌──────────────────────────────────────────┐
│ Game.loop() (game.js)                     │
│                                          │
│  while (true):                           │
│    dt = (now - last) / 1000             │
│                                          │
│    ┌────────────────────────────────────┐ │
│    │ 1. input (gameInput.js)            │ │
│    │    - 处理键盘事件                  │ │
│    │    - 设置 Utils.keys               │ │
│    └────────────┬───────────────────────┘ │
│                 ↓                          │
│    ┌────────────────────────────────────┐ │
│    │ 2. update (gameLogic.js)           │ │
│    │    - player.update(dt)             │ │
│    │      - 移动/射击/受击/重生         │ │
│    │    - 敌机 AI + 移动                 │ │
│    │    - 子弹移动 + 碰撞检测           │ │
│    │    - Boss 状态机                   │ │
│    │    - 状态机转换                   │ │
│    │    - 道具拾取                     │ │
│    └────────────┬───────────────────────┘ │
│                 ↓                          │
│    ┌────────────────────────────────────┐ │
│    │ 3. draw (game.js)                  │ │
│    │    - 清屏                          │ │
│    │    - 背景（星云 + 星空）           │ │
│    │    - 敌机                          │ │
│    │    - 子弹                          │ │
│    │    - Boss                          │ │
│    │    - 玩家                          │ │
│    │    - 道具                          │ │
│    │    - 粒子（爆炸/火花/拖尾）       │ │
│    │    - 浮动文字                      │ │
│    │    - HUD（HP/分数/炸弹）          │ │
│    └────────────────────────────────────┘ │
│                                          │
│    requestAnimationFrame(loop)            │
└──────────────────────────────────────────┘
```

### 数据流向

```
键盘输入
  ↓
Utils.keys (按键状态)
  ↓
Player.update (使用 keys 移动/射击)
  ↓
Player.shoot() → Bullet[] (玩家弹)
Bullets[] (玩家弹)
  ↓
update (移动)
  ↓
碰撞检测 (vs Enemies/Boss)
  ↓
Enemies.alive=false → onKill() (加分 + 连击)
  ↓
Effects.spawnExplosion (粒子)
Audio.explosion (音效)
  ↓
HUD 更新 (分数/连击)
```

### 状态机 + 事件流

```
update(dt):
  - if state == 'playing':
      - 检测 player.takeHit
      - 碰撞检测
      - 敌机 AI 更新
      - BOSS 状态机
  - if state == 'levelClear':
      - Shop.open (3.0s 后)
      - Shop 关闭 → nextLevelCountdown 倒计时
      - 倒计时到 0 → levelIntro (下一关)
  - if state == 'gameover':
      - Shop 已关闭
      - 玩家死亡处理
```

---

## 🧩 核心类关系

### Player 生命周期

```
Player.constructor(game, ship)
  ├─ 读取 ship 参数（蓝隼/赤焰/金星）
  ├─ 应用 difficulty（HP/bombs）
  ├─ 应用 PERFORMACE_LIMITS（默认）
  └─ 设置初始状态

Player.update(dt) (per frame)
  ├─ 移动 (wasd/方向键)
  ├─ 射击 (fireRate 计时)
  ├─ 碰撞检测
  └─ 死亡检测 (HP <= 0)

Player.takeHit() (受击)
  ├─ if invulT > 0: 无视
  ├─ if shieldT > 0: 护盾抵挡
  └─ else: hp--, 触发 effects + audio

Player.die() (HP=0)
  ├─ alive = false
  ├─ combo = 0
  ├─ if lives < 0: game.gameOver()
  └─ else: setTimeout(respawn, 600)

Player.respawn()
  ├─ x/y 居中
  ├─ hp = max(3, maxHp-1)
  ├─ invulT = 2.0
  └─ shieldT = 1.5
```

### Enemy 生命周期

```
Enemy.constructor(x, y, type)
  ├─ 从 Config.ENEMY_TYPES 读取基础数据
  ├─ 设置 w/h/hp/vy/fireRate/score
  ├─ 设置 pattern（移动模式）
  └─ maxHp = hp

Enemy.update(dt, game) (per frame)
  ├─ 根据 pattern 移动
  │   ├─ 'down_then_sine' — 入轨后正弦摆动
  │   ├─ 'aimed_shoot' — 瞄准玩家射击
  │   ├─ 'tank' — 撞墙反弹
  │   ├─ 'sweep' — 横向扫射
  │   └─ 'homing_kamikaze' — 锁定俯冲
  ├─ 射击 (if fireT <= 0)
  └─ 离屏检测 (alive = false)

Enemy.hit(damage)
  ├─ hp -= damage
  └─ if hp <= 0: alive = false (爆炸)
```

### Boss 生命周期

```
Boss.constructor(x, y, level)
  ├─ hp = (200 + level*120) * difficulty.bossHpMul
  ├─ hp = 320/440/560/680/800 (5 关)
  ├─ 设置 AI（5 种）：
  │   ├─ level 1: 'patrol' — 简单横移
  │   ├─ level 2: 'dive' — 俯冲
  │   ├─ level 3: 'spiral' — 螺旋
  │   ├─ level 4: 'figure8' — 8字
  │   └─ level 5: 'chase' — 追随玩家
  ├─ phase = 0 (entry → fighting)
  └─ color/score 随关卡

Boss.update(dt, game)
  ├─ entry 阶段：入场动画
  ├─ phase 1：5 种 AI 之一
  ├─ phase 1.5 (hp < 70%)：加速 + 新弹幕
  └─ phase 2 (hp < 35%)：狂暴 + 满屏弹幕

Boss.fire(game)
  ├─ phase 1：简单弹幕 (3-8 发)
  ├─ phase 1.5：旋转扇形 + 环射
  └─ phase 2：8 方向环射 + 3 重弹幕
```

---

## 🔧 关键子系统

### 1. 子弹系统（Bullets[]）

```
Player.shoot()
  ↓
new Bullet(x, y, vx, vy, { friendly: true })
  ↓
playerBullets[] 数组
  ↓
update (移动)
  ↓
碰撞检测 (vs Enemies)
  ↓
碰撞 → bullet.alive=false
  ↓
enemy.alive=false
  ↓
Player.onKill(enemy) (加分 + 连击)
```

### 2. 道具系统（PowerUps[]）

```
Enemy.alive=false
  ↓
随机生成 PowerUp (kind: heal/weapon/bomb/shield)
  ↓
powerups[] 数组
  ↓
update (下降)
  ↓
Player 碰撞检测
  ↓
Player.applyPowerUp(kind)
  ├─ 'heal': hp = min(maxHp, hp+2)
  ├─ 'weapon': weaponLevel++ (if < 4)
  ├─ 'bomb': bombs++
  └─ 'shield': shieldT = 8
```

### 3. 成就系统（Achievements[]）

```
Player.onKill(enemy)
  ↓
Achievements.onCombo(combo)
  ↓
check DEFS 满足条件 → unlocked
  ↓
notifications.push({ name, icon, t: 2.5 })
  ↓
update() 减少 t
  ↓
t <= 0 → 删除通知
  ↓
drawNotifications (中央弹出)
```

### 4. Replay 系统

```
启动录制 (startRecording)
  ↓
每帧: tickRecordFrame(game)
  ├─ 快照 player (x/y/hp/weaponLevel)
  ├─ 快照 enemies[]
  ├─ 快照 enemyBullets[]
  ├─ 快照 playerBullets[]
  ├─ 快照 powerups[]
  └─ 快照 boss (if alive)
  ↓
recordData.ticks[] (完整状态序列)

Player.die() → stopRecording → game.lastReplayData

回放 (startPlayback)
  ↓
tickPlayback → applySnapshot(game)
  ├─ 把录像状态写入 game 对象
  └─ 跳过所有游戏逻辑
  ↓
只跑 Player.update (按键移动)
  ↓
draw (用录像状态绘制)
```

---

## 📈 流程图（ASCII Art）

### 主循环

```
┌──────────────────────────────────────────┐
│ Game.loop() (每帧 60 FPS)                  │
│                                          │
│   while (true)                           │
│     ↓                                    │
│   ┌─ 输入 ─────────────────────────┐    │
│   │ gameInput.js: 键盘 → Utils.keys │    │
│   └────────────┬─────────────────────┘    │
│                ↓                          │
│   ┌─ 更新 ─────────────────────────┐    │
│   │ gameLogic.js: 玩家 + 敌机 + Boss │    │
│   │   ↓ player.update(dt)           │    │
│   │   ↓ 敌机 AI + 移动              │    │
│   │   ↓ 子弹移动 + 碰撞             │    │
│   │   ↓ 状态机转换                 │    │
│   └────────────┬─────────────────────┘    │
│                ↓                          │
│   ┌─ 绘制 ─────────────────────────┐    │
│   │ game.js: 14 步 draw pipeline   │    │
│   │   背景 → 敌机 → 子弹 → 玩家   │    │
│   │   → 粒子 → HUD                 │    │
│   └────────────────────────────────┘    │
│                                          │
│   requestAnimationFrame(loop)            │
└──────────────────────────────────────────┘
```

### 子弹数据流

```
Player.shoot()
   ↓
new Bullet (friendly: true)
   ↓
playerBullets[] 数组
   ↓
update() 每帧移动
   ↓
碰撞检测 vs enemies[] / boss
   ↓
撞到 → bullet.alive=false
   ↓
enemy.hit(damage) 或 boss.hit(damage)
   ↓
hp <= 0 → enemy/boss.alive=false
   ↓
Player.onKill(enemy)
   ├─ 计算分数（含连击加成）
   ├─ 增加 combo
   └─ 触发特效 + 音效
```

### 状态机转换

```
  启动 → [menu]
         ↓ 开始游戏
        [selectShip] → 选战机 → Z 确认
         ↓
        [levelIntro] → 倒计时 3 秒
         ↓
        [playing] ── 玩家死亡 → [gameover]
         │              ↑ 返回菜单
         ↓ BOSS 死
        [levelClear] → 商店弹出 3 秒
         ↓ 商店关闭
        倒计时 1 秒 → [levelIntro] 下一关
         │
         ↓ 第 5 关通关
        [victory]
```

### 性能监控流程

```
Game.loop() 帧
   ↓
PerfMonitor.tick(dt)
   ├─ frameTimes.push(dt)
   ├─ 更新 lastSecondFps
   └─ 更新 peakMemory
   ↓
每 1 秒:
   ├─ lastSecondFps = 总帧数 / 总时间
   └─ longTermSamples.push({fps, mem, ts})
   ↓
按 F3:
   PerfMonitor.draw(ctx, x, y)
   └─ 显示 FPS/帧时间/P95
```

## 🎨 视觉系统（rendering pipeline）

```
draw(ctx):
  1. ctx.fillRect (清屏)
  2. Effects.drawNebulae (远景)
  3. Effects.drawStars (中景)
  4. effects.drawMeteors (流星)
  5. Effects.drawTrails (拖尾)
  6. enemies (敌机)
  7. bullets (玩家 + 敌弹)
  8. boss (if alive)
  9. player (玩家)
  10. powerups (道具)
  11. Effects.drawParticles (爆炸)
  12. Effects.drawShockwaves (冲击波)
  13. Effects.drawFloats (浮动文字)
  14. HUD (HP/分数/炸弹/连击)
  15. PerfMonitor.draw (按 F3 切换)
```

---

## 🔧 持久化（localStorage）

| Key | 用途 | 大小 |
|-----|------|------|
| `thunder_hi` | 最高分 | < 50 bytes |
| `thunder_diff` | 难度 | < 10 bytes |
| `thunder_ach` | 成就解锁（10 个）| < 200 bytes |
| `thunder_replay` | (未使用) | - |

**总占用**：< 300 bytes（5 KB 限制内）

**Replay 数据**：**不持久化**（太大，刷新即失）

---

## 📏 关键参数

### 画布
- `W = 540`, `H = 780`（4:5.78 比例）

### 玩家（蓝隼 NORMAL）
- `hp = 5`, `maxHp = 5`
- `speed = 320` 像素/秒
- `fireRate = 0.12` 秒/发
- `bombs = 3`（初始）

### 敌机（scout）
- `hp = 2`, `vy = 130`
- `fireRate = 1.6`
- `score = 50`

### Boss（5 关 HP）
- 关 1: 200 + 1×120 = 320
- 关 2: 200 + 2×120 = 440
- 关 3: 200 + 3×120 = 560
- 关 4: 200 + 4×120 = 680
- 关 5: 200 + 5×120 = 800

### 性能硬上限
- 粒子: 300
- 流星: 8
- 浮动: 20
- 冲击波: 8

---

## 🚀 添加新模块检查清单

新增模块时**必须**更新：

- [ ] 该模块放到合适的层（L0-L5）
- [ ] `index.html` `<script>` 标签按顺序加入
- [ ] `tests/runner.cjs` `order[]` 加入
- [ ] `tests/runner.cjs` `moduleMap[]` 加入
- [ ] `tests/runner.cjs` `classFiles` Set 加入（如果是 class）
- [ ] `tests/test-XXX.cjs` 新测试文件
- [ ] `package.json` `test:XXX` 脚本
- [ ] `index.html` 注释中的模块清单
- [ ] `README.md` 项目结构
- [ ] `CHANGELOG.md` Unreleased section
- [ ] `ARCHITECTURE.md` 本文件（依赖图）

---

## 📚 相关文档

- [README.md](README.md) — 项目说明和操作
- [CHANGELOG.md](CHANGELOG.md) — 变更日志
- [PROJECT_LOG.md](PROJECT_LOG.md) — 开发日志
- [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) — 行为准则
- [CONTRIBUTING.md](.github/CONTRIBUTING.md) — 贡献指南
- [SECURITY.md](.github/SECURITY.md) — 安全政策
- [tests/README.md](tests/README.md) — 测试说明

---

**最后更新**：2026-07-05
**对应版本**：v1.0.0 (commit 1ebca6b)

---

## 📝 Commit Message 策略

**采用**：**Conventional Commits 标题 + 中文正文**

### 标题（英文前缀）

```
<type>(<scope>): <description>

类型:
  feat     - 新功能
  fix      - Bug 修复
  docs     - 仅文档
  refactor - 重构
  perf     - 性能
  test     - 测试
  chore    - 杂项（CI/构建等）
```

**示例**：
- `feat: 玩家道具系统`
- `fix: 神风机飞出屏外`
- `docs: README 操作说明`
- `chore: 升级 actions/checkout`

### 正文（全中文 + emoji 分类）

```
【核心功能】
- 详细改动 1
- 详细改动 2

【统计】
- 5 文件
- 测试: 80/80 → 88/88 (+8 项)
- 0 破坏性变更
```

### 为什么这样设计

| 维度 | 选择 | 理由 |
|------|------|------|
| **标题** | 英文（Conventional Commits）| ✅ 行业标准 · ✅ 工具集成 · ✅ 国际化 |
| **正文** | 全中文 | ✅ 项目是中文面向 · ✅ 详细改动更清晰 |
| **emoji** | 用作分类符 | ✅ 视觉分层 · ✅ 不影响 git log |

**完整示例**：见 git log 现有 10 个 commits（每个都遵循此格式）

### 对比方案

| 方案 | 优点 | 缺点 |
|------|------|------|
| **全英文** | 国际化 | ❌ 项目是中文用户面向 |
| **全中文** | 本地化 | ❌ 失去 Conventional Commits 标准 |
| **混合（当前）** | 兼顾 | 轻微不一致（但能接受） |

### 修改历史规则

**不允许修改已发布 commit message**（除非有严重错误）：
- ❌ git rebase -i 修改历史
- ❌ git push --force 改写远程
- ✅ git commit --amend 仅用于**最新一个**未推送 commit

---

## 🔄 CI 升级计划（v1.1.0）

**当前状态**（v1.0.0）：
- `actions/checkout@v4` (2023 发布)
- `actions/setup-node@v4` (2023 发布)
- `release-drafter/release-drafter@v5` (2023 发布)

**待升级**（v1.1.0）：
- `actions/checkout@v4` → `v7` （关闭 3 个 dependabot PR）
- `actions/setup-node@v4` → `v6`
- `release-drafter/release-drafter@v5` → `v7`

**为什么不接受 dependabot 升级 PR（如 PR #4 crazy-max 5→6）**：
- ✅ v5 → v6 是大版本（semver-major）
- ✅ ghaction-github-labeler 是第三方 action（无本地测试工具）
- ✅ 风险高于收益
- ✅ v1.0.0 已稳定，labels workflow 工作正常
- ✅ 已在 `.github/dependabot.yml` 加 ignore 规则（`crazy-max/*`, `release-drafter/*`）
- ✅ 等 v1.1.0 集中升级 + 完整测试

**为什么暂不升级**（actions/setup-node / actions/checkout）：
- ✅ v1.0.0 已发布且 CI 测试通过（v4 跑通）
- ✅ dependabot 3 个 PR 已关闭（已决策暂不升级）
- ⚠️ 升级到 v6/v7 风险高（3 个大版本跳跃）
- ⚠️ 本环境无 `act` 工具本地测试 actions
- ⚠️ Node v6 setup-node 默认 Node 20（vs v4 默认 Node 16）

**未来升级流程**（v1.1.0）：
1. 升级 `actions/checkout@v4` → `v7`
2. 升级 `setup-node@v4` → `v6`
3. 升级 `release-drafter@v5` → `v7`
4. 测试 80/80 测试通过
5. 让 dependabot 重新开 PR

**当前 `.github/dependabot.yml` 设置**：
```yaml
open-pull-requests-limit: 0  # 禁用自动 PR
```

**恢复自动 PR**（v1.1.0 时）：
```yaml
open-pull-requests-limit: 3  # 重新启用
```

---

**最后更新**：2026-07-05
**对应版本**：v1.0.0 (commit 1ebca6b)
