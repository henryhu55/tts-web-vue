import axios from 'axios';

interface VoiceData {
  activeIndex: string;
  ssmlContent: string;
  inputContent: string;
  retryCount: number;
  retryInterval: number;
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
}

export async function getTTSData(params: TTSParams): Promise<TTSResponse> {
  try {
    const { api, voiceData, speechKey, region, thirdPartyApi, tts88Key } = params;
    
    // 根据不同的 API 类型构建不同的请求 URL 和认证头
    let apiUrl = '';
    let headers: Record<string, string> = {
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
    };

    if (api === 4 && thirdPartyApi) {
      apiUrl = thirdPartyApi;
      // TTS88 API 使用 tts88Key
      if (tts88Key) {
        headers['Authorization'] = `Bearer ${tts88Key}`;
      }
    } else {
      apiUrl = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
      // Azure API 直接使用 speechKey
      headers['Ocp-Apim-Subscription-Key'] = speechKey;
    }

    // 发送请求
    const response = await axios.post(
      apiUrl,
      voiceData.ssmlContent,
      {
        headers,
        responseType: 'arraybuffer'
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

  } catch (error: any) {
    console.error('TTS API Error:', error);
    return {
      audioContent: '',
      error: error.response?.data?.message || error.message || '获取语音数据失败'
    };
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