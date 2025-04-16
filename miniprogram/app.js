// 导入语音服务
import speechService from './services/speech.service'

App({
  globalData: {
    userInfo: null,
    isReady: false,
    initPromise: null
  },

  onLaunch: function() {
    console.log('App onLaunch')
    
    // 初始化语音服务
    const self = this
    this.globalData.initPromise = new Promise((resolve) => {
      try {
        // 初始化语音服务
        speechService.init()
        console.log('语音服务初始化成功')
        self.globalData.isReady = true
        resolve()
      } catch (error) {
        console.error('语音服务初始化失败', error)
        self.globalData.isReady = true  // 即使失败也标记为已准备好，避免阻塞
        resolve()
      }
    })
  },

  // 获取语音服务
  getSpeechService: function() {
    return speechService
  },
  
  // 等待应用准备好
  waitForReady: function() {
    return new Promise((resolve) => {
      if (this.globalData.isReady) {
        // 如果已经准备好，直接返回true
        resolve(true);
      } else if (this.globalData.initPromise) {
        // 等待初始化Promise完成后返回true
        this.globalData.initPromise.then(() => {
          resolve(true);
        }).catch(() => {
          // 即使失败也返回true，避免阻塞
          resolve(true);
        });
      } else {
        // 没有初始化Promise也返回true，避免阻塞
        resolve(true);
      }
    });
  }
}) 