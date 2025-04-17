// reading.js - 朗读练习页面逻辑

const app = getApp();

// 引入语音服务
const speechService = require('../../services/speech/speech.service').default;
const { SPEECH_STATUS, SPEECH_EVENTS, SPEECH_RATE } = require('../../services/speech/speech.service');

// 引入文本对比工具
import { calculateTextSimilarity, generateComparisonHtml } from '../../utils/text-compare';

Page({
  /**
   * 页面的初始数据
   */
  data: {
    article: null,        // 当前文章
    articleId: '',        // 文章ID
    isReady: false,       // 语音服务是否准备好
    isSpeaking: false,    // 是否正在朗读
    isRecording: false,   // 是否正在录音
    loading: true,        // 是否正在加载
    recognitionText: '',  // 识别结果文本
    hasScore: false,      // 是否有得分结果
    score: 0,             // 当前得分
    scoreComment: '',     // 分数评价
    recordingDuration: 0, // 录音时长（秒）
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const { id } = options;
    
    // 初始化计时器
    this.recordingTimer = null;
    
    if (!id) {
      wx.showToast({
        title: '缺少文章ID',
        icon: 'error'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }

    this.setData({
      articleId: id,
      loading: true
    });

    // 提前请求麦克风授权
    this.requestRecordAuth();

    // 等待语音服务初始化完成
    app.waitForReady().then(() => {
      this.setData({ isReady: true });
      this.loadArticle(id);
    }).catch(err => {
      console.error('语音服务初始化失败', err);
      wx.showToast({
        title: '语音服务初始化失败',
        icon: 'error'
      });
      this.loadArticle(id);
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    this.setData({
      isReady: true
    });
    
    // 设置语音服务事件监听
    this.setupSpeechListeners();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 如果页面已就绪且语音服务可用，重新设置监听
    if (this.data.isReady && speechService) {
      this.setupSpeechListeners();
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    // 停止语音和录音
    this.stopSpeaking();
    this.stopRecording();
    
    // 移除语音服务事件监听
    this.cleanupSpeechListeners();
    
    // 清理计时器
    this.stopRecordingTimer();
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    // 停止语音和录音
    this.stopSpeaking();
    this.stopRecording();
    
    // 移除语音服务事件监听
    this.cleanupSpeechListeners();
    
    // 清理计时器
    this.stopRecordingTimer();
  },

  /**
   * 加载文章数据
   */
  loadArticle: function(id) {
    // 从本地存储获取文章
    try {
      const articles = wx.getStorageSync('articles') || [];
      const article = articles.find(item => item.id === id);
      
      if (!article) {
        wx.showToast({
          title: '文章不存在',
          icon: 'error'
        });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
        return;
      }
      
      this.setData({
        article,
        loading: false
      });
    } catch (e) {
      console.error('加载文章失败', e);
      wx.showToast({
        title: '加载文章失败',
        icon: 'error'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  /**
   * 设置语音服务事件监听
   */
  setupSpeechListeners: function () {
    if (!speechService) {
      console.error('语音服务不可用');
      return;
    }
    
    // 监听语音状态变化
    speechService.on && speechService.on(SPEECH_EVENTS.STATUS_CHANGE, this.handleSpeechStatusChange);
    
    // 监听语音播放完成
    speechService.on && speechService.on(SPEECH_EVENTS.SPEAK_DONE, this.handleSpeakDone);
    
    // 监听语音评分结果
    speechService.on && speechService.on(SPEECH_EVENTS.SCORE_RESULT, this.handleScoreResult);
    
    // 监听语音识别结果
    speechService.on && speechService.on(SPEECH_EVENTS.RECOGNITION_RESULT, this.handleRecognitionResult);
  },

  /**
   * 清理语音服务事件监听
   */
  cleanupSpeechListeners: function () {
    if (!speechService) return;
    
    speechService.off && speechService.off(SPEECH_EVENTS.STATUS_CHANGE, this.handleSpeechStatusChange);
    speechService.off && speechService.off(SPEECH_EVENTS.SPEAK_DONE, this.handleSpeakDone);
    speechService.off && speechService.off(SPEECH_EVENTS.SCORE_RESULT, this.handleScoreResult);
    speechService.off && speechService.off(SPEECH_EVENTS.RECOGNITION_RESULT, this.handleRecognitionResult);
  },

  /**
   * 处理语音状态变化
   */
  handleSpeechStatusChange: function (status) {
    if (status === SPEECH_STATUS.SPEAKING) {
      this.setData({ isSpeaking: true });
    } else if (status === SPEECH_STATUS.IDLE) {
      this.setData({ isSpeaking: false });
    }
  },

  /**
   * 处理语音播放完成
   */
  handleSpeakDone: function () {
    this.setData({ isSpeaking: false });
    
    // 可以在这里提示用户开始录音
    wx.showToast({
      title: '请开始朗读',
      icon: 'none'
    });
  },
  
  /**
   * 处理语音识别结果
   */
  handleRecognitionResult: function (result) {
    console.log("收到识别结果:", result);
    
    const recognitionText = result.text || "";
    
    this.setData({
      recognitionText
    });
    
    // 如果有文章内容，进行文本对比
    if (this.data.article && this.data.article.content) {
      const originalText = this.data.article.content;
      
      // 计算相似度
      const similarity = calculateTextSimilarity(originalText, recognitionText);
      
      // 生成文本对比结果 - 用于在原文区域显示
      const comparisonResult = generateComparisonHtml(originalText, recognitionText);
      
      // 计算得分（根据相似度）
      const score = Math.round(similarity);
      
      // 生成评价信息
      let scoreComment = '';
      if (score >= 90) {
        scoreComment = '完美朗读，发音准确';
      } else if (score >= 80) {
        scoreComment = '朗读优秀，略有瑕疵';
      } else if (score >= 70) {
        scoreComment = '朗读良好，有待提高';
      } else if (score >= 60) {
        scoreComment = '朗读尚可，需要练习';
      } else {
        scoreComment = '需要多加练习';
      }
      
      this.setData({
        hasScore: true,
        score,
        scoreComment,
        comparisonResult  // 设置对比结果用于在原文区域显示
      });
    }
  },

  /**
   * 处理评分结果
   */
  handleScoreResult: function (result) {
    // 处理评分结果
    console.log("收到评分结果:", result);
    const score = Math.floor(result.score || 0);
    
    // 根据分数生成评价
    let comment = '';
    if (score >= 90) {
      comment = '完美朗读，发音准确';
    } else if (score >= 80) {
      comment = '朗读优秀，略有瑕疵';
    } else if (score >= 70) {
      comment = '朗读良好，有待提高';
    } else if (score >= 60) {
      comment = '朗读尚可，需要练习';
    } else {
      comment = '需要多加练习';
    }
    
    this.setData({
      score: score,
      scoreComment: comment,
      hasScore: true
    });
    
    // 保存练习数据
    this.savePracticeData(score);
  },

  /**
   * 保存练习数据
   */
  savePracticeData: function (score) {
    try {
      const articleId = this.data.articleId;
      const practiceRecords = wx.getStorageSync('practiceRecords') || {};
      
      if (!practiceRecords[articleId]) {
        practiceRecords[articleId] = {
          count: 0,
          scores: []
        };
      }
      
      practiceRecords[articleId].count += 1;
      practiceRecords[articleId].scores = practiceRecords[articleId].scores || [];
      practiceRecords[articleId].scores.push(score);
      
      // 只保留最近10条记录
      if (practiceRecords[articleId].scores.length > 10) {
        practiceRecords[articleId].scores = practiceRecords[articleId].scores.slice(-10);
      }
      
      wx.setStorageSync('practiceRecords', practiceRecords);
      console.log('保存练习数据成功');
    } catch (e) {
      console.error('保存练习数据失败', e);
    }
  },

  /**
   * 播放文章文本
   */
  playText: function() {
    if (!this.data.article) {
      wx.showToast({
        title: '文章数据为空',
        icon: 'none'
      });
      return;
    }

    // 组合标题和内容
    const title = this.data.article.title || '';
    const content = this.data.article.content || '';
    const textToSpeak = title + '。' + content; // 标题和内容之间添加停顿

    // 设置正在播放状态
    this.setData({ isSpeaking: true });
    
    // 获取语音服务
    const speechService = getApp().getSpeechService();
    if (!speechService) {
      wx.showToast({
        title: '语音服务不可用',
        icon: 'none'
      });
      this.setData({ isSpeaking: false });
      return;
    }
    
    // 使用语音服务的文本转语音功能，使用固定的0.8语速
    const speechRate = 0.8; // 固定语速为0.8
    
    speechService.textToSpeech(textToSpeak, speechRate)
      .then(filePath => {
        // 创建背景音频播放器
        const backgroundAudioManager = wx.getBackgroundAudioManager();
        // 必须设置title，否则无法播放
        backgroundAudioManager.title = this.data.article.title || '朗读练习';
        // 设置播放源
        backgroundAudioManager.src = filePath;
        // 设置播放速度为固定值
        backgroundAudioManager.playbackRate = speechRate;
        
        backgroundAudioManager.onPlay(() => {
          console.log('开始播放语音');
        });
        
        backgroundAudioManager.onEnded(() => {
          console.log('语音播放结束');
          this.setData({ isSpeaking: false });
        });
        
        backgroundAudioManager.onError((err) => {
          console.error('播放错误:', err);
          this.setData({ isSpeaking: false });
          wx.showToast({
            title: '播放失败',
            icon: 'none'
          });
        });
      })
      .catch(err => {
        console.error('语音合成失败:', err);
        wx.showToast({
          title: '播放失败',
          icon: 'none'
        });
        this.setData({ isSpeaking: false });
      });
  },

  /**
   * 停止朗读
   */
  stopSpeaking: function() {
    if (!this.data.isReady || !this.data.isSpeaking) return;
    
    const speechService = app.getSpeechService();
    if (speechService) {
      speechService.stopAudio();
      this.setData({ isSpeaking: false });
    }
  },

  /**
   * 切换录音状态
   */
  toggleRecording: function () {
    if (this.data.isRecording) {
      this.stopRecording();
    } else {
      // 如果有得分结果，则先重置
      if (this.data.hasScore) {
        this.resetReading();
      }
      this.startRecording();
    }
  },

  /**
   * 开始录音
   */
  startRecording: function() {
    if (!speechService || this.data.isRecording) return;
    
    // 获取当前文章内容
    const text = this.data.article.content;
    if (!text) return;
    
    // 清除之前的结果
    this.setData({
      hasScore: false,
      recognitionText: '',
      score: 0,
      scoreComment: '',
      recordingDuration: 0
    });
    
    // 开始录音评测
    speechService.startRecording(text)
      .then(() => {
        console.log('开始录音评测');
        
        // 设置录音状态
        this.setData({
          isRecording: true
        });
        
        // 开始计时
        this.startRecordingTimer();
        
        wx.showToast({
          title: '请开始朗读',
          icon: 'none'
        });
      })
      .catch(error => {
        console.error('开始录音评测失败:', error);
        wx.showToast({
          title: '开始录音失败',
          icon: 'none'
        });
      });
  },

  /**
   * 停止录音
   */
  stopRecording: function() {
    if (!speechService || !this.data.isRecording) return;
    
    // 停止录音评测
    speechService.stopRecording()
      .then(() => {
        console.log('停止录音评测');
        this.setData({
          isRecording: false
        });
        
        // 停止计时
        this.stopRecordingTimer();
        
        wx.showToast({
          title: '正在分析...',
          icon: 'loading'
        });
      })
      .catch(error => {
        console.error('停止录音评测失败:', error);
        this.setData({
          isRecording: false
        });
        
        // 停止计时
        this.stopRecordingTimer();
      });
  },
  
  /**
   * 开始录音计时
   */
  startRecordingTimer: function() {
    // 清除可能存在的计时器
    this.stopRecordingTimer();
    
    // 重置计时
    this.setData({ recordingDuration: 0 });
    
    // 创建新计时器，每秒更新一次时长
    this.recordingTimer = setInterval(() => {
      this.setData({
        recordingDuration: this.data.recordingDuration + 1
      });
    }, 1000);
  },
  
  /**
   * 停止录音计时
   */
  stopRecordingTimer: function() {
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
    }
  },

  /**
   * 重置练习
   */
  resetReading: function() {
    // 停止计时器
    this.stopRecordingTimer();
    
    this.setData({
      hasScore: false,
      recognitionText: '',
      score: 0,
      scoreComment: '',
      isRecording: false,
      recordingDuration: 0
    });
  },
  
  /**
   * 完成阅读练习，保存记录并返回
   */
  finishReading: function() {
    // 保存本次练习记录
    const recordData = {
      articleId: this.data.article._id,
      title: this.data.article.title,
      score: this.data.score,
      duration: this.data.recordingDuration,
      date: new Date().getTime()
    };

    try {
      // 获取已有记录
      let records = wx.getStorageSync('reading_records') || [];
      records.unshift(recordData);
      // 保存记录，最多保存100条
      wx.setStorageSync('reading_records', records.slice(0, 100));
      
      // 返回上一页
      wx.navigateBack();
    } catch (e) {
      console.error('保存记录失败', e);
      wx.showToast({
        title: '保存记录失败',
        icon: 'none'
      });
    }
  },

  /**
   * 分享
   */
  onShareAppMessage: function() {
    return {
      title: `我正在练习朗读《${this.data.article?.title || '朗读练习'}》`,
      path: `/pages/reading/reading?id=${this.data.articleId}`
    };
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
              console.log('麦克风授权成功');
            },
            fail: (err) => {
              console.error('麦克风授权失败', err);
              // 提示用户开启授权
              wx.showModal({
                title: '提示',
                content: '使用朗读功能需要您授权麦克风权限',
                confirmText: '去授权',
                cancelText: '取消',
                success: (modalRes) => {
                  if (modalRes.confirm) {
                    // 引导用户到设置页手动授权
                    wx.openSetting({
                      success: (settingRes) => {
                        if (settingRes.authSetting['scope.record']) {
                          console.log('用户已授权麦克风权限');
                        } else {
                          console.log('用户拒绝授权麦克风权限');
                        }
                      }
                    });
                  }
                }
              });
            }
          });
        } else {
          console.log('已授权麦克风权限');
        }
      }
    });
  },
}); 