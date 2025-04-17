// record.js - 练习记录页面
// 引入全局应用实例和所需的常量及工具
const app = getApp();
import { PAGES, formatTime } from '../../utils/constant';

// 记录页面
Page({
  // 页面的初始数据
  data: {
    records: [], // 用户练习记录
    isLoading: true, // 加载状态
    noData: false, // 无数据状态
    currentTab: 0, // 当前选中的标签页(0: 全部, 1: 朗读, 2: 背诵)
  },

  // 生命周期函数--监听页面加载
  onLoad: function (options) {
    console.log('记录页面加载');
    // 如果指定了标签页，则切换到对应标签
    if (options.tab) {
      this.setData({
        currentTab: parseInt(options.tab)
      });
    }
  },

  // 生命周期函数--监听页面显示
  onShow: function () {
    // 检查登录状态
    this.checkLoginStatus();
    // 加载用户练习记录
    this.loadRecords();
  },

  // 检查登录状态
  checkLoginStatus: function() {
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) {
      wx.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 2000
      });
      
      // 跳转到登录页
      setTimeout(() => {
        wx.navigateTo({
          url: PAGES.LOGIN
        });
      }, 1500);
      return false;
    }
    return true;
  },

  // 加载用户练习记录
  loadRecords: function () {
    // 如果未登录，不加载数据
    if (!this.checkLoginStatus()) {
      return;
    }

    // 设置加载状态
    this.setData({
      isLoading: true
    });

    // 获取存储的练习记录
    try {
      const practiceRecords = wx.getStorageSync('practiceRecords') || [];
      
      // 过滤记录（如果有选中的标签页）
      let filteredRecords = practiceRecords;
      if (this.data.currentTab === 1) {
        // 只显示朗读记录
        filteredRecords = practiceRecords.filter(record => record.practiceType === 'read');
      } else if (this.data.currentTab === 2) {
        // 只显示背诵记录
        filteredRecords = practiceRecords.filter(record => record.practiceType === 'recite');
      }
      
      // 按时间倒序排序
      filteredRecords.sort((a, b) => b.timestamp - a.timestamp);
      
      // 格式化记录数据
      const formattedRecords = filteredRecords.map(record => {
        return {
          ...record,
          dateFormatted: formatTime(record.timestamp),
          scoreClass: this.getScoreClass(record.score),
          practiceTypeText: record.practiceType === 'read' ? '朗读' : '背诵'
        };
      });
      
      // 更新页面数据
      this.setData({
        records: formattedRecords,
        isLoading: false,
        noData: formattedRecords.length === 0
      });
    } catch (error) {
      console.error('获取练习记录失败', error);
      this.setData({
        records: [],
        isLoading: false,
        noData: true
      });
      
      wx.showToast({
        title: '获取记录失败',
        icon: 'none'
      });
    }
  },

  // 根据分数获取样式类名
  getScoreClass: function(score) {
    if (score >= 90) return 'score-excellent';
    if (score >= 75) return 'score-good';
    if (score >= 60) return 'score-average';
    return 'score-poor';
  },

  // 切换标签页
  switchTab: function(e) {
    const tabIndex = e.currentTarget.dataset.tab;
    if (tabIndex !== this.data.currentTab) {
      this.setData({
        currentTab: tabIndex
      }, () => {
        // 切换标签后重新加载记录
        this.loadRecords();
      });
    }
  },

  // 查看记录详情
  viewRecordDetail: function (e) {
    const recordId = e.currentTarget.dataset.id;
    const record = this.data.records.find(item => item.id === recordId);
    
    if (record) {
      // 将记录数据暂存到全局数据
      app.globalData.currentRecord = record;
      
      // 跳转到详情页面
      wx.navigateTo({
        url: `/pages/record-detail/record-detail?id=${recordId}`
      });
    } else {
      wx.showToast({
        title: '记录不存在',
        icon: 'none'
      });
    }
  },

  // 删除记录
  deleteRecord: function(e) {
    const recordId = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '删除记录',
      content: '确定要删除这条练习记录吗？',
      confirmColor: '#f44336',
      success: (res) => {
        if (res.confirm) {
          // 获取存储的所有记录
          const allRecords = wx.getStorageSync('practiceRecords') || [];
          
          // 过滤掉要删除的记录
          const updatedRecords = allRecords.filter(record => record.id !== recordId);
          
          // 更新存储
          wx.setStorageSync('practiceRecords', updatedRecords);
          
          // 刷新页面数据
          this.loadRecords();
          
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
        }
      }
    });
  },

  // 下拉刷新
  onPullDownRefresh: function () {
    this.loadRecords();
    wx.stopPullDownRefresh();
  },

  // 分享
  onShareAppMessage: function () {
    return {
      title: '顺口成章 - 我的练习记录',
      path: '/pages/record/record'
    };
  }
}); 