// config.js - 游戏全局配置常量
// 把分散在多文件的魔数集中管理，方便调整游戏参数
const Config = {
  // === 画布 ===
  W: 540,
  H: 780,

  // === 关卡间时序（★ 第 18 轮已部分提取，统一到这里）===
  LEVEL_INTRO_DELAY: 3.0,        // 关卡介绍画面停留时间
  LEVEL_CLEAR_DELAY: 0.8,        // Boss 死后 → Shop 弹出
  SHOP_PROTECT_INVUL: 3.0,       // Shop 期间玩家无敌时间
  NEXT_LEVEL_DELAY: 1.0,         // Shop 关闭后 → 下一关
  BOSS_ENTRY_DURATION: 1.0,      // Boss 入场动画时长（暂未使用）

  // === 性能上限（第 14 轮）===
  MAX_PARTICLES: 300,
  MAX_METEORS: 8,
  MAX_FLOAT_TEXTS: 20,
  MAX_SHOCKWAVES: 20,
  MAX_PLAYER_BULLETS: 100,
  MAX_ENEMY_BULLETS: 200,
  MAX_ENEMIES: 30,
  MAX_POWERUPS: 15,
  BULLET_OFFSCREEN_MARGIN: 50,   // 子弹出屏剔除边界
  PARTICLE_OFFSCREEN_MARGIN: 100,

  // === 玩家 ===
  PLAYER_BASE_HP: 5,
  PLAYER_BASE_BOMBS: 3,
  PLAYER_SPEED: 320,
  PLAYER_W: 32, PLAYER_H: 38,
  PLAYER_FIRE_RATE: 0.12,
  PLAYER_INVUL_AFTER_HIT: 1.5,
  PLAYER_INVUL_AFTER_RESPAWN: 2.0,
  PLAYER_SHIELD_AFTER_RESPAWN: 1.5,
  PLAYER_MAX_HP_CAP: 8,
  PLAYER_MAX_BOMBS: 5,
  PLAYER_WEAPON_MAX: 4,
  PLAYER_COMBO_WINDOW: 1.5,      // NORMAL 难度
  PLAYER_COMBO_MULT_CAP: 2,      // 上限 2x

  // === 敌机 ===
  ENEMY_FIRE_RATE_MULT: 1.0,
  ENEMY_KAMIKAZE_SPEED: 220,     // 攻击阶段速度
  ENEMY_KAMIKAZE_INBOUND_SPEED: 90, // 入轨速度
  POWERUP_DROP_RATE: 0.18,       // 18% 概率掉道具
  POWERUP_FALL_SPEED: 90,

  // === Boss ===
  BOSS_BASE_HP: 200,
  BOSS_PER_LEVEL_HP: 120,
  BOSS_BASE_SCORE: 5000,
  BOSS_PER_LEVEL_SCORE: 2000,
  BOSS_ENTRY_Y: 120,             // 入场目标 Y
  BOSS_DEATH_EXPLOSION: 60,      // 死亡爆炸粒子数
  BOSS_PHASE2_THRESHOLD: 0.35,   // HP 35% 进入狂暴
  BOSS_PHASE15_THRESHOLD: 0.7,   // HP 70% 进入强化
  BOSS_KAMIKAZE_COUNT: 60,       // Kamikaze boss 死亡粒子数
  BOSS_SWEEPER_COUNT: 80,        // Sweeper boss 死亡粒子数

  // === 玩家子弹 ===
  PLAYER_BULLET_SPEED_LV1: -560,
  PLAYER_BULLET_SPEED_LV2: -560,
  PLAYER_BULLET_SPEED_LV3: -620,
  PLAYER_BULLET_SPEED_LV4: -680,
  PLAYER_LASER_SPEED: -700,
  PLAYER_MISSILE_SPEED: -200,

  // === 炸弹 ===
  BOMB_RADIUS: 200,
  BOMB_DAMAGE: 20,
  BOMB_BOSS_DAMAGE: 30,
  BOMB_SCREEN_CLEAR: 999,

  // === 屏幕震动（第 6 轮）===
  SHAKE_ENEMY_KILL: 2,
  SHAKE_PLAYER_HIT: 6,
  SHAKE_BOSS_DEATH: 14,
  SHAKE_BOMB: 10,
  SHAKE_COMBO: 4,
  SHAKE_PLAYER_DEATH: 12,
  SHAKE_COMBO25: 6,
  SHAKE_COMBO50: 9,

  // === 爆炸 / 粒子 ===
  ENEMY_EXPLOSION_COUNT: 14,
  ENEMY_EXPLOSION_SPEED: 220,
  ENEMY_DEATH_SHOCKWAVE_R: 60,
  ENEMY_DEATH_SHOCKWAVE_SPEED: 500,
  PLAYER_DEATH_EXPLOSION: 40,
  PLAYER_DEATH_EXPLOSION_SPEED: 280,
  BOSS_DEATH_PARTICLE_SPEED: 360,

  // === 撞击伤害 ===
  ENEMY_RAM_DAMAGE: 3,            // 敌机撞玩家
  BOSS_RAM_RADIUS: 250,

  // === 弹道 ===
  ENEMY_BULLET_SPEED_AIM: 280,
  ENEMY_BULLET_SPEED_FAN: 220,
  ENEMY_BULLET_SPEED_KAMIKAZE: 200,

  // === 关卡缩放 ===
  LEVEL_HP_PER_LEVEL: 0.18,      // 每关敌机 HP × (1 + level * 0.18)
  LEVEL_SCORE_PER_LEVEL: 0.20,   // 每关敌机分数 × (1 + level * 0.2)

  // === HUD 位置 ===
  HUD_SCORE_X: 10, HUD_SCORE_Y: 18,
  HUD_HP_X: 230,
  HUD_BOMB_X: 340, HUD_BOMB_Y: 18,
  HUD_WEAPON_X: 440,
  HUD_LEVEL_X: 10,  // 关卡名（右对齐）

  // === 菜单布局 ===
  MENU_TITLE_Y: 220,
  MENU_START_Y: 360,  // 第一项 Y
  MENU_ITEM_DY: 50,   // 每项间距
  MENU_HIGH_SCORE_Y: 600,
  MENU_HINT_Y: 640,

  // === 关卡介绍 ===
  LEVEL_INTRO_BOX_H: 160,
  LEVEL_INTRO_BOX_Y_OFFSET: 80,

  // === GameOver / Victory ===
  GAMEOVER_TITLE_Y_OFFSET: 60,
  VICTORY_TITLE_Y_OFFSET: 60,
  REPLAY_HINT_Y_OFFSET: 78,
  RETURN_HINT_Y_OFFSET: 105,

  // === 触屏按钮位置 ===
  STICK_RADIUS: 60,
  STICK_DEAD_ZONE: 12,
  FIRE_BUTTON_R: 50,
  BOMB_BUTTON_R: 40,
  PAUSE_BUTTON_R: 22,

  // === 视觉参数 ===
  REPLAY_BADGE_Y: 56,
  REPLAY_BADGE_W: 100,
  NEXT_LEVEL_COUNTDOWN_BG_W: 260,
  NEXT_LEVEL_COUNTDOWN_Y: 100,

  // === Shop 动画 ===
  SHOP_NOTIF_DURATION: 2.5,      // 通知显示时长

  // === 敌机基础数据 (5 类) ===
  // 每类敌机的尺寸、血量、速度、射击速率、分数、颜色、移动模式
  ENEMY_TYPES: {
    scout: {
      w: 28, h: 30, hp: 2, vy: 130,
      color: '#ff7777', fireRate: 1.6, score: 50,
      pattern: 'down_then_sine',
    },
    fighter: {
      w: 34, h: 36, hp: 5, vy: 100,
      color: '#ffaa33', fireRate: 1.2, score: 100,
      pattern: 'aimed_shoot', aimed: true,
    },
    tank: {
      w: 44, h: 44, hp: 14, vy: 60,
      color: '#aa66ff', fireRate: 0.8, score: 250,
      pattern: 'tank', tankTop: 120,
    },
    sweeper: {
      w: 38, h: 40, hp: 8, vy: 80,
      color: '#66ffaa', fireRate: 1.0, score: 180,
      pattern: 'sweep',
    },
    kamikaze: {
      w: 26, h: 28, hp: 1, vy: 220,
      color: '#ff4477', fireRate: 0, score: 70,
      pattern: 'homing_kamikaze',
    },
  },

  // === 敌机移动模式速度 ===
  // 大部分敌机有 "down_then_sine" 模式，进入屏幕后正弦摆动
  ENEMY_PATTERNS: {
    // down_then_sine: y < 80 慢速进入，之后正弦摆动
    // 入轨速度 (上方未到 y=80 时)
    down_then_sine_entry_vy: 130,
    down_then_sine_oscillation_vy: 80,  // 进入屏幕后的纵向速度
    down_then_sine_oscillation_amp: 90,  // 横向正弦振幅
    down_then_sine_oscillation_speed: 2,  // 正弦速度系数

    // aimed_shoot: 减速后瞄准射击
    aimed_shoot_threshold_y: 100,
    aimed_shoot_vy: 100,
    aimed_shoot_vy_aiming: 30,  // 瞄准时的纵向速度
    aimed_shoot_vx_sine: 60,  // 横向正弦幅度
    aimed_shoot_sine_speed: 1.2,

    // tank: 缓慢下移，撞墙反弹
    tank_entry_vy: 60,
    tank_cruise_vy: 0,
    tank_cruise_vx: 90,
    tank_top_y: 100,
    tank_bounce_margin: 40,  // 撞墙距离

    // sweep: 直行到底后左右扫射
    sweep_entry_vy: 100,
    sweep_cruise_vy: 80,
    sweep_cruise_vy_after: 0,  // 到底后停止
    sweep_vx: 90,
    sweep_threshold_y: 100,
    sweep_sine_vx: 50,
    sweep_sine_speed: 3,

    // homing_kamikaze: 锁定玩家俯冲
    kamikaze_vy_top: 90,  // y<100 时慢速
    kamikaze_sine_amp: 50,
    kamikaze_sine_speed: 3,
    kamikaze_chase_vy: 90,  // 攻击时纵向速度
    kamikaze_threshold_y: 100,
  },

  // === Boss 公式 ===
  BOSS_BASE_HP: 200,           // 基础 HP
  BOSS_HP_PER_LEVEL: 120,      // 每关增加 HP
  BOSS_BASE_SCORE: 5000,
  BOSS_SCORE_PER_LEVEL: 2000,

  // === Boss 阶段切换阈值 ===
  BOSS_PHASE_2_THRESHOLD: 0.35,  // HP < 35% 进入狂暴
  BOSS_PHASE_1_5_THRESHOLD: 0.7, // HP < 70% 提示
  BOSS_SHAKE_ON_PHASE2: 8,        // 阶段2 震屏幅度
  BOSS_SHAKE_DUR_ON_PHASE2: 0.4,  // 阶段2 震屏时长

  // === 敌机默认（无 type 时） ===
  ENEMY_DEFAULT: {
    w: 24, h: 26, hp: 1, vy: 100,
    color: '#ffffff', fireRate: 1.0, score: 30,
    pattern: 'straight',
  },
};
// 显式挂到 window
window.Config = Config;
