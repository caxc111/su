Page({
  data: {
    record: null, // 当前朗读记录
    article: null // 文章内容
  },
  
  onLoad: function(options) {
    // 获取记录ID
    const recordId = options.id;
    if (recordId) {
      this.loadRecordDetail(recordId);
    } else {
      this.showError('未找到记录ID');
    }
  },
  
  // 加载记录详情
  loadRecordDetail: function(recordId) {
    const app = getApp();
    
    // 从全局数据中获取阅读记录
    const records = app.globalData.readingRecords || [];
    const record = records.find(item => item.id === recordId);
    
    if (record) {
      // 计算花朵数量
      const flowers = this.calculateFlowers(record.score);
      
      // 格式化日期
      const formattedDate = this.formatDate(record.date);
      
      // 查找对应的文章内容
      const articles = app.globalData.articles || [];
      const article = articles.find(item => item.id === record.articleId);
      
      // 更新页面数据
      this.setData({
        record: {
          ...record,
          flowers,
          formattedDate
        },
        article: article || null
      });
    } else {
      this.showError('找不到该朗读记录');
    }
  },
  
  // 根据分数计算花朵数量
  calculateFlowers(score) {
    if (score >= 95) {
      return 3;
    } else if (score >= 85) {
      return 2;
    } else if (score >= 75) {
      return 1;
    }
    return 0;
  },
  
  // 格式化日期
  formatDate(dateString) {
    if (!dateString) return '未知日期';
    
    // 如果是时间戳，转换为日期字符串
    if (typeof dateString === 'number') {
      const date = new Date(dateString);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
    
    // 如果已经是YYYY-MM-DD格式，直接返回
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    // 尝试解析其他格式
    try {
      const date = new Date(dateString);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    } catch (e) {
      return '未知日期';
    }
  },
  
  // 显示错误信息
  showError(message) {
    wx.showToast({
      title: message,
      icon: 'error',
      duration: 2000
    });
    
    // 2秒后返回上一页
    setTimeout(() => {
      wx.navigateBack();
    }, 2000);
  },
  
  // 再次练习
  practiceAgain: function() {
    if (this.data.record && this.data.record.articleId) {
      wx.navigateTo({
        url: '../reading/reading?id=' + this.data.record.articleId
      });
    } else {
      wx.showToast({
        title: '无法找到文章',
        icon: 'none'
      });
    }
  },
  
  // 返回上一页
  goBack: function() {
    wx.navigateBack();
  }
}); 