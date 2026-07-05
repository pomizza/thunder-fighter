/**
 * test-shop.cjs - Shop 模块测试
 */
const { loadModules } = require('./runner.cjs');

describe('Shop 模块', () => {
  it('包含 4 个商品', () => {
    const { modules } = loadModules();
    const S = modules.Shop;
    check('items 长度=4', S.items.length === 4);
  });

  it('商品包含 HP/bomb/weapon/shield', () => {
    const { modules } = loadModules();
    const S = modules.Shop;
    check('有 hp', S.items.some(i => i.id === 'hp'));
    check('有 bomb', S.items.some(i => i.id === 'bomb'));
    check('有 weapon', S.items.some(i => i.id === 'weapon'));
    check('有 shield', S.items.some(i => i.id === 'shield'));
  });

  it('每个商品有 cost/desc/canBuy', () => {
    const { modules } = loadModules();
    const S = modules.Shop;
    for (const it of S.items) {
      check(`${it.id} 有 cost`, typeof it.cost === 'number' && it.cost > 0);
      check(`${it.id} 有 desc`, typeof it.desc === 'string' && it.desc.length > 0);
    }
  });
});
