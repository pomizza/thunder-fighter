// utils.js - 通用工具：数学、随机、碰撞、输入
const Utils = (() => {
  const rand = (a, b) => a + Math.random() * (b - a);
  const irand = (a, b) => Math.floor(rand(a, b + 1));
  const choice = arr => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const dist2 = (x1, y1, x2, y2) => { const dx = x1 - x2, dy = y1 - y2; return dx * dx + dy * dy; };
  const dist = (x1, y1, x2, y2) => Math.sqrt(dist2(x1, y1, x2, y2));
  const angleTo = (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1);
  // 圆-矩形碰撞
  const hitCircleRect = (cx, cy, r, rx, ry, rw, rh) => {
    const nx = clamp(cx, rx, rx + rw);
    const ny = clamp(cy, ry, ry + rh);
    return dist2(cx, cy, nx, ny) <= r * r;
  };
  // 圆-圆碰撞
  const hitCircle = (x1, y1, r1, x2, y2, r2) => dist2(x1, y1, x2, y2) <= (r1 + r2) * (r1 + r2);
  // 矩形-矩形
  const hitRect = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

  // 输入管理
  const keys = {};
  window.addEventListener('keydown', e => {
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','z','Z','x','X','p','P','w','a','s','d','W','A','S','D'].includes(e.key)) e.preventDefault();
    keys[e.key] = true;
  });
  window.addEventListener('keyup', e => { keys[e.key] = false; });

  return { rand, irand, choice, clamp, lerp, dist, dist2, angleTo, hitCircleRect, hitCircle, hitRect, keys };
})();
// 同其他模块：显式挂到 window，便于调试 / 测试 / 未来可能添加的 window.X 守卫
window.Utils = Utils;
