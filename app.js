App({
  onLaunch: function () {
    // 初始化应用，加载示例数据
    this.loadArticlesFromStorage();
  },
  
  // 将文章数据保存到本地存储
  saveArticlesToStorage: function() {
    console.log('保存文章数据到本地存储:', this.globalData.articles);
    wx.setStorageSync('articles', this.globalData.articles);
  },
  
  // 从本地存储加载文章数据
  loadArticlesFromStorage: function() {
    const storedArticles = wx.getStorageSync('articles');
    console.log('从本地存储加载文章数据:', storedArticles);
    
    if (storedArticles && storedArticles.length > 0) {
      this.globalData.articles = storedArticles;
      console.log('使用本地存储的文章数据');
    } else {
      // 如果本地存储没有文章数据，则初始化示例数据
      this.initSampleData();
      console.log('使用示例文章数据');
    }
  },
  
  // 初始化示例数据
  initSampleData: function() {
    console.log('初始化示例数据');
    
    // 示例文章数据
    this.globalData.articles = [
      {
        id: '1',
        title: '静夜思',
        language: 'zh',
        level: '初级',
        content: '床前明月光，疑是地上霜。举头望明月，低头思故乡。',
        createdAt: '2023-05-15'
      },
      {
        id: '2',
        title: 'Stopping by Woods on a Snowy Evening',
        language: 'en',
        level: '中级',
        content: 'Whose woods these are I think I know.\nHis house is in the village though;\nHe will not see me stopping here\nTo watch his woods fill up with snow.',
        createdAt: '2023-05-20'
      },
      {
        id: '3',
        title: '小花猫钓鱼',
        language: 'zh',
        level: '初级',
        content: '有一只小花猫，它很喜欢钓鱼。一天，它带着鱼竿来到小河边，准备钓鱼。它找了一个好地方，把鱼饵放在鱼钩上，然后把鱼钩甩到水里。小花猫耐心地等待着，突然，鱼竿动了一下，小花猫赶紧提起鱼竿，一条大鱼上钩了！小花猫高兴地把鱼带回家，和家人一起分享了美味的鱼。',
        createdAt: '2023-05-22'
      },
      {
        id: '4',
        title: 'The Little Red Hen',
        language: 'en',
        level: '中级',
        content: 'Once upon a time, there was a little red hen who lived on a farm. She was friends with a lazy dog, a sleepy cat, and a noisy duck. One day, the little red hen found some wheat seeds. She asked her friends, "Who will help me plant these wheat seeds?" "Not I," said the dog. "Not I," said the cat. "Not I," said the duck. "Then I will do it myself," said the little red hen. And she did.',
        createdAt: '2023-05-25'
      }
    ];
    
    console.log('初始化文章数据:', JSON.stringify(this.globalData.articles));
    
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
        type: 'star',
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
  },
  
  globalData: {
    articles: [], // 文章列表
    rewards: [],  // 奖励列表
    readingRecords: [] // 阅读记录
  }
})