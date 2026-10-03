// Runtime detection for the 多端应用 (Donut) native containers.
// The container's native renderer does not answer `fields({ node: true })` queries for
// `<canvas type="2d">`, and it tears down the WebAudio backend on backgrounding; both were
// verified on Android SDK 1.7.0.
//
// This is a *platform* signal, not a capability verdict. Only use it where the platform itself
// changes the required behaviour (e.g. audio picks the file channel). Anything that can vary
// between hosts on the same platform — such as whether a canvas node can actually be queried —
// must probe for the capability instead of trusting this flag. See
// `components/celebration/celebration.js`, which probes rather than gating on the platform.
//
// `host` only carries `appId` in a plain WeChat mini program (and only when running inside a
// third-party App), so the `env`/`packageName`/`bundleIdentifier`/`sdkVersion` markers do not
// match there.
function isNativeContainer(api) {
  try {
    const info = typeof api.getAppBaseInfo === 'function' ? api.getAppBaseInfo()
      : typeof api.getSystemInfoSync === 'function' ? api.getSystemInfoSync() : null;
    const host = info && info.host;
    if (!host || typeof host !== 'object') return false;
    return host.env === 'SAAASDK' || !!host.packageName || !!host.bundleIdentifier || !!host.sdkVersion;
  } catch { return false; }
}
module.exports = { isNativeContainer };
