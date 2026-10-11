# 人教版英语发音接入（2026-10-11）

## 当前覆盖

当前收录的人教版一年级起点，一至六年级上下册共 12 册、903 个词条（684 个单词、219 个常用语）。每个词条都有正常读音和慢读。802 个不同原文中，31 个复用已有田园版读音，其余 771 个新合成两种语速，共新增 1542 段 MP3。

全部英语教材现有 1020 个词条、1776 个唯一 MP3，总计 20,822,688 字节。音频沿用 MiniMax 国内站 `speech-2.8-hd`、`Sweet_Girl`，正常速度 1、慢速 0.85，32 kHz 单声道、64 kbps MP3。短语整段合成；按完整请求指纹缓存，复用前检查文件大小和 SHA-256。

## 维护与发布

在 dopa-drill 源仓执行：

```sh
node tools/generate_english_audio.mjs --series pep
node tools/generate_english_audio.mjs --series pep --generate
```

第一条只检查计划；第二条调用本地 `.env.local` 配置的 MiniMax。生成使用目录锁、最多四个并发任务及全局请求间隔（默认 6500 ms），成功结果逐项保存；失败停止，不自动重试计费请求。再次执行会复用已校验的缓存。修改配置后产生不同请求指纹。

完整源清单保存在 `content/english/pronunciation.json`。`tools/build_miniprogram.mjs` 将它转换为紧凑的原生索引，保留教材／词条身份、精确原文、两种语速的大小与 SHA-256；完整音色与模型信息仍保留在源清单中。原生资源解析兼容旧清单；缓存路径和已下载文件继续复用。

音频与试听页发布到 ggCamp 既有资产分支 `codex/english-pronunciation-pilot`，本次资源提交 `4233565`。应用代码未在本次提交或推送。托管地址沿用 https://zhangchen091488-collab.github.io/ggCamp/ ，微信 downloadFile 合法域名无需新增。

发布后运行以下在线校验，再生成客户端索引：

```sh
node tools/prepare_pronunciation_site.mjs https://zhangchen091488-collab.github.io/ggCamp/
node tools/build_miniprogram.mjs
node tools/build_miniprogram.mjs --check
```

## 验证

- 1020 个词条的原文、正常／慢读与本地文件大小、SHA-256 全部一致；1776 个 MP3 全部解码通过。
- 紧凑索引与源清单逐项等价，非法身份、原文或损坏元数据被拒绝。
- 204 项源仓测试与 4 项小程序测试通过，共享生成一致。
- 小程序包体 2035.0 KiB / 2048 KiB；音频在外部托管，不进入主包。
- 全量线上校验：1776 个文件全部通过大小与 SHA-256 校验（2026-10-11 16:39），随后重新生成原生索引并通过一致性检查。
- 2026-10-11 解锁后在微信开发者工具抽查人教版三年级上册：单词 monkey、常用语 the matter 的喇叭均可点击；正常、慢读资源均被播放器依次读取，媒体请求响应 200，调试器 Errors: 0，未出现下载／播放错误或准备、朗读状态文字。常用语学习卡与答题页入口均已操作。该检查确认播放链路，不代表人工听音审核。
- 开发者工具本次提示未校验合法域名、TLS 与证书；因此本次模拟器抽查不证明真机域名配置已生效，仍需手机预览确认。
- 整册人工听检、真机与 APK 播放尚未验证；本记录中的解码与指纹检查不代表逐条发音准确性审核。
