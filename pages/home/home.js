const englishPractice = require('../../lib/english-practice.js');
const features = require('../../lib/features.js');
const { visual } = require('../../lib/visual.js');
const { SKILLS } = require('../../shared/skills.js');
const { isMastered } = require('../../shared/session.js');
const { TROPHIES } = require('../../shared/trophies.js');
const tour = require('../../lib/home-tour.js');
const { monthModel } = require('../../lib/calendar-model.js');
const { ITEMS, isUnlocked } = require('../../shared/unlocks.js');
Page({
  switchSubject() {
    const store = getApp().store;
    store.state.homeSubject = this.data.subject === 'english' ? 'math' : 'english'; store.save(); this.onShow();
  },
  englishKind(e) { const store = getApp().store; englishPractice.state(store).kind = e.currentTarget.dataset.kind; store.save(); this.onShow(); },
  englishGrade(e) { englishPractice.selectScope(getApp().store, { grade: e.currentTarget.dataset.grade }); this.onShow(); },
  englishSemester(e) { englishPractice.selectScope(getApp().store, { semester: e.currentTarget.dataset.semester }); this.onShow(); },
  startEnglish(mode = 'today') {
    const store = getApp().store; const english = englishPractice.state(store);
    const run = () => {
      const s = englishPractice.start(store, { kind: english.kind || 'word', count: store.state.settings.count, mode }, features.look(store));
      if (!s) { wx.showToast({ title: '这个范围还没有错题', icon: 'none' }); return; }
      wx.navigateTo({ url: '/pages/english-play/english-play' });
    };
    if (english.session) wx.showModal({ title: '开始新练习？', content: '当前未完成的英语练习将被替换，英语进度保留。', success: (r) => { if (r.confirm) run(); } });
    else run();
  },
  data: { calendarRefresh: 0, show: {}, quests: [], grades: [1, 2, 3, 4, 5, 6], counts: [6, 10, 14], count: 10, subject: 'math', englishKind: 'word', learningTotal: 58 },
  onLoad(query = {}) { this.requestGuide = !!query.guide; },
  onUnload() { this.guideEpoch = (this.guideEpoch || 0) + 1; },
  onShow() {
    const store = getApp().store; const st = store.state; const info = features.enterHome(store);
    this.hammer = info.hammer;
    const now = new Date(); const calendar = monthModel(store, now.getFullYear(), now.getMonth());
    this.setData({ ...st.settings, total: st.history.length, resume: !!st.session, review: st.progress.review.length, placed: st.progress.placed, warning: store.warning(), mastered: SKILLS.filter((x) => isMastered(st.progress, x.id)).length, trophyCount: Object.keys(st.trophies.got || {}).length, trophyTotal: TROPHIES.length, collectionCount: ITEMS.filter((it) => isUnlocked(it, st.trophies.got)).length, collectionTotal: ITEMS.length, quests: features.questRows(store), show: visual(features.look(store), 'open', .1, 0, st.settings.motion), bonus: info.bonus, fresh: info.fresh, hammerOffer: info.hammer, held: store.web.items().hammer, calendarRefresh: Date.now(), bonusSlots: calendar.slots, guideActor: visual(features.look(store), 'happy').hero });
    const subject = st.homeSubject === 'english' ? 'english' : 'math';
    const english = subject === 'english' ? englishPractice.state(store) : null;
    const selected = englishPractice.selectedPack(store);
    const scoped = english ? Object.entries(english.progress.records).filter(([key]) => key.startsWith(selected.packId + ':')) : [];
    const records = scoped.map(([, value]) => value);
    const activeIds = selected.items.filter((item) => item.kind === (english && english.kind || 'word')).map((item) => item.itemId);
    const reviewCount = english ? scoped.filter(([key, value]) => value.wrong && activeIds.includes(key.split(':')[1])).length : 0;
    this.setData({ englishGrades: englishPractice.availableGrades(store), englishGrade: selected.grade, englishSemester: selected.semester, englishSemesters: [...new Set(englishPractice.packs.filter((entry) => entry.seriesId === selected.seriesId && entry.grade === selected.grade).map((entry) => entry.semester))], subject, englishKind: english && english.kind || 'word', learningTotal: english ? selected.items.length : 58, englishBookTitle: selected.title, resumeBookTitle: english && english.session ? english.session.packTitle || (englishPractice.packs.find((pack) => pack.packId === english.session.plan.packId) || selected).title : '' });
    if (english) this.setData({ resume: !!english.session, review: reviewCount, mastered: records.filter((v) => v.mastered).length });
    if (this.requestGuide || !store.web.hasSeenGuide()) { const help = !!this.requestGuide; this.requestGuide = false; this.openTour(help); }
  },
  chooseCount(e) { const store = getApp().store; store.state.settings.count = Number(e.currentTarget.dataset.count); store.save(); this.onShow(); },
  go(e) {
    if (this.data.subject === 'english' && e.currentTarget.dataset.page === 'tree') {
      wx.showModal({ title: '英语试用学习进度', content: `已掌握 ${this.data.mastered}/${this.data.learningTotal}；待巩固 ${this.data.review}。本册进度独立保存，不计数学技能。`, showCancel: false }); return;
    }
    wx.navigateTo({ url: `/pages/${e.currentTarget.dataset.page}/${e.currentTarget.dataset.page}` }); },
  start(e) {
    const data = e.currentTarget.dataset;
    if (this.data.subject === 'english') { this.startEnglish(data.mode === 'review' ? 'review' : 'today'); return; }
    const go = () => wx.navigateTo({ url: `/pages/play/play?mode=${data.mode || 'grade'}&grade=${data.grade || 1}` });
    if (getApp().store.state.session) wx.showModal({ title: '开始新练习？', content: '当前未完成的练习将被替换，已获得的技能进度保留。', success: (res) => { if (res.confirm) go(); } }); else go();
  },
  resume() { wx.navigateTo({ url: this.data.subject === 'english' ? '/pages/english-play/english-play' : '/pages/play/play?resume=1' }); },
  help() { this.openTour(true); },
  noop() {},
  openTour(help) { this.guidePages = tour.pages(help);
    if (this.data.subject === 'english') this.guidePages = this.guidePages.map((p) => {
      if (p.target === '#tour-level') return { ...p, title: '每天练一点英语', text: '选择单词或常用语，点击今日练习。新内容先看学习卡，再看中文完整默写英文。' };
      if (p.target === '#tour-grades') return { ...p, title: '选择练习内容', text: '在这里选择年级，上下册和单词／常用语也在首页切换。在设置中选择教材版本。当前为未审核整册试用，教材单元尚未划分。' };
      if (p.target === '#tour-tree') return { ...p, title: '看看英语进度', text: '英语与数学进度独立记录，点击查看已掌握与待巩固内容。' };
      if (!p.target) return { ...p, text: '选择单词或常用语，练习完整英文答案。右上角可切换数学与英语。' };
      if (p.target === '#tour-trophy') return { ...p, text: '奖杯和收藏由两个学科共用。数学和英语共同推进每日任务、签到与通用奖杯；学科掌握进度各自保存。' };
      return p;
    }); this.setData({ guideOpen: true, guideIndex: 0, guideDots: this.guidePages.map((_, i) => i) }); this.renderGuide(); },
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
