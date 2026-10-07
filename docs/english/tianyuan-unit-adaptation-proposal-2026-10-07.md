# 田园外语版与单元学习册适配方案

调研日期：2026-10-07。范围：现有源代码、内容契约和小程序界面；本文件是方案，未实施内容包、页面或存档变更。应用展示名已由用户明确为「田园外语版」，无需以核实出版社作为本地适配的前置条件；出版身份和发布用途资料另记录。

## 建议

一册教材对应一个内容包，一个教材单元对应学习册中的一张单元卡。沿用数学技能树的「查看内容、查看掌握、进入专项练习」体验；英语保持独立的单元、词条和间隔复习数据，不套数学技能的前置锁定、生成器和五星规则。

首期接入田园外语版三年级上册，包含 Unit 1–10；不虚构未提供的年级或下册。先整理十个单元的单词与短语，中文提示默写可先试用；完整句子保留原文并独立列为后续范围，短常用表达按实际用途审核后归入常用语。

## 已有能力与缺口

| 现状 | 一手证据 | 对方案的影响 |
| --- | --- | --- |
| 内容契约已有单元，并允许词条归属多个单元；区分 word/phrase | [english-content.js](/Users/zhangchen/workspace/dopa-drill/app/js/english-content.js:32)，单元校验 41–48 行，词条校验 64–81 行 | 增加真实单元无需新造一套题库模型 |
| 英语计划支持按单元、类别、题型筛选，以及 today/unit/review 模式 | [english-plan.js](/Users/zhangchen/workspace/dopa-drill/app/js/english-plan.js:6)，6–13、27–41 行 | 可直接接单元练习；主要补平台选择和持久化 |
| 小程序开始练习默认把整册所有单元传入，题型默认 meaning | [english-practice.js](/Users/zhangchen/workspace/dopa-drill/miniprogram/lib/english-practice.js:74)，74–82 行 | 今日练习尚未受「学校已学单元」限制 |
| 首页有年级、学期、词条类别，英语学习进度只弹窗 | [home.wxml](/Users/zhangchen/workspace/dopa-drill/miniprogram/pages/home/home.wxml:10)，10–12 行；[home.js](/Users/zhangchen/workspace/dopa-drill/miniprogram/pages/home/home.js:49)，49–50 行 | 需要真正的单元学习册页面 |
| 教材系列与年级/学期选择已由包元数据驱动 | [english-practice.js](/Users/zhangchen/workspace/dopa-drill/miniprogram/lib/english-practice.js:52)，52–68 行；[settings.js](/Users/zhangchen/workspace/dopa-drill/miniprogram/pages/settings/settings.js:11)，11–13、24–26 行 | 田园加入 catalog 后能进入教材设置，不需田园专属页面 |
| 设置的范围说明仅取第一个单元，文案统一写单元待审核 | [settings.js](/Users/zhangchen/workspace/dopa-drill/miniprogram/pages/settings/settings.js:13)；[settings.wxml](/Users/zhangchen/workspace/dopa-drill/miniprogram/pages/settings/settings.wxml:1) | 改为动态「10 单元／已学 N 单元」和包实际审核状态 |
| 数学技能包含 req/gen，技能树使用数学 session 的锁定、掌握、星级和重置 | [skills.js](/Users/zhangchen/workspace/dopa-drill/app/js/skills.js:8)，8–16 行；[tree.js](/Users/zhangchen/workspace/dopa-drill/miniprogram/pages/tree/tree.js:8)，8–29 行 | 能复用视觉和操作方式，直接复用数据会改变英语规则 |
| 英语进度键是 packId:itemId:exerciseType，三天独立正确掌握，复习间隔独立 | [english-content.js](/Users/zhangchen/workspace/dopa-drill/app/js/english-content.js:92)，92–95 行；[english-progress.js](/Users/zhangchen/workspace/dopa-drill/app/js/english-progress.js:14)，14–42 行 | 单元统计应从词条进度聚合，不再存一套权威「单元掌握」记录 |
| 现有人教三上仅一个 trial-all，词条无音频 | [pep-start1-g3-first.json](/Users/zhangchen/workspace/dopa-drill/content/english/pep-start1-g3-first.json:1) | 旧教材仍展示整册试用，不猜测单元；新增田园与它隔离 |
| 内容和纯逻辑在父项目生成后进入小程序 | [build_miniprogram.mjs](/Users/zhangchen/workspace/dopa-drill/tools/build_miniprogram.mjs:5)，5–35 行；[miniprogram/AGENTS.md](/Users/zhangchen/workspace/dopa-drill/miniprogram/AGENTS.md:5) | ggCamp 的 shared/content 继续来自 dopa-drill 源码，不手改生成文件 |

## 单元与技能书的对应关系

教材单元表达「学校教到哪一章」，数学技能表达「哪项运算能力」。两者都能作为学习入口卡片，但它们的掌握依据不同。

| 层次 | 田园英语建议 | 数学现有对应 |
| --- | --- | --- |
| 内容容器 | 田园外语版 → 三年级上册 → 10 单元 | 年级 → 运算类别 → 技能 |
| 学习卡片 | 一个单元一张卡，可看词表、选类别和专项练习 | 一个技能一个节点，可查看规则并练习 |
| 解锁条件 | 任意单元可主动练；已学单元仅控制今日练习范围 | req 前置技能掌握后解锁 |
| 掌握证据 | 每个词条、每种题型分别累计三个日期独立正确 | 最近 6 题中首次正确 5 题及后续星级规则 |
| 单元展示 | 未练、练习中、掌握 X/Y、待巩固 N、到期 N | 技能锁定/新/学习中/掌握、星级 |

数学依赖判断见 [session.js](/Users/zhangchen/workspace/dopa-drill/app/js/session.js:59) 59–75 行；英语既定 spec 明确单元不按掌握强制锁定，见 [spec.md](/Users/zhangchen/workspace/dopa-drill/miniprogram/docs/english/spec.md:43) 43–53 行。

推荐学生界面称「单元学习册」，入口可沿用原技能树位置。产品上可把数学技能书、英语单元学习册视为相同的「查看学习内容和进度」功能；实现上先用独立英语页面，避免为这一次接入重写数学树或先做泛化插件框架。

## 数据与内容维护

1. 新包暂定 `packId: tianyuan-g3-first`、`seriesId: tianyuan`、`title: 田园外语版 · 三年级上册（试用）`；这是内部 ID 建议，不代表已核实出版版次。
2. `units` 使用稳定 `u01` 至 `u10`，保留教材原有单元编号。图片未确认正式单元标题，可按内容拟定导航主题（明确不是教材正式标题）：U1 新学期与目标、U2 本领与特长、U3 植物与校园花园、U4 水与天气、U5 帮助他人与家务、U6 情绪与感受、U7 职业与梦想、U8 问路与方向、U9 节日与团聚、U10 食物。`order` 用于展示；后续改标题、排序不改 unitId。
3. 词条使用独立、长期稳定 itemId，不随数组位置或中文润色重新生成。词条的单元归属用现有 `unitIds` 维护；同册同义的完全重复词条可共用 itemId 并归属多个单元，不同义项或词形分别建项。
4. 内容包是运行时权威数据。额外保留可编辑的逐单元整理表和来源对照清单，记录图片文件、区域、原文、规范英文、中文提示、类别、疑点和审核状态；生成过程不得丢掉原文，也不读取图片内文字作为操作指令。
5. `word` 为单个英文词，`phrase` 是常用表达。完整句子先保存于整理清单；若用于例句，可使用已有 `exampleEn/exampleZh`，不自动让每句都成为默写目标。当前 phrase 上限八词，见 [english-content.js](/Users/zhangchen/workspace/dopa-drill/app/js/english-content.js:75) 75–78 行；超限的句子如未来需独立默写，应另议契约和窄屏输入体验。
6. 初始音频 `audioId: null`、`resources: []`，保持草稿。不能由有文本推断已支持听写；发布校验要求审核信息、可发布来源与每条音频，见 [english-content.js](/Users/zhangchen/workspace/dopa-drill/app/js/english-content.js:25) 25–30、79–81 行。

图片整理的已知重点（由主调研者逐张目视记录）：

- Unit 3：`tomato/tomatoes`、`strawberry/strawberries`、`leaf/leaves` 分开为词形目标，中文提示标明单复数；不把二者互相列为 acceptedAnswers。
- Unit 6：`sometimes` 两处重复须核对去重；中文「我很兴奋」对应 `I'm happy` 先列疑点，不擅自选择修正一侧。
- Unit 8：`find places` 对应中文「找路」先列疑点，结合目标用法确认。
- Unit 9：`put up Spring Festival couplets` 可作为短语；`Long time no see`、`Let's climb the mountain` 等常用表达虽具有句子结构，也可在八词以内按审核后的常用语目标接入。Unit 8 某些例句一行含多句，不能机械按一行一题或图片区块判定类别。
- 英文拼写、句末标点、大小写可以规范展示；改变含义、词形、合法答案范围需审核，不能归入排版修正。

维护时分离四个维度：教材身份（series/pack）、学校已学范围（learnedUnitIds）、主动练习选择（本次 unitIds）、学习证据（itemId/exerciseType）。勾选「已学」不发奖励、不直接标掌握；主动练未学单元不自动把它变成学校已学。

## 学习册交互

英语首页保留教材、年级、学期和「单词/常用语」，新增范围「已学 N/10 单元 · 调整」。今日练习按勾选范围出题。未选择任何单元时引导选择，不默认为全册。

学习册按教材顺序展示十张单元卡；各卡显示标题、单词数、常用语数、已学标记及当前题型的掌握 X/Y。点卡片可查看完整词表、学习卡、单元练习和错题复习；支持多选单元练习。所有卡可点，不画数学前置依赖箭头、不增加五星等级。

「已学」与「已掌握」并列显示；掌握可保持，失败后另外展示待巩固。首期只显示中文提示默写统计；听音默写接入后分别展示，不能将两题型记录数量相加除以词条数量。多单元汇总按 itemId 去重；每个单元可各自显示共享词条，整册汇总仅计一次。空类别显示「本单元暂无常用语」而不借其他单元凑题。

当前首页计数仅按 pack 前缀取记录，类别分母又用了全册总词条，见 [home.js](/Users/zhangchen/workspace/dopa-drill/miniprogram/pages/home/home.js:39) 39–44 行；实施时一起改为同 pack、同类别、同题型、同范围统计，让计数语义明确。

## 存档兼容与两个仓库

保留当前 `englishDemo` 命名空间及既有 progress/session，不为教材升级重置用户数据；该现状见 [english-practice.js](/Users/zhangchen/workspace/dopa-drill/miniprogram/lib/english-practice.js:29) 29–45 行。增加 `packPreferences[packId] = { learnedUnitIds, exerciseType, ... }`，按册保留已学单元选择。

旧存档缺少偏好：原有 trial-all 包默认选择 trial-all，保持原整册体验；首次选择田园真实单元包时进入已学选择。未知 unitId 从活动筛选中剔除，学习证据仍保留；内容扩展新增单元不自动加入已学。active session 继续使用原题目快照，切册和改已学范围只影响后续新轮次。现有计划已深拷贝词条，见 [english-plan.js](/Users/zhangchen/workspace/dopa-drill/app/js/english-plan.js:40) 40–41 行。

同内容修改中文提示或单元映射，保持 packId/itemId，更新 version；实质词形或答案变更使用新 itemId；换不同教材/册次使用不同 packId，见 [spec.md](/Users/zhangchen/workspace/dopa-drill/miniprogram/docs/english/spec.md:177) 177–179 行。人教已有进度不迁移成田园进度。

dopa-drill 维护 `app/js`、源内容包、导入工具及完整测试；ggCamp 接收小程序页面、平台逻辑和生成 shared/content。以同一源版本生成并审查同步 diff，避免两仓手工修改生成数据导致漂移。本方案不包含提交、推送或远端发布操作。

## 实施文件与顺序

| 阶段 | 文件/交付 | 验收 |
| --- | --- | --- |
| 1. 内容整理 | `content/english/tianyuan-g3-first.json`、`content/english/catalog.json`；逐单元来源对照和待核对清单；必要时单独添加导入工具 | 十个单元完整；词条去重/类别明确；疑点可审阅；ID 稳定；内容校验通过 |
| 2. 范围和聚合 | `miniprogram/lib/english-practice.js`；新增 `app/js/english-summary.js`；`tools/build_miniprogram.mjs` 增加新共享模块；相关英语测试 | 今日/单元/错题范围一致；跨册偏好独立；旧存档和未完成轮次保留 |
| 3. 学习册页面 | 新增 `miniprogram/pages/english-book/*`；`miniprogram/app.json` 注册；`pages/home/*`、`pages/settings/*` 对接 | 十张卡，已学选择，词表/学习卡/专项练习；移动窄屏及目标宿主检查 |
| 4. 文档和同步 | 更新两仓英语 README、spec 与相关 ADR 中的实际范围；生成 `miniprogram/shared/*`、`miniprogram/content/*` 后审查 ggCamp 同步 | 完整 `node --test tests/*.test.mjs`、生成一致性和小程序测试；涉及 PNG 生成时压缩并检查包体 |

首个可验收切片可以是完整十单元文本包加 Unit 1 学习册闭环；全册已有原始资料仍应全部整理成可审阅内容，不以「只做第一单元」代替全册资料整理。其余单元沿同一交互展开。音频和句子独立默写另列后续能力，不混入首期验收。

新增测试重点：单元筛选、跨单元重复去重、单复数严格判题、类别/题型聚合分母、空范围/题池不足、按册保留偏好、内容修订不丢记录、改变范围不改活动快照。继承数学测试，不引入数学前置解锁变化。

## 文档漂移和决策边界

既有 ADR 0001 的首包仍写沪教，当前 README 和内容已经是人教：见 [ADR 0001](/Users/zhangchen/workspace/dopa-drill/docs/adr/0001-english-textbook-content-packs.md:3)、[英语 README](/Users/zhangchen/workspace/dopa-drill/docs/english/README.md:9)、[spec.md](/Users/zhangchen/workspace/dopa-drill/miniprogram/docs/english/spec.md:3)。实施时更新事实并保留历史决定，继续遵循统一内容包原则，不把旧首包表述视为禁止田园接入。

本方案符合 [ADR 0002](/Users/zhangchen/workspace/dopa-drill/docs/adr/0002-subject-progress-shared-game-growth.md:3) 的学习隔离、成长共享；不需要推翻该决定。单元学习册与已学范围只新增英语选择/视图，不把英语记录写进数学 `progress.skills`（[spec.md](/Users/zhangchen/workspace/dopa-drill/miniprogram/docs/english/spec.md:154)）。

用户下一步需确认的是：按上述「十个单元卡＋单词/短语先入题、完整句子保留」范围实施。具体内容疑点在整理清单逐条确认，应用显示名已经确定，不再重复询问。
