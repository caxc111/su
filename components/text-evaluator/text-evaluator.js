Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 是否使用严格评分（背诵模式下通常更严格）
    strictMode: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {},

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 比较文本
     * @param {String} original 原文
     * @param {String} recognized 识别的文本
     * @param {String} language 语言
     * @returns {Object} 比较结果
     */
    compareTexts(original, recognized, language) {
      if (!original || !recognized) {
        console.error('[text-evaluator] 文本比较失败：原文或识别文本为空');
        return {
          correctCount: 0,
          originalLength: original ? original.length : 0,
          totalWords: original ? this.countWords(original, language) : 0,
          correctWords: 0,
          accuracy: 0,
          diffHtml: '<span class="error">评估失败</span>',
          score: 0
        };
      }

      // 预处理文本
      const preprocessed = this.preprocessTexts(original, recognized, language);

      // 根据语言选择不同的比较方法
      let result;
      if (language === 'zh') {
        result = this.compareChineseTexts(
          preprocessed.processedOriginal,
          preprocessed.processedRecognized,
          original
        );
      } else {
        result = this.compareEnglishTexts(
          preprocessed.processedOriginal,
          preprocessed.processedRecognized,
          original
        );
      }

      // 计算分数
      result.score = this.calculateScore(result.accuracy, language);

      return result;
    },

    /**
     * 预处理文本
     * @param {String} original 原文
     * @param {String} recognized 识别的文本
     * @param {String} language 语言
     * @returns {Object} 处理后的文本
     */
    preprocessTexts(original, recognized, language) {
      const processText = (text) => {
        if (!text) return '';

        let processed = text;

        // 转换为小写
        processed = processed.toLowerCase();

        // 根据语言进行不同的预处理
        if (language === 'zh') {
          // 中文：去除标点符号
          processed = processed.replace(/[，。！？；：""''【】（）、]/g, '');
        } else {
          // 英文：去除标点符号
          processed = processed.replace(/[,.!?;:'"()\[\]]/g, '');
        }

        // 去除多余的空格
        processed = processed.replace(/\s+/g, ' ').trim();

        return processed;
      };

      return {
        processedOriginal: processText(original),
        processedRecognized: processText(recognized)
      };
    },

    /**
     * 比较中文文本
     * @param {String} processedOriginal 处理后的原文
     * @param {String} processedRecognized 处理后的识别文本
     * @param {String} displayOriginal 原始原文（用于显示）
     * @returns {Object} 比较结果
     */
    compareChineseTexts(processedOriginal, processedRecognized, displayOriginal) {
      let correctCount = 0;
      let diffHtml = '';
      const originalLength = processedOriginal.length;
      
      // 使用动态规划寻找最长公共子序列
      const lcs = this.findLCS(processedOriginal, processedRecognized);
      let lcsIndex = 0;
      
      // 遍历原文字符
      let normalizedIndex = 0;
      for (let i = 0; i < displayOriginal.length; i++) {
        const originalChar = displayOriginal[i];
        
        // 检查是否为标点符号
        if (/[，。！？；：""''【】（）、\s]/.test(originalChar)) {
          diffHtml += originalChar;
          continue;
        }
        
        // 检查当前字符是否匹配最长公共子序列
        if (lcsIndex < lcs.length && normalizedIndex === lcs[lcsIndex].origIndex) {
          correctCount++;
          diffHtml += `<span class="correct">${originalChar}</span>`;
          lcsIndex++;
        } else {
          diffHtml += `<span class="error">${originalChar}</span>`;
        }
        
        normalizedIndex++;
      }
      
      // 计算准确率
      const accuracy = originalLength > 0 ? Math.round((correctCount / originalLength) * 100) : 0;
      
      return {
        correctCount: correctCount,
        originalLength: originalLength,
        totalWords: originalLength, // 中文每个字符算一个词
        correctWords: correctCount,
        accuracy: accuracy,
        diffHtml: diffHtml
      };
    },

    /**
     * 比较英文文本
     * @param {String} processedOriginal 处理后的原文
     * @param {String} processedRecognized 处理后的识别文本
     * @param {String} displayOriginal 原始原文（用于显示）
     * @returns {Object} 比较结果
     */
    compareEnglishTexts(processedOriginal, processedRecognized, displayOriginal) {
      const originalWords = processedOriginal.split(' ').filter(w => w);
      const recognizedWords = processedRecognized.split(' ').filter(w => w);
      const originalLength = originalWords.length;
      
      // 使用动态规划寻找最长公共子序列
      const lcs = this.findLCSWords(originalWords, recognizedWords);
      
      let correctCount = lcs.length;
      let diffHtml = '';
      
      // 将原始文本分割为单词和分隔符
      const originalParts = displayOriginal.split(/(\s+|[,.!?;:"'()[\]])/g).filter(p => p);
      let wordIndex = 0;
      let lcsIndex = 0;
      
      for (let i = 0; i < originalParts.length; i++) {
        const currentPart = originalParts[i];
        
        // 如果是空白或标点，直接添加
        if (/\s+|[,.!?;:"'()[\]]/.test(currentPart)) {
          diffHtml += currentPart;
          continue;
        }
        
        // 处理单词
        const currentWordNormalized = currentPart.toLowerCase().replace(/[,.!?;:"'()[\]]/g, '');
        
        // 如果当前单词在LCS中
        if (lcsIndex < lcs.length && wordIndex === lcs[lcsIndex].origIndex) {
          diffHtml += `<span class="correct">${currentPart}</span>`;
          lcsIndex++;
        } else {
          diffHtml += `<span class="error">${currentPart}</span>`;
        }
        
        wordIndex++;
      }
      
      // 计算准确率
      const accuracy = originalLength > 0 ? Math.round((correctCount / originalLength) * 100) : 0;
      
      return {
        correctCount: correctCount,
        originalLength: originalLength,
        totalWords: originalLength,
        correctWords: correctCount,
        accuracy: accuracy,
        diffHtml: diffHtml
      };
    },

    /**
     * 查找最长公共子序列（字符级别）
     * @param {String} str1 第一个字符串
     * @param {String} str2 第二个字符串
     * @returns {Array} 最长公共子序列索引数组
     */
    findLCS(str1, str2) {
      const m = str1.length;
      const n = str2.length;
      
      // 创建动态规划表
      const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
      
      // 填充动态规划表
      for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
          if (str1[i - 1] === str2[j - 1]) {
            dp[i][j] = dp[i - 1][j - 1] + 1;
          } else {
            dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
          }
        }
      }
      
      // 回溯找出LCS
      const lcs = [];
      let i = m, j = n;
      
      while (i > 0 && j > 0) {
        if (str1[i - 1] === str2[j - 1]) {
          lcs.unshift({
            origIndex: i - 1,
            recogIndex: j - 1,
            char: str1[i - 1]
          });
          i--; j--;
        } else if (dp[i - 1][j] > dp[i][j - 1]) {
          i--;
        } else {
          j--;
        }
      }
      
      return lcs;
    },

    /**
     * 查找最长公共子序列（单词级别）
     * @param {Array} words1 第一个单词数组
     * @param {Array} words2 第二个单词数组
     * @returns {Array} 最长公共子序列索引数组
     */
    findLCSWords(words1, words2) {
      const m = words1.length;
      const n = words2.length;
      
      // 创建动态规划表
      const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
      
      // 填充动态规划表
      for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
          if (words1[i - 1] === words2[j - 1]) {
            dp[i][j] = dp[i - 1][j - 1] + 1;
          } else {
            dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
          }
        }
      }
      
      // 回溯找出LCS
      const lcs = [];
      let i = m, j = n;
      
      while (i > 0 && j > 0) {
        if (words1[i - 1] === words2[j - 1]) {
          lcs.unshift({
            origIndex: i - 1,
            recogIndex: j - 1,
            word: words1[i - 1]
          });
          i--; j--;
        } else if (dp[i - 1][j] > dp[i][j - 1]) {
          i--;
        } else {
          j--;
        }
      }
      
      return lcs;
    },

    /**
     * 计算分数
     * @param {Number} accuracy 准确率
     * @param {String} language 语言
     * @returns {Number} 分数
     */
    calculateScore(accuracy, language) {
      // 根据准确率计算分数，满分100分
      // 不同语言可以有不同的评分标准
      let score = accuracy;
      
      // 严格模式下，可以调整评分标准
      if (this.properties.strictMode) {
        // 严格模式下，分数更严格
        score = Math.floor(accuracy * 0.95);
      }
      
      // 保证分数范围在0-100之间
      score = Math.max(0, Math.min(100, score));
      
      // 四舍五入到整数
      return Math.round(score);
    },

    /**
     * 统计单词数量
     * @param {String} text 文本
     * @param {String} language 语言
     * @returns {Number} 单词数量
     */
    countWords(text, language) {
      if (!text) return 0;
      
      if (language === 'zh') {
        // 中文按字符计数（去除标点和空格）
        return text.replace(/[，。！？；：""''【】（）、\s]/g, '').length;
      } else {
        // 英文按空格分隔的单词计数
        return text.split(/\s+/).filter(w => w && /[a-zA-Z]/.test(w)).length;
      }
    }
  }
}) 