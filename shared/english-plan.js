// Generated from app/js/english-plan.js by tools/build_miniprogram.mjs. Do not edit.
const { assertEnglishPack, englishProgressKey, ENGLISH_EXERCISE_TYPES } = require('./english-content.js');
const { englishDayNumber } = require('./english-progress.js');

function planEnglishPractice(pack, progress, options) {
  assertEnglishPack(pack);
  const { unitIds, kind, exerciseType, day, mode = 'today', count = 10, rng = Math.random } = options;
  if (!ENGLISH_EXERCISE_TYPES.includes(exerciseType) || !['word', 'phrase'].includes(kind) || !['today', 'unit', 'review', 'extra'].includes(mode) || ![6, 10, 14].includes(count)) throw new Error('无效英语练习选项');
  englishDayNumber(day);
  if (!Array.isArray(unitIds) || !unitIds.length || unitIds.some((id) => !pack.units.some((unit) => unit.unitId === id))) throw new Error('请选择有效已学单元');
  const get = (item) => progress.records[englishProgressKey(pack.packId, item.itemId, exerciseType)];
  let pool = pack.items.filter((item) => item.kind === kind && item.unitIds.some((id) => unitIds.includes(id)));
  const unavailableAudioItemIds = exerciseType === 'dictation' ? pool.filter((item) => item.audioId === null).map((item) => item.itemId) : [];
  if (exerciseType === 'dictation') pool = pool.filter((item) => item.audioId !== null);
  const shuffle = (items) => {
    const values = [...items];
    for (let i = values.length - 1; i > 0; i--) {
      const draw = rng();
      if (!Number.isFinite(draw) || draw < 0 || draw >= 1) throw new Error('无效随机源');
      const j = Math.floor(draw * (i + 1)); [values[i], values[j]] = [values[j], values[i]];
    }
    return values;
  };
  const byDue = (a, b) => get(a).dueDay.localeCompare(get(b).dueDay) || a.itemId.localeCompare(b.itemId);
  const due = pool.filter((item) => get(item) && get(item).dueDay <= day).sort(byDue);
  const fresh = shuffle(pool.filter((item) => !get(item)));
  let picked = [];
  if (mode === 'today') {
    const reviewCount = { 6: 4, 10: 7, 14: 10 }[count];
    const add = (items, limit) => {
      const chosen = new Set(picked.map((item) => item.itemId));
      picked.push(...items.filter((item) => !chosen.has(item.itemId)).slice(0, limit));
    };
    add(due, reviewCount); add(fresh, count - reviewCount);
    add(due, count - picked.length); add(fresh, count - picked.length);
    add(shuffle(pool.filter((item) => get(item) && !get(item).mastered)), count - picked.length);
    add(shuffle(pool.filter((item) => get(item) && get(item).mastered)), count - picked.length);
  } else if (mode === 'review') picked = pool.filter((item) => get(item) && get(item).wrong).sort(byDue).slice(0, count);
  else if (mode === 'extra') picked = shuffle(pool.filter((item) => get(item))).slice(0, count);
  else picked = shuffle(pool).slice(0, count);
  const items = JSON.parse(JSON.stringify(picked));
  return { packId: pack.packId, packVersion: pack.version, mode, kind, exerciseType, day, targetCount: count, count: items.length, shortage: items.length < count, unavailableAudioItemIds, items, learningIds: items.filter((item) => !get(item)).map((item) => item.itemId) };
}

module.exports = { planEnglishPractice };
