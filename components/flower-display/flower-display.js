Component({
  /**
   * 组件的属性列表
   */
  properties: {
    count: {
      type: Number,
      value: 0
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    showFireworks: false,
    fallingCoins: [],  // 存储金币元素
    centerFireworks: [] // 存储烟花元素
  },

  /**
   * 组件的生命周期
   */
  lifetimes: {
    attached() {
      // 在组件实例进入页面节点树时执行
    },
    detached() {
      // 在组件实例被从页面节点树移除时执行
      this.clearFireworks();
      this.stopAllSounds();
    },
    // 页面隐藏时
    hide() {
      this.clearFireworks();
      this.stopAllSounds();
    }
  },

  // 组件所在页面的生命周期
  pageLifetimes: {
    hide() {
      this.clearFireworks();
      this.stopAllSounds();
    },
    unload() {
      this.clearFireworks();
      this.stopAllSounds();
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 显示花朵数量
    showFlowerCount() {
      return this.data.count;
    },
    
    // 点击花朵显示动画
    handleFlowerTap() {
      console.log('[flower-display.js] handleFlowerTap triggered.');
      
      // 防止快速点击导致的多重动画
      if (this.data.showFireworks) {
        console.log('[flower-display.js] Animation already in progress, ignoring click');
        return;
      }
      
      // 获取当前花朵数量
      const flowers = this.data.count;
      if (flowers <= 0) {
        wx.showToast({
          title: '暂无小红花可展示',
          icon: 'none'
        });
        return;
      }
      
      // 播放烟花声音
      this.playCoinSound();
      
      // 初始化数据
      const centerX = wx.getSystemInfoSync().windowWidth / 2;
      const centerY = 300; // 可根据UI调整
      const screenHeight = wx.getSystemInfoSync().windowHeight;
      const screenBottom = screenHeight - 50; // 屏幕底部位置（留出一点边距）
      
      // 创建金币数组
      const fallingCoins = [];
      
      // 创建40-60个金币（原来是20-30个，翻倍）
      const coinCount = Math.floor(Math.random() * 20) + 40;
      
      for (let i = 0; i < coinCount; i++) {
        // 随机生成金币位置 - 从顶部开始
        const angle = Math.random() * Math.PI * 0.8 + Math.PI * 0.1; // 限制在上方区域
        const distance = 50 + Math.random() * 200; // 增大距离范围
        const left = centerX + Math.cos(angle) * distance;
        const top = centerY - 350 - Math.random() * 100; // 从更高的位置开始
        
        // 随机放大金币，保持合理大小
        const coinScale = 0.5 + Math.random() * 0.8;
        
        // 随机选择金币图片类型 (1-3，对应firework1.png到firework3.png)
        const coinType = Math.floor(Math.random() * 3) + 1; // 1, 2, 或 3
        
        // 添加随机延迟以及各种随机效果
        fallingCoins.push({
          id: `coin_${i}`,
          left,
          top,
          scale: coinScale,
          rotation: Math.random() * 360,
          type: coinType, // 随机金币类型
          endY: screenBottom - Math.random() * 100, // 确保金币落到屏幕底部附近
          fallDelay: Math.floor(Math.random() * 1000), // 随机下落延迟0-1000毫秒
          flipSpeed: Math.random() > 0.5 ? 'fast' : 'slow', // 随机翻转速度
          flipDirection: Math.random() > 0.5 ? 'clockwise' : 'counterclockwise' // 随机翻转方向
        });
      }
      
      // 设置数据，启动动画
      this.setData({
        fallingCoins,
        centerFireworks: [], // 初始没有烟花
        showFireworks: true
      }, () => {
        // 金币随机落下
        let maxFallDelay = 0;
        
        fallingCoins.forEach((coin) => {
          // 计算最长的金币落下延迟
          const totalFallTime = coin.fallDelay + 2800; // fallDelay + transition时间(2.8s)
          maxFallDelay = Math.max(maxFallDelay, totalFallTime);
          
          setTimeout(() => {
            if (!this.data.showFireworks) return; // 如果用户已清除动画，则不再执行
            
            const updatedCoins = [...this.data.fallingCoins];
            const coinIndex = updatedCoins.findIndex(f => f.id === coin.id);
            
            if (coinIndex !== -1) {
              updatedCoins[coinIndex].top = coin.endY;
              updatedCoins[coinIndex].flipClass = `flip-${coin.flipSpeed}-${coin.flipDirection}`;
              
              this.setData({
                fallingCoins: updatedCoins
              });
            }
          }, coin.fallDelay);
        });
        
        // 播放金币落下的声音
        this.playFallingCoinsSound(maxFallDelay);
        
        // 添加中央烟花
        this.addCenterFireworks(centerX, centerY);
      });
      
      // 触发自定义事件，让父组件知道动画已开始
      this.triggerEvent('animationStart');
    },
    
    // 添加中央烟花
    addCenterFireworks(centerX, centerY) {
      // 定义烟花配置 - 增加到5朵，大小不一，并增加动画持续时间
      const fireworkConfigs = [
        {
          id: 'firework1',
          left: centerX - 100,
          top: centerY - 50,
          scale: 1.6, // 较大尺寸
          type: 0,
          delay: Math.random() * 300,
          fadeInTime: 200,
          holdTime: 1300, // 增长持续时间，让闪动放大动画有足够时间完成
          fadeOutTime: 800, // 增长淡出时间，让放大消失效果更明显
          blink: true // 添加闪动标记
        },
        {
          id: 'firework2',
          left: centerX + 80,
          top: centerY - 70,
          scale: 0.9, // 较小尺寸
          type: 0,
          delay: Math.random() * 300 + 100,
          fadeInTime: 250,
          holdTime: 1200,
          fadeOutTime: 850,
          blink: true
        },
        {
          id: 'firework3',
          left: centerX - 50,
          top: centerY - 120,
          scale: 1.2,
          type: 0,
          delay: Math.random() * 300 + 200,
          fadeInTime: 200,
          holdTime: 1400,
          fadeOutTime: 750,
          blink: true
        },
        {
          id: 'firework4',
          left: centerX + 130,
          top: centerY + 60,
          scale: 1.4, // 较大尺寸
          type: 0,
          delay: Math.random() * 300 + 150,
          fadeInTime: 180,
          holdTime: 1250,
          fadeOutTime: 780,
          blink: true
        },
        {
          id: 'firework5',
          left: centerX - 150,
          top: centerY + 80,
          scale: 0.8, // 最小尺寸
          type: 0,
          delay: Math.random() * 300 + 250,
          fadeInTime: 220,
          holdTime: 1350,
          fadeOutTime: 820,
          blink: true
        }
      ];
      
      // 逐个添加烟花，随机出现，使用透明度渐变
      fireworkConfigs.forEach((config) => {
        setTimeout(() => {
          if (!this.data.showFireworks) return;
          
          // 添加烟花，初始透明度为0
          const newFirework = {
            ...config,
            opacity: 0
          };
          
          const updatedFireworks = [...this.data.centerFireworks, newFirework];
          
          this.setData({
            centerFireworks: updatedFireworks
          }, () => {
            // 淡入动画
            setTimeout(() => {
              if (!this.data.showFireworks) return;
              const fadeInFireworks = [...this.data.centerFireworks];
              const index = fadeInFireworks.findIndex(f => f.id === config.id);
              if (index !== -1) {
                fadeInFireworks[index].opacity = 1;
                
                // 根据配置决定是否添加闪烁动画类
                if (config.blink) {
                  fadeInFireworks[index].transitionClass = 'fade-in firework-blink';
                } else {
                  fadeInFireworks[index].transitionClass = 'fade-in';
                }
                
                this.setData({
                  centerFireworks: fadeInFireworks
                });
              }
            }, 50);
            
            // 修改烟花淡出动画逻辑
            setTimeout(() => {
              if (!this.data.showFireworks) return;
              const fadeOutFireworks = [...this.data.centerFireworks];
              const index = fadeOutFireworks.findIndex(f => f.id === config.id);
              if (index !== -1) {
                // 使用放大淡出效果替代普通淡出
                fadeOutFireworks[index].transitionClass = 'firework-expand';
                this.setData({
                  centerFireworks: fadeOutFireworks
                });
              }
            }, config.fadeInTime + config.holdTime);
            
            // 移除烟花
            setTimeout(() => {
              if (!this.data.showFireworks) return;
              const remaining = this.data.centerFireworks.filter(f => f.id !== config.id);
              this.setData({
                centerFireworks: remaining
              });
            }, config.fadeInTime + config.holdTime + config.fadeOutTime);
          });
        }, config.delay);
      });
    },
    
    // 清除所有动画
    clearFireworks() {
      if (this.data.showFireworks) {
        console.log('[flower-display.js] Clearing fireworks...');
        
        // 停止金币落下的声音
        if (this.fallingCoinsSound) {
          this.fallingCoinsSound.stop();
          this.fallingCoinsSound = null;
          console.log('[flower-display.js] Stopped falling coins sound');
        }
        
        this.setData({
          showFireworks: false,
          fallingCoins: [],
          centerFireworks: []
        });
        
        console.log('[flower-display.js] Fireworks cleared');
        
        // 触发自定义事件，让父组件知道动画已结束
        this.triggerEvent('animationEnd');
      }
    },
    
    // 播放烟花声音
    playCoinSound() {
      const innerAudioContext = wx.createInnerAudioContext();
      innerAudioContext.src = '/audio/firework.mp3'; // 烟花爆炸声音
      innerAudioContext.play();
    },
    
    // 播放金币落下的声音
    playFallingCoinsSound(duration) {
      console.log('[flower-display.js] Playing falling coins sound for duration:', duration);
      const fallingCoinsSound = wx.createInnerAudioContext();
      fallingCoinsSound.src = '/audio/firework.wav'; // 金币落下的声音
      fallingCoinsSound.loop = true; // 循环播放，直到金币全部落地
      
      // 存储为实例属性，以便后续可以停止
      this.fallingCoinsSound = fallingCoinsSound;
      
      fallingCoinsSound.play();
      
      // 设置定时器，在所有金币落地后停止声音
      setTimeout(() => {
        if (this.fallingCoinsSound) {
          this.fallingCoinsSound.stop();
          this.fallingCoinsSound = null;
        }
      }, duration);
    },
    
    // 点击背景清除动画
    handleContainerTap() {
      // 如果动画正在显示，任何点击都应该清除动画
      if (this.data.showFireworks) {
        console.log('[flower-display.js] Screen tapped, clearing fireworks');
        this.clearFireworks();
      }
    },
    
    // 停止所有声音
    stopAllSounds() {
      if (this.fallingCoinsSound) {
        this.fallingCoinsSound.stop();
        this.fallingCoinsSound = null;
        console.log('[flower-display.js] Stopped falling coins sound on page hide/unload');
      }
    }
  }
}); 