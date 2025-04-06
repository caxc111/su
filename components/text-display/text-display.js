// components/text-display/text-display.js
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
    // 模式：'read'（朗读）, 'recite'（背诵）, 'edit'（编辑）
    mode: {
      type: String,
      value: 'read'
    },
    // 字体大小
    fontSize: {
      type: Number,
      value: 16
    },
    // 行高
    lineHeight: {
      type: Number,
      value: 1.8
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    // 是否显示完整内容（背诵模式下可切换）
    showFullContent: true,
    // 计算后的文本样式
    textStyle: '',
    // 分段后的文本（用于更好的展示和交互）
    textSegments: []
  },

  // 生命周期
  lifetimes: {
    attached() {
      this.processText();
      this.updateTextStyle();
    }
  },

  // 监听器
  observers: {
    'content, language, mode': function(content, language, mode) {
      // 当内容、语言或模式变化时，重新处理文本
      this.processText();
      // 如果切换到背诵模式，默认显示完整内容
      if (mode === 'recite') {
        this.setData({ showFullContent: true });
      }
    },
    'fontSize, lineHeight': function(fontSize, lineHeight) {
      // 当字体大小或行高变化时，更新文本样式
      this.updateTextStyle();
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 处理文本，根据语言和模式进行不同的处理
     */
    processText() {
      const { content, language } = this.properties;
      if (!content) {
        this.setData({ textSegments: [] });
        return;
      }

      let segments = [];
      if (language === 'zh') {
        // 中文文本，按标点符号分段
        segments = content.split(/([，。！？；：""''【】（）、])/g).filter(Boolean);
      } else {
        // 英文文本，按句子分段
        segments = content.split(/([.!?;:]+\s*)/g).filter(Boolean);
      }

      this.setData({ textSegments: segments });
    },

    /**
     * 更新文本样式
     */
    updateTextStyle() {
      const { fontSize, lineHeight } = this.properties;
      const textStyle = `font-size: ${fontSize}px; line-height: ${lineHeight};`;
      this.setData({ textStyle });
    },

    /**
     * 切换显示完整内容（背诵模式下使用）
     */
    toggleContentDisplay() {
      if (this.properties.mode === 'recite') {
        this.setData({ showFullContent: !this.data.showFullContent });
      }
    },

    /**
     * 处理点击事件
     */
    handleTap() {
      // 触发点击事件，让父组件处理
      this.triggerEvent('tap');
    }
  }
}) 