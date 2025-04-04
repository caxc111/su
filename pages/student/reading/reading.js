// 引入微信同声传译插件
const plugin = requirePlugin("WechatSI");
// 获取全局唯一的语音识别管理器
const manager = plugin.getRecordRecognitionManager();

Page({
  data: {
    article: {},
    recordStatus: 'idle', // idle, recording, processing
    recordTime: 0,
    showResult: false,
    recordTimer: null,
    recorderManager: null, // 录音管理器
    audioFile: '', // 录音文件路径
    waveHeights: [], // 声浪高度数组
    waveTimer: null, // 声浪动画计时器
    readingResult: {
      score: 0,
      flowers: [],
      feedback: '',
      correctWords: 0,
      totalWords: 0,
      accuracy: 0,
      contentWithErrors: '', // 带错误标记的内容
      recognizedText: '' // 识别出的文本
    },
    isPlayingFanDu: false, // 是否正在播放范读
    // fanDuAudioUrl: '', // 可以移除或注释掉，因为我们将直接使用 TTS 返回的临时路径
  },
  
  fanDuPlayer: null, // 在 Page 实例上保存播放器引用
  audioChunks: [], // 用于存放分割后的文本片段
  currentChunkIndex: 0, // 当前播放的片段索引
  
  onLoad(options) {
    console.log("朗读页面加载完成，文章ID:", options.id);
    this.setData({ articleId: options.id });
    this.loadArticle(options.id);

    // 初始化语音识别回调
    this.initRecord();

    // 初始化音频播放器实例
    console.log('[reading.js onLoad] 初始化 InnerAudioContext');
    this.audioContext = wx.createInnerAudioContext();

    // --- 监听音频播放事件 ---
    this.audioContext.onPlay(() => {
      console.log('[reading.js audioContext] 开始播放');
      // 可以在这里更新按钮文本为"停止播放"等
    });

    this.audioContext.onStop(() => {
      console.log('[reading.js audioContext] 播放停止');
      this.setData({ isPlayingFanDu: false });
      // 可以在这里更新按钮文本为"播放范读"
    });

    this.audioContext.onEnded(() => {
      console.log('[reading.js audioContext] 播放自然结束');
      this.setData({ isPlayingFanDu: false });
      // 可以在这里更新按钮文本为"播放范读"
       // 如果需要循环播放或播放下一段（如果分段的话），在这里处理
    });

    this.audioContext.onError((res) => {
      console.error('[reading.js audioContext] 播放错误:', res.errMsg, res.errCode);
      wx.showToast({ title: `播放错误: ${res.errCode}`, icon: 'none' });
      this.setData({ isPlayingFanDu: false });
       // 可以在这里更新按钮文本为"播放范读"
    });
    // -------------------------

    // 检查录音权限
    this.checkRecordPermission();
  },
  
  // 添加 loadArticle 函数
  loadArticle(id) {
    console.log('[reading.js loadArticle] 加载文章，ID:', id);
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
      console.log('[reading.js loadArticle] 找到文章:', articleData.title);
      // ---> 添加日志：打印原始 articleData <---
      console.log('[reading.js loadArticle] 原始文章数据:', JSON.stringify(articleData));

      // ---> 添加：计算 wordCount <--- 
      let wordCount = 0;
      const content = articleData.content || '';
      const language = articleData.language; // ---> 获取语言

      // ---> 添加日志：打印用于计算的内容和语言 <---
      console.log('[reading.js loadArticle] 用于计算的内容:', content.substring(0, 50) + '...'); // 只打印前50个字符
      console.log('[reading.js loadArticle] 文章语言:', language);

      if (language === 'zh') {
        // 中文：简单计算字符数 (可以过滤掉一些空白符)
        wordCount = content.replace(/\s/g, '').length;
      } else {
        // 英文：按空格分割计算单词数 (过滤空字符串)
        wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
      }
      // 将计算结果添加到 articleData 对象
      articleData.wordCount = wordCount;

      // ---> 添加：计算预计时间 <--- 
      let estimatedTime = 0;
      if (wordCount > 0) { // 避免除以 0 或对 0 计算
        if (language === 'zh') {
          estimatedTime = Math.ceil(wordCount / 3);
        } else {
          estimatedTime = Math.ceil(wordCount / 2);
        }
      }
      articleData.estimatedTime = estimatedTime; // 存储预计时间

      // ---> 添加日志：打印计算出的 wordCount 和 estimatedTime <---
      console.log('[reading.js loadArticle] 计算出的 wordCount:', wordCount, ', estimatedTime:', estimatedTime);

      this.setData({
        article: articleData // 现在 article 对象包含 wordCount 和 estimatedTime 了
      });
       // ---> 添加日志：确认 setData 后的数据 <---
       // 使用 setTimeout 确保 setData 完成
       setTimeout(() => {
         console.log('[reading.js loadArticle] setData 异步检查后的 article 数据:', JSON.stringify(this.data.article));
       }, 0);

      wx.setNavigationBarTitle({
        title: articleData.title || '朗读练习'
      });
    } else {
      console.error('[reading.js loadArticle] 未能找到ID为', id, '的文章');
      wx.showToast({
        title: '加载文章失败',
        icon: 'none'
      });
      // 可以考虑显示错误信息或返回上一页
      // wx.navigateBack();
    }
  },
  
  onUnload() {
    // 清理录音定时器 (如果使用了)
    if (this.data.recordingTimer) {
      clearInterval(this.data.recordingTimer);
    }
    // 停止可能正在进行的录音 (如果使用了)
    if (this.manager && this.data.isRecording) {
        try {
            this.manager.stop();
        } catch (e) {
            console.warn('[reading.js onUnload] 停止录音时出错(可能未开始): ', e);
        }
    }
    // 停止并销毁音频播放器
    if (this.audioContext) {
      console.log('[reading.js onUnload] 销毁 audioContext');
      this.audioContext.stop(); // 先停止
      this.audioContext.destroy(); // 再销毁
    }
    // 如果有其他需要清理的资源，也在这里处理
  },
  
  // 添加：检查录音权限
  checkRecordPermission() {
    wx.authorize({
      scope: 'scope.record',
      success: () => {
        console.log('朗读页面：已获取录音权限');
      },
      fail: () => {
        console.error('朗读页面：未获取录音权限');
        // 首次拒绝后，后续通过 wx.authorize 不会再弹窗，需要引导用户去设置
        wx.showModal({
          title: '提示',
          content: '朗读练习需要您的录音权限，请允许',
          confirmText: '去设置',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm) {
              wx.openSetting(); // 打开设置界面让用户手动授权
            } else {
              // 用户取消，可以给提示或不做处理
              wx.showToast({
                title: '未授权无法进行朗读',
                icon: 'none'
              });
            }
          }
        });
      }
    });
  },

  // 初始化识别回调
  initRecord() {
    manager.onRecognize = (res) => {
      console.log("朗读中间识别结果", res.result);
    }
    manager.onStop = (res) => {
      console.log('[onStop Callback] ========== onStop Triggered! =========='); 
      console.log('[onStop Callback] Raw result object:', JSON.stringify(res)); 
      console.log("[onStop Callback] Final recognized text (res.result):", res.result);
      console.log("[onStop Callback] Audio temp file path (res.tempFilePath):", res.tempFilePath);
      
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
          console.log('[onStop Callback] res.result is valid. Calling evaluateReading...'); 
          this.evaluateReading(this.data.article.content, res.result); 
      } else {
          console.error('[onStop Callback] res.result is empty or invalid. Skipping evaluation.'); 
          this.setData({ recordStatus: 'idle' });
          wx.showToast({ title: '未能识别到有效语音', icon: 'none' });
      }
    }
    manager.onError = (res) => {
       console.error('[onError Callback] ========== onError Triggered! ==========');
       console.error('[onError Callback] Raw error object:', JSON.stringify(res)); 
       console.error("[onError Callback] Error code:", res.retcode, "Error message:", res.msg);
       
       wx.hideLoading();
       wx.showToast({ title: '识别错误: ' + res.msg, icon: 'none' });
       
       const recordTimer = this.data.recordTimer;
       if (recordTimer) { 
           console.log('[onError Callback] Clearing timer from data:', recordTimer); 
           clearInterval(recordTimer);
           this.setData({ recordTimer: null }); 
       }
       this.setData({ recordStatus: 'idle' });
    }
  },
  
  // 录音管理
  toggleRecording() {
    const currentStatus = this.data.recordStatus;
    console.log(`[reading.js toggleRecording] Button clicked. Current status: ${currentStatus}`); 

    if (currentStatus === 'idle') {
      // ---> 添加检查：是否正在播放范读 <---
      if (this.data.isPlayingFanDu) {
        wx.showToast({ title: '请先停止播放范读', icon: 'none' });
        console.log('[reading.js toggleRecording] Prevented starting recording because FanDu is playing.');
        return;
      }
      // -----------------------------------

      console.log('[reading.js toggleRecording] Status is idle, attempting to start recording...');
      // 检查权限，以防用户中途取消
      wx.getSetting({
        success: (res) => {
          if (!res.authSetting['scope.record']) {
            console.log('[reading.js toggleRecording] No record permission, checking...');
            this.checkRecordPermission(); // 引导用户重新授权
          } else {
            console.log('[reading.js toggleRecording] Permission granted, calling startRecording()');
      this.startRecording();
          }
        },
        fail: (err) => {
            console.error('[reading.js toggleRecording] Failed to get settings:', err);
            // 尝试引导授权
            this.checkRecordPermission();
        }
      })
    } else if (currentStatus === 'recording') {
      console.log('[reading.js toggleRecording] Status is recording, calling stopRecording()');
      this.stopRecording();
    } else if (currentStatus === 'processing') {
       console.warn('[reading.js toggleRecording] Button clicked while processing. Ignoring.');
       wx.showToast({ title: '正在处理结果...', icon: 'none' });
    } else {
       console.warn(`[reading.js toggleRecording] Button clicked with unexpected status: ${currentStatus}. Resetting to idle.`);
       // 如果状态异常，尝试重置
       this.setData({ recordStatus: 'idle' }); 
       const timer = this.data.recordTimer;
       if (timer) { clearInterval(timer); this.setData({ recordTimer: null }); }
    }
  },
  
  // 开始录音和识别
  startRecording() {
    console.log('准备开始朗读录音和识别');
    const article = this.data.article;
    if (!article || !article.language) {
      console.error('[startRecording] 文章数据或语言信息缺失');
      wx.showToast({ title: '文章信息错误', icon: 'none' });
      return;
    }
    const lang = article.language === 'zh' ? 'zh_CN' : 'en_US';
    console.log('[startRecording] 识别语言:', lang);

    const simplifiedOptions = {
      lang: lang,
      duration: 60000, 
    };
    console.log('[startRecording] Starting manager with simplified options:', simplifiedOptions);

    try {
    this.setData({
      recordStatus: 'recording',
            recordTime: 0,
            recognizedText: '' 
        });
        
        manager.start(simplifiedOptions); 
        console.log('[startRecording] manager.start(simplifiedOptions) called successfully.');

        this.startRecordTimer();

    } catch (error) {
        console.error("[startRecording] Error calling manager.start():", error);
        wx.hideLoading();
        wx.showToast({ title: '启动录音失败', icon: 'none' });
        this.setData({ recordStatus: 'idle' }); 
         const timer = this.data.recordTimer;
         if (timer) { clearInterval(timer); this.setData({ recordTimer: null }); }
    }
  },
  
  // 开始计时器
  startRecordTimer() {
    const oldTimer = this.data.recordTimer;
    if (oldTimer) {
      console.log('[reading.js startRecordTimer] Clearing old timer from data:', oldTimer);
      clearInterval(oldTimer);
    }
    const newTimer = setInterval(() => {
      this.setData({ recordTime: this.data.recordTime + 1 });
    }, 1000);
    console.log('[reading.js startRecordTimer] Started new timer:', newTimer);
    this.setData({ recordTimer: newTimer });
  },
  
  // 停止录音和识别
  stopRecording() {
    console.log('[reading.js stopRecording] Attempting to stop recording...'); 
    try {
      if (this.data.recordStatus === 'recording' && manager) {
        console.log('[reading.js stopRecording] Calling manager.stop()');
        manager.stop(); // 只调用 stop，不立即处理其他事务
        console.log('[reading.js stopRecording] manager.stop() called. Waiting for onStop/onError callback.');
      } else {
         console.warn('[reading.js stopRecording] Did not call manager.stop(). Status:', this.data.recordStatus, 'Manager exists:', !!manager);
         // 如果状态不是 recording，直接重置可能更安全
         if (this.data.recordStatus !== 'idle' && this.data.recordStatus !== 'processing') {
            console.warn('[reading.js stopRecording] Status was not recording, resetting to idle.');
            this.setData({ recordStatus: 'idle' }); 
             // 确保计时器被清 (虽然理论上不应该有)
            const timer = this.data.recordTimer;
            if (timer) { clearInterval(timer); this.setData({ recordTimer: null }); }
         }
      }
    } catch (error) {
      console.error('[reading.js stopRecording] Error calling manager.stop():', error);
      // 调用 stop 出错，强制重置状态并清理计时器
      this.setData({ recordStatus: 'idle' }); 
       const errorTimer = this.data.recordTimer; 
      if (errorTimer) {
        console.error('[reading.js stopRecording catch] Clearing timer from data due to error:', errorTimer);
        clearInterval(errorTimer);
        this.setData({ recordTimer: null });
      }
    }
  },
  
  // 评分逻辑 - 现在基于真实的识别结果
  evaluateReading(originalText, recognizedText) {
    console.log("开始评分，原文：", originalText);
    console.log("开始评分，识别文本：", recognizedText);

    if (!originalText || !recognizedText) {
      console.error("评分错误：原文或识别文本为空");
      this.showErrorResult("评分失败，请重试");
      return;
    }

    const language = this.data.article.language;
    const comparisonResult = this.compareTexts(originalText, recognizedText, language);
    
    // 计算分数、反馈等
    const totalWords = comparisonResult.originalLength;
    const correctWords = comparisonResult.correctCount;
    const accuracy = totalWords > 0 ? Math.round((correctWords / totalWords) * 100) : 0;
    const score = this.calculateScore(accuracy, totalWords, language);
    const feedback = this.generateFeedback(score, accuracy);
    const flowers = this.generateFlowers(score);
    
    const result = {
      score: score,
      flowers: flowers,
      feedback: feedback,
      correctWords: correctWords,
      totalWords: totalWords,
      accuracy: accuracy,
      contentWithErrors: comparisonResult.diffHtml, // 使用比较结果中的 diff HTML
      recognizedText: recognizedText // 保存真实的识别文本
    };
    
    console.log("评分结果:", result);
    
    this.setData({
      readingResult: result,
      showResult: true,
      recordStatus: 'idle' // 评分结束，状态改为空闲
    });

    // ---> 添加：调用 app.js 中的函数保存记录 <--- 
    const app = getApp();
    if (app && typeof app.addReadingRecord === 'function') {
      // 准备传递给 addReadingRecord 的数据
      const recordData = {
        articleId: this.data.article.id,      // 文章 ID
        articleTitle: this.data.article.title, // 文章标题
        score: result.score,                // 本次得分
        accuracy: result.accuracy,            // 准确率 (可选)
        type: 'recitation',                 
        feedbackHtml: result.contentWithErrors 
      };
      
      // ---> 添加详细日志：检查要保存的数据 <--- 
      console.log('[evaluateReading] Preparing to save record. Checking values:');
      console.log('[evaluateReading] result.contentWithErrors:', result.contentWithErrors); // 检查 HTML 内容
      console.log('[evaluateReading] recordData to be saved:', JSON.stringify(recordData)); // 检查最终对象

      app.addReadingRecord(recordData); // 调用保存
    } else {
      console.error('[evaluateReading]无法找到 app.addReadingRecord 函数!');
    }
  },
  
  // 比较文本（核心比较逻辑，需要保留并可能优化）
  compareTexts(original, recognized, language) {
    // 统一预处理文本：转小写（英文），移除标点，标准化空格
    const normalize = (text) => {
        if (!text) return '';
        text = text.toLowerCase();
        // 移除常见标点符号，保留空格
        text = text.replace(/[.,!?;:"'()]/g, ''); 
        // 将多个空格替换为单个空格
        text = text.replace(/\s+/g, ' ').trim(); 
        return text;
    };

    const normalizedOriginal = normalize(original);
    const normalizedRecognized = normalize(recognized);

    // 使用简单的 diff 算法或者更高级的库进行比较
    // 这里使用一个基础的字符/单词匹配逻辑示例
    let correctCount = 0;
    let diffHtml = '';
    let originalLength = 0;

    if (language === 'zh') {
        originalLength = normalizedOriginal.length;
        // 简单的基于字符的比较
        for (let i = 0; i < normalizedOriginal.length; i++) {
            if (i < normalizedRecognized.length && normalizedOriginal[i] === normalizedRecognized[i]) {
                correctCount++;
                diffHtml += `<span class="correct">${original[i]}</span>`;
            } else {
                diffHtml += `<span class="error">${original[i]}</span>`;
            }
        }
         // 如果识别文本更长，也标记为错误（酌情处理）
        if (normalizedRecognized.length > normalizedOriginal.length) {
          // diffHtml += `<span class="error">${recognized.substring(normalizedOriginal.length)}</span>`;
        }

    } else {
        const originalWords = normalizedOriginal.split(' ');
        const recognizedWords = normalizedRecognized.split(' ');
        originalLength = originalWords.length;
        const originalDisplayWords = original.split(/(\s+)/).filter(w => w); // 保留原始空格用于显示
        let displayIndex = 0;

        for (let i = 0; i < originalWords.length; i++) {
            let currentDisplayWord = '';
            let foundSpace = false;
            // 匹配原始显示单词（包括空格）
            while(displayIndex < originalDisplayWords.length && !foundSpace) {
                 currentDisplayWord += originalDisplayWords[displayIndex];
                 if (/\s+/.test(originalDisplayWords[displayIndex])) {
                      foundSpace = true;
                 }
                 if (originalDisplayWords[displayIndex].replace(/\s+/, '') === originalWords[i]) {
                    break; // 找到了匹配的词
                 }
                 displayIndex++;
            }
             displayIndex++; // 移到下一个词/空格
             if (i < recognizedWords.length && originalWords[i] === recognizedWords[i]) {
                correctCount++;
                diffHtml += `<span class="correct">${currentDisplayWord}</span>`;
            } else {
                diffHtml += `<span class="error">${currentDisplayWord}</span>`;
            }
        }
    }

    return {
        correctCount: correctCount,
        originalLength: originalLength,
        diffHtml: diffHtml
    };
  },
  
  // 计算分数
  calculateScore(accuracy, totalWords, language) {
      let baseScore = accuracy;
      // 可以根据词数/字数做调整
      if (language === 'zh' && totalWords > 100) baseScore += 5;
      if (language === 'en' && totalWords > 50) baseScore += 5;
      // 保证分数在0-100之间
      return Math.max(0, Math.min(100, Math.round(baseScore)));
  },

  // 生成反馈
  generateFeedback(score, accuracy) {
    if (score >= 95) return "太棒了！发音非常标准！";
    if (score >= 90) return "非常棒！继续保持！";
    if (score >= 80) return "很不错！注意一下标红的部分。";
    if (score >= 70) return "有进步！多加练习会更好。";
    if (score >= 60) return "还可以，注意发音细节。";
    return "继续努力！熟能生巧。";
  },

  // 生成小红花
  generateFlowers(score) {
    if (score >= 95) return [1, 1, 1, 1, 1];
    if (score >= 90) return [1, 1, 1, 1, 0];
    if (score >= 80) return [1, 1, 1, 0, 0];
    if (score >= 70) return [1, 1, 0, 0, 0];
    if (score >= 60) return [1, 0, 0, 0, 0];
    return [];
  },
  
  // 显示错误结果的模态框
  showErrorResult(message) {
      this.setData({
        readingResult: {
              score: 0,
              flowers: [],
              feedback: message || "评分失败，请重试",
              correctWords: 0,
              totalWords: 0,
              accuracy: 0,
              contentWithErrors: '<span class="error">加载原文失败</span>',
              recognizedText: '无识别结果'
        },
        showResult: true,
        recordStatus: 'idle'
      });
  },
  
  tryAgain() {
    this.setData({ showResult: false, recordTime: 0 });
  },
  
  finishReading() {
    wx.navigateBack();
  },

  // 点击"播放范读"按钮
  playStandardAudio() {
    // ---> 添加检查：是否正在录音 <---
    if (this.data.recordStatus === 'recording') {
      wx.showToast({ title: '请先停止录音', icon: 'none' });
      console.log('[reading.js playStandardAudio] Prevented playing FanDu because recording is active.');
      return;
    }
    // -------------------------------

    if (!this.data.article || !this.data.article.content) {
      wx.showToast({ title: '文章内容为空', icon: 'none' });
      return;
    }

    // 如果当前正在播放，则停止
    if (this.data.isPlayingFanDu) {
      console.log('[reading.js playStandardAudio] 停止播放范读');
      this.audioContext.stop(); // stop 会触发 onStop 回调来重置状态
      this.setData({ isPlayingFanDu: false }); // 立即更新状态，避免重复点击问题
      return;
    }

    // 如果没有在播放，则开始合成并播放
    console.log('[reading.js playStandardAudio] 开始请求 TTS');
    wx.showLoading({ title: '正在合成语音...' }); // 显示加载提示

    const contentToRead = this.data.article.content;
    // ---> 修改：始终将 languageCode 设置为中文 <---
    // const languageCode = this.data.article.language === 'zh' ? 'zh_CN' : 'en_US'; // 移除原来的判断
    const languageCode = 'zh_CN'; 
    console.log(`[reading.js playStandardAudio] 强制使用语言代码: ${languageCode} (即使文章语言是 ${this.data.article.language})`);

    // 调用 TTS 接口
    plugin.textToSpeech({ 
      lang: languageCode, // <--- 始终传递 'zh_CN'
      content: contentToRead,
      success: (res) => {
        console.log('[reading.js playStandardAudio] TTS 成功:', res);
        if (res.filename) {
          console.log('[reading.js playStandardAudio] 音频文件路径:', res.filename);
          // 设置音频源
          this.audioContext.src = res.filename;
          
          // ---> 修改：将播放速度统一设置为 0.8 <---
          // 移除之前的语言判断逻辑
          /*
          const currentLanguage = this.data.article.language;
          if (currentLanguage === 'en') {
            this.audioContext.playbackRate = 0.7; // 英文设置为 0.7 倍速
            console.log('[reading.js playStandardAudio] 设置英文播放速度为 0.7');
          } else { // 默认或中文 'zh'
            this.audioContext.playbackRate = 1.0; // 中文设置为 1.0 倍速 (正常速度)
            console.log('[reading.js playStandardAudio] 设置中文播放速度为 1.0');
          }
          */
          this.audioContext.playbackRate = 0.8;
          console.log('[reading.js playStandardAudio] 设置播放速度为 0.8');
          
          // 然后开始播放
          this.audioContext.play(); // play 会触发 onPlay 回调
          
          // 更新状态，标记为正在播放
          this.setData({
            isPlayingFanDu: true,
            // 可以在 onPlay 回调中更新按钮文本为"停止播放"
          });
        } else {
          console.error('[reading.js playStandardAudio] TTS 成功但未返回音频文件');
          wx.showToast({ title: '未能获取音频', icon: 'none' });
          this.setData({ isPlayingFanDu: false }); // 重置状态
        }
      },
      fail: (err) => {
        console.error('[reading.js playStandardAudio] TTS 失败:', err);
        wx.showToast({ title: `语音合成失败: ${err.retcode || ''} ${err.msg || ''}`, icon: 'none' });
        this.setData({ isPlayingFanDu: false }); // 重置状态
      },
      complete: () => {
        wx.hideLoading(); // 无论成功失败，隐藏加载提示
      }
    });
  },


  // ... (splitTextIntoChunks 函数，暂时不用，先注释掉或保留)
  /*
  splitTextIntoChunks(text, maxLength = 100) {
      // ... 实现细节 ...
      return chunks;
  }
  */
});