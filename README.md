# 瓜瓜训练营 · 小程序与多端应用

原生 WXML／WXSS 应用，提供数学练习、英语中文默写、游戏成长、签到、日历和装扮收藏。微信小程序和 APK 共用原生页面，通用题目、计分与奖励模块由网页版源码生成。

## 如何使用

1. 在微信开发者工具中导入本仓库根目录。
2. 配置自己的小程序 AppID，编译后在首页选择数学或英语。
3. 数学可选择年级、“适合我的题”、专项或复习；首次正确率达标的基础练习可进入加时。
4. 英语在设置中选教材版本，在首页选年级、上下册及单词／常用语。先认识词条，再按中文和音标默写；点击字母格可修改，删除键长按清空，问号随机提示，眼睛查看答案。
5. 继续按钮恢复当前学科的未完成练习；设置中调整角色、音量和动效。退后台后暂停，返回时手动继续。

数据保存在设备本地，数学和英语学科进度独立，无账号登录或跨端同步。英语当前仅本地试用，未提供发音录音或听音默写。

## 如何部署

### 微信小程序

1. 在源仓库生成共享模块与内容包，并运行下文检查。ggCamp 是运行源码快照，生成工具与测试在 dopa-drill 源仓库执行。
2. 在开发者工具预览，并分别检查目标设备上的输入、保存、音乐、后台恢复和庆祝动效。
3. 配置自己的 AppID，上传版本；在小程序后台提交审核，审核通过后发布。AppSecret 与个人开发工具配置保持本地。
4. 发布英语内容前完成教材、来源授权与内容包审核；当前 draft、reference-only 教材不满足发布门槛。

### Android APK

1. 在开发者工具的多端应用模式配置应用名称、版本、平台 SDK 及签名。
2. 核对 `project.miniapp.json`：Android 媒体模块启用，发布时 vConsole 关闭，图标指向 `miniapp/icons/android/`。签名凭据保持本地。
3. 构建 APK 并安装到目标设备，验证冷启动、连续前后台切换、音频、键盘、图标和终场动画。
4. 容器配置、图标或 SDK 变更后重新构建安装；源码刷新不更新已安装的 APK。

正式 Android 包名、证书和签名流程见 [Android 发布配置](docs/deployment/android-release.md)。本仓库回归检查：`node --test tests/*.test.mjs`。

## 如何二次开发

在 dopa-drill 源仓库根目录执行：

```bash
node tools/build_miniprogram.mjs
node tools/build_miniprogram.mjs --check
node --test tests/*.test.mjs
```

正式英语内容另用 `node tools/build_miniprogram.mjs --check --publish` 检查发布条件；当前试用目录会被拒绝。该检查不能代替人工授权和教材校对。

- `shared/`：生成的共享模块，修改对应 `app/js/` 后再生成。
- `pages/`、`components/`：原生页面及组件。
- `lib/`：存储、练习流程、平台音频与视觉适配。
- `content/`：由源仓库 `content/english/` 生成的 CommonJS 教材包。
- `assets/` 与 `miniapp/icons/`：角色、音乐、界面与应用图标。

重新生成角色或图标后，运行 `python3 tools/optimize_miniprogram_assets.py`，检查 2 MiB 包体限制。APK 图标生成示例：

```bash
node tools/build_miniapp_icons.mjs /path/to/node_modules/sharp --android-only
python3 tools/optimize_miniprogram_assets.py
```

需对比 DOM 庆祝效果时，在源仓库运行 `node tools/preview_celebration_dom.mjs` 并查看生成的 `docs/preview/celebration-dom.html`。

## 文档与许可

- [英语内容开发](docs/english/README.md)
- [调试问题与解决记录](docs/debugging-history.md)
- [贡献与文档约定](AGENTS.md)
- [许可条件](LICENSE) 与 [素材说明](NOTICE.md)

通用代码采用 MIT，二次开发必须替换瓜瓜、年年的形象及相关视觉素材。
