<template>
  <div class="modern-header">
    <div class="app-branding">
      <span class="app-title">TTS web vue</span>
    </div>
    <div class="controls">
      <div class="api-badge" @click="openApiSite">
        <span>TTS88</span>
        <span class="api-tag">API</span>
      </div>
      
      <div class="control-buttons">
        <el-tooltip content="切换主题" placement="bottom" effect="light">
          <el-button
            circle
            @click="$emit('toggle-theme')"
          >
            <el-icon><MoonNight /></el-icon>
          </el-button>
        </el-tooltip>
        
        <el-dropdown trigger="click">
          <el-button circle>
            <el-icon><More /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="showUserGuide">
                <el-icon><QuestionFilled /></el-icon> 查看引导
              </el-dropdown-item>
              <el-dropdown-item>
                <el-icon><InfoFilled /></el-icon> 关于应用
              </el-dropdown-item>
              <el-dropdown-item>
                <el-icon><QuestionFilled /></el-icon> 帮助文档
              </el-dropdown-item>
              <el-dropdown-item @click="openApiSite">
                <el-icon><Link /></el-icon> API 官网
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { useTtsStore } from "@/store/store";
import { storeToRefs } from "pinia";
import { Link, QuestionFilled, InfoFilled } from '@element-plus/icons-vue';

const ttsStore = useTtsStore();
const { config } = storeToRefs(ttsStore);

defineEmits(['toggle-theme']);

const openApiSite = () => {
  window.open("https://api.tts88.top", "_blank");
};

const showUserGuide = () => {
  if (window.__startGuide) {
    window.__startGuide();
  } else {
    console.warn('引导功能未找到');
    alert('无法启动引导功能，请刷新页面后重试');
  }
};
</script>

<style scoped>
.modern-header {
  height: 60px;
  background: var(--card-background);
  border-top-left-radius: var(--border-radius-large);
  border-top-right-radius: var(--border-radius-large);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: var(--shadow-light);
}

.app-branding {
  display: flex;
  align-items: center;
  padding-left: 0;
}

.app-title {
  font-weight: 700;
  font-size: 22px;
  color: var(--text-primary);
  background: linear-gradient(90deg, #4886FF, #66A5FF);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-transform: capitalize;
}

.controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.api-badge {
  display: flex;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  color: #4886FF;
  background-color: rgba(72, 134, 255, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.api-badge:hover {
  background-color: rgba(72, 134, 255, 0.15);
  transform: translateY(-1px);
}

.api-tag {
  display: inline-block;
  background-color: #4886FF;
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 0px 3px;
  border-radius: 2px;
  margin-left: 3px;
}

.control-buttons {
  display: flex;
  gap: 8px;
}

.dark-theme .modern-header {
  background: var(--card-background);
}
</style>
