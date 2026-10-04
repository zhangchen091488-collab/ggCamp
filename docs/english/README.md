# 英语内容开发

英语教材通过统一内容包接入小程序与 APK，复用首页、角色、音乐和游戏成长。当前支持中文提示默写和英美音标；学科进度及未完成练习与数学分别保存。网页版英语、发音录音、听音默写、远端下载缓存及英语加时尚未接入。

## 如何使用

首页帮助按钮下切换英语，在设置中选择教材版本，在首页选择年级、上下册和单词／常用语，然后进入今日练习、继续或复习。两学科各保留一轮未完成练习，切换教材不会改写已经开始的题目快照。

现有教材为人教版一年级起点 1–6 年级上下册，默认三年级上册。内容仍为 draft、reference-only，仅本地非商业试用；未完成单元映射、逐条教材校对和读音资源准备。

## 内容结构

| 路径 | 用途 |
| --- | --- |
| `content/english/*.json` | 源内容包；稳定 ID、教材身份、单元、标准答案、中文提示、音标与资源声明 |
| `content/english/catalog.json` | 可选内容包及默认顺序 |
| `miniprogram/content/*.js` | 生成的原生 CommonJS 内容模块 |
| `docs/english/content-pack.schema.json` | 内容包结构约定 |
| `app/js/english-*.js` | 内容校验、判题、计划与掌握／复习纯逻辑 |
| `miniprogram/lib/english-practice.js` | 原生练习、存档与共享奖励衔接 |

`meaning` 表示中文提示默写，`dictation` 表示听音默写。音标不等于录音，资源 ID 不等于资源已经下载。发布前必须核对资源声明、实际文件和所需使用授权。

## 如何添加或更新教材

1. 先核实教材版本、来源及用途授权；按内容包契约整理词条。
2. 保留稳定 `itemId`、`canonical` 和 `acceptedAnswers`；补齐真实单元、适龄中文提示与合法答案，缺少上下文的条目列入待核对清单。
3. 将内容包加入源目录与 catalog。符合现有题型的教材通过内容配置接入，用户选择内容即可切换。
4. 校验内容、重新生成小程序模块、运行完整测试，并在开发者工具检查选册和练习。

`promptZh` 使用简短常用中文义，必要时标注单复数或目标语境。确认过的风格见 [提示样例](prompt-style-samples.md)，当前修改对照与待核对条目见 [整理清单](prompt-edit-report.md) 和 [原文对照](prompt-edit-audit.json)。重新导入时核查这些对照，避免覆盖已整理提示。

导入工具在源仓库执行：

```bash
python3 tools/inspect_english_xlsx.py /path/to/book.xlsx
python3 tools/import_english_xlsx.py /path/to/book.xlsx /path/to/pack.json --pack-id example-pack --title '教材名称' --grade 3 --semester first
node tools/import_english_dictionary.mjs /path/to/qwerty.json /path/to/candidate.json
```

XLSX 和 Qwerty 导入结果是候选内容，不代表已完成教材校对或可发布。

## 校验与发布

```bash
node tools/check_english_pack.mjs /path/to/pack.json
node tools/check_english_pack.mjs /path/to/pack.json --publish
node tools/build_miniprogram.mjs
node tools/build_miniprogram.mjs --check
node --test tests/*.test.mjs
```

发布前另运行 `node tools/build_miniprogram.mjs --check --publish`；当前试用目录会失败。发布检查不代替人工内容校对、版权授权或目标设备资源验证。

判题草稿、提示使用和提交次数保存在英语命名空间；共享奖励必须保持数学专有统计的含义。详细需求与实施范围见 [.scratch/english-entry/spec.md](spec.md)，待修复任务见 [issues/](../review/)。

历史接入、排查和阶段性验证记录统一保存在 [调试问题与解决记录](../debugging-history.md)。
