const { createPronunciation } = require('../../lib/pronunciation.js');
const { createReadingMusic } = require('../../lib/reading-music.js');
const { createAudio } = require('../../lib/audio.js');
const practice = require('../../lib/english-practice.js');
const { fmtDopa } = require('../../shared/scoring.js');
const { visual } = require('../../lib/visual.js');
Page({
  data: { show: {}, paused: false, shift: false, before: '', after: '', cursor: 0, rows: ['qwertyuiop'.split(''), 'asdfghjkl'.split(''), 'zxcvbnm'.split('')], upperRows: ['QWERTYUIOP'.split(''), 'ASDFGHJKL'.split(''), 'ZXCVBNM'.split('')], punctuation: ["'", '-', '.', '?', '!'], feedback: '', hintText: '', edits: [], inputMethod: 'keyboard', cards: [], flights: [], wrongCard: -1, hintCard: -1, pulseCell: -1 },
  onLoad() { this.cursor = 0; this.burst = 0; this.visualEpoch = 0; this.visualTimers = new Set(); },
  onShow() {
    const s = practice.state(getApp().store).session;
    if (!s) { wx.redirectTo({ url: '/pages/home/home' }); return; }
    this.setData({ paused: !!this.wasHidden });
    if (!this.wasHidden) this.startedAt = Date.now();
    if (!this.audio) this.audio = createAudio(wx);
    if (!this.readingMusic) this.readingMusic = createReadingMusic(this.audio);
    if (!this.pronunciation) this.pronunciation = createPronunciation(wx, (message) => wx.showToast({ title: message, icon: 'none' }), undefined, this.readingMusic, () => {
      if (practice.heardPronunciation(getApp().store, this.readingQuestionId)) {
        this.setData({ hintText: '已听发音，本题不计独立答对。' }); this.render();
      }
    });
    if (!this.wasHidden) this.startSound();
    this.render();
  },
  startSound() { const store = getApp().store; const s = practice.state(store).session; if (s) this.readingMusic.show(store.state.settings, s.look); },
  noop() {},
  render() {
    const store = getApp().store; const s = practice.state(store).session; const a = practice.current(store);
    if (!s || !a) return;
    if (!a.completed && s.inputMethod !== 'cards') {
      const formatted = practice.formatDraft(a, a.draft);
      if (formatted !== a.draft) practice.updateDraft(store, formatted);
    }
    this.cursor = practice.letterOffset(a.draft, a.draft.slice(0, Math.max(0, this.cursor)).replace(/ /g, '').length);
    const feedback = s.phase === 'feedback' ? (a.skipped ? `参考答案：${a.item.canonical}` : a.firstIndependent ? '一次独立答对，太棒了！' : '答对了！下次试试独立完成。') : '';
    const celebrating = a.completed && !a.skipped;
    const cardView = s.inputMethod === 'cards' ? practice.cardsView(store) : null;
    const wordCells = [];
    if (cardView) for (const cell of cardView.cells) {
      if (cell.space) continue;
      if (!wordCells.length || cardView.cells[cell.index - 1] && cardView.cells[cell.index - 1].space) wordCells.push({ id: cell.index, cells: [] });
      wordCells[wordCells.length - 1].cells.push(cell);
    }
    const windowInfo = typeof wx !== 'undefined' && wx.getWindowInfo ? wx.getWindowInfo() : null;
    this.setData({ stageReady: true, compactStage: !!windowInfo && windowInfo.windowHeight <= 650, wordCells, inputMethod: s.inputMethod, questionId: a.questionId, cards: cardView ? cardView.cards : [], wordNumber: cardView ? cardView.wordNumber : 0, wordCount: cardView ? cardView.wordCount : 0, canListen: !!this.pronunciation && this.pronunciation.available(s.plan.packId, a.item, 'normal'), canListenSlow: !!this.pronunciation && this.pronunciation.available(s.plan.packId, a.item, 'slow'), combo: s.combo || 0, dopa: fmtDopa(s.dopaL || 0), phoneticUk: a.item.phoneticUk || '', phoneticUs: a.item.phoneticUs || '', packTitle: s.packTitle || (practice.packs.find((pack) => pack.packId === s.plan.packId) || practice.pack).title, cells: cardView ? cardView.cells : practice.answerCells(a, this.cursor), phase: s.phase, prompt: a.item.promptZh, canonical: a.item.canonical, number: s.index + 1, total: s.attempts.length, before: a.draft.slice(0, this.cursor), after: a.draft.slice(this.cursor), cursor: this.cursor, feedback: feedback || this.data.feedback, warning: store.warning(), show: visual(s.look, celebrating ? 'happy' : 'open', celebrating ? .6 : .1, celebrating ? this.burst || 0 : 0, store.state.settings.motion) });
  },
  listen(e) {
    if (this.data.paused || !this.pronunciation) return;
    const store = getApp().store; const s = practice.state(store).session; const a = practice.current(store);
    if (!s || !a) return;
    this.readingQuestionId = a.questionId;
    this.pronunciation.play(s.plan.packId, a.item, 'both');
  },
  stopPronunciation() { this.readingQuestionId = null; if (this.pronunciation) this.pronunciation.stop(); },
  learned() { if (this.data.paused) return; this.stopPronunciation(); practice.learn(getApp().store); this.render(); },
  key(e) {
    if (this.data.paused || this.data.phase !== 'answer' || this.data.inputMethod === 'cards') return;
    const store = getApp().store; const a = practice.current(store); let draft = a.draft;
    const key = e.currentTarget.dataset.key;
    if (key === 'shift') { this.setData({ shift: !this.data.shift }); return; }
    const edit = practice.editDraft(a, this.cursor, key, this.data.shift);
    draft = edit.draft; this.cursor = edit.cursor;
    practice.updateDraft(store, draft); this.setData({ feedback: '', edits: [] }); this.render();
  },
  clearAnswer() { this.key({ currentTarget: { dataset: { key: 'clear' } } }); },
  selectCell(e) {
    if (this.data.paused || this.data.phase !== 'answer' || this.data.inputMethod === 'cards') return;
    const a = practice.current(getApp().store);
    const index = Math.min(Number(e.currentTarget.dataset.index), a.draft.length);
    this.cursor = practice.letterOffset(a.draft, a.draft.slice(0, index).replace(/ /g, '').length);
    this.render();
  },
  hint() {
    if (this.data.paused || this.data.phase !== 'answer') return;
    if (this.data.inputMethod === 'cards') {
      const id = practice.cardHint(getApp().store);
      this.setData({ hintCard: id == null ? -1 : id, hintText: '蓝色卡片是提示，本题不计独立答对。' }); this.render(); return;
    }
    const choice = practice.hint(getApp().store);
    this.setData({ hintText: choice ? '蓝色字母是随机提示，本题不计独立答对。' : '可以提示的字母都已给出，试着完成答案吧。' });
    this.render();
  },
  later(callback, delay) {
    const timer = setTimeout(() => { this.visualTimers.delete(timer); callback(); }, delay);
    this.visualTimers.add(timer);
  },
  cancelVisuals() {
    this.visualEpoch = (this.visualEpoch || 0) + 1;
    for (const timer of this.visualTimers || []) clearTimeout(timer);
    if (this.visualTimers) this.visualTimers.clear();
    this.setData({ flights: [], wrongCard: -1, pulseCell: -1, hintCard: -1 });
  },
  tapCard(e) {
    if (this.data.paused || this.data.inputMethod !== 'cards' || this.data.phase !== 'answer') return;
    const store = getApp().store;
    const { id, question } = e.currentTarget.dataset;
    const result = practice.tapCard(store, question, Number(id));
    if (result.status === 'ignored') return;
    this.setData({ hintCard: -1, feedback: '' });
    if (result.completion) { this.stopPronunciation(); this.burst++; }
    const outcome = result.completion || (result.status === 'wrong' ? result : null);
    if (outcome && this.audio) this.audio.play(outcome.status === 'correct', store.state.settings.sound, 1, .2, outcome.status === 'correct');
    this.render();
    const epoch = this.visualEpoch;
    if (result.status === 'wrong') {
      const sequence = this.wrongSequence = (this.wrongSequence || 0) + 1;
      this.setData({ wrongCard: -1 });
      const flash = () => {
        if (epoch !== this.visualEpoch || sequence !== this.wrongSequence) return;
        this.setData({ wrongCard: Number(id) });
        this.later(() => { if (epoch === this.visualEpoch && sequence === this.wrongSequence) this.setData({ wrongCard: -1 }); }, 340);
      };
      if (wx.nextTick) wx.nextTick(flash); else flash();
      return;
    }
    if (store.state.settings.motion) this.flyLetter(e, result, epoch);
  },
  flyLetter(e, result, epoch) {
    if (!wx.createSelectorQuery || !wx.createAnimation) return;
    const touch = e.changedTouches && e.changedTouches[0] || e.detail || {};
    const x = touch.clientX == null ? touch.x : touch.clientX;
    const y = touch.clientY == null ? touch.y : touch.clientY;
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    wx.createSelectorQuery().in(this).select('#answer-cell-' + result.index).boundingClientRect((rect) => {
      if (!rect || epoch !== this.visualEpoch || this.data.paused) return;
      const id = this.flightId = (this.flightId || 0) + 1;
      const flight = { id, tone: Number(e.currentTarget.dataset.tone) || 0, letter: result.letter, style: `left:${x - 20}px;top:${y - 22}px;` };
      this.setData({ flights: [...this.data.flights, flight] });
      const animate = () => {
        if (epoch !== this.visualEpoch) return;
        const animation = wx.createAnimation({ duration: 260, timingFunction: 'ease-out' });
        animation.translate(rect.left + rect.width / 2 - x, rect.top + rect.height / 2 - y).scale(.75).step();
        this.setData({ flights: this.data.flights.map((f) => f.id === id ? { ...f, animation: animation.export() } : f) });
        this.later(() => {
          if (epoch !== this.visualEpoch) return;
          this.setData({ flights: this.data.flights.filter((f) => f.id !== id), pulseCell: result.index });
          this.later(() => { if (epoch === this.visualEpoch && this.data.pulseCell === result.index) this.setData({ pulseCell: -1 }); }, 220);
        }, 270);
      };
      if (wx.nextTick) wx.nextTick(animate); else animate();
    }).exec();
  },
  submit() {
    if (this.data.paused || this.data.inputMethod === 'cards') return;
    this.stopPronunciation();
    const r = practice.complete(getApp().store);
    if (r.status === 'correct') this.burst = (this.burst || 0) + 1;
    if (this.audio && ['correct', 'wrong'].includes(r.status)) this.audio.play(r.status === 'correct', getApp().store.state.settings.sound, 1, 0.2, r.status === 'correct');
    if (r.status === 'empty') this.setData({ feedback: '先写下你的答案，再提交。' });
    else if (r.status === 'wrong') this.setData({ feedback: '有些地方需要修改，保留答案再试一次。', edits: r.edits.map((v, i) => ({ ...v, id: i, display: v.input || '▯' })) });
    this.render();
  },
  skip() { if (this.data.paused) return; this.cancelVisuals(); this.stopPronunciation(); practice.complete(getApp().store, true); this.render(); },
  next() {
    if (this.data.paused) return;
    this.cancelVisuals(); this.stopPronunciation(); this.flushTime(); const done = practice.advance(getApp().store); this.cursor = 0;
    this.setData({ feedback: '', hintText: '', edits: [], hintCard: -1 });
    if (done) { if (this.readingMusic) this.readingMusic.close(); else if (this.audio) this.audio.close(); wx.redirectTo({ url: '/pages/english-result/english-result' }); }
    else this.render();
  },
  flushTime() { if (this.startedAt != null) { practice.addTime(getApp().store, Date.now() - this.startedAt); this.startedAt = Date.now(); } },
  onHide() { this.cancelVisuals(); if (this.readingMusic) this.readingMusic.hide(); this.stopPronunciation(); if (this.audio) this.audio.pause(); this.flushTime(); this.startedAt = null; this.wasHidden = true; this.setData({ paused: true }); },
  onUnload() { this.cancelVisuals(); if (this.readingMusic) this.readingMusic.close(); if (this.pronunciation) this.pronunciation.close(); if (this.audio) this.audio.close(); this.flushTime(); this.startedAt = null; },
  continue() { this.wasHidden = false; this.startedAt = Date.now(); this.setData({ paused: false }); this.startSound(); },
  retrySave() { getApp().store.save(); this.render(); },
});
