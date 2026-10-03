const web = require('../shared/store.js');
const session = require('../shared/session.js');
const { SKILLS } = require('../shared/skills.js');
const growth = require('../shared/growth.js');
const qs = require('../shared/quests.js');
const tr = require('../shared/trophies.js');
const ul = require('../shared/unlocks.js');
function ensureQuests(store, at = Date.now()) {
  const st = store.state; const prog = st.progress;
  const states = SKILLS.map((x) => session.stateOf(prog, x.id));
  const day = web.dayKey(new Date(at));
  qs.ensureDay(st.quests, day, { count: st.settings.count, review: prog.review.length, placed: !!prog.placed, hasNew: states.includes('new'), hasLearning: states.includes('new') || states.includes('learning'), extraOk: st.history.slice(-5).some((h) => h.extraOk != null), avgCells: st.stats.cells && st.stats.problems ? st.stats.cells / st.stats.problems : 2, rusty: session.rustyOf(prog, at), polishWeek: (st.quests.polishDays || []).filter((d) => growth.daysBetween(d, day) < 7).length, prog, now: at });
  return st.quests;
}
function event(store, ev, at = Date.now()) {
  const q = ensureQuests(store, at); const done = qs.questEvent(q, ev);
  const reward = qs.claimReward(q) ? web.addHammer(1) : 0;
  return { done: done.map(qs.questText), reward };
}
function metrics(store) {
  const st = store.state; const b = web.bonusState();
  const days = Object.keys(st.quests.doneDays || {}).sort(); let run = 0; let best = 0; let prev = null;
  for (const day of days) { run = prev && growth.daysBetween(prev, day) === 1 ? run + 1 : 1; best = Math.max(best, run); prev = day; }
  const own = ul.ITEMS.filter((it) => ul.isUnlocked(it, st.trophies.got));
  return tr.trophyMetrics({ stats: st.stats, prog: st.progress, bestStreak: web.bestStreak(), stickers: b.total || 0, crowns: Object.values(b.stickers || {}).filter((x) => x === 'crown').length, extra: { questDays: days.length, questRun: best, hammerUsed: web.items().used || 0, itemsOwned: own.length, catComplete: ul.CATS.filter((cat) => ul.ITEMS.filter((it) => it.cat === cat.key).every((it) => ul.isUnlocked(it, st.trophies.got))).length } });
}
function checkTrophies(store, at = Date.now()) {
  if (!store.state.trophies.init && !store.state.history.length) store.state.trophies.init = true;
  const fresh = [];
  for (let i = 0; i < 3; i++) { const got = tr.evaluate(store.state.trophies, metrics(store), at); fresh.push(...got); if (!got.length) break; }
  return fresh.map((t) => ({ id: t.id, name: t.name, desc: t.desc, reward: t.reward ? ul.ITEM[t.reward].name : '' }));
}
function questRows(store) { return ensureQuests(store).list.map((q) => ({ ...q, text: qs.questText(q), percent: Math.round(q.prog / q.goal * 100) })); }
function enterHome(store, at = Date.now()) {
  ensureQuests(store, at); const bonus = web.claimLogin(new Date(at)); const fresh = checkTrophies(store, at); store.save();
  return { bonus, fresh, hammer: web.hammerOffer(new Date(at)) };
}
// `got` defaults to the real trophies; the collection debug switch passes an all-earned map so the
// preview can use items the player has not unlocked yet.
function look(store, rng = Math.random, got = store.state.trophies.got) {
  return { ...ul.pickLook(store.state.equip, got, rng), character: store.state.settings.character === 'boy' ? 'boy' : 'girl' };
}
module.exports = { ensureQuests, event, metrics, checkTrophies, questRows, enterHome, look };
