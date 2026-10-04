const { createAudio } = require('../../lib/audio.js');
const practice = require('../../lib/english-practice.js');
const { fmtDopa } = require('../../shared/scoring.js');
const { visual } = require('../../lib/visual.js');
Page({
  data: { show: {}, celebrating: false },
  onShow() {
    const store = getApp().store; const r = practice.state(store).result;
    if (!r) { wx.reLaunch({ url: '/pages/home/home' }); return; }
    const seconds = Math.floor(r.elapsedMs / 1000);
    this.setData({ ...r, dopa: fmtDopa(r.dopaL || 0), time: `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`, warning: store.warning(), show: visual(r.look, 'happy', 1, 1, store.state.settings.motion), celebrating: !this.shown && store.state.settings.motion > 0 });
    this.shown = true;
    if (!this.audio) this.audio = createAudio(wx);
    this.audio.start(store.state.settings, r.look, 1); this.audio.finale();
  },
  onHide() { if (this.audio) this.audio.pause(); },
  onUnload() { if (this.audio) this.audio.close(); },
  celebrationComplete() { this.setData({ celebrating: false }); },
  home() { wx.reLaunch({ url: '/pages/home/home' }); },
  retrySave() { getApp().store.save(); this.setData({ warning: getApp().store.warning() }); },
});
