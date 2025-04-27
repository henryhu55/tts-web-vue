<template>
  <div class="modern-options">
    <h2 class="options-title">{{ t('options.voiceSettings') || '语音设置' }}</h2>
    
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
                <span>{{ t('options.preset') || '预设' }}</span>
                <el-icon><Star /></el-icon>
              </div>
            </el-tooltip>
          </div>
          <el-select
            v-model="currentPreset"
            :placeholder="t('options.selectPreset') || '选择预设'"
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
                <span>{{ t('options.api') || '接口' }}</span>
                <el-icon><Connection /></el-icon>
              </div>
            </el-tooltip>
          </div>
          <el-select
            v-model="formConfig.api"
            :placeholder="t('options.selectApi') || '选择接口'"
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
                <span>{{ t('options.language') || '语言' }}</span>
                <el-icon><ChatDotRound /></el-icon>
              </div>
            </el-tooltip>
          </div>
          <el-select-v2
            class="option-select"
            v-model="formConfig.languageSelect"
            :placeholder="t('options.selectLanguage') || '选择语言'"
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
                <span>{{ t('options.voice') || '语音' }}</span>
                <el-icon><Microphone /></el-icon>
              </div>
            </el-tooltip>
          </div>
          <el-select
            v-model="formConfig.voiceSelect"
            :placeholder="t('options.selectVoice') || '选择语音'"
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
                <span>{{ t('options.speakingStyle') || '风格' }}</span>
                <el-icon><Mic /></el-icon>
              </div>
            </el-tooltip>
          </div>
          <el-select
            v-model="formConfig.voiceStyleSelect"
            :placeholder="t('options.selectSpeakingStyle') || '选择风格'"
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
                <span>{{ t('options.rolePlaying') || '角色' }}</span>
                <el-icon><UserFilled /></el-icon>
              </div>
            </el-tooltip>
          </div>
          <el-select 
            v-model="formConfig.role" 
            :placeholder="t('options.selectRole') || '选择角色'" 
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
        <h3 class="sliders-title">{{ t('options.advancedSettings') || '高级设置' }}</h3>
        
        <div class="sliders-grid">
          <!-- 强度滑块 -->
          <div class="slider-card">
            <div class="slider-header">
              <el-tooltip content="调整语音风格的强度程度" placement="top" effect="light">
                <div class="option-label">
                  <span>{{ t('options.intensity') || '强度' }}</span>
                  <el-icon><Aim /></el-icon>
                </div>
              </el-tooltip>
              <span class="slider-value">{{ formConfig.intensity || 'default' }}</span>
            </div>
            <el-select
              v-model="formConfig.intensity"
              :placeholder="t('options.selectIntensity') || '选择强度'"
              :disabled="apiEdge"
              class="option-select"
            >
              <el-option value="default" :label="t('options.default') || '默认'"></el-option>
              <el-option value="0.5" :label="t('options.weak') || '弱'"></el-option>
              <el-option value="1" :label="t('options.normal') || '正常'"></el-option>
              <el-option value="1.5" :label="t('options.strong') || '强'"></el-option>
              <el-option value="2" :label="t('options.extraStrong') || '超强'"></el-option>
            </el-select>
          </div>
          
          <!-- 静音选择 -->
          <div class="slider-card">
            <div class="slider-header">
              <el-tooltip content="在文本中插入不同长度的停顿" placement="top" effect="light">
                <div class="option-label">
                  <span>{{ t('options.silence') || '静音' }}</span>
                  <el-icon><Timer /></el-icon>
                </div>
              </el-tooltip>
              <span class="slider-value">{{ formConfig.silence || 'default' }}</span>
            </div>
            <el-select
              v-model="formConfig.silence"
              :placeholder="t('options.selectSilence') || '选择静音'"
              :disabled="apiEdge"
              class="option-select"
            >
              <el-option value="default" :label="t('options.defaultSilence') || '默认'"></el-option>
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
                  <span>{{ t('options.volume') || '音量' }}</span>
                  <el-icon><Headset /></el-icon>
                </div>
              </el-tooltip>
              <span class="slider-value">{{ formConfig.volume || 'default' }}</span>
            </div>
            <el-select
              v-model="formConfig.volume"
              :placeholder="t('options.selectVolume') || '选择音量'"
              :disabled="apiEdge"
              class="option-select"
            >
              <el-option value="default" :label="t('options.default') || '默认'"></el-option>
              <el-option value="x-soft" :label="t('options.xSoft') || '极轻'"></el-option>
              <el-option value="soft" :label="t('options.soft') || '轻'"></el-option>
              <el-option value="medium" :label="t('options.medium') || '中等'"></el-option>
              <el-option value="loud" :label="t('options.loud') || '响'"></el-option>
              <el-option value="x-loud" :label="t('options.xLoud') || '极响'"></el-option>
            </el-select>
          </div>
          
          <!-- 语速滑块 -->
          <div class="slider-card">
            <div class="slider-header">
              <el-tooltip content="调整语音的语速" placement="top" effect="light">
                <div class="option-label">
                  <span>{{ t('options.speed') || '语速' }}</span>
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
              :format-tooltip="(val) => val + 'x'"
            />
          </div>
          
          <!-- 音调滑块 -->
          <div class="slider-card">
            <div class="slider-header">
              <el-tooltip content="调整语音的音调" placement="top" effect="light">
                <div class="option-label">
                  <span>{{ t('options.pitch') || '音调' }}</span>
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
              :format-tooltip="(val) => val + 'x'"
            />
          </div>
        </div>
      </div>
      
      <div class="actions-section">
        <el-button type="primary" @click="savePreset" class="action-button">
          <el-icon><Star /></el-icon>
          {{ t('options.saveAsPreset') || '保存为预设' }}
        </el-button>
        
        <el-button @click="useDefaultSettings" class="action-button">
          <el-icon><RefreshRight /></el-icon>
          {{ t('options.resetToDefault') || '恢复默认' }}
        </el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from "vue";
import { optionsConfig as oc } from "./options-config";
import { getStyleDes, getRoleDes } from "./emoji-config";
import Loading from "./Loading.vue";
import { ElMessage, ElMessageBox, arrowMiddleware } from "element-plus";
import { useTtsStore } from "@/store/store";
import { storeToRefs } from "pinia";
import { useI18n } from 'vue-i18n';
import WebStore from "@/store/web-store";
import { 
  Connection, ChatDotRound, Microphone, UserFilled, Mic, 
  Aim, Timer, Headset, DArrowRight, TrendCharts, Star,
  DocumentChecked, Reading, Collection, Lightning, Cloudy,
  Clock, RefreshRight
} from '@element-plus/icons-vue';
import { getTTSData } from "@/api/tts";

const { t } = useI18n();  

const ttsStore = useTtsStore();
const {
  inputs,
  formConfig,
  page,
  tableData,
  currConfigName,
  config,
  isLoading,
} = storeToRefs(ttsStore);
const store = new WebStore();

// 预设风格配置
const presets = [
  {
    id: 'default',
    name: t('options.presetDefault') || '默认',
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
    name: t('options.presetNews') || '新闻播报',
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
    name: t('options.presetStory') || '故事讲述',
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
    name: t('options.presetPoetry') || '诗歌朗诵',
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
    name: t('options.presetExcited') || '兴奋活力',
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
    name: t('options.presetSad') || '悲伤情绪',
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
    message: t('options.presetApplied') || '已应用预设配置',
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
});

const apiChange = (res:number) => {
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
    inputs.value.inputValue = store.get("audition") || "你好，这是一段试听文本。";
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
      } else if (res.audioContent) {
        const audioBlob = new Blob([Buffer.from(res.audioContent, 'base64')], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        ttsStore.audition(audioUrl);
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

const saveConfig = () => {
  ElMessageBox.prompt(
      t('messages.saveConfigPrompt'),
      t('messages.saveConfig'),
    {
      dangerouslyUseHTMLString: true,
      confirmButtonText: t('buttons.confirm'),
      cancelButtonText: t('buttons.cancel'),
      inputValidator: (value: any) => {
        if (value == null || value == "" || value == undefined) {
          return false;
        } else {
          return true;
        }
      },
      inputErrorMessage: t('messages.invalidInput'),
    }
  )
    .then(({ value }) => {
      currConfigName.value = value;
      config.value.formConfigJson[value] = formConfig.value;
      store.set("FormConfig." + value, formConfig.value);
      ttsStore.genFormConfig();
      ElMessage({
        message: t('messages.saveSuccess'),
        type: "success",
        duration: 2000,
      });
    })
    .catch(() => {
      ElMessage({
      message: t('messages.cancelSave'),
        type: "info",
        duration: 2000,
      });
    });
};

// 如果SSML标签页的话锁定
let apiDisable = ref(false);
watch(page.value, (newValue) => {
  if (newValue.tabIndex === '2') {
    apiDisable.value = true;
    // 允许使用Azure Speech API或TTS88 API
    // 如果当前API不是Azure或TTS88，则默认设置为TTS88
    if (formConfig.value.api !== 3 && formConfig.value.api !== 4) {
      formConfig.value.api = 4;
    }
  } else {
    apiDisable.value = false;
  }
});

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

const savePreset = () => {
  // Implementation of savePreset function
};

const useDefaultSettings = () => {
  // Implementation of useDefaultSettings function
};
</script>

<style scoped>
.modern-options {
  padding: 20px;
}

.options-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 24px;
  color: var(--text-primary);
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
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
</style>
