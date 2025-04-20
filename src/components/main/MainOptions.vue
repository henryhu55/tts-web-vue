<template>
  <div class="options">
    <el-form :model="formConfig" label-position="left">
      <!-- 预设配置选择器 -->
      <div class="option-item">
        <div class="option-label">
          <el-tooltip 
            content="选择预设语音风格，快速应用多个配置" 
            placement="top"
            effect="light"
          >
            <span>{{ t('options.preset') || '预设' }}</span>
            <el-icon class="icon-right"><Star /></el-icon>
          </el-tooltip>
        </div>
        <el-select
          v-model="currentPreset"
          :placeholder="t('options.selectPreset') || '选择预设'"
          class="full-width"
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
              <span style="margin-left: 8px">{{ preset.name }}</span>
            </div>
          </el-option>
        </el-select>
      </div>

      <div class="option-item">
        <div class="option-label">
          <el-tooltip 
            content="选择用于文本转语音的API服务" 
            placement="top"
            effect="light"
          >
            <span>{{ t('options.api') || '接口' }}</span>
            <el-icon class="icon-right"><Connection /></el-icon>
          </el-tooltip>
        </div>
        <el-select
          v-model="formConfig.api"
          :placeholder="t('options.selectApi') || '选择接口'"
          @change="apiChange"
          class="full-width"
          >
          <el-option
            v-for="item in oc.apiSelect"
            :key="item.value"
            :label="item.label"
            :value="item.value"
            />
        </el-select>
      </div>
      <div class="option-item">
        <div class="option-label">
          <el-tooltip 
            content="选择语音的语言" 
            placement="top"
            effect="light"
          >
            <span>{{ t('options.language') || '语言' }}</span>
            <el-icon class="icon-right"><ChatDotRound /></el-icon>
          </el-tooltip>
        </div>
        <el-select-v2
          class="full-width"
          v-model="formConfig.languageSelect"
          :placeholder="t('options.selectLanguage') || '选择语言'"
          filterable
          :options="oc.languageSelect"
          @change="languageSelectChange"
        >
        </el-select-v2>
      </div>
      <div class="option-item">
        <div class="option-label">
          <el-tooltip 
            content="选择要使用的语音人物" 
            placement="top"
            effect="light"
          >
            <span>{{ t('options.voice') || '语音' }}</span>
            <el-icon class="icon-right"><Microphone /></el-icon>
          </el-tooltip>
        </div>
        <el-select
          v-model="formConfig.voiceSelect"
          :placeholder="t('options.selectVoice') || '选择语音'"
          @change="voiceSelectChange"
          class="full-width"
        >
          <el-option
            v-for="item in voiceSelectList"
            :key="item.ShortName"
            :label="item.DisplayName + '-' + item.LocalName"
            :value="item.ShortName"
          >
            <div style="display: flex; justify-content: space-between">
              <span style="margin-right: 5px">{{
                item.DisplayName + "-" + item.LocalName
              }}</span>
              <el-button
                size="small"
                type="success"
                circle
                @click.stop="audition(item.ShortName)"
                ><el-icon><CaretRight /></el-icon
              ></el-button>
            </div>
          </el-option>
        </el-select>
      </div>
      <div class="option-item">
        <div class="option-label">
          <el-tooltip 
            content="选择语音的说话风格，如新闻播报、抒情等" 
            placement="top"
            effect="light"
          >
            <span>{{ t('options.speakingStyle') || '风格' }}</span>
            <el-icon class="icon-right"><Mic /></el-icon>
          </el-tooltip>
        </div>
        <el-select
          v-model="formConfig.voiceStyleSelect"
          :placeholder="t('options.selectSpeakingStyle') || '选择风格'"
          :disabled="apiEdge"
          class="full-width"
        >
          <el-option
            v-for="item in voiceStyleSelectList"
            :key="item"
            :label="getStyleDes(item)?.word || item"
            :value="item"
          >
            <div style="display: flex; justify-content: start">
              <span style="margin-right: 5px">{{
                getStyleDes(item)?.emoji
              }}</span>
              <span>{{ getStyleDes(item)?.word || item }}</span>
            </div>
          </el-option>
        </el-select>
      </div>
      <div class="option-item">
        <div class="option-label">
          <el-tooltip 
            content="选择语音的角色扮演类型，如老年人、年轻人等" 
            placement="top"
            effect="light"
          >
            <span>{{ t('options.rolePlaying') || '角色' }}</span>
            <el-icon class="icon-right"><UserFilled /></el-icon>
          </el-tooltip>
        </div>
        <el-select 
          v-model="formConfig.role" 
          :placeholder="t('options.selectRole') || '选择角色'" 
          :disabled="apiEdge"
          class="full-width"
        >
          <el-option
            v-for="item in rolePlayList"
            :key="item"
            :label="getRoleDes(item)?.word || item "
            :value="item"
          >
            <div style="display: flex; justify-content: start">
              <span style="margin-right: 5px">{{
                getRoleDes(item)?.emoji
              }}</span>
              <span>{{ getRoleDes(item)?.word || item }}</span>
            </div>
          </el-option>
        </el-select>
      </div>
      
      <!-- 新增强度配置 -->
      <div class="option-item">
        <div class="option-label">
          <el-tooltip 
            content="调整语音风格的强度程度" 
            placement="top"
            effect="light"
          >
            <span>{{ t('options.intensity') || '强度' }}</span>
            <el-icon class="icon-right"><Aim /></el-icon>
          </el-tooltip>
        </div>
        <el-select
          v-model="formConfig.intensity"
          :placeholder="t('options.selectIntensity') || '选择强度'"
          :disabled="apiEdge"
          class="full-width"
        >
          <el-option value="default" :label="t('options.default') || '默认'"></el-option>
          <el-option value="0.5" :label="t('options.weak') || '弱 (0.5)'"></el-option>
          <el-option value="1" :label="t('options.normal') || '正常 (1)'"></el-option>
          <el-option value="1.5" :label="t('options.strong') || '强 (1.5)'"></el-option>
          <el-option value="2" :label="t('options.extraStrong') || '超强 (2)'"></el-option>
        </el-select>
      </div>
      
      <!-- 新增静音配置 -->
      <div class="option-item">
        <div class="option-label">
          <el-tooltip 
            content="在文本中插入不同长度的停顿" 
            placement="top"
            effect="light"
          >
            <span>{{ t('options.silence') || '静音' }}</span>
            <el-icon class="icon-right"><Timer /></el-icon>
          </el-tooltip>
        </div>
        <el-select
          v-model="formConfig.silence"
          :placeholder="t('options.selectSilence') || '选择静音'"
          :disabled="apiEdge"
          class="full-width"
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
      
      <!-- 新增音量配置 -->
      <div class="option-item">
        <div class="option-label">
          <el-tooltip 
            content="调整语音的音量大小" 
            placement="top"
            effect="light"
          >
            <span>{{ t('options.volume') || '音量' }}</span>
            <el-icon class="icon-right"><Headset /></el-icon>
          </el-tooltip>
        </div>
        <el-select
          v-model="formConfig.volume"
          :placeholder="t('options.selectVolume') || '选择音量'"
          :disabled="apiEdge"
          class="full-width"
        >
          <el-option value="default" :label="t('options.default') || '默认'">
            <div class="volume-option">
              <el-icon><Headset /></el-icon>
              <span style="margin-left: 8px">{{ t('options.default') || '默认' }}</span>
            </div>
          </el-option>
          <el-option value="extraWeak" :label="t('options.extraWeak') || '超弱'">
            <div class="volume-option">
              <span class="volume-icon"><i class="volume-bar" style="height: 3px;"></i></span>
              <span style="margin-left: 8px">{{ t('options.extraWeak') || '超弱' }}</span>
            </div>
          </el-option>
          <el-option value="weak" :label="t('options.weak') || '弱'">
            <div class="volume-option">
              <span class="volume-icon"><i class="volume-bar" style="height: 6px;"></i></span>
              <span style="margin-left: 8px">{{ t('options.weak') || '弱' }}</span>
            </div>
          </el-option>
          <el-option value="strong" :label="t('options.strong') || '强'">
            <div class="volume-option">
              <span class="volume-icon">
                <i class="volume-bar" style="height: 9px;"></i>
                <i class="volume-bar" style="height: 12px;"></i>
              </span>
              <span style="margin-left: 8px">{{ t('options.strong') || '强' }}</span>
            </div>
          </el-option>
          <el-option value="extraStrong" :label="t('options.extraStrong') || '超强'">
            <div class="volume-option">
              <span class="volume-icon">
                <i class="volume-bar" style="height: 9px;"></i>
                <i class="volume-bar" style="height: 12px;"></i>
                <i class="volume-bar" style="height: 15px;"></i>
              </span>
              <span style="margin-left: 8px">{{ t('options.extraStrong') || '超强' }}</span>
            </div>
          </el-option>
        </el-select>
      </div>
      
      <!-- 速度滑块 -->
      <div class="option-item">
        <div class="option-label">
          <el-tooltip 
            content="调整语音的说话速度" 
            placement="top"
            effect="light"
          >
            <span>{{ t('options.speed') || '语速' }}</span>
            <el-icon class="icon-right"><DArrowRight /></el-icon>
          </el-tooltip>
        </div>
        <div class="slider-container">
          <el-slider
            v-model="formConfig.speed"
            show-input
            size="small"
            :show-input-controls="false"
            :max="3"
            :step="0.01"
          />
        </div>
      </div>
      
      <!-- 音调滑块 -->
      <div class="option-item">
        <div class="option-label">
          <el-tooltip 
            content="调整语音的音调高低" 
            placement="top"
            effect="light"
          >
            <span>{{ t('options.pitch') || '音调' }}</span>
            <el-icon class="icon-right"><TrendCharts /></el-icon>
          </el-tooltip>
        </div>
        <div class="slider-container">
          <el-slider
            v-model="formConfig.pitch"
            show-input
            size="small"
            :show-input-controls="false"
            :max="2"
            :step="0.01"
          />
        </div>
      </div>
      
      <div class="option-item startBtn">
        <div class="configOption">
          <el-button
            color="#626aef"
            :dark="false"
            plain
            size="small"
            @click="saveConfig"
            >{{ t('options.saveConfig') }}</el-button
          >
          <el-select-v2
            class="get-cfg"
            v-model="currConfigName"
            :placeholder="t('options.selectConfig')"
            filterable
            :options="config.configLabel"
            @change="configChange"
          ></el-select-v2>
        </div>
        <a href="#" class="btn" @click="startBtn">
          <template v-if="isLoading">
            <Loading></Loading>
          </template>
          <template v-else> {{ t('options.startConversion') }} </template>
        </a>
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
  DocumentChecked, Reading, Collection, Lightning, Cloudy
} from '@element-plus/icons-vue';

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

const audition = (value: string) => {
  ttsStore.audition(value);
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
</script>

<style scoped>
.options {
  background-color: #fff;
  margin-left: 5px;
  padding: 10px 12px !important;
  border: 1px solid #dcdfe6;
  border-radius: 5px;
}
.el-form {
  height: 99%;
  display: flex;
  flex-direction: column;
}
.option-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  width: 100%;
}
.option-label {
  width: 80px;
  font-size: 14px;
  color: #606266;
  text-align: left;
  padding-right: 8px;
  display: flex;
  align-items: center;
}
.icon-right {
  margin-left: 4px;
  font-size: 14px;
  color: #909399;
}
.slider-container {
  flex: 1;
  margin-right: 5px;
}
.full-width {
  width: 100% !important;
}
.configOption {
  display: flex;
  flex-direction: column;
}
.el-slider {
  margin-left: 5px;
  width: 100%;
}
.languageSelect {
  width: 100% !important;
}
.get-cfg {
  margin-top: 2px;
  width: 100px;
}
:deep(.el-form-item__label) {
  margin-bottom: 2px !important;
}
:deep(.el-slider__runway.show-input) {
  margin-right: 10px;
}
:deep(.el-slider > .el-input-number) {
  width: 40px;
}
:deep(.el-slider .el-input__wrapper) {
  width: 100%;
  padding: 0 !important;
  margin: 0 !important;
}
:deep(.el-switch__label.is-active) {
  font-weight: bold;
}
.startBtn {
  margin-bottom: 0 !important;
  flex: 1;
  display: flex !important;
  align-items: flex-end;
  justify-content: space-between;
}
.volume-option {
  display: flex;
  align-items: center;
}
.volume-icon {
  display: flex;
  align-items: flex-end;
  height: 15px;
}
.volume-bar {
  display: inline-block;
  width: 3px;
  background-color: #409EFF;
  margin-right: 2px;
  border-radius: 1px;
}
.preset-option {
  display: flex;
  align-items: center;
}
.btn:link,
.btn:visited {
  text-transform: uppercase;
  text-decoration: none;
  color: rgb(27, 27, 27);
  padding: 8px 30px;
  border: 1px solid;
  border-radius: 1000px;
  display: inline-block;
  transition: all 0.2s;
  position: relative;
}
.btn:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(27, 27, 27, 0.5);
}
.btn:active {
  transform: translateY(-3px);
}
.btn::after {
  content: "";
  display: inline-block;
  height: 100%;
  width: 100%;
  border-radius: 100px;
  top: 0;
  left: 0;
  position: absolute;
  z-index: -1;
  transition: all 0.3s;
}
.btn:hover::after {
  background-color: rgb(0, 238, 255);
  transform: scaleX(1.4) scaleY(1.5);
  opacity: 0;
}
</style>
