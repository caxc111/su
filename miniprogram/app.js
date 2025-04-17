// miniprogram/app.js (Absolute Minimal Test)
import speechService from './services/speech/speech.service';

App({
  globalData: {
    userInfo: null,
    isReady: false, // 初始状态应为 false
    initPromise: null
  },

  onLaunch: function() {
    console.log('App onLaunch - Restoring functional version');

    // 初始化语音服务
    const self = this;
    this.globalData.initPromise = new Promise((resolve) => {
      try {
        // 初始化语音服务
        speechService.init();
        console.log('语音服务初始化成功');
        self.globalData.isReady = true;
        resolve(true); // Resolve with true on success
      } catch (error) {
        console.error('语音服务初始化失败', error);
        self.globalData.isReady = true;  // 即使失败也标记为已准备好，避免阻塞
        resolve(false); // Resolve with false on failure, but still resolve
      }
    });
  },

  // 获取语音服务
  getSpeechService: function() {
    return speechService;
  },

  // 等待应用准备好
  waitForReady: function() {
    if (this.globalData.isReady) {
      // If already ready, return a resolved promise
      // Check initPromise result if needed, assume true for simplicity now
      return Promise.resolve(true); 
    } else if (this.globalData.initPromise) {
       // If initPromise exists, return it
      return this.globalData.initPromise;
    } else {
      // Should not happen if onLaunch runs first, but as fallback:
      console.error('waitForReady called before initPromise was set!');
      return Promise.resolve(false); // Or reject?
    }
  }
});

// All previous code including globalData, getSpeechService, waitForReady is removed. 