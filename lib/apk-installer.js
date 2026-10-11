const { hashFile } = require('./apk-sha256.js');
function createInstaller(api, notify) {
  let epoch = 0; let download = null;
  const fs = api.getFileSystemManager();
  function cancel() { epoch++; if (download) download.abort(); download = null; }
  async function install(resource) {
    cancel(); const token = epoch; let path = null;
    const active = () => token === epoch;
    try {
      const result = await new Promise((resolve, reject) => {
        download = api.downloadFile({ url: resource.url, timeout: 120000, success: resolve, fail: () => reject(new Error(active() ? '安装包下载失败，请重试' : '已取消下载')) });
        if (download.onProgressUpdate) download.onProgressUpdate((progress) => { if (active()) notify(`正在下载 ${progress.progress}%`); });
      });
      path = result.tempFilePath;
      if (!active()) throw new Error('已取消下载');
      if (result.statusCode !== 200) throw new Error('安装包下载失败');
      const stat = fs.statSync(path, false); const size = (stat.stats || stat).size;
      if (size !== resource.size) throw new Error('安装包大小不符，停止安装');
      notify('正在校验安装包');
      if (await hashFile(fs, path, size, active) !== resource.sha256) throw new Error('安装包校验失败，停止安装');
      if (!active()) throw new Error('已取消下载');
      await new Promise((resolve, reject) => api.miniapp.installApp({ filePath: path, success: resolve, fail: () => reject(new Error('安装未完成，请检查系统安装授权后重试')) }));
      notify('已请求系统安装；完成后重新打开应用核对版本与存档');
      // The installer may still be reading the APK after this callback. Keep the temporary file.
      path = null;
    } finally {
      download = null;
      if (path) { try { fs.unlinkSync(path); } catch {} }
    }
  }
  return { install, cancel };
}
module.exports = { createInstaller };
