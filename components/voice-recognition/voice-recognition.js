// 引入微信同声传译插件
const plugin = requirePlugin("WechatSI");

Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 最大录音时长（秒）
    maxRecordTime: {
      type: Number,
      value: 60
    },
    // 默认识别语言，可选 'zh_CN' 或 'en_US'
    defaultLang: {
      type: String,
      value: 'zh_CN'
    },
    // 是否显示语言切换按钮
    showLanguageSwitch: {
      type: Boolean,
      value: true
    },
    // 是否显示中文按钮
    showChineseOption: {
      type: Boolean,
      value: true
    },
    // 是否显示英文按钮
    showEnglishOption: {
      type: Boolean,
      value: true
    },
    // 组件标题
    title: {
      type: String,
      value: '语音识别'
    },
    // 组件副标题
    subtitle: {
      type: String,
      value: '请点击下方按钮开始录音'
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    manager: null,         // 语音识别管理器
    isRecording: false,    // 是否正在录音
    recordStatus: 'ready', // 录音状态：ready, recording, processing
    recognizedText: '',    // 识别的文本
    recordTimeCount: 0,    // 录音时长计数（秒）
    recordTimer: null,     // 录音计时器
    currentLang: 'zh_CN'   // 当前识别语言
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      // 设置默认语言
      this.setData({
        currentLang: this.properties.defaultLang
      });
      
      // 初始化语音识别
      this.initRecognition();
    },
    
    detached() {
      // 组件销毁时清理资源
      this.stopRecording();
      if (this.data.recordTimer) {
        clearInterval(this.data.recordTimer);
      }
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 初始化语音识别
     */
    initRecognition() {
      try {
        // 获取全局唯一的语音识别管理器
        const manager = plugin.getRecordRecognitionManager();
        
        // 存储管理器引用
        this.setData({ manager });
        
        // 注册事件处理函数
        this.initRecordCallbacks(manager);
        
        console.log("语音识别组件：WechatSI插件加载成功");
      } catch (error) {
        console.error("语音识别组件：加载WechatSI插件失败!", error);
        // 触发错误事件
        this.triggerEvent('error', { error: '语音识别插件初始化失败' });
      }
    },
    
    /**
     * 初始化语音识别回调
     */
    initRecordCallbacks(manager) {
      if (!manager) return;
      
      // 录音开始事件
      manager.onStart = (res) => {
        console.log("语音识别组件：录音开始", res);
      };
      
      // 有新的识别内容返回时的事件
      manager.onRecognize = (res) => {
        console.log("语音识别组件：中间识别结果", res.result);
        this.setData({
          recognizedText: res.result
        });
        
        // 触发实时识别事件
        this.triggerEvent('recognizing', { text: res.result });
      };
      
      // 识别结束事件
      manager.onStop = (res) => {
        console.log("语音识别组件：最终识别结果", res.result);
        console.log("语音识别组件：录音临时文件地址", res.tempFilePath);
        
        // 清理计时器
        if (this.data.recordTimer) {
          clearInterval(this.data.recordTimer);
          this.setData({
            recordTimer: null
          });
        }
        
        // 更新状态
        this.setData({
          recognizedText: res.result || '未能识别到有效语音',
          isRecording: false,
          recordStatus: 'ready'
        });
        
        // 触发识别完成事件
        this.triggerEvent('result', { 
          text: res.result || '',
          tempFilePath: res.tempFilePath || '',
          duration: this.data.recordTimeCount,
          language: this.data.currentLang
        });
      };
      
      // 识别错误事件
      manager.onError = (res) => {
        console.error("语音识别组件：识别错误", res);
        
        // 清理计时器
        if (this.data.recordTimer) {
          clearInterval(this.data.recordTimer);
          this.setData({
            recordTimer: null
          });
        }
        
        // 更新状态
        this.setData({
          isRecording: false,
          recordStatus: 'ready'
        });
        
        // 触发错误事件
        this.triggerEvent('error', { error: res.msg || '识别出错' });
      };
    },
    
    /**
     * 检查录音权限
     */
    checkRecordPermission() {
      return new Promise((resolve, reject) => {
        wx.authorize({
          scope: 'scope.record',
          success: () => {
            console.log('语音识别组件：已获取录音权限');
            resolve();
          },
          fail: () => {
            console.error('语音识别组件：未获取录音权限');
            
            wx.showModal({
              title: '提示',
              content: '需要录音权限才能使用语音识别功能',
              confirmText: '去设置',
              success: (res) => {
                if (res.confirm) {
                  wx.openSetting();
                }
                reject(new Error('未获取录音权限'));
              }
            });
          }
        });
      });
    },
    
    /**
     * 切换录音状态（开始/停止）
     */
    toggleRecording() {
      if (this.data.isRecording) {
        this.stopRecording();
      } else {
        // 检查权限，以防用户中途取消
        wx.getSetting({
          success: (res) => {
            if (!res.authSetting['scope.record']) {
              this.checkRecordPermission()
                .then(() => this.startRecording())
                .catch(err => console.error('权限检查失败:', err));
            } else {
              this.startRecording();
            }
          }
        });
      }
    },
    
    /**
     * 开始录音
     */
    startRecording() {
      const manager = this.data.manager;
      
      if (this.data.isRecording || !manager) {
        console.warn("语音识别组件：正在录音或manager未初始化，无法开始");
        return;
      }
      
      console.log('语音识别组件：开始录音和识别');
      
      // 更新状态
      this.setData({
        isRecording: true,
        recordStatus: 'recording',
        recognizedText: '', // 清空上次结果
        recordTimeCount: 0
      });
      
      // 显示加载提示
      wx.showLoading({ title: '正在录音...' });
      
      try {
        // 开始录音识别
        manager.start({
          lang: this.data.currentLang,
          duration: this.properties.maxRecordTime * 1000,
          sampleRate: 16000,
          numberOfChannels: 1,
          encodeBitRate: 48000,
          format: 'mp3'
        });
        
        console.log('语音识别组件：录音识别已启动');
        
        // 触发开始录音事件
        this.triggerEvent('start', { language: this.data.currentLang });
        
        // 开始计时
        if (this.data.recordTimer) clearInterval(this.data.recordTimer);
        
        const recordTimer = setInterval(() => {
          let timeCount = this.data.recordTimeCount + 1;
          this.setData({ recordTimeCount: timeCount });
          
          // 如果达到最大时长，自动停止
          if (timeCount >= this.properties.maxRecordTime) {
            this.stopRecording();
          }
        }, 1000);
        
        this.setData({ recordTimer });
      } catch (error) {
        console.error("语音识别组件：启动录音失败", error);
        wx.hideLoading();
        
        this.setData({
          isRecording: false,
          recordStatus: 'ready'
        });
        
        // 触发错误事件
        this.triggerEvent('error', { error: '启动录音失败' });
      }
    },
    
    /**
     * 停止录音
     */
    stopRecording() {
      const manager = this.data.manager;
      
      wx.hideLoading(); // 确保loading隐藏
      
      try {
        if (this.data.isRecording && manager) {
          console.log('语音识别组件：停止录音');
          manager.stop();
          
          // 状态会在onStop回调中更新，这里不需要设置
          this.setData({
            recordStatus: 'processing'
          });
          
          // 触发停止录音事件
          this.triggerEvent('stop');
        }
      } catch (error) {
        console.error("语音识别组件：停止录音出错", error);
        
        // 清理计时器
        if (this.data.recordTimer) {
          clearInterval(this.data.recordTimer);
          this.setData({
            recordTimer: null,
            isRecording: false,
            recordStatus: 'ready'
          });
        }
        
        // 触发错误事件
        this.triggerEvent('error', { error: '停止录音失败' });
      }
    },
    
    /**
     * 清空识别结果
     */
    clearResult() {
      this.setData({
        recognizedText: ''
      });
      
      // 触发清空事件
      this.triggerEvent('clear');
    },
    
    /**
     * 切换识别语言
     */
    switchLanguage(e) {
      const newLang = e.currentTarget.dataset.lang;
      
      if (newLang && newLang !== this.data.currentLang) {
        // 如果正在录音，先停止
        if (this.data.isRecording) {
          this.stopRecording();
        }
        
        this.setData({
          currentLang: newLang,
          recognizedText: '' // 清空上次结果
        });
        
        console.log('语音识别组件：切换识别语言为:', newLang);
        
        // 触发语言切换事件
        this.triggerEvent('languageChange', { language: newLang });
      }
    }
  }
}) 