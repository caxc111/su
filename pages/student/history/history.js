Page({
  data: {
    records: [], // 朗读记录
    filterType: 'all', // 筛选类型：'all', 'high', 'low'
    page: 1, // 当前页码
    pageSize: 10, // 每页记录数
    hasMore: false, // 是否有更多记录
    loading: false // 是否正在加载
  },

  onLoad: function() {
    // 加载朗读记录
    this.loadReadingRecords();
  },

  onShow: function() {
    // 每次显示页面时重新加载记录
    this.loadReadingRecords();
  },

  // 加载朗读记录
  loadReadingRecords: function(append = false) {
    const app = getApp();
    if (!app.globalData.readingRecords) {
      app.loadReadingRecordsFromStorage();
    }
    
    // 获取所有朗读记录
    let records = app.globalData.readingRecords || [];
    
    // 根据时间戳倒序排序（最新的在前面）
    records.sort((a, b) => {
      return b.timestamp - a.timestamp;
    });
    
    // 根据筛选条件过滤
    const filterType = this.data.filterType;
    if (filterType === 'high') {
      // 高分记录 (85分以上)
      records = records.filter(record => record.score >= 85);
    } else if (filterType === 'low') {
      // 需要提高的记录 (85分以下)
      records = records.filter(record => record.score < 85);
    }
    
    // 分页处理
    const page = append ? this.data.page + 1 : 1;
    const pageSize = this.data.pageSize;
    const startIndex = (page - 1) * pageSize;
    const endIndex = page * pageSize;
    const recordsToShow = records.slice(startIndex, endIndex);
    
    // 为每条记录添加花朵数量和格式化日期
    const enhancedRecords = recordsToShow.map(record => {
      return {
        ...record,
        flowers: this.calculateFlowers(record.score),
        formattedDate: this.formatDate(record.timestamp)
      };
    });
    
    this.setData({
      records: append ? [...this.data.records, ...enhancedRecords] : enhancedRecords,
      page: page,
      hasMore: endIndex < records.length,
      loading: false
    });
  },
  
  // 根据分数计算花朵数量
  calculateFlowers(score) {
    const numericScore = Number(score);
    if (isNaN(numericScore)) {
      return 0;
    }
    // 只有得分等于 100 时才返回 1 朵花，否则返回 0
    return numericScore === 100 ? 1 : 0;
  },
  
  // 格式化日期和时间为 YYYY-MM-DD HH:mm
  formatDate(timestamp) {
    if (!timestamp || typeof timestamp !== 'number') {
        return '未知时间';
    }
    try {
        const date = new Date(timestamp);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    } catch (e) {
        console.error('[history.js formatDate] Error formatting timestamp:', timestamp, e);
        return '时间格式错误';
    }
  },
  
  // 切换筛选类型
  changeFilterType: function(e) {
    const type = e.currentTarget.dataset.type;
    if (type !== this.data.filterType) {
      this.setData({
        filterType: type,
        page: 1
      });
      this.loadReadingRecords();
    }
  },
  
  // 加载更多记录
  loadMore() {
    // 模拟加载更多数据
    this.getRecords(this.data.page + 1);
  },
  
  // 查看记录详情
  viewRecordDetail: function(e) {
    const recordId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: './detail?id=' + recordId
    });
  },

  // 返回上一页
  goBack() {
    // 删除返回函数
  }
}) 