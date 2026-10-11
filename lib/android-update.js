const build = require('./android-build.js');
const { isNativeContainer } = require('./platform.js');
const { createHash } = require('./apk-sha256.js');
const { createInstaller } = require('./apk-installer.js');
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
  let epoch = 0; let checking = null;
  const installer = createInstaller(api, notify);
  function cancel() { epoch++; installer.cancel(); if (checking) checking.abort(); checking = null; }
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
    await installer.install(resource);
  }
  return { check, install, cancel };
}
module.exports = { available, identity, candidate, snapshot, compare, createUpdater };
