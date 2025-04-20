<template>
  <div class="config-page">
    <div v-if="configChanged" class="config-changed-alert">
      <el-alert
        title="配置已更改但尚未应用"
        type="warning"
        description="您的配置已保存，但需要点击下方的'刷新配置'按钮才能生效"
        show-icon
        :closable="false"
      >
        <template #default>
          <el-button type="primary" size="small" @click="refreshConfig">立即刷新配置</el-button>
        </template>
      </el-alert>
    </div>
    <div class="config-side" label-position="right">
      <el-form :model="config" >
        <el-form-item :label="t('configPage.language')">
          <el-select
            v-model="config.language"
            size="small"
            class="input-path"
            @change="saveLanguageConfig"
          >
            <el-option
              v-for="lang in languages"
              :key="lang.value"
              :label="lang.label"
              :value="lang.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="t('configPage.downloadPath')">
          <el-alert
            title="Web版本不支持设置下载路径"
            type="info"
            :closable="false"
            description="音频文件将直接下载到浏览器的默认下载位置"
          />
        </el-form-item>
        <el-form-item :label="t('configPage.retryCount')">
            <el-input
              type="number"
              v-model="config.retryCount"
              min="1"
              size="small"
              class="input-path"
              @change="setRetryCount"
              />
        </el-form-item>
        <el-form-item :label="t('configPage.retryInterval')">
            <el-input
              type="number"
              v-model="config.retryInterval"
              min="0"
              size="small"
              class="input-path"
              @change="setRetryInterval"
              />
        </el-form-item>
        <el-form-item :label="t('configPage.speechKey')">
            <el-input
              v-model="config.speechKey"
              size="small"
              class="input-path"
              @change="setSpeechKey"
              />
        </el-form-item>
        <el-form-item :label="t('configPage.serviceRegion')">
            <el-input
              v-model="config.serviceRegion"
              size="small"
              class="input-path"
              @change="setServiceRegion"
              :placeholder="t('configPage.serviceRegionPlaceHolder')"
              />
        </el-form-item>
        <el-form-item :label="t('configPage.thirdPartyApi')">
            <el-input
              v-model="config.thirdPartyApi"
              size="small"
              class="input-path"
              :placeholder="t('configPage.thirdPartyApiPlaceholder')"
              @change="setThirdPartyApi"
              />
        </el-form-item>
        <el-form-item :label="t('configPage.tts88Key')">
          <el-input
            v-model="config.tts88Key"
            size="small"
            class="input-path"
            :placeholder="t('configPage.tts88KeyPlaceholder')"
            @change="setTTS88Key"
          />
        </el-form-item>
        <el-form-item :label="t('configPage.openAIKey')">
            <el-input
              v-model="config.openAIKey"
              size="small"
              class="input-path"
              @change="setOpenAIKey"
              />
        </el-form-item>
        <el-form-item :label="t('configPage.openAIBaseUrl')">
            <el-input
              v-model="config.openAIBaseUrl"
              size="small"
              class="input-path"
              @change="setOpenAIBaseUrl"
              :placeholder="t('configPage.openAIBaseUrlPlaceholder')"
              />
        </el-form-item>
        <el-form-item :label="t('configPage.gptModel')">
          <el-select
            v-model="config.gptModel"
            size="small"
            class="input-path"
            @change="setGPTModel"
          >
            <el-option
              v-for="model in gptModels"
              :key="model.value"
              :label="model.label"
              :value="model.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="t('configPage.autoplay')">
          <el-switch
            v-model="config.autoplay"
            :active-text="t('configPage.yes')"
            :inactive-text="t('configPage.no')"
            inline-prompt
            @change="switchChange"
          />
        </el-form-item>
        <el-form-item :label="t('configPage.updateNotification')">
          <el-switch
            v-model="config.updateNotification"
            :active-text="t('configPage.yes')"
            :inactive-text="t('configPage.no')"
            inline-prompt
            @change="updateNotificationChange"
          />
        </el-form-item>
        <el-form-item :label="t('configPage.titleStyle')">
          <el-switch
            v-model="config.titleStyle"
            active-text="MacOS"
            inactive-text="Windows"
            @change="updateTitleStyle"
          />
        </el-form-item>
        <el-form-item :label="t('configPage.auditionText')">
          <el-input v-model="config.audition" size="small" class="input-path">
            <template #append>
              <el-button type="primary" @click="auditionConfig">{{ t('configPage.confirm') }}</el-button>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item :label="t('configPage.templateEdit')">
          <el-table
            :data="config.formConfigList"
            style="width: 100%"
            height="calc(100vh - 560px)"
          >
          <el-table-column :prop="t('configPage.name')" :label="t('configPage.name')">
              <template #default="scope">
                <el-popover
                  effect="light"
                  trigger="hover"
                  placement="top"
                  width="auto"
                >
                  <template #default>-->
                    <div>{{ t('configPage.language') }}: {{ scope.row.content.languageSelect }}</div>
                    <div>{{ t('configPage.voice') }}: {{ scope.row.content.voiceSelect }}</div>
                    <div>{{ t('configPage.style') }}: {{ scope.row.content.voiceStyleSelect }}</div>
                    <div>{{ t('configPage.role') }}: {{ scope.row.content.role }}</div>
                    <div>{{ t('configPage.speed') }}: {{ scope.row.content.speed }}</div>
                    <div>{{ t('configPage.pitch') }}: {{ scope.row.content.pitch }}</div>

                  </template>
                  <template #reference>
                    <el-tag>{{ scope.row.tagName }}</el-tag>
                  </template>
                </el-popover>
              </template>
            </el-table-column>
            <el-table-column :label="t('configPage.action')">
              <template #default="scope">
                <el-button
                  size="small"
                  type="danger"
                  @click="handleDelete(scope.$index, scope.row)"
                  >{{ t('configPage.remove') }}</el-button
                >
              </template>
            </el-table-column>
          </el-table>
        </el-form-item>
        <el-form-item class="btns">
          <el-button type="primary" @click="refreshConfig"
            ><el-icon><Refresh /></el-icon>{{ t('configPage.refreshConfig') }}</el-button
          >
          <el-button type="warning" @click="openConfigFile"
            ><el-icon><Document /></el-icon>{{ t('configPage.configFile') }}</el-button
          >
          <el-dropdown split-button type="success" @click="openLogs">
            <el-icon><Finished /></el-icon>{{ t('configPage.openLogs') }}
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="openLogFolder"
                  ><el-icon><FolderDelete /></el-icon>{{ t('configPage.clearLogs') }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useTtsStore } from "@/store/store";
import { storeToRefs } from "pinia";
import { useI18n } from 'vue-i18n';
import i18n from "@/assets/i18n/i18n";
import WebStore from "@/store/web-store";

const { t } = useI18n();
const store = new WebStore();

const ttsStore = useTtsStore();
const { config } = storeToRefs(ttsStore);

// 配置是否已更改但尚未应用
const configChanged = ref(false);

// 刷新配置
const refreshConfig = () => {
  window.location.reload();
  configChanged.value = false;
};

const languages = [
  { label: 'English', value: 'en' },
  { label: 'Español', value: 'es' },
  { label: '中文', value: 'zh' },
];

const gptModels = [
  { label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo'},
  { label: 'GPT-3.5 Turbo 16k', value: 'gpt-3.5-turbo-16k'},
  { label: 'GPT-3.5 Turbo Instruct', value: 'gpt-3.5-turbo-instruct'},
  { label: 'GPT 4 8k', value: 'gpt-4'},
  { label: 'GPT 4 32k', value: 'gpt-4-32k'},
];

const saveLanguageConfig = () => {
  // 记录切换前的语言
  const previousLang = i18n.global.locale.value;
  console.log('切换语言，从', previousLang, '到', config.value.language);
  
  // 更新i18n的语言设置
  i18n.global.locale.value = config.value.language;
  
  // 强制刷新组件
  document.dispatchEvent(new Event('language-changed'));
  
  // 保存语言设置到本地存储
  ttsStore.setLanguage();
  
  // 同时更新localStorage中的language键
  try {
    localStorage.setItem('language', JSON.stringify(config.value.language));
  } catch (e) {
    console.error('保存language到localStorage失败:', e);
  }
  
  // 显示成功消息
  ElMessage({
    message: config.value.language === 'zh' ? 
      '语言设置已更新，页面将自动刷新。' : 
      'Language settings updated, the page will refresh.',
    type: "success",
    duration: 2000,
  });
  
  // 标记配置已更改但尚未应用
  configChanged.value = true;
  
  // 添加语言切换日志，帮助调试
  console.log('语言已切换为:', config.value.language);
  console.log('当前i18n locale:', i18n.global.locale.value);
  
  // 延迟刷新页面以确保语言设置正确应用
  setTimeout(() => {
    window.location.reload();
  }, 2000);
};


const openFolderSelector = async () => {
  // Web版本不支持选择本地文件夹
  ElMessage({
    message: 'Web版本不支持选择本地文件夹保存',
    type: "warning",
    duration: 3000,
  });
};

const successMessage = () => {
  ElMessage({
    message: '保存成功，请点击右下角"刷新配置"按钮立即应用更改。',
    type: "success",
    duration: 3000,
  });
  // 标记配置已更改但尚未应用
  configChanged.value = true;
};

const handleDelete = (index: any, row: any) => {
  delete config.value.formConfigJson[row.tagName];
  store.set("FormConfig", config.value.formConfigJson);
  ttsStore.genFormConfig();

  ElMessage({
    message: '删除成功，请点击"刷新配置"立即应用。',
    type: "success",
    duration: 2000,
  });
};

const openConfigFile = () => {
  // Web版本不支持查看配置文件
  ElMessage({
    message: 'Web版本无法查看配置文件，配置保存在浏览器本地存储中',
    type: "info",
    duration: 3000,
  });
};

const openLogs = () => {
  // Web版本不支持查看日志
  ElMessage({
    message: 'Web版本不支持查看日志，请使用浏览器开发者工具查看控制台输出',
    type: "info",
    duration: 3000,
  });
};

const openLogFolder = () => {
  // Web版本不支持查看日志文件夹
  ElMessage({
    message: 'Web版本不支持查看日志文件夹',
    type: "info",
    duration: 3000,
  });
};

const savePathConfig = () => {
  // Web版本不需要保存路径
  ElMessage({
    message: 'Web版本不支持此选项',
    type: "info",
    duration: 2000,
  });
};

const auditionConfig = () => {
  try {
    // 标记配置已更改但尚未应用
    configChanged.value = true;
    
    // 检查TTS88 API是否已配置
    if (!config.value.thirdPartyApi) {
      ElMessage({
        message: '请先配置 TTS88 API 地址才能使用试听功能',
        type: "warning",
        duration: 3000,
      });
      return;
    }
    
    // 保存试听文本并启动播放
    ttsStore.setAuditionConfig();
    
    // 提示用户
    ElMessage({
      message: '试听文本已保存，正在进行语音合成并播放...',
      type: "success",
      duration: 3000,
    });
    
    console.log('试听请求已发送，请查看控制台日志获取详细信息');
  } catch (err) {
    console.error('试听功能出错:', err);
    ElMessage({
      message: '试听功能出错: ' + (err instanceof Error ? err.message : String(err)),
      type: "error",
      duration: 3000,
    });
  }
};

const switchChange = () => {
  ttsStore.setAutoPlay();
  successMessage();
};

const updateNotificationChange = () => {
  ttsStore.updateNotificationChange();
  successMessage();
};

const updateTitleStyle = () => {
  ttsStore.updateTitleStyle();
  successMessage();
};

const setSpeechKey = () => {
  ttsStore.setSpeechKey();
  successMessage();
};

const setServiceRegion = () => {
  ttsStore.setServiceRegion();
  successMessage();
};

const setOpenAIKey = () => {
  ttsStore.setOpenAIKey();
  successMessage();
};

const setOpenAIBaseUrl = () => {
  ttsStore.setOpenAIBaseUrl();
  successMessage();
};

const setGPTModel = () => {
  ttsStore.setGPTModel();
  successMessage();
};

const setRetryCount = () => {
  if (config.value.retryCount == '' || config.value.retryCount < 0) {
    config.value.retryCount = 1;
  }
  ttsStore.setRetryCount();
  successMessage();
};

const setRetryInterval = () => {
  if (config.value.retryInterval== '' || config.value.retryInterval < 0) {
    config.value.retryInterval = 0;
  }
  ttsStore.setRetryInterval();
  successMessage();
};

const setThirdPartyApi = () => {
  // 验证URL格式
  let url = config.value.thirdPartyApi;
  
  if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
    ElMessage({
      message: 'URL必须以http://或https://开头',
      type: "warning",
      duration: 3000,
    });
    // 不保存无效URL
    return;
  }
  
  ttsStore.setThirdPartyApi();
  successMessage();
};

const setTTS88Key = () => {
  store.set("tts88Key", config.value.tts88Key);
  ttsStore.config.tts88Key = config.value.tts88Key;
  ttsStore.setTTS88Key();
  successMessage();
};

// 检查配置是否与存储的值一致
const checkConfigConsistency = () => {
  // 检查TTS88 API URL
  const storedThirdPartyApi = store.get("thirdPartyApi") || "";
  const currentThirdPartyApi = config.value.thirdPartyApi || "";
  
  // 检查TTS88 Key
  const storedTTS88Key = store.get("tts88Key") || "";
  const currentTTS88Key = config.value.tts88Key || "";
  
  // 检查OpenAI Base URL
  const storedOpenAIBaseUrl = store.get("openAIBaseUrl") || "";
  const currentOpenAIBaseUrl = config.value.openAIBaseUrl || "";
  
  // 检查OpenAI Key
  const storedOpenAIKey = store.get("openAIKey") || "";
  const currentOpenAIKey = config.value.openAIKey || "";
  
  // 检查其他关键配置...
  
  // 如果任何存储的值与当前值不一致，且不是初始空值
  if ((storedThirdPartyApi && storedThirdPartyApi !== currentThirdPartyApi) ||
      (storedTTS88Key && storedTTS88Key !== currentTTS88Key) ||
      (storedOpenAIBaseUrl && storedOpenAIBaseUrl !== currentOpenAIBaseUrl) ||
      (storedOpenAIKey && storedOpenAIKey !== currentOpenAIKey)) {
    console.log("检测到配置不一致");
    configChanged.value = true;
  }
};

// 在组件挂载后检查配置一致性
onMounted(() => {
  checkConfigConsistency();
  
  // 检查当前语言与界面显示的语言是否一致
  console.log('当前语言设置:', i18n.global.locale.value);
  console.log('组件内的语言设置:', config.value.language);
  
  // 如果不一致，则使用组件内的语言设置
  if (i18n.global.locale.value !== config.value.language) {
    console.log('语言设置不一致，更新为:', config.value.language);
    i18n.global.locale.value = config.value.language;
    
    // 更新localStorage
    try {
      localStorage.setItem('language', JSON.stringify(config.value.language));
    } catch (e) {
      console.error('保存language到localStorage失败:', e);
    }
  }
});

// 监听关键配置变更
watch([
  () => config.value.thirdPartyApi, 
  () => config.value.tts88Key,
  () => config.value.openAIBaseUrl,
  () => config.value.openAIKey
], () => {
  checkConfigConsistency();
});
</script>

<style scoped>
.config-page {
  display: flex;
  flex-direction: column;
  padding: 10px;
  height: 97%;
}

.config-changed-alert {
  width: 80%;
  margin-bottom: 15px;
  align-self: center;
}

.config-side {
  width: 100%;
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
}

.el-form {
  margin-top: 7px;
  width: 100%;
  padding-left: 10px;
  padding-right: 10px;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

:deep(.input-path .el-input-group__append) {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  line-height: 1;
  height: 32px;
  white-space: nowrap;
  cursor: pointer;
  color: #fff;
  text-align: center;
  box-sizing: border-box;
  outline: 0;
  transition: 0.1s;
  font-weight: 500;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  vertical-align: middle;
  appearance: none;
  background-color: #409eff;
  border-color: #409eff;
  padding: 8px 15px;
  font-size: 14px;
  border-radius: 4px;
}

:deep(.el-table .el-table__cell) {
  padding: 3px 0 !important;
}

.el-form-item {
  width: 80%;
  margin-bottom: 8px;
}

.btns {
  width: 80%;
  box-sizing: border-box;
  padding-right: 2px;
  margin-top: auto;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
}

:deep(.btns .el-form-item__content) {
  justify-content: space-between;
  display: flex;
  width: 100%;
}

.el-button + .el-button {
  margin-left: 0;
}
</style>
