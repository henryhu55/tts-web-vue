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

      <!-- 中间区域：功能导航 -->
      <div class="header-center">
        <div class="nav-menu">
          <div class="nav-item" :class="{ 'active': activeNav === 'tts' }" @click="changeNav('tts')">
            文字转语音
          </div>
          <div class="nav-item" :class="{ 'active': activeNav === 'docs' }" @click="changeNav('docs')">
            文档
          </div>
          <div class="nav-item" :class="{ 'active': activeNav === 'subtitle' }" @click="changeNav('subtitle')">
            在线生成字幕
            <el-tag size="small" type="info" class="coming-soon-tag">即将上线</el-tag>
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
              @click="handleThemeClick"
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

<script>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { 
  QuestionFilled, 
  InfoFilled, 
  Menu, 
  MoonNight, 
  More, 
  Link 
} from '@element-plus/icons-vue';

export default {
  name: 'FixedHeader',
  components: {
    QuestionFilled, 
    InfoFilled, 
    Menu, 
    MoonNight, 
    More, 
    Link
  },
  emits: ['toggle-theme', 'toggle-sidebar', 'update:isSSMLMode', 'nav-change'],
  setup(props, { emit }) {
    // 添加调试日志
    console.log('FixedHeader setup 被调用');

    // 响应式状态
    const isScrolled = ref(false);
    const isSSMLMode = ref(false);
    const activeNav = ref('tts');

    // 方法
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

    const changeNav = (nav) => {
      activeNav.value = nav;
      emit('nav-change', nav);
    };

    // 添加一个直接触发主题切换的方法
    const handleThemeClick = () => {
      console.log('FixedHeader: 主题按钮被点击');
      // 使用 emit 触发事件
      emit('toggle-theme');
      // 同时用全局事件作为备份方案
      window.dispatchEvent(new CustomEvent('toggle-theme-event'));
    };

    // 生命周期钩子
    onMounted(() => {
      console.log('FixedHeader 组件已挂载');
      window.addEventListener('scroll', handleScroll);
    });

    onBeforeUnmount(() => {
      window.removeEventListener('scroll', handleScroll);
    });

    // 监听器
    watch(isSSMLMode, (newValue) => {
      emit('update:isSSMLMode', newValue);
    });

    return {
      isScrolled,
      isSSMLMode,
      activeNav,
      openSSMLHelp,
      openApiSite,
      showUserGuide,
      handleThemeClick,
      changeNav
    };
  }
}
</script>

<style scoped>
.fixed-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: var(--card-background);
  z-index: 999;
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

/* 中间区域样式 - 导航菜单 */
.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.nav-menu {
  display: flex;
  gap: 24px;
}

.nav-item {
  position: relative;
  padding: 8px 16px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.nav-item:hover {
  color: var(--primary-color);
}

.nav-item.active {
  color: var(--primary-color);
}

.nav-item.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 3px;
  background-color: var(--primary-color);
  border-radius: 2px;
}

.coming-soon-tag {
  font-size: 10px;
  padding: 2px 6px;
  height: auto;
  line-height: 1.2;
}

/* 右侧区域样式 */
.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.api-badge {
  display: flex;
  align-items: center;
  background: linear-gradient(90deg, rgba(74, 108, 247, 0.1), rgba(74, 108, 247, 0.05));
  border-radius: 20px;
  padding: 6px 12px;
  font-weight: 600;
  font-size: 14px;
  color: var(--primary-color);
  cursor: pointer;
  transition: all 0.3s ease;
}

.api-badge:hover {
  background: linear-gradient(90deg, rgba(74, 108, 247, 0.15), rgba(74, 108, 247, 0.1));
  transform: translateY(-1px);
}

.api-tag {
  background-color: var(--primary-color);
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 6px;
}

.control-buttons {
  display: flex;
  gap: 8px;
}

/* 响应式样式 */
@media (max-width: 768px) {
  .fixed-header {
    height: auto;
    padding: 10px 0;
  }
  
  .fixed-header-content {
    flex-direction: column;
    padding: 0 10px;
    gap: 10px;
  }
  
  .header-left {
    width: 100%;
    min-width: auto;
    padding-left: 10px;
    justify-content: space-between;
    height: 50px;
  }
  
  .header-center {
    width: 100%;
    overflow-x: auto;
    justify-content: flex-start;
    padding: 0 10px;
  }
  
  .nav-menu {
    gap: 10px;
    padding-bottom: 5px;
  }
  
  .nav-item {
    font-size: 14px;
    padding: 6px 12px;
    white-space: nowrap;
  }
  
  .header-right {
    width: 100%;
    padding: 0 10px;
    justify-content: flex-end;
  }
}
</style> 