const build = require('./android-build.js');
const { isNativeContainer } = require('./platform.js');
const { createInstaller } = require('./apk-installer.js');
const ORIGIN = 'https://zhangchen091488-collab.github.io/ggCamp';
const REPOSITORY = 'https://github.com/zhangchen091488-collab/ggCamp';
const KEY = 'ggcamp:apk-public-update:v1';
const DAY = 86400000;
function available(api) {
  try { return !!build.publicUpdates && isNativeContainer(api) && /android/i.test(api.getSystemInfoSync().platform || ''); }
  catch { return false; }
}
function preferences(api) {
  try { const value = api.getStorageSync(KEY); return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }
  catch { return {}; }
}
function save(api, changes) { api.setStorageSync(KEY, { ...preferences(api), ...changes }); }
function setBeta(api, enabled) { save(api, { beta: !!enabled, lastCheckAt: 0, deferredUntil: 0 }); }
function later(api, versionCode, now = Date.now()) { save(api, { deferredCode: versionCode, deferredUntil: now + DAY }); }
function candidate(feed, channel) {
  if (!feed || feed.schemaVersion !== 1 || feed.channel !== channel || !['stable', 'beta'].includes(channel)) throw new Error('更新信息不完整，请稍后重试');
  if (feed.latest === null) return null;
  const value = feed.latest;
  if (!value || value.packageName !== build.packageName || !Number.isSafeInteger(value.versionCode) || value.versionCode < 1 || !/^\d+\.\d+\.\d+$/.test(value.versionName || '') || typeof value.releaseNotes !== 'string' || value.releaseNotes.length > 4000 || !Number.isFinite(Date.parse(value.publishedAt)) || !Array.isArray(value.artifacts)) throw new Error('更新信息校验失败，停止更新');
  const tag = (value.releasePageUrl || '').match(/^https:\/\/github\.com\/zhangchen091488-collab\/ggCamp\/releases\/tag\/([A-Za-z0-9._-]+)$/);
  if (!tag || /^(untagged|.*validation)/i.test(tag[1])) throw new Error('更新来源不符，停止更新');
  const artifact = value.artifacts.find((item) => item && item.abi === build.abi);
  if (!artifact) throw new Error('新版暂不支持当前设备');
  const prefix = `${REPOSITORY}/releases/download/${tag[1]}/`;
  if (typeof artifact.url !== 'string' || !artifact.url.startsWith(prefix) || !/^ggcamp-[A-Za-z0-9._-]+\.apk$/.test(artifact.url.slice(prefix.length)) || !/^[a-f0-9]{64}$/.test(artifact.sha256 || '') || artifact.certificateSha256 !== build.certificateSha256 || !Number.isSafeInteger(artifact.size) || artifact.size <= 0 || artifact.size > 200 * 1024 * 1024 || !Number.isSafeInteger(artifact.minSdk) || artifact.minSdk < 24 || artifact.minSdk > build.minSdk) throw new Error('安装包信息不符，停止更新');
  if (value.versionCode <= build.versionCode) return null;
  return { ...value, ...artifact, channel };
}
function createUpdater(api, notify = () => {}) {
  const installer = createInstaller(api, notify);
  let epoch = 0; const requests = new Set(); let busy = null; let pending = null;
  function cancel() { pending = null; epoch++; installer.cancel(); requests.forEach((request) => request.abort()); requests.clear(); }
  function request(channel, token) {
    return new Promise((resolve, reject) => {
      let task; task = api.request({ url: `${ORIGIN}/updates/android/${channel}.json?t=${Date.now()}`, timeout: 15000, success: (res) => {
        requests.delete(task);
        try { if (token !== epoch) throw new Error('已取消检查'); if (res.statusCode !== 200) throw new Error('暂时无法检查更新，请稍后重试'); resolve(candidate(res.data, channel)); }
        catch (error) { reject(error); }
      }, fail: () => { requests.delete(task); reject(new Error(token !== epoch ? '已取消检查' : '无法连接更新服务，请检查网络后重试')); } });
      requests.add(task);
    });
  }
  async function check() {
    if (!available(api)) throw new Error('当前设备不支持 APK 更新');
    const host = api.getAppBaseInfo();
    if (host.appVersion && host.appVersion !== build.versionName) throw new Error('应用版本信息不一致，请重新打开应用');
    const token = epoch; const channels = preferences(api).beta ? ['stable', 'beta'] : ['stable'];
    const values = await Promise.all(channels.map((channel) => request(channel, token)));
    if (token !== epoch) throw new Error('已取消检查');
    const latest = values.filter(Boolean).sort((a, b) => b.versionCode - a.versionCode)[0] || null;
    save(api, { lastCheckAt: Date.now() }); return latest;
  }
  async function install(value) {
    if (!available(api)) throw new Error('当前设备不支持 APK 更新');
    const resource = candidate({ schemaVersion: 1, channel: value.channel, latest: { ...value, artifacts: [value] } }, value.channel);
    if (!resource) throw new Error('当前已是最新版本');
    const host = api.getAppBaseInfo();
    if (host.appVersion && host.appVersion !== build.versionName) throw new Error('应用版本信息不一致，停止更新');
    if (!api.miniapp || typeof api.miniapp.installApp !== 'function') throw new Error('当前版本不支持应用内安装，请从发布页下载');
    await installer.install(resource);
  }
  async function background(now = Date.now()) {
    if (!available(api)) return null;
    const prefs = preferences(api);
    if (!prefs.beta && pending && pending.channel === 'beta') pending = null;
    if (pending && prefs.deferredCode === pending.versionCode && prefs.deferredUntil > now) return null;
    if (pending && now - (prefs.lastCheckAt || 0) < DAY) return pending;
    if (now - (prefs.lastCheckAt || 0) < DAY) return null;
    if (!busy) busy = check().catch(() => { save(api, { lastCheckAt: now }); return null; }).finally(() => { busy = null; });
    const value = await busy;
    pending = value;
    const current = preferences(api);
    if (value && current.deferredCode === value.versionCode && current.deferredUntil > now) return null;
    return value;
  }
  return { check, install, cancel, background };
}
let automatic = null;
function onHomeShow(page, api) {
  if (!available(api)) return;
  page.updateVisible = true;
  if (!automatic) automatic = createUpdater(api);
  automatic.background().then((value) => {
    if (!value || !page.updateVisible || page.data.guideOpen) return;
    later(api, value.versionCode);
    api.showModal({ title: `发现新版本 ${value.versionName}`, content: `${value.releaseNotes || '优化了训练营体验'}\n安装包 ${(value.size / 1048576).toFixed(1)} MB`, confirmText: '查看更新', cancelText: '稍后', success: (result) => {
      if (result.confirm && page.updateVisible) api.navigateTo({ url: '/pages/app-update/app-update' });
    } });
  }).catch(() => {});
}
module.exports = { available, preferences, setBeta, later, candidate, createUpdater, onHomeShow, ORIGIN, REPOSITORY };
