const update = require('../../lib/android-update.js');
Page({
  data: { status: '', busy: false, candidate: null },
  onLoad() {
    if (!update.available(wx)) { wx.navigateBack(); return; }
    this.updater = update.createUpdater(wx, (status) => this.setData({ status }));
    this.refresh();
  },
  onShow() { if (this.updater) this.refresh(); },
  refresh() {
    const host = update.identity(wx);
    this.setData({ version: host.versionName, hostVersion: host.appVersion || `${host.versionName}（包内验证版本）`, installAvailable: host.installAvailable, status: update.compare(wx, getApp().store.state) });
  },
  record() { update.snapshot(wx, getApp().store.state); this.refresh(); },
  async check() {
    if (this.data.busy) return;
    this.setData({ busy: true, candidate: null, status: '正在检查验证版本' });
    try { const candidate = await this.updater.check(); this.setData({ candidate, status: `发现验证版本 ${candidate.versionName}` }); }
    catch (error) { this.setData({ status: error.message }); }
    finally { this.setData({ busy: false }); }
  },
  install() {
    if (this.data.busy || !this.data.candidate) return;
    wx.showModal({ title: '安装更新验证包？', content: '下载后将打开系统安装界面。请先记录当前学习存档，完成安装后重新打开应用核对。', confirmText: '下载更新', success: async (result) => {
      if (!result.confirm || this.data.busy) return;
      update.snapshot(wx, getApp().store.state);
      this.setData({ busy: true });
      try { await this.updater.install(this.data.candidate); }
      catch (error) { this.setData({ status: error.message }); }
      finally { this.setData({ busy: false }); }
    } });
  },
  cancel() { this.updater.cancel(); this.setData({ status: '已取消' }); },
  onUnload() { if (this.updater) this.updater.cancel(); },
});
