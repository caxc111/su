// 引入微信同声传译插件
const plugin = requirePlugin('WechatSI');
// 引入常量
import { ARTICLE_LEVELS } from '../../utils/constant';
// 引入文本对比工具
import { calculateTextSimilarity, generateComparisonHtml, generateUUID } from '../../utils/text-compare';

const app = getApp();

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 原始文本
    originalText: {
      type: String,
      value: '',
      observer: function(newVal) {
        if (newVal) {
          this.setData({ originalTextFormatted: newVal.trim() });
        }
      }
    },
    // 练习类型: 'read' 朗读, 'recite' 背诵
    practiceType: {
      type: String,
      value: 'read'
    },
    // 是否显示对比结果
    showComparison: {
      type: Boolean,
      value: true
    },
    // 原文本，用于对比识别结果
    originText: {
      type: String,
      value: ''
    },
    // 模式：reading(朗读模式) 或 recite(背诵模式)
    mode: {
      type: String,
      value: 'reading' // 默认为朗读模式
    },
    // 是否加载完成
    isReady: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    loading: false,           // 加载状态
    isRecording: false,       // 是否正在录音
    recordingDuration: 0,     // 录音时长（秒）
    recognitionText: '',      // 识别文本
    hasScore: false,          // 是否有得分
    score: 0,                 // 评分
    scoreComment: '',         // 评价
    comparisonResult: '',     // 对比结果HTML
    recordFilePath: '',       // 录音文件路径
    recognitionManager: null, // 语音识别管理器
    recordTimer: null,         // 录音计时器
    recording: false,           // 是否正在录音
    recognizing: false,         // 是否正在识别
    similarity: 0,              // 相似度得分
    detailResult: [],           // 详细对比结果
    showResult: false,          // 是否显示结果
    errorMsg: '',               // 错误信息
    authorized: false,          // 麦克风授权状态
    speechService: null,        // 语音服务实例
    waitingSpeechService: false, // 是否等待语音服务初始化
    originalTextFormatted: '', // 格式化后的原始文本
    recordButtonDisabled: false, // 录音按钮是否禁用
    timerHandle: null,         // 定时器句柄
  },

  /**
   * 组件的生命周期
   */
  lifetimes: {
    attached() {
      // 初始化语音识别管理器
      this.initRecognitionManager();
      // 检查麦克风权限
      this.checkRecordAuth();
      // 获取语音服务
      this.initSpeechService();
    },
    detached() {
      // 清理资源
      this.destroyRecognitionManager();
      this.stopRecordTimer();
      // 清理事件监听
      this.cleanupSpeechListeners();
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 处理录音按钮点击
     */
    handleRecordButtonClick() {
      this.toggleRecording();
    },

    /**
     * 处理重置按钮点击
     */
    handleReset() {
      this.resetRecognition();
    },

    /**
     * 处理确认按钮点击
     */
    handleConfirm() {
      this.confirmResult();
    },
    
    /**
     * 初始化语音识别管理器
     */
    initRecognitionManager() {
      // 获取录音识别管理器
      const recognitionManager = plugin.getRecordRecognitionManager();
      
      // 设置识别开始事件
      recognitionManager.onStart = (res) => {
        console.log('语音识别开始', res);
        this.setData({ isRecording: true });
        this.startRecordTimer();
      };
      
      // 设置实时识别事件
      recognitionManager.onRecognize = (res) => {
        console.log('语音识别中', res);
        // 实时更新识别文本
        if (res.result) {
          this.setData({ recognitionText: res.result });
        }
      };
      
      // 设置识别结束事件
      recognitionManager.onStop = (res) => {
        console.log('语音识别结束', res);
        this.stopRecordTimer();
        this.setData({ isRecording: false });
        
        // 处理识别结果
        if (res.result) {
          this.processRecognitionResult(res.result, res.tempFilePath);
        } else {
          // 识别失败处理
          wx.showToast({
            title: '未能识别语音内容',
            icon: 'none'
          });
        }
      };
      
      // 设置识别错误事件
      recognitionManager.onError = (err) => {
        console.error('语音识别错误', err);
        this.stopRecordTimer();
        this.setData({ isRecording: false });
        
        // 显示错误信息
        wx.showToast({
          title: `识别出错: ${err.msg || '未知错误'}`,
          icon: 'none'
        });
      };
      
      // 保存到实例
      this.recognitionManager = recognitionManager;
    },
    
    /**
     * 开始/停止录音
     */
    toggleRecording() {
      if (this.data.isRecording) {
        this.stopRecording();
      } else {
        this.startRecording();
      }
    },
    
    /**
     * 开始录音
     */
    startRecording() {
      if (!this.recognitionManager) {
        this.initRecognitionManager();
      }
      
      // 重置状态
      this.setData({
        hasScore: false,
        recognitionText: '',
        score: 0,
        scoreComment: '',
        recordingDuration: 0,
        comparisonResult: '',
        recordFilePath: '',
        recordButtonDisabled: true,
        errorMsg: ''
      });
      
      // 开始录音识别
      this.recognitionManager.start({
        duration: 60000,  // 最长录音时间，单位ms
        lang: 'zh_CN'     // 语言，默认中文
      }).then(() => {
        this.setData({
          recordButtonDisabled: false
        });
      }).catch(error => {
        console.error('开始录音失败:', error);
        this.setData({
          recordButtonDisabled: false,
          errorMsg: '开始录音失败: ' + (error.message || '未知错误')
        });
      });
    },
    
    /**
     * 停止录音
     */
    stopRecording() {
      if (this.recognitionManager && this.data.isRecording) {
        this.recognitionManager.stop();
      }
    },
    
    /**
     * 开始录音计时
     */
    startRecordTimer() {
      // 清除可能存在的计时器
      this.stopRecordTimer();
      
      // 创建新计时器，每秒更新一次时长
      this.data.recordTimer = setInterval(() => {
        this.setData({
          recordingDuration: this.data.recordingDuration + 1
        });
      }, 1000);
    },
    
    /**
     * 停止录音计时
     */
    stopRecordTimer() {
      if (this.data.recordTimer) {
        clearInterval(this.data.recordTimer);
        this.setData({ recordTimer: null });
      }
    },
    
    /**
     * 处理识别结果
     * @param {string} recognitionText - 识别文本
     * @param {string} filePath - 录音文件路径
     */
    processRecognitionResult(recognitionText, filePath) {
      const { originalText, practiceType } = this.properties;
      
      if (!recognitionText) {
        wx.showToast({
          title: '未能识别语音内容',
          icon: 'none'
        });
        return;
      }
      
      // 保存识别结果
      this.setData({
        recognitionText,
        recordFilePath: filePath
      });
      
      // 如果有原始文本，进行对比评分
      if (originalText) {
        // 计算相似度
        const similarity = calculateTextSimilarity(originalText, recognitionText);
        
        // 生成评分和评价
        const score = this.calculateScore(similarity, practiceType);
        const comment = this.generateScoreComment(score);
        
        // 生成对比结果HTML（高亮显示不同）
        const comparisonResult = generateComparisonHtml(originalText, recognitionText);
        
        // 更新数据
        this.setData({
          hasScore: true,
          score,
          scoreComment: comment,
          comparisonResult
        });
        
        // 触发得分事件
        this.triggerEvent('score', {
          score,
          recognitionText,
          filePath,
          similarity,
          timestamp: Date.now()
        });
      }
    },
    
    /**
     * 计算得分
     * @param {number} similarity - 相似度百分比
     * @param {string} practiceType - 练习类型
     * @returns {number} 最终得分
     */
    calculateScore(similarity, practiceType) {
      // 根据练习类型调整得分
      // 朗读模式直接使用相似度
      let score = similarity;
      
      // 对于背诵类型，要求更高
      if (practiceType === 'recite') {
        // 背诵得分会根据相似度有所调整，鼓励完全记忆
        score = similarity < 80 ? similarity : Math.min(100, similarity * 1.1);
      }
      
      return Math.round(score);
    },
    
    /**
     * 生成评分评价
     * @param {number} score - 得分
     * @returns {string} 评价文本
     */
    generateScoreComment(score) {
      if (score >= 90) {
        return '完美朗读，发音准确';
      } else if (score >= 80) {
        return '朗读优秀，略有瑕疵';
      } else if (score >= 70) {
        return '朗读良好，有待提高';
      } else if (score >= 60) {
        return '朗读尚可，需要练习';
      } else {
        return '需要多加练习';
      }
    },
    
    /**
     * 重置识别
     */
    resetRecognition() {
      this.setData({
        hasScore: false,
        recognitionText: '',
        score: 0,
        scoreComment: '',
        recordingDuration: 0,
        comparisonResult: ''
      });
      
      // 触发重置事件
      this.triggerEvent('reset');
    },
    
    /**
     * 确认结果
     */
    confirmResult() {
      const { 
        score, 
        recognitionText, 
        recordFilePath, 
        recordingDuration 
      } = this.data;
      
      // 触发确认事件
      this.triggerEvent('confirm', {
        score,
        recognitionText,
        recordFilePath,
        duration: recordingDuration,
        timestamp: Date.now(),
        id: generateUUID()
      });
    },
    
    /**
     * 销毁识别管理器
     */
    destroyRecognitionManager() {
      if (this.data.isRecording && this.recognitionManager) {
        this.recognitionManager.stop();
      }
      
      this.recognitionManager = null;
    },

    // 初始化语音服务
    async initSpeechService() {
      if (!app.globalData.isReady) {
        this.setData({ waitingSpeechService: true });
        await app.waitForReady();
      }
      
      try {
        const speechService = app.getSpeechService();
        if (!speechService) {
          throw new Error('语音服务初始化失败');
        }
        this.setData({ 
          speechService,
          waitingSpeechService: false 
        });
        
        // 设置语音事件监听
        this.setupSpeechListeners();
      } catch (error) {
        console.error('获取语音服务失败:', error);
        this.setData({
          errorMsg: '语音服务初始化失败，请重试',
          waitingSpeechService: false
        });
      }
    },

    // 设置语音服务事件监听
    setupSpeechListeners() {
      if (!this.data.speechService) return;
      
      const { speechService } = this.data;
      
      // 监听识别结果
      speechService.on('recognitionResult', this.handleRecognitionResult.bind(this));
      // 监听识别错误
      speechService.on('recognitionError', this.handleRecognitionError.bind(this));
      // 监听录音状态变化
      speechService.on('recordingStatusChange', this.handleRecordingStatusChange.bind(this));
    },

    // 清理语音服务事件监听
    cleanupSpeechListeners() {
      if (!this.data.speechService) return;
      
      const { speechService } = this.data;
      
      // 移除所有事件监听
      speechService.off('recognitionResult');
      speechService.off('recognitionError');
      speechService.off('recordingStatusChange');
    },

    // 处理识别结果
    handleRecognitionResult(result) {
      console.log('识别结果:', result);
      if (!result || !result.text) return;
      
      this.setData({
        recognitionText: result.text,
        recognizing: false
      });
      
      // 完成识别后进行文本对比
      this.compareTexts();
    },

    // 处理识别错误
    handleRecognitionError(error) {
      console.error('识别错误:', error);
      this.setData({
        errorMsg: `识别出错: ${error.message || '未知错误'}`,
        recognizing: false,
        recording: false
      });
      wx.showToast({
        title: '识别失败，请重试',
        icon: 'none'
      });
    },

    // 处理录音状态变化
    handleRecordingStatusChange(status) {
      console.log('录音状态变化:', status);
      // 根据状态更新UI
      if (status === 'started') {
        this.setData({ recording: true });
      } else if (status === 'stopped') {
        this.setData({ 
          recording: false,
          recognizing: true  // 停止录音后开始识别
        });
      }
    },

    // 检查麦克风权限
    checkRecordAuth() {
      wx.getSetting({
        success: (res) => {
          if (res.authSetting['scope.record']) {
            this.setData({ authorized: true });
          } else {
            this.requestRecordAuth();
          }
        },
        fail: (error) => {
          console.error('获取授权设置失败:', error);
          this.setData({ errorMsg: '获取麦克风权限失败' });
        }
      });
    },

    // 请求麦克风权限
    requestRecordAuth() {
      wx.authorize({
        scope: 'scope.record',
        success: () => {
          this.setData({ authorized: true });
        },
        fail: () => {
          this.setData({ authorized: false });
          wx.showModal({
            title: '需要麦克风权限',
            content: '请在设置中开启麦克风权限以使用语音识别功能',
            confirmText: '去设置',
            cancelText: '取消',
            success: (res) => {
              if (res.confirm) {
                wx.openSetting({
                  success: (settingRes) => {
                    if (settingRes.authSetting['scope.record']) {
                      this.setData({ authorized: true });
                    }
                  }
                });
              }
            }
          });
        }
      });
    },

    // 比较原文和识别文本
    compareTexts() {
      if (!this.data.originText || !this.data.recognitionText) return;
      
      const originText = this.data.originText.trim();
      const recognitionText = this.data.recognitionText.trim();
      
      // 计算相似度
      const similarity = calculateTextSimilarity(originText, recognitionText);
      
      // 生成对比结果，使用修改后的generateComparisonHtml函数
      const comparisonResult = generateComparisonHtml(originText, recognitionText);
      
      this.setData({
        similarity: Math.round(similarity * 100),
        comparisonResult,
        showResult: true
      });
      
      // 触发分数事件
      this.triggerEvent('score', { 
        score: Math.round(similarity * 100),
        recognitionText: recognitionText
      });
    },

    // 计算文本相似度 (简单实现，使用莱文斯坦距离)
    calculateSimilarity(str1, str2) {
      // 如果字符串为空，返回0
      if (!str1.length || !str2.length) return 0;
      
      // 创建距离矩阵
      const matrix = [];
      for (let i = 0; i <= str1.length; i++) {
        matrix[i] = [i];
      }
      for (let j = 0; j <= str2.length; j++) {
        matrix[0][j] = j;
      }
      
      // 填充矩阵
      for (let i = 1; i <= str1.length; i++) {
        for (let j = 1; j <= str2.length; j++) {
          const cost = str1[i-1] === str2[j-1] ? 0 : 1;
          matrix[i][j] = Math.min(
            matrix[i-1][j] + 1,        // 删除
            matrix[i][j-1] + 1,        // 插入
            matrix[i-1][j-1] + cost    // 替换
          );
        }
      }
      
      // 计算相似度
      const distance = matrix[str1.length][str2.length];
      return 1 - distance / Math.max(str1.length, str2.length);
    },

    // 生成详细对比结果 (简单实现)
    generateDetailResult(originalText, recognitionText) {
      // 将文本分割成词或句子进行对比
      // 这里使用简单的按字比较方法，实际应用中可能需要更复杂的NLP处理
      const originChars = originalText.split('');
      const recognChars = recognitionText.split('');
      
      const result = [];
      const maxLen = Math.max(originChars.length, recognChars.length);
      
      for (let i = 0; i < maxLen; i++) {
        const originChar = i < originChars.length ? originChars[i] : '';
        const recognChar = i < recognChars.length ? recognChars[i] : '';
        
        result.push({
          original: originChar,
          recognition: recognChar,
          correct: originChar === recognChar
        });
      }
      
      return result;
    },

    // 重置组件状态
    resetRecognition() {
      this.setData({
        recording: false,
        recognizing: false,
        recognitionText: '',
        similarity: 0,
        detailResult: [],
        showResult: false,
        errorMsg: ''
      });
      
      // 触发重置事件
      this.triggerEvent('reset');
    },

    // 确认当前识别结果
    confirmResult() {
      if (!this.data.showResult) return;
      
      // 触发确认事件
      this.triggerEvent('confirm', {
        score: this.data.similarity,
        recognitionText: this.data.recognitionText,
        detailResult: this.data.detailResult
      });
    },

    // 处理录音按钮点击
    handleRecordBtnTap() {
      if (this.data.recording) {
        this.stopRecording();
      } else {
        this.startRecording();
      }
    }
  }
}); 