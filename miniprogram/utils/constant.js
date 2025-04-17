/**
 * 常量定义文件 - 管理全局常量
 */

/**
 * 应用常量配置
 */

/**
 * 录音器选项
 */
export const RECORDER_OPTIONS = {
  duration: 60000,         // 最长录音时间，单位ms，默认60s
  sampleRate: 44100,       // 采样率，有效值 8000/16000/44100
  numberOfChannels: 1,     // 录音通道数，有效值 1/2
  encodeBitRate: 192000,    // 编码码率
  format: 'mp3',           // 音频格式，有效值 aac/mp3
  frameSize: 50            // 指定帧大小，单位KB
};

/**
 * 应用全局常量
 */
export const APP_CONSTANTS = {
  // 存储键名
  STORAGE_KEYS: {
    USER_INFO: 'user_info',        // 用户信息
    ARTICLES: 'articles',          // 文章列表
    PRACTICE_RECORDS: 'practice_records', // 练习记录
    SETTINGS: 'settings'           // 用户设置
  },
  
  // 导航路由
  ROUTES: {
    HOME: '/pages/home/home',
    ARTICLE_LIST: '/pages/article-list/article-list',
    ARTICLE_DETAIL: '/pages/article-detail/article-detail',
    PRACTICE: '/pages/practice/practice',
    RECORDS: '/pages/records/records',
    SETTINGS: '/pages/settings/settings'
  },
  
  // 练习类型
  PRACTICE_TYPES: {
    READ: 'read',     // 朗读
    RECITE: 'recite'  // 背诵
  },

  // 分数等级
  SCORE_LEVELS: {
    EXCELLENT: {min: 90, name: '优秀', color: '#8ce552'},
    GOOD: {min: 75, name: '良好', color: '#4caf50'},
    AVERAGE: {min: 60, name: '一般', color: '#ff9800'},
    POOR: {min: 0, name: '需要加强', color: '#f44336'}
  }
};

/**
 * 获取分数等级
 * @param {number} score 分数
 * @returns {Object} 等级对象，包含name和color属性
 */
export const getScoreLevel = (score) => {
  const levels = APP_CONSTANTS.SCORE_LEVELS;
  
  if (score >= levels.EXCELLENT.min) return levels.EXCELLENT;
  if (score >= levels.GOOD.min) return levels.GOOD;
  if (score >= levels.AVERAGE.min) return levels.AVERAGE;
  return levels.POOR;
};

export default {
  RECORDER_OPTIONS,
  APP_CONSTANTS,
  getScoreLevel
};

// 文章难度级别
export const ARTICLE_LEVELS = {
  BEGINNER: {
    code: 'beginner',
    text: '初级',
    maxLength: 100
  },
  INTERMEDIATE: {
    code: 'intermediate',
    text: '中级',
    maxLength: 200
  },
  ADVANCED: {
    code: 'advanced',
    text: '高级',
    maxLength: Infinity
  }
};

// 文章语言类型
export const ARTICLE_LANGUAGES = {
  CHINESE: {
    code: 'chinese',
    text: '中文'
  },
  ENGLISH: {
    code: 'english',
    text: '英文'
  }
};

// 页面路径
export const PAGES = {
  LOGIN: '/pages/login/login',
  INDEX: '/pages/index/index',
  RECORD: '/pages/record/record',
  PROFILE: '/pages/profile/profile',
  READING: '/pages/reading/reading',
  RECITING: '/pages/reciting/reciting'
};

/**
 * 获取文章难度级别
 * @param {string} text - 文章内容
 * @returns {object} 难度级别对象
 */
export function getArticleLevel(text) {
  const length = text.length;
  
  if (length <= ARTICLE_LEVELS.BEGINNER.maxLength) {
    return ARTICLE_LEVELS.BEGINNER;
  } else if (length <= ARTICLE_LEVELS.INTERMEDIATE.maxLength) {
    return ARTICLE_LEVELS.INTERMEDIATE;
  } else {
    return ARTICLE_LEVELS.ADVANCED;
  }
}

/**
 * 格式化时间戳
 * @param {number} timestamp - 时间戳
 * @returns {string} 格式化的时间字符串
 */
export function formatTime(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');
  
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

/**
 * 文章默认字数限制
 */
export const ARTICLE_TEXT_LIMIT = 2000;

/**
 * 文章类型
 */
export const ARTICLE_TYPES = {
  POETRY: 'poetry', // 诗词
  PROSE: 'prose', // 散文
  SPEECH: 'speech', // 演讲
  CUSTOM: 'custom' // 自定义
};

/**
 * 页面路径
 */
export const PAGE_PATHS = {
  HOME: '/pages/home/home',
  ARTICLE_LIST: '/pages/article-list/article-list',
  ARTICLE_DETAIL: '/pages/article-detail/article-detail',
  PRACTICE: '/pages/practice/practice',
  RECORD_LIST: '/pages/record-list/record-list',
  RECORD_DETAIL: '/pages/record-detail/record-detail',
  USER: '/pages/user/user'
};

/**
 * 默认设置
 */
export const DEFAULT_SETTINGS = {
  enableBackgroundMusic: false, // 是否启用背景音乐
  pronunciationMode: 'standard', // 发音模式：standard(标准)，dialect(方言)
  autoSave: true, // 自动保存录音
  darkMode: false, // 深色模式
  fontSize: 'medium' // 字体大小：small, medium, large
}; 
 