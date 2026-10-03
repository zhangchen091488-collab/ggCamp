// Full viewport choreography. Both platforms use the web particle physics and shapes.
const { FX } = require('../shared/particles.js');
const DURATIONS = { classic: 3.6, fireworks: 3.1, rocket: 2.9, parade: 3.3 };
const lerp = (a, b, k) => a + (b - a) * k;
const clamp = n => Math.max(0, Math.min(1, n));
function createCelebration(canvas, width, height, dpr = 1, complete = () => {}) {
  const viewport = () => ({ width, height, dpr });
  const back = new FX(canvas, 400, { viewport, spriteReady: () => true });
  const front = new FX(canvas, 280, { viewport, spriteReady: () => true });
  const ctx = canvas.getContext('2d'); const images = new Map();
  let show = {}; let mode = ''; let label = ''; let key = ''; let time = 0;
  let frame = 0; let last = null; let active = false; let hidden = false; let disposed = false;
  let generation = 0; let loaded = false; let events = []; let eventIndex = 0; let stampAt = Infinity;
  function load(src) {
    if (!src || images.has(src)) return images.has(src) ? images.get(src).promise : Promise.resolve();
    const image = canvas.createImage(); const entry = { image, ready: false };
    entry.promise = new Promise(resolve => {
      image.onload = () => { entry.ready = true; resolve(); };
      image.onerror = () => resolve();
    });
    images.set(src, entry); image.src = src; return entry.promise;
  }
  function drawImage(src, x, y, w, h) {
    const entry = images.get(src); if (!entry || !entry.ready) return;
    const scale = Math.min(w / entry.image.width, h / entry.image.height);
    const iw = entry.image.width * scale; const ih = entry.image.height * scale;
    ctx.drawImage(entry.image, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
  }
  function actor(actor, x, feet, size, angle = 0) {
    ctx.save(); ctx.translate(x, feet); ctx.rotate(angle);
    drawImage(actor.back, -size / 2, -size * 1.4, size, size * 1.4);
    drawImage(actor.src, -size / 2, -size * 1.4, size, size * 1.4);
    drawImage(actor.wear, -size / 2, -size * 1.4, size, size * 1.4); ctx.restore();
  }
  function stamp(text, x, y, size) {
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `900 ${size}px sans-serif`; ctx.lineJoin = 'round'; ctx.lineWidth = size * .17;
    ctx.strokeStyle = '#20234f'; ctx.strokeText(text, x, y);
    ctx.fillStyle = '#ffd23f'; ctx.fillText(text, x, y); ctx.restore();
  }
  function rain(n = 70) { back.rain(width, n, { kinds: ['confetti', 'confetti', 'mini', 'star', 'coin'] }); }
  function fireworks(n = 6) { back.fireworks(width, height, n, .06, .45); }
  function plan() {
    const style = DURATIONS[show.finale] ? show.finale : 'classic';
    events = [{ at: 0, run() {
      fireworks(style === 'classic' ? 10 : 6); rain(); front.streamers(width, height, 12);
      front.burst(width / 2, height * .4, { count: 70, speed: 900, kinds: ['confetti', 'star', 'spark', 'coin', 'mini'], up: 300, life: .7 });
    } }];
    stampAt = style === 'rocket' ? 1.4 : style === 'parade' ? 2.3 : style === 'fireworks' ? 1.3 : .7;
    if (style === 'fireworks') for (let i = 1; i < 5; i++) events.push({ at: i * .26, run: () => fireworks(5 + i) });
    events.push({ at: stampAt, run() { fireworks(6); front.ring(width / 2, height * .32, { color: '#ffd23f', radius: width * .45, width: 8 }); } });
    events.sort((a, b) => a.at - b.at);
  }
  function actors() {
    if (mode !== 'finale') return;
    const hero = { src: show.hero, wear: show.wear, back: show.wearBack };
    const style = DURATIONS[show.finale] ? show.finale : 'classic';
    const buddies = show.actors || [];
    if (style === 'rocket' && time < 1.4) {
      const k = clamp(time / 1.4); const smooth = k < .5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2;
      const x = lerp(-140, width + 140, smooth);
      const y = lerp(height * .85, height * .12, smooth) - Math.sin(smooth * Math.PI) * height * .15;
      ctx.save(); ctx.translate(x, y); ctx.rotate(-.5);
      drawImage('/assets/ui/rocket.png', -95, -60, 190, 120); ctx.restore();
      actor(hero, x - 6, y - 12, Math.min(125, width * .32), -.15);
    } else if (style === 'parade' && time < 2.3) {
      const size = Math.min(82, width * .2); const gap = size * .82; const span = width + gap * 9 + 160;
      for (let i = 0; i < 9; i++) {
        const a = i === 4 ? hero : buddies[i % Math.max(1, buddies.length)] || hero;
        const x = -80 - i * gap + span * clamp(time / 2.3);
        actor(a, x, height * .68 - Math.abs(Math.sin(time * 11 + i)) * 18, i === 4 ? size * 1.3 : size);
        if (i === 4) stamp(label, x, height * .68 - size * 2, 28);
      }
    } else if (style === 'fireworks') {
      for (let i = 0; i < 12; i++) {
        const a = i * Math.PI / 6;
        actor(buddies[i % Math.max(1, buddies.length)] || hero, width / 2 + Math.cos(a) * width * .34,
          height * .48 + Math.sin(a) * height * .18, width * .16, Math.sin(time * 5 + i) * .08);
      }
      actor(hero, width / 2, height * .75 - Math.abs(Math.sin(time * 5)) * 18, width * .38);
    } else {
      const k = 1 - (1 - clamp(time / .7)) ** 3;
      const size = Math.min(width * .7, height * .38);
      actor(hero, width / 2, lerp(height + size * 1.4, height * .9, k) - (time > .7 ? Math.abs(Math.sin((time - .7) * 6)) * 28 : 0), size, Math.sin(time * 8) * .06);
      buddies.forEach((a, i) => actor(a, width * (.12 + i * .25), height * .96 - Math.abs(Math.sin(time * 6 + i)) * 15, width * .17));
    }
  }
  function paint() {
    back.draw(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalAlpha = 1; actors(); front.draw(false);
    if (mode === 'finale' && time >= stampAt) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const k = clamp((time - stampAt) / .25); stamp(label, width / 2, height * .24, Math.min(width * .14, 65) * (.6 + .4 * k));
    }
  }
  function stop() { if (frame) canvas.cancelAnimationFrame(frame); frame = 0; last = null; }
  function tick(stampTime) {
    if (!active || hidden || disposed) return;
    const dt = last === null ? 0 : Math.min(.05, Math.max(0, (stampTime - last) / 1000)); last = stampTime; time += dt;
    while (eventIndex < events.length && time >= events[eventIndex].at) events[eventIndex++].run();
    if (mode === 'finale' && show.finale === 'rocket' && time < 1.4) front.burst(lerp(-140, width + 140, clamp(time / 1.4)), height * ( .85 - .73 * clamp(time / 1.4)), { count: 3, kinds: ['star', 'spark'], speed: 180, up: -40 });
    back.update(dt); front.update(dt); paint();
    const duration = mode === 'finale' ? DURATIONS[show.finale] || DURATIONS.classic : 2.8;
    if (time >= duration) { active = false; stop(); ctx.clearRect(0, 0, canvas.width, canvas.height); complete(); }
    else frame = canvas.requestAnimationFrame(tick);
  }
  function start() { if (!active || hidden || disposed || !loaded || frame) return; last = null; frame = canvas.requestAnimationFrame(tick); }
  return {
    configure(value, nextMode = 'burst', text = '100分') {
      if (!value || !value.hero || disposed) return;
      const nextKey = `${nextMode}:${value.burst}:${value.finale}`;
      if (!value.motion || !nextMode) { generation++; active = false; key = ''; stop(); back.parts = []; front.parts = []; back.draw(); if (nextMode === 'finale') complete(); return; }
      if (!value.burst || nextKey === key) return;
      stop(); const token = ++generation; key = nextKey; show = value; mode = nextMode; label = text;
      active = true; loaded = false; time = 0; eventIndex = 0; stampAt = Infinity; back.parts = []; front.parts = [];
      back.cache.clear(); front.cache.clear(); ctx.clearRect(0, 0, canvas.width, canvas.height);
      back.motion = front.motion = value.motionScale == null ? 1 : value.motionScale; back.theme = front.theme = value.particle;
      if (mode === 'finale') plan();
      else events = [{ at: 0, run() {
        front.burst(width / 2, height * .4, { count: 24 + 80 * (show.strength || 0), speed: 500 + 500 * (show.strength || 0), up: 250, kinds: ['confetti', 'star', 'coin'], life: .8 });
        if (show.strength > .6) { rain(50); front.streamers(width, height, 5); }
      } }];
      const sources = [value.hero, value.wear, value.wearBack, '/assets/ui/rocket.png', ...(value.actors || []).flatMap(a => [a.src, a.wear, a.back])];
      Promise.all(sources.map(load)).then(() => {
        if (disposed || token !== generation) return;
        back.sprites = front.sprites = (value.actors || []).map(a => images.get(a.src)).filter(e => e && e.ready).map(e => e.image);
        loaded = true; start();
      });
    },
    pause() { hidden = true; stop(); },
    resume() { hidden = false; start(); },
    destroy() { disposed = true; generation++; active = false; stop(); back.parts = []; front.parts = []; images.clear(); },
  };
}
module.exports = { createCelebration, DURATIONS };
