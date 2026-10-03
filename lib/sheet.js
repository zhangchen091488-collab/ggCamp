// Convert the shared cell coordinates to percentage positions for WXML.
function sheetView(problem, session) {
  const active = problem.steps[session.step];
  const marks = { ...(session.marks || {}) };
  if (active && active.marks) for (const m of active.marks) marks[m.c] = m.text;
  const cells = problem.cells.map((cell) => {
    const hidden = ['auto', 'carry'].includes(cell.kind) && !session.revealed.includes(cell.id);
    const isActive = !!active && active.cell === cell.id;
    let text = cell.text;
    if (cell.kind === 'input') text = session.values[cell.id] || (isActive ? session.wrong || '?' : '');
    if (cell.kind === 'mark') text = marks[cell.c] || '';
    const crossed = cell.id === `a${cell.c}` && marks[cell.c] != null;
    return { ...cell, text: hidden ? '' : text, active: isActive, bad: isActive && !!session.wrong, crossed, style: `left:${100 * cell.c / problem.cols}%;top:${100 * cell.r / problem.rows}%;width:${100 * (cell.cs || 1) / problem.cols}%;height:${100 * (cell.rs || 1) / problem.rows}%;` };
  });
  const lines = problem.lines.filter((line) => !line.hidden || session.revealed.includes(line.id)).map((line, index) => ({ id: line.id || `line${index}`, style: `left:${100 * line.c0 / problem.cols}%;top:${100 * (line.r + 1) / problem.rows}%;width:${100 * (line.c1 - line.c0 + 1) / problem.cols}%;` }));
  let bracket = null;
  if (problem.bracket) { const b = problem.bracket; bracket = `left:${100 * b.c0 / problem.cols}%;top:${100 * b.r / problem.rows}%;width:${100 * (b.c1 - b.c0 + 1) / problem.cols}%;height:${100 / problem.rows}%;`; }
  return { cells, lines, bracket, marks, style: `--cell-size:${Math.min(42, 290 / problem.cols)}px;height:${Math.max(130, problem.rows * Math.min(42, 290 / problem.cols))}px;font-size:${Math.min(30, 240 / problem.cols)}px;` };
}
module.exports = { sheetView };
