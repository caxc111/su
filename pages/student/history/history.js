// pages/student/history/history.js
// 注意：此版本不引入 utils/util.js，使用内部 formatDate 和 calculateFlowers

Page({
  data: {
    records: [], // 存储记录
    filterType: 'all', // 筛选类型：'all', 'high' (>=85), 'low' (<85)
    page: 1, // 当前页码
    pageSize: 10, // 每页记录数
    hasMore: false, // 是否有更多记录
    loading: false // 是否正在加载
  },

  onLoad: function() {
    console.log('[history.js] onLoad triggered.');
    this.loadReadingRecords();
  },

  onShow: function() {
    // 每次显示页面时可能需要刷新数据，特别是如果记录在其他页面被修改
    console.log('[history.js] onShow triggered.');
    this.loadReadingRecords(); // 重新加载以反映最新数据
  },

  // 加载记录
  loadReadingRecords: function(append = false) {
    console.log('[history.js] loadReadingRecords called. Append:', append);
    const app = getApp();
    // 确保全局数据已加载
    if (!app.globalData.readingRecords) {
      console.log('[history.js] Loading records from storage because globalData is empty.');
      app.loadReadingRecordsFromStorage(); // 尝试从存储加载
    }

    let records = app.globalData.readingRecords || [];
    console.log('[history.js] Total records fetched:', records.length);

    // 按时间戳倒序排序
    records.sort((a, b) => b.timestamp - a.timestamp);

    // ---> 核心筛选：只显示背诵记录 <---
    records = records.filter(record => record.type === 'recitation');
    console.log('[history.js] Filtered for recitation type, count:', records.length);

    // 根据顶部标签筛选（高分/需提高）
    const filterType = this.data.filterType;
    if (filterType === 'high') {
      records = records.filter(record => record.score >= 85);
      console.log('[history.js] Filtered for high score (>=85), count:', records.length);
    } else if (filterType === 'low') {
      records = records.filter(record => record.score < 85);
      console.log('[history.js] Filtered for low score (<85), count:', records.length);
    }

    // 分页逻辑
    const page = append ? this.data.page + 1 : 1; // 如果是追加模式，页码+1，否则重置为1
    const pageSize = this.data.pageSize;
    const startIndex = (page - 1) * pageSize;
    const endIndex = page * pageSize;
    const recordsToShow = records.slice(startIndex, endIndex);
    console.log('[history.js] Records to show for page', page, ':', recordsToShow.length);

    // 处理要显示的数据，添加计算属性
    const enhancedRecords = recordsToShow.map(record => {
      let formattedDate = '日期错误'; // 默认值
      try {
        // ---> 调用内部的 formatDate 函数 <---
        formattedDate = this.formatDate(record.timestamp);
      } catch (e) {
        console.error(`[history.js] Error formatting date for record ID ${record.id}, timestamp ${record.timestamp}:`, e);
      }
      return {
        ...record, // 保留原始记录所有字段
        flowers: this.calculateFlowers(record.score), // 计算小红花
        formattedDate: formattedDate // 添加格式化后的日期
      };
    });

    console.log('[history.js] Setting data for records. Count:', enhancedRecords.length);
    this.setData({
      records: append ? [...this.data.records, ...enhancedRecords] : enhancedRecords, // 追加或替换
      page: page, // 更新当前页码
      hasMore: endIndex < records.length, // 判断是否还有更多数据
      loading: false // 加载完成
    });
    console.log('[history.js] setData completed.');
  },

  // 计算小红花（背诵历史专用规则：100分得1朵）
  calculateFlowers(score) {
    const numericScore = Number(score);
    if (isNaN(numericScore)) {
      return 0;
    }
    // 只有得分等于 100 时才返回 1 朵花，否则返回 0
    return numericScore === 100 ? 1 : 0;
  },

  // 格式化日期和时间 (YYYY-MM-DD HH:mm) - 内部实现
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

  // 切换顶部筛选标签
  changeFilterType: function(e) {
    const type = e.currentTarget.dataset.type;
    console.log('[history.js] Filter type changed to:', type);
    if (type !== this.data.filterType) {
      this.setData({
        filterType: type,
        page: 1, // 重置页码
        records: [], // 清空现有列表，重新加载
        hasMore: false // 重置状态
      });
      this.loadReadingRecords(); // 重新加载数据
    }
  },

  // 页面滚动到底部时加载更多（需要在 WXML 中绑定 `bindscrolltolower`）
  loadMore() {
    if (!this.data.hasMore || this.data.loading) {
      console.log('[history.js] Load more skipped. HasMore:', this.data.hasMore, 'Loading:', this.data.loading);
      return; // 如果没有更多或者正在加载，则不执行
    }
    console.log('[history.js] Loading more records for page:', this.data.page + 1);
    this.setData({ loading: true });
    // 注意：这里调用 loadReadingRecords 并传入 true 来追加数据
    this.loadReadingRecords(true);
  },

  // 查看记录详情
  viewRecordDetail: function(e) {
    console.log('[history.js viewRecordDetail] Event triggered:', e);
    try {
      const recordId = e.currentTarget.dataset.id;
      console.log('[history.js viewRecordDetail] Got recordId:', recordId);
      if (!recordId) {
        console.error('[history.js viewRecordDetail] Failed to get recordId from dataset!');
        wx.showToast({ title: '无法获取记录ID', icon: 'none' });
        return;
      }
      const url = './detail?id=' + recordId;
      console.log('[history.js viewRecordDetail] Navigating to URL:', url);
      wx.navigateTo({
        url: url,
        fail: (err) => {
          console.error('[history.js viewRecordDetail] wx.navigateTo failed:', err);
          wx.showToast({ title: '无法打开详情页', icon: 'none' });
        }
      });
    } catch (error) {
      console.error('[history.js viewRecordDetail] Error in viewRecordDetail:', error);
      wx.showToast({ title: '打开详情页时出错', icon: 'none' });
    }
  }

  // 已移除 goBack 函数
})