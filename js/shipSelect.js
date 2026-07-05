// shipSelect.js - 战机选择界面
const ShipSelect = (() => {
  // 战机数据
  const ships = [
    {
      id: 'blue', name: '蓝隼', color: '#3399ff', accent: '#aaffff',
      speed: 320, hp: 5, maxHp: 5, initialWeapon: 1,
      desc: '平衡型', details: '速度 320 · HP 5 · 单发起步',
      shape: 'classic',  // 用于 draw
    },
    {
      id: 'red', name: '赤焰', color: '#ff5544', accent: '#ffaaaa',
      speed: 360, hp: 4, maxHp: 4, initialWeapon: 2,
      desc: '速度型', details: '速度 360 · HP 4 · 双发起步',
      shape: 'sharp',
    },
    {
      id: 'gold', name: '金星', color: '#ffcc44', accent: '#ffffaa',
      speed: 280, hp: 6, maxHp: 6, initialWeapon: 1,
      desc: '防御型', details: '速度 280 · HP 6 · 护盾起步 (8秒)',
      shape: 'heavy', startShield: 8,
    },
  ];

  // 状态
  let active = false;
  let cursor = 0;
  let onConfirm = null;  // 回调(ship)

  function open(confirmCb) {
    active = true;
    cursor = 0;
    onConfirm = confirmCb;
    Audio.resume();
    Audio.menu();
  }
  function close() { active = false; onConfirm = null; }
  function isActive() { return active; }
  function getCursor() { return cursor; }
  function getCurrent() { return ships[cursor]; }

  function handleInput(key) {
    if (!active) return;
    if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
      cursor = (cursor - 1 + ships.length) % ships.length;
      Audio.menu();
    } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
      cursor = (cursor + 1) % ships.length;
      Audio.menu();
    } else if (key === 'z' || key === 'Z' || key === ' ' || key === 'Enter') {
      const ship = ships[cursor];
      Audio.select();
      active = false;
      const cb = onConfirm;
      onConfirm = null;
      if (cb) cb(ship);
    } else if (key === 'x' || key === 'X' || key === 'Escape') {
      // 返回主菜单
      active = false;
      onConfirm = null;
    }
  }

  // 绘制战机（与 Player.draw 类似但参数化）
  function drawShip(ctx, x, y, scale, ship, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    const w = 32, h = 38;
    // 引擎尾焰
    const flicker = 0.8 + Math.sin(t * 30) * 0.2;
    ctx.fillStyle = `rgba(255,180,80,${0.7 * flicker})`;
    ctx.beginPath();
    ctx.moveTo(-8, h/2);
    ctx.lineTo(-12, h/2);
    ctx.lineTo(-10, h/2 + 10 + flicker * 6);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(8, h/2);
    ctx.lineTo(12, h/2);
    ctx.lineTo(10, h/2 + 10 + flicker * 6);
    ctx.closePath(); ctx.fill();
    // 主体
    ctx.fillStyle = ship.color;
    ctx.strokeStyle = '#001';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = ship.accent;
    ctx.shadowBlur = 12;
    if (ship.shape === 'sharp') {
      // 锐利三角
      ctx.beginPath();
      ctx.moveTo(0, -h/2 - 2);
      ctx.lineTo(-w/2 - 2, h/2);
      ctx.lineTo(0, h/3);
      ctx.lineTo(w/2 + 2, h/2);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    } else if (ship.shape === 'heavy') {
      // 厚重方型
      ctx.fillRect(-w/2, -h/3, w, h * 0.7);
      ctx.fillRect(-w/2 - 4, h/4, w + 8, h * 0.3);
      ctx.strokeRect(-w/2, -h/3, w, h * 0.7);
      ctx.strokeRect(-w/2 - 4, h/4, w + 8, h * 0.3);
    } else {
      // 经典菱形
      ctx.beginPath();
      ctx.moveTo(0, -h/2);
      ctx.lineTo(-w/2, h/3);
      ctx.lineTo(-w/3, h/2);
      ctx.lineTo(w/3, h/2);
      ctx.lineTo(w/2, h/3);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    }
    // 驾驶舱
    ctx.fillStyle = ship.accent;
    ctx.beginPath();
    ctx.ellipse(0, -2, 6, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    // 翼尖
    ctx.fillStyle = ship.color;
    ctx.globalAlpha = 0.7;
    ctx.fillRect(-w/2 - 4, h/3 - 6, 4, 12);
    ctx.fillRect(w/2, h/3 - 6, 4, 12);
    ctx.restore();
  }

  function draw(ctx, W, H, t) {
    if (!active) return;
    // 半透明背景
    ctx.fillStyle = 'rgba(0,0,20,0.7)';
    ctx.fillRect(0, 0, W, H);
    // 标题
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffee88';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('★ 选 择 战 机 ★', W/2, 100);
    ctx.fillStyle = '#aaccff';
    ctx.font = '14px sans-serif';
    ctx.fillText('← → 切换 · Z 确认 · X 返回', W/2, 130);
    // 3 架战机横向
    const baseY = 280;
    const colW = W / 3;
    for (let i = 0; i < ships.length; i++) {
      const ship = ships[i];
      const cx = colW * (i + 0.5);
      const cy = baseY;
      const sel = (i === cursor);
      const scale = sel ? 1.5 : 1.0;
      // 高亮底
      if (sel) {
        ctx.fillStyle = 'rgba(80,160,255,0.25)';
        ctx.fillRect(cx - colW/2 + 20, cy - 80, colW - 40, 200);
        ctx.strokeStyle = ship.color;
        ctx.lineWidth = 3;
        ctx.strokeRect(cx - colW/2 + 20, cy - 80, colW - 40, 200);
      }
      // 战机
      drawShip(ctx, cx, cy - 20, scale, ship, t);
      // 名称
      ctx.fillStyle = sel ? ship.color : '#aaa';
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText(ship.name, cx, cy + 80);
      // 类型
      ctx.fillStyle = sel ? ship.accent : '#666';
      ctx.font = '14px sans-serif';
      ctx.fillText(ship.desc, cx, cy + 102);
      // 详情
      ctx.fillStyle = sel ? '#fff' : '#555';
      ctx.font = '12px sans-serif';
      ctx.fillText(ship.details, cx, cy + 124);
    }
    // 底部属性对比
    const sel = ships[cursor];
    const attrY = 460;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(50, attrY, W - 100, 80);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#aaffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('[' + sel.name + ']  特性', 70, attrY + 22);
    ctx.fillStyle = '#fff';
    ctx.font = '13px sans-serif';
    ctx.fillText('速度: ' + '█'.repeat(Math.round(sel.speed / 40)) + ' ' + sel.speed, 70, attrY + 44);
    ctx.fillText('生命: ' + '█'.repeat(sel.hp) + ' ' + sel.hp + '/' + sel.maxHp, 70, attrY + 62);
    ctx.textAlign = 'center';
  }

  return { open, close, isActive, handleInput, draw, getCursor, getCurrent, ships };
})();
// ★ 关键修复：const 顶层声明不会成为 window 属性；显式挂到 window 上，
// 以便 game.js 中 `if (window.ShipSelect)` / `if (window.ShipSelect && ShipSelect.isActive())`
// 这些守卫能正确识别模块已加载并打开（之前一直无法进入游戏的根本原因）。
window.ShipSelect = ShipSelect;
