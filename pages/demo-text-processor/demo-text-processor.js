// pages/demo-text-processor/demo-text-processor.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    articleId: '', // 文章ID
    mode: 'read', // 默认为朗读模式
    showDemo: false // 是否显示示例选择
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log('Demo页面加载，参数:', options);
    
    if (options.id) {
      // 如果URL中有参数，直接加载该文章
      this.setData({
        articleId: options.id,
        mode: options.mode || 'read'
      });
    } else {
      // 否则显示示例选择
      this.setData({
        showDemo: true
      });
    }
  },

  /**
   * 选择示例文章
   */
  selectDemo: function (e) {
    const { id, mode } = e.currentTarget.dataset;
    
    this.setData({
      articleId: id,
      mode: mode,
      showDemo: false
    });
  },

  /**
   * 选择模式
   */
  selectMode: function (e) {
    const mode = e.currentTarget.dataset.mode;
    this.setData({
      mode: mode
    });
  },

  /**
   * 处理组件完成事件
   */
  handleFinish: function () {
    // 返回上一页
    wx.navigateBack();
  },

  /**
   * 处理组件评估完成事件
   */
  handleEvaluationComplete: function (e) {
    console.log('评估完成:', e.detail);
  },

  /**
   * 处理文章加载完成事件
   */
  handleArticleLoaded: function (e) {
    console.log('文章加载完成:', e.detail);
    wx.setNavigationBarTitle({
      title: e.detail.title || '文本处理器'
    });
  }
}) 