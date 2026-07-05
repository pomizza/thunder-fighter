// touch.js - 移动端触控支持：虚拟摇杆 + 射击/炸弹按钮 + 暂停按钮
const Touch = (() => {
  // 状态：按键模拟（与 Utils.keys 共享）
  const k = () => Utils.keys;

  // 虚拟摇杆
  let stickActive = false;
  let stickId = -1;        // 触控点 id
  let stickBaseX = 0, stickBaseY = 0;  // 底座中心
  let stickKnobX = 0, stickKnobY = 0;  // 当前 knob 位置
  const STICK_R = 60;       // 底座半径
  const STICK_DEAD = 12;    // 死区半径
  let visible = true;       // 是否显示
  let isTouchDevice = false;

  // 按钮
  const buttons = {
    fire: { x: 0, y: 0, r: 50, label: 'FIRE', color: '#3399ff', pressed: false, id: -1 },
    bomb: { x: 0, y: 0, r: 40, label: 'BOMB', color: '#ff5544', pressed: false, id: -1 },
    pause: { x: 0, y: 0, r: 22, label: 'II', color: '#ffaa55', pressed: false, id: -1 },
  };

  function init(canvas) {
    // 检测触屏设备：多种方式组合
    isTouchDevice = (typeof window.ontouchstart !== 'undefined' && window.ontouchstart !== undefined)
      || navigator.maxTouchPoints > 0;
    if (!isTouchDevice) {
      visible = false;
      return;
    }
    // 阻止浏览器默认手势
    canvas.addEventListener('touchstart', e => e.preventDefault(), { passive: false });
    canvas.addEventListener('touchmove', e => e.preventDefault(), { passive: false });

    // 重新布局按钮位置
    layoutButtons(canvas);

    canvas.addEventListener('touchstart', onTouchStart.bind(null, canvas), { passive: false });
    canvas.addEventListener('touchmove', onTouchMove.bind(null, canvas), { passive: false });
    canvas.addEventListener('touchend', onTouchEnd.bind(null, canvas), { passive: false });
    canvas.addEventListener('touchcancel', onTouchEnd.bind(null, canvas), { passive: false });
  }

  function layoutButtons(canvas) {
    const rect = canvas.getBoundingClientRect();
    const W = rect.width, H = rect.height;
    // 左下角：虚拟摇杆底座
    stickBaseX = 90 * (W / 540);
    stickBaseY = H - 90 * (H / 780);
    // 右下角：FIRE / BOMB
    buttons.fire.x = W - 70 * (W / 540);
    buttons.fire.y = H - 120 * (H / 780);
    buttons.bomb.x = W - 130 * (W / 540);
    buttons.bomb.y = H - 80 * (H / 780);
    // 右上角：暂停
    buttons.pause.x = W - 30 * (W / 540);
    buttons.pause.y = 60 * (H / 780);
  }

  function getPos(canvas, touch) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
  }

  function hitButton(x, y) {
    for (const key in buttons) {
      const b = buttons[key];
      const dx = x - b.x, dy = y - b.y;
      if (dx * dx + dy * dy <= b.r * b.r) return key;
    }
    return null;
  }

  function onTouchStart(canvas, e) {
    for (const t of e.changedTouches) {
      const p = getPos(canvas, t);
      // 1) 检查按钮
      const btn = hitButton(p.x, p.y);
      if (btn === 'fire') { buttons.fire.id = t.identifier; buttons.fire.pressed = true; k()['z'] = true; }
      else if (btn === 'bomb') {
        buttons.bomb.id = t.identifier; buttons.bomb.pressed = true;
        // ★ 修复：必须 dispatch 到 document 上并设 bubbles=true，才能触发 Game 中
        // 注册在 document 上的 keydown 监听器。原代码 dispatchEvent 到 window 上，
        // document 上的监听器收不到，导致触屏 BOMB/PAUSE 按钮失效。
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'x', bubbles: true }));
      }
      else if (btn === 'pause') {
        buttons.pause.id = t.identifier; buttons.pause.pressed = true;
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'p', bubbles: true }));
      }
      // 2) 摇杆（左半屏，且非按钮）
      else if (p.x < canvas.getBoundingClientRect().width / 2 && stickId === -1) {
        // 摇杆底座跟随触摸点（首次按下时）
        stickBaseX = p.x;
        stickBaseY = p.y;
        stickKnobX = p.x;
        stickKnobY = p.y;
        stickId = t.identifier;
        stickActive = true;
        updateStickKeys();
      }
    }
  }

  function onTouchMove(canvas, e) {
    for (const t of e.changedTouches) {
      if (t.identifier === stickId) {
        const p = getPos(canvas, t);
        // 限制到最大半径
        const dx = p.x - stickBaseX, dy = p.y - stickBaseY;
        const dist = Math.hypot(dx, dy);
        if (dist > STICK_R) {
          stickKnobX = stickBaseX + dx / dist * STICK_R;
          stickKnobY = stickBaseY + dy / dist * STICK_R;
        } else {
          stickKnobX = p.x;
          stickKnobY = p.y;
        }
        updateStickKeys();
      }
    }
  }

  function onTouchEnd(canvas, e) {
    for (const t of e.changedTouches) {
      if (t.identifier === stickId) {
        stickId = -1;
        stickActive = false;
        stickKnobX = stickBaseX;
        stickKnobY = stickBaseY;
        // 清空所有方向键
        k()['ArrowLeft'] = false; k()['ArrowRight'] = false;
        k()['ArrowUp'] = false; k()['ArrowDown'] = false;
        k()['a'] = false; k()['d'] = false; k()['w'] = false; k()['s'] = false;
      }
      if (t.identifier === buttons.fire.id) {
        buttons.fire.id = -1; buttons.fire.pressed = false; k()['z'] = false;
      }
      if (t.identifier === buttons.bomb.id) { buttons.bomb.id = -1; buttons.bomb.pressed = false; }
      if (t.identifier === buttons.pause.id) { buttons.pause.id = -1; buttons.pause.pressed = false; }
    }
  }

  function updateStickKeys() {
    if (!stickActive) return;
    const dx = stickKnobX - stickBaseX;
    const dy = stickKnobY - stickBaseY;
    const dist = Math.hypot(dx, dy);
    if (dist < STICK_DEAD) {
      // 死区内：清空所有方向
      k()['ArrowLeft'] = false; k()['ArrowRight'] = false;
      k()['ArrowUp'] = false; k()['ArrowDown'] = false;
      k()['a'] = false; k()['d'] = false; k()['w'] = false; k()['s'] = false;
      return;
    }
    // 死区外：根据方向设置按键
    const ax = Math.abs(dx), ay = Math.abs(dy);
    k()['ArrowLeft'] = dx < -STICK_DEAD;
    k()['ArrowRight'] = dx > STICK_DEAD;
    k()['ArrowUp'] = dy < -STICK_DEAD;
    k()['ArrowDown'] = dy > STICK_DEAD;
    // WASD 等价
    k()['a'] = k()['ArrowLeft'];
    k()['d'] = k()['ArrowRight'];
    k()['w'] = k()['ArrowUp'];
    k()['s'] = k()['ArrowDown'];
  }

  function draw(ctx, canvas) {
    if (!visible) return;
    // 虚拟摇杆
    if (stickActive || isTouchDevice) {
      // 底座
      ctx.save();
      ctx.fillStyle = 'rgba(80,160,255,0.18)';
      ctx.beginPath();
      ctx.arc(stickBaseX, stickBaseY, STICK_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(120,200,255,0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
      // 中心点
      if (!stickActive) {
        ctx.fillStyle = 'rgba(120,200,255,0.4)';
        ctx.beginPath();
        ctx.arc(stickBaseX, stickBaseY, 8, 0, Math.PI * 2);
        ctx.fill();
      }
      // Knob
      const kx = stickActive ? stickKnobX : stickBaseX;
      const ky = stickActive ? stickKnobY : stickBaseY;
      ctx.fillStyle = stickActive ? 'rgba(120,200,255,0.7)' : 'rgba(120,200,255,0.35)';
      ctx.beginPath();
      ctx.arc(kx, ky, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // 按钮
    for (const key in buttons) {
      const b = buttons[key];
      ctx.save();
      const alpha = b.pressed ? 0.6 : 0.3;
      ctx.fillStyle = b.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 2;
      ctx.stroke();
      // 文字
      ctx.fillStyle = '#fff';
      ctx.font = 'bold ' + (b.r * 0.5) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.label, b.x, b.y);
      ctx.restore();
    }
  }

  return {
    init, draw, isTouchDevice: () => isTouchDevice, isVisible: () => visible,
    buttons, layoutButtons,
    get stickActive() { return stickActive; },
  };
})();
// 显式挂到 window，原因同 ShipSelect（让 game.js 的 `if (window.Touch ...)` 守卫生效）
window.Touch = Touch;
