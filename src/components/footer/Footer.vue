<template>
  <div class="modern-footer">
    <div class="player-container">
      <div class="format-selection">
        <span class="format-label">{{ t('footer.format') }}:</span>
        <el-select
          v-model="config.formatType"
          class="format-select"
          @change="setFormatType"
        >
          <el-option
            v-for="format in formatOptions"
            :key="format.value"
            :label="format.label"
            :value="format.value"
          >
            <div class="format-option">
              <el-icon><Document /></el-icon>
              <span>{{ format.label }}</span>
            </div>
          </el-option>
        </el-select>
      </div>

      <div class="audio-player">
        <audio
          ref="audioPlayer"
          :src="currMp3Url"
          :autoplay="config.autoplay"
          controls
          controlslist="nodownload"
          class="modern-audio-player"
        ></audio>
      </div>

      <div class="download-button">
        <el-tooltip 
          :content="t('footer.downloadAudio')" 
          placement="top"
          effect="light"
        >
          <el-button
            type="primary"
            circle
            @click="download"
            :disabled="currMp3Url == ''"
            :loading="isLoading"
          >
            <el-icon><Download /></el-icon>
          </el-button>
        </el-tooltip>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTtsStore } from "@/store/store";
import { storeToRefs } from "pinia";
import { Download, Document } from "@element-plus/icons-vue";
import { useI18n } from 'vue-i18n';
const { t } = useI18n();  

const ttsStore = useTtsStore();
const { config, currMp3Url, isLoading, audioPlayer } = storeToRefs(ttsStore);

const formatOptions = [
  { label: 'MP3', value: '.mp3' },
  { label: 'WAV', value: '.wav' },
  { label: 'WMA', value: '.wma' },
  { label: 'AIFF', value: '.aiff' },
  // 根据需要添加更多格式
];

const download = () => {
  if (!currMp3Url.value) {
    return;
  }
  
  // 创建下载链接
  const a = document.createElement('a');
  a.href = currMp3Url.value;
  
  // 设置文件名
  const timestamp = new Date().getTime();
  const fileExtension = config.value.formatType || '.mp3';
  a.download = `tts_${timestamp}${fileExtension}`;
  
  // 添加到文档中并触发点击
  document.body.appendChild(a);
  a.click();
  
  // 清理
  document.body.removeChild(a);
};

const setFormatType = () => {
  ttsStore.setFormatType(); 
};
</script>

<style scoped>
.modern-footer {
  height: 70px;
  background-color: var(--card-background);
  border-bottom-right-radius: var(--border-radius-large);
  display: flex;
  align-items: center;
  padding: 0 20px;
  border-top: 1px solid var(--border-color);
  box-shadow: var(--shadow-light);
}

.player-container {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 16px;
}

.format-selection {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 200px;
}

.format-label {
  color: var(--primary-color);
  font-weight: 500;
  white-space: nowrap;
}

.format-select {
  width: 120px;
}

.format-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.audio-player {
  flex: 1;
}

.modern-audio-player {
  width: 100%;
  height: 36px;
  border-radius: var(--border-radius-medium);
}

:deep(audio::-webkit-media-controls-panel) {
  background-color: var(--card-background);
}

:deep(audio::-webkit-media-controls-play-button),
:deep(audio::-webkit-media-controls-mute-button) {
  color: var(--primary-color);
}

.download-button {
  margin-left: 8px;
}

/* 暗色主题适配 */
.dark-theme .modern-footer {
  background-color: var(--card-background);
}

.dark-theme audio::-webkit-media-controls-panel {
  background-color: var(--card-background);
}
</style>
