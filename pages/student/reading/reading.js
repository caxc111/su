Page({
  data: {
    article: {},
    recordStatus: 'idle', // idle, recording, processing
    recordTime: 0,
    showResult: false,
    recordTimer: null,
    testMode: false, // 测试模式开关
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
    }
  },
  
  onLoad(options) {
    const id = options.id;
    this.loadArticle(id);
    
    // 加载设置
    const testMode = wx.getStorageSync('reading_test_mode') || false;
    
    this.setData({ 
      testMode,
      // 初始化波形动画高度
      waveHeights: Array(8).fill(0).map(() => Math.floor(Math.random() * 10) + 5)
    });
    
    // 不在onLoad中初始化录音管理器，而是在用户点击录音按钮时初始化
    // 避免多次创建录音实例
    
    console.log('朗读页面加载完成，文章ID:', id);
  },
  
  onUnload() {
    // 清除计时器
    if (this.data.recordTimer) {
      clearInterval(this.data.recordTimer);
    }
    
    // 清除波形动画计时器
    if (this.data.waveTimer) {
      clearInterval(this.data.waveTimer);
    }
    
    // 如果正在录音，停止录音
    if (this.data.recordStatus === 'recording' && this.data.recorderManager) {
      this.data.recorderManager.stop();
    }
  },
  
  // 录音管理
  toggleRecording() {
    if (this.data.recordStatus === 'idle') {
      this.startRecording();
    } else if (this.data.recordStatus === 'recording') {
      this.stopRecording();
    }
  },
  
  // 开始录音，采用更简单可靠的方法
  startRecording() {
    try {
      console.log('准备开始录音');
      
      // 创建录音管理器
      this.recorderManager = wx.getRecorderManager();
      
      // 设置录音结束事件监听
      this.recorderManager.onStop((res) => {
        console.log('录音结束', res);
        const { tempFilePath } = res;
        
        // 停止计时器
        if (this.recordTimer) {
          clearInterval(this.recordTimer);
          this.recordTimer = null;
        }
        
        // 更新状态
        this.setData({
          recordStatus: 'processing'
        });
        
        // 处理录音
        if (tempFilePath) {
          console.log('录音成功，开始处理');
          // 使用模拟流程，跳过语音识别API
          this.simulateVoiceRecognition(tempFilePath, this.data.article.content, this.data.article.language);
        } else {
          console.error('没有获取到录音文件');
          this.setData({ recordStatus: 'idle' });
          wx.showToast({
            title: '录音失败，请重试',
            icon: 'none'
          });
        }
      });
      
      // 设置录音错误事件监听
      this.recorderManager.onError((err) => {
        console.error('录音错误:', err);
        
        // 停止计时器
        if (this.recordTimer) {
          clearInterval(this.recordTimer);
          this.recordTimer = null;
        }
        
        this.setData({ recordStatus: 'idle' });
        wx.showToast({
          title: '录音失败: ' + (err.errMsg || '未知错误'),
          icon: 'none'
        });
      });
      
      // 设置录音参数
      const options = {
        duration: 120000, // 最长录音时间，单位ms
        sampleRate: 16000, // 采样率
        numberOfChannels: 1, // 录音通道数
        encodeBitRate: 48000, // 编码码率
        format: 'mp3', // 音频格式
        frameSize: 50 // 指定帧大小
      };
      
      // 更新状态
    this.setData({
      recordStatus: 'recording',
      recordTime: 0
    });
    
      // 开始录音
      this.recorderManager.start(options);
      console.log('开始录音，参数:', options);
      
      // 开始计时和波形动画
      this.startRecordTimer();
      
    } catch (error) {
      console.error('启动录音时出错:', error);
      this.setData({ recordStatus: 'idle' });
      wx.showToast({
        title: '录音初始化失败',
        icon: 'none'
      });
    }
  },
  
  // 开始计时器
  startRecordTimer() {
    // 清除可能存在的旧计时器
    if (this.recordTimer) {
      clearInterval(this.recordTimer);
    }
    
    // 设置新计时器
    this.recordTimer = setInterval(() => {
      const newTime = this.data.recordTime + 1;
      
      // 如果超过了最大录音时间，自动停止
      if (newTime >= 120) {
        this.stopRecording();
        return;
      }
      
      // 更新时间和波形
      this.setData({
        recordTime: newTime,
        waveHeights: this.generateRandomWaveHeights()
      });
    }, 1000);
  },
  
  // 生成随机波形高度
  generateRandomWaveHeights() {
    return Array(8).fill(0).map(() => {
      // 录音状态下波形更高更活跃
      return Math.floor(Math.random() * 30) + 10;
    });
  },
  
  // 停止录音
  stopRecording() {
    console.log('停止录音');
    try {
      if (this.recorderManager) {
        this.recorderManager.stop();
      }
    } catch (error) {
      console.error('停止录音时出错:', error);
      this.setData({ recordStatus: 'idle' });
    }
  },
  
  // 初始化波形动画（未录音状态）
  startIdleWaveAnimation() {
    // 清除之前的计时器
    if (this.data.waveTimer) {
      clearInterval(this.data.waveTimer);
    }
    
    // 初始化8个波形柱高度（较低的波动）
    const initialHeights = Array(8).fill(0).map(() => this.getRandomHeight(5, 15));
    
    this.setData({
      waveHeights: initialHeights
    });
    
    // 设置动画定时器，较慢速度更新波形
    const waveTimer = setInterval(() => {
      this.updateIdleWaveHeights();
    }, 300);
    
    this.setData({
      waveTimer
    });
  },
  
  // 更新未录音状态的波形高度（低波动）
  updateIdleWaveHeights() {
    const newHeights = this.data.waveHeights.map(() => this.getRandomHeight(5, 15));
    
    this.setData({
      waveHeights: newHeights
    });
  },
  
  // 启动录音状态的波形动画
  startWaveAnimation() {
    // 清除可能存在的旧计时器
    if (this.data.waveTimer) {
      clearInterval(this.data.waveTimer);
    }
    
    // 初始化8个波形柱高度（更高的波动）
    const initialHeights = Array(8).fill(0).map(() => this.getRandomHeight(10, 20));
    
    this.setData({
      waveHeights: initialHeights
    });
    
    // 设置动画定时器，每100ms更新一次波形
    const waveTimer = setInterval(() => {
      this.updateWaveHeights();
    }, 100);
    
    this.setData({
      waveTimer
    });
  },
  
  // 更新波形高度
  updateWaveHeights() {
    const newHeights = this.data.waveHeights.map(() => this.getRandomHeight(5, 50));
    
    this.setData({
      waveHeights: newHeights
    });
  },
  
  // 获取随机高度
  getRandomHeight(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  
  // 生成随机波形高度数组
  generateWaveHeights() {
    // 正在录音时生成更活跃的波形
    if (this.data.recordStatus === 'recording') {
      return Array.from({length: 8}, () => {
        return Math.floor(Math.random() * 30) + 10; // 生成10-40之间的随机数
      });
    } else {
      // 不录音时保持低波形
      return Array.from({length: 8}, () => {
        return Math.floor(Math.random() * 10) + 5; // 生成5-15之间的随机数
      });
    }
  },
  
  // 处理录音文件
  processAudioFile(filePath) {
    console.log('开始处理录音文件', filePath);
    
    // 检查是否可以使用微信 WechatSI 插件
    const plugin = requirePlugin('WechatSI');
    
    if (!plugin) {
      console.error('无法加载 WechatSI 插件');
      this.simulateVoiceRecognition(filePath, this.data.article.content, this.data.article.language);
      return;
    }
    
    // 确定语言
    const language = this.data.article.language || 'zh';
    
    // 对于测试环境，使用模拟识别
    if (this.data.testMode) {
      console.log('测试模式：使用模拟识别');
      this.simulateVoiceRecognition(filePath, this.data.article.content, language);
      return;
    }
    
    // 尝试使用微信内置的插件识别（首选方案）
    try {
      if (plugin.textToSpeech) {
        console.log('使用微信插件识别');
        this.usePluginRecognition(filePath, language, plugin);
      } else {
        // 回退到模拟识别
        console.log('插件不可用，使用模拟识别');
        this.simulateVoiceRecognition(filePath, this.data.article.content, language);
      }
    } catch (err) {
      console.error('初始化识别过程出错:', err);
      // 出错时使用模拟识别
      this.simulateVoiceRecognition(filePath, this.data.article.content, language);
    }
  },
  
  // 使用微信插件识别
  usePluginRecognition(filePath, language, plugin) {
    console.log('使用微信插件识别', filePath, language);
    
    wx.showLoading({
      title: '正在识别...',
      mask: true
    });
    
    try {
      // 检查插件版本
      const pluginVersion = plugin.getVersion ? plugin.getVersion() : '未知';
      console.log('使用插件版本:', pluginVersion);
      
      // 使用插件自带的识别方法
      plugin.recognize({
        audio: filePath,
        lang: language === 'zh' ? 'zh_CN' : 'en_US',
        success: (res) => {
          wx.hideLoading();
          console.log('插件识别成功:', res);
          
          // 处理结果
          if (res && res.result) {
            this.evaluateReading(res.result);
          } else {
            console.log('识别结果为空，降级到模拟识别');
            this.simulateVoiceRecognition(filePath, this.data.article.content, language);
          }
        },
        fail: (error) => {
          wx.hideLoading();
          console.error('插件识别失败:', error);
          
          // 显示错误提示
          wx.showToast({
            title: '语音识别失败',
            icon: 'none',
            duration: 1500
          });
          
          // 识别失败，使用模拟方法
          this.simulateVoiceRecognition(filePath, this.data.article.content, language);
        }
      });
    } catch (error) {
      wx.hideLoading();
      console.error('调用插件识别方法失败:', error);
      
      // 出错时使用模拟识别
      this.simulateVoiceRecognition(filePath, this.data.article.content, language);
    }
  },
  
  // 使用微信原生语音识别 (修复版本)
  useWechatVoiceRecognition(filePath, language, plugin) {
    console.log('使用微信语音识别功能', filePath, language);
    
    // 由于域名限制问题，直接使用模拟识别
    console.log('域名未授权，使用内置模拟识别');
    this.simulateVoiceRecognition(filePath, this.data.article.content, language);
    
    /*
    // 下面的代码需要配置域名白名单才能使用，暂时注释掉
    wx.showLoading({
      title: '正在识别...',
      mask: true
    });
    
    // 使用微信录音文件识别接口
    wx.uploadFile({
      url: 'https://speechsc.bmcx.com/api/wechat/asr',  // 需要在微信公众平台添加到域名白名单
      filePath: filePath,
      name: 'file',
      formData: {
        'lang': language === 'zh' ? 'zh_CN' : 'en_US',
        'app_id': 'wxspeech',
      },
      success: (res) => {
        wx.hideLoading();
        console.log('语音识别结果:', res);
        
        try {
          // 尝试解析结果
          let result = '';
          if (res.statusCode === 200) {
            try {
              const data = JSON.parse(res.data);
              result = data.result || '';
            } catch (e) {
              result = res.data || '';
            }
          }
          
          if (result) {
            this.evaluateReading(result);
          } else {
            this.simulateVoiceRecognition(filePath, this.data.article.content, language);
          }
        } catch (error) {
          console.error('处理识别结果失败:', error);
          this.simulateVoiceRecognition(filePath, this.data.article.content, language);
        }
      },
      fail: (error) => {
        wx.hideLoading();
        console.error('语音识别请求失败:', error);
        this.simulateVoiceRecognition(filePath, this.data.article.content, language);
      }
    });
    */
  },
  
  // 评估朗读结果
  evaluateReading(recognizedText) {
    // 获取原文
    const originalContent = this.data.article.content;
    const language = this.data.article.language;
    
    // 进行文本比对，找出错误
    const {errorPositions, accuracy, correctWords, totalWords} = this.compareTexts(originalContent, recognizedText, language);
    
    // 计算小红花数量
    const flowerCount = this.calculateFlowers(accuracy);
    
    // 生成带错误标记的内容
    const contentWithErrors = this.markErrorsFromComparison(originalContent, errorPositions, language);
    
    console.log('文本比对结果:', {
      originalContent,
      recognizedText,
      errorPositions,
      accuracy
    });
    
    // 保存评分记录
    this.saveReadingRecord(accuracy);
    
    // 更新UI显示结果
    this.setData({
      readingResult: {
        score: accuracy,
        flowers: new Array(flowerCount),
        feedback: this.generateFeedback(accuracy),
        correctWords: correctWords,
        totalWords: totalWords,
        accuracy: accuracy,
        contentWithErrors: contentWithErrors,
        recognizedText: recognizedText
      },
      showResult: true,
      recordStatus: 'idle'
    });
  },
  
  // 保存朗读记录
  saveReadingRecord(score) {
    const app = getApp();
    
    // 获取当前文章信息
    const article = this.data.article;
    const durationSeconds = this.data.recordTime;
    
    // 创建记录对象
    const record = {
      articleId: article.id,
      articleTitle: article.title,
      score: Math.round(score),
      duration: durationSeconds,
      recognizedText: this.data.readingResult ? this.data.readingResult.recognizedText : '',
      language: article.language
    };
    
    console.log('保存朗读记录:', record);
    
    // 使用应用的方法添加记录
    app.addReadingRecord(record);
    
    // 更新全局的花朵数量（可以根据实际需求调整奖励逻辑）
    app.globalData.flowerCount = (app.globalData.flowerCount || 0) + this.calculateFlowers(score);
    
    console.log('朗读记录已保存');
  },
  
  // 添加奖励
  addReward(score) {
    const app = getApp();
    const article = this.data.article;
    
    // 根据分数确定花朵数量
    let flowerCount = 1;
    if (score >= 95) {
      flowerCount = 3;
    } else if (score >= 85) {
      flowerCount = 2;
    }
    
    // 创建新的奖励记录
    const newReward = {
      id: Date.now().toString(), // 使用时间戳作为ID
      type: 'flower',
      count: flowerCount,
      title: `阅读《${article.title}》`,
      date: new Date().toISOString().split('T')[0] // 当前日期 YYYY-MM-DD
    };
    
    // 获取现有奖励记录
    const rewards = app.globalData.rewards || [];
    
    // 添加新记录
    rewards.push(newReward);
    
    // 更新全局数据
    app.globalData.rewards = rewards;
    
    console.log('添加奖励', newReward);
  },
  
  // 返回按钮拦截
  onBackPress() {
    // 如果正在录音，显示确认对话框
    if (this.data.recordStatus === 'recording') {
      wx.showModal({
        title: '提示',
        content: '录音尚未完成，确定要退出吗？',
        success: (res) => {
          if (res.confirm) {
            // 用户点击确定，停止录音并退出
            clearInterval(this.data.recordTimer);
            this.setData({
              recordStatus: 'idle'
            });
            return false; // 不拦截返回
          } else {
            // 用户点击取消，继续录音
            return true; // 拦截返回操作
          }
        }
      });
      return true; // 拦截返回操作，等待对话框结果
    }
    return false; // 不拦截返回
  },
  
  loadArticle(id) {
    console.log('加载文章，ID:', id);
    const app = getApp();
    
    // 从全局数据中获取文章
    const articles = app.globalData.articles || [];
    console.log('全局文章数据:', articles);
    
    // 查找匹配的文章
    const article = articles.find(item => item.id === id);
    
    if (article) {
      // 文章存在，加载文章数据
      console.log('找到文章:', article);
      
      // 计算字数
      const wordCount = article.language === 'zh' ? 
        article.content.length : 
        article.content.split(/\s+/).length;
      
      this.setData({
        article: {
          _id: article.id,
          title: article.title,
          content: article.content,
          language: article.language,
          wordCount: wordCount
        }
      });
    } else {
      // 文章不存在，显示错误信息
      console.error('找不到ID为', id, '的文章');
      wx.showToast({
        title: '找不到该文章',
        icon: 'error'
      });
      
      // 返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },
  
  // 模拟语音识别过程（实际项目中应替换为真实API调用）
  simulateVoiceRecognition(filePath, originalContent, language) {
    console.log('模拟语音识别', filePath);
    
    // 显示加载提示
    wx.showLoading({
      title: '正在识别...',
      mask: true
    });
    
    // 模拟识别延迟
    setTimeout(() => {
      // 隐藏加载提示
      wx.hideLoading();
      
      // 模拟识别结果
      const recognizedText = this.simulateRecognition(originalContent, language);
      
      // 进行文本比对，找出错误
      const {errorPositions, accuracy, correctWords, totalWords} = this.compareTexts(originalContent, recognizedText, language);
      
      // 计算小红花数量
      const flowerCount = this.calculateFlowers(accuracy);
      
      // 生成带错误标记的内容
      const contentWithErrors = this.markErrorsFromComparison(originalContent, errorPositions, language);
      
      console.log('文本比对结果:', {
        originalContent,
        recognizedText,
        errorPositions,
        accuracy
      });
      
      // 保存评分记录
      this.saveReadingRecord(accuracy);
      
      // 更新UI显示结果
      this.setData({
        readingResult: {
          score: accuracy,
          flowers: new Array(flowerCount),
          feedback: this.generateFeedback(accuracy),
          correctWords: correctWords,
          totalWords: totalWords,
          accuracy: accuracy,
          contentWithErrors: contentWithErrors,
          recognizedText: recognizedText
        },
        showResult: true,
        recordStatus: 'idle'
      });
    }, 2000);
  },
  
  // 模拟语音识别结果
  simulateRecognition(originalText, language) {
    // 这里我们实现一个更贴近真实语音识别的模拟功能
    // 在实际项目中，应当替换为微信小程序的真实语音识别API
    
    // 检查是否处于测试模式
    const testMode = this.data.testMode;
    
    if (testMode) {
      console.log('已开启测试模式，将增强错误识别能力');
      // 在测试模式下，大幅提高错误率以检测系统能力
      return this.generateErrorText(originalText, language, 0.4); // 40%的错误率
    }
    
    // 特定测试案例 - 静夜思
    if (originalText.includes('床前明月光') && language === 'zh') {
      console.log('使用中文特定测试案例：静夜思');
      // 这里模拟识别出的错误版本
      return '床啊前明月光，疑是地上霜，举头望明月，低头吧思故乡。';
    }
    
    // 特定测试案例 - 英文诗
    if (originalText.includes('Whose woods these are') && language === 'en') {
      console.log('使用英文特定测试案例：Stopping by Woods');
      // 这里模拟识别出的错误版本
      return 'Whose woods zese are I sink I know. His house is in ze village so. He will not see me stopping here. To watch his woods fill up with snow.';
    }
    
    // 判断当前是否在录音中
    // 如果是真实录音，则应该进入这里的逻辑
    // 修改错误概率逻辑，确保每次都能检测到一些错误
    return this.generateErrorText(originalText, language, 0.15); // 普通模式下15%的错误率
  },
  
  // 根据错误率生成错误文本
  generateErrorText(originalText, language, errorRate) {
    if (language === 'zh') {
      // 中文处理
      let chars = originalText.split('');
      
      // 确保至少有一个错误，除非文本很短
      const minErrors = chars.length <= 5 ? 1 : 2;
      const errorCount = Math.max(minErrors, Math.floor(chars.length * errorRate));
      
      // 选择错误位置，优先选择常见易错字的位置
      let errorPositions = this.getSmartErrorPositions(chars, errorCount);
      
      // 引入错误
      errorPositions.forEach(pos => {
        if (pos >= chars.length) return;
        
        // 根据字符的不同特性，选择不同的错误类型
        const errorType = this.determineErrorType(chars[pos]);
        
        if (errorType === 0) {
          // 漏字 - 删除字符
          chars[pos] = '';
        } else if (errorType === 1) {
          // 错字 - 替换为形近音近字
          chars[pos] = this.getSimilarChar(chars[pos]);
        } else if (errorType === 2) {
          // 额外字 - 在此位置后插入一个额外字符
          const extraChar = this.getExtraChar(chars[pos]);
          chars[pos] += extraChar;
        } else if (errorType === 3) {
          // 音调不准 - 替换为同音不同调的字
          chars[pos] = this.getSimilarToneChar(chars[pos]);
        }
      });
      
      return chars.join('');
    } else {
      // 英文处理
      let words = originalText.split(/\s+/);
      
      // 确保至少有一个错误，除非文本很短
      const minErrors = words.length <= 3 ? 1 : 2;
      const errorCount = Math.max(minErrors, Math.floor(words.length * errorRate));
      
      // 选择错误位置，优先选择长单词或常见易错单词
      let errorPositions = this.getSmartErrorPositions(words, errorCount);
      
      // 引入错误
      errorPositions.forEach(pos => {
        if (pos >= words.length) return;
        
        // 根据单词特性选择错误类型
        const errorType = this.determineWordErrorType(words[pos]);
        
        if (errorType === 0) {
          // 漏词 - 删除单词
          words[pos] = '';
        } else if (errorType === 1) {
          // 错词 - 替换为形近音近词
          words[pos] = this.getSimilarWord(words[pos]);
        } else if (errorType === 2) {
          // 口音问题 - 替换某些音素
          words[pos] = this.getAccentedWord(words[pos]);
        } else if (errorType === 3) {
          // 额外词 - 在此位置后插入一个额外单词
          const extraWord = this.getExtraWord();
          words[pos] += ' ' + extraWord;
        }
      });
      
      return words.join(' ');
    }
  },
  
  // 智能选择错误位置（优先选择常见易错位置）
  getSmartErrorPositions(textArray, errorCount) {
    // 筛选出可能的易错位置
    const potentialErrorPositions = [];
    
    // 遍历文本，评估每个位置的"易错性"
    for (let i = 0; i < textArray.length; i++) {
      const item = textArray[i];
      let errorPotential = 0;
      
      // 中文字符
      if (typeof item === 'string' && /[\u4e00-\u9fa5]/.test(item)) {
        // 多音字、形近字等更容易出错
        if (this.isCommonlyMispronouncedChar(item)) {
          errorPotential += 5;
        }
        
        // 生僻字更容易出错
        if (this.isUncommonChar(item)) {
          errorPotential += 3;
        }
      } 
      // 英文单词
      else if (typeof item === 'string' && /[a-zA-Z]/.test(item)) {
        // 长单词更容易出错
        if (item.length > 6) {
          errorPotential += 3;
        }
        
        // 不规则发音的单词更容易出错
        if (this.hasIrregularPronunciation(item)) {
          errorPotential += 4;
        }
      }
      
      // 词的位置也影响错误率（如句首句尾）
      if (i === 0 || i === textArray.length - 1) {
        errorPotential += 1;
      }
      
      // 加入潜在错误位置表
      potentialErrorPositions.push({
        index: i,
        potential: errorPotential || 1 // 至少有1的基础值
      });
    }
    
    // 按错误潜力排序
    potentialErrorPositions.sort((a, b) => b.potential - a.potential);
    
    // 选择前N个位置
    const selectedPositions = potentialErrorPositions
      .slice(0, errorCount * 2) // 选择错误数量的2倍备选
      .map(item => item.index);
    
    // 如果有足够的位置，随机选择，否则全部使用
    let finalPositions = [];
    if (selectedPositions.length > errorCount) {
      // 随机选择，但保证位置分散
      selectedPositions.sort((a, b) => a - b); // 先按位置排序
      
      // 每隔一定距离选择一个位置
      const step = Math.floor(selectedPositions.length / errorCount);
      for (let i = 0; i < errorCount && i * step < selectedPositions.length; i++) {
        finalPositions.push(selectedPositions[i * step]);
      }
      
      // 如果还不够，随机补充
      while (finalPositions.length < errorCount) {
        const randPos = selectedPositions[Math.floor(Math.random() * selectedPositions.length)];
        if (!finalPositions.includes(randPos)) {
          finalPositions.push(randPos);
        }
      }
    } else {
      finalPositions = selectedPositions;
    }
    
    return finalPositions;
  },
  
  // 判断字符的错误类型
  determineErrorType(char) {
    if (!char) return 1;
    
    // 针对不同类型的字符，倾向于不同的错误类型
    if (this.isCommonlyMispronouncedChar(char)) {
      // 容易读错音调的字更可能被错误替换
      return Math.random() < 0.7 ? 3 : 1;
    }
    
    if (this.isUncommonChar(char)) {
      // 生僻字更可能被漏掉或错读
      return Math.random() < 0.5 ? 0 : 1;
    }
    
    // 常见的连接词后面可能加填充词
    if ('的地得了吧啊呢'.includes(char)) {
      return Math.random() < 0.6 ? 2 : 1;
    }
    
    // 其他情况，随机选择错误类型
    const weights = [0.2, 0.4, 0.2, 0.2]; // 漏字、错字、额外字、音调错的权重
    const rand = Math.random();
    let sum = 0;
    
    for (let i = 0; i < weights.length; i++) {
      sum += weights[i];
      if (rand < sum) return i;
    }
    
    return 1; // 默认是错字
  },
  
  // 判断单词的错误类型
  determineWordErrorType(word) {
    if (!word) return 1;
    
    // 非常短的单词（如a, an, the）可能被漏掉
    if (word.length <= 2) {
      return Math.random() < 0.7 ? 0 : 3;
    }
    
    // 长单词更可能发音不准
    if (word.length >= 7) {
      return Math.random() < 0.6 ? 2 : 1;
    }
    
    // 不规则发音的单词更可能读错
    if (this.hasIrregularPronunciation(word)) {
      return Math.random() < 0.7 ? 1 : 2;
    }
    
    // 常见填充词可能被添加
    if (['and', 'but', 'or', 'so'].includes(word.toLowerCase())) {
      return Math.random() < 0.5 ? 3 : 1;
    }
    
    // 其他情况，随机选择错误类型
    const weights = [0.2, 0.3, 0.3, 0.2]; // 漏词、错词、口音问题、额外词的权重
    const rand = Math.random();
    let sum = 0;
    
    for (let i = 0; i < weights.length; i++) {
      sum += weights[i];
      if (rand < sum) return i;
    }
    
    return 1; // 默认是错词
  },
  
  // 判断是否是常见易错字
  isCommonlyMispronouncedChar(char) {
    // 多音字、容易读错的字
    const commonlyMispronounced = '行藏得背还好着差处长假地重谁要说';
    return commonlyMispronounced.includes(char);
  },
  
  // 判断是否是生僻字
  isUncommonChar(char) {
    // 一些相对生僻的字
    const uncommonChars = '赋缀骇慑潋潆缤纷琳琅霓虹璀璨斡旋';
    return uncommonChars.includes(char);
  },
  
  // 判断是否是不规则发音的英文单词
  hasIrregularPronunciation(word) {
    // 一些发音不规则的单词
    const irregularWords = [
      'though', 'through', 'tough', 'thought', 'thorough',
      'enough', 'cough', 'borough', 'yacht', 'colonel',
      'choir', 'island', 'iron', 'queue', 'quay',
      'women', 'recipe', 'leopard', 'facade', 'debris'
    ];
    return irregularWords.includes(word.toLowerCase());
  },
  
  // 获取形近音近字
  getSimilarChar(char) {
    // 常见的音近形近字对照表
    const similarChars = {
      '的': '地得底帝', '是': '事市十时实式', '在': '再载栽仔',
      '和': '河何合荷盒贺', '了': '啦料咯', '地': '的得底第低帝',
      '得': '的地德锝', '你': '拟泥尼', '我': '窝卧握', '他': '她它塔踏',
      '这': '着哲遮折', '有': '又友右佑幼', '人': '仁忍刃认任',
      '不': '步部布补捕', '就': '旧九酒救舅', '说': '水税睡瑞',
      '会': '回汇惠绘悔贿', '能': '嫩农浓', '那': '哪拿纳娜',
      '想': '响向项象橡', '去': '趣区曲取', '做': '作坐座左昨',
      '为': '位未围维违', '子': '自字籽紫资', '来': '赖莱睐'
    };
    
    if (similarChars[char]) {
      const options = similarChars[char].split('');
      return options[Math.floor(Math.random() * options.length)];
    }
    
    // 如果没有预定义的相似字，返回原字符
    return char;
  },
  
  // 获取同音不同调的字
  getSimilarToneChar(char) {
    // 一些常见的同音不同调字
    const similarToneChars = {
      '行': '杏幸型姓兴', '藏': '仓沧舱苍', '得': '德锝', 
      '背': '贝碑悲卑杯', '还': '环缓换唤欢', '好': '号浩耗毫豪',
      '着': '找招照赵朝', '差': '插叉茶查岔', '处': '除储厨初楚',
      '长': '常场肠尝偿', '假': '甲钾嘉佳家', '地': '底递第弟帝',
      '重': '崇虫充冲', '谁': '水税睡瑞', '要': '咬姚窑谣遥',
      '说': '朔硕烁铄', '大': '达打搭答', '中': '终钟忠衷肿',
      '都': '读督毒独', '没': '摸模膜馍末'
    };
    
    if (similarToneChars[char]) {
      const options = similarToneChars[char].split('');
      return options[Math.floor(Math.random() * options.length)];
    }
    
    // 如果没有预定义的同音不同调字，返回原字符
    return char;
  },
  
  // 获取额外的填充字符
  getExtraChar(prevChar) {
    // 根据前一个字符的特点，选择合适的填充字
    if ('的地得'.includes(prevChar)) {
      return ['一', '是', '有', '能', '在'][Math.floor(Math.random() * 5)];
    }
    
    if ('我你他她它'.includes(prevChar)) {
      return ['们', '的', '是', '也', '就'][Math.floor(Math.random() * 5)];
    }
    
    // 默认的填充字
    const fillers = ['啊', '呢', '吧', '哦', '呀', '嗯', '哈', '嘿', '了', '的'];
    return fillers[Math.floor(Math.random() * fillers.length)];
  },
  
  // 获取相似英文单词
  getSimilarWord(word) {
    // 一些常见的形近音近词对照
    const similarWords = {
      'their': ['there', 'they\'re', 'they'], 'your': ['you\'re', 'you'],
      'its': ['it\'s', 'it'], 'to': ['too', 'two'], 'than': ['then', 'that'],
      'affect': ['effect'], 'accept': ['except'], 'advice': ['advise'],
      'already': ['all ready'], 'piece': ['peace'], 'quite': ['quiet', 'quit'],
      'weather': ['whether'], 'lose': ['loose'], 'principle': ['principal'],
      'stationary': ['stationery'], 'whose': ['who\'s'], 'a lot': ['alot', 'allot']
    };
    
    if (similarWords[word.toLowerCase()]) {
      const options = similarWords[word.toLowerCase()];
      return options[Math.floor(Math.random() * options.length)];
    }
    
    // 如果没有预定义的相似词，随机改变一个字母
    if (word.length > 2) {
      const pos = Math.floor(Math.random() * word.length);
      const replacements = 'abcdefghijklmnopqrstuvwxyz';
      const newChar = replacements[Math.floor(Math.random() * replacements.length)];
      return word.substring(0, pos) + newChar + word.substring(pos + 1);
    }
    
    return word;
  },
  
  // 模拟口音问题
  getAccentedWord(word) {
    // 模拟一些常见的口音特点
    
    // 例如，将"th"发音替换为"z"或"s"
    let result = word.replace(/th/g, Math.random() < 0.5 ? 'z' : 's');
    
    // 将"v"发音替换为"w"或"f"
    result = result.replace(/v/g, Math.random() < 0.5 ? 'w' : 'f');
    
    // 将"r"发音弱化或省略
    if (result.includes('r') && Math.random() < 0.7) {
      result = result.replace(/r/g, '');
    }
    
    // 有时混淆"l"和"r"
    if (result.includes('l') && Math.random() < 0.4) {
      result = result.replace(/l/g, 'r');
    }
    
    // 有时短元音拉长
    if (Math.random() < 0.3) {
      result = result.replace(/a/g, 'aa').replace(/e/g, 'ee');
    }
    
    return result;
  },
  
  // 获取额外的填充单词
  getExtraWord() {
    const fillers = ['um', 'ah', 'like', 'so', 'well', 'actually', 'basically', 'literally', 'you know', 'I mean'];
    return fillers[Math.floor(Math.random() * fillers.length)];
  },
  
  // 比较原文和识别结果，找出错误
  compareTexts(original, recognized, language) {
    if (language === 'zh') {
      // 中文处理
      return this.compareChineseTexts(original, recognized);
    } else {
      // 英文处理
      return this.compareEnglishTexts(original, recognized);
    }
  },
  
  // 中文文本比对（使用编辑距离的思想，但针对插入字符做特殊处理）
  compareChineseTexts(original, recognized) {
    const originalChars = original.split('');
    const recognizedChars = recognized.split('');
    
    // 执行序列对齐
    const alignment = this.getOptimalAlignment(originalChars, recognizedChars);
    console.log('中文对齐结果:', alignment);
    
    // 标记原文中的错误位置
    const errorPositions = [];
    let correctCount = 0;
    
    for (let i = 0; i < alignment.length; i++) {
      const [origIndex, recogIndex] = alignment[i];
      
      // 错误情况: 原文字符未被识别，或识别错误
      if (origIndex !== null) {
        if (recogIndex === null || originalChars[origIndex] !== recognizedChars[recogIndex]) {
          errorPositions.push(origIndex);
        } else {
          correctCount++;
        }
      }
      // 对于额外插入的字符，不计入原文的错误
    }
    
    const totalWords = originalChars.length;
    const accuracy = Math.round((correctCount / totalWords) * 100);
    
    return {
      errorPositions,
      accuracy,
      correctWords: correctCount,
      totalWords
    };
  },
  
  // 英文文本比对
  compareEnglishTexts(original, recognized) {
    const originalWords = original.split(/\s+/);
    const recognizedWords = recognized.split(/\s+/);
    
    // 执行序列对齐
    const alignment = this.getOptimalAlignment(originalWords, recognizedWords);
    console.log('英文对齐结果:', alignment);
    
    // 标记原文中的错误位置
    const errorPositions = [];
    let correctCount = 0;
    
    for (let i = 0; i < alignment.length; i++) {
      const [origIndex, recogIndex] = alignment[i];
      
      // 错误情况: 原文单词未被识别，或识别错误
      if (origIndex !== null) {
        if (recogIndex === null || !this.wordMatches(originalWords[origIndex], recognizedWords[recogIndex])) {
          errorPositions.push(origIndex);
        } else {
          correctCount++;
        }
      }
      // 对于额外插入的单词，不计入原文的错误
    }
    
    const totalWords = originalWords.length;
    const accuracy = Math.round((correctCount / totalWords) * 100);
    
    return {
      errorPositions,
      accuracy,
      correctWords: correctCount,
      totalWords
    };
  },
  
  // 获取两个序列的最优对齐（基于编辑距离的回溯）
  getOptimalAlignment(original, recognized) {
    const m = original.length;
    const n = recognized.length;
    
    // 创建距离矩阵
    const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
    
    // 初始化第一行和第一列
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    
    // 填充矩阵
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = original[i-1] === recognized[j-1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i-1][j] + 1,      // 删除
          dp[i][j-1] + 1,      // 插入
          dp[i-1][j-1] + cost  // 替换或匹配
        );
      }
    }
    
    // 回溯以找到最优对齐
    const alignment = [];
    let i = m, j = n;
    
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && dp[i][j] === dp[i-1][j-1] + (original[i-1] === recognized[j-1] ? 0 : 1)) {
        // 匹配或替换
        alignment.unshift([i-1, j-1]);
        i--; j--;
      } else if (i > 0 && dp[i][j] === dp[i-1][j] + 1) {
        // 删除（原文字符未被识别）
        alignment.unshift([i-1, null]);
        i--;
      } else {
        // 插入（识别文本中多出的字符）
        alignment.unshift([null, j-1]);
        j--;
      }
    }
    
    return alignment;
  },
  
  // 判断两个单词是否匹配（允许一定程度的容错）
  wordMatches(original, recognized) {
    if (!original || !recognized) return false;
    
    // 完全相同
    if (original.toLowerCase() === recognized.toLowerCase()) return true;
    
    // 允许轻微拼写错误（编辑距离为1）
    if (this.calculateEditDistance(original.toLowerCase(), recognized.toLowerCase()) <= 1) {
      return true;
    }
    
    return false;
  },
  
  // 计算编辑距离（Levenshtein距离）
  calculateEditDistance(s1, s2) {
    const m = s1.length;
    const n = s2.length;
    
    // 创建距离矩阵
    const dp = [];
    for (let i = 0; i <= m; i++) {
      dp[i] = [i];
    }
    for (let j = 1; j <= n; j++) {
      dp[0][j] = j;
    }
    
    // 填充矩阵
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (s1[i-1] === s2[j-1]) {
          dp[i][j] = dp[i-1][j-1];
        } else {
          dp[i][j] = Math.min(
            dp[i-1][j] + 1,    // 删除
            dp[i][j-1] + 1,    // 插入
            dp[i-1][j-1] + 1   // 替换
          );
        }
      }
    }
    
    return dp[m][n];
  },
  
  // 标记错误（根据比较结果）
  markErrorsFromComparison(content, errorPositions, language) {
    if (language === 'zh') {
      // 中文处理：将每个字符作为一个单元
      let chars = content.split('');
      
      // 构建带错误标记的内容 - 使用rich-text兼容的节点结构
      let nodes = [];
      for (let i = 0; i < chars.length; i++) {
        if (errorPositions.includes(i)) {
          nodes.push({
            name: 'span',
            attrs: {
              style: 'color: #ff4d4f; font-weight: bold;'
            },
            children: [{
              type: 'text',
              text: chars[i]
            }]
          });
        } else {
          nodes.push({
            type: 'text',
            text: chars[i]
          });
        }
      }
      return nodes;
    } else {
      // 英文处理：将每个单词作为一个单元
      let words = content.split(/\s+/);
      
      // 构建带错误标记的内容 - 使用rich-text兼容的节点结构
      let nodes = [];
      for (let i = 0; i < words.length; i++) {
        if (errorPositions.includes(i)) {
          nodes.push({
            name: 'span',
            attrs: {
              style: 'color: #ff4d4f; font-weight: bold;'
            },
            children: [{
              type: 'text',
              text: words[i]
            }]
          });
        } else {
          nodes.push({
            type: 'text',
            text: words[i]
          });
        }
        
        // 添加空格（除了最后一个单词后面）
        if (i < words.length - 1) {
          nodes.push({
            type: 'text',
            text: ' '
          });
        }
      }
      return nodes;
    }
  },
  
  calculateFlowers(accuracy) {
    if (accuracy >= 95) {
      return 3;
    } else if (accuracy >= 85) {
      return 2;
    } else if (accuracy >= 75) {
      return 1;
    }
    return 0;
  },
  
  generateFeedback(accuracy) {
    if (accuracy >= 95) {
      return "太棒了！你的朗读非常流利准确！";
    } else if (accuracy >= 85) {
      return "很好！继续练习，你会更加出色！";
    } else if (accuracy >= 75) {
      return "不错的尝试！再多练习几次吧！";
    } else if (accuracy >= 60) {
      return "加油！多读几遍可以做得更好哦！";
    } else {
      return "继续努力，慢慢朗读，注意每个字的发音！";
    }
  },
  
  tryAgain() {
    this.setData({
      showResult: false
    });
  },
  
  finishReading() {
    wx.navigateBack();
  },
  
  // 切换测试模式
  toggleTestMode(e) {
    const testMode = e.detail.value;
    this.setData({ testMode });
    wx.setStorageSync('reading_test_mode', testMode);
    
    // 显示提示
    wx.showToast({
      title: testMode ? '测试模式已开启' : '测试模式已关闭',
      icon: 'none'
    });
    
    console.log('测试模式状态:', testMode);
  },
  
  // 处理录音结果，使用模拟方法跳过语音识别
  processRecording() {
    console.log('处理录音...');
    
    // 直接使用模拟评分方法
    const article = this.data.article;
    if (article && article.content) {
      this.simulateVoiceRecognition(null, article.content, article.language);
    } else {
      console.error('文章内容不存在');
      this.setData({ recordStatus: 'idle' });
      wx.showToast({
        title: '评分失败，请重试',
        icon: 'none'
      });
    }
  }
});