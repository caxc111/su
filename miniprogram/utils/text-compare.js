/**
 * 文本对比工具函数
 */

/**
 * 多音字发音映射表
 * 包含常见多音字及其发音，用于比对时判断
 * 使用简化的拼音表示（不考虑声调）
 */
const HOMOPHONE_MAP = {
  // 常见多音字及其发音
  '晓': 'xiao',
  '小': 'xiao',
  '了': ['le', 'liao'],
  '还': ['hai', 'huan'],
  '行': ['xing', 'hang'],
  '长': ['chang', 'zhang'],
  '重': ['zhong', 'chong'],
  '觉': ['jue', 'jiao'],
  '朝': ['chao', 'zhao'],
  '血': ['xue', 'xie'],
  '数': ['shu', 'shuo'],
  '落': ['luo', 'la'],
  '恶': ['e', 'wu'],
  '好': ['hao', 'hao'],
  '给': ['gei', 'ji'],
  '乐': ['le', 'yue'],
  '大': ['da', 'dai'],
  '和': ['he', 'huo', 'hu'],
  '地': ['di', 'de'],
  '得': ['de', 'dei', 'de'],
  '读': ['du', 'dou'],
  '弹': ['tan', 'dan'],
  '斗': ['dou', 'dou'],
  '服': ['fu', 'fu'],
  '划': ['hua', 'huai'],
  '间': ['jian', 'jian'],
  '降': ['jiang', 'xiang'],
  '奇': ['qi', 'ji'],
  '强': ['qiang', 'jiang'],
  '少': ['shao', 'shao'],
  '似': ['si', 'shi'],
  '血': ['xue', 'xie'],
  '兴': ['xing', 'xing'],
  '应': ['ying', 'ying'],
  '只': ['zhi', 'zhi'],
  '种': ['zhong', 'chong'],
  '传': ['chuan', 'zhuan'],
  '藏': ['cang', 'zang'],
  '折': ['zhe', 'she'],
  '中': ['zhong', 'zhong'],
  '熟': ['shu', 'shou'],
  // 添加更多常见多音字
  '差': ['cha', 'chai', 'ci'],
  '调': ['diao', 'tiao'],
  '度': ['du', 'duo'],
  '发': ['fa', 'fei'],
  '分': ['fen', 'fen'],
  '更': ['geng', 'geng'],
  '空': ['kong', 'kong'],
  '校': ['xiao', 'jiao'],
  '笑': 'xiao',
  '萧': 'xiao',
  '效': 'xiao',
  '肖': 'xiao',
  '宿': ['su', 'xiu'],
  '为': ['wei', 'wei'],
  '乡': ['xiang', 'xiang'],
  '姓': ['xing', 'xing'],
  '冤': ['yuan', 'yuan'],
  '叶': ['ye', 'xie'],
  '一': ['yi', 'yi'],
  '以': ['yi', 'yi'],
  '柏': ['bai', 'bo'],
  '曾': ['ceng', 'zeng'],
  '蚕': ['can', 'can'],
  '单': ['dan', 'shan'],
  '贾': ['jia', 'gu'],
  '解': ['jie', 'xie'],
  '哪': ['na', 'nei'],
  '旁': ['pang', 'bang'],
  '曲': ['qu', 'qu'],
  '色': ['se', 'shai'],
  '省': ['sheng', 'xing'],
  '射': ['she', 'yi'],
  '食': ['shi', 'si'],
  '瞎': ['xia', 'xia'],
  '咽': ['yan', 'ye'],
  '约': ['yue', 'yao'],
  '脏': ['zang', 'zang'],
  '著': ['zhu', 'zhe'],
  // 同音异字部分
  '雪': 'xue',
  '学': 'xue',
  '薛': 'xue',
  '穴': 'xue',
  '月': 'yue',
  '越': 'yue',
  '粤': 'yue',
  '岳': 'yue',
  '阅': 'yue',
  '悦': 'yue',
  '花': 'hua',
  '华': 'hua',
  '化': 'hua',
  '画': 'hua',
  '话': 'hua',
  '哗': 'hua',
  '骅': 'hua',
  '桦': 'hua',
  // 新增更多同音字组
  '情': 'qing', '请': 'qing', '清': 'qing', '青': 'qing', '轻': 'qing',
  '心': 'xin', '新': 'xin', '欣': 'xin', '信': 'xin', '芯': 'xin',
  '事': 'shi', '是': 'shi', '时': 'shi', '实': 'shi', '识': 'shi', '式': 'shi', '市': 'shi', '世': 'shi',
  '明': 'ming', '名': 'ming', '鸣': 'ming', '命': 'ming',
  '成': 'cheng', '城': 'cheng', '程': 'cheng', '诚': 'cheng', '承': 'cheng', '橙': 'cheng',
  '作': 'zuo', '做': 'zuo', '坐': 'zuo', '座': 'zuo',
  '来': 'lai', '赖': 'lai',
  '起': 'qi', '气': 'qi', '期': 'qi', '七': 'qi', '启': 'qi',
  '场': 'chang', '常': 'chang', '厂': 'chang',
  '机': 'ji', '基': 'ji', '记': 'ji', '计': 'ji', '几': 'ji', '己': 'ji',
  '那': ['na', 'nei'], '哪': ['na', 'nei'],
  '到': 'dao', '道': 'dao', '导': 'dao',
  '高': 'gao', '搞': 'gao', '告': 'gao',
  '生': 'sheng', '声': 'sheng', '胜': 'sheng',
  '家': 'jia', '加': 'jia', '佳': 'jia', '嘉': 'jia',
  '去': 'qu', '区': 'qu', '曲': 'qu',
  '打': 'da', '大': 'da', '答': 'da',
  
  // 中文数字与阿拉伯数字映射（小写）
  '零': '0', '0': '零',
  '一': '1', '1': '一',
  '二': '2', '2': '二',
  '三': '3', '3': '三',
  '四': '4', '4': '四',
  '五': '5', '5': '五',
  '六': '6', '6': '六',
  '七': '7', '7': '七',
  '八': '8', '8': '八',
  '九': '9', '9': '九',
  '十': '10', '10': '十',
  
  // 中文数字与阿拉伯数字映射（大写）
  '壹': '1', '1': '壹',
  '贰': '2', '2': '贰',
  '叁': '3', '3': '叁',
  '肆': '4', '4': '肆',
  '伍': '5', '5': '伍',
  '陆': '6', '6': '陆',
  '柒': '7', '7': '柒',
  '捌': '8', '8': '捌',
  '玖': '9', '9': '玖',
  '拾': '10', '10': '拾',
};

/**
 * 检查两个字符是否为同音字
 * @param {string} char1 - 字符1
 * @param {string} char2 - 字符2
 * @returns {boolean} 是否为同音字
 */
function areHomophones(char1, char2) {
  // 如果字符相同，直接返回true
  if (char1 === char2) return true;
  
  // 检查是否在多音字映射表中
  const hasChar1 = HOMOPHONE_MAP.hasOwnProperty(char1);
  const hasChar2 = HOMOPHONE_MAP.hasOwnProperty(char2);
  
  // 如果两个字符都不在映射表中，返回false
  if (!hasChar1 && !hasChar2) return false;
  
  // 如果只有一个字符在映射表中
  if (hasChar1 && !hasChar2) {
    // 获取字符1的发音列表
    const values = Array.isArray(HOMOPHONE_MAP[char1]) ? 
      HOMOPHONE_MAP[char1] : [HOMOPHONE_MAP[char1]];
    
    // 检查字符2是否与任何映射值相等
    return values.includes(char2);
  }
  
  if (!hasChar1 && hasChar2) {
    // 获取字符2的发音列表
    const values = Array.isArray(HOMOPHONE_MAP[char2]) ?
      HOMOPHONE_MAP[char2] : [HOMOPHONE_MAP[char2]];
    
    // 检查字符1是否与任何映射值相等
    return values.includes(char1);
  }
  
  // 获取两个字符的发音列表
  const pronunciation1 = Array.isArray(HOMOPHONE_MAP[char1]) ? HOMOPHONE_MAP[char1] : [HOMOPHONE_MAP[char1]];
  const pronunciation2 = Array.isArray(HOMOPHONE_MAP[char2]) ? HOMOPHONE_MAP[char2] : [HOMOPHONE_MAP[char2]];
  
  // 检查是否有相同的发音
  for (const p1 of pronunciation1) {
    for (const p2 of pronunciation2) {
      if (p1 === p2) return true;
    }
  }
  
  return false;
}

/**
 * 计算两个文本的相似度（百分比）
 * @param {string} text1 - 原始文本
 * @param {string} text2 - 比较文本
 * @returns {Object} 包含相似度百分比和检测到的多音字信息
 */
export function calculateTextSimilarity(text1, text2) {
  if (!text1 || !text2) return { similarity: 0, homophones: [] };
  
  // 移除标点和空格，转为小写进行比较
  const cleanText1 = cleanTextForComparison(text1);
  const cleanText2 = cleanTextForComparison(text2);
  
  // 如果都是空字符串，视为100%匹配
  if (!cleanText1.length && !cleanText2.length) return { similarity: 100, homophones: [] };
  
  // 进行严格的顺序匹配和字符比对
  const { correctCount, totalCount, homophones } = performStrictCompare(cleanText1, cleanText2);
  
  // 计算相似度：正确字符数 / 总字符数
  const similarity = (correctCount / totalCount) * 100;
  
  // 开发环境下，输出多音字信息用于调试
  if (homophones.length > 0) {
    console.log('检测到以下多音字匹配：', homophones);
  }
  
  // 返回四舍五入的整数结果和多音字信息
  return { 
    similarity: Math.round(similarity), 
    homophones 
  };
}

/**
 * 执行严格的逐字比对，增加多音字处理
 * @param {string} originalText - 原始文本
 * @param {string} recognizedText - 识别文本
 * @returns {Object} 包含正确字符数、总字符数和多音字匹配信息的对象
 */
function performStrictCompare(originalText, recognizedText) {
  const totalCount = originalText.length;
  let correctCount = 0;
  let homophones = []; // 记录多音字匹配情况
  
  // 确定比较的最大长度（不超过原文长度）
  const compareLength = Math.min(originalText.length, recognizedText.length);
  
  // 逐字比对
  for (let i = 0; i < compareLength; i++) {
    const origChar = originalText[i];
    const recogChar = recognizedText[i];
    
    // 检查字符是否完全相同
    if (origChar === recogChar) {
      correctCount++;
    } 
    // 检查是否为多音字
    else if (areHomophones(origChar, recogChar)) {
      correctCount++;
      // 记录多音字匹配情况
      homophones.push({
        position: i, 
        original: origChar, 
        recognized: recogChar,
        text: `${origChar}→${recogChar}(位置:${i+1})` // 更友好的文本表示
      });
    }
  }
  
  return {
    correctCount,
    totalCount,
    homophones
  };
}

/**
 * 生成文本对比结果数组，标记每个字符是否正确
 * @param {string} originalText - 原始文本
 * @param {string} recognizedText - 识别文本
 * @returns {Array} 带有标记的字符数组，每个元素包含字符和是否正确的信息
 */
export function generateComparisonHtml(originalText, recognizedText) {
  if (!originalText || !recognizedText) {
    return originalText ? originalText.split('').map(char => ({ char, isCorrect: false })) : [];
  }
  
  // 将文本拆分为字符，同时保留标点符号的位置信息
  const originalChars = splitTextKeepingPunctuation(originalText);
  
  // 清理文本，去除标点等干扰因素
  const cleanOriginal = cleanTextForComparison(originalText);
  const cleanRecognized = cleanTextForComparison(recognizedText);
  
  // 创建结果数组，默认所有字符都标记为错误
  const result = originalChars.map(({ char, isPunctuation }) => ({
    char,
    isCorrect: false,
    isPunctuation,
    isHomophone: false // 标记是否为多音字匹配
  }));
  
  // 维护不含标点的原始文本中字符的索引映射
  let originalTextIndex = 0;
  
  // 获取比较的最大长度（不超过清理后原文的长度）
  const compareLength = Math.min(cleanOriginal.length, cleanRecognized.length);
  
  // 遍历原始字符（包括标点）
  for (let i = 0; i < originalChars.length; i++) {
    const { char, isPunctuation } = originalChars[i];
    
    if (isPunctuation) {
      // 标点符号的处理：根据前后字符的正确性来判断
      const prevCharCorrect = i > 0 && result[i - 1].isCorrect;
      const nextCharCorrect = i < originalChars.length - 1 && result[i + 1] && result[i + 1].isCorrect;
      result[i].isCorrect = prevCharCorrect || nextCharCorrect;
    } else {
      // 非标点字符：严格按顺序比对，增加多音字检查
      if (originalTextIndex < compareLength && originalTextIndex < cleanRecognized.length) {
        const origChar = cleanOriginal[originalTextIndex];
        const recogChar = cleanRecognized[originalTextIndex];
        
        // 检查是否完全相同
        if (origChar === recogChar) {
          result[i].isCorrect = true;
        } 
        // 检查是否为多音字
        else if (areHomophones(origChar, recogChar)) {
          result[i].isCorrect = true;
          result[i].isHomophone = true; // 标记为多音字匹配
        } else {
          result[i].isCorrect = false;
        }
        
        originalTextIndex++;
      } else {
        // 识别文本较短，原文剩余部分全部标记为错误
        result[i].isCorrect = false;
      }
    }
  }
  
  return result;
}

/**
 * 将文本拆分为字符，并标记标点符号
 * @param {string} text - 原始文本
 * @returns {Array} 带标记的字符数组
 */
function splitTextKeepingPunctuation(text) {
  const result = [];
  const punctuationRegex = /[^\w\u4e00-\u9fa5]/; // 标点符号和特殊字符的正则表达式
  
  // 拆分文本为字符数组
  const chars = text.split('');
  
  // 标记每个字符是否为标点
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    const isPunctuation = punctuationRegex.test(char) && char.trim() !== '';
    result.push({ char, isPunctuation });
  }
  
  return result;
}

/**
 * 清理文本用于比较
 * @param {string} text - 原始文本
 * @returns {string} 清理后的文本
 */
function cleanTextForComparison(text) {
  if (!text) return '';
  
  // 转为小写
  let cleanText = text.toLowerCase();
  
  // 移除标点符号和特殊字符
  cleanText = cleanText.replace(/[^\w\s\u4e00-\u9fa5]/gi, '');
  
  // 移除多余空格
  cleanText = cleanText.replace(/\s+/g, ' ').trim();
  
  return cleanText;
}

/**
 * 生成UUID
 * @returns {string} UUID字符串
 */
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default {
  calculateTextSimilarity,
  generateComparisonHtml,
  generateUUID
}; 