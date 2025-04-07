Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    },
    grade: {
      type: String,
      value: ''
    },
    semester: {
      type: String,
      value: ''
    }
  },

  data: {
    texts: []
  },

  observers: {
    'grade, semester': function(grade, semester) {
      if (grade && semester) {
        this.loadTexts(grade, semester);
      }
    }
  },

  methods: {
    loadTexts(grade, semester) {
      const app = getApp();
      const texts = app.globalData.presetTexts?.[grade]?.[semester] || [];
      this.setData({ texts });
    },

    selectText(e) {
      const { index } = e.currentTarget.dataset;
      const text = this.data.texts[index];
      this.triggerEvent('select', { text });
    }
  }
}); 