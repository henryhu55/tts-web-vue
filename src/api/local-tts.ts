import axios from 'axios';

// 本地TTS服务器的配置接口
export interface LocalTTSConfig {
  baseUrl: string;  // 服务器地址，例如：http://localhost:8080
  defaultVoice: string;  // 默认语音
  defaultLanguage: string;  // 默认语言
  retryCount: number;
  retryInterval: number;
  defaultAudioFormat: string;
  autoPlay: boolean;
  enabled: boolean;
}

// TTS请求参数接口
export interface TTSRequestParams {
  text?: string;  // 纯文本
  ssml?: string;  // SSML格式文本
  voice: string;  // 语音
  language: string;  // 语言
  format?: string;  // 格式，默认mp3
  speed?: number;  // 语速
  pitch?: number;  // 音调
}

// 免费额度信息接口
export interface FreeLimitInfo {
  free_limit: number;  // 总免费额度
  used: number;  // 已使用
  remaining: number;  // 剩余
  reset_date: string;  // 重置日期
  days_streak?: number; // 连续使用天数
  debug?: any;  // 调试信息
}

// 错误响应接口
export interface ErrorResponse {
  message: string;
  code: number;
  status?: number;
}

/**
 * 检查服务器连接性
 * @param config 服务器配置
 * @returns 服务器是否可连接
 */
export async function checkServerConnection(config: LocalTTSConfig): Promise<boolean> {
  try {
    const response = await axios.get(`${config.baseUrl}/api/v1/health`, {
      timeout: 5000 // 5秒超时
    });
    return response.status === 200 && response.data?.status === 'ok';
  } catch (error) {
    console.error('无法连接到TTS服务器:', error);
    throw error; // 向上抛出错误，让调用者处理
  }
}

/**
 * 生成浏览器指纹
 * 虽然最终在服务器端会重新生成更可靠的指纹，但前端仍提供一个初始值以便服务器端比对
 */
export function generateBrowserFingerprint(): string {
  try {
    const screenInfo = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const languages = navigator.languages ? navigator.languages.join(',') : navigator.language;
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    const glInfo = gl ? gl.getParameter(gl.RENDERER) : 'no-webgl';
    
    // 组合所有信息
    const components = [
      navigator.userAgent,
      screenInfo,
      timeZone,
      languages,
      glInfo,
      navigator.platform,
      new Date().getTimezoneOffset()
    ];
    
    // 创建一个简单的哈希
    let hash = 0;
    const str = components.join('|');
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    
    return hash.toString(16);
  } catch (e) {
    // 如果发生任何错误，返回一个随机值
    console.error('生成浏览器指纹时出错:', e);
    return Math.random().toString(36).substring(2, 15);
  }
}

/**
 * 处理API错误
 * @param error 错误对象
 * @returns 抛出增强的错误对象
 */
export async function handleApiError(error: any): Promise<never> {
  console.error('API请求错误:', error);
  
  // 默认错误响应
  const errorResponse: ErrorResponse = {
    message: '未知错误',
    code: 500,
    status: 500
  };
  
  if (!error) {
    throw new Error(errorResponse.message);
  }
  
  // 处理不同类型的错误
  if (error.response) {
    // 服务器返回了错误状态码
    errorResponse.status = error.response.status;
    
    // 尝试解析响应内容
    if (error.response.data) {
      try {
        // 如果响应是Blob，需要先转换
        if (error.response.data instanceof Blob) {
          const text = await error.response.data.text();
          try {
            const jsonData = JSON.parse(text);
            errorResponse.message = jsonData.message || '服务器错误';
            errorResponse.code = jsonData.code || error.response.status;
          } catch (e) {
            // 不是JSON格式，直接使用文本
            errorResponse.message = text || '服务器返回了无效的响应';
          }
        } else {
          // 直接使用响应数据
          errorResponse.message = error.response.data.message || '服务器错误';
          errorResponse.code = error.response.data.code || error.response.status;
        }
      } catch (e) {
        // 无法解析响应内容
        errorResponse.message = '无法解析错误响应';
      }
    }
    
    // 使用状态码设置特定的错误消息
    switch (error.response.status) {
      case 402:
        errorResponse.message = errorResponse.message || '免费额度不足，请明天再试';
        break;
      case 403:
        errorResponse.message = errorResponse.message || '您的账户已被暂时限制使用';
        break;
      case 429:
        errorResponse.message = errorResponse.message || '请求过于频繁，请稍后再试';
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        errorResponse.message = errorResponse.message || '服务器内部错误';
        break;
    }
  } else if (error.request) {
    // 请求已发出但没有收到响应
    errorResponse.message = '服务器未响应，请检查网络连接';
    errorResponse.status = -1;
    errorResponse.code = -1;
  } else {
    // 设置请求时发生错误
    errorResponse.message = error.message || '请求设置错误';
  }
  
  // 抛出完整的错误对象
  const enhancedError = new Error(errorResponse.message);
  (enhancedError as any).response = {
    status: errorResponse.status,
    data: { message: errorResponse.message, code: errorResponse.code }
  };
  
  throw enhancedError;
}

/**
 * 获取免费额度信息
 * @param config 服务器配置
 * @returns 免费额度信息
 */
export async function getFreeLimitInfo(config: LocalTTSConfig): Promise<FreeLimitInfo> {
  try {
    // 请求配置，添加浏览器指纹头
    const requestConfig = {
      headers: {
        'X-Browser-Fingerprint': generateBrowserFingerprint()
      },
      timeout: 5000 // 5秒超时
    };
    
    const response = await axios.get(
      `${config.baseUrl}/api/v1/free-limit`,
      requestConfig
    );
    
    if (response.status === 200 && response.data?.data) {
      return response.data.data as FreeLimitInfo;
    }
    throw new Error('获取免费额度信息失败');
  } catch (error: any) {
    return handleApiError(error);
  }
}

// 默认配置
export const DEFAULT_LOCAL_TTS_CONFIG: LocalTTSConfig = {
  baseUrl: 'https://free.tts88.top', // 修改为您的实际服务器地址
  defaultVoice: 'zh-CN-XiaoxiaoNeural',
  defaultLanguage: 'zh-CN',
  retryCount: 3,
  retryInterval: 2000,
  defaultAudioFormat: 'mp3',
  autoPlay: true,
  enabled: true
}; 