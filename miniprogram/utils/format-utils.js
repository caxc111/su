/**
 * 格式化工具函数
 */

/**
 * 格式化数字为带千分位的格式
 * @param {number} num - 需要格式化的数字
 * @returns {string} 格式化后的字符串
 */
export function formatNumber(num) {
  if (num === undefined || num === null) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 格式化数字为指定小数位的格式
 * @param {number} num - 需要格式化的数字
 * @param {number} digits - 小数位数，默认为2
 * @returns {string} 格式化后的字符串
 */
export function formatDecimal(num, digits = 2) {
  if (num === undefined || num === null) return '0.00';
  return Number(num).toFixed(digits);
}

/**
 * 格式化文件大小
 * @param {number} bytes - 文件大小（字节）
 * @returns {string} 格式化后的文件大小，如 1.5KB, 2.3MB
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

/**
 * 格式化手机号码（隐藏中间4位）
 * @param {string} phone - 手机号码
 * @returns {string} 格式化后的手机号码，如 138****1234
 */
export function formatPhoneNumber(phone) {
  if (!phone || phone.length !== 11) return phone;
  return `${phone.substring(0, 3)}****${phone.substring(7)}`;
}

/**
 * 格式化身份证号（隐藏中间部分）
 * @param {string} idCard - 身份证号
 * @returns {string} 格式化后的身份证号，如 1101****1234
 */
export function formatIdCard(idCard) {
  if (!idCard || idCard.length < 10) return idCard;
  return `${idCard.substring(0, 4)}****${idCard.substring(idCard.length - 4)}`;
}

/**
 * 格式化姓名（中间字用*代替）
 * @param {string} name - 姓名
 * @returns {string} 格式化后的姓名，如 张*明
 */
export function formatName(name) {
  if (!name || name.length < 2) return name;
  
  if (name.length === 2) {
    return `${name[0]}*`;
  }
  
  const firstChar = name[0];
  const lastChar = name[name.length - 1];
  const middleStars = '*'.repeat(name.length - 2);
  
  return `${firstChar}${middleStars}${lastChar}`;
}

/**
 * 格式化金额（元为单位，带千分位和两位小数）
 * @param {number} amount - 金额数值
 * @returns {string} 格式化后的金额，如 ¥1,234.56
 */
export function formatCurrency(amount) {
  if (amount === undefined || amount === null) return '¥0.00';
  
  const num = parseFloat(amount);
  return `¥${num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
}

/**
 * 格式化百分比
 * @param {number} value - 小数值（如0.12）
 * @param {number} digits - 小数位数，默认为2
 * @returns {string} 格式化后的百分比，如 12.00%
 */
export function formatPercent(value, digits = 2) {
  if (value === undefined || value === null) return '0%';
  
  const percentage = value * 100;
  return `${percentage.toFixed(digits)}%`;
}

/**
 * 格式化评分（转换为星级表示）
 * @param {number} score - 评分（0-5）
 * @returns {string} 星级表示，如 ★★★☆☆
 */
export function formatRating(score) {
  if (score === undefined || score === null) return '☆☆☆☆☆';
  
  const fullStars = Math.floor(score);
  const emptyStars = 5 - fullStars;
  
  return '★'.repeat(fullStars) + '☆'.repeat(emptyStars);
}

/**
 * 转换HTML特殊字符
 * @param {string} str - 包含HTML特殊字符的字符串
 * @returns {string} 转换后的字符串
 */
export function escapeHtml(str) {
  if (!str) return '';
  
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
} 
 * 格式化工具函数
 */

/**
 * 格式化数字为带千分位的格式
 * @param {number} num - 需要格式化的数字
 * @returns {string} 格式化后的字符串
 */
export function formatNumber(num) {
  if (num === undefined || num === null) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 格式化数字为指定小数位的格式
 * @param {number} num - 需要格式化的数字
 * @param {number} digits - 小数位数，默认为2
 * @returns {string} 格式化后的字符串
 */
export function formatDecimal(num, digits = 2) {
  if (num === undefined || num === null) return '0.00';
  return Number(num).toFixed(digits);
}

/**
 * 格式化文件大小
 * @param {number} bytes - 文件大小（字节）
 * @returns {string} 格式化后的文件大小，如 1.5KB, 2.3MB
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

/**
 * 格式化手机号码（隐藏中间4位）
 * @param {string} phone - 手机号码
 * @returns {string} 格式化后的手机号码，如 138****1234
 */
export function formatPhoneNumber(phone) {
  if (!phone || phone.length !== 11) return phone;
  return `${phone.substring(0, 3)}****${phone.substring(7)}`;
}

/**
 * 格式化身份证号（隐藏中间部分）
 * @param {string} idCard - 身份证号
 * @returns {string} 格式化后的身份证号，如 1101****1234
 */
export function formatIdCard(idCard) {
  if (!idCard || idCard.length < 10) return idCard;
  return `${idCard.substring(0, 4)}****${idCard.substring(idCard.length - 4)}`;
}

/**
 * 格式化姓名（中间字用*代替）
 * @param {string} name - 姓名
 * @returns {string} 格式化后的姓名，如 张*明
 */
export function formatName(name) {
  if (!name || name.length < 2) return name;
  
  if (name.length === 2) {
    return `${name[0]}*`;
  }
  
  const firstChar = name[0];
  const lastChar = name[name.length - 1];
  const middleStars = '*'.repeat(name.length - 2);
  
  return `${firstChar}${middleStars}${lastChar}`;
}

/**
 * 格式化金额（元为单位，带千分位和两位小数）
 * @param {number} amount - 金额数值
 * @returns {string} 格式化后的金额，如 ¥1,234.56
 */
export function formatCurrency(amount) {
  if (amount === undefined || amount === null) return '¥0.00';
  
  const num = parseFloat(amount);
  return `¥${num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
}

/**
 * 格式化百分比
 * @param {number} value - 小数值（如0.12）
 * @param {number} digits - 小数位数，默认为2
 * @returns {string} 格式化后的百分比，如 12.00%
 */
export function formatPercent(value, digits = 2) {
  if (value === undefined || value === null) return '0%';
  
  const percentage = value * 100;
  return `${percentage.toFixed(digits)}%`;
}

/**
 * 格式化评分（转换为星级表示）
 * @param {number} score - 评分（0-5）
 * @returns {string} 星级表示，如 ★★★☆☆
 */
export function formatRating(score) {
  if (score === undefined || score === null) return '☆☆☆☆☆';
  
  const fullStars = Math.floor(score);
  const emptyStars = 5 - fullStars;
  
  return '★'.repeat(fullStars) + '☆'.repeat(emptyStars);
}

/**
 * 转换HTML特殊字符
 * @param {string} str - 包含HTML特殊字符的字符串
 * @returns {string} 转换后的字符串
 */
export function escapeHtml(str) {
  if (!str) return '';
  
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
} 
 