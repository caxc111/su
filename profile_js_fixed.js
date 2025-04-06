// pages/student/profile/profile.js
const app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    userInfo: null,
    isLoading: true,
    totalFlowers: 0,
    practiceCount: 0, 
    averageScore: '0.0',
    canIUseGetUserProfile: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log('pages/student/profile/profile: onLoad have been invoked');
    
    // 检查是否可以使用 wx.getUserProfile API
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      });
    }
    
    this.updatePageData();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    console.log('pages/student/profile/profile: onShow have been invoked');
    console.log('[profile.js] onShow: Updating page data.');
    this.updatePageData();
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    console.log('pages/student/profile/profile: onHide have been invoked');
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    console.log('pages/student/profile/profile: onUnload have been invoked');
  },

  /**
   * 更新页面数据
   */
  updatePageData() {
    this.setData({ isLoading: true }); // 开始加载
    const currentUserInfo = app.globalData.userInfo;
    const records = app.globalData.readingRecords || [];

    // --- 计算统计数据 ---
    const recitationRecords = records.filter(r => r.type === 'recitation');
    const practiceCount = recitationRecords.length;
    const totalScore = recitationRecords.reduce((sum, r) => sum + (r.score || 0), 0);
    const averageScore = practiceCount > 0 ? (totalScore / practiceCount).toFixed(1) : '0.0';
    const currentTotalFlowers = this.calculateTotalFlowers(recitationRecords);

    console.log('[profile.js updatePageData] UserInfo from globalData:', currentUserInfo);
    console.log(`[profile.js updatePageData] Calculated Stats: practiceCount=${practiceCount}, averageScore=${averageScore}, totalFlowers=${currentTotalFlowers}`);

    // 更新页面数据
    this.setData({
      userInfo: currentUserInfo,
      totalFlowers: currentTotalFlowers,
      practiceCount: practiceCount,
      averageScore: averageScore,
      isLoading: false
    }, () => {
      console.log('[profile.js updatePageData] setData callback executed. AppData should be updated now.');
    });
  },

  // 计算总花朵数量
  calculateTotalFlowers(records) {
    return records.reduce((total, record) => {
      // 每个满分(100分)获得一朵小红花
      return total + (record.score === 100 ? 1 : 0);
    }, 0);
  },

  // 获取用户信息
  getUserProfile() {
    console.log('[profile.js] getUserProfile called');
    
    // 设置加载状态
    this.setData({
      isLoading: true
    });
    
    // 调用授权 API 获取用户信息
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        console.log('[profile.js] getUserProfile success:', res);
        // 获取登录凭证
        wx.login({
          success: (loginRes) => {
            console.log('[profile.js] wx.login success, code:', loginRes.code);
            
            // 将用户信息存储到全局数据
            app.globalData.userInfo = res.userInfo;
            
            // 更新页面数据
            this.setData({
              userInfo: res.userInfo,
              isLoading: false
            });
            
            // 这里可以发起网络请求，将登录凭证发送到服务器
            // ...
          },
          fail: (loginErr) => {
            console.error('[profile.js] wx.login failed:', loginErr);
            this.setData({ isLoading: false });
            wx.showToast({
              title: '登录失败',
              icon: 'none'
            });
          }
        });
      },
      fail: (err) => {
        console.error('[profile.js] getUserProfile failed:', err);
        this.setData({ isLoading: false });
        
        // 如果用户拒绝授权
        if (err.errMsg.indexOf('auth deny') >= 0 || err.errMsg.indexOf('cancel') >= 0) {
          wx.showToast({
            title: '您已取消授权',
            icon: 'none'
          });
        } else {
          wx.showToast({
            title: '获取用户信息失败',
            icon: 'none'
          });
        }
      }
    });
  },

  // 退出登录
  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除全局用户信息
          app.globalData.userInfo = null;
          
          // 更新页面状态
          this.setData({
            userInfo: null
          });
          
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });
        }
      }
    });
  },
  
  // 头像加载错误
  onAvatarLoadError() {
    // 如果头像加载失败，使用默认头像
    if (this.data.userInfo) {
      const userInfo = {...this.data.userInfo};
      userInfo.avatarUrl = '/images/default-avatar.png';
      this.setData({ userInfo });
    }
  },
  
  // 动画开始事件处理
  onAnimationStart() {
    console.log('[profile.js] Animation started');
  },
  
  // 动画结束事件处理
  onAnimationEnd() {
    console.log('[profile.js] Animation ended');
  }
}); 