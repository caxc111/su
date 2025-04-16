/**
 * HTTP请求工具 - 封装微信网络请求API
 */

// API基础URL
const BASE_URL = 'https://api.example.com';

/**
 * 发起GET请求
 * @param {string} url - 请求路径
 * @param {object} params - 请求参数
 * @param {object} header - 请求头
 * @returns {Promise<any>} 响应数据
 */
export function get(url, params = {}, header = {}) {
  return request(url, 'GET', params, header);
}

/**
 * 发起POST请求
 * @param {string} url - 请求路径
 * @param {object} data - 请求数据
 * @param {object} header - 请求头
 * @returns {Promise<any>} 响应数据
 */
export function post(url, data = {}, header = {}) {
  return request(url, 'POST', data, header);
}

/**
 * 发起PUT请求
 * @param {string} url - 请求路径
 * @param {object} data - 请求数据
 * @param {object} header - 请求头
 * @returns {Promise<any>} 响应数据
 */
export function put(url, data = {}, header = {}) {
  return request(url, 'PUT', data, header);
}

/**
 * 发起DELETE请求
 * @param {string} url - 请求路径
 * @param {object} data - 请求数据
 * @param {object} header - 请求头
 * @returns {Promise<any>} 响应数据
 */
export function del(url, data = {}, header = {}) {
  return request(url, 'DELETE', data, header);
}

/**
 * 通用请求方法
 * @param {string} url - 请求路径
 * @param {string} method - 请求方法
 * @param {object} data - 请求数据/参数
 * @param {object} header - 请求头
 * @returns {Promise<any>} 响应数据
 */
function request(url, method, data = {}, header = {}) {
  const token = wx.getStorageSync('token');
  const fullUrl = url.startsWith('http') ? url : BASE_URL + url;
  
  // 构造请求头
  const headers = {
    'Content-Type': 'application/json',
    ...header
  };
  
  // 如果有token，添加到请求头
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // 处理GET请求的参数
  let requestData = data;
  if (method === 'GET' && Object.keys(data).length > 0) {
    const queryString = Object.keys(data)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
      .join('&');
    url = `${fullUrl}${fullUrl.includes('?') ? '&' : '?'}${queryString}`;
    requestData = {};
  } else {
    url = fullUrl;
  }
  
  // 返回Promise
  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method,
      data: requestData,
      header: headers,
      success: (response) => {
        // 处理成功响应
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(response.data);
        } else {
          // 处理HTTP错误
          handleHttpError(response, reject);
        }
      },
      fail: (error) => {
        // 处理网络错误
        console.error(`请求失败: ${url}`, error);
        wx.showToast({
          title: '网络异常，请检查网络连接',
          icon: 'none'
        });
        reject(error);
      }
    });
  });
}

/**
 * 处理HTTP错误
 * @param {object} response - 响应对象
 * @param {function} reject - Promise的reject函数
 */
function handleHttpError(response, reject) {
  const statusCode = response.statusCode;
  let errorMessage = '请求失败';
  
  switch (statusCode) {
    case 400:
      errorMessage = '请求参数错误';
      break;
    case 401:
      errorMessage = '登录已过期，请重新登录';
      // 可以在这里处理登录过期的逻辑
      break;
    case 403:
      errorMessage = '没有操作权限';
      break;
    case 404:
      errorMessage = '请求的资源不存在';
      break;
    case 500:
      errorMessage = '服务器内部错误';
      break;
    default:
      errorMessage = `请求失败(${statusCode})`;
  }
  
  wx.showToast({
    title: errorMessage,
    icon: 'none'
  });
  
  reject({
    statusCode,
    message: errorMessage,
    data: response.data
  });
} 
 * HTTP请求工具 - 封装微信网络请求API
 */

// API基础URL
const BASE_URL = 'https://api.example.com';

/**
 * 发起GET请求
 * @param {string} url - 请求路径
 * @param {object} params - 请求参数
 * @param {object} header - 请求头
 * @returns {Promise<any>} 响应数据
 */
export function get(url, params = {}, header = {}) {
  return request(url, 'GET', params, header);
}

/**
 * 发起POST请求
 * @param {string} url - 请求路径
 * @param {object} data - 请求数据
 * @param {object} header - 请求头
 * @returns {Promise<any>} 响应数据
 */
export function post(url, data = {}, header = {}) {
  return request(url, 'POST', data, header);
}

/**
 * 发起PUT请求
 * @param {string} url - 请求路径
 * @param {object} data - 请求数据
 * @param {object} header - 请求头
 * @returns {Promise<any>} 响应数据
 */
export function put(url, data = {}, header = {}) {
  return request(url, 'PUT', data, header);
}

/**
 * 发起DELETE请求
 * @param {string} url - 请求路径
 * @param {object} data - 请求数据
 * @param {object} header - 请求头
 * @returns {Promise<any>} 响应数据
 */
export function del(url, data = {}, header = {}) {
  return request(url, 'DELETE', data, header);
}

/**
 * 通用请求方法
 * @param {string} url - 请求路径
 * @param {string} method - 请求方法
 * @param {object} data - 请求数据/参数
 * @param {object} header - 请求头
 * @returns {Promise<any>} 响应数据
 */
function request(url, method, data = {}, header = {}) {
  const token = wx.getStorageSync('token');
  const fullUrl = url.startsWith('http') ? url : BASE_URL + url;
  
  // 构造请求头
  const headers = {
    'Content-Type': 'application/json',
    ...header
  };
  
  // 如果有token，添加到请求头
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // 处理GET请求的参数
  let requestData = data;
  if (method === 'GET' && Object.keys(data).length > 0) {
    const queryString = Object.keys(data)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
      .join('&');
    url = `${fullUrl}${fullUrl.includes('?') ? '&' : '?'}${queryString}`;
    requestData = {};
  } else {
    url = fullUrl;
  }
  
  // 返回Promise
  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method,
      data: requestData,
      header: headers,
      success: (response) => {
        // 处理成功响应
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(response.data);
        } else {
          // 处理HTTP错误
          handleHttpError(response, reject);
        }
      },
      fail: (error) => {
        // 处理网络错误
        console.error(`请求失败: ${url}`, error);
        wx.showToast({
          title: '网络异常，请检查网络连接',
          icon: 'none'
        });
        reject(error);
      }
    });
  });
}

/**
 * 处理HTTP错误
 * @param {object} response - 响应对象
 * @param {function} reject - Promise的reject函数
 */
function handleHttpError(response, reject) {
  const statusCode = response.statusCode;
  let errorMessage = '请求失败';
  
  switch (statusCode) {
    case 400:
      errorMessage = '请求参数错误';
      break;
    case 401:
      errorMessage = '登录已过期，请重新登录';
      // 可以在这里处理登录过期的逻辑
      break;
    case 403:
      errorMessage = '没有操作权限';
      break;
    case 404:
      errorMessage = '请求的资源不存在';
      break;
    case 500:
      errorMessage = '服务器内部错误';
      break;
    default:
      errorMessage = `请求失败(${statusCode})`;
  }
  
  wx.showToast({
    title: errorMessage,
    icon: 'none'
  });
  
  reject({
    statusCode,
    message: errorMessage,
    data: response.data
  });
} 
 