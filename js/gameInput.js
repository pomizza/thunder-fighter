// gameInput.js - 输入处理模块
// 把 game.js 中的所有 keydown 处理逻辑提取到这里
const GameInput = (() => {

  // 主菜单输入
  function handleMenu(g, e) {
    const total = g.lastReplayData ? 4 : 3;
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      g.menuIndex = (g.menuIndex - 1 + total) % total;
      Audio.menu();
    } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      g.menuIndex = (g.menuIndex + 1) % total;
      Audio.menu();
    } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      // 难度项时，左右切换
      if (g.menuIndex === 1 && window.Difficulty) { Difficulty.prev(); Audio.menu(); }
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      if (g.menuIndex === 1 && window.Difficulty) { Difficulty.next(); Audio.menu(); }
    } else if (e.key === 'z' || e.key === 'Z' || e.key === ' ' || e.key === 'Enter') {
      Audio.select();
      if (g.menuIndex === 0) {
        // 进入战机选择
        g.state = 'selectShip';
        if (window.ShipSelect) ShipSelect.open(ship => g.startGame(ship));
      } else if (g.menuIndex === 1 && window.Difficulty) {
        Difficulty.next(); Audio.menu();
      } else if (g.menuIndex === 2 && g.lastReplayData) {
        // 播放回放
        g.startPlayback();
      } else {
        g.state = 'help';
      }
    }
  }

  // 战机选择由 ShipSelect 自己处理

  function handleHelp(g, e) {
    if (e.key === 'z' || e.key === 'Z' || e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
      g.state = 'menu';
    }
  }

  function handlePlaying(g, e) {
    if (e.key === 'p' || e.key === 'P') {
      g.state = 'paused';
    } else if (e.key === 'x' || e.key === 'X') {
      if (g.player) g.player.useBomb();
    }
    // 回放控制
    if (window.Replay && Replay.isPlaying()) {
      Replay.handleInput(e.key);
    }
  }

  function handlePaused(g, e) {
    if (e.key === 'p' || e.key === 'P' || e.key === 'z' || e.key === 'Z' || e.key === ' ' || e.key === 'Enter') {
      g.state = 'playing';
    }
  }

  function handleGameOver(g, e) {
    if (e.key === 'z' || e.key === 'Z' || e.key === ' ' || e.key === 'Enter') {
      g.state = 'menu';
    } else if ((e.key === 'r' || e.key === 'R') && g.lastReplayData) {
      g.startPlayback();
    }
  }

  function handleVictory(g, e) {
    if (e.key === 'z' || e.key === 'Z' || e.key === ' ' || e.key === 'Enter') {
      g.state = 'menu';
    } else if ((e.key === 'r' || e.key === 'R') && g.lastReplayData) {
      g.startPlayback();
    }
  }

  // levelClear 不响应（等 setTimeout；Shop 打开时由 Shop 处理）

  // 主入口：分配到具体 handler
  function handleKey(g, e) {
    // 全局静音
    if (e.key === 'm' || e.key === 'M') { Audio.toggleMute(); return; }
    if (g.state === 'menu') handleMenu(g, e);
    else if (g.state === 'help') handleHelp(g, e);
    else if (g.state === 'playing') handlePlaying(g, e);
    else if (g.state === 'paused') handlePaused(g, e);
    else if (g.state === 'gameover') handleGameOver(g, e);
    else if (g.state === 'victory') handleVictory(g, e);
  }

  // Shop / ShipSelect 专用监听（不与游戏状态冲突）
  function handleModalKey(e) {
    if (window.Shop && Shop.isActive()) {
      Shop.handleInput(e.key);
    } else if (window.ShipSelect && ShipSelect.isActive()) {
      ShipSelect.handleInput(e.key);
    }
  }

  // 全局安装：注册两个 keydown 监听
  function install(g) {
    document.addEventListener('keydown', e => handleKey(g, e));
    document.addEventListener('keydown', e => handleModalKey(e));
  }

  return { handleKey, handleModalKey, install };
})();
window.GameInput = GameInput;
