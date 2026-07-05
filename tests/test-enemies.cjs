/**
 * test-enemies.cjs - Enemies 模块测试 (含 Config 集成)
 */
const { loadModules } = require('./runner.cjs');

describe('Enemies 模块（Config 集成）', () => {
  it('从 Config 读取 5 类敌机基础数据', () => {
    const { modules } = loadModules();
    const Config = modules.Config;
    check('Config.ENEMY_TYPES 存在', Config.ENEMY_TYPES !== undefined);
    check('5 类敌机', Object.keys(Config.ENEMY_TYPES).length === 5);
  });

  it('Config.ENEMY_TYPES.scout 字段完整', () => {
    const { modules } = loadModules();
    const scout = modules.Config.ENEMY_TYPES.scout;
    check('w=28', scout.w === 28);
    check('h=30', scout.h === 30);
    check('hp=2', scout.hp === 2);
    check('vy=130', scout.vy === 130);
    check('color=#ff7777', scout.color === '#ff7777');
    check('fireRate=1.6', scout.fireRate === 1.6);
    check('score=50', scout.score === 50);
    check('pattern=down_then_sine', scout.pattern === 'down_then_sine');
  });

  it('Config.ENEMY_TYPES.fighter 含 aimed 字段', () => {
    const { modules } = loadModules();
    const f = modules.Config.ENEMY_TYPES.fighter;
    check('aimed=true', f.aimed === true);
  });

  it('Config.ENEMY_TYPES.tank 含 tankTop 字段', () => {
    const { modules } = loadModules();
    const t = modules.Config.ENEMY_TYPES.tank;
    check('tankTop=120', t.tankTop === 120);
  });

  it('Config.ENEMY_TYPES.kamikaze fireRate=0', () => {
    const { modules } = loadModules();
    const k = modules.Config.ENEMY_TYPES.kamikaze;
    check('fireRate=0 (不射击)', k.fireRate === 0);
    check('hp=1 (一击必杀)', k.hp === 1);
  });

  it('Config.BOSS_HP 公式可调', () => {
    const { modules } = loadModules();
    const C = modules.Config;
    check('BOSS_BASE_HP=200', C.BOSS_BASE_HP === 200);
    check('BOSS_HP_PER_LEVEL=120', C.BOSS_HP_PER_LEVEL === 120);
    check('BOSS_BASE_SCORE=5000', C.BOSS_BASE_SCORE === 5000);
  });

  it('Config.BOSS_PHASE 阈值可调', () => {
    const { modules } = loadModules();
    const C = modules.Config;
    check('PHASE_2_THRESHOLD=0.35', C.BOSS_PHASE_2_THRESHOLD === 0.35);
    check('PHASE_1_5_THRESHOLD=0.7', C.BOSS_PHASE_1_5_THRESHOLD === 0.7);
  });

  it('Config.ENEMY_PATTERNS 含 down_then_sine 配置', () => {
    const { modules } = loadModules();
    const P = modules.Config.ENEMY_PATTERNS;
    check('entry_vy=130', P.down_then_sine_entry_vy === 130);
    check('oscillation_amp=90', P.down_then_sine_oscillation_amp === 90);
  });

  it('Enemy 构造能从 Config 创建 scout', () => {
    const { modules } = loadModules();
    const Enemy = modules.Enemy;
    const fakeGame = { W: 540, H: 780, enemies: [], enemyBullets: [], playerBullets: [], powerups: [] };
    const e = new Enemy(100, 30, 'scout');
    check('width=28', e.w === 28);
    check('height=30', e.h === 30);
    check('hp=2', e.hp === 2);
    check('color=#ff7777', e.color === '#ff7777');
    check('pattern=down_then_sine', e.pattern === 'down_then_sine');
  });

  it('Enemy 构造能从 Config 创建 kamikaze', () => {
    const { modules } = loadModules();
    const Enemy = modules.Enemy;
    const fakeGame = { W: 540, H: 780, enemies: [], enemyBullets: [], playerBullets: [], powerups: [] };
    const e = new Enemy(100, 30, 'kamikaze');
    check('hp=1 (一击必杀)', e.hp === 1);
    check('vy=220 (快速俯冲)', e.vy === 220);
    check('fireRate=0 (不射击)', e.fireRate === 0);
  });

  it('未知 type 使用 ENEMY_DEFAULT', () => {
    const { modules } = loadModules();
    const Enemy = modules.Enemy;
    const fakeGame = { W: 540, H: 780, enemies: [], enemyBullets: [], playerBullets: [], powerups: [] };
    const e = new Enemy(100, 30, 'unknown_type');
    check('使用默认 hp=1', e.hp === 1);
    check('使用默认 color', e.color !== undefined);
  });

  it('Boss 5 关 HP 用 Config 公式递增', () => {
    const { modules } = loadModules();
    const Boss = modules.Boss;
    const fakeGame = { W: 540, H: 780, enemies: [], enemyBullets: [], playerBullets: [], powerups: [] };
    const hps = [];
    for (let i = 1; i <= 5; i++) {
      const b = new Boss(100, -100, i);
      hps.push(b.maxHp);
    }
    // 验证递增（用 NORMAL 难度 = 1.0）
    check('关 1 < 关 2', hps[0] < hps[1]);
    check('关 2 < 关 3', hps[1] < hps[2]);
    check('关 5 > 关 1', hps[4] > hps[0]);
  });
});
