const web = require('../shared/store.js');
const session = require('../shared/session.js');
const growth = require('../shared/growth.js');
const { SKILL } = require('../shared/skills.js');
const { defaultEquip, CATS, ITEM, isUnlocked, pickLook } = require('../shared/unlocks.js');
const englishPractice = require('./english-practice.js');
const KEY = 'dopa-drill:mini:v1';
function createStore(api) {
  let warning = '';
  let readFailed = false;
  const translate = (key) => key === 'dopa-drill:v1' ? KEY : key;
  const backend = {
    getItem(key) { try { const data = api.getStorageSync(translate(key)); return data ? JSON.stringify(data) : null; } catch { readFailed = true; warning = '无法读取本地记录，已暂停保存以保护原记录。请重新打开小程序后重试。'; return null; } },
    setItem(key, value) { if (readFailed) throw new Error('Storage read failed; preserve existing records'); api.setStorageSync(translate(key), JSON.parse(value)); },
    removeItem(key) { api.removeStorageSync(translate(key)); },
    get length() { return 1; }, key() { return 'dopa-drill:v1'; },
  };
  web.useStorage(backend);
  const state = web.load();
  if (state.demoBackup) { Object.assign(state, state.demoBackup); delete state.demoBackup; }
  const history = Array.isArray(state.history) ? state.history : [];
  state.history = history.filter((record) => record && typeof record === 'object' && !Array.isArray(record));
  if (state.history.length !== history.length) warning = '部分历史记录不完整，已保留其它进度。';
  delete state.settings.collectionDebug;
  state.settings.character = state.settings.character === 'boy' ? 'boy' : 'girl';
  state.settings.count = [6, 10, 14].includes(state.settings.count) ? state.settings.count : 10;
  // Migrate the first prototype without discarding earned progress or history.
  if (typeof state.settings.motion === 'boolean') state.settings.motion = state.settings.motion ? 100 : 0;
  if (state.settings.motion == null) state.settings.motion = 100;
  state.progress = state.progress || session.emptyProgress();
  if (!state.progress.skills || typeof state.progress.skills !== 'object' || Array.isArray(state.progress.skills)) state.progress.skills = {};
  state.progress.review = Array.isArray(state.progress.review) ? state.progress.review : [];
  for (const [id, record] of Object.entries(state.progress.skills)) {
    if (!SKILL[id] || !record || typeof record !== 'object') { delete state.progress.skills[id]; continue; }
    record.n = Number.isFinite(record.n) ? record.n : 0;
    record.hist = Array.isArray(record.hist) ? record.hist.filter((x) => x === 0 || x === 1) : [];
    record.recent = Array.isArray(record.recent) ? record.recent.filter((x) => typeof x === 'string') : [];
    for (const key of ['times', 'days', 'first']) if (!Array.isArray(record[key])) delete record[key];
  }
  if (!state.miniFeatures) {
    state.history.forEach((r) => { r.mode = r.mode || 'grade'; if (r.firstRate > 1) r.firstRate /= 100; });
    state.miniFeatures = 2;
  }
  state.stats = state.stats || growth.statsFromHistory(state.history);
  state.quests = state.quests || {}; state.trophies = state.trophies || {};
  state.equip = { ...defaultEquip(), ...state.equip };
  // Retire selections from the visual debug build; earned choices stay intact.
  for (const { key } of CATS) {
    const id = state.equip[key];
    if (id !== 'auto' && (!ITEM[id] || ITEM[id].cat !== key || !isUnlocked(ITEM[id], state.trophies.got))) state.equip[key] = 'auto';
  }
  for (const record of [state.session, state.pending, state.result]) {
    if (record && record.look) record.look = { ...record.look, ...pickLook(record.look, state.trophies.got, () => 0) };
  }
  const s = state.session;
  if (s) {
    const valid = Number.isInteger(s.index) && s.index >= 0 && s.index <= s.count && Array.isArray(s.problems) && s.problems.length && s.problems.every((p) => p && Object.prototype.hasOwnProperty.call(SKILL, p.skill) && Array.isArray(p.steps) && p.steps.length && Array.isArray(p.cells)) && s.values && Array.isArray(s.revealed) && Number.isInteger(s.step) && s.step >= 0 && ['elapsedMs', 'questionMs', 'ng', 'qNg', 'ok', 'firstTry'].every((key) => Number.isFinite(s[key]) && s[key] >= 0);
    if (!valid) { state.session = null; warning = '未完成练习记录不完整，已保留其它进度。'; }
    else { s.mode = s.mode || 'grade'; s.phase = s.phase || 'basic'; s.seed = s.seed || Number(String(s.id).split('-')[0]) || Date.now(); s.serial = s.serial || s.problems.length + 1; s.combo = s.combo || 0; s.comboPeak = s.comboPeak || 0; s.dopaL = s.dopaL || 0; s.sigs = s.sigs || []; s.wrongList = s.wrongList || []; s.sessionTimes = s.sessionTimes || {}; s.news = s.news || []; s.recorded = s.recorded || []; }
  }
  function save() {
    const ok = web.save(); warning = readFailed ? '本地记录读取失败，未能保存。已保护原记录，请重新打开小程序后重试。' : ok ? '' : '记录未能保存，请保留当前页面并稍后重试。'; return ok;
  }
  const store = { state, save, warning(message) { if (message && !readFailed) warning = message; return warning; }, web };
  if (state.englishDemo !== undefined) englishPractice.state(store);
  return store;
}
module.exports = { createStore, KEY };
