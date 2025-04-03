// pages/article-list/article-list.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    articles: [],  // 文章列表
    selectedLanguage: 'all', // 当前选择的语言筛选：'all', 'zh', 'en'
    languages: [
      { value: 'all', text: '全部' },
      { value: 'zh', text: '中文' },
      { value: 'en', text: '英文' }
    ],
    filteredArticles: [], // 筛选后的文章
    isLoading: true, // 加载状态
    debugMode: true,  // 开启调试模式
    loadingDotCount: '...', // 加载动画点数
    showActionPanel: false,
    currentArticle: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('文章列表页面 - onLoad 执行');
    // 在页面加载时添加日志，确认页面被加载
    wx.showToast({
      title: '正在加载...',
      icon: 'loading',
      duration: 2000
    });
    
    // 初始化加载动画
    this.startLoadingAnimation();
    
    // 立即加载文章数据
    this.loadArticles();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    console.log('文章列表页面 - onReady 执行');
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    console.log('文章列表页面 - onShow 执行');
    
    // 检查是否是从首页跳转过来的（通过全局变量标记）
    const app = getApp();
    if (app.globalData.pageToShow === 'article-list') {
      console.log('检测到从首页传递的跳转标记，已成功加载文章列表页面');
      // 清除跳转标记
      app.globalData.pageToShow = null;
      
      // 显示成功提示
      wx.showToast({
        title: '加载成功',
        icon: 'success',
        duration: 1000
      });
    }
    
    // 每次显示页面时刷新文章列表，确保数据最新
    this.setData({ isLoading: true });
    this.loadArticles();
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    console.log('文章列表页面 - onHide 执行');
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    console.log('文章列表页面 - onUnload 执行');
    // 确保在页面卸载时清理定时器
    this.stopLoadingAnimation();
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    console.log('文章列表页面 - 下拉刷新');
    // 下拉刷新，重新加载文章
    this.setData({ isLoading: true });
    this.resetAndRefresh();
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    console.log('文章列表页面 - 上拉触底');
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '顺口成章 - 提升口语表达能力',
      path: '/pages/index/index'
    }
  },

  // 重启小程序
  restartApp() {
    console.log('用户触发重启小程序');
    wx.showModal({
      title: '确认重启',
      content: '您确定要重启小程序吗？这将清除所有临时数据。',
      success: (res) => {
        if (res.confirm) {
          console.log('用户确认重启小程序');
          // 调用 app 实例中的重启方法
          const app = getApp();
          if (app && app.restartApp) {
            app.restartApp();
          } else {
            // 如果 app 实例不可用，则执行本地重启逻辑
            wx.clearStorageSync();
            wx.reLaunch({
              url: '/pages/index/index'
            });
          }
        } else {
          console.log('用户取消重启');
        }
      }
    });
  },

  // 重置和刷新
  resetAndRefresh() {
    console.log('重置并刷新');
    
    try {
      // 清除本地存储
      wx.removeStorageSync('articles');
      console.log('清除本地存储的文章数据');
      
      // 重置全局数据
      const app = getApp();
      app.globalData.articles = [];
      
      // 初始化数据
      app.initSampleData();
      
      // 重新加载数据
      this.loadArticles();
      
      // 提示用户
      wx.showToast({
        title: '数据已重置',
        icon: 'success',
        duration: 1500
      });
    } catch (error) {
      console.error('重置和刷新失败:', error);
      wx.showToast({
        title: '重置失败，请重试',
        icon: 'none'
      });
    }
  },

  // 加载文章数据
  loadArticles() {
    console.log('阅读练习页面 - 加载文章数据');
    this.setData({ isLoading: true });
    
    // 尝试从全局数据获取文章
    const app = getApp();
    let articles = [];
    
    try {
      // 检查全局数据中是否有文章
      if (app.globalData && app.globalData.articles && app.globalData.articles.length > 0) {
        articles = app.globalData.articles;
        console.log('阅读练习页面 - 从全局数据获取文章数据:', articles.length + '篇文章');
        
        // 处理文章内容，替换换行符
        articles = this.processArticlesContent(articles);
        
      } else {
        console.log('阅读练习页面 - 全局数据中没有文章，尝试初始化示例数据');
        // 确保应用初始化示例数据
        app.initSampleData();
        articles = app.globalData.articles;
        
        if (!articles || articles.length === 0) {
          console.log('阅读练习页面 - 全局数据仍然为空，使用直接硬编码的示例数据');
          // 如果全局数据仍然为空，使用硬编码的示例数据
          articles = [
            {
              id: '1',
              title: '静夜思',
              language: 'zh',
              level: '初级',
              content: '床前明月光，疑是地上霜。举头望明月，低头思故乡。'
            },
            {
              id: '2',
              title: 'Stopping by Woods on a Snowy Evening',
              language: 'en',
              level: '中级',
              content: 'Whose woods these are I think I know.\nHis house is in the village though;\nHe will not see me stopping here\nTo watch his woods fill up with snow.'
            },
            {
              id: '3',
              title: '小花猫钓鱼',
              language: 'zh',
              level: '初级',
              content: '有一只小花猫，它很喜欢钓鱼。一天，它带着鱼竿来到小河边，准备钓鱼。它找了一个好地方，把鱼饵放在鱼钩上，然后把鱼钩甩到水里。小花猫耐心地等待着，突然，鱼竿动了一下，小花猫赶紧提起鱼竿，一条大鱼上钩了！小花猫高兴地把鱼带回家，和家人一起分享了美味的鱼。'
            },
            {
              id: '4',
              title: 'The Little Red Hen',
              language: 'en',
              level: '中级',
              content: 'Once upon a time, there was a little red hen who lived on a farm. She was friends with a lazy dog, a sleepy cat, and a noisy duck. One day, the little red hen found some wheat seeds. She asked her friends, "Who will help me plant these wheat seeds?" "Not I," said the dog. "Not I," said the cat. "Not I," said the duck. "Then I will do it myself," said the little red hen. And she did.'
            }
          ];
          
          // 将硬编码的示例数据添加到全局数据中
          app.globalData.articles = articles;
          app.saveArticlesToStorage();
        }
      }
    } catch (error) {
      console.error('获取文章数据失败:', error);
      // 出错时使用备用数据
      articles = [
        {
          id: '1',
          title: '静夜思',
          language: 'zh',
          level: '初级',
          content: '床前明月光，疑是地上霜。举头望明月，低头思故乡。'
        },
        {
          id: '2',
          title: 'Stopping by Woods on a Snowy Evening',
          language: 'en',
          level: '中级',
          content: 'Whose woods these are I think I know.\nHis house is in the village though;\nHe will not see me stopping here\nTo watch his woods fill up with snow.'
        }
      ];
      console.log('阅读练习页面 - 加载失败，使用备用数据');
    }
    
    // 检查数据是否有效
    if (!Array.isArray(articles)) {
      console.error('文章数据不是数组，强制转换为空数组');
      articles = [];
    }
    
    console.log(`文章列表数据状态: 获取到 ${articles.length} 篇文章`);
    
    // 处理文章数据，例如添加额外信息
    const processedArticles = articles.map(item => {
      // 先确保content字段存在
      const content = item.content || '';
      
      // 计算字数
      const wordCount = item.language === 'zh' ? 
        content.length : 
        content.split(/\s+/).filter(word => word.length > 0).length;
        
      // 生成预览内容
      let previewContent = content.replace(/[\n\r]+/g, ' ').trim();
      previewContent = previewContent.substring(0, 50) + (previewContent.length > 50 ? '...' : '');
      
      return {
        ...item,
        wordCount,
        previewContent
      };
    });
    
    console.log('阅读练习页面 - 处理后文章数据:', processedArticles.length + '篇文章');
    
    // 优化：如果没有数据，直接显示空状态
    if (processedArticles.length === 0) {
      console.log('警告：没有文章数据可显示');
      this.stopLoadingAnimation(); // 停止加载动画
      this.setData({
        articles: [],
        filteredArticles: [],
        isLoading: false
      });
      
      // 显示错误提示
      wx.showToast({
        title: '没有可用的文章数据',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    
    // 延迟设置数据，确保有加载状态效果
    setTimeout(() => {
      this.stopLoadingAnimation(); // 停止加载动画
      this.setData({
        articles: processedArticles,
        isLoading: false
      }, () => {
        // 确保在设置数据后应用语言筛选
        this.filterArticlesByLanguage();
        
        // 显示成功提示
        if (processedArticles.length > 0) {
          wx.showToast({
            title: '加载成功',
            icon: 'success',
            duration: 1000
          });
        }
      });
    }, 500);
  },
  
  // 根据语言筛选文章
  filterArticlesByLanguage() {
    const { articles, selectedLanguage } = this.data;
    
    if (!Array.isArray(articles)) {
      console.error('筛选文章失败：articles 不是一个数组');
      this.setData({ filteredArticles: [] });
      return;
    }
    
    try {
      if (selectedLanguage === 'all') {
        this.setData({ filteredArticles: articles });
      } else {
        const filtered = articles.filter(article => article.language === selectedLanguage);
        this.setData({ filteredArticles: filtered });
      }
      
      console.log(`筛选${selectedLanguage}文章，结果数量:`, this.data.filteredArticles.length);
    } catch (error) {
      console.error('筛选文章时发生错误:', error);
      this.setData({ filteredArticles: [] });
    }
  },
  
  // 切换语言筛选
  switchLanguage(e) {
    const language = e.currentTarget.dataset.lang;
    console.log('切换语言筛选:', language);
    
    this.setData({ selectedLanguage: language }, () => {
      this.filterArticlesByLanguage();
    });
  },
  
  // 跳转到朗读练习
  startReading(e) {
    const articleId = e.currentTarget.dataset.id;
    console.log('开始朗读练习，文章ID:', articleId);
    // 添加 fail 回调以捕获导航错误
    wx.navigateTo({
      url: `/pages/student/reading/reading?id=${articleId}`,
      fail: (err) => {
        console.error('跳转到朗读页面失败:', err);
      }
    });
  },
  
  // 添加：开始背诵练习函数
  startRecitePractice(e) {
    const articleId = e.currentTarget.dataset.id;
    console.log('[ArticleList] Starting recite practice for article ID:', articleId);
    wx.navigateTo({
      url: `/pages/student/recite_practice/recite_practice?id=${articleId}`,
      success: function(res) {
        console.log('[ArticleList] Navigation to recite_practice successful:', res);
      },
      fail: function(err) {
        console.error('[ArticleList] Navigation to recite_practice failed:', err);
        wx.showToast({ title: '无法打开背诵页面', icon: 'none' });
      }
    });
  },
  
  // 跳转到文章详情 (此函数可能已废弃，因为通常列表直接操作)
  goToArticleDetail(e) {
    const articleId = e.currentTarget.dataset.id;
    const title = e.currentTarget.dataset.title;
    console.log('查看文章详情:', articleId, title);
    wx.showToast({
      title: `选择了"${title}"`,
      icon: 'none'
    });
  },
  
  // 显示文章操作选项
  showArticleOptions(e) {
    const id = e.currentTarget.dataset.id;
    const title = e.currentTarget.dataset.title;
    this.setData({
      showActionPanel: true,
      currentArticle: { id, title }
    });
  },
  
  // 捕获面板点击事件，防止事件冒泡
  catchPanelTap() {
    // 仅用于阻止冒泡，无需实际操作
    console.log('点击面板内部，阻止冒泡');
  },
  
  // 隐藏操作面板
  hideActionPanel() {
    this.setData({
      showActionPanel: false
    });
  },
  
  // 执行删除操作
  handleDeleteArticle() {
    this.hideActionPanel();
    this.confirmDeleteArticle(this.data.currentArticle.id, this.data.currentArticle.title);
  },
  
  // 执行分享操作
  handleShareArticle() {
    this.hideActionPanel();
    wx.showToast({
      title: '分享功能开发中',
      icon: 'none'
    });
  },
  
  // 执行收藏操作
  handleCollectArticle() {
    this.hideActionPanel();
    wx.showToast({
      title: '收藏功能开发中',
      icon: 'none'
    });
  },
  
  // 确认删除文章
  confirmDeleteArticle(articleId, title) {
    wx.showModal({
      title: '确认删除',
      content: `确定要删除"${title}"吗？此操作不可恢复。`,
      confirmColor: '#ff4d4f',
      success: (res) => {
        if (res.confirm) {
          this.performArticleDeletion(articleId);
        }
      }
    });
  },
  
  // 跳转到文章输入页面
  navigateToArticleInput() {
    wx.navigateTo({
      url: '/pages/article-input/article-input',
      fail: (err) => {
        console.error('跳转到文章输入页面失败:', err);
        wx.showToast({
          title: '跳转失败，请重试',
          icon: 'none'
        });
      }
    });
  },
  
  // 跳转到语音测试页面
  navigateToVoiceTest() {
    wx.navigateTo({
      url: '/pages/voice-test/voice-test',
      fail: (err) => {
        console.error('跳转到语音测试页面失败:', err);
        wx.showToast({
          title: '跳转失败，请重试',
          icon: 'none'
        });
      }
    });
  },
  
  // 开始加载动画
  startLoadingAnimation() {
    // 使用CSS样式处理而不是操作DOM元素
    console.log('加载动画开始');
    
    // 使用类名切换而不是直接操作DOM元素
    this.animationCount = 0;
    
    // 只创建一个定时器
    this.loadingTimer = setInterval(() => {
      this.animationCount = (this.animationCount + 1) % 4;
      // 使用setData更新动画状态，让视图层处理
      this.setData({
        loadingDotCount: '.'.repeat(this.animationCount + 1)
      });
    }, 500);
  },
  
  // 停止加载动画
  stopLoadingAnimation() {
    if (this.loadingTimer) {
      clearInterval(this.loadingTimer);
      this.loadingTimer = null;
      console.log('加载动画停止');
    }
  },
  
  // 处理文章内容，替换换行符为空格
  processArticlesContent(articles) {
    return articles.map(article => {
      if (article.content) {
        // 创建一个新对象，避免修改原始对象
        return {
          ...article,
          // 保存原始内容
          originalContent: article.content,
          // 处理后的内容用于预览
          content: article.content.replace(/[\n\r]+/g, ' ')
        };
      }
      return article;
    });
  },
  
  // 执行文章删除操作
  performArticleDeletion(articleId) {
    console.log('执行删除文章:', articleId);
    
    // 获取全局数据
    const app = getApp();
    
    // 从全局数据中删除文章
    if (app.globalData && app.globalData.articles) {
      const originalLength = app.globalData.articles.length;
      app.globalData.articles = app.globalData.articles.filter(item => item.id !== articleId);
      
      // 检查是否成功删除
      if (originalLength > app.globalData.articles.length) {
        console.log('成功从全局数据中删除文章');
        
        // 保存到本地存储
        try {
          wx.setStorageSync('articles', app.globalData.articles);
          console.log('成功更新本地存储');
          
          // 更新当前页面数据
          this.setData({
            articles: app.globalData.articles
          }, () => {
            // 重新筛选文章
            this.filterArticlesByLanguage();
            
            // 显示成功提示
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            });
          });
        } catch (error) {
          console.error('保存到本地存储失败:', error);
          wx.showToast({
            title: '删除成功，但保存失败',
            icon: 'none'
          });
        }
      } else {
        console.error('未找到要删除的文章');
        wx.showToast({
          title: '删除失败，未找到文章',
          icon: 'none'
        });
      }
    } else {
      console.error('全局数据不可用');
      wx.showToast({
        title: '删除失败，请重试',
        icon: 'none'
      });
    }
  },
})