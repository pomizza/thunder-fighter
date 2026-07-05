// gameLogic.js - 游戏 update 核心逻辑
// 把 game.js update() 中的游戏逻辑块提取到这里
const GameLogic = (() => {

  // 玩家更新（移动、射击、连击）
  function updatePlayer(g, dt) {
    if (g.player) g.player.update(dt);
  }

  // 炸弹更新 + 过滤
  function updateBombs(g, dt) {
    for (const b of g.activeBombs) b.update(dt);
    g.activeBombs = g.activeBombs.filter(b => b.alive);
  }

  // 子弹更新 + 离屏剔除 + 硬上限
  function updateBullets(g, dt) {
    for (const b of g.playerBullets) b.update(dt);
    for (const b of g.enemyBullets) b.update(dt);
    // ★ 性能：离屏剔除 + 硬上限
    const W = g.W, H = g.H;
    g.playerBullets = g.playerBullets.filter(b =>
      b.alive && b.x > -50 && b.x < W + 50 && b.y > -50 && b.y < H + 50
    );
    g.enemyBullets = g.enemyBullets.filter(b =>
      b.alive && b.x > -50 && b.x < W + 50 && b.y > -50 && b.y < H + 50
    );
    const C = window.Config;
    if (g.playerBullets.length > C.MAX_PLAYER_BULLETS) {
      g.playerBullets.splice(0, g.playerBullets.length - C.MAX_PLAYER_BULLETS);
    }
    if (g.enemyBullets.length > C.MAX_ENEMY_BULLETS) {
      g.enemyBullets.splice(0, g.enemyBullets.length - C.MAX_ENEMY_BULLETS);
    }
  }

  // 敌机更新 + 过滤 + 硬上限
  function updateEnemies(g, dt) {
    for (const e of g.enemies) e.update(dt, g);
    g.enemies = g.enemies.filter(e => e.alive);
    const C = window.Config;
    if (g.enemies.length > C.MAX_ENEMIES) {
      g.enemies.splice(0, g.enemies.length - C.MAX_ENEMIES);
    }
  }

  // 道具更新 + 玩家拾取
  function updatePowerups(g, dt) {
    for (const p of g.powerups) p.update(dt);
    g.powerups = g.powerups.filter(p => p.alive);
    const C = window.Config;
    if (g.powerups.length > C.MAX_POWERUPS) {
      g.powerups.splice(0, g.powerups.length - C.MAX_POWERUPS);
    }
    // 玩家拾取（死亡期间不拾取：避免复活凭空得到 buff）
    if (g.player && g.player.alive) {
      for (const p of g.powerups) {
        if (!p.alive) continue;
        if (Utils.hitRect(
          { x: g.player.x, y: g.player.y, w: g.player.w, h: g.player.h },
          { x: p.x, y: p.y, w: p.w, h: p.h }
        )) {
          g.player.applyPowerUp(p.kind);
          p.alive = false;
          if (window.Achievements) Achievements.onPowerUp();
        }
      }
    }
  }

  // 碰撞检测：玩家子弹 vs 敌机/Boss + 敌弹/敌机 vs 玩家
  function checkCollisions(g) {
    // 玩家子弹 vs 敌机
    for (const b of g.playerBullets) {
      if (!b.alive || !b.friendly) continue;
      for (const e of g.enemies) {
        if (!e.alive) continue;
        if (Utils.hitCircleRect(b.x, b.y, b.r, e.x, e.y, e.w, e.h)) {
          e.hit(b.dmg);
          if (!e.alive) g.onEnemyKilled(e);
          Effects.spawnSparks(b.x, b.y, '#ffff66', 4);
          b.alive = false;
          break;
        }
      }
    }
    // 玩家子弹 vs Boss
    if (g.boss && g.boss.alive) {
      for (const b of g.playerBullets) {
        if (!b.alive || !b.friendly) continue;
        if (Utils.hitCircleRect(b.x, b.y, b.r, g.boss.x, g.boss.y, g.boss.w, g.boss.h)) {
          g.boss.hit(b.dmg);
          Effects.spawnSparks(b.x, b.y, '#ffff66', 3);
          b.alive = false;
          if (window.Achievements) Achievements.onBossHit();
        }
      }
    }
    // 敌弹 vs 玩家 + 敌机 vs 玩家
    if (g.player) {
      for (const b of g.enemyBullets) {
        if (!b.alive || b.friendly) continue;
        if (Utils.hitCircleRect(b.x, b.y, b.r, g.player.x, g.player.y, g.player.w, g.player.h)) {
          g.player.takeHit();
          b.alive = false;
        }
      }
      for (const e of g.enemies) {
        if (!e.alive) continue;
        if (Utils.hitRect(
          { x: g.player.x, y: g.player.y, w: g.player.w, h: g.player.h },
          { x: e.x, y: e.y, w: e.w, h: e.h }
        )) {
          g.player.takeHit();
          e.hit(3);
          if (!e.alive) g.onEnemyKilled(e);
        }
      }
    }
  }

  // 波次推进
  function updateWave(g, dt) {
    if (g.waveRunner && !g.boss && g.state === 'playing') {
      g.waveRunner.update(dt);
      if (g.waveRunner.allComplete && !g.boss && !g.bossDefeatedThisLevel) {
        g.spawnBoss();
      }
    }
  }

  // Boss 死亡处理
  function handleBossDeath(g) {
    if (!g.boss || g.boss.alive) return;
    // ★ 状态守卫：玩家死亡时清理 boss + gameOver
    if (!g.player || g.player.lives < 0 || g.state === 'gameover') {
      g.boss = null;
      g.bossDefeatedThisLevel = true;
      if (g.state !== 'gameover' && g.player && g.player.lives < 0) {
        g.gameOver();
      }
      return;
    }
    // 正常 Boss 死亡流程
    Effects.spawnExplosion(g.boss.x + g.boss.w/2, g.boss.y + g.boss.h/2, g.boss.color, 60, 360);
    Effects.spawnShockwave(g.boss.x + g.boss.w/2, g.boss.y + g.boss.h/2, '#ffffee', 300, 700);
    Effects.shakeScaled(14, 0.6);
    Audio.bigExplosion();
    // Boss 击杀走连击系统
    const bossAsEnemy = {
      x: g.boss.x, y: g.boss.y, w: g.boss.w, h: g.boss.h,
      score: g.boss.score, color: g.boss.color
    };
    g.player.onKill(bossAsEnemy);
    // 成就
    if (window.Achievements) {
      Achievements.onKill(true);
      Achievements.onBossDefeat();
      if (g.levelIdx === 4 && window.Difficulty && Difficulty.getId() === 'HARD') {
        Achievements.onAllHardComplete();
      }
    }
    // 掉落 3 个道具
    for (let i = 0; i < 3; i++) {
      const kinds = ['weapon', 'bomb', 'shield', 'heal'];
      const k = Utils.choice(kinds);
      g.powerups.push(new PowerUp(g.boss.x + 20 + i * 40, g.boss.y + g.boss.h/2, k, g.H));
    }
    // 清理残留敌弹
    for (const b of g.enemyBullets) b.alive = false;
    g.enemyBullets.length = 0;
    g.boss = null;
    g.bossDefeatedThisLevel = true;
    // Shop 期间无敌
    if (g.player) {
      g.player.invulT = Math.max(g.player.invulT || 0, g.SHOP_PROTECT_INVUL);
      g.player.shieldT = 0;
    }
    // 状态切换
    g.state = 'levelClear';
    g.levelClearT = 0;
    g.nextLevelCountdown = 0;
    // 延迟打开 Shop
    setTimeout(() => {
      if (g.state === 'levelClear' && g.player && g.player.alive
          && g.player.lives >= 0 && g.state !== 'gameover' && window.Shop) {
        g.player.invulT = Math.max(g.player.invulT || 0, g.SHOP_PROTECT_INVUL);
        Shop.open(g.player, () => {
          g.nextLevelCountdown = g.NEXT_LEVEL_DELAY;
        });
      } else if (g.state === 'levelClear') {
        g.gameOver();
      }
    }, g.LEVEL_CLEAR_DELAY * 1000);
  }

  // 完整 update（playing 状态的所有游戏逻辑）
  function updateGameplay(g, dt) {
    updatePlayer(g, dt);
    updateBombs(g, dt);
    updateBullets(g, dt);
    updateEnemies(g, dt);
    if (g.boss) {
      g.boss.update(dt, g);
      if (!g.boss.alive) {
        handleBossDeath(g);
        return;
      }
    }
    updatePowerups(g, dt);
    checkCollisions(g);
    updateWave(g, dt);
  }

  return { updateGameplay, handleBossDeath };
})();
window.GameLogic = GameLogic;
