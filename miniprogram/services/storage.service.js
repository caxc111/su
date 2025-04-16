/**
 * 存储服务 - 管理文章和练习记录数据
 */
class StorageService {
  constructor() {
    this.DB_KEY = 'DB';
    this.DB_VERSION = '1.0.0';
    this.initDB();
  }

  /**
   * 初始化数据库结构
   */
  initDB() {
    try {
      let db = wx.getStorageSync(this.DB_KEY);
      
      // 如果数据库不存在，则创建初始结构
      if (!db) {
        db = {
          version: this.DB_VERSION,
          users: {},
          articles: {
            presets: [],
            custom: []
          },
          records: {
            reading: [],
            reciting: []
          }
        };
        wx.setStorageSync(this.DB_KEY, db);
      }
    } catch (error) {
      console.error('初始化数据库失败：', error);
      throw error;
    }
  }

  /**
   * 获取完整数据库
   * @returns {object} 数据库对象
   */
  getDB() {
    try {
      return wx.getStorageSync(this.DB_KEY) || this.initDB();
    } catch (error) {
      console.error('获取数据库失败：', error);
      throw error;
    }
  }

  /**
   * 保存数据库
   * @param {object} db - 数据库对象
   */
  saveDB(db) {
    try {
      wx.setStorageSync(this.DB_KEY, db);
    } catch (error) {
      console.error('保存数据库失败：', error);
      throw error;
    }
  }

  /**
   * 保存用户数据
   * @param {string} openid - 用户唯一标识
   * @param {object} userData - 用户数据对象
   */
  saveUserData(openid, userData) {
    try {
      const db = this.getDB();
      db.users[openid] = {
        ...db.users[openid],
        ...userData
      };
      this.saveDB(db);
    } catch (error) {
      console.error('保存用户数据失败：', error);
      throw error;
    }
  }

  /**
   * 获取所有文章
   * @param {string} type - 文章类型: 'all', 'chinese', 'english'
   * @returns {Array} 文章列表
   */
  getArticles(type = 'all') {
    try {
      const db = this.getDB();
      let articles = [...db.articles.presets, ...db.articles.custom];
      
      // 根据类型筛选
      if (type !== 'all') {
        articles = articles.filter(article => article.language.toLowerCase() === type);
      }
      
      return articles;
    } catch (error) {
      console.error('获取文章失败：', error);
      return [];
    }
  }

  /**
   * 添加自定义文章
   * @param {object} article - 文章对象
   * @returns {string} 新增文章ID
   */
  addCustomArticle(article) {
    try {
      const db = this.getDB();
      const id = 'C' + Date.now();
      const newArticle = {
        id,
        ...article,
        createdAt: Date.now()
      };
      
      db.articles.custom.push(newArticle);
      this.saveDB(db);
      
      return id;
    } catch (error) {
      console.error('添加文章失败：', error);
      throw error;
    }
  }

  /**
   * 获取文章详情
   * @param {string} articleId - 文章ID
   * @returns {object|null} 文章对象或null
   */
  getArticleById(articleId) {
    try {
      const db = this.getDB();
      const allArticles = [...db.articles.presets, ...db.articles.custom];
      return allArticles.find(article => article.id === articleId) || null;
    } catch (error) {
      console.error('获取文章详情失败：', error);
      return null;
    }
  }

  /**
   * 保存练习记录
   * @param {string} type - 练习类型: 'reading', 'reciting'
   * @param {object} record - 练习记录对象
   * @returns {string} 记录ID
   */
  saveRecord(type, record) {
    try {
      const db = this.getDB();
      const id = type.charAt(0).toUpperCase() + Date.now();
      const newRecord = {
        id,
        ...record,
        timestamp: Date.now()
      };
      
      db.records[type].unshift(newRecord); // 新记录放到最前面
      this.saveDB(db);
      
      return id;
    } catch (error) {
      console.error('保存练习记录失败：', error);
      throw error;
    }
  }

  /**
   * 获取练习记录
   * @param {string} type - 练习类型: 'reading', 'reciting'
   * @returns {Array} 记录列表
   */
  getRecords(type) {
    try {
      const db = this.getDB();
      return db.records[type] || [];
    } catch (error) {
      console.error('获取练习记录失败：', error);
      return [];
    }
  }

  /**
   * 获取用户统计数据
   * @returns {object} 统计数据对象
   */
  getUserStats() {
    try {
      const db = this.getDB();
      const readingRecords = db.records.reading || [];
      const recitingRecords = db.records.reciting || [];
      
      // 计算朗读统计
      const readingCount = readingRecords.length;
      const readingTime = readingRecords.reduce((total, record) => total + (record.duration || 0), 0) / 60; // 转换为分钟
      const perfectReadingCount = readingRecords.filter(record => record.score >= 95).length;
      
      // 计算背诵统计
      const recitingCount = recitingRecords.length;
      const recitingTime = recitingRecords.reduce((total, record) => total + (record.duration || 0), 0) / 60; // 转换为分钟
      const perfectRecitingCount = recitingRecords.filter(record => record.score >= 95).length;
      
      return {
        readingCount,
        readingTime: Math.round(readingTime),
        perfectReadingCount,
        recitingCount,
        recitingTime: Math.round(recitingTime),
        perfectRecitingCount
      };
    } catch (error) {
      console.error('获取统计数据失败：', error);
      return {
        readingCount: 0,
        readingTime: 0,
        perfectReadingCount: 0,
        recitingCount: 0,
        recitingTime: 0,
        perfectRecitingCount: 0
      };
    }
  }
}

// 导出单例模式的服务实例
export const storageService = new StorageService(); 
 * 存储服务 - 管理文章和练习记录数据
 */
class StorageService {
  constructor() {
    this.DB_KEY = 'DB';
    this.DB_VERSION = '1.0.0';
    this.initDB();
  }

  /**
   * 初始化数据库结构
   */
  initDB() {
    try {
      let db = wx.getStorageSync(this.DB_KEY);
      
      // 如果数据库不存在，则创建初始结构
      if (!db) {
        db = {
          version: this.DB_VERSION,
          users: {},
          articles: {
            presets: [],
            custom: []
          },
          records: {
            reading: [],
            reciting: []
          }
        };
        wx.setStorageSync(this.DB_KEY, db);
      }
    } catch (error) {
      console.error('初始化数据库失败：', error);
      throw error;
    }
  }

  /**
   * 获取完整数据库
   * @returns {object} 数据库对象
   */
  getDB() {
    try {
      return wx.getStorageSync(this.DB_KEY) || this.initDB();
    } catch (error) {
      console.error('获取数据库失败：', error);
      throw error;
    }
  }

  /**
   * 保存数据库
   * @param {object} db - 数据库对象
   */
  saveDB(db) {
    try {
      wx.setStorageSync(this.DB_KEY, db);
    } catch (error) {
      console.error('保存数据库失败：', error);
      throw error;
    }
  }

  /**
   * 保存用户数据
   * @param {string} openid - 用户唯一标识
   * @param {object} userData - 用户数据对象
   */
  saveUserData(openid, userData) {
    try {
      const db = this.getDB();
      db.users[openid] = {
        ...db.users[openid],
        ...userData
      };
      this.saveDB(db);
    } catch (error) {
      console.error('保存用户数据失败：', error);
      throw error;
    }
  }

  /**
   * 获取所有文章
   * @param {string} type - 文章类型: 'all', 'chinese', 'english'
   * @returns {Array} 文章列表
   */
  getArticles(type = 'all') {
    try {
      const db = this.getDB();
      let articles = [...db.articles.presets, ...db.articles.custom];
      
      // 根据类型筛选
      if (type !== 'all') {
        articles = articles.filter(article => article.language.toLowerCase() === type);
      }
      
      return articles;
    } catch (error) {
      console.error('获取文章失败：', error);
      return [];
    }
  }

  /**
   * 添加自定义文章
   * @param {object} article - 文章对象
   * @returns {string} 新增文章ID
   */
  addCustomArticle(article) {
    try {
      const db = this.getDB();
      const id = 'C' + Date.now();
      const newArticle = {
        id,
        ...article,
        createdAt: Date.now()
      };
      
      db.articles.custom.push(newArticle);
      this.saveDB(db);
      
      return id;
    } catch (error) {
      console.error('添加文章失败：', error);
      throw error;
    }
  }

  /**
   * 获取文章详情
   * @param {string} articleId - 文章ID
   * @returns {object|null} 文章对象或null
   */
  getArticleById(articleId) {
    try {
      const db = this.getDB();
      const allArticles = [...db.articles.presets, ...db.articles.custom];
      return allArticles.find(article => article.id === articleId) || null;
    } catch (error) {
      console.error('获取文章详情失败：', error);
      return null;
    }
  }

  /**
   * 保存练习记录
   * @param {string} type - 练习类型: 'reading', 'reciting'
   * @param {object} record - 练习记录对象
   * @returns {string} 记录ID
   */
  saveRecord(type, record) {
    try {
      const db = this.getDB();
      const id = type.charAt(0).toUpperCase() + Date.now();
      const newRecord = {
        id,
        ...record,
        timestamp: Date.now()
      };
      
      db.records[type].unshift(newRecord); // 新记录放到最前面
      this.saveDB(db);
      
      return id;
    } catch (error) {
      console.error('保存练习记录失败：', error);
      throw error;
    }
  }

  /**
   * 获取练习记录
   * @param {string} type - 练习类型: 'reading', 'reciting'
   * @returns {Array} 记录列表
   */
  getRecords(type) {
    try {
      const db = this.getDB();
      return db.records[type] || [];
    } catch (error) {
      console.error('获取练习记录失败：', error);
      return [];
    }
  }

  /**
   * 获取用户统计数据
   * @returns {object} 统计数据对象
   */
  getUserStats() {
    try {
      const db = this.getDB();
      const readingRecords = db.records.reading || [];
      const recitingRecords = db.records.reciting || [];
      
      // 计算朗读统计
      const readingCount = readingRecords.length;
      const readingTime = readingRecords.reduce((total, record) => total + (record.duration || 0), 0) / 60; // 转换为分钟
      const perfectReadingCount = readingRecords.filter(record => record.score >= 95).length;
      
      // 计算背诵统计
      const recitingCount = recitingRecords.length;
      const recitingTime = recitingRecords.reduce((total, record) => total + (record.duration || 0), 0) / 60; // 转换为分钟
      const perfectRecitingCount = recitingRecords.filter(record => record.score >= 95).length;
      
      return {
        readingCount,
        readingTime: Math.round(readingTime),
        perfectReadingCount,
        recitingCount,
        recitingTime: Math.round(recitingTime),
        perfectRecitingCount
      };
    } catch (error) {
      console.error('获取统计数据失败：', error);
      return {
        readingCount: 0,
        readingTime: 0,
        perfectReadingCount: 0,
        recitingCount: 0,
        recitingTime: 0,
        perfectRecitingCount: 0
      };
    }
  }
}

// 导出单例模式的服务实例
export const storageService = new StorageService(); 
 