Page({
  data: {
    article: {},
    recordStatus: 'idle', // idle, recording, processing
    recordTime: 0,
    showResult: false,
    recordTimer: null,
    testMode: false, // 测试模式开关
    readingResult: {
      score: 0,
      flowers: [],
      feedback: '',
      correctWords: 0,
      totalWords: 0,
      accuracy: 0,
      contentWithErrors: '', // 带错误标记的内容
      recognizedText: '' // 识别出的文本
    }
  },
  
  onLoad(options) {
    const id = options.id;
    this.loadArticle(id);
    
    // 加载测试模式设置
    const testMode = wx.getStorageSync('reading_test_mode') || false;
    this.setData({ testMode });
  },
  
  onUnload() {
    // 清除计时器
    if (this.data.recordTimer) {
      clearInterval(this.data.recordTimer);
    }
  },
  
  // 返回按钮拦截
  onBackPress() {
    // 如果正在录音，显示确认对话框
    if (this.data.recordStatus === 'recording') {
      wx.showModal({
        title: '提示',
        content: '录音尚未完成，确定要退出吗？',
        success: (res) => {
          if (res.confirm) {
            // 用户点击确定，停止录音并退出
            clearInterval(this.data.recordTimer);
            this.setData({
              recordStatus: 'idle'
            });
            return false; // 不拦截返回
          } else {
            // 用户点击取消，继续录音
            return true; // 拦截返回操作
          }
        }
      });
      return true; // 拦截返回操作，等待对话框结果
    }
    return false; // 不拦截返回
  },
  
  loadArticle(id) {
    console.log('加载文章，ID:', id);
    const app = getApp();
    
    // 从全局数据中获取文章
    const articles = app.globalData.articles || [];
    console.log('全局文章数据:', articles);
    
    // 查找匹配的文章
    const article = articles.find(item => item.id === id);
    
    if (article) {
      // 文章存在，加载文章数据
      console.log('找到文章:', article);
      
      // 计算字数
      const wordCount = article.language === 'zh' ? 
        article.content.length : 
        article.content.split(/\s+/).length;
      
      this.setData({
        article: {
          _id: article.id,
          title: article.title,
          content: article.content,
          language: article.language,
          wordCount: wordCount
        }
      });
    } else {
      // 文章不存在，显示错误信息
      console.error('找不到ID为', id, '的文章');
      wx.showToast({
        title: '找不到该文章',
        icon: 'error'
      });
      
      // 返回上一页
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }
  },
  
  toggleRecording() {
    if (this.data.recordStatus === 'idle') {
      this.startRecording();
    } else if (this.data.recordStatus === 'recording') {
      this.stopRecording();
    }
  },
  
  startRecording() {
    // 在实际项目中，应使用微信小程序的录音API
    // 这里模拟录音过程
    this.setData({
      recordStatus: 'recording',
      recordTime: 0
    });
    
    // 设置计时器
    const timer = setInterval(() => {
      this.setData({
        recordTime: this.data.recordTime + 1
      });
      
      // 模拟最长录音时间，延长到120秒以适应较长篇幅
      if (this.data.recordTime >= 120) {
        this.stopRecording();
      }
    }, 1000);
    
    this.setData({
      recordTimer: timer
    });
  },
  
  stopRecording() {
    // 停止计时器
    clearInterval(this.data.recordTimer);
    
    // 模拟处理过程
    this.setData({
      recordStatus: 'processing'
    });
    
    // 模拟语音识别过程
    setTimeout(() => {
      // 获取文章内容和语言
      const originalContent = this.data.article.content;
      const language = this.data.article.language;
      
      // 模拟语音识别结果（故意引入一些错误以模拟真实情况）
      const recognizedText = this.simulateRecognition(originalContent, language);
      
      // 进行文本比对，找出错误
      const {errorPositions, accuracy, correctWords, totalWords} = this.compareTexts(originalContent, recognizedText, language);
      
      // 计算小红花数量
      const flowerCount = this.calculateFlowers(accuracy);
      
      // 生成带错误标记的内容
      const contentWithErrors = this.markErrorsFromComparison(originalContent, errorPositions, language);
      
      console.log('文本比对结果:', {
        originalContent,
        recognizedText,
        errorPositions,
        accuracy
      });
      
      this.setData({
        readingResult: {
          score: accuracy,
          flowers: new Array(flowerCount),
          feedback: this.generateFeedback(accuracy),
          correctWords: correctWords,
          totalWords: totalWords,
          accuracy: accuracy,
          contentWithErrors: contentWithErrors,
          recognizedText: recognizedText
        },
        showResult: true,
        recordStatus: 'idle'
      });
    }, 2000);
  },
  
  // 模拟语音识别结果
  simulateRecognition(originalText, language) {
    // 这里我们实现一个更贴近真实语音识别的模拟功能
    // 在实际项目中，应当替换为微信小程序的真实语音识别API
    
    // 检查是否处于测试模式
    const testMode = this.data.testMode;
    
    if (testMode) {
      console.log('已开启测试模式，将增强错误识别能力');
      // 在测试模式下，大幅提高错误率以检测系统能力
      return this.generateErrorText(originalText, language, 0.4); // 40%的错误率
    }
    
    // 特定测试案例 - 静夜思
    if (originalText.includes('床前明月光') && language === 'zh') {
      console.log('使用中文特定测试案例：静夜思');
      // 这里模拟识别出的错误版本
      return '床啊前明月光，疑是地上霜，举头望明月，低头吧思故乡。';
    }
    
    // 特定测试案例 - 英文诗
    if (originalText.includes('Whose woods these are') && language === 'en') {
      console.log('使用英文特定测试案例：Stopping by Woods');
      // 这里模拟识别出的错误版本
      return 'Whose woods zese are I sink I know. His house is in ze village so. He will not see me stopping here. To watch his woods fill up with snow.';
    }
    
    // 判断当前是否在录音中
    // 如果是真实录音，则应该进入这里的逻辑
    // 修改错误概率逻辑，确保每次都能检测到一些错误
    return this.generateErrorText(originalText, language, 0.15); // 普通模式下15%的错误率
  },
  
  // 根据错误率生成错误文本
  generateErrorText(originalText, language, errorRate) {
    if (language === 'zh') {
      // 中文处理
      let chars = originalText.split('');
      
      // 确保至少有一个错误，除非文本很短
      const minErrors = chars.length <= 5 ? 1 : 2;
      const errorCount = Math.max(minErrors, Math.floor(chars.length * errorRate));
      
      // 选择错误位置，优先选择常见易错字的位置
      let errorPositions = this.getSmartErrorPositions(chars, errorCount);
      
      // 引入错误
      errorPositions.forEach(pos => {
        if (pos >= chars.length) return;
        
        // 根据字符的不同特性，选择不同的错误类型
        const errorType = this.determineErrorType(chars[pos]);
        
        if (errorType === 0) {
          // 漏字 - 删除字符
          chars[pos] = '';
        } else if (errorType === 1) {
          // 错字 - 替换为形近音近字
          chars[pos] = this.getSimilarChar(chars[pos]);
        } else if (errorType === 2) {
          // 额外字 - 在此位置后插入一个额外字符
          const extraChar = this.getExtraChar(chars[pos]);
          chars[pos] += extraChar;
        } else if (errorType === 3) {
          // 音调不准 - 替换为同音不同调的字
          chars[pos] = this.getSimilarToneChar(chars[pos]);
        }
      });
      
      return chars.join('');
    } else {
      // 英文处理
      let words = originalText.split(/\s+/);
      
      // 确保至少有一个错误，除非文本很短
      const minErrors = words.length <= 3 ? 1 : 2;
      const errorCount = Math.max(minErrors, Math.floor(words.length * errorRate));
      
      // 选择错误位置，优先选择长单词或常见易错单词
      let errorPositions = this.getSmartErrorPositions(words, errorCount);
      
      // 引入错误
      errorPositions.forEach(pos => {
        if (pos >= words.length) return;
        
        // 根据单词特性选择错误类型
        const errorType = this.determineWordErrorType(words[pos]);
        
        if (errorType === 0) {
          // 漏词 - 删除单词
          words[pos] = '';
        } else if (errorType === 1) {
          // 错词 - 替换为形近音近词
          words[pos] = this.getSimilarWord(words[pos]);
        } else if (errorType === 2) {
          // 口音问题 - 替换某些音素
          words[pos] = this.getAccentedWord(words[pos]);
        } else if (errorType === 3) {
          // 额外词 - 在此位置后插入一个额外单词
          const extraWord = this.getExtraWord();
          words[pos] += ' ' + extraWord;
        }
      });
      
      return words.join(' ');
    }
  },
  
  // 智能选择错误位置（优先选择常见易错位置）
  getSmartErrorPositions(textArray, errorCount) {
    // 筛选出可能的易错位置
    const potentialErrorPositions = [];
    
    // 遍历文本，评估每个位置的"易错性"
    for (let i = 0; i < textArray.length; i++) {
      const item = textArray[i];
      let errorPotential = 0;
      
      // 中文字符
      if (typeof item === 'string' && /[\u4e00-\u9fa5]/.test(item)) {
        // 多音字、形近字等更容易出错
        if (this.isCommonlyMispronouncedChar(item)) {
          errorPotential += 5;
        }
        
        // 生僻字更容易出错
        if (this.isUncommonChar(item)) {
          errorPotential += 3;
        }
      } 
      // 英文单词
      else if (typeof item === 'string' && /[a-zA-Z]/.test(item)) {
        // 长单词更容易出错
        if (item.length > 6) {
          errorPotential += 3;
        }
        
        // 不规则发音的单词更容易出错
        if (this.hasIrregularPronunciation(item)) {
          errorPotential += 4;
        }
      }
      
      // 词的位置也影响错误率（如句首句尾）
      if (i === 0 || i === textArray.length - 1) {
        errorPotential += 1;
      }
      
      // 加入潜在错误位置表
      potentialErrorPositions.push({
        index: i,
        potential: errorPotential || 1 // 至少有1的基础值
      });
    }
    
    // 按错误潜力排序
    potentialErrorPositions.sort((a, b) => b.potential - a.potential);
    
    // 选择前N个位置
    const selectedPositions = potentialErrorPositions
      .slice(0, errorCount * 2) // 选择错误数量的2倍备选
      .map(item => item.index);
    
    // 如果有足够的位置，随机选择，否则全部使用
    let finalPositions = [];
    if (selectedPositions.length > errorCount) {
      // 随机选择，但保证位置分散
      selectedPositions.sort((a, b) => a - b); // 先按位置排序
      
      // 每隔一定距离选择一个位置
      const step = Math.floor(selectedPositions.length / errorCount);
      for (let i = 0; i < errorCount && i * step < selectedPositions.length; i++) {
        finalPositions.push(selectedPositions[i * step]);
      }
      
      // 如果还不够，随机补充
      while (finalPositions.length < errorCount) {
        const randPos = selectedPositions[Math.floor(Math.random() * selectedPositions.length)];
        if (!finalPositions.includes(randPos)) {
          finalPositions.push(randPos);
        }
      }
    } else {
      finalPositions = selectedPositions;
    }
    
    return finalPositions;
  },
  
  // 判断字符的错误类型
  determineErrorType(char) {
    if (!char) return 1;
    
    // 针对不同类型的字符，倾向于不同的错误类型
    if (this.isCommonlyMispronouncedChar(char)) {
      // 容易读错音调的字更可能被错误替换
      return Math.random() < 0.7 ? 3 : 1;
    }
    
    if (this.isUncommonChar(char)) {
      // 生僻字更可能被漏掉或错读
      return Math.random() < 0.5 ? 0 : 1;
    }
    
    // 常见的连接词后面可能加填充词
    if ('的地得了吧啊呢'.includes(char)) {
      return Math.random() < 0.6 ? 2 : 1;
    }
    
    // 其他情况，随机选择错误类型
    const weights = [0.2, 0.4, 0.2, 0.2]; // 漏字、错字、额外字、音调错的权重
    const rand = Math.random();
    let sum = 0;
    
    for (let i = 0; i < weights.length; i++) {
      sum += weights[i];
      if (rand < sum) return i;
    }
    
    return 1; // 默认是错字
  },
  
  // 判断单词的错误类型
  determineWordErrorType(word) {
    if (!word) return 1;
    
    // 非常短的单词（如a, an, the）可能被漏掉
    if (word.length <= 2) {
      return Math.random() < 0.7 ? 0 : 3;
    }
    
    // 长单词更可能发音不准
    if (word.length >= 7) {
      return Math.random() < 0.6 ? 2 : 1;
    }
    
    // 不规则发音的单词更可能读错
    if (this.hasIrregularPronunciation(word)) {
      return Math.random() < 0.7 ? 1 : 2;
    }
    
    // 常见填充词可能被添加
    if (['and', 'but', 'or', 'so'].includes(word.toLowerCase())) {
      return Math.random() < 0.5 ? 3 : 1;
    }
    
    // 其他情况，随机选择错误类型
    const weights = [0.2, 0.3, 0.3, 0.2]; // 漏词、错词、口音问题、额外词的权重
    const rand = Math.random();
    let sum = 0;
    
    for (let i = 0; i < weights.length; i++) {
      sum += weights[i];
      if (rand < sum) return i;
    }
    
    return 1; // 默认是错词
  },
  
  // 判断是否是常见易错字
  isCommonlyMispronouncedChar(char) {
    // 多音字、容易读错的字
    const commonlyMispronounced = '行藏得背还好着差处长假地重谁要说';
    return commonlyMispronounced.includes(char);
  },
  
  // 判断是否是生僻字
  isUncommonChar(char) {
    // 一些相对生僻的字
    const uncommonChars = '赋缀骇慑潋潆缤纷琳琅霓虹璀璨斡旋';
    return uncommonChars.includes(char);
  },
  
  // 判断是否是不规则发音的英文单词
  hasIrregularPronunciation(word) {
    // 一些发音不规则的单词
    const irregularWords = [
      'though', 'through', 'tough', 'thought', 'thorough',
      'enough', 'cough', 'borough', 'yacht', 'colonel',
      'choir', 'island', 'iron', 'queue', 'quay',
      'women', 'recipe', 'leopard', 'facade', 'debris'
    ];
    return irregularWords.includes(word.toLowerCase());
  },
  
  // 获取形近音近字
  getSimilarChar(char) {
    // 常见的音近形近字对照表
    const similarChars = {
      '的': '地得底帝', '是': '事市十时实式', '在': '再载栽仔',
      '和': '河何合荷盒贺', '了': '啦料咯', '地': '的得底第低帝',
      '得': '的地德锝', '你': '拟泥尼', '我': '窝卧握', '他': '她它塔踏',
      '这': '着哲遮折', '有': '又友右佑幼', '人': '仁忍刃认任',
      '不': '步部布补捕', '就': '旧九酒救舅', '说': '水税睡瑞',
      '会': '回汇惠绘悔贿', '能': '嫩农浓', '那': '哪拿纳娜',
      '想': '响向项象橡', '去': '趣区曲取', '做': '作坐座左昨',
      '为': '位未围维违', '子': '自字籽紫资', '来': '赖莱睐'
    };
    
    if (similarChars[char]) {
      const options = similarChars[char].split('');
      return options[Math.floor(Math.random() * options.length)];
    }
    
    // 如果没有预定义的相似字，返回原字符
    return char;
  },
  
  // 获取同音不同调的字
  getSimilarToneChar(char) {
    // 一些常见的同音不同调字
    const similarToneChars = {
      '行': '杏幸型姓兴', '藏': '仓沧舱苍', '得': '德锝', 
      '背': '贝碑悲卑杯', '还': '环缓换唤欢', '好': '号浩耗毫豪',
      '着': '找招照赵朝', '差': '插叉茶查岔', '处': '除储厨初楚',
      '长': '常场肠尝偿', '假': '甲钾嘉佳家', '地': '底递第弟帝',
      '重': '崇虫充冲', '谁': '水税睡瑞', '要': '咬姚窑谣遥',
      '说': '朔硕烁铄', '大': '达打搭答', '中': '终钟忠衷肿',
      '都': '读督毒独', '没': '摸模膜馍末'
    };
    
    if (similarToneChars[char]) {
      const options = similarToneChars[char].split('');
      return options[Math.floor(Math.random() * options.length)];
    }
    
    // 如果没有预定义的同音不同调字，返回原字符
    return char;
  },
  
  // 获取额外的填充字符
  getExtraChar(prevChar) {
    // 根据前一个字符的特点，选择合适的填充字
    if ('的地得'.includes(prevChar)) {
      return ['一', '是', '有', '能', '在'][Math.floor(Math.random() * 5)];
    }
    
    if ('我你他她它'.includes(prevChar)) {
      return ['们', '的', '是', '也', '就'][Math.floor(Math.random() * 5)];
    }
    
    // 默认的填充字
    const fillers = ['啊', '呢', '吧', '哦', '呀', '嗯', '哈', '嘿', '了', '的'];
    return fillers[Math.floor(Math.random() * fillers.length)];
  },
  
  // 获取相似英文单词
  getSimilarWord(word) {
    // 一些常见的形近音近词对照
    const similarWords = {
      'their': ['there', 'they\'re', 'they'], 'your': ['you\'re', 'you'],
      'its': ['it\'s', 'it'], 'to': ['too', 'two'], 'than': ['then', 'that'],
      'affect': ['effect'], 'accept': ['except'], 'advice': ['advise'],
      'already': ['all ready'], 'piece': ['peace'], 'quite': ['quiet', 'quit'],
      'weather': ['whether'], 'lose': ['loose'], 'principle': ['principal'],
      'stationary': ['stationery'], 'whose': ['who\'s'], 'a lot': ['alot', 'allot']
    };
    
    if (similarWords[word.toLowerCase()]) {
      const options = similarWords[word.toLowerCase()];
      return options[Math.floor(Math.random() * options.length)];
    }
    
    // 如果没有预定义的相似词，随机改变一个字母
    if (word.length > 2) {
      const pos = Math.floor(Math.random() * word.length);
      const replacements = 'abcdefghijklmnopqrstuvwxyz';
      const newChar = replacements[Math.floor(Math.random() * replacements.length)];
      return word.substring(0, pos) + newChar + word.substring(pos + 1);
    }
    
    return word;
  },
  
  // 模拟口音问题
  getAccentedWord(word) {
    // 模拟一些常见的口音特点
    
    // 例如，将"th"发音替换为"z"或"s"
    let result = word.replace(/th/g, Math.random() < 0.5 ? 'z' : 's');
    
    // 将"v"发音替换为"w"或"f"
    result = result.replace(/v/g, Math.random() < 0.5 ? 'w' : 'f');
    
    // 将"r"发音弱化或省略
    if (result.includes('r') && Math.random() < 0.7) {
      result = result.replace(/r/g, '');
    }
    
    // 有时混淆"l"和"r"
    if (result.includes('l') && Math.random() < 0.4) {
      result = result.replace(/l/g, 'r');
    }
    
    // 有时短元音拉长
    if (Math.random() < 0.3) {
      result = result.replace(/a/g, 'aa').replace(/e/g, 'ee');
    }
    
    return result;
  },
  
  // 获取额外的填充单词
  getExtraWord() {
    const fillers = ['um', 'ah', 'like', 'so', 'well', 'actually', 'basically', 'literally', 'you know', 'I mean'];
    return fillers[Math.floor(Math.random() * fillers.length)];
  },
  
  // 比较原文和识别结果，找出错误
  compareTexts(original, recognized, language) {
    if (language === 'zh') {
      // 中文处理
      return this.compareChineseTexts(original, recognized);
    } else {
      // 英文处理
      return this.compareEnglishTexts(original, recognized);
    }
  },
  
  // 中文文本比对（使用编辑距离的思想，但针对插入字符做特殊处理）
  compareChineseTexts(original, recognized) {
    const originalChars = original.split('');
    const recognizedChars = recognized.split('');
    
    // 执行序列对齐
    const alignment = this.getOptimalAlignment(originalChars, recognizedChars);
    console.log('中文对齐结果:', alignment);
    
    // 标记原文中的错误位置
    const errorPositions = [];
    let correctCount = 0;
    
    for (let i = 0; i < alignment.length; i++) {
      const [origIndex, recogIndex] = alignment[i];
      
      // 错误情况: 原文字符未被识别，或识别错误
      if (origIndex !== null) {
        if (recogIndex === null || originalChars[origIndex] !== recognizedChars[recogIndex]) {
          errorPositions.push(origIndex);
        } else {
          correctCount++;
        }
      }
      // 对于额外插入的字符，不计入原文的错误
    }
    
    const totalWords = originalChars.length;
    const accuracy = Math.round((correctCount / totalWords) * 100);
    
    return {
      errorPositions,
      accuracy,
      correctWords: correctCount,
      totalWords
    };
  },
  
  // 英文文本比对
  compareEnglishTexts(original, recognized) {
    const originalWords = original.split(/\s+/);
    const recognizedWords = recognized.split(/\s+/);
    
    // 执行序列对齐
    const alignment = this.getOptimalAlignment(originalWords, recognizedWords);
    console.log('英文对齐结果:', alignment);
    
    // 标记原文中的错误位置
    const errorPositions = [];
    let correctCount = 0;
    
    for (let i = 0; i < alignment.length; i++) {
      const [origIndex, recogIndex] = alignment[i];
      
      // 错误情况: 原文单词未被识别，或识别错误
      if (origIndex !== null) {
        if (recogIndex === null || !this.wordMatches(originalWords[origIndex], recognizedWords[recogIndex])) {
          errorPositions.push(origIndex);
        } else {
          correctCount++;
        }
      }
      // 对于额外插入的单词，不计入原文的错误
    }
    
    const totalWords = originalWords.length;
    const accuracy = Math.round((correctCount / totalWords) * 100);
    
    return {
      errorPositions,
      accuracy,
      correctWords: correctCount,
      totalWords
    };
  },
  
  // 获取两个序列的最优对齐（基于编辑距离的回溯）
  getOptimalAlignment(original, recognized) {
    const m = original.length;
    const n = recognized.length;
    
    // 创建距离矩阵
    const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
    
    // 初始化第一行和第一列
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    
    // 填充矩阵
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = original[i-1] === recognized[j-1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i-1][j] + 1,      // 删除
          dp[i][j-1] + 1,      // 插入
          dp[i-1][j-1] + cost  // 替换或匹配
        );
      }
    }
    
    // 回溯以找到最优对齐
    const alignment = [];
    let i = m, j = n;
    
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && dp[i][j] === dp[i-1][j-1] + (original[i-1] === recognized[j-1] ? 0 : 1)) {
        // 匹配或替换
        alignment.unshift([i-1, j-1]);
        i--; j--;
      } else if (i > 0 && dp[i][j] === dp[i-1][j] + 1) {
        // 删除（原文字符未被识别）
        alignment.unshift([i-1, null]);
        i--;
      } else {
        // 插入（识别文本中多出的字符）
        alignment.unshift([null, j-1]);
        j--;
      }
    }
    
    return alignment;
  },
  
  // 判断两个单词是否匹配（允许一定程度的容错）
  wordMatches(original, recognized) {
    if (!original || !recognized) return false;
    
    // 完全相同
    if (original.toLowerCase() === recognized.toLowerCase()) return true;
    
    // 允许轻微拼写错误（编辑距离为1）
    if (this.calculateEditDistance(original.toLowerCase(), recognized.toLowerCase()) <= 1) {
      return true;
    }
    
    return false;
  },
  
  // 计算编辑距离（Levenshtein距离）
  calculateEditDistance(s1, s2) {
    const m = s1.length;
    const n = s2.length;
    
    // 创建距离矩阵
    const dp = [];
    for (let i = 0; i <= m; i++) {
      dp[i] = [i];
    }
    for (let j = 1; j <= n; j++) {
      dp[0][j] = j;
    }
    
    // 填充矩阵
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (s1[i-1] === s2[j-1]) {
          dp[i][j] = dp[i-1][j-1];
        } else {
          dp[i][j] = Math.min(
            dp[i-1][j] + 1,    // 删除
            dp[i][j-1] + 1,    // 插入
            dp[i-1][j-1] + 1   // 替换
          );
        }
      }
    }
    
    return dp[m][n];
  },
  
  // 标记错误（根据比较结果）
  markErrorsFromComparison(content, errorPositions, language) {
    if (language === 'zh') {
      // 中文处理：将每个字符作为一个单元
      let chars = content.split('');
      
      // 构建带错误标记的内容 - 使用rich-text兼容的节点结构
      let nodes = [];
      for (let i = 0; i < chars.length; i++) {
        if (errorPositions.includes(i)) {
          nodes.push({
            name: 'span',
            attrs: {
              style: 'color: #ff4d4f; font-weight: bold;'
            },
            children: [{
              type: 'text',
              text: chars[i]
            }]
          });
        } else {
          nodes.push({
            type: 'text',
            text: chars[i]
          });
        }
      }
      return nodes;
    } else {
      // 英文处理：将每个单词作为一个单元
      let words = content.split(/\s+/);
      
      // 构建带错误标记的内容 - 使用rich-text兼容的节点结构
      let nodes = [];
      for (let i = 0; i < words.length; i++) {
        if (errorPositions.includes(i)) {
          nodes.push({
            name: 'span',
            attrs: {
              style: 'color: #ff4d4f; font-weight: bold;'
            },
            children: [{
              type: 'text',
              text: words[i]
            }]
          });
        } else {
          nodes.push({
            type: 'text',
            text: words[i]
          });
        }
        
        // 添加空格（除了最后一个单词后面）
        if (i < words.length - 1) {
          nodes.push({
            type: 'text',
            text: ' '
          });
        }
      }
      return nodes;
    }
  },
  
  calculateFlowers(accuracy) {
    if (accuracy >= 95) {
      return 3;
    } else if (accuracy >= 85) {
      return 2;
    } else if (accuracy >= 75) {
      return 1;
    }
    return 0;
  },
  
  generateFeedback(accuracy) {
    if (accuracy >= 95) {
      return "太棒了！你的朗读非常流利准确！";
    } else if (accuracy >= 85) {
      return "很好！继续练习，你会更加出色！";
    } else if (accuracy >= 75) {
      return "不错的尝试！再多练习几次吧！";
    } else if (accuracy >= 60) {
      return "加油！多读几遍可以做得更好哦！";
    } else {
      return "继续努力，慢慢朗读，注意每个字的发音！";
    }
  },
  
  tryAgain() {
    this.setData({
      showResult: false
    });
  },
  
  finishReading() {
    wx.navigateBack();
  },
  
  // 切换测试模式
  toggleTestMode(e) {
    const testMode = e.detail.value;
    this.setData({ testMode });
    wx.setStorageSync('reading_test_mode', testMode);
    
    // 显示提示
    wx.showToast({
      title: testMode ? '测试模式已开启' : '测试模式已关闭',
      icon: 'none'
    });
    
    console.log('测试模式状态:', testMode);
  },
  
  // 生成随机错误位置
  getRandomErrorPositions(total, errorCount) {
    let positions = [];
    while (positions.length < errorCount && positions.length < total) {
      let pos = Math.floor(Math.random() * total);
      if (!positions.includes(pos)) {
        positions.push(pos);
      }
    }
    return positions;
  }
});