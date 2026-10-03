# 瓜瓜计算营 · 小程序独立仓库

本仓库保存可直接运行的微信小程序及多端应用源码。将仓库根目录导入微信开发者工具即可编译；`project.private.config.json` 为个人配置，不提交。

## 源码维护

本次同步来自 https://github.com/grmchn/dopa-drill 的 `miniprogram/` 目录，源提交为 `22de3fc39ac3f43bf3cc847eca3d9dd05c8b5489`。

`shared/` 由原仓库的 `app/js/` 生成。修改共享逻辑、重新生成素材或运行自动化测试时，在原仓库执行下文命令，再同步小程序目录。本仓库未包含网页版、测试、生成工具及品牌源图；下文涉及这些路径的说明均以原仓库为准。

许可文件见 `LICENSE` 和 `NOTICE.md`，打包内的许可文本另保存在 `shared/legal-notices.js`。

---

# 瓜瓜计算营 · 微信小程序

原生 WXML / WXSS 版本，共用网页版的题目、计分、成长、任务、奖杯、收藏和合成音乐源码。包含首页、答题、结算、技能树、奖杯、收藏、日历及设置八个页面。

## 导入与体验

1. 在微信开发者工具中导入本仓库的 `miniprogram/` 目录。
2. 保留自己的 `project.config.json` AppID；真机预览须使用有效小程序 AppID。AppSecret 不应放入项目。
3. 编译后选择年级，或用「适合我的题」进行能力测评。题量在设置中选择 6 / 10 / 14 题。
4. 填写高亮格，答对后自动进入下一题；可查看提示。基础练习首次答对率达到 80% 可进入 90 秒加时；复习不进入加时。
5. 技能树支持查看条件和专项练习，收藏支持随机或固定搭配；设置内可运行不影响记录的自动演示。

## 功能与网页版对齐

- 58 个技能的题目、输入顺序、进位、退位、分数和除法布局。
- 能力测评、年级与专项练习、错题队列、连击、欢乐值、加时计分、升星及时间胶囊。
- 每日任务、签到贴纸、补签锤、历史日历、306 个奖杯及 48 项收藏解锁。
- 瓜瓜伙伴衣服配色与装扮、背景、答对标记、彩纸、观众、终场庆祝和合成音乐；背景与庆祝分别使用独立全屏组件。彩纸物理与绘制规则和网页版共用；原生终场使用已批准的角色 PNG，身体动作不包含网页版 SVG 的手臂、耳朵等独立关节运动。
- 题量、音效、音量及动画设置；前后台暂停、手动继续、未完成练习恢复和保存失败提示。

本机存档沿用 `dopa-drill:mini:v1`，自动补齐旧原型数据。网页 localStorage 与微信存储独立，尚无跨端同步或网页存档导入。没有登录、服务器和外部资源请求。

## 开发与验证

在仓库根目录运行：

```bash
node tools/build_miniprogram.mjs
node tools/build_miniprogram.mjs --check
node --test tests/*.test.mjs
node tools/preview_celebration_dom.mjs   # 可选：生成 docs/preview/celebration-dom.html
```

`shared/` 是生成文件，应修改 `app/js/` 后重新生成。`lib/practice.js` 管理持久化练习，`lib/storage.js` 适配存储，`lib/features.js` 对接奖励，`lib/sheet.js` 转换题目布局。个人配置 `project.private.config.json` 保持本地。

DOM 彩纸兜底只在拿不到画布节点的宿主（多端 APK 原生渲染层）上出现，普通模拟器看不到。`tools/preview_celebration_dom.mjs` 把真实 `buildDomCelebration()` 的输出配合真实 `celebration.wxss` 渲染成一张对比页，用于在浏览器里核对每种彩纸和终场庆祝的差异，不需要重新构建 APK。

角色素材已随项目提供，无需安装依赖即可运行。修改角色源图后，用本地 `@resvg/resvg-js` 生成并压缩：

```bash
node tools/build_guagua_rasters.mjs /path/to/node_modules/sharp /path/to/node_modules/@resvg/resvg-js
python3 tools/optimize_miniprogram_assets.py
```

压缩脚本需要 Pillow。**任何生成素材的命令之后都必须补跑它**：Resvg 产出真彩色 PNG，角色与图标生成器产出 256 色 PNG，单包体积会因此重新越线。脚本可重复执行（已在预算内的文件原样跳过），包体积超标时以非零状态退出，可直接当作构建门槛。开发工具模拟器验证不能替代真机验收。

## 本次验证（2026-09-30）

- Node 全部 81 项测试通过，覆盖所有技能、测评、复习、加时、奖励与存档恢复；共享源码一致性检查通过。
- 微信开发者工具模拟器完成编译、技能树展示、奖杯筛选、收藏与音乐预览、日历记录、设置和自动演示。
- 演示完成基础题与 90 秒加时后回到首页，原未完成练习、历史数量、任务和奖杯保持原值。
- 最终日志无应用运行错误、组件类型或样式警告；仍有开发工具的灰度基础库、预加载、热重载及 worker 提示。
- 新品牌两端界面、角色切换、服装缩略图和网页版庆祝动画已验证；48 张角色 PNG 与 9 张配饰可覆盖全部 432 种组合，单包文件总量低于 2 MiB。
- iPhone / Android 真机触控、音频听感和后台恢复尚待验证。

## 真机验收

iPhone / Android 各检查一次：

- 能力测评、专项、年级、复习和加时结算；反复点击不重复记录或奖励。
- 三位数退位、除法、小数和带分数没有裁切；小屏键盘、弹窗与安全区可操作。
- 切后台、锁屏和结束小程序后可恢复，暂停不计时；演示保留原存档。
- 每日任务和签到仅奖励一次，补签锤消费、奖杯解锁及收藏选择能够保存。
- 音乐、音效、音量和动画设置生效，切后台停止播放；低版本音频不支持时静音运行。

上游许可保留在 `LICENSE`，新角色与品牌替换范围见 `NOTICE.md`，字体 OFL 文件随网页分发。公开发布前确认小程序主体、服务类目及上线要求。

## 瓜瓜品牌素材（v2）

两个伙伴各有 8 种衣服配色、9 种装扮与 3 种状态，共 432 种组合。新版以参考稿生成的透明人物插画为准，欢迎、欢呼、思考三种姿态共导出 48 张角色 PNG，9 张配饰独立叠加，避免重复图片占用包体。设置中可切换发髻或短发伙伴。衣服换色仅处理脸部以下的奶油色布料，皮肤与头发保留原图，已有收藏 ID 和存档键保持兼容。当前小程序文件总量约 1.49 MiB。小程序头像素材为 `assets/guagua-icon.png`，可用于开发工具预览；平台后台的名称和头像需由小程序管理员更新。

## 视觉对齐（2026-09-30）

- 首页直接显示日历：月份导航、今日边框、红金成绩印章、签到贴纸、任务星标、补签标记及每日记录弹窗。签到卡在日历详情页显示。
- 设置与问号图标、日历贴纸、印章和火箭与网页版共用 `app/js/ui-art.js`。帮助文案共用 `guide-steps.js`，首次五步、手动打开七步，支持聚光定位、返回、跳过及推荐提示。
- 收藏提供缩略图、重播、暂停、热闹程度和七秒音乐试听。按真实奖杯解锁，固定和随机搭配均从已获得的收藏中选择。标题右侧有一个仅用于调试的开关（见下节），默认关闭。
- 旧版存档里的 `settings.collectionDebug` 仍然失效并被清除，未获得的旧调试搭配自动回归正常选择；已获得的收藏、奖杯、历史和答题进度保留。新调试开关使用独立的存储键，不写入 `settings`、奖杯和练习记录。
- 模拟器已验证七步帮助、日历翻月与七条记录弹窗、开关切换、锁定背景/粒子/火箭/音乐的选择及暂停；最终零应用错误、零组件类型/样式警告。真机音频听感、性能及触控仍须按上面的验收清单验证。

重新导出 UI 图片及本地装饰字体（开发时需要本地 Resvg，运行小程序不需要）：

```bash
node tools/build_miniprogram_ui.mjs /path/to/node_modules/@resvg/resvg-js
python3 tools/optimize_miniprogram_assets.py
node tools/build_miniprogram.mjs
```

模拟器截图见 `../docs/brand/wechat-parity-calendar.png`、`wechat-parity-guide.png` 和 `wechat-parity-collection.png`。

## 答题布局与全屏背景修复（2026-09-30）

- 背景在答题、收藏和结算页面铺满内容区域，独立于人物画布；收藏预览框透明，背景不会被限制在框内。
- 答题人物位于题卡上方；进度圆点、计时胶囊、欢乐值卡片、蓝色题型标签、蓝色虚线答案格和带深色阴影的键盘按网页版布局调整。零键占两列，粉色退格键保留原有清除行为，提示从题卡右下角打开。
- 随机搭配问号使用独立居中文字；深色背景下的收藏说明和标题保留浅色底，保证可读。动画关闭时背景保持静止。
- 模拟器截图见 `../docs/brand/wechat-layout-play.png` 和 `wechat-layout-collection.png`；真机效果仍需验证。

## 真机编译兼容性修复（2026-09-30）

旧存档翻译字典改为 `Map`，避免微信 SWC 压缩器移除含日文中点「・」的对象键引号后，被旧版设备解析器拒绝。修改源文件 `app/js/locale.js` 后已重新生成 `shared/locale.js`，保持压缩设置和存档键不变。

验证：82 项 Node 测试通过；使用本机微信开发者工具自带 SWC，对小程序全部 37 个 JavaScript 文件进行 ES5 转换及压缩检查，压缩后的翻译模块可正常迁移分数提示。请重新编译后启动真机调试；设备侧验收仍需再次运行。

## 多端原生应用图标与调试面板（2026-10-01）

`project.miniapp.json` 的 Android / iOS 图标路径已指向 `miniapp/icons/` 的品牌图标；Android 包含 72 / 96 / 144 / 192 像素，iOS 包含主屏、Spotlight、设置、通知、iPad 及 1024 像素商店图标。所有图片均为不透明 PNG，路径相对于小程序项目目录。商店图标由现有 512 像素品牌图缩放导出。

两个平台的 `enableVConsole` 已设为 `close`。vConsole 是原生容器提供的日志调试面板；之前默认生成的 `open` 配置会让安装后的应用显示该入口。

更新图标源文件后可重新生成（需要本地 Sharp，应用运行不需要）：

```bash
node tools/build_miniapp_icons.mjs /path/to/node_modules/sharp
```

配置更新后，重新执行 Android / iOS 应用构建，再覆盖安装新包。小程序编译或刷新不会更新已安装原生包的图标和容器调试选项。当前已验证 88 项测试和图标尺寸/透明度；新 APK / IPA 的构建和设备安装效果尚待确认。

## APK 音乐初始化兼容性（2026-10-01）

本机开发者工具缓存的 APK 运行库列出了 WebAudio 音频节点，但没有 `createConvolver`。原来的音乐图无条件创建卷积混响，遇到缺失接口会使整个音频初始化失败。共享音频引擎现在按能力启用混响：原生端缺少该接口时关闭混响发送，继续播放原有旋律、节奏、延迟和答题音效；网页版仍保留混响。

音频初始化失败会显示一次提示并记录错误；下次进入页面可重试。已通过 91 项测试，包含缺少卷积混响/立体声声像接口时的所有曲目及答题音效调度、浏览器混响保留和失败后重试。

请重新构建 APK 并覆盖安装，打开声音开关并将音量调至非零，验证答题音乐、正确/错误音效、结算和收藏音乐试听，以及切到后台后音乐停止。当前验证覆盖代码和模拟接口，尚未确认新包的真机声音。


## APK 权限与音频模块核查（2026-10-01）

真机安装包声明了 30 项权限，完整状态与必要性见 `../docs/ANDROID_PERMISSIONS_REVIEW.md`。播放程序合成的音乐不需要录音或读取共享媒体权限，未扩大业务权限申请。

用户仍触发音频不可用提示；安装包缺少可识别的 WebAudio 原生库，媒体扩展模块原先关闭。本轮已开启 Android `useExtendedSdk.media` 补齐媒体后端候选依赖，并让错误弹窗显示具体异常。新 APK 尚未构建/验证，开启模块后的最终 Manifest 也需要再次审查。若仍无声，请记录新弹窗的错误详情。

## 返回前台音频恢复（2026-10-01）

用户已确认冷启动可播放，但退后台后返回无声。适配器现在等待旧原生音频上下文关闭完成后再创建新上下文，并等待 `resume()` 完成后启动音乐和排队的结算音效；后台退出会取消尚未完成的启动，防止异步回调在后台重新播放。原生容器在页面显示后延迟暂停上下文时，会检测并恢复。系统音频中断开始时停止调度，中断结束仅恢复仍有效的播放请求，关闭页面会移除监听。

收藏页返回时重新启动音乐分类试听，结算页复用适配器以等待旧上下文关闭。答题页仍保留后台暂停计时的设计，返回后点击“继续练习”恢复音频。未增加权限申请。

97 项测试通过，包含异步恢复、关闭与重新创建的顺序、过期回调取消、中断恢复、延迟暂停和收藏试听恢复；4 个修改模块通过微信 ES5 压缩解析检查。请重新构建并覆盖安装 APK，验证答题继续、收藏音乐试听、结算页面各自连续切换后台/前台至少三次，以及返回后关闭声音不会自动重启。新包真机效果尚未验证。

## 安卓恢复策略修订（2026-10-01）

用户反馈上一版小程序正常，但 Android APK 在点击继续练习后仍无声；上一节的测试结果不代表安卓真机验收通过。本机原生 SDK 的 `close/resume/suspend` Promise 依赖 `onstatechange` 通知，因此不应把后台音频恢复无限阻塞在这些 Promise 上。

答题、收藏、结算页面退后台现在调用 `pause()`，停止调度、静音并保留上下文；卸载页面才调用 `close()` 销毁。继续时显式恢复保留的上下文，即使原生侧暴露旧的 `running` 状态；状态已恢复但 Promise 不返回时，通过状态轮询放行。恢复等待最多两秒；显式销毁的关闭回调最多等待半秒。所有等待在停止时取消，避免旧回调在后台启动音乐。

另检测 `running` 状态下音频时钟是否推进；停滞会给出具体错误。当时设置页曾提供“声音异常排查”，可查看并复制最近 40 条音频状态（仅在内存保留，包含状态、音频时间与异常，无练习答案、账户或设备标识，不上传）；该诊断入口已在定位结束后移除，见文末“验证代码清理（2026-10-01）”。

100 项测试通过，新增覆盖未返回原生状态回调、连续三次后台往返、过期 `running` 状态和冻结时钟；5 个修改模块通过微信 ES5 压缩解析检查。开发者工具中已验证当时的设置页诊断入口及弹窗。新 APK 尚未构建和覆盖安装；如仍失败，先复现再按原生现场状态定位。

## 提示图标与 suspended 超时恢复（2026-10-01）

答题卡右下角提示按钮使用与首页帮助共源的蓝色 PNG 问号，代替全角文字，按固定尺寸在圆框内居中；开发者工具中已检查实际题卡效果。`app/js/ui-art.js` 的 `UI_ICONS.hint` 是图标源，可通过 `tools/build_miniprogram_ui.mjs` 重建。

针对用户提供的“音频恢复超时（状态：suspended）”，保留的原生上下文超时后增加一次重建尝试，保留待播放音效。冷启动失败或重建再次失败会正常显示详情，不无限重试。101 项测试通过，包含旧上下文一直 suspended、新上下文可运行时的恢复；新 APK 真机效果仍需验证。

## default 状态后的本地音频备用通道（2026-10-01）

真机反馈表明上一次重建仍可能停在 `default`，因此上一节的修复尚未通过真机验收。本版在 WebAudio 初始化、恢复或时钟推进失败时，自动切换到独立的 `wx.createInnerAudioContext` 本地文件播放器；同一次应用运行的后续页面沿用备用通道。该 API 的播放和生命周期说明见[腾讯官方音频文档](https://intl.cloud.tencent.com/ind/document/product/1219/68069)。

`assets/audio/` 的 14 个 MP3 全部从 `app/js/audio.js` 现有原创乐谱离线导出：五种音乐分别提供低、高两个强度档，以及答对、错误、完成题目、结算四种音效。备用通道保留曲目选择和音量设置，动态合成细节简化为两个档位；正常 WebAudio 播放仍保留原有变化。没有引入第三方音乐、网络音源或新增权限申请。

退后台停止并销毁文件播放器，点击继续时重新创建；旧的播放、错误回调不能影响新播放。每次设置音源后只发送一次 `play()`，不在 `onCanplay` 中重复调用。真机曾反馈 `operateAudio:fail,audio is playing,don't play again`，代码中这两个调用入口是该错误的直接原因，已删除准备完成回调中的重复调用，没有忽略错误或增加重试。文件播放器失败或六秒未启动时会显示错误详情，不静默失败（当时的 `file-fallback` / `file-playing` 诊断记录已随验证代码移除）。导出脚本 `tools/build_native_audio.mjs` 需要现有 Playwright、Chrome 和 FFmpeg，可用 `PLAYWRIGHT_MODULE`、`CHROME_PATH` 指定本机路径，不安装依赖。

104 项测试通过，包含重建上下文停在 default 后自动切换、排队结算音效、连续三次后台往返、跨页面复用策略、过期回调和文件播放错误；14 个文件已实际解码并检查有声信号，主包目录低于 2 MiB，两个适配器通过开发者工具 ES5 压缩解析。尚未构建或安装新 APK。请重新构建并覆盖安装，验证答题继续、收藏试听、结算和关闭声音，后台往返各至少三次。

## WebAudio 生命周期隔离验证（2026-10-01，探针页已移除）

为定位根因曾临时增加 `pages/audio-test/audio-test`（设置 → WebAudio 验证），用 A/B/C/D 四组单音源探针区分"应用主动暂停与 SDK 冲突"和"SDK 自身恢复失败"：A 由 SDK 管理后台、B 应用主动 suspend、C 只在前台 suspend/resume、D 后台 close 后新建上下文。每组各只有一个 440 Hz 正弦音源和一个低音量增益节点，不写练习记录和设置。

结论已经得出，探针页及其用例在修复后一并移除：

- A/B 真机记录均显示首次返回后的 resume 请求持续挂起、状态 suspended、音频时钟冻结；B 的 suspend 正常完成，说明应用主动暂停不是触发条件。
- C 组三次前台 suspend/resume 全部完成，状态恢复 running、时钟推进且用户确认有声音，说明 WebAudio 引擎本身可用。
- D 组后台 `close()` 成功后，回前台新建的上下文仍停在 `default`、`currentTime` 恒为 0。

三者合起来即"退后台会拆掉原生 WebAudio 后端、且在该进程内不会重建"这一结论，据此改为原生端使用文件通道（见下一节）。

## 安卓端改用文件通道（2026-10-01）

D 组真机记录补齐了结论：Android SDK 1.7.0 上后台 `close()` 虽然成功，但回前台**新建**的 WebAudio 上下文仍停在 `default`、`currentTime` 恒为 0。结合 C 组（前台 suspend/resume 正常）与 A/B 组（旧上下文 resume 永久挂起），可以判定退后台会拆掉原生 WebAudio 后端，且在该进程内不会重建——保留上下文、重建上下文、超时重试都不可能恢复。这是运行时能力边界，不是参数问题。

因此原生多端容器不再尝试 WebAudio：`lib/audio.js` 用 `wx.getAppBaseInfo().host`（`env === 'SAAASDK'`，或存在 `packageName` / `bundleIdentifier` / `sdkVersion`）识别多端容器，命中时直接把 `wx.createInnerAudioContext` 文件播放器作为**主通道**，不再走"先试 WebAudio、失败再退"的路径，省掉首次回前台 2~4 秒的静音空档。微信小程序运行时仍使用 WebAudio 合成乐谱。

未使用条件编译：`// #if` 注释在 `node --test` 下不会被剥离，会让两个分支同时生效；官方也提示第三方工具链可能丢失条件编译写法。运行时判定可单测、可回退。

同时修掉两处缺陷：`close()` 现在先断开上下文引用再调用 `pause()`，避免在 close 之后读取 `state`（官方明确禁止该操作）；已交给 WebAudio 后端的排队音效会在后端失效时经文件通道重放，不再丢失。文件通道的音效播放器改为 3 个轮转，避免连续答题时后一声打断前一声。

112 项测试通过，新增"原生容器主通道判定"与"连续三次后台往返"两个用例，并把原先描述"复用同一上下文"的用例改名为小程序路径。尚未重新构建 APK；请覆盖安装后验证答题继续、收藏试听、结算页各自连续三次后台往返，以及关闭声音不会自动重启。iOS 多端容器是否同样失效仍未验证。

## 文件通道的 stop 失败（2026-10-01）

真机反馈：退后台重进后点击继续练习弹出「本地音频播放失败（operateAudio:fail stop audio fail）」。根因是 `setLevel()` 在**刚创建、尚未设置音源**的播放器上调用了 `stop()`——Android 对没有音源的播放器返回 stop 失败，而该回调发生在当前会话内，于是被判定为播放错误并关闭了整个音频。

修复：用 `WeakSet` 记录已分配音源的播放器，`stopLoaded()` 只停止这些播放器，`dispose()`、切档位和音效复用统一走同一判断；`onError` 对未分配音源的播放器直接忽略，并额外忽略 errMsg 含 `stop` 的失败——停止不是播放，不应关闭会话。同时把"已交给 WebAudio 后端但后端随即失效"的排队音效改为经文件通道重放，不再丢失。

新增两条用例：刚创建的播放器不会被 stop；stop 失败不弹出错误。113 项测试通过。仍需重新构建 APK 验证真机。

## 验证代码清理（2026-10-01）

真机确认修复后，移除为定位本次问题临时加入的验证代码，恢复产品原有的干净接口：

- 删除探针页 `pages/audio-test/`（A/B/C/D 四组 WebAudio 探针），并从 `app.json` 的 `pages` 中移除其路由；对应的 `tests/app_audio_probe.test.mjs` 一并删除。
- 删除 `lib/audio.js` 的 `diagnostics` 缓冲、`trace()` 与 `audioDiagnostics()` 导出，以及所有 `trace(...)` 调用点；`createFileAudio()` 恢复为 `(api, failure)` 两个参数。
- 删除设置页的“声音异常排查”入口：`settings.js` 的 `audioHelp()` 与 `audioDiagnostics` 引用、`settings.wxml` 的对应按钮区块。
- 清掉 `file-audio.js` 启动超时提示中指向已删除功能的文案（`本地音乐启动超时，请复制声音异常排查详情` → `本地音乐启动超时`）。

保留下来的行为不变：原生容器仍以文件通道为主通道，`stopLoaded()` / `loaded` WeakSet 的 stop 保护、`onError` 的两道过滤、3 个轮转音效播放器、`close()` 先断引用再 `pause()` 的顺序、以及排队音效经文件通道重放都保留。测试从 113 项回到 107 项（移除 6 条探针用例），`node --test tests/*.test.mjs` 全绿。

## 全屏彩纸与终场庆祝（2026-10-01）

旧版 `show-stage` 把人物和粒子限制在 320rpx 圆角舞台，并在 Canvas 内裁剪；完成练习直接进入成绩页，缺少网页版先庆祝再展示结果的流程。

- 新增页面根部 `components/celebration/` 与 `lib/celebration.js`，固定覆盖内容视口，不拦截页面点击，不受卡片、收藏预览框或页面滚动裁剪。系统状态栏和原生导航栏不属于页面 Canvas 范围。
- 将原 `app/js/fx.js` 粒子引擎抽为 `app/js/particles.js`。网页版保留浏览器适配器，小程序通过构建工具生成 `shared/particles.js`，共用六种彩纸主题、翻转飘落、烟花上升与爆开、彩带轨迹、星星、金币和小伙伴粒子。原生直接绘制 Canvas 图形，无新增离屏 Canvas API 依赖。
- 答对时使用全屏粒子；收藏彩纸与终场预览调用同一组件。局部人物舞台关闭粒子，避免重复喷发。
- 结算页先播放伙伴大庆祝、烟花大会、火箭穿屏或九人巡游，再显示成绩。可点击“查看成绩”提前结束；动画强度为零直接显示结果。横幅显示实际分数，本轮装扮保存在结果中，加时结束不重新随机选择。
- 切后台取消帧回调并暂停动画时间；返回后继续剩余动画，不重复创建整段庆祝；离页释放图像和粒子。收藏暂停或切换分类取消旧效果。音频通道未修改。

112 项测试通过，涵盖四种终场、六种主题、视口尺寸、后台暂停、过期图像回调、零动画及本轮装扮保存；共享模块一致性和 7 个原生模块的微信 ES5 编译检查通过。开发者工具已实测彩纸和终场预览跨越预览框、答题全屏喷发，以及自动演示结束后进入成绩页；无应用错误，警告为工具预加载、自动热重载和 worker 日志。尚未构建新 APK，安卓真机帧率和后台返回仍需验证。

## APK 庆祝动画现场排查（2026-10-01）

微信小程序真机与模拟器的彩纸、庆祝动画正常，Android APK 无效果；已核对手机安装包包含新动画代码。当前临时将 `project.miniapp.json` 的 `mini-android.enableVConsole` 改为 `open`，iOS 保持关闭。重新构建并覆盖安装 APK 后，打开 vConsole 的 Console，在收藏预览彩纸、终场或完成一轮答题，记录第一条错误及完整堆栈，重点检查「庆祝画布初始化失败」「庆祝绘制失败」和未处理的异步异常。此开关不修复动画，仅用于现场定位。发布前恢复为 `close` 并重新构建；图标生成工具也会将此开关关闭。

## APK 庆祝动画定位结论（2026-10-01）

现场日志给出了结论。收藏页「彩纸」标签连续触发 5 次后，`[庆祝诊断] configure` 的 `canvasReady` **恒为 `false`**，而 `mode`/`burst`/`hero`/`motion` 全部正常（`motion:true`）。这说明数据链路没问题、动画强度也没被关掉，**只是 `this.fx` 从未创建——Canvas 2D 的节点从来没有取到**。日志里既没有 `庆祝画布初始化失败`，也没有 `庆祝绘制失败`，因此不是 `getContext`/`createImage` 的问题，而是落在静默分支 `if (!r || !r.node) { this.failed(); return; }`。

进一步确认：`exec` 的回调**完全没有触发**（日志中不存在 `canvas.query` 条目）。是「回调根本没来」，而不是「回调了但节点为空」——这把原因指向「节点不在可查询的渲染树里」，而不是「容器尺寸为 0」（尺寸为 0 仍会正常回调，只是宽高是 0）。

一个连带影响值得记下：原代码在拿不到节点时立刻调 `failed()` → `triggerEvent('complete')`，所以结算页上的庆祝动画不只是画不出来，而是**被直接跳过**了。

关键对照：`show-stage` 用**同样的查询写法、同样的 `attached` 钩子**，在 APK 上正常工作。也就是说多端容器**支持** Canvas 2D 节点查询，问题只出在庆祝组件自身。两者其余差异只剩结构：

- 庆祝组件挂在**页面根部**（`show-stage` 嵌在 `.container` 内）。
- 外层容器是 **`position:fixed` 全屏**（`show-stage` 是正常流里的 `position:relative`）。
- 外层容器带 **`aria-hidden="true"`**（`show-stage` 用的是 `aria-label`）。

因此本轮保持克制，不加轮询、不加延迟、不加替代动画，只做两件事：

- 去掉外层容器的 `aria-hidden="true"`。对纯装饰层本就冗余，且是三者中唯一带「从树里隐藏」语义的属性。
- 加一条对照日志 `wrapper.rect`，先量外层容器本身：若它能返回尺寸而 `canvas.query` 依旧不回调，说明查询链路是通的、只是 canvas 节点取不到；若两条都不回调，说明整个组件的查询都走不通。

113 项测试中 111 项通过。另两项与本次改动无关：`app_brand` 的包体积断言失败，因为 `miniprogram/` 已达 **2.48 MiB，超出 2 MiB 单包上限**，需单独处理；图标用例失败是因为排查期把 `enableVConsole` 开成了 `open`，发布前改回 `close` 即恢复。

下一次真机看 `wrapper.rect` 与 `canvas.query` 的组合：若 `aria-hidden` 正是原因，`canvasReady` 会直接变为 `true`，彩纸与庆祝全部保留；若仍取不到节点，则按结构差异继续收敛（把 canvas 移出 `position:fixed` 子树，或改成正常流包裹），最后手段才是多端容器下改用 DOM + CSS 关键帧兜底。

## 真机结果：查询链路是通的，只有 canvas 节点取不到（2026-10-01）

真机回报 **`wrapper.rect` 有尺寸、`canvas.query` 不出现**。这一条同时否掉了两个假设：

- **`aria-hidden="true"` 不是原因**。带这个属性的正是 `.celebration` 外层容器本身，它能被查到并量出尺寸，说明该子树在渲染树里、查询可达。
- **`position:fixed` 不是原因**。外层容器就是 `position:fixed` 元素，它照样被查到了。

于是问题被压缩成一句话：**组件级的 `createSelectorQuery()` 工作正常（`<view>` 能查到），但 `fields({ node: true })` 查 `<canvas type="2d">` 时回调从不触发。** 注意这与「容器不支持 Canvas 2D」不是一回事——`boundingClientRect` 和 `fields({node:true})` 是两套机制，前者走布局计算，后者要取原生节点句柄。

对照 `show-stage` 与 `celebration` 的 canvas 声明，只剩一处命名差异：

```
show-stage : <canvas type="2d" id="effects"          class="effects"></canvas>
celebration: <canvas type="2d" id="celebration-canvas" class="canvas"></canvas>
```

原先是 `id="celebration"`，**与注册的自定义组件标签名 `<celebration>` 完全同名**。`show-stage` 的 id 是 `effects`，与标签名 `show-stage` 不冲突。自定义组件的节点与同名的元素 id 在容器的节点注册表里很可能互相覆盖，导致 `#celebration` 解析不到那个 canvas。因此把 canvas 的 id 改名为 `celebration-canvas`。

同时给 `show-stage` 加了同款对照日志 `[舞台诊断] canvas.query`，用来一次分清两种可能：若它的 `canvas.query` 正常打出 `node:true`，说明 `fields({node:true})` 在本容器可用，问题就锁定在命名冲突；若它也打不出来，则说明本容器根本不支持节点查询，那就直接走 DOM 兜底。

本轮未引入重试、延迟或替代动画；113 项测试仍为 111 通过，另两项失败与本次改动无关（包体积超出 2 MiB 上限、排查期开启的 vConsole）。

## 结论：多端容器的原生渲染层不支持 Canvas 2D 节点查询（2026-10-01，真机实测机型）

> 这一节记录的是**在该机型/该宿主上**实测到的能力。不要把「多端容器」整体等同于「不支持 canvas」——同一平台的不同宿主能力并不一致，所以最终实现改成了运行时探测，见下面的「为什么改成能力探测」。

真机回报 `[舞台诊断] canvas.query` **没有打印**，即 `show-stage` 的 `#effects` 同样取不到节点。把全部证据放在一起：

- `.celebration` 外层 `<view>` 的 `boundingClientRect()` 正常返回尺寸 → 组件级查询链路是通的；
- 两个 `<canvas type="2d">`（`#effects`、`#celebration-canvas`）的 `fields({ node: true })` 回调**都不触发**，改名成 `celebration-canvas` 后依旧。

因此可以逐条排除：不是命名冲突（`effects` 与 `show-stage` 无冲突）、不是 `aria-hidden`、也不是 `position:fixed`（外层容器本身就是 fixed 且可查）。真正的原因是**该容器的节点查询没有实现 `node: true` 这一能力**——`boundingClientRect()` 走布局计算、可用，而 `fields({node:true})` 要取原生节点句柄、不可用。这两者是不同机制，此前把它们混为一谈导致了几轮误判。

### 为什么小程序和模拟器都正常

微信小程序真机与开发者工具模拟器走的是**同一套 WebView 渲染器**，`<canvas type="2d">` 背后是真实的 DOM canvas 节点，`node: true` 取得到句柄；而多端应用 APK 走的是 Donut 的**原生渲染层**（这正是它「接近原生体验」的来源），该层未实现 canvas 的节点句柄查询。所以这不是「两个环境正常、一个环境异常」，而是**一个渲染器支持、另一个渲染器不支持**——模拟器与真机只是同一个渲染器上的两次复现，构不成两个独立证据。

### 为什么 `show-stage` 一直看起来是好的

`show-stage.wxss` 有这条规则：

```
.canvas-ready .burst-rays,.canvas-ready .hero,.canvas-ready .crowd,.canvas-ready .mark,... {display:none;}
```

canvas 就绪才隐藏 DOM 兜底。APK 上 canvas 从未就绪，于是显示的一直是 DOM 版本（`<image>` 瓜瓜、观众、放射线、CSS 关键帧）。**也就是说 APK 上从来没有跑过任何 canvas 动画，只是 `show-stage` 有 DOM 兜底所以看不出来。** celebration 是唯一没有 DOM 兜底的组件，所以只有它表现为「坏了」。

### 实现

- 新增 `lib/platform.js`，把 `isNativeContainer()` 从 `lib/audio.js` 提取出来共用；`lib/audio.js` 行为不变，原有音频用例继续覆盖。
- `components/celebration/` 不再按平台决定走哪条路径，改成**能力探测**：
  - `attached()` 先探一次；`attached` 时布局可能还没完成，节点查询会落空，所以 `ready()`（官方推荐的节点查询时机）**再探一次**，而不是在第一次落空时就永久降级；
  - 只有「到截止时间仍没拿到节点」「初始化/绘制抛错」「canvas `binderror`」才置 `fallback: true`，用 `wx:if` 移除 canvas，改渲染 DOM 彩纸层；
  - 截止时间只用来决定**等多久**：`isNativeContainer(wx)` 命中时 200ms（容器上大概率拿不到节点，让 DOM 彩纸尽快出现），否则 600ms。它**不再决定用哪条路径**——容器上真能返回节点（例如模拟器）时回调会先到，照样走 Canvas 2D；
  - 复用 `lib/visual.js` 已算好、此前全仓无人消费的 `show.confetti` 作为彩纸数据，收藏里选的粒子主题因此在原生端同样生效；
  - 答对时从画面中央（`left:50%;top:38%`）向 **8 个方向**放射炸开（`pop-0..7`），每片尺寸、颜色、延迟、时长各不相同，对应 Canvas 路径的 `front.burst`，而不是早期那版从顶部均匀下落；
  - 终场再叠 **18 片**更慢的彩纸雨，沿 6 条不同漂移轨迹（`rain-0..5`）飘落，并按 `DURATIONS` 渲染伙伴与分数印章：classic/fireworks 摇摆、rocket 斜飞入场、parade 巡游；
  - DOM 路径自行按 `DURATIONS` 计时并 `triggerEvent('complete')`，退后台暂停、返回续算剩余时长，与 canvas 路径行为一致。
- 移除全部临时诊断日志（`[庆祝诊断]`、`[舞台诊断]`）。

### 为什么改成能力探测

按平台一刀切会漏掉**同一平台里能力不同的宿主**：多端容器在模拟器上能正常返回画布节点，按平台判断就会把本来能跑 Canvas 2D 的环境也换成 DOM。反过来，`isNativeContainer` 也不适合当作「不支持 canvas」的判据——它只是平台信号，能力应当实测。

顺带核对了官方文档：`wx.getAppBaseInfo()` 的 `host` 在普通微信小程序里只带 `appId`（且仅当小程序运行在第三方 App 环境时才返回），不含 `env`/`packageName`/`bundleIdentifier`/`sdkVersion`。所以 `isNativeContainer` **不会**在小程序里误命中，`lib/audio.js` 的小程序 WebAudio 路径没有被误切到文件通道。

116 项测试，115 通过；新增 3 条用例覆盖「容器能给出节点 → 用 canvas」「查询永不回调 → 到截止时间退 DOM」「首次查询落空 → 等 ready 再探，不永久降级」。真机效果仍待验证。

### 清理（2026-10-01）

- 移除 `lib/celebration.js` 的 `trace` 形参、全部 12 处 `trace(...)` 调用点，以及只服务于这些日志的 `frameCount` 计数与只做 `throw` 的 `try/catch`。该诊断管道在定位结束后未一并删除，`createCelebration()` 恢复为 `(canvas, width, height, dpr, complete)` 五个参数。
- `mini-android.enableVConsole` 改回 `"close"`，发布检查用例恢复通过。
- 复查确认无残留：无 `TODO`/`FIXME`/`临时`/`调试`/`debugger` 标记，`app/` 与 `miniprogram/` 无 `console.log|info|debug`。保留的 `console.warn` 均为真实错误处理（音频、背景 WebGL 回退、庆祝画布初始化/绘制失败）。

### 待办

- 重新构建 APK 真机验证：模拟器/支持 canvas 的宿主应走 Canvas 2D，APK 原生渲染层应出现放射炸开的 DOM 彩纸与终场庆祝。
- ~~单包体积 2,155,561 字节（约 2.06 MiB）超过 2 MiB 上限 57 KiB，是当前唯一失败的发布检查项，需另行处理。~~ 已在「发布版剔除调试入口与单包瘦身（2026-10-02）」处理：`tools/optimize_miniprogram_assets.py` 重新索引全部生成素材后降至 **1,596,791 字节（约 1.52 MiB），余量 488.6 KiB**；若按 `packOptions.ignore` 扣除上传时排除的 `README.md`，实际上传约 1,550,712 字节（1.48 MiB）。此前记录的「2.48 MiB」是 `du` 按块取整的虚高值。


## DOM 彩纸与终场动效增强（2026-10-01）

仅增强 `celebration` 的 DOM＋CSS 兜底分支，新增 `lib/celebration-dom.js`。Canvas 能力探测、`useCanvas`、Canvas 渲染器及共享粒子模块保持原样。每次触发一次性计算按视口尺寸采样的弧线轨迹，以 CSS 的 transform/opacity 播放喷发、彩纸雨、翻面、彩带和分批烟花环；无需逐帧 setData。粒子上限 160 个，低动画强度降低数量、位移和人物跳跃幅度。使用现有角色与火箭素材，不新增图片。

四种终场分别为大人物升起与伙伴跳跃、12 位伙伴环绕与五批烟花、1.4 秒火箭飞越后登场、九位伙伴巡游 2.3 秒后登场；成绩印章沿用 Canvas 的 0.7/1.3/1.4/2.3 秒节奏。新触发键重建兜底节点，避免重复预览不重播。后台暂停 CSS 和完成时钟，完成后移除动画节点；关闭动画立即清空，系统减少动态效果时保留静态角色与成绩。

验证：118 项测试中 117 项通过；唯一失败为小程序目录源文件总量超过现有 2 MiB 门槛（包含 README 与原生应用图标），未放宽检查。微信 WXML/WXSS 编译器校验通过，共享模块一致性通过，三个 Canvas 核心文件 SHA-256 与修改前相同。390×740 临时浏览器预览已检查全屏彩纸、烟花环绕、火箭与巡游分阶段效果、暂停和图片加载，无控制台错误；此预览不是 APK 实测，原生 CSS 兼容性与帧率仍需重新构建 APK 验证。

终场模板的烟花环绕与伙伴分支改成两个互斥的 `block wx:if`，循环放在分支内部，避免 `wx:else` 与循环组合的编译错误。微信开发者工具清除文件缓存并重新打开项目后，新增 DOM 模块已被识别，首页正常加载，调试器 Errors 为 0（2 条工具预加载警告）。未清除练习数据，Canvas 渲染代码未变更。

## 收藏变体区分、设置伙伴预览与调试开关（2026-10-02）

### 彩纸与终场庆祝在 DOM 兜底里也能区分

此前 `lib/celebration-dom.js` 只把 `paper` 这一类彩纸按 65% 概率换成主题字形，且主题只覆盖 `note`/`petal`/`digit`/`candy`。命中率约 30%，其余仍是共用彩虹配色的纸片、星星和金币，所以解锁不同彩纸时兜底效果看起来几乎一样。`bubble` 更是只在 WXSS 里画圆，没有主题数据。

现在主题接管整套彩纸词汇，并像 Canvas 渲染器的 `THEME_INIT` 那样带上各自的物理与配色：

- 主题命中率 65% → 80%，且对 `paper`/`star`/`coin` 一并生效（`spark`/`streamer`/`mini` 保持原样）；
- `THEMES` 增加 `symbols`/`colors`/`gravity`/`life`/`spin`/`size`/`speed`/`rise`：音符明亮弹跳，花瓣用粉白配色、滞空 1.7 倍且转得很慢，数字快速翻滚，糖果更小更快，泡泡变浅蓝、不翻滚、沿 `rise` 从底部上升；
- 四种终场各自有一套 `FINALES` 纸屑配置和 `--accent` 主色：`fireworks` 去掉飘落纸屑、换成更多火花与 5 圈烟花环，`rocket` 用 12 条彩带代替纸屑雨，`parade` 保留较轻的雨加彩带，`classic` 维持满量；主色驱动 `--accent`，用于新增的 `dom-glow` 底色和成绩印章颜色；
- 新增 `.dom-still`（泡泡不翻滚）与 `.dom-glow` 关键帧；`prefers-reduced-motion` 下静态保留底色。

粒子上限仍为 160：`classic` 终场最多 130 个，`fireworks` 114，`parade` 102，`rocket` 82。

### 设置页新增计算伙伴预览

设置页原来点「瓜瓜／年年」看不到任何变化，网页版则是标题画面的主角立即换装。现在设置页复用 `components/show-stage/`，用 `visual(features.look(store), 'happy', .4, burst, motion)` 计算 `show`，`character` 改变时递增 `burst` 重播跳跃，并在舞台上角显示当前伙伴名字。强度刻意压在 0.45 的观众阈值之下，舞台上只站选中的伙伴，不会被伙伴群淹没。`settings.json` 增加 `usingComponents.show-stage`。

### 收藏调试开关

`lib/debug.js` 用独立存储键 `dopa-drill:mini:debug:v1` 保存开关状态，绝不写入 `settings`（旧键 `collectionDebug` 仍在迁移里被清除，相关用例保持通过）。开启后收藏页把所有奖杯视为已获得（`ul.allTrophies()`），标题右侧按钮变为「调试中」并显示说明条；`features.look` 增加可选 `got` 形参，使预览也使用同一套解锁集合。

关闭开关时，凡是没有真正获得的搭配立即回到「随机搭配」，与加载期迁移同一规则；`settings` 的「重置全部数据」同时清除该键。调试期间不写奖杯、历史和练习记录。

验证：122 项测试中 121 项通过（唯一失败仍是 2 MiB 体积检查）。新增 3 条用例：`celebration` 侧覆盖「每种彩纸的字形/配色/时长/旋转各不相同且泡泡只上升」与「每种终场的纸屑构成和主色各不相同」，`app_miniprogram_visual` 侧用页面挂载覆盖「设置预览跟随伙伴切换并重播」和「调试开关解锁、预览、关闭后回收未获得的搭配且不动奖杯」。反向验证：把主题命中改回旧的 `paper`+65% 后，彩纸用例立即失败。尚未构建 APK，真机 CSS 兼容性与帧率仍需验证。

`node tools/build_miniprogram.mjs` 同时补齐了 `shared/trophies.js` 与 `shared/ui-art.js` 的滞后产物（48 件收藏档位与小乌龟标记此前只改了源文件）。

## 发布版剔除调试入口与单包瘦身（2026-10-02）

### 调试入口不进发布版

`lib/debug.js` 改成按运行环境决定是否提供开关：`wx.getAccountInfoSync().miniProgram.envVersion` 为 `develop`（开发者工具、预览）或 `trial`（体验版）时才存在，`release` 以及**不提供该接口的宿主**（部分多平台原生容器）一律视为发布版，取不到信号时按「不提供」处理，宁可少一个调试入口也不能误开。判定用白名单 `OPEN_ENVS = ['develop', 'trial']`，`undefined`、空串或将来新增的取值都会落到「不提供」。

收藏页新增 `debugAvailable`，`collection.wxml` 的调试按钮加 `wx:if="{{debugAvailable}}"`，`debugToggle()` 在未提供时直接返回，因此发布版既不显示按钮，也无法通过手工调用解锁。`LOCAL_DEBUG` 是本地兜底开关，仓库内固定 `false`，由 `app_miniprogram_visual.test.mjs` 直接对源文件断言，防止误提交。

存储键仍是独立的 `dopa-drill:mini:debug:v1`：既不写入 `settings`（避免与已下线的 `settings.collectionDebug` 迁移逻辑混淆），也保留「关闭开关即回收未真正获得的搭配」这一规则；「重置全部数据」同样清除该键。

### 单包瘦身

根因是生成器产出的 PNG 色彩深度过高，不是素材本身太多：`build_miniprogram_ui.mjs` 经 Resvg 直出**真彩色** PNG，`build_miniapp_icons.mjs` 用 256 色，而树里的角色 PNG 也是 256 色（滞后于生成器当前的 192 色参数）。`tools/optimize_miniprogram_assets.py` 原本只做「全部按 192 色压一遍」，既没有分组预算，也没有幂等性，实际未被应用。

重写为按目录分组、可重复执行的索引色重编码：角色 192 色、UI 图标/印章/贴纸/缩略图 128 色、原生应用图标 128 色。原生图标强制从 RGB 重编码——iOS 与 Android 不接受 alpha 通道，`app_miniapp_package.test.mjs` 会因色彩类型 4/6 或 `tRNS` 块失败。已在预算内的文件按原字节跳过，重复执行零改动。脚本在超限时以非零状态退出，可直接作为构建门槛。

| 分组 | 张数 | 前 | 后 |
| --- | ---: | ---: | ---: |
| `assets/guagua` | 57 | 969.2 KiB | 637.0 KiB |
| `assets/ui` | 47 | 182.7 KiB | 79.4 KiB |
| `miniapp/icons/ios` | 11 | 231.2 KiB | 145.3 KiB |
| `miniapp/icons/android` | 4 | 26.2 KiB | 17.6 KiB |
| `assets/guagua-icon.png` | 1 | 60.2 KiB | 38.0 KiB |
| **合计** | **120** | **1469.6 KiB** | **917.2 KiB** |

单包由 2,155,561 字节（超出 57 KiB）降到 **1,596,791 字节（约 1.52 MiB），余量 488.6 KiB**，本次共省 549 KiB。原图已备份到 `/tmp/asset-orig` 逐张比对：角色最大通道差 25、`appStore1024` 34、小乌龟标记 30，变动像素占比 0.0%–0.9%，肉眼无差别；图标确认重编码为色彩类型 3（索引色）且无 `tRNS`。对照图见 `../docs/preview/asset-quality.png`。

`build_miniapp_icons.mjs` 的调色板同步改为 128 色，避免下次重新生成图标又把体积顶回去；`AGENTS.md` 与本文档均已写明**任何素材生成命令之后必须补跑压缩脚本**。

验证：**123 项测试全部通过**（此前唯一失败的 `app_brand` 体积断言恢复）。新增用例「发布版不提供调试开关且无法被强行打开」覆盖 `release` 与缺少 `getAccountInfoSync` 两种宿主：按钮不显示、遗留存储标志不解锁、`debugToggle()` 不改动 `equip`。尚未构建 APK。
