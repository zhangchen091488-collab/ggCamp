// Generated from app/js/locale.js by tools/build_miniprogram.mjs. Do not edit.
// Older saves contain complete Japanese problem snapshots. Translate their
// display fields when replaying them without changing digits, IDs or progress.
// Keep translation keys as string values: WeChat's minifier can strip quotes
// from Japanese object keys containing the non-identifier middle dot (・).
const LEGACY_WORDS = new Map([
  ['小数のたしざん', '小数加法'],
  ['小数のひきざん', '小数减法'],
  ['小数のかけざん', '小数乘法'],
  ['小数のわりざん', '小数除法'],
  ['分数のたしひき', '分数加减法'],
  ['分数のかけざん', '分数乘法'],
  ['分数のわりざん', '分数除法'],
  ['分数と整数', '分数与整数'],
  ['小数と分数', '小数与分数'],
  ['あまりのあるわりざん', '有余数的除法'],
  ['いくつといくつ', '数的分解'],
  ['けいさんのきまり', '运算顺序'],
  ['xをもとめる', '求未知数 x'],
  ['最大公約数', '最大公因数'],
  ['約分', '约分'],
  ['がい数', '近似数'],
  ['たしざん', '加法'],
  ['ひきざん', '减法'],
  ['かけざん', '乘法'],
  ['わりざん', '除法'],
  ['ぶんすう', '分数'],
  ['3つのかず', '三个数的运算'],
  ['整数の部分', '整数部分'],
  ['小数第一位', '十分位'],
  ['小数第二位', '百分位'],
  ['小数第三位', '千分位'],
  ['十万の位', '十万位'],
  ['一の位', '个位'],
  ['十の位', '十位'],
  ['百の位', '百位'],
  ['千の位', '千位'],
  ['万の位', '万位'],
  ['ひいた のこり', '减法的差'],
  ['くりあがりの ', '进位的 '],
  ['たす（', '相加（'],
  ['こたえ', '答案'],
  ['あまり', '余'],
  ['まず ', '先算 '],
  ['先に ', '先算 '],
  ['どちらも わりきれる 数', '找能同时整除这两个数的数'],
  ['分母どうし・分子どうしをかける', '分子相乘，分母相乘'],
]);
const legacyPattern = new RegExp([...LEGACY_WORDS.keys()].sort((a, b) => b.length - a.length).join('|'), 'g');
const DISPLAY_KEYS = new Set(['title', 'text', 'answer', 'answerText', 'label', 'hint', 'help']);

function legacyText(value, compose) {
  if (value === 'は') return '＝';
  if (value === 'と') return compose ? '＋' : '和';
  if (value === 'の') return '的';
  if (value === 'を') return '取';
  if (value === 'ひ') return '比';
  return value.replace(legacyPattern, (word) => LEGACY_WORDS.get(word))
    .replace(/(\d+)と(?=\d+\/\d+)/g, '$1又')
    .replace(/(\d+)は(\d+)と/g, '$1＝$2＋？')
    .replace(/(\d+)に いくつで (\d+)/g, '$1 加几等于 $2？')
    .replace(/(\d+)に (\d+)で 10/g, '$1 加 $2 凑成 10')
    .replace(/(\d+)の中に(\d+)はいくつ/g, '$1 里面有几个 $2？')
    .replace(/(\d+)を (\d+)つに わける/g, '把 $1 平均分成 $2 份')
    .replace(/(\d+)のだん /g, '$1 的倍数：')
    .replace(/(\d+)をかける/g, '乘 $1')
    .replace(/ の 10こぶん/g, '，结果乘 10')
    .replace(/ を 考える/g, '，先按整数计算')
    .replace(/ と 同じ/g, ' 的结果相同')
    .replace(/(\d+)のばいすう/g, '从 $1 的倍数中找')
    .replace(/(\d+)を([十百千])位までの近似数に/g, '$1 四舍五入到$2位')
    .replace(/([十百千])位まで/g, '近似到$1位')
    .replace(/([个十百])位を 四捨五入/g, (_, place) => `根据${place}位四舍五入`)
    .replace(/(\d+)ばい/g, '扩大 $1 倍')
    .replace(/(\d+)で わる/g, '分子和分母都除以 $1')
    .replace(/分母は (\d+) のまま/g, '分母 $1 保持不变')
    .replace(/通分すると 分母は (\d+)/g, '通分后分母为 $1')
    .replace(/分([子母])に (\d+) をかける/g, '分$1乘 $2')
    .replace(/(\d+\/\d+) を ひっくりかえして かける/g, '乘 $1 的倒数')
    .replace(/の/g, '的').replace(/と/g, '和');
}

function localizeSavedProblem(problem) {
  if (!problem || typeof problem !== 'object') return problem;
  const copy = typeof structuredClone === 'function' ? structuredClone(problem) : JSON.parse(JSON.stringify(problem));
  const compose = problem.title === 'いくつといくつ';
  function visit(value) {
    if (!value || typeof value !== 'object') return;
    for (const [key, item] of Object.entries(value)) {
      if (typeof item === 'string' && DISPLAY_KEYS.has(key)) value[key] = legacyText(item, compose);
      else visit(item);
    }
  }
  visit(copy);
  if (typeof copy.text === 'string' && copy.text.includes('？')) copy.answerText = copy.text.replace('？', copy.answer);
  return copy;
}

function localizeSavedState(state) {
  const progress = state.progress;
  if (!progress || typeof progress !== 'object') return state;
  for (const record of Object.values(progress.skills || {})) {
    if (!record || typeof record !== 'object') continue;
    if (Array.isArray(record.recent)) record.recent = record.recent.map((sig) => {
      if (typeof sig !== 'string') return sig;
      return sig.split('|').map((part) => legacyText(part, false)).join('|');
    });
    if (Array.isArray(record.first)) for (const entry of record.first) {
      if (entry && entry.p) entry.p = localizeSavedProblem(entry.p);
    }
  }
  if (Array.isArray(progress.review)) for (const entry of progress.review) {
    if (!entry || !entry.problem) continue;
    entry.problem = localizeSavedProblem(entry.problem);
    // Review removal compares this signature with the replayed problem.
    entry.sig = `${entry.problem.title}|${entry.problem.text}`;
  }
  return state;
}

module.exports = { localizeSavedProblem, localizeSavedState };
