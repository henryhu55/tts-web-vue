import axios from 'axios';

// 本地TTS服务器的配置接口
export interface LocalTTSConfig {
  baseUrl: string;  // 服务器地址，例如：http://localhost:8080
  defaultVoice: string;  // 默认语音
  defaultLanguage: string;  // 默认语言
}

// TTS请求参数接口
export interface TTSRequestParams {
  text?: string;  // 纯文本
  ssml?: string;  // SSML格式文本
  voice: string;  // 语音
  language: string;  // 语言
  format?: string;  // 格式，默认mp3
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
    return false;
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
    
    console.log('查询免费额度信息');
    
    const response = await axios.get(
      `${config.baseUrl}/api/v1/free-limit`,
      requestConfig
    );
    
    if (response.status === 200 && response.data?.data) {
      return response.data.data as FreeLimitInfo;
    }
    throw new Error('获取免费额度信息失败');
  } catch (error: any) {
    console.error('获取免费额度信息失败:', error);
    
    // 添加更详细的错误处理
    if (error.response) {
      // 服务器返回了错误状态码
      if (error.response.status === 429) {
        throw new Error('请求过于频繁，请稍后再试');
      } else if (error.response.data && error.response.data.message) {
        throw new Error(`服务器错误: ${error.response.data.message}`);
      }
    } else if (error.request) {
      // 请求发出但没有收到响应
      throw new Error('服务器未响应，请检查连接');
    }
    
    // 如果是其他错误，直接抛出
    throw error;
  }
}

/**
 * 获取TTS音频流
 * @param config 服务器配置
 * @param params TTS请求参数
 * @returns 音频数据的Blob对象
 */
export async function getFreeTTSStream(config: LocalTTSConfig, params: TTSRequestParams): Promise<Blob> {
  try {
    // 请求配置，添加浏览器指纹头和设置响应类型为blob
    const requestConfig = {
      headers: {
        'X-Browser-Fingerprint': generateBrowserFingerprint(),
        'Content-Type': 'application/json'
      },
      responseType: 'blob' as 'blob',
      timeout: 10000 // 10秒超时，合成语音可能需要更长时间
    };
    
    // 确保参数中有text或ssml
    if (!params.text && !params.ssml) {
      throw new Error('必须提供text或ssml参数');
    }
    
    console.log('请求TTS音频流');
    
    const response = await axios.post(
      `${config.baseUrl}/api/v1/free-tts-stream`,
      params,
      requestConfig
    );
    
    if (response.status === 200) {
      // 从响应头中获取剩余配额信息
      const usedQuota = response.headers['x-free-usage'];
      const remainingQuota = response.headers['x-remaining-quota'];
      const dailyLimit = response.headers['x-daily-limit'];
      
      if (usedQuota && remainingQuota && dailyLimit) {
        console.log(`TTS请求成功 - 本次使用: ${usedQuota}字符, 剩余: ${remainingQuota}/${dailyLimit}字符`);
      }
      
      return response.data as Blob;
    }
    
    throw new Error('获取TTS音频失败');
  } catch (error: any) {
    console.error('获取TTS音频失败:', error);
    
    // 添加更详细的错误处理
    if (error.response) {
      // 服务器返回了错误状态码
      if (error.response.status === 402) {
        throw new Error('免费额度不足，请明天再试');
      } else if (error.response.status === 429) {
        throw new Error('请求过于频繁，请稍后再试');
      } else if (error.response.data) {
        // 尝试读取blob中的错误信息
        try {
          const errorBlob = error.response.data as Blob;
          const errorText = await errorBlob.text();
          const errorJson = JSON.parse(errorText);
          if (errorJson.message) {
            throw new Error(`服务器错误: ${errorJson.message}`);
          }
        } catch (e) {
          // 无法解析错误内容，使用通用错误信息
          throw new Error(`服务器返回错误: ${error.response.status}`);
        }
      }
    } else if (error.request) {
      // 请求发出但没有收到响应
      throw new Error('服务器未响应，请检查连接');
    }
    
    // 如果是其他错误，直接抛出
    throw error;
  }
}

/**
 * 使用JSON格式的免费TTS API获取音频（Base64编码）
 * @param config 服务器配置
 * @param params TTS请求参数
 * @returns 包含Base64编码音频数据的响应
 */
export async function getFreeTTS(
  config: LocalTTSConfig, 
  params: TTSRequestParams
): Promise<{ audio_base64: string; format: string }> {
  try {
    console.log('调用本地TTS服务器免费JSON API:', params);
    
    // 设置默认值
    const requestParams: TTSRequestParams = {
      voice: params.voice || config.defaultVoice,
      language: params.language || config.defaultLanguage,
      format: params.format || 'mp3',
      text: params.text,
      ssml: params.ssml
    };
    
    // 请求配置
    const requestConfig = {
      headers: {
        'Content-Type': 'application/json',
        'X-Browser-Fingerprint': generateBrowserFingerprint()
      }
    };
    
    // 发送请求
    const response = await axios.post(
      `${config.baseUrl}/api/v1/free-tts`,
      requestParams,
      requestConfig
    );
    
    if (response.status === 200 && response.data?.data) {
      return {
        audio_base64: response.data.data.audio_base64,
        format: response.data.data.format || 'mp3'
      };
    }
    
    throw new Error('响应格式不正确');
  } catch (error) {
    console.error('获取TTS音频失败:', error);
    throw error;
  }
}

// 默认配置
export const DEFAULT_LOCAL_TTS_CONFIG: LocalTTSConfig = {
  baseUrl: 'https://free.tts88.top', // 修改为您的实际服务器地址
  defaultVoice: 'zh-CN-XiaoxiaoNeural',
  defaultLanguage: 'zh-CN'
}; 