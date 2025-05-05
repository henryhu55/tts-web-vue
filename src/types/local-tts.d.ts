declare module '@/api/local-tts' {
  export interface LocalTTSConfig {
    baseUrl: string;
    defaultVoice: string;
    defaultLanguage: string;
  }
  
  export const DEFAULT_LOCAL_TTS_CONFIG: LocalTTSConfig;
  
  export function checkServerConnection(config: LocalTTSConfig): Promise<boolean>;
  export function getFreeLimitInfo(config: LocalTTSConfig): Promise<any>;
  export function getFreeTTSStream(config: LocalTTSConfig, params: any): Promise<ArrayBuffer>;
  export function getFreeTTS(config: LocalTTSConfig, params: any): Promise<any>;
} 