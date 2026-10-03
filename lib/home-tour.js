const { guideSteps } = require('../shared/guide-steps.js');
const targets = { '#start': '#tour-level', '.grades': '#tour-grades', '#open-tree': '#tour-tree', '#open-trophy': '#tour-trophy', '#open-collect': '#tour-collection' };
function pages(help) { return guideSteps(help).map(p => ({ ...p, target: targets[p.target] || '' })); }
function layout(rect, width, height) {
  const cardHeight = 222; const cardTop = Math.min(height - cardHeight - 12, rect ? rect.bottom + 18 : height * .48);
  return { holeStyle: rect ? `left:${rect.left - 5}px;top:${rect.top - 5}px;width:${rect.width + 10}px;height:${rect.height + 10}px;` : '', cardStyle: `left:18px;right:18px;top:${Math.max(180, cardTop)}px;`, actorStyle: `left:${width / 2 - 60}px;top:${Math.max(14, (rect ? rect.top : cardTop) - 152)}px;width:120px;height:138px;` };
}
module.exports = { pages, layout };
