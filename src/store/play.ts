import axios from 'axios';
import { PromptGPT } from "@/types/prompGPT";
import { createBatchTask, getBatchTaskStatus, deleteBatchTask } from '@/api/tts';
// 移除SDK导入，改用REST API
// import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';

// 用于Web环境的 TTS 接口
interface TTSParams {
  api: number;
  voiceData: {
    activeIndex: string;
    ssmlContent: string;
    inputContent: string;
    retryCount: number;
    retryInterval: number;
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
}

async function getTTSData(params: TTSParams): Promise<TTSResponse> {
  const { api, voiceData, speechKey, region, thirdPartyApi, tts88Key } = params;
  const { activeIndex, ssmlContent, inputContent, retryCount = 3, retryInterval = 1 } = voiceData;
  
  // 记录日志
  console.log("TTS API请求", { api, activeIndex, retryCount, retryInterval });
  
  // 根据API类型处理
  try {
    switch(api) {
      case 3: // Azure Speech API
        if (!speechKey || !region) {
          throw new Error("Azure Speech API密钥或区域未配置");
        }
        
        // 确保使用 SSML 内容，如果 ssmlContent 存在则优先使用
        let azureContent = ssmlContent;
        
        // 如果没有 SSML 内容但有普通文本，则生成简单的 SSML
        if (!azureContent && inputContent) {
          azureContent = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="zh-CN">
            <voice name="zh-CN-XiaoxiaoNeural">
              ${inputContent}
            </voice>
          </speak>`;
        }
        
        // 确保有内容可发送
        if (!azureContent) {
          throw new Error("没有可以发送的内容");
        }
        
        return await callAzureSpeechRestAPI(azureContent, speechKey, region, retryCount, retryInterval);
        
      case 4: // TTS88 API
        // 确保使用 SSML 内容，如果 ssmlContent 存在则优先使用
        let content = ssmlContent;
        
        // 如果没有 SSML 内容但有普通文本，则生成简单的 SSML
        if (!content && inputContent) {
          content = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="zh-CN">
            <voice name="zh-CN-XiaoxiaoNeural">
              ${inputContent}
            </voice>
          </speak>`;
        }
        
        // 确保有内容可发送
        if (!content) {
          throw new Error("没有可以发送的内容");
        }
        
        return await callTTS88Api(content, tts88Key, thirdPartyApi, retryCount, retryInterval);
      
      case 5: // 本地TTS服务
        console.log("使用本地TTS服务");
        // 导入本地TTS服务相关功能
        const { useLocalTTSStore } = await import('@/store/local-tts-store');
        const localTTSStore = useLocalTTSStore();
        
        if (!localTTSStore.config.enabled || !localTTSStore.config.baseUrl) {
          throw new Error("本地TTS服务未启用或未配置");
        }
        
        // 使用本地TTS服务的getAudioStream方法
        const isSSML = activeIndex === "1"; // 判断是否为SSML内容
        const localContent = isSSML ? ssmlContent : inputContent;
        
        if (!localContent) {
          throw new Error("没有可转换的内容");
        }
        
        try {
          // 获取音频URL
          const audioUrl = await localTTSStore.getAudioStream(
            localContent,
            undefined, // 使用默认voice
            undefined, // 使用默认language
            "mp3",
            isSSML
          );
          
          if (!audioUrl) {
            throw new Error("获取本地TTS音频失败");
          }
          
          // 返回可播放的URL
          return {
            audibleUrl: audioUrl
          };
        } catch (localError: any) {
          throw new Error(`本地TTS服务错误: ${localError.message}`);
        }
      
      default:
        throw new Error(`不支持的API类型: ${api}，Web版本仅支持Azure Speech API、TTS88 API和本地TTS服务`);
    }
  } catch (error) {
    console.error("TTS转换失败:", error);
    throw error;
  }
}

// 使用REST API调用Azure Speech服务
async function callAzureSpeechRestAPI(
  ssml: string,
  speechKey: string,
  region: string,
  retryCount: number = 3,
  retryInterval: number = 1
): Promise<TTSResponse> {
  console.log('开始调用 Azure Speech REST API 函数');
  console.log('参数:', {
    speechKey: speechKey ? '已提供' : '未提供',
    region,
    retryCount,
    retryInterval
  });
  
  if (!speechKey || !region) {
    console.error('Azure Speech API 密钥或区域未配置');
    throw new Error("Azure Speech API 密钥或区域未配置");
  }
  
  let retry = 0;
  let lastError;
  
  while (retry < retryCount) {
    try {
      console.log(`尝试调用 Azure Speech REST API (尝试 ${retry + 1}/${retryCount})`);
      
      const url = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
      
      const headers = {
        'Ocp-Apim-Subscription-Key': speechKey,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
        'User-Agent': 'tts-vue-web'
      };
      
      console.log('请求头:', headers);
      
      // 直接发送SSML内容作为XML
      console.log('发送请求到:', url);
      const response = await axios.post(
        url,
        ssml,
        {
          headers,
          responseType: 'arraybuffer'
        }
      );
      
      console.log(`Azure API响应状态: ${response.status}`);
      console.log('响应头:', response.headers);
      console.log('响应数据大小:', response.data ? response.data.byteLength : 0, '字节');
      
      if (response.status === 200) {
        console.log('请求成功，返回音频数据');
        return { buffer: response.data };
      } else {
        console.error(`API返回错误状态码: ${response.status}`);
        throw new Error(`API返回错误: ${response.status}`);
      }
    } catch (error: any) {
      console.error(`Azure Speech REST API调用失败 (尝试 ${retry + 1}/${retryCount}):`, error);
      
      // 如果有响应，尝试将其转换为文本
      if (error.response) {
        console.error('错误响应状态:', error.response.status);
        console.error('错误响应头:', error.response.headers);
        
        if (error.response.data) {
          try {
            const decoder = new TextDecoder();
            const errorText = decoder.decode(error.response.data);
            console.error('API错误详情:', errorText);
          } catch (e) {
            console.error('无法解析错误详情:', e);
          }
        }
      }
      
      lastError = error;
      console.log(`等待 ${retryInterval} 秒后重试...`);
      await sleep(retryInterval * 1000);
      retry++;
    }
  }
  
  console.error('达到最大重试次数，放弃请求');
  throw lastError || new Error("未知错误");
}

// 调用TTS88 API
async function callTTS88Api(
  ssml: string,
  apiKey?: string,
  apiUrl?: string,
  retryCount: number = 3,
  retryInterval: number = 1
): Promise<TTSResponse> {
  console.log('开始调用 callTTS88Api 函数');
  console.log('参数:', {
    apiKeyProvided: !!apiKey,
    apiUrl,
    retryCount,
    retryInterval
  });
  
  if (!apiUrl) {
    console.error('TTS88 API URL未配置');
    throw new Error("TTS88 API URL未配置");
  }
  
  // 输出调试信息
  console.log("准备发送SSML内容:", ssml);
  console.log("API URL:", apiUrl);
  console.log("认证信息:", apiKey ? '已提供' : '未提供');
  
  let retry = 0;
  let lastError;
  
  while (retry < retryCount) {
    try {
      console.log(`尝试调用 TTS88 API (尝试 ${retry + 1}/${retryCount})`);
      
      const headers = {
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
        ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
      };
      
      console.log('请求头:', headers);
      
      // 直接发送SSML内容作为XML
      console.log('发送请求到:', apiUrl);
      const response = await axios.post(
        apiUrl,
        ssml,
        {
          headers,
          responseType: 'arraybuffer'
        }
      );
      
      console.log(`TTS88 API响应状态: ${response.status}`);
      console.log('响应头:', response.headers);
      console.log('响应数据大小:', response.data ? response.data.byteLength : 0, '字节');
      
      if (response.status === 200) {
        console.log('请求成功，返回音频数据');
        return { buffer: response.data };
      } else {
        console.error(`API返回错误状态码: ${response.status}`);
        throw new Error(`API返回错误: ${response.status}`);
      }
    } catch (error: any) {
      console.error(`TTS88 API调用失败 (尝试 ${retry + 1}/${retryCount}):`, error);
      console.error('错误详情:', error.message);
      console.error('请求配置:', error.config);
      
      // 如果有响应，尝试将其转换为文本
      if (error.response) {
        console.error('错误响应状态:', error.response.status);
        console.error('错误响应头:', error.response.headers);
        
        if (error.response.data) {
          try {
            const decoder = new TextDecoder();
            const errorText = decoder.decode(error.response.data);
            console.error('API错误详情:', errorText);
          } catch (e) {
            console.error('无法解析错误详情:', e);
          }
        }
      } else if (error.request) {
        console.error('未收到响应，请求内容:', error.request);
      } else {
        console.error('请求设置错误:', error.message);
      }
      
      lastError = error;
      console.log(`等待 ${retryInterval} 秒后重试...`);
      await sleep(retryInterval * 1000);
      retry++;
    }
  }
  
  console.error('达到最大重试次数，放弃请求');
  throw lastError || new Error("未知错误");
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
