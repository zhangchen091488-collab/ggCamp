const features = require('../../lib/features.js');
const { visual } = require('../../lib/visual.js');
const { SKILLS } = require('../../shared/skills.js');
const { isMastered } = require('../../shared/session.js');
const { TROPHIES } = require('../../shared/trophies.js');
const tour = require('../../lib/home-tour.js');
const { monthModel } = require('../../lib/calendar-model.js');
const { ITEMS, isUnlocked } = require('../../shared/unlocks.js');
Page({
  data: { calendarRefresh: 0, show: {}, quests: [], grades: [1, 2, 3, 4, 5, 6], counts: [6, 10, 14], count: 10 },
  onLoad(query = {}) { this.requestGuide = !!query.guide; },
  onUnload() { this.guideEpoch = (this.guideEpoch || 0) + 1; },
  onShow() {
    const store = getApp().store; const st = store.state; const info = features.enterHome(store);
    this.hammer = info.hammer;
    const now = new Date(); const calendar = monthModel(store, now.getFullYear(), now.getMonth());
    this.setData({ ...st.settings, total: st.history.length, resume: !!st.session, review: st.progress.review.length, placed: st.progress.placed, warning: store.warning(), mastered: SKILLS.filter((x) => isMastered(st.progress, x.id)).length, trophyCount: Object.keys(st.trophies.got || {}).length, trophyTotal: TROPHIES.length, collectionCount: ITEMS.filter((it) => isUnlocked(it, st.trophies.got)).length, collectionTotal: ITEMS.length, quests: features.questRows(store), show: visual(features.look(store), 'open', .1, 0, st.settings.motion), bonus: info.bonus, fresh: info.fresh, hammerOffer: info.hammer, held: store.web.items().hammer, calendarRefresh: Date.now(), bonusSlots: calendar.slots, guideActor: visual(features.look(store), 'happy').hero });
    if (this.requestGuide || !store.web.hasSeenGuide()) { const help = !!this.requestGuide; this.requestGuide = false; this.openTour(help); }
  },
  chooseCount(e) { const store = getApp().store; store.state.settings.count = Number(e.currentTarget.dataset.count); store.save(); this.onShow(); },
  go(e) { wx.navigateTo({ url: `/pages/${e.currentTarget.dataset.page}/${e.currentTarget.dataset.page}` }); },
  start(e) {
    const data = e.currentTarget.dataset; const go = () => wx.navigateTo({ url: `/pages/play/play?mode=${data.mode || 'grade'}&grade=${data.grade || 1}` });
    if (getApp().store.state.session) wx.showModal({ title: '开始新练习？', content: '当前未完成的练习将被替换，已获得的技能进度保留。', success: (res) => { if (res.confirm) go(); } }); else go();
  },
  resume() { wx.navigateTo({ url: '/pages/play/play?resume=1' }); },
  help() { this.openTour(true); },
  noop() {},
  openTour(help) { this.guidePages = tour.pages(help); this.setData({ guideOpen: true, guideIndex: 0, guideDots: this.guidePages.map((_, i) => i) }); this.renderGuide(); },
  renderGuide() {
    const page = this.guidePages[this.data.guideIndex]; const info = wx.getWindowInfo ? wx.getWindowInfo() : { windowWidth: 390, windowHeight: 680 };
    this.setData({ guideTitle: page.title, guideText: page.text, guideTarget: page.target, guideLast: !!page.recommend, ...tour.layout(null, info.windowWidth, info.windowHeight) });
    const epoch = this.guideEpoch = (this.guideEpoch || 0) + 1;
    if (!page.target || !wx.createSelectorQuery) { if (wx.pageScrollTo) wx.pageScrollTo({ scrollTop: 0, duration: 0 }); return; }
    const measure = () => wx.createSelectorQuery().select(page.target).boundingClientRect().selectViewport().scrollOffset().exec(results => {
      if (epoch !== this.guideEpoch || !this.data.guideOpen || !results[0]) return;
      const rect = results[0]; const scroll = results[1] ? results[1].scrollTop : 0;
      const wanted = Math.max(152, Math.min(info.windowHeight * .33, info.windowHeight - 250 - rect.height));
      if (wx.pageScrollTo) wx.pageScrollTo({ scrollTop: Math.max(0, scroll + rect.top - wanted), duration: 0, complete: () => {
        wx.createSelectorQuery().select(page.target).boundingClientRect().exec(rows => { if (epoch === this.guideEpoch && rows[0] && this.data.guideOpen) this.setData(tour.layout(rows[0], info.windowWidth, info.windowHeight)); });
      } });
      else this.setData(tour.layout(rect, info.windowWidth, info.windowHeight));
    });
    if (wx.nextTick) wx.nextTick(measure); else measure();
  },
  guideNext() { if (this.data.guideIndex === this.guidePages.length - 1) this.guideClose(); else { this.setData({ guideIndex: this.data.guideIndex + 1 }); this.renderGuide(); } },
  guideBack() { if (this.data.guideIndex > 0) { this.setData({ guideIndex: this.data.guideIndex - 1 }); this.renderGuide(); } },
  guideClose() { this.guideEpoch = (this.guideEpoch || 0) + 1; getApp().store.web.markGuideSeen(); this.setData({ guideOpen: false }); if (wx.pageScrollTo) wx.pageScrollTo({ scrollTop: 0, duration: 0 }); },
  bonusClose() { this.setData({ bonus: null }); },
  freshClose() { this.setData({ fresh: [] }); },
  useHammer() { if (!this.hammer) return; const store = getApp().store; if (store.web.useHammer(this.hammer.days)) { store.save(); this.onShow(); wx.showToast({ title: '连续记录保住啦！', icon: 'none' }); } },
  declineHammer() { getApp().store.web.declineHammer(); this.hammer = null; this.setData({ hammerOffer: null }); },
});
