/**
 * 认证服务 - 处理用户登录和授权相关功能
 */
class AuthService {
  constructor() {
    this.userInfoKey = 'userInfo';
    this.loginTimeKey = 'LAST_LOGIN_TIME';
  }

  /**
   * 获取用户微信信息
   * @param {object} options - 获取用户信息的选项
   * @returns {Promise<object>} 用户信息对象
   */
  async getUserProfile(options = { desc: '用于完善会员资料' }) {
    try {
      const res = await wx.getUserProfile(options);
      return res.userInfo;
    } catch (error) {
      console.error('获取用户信息失败：', error);
      throw error;
    }
  }

  /**
   * 保存用户信息到本地存储
   * @param {object} userInfo - 用户信息对象
   */
  saveUserInfo(userInfo) {
    try {
      wx.setStorageSync(this.userInfoKey, userInfo);
      wx.setStorageSync(this.loginTimeKey, Date.now());
    } catch (error) {
      console.error('保存用户信息失败：', error);
      throw error;
    }
  }

  /**
   * 获取本地存储的用户信息
   * @returns {object|null} 用户信息对象或null
   */
  getUserInfo() {
    try {
      return wx.getStorageSync(this.userInfoKey);
    } catch (error) {
      console.error('获取用户信息失败：', error);
      return null;
    }
  }

  /**
   * 检查用户是否已登录
   * @returns {boolean} 是否已登录
   */
  isLoggedIn() {
    return !!this.getUserInfo();
  }

  /**
   * 清除用户登录信息（退出登录）
   */
  logout() {
    try {
      wx.removeStorageSync(this.userInfoKey);
      wx.removeStorageSync(this.loginTimeKey);
    } catch (error) {
      console.error('退出登录失败：', error);
      throw error;
    }
  }
}

// 导出单例模式的服务实例
export const authService = new AuthService(); 
 * 认证服务 - 处理用户登录和授权相关功能
 */
class AuthService {
  constructor() {
    this.userInfoKey = 'userInfo';
    this.loginTimeKey = 'LAST_LOGIN_TIME';
  }

  /**
   * 获取用户微信信息
   * @param {object} options - 获取用户信息的选项
   * @returns {Promise<object>} 用户信息对象
   */
  async getUserProfile(options = { desc: '用于完善会员资料' }) {
    try {
      const res = await wx.getUserProfile(options);
      return res.userInfo;
    } catch (error) {
      console.error('获取用户信息失败：', error);
      throw error;
    }
  }

  /**
   * 保存用户信息到本地存储
   * @param {object} userInfo - 用户信息对象
   */
  saveUserInfo(userInfo) {
    try {
      wx.setStorageSync(this.userInfoKey, userInfo);
      wx.setStorageSync(this.loginTimeKey, Date.now());
    } catch (error) {
      console.error('保存用户信息失败：', error);
      throw error;
    }
  }

  /**
   * 获取本地存储的用户信息
   * @returns {object|null} 用户信息对象或null
   */
  getUserInfo() {
    try {
      return wx.getStorageSync(this.userInfoKey);
    } catch (error) {
      console.error('获取用户信息失败：', error);
      return null;
    }
  }

  /**
   * 检查用户是否已登录
   * @returns {boolean} 是否已登录
   */
  isLoggedIn() {
    return !!this.getUserInfo();
  }

  /**
   * 清除用户登录信息（退出登录）
   */
  logout() {
    try {
      wx.removeStorageSync(this.userInfoKey);
      wx.removeStorageSync(this.loginTimeKey);
    } catch (error) {
      console.error('退出登录失败：', error);
      throw error;
    }
  }
}

// 导出单例模式的服务实例
export const authService = new AuthService(); 
 