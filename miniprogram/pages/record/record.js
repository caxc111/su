const app = getApp()

try {
  console.log('[Record] 开始注册页面');
Page({
  data: {
      activeTab: 'reading', // 'reading' 或 'reciting'
      recordList: [],
      hasRecords: false,
      isLoading: true
    },
    
    onLoad: function() {
      console.log('[Record] onLoad - 页面加载');
      this.checkLoginStatus();
    },
    
    onShow: function() {
      console.log('[Record] onShow - 页面显示');
      // 每次页面显示时刷新记录数据
      this.loadRecords();
    },
    
    // 检查登录状态
    checkLoginStatus: function() {
      const userInfo = wx.getStorageSync('userInfo');
      if (!userInfo || !userInfo.nickName) {
        console.log('[Record] 用户未登录，跳转到登录页');
      wx.redirectTo({
        url: '/pages/login/login'
        });
      } else {
        console.log('[Record] 用户已登录:', userInfo.nickName);
      }
    },
    
    // 加载记录
    loadRecords: function() {
      this.setData({ isLoading: true });

      // 检查用户是否已登录
      const userInfo = wx.getStorageSync('userInfo');
      if (!userInfo || !userInfo.openId) {
        wx.showToast({
          title: '请先登录',
          icon: 'none',
          duration: 2000
        });
        
        setTimeout(() => {
          wx.navigateTo({
            url: '/pages/login/login'
          });
        }, 1000);
        
        this.setData({ isLoading: false });
        return;
      }

      // 根据当前选择的标签页加载对应类型的记录
      const recordType = this.data.activeTab;
      
      // 模拟从服务器获取记录数据
      // 实际应用中应该从后端API获取数据
      setTimeout(() => {
        // 示例数据
        let records = [];
        
        if (recordType === 'reading') {
          records = [
            {
              id: 1,
              title: '小王子',
              date: '2023-10-15',
              duration: 15,
              score: 85
            },
            {
              id: 2,
              title: '雾都孤儿',
              date: '2023-10-14',
              duration: 20,
              score: 90
            }
          ];
        } else {
          records = [
            {
              id: 3,
              title: '伊索寓言',
              date: '2023-10-12',
              duration: 10,
              score: 88
            }
          ];
        }

        this.setData({
          recordList: records,
          hasRecords: records.length > 0,
          isLoading: false
        });
        
        console.log(`[Record] 加载${recordType}记录: ${records.length}条`);
      }, 1000);
    },
    
    // 切换标签页
    switchTab: function(e) {
      const tab = e.currentTarget.dataset.tab;
      
      if (tab !== this.data.activeTab) {
        this.setData({
          activeTab: tab
        }, () => {
          // 切换标签后重新加载记录
          this.loadRecords();
        });
      }
    },
    
    // 查看记录详情
    viewRecordDetail: function(e) {
      const recordId = e.currentTarget.dataset.id;
      
      // 获取记录详情
      const record = this.data.recordList.find(item => item.id === recordId);
      
      if (record) {
        // 存储当前选中的记录，以便在详情页使用
        wx.setStorageSync('currentRecord', record);
        
        // 跳转到记录详情页
        wx.navigateTo({
          url: '/pages/record-detail/record-detail'
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
      const recordType = this.data.activeTab;
      
      wx.showModal({
        title: '确认删除',
        content: '确定要删除这条记录吗？',
        success: (res) => {
          if (res.confirm) {
            // 从本地记录列表中删除
            const updatedList = this.data.recordList.filter(item => item.id !== recordId);
            
            // 更新本地存储
            const key = recordType === 'reading' ? 'readingRecords' : 'recitingRecords';
            wx.setStorageSync(key, updatedList);
            
            // 更新页面数据
            this.setData({
              recordList: updatedList,
              hasRecords: updatedList.length > 0
            });
            
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            });
            
            // 更新用户统计数据
            this.updateUserStats(recordType);
          }
        }
      });
    },
    
    // 更新用户统计数据
    updateUserStats: function(recordType) {
      // 获取当前用户统计数据
      const stats = wx.getStorageSync('userStats') || {
        readingCount: 0,
        readingTime: 0,
        recitingCount: 0,
        recitingTime: 0,
        perfectReadingCount: 0,
        perfectRecitingCount: 0
      };
      
      // 重新计算统计数据
      const readingRecords = wx.getStorageSync('readingRecords') || [];
      const recitingRecords = wx.getStorageSync('recitingRecords') || [];
      
      stats.readingCount = readingRecords.length;
      stats.recitingCount = recitingRecords.length;
      
      // 计算总时长和满分记录数
      stats.readingTime = readingRecords.reduce((sum, record) => sum + (record.duration || 0), 0);
      stats.recitingTime = recitingRecords.reduce((sum, record) => sum + (record.duration || 0), 0);
      
      stats.perfectReadingCount = readingRecords.filter(record => record.score >= 95).length;
      stats.perfectRecitingCount = recitingRecords.filter(record => record.score >= 95).length;
      
      // 保存更新后的统计数据
      wx.setStorageSync('userStats', stats);
      
      console.log('[Record] 用户统计数据已更新:', stats);
    },

    // 清空记录
    clearRecords: function() {
      const self = this;
      const recordType = this.data.activeTab;
      const typeText = recordType === 'reading' ? '阅读' : '朗诵';
      
      wx.showModal({
        title: '确认清空',
        content: `确定要清空所有${typeText}记录吗？此操作不可恢复。`,
        success(res) {
          if (res.confirm) {
            // 清空对应类型的记录
            const key = recordType === 'reading' ? 'readingRecords' : 'recitingRecords';
            wx.setStorageSync(key, []);
            
            // 更新页面数据
            self.setData({
              recordList: [],
              hasRecords: false
            });
            
            wx.showToast({
              title: '记录已清空',
              icon: 'success'
            });
            
            // 更新用户统计数据
            self.updateUserStats(recordType);
          }
        }
      });
    },

    // 下拉刷新
    onPullDownRefresh: function() {
      this.loadRecords();
      wx.stopPullDownRefresh();
    }
  });
  console.log('[Record] 页面注册完成');
} catch (error) {
  console.error('[Record] 页面注册失败:', error);
} 