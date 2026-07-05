// player.js - 玩家战机
class Player {
  constructor(game, ship) {
    this.game = game;
    this.w = 32; this.h = 38;
    this.x = game.W / 2 - this.w / 2;
    this.y = game.H - 100;
    // 应用难度参数
    const diff = (window.Difficulty ? window.Difficulty.get() : null) || { hp: 5, maxHp: 5, bombs: 3, comboWindow: 1.5 };
    // 应用战机参数（覆盖难度默认值）
    if (ship) {
      if (ship.speed != null) this.speed = ship.speed;
      if (ship.hp != null) { this.hp = ship.hp; this.maxHp = ship.maxHp || ship.hp; }
      if (ship.initialWeapon != null) this.weaponLevel = ship.initialWeapon;
      this.color = ship.color;
      this.accent = ship.accent || ship.color;
      this.shipId = ship.id;
    } else {
      this.speed = 320;
    }
    if (this.speed == null) this.speed = 320;
    // HP 默认值（ship 提供则跳过）
    if (this.hp == null) this.hp = diff.hp;
    if (this.maxHp == null) this.maxHp = diff.maxHp;
    this.lives = 3;
    this.weaponLevel = this.weaponLevel || 1;  // 1-4
    this.weaponMax = 4;
    this.bombs = diff.bombs; this.maxBombs = 5;
    if (ship && ship.startShield) this.shieldT = ship.startShield;  // 金星战机起步护盾
    this.score = 0;
    this.shieldT = this.shieldT || 0;         // 护盾剩余时间
    this.invulT = 0;          // 无敌时间
    this.fireT = 0;
    this.fireRate = 0.12;
    this.shootSubT = 0;
    this.altFireT = 0;        // 等级3+激光
    this.alive = true;
    this.t = 0;
    this.anim = 0;            // 抖动动画
    this.engineT = 0;
    this.bombReady = true;
    // 连击系统
    this.combo = 0;           // 当前连击数
    this.comboT = 0;          // 连击剩余时间（s）
    this.comboMax = 0;        // 本局最大连击（统计用）
    this.comboWindow = diff.comboWindow;   // 连击窗口
  }
  update(dt) {
    this.t += dt;
    if (this.invulT > 0) this.invulT -= dt;
    if (this.shieldT > 0) this.shieldT -= dt;
    this.fireT -= dt;
    this.shootSubT -= dt;
    this.altFireT -= dt;
    this.engineT += dt;
    // 连击计时衰减
    if (this.combo > 0) {
      this.comboT -= dt;
      if (this.comboT <= 0) this.combo = 0;
    }

    // 过场状态：忽略输入，保留视觉尾迹
    const inputLocked = !this.alive || this.game.state === 'levelClear' || this.game.state === 'levelIntro';

    // 移动
    let dx = 0, dy = 0;
    const k = Utils.keys;
    if (!inputLocked) {
      if (k['ArrowLeft'] || k['a'] || k['A']) dx -= 1;
      if (k['ArrowRight'] || k['d'] || k['D']) dx += 1;
      if (k['ArrowUp'] || k['w'] || k['W']) dy -= 1;
      if (k['ArrowDown'] || k['s'] || k['S']) dy += 1;
      if (dx !== 0 && dy !== 0) { const inv = 1 / Math.sqrt(2); dx *= inv; dy *= inv; }
      this.x += dx * this.speed * dt;
      this.y += dy * this.speed * dt;
      this.x = Utils.clamp(this.x, 0, this.game.W - this.w);
      this.y = Utils.clamp(this.y, 0, this.game.H - this.h);
    }

    // 射击
    const shooting = k['z'] || k['Z'] || k[' '];
    if (!inputLocked && shooting && this.fireT <= 0) {
      this.shoot();
      this.fireT = this.fireRate;
    }
    if (!inputLocked && this.weaponLevel >= 3 && shooting && this.altFireT <= 0) {
      this.shootLaser();
      this.altFireT = 0.25;
    }
    if (!inputLocked && this.weaponLevel >= 4 && shooting) {
      // 持续释放导弹
      if (this.shootSubT <= 0) {
        this.shootMissile();
        this.shootSubT = 0.4;
      }
    }

    // 引擎尾迹（始终绘制，视觉连续）—— 与机身左右引擎尖端对齐
    Effects.trail('pl', this.x + 11, this.y + this.h, 0.3, '#ffcc55', 4);
    Effects.trail('pr', this.x + this.w - 11, this.y + this.h, 0.3, '#ffcc55', 4);
  }
  shoot() {
    const cx = this.x + this.w / 2, cy = this.y;
    Audio.shoot();
    if (this.weaponLevel === 1) {
      this.game.playerBullets.push(new Bullet(cx, cy, 0, -560, { friendly: true, r: 5, color: '#66ddff', dmg: 1 }));
    } else if (this.weaponLevel === 2) {
      this.game.playerBullets.push(new Bullet(cx - 8, cy, 0, -560, { friendly: true, r: 5, color: '#66ddff', dmg: 1 }));
      this.game.playerBullets.push(new Bullet(cx + 8, cy, 0, -560, { friendly: true, r: 5, color: '#66ddff', dmg: 1 }));
    } else if (this.weaponLevel === 3) {
      this.game.playerBullets.push(new Bullet(cx - 10, cy, 0, -560, { friendly: true, r: 5, color: '#88ffff', dmg: 1 }));
      this.game.playerBullets.push(new Bullet(cx + 10, cy, 0, -560, { friendly: true, r: 5, color: '#88ffff', dmg: 1 }));
      this.game.playerBullets.push(new Bullet(cx, cy, 0, -620, { friendly: true, r: 4, color: '#aaffff', dmg: 1 }));
    } else if (this.weaponLevel >= 4) {
      this.game.playerBullets.push(new Bullet(cx - 12, cy, 0, -620, { friendly: true, r: 6, color: '#88ffff', dmg: 2 }));
      this.game.playerBullets.push(new Bullet(cx + 12, cy, 0, -620, { friendly: true, r: 6, color: '#88ffff', dmg: 2 }));
      this.game.playerBullets.push(new Bullet(cx, cy, 0, -680, { friendly: true, r: 5, color: '#ffeeff', dmg: 1 }));
      this.game.playerBullets.push(new Bullet(cx - 6, cy + 4, 0, -600, { friendly: true, r: 4, color: '#aaffff', dmg: 1 }));
      this.game.playerBullets.push(new Bullet(cx + 6, cy + 4, 0, -600, { friendly: true, r: 4, color: '#aaffff', dmg: 1 }));
    }
  }
  shootLaser() {
    const cx = this.x + this.w / 2, cy = this.y;
    Audio.shootL();
    this.game.playerBullets.push(new Bullet(cx - 14, cy, 0, -700, { friendly: true, kind: 'laser', color: '#88ffff', dmg: 2, life: 1.2 }));
    this.game.playerBullets.push(new Bullet(cx + 14, cy, 0, -700, { friendly: true, kind: 'laser', color: '#88ffff', dmg: 2, life: 1.2 }));
  }
  shootMissile() {
    const cx = this.x + this.w / 2, cy = this.y;
    Audio.shootL();
    // 找目标
    const target = this.findNearestEnemy();
    this.game.playerBullets.push(new Bullet(cx - 18, cy, 0, -200, { friendly: true, kind: 'missile', color: '#ffdd44', dmg: 3, turnRate: 6, target, life: 2.5 }));
    this.game.playerBullets.push(new Bullet(cx + 18, cy, 0, -200, { friendly: true, kind: 'missile', color: '#ffdd44', dmg: 3, turnRate: 6, target, life: 2.5 }));
  }
  findNearestEnemy() {
    let best = null, bd = Infinity;
    for (const e of this.game.enemies) {
      if (!e.alive) continue;
      const d = Utils.dist(this.x, this.y, e.x, e.y);
      if (d < bd) { bd = d; best = e; }
    }
    if (best) return best;
    if (this.game.boss && this.game.boss.alive) return this.game.boss;
    return null;
  }
  useBomb() {
    // 守卫：死亡期间不能放炸弹（respawn 600ms 窗口 + 复活前瞬时），避免死后瞬间消耗资源
    if (!this.alive) return false;
    // ★ 边界（0 炸弹）反馈：玩家按 X 时若无炸弹，原来静默 return 会让人误以为按键失灵。
    // 改为播放 hit 音效 + 浮动文字"无炸弹"，给玩家明确反馈。
    if (this.bombs <= 0) {
      Audio.hit();
      Effects.floatText(this.x + this.w/2, this.y - 20, '无炸弹', '#888');
      return false;
    }
    this.bombs--;
    Audio.bomb();
    Effects.shake(10, 0.5);
    // 清屏：消灭屏幕上所有敌弹
    let cleared = 0;
    for (const b of this.game.enemyBullets) {
      if (b.alive) { b.alive = false; cleared++; }
    }
    // 视觉/特效
    this.game.activeBombs.push(new Bomb(this.x + this.w/2, this.y, 999));
    Effects.spawnShockwave(this.x + this.w/2, this.y, '#ffffaa', 800, 1400);
    if (cleared > 0) {
      Effects.floatText(this.x + this.w/2, this.y - 30, '清屏! -' + cleared, '#aaffff');
    }
    // 大范围伤害
    for (const e of this.game.enemies) {
      if (e.alive && Utils.dist(this.x, this.y, e.x + e.w/2, e.y + e.h/2) < 200) {
        e.hit(20);
        if (!e.alive) this.onKill(e);
      }
    }
    if (this.game.boss && this.game.boss.alive && Utils.dist(this.x, this.y, this.game.boss.x, this.game.boss.y) < 250) {
      this.game.boss.hit(30);
    }
    return true;
  }
  takeHit() {
    if (this.invulT > 0 || !this.alive) return;
    if (this.shieldT > 0) {
      // 护盾抵挡
      Effects.spawnShockwave(this.x + this.w/2, this.y + this.h/2, '#55ddff', 80, 600);
      this.shieldT = 0;
      this.invulT = 0.6;
      Audio.hit();
      return;
    }
    this.hp--;
    Audio.hit();
    Effects.spawnExplosion(this.x + this.w/2, this.y + this.h/2, '#ffaa44', 14, 180);
    Effects.shake(6, 0.3);
    if (this.hp <= 0) {
      this.die();
    } else {
      this.invulT = 1.5;
    }
  }
  die() {
    this.alive = false;
    this.combo = 0;   // 死亡中断连击
    Effects.spawnExplosion(this.x + this.w/2, this.y + this.h/2, '#ffaa44', 40, 280);
    Audio.explosion();
    Effects.shake(12, 0.6);
    this.lives--;
    // ★ 防御：lives <= 0 立即 gameOver，不再 setTimeout 重生
    // 之前的逻辑 lives=0 时 600ms 后重生，但与 levelClear/Shop 状态机冲突
    if (this.lives < 0) {
      this.game.gameOver();
    } else if (this.game.state === 'levelClear' || this.game.state === 'levelIntro'
               || this.game.state === 'gameover' || this.game.state === 'victory'
               || this.game.state === 'menu' || this.game.state === 'help') {
      // 在过场/结束状态下，不再重生（让 gameOver 接管）
      this.game.gameOver();
    } else {
      // 正常游戏：重生
      setTimeout(() => this.respawn(), 600);
    }
  }
  respawn() {
    // 状态守卫：若死亡后 600ms 内游戏已结束/返回菜单/玩家对象被替换，
    // 则不复活。避免在 gameover 画面下复活一个 "alive=true" 的玩家造成
    // 视觉/逻辑不一致。
    if (!this.alive && this.lives >= 0 && this.game.player === this
        && this.game.state !== 'gameover' && this.game.state !== 'victory'
        && this.game.state !== 'menu' && this.game.state !== 'help'
        && this.game.state !== 'levelClear' && this.game.state !== 'levelIntro') {
      this.x = this.game.W / 2 - this.w / 2;
      this.y = this.game.H - 100;
      this.hp = Math.max(3, this.maxHp - 1);
      this.invulT = 2.0;
      this.shieldT = 1.5;
      // 武器等级不降级：死亡惩罚已由 lives-- 和 maxHp 永久降低体现
      this.alive = true;
    }
  }
  onKill(enemy) {
    const base = enemy.score || 10;
    // 连击加分：1 + combo*0.1, 上限 2x
    this.combo++;
    this.comboT = this.comboWindow;
    if (this.combo > this.comboMax) this.comboMax = this.combo;
    const mult = Math.min(2, 1 + this.combo * 0.1);
    const pts = Math.floor(base * mult);
    this.score += pts;
    // 浮动文字：连击 ≥3 显示 COMBO
    const txt = this.combo >= 3
      ? '+' + pts + '  ' + this.combo + 'x COMBO!'
      : '+' + pts;
    const color = this.combo >= 10 ? '#ff44aa' : (this.combo >= 5 ? '#ffaa44' : '#ffdd66');
    Effects.floatText(enemy.x + enemy.w/2, enemy.y, txt, color);
    // 高连击微震
    if (this.combo === 10 || this.combo === 25 || this.combo === 50) {
      Effects.shake(4 + this.combo / 10, 0.2);
    }
    // 掉落道具
    if (Math.random() < 0.18) {
      const r = Math.random();
      let kind = 'weapon';
      if (r < 0.5) kind = 'weapon';
      else if (r < 0.72) kind = 'bomb';
      else if (r < 0.88) kind = 'heal';
      else kind = 'shield';
      this.game.powerups.push(new PowerUp(enemy.x + enemy.w/2 - 11, enemy.y + enemy.h/2 - 11, kind, this.game.H));
    }
    // 成就：连击 + 分数
    if (window.Achievements) {
      Achievements.onCombo(this.combo);
      Achievements.onScore(this.score);
    }
  }
  applyPowerUp(kind) {
    Audio.powerup();
    if (kind === 'weapon') {
      // ★ 边界：武器已满级时不再"升级"，且显示"已满级"文案，避免误导玩家
      if (this.weaponLevel >= this.weaponMax) {
        Effects.floatText(this.x + this.w/2, this.y, '武器已满级', '#aaa');
        return;
      }
      this.weaponLevel++;
      Effects.floatText(this.x + this.w/2, this.y, '武器升级！', '#ffdd33');
    } else if (kind === 'bomb') {
      this.bombs = Math.min(this.maxBombs, this.bombs + 1);
      Effects.floatText(this.x + this.w/2, this.y, '炸弹+1', '#ff7755');
    } else if (kind === 'heal') {
      this.hp = Math.min(this.maxHp, this.hp + 2);
      Effects.floatText(this.x + this.w/2, this.y, 'HP+2', '#88ff88');
    } else if (kind === 'shield') {
      this.shieldT = 6;
      Effects.floatText(this.x + this.w/2, this.y, '护盾！', '#88ddff');
    }
  }
  draw(ctx) {
    if (!this.alive) return;
    const blink = this.invulT > 0 && Math.floor(this.t * 20) % 2 === 0;
    if (blink) ctx.globalAlpha = 0.4;
    // 引擎尾焰
    const flicker = 0.8 + Math.sin(this.engineT * 30) * 0.2;
    ctx.save();
    ctx.fillStyle = `rgba(255,180,80,${0.7 * flicker})`;
    ctx.beginPath();
    ctx.moveTo(this.x + 8, this.y + this.h);
    ctx.lineTo(this.x + 14, this.y + this.h);
    ctx.lineTo(this.x + 11, this.y + this.h + 10 + flicker * 6);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(this.x + this.w - 8, this.y + this.h);
    ctx.lineTo(this.x + this.w - 14, this.y + this.h);
    ctx.lineTo(this.x + this.w - 11, this.y + this.h + 10 + flicker * 6);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    // 主体
    ctx.save();
    ctx.translate(this.x + this.w/2, this.y + this.h/2);
    ctx.fillStyle = this.color || '#3399ff';
    ctx.strokeStyle = '#001';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = this.accent || '#66ddff';
    ctx.shadowBlur = 12;
    // 机身
    ctx.beginPath();
    ctx.moveTo(0, -this.h/2);
    ctx.lineTo(-this.w/2, this.h/3);
    ctx.lineTo(-this.w/3, this.h/2);
    ctx.lineTo(this.w/3, this.h/2);
    ctx.lineTo(this.w/2, this.h/3);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    // 驾驶舱
    ctx.fillStyle = this.accent || '#aaffff';
    ctx.beginPath();
    ctx.ellipse(0, -2, 6, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    // 翼尖
    ctx.fillStyle = this.color || '#1166cc';
    ctx.fillRect(-this.w/2 - 4, this.h/3 - 6, 4, 12);
    ctx.fillRect(this.w/2, this.h/3 - 6, 4, 12);
    ctx.restore();
    // 护盾
    if (this.shieldT > 0) {
      ctx.save();
      ctx.strokeStyle = `rgba(80,200,255,${0.5 + 0.3 * Math.sin(this.t * 10)})`;
      ctx.lineWidth = 3;
      ctx.shadowColor = '#55ddff';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(this.x + this.w/2, this.y + this.h/2, 32, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
}
