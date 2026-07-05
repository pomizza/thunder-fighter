# CHANGELOG · 20 轮精修/优化日志

本项目经历 **20 轮迭代**，从单一游戏循环演变为完整产品。

## 概览

| 阶段 | 轮次 | 类型 | 主要变更 |
|------|------|------|----------|
| 基础 | 1-2 | Bug 修复 | 菜单方向键、连击回放死代码 |
| 核心 | 3-7 | Bug 修复 | 神风机、武器降级、屏幕震动、连击系统 |
| 系统 | 8-11 | 系统实现 | 关卡主题、商店、战机选择、动态背景 |
| 进化 | 12-15 | 系统实现 | BOSS AI、动态背景、性能、成就 |
| 收尾 | 16-20 | 高级+修复 | Replay、Boss 竞态修复、文档 |

---

## 详细日志

### 第 1 轮 · 修复菜单方向键 Bug
- **位置**：`js/game.js` 主菜单 keydown
- **问题**：↑/↓ 方向键都执行 `+1` 模 2，无法回到第一项
- **修复**：↑ 改为 `-1`，↓ 保持 `+1`
- **测试**：10 项断言全部通过

### 第 2 轮 · 移除 BOMB 死代码 + 真正清屏
- **位置**：`js/player.js` `useBomb()`
- **问题**：`Bullet(-100, -100, 0, 0, { life: 0.001 })` 死代码，且原版"清屏"注释不实
- **修复**：删除死代码，遍历 `enemyBullets` 设 `alive=false` + 浮动"清屏! -N"
- **测试**：30 项全部通过

### 第 3 轮 · 神风机两阶段 AI
- **位置**：`js/enemies.js` `homing_kamikaze` pattern
- **问题**：神风机出生即全速冲向玩家，60s 内 12 架全部飞出屏幕
- **修复**：两阶段 AI（y<100 慢速入轨 → y>=100 全速攻击）
- **测试**：9 项全部通过

### 第 4 轮 · 修复重生时武器降级
- **位置**：`js/player.js` `respawn()`
- **问题**：死亡重生强制 weaponLevel-1，与设计意图不符（lives-- 和 maxHp-1 已足够惩罚）
- **修复**：删除降级
- **测试**：5 项全部通过

### 第 5 轮 · 修复 levelClear 期间玩家输入
- **位置**：`js/player.js` `update()`
- **问题**：levelClear/levelIntro 期间玩家仍可移动/射击，与过场状态冲突
- **修复**：添加 `inputLocked` 守卫，但保留视觉尾迹
- **测试**：11 项全部通过

### 第 6 轮 · 屏幕震动效果重做
- **位置**：`js/effects.js` 整个震动系统
- **改动**：
  - 新增 X/Y 独立偏移（`getShake()` / `getShakeY()`）
  - 线性衰减（1.0 → 0.0）
  - 暴露 `shakeScaled()` 支持难度缩放
- **修复**：移除 `(shakeT > 0 ? 1 : 0)` 死守卫
- **测试**：15 项全部通过

### 第 7 轮 · 连击系统（Combo）
- **位置**：`js/player.js`（combo 字段+onKill）
- **改动**：
  - 1.5s 连击窗口（HARD 1.2s / EASY 2.0s）
  - 分数倍率 = 1 + combo*0.1，上限 2x
  - 3+ 连击显示 "Nx COMBO!"
  - 10/25/50 连击触发微震
- **HUD**：顶部居中显示 + 进度条
- **测试**：23 项全部通过

### 第 8 轮 · 修复 Shop 时间常量
- **位置**：`js/game.js` Boss 死亡 → Shop 启动
- **改动**：提取 3 个常量（0.8s/3s/1s），改善可读性
- **注**：本轮内容实际后来被第 18 轮覆盖

### 第 9 轮 · 难度系统（3 档）
- **位置**：新文件 `js/difficulty.js`
- **EASY/NORMAL/HARD**：HP/bombs/敌机 HP/数量/Boss HP/连击窗口/震屏/分数倍率 全部参数化
- **UI**：菜单难度项 ← → 切换，HUD 右上角显示
- **测试**：30 项全部通过

### 第 10 轮 · 关卡间商店
- **位置**：新文件 `js/shop.js`（153 行）
- **4 商品**：HP/bombs/weapon/shield
- **UI**：标题+当前分+商品列表+价格+已满提示
- **集成**：Boss 死亡 → 0.8s 后开 Shop → 关闭后 1s 下一关
- **测试**：30 项全部通过

### 第 11 轮 · 战机选择（3 架）
- **位置**：新文件 `js/shipSelect.js`（191 行）
- **蓝隼/赤焰/金星**：速度/HP/武器差异化
- **UI**：3 架战机横排，选中放大 1.5x
- **Player 兼容**：不传 ship 参数仍可用
- **测试**：36 项全部通过

### 第 12 轮 · 动态背景（星云+流星）
- **位置**：`js/effects.js` + `js/levels.js` nebula 主题
- **3 层景深**：远景星云（4 团漂移）+ 中景星空 + 流星
- **5 关主题配色**：蓝紫/暗紫红/火红/青绿/深紫
- **测试**：20 项全部通过

### 第 13 轮 · 5 个 BOSS 独特 AI
- **位置**：`js/enemies.js` Boss 类
- **5 种 AI**：
  - patrol（横移）→ dive（俯冲）→ spiral（螺旋）→ figure8（8字）→ chase（追随）
- **5 种弹幕**：扇形瞄准/瞄准/旋转扇形/8环射/3瞄准
- **测试**：37 项全部通过

### 第 14 轮 · 性能优化
- **位置**：`js/effects.js` + `js/game.js`
- **8 类数组硬上限**：粒子 300/流星 8/玩家弹 100/敌弹 200/敌机 30/...
- **离屏剔除**：粒子/子弹超出 ±100px 立即删除
- **测试**：16 项全部通过

### 第 15 轮 · 成就系统（10 个）
- **位置**：新文件 `js/achievements.js`（154 行）
- **10 成就**：first_blood/combo_10/combo_25/boss_1/boss_5/score_10k/score_50k/collector/no_damage_boss/all_hard
- **localStorage 持久化**
- **通知系统**：2.5s 浮动弹出
- **测试**：39 项全部通过

### 第 16 轮 · Replay 回放系统
- **位置**：新文件 `js/replay.js`（218 行）
- **录制**：每帧保存 keys+player+enemies+bullets+boss 完整状态
- **回放**：覆盖 keys，UI 显示 REPLAY 角标+进度条+暂停
- **入口**：主菜单第 3 项 / GameOver 画面按 R
- **测试**：43 项全部通过

### 第 17 轮 · 修复 Replay 系统"画面与录像不符"严重缺陷
- **位置**：`js/replay.js` `applySnapshot()` + `js/game.js` replay 跳过游戏逻辑
- **问题**：replay 期间敌机 AI 真实运行，造成画面与录像不符；可能触发 gameOver
- **修复**：
  - `applySnapshot()` 把录像状态同步到 game 对象
  - replay 期间 Player.update 仍跑（按 keys 移动），**但跳过大块游戏逻辑**
  - 同步数组长度（多余截断/不足新建）
- **测试**：18 项全部通过

### 第 18 轮 · 修复 Shop 状态机漏洞
- **位置**：`js/game.js` Shop 期间
- **问题**：
  - Shop 期间玩家死亡导致双状态冲突
  - Shop 关闭后倒计时无 UI 提示
- **修复**：
  - 3 个时序常量（LEVEL_CLEAR_DELAY=0.8 / SHOP_PROTECT_INVUL=3 / NEXT_LEVEL_DELAY=1）
  - Shop 打开前给玩家 3s 无敌
  - Shop 期间死亡检测 → 强制关闭 Shop + gameOver
  - 独立倒计时推进
  - 倒计时 UI（屏幕底部居中）
- **测试**：20 项全部通过

### 第 19 轮 · 修复 Boss 死亡时 3 个并发竞态
- **位置**：`js/game.js` Boss 死亡块 + `js/player.js` die()/respawn()
- **3 个竞态**：
  1. 玩家已死 + Boss 死亡同帧 → 状态卡 playing
  2. Player.die 在 levelClear/levelIntro/menu/help → 假死假生
  3. respawn 守卫不完整（未排除 levelClear/levelIntro）
- **修复**：
  - Boss 死亡守卫检测玩家死亡时**主动调 gameOver**
  - Player.die 在过场状态 → 主动 gameOver
  - Player.respawn 守卫加 levelClear/levelIntro 排除
  - setTimeout 4 重守卫（state 不等于 gameover）
- **测试**：13 项全部通过

### 第 20 轮 · 最终文档与审计
- **位置**：`README.md` + `CHANGELOG.md`
- **内容**：
  - 完整 README（231 行）：12 大系统、键位、菜单结构、成就列表、技术架构
  - 完整 CHANGELOG（本文档）：20 轮迭代总览
  - 状态审计：3701 行代码 / 14 模块 / 0 外部依赖

---

## 📊 累计数据

| 指标 | 数值 |
|------|------|
| 迭代轮次 | 20 |
| 新增文件 | 6（difficulty/touch/shop/shipSelect/achievements/replay） |
| 新增代码行 | ~1800 |
| 总代码行 | 3701 |
| 修复 Bug | 12+ |
| 新增系统 | 8（连击/商店/战机选择/星云/BOSS AI/性能/成就/回放） |
| 新增成就 | 10 |
| 新增关卡主题 | 5 |
| 测试用例 | 累计 400+ |
| 测试通过率 | 100% |

---

## 🎯 项目最终状态

✅ **完整产品**：5 关 / 3 难度 / 3 战机 / 10 成就 / 商店 / 回放 / 触屏
✅ **零外部依赖**：纯 HTML5+JS+Canvas
✅ **跨平台**：桌面 + 移动端
✅ **完整文档**：README + CHANGELOG
✅ **性能优化**：硬上限 + 离屏剔除
✅ **状态机闭环**：无竞态，无卡死
✅ **重玩价值**：45 种通关组合 + 10 成就 + 回放

---

## 🔧 后续优化（20 轮之后）

### 1. 任务：清理残留文件 + 文档更新

| 日期 | 优化项 | 详情 |
|------|--------|------|
| 后续 | 清理残留 | 删除 `check_details.cjs`（20 轮盘点时的一次性脚本） |
| 后续 | 更新 README 徽章 | 代码行数 3700 → 3900，模块数 14 → 17 |
| 后续 | 更新 README 数据统计 | 同步代码量、模块数描述 |
| 后续 | 修复第 3 关敌机 | `kamikaze` 波次缺 `enemyType` 字段，7 处全部修复 |

### 2. 任务：game.js 拆分（架构优化）

| 优化项 | 详情 |
|--------|------|
| 抽取 `config.js` | 集中时序常量（LEVEL_CLEAR_DELAY / SHOP_PROTECT_INVUL / NEXT_LEVEL_DELAY）|
| 抽取 `gameInput.js` | 109 行，所有键盘事件处理 |
| 抽取 `gameLogic.js` | 217 行，update 中的游戏逻辑 |
| `game.js` 瘦身 | 937 行 → 706 行（-24%）|
| 调试输出 | 移除 replay.js 的 4 个 console.log |

### 当前真实数据

| 指标 | 数值 |
|------|------|
| JS 模块 | 17 |
| JS 代码行 | 3906 |
| 总行数（含 HTML/MD） | 4368 |
| 外部依赖 | 0 |
| Git 提交 | 0（未初始化）|
