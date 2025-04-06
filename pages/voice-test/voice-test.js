// pages/voice-test/voice-test.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    recognizedText: ''  // 只保留识别文本，其他状态由组件管理
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log('语音测试页面加载');
  },

  /**
   * 录音开始事件处理
   */
  handleRecordStart(e) {
    console.log('录音开始，语言:', e.detail.language);
  },

  /**
   * 录音停止事件处理
   */
  handleRecordStop() {
    console.log('录音停止');
  },

  /**
   * 录音结果事件处理
   */
  handleRecordResult(e) {
    console.log('录音识别结果:', e.detail);
    
    // 更新识别结果
    this.setData({
      recognizedText: e.detail.text
    });
  },

  /**
   * 录音错误事件处理
   */
  handleRecordError(e) {
    console.error('录音错误:', e.detail.error);
    
    wx.showToast({
      title: e.detail.error,
      icon: 'none'
    });
  },

  /**
   * 语言切换事件处理
   */
  handleLanguageChange(e) {
    console.log('语言已切换为:', e.detail.language);
    
    // 清空当前识别结果
    this.setData({
      recognizedText: ''
    });
  },
  
  /**
   * 返回上一页
   */
  goBack() {
    wx.navigateBack();
  }
}) 