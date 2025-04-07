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
    },
    currentArticle: null,
    showActionPanel: false
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
    
    // 为了保持兼容性，转换字段名并使用一致的 id 字段
    articles = articles.map(item => {
      console.log('处理单篇文章:', item);
      return {
        id: item.id, // 使用 id 而不是 _id
        title: item.title || '未命名文章',
        content: item.content || '无内容', // 确保content有默认值
        language: item.language || 'zh',
        createTime: item.createdAt || new Date().toISOString().split('T')[0],
        section: item.section || ''
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
    const article = this.data.articles.find(item => item.id === id);
    
    this.setData({
      isEditing: true,
      showAddModal: true,
      editArticle: {
        id: article.id, // 使用 id 而不是 _id
        title: article.title,
        language: article.language,
        content: article.content
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
          if (item.id === this.data.editArticle.id) { // 使用 id 而不是 _id
            return {
              ...item,
              title,
              language,
              content,
              section: item.section
            };
          }
          return item;
        });
        
        // 同步更新全局数据
        app.globalData.articles = app.globalData.articles.map(item => {
          if (item.id === this.data.editArticle.id) { // 使用 id 匹配
            return {
              ...item,
              title,
              language,
              content,
              section: item.section
            };
          }
          return item;
        });
      } else {
        // 添加新文章
        const newId = `${Date.now()}`; // 生成临时ID
        const newArticle = {
          id: newId, // 使用 id 而不是 _id
          title,
          language,
          content,
          section: '',
          createTime: new Date().toISOString().split('T')[0] // 格式化日期
        };
        
        updatedArticles = [newArticle, ...this.data.articles];
        
        // 同步更新全局数据
        app.globalData.articles.unshift({
          id: newId,
          title,
          language,
          content,
          section: '',
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
        section: '',
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
  },
  
  // 文章操作相关函数
  showArticleOptions(e) {
    const id = e.currentTarget.dataset.id;
    const article = this.data.articles.find(item => item.id === id);
    if (article) {
      this.setData({
        showActionPanel: true,
        currentArticle: {
          id: article.id,
          title: article.title
        }
      });
    }
  },

  hideActionPanel() {
    this.setData({
      showActionPanel: false,
      currentArticle: null
    });
  },

  handleDeleteArticle(e) {
    const article = e.detail.article || this.data.currentArticle;
    if (!article) return;
    
    wx.showModal({
      title: '确认删除',
      content: `确定要删除文章"${article.title}"吗？`,
      success: (res) => {
        if (res.confirm) {
          console.log('删除文章:', article);
          
          // 从全局数据中删除文章
          const app = getApp();
          app.globalData.articles = app.globalData.articles.filter(item => item.id !== article.id);
          
          // 保存到本地存储
          app.saveArticlesToStorage();
          
          // 更新页面数据
          const updatedArticles = this.data.articles.filter(item => item.id !== article.id);
          this.setData({
            articles: updatedArticles,
            // 直接基于 updatedArticles 和 currentLang 筛选
            filteredArticles: updatedArticles.filter(item => 
              this.data.currentLang === 'all' || item.language === this.data.currentLang
            ),
            showActionPanel: false
          });
          
          // 显示删除成功提示
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
        }
      }
    });
  },
  
  handleShareArticle(e) {
    const article = e.detail.article || this.data.currentArticle;
    if (!article) return;
    
    // 隐藏操作面板
    this.hideActionPanel();
    
    // 显示功能开发中的提示
    wx.showToast({
      title: '分享功能开发中',
      icon: 'none'
    });
  },
  
  handleCollectArticle(e) {
    const article = e.detail.article || this.data.currentArticle;
    if (!article) return;
    
    // 隐藏操作面板
    this.hideActionPanel();
    
    // 显示功能开发中的提示
    wx.showToast({
      title: '收藏功能开发中',
      icon: 'none'
    });
  },
  
  handleArticleSave(e) {
    // 接收编辑器组件返回的数据
    const article = e.detail;
    console.log('保存文章:', article);
    
    if (!article.title || !article.content) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      });
      return;
    }
    
    wx.showLoading({ title: '保存中' });
    
    let updatedArticles = [...this.data.articles];
    const app = getApp();
    
    if (this.data.isEditing) {
      // 更新现有文章
      const index = updatedArticles.findIndex(item => item.id === this.data.editArticle.id);
      if (index !== -1) {
        updatedArticles[index] = {
          ...updatedArticles[index], // 保留其他字段
          title: article.title,
          language: article.language,
          content: article.content,
          section: updatedArticles[index].section
        };
        
        // 更新全局数据
        const globalIndex = app.globalData.articles.findIndex(item => item.id === this.data.editArticle.id);
        if (globalIndex !== -1) {
          app.globalData.articles[globalIndex] = {
            ...app.globalData.articles[globalIndex],
            title: article.title,
            language: article.language,
            content: article.content,
            section: updatedArticles[index].section
          };
        }
      }
    } else {
      // 添加新文章
      const newId = 'art_' + Date.now();
      const newArticle = {
        id: newId,
        title: article.title,
        language: article.language,
        content: article.content,
        section: '',
        createTime: new Date().toISOString().split('T')[0],
        level: article.language === 'zh' ? '初级' : 'Elementary'
      };
      
      // 添加到本地数据
      updatedArticles.unshift(newArticle);
      
      // 添加到全局数据
      app.globalData.articles.unshift({
        id: newId,
        title: article.title,
        language: article.language,
        content: article.content,
        section: '',
        createdAt: new Date().toISOString().split('T')[0],
        level: article.language === 'zh' ? '初级' : 'Elementary'
      });
    }
    
    // 保存到本地存储
    app.saveArticlesToStorage();
    
    // 更新页面数据
    this.setData({
      articles: updatedArticles,
      filteredArticles: updatedArticles.filter(item => 
        this.data.currentLang === 'all' || item.language === this.data.currentLang
      ),
      showAddModal: false
    });
    
    wx.hideLoading();
    wx.showToast({
      title: this.data.isEditing ? '更新成功' : '添加成功',
      icon: 'success'
    });
  }
});