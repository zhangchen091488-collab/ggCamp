const { createPartners } = require('../../service.js');
const partners = require('../../../lib/partners.js');
const mb = bytes => (bytes / 1000000).toFixed(2);
Page({
  data: { rows: [], code: '', busy: false, downloading: false, progress: 0, message: '', detail: null, space: '0.00' },
  onLoad() {
    this.visible = true;
    this.manager = createPartners(wx, getApp().store, progress => { if (this.visible) this.setData({ progress: progress.progress }); });
  },
  async onShow() {
    this.visible = true; if (!this.running) this.setData({ busy: false, downloading: false }); this.render();
    if (!this.manager.supported || this.manager.blocked) { this.setData({ message: this.manager.blocked || '当前宿主暂不支持下载新伙伴，内置伙伴仍可使用。' }); return; }
    if (this.running || this.refreshing) return this.refreshing;
    this.refreshing = this.manager.refresh().then(() => { if (this.visible) this.render(); }).catch(error => { if (this.visible) this.setData({ message: error.message }); }).finally(() => { this.refreshing = null; });
    return this.refreshing;
  },
  onHide() { this.visible = false; this.manager.cancel(); },
  onUnload() { this.visible = false; this.manager.cancel(); },
  render() {
    const selected = getApp().store.state.settings.character;
    const builtins = Object.entries(partners.NAMES).map(([id, name]) => ({ id, name, ready: true, builtin: true, status: '内置', thumbnail: `/assets/guagua/${id}-pink-happy.png` }));
    const rows = [...builtins, ...this.manager.rows()].map(r => ({ ...r, selected: r.id === selected }));
    const detail = this.data.detail; const own = detail && rows.find(r => r.id === detail.id);
    this.setData({ rows, space: mb(this.manager.used()), selected, ...(detail ? { detail: { ...detail, claimed: !!own, ready: !!(own && own.ready), installedLatest: !!(own && own.ready && own.installed >= detail.revision) } } : {}) });
  },
  input(e) { this.setData({ code: e.detail.value }); },
  async action(work) {
    if (this.running) return;
    this.running = true; this.setData({ busy: true, message: '' });
    try { if (this.refreshing) await this.refreshing; if (this.visible) await work(); } catch (error) { if (this.visible) this.setData({ message: error.message }); }
    finally { this.running = false; if (this.visible) { this.setData({ busy: false, downloading: false }); this.render(); } }
  },
  async showDetail(found) {
    if (!this.visible) return;
    this.found = found; const m = found.manifest;
    const own = this.manager.rows().find(r => r.id === m.characterId);
    this.setData({ detail: { id: m.characterId, name: m.name, description: m.description, revision: m.revision, size: mb(m.totalBytes), colors: m.capabilities.colors.length, costumes: m.capabilities.costumes.length, claimed: !!own, ready: !!(own && own.ready), installedLatest: !!(own && own.ready && own.installed >= m.revision), thumbnail: own && own.thumbnail || '', offline: !!found.offline } });
    const thumbnail = await this.manager.preview(m);
    if (this.visible) this.setData({ 'detail.thumbnail': thumbnail });
  },
  redeem() { return this.action(async () => {
    const code = this.data.code; this.setData({ code: '' });
    await this.showDetail(await this.manager.lookup(code));
  }); },
  details(e) {
    const row = this.data.rows.find(r => r.id === e.currentTarget.dataset.id); if (!row) return;
    if (row.builtin) { this.select(e); return; }
    return this.action(async () => {
      let found = { manifest: row.manifest };
      try { found = await this.manager.update(row.id); } catch { found.offline = true; }
      await this.showDetail(found);
    });
  },
  closeDetail() { if (!this.running) { this.found = null; this.setData({ detail: null }); } },
  expression(e) {
    if (!this.found) return;
    const m = this.found.manifest; const file = m.frames.original[e.currentTarget.dataset.face];
    return this.action(async () => { const thumbnail = await this.manager.preview(m, file); if (this.visible) this.setData({ 'detail.thumbnail': thumbnail }); });
  },
  download() {
    if (!this.found) return;
    return this.action(async () => {
      this.setData({ downloading: true, progress: 0 });
      const m = await this.manager.install(this.found.manifest, this.found.code);
      if (!this.visible) return;
      this.setData({ 'detail.ready': true, 'detail.installedLatest': true });
      wx.showModal({ title: '伙伴已准备好', content: `${m.name}已加入，是否立即使用？切换将从下一次新练习生效。`, confirmText: '立即使用', cancelText: '稍后使用', success: result => { if (result.confirm) this.use(m.characterId); } });
    });
  },
  cancel() { this.manager.cancel(); },
  use(id) { try { this.manager.select(id); this.render(); this.setData({ message: '伙伴已切换，下次新练习生效。' }); } catch (error) { this.setData({ message: error.message }); } },
  select(e) { if (!this.running) this.use(e.currentTarget.dataset.id); },
  selectDetail() { if (this.data.detail && !this.running) this.use(this.data.detail.id); },
  remove() {
    const detail = this.data.detail; if (!detail || this.running) return;
    const current = getApp().store.state.settings.character === detail.id;
    wx.showModal({ title: '删除下载资源？', content: `${current ? '将先切回瓜瓜。' : ''}保留伙伴领取记录和头像，以后可以重新下载；学习进度不受影响。`, confirmText: '删除资源', success: result => {
      if (!result.confirm) return;
      try { if (current) this.manager.select('girl'); this.manager.removeResources(detail.id); this.setData({ detail: null, message: '资源已删除，伙伴仍在领取列表中。' }); this.render(); }
      catch (error) { this.setData({ message: error.message }); }
    } });
  },
  manageSpace() { this.setData({ message: '点击已领取伙伴的“详情”，可删除下载资源。当前使用或练习引用的资源会受到保护。' }); },
});
