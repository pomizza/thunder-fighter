// replay.js - Replay 回放系统
const Replay = (() => {
  // 录制状态
  let recording = false;
  let recordData = null;  // { ticks: [...], meta: {...} }
  let recordStartT = 0;   // 录制的 wall-clock 时间
  let recordFrameId = 0;  // 帧序号

  // 回放状态
  let playing = false;
  let playbackData = null;
  let playbackTick = 0;
  let playbackTimer = 0;
  let playbackPause = false;
  let pausedKey = false;  // 防 Z 重复触发

  function startRecording() {
    if (recording) return;
    recording = true;
    recordData = {
      meta: {
        startTime: Date.now(),
        version: 1,
        width: 540, height: 780,
      },
      ticks: [],
    };
    recordStartT = 0;
    recordFrameId = 0;
  }

  // 每帧调用（从 game.update 顶部）
  function tickRecordFrame(game) {
    if (!recording) return;
    if (!game.player || !game.player.alive) {
      // 玩家死亡后停止录制
      stopRecording();
      return;
    }
    recordData.ticks.push({
      f: recordFrameId++,
      t: recordStartT,  // 累积时间
      keys: snapshotKeys(),
      player: snapshotPlayer(game.player),
      enemies: game.enemies.filter(e => e.alive).map(snapshotEnemy),
      enemyBullets: game.enemyBullets.filter(b => b.alive).map(snapshotBullet),
      playerBullets: game.playerBullets.filter(b => b.alive).map(snapshotBullet),
      powerups: game.powerups.filter(p => p.alive).map(snapshotPowerup),
      boss: game.boss && game.boss.alive ? snapshotBoss(game.boss) : null,
      bossBullets: game.boss ? game.enemyBullets.filter(b => b.alive).length : 0,  // 简化
      bossHP: game.boss && game.boss.alive ? game.boss.hp : 0,
      score: game.player.score,
      hp: game.player.hp,
      bombs: game.player.bombs,
      combo: game.player.combo,
      comboT: game.player.comboT,
      levelIdx: game.levelIdx,
    });
    recordStartT += 1/60;  // 假设 60fps
  }

  function snapshotKeys() {
    const k = Utils.keys;
    return {
      l: !!k['ArrowLeft'] || !!k['a'] || !!k['A'],
      r: !!k['ArrowRight'] || !!k['d'] || !!k['D'],
      u: !!k['ArrowUp'] || !!k['w'] || !!k['W'],
      d: !!k['ArrowDown'] || !!k['s'] || !!k['S'],
      z: !!k['z'] || !!k['Z'] || !!k[' '],
      x: !!k['x'] || !!k['X'],
    };
  }

  function snapshotPlayer(p) {
    return {
      x: p.x, y: p.y,
      hp: p.hp, bombs: p.bombs, score: p.score,
      combo: p.combo, comboT: p.comboT,
      weaponLevel: p.weaponLevel,
      shieldT: p.shieldT, invulT: p.invulT,
      color: p.color, accent: p.accent, shipId: p.shipId,
    };
  }

  function snapshotEnemy(e) {
    return {
      t: e.type, x: e.x, y: e.y,
      hp: e.hp, maxHp: e.maxHp,
      vx: e.vx, vy: e.vy,
      t2: e.t,  // 时间累加
      fT: e.flashT,
    };
  }

  function snapshotBullet(b) {
    return {
      x: b.x, y: b.y, vx: b.vx, vy: b.vy,
      kind: b.kind || 'normal',
      friendly: b.friendly,
      r: b.r, dmg: b.dmg, life: b.life,
      color: b.color,
    };
  }

  function snapshotPowerup(p) {
    return { kind: p.kind, x: p.x, y: p.y };
  }

  function snapshotBoss(b) {
    return {
      x: b.x, y: b.y, hp: b.hp, maxHp: b.maxHp,
      phase: b.phase, t: b.t, spin: b.spin,
      level: b.level, ai: b.ai, color: b.color,
    };
  }

  function stopRecording() {
    if (!recording) return null;
    recording = false;
    const data = recordData;
    recordData = null;
    return data;
  }

  // ============ 回放 ============

  function startPlayback(data) {
    if (!data || !data.ticks || data.ticks.length === 0) {
      // 静默：UI 已提示（菜单/GameOver 画面）
      return false;
    }
    playbackData = data;
    playbackTick = 0;
    playbackTimer = 0;
    playbackPause = false;
    playing = true;
    pausedKey = false;
    return true;
  }

  function stopPlayback() {
    if (!playing) return;
    playing = false;
    playbackData = null;
    // 清除按键状态
    const k = Utils.keys;
    k['ArrowLeft'] = false; k['ArrowRight'] = false;
    k['ArrowUp'] = false; k['ArrowDown'] = false;
    k['z'] = false; k['Z'] = false; k[' '] = false;
    k['x'] = false; k['X'] = false;
  }

  function isPlaying() { return playing; }
  function isPaused() { return playbackPause; }
  function isRecording() { return recording; }

  // 每帧调用：返回"当前帧的 keys"（让 Player.update 用它）
  // 或返回 null 表示无回放（用真实 keys）
  function getPlaybackKeys() {
    if (!playing || !playbackData) return null;
    const idx = Math.min(playbackTick, playbackData.ticks.length - 1);
    return playbackData.ticks[idx].keys;
  }

  // 由 game.update 调用
  function tickPlayback(dt, game) {
    if (!playing || !playbackData) return;
    if (playbackPause) return;
    playbackTimer += dt;
    // 推进 tick（每个 tick = 1/60s）
    const targetTick = Math.floor(playbackTimer * 60);
    if (targetTick > playbackTick) {
      playbackTick = Math.min(targetTick, playbackData.ticks.length - 1);
    }
    // 应用当前帧的 keys（用于 Player.update）
    const keys = getPlaybackKeys();
    if (keys) {
      const k = Utils.keys;
      k['ArrowLeft'] = keys.l; k['ArrowRight'] = keys.r;
      k['ArrowUp'] = keys.u; k['ArrowDown'] = keys.d;
      k['z'] = keys.z; k['Z'] = keys.z; k[' '] = keys.z;
      k['x'] = keys.x; k['X'] = keys.x;
      // WASD 等价
      k['a'] = keys.l; k['d'] = keys.r;
      k['w'] = keys.u; k['s'] = keys.d;
    }
    // ★ 应用完整 snapshot 到 game 对象（让 draw 看到录像画面）
    applySnapshot(game);
  }

  // 把当前 tick 的完整状态应用到 game 对象（in-place，不重建对象）
  function applySnapshot(game) {
    const tick = playbackData.ticks[playbackTick];
    if (!tick) return;
    // Player
    if (game.player && tick.player) {
      game.player.x = tick.player.x;
      game.player.y = tick.player.y;
      game.player.hp = tick.player.hp;
      game.player.bombs = tick.player.bombs;
      game.player.score = tick.player.score;
      game.player.combo = tick.player.combo;
      game.player.comboT = tick.player.comboT;
      game.player.weaponLevel = tick.player.weaponLevel;
      game.player.shieldT = tick.player.shieldT;
      game.player.invulT = tick.player.invulT;
    }
    // Enemies：调整 game.enemies 数组长度
    syncArray(game.enemies, tick.enemies || [], e => {
      e.x = e.snap.x; e.y = e.snap.y;
      e.hp = e.snap.hp; e.maxHp = e.snap.maxHp;
      e.vx = e.snap.vx; e.vy = e.snap.vy;
      e.t = e.snap.t2; e.flashT = e.snap.fT;
    });
    // Enemy bullets
    syncArray(game.enemyBullets, tick.enemyBullets || [], b => {
      b.x = b.snap.x; b.y = b.snap.y;
      b.vx = b.snap.vx; b.vy = b.snap.vy;
    });
    // Player bullets
    syncArray(game.playerBullets, tick.playerBullets || [], b => {
      b.x = b.snap.x; b.y = b.snap.y;
      b.vx = b.snap.vx; b.vy = b.snap.vy;
    });
    // Powerups
    syncArray(game.powerups, tick.powerups || [], p => {
      p.x = p.snap.x; p.y = p.snap.y;
    });
    // Boss
    if (tick.boss && game.boss) {
      game.boss.x = tick.boss.x;
      game.boss.y = tick.boss.y;
      game.boss.hp = tick.boss.hp;
      game.boss.maxHp = tick.boss.maxHp;
      game.boss.phase = tick.boss.phase;
      game.boss.t = tick.boss.t;
      game.boss.spin = tick.boss.spin;
    }
  }

  // 同步数组长度：扩展或截断，对每个对象用 updateFn 更新属性
  function syncArray(arr, snaps, updateFn) {
    // 截断多余的
    while (arr.length > snaps.length) arr.pop();
    // 扩展/更新
    for (let i = 0; i < snaps.length; i++) {
      const s = snaps[i];
      if (i < arr.length) {
        arr[i].snap = s;
        updateFn(arr[i]);
        arr[i].alive = true;
      } else {
        // 新建一个最小可用对象（draw 用得到）
        const obj = { snap: s, alive: true, x: s.x, y: s.y };
        // 复制必要字段
        if (s.vx !== undefined) { obj.vx = s.vx; obj.vy = s.vy; }
        if (s.t2 !== undefined) { obj.t = s.t2; obj.flashT = s.fT; }
        if (s.hp !== undefined) { obj.hp = s.hp; obj.maxHp = s.maxHp; obj.w = 30; obj.h = 30; obj.color = '#ff7777'; }
        if (s.kind !== undefined) { obj.kind = s.kind; obj.friendly = s.friendly; obj.r = s.r; obj.dmg = s.dmg; obj.life = s.life; obj.color = s.color; }
        if (s.dmg === undefined && s.kind === undefined) { obj.w = 22; obj.h = 22; obj.kind = s.kind; }
        arr.push(obj);
      }
    }
  }

  function getPlaybackTick() { return playbackTick; }
  function getPlaybackTotal() { return playbackData ? playbackData.ticks.length : 0; }
  function getCurrentTick() { return playbackData && playbackData.ticks[playbackTick] ? playbackData.ticks[playbackTick] : null; }

  // 控制输入
  function handleInput(key) {
    if (!playing) return;
    if (key === 'z' || key === 'Z' || key === ' ' || key === 'Enter') {
      // 每次按键都切换（依赖浏览器 keydown 重复事件来快速切换暂停/继续）
      playbackPause = !playbackPause;
    } else if (key === 'x' || key === 'X' || key === 'Escape') {
      stopPlayback();
    }
  }

  function clearKeyLock() { pausedKey = false; }

  return {
    startRecording, stopRecording, tickRecordFrame, isRecording,
    startPlayback, stopPlayback, tickPlayback, getPlaybackKeys, applySnapshot,
    isPlaying, isPaused, handleInput, clearKeyLock,
    getPlaybackTick, getPlaybackTotal, getCurrentTick,
  };
})();
