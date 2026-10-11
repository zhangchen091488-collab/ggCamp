// Bounded-memory SHA-256 for APK downloads; each file read is at most 256 KiB.
function createHash() {
  const k = []; const state = []; const primes = [];
  for (let n = 2; primes.length < 64; n++) {
    if (primes.some((p) => p * p <= n && n % p === 0)) continue;
    primes.push(n); k.push((Math.cbrt(n) % 1 * 0x100000000) | 0);
    if (state.length < 8) state.push((Math.sqrt(n) % 1 * 0x100000000) | 0);
  }
  const block = new Uint8Array(64); const words = new Int32Array(64);
  let used = 0; let total = 0;
  const rotate = (x, n) => (x >>> n) | (x << (32 - n));
  function compress() {
    const view = new DataView(block.buffer);
    for (let i = 0; i < 16; i++) words[i] = view.getInt32(i * 4);
    for (let i = 16; i < 64; i++) {
      const x = words[i - 15]; const y = words[i - 2];
      words[i] = words[i - 16] + (rotate(x, 7) ^ rotate(x, 18) ^ (x >>> 3)) + words[i - 7] + (rotate(y, 17) ^ rotate(y, 19) ^ (y >>> 10));
    }
    let [a, b, c, d, e, f, g, h] = state;
    for (let i = 0; i < 64; i++) {
      const t1 = (h + (rotate(e, 6) ^ rotate(e, 11) ^ rotate(e, 25)) + ((e & f) ^ (~e & g)) + k[i] + words[i]) | 0;
      const t2 = ((rotate(a, 2) ^ rotate(a, 13) ^ rotate(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    [a, b, c, d, e, f, g, h].forEach((v, i) => { state[i] = (state[i] + v) | 0; });
  }
  function add(bytes) {
    total += bytes.length;
    for (let offset = 0; offset < bytes.length;) {
      const n = Math.min(64 - used, bytes.length - offset);
      block.set(bytes.subarray(offset, offset + n), used); used += n; offset += n;
      if (used === 64) { compress(); used = 0; }
    }
  }
  function digest() {
    const length = total; const padding = new Uint8Array(used < 56 ? 64 - used : 128 - used);
    padding[0] = 128; const view = new DataView(padding.buffer);
    view.setUint32(padding.length - 8, Math.floor(length / 0x20000000));
    view.setUint32(padding.length - 4, (length * 8) >>> 0); add(padding);
    return state.map((v) => (v >>> 0).toString(16).padStart(8, '0')).join('');
  }
  return { add, digest };
}
async function hashFile(fs, path, size, active = () => true) {
  const fd = fs.openSync({ filePath: path, flag: 'r' }); const hash = createHash();
  try {
    for (let position = 0; position < size;) {
      if (!active()) throw new Error('已取消下载');
      const length = Math.min(262144, size - position);
      const result = await new Promise((resolve, reject) => fs.read({ fd, arrayBuffer: new ArrayBuffer(length), offset: 0, length, position, success: resolve, fail: reject }));
      if (!result.bytesRead || result.bytesRead > length) throw new Error('安装包读取失败');
      hash.add(new Uint8Array(result.arrayBuffer, 0, result.bytesRead)); position += result.bytesRead;
    }
    return hash.digest();
  } finally { fs.closeSync({ fd }); }
}
module.exports = { createHash, hashFile };
