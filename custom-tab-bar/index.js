Component({
  data: {
    selected: 0,
    color: "#7A7E83",
    selectedColor: "#FF9F0A",
    backgroundColor: "#ffffff",
    list: [{
      "pagePath": "/pages/student/article-list/article-list",
      "text": "阅读",
      "iconPath": "/images/icon-read.png",
      "selectedIconPath": "/images/icon-read-active.png"
    }, {
      "pagePath": "/pages/student/reward-wall/reward-wall",
      "text": "奖励墙",
      "iconPath": "/images/icon-reward.png",
      "selectedIconPath": "/images/icon-reward-active.png"
    }],
    parentList: [{
      "pagePath": "/pages/parent/article-manage/article-manage",
      "text": "文章",
      "iconPath": "/images/icon-article.png",
      "selectedIconPath": "/images/icon-article-active.png"
    }, {
      "pagePath": "/pages/parent/student-progress/student-progress",
      "text": "进度",
      "iconPath": "/images/icon-progress.png",
      "selectedIconPath": "/images/icon-progress-active.png"
    }],
    role: 'student' // 默认角色为学生
  },
  lifetimes: {
    attached: function() {
      // 获取当前角色
      const app = getApp();
      if (app.globalData && app.globalData.userRole) {
        this.setData({
          role: app.globalData.userRole
        });
      }
      
      // 监听角色变化
      wx.eventCenter.on('roleChanged', (role) => {
        this.setData({
          role: role
        });
      });
      
      // 获取当前页面
      const pages = getCurrentPages();
      const currentPage = pages[pages.length - 1];
      const route = '/' + currentPage.route;
      
      // 设置选中的tab
      const tabList = this.data.role === 'student' ? this.data.list : this.data.parentList;
      const selected = tabList.findIndex(item => item.pagePath === route);
      
      if (selected !== -1) {
        this.setData({
          selected: selected
        });
      }
    }
  },
  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset;
      const url = data.path;
      
      // 切换到对应页面
      wx.switchTab({
        url
      });
      
      this.setData({
        selected: data.index
      });
    }
  }
});