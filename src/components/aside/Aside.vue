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
        <el-menu-item index="3">
          <el-icon><Setting /></el-icon>
          <span>{{ t('aside.settings') }}</span>
        </el-menu-item>
        <el-menu-item index="4">
          <el-icon><Notebook /></el-icon>
          <span>{{ t('aside.documents') }}</span>
        </el-menu-item>
      </el-menu>
    </div>
    <div class="version-container">
      <Version />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTtsStore } from "@/store/store";
import { storeToRefs } from "pinia";
import { useI18n } from 'vue-i18n';
import Version from "./Version.vue";

const { t } = useI18n();
const ttsStore = useTtsStore();
const { page, config } = storeToRefs(ttsStore);

const menuChange = (index: number) => {
  if (index === 4) return;
  page.value.asideIndex = index.toString();
};
</script>

<style scoped>
.modern-aside {
  height: 100%;
  background-color: var(--card-background);
  border-right: 1px solid var(--border-color);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-bottom-left-radius: var(--border-radius-large);
  padding: 10px 0;
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
}

.modern-menu .el-menu-item.is-active {
  background: var(--primary-gradient) !important;
  color: white;
}

.modern-menu .el-menu-item:not(.is-active):hover {
  background-color: rgba(74, 108, 247, 0.1);
}

.modern-menu .el-menu-item .el-icon {
  margin-right: 12px;
  font-size: 18px;
}

.dark-theme .modern-aside {
  background-color: var(--card-background);
  border-right-color: var(--border-color);
}
</style>
