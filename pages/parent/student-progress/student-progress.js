Page({
  data: {
    students: [
      { id: '1', nickName: '小明' },
      { id: '2', nickName: '小红' }
    ],
    currentStudentIndex: 0,
    progressData: {
      totalReadings: 18,
      articlesRead: 8,
      averageScore: 85.6,
      totalFlowers: 15
    },
    recentActivities: [
      {
        _id: '1',
        title: '小猫钓鱼',
        score: 96,
        flowerCount: 3,
        dateStr: '2023-5-15 14:30'
      },
      {
        _id: '2',
        title: 'The Little Red Hen',
        score: 92,
        flowerCount: 2,
        dateStr: '2023-5-13 16:45'
      },
      {
        _id: '3',
        title: '小红帽',
        score: 85,
        flowerCount: 2,
        dateStr: '2023-5-10 09:15'
      }
    ]
  },
  
  onLoad() {
    // 实际项目中，这里会从数据库加载数据
  },
  
  onStudentChange(e) {
    const index = e.detail.value;
    this.setData({
      currentStudentIndex: index
    });
    
    // 模拟加载不同学生的数据
    if (index === 1) {
      this.setData({
        progressData: {
          totalReadings: 12,
          articlesRead: 5,
          averageScore: 78.9,
          totalFlowers: 8
        },
        recentActivities: [
          {
            _id: '4',
            title: '小红帽',
            score: 80,
            flowerCount: 1,
            dateStr: '2023-5-14 10:20'
          },
          {
            _id: '5',
            title: '小猫钓鱼',
            score: 75,
            flowerCount: 1,
            dateStr: '2023-5-12 11:30'
          }
        ]
      });
    } else {
      this.setData({
        progressData: {
          totalReadings: 18,
          articlesRead: 8,
          averageScore: 85.6,
          totalFlowers: 15
        },
        recentActivities: [
          {
            _id: '1',
            title: '小猫钓鱼',
            score: 96,
            flowerCount: 3,
            dateStr: '2023-5-15 14:30'
          },
          {
            _id: '2',
            title: 'The Little Red Hen',
            score: 92,
            flowerCount: 2,
            dateStr: '2023-5-13 16:45'
          },
          {
            _id: '3',
            title: '小红帽',
            score: 85,
            flowerCount: 2,
            dateStr: '2023-5-10 09:15'
          }
        ]
      });
    }
  }
});