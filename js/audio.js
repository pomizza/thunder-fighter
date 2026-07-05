// audio.js - 程序化音效合成（WebAudio）
const Audio = (() => {
  let ctx = null;
  let masterGain = null;
  let muted = false;
  function ensure() {
    if (ctx) return ctx;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.35;
      masterGain.connect(ctx.destination);
    } catch (e) { ctx = null; }
    return ctx;
  }
  function resume() { ensure(); if (ctx && ctx.state === 'suspended') ctx.resume(); }
  function setMute(m) { muted = m; if (masterGain) masterGain.gain.value = m ? 0 : 0.35; }
  function toggleMute() { setMute(!muted); return muted; }

  function envOsc(freq, dur, type = 'square', vol = 0.3, sweepTo = null) {
    if (muted) return;
    const c = ensure(); if (!c) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, c.currentTime);
    if (sweepTo) o.frequency.exponentialRampToValueAtTime(sweepTo, c.currentTime + dur);
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g); g.connect(masterGain);
    o.start(); o.stop(c.currentTime + dur);
  }
  function envNoise(dur, vol = 0.3, filterFreq = 1500) {
    if (muted) return;
    const c = ensure(); if (!c) return;
    const bufSize = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, bufSize, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
    const src = c.createBufferSource();
    src.buffer = buf;
    const filt = c.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = filterFreq;
    const g = c.createGain();
    g.gain.value = vol;
    src.connect(filt); filt.connect(g); g.connect(masterGain);
    src.start();
  }

  return {
    resume, setMute, toggleMute, get muted() { return muted; },
    shoot: () => envOsc(880, 0.06, 'square', 0.12, 440),
    shootL: () => envOsc(660, 0.08, 'square', 0.12, 330),
    enemyHit: () => { envOsc(220, 0.08, 'square', 0.18, 110); envNoise(0.08, 0.15, 2500); },
    explosion: () => { envOsc(140, 0.4, 'sawtooth', 0.25, 40); envNoise(0.35, 0.3, 1200); },
    bigExplosion: () => { envOsc(80, 0.8, 'sawtooth', 0.35, 20); envNoise(0.6, 0.4, 800); },
    powerup: () => { envOsc(440, 0.08, 'sine', 0.18, 880); setTimeout(() => envOsc(660, 0.08, 'sine', 0.18, 1320), 80); },
    bomb: () => { envOsc(200, 1.0, 'sawtooth', 0.3, 30); envNoise(0.9, 0.35, 600); },
    hit: () => envOsc(120, 0.2, 'square', 0.3, 60),
    bossWarn: () => { for (let i = 0; i < 3; i++) setTimeout(() => envOsc(300, 0.25, 'square', 0.2, 200), i * 300); },
    menu: () => envOsc(520, 0.05, 'sine', 0.15, 780),
    select: () => envOsc(660, 0.05, 'sine', 0.18, 990),
    gameover: () => { envOsc(330, 0.3, 'sawtooth', 0.25, 110); setTimeout(() => envOsc(220, 0.4, 'sawtooth', 0.25, 70), 300); },
    victory: () => { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => envOsc(f, 0.2, 'sine', 0.2), i * 150)); },
  };
})();
// 注：有意不挂到 window 上——window.Audio 是浏览器内置 HTMLAudioElement 构造函数，
// 命名冲突会埋雷；本模块在所有调用点都用词法绑定 Audio.*，无需 window 暴露。
// 此注释为防止未来有人误加 window.Audio = Audio 引入难调试的 bug。
