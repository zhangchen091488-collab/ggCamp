const rules = require('./rules.js');
const { audioSha256 } = require('../shared/english-audio.js');
const partners = require('../lib/partners.js');
const BASE_URL = 'https://zhangchen091488-collab.github.io/ggCamp/characters/v1/';
const hasKey = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const clone = value => JSON.parse(JSON.stringify(value));
function createPartners(api, store, notify = () => {}) {
  const fs = api.getFileSystemManager && api.getFileSystemManager();
  const root = fs && api.env && api.env.USER_DATA_PATH && `${api.env.USER_DATA_PATH}/${partners.DIRECTORY}`;
  const supported = !!(root && api.downloadFile && fs.readFileSync && fs.writeFileSync && fs.statSync && fs.readdirSync);
  let state = { version: 1, entries: {}, codeHashes: {}, index: null }; let blocked = ''; let active = null; let task = null; let epoch = 0;
  try {
    const saved = api.getStorageSync(partners.KEY);
    if (saved) {
      if (saved.version !== 1 || !rules.isRecord(saved.entries) || !rules.isRecord(saved.codeHashes || saved.codes)) throw Error();
      const codeHashes = saved.codeHashes || Object.fromEntries(Object.entries(saved.codes).map(([code, id]) => [rules.codeDigest(code), id]));
      for (const [code, id] of Object.entries(codeHashes)) if (!/^[a-f0-9]{64}$/.test(code) || !rules.characterId(id) || !hasKey(saved.entries, id)) throw Error();
      for (const [id, entry] of Object.entries(saved.entries)) {
        if (!rules.characterId(id) || !rules.isRecord(entry) || !rules.isRecord(entry.versions)) throw Error();
        if (!Number.isFinite(entry.claimedAt) || entry.claimedAt < 0 || entry.installed !== null && (!Number.isSafeInteger(entry.installed) || entry.installed < 1)) throw Error();
        rules.assertManifest(entry.manifest, { characterId: id, revision: entry.manifest.revision });
        for (const [revision, m] of Object.entries(entry.versions)) rules.assertManifest(m, { characterId: id, revision: Number(revision) });
        if (entry.installed && !entry.versions[entry.installed]) throw Error();
      }
      const index = saved.index && saved.index.schemaVersion === 2 ? rules.assertIndex(saved.index) : null;
      state = clone({ version: 1, entries: saved.entries, codeHashes, index });
      if (saved.codes || saved.index && saved.index.schemaVersion !== 2) api.setStorageSync(partners.KEY, state);
    }
  } catch { blocked = '无法读取伙伴记录，已暂停保存，请重新打开游戏后重试'; }
  function ready() {
    if (blocked) throw Error(blocked);
    if (!supported) throw Error('当前宿主不支持伙伴下载，请在微信中重试');
    try { fs.mkdirSync(root, true); } catch { /* An existing directory is expected. Writes still report failures. */ }
  }
  function commit(next) {
    if (blocked) throw Error(blocked);
    try { api.setStorageSync(partners.KEY, next); } catch { throw Error('伙伴记录未能保存，请稍后重试'); }
    state = next;
  }
  function remove(path) { try { fs.unlinkSync(path); } catch {} }
  function path(file) { return `${root}/${file.sha256}.png`; }
  function verified(file) {
    try { const bytes = fs.readFileSync(path(file)); return bytes.byteLength === file.bytes && audioSha256(bytes) === file.sha256 && rules.assertPng(bytes, file); } catch { return false; }
  }
  function checkActive(token) { if (token !== epoch) throw Error('下载已暂停，可稍后继续'); }
  async function download(relative, maxBytes, token = epoch, progress = () => {}) {
    if (!rules.safePath(relative)) throw Error('资源路径不正确');
    let temporary;
    try {
      const result = await new Promise((resolve, reject) => {
        const handle = api.downloadFile({ url: BASE_URL + relative + (relative === 'index.json' ? `?t=${Date.now()}` : ''), timeout: 30000,
          success: resolve, fail: error => reject(Error(/domain|合法域名/i.test(error && error.errMsg || '') ? '请配置伙伴下载合法域名' : '伙伴下载中断，请检查网络后重试')) });
        task = handle;
        if (handle && handle.onProgressUpdate) handle.onProgressUpdate(p => {
          if (token !== epoch) return;
          if (p.totalBytesWritten > maxBytes) { if (handle.abort) handle.abort(); return; }
          progress(p.totalBytesWritten || 0);
        });
      });
      task = null; temporary = result.tempFilePath; checkActive(token);
      if (result.statusCode !== 200) throw Error(relative === 'index.json' && result.statusCode === 404 ? '伙伴目录尚未发布，已下载伙伴仍可使用' : `伙伴资源暂不可用（HTTP ${result.statusCode}）`);
      const stat = fs.statSync(temporary); if ((stat.stats || stat).size > maxBytes) throw Error('伙伴资源超过大小限制');
      const bytes = fs.readFileSync(temporary);
      if (bytes.byteLength > maxBytes) throw Error('伙伴资源超过大小限制');
      return { bytes };
    } catch (error) { checkActive(token); throw error; }
    finally { if (temporary) remove(temporary); }
  }
  async function json(relative, limit, expected) {
    const result = await download(relative, limit);
    if (expected && (result.bytes.byteLength !== expected.bytes || audioSha256(result.bytes) !== expected.sha256)) throw Error('伙伴描述校验失败');
    // Decode UTF-8 with the host filesystem; TextDecoder is not available on every host.
    const temp = `${root}/metadata.json`;
    try { fs.writeFileSync(temp, result.bytes); return JSON.parse(fs.readFileSync(temp, 'utf8')); }
    catch { throw Error('伙伴目录或描述无法读取'); } finally { remove(temp); }
  }
  async function refresh() {
    ready(); if (active) throw Error('请先完成或取消当前下载');
    const index = rules.assertIndex(await json('index.json', 256 * 1024));
    if (state.index && index.revision < state.index.revision) throw Error('伙伴目录尚未更新，请稍后重试');
    for (const [code, id] of Object.entries(state.codeHashes)) if (hasKey(index.codeHashes, code) && index.codeHashes[code] !== id) throw Error('兑换码对应的伙伴发生冲突');
    commit({ ...state, index }); return index;
  }
  function immutable(m) {
    const e = state.entries[m.characterId];
    const known = e && (e.versions[m.revision] || e.manifest.revision === m.revision && e.manifest);
    if (known && JSON.stringify(known) !== JSON.stringify(m)) throw Error('已发布版本被修改，请联系发布者增加版本号');
    return m;
  }
  async function manifest(id, entry) {
    return immutable(rules.assertManifest(await json(entry.path, 64 * 1024, entry), { characterId: id, revision: entry.revision }));
  }
  async function lookup(value) {
    ready(); const code = rules.normalizeCode(value); const digest = rules.codeDigest(code);
    let index;
    try { index = await refresh(); } catch (error) {
      const e = state.entries[state.codeHashes[digest]];
      if (e) return { manifest: e.manifest, code, offline: true };
      throw error;
    }
    const id = hasKey(index.codeHashes, digest) ? index.codeHashes[digest] : state.codeHashes[digest]; const entry = index.characters[id];
    const own = state.entries[id];
    if (!entry) { if (own) return { manifest: own.manifest, code }; throw Error('没有找到这个兑换码，请检查后重试'); }
    if (!entry.available && !own) throw Error('这位伙伴暂时无法领取');
    if (own && (!entry.available || entry.revision < own.manifest.revision)) return { manifest: own.manifest, code };
    return { manifest: await manifest(id, entry), code };
  }
  async function update(id) {
    const index = await refresh(); const entry = index.characters[id]; const own = state.entries[id];
    if (!own) throw Error('请先兑换这位伙伴');
    return { manifest: entry && entry.available && entry.revision > own.manifest.revision ? await manifest(id, entry) : own.manifest };
  }
  function claim(m, code) {
    rules.assertManifest(m); immutable(m);
    const next = clone(state); const old = next.entries[m.characterId];
    if (!old) next.entries[m.characterId] = { claimedAt: Date.now(), manifest: m, versions: {}, installed: null };
    else if (m.revision >= old.manifest.revision) old.manifest = m;
    if (code) next.codeHashes[rules.codeDigest(code)] = m.characterId;
    commit(next);
  }
  function pinned() { return partners.references(store.state); }
  function keepFiles(next, candidate = null) {
    const keep = new Set(); const refs = pinned();
    for (const [id, e] of Object.entries(next.entries)) {
      keep.add(e.manifest.files[e.manifest.thumbnail].sha256);
      for (const [revision, m] of Object.entries(e.versions)) {
        if (Number(revision) === e.installed || refs.some(r => r.character === id && (r.characterRevision === Number(revision) || !r.characterRevision && Number(revision) === e.installed))) Object.values(m.files).forEach(f => keep.add(f.sha256));
      }
    }
    if (candidate) Object.values(candidate.files).forEach(f => keep.add(f.sha256));
    return keep;
  }
  function used() {
    try { return fs.readdirSync(root).filter(n => /^[a-f0-9]{64}\.png$/.test(n)).reduce((n, f) => { const s = fs.statSync(`${root}/${f}`); return n + (s.stats || s).size; }, 0); } catch { return 0; }
  }
  function clean(candidate) {
    const keep = keepFiles(state, candidate);
    for (const n of fs.readdirSync(root)) if (/^[a-f0-9]{64}\.png$/.test(n) && !keep.has(n.slice(0, -4))) remove(`${root}/${n}`);
    const next = clone(state);
    for (const [id, e] of Object.entries(next.entries)) for (const revision of Object.keys(e.versions)) {
      if (Number(revision) !== e.installed && !pinned().some(r => r.character === id && r.characterRevision === Number(revision))) delete e.versions[revision];
    }
    commit(next);
  }
  function install(m, code) {
    if (active) return active.id === m.characterId && active.revision === m.revision ? active.promise : Promise.reject(Error('请先完成或取消当前下载'));
    const promise = runInstall(m, code);
    active = { id: m.characterId, revision: m.revision, promise };
    promise.finally(() => { if (active && active.promise === promise) active = null; }).catch(() => {});
    return promise;
  }
  async function runInstall(m, code) {
    ready(); m = clone(m); claim(m, code); const token = epoch; clean(m);
    const files = Object.values(m.files); const missing = files.filter(f => !verified(f));
    if (used() + missing.reduce((n, f) => n + f.bytes, 0) > rules.STORAGE_LIMIT) throw Error('角色空间不足，请先删除其他伙伴的下载资源');
    let done = files.filter(f => verified(f)).reduce((n, f) => n + f.bytes, 0);
    notify({ id: m.characterId, progress: Math.floor(done / m.totalBytes * 100) });
    for (const file of files) {
      checkActive(token); if (verified(file)) continue;
      const result = await download(`packs/${m.characterId}/${m.revision}/${file.path}`, file.bytes, token, n => notify({ id: m.characterId, progress: Math.min(99, Math.floor((done + Math.min(n, file.bytes)) / m.totalBytes * 100)) }));
      checkActive(token);
      if (result.bytes.byteLength !== file.bytes || audioSha256(result.bytes) !== file.sha256) throw Error('角色图片校验失败，请重新下载');
      rules.assertPng(result.bytes, file);
      try { fs.writeFileSync(path(file), result.bytes); } catch { throw Error('角色文件无法保存，请检查剩余空间后重试'); }
      if (!verified(file)) throw Error('角色文件保存不完整，请重试');
      done += file.bytes;
    }
    checkActive(token);
    const next = clone(state); const e = next.entries[m.characterId]; e.versions[m.revision] = m; e.installed = Math.max(e.installed || 0, m.revision);
    commit(next); partners.repaired(m.characterId); notify({ id: m.characterId, progress: 100 });
    return m;
  }
  function cancel() { epoch++; if (task && task.abort) task.abort(); task = null; }
  function removeResources(id) {
    ready(); if (active) throw Error('请先完成或取消当前下载');
    if (partners.NAMES[id]) throw Error('内置伙伴不能删除');
    if (store.state.settings.character === id) throw Error('请先切换到瓜瓜，再删除下载资源');
    if (pinned().some(r => r.character === id)) throw Error('未完成练习或结果仍在使用这位伙伴，请先完成练习并查看结果');
    const next = clone(state); if (!next.entries[id]) return;
    next.entries[id].installed = null; next.entries[id].versions = {}; commit(next); clean();
  }
  function rows() {
    return Object.entries(state.entries).sort((a, b) => a[1].claimedAt - b[1].claimedAt).map(([id, e]) => {
      const m = e.versions[e.installed]; const valid = !!m && Object.values(m.files).every(verified);
      const latest = state.index && state.index.characters[id];
      return { id, name: e.manifest.name, manifest: e.manifest, installed: e.installed, ready: valid, revision: e.installed || 0, update: !!(latest && latest.available && latest.revision > (e.installed || 0)), thumbnail: verified(e.manifest.files[e.manifest.thumbnail]) ? path(e.manifest.files[e.manifest.thumbnail]) : '', status: valid ? latest && latest.available && latest.revision > e.installed ? '可更新' : '已下载' : e.installed ? '需要修复' : '已领取未下载' };
    });
  }
  async function preview(m, fileId = m.thumbnail) {
    ready(); rules.assertManifest(m); const f = m.files[fileId];
    if (!f) throw Error('没有找到伙伴预览');
    if (!verified(f)) {
      if (used() + f.bytes > rules.STORAGE_LIMIT) throw Error('角色空间不足，请先清理下载资源');
      const result = await download(`packs/${m.characterId}/${m.revision}/${f.path}`, f.bytes);
      if (result.bytes.byteLength !== f.bytes || audioSha256(result.bytes) !== f.sha256) throw Error('伙伴预览校验失败');
      rules.assertPng(result.bytes, f); fs.writeFileSync(path(f), result.bytes);
    }
    return path(f);
  }
  function select(id) {
    if (!partners.NAMES[id] && !rows().some(r => r.id === id && r.ready)) throw Error('请先完整下载这位伙伴');
    const old = store.state.settings.character; store.state.settings.character = id;
    if (!store.save()) { store.state.settings.character = old; throw Error('伙伴选择未能保存，请稍后重试'); }
    partners.repaired(id);
  }
  return { supported, blocked, refresh, lookup, update, preview, install, cancel, removeResources, rows, used, select };
}
module.exports = { BASE_URL, createPartners };
