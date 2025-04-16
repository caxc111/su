/**
 * 日期和时间处理工具函数
 */

/**
 * 格式化日期为YYYY-MM-DD格式
 * @param {Date|number|string} date - 日期对象、时间戳或日期字符串
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date) {
  const d = new Date(date);
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * 格式化时间为HH:MM:SS格式
 * @param {Date|number|string} date - 日期对象、时间戳或日期字符串
 * @returns {string} 格式化后的时间字符串
 */
export function formatTime(date) {
  const d = new Date(date);
  
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * 格式化日期和时间为YYYY-MM-DD HH:MM:SS格式
 * @param {Date|number|string} date - 日期对象、时间戳或日期字符串
 * @returns {string} 格式化后的日期时间字符串
 */
export function formatDateTime(date) {
  return `${formatDate(date)} ${formatTime(date)}`;
}

/**
 * 格式化为友好的时间表示
 * @param {Date|number|string} date - 日期对象、时间戳或日期字符串
 * @returns {string} 友好的时间表示，如"刚刚"，"5分钟前"，"2小时前"等
 */
export function formatFriendlyTime(date) {
  const d = new Date(date);
  const now = new Date();
  
  const diffMs = now - d;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffSec < 60) {
    return '刚刚';
  } else if (diffMin < 60) {
    return `${diffMin}分钟前`;
  } else if (diffHour < 24) {
    return `${diffHour}小时前`;
  } else if (diffDay < 30) {
    return `${diffDay}天前`;
  } else {
    return formatDate(date);
  }
}

/**
 * 获取两个日期之间的天数差
 * @param {Date|number|string} date1 - 第一个日期
 * @param {Date|number|string} date2 - 第二个日期
 * @returns {number} 天数差
 */
export function getDaysBetween(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  // 转换为UTC日期，去除时区影响
  const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
  
  // 计算天数差（1天 = 24 * 60 * 60 * 1000毫秒）
  const diffDays = Math.floor((utc2 - utc1) / (24 * 60 * 60 * 1000));
  
  return Math.abs(diffDays);
}

/**
 * 将秒数转换为MM:SS格式
 * @param {number} seconds - 秒数
 * @returns {string} MM:SS格式的时间
 */
export function formatSeconds(seconds) {
  if (!seconds && seconds !== 0) return '00:00';
  
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

/**
 * 获取当前日期是星期几
 * @param {Date|number|string} date - 日期对象、时间戳或日期字符串
 * @returns {string} 星期几（星期一至星期日）
 */
export function getDayOfWeek(date) {
  const d = new Date(date);
  const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  
  return weekDays[d.getDay()];
}

/**
 * 获取当月的天数
 * @param {number} year - 年份
 * @param {number} month - 月份（1-12）
 * @returns {number} 当月天数
 */
export function getDaysInMonth(year, month) {
  // 月份需要减1，因为Date对象的月份是从0开始的
  return new Date(year, month, 0).getDate();
}

/**
 * 检查是否为同一天
 * @param {Date|number|string} date1 - 第一个日期
 * @param {Date|number|string} date2 - 第二个日期
 * @returns {boolean} 是否为同一天
 */
export function isSameDay(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
} 
 * 日期和时间处理工具函数
 */

/**
 * 格式化日期为YYYY-MM-DD格式
 * @param {Date|number|string} date - 日期对象、时间戳或日期字符串
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date) {
  const d = new Date(date);
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * 格式化时间为HH:MM:SS格式
 * @param {Date|number|string} date - 日期对象、时间戳或日期字符串
 * @returns {string} 格式化后的时间字符串
 */
export function formatTime(date) {
  const d = new Date(date);
  
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * 格式化日期和时间为YYYY-MM-DD HH:MM:SS格式
 * @param {Date|number|string} date - 日期对象、时间戳或日期字符串
 * @returns {string} 格式化后的日期时间字符串
 */
export function formatDateTime(date) {
  return `${formatDate(date)} ${formatTime(date)}`;
}

/**
 * 格式化为友好的时间表示
 * @param {Date|number|string} date - 日期对象、时间戳或日期字符串
 * @returns {string} 友好的时间表示，如"刚刚"，"5分钟前"，"2小时前"等
 */
export function formatFriendlyTime(date) {
  const d = new Date(date);
  const now = new Date();
  
  const diffMs = now - d;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffSec < 60) {
    return '刚刚';
  } else if (diffMin < 60) {
    return `${diffMin}分钟前`;
  } else if (diffHour < 24) {
    return `${diffHour}小时前`;
  } else if (diffDay < 30) {
    return `${diffDay}天前`;
  } else {
    return formatDate(date);
  }
}

/**
 * 获取两个日期之间的天数差
 * @param {Date|number|string} date1 - 第一个日期
 * @param {Date|number|string} date2 - 第二个日期
 * @returns {number} 天数差
 */
export function getDaysBetween(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  // 转换为UTC日期，去除时区影响
  const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
  
  // 计算天数差（1天 = 24 * 60 * 60 * 1000毫秒）
  const diffDays = Math.floor((utc2 - utc1) / (24 * 60 * 60 * 1000));
  
  return Math.abs(diffDays);
}

/**
 * 将秒数转换为MM:SS格式
 * @param {number} seconds - 秒数
 * @returns {string} MM:SS格式的时间
 */
export function formatSeconds(seconds) {
  if (!seconds && seconds !== 0) return '00:00';
  
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

/**
 * 获取当前日期是星期几
 * @param {Date|number|string} date - 日期对象、时间戳或日期字符串
 * @returns {string} 星期几（星期一至星期日）
 */
export function getDayOfWeek(date) {
  const d = new Date(date);
  const weekDays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  
  return weekDays[d.getDay()];
}

/**
 * 获取当月的天数
 * @param {number} year - 年份
 * @param {number} month - 月份（1-12）
 * @returns {number} 当月天数
 */
export function getDaysInMonth(year, month) {
  // 月份需要减1，因为Date对象的月份是从0开始的
  return new Date(year, month, 0).getDate();
}

/**
 * 检查是否为同一天
 * @param {Date|number|string} date1 - 第一个日期
 * @param {Date|number|string} date2 - 第二个日期
 * @returns {boolean} 是否为同一天
 */
export function isSameDay(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
} 
 