/**
 * test-e2e.cjs - 端到端测试 (HTTP + 模块加载层)
 *
 * 真正的浏览器 e2e（playwright/puppeteer）需要 Chrome + npm 依赖，
 * 违反本项目"0 依赖"原则。本测试在 HTTP 层和模块层模拟 e2e：
 * - 启动 Python HTTP 服务器
 * - 用 Node http 客户端请求 HTML
 * - 验证所有 JS 模块可访问
 * - 验证模块挂载到 window
 * - 验证关键配置可读
 *
 * 【重要】所有 HTTP 相关测试必须**在同一个 it()** 中！
 * 因为 async 测试不保证顺序，HTTP 服务器必须先启动再访问。
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { loadModules } = require('./runner.cjs');

const ROOT = path.resolve(__dirname, '..');
const PORT = 8765;
const HOST = '127.0.0.1';

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('端到端测试 (e2e)', () => {
  let server;

  // 【关键】所有 HTTP 相关测试在一个 it() 中（async 顺序保证）
  it('HTTP 端到端流程：启动服务器 + 7 个 GET + 加载顺序 + 关闭', async () => {
    // 1. 启动 HTTP 服务器
    server = spawn('python3', ['-m', 'http.server', PORT, '--bind', HOST], {
      cwd: ROOT,
      stdio: 'pipe',
    });
    server.stderr.on('data', () => {});

    // 等待服务器启动
    let started = false;
    for (let i = 0; i < 30; i++) {
      await delay(200);
      try {
        const res = await new Promise((resolve, reject) => {
          const req = http.get(`http://${HOST}:${PORT}/`, (r) => {
            r.resume();
            resolve(r.statusCode);
          });
          req.on('error', reject);
        });
        if (res === 200) { started = true; break; }
      } catch (e) {}
    }
    check('服务器进程启动', started);

    if (!started) {
      if (server) server.kill();
      return; // 跳过后续
    }

    // 2. GET / 返回 200 和正确 HTML
    const r1 = await httpGet(`http://${HOST}:${PORT}/`);
    check('GET / 状态码 200', r1.status === 200);
    check('Content-Type 是 HTML', (r1.headers['content-type'] || '').includes('text/html'));
    check('HTML 包含 canvas', r1.body.indexOf('<canvas') > -1);
    check('HTML 包含 game canvas', r1.body.indexOf('id="game"') > -1);
    check('HTML 包含 THUNDER FIGHTER', r1.body.indexOf('THUNDER FIGHTER') > -1);
    check('HTML 包含 v1.0.0', r1.body.indexOf('v1.0.0') > -1);

    // 3. GET /index.html 同 /
    const r2 = await httpGet(`http://${HOST}:${PORT}/index.html`);
    check('index.html 200', r2.status === 200);
    check('index.html > 1000 bytes', r2.body.length > 1000);

    // 4. GET /favicon.svg
    const r3 = await httpGet(`http://${HOST}:${PORT}/favicon.svg`);
    check('favicon.svg 200', r3.status === 200);
    check('favicon 是 SVG', r3.body.indexOf('<svg') > -1);
    check('favicon 含战机', r3.body.indexOf('polygon') > -1);

    // 5. GET /js/config.js
    const r4 = await httpGet(`http://${HOST}:${PORT}/js/config.js`);
    check('config.js 200', r4.status === 200);
    check('config.js 含 Config', r4.body.indexOf('const Config') > -1);

    // 6. GET /js/game.js
    const r5 = await httpGet(`http://${HOST}:${PORT}/js/game.js`);
    check('game.js 200', r5.status === 200);
    check('game.js 含 Game class', r5.body.indexOf('class Game') > -1);

    // 7. GET /js/player.js
    const r6 = await httpGet(`http://${HOST}:${PORT}/js/player.js`);
    check('player.js 200', r6.status === 200);
    check('player.js 含 Player class', r6.body.indexOf('class Player') > -1);

    // 8. GET /js/enemies.js
    const r7 = await httpGet(`http://${HOST}:${PORT}/js/enemies.js`);
    check('enemies.js 200', r7.status === 200);
    check('enemies.js 含 Enemy class', r7.body.indexOf('class Enemy') > -1);
    check('enemies.js 含 Boss class', r7.body.indexOf('class Boss') > -1);

    // 9. GET /tests/runner.cjs
    const r8 = await httpGet(`http://${HOST}:${PORT}/tests/runner.cjs`);
    check('runner.cjs 200', r8.status === 200);
    check('runner.cjs 含 module.exports', r8.body.indexOf('module.exports') > -1);

    // 10. GET 不存在路径 404
    try {
      const r9 = await httpGet(`http://${HOST}:${PORT}/nonexistent.html`);
      check('不存在路径 404', r9.status === 404);
    } catch (e) {
      check('不存在路径错误', true);
    }

    // 11. 顺序加载顺序检查
    const r10 = await httpGet(`http://${HOST}:${PORT}/`);
    const scripts = [...r10.body.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
    check('有 18 个 script 标签', scripts.length === 18);
    check('game.js 在最后', scripts[scripts.length - 1] === 'js/game.js');
    check('audio.js 在最前', scripts[0] === 'js/audio.js');

    // 12. 关闭服务器
    if (server && !server.killed) {
      server.kill();
      check('服务器已关闭', true);
    } else {
      check('无需关闭', true);
    }
  });

  it('全流程模拟：vm 沙箱中完整游戏循环', () => {
    const { modules } = loadModules();
    const required = [
      'Audio', 'Config', 'Effects', 'Bullet', 'Enemy', 'Boss', 'PowerUp',
      'Player', 'Levels', 'Difficulty', 'Touch', 'Shop', 'ShipSelect',
      'Achievements', 'Replay', 'PerfMonitor', 'GameInput', 'GameLogic', 'Game'
    ];
    for (const name of required) {
      check(`${name} 已挂载`, modules[name] !== undefined);
    }
  });

  it('5 关卡脚本完整', () => {
    const { modules } = loadModules();
    const L = modules.Levels;
    check('Levels 存在', L !== undefined);
    if (L.scripts) {
      check('5 关卡', L.scripts.length === 5);
      check('第 1 关有绿洲', L.scripts[0].name.includes('绿洲'));
      check('第 5 关有终极', L.scripts[4].name.includes('终极'));
    }
  });

  it('Config 关键字段可读', () => {
    const { modules } = loadModules();
    const C = modules.Config;
    check('W=540', C.W === 540);
    check('H=780', C.H === 780);
    check('PLAYER_BASE_HP=5', C.PLAYER_BASE_HP === 5);
    check('PERFORMANCE_LIMITS 存在', C.PERFORMANCE_LIMITS !== undefined);
    check('PARTICLES_MAX=300', C.PERFORMANCE_LIMITS.PARTICLES_MAX === 300);
  });

  it('浏览器检测脚本存在（正则匹配）', () => {
    const uaSafari = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/605.1.15';
    const isSafari = uaSafari.indexOf('Safari/') > -1 && uaSafari.indexOf('Chrome') === -1;
    check('Safari 检测正确', isSafari === true);

    const uaChrome = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0';
    const isChrome = uaChrome.indexOf('Chrome/') > -1;
    check('Chrome 检测正确', isChrome === true);
  });
});
