<template>
  <div class="modern-aside">
    <div class="menu-container">
      <el-menu
        :default-active="page.asideIndex"
        class="modern-menu"
        @select="menuChange"
      >
        <el-menu-item index="1">
          <el-icon><Document /></el-icon>
          <span>{{ t('aside.text') }}</span>
        </el-menu-item>
        <el-menu-item index="2">
          <el-icon><Files /></el-icon>
          <span>{{ t('aside.batch') }}</span>
        </el-menu-item>
        <el-menu-item index="4">
          <el-icon><Notebook /></el-icon>
          <span>{{ t('aside.documents') }}</span>
        </el-menu-item>
        <el-menu-item index="5">
          <el-icon><VideoPlay /></el-icon>
          <span>在线生成字幕</span>
          <el-tag size="small" type="info" class="coming-soon-tag">即将上线</el-tag>
        </el-menu-item>
        <el-menu-item index="3">
          <el-icon><Setting /></el-icon>
          <span>{{ t('aside.settings') }}</span>
        </el-menu-item>
      </el-menu>
    </div>
    <div class="version-container">
      <div class="help-links">
        <div class="guide-button" @click="showUserGuide">
          <el-icon><Help /></el-icon>
          <span>查看引导</span>
        </div>
      </div>
      <Version />
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { useTtsStore } from "@/store/store";
import { storeToRefs } from "pinia";
import { useI18n } from 'vue-i18n';
import Version from "./Version.vue";
import { Document, Files, Setting, Notebook, Help, VideoPlay } from '@element-plus/icons-vue';

const { t } = useI18n();
const ttsStore = useTtsStore();
const { page, config } = storeToRefs(ttsStore);

const menuChange = (index: number) => {
  console.log(`菜单切换: 索引 ${index} 被点击`);
  page.value.asideIndex = index.toString();
  console.log(`页面索引设置为: ${page.value.asideIndex}`);
};

// 添加显示引导的方法
const showUserGuide = () => {
  // 检查window上是否有启动引导的方法（在App.vue中暴露）
  if (typeof window.__startGuide === 'function') {
    // @ts-ignore
    window.__startGuide();
  } else {
    // 如果没有找到方法，显示提示信息
    console.warn('引导功能未找到');
    alert('无法启动引导功能，请刷新页面后重试');
  }
};
</script>

<style scoped>
.modern-aside {
  height: 100%;
  background-color: var(--sidebar-background, #f5f7fa);
  border-right: 1px solid var(--border-color);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-bottom-left-radius: var(--border-radius-large);
  padding: 10px 0;
  box-shadow: inset -1px 0 0 rgba(0, 0, 0, 0.05);
}

.menu-container {
  flex: 1;
  overflow-y: auto;
}

.version-container {
  padding: 16px;
  font-size: 12px;
  color: var(--text-secondary);
  text-align: center;
}

.help-links {
  margin-bottom: 12px;
}

.guide-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  border-radius: var(--border-radius-small);
  background-color: rgba(74, 108, 247, 0.1);
  color: var(--primary-color);
  font-size: 13px;
  gap: 8px;
  cursor: pointer;
  transition: all var(--transition-fast);
  margin-bottom: 8px;
}

.guide-button:hover {
  background-color: rgba(74, 108, 247, 0.2);
  transform: translateY(-1px);
}

.guide-button .el-icon {
  font-size: 16px;
}

.modern-menu {
  border-right: none !important;
  background-color: transparent;
}

.modern-menu .el-menu-item {
  height: 48px;
  line-height: 48px;
  border-radius: var(--border-radius-medium);
  margin: 8px 12px;
  transition: all var(--transition-fast);
  font-weight: 500;
  display: flex;
  align-items: center;
}

.coming-soon-tag {
  margin-left: 8px;
  font-size: 10px;
  padding: 2px 6px;
  height: auto;
  line-height: 1.2;
}

.modern-menu .el-menu-item.is-active {
  background: var(--primary-gradient) !important;
  color: white;
  box-shadow: 0 4px 8px rgba(74, 108, 247, 0.25);
}

.modern-menu .el-menu-item:not(.is-active):hover {
  background-color: rgba(74, 108, 247, 0.1);
  transform: translateX(3px);
}

.modern-menu .el-menu-item .el-icon {
  margin-right: 12px;
  font-size: 18px;
}

:root[theme-mode="dark"] .modern-aside {
  background-color: var(--sidebar-background-dark, #1e2025);
  border-right-color: var(--border-color);
}
</style>
