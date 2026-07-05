// levels.js - 关卡脚本：5大关，每关5波 + 1个Boss
const Levels = (() => {
  // 通用波次模式
  // 每波定义：{ type, count, delay, formation, ... }
  function lineFormation(y, n, spacing, type) {
    return { type: 'line', y, count: n, spacing, enemyType: type };
  }
  function vFormation(y, n, type) {
    return { type: 'v', y, count: n, enemyType: type };
  }
  function circleFormation(cx, cy, n, radius, type) {
    return { type: 'circle', cx, cy, count: n, radius, enemyType: type };
  }
  function diamondFormation(y, n, type) {
    return { type: 'diamond', y, count: n, enemyType: type };
  }

  // 5 大关
  const scripts = [
    // 关卡 1：基础训练（绿洲空域）
    {
      name: '第一关 · 绿洲空域',
      bg: '#0a1430',
      nebula: ['#1a3060', '#2a1850'],  // 蓝紫
      waves: [
        lineFormation(0, 6, 60, 'scout'),
        vFormation(0, 5, 'scout'),
        { type: 'mixed', groups: [
          lineFormation(0, 4, 70, 'scout'),
          vFormation(-100, 5, 'scout')
        ]},
        diamondFormation(0, 7, 'scout'),
        { type: 'sweep', count: 6, enemyType: 'fighter' }
      ],
      bossType: 'fighter',
      bossLabel: '守护者 · 蓝隼',
    },
    // 关卡 2：火力升级
    {
      name: '第二关 · 钢铁前线',
      bg: '#1a0a20',
      nebula: ['#3a1040', '#551030'],  // 暗紫红
      waves: [
        lineFormation(0, 8, 55, 'scout'),
        vFormation(0, 7, 'fighter'),
        circleFormation(270, 80, 8, 100, 'scout'),
        { type: 'mixed', groups: [
          lineFormation(0, 5, 60, 'fighter'),
          vFormation(-100, 5, 'scout')
        ]},
        { type: 'sweep', count: 8, enemyType: 'fighter' }
      ],
      bossType: 'tank',
      bossLabel: '重型机甲 · 铁壁',
    },
    // 关卡 3：神风特攻
    {
      name: '第三关 · 神风烈焰',
      bg: '#200a0a',
      nebula: ['#4a1a08', '#6a2008'],  // 火红
      waves: [
        { type: 'kamikaze', enemyType: 'kamikaze', count: 12, delay: 0.3 },
        { type: 'kamikaze', enemyType: 'kamikaze', count: 14, delay: 0.25 },
        { type: 'mixed', groups: [
          { type: 'kamikaze', enemyType: 'kamikaze', count: 8, delay: 0.4 },
          lineFormation(0, 4, 70, 'tank')
        ]},
        { type: 'kamikaze', enemyType: 'kamikaze', count: 16, delay: 0.2 },
        { type: 'mixed', groups: [
          { type: 'kamikaze', enemyType: 'kamikaze', count: 10, delay: 0.3 },
          vFormation(-100, 5, 'fighter')
        ]}
      ],
      bossType: 'kamikaze',
      bossLabel: '神风王 · 烈焰',
    },
    // 关卡 4：高速截击
    {
      name: '第四关 · 极光风暴',
      bg: '#0a1a30',
      nebula: ['#0a3060', '#0a5040'],  // 青绿极光
      waves: [
        circleFormation(270, 80, 10, 120, 'sweeper'),
        { type: 'mixed', groups: [
          lineFormation(0, 6, 55, 'sweeper'),
          vFormation(-100, 5, 'fighter')
        ]},
        circleFormation(270, 100, 12, 130, 'sweeper'),
        { type: 'sweep', count: 10, enemyType: 'sweeper' },
        { type: 'mixed', groups: [
          circleFormation(150, 80, 6, 90, 'sweeper'),
          circleFormation(390, 80, 6, 90, 'sweeper')
        ]}
      ],
      bossType: 'tank',
      bossLabel: '暴风要塞 · 天雷',
    },
    // 关卡 5：最终决战
    {
      name: '第五关 · 终极决战',
      bg: '#20051a',
      nebula: ['#3a0a30', '#1a0530'],  // 深紫
      waves: [
        { type: 'mixed', groups: [
          lineFormation(0, 5, 60, 'tank'),
          vFormation(-100, 5, 'sweeper')
        ]},
        circleFormation(270, 80, 12, 130, 'fighter'),
        { type: 'mixed', groups: [
          { type: 'kamikaze', enemyType: 'kamikaze', count: 10, delay: 0.3 },
          lineFormation(0, 6, 60, 'tank')
        ]},
        { type: 'mixed', groups: [
          circleFormation(150, 80, 8, 100, 'sweeper'),
          circleFormation(390, 80, 8, 100, 'sweeper')
        ]},
        { type: 'final_assault', groups: [
          { type: 'kamikaze', enemyType: 'kamikaze', count: 16, delay: 0.18 },
          { type: 'sweep', count: 8, enemyType: 'tank' }
        ]}
      ],
      bossType: 'tank',
      bossLabel: '母舰核心 · 终末',
    }
  ];

  // 波次执行器
  class WaveRunner {
    constructor(script, levelIdx, game) {
      this.script = script;
      this.waveIdx = 0;
      this.spawnQueue = [];   // 待生成队列 { x, y, type, delay }
      this.spawnT = 0;
      this.betweenT = 2.0;   // 波间间隔
      this.bossActive = false;
      this.levelIdx = levelIdx;
      this.game = game;
      this.waveComplete = false;
      this.allComplete = false;
      this.totalWaves = script.waves.length;
      this.waveStarted = false;
    }
    startNextWave() {
      if (this.waveIdx >= this.totalWaves) {
        this.allComplete = true;
        return;
      }
      this.waveStarted = true;
      // 关键：每波独立计时。spawnT 在波间被 update(dt) 累加，若不重置
      // 上一波结束时的 spawnT(≈1.x s) + betweenT(1.5s) 将超过下一波所有
      // delay，导致线列/V形/菱形等编队一次性全部刷出，丧失节奏。
      this.spawnT = 0;
      const w = this.script.waves[this.waveIdx];
      this.buildSpawnQueue(w);
      this.waveIdx++;
    }
    buildSpawnQueue(w) {
      const W = this.game.W;
      if (!w) return;
      if (w.type === 'line') {
        const totalW = (w.count - 1) * w.spacing;
        const startX = W / 2 - totalW / 2;
        for (let i = 0; i < w.count; i++) {
          this.spawnQueue.push({ x: startX + i * w.spacing, y: w.y, type: w.enemyType, delay: i * 0.18 });
        }
      } else if (w.type === 'v') {
        for (let i = 0; i < w.count; i++) {
          const d = i - (w.count - 1) / 2;
          this.spawnQueue.push({ x: W/2 + d * 60, y: w.y - Math.abs(d) * 25, type: w.enemyType, delay: i * 0.15 });
        }
      } else if (w.type === 'circle') {
        for (let i = 0; i < w.count; i++) {
          const a = i * Math.PI * 2 / w.count - Math.PI / 2;
          this.spawnQueue.push({ x: w.cx + Math.cos(a) * w.radius, y: w.cy + Math.sin(a) * w.radius, type: w.enemyType, delay: i * 0.1 });
        }
      } else if (w.type === 'diamond') {
        // V+V 反向
        const half = Math.ceil(w.count / 2);
        for (let i = 0; i < half; i++) {
          this.spawnQueue.push({ x: W/2 + (i - half/2) * 60, y: w.y - i * 30, type: w.enemyType, delay: i * 0.15 });
        }
        for (let i = 0; i < half; i++) {
          this.spawnQueue.push({ x: W/2 + (i - half/2) * 60, y: w.y + i * 30, type: w.enemyType, delay: (half + i) * 0.15 });
        }
      } else if (w.type === 'sweep') {
        for (let i = 0; i < w.count; i++) {
          this.spawnQueue.push({ x: (i % 2 === 0) ? 50 : W - 50, y: 30 + Math.floor(i / 2) * 50, type: w.enemyType, delay: i * (w.delay || 0.5) });
        }
      } else if (w.type === 'kamikaze') {
        for (let i = 0; i < w.count; i++) {
          this.spawnQueue.push({ x: 30 + Math.random() * (W - 60), y: 30, type: w.enemyType, delay: i * (w.delay || 0.3) });
        }
      } else if (w.type === 'mixed' || w.type === 'final_assault') {
        // 多组同时，叠加 delay。递归处理前先记下起点
        const groups = w.groups || [];
        const beforeLen = this.spawnQueue.length;
        let baseDelay = 0;
        for (const g of groups) {
          const tmp = this.spawnQueue.length;
          this.buildSpawnQueue(g);
          for (let i = tmp; i < this.spawnQueue.length; i++) this.spawnQueue[i].delay += baseDelay;
          let maxD = 0;
          for (let i = tmp; i < this.spawnQueue.length; i++) maxD = Math.max(maxD, this.spawnQueue[i].delay);
          baseDelay += maxD + 0.5;
        }
        return;
      }
    }
    update(dt) {
      this.spawnT += dt;
      // 出怪
      for (let i = this.spawnQueue.length - 1; i >= 0; i--) {
        if (this.spawnT >= this.spawnQueue[i].delay) {
          const s = this.spawnQueue[i];
          // 难度数量缩放：countMul<1 概率跳过；>1 概率复制
          const diff = (window.Difficulty ? window.Difficulty.get() : null) || { enemyCountMul: 1 };
          let shouldSpawn = true;
          if (diff.enemyCountMul < 1 && Math.random() > diff.enemyCountMul) {
            shouldSpawn = false;  // 减少敌机
          }
          if (shouldSpawn) {
            const e = new Enemy(s.x - 14, s.y, s.type);
            // 难度缩放（关卡 + 全局难度）
            const levelDiff = 1 + this.levelIdx * 0.18;
            e.hp = Math.floor(e.hp * levelDiff * diff.enemyHpMul);
            e.maxHp = e.hp;
            e.score = Math.floor(e.score * (1 + this.levelIdx * 0.2) * diff.scoreMul);
            this.game.enemies.push(e);
            // 数量过多 (>1)：有概率额外复制
            if (diff.enemyCountMul > 1 && Math.random() < (diff.enemyCountMul - 1)) {
              const e2 = new Enemy(s.x - 14 + (Math.random() - 0.5) * 30, s.y, s.type);
              e2.hp = e.hp; e2.maxHp = e.hp; e2.score = e.score;
              this.game.enemies.push(e2);
            }
          }
          this.spawnQueue.splice(i, 1);
        }
      }
      // 判波次完成：spawnQueue 空 + 屏幕无敌人
      if (this.waveStarted && this.spawnQueue.length === 0 && this.game.enemies.length === 0) {
        if (!this.waveComplete) {
          this.waveComplete = true;
          this.betweenT = 1.5;
        }
      }
      if (this.waveComplete) {
        this.betweenT -= dt;
        if (this.betweenT <= 0) {
          if (this.waveIdx >= this.totalWaves) {
            // 全部波次完成，交给 Game 触发 Boss
            this.allComplete = true;
            this.waveComplete = false;
          } else {
            // ★ 修复：直接启动下一波，避免外层 reset 状态后无人调用
            // startNextWave 的死锁 Bug（之前会让游戏永远卡在 betweenT 之后）
            this.startNextWave();
          }
        }
      }
    }
    isClear() { return this.allComplete; }
  }

  return { scripts, WaveRunner };
})();
// 同其他模块：显式挂到 window
window.Levels = Levels;
