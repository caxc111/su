// article-edit.js - 文章编辑页
const app = getApp();

Page({
  data: {
    id: '', // 文章ID，如果存在则是编辑模式，否则是新增模式
    title: '', // 文章标题
    content: '', // 文章内容
    language: '中文', // 文章语言，默认中文
    level: '入门', // 文章难度级别
    lessonNo: '', // 课文编号
    isLoading: false, // 是否在加载或保存中
    isEditing: false, // 是否是编辑模式
    languages: ['中文', '英文'], // 可选语言
    levels: ['入门', '初级', '中级', '高级'] // 可选难度级别
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 如果有文章ID，则是编辑模式
    if (options.id) {
      this.setData({
        id: options.id,
        isEditing: true
      });
      // 加载文章数据
      this.loadArticle(options.id);
    }
  },

  /**
   * 加载文章数据
   */
  loadArticle: function (id) {
    // 设置加载状态
    this.setData({ isLoading: true });

    try {
      // 从本地存储获取所有文章
      const articles = wx.getStorageSync('articles') || [];
      // 查找指定ID的文章
      const article = articles.find(item => item.id === id);

      if (article) {
        // 更新页面数据
        this.setData({
          title: article.title,
          content: article.content,
          language: article.language || '中文',
          level: article.level || '入门',
          lessonNo: article.lessonNo || '',
          isLoading: false
        });
      } else {
        // 未找到文章
        wx.showToast({
          title: '未找到文章',
          icon: 'none'
        });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }
    } catch (error) {
      console.error('加载文章失败:', error);
      wx.showToast({
        title: '加载文章失败',
        icon: 'none'
      });
      this.setData({ isLoading: false });
    }
  },

  /**
   * 处理输入事件
   */
  handleInput: function (e) {
    const { field } = e.currentTarget.dataset;
    const value = e.detail.value;
    
    this.setData({
      [field]: value
    });
  },

  /**
   * 选择语言
   */
  selectLanguage: function (e) {
    this.setData({
      language: this.data.languages[e.detail.value]
    });
  },

  /**
   * 选择难度级别
   */
  selectLevel: function (e) {
    this.setData({
      level: this.data.levels[e.detail.value]
    });
  },

  /**
   * 保存文章
   */
  saveArticle: function () {
    // 验证输入
    if (!this.data.title.trim()) {
      wx.showToast({
        title: '请输入文章标题',
        icon: 'none'
      });
      return;
    }

    if (!this.data.content.trim()) {
      wx.showToast({
        title: '请输入文章内容',
        icon: 'none'
      });
      return;
    }

    // 设置加载状态
    this.setData({ isLoading: true });

    try {
      // 从本地存储获取所有文章
      const articles = wx.getStorageSync('articles') || [];
      
      // 计算字数
      const wordCount = this.data.content.length;
      
      // 如果是编辑模式
      if (this.data.isEditing) {
        // 查找文章索引
        const index = articles.findIndex(item => item.id === this.data.id);
        
        if (index !== -1) {
          // 更新文章
          articles[index] = {
            ...articles[index],
            title: this.data.title,
            content: this.data.content,
            language: this.data.language,
            level: this.data.level,
            lessonNo: this.data.lessonNo,
            wordCount,
            updateTime: Date.now()
          };
        } else {
          // 未找到文章，显示错误
          wx.showToast({
            title: '未找到要编辑的文章',
            icon: 'none'
          });
          this.setData({ isLoading: false });
          return;
        }
      } else {
        // 新增模式，生成新ID
        const newArticle = {
          id: 'article_' + Date.now(),
          title: this.data.title,
          content: this.data.content,
          language: this.data.language,
          level: this.data.level,
          lessonNo: this.data.lessonNo,
          wordCount,
          timestamp: Date.now(),
          updateTime: Date.now()
        };
        
        // 添加到数组
        articles.push(newArticle);
      }
      
      // 保存到本地存储
      wx.setStorageSync('articles', articles);
      
      // 显示成功提示
      wx.showToast({
        title: this.data.isEditing ? '保存成功' : '添加成功',
        icon: 'success'
      });
      
      // 延迟返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (error) {
      console.error('保存文章失败:', error);
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
      this.setData({ isLoading: false });
    }
  },

  /**
   * 返回上一页
   */
  goBack: function () {
    wx.navigateBack();
  }
}); 