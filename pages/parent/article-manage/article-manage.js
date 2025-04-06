Page({
  data: {
    articles: [],
    filteredArticles: [],
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
    
    // 先保存全部文章
    this.setData({
      articles
    });
    
    // 然后根据语言筛选
    this.filterArticles();
  },
  
  filterArticles() {
    let filteredArticles = this.data.articles;
    
    // 根据语言筛选
    if (this.data.currentLang !== 'all') {
      filteredArticles = filteredArticles.filter(article => 
        article.language === this.data.currentLang
      );
    }
    
    console.log(`筛选后的${this.data.currentLang}文章:`, filteredArticles.length);
    
    this.setData({
      filteredArticles
    });
  },
  
  filterByLang(e) {
    const lang = e.currentTarget.dataset.lang;
    this.setData({
      currentLang: lang
    }, () => {
      this.filterArticles();
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
          const app = getApp();
          
          // 更新本地数据
          const updatedArticles = this.data.articles.filter(item => item._id !== id);
          this.setData({
            articles: updatedArticles
          }, () => {
            // 刷新筛选的文章列表
            this.filterArticles();
          });
          
          // 同步更新全局数据
          app.globalData.articles = app.globalData.articles.filter(item => item.id !== id);
          
          // 保存到本地存储，确保重启后数据保持
          app.saveArticlesToStorage();
          
          // 记录删除操作
          console.log('文章已删除，ID:', id);
          console.log('剩余文章数:', app.globalData.articles.length);
          
          wx.showToast({
            title: '删除成功'
          });
        }
      }
    });
  },
  
  // 处理文章编辑器组件的保存事件
  handleArticleSave(e) {
    const { title, language, content } = e.detail;
    
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
      
      // 保存到本地存储，确保重启后数据保持
      app.saveArticlesToStorage();
      
      this.setData({
        articles: updatedArticles,
        showAddModal: false
      }, () => {
        // 更新筛选文章列表
        this.filterArticles();
      });
      
      wx.showToast({
        title: this.data.isEditing ? '更新成功' : '添加成功'
      });
    }, 1000);
  },

  // 导入示例文章
  importSampleArticles() {
    wx.showModal({
      title: '导入示例文章',
      content: '确定要导入示例中英文文章吗？',
      success: (res) => {
        if (res.confirm) {
          // 执行导入操作
          this.performImport();
        }
      }
    });
  },
  
  performImport() {
    wx.showLoading({ title: '导入中' });
    
    // 示例中文文章
    const chineseArticles = [
      {
        title: '春望',
        language: 'zh',
        content: '国破山河在，城春草木深。感时花溅泪，恨别鸟惊心。烽火连三月，家书抵万金。白头搔更短，浑欲不胜簪。',
        level: '初级'
      },
      {
        title: '登鹳雀楼',
        language: 'zh',
        content: '白日依山尽，黄河入海流。欲穷千里目，更上一层楼。',
        level: '初级'
      },
      {
        title: '乡村四月',
        language: 'zh',
        content: '绿遍山原白满川，子规声里雨如烟。乡村四月闲人少，才了蚕桑又插田。',
        level: '中级'
      }
    ];
    
    // 示例英文文章
    const englishArticles = [
      {
        title: 'The Road Not Taken',
        language: 'en',
        content: 'Two roads diverged in a yellow wood,\nAnd sorry I could not travel both\nAnd be one traveler, long I stood\nAnd looked down one as far as I could\nTo where it bent in the undergrowth;',
        level: 'Intermediate'
      },
      {
        title: 'Hope is the Thing with Feathers',
        language: 'en',
        content: 'Hope is the thing with feathers\nThat perches in the soul,\nAnd sings the tune without the words,\nAnd never stops at all,',
        level: 'Elementary'
      },
      {
        title: 'The Lamb',
        language: 'en',
        content: 'Little Lamb, who made thee?\nDost thou know who made thee?\nGave thee life, and bid thee feed\nBy the stream and o\'er the mead;',
        level: 'Elementary'
      }
    ];
    
    // 合并所有示例文章
    const sampleArticles = [...chineseArticles, ...englishArticles];
    
    // 获取全局数据
    const app = getApp();
    let existingArticles = app.globalData.articles || [];
    
    // 为新文章生成唯一ID和创建日期
    const articlesToAdd = sampleArticles.map(article => {
      const newId = `sample_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      return {
        id: newId,
        title: article.title,
        language: article.language,
        content: article.content,
        level: article.level,
        createdAt: new Date().toISOString().split('T')[0]
      };
    });
    
    // 添加新文章到全局数据
    app.globalData.articles = [...articlesToAdd, ...existingArticles];
    
    // 保存到本地存储
    app.saveArticlesToStorage();
    
    // 刷新本页面数据
    this.loadArticles();
    
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({
        title: `成功导入${articlesToAdd.length}篇文章`,
        icon: 'success',
        duration: 2000
      });
    }, 500);
  }
});