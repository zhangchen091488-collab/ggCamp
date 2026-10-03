// Generated from app/js/scoring.js by tools/build_miniprogram.mjs. Do not edit.
// Pure scoring and "dopa" curves (kept separate from the director for testing).

const BASIC_SCORE = 100;
const EXTRA_BASE = 10;

// Points for the k-th (0-based) extra problem grow gently: 10, 15, 20, ...
// A very fast player (20-25 extra problems in 90 s) ends in the 1000s.
const EXTRA_STEP = 5;
const extraPoints = (k) => EXTRA_BASE + EXTRA_STEP * k;
const extraTotal = (n) => EXTRA_BASE * n + EXTRA_STEP * (n * (n - 1)) / 2;

// Dopa is tracked as log10 and grows one answer cell at a time. The base
// curves below are what a player with no combo gets; combos multiply each
// step (see comboMult), so a steady combo lands back near the old targets.
// Without combo the basic set ends near 10^2.3 (about 200); a full combo
// doubles every step after 20 cells and ends near 1万.
const BASIC_DOPA_L = 2.3;
function basicDopaL(frac) {
  const f = Math.min(1, Math.max(0, frac));
  return BASIC_DOPA_L * f ** 1.15;
}
// Extra problems follow a saturating curve on top of the basic set.
const EXTRA_SPAN = 3.0; const EXTRA_TAU = 10;
const extraDopaL = (n) => BASIC_DOPA_L + EXTRA_SPAN * (1 - Math.exp(-n / EXTRA_TAU));
const extraProblemGain = (k) => extraDopaL(k + 1) - extraDopaL(k);
// Hard ceiling: about 12亿, whatever the combo.
const DOPA_MAX_L = 9.08;

// ---------------------------------------------------------------- combo
// One combo per correct answer cell, carried across problems. It does not
// change the score; it only makes dopa grow faster: the multiplier rises
// evenly from x1.0 and tops out at x2.0 at 20 combo.
const COMBO_DOPA = { max: 2, full: 20 };
const comboMult = (combo) => 1 + (COMBO_DOPA.max - 1) * Math.min(1, Math.max(0, combo) / COMBO_DOPA.full);
const comboMaxed = (combo) => combo >= COMBO_DOPA.full;

// Add one answer cell's worth of dopa. `base` is the no-combo step (log10).
function addDopa(L, base, combo) {
  return Math.min(DOPA_MAX_L, L + Math.max(0.003, base) * comboMult(combo));
}

// Time allowed to enter the next answer cell before the combo breaks
// (provisional). Harder skills (higher grade) get longer; the first cell of
// a problem adds time to read it.
const COMBO_TIME = { base: 3000, perGrade: 600, read: 2500 };
function comboWindowMs(grade = 3, first = false) {
  const g = Math.min(6, Math.max(1, grade || 3));
  return COMBO_TIME.base + COMBO_TIME.perGrade * (g - 1) + (first ? COMBO_TIME.read : 0);
}
// Milestones worth a bigger show: 10, 20, 30, 50, 75, 100, then every 50.
const comboMilestone = (c) => [10, 20, 30, 50, 75].includes(c) || (c >= 100 && c % 50 === 0);

const UNITS = [[68, '无量大数'], [64, '不可思议'], [60, '那由他'], [56, '阿僧祇'], [52, '恒河沙'], [48, '极'], [44, '载'], [40, '正'], [36, '涧'], [32, '沟'], [28, '穰'], [24, '秭'], [20, '垓'], [16, '京'], [12, '兆'], [8, '亿'], [4, '万']];
// Milestones below 万 are celebrated but not used as display units.
const MILESTONES = [[3, '千'], [2, '百']];

function fmtDopa(L) {
  if (!Number.isFinite(L) || L >= 72) return '∞';
  if (L < 4) return Math.round(10 ** L).toLocaleString('zh-CN');
  const u = UNITS.find(([e]) => L >= e - 1e-9);
  const m = 10 ** (L - u[0]);
  return (m < 10 ? m.toFixed(1) : String(Math.floor(m))) + u[1];
}

function unitOf(L) {
  if (L >= 72) return '∞';
  // Between 万 and 亿, each extra digit is its own milestone (10万, 100万, 1000万).
  if (L >= 4 && L < 8) return ['万', '十万', '百万', '千万'][Math.floor(L + 1e-9) - 4];
  const u = UNITS.find(([e]) => L >= e - 1e-9) || MILESTONES.find(([e]) => L >= e - 1e-9);
  return u ? u[1] : '';
}

const LABELS = { '∞': '∞', 百: '100', 千: '1000', 十万: '10万', 百万: '100万', 千万: '1000万' };
const unitLabel = (u) => LABELS[u] || `1${u}`;

module.exports = { BASIC_SCORE, EXTRA_BASE, EXTRA_STEP, extraPoints, extraTotal, BASIC_DOPA_L, basicDopaL, extraDopaL, extraProblemGain, DOPA_MAX_L, COMBO_DOPA, comboMult, comboMaxed, addDopa, COMBO_TIME, comboWindowMs, comboMilestone, fmtDopa, unitOf, unitLabel };
