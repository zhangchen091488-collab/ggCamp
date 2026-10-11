// Generated from app/js/english-cards.js by tools/build_miniprogram.mjs. Do not edit.
// The saved card order and accepted prefix are independent of visual animations.
function cardTarget(canonical) {
  return canonical.replace(/[.!?。！？]+$/, '');
}
function structure(canonical) {
  const target = cardTarget(canonical);
  const groups = [];
  for (const match of target.matchAll(/\S+/g)) {
    const ids = Array.from(match[0], (letter, offset) => /[a-z0-9]/i.test(letter) ? match.index + offset : -1).filter((id) => id >= 0);
    if (ids.length) groups.push(ids);
  }
  return { target, groups, positions: groups.flat() };
}
function createEnglishCards(canonical, rng = Math.random) {
  const { groups } = structure(canonical);
  return { order: groups.map((ids) => {
    const shuffled = [...ids];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.max(0, Math.min(i, Math.floor(rng() * (i + 1))));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }), used: [], cursor: 0 };
}
function validEnglishCards(canonical, cards) {
  const { target, groups, positions } = structure(canonical);
  if (!cards || !Array.isArray(cards.order) || cards.order.length !== groups.length || !Array.isArray(cards.used)) return false;
  if (!Number.isInteger(cards.cursor) || cards.cursor < 0 || cards.cursor > positions.length || cards.used.length !== cards.cursor || new Set(cards.used).size !== cards.used.length) return false;
  if (!cards.order.every((ids, i) => Array.isArray(ids) && ids.length === groups[i].length && new Set(ids).size === ids.length && ids.every((id) => groups[i].includes(id)))) return false;
  // Identical letters are interchangeable, but consumption must match the prefix.
  return groups.every((ids) => {
    const expected = ids.filter((id) => positions.indexOf(id) < cards.cursor).map((id) => target[id].toLowerCase()).sort().join('');
    const actual = cards.used.filter((id) => ids.includes(id)).map((id) => target[id].toLowerCase()).sort().join('');
    return expected === actual;
  }) && cards.used.every((id) => positions.includes(id));
}
function englishCardsView(canonical, cards) {
  const { target, groups, positions } = structure(canonical);
  const index = positions[cards.cursor] === undefined ? target.length : positions[cards.cursor];
  const group = Math.max(0, groups.findIndex((ids) => ids.includes(index)));
  const activeGroup = cards.cursor === positions.length ? groups.length - 1 : group;
  return { index, done: cards.cursor === positions.length, wordNumber: activeGroup + 1, wordCount: groups.length,
    draft: target.slice(0, index),
    cards: (cards.order[activeGroup] || []).map((id) => ({ id, letter: target[id], used: cards.used.includes(id) })),
    cells: Array.from(target, (letter, i) => ({ index: i, value: i < index || !/[a-z0-9]/i.test(letter) ? letter : '', space: letter === ' ', fixed: !/[a-z0-9 ]/i.test(letter), active: i === index })),
  };
}
function tapEnglishCard(canonical, cards, id) {
  const view = englishCardsView(canonical, cards);
  const card = view.cards.find((entry) => entry.id === id && !entry.used);
  if (view.done || !card) return { status: 'ignored' };
  const target = cardTarget(canonical);
  if (card.letter.toLowerCase() !== target[view.index].toLowerCase()) return { status: 'wrong', index: view.index };
  cards.used.push(id); cards.cursor++;
  const next = englishCardsView(canonical, cards);
  return { status: 'correct', index: view.index, letter: target[view.index], draft: next.draft, done: next.done };
}

module.exports = { cardTarget, createEnglishCards, validEnglishCards, englishCardsView, tapEnglishCard };
