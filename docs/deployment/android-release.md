# Android 正式发布配置

## 应用身份

- 正式包名：`com.chen.ggcamp`，配置于 `project.miniapp.json` 的 `mini-android.packageName`。
- 签名别名：`ggcamp-release`。
- 发布密钥：`~/.ggcamp/signing/ggcamp-release.p12`；本地凭据：同目录 `credentials.json`。目录权限 700，私钥及凭据权限 600。
- 公钥证书：同目录 `ggcamp-release.cer`。
- 公钥证书 SHA-256：`9E:CB:C0:69:0B:C0:86:72:1C:81:AD:61:A1:EC:6A:9E:C0:FE:52:1B:79:37:C6:47:3A:C9:4B:7E:E8:45:AE:67`。

密码不写入项目文件或聊天。请把私钥和凭据备份到自己控制的加密存储；后续更新继续使用同一发布密钥，不重新生成。凭据文件与私钥同目录是本机访问控制措施，不替代加密备份。正式包名与原测试宿主 `com.tencent.weauth` 不同，不能把新应用视为原测试应用的覆盖升级；原测试应用的本地记录不会自动迁移。

## 权限配置

当前保留音频所需 media 扩展；显式关闭 install、open 及原先禁用的扩展。`uselessPermissions` 移除定位、录音、相机、电话状态、共享存储、蓝牙、安装其它应用与网络修改等 15 项权限。

配置项已依据本机官方 Toolkit 0.11.0 的 `android/dist/types.d.ts` 与权限更新实现核对：短权限名转换为 `android.permission.*`，其它完整名称保持原样，并通过 Manifest 合并移除。不能只检查配置文件就宣称新 APK 已收敛；需要检查实际产物。修改后回归启动、内置音乐、退后台恢复、存档及庆祝动画。

正式原生宿主还需设置 `android:usesCleartextTraffic="false"`，删除或设为可选的相机 `uses-feature`；目前没有确认可在项目 JSON 中设置这两项的配置键，不能添加猜测字段。若当前云构建仍保留这些声明，应在平台支持的正式原生工程或构建入口调整。不要修改 SDK 安装目录或直接改旧 APK。

## 正式构建与签名

1. 在正式应用的构建入口使用上述包名；如平台要求应用身份登记，请登记对应包名和发布证书指纹。开发工具顶部“正式版”运行模式不等于已经使用自己的包名和发布签名。
2. 用当前代码重新构建 APK。旧测试 APK 不包含本次存档修复，不能直接重签替代重新构建。平台可能校验内嵌小程序与宿主身份绑定，必须由正式构建入口生成匹配的包。
3. 若构建入口支持发布证书，使用本地证书和别名，密码从本地凭据读取；不要上传私钥到未确认用途的第三方服务。若走本地签名，可使用下方工具。
4. 签名后检查包名、Manifest、指纹，并安装到真机验证拒绝不必要权限时仍能练习和播放音乐。

本地签名工具需要 `androguard` 作为 APK 只读分析依赖，与应用运行依赖无关：

```sh
python3 -m venv /tmp/ggcamp-signing-venv
/tmp/ggcamp-signing-venv/bin/pip install androguard==4.1.4
/tmp/ggcamp-signing-venv/bin/python tools/sign_android_release.py /绝对路径/新构建.apk --out /绝对路径/app-release.apk
```

工具先拒绝错误包名、未收敛权限、调试配置、明文流量与必需相机，再调用本机官方 apksigner，通过环境变量传递密码。仅输出新文件，签名后执行密码学校验；不修改或重新封装输入 APK。要求输入是构建链已经完成对齐的 APK，工具不改变构建链的对齐处理。

截至 2026-10-04，发布密钥已生成，项目配置已写入；尚未得到重新构建的正式 APK，因此未确认正式应用身份绑定、权限收敛和安装验证。
