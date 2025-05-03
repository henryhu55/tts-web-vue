<template>
  <div class="modern-options">
    <!-- 顶部快速操作栏 -->
    <div class="top-controls">
      <div class="left-controls">
        <!-- API选择下拉菜单 -->
        <el-select
          v-model="formConfig.api"
          size="small"
          class="quick-select"
          @change="apiChange"
        >
          <template #prefix>
            <el-icon><Connection /></el-icon>
          </template>
          <el-option
            v-for="item in oc.apiSelect"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        
        <!-- 语言选择 -->
        <el-select
          v-model="formConfig.languageSelect"
          size="small"
          class="quick-select"
          @change="languageSelectChange"
          filterable
        >
          <template #prefix>
            <el-icon><ChatDotRound /></el-icon>
          </template>
          <el-option
            v-for="item in oc.languageSelect"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        
        <!-- 声音选择 -->
        <el-select
          v-model="formConfig.voiceSelect"
          size="small"
          class="quick-select"
          @change="voiceSelectChange"
          filterable
        >
          <template #prefix>
            <el-icon><Microphone /></el-icon>
          </template>
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
        
        <!-- 预设按钮 -->
        <el-popover
          placement="bottom"
          :width="300"
          trigger="click"
        >
          <template #reference>
            <el-button size="small" class="preset-button" :icon="Star">预设</el-button>
          </template>
          <div class="preset-popover">
            <h4>应用预设</h4>
            <div class="preset-list">
              <div 
                v-for="preset in presets" 
                :key="preset.id"
                class="preset-item"
                @click="applyPreset(preset.id)"
              >
                <el-icon><component :is="preset.icon" /></el-icon>
                <span>{{ preset.name }}</span>
              </div>
            </div>
          </div>
        </el-popover>
      </div>
      
      <!-- 免费额度信息 -->
      <div v-if="formConfig.api === 5 && localTTSStore.serverStatus.freeLimit && localTTSStore.serverStatus.connected" class="free-quota-info">
        <div class="quota-text">
          <span>免费额度: {{ localTTSStore.serverStatus.freeLimit.remaining }}/{{ localTTSStore.serverStatus.freeLimit.free_limit }} 字符</span>
        </div>
        <el-progress 
          :percentage="localTTSStore.freeLimitUsagePercent" 
          :status="localTTSStore.freeLimitUsagePercent > 90 ? 'exception' : 'success'"
          :stroke-width="5"
          :show-text="false"
        />
      </div>
      
      <div class="right-controls">
        <!-- 高级设置按钮 -->
        <el-button 
          size="small" 
          @click="showAdvancedSettings = true"
          :icon="Setting"
          class="settings-button"
        >
          高级设置
        </el-button>
        
        <!-- 语音主播模式按钮 -->
        <el-button 
          size="small" 
          @click="showVoiceAnchors = true"
          :icon="Avatar"
          class="anchor-button"
        >
          语音主播
        </el-button>
        
        <!-- 开始按钮 -->
        <el-button 
          type="primary" 
          @click="startBtn" 
          :loading="isLoading"
          size="small"
          class="start-button"
        >
          <el-icon><CaretRight /></el-icon>
          开始转换
        </el-button>
      </div>
    </div>
    
    <!-- 语速/音调快速调节 -->
    <div class="quick-sliders">
      <div class="slider-item">
        <span class="slider-label">语速: {{ formConfig.speed }}x</span>
        <el-slider 
          v-model="formConfig.speed" 
          :min="0.5" 
          :max="2" 
          :step="0.1" 
          class="compact-slider"
        />
      </div>
      <div class="slider-item">
        <span class="slider-label">音调: {{ formConfig.pitch }}x</span>
        <el-slider 
          v-model="formConfig.pitch" 
          :min="0.5" 
          :max="2" 
          :step="0.1"
          class="compact-slider" 
        />
      </div>
    </div>
    
    <!-- 本地TTS服务设置卡片 -->
    <el-card 
      v-if="formConfig.api === 5" 
      class="local-tts-card"
      shadow="hover"
    >
      <LocalTTSSettings />
    </el-card>
    
    <!-- 高级设置对话框 -->
    <el-dialog
      v-model="showAdvancedSettings"
      title="高级语音设置"
      width="70%"
      destroy-on-close
    >
      <div class="advanced-settings-dialog">
        <div class="options-grid">
          <!-- 风格选择 -->
          <div class="option-card">
            <div class="option-header">
              <div class="option-label">
                <span>{{ t('options.speakingStyle') }}</span>
                <el-icon><Mic /></el-icon>
              </div>
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
              <div class="option-label">
                <span>{{ t('options.rolePlaying') }}</span>
                <el-icon><UserFilled /></el-icon>
              </div>
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
          
          <!-- 强度滑块 -->
          <div class="option-card">
            <div class="option-header">
              <div class="option-label">
                <span>{{ t('options.intensity') }}</span>
                <el-icon><Aim /></el-icon>
              </div>
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
          <div class="option-card">
            <div class="option-header">
              <div class="option-label">
                <span>{{ t('options.silence') }}</span>
                <el-icon><Timer /></el-icon>
              </div>
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
          <div class="option-card">
            <div class="option-header">
              <div class="option-label">
                <span>{{ t('options.volume') }}</span>
                <el-icon><Headset /></el-icon>
              </div>
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
        </div>
        
        <div class="dialog-footer">
          <el-button @click="showAdvancedSettings = false">取消</el-button>
          <el-button type="primary" @click="saveAdvancedSettings">确认</el-button>
          <el-button @click="useDefaultSettings" class="action-button">
            <el-icon><RefreshRight /></el-icon>
            重置默认
          </el-button>
          <el-button type="success" @click="savePreset" class="action-button">
            <el-icon><Star /></el-icon>
            保存为预设
          </el-button>
        </div>
      </div>
    </el-dialog>
    
    <!-- 语音主播选择对话框 -->
    <el-dialog
      v-model="showVoiceAnchors"
      title="语音主播选择"
      width="80%"
      destroy-on-close
    >
      <div class="voice-anchor-dialog">
        <!-- 搜索和分类 -->
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
import { ref, reactive, watch, onMounted, computed } from "vue";
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
  padding: 15px 20px;
  position: relative;
}

/* 顶部快速操作栏 */
.top-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  flex-wrap: wrap;
  gap: 10px;
}

.left-controls, .right-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.quick-select {
  width: 150px;
}

.settings-button, .anchor-button {
  display: flex;
  align-items: center;
  gap: 5px;
}

.start-button {
  display: flex;
  align-items: center;
  gap: 5px;
  background: var(--primary-gradient, linear-gradient(90deg, #409EFF, #67C23A));
  color: white;
  border: none;
  padding: 8px 16px;
  font-weight: 600;
}

/* 快速滑块区域 */
.quick-sliders {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
  background-color: var(--card-background, #f8f9fa);
  padding: 10px 15px;
  border-radius: 6px;
  flex-wrap: wrap;
}

.slider-item {
  flex: 1;
  min-width: 200px;
}

.slider-label {
  font-size: 13px;
  color: var(--text-secondary, #606266);
  display: block;
  margin-bottom: 5px;
}

.compact-slider {
  margin: 0;
}

/* 免费额度信息 */
.free-quota-info {
  display: flex;
  flex-direction: column;
  padding: 0 20px;
  max-width: 200px;
}

.quota-text {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 5px;
  text-align: center;
}

/* 本地TTS卡片 */
.local-tts-card {
  margin-bottom: 20px;
}

/* 高级设置对话框 */
.advanced-settings-dialog {
  padding: 10px;
}

.dialog-footer {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 语音主播对话框 */
.voice-anchor-dialog {
  padding: 10px;
}

.anchor-filters {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.category-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.category-tab {
  padding: 6px 12px;
  border-radius: 4px;
  background-color: var(--card-background, #f5f7fa);
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.category-tab.active {
  background-color: var(--primary-color, #409EFF);
  color: white;
}

.anchor-search {
  width: 250px;
}

.anchor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
  max-height: 500px;
  overflow-y: auto;
  padding: 10px;
}

.anchor-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: var(--card-background, #f8f9fa);
  border-radius: 8px;
  padding: 12px;
  border: 1px solid var(--border-color, #dcdfe6);
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.anchor-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.anchor-card.selected {
  border-color: var(--primary-color, #409EFF);
  background: linear-gradient(to right, var(--card-background, #f8f9fa), rgba(64, 158, 255, 0.1));
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
  margin: 0 0 4px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.anchor-desc {
  font-size: 12px;
  color: var(--text-secondary, #909399);
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.anchor-actions {
  display: flex;
  align-items: center;
}

/* 预设弹出窗口 */
.preset-popover {
  padding: 10px;
}

.preset-popover h4 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 16px;
}

.preset-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preset-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.preset-item:hover {
  background-color: var(--primary-color-10, rgba(64, 158, 255, 0.1));
}

/* 响应式设计 */
@media (max-width: 768px) {
  .top-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .left-controls, .right-controls {
    justify-content: space-between;
  }
  
  .quick-select {
    width: 48%;
  }
  
  .free-quota-info {
    max-width: 100%;
    padding: 10px 0;
  }
  
  .slider-item {
    min-width: 100%;
  }
}
</style>
