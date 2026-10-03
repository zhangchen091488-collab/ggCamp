const { dayKey } = require('../shared/store.js');
const { SKILL } = require('../shared/skills.js');
const asset = name => `/assets/ui/${name}.png`;
function monthModel(store, year, month, at = new Date()) {
  const web = store.web; const summary = web.monthSummary(year, month); const today = dayKey(at);
  const cells = Array.from({ length: new Date(year, month, 1).getDay() }, (_, i) => ({ key: `empty${i}`, empty: true }));
  for (let day = 1; day <= new Date(year, month + 1, 0).getDate(); day++) {
    const key = dayKey(new Date(year, month, day)); const info = summary[key]; const sticker = web.stickerOn(key);
    const quest = !!(store.state.quests.doneDays || {})[key]; const noCount = !info && !!web.nocountDays()[key];
    cells.push({ key, day, today: key === today, played: !!info, best: info ? Number(info.best).toLocaleString('zh-CN') : '', stamp: info ? asset(info.best > 100 ? 'stamp-gold' : 'stamp-red') : '', sticker: sticker ? asset('sticker-' + sticker) : '', quest, noCount, label: `${month + 1}月${day}日${info ? ` ${info.plays}次 最佳${info.best}分` : ''}${quest ? ' 任务全完成' : ''}${noCount ? ' 补签' : ''}` });
  }
  const bonus = web.bonusState(); const run = bonus.run || 0; const slot = run ? (run - 1) % 7 + 1 : 0;
  return { year, month: month + 1, title: `${year}年${month + 1}月`, cells, weekdays: ['日', '一', '二', '三', '四', '五', '六'], streak: web.streak(at), bestStreak: web.bestStreak(), playedToday: store.state.history.some(r => r.day === today), totalStickers: bonus.total || 0, hammers: web.items().hammer, hammerImage: asset('hammer'), nextDisabled: new Date(year, month + 1, 1) > at, slots: web.STICKERS.map((type, i) => ({ day: i + 1, image: asset('sticker-' + type), got: i < slot, today: i + 1 === slot })), run };
}
function dayRecords(store, key) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key || '')) return null;
  const [year, month, day] = key.split('-').map(Number); const info = store.web.monthSummary(year, month - 1)[key];
  if (!info) return null;
  const names = { grade: r => `${r.grade}年级`, level: () => '适合我的题', practice: r => `练习（${SKILL[r.skill] ? SKILL[r.skill].name : '专项'}）`, review: () => '复习', drill: r => `${r.count || ''}题算术练习` };
  return { title: `${month}月${day}日的记录`, entries: info.entries.slice().reverse().map((r, i) => {
    const d = new Date(r.at || 0); const seconds = Math.floor((r.timeMs || 0) / 1000);
    return { id: r.id || `${key}-${i}`, time: `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`, mode: (names[r.mode] || (() => '练习'))(r), score: Number(r.score || 0).toLocaleString('zh-CN'), detail: `答对 ${r.ok == null ? '—' : r.ok}　答错 ${r.ng == null ? '—' : r.ng}${r.extraOk ? `　加时挑战 ${r.extraOk}题` : ''}　${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}` };
  }) };
}
module.exports = { monthModel, dayRecords };
