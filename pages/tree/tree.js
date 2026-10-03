const { SKILLS, SKILL, LANES } = require('../../shared/skills.js');
const session = require('../../shared/session.js');
Page({
  data: { grades: [0, 1, 2, 3, 4, 5, 6], filter: 0, selected: null },
  onShow() { this.render(); },
  filter(e) { this.setData({ filter: Number(e.currentTarget.dataset.grade), selected: null }); this.render(); },
  render() {
    const prog = getApp().store.state.progress; const layout = session.TREE_LAYOUT;
    const all = SKILLS.map((s) => ({ ...s, state: session.stateOf(prog, s.id), stars: '★'.repeat(session.starsOf(prog, s.id)), progress: session.masteryRatio(prog, s.id), left: layout.col[s.id] * 88 + 8, top: layout.row[s.id] * 90 + 42 }));
    const shown = all.filter((s) => !this.data.filter || s.grade === this.data.filter); const minY = this.data.filter ? Math.min(...shown.map((s) => s.top)) - 42 : 0;
    shown.forEach((s) => { s.top -= minY; s.style = `left:${s.left}px;top:${s.top}px;`; });
    const byId = Object.fromEntries(shown.map((s) => [s.id, s])); const links = [];
    for (const s of shown) for (const parent of s.req) {
      const p = byId[parent]; if (!p) continue;
      const x1 = p.left + 37; const y1 = p.top + 70; const x2 = s.left + 37; const y2 = s.top; const middle = (y1 + y2) / 2;
      const color = session.isMastered(prog, parent) ? '#20234f' : '#c6c7da';
      [{ x: x1, y: y1, w: 2, h: Math.max(2, middle - y1) }, { x: Math.min(x1, x2), y: middle, w: Math.max(2, Math.abs(x2 - x1)), h: 2 }, { x: x2, y: middle, w: 2, h: Math.max(2, y2 - middle) }].forEach((l, i) => links.push({ id: `${s.id}-${parent}-${i}`, style: `left:${l.x}px;top:${l.y}px;width:${l.w}px;height:${l.h}px;background:${color};` }));
    }
    this.setData({ skills: shown, lanes: LANES.map((name, i) => ({ name, style: `left:${i * 176}px;width:176px;` })), links, graphStyle: `width:712px;height:${Math.max(...shown.map((s) => s.top)) + 100}px;`, mastered: all.filter((s) => s.state === 'mastered').length, stars: SKILLS.reduce((n, s) => n + session.starsOf(prog, s.id), 0) });
  },
  inspect(e) {
    const id = e.currentTarget.dataset.id; const store = getApp().store; const s = SKILL[id]; const rule = session.nextStar(store.state.progress, id, store.web.dayKey()) || { text: session.starsOf(store.state.progress, id) >= 5 ? '五星技能，太棒啦！' : '最近 6 题中首次答对 5 题即可掌握', now: '' };
    this.setData({ selected: { ...s, unlocked: session.isUnlocked(store.state.progress, id), state: session.stateOf(store.state.progress, id), rule: rule.text, now: rule.now, reqNames: s.req.map((r) => SKILL[r].name).join('、'), stars: session.starsOf(store.state.progress, id) } });
  },
  close() { this.setData({ selected: null }); },
  start() { const s = this.data.selected; if (s && s.unlocked) wx.navigateTo({ url: `/pages/play/play?mode=practice&skill=${s.id}&grade=${s.grade}` }); },
  reset(e) {
    const id = e.currentTarget.dataset.id; const store = getApp().store; const targets = session.relockTargets(store.state.progress, id); if (!targets.length) return;
    wx.showModal({ title: `重置「${SKILL[id].name}」？`, content: `将重置该技能及依赖它的 ${targets.length - 1} 个技能的进度和星级，已获奖杯保留。`, success: (res) => { if (res.confirm) { session.relockSkill(store.state.progress, id); store.save(); this.render(); this.close(); } } });
  },
});
