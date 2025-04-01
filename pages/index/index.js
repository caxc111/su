// pages/index/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    loading: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 初始化应用数据
    const app = getApp();
    try {
      // 确保加载示例数据
      if (!app.globalData.articles || app.globalData.articles.length === 0) {
        console.log('初始化页面 - 尝试加载示例数据');
        app.initSampleData();
      }
    } catch (error) {
      console.error('初始化页面数据失败:', error);
    }
    
    // 延长加载时间，确保数据准备好
    setTimeout(() => {
      this.setData({
        loading: false
      });
      
      // 使用更可靠的方式跳转到练习页面
      try {
        // 由于article-list是tabBar页面，必须使用switchTab
        console.log('尝试跳转到文章列表页面');
        wx.switchTab({
          url: '/pages/article-list/article-list',
          success: () => {
            console.log('成功跳转到文章列表页面');
          },
          fail: (error) => {
            console.error('跳转到文章列表页面失败:', error);
            // 如果switchTab失败，通过修改全局变量标记页面
            getApp().globalData.pageToShow = 'article-list';
            console.log('设置全局标记，等待页面自动跳转');
            
            // 显示提示
            wx.showToast({
              title: '正在加载页面...',
              icon: 'loading',
              duration: 2000
            });
          }
        });
      } catch (navError) {
        console.error('导航错误:', navError);
        wx.showToast({
          title: '页面加载失败，请重启小程序',
          icon: 'none',
          duration: 3000
        });
      }
    }, 2000); // 延长到2秒，确保数据加载完成
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    console.log('首页 - onReady');
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    console.log('首页 - onShow');
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    console.log('首页 - onHide');
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    console.log('首页 - onUnload');
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    console.log('首页 - onPullDownRefresh');
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    console.log('首页 - onReachBottom');
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '顺口成章 - 提升口语表达能力',
      path: '/pages/index/index'
    }
  }
})