// 引入微信同声传译插件
const plugin = requirePlugin("WechatSI");
// 获取全局唯一的语音识别管理器
const manager = plugin.getRecordRecognitionManager();

Page({
  data: {
    article: {},
    recitePhase: 'preview', // 添加背诵阶段状态：preview, reciting, complete
    recordStatus: 'idle', // idle, recording, processing
    recordTime: 0,
    showResult: false,
    recordTimer: null,
    recorderManager: null, // 录音管理器
    audioFile: '', // 录音文件路径
    waveHeights: [], // 声浪高度数组
    waveTimer: null, // 声浪动画计时器
    // 修改为 reciteResult 以区分
    reciteResult: {
      score: 0,
      flowers: [],
      feedback: '',
      correctWords: 0,
      totalWords: 0,
      accuracy: 0,
      contentWithErrors: '', // 带错误标记的内容
      recognizedText: '' // 识别出的文本
    }
  },
  
  onLoad(options) {
    const id = options.id;
    this.loadArticle(id);
    
    this.setData({ 
      waveHeights: Array(8).fill(0).map(() => Math.floor(Math.random() * 10) + 5)
    });
    
    this.checkRecordPermission(); // 添加权限检查调用
    this.initRecord(); // 初始化语音识别回调
    
    console.log('背诵练习页面加载完成，文章ID:', id); // 修改日志
  },
  
  // loadArticle 函数保持不变
  loadArticle(id) {
    console.log('加载文章，ID:', id);
    const app = getApp();
    let articleData = null;

    // 优先从全局数据查找
    if (app.globalData && app.globalData.articles) {
      articleData = app.globalData.articles.find(article => article.id === id);
    }

    // 如果全局数据没有，尝试从本地存储查找 (备选方案)
    if (!articleData) {
        try {
            const storedArticles = wx.getStorageSync('articles');
            if (storedArticles) {
                articleData = storedArticles.find(article => article.id === id);
            }
        } catch (e) {
            console.error("从本地存储加载文章失败", e);
        }
    }

    // 如果找到了文章
    if (articleData) {
      console.log('找到文章:', articleData.title);
      this.setData({
        article: articleData
      });
      wx.setNavigationBarTitle({
        title: articleData.title || '背诵练习' // 修改标题
      });
    } else {
      console.error('未能找到ID为', id, '的文章');
      wx.showToast({
        title: '加载文章失败',
        icon: 'none'
      });
    }
  },
  
  // onUnload 函数保持不变
  onUnload() {
    if (this.data.recordTimer) {
      clearInterval(this.data.recordTimer);
    }
    if (this.data.waveTimer) {
      clearInterval(this.data.waveTimer);
    }
    if (this.data.recordStatus === 'recording' && manager) {
      manager.stop();
    }
  },
  
  // checkRecordPermission 函数保持不变
  checkRecordPermission() {
    wx.authorize({
      scope: 'scope.record',
      success: () => {
        console.log('背诵练习页面：已获取录音权限'); // 修改日志
      },
      fail: () => {
        console.error('背诵练习页面：未获取录音权限'); // 修改日志
        wx.showModal({
          title: '提示',
          content: '背诵练习需要您的录音权限，请允许', // 修改提示内容
          confirmText: '去设置',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm) {
              wx.openSetting();
            } else {
              wx.showToast({
                title: '未授权无法进行背诵', // 修改提示内容
                icon: 'none'
              });
            }
          }
        });
      }
    });
  },

  // initRecord 函数保持不变，但内部调用的评分函数需要修改
  initRecord() {
    manager.onRecognize = (res) => {
      console.log("背诵中间识别结果", res.result); // 修改日志
    }
    manager.onStop = (res) => {
      console.log('[onStop Callback] Triggered. Result:', res);
      console.log("背诵最终识别结果", res.result); // 修改日志
      console.log("背诵录音临时文件地址", res.tempFilePath); // 修改日志
      wx.hideLoading();
      
      const recordTimer = this.data.recordTimer;
      if (recordTimer) { 
        console.log('[onStop Callback] Clearing timer from data:', recordTimer);
        clearInterval(recordTimer);
        this.setData({ recordTimer: null });
      }
    
      this.setData({
          recordStatus: 'processing'
      });
      
      if (res.result) {
          this.evaluateRecitation(this.data.article.content, res.result); // 调用背诵评分函数
      } else {
          console.error('背诵语音识别未返回有效结果'); // 修改日志
          this.setData({ recordStatus: 'idle' });
          wx.showToast({
            title: '未能识别到有效语音',
            icon: 'none'
          });
      }
    }
    manager.onError = (res) => {
        console.error('[onError Callback] Triggered. Error:', res);
        console.error("背诵语音识别错误", res); // 修改日志
        wx.hideLoading();
        wx.showToast({
            title: '识别错误: ' + res.msg,
            icon: 'none'
        });
        const recordTimer = this.data.recordTimer;
        if (recordTimer) { 
            console.log('[onError Callback] Clearing timer from data:', recordTimer);
            clearInterval(recordTimer);
            this.setData({ recordTimer: null });
        }
        this.setData({
            recordStatus: 'idle'
        });
    }
  },
  
  // toggleRecording 函数保持不变
  toggleRecording() {
    if (this.data.recordStatus === 'idle') {
      wx.getSetting({
        success: (res) => {
          if (!res.authSetting['scope.record']) {
            this.checkRecordPermission();
          } else {
            this.startRecording();
          }
        },
        fail: () => {
            this.checkRecordPermission();
        }
      })
    } else if (this.data.recordStatus === 'recording') {
      this.stopRecording();
    }
  },
  
  // startRecording 函数保持不变 (暂时保留简化参数)
  startRecording() {
    this.setData({ recitePhase: 'reciting' });

    try {
      console.log('准备开始背诵录音和识别'); // 修改日志
      console.log('检查文章数据:', this.data.article);
      console.log('检查文章语言:', this.data.article ? this.data.article.language : '文章数据不存在');

      const lang = this.data.article.language === 'zh' ? 'zh_CN' : 'en_US';
      console.log('识别语言:', lang);
      
      this.setData({
        recordStatus: 'recording',
        recordTime: 0,
        showResult: false 
      });
    
      console.log('[startRecording] Starting manager with simplified options...');
      manager.start({
        lang: lang,
        duration: 60000, // 使用更安全的 60 秒
        // sampleRate: 16000, 
        // numberOfChannels: 1, 
        // encodeBitRate: 48000, 
        // format: 'mp3' 
      });
      console.log('开始背诵录音和识别 (使用简化参数)'); // 修改日志
      
      this.startRecordTimer();
      this.startWaveAnimation();
      
    } catch (error) {
      console.error('启动背诵录音时出错:', error); // 修改日志
      this.setData({ recitePhase: 'preview', recordStatus: 'idle' });
      wx.showToast({
        title: '录音初始化失败',
        icon: 'none'
      });
      const recordTimer = this.data.recordTimer;
      if (recordTimer) {
        clearInterval(recordTimer);
        this.setData({ recordTimer: null });
      }
      this.stopWaveAnimation();
    }
  },

  // startRecordTimer 函数保持不变
  startRecordTimer() {
    const oldTimer = this.data.recordTimer;
    if (oldTimer) {
      clearInterval(oldTimer);
    }
    const newTimer = setInterval(() => {
      const newTime = this.data.recordTime + 1;
      if (newTime >= 60) { // 使用 60 秒
        console.log('[startRecordTimer] Auto stopping due to time limit.'); 
        this.stopRecording();
        return;
      }
      this.setData({
        recordTime: newTime
      });
    }, 1000);
    this.setData({ recordTimer: newTimer });
  },

  // stopRecording 函数保持不变
  stopRecording() {
    console.log('手动停止背诵录音和识别'); // 修改日志
    try {
      if (this.data.recordStatus === 'recording' && manager) {
        console.log('[stopRecording] Calling manager.stop()');
        manager.stop();
      } else {
         console.warn('[stopRecording] Did not call manager.stop(). Reason:', 
                      this.data.recordStatus !== 'recording' ? 'Not in recording status.' : '', 
                      !manager ? 'Manager is null.' : '');
      }
      this.stopWaveAnimation();
    } catch (error) {
      console.error('停止背诵录音时出错:', error); // 修改日志
      this.setData({ recordStatus: 'idle' });
      const recordTimer = this.data.recordTimer; 
      if (recordTimer) {
        console.error('[stopRecording catch] Clearing timer from data:', recordTimer);
        clearInterval(recordTimer);
        this.setData({ recordTimer: null });
      }
      this.stopWaveAnimation();
    }
  },

  // 波形动画相关函数保持不变
  startIdleWaveAnimation() { /* ... */ },
  updateIdleWaveHeights() { /* ... */ },
  startWaveAnimation() { /* ... */ },
  updateWaveHeights() { /* ... */ },
  getRandomHeight(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; },
  generateWaveHeights() { /* ... */ },
  stopWaveAnimation() { /* ... */ },

  // --- 添加文本比较函数 (从 reading.js 复制并适应) ---
  compareTexts(original, recognized, language) {
    const normalize = (text) => {
        if (!text) return '';
        text = text.toLowerCase();
        text = text.replace(/[.,!?;:"'()]/g, ''); 
        text = text.replace(/\s+/g, ' ').trim(); 
        return text;
    };
    
    const normalizedOriginal = normalize(original);
    const normalizedRecognized = normalize(recognized);
    
    let correctCount = 0;
    let diffHtml = '';
    let originalLength = 0;

    if (language === 'zh') {
        originalLength = normalizedOriginal.length;
        for (let i = 0; i < original.length; i++) {
            const originalChar = original[i];
            // 在归一化文本中查找对应位置的字符进行比较
            // 背诵模式下，如果识别文本短于原文，则原文多出部分算错误
            if (i < normalizedRecognized.length && normalizedOriginal[i] === normalizedRecognized[i]) {
                correctCount++;
                diffHtml += `<span class="correct">${originalChar}</span>`;
            } else {
                diffHtml += `<span class="error">${originalChar}</span>`;
            }
        }
    } else {
        const originalWords = normalizedOriginal.split(' ').filter(w=>w);
        const recognizedWords = normalizedRecognized.split(' ').filter(w=>w);
        originalLength = originalWords.length;
        
        const originalDisplayParts = original.split(/(\s+|[.,!?;:"'()])/g).filter(p => p); // 保留分隔符
        let wordIndex = 0;
        for (let i = 0; i < originalDisplayParts.length; i++) {
            const currentPart = originalDisplayParts[i];
            if (/\s+|[.,!?;:"'()]/.test(currentPart)) {
                diffHtml += currentPart;
            } else {
                const currentWordNormalized = normalize(currentPart);
                // 检查当前归一化单词是否与识别结果中的对应单词匹配
                // 背诵模式下，如果识别单词少于原文单词，则原文多出部分算错误
                if (wordIndex < recognizedWords.length && currentWordNormalized === recognizedWords[wordIndex]) {
                    correctCount++;
                    diffHtml += `<span class="correct">${currentPart}</span>`;
                } else {
                    diffHtml += `<span class="error">${currentPart}</span>`;
                }
                wordIndex++;
            }
        }
    }
    
    // 注意：这里的实现仅标记了原文中与识别结果不匹配或超出识别结果的部分。
    // 更复杂的背诵评分可能需要考虑漏读、多读、顺序错误等，这需要更高级的 diff 算法。
    return {
        correctCount: correctCount,
        originalLength: originalLength,
        diffHtml: diffHtml
    };
  },

  // --- 替换为背诵评分逻辑 --- 
  evaluateRecitation(originalText, recognizedText) {
    console.log("开始评估背诵，原文：", originalText);
    console.log("开始评估背诵，识别文本：", recognizedText);

    if (!originalText || !recognizedText) {
      console.error("评估错误：原文或识别文本为空");
      this.showReciteErrorResult("评估失败，请重试");
      return;
    }

    const language = this.data.article.language;
    // ---> 调用真实的 compareTexts 函数 <--- 
    const comparisonResult = this.compareTexts(originalText, recognizedText, language);
    // const comparisonResult = { correctCount: 0, originalLength: originalText.length, diffHtml: '<span class="error">评估逻辑待实现</span>' }; // 移除临时替代
    
    const totalWords = comparisonResult.originalLength;
    const correctWords = comparisonResult.correctCount;
    const accuracy = totalWords > 0 ? Math.round((correctWords / totalWords) * 100) : 0;
    // TODO: 实现或引入背诵的评分、反馈、小红花逻辑
    // const score = this.calculateRecitationScore(accuracy, totalWords, language);
    // const feedback = this.generateRecitationFeedback(score, accuracy);
    // const flowers = this.generateFlowers(score);
    const score = accuracy; // 临时使用准确率作为分数
    const feedback = `准确率 ${accuracy}%`; 
    // ---> 修改：只有 score === 100 时才返回 [1] (代表1朵花)，否则返回 [] <--- 
    const flowers = score === 100 ? [1] : [];
    
    const result = {
      score: score, flowers: flowers, feedback: feedback,
      correctWords: correctWords, totalWords: totalWords, accuracy: accuracy,
      contentWithErrors: comparisonResult.diffHtml, // 使用真实的 diffHtml
      recognizedText: recognizedText
    };
    
    console.log("背诵评估结果:", result);
    this.setData({ 
      reciteResult: result, 
      showResult: true, 
      recordStatus: 'idle'
    });
    
    this.stopWaveAnimation();
    
    // ---> 添加：调用 app.js 中的函数保存记录 <--- 
    // 移除 TODO 注释: // TODO: 实现保存背诵记录的逻辑
    // 移除 TODO 注释: // this.saveRecitationRecord(result);
    const app = getApp();
    if (app && typeof app.addReadingRecord === 'function') {
      // 准备传递给 addReadingRecord 的数据
      const recordData = {
        articleId: this.data.article.id,      // 文章 ID
        articleTitle: this.data.article.title, // 文章标题
        score: result.score,                // 本次得分
        accuracy: result.accuracy,            // 准确率 (可选)
        type: 'recitation',                  // 记录类型 (背诵)
        feedbackHtml: result.contentWithErrors, // 红绿对比 HTML
        // ---> 添加：保存识别出的原始文本 <--- 
        recognizedText: result.recognizedText 
      };
      
      // ---> 更新日志检查 <--- 
      console.log('[evaluateRecitation] Preparing to save record. Checking values:');
      console.log('[evaluateRecitation] result.contentWithErrors:', result.contentWithErrors);
      console.log('[evaluateRecitation] result.recognizedText:', result.recognizedText); // 添加日志
      console.log('[evaluateRecitation] recordData to be saved:', JSON.stringify(recordData));

      app.addReadingRecord(recordData);
    } else {
      console.error('[evaluateRecitation]无法找到 app.addReadingRecord 函数!');
    }
  },
  
  // ---> 恢复辅助函数存根 <--- 
  // --- 背诵相关的辅助函数 (需要实现或引入) ---
  // compareTextsForRecitation(original, recognized, language) { /* ... */ },
  // calculateRecitationScore(accuracy, totalWords, language) { /* ... */ },
  // generateRecitationFeedback(score, accuracy) { /* ... */ },
  // generateFlowers(score) { /* ... */ },
  // saveRecitationRecord(result) { /* ... */ },

  // 显示错误结果 (背诵版)
  showReciteErrorResult(message) {
      this.setData({
          reciteResult: { // 保存到 reciteResult
              score: 0,
              flowers: [],
              feedback: message || '处理失败，请重试',
              correctWords: 0,
              totalWords: this.data.article ? (this.data.article.content || '').split(/\s+/).length : 0,
              accuracy: 0,
              contentWithErrors: '<span class="error">处理失败</span>',
              recognizedText: ''
          },
          showResult: true,
          recordStatus: 'idle'
      });
      this.stopWaveAnimation();
  },

  // 再试一次 (背诵版)
  tryAgain() {
    this.setData({ showResult: false, recordTime: 0 });
    this.startIdleWaveAnimation();
  },

  // 完成背诵，返回列表 (复用 finishReading)
  finishReading() {
    wx.navigateBack();
  }
});
