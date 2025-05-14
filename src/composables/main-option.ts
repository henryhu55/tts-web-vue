// @ts-nocheck
import { ref, reactive, watch, onMounted, computed } from "vue";
import { optionsConfig as oc } from "@/components/main/options-config";
import { getStyleDes, getRoleDes } from "@/components/main/emoji-config";
import { ElMessage, ElMessageBox } from "element-plus";
import { useTtsStore } from "@/store/store";
import { useFreeTTSstore } from "@/store/play";
import { FreeTTSErrorType } from '@/store/play';
import { storeToRefs } from "pinia";
import { useI18n } from 'vue-i18n';
import WebStore from "@/store/web-store";
import { getTTSData } from "@/store/play";
import { DEFAULT_LOCAL_TTS_CONFIG } from "@/api/local-tts";
import { getChineseName } from "@/voice-utils"; // 导入声音工具函数

// 定义返回类型接口，包含所有导出的属性和方法
interface MainOptionsReturn {
  formConfig: any;
  localTTSStore: ReturnType<typeof useFreeTTSstore>;
  oc: any;
  t: any;
  presets: any[];
  currentPreset: any;
  applyPreset: (presetId: string) => void;
  currentView: any;
  voiceSelectList: any;
  voiceStyleSelectList: any;
  rolePlayList: any;
  getChineseName: typeof getChineseName;
  getStyleDes: typeof getStyleDes;
  getRoleDes: typeof getRoleDes;
  apiChange: (res: number) => void;
  languageSelectChange: (value: string) => void;
  voiceSelectChange: (value: string) => void;
  audition: (value: string) => Promise<void>;
  handleVoiceSettingChange: () => void;
  handleRefreshConnection: () => Promise<void>;
  handleErrorAction: (errorCode: FreeTTSErrorType) => void;
  percentFormat: (percentage: number) => string;
  formatResetTime: (timestamp: number) => string;
  isConnecting: any;
  showAdvancedSettings: any;
  saveAdvancedSettings: () => void;
  apiEdge: any;
  handleBatchDownload: () => void;
  handleSaveToCloud: () => void;
  updateSSML: () => void;
  toggleFreeTTSInfo: () => void;
  showFreeTTSInfo: any;
}

export function useMainOptions(props = { inDrawer: false }, emit?: any): MainOptionsReturn {
const { t } = useI18n();
const ttsStore = useTtsStore();
const localTTSStore = useFreeTTSstore();
const { page, inputs, tableData, isLoading } = storeToRefs(ttsStore);
const { formConfig, config } = storeToRefs(ttsStore);
const webstore = new WebStore();

// 控制弹出框显示
const showAdvancedSettings = ref(false);

// 添加展开/收起状态控制
const showFreeTTSInfo = ref(true);

// 切换显示/隐藏免费TTS信息
const toggleFreeTTSInfo = () => {
  showFreeTTSInfo.value = !showFreeTTSInfo.value;
};

// 保存高级设置
const saveAdvancedSettings = () => {
  try {
    // 保存配置到本地存储
    localTTSStore.saveConfig();
    
    // 关闭对话框
    showAdvancedSettings.value = false;
    
    // 显示成功提示
    ElMessage({
      message: '设置已保存',
      type: 'success',
      duration: 2000
    });
    
    // 重新检查连接
    handleCheckConnection();
  } catch (error) {
    ElMessage({
      message: '保存设置失败: ' + (error instanceof Error ? error.message : String(error)),
      type: 'error',
      duration: 3000
    });
  }
};

// 应用预设配置
const applyPreset = (presetId: string) => {
  const preset = presets.find(p => p.id === presetId);
  if (!preset) return;
  
  // 保留原有语音和语言设置
  const voice = formConfig.value.voiceSelect;
  const language = formConfig.value.languageSelect;
  const api = formConfig.value.api;
  
  // 应用预设配置
  Object.entries(preset.config).forEach(([key, value]) => {
    // 使用类型断言
    (formConfig.value as any)[key] = value;
  });
  
  // 恢复语音和语言设置
  formConfig.value.voiceSelect = voice;
  formConfig.value.languageSelect = language;
  formConfig.value.api = api;
  
  ElMessage({
    message: t('options.presetApplied'),
    type: 'success',
    duration: 2000,
  });
};

const apiEdge = ref(false);

// 当前视图（额度信息/高级配置）
const currentView = ref('quota'); // 默认显示额度信息

// 连接状态
const isConnecting = ref(false);

// 预设风格配置
const presets = [
  {
    id: 'default',
    name: t('options.presetDefault'),
    icon: 'DocumentChecked',
    config: {
      voiceStyleSelect: 'Default',
      role: '',
      intensity: 'default',
      volume: 'default',
      silence: 'default',
      speed: 1,
      pitch: 1
    }
  },
  {
    id: 'news',
    name: t('options.presetNews'),
    icon: 'Mic',
    config: {
      voiceStyleSelect: 'newscast',
      role: '',
      intensity: '1.5',
      volume: 'strong',
      silence: 'default',
      speed: 1.1,
      pitch: 1.05
    }
  },
  {
    id: 'story',
    name: t('options.presetStory'),
    icon: 'Collection',
    config: {
      voiceStyleSelect: 'narration-relaxed',
      role: '',
      intensity: '1.5',
      volume: 'default',
      silence: '200ms',
      speed: 0.9,
      pitch: 1
    }
  },
  {
    id: 'poetry',
    name: t('options.presetPoetry'),
    icon: 'Reading',
    config: {
      voiceStyleSelect: 'poetry-reading',
      role: '',
      intensity: '1.5',
      volume: 'default',
      silence: '500ms',
      speed: 0.85,
      pitch: 1
    }
  },
  {
    id: 'excited',
    name: t('options.presetExcited'),
    icon: 'Lightning',
    config: {
      voiceStyleSelect: 'excited',
      role: '',
      intensity: '2',
      volume: 'strong',
      silence: 'default',
      speed: 1.2,
      pitch: 1.2
    }
  },
  {
    id: 'sad',
    name: t('options.presetSad'),
    icon: 'Cloudy',
    config: {
      voiceStyleSelect: 'sad',
      role: '',
      intensity: '1.5',
      volume: 'weak',
      silence: '200ms',
      speed: 0.8,
      pitch: 0.9
    }
  },
  // 新增预设
  {
    id: 'business',
    name: t('options.presetBusiness'),
    icon: 'Briefcase',
    config: {
      voiceStyleSelect: 'narration-professional',
      role: '',
      intensity: 'strong',
      volume: 'medium',
      silence: '100ms',
      speed: 1.1,
      pitch: 1
    }
  },
  {
    id: 'friendly',
    name: t('options.presetFriendly'),
    icon: 'ChatDotRound',
    config: {
      voiceStyleSelect: 'friendly',
      role: '',
      intensity: 'normal',
      volume: 'medium',
      silence: '200ms',
      speed: 1,
      pitch: 1.05
    }
  },
  {
    id: 'customer-service',
    name: t('options.presetCustomerService'),
    icon: 'Service',
    config: {
      voiceStyleSelect: 'customerservice',
      role: '',
      intensity: 'normal',
      volume: 'medium',
      silence: '100ms',
      speed: 1,
      pitch: 1
    }
  },
  {
    id: 'advertisement',
    name: t('options.presetAdvertisement'),
    icon: 'Promotion',
    config: {
      voiceStyleSelect: 'advertisement_upbeat',
      role: '',
      intensity: 'strong',
      volume: 'strong',
      silence: '100ms',
      speed: 1.2,
      pitch: 1.1
    }
  }
];

// 当前选中的预设
const currentPreset = ref('');

// 设置默认配置值
onMounted(() => {
  // 合并默认配置和已有配置，已有配置优先生效
  localTTSStore.config = {
    ...DEFAULT_LOCAL_TTS_CONFIG,
    ...localTTSStore.config
  };
  localTTSStore.saveConfig();
});

onMounted(() => {
  // 初始化新增配置项的默认值
  if (!formConfig.value.intensity) {
    formConfig.value.intensity = "default";
  }
  if (!formConfig.value.silence) {
    formConfig.value.silence = "default";
  }
  if (!formConfig.value.volume) {
    formConfig.value.volume = "default";
  }
  if (!formConfig.value.autoPreview) {
    formConfig.value.autoPreview = false; // 设置自动预览的默认值为false
  }
  
  // 只有在API未设置时才设置为免费TTS服务
  if (!formConfig.value.api) {
    formConfig.value.api = 5;
  }
  
  // 如果当前使用的是免费TTS服务，自动检查连接和获取额度
  if (formConfig.value.api === 5) {
    localTTSStore.checkServerConnection().then(connected => {
      if (connected) {
        // 获取免费额度信息
        localTTSStore.getFreeLimitInfo();
        
        // 提示用户正在使用免费服务
        ElMessage({
          message: "您正在使用免费TTS服务，无需API密钥即可开始使用",
          type: "success",
          duration: 3000,
        });
      }
    });
  }
  
  // 手动触发一次SSML更新
  updateSSML();

  // 默认显示主播模式
  currentViewMode.value = 'anchors';
});

const apiChange = (res: number) => {
  if (res === 1 && config.value.speechKey === "") {
    ElMessage({
      message: "请先在设置中配置 Microsoft Speech API Key，或者推荐使用免费TTS服务",
      type: "warning",
      duration: 4000,
    });
    // 如果没有配置 key，自动切换回免费TTS服务
    formConfig.value.api = 5;
    return;
  } else if (res === 2) {
    apiEdge.value = true;
    ElMessage({
      message: t('options.edgeApiWarning'),
      type: "warning",
      duration: 4000,
    });
  } else if (res === 3 && (config.value.speechKey === "" || config.value.serviceRegion === "")) {
    ElMessage({
      message: "请先在设置中配置 Azure Speech API Key 和区域",
      type: "warning",
      duration: 4000,
    });
    // 如果没有配置 key，自动切换回免费TTS服务
    formConfig.value.api = 5;
    return;
  } else if (res === 4 && config.value.thirdPartyApi === "") {
    ElMessage({
      message: "请先在设置中配置TTS88 API地址",
      type: "warning",
      duration: 4000,
    });
    // 如果没有配置 API 地址，自动切换回免费TTS服务
    formConfig.value.api = 5;
    return;
  } else if (res === 4 && config.value.thirdPartyApi !== "") {
    // TTS88 API提示
    ElMessage({
      message: "您已选择TTS88 API，可以无限制使用",
      type: "success",
      duration: 3000,
    });
  } else if (res === 5) {
    // 免费TTS服务
    if (!localTTSStore.config.enabled) {
      // 自动启用
      localTTSStore.config.enabled = true;
      localTTSStore.saveConfig();
    }
    
    // 检查免费TTS服务连接状态
    localTTSStore.checkServerConnection().then(connected => {
      if (connected) {
        ElMessage({
          message: "已连接到免费TTS服务",
          type: "success",
          duration: 2000,
        });
        
        // 获取免费额度信息
        localTTSStore.getFreeLimitInfo().then(freeLimit => {
          if (freeLimit && freeLimit.remaining <= 0) {
            ElMessage({
              message: "您的免费额度已用完，请等待下次重置或者使用其他API",
              type: "warning",
              duration: 4000,
            });
          }
        });
      } else {
        ElMessage({
          message: "无法连接到免费TTS服务，请检查网络连接",
          type: "error",
          duration: 4000,
        });
      }
    });
  }
  apiEdge.value = false;
};

const audition = async (value: string) => {
  // 创建临时的SSML用于试听
  const tempInput = inputs.value.inputValue;
  const tempSSML = inputs.value.ssmlValue;
  
  try {
    // 使用试听文本生成SSML
    inputs.value.inputValue = webstore.get("audition") || "你好，这是一段试听文本。";
    formConfig.value.voiceSelect = value;
    ttsStore.setSSMLValue();
    
    // 开始转换并播放
    const voiceData = {
      activeIndex: page.value.tabIndex,
      ssmlContent: inputs.value.ssmlValue,
      inputContent: inputs.value.inputValue,
      retryCount: config.value.retryCount,
      retryInterval: config.value.retryInterval,
    };
    
    // 检查API相关配置
    if (formConfig.value.api === 4 && !config.value.thirdPartyApi) {
      ElMessage({
        message: "请先在设置中配置TTS88 API地址",
        type: "error",
        duration: 3000,
      });
      return;
    }
    
    // 获取TTS数据
    const res = await getTTSData({
      api: formConfig.value.api,
      voiceData,
      speechKey: config.value.speechKey,
      region: config.value.serviceRegion,
      thirdPartyApi: config.value.thirdPartyApi,
      tts88Key: config.value.tts88Key,
    });
    
    if (res) {
      // 检查错误
      if (res.error) {
        // 根据错误代码提供适当的反馈
        switch (res.errorCode) {
          case 'QUOTA_EXCEEDED':
            // 免费额度已用完
            ElMessage({
              message: res.error,
              type: "warning",
              duration: 4000,
            });
            // 可以建议切换到其他API
            ElMessageBox.confirm(
              '您的免费额度已用完，是否切换到其他API类型？', 
              '额度已用完', 
              {
                confirmButtonText: '切换API',
                cancelButtonText: '稍后处理',
                type: 'warning'
              }
            ).then(() => {
              // 切换到API类型1（如果配置了speechKey）
              if (config.value.speechKey) {
                formConfig.value.api = 3;
                ElMessage({
                  message: "已切换到Azure API",
                  type: "success",
                  duration: 2000,
                });
              } else if (config.value.thirdPartyApi) {
                formConfig.value.api = 4;
                ElMessage({
                  message: "已切换到TTS88 API",
                  type: "success",
                  duration: 2000,
                });
              }
            }).catch(() => {});
            break;
            
          case 'RATE_LIMITED':
            // 请求过于频繁
            ElMessage({
              message: res.error,
              type: "warning",
              duration: 3000,
            });
            break;
            
          case 'AUTH_ERROR':
            // 认证错误
            ElMessage({
              message: res.error,
              type: "error",
              duration: 3000,
            });
            break;
            
          case 'LOCAL_TTS_CONNECTION_FAILED':
            // 连接本地TTS服务失败
            ElMessage({
              message: res.error,
              type: "error",
              duration: 3000,
            });
            // 提示用户检查连接
            ElMessageBox.confirm(
              '无法连接到本地TTS服务，是否刷新连接？', 
              '连接失败', 
              {
                confirmButtonText: '刷新连接',
                cancelButtonText: '取消',
                type: 'warning'
              }
            ).then(() => {
              handleRefreshConnection();
            }).catch(() => {});
            break;
            
          default:
            // 其他错误
            ElMessage({
              message: res.error,
              type: "error",
              duration: 3000,
            });
        }
        return;
      }
      
      // 成功情况下的处理
      if (res.buffer) {
        const audioBlob = new Blob([res.buffer], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        ttsStore.audition(audioUrl);
      } else if (res.audibleUrl) {
        ttsStore.audition(res.audibleUrl);
      }
    }
  } catch (err) {
    console.error('试听失败:', err);
    ElMessage({
      message: "试听失败: " + (err instanceof Error ? err.message : String(err)),
      type: "error",
      duration: 2000,
    });
  } finally {
    // 恢复原始输入
    inputs.value.inputValue = tempInput;
    inputs.value.ssmlValue = tempSSML;
  }
};

// 更新SSML内容的函数
function updateSSML() {
  if (!formConfig.value || !formConfig.value.voiceSelect) {
    return;
  }
  
  // 提取所需的值
  const config = formConfig.value;
  
  // 准备样式属性
  let styleAttr = "";
  if (config.voiceStyleSelect) {
    styleAttr = 'style="' + config.voiceStyleSelect + '"';
  }
  
  // 准备角色属性
  let roleAttr = "";
  if (config.role) {
    roleAttr = 'role="' + config.role + '"';
  }
  
  // 准备强度属性
  let intensityAttr = "";
  if (config.intensity && config.intensity !== "default") {
    // 将字符串强度值转换为对应的数值
    let intensityValue = "";
    if (config.intensity === "weak") intensityValue = "0.5";
    else if (config.intensity === "strong") intensityValue = "1.5";
    else if (config.intensity === "extraStrong") intensityValue = "2";
    else intensityValue = config.intensity; // 如果已经是数值则直接使用
    
    intensityAttr = 'styledegree="' + intensityValue + '"';
  }
  
  // 准备音量属性 - 移至 prosody 元素
  let volumeAttr = "";
  if (config.volume && config.volume !== "default") {
    // 定义音量值映射
    let volumeMapping: {[key: string]: string} = {
      "extraWeak": "x-soft",
      "weak": "soft", 
      "strong": "loud",
      "extraStrong": "x-loud"
    };
    
    volumeAttr = 'volume="' + (volumeMapping[config.volume] || config.volume) + '"';
  }
  
  // 准备静音配置
  let silenceConfig = "";
  if (config.silence && config.silence !== "default") {
    silenceConfig = '<break time="' + config.silence + '" />';
  }
  
  // 计算速率和音调
  const rateValue = (config.speed * 100).toFixed(); // 直接使用速度值乘以100
  const pitchValue = (config.pitch * 100 - 100).toFixed(); // 将音调值转换为百分比变化
  
  // 生成完整的SSML - 修改命名空间为https
  const ssml = '<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="en-US">' +
    '<voice name="' + config.voiceSelect + '">' +
    '<mstts:express-as ' + styleAttr + ' ' + roleAttr + ' ' + intensityAttr + '>' +
    '<prosody rate="' + rateValue + '%" pitch="' + pitchValue + '%" ' + volumeAttr + '>' +
    silenceConfig + inputs.value.inputValue +
    '</prosody>' +
    '</mstts:express-as>' +
    '</voice>' +
    '</speak>';
  
  inputs.value.ssmlValue = ssml;
}

// 监听表单配置的变化，并更新SSML
watch(formConfig, (newVal, oldVal) => {
  updateSSML();
  
  // 检查是否是语音相关设置发生变化
  const voiceSettings = [
    'speed', 
    'pitch', 
    'volume', 
    'intensity', 
    'silence', 
    'voiceStyleSelect', 
    'role',
    'languageSelect',
    'voiceSelect'
  ];
  
  // 更详细的变化检测
  const hasVoiceSettingChanged = voiceSettings.some(key => {
    // 特别处理数值类型的参数
    if (key === 'speed' || key === 'pitch') {
      return Math.abs(newVal[key] - oldVal[key]) > 0.001; // 使用小数点比较来避免浮点数精度问题
    }
    return newVal[key] !== oldVal[key];
  });
  
  // 如果语音设置发生变化且启用了自动预览，则触发预览
  if (hasVoiceSettingChanged && newVal.autoPreview) {
    console.log('检测到语音设置变化，准备触发预览');
    // 使用防抖，避免频繁触发预览
    if (previewDebounceTimer) {
      clearTimeout(previewDebounceTimer);
    }
    previewDebounceTimer = setTimeout(() => {
      console.log('触发自动预览');
      ttsStore.autoPreview();
    }, 1000); // 1秒后触发预览
  }
}, { deep: true });

// 添加防抖定时器
let previewDebounceTimer: any = null;

// 自动预览开关处理
const handleAutoPreview = () => {
  if (formConfig.value.autoPreview) {
    // 开启自动预览时，立即触发一次预览
    ttsStore.autoPreview();
  }
};

// 批量下载
const handleBatchDownload = () => {
  // 实现批量下载逻辑
};

// 保存到云端
const handleSaveToCloud = () => {
  // 实现保存到云端逻辑
};

const voiceSelectList = ref(
  oc.findVoicesByLocaleName(formConfig.value.languageSelect)
);

const languageSelectChange = (value: string) => {
  formConfig.value.voiceSelect = "";
  formConfig.value.voiceStyleSelect = "";
  formConfig.value.role = "";
  voiceSelectList.value = oc.findVoicesByLocaleName(value);
};

const defaultVoice = voiceSelectList.value.find(
  (item: any) => item.ShortName == formConfig.value.voiceSelect
);

const voiceStyleSelectListInit = defaultVoice?.VoiceStyleNames?.split(",") || [];
const voiceStyleSelectList: any = ref(voiceStyleSelectListInit);

const rolePlayListInit = defaultVoice?.VoiceRoleNames?.split(",") || [];
const rolePlayList: any = ref(rolePlayListInit);

const voiceSelectChange = (value: string) => {
  const voice = voiceSelectList.value.find(
    (item: any) => item.ShortName == formConfig.value.voiceSelect
  );
  
  // 获取可用的语音样式列表
  const availableStyles = voice?.VoiceStyleNames?.split(",") || [];
  voiceStyleSelectList.value = availableStyles;
  
  // 获取可用的角色列表
  rolePlayList.value = voice?.VoiceRoleNames?.split(",") || [];
  
  // 保存当前选择的样式
  const currentStyle = formConfig.value.voiceStyleSelect;
  
  // 检查当前选择的样式是否在可用列表中
  if (availableStyles.length > 0) {
    if (!availableStyles.includes(currentStyle) || !currentStyle) {
      // 如果当前样式不可用或未设置，则选择第一个可用样式
      formConfig.value.voiceStyleSelect = availableStyles[0];
    }
    // 如果当前样式可用，保持不变
  } else {
    // 如果没有可用样式，使用Default
    formConfig.value.voiceStyleSelect = 'Default';
  }
  
  // 如果角色不在可用列表中，选择第一个可用角色或清空
  const currentRole = formConfig.value.role;
  if (rolePlayList.value.length > 0) {
    if (!rolePlayList.value.includes(currentRole)) {
      formConfig.value.role = rolePlayList.value[0];
    }
  } else {
    formConfig.value.role = '';
  }
};

const configChange = (val: string) => {
  formConfig.value = config.value.formConfigJson[val];
};

// 视图模式切换
const currentViewMode = ref('anchors'); // 'anchors' 或 'custom'

// 切换到自定义模式
const switchToCustom = () => {
  currentViewMode.value = 'custom';
};

// 切换到主播模式
const switchToAnchors = () => {
  currentViewMode.value = 'anchors';
};

// 语音主播相关
const selectedCategory = ref('all');
const searchText = ref('');
const selectedAnchor = ref('');

// 定义语音主播分类
const voiceCategories = [
  { value: 'all', label: '全部' },
  { value: 'hot', label: '超热门' },
  { value: 'emotion', label: '超情感' },
  { value: 'realistic', label: '超逼真' },
  { value: 'broadcast', label: '大规模' },
  { value: 'games', label: '金牌主播' },
  { value: 'movie', label: '影视解说' },
  { value: 'cute', label: '小说推文/朗读' },
  { value: 'drama', label: '娱乐模仿' },
  { value: 'ad', label: '广告宣传' },
  { value: 'radio', label: '声音' },
  { value: 'female', label: '女声' },
  { value: 'male', label: '特色/方言' },
];


// 添加加载状态
const checkingConnection = ref(false);
const refreshingQuota = ref(false);

// 处理检查连接
const handleCheckConnection = async () => {
  checkingConnection.value = true;
  try {
    const connected = await localTTSStore.checkServerConnection();
    if (connected) {
      ElMessage({
        message: "已成功连接到免费TTS服务",
        type: "success",
        duration: 2000
      });
    } else {
      ElMessage({
        message: "无法连接到免费TTS服务，请检查网络连接",
        type: "error",
        duration: 3000
      });
    }
  } catch (error) {
    ElMessage({
      message: "检查连接失败: " + (error instanceof Error ? error.message : String(error)),
      type: "error",
      duration: 3000
    });
  } finally {
    checkingConnection.value = false;
  }
};

// 处理刷新额度
const handleRefreshQuota = async () => {
  refreshingQuota.value = true;
  try {
    const quota = await localTTSStore.getFreeLimitInfo();
    if (quota) {
      ElMessage({
        message: `额度信息已更新，剩余${quota.remaining}字符`,
        type: "success",
        duration: 2000
      });
    } else {
      ElMessage({
        message: "获取额度信息失败",
        type: "error",
        duration: 3000
      });
    }
  } catch (error) {
    ElMessage({
      message: "刷新额度失败: " + (error instanceof Error ? error.message : String(error)),
      type: "error",
      duration: 3000
    });
  } finally {
    refreshingQuota.value = false;
  }
};

const quotaProgressColor = computed(() => {
  const percentage = ((localTTSStore.serverStatus.freeLimit?.used || 0) / (localTTSStore.serverStatus.freeLimit?.free_limit || 50000) * 100);
  if (percentage >= 90) return '#F56C6C';
  if (percentage >= 70) return '#E6A23C';
  return '#67C23A';
});

const isTestPlaying = ref(false);

// 测试播放功能
const handleTestPlay = async () => {
  if (isTestPlaying.value) return;
  
  isTestPlaying.value = true;
  try {
    const testText = "这是一段测试语音，用于测试免费TTS服务的效果。";
    
    // 使用本地TTS服务的getAudioStream方法
    const audioUrl = await localTTSStore.getAudioStream(
      testText,
      undefined, // 使用默认voice
      undefined, // 使用默认language
      "mp3",
      false
    );
    
    if (!audioUrl) {
      throw new Error("获取测试音频失败");
    }
    
    // 播放音频
    ttsStore.audition(audioUrl);
    
    ElMessage({
      message: "正在播放测试音频",
      type: "success",
      duration: 2000
    });
  } catch (error: any) {
    ElMessage({
      message: `测试播放失败: ${error.message}`,
      type: "error",
      duration: 3000
    });
  } finally {
    isTestPlaying.value = false;
  }
};

// 添加处理函数
const handleVoiceSettingChange = () => {
  if (formConfig.value.autoPreview) {
    // 使用防抖，避免频繁触发预览
    if (previewDebounceTimer) {
      clearTimeout(previewDebounceTimer);
    }
    previewDebounceTimer = setTimeout(() => {
      console.log('触发自动预览');
      ttsStore.autoPreview();
    }, 1000); // 1秒后触发预览
  }
};

// 处理刷新连接
const handleRefreshConnection = async () => {
  isConnecting.value = true;
  try {
    // 重置错误状态
    localTTSStore.resetErrorState();
    
    // 检查连接
    const connected = await localTTSStore.checkServerConnection();
    
    if (connected) {
      // 连接成功，获取额度信息
      const freeLimit = await localTTSStore.getFreeLimitInfo();
      
      if (freeLimit) {
        ElMessage({
          message: '已成功连接到免费TTS服务并更新额度信息',
          type: 'success',
          duration: 2000
        });
      }
    }
  } catch (error) {
    console.error('连接服务器失败:', error);
  } finally {
    isConnecting.value = false;
  }
};

// 处理错误操作
const handleErrorAction = (errorCode: FreeTTSErrorType) => {
  if (errorCode === FreeTTSErrorType.QUOTA_EXCEEDED) {
    // 显示额度重置倒计时
    const resetTime = localTTSStore.serverStatus.freeLimit?.reset_at;
    if (resetTime) {
      const resetDate = new Date(resetTime * 1000);
      const now = new Date();
      const diffHours = Math.ceil((resetDate.getTime() - now.getTime()) / (1000 * 60 * 60));
      
      ElMessage({
        message: `免费额度将在 ${diffHours} 小时后重置`,
        type: 'info',
        duration: 5000
      });
    }
  }
};

// 格式化剩余时间
const formatResetTime = (timestamp: number): string => {
  if (!timestamp) return '-';
  
  const resetDate = new Date(timestamp * 1000);
  const now = new Date();
  
  // 计算剩余时间
  const diffMs = resetDate.getTime() - now.getTime();
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
  
  if (diffHours < 24) {
    return `今天 ${resetDate.getHours().toString().padStart(2, '0')}:${resetDate.getMinutes().toString().padStart(2, '0')} (${diffHours}小时后)`;
  } else {
    return resetDate.toLocaleString();
  }
};

// 百分比格式化
const percentFormat = (percentage: number) => {
  return `${percentage.toFixed(1)}%`;
};

  return {
    // 核心数据与状态
    formConfig: formConfig.value, 
    localTTSStore,
    oc,
    t,
    
    // 预设相关
    presets,
    currentPreset,
    applyPreset,
    
    // 视图模式
    currentView,
    
    // 语音主播相关
    voiceSelectList,
    voiceStyleSelectList,
    rolePlayList,
    getChineseName,
    getStyleDes,
    getRoleDes,
    
    // 方法处理
    apiChange,
    languageSelectChange,
    voiceSelectChange,
    audition,
    handleVoiceSettingChange,
    
    // 免费TTS功能
    handleRefreshConnection,
    handleErrorAction,
    percentFormat,
    formatResetTime,
    isConnecting,
    
    // 高级设置
    showAdvancedSettings,
    saveAdvancedSettings,
    apiEdge,
    
    // 输出相关功能
    handleBatchDownload,
    handleSaveToCloud,
    
    // 辅助功能
    updateSSML,
    toggleFreeTTSInfo,
    showFreeTTSInfo
  };
}