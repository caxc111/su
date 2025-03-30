Page({
  data: {
    totalFlowers: 12,
    readingStats: {
      totalCount: 18,
      perfectCount: 5,
      averageScore: 85.6,
      articleCount: 8
    },
    recentReadings: [
      {
        _id: '1',
        title: '小猫钓鱼',
        score: 96,
        flowerCount: 3,
        createTime: '5月15日 14:30'
      },
      {
        _id: '2',
        title: 'The Little Red Hen',
        score: 92,
        flowerCount: 2,
        createTime: '5月13日 16:45'
      },
      {
        _id: '3',
        title: '小红帽',
        score: 85,
        flowerCount: 2,
        createTime: '5月10日 09:15'
      }
    ]
  },
  
  onLoad() {
    // 实际应用中这里会加载真实数据
  }
});