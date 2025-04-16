/**
 * 语音服务类
 * 负责文本朗读和语音控制功能
 */

const plugin = requirePlugin('WechatSI');

// 语音状态枚举
export const SPEECH_STATUS = {
  IDLE: 0,      // 空闲
  SPEAKING: 1,  // 朗读中
  PAUSED: 2     // 已暂停
};

// 语音播放速度枚举
export const SPEECH_RATE = {
  VERY_SLOW: 0.5,  // 很慢
  SLOW: 0.7,       // 慢
  NORMAL: 1.0,     // 正常
  FAST: 1.2,       // 快
  VERY_FAST: 1.5   // 很快
};

// 语音资源类型
export const SPEECH_SOURCE_TYPE = {
  NETWORK: 'network',  // 网络资源
  LOCAL: 'local',      // 本地资源
  SYNTHESIZED: 'tts'   // 合成资源
};

// 语音事件类型 (确保键和值一致)
export const SPEECH_EVENTS = {
  STATUS_CHANGE: 'STATUS_CHANGE',
  PROGRESS_UPDATE: 'PROGRESS_UPDATE',
  SENTENCE_CHANGE: 'SENTENCE_CHANGE',
  ERROR: 'ERROR'
};

class SpeechService {
  constructor() {
    this.initialized = false;
  }

  /**
   * 初始化语音服务
   * @returns {Promise<void>}
   */
  async init() {
    if (this.initialized) {
      return;
    }

    try {
      // 检查插件是否可用
      if (!plugin || !plugin.textToSpeech) {
        throw new Error('语音插件不可用');
      }

      // 初始化语音管理器
      this.initManager();
      
      // 初始状态
      this.status = SPEECH_STATUS.IDLE;
      this.currentText = '';
      this.rate = SPEECH_RATE.NORMAL;
      this.volume = 1.0; // 音量，范围0-1
      
      // 朗读进度和回调
      this.progress = 0;
      this.callbacks = {
        [SPEECH_EVENTS.STATUS_CHANGE]: null,
        [SPEECH_EVENTS.PROGRESS_UPDATE]: null,
        [SPEECH_EVENTS.SENTENCE_CHANGE]: null,
        [SPEECH_EVENTS.ERROR]: null
      };
      
      // 朗读中的句子索引（用于高亮显示）
      this.currentSentenceIndex = -1;
      this.sentences = [];
      
      // 句子时间段（每个句子的开始和结束时间）
      this.sentenceTimestamps = [];
      
      // 资源缓存，用于缓存已朗读的音频
      this.audioCache = {};
      
      // 当前资源类型
      this.sourceType = SPEECH_SOURCE_TYPE.NETWORK;

      this.initialized = true;
      console.log('语音服务初始化成功');
    } catch (e) {
      console.error('语音服务初始化失败:', e);
      throw e;
    }
  }

  /**
   * 初始化语音管理器
   */
  initManager() {
    try {
      // 创建语音合成管理器
      this.manager = wx.getBackgroundAudioManager();
      
      // 绑定事件
      this.bindEvents();
      
      console.log('语音管理器初始化成功');
    } catch (e) {
      console.error('语音管理器初始化失败', e);
      this.handleError('初始化失败', e);
    }
  }

  /**
   * 绑定语音事件
   */
  bindEvents() {
    if (!this.manager) return;
    
    // 播放事件
    this.manager.onPlay(() => {
      this.updateStatus(SPEECH_STATUS.SPEAKING);
      console.log('语音播放开始');
    });
    
    // 暂停事件
    this.manager.onPause(() => {
      this.updateStatus(SPEECH_STATUS.PAUSED);
      console.log('语音播放暂停');
    });
    
    // 停止事件
    this.manager.onStop(() => {
      this.updateStatus(SPEECH_STATUS.IDLE);
      this.progress = 0;
      this.updateProgress();
      this.currentSentenceIndex = -1;
      this.triggerCallback(SPEECH_EVENTS.SENTENCE_CHANGE, -1, null);
      console.log('语音播放停止');
    });
    
    // 结束事件
    this.manager.onEnded(() => {
      this.updateStatus(SPEECH_STATUS.IDLE);
      this.progress = 100;
      this.updateProgress();
      this.currentSentenceIndex = -1;
      this.triggerCallback(SPEECH_EVENTS.SENTENCE_CHANGE, -1, null);
      console.log('语音播放结束');
    });
    
    // 错误事件
    this.manager.onError((err) => {
      this.updateStatus(SPEECH_STATUS.IDLE);
      console.error('语音播放错误', err);
      
      this.handleError('播放错误', err);
      
      // 显示错误提示
      wx.showToast({
        title: '语音播放出错',
        icon: 'none',
        duration: 2000
      });
    });
    
    // 播放进度更新事件
    this.manager.onTimeUpdate(() => {
      if (this.manager.duration > 0) {
        this.progress = (this.manager.currentTime / this.manager.duration) * 100;
        this.updateProgress();
        this.updateSentenceHighlight(this.manager.currentTime);
      }
    });
    
    // 缓冲事件
    this.manager.onWaiting(() => {
      console.log('音频缓冲中...');
    });
    
    // 缓冲完成事件
    this.manager.onCanplay(() => {
      console.log('音频可以播放了');
    });
  }

  /**
   * 处理错误
   * @param {string} message - 错误消息
   * @param {Error} error - 错误对象
   */
  handleError(message, error) {
    const errorData = {
      message,
      error,
      time: new Date().toISOString()
    };
    
    console.error('语音服务错误:', errorData);
    
    this.triggerCallback(SPEECH_EVENTS.ERROR, errorData);
  }

  /**
   * 触发回调
   * @param {string} eventType - 事件类型
   * @param {...any} args - 回调参数
   */
  triggerCallback(eventType, ...args) {
    const callback = this.callbacks[eventType];
    if (callback && typeof callback === 'function') {
      callback(...args);
    }
  }

  /**
   * 更新朗读状态并触发回调
   * @param {number} newStatus - 新的语音状态
   */
  updateStatus(newStatus) {
    if (this.status === newStatus) return;
    
    this.status = newStatus;
    
    // 触发状态变化回调
    this.triggerCallback(SPEECH_EVENTS.STATUS_CHANGE, newStatus);
  }

  /**
   * 更新朗读进度并触发回调
   */
  updateProgress() {
    // 触发进度更新回调
    this.triggerCallback(SPEECH_EVENTS.PROGRESS_UPDATE, this.progress);
  }

  /**
   * 更新当前朗读的句子高亮
   * @param {number} currentTime - 当前播放时间（秒）
   */
  updateSentenceHighlight(currentTime) {
    if (!this.sentences.length || !this.sentenceTimestamps.length) return;
    
    // 寻找当前时间对应的句子
    let newIndex = -1;
    for (let i = 0; i < this.sentenceTimestamps.length; i++) {
      const [start, end] = this.sentenceTimestamps[i];
      if (currentTime >= start && currentTime <= end) {
        newIndex = i;
        break;
      }
    }
    
    // 如果找不到精确匹配，使用最接近的句子
    if (newIndex === -1 && this.sentenceTimestamps.length > 0) {
      newIndex = Math.min(
        Math.floor((currentTime / this.manager.duration) * this.sentences.length),
        this.sentences.length - 1
      );
    }
    
    // 如果句子索引有变化，触发回调
    if (newIndex !== this.currentSentenceIndex && newIndex >= 0) {
      this.currentSentenceIndex = newIndex;
      this.triggerCallback(SPEECH_EVENTS.SENTENCE_CHANGE, newIndex, this.sentences[newIndex]);
    }
  }

  /**
   * 预处理文本内容
   * @param {string} text - 原始文本
   * @returns {string} 处理后的文本
   */
  preprocessText(text) {
    if (!text) return '';
    
    // 去除多余空白字符
    let processedText = text.replace(/\s+/g, ' ').trim();
    
    // 处理特殊字符和标点符号（根据需要可添加更多规则）
    processedText = processedText.replace(/[""]/g, '"')
                                 .replace(/['']/g, "'")
                                 .replace(/…/g, '...')
                                 .replace(/—/g, '-');
    
    return processedText;
  }

  /**
   * 将文本分割成句子
   * @param {string} text - 要分割的文本
   * @returns {Array} 句子数组
   */
  splitIntoSentences(text) {
    if (!text) return [];
    
    // 更精确的分割句子（按句号、问号、感叹号等标点）
    // 中英文标点都考虑
    const sentences = text.split(/(?<=[。！？.!?;；])/g)
      .filter(s => s.trim().length > 0);
    
    return sentences;
  }

  /**
   * 估算每个句子的时间范围
   * @param {Array} sentences - 句子数组
   * @param {number} totalDuration - 总时长（秒）
   * @returns {Array} 每个句子的[起始时间,结束时间]数组
   */
  estimateSentenceTimestamps(sentences, totalDuration) {
    if (!sentences.length || totalDuration <= 0) return [];
    
    const timestamps = [];
    
    // 计算每个句子的总字符数占比
    const totalChars = sentences.reduce((sum, s) => sum + s.length, 0);
    let currentTime = 0;
    
    for (const sentence of sentences) {
      const duration = (sentence.length / totalChars) * totalDuration;
      const startTime = currentTime;
      const endTime = startTime + duration;
      
      timestamps.push([startTime, endTime]);
      currentTime = endTime;
    }
    
    return timestamps;
  }

  /**
   * 开始朗读文本
   * @param {string} text - 要朗读的文本
   * @param {Object} options - 朗读选项
   * @returns {boolean} 是否成功开始朗读
   */
  speak(text, options = {}) {
    if (!text || !this.manager) {
      this.handleError('参数错误', new Error('无效的文本或管理器未初始化'));
      return false;
    }
    
    // 停止当前朗读
    this.stop();
    
    // 预处理文本
    const processedText = this.preprocessText(text);
    
    // 保存当前文本和选项
    this.currentText = processedText;
    this.rate = options.rate || this.rate;
    this.volume = options.volume !== undefined ? options.volume : this.volume;
    
    // 分析句子（用于实时高亮）
    this.sentences = this.splitIntoSentences(processedText);
    this.currentSentenceIndex = 0;
    
    // 保存回调函数
    if (options.onProgress) {
      this.callbacks[SPEECH_EVENTS.PROGRESS_UPDATE] = options.onProgress;
    }
    
    if (options.onStatusChange) {
      this.callbacks[SPEECH_EVENTS.STATUS_CHANGE] = options.onStatusChange;
    }
    
    if (options.onSentenceChange) {
      this.callbacks[SPEECH_EVENTS.SENTENCE_CHANGE] = options.onSentenceChange;
    }
    
    if (options.onError) {
      this.callbacks[SPEECH_EVENTS.ERROR] = options.onError;
    }
    
    try {
      // 设置音频信息
      this.manager.title = options.title || '文本朗读';
      this.manager.epname = options.epname || '朗读助手';
      this.manager.singer = options.singer || '顺口成章';
      this.manager.coverImgUrl = options.coverImgUrl || 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0';
      
      // 检查缓存
      const cacheKey = `tts_${this.rate}_${processedText.substring(0, 100)}`;
      if (this.audioCache[cacheKey]) {
        console.log('使用缓存的音频');
        this.manager.src = this.audioCache[cacheKey];
        this.sourceType = SPEECH_SOURCE_TYPE.NETWORK;
      } else {
        // 使用微信同声传译API（需要小程序后端支持）
        // 在实际项目中，应该通过调用后端接口获取语音合成结果
        // 这里使用模拟的网络音频URL
        this.textToSpeech(processedText, (audioUrl) => {
          this.manager.src = audioUrl;
          this.sourceType = SPEECH_SOURCE_TYPE.SYNTHESIZED;
          
          // 缓存音频URL
          this.audioCache[cacheKey] = audioUrl;
          
          // 等待获取音频持续时间后估算句子时间戳
          const checkDuration = () => {
            if (this.manager && this.manager.duration > 0) {
              this.sentenceTimestamps = this.estimateSentenceTimestamps(
                this.sentences, 
                this.manager.duration
              );
            } else {
              // 如果还没获取到持续时间，等待一会再次检查
              setTimeout(checkDuration, 200);
            }
          };
          setTimeout(checkDuration, 500);
        });
      }
      
      this.updateStatus(SPEECH_STATUS.SPEAKING);
      return true;
    } catch (e) {
      console.error('开始朗读失败', e);
      this.handleError('朗读失败', e);
      return false;
    }
  }

  /**
   * 文字转语音处理
   * @param {string} text - 要转换的文本
   * @param {Function} callback - 回调函数，参数为音频URL
   */
  textToSpeech(text, callback) {
    if (!text) {
      console.error('文本不能为空');
      this.handleError('参数错误', new Error('文本不能为空'));
      return;
    }

    console.log('开始文字转语音：', text.substring(0, 100) + (text.length > 100 ? '...' : ''));
    
    try {
      // 检查插件是否可用
      if (!plugin || !plugin.textToSpeech) {
        throw new Error('语音插件不可用');
      }

      plugin.textToSpeech({
        lang: 'zh_CN',
        tts: true,
        content: text,
        success: (res) => {
          if (res && res.filename) {
            callback(res.filename);
          } else {
            console.error('转换结果异常', res);
            this.useBackupTTSService(text, callback);
          }
        },
        fail: (err) => {
          console.error('插件转换失败，使用备用方案', err);
          this.useBackupTTSService(text, callback);
        }
      });
    } catch (e) {
      console.error('转换过程出错', e);
      this.useBackupTTSService(text, callback);
    }
  }

  /**
   * 使用备用TTS服务
   * @param {string} text - 要转换的文本
   * @param {Function} callback - 回调函数
   */
  useBackupTTSService(text, callback) {
    // 作为后备方案，使用在线TTS服务
    // 实际项目中可以使用自己的后端提供TTS服务
    const encodedText = encodeURIComponent(text.substring(0, 300)); // 限制长度
    const rateParam = this.rate ? `&spd=${Math.round(this.rate * 5)}` : '';
    const mockAudioUrl = `https://fanyi.baidu.com/gettts?lan=zh&text=${encodedText}${rateParam}&source=web`;
    
    // 模拟网络延迟
    setTimeout(() => {
      callback(mockAudioUrl);
    }, 300);
  }

  /**
   * 暂停朗读
   * @returns {boolean} 是否成功暂停
   */
  pause() {
    if (!this.manager || this.status !== SPEECH_STATUS.SPEAKING) {
      return false;
    }
    
    try {
      this.manager.pause();
      return true;
    } catch (e) {
      console.error('暂停朗读失败', e);
      this.handleError('暂停失败', e);
      return false;
    }
  }

  /**
   * 恢复朗读
   * @returns {boolean} 是否成功恢复
   */
  resume() {
    if (!this.manager || this.status !== SPEECH_STATUS.PAUSED) {
      return false;
    }
    
    try {
      this.manager.play();
      return true;
    } catch (e) {
      console.error('恢复朗读失败', e);
      this.handleError('恢复失败', e);
      return false;
    }
  }

  /**
   * 停止朗读
   * @returns {boolean} 是否成功停止
   */
  stop() {
    if (!this.manager || this.status === SPEECH_STATUS.IDLE) {
      return false;
    }
    
    try {
      this.manager.stop();
      this.currentSentenceIndex = -1;
      return true;
    } catch (e) {
      console.error('停止朗读失败', e);
      this.handleError('停止失败', e);
      return false;
    }
  }

  /**
   * 跳转到指定句子开始朗读
   * @param {number} sentenceIndex - 句子索引
   * @returns {boolean} 是否成功跳转
   */
  jumpToSentence(sentenceIndex) {
    if (!this.manager || !this.sentences.length || 
        sentenceIndex < 0 || sentenceIndex >= this.sentences.length ||
        !this.sentenceTimestamps.length) {
      return false;
    }
    
    try {
      // 获取目标句子的起始时间
      const [startTime] = this.sentenceTimestamps[sentenceIndex];
      
      // 跳转到指定时间
      this.manager.seek(startTime);
      
      // 如果当前是暂停状态，需要恢复播放
      if (this.status === SPEECH_STATUS.PAUSED) {
        this.resume();
      }
      
      return true;
    } catch (e) {
      console.error('跳转到句子失败', e);
      this.handleError('跳转失败', e);
      return false;
    }
  }

  /**
   * 获取当前朗读状态
   * @returns {number} 朗读状态枚举值
   */
  getStatus() {
    return this.status;
  }

  /**
   * 获取当前朗读进度
   * @returns {number} 进度百分比（0-100）
   */
  getProgress() {
    return this.progress;
  }

  /**
   * 设置朗读速度
   * @param {number} rate - 朗读速度
   */
  setRate(rate) {
    if (rate <= 0) {
      console.warn('朗读速度必须大于0，已设为默认值');
      rate = SPEECH_RATE.NORMAL;
    }
    
    this.rate = rate;
    
    // 如果正在朗读，需要重新朗读才能应用新速度
    if (this.status !== SPEECH_STATUS.IDLE && this.currentText) {
      const currentStatus = this.status;
      
      // 记住当前位置
      const currentProgress = this.progress;
      const targetTime = this.manager.duration * (currentProgress / 100);
      
      // 重新开始朗读
      this.speak(this.currentText, { rate });
      
      // 尝试恢复到之前的位置
      if (this.manager && this.manager.duration > 0) {
        setTimeout(() => {
          try {
            this.manager.seek(targetTime);
            
            // 如果之前是暂停状态，继续保持暂停
            if (currentStatus === SPEECH_STATUS.PAUSED) {
              this.pause();
            }
          } catch (e) {
            console.error('恢复播放位置失败', e);
          }
        }, 500); // 给音频一些加载时间
      }
    }
  }

  /**
   * 设置朗读音量
   * @param {number} volume - 音量值（0-1）
   */
  setVolume(volume) {
    if (volume < 0) volume = 0;
    if (volume > 1) volume = 1;
    
    this.volume = volume;
    
    // 应用音量设置（如果管理器支持）
    if (this.manager && typeof this.manager.volume !== 'undefined') {
      this.manager.volume = volume;
    }
  }

  /**
   * 注册事件监听器
   * @param {string} eventType - 事件类型 (期望是 SPEECH_EVENTS 中的值)
   * @param {Function} callback - 回调函数
   */
  on(eventType, callback) {
    // 检查传入的 eventType 是否是 SPEECH_EVENTS 中定义的值
    if (Object.values(SPEECH_EVENTS).includes(eventType) && typeof callback === 'function') {
      this.callbacks[eventType] = callback;
    } else {
      // 只有在开发环境中或特定调试模式下才打印警告，避免干扰生产环境
      // console.warn(`[SpeechService] on - 无效的事件类型或回调: ${eventType}`);
    }
  }

  /**
   * 移除事件监听器
   * @param {string} eventType - 事件类型
   */
  off(eventType) {
    if (Object.values(SPEECH_EVENTS).includes(eventType)) {
      this.callbacks[eventType] = null;
    } else {
       // console.warn(`[SpeechService] off - 尝试移除无效的事件类型: ${eventType}`);
    }
  }

  /**
   * 获取当前朗读的句子索引
   * @returns {number} 句子索引，-1表示未朗读
   */
  getCurrentSentenceIndex() {
    return this.currentSentenceIndex;
  }

  /**
   * 获取分割后的句子数组
   * @returns {Array} 句子数组
   */
  getSentences() {
    return this.sentences;
  }

  /**
   * 清除语音缓存
   */
  clearCache() {
    this.audioCache = {};
    console.log('语音缓存已清除');
  }
}

// 创建并导出单例实例
const speechService = new SpeechService();
export default speechService;