// Generated from app/js/english-summary.js by tools/build_miniprogram.mjs. Do not edit.
const { englishProgressKey } = require('./english-content.js');

// Aggregate learning evidence; a school-taught unit is not a mastery record.
function summarizeEnglishScope(pack, progress, { unitIds = pack.units.map((unit) => unit.unitId), kind, exerciseType = 'meaning', day } = {}) {
  const items = pack.items.filter((item) => (!kind || item.kind === kind) && item.unitIds.some((id) => unitIds.includes(id)));
  const records = items.map((item) => progress.records[englishProgressKey(pack.packId, item.itemId, exerciseType)]).filter(Boolean);
  return {
    total: items.length,
    practiced: records.length,
    mastered: records.filter((record) => record.mastered).length,
    wrong: records.filter((record) => record.wrong).length,
    needsReview: records.filter((record) => record.needsReview).length,
    due: records.filter((record) => record.dueDay && day && record.dueDay <= day).length,
    words: items.filter((item) => item.kind === 'word').length,
    phrases: items.filter((item) => item.kind === 'phrase').length,
  };
}

module.exports = { summarizeEnglishScope };
