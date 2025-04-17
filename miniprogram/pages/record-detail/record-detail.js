// record-detail.js - 练习记录详情页
const app = getApp();
import { formatTime, getScoreLevel } from '../../utils/constant';

Page({
  // 页面的初始数据
  data: {
    record: null,            // 当前查看的记录
    loading: true,           // 加载状态
    scoreClass: '',          // 分数的样式类
    dateFormatted: '',       // 格式化后的日期
    practiceTypeText: '',    // 练习类型文本
    similarityPercent: 0,    // 相似度百分比
    audioPlaying: false,     // 音频播放状态
    audioPlayingType: 'none', // 正在播放的音频类型：original/recognized/none
    compareVisible: false    // 对比分析是否可见
  },

  // 生命周期函数--监听页面加载
  onLoad: function (options) {
    // 获取记录ID
    const recordId = options.id;
    if (!recordId) {
      this.showError('未找到记录ID');
      return;
    }

    // 加载记录详情
    this.loadRecordDetail(recordId);
  },

  // 页面卸载时清理资源
  onUnload: function () {
    this.stopAllAudio();
  },

  // 加载记录详情
  loadRecordDetail: function (recordId) {
    this.setData({ loading: true });

    try {
      // 从存储中获取所有记录
      const allRecords = wx.getStorageSync('practiceRecords') || [];
      
      // 查找指定ID的记录
      const record = allRecords.find(item => item.id === recordId);
      
      if (!record) {
        this.showError('未找到对应的记录');
        return;
      }
      
      // 获取分数样式类
      const scoreClass = this.getScoreClass(record.score);
      
      // 格式化日期
      const dateFormatted = formatTime(record.timestamp);
      
      // 格式化练习类型
      const practiceTypeText = record.practiceType === 'read' ? '朗读' : '背诵';
      
      // 计算相似度百分比
      const similarityPercent = Math.round(record.similarity);
      
      // 更新页面数据
      this.setData({
        record,
        loading: false,
        scoreClass,
        dateFormatted,
        practiceTypeText,
        similarityPercent
      });

      // 设置导航栏标题
      wx.setNavigationBarTitle({
        title: '记录详情'
      });
    } catch (error) {
      console.error('加载记录详情失败', error);
      this.showError('加载记录详情失败');
    }
  },

  // 根据分数获取样式类
  getScoreClass: function(score) {
    if (score >= 90) return 'score-excellent';
    if (score >= 75) return 'score-good';
    if (score >= 60) return 'score-average';
    return 'score-poor';
  },

  // 播放原文语音
  playOriginalAudio: function() {
    if (this.data.audioPlaying && this.data.audioPlayingType === 'original') {
      // 如果当前正在播放原文，则停止播放
      this.stopAllAudio();
      return;
    }
    
    // 停止所有正在播放的音频
    this.stopAllAudio();
    
    // 获取语音服务
    const speechService = app.getSpeechService();
    
    if (!speechService) {
      wx.showToast({
        title: '语音服务不可用',
        icon: 'none'
      });
      return;
    }
    
    // 更新播放状态
    this.setData({
      audioPlaying: true,
      audioPlayingType: 'original'
    });
    
    // 使用文本转语音播放原文，使用1.0的正常语速
    const speechRate = 1.0;
    speechService.textToSpeech(this.data.record.originalText, speechRate)
      .then(filePath => {
        return speechService.playAudio(filePath, () => {
          // 播放结束回调
          this.setData({
            audioPlaying: false,
            audioPlayingType: 'none'
          });
        });
      })
      .catch(error => {
        console.error('播放原文失败', error);
        wx.showToast({
          title: '播放失败',
          icon: 'none'
        });
        
        this.setData({
          audioPlaying: false,
          audioPlayingType: 'none'
        });
      });
  },

  // 播放识别文本语音
  playRecognizedAudio: function() {
    if (this.data.audioPlaying && this.data.audioPlayingType === 'recognized') {
      // 如果当前正在播放识别文本，则停止播放
      this.stopAllAudio();
      return;
    }
    
    // 停止所有正在播放的音频
    this.stopAllAudio();
    
    // 获取语音服务
    const speechService = app.getSpeechService();
    
    if (!speechService) {
      wx.showToast({
        title: '语音服务不可用',
        icon: 'none'
      });
      return;
    }
    
    // 更新播放状态
    this.setData({
      audioPlaying: true,
      audioPlayingType: 'recognized'
    });
    
    // 使用文本转语音播放识别文本，使用1.0的正常语速
    const speechRate = 1.0;
    speechService.textToSpeech(this.data.record.recognizedText, speechRate)
      .then(filePath => {
        return speechService.playAudio(filePath, () => {
          // 播放结束回调
          this.setData({
            audioPlaying: false,
            audioPlayingType: 'none'
          });
        });
      })
      .catch(error => {
        console.error('播放识别文本失败', error);
        wx.showToast({
          title: '播放失败',
          icon: 'none'
        });
        
        this.setData({
          audioPlaying: false,
          audioPlayingType: 'none'
        });
      });
  },

  // 停止所有音频播放
  stopAllAudio: function() {
    // 获取语音服务
    const speechService = app.getSpeechService();
    
    if (speechService && this.data.audioPlaying) {
      speechService.stopAudio();
      
      this.setData({
        audioPlaying: false,
        audioPlayingType: 'none'
      });
    }
  },

  // 切换对比分析的显示状态
  toggleCompare: function() {
    this.setData({
      compareVisible: !this.data.compareVisible
    });
  },

  // 返回列表页
  goBack: function() {
    wx.navigateBack();
  },

  // 删除记录
  deleteRecord: function() {
    wx.showModal({
      title: '删除记录',
      content: '确定要删除这条练习记录吗？删除后不可恢复。',
      confirmColor: '#f44336',
      success: (res) => {
        if (res.confirm) {
          // 获取存储的所有记录
          const allRecords = wx.getStorageSync('practiceRecords') || [];
          
          // 过滤掉要删除的记录
          const updatedRecords = allRecords.filter(record => record.id !== this.data.record.id);
          
          // 更新存储
          wx.setStorageSync('practiceRecords', updatedRecords);
          
          // 显示删除成功提示
          wx.showToast({
            title: '删除成功',
            icon: 'success',
            duration: 1500
          });
          
          // 返回列表页
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        }
      }
    });
  },

  // 分享
  onShareAppMessage: function () {
    if (!this.data.record) {
      return {
        title: '顺口成章 - 练习记录',
        path: '/pages/record/record'
      };
    }
    
    return {
      title: `我在「顺口成章」${this.data.practiceTypeText}练习中获得了${this.data.record.score}分`,
      path: `/pages/record-detail/record-detail?id=${this.data.record.id}`
    };
  },

  // 显示错误信息
  showError: function(message) {
    this.setData({
      loading: false
    });
    
    wx.showToast({
      title: message,
      icon: 'none',
      duration: 2000
    });
    
    // 2秒后返回上一页
    setTimeout(() => {
      wx.navigateBack();
    }, 2000);
  }
}); 