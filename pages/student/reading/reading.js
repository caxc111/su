// 修改为全局使用微信同声传译插件
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
    playbackState: 'idle', // idle, playingTitle, pausedAfterTitle, playingContent
    mode: 'practice', // 'practice' 或 'review'
    recordId: null, // 如果是查看历史记录，则存储其 ID
    isLoading: true,
    standardAudioContext: null,
    contentAudioContext: null,
    isPlayingStandard: false,
    isPlayingContent: false,
    currentPlayTime: 0,
    duration: 0,
    playProgress: 0,
    hasRecordPermission: false, // 录音权限状态
    isToggling: false, // <--- 添加状态标志，防止快速点击
    isFromRecordDetail: false, // 是否从记录详情页跳转而来
    recordDetailData: null, // 记录详情数据
  },
  
  fanDuPlayer: null, // 在 Page 实例上保存播放器引用
  audioChunks: [], // 用于存放分割后的文本片段
  currentChunkIndex: 0, // 当前播放的片段索引
  
  onLoad(options) {
    console.log("朗读/查看页面加载，options:", options);
    this.initRecord(); // 初始化语音识别回调（无论哪种模式都需要）
    this.initAudioContext(); // 初始化音频播放器
    this.checkRecordPermission(); // 检查录音权限

    // --- 新增：判断是练习模式还是查看历史记录模式 ---
    if (options.recordId) {
      // --- 查看历史记录模式 ---
      console.log(`[reading.js onLoad] 进入查看历史记录模式，recordId: ${options.recordId}`);
      this.setData({
        mode: 'review',
        recordId: options.recordId,
        isLoading: true // 显示加载状态
      });
      this.loadRecordDetail(options.recordId);

    } else if (options.id) {
      // --- 练习模式 --- 
      console.log(`[reading.js onLoad] 进入练习模式，articleId: ${options.id}`);
      this.setData({
        mode: 'practice',
        articleId: options.id,
        isLoading: true
      });
      this.loadArticle(options.id);
      // 对于练习模式，可能还需要加载上次的进度等（如果需要）

    } else {
      // --- 无效参数 --- 
      console.error('[reading.js onLoad] 缺少必要的参数 (id 或 recordId)');
      wx.showToast({ title: '页面加载参数错误', icon: 'none' });
      // 可以选择返回上一页
      // wx.navigateBack(); 
      this.setData({ isLoading: false });
    }
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

  // 初始化语音识别功能
  initRecord() {
    manager.onRecognize = (res) => {
      console.log("[onRecognize] 朗读中间识别结果", res.result);
    }
    
    manager.onStart = (res) => {
      console.log("[onStart] 语音识别开始");
      this.setData({ recordStatus: 'recording', isToggling: false });
    }
    
    manager.onStop = (res) => {
      console.log('[onStop] 语音识别结束. Result:', res);
      console.log("[onStop] 朗读最终识别结果", res.result);
      console.log("[onStop] 朗读录音临时文件地址", res.tempFilePath);
      
      // 清除计时器
      this.clearRecordTimer();
      
      this.setData({
        recordStatus: 'processing',
        isToggling: false
      });
      
      if (res.result) {
        // 有识别结果，进行评分
        this.evaluateReading(this.data.article.content, res.result);
      } else {
        console.error('[onStop] 朗读语音识别未返回有效结果');
        this.setData({ recordStatus: 'idle' });
        wx.showToast({
          title: '未能识别到有效语音',
          icon: 'none'
        });
      }
    }
    
    manager.onError = (res) => {
      console.error('[onError] 语音识别错误', res);
      this.clearRecordTimer();
      
      // 根据错误代码处理不同情况
      switch(res.errCode) {
        case -30004:
          // 用户重叠语音识别调用，首次调用未结束，第二次调用会报该错
          wx.showToast({
            title: '语音识别冲突，请稍后重试',
            icon: 'none'
          });
          break;
        default:
          wx.showToast({
            title: '识别错误: ' + res.errMsg,
            icon: 'none'
          });
      }
      
      this.setData({
        recordStatus: 'idle',
        isToggling: false
      });
    }
  },
  
  toggleRecording() {
    console.log("[reading.js toggleRecording] Button clicked. Current status:", this.data.recordStatus);
    
    if (this.data.isToggling) {
      console.log("[reading.js toggleRecording] Already toggling, ignoring click.");
      return;
    }
    
    this.setData({ isToggling: true });
    
    if (this.data.recordStatus === 'idle') {
      // 当前未录音，开始录音
      wx.getSetting({
        success: (res) => {
          if (!res.authSetting['scope.record']) {
            console.log("[sm]:360 朗读页面：未获取录音权限，尝试请求");
            this.checkRecordPermission();
          } else {
            console.log("录音权限授权成功");
            console.log("[toggleRecording] Permission granted, calling startRecording()");
            this.startRecording();
          }
        },
        fail: () => {
          this.checkRecordPermission();
          this.setData({ isToggling: false });
        }
      });
    } else if (this.data.recordStatus === 'recording') {
      // 当前正在录音，停止录音
      console.log("[reading.js toggleRecording] Status is recording, calling stopRecording()");
      this.stopRecording();
    } else {
      // 其他状态，忽略点击
      console.log("[reading.js toggleRecording] Status is not idle or recording, ignoring. Status:", this.data.recordStatus);
      this.setData({ isToggling: false });
    }
  },
  
  startRecording() {
    console.log("准备开始朗读录音和识别");
    
    // 清除可能存在的旧结果
    this.setData({
      showResult: false,
      readingResult: null,
      recordTime: 0
    });
    
    // 准备录音参数
    const languageCode = this.data.article.language === 'zh' ? 'zh_CN' : 'en_US';
    console.log(`[startRecording] 识别语言: ${languageCode}`);
    console.log('[startRecording] Starting manager with simplified options:', {lang: languageCode, duration: 60000});
    
    try {
      // 在调用start前先设置状态，不完全依赖onStart回调
      this.setData({
        recordStatus: 'recording'
        // isToggling会在onStart回调中被重置为false
      });
      
      // 开始录音
      manager.start({
        lang: languageCode,
        duration: 60000 // 最长录音时间60秒
      });
      console.log('[startRecording] manager.start() called successfully.');
      
      // 开始计时器
      this.startRecordTimer();
      
    } catch (error) {
      console.error('[startRecording] manager.start failed:', error);
      wx.showToast({ title: '启动录音失败', icon: 'none' });
      this.setData({ recordStatus: 'idle', isToggling: false });
    }
  },
  
  startRecordTimer() {
    const oldTimer = this.data.recordTimer;
    if (oldTimer) {
      console.log('[reading.js startRecordTimer] Clearing old timer from data:', oldTimer);
      clearInterval(oldTimer);
    }
    
    const newTimer = setInterval(() => {
      const newTime = this.data.recordTime + 1;
      if (newTime >= 60) { // 使用60秒限制
        console.log('[startRecordTimer] Auto stopping due to time limit.');
        this.stopRecording();
        return;
      }
      this.setData({ recordTime: newTime });
    }, 1000);
    
    console.log('[reading.js startRecordTimer] Started new timer:', newTimer);
    this.setData({ recordTimer: newTimer });
  },
  
  clearRecordTimer() {
    const timer = this.data.recordTimer;
    if (timer) {
      console.log('[reading.js clearRecordTimer] Clearing timer:', timer);
      clearInterval(timer);
      this.setData({ recordTimer: null });
    } else {
      console.log('[reading.js clearRecordTimer] No timer to clear');
    }
  },
  
  stopRecording() {
    console.log("[reading.js stopRecording] Attempting to stop recording...");
    
    try {
      // 先清除计时器，防止继续计时
      this.clearRecordTimer();
      
      // 调用停止录音 - 简化版本，更接近背诵功能的实现
      console.log("[reading.js stopRecording] Calling manager.stop()");
      manager.stop();
      console.log("[reading.js stopRecording] manager.stop() called. Waiting for onStop/onError callback.");
      
      // 不在这里设置状态，由onStop/onError回调处理
      // 如果用户再次点击，isToggling状态会阻止重复操作
      
    } catch (error) {
      console.error('[stopRecording] manager.stop failed:', error);
      wx.showToast({ title: '停止录音失败', icon: 'none' });
      this.setData({ recordStatus: 'idle', isToggling: false });
    }
  },
  
  // 评分逻辑 - 现在基于真实的识别结果
  evaluateReading(originalText, recognizedText) {
    // 在评分开始时，如果 onStop 没有重置 isToggling，这里重置
    if(this.data.isToggling && this.data.recordStatus === 'processing') {
        console.log('[evaluateReading] Resetting isToggling flag at the start of evaluation.');
        this.setData({ isToggling: false });
    }

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
      contentWithErrors: comparisonResult.diffHtml,
      recognizedText: recognizedText
    };
    
    console.log("评分结果 (Score/Accuracy based on LCS, HTML based on existence):", result);
    
    this.setData({
      readingResult: result,
      showResult: true,
      recordStatus: 'idle' // 评分完成，状态回到 idle
      // isToggling 应该已经在此之前被设为 false 了
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
        type: 'reading',                     
        feedbackHtml: result.contentWithErrors, // 红绿对比 HTML（朗读也保存了）
        recognizedText: result.recognizedText  // 识别文本（朗读也保存了）
      };
      
      console.log('[evaluateReading] Preparing to save record. Checking values:');
      console.log('[evaluateReading] result.contentWithErrors:', result.contentWithErrors);
      console.log('[evaluateReading] result.recognizedText:', result.recognizedText);
      console.log('[evaluateReading] recordData to be saved:', JSON.stringify(recordData));

      app.addReadingRecord(recordData);
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

  // 生成花朵
  generateFlowers(score) {
    // 这个是朗读评分的原始逻辑，可能与背诵不同，按原样恢复
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
    console.log('[tryAgain] 重新开始朗读');
    this.setData({
      showResult: false,
      recordTime: 0,
      readingResult: null,
      recordStatus: 'idle', // 确保状态是 idle
      isToggling: false // 确保标志重置
    });
    // 可选：如果需要重置计时器显示等其他UI元素
  },
  
  finishReading() {
    console.log('[finishReading] 完成朗读，返回上一页');
    // 在返回前确保状态正确
     this.setData({ isToggling: false, recordStatus: 'idle' });
    wx.navigateBack({
      delta: 1,
      fail: () => {
        console.log('[finishReading] navigateBack 失败，尝试 reLaunch 到文章列表');
        wx.reLaunch({
          url: '/pages/student/article-list/article-list'
        });
      }
    });
  },

  // 点击"播放范读"按钮
  playStandardAudio() {
    // 检查是否正在录音
    if (this.data.recordStatus === 'recording') {
      wx.showToast({ title: '请先停止录音', icon: 'none' });
      return;
    }

    if (!this.data.article || !this.data.article.content || !this.data.article.title) {
      wx.showToast({ title: '文章信息不完整', icon: 'none' });
      return;
    }

    // 如果当前正在播放（任何阶段），则停止
    if (this.data.isPlayingFanDu) {
      console.log('[reading.js playStandardAudio] 停止播放范读 (当前状态: ' + this.data.playbackState + ')');
      this.audioContext.stop(); 
      this.setData({ isPlayingFanDu: false, playbackState: 'idle' }); 
      wx.hideLoading(); 
      return;
    }

    // ---> 如果是 idle 状态，开始播放流程：先播放标题 <--- 
    if (this.data.playbackState === 'idle') {
        console.log('[reading.js playStandardAudio] 开始播放流程：请求标题 TTS');
        wx.showLoading({ title: '正在合成标题...' });

        const title = this.data.article.title;
        const languageCode = 'zh_CN'; // 保持强制中文

        plugin.textToSpeech({
            lang: languageCode,
            content: title,
            success: (res) => {
                console.log('[reading.js playStandardAudio] 标题 TTS 成功:', res);
                if (res.filename) {
                    this.audioContext.src = res.filename;
                    this.audioContext.playbackRate = 0.8; // 保持统一语速
                    this.audioContext.play();
                    // 更新状态，标记为正在播放标题
                    this.setData({
                        isPlayingFanDu: true,
                        playbackState: 'playingTitle'
                    });
                } else {
                    console.error('[reading.js playStandardAudio] 标题 TTS 成功但未返回音频文件');
                    wx.showToast({ title: '未能获取标题音频', icon: 'none' });
                    this.setData({ isPlayingFanDu: false, playbackState: 'idle' }); // 重置状态
                }
            },
            fail: (err) => {
                console.error('[reading.js playStandardAudio] 标题 TTS 失败:', err);
                wx.showToast({ title: `标题合成失败: ${err.msg || ''}`, icon: 'none' });
                this.setData({ isPlayingFanDu: false, playbackState: 'idle' }); // 重置状态
            },
            complete: () => {
                wx.hideLoading(); 
            }
        });
    } else {
        console.warn('[reading.js playStandardAudio] 非 idle 状态下被调用，当前状态:', this.data.playbackState);
    }
  },

  // ---> 添加播放内容音频的函数 <--- 
  playContentAudio() {
    if (!this.data.article || !this.data.article.content) {
      console.error('[playContentAudio] 文章内容为空，无法播放');
      this.setData({ isPlayingFanDu: false, playbackState: 'idle' }); // 出错重置状态
      return;
    }

    console.log('[playContentAudio] 请求正文 TTS');
    wx.showLoading({ title: '正在合成正文...' });

    const content = this.data.article.content;
    const languageCode = 'zh_CN'; // 保持强制中文

    plugin.textToSpeech({
      lang: languageCode,
      content: content,
      success: (res) => {
        console.log('[playContentAudio] 正文 TTS 成功:', res);
        if (res.filename) {
          this.audioContext.src = res.filename;
          this.audioContext.playbackRate = 0.8; // 保持统一语速
          this.audioContext.play();
          // 更新状态，标记为正在播放内容
    this.setData({
            // isPlayingFanDu 应该已经是 true
            playbackState: 'playingContent'
          });
        } else {
          console.error('[playContentAudio] 正文 TTS 成功但未返回音频文件');
          wx.showToast({ title: '未能获取正文音频', icon: 'none' });
          this.setData({ isPlayingFanDu: false, playbackState: 'idle' }); // 重置状态
        }
      },
      fail: (err) => {
        console.error('[playContentAudio] 正文 TTS 失败:', err);
        wx.showToast({ title: `正文合成失败: ${err.msg || ''}`, icon: 'none' });
        this.setData({ isPlayingFanDu: false, playbackState: 'idle' }); // 重置状态
      },
      complete: () => {
        wx.hideLoading();
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

  // --- 新增：加载历史记录详情的方法 ---
  loadRecordDetail(recordId) {
    const app = getApp();
    const record = app.globalData.readingRecords.find(r => r.id === recordId);

    if (record) {
      console.log('[reading.js loadRecordDetail] 找到历史记录:', record);
      // 从记录中提取所需信息
      const articleContent = record.originalText; 
      const recognizedText = record.recognizedText;
      const score = record.score;
      const language = record.language; // 确保记录中有 language 字段
      const articleTitle = record.articleTitle; // 获取文章标题
      
      // --- 重要：调用 compareTexts 生成带错误标记的文本 --- 
      // compareTexts 需要是 Page 实例的方法
      const comparisonResult = this.compareTexts(articleContent, recognizedText, language);
      const contentWithErrors = comparisonResult.markedOriginal;
      const accuracy = comparisonResult.accuracy;
      const correctWords = comparisonResult.correctWords;
      const totalWords = comparisonResult.totalWords;
      
      // 设置页面数据，显示结果
      this.setData({
        article: { // 模拟文章对象结构
           id: record.articleId, // 从记录中获取关联的文章ID
           title: articleTitle,
           content: articleContent, 
           language: language,
           // wordCount 和 estimatedTime 可以从原文计算，或如果记录中有就使用
           wordCount: totalWords, // 使用比对结果的总词数
           estimatedTime: 0 // 查看模式下通常不关心预计时间
        },
        readingResult: { // 设置为查看的历史结果
          score: score,
          flowers: this.generateFlowers(score), // 根据分数生成小红花
          accuracy: accuracy,
          correctWords: correctWords,
          totalWords: totalWords,
          contentWithErrors: contentWithErrors, // 带标记的文本
          recognizedText: recognizedText, // 原始识别文本
          feedback: this.generateFeedback(score, accuracy) // 生成评价
        },
        showResult: true, // 直接显示结果区域
        recordStatus: 'idle', // 状态设置为空闲
        isLoading: false // 加载完成
      });
      wx.setNavigationBarTitle({ title: articleTitle || '查看记录' });

    } else {
      console.error(`[reading.js loadRecordDetail] 未找到 recordId 为 ${recordId} 的历史记录`);
      wx.showToast({ title: '加载记录详情失败', icon: 'none' });
      this.setData({ isLoading: false });
      // 可以考虑返回上一页
      // wx.navigateBack();
    }
  },

  // --- 新增：初始化音频播放器的方法，以便在 onLoad 中调用 ---
  initAudioContext() {
    console.log('[reading.js initAudioContext] 初始化 InnerAudioContext');
    // 确保只初始化一次
    if (!this.audioContext) {
        this.audioContext = wx.createInnerAudioContext();
        // --- 监听音频播放事件 ---
        this.audioContext.onPlay(() => {
          console.log('[reading.js audioContext] 开始播放 (当前状态:' + this.data.playbackState + ')');
        });
        this.audioContext.onStop(() => {
          console.log('[reading.js audioContext] 播放停止 (手动或出错)');
          this.setData({ isPlayingFanDu: false, playbackState: 'idle' }); 
        });
        this.audioContext.onEnded(() => {
          console.log('[reading.js audioContext] 播放自然结束 (当前状态:' + this.data.playbackState + ')');
          if (this.data.playbackState === 'playingTitle') {
             console.log('[reading.js onEnded] 标题播放完毕，立即开始播放内容');
             this.playContentAudio(); 
           } else if (this.data.playbackState === 'playingContent') {
             console.log('[reading.js onEnded] 内容播放完毕，流程结束');
             this.setData({ isPlayingFanDu: false, playbackState: 'idle' });
           } else {
             console.warn('[reading.js onEnded] 在非预期状态下结束:', this.data.playbackState, ', 重置状态。');
             this.setData({ isPlayingFanDu: false, playbackState: 'idle' });
           }
        });
        this.audioContext.onError((res) => {
          console.error('[reading.js audioContext] 播放错误:', res.errMsg, res.errCode);
          wx.showToast({ title: `播放错误: ${res.errCode}`, icon: 'none' });
          this.setData({ isPlayingFanDu: false, playbackState: 'idle' }); 
        });
    }
  },
});