Page({
  onLoad() { const store = getApp().store; store.state.homeSubject = 'english'; store.save(); wx.reLaunch({ url: '/pages/home/home' }); },
});
