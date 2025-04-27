<template>
  <div class="modern-header">
    <div class="logo">
      <Logo :winStyle="false" />
      <span class="logo-text">TTS Vue</span>
    </div>
    <div class="controls">
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
            <el-dropdown-item>
              <el-icon><InfoFilled /></el-icon> 关于应用
            </el-dropdown-item>
            <el-dropdown-item>
              <el-icon><QuestionFilled /></el-icon> 帮助文档
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script lang="ts" setup>
import Logo from "./Logo.vue";
import { ref } from "vue";
import { useTtsStore } from "@/store/store";
import { storeToRefs } from "pinia";

const ttsStore = useTtsStore();
const { config } = storeToRefs(ttsStore);

defineEmits(['toggle-theme']);
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

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-text {
  font-weight: 600;
  font-size: 18px;
  color: var(--text-primary);
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.controls {
  display: flex;
  gap: 8px;
}

.dark-theme .modern-header {
  background: var(--card-background);
}
</style>
