// A separate native media player, independent of the WebAudio synthesis clock.
const SONGS = new Set(['classic', 'chip', 'matsuri', 'brass', 'electro']);
// Round-robin effect players: a single shared player cut the previous cue off whenever
// two answers landed close together, which matters now that files are the primary backend.
const CUES = 3;
function createFileAudio(api, failure) {
  let music = null; let cues = []; let cueIndex = 0; let settings = null; let song = 'classic';
  let active = false; let generation = 0; let watchdog = null; let musicPath = '';
  // Players we have assigned a source to. Android answers stop() on a player that never
  // had one with "operateAudio:fail stop audio fail", so only those are ever stopped.
  const loaded = new WeakSet();
  function stopLoaded(player) {
    if (!player || !loaded.has(player)) return;
    try { player.stop(); } catch {}
  }
  function dispose(player) {
    if (!player) return;
    stopLoaded(player);
    try { player.destroy(); } catch {}
  }
  function player(loop, token) {
    const context = api.createInnerAudioContext();
    context.loop = loop; context.autoplay = false; context.obeyMuteSwitch = false;
    context.volume = Math.max(0, Math.min(1, settings.volume == null ? .8 : settings.volume));
    context.onError(error => {
      // A player that never loaded a source cannot fail playback. Ignoring those stray
      // native errors keeps a disposal or a track switch from tearing down the session.
      if (!active || token !== generation || !loaded.has(context)) return;
      // Stopping is not playback: a failed stop must never disable audio either.
      if (/stop/i.test(String(error.errMsg || ''))) return;
      failure(new Error(`本地音频播放失败（${error.errCode || '-'}）：${error.errMsg || '未知错误'}`));
    });
    if (loop) context.onPlay(() => {
      if (!active || token !== generation) return;
      clearTimeout(watchdog); watchdog = null;
    });
    return context;
  }
  function setLevel(level) {
    if (!active) return;
    const path = `/assets/audio/${song}-${level >= .6 ? 'high' : 'low'}.mp3`;
    if (path === musicPath) return;
    musicPath = path; stopLoaded(music);
    music.src = path; loaded.add(music);
    clearTimeout(watchdog);
    const token = generation;
    watchdog = setTimeout(() => {
      if (active && token === generation) failure(new Error('本地音乐启动超时'));
    }, 6000);
    music.play();
  }
  function pause() {
    active = false; generation++; clearTimeout(watchdog); watchdog = null;
    // Fresh media players on the next user resume avoid stale native handles.
    const oldMusic = music; const oldCues = cues;
    music = null; cues = []; cueIndex = 0; musicPath = '';
    dispose(oldMusic); for (const cue of oldCues) dispose(cue);
  }
  function start(nextSettings, nextSong, level) {
    pause(); settings = nextSettings; song = SONGS.has(nextSong) ? nextSong : 'classic';
    if (!settings.sound) return;
    active = true; const token = generation;
    try {
      music = player(true, token);
      for (let i = 0; i < CUES; i++) cues.push(player(false, token));
      setLevel(level);
    } catch (error) { failure(error); }
  }
  function play(name) {
    if (!active || !cues.length) return;
    const cue = cues[cueIndex++ % cues.length];
    try {
      stopLoaded(cue);
      cue.src = `/assets/audio/${name}.mp3`; loaded.add(cue);
      cue.play();
    } catch (error) { failure(error); }
  }
  return { start, pause, close: pause, setLevel, play };
}
module.exports = { createFileAudio };
