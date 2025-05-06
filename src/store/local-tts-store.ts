// import { defineStore } from 'pinia';
import * as Pinia from 'pinia';
import WebStore from './web-store';
import { 
  LocalTTSConfig, 
  DEFAULT_LOCAL_TTS_CONFIG, 
  checkServerConnection,
  getFreeLimitInfo,
  getFreeTTSStream,
  getFreeTTS
} from '@/api/local-tts';

// 创建Web存储实例
const store = new WebStore();

// 定义本地TTS服务状态和管理
export const useLocalTTSStore = Pinia.defineStore('localTTSStore', {
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
        error: null as string | null
      },
      // 当前音频
      audio: {
        buffer: null as ArrayBuffer | null,
        url: null as string | null,
        isPlaying: false,
        error: null as string | null
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
    
    // 检查服务器连接
    async checkServerConnection() {
      try {
        this.serverStatus.error = null;
        const connected = await checkServerConnection(this.fullConfig);
        this.serverStatus.connected = connected;
        this.serverStatus.lastChecked = Date.now();
        
        if (connected) {
          await this.getFreeLimitInfo();
        }
        
        return connected;
      } catch (error: any) {
        this.serverStatus.connected = false;
        this.serverStatus.error = error.message;
        return false;
      }
    },
    
    // 获取免费额度信息
    async getFreeLimitInfo() {
      try {
        const freeLimit = await getFreeLimitInfo(this.fullConfig);
        this.serverStatus.freeLimit = freeLimit;
        return freeLimit;
      } catch (error: any) {
        this.serverStatus.error = `获取免费额度信息失败: ${error.message}`;
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
        this.audio.error = null;
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
        
        // 获取音频流
        const buffer = await getFreeTTSStream(this.fullConfig, params);
        this.audio.buffer = buffer;
        
        // 创建URL
        const blob = new Blob([buffer], { type: `audio/${params.format}` });
        const url = URL.createObjectURL(blob);
        this.audio.url = url;
        
        // 更新免费额度信息
        await this.getFreeLimitInfo();
        
        return url;
      } catch (error: any) {
        this.audio.error = `获取音频失败: ${error.message}`;
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
        this.audio.error = '音频播放失败';
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