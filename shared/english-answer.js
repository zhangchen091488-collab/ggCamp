// Generated from app/js/english-answer.js by tools/build_miniprogram.mjs. Do not edit.
// Whole-answer grading; no per-letter completion or semantic guessing.
function normalizeEnglishAnswer(value) {
  if (typeof value !== 'string') throw new Error('答案必须是文本');
  return value.normalize('NFC').replace(/[\u2018\u2019]/g, "'").trim().replace(/\s+/g, ' ').replace(/[.!?。！？]+$/, '').trim().toLowerCase();
}

function englishAnswerDiff(input, expected) {
  const a = Array.from(normalizeEnglishAnswer(input)); const b = Array.from(normalizeEnglishAnswer(expected));
  if (a.length > 200 || b.length > 200) throw new Error('答案超过长度限制');
  const table = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) table[i][0] = i;
  for (let j = 0; j <= b.length; j++) table[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) table[i][j] = Math.min(table[i - 1][j] + 1, table[i][j - 1] + 1, table[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  const edits = []; let i = a.length; let j = b.length;
  while (i || j) {
    if (i && j && table[i][j] === table[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)) {
      edits.push({ kind: a[i - 1] === b[j - 1] ? 'equal' : 'replace', input: a[--i], expected: b[--j] });
    } else if (i && table[i][j] === table[i - 1][j] + 1) edits.push({ kind: 'remove', input: a[--i], expected: '' });
    else edits.push({ kind: 'insert', input: '', expected: b[--j] });
  }
  return edits.reverse();
}

function gradeEnglishAnswer(item, input) {
  if (typeof input !== 'string' || input.length > 200) return { status: 'invalid', correct: false };
  if (!input.trim()) return { status: 'empty', correct: false };
  const normalized = normalizeEnglishAnswer(input);
  const answers = item.acceptedAnswers;
  if (!Array.isArray(answers) || !answers.length) throw new Error('缺少合法答案');
  const correct = answers.some((answer) => normalizeEnglishAnswer(answer) === normalized);
  return { status: correct ? 'correct' : 'wrong', correct, canonical: item.canonical, normalized, edits: correct ? [] : englishAnswerDiff(input, item.canonical) };
}

function createEnglishAttempt(item, questionId) {
  if (typeof questionId !== 'string' || !questionId) throw new Error('缺少题目标识');
  return { questionId, item: JSON.parse(JSON.stringify(item)), draft: '', submissions: 0, assisted: false, completed: false, firstIndependent: false, skipped: false };
}

function useEnglishHint(attempt, hint) {
  if (!['first-letter', 'next-letter', 'random-letter', 'meaning', 'answer', 'replay'].includes(hint)) throw new Error('未知提示');
  if (attempt.completed || hint === 'replay') return;
  attempt.assisted = true;
}

function submitEnglishAnswer(attempt, input) {
  if (attempt.completed) return { status: 'ignored', rewardUnits: 0 };
  const result = gradeEnglishAnswer(attempt.item, input);
  if (result.status === 'invalid' || result.status === 'empty') return { ...result, rewardUnits: 0 };
  attempt.draft = input; attempt.submissions++;
  if (!result.correct) return { ...result, rewardUnits: 0 };
  attempt.completed = true;
  attempt.firstIndependent = attempt.submissions === 1 && !attempt.assisted;
  return { ...result, firstIndependent: attempt.firstIndependent, rewardUnits: attempt.firstIndependent ? 1 : 0 };
}

function skipEnglishAttempt(attempt) {
  if (attempt.completed) return { status: 'ignored', rewardUnits: 0 };
  attempt.completed = true; attempt.assisted = true; attempt.skipped = true;
  return { status: 'skipped', canonical: attempt.item.canonical, firstIndependent: false, rewardUnits: 0 };
}

module.exports = { normalizeEnglishAnswer, englishAnswerDiff, gradeEnglishAnswer, createEnglishAttempt, useEnglishHint, submitEnglishAnswer, skipEnglishAttempt };
