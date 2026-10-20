// Small, offline-only reader in the main package. Network/install code lives in partners/.
const KEY = 'dopa-drill:partners:v1';
const DIRECTORY = 'partners-v1';
const NAMES = { girl: '瓜瓜', boy: '年年' };
let context = null;
const validId = id => typeof id === 'string' && (/^(girl|boy)$/.test(id) || /^partner-[a-z0-9][a-z0-9-]{0,47}$/.test(id));
function attach(api, store) { context = { api, store, failed: new Set() }; }
function data() {
  if (!context) return { version: 1, entries: {} };
  try {
    const value = context.api.getStorageSync(KEY);
    if (!value) return { version: 1, entries: {} };
    if (value.version !== 1 || !value.entries || typeof value.entries !== 'object' || Array.isArray(value.entries)) throw Error();
    return value;
  } catch { context.store.warning('无法读取伙伴记录，已暂停角色管理，请重新打开游戏。'); return { version: 1, entries: {} }; }
}
function filePath(file) {
  const api = context && context.api;
  return api && api.env && api.env.USER_DATA_PATH && file && /^[a-f0-9]{64}$/.test(file.sha256) ? `${api.env.USER_DATA_PATH}/${DIRECTORY}/${file.sha256}.png` : '';
}
function exists(file) {
  try { const fs = context.api.getFileSystemManager(); const s = fs.statSync(filePath(file)); return (s.stats || s).size === file.bytes; } catch { return false; }
}
function installed(id, revision) {
  const entry = data().entries[id];
  return entry && entry.versions && entry.versions[revision || entry.installed] || null;
}
function name(id) { const entry = data().entries[id]; return NAMES[id] || entry && entry.manifest && entry.manifest.name || '伙伴'; }
function snapshot(id) {
  const manifest = installed(id);
  return { character: validId(id) ? id : 'girl', ...(manifest ? { characterRevision: manifest.revision } : {}) };
}
function builtin(id, color, face, costume) {
  const character = id === 'boy' ? 'boy' : 'girl';
  return { characterName: NAMES[character], src: `/assets/guagua/${character}-${color}-${face}.png`, wear: costume === 'none' ? '' : `/assets/guagua/wear-${costume}.png`, back: ['cape', 'cat'].includes(costume) ? `/assets/guagua/back-${costume}.png` : '', wearStyle: '' };
}
function layerStyle(t, width = 256, height = 256) {
  if (!t) return '';
  const side = Math.min(width, height);
  return `transform:translate(${t.x * side / 256}px,${t.y * side / 256}px) rotate(${t.rotate || 0}deg) scale(${t.scaleX || t.scale || 1},${t.scaleY || t.scale || 1});transform-origin:50% 50%;`;
}
function actionChoices(id, revision, face) {
  const m = installed(id, revision);
  const actions = m && m.actions && m.actions[face];
  return [face, ...(Array.isArray(actions) ? actions.map(a => a.id) : [])];
}
function resolve(id, revision, color, face, costume, actionId = face) {
  if (id === 'girl' || id === 'boy' || !id) return builtin(id, color, face, costume);
  const m = installed(id, revision); const key = `${id}:${revision || m && m.revision}`;
  try {
    const action = m.actions && (m.actions[face] || []).find(a => a.id === actionId);
    const frames = m.frames[color] || m.frames.original; const file = m.files[action ? action.frame : frames[face]];
    if (context.failed.has(key) || !exists(file)) throw Error();
    const wear = m.capabilities.costumes.includes(costume) ? costume : 'none';
    const fitted = action ? action.wearTransforms && action.wearTransforms[wear] : m.capabilities.wearTransforms && m.capabilities.wearTransforms[wear] && m.capabilities.wearTransforms[wear][face];
    const front = fitted ? fitted.front : m.capabilities.wearTransform;
    const back = fitted ? fitted.back : m.capabilities.wearTransform;
    const clothingId = action ? action.clothes && action.clothes[color] : m.clothes && m.clothes[color] && m.clothes[color][face];
    const clothing = clothingId && m.files[clothingId];
    if (clothing && !exists(clothing)) throw Error();
    const layers = builtin('girl', color, face, wear);
    if (fitted && ['cat', 'wizard', 'crown'].includes(wear)) layers.wear = `/assets/guagua/wear-${wear === 'cat' ? 'cat-head' : wear + '-full'}.png`;
    return { ...layers, characterName: m.name, actionId: action ? action.id : face, actionName: action ? action.name : { open: '自然站立', happy: '开心欢呼', tight: '托腮思考' }[face], src: filePath(file), clothes: clothing ? filePath(clothing) : '', wearTransform: front, backTransform: back, wearStyle: layerStyle(front), backStyle: layerStyle(back) };
  } catch {
    if (context) context.store.warning('伙伴资源需要重新下载，暂由瓜瓜陪你练习。');
    return { ...builtin('girl', color, face, 'none'), needsRepair: true };
  }
}
function markBroken(id, revision) {
  if (context && !NAMES[id]) { const m = installed(id, revision); context.failed.add(`${id}:${revision || m && m.revision}`); }
}
function repaired(id) { if (context) for (const key of context.failed) if (key.startsWith(`${id}:`)) context.failed.delete(key); }
function references(state) {
  const english = state.englishDemo || {};
  const backup = state.demoBackup || {};
  const unseen = result => result && !result.partnerViewed ? result : null;
  return [state.session, !state.result || !state.result.partnerViewed ? state.pending : null, unseen(state.result), english.session, unseen(english.result), backup.session, !backup.result || !backup.result.partnerViewed ? backup.pending : null, unseen(backup.result)].map(r => r && r.look).filter(Boolean);
}
function reset(api) {
  const fs = api.getFileSystemManager && api.getFileSystemManager();
  const root = api.env && `${api.env.USER_DATA_PATH}/${DIRECTORY}`;
  if (fs && root) {
    try { fs.accessSync(root); } catch { api.removeStorageSync(KEY); return; }
    fs.rmdirSync(root, true);
  }
  api.removeStorageSync(KEY);
  if (context) context.failed.clear();
}
module.exports = { KEY, DIRECTORY, NAMES, validId, attach, data, layerStyle, filePath, exists, installed, name, snapshot, actionChoices, resolve, markBroken, repaired, references, reset };
