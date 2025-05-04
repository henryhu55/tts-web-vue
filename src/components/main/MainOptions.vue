<template>
  <div class="modern-options">
    <!-- 抽屉模式的完整选项 -->
    <div class="drawer-mode">
      <div class="option-section">
        <h3 class="section-title">基本选项</h3>
        <div class="option-grid">
          <!-- API选择 -->
          <div class="option-item">
            <div class="option-label">
              <span>API服务</span>
              <el-icon><Connection /></el-icon>
            </div>
            <el-select
              v-model="formConfig.api"
              size="default"
              class="full-width-select"
              @change="apiChange"
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
          <div class="option-item">
            <div class="option-label">
              <span>语言</span>
              <el-icon><ChatDotRound /></el-icon>
            </div>
            <el-select
              v-model="formConfig.languageSelect"
              size="default"
              class="full-width-select"
              @change="languageSelectChange"
              filterable
            >
              <el-option
                v-for="item in oc.languageSelect"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>
          
          <!-- 声音选择 -->
          <div class="option-item full-width-item">
            <div class="option-label">
              <span>声音</span>
              <el-icon><Microphone /></el-icon>
            </div>
            <el-select
              v-model="formConfig.voiceSelect"
              size="default"
              class="full-width-select"
              @change="voiceSelectChange"
              filterable
            >
              <el-option
                v-for="item in voiceSelectList"
                :key="item.ShortName"
                :label="item.DisplayName"
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
        </div>
      </div>
      
      <div class="option-section">
        <h3 class="section-title">语音调整</h3>
        <div class="option-grid">
          <!-- 语速调节 -->
          <div class="option-item">
            <div class="option-label">
              <span>语速</span>
              <span class="value-display">{{ formConfig.speed }}x</span>
            </div>
            <el-slider 
              v-model="formConfig.speed" 
              :min="0.5" 
              :max="2" 
              :step="0.1" 
              class="option-slider"
            />
          </div>
          
          <!-- 音调调节 -->
          <div class="option-item">
            <div class="option-label">
              <span>音调</span>
              <span class="value-display">{{ formConfig.pitch }}x</span>
            </div>
            <el-slider 
              v-model="formConfig.pitch" 
              :min="0.5" 
              :max="2" 
              :step="0.1"
              class="option-slider"
            />
          </div>
        </div>
      </div>
      
      <div class="option-section">
        <h3 class="section-title">高级语音设置</h3>
        <div class="option-grid">
          <!-- 风格选择 -->
          <div class="option-item">
            <div class="option-label">
              <span>{{ t('options.speakingStyle') }}</span>
              <el-icon><Mic /></el-icon>
            </div>
            <el-select
              v-model="formConfig.voiceStyleSelect"
              size="default"
              :placeholder="t('options.selectSpeakingStyle')"
              :disabled="apiEdge"
              class="full-width-select"
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
          <div class="option-item">
            <div class="option-label">
              <span>{{ t('options.rolePlaying') }}</span>
              <el-icon><UserFilled /></el-icon>
            </div>
            <el-select 
              v-model="formConfig.role" 
              size="default"
              :placeholder="t('options.selectRole')" 
              :disabled="apiEdge"
              class="full-width-select"
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
          
          <!-- 强度选项 -->
          <div class="option-item">
            <div class="option-label">
              <span>{{ t('options.intensity') }}</span>
              <el-icon><Aim /></el-icon>
            </div>
            <el-select
              v-model="formConfig.intensity"
              size="default"
              :placeholder="t('options.selectIntensity')"
              :disabled="apiEdge"
              class="full-width-select"
            >
              <el-option value="default" :label="t('options.default')"></el-option>
              <el-option value="0.5" :label="t('options.weak')"></el-option>
              <el-option value="1" :label="t('options.normal')"></el-option>
              <el-option value="1.5" :label="t('options.strong')"></el-option>
              <el-option value="2" :label="t('options.extraStrong')"></el-option>
            </el-select>
          </div>
          
          <!-- 预设按钮 -->
          <div class="option-item">
            <div class="option-label">
              <span>快速预设</span>
              <el-icon><Star /></el-icon>
            </div>
            <el-select
              v-model="currentPreset"
              size="default"
              placeholder="选择预设"
              @change="applyPreset"
              class="full-width-select"
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
          
          <!-- 添加语音主播按钮 -->
          <div class="option-item">
            <div class="option-label">
              <span>语音主播</span>
              <el-icon><Microphone /></el-icon>
            </div>
            <el-button 
              type="primary" 
              size="default" 
              class="full-width-button"
              @click="showVoiceAnchors = true"
            >
              <div class="button-content">
                <el-icon class="button-icon"><Avatar /></el-icon>
                <span class="button-text">选择语音主播</span>
              </div>
            </el-button>
          </div>
        </div>
      </div>
      
      <!-- 本地TTS服务设置卡片 -->
      <div v-if="formConfig.api === 5" class="option-section">
        <h3 class="section-title">免费TTS服务</h3>
        <div class="free-service-info">
          <LocalTTSSettings />
        </div>
      </div>
    </div>
    
    <!-- 语音主播对话框 -->
    <el-dialog
      v-model="showVoiceAnchors"
      title="选择语音主播"
      width="80%"
      :close-on-click-modal="false"
      :append-to-body="true"
      destroy-on-close
    >
      <div class="voice-anchor-dialog">
        <!-- 语音主播内容 -->
        <div class="anchor-filters">
          <div class="category-tabs">
            <span 
              v-for="category in voiceCategories" 
              :key="category.value"
              :class="['category-tab', selectedCategory === category.value ? 'active' : '']"
              @click="selectedCategory = category.value"
            >
              {{ category.label }}
            </span>
          </div>
          
          <div class="anchor-search">
            <el-input 
              v-model="searchText" 
              placeholder="搜索语音主播" 
              prefix-icon="Search"
              clearable
              size="small"
            />
          </div>
        </div>
        
        <!-- 主播卡片列表 -->
        <div class="anchor-grid">
          <div 
            v-for="anchor in filteredAnchors" 
            :key="anchor.id"
            :class="['anchor-card', selectedAnchor === anchor.id ? 'selected' : '']"
            @click="selectAnchor(anchor)"
          >
            <div class="anchor-avatar">
              <img :src="anchor.avatar || getDefaultAvatar(anchor)" alt="主播头像">
              <span v-if="anchor.isPro" class="anchor-tag">专业版</span>
            </div>
            <div class="anchor-info">
              <h4 class="anchor-name">{{ anchor.name }}</h4>
              <p class="anchor-desc">{{ anchor.description }}</p>
            </div>
            <div class="anchor-actions">
              <el-button 
                size="small" 
                type="primary" 
                circle
                class="anchor-play-button"
                @click.stop="previewVoice(anchor)"
              >
                <el-icon><CaretRight /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
        
        <div class="dialog-footer">
          <el-button @click="showVoiceAnchors = false">取消</el-button>
          <el-button type="primary" @click="applySelectedAnchor">应用选择</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, watch, onMounted, computed, defineProps } from "vue";
import { optionsConfig as oc } from "./options-config";
import { getStyleDes, getRoleDes } from "./emoji-config";
import Loading from "./Loading.vue";
import VoiceSelector from "./VoiceSelector.vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useTtsStore } from "@/store/store";
import { useLocalTTSStore } from "@/store/local-tts-store";
import { storeToRefs } from "pinia";
import { useI18n } from 'vue-i18n';
import WebStore from "@/store/web-store";
import { getTTSData } from "@/store/play";
import { 
  Connection, ChatDotRound, Microphone, UserFilled, Mic, 
  Aim, Timer, Headset, TrendCharts, Star,
  DocumentChecked, Reading, Collection, Lightning, Cloudy,
  Clock, RefreshRight, CaretRight, ArrowDown, Setting,
  Search, Avatar, Check, Close
} from '@element-plus/icons-vue';
import LocalTTSSettings from '../aside/LocalTTSSettings.vue';

// 定义props
const props = defineProps({
  inDrawer: {
    type: Boolean,
    default: false
  }
});

const { t } = useI18n();
const ttsStore = useTtsStore();
const localTTSStore = useLocalTTSStore();
const { page, inputs, tableData, isLoading } = storeToRefs(ttsStore);
const { formConfig, config } = storeToRefs(ttsStore);
const webstore = new WebStore();

// 控制弹出框显示
const showAdvancedSettings = ref(false);
const showVoiceAnchors = ref(false);

// 保存高级设置
const saveAdvancedSettings = () => {
  showAdvancedSettings.value = false;
  ElMessage({
    message: '高级设置已应用',
    type: 'success',
    duration: 2000
  });
};

// 应用选中的主播
const applySelectedAnchor = () => {
  showVoiceAnchors.value = false;
  if (selectedAnchor.value) {
    const anchor = voiceAnchors.find(a => a.id === selectedAnchor.value);
    if (anchor) {
      // 保存当前选择的样式，以便可能需要重用
      const selectedStyle = anchor.config.voiceStyleSelect || 'Default';
      
      // 应用主播配置
      formConfig.value = {...anchor.config};
      
      // 确保更新SSML
      updateSSML();
      
      // 更新可用的风格和角色列表
      const voice = voiceSelectList.value.find(
        (item: any) => item.ShortName === formConfig.value.voiceSelect
      );
      
      if (voice) {
        // 获取可用的样式
        const availableStyles = voice.VoiceStyleNames?.split(",") || [];
        voiceStyleSelectList.value = availableStyles;
        
        // 获取可用的角色
        rolePlayList.value = voice.VoiceRoleNames?.split(",") || [];
        
        // 检查所选样式是否可用
        if (availableStyles.length > 0) {
          if (!availableStyles.includes(selectedStyle)) {
            // 如果不可用，使用第一个可用样式
            formConfig.value.voiceStyleSelect = availableStyles[0];
          } else {
            // 否则保持选择的样式
            formConfig.value.voiceStyleSelect = selectedStyle;
          }
        } else {
          formConfig.value.voiceStyleSelect = 'Default';
        }
        
        // 更新角色
        if (rolePlayList.value.length > 0) {
          formConfig.value.role = rolePlayList.value[0];
        } else {
          formConfig.value.role = '';
        }
      }
      
      ElMessage({
        message: `已应用语音主播：${anchor.name}`,
        type: 'success',
        duration: 2000
      });
    }
  }
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
    formConfig.value.api = 5; // 默认使用免费TTS服务
  }
  
  // 如果当前使用的是免费TTS服务，自动检查连接和获取额度
  if (formConfig.value.api === 5) {
    localTTSStore.checkServerConnection().then(connected => {
      if (connected) {
        // 获取免费额度信息
        localTTSStore.getFreeLimitInfo();
      }
    });
  }
  
  // 手动触发一次SSML更新
  updateSSML();

  // 初始化语音主播相关设置
  showVoiceAnchors.value = false;
  selectedCategory.value = 'all';
  searchText.value = '';
  
  // 如果已有选择的主播，记录ID
  const currentVoice = formConfig.value.voiceSelect;
  const matchingAnchor = voiceAnchors.find(anchor => 
    anchor.config.voiceSelect === currentVoice
  );
  if (matchingAnchor) {
    selectedAnchor.value = matchingAnchor.id;
  }
  
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
  
  // 获取可用的语音样式列表
  const availableStyles = voice?.VoiceStyleNames?.split(",") || [];
  voiceStyleSelectList.value = availableStyles;
  
  // 获取可用的角色列表
  rolePlayList.value = voice?.VoiceRoleNames?.split(",") || [];
  
  // 检查当前选择的样式是否在可用列表中
  const currentStyle = formConfig.value.voiceStyleSelect;
  if (!availableStyles.includes(currentStyle) || !currentStyle) {
    // 如果不在可用列表中或未设置，则选择第一个可用样式或Default
    formConfig.value.voiceStyleSelect = availableStyles.length > 0 ? 
      availableStyles[0] : 
      'Default';
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
  
  // 保存当前选择的样式，以便可能需要重用
  const selectedStyle = anchor.config.voiceStyleSelect || 'Default';
  
  // 应用主播配置
  formConfig.value = {...anchor.config};
  
  // 确保更新SSML
  updateSSML();
  
  // 触发语音选择变更以更新可用的风格和角色列表，注意不要覆盖已选择的样式
  const voice = voiceSelectList.value.find(
    (item: any) => item.ShortName === formConfig.value.voiceSelect
  );
  
  if (voice) {
    // 获取可用的样式
    const availableStyles = voice.VoiceStyleNames?.split(",") || [];
    voiceStyleSelectList.value = availableStyles;
    
    // 获取可用的角色
    rolePlayList.value = voice.VoiceRoleNames?.split(",") || [];
    
    // 检查所选样式是否可用
    if (availableStyles.length > 0) {
      if (!availableStyles.includes(selectedStyle)) {
        // 如果不可用，使用第一个可用样式
        formConfig.value.voiceStyleSelect = availableStyles[0];
      } else {
        // 否则保持选择的样式
        formConfig.value.voiceStyleSelect = selectedStyle;
      }
    } else {
      formConfig.value.voiceStyleSelect = 'Default';
    }
    
    // 更新角色
    if (rolePlayList.value.length > 0) {
      formConfig.value.role = rolePlayList.value[0];
    } else {
      formConfig.value.role = '';
    }
  }
  
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
  width: 100%;
}

/* 抽屉模式的样式 */
.drawer-mode {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.option-section {
  background-color: var(--card-background-light, #f5f7fa);
  border-radius: 8px;
  padding: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

.option-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.option-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.full-width-item {
  grid-column: 1 / -1;
}

.option-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: var(--text-secondary);
}

.value-display {
  font-weight: 500;
  color: var(--primary-color);
}

.full-width-select {
  width: 100%;
}

.full-width-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.full-width-button :deep(.el-icon) {
  vertical-align: middle;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: 4px;
}

.full-width-button span {
  vertical-align: middle;
  line-height: normal;
}

.button-content {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.button-icon {
  margin-right: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.button-text {
  line-height: 1;
}

.option-slider {
  margin: 0;
}

.preset-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.free-service-info {
  padding: 0;
}

/* 主播对话框样式 */
.voice-anchor-dialog {
  height: 500px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-height: 70vh;
}

.anchor-filters {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 0 16px 0;
  border-bottom: 1px solid var(--border-color);
  flex-wrap: wrap;
}

.category-tabs {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 8px;
  flex-wrap: wrap;
  max-width: calc(100% - 220px);
}

.category-tab {
  white-space: nowrap;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 14px;
  cursor: pointer;
  background-color: var(--card-background-light);
  color: var(--text-secondary);
  transition: all 0.2s;
  margin-bottom: 4px;
}

.category-tab.active {
  background-color: var(--primary-color);
  color: white;
}

.anchor-search {
  width: 200px;
}

.anchor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  padding: 16px 0;
  overflow-y: auto;
  height: 100%;
}

.anchor-card {
  display: flex;
  background-color: var(--card-background-light);
  border-radius: 8px;
  padding: 12px;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
  height: 84px; /* 固定卡片高度 */
  box-sizing: border-box;
}

.anchor-card:hover {
  transform: translateY(-3px);
}

.anchor-card.selected {
  border-color: var(--primary-color);
}

.anchor-avatar {
  width: 60px;
  height: 60px;
  min-width: 60px; /* 确保最小宽度固定 */
  position: relative;
  overflow: hidden;
  border-radius: 6px;
}

.anchor-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.anchor-tag {
  position: absolute;
  right: 0;
  top: 0;
  background-color: #ff9800;
  color: white;
  font-size: 10px;
  padding: 2px 4px;
  border-radius: 0 0 0 4px;
}

.anchor-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0; /* 确保文本能够自动压缩 */
  overflow: hidden; /* 确保溢出内容被隐藏 */
}

.anchor-name {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.anchor-desc {
  margin: 0;
  font-size: 12px;
  color: var(--text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  max-height: 2.4em; /* 限制描述文本高度为两行 */
}

.anchor-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px; /* 为控制区域设置最小宽度 */
  margin-left: auto; /* 确保控制区域靠右 */
}

.anchor-play-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  min-width: 32px; /* 确保最小宽度固定 */
  flex-shrink: 0; /* 防止按钮被压缩 */
}

.anchor-play-button :deep(.el-icon) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.dialog-footer {
  padding: 16px 0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  border-top: 1px solid var(--border-color);
  margin-top: auto;
}

.style-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.style-emoji {
  font-size: 16px;
}

.voice-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .option-grid {
    grid-template-columns: 1fr;
  }
  
  .anchor-grid {
    grid-template-columns: 1fr;
  }
}
</style>
