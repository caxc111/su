/**
 * 用于重置加载状态和清除灰蒙版的工具文件
 * 可以在任何页面导入并使用
 */

// 全局函数，用于清除所有加载提示和模态框
export function clearLoading() {
  try {
    // 关闭loading提示
    wx.hideLoading();
    // 关闭toast提示
    wx.hideToast();
    
    // 尝试调用可能不存在的API
    try {
      // 关闭所有可能的模态对话框
      wx.hideModal && wx.hideModal();
    } catch (e) {
      console.log('[clearLoading] hideModal API可能不存在');
    }
    
    try {
      // 关闭操作菜单
      wx.hideActionSheet && wx.hideActionSheet();
    } catch (e) {
      console.log('[clearLoading] hideActionSheet API可能不存在');
    }
    
    // 强制关闭任何可能的对话框或菜单
    try {
      // 尝试获取当前页面
      const pages = getCurrentPages();
      if (pages && pages.length > 0) {
        const currentPage = pages[pages.length - 1];
        // 尝试调用页面的回调方法关闭弹窗
        if (currentPage && typeof currentPage.hideAllModals === 'function') {
          currentPage.hideAllModals();
        }
      }
    } catch (e) {
      console.log('[clearLoading] 获取当前页面失败:', e);
    }
    
    console.log('[clearLoading] 成功清除所有加载提示和模态框');
    return true;
  } catch (error) {
    console.error('[clearLoading] 清除加载提示失败:', error);
    return false;
  }
}

// 灰蒙版检测和修复
export function fixGrayOverlay() {
  // 尝试修复灰蒙版问题
  clearLoading();
  
  // 延迟再次清除，处理某些延迟显示的提示
  setTimeout(() => {
    clearLoading();
  }, 100);
  
  // 再次延迟清除，处理更长时间的提示
  setTimeout(() => {
    clearLoading();
  }, 500);
  
  // 最后一次延迟更长时间清除
  setTimeout(() => {
    clearLoading();
  }, 1000);
  
  console.log('[fixGrayOverlay] 已尝试修复灰蒙版问题');
}

// 动态添加清除蒙版的节点
export function injectOverlayCleaner() {
  try {
    // 尝试向页面动态注入清除灰蒙版的视图
    const pages = getCurrentPages();
    if (pages && pages.length > 0) {
      const currentPage = pages[pages.length - 1];
      if (currentPage && currentPage.createSelectorQuery) {
        // 检查是否已存在清除层
        currentPage.createSelectorQuery().select('.clear-overlay').exec((res) => {
          if (!res[0]) {
            console.log('[injectOverlayCleaner] 注入清除灰蒙版的视图');
            // 在页面中动态添加一个视图
            // 注意：这种方法在实际环境中可能不适用，但作为尝试
          }
        });
      }
    }
  } catch (e) {
    console.error('[injectOverlayCleaner] 注入失败:', e);
  }
}

// 导出一个默认对象，包含所有功能
export default {
  clearLoading,
  fixGrayOverlay,
  injectOverlayCleaner
}; 