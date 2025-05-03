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
}

/**
 * 检查服务器连接性
 * @param config 服务器配置
 * @returns 服务器是否可连接
 */
export async function checkServerConnection(config: LocalTTSConfig): Promise<boolean> {
  try {
    const response = await axios.get(`${config.baseUrl}/api/v1/health`);
    return response.status === 200 && response.data?.status === 'ok';
  } catch (error) {
    console.error('无法连接到TTS服务器:', error);
    return false;
  }
}

/**
 * 获取免费额度信息
 * @param config 服务器配置
 * @returns 免费额度信息
 */
export async function getFreeLimitInfo(config: LocalTTSConfig): Promise<FreeLimitInfo> {
  try {
    const response = await axios.get(`${config.baseUrl}/api/v1/free-limit`);
    if (response.status === 200 && response.data?.data) {
      return response.data.data as FreeLimitInfo;
    }
    throw new Error('获取免费额度信息失败');
  } catch (error) {
    console.error('获取免费额度信息失败:', error);
    throw error;
  }
}

/**
 * 使用免费TTS流API获取音频（二进制流）
 * @param config 服务器配置
 * @param params TTS请求参数
 * @returns 音频数据的ArrayBuffer
 */
export async function getFreeTTSStream(
  config: LocalTTSConfig, 
  params: TTSRequestParams
): Promise<ArrayBuffer> {
  try {
    console.log('调用本地TTS服务器免费流API:', params);
    
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
      },
      responseType: 'arraybuffer' as 'arraybuffer'
    };
    
    // 发送请求
    const response = await axios.post(
      `${config.baseUrl}/api/v1/free-tts-stream`,
      requestParams,
      requestConfig
    );
    
    // 输出额度信息
    console.log('免费配额信息:', {
      used: response.headers['x-free-usage'],
      remaining: response.headers['x-remaining-quota'],
      dailyLimit: response.headers['x-daily-limit']
    });
    
    return response.data;
  } catch (error: any) {
    console.error('获取TTS音频流失败:', error);
    
    // 提供更详细的错误信息
    if (error.response) {
      // 如果有响应，尝试解析错误信息
      try {
        const decoder = new TextDecoder();
        const errorData = decoder.decode(error.response.data);
        console.error('服务器返回的错误信息:', errorData);
        
        // 尝试解析JSON
        try {
          const jsonError = JSON.parse(errorData);
          if (jsonError.message) {
            throw new Error(jsonError.message);
          }
        } catch {
          // 非JSON格式，直接使用文本
        }
      } catch {
        // 解码失败，使用状态码
        throw new Error(`服务器返回错误: ${error.response.status}`);
      }
    }
    
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

/**
 * 生成浏览器指纹用于跟踪免费额度使用
 * @returns 浏览器指纹
 */
function generateBrowserFingerprint(): string {
  const userAgent = navigator.userAgent;
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  const language = navigator.language;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // 使用这些信息创建一个简单的指纹
  const fingerprint = btoa(`${userAgent}|${screenWidth}x${screenHeight}|${language}|${timezone}`);
  
  // 如果有持久化存储，可以将其存储起来重复使用
  localStorage.setItem('tts_fingerprint', fingerprint);
  
  return fingerprint;
}

// 默认配置
export const DEFAULT_LOCAL_TTS_CONFIG: LocalTTSConfig = {
  baseUrl: 'https://tts-api.example.com', // 修改为您的实际服务器地址
  defaultVoice: 'zh-CN-XiaoxiaoNeural',
  defaultLanguage: 'zh-CN'
}; 