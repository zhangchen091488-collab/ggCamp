const englishPractice = require('../../lib/english-practice.js');
const { createStore } = require('../../lib/storage.js');
const releaseUpdate = require('../../lib/release-update.js');
const androidUpdate = require('../../lib/android-update.js');
const debug = require('../../lib/debug.js');
const features = require('../../lib/features.js');
const { visual } = require('../../lib/visual.js');
const partners = require('../../lib/partners.js');
const NAMES = partners.NAMES;
Page({
  data: { counts: [6, 10, 14], guide: false, show: {}, characterName: NAMES.girl },
  onLoad(query) { this.setData({ guide: !!query.guide }); },
  onShow() { this.setData({ apkUpdates: releaseUpdate.available(wx), apkValidation: false, ...getApp().store.state.settings, volumePercent: Math.round(getApp().store.state.settings.volume * 100), warning: getApp().store.warning() }); this.preview();
    const store = getApp().store; const selected = englishPractice.selectedPack(store);
    const versions = englishPractice.seriesOptions().filter((version) => version.id !== 'demo-english');
    this.setData({ englishInputMethod: englishPractice.inputMethod(store), englishVersions: versions, englishBookIndex: versions.findIndex((version) => version.id === selected.seriesId) });
  },
  // Live preview of 计算伙伴, mirroring the web build where the hero on the title screen changes as
  // soon as a partner is picked. Strength stays under the 0.45 crowd threshold so the chosen
  // partner is the only character on the stage; `burst` replays the hop so the swap is visible.
  preview(replay = false) {
    const store = getApp().store;
    if (replay) this.burst = (this.burst || 0) + 1;
    const look = features.look(store, () => .01);
    this.setData({ show: visual(look, 'happy', .4, this.burst || 0, store.state.settings.motion), characterName: partners.name(look.character) });
  },
  englishInput(e) { englishPractice.setInputMethod(getApp().store, e.currentTarget.dataset.method); this.onShow(); },
  englishBook(e) {
    const selected = this.data.englishVersions[Number(e.currentTarget && e.currentTarget.dataset.index !== undefined ? e.currentTarget.dataset.index : e.detail.value)];
    if (selected) { englishPractice.selectScope(getApp().store, { seriesId: selected.id }); this.onShow(); }
  },
  update(key, value) { const store = getApp().store; store.state.settings[key] = value; store.save(); this.onShow(); },
  managePartners() { wx.navigateTo({ url: '/partners/pages/manage/manage' }); },
  character(e) { this.update('character', e.currentTarget.dataset.character); this.preview(true); },
  count(e) { this.update('count', Number(e.currentTarget.dataset.count)); },
  sound(e) { this.update('sound', e.detail.value); },
  volume(e) { this.update('volume', e.detail.value / 100); },
  motion(e) { this.update('motion', e.detail.value); },
  appUpdate() { wx.navigateTo({ url: '/pages/app-update/app-update' }); },
  apkUpdate() { wx.navigateTo({ url: '/pages/update-validation/update-validation' }); },
  guide() { wx.reLaunch({ url: '/pages/home/home?guide=1' }); },
  demo() { wx.navigateTo({ url: '/pages/play/play?mode=demo' }); },
  reset() { wx.showModal({ title: '重置全部数据？', content: '练习记录、技能、签到、奖杯、收藏、未完成练习及伙伴领取和下载资源都将清除，此操作无法撤销。', confirmText: '重置', confirmColor: '#b6354b', success: (res) => { if (res.confirm) { try { partners.reset(wx); } catch { wx.showToast({ title: '伙伴资源未能清除，请稍后重试', icon: 'none' }); return; } debug.clear(wx); getApp().store.web.reset(); getApp().store = createStore(wx); wx.reLaunch({ url: '/pages/home/home' }); } } }); },
});
