// Generated from app/js/character-packs.js by tools/build_miniprogram.mjs. Do not edit.
const { audioSha256 } = require('../shared/english-audio.js');
// Data-only packages, shared by the publisher and native download page.
const PACK_LIMIT = 2 * 1024 * 1024;
const STORAGE_LIMIT = 20 * 1024 * 1024;
const COLORS = ['original', 'pink', 'blue', 'yellow', 'mint', 'violet', 'gold', 'snow', 'rainbow'];
const FACES = ['open', 'happy', 'tight'];
const COSTUMES = ['ribbon', 'cap', 'hachimaki', 'headphones', 'wizard', 'crown', 'glasses', 'cat', 'cape'];
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const isRecord = v => !!v && typeof v === 'object' && !Array.isArray(v);
const characterId = v => typeof v === 'string' && /^partner-[a-z0-9][a-z0-9-]{0,47}$/.test(v);
function normalizeCode(value) {
  const code = typeof value === 'string' ? value.toUpperCase().replace(/[\s-]/g, '') : '';
  if (!/^[A-Z0-9]{1,32}$/.test(code)) throw new Error('请输入有效的伙伴兑换码');
  return code;
}
function codeDigest(value) {
  return audioSha256(Uint8Array.from(normalizeCode(value), c => c.charCodeAt(0)));
}
function safePath(v) {
  return typeof v === 'string' && v.length <= 180 && /^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*\.(?:json|png)$/.test(v);
}
function check(ok, message = '角色包格式不正确') { if (!ok) throw new Error(message); }
function digest(file, limit) {
  check(isRecord(file) && Number.isSafeInteger(file.bytes) && file.bytes > 0 && file.bytes <= limit && typeof file.sha256 === 'string' && /^[a-f0-9]{64}$/.test(file.sha256));
}
function assertIndex(index) {
  check(isRecord(index) && index.schemaVersion === 2 && Number.isSafeInteger(index.revision) && index.revision >= 1 && isRecord(index.codeHashes) && isRecord(index.characters), '伙伴目录格式不正确');
  check(Object.keys(index.codeHashes).length <= 2000 && Object.keys(index.characters).length <= 500, '伙伴目录过大');
  for (const [id, entry] of Object.entries(index.characters)) {
    check(characterId(id) && isRecord(entry) && typeof entry.available === 'boolean' && Number.isSafeInteger(entry.revision) && entry.revision >= 1);
    check(Object.keys(entry).every(k => ['available', 'revision', 'path', 'bytes', 'sha256'].includes(k)), '目录角色包含额外字段');
    check(entry.path === `packs/${id}/${entry.revision}/manifest.json`); digest(entry, 64 * 1024);
  }
  check(Object.keys(index).every(k => ['schemaVersion', 'revision', 'codeHashes', 'characters', 'generatedAt'].includes(k)), '目录不能包含明文兑换码或额外字段');
  for (const [code, id] of Object.entries(index.codeHashes)) check(/^[a-f0-9]{64}$/.test(code) && characterId(id) && own(index.characters, id));
  return index;
}
function assertManifest(m, expected = null) {
  check(isRecord(m) && m.schemaVersion === 1 && characterId(m.characterId) && Number.isSafeInteger(m.revision) && m.revision >= 1);
  check(Number.isSafeInteger(m.minClientBuild) && m.minClientBuild >= 1);
  check(m.minClientBuild <= 3, '请更新游戏后再领取这位伙伴');
  check(typeof m.name === 'string' && m.name.trim().length > 0 && m.name.length <= 24 && typeof m.description === 'string' && m.description.length <= 300);
  if (expected) check(m.characterId === expected.characterId && m.revision === expected.revision, '角色身份或版本不一致');
  check(isRecord(m.files) && Object.keys(m.files).length > 0 && Object.keys(m.files).length <= (m.minClientBuild >= 3 ? 160 : 64) && isRecord(m.frames) && isRecord(m.capabilities));
  const paths = new Set(); let total = 0;
  for (const [id, file] of Object.entries(m.files)) {
    check(/^[a-z0-9][a-z0-9-]{0,63}$/.test(id)); digest(file, 256 * 1024);
    check(safePath(file.path) && file.path.endsWith('.png') && !file.path.includes('/') && !paths.has(file.path));
    check(file.width === 256 && file.height === 256); paths.add(file.path); total += file.bytes;
  }
  check(total === m.totalBytes && total <= PACK_LIMIT && own(m.files, m.thumbnail));
  const caps = m.capabilities;
  check(Array.isArray(caps.colors) && caps.colors.includes('original') && caps.colors.every(c => COLORS.includes(c)) && new Set(caps.colors).size === caps.colors.length);
  check(Array.isArray(caps.costumes) && caps.costumes.every(c => COSTUMES.includes(c)) && new Set(caps.costumes).size === caps.costumes.length);
  check(Object.keys(m.frames).length === caps.colors.length);
  for (const color of caps.colors) {
    check(isRecord(m.frames[color]) && Object.keys(m.frames[color]).length === 3);
    for (const face of FACES) check(own(m.files, m.frames[color][face]));
  }
  if (m.clothes !== undefined) {
    check(m.minClientBuild >= 2 && isRecord(m.clothes), '分层衣服需要新版游戏');
    check(Object.keys(m.clothes).length === caps.colors.filter(c => c !== 'original').length);
    for (const color of caps.colors.filter(c => c !== 'original')) {
      check(isRecord(m.clothes[color]) && Object.keys(m.clothes[color]).length === 3);
      for (const face of FACES) check(own(m.files, m.clothes[color][face]));
    }
  }
  if (caps.wearTransforms !== undefined) {
    check(m.minClientBuild >= 2 && isRecord(caps.wearTransforms));
    check(Object.keys(caps.wearTransforms).length === caps.costumes.length);
    for (const costume of caps.costumes) {
      const faces = caps.wearTransforms[costume];
      check(isRecord(faces) && Object.keys(faces).length === 3);
      for (const face of FACES) {
        const layers = faces[face];
        check(isRecord(layers) && isRecord(layers.front) && Object.keys(layers).every(k => ['front', 'back'].includes(k)));
        if (['cape', 'cat'].includes(costume)) check(isRecord(layers.back));
        for (const t of Object.values(layers)) {
          check(isRecord(t) && Object.keys(t).every(k => ['x', 'y', 'scaleX', 'scaleY', 'rotate'].includes(k)));
          check(Number.isFinite(t.x) && Math.abs(t.x) <= 128 && Number.isFinite(t.y) && Math.abs(t.y) <= 128);
          check(Number.isFinite(t.scaleX) && t.scaleX >= .25 && t.scaleX <= 2 && Number.isFinite(t.scaleY) && t.scaleY >= .25 && t.scaleY <= 2);
          check(Number.isFinite(t.rotate) && Math.abs(t.rotate) <= 30);
        }
      }
    }
  }
  if (caps.wearTransform !== undefined) {
    const t = caps.wearTransform;
    check(isRecord(t) && Object.keys(t).every(k => ['x', 'y', 'scale'].includes(k)) && Number.isFinite(t.x) && Math.abs(t.x) <= 64 && Number.isFinite(t.y) && Math.abs(t.y) <= 64 && Number.isFinite(t.scale) && t.scale >= .5 && t.scale <= 1.5);
  }
  if (m.actions !== undefined) {
    check(m.minClientBuild >= 3 && isRecord(m.actions) && Object.keys(m.actions).every(k => FACES.includes(k)), '多动作需要新版游戏');
    const ids = new Set(FACES);
    for (const variants of Object.values(m.actions)) {
      check(Array.isArray(variants) && variants.length >= 1 && variants.length <= 4);
      for (const action of variants) {
        check(isRecord(action) && Object.keys(action).every(k => ['id', 'name', 'frame', 'clothes', 'wearTransforms'].includes(k)));
        check(typeof action.id === 'string' && /^[a-z][a-z0-9-]{0,47}$/.test(action.id) && !ids.has(action.id)); ids.add(action.id);
        check(typeof action.name === 'string' && action.name.trim().length > 0 && action.name.length <= 24 && own(m.files, action.frame));
        // Reuse the exact clothing and fitting rules for every additional pose.
        const pose = { ...m, minClientBuild: 2, files: { [action.frame]: m.files[action.frame] }, thumbnail: action.frame,
          frames: Object.fromEntries(caps.colors.map(color => [color, Object.fromEntries(FACES.map(face => [face, action.frame]))])),
          capabilities: { ...caps, wearTransforms: action.wearTransforms } };
        delete pose.actions; delete pose.clothes;
        if (m.clothes) {
          check(isRecord(action.clothes) && Object.keys(action.clothes).length === caps.colors.filter(c => c !== 'original').length);
          pose.clothes = {};
          for (const color of caps.colors.filter(c => c !== 'original')) {
            check(own(m.files, action.clothes[color]));
            pose.files[action.clothes[color]] = m.files[action.clothes[color]];
            pose.clothes[color] = Object.fromEntries(FACES.map(face => [face, action.clothes[color]]));
          }
        } else check(action.clothes === undefined);
        if (caps.wearTransforms) {
          check(isRecord(action.wearTransforms));
          pose.capabilities.wearTransforms = Object.fromEntries(Object.entries(action.wearTransforms).map(([costume, layers]) => [costume, Object.fromEntries(FACES.map(face => [face, layers]))]));
        } else check(action.wearTransforms === undefined);
        pose.totalBytes = Object.values(pose.files).reduce((n, f) => n + f.bytes, 0);
        assertManifest(pose);
      }
    }
  }
  return m;
}
function assertPng(bytes, file) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  check(b.length >= 33 && [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => b[i] === v), '角色图片格式不正确');
  const word = i => b[i] * 16777216 + b[i + 1] * 65536 + b[i + 2] * 256 + b[i + 3];
  check(word(8) === 13 && String.fromCharCode(...b.slice(12, 16)) === 'IHDR' && word(16) === file.width && word(20) === file.height, '角色图片尺寸不正确');
  return true;
}

module.exports = { PACK_LIMIT, STORAGE_LIMIT, COLORS, FACES, COSTUMES, isRecord, characterId, normalizeCode, codeDigest, safePath, assertIndex, assertManifest, assertPng };
