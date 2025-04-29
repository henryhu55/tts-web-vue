<template>
  <div class="modern-options">
    <div class="options-header">
      <h2 class="options-title" @click="toggleOptions">
        {{ t('options.voiceSettings') }}
        <el-icon class="toggle-icon" :class="{ 'is-expanded': isExpanded }"><ArrowDown /></el-icon>
      </h2>
      
      <div class="start-button-wrapper">
        <span class="convert-tip" v-if="!isLoading">{{ t('options.readyToConvert') }}</span>
        <span class="convert-tip" v-else>{{ t('options.converting') }}</span>
        <el-button type="primary" @click="startBtn" class="start-button" :loading="isLoading">
          <el-icon><CaretRight /></el-icon>
          {{ t('options.startConversion') }}
        </el-button>
      </div>
    </div>
    
    <el-collapse-transition>
      <div v-show="isExpanded">
        <!-- 语音主播选择面板 -->
        <div class="voice-anchor-panel" v-if="currentViewMode === 'anchors'">
          <!-- 使用新的VoiceSelector组件 -->
          <VoiceSelector />
          
          <!-- 切换到自定义模式 -->
          <div class="mode-switch">
            <el-button @click="switchToCustom" class="switch-button">
              <el-icon><Setting /></el-icon>
              {{ t('options.switchToCustom') }}
            </el-button>
          </div>
        </div>

        <!-- 原有的自定义设置面板 -->
        <div class="custom-settings-panel" v-if="currentViewMode === 'custom'">
          <el-form :model="formConfig" label-position="left" class="options-form">
            <div class="options-grid">
              <!-- 预设配置选择器 -->
              <div class="option-card">
                <div class="option-header">
                  <el-tooltip 
                    content="选择预设语音风格，快速应用多个配置" 
                    placement="top"
                    effect="light"
                  >
                    <div class="option-label">
                      <span>{{ t('options.preset') }}</span>
                      <el-icon><Star /></el-icon>
                    </div>
                  </el-tooltip>
                </div>
                <el-select
                  v-model="currentPreset"
                  :placeholder="t('options.selectPreset')"
                  class="option-select"
                  @change="applyPreset"
                >
                  <el-option 
                    v-for="preset in presets" 
                    :key="preset.id" 
                    :label="preset.name" 
                    :value="preset.id"
                  >
                    <div class="preset-option">
                      <el-icon><component :is="preset.icon" /></el-icon>
                      <span>{{ preset.name }}</span>
                    </div>
                  </el-option>
                </el-select>
              </div>

              <!-- API 选择 -->
              <div class="option-card">
                <div class="option-header">
                  <el-tooltip 
                    content="选择用于文本转语音的API服务" 
                    placement="top"
                    effect="light"
                  >
                    <div class="option-label">
                      <span>{{ t('options.api') }}</span>
                      <el-icon><Connection /></el-icon>
                    </div>
                  </el-tooltip>
                </div>
                <el-select
                  v-model="formConfig.api"
                  :placeholder="t('options.selectApi')"
                  @change="apiChange"
                  class="option-select"
                >
                  <el-option
                    v-for="item in oc.apiSelect"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </div>
              
              <!-- 语言选择 -->
              <div class="option-card">
                <div class="option-header">
                  <el-tooltip 
                    content="选择语音的语言" 
                    placement="top"
                    effect="light"
                  >
                    <div class="option-label">
                      <span>{{ t('options.language') }}</span>
                      <el-icon><ChatDotRound /></el-icon>
                    </div>
                  </el-tooltip>
                </div>
                <el-select-v2
                  class="option-select"
                  v-model="formConfig.languageSelect"
                  :placeholder="t('options.selectLanguage')"
                  filterable
                  :options="oc.languageSelect"
                  @change="languageSelectChange"
                >
                </el-select-v2>
              </div>
              
              <!-- 语音选择 -->
              <div class="option-card">
                <div class="option-header">
                  <el-tooltip 
                    content="选择要使用的语音人物" 
                    placement="top"
                    effect="light"
                  >
                    <div class="option-label">
                      <span>{{ t('options.voice') }}</span>
                      <el-icon><Microphone /></el-icon>
                    </div>
                  </el-tooltip>
                </div>
                <el-select
                  v-model="formConfig.voiceSelect"
                  :placeholder="t('options.selectVoice')"
                  @change="voiceSelectChange"
                  class="option-select"
                >
                  <el-option
                    v-for="item in voiceSelectList"
                    :key="item.ShortName"
                    :label="item.DisplayName + '-' + item.LocalName"
                    :value="item.ShortName"
                  >
                    <div class="voice-option">
                      <span>{{ item.DisplayName + "-" + item.LocalName }}</span>
                      <el-button
                        size="small"
                        type="primary"
                        circle
                        @click.stop="audition(item.ShortName)"
                      ><el-icon><CaretRight /></el-icon></el-button>
                    </div>
                  </el-option>
                </el-select>
              </div>
              
              <!-- 风格选择 -->
              <div class="option-card">
                <div class="option-header">
                  <el-tooltip 
                    content="选择语音的说话风格，如新闻播报、抒情等" 
                    placement="top"
                    effect="light"
                  >
                    <div class="option-label">
                      <span>{{ t('options.speakingStyle') }}</span>
                      <el-icon><Mic /></el-icon>
                    </div>
                  </el-tooltip>
                </div>
                <el-select
                  v-model="formConfig.voiceStyleSelect"
                  :placeholder="t('options.selectSpeakingStyle')"
                  :disabled="apiEdge"
                  class="option-select"
                >
                  <el-option
                    v-for="item in voiceStyleSelectList"
                    :key="item"
                    :label="getStyleDes(item)?.word || item"
                    :value="item"
                  >
                    <div class="style-option">
                      <span class="style-emoji">{{ getStyleDes(item)?.emoji }}</span>
                      <span>{{ getStyleDes(item)?.word || item }}</span>
                    </div>
                  </el-option>
                </el-select>
              </div>
              
              <!-- 角色选择 -->
              <div class="option-card">
                <div class="option-header">
                  <el-tooltip 
                    content="选择语音的角色扮演类型，如老年人、年轻人等" 
                    placement="top"
                    effect="light"
                  >
                    <div class="option-label">
                      <span>{{ t('options.rolePlaying') }}</span>
                      <el-icon><UserFilled /></el-icon>
                    </div>
                  </el-tooltip>
                </div>
                <el-select 
                  v-model="formConfig.role" 
                  :placeholder="t('options.selectRole')" 
                  :disabled="apiEdge"
                  class="option-select"
                >
                  <el-option
                    v-for="item in rolePlayList"
                    :key="item"
                    :label="getRoleDes(item)?.word || item"
                    :value="item"
                  >
                    <div class="style-option">
                      <span class="style-emoji">{{ getRoleDes(item)?.emoji }}</span>
                      <span>{{ getRoleDes(item)?.word || item }}</span>
                    </div>
                  </el-option>
                </el-select>
              </div>
            </div>
            
            <div class="sliders-section">
              <h3 class="sliders-title">{{ t('options.advancedSettings') }}</h3>
              
              <div class="sliders-grid">
                <!-- 强度滑块 -->
                <div class="slider-card">
                  <div class="slider-header">
                    <el-tooltip content="调整语音风格的强度程度" placement="top" effect="light">
                      <div class="option-label">
                        <span>{{ t('options.intensity') }}</span>
                        <el-icon><Aim /></el-icon>
                      </div>
                    </el-tooltip>
                    <span class="slider-value">{{ formConfig.intensity || 'default' }}</span>
                  </div>
                  <el-select
                    v-model="formConfig.intensity"
                    :placeholder="t('options.selectIntensity')"
                    :disabled="apiEdge"
                    class="option-select"
                  >
                    <el-option value="default" :label="t('options.default')"></el-option>
                    <el-option value="0.5" :label="t('options.weak')"></el-option>
                    <el-option value="1" :label="t('options.normal')"></el-option>
                    <el-option value="1.5" :label="t('options.strong')"></el-option>
                    <el-option value="2" :label="t('options.extraStrong')"></el-option>
                  </el-select>
                </div>
                
                <!-- 静音选择 -->
                <div class="slider-card">
                  <div class="slider-header">
                    <el-tooltip content="在文本中插入不同长度的停顿" placement="top" effect="light">
                      <div class="option-label">
                        <span>{{ t('options.silence') }}</span>
                        <el-icon><Timer /></el-icon>
                      </div>
                    </el-tooltip>
                    <span class="slider-value">{{ formConfig.silence || 'default' }}</span>
                  </div>
                  <el-select
                    v-model="formConfig.silence"
                    :placeholder="t('options.selectSilence')"
                    :disabled="apiEdge"
                    class="option-select"
                  >
                    <el-option value="default" :label="t('options.defaultSilence')"></el-option>
                    <el-option value="20ms" :label="20 + 'ms'"></el-option>
                    <el-option value="50ms" :label="50 + 'ms'"></el-option>
                    <el-option value="100ms" :label="100 + 'ms'"></el-option>
                    <el-option value="200ms" :label="200 + 'ms'"></el-option>
                    <el-option value="500ms" :label="500 + 'ms'"></el-option>
                    <el-option value="1000ms" :label="1000 + 'ms'"></el-option>
                    <el-option value="2000ms" :label="2000 + 'ms'"></el-option>
                  </el-select>
                </div>
                
                <!-- 音量滑块 -->
                <div class="slider-card">
                  <div class="slider-header">
                    <el-tooltip content="调整语音的音量大小" placement="top" effect="light">
                      <div class="option-label">
                        <span>{{ t('options.volume') }}</span>
                        <el-icon><Headset /></el-icon>
                      </div>
                    </el-tooltip>
                    <span class="slider-value">{{ formConfig.volume || 'default' }}</span>
                  </div>
                  <el-select
                    v-model="formConfig.volume"
                    :placeholder="t('options.selectVolume')"
                    :disabled="apiEdge"
                    class="option-select"
                  >
                    <el-option value="default" :label="t('options.default')"></el-option>
                    <el-option value="x-soft" :label="t('options.xSoft')"></el-option>
                    <el-option value="soft" :label="t('options.soft')"></el-option>
                    <el-option value="medium" :label="t('options.medium')"></el-option>
                    <el-option value="loud" :label="t('options.loud')"></el-option>
                    <el-option value="x-loud" :label="t('options.xLoud')"></el-option>
                  </el-select>
                </div>
                
                <!-- 语速滑块 -->
                <div class="slider-card">
                  <div class="slider-header">
                    <el-tooltip content="调整语音的语速" placement="top" effect="light">
                      <div class="option-label">
                        <span>{{ t('options.speed') }}</span>
                        <el-icon><Clock /></el-icon>
                      </div>
                    </el-tooltip>
                    <span class="slider-value">{{ formConfig.speed }}x</span>
                  </div>
                  <el-slider 
                    v-model="formConfig.speed" 
                    :min="0.5" 
                    :max="2" 
                    :step="0.1" 
                    class="modern-slider"
                    :format-tooltip="(val: number) => val + 'x'"
                  />
                </div>
                
                <!-- 音调滑块 -->
                <div class="slider-card">
                  <div class="slider-header">
                    <el-tooltip content="调整语音的音调" placement="top" effect="light">
                      <div class="option-label">
                        <span>{{ t('options.pitch') }}</span>
                        <el-icon><TrendCharts /></el-icon>
                      </div>
                    </el-tooltip>
                    <span class="slider-value">{{ formConfig.pitch }}x</span>
                  </div>
                  <el-slider 
                    v-model="formConfig.pitch" 
                    :min="0.5" 
                    :max="2" 
                    :step="0.1" 
                    class="modern-slider"
                    :format-tooltip="(val: number) => val + 'x'"
                  />
                </div>
              </div>
            </div>
            
            <div class="actions-section">
              <el-button type="primary" @click="savePreset" class="action-button">
                <el-icon><Star /></el-icon>
                {{ t('options.saveAsPreset') }}
              </el-button>
              
              <el-button @click="useDefaultSettings" class="action-button">
                <el-icon><RefreshRight /></el-icon>
                {{ t('options.resetToDefault') }}
              </el-button>

              <!-- 切换到主播模式 -->
              <el-button @click="switchToAnchors" class="action-button">
                <el-icon><Avatar /></el-icon>
                {{ t('options.switchToAnchors') }}
              </el-button>
            </div>
          </el-form>
        </div>
      </div>
    </el-collapse-transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, computed } from "vue";
import { optionsConfig as oc } from "./options-config";
import { getStyleDes, getRoleDes } from "./emoji-config";
import Loading from "./Loading.vue";
import VoiceSelector from "./VoiceSelector.vue";
import { ElMessage, ElMessageBox, ElCollapseTransition } from "element-plus";
import { useTtsStore } from "@/store/store";
import { storeToRefs } from "pinia";
import { useI18n } from 'vue-i18n';
import WebStore from "@/store/web-store";
import { getTTSData } from "@/store/play";
import { 
  Connection, ChatDotRound, Microphone, UserFilled, Mic, 
  Aim, Timer, Headset, DArrowRight, TrendCharts, Star,
  DocumentChecked, Reading, Collection, Lightning, Cloudy,
  Clock, RefreshRight, CaretRight, ArrowDown, Setting,
  Search, Avatar
} from '@element-plus/icons-vue';

const { t } = useI18n();
const ttsStore = useTtsStore();
const { page, inputs, tableData, isLoading } = storeToRefs(ttsStore);
const { formConfig, config } = storeToRefs(ttsStore);
const webstore = new WebStore();

const isExpanded = ref(true);

const toggleOptions = () => {
  isExpanded.value = !isExpanded.value;
};

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
  }
];

// 当前选中的预设
const currentPreset = ref('');

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
  
  if (!formConfig.value.api) {
    formConfig.value.api = 4; // 默认使用 TTS88 API
  }
  
  // 手动触发一次SSML更新
  updateSSML();

  // 默认显示主播模式
  currentViewMode.value = 'anchors';
});

const apiChange = (res: number) => {
  if (res === 1 && config.value.speechKey === "") {
    ElMessage({
      message: "请先在设置中配置 Microsoft Speech API Key，或者推荐使用 TTS88 中转 API",
      type: "warning",
      duration: 4000,
    });
    // 如果没有配置 key，自动切换回 TTS88 API
    formConfig.value.api = 4;
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
      message: t('options.configureAzure'),
      type: "warning",
      duration: 4000,
    });
    return;
  } else if (res === 4 && config.value.thirdPartyApi === "") {
    ElMessage({
      message: "请先在设置中配置TTS88 API地址",
      type: "warning",
      duration: 4000,
    });
    return;
  } else {
    apiEdge.value = false;
  }
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
    
    // 检查API URL是否为空
    if (!config.value.thirdPartyApi) {
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
  const rateValue = ((config.speed - 1) * 100).toFixed();
  const pitchValue = ((config.pitch - 1) * 50).toFixed();
  
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
watch(formConfig, () => {
  updateSSML();
}, { deep: true });

// 监听文本输入的变化，并更新SSML
watch(() => inputs.value.inputValue, () => {
  updateSSML();
});

const savePreset = () => {
  ElMessageBox.prompt(
    t('messages.saveConfigPrompt'),
    t('options.saveAsPreset'),
    {
      confirmButtonText: t('buttons.confirm'),
      cancelButtonText: t('buttons.cancel'),
      inputValidator: (value: string) => {
        return value !== null && value !== "";
      },
      inputErrorMessage: t('messages.invalidInput'),
    }
  )
  .then(({ value }) => {
    // 创建新的预设对象
    const newPreset = {
      id: `custom_${Date.now()}`,
      name: value,
      icon: 'Star',
      config: {
        voiceStyleSelect: formConfig.value.voiceStyleSelect,
        role: formConfig.value.role,
        intensity: formConfig.value.intensity,
        volume: formConfig.value.volume,
        silence: formConfig.value.silence,
        speed: formConfig.value.speed,
        pitch: formConfig.value.pitch
      }
    };
    
    // 如果是内置预设，不允许覆盖
    const isBuiltIn = presets.some(p => p.name === value);
    if (isBuiltIn) {
      ElMessage({
        message: "不能覆盖内置预设，请使用其他名称",
        type: "warning",
        duration: 2000,
      });
      return;
    }
    
    // 保存到本地存储
    try {
      // 获取已有的自定义预设
      const customPresets = webstore.get("customPresets") || [];
      
      // 检查是否存在同名预设
      const existingIndex = customPresets.findIndex((p: any) => p.name === value);
      if (existingIndex >= 0) {
        // 覆盖已有预设
        customPresets[existingIndex] = newPreset;
      } else {
        // 添加新预设
        customPresets.push(newPreset);
      }
      
      // 保存到本地存储
      webstore.set("customPresets", customPresets);
      
      ElMessage({
        message: t('options.saveSuccess'),
        type: "success",
        duration: 2000,
      });
    } catch (error) {
      console.error("保存预设失败:", error);
      ElMessage({
        message: "保存失败: " + (error instanceof Error ? error.message : String(error)),
        type: "error",
        duration: 2000,
      });
    }
  })
  .catch(() => {
    ElMessage({
      message: t('messages.cancelSave'),
      type: "info",
      duration: 2000,
    });
  });
};

const useDefaultSettings = () => {
  // 应用默认预设配置
  const defaultPreset = presets.find(p => p.id === 'default');
  if (defaultPreset) {
    // 保留原有语音和语言设置
    const voice = formConfig.value.voiceSelect;
    const language = formConfig.value.languageSelect;
    const api = formConfig.value.api;
    
    // 应用预设配置
    Object.entries(defaultPreset.config).forEach(([key, value]) => {
      // 使用类型断言
      (formConfig.value as any)[key] = value;
    });
    
    // 恢复语音和语言设置
    formConfig.value.voiceSelect = voice;
    formConfig.value.languageSelect = language;
    formConfig.value.api = api;
    
    ElMessage({
      message: t('options.presetApplied'),
      type: "success",
      duration: 2000,
    });
  }
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
  voiceStyleSelectList.value = voice?.VoiceStyleNames?.split(",") || [];
  rolePlayList.value = voice?.VoiceRoleNames?.split(",") || [];
  formConfig.value.voiceStyleSelect = voiceStyleSelectList.value.length > 0 ? voiceStyleSelectList.value[0] : "";
  formConfig.value.role = rolePlayList.value.length > 0 ? rolePlayList.value[0] : "";
};

const configChange = (val: string) => {
  formConfig.value = config.value.formConfigJson[val];
};

const startBtn = () => {
  if (page.value.asideIndex == "1" && inputs.value.inputValue == "") {
    ElMessage({
      message: t('messages.inputWarning'),
      type: "warning",
      duration: 2000,
    });
    return;
  }
  if (page.value.asideIndex == "2" && tableData.value.length == 0) {
    ElMessage({
      message: t('messages.emptyListWarning'),
      type: "warning",
      duration: 2000,
    });
    return;
  }
  if (isLoading.value) {
    ElMessage({
      message: "请稍候。。。",
      type: "warning",
      duration: 2000,
    });
    return;
  }
  isLoading.value = true;

  ttsStore.start();
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

// 定义语音主播列表
const voiceAnchors = reactive([
  {
    id: 'xiaoxiao',
    name: '晓晓',
    isPro: false,
    description: '热门女声，配音魅力/有声对话',
    category: ['hot', 'female'],
    avatar: '',
    config: {
      languageSelect: 'zh-CN',
      voiceSelect: 'zh-CN-XiaoxiaoNeural',
      voiceStyleSelect: 'Default',
      role: '',
      speed: 1,
      pitch: 1,
      api: 4
    }
  },
  {
    id: 'xiaoxiaoPro',
    name: '晓晓Pro',
    isPro: true,
    description: '热门女声，支持多情感，适配场景',
    category: ['hot', 'emotion', 'female'],
    avatar: '',
    config: {
      languageSelect: 'zh-CN',
      voiceSelect: 'zh-CN-XiaoxiaoNeural',
      voiceStyleSelect: 'chat',
      role: '',
      speed: 1.1,
      pitch: 1.05,
      api: 4
    }
  },
  {
    id: 'xiaoxiaoUltra',
    name: '晓晓Ultra',
    isPro: true,
    description: '热门女声，炫酷语音效果，支持70多种语音',
    category: ['hot', 'emotion', 'realistic', 'female'],
    avatar: '',
    config: {
      languageSelect: 'zh-CN',
      voiceSelect: 'zh-CN-XiaoxiaoNeural',
      voiceStyleSelect: 'newscast-formal',
      role: '',
      speed: 1.1,
      pitch: 1.1,
      api: 4
    }
  },
  {
    id: 'yunxi',
    name: '云溪',
    isPro: false,
    description: '热门女声，火爆全网，方言版',
    category: ['hot', 'female'],
    avatar: '',
    config: {
      languageSelect: 'zh-CN',
      voiceSelect: 'zh-CN-YunxiNeural',
      voiceStyleSelect: 'Default',
      role: '',
      speed: 1,
      pitch: 1,
      api: 4
    }
  },
  {
    id: 'xiaomo',
    name: '晓墨',
    isPro: false,
    description: '热门知性女声，休闲轻松，解说/宣传',
    category: ['female', 'ad'],
    avatar: '',
    config: {
      languageSelect: 'zh-CN',
      voiceSelect: 'zh-CN-XiaomoNeural',
      voiceStyleSelect: 'Default',
      role: '',
      speed: 1,
      pitch: 1,
      api: 4
    }
  },
  {
    id: 'xiaomoPro',
    name: '晓墨Pro',
    isPro: true,
    description: '热门知性女声，解说/宣传，高品质，更好听',
    category: ['female', 'ad', 'realistic'],
    avatar: '',
    config: {
      languageSelect: 'zh-CN',
      voiceSelect: 'zh-CN-XiaomoNeural',
      voiceStyleSelect: 'newscast',
      role: '',
      speed: 1.05,
      pitch: 1.02,
      api: 4
    }
  },
  {
    id: 'yunye',
    name: '云野',
    isPro: false,
    description: '情感女声',
    category: ['emotion', 'female'],
    avatar: '',
    config: {
      languageSelect: 'zh-CN',
      voiceSelect: 'zh-CN-YunyeNeural',
      voiceStyleSelect: 'Default',
      role: '',
      speed: 1,
      pitch: 1,
      api: 4
    }
  },
  {
    id: 'yungang',
    name: '云钢',
    isPro: false,
    description: '优雅知性姐姐，优雅从容',
    category: ['female'],
    avatar: '',
    config: {
      languageSelect: 'zh-CN',
      voiceSelect: 'zh-CN-YunxiaNeural', 
      voiceStyleSelect: 'Default',
      role: '',
      speed: 1,
      pitch: 1,
      api: 4
    }
  },
  {
    id: 'yungang-pro',
    name: '云钢Pro',
    isPro: true,
    description: '优雅知性姐姐，优雅从容',
    category: ['female', 'realistic'],
    avatar: '',
    config: {
      languageSelect: 'zh-CN',
      voiceSelect: 'zh-CN-YunxiaNeural',
      voiceStyleSelect: 'lyrical',
      role: '',
      speed: 0.95,
      pitch: 1.05,
      api: 4
    }
  },
  {
    id: 'xiaorui',
    name: '晓瑞',
    isPro: false,
    description: '通用女声',
    category: ['female'],
    avatar: '',
    config: {
      languageSelect: 'zh-CN',
      voiceSelect: 'zh-CN-XiaoruiNeural',
      voiceStyleSelect: 'Default',
      role: '',
      speed: 1,
      pitch: 1,
      api: 4
    }
  },
  {
    id: 'xiaoshuang',
    name: '晓双',
    isPro: false, 
    description: '亲切女声，柔媚迷人，娇俏可爱',
    category: ['female', 'cute'],
    avatar: '',
    config: {
      languageSelect: 'zh-CN',
      voiceSelect: 'zh-CN-XiaoshuangNeural',
      voiceStyleSelect: 'Default',
      role: '',
      speed: 1,
      pitch: 1.1,
      api: 4
    }
  },
  {
    id: 'yunfeng',
    name: '云峰',
    isPro: false,
    description: '亲切大方姐姐，亲和女声',
    category: ['female'],
    avatar: '',
    config: {
      languageSelect: 'zh-CN',
      voiceSelect: 'zh-CN-YunfengNeural',
      voiceStyleSelect: 'Default',
      role: '',
      speed: 1,
      pitch: 1,
      api: 4
    }
  },
  {
    id: 'yunhan',
    name: '云翰',
    isPro: false,
    description: '客服女声',
    category: ['female', 'ad'],
    avatar: '',
    config: {
      languageSelect: 'zh-CN',
      voiceSelect: 'zh-CN-YunhanNeural',
      voiceStyleSelect: 'Default',
      role: '',
      speed: 1,
      pitch: 1,
      api: 4
    }
  },
  {
    id: 'kangkang',
    name: '康康',
    isPro: false,
    description: '男生通用声音',
    category: ['male'],
    avatar: '',
    config: {
      languageSelect: 'zh-CN',
      voiceSelect: 'zh-CN-KangkangNeural',
      voiceStyleSelect: 'Default',
      role: '',
      speed: 1,
      pitch: 1,
      api: 4
    }
  },
  {
    id: 'zhangyu',
    name: '章宇',
    isPro: false,
    description: '沉稳男声，深情女声',
    category: ['male'],
    avatar: '',
    config: {
      languageSelect: 'zh-CN',
      voiceSelect: 'zh-CN-ZhangyuNeural',
      voiceStyleSelect: 'Default',
      role: '',
      speed: 0.95,
      pitch: 0.95,
      api: 4
    }
  }
]);

// 根据分类和搜索过滤主播
const filteredAnchors = computed(() => {
  let result = voiceAnchors;
  
  // 分类过滤
  if (selectedCategory.value !== 'all') {
    result = result.filter(anchor => 
      anchor.category.includes(selectedCategory.value)
    );
  }
  
  // 搜索过滤
  if (searchText.value) {
    const search = searchText.value.toLowerCase();
    result = result.filter(anchor => 
      anchor.name.toLowerCase().includes(search) || 
      anchor.description.toLowerCase().includes(search)
    );
  }
  
  return result;
});

// 获取默认头像
const getDefaultAvatar = (anchor: any) => {
  // 根据主播ID生成不同颜色的默认头像
  const colors = ['#FF9500', '#FF2D55', '#5856D6', '#007AFF', '#34C759', '#AF52DE'];
  const colorIndex = anchor.id.charCodeAt(0) % colors.length;
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='${colors[colorIndex].replace('#', '%23')}' /%3E%3Ctext x='50' y='60' font-size='40' text-anchor='middle' fill='white'%3E${anchor.name[0]}%3C/text%3E%3C/svg%3E`;
};

// 选择主播
const selectAnchor = async (anchor: any) => {
  selectedAnchor.value = anchor.id;
  
  // 应用主播配置
  formConfig.value = {...anchor.config};
  
  // 确保更新SSML
  updateSSML();
  
  // 提示用户已选择
  ElMessage({
    message: `已选择语音主播：${anchor.name}`,
    type: 'success',
    duration: 2000
  });
};

// 预览主播声音
const previewVoice = async (anchor: any) => {
  // 临时保存当前配置
  const tempConfig = { ...formConfig.value };
  const tempInput = inputs.value.inputValue;
  const tempSSML = inputs.value.ssmlValue;
  
  try {
    // 应用选中主播的配置
    formConfig.value = {...anchor.config};
    
    // 使用试听文本生成SSML
    inputs.value.inputValue = webstore.get("audition") || "你好，这是一段试听文本。";
    ttsStore.setSSMLValue();
    
    // 开始转换并播放
    const voiceData = {
      activeIndex: page.value.tabIndex,
      ssmlContent: inputs.value.ssmlValue,
      inputContent: inputs.value.inputValue,
      retryCount: config.value.retryCount,
      retryInterval: config.value.retryInterval,
    };
    
    // 检查API URL是否为空
    if (!config.value.thirdPartyApi) {
      ElMessage({
        message: "请先在设置中配置TTS88 API地址",
        type: "error",
        duration: 3000,
      });
      return;
    }
    
    // 获取TTS数据
    isLoading.value = true;
    const res = await getTTSData({
      api: formConfig.value.api,
      voiceData,
      speechKey: config.value.speechKey,
      region: config.value.serviceRegion,
      thirdPartyApi: config.value.thirdPartyApi,
      tts88Key: config.value.tts88Key,
    });
    
    if (res) {
      if (res.buffer) {
        const audioBlob = new Blob([res.buffer], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        ttsStore.audition(audioUrl);
      } else if (res.audibleUrl) {
        ttsStore.audition(res.audibleUrl);
      } else {
        throw new Error("没有收到有效的音频数据");
      }
    }
    
    // 如果已选中该主播，保留配置
    if (selectedAnchor.value === anchor.id) {
      // 显示成功提示
      ElMessage({
        message: `正在播放${anchor.name}的声音`,
        type: "success",
        duration: 2000
      });
    }
  } catch (err) {
    console.error('主播声音预览失败:', err);
    ElMessage({
      message: "主播声音预览失败: " + (err instanceof Error ? err.message : String(err)),
      type: "error",
      duration: 2000,
    });
    // 恢复原配置
    formConfig.value = tempConfig;
  } finally {
    // 如果未选中该主播，恢复原配置
    if (selectedAnchor.value !== anchor.id) {
      formConfig.value = tempConfig;
    }
    // 恢复原始输入
    inputs.value.inputValue = tempInput;
    inputs.value.ssmlValue = tempSSML;
    isLoading.value = false;
  }
};
</script>

<style scoped>
.modern-options {
  padding: 20px;
  position: relative;
}

.options-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.options-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  user-select: none;
  margin: 0;
}

.toggle-icon {
  margin-left: 10px;
  transition: transform 0.3s ease;
}

.toggle-icon.is-expanded {
  transform: rotate(180deg);
}

.start-button-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.convert-tip {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
  transition: all var(--transition-fast);
}

.start-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-weight: 600;
  background: var(--primary-gradient);
  color: white;
  border: none;
  box-shadow: var(--shadow-light);
  transition: all var(--transition-normal);
  border-radius: var(--border-radius-small);
  font-size: 14px;
  height: 36px;
  position: relative;
  overflow: hidden;
}

.start-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.8s ease;
}

.start-button:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-medium);
}

.start-button:hover::before {
  left: 100%;
}

.start-button:focus {
  outline: none;
}

.start-button:active {
  transform: translateY(0);
  box-shadow: var(--shadow-light);
}

.start-button .el-icon {
  font-size: 16px;
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 30px;
}

.option-card {
  background-color: var(--card-background);
  border-radius: var(--border-radius-medium);
  padding: 16px;
  border: 1px solid var(--border-color);
  transition: all var(--transition-fast);
}

.option-card:hover {
  border-color: var(--primary-color);
  box-shadow: var(--shadow-light);
}

.option-header {
  margin-bottom: 12px;
}

.option-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: var(--text-primary);
}

.option-label .el-icon {
  color: var(--primary-color);
}

.option-select {
  width: 100%;
}

.preset-option, .voice-option, .style-option {
  display: flex;
  align-items: center;
  gap: 10px;
}

.style-emoji {
  font-size: 16px;
}

.sliders-section {
  margin-top: 30px;
}

.sliders-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  color: var(--text-primary);
}

.sliders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 30px;
}

.slider-card {
  background-color: var(--card-background);
  border-radius: var(--border-radius-medium);
  padding: 16px;
  border: 1px solid var(--border-color);
  transition: all var(--transition-fast);
}

.slider-card:hover {
  border-color: var(--primary-color);
  box-shadow: var(--shadow-light);
}

.slider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.slider-value {
  font-size: 14px;
  color: var(--primary-color);
  font-weight: 500;
}

.modern-slider {
  margin-top: 10px;
}

:deep(.el-slider__button) {
  border-color: var(--primary-color);
}

:deep(.el-slider__bar) {
  background-color: var(--primary-color);
}

.actions-section {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 30px;
}

.action-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  font-weight: 500;
}

/* 暗黑模式适配 */
.dark-theme .option-card,
.dark-theme .slider-card {
  background-color: var(--card-background);
  border-color: var(--border-color);
}

.dark-theme .option-card:hover,
.dark-theme .slider-card:hover {
  border-color: var(--primary-color);
}

/* 主播模式样式 */
.voice-anchor-panel {
  margin-top: 20px;
}

.anchor-categories {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.category-item {
  padding: 6px 14px;
  border-radius: var(--border-radius-small);
  background-color: var(--card-background);
  border: 1px solid var(--border-color);
  cursor: pointer;
  font-size: 14px;
  transition: all var(--transition-fast);
}

.category-item.active {
  background-color: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
  box-shadow: var(--shadow-light);
}

.category-item:hover:not(.active) {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.anchor-search {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.search-btn {
  background: var(--primary-gradient);
  color: white;
  border: none;
}

.anchor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
  margin-bottom: 30px;
}

.anchor-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: var(--card-background);
  border-radius: var(--border-radius-medium);
  padding: 16px;
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all var(--transition-fast);
  position: relative;
}

.anchor-card:hover {
  border-color: var(--primary-color);
  box-shadow: var(--shadow-light);
  transform: translateY(-2px);
}

.anchor-card.selected {
  border-color: var(--primary-color);
  box-shadow: var(--shadow-medium);
  background: linear-gradient(to right, var(--card-background), var(--primary-color-10));
}

.anchor-avatar {
  position: relative;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.anchor-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.anchor-tag {
  position: absolute;
  top: -3px;
  right: -3px;
  background: linear-gradient(45deg, #ffb800, #ff8a00);
  color: white;
  font-size: 9px;
  font-weight: bold;
  padding: 2px 5px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.anchor-info {
  flex: 1;
  overflow: hidden;
}

.anchor-name {
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.anchor-desc {
  font-size: 12px;
  color: var(--text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.anchor-preview {
  margin-left: auto;
}

.mode-switch {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  margin-bottom: 20px;
}

.switch-button {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 暗黑模式适配 */
.dark-theme .category-item {
  background-color: var(--card-background-dark);
}

.dark-theme .anchor-card {
  background-color: var(--card-background-dark);
}

.dark-theme .anchor-card.selected {
  background: linear-gradient(to right, var(--card-background-dark), rgba(var(--primary-color-rgb), 0.2));
}
</style>
