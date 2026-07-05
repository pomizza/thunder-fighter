// enemies.js - 敌机与 Boss
class Enemy {
  constructor(x, y, type) {
    this.x = x; this.y = y; this.type = type;
    this.alive = true; this.t = 0; this.flashT = 0;
    this.vx = 0; this.vy = 0;
    this.angle = 0;
    this.fireT = 0; this.fireRate = 1.0;
    this.score = 10;
    this.pattern = 'straight';
    this.targetX = x; this.targetY = y;
    this.startX = x; this.startY = y;
    this.entered = false;
    this.homingT = 0;

    // 从 Config 读取敌机基础数据（5 类 + 默认）
    const cfg = (window.Config && window.Config.ENEMY_TYPES[type]) || null;
    const defaultCfg = (window.Config && window.Config.ENEMY_DEFAULT) || {
      w: 24, h: 26, hp: 1, vy: 100, color: '#ffffff',
      fireRate: 1.0, score: 30, pattern: 'straight',
    };
    const src = cfg || defaultCfg;
    this.w = src.w; this.h = src.h;
    this.hp = src.hp; this.maxHp = src.hp;
    this.vy = src.vy; this.color = src.color;
    this.fireRate = src.fireRate; this.score = src.score;
    this.pattern = src.pattern;
    // 类型特定字段
    if (src.aimed) this.aimed = true;
    if (src.tankTop !== undefined) { this.tankDir = 1; this.tankTop = src.tankTop; }
  }
  update(dt, game) {
    this.t += dt;
    if (this.flashT > 0) this.flashT -= dt;
    this.fireT -= dt;

    // 移动模式
    switch (this.pattern) {
      case 'down_then_sine': {
        // 从 Config 读取（避免魔数）
        const ds = (window.Config && window.Config.ENEMY_PATTERNS) || {};
        const entryY = ds.down_then_sine_threshold_y || 80;
        const entryVy = ds.down_then_sine_entry_vy || 130;
        const oscillVy = ds.down_then_sine_oscillation_vy || 80;
        const oscillAmp = ds.down_then_sine_oscillation_amp || 90;
        const oscillSpd = ds.down_then_sine_oscillation_speed || 2;
        if (this.y < entryY) { this.vy = entryVy; this.vx = 0; }
        else { this.vy = oscillVy; this.vx = Math.sin(this.t * oscillSpd) * oscillAmp; }
        break;
      }
      case 'aimed_shoot': {
        if (this.y < 100) { this.vy = 100; this.vx = 0; }
        else { this.vy = 30; this.vx = Math.sin(this.t * 1.2) * 60; }
        break;
      }
      case 'tank': {
        if (this.y < this.tankTop) { this.vy = 60; this.vx = 0; }
        else {
          this.vy = 0;
          this.vx = this.tankDir * 80;
          if (this.x < 40 || this.x > game.W - 40 - this.w) this.tankDir *= -1;
        }
        break;
      }
      case 'sweep': {
        if (this.y < 100) { this.vy = 80; this.vx = 0; }
        else { this.vy = 0; this.vx = 90; if (this.x > game.W - this.w) this.vx = -90; if (this.x < 0) this.vx = 90; }
        break;
      }
      case 'homing_kamikaze': {
        // 神风机：两阶段
        // 阶段 1（入轨）：从屏幕顶部缓慢飘下，给玩家反应时间
        // 阶段 2（攻击）：进入屏幕后锁定玩家全速冲撞
        if (this.y < 100) {
          // 入轨：低速直下 + 轻微左右漂移
          this.vy = 90;
          this.vx = Math.sin(this.t * 3) * 50;
        } else {
          // 攻击：锁定玩家，全速冲锋
          // ★ 防御：kamikaze 语义是"自杀式冲撞"，必须始终向下飞。
          // 原代码直接用 sin(angle)*sp，当玩家在神风机上方（屏幕顶部）
          // 时 vy 为负，神风机反向飞出屏幕，违反攻击语义。
          // Math.max(0, ...) 强制 vy>=0，确保神风机一直朝下。
          const a = Utils.angleTo(this.x, this.y, game.player.x, game.player.y);
          const sp = 220;
          this.vx = Math.cos(a) * sp;
          this.vy = Math.max(0, Math.sin(a) * sp);
        }
        break;
      }
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // 出屏
    if (this.x < -60 || this.x > game.W + 60 || this.y > game.H + 60) this.alive = false;

    // 射击
    // ★ 守卫：非 playing 状态（levelClear / 即将进入 Shop 等）禁止开火，
    // 否则敌弹会在 Shop 期间继续累积，与"清屏后切关"的语义冲突。
    if (game.state === 'playing' && this.fireT <= 0 && this.fireRate > 0 && this.y > 20 && this.y < game.H - 40) {
      this.fire(game);
      this.fireT = this.fireRate * (0.7 + Math.random() * 0.6);
    }
  }
  fire(game) {
    const cx = this.x + this.w / 2, cy = this.y + this.h;
    if (this.type === 'fighter' || this.type === 'tank') {
      // 瞄准射击
      const a = Utils.angleTo(cx, cy, game.player.x, game.player.y);
      const sp = 280;
      for (let s of [-1, 1]) {
        const ang = a + s * 0.08;
        game.enemyBullets.push(new Bullet(cx, cy, Math.cos(ang) * sp, Math.sin(ang) * sp, { friendly: false, r: 5, color: '#ffaa55', dmg: 1, life: 3 }));
      }
    } else if (this.type === 'sweeper') {
      // 扇形
      const a = Math.PI / 2;
      for (let i = -2; i <= 2; i++) {
        const ang = a + i * 0.18;
        game.enemyBullets.push(new Bullet(cx, cy, Math.cos(ang) * 220, Math.sin(ang) * 220, { friendly: false, r: 4, color: '#88ff99', dmg: 1, life: 3 }));
      }
    } else if (this.type === 'scout') {
      // 单发
      const a = Utils.angleTo(cx, cy, game.player.x, game.player.y);
      const sp = 240;
      game.enemyBullets.push(new Bullet(cx, cy, Math.cos(a) * sp, Math.sin(a) * sp, { friendly: false, r: 4, color: '#ff8866', dmg: 1, life: 3 }));
    }
  }
  hit(dmg) {
    this.hp -= dmg;
    this.flashT = 0.08;
    if (this.hp <= 0) this.alive = false;
  }
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x + this.w / 2, this.y + this.h / 2);
    // 翻转朝向（朝下时不变）
    const flash = this.flashT > 0;
    if (flash) { ctx.shadowColor = '#fff'; ctx.shadowBlur = 16; }
    // 主体形状（更精致的几何外形）
    const w = this.w, h = this.h;
    ctx.fillStyle = flash ? '#fff' : this.color;
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 1;
    if (this.type === 'scout') {
      // 锐角三角
      ctx.beginPath();
      ctx.moveTo(0, h/2);
      ctx.lineTo(-w/2, -h/2);
      ctx.lineTo(0, -h/3);
      ctx.lineTo(w/2, -h/2);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (this.type === 'fighter') {
      // 菱形
      ctx.beginPath();
      ctx.moveTo(0, h/2);
      ctx.lineTo(-w/2, 0);
      ctx.lineTo(-w/4, -h/2);
      ctx.lineTo(w/4, -h/2);
      ctx.lineTo(w/2, 0);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      // 炮台
      ctx.fillStyle = '#fff7';
      ctx.fillRect(-3, h/2 - 2, 6, 5);
    } else if (this.type === 'tank') {
      // 六角形
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3 + Math.PI / 6;
        const x = Math.cos(a) * w/2, y = Math.sin(a) * h/2;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath(); ctx.arc(0,0,w*0.2,0,Math.PI*2); ctx.fill();
    } else if (this.type === 'sweeper') {
      // 燕形
      ctx.beginPath();
      ctx.moveTo(0, h/2);
      ctx.lineTo(-w/2, -h/4);
      ctx.lineTo(-w/4, -h/2);
      ctx.lineTo(w/4, -h/2);
      ctx.lineTo(w/2, -h/4);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (this.type === 'kamikaze') {
      // 圆点+翼
      ctx.beginPath(); ctx.arc(0,0,w*0.35,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = '#ffcc44';
      ctx.beginPath();
      ctx.moveTo(-w/2, 0); ctx.lineTo(0, h/2); ctx.lineTo(w/2, 0);
      ctx.closePath(); ctx.fill();
    }
    // HP 条（坦克/Boss除外）
    if (this.hp < this.maxHp) {
      ctx.fillStyle = '#400';
      ctx.fillRect(-w/2, -h/2 - 6, w, 3);
      ctx.fillStyle = '#0f0';
      ctx.fillRect(-w/2, -h/2 - 6, w * (this.hp / this.maxHp), 3);
    }
    ctx.restore();
  }
}

class Boss {
  constructor(x, y, level) {
    this.x = x; this.y = y; this.w = 130; this.h = 100;
    // 应用难度缩放
    const diff = (window.Difficulty ? window.Difficulty.get() : null) || { bossHpMul: 1, scoreMul: 1 };
    // Boss HP 公式: (BASE + level * PER_LEVEL) * 难度缩放
    const bossBase = (window.Config && window.Config.BOSS_BASE_HP) || 200;
    const bossPerLvl = (window.Config && window.Config.BOSS_HP_PER_LEVEL) || 120;
    this.hp = Math.floor((bossBase + level * bossPerLvl) * diff.bossHpMul);
    this.maxHp = this.hp;
    this.alive = true; this.t = 0; this.flashT = 0;
    this.vx = 80; this.vy = 0;
    this.targetX = x;
    this.phase = 0; // 0=入场 1=战斗 2=狂暴
    this.fireT = 0; this.entering = true; this.enterY = -100;
    // boss 分数也按难度缩放
    const scoreMul = (window.Difficulty ? window.Difficulty.get().scoreMul : 1) || 1;
    this.score = Math.floor((5000 + level * 2000) * scoreMul);
    this.level = level;
    this.color = ['#ff5577', '#aa55ff', '#55ddff', '#ffaa33', '#77ff66'][level - 1] || '#ff5577';
    this.spin = 0;
    // 5 种 AI 模式
    this.ai = ['patrol', 'dive', 'spiral', 'figure8', 'chase'][level - 1] || 'patrol';
    // AI 状态
    this.aiT = 0;          // AI 状态机时间
    this.baseY = 120;       // 基准 Y 位置
    this.diveCooldown = 0;  // 俯冲冷却（dive 模式）
  }
  update(dt, game) {
    this.t += dt;
    this.spin += dt;
    this.aiT += dt;
    if (this.diveCooldown > 0) this.diveCooldown -= dt;
    if (this.flashT > 0) this.flashT -= dt;
    // 入场
    if (this.entering) {
      this.y += (120 - this.y) * 2 * dt;
      if (Math.abs(this.y - 120) < 1) { this.y = 120; this.entering = false; this.phase = 1; }
      return;
    }

    // 5 种 AI 移动模式
    switch (this.ai) {
      case 'patrol': {
        // 关 1 蓝隼：简单横移 + 短暂停留
        const targetVx = (this.x < 60 ? 80 : (this.x > game.W - this.w - 60 ? -80 : this.vx));
        this.vx += (targetVx - this.vx) * 2 * dt;
        this.x += this.vx * dt;
        this.y = this.baseY + Math.sin(this.aiT * 1.5) * 15;  // 轻微上下浮动
        this.x = Utils.clamp(this.x, 10, game.W - this.w - 10);
        break;
      }
      case 'dive': {
        // 关 2 铁壁：顶部来回巡逻，偶尔俯冲
        if (this.aiT % 6 < 4) {
          // 巡逻模式：横移
          const targetVx = (this.x < 60 ? 80 : (this.x > game.W - this.w - 60 ? -80 : this.vx));
          this.vx += (targetVx - this.vx) * 2 * dt;
          this.x += this.vx * dt;
          this.y = this.baseY;
        } else if (this.diveCooldown <= 0) {
          // 俯冲模式：朝玩家俯冲
          const a = Utils.angleTo(this.x, this.y, game.player.x, game.player.y);
          const sp = 180;
          this.vx = Math.cos(a) * sp;
          this.vy = Math.sin(a) * sp;
          this.x += this.vx * dt;
          this.y += this.vy * dt;
          // 俯冲结束条件：既防向下俯冲出屏，也防向上俯冲出屏
          // ★ 修复：向上俯冲（玩家在 Boss 上方）时 y 会变负数，原条件只检查
          // y > H*0.5 会导致 Boss 一直飞到屏幕外。同时清零 vy，防止
          // 冷却期间继续按俯冲方向飞出屏幕。
          if (this.y > game.H * 0.5 || this.y < -20) {
            this.diveCooldown = 3;
            this.y = this.baseY;
            this.vy = 0;
          }
        } else {
          // 冷却中：保持在 baseY，并清零 vy（防止残留俯冲速度继续飞出屏幕）
          this.y += (this.baseY - this.y) * 3 * dt;
          this.vy = 0;
        }
        this.x = Utils.clamp(this.x, 10, game.W - this.w - 10);
        // ★ 防御性 clamp：即使前面的逻辑有遗漏，y 也不会飞出 [0, H*0.6]
        this.y = Utils.clamp(this.y, 0, game.H * 0.6);
        break;
      }
      case 'spiral': {
        // 关 3 烈焰：螺旋轨迹（圆形路径）
        const cx = game.W / 2 - this.w / 2;
        const cy = this.baseY + 100;
        const radius = 130;
        const omega = 1.2;
        this.x = cx + Math.cos(this.aiT * omega) * radius;
        this.y = cy + Math.sin(this.aiT * omega) * radius * 0.5;
        this.x = Utils.clamp(this.x, 10, game.W - this.w - 10);
        // ★ 防御性 y clamp：与 dive/chase 保持一致。修改 baseY/radius 时
        // 公式 y = cy + sin(...)*radius*0.5 可能超出 [0, H*0.6]，加 clamp 防溢出
        this.y = Utils.clamp(this.y, 0, game.H * 0.6);
        break;
      }
      case 'figure8': {
        // 关 4 天雷：8字形轨迹
        const cx = game.W / 2 - this.w / 2;
        const cy = this.baseY + 60;
        const a = this.aiT * 1.3;
        this.x = cx + Math.sin(a) * 180;
        this.y = cy + Math.sin(a * 2) * 60;
        this.x = Utils.clamp(this.x, 10, game.W - this.w - 10);
        break;
      }
      case 'chase': {
        // 关 5 终末：追随玩家
        const dx = game.player.x - this.x;
        const dy = game.player.y - this.y;
        const d = Math.hypot(dx, dy) || 1;
        const targetSpeed = 100;
        // 不直接撞，水平方向追随，垂直方向保持距离
        this.vx += (dx / d * targetSpeed - this.vx) * 1.5 * dt;
        this.vy += (dy / d * 30 - this.vy) * 1.5 * dt;  // 垂直方向慢
        this.x += this.vx * dt;
        this.y = Utils.clamp(this.y + this.vy * dt, this.baseY, game.H * 0.6);
        this.x = Utils.clamp(this.x, 10, game.W - this.w - 10);
        break;
      }
    }

    // 阶段切换
    // 阶段切换阈值（从 Config 读取）
    const phase2Threshold = (window.Config && window.Config.BOSS_PHASE_2_THRESHOLD) || 0.35;
    const phase15Threshold = (window.Config && window.Config.BOSS_PHASE_1_5_THRESHOLD) || 0.7;
    const phase2Shake = (window.Config && window.Config.BOSS_SHAKE_ON_PHASE2) || 8;
    const phase2ShakeDur = (window.Config && window.Config.BOSS_SHAKE_DUR_ON_PHASE2) || 0.4;
    if (this.hp < this.maxHp * phase2Threshold && this.phase < 2) {
      this.phase = 2; Audio.bossWarn(); Effects.shake(phase2Shake, phase2ShakeDur);
    }
    else if (this.hp < this.maxHp * 0.7 && this.phase < 1.5) this.phase = 1.5;

    // 射击
    this.fireT -= dt;
    if (this.fireT <= 0) {
      this.fire(game);
      // AI 模式影响射速
      const rateMul = this.ai === 'spiral' ? 0.8 : (this.ai === 'chase' ? 1.2 : 1.0);
      const rate = this.phase >= 2 ? 0.25 : (this.phase >= 1.5 ? 0.4 : 0.6);
      this.fireT = rate * rateMul * (0.85 + Math.random() * 0.3);
    }
  }
  fire(game) {
    const cx = this.x + this.w / 2, cy = this.y + this.h;
    // 阶段 1：基础攻击（按 AI 风格）
    if (this.phase < 1.5) {
      if (this.ai === 'patrol' || this.ai === 'dive') {
        // 蓝隼/铁壁：瞄准扇形（7 发）
        const a = Utils.angleTo(cx, cy, game.player.x, game.player.y);
        for (let i = -3; i <= 3; i++) {
          const ang = a + i * 0.12;
          const sp = 220;
          game.enemyBullets.push(new Bullet(cx, cy, Math.cos(ang) * sp, Math.sin(ang) * sp, { friendly: false, r: 4, color: this.color, dmg: 1, life: 3 }));
        }
      } else if (this.ai === 'spiral') {
        // 烈焰：旋转扇形（角度随时间变）
        const baseAngle = this.aiT * 2;
        for (let i = 0; i < 5; i++) {
          const ang = baseAngle + i * (Math.PI * 2 / 5);
          const sp = 200;
          game.enemyBullets.push(new Bullet(cx, cy, Math.cos(ang) * sp, Math.sin(ang) * sp, { friendly: false, r: 4, color: this.color, dmg: 1, life: 3 }));
        }
      } else if (this.ai === 'figure8') {
        // 天雷：8 方向环射
        for (let i = 0; i < 8; i++) {
          const ang = i * Math.PI * 2 / 8 + this.aiT;
          const sp = 180;
          game.enemyBullets.push(new Bullet(cx, cy, Math.cos(ang) * sp, Math.sin(ang) * sp, { friendly: false, r: 4, color: this.color, dmg: 1, life: 3 }));
        }
      } else if (this.ai === 'chase') {
        // 终末：3 方向瞄准 + 散射
        const a = Utils.angleTo(cx, cy, game.player.x, game.player.y);
        for (let s of [-2, 0, 2]) {
          const ang = a + s * 0.15;
          const sp = 250;
          game.enemyBullets.push(new Bullet(cx, cy, Math.cos(ang) * sp, Math.sin(ang) * sp, { friendly: false, r: 5, color: this.color, dmg: 1, life: 3 }));
        }
      }
    } else if (this.phase < 2) {
      // 阶段 1.5：阶段 1 风格 + 追加
      if (this.ai === 'spiral' || this.ai === 'figure8') {
        // 旋转系：环射 + 追加螺旋
        const n = this.ai === 'spiral' ? 10 : 12;
        for (let i = 0; i < n; i++) {
          const ang = i * Math.PI * 2 / n;
          const sp = 200;
          game.enemyBullets.push(new Bullet(cx, cy, Math.cos(ang) * sp, Math.sin(ang) * sp, { friendly: false, r: 4, color: this.color, dmg: 1, life: 3 }));
        }
        const a = Utils.angleTo(cx, cy, game.player.x, game.player.y);
        for (let s of [-1, 0, 1]) {
          game.enemyBullets.push(new Bullet(cx, cy, Math.cos(a + s*0.1) * 320, Math.sin(a + s*0.1) * 320, { friendly: false, r: 6, color: '#ffee66', dmg: 1, life: 3 }));
        }
      } else {
        // 蓝隼/铁壁/终末：双环+瞄准
        for (let i = 0; i < 12; i++) {
          const ang = i * Math.PI * 2 / 12;
          const sp = 200;
          game.enemyBullets.push(new Bullet(cx, cy, Math.cos(ang) * sp, Math.sin(ang) * sp, { friendly: false, r: 4, color: this.color, dmg: 1, life: 3 }));
        }
        const a = Utils.angleTo(cx, cy, game.player.x, game.player.y);
        const sp = 320;
        for (let s of [-1, 0, 1]) {
          game.enemyBullets.push(new Bullet(cx, cy, Math.cos(a + s*0.1) * sp, Math.sin(a + s*0.1) * sp, { friendly: false, r: 6, color: '#ffee66', dmg: 1, life: 3 }));
        }
      }
    } else {
      // 阶段 2 狂暴：环形弹幕
      const n = this.ai === 'chase' ? 28 : 24;
      for (let i = 0; i < n; i++) {
        const a = i * Math.PI * 2 / n + this.t;
        const sp = this.ai === 'chase' ? 200 : 180;
        game.enemyBullets.push(new Bullet(cx, cy, Math.cos(a) * sp, Math.sin(a) * sp, { friendly: false, r: 5, color: '#ff66aa', dmg: 1, life: 3.5 }));
      }
    }
  }
  hit(dmg) {
    this.hp -= dmg;
    this.flashT = 0.08;
    if (this.hp <= 0) this.alive = false;
  }
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x + this.w/2, this.y + this.h/2);
    const flash = this.flashT > 0;
    // 旋转装饰环
    ctx.save();
    ctx.rotate(this.spin * 0.6);
    ctx.strokeStyle = flash ? '#fff' : this.color;
    ctx.lineWidth = 2;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 20;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, 40 + i * 14, i * 0.4, i * 0.4 + Math.PI * 1.5);
      ctx.stroke();
    }
    ctx.restore();
    // 主体
    ctx.fillStyle = flash ? '#fff' : this.color;
    ctx.shadowBlur = 24; ctx.shadowColor = this.color;
    ctx.beginPath();
    ctx.moveTo(-this.w/2, -this.h/2);
    ctx.lineTo(-this.w/2 + 20, this.h/2);
    ctx.lineTo(0, this.h/2 - 15);
    ctx.lineTo(this.w/2 - 20, this.h/2);
    ctx.lineTo(this.w/2, -this.h/2);
    ctx.closePath();
    ctx.fill();
    // 核心
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = flash ? '#fff' : '#222';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    // HP 条
    const bw = 200;
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#400';
    ctx.fillRect(-bw/2, -this.h/2 - 16, bw, 6);
    const grad = ctx.createLinearGradient(-bw/2, 0, bw/2, 0);
    grad.addColorStop(0, '#f44');
    grad.addColorStop(1, '#ff8');
    ctx.fillStyle = grad;
    ctx.fillRect(-bw/2, -this.h/2 - 16, bw * (this.hp / this.maxHp), 6);
    ctx.restore();
  }
}

class PowerUp {
  constructor(x, y, kind, canvasH = 780) {
    this.x = x; this.y = y; this.w = 22; this.h = 22;
    this.vy = 90; this.vx = 0;   // vx 改为每帧根据当前 y 计算，才有"左右漂"的效果
    this.kind = kind; // 'weapon', 'bomb', 'heal', 'shield'
    this.alive = true; this.t = 0;
    this.offY = canvasH + 20;    // 出屏阈值（不再硬编码 800，避免与 canvas 高度不一致）
  }
  update(dt) {
    this.t += dt;
    // 随下落位置产生左右正弦漂移（振幅 25 像素/秒）
    this.vx = Math.sin(this.y * 0.04) * 25;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.y > this.offY) this.alive = false;
  }
  draw(ctx) {
    const colors = { weapon: '#ffdd33', bomb: '#ff5544', heal: '#55ff77', shield: '#55ddff' };
    const labels = { weapon: 'P', bomb: 'B', heal: 'H', shield: 'S' };
    const c = colors[this.kind] || '#fff';
    ctx.save();
    ctx.translate(this.x + this.w/2, this.y + this.h/2);
    const pulse = 1 + Math.sin(this.t * 8) * 0.1;
    ctx.scale(pulse, pulse);
    ctx.shadowColor = c; ctx.shadowBlur = 16;
    ctx.fillStyle = c;
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -this.h/2);
    ctx.lineTo(this.w/2, 0);
    ctx.lineTo(0, this.h/2);
    ctx.lineTo(-this.w/2, 0);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#000';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(labels[this.kind] || '?', 0, 1);
    ctx.restore();
  }
}
