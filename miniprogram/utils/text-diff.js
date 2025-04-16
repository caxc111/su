/**
 * 文本差异比对工具 - 用于朗读和背诵练习中的文本对比
 */

/**
 * 计算两个字符串的相似度
 * @param {string} str1 - 原文本
 * @param {string} str2 - 用户输入文本
 * @returns {number} 相似度百分比（0-100）
 */
export function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  
  // 计算相似度百分比
  const similarity = (1 - distance / maxLength) * 100;
  return Math.round(similarity);
}

/**
 * 计算两个字符串的编辑距离 (Levenshtein Distance)
 * @param {string} str1 - 第一个字符串
 * @param {string} str2 - 第二个字符串
 * @returns {number} 编辑距离
 */
function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  
  // 创建距离矩阵
  const dp = new Array(m + 1);
  for (let i = 0; i <= m; i++) {
    dp[i] = new Array(n + 1);
    dp[i][0] = i;
  }
  
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }
  
  // 填充距离矩阵
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,     // 删除
          dp[i][j - 1] + 1,     // 插入
          dp[i - 1][j - 1] + 1  // 替换
        );
      }
    }
  }
  
  return dp[m][n];
}

/**
 * 比对两段文本，标记差异
 * @param {string} original - 原文本
 * @param {string} input - 用户输入文本
 * @returns {Array} 标记后的文本段落数组，每段包含文本和状态（correct/incorrect）
 */
export function compareText(original, input) {
  if (!original || !input) {
    return [{text: original || input, status: 'normal'}];
  }
  
  // 清理文本，移除多余空格等
  original = original.trim().replace(/\s+/g, ' ');
  input = input.trim().replace(/\s+/g, ' ');
  
  // 中文和英文的处理方式不同
  const isChineseText = /[\u4e00-\u9fa5]/.test(original);
  
  if (isChineseText) {
    // 中文按字符比对
    return compareChineseText(original, input);
  } else {
    // 英文按单词比对
    return compareEnglishText(original, input);
  }
}

/**
 * 比对中文文本，按字符标记差异
 * @param {string} original - 原中文文本
 * @param {string} input - 用户输入中文文本
 * @returns {Array} 标记后的文本段落数组
 */
function compareChineseText(original, input) {
  const result = [];
  const minLength = Math.min(original.length, input.length);
  
  let i = 0;
  let currentStatus = null;
  let currentText = '';
  
  // 逐字符比对
  while (i < minLength) {
    const originalChar = original[i];
    const inputChar = input[i];
    const isCorrect = originalChar === inputChar;
    
    // 如果状态改变，添加当前段落并重置
    if (currentStatus !== null && currentStatus !== isCorrect) {
      result.push({
        text: currentText,
        status: currentStatus ? 'correct' : 'incorrect'
      });
      currentText = '';
    }
    
    currentStatus = isCorrect;
    currentText += originalChar;
    i++;
  }
  
  // 添加最后一段已比对的文本
  if (currentText) {
    result.push({
      text: currentText,
      status: currentStatus ? 'correct' : 'incorrect'
    });
  }
  
  // 处理剩余的字符
  if (i < original.length) {
    result.push({
      text: original.substring(i),
      status: 'missing' // 用户没有输入的部分
    });
  } else if (i < input.length) {
    result.push({
      text: input.substring(i),
      status: 'extra' // 用户多输入的部分
    });
  }
  
  return result;
}

/**
 * 比对英文文本，按单词标记差异
 * @param {string} original - 原英文文本
 * @param {string} input - 用户输入英文文本
 * @returns {Array} 标记后的文本段落数组
 */
function compareEnglishText(original, input) {
  // 分词
  const originalWords = original.split(/\s+/);
  const inputWords = input.split(/\s+/);
  
  const result = [];
  const minLength = Math.min(originalWords.length, inputWords.length);
  
  let i = 0;
  let currentStatus = null;
  let currentText = '';
  
  // 逐词比对
  while (i < minLength) {
    const originalWord = originalWords[i];
    const inputWord = inputWords[i];
    const isCorrect = originalWord.toLowerCase() === inputWord.toLowerCase();
    
    // 如果状态改变，添加当前段落并重置
    if (currentStatus !== null && currentStatus !== isCorrect) {
      result.push({
        text: currentText.trim(),
        status: currentStatus ? 'correct' : 'incorrect'
      });
      currentText = '';
    }
    
    currentStatus = isCorrect;
    currentText += originalWord + ' ';
    i++;
  }
  
  // 添加最后一段已比对的文本
  if (currentText) {
    result.push({
      text: currentText.trim(),
      status: currentStatus ? 'correct' : 'incorrect'
    });
  }
  
  // 处理剩余的单词
  if (i < originalWords.length) {
    result.push({
      text: originalWords.slice(i).join(' '),
      status: 'missing' // 用户没有输入的部分
    });
  } else if (i < inputWords.length) {
    result.push({
      text: inputWords.slice(i).join(' '),
      status: 'extra' // 用户多输入的部分
    });
  }
  
  return result;
}

/**
 * 计算评分
 * @param {string} original - 原文本
 * @param {string} input - 用户输入文本
 * @returns {number} 分数（0-100）
 */
export function calculateScore(original, input) {
  if (!original || !input) return 0;
  
  // 基础分数：文本相似度
  const similarityScore = calculateSimilarity(original, input);
  
  // 计算长度差异惩罚
  const lengthDiff = Math.abs(original.length - input.length) / original.length;
  const lengthPenalty = Math.min(lengthDiff * 30, 30); // 最多扣30分
  
  // 计算最终分数
  let finalScore = similarityScore - lengthPenalty;
  
  // 确保分数在0-100范围内
  finalScore = Math.max(0, Math.min(100, finalScore));
  
  return Math.round(finalScore);
} 
 * 文本差异比对工具 - 用于朗读和背诵练习中的文本对比
 */

/**
 * 计算两个字符串的相似度
 * @param {string} str1 - 原文本
 * @param {string} str2 - 用户输入文本
 * @returns {number} 相似度百分比（0-100）
 */
export function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  
  // 计算相似度百分比
  const similarity = (1 - distance / maxLength) * 100;
  return Math.round(similarity);
}

/**
 * 计算两个字符串的编辑距离 (Levenshtein Distance)
 * @param {string} str1 - 第一个字符串
 * @param {string} str2 - 第二个字符串
 * @returns {number} 编辑距离
 */
function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  
  // 创建距离矩阵
  const dp = new Array(m + 1);
  for (let i = 0; i <= m; i++) {
    dp[i] = new Array(n + 1);
    dp[i][0] = i;
  }
  
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }
  
  // 填充距离矩阵
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,     // 删除
          dp[i][j - 1] + 1,     // 插入
          dp[i - 1][j - 1] + 1  // 替换
        );
      }
    }
  }
  
  return dp[m][n];
}

/**
 * 比对两段文本，标记差异
 * @param {string} original - 原文本
 * @param {string} input - 用户输入文本
 * @returns {Array} 标记后的文本段落数组，每段包含文本和状态（correct/incorrect）
 */
export function compareText(original, input) {
  if (!original || !input) {
    return [{text: original || input, status: 'normal'}];
  }
  
  // 清理文本，移除多余空格等
  original = original.trim().replace(/\s+/g, ' ');
  input = input.trim().replace(/\s+/g, ' ');
  
  // 中文和英文的处理方式不同
  const isChineseText = /[\u4e00-\u9fa5]/.test(original);
  
  if (isChineseText) {
    // 中文按字符比对
    return compareChineseText(original, input);
  } else {
    // 英文按单词比对
    return compareEnglishText(original, input);
  }
}

/**
 * 比对中文文本，按字符标记差异
 * @param {string} original - 原中文文本
 * @param {string} input - 用户输入中文文本
 * @returns {Array} 标记后的文本段落数组
 */
function compareChineseText(original, input) {
  const result = [];
  const minLength = Math.min(original.length, input.length);
  
  let i = 0;
  let currentStatus = null;
  let currentText = '';
  
  // 逐字符比对
  while (i < minLength) {
    const originalChar = original[i];
    const inputChar = input[i];
    const isCorrect = originalChar === inputChar;
    
    // 如果状态改变，添加当前段落并重置
    if (currentStatus !== null && currentStatus !== isCorrect) {
      result.push({
        text: currentText,
        status: currentStatus ? 'correct' : 'incorrect'
      });
      currentText = '';
    }
    
    currentStatus = isCorrect;
    currentText += originalChar;
    i++;
  }
  
  // 添加最后一段已比对的文本
  if (currentText) {
    result.push({
      text: currentText,
      status: currentStatus ? 'correct' : 'incorrect'
    });
  }
  
  // 处理剩余的字符
  if (i < original.length) {
    result.push({
      text: original.substring(i),
      status: 'missing' // 用户没有输入的部分
    });
  } else if (i < input.length) {
    result.push({
      text: input.substring(i),
      status: 'extra' // 用户多输入的部分
    });
  }
  
  return result;
}

/**
 * 比对英文文本，按单词标记差异
 * @param {string} original - 原英文文本
 * @param {string} input - 用户输入英文文本
 * @returns {Array} 标记后的文本段落数组
 */
function compareEnglishText(original, input) {
  // 分词
  const originalWords = original.split(/\s+/);
  const inputWords = input.split(/\s+/);
  
  const result = [];
  const minLength = Math.min(originalWords.length, inputWords.length);
  
  let i = 0;
  let currentStatus = null;
  let currentText = '';
  
  // 逐词比对
  while (i < minLength) {
    const originalWord = originalWords[i];
    const inputWord = inputWords[i];
    const isCorrect = originalWord.toLowerCase() === inputWord.toLowerCase();
    
    // 如果状态改变，添加当前段落并重置
    if (currentStatus !== null && currentStatus !== isCorrect) {
      result.push({
        text: currentText.trim(),
        status: currentStatus ? 'correct' : 'incorrect'
      });
      currentText = '';
    }
    
    currentStatus = isCorrect;
    currentText += originalWord + ' ';
    i++;
  }
  
  // 添加最后一段已比对的文本
  if (currentText) {
    result.push({
      text: currentText.trim(),
      status: currentStatus ? 'correct' : 'incorrect'
    });
  }
  
  // 处理剩余的单词
  if (i < originalWords.length) {
    result.push({
      text: originalWords.slice(i).join(' '),
      status: 'missing' // 用户没有输入的部分
    });
  } else if (i < inputWords.length) {
    result.push({
      text: inputWords.slice(i).join(' '),
      status: 'extra' // 用户多输入的部分
    });
  }
  
  return result;
}

/**
 * 计算评分
 * @param {string} original - 原文本
 * @param {string} input - 用户输入文本
 * @returns {number} 分数（0-100）
 */
export function calculateScore(original, input) {
  if (!original || !input) return 0;
  
  // 基础分数：文本相似度
  const similarityScore = calculateSimilarity(original, input);
  
  // 计算长度差异惩罚
  const lengthDiff = Math.abs(original.length - input.length) / original.length;
  const lengthPenalty = Math.min(lengthDiff * 30, 30); // 最多扣30分
  
  // 计算最终分数
  let finalScore = similarityScore - lengthPenalty;
  
  // 确保分数在0-100范围内
  finalScore = Math.max(0, Math.min(100, finalScore));
  
  return Math.round(finalScore);
} 
 