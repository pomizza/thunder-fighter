// achievements.js - 成就系统
const Achievements = (() => {
  // 成就定义
  const DEFS = [
    { id: 'first_blood',   name: '首杀',       desc: '击落第 1 架敌机',     icon: '★',     check: s => s.kills >= 1 },
    { id: 'combo_10',      name: '10 连击',     desc: '单局达成 10 连击',    icon: '★★',    check: s => s.comboMax >= 10 },
    { id: 'combo_25',      name: '25 连击',     desc: '单局达成 25 连击',    icon: '★★★',   check: s => s.comboMax >= 25 },
    { id: 'boss_1',        name: '首战告捷',   desc: '击败第 1 关 BOSS',    icon: '★★',    check: s => s.bossKills >= 1 },
    { id: 'boss_5',        name: '雷霆终结',   desc: '击败第 5 关 BOSS',    icon: '★★★★★', check: s => s.bossKills >= 5 },
    { id: 'score_10k',     name: '万分达成',   desc: '单局分数 ≥ 10000',   icon: '★★',    check: s => s.score >= 10000 },
    { id: 'score_50k',     name: '五万分达成', desc: '单局分数 ≥ 50000',   icon: '★★★★',  check: s => s.score >= 50000 },
    { id: 'collector',     name: '道具收藏家', desc: '单局拾取 ≥ 5 个道具', icon: '★★',    check: s => s.powerups >= 5 },
    { id: 'no_damage_boss', name: '完美 BOSS',  desc: 'BOSS 战不被打中',     icon: '★★★★',  check: s => s.bossNoDamage >= 1 },
    { id: 'all_hard',      name: '终极挑战',   desc: 'HARD 难度通关全 5 关', icon: '★★★★★', check: s => s.allHardComplete },
  ];

  // 已解锁成就（localStorage 持久化）
  let unlocked = {};

  // 浮动通知队列
  const notifications = [];  // [{name, icon, t}]
  const NOTIF_T = 2.5;  // 通知显示时长

  // 临时统计（每局重置）
  const stats = {
    kills: 0,
    comboMax: 0,
    bossKills: 0,
    score: 0,
    powerups: 0,
    bossNoDamage: 0,
    allHardComplete: false,
    // 用于 no_damage_boss 检测：当前 boss 是否被打中过
    currentBossHit: false,
  };

  function load() {
    try {
      const data = localStorage.getItem('thunder_ach');
      if (data) unlocked = JSON.parse(data) || {};
    } catch (e) { unlocked = {}; }
  }
  function save() {
    try { localStorage.setItem('thunder_ach', JSON.stringify(unlocked)); } catch (e) {}
  }
  load();

  // 重置每局统计（在 startGame 时调用）
  function resetStats() {
    stats.kills = 0;
    stats.comboMax = 0;
    stats.bossKills = 0;
    stats.score = 0;
    stats.powerups = 0;
    stats.bossNoDamage = 0;
    stats.allHardComplete = false;
    stats.currentBossHit = false;
  }

  // 检查并解锁（返回新解锁的成就数组）
  function check() {
    const newly = [];
    for (const def of DEFS) {
      if (unlocked[def.id]) continue;  // 已解锁跳过
      if (def.check(stats)) {
        unlocked[def.id] = { name: def.name, time: Date.now() };
        notifications.push({ name: def.name, icon: def.icon, t: NOTIF_T });
        newly.push(def);
      }
    }
    if (newly.length) save();
    return newly;
  }

  // 标记事件（在 game.js 关键点调用）
  function onKill(isBoss) {
    stats.kills++;
    if (isBoss) stats.bossKills++;
    check();
  }
  function onCombo(combo) {
    if (combo > stats.comboMax) stats.comboMax = combo;
    check();
  }
  function onScore(s) {
    stats.score = s;
    check();
  }
  function onPowerUp() {
    stats.powerups++;
    check();
  }
  function onBossStart() {
    stats.currentBossHit = false;
  }
  function onBossHit() {
    stats.currentBossHit = true;
  }
  function onBossDefeat() {
    if (!stats.currentBossHit) {
      stats.bossNoDamage = (stats.bossNoDamage || 0) + 1;
    }
    check();
  }
  function onAllHardComplete() {
    stats.allHardComplete = true;
    check();
  }

  // 通知更新（每帧调用）
  function update(dt) {
    for (let i = notifications.length - 1; i >= 0; i--) {
      notifications[i].t -= dt;
      if (notifications[i].t <= 0) notifications.splice(i, 1);
    }
  }

  // 绘制通知（屏幕中上方）
  function drawNotifications(ctx, W) {
    if (notifications.length === 0) return;
    const n = notifications[0];  // 只显示最新一个（多则堆叠但主要看最新）
    const baseY = 80;
    ctx.save();
    ctx.textAlign = 'center';
    // 背景
    ctx.fillStyle = 'rgba(0,0,20,0.85)';
    const w = 280, h = 60;
    ctx.fillRect(W/2 - w/2, baseY, w, h);
    ctx.strokeStyle = '#ffdd66';
    ctx.lineWidth = 2;
    ctx.strokeRect(W/2 - w/2, baseY, w, h);
    // 标题
    ctx.fillStyle = '#ffdd66';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('★ 成就解锁 ★', W/2, baseY + 18);
    // 名称
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(n.icon + '  ' + n.name, W/2, baseY + 42);
    ctx.restore();
  }

  // 暴露
  return {
    DEFS, notifications,
    update, check, resetStats,
    onKill, onCombo, onScore, onPowerUp,
    onBossStart, onBossHit, onBossDefeat, onAllHardComplete,
    drawNotifications,
    isUnlocked: (id) => !!unlocked[id],
    getStats: () => stats,
  };
})();
// 显式挂到 window，原因同 ShipSelect：让 game.js 的 `if (window.Achievements ...)` 守卫生效
window.Achievements = Achievements;
