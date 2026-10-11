// Generated from app/js/english-audio.js by tools/build_miniprogram.mjs. Do not edit.
// Immutable audio metadata is bundled; downloaded files must match its hash.
function decodeAudioMetadata(text) {
  if (typeof text !== 'string' || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(text)) return null;
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const bytes = []; let value = 0; let bits = 0;
  for (const char of text.replace(/=+$/, '')) {
    value = (value << 6) | alphabet.indexOf(char); bits += 6;
    if (bits >= 8) { bits -= 8; bytes.push((value >>> bits) & 255); }
  }
  return bytes;
}
function compactResource(manifest, packId, item, speed) {
  const book = manifest.books && manifest.books[packId];
  if (!Array.isArray(book) || book.length !== 2 || typeof book[0] !== 'string' || !item.itemId.startsWith(book[0])) return null;
  const suffix = item.itemId.slice(book[0].length);
  if (!/^[a-f0-9]{16}$/.test(suffix)) return null;
  const records = decodeAudioMetadata(book[1]);
  if (!records || records.length % 10) return null;
  for (let offset = 0; offset < records.length; offset += 10) {
    const id = records.slice(offset, offset + 8).map((v) => v.toString(16).padStart(2, '0')).join('');
    if (id !== suffix) continue;
    const index = records[offset + 8] * 256 + records[offset + 9];
    const clip = manifest.clips && manifest.clips[index];
    if (clip !== item.canonical || typeof manifest.data !== 'string') return null;
    // Decode only this 70-byte record, with its base64 alignment prefix.
    const byteOffset = index * 70; const prefix = byteOffset % 3;
    const encodedOffset = Math.floor(byteOffset / 3) * 4;
    const encodedLength = Math.ceil((prefix + 70) / 3) * 4;
    const chunk = decodeAudioMetadata(manifest.data.slice(encodedOffset, encodedOffset + encodedLength));
    const data = chunk && chunk.slice(prefix, prefix + 70);
    if (!data || data.length !== 70) return null;
    const start = speed === 'normal' ? 0 : 35;
    const sha256 = data.slice(start, start + 32).map((v) => v.toString(16).padStart(2, '0')).join('');
    return { path: `audio/${sha256}.mp3`, sha256, bytes: data[start + 32] * 65536 + data[start + 33] * 256 + data[start + 34] };
  }
  return null;
}
function pronunciationResource(manifest, packId, item, speed = 'normal') {
  if (!item || typeof item.itemId !== 'string' || typeof item.canonical !== 'string') return null;
  if (!manifest || ![1, 2].includes(manifest.schemaVersion) || !/^https:\/\/[a-zA-Z0-9.-]+(?:\/[a-zA-Z0-9_./-]*)?$/.test(manifest.baseUrl || '')) return null;
  const entry = manifest.entries && manifest.entries[packId] && manifest.entries[packId][item.itemId];
  const resource = manifest.schemaVersion === 2 ? compactResource(manifest, packId, item, speed) : entry && entry.text === item.canonical && entry[speed];
  if (!['normal', 'slow'].includes(speed) || !resource || !/^audio\/[a-f0-9]{64}\.mp3$/.test(resource.path) || !/^[a-f0-9]{64}$/.test(resource.sha256) || !Number.isSafeInteger(resource.bytes) || resource.bytes <= 0 || resource.bytes > 5 * 1024 * 1024) return null;
  return { ...resource, url: `${manifest.baseUrl.replace(/\/$/, '')}/${resource.path}` };
}

function audioSha256(buffer) {
  const bytes = new Uint8Array(buffer);
  const primes = []; const constants = []; const state = [];
  for (let n = 2; primes.length < 64; n++) {
    if (primes.some((prime) => prime * prime <= n && n % prime === 0)) continue;
    primes.push(n);
    constants.push((Math.cbrt(n) % 1 * 0x100000000) | 0);
    if (state.length < 8) state.push((Math.sqrt(n) % 1 * 0x100000000) | 0);
  }
  const padded = new Uint8Array(Math.ceil((bytes.length + 9) / 64) * 64);
  padded.set(bytes); padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 8, Math.floor(bytes.length / 0x20000000));
  view.setUint32(padded.length - 4, (bytes.length * 8) >>> 0);
  const rotate = (x, n) => (x >>> n) | (x << (32 - n));
  const words = new Int32Array(64);
  for (let offset = 0; offset < padded.length; offset += 64) {
    for (let i = 0; i < 16; i++) words[i] = view.getInt32(offset + i * 4);
    for (let i = 16; i < 64; i++) {
      const x = words[i - 15]; const y = words[i - 2];
      words[i] = words[i - 16] + (rotate(x, 7) ^ rotate(x, 18) ^ (x >>> 3)) + words[i - 7] + (rotate(y, 17) ^ rotate(y, 19) ^ (y >>> 10));
    }
    let [a, b, c, d, e, f, g, h] = state;
    for (let i = 0; i < 64; i++) {
      const t1 = (h + (rotate(e, 6) ^ rotate(e, 11) ^ rotate(e, 25)) + ((e & f) ^ (~e & g)) + constants[i] + words[i]) | 0;
      const t2 = ((rotate(a, 2) ^ rotate(a, 13) ^ rotate(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    [a, b, c, d, e, f, g, h].forEach((value, i) => { state[i] = (state[i] + value) | 0; });
  }
  return state.map((value) => (value >>> 0).toString(16).padStart(8, '0')).join('');
}

module.exports = { pronunciationResource, audioSha256 };
