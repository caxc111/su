// pages/student/article-list/article-list.js
Page({
  data: {
    articles: [],
    selectedLanguage: 'all', // 'all', 'zh', 'en'
    languages: [
      { value: 'all', text: '全部' },
      { value: 'zh', text: '中文' },
      { value: 'en', text: '英文' }
    ],
    flowerCount: 8, // 示例花朵数
    userInfo: {
      nickName: '同学',
      avatarUrl: '/images/default-avatar.png'
    }
  },

  onLoad: function (options) {
    this.loadArticles();
  },
  
  onShow: function() {
    // 每次显示页面时重新加载文章列表
    this.loadArticles();
    
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0
      });
    }
  },

  // 加载文章列表
  loadArticles: function() {
    const app = getApp();
    
    // 确保有初始数据
    if (!app.globalData.articles || app.globalData.articles.length === 0) {
      app.initSampleData();
    }
    
    // 获取全局文章数据
    let articles = app.globalData.articles || [];
    
    console.log('阅读练习页面 - 原始文章数据:', articles);
    
    // 根据语言筛选
    if (this.data.selectedLanguage !== 'all') {
      articles = articles.filter(article => article.language === this.data.selectedLanguage);
    }
    
    // 计算字数并准备显示数据
    let processedArticles = [];
    for (let i = 0; i < articles.length; i++) {
      let article = articles[i];
      
      // 确保每个字段都有值，防止undefined
      processedArticles.push({
        id: article.id || '',
        title: article.title || '未命名文章',
        content: article.content || '暂无内容',
        language: article.language || 'zh',
        level: article.level || '适中',
        wordCount: article.language === 'zh' ? 
          (article.content || '').length : 
          (article.content || '').split(/\s+/).length,
        hasRead: false // 默认未读
      });
    }
    
    this.setData({
      articles: processedArticles
    });
    
    console.log('阅读练习页面 - 处理后文章数据:', processedArticles);
  },

  // 语言筛选切换
  onLanguageChange: function(e) {
    const language = e.currentTarget.dataset.language;
    this.setData({
      selectedLanguage: language
    });
    this.loadArticles();
  },

  // 跳转到阅读页面
  goToReading: function(e) {
    const articleId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: '../reading/reading?id=' + articleId
    });
  },

  // 跳转到历史记录页面
  goToHistory: function() {
    wx.navigateTo({
      url: '../history/history'
    });
  },

  // 开始朗读练习
  startReading(e) {
    const articleId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/student/reading/reading?id=${articleId}`
    });
  },
})