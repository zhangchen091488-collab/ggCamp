const { AudioEngine } = require('../shared/audio.js');
const { variant } = require('../shared/unlocks.js');
const { createFileAudio } = require('./file-audio.js');
const { isNativeContainer } = require('./platform.js');
const filePlayerApis = new WeakSet();
// The 多端应用 (Donut) native container tears its WebAudio backend down when the app is
// backgrounded: the retained context never resumes, and even a freshly created context
// stays in `default` with a frozen clock, so no JS-side recovery is possible. Verified on
// Android SDK 1.7.0 — only the native file player survives a background round trip.
// WeChat mini programs keep the WebAudio engine.
function createAudio(api) {
  const fileOnly = isNativeContainer(api) && typeof api.createInnerAudioContext === 'function';
  const engine = new AudioEngine({ contextFactory: () => {
    try { return api.createWebAudioContext(); }
    catch (error) { throw new Error(`创建音频上下文失败：${error && error.message || String(error)}`); }
  } });
  let timer = null; let failed = false; let warned = false;
  let generation = 0; let closing = null; let ready = false; let recovering = false;
  let needsResume = false; const waits = new Set();
  let request = null; let interrupted = false; let effects = []; const listeners = [];
  // Effects already handed to the WebAudio backend. Kept so a backend that turns out to be
  // dead can replay them through the file player instead of dropping the sound entirely.
  let flushed = [];
  // Native containers cannot recover WebAudio after backgrounding, so the file player is
  // their primary backend rather than a fallback.
  let files = fileOnly ? createFileAudio(api, reportFailure) : null;
  function halt() {
    for (const cancel of waits) cancel(); waits.clear();
    generation++; clearInterval(timer); timer = null; ready = false; recovering = false;
    effects = []; flushed = []; engine.stopMusic();
    if (files) files.pause();
    if (engine.g) { try { engine.setMuted(true); } catch (error) { console.warn('音频暂停失败', error); } }
  }
  function listen(on, off, callback) {
    if (typeof api[on] === 'function' && typeof api[off] === 'function') {
      api[on](callback); listeners.push(() => api[off](callback));
    }
  }
  function attach() {
    if (listeners.length) return;
    listen('onAppHide', 'offAppHide', pause);
    listen('onAudioInterruptionBegin', 'offAudioInterruptionBegin', () => { interrupted = true; halt(); });
    listen('onAudioInterruptionEnd', 'offAudioInterruptionEnd', () => {
      interrupted = false;
      if (request) start(request.settings, request.look, request.level);
    });
  }
  function effect(callback) {
    if (failed || !request) return;
    if (ready) callback(); else if (!interrupted && effects.length < 16) effects.push(callback);
  }
  function reportFailure(error) {
    if (!files && request && typeof api.createInnerAudioContext === 'function') {
      const saved = request; const queued = effects.slice().concat(flushed);
      close(); filePlayerApis.add(api);
      files = createFileAudio(api, reportFailure);
      request = saved; effects = queued; failed = false; ready = true; attach();
      files.start(saved.settings, variant(saved.look.music), saved.level);
      if (!failed) for (const callback of effects.splice(0)) callback();
      return;
    }
    failed = true; close();
    console.warn('音频初始化或播放失败', error);
    if (!warned && (api.showModal || api.showToast)) {
      warned = true;
      if (api.showModal) api.showModal({ title: '音频暂不可用', content: `错误详情：${String(error && error.message || error).slice(0, 400)}\n播放应用音乐不需要麦克风权限。请将此错误详情反馈给开发者。`, showCancel: false });
      else api.showToast({ title: '音频暂不可用，请重新进入后重试', icon: 'none' });
    }
  }
  function waitForResume(ctx, resumed, token) {
    if (!ctx || !(resumed && typeof resumed.then === 'function')) return null;
    return new Promise((resolve, reject) => {
      let done = false; let poll; let timeout;
      function finish(error) {
        if (done) return; done = true; clearInterval(poll); clearTimeout(timeout); waits.delete(cancel);
        if (error) reject(error); else resolve();
      }
      function cancel() { finish(); }
      waits.add(cancel);
      // Donut's Promise resolves only from onstatechange, which may be lost in background.
      // A running native state is sufficient even when that Promise never resolves.
      poll = setInterval(() => { if (token !== generation || ctx.state === 'running') finish(); }, 25);
      timeout = setTimeout(() => {
        const error = new Error(`音频恢复超时（状态：${ctx.state}）`);
        error.code = 'AUDIO_RESUME_TIMEOUT'; finish(error);
      }, 2000);
      Promise.resolve(resumed).then(() => finish()).catch(finish);
    });
  }
  function start(settings, look = {}, level = 0, rebuilt = false) {
    if (!settings.sound) { close(); return; }
    const queued = effects; halt(); effects = queued;
    request = { settings: { ...settings }, look: { ...look }, level }; failed = false; attach();
    if (interrupted) return;
    if (!files && filePlayerApis.has(api)) files = createFileAudio(api, reportFailure);
    if (files) {
      ready = true; files.start(settings, variant(look.music), level);
      if (!failed) for (const callback of effects.splice(0)) callback();
      return;
    }
    if (!api.createWebAudioContext) { reportFailure(new Error('createWebAudioContext unavailable')); return; }
    const token = generation;
    const retained = !!engine.ctx;
    function startupFailure(error) {
      if (token !== generation) return;
      if (retained && !rebuilt && error && error.code === 'AUDIO_RESUME_TIMEOUT') {
        const queued = effects.slice(); close(); effects = queued;
        start(settings, look, level, true);
      } else reportFailure(error);
    }
    function begin() {
      if (token !== generation || !request || interrupted) return;
      try {
        engine.setSong(variant(look.music));
        engine.setVolume(settings.volume == null ? .8 : settings.volume);
        const state = engine.ctx && engine.ctx.state;
        let resumed = engine.unlock();
        if (needsResume && state !== 'suspended' && engine.ctx && typeof engine.ctx.resume === 'function') resumed = engine.ctx.resume();
        needsResume = false;
        function run() {
          if (token !== generation || !request || interrupted) return;
          engine.setMuted(false);
          engine.setLevel(Math.min(10, Math.round(level * 10)), 112 + 16 * Math.min(1, level));
          engine.startMusic(); ready = true;
          flushed = effects.splice(0);
          for (const callback of flushed) callback();
          clearInterval(timer);
          let clockAt = Date.now(); let clockTime = engine.ctx && engine.ctx.currentTime;
          timer = setInterval(() => {
            if (token !== generation) return;
            try {
              // The mini program host can suspend the context after the page's onShow.
              if (engine.ctx && engine.ctx.state === 'suspended') {
                if (!recovering) {
                  recovering = true; ready = false;
                  const resume = engine.unlock();
                  Promise.resolve(waitForResume(engine.ctx, resume, token)).then(() => {
                    if (token !== generation) return;
                    recovering = false; ready = true;
                    clockAt = Date.now(); clockTime = engine.ctx && engine.ctx.currentTime;
                    for (const callback of effects.splice(0)) callback();
                  }).catch(error => { if (token === generation) reportFailure(error); });
                }
                return;
              }
              if (ready && engine.ctx && Date.now() - clockAt > 1500) {
                if (engine.ctx.currentTime <= clockTime) throw new Error(`原生音频时钟未恢复（状态：${engine.ctx.state}）`);
                clockAt = Date.now(); clockTime = engine.ctx.currentTime;
              }
              if (ready) engine.update();
            } catch (error) { reportFailure(error); }
          }, 45);
        }
        const waiting = waitForResume(engine.ctx, resumed, token);
        if (waiting) {
          waiting.then(run).catch(startupFailure);
        } else run();
      } catch (error) { if (token === generation) reportFailure(error); }
    }
    // Await native destruction before recreating its audio engine on foreground return.
    if (closing) {
      let done = false;
      let timeout;
      function resumeAfterClose() {
        if (done) return; done = true; clearTimeout(timeout); waits.delete(cancel); begin();
      }
      function cancel() { done = true; clearTimeout(timeout); waits.delete(cancel); }
      waits.add(cancel);
      timeout = setTimeout(() => { closing = null; resumeAfterClose(); }, 500);
      closing.then(resumeAfterClose);
    } else begin();
  }
  function pause() {
    request = null; interrupted = false; halt();
    for (const detach of listeners.splice(0)) detach();
    needsResume = true;
    // WebAudio path only (mini programs): keep the native graph alive across a background
    // round trip so resume() can pick it up. Native containers never get here — they use
    // the file player, whose players are disposed and recreated instead.
    if (engine.ctx && engine.ctx.state === 'running' && typeof engine.ctx.suspend === 'function') {
      try {
        const suspended = engine.ctx.suspend();
        if (suspended && typeof suspended.catch === 'function') suspended.catch(error => console.warn('音频暂停失败', error));
      } catch (error) { console.warn('音频暂停失败', error); }
    }
  }
  function close() {
    const ctx = engine.ctx;
    // Detach the reference before closing: the official WebAudioContext docs forbid
    // reading `state` after close, and pause() inspects the context.
    engine.ctx = null; engine.g = null;
    pause(); needsResume = false;
    if (ctx) {
      try {
        const promise = ctx.close();
        if (promise && typeof promise.then === 'function') {
          const pending = Promise.resolve(promise).catch(error => console.warn('音频关闭失败', error));
          closing = pending;
          pending.then(() => { if (closing === pending) closing = null; });
        }
      } catch (error) { console.warn('音频关闭失败', error); }
    }
  }
  return {
    start, pause, close, engine,
    setLevel(level) {
      if (request) request.level = level;
      if (files) {
        try { files.setLevel(level); } catch (error) { reportFailure(error); }
        return;
      }
      try {
        engine.setLevel(Math.min(10, Math.round(level * 10)), 112 + 16 * Math.min(1, level));
        engine.key = level >= 1 ? 2 : 0;
      } catch {}
    },
    play(correct, enabled, combo = 1, level = .2, solved = false) {
      if (!enabled || failed) return;
      effect(() => {
        if (files) { files.play(correct ? solved ? 'clear' : 'correct' : 'wrong'); return; }
        try {
          if (correct) solved ? engine.clear(Math.min(1, level)) : engine.correct(combo, Math.min(1, level));
          else engine.wrong(Math.min(1, level));
        } catch {}
      });
    },
    finale() {
      effect(() => {
        if (files) { files.play('finale'); return; }
        try { engine.finale(); } catch {}
      });
    },
  };
}
module.exports = { createAudio };
