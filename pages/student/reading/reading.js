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
        audioFile: '', // 可能不再需要，取决于实现
        waveHeights: [], // 用于波浪动画，如果需要
        waveTimer: null, // 波浪动画计时器，如果需要
        readingResult: { score: 0, flowers: [], feedback: '', correctWords: 0, totalWords: 0, accuracy: 0, contentWithErrors: '', recognizedText: '' },
        isPlayingReading: false, // 是否正在播放范读
        mode: 'practice', // 默认练习模式
        recordId: null,   // 历史记录 ID，仅 review 模式使用
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
        // --- 初始化放在前面 ---
        this.initRecord();
        this.initAudioContext(); // 确保音频上下文尽早初始化
        this.checkRecordPermission();
        // --- 初始化结束 ---

        this.setData({ isLoading: true }); // 开始加载，设置 isLoading

        if (options.recordId) {
            console.log(`[reading.js onLoad] 查看历史记录模式，recordId: ${options.recordId}`);
            this.setData({ mode: 'review', recordId: options.recordId });
            this.loadRecordDetail(options.recordId); // 加载历史记录详情，此函数内部应在成功或失败时设置 isLoading: false
        } else if (options.id) {
            console.log(`[reading.js onLoad] 练习模式，articleId: ${options.id}`);
            this.articleId = options.id;
            this.setData({ mode: 'practice' });
            this.loadArticle(options.id); // 加载文章，此函数内部应在成功或失败时设置 isLoading: false
        } else {
            console.error('[reading.js onLoad] 缺少参数 (id 或 recordId)');
            wx.showToast({ title: '页面参数错误', icon: 'none' });
            this.setData({ isLoading: false }); // 参数错误，结束加载
        }
    },

    // 加载文章数据 (练习模式)
    loadArticle(id) {
        console.log('[reading.js loadArticle] 加载文章，ID:', id);
        // 无需再次设置 isLoading: true，因为 onLoad 已设置
        const app = getApp(); let articleData = null;
        // 优先从 globalData 获取
        if (app.globalData && app.globalData.articles) { articleData = app.globalData.articles.find(article => article.id === id); }
        // 其次从本地存储获取
        if (!articleData) { try { const storedArticles = wx.getStorageSync('articles'); if (storedArticles) { articleData = storedArticles.find(article => article.id === id); } } catch (e) { console.error("加载本地存储文章失败", e); } }

        if (articleData) {
            console.log('[reading.js loadArticle] 找到文章:', articleData.title);
            let wordCount = 0; const content = articleData.content || ''; const language = articleData.language;
            // [v4 同步] 使用与 v4 compareTexts 一致的字数统计逻辑 (基于规范化文本)
            const punctuationAndSpaceRegex = /[.,!?;:"'()，。！？；：“”‘’（）《》【】、~——\s]/g;
            const normContent = content.toLowerCase().replace(punctuationAndSpaceRegex, '');
            if (language === 'zh') { wordCount = normContent.length; }
            else { wordCount = normContent.split(/\s+/).filter(Boolean).length; } // 英文按空格分割单词计数

            articleData.wordCount = wordCount; // 存储规范化后的单词/字数
            let estimatedTime = 0;
            if (wordCount > 0) { estimatedTime = Math.ceil(wordCount / (language === 'zh' ? 3 : 2)); } // 估算阅读时间
            articleData.estimatedTime = estimatedTime;

            console.log('[reading.js loadArticle] 计算结果 (规范化后) wordCount:', wordCount, ', estimatedTime:', estimatedTime);
            this.setData({ article: articleData, isLoading: false }); // 加载成功，设置文章数据并结束加载
            wx.setNavigationBarTitle({ title: articleData.title || '朗读练习' });
        } else {
            console.error('[reading.js loadArticle] 未能找到文章 ID:', id);
            this.setData({ isLoading: false }); // 加载失败，结束加载
            wx.showToast({ title: '加载文章失败', icon: 'none' });
        }
    },

    // 加载历史记录详情 (查看模式)
    loadRecordDetail(recordId) {
        console.log('[loadRecordDetail] 加载历史记录详情:', recordId);
        // 无需再次设置 isLoading: true
        const app = getApp(); let record = null;
        // 尝试从 globalData.readingHistory 获取
        if (app && app.globalData && app.globalData.readingHistory) {
            record = app.globalData.readingHistory.find(r => r.id === recordId);
        } else {
            console.warn('[loadRecordDetail] globalData.readingHistory 不存在或为空');
            // 可以考虑添加从 storage 加载历史记录的逻辑作为后备
        }

        if (record) {
            console.log('[loadRecordDetail] 找到历史记录:', record);
            const articleLanguage = record.articleLanguage || (record.articleTitle && /[\u4e00-\u9fa5]/.test(record.articleTitle) ? 'zh' : 'en'); // 尝试推断语言

            this.setData({
                article: { // 填充基本的文章信息以供显示
                    id: record.articleId,
                    title: record.articleTitle,
                    language: articleLanguage,
                    content: record.originalText || '' // 如果历史记录包含原文，可以加载
                },
                readingResult: { // 填充历史结果
                    score: record.score,
                    accuracy: record.accuracy,
                    feedback: record.feedback || '查看历史记录',
                    flowers: this.generateFlowers(record.score),
                    contentWithErrors: record.feedbackHtml || '<span style="color:grey;">无详细标记</span>',
                    recognizedText: record.recognizedText || ''
                },
                recordTime: record.duration || 0,
                showResult: true, // 直接显示结果区域
                recordStatus: 'idle',
                isLoading: false // 加载成功，结束加载
            });
            wx.setNavigationBarTitle({ title: record.articleTitle || '查看记录' });
            // 如果需要原文来支持范读等功能，并且记录中没有原文，可以尝试加载文章
            // if (record.articleId && !record.originalText) {
            //     this.loadArticle(record.articleId); // 注意：这会覆盖 article 数据
            // }
        } else {
            console.error('[loadRecordDetail] 未找到记录 ID:', recordId);
            wx.showToast({ title: '加载记录失败', icon: 'none' });
            this.setData({ isLoading: false }); // 加载失败，结束加载
            wx.navigateBack(); // 无法加载，返回上一页
        }
    },


    // 页面卸载时的清理
    onUnload() {
        console.log('[reading.js onUnload] 页面卸载');
        if (this.recordTimer) { clearInterval(this.recordTimer); this.recordTimer = null; }
        if (manager && this.data.recordStatus === 'recording') { try { console.log('[onUnload] 尝试停止录音'); manager.stop(); } catch (e) { console.warn('[onUnload] 停止录音出错:', e); } }
        this.cleanupReading(); // 调用统一的范读清理函数
        if (this.waveTimer) { clearInterval(this.waveTimer); this.waveTimer = null; }
    },

    // 检查录音权限
    checkRecordPermission() {
        wx.getSetting({
            success: (res) => {
                if (res.authSetting['scope.record']) {
                    console.log('朗读页面：已获取录音权限');
                } else {
                    console.log('朗读页面：未获取权限，尝试请求');
                    wx.authorize({
                        scope: 'scope.record',
                        success: () => { console.log('录音权限授权成功'); },
                        fail: () => {
                            console.error('用户拒绝录音权限');
                            wx.showModal({
                                title: '提示',
                                content: '朗读练习需要录音权限才能进行。请在小程序设置中打开录音权限。',
                                confirmText: '去设置',
                                cancelText: '取消',
                                success: (mr) => { if (mr.confirm) { wx.openSetting(); } else { wx.showToast({ title: '未授权无法朗读', icon: 'none' }); } }
                            });
                        }
                    });
                }
            },
            fail: (err) => { console.error('检查权限设置失败:', err); }
        });
    },

    // 初始化语音识别相关回调
    initRecord() {
        manager.onRecognize = (res) => {
            // 可以在这里处理中间识别结果，例如显示实时字幕
            // console.log("朗读中间识别结果", res.result);
        }
        manager.onStop = (res) => {
            console.log('[onStop Callback] --- 录音停止回调触发 ---');
            console.log('[onStop Callback] Raw result:', JSON.stringify(res));
            wx.hideLoading(); // 停止“正在识别”的加载提示

            // 清理录音相关状态
            if (this.recordTimer) { console.log('[onStop] 清理录音计时器'); clearInterval(this.recordTimer); this.recordTimer = null; }
            if (this.waveTimer) { clearInterval(this.waveTimer); this.waveTimer = null; this.setData({ waveHeights: [] }); }

            this.setData({ recordStatus: 'processing' }); // 进入处理状态

            if (res.result && res.result.length > 0) {
                console.log('[onStop] 识别结果有效，调用 evaluateReading');
                this.evaluateReading(this.data.article.content, res.result);
            } else {
                console.error('[onStop Callback] 识别结果无效或为空');
                this.setData({ recordStatus: 'idle' }); // 返回空闲状态
                wx.showToast({ title: '未能识别到有效语音', icon: 'none' });
            }
        }
        manager.onError = (res) => {
            console.error('[onError Callback] --- 录音或识别错误回调触发 ---');
            console.error('[onError Callback] Raw error:', JSON.stringify(res));
            wx.hideLoading(); // 停止加载提示

            // 清理录音相关状态
            if (this.recordTimer) { console.log('[onError] 清理录音计时器'); clearInterval(this.recordTimer); this.recordTimer = null; }
            if (this.waveTimer) { clearInterval(this.waveTimer); this.waveTimer = null; this.setData({ waveHeights: [] }); }

            this.setData({ recordStatus: 'idle' }); // 返回空闲状态
            wx.showToast({ title: `识别错误: ${res.msg || '未知错误'}`, icon: 'none' });
            // 错误发生时也尝试清理范读状态，以防万一
            this.cleanupReading();
        }
        console.log('朗读页面：语音识别回调初始化完成');
    },

    // --- 范读功能 ---
    // 文本分块（根据标点或最大长度）
    chunkText(text, maxLength) {
        if (!text) return [];
        const chunks = [];
        let currentPos = 0;
        // 主要分隔符（句子结束）
        const punctuation = ['。', '！', '？', '\n', '.', '!', '?'];
        // 次要分隔符（短语或停顿）
        const secondaryPunctuation = [',', '，', ';', '；', ' '];
        console.log(`[chunkText] 开始分块，总长度: ${text.length}, 每块最大: ${maxLength}`);
        while (currentPos < text.length) {
            let endPos = Math.min(currentPos + maxLength, text.length);
            let splitPos = -1;
            // 如果是最后一段，直接取到结尾
            if (endPos === text.length) {
                splitPos = endPos;
            } else {
                // 优先按主要分隔符切分
                for (let i = endPos - 1; i >= currentPos; i--) {
                    if (punctuation.includes(text[i])) {
                        splitPos = i + 1; // 包含标点本身
                        break;
                    }
                }
                // 如果找不到主要分隔符，再按次要分隔符切分
                if (splitPos === -1) {
                    for (let i = endPos - 1; i >= currentPos; i--) {
                        if (secondaryPunctuation.includes(text[i])) {
                            splitPos = i + 1; // 包含标点本身
                            break;
                        }
                    }
                }
                // 如果连次要分隔符都没有，或者切分点太靠前，则按最大长度切分
                if (splitPos === -1 || splitPos <= currentPos) {
                    splitPos = endPos;
                }
            }
            const chunk = text.substring(currentPos, splitPos);
            // 只有非空块才加入
            if (chunk.trim() !== '') {
                chunks.push(chunk);
            }
            currentPos = splitPos;
        }
        console.log(`[chunkText] 分块完成，共 ${chunks.length} 块`);
        return chunks;
    },

    // 初始化音频播放器实例
    initAudioContext() {
        // 如果已有实例，先销毁
        if (this.audioContext) {
            console.log('[initAudioContext] 检测到旧实例，销毁...');
            try {
                this.audioContext.stop();
                this.audioContext.destroy();
            } catch (e) { console.warn('[initAudioContext] 销毁旧实例时出错:', e); }
            this.audioContext = null;
        }
        console.log('[initAudioContext] 创建新的 InnerAudioContext 实例');
        this.audioContext = wx.createInnerAudioContext();
        this.audioContext.obeyMuteSwitch = false; // 不遵循系统静音开关

        // --- 绑定事件监听 ---
        this.audioContext.onPlay(() => {
            console.log('[AudioContext Event] onPlay - 开始播放');
            wx.hideLoading(); // 隐藏可能存在的加载提示
            // 确保状态同步
            if (!this.data.isPlayingReading) {
                this.setData({ isPlayingReading: true });
            }
        });

        this.audioContext.onEnded(() => {
            console.log('[AudioContext Event] onEnded - 当前段落播放结束，状态:', this.playbackPhase);
            // 如果是用户手动停止的，则不处理下一段
            if (this.isReadingStopped) {
                console.log('[onEnded] 检测到 isReadingStopped 为 true，执行清理');
                this.cleanupReading();
                return;
            }
            // 根据播放阶段决定下一步
            if (this.playbackPhase === 'title') {
                console.log('[onEnded] 标题播放完毕，准备播放内容');
                this.playbackPhase = 'content';
                const content = this.data.article && this.data.article.content;
                if (!content) { console.error('[onEnded] 文章内容为空!'); this.cleanupReading(); return; }
                // 分块内容文本
                this.textChunks = this.chunkText(content, 120); // 每块最多120字符
                if (!this.textChunks || this.textChunks.length === 0) { console.error('[onEnded] 内容分块失败或为空!'); this.cleanupReading(); return; }
                this.currentReadingChunkIndex = 0;
                console.log('[onEnded] 内容分块完成，处理第一块');
                this.processNextReadingChunk();
            } else if (this.playbackPhase === 'content') {
                console.log('[onEnded] 内容段落播放完毕，准备下一段');
                this.currentReadingChunkIndex++;
                this.processNextReadingChunk(); // 处理下一块或结束
            } else {
                console.warn('[onEnded] 未知的播放阶段:', this.playbackPhase);
                this.cleanupReading();
            }
        });

        this.audioContext.onError((res) => {
            console.error('[AudioContext Event] onError - 播放错误:', res.errMsg, res.errCode);
            wx.hideLoading();
            wx.showToast({ title: `播放失败: ${res.errMsg || '未知错误'}`, icon: 'none' });
            this.cleanupReading(); // 出错时清理状态
        });

        this.audioContext.onWaiting(() => {
            console.log('[AudioContext Event] onWaiting - 音频缓冲中...');
            // 只有在确实正在播放时才显示加载提示
            if (this.data.isPlayingReading && !this.isReadingStopped) {
                wx.showLoading({ title: '音频加载中...' });
            }
        });

        this.audioContext.onCanplay(() => {
            console.log('[AudioContext Event] onCanplay - 音频已准备好，可以播放');
            // 如果之前在缓冲，可以在这里隐藏加载提示
            // wx.hideLoading();
        });

        this.audioContext.onStop(() => {
            console.log('[AudioContext Event] onStop - 播放被手动停止');
            // 通常 onStop 后会调用 cleanupReading，这里可以不用重复处理
            // this.cleanupReading();
        });
        console.log('[initAudioContext] 音频播放器事件监听绑定完成');
    },

    // 处理“播放/停止范读”按钮点击
    handlePlayReading(event) {
        console.log('--- handlePlayReading 被点击! ---'); // **关键日志**
        console.log('[handlePlayReading] 当前 isPlayingReading 状态:', this.data.isPlayingReading);

        // 检查是否因其他状态被禁用（理论上 WXML 的 disabled 会阻止，但加层保险）
        if (this.data.isLoading || this.data.recordStatus === 'recording' || this.data.recordStatus === 'processing') {
            console.warn('[handlePlayReading] 尝试在不允许的状态下触发播放，状态:', this.data.isLoading, this.data.recordStatus);
            return;
        }

        if (this.data.isPlayingReading) {
            // 如果当前正在播放，则调用停止逻辑
            console.log('[handlePlayReading] 当前正在播放，调用 handleStopReading');
            this.handleStopReading();
        } else {
            // 如果当前未播放，则开始播放流程
            console.log('[handlePlayReading] 当前未播放，准备开始播放');
            const title = this.data.article && this.data.article.title;
            const content = this.data.article && this.data.article.content;

            // 确保有内容可读
            if (!content && !title) { // 标题或内容至少有一个
                console.error('[handlePlayReading] 文章标题和内容都为空，无法播放');
                wx.showToast({ title: '文章无内容', icon: 'none' });
                return;
            }

            console.log('[handlePlayReading] 内容检查通过，调用 startReadingFlow');
            // 如果正在录音，先停止录音（虽然按钮理论上会禁用，加个保险）
            if (this.data.recordStatus === 'recording') {
                console.warn('[handlePlayReading] 检测到仍在录音，先停止录音');
                this.stopRecording(); // 停止录音
                // 稍微延迟再开始播放，给停止操作一点时间
                setTimeout(() => {
                    this.startReadingFlow(title);
                }, 300);
            } else {
                this.startReadingFlow(title);
            }
        }
    },

    // 开始范读流程
    startReadingFlow(title) {
        console.log('[startReadingFlow] 开始范读流程，准备播放标题');
        this.isReadingStopped = false; // 重置停止标记
        this.textChunks = [];          // 清空旧的文本块
        this.currentReadingChunkIndex = 0; // 重置块索引
        this.playbackPhase = 'title';  // 设置初始阶段为播放标题
        this.setData({ isPlayingReading: true }); // 更新界面状态

        wx.showLoading({ title: '合成标题中...' });

        // 确保 audioContext 已初始化
        if (!this.audioContext) {
            console.warn('[startReadingFlow] AudioContext 未初始化，尝试重新初始化');
            this.initAudioContext();
            if (!this.audioContext) {
                console.error('[startReadingFlow] AudioContext 初始化失败!');
                wx.hideLoading();
                wx.showToast({ title: '播放器初始化失败', icon: 'none' });
                this.cleanupReading(); // 清理状态
                return;
            }
        }

        // 如果标题为空，直接跳到内容
        const content = this.data.article && this.data.article.content;
        if (!title) {
            console.warn('[startReadingFlow] 标题为空，直接开始播放内容');
            wx.hideLoading();
            this.playbackPhase = 'content';
            if (!content) { console.error('[startReadingFlow] 标题和内容都为空!'); this.cleanupReading(); return; }
            this.textChunks = this.chunkText(content, 120);
            if (!this.textChunks || this.textChunks.length === 0) { console.error('[startReadingFlow] 内容分块失败或为空!'); this.cleanupReading(); return; }
            this.currentReadingChunkIndex = 0;
            this.processNextReadingChunk(); // 开始处理内容的第一块
            return;
        }

        // 合成标题语音
        this.synthesizeSpeech(title)
            .then(tempFilePath => {
                if (this.isReadingStopped) { console.log('[startReadingFlow.then] 标题合成后发现已停止'); this.cleanupReading(); return; }
                if (!this.audioContext) { console.error('[startReadingFlow.then] AudioContext 不存在!'); this.cleanupReading(); return; }
                console.log('[startReadingFlow] 标题合成成功，准备播放:', tempFilePath);
                this.audioContext.src = tempFilePath;
                // 检查状态并播放
                if (this.audioContext.paused) {
                    console.log('[startReadingFlow.then] 调用 audioContext.play() 播放标题');
                    this.audioContext.play();
                } else {
                    console.warn('[startReadingFlow.then] audioContext 状态非暂停，可能是正在播放或未初始化? 当前 src:', this.audioContext.src);
                    // 可以尝试先 stop 再 play，或者检查 audioContext 状态
                    // this.audioContext.stop();
                    // this.audioContext.play();
                }
            })
            .catch(error => {
                console.error('[startReadingFlow] 标题语音合成失败:', error);
                wx.hideLoading();
                wx.showToast({ title: `标题合成失败: ${error.errMsg || '未知错误'}`, icon: 'none' });
                this.cleanupReading(); // 出错时清理
            });
    },

    // 处理下一段文本块的合成与播放
    processNextReadingChunk() {
        console.log(`[processNextReadingChunk] 尝试处理块索引: ${this.currentReadingChunkIndex}`);

        // 检查是否已停止
        if (this.isReadingStopped) {
            console.log('[processNextReadingChunk] 检测到 isReadingStopped 为 true，停止处理');
            this.cleanupReading();
            return;
        }

        // 检查是否所有块都已处理完毕
        if (!this.textChunks || this.currentReadingChunkIndex >= this.textChunks.length) {
            console.log('[processNextReadingChunk] 所有文本块处理完成');
            wx.showToast({ title: '范读结束', icon: 'success', duration: 1500 });
            this.cleanupReading(); // 全部播放完毕，清理
            return;
        }

        // 获取当前要处理的文本块
        const currentChunk = this.textChunks[this.currentReadingChunkIndex];
        console.log(`[processNextReadingChunk] 获取块 ${this.currentReadingChunkIndex + 1}/${this.textChunks.length}: "${currentChunk.substring(0, 30)}..."`);
        wx.showLoading({ title: `合成语音 ${this.currentReadingChunkIndex + 1}/${this.textChunks.length}` });

        // 合成当前块的语音
        this.synthesizeSpeech(currentChunk)
            .then(tempFilePath => {
                console.log(`[processNextReadingChunk.then] 块 ${this.currentReadingChunkIndex + 1} 合成成功`);
                if (this.isReadingStopped) { console.log('[.then] 合成后发现已停止'); this.cleanupReading(); return; }
                if (!this.audioContext) { console.error('[.then] AudioContext 不存在!'); this.cleanupReading(); return; }

                // 设置音频源并播放
                this.audioContext.src = tempFilePath;
                console.log(`[processNextReadingChunk.then] 设置 src: ${tempFilePath}`);
                if (this.audioContext.paused) {
                    console.log('[processNextReadingChunk.then] 调用 audioContext.play()');
                    this.audioContext.play();
                } else {
                    console.warn('[.then] audioContext 状态非暂停，尝试先 stop 再 play');
                    // 有时立即重设 src 再 play 会有问题，尝试先 stop
                    this.audioContext.stop();
                    // 需要一点延迟让 stop 生效
                    setTimeout(() => {
                        if (this.audioContext && !this.isReadingStopped) { // 再次检查状态
                            this.audioContext.src = tempFilePath;
                            this.audioContext.play();
                            console.log('[.then] 延迟后重新 play');
                        }
                    }, 50);
                }

                // --- 预加载下一块（可选，提升体验）---
                const nextIndex = this.currentReadingChunkIndex + 1;
                if (nextIndex < this.textChunks.length) {
                    console.log(`[.then] 尝试预合成下一块 ${nextIndex + 1}`);
                    this.synthesizeSpeech(this.textChunks[nextIndex])
                        .then(preloadPath => console.log(`[Preload] 块 ${nextIndex + 1} 预合成成功: ${preloadPath}`))
                        .catch(preloadError => console.warn(`[Preload] 预合成块 ${nextIndex + 1} 失败:`, preloadError));
                }
                // --- 预加载结束 ---

            })
            .catch(error => {
                console.error(`[processNextReadingChunk] 块 ${this.currentReadingChunkIndex + 1} 合成失败:`, error);
                wx.hideLoading();
                wx.showToast({ title: `语音合成失败: ${error.errMsg || '未知错误'}`, icon: 'none' });
                this.cleanupReading(); // 合成失败也清理
            });
    },

    // 调用插件进行文本转语音
    synthesizeSpeech(text) {
        console.log(`[synthesizeSpeech] 请求合成文本: "${text.substring(0, 30)}..."`);
        const languageSetting = this.data.article.language === 'zh' ? "zh_CN" : "en_US";
        console.log(`[synthesizeSpeech] 使用语言: ${languageSetting}`);
        return new Promise((resolve, reject) => {
            plugin.textToSpeech({
                lang: languageSetting,
                tts: true,
                content: text,
                success: (res) => {
                    console.log("[synthesizeSpeech] success:", JSON.stringify(res));
                    if (res.retcode === 0 && res.filename) {
                        console.log(`[synthesizeSpeech] 合成成功，文件路径: ${res.filename}`);
                        resolve(res.filename); // 返回临时文件路径
                    } else {
                        console.error('[synthesizeSpeech] success 回调但结果异常:', res);
                        reject({ errMsg: `合成API返回异常: ${res.msg || `retcode:${res.retcode}`}` });
                    }
                },
                fail: (err) => {
                    console.error("[synthesizeSpeech] fail:", JSON.stringify(err));
                    reject(err); // 将错误对象传递出去
                }
            });
        });
    },

    // 处理停止范读按钮点击
    handleStopReading() {
        console.log('[handleStopReading] 用户请求停止范读');
        this.isReadingStopped = true; // 设置停止标记
        if (this.audioContext) {
            console.log('[handleStopReading] 调用 audioContext.stop()');
            this.audioContext.stop(); // 停止播放器
            // stop 事件会自动触发 cleanupReading，这里不再手动调用
        } else {
            console.log('[handleStopReading] audioContext 不存在，直接清理状态');
            this.cleanupReading(); // 如果播放器不存在，手动清理状态
        }
    },

    // 清理范读相关的状态和资源
    cleanupReading() {
        // 使用防抖，避免短时间内重复清理
        if (this._isCleaningUp) {
            console.log('[cleanupReading] 清理正在进行中，跳过此次调用');
            return;
        }
        this._isCleaningUp = true; // 设置清理锁
        console.log('[cleanupReading] 开始清理范读状态...');
        wx.hideLoading(); // 确保隐藏加载提示

        this.isReadingStopped = true; // 确保停止标记被设置
        this.textChunks = [];          // 清空文本块
        this.currentReadingChunkIndex = 0; // 重置索引
        this.playbackPhase = 'idle';  // 重置播放阶段

        // 检查 data 是否存在以及 isPlayingReading 是否为 true
        if (this.data && this.data.isPlayingReading) {
            console.log('[cleanupReading] 重置 isPlayingReading 状态为 false');
            this.setData({ isPlayingReading: false });
        }

        // 安全地停止和销毁 audioContext
        if (this.audioContext) {
            console.log('[cleanupReading] 尝试停止并销毁 audioContext');
            try {
                this.audioContext.stop();
                this.audioContext.destroy(); // 销毁实例
                console.log('[cleanupReading] audioContext 已销毁');
            } catch (e) {
                console.warn('[cleanupReading] 销毁 audioContext 时出错:', e);
            }
            this.audioContext = null; // 清除引用
        }

        // 释放清理锁 (延迟一点释放，确保清理操作完成)
        setTimeout(() => {
            this._isCleaningUp = false;
            console.log('[cleanupReading] 清理完成，释放锁');
        }, 50); // 50ms 延迟
    },
    // --- 范读功能结束 ---


    // --- 录音功能 ---
    // 切换录音状态（开始/停止）
    toggleRecording() {
        const currentStatus = this.data.recordStatus;
        console.log(`[toggleRecording] 当前录音状态: ${currentStatus}`);

        if (currentStatus === 'recording') {
            console.log('[toggleRecording] 当前正在录音，调用 stopRecording');
            this.stopRecording();
        } else if (currentStatus === 'idle') {
            // 如果正在播放范读，先停止范读
            if (this.data.isPlayingReading) {
                console.log('[toggleRecording] 检测到正在播放范读，先停止范读');
                this.handleStopReading(); // 停止范读
                // 延迟一小段时间再开始录音，确保范读完全停止
                setTimeout(() => {
                    console.log('[toggleRecording] 延迟后调用 startRecording');
                    this.startRecording();
                }, 300); // 300ms 延迟
            } else {
                console.log('[toggleRecording] 当前空闲，调用 startRecording');
                this.startRecording();
            }
        } else if (currentStatus === 'processing') {
            console.log('[toggleRecording] 当前正在处理结果，不执行操作');
            wx.showToast({ title: '正在处理上次录音...', icon: 'none' });
        }
    },

    // 开始录音
    startRecording() {
        console.log('[startRecording] 准备开始朗读录音和识别');
        const article = this.data.article;
        // 检查文章数据
        if (!article || !article.content) {
            console.error('[startRecording] 文章数据不完整或未加载');
            wx.showToast({ title: '文章加载不完整', icon: 'none' });
            return;
        }
        // 确定识别语言
        const language = article.language === 'zh' ? 'zh_CN' : 'en_US';
        console.log(`[startRecording] 文章语言: ${article.language}, 识别语言参数: ${language}`);

        // 更新状态，重置结果
        this.setData({
            recordStatus: 'recording',
            recordTime: 0,
            readingResult: { score: 0, flowers: [], feedback: '', correctWords: 0, totalWords: 0, accuracy: 0, contentWithErrors: '', recognizedText: '' },
            showResult: false // 隐藏上一轮的结果显示
        });
        wx.showLoading({ title: '准备录音...' });

        try {
            console.log('[startRecording] 调用 manager.start()，参数:', { lang: language });
            manager.start({ lang: language });
            console.log('[startRecording] manager.start() 调用成功');
            this.startRecordTimer(); // 启动录音计时器
            wx.hideLoading(); // 隐藏"准备录音"提示
            // 可以在这里启动录音动画（如果需要）
            // this.startWaveAnimation();
        } catch (error) {
            console.error('[startRecording] 调用 manager.start() 失败:', error);
            wx.hideLoading();
            wx.showToast({ title: `启动录音失败: ${error.errMsg || '请检查权限或重试'}`, icon: 'none' });
            this.setData({ recordStatus: 'idle' }); // 恢复空闲状态
        }
    },

    // 停止录音
    stopRecording() {
        console.log('[stopRecording] 准备停止录音');
        if (this.data.recordStatus !== 'recording') {
            console.warn('[stopRecording] 当前状态并非录音中，不执行停止操作. 当前状态:', this.data.recordStatus);
            return;
        }
        // 停止录音动画（如果需要）
        // this.stopWaveAnimation();
        try {
            console.log('[stopRecording] 调用 manager.stop()');
            manager.stop(); // 请求停止录音和识别
            console.log('[stopRecording] manager.stop() 调用完成');
            // 清理计时器（onStop 回调里也会清理，这里再加一层保险）
            if (this.recordTimer) {
                console.log('[stopRecording] 清理录音计时器');
                clearInterval(this.recordTimer);
                this.recordTimer = null;
            }
            // 显示识别中的提示
            wx.showLoading({ title: '正在识别...' });
            // 注意：状态在 onStop 或 onError 回调中改变，这里不立即改变为 processing
        } catch (error) {
            console.error('[stopRecording] 调用 manager.stop() 失败:', error);
            wx.hideLoading();
            wx.showToast({ title: `停止录音失败: ${error.errMsg || '请重试'}`, icon: 'none' });
            // 如果停止失败，也清理计时器并恢复 idle 状态
            if (this.recordTimer) { clearInterval(this.recordTimer); this.recordTimer = null; }
            this.setData({ recordStatus: 'idle' });
        }
    },

    // 启动录音计时器
    startRecordTimer() {
        console.log('[startRecordTimer] 启动录音计时器');
        // 先清理可能存在的旧计时器
        if (this.recordTimer) { clearInterval(this.recordTimer); }
        // 设置新的计时器
        this.recordTimer = setInterval(() => {
            // 在计时器回调中检查状态，如果不再是录音状态则停止计时
            if (this.data.recordStatus !== 'recording') {
                console.log('[Timer] 状态非 recording，停止计时器');
                if (this.recordTimer) { clearInterval(this.recordTimer); this.recordTimer = null; }
                return;
            }
            // 更新录音时间
            const newTime = this.data.recordTime + 1;
            this.setData({ recordTime: newTime });
            // 检查是否达到最大时长
            if (newTime >= this.maxRecordDuration) {
                console.log('[Timer] 达到最大录音时长，自动停止录音');
                this.stopRecording(); // 自动调用停止
            }
        }, 1000); // 每秒执行一次
        console.log('[startRecordTimer] 录音计时器已设置, ID:', this.recordTimer);
    },
    // --- 录音功能结束 ---


    // --- 评估功能 ---
    /**
     * [核心] 评估朗读结果
     * @param {string} originalText 原始的文章内容
     * @param {string} recognizedText 语音识别返回的文本
     */
    evaluateReading(originalText, recognizedText) {
        console.log('[evaluateReading] 开始评估朗读');
        console.log('[evaluateReading] 原始原文(前50):', originalText ? originalText.substring(0, 50) + '...' : 'null');
        console.log('[evaluateReading] 原始识别(前50):', recognizedText ? recognizedText.substring(0, 50) + '...' : 'null');

        // 检查输入
        if (!originalText || !recognizedText) {
            console.error("评估错误：原文或识别文本为空");
            this.showErrorResult("评估失败，文本内容缺失");
            return;
        }

        const language = this.data.article.language;
        let comparisonResult;
        try {
            // 注意：v4 版本 compareTexts 内部会做规范化，这里不需要再预处理
            // const preprocessText = (text) => { ... };
            // const processedOriginalText = preprocessText(originalText);
            // const processedRecognizedText = preprocessText(recognizedText);

            // *** 调用 v4 版本的 compareTexts ***
            // 直接传入原始文本，函数内部处理标点和大小写
            comparisonResult = this.compareTexts(originalText, recognizedText, language);
            console.log('[evaluateReading] compareTexts 调用完成，结果:', comparisonResult);

            // 检查比较结果是否有效
            if (!comparisonResult || typeof comparisonResult.accuracy !== 'number' || isNaN(comparisonResult.accuracy) || typeof comparisonResult.contentWithErrors !== 'string') {
                console.warn('[evaluateReading] compareTexts 返回结果无效或格式不正确, 使用默认错误结果');
                // [v4 同步] 保持 totalWords 计算一致性
                const punctuationAndSpaceRegex = /[.,!?;:"'()，。！？；：“”‘’（）《》【】、~——\s]/g;
                const normOriginalLength = originalText ? (originalText.toLowerCase().replace(punctuationAndSpaceRegex, '').length) : 0;
                comparisonResult = {
                    accuracy: 0,
                    correctWords: 0,
                    totalWords: normOriginalLength, // 使用规范化长度
                    contentWithErrors: '<span style="color:red;">文本比较过程出错</span>' // 明确错误信息
                };
            }
        } catch (compareError) {
            console.error('[evaluateReading] 调用 compareTexts 时发生异常:', compareError);
            this.showErrorResult(`文本比较异常: ${compareError.message}`);
            return;
        }

        // --- 计算分数、生成反馈、生成小红花 ---
        // 使用 compareResult 中的数据
        const totalWords = comparisonResult.totalWords; // 来自规范化长度
        const correctWords = comparisonResult.correctWords; // 来自LCS
        const accuracy = comparisonResult.accuracy; // 来自计算

        let score; try { score = this.calculateScore(accuracy, totalWords, language); } catch (e) { console.error('计算分数出错:', e); score = 0; }
        let feedback; try { feedback = this.generateFeedback(score, accuracy); } catch (e) { console.error('生成反馈出错:', e); feedback = '评估出错'; }
        let flowers; try { flowers = this.generateFlowers(score); } catch (e) { console.error('生成小红花出错:', e); flowers = []; }
        // --- 计算结束 ---

        // 组合最终结果对象
        const finalResult = {
            score: score,
            accuracy: Math.round(accuracy), // 取整显示
            correctWords: correctWords,
            totalWords: totalWords,
            feedback: feedback,
            flowers: flowers,
            contentWithErrors: comparisonResult.contentWithErrors, // 带标记的 HTML
            recognizedText: recognizedText // 保存原始识别文本供参考
        };
        console.log('[evaluateReading] 生成最终结果对象:', finalResult);

        // 更新界面显示结果
        this.setData({
            readingResult: finalResult,
            showResult: true, // 显示结果区域
            recordStatus: 'idle' // 处理完成，返回空闲状态
        });
        console.log('[evaluateReading] 结果已更新到 setData，评估流程结束');

        // --- 保存朗读记录 ---
        try {
            const app = getApp();
            if (app && typeof app.addReadingRecord === 'function') {
                const recordData = {
                    id: `reading-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, // 生成唯一ID
                    articleId: this.articleId,
                    articleTitle: this.data.article.title,
                    articleLanguage: this.data.article.language, // 保存语言信息
                    originalText: originalText,                 // 保存原文
                    score: finalResult.score,
                    accuracy: finalResult.accuracy,
                    type: 'reading', // 标记类型
                    timestamp: Date.now(),
                    feedbackHtml: finalResult.contentWithErrors, // 保存带标记的HTML
                    recognizedText: finalResult.recognizedText,   // 保存识别文本
                    duration: this.data.recordTime               // 保存录音时长
                };
                console.log('[evaluateReading] 准备调用 app.addReadingRecord 保存记录:', recordData);
                app.addReadingRecord(recordData);
            } else {
                console.warn('[evaluateReading] getApp() 未找到或 app.addReadingRecord 不是函数，无法保存记录');
            }
        } catch (saveError) {
            console.error('[evaluateReading] 保存朗读记录时发生异常:', saveError);
        }
        // --- 保存记录结束 ---
    },

    /**
     * [v4 - Final Fix for Reading] 比较文本 - 原文标记红绿, 数字等效, 忽略标点评分和标记
     * (与 recite_practice.js 中的版本完全一致)
     * @param {string} original 原始原文 (未经处理)
     * @param {string} recognized 原始识别文本 (未经处理)
     * @param {string} language 'zh' 或 'en'
     * @returns {{accuracy: number, correctWords: number, totalWords: number, contentWithErrors: string}}
     */
    compareTexts(original, recognized, language) {
        console.log('[compareTexts v4 - Reading Mode] 开始比较');
        console.log('[compareTexts v4] Original Input:', original ? original.substring(0, 50) + '...' : 'null');
        console.log('[compareTexts v4] Recognized Input:', recognized ? recognized.substring(0, 50) + '...' : 'null');

        // --- 常量定义 ---
        const numeralMap = { '零': '0', '壹': '1', '贰': '2', '叁': '3', '肆': '4', '伍': '5', '陆': '6', '柒': '7', '捌': '8', '玖': '9', '拾': '10' };
        const simpleNumeralMap = { '一': '1', '二': '2', '三': '3', '四': '4', '五': '5', '六': '6', '七': '7', '八': '8', '九': '9', '〇': '0', '十': '10' };
        const isDigit = (char) => /^[0-9]$/.test(char);
        const arabicToCapitalMap = Object.fromEntries(Object.entries(numeralMap).map(([k, v]) => [v, k]));
        const arabicToSimpleMap = Object.fromEntries(Object.entries(simpleNumeralMap).map(([k, v]) => [v, k]));
        const punctuationAndSpaceRegex = /[.,!?;:"'()，。！？；：“”‘’（）《》【】、~——\s]/g; // 用于清理和统计
        const punctuationAndSpaceSplitRegex = /([.,!?;:"'()，。！？；：“”‘’（）《》【】、~——\s])/g; // 用于分割保留标点
        // --- 常量定义结束 ---

        // --- 输入检查与处理 ---
        if (!original) { console.warn('[compareTexts v4] 原文为空'); return { accuracy: recognized ? 0 : 100, correctWords: 0, totalWords: 0, contentWithErrors: '<span style="color:orange;">原文为空</span>' }; }

        const isChinese = language === 'zh';
        const separator = isChinese ? '' : ' '; // 中文不加空格，英文加

        // 显示用的原文分词（保留标点和空格）
        const displayTokens = isChinese
            ? original.split('')
            : original.split(punctuationAndSpaceSplitRegex).filter(Boolean); // 保留分隔符进行显示

        if (!recognized) {
            console.warn('[compareTexts v4] 识别结果为空，原文标红处理');
            // 识别为空时，将原文所有非标点部分标红
            const errorsHtml = displayTokens.map(token =>
                punctuationAndSpaceRegex.test(token) ? token : `<span style="color:red;">${token}</span>`
            ).join(separator);
            // 计算规范化后的原文长度作为 totalWords
            const normOriginalTextForEmptyRec = original.toLowerCase().replace(punctuationAndSpaceRegex, '');
            const totalWordsForEmptyRec = isChinese
                ? normOriginalTextForEmptyRec.length
                : normOriginalTextForEmptyRec.split(/\s+/).filter(Boolean).length;
            return { accuracy: 0, correctWords: 0, totalWords: totalWordsForEmptyRec, contentWithErrors: errorsHtml };
        }
        // --- 输入检查结束 ---


        // --- 文本规范化 (用于计算准确率) ---
        // 转小写，移除所有标点和空格
        const normalize = (text) => text.toLowerCase().replace(punctuationAndSpaceRegex, '');
        const normalizedOriginalText = normalize(original);
        const normalizedRecognizedText = normalize(recognized);
        console.log('[compareTexts v4] Normalized Original:', normalizedOriginalText.substring(0, 50) + '...');
        console.log('[compareTexts v4] Normalized Recognized:', normalizedRecognizedText.substring(0, 50) + '...');
        // --- 规范化结束 ---


        // --- 分词/分字 (基于规范化文本，用于LCS计算) ---
        const normOriginalTokens = isChinese ? normalizedOriginalText.split('') : normalizedOriginalText.split(/\s+/).filter(Boolean);
        const recognizedTokens = isChinese ? normalizedRecognizedText.split('') : normalizedRecognizedText.split(/\s+/).filter(Boolean);
        const originalLength = normOriginalTokens.length; // totalWords 基于规范化长度
        const recognizedLength = recognizedTokens.length;
        console.log(`[compareTexts v4] NormOriginalLength (TotalWords for Accuracy): ${originalLength}`);
        if (originalLength === 0) { // 如果原文规范化后为空（比如只有标点）
            console.warn('[compareTexts v4] 原文规范化后长度为 0');
            const errorsHtmlAllRed = displayTokens.map(token => punctuationAndSpaceRegex.test(token) ? token : `<span style="color:red;">${token}</span>`).join(separator);
            return { accuracy: recognizedLength === 0 ? 100 : 0, correctWords: 0, totalWords: 0, contentWithErrors: errorsHtmlAllRed };
        }
        // --- 分词/分字结束 ---


        // --- 1. 计算准确率 (LCS on normalized tokens, 加入数字等效判断) ---
        const dp = Array(originalLength + 1).fill(0).map(() => Array(recognizedLength + 1).fill(0));
        for (let i = 1; i <= originalLength; i++) {
            for (let j = 1; j <= recognizedLength; j++) {
                const origNormToken = normOriginalTokens[i - 1];
                const recogToken = recognizedTokens[j - 1];

                // 检查是否匹配 (直接相等或数字等效)
                let tokenMatch = (origNormToken === recogToken);
                if (!tokenMatch && isChinese) { // 仅中文处理数字等效
                    if ((numeralMap[origNormToken] === recogToken) || // 大写转阿拉伯数字
                        (simpleNumeralMap[origNormToken] === recogToken) || // 小写转阿拉伯数字
                        (isDigit(origNormToken) && arabicToCapitalMap[origNormToken] === recogToken) || // 阿拉伯数字转大写
                        (isDigit(origNormToken) && arabicToSimpleMap[origNormToken] === recogToken))   // 阿拉伯数字转小写
                    {
                        tokenMatch = true;
                        // console.log(`[LCS Num Match] ${origNormToken} <=> ${recogToken}`);
                    }
                }

                // 更新 DP 表
                if (tokenMatch) {
                    dp[i][j] = dp[i - 1][j - 1] + 1;
                } else {
                    dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
                }
            }
        }
        const correctWords = dp[originalLength][recognizedLength]; // LCS 长度即为正确单词数
        const accuracy = originalLength > 0 ? (correctWords / originalLength) * 100 : (recognizedLength === 0 ? 100 : 0);
        console.log(`[compareTexts v4] LCS CorrectWords: ${correctWords}, Accuracy: ${accuracy.toFixed(2)}%`);
        // --- 准确率计算结束 ---


        // --- 2. 生成带标记的 HTML (基于原始显示分词，参考LCS结果) ---
        // 需要回溯LCS找出匹配的具体token对，才能准确标记原文
        const isOriginalTokenMatched = Array(originalLength).fill(false);
        let i = originalLength; let j = recognizedLength;
        while (i > 0 && j > 0) {
            const origNormToken = normOriginalTokens[i - 1];
            const recogToken = recognizedTokens[j - 1];
            let currentMatch = (origNormToken === recogToken);
            if (!currentMatch && isChinese) { if ((numeralMap[origNormToken] === recogToken) || (simpleNumeralMap[origNormToken] === recogToken) || (isDigit(origNormToken) && arabicToCapitalMap[origNormToken] === recogToken) || (isDigit(origNormToken) && arabicToSimpleMap[origNormToken] === recogToken)) { currentMatch = true; } }

            if (currentMatch) {
                isOriginalTokenMatched[i - 1] = true; // 标记原文这个规范化 token 匹配上了
                i--; j--;
            } else if (dp[i - 1][j] >= dp[i][j - 1]) { // 来自上方
                i--;
            } else { // 来自左方
                j--;
            }
        }

        // 遍历显示用的原文分词，根据标记结果上色
        let contentWithErrors = '';
        let normTokenIndex = 0; // 指向 isOriginalTokenMatched 的索引
        for (let k = 0; k < displayTokens.length; k++) {
            const currentDisplayToken = displayTokens[k];
            const isPunctOrSpace = punctuationAndSpaceRegex.test(currentDisplayToken);

            if (isPunctOrSpace) {
                contentWithErrors += currentDisplayToken; // 标点空格直接添加
            } else {
                // 这是一个有效词/字，检查它是否匹配
                const isMatch = isOriginalTokenMatched[normTokenIndex];
                const color = isMatch ? 'green' : 'red'; // 匹配为绿，不匹配为红
                contentWithErrors += `<span style="color:${color};">${currentDisplayToken}</span>`;
                normTokenIndex++; // 移动到下一个规范化 token 的匹配结果
            }
            // 英文单词间添加空格
            if (!isChinese && k < displayTokens.length - 1 && !punctuationAndSpaceRegex.test(displayTokens[k + 1])) {
                contentWithErrors += separator;
            }
        }
        // --- HTML 生成结束 ---

        // --- 3. 返回结果 ---
        console.log('[compareTexts v4] 比较完成.');
        return {
            accuracy: parseFloat(accuracy.toFixed(2)), // 保留两位小数
            correctWords: correctWords,
            totalWords: originalLength, // 总词数基于规范化原文
            contentWithErrors: contentWithErrors
        };
        // --- 返回结束 ---
    },


    // --- 分数、反馈、小红花计算 (保持 reading.js 自己的逻辑) ---
    calculateScore(accuracy, totalWords, language) {
        // 可以根据需要调整评分逻辑，例如不仅仅基于准确率
        const score = Math.round(accuracy);
        console.log(`[calculateScore] Accuracy: ${accuracy.toFixed(2)}% => Score: ${score}`);
        return score;
    },
    generateFeedback(score, accuracy) {
        let feedback = '';
        if (accuracy >= 95) { feedback = '非常流利，发音标准！'; }
        else if (accuracy >= 80) { feedback = '整体不错，个别发音需注意。'; }
        else if (accuracy >= 60) { feedback = '还有提升空间，请注意带标记的错误。'; }
        else { feedback = '请多加练习，注意发音和流畅度。'; }
        console.log(`[generateFeedback] Score: ${score}, Accuracy: ${accuracy.toFixed(2)}% => Feedback: ${feedback}`);
        return feedback;
    },
    generateFlowers(score) {
        // 每 20 分得一朵小红花，最多 5 朵
        const flowerCount = Math.min(Math.floor(score / 20), 5);
        console.log(`[generateFlowers] Score: ${score} => Flowers: ${flowerCount}`);
        return Array(flowerCount).fill(true); // 返回包含 true 的数组代表花朵
    },
    // --- 评估辅助函数结束 ---


    // --- 其他页面交互函数 ---
    // 显示错误结果的简化函数
    showErrorResult(message) {
        console.log('[showErrorResult] 显示错误结果:', message);
        // 尝试计算原文规范化长度，即使出错也提供默认值
        let normOriginalLength = 0;
        try {
            const punctuationAndSpaceRegex = /[.,!?;:"'()，。！？；：“”‘’（）《》【】、~——\s]/g;
            normOriginalLength = this.data.article && this.data.article.content
                ? (this.data.article.content.toLowerCase().replace(punctuationAndSpaceRegex, '').length)
                : 0;
        } catch (e) { console.error('计算 normOriginalLength 出错:', e); }

        this.setData({
            readingResult: {
                score: 0, accuracy: 0, correctWords: 0,
                totalWords: normOriginalLength, // 显示计算出的或默认的0
                feedback: message || '处理失败，请重试',
                flowers: [],
                contentWithErrors: `<span style="color:red;">${message || '处理失败'}</span>`,
                recognizedText: ''
            },
            showResult: true, // 显示结果区域
            recordStatus: 'idle' // 返回空闲状态
        });
    },

    // “再试一次”按钮点击处理
    tryAgain() {
        console.log('[tryAgain] 用户点击再试一次');
        this.setData({
            showResult: false, // 隐藏结果区域
            recordStatus: 'idle', // 返回空闲状态
            recordTime: 0,      // 重置录音时间
            readingResult: { score: 0, flowers: [], feedback: '', correctWords: 0, totalWords: 0, accuracy: 0, contentWithErrors: '', recognizedText: '' } // 重置结果对象
        });
    },

    // “完成朗读”按钮点击处理
    finishReading() {
        console.log('[finishReading] 用户点击完成朗读');
        wx.navigateBack(); // 返回上一页
    },

}); // Page 结束