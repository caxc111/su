App({
  onLaunch: function () {
    // 初始化应用，加载示例数据
    this.initSampleData();
  },
  
  // 初始化示例数据
  initSampleData: function() {
    console.log('初始化示例数据');
    
    // 示例文章数据
    this.globalData.articles = [
      {
        id: '1',
        title: '小花猫钓鱼',
        language: 'zh',
        level: '初级',
        content: '有一只小花猫，它很喜欢钓鱼。一天，它带着鱼竿来到小河边，准备钓鱼。它找了一个好地方，把鱼饵放在鱼钩上，然后把鱼钩甩到水里。小花猫耐心地等待着，突然，鱼竿动了一下，小花猫赶紧提起鱼竿，一条大鱼上钩了！小花猫高兴地把鱼带回家，和家人一起分享了美味的鱼。',
        createdAt: '2023-05-15'
      },
      {
        id: '2',
        title: 'The Little Red Hen',
        language: 'en',
        level: '中级',
        content: 'Once upon a time, there was a little red hen who lived on a farm. She was friends with a lazy dog, a sleepy cat, and a noisy duck. One day, the little red hen found some wheat seeds. She asked her friends, "Who will help me plant these wheat seeds?" "Not I," said the dog. "Not I," said the cat. "Not I," said the duck. "Then I will do it myself," said the little red hen. And she did.',
        createdAt: '2023-05-20'
      }
    ];
    
    console.log('初始化文章数据:', JSON.stringify(this.globalData.articles));
    
    // 示例奖励数据
    this.globalData.rewards = [
      {
        id: '1',
        type: 'flower',
        count: 5,
        title: '阅读《小花猫钓鱼》',
        date: '2023-05-16'
      },
      {
        id: '2',
        type: 'star',
        count: 3,
        title: '连续学习三天',
        date: '2023-05-18'
      }
    ];
    
    // 示例学习记录
    this.globalData.readingRecords = [
      {
        id: '1',
        articleId: '1',
        articleTitle: '小花猫钓鱼',
        score: 92,
        date: '2023-05-16',
        duration: 120 // 秒
      },
      {
        id: '2',
        articleId: '2',
        articleTitle: 'The Little Red Hen',
        score: 85,
        date: '2023-05-21',
        duration: 180 // 秒
      }
    ];
  },
  
  globalData: {
    articles: [], // 文章列表
    rewards: [],  // 奖励列表
    readingRecords: [] // 阅读记录
  }
})