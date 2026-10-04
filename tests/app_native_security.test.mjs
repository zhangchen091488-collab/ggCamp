import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { createStore } = require('../lib/storage.js');
const practice = require('../lib/english-practice.js');
const clone = (v) => JSON.parse(JSON.stringify(v));
function fixture() {
  let saved;
  const store = createStore({ getStorageSync() { return saved; }, setStorageSync(key, value) { saved = clone(value); } });
  practice.selectPack(store, practice.pack.packId);
  return { store, reload: () => clone(saved) };
}
function begin(store, kind = 'word') { return practice.start(store, { kind, count: 10, mode: 'unit', rng: () => .2 }, {}, Date.parse('2026-10-03T08:00:00Z')); }

test('corrupt history elements are discarded without losing valid records or rewards', () => {
  for (const miniFeatures of [undefined, 2]) {
    const payload = { version: 1, miniFeatures, history: [null, false, 7, 'bad', [], { id: 'earned', score: 100 }], trophies: { got: { saved: true } } };
    let saved;
    const store = createStore({ getStorageSync: () => payload, setStorageSync(key, value) { saved = value; } });
    assert.deepEqual(store.state.history.map((record) => record.id), ['earned']);
    assert.deepEqual(store.state.trophies, payload.trophies);
    assert.match(store.warning(), /记录/);
    assert.equal(store.save(), true);
    assert.equal(saved.history.length, 1);
  }
});
test('corrupt English namespace and incomplete sessions recover without losing other progress', () => {
  const { store: original } = fixture(); begin(original);
  const good = clone(practice.state(original));
  for (const corrupt of ['broken', [], { ...good, session: {} }, { ...good, session: { ...good.session, attempts: [null] } }, { ...good, session: { ...good.session, index: 999 } }, { ...good, session: { ...good.session, plan: null } }]) {
    const payload = { version: 1, englishDemo: corrupt, history: [{ id: 'earned' }], trophies: { got: { saved: true } } };
    const store = createStore({ getStorageSync: () => clone(payload), setStorageSync() {} });
    assert.match(store.warning(), /记录/);
    const english = practice.state(store);
    assert.equal(english.session, null);
    assert.equal(typeof english.progress.records, 'object');
    if (typeof corrupt === 'object' && !Array.isArray(corrupt)) assert.deepEqual(english.progress, good.progress);
    assert.equal(store.state.history[0].id, 'earned');
    assert.deepEqual(store.state.trophies, payload.trophies);
    assert.match(store.warning(), /记录/);
    assert.doesNotThrow(() => practice.start(store, { kind: 'word', count: 10, mode: 'unit' }, {}));
  }
});

test('valid legacy English sessions migrate and resume with their draft and earned progress', () => {
  const { store, reload } = fixture(); begin(store, 'phrase'); practice.learn(store);
  practice.updateDraft(store, 'oops'); practice.complete(store); practice.hint(store);
  const saved = reload(); saved.session = null; delete saved.englishDemo.session.rewardEnabled;
  const restored = createStore({ getStorageSync: () => saved, setStorageSync() {} });
  const english = practice.state(restored);
  assert.equal(english.session.rewardEnabled, false);
  assert.equal(practice.current(restored).draft, 'oops');
  assert.deepEqual(english.progress, saved.englishDemo.progress);
  assert.equal(restored.warning(), '');
});
test('Android release identity removes permissions unrelated to training and disables install SDK', () => {
  const config = JSON.parse(readFileSync(new URL('../project.miniapp.json', import.meta.url), 'utf8'))['mini-android'];
  assert.equal(config.packageName, 'com.chen.ggcamp');
  assert.equal(config.enableVConsole, 'close');
  assert.equal(config.useExtendedSdk.media, true);
  assert.equal(config.useExtendedSdk.install, false);
  assert.equal(config.useExtendedSdk.open, false);
  for (const name of ['RECORD_AUDIO', 'CAMERA', 'ACCESS_FINE_LOCATION', 'ACCESS_COARSE_LOCATION', 'READ_PHONE_STATE', 'READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE', 'BLUETOOTH', 'BLUETOOTH_ADMIN', 'REQUEST_INSTALL_PACKAGES']) {
    assert.ok(config.uselessPermissions.includes(name), `remove unused ${name}`);
  }
  assert.ok(!config.uselessPermissions.includes('INTERNET'));
});
