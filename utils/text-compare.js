/**
 * 文本比对工具函数
 * 用于比较原文和识别结果的相似度
 */

// 计算编辑距离
function levenshteinDistance(a, b) {
  const matrix = [];
  
  // 初始化矩阵
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  // 填充矩阵
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // 替换
          matrix[i][j - 1] + 1,     // 插入
          matrix[i - 1][j] + 1      // 删除
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

// 计算文本相似度
function calculateSimilarity(original, recognized) {
  if (!original || !recognized) {
    return 0;
  }
  
  const distance = levenshteinDistance(original, recognized);
  const maxLength = Math.max(original.length, recognized.length);
  const similarity = ((maxLength - distance) / maxLength) * 100;
  
  return Math.max(0, Math.min(100, similarity));
}

// 预处理文本
function preprocessText(text, language) {
  if (!text) return '';
  
  let processedText = text;
  
  // 移除标点符号
  if (language === 'zh') {
    // 中文标点
    processedText = processedText.replace(/[，。！？；：""''【】（）、]/g, '');
  } else {
    // 英文标点
    processedText = processedText.replace(/[,.!?;:'"()\[\]]/g, '');
  }
  
  // 去除多余空格
  processedText = processedText.replace(/\s+/g, ' ').trim();
  
  // 转为小写（英文）
  if (language === 'en') {
    processedText = processedText.toLowerCase();
  }
  
  return processedText;
}

// 比较两段文本
function compareTexts(original, recognized, language) {
  // 预处理文本
  const processedOriginal = preprocessText(original, language);
  const processedRecognized = preprocessText(recognized, language);
  
  // 计算相似度
  const similarity = calculateSimilarity(processedOriginal, processedRecognized);
  
  // 计算字/词数
  let totalWords, correctWords;
  
  if (language === 'zh') {
    // 中文按字符计算
    totalWords = processedOriginal.length;
    correctWords = Math.round(totalWords * (similarity / 100));
  } else {
    // 英文按单词计算
    totalWords = processedOriginal.split(/\s+/).length;
    correctWords = Math.round(totalWords * (similarity / 100));
  }
  
  return {
    similarity,
    totalWords,
    correctWords
  };
}

module.exports = {
  compareTexts
};