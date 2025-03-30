Page({
  data: {},
  onLoad() {
    // 自动跳转到首页
    wx.switchTab({
      url: '/pages/student/article-list/article-list'
    });
  }
}) 