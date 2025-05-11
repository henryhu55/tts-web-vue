<script setup>
import { useTtsStore } from "@/store/store";
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://vuejs.org/api/sfc-script-setup.html#script-setup
import Aside from "./components/aside/Aside.vue";
import Main from "./components/main/Main.vue";
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
  console.log('切换侧边栏状态:', { 当前状态: isSidebarCollapsed.value });
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

// 处理应用区域点击
const handleAppClick = (event) => {
  // 如果是移动端且侧边栏展开状态
  if (isMobileView.value && !isSidebarCollapsed.value) {
    // 检查点击是否在侧边栏内
    const sidebarEl = document.querySelector('.modern-aside');
    const handleEl = document.querySelector('.mobile-handle');
    
    // 如果点击不在侧边栏内且不在把手按钮上，则收起侧边栏
    if (sidebarEl && !sidebarEl.contains(event.target) && 
        handleEl && !handleEl.contains(event.target)) {
      isSidebarCollapsed.value = true;
    }
  }
};

// 添加点击主容器处理函数
const handleMainContainerClick = () => {
  if (isMobileView && !isSidebarCollapsed) {
    isSidebarCollapsed = true;
  }
};

// 处理内容区域点击
const handleContentClick = (event) => {
  console.log('内容区域被点击:', {
    是否移动端: isMobileView.value,
    侧边栏状态: isSidebarCollapsed.value,
    点击目标: event.target,
    点击坐标: { x: event.clientX, y: event.clientY }
  });

  if (isMobileView.value && !isSidebarCollapsed.value) {
    console.log('准备收起侧边栏');
    isSidebarCollapsed.value = true;
  }
};

// 监听侧边栏状态变化
watch(isSidebarCollapsed, (newValue) => {
  console.log('侧边栏状态变化:', { 新状态: newValue });
});
</script>

<template>
  <div 
    :class="[
      'app-container', 
      { 'dark-theme': isDarkTheme, 'app-mobile': isMobileView }
    ]"
  >
    <!-- 导航栏与主容器 -->
    <div class="main-container">
      <!-- 侧边栏 -->
      <div 
        :class="[
          'sidebar-container',
          { 'sidebar-mobile': !isSidebarCollapsed }
        ]"
        @click.stop
      >
        <Aside ref="asideRef" />
      </div>

      <!-- 移动端侧边栏控制把手 -->
      <div 
        v-if="isMobileView && isSidebarCollapsed" 
        class="mobile-handle"
        @click.stop="toggleSidebar"
      >
        <el-icon><ArrowRight /></el-icon>
      </div>

      <!-- 内容区域 -->
      <div 
        class="content-wrapper"
        :class="{ 'content-mobile': isMobileView }"
        @click="handleContentClick"
      >
        <Main ref="mainRef" />
      </div>
    </div>

    <!-- 新手引导系统 -->
    <div v-if="showUserGuide" class="guide-overlay" @click="completeGuide">
      <!-- 高亮区域 -->
      <div class="guide-highlight" :style="highlightStyle"></div>

      <!-- 引导卡片 -->
      <div class="guide-card" :style="guideCardStyle" @click.stop>
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
              @click="handlePrevStep"
              :disabled="currentGuideStep === 0"
            >上一步</el-button>
            
            <el-button 
              size="small" 
              type="info" 
              text
              @click="completeGuide"
            >跳过</el-button>
          </div>
          
          <div class="guide-indicators">
            <span 
              v-for="(_, index) in guideSteps" 
              :key="index" 
              class="guide-indicator" 
              :class="{ active: currentGuideStep === index }"
              @click="setGuideStep(index)"
            ></span>
          </div>
          
          <el-button 
            size="small" 
            type="primary" 
            @click="handleNextStep"
          >
            {{ currentGuideStep < guideSteps.length - 1 ? '下一步' : '完成' }}
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* 全局变量 */
:root {
  /* 颜色 */
  --primary-color: #4169e1;
  --secondary-color: #3150b0;
  --primary-light: #ecf5ff;
  --primary-dark: #337ecc;
  --success-color: #67c23a;
  --warning-color: #e6a23c;
  --danger-color: #f56c6c;
  --info-color: #909399;
  
  /* 文本颜色 */
  --text-primary: #303133;
  --text-regular: #606266;
  --text-secondary: #909399;
  --text-placeholder: #c0c4cc;
  
  /* 边框颜色 */
  --border-color: #dcdfe6;
  --border-light: #e4e7ed;
  --border-lighter: #ebeef5;
  --border-extra-light: #f2f6fc;
  
  /* 背景颜色 */
  --background-color: #f5f7fa;
  --card-background: #ffffff;
  
  /* 阴影 */
  --shadow-light: 0 2px 4px rgba(0, 0, 0, 0.05);
  --shadow-medium: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  --shadow-dark: 0 4px 16px rgba(0, 0, 0, 0.15);
  
  /* 圆角 */
  --border-radius-small: 4px;
  --border-radius-medium: 6px;
  --border-radius-large: 12px;
  
  /* 过渡 */
  --transition-normal: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
  
  /* 布局 */
  --sidebar-width: 240px;
  --sidebar-collapsed-width: 64px;
  --header-height: 60px;
  --footer-height: 40px;
  
  /* 字体 */
  --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-size-large: 18px;
  --font-size-medium: 16px;
  --font-size-normal: 14px;
  --font-size-small: 12px;
}

/* 暗黑主题变量 */
:root[theme-mode="dark"] {
  --primary-color: #4169e1;
  --secondary-color: #3150b0;
  --primary-light: #18222c;
  --primary-dark: #337ecc;
  
  --text-primary: #e0e0e0;
  --text-regular: #c0c0c0;
  --text-secondary: #909399;
  --text-placeholder: #606266;
  
  --border-color: #434343;
  --border-light: #363636;
  --border-lighter: #303030;
  --border-extra-light: #2a2a2a;
  
  --background-color: #141414;
  --card-background: #1e1e1e;
  
  --shadow-light: 0 2px 4px rgba(0, 0, 0, 0.1);
  --shadow-medium: 0 2px 12px 0 rgba(0, 0, 0, 0.2);
  --shadow-dark: 0 4px 16px rgba(0, 0, 0, 0.3);
}

/* 基本样式重置 */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-family);
  color: var(--text-primary);
  background-color: var(--background-color);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  line-height: 1.5;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #d0d0d0;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #b8b8b8;
}

:root[theme-mode="dark"] ::-webkit-scrollbar-thumb {
  background: #555;
}

:root[theme-mode="dark"] ::-webkit-scrollbar-thumb:hover {
  background: #777;
}

/* 应用容器 */
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--background-color);
  transition: var(--transition-normal);
  overflow-x: hidden;
}

/* 主容器 */
.main-container {
  display: flex;
  flex: 1;
  min-height: 100vh;
  position: relative;
  padding-top: var(--header-height);
}

/* 侧边栏容器 */
.sidebar-container {
  width: 64px;
  height: calc(100vh - var(--header-height));
  position: fixed;
  top: var(--header-height);
  left: 0;
  z-index: 1001;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  background-color: transparent;
}

/* 移动端样式 */
.app-mobile .sidebar-container {
  position: fixed;
  top: var(--header-height);
  left: -64px; /* 初始位置在屏幕外 */
  bottom: 0;
  width: 64px;
  background-color: var(--card-background);
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  z-index: 1001;
  transition: left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.app-mobile .sidebar-container.sidebar-mobile {
  left: 0;
}

/* 内容区域 */
.content-wrapper {
  flex: 1;
  margin-left: 64px;
  min-height: 100vh;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  padding-bottom: var(--footer-height);
  width: calc(100% - 64px);
}

/* 移动端内容区域 */
.app-mobile .content-wrapper {
  margin-left: 0;
  width: 100%;
  min-height: 100vh;
}

/* 主内容区域卡片样式 */
.app-mobile .input-area-card,
.app-mobile .batch-area-card,
.app-mobile .config-page-container,
.app-mobile .doc-page-container {
  margin: 0;
  border-radius: 0;
  box-shadow: none;
  border: none;
}

/* 引导系统 */
.guide-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 9999;
    display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: all;
  }

.guide-highlight {
  position: absolute;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
  border: 2px solid var(--primary-color);
  z-index: 10000;
  pointer-events: none;
  transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
  }

  .guide-card {
  position: absolute;
  width: 400px;
  background-color: var(--card-background);
  border-radius: var(--border-radius-large);
  box-shadow: var(--shadow-dark);
  z-index: 10001;
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
  overflow: hidden;
}

.guide-card-header {
  background-color: var(--primary-color);
  color: rgb(255, 255, 255);
  background-image: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  position: relative;
  padding: 20px;
  overflow: hidden;
}

.guide-card-header::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 100%);
  transform: skewY(-12deg);
  transform-origin: top right;
}

.guide-card-header h2 {
  margin: 0;
  font-size: var(--font-size-large);
  font-weight: 600;
  position: relative;
}

.guide-card-header p {
  margin: 8px 0 0;
  opacity: 0.9;
  font-size: var(--font-size-normal);
  position: relative;
}

.guide-card-content {
  padding: 24px;
  background-color: var(--card-background);
}

.guide-step {
  position: relative;
  padding: 0;
  margin: 0;
}

.guide-step-number {
  position: absolute;
  top: 0;
  right: 0;
  background-color: var(--primary-color);
  color: white;
  padding: 2px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: normal;
}

.guide-step h3 {
  margin: 0 0 12px;
  color: var(--text-primary);
  font-size: var(--font-size-medium);
  display: flex;
  align-items: center;
  gap: 0;
  padding: 0;
  padding-right: 50px; /* 调整一下右侧间距 */
}

.guide-step p {
  margin: 0 0 16px;
  color: var(--text-regular);
  font-size: var(--font-size-normal);
  line-height: 1.6;
  padding: 0;
}

.guide-hint {
  padding: 12px 16px;
  background-color: var(--primary-light);
  border-radius: var(--border-radius-small);
  color: var(--primary-dark);
  font-size: var(--font-size-small);
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 16px 0;
}

.guide-hint i {
  font-size: 16px;
  color: var(--primary-color);
}

.guide-card-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--border-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--card-background);
}

.guide-actions-left {
  display: flex;
  gap: 12px;
}

.guide-indicators {
  display: flex;
  gap: 6px;
  align-items: center;
}

.guide-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--border-color);
  cursor: pointer;
  transition: all 0.3s ease;
}

.guide-indicator.active {
  width: 18px;
  border-radius: 3px;
  background-color: var(--primary-color);
}

/* 暗黑主题适配 */
:root[theme-mode="dark"] .guide-card {
  background-color: var(--card-background);
}

:root[theme-mode="dark"] .guide-hint {
  background-color: rgba(64, 158, 255, 0.1);
  color: var(--primary-color);
}

/* 响应式样式 */
@media (max-width: 768px) {
  .guide-card {
    width: 90%;
    max-width: 360px;
  }
  
  .guide-card-header {
    padding: 16px;
  }
  
  .guide-card-content {
    padding: 16px;
  }
  
  .guide-card-footer {
    padding: 12px 16px;
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .guide-indicators {
    order: -1;
    width: 100%;
    justify-content: center;
    margin-bottom: 8px;
  }
}

/* 移动端把手按钮样式 */
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
</style>
