// pages/student/history/detail.js
const app = getApp();

Page({
  data: {
    record: null // 存储完整的记录数据，包括后面添加的 formattedFullDate
  },

  onLoad: function (options) {
    const recordId = options.id;
    console.log('[detail.js onLoad] 加载记录详情，ID:', recordId);
    if (recordId) {
      this.loadRecordDetail(recordId);
    } else {
      console.error('[detail.js onLoad] 未找到记录 ID');
      wx.showToast({ title: '加载失败，缺少记录ID', icon: 'none' });
      // 考虑是否需要返回上一页
      // wx.navigateBack();
    }
  },

  loadRecordDetail: function(recordId) {
    const records = app.globalData.readingRecords || [];
    // 查找对应的记录
    const recordDetail = records.find(r => r.id === recordId);

    if (recordDetail) {
      // --- 重要的日志输出 ---
      console.log('[detail.js loadRecordDetail] 找到的原始记录数据:', JSON.stringify(recordDetail));
      if (recordDetail.feedbackHtml) {
        console.log('[detail.js loadRecordDetail] feedbackHtml 存在，长度:', recordDetail.feedbackHtml.length);
        // console.log('[detail.js loadRecordDetail] feedbackHtml 内容:', recordDetail.feedbackHtml); // 如果需要可以取消注释看具体内容
      } else {
        console.warn('[detail.js loadRecordDetail] feedbackHtml 不存在或为空!');
      }
      // --- 日志输出结束 ---

      // 格式化时间戳
      const formattedFullDate = this.formatDate(recordDetail.timestamp);

      // 更新页面数据，将格式化后的时间和原始记录合并
      this.setData({
        record: {
          ...recordDetail, // 包含原始记录的所有字段，如 score, accuracy, feedbackHtml 等
          formattedFullDate: formattedFullDate // 添加格式化后的时间
        }
      });

      // 设置导航栏标题
      wx.setNavigationBarTitle({
        title: recordDetail.articleTitle ? `"${recordDetail.articleTitle}"背诵详情` : '背诵详情'
      });

    } else {
      console.error('[detail.js loadRecordDetail] 在 globalData 中未找到 ID 为', recordId, '的记录');
      wx.showToast({ title: '找不到该记录', icon: 'none' });
      // 考虑返回上一页
      // wx.navigateBack();
    }
  },

  // 格式化日期和时间 (YYYY-MM-DD HH:mm)
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
        console.error('[detail.js formatDate] Error formatting timestamp:', timestamp, e);
        return '时间格式错误';
    }
  }
});