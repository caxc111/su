// pages/student/history/history.js
// 注意：此版本不引入 utils/util.js，使用内部 formatDate 和 calculateFlowers

const app = getApp(); // 获取 App 实例

Page({
  data: {
    records: [], // 存储记录
    filterType: 'all', // 筛选类型：'all', 'high' (>=85), 'low' (<85)
    page: 1, // 当前页码
    pageSize: 10, // 每页记录数
    hasMore: false, // 是否有更多记录
    loading: false, // 是否正在加载
    readingRecords: [], // 存储格式化后的记录
    isLoading: true
  },

  // Page level properties
  touchStartX: 0,
  touchStartY: 0,
  currentTouchId: null,
  touchStartTime: 0,
  deleteBtnWidthPx: 0, 
  isDragging: false, 
  scrollDirectionDetermined: false, 
  isVerticalScroll: false, 

  onLoad: function(options) {
    console.log('[history.js onLoad] 页面加载');
    const systemInfo = wx.getSystemInfoSync();
    this.deleteBtnWidthPx = (160 / 750) * systemInfo.windowWidth;
    console.log('[history.js onLoad] Delete button width (px):', this.deleteBtnWidthPx);
  },

  onShow: function() {
    console.log('[history.js onShow] 页面显示');
    if (!app.globalData.userInfo) {
        wx.switchTab({ url: '/pages/student/profile/profile', fail: (err) => { console.error('跳转失败:', err); } });
        return;
    }
    console.log('[history.js onShow] 用户已登录，加载记录');
    this.resetAllItemsState();
    this.loadReadingRecords();
  },

  // Reset helper
  resetAllItemsState() {
      if (this.data.records && this.data.records.length > 0) {
          const resetRecords = this.data.records.map(r => ({ ...r, offsetX: 0, isOpened: false, disableTransition: false }));
          this.setData({ records: resetRecords });
      }
      this.resetTouchState();
  },

  // 加载记录
  loadReadingRecords: function(append = false) {
    console.log('[history.js] loading records, append:', append);
    this.setData({ loading: true }); 
    let allRecords = app.globalData.readingRecords || [];
    allRecords.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    let filteredRecords = allRecords.filter(record => record && record.type === 'recitation');
    const filterType = this.data.filterType;
    if (filterType === 'high') {
      filteredRecords = filteredRecords.filter(record => record.score >= 85);
    } else if (filterType === 'low') {
      filteredRecords = filteredRecords.filter(record => record.score < 85);
    }
    const page = append ? this.data.page + 1 : 1;
    const pageSize = this.data.pageSize;
    const startIndex = (page - 1) * pageSize;
    const endIndex = page * pageSize;
    const recordsToShow = filteredRecords.slice(startIndex, endIndex);
    const enhancedRecords = recordsToShow.map(record => {
      let formattedDate = '未知时间';
      try { formattedDate = this.formatDate(record.timestamp || Date.now()); } catch (e) { console.error(`Error formatting date:`, e); }
      return {
        id: record.id || `rec_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        articleId: record.articleId,
        articleTitle: record.articleTitle || '未知文章',
        score: record.score === undefined ? '--' : record.score, 
        timestamp: record.timestamp || Date.now(),
        type: record.type,
        formattedDate: formattedDate,
        offsetX: 0, // Initialize offsetX
        isOpened: false, // Initialize opened state
        disableTransition: false // Initialize transition state
      };
    });
    const finalRecords = append ? [...this.data.records, ...enhancedRecords] : enhancedRecords;
    this.setData({
      records: finalRecords,
      page: page,
      hasMore: endIndex < filteredRecords.length,
      loading: false,
      isLoading: false
    }, () => { console.log(`[history.js] setData done. Records count: ${this.data.records.length}`); });
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
      return `${year}-${month}-${day} ${hours}:${minutes}`
    } catch (e) {
      console.error('[history.js formatDate] Error formatting timestamp:', timestamp, e);
      return '时间格式错误';
    }
  },

  // 切换顶部筛选标签 (如果需要保留)
  changeFilterType: function(e) {
    const type = e.currentTarget.dataset.type;
    if (type !== this.data.filterType) {
      this.resetAllItemsState(); 
      this.setData({ filterType: type, page: 1, records: [], hasMore: false, loading: false, isLoading: true });
      this.loadReadingRecords();
    }
  },

  // 页面滚动到底部时加载更多（如果需要保留，并在 WXML 中绑定 `bindscrolltolower`）
  loadMore() { if (!this.data.hasMore || this.data.loading) { return; } this.loadReadingRecords(true); },
   
  // --- 重新添加：查看记录详情 --- 
  viewRecordDetail: function(e) {
    if (this.isDragging) { 
        this.isDragging = false; 
        console.log('[history.js] Drag, prevent nav.');
        return;
    }
    try { const recordId = e.currentTarget.dataset.id; if (!recordId) { wx.showToast({ title: '无法获取ID', icon: 'none' }); return; } const url = '/pages/student/history/detail?id=' + recordId; wx.navigateTo({ url: url, fail: (err) => { console.error('nav failed:', err); wx.showToast({ title: '无法打开', icon: 'none' }); } }); } catch (error) { console.error('nav error:', error); wx.showToast({ title: '出错', icon: 'none' }); }
  },

  // --- Touch Event Handlers ---
  handleTouchStart(e) {
    if (e.touches.length !== 1) return; 
    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY; 
    this.currentTouchId = e.currentTarget.dataset.id;
    this.touchStartTime = Date.now();
    this.isDragging = false; 
    this.scrollDirectionDetermined = false; 
    this.isVerticalScroll = false; 
    console.log(`[TouchStart] ID: ${this.currentTouchId}, X: ${this.touchStartX}`);

    // Disable transition for the touched item
    const index = this.data.records.findIndex(r => r.id === this.currentTouchId);
    if (index !== -1) {
        this.setData({ [`records[${index}].disableTransition`]: true });
    }
  },

  handleTouchMove(e) {
    if (e.touches.length !== 1 || !this.currentTouchId) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - this.touchStartX;
    const deltaY = currentY - this.touchStartY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    console.log(`[TouchMove] ID: ${this.currentTouchId}, dX: ${deltaX.toFixed(1)}, dY: ${deltaY.toFixed(1)}`);

    // Determine scroll direction
    if (!this.scrollDirectionDetermined) {
      const moveThreshold = 5; 
      if (absDeltaX > moveThreshold || absDeltaY > moveThreshold) {
        this.isVerticalScroll = absDeltaY > absDeltaX;
        this.scrollDirectionDetermined = true;
        console.log(`[TouchMove] Determined as ${this.isVerticalScroll ? 'VERTICAL' : 'HORIZONTAL'}`);
      }
    }

    if (this.isVerticalScroll) return; // Allow page scroll

    // --- Horizontal Swipe Logic --- 
    this.isDragging = true; 
    const index = this.data.records.findIndex(r => r.id === this.currentTouchId);
    if (index === -1) return;

    let offsetX = deltaX;
    if (this.data.records[index].isOpened) {
        offsetX = deltaX - this.deleteBtnWidthPx;
    }
    offsetX = Math.min(0, Math.max(-this.deleteBtnWidthPx, offsetX)); 

    // Update offsetX directly
    this.setData({ [`records[${index}].offsetX`]: offsetX });
  },

  handleTouchEnd(e) {
    if (!this.currentTouchId) return; 
    const id = this.currentTouchId; // Keep id for later use
    console.log(`[TouchEnd] ID: ${id}, isVertical: ${this.isVerticalScroll}`);

    if (this.isVerticalScroll) {
        this.resetTouchState();
        // Re-enable transition if disabled
        const index = this.data.records.findIndex(r => r.id === id);
        if (index !== -1 && this.data.records[index].disableTransition) {
            this.setData({ [`records[${index}].disableTransition`]: false });
        }
        return;
    }

    const index = this.data.records.findIndex(r => r.id === id);
    if (index === -1) {
        this.resetTouchState();
        return;
    }

    const record = this.data.records[index];
    const currentOffsetX = record.offsetX || 0; // Use offsetX from data
    const threshold = -this.deleteBtnWidthPx / 2; 
    let targetOffsetX = 0;
    let targetIsOpened = false;

    if (currentOffsetX < threshold) {
      targetOffsetX = -this.deleteBtnWidthPx;
      targetIsOpened = true;
    } else {
      targetOffsetX = 0;
      targetIsOpened = false;
    }

    console.log(`[TouchEnd] Setting final offsetX: ${targetOffsetX}, isOpened: ${targetIsOpened}`);

    // Set final offsetX and re-enable transition
    this.setData({
      [`records[${index}].offsetX`]: targetOffsetX,
      [`records[${index}].isOpened`]: targetIsOpened,
      [`records[${index}].disableTransition`]: false // Re-enable transition
    });

    this.resetTouchState();
  },
  
  // Reset helper
  resetTouchState() {
    this.currentTouchId = null;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchStartTime = 0;
    this.scrollDirectionDetermined = false;
    this.isVerticalScroll = false;
  },

  // 处理删除
  handleDelete(e) {
    const id = e.currentTarget.dataset.id;
    console.log('[history.js handleDelete] Tapped delete for ID:', id);
    if (!id) { console.error('Missing id.'); return; }

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      confirmColor: '#ff4d4f',
      success: (res) => {
        if (res.confirm) {
          // ... (Deletion logic remains the same) ...
          let updatedRecords = app.globalData.readingRecords.filter(r => r.id !== id);
          app.globalData.readingRecords = updatedRecords;
          app.saveReadingRecordsToStorage();
          const currentRecords = this.data.records.filter(r => r.id !== id);
          this.setData({ records: currentRecords }, () => { wx.showToast({ title: '删除成功', icon: 'success' }); });
        } else if (res.cancel) {
          // Restore position using offsetX and disableTransition
          const index = this.data.records.findIndex(r => r.id === id);
          if (index !== -1) {
            this.setData({
              [`records[${index}].offsetX`]: 0,
              [`records[${index}].isOpened`]: false,
              [`records[${index}].disableTransition`]: false // Ensure transition is enabled
            });
          }
        }
      },
      fail: (err) => { console.error('modal fail:', err); wx.showToast({ title: '操作失败', icon: 'none' }); }
    });
  }
})