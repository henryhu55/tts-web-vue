<script setup lang="ts">
import { useTtsStore } from "@/store/store";
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://vuejs.org/api/sfc-script-setup.html#script-setup
import Header from "./components/header/Header.vue";
import Aside from "./components/aside/Aside.vue";
import Main from "./components/main/Main.vue";
import Footer from "./components/footer/Footer.vue";
import WebStore from "./store/web-store";
import { onMounted, ref } from "vue";

const ttsStore = useTtsStore();
const store = new WebStore();
const isDarkTheme = ref(false);

// 确保默认值被正确设置
if (!store.get("api")) {
  store.set("api", 4);  // 设置默认 API 为 TTS88
  ttsStore.config.api = 4;
}

// 确保 FormConfig 存在
if (!store.get("FormConfig")) {
  const defaultConfig = {
    "默认": {
      languageSelect: "zh-CN",
      voiceSelect: "zh-CN-XiaoxiaoNeural",
      voiceStyleSelect: "Default",
      role: "",
      speed: 1,
      pitch: 1,
      api: 4
    }
  };
  store.set("FormConfig", defaultConfig);
  ttsStore.config.formConfigJson = defaultConfig;
}

// 切换主题
const toggleTheme = () => {
  isDarkTheme.value = !isDarkTheme.value;
  document.body.classList.toggle('dark-theme', isDarkTheme.value);
};

// 确保在访问前配置已正确初始化
onMounted(() => {
  ttsStore.genFormConfig();
  ttsStore.setSSMLValue();
  ttsStore.showDisclaimers();
});
</script>

<template>
  <div class="app" :class="{ 'dark-theme': isDarkTheme }">
    <el-container class="modern-container">
      <el-header class="modern-header"><Header @toggle-theme="toggleTheme" /></el-header>
      <el-container class="modern-body-container">
        <el-aside class="modern-aside"><Aside /></el-aside>
        <el-container class="modern-main-footer">
          <el-main class="modern-main"><Main /></el-main>
          <el-footer class="modern-footer"><Footer /></el-footer>
        </el-container>
      </el-container>
    </el-container>
  </div>
</template>

<style>
body {
  margin: 0;
  font-family: 'Inter', 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  background-color: var(--background-color);
  color: var(--text-primary);
  transition: background-color 0.3s, color 0.3s;
}

.app {
  background-color: var(--background-color);
  border-radius: var(--border-radius-large);
  border: 1px solid var(--border-color);
  overflow: hidden;
  box-shadow: var(--shadow-medium);
}

.modern-container {
  height: 100vh;
}

.modern-header {
  border: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  height: auto !important;
  -webkit-app-region: drag;
  background-color: var(--card-background);
  box-shadow: var(--shadow-light);
  z-index: 10;
}

.modern-body-container {
  height: calc(100vh - 60px);
  overflow: hidden;
}

.modern-aside {
  width: 220px !important;
  overflow: hidden !important;
  background-color: var(--card-background);
  border-right: 1px solid var(--border-color);
  transition: all var(--transition-normal);
}

.modern-main-footer {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--background-color);
}

.modern-main {
  flex: 1;
  padding: 20px !important;
  margin: 0 !important;
  overflow: auto;
}

.modern-footer {
  background-color: var(--card-background);
  border-top: 1px solid var(--border-color) !important;
  margin: 0 !important;
  padding: 0 !important;
}

.el-button {
  -webkit-app-region: no-drag;
}
</style>
