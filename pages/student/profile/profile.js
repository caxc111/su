// pages/student/profile/profile.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: {
      nickname: '未登录用户',
      avatar: '/images/default-avatar.png',
      level: '初学者',
      studyDays: 0,
      totalArticles: 0,
      totalTime: 0
    },
    rewards: [],
    totalFlowers: 0,     // 总的小红花数量
    showFireworks: false, // 是否显示烟花动画
    fireworks: [],       // 烟花数组
    fireworksStopped: false, // 标记金币是否已静止
    isLoading: true,
    hasUserInfo: false,
    inviteCode: '0L3L',
    assistValue: 0,
    fadeIntervals: [],
    lastTapTime: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 尝试加载用户信息
    this.loadUserData();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    // 页面渲染完成
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 每次页面显示时刷新数据
    this.loadUserData();
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    // 页面隐藏
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    // 页面卸载
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    // 下拉刷新，重新加载数据
    this.loadUserData(() => {
      wx.stopPullDownRefresh();
    });
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    // 上拉加载更多奖励
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '顺口成章 - 提升口语表达能力',
      path: '/pages/index/index'
    }
  },

  // 加载用户数据
  loadUserData(callback) {
    this.setData({ isLoading: true });
    
    // 获取应用实例
    const app = getApp();
    
    // 设置模拟数据
    setTimeout(() => {
      // 获取阅读记录数量
      const totalArticles = app.globalData.readingRecords ? app.globalData.readingRecords.length : 0;
      
      // 获取总学习时间
      let totalTime = 0;
      if (app.globalData.readingRecords && app.globalData.readingRecords.length > 0) {
        totalTime = app.globalData.readingRecords.reduce((total, record) => total + (record.duration || 0), 0);
      }
      
      // 获取奖励
      const rewards = app.globalData.rewards || [];
      
      // 计算总的小红花数量
      const totalFlowers = this.calculateTotalFlowers(app.globalData.readingRecords || []);
      
      this.setData({
        userInfo: {
          nickname: '顺口用户',
          avatar: '/images/default-avatar.png',
          level: this.calculateLevel(totalArticles),
          studyDays: Math.min(30, totalArticles + 5), // 模拟学习天数
          totalArticles: totalArticles,
          totalTime: Math.floor(totalTime / 60) // 转换为分钟
        },
        rewards: rewards,
        totalFlowers: totalFlowers,
        isLoading: false,
        hasUserInfo: true
      });
      
      if (callback) callback();
    }, 500);
  },
  
  // 计算总的小红花数量
  calculateTotalFlowers(records) {
    let total = 0;
    records.forEach(record => {
      if (record.score >= 95) {
        total += 3;
      } else if (record.score >= 85) {
        total += 2;
      } else if (record.score >= 75) {
        total += 1;
      }
    });
    return total;
  },
  
  // 根据练习文章数计算用户等级
  calculateLevel(articlesCount) {
    if (articlesCount >= 50) return '大师级';
    if (articlesCount >= 30) return '高级';
    if (articlesCount >= 15) return '中级';
    if (articlesCount >= 5) return '初级';
    return '初学者';
  },
  
  // 获取用户信息
  getUserProfile() {
    wx.showToast({
      title: '登录功能暂未开放',
      icon: 'none'
    });
  },
  
  // 清除缓存
  clearCache() {
    wx.showModal({
      title: '确认清除',
      content: '这将清除所有本地数据，是否继续？',
      success: (res) => {
        if (res.confirm) {
          try {
            wx.clearStorageSync();
            wx.showToast({
              title: '缓存已清除',
              icon: 'success'
            });
            
            // 重置全局数据
            const app = getApp();
            app.globalData.articles = [];
            app.globalData.readingRecords = [];
            
            // 重新初始化数据
            app.initSampleData(true);
            
            // 刷新页面数据
            this.loadUserData();
          } catch (e) {
            wx.showToast({
              title: '清除失败',
              icon: 'none'
            });
          }
        }
      }
    });
  },
  
  // 关于我们
  showAbout() {
    wx.showModal({
      title: '关于顺口成章',
      content: '顺口成章是一款帮助用户提升口语表达能力的小程序。通过朗读和背诵练习，培养流利自然的语言表达。\n\n版本: 1.0.0',
      showCancel: false
    });
  },
  
  // 重启小程序
  restartApp() {
    // 获取应用实例
    const app = getApp();
    if (app && app.restartApp) {
      app.restartApp();
    }
  },

  // 显示烟花动画（现在是金币下落效果）
  showFlowerAnimation() {
    // 更多的金币，更好的视觉效果
    const count = Math.floor(Math.random() * 30) + 80; // 80-110个金币，再次大幅增加数量
    const fireworks = [];
    
    // 获取屏幕宽度和高度，用于随机分布
    const systemInfo = wx.getSystemInfoSync();
    const screenWidth = systemInfo.windowWidth;
    const screenHeight = systemInfo.windowHeight;
    
    // 从上方掉落的金币生成 - 确保覆盖整个屏幕宽度
    for (let i = 0; i < count; i++) {
      // 确保金币均匀分布在整个屏幕宽度上
      const section = screenWidth / 8;
      const sectionIndex = i % 8;
      const xPosMin = section * sectionIndex;
      const xPosMax = section * (sectionIndex + 1);
      const xPos = Math.floor(Math.random() * (xPosMax - xPosMin)) + xPosMin;
      
      fireworks.push({
        id: i,
        // 随机起始位置，确保高度充分错开
        top: -Math.floor(Math.random() * 1500) - 50, // -50到-1550之间随机高度，更大的高度范围确保金币下落时间错开
        left: xPos, // 均匀分布的水平位置
        type: Math.floor(Math.random() * 3) + 1, // 1-3种图片类型，使用firework1.png, firework2.png, firework3.png
        // 每个金币的自然下落参数
        fallSpeed: Math.floor(Math.random() * 3) + 2, // 2-4的初始速度，速度更多样化
        rotation: Math.floor(Math.random() * 360), // 初始旋转角度
        rotationSpeed: (Math.random() * 2 - 1) * 3, // 旋转速度，可正可负
        horizontalMove: (Math.random() * 6 - 3), // 横向漂移范围，-3到3之间
        horizontalWave: {
          amplitude: Math.random() * 2 + 0.5, // 横向波动幅度
          frequency: Math.random() * 0.05 + 0.01, // 横向波动频率
          phase: Math.random() * Math.PI * 2 // 随机相位
        },
        scale: 0.7 + Math.random() * 0.5, // 调整随机大小，0.7-1.2，提高最小尺寸
        landed: false, // 是否已经落地
        landingPosition: screenHeight - 20 - Math.random() * 50, // 落地位置在屏幕底部20-70像素范围内，形成堆叠效果
        hasBounced: false // 新增金币是否已弹跳
      });
    }
    
    // 添加中央烟花效果
    const centerFirework = {
      id: 'center-firework',
      top: screenHeight / 2 - 80, // 调整居中位置
      left: screenWidth / 2 - 80, // 调整居中位置
      type: 0, // 使用firework0.png作为中央烟花
      rotation: 0,
      scale: 1.2, // 初始大小更小，便于平滑放大
      isCenter: true, // 标记为中央烟花
      opacity: 0, // 初始透明
      animationStep: 0, // 动画步骤
      delay: 500, // 延迟时间
      maxScale: 2.0 // 最大缩放比例
    };
    
    // 添加第二朵烟花，位置和大小不同
    const centerFirework2 = {
      id: 'center-firework-2',
      top: screenHeight / 2 - 150, // 靠屏幕上方
      left: screenWidth / 3 - 60, // 靠屏幕左侧
      type: 0, // 使用firework0.png
      rotation: 15, // 略微旋转
      scale: 1.0, // 初始更小
      isCenter: true, // 标记为中央烟花
      opacity: 0, // 初始透明
      animationStep: 0, // 动画步骤
      delay: 800, // 延迟出现
      maxScale: 1.8 // 最大缩放比例
    };
    
    // 添加第三朵烟花，位置和大小不同
    const centerFirework3 = {
      id: 'center-firework-3',
      top: screenHeight / 3 * 2 - 70, // 靠屏幕下方
      left: screenWidth / 3 * 2 - 60, // 靠屏幕右侧
      type: 0, // 使用firework0.png
      rotation: -10, // 略微旋转
      scale: 0.8, // 初始更小
      isCenter: true, // 标记为中央烟花
      opacity: 0, // 初始透明
      animationStep: 0, // 动画步骤
      delay: 1100, // 延迟出现
      maxScale: 1.6 // 最大缩放比例
    };
    
    fireworks.push(centerFirework);
    fireworks.push(centerFirework2);
    fireworks.push(centerFirework3);
    
    this.setData({
      showFireworks: true,
      fireworks: fireworks
    });
    
    // 播放烟花音效 (mp3)
    const fireworkSound = wx.createInnerAudioContext();
    fireworkSound.src = '/audio/firework.mp3';
    fireworkSound.play();
    this.fireworkSound = fireworkSound;
    
    // 播放金币音效 (wav)
    const coinSound = wx.createInnerAudioContext();
    coinSound.src = '/audio/firework.wav';
    coinSound.play();
    this.coinSound = coinSound;
    
    // 金币下落动画
    let animationFrameId;
    let animationTime = 0;
    
    // 中央烟花效果初始化 - 使用已有变量避免重复声明
    this.fadeIntervals = this.fadeIntervals || [];
    
    for (let i = 0; i < fireworks.length; i++) {
      const fireObj = fireworks[i];
      
      if (fireObj && fireObj.isCenter) {
        // 初始设置为透明
        fireObj.opacity = 0;
        
        // 为每朵烟花创建独立的动画
        ((firework) => {
          const delayTimer = setTimeout(() => {
            // 逐步显示并放大
            let growStep = 0;
            const growInterval = setInterval(() => {
              growStep += 1;
              firework.opacity = Math.min(1, growStep / 5); // 5步完成淡入
              
              // 根据烟花的maxScale属性决定最大放大比例，默认为2.0
              const maxScale = firework.maxScale || 2.0;
              firework.scale = firework.scale + (growStep * (maxScale - firework.scale) / 5);
              
              this.setData({
                fireworks
              });
              
              if (growStep >= 5) {
                clearInterval(growInterval);
              }
            }, 100);
            
            // 将淡入定时器保存到fadeIntervals数组中
            this.fadeIntervals.push(growInterval);
            
            // 淡出效果
            const fadeOutTimer = setTimeout(() => {
              // 创建渐变消失效果，每100ms更新一次透明度
              let fadeOutStep = 10; // 10步完成淡出
              const fadeInterval = setInterval(() => {
                fadeOutStep -= 1;
                firework.opacity = fadeOutStep / 10; // 将步骤转换为0-1之间的透明度
                
                this.setData({
                  fireworks
                });
                
                if (fadeOutStep <= 0) {
                  clearInterval(fadeInterval);
                  // 从fadeIntervals中移除该计时器
                  if (this.fadeIntervals) {
                    const index = this.fadeIntervals.indexOf(fadeInterval);
                    if (index > -1) {
                      this.fadeIntervals.splice(index, 1);
                    }
                  }
                }
              }, 100);
              
              // 将淡出定时器保存到fadeIntervals数组中
              this.fadeIntervals.push(fadeInterval);
            }, 1000);
            
            // 保存淡出定时器
            this.fadeIntervals.push(fadeOutTimer);
          }, firework.delay || 500);  // 使用烟花自定义的延迟时间
          
          // 保存延迟定时器
          this.fadeIntervals.push(delayTimer);
        })(fireObj);
      }
    }
    
    // 使用requestAnimationFrame API代替setTimeout
    const animateFireworks = () => {
      const movingFireworks = [...this.data.fireworks];
      let anyActive = false;
      
      // 每帧增加动画时间
      animationTime += 16;
      
      for (let i = 0; i < movingFireworks.length; i++) {
        const coin = movingFireworks[i];
        
        // 跳过中央烟花的更新，由animation实例处理
        if (coin.isCenter) continue;
        
        if (!coin.landed) {
          // 更新位置
          coin.top += coin.fallSpeed;
          coin.fallSpeed += 0.1; // 重力加速度
          
          // 旋转更新
          coin.rotation += coin.rotationSpeed;
          
          // 横向移动 - 包括横向漂移和波动效果
          const waveOffset = coin.horizontalWave.amplitude * 
                            Math.sin(animationTime * coin.horizontalWave.frequency + coin.horizontalWave.phase);
          coin.left += coin.horizontalMove + waveOffset;
          
          // 检查是否落地
          if (coin.top > coin.landingPosition) {
            coin.landed = true;
            
            // 根据不同的金币类型给予不同的弹跳效果，让场景更生动
            if (!coin.hasBounced) {
              coin.hasBounced = true;
              
              // 反向弹起，弹跳幅度随机（15%-35%）
              const bounceStrength = 0.15 + Math.random() * 0.2;
              coin.fallSpeed = -coin.fallSpeed * bounceStrength;
              
              // 保持一部分水平移动，减少但不完全消除
              coin.horizontalMove = coin.horizontalMove * 0.5;
              coin.rotationSpeed = coin.rotationSpeed * 0.7;
            } else {
              // 第二次及以后的落地，停止所有动作
              coin.fallSpeed = 0;
              coin.horizontalMove = 0;
              coin.rotationSpeed = 0;
            }
            
            // 确保金币不会超出底部
            coin.top = coin.landingPosition;
          }
          
          anyActive = true;
        }
      }
      
      // 每3帧才更新一次setData，减少消息处理时间
      if (animationTime % 80 === 0) { // 增加更新间隔，从48ms到80ms
        this.setData({
          fireworks: movingFireworks
        });
      }
      
      // 如果还有活动的金币，继续动画
      if (anyActive) {
        this.animationFrameId = setTimeout(() => {
          animateFireworks();
        }, 16);
      } else {
        // 所有金币都停止了，保持显示直到用户点击
        // 过滤掉中央烟花和任何具有.type属性的小烟花，只保留金币（type为1,2,3）
        const newFireworks = this.data.fireworks.filter(f => {
          // 保留所有type为1,2,3的金币，移除type为0的烟花
          return !f.isCenter && f.type > 0;
        });
        
        this.setData({
          fireworks: newFireworks,
          fireworksStopped: true // 标记金币已停止
        });
        
        // 显示提示，告知用户可以点击清除
        wx.showToast({
          title: '点击屏幕继续',
          icon: 'none',
          duration: 1500
        });
        
        // 只释放音频资源，保留金币显示
        if (this.coinSound) this.coinSound.destroy();
        if (this.fireworkSound) this.fireworkSound.destroy();
      }
    };
    
    // 使用requestAnimationFrame开始动画
    this.animationFrameId = setTimeout(() => {
      animateFireworks();
    }, 16);
    
    // 设置清理函数
    const clearAnimations = () => {
      if (animationFrameId) {
        clearTimeout(animationFrameId);
      }
      
      // 清理所有可能存在的定时器
      const fadeIntervals = this.fadeIntervals || [];
      fadeIntervals.forEach(intervalId => {
        clearInterval(intervalId);
      });
      this.fadeIntervals = [];
      
      // 释放音频资源
      if (this.coinSound) this.coinSound.destroy();
      if (this.fireworkSound) this.fireworkSound.destroy();
    };
    
    // 用户不点击的情况下金币最长保留60秒
    setTimeout(() => {
      // 只在金币已停止且仍在显示时清理
      if (this.data.fireworksStopped && this.data.showFireworks) {
        this.clearFireworks();
      }
    }, 60000); // 60秒
  },

  // requestAnimationFrame polyfill for 微信小程序
  requestAnimationFrame: function(callback) {
    const systemInfo = wx.getSystemInfoSync();
    const fps = 60;
    const frameDuration = 1000 / fps;  // 假设60fps
    
    return setTimeout(function() {
      const timestamp = Date.now();
      callback(timestamp);
    }, frameDuration);
  },
  
  // cancelAnimationFrame polyfill for 微信小程序
  cancelAnimationFrame: function(id) {
    clearTimeout(id);
  },

  // 清理烟花效果 - 当用户点击停止的金币时触发
  clearFireworks() {
    console.log('尝试清理烟花效果', this.data.fireworksStopped, this.data.showFireworks);
    
    // 无论金币是否静止，都允许清理
    this.setData({
      showFireworks: false,
      fireworks: [],
      fireworksStopped: false
    });
    
    // 清理所有可能存在的定时器
    const fadeIntervals = this.fadeIntervals || [];
    fadeIntervals.forEach(intervalId => {
      clearInterval(intervalId);
    });
    this.fadeIntervals = [];
    
    // 清理任何可能的setTimeout
    if (this.animationFrameId) {
      clearTimeout(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // 检查并清理任何可能存在的音频实例
    if (this.coinSound) {
      this.coinSound.destroy();
      this.coinSound = null;
    }
    
    if (this.fireworkSound) {
      this.fireworkSound.destroy();
      this.fireworkSound = null;
    }
    
    console.log('烟花效果已清理');
  },

  // 只是为了确保点击按钮肯定能清理
  onClearButtonTap(e) {
    console.log('清除按钮被点击');
    
    // 阻止事件冒泡，避免触发容器的点击事件
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    
    // 直接重置所有状态，不经过清理逻辑
    this.setData({
      showFireworks: false,
      fireworks: [],
      fireworksStopped: false
    });
    
    // 清理计时器和音频资源
    if (this.animationFrameId) {
      clearTimeout(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    const fadeIntervals = this.fadeIntervals || [];
    fadeIntervals.forEach(intervalId => {
      clearInterval(intervalId);
    });
    this.fadeIntervals = [];
    
    if (this.coinSound) {
      this.coinSound.destroy();
      this.coinSound = null;
    }
    
    if (this.fireworkSound) {
      this.fireworkSound.destroy();
      this.fireworkSound = null;
    }
    
    wx.showToast({
      title: '清除成功',
      icon: 'success',
      duration: 1500
    });
  }
})