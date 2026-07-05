/**
 * test-difficulty.cjs - Difficulty 模块测试
 */
const { loadModules } = require('./runner.cjs');

describe('Difficulty 模块', () => {
  it('包含 3 档难度', () => {
    const { modules } = loadModules();
    const D = modules.Difficulty;
    check('3 档 in ORDER', D.ORDER.length === 3);
    check('EASY 存在', 'EASY' in D.LEVELS);
    check('NORMAL 存在', 'NORMAL' in D.LEVELS);
    check('HARD 存在', 'HARD' in D.LEVELS);
  });

  it('NORMAL 默认值', () => {
    const { modules } = loadModules();
    const D = modules.Difficulty;
    D.set('NORMAL');
    const cur = D.get();
    check('hp=5', cur.hp === 5);
    check('bombs=3', cur.bombs === 3);
    check('enemyHpMul=1.0', cur.enemyHpMul === 1.0);
  });

  it('EASY 简单化', () => {
    const { modules } = loadModules();
    const D = modules.Difficulty;
    D.set('EASY');
    const cur = D.get();
    check('hp>5', cur.hp > 5);
    check('bombs>3', cur.bombs > 3);
    check('enemyHpMul<1.0', cur.enemyHpMul < 1.0);
  });

  it('HARD 难化', () => {
    const { modules } = loadModules();
    const D = modules.Difficulty;
    D.set('HARD');
    const cur = D.get();
    check('hp<5', cur.hp < 5);
    check('enemyHpMul>1.0', cur.enemyHpMul > 1.0);
    check('scoreMul>1.0', cur.scoreMul > 1.0);
  });

  it('next/prev 循环切换', () => {
    const { modules } = loadModules();
    const D = modules.Difficulty;
    D.set('NORMAL');
    D.next();
    check('NORMAL->HARD', D.getId() === 'HARD');
    D.next();
    check('HARD->EASY', D.getId() === 'EASY');
    D.prev();
    check('EASY->HARD', D.getId() === 'HARD');
  });
});
