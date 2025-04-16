/**
 * 文本处理工具函数
 */

/**
 * 计算两个文本的相似度（使用Levenshtein距离算法）
 * @param {string} str1 - 第一个字符串
 * @param {string} str2 - 第二个字符串
 * @returns {number} 相似度百分比(0-100)
 */
export function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
  // 预处理：删除标点符号、空格等，转换为小写
  const text1 = preprocessText(str1);
  const text2 = preprocessText(str2);
  
  // 如果两个字符串相同，直接返回100%相似
  if (text1 === text2) return 100;
  
  // 计算Levenshtein距离
  const distance = levenshteinDistance(text1, text2);
  
  // 计算相似度百分比
  const maxLength = Math.max(text1.length, text2.length);
  const similarity = ((maxLength - distance) / maxLength) * 100;
  
  // 四舍五入到整数
  return Math.round(similarity);
}

/**
 * 预处理文本：删除标点符号、空格等，转为小写
 * @param {string} text - 输入文本
 * @returns {string} 处理后的文本
 */
function preprocessText(text) {
  if (!text) return '';
  // 删除标点符号、空格等，转为小写
  return text.toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()。，、；：？！……""''（）【】《》]/g, '')
    .replace(/\s+/g, '');
}

/**
 * 计算Levenshtein距离
 * @param {string} s1 - 第一个字符串
 * @param {string} s2 - 第二个字符串
 * @returns {number} Levenshtein距离
 */
function levenshteinDistance(s1, s2) {
  const len1 = s1.length;
  const len2 = s2.length;
  
  // 创建距离矩阵
  const matrix = Array(len1 + 1).fill().map(() => Array(len2 + 1).fill(0));
  
  // 初始化第一行和第一列
  for (let i = 0; i <= len1; i++) {
    matrix[i][0] = i;
  }
  
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  
  // 填充矩阵
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // 删除
        matrix[i][j - 1] + 1, // 插入
        matrix[i - 1][j - 1] + cost // 替换
      );
    }
  }
  
  return matrix[len1][len2];
}

/**
 * 格式化文章内容，处理换行和空格
 * @param {string} content - 文章内容
 * @returns {string} 格式化后的内容
 */
export function formatArticleContent(content) {
  if (!content) return '';
  
  // 替换多个换行为两个换行
  let formatted = content.replace(/\n{3,}/g, '\n\n');
  
  // 去除每行前后多余空格
  formatted = formatted.split('\n')
    .map(line => line.trim())
    .join('\n');
  
  return formatted;
}

/**
 * 从文本中提取摘要
 * @param {string} text - 原文本
 * @param {number} maxLength - 最大长度
 * @returns {string} 摘要文本
 */
export function extractSummary(text, maxLength = 100) {
  if (!text) return '';
  
  // 移除标点符号
  const cleanText = text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()。，、；：？！……""''（）【】《》]/g, '');
  
  // 如果文本长度小于最大长度，直接返回
  if (cleanText.length <= maxLength) {
    return text;
  }
  
  // 提取前maxLength个字符并添加省略号
  return text.substring(0, maxLength) + '...';
}

/**
 * 计算文本的阅读时间（分钟）
 * @param {string} text - 文本内容
 * @param {number} wordsPerMinute - 每分钟阅读字数
 * @returns {number} 阅读时间（分钟）
 */
export function calculateReadingTime(text, wordsPerMinute = 300) {
  if (!text) return 0;
  
  // 中文每个字符算一个字
  const charCount = text.length;
  
  // 计算阅读时间（分钟）
  const minutes = charCount / wordsPerMinute;
  
  // 四舍五入到小数点后一位
  return Math.round(minutes * 10) / 10;
}

/**
 * 根据文本长度计算背诵难度系数
 * @param {string} text - 文本内容
 * @returns {string} 难度级别：简单、中等、困难
 */
export function calculateDifficulty(text) {
  if (!text) return '简单';
  
  const length = text.length;
  
  if (length < 100) {
    return '简单';
  } else if (length < 300) {
    return '中等';
  } else {
    return '困难';
  }
} 
 * 文本处理工具函数
 */

/**
 * 计算两个文本的相似度（使用Levenshtein距离算法）
 * @param {string} str1 - 第一个字符串
 * @param {string} str2 - 第二个字符串
 * @returns {number} 相似度百分比(0-100)
 */
export function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
  // 预处理：删除标点符号、空格等，转换为小写
  const text1 = preprocessText(str1);
  const text2 = preprocessText(str2);
  
  // 如果两个字符串相同，直接返回100%相似
  if (text1 === text2) return 100;
  
  // 计算Levenshtein距离
  const distance = levenshteinDistance(text1, text2);
  
  // 计算相似度百分比
  const maxLength = Math.max(text1.length, text2.length);
  const similarity = ((maxLength - distance) / maxLength) * 100;
  
  // 四舍五入到整数
  return Math.round(similarity);
}

/**
 * 预处理文本：删除标点符号、空格等，转为小写
 * @param {string} text - 输入文本
 * @returns {string} 处理后的文本
 */
function preprocessText(text) {
  if (!text) return '';
  // 删除标点符号、空格等，转为小写
  return text.toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()。，、；：？！……""''（）【】《》]/g, '')
    .replace(/\s+/g, '');
}

/**
 * 计算Levenshtein距离
 * @param {string} s1 - 第一个字符串
 * @param {string} s2 - 第二个字符串
 * @returns {number} Levenshtein距离
 */
function levenshteinDistance(s1, s2) {
  const len1 = s1.length;
  const len2 = s2.length;
  
  // 创建距离矩阵
  const matrix = Array(len1 + 1).fill().map(() => Array(len2 + 1).fill(0));
  
  // 初始化第一行和第一列
  for (let i = 0; i <= len1; i++) {
    matrix[i][0] = i;
  }
  
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  
  // 填充矩阵
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // 删除
        matrix[i][j - 1] + 1, // 插入
        matrix[i - 1][j - 1] + cost // 替换
      );
    }
  }
  
  return matrix[len1][len2];
}

/**
 * 格式化文章内容，处理换行和空格
 * @param {string} content - 文章内容
 * @returns {string} 格式化后的内容
 */
export function formatArticleContent(content) {
  if (!content) return '';
  
  // 替换多个换行为两个换行
  let formatted = content.replace(/\n{3,}/g, '\n\n');
  
  // 去除每行前后多余空格
  formatted = formatted.split('\n')
    .map(line => line.trim())
    .join('\n');
  
  return formatted;
}

/**
 * 从文本中提取摘要
 * @param {string} text - 原文本
 * @param {number} maxLength - 最大长度
 * @returns {string} 摘要文本
 */
export function extractSummary(text, maxLength = 100) {
  if (!text) return '';
  
  // 移除标点符号
  const cleanText = text.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()。，、；：？！……""''（）【】《》]/g, '');
  
  // 如果文本长度小于最大长度，直接返回
  if (cleanText.length <= maxLength) {
    return text;
  }
  
  // 提取前maxLength个字符并添加省略号
  return text.substring(0, maxLength) + '...';
}

/**
 * 计算文本的阅读时间（分钟）
 * @param {string} text - 文本内容
 * @param {number} wordsPerMinute - 每分钟阅读字数
 * @returns {number} 阅读时间（分钟）
 */
export function calculateReadingTime(text, wordsPerMinute = 300) {
  if (!text) return 0;
  
  // 中文每个字符算一个字
  const charCount = text.length;
  
  // 计算阅读时间（分钟）
  const minutes = charCount / wordsPerMinute;
  
  // 四舍五入到小数点后一位
  return Math.round(minutes * 10) / 10;
}

/**
 * 根据文本长度计算背诵难度系数
 * @param {string} text - 文本内容
 * @returns {string} 难度级别：简单、中等、困难
 */
export function calculateDifficulty(text) {
  if (!text) return '简单';
  
  const length = text.length;
  
  if (length < 100) {
    return '简单';
  } else if (length < 300) {
    return '中等';
  } else {
    return '困难';
  }
} 
 