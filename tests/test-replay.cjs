/**
 * test-replay.cjs - Replay 模块测试
 */
const { loadModules } = require('./runner.cjs');

describe('Replay 模块', () => {
  it('API 完整', () => {
    const { modules } = loadModules();
    const R = modules.Replay;
    check('startRecording', typeof R.startRecording === 'function');
    check('stopRecording', typeof R.stopRecording === 'function');
    check('startPlayback', typeof R.startPlayback === 'function');
    check('stopPlayback', typeof R.stopPlayback === 'function');
    check('tickRecordFrame', typeof R.tickRecordFrame === 'function');
    check('tickPlayback', typeof R.tickPlayback === 'function');
    check('isRecording', typeof R.isRecording === 'function');
    check('isPlaying', typeof R.isPlaying === 'function');
  });

  it('初始不录制/不在回放', () => {
    const { modules } = loadModules();
    const R = modules.Replay;
    check('不录制', R.isRecording() === false);
    check('不在回放', R.isPlaying() === false);
  });

  it('startRecording 后 isRecording=true', () => {
    const { modules } = loadModules();
    const R = modules.Replay;
    R.startRecording();
    check('录制中', R.isRecording() === true);
    R.stopRecording();
  });

  it('stopRecording 返回 meta+ticks', () => {
    const { modules } = loadModules();
    const R = modules.Replay;
    R.startRecording();
    const data = R.stopRecording();
    check('data 有 meta', data && data.meta !== undefined);
    check('data 有 ticks', data && Array.isArray(data.ticks));
  });

  it('空数据拒绝回放', () => {
    const { modules } = loadModules();
    const R = modules.Replay;
    const result = R.startPlayback({ ticks: [] });
    check('空数据返回 false', result === false);
  });
});
