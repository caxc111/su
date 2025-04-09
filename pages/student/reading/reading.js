// 引入微信同声传译插件
const plugin = requirePlugin("WechatSI");
// 获取全局唯一的语音识别管理器
const manager = plugin.getRecordRecognitionManager();

Page({
    data: {
        article: {},
        recordStatus: 'idle', // idle, recording, processing
        recordTime: 0,
        showResult: false,
        recordTimer: null,
        // recorderManager: null, // 这个似乎未使用
        audioFile: '',
        waveHeights: [],
        waveTimer: null,
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
        isPlayingReading: false, // 是否正在播放范读
        // playbackState: 'idle', // 这个与 playbackPhase 重叠，移除
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
    playbackPhase: 'idle',   // 播放阶段: 'idle', 'title', 'content'
    _isCleaningUp: false,   // 清理锁，防止重复清理
    recordTimer: null,      // 将录音计时器移到实例属性
    // --- 实例状态变量结束 ---

    onLoad(options) {
        console.log("朗读/查看页面加载，options:", options);
        this.initRecord();
        this.initAudioContext(); // 初始化音频播放器及事件
        this.checkRecordPermission();

        if (options.recordId) {
            console.log(`[reading.js onLoad] 查看历史记录模式，recordId: ${options.recordId}`);
            this.setData({ mode: 'review', recordId: options.recordId, isLoading: true });
            this.loadRecordDetail(options.recordId);
        } else if (options.id) {
            console.log(`[reading.js onLoad] 练习模式，articleId: ${options.id}`);
            this.articleId = options.id; // 保存 articleId
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
        const app = getApp();
        let articleData = null;

        // 查找逻辑 (保持不变)
        if (app.globalData && app.globalData.articles) {
            articleData = app.globalData.articles.find(article => article.id === id);
        }
        if (!articleData) {
            try {
                const storedArticles = wx.getStorageSync('articles');
                if (storedArticles) {
                    articleData = storedArticles.find(article => article.id === id);
                }
            } catch (e) { console.error("从本地存储加载文章失败", e); }
        }

        if (articleData) {
            console.log('[reading.js loadArticle] 找到文章:', articleData.title);
            // 计算 wordCount 和 estimatedTime (保持不变)
            let wordCount = 0;
            const content = articleData.content || '';
            const language = articleData.language;
            if (language === 'zh') {
                wordCount = content.replace(/\s/g, '').length;
            } else {
                wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
            }
            articleData.wordCount = wordCount;
            let estimatedTime = 0;
            if (wordCount > 0) {
                estimatedTime = Math.ceil(wordCount / (language === 'zh' ? 3 : 2));
            }
            articleData.estimatedTime = estimatedTime;
            console.log('[reading.js loadArticle] 计算结果 wordCount:', wordCount, ', estimatedTime:', estimatedTime);

            this.setData({ article: articleData, isLoading: false });
            wx.setNavigationBarTitle({ title: articleData.title || '朗读练习' });
        } else {
            console.error('[reading.js loadArticle] 未能找到文章 ID:', id);
            this.setData({ isLoading: false });
            wx.showToast({ title: '加载文章失败', icon: 'none' });
        }
    },

    onUnload() {
        console.log('[reading.js onUnload] 页面卸载');
        // 清理录音定时器
        if (this.recordTimer) { // 从 this 获取
            clearInterval(this.recordTimer);
            this.recordTimer = null;
        }
        // 停止录音
        if (manager && this.data.recordStatus === 'recording') {
            try {
                console.log('[reading.js onUnload] 尝试停止录音');
                manager.stop();
            } catch (e) { console.warn('[reading.js onUnload] 停止录音出错:', e); }
        }
        // 停止并销毁音频播放器
        if (this.audioContext) {
            console.log('[reading.js onUnload] 销毁 audioContext');
            this.audioContext.stop();
            this.audioContext.destroy();
            this.audioContext = null;
        }
    },

    // 检查录音权限 (保持不变)
    checkRecordPermission() {
        wx.getSetting({
            success: (res) => {
                if (res.authSetting['scope.record']) {
                    console.log('朗读页面：已获取录音权限');
                } else {
                    console.log('朗读页面：未获取录音权限，尝试请求授权');
                    wx.authorize({
                        scope: 'scope.record',
                        success: () => { console.log('朗读页面：录音权限授权成功'); },
                        fail: () => {
                            console.error('朗读页面：用户拒绝录音权限');
                            wx.showModal({
                                title: '提示', content: '朗读练习需要您的录音权限，请在设置中允许',
                                confirmText: '去设置', cancelText: '取消',
                                success: (modalRes) => {
                                    if (modalRes.confirm) { wx.openSetting(); }
                                    else { wx.showToast({ title: '未授权无法朗读', icon: 'none' }); }
                                }
                            });
                        }
                    });
                }
            },
            fail: (err) => { console.error('检查录音权限设置失败:', err); }
        });
    },

    // 初始化语音识别回调 (保持不变)
    initRecord() {
        manager.onRecognize = (res) => { console.log("朗读中间识别结果", res.result); }
        manager.onStop = (res) => {
            console.log('[onStop Callback] ========== 录音停止 ==========');
            console.log('[onStop Callback] Raw result:', JSON.stringify(res));
            wx.hideLoading();
            if (this.recordTimer) { // 从 this 获取
                clearInterval(this.recordTimer); this.recordTimer = null;
            }
            this.setData({ recordStatus: 'processing' });
            if (res.result) {
                this.evaluateReading(this.data.article.content, res.result);
            } else {
                console.error('[onStop Callback] 结果无效');
                this.setData({ recordStatus: 'idle' });
                wx.showToast({ title: '未能识别到有效语音', icon: 'none' });
            }
        }
        manager.onError = (res) => {
            console.error('[onError Callback] ========== 录音识别错误 ==========');
            console.error('[onError Callback] Raw error:', JSON.stringify(res));
            wx.hideLoading();
            if (this.recordTimer) { // 从 this 获取
                clearInterval(this.recordTimer); this.recordTimer = null;
            }
            this.setData({ recordStatus: 'idle' });
            wx.showToast({ title: `识别错误: ${res.msg}`, icon: 'none' });
            this.cleanupReading(); // 同时清理播放状态
        }
        console.log('语音识别回调初始化完成');
    },

    // --- 文本分块函数 ---
    /**
     * 将长文本分割成指定最大长度的块
     */
    chunkText(text, maxLength) {
        if (!text) return [];
        const chunks = []; let currentPos = 0;
        const punctuation = ['。', '！', '？', '\n', '.', '!', '?'];
        const secondaryPunctuation = [',', '，', ';', '；', ' '];
        console.log(`开始分块，总长度: ${text.length}, 每块最大: ${maxLength}`);
        while (currentPos < text.length) {
            let endPos = Math.min(currentPos + maxLength, text.length);
            let splitPos = -1;
            if (endPos === text.length) { splitPos = endPos; }
            else {
                for (let i = endPos - 1; i >= currentPos; i--) { if (punctuation.includes(text[i])) { splitPos = i + 1; break; } }
                if (splitPos === -1) { for (let i = endPos - 1; i >= currentPos; i--) { if (secondaryPunctuation.includes(text[i])) { splitPos = i + 1; break; } } }
                if (splitPos === -1 || splitPos <= currentPos) { splitPos = endPos; }
            }
            const chunk = text.substring(currentPos, splitPos);
            if (chunk.trim() !== '') { chunks.push(chunk); }
            currentPos = splitPos;
        }
        console.log(`分块完成，共 ${chunks.length} 块`);
        return chunks;
    },

    // --- 初始化音频上下文及事件 ---
    /**
     * 初始化 InnerAudioContext 并绑定事件监听
     */
    initAudioContext() {
        if (this.audioContext) { console.log('[initAudioContext] 销毁旧实例...'); this.audioContext.destroy(); this.audioContext = null; }
        console.log('[initAudioContext] 创建新实例');
        this.audioContext = wx.createInnerAudioContext();
        this.audioContext.obeyMuteSwitch = false;
        this.audioContext.onPlay(() => {
            console.log('[AudioContext Event] onPlay - 开始播放');
            wx.hideLoading();
            if (!this.data.isPlayingReading) { this.setData({ isPlayingReading: true }); }
        });
        this.audioContext.onEnded(() => { // --- [修改后] onEnded 回调 ---
            console.log('[AudioContext Event] onEnded - 播放结束，当前阶段:', this.playbackPhase);
            if (this.isReadingStopped) { console.log('[onEnded] 已手动停止'); this.cleanupReading(); return; }
            if (this.playbackPhase === 'title') {
                console.log('[onEnded] 标题播放完毕，准备内容');
                this.playbackPhase = 'content';
                const content = this.data.article && this.data.article.content;
                if (!content) { console.error('[onEnded] 内容为空'); this.cleanupReading(); return; }
                this.textChunks = this.chunkText(content, 120);
                if (!this.textChunks || this.textChunks.length === 0) { console.error('[onEnded] 内容分块失败'); this.cleanupReading(); return; }
                this.currentReadingChunkIndex = 0;
                console.log('[onEnded] 内容分块完成，处理内容第一块');
                this.processNextReadingChunk();
            } else if (this.playbackPhase === 'content') {
                console.log('[onEnded] 内容段落播放完毕，准备下一段');
                this.currentReadingChunkIndex++;
                this.processNextReadingChunk();
            } else {
                console.warn('[onEnded] 未知阶段:', this.playbackPhase);
                this.cleanupReading();
            }
        });
        this.audioContext.onError((res) => {
            console.error('[AudioContext Event] onError - 播放错误:', res.errMsg, res.errCode);
            wx.hideLoading(); wx.showToast({ title: `播放失败:${res.errMsg}`, icon: 'none' }); this.cleanupReading();
        });
        this.audioContext.onWaiting(() => {
            console.log('[AudioContext Event] onWaiting - 缓冲中...');
            if (this.data.isPlayingReading && !this.isReadingStopped) { wx.showLoading({ title: '音频加载中...' }); }
        });
        this.audioContext.onCanplay(() => { console.log('[AudioContext Event] onCanplay - 可以播放'); /* wx.hideLoading(); */ });
        this.audioContext.onStop(() => { console.log('[AudioContext Event] onStop - 播放停止'); this.cleanupReading(); });
        console.log('[initAudioContext] 事件监听绑定完成');
    },

    // --- [修改后] 处理播放/停止按钮点击 ---
    /**
     * 处理用户点击“播放范读”/“停止范读”按钮
     */
    handlePlayReading(event) {
        console.log('[handlePlayReading] 用户点击播放/停止范读');
        if (this.data.isPlayingReading) {
            console.log('[handlePlayReading] 调用 handleStopReading');
            this.handleStopReading();
        } else {
            const title = this.data.article && this.data.article.title;
            const content = this.data.article && this.data.article.content;
            if (!title && !content) { console.error('[handlePlayReading] 文章无内容'); wx.showToast({ title: '文章无内容', icon: 'none' }); return; }
            console.log('[handlePlayReading] 调用 startReadingFlow');
            this.startReadingFlow(title); // 从标题开始
        }
    },

    // --- [修改后] 开始范读流程 ---
    /**
     * 开始范读流程，先合成播放标题
     */
    startReadingFlow(title) {
        console.log('[startReadingFlow] 开始流程，准备播放标题');
        this.isReadingStopped = false; this.textChunks = []; this.currentReadingChunkIndex = 0;
        this.playbackPhase = 'title'; // 设置阶段为标题
        this.setData({ isPlayingReading: true });
        wx.showLoading({ title: '合成标题...' });
        if (!this.audioContext) {
            console.warn('[startReadingFlow] AudioContext 未初始化，尝试重试'); this.initAudioContext();
            if (!this.audioContext) { console.error('[startReadingFlow] AudioContext 初始化失败!'); wx.hideLoading(); wx.showToast({ title: '播放器初始化失败', icon: 'none' }); this.setData({ isPlayingReading: false }); return; }
        }
        if (!title) { // 处理标题为空的情况
            console.warn('[startReadingFlow] 标题为空，直接进入内容'); wx.hideLoading();
            this.playbackPhase = 'content';
            const content = this.data.article && this.data.article.content;
            if (!content) { console.error('[startReadingFlow] 标题和内容都为空'); this.cleanupReading(); return; }
            this.textChunks = this.chunkText(content, 120);
            if (!this.textChunks || this.textChunks.length === 0) { console.error('[startReadingFlow] 内容分块失败'); this.cleanupReading(); return; }
            this.currentReadingChunkIndex = 0; this.processNextReadingChunk(); return;
        }
        this.synthesizeSpeech(title) // 合成标题
            .then(tempFilePath => {
                if (this.isReadingStopped) return; if (!this.audioContext) { this.cleanupReading(); return; }
                console.log('[startReadingFlow] 标题合成成功，准备播放');
                this.audioContext.src = tempFilePath;
                if (this.audioContext.paused) { this.audioContext.play(); }
                else { console.warn('[startReadingFlow] audioContext 非暂停状态'); }
                // onEnded 会处理后续内容
            })
            .catch(error => {
                console.error('[startReadingFlow] 标题合成失败:', error); wx.hideLoading();
                wx.showToast({ title: `标题合成失败: ${error.errMsg || '未知错误'}`, icon: 'none' });
                this.cleanupReading();
            });
    },

    // --- 处理下一文本块 ---
    /**
     * 处理下一个文本块的合成和播放
     */
    processNextReadingChunk() {
        console.log(`[processNextReadingChunk] 尝试处理索引: ${this.currentReadingChunkIndex}`);
        if (this.isReadingStopped) { console.log('[processNextReadingChunk] 已停止'); this.cleanupReading(); return; }
        if (this.currentReadingChunkIndex >= this.textChunks.length) {
            console.log('[processNextReadingChunk] 所有块处理完成');
            wx.showToast({ title: '朗读结束', icon: 'success', duration: 1500 }); this.cleanupReading(); return;
        }
        const currentChunk = this.textChunks[this.currentReadingChunkIndex];
        console.log(`[processNextReadingChunk] 获取块 ${this.currentReadingChunkIndex + 1}/${this.textChunks.length}`);
        wx.showLoading({ title: `合成语音 ${this.currentReadingChunkIndex + 1}/${this.textChunks.length}` });
        this.synthesizeSpeech(currentChunk)
            .then(tempFilePath => {
                console.log(`[processNextReadingChunk] 块 ${this.currentReadingChunkIndex + 1} 合成成功`);
                if (this.isReadingStopped) { console.log('[.then] 已停止'); this.cleanupReading(); return; }
                if (!this.audioContext) { console.error('[.then] AudioContext 不存在'); this.cleanupReading(); return; }
                this.audioContext.src = tempFilePath;
                console.log(`[processNextReadingChunk.then] 设置 src: ${this.audioContext.src}`);
                if (this.audioContext.paused) { this.audioContext.play(); }
                else { console.warn('[.then] audioContext 非暂停状态'); }
                // 可选：预合成优化
                const nextIndex = this.currentReadingChunkIndex + 1;
                if (nextIndex < this.textChunks.length) {
                    console.log(`[.then] 尝试预合成块 ${nextIndex + 1}`);
                    this.synthesizeSpeech(this.textChunks[nextIndex]).then(p => console.log(`[Preload] 块 ${nextIndex + 1} 成功`)).catch(e => console.warn(`[.then] 预合成块 ${nextIndex + 1} 失败:`, e));
                }
            })
            .catch(error => {
                console.error(`[processNextReadingChunk] 块 ${this.currentReadingChunkIndex + 1} 合成失败:`, error); wx.hideLoading();
                wx.showToast({ title: `语音合成失败: ${error.errMsg || '未知错误'}`, icon: 'none' }); this.cleanupReading();
            });
    },

    // --- 合成语音 ---
    /**
     * 调用 TTS 服务合成语音
     */
    synthesizeSpeech(text) {
        console.log(`[synthesizeSpeech] 合成: "${text.substring(0, 30)}..."`);
        return new Promise((resolve, reject) => {
            plugin.textToSpeech({
                lang: this.data.article.language === 'zh' ? "zh_CN" : "en_US",
                tts: true, content: text, // speed: 0.9,
                success: (res) => {
                    // console.log("[synthesizeSpeech] success raw:", JSON.stringify(res));
                    if (res.retcode === 0 && res.filename) { resolve(res.filename); }
                    else { console.error('[synthesizeSpeech] success 但结果异常:', res); reject({ errMsg: `合成结果异常: ${res.msg || `retcode:${res.retcode}`}` }); }
                },
                fail: (err) => { console.error("[synthesizeSpeech] fail:", JSON.stringify(err)); reject(err); }
            });
        });
    },

    // --- [修改后] 处理停止 ---
    /**
     * 处理用户点击“停止范读”按钮
     */
    handleStopReading() {
        console.log('[handleStopReading] 用户请求停止');
        this.isReadingStopped = true; // 设置停止标志
        if (this.audioContext) {
            console.log('[handleStopReading] 调用 audioContext.stop()');
            this.audioContext.stop(); // 触发 onStop -> cleanupReading
        } else {
            console.log('[handleStopReading] audioContext 不存在，直接清理');
            this.cleanupReading();
        }
    },

    // --- [修改后] 清理状态 ---
    /**
     * 清理范读相关的状态和资源
     */
    cleanupReading() {
        if (this._isCleaningUp) { console.log('[cleanupReading] 清理中，跳过'); return; }
        this._isCleaningUp = true; console.log('[cleanupReading] 开始清理，设置锁');
        wx.hideLoading();
        this.isReadingStopped = true; this.textChunks = []; this.currentReadingChunkIndex = 0;
        this.playbackPhase = 'idle'; // 重置播放阶段
        if (this.data && this.data.isPlayingReading) {
            console.log('[cleanupReading] 重置 isPlayingReading'); this.setData({ isPlayingReading: false });
        }
        if (this.audioContext) {
            console.log('[cleanupReading] 停止 audioContext'); this.audioContext.stop();
            // 选择不销毁实例
            // this.audioContext.destroy(); this.audioContext = null;
        }
        setTimeout(() => { this._isCleaningUp = false; console.log('[cleanupReading] 清理完成，释放锁'); }, 50);
    },

    // --- 以下是您文件中已有的其他函数 (保持不变，仅作示意) ---
    loadRecordDetail(recordId) { console.log('加载历史记录详情:', recordId); /* ... */ this.setData({ isLoading: false }); },
    toggleRecording() { console.log('切换录音状态'); /* ... */ },
    startRecording() { console.log('开始录音'); /* ... */ this.recordTimer = setInterval(() => { }, 1000); /* ... */ },
    stopRecording() { console.log('停止录音'); /* ... */ if (this.recordTimer) clearInterval(this.recordTimer); this.recordTimer = null; /* ... */ },
    evaluateReading(originalText, recognizedText) { console.log('评估朗读结果'); /* ... */ this.setData({ readingResult: {}, showResult: true, recordStatus: 'idle' }); },
    compareTexts(original, recognized, language) { console.log('比较文本'); return { /* ... */ }; },
    calculateScore(accuracy, totalWords, language) { console.log('计算分数'); return 0; },
    generateFeedback(score, accuracy) { console.log('生成反馈'); return ''; },
    generateFlowers(score) { console.log('生成小红花'); return []; },
    showErrorResult(message) { console.log('显示错误结果:', message); /* ... */ this.setData({ showResult: true, recordStatus: 'idle' }); },
    tryAgain() { console.log('再试一次'); this.setData({ showResult: false, recordStatus: 'idle', readingResult: { /* 重置 */ } }); },
    finishReading() { console.log('完成朗读'); wx.navigateBack(); },
    playContentAudio() { console.log('播放内容音频（这个函数可能不再需要，或需要与范读逻辑整合）'); },
    // 如果有 playStandardAudio 函数，它现在没有被绑定，可以考虑删除或重构

}); // Page 结束