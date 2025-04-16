/**
 * 广告服务 - 管理应用内广告展示
 */

/**
 * 广告类型枚举
 */
const AD_TYPES = {
  REWARD: 'reward', // 激励广告
  BANNER: 'banner', // 横幅广告
  INTERSTITIAL: 'interstitial', // 插屏广告
  LOGIN: 'login' // 登录激励广告
};

/**
 * 广告单元ID映射表
 * 正式环境请替换为实际的广告单元ID
 */
const AD_UNIT_IDS = {
  [AD_TYPES.REWARD]: 'adunit-e401f0ce32f73733',
  [AD_TYPES.BANNER]: 'adunit-f988d3fdf01a89d5',
  [AD_TYPES.INTERSTITIAL]: 'adunit-7c5c6b3c8489c731',
  [AD_TYPES.LOGIN]: 'adunit-e5f4f8d1f27c5ab7'
};

class AdService {
  constructor() {
    this._initialized = false;
    this._adInstances = new Map();
  }

  /**
   * 初始化广告服务
   * @returns {Promise<boolean>} 初始化是否成功
   */
  init() {
    if (this._initialized) {
      console.log('广告服务已初始化');
      return Promise.resolve(true);
    }

    return new Promise((resolve) => {
      console.log('广告服务初始化中...');
      // 模拟初始化过程
      setTimeout(() => {
        this._initialized = true;
        console.log('广告服务初始化完成');
        resolve(true);
      }, 100);
    });
  }

  /**
   * 检查服务是否已初始化
   * @private
   */
  _checkInit() {
    if (!this._initialized) {
      console.warn('广告服务尚未初始化');
      return false;
    }
    return true;
  }

  /**
   * 创建激励广告实例
   * @param {string} type 广告类型
   * @returns {object|null} 广告实例
   * @private
   */
  _createRewardedAd(type) {
    if (!this._checkInit()) return null;

    console.log(`创建${type}激励广告`);
    
    // 如果是生产环境，使用实际的激励广告API
    if (false) { // 开发阶段暂不启用
      const adUnitId = AD_UNIT_IDS[type];
      // 创建广告实例
      const rewardedAd = wx.createRewardedVideoAd({ adUnitId });
      
      // 监听广告关闭事件
      rewardedAd.onClose((res) => {
        console.log('激励广告关闭', res);
      });
      
      return rewardedAd;
    }
    
    // 开发环境返回模拟实例
    return {
      show: () => {
        console.log(`模拟展示${type}激励广告`);
        return Promise.resolve({ isEnded: true });
      },
      load: () => {
        console.log(`模拟加载${type}激励广告`);
        return Promise.resolve();
      }
    };
  }

  /**
   * 展示登录激励广告
   * @returns {Promise<boolean>} 是否完整观看广告
   */
  showLoginAd() {
    console.log('尝试展示登录激励广告');
    
    if (!this._checkInit()) {
      return Promise.resolve(true); // 开发模式直接返回成功
    }
    
    let adInstance = this._adInstances.get(AD_TYPES.LOGIN);
    
    if (!adInstance) {
      adInstance = this._createRewardedAd(AD_TYPES.LOGIN);
      this._adInstances.set(AD_TYPES.LOGIN, adInstance);
    }
    
    return adInstance.show().then(res => {
      const isCompleted = res && res.isEnded;
      console.log('登录激励广告展示完成，完成状态:', isCompleted);
      return isCompleted;
    }).catch(err => {
      console.error('登录激励广告展示失败:', err);
      // 展示失败时也视为观看完成，避免阻塞用户操作
      return true;
    });
  }

  /**
   * 展示普通激励广告
   * @returns {Promise<boolean>} 是否完整观看广告
   */
  showRewardAd() {
    console.log('尝试展示普通激励广告');
    
    if (!this._checkInit()) {
      return Promise.resolve(true); // 开发模式直接返回成功
    }
    
    let adInstance = this._adInstances.get(AD_TYPES.REWARD);
    
    if (!adInstance) {
      adInstance = this._createRewardedAd(AD_TYPES.REWARD);
      this._adInstances.set(AD_TYPES.REWARD, adInstance);
    }
    
    return adInstance.show().then(res => {
      const isCompleted = res && res.isEnded;
      console.log('普通激励广告展示完成，完成状态:', isCompleted);
      return isCompleted;
    }).catch(err => {
      console.error('普通激励广告展示失败:', err);
      // 先尝试加载再显示
      return adInstance.load().then(() => adInstance.show()).then(res => {
        return res && res.isEnded;
      }).catch(() => {
        // 二次尝试失败，视为观看完成
        return true;
      });
    });
  }

  /**
   * 展示插屏广告
   */
  showInterstitialAd() {
    console.log('尝试展示插屏广告');
    
    if (!this._checkInit()) return;
    
    // 开发阶段仅打印日志
    console.log('模拟展示插屏广告');
  }

  /**
   * 展示横幅广告
   * @param {string} selector 广告容器选择器
   */
  showBannerAd(selector) {
    console.log('尝试展示横幅广告，容器:', selector);
    
    if (!this._checkInit()) return;
    
    // 开发阶段仅打印日志
    console.log('模拟展示横幅广告');
  }

  /**
   * 隐藏横幅广告
   */
  hideBannerAd() {
    console.log('隐藏横幅广告');
    
    if (!this._checkInit()) return;
    
    // 开发阶段仅打印日志
    console.log('模拟隐藏横幅广告');
  }
}

// 导出单例实例
export const adService = new AdService();
export default adService; 
 * 广告服务 - 管理应用内广告展示
 */

/**
 * 广告类型枚举
 */
const AD_TYPES = {
  REWARD: 'reward', // 激励广告
  BANNER: 'banner', // 横幅广告
  INTERSTITIAL: 'interstitial', // 插屏广告
  LOGIN: 'login' // 登录激励广告
};

/**
 * 广告单元ID映射表
 * 正式环境请替换为实际的广告单元ID
 */
const AD_UNIT_IDS = {
  [AD_TYPES.REWARD]: 'adunit-e401f0ce32f73733',
  [AD_TYPES.BANNER]: 'adunit-f988d3fdf01a89d5',
  [AD_TYPES.INTERSTITIAL]: 'adunit-7c5c6b3c8489c731',
  [AD_TYPES.LOGIN]: 'adunit-e5f4f8d1f27c5ab7'
};

class AdService {
  constructor() {
    this._initialized = false;
    this._adInstances = new Map();
  }

  /**
   * 初始化广告服务
   * @returns {Promise<boolean>} 初始化是否成功
   */
  init() {
    if (this._initialized) {
      console.log('广告服务已初始化');
      return Promise.resolve(true);
    }

    return new Promise((resolve) => {
      console.log('广告服务初始化中...');
      // 模拟初始化过程
      setTimeout(() => {
        this._initialized = true;
        console.log('广告服务初始化完成');
        resolve(true);
      }, 100);
    });
  }

  /**
   * 检查服务是否已初始化
   * @private
   */
  _checkInit() {
    if (!this._initialized) {
      console.warn('广告服务尚未初始化');
      return false;
    }
    return true;
  }

  /**
   * 创建激励广告实例
   * @param {string} type 广告类型
   * @returns {object|null} 广告实例
   * @private
   */
  _createRewardedAd(type) {
    if (!this._checkInit()) return null;

    console.log(`创建${type}激励广告`);
    
    // 如果是生产环境，使用实际的激励广告API
    if (false) { // 开发阶段暂不启用
      const adUnitId = AD_UNIT_IDS[type];
      // 创建广告实例
      const rewardedAd = wx.createRewardedVideoAd({ adUnitId });
      
      // 监听广告关闭事件
      rewardedAd.onClose((res) => {
        console.log('激励广告关闭', res);
      });
      
      return rewardedAd;
    }
    
    // 开发环境返回模拟实例
    return {
      show: () => {
        console.log(`模拟展示${type}激励广告`);
        return Promise.resolve({ isEnded: true });
      },
      load: () => {
        console.log(`模拟加载${type}激励广告`);
        return Promise.resolve();
      }
    };
  }

  /**
   * 展示登录激励广告
   * @returns {Promise<boolean>} 是否完整观看广告
   */
  showLoginAd() {
    console.log('尝试展示登录激励广告');
    
    if (!this._checkInit()) {
      return Promise.resolve(true); // 开发模式直接返回成功
    }
    
    let adInstance = this._adInstances.get(AD_TYPES.LOGIN);
    
    if (!adInstance) {
      adInstance = this._createRewardedAd(AD_TYPES.LOGIN);
      this._adInstances.set(AD_TYPES.LOGIN, adInstance);
    }
    
    return adInstance.show().then(res => {
      const isCompleted = res && res.isEnded;
      console.log('登录激励广告展示完成，完成状态:', isCompleted);
      return isCompleted;
    }).catch(err => {
      console.error('登录激励广告展示失败:', err);
      // 展示失败时也视为观看完成，避免阻塞用户操作
      return true;
    });
  }

  /**
   * 展示普通激励广告
   * @returns {Promise<boolean>} 是否完整观看广告
   */
  showRewardAd() {
    console.log('尝试展示普通激励广告');
    
    if (!this._checkInit()) {
      return Promise.resolve(true); // 开发模式直接返回成功
    }
    
    let adInstance = this._adInstances.get(AD_TYPES.REWARD);
    
    if (!adInstance) {
      adInstance = this._createRewardedAd(AD_TYPES.REWARD);
      this._adInstances.set(AD_TYPES.REWARD, adInstance);
    }
    
    return adInstance.show().then(res => {
      const isCompleted = res && res.isEnded;
      console.log('普通激励广告展示完成，完成状态:', isCompleted);
      return isCompleted;
    }).catch(err => {
      console.error('普通激励广告展示失败:', err);
      // 先尝试加载再显示
      return adInstance.load().then(() => adInstance.show()).then(res => {
        return res && res.isEnded;
      }).catch(() => {
        // 二次尝试失败，视为观看完成
        return true;
      });
    });
  }

  /**
   * 展示插屏广告
   */
  showInterstitialAd() {
    console.log('尝试展示插屏广告');
    
    if (!this._checkInit()) return;
    
    // 开发阶段仅打印日志
    console.log('模拟展示插屏广告');
  }

  /**
   * 展示横幅广告
   * @param {string} selector 广告容器选择器
   */
  showBannerAd(selector) {
    console.log('尝试展示横幅广告，容器:', selector);
    
    if (!this._checkInit()) return;
    
    // 开发阶段仅打印日志
    console.log('模拟展示横幅广告');
  }

  /**
   * 隐藏横幅广告
   */
  hideBannerAd() {
    console.log('隐藏横幅广告');
    
    if (!this._checkInit()) return;
    
    // 开发阶段仅打印日志
    console.log('模拟隐藏横幅广告');
  }
}

// 导出单例实例
export const adService = new AdService();
export default adService; 
 