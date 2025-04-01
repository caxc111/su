// pages/student/profile/profile.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: {
      nickname: '未登录用户',
      avatar: '/images/default-avatar.png',
      level: '初学者',
      studyDays: 0,
      totalArticles: 0,
      totalTime: 0
    },
    rewards: [],
    totalFlowers: 0,     // 总的小红花数量
    showFireworks: false, // 是否显示烟花动画
    fireworks: [],       // 烟花数组
    isLoading: true,
    hasUserInfo: false,
    inviteCode: '0L3L',
    assistValue: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 尝试加载用户信息
    this.loadUserData();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    // 页面渲染完成
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 每次页面显示时刷新数据
    this.loadUserData();
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    // 页面隐藏
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    // 页面卸载
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    // 下拉刷新，重新加载数据
    this.loadUserData(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    // 上拉加载更多奖励
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '顺口成章 - 提升口语表达能力',
      path: '/pages/index/index'
    }
  },

  // 加载用户数据
  loadUserData(callback) {
    this.setData({ isLoading: true });
    
    // 获取应用实例
    const app = getApp();
    
    // 设置模拟数据
    setTimeout(() => {
      // 获取阅读记录数量
      const totalArticles = app.globalData.readingRecords ? app.globalData.readingRecords.length : 0;
      
      // 获取总学习时间
      let totalTime = 0;
      if (app.globalData.readingRecords && app.globalData.readingRecords.length > 0) {
        totalTime = app.globalData.readingRecords.reduce((total, record) => total + (record.duration || 0), 0);
      }
      
      // 获取奖励
      const rewards = app.globalData.rewards || [];
      
      // 计算总的小红花数量
      const totalFlowers = this.calculateTotalFlowers(app.globalData.readingRecords || []);
      
      this.setData({
        userInfo: {
          nickname: '顺口用户',
          avatar: '/images/default-avatar.png',
          level: this.calculateLevel(totalArticles),
          studyDays: Math.min(30, totalArticles + 5), // 模拟学习天数
          totalArticles: totalArticles,
          totalTime: Math.floor(totalTime / 60) // 转换为分钟
        },
        rewards: rewards,
        totalFlowers: totalFlowers,
        isLoading: false,
        hasUserInfo: true
      });
      
      if (callback) callback();
    }, 500);
  },
  
  // 计算总的小红花数量
  calculateTotalFlowers(records) {
    let total = 0;
    records.forEach(record => {
      if (record.score >= 95) {
        total += 3;
      } else if (record.score >= 85) {
        total += 2;
      } else if (record.score >= 75) {
        total += 1;
      }
    });
    return total;
  },
  
  // 根据练习文章数计算用户等级
  calculateLevel(articlesCount) {
    if (articlesCount >= 50) return '大师级';
    if (articlesCount >= 30) return '高级';
    if (articlesCount >= 15) return '中级';
    if (articlesCount >= 5) return '初级';
    return '初学者';
  },
  
  // 获取用户信息
  getUserProfile() {
    wx.showToast({
      title: '登录功能暂未开放',
      icon: 'none'
    });
  },
  
  // 清除缓存
  clearCache() {
    wx.showModal({
      title: '确认清除',
      content: '这将清除所有本地数据，是否继续？',
      success: (res) => {
        if (res.confirm) {
          try {
            wx.clearStorageSync();
            wx.showToast({
              title: '缓存已清除',
              icon: 'success'
            });
            
            // 重置全局数据
            const app = getApp();
            app.globalData.articles = [];
            app.globalData.readingRecords = [];
            
            // 重新初始化数据
            app.initSampleData(true);
            
            // 刷新页面数据
            this.loadUserData();
          } catch (e) {
            wx.showToast({
              title: '清除失败',
              icon: 'none'
            });
          }
        }
      }
    });
  },
  
  // 关于我们
  showAbout() {
    wx.showModal({
      title: '关于顺口成章',
      content: '顺口成章是一款帮助用户提升口语表达能力的小程序。通过朗读和背诵练习，培养流利自然的语言表达。\n\n版本: 1.0.0',
      showCancel: false
    });
  },
  
  // 重启小程序
  restartApp() {
    // 获取应用实例
    const app = getApp();
    if (app && app.restartApp) {
      app.restartApp();
    }
  },

  // 显示烟花动画
  showFlowerAnimation() {
    // 生成25-35个随机位置的烟花，进一步增加数量
    const count = Math.floor(Math.random() * 11) + 25;
    const fireworks = [];
    
    // 第一波烟花
    for (let i = 0; i < count; i++) {
      fireworks.push({
        id: i,
        top: Math.random() * 1300, // 随机位置，覆盖全屏
        left: Math.random() * 750, 
        type: Math.floor(Math.random() * 3) + 1, // 1-3种烟花类型
        delay: Math.random() * 2.0 // 更长的随机延迟，增加层次感
      });
    }
    
    this.setData({
      showFireworks: true,
      fireworks: fireworks
    });
    
    // 播放音效 - 可以多次播放形成连续爆炸声
    const playSound = () => {
      const innerAudioContext = wx.createInnerAudioContext();
      innerAudioContext.src = '/audio/firework.mp3';
      innerAudioContext.play();
    };
    
    // 初始播放
    playSound();
    
    // 1秒后再播放一次
    setTimeout(playSound, 1000);
    
    // 2秒后再播放一次
    setTimeout(playSound, 2000);
    
    // 延长显示时间至6.5秒
    setTimeout(() => {
      this.setData({
        showFireworks: false
      });
    }, 6500);
  },
})