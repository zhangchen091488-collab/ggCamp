const tr = require('../../shared/trophies.js');
const { metrics, checkTrophies } = require('../../lib/features.js');
const { ITEM } = require('../../shared/unlocks.js');
Page({
  data: { filters: ['全部', '已获得', '未解锁', '快达成'], filter: '全部', cats: ['全部', ...tr.CATS], cat: '全部', selected: null },
  onShow() { checkTrophies(getApp().store); getApp().store.save(); this.render(); },
  filter(e) { this.setData({ [e.currentTarget.dataset.type]: e.currentTarget.dataset.value }); this.render(); },
  render() {
    const st = getApp().store.state; const m = metrics(getApp().store); const got = st.trophies.got || {};
    let groups = tr.SERIES.filter((s) => this.data.cat === '全部' || s.cat === this.data.cat).map((s) => {
      const view = tr.seriesView(s, st.trophies, m); const next = view.next; const percent = next ? Math.min(100, Math.floor(view.value / next.need * 100)) : 100;
      return { key: s.key, title: s.title, cat: s.cat, got: view.got.length, total: s.items.length, percent, next: next ? next.secret ? '？？？' : next.name : '全部达成！', items: s.items.map((t) => ({ id: t.id, name: t.secret && !got[t.id] ? '？？？' : t.name, earned: !!got[t.id], rank: tr.RANK_NAME[t.rank] })) };
    });
    if (this.data.filter === '已获得') groups = groups.filter((s) => s.got > 0).map((s) => ({ ...s, items: s.items.filter((t) => t.earned) }));
    if (this.data.filter === '未解锁') groups = groups.filter((s) => s.got < s.total).map((s) => ({ ...s, items: s.items.filter((t) => !t.earned) }));
    if (this.data.filter === '快达成') groups = groups.filter((s) => s.got < s.total && s.cat !== '神秘').sort((a, b) => b.percent - a.percent).slice(0, 8);
    this.setData({ groups, count: tr.earnedCount(st.trophies), total: tr.TROPHIES.length });
  },
  inspect(e) {
    const t = tr.TROPHY[e.currentTarget.dataset.id]; const got = getApp().store.state.trophies.got || {}; const hidden = t.secret && !got[t.id]; const m = metrics(getApp().store);
    this.setData({ selected: { name: hidden ? '神秘奖杯' : t.name, desc: hidden ? '继续探索，达成条件时会自动揭晓。' : t.desc, earned: !!got[t.id], progress: hidden ? '' : `${Math.min(tr.valueOf(m, t.metric), t.need)} / ${t.need}`, reward: t.reward ? ITEM[t.reward].name : '' } });
  },
  close() { this.setData({ selected: null }); },
});
