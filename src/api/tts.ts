import axios from 'axios';

interface VoiceData {
  activeIndex: string;
  ssmlContent: string;
  inputContent: string;
  retryCount?: number;
  retryInterval?: number;
}

interface TTSParams {
  api: number;
  voiceData: VoiceData;
  speechKey: string;
  region: string;
  thirdPartyApi: string;
  tts88Key: string;
}

export interface TTSResponse {
  audioContent?: string;
  audibleUrl?: string;
  buffer?: ArrayBuffer;
  error?: string;
  errorCode?: string;
}

export async function callTTSApi(params: TTSParams): Promise<TTSResponse> {
  try {
    const { api, voiceData, speechKey, region, thirdPartyApi, tts88Key } = params;
    
    // 根据不同的 API 类型构建不同的请求 URL 和认证头
    let apiUrl = '';
    let headers: Record<string, string> = {
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
    };

    if (api === 4) {
      apiUrl = thirdPartyApi;
      // TTS88 API 使用 tts88Key
      if (tts88Key) {
        headers['Authorization'] = `Bearer ${tts88Key}`;
      }
    } else if (api === 5) {
      // 导入本地TTS服务相关功能
      try {
      const { useFreeTTSstore } = await import('@/store/play');
      const localTTSStore = useFreeTTSstore();
      
        // 获取配置
        const config = localTTSStore.fullConfig;
        
        // 准备API请求的URL和参数
        apiUrl = `${config.baseUrl}/api/v1/free-tts-stream`;
        
        // 获取本地TTS所需的参数
      const isSSML = voiceData.activeIndex === "1"; // 判断是否为SSML内容
        
        // 对于免费服务，优先使用纯文本，因为SSML可能导致错误
        // 即使activeIndex为1，也尝试提取纯文本内容
        let content = "";
        if (isSSML) {
          // 从SSML中尝试提取纯文本内容
          try {
            // 尝试简单提取SSML中的文本
            content = voiceData.ssmlContent
              .replace(/<[^>]*>/g, '') // 移除所有XML标签
              .replace(/\s+/g, ' ')    // 将多个空格合并为单个空格
              .trim();                 // 移除前后空格
            
            console.log('从SSML中提取的纯文本:', content);
            
            // 如果提取失败或内容为空，则使用原始SSML
      if (!content) {
              content = voiceData.ssmlContent;
              console.log('提取纯文本失败，使用原始SSML');
            }
          } catch (e) {
            console.error('提取纯文本时出错:', e);
            content = voiceData.ssmlContent;
          }
        } else {
          content = voiceData.inputContent;
        }
        
        const { useTtsStore } = await import('@/store/store');
        const ttsStore = useTtsStore();
        const selectedVoice = ttsStore.formConfig.voiceSelect;
        const speed = ttsStore.formConfig.speed;
        const pitch = ttsStore.formConfig.pitch;
        
        // 获取浏览器指纹
        const fingerprint = await generateBrowserFingerprint();
        
        // 设置请求头
        headers = {
          'Content-Type': 'application/json',
          'X-Browser-Fingerprint': fingerprint
        };
        
        console.log('发送请求到免费TTS服务，使用的声音:', selectedVoice);
        
        // 使用正确的参数格式
        // 对于免费服务，尝试使用纯文本模式，避免SSML解析错误
        const requestBody = {
          text: content,
          is_ssml: false, // 强制设置为false，使用纯文本模式
          voice: selectedVoice || 'zh-CN-XiaoxiaoNeural',
          language: ttsStore.formConfig.languageSelect || 'zh-CN',
          format: 'mp3',
          speed: speed || 1.0,
          pitch: pitch || 1.0
        };
        
        console.log('发送到免费TTS服务的请求参数:', requestBody);
        
        // 发送请求
        const response = await axios.post(
          apiUrl,
          requestBody,
          {
            headers,
            responseType: 'arraybuffer',
            timeout: 300000
          }
        );
        
        // 返回二进制音频数据
        return {
          buffer: response.data
        };
      } catch (localError: any) {
        return {
          error: `FreeTTS服务错误: ${localError.message}`,
          errorCode: "LOCAL_TTS_ERROR"
        };
      }
    } else {
      // Azure API
      apiUrl = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
      // Azure API 直接使用 speechKey
      headers['Ocp-Apim-Subscription-Key'] = speechKey;
    }

    // 所有API类型都需要发送HTTP请求
    if (api !== 5) { // 上面已经处理了API类型5的情况
      try {
      // 发送请求
      const response = await axios.post(
        apiUrl,
        voiceData.ssmlContent,
        {
          headers,
            responseType: 'arraybuffer',
            timeout: 300000 // 设置300秒超时
        }
      );

      // 将 ArrayBuffer 转换为 base64 字符串
      const audioData = new Uint8Array(response.data);
      const base64Audio = btoa(
        audioData.reduce((data, byte) => data + String.fromCharCode(byte), '')
      );

      // 返回音频数据
      return {
        buffer: response.data,
        audioContent: base64Audio
      };
      } catch (httpError: any) {
        // 简化错误处理，只返回基本错误信息和状态码
        return {
          error: httpError.message || '获取语音数据失败',
          errorCode: httpError.response?.status ? `HTTP_${httpError.response.status}` : "HTTP_ERROR"
        };
      }
    }

    // 如果执行到这里且未返回，返回一个默认错误
    return {
      error: "未知错误，无法处理API请求",
      errorCode: "UNKNOWN_ERROR"
    };
  } catch (error: any) {
    // 全局错误处理
    return {
      audioContent: '',
      error: error.message || '获取语音数据失败',
      errorCode: "GLOBAL_ERROR"
    };
  }
}

// 生成浏览器指纹
async function generateBrowserFingerprint(): Promise<string> {
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

// 批量转换任务接口
interface BatchTask {
  inputKind: string;
  inputs: Array<{
    content: string;
  }>;
  properties: {
    wordBoundaryEnabled: boolean;
  };
}

// 批量转换任务状态接口
interface BatchTaskStatus {
  id: string;
  status: string;
  createdDateTime: string;
  lastActionDateTime: string;
  properties: {
    timeToLiveInHours: number;
    succeededAudioCount: number;
    failedAudioCount: number;
    durationInMilliseconds: number;
  };
  outputs?: {
    result: string;
  };
}

// 生成唯一的任务ID
function generateTaskId(): string {
  return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// 转换API URL从单文件到批量处理的URL
function convertToBatchApiUrl(apiUrl: string): string {
  // 将 /cognitiveservices/v1 替换为 /texttospeech
  return apiUrl.replace(/\/cognitiveservices\/v1/, '/texttospeech');
}

// 创建批量转换任务
export async function createBatchTask(
  thirdPartyApi: string,
  tts88Key: string,
  task: BatchTask
): Promise<string> {
  try {
    // 调试日志
    console.log('createBatchTask 参数:', {
      thirdPartyApi,
      hasKey: !!tts88Key,
      task
    });
    
    // 转换为批量处理的API URL
    const batchApiUrl = convertToBatchApiUrl(thirdPartyApi);
    console.log('转换后的批量API URL:', batchApiUrl);
    
    // 移除URL末尾的斜杠
    const baseUrl = batchApiUrl.replace(/\/$/, '');
    
    // 生成任务ID
    const taskId = generateTaskId();
    console.log('生成的任务ID:', taskId);
    
    // 构建完整的请求URL
    const requestUrl = `${baseUrl}/batchsyntheses/${taskId}?api-version=2024-04-01`;
    console.log('请求URL:', requestUrl);
    
    // 发送创建任务请求
    const response = await axios.put(
      requestUrl,
      task,
      {
        headers: {
          'Authorization': `Bearer ${tts88Key}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('创建任务响应:', response.data);
    
    // 返回生成的任务ID
    return taskId;
  } catch (error: any) {
    // 增强错误日志
    console.error('创建批量任务失败:', {
      error,
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw new Error(`创建批量任务失败: ${error.message}`);
  }
}

// 获取批量转换任务状态
export async function getBatchTaskStatus(
  thirdPartyApi: string,
  tts88Key: string,
  taskId: string
): Promise<BatchTaskStatus> {
  try {
    // 检查任务ID是否有效
    if (!taskId || taskId === 'undefined') {
      throw new Error('无效的任务ID');
    }
    
    // 调试日志
    console.log('getBatchTaskStatus 参数:', {
      thirdPartyApi,
      taskId,
      hasKey: !!tts88Key
    });
    
    // 转换为批量处理的API URL
    const batchApiUrl = convertToBatchApiUrl(thirdPartyApi);
    console.log('转换后的批量API URL:', batchApiUrl);
    
    // 移除URL末尾的斜杠
    const baseUrl = batchApiUrl.replace(/\/$/, '');
    
    // 构建完整的请求URL
    const requestUrl = `${baseUrl}/batchsyntheses/${taskId}?api-version=2024-04-01`;
    console.log('请求URL:', requestUrl);
    
    const response = await axios.get(
      requestUrl,
      {
        headers: {
          'Authorization': `Bearer ${tts88Key}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // 调试日志
    console.log('获取到的响应:', response.data);
    
    // 检查响应数据的完整性
    if (!response.data?.status) {
      console.error('响应数据缺少status字段:', response.data);
      throw new Error('服务器返回的状态数据无效');
    }
    
    return response.data;
  } catch (error: any) {
    // 增强错误日志
    console.error('获取任务状态失败:', {
      error,
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw new Error(`获取任务状态失败: ${error.message}`);
  }
}

// 删除批量转换任务
export async function deleteBatchTask(
  thirdPartyApi: string,
  tts88Key: string,
  taskId: string
): Promise<void> {
  try {
    // 检查任务ID是否有效
    if (!taskId || taskId === 'undefined') {
      throw new Error('无效的任务ID');
    }
    
    // 移除URL末尾的斜杠
    const baseUrl = thirdPartyApi.replace(/\/$/, '');
    
    // 构建完整的请求URL，避免路径重复
    const requestUrl = `${baseUrl}/batchsyntheses/${taskId}?api-version=2024-04-01`;
    
    await axios.delete(
      requestUrl,
      {
        headers: {
          'Authorization': `Bearer ${tts88Key}`
        }
      }
    );
  } catch (error: any) {
    console.error('删除任务失败:', error);
    throw new Error(`删除任务失败: ${error.message}`);
  }
} 