const { createAudio } = require('../../lib/audio.js');
const { createReadingMusic } = require('../../lib/reading-music.js');
const { createPronunciation } = require('../../lib/pronunciation.js');
const practice = require('../../lib/english-practice.js');
const features = require('../../lib/features.js');
Page({
  data: { units: [], practiceUnitIds: [], kind: 'word', items: [], card: null, selected: null, panel: null },
  onLoad(options) { this.initialPanel = options && options.panel === 'scope' ? 'scope' : null; },
  onShow() {
    if (typeof wx !== 'undefined') {
      if (!this.readingMusic) this.readingMusic = createReadingMusic(createAudio(wx));
      if (!this.pronunciation) this.pronunciation = createPronunciation(wx, (message) => wx.showToast({ title: message, icon: 'none' }), undefined, this.readingMusic);
      const store = getApp().store;
      this.readingMusic.show(store.state.settings, features.look(store));
    }
    this.refresh();
    if (this.initialPanel) { this.openScope(); this.initialPanel = null; }
  },
  refresh() {
    const store = getApp().store;
    const pack = practice.selectedPack(store);
    if (this.packId !== pack.packId) {
      this.packId = pack.packId;
      this.expandedId = null;
      this.setData({ practiceUnitIds: [], card: null, selected: null, panel: null });
    }
    const pref = practice.preferences(store);
    const kind = practice.state(store).kind || 'word';
    const selected = this.data.practiceUnitIds;
    const units = [...pack.units].sort((a, b) => a.order - b.order).map((unit, index) => {
      const progress = practice.summary(store, { unitIds: [unit.unitId], kind });
      return {
        ...unit,
        ...progress,
        nodeTitle: unit.title.replace(/^Unit \d+ · /, ''),
        left: index % 2 * 88 + 8,
        top: index * 90 + 42,
        style: `left:${index % 2 * 88 + 8}px;top:${index * 90 + 42}px;`,
        contentWords: pack.items.filter((item) => item.kind === 'word' && item.unitIds.includes(unit.unitId)).length,
        contentPhrases: pack.items.filter((item) => item.kind === 'phrase' && item.unitIds.includes(unit.unitId)).length,
        learned: pref.learnedUnitIds.includes(unit.unitId),
        selected: selected.includes(unit.unitId),
        state: progress.total && progress.mastered === progress.total ? 'mastered' : progress.practiced ? 'learning' : 'new',
      };
    });
    const links = [];
    units.forEach((unit, index) => {
      const next = units[index + 1]; if (!next) return;
      const x1 = unit.left + 37; const y1 = unit.top + 70;
      const x2 = next.left + 37; const y2 = next.top; const middle = (y1 + y2) / 2;
      const color = unit.state === 'mastered' ? '#20234f' : '#c6c7da';
      [{ x: x1, y: y1, w: 2, h: middle - y1 }, { x: Math.min(x1, x2), y: middle, w: Math.abs(x2 - x1), h: 2 }, { x: x2, y: middle, w: 2, h: y2 - middle }].forEach((line, part) => links.push({ id: `${unit.unitId}-${part}`, style: `left:${line.x}px;top:${line.y}px;width:${line.w}px;height:${line.h}px;background:${color};` }));
    });
    this.setData({ title: pack.title, units, kind, links, graphStyle: `width:184px;height:${units.length * 90 + 52}px;`, learnedCount: pref.learnedUnitIds.length, selectedCount: selected.length,
      items: pack.items.filter((item) => item.kind === kind && item.unitIds.includes(this.expandedId)),
      selected: units.find((unit) => unit.unitId === this.expandedId) || null,
      overview: practice.summary(store, { kind }),
    });
  },
  chooseKind(e) { if (this.pronunciation) this.pronunciation.stop();
    const kind = e.currentTarget.dataset.kind;
    if (!['word', 'phrase'].includes(kind)) return;
    const store = getApp().store; practice.state(store).kind = kind; store.save();
    this.setData({ card: null }); this.refresh();
  },
  toggleLearned(e) {
    const store = getApp().store; const ids = practice.preferences(store).learnedUnitIds;
    const id = e.currentTarget.dataset.id;
    practice.setLearnedUnits(store, ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id]);
    this.refresh();
  },
  togglePractice(e) {
    const id = e.currentTarget.dataset.id; const ids = this.data.practiceUnitIds;
    this.setData({ practiceUnitIds: ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id] });
    this.refresh();
  },
  inspect(e) { if (this.pronunciation) this.pronunciation.stop(); this.expandedId = e.currentTarget.dataset.id; this.setData({ card: null, panel: 'detail' }); this.refresh(); },
  expand(e) { this.inspect(e); },
  openContent() { if (this.pronunciation) this.pronunciation.stop(); this.setData({ panel: 'content', card: null }); },
  openScope() { if (this.pronunciation) this.pronunciation.stop(); this.setData({ panel: 'scope', card: null }); },
  openCombo() { if (this.pronunciation) this.pronunciation.stop(); this.setData({ panel: 'combo', card: null }); },
  closePanel() { if (this.pronunciation) this.pronunciation.stop(); this.setData({ panel: null, card: null }); },
  backDetail() { if (this.pronunciation) this.pronunciation.stop(); this.setData({ panel: 'detail', card: null }); },
  updateCard(card) {
    if (this.pronunciation) this.pronunciation.stop();
    this.setData({ card, canListen: !!card && this.pronunciation && this.pronunciation.available(practice.selectedPack(getApp().store).packId, card, 'normal'), canListenSlow: !!card && this.pronunciation && this.pronunciation.available(practice.selectedPack(getApp().store).packId, card, 'slow') });
  },
  listen(e) {
    if (!this.data.card || !this.pronunciation) return;
    this.pronunciation.play(practice.selectedPack(getApp().store).packId, this.data.card, 'both');
  },
  onHide() { if (this.readingMusic) this.readingMusic.hide(); if (this.pronunciation) this.pronunciation.stop(); },
  onUnload() { if (this.readingMusic) this.readingMusic.close(); if (this.pronunciation) this.pronunciation.close(); },
  study(e) { const index = Number(e.currentTarget.dataset.index || 0); this.cardIndex = index; this.updateCard(this.data.items[index] || null); },
  nextCard() { if (!this.data.items.length) return; this.cardIndex = (this.cardIndex + 1) % this.data.items.length; this.updateCard(this.data.items[this.cardIndex]); },
  closeCard() { this.updateCard(null); },
  start(e) {
    const mode = e.currentTarget.dataset.mode || 'unit';
    const unitIds = e.currentTarget.dataset.id ? [e.currentTarget.dataset.id] : this.data.practiceUnitIds;
    if (!unitIds.length) { wx.showToast({ title: '请先勾选练习单元', icon: 'none' }); return; }
    const store = getApp().store;
    const run = () => {
      const session = practice.start(store, { mode, unitIds, kind: this.data.kind, count: store.state.settings.count }, features.look(store));
      if (!session) { wx.showToast({ title: mode === 'review' ? '这个范围还没有错题' : '这个范围暂无所选内容', icon: 'none' }); return; }
      wx.navigateTo({ url: '/pages/english-play/english-play' });
    };
    if (practice.state(store).session) wx.showModal({ title: '开始新练习？', content: '当前未完成的英语练习将被替换，已获得的进度保留。', success: (result) => { if (result.confirm) run(); } });
    else run();
  },
});
