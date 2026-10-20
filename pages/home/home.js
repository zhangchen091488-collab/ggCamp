const releaseUpdate = require('../../lib/release-update.js');
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
  englishGrade(e) {
    const store = getApp().store; const selected = englishPractice.selectedPack(store);
    const grade = Number(e.currentTarget.dataset.grade);
    const books = englishPractice.packs.filter((entry) => entry.seriesId === selected.seriesId && entry.grade === grade && entry.items.length);
    const book = books.find((entry) => entry.semester === selected.semester) || books[0];
    if (!book) return;
    englishPractice.selectScope(store, { grade, semester: book.semester }); this.onShow();
  },
  englishSemester(e) {
    const store = getApp().store; const selected = englishPractice.selectedPack(store);
    const semester = e.currentTarget.dataset.semester;
    if (!englishPractice.packs.some((entry) => entry.seriesId === selected.seriesId && entry.grade === selected.grade && entry.semester === semester && entry.items.length)) return;
    englishPractice.selectScope(store, { semester }); this.onShow();
  },
  startEnglish(mode = 'today') {
    const store = getApp().store; const english = englishPractice.state(store);
    if (!englishPractice.preferences(store).learnedUnitIds.length) { wx.navigateTo({ url: '/pages/english-book/english-book?panel=scope' }); return; }
    const run = () => {
      const s = englishPractice.start(store, { kind: english.kind || 'word', count: store.state.settings.count, mode }, features.look(store));
      if (!s) { wx.showToast({ title: mode === 'review' ? '这个范围还没有错题' : '已学单元暂无所选内容', icon: 'none' }); return; }
      wx.navigateTo({ url: '/pages/english-play/english-play' });
    };
    if (english.session) wx.showModal({ title: '开始新练习？', content: '当前未完成的英语练习将被替换，英语进度保留。', success: (r) => { if (r.confirm) run(); } });
    else run();
  },
  data: { calendarRefresh: 0, show: {}, quests: [], grades: [1, 2, 3, 4, 5, 6], counts: [6, 10, 14], count: 10, subject: 'math', englishKind: 'word', learningTotal: 58 },
  onLoad(query = {}) { this.requestGuide = !!query.guide; },
  onHide() { this.updateVisible = false; },
  onUnload() { this.updateVisible = false; this.guideEpoch = (this.guideEpoch || 0) + 1; },
  onShow() {
    if (typeof wx !== 'undefined') releaseUpdate.onHomeShow(this, wx);
    const store = getApp().store; const st = store.state; const info = features.enterHome(store);
    this.hammer = info.hammer;
    const now = new Date(); const calendar = monthModel(store, now.getFullYear(), now.getMonth());
    this.setData({ ...st.settings, total: st.history.length, resume: !!st.session, review: st.progress.review.length, placed: st.progress.placed, warning: store.warning(), mastered: SKILLS.filter((x) => isMastered(st.progress, x.id)).length, trophyCount: Object.keys(st.trophies.got || {}).length, trophyTotal: TROPHIES.length, collectionCount: ITEMS.filter((it) => isUnlocked(it, st.trophies.got)).length, collectionTotal: ITEMS.length, quests: features.questRows(store), show: visual(features.look(store), 'open', .1, 0, st.settings.motion), bonus: info.bonus, fresh: info.fresh, hammerOffer: info.hammer, held: store.web.items().hammer, calendarRefresh: Date.now(), bonusSlots: calendar.slots, guideActor: visual(features.look(store), 'happy', 0, 0, 100, { scope: 'guide' }).hero });
    const subject = st.homeSubject === 'english' ? 'english' : 'math';
    const english = subject === 'english' ? englishPractice.state(store) : null;
    const selected = englishPractice.selectedPack(store);
    const learnedUnitIds = englishPractice.preferences(store).learnedUnitIds;
    const summary = englishPractice.summary(store, { kind: english && english.kind || 'word', unitIds: learnedUnitIds });
    this.setData({ homeGrades: this.data.grades.map((grade) => ({ grade, enabled: subject !== 'english' || englishPractice.packs.some((entry) => entry.seriesId === selected.seriesId && entry.grade === grade && entry.items.length) })), englishGrade: selected.grade, englishSemester: selected.semester, englishSemesters: ['first', 'second'].map((semester) => ({ semester, enabled: englishPractice.packs.some((entry) => entry.seriesId === selected.seriesId && entry.grade === selected.grade && entry.semester === semester && entry.items.length) })), subject, englishKind: english && english.kind || 'word', learnedCount: learnedUnitIds.length, englishUnitCount: selected.units.length, learningTotal: english ? summary.total : 58, englishBookTitle: selected.title, resumeBookTitle: english && english.session ? english.session.packTitle || (englishPractice.packs.find((pack) => pack.packId === english.session.plan.packId) || selected).title : '' });
    if (english) this.setData({ resume: !!english.session, review: summary.wrong, mastered: summary.mastered });
    if (this.requestGuide || !store.web.hasSeenGuide()) { const help = !!this.requestGuide; this.requestGuide = false; this.openTour(help); }
  },
  chooseCount(e) { const store = getApp().store; store.state.settings.count = Number(e.currentTarget.dataset.count); store.save(); this.onShow(); },
  go(e) {
    if (this.data.subject === 'english' && e.currentTarget.dataset.page === 'english-scope') {
      wx.navigateTo({ url: '/pages/english-book/english-book?panel=scope' }); return;
    }
    if (this.data.subject === 'english' && e.currentTarget.dataset.page === 'tree') {
      wx.navigateTo({ url: '/pages/english-book/english-book' }); return;
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
      if (p.target === '#tour-grades') return { ...p, title: '选择练习内容', text: '在这里选择年级，上下册和单词／常用语也在首页切换。在设置中选择教材版本。在英语技能树中标记学校已学范围，也可以自由选择单元练习。' };
      if (p.target === '#tour-tree') return { ...p, title: '打开技能树', text: '查看每个单元的词表与掌握进度，标记学校已学范围，选择单元练习。' };
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
