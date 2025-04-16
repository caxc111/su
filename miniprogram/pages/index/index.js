// 导入所需的依赖
let speechService = null;
let SPEECH_STATUS = { IDLE: 0, SPEAKING: 1, PAUSED: 2 };
let SPEECH_RATE = { NORMAL: 1.0 };
let SPEECH_EVENTS = { 
  STATUS_CHANGE: 'STATUS_CHANGE',
  PROGRESS_UPDATE: 'PROGRESS_UPDATE',
  SENTENCE_CHANGE: 'SENTENCE_CHANGE',
  ERROR: 'ERROR'
};

// 尝试导入语音服务，但添加防御性代码
try {
  const speechModule = require('../../services/speech.service');
  speechService = speechModule.default || speechModule;
  SPEECH_STATUS = speechModule.SPEECH_STATUS || SPEECH_STATUS;
  SPEECH_RATE = speechModule.SPEECH_RATE || SPEECH_RATE;
  SPEECH_EVENTS = speechModule.SPEECH_EVENTS || SPEECH_EVENTS;
  console.log('[Index] 成功导入语音服务模块');
} catch (e) {
  console.error('[Index] 导入语音服务模块时出错:', e);
  // 保持默认值
}

// 尝试导入灰蒙版修复函数
let fixGrayOverlay = () => {
  console.warn('[Index] fixGrayOverlay not available, using dummy function');
};
try {
  const resetModule = require('../../reset-loading');
  if (resetModule && typeof resetModule.fixGrayOverlay === 'function') {
    fixGrayOverlay = resetModule.fixGrayOverlay;
    console.log('[Index] 成功导入灰蒙版修复函数');
  }
} catch (e) {
  console.error('[Index] 导入灰蒙版修复函数时出错:', e);
  // 保持默认函数
}

const app = getApp();

Page({
  data: {
    currentTab: 'all', // 'all', 'chinese', 'english'
    articles: [ // 示例数据，后续应从 storage 或 API 加载
      {
        id: 'CH3-001',
        title: '村居[清]高鼎',
        preview: '草长莺飞二月天，拂堤杨柳醉春烟。儿童散学归来早...',
        content: '草长莺飞二月天，拂堤杨柳醉春烟。儿童散学归来早，忙趁东风放纸鸢。', // 添加完整内容
        lessonNo: '1',
        language: '中文',
        level: '初级',
        wordCount: 32
      },
      {
        id: 'CH3-002',
        title: '咏柳[唐]贺知章',
        preview: '碧玉妆成一树高，万条垂下绿丝绦。不知细叶谁裁出...',
        content: '碧玉妆成一树高，万条垂下绿丝绦。不知细叶谁裁出，二月春风似剪刀。', // 添加完整内容
        lessonNo: '2',
        language: '中文',
        level: '初级',
        wordCount: 32
      }
    ],
    // 语音相关状态
    isSpeaking: false,
    speechProgress: 0,
    currentSentence: '',
    speechRate: SPEECH_RATE.NORMAL,
    // 页面和数据状态
    pageReady: false, // 控制页面主要内容是否渲染
    loadingError: null, // 存储加载错误信息
    currentPlayingArticleId: null // 记录当前正在播放范读的文章ID
  },

  async onLoad(options) {
    console.log('[Index] onLoad - 页面加载', options);
    
    // 紧急清除灰蒙版
    wx.hideLoading();
    wx.hideToast();
    try { wx.hideModal && wx.hideModal(); } catch (e) {}
    
    // 优先使用专门的灰蒙版修复函数
    fixGrayOverlay();
    
    // 确保关闭所有加载提示和模态框
    this.hideAllLoadingAndModal();
    
    try {
      // 检查app对象是否完全初始化
      if (!app || !app.globalData) {
        console.error('[Index] onLoad - app对象或globalData未就绪');
        this.setData({ 
          loadingError: 'app对象未初始化完成，请返回重试',
          pageReady: false
        });
        return;
      }
      
      // 检查app.waitForReady是否可用
      if (typeof app.waitForReady !== 'function') {
        console.error('[Index] onLoad - app.waitForReady方法不可用');
        // 如果waitForReady不可用，我们直接检查globalData.isReady
        if (!app.globalData.isReady) {
          console.warn('[Index] onLoad - 应用未就绪，但继续尝试加载');
          // 继续加载但做好出错准备
        }
      } else {
        // 等待应用初始化完成
        try {
          await app.waitForReady();
          console.log('[Index] onLoad - 应用初始化已完成');
        } catch (waitError) {
          console.error('[Index] onLoad - 等待应用初始化时出错:', waitError);
          // 继续执行，尝试加载页面
        }
      }
      
      console.log('[Index] onLoad - 检查登录状态');
      // 检查登录状态
      if (app.globalData && !app.globalData.isLoggedIn) {
        console.log('[Index] onLoad - 用户未登录，跳转到登录页');
        wx.redirectTo({ url: '/pages/login/login' });
        return;
      }
      console.log('[Index] onLoad - 用户已登录或状态未知，继续加载');

      // 设置页面就绪状态，并在回调中执行后续操作
      this.setData({ pageReady: true, loadingError: null }, () => {
        console.log('[Index] onLoad - 页面状态设置为 Ready');
        // 再次尝试清除灰蒙版
        fixGrayOverlay();
        try {
        // 注册语音事件监听
        this.setupSpeechListeners();
        // 加载文章列表
        this.loadArticles();
        } catch (setupError) {
          console.error('[Index] onLoad - 设置监听器或加载文章时出错:', setupError);
        }
      });
    } catch (e) {
      console.error('[Index] onLoad - 页面初始化过程中发生错误:', e);
      this.setData({ loadingError: '页面加载失败，请下拉刷新重试' });
    } finally {
      // 确保关闭所有加载提示和模态框
      this.hideAllLoadingAndModal();
      // 最后再次清除灰蒙版
      fixGrayOverlay();
    }
  },

  onShow() {
    console.log('[Index] onShow - 页面显示');
    // 确保关闭所有加载提示和模态框
    this.hideAllLoadingAndModal();
    
    // 可以在这里刷新数据或检查状态
  },

  onReady() {
    console.log('[Index] onReady - 页面初次渲染完成');
    // 确保关闭所有加载提示和模态框
    this.hideAllLoadingAndModal();
    
    // 可以在这里执行需要依赖DOM的操作
  },

  onHide() {
    console.log('[Index] onHide - 页面隐藏');
    // 确保关闭所有加载提示和模态框
    this.hideAllLoadingAndModal();
    
    // 检查app和getSpeechService是否可用
    if (!app || typeof app.getSpeechService !== 'function') {
      console.warn('[Index] onHide - getSpeechService方法不可用');
      return;
    }
    
    // 可以在这里暂停活动，例如语音播放
    try {
    const speech = app.getSpeechService();
      if (speech && speech.getStatus) {
        const status = speech.getStatus();
        if (status === SPEECH_STATUS.SPEAKING) {
      console.log('[Index] onHide - 暂停语音播放');
      speech.pause();
        }
      }
    } catch (e) {
      console.error('[Index] onHide - 暂停语音时出错:', e);
    }
  },

  onUnload() {
    console.log('[Index] onUnload - 页面卸载');
    
    try {
    // 清理语音事件监听
    this.cleanupSpeechListeners();
    } catch (e) {
      console.error('[Index] onUnload - 清理语音监听时出错:', e);
    }

    // 检查app和getSpeechService是否可用
    if (!app || typeof app.getSpeechService !== 'function') {
      console.warn('[Index] onUnload - getSpeechService方法不可用');
    } else {
      // 尝试停止可能正在进行的朗读
      try {
        const speech = app.getSpeechService();
        if (speech && typeof speech.getStatus === 'function' && speech.getStatus() !== SPEECH_STATUS.IDLE) {
          console.log('[Index] onUnload - 停止语音播放');
          speech.stop();
        }
      } catch (e) {
        console.error('[Index] onUnload - 停止语音时出错:', e);
      }
    }
    
    // 确保关闭所有加载提示和模态框
    this.hideAllLoadingAndModal();
  },
  
  // 关闭所有加载提示和模态框
  hideAllLoadingAndModal() {
    try {
      // 关闭loading提示
      wx.hideLoading();
      // 关闭toast提示
      wx.hideToast();
      
      // 关闭所有可能的模态对话框，API可能不存在，忽略错误
      wx.hideModal && wx.hideModal();
      
      // 关闭操作菜单，API可能不存在，忽略错误
      wx.hideActionSheet && wx.hideActionSheet();
    } catch (e) {
      console.error('[Index] hideAllLoadingAndModal error:', e);
    }
  },

  // 加载文章列表（示例，应替换为实际逻辑）
  loadArticles() {
    console.log('[Index] loadArticles - 开始加载文章列表...');
    // 这里可以从本地存储或API获取文章数据
    // wx.getStorage({ key: 'userArticles', ... })
    // 或 wx.request({ url: '...', ... })

    // 暂时使用 data 中的示例数据
    // 如果是从异步加载，需要在成功回调中 setData
    console.log('[Index] loadArticles - 文章列表加载完成 (使用示例数据)');
    // this.setData({ articles: loadedArticles });
    
    // 确保关闭所有加载提示和模态框
    this.hideAllLoadingAndModal();
  },

  // 设置语音服务事件监听
  setupSpeechListeners() {
    // 检查app和getSpeechService是否可用
    if (!app || typeof app.getSpeechService !== 'function') {
      console.warn('[Index] setupSpeechListeners - getSpeechService方法不可用，使用直接导入的speechService');
      // 如果app.getSpeechService不可用，尝试使用直接导入的speechService
      if (!speechService || !speechService.on) {
        console.error('[Index] setupSpeechListeners - speechService也不可用');
        return;
      }
      
      this._setupSpeechEventListeners(speechService);
      return;
    }
    
    const speech = app.getSpeechService();
    if (!speech) {
      console.error('[Index] setupSpeechListeners - 尝试设置监听器时，语音服务未就绪');
      // 尝试使用直接导入的speechService
      if (speechService && speechService.on) {
        console.log('[Index] setupSpeechListeners - 使用直接导入的speechService');
        this._setupSpeechEventListeners(speechService);
      }
      return;
    }
    
    this._setupSpeechEventListeners(speech);
  },
  
  // 提取出实际设置监听器的方法
  _setupSpeechEventListeners(speech) {
    console.log('[Index] _setupSpeechEventListeners - 设置语音事件监听器');

    // 状态变化监听
    speech.on(SPEECH_EVENTS.STATUS_CHANGE, (status) => {
      console.log('[Index] event:STATUS_CHANGE - 语音状态:', status);
      this.setData({
        isSpeaking: status === SPEECH_STATUS.SPEAKING,
        // 如果停止或结束，清除当前播放文章ID
        currentPlayingArticleId: (status === SPEECH_STATUS.IDLE) ? null : this.data.currentPlayingArticleId
      });
      if (status === SPEECH_STATUS.IDLE) {
         this.setData({ speechProgress: 0, currentSentence: '' }); // 重置进度和句子
      }
      
      // 确保关闭所有加载提示和模态框
      this.hideAllLoadingAndModal();
    });

    // 进度监听
    speech.on(SPEECH_EVENTS.PROGRESS_UPDATE, (progress) => {
      // 只有在播放时才更新进度条，避免停止后还更新
      if (this.data.isSpeaking || speech.getStatus() === SPEECH_STATUS.SPEAKING) {
         this.setData({ speechProgress: progress });
      }
    });

    // 句子变化监听
    speech.on(SPEECH_EVENTS.SENTENCE_CHANGE, (index, sentence) => {
      console.log('[Index] event:SENTENCE_CHANGE - 当前句子索引:', index, '句子:', sentence ? sentence.substring(0, 10) + '...' : 'N/A');
      if (sentence && (this.data.isSpeaking || speech.getStatus() === SPEECH_STATUS.SPEAKING)) {
        this.setData({ currentSentence: sentence });
      } else if (index === -1) {
         this.setData({ currentSentence: '' }); // 清空句子显示
      }
    });

    // 错误监听
    speech.on(SPEECH_EVENTS.ERROR, (error) => {
      console.error('[Index] event:ERROR - 语音服务错误回调:', error);
      
      // 确保关闭所有加载提示和模态框
      this.hideAllLoadingAndModal();
      
      wx.showToast({
        title: `语音播放出错: ${error.message || '未知错误'}`,
        icon: 'none'
      });
      // 出错后也重置状态
       this.setData({
           isSpeaking: false,
           speechProgress: 0,
           currentSentence: '',
           currentPlayingArticleId: null
       });
    });
  },

  // 清理语音事件监听
  cleanupSpeechListeners() {
    // 检查直接导入的speechService是否可用
    if (speechService && typeof speechService.off === 'function') {
      try {
        // 清理所有事件监听
        Object.values(SPEECH_EVENTS).forEach(eventType => {
          speechService.off(eventType);
        });
        console.log('[Index] cleanupSpeechListeners - 已清理直接导入的speechService监听器');
      } catch (e) {
        console.error('[Index] 清理直接导入的speechService监听器时出错:', e);
      }
    }
    
    // 如果app.getSpeechService可用，也清理它的监听器
    if (app && typeof app.getSpeechService === 'function') {
    const speech = app.getSpeechService();
      if (speech && typeof speech.off === 'function') {
        try {
          // 清理所有事件监听
          Object.values(SPEECH_EVENTS).forEach(eventType => {
            speech.off(eventType);
          });
          console.log('[Index] cleanupSpeechListeners - 已清理app.getSpeechService监听器');
        } catch (e) {
          console.error('[Index] 清理app.getSpeechService监听器时出错:', e);
        }
      }
    }
  },

  // 切换文章分类 Tab
  switchTab(e) {
    // 确保关闭所有加载提示和模态框
    this.hideAllLoadingAndModal();
    
    const tab = e.currentTarget.dataset.tab;
    console.log('[Index] switchTab - 切换Tab:', tab);
    this.setData({ currentTab: tab });
    // TODO: 根据 tab 筛选文章列表
  },

  // 添加文章按钮点击处理
  handleAddArticle() {
    // 确保关闭所有加载提示和模态框
    this.hideAllLoadingAndModal();
    
    console.log('[Index] handleAddArticle - 点击添加文章按钮');
    wx.showActionSheet({
      itemList: ['导入预设文章', '手动添加文章'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 导入预设文章
          this.hideAllLoadingAndModal();
          wx.showToast({ title: '导入功能开发中', icon: 'none' });
        } else {
          // 手动添加文章
          this.hideAllLoadingAndModal();
          wx.showToast({ title: '添加功能开发中', icon: 'none' });
        }
      }
    });
  },

  // 范读功能：播放文章朗读
  handleVoiceTest(e) {
    // 确保关闭所有加载提示和模态框
    this.hideAllLoadingAndModal();
    
    const articleId = e.currentTarget.dataset.id;
    // 获取要朗读的文章
    const article = this.data.articles.find(a => a.id === articleId);
    
    if (!article) {
      console.error('[Index] handleVoiceTest - 未找到文章:', articleId);
      return;
    }
    
    // 获取语音服务
    const speech = app.getSpeechService();
    if (!speech) {
      console.error('[Index] handleVoiceTest - 语音服务未就绪');
      wx.showToast({ title: '语音服务未就绪', icon: 'none' });
      return;
    }

    console.log('[Index] handleVoiceTest - 播放文章范读:', article.title);
    
    // 如果当前正在播放此文章，则暂停/恢复播放
    if (this.data.currentPlayingArticleId === articleId) {
      if (this.data.isSpeaking) {
         speech.pause();
        console.log('[Index] handleVoiceTest - 暂停朗读');
      } else {
        speech.resume();
        console.log('[Index] handleVoiceTest - 恢复朗读');
      }
      return;
    }
    
    // 播放新的文章
    this.setData({ currentPlayingArticleId: articleId });
    
    // 准备朗读配置
    const options = {
      title: article.title,
        rate: this.data.speechRate,
      onStatusChange: (status) => {
        // 在setupSpeechListeners中已处理
      },
      onProgress: (progress) => {
        // 在setupSpeechListeners中已处理
      },
      onSentenceChange: (index, sentence) => {
        // 在setupSpeechListeners中已处理
      },
      onError: (error) => {
        // 在setupSpeechListeners中已处理
      }
    };
    
    // 开始朗读
    const success = speech.speak(article.content, options);
    if (success) {
      console.log('[Index] handleVoiceTest - 开始朗读文章:', article.title);
    } else {
      console.error('[Index] handleVoiceTest - 开始朗读失败');
      // 确保关闭所有加载提示和模态框
      this.hideAllLoadingAndModal();
      
      wx.showToast({ title: '开始朗读失败', icon: 'none' });
      this.setData({ currentPlayingArticleId: null });
    }
  },

  // 手动停止朗读
  handleStopSpeech() {
    // 确保关闭所有加载提示和模态框
    this.hideAllLoadingAndModal();
    
    console.log('[Index] handleStopSpeech - 用户手动停止朗读');
    const speech = app.getSpeechService();
    if (speech) {
      speech.stop();
      this.setData({
        currentPlayingArticleId: null,
        isSpeaking: false
      });
    }
  },

  // 切换朗读速度
  handleChangeRate() {
    // 确保关闭所有加载提示和模态框
    this.hideAllLoadingAndModal();

    console.log('[Index] handleChangeRate - 切换朗读速度');
    const rates = [
      { name: '慢速', value: SPEECH_RATE.SLOW },
      { name: '正常', value: SPEECH_RATE.NORMAL },
      { name: '快速', value: SPEECH_RATE.FAST }
    ];
    
    // 寻找当前速度
    let currentIndex = rates.findIndex(r => r.value === this.data.speechRate);
    if (currentIndex === -1) currentIndex = 1; // 默认正常速度
    
    // 切换到下一个速度
    const nextIndex = (currentIndex + 1) % rates.length;
    const newRate = rates[nextIndex];
    
    // 更新页面显示
    this.setData({ speechRate: newRate.value });
    
    // 如果正在朗读，则应用新速度
    const speech = app.getSpeechService();
    if (speech) {
      speech.setRate(newRate.value);
    }
    
    wx.showToast({
      title: `朗读速度: ${newRate.name}`,
      icon: 'none'
    });
  },

  // 朗读练习按钮点击处理
  handlePracticeReading(e) {
    // 确保关闭所有加载提示和模态框
    this.hideAllLoadingAndModal();
    
    const articleId = e.currentTarget.dataset.id;
    console.log('[Index] handlePracticeReading - 开始朗读练习:', articleId);
    // TODO: 添加跳转到朗读练习页面的逻辑
    wx.showToast({ title: '朗读练习功能开发中', icon: 'none' });
  },

  // 背诵练习按钮点击处理
  handlePracticeReciting(e) {
    // 确保关闭所有加载提示和模态框
    this.hideAllLoadingAndModal();
    
    const articleId = e.currentTarget.dataset.id;
    console.log('[Index] handlePracticeReciting - 开始背诵练习:', articleId);
    // TODO: 添加跳转到背诵练习页面的逻辑
    wx.showToast({ title: '背诵练习功能开发中', icon: 'none' });
  },

  // 更多操作按钮点击处理
  showMoreActions(e) {
    // 确保关闭所有加载提示和模态框
    this.hideAllLoadingAndModal();
    
    const articleId = e.currentTarget.dataset.id;
    const article = this.data.articles.find(a => a.id === articleId);
    
    if (!article) {
      console.error('[Index] showMoreActions - 未找到文章:', articleId);
      return;
    }
    
    console.log('[Index] showMoreActions - 显示更多操作:', article.title);
    
    wx.showActionSheet({
      itemList: ['收藏', '删除', '分享'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0: // 收藏
            this.hideAllLoadingAndModal();
            wx.showToast({ title: '收藏功能开发中', icon: 'none' });
            break;
          case 1: // 删除
            this.confirmDelete(articleId, article.title);
            break;
          case 2: // 分享
            this.hideAllLoadingAndModal();
            wx.showToast({ title: '分享功能开发中', icon: 'none' });
            break;
        }
      }
    });
  },
  
  // 确认删除弹窗
  confirmDelete(articleId, title) {
    // 确保关闭所有加载提示和模态框
    this.hideAllLoadingAndModal();
    
    wx.showModal({
      title: '确认删除',
      content: `确定要删除"${title}"吗？`,
      success: (res) => {
        if (res.confirm) {
          console.log('[Index] confirmDelete - 确认删除文章:', articleId);
          // TODO: 实现删除逻辑
          this.hideAllLoadingAndModal();
          wx.showToast({ title: '删除功能开发中', icon: 'none' });
        }
      }
    });
  }
}); 