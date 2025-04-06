Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 是否自动播放
    autoPlay: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    // 是否显示烟花
    showFireworks: false
  },

  /**
   * 生命周期
   */
  lifetimes: {
    attached() {
      if (this.properties.autoPlay) {
        this.showFireworks();
      }
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 显示烟花效果
     */
    showFireworks() {
      this.setData({
        showFireworks: true
      }, () => {
        // 调用flower-display组件的方法
        const flowerDisplay = this.selectComponent('#flower-display');
        if (flowerDisplay) {
          flowerDisplay.handleFlowerTap();
        } else {
          console.error('[text-effects] 未找到flower-display组件');
        }
      });
    },

    /**
     * 隐藏烟花效果
     */
    hideFireworks() {
      this.setData({
        showFireworks: false
      });
    },

    /**
     * 处理点击事件，关闭烟花
     */
    handleTap() {
      this.hideFireworks();
      this.triggerEvent('tap');
    }
  }
}) 