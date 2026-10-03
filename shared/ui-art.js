// Generated from app/js/ui-art.js by tools/build_miniprogram.mjs. Do not edit.
// Shared hand-cut paper graphics for web and native exports.
const stampSvg = (score) => {
  const gold = score > 100;
  const col = gold ? '#ffb000' : '#ff4f6d';
  return `<svg viewBox="-20 -20 40 40" aria-hidden="true"><path d="M-2 -15 C10 -16 16 -6 14 4 C12 13 1 17 -8 13 C-16 9 -16 -4 -8 -11 C-3 -15 5 -14 9 -10" fill="none" stroke="${col}" stroke-width="3" stroke-linecap="round"/>${gold ? '<path d="M0 -19 l2 4 4 .5 -3 3 .8 4 -3.8 -2 -3.8 2 .8 -4 -3 -3 4 -.5z" fill="#ffd23f" stroke="#1b1d4d" stroke-width="1"/>' : ''}</svg>`;
};
function stickerSvg(type) {
  const k = '#1b1d4d';
  const shapes = {
    star: `<path d="M0 -17 L5 -6 L17 -5 L8 3 L11 15 L0 9 L-11 15 L-8 3 L-17 -5 L-5 -6Z" fill="#ffd23f" stroke="${k}" stroke-width="2.5" stroke-linejoin="round"/>`,
    heart: `<path d="M0 15 C-20 2 -15 -14 -6 -13 C-2 -13 0 -9 0 -7 C0 -9 2 -13 6 -13 C15 -14 20 2 0 15Z" fill="#ff7ab6" stroke="${k}" stroke-width="2.5"/>`,
    flower: `${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-9" rx="6.5" ry="9" transform="rotate(${a})" fill="#8fb4ff" stroke="${k}" stroke-width="2.2"/>`).join('')}<circle r="6" fill="#ffd23f" stroke="${k}" stroke-width="2.2"/>`,
    note: `<path d="M-4 9 V-13 L12 -16 V5" fill="none" stroke="${k}" stroke-width="3.5" stroke-linejoin="round"/><ellipse cx="-9" cy="10" rx="6.5" ry="5" fill="#3fdcb0" stroke="${k}" stroke-width="2.5"/><ellipse cx="7" cy="6" rx="6.5" ry="5" fill="#3fdcb0" stroke="${k}" stroke-width="2.5"/>`,
    clover: `${[0, 90, 180, 270].map((a) => `<circle cx="0" cy="-7.5" r="7" transform="rotate(${a})" fill="#6fd66f" stroke="${k}" stroke-width="2.2"/>`).join('')}<path d="M2 6 Q6 12 5 17" stroke="${k}" stroke-width="2.5" fill="none"/>`,
    hanamaru: `<path d="M-2 -15 C10 -16 16 -6 14 4 C12 13 1 17 -8 13 C-16 9 -16 -4 -8 -11 C-3 -15 5 -14 9 -10" fill="none" stroke="#ff4f6d" stroke-width="3.5" stroke-linecap="round"/><path d="M-6 -1 Q0 -9 6 -1 Q0 7 -6 -1Z" fill="#ffb3d6" stroke="#ff4f6d" stroke-width="2"/>`,
    crown: `<path d="M-15 10 L-17 -10 L-8 -4 L0 -16 L8 -4 L17 -10 L15 10Z" fill="#ffd23f" stroke="${k}" stroke-width="2.5" stroke-linejoin="round"/><path d="M-13 14 H13" stroke="${k}" stroke-width="3"/><circle cy="3" r="3" fill="#ff7ab6" stroke="${k}" stroke-width="1.5"/>`,
  };
  return `<svg viewBox="-20 -20 40 40" aria-hidden="true">${shapes[type] || shapes.star}</svg>`;
}

const HAMMER_SVG = `<svg viewBox="0 0 100 100" aria-hidden="true"><g stroke="#1b1d4d" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"><path d="M44.5 40 L55.5 40 L57 97 L43 97Z" fill="#3b6bff"/><path d="M44 60 L56 57 M44 74 L56 71 M44 88 L56 85" fill="none" stroke-width="2.6"/><rect x="13" y="12" width="74" height="30" rx="13" fill="#ff7ab6"/><rect x="5" y="8" width="15" height="38" rx="6" fill="#ffd23f"/><rect x="80" y="8" width="15" height="38" rx="6" fill="#ffd23f"/><path d="M28 20 Q50 15 72 20" fill="none" stroke="#fff" stroke-width="3" opacity=".85"/></g></svg>`;
const UI_ICONS = {settings: '<svg viewBox="-16 -16 32 32" aria-hidden="true"><circle r="10.6" fill="none" stroke="#1b1d4d" stroke-width="9" stroke-dasharray="4.2 4.12"/><circle r="10.6" fill="#ffd23f" stroke="#1b1d4d" stroke-width="2.4"/><circle r="4.4" fill="#fff" stroke="#1b1d4d" stroke-width="2.4"/></svg>', guide: '<svg viewBox="-16 -16 32 32" aria-hidden="true"><path d="M-6 -4 C-6 -7 -3 -9 0 -9 C3 -9 6 -7 6 -4 C6 -1 0 0 0 3 M0 9v.01" fill="none" stroke="#1b1d4d" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'};

UI_ICONS.hint = UI_ICONS.guide.replaceAll('#1b1d4d', '#3b6bff');

function markSvg(kind = 'hanamaru') {
  const stroke = '#1b1d4d';
  const shapes = {
    hanamaru: '<path d="M-2 -15 C10 -16 16 -6 14 4 C12 13 1 17 -8 13 C-16 9 -16 -4 -8 -11 C-3 -15 5 -14 9 -10" fill="none" stroke="#ff4f6d" stroke-width="3" stroke-linecap="round"/>',
    stamp: `<g transform="rotate(-12)"><rect x="-18" y="-12" width="36" height="24" rx="3" fill="#fff0f6" stroke="#ff4f6d" stroke-width="2.5"/><text y="4.5" text-anchor="middle" font-family="PingFang SC" font-weight="900" font-size="13" fill="#ff4f6d">答对</text></g>`,
    medal: `<path d="M-9 -5 L-13 -18 L-1 -14 L3 -18 L10 -5" fill="#ff7ab6" stroke="${stroke}" stroke-width="2"/><circle cy="4" r="12" fill="#ffd23f" stroke="${stroke}" stroke-width="2"/><path d="M0 -3 L2 2 L7 2 L3 5 L5 10 L0 7 L-5 10 L-3 5 L-7 2 L-2 2Z" fill="#fff3c4" stroke="#d98e25"/>`,
    crown: stickerSvg('crown').replace(/^<svg[^>]*>|<\/svg>$/g, ''),
    ring: Array.from({ length: 12 }, (_, i) => `<path d="M0 -15 L0 -20" stroke="${i % 2 ? '#ff7ab6' : '#ffd23f'}" stroke-width="3" stroke-linecap="round" transform="rotate(${i * 30})"/>`).join('') + '<circle r="11" fill="none" stroke="#ff4f6d" stroke-width="2.5"/>',
    // 小乌龟 (the slow-and-steady mark): legs behind, head in front of the shell.
    turtle: `<g stroke="${stroke}" stroke-width="2.2" stroke-linejoin="round"><ellipse cx="-12.5" cy="-7.5" rx="4.4" ry="3.1" transform="rotate(-35 -12.5 -7.5)" fill="#6fd66f"/><ellipse cx="12.5" cy="-7.5" rx="4.4" ry="3.1" transform="rotate(35 12.5 -7.5)" fill="#6fd66f"/><ellipse cx="-12.5" cy="7.5" rx="4.4" ry="3.1" transform="rotate(35 -12.5 7.5)" fill="#6fd66f"/><ellipse cx="12.5" cy="7.5" rx="4.4" ry="3.1" transform="rotate(-35 12.5 7.5)" fill="#6fd66f"/><ellipse cy="1" rx="12.5" ry="10.5" fill="#6fd66f"/><path d="M0 -5.6 L5.8 -2.3 L5.8 4.3 L0 7.6 L-5.8 4.3 L-5.8 -2.3Z" fill="#fff3c4"/><circle cy="-13.4" r="5.9" fill="#6fd66f"/><circle cx="-2.1" cy="-14.6" r="1.35" fill="${stroke}" stroke="none"/><circle cx="2.1" cy="-14.6" r="1.35" fill="${stroke}" stroke="none"/><path d="M-1.8 -11.6 Q0 -10.3 1.8 -11.6" fill="none" stroke-width="1.4" stroke-linecap="round"/></g>`,
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-23 -23 46 46">${shapes[kind] || shapes.hanamaru}</svg>`;
}
function collectionThumbSvg(cat, kind) {
  if (cat === 'mark') return markSvg(kind);
  const bg = { classic: ['#fff8ec', '#ffe285'], night: ['#191b49', '#8eb4ff'], sea: ['#d6f8fb', '#3cbddc'], festival: ['#ffe4c9', '#ef7d95'], paper: ['#e7ebff', '#aa9be2'], space: ['#1b1542', '#ad82e9'] };
  let drawing = '';
  if (cat === 'bg') {
    const [base, accent] = bg[kind] || bg.classic;
    drawing = `<rect x="-20" y="-20" width="40" height="40" rx="5" fill="${base}"/>` + Array.from({ length: 7 }, (_, i) => `<path d="M0 0 L-3 -28 L5 -28Z" transform="rotate(${i * 52})" fill="${accent}" opacity=".65"/>`).join('');
    if (kind === 'sea') drawing += '<g fill="none" stroke="#fff" stroke-width="1.5"><circle cx="-10" cy="-5" r="5"/><circle cx="9" cy="8" r="7"/></g>';
    if (kind === 'night' || kind === 'space') drawing += '<path d="M0 -12 L2 -7 L7 -7 L3 -3 L5 2 L0 -1 L-5 2 L-3 -3 L-7 -7 L-2 -7Z" fill="#ffd23f"/>';
  } else if (cat === 'music') {
    const col = { classic: '#3fdcb0', chip: '#8fb4ff', matsuri: '#ff4f6d', brass: '#ffd23f', electro: '#a77bff' }[kind];
    drawing = `<path d="M-6 10 V-14 L12 -18 V6" fill="none" stroke="#1b1d4d" stroke-width="3" stroke-linejoin="round"/><ellipse cx="-11" cy="11" rx="6.5" ry="5" fill="${col}" stroke="#1b1d4d" stroke-width="2"/><ellipse cx="7" cy="7" rx="6.5" ry="5" fill="${col}" stroke="#1b1d4d" stroke-width="2"/>`;
  } else if (cat === 'particle') {
    const glyph = { classic: '▰', note: '♫', petal: '✿', digit: '7', bubble: '○', candy: '◆' }[kind];
    drawing = [-11, 0, 11].map((x, i) => `<text x="${x}" y="${i === 1 ? -3 : 12}" text-anchor="middle" font-family="Arial" font-size="17" font-weight="900" fill="${['#ff7ab6', '#ffd23f', '#3b6bff'][i]}" stroke="#1b1d4d" stroke-width=".5">${glyph}</text>`).join('');
  } else if (cat === 'finale') {
    if (kind === 'rocket') drawing = '<g transform="rotate(30)"><path d="M-7 10 Q-10 -9 0 -18 Q10 -9 7 10Z" fill="#fff9ee" stroke="#1b1d4d" stroke-width="2"/><circle cy="-3" r="4" fill="#8fb4ff" stroke="#1b1d4d"/><path d="M-5 11 L0 20 L5 11" fill="#ffd23f" stroke="#ff4f6d" stroke-width="2"/></g>';
    else if (kind === 'parade') drawing = '<rect x="-16" y="-10" width="32" height="16" rx="4" fill="#ff7ab6" stroke="#1b1d4d" stroke-width="2"/><circle cx="-10" cy="12" r="5" fill="#8fb4ff" stroke="#1b1d4d"/><circle cx="10" cy="12" r="5" fill="#ffd23f" stroke="#1b1d4d"/>';
    else drawing = Array.from({ length: 9 }, (_, i) => `<path d="M0 -7 V-19" transform="rotate(${i * 40})" stroke="${['#ff4f6d', '#ffd23f', '#3b6bff'][i % 3]}" stroke-width="3" stroke-linecap="round"/>`).join('');
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-23 -23 46 46">${drawing}</svg>`;
}

const ROCKET_SVG = '<svg viewBox="-60 -40 120 80"><g stroke="#1b1d4d" stroke-width="4" stroke-linejoin="round"><path d="M-40 -14 L-58 -30 L-50 0 L-58 30 L-40 14Z" fill="#ff4f6d"/><path d="M-44 -16 Q10 -30 50 0 Q10 30 -44 16Z" fill="#fff"/><path d="M30 -10 Q46 -4 50 0 Q46 4 30 10Z" fill="#ff7ab6"/><circle cx="10" cy="0" r="9" fill="#8fd3ff"/><path d="M-20 16 L-34 34 L-6 18Z" fill="#3b6bff"/></g></svg>';

module.exports = { stampSvg, stickerSvg, HAMMER_SVG, UI_ICONS, markSvg, collectionThumbSvg, ROCKET_SVG };
