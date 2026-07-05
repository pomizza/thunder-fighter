/**
 * test-gameflow.cjs - 游戏流程集成测试
 */
const { loadModules } = require('./runner.cjs');

describe('游戏流程集成', () => {
  it('Game 类可实例化', () => {
    const { modules } = loadModules();
    const Game = modules.Game;
    const g = new Game();
    check('state 存在', typeof g.state === 'string');
    check('canvas 存在', g.cvs !== undefined);
  });

  it('5 关脚本', () => {
    const { modules } = loadModules();
    const L = modules.Levels;
    check('5 关', L.scripts.length === 5);
    check('第 1 关有绿洲', L.scripts[0].name.includes('绿洲'));
    check('第 5 关有终极', L.scripts[4].name.includes('终极'));
  });

  it('3 战机可选择', () => {
    const { modules } = loadModules();
    const SS = modules.ShipSelect;
    check('3 架', SS.ships.length === 3);
    const colors = SS.ships.map(s => s.id);
    check('blue/red/gold', colors.includes('blue') && colors.includes('red') && colors.includes('gold'));
  });

  it('Config 时序常量正确', () => {
    const { modules } = loadModules();
    const C = modules.Config;
    check('LEVEL_CLEAR_DELAY=0.8', C.LEVEL_CLEAR_DELAY === 0.8);
    check('SHOP_PROTECT_INVUL=3.0', C.SHOP_PROTECT_INVUL === 3.0);
  });

  it('Player 构造接收 ship 参数', () => {
    const { modules } = loadModules();
    const Player = modules.Player;
    const SS = modules.ShipSelect;
    const fakeGame = { W: 540, H: 780, enemies: [], enemyBullets: [], playerBullets: [], powerups: [], activeBombs: [] };
    const p = new Player(fakeGame, SS.ships[0]);
    check('hp=5', p.hp === 5);
    check('weaponLevel=1', p.weaponLevel === 1);
    check('alive=true', p.alive === true);
  });

  it('Boss 5 关 HP 递增', () => {
    const { modules } = loadModules();
    const Boss = modules.Boss;
    const hps = [];
    for (let i = 1; i <= 5; i++) {
      const b = new Boss(100, -100, i);
      hps.push(b.maxHp);
    }
    check('HP 递增', hps[1] > hps[0] && hps[2] > hps[1]);
  });
});
