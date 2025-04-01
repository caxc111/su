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
    const page = append ? this.data.page : 1;
    const pageSize = this.data.pageSize;
    const startIndex = (page - 1) * pageSize;
    const endIndex = page * pageSize;
    const recordsToShow = records.slice(0, endIndex);
    
    // 为每条记录添加花朵数量和格式化日期
    const enhancedRecords = recordsToShow.map(record => {
      return {
        ...record,
        flowers: this.calculateFlowers(record.score),
        formattedDate: this.formatDate(record.date)
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