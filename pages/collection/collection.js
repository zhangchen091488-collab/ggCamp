const ul = require('../../shared/unlocks.js');
const { TROPHY } = require('../../shared/trophies.js');
const { createAudio } = require('../../lib/audio.js');
const debug = require('../../lib/debug.js');
const features = require('../../lib/features.js');
const { visual } = require('../../lib/visual.js');
// The trophies the page reads. With the debug switch on, everything counts as earned so every
// variant can be previewed; otherwise it is the real, saved set.
const earned = () => (debug.enabled() ? ul.allTrophies() : getApp().store.state.trophies.got || {});
function thumbnail(item, character) {
  const key = ul.variant(item.id);
  if (item.cat === 'costume' || item.cat === 'color') {
    const color = item.cat === 'color' ? key : 'pink'; const costume = item.cat === 'costume' ? key : 'none';
    return { src: `/assets/guagua/${character}-${color}-open.png`, wear: costume !== 'none' ? `/assets/guagua/wear-${costume}.png` : '', back: costume === 'cape' ? '/assets/guagua/back-cape.png' : '' };
  }
  if (item.cat === 'crowd') return { buddies: visual({ character, crowd: item.id, costume: 'costume:none', color: 'color:pink' }).actors.slice(0, 3) };
  return { src: `/assets/ui/thumb-${item.id.replace(':', '-')}.png` };
}
Page({
  data: { show: {}, cats: ul.CATS, cat: 'bg', intensity: 75, playing: true, debugOn: false, debugAvailable: false },
  onShow() { this.timers = []; if (!this.audio) this.audio = createAudio(wx); debug.load(wx); this.render(true); this.previewMusic(); },
  onHide() { if (this.audio) this.audio.pause(); for (const timer of this.timers || []) clearTimeout(timer); this.timers = []; }, onUnload() { this.stop(); },
  stop() { if (this.audio) this.audio.close(); for (const timer of this.timers || []) clearTimeout(timer); this.timers = []; },
  previewMusic() {
    if (this.data.cat === 'music' && this.data.playing) {
      this.audio.start(getApp().store.state.settings, features.look(getApp().store, () => .01, earned()), this.data.intensity / 100);
      this.setData({ musicPlaying: true }); this.timers.push(setTimeout(() => { this.audio.close(); this.setData({ musicPlaying: false }); }, 7000));
    } else { this.audio.close(); this.setData({ musicPlaying: false }); }
  },
  tab(e) { this.stop(); this.setData({ cat: e.currentTarget.dataset.cat }); this.render(true); this.previewMusic(); },
  intensity(e) { this.setData({ intensity: Number(e.detail.value) }); this.replay(); },
  toggle() { this.setData({ playing: !this.data.playing }); this.stop(); this.render(this.data.playing); this.previewMusic(); },
  replay() { this.stop(); this.setData({ playing: true }); this.render(true); this.previewMusic();
    if (this.data.cat === 'particle') for (const delay of [280, 560]) this.timers.push(setTimeout(() => this.render(true), delay));
  },
  // Debug switch: unlock every collection item so a variant can be checked without earning its
  // trophy. It never touches records or trophies, and turning it off hands back every selection the
  // player has not actually earned — the same rule the load-time migration applies. A released
  // build does not offer the switch at all (`lib/debug.js`), so the handler is a no-op there.
  debugToggle() {
    if (!debug.available()) return;
    const store = getApp().store; const on = debug.set(wx, !debug.enabled());
    if (!on) for (const { key } of ul.CATS) {
      const id = store.state.equip[key];
      if (id !== 'auto' && (!ul.ITEM[id] || !ul.isUnlocked(ul.ITEM[id], store.state.trophies.got))) store.state.equip[key] = 'auto';
    }
    store.save(); this.replay();
  },
  render(animate = false) {
    const store = getApp().store; const got = earned(); const cat = this.data.cat; const equip = store.state.equip; const character = store.state.settings.character || 'girl';
    const rows = [{ id: 'auto', name: '随机搭配', unlocked: true, auto: true, description: '每轮随机选择' }, ...ul.ITEMS.filter(it => it.cat === cat).map(it => ({ ...it, thumb: thumbnail(it, character), unlocked: ul.isUnlocked(it, got), description: ul.isUnlocked(it, got) ? '' : `奖杯「${TROPHY[it.trophy].name}」` }))].map(it => ({ ...it, selected: (equip[cat] || 'auto') === it.id }));
    const look = features.look(store, () => .01, got); if (animate) this.burst = (this.burst || 0) + 1;
    const cats = ul.CATS.map(c => ({ ...c, own: ul.ITEMS.filter(it => it.cat === c.key && ul.isUnlocked(it, got)).length, total: ul.ITEMS.filter(it => it.cat === c.key).length }));
    this.setData({ rows, cats, debugOn: debug.enabled(), debugAvailable: debug.available(), show: visual(look, 'happy', this.data.intensity / 100, this.burst || 0, this.data.playing ? store.state.settings.motion : 0), owned: ul.ITEMS.filter(it => ul.isUnlocked(it, got)).length, total: ul.ITEMS.length, previewName: ul.ITEM[look[cat]] ? ul.ITEM[look[cat]].name : '', auto: equip[cat] === 'auto' });
  },
  select(e) {
    const id = e.currentTarget.dataset.id; const store = getApp().store;
    if (id !== 'auto' && (!ul.ITEM[id] || !ul.isUnlocked(ul.ITEM[id], earned()))) { wx.showToast({ title: '获得对应奖杯后就能解锁', icon: 'none' }); return; }
    store.state.equip[this.data.cat] = id; store.save(); this.replay();
  },
});
