import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHash as nodeHash } from 'node:crypto';
const require = createRequire(import.meta.url);
const { createHash, hashFile } = require('../lib/apk-sha256.js');
const update = require('../lib/android-update.js');
const build = require('../lib/android-build.js');
const bytes = Buffer.from('apk payload');
const digest = nodeHash('sha256').update(bytes).digest('hex');
const manifest = () => ({ schemaVersion: 1, channel: 'validation', packageName: build.packageName, versionCode: build.versionCode + 1, versionName: '0.9.3', url: 'http://127.0.0.1:18765/target.apk', size: bytes.length, sha256: digest, certificateSha256: build.certificateSha256 });
function host(data = bytes) {
  const storage = new Map(); let installs = 0; let reads = 0; let deletes = 0;
  const fs = { openSync: () => 'fd', closeSync() {}, statSync: () => ({ stats: { size: data.length } }), unlinkSync: () => deletes++, read({ arrayBuffer, length, position, success }) { reads++; new Uint8Array(arrayBuffer).set(data.subarray(position, position + length)); success({ arrayBuffer, bytesRead: Math.min(length, data.length - position) }); } };
  const api = { getSystemInfoSync: () => ({ platform: 'android' }), getAppBaseInfo: () => ({ appVersion: build.versionName, host: { env: 'SAAASDK' } }), getFileSystemManager: () => fs, getStorageSync: (key) => storage.get(key), setStorageSync: (key, value) => storage.set(key, value), downloadFile({ success }) { queueMicrotask(() => success({ statusCode: 200, tempFilePath: '/temp.apk' })); return { abort() {}, onProgressUpdate() {} }; }, request({ success }) { queueMicrotask(() => success({ statusCode: 200, data: manifest() })); return { abort() {} }; }, miniapp: { installApp({ success }) { installs++; success({}); } } };
  return { api, fs, installs: () => installs, reads: () => reads, deletes: () => deletes };
}
test('incremental SHA-256 matches native crypto across block and file boundaries', async () => {
  for (const size of [0, 3, 55, 56, 63, 64, 65, 1000000]) {
    const data = Buffer.alloc(size, 147); const hash = createHash();
    for (let p = 0; p < size; p += 31) hash.add(data.subarray(p, p + 31));
    assert.equal(hash.digest(), nodeHash('sha256').update(data).digest('hex'));
  }
  const data = Buffer.alloc(600000, 87); const h = host(data);
  assert.equal(await hashFile(h.fs, '/temp.apk', data.length), nodeHash('sha256').update(data).digest('hex'));
  assert.equal(h.reads(), 3);
});
test('validation is Android-only and rejects public, wrong-identity, stale and malformed manifests', () => {
  const h = host(); assert.equal(update.available(h.api), true);
  for (const platform of ['ios', 'devtools']) assert.equal(update.available({ ...h.api, getSystemInfoSync: () => ({ platform }) }), false);
  assert.equal(update.available({ ...h.api, getAppBaseInfo: () => ({}) }), false);
  for (const change of [{ channel: 'stable' }, { packageName: 'other' }, { certificateSha256: 'bad' }, { versionCode: build.versionCode }, { versionCode: '103' }, { url: 'http://evil/target.apk' }, { size: -1 }, { sha256: 'bad' }]) assert.throws(() => update.candidate({ ...manifest(), ...change }));
});
test('only verified downloads reach the installer; callback reports request, not completed upgrade', async () => {
  const h = host(); const messages = []; const updater = update.createUpdater(h.api, (message) => messages.push(message));
  const value = await updater.check(); await updater.install(value);
  assert.equal(h.installs(), 1); assert.equal(h.deletes(), 0);
  assert.match(messages.at(-1), /已请求系统安装/);
  const broken = host(Buffer.from('bad payload')); const badUpdater = update.createUpdater(broken.api, () => {});
  await assert.rejects(badUpdater.install(manifest()), /校验失败/);
  assert.equal(broken.installs(), 0); assert.equal(broken.deletes(), 1);
});
test('mismatched real host version, cancellation and incomplete downloads never install', async () => {
  const h = host(); h.api.getAppBaseInfo = () => ({ appVersion: 'unexpected', host: { env: 'SAAASDK' } });
  await assert.rejects(update.createUpdater(h.api, () => {}).install(manifest()), /宿主版本/); assert.equal(h.installs(), 0);
  const short = host(Buffer.from('short')); await assert.rejects(update.createUpdater(short.api, () => {}).install(manifest()), /大小不符/); assert.equal(short.installs(), 0);
  const cancelled = host(); const updater = update.createUpdater(cancelled.api, () => {}); const job = updater.install(manifest()); updater.cancel(); await assert.rejects(job, /已取消/); assert.equal(cancelled.installs(), 0);
});
test('upgrade snapshot is separate from and does not mutate complete learning records', () => {
  const h = host(); const state = { settings: { volume: .5 }, english: { progress: { cat: 3 } }, history: [1], collection: ['cat'] };
  const original = JSON.stringify(state); update.snapshot(h.api, state);
  assert.equal(JSON.stringify(state), original); assert.match(update.compare(h.api, state), /等待覆盖升级/);
  const before = h.api.getStorageSync('ggcamp:apk-update-validation:v1');
  before.versionCode--; assert.match(update.compare(h.api, state), /完整学习存档一致/);
  state.history.push(2); assert.match(update.compare(h.api, state), /存档存在差异/);
});

test('cloud APK versions use a.b.c and embedded identity matches packaging config', () => {
  const config = require('../project.miniapp.json');
  assert.match(config.version, /^\d+\.\d+\.\d+$/);
  assert.equal(build.versionName, config.version);
  assert.equal(build.versionCode, config.versionCode);
});

test('private validation accepts a missing host version using APK-checked embedded metadata', async () => {
  const h = host(); h.api.getAppBaseInfo = () => ({ host: { env: 'SAAASDK' } });
  assert.equal(update.identity(h.api).versionSource, 'embedded-validation');
  await update.createUpdater(h.api, () => {}).install(manifest());
  assert.equal(h.installs(), 1);
});
