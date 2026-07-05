// shop.js - 关卡间商店系统
const Shop = (() => {
  // 商品列表
  const items = [
    { id: 'hp',     name: '强化装甲',  cost: 2000, desc: '最大生命 +1' },
    { id: 'bomb',   name: '炸弹补给',  cost: 3000, desc: '炸弹 +1' },
    { id: 'weapon', name: '武器升级',  cost: 5000, desc: '武器等级 +1 (上限4)' },
    { id: 'shield', name: '能量护盾',  cost: 2500, desc: '立即获得 10秒 护盾' },
  ];

  // 状态
  let active = false;       // 商店是否打开
  let cursor = 0;           // 当前选中的商品
  let player = null;        // 当前玩家
  let onClose = null;       // 关闭回调

  function open(p, closeCb) {
    active = true;
    cursor = 0;
    player = p;
    onClose = closeCb;
    Audio.menu();
  }
  function close() {
    active = false;
    const cb = onClose;
    onClose = null;
    if (cb) cb();
  }
  function isActive() { return active; }

  function getItemState(item) {
    if (!player) return { canBuy: false, reason: '无玩家' };
    if (player.score < item.cost) {
      return { canBuy: false, reason: '分数不足' };
    }
    // 已买满检测
    if (item.id === 'hp' && player.maxHp >= 8) return { canBuy: false, reason: '已达上限' };
    if (item.id === 'bomb' && player.bombs >= player.maxBombs) return { canBuy: false, reason: '已达上限' };
    if (item.id === 'weapon' && player.weaponLevel >= player.weaponMax) return { canBuy: false, reason: '已达上限' };
    if (item.id === 'shield' && player.shieldT > 3) return { canBuy: false, reason: '护盾已激活' };
    return { canBuy: true };
  }

  function buy(idx) {
    if (!active || !player) return false;
    const item = items[idx];
    if (!item) return false;
    const state = getItemState(item);
    if (!state.canBuy) {
      Audio.hit();  // 用 hit 音效表示拒绝
      return false;
    }
    // 扣分
    player.score -= item.cost;
    // 应用
    if (item.id === 'hp') {
      player.maxHp = Math.min(8, player.maxHp + 1);
      player.hp = player.maxHp;
    } else if (item.id === 'bomb') {
      player.bombs = Math.min(player.maxBombs, player.bombs + 1);
    } else if (item.id === 'weapon') {
      player.weaponLevel = Math.min(player.weaponMax, player.weaponLevel + 1);
    } else if (item.id === 'shield') {
      player.shieldT = 10;
    }
    Audio.powerup();
    Effects.spawnShockwave(player.x + player.w/2, player.y + player.h/2, '#ffdd66', 80, 500);
    Effects.floatText(player.x + player.w/2, player.y - 20, '+' + item.name, '#ffdd66');
    return true;
  }

  function handleInput(key) {
    if (!active) return;
    if (key === 'ArrowUp' || key === 'w' || key === 'W') {
      cursor = (cursor - 1 + items.length) % items.length;
      Audio.menu();
    } else if (key === 'ArrowDown' || key === 's' || key === 'S') {
      cursor = (cursor + 1) % items.length;
      Audio.menu();
    } else if (key === 'z' || key === 'Z' || key === ' ' || key === 'Enter') {
      buy(cursor);
    } else if (key === 'x' || key === 'X' || key === 'Escape') {
      close();
    }
  }

  function draw(ctx, W, H) {
    if (!active) return;
    // 半透明黑底
    ctx.fillStyle = 'rgba(0,0,30,0.85)';
    ctx.fillRect(0, 0, W, H);
    // 标题
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffee88';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('★ 装 备 库 ★', W/2, 80);
    ctx.fillStyle = '#aaffff';
    ctx.font = '14px sans-serif';
    ctx.fillText('用分数购买强化 · Z 购买 · X 跳过', W/2, 110);
    // 当前分数
    if (player) {
      ctx.fillStyle = '#ffdd66';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('当前分数: ' + (player.score || 0), W/2, 145);
    }
    // 商品列表
    const baseY = 200;
    const itemH = 60;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const y = baseY + i * itemH;
      const sel = (i === cursor);
      const st = getItemState(it);
      // 高亮底
      if (sel) {
        ctx.fillStyle = sel ? 'rgba(80,160,255,0.3)' : 'rgba(0,0,0,0)';
        ctx.fillRect(W/2 - 200, y - 24, 400, 50);
        ctx.strokeStyle = sel ? '#88ccff' : '#446';
        ctx.lineWidth = 2;
        ctx.strokeRect(W/2 - 200, y - 24, 400, 50);
      }
      // 商品名
      ctx.fillStyle = st.canBuy ? (sel ? '#ffee66' : '#fff') : '#666';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(it.name, W/2 - 180, y - 5);
      // 描述
      ctx.fillStyle = st.canBuy ? '#aaa' : '#555';
      ctx.font = '12px sans-serif';
      ctx.fillText(it.desc, W/2 - 180, y + 15);
      // 价格 / 状态
      ctx.textAlign = 'right';
      if (st.canBuy) {
        ctx.fillStyle = player && player.score >= it.cost ? '#ffdd66' : '#888';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText(it.cost + ' 分', W/2 + 180, y - 5);
      } else {
        ctx.fillStyle = '#ff6688';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(st.reason, W/2 + 180, y);
      }
    }
    // 提示
    ctx.textAlign = 'center';
    ctx.fillStyle = '#888';
    ctx.font = '12px sans-serif';
    ctx.fillText('↑↓ 选择 · Z 购买 · X 离开', W/2, H - 30);
  }

  return { open, close, isActive, handleInput, draw, buy, items };
})();
// 显式挂到 window，原因同 ShipSelect：让 game.js 的 `if (window.Shop ...)` 守卫生效
window.Shop = Shop;
