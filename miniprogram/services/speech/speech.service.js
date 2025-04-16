/**
 * 语音服务
 * 处理录音、播放和语音识别等相关功能
 */
import { RECORDER_OPTIONS, PRACTICE_TYPES } from '../../utils/constant';
import { generateUUID, calculateTextSimilarity } from '../../utils/util';

/**
 * 语音服务类
 */
class SpeechService {
  constructor() {
    // 录音管理器实例
    this.recorderManager = null;
    // 音频播放器实例
    this.innerAudioContext = null;
    // 当前录音临时文件路径
    this.tempFilePath = '';
    // 录音状态
    this.isRecording = false;
    // 播放状态
    this.isPlaying = false;
    // 录音结束回调
    this.onRecordEndCallback = null;
    // 播放结束回调
    this.onPlayEndCallback = null;
    // 初始化
    this.init();
  }

  /**
   * 初始化语音服务
   */
  init() {
    // 初始化录音管理器
    this.initRecorderManager();
    // 初始化音频播放器
    this.initAudioContext();
  }

  /**
   * 初始化录音管理器
   */
  initRecorderManager() {
    if (!this.recorderManager) {
      this.recorderManager = wx.getRecorderManager();
      
      // 监听录音开始事件
      this.recorderManager.onStart(() => {
        console.log('录音开始');
        this.isRecording = true;
      });
      
      // 监听录音暂停事件
      this.recorderManager.onPause(() => {
        console.log('录音暂停');
        this.isRecording = false;
      });
      
      // 监听录音恢复事件
      this.recorderManager.onResume(() => {
        console.log('录音恢复');
        this.isRecording = true;
      });
      
      // 监听录音停止事件
      this.recorderManager.onStop((res) => {
        console.log('录音停止', res);
        this.isRecording = false;
        this.tempFilePath = res.tempFilePath;
        
        // 执行录音结束回调
        if (this.onRecordEndCallback && typeof this.onRecordEndCallback === 'function') {
          this.onRecordEndCallback(res);
        }
      });
      
      // 监听录音错误事件
      this.recorderManager.onError((err) => {
        console.error('录音错误', err);
        this.isRecording = false;
        
        wx.showToast({
          title: '录音出错，请重试',
          icon: 'none'
        });
      });
    }
  }

  /**
   * 初始化音频播放器
   */
  initAudioContext() {
    if (!this.innerAudioContext) {
      this.innerAudioContext = wx.createInnerAudioContext();
      
      // 监听播放开始事件
      this.innerAudioContext.onPlay(() => {
        console.log('音频播放开始');
        this.isPlaying = true;
      });
      
      // 监听播放暂停事件
      this.innerAudioContext.onPause(() => {
        console.log('音频播放暂停');
        this.isPlaying = false;
      });
      
      // 监听播放停止事件
      this.innerAudioContext.onStop(() => {
        console.log('音频播放停止');
        this.isPlaying = false;
      });
      
      // 监听播放结束事件
      this.innerAudioContext.onEnded(() => {
        console.log('音频播放结束');
        this.isPlaying = false;
        
        // 执行播放结束回调
        if (this.onPlayEndCallback && typeof this.onPlayEndCallback === 'function') {
          this.onPlayEndCallback();
        }
      });
      
      // 监听播放错误事件
      this.innerAudioContext.onError((err) => {
        console.error('音频播放错误', err);
        this.isPlaying = false;
        
        wx.showToast({
          title: '播放出错，请重试',
          icon: 'none'
        });
      });
    }
  }

  /**
   * 开始录音
   * @param {Function} callback 录音结束回调函数
   */
  startRecord(callback) {
    if (!this.recorderManager) {
      this.initRecorderManager();
    }
    
    // 设置录音结束回调
    this.onRecordEndCallback = callback;
    
    // 开始录音
    this.recorderManager.start(RECORDER_OPTIONS);
    
    return this;
  }

  /**
   * 停止录音
   */
  stopRecord() {
    if (this.isRecording && this.recorderManager) {
      this.recorderManager.stop();
    }
    
    return this;
  }

  /**
   * 播放录音
   * @param {string} filePath 音频文件路径，不传则播放最近一次录制的音频
   * @param {Function} callback 播放结束回调函数
   */
  playAudio(filePath, callback) {
    if (!this.innerAudioContext) {
      this.initAudioContext();
    }
    
    // 设置播放结束回调
    this.onPlayEndCallback = callback;
    
    // 停止当前正在播放的音频
    if (this.isPlaying) {
      this.stopAudio();
    }
    
    // 设置音频源
    this.innerAudioContext.src = filePath || this.tempFilePath;
    
    // 开始播放
    this.innerAudioContext.play();
    
    return this;
  }

  /**
   * 停止音频播放
   */
  stopAudio() {
    if (this.isPlaying && this.innerAudioContext) {
      this.innerAudioContext.stop();
    }
    
    return this;
  }

  /**
   * 暂停音频播放
   */
  pauseAudio() {
    if (this.isPlaying && this.innerAudioContext) {
      this.innerAudioContext.pause();
    }
    
    return this;
  }

  /**
   * 恢复音频播放
   */
  resumeAudio() {
    if (this.innerAudioContext && !this.isPlaying) {
      this.innerAudioContext.play();
    }
    
    return this;
  }

  /**
   * 语音识别（调用微信同声传译插件）
   * @param {string} filePath 音频文件路径
   * @returns {Promise<string>} 识别结果文本
   */
  recognizeSpeech(filePath) {
    const plugin = requirePlugin('WechatSI');
    const manager = plugin.getRecordRecognitionManager();
    
    return new Promise((resolve, reject) => {
      // 设置音频源
      manager.onRecognize = (res) => {
        if (res.result) {
          resolve(res.result);
        }
      };
      
      // 监听识别错误
      manager.onError = (err) => {
        console.error('语音识别错误', err);
        reject(err);
      };
      
      // 开始识别
      manager.start({ duration: 30000, lang: 'zh_CN' });
    });
  }

  /**
   * 评估朗读或背诵质量
   * @param {string} originalText 原文本
   * @param {string} recognizedText 识别的文本
   * @param {string} practiceType 练习类型（朗读或背诵）
   * @returns {object} 评估结果，包含分数和评价
   */
  evaluatePractice(originalText, recognizedText, practiceType = PRACTICE_TYPES.READ) {
    // 计算文本相似度
    const similarity = calculateTextSimilarity(originalText, recognizedText);
    
    // 根据练习类型和相似度计算得分
    let score = similarity;
    
    // 对于背诵类型，要求更高
    if (practiceType === PRACTICE_TYPES.RECITE) {
      // 背诵得分会根据相似度有所调整，鼓励完全记忆
      score = similarity < 80 ? similarity : Math.min(100, similarity * 1.1);
    }
    
    // 生成评估结果
    return {
      id: generateUUID(),
      score: Math.round(score),
      similarity,
      originalText,
      recognizedText,
      practiceType,
      timestamp: Date.now(),
    };
  }

  /**
   * 文本转语音（调用微信同声传译插件）
   * @param {string} text 需要转换的文本
   * @returns {Promise<string>} 转换后的临时文件路径
   */
  textToSpeech(text) {
    const plugin = requirePlugin('WechatSI');
    
    return new Promise((resolve, reject) => {
      plugin.textToSpeech({
        lang: 'zh_CN',
        tts: true,
        content: text,
        success: (res) => {
          resolve(res.filename);
        },
        fail: (err) => {
          console.error('文本转语音失败', err);
          reject(err);
        }
      });
    });
  }

  /**
   * 销毁服务实例，释放资源
   */
  destroy() {
    // 停止录音
    if (this.recorderManager) {
      this.isRecording && this.recorderManager.stop();
    }
    
    // 停止播放
    if (this.innerAudioContext) {
      this.isPlaying && this.innerAudioContext.stop();
      this.innerAudioContext.destroy();
    }
    
    // 重置状态
    this.recorderManager = null;
    this.innerAudioContext = null;
    this.tempFilePath = '';
    this.isRecording = false;
    this.isPlaying = false;
    this.onRecordEndCallback = null;
    this.onPlayEndCallback = null;
  }
}

// 导出服务实例
export const speechService = new SpeechService();

export default speechService; 
 * 语音服务
 * 处理录音、播放和语音识别等相关功能
 */
import { RECORDER_OPTIONS, PRACTICE_TYPES } from '../../utils/constant';
import { generateUUID, calculateTextSimilarity } from '../../utils/util';

/**
 * 语音服务类
 */
class SpeechService {
  constructor() {
    // 录音管理器实例
    this.recorderManager = null;
    // 音频播放器实例
    this.innerAudioContext = null;
    // 当前录音临时文件路径
    this.tempFilePath = '';
    // 录音状态
    this.isRecording = false;
    // 播放状态
    this.isPlaying = false;
    // 录音结束回调
    this.onRecordEndCallback = null;
    // 播放结束回调
    this.onPlayEndCallback = null;
    // 初始化
    this.init();
  }

  /**
   * 初始化语音服务
   */
  init() {
    // 初始化录音管理器
    this.initRecorderManager();
    // 初始化音频播放器
    this.initAudioContext();
  }

  /**
   * 初始化录音管理器
   */
  initRecorderManager() {
    if (!this.recorderManager) {
      this.recorderManager = wx.getRecorderManager();
      
      // 监听录音开始事件
      this.recorderManager.onStart(() => {
        console.log('录音开始');
        this.isRecording = true;
      });
      
      // 监听录音暂停事件
      this.recorderManager.onPause(() => {
        console.log('录音暂停');
        this.isRecording = false;
      });
      
      // 监听录音恢复事件
      this.recorderManager.onResume(() => {
        console.log('录音恢复');
        this.isRecording = true;
      });
      
      // 监听录音停止事件
      this.recorderManager.onStop((res) => {
        console.log('录音停止', res);
        this.isRecording = false;
        this.tempFilePath = res.tempFilePath;
        
        // 执行录音结束回调
        if (this.onRecordEndCallback && typeof this.onRecordEndCallback === 'function') {
          this.onRecordEndCallback(res);
        }
      });
      
      // 监听录音错误事件
      this.recorderManager.onError((err) => {
        console.error('录音错误', err);
        this.isRecording = false;
        
        wx.showToast({
          title: '录音出错，请重试',
          icon: 'none'
        });
      });
    }
  }

  /**
   * 初始化音频播放器
   */
  initAudioContext() {
    if (!this.innerAudioContext) {
      this.innerAudioContext = wx.createInnerAudioContext();
      
      // 监听播放开始事件
      this.innerAudioContext.onPlay(() => {
        console.log('音频播放开始');
        this.isPlaying = true;
      });
      
      // 监听播放暂停事件
      this.innerAudioContext.onPause(() => {
        console.log('音频播放暂停');
        this.isPlaying = false;
      });
      
      // 监听播放停止事件
      this.innerAudioContext.onStop(() => {
        console.log('音频播放停止');
        this.isPlaying = false;
      });
      
      // 监听播放结束事件
      this.innerAudioContext.onEnded(() => {
        console.log('音频播放结束');
        this.isPlaying = false;
        
        // 执行播放结束回调
        if (this.onPlayEndCallback && typeof this.onPlayEndCallback === 'function') {
          this.onPlayEndCallback();
        }
      });
      
      // 监听播放错误事件
      this.innerAudioContext.onError((err) => {
        console.error('音频播放错误', err);
        this.isPlaying = false;
        
        wx.showToast({
          title: '播放出错，请重试',
          icon: 'none'
        });
      });
    }
  }

  /**
   * 开始录音
   * @param {Function} callback 录音结束回调函数
   */
  startRecord(callback) {
    if (!this.recorderManager) {
      this.initRecorderManager();
    }
    
    // 设置录音结束回调
    this.onRecordEndCallback = callback;
    
    // 开始录音
    this.recorderManager.start(RECORDER_OPTIONS);
    
    return this;
  }

  /**
   * 停止录音
   */
  stopRecord() {
    if (this.isRecording && this.recorderManager) {
      this.recorderManager.stop();
    }
    
    return this;
  }

  /**
   * 播放录音
   * @param {string} filePath 音频文件路径，不传则播放最近一次录制的音频
   * @param {Function} callback 播放结束回调函数
   */
  playAudio(filePath, callback) {
    if (!this.innerAudioContext) {
      this.initAudioContext();
    }
    
    // 设置播放结束回调
    this.onPlayEndCallback = callback;
    
    // 停止当前正在播放的音频
    if (this.isPlaying) {
      this.stopAudio();
    }
    
    // 设置音频源
    this.innerAudioContext.src = filePath || this.tempFilePath;
    
    // 开始播放
    this.innerAudioContext.play();
    
    return this;
  }

  /**
   * 停止音频播放
   */
  stopAudio() {
    if (this.isPlaying && this.innerAudioContext) {
      this.innerAudioContext.stop();
    }
    
    return this;
  }

  /**
   * 暂停音频播放
   */
  pauseAudio() {
    if (this.isPlaying && this.innerAudioContext) {
      this.innerAudioContext.pause();
    }
    
    return this;
  }

  /**
   * 恢复音频播放
   */
  resumeAudio() {
    if (this.innerAudioContext && !this.isPlaying) {
      this.innerAudioContext.play();
    }
    
    return this;
  }

  /**
   * 语音识别（调用微信同声传译插件）
   * @param {string} filePath 音频文件路径
   * @returns {Promise<string>} 识别结果文本
   */
  recognizeSpeech(filePath) {
    const plugin = requirePlugin('WechatSI');
    const manager = plugin.getRecordRecognitionManager();
    
    return new Promise((resolve, reject) => {
      // 设置音频源
      manager.onRecognize = (res) => {
        if (res.result) {
          resolve(res.result);
        }
      };
      
      // 监听识别错误
      manager.onError = (err) => {
        console.error('语音识别错误', err);
        reject(err);
      };
      
      // 开始识别
      manager.start({ duration: 30000, lang: 'zh_CN' });
    });
  }

  /**
   * 评估朗读或背诵质量
   * @param {string} originalText 原文本
   * @param {string} recognizedText 识别的文本
   * @param {string} practiceType 练习类型（朗读或背诵）
   * @returns {object} 评估结果，包含分数和评价
   */
  evaluatePractice(originalText, recognizedText, practiceType = PRACTICE_TYPES.READ) {
    // 计算文本相似度
    const similarity = calculateTextSimilarity(originalText, recognizedText);
    
    // 根据练习类型和相似度计算得分
    let score = similarity;
    
    // 对于背诵类型，要求更高
    if (practiceType === PRACTICE_TYPES.RECITE) {
      // 背诵得分会根据相似度有所调整，鼓励完全记忆
      score = similarity < 80 ? similarity : Math.min(100, similarity * 1.1);
    }
    
    // 生成评估结果
    return {
      id: generateUUID(),
      score: Math.round(score),
      similarity,
      originalText,
      recognizedText,
      practiceType,
      timestamp: Date.now(),
    };
  }

  /**
   * 文本转语音（调用微信同声传译插件）
   * @param {string} text 需要转换的文本
   * @returns {Promise<string>} 转换后的临时文件路径
   */
  textToSpeech(text) {
    const plugin = requirePlugin('WechatSI');
    
    return new Promise((resolve, reject) => {
      plugin.textToSpeech({
        lang: 'zh_CN',
        tts: true,
        content: text,
        success: (res) => {
          resolve(res.filename);
        },
        fail: (err) => {
          console.error('文本转语音失败', err);
          reject(err);
        }
      });
    });
  }

  /**
   * 销毁服务实例，释放资源
   */
  destroy() {
    // 停止录音
    if (this.recorderManager) {
      this.isRecording && this.recorderManager.stop();
    }
    
    // 停止播放
    if (this.innerAudioContext) {
      this.isPlaying && this.innerAudioContext.stop();
      this.innerAudioContext.destroy();
    }
    
    // 重置状态
    this.recorderManager = null;
    this.innerAudioContext = null;
    this.tempFilePath = '';
    this.isRecording = false;
    this.isPlaying = false;
    this.onRecordEndCallback = null;
    this.onPlayEndCallback = null;
  }
}

// 导出服务实例
export const speechService = new SpeechService();

export default speechService; 
 