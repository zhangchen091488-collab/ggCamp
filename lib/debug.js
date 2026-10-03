// Debug-only collection switch: unlock every item so an effect can be checked without grinding for
// its trophy. It is deliberately **not part of a release build**.
//
// `offers()` decides whether the switch exists at all:
//   - WeChat DevTools and a preview build report `envVersion: 'develop'`;
//   - an experience build reports `'trial'`;
//   - the released mini program and the released multi-platform app report `'release'`.
// Anything else — including a host that does not expose `getAccountInfoSync`, such as some native
// containers — counts as release, so a missing platform signal fails closed instead of unlocking
// the collection.
//
// `LOCAL_DEBUG` is the escape hatch for a local build whose host still reports `release` (an APK
// built for testing, for instance). It must stay `false` in the repository; the release check in
// `tests/app_miniprogram_visual.test.mjs` fails if it is ever flipped.
//
// The flag also lives in its own storage key on purpose — it must never be confused with the
// player's save, and the load-time migration keeps stripping the retired `settings.collectionDebug`
// (`lib/storage.js`). Nothing here touches records, trophies or history.
const KEY = 'dopa-drill:mini:debug:v1';
const LOCAL_DEBUG = false;
// The versions that may offer the switch. Every other value — `'release'`, `''`, `undefined` —
// means no switch, so the check cannot accidentally pass on a host that answers with something new.
const OPEN_ENVS = ['develop', 'trial'];
let on = false;
let offered = false;
function offers(api) {
  if (LOCAL_DEBUG) return true;
  try {
    const info = typeof api.getAccountInfoSync === 'function' ? api.getAccountInfoSync() : null;
    const env = info && info.miniProgram && info.miniProgram.envVersion;
    return OPEN_ENVS.includes(env);
  } catch { return false; }
}
function load(api) {
  offered = offers(api);
  // A flag left behind by an earlier debug session must not unlock a released build.
  if (!offered) { on = false; return false; }
  try { on = !!api.getStorageSync(KEY); } catch { on = false; }
  return on;
}
function set(api, value) {
  if (!offered) return false;
  on = !!value;
  try { if (on) api.setStorageSync(KEY, true); else api.removeStorageSync(KEY); } catch { /* storage is optional */ }
  return on;
}
// Whether the switch is offered at all, as decided by the last `load()`.
function available() { return offered; }
function enabled() { return offered && on; }
// Resetting the save always drops the key, even in a build that does not offer the switch, so a
// flag left by an earlier debug session cannot survive a reset.
function clear(api) { on = false; try { api.removeStorageSync(KEY); } catch { /* storage is optional */ } return false; }
module.exports = { KEY, load, set, available, enabled, clear };
