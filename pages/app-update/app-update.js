const updates = require('../../lib/release-update.js');
const build = require('../../lib/android-build.js');
Page({
  data: { version: build.versionName, beta: false, status: '', candidate: null, busy: false },
  onLoad() {
    if (!updates.available(wx)) { wx.navigateBack(); return; }
    this.active = true;
    this.updater = updates.createUpdater(wx, (status) => { if (this.active) this.setData({ status }); });
    this.setData({ beta: !!updates.preferences(wx).beta }); this.check();
  },
  async check() {
    if (this.data.busy || !this.updater) return;
    this.setData({ busy: true, candidate: null, status: '正在检查更新' });
    try { const value = await this.updater.check(); if (this.active) this.setData({ candidate: value, size: value ? (value.size / 1048576).toFixed(1) : '', status: value ? `发现新版本 ${value.versionName}` : '当前暂无可安装的新版本' }); }
    catch (error) { if (this.active) this.setData({ status: error.message }); }
    finally { if (this.active) this.setData({ busy: false }); }
  },
  beta(e) { if (this.data.busy) return; updates.setBeta(wx, e.detail.value); this.setData({ beta: !!e.detail.value }); this.check(); },
  install() {
    const value = this.data.candidate;
    if (this.data.busy || !value) return;
    wx.showModal({ title: `更新到 ${value.versionName}？`, content: `将下载 ${this.data.size} MB。随后按系统提示确认安装，现有学习记录会保留。`, confirmText: '下载更新', success: async (result) => {
      if (!result.confirm || !this.active || this.data.busy) return;
      this.setData({ busy: true });
      try { await this.updater.install(value); }
      catch (error) { if (this.active) this.setData({ status: error.message }); }
      finally { if (this.active) this.setData({ busy: false }); }
    } });
  },
  copy() { wx.setClipboardData({ data: this.data.candidate ? this.data.candidate.releasePageUrl : `${updates.REPOSITORY}/releases` }); },
  cancel() { this.updater.cancel(); this.setData({ status: '已取消更新，可继续练习' }); },
  onUnload() { this.active = false; if (this.updater) this.updater.cancel(); },
});
