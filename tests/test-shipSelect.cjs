/**
 * test-shipSelect.cjs - ShipSelect 模块测试
 */
const { loadModules } = require('./runner.cjs');

describe('ShipSelect 模块', () => {
  it('包含 3 架战机', () => {
    const { modules } = loadModules();
    const SS = modules.ShipSelect;
    check('3 架战机', SS.ships.length === 3);
  });

  it('3 架战机有不同 id/颜色/速度', () => {
    const { modules } = loadModules();
    const SS = modules.ShipSelect;
    const ids = SS.ships.map(s => s.id).sort();
    check('blue/red/gold', JSON.stringify(ids) === JSON.stringify(['blue', 'gold', 'red']));
    const speeds = SS.ships.map(s => s.speed);
    check('速度不同', new Set(speeds).size === 3);
  });

  it('每架战机有完整属性', () => {
    const { modules } = loadModules();
    const SS = modules.ShipSelect;
    for (const ship of SS.ships) {
      check(`${ship.id} 有 name`, typeof ship.name === 'string');
      check(`${ship.id} 有 speed`, typeof ship.speed === 'number' && ship.speed > 0);
      check(`${ship.id} 有 color`, typeof ship.color === 'string');
      check(`${ship.id} 有 shape`, typeof ship.shape === 'string');
    }
  });

  it('API 完整', () => {
    const { modules } = loadModules();
    const SS = modules.ShipSelect;
    check('open 函数', typeof SS.open === 'function');
    check('close 函数', typeof SS.close === 'function');
    check('isActive 函数', typeof SS.isActive === 'function');
    check('handleInput 函数', typeof SS.handleInput === 'function');
    check('draw 函数', typeof SS.draw === 'function');
  });

  it('初始不在选机界面', () => {
    const { modules } = loadModules();
    const SS = modules.ShipSelect;
    check('不激活', SS.isActive() === false);
  });
});
