Page({
  data: {
    article: {},
    recordStatus: 'idle', // idle, recording, processing
    recordTime: 0,
    showResult: false,
    recordTimer: null,
    readingResult: {
      score: 0,
      flowers: [],
      feedback: '',
      correctWords: 0,
      totalWords: 0,
      accuracy: 0
    }
  },
  
  onLoad(options) {
    const id = options.id;
    this.loadArticle(id);
  },
  
  onUnload() {
    // 清除计时器
    if (this.data.recordTimer) {
      clearInterval(this.data.recordTimer);
    }
  },
  
  loadArticle(id) {
    // 模拟加载文章
    const mockArticles = [
      {
        _id: '1',
        title: '小猫钓鱼',
        content: '有一只小花猫，它很喜欢钓鱼。一天，它带着鱼竿来到小河边，准备钓鱼。它找到一个好地方，安静地坐下来，把鱼饵放到鱼钩上，再把鱼钩抛到水里。小猫耐心地等待着，眼睛紧盯着水面。突然，鱼竿动了一下，小猫赶紧拉起鱼竿，一条小鱼被钓了上来。小猫高兴极了，它决定把小鱼带回家，给妈妈做一顿美味的晚餐。',
        language: 'zh',
        wordCount: 100
      },
      {
        _id: '2',
        title: 'The Little Red Hen',
        content: 'Once upon a time, there was a little red hen who lived on a farm. She was friends with a lazy dog, a sleepy cat, and a noisy duck. One day, the little red hen found some wheat seeds on the ground. "Who will help me plant these wheat seeds?" asked the little red hen. "Not I," said the dog. "Not I," said the cat. "Not I," said the duck. "Then I will do it myself," said the little red hen. And she did.',
        language: 'en',
        wordCount: 84
      },
      {
        _id: '3',
        title: '小红帽',
        content: '从前，有一个可爱的小姑娘，她总是戴着奶奶送给她的红色小帽子，所以大家都叫她"小红帽"。一天，妈妈对小红帽说："奶奶生病了，这里有一些蛋糕和葡萄酒，你去看望奶奶吧。"小红帽很高兴能去看望奶奶，她背上小篮子就出发了。奶奶住在森林里的小木屋中，小红帽必须穿过森林才能到达奶奶家。',
        language: 'zh',
        wordCount: 90
      },
      {
        _id: '4',
        title: 'The Ant and the Grasshopper',
        content: 'In a field one summer\'s day a Grasshopper was hopping about, chirping and singing to its heart\'s content. An Ant passed by, bearing along with great effort an ear of corn he was taking to the nest. "Why not come and chat with me," said the Grasshopper, "instead of toiling in that way?" "I am helping to lay up food for the winter," said the Ant, "and recommend you to do the same." "Why bother about winter?" said the Grasshopper; "we have plenty of food at present."',
        language: 'en',
        wordCount: 87
      }
    ];
    
    const article = mockArticles.find(item => item._id === id) || mockArticles[0];
    
    this.setData({
      article: article
    });
  },
  
  toggleRecording() {
    if (this.data.recordStatus === 'idle') {
      this.startRecording();
    } else if (this.data.recordStatus === 'recording') {
      this.stopRecording();
    }
  },
  
  startRecording() {
    // 在实际项目中，应使用微信小程序的录音API
    // 这里模拟录音过程
    this.setData({
      recordStatus: 'recording',
      recordTime: 0
    });
    
    // 设置计时器
    const timer = setInterval(() => {
      this.setData({
        recordTime: this.data.recordTime + 1
      });
      
      // 模拟最长录音时间，30秒后自动停止
      if (this.data.recordTime >= 30) {
        this.stopRecording();
      }
    }, 1000);
    
    this.setData({
      recordTimer: timer
    });
  },
  
  stopRecording() {
    // 停止计时器
    clearInterval(this.data.recordTimer);
    
    // 模拟处理过程
    this.setData({
      recordStatus: 'processing'
    });
    
    // 模拟评分过程
    setTimeout(() => {
      // 生成模拟评分结果
      const accuracy = Math.floor(Math.random() * 31) + 70; // 70-100之间的随机数
      const totalWords = this.data.article.language === 'zh' ? 
        this.data.article.content.length : 
        this.data.article.content.split(/\s+/).length;
      const correctWords = Math.floor(totalWords * accuracy / 100);
      const flowerCount = this.calculateFlowers(accuracy);
      
      this.setData({
        readingResult: {
          score: accuracy,
          flowers: new Array(flowerCount),
          feedback: this.generateFeedback(accuracy),
          correctWords: correctWords,
          totalWords: totalWords,
          accuracy: accuracy
        },
        showResult: true,
        recordStatus: 'idle'
      });
    }, 2000);
  },
  
  calculateFlowers(accuracy) {
    if (accuracy >= 95) {
      return 3;
    } else if (accuracy >= 85) {
      return 2;
    } else if (accuracy >= 75) {
      return 1;
    }
    return 0;
  },
  
  generateFeedback(accuracy) {
    if (accuracy >= 95) {
      return "太棒了！你的朗读非常流利准确！";
    } else if (accuracy >= 85) {
      return "很好！继续练习，你会更加出色！";
    } else if (accuracy >= 75) {
      return "不错的尝试！再多练习几次吧！";
    } else if (accuracy >= 60) {
      return "加油！多读几遍可以做得更好哦！";
    } else {
      return "继续努力，慢慢朗读，注意每个字的发音！";
    }
  },
  
  tryAgain() {
    this.setData({
      showResult: false
    });
  },
  
  finishReading() {
    wx.navigateBack();
  }
});