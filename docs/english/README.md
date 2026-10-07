# 英语内容开发

英语教材通过统一内容包接入小程序与 APK，复用首页、角色、音乐和游戏成长。当前支持中文提示默写和英美音标；学科进度及未完成练习与数学分别保存。网页版英语、发音录音、听音默写、远端下载缓存及英语加时尚未接入。

## 如何使用

首页帮助按钮下切换英语，在设置中选择教材版本，在首页选择年级、上下册和单词／常用语，首页统一使用「技能树」入口，英语技能树以单元节点展示教材顺序，点击节点查看详情并开始练习，详情中可进入词表和学习卡。「学校学到哪里」在技能树内单独设置已学范围，「组合练习」选择多个单元。今日练习和首页错题复习限定已学范围。两学科各保留一轮未完成练习，切换教材不会改写已经开始的题目快照。

现有教材为人教版一年级起点 1–6 年级上下册，以及田园外语版三年级上册。默认教材保持原选择。田园版提供十个单元、117 个练习词条；62 条完整句子另存于[来源整理表](tianyuan-g3-first-review.md)，暂未加入句子默写。人教版继续标注整册试用。内容仍为 draft、reference-only，逐条教材校对和读音资源准备尚未完成。

首次选择田园版需标记学校已学单元；任意单元均可主动练习。勾选已学不会直接标记掌握；每册范围独立保存，改范围不改未完成的题目。单元掌握、待巩固和到期数由词条记录汇总。

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

判题草稿、提示使用和提交次数保存在英语命名空间；共享奖励必须保持数学专有统计的含义。详细需求与实施范围见 [.scratch/english-entry/spec.md](../../.scratch/english-entry/spec.md)，待修复任务见 [issues/](../../.scratch/english-entry/issues/)。

历史接入、排查和阶段性验证记录统一保存在 [调试问题与解决记录](../debugging-history.md)。
