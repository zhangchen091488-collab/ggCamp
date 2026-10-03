const { createAudio } = require('../../lib/audio.js');
const practice = require('../../lib/practice.js');
const features = require('../../lib/features.js');
const { fmtDopa } = require('../../shared/scoring.js');
const { visual } = require('../../lib/visual.js');
Page({
  data: { show: {}, quests: [], celebrating: false },
  onLoad() { this.celebrationStarted = false; },
  onShow() {
    const store = getApp().store; const r = store.state.result; if (!r) { wx.reLaunch({ url: '/pages/home/home' }); return; }
    const seconds = Math.floor(r.timeMs / 1000); const look = r.look || (store.state.pending ? store.state.pending.look : features.look(store));
    const firstShow = !this.celebrationStarted; this.celebrationStarted = true;
    this.setData({ ...r, review: store.state.progress.review.length, time: `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`, dopa: fmtDopa(r.dopaL || 0), warning: store.warning(), quests: features.questRows(store), show: visual(look, 'happy', 1, 1, store.state.settings.motion) });
    if (firstShow) this.setData({ celebrating: store.state.settings.motion > 0 });
    if (!this.audio) this.audio = createAudio(wx); this.audio.start(store.state.settings, look, 1); this.audio.finale();
    if (!this.data.celebrating) this.scheduleDemo();
  },
  celebrationComplete() { if (!this.data.celebrating) return; this.setData({ celebrating: false }); this.scheduleDemo(); },
  scheduleDemo() { clearTimeout(this.demoTimer); if (this.data.demo) this.demoTimer = setTimeout(() => { if (this.data.eligible && !this.data.final) this.extra(); else this.home(); }, 3500); },
  onHide() { clearTimeout(this.demoTimer); if (this.audio) this.audio.pause(); }, onUnload() { clearTimeout(this.demoTimer); if (this.audio) this.audio.close(); },
  retrySave() { getApp().store.save(); this.onShow(); },
  again() { wx.redirectTo({ url: `/pages/play/play?mode=${this.data.mode || 'grade'}&grade=${this.data.grade}&skill=${this.data.skill || ''}` }); },
  extra() { wx.redirectTo({ url: '/pages/play/play?extra=1' }); },
  review() { wx.redirectTo({ url: '/pages/play/play?mode=review' }); },
  tree() { wx.navigateTo({ url: '/pages/tree/tree' }); },
  home() { if (this.data.demo) practice.endDemo(getApp().store); wx.reLaunch({ url: '/pages/home/home' }); },
  dismissFresh() { getApp().store.state.result.fresh = []; getApp().store.save(); this.setData({ fresh: [] }); },
});
