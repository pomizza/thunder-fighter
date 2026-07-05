// difficulty.js - 难度系统
const Difficulty = (() => {
  const LEVELS = {
    EASY:   { id: 'EASY',   name: '简单', hp: 6, maxHp: 6, bombs: 4, enemyHpMul: 0.7, enemyCountMul: 0.85, bossHpMul: 0.8, comboWindow: 2.0, shakeMul: 0.7, scoreMul: 0.8 },
    NORMAL: { id: 'NORMAL', name: '普通', hp: 5, maxHp: 5, bombs: 3, enemyHpMul: 1.0, enemyCountMul: 1.0,  bossHpMul: 1.0, comboWindow: 1.5, shakeMul: 1.0, scoreMul: 1.0 },
    HARD:   { id: 'HARD',   name: '困难', hp: 4, maxHp: 4, bombs: 2, enemyHpMul: 1.3, enemyCountMul: 1.15, bossHpMul: 1.3, comboWindow: 1.2, shakeMul: 1.3, scoreMul: 1.5 },
  };
  const ORDER = ['EASY', 'NORMAL', 'HARD'];
  let current = 'NORMAL';

  function get() { return LEVELS[current]; }
  function getId() { return current; }
  function set(id) {
    if (LEVELS[id]) {
      current = id;
      try { localStorage.setItem('thunder_diff', id); } catch (e) {}
    }
  }
  function next() {
    const i = ORDER.indexOf(current);
    set(ORDER[(i + 1) % ORDER.length]);
  }
  function prev() {
    const i = ORDER.indexOf(current);
    set(ORDER[(i - 1 + ORDER.length) % ORDER.length]);
  }
  // 从 localStorage 恢复
  try {
    const saved = localStorage.getItem('thunder_diff');
    if (saved && LEVELS[saved]) current = saved;
  } catch (e) {}

  return { LEVELS, ORDER, get, getId, set, next, prev };
})();
// 显式挂到 window，原因同 ShipSelect：让各处 `if (window.Difficulty ? ... : null)` 守卫生效。
// 不挂的话 game.js 只在 startGame() 里设置的 fallback 会生效，真实难度永远 NORMAL，
// 用户在菜单切换难度看似变化，但永远不被实际加载——一个隐蔽的状态机污染。
window.Difficulty = Difficulty;
