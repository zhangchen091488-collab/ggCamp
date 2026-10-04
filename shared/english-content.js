// Generated from app/js/english-content.js by tools/build_miniprogram.mjs. Do not edit.
// Declarative English content. Keep draft data separate from publishable packs.
const ENGLISH_SCHEMA_VERSION = 1;
const ENGLISH_EXERCISE_TYPES = ['meaning', 'dictation'];
const ID = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/;
const RESERVED = new Set(['__proto__', 'constructor', 'prototype']);
const validId = (value) => typeof value === 'string' && ID.test(value) && !RESERVED.has(value);
const object = (value) => value && typeof value === 'object' && !Array.isArray(value);
const text = (value, max = 200) => typeof value === 'string' && value.trim().length > 0 && value.length <= max && !/[\u0000-\u001f\u007f]/.test(value);

function validateEnglishPack(pack, { publish = false } = {}) {
  const errors = [];
  const check = (ok, path, message) => { if (!ok) errors.push(`${path}: ${message}`); };
  const fields = (value, allowed, path) => { for (const key of Object.keys(value)) check(allowed.includes(key), `${path}.${key}`, '未知字段，不支持扩展脚本或未声明的能力'); };
  if (!object(pack)) return ['pack: 必须是对象'];
  fields(pack, ['schemaVersion', 'packId', 'seriesId', 'version', 'title', 'grade', 'semester', 'status', 'source', 'reviewedBy', 'reviewedAt', 'units', 'items', 'resources'], 'pack');
  if (object(pack.source)) fields(pack.source, ['usage', 'description', 'url'], 'source');
  check(pack.schemaVersion === ENGLISH_SCHEMA_VERSION, 'schemaVersion', '不支持的内容版本');
  for (const key of ['packId', 'seriesId']) check(validId(pack[key]), key, '需要稳定且安全的 ID');
  check(typeof pack.version === 'string' && /^\d+\.\d+\.\d+$/.test(pack.version), 'version', '需要 x.y.z 内容版本');
  check(text(pack.title), 'title', '缺少教材名称');
  check(Number.isInteger(pack.grade) && pack.grade >= 1 && pack.grade <= 6, 'grade', '需要小学年级');
  check(['first', 'second'].includes(pack.semester), 'semester', '需要学期');
  check(['draft', 'reviewed'].includes(pack.status), 'status', '需要 draft 或 reviewed');
  check(object(pack.source) && ['reference-only', 'publishable'].includes(pack.source.usage), 'source', '需要内容来源及用途分类');
  if (publish) {
    check(pack.status === 'reviewed', 'status', '发布包必须完成审核');
    check(pack.source && pack.source.usage === 'publishable', 'source.usage', '仅供参考的内容不能发布');
    check(pack.source && text(pack.source.description, 1000), 'source.description', '缺少来源说明');
    check(text(pack.reviewedBy), 'reviewedBy', '缺少审核者');
    check(typeof pack.reviewedAt === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(pack.reviewedAt), 'reviewedAt', '缺少审核日期');
  }
  const units = Array.isArray(pack.units) ? pack.units : [];
  const items = Array.isArray(pack.items) ? pack.items : [];
  const resources = Array.isArray(pack.resources) ? pack.resources : [];
  check(units.length > 0 && units.length <= 100, 'units', '需要 1–100 个单元');
  check(items.length > 0 && items.length <= 5000, 'items', '需要 1–5000 个词条');
  check(Array.isArray(pack.resources), 'resources', '需要资源清单（草稿可为空）');
  if (units.length > 100 || items.length > 5000 || resources.length > 5000) return [...errors, 'pack: 内容数量超过预算'];
  if (resources.reduce((total, resource) => total + (resource && Number.isSafeInteger(resource.bytes) && resource.bytes > 0 ? resource.bytes : 0), 0) > 50 * 1024 * 1024) errors.push('resources: 内容包音频超过 50 MiB 预算');
  const unitIds = new Set(); const itemIds = new Set(); const audioIds = new Set();
  for (const [i, unit] of units.entries()) {
    const p = `units[${i}]`;
    if (!object(unit)) { errors.push(`${p}: 必须是对象`); continue; }
    fields(unit, ['unitId', 'title', 'order'], p);
    check(validId(unit.unitId) && !unitIds.has(unit.unitId), `${p}.unitId`, '单元 ID 无效或重复');
    unitIds.add(unit.unitId);
    check(text(unit.title), `${p}.title`, '需要单元名称');
    check(Number.isInteger(unit.order) && unit.order >= 0, `${p}.order`, '需要排序值');
  }
  for (const [i, resource] of resources.entries()) {
    const p = `resources[${i}]`;
    if (!object(resource)) { errors.push(`${p}: 必须是对象`); continue; }
    fields(resource, ['audioId', 'path', 'format', 'bytes', 'sha256'], p);
    check(validId(resource.audioId) && !audioIds.has(resource.audioId), `${p}.audioId`, '音频 ID 无效或重复');
    audioIds.add(resource.audioId);
    check(typeof resource.path === 'string' && /^audio\/[a-zA-Z0-9_-]+\.mp3$/.test(resource.path), `${p}.path`, '需要包内 audio/*.mp3 安全相对路径');
    check(resource.format === 'mp3', `${p}.format`, '首版资源使用 MP3，真机兼容性另行验收');
    check(Number.isSafeInteger(resource.bytes) && resource.bytes > 0 && resource.bytes <= 5 * 1024 * 1024, `${p}.bytes`, '需要有效音频大小');
    check(typeof resource.sha256 === 'string' && /^[a-f0-9]{64}$/.test(resource.sha256), `${p}.sha256`, '需要 SHA-256');
  }
  for (const [i, item] of items.entries()) {
    const p = `items[${i}]`;
    if (!object(item)) { errors.push(`${p}: 必须是对象`); continue; }
    fields(item, ['itemId', 'unitIds', 'kind', 'canonical', 'promptZh', 'acceptedAnswers', 'audioId', 'phoneticUk', 'phoneticUs', 'exampleEn', 'exampleZh', 'notes'], p);
    for (const field of ['phoneticUk', 'phoneticUs', 'exampleEn', 'exampleZh', 'notes']) if (item[field] !== undefined) check(text(item[field]), `${p}.${field}`, '需要有效文本');
    check(validId(item.itemId) && !itemIds.has(item.itemId), `${p}.itemId`, '词条 ID 无效或重复');
    itemIds.add(item.itemId);
    check(Array.isArray(item.unitIds) && item.unitIds.length > 0 && new Set(item.unitIds).size === item.unitIds.length && item.unitIds.every((id) => unitIds.has(id)), `${p}.unitIds`, '需要已存在的单元');
    check(['word', 'phrase'].includes(item.kind), `${p}.kind`, '需要 word 或 phrase');
    check(text(item.canonical), `${p}.canonical`, '需要规范英文');
    check(text(item.promptZh), `${p}.promptZh`, '需要明确中文提示');
    const answers = item.acceptedAnswers;
    check(Array.isArray(answers) && answers.length > 0 && answers.length <= 20 && answers.every((answer) => text(answer)), `${p}.acceptedAnswers`, '需要 1–20 个完整合法答案');
    check(Array.isArray(answers) && answers.includes(item.canonical), `${p}.acceptedAnswers`, '必须包含规范英文');
    if (text(item.canonical)) {
      const words = item.canonical.trim().split(/\s+/).length;
      check(item.kind === 'phrase' ? words <= 8 : words === 1, `${p}.canonical`, '单词为一词，常用语最多八词');
    }
    check(item.audioId === null || validId(item.audioId), `${p}.audioId`, '需要音频 ID，待制作草稿使用 null');
    if (item.audioId !== null) check(audioIds.has(item.audioId), `${p}.audioId`, '音频引用不存在');
    if (publish) check(item.audioId !== null && audioIds.has(item.audioId), `${p}.audioId`, '发布词条必须有读音资源');
  }
  return errors;
}

function assertEnglishPack(pack, options) {
  const errors = validateEnglishPack(pack, options);
  if (errors.length) throw new Error(errors.join('\n'));
  return pack;
}

function englishProgressKey(packId, itemId, exerciseType) {
  if (!validId(packId) || !validId(itemId) || !ENGLISH_EXERCISE_TYPES.includes(exerciseType)) throw new Error('无效英语进度标识');
  return `${packId}:${itemId}:${exerciseType}`;
}

function adaptQwertyDictionary(entries) {
  if (!Array.isArray(entries)) throw new Error('词典必须是 JSON 数组');
  return entries.map((entry, index) => {
    if (!object(entry) || !text(entry.name) || !Array.isArray(entry.trans) || !entry.trans.length || !entry.trans.every((value) => text(value, 2000))) throw new Error(`词条 ${index + 1} 格式无效`);
    // Deliberately do not invent textbook units, stable IDs, or accepted variants.
    return { canonical: entry.name.trim(), translations: [...entry.trans], missing: ['itemId', 'unitIds', 'promptZhReview', 'audioId'] };
  });
}

module.exports = { ENGLISH_SCHEMA_VERSION, ENGLISH_EXERCISE_TYPES, validateEnglishPack, assertEnglishPack, englishProgressKey, adaptQwertyDictionary };
