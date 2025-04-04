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
    this.initSampleData();
    
    // 延迟加载其他数据
    setTimeout(() => {
      // 加载其他数据
      this.loadReadingRecordsFromStorage();
      console.log('应用初始化完成，文章数量:', this.globalData.articles ? this.globalData.articles.length : 0);
    }, 500);
  },
  
  // 获取设备信息（异步）
  getDeviceInfo: function() {
    try {
      // 使用新的API代替已弃用的wx.getSystemInfoSync
      const deviceInfo = wx.getDeviceInfo();
      const windowInfo = wx.getWindowInfo();
      const appBaseInfo = wx.getAppBaseInfo();
      
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
      
      // 重置全局数据
      this.globalData = {
        articles: [],
        rewards: [],
        readingRecords: [],
        pageToShow: null
      };
      
      // 重新初始化示例数据
      this.initSampleData(true);
      
      // 重定向到首页
      wx.reLaunch({
        url: '/pages/index/index',
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
        this.globalData.readingRecords = storedRecords;
        console.log('使用本地存储的朗读记录');
      } else {
        // 使用示例朗读记录
        console.log('使用初始的朗读记录');
      }
    } catch (error) {
      console.error('加载朗读记录失败:', error);
    }
  },
  
  // 添加新的朗读记录
  addReadingRecord: function(record) {
    // 生成唯一ID
    record.id = Date.now().toString();
    // 添加时间戳
    record.timestamp = Date.now();
    // 格式化日期
    if (!record.date) {
      const now = new Date();
      record.date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }
    
    console.log('添加新的朗读记录:', record);
    this.globalData.readingRecords.unshift(record);
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
    
    // 重置全局数据
    this.globalData.articles = [];
    
    // 示例文章数据
    this.globalData.articles = [
      {
        id: '1',
        title: '静夜思',
        language: 'zh',
        level: '初级',
        content: '床前明月光，疑是地上霜。举头望明月，低头思故乡。',
        createdAt: '2023-05-15',
        wordCount: 20
      },
      {
        id: '2',
        title: 'Stopping by Woods on a Snowy Evening',
        language: 'en',
        level: '中级',
        content: 'Whose woods these are I think I know.\nHis house is in the village though;\nHe will not see me stopping here\nTo watch his woods fill up with snow.',
        createdAt: '2023-05-20',
        wordCount: 33
      },
      {
        id: '3',
        title: '小花猫钓鱼',
        language: 'zh',
        level: '初级',
        content: '有一只小花猫，它很喜欢钓鱼。一天，它带着鱼竿来到小河边，准备钓鱼。它找了一个好地方，把鱼饵放在鱼钩上，然后把鱼钩甩到水里。小花猫耐心地等待着，突然，鱼竿动了一下，小花猫赶紧提起鱼竿，一条大鱼上钩了！小花猫高兴地把鱼带回家，和家人一起分享了美味的鱼。',
        createdAt: '2023-05-22',
        wordCount: 97
      },
      {
        id: '4',
        title: 'The Little Red Hen',
        language: 'en',
        level: '中级',
        content: 'Once upon a time, there was a little red hen who lived on a farm. She was friends with a lazy dog, a sleepy cat, and a noisy duck. One day, the little red hen found some wheat seeds. She asked her friends, "Who will help me plant these wheat seeds?" "Not I," said the dog. "Not I," said the cat. "Not I," said the duck. "Then I will do it myself," said the little red hen. And she did.',
        createdAt: '2023-05-25',
        wordCount: 85
      }
    ];
    
    console.log('初始化了', this.globalData.articles.length, '篇文章');
    
    // 保存到本地存储
    this.saveArticlesToStorage();
    
    // 示例奖励数据
    this.globalData.rewards = [
      {
        id: '1',
        type: 'flower',
        count: 5,
        title: '阅读《静夜思》',
        date: '2023-05-16'
      },
      {
        id: '2',
        type: 'flower',
        count: 3,
        title: '连续学习三天',
        date: '2023-05-18'
      }
    ];
    
    // 示例学习记录
    this.globalData.readingRecords = [
      {
        id: '1',
        articleId: '1',
        articleTitle: '静夜思',
        score: 92,
        date: '2023-05-16',
        duration: 120 // 秒
      },
      {
        id: '2',
        articleId: '2',
        articleTitle: 'Stopping by Woods on a Snowy Evening',
        score: 85,
        date: '2023-05-21',
        duration: 180 // 秒
      }
    ];
    
    console.log('示例数据初始化完成');
  },
  
  globalData: {
    articles: [], // 文章列表
    rewards: [],  // 奖励列表
    readingRecords: [], // 阅读记录
    pageToShow: null // 用于标记需要自动跳转的页面
  }
})