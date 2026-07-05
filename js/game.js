// game.js - 主游戏类：状态机 + 生命周期
// 拆分说明：
//   - 输入处理：js/gameInput.js
//   - 游戏逻辑：js/gameLogic.js
//   - 绘制：    drawHUD/LevelIntro/GameOver/Victory 等保留在此（与状态强耦合）
//   - 核心循环：update (状态机分发) + draw (绘制调度)
class Game {
  constructor() {
    const C = window.Config;
    this.cvs = document.getElementById('game');
    this.ctx = this.cvs.getContext('2d');
    this.W = C.W; this.H = C.H;

    // === 状态机 ===
    this.state = 'menu'; // menu, selectShip, playing, paused, levelIntro, gameover, victory, levelClear
    this.stateT = 0;
    this.menuIndex = 0;
    this.selectedShip = null;

    // === 游戏对象池 ===
    this.player = null;
    this.enemies = [];
    this.enemyBullets = [];
    this.playerBullets = [];
    this.activeBombs = [];
    this.powerups = [];
    this.boss = null;
    this.bossDefeatedThisLevel = false;

    // === 关卡进度 ===
    this.levelIdx = 0;
    this.waveRunner = null;
    this.levelIntroT = 0;
    this.nextLevelCountdown = 0;  // Shop 关闭后到下一关的等待

    // === 持久化（localStorage）===
    this.highScore = this._safeReadHighScore();

    // === 关卡间时序常量（来自 Config，统一管理）===
    this.LEVEL_CLEAR_DELAY = C.LEVEL_CLEAR_DELAY;
    this.SHOP_PROTECT_INVUL = C.SHOP_PROTECT_INVUL;
    this.NEXT_LEVEL_DELAY = C.NEXT_LEVEL_DELAY;

    // === 初始化背景 ===
    Effects.initStars(this.W, this.H, 110);

    // === 初始化触屏 ===
    if (window.Touch) {
      Touch.init(this.cvs);
      if (Touch.isTouchDevice()) {
        const el = document.getElementById('hintKeys');
        if (el) el.textContent = '左下虚拟摇杆移动 · 右下 FIRE 射击 / BOMB 炸弹 · 右上 II 暂停';
      }
      window.addEventListener('resize', () => Touch.layoutButtons(this.cvs));
    }

    // === 初始化输入监听（由 gameInput.js 提供）===
    if (window.GameInput) GameInput.install(this);
  }

  // === 生命周期 ===

  startGame(ship) {
    Audio.resume();
    this.state = 'levelIntro';
    this.stateT = 0;
    this.levelIdx = 0;
    // ★ 防御：清空 powerups/bullets，避免上一局残留
    this.enemies = [];
    this.enemyBullets = [];
    this.playerBullets = [];
    this.activeBombs = [];
    this.powerups = [];
    this.boss = null;
    this.bossDefeatedThisLevel = false;
    // ★ 防御：Difficulty 模块加载失败时使用默认 NORMAL
    if (!window.Difficulty) {
      window.Difficulty = { get: () => ({
        hp: Config.PLAYER_BASE_HP, maxHp: Config.PLAYER_BASE_HP, bombs: Config.PLAYER_BASE_BOMBS,
        comboWindow: Config.PLAYER_COMBO_WINDOW, enemyHpMul: 1, enemyCountMul: 1,
        bossHpMul: 1, shakeMul: 1, scoreMul: 1
      })};
    }
    this.selectedShip = ship || (window.ShipSelect ? ShipSelect.ships[0] : null);
    this.player = new Player(this, this.selectedShip);
    if (window.Achievements) Achievements.resetStats();
    this.lastReplayData = null;
    if (window.Replay) Replay.startRecording();
    this.beginLevel();
  }

  beginLevel() {
    // ★ 越界防御
    if (!Levels.scripts || this.levelIdx < 0 || this.levelIdx >= Levels.scripts.length) {
      this.victory();
      return;
    }
    this.state = 'levelIntro';
    this.levelIntroT = 0;
    this.nextLevelCountdown = 0;
    this.enemies = [];
    this.enemyBullets = [];
    this.playerBullets = [];
    this.activeBombs = [];
    this.boss = null;
    this.bossDefeatedThisLevel = false;
    const script = Levels.scripts[this.levelIdx];
    if (!script) { this.victory(); return; }
    this.waveRunner = new Levels.WaveRunner(script, this.levelIdx, this);
    // ★ 设置关卡主题星云色
    if (window.Effects && script.nebula) {
      Effects.setNebulaTheme(script.nebula[0], script.nebula[1]);
    } else if (window.Effects) {
      Effects.setNebulaTheme('#1a1444', '#3a1a55');
    }
  }

  startWave() {
    this.state = 'playing';
    this.waveRunner.startNextWave();
  }

  spawnBoss() {
    this.boss = new Boss(this.W/2 - 65, -100, this.levelIdx + 1);
    Audio.bossWarn();
    if (window.Achievements) Achievements.onBossStart();
  }

  startPlayback() {
    if (!this.lastReplayData) return;
    if (window.Replay && Replay.startPlayback(this.lastReplayData)) {
      this.state = 'playing';
      this.stateT = 0;
      this.enemies = [];
      this.enemyBullets = [];
      this.playerBullets = [];
      this.powerups = [];
      this.boss = null;
      this.player = new Player(this);
    }
  }

  onEnemyKilled(e) {
    Effects.spawnExplosion(e.x + e.w/2, e.y + e.h/2, e.color, 14, 220);
    Effects.spawnShockwave(e.x + e.w/2, e.y + e.h/2, e.color, 60, 500);
    Audio.enemyHit();
    Effects.shake(2, 0.1);
    if (this.player) this.player.onKill(e);
    if (window.Achievements) Achievements.onKill(false);
  }

  gameOver() {
    this.state = 'gameover';
    this.stateT = 0;
    Audio.gameover();
    if (this.player && this.player.score > this.highScore) {
      this.highScore = this.player.score;
      this._safeWriteHighScore(this.highScore);
    }
    if (window.Replay && Replay.isRecording()) {
      this.lastReplayData = Replay.stopRecording();
    }
  }

  victory() {
    this.state = 'victory';
    this.stateT = 0;
    Audio.victory();
    if (this.player && this.player.score > this.highScore) {
      this.highScore = this.player.score;
      this._safeWriteHighScore(this.highScore);
    }
    if (window.Replay && Replay.isRecording()) {
      this.lastReplayData = Replay.stopRecording();
    }
  }

  // 安全 localStorage 读写
  _safeReadHighScore() {
    try {
      const v = localStorage.getItem('thunder_hi');
      const n = parseInt(v, 10);
      return (Number.isFinite(n) && n >= 0) ? n : 0;
    } catch (e) { return 0; }
  }
  _safeWriteHighScore(v) {
    try { localStorage.setItem('thunder_hi', v | 0); } catch (e) { /* 静默 */ }
  }

  // === 主循环：update（状态机分发）===

  update(dt) {
    this.stateT += dt;
    Effects.update(dt, this.W, this.H);
    Effects.updateTrails(dt);
    if (window.Achievements) Achievements.update(dt);

    // 回放：录制 / 回放
    if (window.Replay) {
      if (Replay.isRecording()) Replay.tickRecordFrame(this);
      if (Replay.isPlaying()) {
        Replay.tickPlayback(dt, this);
        if (this.player && this.player.alive) this.player.update(dt);
        return;  // 跳过游戏逻辑
      }
    }
    // 回放结束自动返回菜单
    if (window.Replay && !Replay.isPlaying() && !Replay.isRecording()
        && this.state === 'playing' && this.lastReplayData && this.stateT > 1) {
      this.state = 'menu';
      this.stateT = 0;
    }
    // 关卡间倒计时
    this._tickNextLevelCountdown(dt);
    // Shop 期间死亡检测
    if (window.Shop && Shop.isActive()) {
      if (this.player && this.player.lives < 0 && this.state !== 'gameover') {
        Shop.close();
        this.gameOver();
      }
      return;
    }
    // 战机选择冻结
    if (window.ShipSelect && ShipSelect.isActive()) return;
    // 菜单/帮助/选择冻结
    if (this.state === 'menu' || this.state === 'help' || this.state === 'selectShip') return;
    // 结束态冻结
    if (this.state === 'gameover' || this.state === 'victory' || this.state === 'paused') return;
    // 关卡介绍
    if (this.state === 'levelIntro') {
      this._tickLevelIntro(dt);
      return;
    }
    if (this.state !== 'playing' && this.state !== 'levelClear') return;
    // 委托给 gameLogic（避免 game.js update 函数过大）
    if (window.GameLogic) GameLogic.updateGameplay(this, dt);
  }

  _tickNextLevelCountdown(dt) {
    if (this.nextLevelCountdown > 0 && this.state === 'levelClear') {
      this.nextLevelCountdown -= dt;
      if (this.nextLevelCountdown <= 0) {
        if (this.player && this.player.alive && this.player.lives >= 0) {
          this.levelIdx++;
          if (!Levels.scripts || this.levelIdx >= Levels.scripts.length) {
            this.victory();
          } else {
            this.beginLevel();
          }
        }
      }
    }
  }

  _tickLevelIntro(dt) {
    this.levelIntroT += dt;
    if (this.levelIntroT > 3.0 && !this.waveRunner.waveStarted && this.waveRunner.waveIdx === 0) {
      this.startWave();
    }
  }

  // === 主循环：draw（绘制调度）===
  // draw 方法：与状态强耦合，保留在此（无明显拆分收益）
  draw() {
    const ctx = this.ctx;
    ctx.save();
    const shX = Effects.getShake();
    const shY = Effects.getShakeY();
    ctx.translate(shX, shY);
    this._drawBackground(ctx);
    this._drawGameScene(ctx);
    this._drawOverlays(ctx);
    this._drawModals(ctx);
    ctx.restore();
  }

  _drawBackground(ctx) {
    const bg = (Levels.scripts[this.levelIdx] && Levels.scripts[this.levelIdx].bg) || '#0a0a20';
    const grad = ctx.createLinearGradient(0, 0, 0, this.H);
    grad.addColorStop(0, bg);
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fillRect(-50, -50, this.W + 100, this.H + 100);
    if (window.Effects) Effects.drawNebulae(ctx);
    Effects.drawStars(ctx);
    if (window.Effects) Effects.drawMeteors(ctx);
  }

  _drawGameScene(ctx) {
    if (this.state === 'menu') { this.drawMenu(); return; }
    if (this.state === 'help') { this.drawHelp(); return; }
    if (this.state === 'selectShip') {
      this.drawMenu();
      if (window.ShipSelect) ShipSelect.draw(this.ctx, this.W, this.H, this.stateT);
      return;
    }
    // 游戏内场景
    Effects.drawTrails(ctx);
    for (const p of this.powerups) p.draw(ctx);
    for (const e of this.enemies) e.draw(ctx);
    if (this.boss) this.boss.draw(ctx);
    if (this.player && this.player.alive) this.player.draw(ctx);
    for (const b of this.enemyBullets) b.draw(ctx);
    for (const b of this.playerBullets) b.draw(ctx);
    for (const b of this.activeBombs) b.draw(ctx);
    Effects.drawShockwaves(ctx);
    Effects.drawParticles(ctx);
    Effects.drawFloats(ctx);
    this.drawHUD();
    if (this.state === 'levelIntro') this.drawLevelIntro();
    if (this.state === 'levelClear') this.drawLevelClear();
    if (this.state === 'paused') this.drawPaused();
    if (this.state === 'gameover') this.drawGameOver();
    if (this.state === 'victory') this.drawVictory();
  }

  _drawOverlays(ctx) {
    if (window.Shop && Shop.isActive()) {
      Shop.draw(this.ctx, this.W, this.H);
      if (this.nextLevelCountdown > 0) this.drawNextLevelCountdown();
    }
    if (window.Achievements) Achievements.drawNotifications(this.ctx, this.W);
    if (window.Touch && Touch.isVisible()) Touch.draw(this.ctx, this.cvs);
    if (window.Replay && Replay.isPlaying()) this.drawReplayBadge();
  }

  _drawModals(ctx) { /* 留作未来扩展 */ }

  // === 辅助绘制方法（与状态紧密相关，保留）===

  drawNextLevelCountdown() {
    const ctx = this.ctx;
    const cx = this.W / 2, cy = this.H - 100;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,20,0.85)';
    ctx.fillRect(cx - 130, cy - 24, 260, 48);
    ctx.strokeStyle = '#aaccff';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - 130, cy - 24, 260, 48);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#aaccff';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('下一关', cx, cy - 8);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px sans-serif';
    const sec = Math.ceil(this.nextLevelCountdown * 10) / 10;
    ctx.fillText(sec.toFixed(1) + 's', cx, cy + 12);
    ctx.restore();
  }

  drawReplayBadge() {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(255, 60, 60, 0.9)';
    ctx.fillRect(this.W/2 - 50, 56, 100, 24);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(this.W/2 - 50, 56, 100, 24);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('● REPLAY', this.W/2, 68);
    if (window.Replay && Replay.isPaused()) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, this.H/2 - 30, this.W, 60);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText('⏸  暂 停', this.W/2, this.H/2);
      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#aaa';
      ctx.fillText('按 Z 继续 · X 退出', this.W/2, this.H/2 + 24);
    }
    if (window.Replay) {
      const total = Replay.getPlaybackTotal();
      const cur = Replay.getPlaybackTick();
      if (total > 0) {
        const barW = 200, barH = 4;
        const barX = this.W/2 - barW/2, barY = 84;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = '#ff8888';
        ctx.fillRect(barX, barY, barW * (cur / total), barH);
      }
    }
    ctx.font = '11px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.textAlign = 'right';
    ctx.fillText('Z 暂停/继续 · X 退出', this.W - 10, this.H - 8);
    ctx.textAlign = 'left';
    ctx.restore();
  }

  drawHUD() {
    const ctx = this.ctx;
    if (!this.player) return;
    ctx.fillStyle = 'rgba(0,0,20,0.7)';
    ctx.fillRect(0, 0, this.W, 36);
    ctx.strokeStyle = '#4488ff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 36); ctx.lineTo(this.W, 36); ctx.stroke();
    ctx.fillStyle = '#ffdd66';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('SCORE ' + this.player.score.toString().padStart(8, '0'), 10, 18);
    // HP
    ctx.fillStyle = '#aaa';
    ctx.fillText('HP', 230, 18);
    for (let i = 0; i < this.player.maxHp; i++) {
      ctx.fillStyle = i < this.player.hp ? '#ff6688' : '#444';
      ctx.fillRect(230 + 28 + i * 16, 12, 12, 12);
    }
    // 炸弹
    ctx.fillStyle = '#aaa';
    ctx.fillText('B', 340, 18);
    for (let i = 0; i < this.player.maxBombs; i++) {
      ctx.fillStyle = i < this.player.bombs ? '#ffaa33' : '#444';
      ctx.beginPath();
      ctx.arc(355 + i * 14, 18, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    // 武器
    ctx.fillStyle = '#aaa';
    ctx.fillText('W', 440, 18);
    for (let i = 0; i < this.player.weaponMax; i++) {
      ctx.fillStyle = i < this.player.weaponLevel ? '#66ddff' : '#444';
      ctx.fillRect(455 + i * 14, 12, 10, 12);
    }
    // 关卡名
    const script = Levels.scripts[this.levelIdx];
    ctx.textAlign = 'right';
    ctx.fillStyle = '#aaffff';
    if (script) ctx.fillText(script.name, this.W - 10, 18);
    // 难度
    if (window.Difficulty) {
      const d = Difficulty.get();
      const dc = d.id === 'EASY' ? '#88ff88' : (d.id === 'HARD' ? '#ff6688' : '#ffee66');
      ctx.fillStyle = dc;
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(d.name, this.W - 10, 44);
    }
    if (this.waveRunner && this.state !== 'levelIntro' && this.state !== 'levelClear') {
      ctx.fillStyle = '#aaaaff';
      ctx.font = '12px sans-serif';
      const wtxt = this.boss ? 'BOSS' : ('WAVE ' + Math.min(this.waveRunner.waveIdx, this.waveRunner.totalWaves) + '/' + this.waveRunner.totalWaves);
      ctx.fillText(wtxt, this.W - 10, 32);
    }
    // 连击
    if (this.player.combo >= 2) {
      const c = this.player.combo;
      const mult = Math.min(2, 1 + c * 0.1);
      const color = c >= 10 ? '#ff44aa' : (c >= 5 ? '#ffaa44' : '#ffee66');
      const size = 16 + Math.min(c, 20);
      ctx.save();
      ctx.textAlign = 'center';
      ctx.font = 'bold ' + size + 'px sans-serif';
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillText(c + 'x COMBO', this.W/2 + 1, 22);
      ctx.fillStyle = color;
      ctx.fillText(c + 'x COMBO', this.W/2, 21);
      const barW = 100, barH = 4;
      const barX = this.W/2 - barW/2, barY = 26;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = color;
      ctx.fillRect(barX, barY, barW * Math.min(1, this.player.comboT / this.player.comboWindow), barH);
      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#fff';
      ctx.fillText('x' + mult.toFixed(1), this.W/2, 38);
      ctx.restore();
    }
    // 底部提示
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '11px sans-serif';
    ctx.fillText('Z 射击 · X 炸弹 · P 暂停 · M 静音', 10, this.H - 8);
    if (Audio.muted) {
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ff8888';
      ctx.fillText('静音', this.W - 10, this.H - 8);
    }
    if (this.player.shieldT > 0) {
      ctx.fillStyle = 'rgba(80,200,255,0.7)';
      ctx.fillRect(0, this.H - 4, this.W * Math.min(1, this.player.shieldT / 6), 3);
    }
  }

  drawLevelIntro() {
    const ctx = this.ctx;
    const script = Levels.scripts[this.levelIdx];
    if (!script) return;
    ctx.fillStyle = 'rgba(0,0,20,0.6)';
    ctx.fillRect(0, this.H/2 - 80, this.W, 160);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffee88';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('第 ' + (this.levelIdx + 1) + ' 关', this.W/2, this.H/2 - 30);
    ctx.fillStyle = '#aaffff';
    ctx.font = '22px sans-serif';
    ctx.fillText(script.name, this.W/2, this.H/2 + 4);
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px sans-serif';
    ctx.fillText('波次 ' + script.waves.length + ' + BOSS · 击落全部敌机后进入BOSS战', this.W/2, this.H/2 + 36);
    if (script.bossLabel) {
      ctx.fillStyle = '#ff6688';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('BOSS: ' + script.bossLabel, this.W/2, this.H/2 + 60);
    }
  }

  drawLevelClear() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,20,40,0.6)';
    ctx.fillRect(0, this.H/2 - 60, this.W, 120);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#aaffff';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText('关卡完成！', this.W/2, this.H/2 - 10);
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('正在进入下一关...', this.W/2, this.H/2 + 24);
  }

  drawPaused() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,20,0.7)';
    ctx.fillRect(0, 0, this.W, this.H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 40px sans-serif';
    ctx.fillText('PAUSED', this.W/2, this.H/2 - 10);
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#aaa';
    ctx.fillText('按 P 或 Z 继续', this.W/2, this.H/2 + 20);
  }

  drawGameOver() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,20,0.85)';
    ctx.fillRect(0, 0, this.W, this.H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff4466';
    ctx.font = 'bold 48px sans-serif';
    ctx.fillText('GAME OVER', this.W/2, this.H/2 - 60);
    ctx.fillStyle = '#fff';
    ctx.font = '18px sans-serif';
    ctx.fillText('分数: ' + (this.player ? this.player.score : 0), this.W/2, this.H/2 - 10);
    ctx.fillStyle = '#ffdd66';
    ctx.fillText('最高分: ' + this.highScore, this.W/2, this.H/2 + 20);
    if (this.player && this.player.comboMax >= 3) {
      ctx.fillStyle = '#ff44aa';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('最大连击: ' + this.player.comboMax + 'x', this.W/2, this.H/2 + 50);
    }
    if (this.lastReplayData) {
      ctx.fillStyle = '#88ccff';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('按 R 观看回放', this.W/2, this.H/2 + 78);
    }
    ctx.fillStyle = '#aaa';
    ctx.font = '14px sans-serif';
    ctx.fillText('按 Z 返回菜单', this.W/2, this.H/2 + 105);
  }

  drawVictory() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,10,30,0.85)';
    ctx.fillRect(0, 0, this.W, this.H);
    ctx.textAlign = 'center';
    const c = `hsl(${(this.stateT * 60) % 360},80%,60%)`;
    ctx.fillStyle = c;
    ctx.font = 'bold 48px sans-serif';
    ctx.fillText('VICTORY!', this.W/2, this.H/2 - 60);
    ctx.fillStyle = '#fff';
    ctx.font = '18px sans-serif';
    ctx.fillText('最终分数: ' + (this.player ? this.player.score : 0), this.W/2, this.H/2 - 10);
    ctx.fillStyle = '#ffdd66';
    ctx.fillText('最高分: ' + this.highScore, this.W/2, this.H/2 + 20);
    if (this.player && this.player.comboMax >= 3) {
      ctx.fillStyle = '#ff44aa';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('最大连击: ' + this.player.comboMax + 'x', this.W/2, this.H/2 + 50);
    }
    if (this.lastReplayData) {
      ctx.fillStyle = '#88ccff';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('按 R 观看通关回放', this.W/2, this.H/2 + 78);
    }
    ctx.fillStyle = '#aaa';
    ctx.font = '14px sans-serif';
    ctx.fillText('按 Z 返回菜单', this.W/2, this.H/2 + 105);
  }

  drawMenu() {
    const ctx = this.ctx;
    const t = this.stateT;
    const y = 220;
    ctx.textAlign = 'center';
    ctx.save();
    ctx.shadowColor = '#3399ff';
    ctx.shadowBlur = 30;
    ctx.fillStyle = `hsl(${(t*40)%360},80%,65%)`;
    ctx.font = 'bold 56px sans-serif';
    ctx.fillText('雷霆战机', this.W/2, y);
    ctx.restore();
    ctx.fillStyle = '#aaccff';
    ctx.font = '16px sans-serif';
    ctx.fillText('THUNDER FIGHTER', this.W/2, y + 30);
    const hasReplay = !!this.lastReplayData;
    const items = hasReplay
      ? ['开始游戏', '难度', '回放', '操作说明']
      : ['开始游戏', '难度', '操作说明'];
    for (let i = 0; i < items.length; i++) {
      const iy = 360 + i * 50;
      if (i === this.menuIndex) {
        ctx.fillStyle = 'rgba(80,160,255,0.2)';
        ctx.fillRect(this.W/2 - 140, iy - 22, 280, 36);
      }
      if (i === this.menuIndex) {
        ctx.fillStyle = '#ffee66';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText('▶ ' + items[i] + ' ◀', this.W/2 - 60, iy);
      } else {
        ctx.fillStyle = '#888';
        ctx.font = '20px sans-serif';
        ctx.fillText(items[i], this.W/2 - 60, iy);
      }
      if (i === 1 && window.Difficulty) {
        const diff = Difficulty.get();
        const color = diff.id === 'EASY' ? '#88ff88' : (diff.id === 'HARD' ? '#ff6688' : '#ffee66');
        ctx.fillStyle = color;
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'right';
        if (this.menuIndex === 1) {
          ctx.fillText('< ' + diff.name + ' >', this.W/2 + 90, iy);
        } else {
          ctx.fillText(diff.name, this.W/2 + 90, iy);
        }
        ctx.textAlign = 'center';
      }
    }
    ctx.fillStyle = '#ffaa55';
    ctx.font = '14px sans-serif';
    ctx.fillText('最高分: ' + this.highScore, this.W/2, 600);
    ctx.fillStyle = '#666';
    ctx.font = '12px sans-serif';
    ctx.fillText('按 Z 确认 / 方向键 选择 / 难度项可左右切换 / M 静音', this.W/2, 640);
  }

  drawHelp() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,20,0.9)';
    ctx.fillRect(0, 0, this.W, this.H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffee88';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText('操作说明', this.W/2, 100);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    const lines = [
      '方向键 / WASD  —  移动战机',
      'Z 键  —  射击（按住连发）',
      'X 键  —  使用炸弹（清屏+大伤害）',
      'P 键  —  暂停 / 继续',
      'M 键  —  切换静音',
      '',
      '★ 道具说明：',
      '  P = 武器升级（最高4级）',
      '  B = 炸弹数量+1',
      '  H = 生命值+2',
      '  S = 护盾（抵挡1次攻击）',
      '',
      '★ 流程：5大关，每关5波敌人 + BOSS',
      '★ 提示：贴近敌机但注意炸弹！',
    ];
    for (let i = 0; i < lines.length; i++) {
      ctx.fillStyle = lines[i].startsWith('★') ? '#ffdd66' : '#ccc';
      ctx.fillText(lines[i], 60, 160 + i * 28);
    }
    ctx.textAlign = 'center';
    ctx.fillStyle = '#aaa';
    ctx.fillText('按 Z 返回', this.W/2, this.H - 30);
  }

  loop() {
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      this.update(dt);
      this.draw();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
}

window.addEventListener('load', () => {
  const game = new Game();
  window.__game = game;
  game.loop();
});
