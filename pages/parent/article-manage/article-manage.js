Page({
  data: {
    articles: [],
    currentLang: 'all',
    showAddModal: false,
    isEditing: false,
    editArticle: {
      title: '',
      language: 'zh',
      content: ''
    }
  },
  
  onLoad() {
    this.loadArticles();
  },
  
  onShow() {
    // 每次显示页面时重新加载文章列表
    this.loadArticles();
  },
  
  loadArticles() {
    const app = getApp();
    // 使用全局数据
    let articles = app.globalData.articles || [];
    
    console.log('全局文章数据:', JSON.stringify(app.globalData.articles));
    
    if (articles.length === 0) {
      // 如果全局数据为空，添加默认示例文章
      app.initSampleData();
      articles = app.globalData.articles || [];
    }
    
    // 为了保持兼容性，转换字段名
    articles = articles.map(item => {
      console.log('处理单篇文章:', item);
      return {
        _id: item.id,
        title: item.title || '未命名文章',
        content: item.content || '无内容', // 确保content有默认值
        language: item.language || 'zh',
        createTime: item.createdAt || new Date().toISOString().split('T')[0]
      };
    });
    
    console.log('处理后的文章数据:', JSON.stringify(articles));
    
    // 根据语言筛选
    if (this.data.currentLang !== 'all') {
      articles = articles.filter(article => 
        article.language === this.data.currentLang
      );
    }
    
    this.setData({
      articles
    });
    
    // 打印设置后的数据以检查
    console.log('页面数据中的文章:', JSON.stringify(this.data.articles));
  },
  
  filterByLang(e) {
    const lang = e.currentTarget.dataset.lang;
    this.setData({
      currentLang: lang
    }, () => {
      this.loadArticles();
    });
  },
  
  showAddArticleModal() {
    this.setData({
      showAddModal: true,
      isEditing: false,
      editArticle: {
        title: '',
        language: 'zh',
        content: ''
      }
    });
  },
  
  hideAddArticleModal() {
    this.setData({
      showAddModal: false
    });
  },
  
  editArticle(e) {
    const id = e.currentTarget.dataset.id;
    const article = this.data.articles.find(item => item._id === id);
    
    this.setData({
      isEditing: true,
      showAddModal: true,
      editArticle: {
        _id: article._id,
        title: article.title,
        language: article.language,
        content: article.content
      }
    });
  },
  
  deleteArticle(e) {
    const id = e.currentTarget.dataset.id;
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这篇文章吗？删除后无法恢复',
      confirmColor: '#ff0000',
      success: res => {
        if (res.confirm) {
          // 模拟删除操作
          const updatedArticles = this.data.articles.filter(item => item._id !== id);
          this.setData({
            articles: updatedArticles
          });
          
          wx.showToast({
            title: '删除成功'
          });
        }
      }
    });
  },
  
  onInputTitle(e) {
    this.setData({
      'editArticle.title': e.detail.value
    });
  },
  
  onSelectLang(e) {
    this.setData({
      'editArticle.language': e.detail.value
    });
  },
  
  onInputContent(e) {
    this.setData({
      'editArticle.content': e.detail.value
    });
  },
  
  saveArticle() {
    const { title, language, content } = this.data.editArticle;
    
    if (!title || !content) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({ title: '保存中' });
    
    // 模拟保存过程
    setTimeout(() => {
      wx.hideLoading();
      
      let updatedArticles = [];
      const app = getApp();
      
      if (this.data.isEditing) {
        // 编辑现有文章
        updatedArticles = this.data.articles.map(item => {
          if (item._id === this.data.editArticle._id) {
            return {
              ...item,
              title,
              language,
              content
            };
          }
          return item;
        });
        
        // 同步更新全局数据
        app.globalData.articles = app.globalData.articles.map(item => {
          if (item.id === this.data.editArticle._id) {
            return {
              ...item,
              title,
              language,
              content
            };
          }
          return item;
        });
      } else {
        // 添加新文章
        const newId = `${Date.now()}`; // 生成临时ID
        const newArticle = {
          _id: newId,
          title,
          language,
          content,
          createTime: new Date().toISOString().split('T')[0] // 格式化日期
        };
        
        updatedArticles = [newArticle, ...this.data.articles];
        
        // 同步更新全局数据
        app.globalData.articles.unshift({
          id: newId,
          title,
          language,
          content,
          createdAt: new Date().toISOString().split('T')[0],
          level: language === 'zh' ? '初级' : 'Elementary'
        });
      }
      
      this.setData({
        articles: updatedArticles,
        showAddModal: false
      });
      
      wx.showToast({
        title: this.data.isEditing ? '更新成功' : '添加成功'
      });
    }, 1000);
  }
});