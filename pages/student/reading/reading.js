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
        waveHeights: [], // 用于波浪动画，如果需要
        waveTimer: null, // 波浪动画计时器，如果需要
        readingResult: { score: 0, flowers: [], feedback: '', correctWords: 0, totalWords: 0, accuracy: 0, contentWithErrors: '', recognizedText: '' },
        isPlayingReading: false, // 是否正在播放范读
        mode: 'practice',
        recordId: null,
        isLoading: false
    },

    // --- 实例状态变量 ---
    audioContext: null,
    textChunks: [],
    currentReadingChunkIndex: 0,
    isReadingStopped: false,
    articleId: null,
    playbackPhase: 'idle',
    _isCleaningUp: false,
    recordTimer: null,      // 录音计时器 ID
    maxRecordDuration: 120, // 最大录音时长（秒）
    // --- 实例状态变量结束 ---

    onLoad(options) {
        console.log("朗读/查看页面加载，options:", options);
        this.initRecord();
        this.initAudioContext();
        this.checkRecordPermission();

        if (options.recordId) {
            console.log(`[reading.js onLoad] 查看历史记录模式，recordId: ${options.recordId}`);
            this.setData({ mode: 'review', recordId: options.recordId, isLoading: true });
            this.loadRecordDetail(options.recordId);
        } else if (options.id) {
            console.log(`[reading.js onLoad] 练习模式，articleId: ${options.id}`);
            this.articleId = options.id;
            this.setData({ mode: 'practice', isLoading: true });
            this.loadArticle(options.id);
        } else {
            console.error('[reading.js onLoad] 缺少参数 (id 或 recordId)');
            wx.showToast({ title: '页面参数错误', icon: 'none' });
            this.setData({ isLoading: false });
        }
    },

    // 加载文章数据
    loadArticle(id) {
        console.log('[reading.js loadArticle] 加载文章，ID:', id);
        this.setData({ isLoading: true });
        const app = getApp(); let articleData = null;
        if (app.globalData && app.globalData.articles) { articleData = app.globalData.articles.find(article => article.id === id); }
        if (!articleData) { try { const storedArticles = wx.getStorageSync('articles'); if (storedArticles) { articleData = storedArticles.find(article => article.id === id); } } catch (e) { console.error("加载本地存储文章失败", e); } }
        if (articleData) {
            console.log('[reading.js loadArticle] 找到文章:', articleData.title);
            let wordCount = 0; const content = articleData.content || ''; const language = articleData.language;
            if (language === 'zh') { wordCount = content.replace(/\s/g, '').length; } else { wordCount = content.split(/\s+/).filter(word => word.length > 0).length; }
            articleData.wordCount = wordCount; let estimatedTime = 0;
            if (wordCount > 0) { estimatedTime = Math.ceil(wordCount / (language === 'zh' ? 3 : 2)); }
            articleData.estimatedTime = estimatedTime;
            console.log('[reading.js loadArticle] 计算结果 wordCount:', wordCount, ', estimatedTime:', estimatedTime);
            this.setData({ article: articleData, isLoading: false });
            wx.setNavigationBarTitle({ title: articleData.title || '朗读练习' });
        } else { console.error('[reading.js loadArticle] 未能找到文章 ID:', id); this.setData({ isLoading: false }); wx.showToast({ title: '加载文章失败', icon: 'none' }); }
    },

    // 页面卸载
    onUnload() {
        console.log('[reading.js onUnload] 页面卸载');
        if (this.recordTimer) { clearInterval(this.recordTimer); this.recordTimer = null; }
        if (manager && this.data.recordStatus === 'recording') { try { console.log('[onUnload] 停止录音'); manager.stop(); } catch (e) { console.warn('[onUnload] 停止录音出错:', e); } }
        if (this.audioContext) { console.log('[onUnload] 销毁 audioContext'); this.audioContext.stop(); this.audioContext.destroy(); this.audioContext = null; }
        if (this.waveTimer) { clearInterval(this.waveTimer); this.waveTimer = null; }
    },

    // 检查录音权限
    checkRecordPermission() {
        wx.getSetting({
            success: (res) => {
                if (res.authSetting['scope.record']) { console.log('朗读页面：已获取录音权限'); }
                else {
                    console.log('朗读页面：未获取权限，尝试请求');
                    wx.authorize({
                        scope: 'scope.record', success: () => { console.log('录音权限授权成功'); },
                        fail: () => { console.error('用户拒绝录音权限'); wx.showModal({ title: '提示', content: '需录音权限才能朗读，请在设置中允许', confirmText: '去设置', cancelText: '取消', success: (mr) => { if (mr.confirm) wx.openSetting(); else wx.showToast({ title: '未授权无法朗读', icon: 'none' }); } }); }
                    });
                }
            }, fail: (err) => { console.error('检查权限设置失败:', err); }
        });
    },

    // 初始化语音识别回调
    initRecord() {
        manager.onRecognize = (res) => { /* console.log("朗读中间识别结果", res.result); */ }
        manager.onStop = (res) => {
            console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'); console.log('[onStop Callback] --- onStop 被触发 ---'); console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
            console.log('[onStop Callback] ========== 录音停止 =========='); console.log('[onStop Callback] Raw result:', JSON.stringify(res)); wx.hideLoading();
            if (this.recordTimer) { console.log('[onStop] 清理计时器'); clearInterval(this.recordTimer); this.recordTimer = null; }
            if (this.waveTimer) { clearInterval(this.waveTimer); this.waveTimer = null; this.setData({ waveHeights: [] }); }
            this.setData({ recordStatus: 'processing' });
            if (res.result) {
                console.log('[onStop] 结果有效，调用评估');
                this.evaluateReading(this.data.article.content, res.result);
            } else {
                console.error('[onStop Callback] 结果无效或为空');
                this.setData({ recordStatus: 'idle' });
                wx.showToast({ title: '未能识别到有效语音', icon: 'none' });
            }
        }
        manager.onError = (res) => {
            console.error('[onError Callback] ========== 录音识别错误 =========='); console.error('[onError Callback] Raw error:', JSON.stringify(res)); wx.hideLoading();
            if (this.recordTimer) { console.log('[onError] 清理计时器'); clearInterval(this.recordTimer); this.recordTimer = null; }
            if (this.waveTimer) { clearInterval(this.waveTimer); this.waveTimer = null; this.setData({ waveHeights: [] }); }
            this.setData({ recordStatus: 'idle' });
            wx.showToast({ title: `识别错误: ${res.msg}`, icon: 'none' });
            this.cleanupReading();
        }
        console.log('语音识别回调初始化完成');
    },

    // --- 范读功能 (保持不变) ---
    chunkText(text, maxLength) { if (!text) return []; const chunks = []; let currentPos = 0; const punctuation = ['。', '！', '？', '\n', '.', '!', '?']; const secondaryPunctuation = [',', '，', ';', '；', ' ']; console.log(`开始分块，总长度: ${text.length}, 每块最大: ${maxLength}`); while (currentPos < text.length) { let endPos = Math.min(currentPos + maxLength, text.length); let splitPos = -1; if (endPos === text.length) { splitPos = endPos; } else { for (let i = endPos - 1; i >= currentPos; i--) { if (punctuation.includes(text[i])) { splitPos = i + 1; break; } } if (splitPos === -1) { for (let i = endPos - 1; i >= currentPos; i--) { if (secondaryPunctuation.includes(text[i])) { splitPos = i + 1; break; } } } if (splitPos === -1 || splitPos <= currentPos) { splitPos = endPos; } } const chunk = text.substring(currentPos, splitPos); if (chunk.trim() !== '') { chunks.push(chunk); } currentPos = splitPos; } console.log(`分块完成，共 ${chunks.length} 块`); return chunks; },
    initAudioContext() { if (this.audioContext) { console.log('[initAudioContext] 销毁旧实例...'); this.audioContext.destroy(); this.audioContext = null; } console.log('[initAudioContext] 创建新实例'); this.audioContext = wx.createInnerAudioContext(); this.audioContext.obeyMuteSwitch = false; this.audioContext.onPlay(() => { console.log('[AudioContext Event] onPlay - 开始播放'); wx.hideLoading(); if (!this.data.isPlayingReading) { this.setData({ isPlayingReading: true }); } }); this.audioContext.onEnded(() => { console.log('[AudioContext Event] onEnded - 播放结束，阶段:', this.playbackPhase); if (this.isReadingStopped) { console.log('[onEnded] 已手动停止'); this.cleanupReading(); return; } if (this.playbackPhase === 'title') { console.log('[onEnded] 标题播放完毕，准备内容'); this.playbackPhase = 'content'; const content = this.data.article && this.data.article.content; if (!content) { console.error('[onEnded] 内容为空'); this.cleanupReading(); return; } this.textChunks = this.chunkText(content, 120); if (!this.textChunks || this.textChunks.length === 0) { console.error('[onEnded] 内容分块失败'); this.cleanupReading(); return; } this.currentReadingChunkIndex = 0; console.log('[onEnded] 内容分块完成，处理第一块'); this.processNextReadingChunk(); } else if (this.playbackPhase === 'content') { console.log('[onEnded] 内容段落播放完毕，准备下一段'); this.currentReadingChunkIndex++; this.processNextReadingChunk(); } else { console.warn('[onEnded] 未知阶段:', this.playbackPhase); this.cleanupReading(); } }); this.audioContext.onError((res) => { console.error('[AudioContext Event] onError - 播放错误:', res.errMsg, res.errCode); wx.hideLoading(); wx.showToast({ title: `播放失败:${res.errMsg}`, icon: 'none' }); this.cleanupReading(); }); this.audioContext.onWaiting(() => { console.log('[AudioContext Event] onWaiting - 缓冲中...'); if (this.data.isPlayingReading && !this.isReadingStopped) { wx.showLoading({ title: '音频加载中...' }); } }); this.audioContext.onCanplay(() => { console.log('[AudioContext Event] onCanplay - 可以播放'); }); this.audioContext.onStop(() => { console.log('[AudioContext Event] onStop - 播放停止'); this.cleanupReading(); }); console.log('[initAudioContext] 事件监听绑定完成'); },
    handlePlayReading(event) { console.log('[handlePlayReading] 用户点击播放/停止范读'); if (this.data.isPlayingReading) { console.log('[handlePlayReading] 调用 handleStopReading'); this.handleStopReading(); } else { const title = this.data.article && this.data.article.title; const content = this.data.article && this.data.article.content; if (!title && !content) { console.error('[handlePlayReading] 文章无内容'); wx.showToast({ title: '文章无内容', icon: 'none' }); return; } console.log('[handlePlayReading] 调用 startReadingFlow'); this.startReadingFlow(title); } },
    startReadingFlow(title) { console.log('[startReadingFlow] 开始流程，准备播放标题'); this.isReadingStopped = false; this.textChunks = []; this.currentReadingChunkIndex = 0; this.playbackPhase = 'title'; this.setData({ isPlayingReading: true }); wx.showLoading({ title: '合成标题...' }); if (!this.audioContext) { console.warn('[startReadingFlow] AudioContext 未初始化，重试'); this.initAudioContext(); if (!this.audioContext) { console.error('[startReadingFlow] AudioContext 初始化失败!'); wx.hideLoading(); wx.showToast({ title: '播放器初始化失败', icon: 'none' }); this.setData({ isPlayingReading: false }); return; } } if (!title) { console.warn('[startReadingFlow] 标题为空，直接内容'); wx.hideLoading(); this.playbackPhase = 'content'; const content = this.data.article && this.data.article.content; if (!content) { console.error('[startReadingFlow] 标题内容都为空'); this.cleanupReading(); return; } this.textChunks = this.chunkText(content, 120); if (!this.textChunks || this.textChunks.length === 0) { console.error('[startReadingFlow] 内容分块失败'); this.cleanupReading(); return; } this.currentReadingChunkIndex = 0; this.processNextReadingChunk(); return; } this.synthesizeSpeech(title).then(tempFilePath => { if (this.isReadingStopped) return; if (!this.audioContext) { this.cleanupReading(); return; } console.log('[startReadingFlow] 标题合成成功，准备播放'); this.audioContext.src = tempFilePath; if (this.audioContext.paused) { this.audioContext.play(); } else { console.warn('[startReadingFlow] audioContext 非暂停'); } }).catch(error => { console.error('[startReadingFlow] 标题合成失败:', error); wx.hideLoading(); wx.showToast({ title: `标题合成失败: ${error.errMsg || '未知错误'}`, icon: 'none' }); this.cleanupReading(); }); },
    processNextReadingChunk() { console.log(`[processNextReadingChunk] 尝试处理索引: ${this.currentReadingChunkIndex}`); if (this.isReadingStopped) { console.log('[processNextReadingChunk] 已停止'); this.cleanupReading(); return; } if (this.currentReadingChunkIndex >= this.textChunks.length) { console.log('[processNextReadingChunk] 所有块处理完成'); wx.showToast({ title: '朗读结束', icon: 'success', duration: 1500 }); this.cleanupReading(); return; } const currentChunk = this.textChunks[this.currentReadingChunkIndex]; console.log(`[processNextReadingChunk] 获取块 ${this.currentReadingChunkIndex + 1}/${this.textChunks.length}`); wx.showLoading({ title: `合成语音 ${this.currentReadingChunkIndex + 1}/${this.textChunks.length}` }); this.synthesizeSpeech(currentChunk).then(tempFilePath => { console.log(`[processNextReadingChunk] 块 ${this.currentReadingChunkIndex + 1} 合成成功`); if (this.isReadingStopped) { console.log('[.then] 已停止'); this.cleanupReading(); return; } if (!this.audioContext) { console.error('[.then] AudioContext 不存在'); this.cleanupReading(); return; } this.audioContext.src = tempFilePath; console.log(`[processNextReadingChunk.then] 设置 src: ${this.audioContext.src}`); if (this.audioContext.paused) { this.audioContext.play(); } else { console.warn('[.then] audioContext 非暂停'); } const nextIndex = this.currentReadingChunkIndex + 1; if (nextIndex < this.textChunks.length) { console.log(`[.then] 尝试预合成块 ${nextIndex + 1}`); this.synthesizeSpeech(this.textChunks[nextIndex]).then(p => console.log(`[Preload] 块 ${nextIndex + 1} 成功`)).catch(e => console.warn(`[.then] 预合成块 ${nextIndex + 1} 失败:`, e)); } }).catch(error => { console.error(`[processNextReadingChunk] 块 ${this.currentReadingChunkIndex + 1} 合成失败:`, error); wx.hideLoading(); wx.showToast({ title: `语音合成失败: ${error.errMsg || '未知错误'}`, icon: 'none' }); this.cleanupReading(); }); },
    synthesizeSpeech(text) { console.log(`[synthesizeSpeech] 合成: "${text.substring(0, 30)}..."`); return new Promise((resolve, reject) => { plugin.textToSpeech({ lang: this.data.article.language === 'zh' ? "zh_CN" : "en_US", tts: true, content: text, success: (res) => { if (res.retcode === 0 && res.filename) { resolve(res.filename); } else { console.error('[synthesizeSpeech] success 但结果异常:', res); reject({ errMsg: `合成结果异常: ${res.msg || `retcode:${res.retcode}`}` }); } }, fail: (err) => { console.error("[synthesizeSpeech] fail:", JSON.stringify(err)); reject(err); } }); }); },
    handleStopReading() { console.log('[handleStopReading] 用户请求停止'); this.isReadingStopped = true; if (this.audioContext) { console.log('[handleStopReading] 调用 audioContext.stop()'); this.audioContext.stop(); } else { console.log('[handleStopReading] audioContext 不存在，直接清理'); this.cleanupReading(); } },
    cleanupReading() { if (this._isCleaningUp) { console.log('[cleanupReading] 清理中，跳过'); return; } this._isCleaningUp = true; console.log('[cleanupReading] 开始清理，设置锁'); wx.hideLoading(); this.isReadingStopped = true; this.textChunks = []; this.currentReadingChunkIndex = 0; this.playbackPhase = 'idle'; if (this.data && this.data.isPlayingReading) { console.log('[cleanupReading] 重置 isPlayingReading'); this.setData({ isPlayingReading: false }); } if (this.audioContext) { console.log('[cleanupReading] 停止 audioContext'); this.audioContext.stop(); } setTimeout(() => { this._isCleaningUp = false; console.log('[cleanupReading] 清理完成，释放锁'); }, 50); },
    // --- 范读功能结束 ---

    // --- 录音功能 (保持不变) ---
    toggleRecording() { const currentStatus = this.data.recordStatus; console.log(`[toggleRecording] 当前状态: ${currentStatus}`); if (currentStatus === 'recording') { console.log('[toggleRecording] 调用 stopRecording'); this.stopRecording(); } else if (currentStatus === 'idle') { if (this.data.isPlayingReading) { console.log('[toggleRecording] 正在播放范读，先停止'); this.handleStopReading(); setTimeout(() => { console.log('[toggleRecording] 延迟后调用 startRecording'); this.startRecording(); }, 200); } else { console.log('[toggleRecording] 调用 startRecording'); this.startRecording(); } } else if (currentStatus === 'processing') { console.log('[toggleRecording] 正在处理中'); wx.showToast({ title: '正在处理结果...', icon: 'none' }); } },
    startRecording() { console.log('[startRecording] 准备开始朗读录音和识别'); const article = this.data.article; if (!article || !article.content) { console.error('[startRecording] 文章数据不完整'); wx.showToast({ title: '文章加载不完整', icon: 'none' }); return; } const language = article.language === 'zh' ? 'zh_CN' : 'en_US'; console.log(`[startRecording] 文章语言: ${article.language}, 识别语言: ${language}`); this.setData({ recordStatus: 'recording', recordTime: 0, readingResult: { score: 0, flowers: [], feedback: '', correctWords: 0, totalWords: 0, accuracy: 0, contentWithErrors: '', recognizedText: '' }, showResult: false }); wx.showLoading({ title: '准备录音...' }); try { console.log('[startRecording] Starting manager...'); manager.start({ lang: language }); console.log('[startRecording] Manager started successfully.'); this.startRecordTimer(); wx.hideLoading(); /* 可选动画 */ } catch (error) { console.error('[startRecording] 启动录音失败:', error); wx.hideLoading(); wx.showToast({ title: `启动录音失败: ${error.errMsg || '请重试'}`, icon: 'none' }); this.setData({ recordStatus: 'idle' }); } },
    stopRecording() { console.log('[stopRecording] 准备停止录音'); if (this.data.recordStatus !== 'recording') { console.warn('[stopRecording] 非录音状态'); return; } /* 停动画 */ try { console.log('[stopRecording] Calling manager.stop()'); manager.stop(); console.log('[stopRecording] manager.stop() called.'); if (this.recordTimer) { console.log('[stopRecording] 清理计时器'); clearInterval(this.recordTimer); this.recordTimer = null; } wx.showLoading({ title: '正在识别...' }); } catch (error) { console.error('[stopRecording] 调用 manager.stop() 失败:', error); wx.hideLoading(); wx.showToast({ title: `停止录音失败: ${error.errMsg || '请重试'}`, icon: 'none' }); if (this.recordTimer) { clearInterval(this.recordTimer); this.recordTimer = null; } this.setData({ recordStatus: 'idle' }); } },
    startRecordTimer() { console.log('[startRecordTimer] 启动录音计时器'); if (this.recordTimer) { clearInterval(this.recordTimer); } this.recordTimer = setInterval(() => { if (this.data.recordStatus !== 'recording') { console.log('[Timer] 状态非 recording，停止计时器'); if (this.recordTimer) { clearInterval(this.recordTimer); this.recordTimer = null; } return; } const newTime = this.data.recordTime + 1; this.setData({ recordTime: newTime }); if (newTime >= this.maxRecordDuration) { console.log('[Timer] 达到最大时长，自动停止'); this.stopRecording(); } }, 1000); console.log('[startRecordTimer] 计时器已设置, ID:', this.recordTimer); },
    // --- 录音功能结束 ---

    // --- 评估功能 ---
    /**
     * [核心] 评估朗读结果
     * @param {string} originalText 原文
     * @param {string} recognizedText 识别出的文本
     */
    evaluateReading(originalText, recognizedText) {
        console.log('[evaluateReading] 开始评估朗读');
        console.log('[evaluateReading] 原文:', originalText.substring(0, 50) + '...');
        console.log('[evaluateReading] 识别:', recognizedText.substring(0, 50) + '...');

        const language = this.data.article.language;
        let compareResult;
        try {
            // 预处理文本
            const preprocessText = (text) => { if (!text) return ''; let cleanedText = text.trim(); cleanedText = cleanedText.replace(/\s*([，。！？])\s*/g, '$1'); cleanedText = cleanedText.replace(/\s*([,.!?])\s*/g, '$1'); cleanedText = cleanedText.replace(/\s+/g, ' '); return cleanedText; };
            const processedOriginalText = preprocessText(originalText);
            const processedRecognizedText = preprocessText(recognizedText);
            console.log('[evaluateReading] 预处理后原文:', processedOriginalText.substring(0, 50) + '...');
            console.log('[evaluateReading] 预处理后识别:', processedRecognizedText.substring(0, 50) + '...');

            // *** 调用最终更正后的 compareTexts ***
            compareResult = this.compareTexts(processedOriginalText, processedRecognizedText, language);
            console.log('[evaluateReading] 比较结果:', compareResult);

            // 检查比较结果是否有效
            if (!compareResult || typeof compareResult.accuracy !== 'number' || isNaN(compareResult.accuracy)) {
                console.warn('[evaluateReading] compareTexts 返回结果无效或 accuracy 非数字, 使用 0 作为默认值');
                compareResult = { accuracy: 0, correctWords: 0, totalWords: processedOriginalText ? (language === 'zh' ? processedOriginalText.length : processedOriginalText.split(/\s+/).filter(Boolean).length) : 0, contentWithErrors: '<span style="color:red;">文本比较失败</span>' };
            }
        } catch (compareError) { console.error('[evaluateReading] 文本比较出错:', compareError); this.showErrorResult(`文本比较失败: ${compareError.message}`); return; }

        // 计算分数、生成反馈、生成小红花 (保持不变)
        let score; try { score = this.calculateScore(compareResult.accuracy, compareResult.totalWords, language); console.log('[evaluateReading] 计算分数:', score); } catch (scoreError) { console.error('[evaluateReading] 分数计算出错:', scoreError); score = 0; }
        let feedback; try { feedback = this.generateFeedback(score, compareResult.accuracy); console.log('[evaluateReading] 生成反馈:', feedback); } catch (feedbackError) { console.error('[evaluateReading] 反馈生成出错:', feedbackError); feedback = '评估出错'; }
        let flowers; try { flowers = this.generateFlowers(score); console.log('[evaluateReading] 生成小红花:', flowers ? flowers.length : 0); } catch (flowerError) { console.error('[evaluateReading] 小红花生成出错:', flowerError); flowers = []; }

        // 组合最终结果
        const finalResult = { score: score, accuracy: Math.round(compareResult.accuracy), correctWords: compareResult.correctWords, totalWords: compareResult.totalWords, feedback: feedback, flowers: flowers, contentWithErrors: compareResult.contentWithErrors, recognizedText: recognizedText };
        console.log('[evaluateReading] 最终结果:', finalResult);
        // 更新界面
        this.setData({ readingResult: finalResult, showResult: true, recordStatus: 'idle' });
        console.log('[evaluateReading] 结果已设置，显示弹窗');

        // 保存记录 (保持不变)
        try { const app = getApp(); if (app && typeof app.addReadingRecord === 'function') { const recordData = { articleId: this.articleId, articleTitle: this.data.article.title, score: finalResult.score, accuracy: finalResult.accuracy, type: 'reading', timestamp: Date.now(), feedbackHtml: finalResult.contentWithErrors, recognizedText: finalResult.recognizedText, duration: this.data.recordTime }; console.log('[evaluateReading] 准备保存记录:', recordData); app.addReadingRecord(recordData); } else { console.warn('[evaluateReading] getApp() 未找到或 app.addReadingRecord 不是函数'); } } catch (saveError) { console.error('[evaluateReading] 保存记录失败:', saveError); }
    },

    /**
     * [最终更正-借鉴背诵模式] 比较文本 - 在原文上标记红绿颜色
     * @param {string} original 预处理后的原文
     * @param {string} recognized 预处理后的识别文本
     * @param {string} language 'zh' 或 'en'
     * @returns {{accuracy: number, correctWords: number, totalWords: number, contentWithErrors: string}}
     */
    compareTexts(original, recognized, language) {
        console.log('[compareTexts - Highlight Original Mode] 开始比较');
        if (!original) { console.warn('[compareTexts] 原文为空'); return { accuracy: recognized ? 0 : 100, correctWords: 0, totalWords: 0, contentWithErrors: '<span style="color:orange;">原文为空</span>' }; }
        if (!recognized) { console.warn('[compareTexts] 识别结果为空'); const tokens = language === 'zh' ? original.split('') : original.split(/\s+/).filter(Boolean); const separator = language === 'zh' ? '' : ' '; const errors = tokens.map(token => `<span style="color:red;">${token}</span>`).join(separator); return { accuracy: 0, correctWords: 0, totalWords: tokens.length, contentWithErrors: errors }; }

        let originalTokens = []; let recognizedTokens = [];
        const isChinese = language === 'zh'; const separator = isChinese ? '' : ' ';

        if (isChinese) { originalTokens = original.split(''); recognizedTokens = recognized.split(''); }
        else { originalTokens = original.split(/\s+/).filter(Boolean); recognizedTokens = recognized.split(/\s+/).filter(Boolean); }

        const originalLength = originalTokens.length; const recognizedLength = recognizedTokens.length;

        // 1. 计算 LCS DP 表
        const dp = Array(originalLength + 1).fill(0).map(() => Array(recognizedLength + 1).fill(0));
        for (let i = 1; i <= originalLength; i++) {
            for (let j = 1; j <= recognizedLength; j++) {
                if (originalTokens[i - 1] === recognizedTokens[j - 1]) { dp[i][j] = dp[i - 1][j - 1] + 1; }
                else { dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]); }
            }
        }
        const correctWords = dp[originalLength][recognizedLength];
        const accuracy = originalLength > 0 ? (correctWords / originalLength) * 100 : 0;

        // 2. 回溯 DP 表，标记原文中哪些 token 是正确的
        const isCorrect = Array(originalLength).fill(false);
        let i = originalLength; let j = recognizedLength;
        while (i > 0 && j > 0) {
            if (originalTokens[i - 1] === recognizedTokens[j - 1]) { isCorrect[i - 1] = true; i--; j--; }
            else if (dp[i - 1][j] >= dp[i][j - 1]) { i--; }
            else { j--; }
        }

        // 3. 遍历原文 token，根据标记生成 HTML
        let contentWithErrors = '';
        for (let k = 0; k < originalLength; k++) {
            if (isCorrect[k]) { contentWithErrors += `<span style="color:green;">${originalTokens[k]}</span>`; } // 正确: 绿色
            else { contentWithErrors += `<span style="color:red;">${originalTokens[k]}</span>`; }             // 错误: 红色
            if (!isChinese && k < originalLength - 1) { contentWithErrors += separator; }
        }

        console.log(`[compareTexts] Correct: ${correctWords}, Total: ${originalLength}, Accuracy: ${accuracy.toFixed(2)}%`);
        return { accuracy: parseFloat(accuracy.toFixed(2)), correctWords: correctWords, totalWords: originalLength, contentWithErrors: contentWithErrors };
    },

    // calculateScore, generateFeedback, generateFlowers (保持不变)
    calculateScore(accuracy, totalWords, language) { const score = Math.round(accuracy); console.log(`[calculateScore - Recite Mode] Accuracy: ${accuracy.toFixed(2)}% => Score: ${score}`); return score; },
    generateFeedback(score, accuracy) { let feedback = ''; if (accuracy >= 95) { feedback = '非常棒！发音准确，几乎完美！'; } else if (accuracy >= 85) { feedback = '表现很好！朗读流利，只有少量瑕疵。'; } else if (accuracy >= 70) { feedback = '还不错！能较好地完成朗读，请注意标红的部分。'; } else if (accuracy >= 50) { feedback = '有进步空间。请仔细看标出的错误，多加练习。'; } else { feedback = '基础还需巩固。别灰心，对照原文多听多练。'; } console.log(`[generateFeedback - Recite Mode] Score: ${score}, Accuracy: ${accuracy.toFixed(2)}% => Feedback: ${feedback}`); return feedback; },
    generateFlowers(score) { const flowerCount = Math.min(Math.floor(score / 20), 5); console.log(`[generateFlowers] Score: ${score} => Flowers: ${flowerCount}`); return Array(flowerCount).fill(true); },
    // --- 评估功能结束 ---

    // --- 其他页面交互函数 (保持不变) ---
    showErrorResult(message) { console.log('[showErrorResult] 显示错误结果:', message); this.setData({ readingResult: { score: 0, accuracy: 0, correctWords: 0, totalWords: 0, feedback: message, flowers: [], contentWithErrors: '', recognizedText: '' }, showResult: true, recordStatus: 'idle' }); },
    tryAgain() { console.log('[tryAgain] 用户点击再试一次'); this.setData({ showResult: false, recordStatus: 'idle', recordTime: 0, readingResult: { score: 0, flowers: [], feedback: '', correctWords: 0, totalWords: 0, accuracy: 0, contentWithErrors: '', recognizedText: '' } }); },
    finishReading() { console.log('[finishReading] 用户点击完成朗读'); wx.navigateBack(); },
    loadRecordDetail(recordId) { console.log('[loadRecordDetail] 加载历史记录详情:', recordId); const app = getApp(); let record = null; if (app && app.globalData && app.globalData.readingHistory) { record = app.globalData.readingHistory.find(r => r.id === recordId); } if (record) { console.log('[loadRecordDetail] 找到历史记录:', record); this.setData({ article: { id: record.articleId, title: record.articleTitle, language: record.articleLanguage || 'zh' }, readingResult: { score: record.score, accuracy: record.accuracy, feedback: record.feedback || '查看历史记录', flowers: this.generateFlowers(record.score), contentWithErrors: record.feedbackHtml || '<span style="color:grey;">无详细标记</span>', recognizedText: record.recognizedText || '' }, recordTime: record.duration || 0, showResult: true, recordStatus: 'idle', isLoading: false }); if (record.articleId) { this.loadArticle(record.articleId); } } else { console.error('[loadRecordDetail] 未找到记录 ID:', recordId); wx.showToast({ title: '加载记录失败', icon: 'none' }); this.setData({ isLoading: false }); wx.navigateBack(); } },

}); // Page 结束