<template>
  <div 
    class="modern-aside"
    :class="{ 'is-mobile-hidden': isMobileHidden }"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <div class="menu-container">
      <el-menu
        :default-active="page.asideIndex"
        class="modern-menu"
        @select="menuChange"
        collapse
      >
        <el-menu-item index="1">
          <el-tooltip :content="t('aside.text')" placement="right" :disabled="isMobile">
            <el-icon><Document /></el-icon>
          </el-tooltip>
        </el-menu-item>
        <el-menu-item index="2">
          <el-tooltip :content="t('aside.batch')" placement="right" :disabled="isMobile">
            <el-icon><Files /></el-icon>
          </el-tooltip>
        </el-menu-item>
        <el-menu-item index="4">
          <el-tooltip :content="t('aside.documents')" placement="right" :disabled="isMobile">
            <el-icon><Notebook /></el-icon>
          </el-tooltip>
        </el-menu-item>
        <el-menu-item index="6">
          <el-tooltip content="转换历史" placement="right" :disabled="isMobile">
            <el-icon><Clock /></el-icon>
          </el-tooltip>
        </el-menu-item>
        <el-menu-item index="5">
          <el-tooltip content="在线生成字幕" placement="right" :disabled="isMobile">
            <el-icon><VideoPlay /></el-icon>
          </el-tooltip>
        </el-menu-item>
        <el-menu-item index="3">
          <el-tooltip :content="t('aside.settings')" placement="right" :disabled="isMobile">
            <el-icon><Setting /></el-icon>
          </el-tooltip>
        </el-menu-item>
      </el-menu>
    </div>
    <div class="version-container">
      <el-tooltip content="查看引导" placement="right" :disabled="isMobile">
        <div class="icon-only-guide" @click="showUserGuide">
          <el-icon><Help /></el-icon>
        </div>
      </el-tooltip>
      <Version />
    </div>
  </div>
  <!-- 遮罩层 -->
  <div 
    v-if="!isMobileHidden && isMobile" 
    class="mobile-mask"
    @click="hideSidebar"
  ></div>
  <!-- 移动端侧边栏控制把手 -->
  <div 
    v-if="isMobileHidden && isMobile" 
    class="mobile-handle"
    @click="showSidebar"
  >
    <el-icon><ArrowRight /></el-icon>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { useTtsStore } from "@/store/store";
import { storeToRefs } from "pinia";
import { useI18n } from 'vue-i18n';
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import Version from "./Version.vue";
import { Document, Files, Setting, Notebook, Help, VideoPlay, ArrowRight, Clock } from '@element-plus/icons-vue';
import router from '@/router/router';

const { t } = useI18n();
const ttsStore = useTtsStore();
const { page, config } = storeToRefs(ttsStore);

// 移动端状态控制
const isMobile = ref(false);
const isMobileHidden = ref(false);
const touchStartX = ref(0);
const touchStartY = ref(0);

// 检查是否为移动设备
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768;
  // 在移动端下默认隐藏侧边栏
  if (isMobile.value && !isMobileHidden.value) {
    isMobileHidden.value = true;
  }
};

// 显示侧边栏
const showSidebar = () => {
  isMobileHidden.value = false;
};

// 隐藏侧边栏
const hideSidebar = () => {
  if (isMobile.value) {
    isMobileHidden.value = true;
  }
};

// 处理触摸开始
const handleTouchStart = (e: TouchEvent) => {
  touchStartX.value = e.touches[0].clientX;
  touchStartY.value = e.touches[0].clientY;
};

// 处理触摸移动
const handleTouchMove = (e: TouchEvent) => {
  if (!isMobile.value) return;
  
  const touchX = e.touches[0].clientX;
  const touchY = e.touches[0].clientY;
  const deltaX = touchX - touchStartX.value;
  const deltaY = Math.abs(touchY - touchStartY.value);
  
  // 如果水平滑动距离大于垂直滑动距离的2倍，则处理滑动
  if (Math.abs(deltaX) > deltaY * 2) {
    e.preventDefault();
    if (deltaX < -30) { // 降低向左滑动的阈值
      hideSidebar();
    }
  }
};

// 处理触摸结束
const handleTouchEnd = () => {
  touchStartX.value = 0;
  touchStartY.value = 0;
};

// 监听窗口大小变化
onMounted(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile);
});

const menuChange = (index: number) => {
  // 更新状态
  page.value.asideIndex = index.toString();
  
  // 根据菜单项导航到对应页面
  if (index.toString() === '6') {
    // 历史记录页面
    router.push('/history');
  } else {
    // 其他页面保持在首页
    router.push('/');
  }
  
  // 确保页面状态已更新
  nextTick(() => {
    console.log('Aside: 页面刷新后的菜单状态:', page.value.asideIndex);
  });
  
  // 如果是移动端，延迟隐藏侧边栏
  if (isMobile.value) {
    setTimeout(() => {
      hideSidebar();
    }, 100);
  }
};

// 添加显示引导的方法
const showUserGuide = () => {
  if (typeof window.__startGuide === 'function') {
    window.__startGuide();
  } else {
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
  padding-top: 60px; /* 为顶部导航条留出空间 */
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
  .modern-aside {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 1001;
    background-color: var(--card-background);
    border-right: 1px solid var(--border-color);
    box-shadow: var(--shadow-medium);
    transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .is-mobile-hidden {
    left: -100%;
  }

  .modern-menu {
    width: 100%;
  }

  .modern-menu .el-menu-item {
    height: 40px;
    line-height: 40px;
    margin: 4px 2px;
    border-radius: 8px;
    min-height: 40px;
  }

  .modern-menu .el-menu-item .el-icon {
    font-size: 18px;
    min-width: 20px;
  }

  .modern-menu .el-menu-item:active {
    transform: scale(0.95);
  }

  .modern-menu .el-menu-item:not(.is-active):hover {
    transform: none;
  }

  .icon-only-guide {
    width: 28px;
    height: 28px;
    padding: 6px;
    margin-bottom: 8px;
  }

  .icon-only-guide .el-icon {
    font-size: 16px;
  }

  .version-container {
    padding: 8px 4px;
    font-size: 10px;
    margin-top: 4px;
  }
}

/* 超小屏幕设备优化 */
@media (max-width: 375px) {
  .modern-aside {
    width: 48px;
  }

  .modern-menu {
    width: 48px;
  }

  .modern-menu .el-menu-item {
    height: 36px;
    line-height: 36px;
    margin: 3px 1px;
  }

  .modern-menu .el-menu-item .el-icon {
    font-size: 16px;
  }

  .icon-only-guide {
    width: 24px;
    height: 24px;
    padding: 4px;
  }

  .icon-only-guide .el-icon {
    font-size: 14px;
  }
}

/* 处理横屏模式 */
@media (max-width: 926px) and (orientation: landscape) {
  .modern-aside {
    padding-top: 8px;
  }

  .modern-menu .el-menu-item {
    height: 36px;
    line-height: 36px;
    margin: 2px;
  }

  .version-container {
    padding: 4px;
  }
}

/* 移动端特定样式 */
.is-mobile-hidden {
  left: -100%;
}

.mobile-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
  z-index: 1000;
  backdrop-filter: blur(2px);
  transition: opacity 0.3s ease;
}

.mobile-handle {
  position: fixed;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
  width: 24px;
  height: 48px;
  background: var(--primary-color);
  border-radius: 0 24px 24px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  z-index: 1000;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.mobile-handle:active {
  transform: translateY(-50%) scale(0.95);
}

.modern-aside {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
