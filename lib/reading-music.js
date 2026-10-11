// Page-owned music focus: speech may release focus, but only a visible page can resume.
function createReadingMusic(audio, clock = globalThis) {
  let foreground = false; let reading = false; let request = null;
  let revision = 0; let fade = null;
  function cancel() {
    revision++;
    if (fade !== null) clock.clearInterval(fade);
    fade = null;
  }
  function resume(fadeIn = true) {
    if (!foreground || reading || !request || !request.settings.sound) return;
    cancel(); const token = revision;
    const { settings, look } = request;
    const volume = settings.volume == null ? .8 : settings.volume;
    audio.start({ ...settings, volume: fadeIn ? 0 : volume }, look, .2);
    if (!fadeIn) return;
    let step = 0;
    fade = clock.setInterval(() => {
      if (token !== revision) return;
      audio.setVolume(volume * Math.min(1, ++step / 10));
      if (step >= 10) { clock.clearInterval(fade); fade = null; }
    }, 30);
  }
  return {
    show(settings, look) {
      cancel(); foreground = true; request = { settings: { ...settings }, look: { ...look } };
      audio.pause(); resume(false);
    },
    hold() { reading = true; cancel(); audio.pause(); },
    release() {
      if (!reading) return;
      reading = false; const token = revision;
      Promise.resolve().then(() => { if (token === revision) resume(); });
    },
    hide() { foreground = false; cancel(); audio.pause(); },
    close() { foreground = false; request = null; cancel(); audio.close(); },
  };
}
module.exports = { createReadingMusic };
