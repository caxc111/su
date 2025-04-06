Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 是否显示操作面板
    visible: {
      type: Boolean,
      value: false
    },
    // 文章对象，必须包含id和title
    article: {
      type: Object,
      value: null
    },
    // 是否显示删除按钮
    showDelete: {
      type: Boolean,
      value: true
    },
    // 是否显示分享按钮
    showShare: {
      type: Boolean,
      value: true
    },
    // 是否显示收藏按钮
    showCollect: {
      type: Boolean,
      value: true
    },
    // 删除按钮文本
    deleteText: {
      type: String,
      value: '删除文章'
    },
    // 分享按钮文本
    shareText: {
      type: String,
      value: '分享文章'
    },
    // 收藏按钮文本
    collectText: {
      type: String,
      value: '添加到收藏'
    },
    // 取消按钮文本
    cancelText: {
      type: String,
      value: '取消'
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    // 组件内部数据
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 点击蒙层关闭面板
     */
    hidePanel() {
      this.triggerEvent('close');
    },
    
    /**
     * 阻止冒泡，防止点击内容区域关闭弹窗
     */
    catchPanelTap() {
      return false;
    },
    
    /**
     * 处理删除操作
     */
    handleDelete() {
      if (!this.properties.article) {
        console.error('No article provided for deletion');
        return;
      }
      
      this.triggerEvent('delete', { 
        article: this.properties.article 
      });
      
      // 自动关闭面板
      this.hidePanel();
    },
    
    /**
     * 处理分享操作
     */
    handleShare() {
      if (!this.properties.article) {
        console.error('No article provided for sharing');
        return;
      }
      
      this.triggerEvent('share', { 
        article: this.properties.article 
      });
      
      // 自动关闭面板
      this.hidePanel();
    },
    
    /**
     * 处理收藏操作
     */
    handleCollect() {
      if (!this.properties.article) {
        console.error('No article provided for collection');
        return;
      }
      
      this.triggerEvent('collect', { 
        article: this.properties.article 
      });
      
      // 自动关闭面板
      this.hidePanel();
    }
  }
}) 