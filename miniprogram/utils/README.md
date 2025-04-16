# 顺口成章小程序工具函数

## loading-utils.js 使用指南

### 功能简介

`loading-utils.js` 提供了对微信小程序 loading 加载框的封装管理，解决了以下问题：

1. showLoading 和 hideLoading 必须配对使用的问题
2. 多个地方同时调用 showLoading 时的冲突问题
3. 异常情况下 loading 无法关闭的问题

### 使用方法

#### 1. 引入工具函数

```javascript
const loadingUtils = require('../../utils/loading-utils');
```

#### 2. 显示loading

```javascript
// 默认参数
loadingUtils.showLoading();

// 自定义参数
loadingUtils.showLoading({
  title: '提交中...',
  mask: true
});
```

#### 3. 隐藏loading

```javascript
// 正常隐藏（与showLoading配对）
loadingUtils.hideLoading();

// 强制隐藏所有loading（用于异常情况）
loadingUtils.hideLoading(true);
```

#### 4. 隐藏所有界面交互

```javascript
// 隐藏所有loading、toast、modal等
loadingUtils.hideAllInteractions();
```

### 最佳实践

#### 1. try-catch-finally 结构中使用

```javascript
async function handleSubmit() {
  loadingUtils.showLoading({ title: '提交中...' });
  
  try {
    // 异步操作
    await submitData();
    wx.showToast({ title: '提交成功' });
  } catch (error) {
    console.error('提交失败:', error);
    wx.showToast({ 
      title: '提交失败，请重试', 
      icon: 'none' 
    });
  } finally {
    // 确保loading被关闭
    loadingUtils.hideLoading();
  }
}
```

#### 2. 生命周期方法中关闭loading

```javascript
onHide() {
  // 页面隐藏时关闭所有交互提示
  loadingUtils.hideAllInteractions();
},

onUnload() {
  // 页面卸载时关闭所有交互提示
  loadingUtils.hideAllInteractions();
}
```

#### 3. Promise链中使用

```javascript
loadingUtils.showLoading();

fetchData()
  .then(processData)
  .then(showResult)
  .catch(handleError)
  .finally(() => {
    loadingUtils.hideLoading();
  });
```

### 注意事项

1. 每次调用`showLoading`必须对应调用一次`hideLoading`
2. 页面跳转前应调用`hideAllInteractions`
3. 在可能发生异常的代码中，使用`try-catch-finally`确保loading被关闭
4. 在页面的`onHide`和`onUnload`生命周期中调用`hideAllInteractions`
5. 如果遇到loading无法关闭的情况，可使用`hideLoading(true)`强制关闭 