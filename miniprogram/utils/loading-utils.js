/**
 * loading-utils.js
 * 加载框显示与隐藏的工具函数
 */

// 存储当前显示的loading状态
let loadingCount = 0;

/**
 * 显示加载框
 * @param {Object} options - 配置选项
 * @param {string} options.title - 加载框提示文字
 * @param {boolean} options.mask - 是否显示透明蒙层
 * @returns {void}
 */
function showLoading(options = { title: '加载中...', mask: true }) {
  if (loadingCount === 0) {
    wx.showLoading({
      title: options.title || '加载中...',
      mask: options.mask !== false,
    });
  }
  
  loadingCount++;
  console.log('[LoadingUtils] 显示loading，当前计数:', loadingCount);
}

/**
 * 隐藏加载框
 * @param {boolean} forceHide - 是否强制隐藏所有loading
 * @returns {void}
 */
function hideLoading(forceHide = false) {
  if (forceHide) {
    if (loadingCount > 0) {
      wx.hideLoading();
      loadingCount = 0;
      console.log('[LoadingUtils] 强制隐藏所有loading');
    }
    return;
  }
  
  loadingCount = Math.max(0, loadingCount - 1);
  console.log('[LoadingUtils] 隐藏loading，当前计数:', loadingCount);
  
  if (loadingCount === 0) {
    wx.hideLoading();
  }
}

/**
 * 隐藏所有界面上的交互提示（loading、toast、modal等）
 * @returns {void}
 */
function hideAllInteractions() {
  try {
    // 关闭loading提示
    wx.hideLoading();
    loadingCount = 0;
    
    // 关闭toast提示
    wx.hideToast();
    
    // 尝试关闭模态对话框（API可能不存在）
    wx.hideModal && wx.hideModal();
    
    // 尝试关闭操作菜单（API可能不存在）
    wx.hideActionSheet && wx.hideActionSheet();
    
    console.log('[LoadingUtils] 已隐藏所有界面交互');
  } catch (e) {
    console.error('[LoadingUtils] 隐藏界面交互时出错:', e);
  }
}

module.exports = {
  showLoading,
  hideLoading,
  hideAllInteractions
}; 