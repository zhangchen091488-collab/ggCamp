const packs = require('../content/catalog.js');
const pack = require('../content/english-demo.js');
const { planEnglishPractice } = require('../shared/english-plan.js');
const { emptyEnglishProgress, recordEnglishResult, englishDayNumber } = require('../shared/english-progress.js');
const { createEnglishAttempt, submitEnglishAnswer, skipEnglishAttempt, useEnglishHint } = require('../shared/english-answer.js');
const features = require('./features.js');
const growth = require('../shared/growth.js');
const score = require('../shared/scoring.js');
const { normalizeEnglishAnswer } = require('../shared/english-answer.js');
const { dayKey } = require('../shared/store.js');

// Academic records stay separate; real textbook practice shares game growth.
const isRecord = (value) => !!value && typeof value === 'object' && !Array.isArray(value);
function validSession(s) {
  if (!isRecord(s) || !isRecord(s.plan) || !packs.some((entry) => entry.packId === s.plan.packId)) return false;
  if (!Array.isArray(s.attempts) || !s.attempts.length || s.attempts.length > 14 || !Number.isInteger(s.index) || s.index < 0 || s.index >= s.attempts.length) return false;
  if (!Array.isArray(s.plan.learningIds) || !['meaning', 'dictation'].includes(s.plan.exerciseType) || !['learn', 'answer', 'feedback'].includes(s.phase) || !Number.isFinite(s.elapsedMs) || s.elapsedMs < 0 || !isRecord(s.look)) return false;
  try { englishDayNumber(s.plan.day); } catch { return false; }
  return s.attempts.every((a) => {
    if (!isRecord(a) || typeof a.questionId !== 'string' || !a.questionId || !isRecord(a.item)) return false;
    const item = a.item;
    if (typeof item.itemId !== 'string' || typeof item.canonical !== 'string' || !item.canonical.length || item.canonical.length > 200 || typeof item.promptZh !== 'string') return false;
    if (!Array.isArray(item.acceptedAnswers) || !item.acceptedAnswers.length || !item.acceptedAnswers.every((answer) => typeof answer === 'string' && answer.length <= 200)) return false;
    if (typeof a.draft !== 'string' || a.draft.length > 200 || !Number.isInteger(a.submissions) || a.submissions < 0) return false;
    if (!['assisted', 'completed', 'firstIndependent', 'skipped'].every((key) => typeof a[key] === 'boolean')) return false;
    return a.hintIndices === undefined || Array.isArray(a.hintIndices) && a.hintIndices.every((index) => Number.isInteger(index) && index >= 0 && index < item.canonical.length);
  });
}
function state(store) {
  let repaired = !!store.state.englishDemo && !isRecord(store.state.englishDemo);
  if (!isRecord(store.state.englishDemo)) store.state.englishDemo = { version: 1, progress: emptyEnglishProgress(), session: null, result: null };
  const english = store.state.englishDemo;
  if (!isRecord(english.progress) || !isRecord(english.progress.records) || !isRecord(english.progress.processed)) { english.progress = emptyEnglishProgress(); repaired = true; }
  if (english.session != null && !validSession(english.session)) { english.session = null; repaired = true; }
  if (repaired && typeof store.warning === 'function') store.warning('英语练习记录不完整，已保留其它有效进度。');
  if (english.session && english.session.rewardEnabled === undefined) {
    const selected = packs.find((entry) => entry.packId === english.session.plan.packId);
    english.session.rewardEnabled = !!selected && selected.seriesId !== 'demo-english';
    english.session.grade = selected && selected.grade;
  }
  return english;
}
function selectedPack(store) {
  const selected = state(store).packId;
  return packs.find((entry) => entry.packId === selected) || packs[0];
}
function selectPack(store, packId) {
  if (!packs.some((entry) => entry.packId === packId)) throw new Error('请选择有效教材');
  state(store).packId = packId; store.save();
}
// Selection is metadata-driven; changing it never mutates a saved session.
function seriesOptions() {
  return [...new Set(packs.map((entry) => entry.seriesId))].map((id) => ({ id, title: id === 'demo-english' ? '英语技术演示（非教材）' : packs.find((entry) => entry.seriesId === id).title.split(' · ')[0] }));
}
function availableGrades(store) {
  const seriesId = selectedPack(store).seriesId;
  return [...new Set(packs.filter((entry) => entry.seriesId === seriesId).map((entry) => entry.grade))].sort((a, b) => a - b);
}
function selectScope(store, scope) {
  const previous = selectedPack(store);
  const seriesId = scope.seriesId || previous.seriesId;
  const grade = scope.grade === undefined ? previous.grade : Number(scope.grade);
  const semester = scope.semester || previous.semester;
  const candidates = packs.filter((entry) => entry.seriesId === seriesId);
  let next = candidates.find((entry) => entry.grade === grade && entry.semester === semester);
  if (!next && scope.seriesId) next = candidates.find((entry) => entry.grade === grade) || candidates[0];
  if (!next) return false;
  selectPack(store, next.packId); return true;
}
function current(store) {
  const s = state(store).session;
  return s && s.attempts[s.index];
}
function start(store, options, look, now = Date.now()) {
  const english = state(store);
  const selected = selectedPack(store);
  const plan = planEnglishPractice(selected, english.progress, { unitIds: selected.units.map((u) => u.unitId), exerciseType: 'meaning', day: dayKey(new Date(now)), ...options });
  if (!plan.count) return null;
  const id = `${now}-${Math.random().toString(36).slice(2)}`;
  english.session = { id, plan, packTitle: selected.title, grade: selected.grade, rewardEnabled: selected.seriesId !== 'demo-english', combo: 0, comboPeak: 0, dopaL: 0, rewarded: 0, look: JSON.parse(JSON.stringify(look)), index: 0, elapsedMs: 0, phase: plan.learningIds.includes(plan.items[0].itemId) ? 'learn' : 'answer', attempts: plan.items.map((item, i) => createEnglishAttempt(item, `${id}-${i}`)) };
  english.result = null;
  store.save(); return english.session;
}
function updateDraft(store, draft) {
  const a = current(store);
  if (!a || a.completed || typeof draft !== 'string' || draft.length > 200) return false;
  a.draft = formatDraft(a, draft); store.save(); return true;
}
function learn(store) {
  const s = state(store).session;
  if (s && s.phase === 'learn') { s.phase = 'answer'; store.save(); }
}
// Word separators belong to the question layout, never to editable letter slots.
function formatDraft(attempt, input) {
  const expected = attempt.item.canonical.replace(/[.!?。！？]+$/, '');
  let draft = '';
  for (const value of input.replace(/ /g, '').slice(0, expected.replace(/ /g, '').length)) {
    while (expected[draft.length] === ' ') draft += ' ';
    draft += value;
  }
  if (draft) while (expected[draft.length] === ' ') draft += ' ';
  return draft;
}
function letterOffset(draft, count) {
  let seen = 0;
  for (let i = 0; i < draft.length; i++) {
    if (draft[i] === ' ') continue;
    if (seen === count) return i;
    seen++;
  }
  return draft.length;
}
function editDraft(attempt, cursor, key, shift) {
  const formatted = formatDraft(attempt, attempt.draft);
  const capacity = attempt.item.canonical.replace(/[.!?。！？]+$/, '').replace(/ /g, '').length;
  let letters = formatted.replace(/ /g, '');
  let position = Math.min(letters.length, formatted.slice(0, cursor).replace(/ /g, '').length);
  if (key === 'left') position = Math.max(0, position - 1);
  else if (key === 'right') position = Math.min(letters.length, position + 1);
  else if (key === 'clear') { letters = ''; position = 0; }
  else if (key === 'backspace') {
    if (position) { letters = letters.slice(0, position - 1) + letters.slice(position); position--; }
  } else if (key !== 'space') {
    const value = shift ? key.toUpperCase() : key;
    const replaced = Math.min(value.length, letters.length - position);
    if (letters.length - replaced + value.length <= capacity) {
      letters = letters.slice(0, position) + value + letters.slice(position + replaced); position += value.length;
    }
  }
  const draft = formatDraft(attempt, letters);
  return draft.length <= 200 ? { draft, cursor: letterOffset(draft, position) } : { draft: attempt.draft, cursor };
}
function answerCells(attempt, cursor) {
  const expected = attempt.item.canonical.replace(/[.!?。！？]+$/, '');
  const draft = formatDraft(attempt, attempt.draft);
  const length = expected.length;
  return Array.from({ length }, (_, index) => ({
    index, value: draft[index] || '',
    hint: (attempt.hintIndices || []).includes(index) ? expected[index] : '',
    space: expected[index] === ' ',
    active: index === cursor,
  }));
}
function hint(store, rng = Math.random) {
  const a = current(store);
  if (!a || a.completed) return null;
  const expected = a.item.canonical.replace(/[.!?。！？]+$/, '');
  const revealed = a.hintIndices || [];
  const candidates = Array.from(expected).map((letter, index) => ({ letter, index }))
    .filter(({ letter, index }) => /[a-z]/i.test(letter) && !revealed.includes(index) && (a.draft[index] || '').toLowerCase() !== letter.toLowerCase());
  if (!candidates.length) return null;
  const choice = candidates[Math.floor(rng() * candidates.length)];
  useEnglishHint(a, 'random-letter');
  if (state(store).session.rewardEnabled) state(store).session.combo = 0;
  a.hintIndices = [...revealed, choice.index];
  store.save(); return choice;
}
function complete(store, skip = false, at = Date.now()) {
  const english = state(store); const s = english.session; const a = current(store);
  if (!s || !a || s.phase !== 'answer') return { status: 'ignored' };
  const result = skip ? skipEnglishAttempt(a) : submitEnglishAnswer(a, a.draft);
  if (a.completed && result.status !== 'ignored') {
    recordEnglishResult(english.progress, { packId: s.plan.packId, itemId: a.item.itemId, exerciseType: s.plan.exerciseType, eventId: a.questionId, day: s.plan.day, firstIndependent: a.firstIndependent });
    s.phase = 'feedback';
    if (s.rewardEnabled) {
      const day = dayKey(new Date(at));
      if (!english.dailyRewards || english.dailyRewards.day !== day) english.dailyRewards = { day, entries: {} };
      const key = JSON.stringify([s.plan.exerciseType, normalizeEnglishAnswer(a.item.canonical)]);
      const eligible = a.firstIndependent && !english.dailyRewards.entries[key];
      result.rewardUnits = eligible ? 1 : 0;
      if (eligible) {
        english.dailyRewards.entries[key] = true;
        s.rewarded = (s.rewarded || 0) + 1; s.combo = (s.combo || 0) + 1;
        s.comboPeak = Math.max(s.comboPeak || 0, s.combo);
        const base = score.basicDopaL(s.rewarded / s.attempts.length) - score.basicDopaL((s.rewarded - 1) / s.attempts.length);
        s.dopaL = score.addDopa(s.dopaL || 0, base, s.combo);
        growth.noteSolve(store.state.stats, { cells: 1, firstTry: true, review: s.plan.mode === 'review', combo: s.combo });
        growth.noteDopa(store.state.stats, s.dopaL);
        features.event(store, { type: 'solve', firstTry: true, review: s.plan.mode === 'review' }, at);
        features.event(store, { type: 'combo', value: s.combo }, at);
      } else s.combo = 0;
    }
  }
  if (s.rewardEnabled && result.status === 'wrong') s.combo = 0;
  store.save(); return result;
}
function advance(store, at = Date.now()) {
  const english = state(store); const s = english.session;
  if (!s || s.phase !== 'feedback') return false;
  s.index++;
  if (s.index === s.attempts.length) {
    const first = s.attempts.filter((a) => a.firstIndependent).length;
    english.result = { id: s.id, packId: s.plan.packId, packTitle: s.packTitle, count: s.attempts.length, first, firstRate: Math.round(first / s.attempts.length * 100), retries: s.attempts.reduce((n, a) => n + Math.max(0, a.submissions - 1), 0), skipped: s.attempts.filter((a) => a.skipped).length, elapsedMs: s.elapsedMs, kind: s.plan.kind, look: s.look, wrong: s.attempts.filter((a) => !a.firstIndependent).map((a) => ({ itemId: a.item.itemId, canonical: a.item.canonical, promptZh: a.item.promptZh })) };
    english.session = null;
    const r = english.result; r.rewarded = s.rewarded || 0; r.dopaL = s.dopaL || 0; r.comboPeak = s.comboPeak || 0; r.fresh = [];
    // A round with no independently earned answers cannot be used to farm play tasks.
    if (s.rewardEnabled && r.rewarded > 0 && !store.state.history.some((entry) => entry.id === s.id)) {
      const day = dayKey(new Date(at));
      const retries = s.attempts.reduce((n, attempt) => n + Math.max(0, attempt.submissions - (attempt.skipped ? 0 : 1)), 0);
      store.state.history.push({ id: s.id, subject: 'english', mode: 'english', practiceMode: s.plan.mode, packId: s.plan.packId, packTitle: s.packTitle, grade: s.grade, count: r.count, score: score.BASIC_SCORE, ok: s.attempts.filter((attempt) => !attempt.skipped).length, ng: retries, firstRate: r.first / r.count, timeMs: r.elapsedMs, dopaL: r.dopaL, day, at });
      store.state.history = store.state.history.slice(-3000);
      growth.notePlay(store.state.stats, { mode: s.plan.mode === 'review' ? 'review' : 'grade', grade: s.grade, day, timeMs: r.elapsedMs, dopaL: r.dopaL, firstRate: r.first / r.count, weekday: new Date(at).getDay() });
      features.event(store, { type: 'play', mode: s.plan.mode === 'review' ? 'review' : 'grade' }, at);
      r.fresh = features.checkTrophies(store, at);
      r.recorded = true;
    }
  } else s.phase = s.plan.learningIds.includes(current(store).item.itemId) ? 'learn' : 'answer';
  store.save(); return !english.session;
}
function addTime(store, ms) {
  const s = state(store).session;
  if (s && Number.isFinite(ms) && ms > 0) { s.elapsedMs += ms; store.save(); }
}
module.exports = { pack, packs, state, selectedPack, selectPack, seriesOptions, availableGrades, selectScope, current, start, updateDraft, learn, formatDraft, letterOffset, editDraft, answerCells, hint, complete, advance, addTime };
