// pages/student/reading/reading.js
// 引入微信同声传译插件
const plugin = requirePlugin("WechatSI");
// 获取全局唯一的语音识别管理器
const manager = plugin.getRecordRecognitionManager();

Page({
  data: {
    article: {},
    recordStatus: 'idle', // idle, recording, processing
        recordTime: 0, // 录音时长，单位秒
    showResult: false,
        audioFile: '',
        waveHeights: [],
        waveTimer: null,
        readingResult: { score: 0, flowers: [], feedback: '', correctWords: 0, totalWords: 0, accuracy: 0, contentWithErrors: '', recognizedText: '' },
        isPlayingReading: false, // 是否正在播放范读
        mode: 'practice', // reading 页面现在只处理 practice 模式
        isLoading: false,
        recordHint: ''
    },

    // --- 实例状态变量 ---
    audioContext: null,
    textChunks: [],
    currentReadingChunkIndex: 0,
    isReadingStopped: false,
    articleId: null,
    playbackPhase: 'idle',
    _isCleaningUp: false,
    recordTimer: null,
    maxRecordDuration: 120,
    // --- 实例状态变量结束 ---

    onLoad(options) {
        console.log("朗读页面加载，options:", options);
        this.setData({ isLoading: true });
        this.initRecord();
        this.initAudioContext();
        this.checkRecordPermission();

        if (options.id) {
            console.log(`[reading.js onLoad] 练习模式，articleId: ${options.id}`);
            this.articleId = options.id;
            this.setData({ mode: 'practice' });
            this.loadArticle(options.id);
        } else {
            console.error('[reading.js onLoad] 缺少文章 ID (id)');
            wx.showToast({ title: '页面参数错误', icon: 'none' });
            this.setData({ isLoading: false });
        }
    },

    loadArticle(id) {
        console.log('[reading.js loadArticle] 加载文章，ID:', id);
        this.setData({ isLoading: true });
        const app = getApp(); let articleData = null;
        if (app.globalData && app.globalData.articles) { articleData = app.globalData.articles.find(article => article.id === id); }
        if (!articleData) { try { const storedArticles = wx.getStorageSync('articles'); if (storedArticles) { articleData = storedArticles.find(article => article.id === id); } } catch (e) { console.error("加载本地存储文章失败", e); } }
        if (articleData) {
            console.log('[reading.js loadArticle] 找到文章:', articleData.title);
            let wordCount = 0; const content = articleData.content || ''; const language = articleData.language;
            const punctuationAndSpaceRegex = /[.,!?;:"'()，。！？；："'（）《》【】、~——\s]/g;
            const normContent = content.toLowerCase().replace(punctuationAndSpaceRegex, '');
            if (language === 'zh') { wordCount = normContent.length; }
            else { wordCount = normContent.split(/\s+/).filter(Boolean).length; }
            articleData.wordCount = wordCount;
            let estimatedTime = 0; if (wordCount > 0) { estimatedTime = Math.ceil(wordCount / (language === 'zh' ? 3 : 2)); }
            articleData.estimatedTime = estimatedTime;
            console.log('[reading.js loadArticle] 计算结果 (无标点) wordCount:', wordCount, ', estimatedTime:', estimatedTime);
            this.setData({ article: articleData, isLoading: false });
            wx.setNavigationBarTitle({ title: articleData.title || '朗读练习' });
        } else { console.error('[reading.js loadArticle] 未能找到文章 ID:', id); this.setData({ isLoading: false }); wx.showToast({ title: '加载文章失败', icon: 'none' }); }
  },
  
  onUnload() {
        if (this.recordTimer) {
            clearInterval(this.recordTimer);
            this.recordTimer = null;
        }
        if (manager && this.data.recordStatus === 'recording') {
            try {
                manager.stop();
            } catch (e) {
                console.warn('[onUnload] 停止录音出错:', e);
            }
        }
        if (this.audioContext) {
            this.audioContext.stop();
            this.audioContext.destroy();
            this.audioContext = null;
        }
        if (this.waveTimer) {
            clearInterval(this.waveTimer);
            this.waveTimer = null;
        }
    },

    checkRecordPermission() {
        wx.getSetting({
            success: (res) => {
                if (!res.authSetting['scope.record']) {
                    console.log('朗读页面：未获取权限，尝试请求');
                    wx.authorize({
                        scope: 'scope.record',
                        success: () => {
                            console.log('录音权限授权成功');
                        },
                        fail: () => {
                            console.error('用户拒绝录音权限');
                            wx.showModal({
                                title: '提示',
                                content: '朗读练习需要录音权限才能进行。',
                                confirmText: '去设置',
                                cancelText: '取消',
                                success: (mr) => {
                                    if (mr.confirm) wx.openSetting();
                                    else wx.showToast({ title: '未授权无法朗读', icon: 'none' });
                                }
                            });
                        }
                    });
                } else {
                    console.log('朗读页面：已获取录音权限');
                }
            },
            fail: (err) => {
                console.error('检查权限设置失败:', err);
            }
        });
    },

    initRecord() {
        manager.onRecognize = (res) => {
            console.log('[onRecognize Callback] Triggered. Result:', JSON.stringify(res));
            if (res.result) {
                console.log('[onRecognize] 识别结果:', res.result);
            }
        };

        manager.onStop = (res) => {
            console.log('[onStop Callback] Triggered. Result:', JSON.stringify(res));
            wx.hideLoading();
            if (this.recordTimer) {
                clearInterval(this.recordTimer);
                this.recordTimer = null;
            }
            if (this.waveTimer) {
                clearInterval(this.waveTimer);
                this.waveTimer = null;
                this.setData({ waveHeights: [] });
            }
            this.setData({ recordStatus: 'processing' });
            if (res.result) {
                console.log('[onStop] 结果有效，调用评估');
                this.evaluateReading(this.data.article.content, res.result);
            } else {
                console.error('[onStop Callback] 结果无效或为空');
                this.setData({ recordStatus: 'idle' });
                wx.showToast({ title: '未能识别到有效语音', icon: 'none' });
            }
        };

        manager.onError = (res) => {
            console.error('[onError Callback] Triggered. Error:', JSON.stringify(res));
            wx.hideLoading();
            if (this.recordTimer) {
                clearInterval(this.recordTimer);
                this.recordTimer = null;
            }
            if (this.waveTimer) {
                clearInterval(this.waveTimer);
                this.waveTimer = null;
                this.setData({ waveHeights: [] });
            }
            this.setData({ recordStatus: 'idle' });
            wx.showToast({ title: `识别错误: ${res.msg}`, icon: 'none' });
            this.cleanupReading();
        };
        console.log('朗读页面语音识别回调初始化完成');
    },

    // --- 范读功能 ---
    chunkText(text, maxLength) {
        if (!text) return [];
        const chunks = [];
        let currentChunk = '';
        const sentences = text.split(/([。！？.!?])/);

        for (let i = 0; i < sentences.length; i++) {
            const sentence = sentences[i];
            if (currentChunk.length + sentence.length <= maxLength) {
                currentChunk += sentence;
            } else {
                if (currentChunk) chunks.push(currentChunk);
                currentChunk = sentence;
            }
        }
        if (currentChunk) chunks.push(currentChunk);
        return chunks;
    },

    initAudioContext() {
        this.audioContext = wx.createInnerAudioContext();
        this.audioContext.onPlay(() => {
            console.log('[audioContext] 开始播放');
            this.setData({ isPlayingReading: true });
        });
        this.audioContext.onStop(() => {
            console.log('[audioContext] 停止播放');
            this.setData({ isPlayingReading: false });
        });
        this.audioContext.onEnded(() => {
            console.log('[audioContext] 播放结束');
            this.setData({ isPlayingReading: false });
            if (!this.isReadingStopped && this.currentReadingChunkIndex < this.textChunks.length - 1) {
                this.currentReadingChunkIndex++;
                this.processNextReadingChunk();
            } else {
                this.cleanupReading();
            }
        });
        this.audioContext.onError((res) => {
            console.error('[audioContext] 播放错误:', res);
            this.setData({ isPlayingReading: false });
            wx.showToast({ title: '播放失败', icon: 'none' });
            this.cleanupReading();
        });
    },

    handlePlayReading(event) {
        console.log('[handlePlayReading] 开始播放范读');
        if (this.data.isPlayingReading) {
            console.log('[handlePlayReading] 已经在播放中');
            return;
        }
        
        if (!this.data.article || !this.data.article.content) {
            console.error('[handlePlayReading] 文章内容为空');
            wx.showToast({ title: '文章内容为空', icon: 'none' });
            return;
        }

        this.isReadingStopped = false;
        this.currentReadingChunkIndex = 0;
        // 将标题和内容分开处理
        this.textChunks = [
            this.data.article.title,  // 第一块是标题
            ...this.chunkText(this.data.article.content, 100)  // 后面的块是内容
        ];
        console.log('[handlePlayReading] 文本分块完成，块数:', this.textChunks.length);
        
        this.startReadingFlow();
    },

    startReadingFlow() {
        console.log('[startReadingFlow] 开始范读流程');
        if (this.textChunks.length === 0) {
            console.error('[startReadingFlow] 没有文本块可播放');
            return;
        }
        
        this.setData({ isPlayingReading: true });
        this.processNextReadingChunk();
    },

    processNextReadingChunk() {
        if (this.isReadingStopped) {
            console.log('[processNextReadingChunk] 播放已停止');
            return;
        }
        
        if (this.currentReadingChunkIndex >= this.textChunks.length) {
            console.log('[processNextReadingChunk] 所有文本块已播放完成');
            this.cleanupReading();
            return;
        }
        
        const chunk = this.textChunks[this.currentReadingChunkIndex];
        console.log(`[processNextReadingChunk] 处理第 ${this.currentReadingChunkIndex + 1}/${this.textChunks.length} 块文本`);
        
        // 根据当前块是标题还是内容，设置不同的提示
        if (this.currentReadingChunkIndex === 0) {
            this.setData({ 
                isPlayingReading: true,
                recordStatus: 'idle',
                recordHint: '正在播放标题...'
            });
        } else {
            this.setData({ 
                isPlayingReading: true,
                recordStatus: 'idle',
                recordHint: '正在播放内容...'
            });
        }
        
        this.synthesizeSpeech(chunk);
    },

    synthesizeSpeech(text) {
        if (!text) {
            console.error('[synthesizeSpeech] 文本为空');
            return;
        }
        
        plugin.textToSpeech({
            lang: this.data.article.language === 'zh' ? 'zh_CN' : 'en_US',
            content: text,
            success: (res) => {
                console.log('[synthesizeSpeech] 语音合成成功');
                if (res.filename) {
                    this.audioContext.src = res.filename;
                    this.audioContext.play();
                } else {
                    console.error('[synthesizeSpeech] 未获取到音频文件');
                    wx.showToast({ title: '语音合成失败', icon: 'none' });
                    this.cleanupReading();
                }
            },
            fail: (res) => {
                console.error('[synthesizeSpeech] 语音合成失败:', res);
                wx.showToast({ title: '语音合成失败', icon: 'none' });
                this.cleanupReading();
            }
        });
    },

    handleStopReading() {
        console.log('[handleStopReading] 停止播放范读');
        this.isReadingStopped = true;
        if (this.audioContext) {
            this.audioContext.stop();
        }
        this.cleanupReading();
    },

    cleanupReading() {
        console.log('[cleanupReading] 清理范读资源');
        this.isReadingStopped = true;
        this.currentReadingChunkIndex = 0;
        this.textChunks = [];
        this.setData({ isPlayingReading: false });
    },
    // --- 范读功能结束 ---

    // --- 录音功能 ---
  toggleRecording() {
        const currentStatus = this.data.recordStatus;
        console.log(`[toggleRecording] 当前状态: ${currentStatus}`);
        if (currentStatus === 'recording') {
            console.log('[toggleRecording] 调用 stopRecording');
            this.stopRecording();
        } else if (currentStatus === 'idle') {
            if (this.data.isPlayingReading) {
                console.log('[toggleRecording] 正在播放范读，先停止');
                this.handleStopReading();
                setTimeout(() => {
                    console.log('[toggleRecording] 延迟后调用 startRecording');
                    this.startRecording();
                }, 200);
            } else {
                console.log('[toggleRecording] 调用 startRecording');
      this.startRecording();
            }
        } else if (currentStatus === 'processing') {
            console.log('[toggleRecording] 正在处理中');
            wx.showToast({ title: '正在处理结果...', icon: 'none' });
    }
  },
  
  startRecording() {
        console.log('[startRecording] 准备开始朗读录音和识别');
        const article = this.data.article;
        if (!article || !article.content) {
            console.error('[startRecording] 文章数据不完整');
            wx.showToast({ title: '文章加载不完整', icon: 'none' });
            return;
        }
        const language = article.language === 'zh' ? 'zh_CN' : 'en_US';
        console.log(`[startRecording] 文章语言: ${article.language}, 识别语言: ${language}`);
    this.setData({
      recordStatus: 'recording',
            recordTime: 0,
            readingResult: {
                score: 0,
                flowers: [],
                feedback: '',
                correctWords: 0,
                totalWords: 0,
                accuracy: 0,
                contentWithErrors: '',
                recognizedText: ''
            },
            showResult: false
        });
        wx.showLoading({ title: '准备录音...' });
        try {
            console.log('[startRecording] Starting manager...');
            manager.start({ lang: language });
            console.log('[startRecording] Manager started successfully.');
            this.startRecordTimer();
            wx.hideLoading();
        } catch (error) {
            console.error('[startRecording] 启动录音失败:', error);
            wx.hideLoading();
            wx.showToast({ title: `启动录音失败: ${error.errMsg || '请重试'}`, icon: 'none' });
            this.setData({ recordStatus: 'idle' });
        }
    },

    stopRecording() {
        console.log('[stopRecording] 准备停止录音');
        if (this.data.recordStatus !== 'recording') {
            console.warn('[stopRecording] 非录音状态');
            return;
        }
        try {
            console.log('[stopRecording] Calling manager.stop()');
            manager.stop();
            console.log('[stopRecording] manager.stop() called.');
            if (this.recordTimer) {
                clearInterval(this.recordTimer);
                this.recordTimer = null;
            }
            wx.showLoading({ title: '正在识别...' });
        } catch (error) {
            console.error('[stopRecording] 调用 manager.stop() 失败:', error);
            wx.hideLoading();
            wx.showToast({ title: `停止录音失败: ${error.errMsg || '请重试'}`, icon: 'none' });
            if (this.recordTimer) {
                clearInterval(this.recordTimer);
                this.recordTimer = null;
            }
            this.setData({ recordStatus: 'idle' });
        }
    },

    startRecordTimer() {
        console.log('[startRecordTimer] 启动朗读录音计时器');
        if (this.recordTimer) {
            clearInterval(this.recordTimer);
        }
        this.recordTimer = setInterval(() => {
            if (this.data.recordStatus !== 'recording') {
                if (this.recordTimer) {
                    clearInterval(this.recordTimer);
                    this.recordTimer = null;
                }
                return;
            }
            const newTime = this.data.recordTime + 1;
            this.setData({ recordTime: newTime });
            if (newTime >= this.maxRecordDuration) {
                console.log('[Timer] 达到最大时长，自动停止');
        this.stopRecording();
      }
    }, 1000);
        console.log('[startRecordTimer] 计时器已设置, ID:', this.recordTimer);
    },
    // --- 录音功能结束 ---

    // --- 评估功能 ---
    evaluateReading(originalText, recognizedText) {
        console.log('[evaluateReading] 开始评估朗读');
        console.log('[evaluateReading] 原文长度:', originalText ? originalText.length : 0);
        console.log('[evaluateReading] 识别文本长度:', recognizedText ? recognizedText.length : 0);
        if (!originalText || !recognizedText) {
            console.error("评估错误：原文或识别文本为空");
            this.showErrorResult("评估失败，请重试");
            return;
        }

        const language = this.data.article.language;
        let comparisonResult;
        try {
            comparisonResult = this.compareTexts(originalText, recognizedText, language);
            console.log('[evaluateReading] 比较结果:', comparisonResult);
            if (!comparisonResult || typeof comparisonResult.accuracy !== 'number' || isNaN(comparisonResult.accuracy)) {
                console.warn('[evaluateReading] compareTexts 返回结果无效或 accuracy 非数字, 使用 0 作为默认值');
                const punctuationAndSpaceRegex = /[.,!?;:"'()，。！？；："'（）《》【】、~——\s]/g;
                const normOriginalLength = originalText ? (originalText.toLowerCase().replace(punctuationAndSpaceRegex, '').length) : 0;
                comparisonResult = {
                    accuracy: 0,
                    correctWords: 0,
                    totalWords: normOriginalLength,
                    contentWithErrors: '<span style="color:orange;">原文为空</span>'
                };
            }
        } catch (compareError) {
            console.error('[evaluateReading] 文本比较出错:', compareError);
            this.showErrorResult(`文本比较失败: ${compareError.message}`);
            return;
        }

        const totalWords = comparisonResult.totalWords;
        const correctWords = comparisonResult.correctWords;
        const accuracy = comparisonResult.accuracy;
        const score = this.calculateScore(accuracy, totalWords, language);
        const feedback = this.generateFeedback(score, accuracy);
        const flowers = this.generateFlowers(score);

        const finalResult = {
            score: score,
            accuracy: Math.round(accuracy),
            correctWords: correctWords,
            totalWords: totalWords,
            feedback: feedback,
            flowers: flowers,
            contentWithErrors: comparisonResult.contentWithErrors,
            recognizedText: recognizedText
        };
        console.log('[evaluateReading] 最终结果:', finalResult);
        this.setData({ readingResult: finalResult, showResult: true, recordStatus: 'idle' });
        console.log('[evaluateReading] 结果已设置，显示弹窗');

        try {
            const app = getApp();
            if (app && typeof app.addReadingRecord === 'function') {
                const recordData = {
                    articleId: this.articleId,
                    articleTitle: this.data.article.title,
                    score: finalResult.score,
                    accuracy: finalResult.accuracy,
                    type: 'reading',
                    timestamp: Date.now(),
                    feedbackHtml: finalResult.contentWithErrors,
                    recognizedText: finalResult.recognizedText,
                    duration: this.data.recordTime
                };
                console.log('[evaluateReading] 准备保存记录:', recordData);
                app.addReadingRecord(recordData);
            } else {
                console.warn('[evaluateReading] getApp() 未找到或 app.addReadingRecord 不是函数');
            }
        } catch (saveError) {
            console.error('[evaluateReading] 保存记录失败:', saveError);
        }
    },

    compareTexts(original, recognized, language) {
        console.log('[compareTexts] 开始比较');
        console.log('Original:', original);
        console.log('Recognized:', recognized);

        const numeralMap = { '零': '0', '壹': '1', '贰': '2', '叁': '3', '肆': '4', '伍': '5', '陆': '6', '柒': '7', '捌': '8', '玖': '9', '拾': '10' };
        const simpleNumeralMap = { '一': '1', '二': '2', '三': '3', '四': '4', '五': '5', '六': '6', '七': '7', '八': '8', '九': '9', '〇': '0', '十': '10' };
        const isDigit = (char) => /^[0-9]$/.test(char);
        const arabicToCapitalMap = Object.fromEntries(Object.entries(numeralMap).map(([k, v]) => [v, k]));
        const arabicToSimpleMap = Object.fromEntries(Object.entries(simpleNumeralMap).map(([k, v]) => [v, k]));

        const punctuationAndSpaceRegex = /[.,!?;:"'()，。！？；："'（）《》【】、~——\s]/g;

        if (!original) {
            console.warn('[compareTexts] 原文为空');
            return {
                accuracy: recognized ? 0 : 100,
                correctWords: 0,
                totalWords: 0,
                contentWithErrors: '<span style="color:orange;">原文为空</span>'
            };
        }
        if (!recognized) {
            console.warn('[compareTexts] 识别结果为空');
            const isChineseInner = language === 'zh';
            const displayTokensInner = isChineseInner ? original.split('') : original.split(/([.,!?;:"'()，。！？；："'（）《》【】、~——\s])/g).filter(Boolean);
            const separatorInner = isChineseInner ? '' : ' ';
            const errorsInner = displayTokensInner.map(token => /^[.,!?;:"'()，。！？；："'（）《》【】、~——\s]$/.test(token) ? token : `<span style="color:red;">${token}</span>`).join(separatorInner);
            let normOriginalLengthInner = 0;
            if (original) {
                const tempNormOrigInner = original.toLowerCase().replace(punctuationAndSpaceRegex, '');
                normOriginalLengthInner = isChineseInner ? tempNormOrigInner.length : tempNormOrigInner.split(/\s+/).filter(Boolean).length;
            }
            return {
                accuracy: 0,
                correctWords: 0,
                totalWords: normOriginalLengthInner,
                contentWithErrors: errorsInner
            };
        }

        const isChinese = language === 'zh';
        const separator = isChinese ? '' : ' ';

        const normalize = (text) => {
            if (!text) return '';
            text = text.toLowerCase();
            text = text.replace(punctuationAndSpaceRegex, '');
            return text;
        };
        const normalizedOriginalText = normalize(original);
        const normalizedRecognizedText = normalize(recognized);
        console.log('[compareTexts] Normalized Original:', normalizedOriginalText);
        console.log('[compareTexts] Normalized Recognized:', normalizedRecognizedText);

        const normOriginalTokens = isChinese ? normalizedOriginalText.split('') : normalizedOriginalText.split(/\s+/).filter(Boolean);
        const recognizedTokens = isChinese ? normalizedRecognizedText.split('') : normalizedRecognizedText.split(/\s+/).filter(Boolean);
        const originalLength = normOriginalTokens.length;
        const recognizedLength = recognizedTokens.length;
        console.log(`[compareTexts] NormOriginalLength (TotalWords for Accuracy): ${originalLength}`);

        const dp = Array(originalLength + 1).fill(0).map(() => Array(recognizedLength + 1).fill(0));
        for (let i = 1; i <= originalLength; i++) {
            for (let j = 1; j <= recognizedLength; j++) {
                const origNormToken = normOriginalTokens[i - 1];
                const recogToken = recognizedTokens[j - 1];
                let tokenMatch = (origNormToken === recogToken);
                if (!tokenMatch && isChinese) {
                    if (numeralMap[origNormToken] === recogToken ||
                        simpleNumeralMap[origNormToken] === recogToken ||
                        (isDigit(origNormToken) &&
                            (arabicToCapitalMap[origNormToken] === recogToken ||
                                arabicToSimpleMap[origNormToken] === recogToken))) {
                        tokenMatch = true;
                    }
                }
                if (tokenMatch) {
                    dp[i][j] = dp[i - 1][j - 1] + 1;
                } else {
                    dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
                }
            }
        }
        const correctWords = dp[originalLength][recognizedLength];
        const accuracy = originalLength > 0 ? (correctWords / originalLength) * 100 : (recognizedLength === 0 ? 100 : 0);
        console.log(`[compareTexts] CorrectWords: ${correctWords}, Accuracy: ${accuracy.toFixed(2)}%`);

        const displayTokens = isChinese ? original.split('') : original.split(/([.,!?;:"'()，。！？；："'（）《》【】、~——\s])/g).filter(Boolean);
        const errors = displayTokens.map(token => {
            if (/^[.,!?;:"'()，。！？；："'（）《》【】、~——\s]$/.test(token)) {
                return token;
            }
            const normToken = normalize(token);
            const isCorrect = recognizedTokens.some(recogToken => {
                if (normToken === recogToken) return true;
                if (isChinese) {
                    return numeralMap[normToken] === recogToken ||
                        simpleNumeralMap[normToken] === recogToken ||
                        (isDigit(normToken) &&
                            (arabicToCapitalMap[normToken] === recogToken ||
                                arabicToSimpleMap[normToken] === recogToken));
                }
                return false;
            });
            return isCorrect ? token : `<span style="color:red;">${token}</span>`;
        }).join(separator);

        return {
            accuracy: accuracy,
            correctWords: correctWords,
            totalWords: originalLength,
            contentWithErrors: errors
        };
    },

    calculateScore(accuracy, totalWords, language) {
        const baseScore = Math.round(accuracy);
        const wordBonus = Math.min(Math.floor(totalWords / 10), 10);
        return Math.min(baseScore + wordBonus, 100);
    },

    generateFeedback(score, accuracy) {
        if (score >= 90) return '非常棒！发音准确，语调自然。';
        if (score >= 80) return '很好！发音基本准确，继续努力。';
        if (score >= 70) return '不错！发音有待提高，多加练习。';
        if (score >= 60) return '继续加油！注意发音准确性。';
        return '需要多加练习，注意发音和语调。';
    },

    generateFlowers(score) {
        const flowers = [];
        const flowerCount = Math.floor(score / 20);
        for (let i = 0; i < flowerCount; i++) {
            flowers.push('🌺');
        }
        return flowers;
    },

    showErrorResult(message) {
      this.setData({
        readingResult: {
                score: 0,
                flowers: [],
                feedback: message,
                correctWords: 0,
                totalWords: 0,
                accuracy: 0,
                contentWithErrors: message,
                recognizedText: ''
        },
        showResult: true,
        recordStatus: 'idle'
      });
  }
});