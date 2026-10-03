const { makeRng, makeProblem, signature } = require('../shared/problems.js');
const sess = require('../shared/session.js');
const { SKILLS, SKILL, DEPTH } = require('../shared/skills.js');
const score = require('../shared/scoring.js');
const growth = require('../shared/growth.js');
const web = require('../shared/store.js');
const features = require('./features.js');
const clone = (p) => JSON.parse(JSON.stringify(p));
function dayKey(at) { return web.dayKey(new Date(at)); }
function newProblem(s, id, progress) {
  const r = progress.skills[id]; const recent = new Set([...(r ? r.recent : []), ...s.sigs]);
  const p = makeProblem(id, makeRng(s.seed + s.serial++ * 7919), recent); s.sigs.push(signature(p)); return p;
}
function createSession(grade, count, seed = Date.now(), options = {}) {
  const mode = options.mode || 'grade'; const progress = options.progress || sess.emptyProgress(); const rng = makeRng(seed);
  let plan;
  if (mode === 'grade') plan = sess.gradePlan(grade, count, rng);
  else if (mode === 'review') plan = sess.reviewPlan(progress.review.slice(-Math.min(count, 10)));
  else if (mode === 'practice') { if (!Object.prototype.hasOwnProperty.call(SKILL, options.skill)) throw new Error('未知技能'); plan = { basic: Array.from({ length: count }, () => options.skill) }; }
  else if (mode === 'demo') plan = { basic: Array.from({ length: count }, () => SKILLS[Math.floor(rng() * SKILLS.length)]).sort((a, b) => a.grade - b.grade || DEPTH[a.id] - DEPTH[b.id]).map((x) => x.id) };
  else plan = sess.levelPlan(progress, count, rng, seed);
  if (mode === 'review' && !plan.items.length) throw new Error('没有需要复习的错题');
  const s = { id: `${seed}-${grade}-${mode}`, seed, serial: 1, mode, skill: options.skill || null, grade, count: mode === 'review' ? plan.items.length : count, phase: 'basic', basicIds: plan.basic, placement: !!plan.placement, walk: plan.walk ? { ...plan.walk } : null, problems: [], index: 0, step: 0, values: {}, revealed: [], marks: {}, ng: 0, qNg: 0, ok: 0, firstTry: 0, elapsedMs: 0, questionMs: 0, wrong: '', feedback: '', paused: false, combo: 0, comboPeak: 0, comboRemaining: 0, dopaL: 0, sigs: [], wrongList: [], sessionTimes: {}, news: [], recorded: [], demo: mode === 'demo' };
  if (plan.placement) s.problems.push(newProblem(s, plan.pick(), progress));
  else if (mode === 'review') s.problems = plan.items.map((it) => clone(it.problem));
  else s.problems = plan.basic.map((id) => newProblem(s, id, progress));
  const capsule = !s.demo && !s.placement && ['level', 'grade', 'practice'].includes(mode) && count >= 4 && (!options.capsuleDay || options.capsuleDay !== dayKey(seed)) ? sess.pickCapsule(progress, seed) : null;
  if (capsule) { const p = clone(capsule.entry.p); p.capsule = { skill: capsule.skill, index: capsule.index, t: capsule.entry.t, m: capsule.entry.m, d: capsule.entry.d }; s.problems[Math.floor(count / 2)] = p; }
  armCombo(s); return s;
}
function armCombo(s) { const p = s.problems[s.index]; s.comboRemaining = p ? score.comboWindowMs(SKILL[p.skill].grade, s.step === 0) : 0; }
function current(s) { return s.problems[s.index]; }
function tick(s, ms) {
  if (s.paused || s.over) return;
  const p = current(s); const answering = p && s.step < p.steps.length;
  const delta = Math.max(0, ms);
  if (s.phase === 'extra') { const counted = Math.min(delta, s.extraRemaining); s.extraRemaining = Math.max(0, s.extraRemaining - delta); s.elapsedMs += counted; if (answering) s.questionMs += counted; if (!s.extraRemaining) s.over = true; }
  else if (answering) { s.elapsedMs += delta; s.questionMs += delta; }
  if (answering) { s.comboRemaining -= delta; if (s.comboRemaining <= 0) s.combo = 0; }
}
function input(s, digit, progress, at = Date.now(), store = null) {
  const p = current(s);
  if (!p || s.paused || s.over || s.step >= p.steps.length || !/^\d$/.test(digit)) return 'ignored';
  const st = p.steps[s.step];
  if (digit !== st.digit) { s.ng++; s.qNg++; s.stepNg = (s.stepNg || 0) + 1; s.combo = 0; s.wrong = digit; s.feedback = '再试一次，你可以的！'; return 'wrong'; }
  s.values[st.cell] = digit; s.revealed.push(...(st.after || [])); s.wrong = ''; s.step++; s.stepNg = 0; s.combo++; s.comboPeak = Math.max(s.comboPeak, s.combo);
  const base = s.phase === 'extra' ? score.extraProblemGain(s.ok) / p.steps.length : score.basicDopaL((s.index + s.step / p.steps.length) / s.count) - score.basicDopaL((s.index + (s.step - 1) / p.steps.length) / s.count);
  s.dopaL = score.addDopa(s.dopaL, base, s.combo); s.feedback = '答对啦！'; armCombo(s);
  if (store && !s.demo) { features.event(store, { type: 'combo', value: s.combo }, at); growth.noteDopa(store.state.stats, s.dopaL); }
  if (s.step < p.steps.length) return 'correct';
  s.ok++; if (!s.qNg) s.firstTry++;
  if (!s.demo) {
    const firstTry = s.qNg === 0;
    if (s.mode === 'review') { if (firstTry) progress.review = progress.review.filter((it) => it.sig !== signature(p)); else s.wrongList.push(clone(p)); }
    else if (!firstTry) { s.wrongList.push(clone(p)); if (!progress.review.some((it) => it.sig === signature(p))) progress.review.push({ sig: signature(p), skill: p.skill, problem: clone(p), at }); progress.review = progress.review.slice(-40); }
    if (s.placement && s.phase !== 'extra') { const plan = sess.placementPlan(progress, s.count); Object.assign(plan.walk, s.walk); plan.answer(firstTry); s.walk = { ...plan.walk }; }
    if (store) { features.event(store, { type: 'solve', firstTry, review: s.mode === 'review', extra: s.phase === 'extra', skill: p.skill, skillState: sess.stateOf(progress, p.skill) }, at); growth.noteSolve(store.state.stats, { cells: p.steps.length, firstTry, misses: s.qNg, review: s.mode === 'review', extra: s.phase === 'extra', extraSolved: s.phase === 'extra' ? s.ok : 0, combo: s.comboPeak }); }
    const result = sess.recordResult(progress, p.skill, firstTry, signature(p), { ms: s.questionMs, cells: p.steps.length, misses: s.qNg, day: dayKey(at), at, problem: p });
    for (const id of result.unlocked) s.news.push(`解锁啦！${SKILL[id].name}`);
    if (result.mastered) s.news.push(`掌握了 ${SKILL[p.skill].name}`);
    if (result.stars) s.news.push(`${SKILL[p.skill].name} 升星啦！`);
    if (result.polished && store) { store.state.stats.polished = (store.state.stats.polished || 0) + 1; s.news.push(`${SKILL[p.skill].name} 恢复熟练啦！`); }
    const times = s.sessionTimes[p.skill] || (s.sessionTimes[p.skill] = { n: 0, ms: 0, c: 0, f: 0 }); times.n++; times.ms += s.questionMs; times.c += p.steps.length; times.f += firstTry ? 1 : 0;
    if (p.capsule && store) { sess.useCapsule(progress, p.capsule.skill, p.capsule.index, at); const cmp = growth.capsuleCompare(p.capsule, s.questionMs, s.qNg); store.state.stats.capsules = (store.state.stats.capsules || 0) + 1; if (cmp.what === 'time') store.state.stats.capsuleFaster = (store.state.stats.capsuleFaster || 0) + 1; s.news.push(cmp.what === 'time' ? `时光胶囊：比那一天快了 ${((cmp.from - cmp.to) / 1000).toFixed(1)} 秒！` : cmp.what === 'miss' ? `时光胶囊：从答错 ${cmp.from} 次进步到 ${cmp.to} 次！` : '又完成了那一天的题目！'); }
  }
  s.feedback = p.answerText; return 'solved';
}
function extraSkill(s, progress) {
  if (s.mode === 'grade') return sess.gradePlan(s.grade, s.count, makeRng(s.seed)).extra(s.ok);
  if (s.mode === 'practice') { const kids = SKILLS.filter((x) => x.req.includes(s.skill) && sess.isUnlocked(progress, x.id)); return kids.length ? kids[s.ok % kids.length].id : s.skill; }
  if (s.demo) { const pool = SKILLS.filter((x) => x.grade >= 4); return pool[s.ok % pool.length].id; }
  return sess.levelPlan(progress, s.count, makeRng(s.seed)).extra(s.ok);
}
function next(s, progress = sess.emptyProgress()) {
  const p = current(s); if (!p || s.step !== p.steps.length || s.over) return false;
  s.index++; s.step = 0; s.values = {}; s.revealed = []; s.marks = {}; s.qNg = 0; s.questionMs = 0; s.wrong = ''; s.feedback = ''; s.stepNg = 0;
  if (s.phase === 'extra') s.problems = [newProblem(s, extraSkill(s, progress), progress)], s.index = 0;
  else if (s.placement && s.index < s.count) { const plan = sess.placementPlan(progress, s.count); Object.assign(plan.walk, s.walk); s.problems.push(newProblem(s, plan.pick(), progress)); }
  armCombo(s); return true;
}
function finish(store, at = Date.now()) {
  const s = store.state.session; if (!s || (s.phase !== 'extra' && s.index < s.count) || (s.phase === 'extra' && !s.over)) return null;
  let result;
  if (s.phase === 'extra') {
    result = { ...s.basicResult, final: true, score: score.BASIC_SCORE + score.extraTotal(s.ok), extraOk: s.ok, extraNg: s.ng, dopaL: s.dopaL, extraTimeMs: 90000 - s.extraRemaining, fresh: [], news: s.news };
    if (!s.demo) { const rec = store.state.history.find((r) => r.id === result.id); if (rec) Object.assign(rec, { score: result.score, extraOk: s.ok, extraNg: s.ng, dopaL: s.dopaL }); if (s.ok >= 5 && !s.ng) growth.setFlag(store.state.stats, 'extraClean'); store.state.stats.playMs += result.extraTimeMs; }
    store.state.pending = null;
  } else {
    const firstRate = s.firstTry / s.count;
    result = { id: s.id, mode: s.mode, skill: s.skill, grade: s.grade, score: score.BASIC_SCORE, ok: s.ok, ng: s.ng, firstRate: Math.round(firstRate * 100), timeMs: s.elapsedMs, dopaL: s.dopaL, day: dayKey(at), final: false, eligible: firstRate >= 0.8 && s.mode !== 'review', fresh: [], news: s.news, demo: s.demo };
    if (!s.demo) {
      if (s.placement) store.state.progress.placed = true;
      const improvements = s.placement ? [] : growth.growthLines(s.sessionTimes, store.state.progress.skills, result.day);
      if (improvements.length) { store.state.stats.grew = (store.state.stats.grew || 0) + 1; result.growth = improvements.map((x) => `${SKILL[x.skill].name}：${x.what === 'time' ? '比以前更快啦！' : '首次正确率提高啦！'}`); }
      if (!store.state.history.some((r) => r.id === s.id)) { store.state.history.push({ id: s.id, mode: s.mode, grade: s.grade, skill: s.skill, count: s.count, score: result.score, ok: s.ok, ng: s.ng, firstRate, timeMs: s.elapsedMs, dopaL: s.dopaL, day: result.day, at }); growth.notePlay(store.state.stats, { mode: s.mode, grade: s.grade, day: result.day, timeMs: s.elapsedMs, dopaL: s.dopaL, firstRate, weekday: new Date(at).getDay() }); features.event(store, { type: 'play', mode: s.mode }, at); }
      if (s.count === 14 && !s.ng) growth.setFlag(store.state.stats, 'perfect14');
    }
    store.state.pending = s;
  }
  if (!s.demo) { result.fresh = features.checkTrophies(store, at); store.state.history = store.state.history.slice(-3000); }
  result.look = clone(s.look || {});
  store.state.result = result; store.state.session = null; store.save(); return result;
}
function startExtra(store) {
  const s = store.state.pending; const result = store.state.result;
  if (!s || !result || !result.eligible || result.final || s.extraStarted) return false;
  s.extraStarted = true; s.basicResult = clone(result); s.phase = 'extra'; s.extraRemaining = 90000; s.elapsedMs = 0; s.ok = 0; s.ng = 0; s.firstTry = 0; s.index = 0; s.step = 0; s.questionMs = 0; s.values = {}; s.revealed = []; s.marks = {}; s.combo = 0; s.paused = false; s.wrong = ''; s.feedback = ''; s.over = false;
  s.problems = [newProblem(s, extraSkill(s, store.state.progress), store.state.progress)]; armCombo(s);
  store.state.session = s; store.state.pending = null;
  if (!s.demo) { growth.noteExtraStart(store.state.stats); features.event(store, { type: 'extra' }); }
  store.save(); return true;
}
function sessionFor(store, options) {
  if (options.mode !== 'demo' && store.state.demoBackup) endDemo(store);
  if (options.mode === 'demo' && !store.state.demoBackup) store.state.demoBackup = clone({ session: store.state.session || null, pending: store.state.pending || null, result: store.state.result || null });
  const s = createSession(options.grade || 1, store.state.settings.count, Date.now(), { ...options, progress: store.state.progress, capsuleDay: (store.state.capsule || {}).lastDay });
  s.look = features.look(store, makeRng(s.seed)); store.state.pending = null; store.state.session = s; store.save(); return s;
}
function endDemo(store) { if (store.state.demoBackup) { Object.assign(store.state, store.state.demoBackup); delete store.state.demoBackup; } else { store.state.session = null; store.state.pending = null; } store.save(); }
function markCapsule(store) { const p = current(store.state.session); if (p && p.capsule) { store.state.capsule = { lastDay: dayKey(Date.now()) }; store.save(); } }
module.exports = { createSession, sessionFor, tick, input, next, finish, startExtra, current, markCapsule, endDemo };
