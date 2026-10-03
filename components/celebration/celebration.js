const { createCelebration, DURATIONS } = require('../../lib/celebration.js');
const { isNativeContainer } = require('../../lib/platform.js');
const { buildDomCelebration } = require('../../lib/celebration-dom.js');
// 多端容器的原生渲染层不响应 `<canvas type="2d">` 的 `fields({ node: true })` 查询，而 DOM + WXSS
// 关键帧在同一容器上正常。但「多端容器」并不等于「不支持 Canvas 2D」——模拟器等宿主能正常返回
// 画布节点。所以这里不按平台决定用哪条路径，改成**能力探测**：真拿到节点就用 Canvas 2D，只有确实
// 拿不到才退到 DOM 彩纸层。平台判断只用来决定「等多久」，不再决定「用哪条」。
// 查询既不回调也不返回节点时必须有个截止时间，否则首帧永远不来。容器上大概率拿不到节点，等短一点
// 让 DOM 彩纸尽快出现；其他宿主给布局留足时间。
const PROBE_NATIVE_MS = 200;
const PROBE_MS = 600;
Component({
  properties: { show: Object, mode: { type: String, value: 'burst' }, label: { type: String, value: '100分' } },
  data: { fallback: false, bits: [], scenes: [], paused: false, finale: 'classic' },
  observers: { 'show,mode,label'() { this.configure(); } },
  lifetimes: {
    attached() {
      this.disposed = false; this.key = ''; this.remaining = 0;
      this.probe();
    },
    // `attached` 时布局可能还没完成，节点查询会落空；`ready` 是官方推荐的节点查询时机。这里再探一次，
    // 而不是在第一次落空时就永久降级——那正是之前把小程序误判成「不支持 canvas」的原因。
    ready() { this.probe(); },
    detached() { this.disposed = true; clearTimeout(this.probeTimer); clearTimeout(this.fallbackTimer); if (this.fx) this.fx.destroy(); },
  },
  pageLifetimes: {
    hide() {
      this.hidden = true;
      if (this.fx) { this.fx.pause(); return; }
      if (this.isFallback) this.setData({ paused: true });
      if (this.fallbackTimer) { this.remaining -= Date.now() - this.startedAt; clearTimeout(this.fallbackTimer); this.fallbackTimer = null; }
    },
    show() {
      this.hidden = false;
      if (this.fx) { this.fx.resume(); return; }
      if (this.isFallback) this.setData({ paused: false });
      if (this.isFallback && this.remaining > 0 && !this.fallbackTimer) this.schedule();
    },
  },
  methods: {
    // 能力探测：拿到画布节点就走 Canvas 2D，落空不算失败（可能是布局没完成），只有到截止时间还没拿到
    // 才退到 DOM 彩纸层。
    probe() {
      if (this.disposed || this.fx || this.isFallback) return;
      clearTimeout(this.probeTimer);
      this.createSelectorQuery().select('#celebration-canvas').fields({ node: true, size: true }).exec(rows => {
        if (this.disposed || this.fx || this.isFallback) return;
        const r = rows && rows[0];
        if (!r || !r.node) return;
        this.useCanvas(r);
      });
      const wait = isNativeContainer(wx) ? PROBE_NATIVE_MS : PROBE_MS;
      this.probeTimer = setTimeout(() => { this.probeTimer = null; if (!this.disposed && !this.fx) this.useFallback(); }, wait);
    },
    useCanvas(r) {
      clearTimeout(this.probeTimer); this.probeTimer = null;
      const info = wx.getWindowInfo ? wx.getWindowInfo() : { pixelRatio: 1 };
      try {
        this.fx = createCelebration(r.node, r.width, r.height, Math.min(2, info.pixelRatio || 1), () => this.triggerEvent('complete'));
        this.configure();
      } catch (error) { console.warn('庆祝画布初始化失败', error); this.useFallback(); }
    },
    useFallback() {
      if (this.disposed || this.isFallback) return;
      this.isFallback = true; clearTimeout(this.probeTimer); this.probeTimer = null;
      const fx = this.fx; this.fx = null;
      if (fx) {
        try { fx.destroy(); } catch (error) { console.warn('庆祝画布清理失败', error); }
      }
      this.setData({ fallback: true }); this.configure();
    },
    schedule() {
      clearTimeout(this.fallbackTimer);
      if (this.remaining <= 0) { this.fallbackTimer = null; this.triggerEvent('complete'); return; }
      this.startedAt = Date.now();
      this.fallbackTimer = setTimeout(() => { this.fallbackTimer = null; this.remaining = 0; if (!this.disposed) { this.setData({ bits: [], scenes: [] }); this.triggerEvent('complete'); } }, this.remaining);
    },
    configure() {
      const show = this.properties.show || {}; const mode = this.properties.mode;
      if (this.fx) {
        try { this.fx.configure(show, mode, this.properties.label); if (this.hidden) this.fx.pause(); }
        catch (error) { console.warn('庆祝绘制失败', error); this.useFallback(); }
        return;
      }
      if (!this.isFallback) return;
      const finale = DURATIONS[show.finale] ? show.finale : 'classic';
      // 与 Canvas 路径保持同一套开关：关闭动画强度或没有 mode 时立即收尾。
      if (!show.motion || !mode) {
        this.key = ''; this.remaining = 0; clearTimeout(this.fallbackTimer); this.fallbackTimer = null;
        this.setData({ bits: [], scenes: [] });
        if (mode === 'finale') this.triggerEvent('complete');
        return;
      }
      const key = `${mode}:${show.burst}:${show.finale}`;
      if (!show.burst || key === this.key) return;
      this.key = key;
      const info = wx.getWindowInfo ? wx.getWindowInfo() : {};
      const choreography = buildDomCelebration(show, mode, key, info);
      this.setData({ bits: choreography.bits, finale, scenes: [choreography.dom], paused: !!this.hidden });
      this.remaining = (mode === 'finale' ? DURATIONS[finale] : 2.8) * 1000;
      if (!this.hidden) this.schedule();
    },
    failed() { this.useFallback(); },
  },
});
