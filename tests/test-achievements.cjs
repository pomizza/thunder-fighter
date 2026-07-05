/**
 * test-achievements.cjs - Achievements 模块测试
 */
const { loadModules } = require('./runner.cjs');

describe('Achievements 模块', () => {
  it('包含 10 个成就', () => {
    const { modules } = loadModules();
    const A = modules.Achievements;
    check('DEFS 长度=10', A.DEFS.length === 10);
  });

  it('包含 first_blood 成就', () => {
    const { modules } = loadModules();
    const A = modules.Achievements;
    const fb = A.DEFS.find(d => d.id === 'first_blood');
    check('first_blood 存在', fb !== undefined);
    check('first_blood 有 check 函数', typeof fb.check === 'function');
  });

  it('包含 25 连击 + 完美 BOSS + 终极挑战', () => {
    const { modules } = loadModules();
    const A = modules.Achievements;
    check('combo_25 存在', A.DEFS.some(d => d.id === 'combo_25'));
    check('no_damage_boss 存在', A.DEFS.some(d => d.id === 'no_damage_boss'));
    check('all_hard 存在', A.DEFS.some(d => d.id === 'all_hard'));
  });

  it('resetStats 重置统计', () => {
    const { modules } = loadModules();
    const A = modules.Achievements;
    A.unlocked = {};
    A.resetStats();
    A.onKill(false);  // 1 杀
    A.onKill(false);  // 2 杀
    A.onCombo(5);     // 5 连击
    A.resetStats();
    // 重置后 first_blood 应仍 unlocked（已解锁的不会丢）
    check('resetStats 不抛错', true);
    check('已解锁的不丢', A.isUnlocked('first_blood') === true);
  });

  it('onKill 解锁 first_blood', () => {
    const { modules } = loadModules();
    const A = modules.Achievements;
    A.resetStats();
    A.unlocked = {};
    A.onKill(false);
    check('first_blood 解锁', A.isUnlocked('first_blood') === true);
  });

  it('onCombo 解锁 combo_10 和 combo_25', () => {
    const { modules } = loadModules();
    const A = modules.Achievements;
    A.resetStats();
    A.unlocked = {};
    A.onCombo(10);
    check('combo_10 解锁', A.isUnlocked('combo_10') === true);
    A.onCombo(25);
    check('combo_25 解锁', A.isUnlocked('combo_25') === true);
  });

  it('通知系统：2.5s 消失', () => {
    const { modules } = loadModules();
    const A = modules.Achievements;
    A.resetStats();
    A.unlocked = {};
    A.onKill(false);
    check('通知队列非空', A.notifications.length >= 1);
    A.update(1.0);
    check('1s 后通知还在', A.notifications.length >= 1);
    A.update(2.0);
    check('3s 后通知清空', A.notifications.length === 0);
  });
});
