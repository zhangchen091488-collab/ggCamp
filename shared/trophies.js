// Generated from app/js/trophies.js by tools/build_miniprogram.mjs. Do not edit.
// Trophies (id036): many small achievements, like the ones in mobile games.
// Each series is one measure with rising steps; every step is a trophy.
// Days and streaks get dense steps; volume series get wide ones so long
// sessions are not pushed too hard (docs/SPEC.md 14.7). Nothing is
// random, conditions are always shown (except a few secrets), and a trophy,
// once earned, is kept.
const { SKILLS, LANES } = require('./skills.js');
const { isUnlocked, isMastered, starsOf } = require('./session.js');

const CATS = ['坚持', '积累', '技能', '成长', '加时挑战', '连击', '准确', '欢乐值', '复习', '年级', '收藏', '神秘'];

const fmt = (n) => (n >= 10000 && n % 10000 === 0 ? `${n / 10000}万` : n.toLocaleString('zh-CN'));
const DOPA_LABEL = { 2: '100', 3: '1000', 4: '1万', 5: '10万', 6: '100万', 7: '1000万', 8: '1亿', 9: '10亿' };
const RANKS = ['bronze', 'silver', 'gold', 'rainbow'];
const RANK_NAME = { bronze: '铜', silver: '银', gold: '金', rainbow: '彩虹', secret: '神秘' };

// Rank by position in its series: first ~30% bronze, then silver, gold, and the last step rainbow.
function rankAt(i, n) {
  if (n === 1) return 'gold';
  if (i === n - 1) return 'rainbow';
  return RANKS[Math.min(2, Math.floor((i / (n - 1)) * 3.3))];
}

// A series: { key, cat, title, metric, steps, name(v), desc(v) } or explicit items.
const SERIES_DEFS = [
  { key: 'streak', cat: '坚持', title: '连续练习', metric: 'bestStreak', steps: [3, 5, 7, 10, 14, 21, 30, 50, 75, 100, 150, 200, 365], name: (v) => `连续 ${v} 天`, desc: (v) => `连续练习 ${v} 天` },
  { key: 'days', cat: '坚持', title: '练习天数', metric: 'days', steps: [1, 3, 5, 7, 10, 15, 20, 30, 40, 50, 75, 100, 150, 200, 300, 365, 500, 730, 1000], name: (v) => `练习 ${fmt(v)} 天`, desc: (v) => `累计练习 ${fmt(v)} 天` },
  { key: 'stickers', cat: '坚持', title: '签到贴纸', metric: 'stickers', steps: [1, 7, 14, 30, 50, 100, 200, 365], name: (v) => `${v} 张贴纸`, desc: (v) => `收集 ${v} 张签到贴纸` },
  { key: 'crowns', cat: '坚持', title: '皇冠贴纸', metric: 'crowns', steps: [1, 3, 5, 10, 20, 52], name: (v) => `${v} 张皇冠贴纸`, desc: (v) => `收集 ${v} 张第 7 天的皇冠贴纸` },
  { key: 'problems', cat: '积累', title: '完成题目', metric: 'problems', steps: [10, 30, 50, 100, 200, 300, 500, 750, 1000, 1500, 2000, 3000, 5000, 7500, 10000, 20000, 30000, 50000, 100000], name: (v) => `完成 ${fmt(v)} 题`, desc: (v) => `累计完成 ${fmt(v)} 道题` },
  { key: 'cells', cat: '积累', title: '输入数字', metric: 'cells', steps: [100, 500, 1000, 3000, 5000, 10000, 30000, 50000, 100000, 300000], name: (v) => `输入 ${fmt(v)} 位`, desc: (v) => `累计正确输入 ${fmt(v)} 位数字` },
  { key: 'plays', cat: '积累', title: '练习轮数', metric: 'plays', steps: [1, 3, 5, 10, 20, 30, 50, 100, 200, 300, 500, 1000, 2000], name: (v) => `完成 ${fmt(v)} 轮`, desc: (v) => `累计完成 ${fmt(v)} 轮算术练习` },
  { key: 'minutes', cat: '积累', title: '练习时长', metric: 'minutes', steps: [10, 30, 60, 120, 300, 600, 1200, 3000], name: (v) => `练习 ${v} 分钟`, desc: (v) => `累计练习 ${v} 分钟` },
  { key: 'unlocked', cat: '技能', title: '解锁技能', metric: 'unlocked', steps: [3, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 58], name: (v) => `解锁 ${v} 个技能`, desc: (v) => `解锁 ${v} 个技能` },
  { key: 'mastered', cat: '技能', title: '掌握技能', metric: 'mastered', steps: [1, 3, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 58], name: (v) => `掌握 ${v} 个技能`, desc: (v) => `掌握 ${v} 个技能` },
  { key: 'gradeDone', cat: '技能', title: '全年级技能掌握', items: [1, 2, 3, 4, 5, 6].map((g) => ({ id: `gradeDone-${g}`, metric: `gradeDone${g}`, need: 1, name: `${g} 年级全部掌握`, desc: `掌握 ${g} 年级的全部技能` })) },
  { key: 'laneDone', cat: '技能', title: '全类别技能掌握', items: LANES.map((l, i) => ({ id: `laneDone-${i}`, metric: `laneDone${i}`, need: 1, name: `${l}全部掌握`, desc: `掌握“${l}”的全部技能` })) },
  { key: 'extras', cat: '加时挑战', title: '进入加时挑战', metric: 'extras', steps: [1, 3, 5, 10, 20, 30, 50, 100, 200, 300], name: (v) => `挑战 ${v} 次`, desc: (v) => `进入加时挑战 ${v} 次` },
  { key: 'extraBest', cat: '加时挑战', title: '加时单轮最佳', metric: 'extraBest', steps: [3, 5, 7, 10, 12, 15, 18, 20, 23, 25, 30], name: (v) => `一轮完成 ${v} 题`, desc: (v) => `在一轮加时挑战中完成 ${v} 题` },
  { key: 'extraSolved', cat: '加时挑战', title: '加时累计答题', metric: 'extraSolved', steps: [10, 30, 50, 100, 200, 300, 500, 1000, 2000, 3000], name: (v) => `加时完成 ${fmt(v)} 题`, desc: (v) => `在加时挑战中累计完成 ${fmt(v)} 题` },
  { key: 'combo', cat: '连击', title: '连击', metric: 'maxCombo', steps: [5, 10, 15, 20, 30, 40, 50, 75, 100, 150, 200, 300], name: (v) => `${v} 连击`, desc: (v) => `达成 ${v} 连击` },
  { key: 'perfects', cat: '准确', title: '全对通关', metric: 'perfects', steps: [1, 3, 5, 10, 20, 30, 50, 100, 200, 300], name: (v) => `全对通关 ${v} 次`, desc: (v) => `以 100% 首次正确率完成 ${v} 轮练习` },
  { key: 'firstTry', cat: '准确', title: '首次答对', metric: 'firstTry', steps: [10, 50, 100, 300, 500, 1000, 3000, 5000, 10000, 30000], name: (v) => `首次答对 ${fmt(v)} 题`, desc: (v) => `累计首次答对 ${fmt(v)} 道题` },
  { key: 'dopa', cat: '欢乐值', title: '欢乐值', metric: 'bestDopaL', steps: [2, 3, 4, 5, 6, 7, 8, 9], name: (v) => `${DOPA_LABEL[v]} 欢乐值`, desc: (v) => `在一轮练习中达到 ${DOPA_LABEL[v]} 欢乐值` },
  { key: 'review', cat: '复习', title: '错题复习', metric: 'reviewSolved', steps: [1, 5, 10, 30, 50, 100, 200, 300], name: (v) => `复习 ${v} 题`, desc: (v) => `重新完成 ${v} 道错题` },
  ...[1, 2, 3, 4, 5, 6].map((g) => ({ key: `grade${g}`, cat: '年级', title: `${g} 年级练习`, metric: `gradePlays${g}`, steps: [1, 10, 30], name: (v) => `${g} 年级 ${v} 轮`, desc: (v) => `完成 ${v} 轮 ${g} 年级练习` })),
  { key: 'secret', cat: '神秘', title: '神秘', items: [
    { id: 'secret-perfect14', metric: 'flag:perfect14', need: 1, name: '14 题全对', desc: '完成 14 题，答错 0 次', secret: true },
    { id: 'secret-extraClean', metric: 'flag:extraClean', need: 1, name: '加时全对', desc: '加时完成至少 5 题，答错 0 次', secret: true },
    { id: 'secret-sunday', metric: 'flag:sunday', need: 1, name: '星期日的算术', desc: '在星期日练习', secret: true },
    { id: 'secret-newyear', metric: 'flag:newyear', need: 1, name: '新年第一练', desc: '在 1 月 1 日练习', secret: true },
    { id: 'secret-comeback', metric: 'flag:comeback', need: 1, name: '欢迎回来！', desc: '间隔至少一周后再次练习', secret: true },
    { id: 'secret-allmodes', metric: 'allModes', need: 1, name: '体验全部玩法', desc: '体验适合我的题、年级练习、专项练习和错题复习', secret: true },
  ] },
];

// Other features add their own series (id045). Keep this list append-only.
const SERIES = [];
const TROPHIES = [];
const TROPHY = {};
function addSeries(def) {
  const items = def.items
    ? def.items.map((it, i, a) => ({ rank: it.secret ? 'secret' : rankAt(i, a.length), ...it }))
    : def.steps.map((v, i, a) => ({ id: `${def.key}-${v}`, metric: def.metric, need: v, name: def.name(v), desc: def.desc(v), rank: rankAt(i, a.length) }));
  const series = { key: def.key, cat: def.cat, title: def.title, items: items.map((it) => ({ ...it, series: def.key, cat: def.cat, reward: it.reward || null })) };
  SERIES.push(series);
  for (const it of series.items) { TROPHIES.push(it); TROPHY[it.id] = it; }
  return series;
}
SERIES_DEFS.forEach(addSeries);

// id045: the features added after id036 (stars, quests, hammer, rust,
// time capsule, "进步反馈", collection).
[
  { key: 'questDays', cat: '坚持', title: '任务全完成', metric: 'questDays', steps: [1, 3, 7, 14, 30, 50, 100, 200, 365], name: (v) => `全完成 ${v} 天`, desc: (v) => `有 ${v} 天完成了全部今日任务` },
  { key: 'questRun', cat: '坚持', title: '连续完成任务', metric: 'questRun', steps: [2, 3, 5, 7, 14, 30], name: (v) => `连续 ${v} 天完成任务`, desc: (v) => `连续 ${v} 天完成全部今日任务` },
  { key: 'hammer', cat: '坚持', title: '补签锤', metric: 'hammerUsed', steps: [1, 3, 10], name: (v) => `补签 ${v} 次`, desc: (v) => `使用补签锤 ${v} 次` },
  { key: 'starsTotal', cat: '技能', title: '技能星星', metric: 'starsTotal', steps: [5, 10, 25, 50, 75, 100, 150, 200, 250, 290], name: (v) => `${v} 颗星星`, desc: (v) => `累计收集 ${v} 颗技能星星` },
  { key: 'star5', cat: '技能', title: '五星技能', metric: 'star5', steps: [1, 3, 5, 10, 20, 30, 58], name: (v) => `${v} 个五星技能`, desc: (v) => `将 ${v} 个技能练到 ☆5` },
  { key: 'gradeStar3', cat: '技能', title: '全年级三星', items: [1, 2, 3, 4, 5, 6].map((g) => ({ id: `gradeStar3-${g}`, metric: `gradeStar3${g}`, need: 1, name: `${g} 年级全部三星`, desc: `将 ${g} 年级的全部技能练到 ☆3 或以上` })) },
  { key: 'polished', cat: '成长', title: '恢复熟练', metric: 'polished', steps: [1, 3, 5, 10, 30, 50], name: (v) => `恢复熟练 ${v} 次`, desc: (v) => `将生疏的技能重新练熟 ${v} 次` },
  { key: 'capsules', cat: '成长', title: '时光胶囊', metric: 'capsules', steps: [1, 3, 5, 10, 30], name: (v) => `${v} 个胶囊`, desc: (v) => `打开 ${v} 个时光胶囊` },
  { key: 'capsuleFaster', cat: '成长', title: '比过去更快', metric: 'capsuleFaster', steps: [1, 5, 10], name: (v) => `进步 ${v} 次`, desc: (v) => `在时光胶囊中比过去答得更快 ${v} 次` },
  { key: 'grew', cat: '成长', title: '你进步啦！', metric: 'grew', steps: [1, 5, 10, 30, 50, 100], name: (v) => `进步 ${v} 次`, desc: (v) => `在结算时获得 ${v} 次进步反馈` },
  { key: 'items', cat: '收藏', title: '收藏', metric: 'itemsOwned', steps: [10, 20, 30, 40, 48], name: (v) => `${v} 件收藏`, desc: (v) => `收集 ${v} 件收藏` },
  { key: 'catComplete', cat: '收藏', title: '集齐一类收藏', metric: 'catComplete', steps: [1, 3, 5, 8], name: (v) => `集齐 ${v} 类`, desc: (v) => `集齐 ${v} 类收藏的全部物品` },
].forEach(addSeries);

// Numbers every trophy is measured against, from the saved state.
// snap: { stats, prog, bestStreak, stickers, crowns, ...extra metrics }
function trophyMetrics(snap) {
  const s = snap.stats || {};
  const prog = snap.prog || { skills: {} };
  const m = {
    bestStreak: snap.bestStreak || 0, days: s.days || 0, stickers: snap.stickers || 0, crowns: snap.crowns || 0,
    problems: s.problems || 0, cells: s.cells || 0, plays: s.plays || 0, minutes: Math.floor((s.playMs || 0) / 60000),
    unlocked: SKILLS.filter((x) => isUnlocked(prog, x.id)).length, mastered: SKILLS.filter((x) => isMastered(prog, x.id)).length,
    extras: s.extras || 0, extraBest: s.extraBest || 0, extraSolved: s.extraSolved || 0, maxCombo: s.maxCombo || 0,
    perfects: s.perfects || 0, firstTry: s.firstTry || 0, bestDopaL: Math.floor((s.bestDopaL || 0) + 1e-9), reviewSolved: s.reviewSolved || 0,
  };
  const stars = Object.fromEntries(SKILLS.map((x) => [x.id, starsOf(prog, x.id)]));
  m.starsTotal = Object.values(stars).reduce((a, b) => a + b, 0);
  m.star5 = Object.values(stars).filter((n) => n >= 5).length;
  m.polished = s.polished || 0; m.capsules = s.capsules || 0; m.capsuleFaster = s.capsuleFaster || 0; m.grew = s.grew || 0;
  for (let g = 1; g <= 6; g++) {
    m[`gradeStar3${g}`] = SKILLS.filter((x) => x.grade === g).every((x) => stars[x.id] >= 3) ? 1 : 0;
    m[`gradeDone${g}`] = SKILLS.filter((x) => x.grade === g).every((x) => isMastered(prog, x.id)) ? 1 : 0;
    m[`gradePlays${g}`] = (s.grades || {})[g] || 0;
  }
  LANES.forEach((_, i) => { m[`laneDone${i}`] = SKILLS.filter((x) => x.lane === i).every((x) => isMastered(prog, x.id)) ? 1 : 0; });
  for (const [k, v] of Object.entries(s.flags || {})) if (v) m[`flag:${k}`] = 1;
  const modes = s.modes || {};
  m.allModes = ['level', 'grade', 'practice', 'review'].every((k) => modes[k]) ? 1 : 0;
  Object.assign(m, snap.extra || {});
  return m;
}
const valueOf = (m, metric) => m[metric] || 0;

// Earn every trophy whose condition is met. Returns the new ones (in list order).
// `state` is the saved { got: { id: time } }; the first call earns what the
// existing records already reach and marks them as a batch.
function evaluate(state, metrics, at = Date.now()) {
  state.got = state.got || {};
  const fresh = [];
  for (const t of TROPHIES) {
    if (state.got[t.id]) continue;
    if (valueOf(metrics, t.metric) >= t.need) { state.got[t.id] = at; fresh.push(t); }
  }
  if (!state.init) { state.init = true; state.batch = fresh.map((t) => t.id); return []; }
  return fresh;
}

const earnedCount = (state) => TROPHIES.filter((t) => state.got && state.got[t.id]).length;

// Progress of one series for the list screen.
function seriesView(series, state, metrics) {
  const got = series.items.filter((t) => state.got && state.got[t.id]);
  const next = series.items.find((t) => !(state.got && state.got[t.id]));
  const top = got[got.length - 1] || null;
  return { series, got, next, top, value: next ? valueOf(metrics, next.metric) : null };
}

module.exports = { CATS, RANK_NAME, SERIES, TROPHIES, TROPHY, addSeries, trophyMetrics, valueOf, evaluate, earnedCount, seriesView };
