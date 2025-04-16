Component({
  properties: {
    // 按钮文本
    text: {
      type: String,
      value: ''
    },
    // 按钮类型：primary(绿色)、secondary(白色)
    type: {
      type: String,
      value: 'primary'
    },
    // 是否禁用
    disabled: {
      type: Boolean,
      value: false
    },
    // 是否显示加载状态
    loading: {
      type: Boolean,
      value: false
    },
    // 左侧图标
    icon: {
      type: String,
      value: ''
    }
  },

  methods: {
    handleTap() {
      if (this.data.disabled || this.data.loading) return
      this.triggerEvent('tap')
    }
  }
}) 