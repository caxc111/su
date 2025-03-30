/**
 * 语音识别工具函数
 * 实际项目中应使用云函数或调用第三方API
 * 这里提供一个模拟实现
 */

// 模拟语音识别结果
function mockSpeechRecognition(audioFile, language) {
  return new Promise((resolve, reject) => {
    // 模拟处理时间
    setTimeout(() => {
      // 模拟成功率
      if (Math.random() > 0.1) {
        // 模拟识别结果
        const mockTexts = {
          zh: '有一只小花猫，它很喜欢钓鱼。一天，它带着鱼竿来到小河边，准备钓鱼。',
          en: 'Once upon a time, there was a little red hen who lived on a farm.'
        };
        
        resolve({
          success: true,
          text: mockTexts[language] || '模拟识别结果'
        });
      } else {
        // 模拟失败
        reject(new Error('语音识别失败'));
      }
    }, 1500);
  });
}

module.exports = {
  recognize: mockSpeechRecognition
};