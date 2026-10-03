// DOM-only choreography: sample trajectories once, then let CSS play them.
// No animation loop, Canvas access, or changes to the shared particle renderer.
const COLORS = ['#ff7ab6', '#ffd23f', '#3fdcb0', '#8faaff', '#b793ff'];
// Mirrors `THEME_INIT` / `THEME_DRAW` in the canvas renderer (app/js/particles.js) so an unlocked
// 彩纸 reads the same whether the celebration runs on Canvas 2D or falls back to DOM + WXSS
// keyframes. The canvas gets this for free from drawn sprites and per-particle physics; here the
// theme has to carry it explicitly, because swapping a few text glyphs inside a shared rainbow is
// far too easy to miss.
//   symbols  text stand-in for the drawn sprite (empty when the WXSS class draws the shape)
//   colors   the theme palette, replacing the shared confetti rainbow
//   gravity  multiplier on the ballistic pull; 0 keeps a piece on its initial heading
//   life     multiplier on the flight time
//   spin     multiplier on the tumble speed; 0 freezes the piece upright
//   size     [min, max] glyph size in px
//   speed    multiplier on the launch speed (bubbles drift instead of exploding)
//   rise     the theme only travels upwards; the launch heading is rebuilt instead of fanned
const THEMES = {
  note: { symbols: ['♪', '♫'], colors: ['#ff7ab6', '#3b6bff', '#ffd23f', '#3fdcb0', '#a77bff'], gravity: .75, life: 1, spin: .85, size: [11, 21] },
  petal: { symbols: ['❀', '✿'], colors: ['#ffc2d9', '#ff9ccc', '#ffe3ef', '#ffffff'], gravity: .45, life: 1.7, spin: .3, size: [11, 23] },
  digit: { symbols: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'], colors: ['#ff7ab6', '#3b6bff', '#ffd23f', '#3fdcb0', '#a77bff'], gravity: 1.15, life: 1, spin: 1.2, size: [11, 22] },
  candy: { symbols: ['◆', '●'], colors: ['#ff7ab6', '#ffd23f', '#3fdcb0', '#8fb4ff', '#ff9a3c'], gravity: 1, life: .95, spin: .6, size: [12, 23] },
  bubble: { symbols: [], colors: ['#bfeaff', '#d9f7ff', '#c8d7ff'], gravity: 0, life: 1.4, spin: 0, size: [10, 27], speed: .5, rise: true },
};
// Each finale also reshapes the confetti layer, so the four variants stay tellable apart even when
// the hero choreography is small on screen. `accent` tints the finale glow, rings and stamp.
const FINALES = {
  classic: { accent: '#ffd23f', burst: 56, rain: 36, streamers: 8, waves: 3 },
  fireworks: { accent: '#8faaff', burst: 64, rain: 0, streamers: 0, waves: 5 },
  rocket: { accent: '#ff7ab6', burst: 40, rain: 0, streamers: 12, waves: 3 },
  parade: { accent: '#3fdcb0', burst: 48, rain: 14, streamers: 10, waves: 3 },
};
const px = n => `${Math.round(n)}px`;
function buildDomCelebration(show, mode, key, window = {}, random = Math.random) {
  const width = window.windowWidth || 375; const height = window.windowHeight || 700;
  const motion = Math.max(0, Math.min(1, show.motionScale == null ? 1 : show.motionScale));
  const count = n => Math.round(n * (.15 + .85 * motion));
  const range = (a, b) => a + (b - a) * random();
  const bits = []; const rings = []; const finale = show.finale || 'classic';
  const theme = THEMES[show.particle] ? show.particle : ''; const strength = Math.max(0, Math.min(1, show.strength || 0));
  const final = mode === 'finale'; const amplitude = .45 + .55 * motion;
  const spec = final ? FINALES[finale] || FINALES.classic : null;
  function piece(kind, x, y, vx, vy, gravity, delay, life, layer, themed = true) {
    const i = bits.length;
    // The theme owns the confetti vocabulary: paper, stars and coins all become its glyph, so an
    // unlocked 彩纸 is unmistakable instead of a few pieces lost in a shared rainbow.
    const pick = themed && theme && kind !== 'spark' && kind !== 'streamer' && kind !== 'mini' && random() < .8 ? THEMES[theme] : null;
    const shape = pick ? theme : kind; const palette = pick ? pick.colors : COLORS;
    const color = palette[i % palette.length];
    let symbol = ''; let src = '';
    if (pick) { if (pick.symbols.length) symbol = pick.symbols[i % pick.symbols.length]; }
    else if (shape === 'star') symbol = '★';
    if (shape === 'mini') { const a = (show.actors || [])[i % Math.max(1, (show.actors || []).length)]; src = a ? a.src : show.hero; }
    const size = shape === 'mini' ? range(24, 35) : shape === 'streamer' ? range(5, 8) : shape === 'spark' ? range(3, 5) : range(...(pick ? pick.size : [8, 18]));
    const pull = gravity * (pick ? pick.gravity : 1); const span = Math.round(life * (pick ? pick.life : 1));
    let style = `left:${px(x)};top:${px(y)};z-index:${layer};color:${color};--color:${color};--size:${px(size)};--life:${span}ms;--delay:${delay}ms;--spin:${Math.round(range(380, 850) * (pick ? pick.spin : 1))}ms;--turn:${i % 2 ? '-' : ''}360deg;`;
    // Piecewise ballistic path: decelerating ascent, apex, then accelerating descent.
    for (let step = 1; step <= 5; step++) {
      const t = span / 1000 * step / 5;
      style += `--x${step}:${px(vx * t * amplitude)};--y${step}:${px((vy * t + pull * t * t / 2) * amplitude)};`;
    }
    bits.push({ id: `${key}-${i}`, kind, shape, symbol, src, still: !!pick && !pick.spin, style });
  }
  function burst(x, y, n, delay = 0, layer = 3, spark = false) {
    const spec = theme ? THEMES[theme] : null;
    const speed = spec && spec.speed ? spec.speed : 1;
    for (let i = 0; i < count(n); i++) {
      const angle = range(-Math.PI, Math.PI); const launch = range(width * .3, width * 1.25) * speed;
      // 泡泡 rise: the canvas theme leans on negative gravity plus heavy drag; with only keyframes
      // available here the upward heading is rebuilt from the angle instead, so no bubble sinks.
      const climb = spec && spec.rise ? -(height * .12 + Math.abs(Math.sin(angle)) * height * .3)
        : Math.sin(angle) * launch - height * .36;
      const kinds = ['paper', 'paper', 'star', 'coin'];
      piece(spark ? 'spark' : kinds[i % kinds.length], x, y, Math.cos(angle) * launch,
        climb, height * 1.35, delay + Math.round(range(0, 65)), Math.round(range(1150, 2000)), layer, !spark);
    }
  }
  burst(width / 2, height * .4, final ? spec.burst : 28 + strength * 36);
  const rain = final ? spec.rain : strength > .6 ? 20 : 0; const streamers = final ? spec.streamers : strength > .6 ? 5 : 0;
  // 泡泡 rise: a rising theme seeds its rain at the bottom and drifts up, the way the canvas
  // theme does with negative gravity, instead of raining down like the confetti themes.
  const rising = !!theme && THEMES[theme].rise;
  for (let i = 0; i < count(rain); i++) {
    const kind = i % 11 === 0 ? 'mini' : i % 7 === 0 ? 'star' : 'paper';
    piece(kind, range(0, width), rising ? height + range(12, 80) : -range(12, 80), range(-45, 45),
      rising ? -height * .24 : height * .24, height * .26,
      Math.round(range(0, final ? 800 : 250)), Math.round(range(1900, 2650)), 1);
  }
  for (let i = 0; i < count(streamers); i++) piece('streamer', range(0, width), height * .8,
    range(-width * .24, width * .24), -height * .88, height * .75, i * 35, 2300, 3, false);
  if (final) {
    for (let wave = 0; wave < spec.waves; wave++) {
      const x = width * (.18 + (wave % 3) * .32); const y = height * (.17 + wave % 2 * .15);
      burst(x, y, 10, wave * 260, 1, true);
      rings.push({ id: wave, style: `left:${px(x)};top:${px(y)};--color:${COLORS[wave % COLORS.length]};--delay:${wave * 260}ms;--diameter:${px(width * .35)};` });
    }
  }
  const entrance = finale === 'rocket' ? 1400 : finale === 'parade' ? 2300 : 0;
  const stampAt = finale === 'fireworks' ? 1300 : entrance || 700;
  const heroSize = finale === 'fireworks' ? width * .38 : Math.min(width * .7, height * .38);
  const hero = { src: show.hero, wear: show.wear, back: show.wearBack,
    style: `left:${px(width / 2)};top:${px(height * (finale === 'fireworks' ? .75 : .9) - heroSize * 1.4)};width:${px(heroSize)};height:${px(heroSize * 1.4)};--enter:${entrance}ms;--hop:${px(28 * motion)};` };
  const buddies = (show.actors || []).map((actor, i) => ({ ...actor,
    style: `left:${px(width * (.12 + i * .25))};top:${px(height * .96 - width * .17 * 1.4)};width:${px(width * .17)};height:${px(width * .17 * 1.4)};--enter:${entrance}ms;--phase:${-i * 180}ms;--hop:${px(15 * motion)};` }));
  const orbit = Array.from({ length: 12 }, (_, i) => {
    const angle = i * Math.PI / 6; const actor = (show.actors || [])[i % Math.max(1, (show.actors || []).length)] || hero;
    return { ...actor, id: i, style: `left:${px(width / 2 + Math.cos(angle) * width * .34)};top:${px(height * .48 + Math.sin(angle) * height * .18 - width * .16 * 1.4)};width:${px(width * .16)};height:${px(width * .16 * 1.4)};--phase:${-i * 100}ms;--hop:${px(12 * motion)};` };
  });
  const paradeSize = Math.min(82, width * .2); const gap = paradeSize * .82; const span = width + gap * 9 + 160;
  const parade = Array.from({ length: 9 }, (_, i) => {
    const actor = i === 4 ? hero : (show.actors || [])[i % Math.max(1, (show.actors || []).length)] || hero;
    const size = paradeSize * (i === 4 ? 1.3 : 1);
    return { ...actor, id: i, leader: i === 4, style: `left:0;top:${px(height * .68 - size * 1.4)};width:${px(size)};height:${px(size * 1.4)};--from:${px(-80 - i * gap)};--to:${px(-80 - i * gap + span)};--phase:${-i * 100}ms;--hop:${px(18 * motion)};` };
  });
  let rocketStyle = '';
  for (let step = 0; step <= 4; step++) {
    const k = step / 4; const smooth = k < .5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2;
    rocketStyle += `--rx${step}:${px(-140 + (width + 280) * smooth - 95)};--ry${step}:${px(height * (.85 - .73 * smooth) - Math.sin(smooth * Math.PI) * height * .15 - 60)};`;
  }
  const accent = (spec || FINALES.classic).accent;
  return { bits: bits.slice(0, 160), finale, dom: { key, final, rings, hero, buddies, orbit, parade, rocketStyle,
    style: `--stamp-delay:${stampAt}ms;--stamp-size:${px(Math.min(width * .14, 65))};--accent:${accent};` } };
}
module.exports = { buildDomCelebration, THEMES, FINALES };
