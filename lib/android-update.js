const build = require('./android-build.js');
const { isNativeContainer } = require('./platform.js');
const { hashFile, createHash } = require('./apk-sha256.js');
const ORIGIN = 'http://127.0.0.1:18765';
const SNAPSHOT = 'ggcamp:apk-update-validation:v1';
function available(api) {
  try {
    const info = api.getSystemInfoSync();
    return build.validation && isNativeContainer(api) && /android/i.test(info.platform || info.system || '');
  } catch { return false; }
}
function identity(api) {
  const info = api.getAppBaseInfo();
  const appVersion = String(info.appVersion || '');
  const versionSource = appVersion ? 'host' : (available(api) ? 'embedded-validation' : 'unavailable');
  return { ...build, appVersion, versionSource, installAvailable: !!(api.miniapp && typeof api.miniapp.installApp === 'function') };
}
function candidate(value) {
  if (!value || value.schemaVersion !== 1 || value.channel !== 'validation' || value.packageName !== build.packageName || !Number.isSafeInteger(value.versionCode) || value.versionCode <= build.versionCode || typeof value.versionName !== 'string' || value.url !== `${ORIGIN}/target.apk` || !/^[a-f0-9]{64}$/.test(value.sha256 || '') || value.certificateSha256 !== build.certificateSha256 || !Number.isSafeInteger(value.size) || value.size <= 0 || value.size > 200 * 1024 * 1024) throw new Error('验证清单无效或没有更高版本');
  return value;
}
function fingerprint(state) {
  const text = unescape(encodeURIComponent(JSON.stringify(state)));
  const hash = createHash(); hash.add(Uint8Array.from(text, (c) => c.charCodeAt(0))); return hash.digest();
}
function snapshot(api, state) {
  api.setStorageSync(SNAPSHOT, { versionCode: build.versionCode, hash: fingerprint(state) });
}
function compare(api, state) {
  const before = api.getStorageSync(SNAPSHOT);
  if (!before || !before.hash) return '尚未记录升级前存档';
  const same = before.hash === fingerprint(state);
  if (build.versionCode <= before.versionCode) return same ? '存档已记录，等待覆盖升级' : '存档已变化，请重新记录后再升级';
  return same ? '升级前后完整学习存档一致' : '升级前后存档存在差异，需检查';
}
function createUpdater(api, notify) {
  let epoch = 0; let download = null; let checking = null;
  const fs = api.getFileSystemManager();
  function cancel() { epoch++; if (download) download.abort(); if (checking) checking.abort(); download = null; checking = null; }
  async function check() {
    if (!available(api)) throw new Error('仅限 Android 更新验证包');
    const token = epoch;
    return new Promise((resolve, reject) => {
      checking = api.request({ url: `${ORIGIN}/manifest.json`, timeout: 15000, success: (res) => {
        checking = null; try { if (token !== epoch) throw new Error('已取消检查'); if (res.statusCode !== 200) throw new Error('验证服务不可用'); resolve(candidate(res.data)); } catch (error) { reject(error); }
      }, fail: () => { checking = null; reject(new Error('请连接 USB 验证服务后重试')); } });
    });
  }
  async function install(value) {
    if (!available(api)) throw new Error('仅限 Android 更新验证包');
    const resource = candidate(value); const host = identity(api);
    if ((host.appVersion && host.appVersion !== build.versionName) || host.versionSource === 'unavailable') throw new Error('宿主版本与构建记录不一致，停止安装');
    if (!host.installAvailable) throw new Error('当前宿主不支持安装接口');
    cancel(); const token = epoch; let path = null;
    const active = () => token === epoch;
    try {
      const result = await new Promise((resolve, reject) => {
        download = api.downloadFile({ url: resource.url, timeout: 120000, success: resolve, fail: () => reject(new Error(active() ? '安装包下载失败，请重试' : '已取消下载')) });
        if (download.onProgressUpdate) download.onProgressUpdate((progress) => { if (active()) notify(`正在下载 ${progress.progress}%`); });
      });
      path = result.tempFilePath;
      if (!active()) throw new Error('已取消下载');
      if (result.statusCode !== 200) throw new Error('安装包下载失败');
      const stat = fs.statSync(path, false); const size = (stat.stats || stat).size;
      if (size !== resource.size) throw new Error('安装包大小不符，停止安装');
      notify('正在校验安装包');
      if (await hashFile(fs, path, size, active) !== resource.sha256) throw new Error('安装包校验失败，停止安装');
      if (!active()) throw new Error('已取消下载');
      await new Promise((resolve, reject) => api.miniapp.installApp({ filePath: path, success: resolve, fail: () => reject(new Error('安装未完成，请检查系统安装授权后重试')) }));
      notify('已请求系统安装；完成后重新打开应用核对版本与存档');
      // The installer may still be reading the APK after this callback. Keep the temporary file.
      path = null;
    } finally {
      download = null;
      if (path) { try { fs.unlinkSync(path); } catch {} }
    }
  }
  return { check, install, cancel };
}
module.exports = { available, identity, candidate, snapshot, compare, createUpdater };
