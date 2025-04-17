// 页面逻辑
const app = getApp();

Page({
  data: {
    isLoading: false,
    isReady: false
  },

  onLoad() {
    console.log('[Login] onLoad');
    try {
      // 确保关闭所有加载提示
      this.hideAllLoadingAndModal();
      
      // 检查app是否存在以及应用是否已初始化完成
      if (app && app.globalData && app.globalData.isReady) {
      console.log('[Login] App is ready.');
      this.setData({ isReady: true });
    } else {
        console.log('[Login] App not ready or not fully initialized, waiting...');
      // 等待应用初始化完成
        this.waitForAppReady();
      }
    } catch (e) {
      console.error('[Login] Error in onLoad:', e);
      // 出错后尝试继续初始化页面
      this.setData({ isReady: false });
      this.waitForAppReady();
    }
  },
  
  onShow() {
    console.log('[Login] onShow');
    // 每次页面显示时，确保关闭所有加载提示
    this.hideAllLoadingAndModal();
  },
  
  onHide() {
    console.log('[Login] onHide');
    // 页面隐藏时，确保关闭所有加载提示
    this.hideAllLoadingAndModal();
  },
  
  onUnload() {
    console.log('[Login] onUnload');
    // 页面卸载时，确保关闭所有加载提示
    this.hideAllLoadingAndModal();
  },
  
  // 关闭所有加载提示和模态框
  hideAllLoadingAndModal() {
    // 关闭loading提示
    wx.hideLoading();
    // 关闭toast提示
    wx.hideToast();
    
    try {
      // 关闭所有可能的模态对话框，API可能不存在，忽略错误
      wx.hideModal && wx.hideModal();
    } catch (e) {}
    
    try {
      // 关闭操作菜单，API可能不存在，忽略错误
      wx.hideActionSheet && wx.hideActionSheet();
    } catch (e) {}
  },

  waitForAppReady() {
    const checkInterval = 100; // 每100ms检查一次
    const maxWaitTime = 10000; // 最长等待时间延长到10秒
    let waitTime = 0;

    try {
    const timer = setInterval(() => {
        try {
          // 同样需要检查app是否存在
          if (app && app.globalData && app.globalData.isReady) {
        clearInterval(timer);
        console.log('[Login] App ready detected after waiting.');
        this.setData({ isReady: true });
            this.hideAllLoadingAndModal(); // 关闭可能的加载提示
        return;
          } else {
            console.log(`[Login] Still waiting for app ready... ${waitTime}ms elapsed`);
      }

      waitTime += checkInterval;
      if (waitTime >= maxWaitTime) {
        clearInterval(timer);
        console.error('[Login] 等待应用初始化超时');
            
            // 超时后仍然尝试让页面可用
            this.setData({ 
              isReady: true,  // 尽管app可能未就绪，但让页面可用
              isLoading: false 
            });
            
        wx.showToast({
              title: '系统初始化可能未完成，功能可能受限',
          icon: 'none',
          duration: 2000
            });
          }
        } catch (e) {
          console.error('[Login] Error in waitForAppReady timer:', e);
          // 如果定时器内出错，也尝试继续
          clearInterval(timer);
          this.setData({ 
            isReady: true, 
            isLoading: false 
        });
      }
    }, checkInterval);
    } catch (e) {
      console.error('[Login] Fatal error in waitForAppReady:', e);
      // 即使设置定时器出错，也让页面可用
      this.setData({ 
        isReady: true, 
        isLoading: false 
      });
    }
  },

  async handleLogin() {
    console.log('[Login] handleLogin triggered.');
    
    // 检查应用是否准备就绪
    if (!this.data.isReady) {
      console.warn('[Login] handleLogin - App not ready.');
      wx.showToast({
        title: '系统正在初始化，请稍候',
        icon: 'none',
        duration: 1500
      });
      return;
    }

    // 防止重复点击
    if (this.data.isLoading) {
      console.log('[Login] handleLogin - Already loading.');
      return;
    }

    // 显示加载中
    wx.showLoading({
      title: '登录中...',
      mask: true
    });

    this.setData({ isLoading: true });
    console.log('[Login] handleLogin - Set isLoading to true.');

    try {
      // 1. 获取登录凭证
      const loginRes = await wx.login();
      console.log('[Login] Login code obtained:', loginRes.code);
      
      // --- TODO: 将来在这里将 loginRes.code 发送到服务器 --- 
      // 示例：
      // const serverResponse = await requestToServer('/api/login', { code: loginRes.code });
      // const userInfoFromServer = serverResponse.data.userInfo; // 从服务器获取用户信息
      // const token = serverResponse.data.token; // 从服务器获取登录凭证
      // wx.setStorageSync('token', token); // 保存登录凭证
      // console.log('[Login] Received user info from server:', userInfoFromServer);
      // -------------------------------------------------------
      
      // --- 当前临时方案：使用默认信息或之前本地存储的信息 --- 
      // 2. 创建一个默认的用户信息对象，无需授权也可使用
      const defaultUserInfo = {
        nickName: '微信用户',
        avatarUrl: '/assets/icons/default-avatar.png', // 确保路径正确
        gender: 0,
        language: 'zh_CN',
        city: '',
        province: '',
        country: '',
        // openId: `user_${Date.now()}` // 移除临时OpenID，OpenID应来自服务器
      };
      
      // 暂时继续使用本地存储的userInfo，如果服务器返回了则用服务器的
      const storedUserInfo = wx.getStorageSync('userInfo');
      const finalUserInfo = storedUserInfo || defaultUserInfo; 
      // 如果有服务器返回的信息，则用服务器的： const finalUserInfo = userInfoFromServer || defaultUserInfo;
      console.log('[Login] Final user info (local/default):', finalUserInfo);
      // -------------------------------------------------------

      // 4. 保存用户信息并标记为已登录 (如果使用服务器，这里应该保存服务器返回的信息)
      try {
        wx.setStorageSync('userInfo', finalUserInfo);
        console.log('[Login] User info saved to storage');
      } catch (storageError) {
        console.error('[Login] Failed to save user info to storage:', storageError);
      }
      
      // 更新app全局数据
      try {
        if (app && app.globalData) {
          app.globalData.userInfo = finalUserInfo;
        app.globalData.isLoggedIn = true;
          console.log('[Login] Global data updated');
        } else {
          console.warn('[Login] Could not update global data, app or globalData is undefined');
        }
      } catch (appError) {
        console.error('[Login] Error updating global data:', appError);
      }
      
      // 关闭加载提示
      wx.hideLoading();
      
      // 5. 登录成功后跳转  --- 恢复跳转逻辑 ---
      console.log('[Login] Navigating to index page...');
      wx.switchTab({
        url: '/pages/index/index',
        success: () => {
          console.log('[Login] Navigation successful.');
          // 为确保界面更新，延迟隐藏loading
          setTimeout(() => {
            this.setData({ isLoading: false });
            
            // 如果是首次登录，提示用户设置头像和昵称
            if (finalUserInfo.avatarUrl === '/assets/icons/default-avatar.png') {
              setTimeout(() => {
                wx.showToast({
                  title: '点击头像可更新个人信息',
                  icon: 'none',
                  duration: 3000
                });
              }, 1500);
            }
          }, 500);
        },
        fail: (err) => {
          console.error('[Login] Navigation failed:', err);
          this.setData({ isLoading: false });
          wx.showToast({ 
            title: '页面跳转失败', 
            icon: 'none',
            duration: 2000
          });
        }
      });

    } catch (e) {
      // ... (错误处理，确保 hideLoading) ...
       // --- TODO: 将来在这里处理服务器登录失败的情况 --- 
      console.error('[Login] Fatal error in login process:', e);
      wx.hideLoading();
        wx.showToast({
        title: '登录失败，请重试',
          icon: 'none',
        duration: 2000
        });
      this.setData({ isLoading: false });
      // -------------------------------------------------------
    }
  },

  showUserAgreement: function() {
    console.log('[Login] showUserAgreement');
    // 确保先关闭其他弹窗
    this.hideAllLoadingAndModal();
    
    wx.showModal({
      title: '用户协议',
      content: '这里是用户协议的详细内容...', // 实际内容应更丰富
      showCancel: false
    });
  },

  showPrivacyPolicy: function() {
    console.log('[Login] showPrivacyPolicy');
    // 确保先关闭其他弹窗
    this.hideAllLoadingAndModal();
    
    wx.showModal({
      title: '隐私政策',
      content: '这里是隐私政策的详细内容...', // 实际内容应更丰富
      showCancel: false
    });
  }
}); 