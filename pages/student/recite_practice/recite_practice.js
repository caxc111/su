// pages/student/recite_practice/recite_practice.js
// 引入微信同声传译插件
const plugin = requirePlugin("WechatSI");

Page({
    data: {
        article: {},
        recitePhase: 'preview', // preview, reciting, complete
        recordStatus: 'idle', // idle, recording, processing
        recordTime: 0,
        showResult: false,
        recordTimer: null,
        recordingManager: null,
        audioFile: '',
        waveHeights: [],
        waveTimer: null,
        reciteResult: { score: 0, flowers: [], feedback: '', correctWords: 0, totalWords: 0, accuracy: 0, contentWithErrors: '', recognizedText: '' },
        isLoading: false
    },

    onLoad(options) {
        console.log('背诵练习页面加载，options:', options);
        this.setData({ isLoading: true });
        const id = options.id;
        if (id) { this.loadArticle(id); }
        else { console.error('[recite_practice onLoad] 缺少文章 ID'); wx.showToast({ title: '缺少文章ID', icon: 'none' }); this.setData({ isLoading: false }); }
        this.setData({ waveHeights: Array(8).fill(0).map(() => Math.floor(Math.random() * 10) + 5) });
        this.checkRecordPermission();
        this.initRecord();
    },

    loadArticle(id) {
        console.log('[recite_practice loadArticle] 加载文章，ID:', id);
        const app = getApp(); let articleData = null;
        if (app.globalData && app.globalData.articles) { articleData = app.globalData.articles.find(article => article.id === id); }
        if (!articleData) { try { const storedArticles = wx.getStorageSync('articles'); if (storedArticles) { articleData = storedArticles.find(article => article.id === id); } } catch (e) { console.error("从本地存储加载文章失败", e); } }
        if (articleData) { console.log('[recite_practice loadArticle] 找到文章:', articleData.title); this.setData({ article: articleData, isLoading: false }); wx.setNavigationBarTitle({ title: articleData.title || '背诵练习' }); }
        else { console.error('[recite_practice loadArticle] 未能找到ID为', id, '的文章'); wx.showToast({ title: '加载文章失败', icon: 'none' }); this.setData({ isLoading: false }); }
    },

    onUnload() { if (this.data.recordTimer) { clearInterval(this.data.recordTimer); } if (this.data.waveTimer) { clearInterval(this.data.waveTimer); } if (this.data.recordStatus === 'recording' && this.data.recordingManager) { try { this.data.recordingManager.stop(); } catch (e) { console.warn("onUnload stop manager error:", e); } } },
    checkRecordPermission() { wx.getSetting({ success: (res) => { if (!res.authSetting['scope.record']) { console.log('背诵练习页面：未获取权限，尝试请求'); wx.authorize({ scope: 'scope.record', success: () => { console.log('录音权限授权成功'); }, fail: () => { console.error('用户拒绝录音权限'); wx.showModal({ title: '提示', content: '背诵练习需要录音权限才能进行，请在设置中允许。', confirmText: '去设置', cancelText: '取消', success: (mr) => { if (mr.confirm) { wx.openSetting(); } else { wx.showToast({ title: '未授权无法背诵', icon: 'none' }); } } }); } }); } else { console.log('背诵练习页面：已获取录音权限'); } }, fail: (err) => { console.error('检查权限设置失败:', err); } }); },
    initRecord() {
        console.log('[initRecord] 开始初始化录音管理器');
        if (this.data.recordingManager) {
            console.log('[initRecord] 已存在录音管理器，先清理');
            this.cleanupRecite();
        }

        try {
            const manager = plugin.getRecordRecognitionManager();
            if (!manager) {
                console.error('[initRecord] 获取录音管理器失败');
                wx.showToast({ title: '录音功能初始化失败', icon: 'none' });
                return;
            }

            // 设置回调函数
            manager.onStart = (res) => {
                console.log('[onStart Callback] 录音开始', res);
                this.setData({ recordStatus: 'recording' });
                this.startRecordTimer();
            };

            manager.onRecognize = (res) => {
                if (res && res.result) {
                    console.log('[onRecognize Callback] 识别结果:', res.result);
                    this.setData({ recognizedText: res.result });
                }
            };

            manager.onStop = (res) => {
                console.log('[onStop Callback] 录音停止', res);
                this.stopRecordTimer();
                this.setData({ recordStatus: 'processing' });
                if (res && res.result) {
                    this.setData({ recognizedText: res.result });
                    this.evaluateRecitation(this.data.article.content, res.result);
                } else {
                    console.error('背诵语音识别未返回有效结果');
                    this.setData({ recordStatus: 'idle' });
                    wx.showToast({ title: '未能识别到有效语音', icon: 'none' });
                }
            };

            manager.onError = (res) => {
                console.error('[onError Callback] 录音或识别错误:', res);
                this.stopRecordTimer();
                this.setData({ recordStatus: 'idle' });
                
                // 特殊处理网络错误
                if (res.retcode === -30008) {
                    console.log('[onError] 网络错误，等待用户手动重试');
                    wx.showToast({ 
                        title: '网络连接失败，请检查网络后重试', 
                        icon: 'none',
                        duration: 2000
                    });
                    return;
                }

                // 特殊处理录音失败错误
                if (res.retcode === -30001) {
                    console.log('[onError] 录音失败，尝试重新初始化');
                    wx.showToast({ 
                        title: '录音失败，请重试', 
                        icon: 'none',
                        duration: 2000
                    });
                    // 延迟重新初始化
                    setTimeout(() => {
                        this.initRecord();
                    }, 1000);
                    return;
                }

                // 其他错误处理
                const errorMsg = this.getErrorMessage(res.retcode);
                wx.showToast({ title: errorMsg, icon: 'none' });
            };

            // 保存管理器引用
            this.setData({ recordingManager: manager });
            console.log('[initRecord] 录音管理器初始化完成');
        } catch (error) {
            console.error('[initRecord] 初始化录音管理器异常:', error);
            wx.showToast({ title: '录音功能初始化异常', icon: 'none' });
        }
    },
    toggleRecording() { if (this.data.recordStatus === 'idle') { wx.getSetting({ success: (res) => { if (!res.authSetting['scope.record']) { this.checkRecordPermission(); } else { this.startRecording(); } }, fail: () => { this.checkRecordPermission(); } }); } else if (this.data.recordStatus === 'recording') { this.stopRecording(); } },
    startRecording() {
        if (!this.data.recordingManager) {
            console.warn('[startRecording] 录音管理器未初始化，尝试初始化');
            this.initRecord();
            return;
        }

        if (this.data.recordStatus === 'recording') {
            console.warn('[startRecording] 正在录音中，无法开始新的录音');
            return;
        }

        // 检查网络状态
        wx.getNetworkType({
            success: (res) => {
                if (res.networkType === 'none') {
                    wx.showToast({ title: '请检查网络连接', icon: 'none' });
                    return;
                }
                
                // 检查录音权限
                wx.getSetting({
                    success: (res) => {
                        if (res.authSetting['scope.record']) {
                            const lang = this.data.article.language === 'zh' ? 'zh_CN' : 'en_US';
                            this.data.recordingManager.start({ lang: lang });
                            console.log('[startRecording] 开始录音，语言:', lang);
                        } else {
                            wx.authorize({
                                scope: 'scope.record',
                                success: () => {
                                    const lang = this.data.article.language === 'zh' ? 'zh_CN' : 'en_US';
                                    this.data.recordingManager.start({ lang: lang });
                                    console.log('[startRecording] 开始录音，语言:', lang);
                                },
                                fail: () => {
                                    wx.showModal({
                                        title: '权限提示',
                                        content: '需要录音权限才能使用。请在小程序设置中打开录音权限。',
                                        confirmText: '去设置',
                                        cancelText: '取消',
                                        success: (res) => {
                                            if (res.confirm) {
                                                wx.openSetting();
                                            }
                                        }
                                    });
                                }
                            });
                        }
                    }
                });
            }
        });
    },
    stopRecording() {
        if (!this.data.recordingManager || this.data.recordStatus !== 'recording') {
            console.warn('[stopRecording] 未在录音状态');
            return;
        }

        try {
            this.data.recordingManager.stop();
            console.log('[stopRecording] 停止录音请求已发送');
        } catch (error) {
            console.error('[stopRecording] 停止录音异常:', error);
            this.cleanupRecite();
        }
    },
    startRecordTimer() { console.log('启动背诵录音计时器'); if (this.recordTimer) { clearInterval(this.recordTimer); } this.recordTimer = setInterval(() => { if (this.data.recordStatus !== 'recording') { if (this.recordTimer) { clearInterval(this.recordTimer); this.recordTimer = null; } return; } const newTime = this.data.recordTime + 1; this.setData({ recordTime: newTime }); }, 1000); this.setData({ recordTimer: this.recordTimer }); },
    stopRecordTimer() { console.log('停止背诵录音计时器'); if (this.recordTimer) { clearInterval(this.recordTimer); this.recordTimer = null; } },
    // --- 波浪动画 ---
    startIdleWaveAnimation() { /* ... */ }, updateIdleWaveHeights() { /* ... */ },
    startWaveAnimation() { if (this.data.waveTimer) { clearInterval(this.data.waveTimer); } const timer = setInterval(() => { if (this.data.recordStatus !== 'recording') { clearInterval(timer); this.setData({ waveHeights: Array(8).fill(5) }); return; } this.updateWaveHeights(); }, 200); this.setData({ waveTimer: timer }); },
    updateWaveHeights() { const heights = Array(8).fill(0).map(() => this.getRandomHeight(5, 30)); this.setData({ waveHeights: heights }); },
    getRandomHeight(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; },
    stopWaveAnimation() { if (this.data.waveTimer) { clearInterval(this.data.waveTimer); this.setData({ waveTimer: null, waveHeights: Array(8).fill(5) }); } },
    // --- 波浪结束 ---

    /**
     * [v4 - Final Fix] 比较文本 - 原文标记红绿, 数字等效, 忽略标点评分和标记
     * @param {string} original 原始原文
     * @param {string} recognized 原始识别文本
     * @param {string} language 'zh' 或 'en'
     * @returns {{accuracy: number, correctWords: number, totalWords: number, contentWithErrors: string}}
     */
    compareTexts(original, recognized, language) {
        console.log('[compareTexts v4] 开始比较');
        console.log('Original:', original);
        console.log('Recognized:', recognized);

        // --- 数字映射 ---
        const numeralMap = { '零': '0', '壹': '1', '贰': '2', '叁': '3', '肆': '4', '伍': '5', '陆': '6', '柒': '7', '捌': '8', '玖': '9', '拾': '10' };
        const simpleNumeralMap = { '一': '1', '二': '2', '三': '3', '四': '4', '五': '5', '六': '6', '七': '7', '八': '8', '九': '9', '〇': '0', '十': '10' };
        const isDigit = (char) => /^[0-9]$/.test(char);
        const arabicToCapitalMap = Object.fromEntries(Object.entries(numeralMap).map(([k, v]) => [v, k]));
        const arabicToSimpleMap = Object.fromEntries(Object.entries(simpleNumeralMap).map(([k, v]) => [v, k]));
        // --- 映射结束 ---

        // --- 标点符号定义 ---
        const punctuationAndSpaceRegex = /[.,!?;:"'()，。！？；：""''（）《》【】、~——\s]/g;
        // --- 标点定义结束 ---

        if (!original) { console.warn('[compareTexts v4] 原文为空'); return { accuracy: recognized ? 0 : 100, correctWords: 0, totalWords: 0, contentWithErrors: '<span style="color:orange;">原文为空</span>' }; }
        if (!recognized) {
            console.warn('[compareTexts v4] 识别结果为空');
            const isChineseInner = language === 'zh'; // 在闭包内使用 language
            const displayTokensInner = isChineseInner ? original.split('') : original.split(/([.,!?;:"'()，。！？；：""''（）《》【】、~——\s])/g).filter(Boolean);
            const separatorInner = isChineseInner ? '' : ' ';
            const errorsInner = displayTokensInner.map(token => /^[.,!?;:"'()，。！？；：""''（）《》【】、~——\s]$/.test(token) ? token : `<span style="color:red;">${token}</span>`).join(separatorInner);
            let normOriginalLengthInner = 0;
            if (original) {
                const tempNormOrigInner = original.toLowerCase().replace(punctuationAndSpaceRegex, '');
                normOriginalLengthInner = isChineseInner ? tempNormOrigInner.length : tempNormOrigInner.split(/\s+/).filter(Boolean).length;
            }
            return { accuracy: 0, correctWords: 0, totalWords: normOriginalLengthInner, contentWithErrors: errorsInner };
        }

        const isChinese = language === 'zh';
        const separator = isChinese ? '' : ' ';

        // --- 规范化 ---
        const normalize = (text) => {
            if (!text) return '';
            text = text.toLowerCase();
            text = text.replace(punctuationAndSpaceRegex, '');
            return text;
        };
        const normalizedOriginalText = normalize(original);
        const normalizedRecognizedText = normalize(recognized);
        console.log('[compareTexts v4] Normalized Original:', normalizedOriginalText);
        console.log('[compareTexts v4] Normalized Recognized:', normalizedRecognizedText);
        // --- 规范化结束 ---

        // --- 分词/分字 (用于计算准确率) ---
        const normOriginalTokens = isChinese ? normalizedOriginalText.split('') : normalizedOriginalText.split(/\s+/).filter(Boolean);
        const recognizedTokens = isChinese ? normalizedRecognizedText.split('') : normalizedRecognizedText.split(/\s+/).filter(Boolean);
        const originalLength = normOriginalTokens.length; // totalWords 基于规范化长度
        const recognizedLength = recognizedTokens.length;
        console.log(`[compareTexts v4] NormOriginalLength (TotalWords for Accuracy): ${originalLength}`);
        // --- 分词/分字结束 ---


        // --- 1. 计算准确率 (LCS on normalized tokens, +数字等效) ---
        const dp = Array(originalLength + 1).fill(0).map(() => Array(recognizedLength + 1).fill(0));
        for (let i = 1; i <= originalLength; i++) {
            for (let j = 1; j <= recognizedLength; j++) {
                const origNormToken = normOriginalTokens[i - 1];
                const recogToken = recognizedTokens[j - 1];
                let tokenMatch = (origNormToken === recogToken);
                if (!tokenMatch && isChinese) {
                    if (numeralMap[origNormToken] === recogToken || simpleNumeralMap[origNormToken] === recogToken || (isDigit(origNormToken) && (arabicToCapitalMap[origNormToken] === recogToken || arabicToSimpleMap[origNormToken] === recogToken))) {
                        tokenMatch = true;
                    }
                }
                if (tokenMatch) { dp[i][j] = dp[i - 1][j - 1] + 1; }
                else { dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]); }
            }
        }
        const correctWords = dp[originalLength][recognizedLength];
        const accuracy = originalLength > 0 ? (correctWords / originalLength) * 100 : (recognizedLength === 0 ? 100 : 0);
        console.log(`[compareTexts v4] CorrectWords: ${correctWords}, Accuracy: ${accuracy.toFixed(2)}%`);
        // --- 准确率计算结束 ---


        // --- 2. 生成带标记的 HTML (遍历原始文本, 仅标记非标点内容) ---
        let contentWithErrors = '';
        const displayTokens = isChinese ? original.split('') : original.split(/([.,!?;:"'()，。！？；：""''（）《》【】、~——\s])/g).filter(Boolean);
        const recognizedTokenSet = new Set(recognizedTokens);
        const recognizedEquivalentSet = new Set();
        if (isChinese) {
            recognizedTokens.forEach(token => {
                if (isDigit(token)) {
                    if (arabicToCapitalMap[token]) recognizedEquivalentSet.add(arabicToCapitalMap[token]);
                    if (arabicToSimpleMap[token]) recognizedEquivalentSet.add(arabicToSimpleMap[token]);
                } else if (numeralMap[token]) {
                    recognizedEquivalentSet.add(numeralMap[token]);
                } else if (simpleNumeralMap[token]) { recognizedEquivalentSet.add(simpleNumeralMap[token]); }
            });
        }

        for (let k = 0; k < displayTokens.length; k++) {
            const currentDisplayToken = displayTokens[k];
            const isPunctOrSpace = /^[.,!?;:"'()，。！？；：""''（）《》【】、~——\s]$/.test(currentDisplayToken);

            if (isPunctOrSpace) {
                contentWithErrors += currentDisplayToken; // 标点空格直接添加
            } else {
                const normalizedCurrentToken = normalize(currentDisplayToken);
                let isMatch = false;
                if (recognizedTokenSet.has(normalizedCurrentToken)) { isMatch = true; }
                else if (isChinese && recognizedEquivalentSet.has(normalizedCurrentToken)) { isMatch = true; }

                const color = isMatch ? 'green' : 'red';
                contentWithErrors += `<span style="color:${color};">${currentDisplayToken}</span>`;
            }
        }
        console.log('[compareTexts v4] Final contentWithErrors:', contentWithErrors);
        // --- HTML 生成结束 ---


        // --- 3. 返回结果 (确保 totalWords 使用规范化长度) ---
        return {
            accuracy: parseFloat(accuracy.toFixed(2)),
            correctWords: correctWords,
            totalWords: originalLength, // 基于规范化长度
            contentWithErrors: contentWithErrors
        };
        // --- 返回结束 ---
    },

    // 评估背诵结果
    evaluateRecitation(originalText, recognizedText) {
        console.log("开始评估背诵，原文长度：", originalText ? originalText.length : 0);
        console.log("识别文本长度：", recognizedText ? recognizedText.length : 0);
        if (!originalText || !recognizedText) { console.error("评估错误：原文或识别文本为空"); this.showReciteErrorResult("评估失败，请重试"); return; }
        const language = this.data.article.language;
        const comparisonResult = this.compareTexts(originalText, recognizedText, language); // 调用 v4 版本
        const totalWords = comparisonResult.totalWords; // 来自规范化长度
        const correctWords = comparisonResult.correctWords; // 来自LCS
        const accuracy = comparisonResult.accuracy; // 直接使用返回的准确率
        const score = this.calculateRecitationScore(accuracy, totalWords, language);
        const feedback = this.generateRecitationFeedback(score, accuracy);
        const flowers = this.generateFlowers(score);
        const result = { score: score, flowers: flowers, feedback: feedback, correctWords: correctWords, totalWords: totalWords, accuracy: accuracy, contentWithErrors: comparisonResult.contentWithErrors, recognizedText: recognizedText };
        console.log("背诵评估结果:", result);
        this.setData({ reciteResult: result, showResult: true, recitePhase: 'complete', recordStatus: 'idle' }, () => {
            if (result.score === 100) { setTimeout(() => { const flowerDisplay = this.selectComponent('#flowerDisplay'); if (flowerDisplay && typeof flowerDisplay.handleFlowerTap === 'function') { console.log("触发烟花动画"); flowerDisplay.handleFlowerTap(); } else { console.error("未找到 flower-display 组件或其方法"); } }, 500); }
        });
        // 保存记录
        try { const app = getApp(); if (app && typeof app.addReadingRecord === 'function') { const recordData = { articleId: this.data.article.id, articleTitle: this.data.article.title, score: result.score, accuracy: result.accuracy, type: 'recitation', timestamp: Date.now(), feedbackHtml: result.contentWithErrors, recognizedText: result.recognizedText, duration: this.data.recordTime }; console.log('[evaluateRecitation] 准备保存记录:', recordData); app.addReadingRecord(recordData); } else { console.warn('[evaluateRecitation]无法找到 app.addReadingRecord 函数!'); } } catch (saveError) { console.error('[evaluateRecitation] 保存记录失败:', saveError); }
    },

    // --- 辅助函数 ---
    calculateRecitationScore(accuracy, totalWords, language) { return Math.round(accuracy); },
    generateRecitationFeedback(score, accuracy) { if (accuracy >= 95) { return '太棒了！简直是原文复现！'; } else if (accuracy >= 85) { return '非常出色！继续保持！'; } else if (accuracy >= 70) { return '还不错！注意标红的部分哦。'; } else if (accuracy >= 50) { return '有进步！对照标错的地方多练练。'; } else { return '加油！多听几遍范读再试试吧。'; } },
    generateFlowers(score) { const flowerCount = Math.min(Math.floor(score / 20), 5); return Array(flowerCount).fill(true); },
    showReciteErrorResult(message) { this.setData({ reciteResult: { score: 0, flowers: [], feedback: message || '处理失败，请重试', correctWords: 0, totalWords: this.data.article ? (this.data.article.content || '').replace(/[.,!?;:"'()，。！？；：""''（）《》【】、~——\s]/g, '').length : 0, accuracy: 0, contentWithErrors: '<span class="error">处理失败</span>', recognizedText: '' }, showResult: true, recordStatus: 'idle', recitePhase: 'preview' }); this.stopWaveAnimation(); },
    tryAgain() { this.setData({ showResult: false, recordTime: 0, recitePhase: 'preview', recordStatus: 'idle', reciteResult: { score: 0, flowers: [], feedback: '', correctWords: 0, totalWords: 0, accuracy: 0, contentWithErrors: '', recognizedText: '' } }); /* this.startIdleWaveAnimation(); */ },
    finishReading() { wx.navigateBack(); }, // 可以考虑改名 finishPractice
    handleFlowerTap() { /* 保留为空 */ },
    cleanupRecite() {
        console.log('[cleanupRecite] 开始清理背诵状态...');
        this.stopRecordTimer();
        
        if (this.data.recordingManager) {
            try {
                this.data.recordingManager.stop();
                this.data.recordingManager.onStart = null;
                this.data.recordingManager.onRecognize = null;
                this.data.recordingManager.onStop = null;
                this.data.recordingManager.onError = null;
            } catch (e) {
                console.warn('[cleanupRecite] 清理录音管理器出错:', e);
            }
        }

        this.setData({ 
            recordingManager: null,
            recordStatus: 'idle',
            recognizedText: '',
            recordTime: 0
        });
        console.log('[cleanupRecite] 清理完成');
    },
    getErrorMessage(retcode, defaultMsg = '识别错误，请重试') {
        const errorMap = {
            '-30001': '录音失败',
            '-30002': '连接失败',
            '-30003': '识别超时',
            '-30004': '无有效语音',
            '-30005': '参数错误',
            '-30007': '参数错误',
            '-30008': '网络发送失败',
            '-30009': '网络接收失败',
            '-30011': '用户取消',
            '-30012': '权限或状态错误'
        };
        return errorMap[retcode] || defaultMsg;
    }
}); // Page 结束