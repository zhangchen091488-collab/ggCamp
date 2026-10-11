const manifest = require('../content/pronunciation.js');
const { pronunciationResource, audioSha256 } = require('../shared/english-audio.js');
function createPronunciation(api, notify = () => {}, resources = manifest, music = null, onPlayback = () => {}) {
  let player = null; let task = null; let epoch = 0;
  const fs = api.getFileSystemManager && api.getFileSystemManager();
  const directory = fs && api.env && api.env.USER_DATA_PATH && `${api.env.USER_DATA_PATH}/english-audio-v1`;
  const available = (packId, item, speed) => !!pronunciationResource(resources, packId, item, speed);
  function stop(releaseMusic = true) {
    epoch++;
    if (task) { task.abort(); task = null; }
    if (player) { try { player.destroy(); } catch {} player = null; }
    if (releaseMusic && music) music.release();
  }
  function verified(path, resource) {
    try {
      const bytes = fs.readFileSync(path);
      return bytes.byteLength === resource.bytes && audioSha256(bytes) === resource.sha256;
    } catch { return false; }
  }
  function prune(required, keep) {
    const files = fs.readdirSync(directory).filter((name) => /^[a-f0-9]{64}\.mp3$/.test(name)).map((name) => {
      const path = `${directory}/${name}`;
      const result = fs.statSync(path, false); const stats = result.stats || result;
      return { path, bytes: stats.size, modified: stats.lastModifiedTime || 0 };
    }).sort((a, b) => a.modified - b.modified);
    let bytes = files.reduce((total, file) => total + file.bytes, 0);
    for (const file of files) {
      if (bytes + required <= 20 * 1024 * 1024) break;
      if (file.path === keep) continue;
      fs.unlinkSync(file.path); bytes -= file.bytes;
    }
  }
  async function source(resource) {
    if (!directory) throw new Error('当前宿主不支持读音缓存，请在微信或支持文件存储的应用中重试');
    const path = `${directory}/${resource.sha256}.mp3`;
    try { fs.mkdirSync(directory, true); } catch {}
    if (verified(path, resource)) return path;
    const temporary = await new Promise((resolve, reject) => {
      let downloadTask;
      downloadTask = api.downloadFile({ url: resource.url, success(result) {
        if (task === downloadTask) task = null;
        if (result.statusCode === 200) resolve(result.tempFilePath);
        else reject(new Error(`读音下载失败（HTTP ${result.statusCode}）`));
      }, fail(error) {
        if (task === downloadTask) task = null;
        const detail = String(error && error.errMsg || '');
        let message = '读音下载失败，请检查网络后重试';
        if (/domain list|not.*domain|合法域名/i.test(detail)) message = '请配置 downloadFile 合法域名后重试';
        else if (/timeout|超时/i.test(detail)) message = '读音下载超时，请检查网络后重试';
        else if (/ssl|certificate|证书/i.test(detail)) message = '读音安全连接失败，请检查托管证书';
        reject(new Error(message));
      } });
      task = downloadTask;
    });
    if (!verified(temporary, resource)) {
      try { fs.unlinkSync(temporary); } catch {}
      throw new Error('读音文件不完整，请重试');
    }
    prune(resource.bytes, path);
    fs.copyFileSync(temporary, path);
    // Downloads belong to this resolver; remove their temporary copies after saving.
    try { fs.unlinkSync(temporary); } catch {}
    return path;
  }
  async function play(packId, item, speed = 'normal') {
    stop(false); const token = epoch;
    const speeds = speed === 'both' ? ['normal', 'slow'] : [speed];
    const sequence = speeds.map((value) => pronunciationResource(resources, packId, item, value));
    if (sequence.some((resource) => !resource)) { if (music) music.release(); notify('这个词条暂未配音'); return false; }
    if (music) music.hold();
    async function segment(index) {
      try {
        const path = await source(sequence[index]);
        if (token !== epoch) return false;
        const context = api.createInnerAudioContext(); player = context;
        context.autoplay = false; context.obeyMuteSwitch = false; context.volume = .85;
        const active = () => token === epoch && context === player;
        context.onPlay(() => { if (active()) { onPlayback(); } });
        context.onEnded(() => {
          if (!active()) return;
          if (index + 1 === sequence.length) { stop(); return; }
          player = null; try { context.destroy(); } catch {}
          segment(index + 1);
        });
        context.onError(() => { if (active()) { stop(); notify('读音暂不可用，请重试'); } });
        context.src = path; context.play();
        return true;
      } catch (error) {
        if (token === epoch) { stop(); notify(error.message || '读音暂不可用，请重试'); }
        return false;
      }
    }
    return segment(0);
  }
  return { available, play, stop, close: stop };
}
module.exports = { createPronunciation };
