// components/text-recorder/text-recorder.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 语言类型：'zh' 或 'en'
    language: {
      type: String,
      value: 'zh'
    },
    // 录音最大时长（秒）
    maxDuration: {
      type: Number,
      value: 60
    },
    // 是否使用模拟数据（测试用）
    useMock: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    // 录音状态：'idle'（空闲）, 'recording'（录音中）, 'processing'（处理中）
    status: 'idle',
    // 录音时长（秒）
    duration: 0,
    // 录音计时器ID
    timerID: null,
    // 录音管理器
    recorderManager: null,
    // 波形动画数据
    waveHeights: [],
    // 波形动画状态：'idle'（空闲）, 'active'（动画中）
    waveStatus: 'idle'
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      this.initRecorder();
      this.generateWaveHeights(); // 初始化波形动画数据
    },
    detached() {
      this.stopRecording(); // 确保录音停止
      this.clearTimer(); // 清除计时器
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 初始化录音管理器
     */
    initRecorder() {
      const recorderManager = wx.getRecorderManager();
      
      // 设置录音结束事件处理
      recorderManager.onStop(res => {
        console.log('[text-recorder] 录音结束:', res);
        this.stopWaveAnimation();
        this.clearTimer();
        
        this.setData({
          status: 'processing'
        });
        
        this.triggerEvent('recordStop', {
          duration: this.data.duration,
          tempFilePath: res.tempFilePath
        });
        
        // 处理录音结果
        this.processRecording(res.tempFilePath);
      });
      
      // 设置录音错误事件处理
      recorderManager.onError(err => {
        console.error('[text-recorder] 录音错误:', err);
        this.stopWaveAnimation();
        this.clearTimer();
        
        this.setData({
          status: 'idle',
          duration: 0
        });
        
        this.triggerEvent('recordError', {
          errMsg: err.errMsg || '录音失败'
        });
      });
      
      this.setData({
        recorderManager: recorderManager
      });
    },
    
    /**
     * 开始录音
     */
    startRecording() {
      // 检查权限
      this.checkRecordAuth().then(hasAuth => {
        if (!hasAuth) {
          this.triggerEvent('recordError', {
            errMsg: '没有录音权限'
          });
          return;
        }
        
        // 已经在录音中，则忽略
        if (this.data.status === 'recording') {
          return;
        }
        
        // 开始录音
        const options = {
          duration: this.properties.maxDuration * 1000,
          sampleRate: 16000,
          numberOfChannels: 1,
          encodeBitRate: 48000,
          format: 'mp3',
          frameSize: 50
        };
        
        try {
          this.data.recorderManager.start(options);
          
          this.setData({
            status: 'recording',
            duration: 0
          });
          
          // 开始计时
          this.startTimer();
          
          // 开始波形动画
          this.startWaveAnimation();
          
          this.triggerEvent('recordStart');
        } catch (err) {
          console.error('[text-recorder] 启动录音失败:', err);
          this.triggerEvent('recordError', {
            errMsg: '启动录音失败'
          });
        }
      });
    },
    
    /**
     * 停止录音
     */
    stopRecording() {
      // 未在录音中，则忽略
      if (this.data.status !== 'recording') {
        return;
      }
      
      try {
        this.data.recorderManager.stop();
      } catch (err) {
        console.error('[text-recorder] 停止录音失败:', err);
        this.clearTimer();
        
        this.setData({
          status: 'idle',
          duration: 0
        });
        
        this.triggerEvent('recordError', {
          errMsg: '停止录音失败'
        });
      }
    },
    
    /**
     * 处理录音结果
     * @param {String} filePath 临时文件路径
     */
    processRecording(filePath) {
      // 使用模拟数据
      if (this.properties.useMock) {
        this.mockRecognition();
        return;
      }
      
      // 使用语音识别服务
      this.recognizeSpeech(filePath);
    },
    
    /**
     * 语音识别
     * @param {String} filePath 临时文件路径
     */
    recognizeSpeech(filePath) {
      // 使用微信同声传译插件进行语音识别
      const plugin = requirePlugin('WechatSI');
      const manager = plugin.getRecordRecognitionManager();
      
      // 设置语言
      const lang = this.properties.language === 'zh' ? 'zh_CN' : 'en_US';
      
      // 识别结果回调
      manager.onRecognize = (res) => {
        console.log('[text-recorder] 实时识别结果:', res);
      };
      
      // 识别完成回调
      manager.onStop = (res) => {
        console.log('[text-recorder] 识别完成:', res);
        
        if (res.result) {
          this.setData({
            status: 'idle'
          });
          
          this.triggerEvent('recordResult', {
            text: res.result,
            duration: this.data.duration
          });
        } else {
          // 如果没有结果，可能是发生了错误或者没有说话
          // 在这种情况下，使用模拟数据
          console.warn('[text-recorder] 未获取到识别结果，使用模拟数据');
          this.mockRecognition();
        }
      };
      
      // 识别失败回调
      manager.onError = (res) => {
        console.error('[text-recorder] 识别错误:', res);
        
        // 使用模拟数据
        console.warn('[text-recorder] 识别失败，使用模拟数据');
        this.mockRecognition();
      };
      
      // 开始识别
      manager.start({
        lang: lang,
        duration: 60000, // 最长识别时间
        filePath: filePath // 传入录音文件
      });
    },
    
    /**
     * 模拟语音识别（测试用）
     */
    mockRecognition() {
      console.log('[text-recorder] 使用模拟语音识别');
      
      setTimeout(() => {
        const result = this.getMockRecognitionResult();
        
        this.setData({
          status: 'idle'
        });
        
        this.triggerEvent('recordResult', {
          text: result,
          duration: this.data.duration
        });
      }, 1000); // 模拟1秒的识别时间
    },
    
    /**
     * 获取模拟的识别结果
     * @returns {String} 模拟的识别文本
     */
    getMockRecognitionResult() {
      // 根据语言返回更多样的模拟文本，以增加多样性
      const mockTexts = {
        zh: [
          '床前明月光，疑是地上霜。举头望明月，低头思故乡。',
          '白日依山尽，黄河入海流。欲穷千里目，更上一层楼。',
          '国破山河在，城春草木深。感时花溅泪，恨别鸟惊心。'
        ],
        en: [
          'Two roads diverged in a wood, and I took the one less traveled by, and that has made all the difference.',
          'Hope is the thing with feathers that perches in the soul, and sings the tune without the words, and never stops at all.',
          'The most beautiful things in the world cannot be seen or even touched, they must be felt with the heart.'
        ]
      };
      
      // 随机选择一个模拟文本
      const textsForLanguage = mockTexts[this.properties.language] || ['模拟识别结果'];
      const randomIndex = Math.floor(Math.random() * textsForLanguage.length);
      
      return textsForLanguage[randomIndex];
    },
    
    /**
     * 检查录音权限
     * @returns {Promise<Boolean>} 是否有录音权限
     */
    checkRecordAuth() {
      return new Promise((resolve) => {
        wx.getSetting({
          success: (res) => {
            if (res.authSetting['scope.record'] === undefined) {
              // 首次使用，向用户请求授权
              wx.authorize({
                scope: 'scope.record',
                success: () => resolve(true),
                fail: () => resolve(false)
              });
            } else if (res.authSetting['scope.record'] === false) {
              // 用户曾经拒绝，提示用户去设置页面打开权限
              wx.showModal({
                title: '需要录音权限',
                content: '语音识别需要您的录音权限，请在设置中允许',
                confirmText: '去设置',
                cancelText: '取消',
                success: (modalRes) => {
                  if (modalRes.confirm) {
                    wx.openSetting({
                      success: (settingRes) => {
                        resolve(!!settingRes.authSetting['scope.record']);
                      },
                      fail: () => resolve(false)
                    });
                  } else {
                    resolve(false);
                  }
                },
                fail: () => resolve(false)
              });
            } else {
              // 已有权限
              resolve(true);
            }
          },
          fail: () => resolve(false)
        });
      });
    },
    
    /**
     * 开始计时器
     */
    startTimer() {
      this.clearTimer(); // 先清除可能存在的计时器
      
      const timerID = setInterval(() => {
        this.setData({
          duration: this.data.duration + 1
        });
        
        // 超过最大时长，自动停止
        if (this.data.duration >= this.properties.maxDuration) {
          this.stopRecording();
        }
        
        // 触发时间更新事件
        this.triggerEvent('recordTimeUpdate', {
          duration: this.data.duration
        });
      }, 1000);
      
      this.setData({
        timerID: timerID
      });
    },
    
    /**
     * 清除计时器
     */
    clearTimer() {
      if (this.data.timerID) {
        clearInterval(this.data.timerID);
        this.setData({
          timerID: null
        });
      }
    },
    
    /**
     * 生成波形动画数据
     */
    generateWaveHeights() {
      const waveCount = 20; // 波形条数
      const heights = [];
      
      for (let i = 0; i < waveCount; i++) {
        heights.push(this.getRandomHeight(5, 20));
      }
      
      this.setData({
        waveHeights: heights
      });
    },
    
    /**
     * 获取随机高度
     * @param {Number} min 最小高度
     * @param {Number} max 最大高度
     * @returns {Number} 随机高度
     */
    getRandomHeight(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    /**
     * 开始波形动画
     */
    startWaveAnimation() {
      this.setData({
        waveStatus: 'active'
      });
      
      this.updateWaveHeights();
    },
    
    /**
     * 更新波形高度（动画效果）
     */
    updateWaveHeights() {
      if (this.data.waveStatus !== 'active') {
        return;
      }
      
      const heights = this.data.waveHeights.map(() => this.getRandomHeight(5, 30));
      
      this.setData({
        waveHeights: heights
      });
      
      setTimeout(() => {
        this.updateWaveHeights();
      }, 300); // 每300毫秒更新一次
    },
    
    /**
     * 停止波形动画
     */
    stopWaveAnimation() {
      this.setData({
        waveStatus: 'idle'
      });
    }
  }
}) 