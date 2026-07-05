// effects.js - 粒子、特效、屏幕震动
const Effects = (() => {
  // 硬上限（性能优化）：见 Config.js
  // 粒子 300 / 流星 8 / 浮动文字 20
  const particles = [];
  const floats = [];   // 浮动文字（分数弹出）
  const stars = [];    // 背景星空
  const shockwaves = []; // 冲击波
  let shakeT = 0, shakeMag = 0, shakePeakT = 0; // 屏幕震动（带衰减）
  let shakeOffsetX = 0, shakeOffsetY = 0;       // 当前帧偏移（每帧计算一次）
  // 远景星云（关卡主题）
  const nebulae = [];   // [{x, y, r, color, alpha, vx}]
  let nebulaColor1 = '#1a1444';  // 远景主色
  let nebulaColor2 = '#3a1a55';  // 远景次色
  // 流星
  const meteors = [];   // [{x, y, vx, vy, life, maxLife, len, color}]

  // 初始化背景星
  function initStars(w, h, n = 90) {
    stars.length = 0;
    for (let i = 0; i < n; i++) {
      stars.push({ x: Math.random() * w, y: Math.random() * h, s: 0.4 + Math.random() * 1.8, vy: 30 + Math.random() * 90, tw: Math.random() * Math.PI * 2 });
    }
  }

  // 设置关卡主题色（远景星云）
  function setNebulaTheme(c1, c2) {
    nebulaColor1 = c1 || nebulaColor1;
    nebulaColor2 = c2 || nebulaColor2;
    // 重新生成 3-4 团星云
    nebulae.length = 0;
    const W = 540, H = 780;
    for (let i = 0; i < 4; i++) {
      nebulae.push({
        x: Utils ? Utils.rand(0, W) : Math.random() * W,
        y: Utils ? Utils.rand(-H * 0.2, H * 0.8) : Math.random() * H,
        r: Utils ? Utils.rand(120, 220) : 120 + Math.random() * 100,
        color: Math.random() < 0.5 ? nebulaColor1 : nebulaColor2,
        alpha: 0.15 + Math.random() * 0.15,
        vx: (Math.random() - 0.5) * 8,  // 缓慢水平漂移
      });
    }
  }

  // 触发一颗流星
  function spawnMeteor(W, H) {
    // 性能：流星数硬上限（从 Config 读取）
    const meteorsMax = (window.Config && window.Config.METEORS_MAX) || 8;
    if (meteors.length >= meteorsMax) return;
    // 从屏幕顶部或左侧进入
    const fromTop = Math.random() < 0.6;
    const x = fromTop ? Math.random() * W : -50;
    const y = fromTop ? -20 : Math.random() * H * 0.6;
    const angle = fromTop ? Math.PI / 4 + Math.random() * 0.5 : Math.PI / 8 + Math.random() * 0.4;
    const speed = 380 + Math.random() * 220;
    const colors = ['#ffffff', '#aaccff', '#ffffaa', '#ffcc88'];
    meteors.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 2.5,
      maxLife: 2.5,
      len: 18 + Math.random() * 14,  // 拖尾长度
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }

  function update(dt, w, h) {
    // 星云缓慢漂移
    for (const n of nebulae) {
      n.x += n.vx * dt;
      if (n.x < -n.r) n.x = w + n.r;
      if (n.x > w + n.r) n.x = -n.r;
    }
    // 流星
    let meteorTimer = update._meteorTimer || 0;
    meteorTimer += dt;
    if (meteorTimer > 3 + Math.random() * 2) {
      spawnMeteor(w, h);
      meteorTimer = 0;
    }
    update._meteorTimer = meteorTimer;
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      m.life -= dt;
      if (m.life <= 0 || m.x < -100 || m.x > w + 100 || m.y > h + 100) {
        meteors.splice(i, 1);
      }
    }
    // 星
    for (const s of stars) {
      s.y += s.vy * dt;
      s.tw += dt * 4;
      if (s.y > h) { s.y = -2; s.x = Math.random() * w; }
    }
    // 粒子
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= 0.97; p.vy *= 0.97;
      p.life -= dt;
      // 离屏剔除：大幅超出屏幕边界即移除
      if (p.life <= 0 || p.x < -100 || p.x > w + 100 || p.y < -100 || p.y > h + 100) {
        particles.splice(i, 1);
      }
    }
    // 浮动文字
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.y += f.vy * dt; f.life -= dt;
      if (f.life <= 0) floats.splice(i, 1);
    }
    // 冲击波
    for (let i = shockwaves.length - 1; i >= 0; i--) {
      const s = shockwaves[i];
      s.r += s.vr * dt; s.life -= dt;
      if (s.life <= 0) shockwaves.splice(i, 1);
    }
    // 屏幕震动衰减
    if (shakeT > 0) {
      shakeT -= dt;
      // 衰减系数：从 1.0 线性衰减到 0.0
      const decay = shakePeakT > 0 ? Math.max(0, shakeT / shakePeakT) : 0;
      // X/Y 用不同随机种子，保证独立
      shakeOffsetX = (Math.random() * 2 - 1) * shakeMag * decay;
      shakeOffsetY = (Math.random() * 2 - 1) * shakeMag * decay;
      if (shakeT <= 0) {
        shakeT = 0; shakeMag = 0; shakePeakT = 0;
        shakeOffsetX = 0; shakeOffsetY = 0;
      }
    }
  }

  function shake(mag, dur) {
    // 取较大值（叠加不现实，相同时间内的连续震动取最强）
    if (mag > shakeMag || shakeT < 0.1) { shakeMag = mag; }
    // 取较长持续时间
    if (dur > shakeT) {
      shakeT = dur;
      shakePeakT = dur;
    }
  }
  // 应用难度系数（难度系统可调用）
  function shakeScaled(mag, dur) {
    const mul = (window.Difficulty ? window.Difficulty.get().shakeMul : 1) || 1;
    shake(mag * mul, dur);
  }
  function getShake() { return shakeOffsetX; }
  function getShakeY() { return shakeOffsetY; }

  function spawnExplosion(x, y, color = '#ffaa33', count = 18, speed = 220) {
    // 性能：粒子数硬上限（从 Config 读取）
    const particlesMax = (window.Config && window.Config.PARTICLES_MAX) || 300;
    if (particles.length >= particlesMax) return;
    const available = particlesMax - particles.length;
    const n = Math.min(count, available);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = (0.3 + Math.random()) * speed;
      particles.push({
        x, y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: 0.4 + Math.random() * 0.5,
        maxLife: 0.9,
        size: 1.5 + Math.random() * 3,
        color: i % 3 === 0 ? '#fff' : color
      });
    }
  }
  function spawnSparks(x, y, color = '#ffff66', count = 6) {
    const particlesMax = (window.Config && window.Config.PARTICLES_MAX) || 300;
    if (particles.length >= particlesMax) return;
    const available = particlesMax - particles.length;
    const n = Math.min(count, available);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 60 + Math.random() * 120;
      particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.18 + Math.random() * 0.18, maxLife: 0.35, size: 1 + Math.random() * 1.6, color });
    }
  }
  function spawnShockwave(x, y, color, maxR = 160, speed = 600) {
    const shockwavesMax = (window.Config && window.Config.SHOCKWAVES_MAX) || 20;
    if (shockwaves.length >= shockwavesMax) return;
    shockwaves.push({ x, y, r: 4, vr: speed, maxR, life: maxR / speed, color });
  }
  function floatText(x, y, text, color = '#ffee88') {
    // 性能：浮动文字硬上限（从 Config 读取）
    const floatsMax = (window.Config && window.Config.FLOATS_MAX) || 20;
    if (floats.length >= floatsMax) floats.shift();  // 满则移除最老的
    floats.push({ x, y, vy: -40, life: 0.8, text, color });
  }

  // 拖尾记录器（飞机引擎尾焰）
  const trails = {};
  function trail(id, x, y, life = 0.25, color = '#ffcc55', size = 3) {
    let t = trails[id];
    if (!t) { t = []; trails[id] = t; }
    t.push({ x, y, life, maxLife: life, color, size });
    if (t.length > 30) t.shift();
  }
  function updateTrails(dt) {
    for (const id in trails) {
      const t = trails[id];
      for (let i = t.length - 1; i >= 0; i--) {
        t[i].life -= dt;
        if (t[i].life <= 0) t.splice(i, 1);
      }
    }
  }
  function clearTrail(id) { delete trails[id]; }

  function drawStars(ctx) {
    for (const s of stars) {
      const a = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(s.tw));
      ctx.fillStyle = `rgba(180,200,255,${a.toFixed(3)})`;
      ctx.fillRect(s.x, s.y, s.s, s.s);
    }
  }
  // 远景星云（径向渐变 + 透明度叠加）
  function drawNebulae(ctx) {
    for (const n of nebulae) {
      const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
      grad.addColorStop(0, n.color);
      grad.addColorStop(0.5, n.color);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalAlpha = n.alpha;
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  // 流星（拖尾线段）
  function drawMeteors(ctx) {
    for (const m of meteors) {
      const a = Math.min(1, m.life / m.maxLife);
      // 拖尾：从当前位置向速度反方向延伸
      const speed = Math.hypot(m.vx, m.vy);
      const tx = m.x - m.vx / speed * m.len;
      const ty = m.y - m.vy / speed * m.len;
      const grad = ctx.createLinearGradient(m.x, m.y, tx, ty);
      grad.addColorStop(0, m.color);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.globalAlpha = a * 0.9;
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      // 头部亮点
      ctx.globalAlpha = a;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(m.x, m.y, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function drawTrails(ctx) {
    for (const id in trails) {
      const t = trails[id];
      for (const p of t) {
        const a = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.globalAlpha = a;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * a, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }
  function drawParticles(ctx) {
    for (const p of particles) {
      const a = p.life / p.maxLife;
      ctx.globalAlpha = Math.max(0, a);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function drawShockwaves(ctx) {
    for (const s of shockwaves) {
      const a = s.life * 2;
      ctx.strokeStyle = s.color;
      ctx.globalAlpha = Math.max(0, a);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  function drawFloats(ctx) {
    ctx.textAlign = 'center';
    for (const f of floats) {
      ctx.globalAlpha = Math.max(0, f.life / 0.8);
      ctx.fillStyle = f.color;
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;
  }

  return {
    initStars, setNebulaTheme, spawnMeteor, update, shake, shakeScaled, getShake, getShakeY,
    spawnExplosion, spawnSparks, spawnShockwave, floatText,
    trail, updateTrails, clearTrail,
    drawStars, drawNebulae, drawMeteors, drawTrails, drawParticles, drawShockwaves, drawFloats,
    particles, stars, shockwaves, nebulae, meteors, floats
  };
})();
// 显式挂到 window，原因同 ShipSelect（让 game.js 的 `if (window.Effects ...)` 守卫生效）
window.Effects = Effects;
