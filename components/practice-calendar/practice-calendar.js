const { monthModel, dayRecords } = require('../../lib/calendar-model.js');
Component({
  properties: { refresh: { type: Number, value: 0, observer() { if (this.year != null) this.render(); } }, showSignIn: Boolean },
  data: { cells: [], selected: null },
  lifetimes: { attached() { const now = new Date(); this.year = now.getFullYear(); this.month = now.getMonth(); this.render(); } },
  methods: {
    render() { const store = getApp().store; this.setData({ ...monthModel(store, this.year, this.month), motion: Number(store.state.settings.motion) > 0 }); },
    move(e) { const d = new Date(this.year, this.month + Number(e.currentTarget.dataset.delta), 1); if (d > new Date()) return; this.year = d.getFullYear(); this.month = d.getMonth(); this.render(); },
    inspect(e) { const selected = dayRecords(getApp().store, e.currentTarget.dataset.key); if (selected) this.setData({ selected }); },
    close() { this.setData({ selected: null }); }, noop() {},
  },
});
