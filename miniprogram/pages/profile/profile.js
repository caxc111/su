// 获取应用实例
const app = getApp();

try {
  console.log('[Profile] 开始注册页面');
  Page({
    data: {
      userInfo: {
        avatarUrl: '',
        nickName: '微信用户'
      },
      stats: {
        readingCount: 0,
        readingTime: 0,
        recitingCount: 0,
        recitingTime: 0,
        perfectReadingCount: 0,
        perfectRecitingCount: 0
      },
      isLoggedIn: false,
      showAvatarSelector: false,
      showNicknameModal: false,
      newNickname: '',
      isLoading: true
    },

    onLoad: function() {
      console.log('[Profile] onLoad - 页面加载');
      this.checkLoginStatus();
    },

    onShow: function() {
      console.log('[Profile] onShow - 页面显示');
      this.loadUserData();
    },

    // 检查登录状态
    checkLoginStatus: function() {
      const userInfo = wx.getStorageSync('userInfo');
      if (!userInfo || !userInfo.nickName) {
        console.log('[Profile] 用户未登录，跳转到登录页');
        wx.redirectTo({
          url: '/pages/login/login'
        });
      } else {
        this.setData({
          isLoggedIn: true
        });
        console.log('[Profile] 用户已登录:', userInfo.nickName);
      }
    },

    // 加载用户数据
    loadUserData: function() {
      // 获取用户信息
      const userInfo = wx.getStorageSync('userInfo') || {
        nickName: '未设置昵称',
        avatarUrl: '/assets/icons/default-avatar.png'
      };
      
      // 获取用户统计数据
      const stats = wx.getStorageSync('userStats') || {
        readingCount: 0,
        readingTime: 0,
        recitingCount: 0,
        recitingTime: 0,
        perfectReadingCount: 0,
        perfectRecitingCount: 0
      };
      
      this.setData({
        userInfo: userInfo,
        stats: stats
      });
      
      console.log('[Profile] 用户数据已加载:', userInfo, stats);
    },
    
    // 处理头像选择
    onChooseAvatar(e) {
      const { avatarUrl } = e.detail;
      
      // 更新本地数据
      this.setData({
        'userInfo.avatarUrl': avatarUrl
      });
      
      // 获取存储的用户信息
      let userInfo = wx.getStorageSync('userInfo') || {};
      // 更新头像
      userInfo.avatarUrl = avatarUrl;
      // 保存回本地存储
      wx.setStorageSync('userInfo', userInfo);
      
      // --- TODO: 将来在这里将 avatarUrl 同步到服务器 --- 
      // 示例：
      // requestToServer('/api/user/update', { avatarUrl: avatarUrl });
      // ---------------------------------------------------
      
      // 显示成功提示
      wx.showToast({
        title: '头像更新成功',
        icon: 'success',
        duration: 2000
      });
    },
    
    // 处理微信昵称同步 (恢复之前的版本)
    getNickName(e) {
      try {
        console.log('[Profile] getNickName - 微信昵称选择事件:', e);
        
        // 尝试从多个地方获取昵称，兼容不同版本
        let nickName = '';
        if (e.detail && e.detail.nickname) {
          nickName = e.detail.nickname;
          console.log('[Profile] getNickName - 从e.detail.nickname获取昵称:', nickName);
        } else if (e.detail && e.detail.value) {
          nickName = e.detail.value;
          console.log('[Profile] getNickName - 从e.detail.value获取昵称:', nickName);
        } else {
          console.warn('[Profile] getNickName - 无法从事件中获取昵称:', e);
          // 显示提示，告知用户手动输入或重试
          wx.showToast({
            title: '无法自动获取昵称，请手动输入',
            icon: 'none',
            duration: 2500
          });
          return;
        }
        
        if (!nickName || nickName.trim() === '') {
          console.warn('[Profile] getNickName - 获取的昵称为空');
          return;
        }
        
        console.log('[Profile] getNickName - 最终获取的昵称:', nickName);
        
        // 显示加载提示
        wx.showLoading({
          title: '保存中...',
          mask: true
        });
        
        try {
          // 更新本地数据
          this.setData({
            'userInfo.nickName': nickName
          });
          
          // 获取存储的用户信息
          let userInfo = wx.getStorageSync('userInfo') || {};
          // 更新昵称
          userInfo.nickName = nickName;
          // 保存回本地存储
          wx.setStorageSync('userInfo', userInfo);
          
          // --- TODO: 将来在这里将 nickName 同步到服务器 --- 
          // 示例：
          // requestToServer('/api/user/update', { nickName: nickName });
          // -------------------------------------------------
          
          // 隐藏加载提示
          wx.hideLoading();
          
          // 显示成功提示
          wx.showToast({
            title: '昵称同步成功',
            icon: 'success',
            duration: 2000
          });
        } catch (error) {
          // 确保隐藏加载提示
          wx.hideLoading();
          
          console.error('[Profile] getNickName - 保存昵称时出错:', error);
          wx.showToast({
            title: '保存昵称失败',
            icon: 'none',
            duration: 2000
          });
        }
      } catch (error) {
        // 确保隐藏加载提示
        wx.hideLoading();
        
        console.error('[Profile] getNickName - 处理昵称事件出错:', error);
        wx.showToast({
          title: '处理昵称失败',
          icon: 'none',
          duration: 2000
        });
      }
    },
    
    // 处理昵称变更 (用户手动输入)
    onNicknameChange(e) {
      const nickName = e.detail.value;
      
      if (!nickName || nickName.trim() === '') {
        wx.showToast({
          title: '昵称不能为空',
          icon: 'none',
          duration: 2000
        });
        return;
      }
      
      // 更新本地数据
      this.setData({
        'userInfo.nickName': nickName
      });
      
      // 获取存储的用户信息
      let userInfo = wx.getStorageSync('userInfo') || {};
      // 更新昵称
      userInfo.nickName = nickName;
      // 保存回本地存储
      wx.setStorageSync('userInfo', userInfo);
      
      // --- TODO: 将来在这里将 nickName 同步到服务器 --- 
      // 示例：
      // requestToServer('/api/user/update', { nickName: nickName });
      // -------------------------------------------------
      
      // 显示成功提示
      wx.showToast({
        title: '昵称更新成功',
        icon: 'success',
        duration: 2000
      });
    },

    // 打开头像选择器
    openAvatarSelector: function() {
      this.setData({
        showAvatarSelector: true
      });
    },

    // 选择头像
    selectAvatar: function(e) {
      const avatarUrl = e.currentTarget.dataset.avatar;
      
      // 更新本地用户信息
      const userInfo = wx.getStorageSync('userInfo') || {};
      userInfo.avatarUrl = avatarUrl;
      wx.setStorageSync('userInfo', userInfo);
      
      // 更新页面数据
      this.setData({
        'userInfo.avatarUrl': avatarUrl,
        showAvatarSelector: false
      });
      
      wx.showToast({
        title: '头像已更新',
        icon: 'success'
      });
    },

    // 关闭头像选择器
    closeAvatarSelector: function() {
      this.setData({
        showAvatarSelector: false
      });
    },

    // 打开修改昵称弹窗
    openNicknameModal: function() {
      this.setData({
        showNicknameModal: true,
        newNickname: this.data.userInfo.nickName
      });
    },

    // 输入框绑定
    onNicknameInput: function(e) {
      this.setData({
        newNickname: e.detail.value
      });
    },

    // 保存新昵称
    saveNickname: function() {
      const newNickname = this.data.newNickname.trim();
      
      if (!newNickname) {
        wx.showToast({
          title: '昵称不能为空',
          icon: 'none'
        });
        return;
      }
      
      // 更新本地用户信息
      const userInfo = wx.getStorageSync('userInfo') || {};
      userInfo.nickName = newNickname;
      wx.setStorageSync('userInfo', userInfo);
      
      // 更新页面数据
      this.setData({
        'userInfo.nickName': newNickname,
        showNicknameModal: false
      });
      
      wx.showToast({
        title: '昵称已更新',
        icon: 'success'
      });
    },

    // 关闭昵称弹窗
    closeNicknameModal: function() {
      this.setData({
        showNicknameModal: false
      });
    },

    // 意见反馈
    handleFeedback: function() {
      wx.navigateTo({
        url: '/pages/feedback/feedback'
      });
    },

    // 关于我们
    handleAbout: function() {
      wx.navigateTo({
        url: '/pages/about/about'
      });
    },

    // 退出登录
    handleLogout: function() {
      wx.showModal({
        title: '确认退出',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            // 清除用户信息
            wx.removeStorageSync('userInfo');
            
            // 跳转到登录页
            wx.redirectTo({
              url: '/pages/login/login'
            });
          }
        }
      });
    }
  });
  console.log('[Profile] 页面注册完成');
} catch (error) {
  console.error('[Profile] 页面注册失败:', error);
} 