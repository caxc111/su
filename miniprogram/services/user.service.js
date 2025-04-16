/**
 * 用户服务类
 * 负责用户信息管理和登录状态维护
 */

// 用户状态枚举
export const USER_STATUS = {
  NOT_LOGGED_IN: 0,   // 未登录
  LOGGED_IN: 1,       // 已登录
  SESSION_EXPIRED: 2  // 会话过期
};

class UserService {
  constructor() {
    // 初始化用户状态
    this.status = USER_STATUS.NOT_LOGGED_IN;
    this.userInfo = null;
    this.openid = '';
    
    // 尝试从本地存储恢复用户信息
    this.tryRestoreUserInfo();
  }

  /**
   * 尝试从本地存储恢复用户信息
   */
  tryRestoreUserInfo() {
    try {
      const userInfoStr = wx.getStorageSync('userInfo');
      const sessionId = wx.getStorageSync('sessionId');
      
      if (userInfoStr && sessionId) {
        this.userInfo = JSON.parse(userInfoStr);
        this.openid = wx.getStorageSync('openid') || '';
        this.status = USER_STATUS.LOGGED_IN;
      }
    } catch (e) {
      console.error('恢复用户信息失败', e);
      this.status = USER_STATUS.NOT_LOGGED_IN;
    }
  }

  /**
   * 获取用户当前登录状态
   * @returns {number} 用户状态枚举值
   */
  getStatus() {
    return this.status;
  }

  /**
   * 获取用户信息
   * @returns {Object|null} 用户信息对象，未登录时返回null
   */
  getUserInfo() {
    return this.userInfo;
  }

  /**
   * 微信授权登录
   * @returns {Promise} 登录结果Promise
   */
  login() {
    return new Promise((resolve, reject) => {
      // 调用微信登录接口
      wx.login({
        success: (res) => {
          if (res.code) {
            // 获取用户信息
            this.getUserProfile()
              .then(userInfo => {
                // 模拟获取openid（实际项目中需要通过服务端获取）
                this.simulateFetchOpenid(res.code)
                  .then(openid => {
                    // 保存用户信息
                    this.setUserInfo(userInfo, openid);
                    resolve(userInfo);
                  })
                  .catch(err => {
                    console.error('获取openid失败', err);
                    reject(new Error('获取openid失败'));
                  });
              })
              .catch(err => {
                console.error('获取用户信息失败', err);
                reject(err);
              });
          } else {
            console.error('微信登录失败', res);
            reject(new Error('微信登录失败'));
          }
        },
        fail: (err) => {
          console.error('微信登录失败', err);
          reject(err);
        }
      });
    });
  }

  /**
   * 获取用户个人信息（小程序官方推荐方式）
   * @returns {Promise} 包含用户信息的Promise
   */
  getUserProfile() {
    return new Promise((resolve, reject) => {
      wx.getUserProfile({
        desc: '用于完善用户资料',
        success: (res) => {
          resolve(res.userInfo);
        },
        fail: (err) => {
          console.error('获取用户信息失败', err);
          reject(err);
        }
      });
    });
  }

  /**
   * 模拟从服务器获取openid
   * 注：实际项目中应通过服务端接口获取
   * @param {string} code - 微信登录返回的code
   * @returns {Promise} 包含openid的Promise
   */
  simulateFetchOpenid(code) {
    return new Promise((resolve) => {
      // 这里模拟从服务器获取openid
      // 实际项目中需要通过服务端接口获取
      console.log('模拟获取openid，登录code:', code);
      
      // 生成一个模拟的openid
      const mockOpenid = 'openid_' + Date.now() + '_' + Math.floor(Math.random() * 1000000);
      
      // 模拟网络延迟
      setTimeout(() => {
        resolve(mockOpenid);
      }, 500);
    });
  }

  /**
   * 设置用户信息
   * @param {Object} userInfo - 用户信息对象
   * @param {string} openid - 用户openid
   */
  setUserInfo(userInfo, openid) {
    this.userInfo = userInfo;
    this.openid = openid;
    this.status = USER_STATUS.LOGGED_IN;
    
    // 保存到本地存储
    try {
      wx.setStorageSync('userInfo', JSON.stringify(userInfo));
      wx.setStorageSync('openid', openid);
      wx.setStorageSync('sessionId', 'session_' + Date.now());
    } catch (e) {
      console.error('保存用户信息失败', e);
    }
    
    // 触发登录成功事件
    this.triggerLoginEvent();
  }

  /**
   * 触发登录成功事件
   */
  triggerLoginEvent() {
    // 使用全局事件总线触发登录成功事件
    const eventChannel = this.getEventChannel();
    eventChannel.emit('loginSuccess', {
      userInfo: this.userInfo,
      openid: this.openid
    });
  }

  /**
   * 获取事件通道
   * @returns {Object} 全局事件通道
   */
  getEventChannel() {
    // 简易的全局事件通道实现
    if (!getApp().globalEventChannel) {
      const eventListeners = {};
      
      getApp().globalEventChannel = {
        on: (eventName, callback) => {
          if (!eventListeners[eventName]) {
            eventListeners[eventName] = [];
          }
          eventListeners[eventName].push(callback);
        },
        emit: (eventName, data) => {
          const listeners = eventListeners[eventName];
          if (listeners) {
            listeners.forEach(callback => {
              callback(data);
            });
          }
        },
        off: (eventName, callback) => {
          const listeners = eventListeners[eventName];
          if (listeners) {
            if (callback) {
              const index = listeners.indexOf(callback);
              if (index !== -1) {
                listeners.splice(index, 1);
              }
            } else {
              eventListeners[eventName] = [];
            }
          }
        }
      };
    }
    
    return getApp().globalEventChannel;
  }

  /**
   * 退出登录
   */
  logout() {
    this.userInfo = null;
    this.openid = '';
    this.status = USER_STATUS.NOT_LOGGED_IN;
    
    // 清除本地存储中的用户信息
    try {
      wx.removeStorageSync('userInfo');
      wx.removeStorageSync('openid');
      wx.removeStorageSync('sessionId');
    } catch (e) {
      console.error('清除用户信息失败', e);
    }
  }

  /**
   * 检查登录状态
   * @returns {boolean} 是否已登录
   */
  isLoggedIn() {
    return this.status === USER_STATUS.LOGGED_IN;
  }

  /**
   * 获取用户头像URL
   * @returns {string} 头像URL，未登录时返回默认头像
   */
  getAvatarUrl() {
    if (this.userInfo && this.userInfo.avatarUrl) {
      return this.userInfo.avatarUrl;
    }
    return '/assets/images/default-avatar.png';
  }

  /**
   * 获取用户昵称
   * @returns {string} 用户昵称，未登录时返回'未登录'
   */
  getNickname() {
    if (this.userInfo && this.userInfo.nickName) {
      return this.userInfo.nickName;
    }
    return '未登录';
  }

  /**
   * 保存用户设置
   * @param {Object} settings - 用户设置对象
   * @returns {boolean} 是否保存成功
   */
  saveUserSettings(settings) {
    if (!this.isLoggedIn()) {
      return false;
    }
    
    try {
      wx.setStorageSync('userSettings', JSON.stringify(settings));
      return true;
    } catch (e) {
      console.error('保存用户设置失败', e);
      return false;
    }
  }

  /**
   * 获取用户设置
   * @returns {Object} 用户设置对象，失败时返回默认设置
   */
  getUserSettings() {
    try {
      const settingsStr = wx.getStorageSync('userSettings');
      if (settingsStr) {
        return JSON.parse(settingsStr);
      }
    } catch (e) {
      console.error('获取用户设置失败', e);
    }
    
    // 默认设置
    return {
      enableVoice: true,
      autoPlayArticle: false,
      darkMode: false,
      fontSize: 'medium'
    };
  }
}

// 导出单例实例
const userService = new UserService();
export default userService; 

/**
 * user.service.js
 * 用户相关服务，处理与后端服务器的交互
 */

// 基础请求函数 (需要根据您的后端接口进行封装)
async function requestToServer(url, data, method = 'POST') {
  console.log(`[UserService] 发起请求: ${url}`, data);
  // --- TODO: 将来在这里实现真实的 wx.request 调用 --- 
  // const token = wx.getStorageSync('token'); // 获取登录凭证
  // return new Promise((resolve, reject) => {
  //   wx.request({
  //     url: your_server_base_url + url,
  //     method: method,
  //     data: data,
  //     header: {
  //       'Authorization': `Bearer ${token}` // 添加认证头
  //     },
  //     success: (res) => {
  //       if (res.statusCode === 200 && res.data.success) {
  //         resolve(res.data);
  //       } else {
  //         console.error('[UserService] 请求失败:', res);
  //         reject(res);
  //       }
  //     },
  //     fail: (err) => {
  //       console.error('[UserService] 网络请求错误:', err);
  //       reject(err);
  //     }
  //   });
  // });
  // ----------------------------------------------------
  // 模拟成功返回
  return Promise.resolve({ success: true, data: {}, message: '模拟成功' }); 
}

/**
 * 使用 code 进行登录
 * @param {string} code - wx.login 获取的 code
 * @returns {Promise<object>} - 包含用户信息和 token 的 Promise
 */
async function loginWithCode(code) {
  console.log('[UserService] loginWithCode', code);
  // --- TODO: 将来调用真实的登录接口 --- 
  // return requestToServer('/api/login', { code });
  // -------------------------------------
  // 模拟返回
  return Promise.resolve({
    success: true,
    data: {
      token: 'mock_token_' + Date.now(),
      userInfo: {
        nickName: '服务器昵称', // 模拟从服务器获取
        avatarUrl: '/assets/icons/default-avatar.png', // 模拟从服务器获取
        openId: 'mock_openid_' + Date.now()
      }
    }
    });
  }

  /**
 * 更新用户信息到服务器
 * @param {object} updates - 需要更新的用户信息，例如 { nickName: '新昵称' } 或 { avatarUrl: '新头像URL' }
 * @returns {Promise<object>} - 更新结果的 Promise
 */
async function updateUserInfo(updates) {
  console.log('[UserService] updateUserInfo', updates);
  // --- TODO: 将来调用真实的用户信息更新接口 --- 
  // return requestToServer('/api/user/update', updates);
  // -----------------------------------------
  return Promise.resolve({ success: true });
}

/**
 * 从服务器获取用户信息
 * @returns {Promise<object>} - 包含用户信息的 Promise
 */
async function getUserInfoFromServer() {
  console.log('[UserService] getUserInfoFromServer');
  // --- TODO: 将来调用真实的获取用户信息接口 --- 
  // return requestToServer('/api/user/info', {}, 'GET');
  // -------------------------------------------
  return Promise.resolve({
    success: true,
    data: {
       nickName: '服务器昵称', 
       avatarUrl: '/assets/icons/default-avatar.png',
       // ... 其他信息
    }
  });
}

module.exports = {
  loginWithCode,
  updateUserInfo,
  getUserInfoFromServer
}; 