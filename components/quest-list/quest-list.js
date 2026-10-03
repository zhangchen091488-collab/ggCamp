Component({ properties: { rows: { type: Array, value: [], observer(rows) { this.setData({ allDone: rows.length > 0 && rows.every(r => r.done) }); } } }, data: { allDone: false } });
