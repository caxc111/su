// miniprogram/pages/index/index.js
import { PAGES, formatTime } from '../../utils/constant';
const app = getApp(); // 获取应用实例

Page({
  /**
   * 页面的初始数据
   */
  data: {
    isAppReady: false,    // 应用是否已准备好 (app.waitForReady 完成)
    pageReady: false,     // 页面自身数据是否已加载完成
    loadingError: '',     // 加载错误信息
    
    // 文章相关
    currentTab: 'all',    // 当前选中的 Tab ('all', 'chinese', 'english')
    articles: [],         // 文章列表
    isLoading: false,     // 是否正在加载文章

    // 语音相关
    isSpeaking: false,         // 是否正在播放语音
    speechProgress: 0,          // 语音播放进度
    currentSentence: '',        // 当前朗读的句子
    currentPlayingArticleId: '', // 当前播放的文章ID
    speechRate: 1.0,            // 语音播放速度
  },

  /**
   * 生命周期函数--监听页面加载
   * @param {object} options 页面加载时传入的参数
   */
  async onLoad(options) {
    console.log('[Index] onLoad triggered with options:', options);
    this.setData({ 
      isAppReady: false, 
      pageReady: false, 
      loadingError: '' 
    }); // 初始化页面状态

    try {
      // 直接等待 app 初始化完成 (包括 speechService.init())
      const appReadyStatus = await app.waitForReady(); 
      console.log('[Index] app.waitForReady completed with status:', appReadyStatus);

      if (appReadyStatus) {
        // App 初始化成功 (即使语音服务可能失败，app 本身也标记为 ready)
        console.log('[Index] App is ready. Proceeding with page initialization.');
        this.setData({ isAppReady: true }); 

        // *** 在这里添加登录状态检查 ***
        if (!app.globalData.userInfo) { // 假设用 userInfo 判断登录状态
          console.log('[Index] User not logged in, redirecting to login page...');
          wx.redirectTo({
            url: '/pages/login/login',
            fail: (err) => {
              console.error('[Index] Failed to redirect to login page:', err);
              // 如果重定向失败，可能需要显示错误提示
              this.setData({ loadingError: '无法跳转到登录页' });
            }
          });
          return; // 重定向后，不再执行后续的 initPageData
        } 
        // *** 登录状态检查结束 ***
        
        // 如果已登录，继续初始化页面数据
        await this.initPageData(options); 

      } else {
        // App 初始化流程完成，但可能有内部错误（例如语音服务初始化失败）
        console.error('[Index] App initialization finished but indicated failure (e.g., speech service failed).');
        this.setData({ 
          isAppReady: false, // 或者 true，根据是否要显示部分内容
          loadingError: '应用核心服务初始化失败，部分功能可能受限',
          pageReady: false 
        });
        // 可以在这里决定是否仍然尝试加载页面的非核心部分
        // await this.initPageData(options); 
      }

    } catch (error) {
      // 等待 app.waitForReady() 或 initPageData 时发生异常
      console.error('[Index] Error during onLoad:', error);
      this.setData({ 
        isAppReady: false,
        loadingError: '页面加载过程中发生错误，请稍后重试',
        pageReady: false 
      });
      // 可以在这里上报错误日志
    } finally {
        // 可以在这里停止下拉刷新动画等，如果需要的话
        // wx.stopPullDownRefresh();
    }
  },

  /**
   * 初始化页面数据
   * @param {object} options onLoad 传入的参数
   */
  async initPageData(options) {
    console.log('[Index] Initializing page data...');
    this.setData({ isLoading: true });

    try {
      // 获取语音服务 (需要检查是否可用, 因为 init 可能失败)
      const speech = app.getSpeechService();
      if (speech) {
        console.log('[Index] Speech service is available.');
        this.setupSpeechListeners(); // 设置语音监听器
        
        // 提前请求麦克风权限
        this.requestRecordAuth();
      } else {
        console.warn('[Index] Speech service is not available.');
        // 可能需要禁用语音相关功能或显示提示
      }
      
        // 加载文章列表
      await this.loadArticles(); 
      
      // 数据加载完成
      this.setData({ pageReady: true });
      console.log('[Index] Page data initialization complete.');

    } catch (error) {
      console.error('[Index] Error during initPageData:', error);
      this.setData({ 
        loadingError: '加载页面数据时出错',
        pageReady: false 
      });
    } finally {
      this.setData({ isLoading: false });
    }
  },

  /**
   * 请求麦克风授权
   */
  requestRecordAuth: function() {
    wx.getSetting({
      success: (res) => {
        // 检查是否已经授权录音功能
        if (!res.authSetting['scope.record']) {
          wx.authorize({
            scope: 'scope.record',
            success: () => {
              console.log('[Index] 麦克风授权成功');
            },
            fail: (err) => {
              console.error('[Index] 麦克风授权失败', err);
              // 保持静默，避免频繁弹窗影响用户体验
              // 用户将在实际使用录音功能时再次收到授权提示
            }
          });
        } else {
          console.log('[Index] 已授权麦克风权限');
        }
      }
    });
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    console.log('[Index] onShow - 页面显示');
    if (this.data.isAppReady) {
      console.log('[Index] onShow - App is ready, can refresh data if needed.');
      // 刷新文章列表
      if (this.data.pageReady) {
        this.loadArticles();
      }
    } else {
       console.log('[Index] onShow - App not ready yet.');
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    console.log('[Index] onReady - 页面初次渲染完成');
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    console.log('[Index] onHide - 页面隐藏');
    // 停止语音活动
    if (this.data.isAppReady) {
    const speech = app.getSpeechService();
      if (speech) {
        this.handleStopSpeech();
      }
    }
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    console.log('[Index] onUnload - 页面卸载');
    // 清理事件监听器
    this.removeSpeechListeners(); 
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: async function () {
    console.log('[Index] onPullDownRefresh triggered');
    if (this.data.isAppReady) {
        await this.loadArticles(); // 重新加载文章
    } else {
        console.log('[Index] onPullDownRefresh - App not ready, cannot refresh.');
    }
    wx.stopPullDownRefresh(); // 停止下拉刷新动画
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    console.log('[Index] onReachBottom triggered');
    // 加载更多文章，目前不做分页处理
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    console.log('[Index] onShareAppMessage triggered');
    return {
      title: '顺口成章 - 快来一起练习朗读和背诵吧！',
      path: '/pages/index/index'
    }
  },

  /**
   * 切换 Tab
   */
  switchTab: function(event) {
    const tab = event.currentTarget.dataset.tab;
    if (tab !== this.data.currentTab) {
      console.log('[Index] Switching tab to:', tab);
      this.setData({ currentTab: tab });
      this.loadArticles(); // 重新加载文章
    }
  },

  /**
   * 加载文章列表
   */
  loadArticles: async function() {
    console.log('[Index] Loading articles for tab:', this.data.currentTab);
    this.setData({ isLoading: true });

    try {
      // 从本地存储获取文章
      let articles = wx.getStorageSync('articles') || [];
      
      // 根据当前选中的标签过滤文章
      if (this.data.currentTab !== 'all') {
        articles = articles.filter(article => 
          article.language === (this.data.currentTab === 'chinese' ? '中文' : '英文')
        );
      }
      
      // 为每篇文章生成预览内容
      articles = articles.map(article => ({
        ...article,
        preview: article.content.substring(0, 50) + (article.content.length > 50 ? '...' : '')
      }));
      
      this.setData({ articles, isLoading: false });
      
      if (articles.length === 0) {
        console.log('[Index] No articles found, adding demo articles');
        // 如果没有文章，可以添加一些示例文章（首次使用）
        this.addDemoArticles();
      }
    } catch (error) {
      console.error('[Index] Failed to load articles:', error);
      wx.showToast({ title: '加载文章失败', icon: 'none' });
      this.setData({ isLoading: false });
    }
  },

  /**
   * 添加示例文章（首次使用）
   */
  addDemoArticles: function() {
    const demoArticles = [
      {
        id: 'demo1',
        title: '春晓',
        content: '春眠不觉晓，处处闻啼鸟。夜来风雨声，花落知多少。',
        language: '中文',
        level: '入门',
        lessonNo: '1',
        wordCount: 24,
        timestamp: Date.now()
      },
      {
        id: 'demo2',
        title: 'Hello World',
        content: 'Hello world! This is a sample English article for practice. Let\'s read it together.',
        language: '英文',
        level: '初级',
        lessonNo: '1',
        wordCount: 15,
        timestamp: Date.now()
      }
    ];
    
    // 添加到本地存储
    wx.setStorageSync('articles', demoArticles);
    
    // 更新页面数据
       this.setData({
      articles: demoArticles.map(article => ({
        ...article,
        preview: article.content.substring(0, 50) + (article.content.length > 50 ? '...' : '')
      }))
    });
  },

  /**
   * 处理添加文章
   */
  handleAddArticle: function() {
    console.log('[Index] handleAddArticle');
    wx.showActionSheet({
      itemList: ['输入新文章', '选择预设课文'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 输入新文章
          this.showAddArticleModal();
        } else if (res.tapIndex === 1) {
          // 选择预设课文
          this.showPresetTextsModal();
        }
      }
    });
  },

  /**
   * 显示添加文章的模态框
   */
  showAddArticleModal: function() {
    wx.showModal({
      title: '添加新文章',
      content: '请输入文章标题和内容',
      showCancel: true,
      cancelText: '取消',
      confirmText: '继续',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: '/pages/article-edit/article-edit'
          });
        }
      }
    });
  },

  /**
   * 显示预设课文选择框
   */
  showPresetTextsModal: function() {
    console.log('[Index] showPresetTextsModal');
    
    // 预设文章列表
    const presetTexts = [
      {
        title: '春晓',
        content: '春眠不觉晓，处处闻啼鸟。夜来风雨声，花落知多少。',
        language: '中文',
        level: '入门',
        lessonNo: '1'
      },
      {
        title: '静夜思',
        content: '床前明月光，疑是地上霜。举头望明月，低头思故乡。',
        language: '中文',
        level: '入门',
        lessonNo: '2'
      },
      {
        title: 'The Road Not Taken (节选)',
        content: 'Two roads diverged in a wood, and I—\nI took the one less traveled by,\nAnd that has made all the difference.',
        language: '英文',
        level: '中级',
        lessonNo: '3'
      },
      {
        title: '登鹳雀楼',
        content: '白日依山尽，黄河入海流。欲穷千里目，更上一层楼。',
        language: '中文',
        level: '入门',
        lessonNo: '4'
      },
      {
        title: '悯农',
        content: '锄禾日当午，汗滴禾下土。谁知盘中餐，粒粒皆辛苦。',
        language: '中文',
        level: '入门',
        lessonNo: '5'
      }
    ];
    
    // 显示预设文章列表
    wx.showActionSheet({
      itemList: presetTexts.map(item => item.title),
      success: (res) => {
        const selectedText = presetTexts[res.tapIndex];
        
        // 确认添加
        wx.showModal({
          title: '添加预设课文',
          content: `确认添加《${selectedText.title}》到您的文章列表?`,
          success: (modalRes) => {
            if (modalRes.confirm) {
              // 添加到本地存储
              this.addArticleToStorage(selectedText);
            }
          }
        });
      }
    });
  },
  
  /**
   * 添加文章到本地存储
   */
  addArticleToStorage: function(articleData) {
    // 从本地存储获取现有文章
    const articles = wx.getStorageSync('articles') || [];
    
    // 创建新文章对象
    const newArticle = {
      ...articleData,
      id: 'article_' + Date.now(),
      wordCount: articleData.content.length,
      timestamp: Date.now()
    };
    
    // 添加到文章列表
    articles.push(newArticle);
    
    // 保存到本地存储
    wx.setStorageSync('articles', articles);
    
    // 刷新文章列表
    this.loadArticles();
    
    // 显示成功提示
    wx.showToast({
      title: '添加成功',
      icon: 'success'
    });
  },

  /**
   * 设置语音相关监听器
   */
  setupSpeechListeners: function() {
    console.log('[Index] Setting up speech listeners');
    // 在实际开发中，这里可以添加语音事件监听
  },
  
  /**
   * 移除语音相关监听器
   */
  removeSpeechListeners: function() {
    console.log('[Index] Removing speech listeners');
    // 在实际开发中，这里可以移除语音事件监听
  },

  /**
   * 处理语音测试
   */
  handleVoiceTest: function(e) {
    console.log('[Index] handleVoiceTest');
    const speechService = app.getSpeechService();
    
    if (!speechService) {
      wx.showToast({
        title: '语音服务不可用',
        icon: 'none'
      });
      return;
    }
    
    const articleId = e.currentTarget.dataset.articleid || '';
    
    // 如果当前正在播放，则停止播放
    if (this.data.isSpeaking) {
      this.handleStopSpeech();
      return;
    }
    
    // 获取要播放的文章内容
    let textToSpeak = '欢迎使用顺口成章小程序，这是一个语音测试。';
    
    if (articleId) {
      const article = this.data.articles.find(item => item.id === articleId);
      if (article) {
        textToSpeak = article.content;
      }
    }
    
    // 开始播放
    this.setData({
      isSpeaking: true,
      speechProgress: 0,
      currentSentence: textToSpeak.substring(0, 30) + (textToSpeak.length > 30 ? '...' : ''),
      currentPlayingArticleId: articleId
    });
    
    // 模拟语音进度（实际应用中应该使用语音服务的事件）
    this.startProgressSimulation();
    
    // 获取当前语速设置
    const speechRate = this.data.speechRate || 1.0;
    console.log(`[Index] 使用语速: ${speechRate}x`);
    
    // 播放语音
    speechService.textToSpeech(textToSpeak, speechRate)
      .then(filePath => {
        return speechService.playAudio(filePath, () => {
          // 播放结束回调
          this.setData({
            isSpeaking: false,
            speechProgress: 100,
            currentPlayingArticleId: ''
          });
          // 清除进度模拟
          this.clearProgressSimulation();
        });
      })
      .catch(error => {
        console.error('[Index] 播放失败:', error);
      wx.showToast({
          title: '播放失败',
        icon: 'none'
      });
       this.setData({
           isSpeaking: false,
           speechProgress: 0,
          currentPlayingArticleId: ''
       });
        // 清除进度模拟
        this.clearProgressSimulation();
    });
  },

  /**
   * 开始进度模拟（实际应用中应该使用语音服务的真实进度）
   */
  startProgressSimulation: function() {
    // 清除可能存在的旧定时器
    this.clearProgressSimulation();
    
    // 创建新定时器，每100ms更新一次进度
    this.progressInterval = setInterval(() => {
      if (this.data.speechProgress < 100) {
        this.setData({
          speechProgress: this.data.speechProgress + 1
        });
      } else {
        this.clearProgressSimulation();
      }
    }, 100);
  },

  /**
   * 清除进度模拟
   */
  clearProgressSimulation: function() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  },

  /**
   * 停止语音播放
   */
  handleStopSpeech: function() {
    console.log('[Index] handleStopSpeech');
    const speechService = app.getSpeechService();
    
    if (speechService && this.data.isSpeaking) {
      speechService.stopAudio();
      
      this.setData({
        isSpeaking: false,
        speechProgress: 0,
        currentPlayingArticleId: ''
      });
      
      // 清除进度模拟
      this.clearProgressSimulation();
    }
  },

  /**
   * 改变语音速率
   */
  handleChangeRate: function() {
    console.log('[Index] handleChangeRate');
    const rates = [0.5, 0.75, 1.0, 1.25, 1.5];
    const currentIndex = rates.indexOf(this.data.speechRate);
    const nextIndex = (currentIndex + 1) % rates.length;
    
    this.setData({
      speechRate: rates[nextIndex]
    });
    
    wx.showToast({
      title: `语速: ${this.data.speechRate}x`,
      icon: 'none'
    });
  },

  /**
   * 处理朗读练习
   */
  handlePracticeReading: function(e) {
    const articleId = e.currentTarget.dataset.id;
    const article = this.data.articles.find(item => item.id === articleId);
    
    if (article) {
      wx.navigateTo({
        url: `/pages/reading/reading?id=${articleId}`
      });
    }
  },

  /**
   * 处理背诵练习
   */
  handlePracticeReciting: function(e) {
    const articleId = e.currentTarget.dataset.id;
    const article = this.data.articles.find(item => item.id === articleId);
    
    if (article) {
      wx.navigateTo({
        url: `/pages/reciting/reciting?id=${articleId}`
      });
    }
  },
  
  /**
   * 显示更多操作菜单
   */
  showMoreActions: function(e) {
    const articleId = e.currentTarget.dataset.id;

    wx.showActionSheet({
      itemList: ['删除', '编辑', '分享'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0: // 删除
            this.handleDeleteArticle(articleId);
            break;
          case 1: // 编辑
            this.handleEditArticle(articleId);
            break;
          case 2: // 分享
            this.handleShareArticle(articleId);
            break;
        }
      }
    });
  },

  /**
   * 处理删除文章
   */
  handleDeleteArticle: function(articleId) {
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这篇文章吗？',
      success: (res) => {
        if (res.confirm) {
          // 从本地存储中删除文章
          const articles = wx.getStorageSync('articles') || [];
          const updatedArticles = articles.filter(item => item.id !== articleId);
          wx.setStorageSync('articles', updatedArticles);
          
          // 更新页面数据
          this.loadArticles();
          
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
        }
      }
    });
  },
  
  /**
   * 处理编辑文章
   */
  handleEditArticle: function(articleId) {
    wx.navigateTo({
      url: `/pages/article-edit/article-edit?id=${articleId}`
    });
  },
  
  /**
   * 处理分享文章
   */
  handleShareArticle: function(articleId) {
    // 由于小程序分享只能在onShareAppMessage中触发，这里只做提示
    wx.showToast({
      title: '点击右上角分享',
      icon: 'none'
    });
  }
})