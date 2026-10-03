// Generated from app/js/guide-steps.js by tools/build_miniprogram.mjs. Do not edit.
const INTRO = { title: '玩法说明', text: '你可以用三种方式\n选择练习题' };
const LEVEL = { target: '#start', title: '适合我的题', text: '挑选适合你水平的题目。\n第一次先做能力测评' };
const GRADES = { target: '.grades', title: '一年级到六年级', text: '选择年级\n集中练习相应的题目' };
const TREE = { target: '#open-tree', title: '技能树', text: '选择一个想练习的技能\n开始专项练习' };
const TROPHY = { target: '#open-trophy', title: '奖杯', text: '练习就能获得奖杯。\n坚持练习，收获更多奖励' };
const COLLECTION = { target: '#open-collect', title: '收藏', text: '奖杯会解锁新的收藏。\n可以选择背景、音乐\n和角色装扮' };
const LAST = { target: '#start', title: '从适合我的题开始吧！', text: '点击首页的问号\n就能再次查看玩法说明', recommend: true };

function guideSteps(help = false) { return [INTRO, LEVEL, GRADES, TREE, ...(help ? [TROPHY, COLLECTION] : []), LAST]; }

module.exports = { guideSteps };
