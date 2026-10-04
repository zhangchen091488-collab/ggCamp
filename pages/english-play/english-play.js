const { createAudio } = require('../../lib/audio.js');
const practice = require('../../lib/english-practice.js');
const { fmtDopa } = require('../../shared/scoring.js');
const { visual } = require('../../lib/visual.js');
Page({
  data: { show: {}, paused: false, shift: false, before: '', after: '', cursor: 0, rows: ['qwertyuiop'.split(''), 'asdfghjkl'.split(''), 'zxcvbnm'.split('')], upperRows: ['QWERTYUIOP'.split(''), 'ASDFGHJKL'.split(''), 'ZXCVBNM'.split('')], punctuation: ["'", '-', '.', '?', '!'], feedback: '', hintText: '', edits: [] },
  onLoad() { this.cursor = 0; this.burst = 0; },
  onShow() {
    const s = practice.state(getApp().store).session;
    if (!s) { wx.redirectTo({ url: '/pages/home/home' }); return; }
    this.setData({ paused: !!this.wasHidden });
    if (!this.wasHidden) this.startedAt = Date.now();
    if (!this.audio) this.audio = createAudio(wx);
    if (!this.wasHidden) this.startSound();
    this.render();
  },
  startSound() { const store = getApp().store; const s = practice.state(store).session; if (s) this.audio.start(store.state.settings, s.look, 0.2); },
  noop() {},
  render() {
    const store = getApp().store; const s = practice.state(store).session; const a = practice.current(store);
    if (!s || !a) return;
    if (!a.completed) {
      const formatted = practice.formatDraft(a, a.draft);
      if (formatted !== a.draft) practice.updateDraft(store, formatted);
    }
    this.cursor = practice.letterOffset(a.draft, a.draft.slice(0, Math.max(0, this.cursor)).replace(/ /g, '').length);
    const feedback = s.phase === 'feedback' ? (a.skipped ? `参考答案：${a.item.canonical}` : a.firstIndependent ? '一次独立答对，太棒了！' : '答对了！下次试试独立完成。') : '';
    const celebrating = a.completed && !a.skipped;
    this.setData({ combo: s.combo || 0, dopa: fmtDopa(s.dopaL || 0), phoneticUk: a.item.phoneticUk || '', phoneticUs: a.item.phoneticUs || '', packTitle: s.packTitle || (practice.packs.find((pack) => pack.packId === s.plan.packId) || practice.pack).title, cells: practice.answerCells(a, this.cursor), phase: s.phase, prompt: a.item.promptZh, canonical: a.item.canonical, number: s.index + 1, total: s.attempts.length, before: a.draft.slice(0, this.cursor), after: a.draft.slice(this.cursor), cursor: this.cursor, feedback: feedback || this.data.feedback, warning: store.warning(), show: visual(s.look, celebrating ? 'happy' : 'open', celebrating ? .6 : .1, celebrating ? this.burst || 0 : 0, store.state.settings.motion) });
  },
  learned() { if (this.data.paused) return; practice.learn(getApp().store); this.render(); },
  key(e) {
    if (this.data.paused || this.data.phase !== 'answer') return;
    const store = getApp().store; const a = practice.current(store); let draft = a.draft;
    const key = e.currentTarget.dataset.key;
    if (key === 'shift') { this.setData({ shift: !this.data.shift }); return; }
    const edit = practice.editDraft(a, this.cursor, key, this.data.shift);
    draft = edit.draft; this.cursor = edit.cursor;
    practice.updateDraft(store, draft); this.setData({ feedback: '', edits: [] }); this.render();
  },
  clearAnswer() { this.key({ currentTarget: { dataset: { key: 'clear' } } }); },
  selectCell(e) {
    if (this.data.paused || this.data.phase !== 'answer') return;
    const a = practice.current(getApp().store);
    const index = Math.min(Number(e.currentTarget.dataset.index), a.draft.length);
    this.cursor = practice.letterOffset(a.draft, a.draft.slice(0, index).replace(/ /g, '').length);
    this.render();
  },
  hint() {
    if (this.data.paused || this.data.phase !== 'answer') return;
    const choice = practice.hint(getApp().store);
    this.setData({ hintText: choice ? '蓝色字母是随机提示，本题不计独立答对。' : '可以提示的字母都已给出，试着完成答案吧。' });
    this.render();
  },
  submit() {
    if (this.data.paused) return;
    const r = practice.complete(getApp().store);
    if (r.status === 'correct') this.burst = (this.burst || 0) + 1;
    if (this.audio && ['correct', 'wrong'].includes(r.status)) this.audio.play(r.status === 'correct', getApp().store.state.settings.sound, 1, 0.2, r.status === 'correct');
    if (r.status === 'empty') this.setData({ feedback: '先写下你的答案，再提交。' });
    else if (r.status === 'wrong') this.setData({ feedback: '有些地方需要修改，保留答案再试一次。', edits: r.edits.map((v, i) => ({ ...v, id: i, display: v.input || '▯' })) });
    this.render();
  },
  skip() { if (this.data.paused) return; practice.complete(getApp().store, true); this.render(); },
  next() {
    if (this.data.paused) return;
    this.flushTime(); const done = practice.advance(getApp().store); this.cursor = 0;
    this.setData({ feedback: '', hintText: '', edits: [] });
    if (done) { if (this.audio) this.audio.close(); wx.redirectTo({ url: '/pages/english-result/english-result' }); }
    else this.render();
  },
  flushTime() { if (this.startedAt != null) { practice.addTime(getApp().store, Date.now() - this.startedAt); this.startedAt = Date.now(); } },
  onHide() { if (this.audio) this.audio.pause(); this.flushTime(); this.startedAt = null; this.wasHidden = true; this.setData({ paused: true }); },
  onUnload() { if (this.audio) this.audio.close(); this.flushTime(); this.startedAt = null; },
  continue() { this.wasHidden = false; this.startedAt = Date.now(); this.setData({ paused: false }); this.startSound(); },
  retrySave() { getApp().store.save(); this.render(); },
});
