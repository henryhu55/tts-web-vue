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