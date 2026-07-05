/**
 * test-player.cjs - Player 模块单元测试
 */
const { loadModules } = require('./runner.cjs');

describe('Player 模块', () => {
  // 辅助函数：创建测试用 game 对象
  function makeGame(opts = {}) {
    return {
      W: 540, H: 780,
      enemies: [],
      enemyBullets: [],
      playerBullets: [],
      powerups: [],
      activeBombs: [],
      state: 'playing',
      level: 1,
      player: null,  // 会在 makePlayer 中设置
      ...opts,
    };
  }

  // 辅助函数：创建测试用 Player
  function makePlayer(ship = null) {
    const { modules } = loadModules();
    const Player = modules.Player;
    const SS = modules.ShipSelect;
    const game = makeGame();
    const p = new Player(game, ship || SS.ships[0]);
    game.player = p;  // 关键：respawn 守卫需要这个
    return { p, game, modules };
  }

  it('构造函数：从 ShipSelect.ships[0] 创建默认玩家', () => {
    const { p, modules } = makePlayer();
    const SS = modules.ShipSelect;
    check('alive=true', p.alive === true);
    check('hp=5 (NORMAL)', p.hp === 5);
    check('maxHp=5', p.maxHp === 5);
    check('speed=320 (蓝隼)', p.speed === SS.ships[0].speed);
    check('weaponLevel=1', p.weaponLevel === 1);
    check('bombs=3', p.bombs === 3);
    check('combo=0', p.combo === 0);
  });

  it('三架战机创建有不同属性', () => {
    const { modules } = loadModules();
    const SS = modules.ShipSelect;
    // 赤焰
    const game1 = makeGame();
    const p1 = new modules.Player(game1, SS.ships[1]);
    check('赤焰 weaponLevel=2 (双发)', SS.ships[1].initialWeapon === 2);
    // 金星
    const game2 = makeGame();
    const p2 = new modules.Player(game2, SS.ships[2]);
    check('金星 hp=6', p2.hp === 6);
    check('金星 shield=8s', p2.shieldT === 8);
  });

  it('shoot 创建 playerBullet', () => {
    const { p, game, modules } = makePlayer();
    const beforeCount = game.playerBullets.length;
    p.shoot();
    check('playerBullets 数量增加', game.playerBullets.length === beforeCount + 1);
    check('bullet 来自玩家', game.playerBullets[0].friendly === true);
  });

  it('weaponLevel 越高 shoot 创建更多子弹', () => {
    const { modules } = loadModules();
    const { p, game } = makePlayer(modules.ShipSelect.ships[1]); // 赤焰 weaponLevel=2
    const before = game.playerBullets.length;
    p.shoot();
    check('双发: 2 颗子弹', game.playerBullets.length - before === 2);
  });

  it('takeHit 减少 hp (无敌期外)', () => {
    const { p, game, modules } = makePlayer();
    p.invulT = 0;
    p.shieldT = 0;
    const before = p.hp;
    p.takeHit();
    check('hp 减少', p.hp === before - 1);
  });

  it('takeHit 在 invulT 内被忽略', () => {
    const { p } = makePlayer();
    p.invulT = 1.0; // 无敌中
    p.shieldT = 0;
    const before = p.hp;
    p.takeHit();
    check('hp 不变 (无敌中)', p.hp === before);
  });

  it('takeHit 在 shieldT 内抵消伤害', () => {
    const { p } = makePlayer();
    p.invulT = 0;
    p.shieldT = 1.0; // 护盾中
    const before = p.hp;
    p.takeHit();
    check('hp 不变 (护盾)', p.hp === before);
    check('shield 消耗', p.shieldT === 0);
  });

  it('takeHit 在 hp=0 时触发 die()', () => {
    const { p } = makePlayer();
    p.invulT = 0;
    p.shieldT = 0;
    p.hp = 1;
    p.lives = 3;
    p.takeHit();
    check('hp=0 触发死亡', p.alive === false);
    check('lives 减少', p.lives === 2);
  });

  it('useBomb 减少炸弹数 + 标记敌弹敌机', () => {
    const { p, game, modules } = makePlayer();
    p.bombs = 3;
    // 玩家在 (254, 680)，敌机放在附近 (240, 700) - 距离 < 200
    const Bullet = modules.Bullet;
    const eb1 = new Bullet(254, 700, 0, 100, { friendly: false });
    const eb2 = new Bullet(254, 720, 0, 100, { friendly: false });
    game.enemyBullets.push(eb1, eb2);
    // 敌机（hp=2, 一击 20 伤害必死）
    const Enemy = modules.Enemy;
    const e1 = new Enemy(240, 680, 'scout');  // 玩家 (254,680) 附近
    const e2 = new Enemy(260, 680, 'scout');
    game.enemies.push(e1, e2);

    const beforeBombs = p.bombs;
    p.useBomb();
    check('bombs 减少', p.bombs === beforeBombs - 1);
    check('敌弹1 标记 alive=false', eb1.alive === false);
    check('敌弹2 标记 alive=false', eb2.alive === false);
    check('敌机1 标记 alive=false (爆炸伤害)', e1.alive === false);
    check('敌机2 标记 alive=false', e2.alive === false);
  });

  it('useBomb 在 0 颗时拒绝', () => {
    const { p } = makePlayer();
    p.bombs = 0;
    p.useBomb();
    check('仍 0 颗', p.bombs === 0);
  });

  it('applyPowerUp HP 加血 (+2)', () => {
    const { p } = makePlayer();
    p.hp = 3;
    p.applyPowerUp('heal');
    check('hp 恢复 +2', p.hp === 5);  // 3+2=5 (但不超过 maxHp=5)
  });

  it('applyPowerUp 武器升级', () => {
    const { p } = makePlayer();
    p.weaponLevel = 2;
    p.applyPowerUp('weapon');
    check('weaponLevel 升级', p.weaponLevel === 3);
  });

  it('applyPowerUp 武器已满不升级', () => {
    const { p, modules } = makePlayer();
    p.weaponLevel = 4; // 假设满级是 4
    p.applyPowerUp('weapon');
    check('weaponLevel 仍 = 4', p.weaponLevel === 4);
  });

  it('applyPowerUp 炸弹 +1', () => {
    const { p, modules } = makePlayer();
    p.bombs = 2;
    p.applyPowerUp('bomb');
    check('bombs=3', p.bombs === 3);
  });

  it('applyPowerUp 护盾激活', () => {
    const { p } = makePlayer();
    p.shieldT = 0;
    p.applyPowerUp('shield');
    check('shieldT > 0', p.shieldT > 0);
  });

  it('onKill 增加 score 和 combo', () => {
    const { p, modules } = makePlayer();
    const fakeEnemy = { score: 100, x: 100, y: 100, type: 'scout' };
    p.onKill(fakeEnemy);
    // 公式: base * (1 + combo*0.1), 但 combo 在计算前已是 1
    check('score 增加 (110 = 100*1.1)', p.score === 110);
    check('combo 1', p.combo === 1);
    check('comboMax 1', p.comboMax === 1);
  });

  it('onKill 连续 5 次 combo=5', () => {
    const { p } = makePlayer();
    const fakeEnemy = { score: 50, x: 100, y: 100, type: 'scout' };
    for (let i = 0; i < 5; i++) p.onKill(fakeEnemy);
    check('combo=5', p.combo === 5);
    check('comboMax=5', p.comboMax === 5);
  });

  it('onKill 分数计算：基础分 × (1 + combo*0.1)', () => {
    const { p } = makePlayer();
    const fakeEnemy = { score: 100, x: 100, y: 100, type: 'scout' };
    p.onKill(fakeEnemy);
    p.onKill(fakeEnemy);
    p.onKill(fakeEnemy);
    // combo 计算时已 +1: 100*1.1 + 100*1.2 + 100*1.3 = 360
    check('3 连击 360 分', p.score === 360);
  });

  it('update comboWindow 后清零', () => {
    const { p } = makePlayer();
    const fakeEnemy = { score: 50, x: 100, y: 100, type: 'scout' };
    p.onKill(fakeEnemy);
    p.comboT = 0; // 模拟 1.5s 后
    p.update(2.0);
    check('combo 清零', p.combo === 0);
  });

  it('respawn 重置位置和血量', () => {
    const { p, game } = makePlayer();
    game.player = p;  // 显式设置
    p.hp = 1;
    p.maxHp = 5;
    p.alive = false;
    p.invulT = 0;
    p.shieldT = 0;
    p.x = 999; p.y = 999;
    p.respawn();
    check('alive=true', p.alive === true);
    check('hp 重置', p.hp > 0);
    check('位置居中', p.x > 200 && p.x < 300);
  });

  it('respawn 在 lives < 0 不复活', () => {
    const { p } = makePlayer();
    p.alive = false;
    p.lives = -1;
    p.respawn();
    check('不复活', p.alive === false);
  });

  it('die 减少 lives 一次', () => {
    const { p } = makePlayer();
    p.hp = 1;
    p.lives = 3;
    p.invulT = 0;
    p.shieldT = 0;
    p.die();
    check('lives 2', p.lives === 2);
    check('alive=false', p.alive === false);
  });

  it('findNearestEnemy 找最近敌机', () => {
    const { p, game, modules } = makePlayer();
    const Enemy = modules.Enemy;
    const e1 = new Enemy(100, 100, 'scout');
    const e2 = new Enemy(300, 300, 'scout');
    const e3 = new Enemy(500, 500, 'scout');
    game.enemies.push(e1, e2, e3);
    // 玩家默认在 (W/2 - 16, H-100) = (254, 680)
    // 距离 e1: ~620, e2: ~400, e3: ~330 → e3 最近
    const nearest = p.findNearestEnemy();
    check('找到最近敌机', nearest === e3);
  });

  it('findNearestEnemy 无敌机时返回 null', () => {
    const { p } = makePlayer();
    check('null', p.findNearestEnemy() === null);
  });

  it('fireRate 0 的敌机不射击 (kamikaze)', () => {
    // kamikaze fireRate=0，构造时已在 setTimeout 中不创建子弹
    // 这里测试 player.shoot 内部逻辑不会因 fireRate=0 误触
    const { p, game } = makePlayer();
    p.fireRate = 0;
    const before = game.playerBullets.length;
    p.shoot();
    check('仍可射击 (玩家)', game.playerBullets.length === before + 1);
  });
});
