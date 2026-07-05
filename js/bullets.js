// bullets.js - 子弹系统
class Bullet {
  constructor(x, y, vx, vy, opts = {}) {
    this.x = x; this.y = y;
    this.vx = vx; this.vy = vy;
    this.r = opts.r || 4;
    this.dmg = opts.dmg || 1;
    this.friendly = opts.friendly !== false; // true=玩家子弹
    this.color = opts.color || (this.friendly ? '#66ddff' : '#ff6655');
    this.kind = opts.kind || 'normal';   // normal, laser, missile
    this.life = opts.life || 2.5;
    this.alive = true;
    this.angle = Math.atan2(vy, vx);
    this.turnRate = opts.turnRate || 0; // 追踪弹转向
    this.target = opts.target || null;  // 追踪目标
    // 画布尺寸：优先用 opts 传入，否则从全局 game 读取，最后回退默认值
    // 之前硬编码 540×780，如果未来改 canvas 尺寸会失效。
    const g = window.__game;
    this.cw = opts.cw || (g ? g.W : 540);
    this.ch = opts.ch || (g ? g.H : 780);
  }
  update(dt) {
    if (this.turnRate && this.target && this.target.alive) {
      const ta = Math.atan2(this.target.y - this.y, this.target.x - this.x);
      let d = ta - this.angle;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      this.angle += Utils.clamp(d, -this.turnRate * dt, this.turnRate * dt);
      const sp = Math.hypot(this.vx, this.vy);
      this.vx = Math.cos(this.angle) * sp;
      this.vy = Math.sin(this.angle) * sp;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    // 画布尺寸：超出各边 50px 即回收（避免硬编码）
    const OFF = 50;
    if (this.life <= 0 || this.y < -OFF || this.y > this.ch + OFF || this.x < -OFF || this.x > this.cw + OFF) this.alive = false;
  }
  draw(ctx) {
    if (this.kind === 'laser') {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.fillStyle = '#88ffff';
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 12;
      ctx.fillRect(-2, -10, 4, 20);
      ctx.restore();
    } else if (this.kind === 'missile') {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.fillStyle = '#ffdd44';
      ctx.beginPath();
      ctx.moveTo(10, 0); ctx.lineTo(-6, -5); ctx.lineTo(-6, 5);
      ctx.closePath(); ctx.fill();
      // 尾焰
      ctx.fillStyle = '#ff8844';
      ctx.beginPath();
      ctx.moveTo(-6, -3); ctx.lineTo(-12 - Math.random() * 4, 0); ctx.lineTo(-6, 3);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    } else {
      // 普通弹
      ctx.save();
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

class Bomb {
  constructor(x, y, dmg) {
    this.x = x; this.y = y; this.dmg = dmg;
    this.t = 0; this.alive = true; this.maxT = 0.6;
  }
  update(dt) { this.t += dt; if (this.t >= this.maxT) this.alive = false; }
  draw(ctx) {
    const r = 60 + this.t * 800;
    ctx.save();
    ctx.globalAlpha = 1 - this.t / this.maxT;
    ctx.strokeStyle = '#ffffee';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,200,0.2)';
    ctx.beginPath();
    ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
