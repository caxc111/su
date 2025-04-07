Page({
  data: {
    students: [],
    currentStudentIndex: 0,
    progressData: {
      totalReadings: 0,
      articlesRead: 0,
      averageScore: 0,
      totalFlowers: 0
    },
    recentActivities: []
  },
  
  onLoad() {
    // 实际项目中，这里会从数据库加载数据
  },
  
  onStudentChange(e) {
    const index = e.detail.value;
    this.setData({
      currentStudentIndex: index
    });
    // 实际项目中，这里会根据选择的学生从数据库加载数据
  }
});