const practice = require('../../lib/practice.js');
const { sheetView } = require('../../lib/sheet.js');
const { createAudio } = require('../../lib/audio.js');
const { visual } = require('../../lib/visual.js');
const { fmtDopa } = require('../../shared/scoring.js');
Page({
  data: { sheet: {}, show: {}, quests: [], keys: ['7', '8', '9', '4', '5', '6', '1', '2', '3', '清除', '0'], paused: false },
  onLoad(query) {
    this.store = getApp().store; this.audio = createAudio(wx); this.burst = 0;
    const allowed = ['grade', 'level', 'practice', 'review', 'demo'];
    try { this.session = query.resume && this.store.state.session ? this.store.state.session : query.extra && practice.startExtra(this.store) ? this.store.state.session : practice.sessionFor(this.store, { grade: Math.min(6, Math.max(1, Number(query.grade) || 1)), mode: allowed.includes(query.mode) ? query.mode : 'grade', skill: query.skill }); }
    catch (error) { wx.showToast({ title: error.message, icon: 'none' }); wx.navigateBack(); return; }
    this.session.look = { ...this.session.look, character: this.session.look && this.session.look.character || this.store.state.settings.character };
    if (query.resume) this.session.paused = true;
    practice.markCapsule(this.store); this.render();
  },
  onShow() {
    if (!this.session) return;
    if (this.session.demo && this.store.state.session !== this.session) { this.finished = true; wx.reLaunch({ url: '/pages/home/home' }); return; }
    if (this.session.over || (this.session.phase !== 'extra' && this.session.index >= this.session.count)) { this.complete(); return; }
    this.lastAt = Date.now(); this.startTimer(); this.render();
    if (!this.session.paused) this.startSound();
  },
  level() { const s = this.session; return s.phase === 'extra' ? 1 + Math.min(.5, Math.floor(s.ok / 3) * .1) : s.count <= 1 ? 1 : .08 + .92 * (s.index / (s.count - 1)) ** 1.3; },
  startSound() { this.audio.start(this.store.state.settings, this.session.look, this.level()); },
  updateTime() { const at = Date.now(); if (this.lastAt) practice.tick(this.session, at - this.lastAt); this.lastAt = at; },
  startTimer() {
    clearInterval(this.timer); this.timer = setInterval(() => {
      if (!this.session || this.finished) return;
      this.updateTime();
      if (this.session.over) { this.complete(); return; }
      this.setData({ time: this.timeText(), combo: this.session.combo });
      if (this.session.demo && !this.session.paused) {
        const p = practice.current(this.session); const step = p.steps[this.session.step];
        if (step) this.answer(step.digit); else this.next();
      }
    }, 200);
  },
  timeText() { const s = this.session; const seconds = Math.ceil((s.phase === 'extra' ? s.extraRemaining : s.elapsedMs) / 1000); return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`; },
  onHide() { this.suspend(); }, onUnload() { this.suspend(); if (this.audio) this.audio.close(); },
  suspend() { clearInterval(this.timer); clearTimeout(this.advanceTimer); if (this.audio) this.audio.pause(); if (!this.session || this.finished) return; this.updateTime(); this.session.paused = true; if (this.session.demo) practice.endDemo(this.store); else this.store.save(); },
  resume() { this.session.paused = false; this.lastAt = Date.now(); this.startTimer(); this.startSound(); this.store.save(); this.render(); },
  render(face = 'open') {
    const s = this.session; const p = practice.current(s); if (!p) return;
    const sheet = sheetView(p, s); s.marks = sheet.marks; const step = p.steps[s.step];
    if (step && step.help && (this.showHint || s.stepNg >= 2)) for (const cell of sheet.cells) cell.hint = step.help.ids.includes(cell.id);
    this.setData({ sound: this.store.state.settings.sound, progressDots: Array.from({ length: s.count }, (_, id) => ({ id, done: id < s.index, current: id === s.index })), sheet, title: p.title, grade: s.grade, index: s.phase === 'extra' ? s.ok + 1 : s.index + 1, count: s.count, ok: s.ok, ng: s.ng, time: this.timeText(), paused: s.paused, solved: !step, extra: s.phase === 'extra', demo: s.demo, combo: s.combo, dopa: fmtDopa(s.dopaL), label: step ? step.label : '这一题完成啦！', hint: (this.showHint || s.stepNg >= 3) && step && step.help ? step.help.text : '', feedback: s.feedback, motion: this.store.state.settings.motion, show: visual(s.look, face, this.level(), this.burst, this.store.state.settings.motion), capsule: p.capsule ? `${p.capsule.d} 的题目又回来啦！` : '', warning: this.store.warning(), hurry: s.phase === 'extra' && s.extraRemaining < 15000 });
  },
  showHelp() { this.showHint = true; this.render(); },
  toggleSound() { const settings = this.store.state.settings; settings.sound = !settings.sound; this.store.save(); if (settings.sound && !this.session.paused) this.startSound(); else this.audio.close(); this.render(); },
  press(e) { if (this.session.demo) { this.endDemo(); return; } if (this.session.paused) return; this.answer(String(e.currentTarget.dataset.key)); },
  answer(digit) {
    if (digit === '清除') { this.session.wrong = ''; this.session.feedback = ''; this.store.save(); this.render(); return; }
    if (digit === '提示') { this.showHint = true; this.render(); return; }
    this.updateTime(); if (this.session.over) { this.complete(); return; }
    const outcome = practice.input(this.session, digit, this.store.state.progress, Date.now(), this.store); if (outcome === 'ignored') return;
    if (outcome !== 'wrong') { this.showHint = false; this.burst++; }
    this.audio.play(outcome !== 'wrong', this.store.state.settings.sound, this.session.combo, this.level(), outcome === 'solved');
    this.store.save(); this.render(outcome === 'wrong' ? 'tight' : 'happy');
    if (outcome === 'solved' && !this.session.demo) { clearTimeout(this.advanceTimer); this.advanceTimer = setTimeout(() => { if (!this.session.paused && !this.finished) this.next(); }, this.store.state.settings.motion > 0 ? 1150 : 450); }
  },
  next() {
    clearTimeout(this.advanceTimer); if (this.session.paused) return;
    this.updateTime(); if (this.session.over) { this.complete(); return; }
    if (!practice.next(this.session, this.store.state.progress)) return;
    this.showHint = false; this.burst = 0; this.store.save(); practice.markCapsule(this.store);
    if (this.session.phase !== 'extra' && this.session.index >= this.session.count) this.complete(); else { this.audio.setLevel(this.level()); this.render(); }
  },
  complete() { clearInterval(this.timer); clearTimeout(this.advanceTimer); const result = practice.finish(this.store); if (!result) return; this.finished = true; this.audio.close(); wx.redirectTo({ url: '/pages/result/result' }); },
  endDemo() { clearInterval(this.timer); clearTimeout(this.advanceTimer); this.finished = true; practice.endDemo(this.store); this.audio.close(); wx.reLaunch({ url: '/pages/home/home' }); },
});
