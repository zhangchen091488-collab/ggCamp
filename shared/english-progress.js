// Generated from app/js/english-progress.js by tools/build_miniprogram.mjs. Do not edit.
const { englishProgressKey } = require('./english-content.js');
const ENGLISH_INTERVALS = [1, 3, 7, 14, 30];
const DAY = 86400000;

function englishDayNumber(day) {
  if (typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error('需要 YYYY-MM-DD 学习日期');
  const stamp = Date.parse(`${day}T00:00:00Z`);
  if (!Number.isFinite(stamp) || new Date(stamp).toISOString().slice(0, 10) !== day) throw new Error('无效学习日期');
  return stamp / DAY;
}
function englishDayAfter(day, days) { return new Date((englishDayNumber(day) + days) * DAY).toISOString().slice(0, 10); }
function emptyEnglishProgress() { return { version: 1, records: {}, processed: {} }; }

function recordEnglishResult(progress, result) {
  const { packId, itemId, exerciseType, eventId, day, firstIndependent } = result;
  const key = englishProgressKey(packId, itemId, exerciseType);
  englishDayNumber(day);
  if (typeof eventId !== 'string' || !eventId || eventId.length > 200 || typeof firstIndependent !== 'boolean') throw new Error('无效练习结果');
  const eventKey = `${key}:${eventId}`;
  if (Object.prototype.hasOwnProperty.call(progress.processed, eventKey)) return { duplicate: true, record: progress.records[key] };
  const old = progress.records[key];
  if (old && old.lastDay > day) throw new Error('学习日期早于已记录日期');
  const record = old || { packId, itemId, exerciseType, attempts: 0, independent: 0, successfulDays: [], stage: -1, mastered: false, needsReview: false, wrong: false, lastDay: null, blockedDay: null, dueDay: null };
  record.attempts++; record.lastDay = day;
  if (!firstIndependent) {
    record.blockedDay = day;
    // If a later practice fails today, today's earlier success cannot count as an independent day.
    record.successfulDays = record.successfulDays.filter((value) => value !== day);
    record.stage = -1; record.dueDay = englishDayAfter(day, 1);
    record.needsReview = true; record.wrong = true;
  } else {
    record.independent++;
    if (record.blockedDay !== day && !record.successfulDays.includes(day)) {
      record.successfulDays.push(day);
      record.stage = Math.min(record.stage + 1, ENGLISH_INTERVALS.length - 1);
      record.dueDay = englishDayAfter(day, ENGLISH_INTERVALS[record.stage]);
      record.needsReview = false; record.wrong = false;
      if (record.successfulDays.length >= 3) record.mastered = true;
    }
  }
  progress.records[key] = record; progress.processed[eventKey] = true;
  return { duplicate: false, record };
}

module.exports = { ENGLISH_INTERVALS, englishDayNumber, englishDayAfter, emptyEnglishProgress, recordEnglishResult };
