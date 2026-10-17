const partners = require('../../lib/partners.js');
const { createStageFx } = require('../../lib/stage-fx.js');
Component({
  properties: { show: { type: Object, value: {}, observer() { this.configureFx(); } }, compact: Boolean, quiet: Boolean, finale: Boolean, previewCat: String, particles: { type: Boolean, value: true } },
  data: { canvasReady: false },
  observers: { 'finale,previewCat,quiet,particles'() { this.configureFx(); } },
  lifetimes: {
    attached() { this.disposed = false; this.createSelectorQuery().select('#effects').fields({ node: true, size: true }).exec(rows => { const r = rows[0]; if (this.disposed || !r || !r.node) return; const info = wx.getWindowInfo ? wx.getWindowInfo() : { pixelRatio: 1 }; this.fx = createStageFx(r.node, r.width, r.height, Math.min(2, info.pixelRatio)); this.setData({ canvasReady: true }); this.configureFx(); }); },
    detached() { this.disposed = true; if (this.fx) this.fx.destroy(); },
  },
  pageLifetimes: { hide() { this.hidden = true; if (this.fx) this.fx.stop(); }, show() { this.hidden = false; if (this.fx) this.fx.start(); } },
  methods: { imageError() { const show = this.properties.show; if (!show.character || !show.character.startsWith('partner-') || show.needsRepair) return; partners.markBroken(show.character, show.characterRevision); this.setData({ 'show.hero': '/assets/guagua/girl-pink-open.png', 'show.wear': '', 'show.wearBack': '', 'show.needsRepair': true, 'show.actors': (show.actors || []).map(actor => actor.src && actor.src.indexOf('/partners-v1/') >= 0 ? { ...actor, src: '/assets/guagua/girl-pink-open.png', wear: '', back: '' } : actor) }); wx.showToast({ title: '伙伴图片需要修复，请在管理伙伴中重新下载', icon: 'none' }); }, configureFx() { if (this.fx) { this.fx.configure(this.properties.show, this.properties.previewCat, this.properties.finale, this.properties.quiet, this.properties.particles); if (this.hidden) this.fx.stop(); } } },
});
