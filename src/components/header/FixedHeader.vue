<template>
  <div class="fixed-header" :class="{ 'scrolled': isScrolled }">
    <div class="fixed-header-content">
      <!-- 左侧区域：移动端菜单按钮和Logo -->
      <div class="header-left">
        <div class="mobile-menu-button" @click="$emit('toggle-sidebar')">
          <el-icon><Menu /></el-icon>
        </div>
        <div class="app-branding">
          <span class="app-title">TTS web vue</span>
        </div>
      </div>

      <!-- 中间区域：模式切换 -->
      <div class="header-center">
        <div class="mode-controls">
          <div class="input-mode-toggle">
            <span class="mode-label">输入模式：</span>
            <el-switch
              v-model="isSSMLMode"
              active-text="SSML"
              inactive-text="纯文本"
              inline-prompt
              class="mode-switch"
            />
            <el-tooltip
              v-if="isSSMLMode"
              content="查看SSML使用指南"
              placement="top"
              effect="light"
            >
              <el-button 
                size="small" 
                type="info" 
                class="ssml-help-button"
                @click="openSSMLHelp"
              >
                <el-icon><QuestionFilled /></el-icon>
                SSML帮助
              </el-button>
            </el-tooltip>
          </div>
        </div>
      </div>

      <!-- 右侧区域：控制按钮 -->
      <div class="header-right">
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { 
  QuestionFilled, 
  InfoFilled, 
  Menu, 
  MoonNight, 
  More, 
  Link 
} from '@element-plus/icons-vue';

const emit = defineEmits(['update:isSSMLMode', 'toggle-theme', 'toggle-sidebar']);

const isSSMLMode = ref(false);
const isScrolled = ref(false);

const handleScroll = () => {
  isScrolled.value = window.scrollY > 20;
};

const openSSMLHelp = () => {
  window.open('https://learn.microsoft.com/zh-cn/azure/cognitive-services/speech-service/speech-synthesis-markup', '_blank');
};

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

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});

watch(isSSMLMode, (newValue) => {
  emit('update:isSSMLMode', newValue);
});
</script>

<style scoped>
.fixed-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: var(--card-background);
  z-index: 98;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 0;
  display: flex;
  align-items: center;
}

.fixed-header.scrolled {
  background: rgba(var(--card-background-rgb), 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

:root[theme-mode="dark"] .fixed-header.scrolled {
  background: rgba(29, 29, 29, 0.95);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.fixed-header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 100%;
  margin: 0;
  gap: 20px;
  padding: 0 20px;
}

/* 左侧区域样式 */
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 220px;
  padding-left: 20px;
  height: 60px;
  background: var(--card-background);
  position: relative;
  z-index: 101;
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

/* 中间区域样式 */
.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.mode-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.input-mode-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--card-background);
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.mode-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.mode-switch {
  margin: 0 8px;
}

/* 右侧区域样式 */
.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 200px;
  justify-content: flex-end;
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

.ssml-help-button {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 6px;
}

/* 移动端菜单按钮样式 */
.mobile-menu-button {
  display: none;
  padding: 8px;
  cursor: pointer;
  color: var(--text-primary);
  transition: all var(--transition-fast);
}

.mobile-menu-button:hover {
  color: var(--primary-color);
}

.mobile-menu-button .el-icon {
  font-size: 24px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .fixed-header {
    left: 0;
    padding: 0;
  }

  .fixed-header-content {
    padding: 0 12px;
  }

  .header-left {
    min-width: auto;
    padding-left: 0;
  }

  .mobile-menu-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 8px;
  }

  .header-center {
    position: absolute;
    top: 60px;
    left: 0;
    right: 0;
    background: var(--card-background);
    padding: 8px;
    border-bottom: 1px solid var(--border-color);
    justify-content: flex-start;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  .mode-controls {
    width: 100%;
    justify-content: space-between;
  }

  .input-mode-toggle {
    flex: 1;
    justify-content: space-between;
  }

  .mode-label {
    display: none;
  }

  .api-badge {
    display: none;
  }

  .control-buttons {
    gap: 4px;
  }

  .control-buttons .el-button {
    width: 36px;
    height: 36px;
    padding: 8px;
  }

  .ssml-help-button span {
    display: none;
  }

  .app-branding {
    margin-left: 8px;
  }

  .app-title {
    font-size: 18px;
  }
}

/* 平板设备响应式样式 */
@media (min-width: 769px) and (max-width: 1024px) {
  .app-title {
    font-size: 20px;
  }
}
</style> 