// app.js
App({
  onLaunch: function () {
    console.log('应用启动');

    // 添加全局错误监听
    wx.onError((error) => {
      console.error('全局错误:', error);
    });

    // 异步获取设备信息
    setTimeout(() => {
      this.getDeviceInfo();
    }, 0);

    // 立即初始化应用数据，确保数据可用
    this.initSampleData(); // 确保这里不会依赖 globalData.userInfo

    // 延迟加载其他数据
    setTimeout(() => {
      // 加载其他数据，如 readingRecords
      this.loadReadingRecordsFromStorage();
      console.log('应用初始化完成，文章数量:', this.globalData.articles ? this.globalData.articles.length : 0);
    }, 500);
  },

  onShow: function (options) {
    console.log('App: onShow have been invoked');
    // 这里可以添加每次进入前台需要执行的逻辑
  },

  // 获取设备信息（异步）
  getDeviceInfo: function() {
    try {
      const deviceInfo = wx.getDeviceInfo ? wx.getDeviceInfo() : wx.getSystemInfoSync(); // 兼容旧API
      const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : { windowWidth: deviceInfo.windowWidth, windowHeight: deviceInfo.windowHeight, pixelRatio: deviceInfo.pixelRatio };
      const appBaseInfo = wx.getAppBaseInfo ? wx.getAppBaseInfo() : { SDKVersion: deviceInfo.SDKVersion };

      console.log('设备信息:', {
        brand: deviceInfo.brand,
        model: deviceInfo.model,
        system: deviceInfo.system,
        platform: deviceInfo.platform,
        windowWidth: windowInfo.windowWidth,
        windowHeight: windowInfo.windowHeight,
        pixelRatio: windowInfo.pixelRatio,
        SDKVersion: appBaseInfo.SDKVersion
      });
    } catch (err) {
      console.error('获取设备信息失败:', err);
    }
  },

  // 重启小程序（用于处理严重错误）
  restartApp: function() {
    console.log('尝试重启小程序');
    try {
      // 清除所有缓存
      wx.clearStorageSync();

      // 重置全局数据 (保留初始结构)
      this.globalData = {
        userInfo: null, // 重置用户信息
        articles: [],
        rewards: [],
        readingRecords: [],
        pageToShow: null,
        // 保留其他可能需要的全局状态初始值
         preventAutoRedirect: false, // 示例：如果需要保留
         isTestPage: false         // 示例：如果需要保留
      };

      // 重新初始化示例数据
      this.initSampleData(true);

      // 重定向到首页
      wx.reLaunch({
        url: '/pages/index/index', // 确保这是正确的首页路径
        success: () => {
          console.log('成功重启应用');
          wx.showToast({
            title: '应用已重启',
            icon: 'success'
          });
        },
        fail: (error) => {
          console.error('重启应用失败:', error);
          wx.showToast({
            title: '重启失败，请手动退出小程序',
            icon: 'none'
          });
        }
      });
    } catch (error) {
      console.error('重启过程中发生错误:', error);
    }
  },

  // 将文章数据保存到本地存储
  saveArticlesToStorage: function() {
    console.log('保存文章数据到本地存储, 文章数量:', this.globalData.articles ? this.globalData.articles.length : 0);
    try {
      wx.setStorageSync('articles', this.globalData.articles);
      console.log('文章数据已保存到本地存储');
    } catch (error) {
      console.error('保存文章数据失败:', error);
    }
  },

  // 从本地存储加载文章数据
  loadArticlesFromStorage: function() {
    try {
      const storedArticles = wx.getStorageSync('articles');
      console.log('从本地存储加载文章数据, 发现文章数量:', storedArticles ? storedArticles.length : 0);

      if (storedArticles && storedArticles.length > 0) {
        this.globalData.articles = storedArticles;
        console.log('使用本地存储的文章数据');
        return true;
      } else {
        console.log('本地存储中没有文章数据');
        return false;
      }
    } catch (error) {
      console.error('加载文章数据失败:', error);
      return false;
    }
  },

  // 保存朗读记录到本地存储
  saveReadingRecordsToStorage: function() {
    console.log('保存朗读记录到本地存储:', this.globalData.readingRecords.length + '条记录');
    try {
      wx.setStorageSync('readingRecords', this.globalData.readingRecords);
    } catch (error) {
      console.error('保存朗读记录失败:', error);
    }
  },

  // 从本地存储加载朗读记录
  loadReadingRecordsFromStorage: function() {
    try {
      const storedRecords = wx.getStorageSync('readingRecords');
      console.log('从本地存储加载朗读记录, 发现记录数量:', storedRecords ? storedRecords.length : 0);

      if (storedRecords && storedRecords.length > 0) {
        // 确保加载的数据是数组
        if (Array.isArray(storedRecords)) {
            this.globalData.readingRecords = storedRecords;
            console.log('使用本地存储的朗读记录');
        } else {
             console.warn('本地存储的朗读记录格式不正确，已忽略:', storedRecords);
             this.globalData.readingRecords = []; // 使用空数组
        }
      } else {
        // 使用空数组作为初始记录
        this.globalData.readingRecords = [];
        console.log('本地存储无朗读记录，使用空数组');
      }
    } catch (error) {
      console.error('加载朗读记录失败:', error);
       this.globalData.readingRecords = []; // 出错时也使用空数组
    }
  },

  // 添加新的朗读记录
  addReadingRecord: function(record) {
    // 确保 record 是一个对象
    if (!record || typeof record !== 'object') {
        console.error('[addReadingRecord] Invalid record data:', record);
        return null;
    }
    // 生成唯一ID
    record.id = record.id || Date.now().toString() + Math.random().toString(16).slice(2); // 更可靠的唯一ID
    // 添加时间戳
    record.timestamp = record.timestamp || Date.now();
    // 格式化日期 (如果需要)
    if (!record.date) {
      const now = new Date(record.timestamp);
      record.date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }

    console.log('添加新的朗读记录:', record);
    // 确保 readingRecords 是数组
    if (!Array.isArray(this.globalData.readingRecords)) {
        this.globalData.readingRecords = [];
    }
    this.globalData.readingRecords.unshift(record); // 添加到数组开头
    this.saveReadingRecordsToStorage();
    return record;
  },
  
  // 初始化示例数据
  initSampleData: function(forceInit = false) {
    console.log('初始化示例数据, 强制初始化:', forceInit);

    // 如果不是强制初始化，先尝试从本地存储加载
    if (!forceInit && this.loadArticlesFromStorage()) {
      console.log('从本地存储成功加载了文章数据，无需初始化示例数据');
      return;
    }

    console.log('开始初始化默认示例数据...');

    // 重置全局数据为空数组
    this.globalData.articles = [];

    console.log('初始化了', this.globalData.articles.length, '篇文章');

    // 保存到本地存储
    this.saveArticlesToStorage();

    // 示例奖励数据 (如果需要)
    this.globalData.rewards = [];

    // 示例学习记录 (通常是空的，由用户产生)
    // this.globalData.readingRecords = []; // 确保 load 时会使用空数组
    console.log('示例数据初始化完成');
  },

  // --- 新增：模拟登录函数 ---
  login: function() {
      console.log('[app.js] Simulating login state...');
      // 实际应用中，这里会调用 wx.login 获取 code，发送到后端换取 session 和 userId
      // 这里我们只模拟设置一个 userId，并初始化 userInfo
      const mockUserId = 'mockUser_' + Date.now(); // 创建一个简单的模拟用户ID
      // 确保 globalData 存在
      if (!this.globalData) { this.globalData = {}; }
      this.globalData.userInfo = {
          userId: mockUserId,
          nickName: null, // 初始昵称为 null
          avatarUrl: null  // 初始头像为 null
      };
      console.log('[app.js] Basic user state set (mock userId): ', this.globalData.userInfo);
      // 注意：这里只是设置了基础状态，头像昵称需要 profile 页面后续获取
  },

  // --- 新增：模拟退出登录函数 ---
  logout: function() {
      console.log('[app.js] logout function called! Clearing user info.');
      console.log('[app.js] Simulating logout...');
      // 确保 globalData 存在
      if (!this.globalData) { this.globalData = {}; }
      this.globalData.userInfo = null; // 清除用户信息
      console.log('[app.js] User info cleared.');
      // 实际应用中可能还需要清除本地存储的 token 等
  },

  // 全局数据
  globalData: {
    userInfo: null, // 初始化 userInfo 为 null
    articles: [], // 文章列表
    rewards: [],  // 奖励列表
    readingRecords: [], // 朗读/背诵记录
    pageToShow: null, // 示例：用于页面间通信
    preventAutoRedirect: false, // 示例：全局标志
    isTestPage: false         // 示例：全局标志
  }
})