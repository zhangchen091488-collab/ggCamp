import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
const require = createRequire(import.meta.url);
const build = require('../lib/android-build.js');
const updates = require('../lib/release-update.js');
const bytes = Buffer.from('published apk');
const item = (code = build.versionCode + 1) => ({ packageName: build.packageName, versionCode: code, versionName: '0.9.7', publishedAt: '2026-10-11T14:00:00Z', releaseNotes: '更新内容', releasePageUrl: `${updates.REPOSITORY}/releases/tag/v0.9.7`, artifacts: [{ abi: 'arm64-v8a', minSdk: 24, url: `${updates.REPOSITORY}/releases/download/v0.9.7/ggcamp-0.9.7.apk`, size: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), certificateSha256: build.certificateSha256 }] });
const feed = (latest = item(), channel = 'stable') => ({ schemaVersion: 1, channel, latest });
function host(responses = { stable: feed(), beta: feed(item(build.versionCode + 2), 'beta') }) {
  const storage = new Map(); const requested = []; let installs = 0;
  const fs = { openSync: () => 'fd', closeSync() {}, statSync: () => ({ size: bytes.length }), unlinkSync() {}, read({ arrayBuffer, success }) { new Uint8Array(arrayBuffer).set(bytes); success({ arrayBuffer, bytesRead: bytes.length }); } };
  const api = { getSystemInfoSync: () => ({ platform: 'android' }), getAppBaseInfo: () => ({ host: { env: 'SAAASDK' } }), getStorageSync: (k) => storage.get(k), setStorageSync: (k, v) => storage.set(k, v), getFileSystemManager: () => fs, request({ url, success }) { requested.push(url); const channel = url.includes('/beta.json') ? 'beta' : 'stable'; queueMicrotask(() => success({ statusCode: 200, data: responses[channel] })); return { abort() {} }; }, downloadFile({ success }) { queueMicrotask(() => success({ statusCode: 200, tempFilePath: '/apk' })); return { abort() {}, onProgressUpdate() {} }; }, miniapp: { installApp({ success }) { installs++; success({}); } } };
  return { api, requested, installs: () => installs, storage };
}
test('public feeds accept only published pinned identities and compatible artifacts', () => {
  assert.equal(updates.candidate(feed(null), 'stable'), null);
  assert.equal(updates.candidate(feed(item(build.versionCode)), 'stable'), null);
  const value = item();
  for (const patch of [{ packageName: 'evil' }, { versionCode: '109' }, { versionName: '0.9.7-beta' }, { publishedAt: '' }, { releasePageUrl: `${updates.REPOSITORY}/releases/tag/untagged-secret` }, { releasePageUrl: 'http://evil' }]) assert.throws(() => updates.candidate(feed({ ...value, ...patch }), 'stable'));
  for (const patch of [{ url: 'http://127.0.0.1/apk' }, { url: `${updates.REPOSITORY}/releases/download/v0.9.7/../other.apk` }, { certificateSha256: 'x' }, { sha256: 'x' }, { size: 0 }, { abi: 'x86' }, { minSdk: 35 }]) assert.throws(() => updates.candidate(feed({ ...value, artifacts: [{ ...value.artifacts[0], ...patch }] }), 'stable'));
  assert.throws(() => updates.candidate(feed(value, 'beta'), 'stable'));
});
test('stable by default; beta opt-in still compares stable and picks highest integer code', async () => {
  const h = host(); const updater = updates.createUpdater(h.api);
  assert.equal((await updater.check()).channel, 'stable'); assert.equal(h.requested.length, 1);
  updates.setBeta(h.api, true); assert.equal((await updater.check()).channel, 'beta'); assert.equal(h.requested.length, 3);
  updates.setBeta(h.api, false); assert.equal(updates.preferences(h.api).beta, false);
});
test('verified public install preserves storage and blocks mismatched host identity', async () => {
  const h = host(); h.storage.set('learning', { history: [1], trophies: ['x'] });
  const updater = updates.createUpdater(h.api); await updater.install(await updater.check());
  assert.equal(h.installs(), 1); assert.deepEqual(h.storage.get('learning'), { history: [1], trophies: ['x'] });
  h.api.getAppBaseInfo = () => ({ appVersion: 'wrong', host: { env: 'SAAASDK' } });
  await assert.rejects(updater.check(), /不一致/); await assert.rejects(updater.install({ ...item(), ...item().artifacts[0], channel: 'stable' }), /不一致/);
});
test('background is once per day, respects later; manual checks ignore deferral', async () => {
  const h = host(); const updater = updates.createUpdater(h.api); const now = Date.now();
  assert.ok(await updater.background(now)); assert.ok(await updater.background(now + 1000)); assert.equal(h.requested.length, 1);
  updates.later(h.api, build.versionCode + 1, now); assert.equal(await updater.background(now + 1001), null);
  updates.later(h.api, build.versionCode + 1, now + 86400000);
  assert.equal(await updater.background(now + 86400001), null);
  assert.ok(await updater.check());
});
test('no APK update access on WeChat, iOS or disabled builds', () => {
  const h = host(); assert.equal(updates.available(h.api), true);
  assert.equal(updates.available({ ...h.api, getSystemInfoSync: () => ({ platform: 'ios' }) }), false);
  assert.equal(updates.available({ ...h.api, getAppBaseInfo: () => ({}) }), false);
});
