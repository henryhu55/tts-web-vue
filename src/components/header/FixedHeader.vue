<template>
  <div class="fixed-header" :class="{ 'scrolled': isScrolled }">
    <div class="fixed-header-content">
      <!-- PC端布局 -->
      <template v-if="!isMobile">
        <!-- 左侧区域：Logo -->
        <div class="header-left">
          <div class="app-branding">
            <span class="app-title">TTS Web Vue</span>
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
          <!-- Promo Link -->
          <a href="https://xiaoying.work" target="_blank" class="promo-link-badge">
            🚀 XiaoYing.work
          </a>

          <div class="api-badge" @click="openApiSite">
            <span>TTS88</span>
            <span class="api-tag">API</span>
          </div>
          
          <div class="control-buttons">
            <el-tooltip content="切换主题" placement="bottom" effect="light">
              <el-button circle @click="handleThemeClick">
                <el-icon><MoonNight /></el-icon>
              </el-button>
            </el-tooltip>
            
            <el-dropdown trigger="click">
              <el-button circle>
                <el-icon><More /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item @click="openPromoSite">
                    <el-icon><Promotion /></el-icon> 官方托管版 / Hosted
                  </el-dropdown-item>
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
      </template>

      <!-- 移动端布局 -->
      <template v-else>
        <div class="header-center-right-container">
          <!-- 中间区域：功能导航 -->
          <div class="header-center">
            <div class="nav-menu">
              <div class="nav-item" :class="{ 'active': activeNav === 'tts' }" @click="changeNav('tts')">
                文字转语音
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
                <el-button circle @click="handleThemeClick">
                  <el-icon><MoonNight /></el-icon>
                </el-button>
              </el-tooltip>
              
              <el-dropdown trigger="click">
                <el-button circle>
                  <el-icon><More /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="openPromoSite">
                      <el-icon><Rocket /></el-icon> 官方托管版
                    </el-dropdown-item>
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
  Link,
  Promotion
} from '@element-plus/icons-vue';
import { useTtsStore } from "@/store/store";
import { storeToRefs } from "pinia";

export default {
  name: 'FixedHeader',
  components: {
    QuestionFilled, 
    InfoFilled, 
    Menu, 
    MoonNight, 
    More, 
    Link,
    Promotion
  },
  emits: ['toggle-theme', 'toggle-sidebar', 'update:isSSMLMode', 'nav-change'],
  props: {
    // 用于接收当前侧边栏激活的索引
    asideIndex: {
      type: String,
      default: '1'
    }
  },
  setup(props, { emit }) {
    // 添加调试日志
    console.log('FixedHeader setup 被调用');

    // 响应式状态
    const isScrolled = ref(false);
    const isSSMLMode = ref(false);
    const activeNav = ref('tts');
    const isMobile = ref(window.innerWidth <= 768);

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
    
    const openPromoSite = () => {
      window.open("https://xiaoying.work", "_blank");
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
      // 添加反向映射
      let newAsideIndex;
      switch(nav) {
        case 'tts':
          newAsideIndex = '1';
          break;
        case 'docs':
          newAsideIndex = '4';
          break;
        case 'subtitle':
          newAsideIndex = '5';
          break;
      }
      // 更新全局状态
      if (newAsideIndex) {
        page.value.asideIndex = newAsideIndex;
      }
      emit('nav-change', nav);
    };

    // 根据侧边栏索引更新顶部导航状态
    const updateActiveNav = (asideIndex) => {
      if (asideIndex === '1') {
        activeNav.value = 'tts';
      } else if (asideIndex === '4') {
        activeNav.value = 'docs';
      } else if (asideIndex === '5') {
        activeNav.value = 'subtitle';
      }
    };

    // 监听props.asideIndex变化
    watch(() => props.asideIndex, (newIndex) => {
      updateActiveNav(newIndex);
    });

    // 添加一个直接触发主题切换的方法
    const handleThemeClick = () => {
      // 使用 emit 触发事件
      emit('toggle-theme');
      // 同时用全局事件作为备份方案
      window.dispatchEvent(new CustomEvent('toggle-theme-event'));
    };

    // 检查移动端状态
    const checkMobile = () => {
      isMobile.value = window.innerWidth <= 768;
    };

    // 生命周期钩子
    onMounted(() => {
      window.addEventListener('scroll', handleScroll);
      checkMobile();
      window.addEventListener('resize', checkMobile);
      // 初始化时根据传入的asideIndex更新导航状态
      updateActiveNav(props.asideIndex);
    });

    onBeforeUnmount(() => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', checkMobile);
    });

    // 监听器
    watch(isSSMLMode, (newValue) => {
      emit('update:isSSMLMode', newValue);
    });

    const ttsStore = useTtsStore();
    const { page } = storeToRefs(ttsStore);

    return {
      isScrolled,
      isSSMLMode,
      activeNav,
      openSSMLHelp,
      openApiSite,
      openPromoSite,
      showUserGuide,
      handleThemeClick,
      changeNav,
      updateActiveNav,
      isMobile,
      page
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
  padding-left: 0;
  height: 60px;
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
  background-clip: padding-box; /* 标准属性 */
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-transform: capitalize;
  margin-left: 0;
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

.promo-link-badge {
  display: flex;
  align-items: center;
  background: linear-gradient(90deg, rgba(103, 194, 58, 0.1), rgba(103, 194, 58, 0.05));
  border-radius: 20px;
  padding: 6px 12px;
  font-weight: 600;
  font-size: 14px;
  color: #67c23a;
  text-decoration: none;
  transition: all 0.3s ease;
}

.promo-link-badge:hover {
  background: linear-gradient(90deg, rgba(103, 194, 58, 0.2), rgba(103, 194, 58, 0.1));
  transform: translateY(-1px);
}

.control-buttons {
  display: flex;
  gap: 8px;
}

/* 响应式样式 */
@media (max-width: 768px) {
  .fixed-header {
    height: 50px;
    padding: 0 15px;
  }
  
  .fixed-header-content {
    flex-direction: row;
    padding: 0;
    height: 100%;
  }

  .header-center-right-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 100%;
  }
  
  .header-center {
    width: auto;
  }

  .nav-menu {
    gap: 15px;
  }

  .nav-item {
    font-size: 15px;
    padding: 6px 12px;
  }
  
  .header-right {
    width: auto;
    padding: 0;
    gap: 12px;
    display: flex;
    align-items: center;
  }

  .api-badge {
    padding: 4px 10px;
    font-size: 13px;
  }

  .api-badge .api-tag {
    font-size: 9px;
    padding: 1px 4px;
  }

  .promo-link-badge {
    padding: 4px 10px;
    font-size: 13px;
    display: none; /* Hide on mobile to save space, relies on dropdown */
  }

  .control-buttons {
    gap: 6px;
    display: flex;
    align-items: center;
  }

  .control-buttons .el-button {
    padding: 8px;
  }

  .control-buttons .el-icon {
    font-size: 16px;
  }
}
</style> 