# 英语答题不应增加数学数字输入统计

Status: ready-for-agent
Priority: P2
Type: task

## 问题

2026-10-04 审查 `main` 相较于 `origin/main` 时发现：`miniprogram/lib/english-practice.js` 的 `complete()` 向 `growth.noteSolve()` 传入 `cells: 1`，导致英语整题答对增加数学数字输入统计并解锁数字输入专有奖杯。

复现：将 `stats.cells` 设为 99，首次独立答对一个人教版英语单词，统计变为 100，并获得 `cells-100`（累计正确输入 100 位数字）奖杯。

依据：`.scratch/english-entry/spec.md:148` 要求数字输入数量相关任务／奖杯只收数学事件；`docs/adr/0002-subject-progress-shared-game-growth.md` 说明数学特有奖杯继续只计数学。

## 验收

- 英语答题不增加数学数字输入统计或触发数字输入专有奖杯。
- 英语有效答对仍推进共享整题、首次正确、欢乐值及通用任务指标。
- 数学答题和旧存档统计含义保持兼容。
- 回归覆盖数字奖杯阈值附近的英语答题，以及数学仍可正常解锁。

## Comments

2026-10-04：用户要求加入待修改清单，本次仅登记，不执行修复。
