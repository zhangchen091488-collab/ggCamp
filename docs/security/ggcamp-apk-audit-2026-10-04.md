# ggCamp 发布 APK 检查与存档修复

日期：2026-10-04。本轮只修改存档校验；APK 只读检查，未重新签名或打包。

## 存档修复

- `miniprogram/lib/storage.js`：在迁移前过滤 null、数组及其它非对象历史元素；保留正常历史、奖励和其它记录，显示恢复提示。
- `miniprogram/lib/english-practice.js`：在访问英语练习前校验命名空间、进度容器、教材计划、题目数组、索引、作答字段和日期；移除不能继续的练习，保留其余有效进度。合法旧版练习仍完成奖励字段迁移。
- 新增回归验证：坏历史在新旧存档版本中都可恢复；坏英语练习不阻断新练习；正常旧练习保留输入、提示与提交记录。
- 定向 27 项、全量 162 项测试通过；生成模块一致性检查通过。修复写入开发仓库并同步到本地 ggCamp 检出目录，尚未提交或推送。

## 被检查的安装包

- 文件：用户提供目录下的 `app.apk`（路径中的多余 `]` 已校正）。
- SHA-256：`cda5b39fc91865bb1426bb42bf06649051b7eff4b6b17884fa7ba943e7f6a1ce`。
- 大小：62,688,649 字节；版本：0.9.0 / 100。
- 包名：`com.tencent.weauth`；Application：`com.tencent.weauth.DemoApplication`。
- 最低 API 24，目标 API 29；构建元数据时间：2026-10-04 14:10:43。
- 包内 SDK 1.7.0，扩展 SDK 元数据为 media、install、open。
- 解包 149 个业务资源文件，Gitleaks v8.30.1 扫描无密钥发现。业务配置中 vConsole 为 close；SDK 包含调试脚本文件不等于调试入口已开启。
- 这是修复前的包，需重新构建才能包含本轮修改。

## 发布前需要处理

### 1. 使用正式应用身份和发布签名

包内证书 Subject / Issuer 为 `Android Debug`，证书 SHA-256 为 `ab6e8006fa99c84fe1ee93a956470a97dd45a7847750970293436b6c2a109c81`。检测到 v1/v2/v3 签名结构，但本轮没有用 apksigner 完成密码学校验。

结合 DemoApplication 与 `com.tencent.weauth` 包名，该产物具有开发工具默认测试宿主特征，不应直接当作正式发布产物。应配置自己的应用包名和正式签名，妥善保管签名密钥，再构建发布包。Android 官方要求发布构建使用自己的发布证书：[发布准备](https://developer.android.com/studio/publish/preparing)。不将签名私钥提交到仓库。

### 2. 收敛原生权限

最终 Manifest 声明 23 项权限，明显多于当前训练业务；业务源码 SDK 开关与合并后 Manifest 不是一回事。

| 权限组 | 当前业务判断 |
| --- | --- |
| RECORD_AUDIO、CAMERA | 当前没有录音、拍照功能；本地音乐播放不需要麦克风权限，应移除未使用能力 |
| ACCESS_FINE_LOCATION、ACCESS_COARSE_LOCATION | 没有定位功能，应移除 |
| READ_PHONE_STATE | 没有相关业务，应移除 |
| REQUEST_INSTALL_PACKAGES | 没有安装其它应用的功能，应移除或给出宿主必需依据 |
| READ/WRITE_EXTERNAL_STORAGE | 存档和内置音频通常可使用应用私有存储，核对宿主后移除不必要的共享存储访问 |
| BLUETOOTH、BLUETOOTH_ADMIN | 当前不使用，应移除 |
| CHANGE_WIFI_STATE、CHANGE_NETWORK_STATE、CHANGE_WIFI_MULTICAST_STATE | 当前无修改网络业务，核对宿主依赖并移除不必要能力 |
| INTERNET、ACCESS_NETWORK_STATE、ACCESS_WIFI_STATE | 宿主可能使用，需以运行验证说明保留原因 |
| WAKE_LOCK、FOREGROUND_SERVICE、VIBRATE | 核对宿主播放或震动用途；不因声明存在就认定必要 |
| ALARM_LOCK、freemme.permission.msa | 宿主声明，未发现对应业务需求，核对构建来源与必要性 |
| 自定义签名权限 | VFS 和动态广播权限属于宿主内部通信；与危险权限分别审查 |

声明危险权限不等于已获用户授权，也不能仅凭声明断言 SDK 实际采集了数据。`assets/miniapp-permission.json` 的 runtimePermissions 为空，但不能抵消 Manifest 声明。

Manifest 还声明相机为必需硬件（`uses-feature android.hardware.camera required=true`），会影响无相机设备适配。应随未使用相机能力一并处理。

Android 官方建议只声明与业务有关且必要的权限：[权限概述](https://developer.android.google.cn/guide/topics/permissions/overview?hl=zh-cn)。调整应在原生宿主或正式打包配置中完成，本轮没有猜测 SDK 不支持的配置键，也没有修改或二次封装 APK。

### 3. 禁止不必要的明文网络

Manifest 的 `usesCleartextTraffic=true`，未发现 networkSecurityConfig 覆盖。当前不能证明业务发生了敏感数据 HTTP 传输，但发布产物允许明文请求。应核对宿主实际通信，默认禁用明文；如有必须的本地回环通信，使用限定域的例外并回归音频与启动流程。[Android 网络安全建议](https://developer.android.google.cn/privacy-and-security/security-best-practices?hl=en)。

### 4. 核对目标 SDK 与发布渠道要求

targetSdkVersion 为 29（Android 10），compileSdkVersion 为 33。应选择宿主支持的目标 SDK，并核对拟发布渠道的当前要求；本轮没有指定发布商店，不能据此宣布满足渠道审核。

## 已确认与检查边界

- `allowBackup=false`；Manifest 未声明 debuggable=true。
- 导出组件包含启动 Activity、微信登录和支付回调 Activity；provider 均未发现 exported=true。本轮未验证 Intent 参数处理，不将导出回调本身判为漏洞。
- 51 个 arm64 原生库。已做清单检查，未完成全部 SDK 原生代码审计、准确组件版本归属或 CVE 适配判断。
- 未安装到真机、未验证权限弹窗、拒绝权限后的音频和练习、SDK 网络采集、Intent 注入及新签名的升级流程。
- 教材授权仍是前一份源码扫描报告中的未完成发布事项。

结论：存档校验修复已通过测试；该 APK 建议只用于测试。重新配置正式宿主身份、签名和最小权限后，重新构建再做安装验证与复查。

## 原始证据

- [APK 自动检查结果](ggcamp-apk-audit-2026-10-04.json)
- [解码后的 AndroidManifest](ggcamp-apk-manifest-2026-10-04.xml)
- [业务资源密钥扫描](ggcamp-apk-business-gitleaks-2026-10-04.json)
