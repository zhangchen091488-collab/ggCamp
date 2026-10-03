const { createStore } = require('./lib/storage.js');
const legalNotices = require('./shared/legal-notices.js');
App({
  legalNotices,
  onLaunch() {
    this.store = createStore(wx);
    if (wx.loadFontFace && wx.getFileSystemManager) {
      try {
        wx.getFileSystemManager().readFile({ filePath: '/assets/fonts/dela-gothic-one.woff2', encoding: 'base64', success: ({ data }) => {
          wx.loadFontFace({ global: true, family: 'Chunky', source: `url("data:font/woff2;base64,${data}")`, success: () => { this.fontReady = true; }, fail: () => { this.fontReady = false; } });
        }, fail: () => { this.fontReady = false; } });
      } catch { this.fontReady = false; }
    }
  },
});
