<script setup>
import { useTtsStore } from "@/store/store";
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://vuejs.org/api/sfc-script-setup.html#script-setup
import Aside from "./components/aside/Aside.vue";
import Main from "./components/main/Main.vue";
import Footer from "./components/footer/Footer.vue";
import WebStore from "./store/web-store";
import { onMounted, ref, watch, nextTick, onBeforeUnmount, computed } from "vue";
import { useI18n } from 'vue-i18n';
import i18n from './assets/i18n/i18n';
import FixedHeader from "./components/header/FixedHeader.vue";

// 引导步骤
const ttsStore = useTtsStore();
const store = new WebStore();
const isDarkTheme = ref(false);
const { locale } = useI18n();

// 新手引导状态
const showUserGuide = ref(false);
const currentGuideStep = ref(0);
const guideSteps = ref([
  {
    element: 'div.modern-aside',
    title: '侧边栏导航',
    content: '在这里切换不同的功能页面，例如文本转语音、批量处理等',
    hint: '点击不同的菜单项可以访问不同的功能',
    mobileElement: 'button.mobile-menu-button' // 移动端时指向菜单按钮
  },
  {
    element: 'div.text-area-container',
    title: '输入文本',
    content: '在这里输入您想要转换为语音的文本内容',
    hint: '您可以输入普通文本或使用SSML标记增强控制',
    skipSidebarClose: true // 标记这一步不需要关闭侧边栏
  },
  {
    element: 'div.compact-selects',
    title: '选择语音',
    content: '选择语言、声音和发音风格，自定义您的语音输出',
    hint: '不同的声音和风格会产生不同的语音效果',
    skipSidebarClose: true
  },
  {
    element: 'button.settings-button',
    title: '高级设置',
    content: '调整语速、音调等高级参数，进一步定制语音效果',
    hint: '您可以微调这些参数来获得最理想的语音输出',
    skipSidebarClose: true
  },
  {
    element: 'button.start-button',
    title: '开始转换',
    content: '点击此按钮将文本转换为语音，完成后可以播放或下载',
    hint: '转换过程需要一点时间，请耐心等待',
    skipSidebarClose: true
  }
]);

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

// 完成引导
const completeGuide = () => {
  // 首先淡出卡片
  const currentStyle = guideCardStyle.value;
  guideCardStyle.value = {
    ...currentStyle,
    opacity: '0'
  };
  
  // 延迟隐藏整个引导系统，等待卡片淡出完成
  setTimeout(() => {
    // 隐藏引导
    showUserGuide.value = false;
    
    // 记录引导已完成
    store.set("hasSeenGuide", true);
    
    // 重置高亮和卡片样式
    highlightStyle.value = {
      top: '0px',
      left: '0px',
      width: '0px',
      height: '0px'
    };
    
    guideCardStyle.value = {
      top: '-9999px',
      left: '-9999px',
      transform: 'none',
      opacity: '0'
    };
    
    console.log('引导已完成');
  }, 300);
};

// 检查是否是首次使用
const checkFirstTimeUser = () => {
  const isFirstTime = !store.get("hasSeenGuide");
  console.log('检查用户引导状态:', { isFirstTime });
  
  if (isFirstTime) {
    // 延迟显示引导，确保UI已经完全加载
    setTimeout(() => {
      // 先将引导容器放在一个看不见的位置
      const container = document.createElement('div');
      container.id = 'guide-preload';
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      document.body.appendChild(container);
      
      // 先将卡片放在不可见位置，避免闪烁
      guideCardStyle.value = {
        top: '-9999px',
        left: '-9999px',
        opacity: '0',
        transform: 'none'
      };
      
      // 再延迟一点显示实际引导
      setTimeout(() => {
        document.body.removeChild(container);
        showUserGuide.value = true;
        console.log('准备显示用户引导');
        
        // 使用requestAnimationFrame确保在下一帧渲染
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            // 检查目标元素是否存在
            const firstElementSelector = guideSteps.value[0].element;
            const firstElement = findTargetElement(firstElementSelector);
            console.log('首个引导目标元素检查:', { 
              selector: firstElementSelector, 
              exists: !!firstElement 
            });
            
            if (firstElement) {
              updateGuidePosition();
              
              // 在位置计算完成后再显示卡片
              setTimeout(() => {
                const currentStyle = guideCardStyle.value;
                guideCardStyle.value = {
                  ...currentStyle,
                  opacity: '1'
                };
              }, 50);
            } else {
              console.error('未找到引导目标元素，尝试重新检查');
              // 如果还没有找到元素，再次延迟并重试
              setTimeout(() => {
                updateGuidePosition();
                
                // 在位置计算完成后再显示卡片
                setTimeout(() => {
                  const currentStyle = guideCardStyle.value;
                  guideCardStyle.value = {
                    ...currentStyle,
                    opacity: '1'
                  };
                }, 50);
              }, 500);
            }
          });
        });
      }, 200);
    }, 1500);  // 延长初始延迟时间
  }
};

// 计算当前引导步骤
const currentStep = computed(() => guideSteps.value[currentGuideStep.value] || {});

// 高亮区域样式
const highlightStyle = ref({
  top: '0px',
  left: '0px',
  width: '0px',
  height: '0px'
});

// 引导卡片位置样式
const guideCardStyle = ref({
  top: '-9999px',
  left: '-9999px',
  transform: 'none',
  opacity: '0'
});

// 更新引导位置
const updateGuidePosition = () => {
  if (!showUserGuide.value) return;
  
  const step = currentGuideStep.value;
  const currentStepData = guideSteps.value[step];
  let targetSelector = currentStepData.element;
  
  // 在移动端时使用特定的选择器
  if (isMobileView.value && currentStepData.mobileElement && step !== 0) {
    targetSelector = currentStepData.mobileElement;
  }
  
  // 如果是移动端且不是需要跳过关闭侧边栏的步骤，则确保侧边栏收起
  if (isMobileView.value && !currentStepData.skipSidebarClose) {
    isSidebarCollapsed.value = false;
  } else if (isMobileView.value) {
    isSidebarCollapsed.value = true;
  }
  
  const targetElement = findTargetElement(targetSelector);
  
  console.log('引导定位调试:', { 
    step, 
    targetSelector, 
    targetElementExists: !!targetElement,
    isMobileView: isMobileView.value
  });
  
  if (!targetElement) {
    console.error('引导元素未找到:', { targetSelector });
    return;
  }
  
  // 获取元素位置
  const targetRect = targetElement.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  
  // 更新高亮区域位置和尺寸
  highlightStyle.value = {
    top: `${targetRect.top}px`,
    left: `${targetRect.left}px`,
    width: `${targetRect.width}px`,
    height: `${targetRect.height}px`,
    borderRadius: isMobileView.value ? '12px' : '4px',
    // 为移动端侧边栏添加特殊样式
    ...(isMobileView.value && step === 0 ? {
      borderRadius: '0',
      borderLeft: 'none',
      borderTop: 'none',
      borderBottom: 'none'
    } : {})
  };
  
  // 找到底部工具栏
  const footerElement = document.querySelector('.modern-footer');
  let bottomSafePosition = viewportHeight - 80; // 默认底部安全区域
  
  if (footerElement) {
    const footerRect = footerElement.getBoundingClientRect();
    bottomSafePosition = footerRect.top - 40; // 在底部工具栏上方留出足够空间
  }
  
  // 通用常量
  const cardWidth = 400; // 卡片宽度
  const cardHeight = 300; // 卡片高度
  const padding = 20; // 安全间距
  
  // 判断目标元素是否在底部区域
  const targetIsInBottomArea = targetRect.bottom > (viewportHeight - 200);
  
  // 判断目标是否靠近右边界
  const targetIsNearRightEdge = targetRect.right > (viewportWidth - 200);
  
  // 判断目标是否靠近左边界
  const targetIsNearLeftEdge = targetRect.left < 200;
  
  let cardTop, cardLeft;
  
  // 特殊处理设置按钮和开始转换按钮
  if (step === 3 || step === 4) { // 设置按钮或开始转换按钮
    if (targetIsInBottomArea) {
      // 目标在底部区域，卡片放上方
      cardTop = `${Math.max(padding, targetRect.top - cardHeight - 40)}px`;
      
      if (targetIsNearRightEdge) {
        // 目标靠近右边，卡片靠左放置
        cardLeft = `${Math.max(padding, targetRect.left - 100)}px`;
      } else if (targetIsNearLeftEdge) {
        // 目标靠近左边，卡片靠右放置
        cardLeft = `${Math.min(viewportWidth - cardWidth - padding, targetRect.right - cardWidth + 100)}px`;
      } else {
        // 目标在水平中间，卡片居中放置
        cardLeft = `${Math.max(padding, Math.min(
          viewportWidth - cardWidth - padding,
          targetRect.left + (targetRect.width / 2) - (cardWidth / 2)
        ))}px`;
      }
    } else {
      // 目标不在底部区域
      if (targetIsNearRightEdge) {
        // 目标靠近右边，卡片放左侧
        cardLeft = `${Math.max(padding, targetRect.left - cardWidth - padding)}px`;
        cardTop = `${Math.max(padding, targetRect.top)}px`;
      } else {
        // 否则卡片放右侧
        cardLeft = `${Math.min(viewportWidth - cardWidth - padding, targetRect.right + padding)}px`;
        cardTop = `${Math.max(padding, targetRect.top)}px`;
      }
      
      // 确保卡片不会超出底部安全区域
      const predictedBottom = parseFloat(cardTop) + cardHeight;
      if (predictedBottom > bottomSafePosition) {
        cardTop = `${Math.max(padding, bottomSafePosition - cardHeight - padding)}px`;
      }
    }
  } 
  // 其他一般情况
  else {
    // 尝试放在右侧
    if (targetRect.right + padding + cardWidth <= viewportWidth) {
      cardLeft = `${targetRect.right + padding}px`;
      cardTop = `${Math.max(padding, targetRect.top)}px`;
    } 
    // 尝试放在左侧
    else if (targetRect.left - padding - cardWidth >= 0) {
      cardLeft = `${targetRect.left - padding - cardWidth}px`;
      cardTop = `${Math.max(padding, targetRect.top)}px`;
    }
    // 尝试放在上方
    else if (targetRect.top - padding - cardHeight >= 0) {
      cardLeft = `${Math.max(padding, Math.min(
        viewportWidth - cardWidth - padding,
        targetRect.left + (targetRect.width / 2) - (cardWidth / 2)
      ))}px`;
      cardTop = `${targetRect.top - padding - cardHeight}px`;
    }
    // 尝试放在下方，但要避开底部安全区域
    else if (targetRect.bottom + padding + cardHeight <= bottomSafePosition) {
      cardLeft = `${Math.max(padding, Math.min(
        viewportWidth - cardWidth - padding,
        targetRect.left + (targetRect.width / 2) - (cardWidth / 2)
      ))}px`;
      cardTop = `${targetRect.bottom + padding}px`;
    }
    // 默认居中
    else {
      cardLeft = `${Math.max(padding, Math.min(
        viewportWidth - cardWidth - padding,
        viewportWidth / 2 - cardWidth / 2
      ))}px`;
      cardTop = `${Math.max(padding, Math.min(
        bottomSafePosition - cardHeight - padding,
        viewportHeight / 2 - cardHeight / 2
      ))}px`;
    }
  }
  
  // 确保卡片不会超出视口边界
  const numericLeft = parseFloat(cardLeft);
  const numericTop = parseFloat(cardTop);
  
  if (numericLeft + cardWidth > viewportWidth - padding) {
    cardLeft = `${viewportWidth - cardWidth - padding}px`;
  }
  
  if (numericTop + cardHeight > bottomSafePosition) {
    cardTop = `${bottomSafePosition - cardHeight - padding}px`;
  }
  
  // 设置卡片位置
  guideCardStyle.value = {
    top: cardTop,
    left: cardLeft,
    transform: 'none',
    opacity: guideCardStyle.value.opacity
  };
  
  console.log('引导位置更新:', {
    step,
    targetRect: {
      top: targetRect.top,
      left: targetRect.left,
      bottom: targetRect.bottom,
      right: targetRect.right,
      width: targetRect.width,
      height: targetRect.height
    },
    highlightStyle: highlightStyle.value,
    cardStyle: guideCardStyle.value,
    viewportHeight,
    bottomSafePosition,
    targetIsInBottomArea,
    targetIsNearRightEdge,
    targetIsNearLeftEdge
  });
};

// 切换主题
const toggleTheme = () => {
  console.log('App.vue: toggleTheme 方法被调用');
  isDarkTheme.value = !isDarkTheme.value;
  document.documentElement.setAttribute('theme-mode', isDarkTheme.value ? 'dark' : 'light');
  store.set('darkTheme', isDarkTheme.value);
};

// 监听引导步骤变化
watch(() => currentGuideStep.value, (newStep) => {
  console.log('引导步骤变化:', newStep);
  
  nextTick(() => {
    // 确保DOM更新后再进行定位
    setTimeout(() => {
      updateGuidePosition();
    }, 300); // 给予足够的时间让过渡动画完成
  });
});

// 手动启动引导
const startGuide = () => {
  console.log('手动启动引导');
  
  // 重置引导状态
  currentGuideStep.value = 0;
  
  // 先将卡片放在不可见位置，避免闪烁
  guideCardStyle.value = {
    top: '-9999px',
    left: '-9999px',
    opacity: '0',
    transform: 'none'
  };
  
  // 显示引导系统
  showUserGuide.value = true;
  
  // 使用nextTick确保UI渲染后再定位
  nextTick(() => {
    // 延长等待时间，确保DOM已完全准备好
    setTimeout(() => {
      // 尝试预先检查所有引导元素是否存在
      const missingElements = [];
      
      for (let i = 0; i < guideSteps.value.length; i++) {
        const selector = guideSteps.value[i].element;
        const element = findTargetElement(selector);
        
        if (!element) {
          console.warn(`引导步骤 ${i+1} 的目标元素未找到: ${selector}`);
          missingElements.push({
            step: i+1,
            selector
          });
        }
      }
      
      if (missingElements.length > 0) {
        console.warn('部分引导元素未找到，可能会影响引导体验:', missingElements);
      }
      
      // 更新位置
      updateGuidePosition();
      
      // 在位置计算完成后再显示卡片
      setTimeout(() => {
        const currentStyle = guideCardStyle.value;
        guideCardStyle.value = {
          ...currentStyle,
          opacity: '1'
        };
      }, 50);
    }, 300);
  });
};

// 添加一个通用的事件阻止方法
const stopEvent = (event) => {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
};

// 确保在访问前配置已正确初始化
onMounted(() => {
  ttsStore.genFormConfig();
  ttsStore.setSSMLValue();
  ttsStore.showDisclaimers();
  
  // 加载主题设置
  const savedTheme = store.get("darkTheme");
  if (savedTheme !== undefined) {
    isDarkTheme.value = savedTheme;
    document.documentElement.setAttribute('theme-mode', savedTheme ? 'dark' : 'light');
  }
  
  // 确保语言设置正确
  if (ttsStore.config.language) {
    locale.value = ttsStore.config.language;
    i18n.global.locale.value = ttsStore.config.language;
  }
  
  // 检查是否是首次使用
  checkFirstTimeUser();
  
  // 添加窗口大小变化监听
  window.addEventListener('resize', updateGuidePosition);
  
  // 暴露引导函数到全局，便于调试和从其他组件调用
  window.__startGuide = startGuide;
  window.__toggleGuide = () => {
    if (showUserGuide.value) {
      // 如果当前显示引导，执行渐隐过渡
      const currentStyle = guideCardStyle.value;
      guideCardStyle.value = {
        ...currentStyle,
        opacity: '0'
      };
      
      // 延迟隐藏整个系统
      setTimeout(() => {
        showUserGuide.value = false;
      }, 300);
    } else {
      // 先重置引导卡片位置和状态
      guideCardStyle.value = {
        top: '-9999px',
        left: '-9999px',
        opacity: '0',
        transform: 'none'
      };
      
      // 显示引导系统
      showUserGuide.value = true;
      currentGuideStep.value = 0;
      
      // 等待UI更新，再计算位置
      nextTick(() => {
        // 延迟一下再计算位置和显示
        setTimeout(() => {
          updateGuidePosition();
          
          // 在位置计算完成后再淡入卡片
          setTimeout(() => {
            const currentStyle = guideCardStyle.value;
            guideCardStyle.value = {
              ...currentStyle,
              opacity: '1'
            };
          }, 50);
        }, 100);
      });
    }
  };
  
  checkMobileView();
  window.addEventListener('resize', checkMobileView);
  
  // 添加触摸事件监听
  document.addEventListener('touchstart', handleTouchStart);
  document.addEventListener('touchend', handleTouchEnd);
  
  // 添加全局主题切换事件监听作为备份方案
  window.addEventListener('toggle-theme-event', () => {
    console.log('App.vue: 收到全局 toggle-theme-event 事件');
    toggleTheme();
  });
  
  console.log('App.vue 已挂载，isDarkTheme =', isDarkTheme.value);
});

// 组件卸载时清理
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateGuidePosition);
  
  window.removeEventListener('resize', checkMobileView);
  
  // 移除触摸事件监听
  document.removeEventListener('touchstart', handleTouchStart);
  document.removeEventListener('touchend', handleTouchEnd);
  
  // 移除全局主题切换事件监听
  window.removeEventListener('toggle-theme-event', () => {});
});

// 确保语言设置正确
watch(() => ttsStore.config.language, (newLanguage) => {
  if (newLanguage === 'zh' || newLanguage === 'en') {
    locale.value = newLanguage;
    i18n.global.locale.value = newLanguage;
  }
}, { immediate: true });

// 引导查找元素的备选策略
const findTargetElement = (selector) => {
  // 先尝试直接查找
  let element = document.querySelector(selector);
  
  if (!element) {
    console.warn(`未找到元素: ${selector}，尝试备选查找方法`);
    
    // 尝试不同的选择器策略
    if (selector.startsWith('div.')) {
      // 尝试不使用div限定
      element = document.querySelector(selector.substring(4));
    } else if (selector.startsWith('button.')) {
      // 尝试不使用button限定
      element = document.querySelector(selector.substring(7));
    }
    
    // 尝试使用更宽松的选择器
    if (!element && selector.includes('.')) {
      const className = selector.split('.')[1];
      element = document.querySelector(`.${className}`);
      
      // 如果还是没找到，尝试包含此类名的元素
      if (!element) {
        element = document.querySelector(`[class*="${className}"]`);
      }
    }
  }

  // 特殊处理移动端侧边栏的情况
  if (selector === 'div.modern-aside' && isMobileView.value) {
    // 如果是第一步且在移动端，返回整个侧边栏元素
    const sidebarElement = document.querySelector('.modern-aside');
    if (sidebarElement) {
      return {
        getBoundingClientRect: () => {
          const rect = sidebarElement.getBoundingClientRect();
          return {
            ...rect,
            // 确保宽度和高度覆盖整个侧边栏
            width: rect.width,
            height: window.innerHeight,
            top: 0,
            bottom: window.innerHeight
          };
        }
      };
    }
  }
  
  // 对特定步骤进行特殊处理
  if (!element) {
    if (selector === 'div.text-area-container') {
      // 尝试查找文本区域
      element = document.querySelector('.text-area') || 
                document.querySelector('textarea') || 
                document.querySelector('.text-input-area');
    } else if (selector === 'div.compact-selects') {
      // 尝试查找选择器区域
      element = document.querySelector('.voice-selects') || 
                document.querySelector('.voice-options') || 
                document.querySelector('.settings-row');
    } else if (selector === 'button.settings-button') {
      // 尝试查找设置按钮
      element = document.querySelector('[class*="settings"]') || 
                document.querySelector('.el-button');
    } else if (selector === 'button.start-button') {
      // 尝试查找开始按钮
      element = document.querySelector('.start') || 
                document.querySelector('[class*="start"]') || 
                document.querySelector('.el-button');
    }
  }
  
  return element;
};

// 添加方法在script部分
const handleNextStep = (event) => {
  // 阻止事件冒泡
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  
  // 处理下一步逻辑
  if (currentGuideStep.value < guideSteps.value.length - 1) {
    currentGuideStep.value++;
  } else {
    completeGuide();
  }
};

const handlePrevStep = (event) => {
  // 阻止事件冒泡
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  
  // 处理上一步逻辑
  if (currentGuideStep.value > 0) {
    currentGuideStep.value--;
  }
};

const setGuideStep = (index, event) => {
  // 阻止事件冒泡
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  
  // 处理设置引导步骤逻辑
  currentGuideStep.value = index;
};

// 添加移动端视图相关的响应式状态
const isMobileView = ref(false);
const isSidebarCollapsed = ref(false);

// 切换侧边栏
const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
};

// 检测移动端视图
const checkMobileView = () => {
  isMobileView.value = window.innerWidth <= 768;
  if (isMobileView.value) {
    // 在移动端默认收起侧边栏
    isSidebarCollapsed.value = true;
  } else {
    isSidebarCollapsed.value = false;
  }
};

// 添加触摸事件相关变量
const touchStartX = ref(0);
const touchEndX = ref(0);
const MIN_SWIPE_DISTANCE = 70;

// 处理触摸开始
const handleTouchStart = (event) => {
  touchStartX.value = event.touches[0].clientX;
};

// 处理触摸结束
const handleTouchEnd = (event) => {
  touchEndX.value = event.changedTouches[0].clientX;
  const swipeDistance = touchEndX.value - touchStartX.value;
  
  // 从左向右滑动超过阈值，显示侧边栏
  if (swipeDistance > MIN_SWIPE_DISTANCE && isSidebarCollapsed.value) {
    isSidebarCollapsed.value = false;
  }
  // 从右向左滑动超过阈值，隐藏侧边栏
  else if (swipeDistance < -MIN_SWIPE_DISTANCE && !isSidebarCollapsed.value) {
    isSidebarCollapsed.value = true;
  }
};

// 添加导航变化处理逻辑
const handleNavChange = (nav) => {
  console.log('导航变化处理:', nav);
  // 根据顶部导航更新侧边栏选中项
  if (nav === 'tts') {
    ttsStore.page.asideIndex = '1';
  } else if (nav === 'docs') {
    ttsStore.page.asideIndex = '4';
  } else if (nav === 'subtitle') {
    ttsStore.page.asideIndex = '5';
  }
};
</script>

<template>
  <div class="app" :class="{ 'dark-theme': isDarkTheme, 'mobile-view': isMobileView }">
    <FixedHeader 
      @toggle-theme="toggleTheme" 
      @toggle-sidebar="toggleSidebar"
      @nav-change="handleNavChange"
    />
    
    <!-- 添加调试信息 -->
    <div v-if="false" style="display: none;">
      当前主题: {{ isDarkTheme ? 'dark' : 'light' }}
    </div>
    <el-container class="modern-container">
      <el-container class="modern-body-container">
        <el-aside class="modern-aside" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
          <Aside />
        </el-aside>
        <el-container class="modern-main-footer">
          <el-main class="modern-main"><Main /></el-main>
          <el-footer class="modern-footer"><Footer /></el-footer>
        </el-container>
      </el-container>
    </el-container>
    
    <!-- 移动端侧边栏遮罩层 -->
    <div v-if="isMobileView" 
         class="mobile-sidebar-overlay"
         :class="{ 'visible': !isSidebarCollapsed }"
         @click="toggleSidebar">
    </div>

    <!-- 使用全新的引导实现 -->
    <div v-if="showUserGuide" class="guide-system">
      <!-- 半透明背景层 -->
      <div class="guide-overlay"></div>
      
      <!-- 高亮遮罩区域 -->
      <div class="guide-mask">
        <div class="guide-highlight-area" :style="highlightStyle"></div>
      </div>
      
      <!-- 引导卡片 -->
      <div class="guide-card" :style="guideCardStyle">
        <div class="guide-card-header">
          <h2>欢迎使用 TTS Web Vue</h2>
          <p>让我们快速了解一下如何使用这个应用</p>
        </div>
        
        <div class="guide-card-content">
          <div class="guide-step">
            <div class="guide-step-number">{{ currentGuideStep + 1 }}/{{ guideSteps.length }}</div>
            <h3>
              <i class="guide-icon el-icon-info-filled"></i>
              {{ currentStep.title }}
            </h3>
            <p>{{ currentStep.content }}</p>
            <div v-if="currentStep.hint" class="guide-hint">
              <i class="el-icon-info"></i> {{ currentStep.hint }}
            </div>
          </div>
        </div>
        
        <div class="guide-card-footer">
          <div class="guide-actions-left">
            <el-button 
              size="small" 
              @click.stop="handlePrevStep"
              :disabled="currentGuideStep === 0"
            >上一步</el-button>
            
            <el-button 
              size="small" 
              type="info" 
              text
              @click.stop="completeGuide"
            >跳过</el-button>
          </div>
          
          <div class="guide-indicators">
            <span 
              v-for="(_, index) in guideSteps" 
              :key="index" 
              class="guide-indicator" 
              :class="{ active: currentGuideStep === index }"
              @click.stop="setGuideStep(index, $event)"
            ></span>
          </div>
          
          <el-button 
            size="small" 
            type="primary" 
            @click.stop="handleNextStep"
          >
            {{ currentGuideStep < guideSteps.length - 1 ? '下一步' : '完成' }}
          </el-button>
        </div>
      </div>
    </div>
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

/* 定义CSS变量 */
:root {
  --background-color: #f5f8fa;
  --card-background: #ffffff;
  --card-background-rgb: 255, 255, 255;
  --sidebar-background: #eef2f6;
  --sidebar-background-dark: #1d1e22;
  --text-primary: #303133;
  --text-secondary: #606266;
  --border-color: #e4e7ed;
  --border-color-rgb: 228, 231, 237;
  --hover-color: rgba(0, 0, 0, 0.03);
  --primary-color: #4a6cf7;
  --primary-color-rgb: 74, 108, 247;
  --secondary-color: #6484fb;
  --primary-gradient: linear-gradient(135deg, #4a6cf7, #6484fb);
  --border-radius-small: 4px;
  --border-radius-medium: 8px;
  --border-radius-large: 12px;
  --shadow-light: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  --shadow-medium: 0 4px 16px rgba(0, 0, 0, 0.08);
  --shadow-large: 0 8px 24px rgba(0, 0, 0, 0.12);
  --shadow-large-dark: 0 8px 24px rgba(0, 0, 0, 0.25);
  --transition-fast: 0.2s ease;
  --transition-normal: 0.3s ease;
}

.dark-theme {
  --background-color: #121212;
  --card-background: #1d1d1d;
  --card-background-rgb: 29, 29, 29;
  --sidebar-background-dark: #1d1e22;
  --text-primary: #e6e6e6;
  --text-secondary: #aaaaaa;
  --border-color: #333333;
  --border-color-rgb: 51, 51, 51;
  --hover-color: rgba(255, 255, 255, 0.05);
  --shadow-light: 0 2px 12px 0 rgba(0, 0, 0, 0.2);
  --shadow-medium: 0 4px 16px rgba(0, 0, 0, 0.3);
  --shadow-large: 0 8px 24px rgba(0, 0, 0, 0.35);
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
  width: 100vw;
  overflow: hidden;
}

.modern-body-container {
  height: 100vh;
  overflow: hidden;
  width: 100%;
  box-sizing: border-box;
  padding-top: 0; /* 移除顶部内边距 */
}

.modern-aside {
  width: 220px !important;
  overflow: hidden !important;
  background-color: var(--card-background);
  border-right: 1px solid var(--border-color);
  transition: all var(--transition-normal);
  position: fixed;
  top: 60px !important; /* 与header对齐 */
  left: 0;
  bottom: 0;
  z-index: 100;
}

.modern-main-footer {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--background-color);
  width: 100%;
  flex: 1;
  box-sizing: border-box;
  margin-left: 220px; /* 为侧边栏留出空间 */
  padding-top: 60px; /* 为header留出空间 */
}

.modern-main {
  flex: 1;
  padding: 0 !important;
  margin: 0 !important;
  overflow: auto;
  width: 100%;
  box-sizing: border-box;
  background-color: var(--background-color);
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

/* 使用全新的引导实现 */
.guide-system {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: none;
}

.guide-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.2);
  z-index: 9998;
  backdrop-filter: blur(1px);
}

.guide-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
  pointer-events: none;
  /* 确保mask不影响内容可见性 */
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

/* 添加一个清晰的标记，更好地突出显示目标区域 */
.guide-highlight-area::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.08);
  border-radius: 2px;
  pointer-events: none;
}

.guide-highlight-area {
  position: absolute;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.75);
  border: 3px solid var(--primary-color, #4a6cf7);
  border-radius: 4px;
  box-sizing: border-box;
  animation: highlight-pulse 1.5s infinite alternate;
  pointer-events: auto;
  backdrop-filter: none;
  background-color: transparent;
  outline: 2px solid rgba(255, 255, 255, 0.8);
  outline-offset: -5px;
  z-index: 10000;
}

@keyframes highlight-pulse {
  from {
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.75);
    border-color: rgba(74, 108, 247, 0.8);
  }
  to {
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.85);
    border-color: rgba(74, 108, 247, 1);
    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.85), 0 0 0 2px rgba(255, 255, 255, 0.5);
  }
}

.guide-card {
  background-color: var(--card-background, #ffffff);
  border-radius: var(--border-radius-large, 16px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(74, 108, 247, 0.2);
  width: 400px;
  max-width: 90%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: fixed;
  z-index: 10002;
  pointer-events: auto;
  visibility: visible;
  transform: translateZ(0);
  backface-visibility: hidden;
  -webkit-font-smoothing: antialiased;
  will-change: transform, opacity;
  border: 1px solid rgba(255, 255, 255, 0.1);
  /* 添加卡片阴影和边框 */
  outline: 2px solid rgba(74, 108, 247, 0.15);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(74, 108, 247, 0.2), 0 0 0 4px rgba(74, 108, 247, 0.05);
  /* 添加平滑过渡效果 */
  transition: opacity 0.3s ease-out, top 0.3s ease-out, left 0.3s ease-out;
}

/* 优化引导卡片的效果 */
.dark-theme .guide-card {
  border: 1px solid rgba(255, 255, 255, 0.15);
  outline: 2px solid rgba(74, 108, 247, 0.2);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(74, 108, 247, 0.3), 0 0 0 4px rgba(74, 108, 247, 0.1);
}

.guide-card-header {
  padding: 20px;
  background-color: var(--primary-color);
  color: white;
  background-image: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  position: relative;
  overflow: hidden;
}

/* 添加标题装饰 */
.guide-card-header::after {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 100%;
  height: 200%;
  background: rgba(255, 255, 255, 0.1);
  transform: rotate(30deg);
  pointer-events: none;
}

.guide-card-header h2 {
  margin: 0 0 8px 0;
  font-size: 22px;
  font-weight: 600;
}

.guide-card-header p {
  margin: 0;
  font-size: 15px;
  opacity: 0.9;
}

.guide-card-content {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
  background-color: var(--card-background, #ffffff);
}

.guide-step {
  position: relative;
  background-color: var(--card-background, #ffffff);
  border-radius: 8px;
  padding-top: 8px;
}

.guide-step-number {
  position: absolute;
  top: 0;
  right: 0;
  background-color: var(--primary-color);
  color: white;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: var(--border-radius-small);
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.guide-step h3 {
  font-size: 18px;
  margin: 0 0 12px 0;
  color: var(--primary-color);
  font-weight: 600;
}

.guide-step p {
  font-size: 15px;
  line-height: 1.6;
  color: var(--text-secondary);
  margin: 0;
}

.guide-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
  background-color: rgba(0, 0, 0, 0.02);
  position: relative;
  z-index: 10003;
}

.guide-actions-left {
  display: flex;
  gap: 8px;
  align-items: center;
}

.dark-theme .guide-card-footer {
  background-color: rgba(255, 255, 255, 0.02);
}

/* 自定义按钮样式 */
.guide-card-footer .el-button--primary {
  background: var(--primary-gradient) !important; 
  border: none;
  padding: 8px 16px;
  font-weight: 500;
  box-shadow: 0 2px 6px rgba(74, 108, 247, 0.3);
  transition: all 0.3s ease;
}

.guide-card-footer .el-button--primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(74, 108, 247, 0.4);
}

.guide-card-footer .el-button--default {
  border-color: var(--border-color);
  background-color: var(--card-background);
  transition: all 0.3s ease;
}

.guide-indicators {
  display: flex;
  gap: 8px;
}

.guide-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: var(--border-color);
  cursor: pointer;
  transition: all var(--transition-fast, 0.2s ease);
  opacity: 0.5;
}

.guide-indicator:hover {
  opacity: 0.8;
  transform: scale(1.1);
}

.guide-indicator.active {
  background-color: var(--primary-color);
  transform: scale(1.2);
  opacity: 1;
}

.guide-highlight-element {
  position: relative;
  z-index: 10000;
  box-shadow: 0 0 0 4px rgba(74, 108, 247, 0.5) !important;
  border-radius: 4px;
  transition: box-shadow 0.3s ease;
  animation: highlight-pulse 1.5s infinite alternate;
}

@keyframes highlight-pulse {
  from {
    box-shadow: 0 0 0 4px rgba(74, 108, 247, 0.3) !important;
  }
  to {
    box-shadow: 0 0 0 4px rgba(74, 108, 247, 0.8) !important;
  }
}

/* 移动端响应式样式 */
@media (max-width: 768px) {
  .modern-body-container {
    padding-top: 0; /* 移除移动端顶部内边距 */
  }

  .modern-aside {
    transform: translateX(-100%);
    z-index: 1000;
  }

  .modern-aside:not(.sidebar-collapsed) {
    transform: translateX(0);
  }

  .modern-main-footer {
    padding-top: 110px; /* 移动端为双行header留出空间 */
  }

  .modern-main {
    padding: 0 !important;
    width: 100% !important;
    box-sizing: border-box;
  }

  .modern-body-container {
    margin-left: 0 !important;
  }

  .modern-footer {
    padding: 10px !important;
  }

  .el-form-item {
    margin-bottom: 12px !important;
  }

  .el-input, .el-select {
    width: 100% !important;
  }

  .text-area-container {
    margin: 8px 0 !important;
    width: 100% !important;
  }

  .settings-panel {
    padding: 12px !important;
    width: 100% !important;
    box-sizing: border-box;
  }

  .button-group {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    width: 100%;
  }

  .button-group .el-button {
    flex: 1;
    min-width: calc(50% - 4px);
    margin: 0 !important;
  }

  .guide-card {
    position: fixed;
    left: 16px !important;
    right: 16px !important;
    bottom: 20px !important;
    top: auto !important;
    width: auto !important;
    max-width: none !important;
    margin: 0;
    border-radius: 20px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2), 0 2px 8px rgba(0, 0, 0, 0.1);
    transform: translateY(0) !important;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease !important;
  }

  .guide-card[style*="opacity: 0"] {
    transform: translateY(100%) !important;
  }

  .guide-card-header {
    padding: 16px;
    border-radius: 20px 20px 0 0;
  }

  .guide-card-header h2 {
    font-size: 18px;
    margin-bottom: 4px;
  }

  .guide-card-header p {
    font-size: 14px;
  }

  .guide-card-content {
    padding: 16px;
    max-height: 40vh;
    overflow-y: auto;
  }

  .guide-step {
    padding-top: 0;
  }

  .guide-step-number {
    position: relative;
    top: auto;
    right: auto;
    display: inline-block;
    margin-bottom: 12px;
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 12px;
    background: rgba(var(--primary-color-rgb), 0.1);
    color: var(--primary-color);
    font-weight: 600;
  }

  .guide-step h3 {
    font-size: 16px;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .guide-step p {
    font-size: 14px;
    line-height: 1.5;
    margin-bottom: 12px;
  }

  .guide-hint {
    padding: 10px;
    border-radius: 12px;
    font-size: 13px;
    background: rgba(var(--primary-color-rgb), 0.05);
    border-left: none;
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }

  .guide-hint i {
    margin-top: 2px;
  }

  .guide-card-footer {
    padding: 12px 16px;
    border-radius: 0 0 20px 20px;
    background: var(--card-background);
    border-top: 1px solid rgba(var(--border-color-rgb), 0.1);
  }

  .guide-actions-left {
    gap: 12px;
  }

  .guide-indicators {
    position: absolute;
    top: -24px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.2);
    padding: 4px 8px;
    border-radius: 12px;
    backdrop-filter: blur(4px);
  }

  .guide-indicator {
    width: 6px;
    height: 6px;
    background: rgba(255, 255, 255, 0.5);
  }

  .guide-indicator.active {
    background: white;
  }

  .guide-highlight-area {
    border-width: 2px;
    border-radius: 12px;
  }

  /* 优化按钮样式 */
  .guide-card-footer .el-button {
    font-size: 14px;
    padding: 8px 16px;
    border-radius: 12px;
  }

  .guide-card-footer .el-button--primary {
    background: var(--primary-color) !important;
    font-weight: 600;
  }

  /* 深色模式适配 */
  .dark-theme .guide-card {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  .dark-theme .guide-indicators {
    background: rgba(255, 255, 255, 0.1);
  }

  /* 添加安全区域适配 */
  @supports(padding: max(0px)) {
    .guide-card {
      bottom: max(20px, env(safe-area-inset-bottom)) !important;
      padding-bottom: env(safe-area-inset-bottom);
    }
  }
}

/* 平板设备响应式样式 */
@media (min-width: 769px) and (max-width: 1024px) {
  .el-dialog__body {
    padding: 15px !important;
  }

  .el-dialog__footer {
    padding: 10px 15px !important;
  }
}
</style>
