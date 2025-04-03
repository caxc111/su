// pages/voice-test/voice-test.js
// 引入微信同声传译插件
const plugin = requirePlugin("WechatSI");
// 获取全局唯一的语音识别管理器 recordRecoManager
const manager = plugin.getRecordRecognitionManager();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    isRecording: false,     // 是否正在录音
    recordStatus: 'ready',  // 录音状态：ready, recording, processing
    recognizedText: '',     // 识别的文本
    recordTimeCount: 0,     // 录音时长计数（秒）
    maxRecordTime: 60,      // 最大录音时长（秒）
    currentLang: 'zh_CN',    // 默认中文识别
    languages: [
        { code: 'zh_CN', name: '中文' },
        { code: 'en_US', name: 'English' }
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('语音测试页面加载');
    this.checkRecordPermission();
    // this.initRecord(); // <--- 原来的调用可能在这里

    // 在 onLoad 中尝试加载插件和管理器
    try {
      // 如果文件顶部有 const plugin = ..., const manager = ...，可以保留或注释掉
      // 但这里我们用 this.plugin 和 this.manager
      this.plugin = requirePlugin("WechatSI");
      this.manager = this.plugin.getRecordRecognitionManager();
      console.log("语音测试页面：WechatSI 插件加载成功");
      console.log('[onLoad] this.manager 对象:', this.manager);
      this.initRecord(); // <--- 移到 try 内部
    } catch (error) {
      console.error("语音测试页面：加载 WechatSI 插件失败!", error);
      console.error('[onLoad] 加载插件失败，this.manager 未赋值');
      // 可以添加错误提示
      wx.showToast({title:'语音功能加载失败', icon:'none'})
      // ... 可能需要阻止后续操作 ...
    }
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    // 确保在页面卸载时停止录音
    if (this.data.isRecording) {
      this.stopRecording();
    }
    // 清除计时器
    if (this.recordTimer) {
      clearInterval(this.recordTimer);
      this.recordTimer = null;
    }
    // 停止识别任务
    if (manager) {
        manager.stop();
    }
  },

  /**
   * 检查录音权限
   */
  checkRecordPermission() {
    wx.authorize({
      scope: 'scope.record',
      success: () => {
        console.log('已获取录音权限');
      },
      fail: () => {
        console.error('未获取录音权限');
        wx.showModal({
          title: '提示',
          content: '需要录音权限才能使用语音测试功能',
          confirmText: '去设置',
          success: (res) => {
            if (res.confirm) {
              wx.openSetting();
            }
          }
        });
      }
    });
  },

  /**
   * 初始化识别回调
   */
  initRecord() {
    if (!this.manager) { /* ... */ return; }
    this.manager.onStart = (res) => {
      console.log("录音插件已启动", res);
      // 可以在这里加一些UI提示，但主要逻辑已在startRecording中处理
    }
    // 有新的识别内容返回，则会调用此事件
    this.manager.onRecognize = (res) => {
      console.log("中间识别结果", res.result);
      this.setData({
        recognizedText: res.result,
      });
    }
    // 识别结束事件
    this.manager.onStop = (res) => {
      console.log("最终识别结果", res.result);
      console.log("录音临时文件地址", res.tempFilePath);
      wx.hideLoading();
      this.setData({
        recognizedText: res.result || '未能识别到有效语音',
        isRecording: false,
        recordStatus: 'ready',
        recordTimer: null
      });
      if (this.recordTimer) {
          clearInterval(this.recordTimer);
          this.recordTimer = null;
      }
    }
    // 识别错误事件
    this.manager.onError = (res) => {
        console.error("语音识别错误", res);
        wx.hideLoading();
        wx.showToast({
            title: '识别错误: ' + res.msg,
            icon: 'none'
        });
        this.setData({
            isRecording: false,
            recordStatus: 'ready',
            recordTimer: null
        });
        if (this.recordTimer) {
            clearInterval(this.recordTimer);
            this.recordTimer = null;
        }
    }
  },

  /**
   * 开始/停止录音
   */
  toggleRecording() {
    if (this.data.isRecording) {
      this.stopRecording();
    } else {
      // 检查权限，以防用户中途取消
      wx.getSetting({
        success: (res) => {
          if (!res.authSetting['scope.record']) {
            this.checkRecordPermission(); // 引导用户重新授权
          } else {
            this.startRecording();
          }
        }
      })
    }
  },

  /**
   * 开始录音
   */
  startRecording() {
    if (this.data.isRecording || !this.manager) { // 增加 !this.manager 判断
        console.warn("正在录音或 manager 未初始化，无法开始");
        return;
    }
    console.log('开始录音和识别');
    this.setData({
        isRecording: true,
        recordStatus: 'recording',
        recognizedText: '', // 清空上次结果
        recordTimeCount: 0
    });

    wx.showLoading({ title: '正在录音...' });

    // 开始识别 (恢复完整参数)
    try { // 添加 try...catch 以防 start 本身报错
        this.manager.start({ // <--- 确保是 this.manager
            lang: this.data.currentLang,
            duration: this.data.maxRecordTime * 1000, // <--- 取消注释
            sampleRate: 16000,                     // <--- 取消注释
            numberOfChannels: 1,                   // <--- 取消注释
            encodeBitRate: 48000,                    // <--- 取消注释
            format: 'mp3'                          // <--- 取消注释
        });
        console.log('语音测试：manager.start 已调用 (完整参数)');

        // 开始计时
        if (this.recordTimer) clearInterval(this.recordTimer); // 清理旧计时器
        this.recordTimer = setInterval(() => {
            let timeCount = this.data.recordTimeCount + 1;
            this.setData({ recordTimeCount: timeCount });
            // 不再需要手动停止逻辑
        }, 1000);
        // 注意：这里没有 this.setData({ recordTimer: this.recordTimer })，可能导致计时器无法清除，建议加上
        this.setData({ recordTimer: this.recordTimer }); // <--- 建议加上

    } catch(error) {
        console.error("语音测试：调用 manager.start 失败", error);
        wx.hideLoading();
        wx.showToast({title:'启动录音失败', icon:'none'});
        this.setData({ isRecording: false, recordStatus: 'ready' });
        if(this.recordTimer) clearInterval(this.recordTimer); // 清理计时器
    }
  },
  
  /**
   * 停止录音
   */
  stopRecording() {
    console.log('[voice-test stopRecording] 函数被调用'); // 添加日志区分
    wx.hideLoading(); // 确保loading隐藏
    try { // 添加 try...catch
        if (this.data.isRecording && this.manager) { // <--- 确保是 this.manager
           console.log('[voice-test stopRecording] 条件满足，调用 this.manager.stop()');
           this.manager.stop(); // <--- 确保是 this.manager
           console.log('[voice-test stopRecording] 已调用 this.manager.stop()');
        } else {
           console.warn('[voice-test stopRecording] 未调用 stop，原因:',
               '状态:', this.data.recordStatus, 'manager:', !!this.manager);
        }
        // 统一在这里清理计时器和重置状态可能更清晰
        if (this.recordTimer) {
            clearInterval(this.recordTimer);
            this.recordTimer = null; // 清引用
        }
        this.setData({
            isRecording: false,
            // 状态交给 onStop/onError 处理，这里不再强制设为 processing 或 ready
            // recordStatus: 'processing' 
            recordTimer: null // 确保 data 里的引用也清掉
        });

    } catch(error) {
        console.error("[voice-test stopRecording] 调用 stop 出错:", error);
        if (this.recordTimer) { clearInterval(this.recordTimer); this.recordTimer = null; }
        this.setData({ isRecording: false, recordStatus: 'ready', recordTimer: null });
    }
  },
  
  /**
   * 清空识别结果
   */
  clearResult() {
    this.setData({
      recognizedText: ''
    });
  },
  
  /**
   * 返回上一页
   */
  goBack() {
    wx.navigateBack();
  },

  // 添加：切换识别语言
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
          console.log('切换识别语言为:', newLang);
          wx.showToast({
            title: `已切换到${newLang === 'zh_CN' ? '中文' : '英文'}识别`,
            icon: 'none',
            duration: 1000
          })
      }
  }
}) 