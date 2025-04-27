<template>
  <div class="modern-main">
    <!-- 文本编辑区 -->
    <div class="input-area-card" v-show="page.asideIndex == '1'">
      <div class="card-header">
        <el-tabs @tab-click="handleTabClick" :model-value="page.tabIndex">
          <el-tab-pane name="1" :label="t('main.textTab')"></el-tab-pane>
          <el-tab-pane name="2" :label="t('main.ssmlTab')"></el-tab-pane>
        </el-tabs>
        
        <el-button @click="dialogVisible = true" type="primary" class="ai-button">
          <el-icon><MagicStick /></el-icon>
          <span>AI 生成</span>
        </el-button>
      </div>
      
      <div class="card-body">
        <div class="text-area-container" v-show="page.tabIndex == '1'">
          <el-input
            v-model="inputs.inputValue"
            type="textarea"
            :placeholder="t('main.placeholder')"
            class="modern-textarea"
            resize="none"
            :rows="10"
          />
        </div>
        <div class="text-area-container" v-show="page.tabIndex == '2'">
          <el-input 
            v-model="inputs.ssmlValue" 
            type="textarea" 
            class="modern-textarea"
            resize="none"
            :rows="10"
          />
        </div>
      </div>
    </div>

    <!-- AI 生成对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="t('main.titleGenerateTextGPT')" 
      width="500px" 
      draggable 
      class="modern-dialog"
    >
      <p class="dialog-description">{{ t('main.descriptionGenerateTextGPT') }}</p>
      <div class="dialog-input">
        <el-input 
          v-model="modalInput" 
          :placeholder="t('main.placeholderGPT')" 
          :disabled="dialogLoading"
          class="dialog-prompt-input"
        ></el-input>
        <el-button 
          type="primary" 
          @click="sendToChatGPT" 
          :loading="dialogLoading"
          class="dialog-submit-button"
        >
          <el-icon><ChatLineSquare /></el-icon>
          <span>生成</span>
        </el-button>
      </div>
    </el-dialog>

    <!-- 批量处理区域 -->
    <div class="batch-area-card" v-show="page.asideIndex == '2'">
      <div class="card-header">
        <h2>{{ t('aside.batch') }}</h2>
        <div class="batch-actions">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :on-change="fileChange"
            :on-remove="fileRemove"
            show-file-list="false"
            accept=".txt"
            multiple
          >
            <template #trigger>
              <el-button type="primary">
                <el-icon><Upload /></el-icon>
                {{ t('main.selectFiles') }}
              </el-button>
            </template>
          </el-upload>
          <el-button @click="clearAll" class="clear-button">
            <el-icon><DeleteFilled /></el-icon>
            {{ t('main.clearAll') }}
          </el-button>
        </div>
      </div>
      
      <div class="card-body">
        <el-table
          :data="tableData"
          style="width: 100%"
          class="modern-table"
          height="calc(100vh - 300px)"
        >
          <el-table-column
            prop="fileName"
            :label="t('main.fileName')"
            show-overflow-tooltip="true"
          />
          <el-table-column
            prop="filePath"
            :label="t('main.filePath')"
            show-overflow-tooltip="true"
          />
          <el-table-column
            prop="fileSize"
            :label="t('main.fileSize')"
            width="80"
            show-overflow-tooltip="true"
          />
          <el-table-column prop="status" :label="t('main.status')"
          width="100">
            <template #default="scope">
              <div>
                <el-tag
                  class="status-tag"
                  :type="scope.row.status == 'ready' ? 'info' : 'success'"
                  >{{ scope.row.status }}</el-tag
                >
              </div>
            </template>
          </el-table-column>
          <el-table-column :label="t('main.action')" width="120">
            <template #default="scope">
              <template v-if="scope.row.status == 'ready'">
                <el-button
                  size="small"
                  type="danger"
                  @click="handleDelete(scope.$index, scope.row)"
                  >{{t('main.remove')}}</el-button
                >
              </template>
              <template v-else>
                <div class="action-buttons">
                  <el-button
                    size="small"
                    type="primary"
                    @click="play(scope.row)"
                    circle
                    ><el-icon><CaretRight /></el-icon
                  ></el-button>
                  <el-button size="small" @click="openInFolder(scope.row)" circle
                    ><el-icon><FolderOpened /></el-icon
                  ></el-button>
                </div>
              </template>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
    
    <!-- 配置页显示 -->
    <MainOptions v-show="['1', '2'].includes(page.asideIndex)" class="options-container"></MainOptions>
    
    <div class="config-page-container" v-if="page.asideIndex == '3'">
      <ConfigPage></ConfigPage>
    </div>
    
    <div class="doc-page-container" v-if="page.asideIndex == '4'">
      <iframe class="doc-frame" src="https://docs.tts88.top/">
      </iframe>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import i18n from '@/assets/i18n/i18n';
import MainOptions from "./MainOptions.vue";
import ConfigPage from "../configpage/ConfigPage.vue";
import { ElButton, ElDialog, ElMessage } from 'element-plus'

import { ref, watch } from "vue";
import type { UploadInstance, UploadProps, UploadUserFile } from "element-plus";
import { useTtsStore } from "@/store/store";
import { storeToRefs } from "pinia";
const { t } = useI18n();  
const store = useTtsStore();
const { inputs, page, tableData, currMp3Url, config, formConfig, audioPlayer } =
  storeToRefs(store);
// SSML内容和文本框内容同步

i18n.global.locale.value = config.value.language;
watch(
  () => inputs.value.inputValue,
  (newValue) => {
    store.setSSMLValue(newValue);
  }
);

const showModal = ref(false);
const modalInput = ref('');
const dialogLoading = ref(false);

const sendToChatGPT = async () => {
  if (!modalInput.value) {
    ElMessage({
      message: "请输入提示文本",
      type: "warning",
      duration: 2000,
    });
    return;
  }
  
  // 检查是否配置了openAIKey
  if (!config.value.openAIKey) {
    ElMessage({
      message: "请先在设置页面配置OpenAI Key",
      type: "error",
      duration: 3000,
    });
    return;
  }
  
  dialogLoading.value = true;
  try {
    await store.startChatGPT(modalInput.value);
    dialogVisible.value = false;
  } catch (error) {
    console.error("GPT生成失败:", error);
  } finally {
    dialogLoading.value = false;
  }
};

const dialogVisible = ref(false)

const visible = ref(false)

const handleTabClick = (tab: any) => {
  page.value.tabIndex = tab.props.name;
};
const uploadRef = ref<UploadInstance>();

const handleDelete = (index: any, row: any) => {
  uploadRef.value!.handleRemove(row.file);
};

const fileChange = (uploadFile: any, uploadFiles: any) => {
  // 处理每个上传的文件
  Promise.all(uploadFiles.map(async (item: any) => {
    // 读取文件内容
    const reader = new FileReader();
    return new Promise((resolve) => {
      reader.onload = (e) => {
        resolve({
          fileName: item.name,
          filePath: item.raw.path,
          fileSize: item.size,
          status: "ready",
          file: item,
          content: e.target?.result as string
        });
      };
      reader.readAsText(item.raw);
    });
  })).then((results) => {
    tableData.value = results;
  });
};

const fileRemove = (uploadFile: any, uploadFiles: any) => {
  // 处理每个剩余的文件
  Promise.all(uploadFiles.map(async (item: any) => {
    // 如果文件已经有内容，直接使用
    if (item.content) {
      return {
        fileName: item.name,
        filePath: item.raw.path,
        fileSize: item.size,
        status: "ready",
        file: item,
        content: item.content
      };
    }
    // 否则重新读取文件内容
    const reader = new FileReader();
    return new Promise((resolve) => {
      reader.onload = (e) => {
        resolve({
          fileName: item.name,
          filePath: item.raw.path,
          fileSize: item.size,
          status: "ready",
          file: item,
          content: e.target?.result as string
        });
      };
      reader.readAsText(item.raw);
    });
  })).then((results) => {
    tableData.value = results;
  });
};

const clearAll = () => {
  tableData.value = [];
  uploadRef.value!.clearFiles();
};

const play = (val: any) => {
  // 在 web 版本中直接使用保存的音频 URL 播放
  if (audioPlayer.value) {
    (audioPlayer.value as HTMLAudioElement).pause();
  }
  
  if (val.audioUrl) {
    const audioElement = new Audio(val.audioUrl);
    audioPlayer.value = audioElement;
    audioElement.play();
    ElMessage({
      message: "正在播放",
      type: "success",
      duration: 2000,
    });
  } else {
    ElMessage({
      message: "没有可播放的音频",
      type: "warning",
      duration: 2000,
    });
  }
};

const openInFolder = (val: any) => {
  // Web版本不支持打开文件夹，改为下载功能
  if (val.audioUrl) {
    const a = document.createElement('a');
    a.href = val.audioUrl;
    a.download = val.fileName.split('.')[0] + '.mp3';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    ElMessage({
      message: "开始下载音频文件",
      type: "success",
      duration: 2000,
    });
  } else {
    ElMessage({
      message: "没有可下载的音频",
      type: "warning",
      duration: 2000,
    });
  }
};
</script>

<style scoped>
.modern-main {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-area-card, .batch-area-card {
  background-color: var(--card-background);
  border-radius: var(--border-radius-large);
  box-shadow: var(--shadow-medium);
  overflow: hidden;
  transition: transform var(--transition-normal), box-shadow var(--transition-normal);
}

.input-area-card:hover, .batch-area-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-large);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
}

.card-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.card-body {
  padding: 20px;
}

.text-area-container {
  height: 100%;
}

.modern-textarea {
  border: none;
  height: 100%;
}

:deep(.el-textarea__inner) {
  height: 100%;
  resize: none;
  border: none;
  background-color: var(--card-background);
  color: var(--text-primary);
  font-size: 16px;
  padding: 16px;
  line-height: 1.6;
}

.ai-button {
  display: flex;
  align-items: center;
  gap: 8px;
}

.modern-dialog {
  border-radius: var(--border-radius-large);
}

.dialog-description {
  margin-top: 0;
  margin-bottom: 20px;
  color: var(--text-secondary);
}

.dialog-input {
  display: flex;
  gap: 10px;
}

.dialog-prompt-input {
  flex: 1;
}

.dialog-submit-button {
  display: flex;
  align-items: center;
  gap: 6px;
}

.batch-actions {
  display: flex;
  gap: 10px;
}

.modern-table {
  border-radius: var(--border-radius-medium);
  overflow: hidden;
}

:deep(.el-table) {
  --el-table-border-color: var(--border-color);
  --el-table-header-bg-color: rgba(74, 108, 247, 0.05);
  --el-table-row-hover-bg-color: rgba(74, 108, 247, 0.03);
}

:deep(.el-table th) {
  background-color: var(--el-table-header-bg-color);
  font-weight: 600;
}

.status-tag {
  border-radius: 12px;
  padding: 0 10px;
}

.action-buttons {
  display: flex;
  gap: 6px;
}

.clear-button {
  display: flex;
  align-items: center;
  gap: 6px;
}

.config-page-container, .doc-page-container {
  flex: 1;
  background-color: var(--card-background);
  border-radius: var(--border-radius-large);
  box-shadow: var(--shadow-medium);
  overflow: hidden;
  height: calc(100vh - 180px);
}

.doc-frame {
  width: 100%;
  height: 100%;
  border: none;
}

.options-container {
  background-color: var(--card-background);
  border-radius: var(--border-radius-large);
  box-shadow: var(--shadow-medium);
  padding: 20px;
  margin-top: 20px;
}

:deep(.el-tabs__item) {
  font-size: 16px;
  padding: 0 20px;
}

:deep(.el-tabs__active-bar) {
  background-color: var(--primary-color);
}

:deep(.el-tabs__item.is-active) {
  color: var(--primary-color);
  font-weight: 600;
}

:deep(.el-tabs__nav-wrap::after) {
  background-color: var(--border-color);
}
</style>
