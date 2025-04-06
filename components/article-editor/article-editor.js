Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 是否显示编辑器
    visible: {
      type: Boolean,
      value: false
    },
    // 是否处于编辑模式（否则为添加模式）
    isEditing: {
      type: Boolean,
      value: false
    },
    // 编辑的文章数据
    article: {
      type: Object,
      value: {
        title: '',
        language: 'zh',
        content: ''
      }
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    formData: {
      title: '',
      language: 'zh',
      content: ''
    }
  },

  /**
   * 数据监听器
   */
  observers: {
    'article, visible': function(article, visible) {
      if (visible) {
        this.setData({
          formData: {
            title: article.title || '',
            language: article.language || 'zh',
            content: article.content || ''
          }
        });
        console.log('文章编辑器初始化数据:', JSON.stringify(this.data.formData));
      }
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 取消操作
    handleCancel() {
      // 触发取消事件
      this.triggerEvent('cancel');
    },

    // 保存文章
    handleSave() {
      const { title, language, content } = this.data.formData;
      
      // 基本表单验证
      if (!title || !content) {
        wx.showToast({
          title: '请填写完整信息',
          icon: 'none'
        });
        return;
      }
      
      // 触发保存事件，将表单数据传给父组件
      this.triggerEvent('save', {
        title,
        language,
        content
      });
    },

    // 标题输入处理
    onInputTitle(e) {
      this.setData({
        'formData.title': e.detail.value
      });
    },

    // 语言选择处理
    onSelectLang(e) {
      this.setData({
        'formData.language': e.detail.value
      });
    },

    // 内容输入处理
    onInputContent(e) {
      this.setData({
        'formData.content': e.detail.value
      });
    },

    // 点击遮罩层关闭
    onTapMask() {
      this.handleCancel();
    },

    // 阻止冒泡，防止点击内容区域关闭弹窗
    stopPropagation() {
      return false;
    }
  }
}) 