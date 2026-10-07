export function createListeningMusic(music, changed = () => {}, clock = globalThis) {
  let enabled = false; let foreground = true; let current = null;
  let revision = 0; let fade = null;
  const volume = .35;
  function cancelFade() {
    revision++;
    if (fade !== null) clock.clearInterval(fade);
    fade = null;
  }
  function pauseMusic() { cancelFade(); music.pause(); }
  function resumeMusic() {
    if (!enabled || !foreground || current) return;
    cancelFade(); const token = revision;
    music.volume = 0;
    Promise.resolve(music.play()).then(() => {
      if (token !== revision) return;
      changed('背景音乐播放中');
      fade = clock.setInterval(() => {
        music.volume = Math.min(volume, music.volume + volume / 10);
        if (music.volume >= volume) { clock.clearInterval(fade); fade = null; }
      }, 30);
    }).catch(() => {
      if (token !== revision) return;
      enabled = false; pauseMusic(); changed('音乐播放失败，请重新开启');
    });
  }
  function finish(player) {
    if (current !== player) return;
    current = null;
    // A switch pauses the old player before beginning the new one.
    // Defer restoration until that switch has acquired the music focus.
    const token = revision;
    clock.queueMicrotask(() => { if (token === revision) resumeMusic(); });
  }
  return {
    setEnabled(value) {
      enabled = !!value;
      if (!enabled) { pauseMusic(); changed('背景音乐已关闭'); }
      else if (current) changed('听读中，背景音乐已暂停');
      else resumeMusic();
    },
    begin(player) {
      pauseMusic();
      const previous = current; current = player;
      if (previous && previous !== player) { previous.pause(); previous.currentTime = 0; }
      changed(enabled ? '听读中，背景音乐已暂停' : '正在听读');
    },
    finish,
    setForeground(value) {
      foreground = !!value;
      if (!foreground) {
        pauseMusic(); const previous = current; current = null;
        if (previous) previous.pause();
      } else resumeMusic();
    },
  };
}

if (typeof document !== 'undefined') {
  const music = document.querySelector('#background-music');
  const toggle = document.querySelector('#music-toggle');
  const status = document.querySelector('#music-status');
  const control = createListeningMusic(music, (message) => { status.textContent = message; });
  toggle.addEventListener('change', () => control.setEnabled(toggle.checked));
  for (const player of document.querySelectorAll('article audio')) {
    player.addEventListener('play', () => control.begin(player));
    player.addEventListener('pause', () => { if (player.paused) control.finish(player); });
    player.addEventListener('ended', () => { if (player.ended) control.finish(player); });
    player.addEventListener('error', () => control.finish(player));
  }
  document.addEventListener('visibilitychange', () => control.setForeground(!document.hidden));
  window.addEventListener('pagehide', () => control.setForeground(false));
  window.addEventListener('pageshow', () => control.setForeground(!document.hidden));
}
