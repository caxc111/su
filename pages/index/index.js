// pages/index/index.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    loading: true,
    debug: '首页初始化'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 初始化应用数据
    const app = getApp();
    
    // 调试信息
    console.log('首页 - onLoad 被调用');
    this.addDebug('首页 onLoad 被调用');
    
    try {
      // 确保加载示例数据
      if (!app.globalData.articles || app.globalData.articles.length === 0) {
        console.log('初始化页面 - 尝试加载示例数据');
        this.addDebug('初始化页面 - 尝试加载示例数据');
        app.initSampleData();
      }
    } catch (error) {
      console.error('初始化页面数据失败:', error);
      this.addDebug('初始化页面数据失败: ' + error.message);
    }
    
    // 检查是否需要阻止自动跳转
    const preventAutoRedirect = app.globalData.preventAutoRedirect;
    const isTestPage = app.globalData.isTestPage;
    console.log('自动跳转状态:', preventAutoRedirect ? '已禁用' : '已启用');
    console.log('测试页面状态:', isTestPage ? '是' : '否');
    this.addDebug('自动跳转状态: ' + (preventAutoRedirect ? '已禁用' : '已启用'));
    this.addDebug('测试页面状态: ' + (isTestPage ? '是' : '否'));
    
    // 修改加载状态
    this.setData({
      loading: false
    });
    
    // --- 注释掉整个自动跳转逻辑 ---
    /*
    // 只有当未禁用自动跳转且不是测试页面时才执行跳转逻辑
    if (!preventAutoRedirect && !isTestPage) {
      // 延迟跳转，确保数据准备好
      console.log('准备自动跳转到文章列表页面');
      this.addDebug('准备自动跳转到文章列表页面');
      
      setTimeout(() => {
        // 使用更可靠的方式跳转到练习页面
        try {
          // 由于article-list是tabBar页面，必须使用switchTab
          console.log('尝试跳转到文章列表页面');
          this.addDebug('尝试跳转到文章列表页面');
          wx.switchTab({
            url: '/pages/article-list/article-list',
            success: () => {
              console.log('成功跳转到文章列表页面');
              this.addDebug('成功跳转到文章列表页面');
            },
            fail: (error) => {
              console.error('跳转到文章列表页面失败:', error);
              this.addDebug('跳转到文章列表页面失败: ' + error.errMsg);
              // 显示提示
              wx.showToast({
                title: '页面加载失败，请重试',
                icon: 'none',
                duration: 2000
              });
            }
          });
        } catch (navError) {
          console.error('导航错误:', navError);
          this.addDebug('导航错误: ' + navError.message);
          wx.showToast({
            title: '页面加载失败，请重启小程序',
            icon: 'none',
            duration: 3000
          });
        }
      }, 1000); // 延迟1秒，确保状态已更新
    } else {
      // 如果禁用了自动跳转或是测试页面，不执行跳转
      console.log('自动跳转已禁用或是测试页面，不执行自动导航');
      this.addDebug('自动跳转已禁用或是测试页面，不执行自动导航');
    }
    */
    // --- 跳转逻辑结束 ---
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    console.log('首页 - onReady');
    this.addDebug('首页 onReady');
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    console.log('首页 - onShow');
    this.addDebug('首页 onShow');
    
    // --- 新增：根据登录状态决定跳转 --- 
    const app = getApp();
    // 短暂延迟以确保 app.globalData 初始化完成（特别是异步获取登录状态时）
    // 如果 app.js 能保证 globalData.userInfo 同步可用，可以去掉 setTimeout
    setTimeout(() => {
        if (app.globalData.userInfo) {
            console.log('[index.js onShow] 用户已登录，跳转到练习页面');
            this.addDebug('用户已登录，跳转到练习页面');
            wx.switchTab({
              url: '/pages/article-list/article-list',
              fail: (err) => {
                  console.error('[index.js] 跳转到 article-list 失败:', err);
                  this.addDebug('跳转到练习页面失败: ' + err.errMsg);
              }
            });
        } else {
            console.log('[index.js onShow] 用户未登录，跳转到我的页面');
            this.addDebug('用户未登录，跳转到我的页面');
            wx.switchTab({
              url: '/pages/student/profile/profile',
               fail: (err) => {
                  console.error('[index.js] 跳转到 profile 失败:', err);
                  this.addDebug('跳转到我的页面失败: ' + err.errMsg);
               }
            });
        }
    }, 100); // 延迟 100ms 检查
    // --- 跳转逻辑结束 ---
    
    /* --- 移除旧的 onShow 逻辑 ---
    // 检查全局标志
    const preventAutoRedirect = app.globalData.preventAutoRedirect;
    const isTestPage = app.globalData.isTestPage;
    
    this.addDebug(`页面显示时状态: preventAutoRedirect=${preventAutoRedirect}, isTestPage=${isTestPage}`);
    
    if (preventAutoRedirect || isTestPage) {
      console.log('检测到全局阻止自动跳转标志或测试页面标记，保持首页显示');
      this.addDebug('检测到全局阻止自动跳转标志或测试页面标记，保持首页显示');
    } else {
      console.log('未检测到阻止跳转标志，判断是否需要自动跳转');
      this.addDebug('未检测到阻止跳转标志，判断是否需要自动跳转');
      
      // 如果当前就是首页，且没有阻止跳转标志，考虑自动跳转
      const pages = getCurrentPages();
      if (pages.length === 1 && pages[0].route === 'pages/index/index') {
        console.log('当前在首页，考虑自动跳转');
        this.addDebug('当前在首页，考虑自动跳转');
        
        // 为避免重复跳转，这里不主动调用跳转，而是设置loading状态，触发onLoad中的跳转逻辑
        this.setData({
          loading: true
        }, () => {
          this.onLoad({});
        });
      }
    }
    */
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    console.log('首页 - onHide');
    this.addDebug('首页 onHide');
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    console.log('首页 - onUnload');
    this.addDebug('首页 onUnload');
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    console.log('首页 - onPullDownRefresh');
    this.addDebug('首页 onPullDownRefresh');
    wx.stopPullDownRefresh();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    console.log('首页 - onReachBottom');
    this.addDebug('首页 onReachBottom');
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '顺口成章 - 提升口语表达能力',
      path: '/pages/index/index'
    };
  },

  // 打开测试页面
  goToTestPage: function() {
    console.log('正在打开测试页面...');
    this.addDebug('正在打开测试页面...');
    
    // 设置阻止自动跳转标志
    const app = getApp();
    app.setPreventAutoRedirect(true);
    app.setTestPage(true);
    
    console.log('已设置阻止自动跳转标志和测试页面标记');
    this.addDebug('已设置阻止自动跳转标志和测试页面标记');
    
    // 显示提示
    wx.showToast({
      title: '正在打开测试页面',
      icon: 'loading',
      duration: 1000
    });
    
    // 使用setTimeout确保标志设置生效
    setTimeout(() => {
      wx.navigateTo({
        url: '/pages/student/recitation-test/recitation-test',
        success: () => {
          console.log('成功导航到测试页面');
          this.addDebug('成功导航到测试页面');
        },
        fail: (err) => {
          console.error('导航到测试页面失败:', err);
          this.addDebug('导航到测试页面失败: ' + err.errMsg);
          
          // 重置标志，因为导航失败
          app.setPreventAutoRedirect(false);
          app.setTestPage(false);
          
          wx.showModal({
            title: '导航失败',
            content: '无法打开测试页面，可能页面不存在。请检查app.json中是否正确添加了页面路径。',
            showCancel: false
          });
        }
      });
    }, 500);
  },
  
  // 添加调试信息
  addDebug: function(message) {
    const now = new Date();
    const timeStr = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
    
    this.setData({
      debug: this.data.debug + '\n' + `[${timeStr}] ${message}`
    });
    
    // 限制调试信息的长度
    if (this.data.debug.length > 1000) {
      this.setData({
        debug: '...\n' + this.data.debug.substring(this.data.debug.length - 800)
      });
    }
  }
})