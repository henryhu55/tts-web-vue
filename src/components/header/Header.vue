<template>
  <div class="header">
    <div class="title">
      TTS Vue - Web版本
    </div>
    <div class="controls">
      <el-button
        type="primary"
        size="small"
        @click="toggleTheme"
      >
        <el-icon><Monitor /></el-icon>
      </el-button>
    </div>
    <Logo :winStyle="false" />
  </div>
</template>

<script lang="ts" setup>
import Logo from "./Logo.vue";
import { ref } from "vue";
import { useTtsStore } from "@/store/store";
import { storeToRefs } from "pinia";

const ttsStore = useTtsStore();
const { config } = storeToRefs(ttsStore);

function toggleTheme() {
  // 简单的主题切换功能示例
  document.body.classList.toggle('dark-theme');
}
</script>

<style scoped>
.header {
  height: 30px;
  background: #fff;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 15px;
}
.title {
  font-weight: bold;
  font-size: 16px;
}
.controls {
  display: flex;
}
</style>
