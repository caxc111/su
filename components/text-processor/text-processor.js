Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 文本内容
    content: {
      type: String,
      value: ''
    },
    // 语言类型：'zh' 或 'en'
    language: {
      type: String,
      value: 'zh'
    },
    // 组件模式：'read'（朗读）, 'recite'（背诵）, 'edit'（编辑）
    mode: {
      type: String,
      value: 'read'
    },
    // 难度级别
    difficulty: {
      type: Number,
      value: 1
    },
    // 是否显示特效
    showEffects: {
      type: Boolean,
      value: true
    },
    // 文章ID
    articleId: {
      type: String,
      value: ''
    },
    // 文章标题
    title: {
      type: String,
      value: ''
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    // 记录状态：'idle'（空闲）, 'recording'（录音中）, 'processing'（处理中）
    recordStatus: 'idle',
    // 录音时长
    recordTime: 0,
    // 评估结果
    result: null,
    // 是否显示结果
    showResult: false,
    // 识别出的文本
    recognizedText: '',
    // 是否显示错误
    showError: false,
    // 错误信息
    errorMessage: '',
    // 文本源类型
    textSource: 'predefined', // 'predefined'（预定义）, 'custom'（自定义）
    // 文章对象
    article: null
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      console.log('[text-processor] 组件已加载');
      // 如果提供了articleId，则加载文章
      if (this.properties.articleId) {
        this.loadArticle(this.properties.articleId);
      } else if (this.properties.content) {
        // 如果提供了content，则直接设置
        this.setData({
          article: {
            id: this.properties.articleId || 'custom_' + Date.now(),
            title: this.properties.title || '未命名文章',
            content: this.properties.content,
            language: this.properties.language,
            difficulty: this.properties.difficulty
          },
          textSource: 'custom'
        });
      }
    },
    detached() {
      console.log('[text-processor] 组件已移除');
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 加载文章
     * @param {String} id 文章ID
     */
    loadArticle(id) {
      console.log('[text-processor] 加载文章:', id);
      const app = getApp();
      if (!app) {
        console.error('[text-processor] 无法获取应用实例');
        return;
      }

      let articleData = null;

      // 从全局数据查找文章
      if (app.globalData && app.globalData.articles) {
        articleData = app.globalData.articles.find(article => article.id === id);
      }

      // 如果全局数据中没有找到，则从本地存储查找
      if (!articleData) {
        try {
          const storedArticles = wx.getStorageSync('articles');
          if (storedArticles) {
            articleData = storedArticles.find(article => article.id === id);
          }
        } catch (e) {
          console.error('[text-processor] 从本地存储加载文章失败:', e);
        }
      }

      if (articleData) {
        console.log('[text-processor] 找到文章:', articleData.title);
        this.setData({
          article: articleData,
          textSource: 'predefined'
        });

        // 触发文章加载完成事件
        this.triggerEvent('articleLoaded', articleData);
      } else {
        console.error('[text-processor] 未找到文章:', id);
        this.setData({
          showError: true,
          errorMessage: '未找到指定的文章'
        });
      }
    },

    /**
     * 开始录音
     */
    startRecording() {
      // 调用录音组件的方法
      const recorder = this.selectComponent('#text-recorder');
      if (recorder) {
        recorder.startRecording();
      } else {
        console.error('[text-processor] 未找到录音组件');
      }
    },

    /**
     * 停止录音
     */
    stopRecording() {
      // 调用录音组件的方法
      const recorder = this.selectComponent('#text-recorder');
      if (recorder) {
        recorder.stopRecording();
      } else {
        console.error('[text-processor] 未找到录音组件');
      }
    },

    /**
     * 处理录音结果
     * @param {Object} e 事件对象
     */
    handleRecordResult(e) {
      console.log('[text-processor] 收到录音结果:', e.detail);
      const recognizedText = e.detail.text;
      
      // 设置识别文本
      this.setData({
        recognizedText: recognizedText
      });

      // 根据模式处理结果
      if (this.properties.mode === 'read') {
        this.evaluateReading(this.data.article.content, recognizedText);
      } else if (this.properties.mode === 'recite') {
        this.evaluateRecitation(this.data.article.content, recognizedText);
      }
    },

    /**
     * 评估朗读结果
     * @param {String} originalText 原文
     * @param {String} recognizedText 识别出的文本
     */
    evaluateReading(originalText, recognizedText) {
      console.log('[text-processor] 评估朗读');
      // 调用评估组件的方法
      const evaluator = this.selectComponent('#text-evaluator');
      if (evaluator) {
        const result = evaluator.compareTexts(originalText, recognizedText, this.data.article.language);
        this.handleEvaluationResult(result, 'reading');
      } else {
        console.error('[text-processor] 未找到评估组件');
      }
    },

    /**
     * 评估背诵结果
     * @param {String} originalText 原文
     * @param {String} recognizedText 识别出的文本
     */
    evaluateRecitation(originalText, recognizedText) {
      console.log('[text-processor] 评估背诵');
      // 调用评估组件的方法
      const evaluator = this.selectComponent('#text-evaluator');
      if (evaluator) {
        const result = evaluator.compareTexts(originalText, recognizedText, this.data.article.language);
        this.handleEvaluationResult(result, 'recitation');
      } else {
        console.error('[text-processor] 未找到评估组件');
      }
    },

    /**
     * 处理评估结果
     * @param {Object} result 评估结果
     * @param {String} type 评估类型
     */
    handleEvaluationResult(result, type) {
      console.log('[text-processor] 处理评估结果:', result, type);

      // 设置结果数据
      this.setData({
        result: result,
        showResult: true,
        recordStatus: 'idle'
      }, () => {
        // 如果得分是 100 分且开启了特效，触发特效
        if (result.score === 100 && this.properties.showEffects) {
          this.showPerfectScoreEffects();
        }
      });

      // 保存记录
      this.saveRecord(result, type);
      
      // 触发结果事件
      this.triggerEvent('evaluationComplete', {
        result: result,
        type: type
      });
    },

    /**
     * 显示满分特效
     */
    showPerfectScoreEffects() {
      console.log('[text-processor] 显示满分特效');
      // 调用特效组件的方法
      const effects = this.selectComponent('#text-effects');
      if (effects) {
        effects.showFireworks();
      } else {
        console.error('[text-processor] 未找到特效组件');
      }
    },

    /**
     * 保存记录
     * @param {Object} result 评估结果
     * @param {String} type 记录类型：'reading'（朗读）或 'recitation'（背诵）
     */
    saveRecord(result, type) {
      console.log('[text-processor] 保存记录:', type);
      const app = getApp();
      if (!app || typeof app.addReadingRecord !== 'function') {
        console.error('[text-processor] 无法保存记录，app.addReadingRecord 不可用');
        return;
      }

      // 准备记录数据
      const recordData = {
        articleId: this.data.article.id,
        articleTitle: this.data.article.title,
        score: result.score,
        accuracy: result.accuracy,
        type: type,
        feedbackHtml: result.contentWithErrors,
        recognizedText: this.data.recognizedText
      };

      // 保存记录
      app.addReadingRecord(recordData);
    },

    /**
     * 重试
     */
    tryAgain() {
      this.setData({
        showResult: false,
        recordTime: 0,
        recognizedText: ''
      });
    },

    /**
     * 完成，返回列表
     */
    finish() {
      this.triggerEvent('finish');
    },

    /**
     * 处理录音开始事件
     */
    handleRecordStart() {
      this.setData({
        recordStatus: 'recording',
        showResult: false
      });
    },

    /**
     * 处理录音时间更新
     */
    handleRecordTimeUpdate(e) {
      this.setData({
        recordTime: e.detail.duration
      });
    },

    /**
     * 处理录音停止事件
     */
    handleRecordStop() {
      // 无需处理，识别结果会在handleRecordResult中处理
    },

    /**
     * 处理录音错误
     */
    handleRecordError(e) {
      console.error('[text-processor] 录音错误:', e.detail);
      wx.showToast({
        title: e.detail.errMsg || '录音失败',
        icon: 'none'
      });
      this.setData({
        recordStatus: 'idle'
      });
    }
  }
}); 