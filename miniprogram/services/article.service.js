/**
 * 文章服务类
 * 负责文章的增删改查和数据管理
 */

// 文章类型常量
export const ARTICLE_TYPE = {
  ALL: 'all',          // 全部
  FAVORITE: 'favorite', // 收藏
  HISTORY: 'history'    // 历史
};

class ArticleService {
  constructor() {
    // 初始化文章列表
    this.articles = [];
    
    // 从本地缓存加载文章
    this.getArticlesFromStorage();
  }

  /**
   * 从本地存储获取文章
   */
  getArticlesFromStorage() {
    try {
      const articlesData = wx.getStorageSync('articles');
      if (articlesData) {
        this.articles = JSON.parse(articlesData);
      } else {
        // 如果没有数据，初始化空数组
        this.articles = [];
        this.saveArticlesToStorage();
      }
    } catch (e) {
      console.error('加载文章数据失败', e);
      this.articles = [];
    }
  }

  /**
   * 保存文章到本地存储
   */
  saveArticlesToStorage() {
    try {
      wx.setStorageSync('articles', JSON.stringify(this.articles));
    } catch (e) {
      console.error('保存文章数据失败', e);
    }
  }

  /**
   * 获取所有文章
   * @returns {Array} 文章列表
   */
  getAllArticles() {
    // 按照最后修改时间降序排序
    return [...this.articles].sort((a, b) => b.updateTime - a.updateTime);
  }

  /**
   * 根据类型获取文章
   * @param {string} type - 文章类型：all, favorite, history
   * @returns {Array} 文章列表
   */
  getArticlesByType(type) {
    let result = this.getAllArticles();
    
    switch (type) {
      case ARTICLE_TYPE.FAVORITE:
        result = result.filter(article => article.isFavorite);
        break;
      case ARTICLE_TYPE.HISTORY:
        result = result.filter(article => article.readCount > 0);
        break;
      case ARTICLE_TYPE.ALL:
      default:
        // 返回所有文章
        break;
    }
    
    return result;
  }

  /**
   * 根据ID获取文章
   * @param {string} id - 文章ID
   * @returns {Object|null} 文章对象，未找到时返回null
   */
  getArticleById(id) {
    return this.articles.find(article => article.id === id) || null;
  }

  /**
   * 添加文章
   * @param {Object} articleData - 文章数据
   * @param {string} articleData.title - 文章标题
   * @param {string} articleData.content - 文章内容
   * @param {string} [articleData.author] - 文章作者
   * @param {string} [articleData.source] - 文章来源
   * @returns {Object} 新增的文章对象
   */
  addArticle(articleData) {
    // 校验必填字段
    if (!articleData.title || !articleData.content) {
      throw new Error('文章标题和内容不能为空');
    }
    
    // 创建文章对象
    const now = Date.now();
    const wordCount = this.countWords(articleData.content);
    
    const newArticle = {
      id: `article_${now}_${Math.floor(Math.random() * 10000)}`,
      title: articleData.title,
      content: articleData.content,
      author: articleData.author || '',
      source: articleData.source || '',
      createTime: now,
      updateTime: now,
      readCount: 0,
      reciteCount: 0,
      lastReadTime: 0,
      isFavorite: false,
      wordCount,
      tags: articleData.tags || []
    };
    
    // 添加到数组中
    this.articles.push(newArticle);
    
    // 保存到存储
    this.saveArticlesToStorage();
    
    return newArticle;
  }

  /**
   * 更新文章
   * @param {string} id - 文章ID
   * @param {Object} updateData - 要更新的字段
   * @returns {Object|null} 更新后的文章对象，未找到时返回null
   */
  updateArticle(id, updateData) {
    const articleIndex = this.articles.findIndex(article => article.id === id);
    
    if (articleIndex === -1) {
      return null;
    }
    
    // 获取原文章
    const article = this.articles[articleIndex];
    
    // 更新字段
    const updatedArticle = {
      ...article,
      ...updateData,
      updateTime: Date.now()
    };
    
    // 如果更新了内容，需要重新计算字数
    if (updateData.content) {
      updatedArticle.wordCount = this.countWords(updateData.content);
    }
    
    // 更新数组
    this.articles[articleIndex] = updatedArticle;
    
    // 保存到存储
    this.saveArticlesToStorage();
    
    return updatedArticle;
  }

  /**
   * 删除文章
   * @param {string} id - 文章ID
   * @returns {boolean} 是否成功删除
   */
  deleteArticle(id) {
    const initialLength = this.articles.length;
    this.articles = this.articles.filter(article => article.id !== id);
    
    // 如果长度变化，说明删除成功
    if (initialLength !== this.articles.length) {
      this.saveArticlesToStorage();
      return true;
    }
    
    return false;
  }

  /**
   * 切换文章收藏状态
   * @param {string} id - 文章ID
   * @returns {Object|null} 更新后的文章对象，未找到时返回null
   */
  toggleFavorite(id) {
    const article = this.getArticleById(id);
    
    if (!article) {
      return null;
    }
    
    // 切换收藏状态
    return this.updateArticle(id, {
      isFavorite: !article.isFavorite
    });
  }

  /**
   * 更新文章阅读时间
   * @param {string} id - 文章ID
   * @returns {Object|null} 更新后的文章对象，未找到时返回null
   */
  updateReadTime(id) {
    const article = this.getArticleById(id);
    
    if (!article) {
      return null;
    }
    
    // 更新阅读时间和次数
    return this.updateArticle(id, {
      lastReadTime: Date.now(),
      readCount: article.readCount + 1
    });
  }

  /**
   * 更新文章背诵次数
   * @param {string} id - 文章ID
   * @returns {Object|null} 更新后的文章对象，未找到时返回null
   */
  updateReciteCount(id) {
    const article = this.getArticleById(id);
    
    if (!article) {
      return null;
    }
    
    // 更新背诵次数
    return this.updateArticle(id, {
      reciteCount: article.reciteCount + 1
    });
  }

  /**
   * 统计文本字数
   * @param {string} content - 文本内容
   * @returns {number} 字数
   */
  countWords(content) {
    if (!content) return 0;
    
    // 移除标点符号和空格，然后计算字符数
    // 注：这种方法对中文比较合适，对英文会将整个单词算作一个字
    const cleanText = content.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '');
    return cleanText.length;
  }

  /**
   * 导入文章列表
   * @param {Array} articles - 要导入的文章数组
   * @returns {number} 成功导入的文章数量
   */
  importArticles(articles) {
    if (!Array.isArray(articles) || articles.length === 0) {
      return 0;
    }
    
    let importCount = 0;
    
    // 遍历导入
    articles.forEach(article => {
      try {
        this.addArticle({
          title: article.title || '未命名文章',
          content: article.content || '',
          author: article.author || '',
          source: article.source || '',
          tags: article.tags || []
        });
        importCount++;
      } catch (e) {
        console.error('导入文章失败', article, e);
      }
    });
    
    return importCount;
  }

  /**
   * 导出所有文章
   * @returns {Array} 所有文章的数组
   */
  exportArticles() {
    return this.getAllArticles();
  }

  /**
   * 搜索文章
   * @param {string} keyword - 搜索关键词
   * @returns {Array} 匹配的文章列表
   */
  searchArticles(keyword) {
    if (!keyword) {
      return this.getAllArticles();
    }
    
    // 转为小写进行不区分大小写的搜索
    const lowerKeyword = keyword.toLowerCase();
    
    return this.getAllArticles().filter(article => {
      const titleMatch = article.title.toLowerCase().includes(lowerKeyword);
      const contentMatch = article.content.toLowerCase().includes(lowerKeyword);
      const authorMatch = article.author.toLowerCase().includes(lowerKeyword);
      
      return titleMatch || contentMatch || authorMatch;
    });
  }

  /**
   * 获取阅读统计数据
   * @returns {Object} 统计数据
   */
  getReadingStats() {
    // 计算总阅读次数
    const totalReadCount = this.articles.reduce((sum, article) => sum + article.readCount, 0);
    
    // 计算总背诵次数
    const totalReciteCount = this.articles.reduce((sum, article) => sum + article.reciteCount, 0);
    
    // 计算总字数
    const totalWordCount = this.articles.reduce((sum, article) => sum + article.wordCount, 0);
    
    // 计算收藏数量
    const favoriteCount = this.articles.filter(article => article.isFavorite).length;
    
    // 计算最近一周阅读的文章数
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentReadCount = this.articles.filter(article => article.lastReadTime > oneWeekAgo).length;
    
    return {
      articleCount: this.articles.length,
      totalReadCount,
      totalReciteCount,
      totalWordCount,
      favoriteCount,
      recentReadCount
    };
  }
}

// 导出单例实例
const articleService = new ArticleService();
export default articleService; 
 * 文章服务类
 * 负责文章的增删改查和数据管理
 */

// 文章类型常量
export const ARTICLE_TYPE = {
  ALL: 'all',          // 全部
  FAVORITE: 'favorite', // 收藏
  HISTORY: 'history'    // 历史
};

class ArticleService {
  constructor() {
    // 初始化文章列表
    this.articles = [];
    
    // 从本地缓存加载文章
    this.getArticlesFromStorage();
  }

  /**
   * 从本地存储获取文章
   */
  getArticlesFromStorage() {
    try {
      const articlesData = wx.getStorageSync('articles');
      if (articlesData) {
        this.articles = JSON.parse(articlesData);
      } else {
        // 如果没有数据，初始化空数组
        this.articles = [];
        this.saveArticlesToStorage();
      }
    } catch (e) {
      console.error('加载文章数据失败', e);
      this.articles = [];
    }
  }

  /**
   * 保存文章到本地存储
   */
  saveArticlesToStorage() {
    try {
      wx.setStorageSync('articles', JSON.stringify(this.articles));
    } catch (e) {
      console.error('保存文章数据失败', e);
    }
  }

  /**
   * 获取所有文章
   * @returns {Array} 文章列表
   */
  getAllArticles() {
    // 按照最后修改时间降序排序
    return [...this.articles].sort((a, b) => b.updateTime - a.updateTime);
  }

  /**
   * 根据类型获取文章
   * @param {string} type - 文章类型：all, favorite, history
   * @returns {Array} 文章列表
   */
  getArticlesByType(type) {
    let result = this.getAllArticles();
    
    switch (type) {
      case ARTICLE_TYPE.FAVORITE:
        result = result.filter(article => article.isFavorite);
        break;
      case ARTICLE_TYPE.HISTORY:
        result = result.filter(article => article.readCount > 0);
        break;
      case ARTICLE_TYPE.ALL:
      default:
        // 返回所有文章
        break;
    }
    
    return result;
  }

  /**
   * 根据ID获取文章
   * @param {string} id - 文章ID
   * @returns {Object|null} 文章对象，未找到时返回null
   */
  getArticleById(id) {
    return this.articles.find(article => article.id === id) || null;
  }

  /**
   * 添加文章
   * @param {Object} articleData - 文章数据
   * @param {string} articleData.title - 文章标题
   * @param {string} articleData.content - 文章内容
   * @param {string} [articleData.author] - 文章作者
   * @param {string} [articleData.source] - 文章来源
   * @returns {Object} 新增的文章对象
   */
  addArticle(articleData) {
    // 校验必填字段
    if (!articleData.title || !articleData.content) {
      throw new Error('文章标题和内容不能为空');
    }
    
    // 创建文章对象
    const now = Date.now();
    const wordCount = this.countWords(articleData.content);
    
    const newArticle = {
      id: `article_${now}_${Math.floor(Math.random() * 10000)}`,
      title: articleData.title,
      content: articleData.content,
      author: articleData.author || '',
      source: articleData.source || '',
      createTime: now,
      updateTime: now,
      readCount: 0,
      reciteCount: 0,
      lastReadTime: 0,
      isFavorite: false,
      wordCount,
      tags: articleData.tags || []
    };
    
    // 添加到数组中
    this.articles.push(newArticle);
    
    // 保存到存储
    this.saveArticlesToStorage();
    
    return newArticle;
  }

  /**
   * 更新文章
   * @param {string} id - 文章ID
   * @param {Object} updateData - 要更新的字段
   * @returns {Object|null} 更新后的文章对象，未找到时返回null
   */
  updateArticle(id, updateData) {
    const articleIndex = this.articles.findIndex(article => article.id === id);
    
    if (articleIndex === -1) {
      return null;
    }
    
    // 获取原文章
    const article = this.articles[articleIndex];
    
    // 更新字段
    const updatedArticle = {
      ...article,
      ...updateData,
      updateTime: Date.now()
    };
    
    // 如果更新了内容，需要重新计算字数
    if (updateData.content) {
      updatedArticle.wordCount = this.countWords(updateData.content);
    }
    
    // 更新数组
    this.articles[articleIndex] = updatedArticle;
    
    // 保存到存储
    this.saveArticlesToStorage();
    
    return updatedArticle;
  }

  /**
   * 删除文章
   * @param {string} id - 文章ID
   * @returns {boolean} 是否成功删除
   */
  deleteArticle(id) {
    const initialLength = this.articles.length;
    this.articles = this.articles.filter(article => article.id !== id);
    
    // 如果长度变化，说明删除成功
    if (initialLength !== this.articles.length) {
      this.saveArticlesToStorage();
      return true;
    }
    
    return false;
  }

  /**
   * 切换文章收藏状态
   * @param {string} id - 文章ID
   * @returns {Object|null} 更新后的文章对象，未找到时返回null
   */
  toggleFavorite(id) {
    const article = this.getArticleById(id);
    
    if (!article) {
      return null;
    }
    
    // 切换收藏状态
    return this.updateArticle(id, {
      isFavorite: !article.isFavorite
    });
  }

  /**
   * 更新文章阅读时间
   * @param {string} id - 文章ID
   * @returns {Object|null} 更新后的文章对象，未找到时返回null
   */
  updateReadTime(id) {
    const article = this.getArticleById(id);
    
    if (!article) {
      return null;
    }
    
    // 更新阅读时间和次数
    return this.updateArticle(id, {
      lastReadTime: Date.now(),
      readCount: article.readCount + 1
    });
  }

  /**
   * 更新文章背诵次数
   * @param {string} id - 文章ID
   * @returns {Object|null} 更新后的文章对象，未找到时返回null
   */
  updateReciteCount(id) {
    const article = this.getArticleById(id);
    
    if (!article) {
      return null;
    }
    
    // 更新背诵次数
    return this.updateArticle(id, {
      reciteCount: article.reciteCount + 1
    });
  }

  /**
   * 统计文本字数
   * @param {string} content - 文本内容
   * @returns {number} 字数
   */
  countWords(content) {
    if (!content) return 0;
    
    // 移除标点符号和空格，然后计算字符数
    // 注：这种方法对中文比较合适，对英文会将整个单词算作一个字
    const cleanText = content.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '');
    return cleanText.length;
  }

  /**
   * 导入文章列表
   * @param {Array} articles - 要导入的文章数组
   * @returns {number} 成功导入的文章数量
   */
  importArticles(articles) {
    if (!Array.isArray(articles) || articles.length === 0) {
      return 0;
    }
    
    let importCount = 0;
    
    // 遍历导入
    articles.forEach(article => {
      try {
        this.addArticle({
          title: article.title || '未命名文章',
          content: article.content || '',
          author: article.author || '',
          source: article.source || '',
          tags: article.tags || []
        });
        importCount++;
      } catch (e) {
        console.error('导入文章失败', article, e);
      }
    });
    
    return importCount;
  }

  /**
   * 导出所有文章
   * @returns {Array} 所有文章的数组
   */
  exportArticles() {
    return this.getAllArticles();
  }

  /**
   * 搜索文章
   * @param {string} keyword - 搜索关键词
   * @returns {Array} 匹配的文章列表
   */
  searchArticles(keyword) {
    if (!keyword) {
      return this.getAllArticles();
    }
    
    // 转为小写进行不区分大小写的搜索
    const lowerKeyword = keyword.toLowerCase();
    
    return this.getAllArticles().filter(article => {
      const titleMatch = article.title.toLowerCase().includes(lowerKeyword);
      const contentMatch = article.content.toLowerCase().includes(lowerKeyword);
      const authorMatch = article.author.toLowerCase().includes(lowerKeyword);
      
      return titleMatch || contentMatch || authorMatch;
    });
  }

  /**
   * 获取阅读统计数据
   * @returns {Object} 统计数据
   */
  getReadingStats() {
    // 计算总阅读次数
    const totalReadCount = this.articles.reduce((sum, article) => sum + article.readCount, 0);
    
    // 计算总背诵次数
    const totalReciteCount = this.articles.reduce((sum, article) => sum + article.reciteCount, 0);
    
    // 计算总字数
    const totalWordCount = this.articles.reduce((sum, article) => sum + article.wordCount, 0);
    
    // 计算收藏数量
    const favoriteCount = this.articles.filter(article => article.isFavorite).length;
    
    // 计算最近一周阅读的文章数
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentReadCount = this.articles.filter(article => article.lastReadTime > oneWeekAgo).length;
    
    return {
      articleCount: this.articles.length,
      totalReadCount,
      totalReciteCount,
      totalWordCount,
      favoriteCount,
      recentReadCount
    };
  }
}

// 导出单例实例
const articleService = new ArticleService();
export default articleService; 
 