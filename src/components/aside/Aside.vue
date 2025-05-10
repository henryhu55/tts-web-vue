<template>
  <div class="modern-aside">
    <div class="menu-container">
      <el-menu
        :default-active="page.asideIndex"
        class="modern-menu"
        @select="menuChange"
        collapse
      >
        <el-menu-item index="1">
          <el-tooltip :content="t('aside.text')" placement="right">
            <el-icon><Document /></el-icon>
          </el-tooltip>
        </el-menu-item>
        <el-menu-item index="2">
          <el-tooltip :content="t('aside.batch')" placement="right">
            <el-icon><Files /></el-icon>
          </el-tooltip>
        </el-menu-item>
        <el-menu-item index="4">
          <el-tooltip :content="t('aside.documents')" placement="right">
            <el-icon><Notebook /></el-icon>
          </el-tooltip>
        </el-menu-item>
        <el-menu-item index="5">
          <el-tooltip content="在线生成字幕" placement="right">
            <el-icon><VideoPlay /></el-icon>
          </el-tooltip>
        </el-menu-item>
        <el-menu-item index="3">
          <el-tooltip :content="t('aside.settings')" placement="right">
            <el-icon><Setting /></el-icon>
          </el-tooltip>
        </el-menu-item>
      </el-menu>
    </div>
    <div class="version-container">
      <el-tooltip content="查看引导" placement="right">
        <div class="icon-only-guide" @click="showUserGuide">
          <el-icon><Help /></el-icon>
        </div>
      </el-tooltip>
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
  border-bottom-left-radius: 0;
  padding: 0;
  padding-top: 20px;
  box-shadow: inset -1px 0 0 rgba(0, 0, 0, 0.05);
  width: 64px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 1001;
}

.menu-container {
  flex: 1;
  overflow-y: auto;
  position: relative;
}

.version-container {
  padding: 12px 8px;
  font-size: 12px;
  color: var(--text-secondary);
  text-align: center;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  margin-top: 8px;
}

.icon-only-guide {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  border-radius: 50%;
  background-color: rgba(74, 108, 247, 0.1);
  color: var(--primary-color);
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 0 auto 10px;
  width: 32px;
  height: 32px;
}

.icon-only-guide:hover {
  background-color: rgba(74, 108, 247, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(74, 108, 247, 0.15);
}

.icon-only-guide .el-icon {
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modern-menu {
  border-right: none !important;
  background-color: transparent;
  width: 64px;
}

.modern-menu .el-menu-item {
  height: 48px;
  line-height: 48px;
  border-radius: var(--border-radius-medium);
  margin: 8px 4px;
  transition: all var(--transition-fast);
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.modern-menu .el-menu-item .el-icon {
  margin-right: 0;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  transition: transform 0.3s ease;
}

.modern-menu .el-menu-item:hover .el-icon {
  transform: scale(1.1);
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

.modern-menu.el-menu--collapse .el-menu-item:not(.is-active):hover {
  transform: scale(1.05);
}

:root[theme-mode="dark"] .modern-aside {
  background-color: var(--sidebar-background-dark, #1e2025);
  border-right-color: var(--border-color);
}

:root[theme-mode="dark"] .version-container {
  border-top-color: rgba(255, 255, 255, 0.05);
}

/* 移动设备响应式优化 */
@media (max-width: 768px) {
  .modern-menu .el-menu-item {
    height: 42px;
    line-height: 42px;
    margin: 6px 10px;
  }
  
  .modern-menu .el-menu-item .el-icon {
    font-size: 16px;
  }
  
  .version-container {
    padding: 10px 12px;
  }
}
</style>
