# 瓜瓜计算营素材与许可说明

## 上游代码

通用答题、计分、成长、音频合成以及动画控制逻辑来自 gear_machine 的 MIT 授权项目。分发时保留 `LICENSE` 的 MIT 原版权声明和许可条款。原文件中的角色、名称和 Logo 例外仍保留，用于说明上游授权范围。

## 本次替换

2026-09-30：两端产品界面不再使用上游 Dopakichi 角色、Dopa Drill 名称或原 Logo。原存档键和部分内部标识保留，以兼容已有数据。

- 新角色设计稿：`docs/brand/guagua-character-concept-v1.png`，由内置 image_gen 按用户提供的两张参考图制作；提示与来源记录在同目录 `.prompt.txt`。
- 新角色正式素材（v2）：`docs/brand/guagua-sprites-v2.png`，内置 image_gen 依据已确认设计稿生成透明人物图集；欢迎、欢呼、思考姿态保持发型、脸部与衣服细节。提示记录在同目录 `.prompt.txt`。`tools/build_guagua_rasters.mjs` 导出两端 PNG 与独立配饰，`guagua.js` 复用 MIT 授权的通用动作控制逻辑。
- 新图标：`app/icon.png`（`app/icon.svg` 为兼容封装）；新 Logo：`docs/brand/guagua-logo.svg` 和两端页面中的彩色文字标识。
- 小程序导出：`miniprogram/assets/guagua/` 和 `guagua-icon.png`；由 v2 透明人物图集导出，不是原角色图片的改色版本。
- 原角色绘制模块、原角色参考 SVG、原小程序角色 PNG 已移除；WebGL 原角色轮廓改为算术符号。

本说明记录素材来源和替换范围，不改变或取消上游许可证。用户提供的参考图片未复制进仓库。产品正式发布时，保留 MIT 和字体 OFL 声明，并使用自己的产品名称及平台头像。

## 字体

`app/fonts/` 中 Dela Gothic One 和 Zen Maru Gothic 的版权和 SIL OFL 1.1 许可文件应随字体保留。中文使用设备系统字体。
