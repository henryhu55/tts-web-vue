/**
 * Pinia商店类型定义
 */

// TTS商店状态类型
export interface TtsStoreState {
  // 配置相关
  config: {
    speechKey: string;
    serviceRegion: string;
    thirdPartyApi: string;
    tts88Key: string;
    retryCount: number;
    retryInterval: number;
    formConfigJson: Record<string, any>;
    [key: string]: any;
  };
  
  // 表单配置
  formConfig: {
    api: number;
    languageSelect: string;
    voiceSelect: string;
    ssmlValue?: string;
    voiceStyleSelect: string;
    role: string;
    speed: number;
    pitch: number;
    intensity: string;
    silence: string;
    volume: string;
    [key: string]: any;
  };
  
  // 页面状态
  page: {
    tabIndex: number;
    asideIndex: string;
    [key: string]: any;
  };
  
  // 输入相关
  inputs: {
    inputValue: string;
    ssmlValue: string;
    [key: string]: any;
  };
  
  // 表格数据
  tableData: any[];
  
  // 加载状态
  isLoading: boolean;
  
  // 其他状态
  [key: string]: any;
}

// 本地TTS商店状态类型
export interface LocalTTSStoreState {
  config: {
    enabled: boolean;
    serverUrl: string;
    [key: string]: any;
  };
  
  serverStatus: {
    connected: boolean;
    version?: string;
    supportedModels?: string[];
    freeLimit?: {
      free_limit: number;
      remaining: number;
      reset_time?: string;
    };
    [key: string]: any;
  };
  
  freeLimitUsagePercent: number;
  [key: string]: any;
} 