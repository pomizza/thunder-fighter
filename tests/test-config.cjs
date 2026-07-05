/**
 * test-config.cjs - Config 模块测试
 */
const { loadModules } = require('./runner.cjs');

describe('Config 模块', () => {
  const { modules } = loadModules();
  const C = modules.Config;

  it('Config 存在', () => {
    check('Config 已加载', C !== undefined);
  });

  it('包含时序常量', () => {
    check('LEVEL_CLEAR_DELAY=0.8', C.LEVEL_CLEAR_DELAY === 0.8);
    check('SHOP_PROTECT_INVUL=3.0', C.SHOP_PROTECT_INVUL === 3.0);
    check('NEXT_LEVEL_DELAY=1.0', C.NEXT_LEVEL_DELAY === 1.0);
  });

  it('包含玩家基础常量', () => {
    check('PLAYER_BASE_HP=5', C.PLAYER_BASE_HP === 5);
    check('PLAYER_SPEED=320', C.PLAYER_SPEED === 320);
  });
});
