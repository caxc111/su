// pages/article-input/article-input.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 文章信息
    article: {
      id: '', // 新文章不需要ID，保存时生成
      title: '',
      language: 'zh', // 默认中文
      level: '初级', // 默认初级
      content: '',
    },
    // 语言选项
    languages: [
      { value: 'zh', text: '中文' },
      { value: 'en', text: '英文' }
    ],
    // 难度选项
    levels: [
      { value: '初级', text: '初级' },
      { value: '中级', text: '中级' },
      { value: '高级', text: '高级' }
    ],
    isEdit: false, // 是否是编辑模式
    editId: '' // 编辑文章的ID
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 检查是否是编辑模式
    if (options.id) {
      this.setData({
        isEdit: true,
        editId: options.id
      });
      this.loadArticle(options.id);
    }
  },

  /**
   * 加载要编辑的文章
   */
  loadArticle(id) {
    const app = getApp();
    const articles = app.globalData.articles || [];
    const article = articles.find(item => item.id === id);
    
    if (article) {
      this.setData({
        article: { ...article }
      });
    } else {
      wx.showToast({
        title: '未找到文章',
        icon: 'none'
      });
      
      // 延迟返回
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },

  /**
   * 标题输入事件处理
   */
  onTitleInput(e) {
    this.setData({
      'article.title': e.detail.value
    });
  },

  /**
   * 语言选择事件处理
   */
  onLanguageChange(e) {
    this.setData({
      'article.language': e.detail.value
    });
  },

  /**
   * 难度选择事件处理
   */
  onLevelChange(e) {
    this.setData({
      'article.level': e.detail.value
    });
  },

  /**
   * 内容输入事件处理
   */
  onContentInput(e) {
    this.setData({
      'article.content': e.detail.value
    });
  },

  /**
   * 保存文章
   */
  saveArticle() {
    // 表单验证
    const { title, content } = this.data.article;
    if (!title.trim()) {
      wx.showToast({
        title: '请输入文章标题',
        icon: 'none'
      });
      return;
    }
    
    if (!content.trim()) {
      wx.showToast({
        title: '请输入文章内容',
        icon: 'none'
      });
      return;
    }
    
    // 显示加载提示
    wx.showLoading({
      title: '保存中...',
    });
    
    // 获取应用实例
    const app = getApp();
    
    // 准备文章数据
    const now = new Date();
    const article = {
      ...this.data.article,
      createdAt: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
      wordCount: this.data.article.language === 'zh' ? 
        (this.data.article.content || '').length : 
        (this.data.article.content || '').split(/\s+/).length
    };
    
    // 处理编辑或新增
    if (this.data.isEdit && this.data.editId) {
      // 编辑现有文章
      const articles = app.globalData.articles || [];
      const index = articles.findIndex(item => item.id === this.data.editId);
      
      if (index !== -1) {
        // 使用原ID
        article.id = this.data.editId;
        articles[index] = article;
      } else {
        // 找不到要编辑的文章，添加新文章
        article.id = Date.now().toString();
        articles.push(article);
      }
      
      app.globalData.articles = articles;
    } else {
      // 添加新文章
      const articles = app.globalData.articles || [];
      article.id = Date.now().toString();
      articles.unshift(article);
      app.globalData.articles = articles;
    }
    
    // 保存到本地存储
    try {
      app.saveArticlesToStorage();
      
      // 隐藏加载提示
      wx.hideLoading();
      
      // 显示成功提示
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });
      
      // 延迟返回
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (error) {
      console.error('保存文章失败:', error);
      wx.hideLoading();
      wx.showToast({
        title: '保存失败，请重试',
        icon: 'none'
      });
    }
  }
}) 