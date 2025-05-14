import axios from 'axios';
import { PromptGPT } from "@/types/prompGPT";
import { createBatchTask, getBatchTaskStatus, deleteBatchTask, callTTSApi } from '@/api/tts';
import * as Pinia from 'pinia';
import WebStore from './web-store';
import { 
  LocalTTSConfig, 
  DEFAULT_LOCAL_TTS_CONFIG, 
  checkServerConnection,
  getFreeLimitInfo,
} from '@/api/local-tts';
// 移除SDK导入，改用REST API
// import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';

// 创建Web存储实例
const store = new WebStore();

// 定义错误类型
export enum FreeTTSErrorType {
  NONE = 0,
  QUOTA_EXCEEDED = 402,   // 额度用完
  RATE_LIMITED = 429,     // 请求频率限制
  BANNED = 403,           // 被封禁
  SERVER_ERROR = 500,     // 服务器错误
  CONNECTION_ERROR = -1   // 连接错误
}

// 定义freeTTS服务状态和管理
export const useFreeTTSstore = Pinia.defineStore('localTTSStore', {
  state: () => {
    return {
      // 配置
      config: {
        enabled: store.get('localTTS.enabled') ?? true,
        baseUrl: store.get('localTTS.baseUrl') ?? DEFAULT_LOCAL_TTS_CONFIG.baseUrl,
        defaultVoice: store.get('localTTS.defaultVoice') ?? DEFAULT_LOCAL_TTS_CONFIG.defaultVoice,
        defaultLanguage: store.get('localTTS.defaultLanguage') ?? DEFAULT_LOCAL_TTS_CONFIG.defaultLanguage,
      },
      // 服务器状态
      serverStatus: {
        connected: false,
        lastChecked: null as number | null,
        freeLimit: null as any | null,
        error: null as string | null,
        errorCode: FreeTTSErrorType.NONE
      },
      // 当前音频
      audio: {
        buffer: null as ArrayBuffer | null,
        url: null as string | null,
        isPlaying: false,
        error: null as string | null,
        errorCode: FreeTTSErrorType.NONE
      }
    };
  },
  
  getters: {
    // 获取完整的配置对象
    fullConfig(): LocalTTSConfig {
      return {
        baseUrl: this.config.baseUrl,
        defaultVoice: this.config.defaultVoice,
        defaultLanguage: this.config.defaultLanguage
      };
    },
    
    // 返回服务器是否连接成功的状态
    isServerConnected(): boolean {
      return this.serverStatus.connected;
    },
    
    // 剩余免费额度
    remainingFreeLimit(): number {
      return this.serverStatus.freeLimit?.remaining ?? 0;
    },
    
    // 免费额度使用百分比
    freeLimitUsagePercent(): number {
      const freeLimit = this.serverStatus.freeLimit;
      if (!freeLimit) return 0;
      
      return Math.round((freeLimit.used / freeLimit.free_limit) * 100);
    },

    // 获取当前错误状态码
    currentErrorCode(): FreeTTSErrorType {
      return this.audio.errorCode || this.serverStatus.errorCode || FreeTTSErrorType.NONE;
    },

    // 获取当前错误信息
    currentErrorMessage(): string {
      return this.audio.error || this.serverStatus.error || '';
    }
  },
  
  actions: {
    // 保存配置到localStorage
    saveConfig() {
      store.set('localTTS.enabled', this.config.enabled);
      store.set('localTTS.baseUrl', this.config.baseUrl);
      store.set('localTTS.defaultVoice', this.config.defaultVoice);
      store.set('localTTS.defaultLanguage', this.config.defaultLanguage);
    },
    
    // 重置配置到默认值
    resetConfig() {
      this.config.baseUrl = DEFAULT_LOCAL_TTS_CONFIG.baseUrl;
      this.config.defaultVoice = DEFAULT_LOCAL_TTS_CONFIG.defaultVoice;
      this.config.defaultLanguage = DEFAULT_LOCAL_TTS_CONFIG.defaultLanguage;
      this.saveConfig();
    },

    // 重置错误状态
    resetErrorState() {
      this.serverStatus.error = null;
      this.serverStatus.errorCode = FreeTTSErrorType.NONE;
      this.audio.error = null;
      this.audio.errorCode = FreeTTSErrorType.NONE;
    },
    
    // 设置错误状态
    setErrorState(message: string, code: FreeTTSErrorType = FreeTTSErrorType.SERVER_ERROR, isAudioError: boolean = false) {
      if (isAudioError) {
        this.audio.error = message;
        this.audio.errorCode = code;
      } else {
        this.serverStatus.error = message;
        this.serverStatus.errorCode = code;
      }
    },
    
    // 检查服务器连接
    async checkServerConnection() {
      try {
        this.resetErrorState();
        const connected = await checkServerConnection(this.fullConfig);
        this.serverStatus.connected = connected;
        this.serverStatus.lastChecked = Date.now();
        
        if (connected) {
          await this.getFreeLimitInfo();
        } else {
          this.setErrorState('无法连接到免费TTS服务器', FreeTTSErrorType.CONNECTION_ERROR);
        }
        
        return connected;
      } catch (error: any) {
        this.serverStatus.connected = false;
        this.setErrorState(error.message, FreeTTSErrorType.CONNECTION_ERROR);
        return false;
      }
    },
    
    // 从错误响应中提取错误码
    getErrorCodeFromResponse(error: any): FreeTTSErrorType {
      if (!error || !error.response) {
        return FreeTTSErrorType.CONNECTION_ERROR;
      }
      
      const status = error.response.status;
      
      // 根据响应状态码确定错误类型
      switch (status) {
        case 402:
          return FreeTTSErrorType.QUOTA_EXCEEDED;
        case 403:
          return FreeTTSErrorType.BANNED;
        case 429:
          return FreeTTSErrorType.RATE_LIMITED;
        case 500:
        case 502:
        case 503:
        case 504:
          return FreeTTSErrorType.SERVER_ERROR;
        default:
          return FreeTTSErrorType.SERVER_ERROR;
      }
    },
    
    // 获取免费额度信息
    async getFreeLimitInfo() {
      try {
        const freeLimit = await getFreeLimitInfo(this.fullConfig);
        this.serverStatus.freeLimit = freeLimit;
        // 如果成功获取额度信息，清除错误状态
        this.serverStatus.error = null;
        this.serverStatus.errorCode = FreeTTSErrorType.NONE;
        return freeLimit;
      } catch (error: any) {
        const errorCode = this.getErrorCodeFromResponse(error);
        this.setErrorState(`获取免费额度信息失败: ${error.message}`, errorCode);
        return null;
      }
    },
    
    // 使用免费TTS流API获取音频
    async getAudioStream(
      text: string, 
      voice?: string, 
      language?: string, 
      format?: string, 
      isSSML: boolean = false,
      speed: number = 1.0,
      pitch: number = 1.0
    ) {
      try {
        // 重置音频错误状态
        this.audio.error = null;
        this.audio.errorCode = FreeTTSErrorType.NONE;
        this.audio.buffer = null;
        this.audio.url = null;
        this.audio.isPlaying = false;
        
        // 准备参数
        const params = {
          ...(isSSML ? { ssml: text } : { text }),
          voice: voice || this.config.defaultVoice,
          language: language || this.config.defaultLanguage,
          format: format || 'mp3',
          speed: speed,
          pitch: pitch
        };
        
        // 使用getTTSData替代已弃用的getFreeTTSStream
        const ttsParams: TTSParams = {
          api: 5, // 使用本地免费TTS服务
          voiceData: {
            activeIndex: voice || this.config.defaultVoice,
            ssmlContent: isSSML ? text : '',
            inputContent: isSSML ? '' : text,
            retryCount: 3,
            retryInterval: 1
          }
        };
        
        const result = await getTTSData(ttsParams);
        
        if (result.error) {
          throw new Error(result.error);
        }
        
        if (!result.buffer) {
          throw new Error('未获取到音频数据');
        }
        
        const buffer = result.buffer;
        this.audio.buffer = buffer;
        
        // 创建URL
        const blob = new Blob([buffer], { type: `audio/${params.format}` });
        const url = URL.createObjectURL(blob);
        this.audio.url = url;
        
        // 更新免费额度信息
        await this.getFreeLimitInfo();
        
        return url;
      } catch (error: any) {
        // 处理不同类型的错误
        const errorCode = this.getErrorCodeFromResponse(error);
        let errorMessage = error.message || '获取音频失败';
        
        // 设置错误状态
        this.setErrorState(errorMessage, errorCode, true);
        
        // 如果是额度不足，尝试更新额度信息
        if (errorCode === FreeTTSErrorType.QUOTA_EXCEEDED) {
          try {
            await this.getFreeLimitInfo();
          } catch (e) {
            // 忽略获取额度信息的错误
          }
        }
        
        return null;
      }
    },
    
    // 播放已获取的音频
    playAudio() {
      if (!this.audio.url) {
        console.error('没有可播放的音频');
        return;
      }
      
      const audioElement = new Audio(this.audio.url);
      this.audio.isPlaying = true;
      
      audioElement.onended = () => {
        this.audio.isPlaying = false;
      };
      
      audioElement.onerror = () => {
        this.audio.isPlaying = false;
        this.setErrorState('音频播放失败', FreeTTSErrorType.SERVER_ERROR, true);
      };
      
      audioElement.play();
    },
    
    // 一步完成获取并播放音频
    async getAndPlayAudio(text: string, voice?: string, language?: string, format?: string, isSSML: boolean = false) {
      const url = await this.getAudioStream(text, voice, language, format, isSSML);
      if (url) {
        this.playAudio();
        return true;
      }
      return false;
    },
    
    // 发起API请求但不更改当前音频状态 (用于测试)
    async testAPIConnection(url?: string) {
      try {
        const testConfig = {
          ...this.fullConfig,
          ...(url ? { baseUrl: url } : {})
        };
        
        return await checkServerConnection(testConfig);
      } catch (error: any) {
        return false;
      }
    }
  }
});

// 用于Web环境的 TTS 接口
interface TTSParams {
  api: number;
  voiceData: {
    activeIndex: string;
    ssmlContent: string;
    inputContent: string;
    retryCount?: number;
    retryInterval?: number;
  };
  speechKey?: string;
  region?: string;
  thirdPartyApi?: string;
  tts88Key?: string;
}

// TTS API 响应接口
interface TTSResponse {
  buffer?: ArrayBuffer;
  audibleUrl?: string;
  error?: string;
  errorCode?: string;
}

/**
 * 获取TTS数据 - 业务逻辑层实现
 * 负责调用底层API，处理重试逻辑和特定的业务转换
 */
async function getTTSData(params: TTSParams): Promise<TTSResponse> {
  const { api, voiceData } = params;
  const { activeIndex, retryCount = 3, retryInterval = 1 } = voiceData;
  
  // 记录日志
  console.log("TTS API请求", { api, activeIndex, retryCount, retryInterval });
  
  // 参数验证 - 全面的参数校验
  if (!voiceData.ssmlContent && !voiceData.inputContent) {
    console.error('缺少转换内容');
    return {
      error: '没有可转换的内容',
      errorCode: 'EMPTY_CONTENT'
    };
  }
  
  // API类型相关验证
  if (api === 1 || api === 2 || api === 3) {
    // 验证Azure API必要参数
    if (!params.speechKey) {
      console.error('缺少 Azure Speech API Key');
      return {
        error: '请先在设置中配置 Azure Speech API Key',
        errorCode: 'MISSING_AZURE_KEY'
      };
    }
    
    if (api === 3 && !params.region) {
      console.error('缺少 Azure 区域设置');
      return {
        error: '请先在设置中配置 Azure 服务区域',
        errorCode: 'MISSING_AZURE_REGION'
      };
    }
  } else if (api === 4) {
    // 验证TTS88 API必要参数
    if (!params.thirdPartyApi) {
      console.error('缺少 TTS88 API URL');
      return {
        error: '请先在设置中配置 TTS88 API 地址',
        errorCode: 'MISSING_TTS88_URL'
      };
    }
    
    if (!params.tts88Key) {
      console.warn('TTS88 API Key未配置，可能导致认证失败');
    }
  } else if (api === 5) {
    // 免费TTS服务验证
    try {
      const localTTSStore = useFreeTTSstore();
      
      if (!localTTSStore.config.enabled) {
        return {
          error: "本地TTS服务未启用，请在设置中启用",
          errorCode: "LOCAL_TTS_DISABLED"
        };
      }
      
      if (!localTTSStore.config.baseUrl) {
        return {
          error: "本地TTS服务URL未配置，请在设置中配置",
          errorCode: "LOCAL_TTS_URL_MISSING"
        };
      }
      
      // 检查连接状态
      const isConnected = await localTTSStore.checkServerConnection();
      if (!isConnected) {
        return {
          error: "无法连接到本地TTS服务，请检查网络连接",
          errorCode: "LOCAL_TTS_CONNECTION_FAILED"
        };
      }
      
      // 检查可用额度
      const quotaInfo = await localTTSStore.getFreeLimitInfo();
      if (quotaInfo && quotaInfo.remaining <= 0) {
        return {
          error: "您的免费额度已用完，请等待下次重置或使用其他API",
          errorCode: "QUOTA_EXCEEDED"
        };
      }
    } catch (error) {
      console.error('验证本地TTS服务状态失败:', error);
    }
  }
  
  // 处理特定业务逻辑
  try {
    // 预处理参数或执行其他业务逻辑
    
    // 根据API类型进行不同的预处理
    if (api === 3) { // Azure
      console.log("使用Azure API");
      // 可以在这里添加Azure特定的处理逻辑
    }
    else if (api === 4) { // TTS88
      console.log("使用TTS88 API");
      // 可以在这里添加TTS88特定的处理逻辑
    }
    else if (api === 5) { // 本地TTS
      console.log("使用本地TTS服务");
      // 可以在这里添加本地TTS特定的处理逻辑
      
      // 获取当前选中的声音和配置
      if (api === 5) {
        const { useTtsStore } = await import('@/store/store');
        const ttsStore = useTtsStore();
        const selectedVoice = ttsStore.formConfig.voiceSelect;
        const speed = ttsStore.formConfig.speed;
        const pitch = ttsStore.formConfig.pitch;
        console.log("当前选择的声音:", selectedVoice, "语速:", speed, "音调:", pitch);
      }
    }

    // 调用API层的函数，并包含重试逻辑
    let retry = 0;
    let lastError;
    
    while (retry < retryCount) {
      try {
        console.log(`尝试调用TTS API (尝试 ${retry + 1}/${retryCount})`);
        
        // 确保参数类型兼容
        const apiParams = {
          ...params,
          // 确保必要属性不为undefined
          speechKey: params.speechKey || '',
          region: params.region || '',
          thirdPartyApi: params.thirdPartyApi || '',
          tts88Key: params.tts88Key || ''
        };
        
        const result = await callTTSApi(apiParams);
        
        // 检查是否有错误
        if (result.error) {
          // 根据错误代码提供增强的错误信息
          let errorMessage = result.error;
          let errorCode = result.errorCode || "API_ERROR";
          
          // 特定错误类型的增强处理
          if (errorCode === "HTTP_401" || errorCode === "HTTP_403") {
            errorMessage = `认证失败: API密钥无效或未授权`;
            errorCode = "AUTH_ERROR";
          } else if (errorCode === "HTTP_429") {
            errorMessage = "请求过于频繁，请稍后再试";
            errorCode = "RATE_LIMITED";
          } else if (errorCode && errorCode.startsWith("HTTP_5")) {
            errorMessage = `服务器错误: 请稍后再试`;
            errorCode = "SERVER_ERROR";
          } else if (errorCode === "LOCAL_TTS_ERROR" && result.error.includes("quota exceeded")) {
            errorMessage = "您的免费额度已用完，请等待下次重置或使用其他API";
            errorCode = "QUOTA_EXCEEDED";
          } else if (errorCode === "LOCAL_TTS_ERROR" && result.error.includes("rate limited")) {
            errorMessage = "请求频率过高，请稍后再试";
            errorCode = "RATE_LIMITED";
          }
          
          throw new Error(errorMessage);
        }
        
        // 业务逻辑处理: 添加额外的属性或转换
        // 例如: 可以增加播放列表历史记录、统计使用次数等
        
        // 存储转换历史，当前实现只返回结果
        return result;
      } catch (error: any) {
        console.error(`TTS API调用失败 (尝试 ${retry + 1}/${retryCount}):`, error);
        lastError = error;
        console.log(`等待 ${retryInterval} 秒后重试...`);
        await sleep(retryInterval * 1000);
        retry++;
      }
    }
    
    console.error('达到最大重试次数，放弃请求');
    return {
      error: lastError?.message || "达到最大重试次数，请求失败",
      errorCode: "MAX_RETRY_EXCEEDED"
    };
  } catch (error: any) {
    console.error("TTS转换失败:", error);
    return {
      error: error.message || "TTS转换失败",
      errorCode: "GENERAL_ERROR"
    };
  }
}

// Sleep函数，用于重试间隔
function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// GPT API调用
async function getDataGPT(options: PromptGPT): Promise<string> {
  const { promptGPT, model = 'gpt-3.5-turbo', key, retryCount = 3, retryInterval = 1, baseUrl } = options;
  
  if (!key) {
    throw new Error("OpenAI API密钥未配置");
  }
  
  let retry = 0;
  let lastError;
  
  while (retry < retryCount) {
    try {
      console.log(`尝试调用 OpenAI API (尝试 ${retry + 1}/${retryCount})`)
      
      const apiUrl = baseUrl || 'https://api.openai.com/v1/chat/completions';
      
      const response = await axios.post(
        apiUrl,
        {
          model: model,
          messages: [{ role: 'user', content: promptGPT }]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
          }
        }
      );
      
      if (response.data && response.data.choices && response.data.choices.length > 0) {
        return response.data.choices[0].message.content.trim();
      } else {
        throw new Error("API返回的响应格式不正确");
      }
    } catch (error) {
      console.error(`OpenAI API调用失败 (尝试 ${retry + 1}/${retryCount}):`, error);
      lastError = error;
      await sleep(retryInterval * 1000);
      retry++;
    }
  }
  
  throw lastError || new Error("未知错误");
}

export { getTTSData, getDataGPT, createBatchTask, getBatchTaskStatus, deleteBatchTask };
