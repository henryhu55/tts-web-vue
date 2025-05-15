// @ts-nocheck
import { useI18n } from 'vue-i18n';
import i18n from '@/assets/i18n/i18n';
// 使用动态导入MainOptions组件，避免加载时机问题
import { defineAsyncComponent } from 'vue';
const MainOptions = defineAsyncComponent(() => import("../components/main/MainOptions.vue"));
import VoiceSelector from "../components/main/VoiceSelector.vue";
import ConfigPage from "../components/configpage/ConfigPage.vue";
import { ElMessage, ElMessageBox } from 'element-plus';
import WebStore from "@/store/web-store";
import router from '@/router/router';

import { ref, watch, onMounted, nextTick, onUnmounted, reactive, computed } from "vue";
import { useTtsStore } from "@/store/store";
import { useFreeTTSstore, FreeTTSErrorType } from "@/store/play";
import { storeToRefs } from "pinia";
// 从store/play导入getTTSData
import { getTTSData } from "@/store/play";
import Loading from "../components/main/Loading.vue";  // 添加Loading组件引用
import FixedHeader from "../components/header/FixedHeader.vue";  // 添加这一行
import FreeTTSErrorDisplay from '../components/main/FreeTTSErrorDisplay.vue'; // 导入FreeTTSErrorDisplay组件
import { getChineseName } from '@/voice-utils'; // 导入getChineseName函数
import { useLocalTTSStore } from "@/store/local-tts-store";

// 导入图标
import { 
  MagicStick, 
  ChatLineSquare,
  Upload, 
  DeleteFilled, 
  CaretRight, 
  FolderOpened, 
  WarningFilled, 
  RefreshRight, 
  SwitchButton,
  Connection,
  ChatDotRound,
  Microphone,
  Setting,
  Avatar,
  InfoFilled,
  QuestionFilled,
  VideoCameraFilled,
  ArrowLeft,
  DocumentChecked,
  ShoppingCart,
  Download
} from '@element-plus/icons-vue';

// 从options-config导入配置
import { optionsConfig } from "../components/main/options-config";

// 全局store实例，用于composables函数中访问
let globalTtsStore = null;
let globalInputs = ref({});
let globalPage = ref({});
let globalFormConfig = ref({});
let globalConfig = ref({});
let globalCurrMp3Url = ref(''); // 添加全局currMp3Url引用

// 创建一个函数初始化全局引用，确保在setup调用后可以使用
const initGlobalRefs = () => {
  try {
    const ttsStore = useTtsStore();
    
    // 确保store已正确实例化
    if (!ttsStore) {
      console.error('初始化global refs失败: ttsStore 为 null 或 undefined');
      return { ttsStore: null };
    }
    
    globalTtsStore = ttsStore;
    
    // 确保所有必需的属性都存在
    if (!ttsStore.inputs) {
      console.warn('ttsStore中缺少inputs属性，创建默认值');
      ttsStore.inputs = {
        inputValue: "如果你觉得这个项目还不错， 欢迎Star、Fork和PR。你的Star是对作者最好的鼓励。",
        ssmlValue: "如果你觉得这个项目还不错， 欢迎Star、Fork和PR。你的Star是对作者最好的鼓励。"
      };
    }
    
    if (!ttsStore.page) {
      console.warn('ttsStore中缺少page属性，创建默认值');
      ttsStore.page = {
        asideIndex: "1",
        tabIndex: "1"
      };
    }
    
    if (!ttsStore.config) {
      console.warn('ttsStore中缺少config属性，创建默认值');
      const store = new WebStore();
      ttsStore.config = {
        language: store.get("language") || "zh",
        formConfigJson: store.get("FormConfig") || {},
        formConfigList: [],
        configLabel: [],
        audition: store.get("audition") || "如果你觉得这个项目还不错， 欢迎Star、Fork和PR。你的Star是对作者最好的鼓励。",
        autoplay: store.get("autoplay") !== undefined ? store.get("autoplay") : true,
        updateNotification: store.get("updateNotification") !== undefined ? store.get("updateNotification") : true,
        titleStyle: store.get("titleStyle") || "custom",
        api: store.get("api") || 5,
        formatType: store.get("formatType") || "mp3",
        speechKey: store.get("speechKey") || "",
        serviceRegion: store.get("serviceRegion") || "",
        thirdPartyApi: store.get("thirdPartyApi") || "",
        disclaimers: store.get("disclaimers") || false,
        retryCount: store.get("retryCount") || 3,
        retryInterval: store.get("retryInterval") || 1000,
        openAIKey: store.get("openAIKey") || "",
        gptModel: store.get("gptModel") || "gpt-3.5-turbo",
        tts88Key: store.get("tts88Key") || "",
        openAIBaseUrl: store.get("openAIBaseUrl") || ""
      };
    }
    
    if (!ttsStore.formConfig) {
      console.warn('ttsStore中缺少formConfig属性，创建默认值');
      const store = new WebStore();
      let defaultFormConfig = store.get("FormConfig.默认");
      if (!defaultFormConfig) {
        defaultFormConfig = {
          api: 5,
          languageSelect: "zh-CN",
          voiceSelect: "zh-CN-XiaoxiaoNeural",
          voiceStyleSelect: "Default",
          role: "",
          speed: 1,
          pitch: 1
        };
      }
      ttsStore.formConfig = defaultFormConfig;
    }
    
    if (!ttsStore.tableData) {
      console.warn('ttsStore中缺少tableData属性，创建空数组');
      ttsStore.tableData = [];
    }
    
    // 初始化属性引用
    globalInputs = ref(ttsStore.inputs);
    globalPage = ref(ttsStore.page);
    globalFormConfig = ref(ttsStore.formConfig);
    globalConfig = ref(ttsStore.config);
    
    // 确保currMp3Url是ref对象并设置到全局变量
    try {
      if (ttsStore.currMp3Url) {
        if (typeof ttsStore.currMp3Url === 'object' && 'value' in ttsStore.currMp3Url) {
          globalCurrMp3Url = ttsStore.currMp3Url;
          console.log('初始化全局currMp3Url引用');
        } else {
          console.log('ttsStore.currMp3Url不是ref对象，创建新的全局ref');
          globalCurrMp3Url = ref(ttsStore.currMp3Url);
          // 同步回store
          ttsStore.currMp3Url = globalCurrMp3Url;
        }
      } else {
        console.log('ttsStore中没有currMp3Url，创建全局空ref');
        globalCurrMp3Url = ref('');
        // 同步回store
        ttsStore.currMp3Url = globalCurrMp3Url;
      }
    } catch (err) {
      console.error('初始化全局currMp3Url时出错:', err);
      globalCurrMp3Url = ref('');
      try {
        ttsStore.currMp3Url = globalCurrMp3Url;
      } catch (storeErr) {
        console.error('无法将全局currMp3Url同步回store:', storeErr);
      }
    }
    
    // 确保audioPlayer存在
    if (!ttsStore.audioPlayer) {
      console.warn('ttsStore中缺少audioPlayer属性，创建null值');
      ttsStore.audioPlayer = null;
    }
    
    return { 
      ttsStore, 
      inputs: globalInputs, 
      page: globalPage, 
      config: globalConfig, 
      formConfig: globalFormConfig 
    };
  } catch (err) {
    console.error('初始化global refs时发生错误:', err);
    return { ttsStore: null };
  }
};

// 创建一个初始化函数，在组件中使用时调用
function useMainSetup() {
  // 获取i18n实例（只能在组件setup中使用）
  const { t } = useI18n();  
  const ttsStore = useTtsStore();
  const localTTSStore = useFreeTTSstore();
  
  // 确保初始化全局引用
  initGlobalRefs();
  
  // 安全地解构属性
  const inputs = ttsStore.inputs ? ref(ttsStore.inputs) : ref({
    inputValue: "如果你觉得这个项目还不错， 欢迎Star、Fork和PR。你的Star是对作者最好的鼓励。",
    ssmlValue: "如果你觉得这个项目还不错， 欢迎Star、Fork和PR。你的Star是对作者最好的鼓励。"
  });
  
  const page = ttsStore.page ? ref(ttsStore.page) : ref({
    asideIndex: "1",
    tabIndex: "1"
  });
  
  const tableData = ttsStore.tableData ? ref(ttsStore.tableData) : ref([]);
  
  // 确保currMp3Url始终是ref对象
  let currMp3Url;
  try {
    // 优先使用全局的globalCurrMp3Url
    if (globalCurrMp3Url && typeof globalCurrMp3Url === 'object' && 'value' in globalCurrMp3Url) {
      currMp3Url = globalCurrMp3Url;
      console.log('useMainSetup: 使用全局globalCurrMp3Url');
      
      // 确保store中的currMp3Url与全局保持一致
      if (ttsStore && ttsStore.currMp3Url !== globalCurrMp3Url) {
        ttsStore.currMp3Url = globalCurrMp3Url;
        console.log('useMainSetup: 已将ttsStore.currMp3Url同步为全局引用');
      }
    } 
    // 如果全局变量无效，则尝试使用store中的变量
    else if (ttsStore.currMp3Url) {
      if (typeof ttsStore.currMp3Url === 'object' && 'value' in ttsStore.currMp3Url) {
        currMp3Url = ttsStore.currMp3Url;
        console.log('useMainSetup: 使用ttsStore中的currMp3Url ref');
        // 更新全局引用
        globalCurrMp3Url = currMp3Url;
      } else {
        console.log('useMainSetup: ttsStore.currMp3Url不是ref对象，创建新的ref');
        currMp3Url = ref(ttsStore.currMp3Url);
        // 同步回store和全局引用
        ttsStore.currMp3Url = currMp3Url;
        globalCurrMp3Url = currMp3Url;
      }
    } 
    // 如果store和全局变量都无效，则创建新变量
    else {
      console.log('useMainSetup: 全局和store中都没有currMp3Url，创建空ref');
      currMp3Url = ref('');
      // 同步回store和全局引用
      ttsStore.currMp3Url = currMp3Url;
      globalCurrMp3Url = currMp3Url;
    }
  } catch (err) {
    console.error('useMainSetup: 处理currMp3Url时出错:', err);
    // 确保我们至少有一个可用的currMp3Url ref
    currMp3Url = ref('');
    try {
      ttsStore.currMp3Url = currMp3Url;
      globalCurrMp3Url = currMp3Url;
      console.log('useMainSetup: 重置了currMp3Url引用');
    } catch (storeErr) {
      console.error('useMainSetup: 无法同步currMp3Url:', storeErr);
    }
  }
  
  const config = ttsStore.config ? ref(ttsStore.config) : ref({});
  
  const formConfig = ttsStore.formConfig ? ref(ttsStore.formConfig) : ref({});
  
  const audioPlayer = ttsStore.audioPlayer;

  // 初始化语音列表
  onMounted(() => {
    // 确保初始化语音列表
    initVoiceList();
  });

  // 返回需要在组件中使用的内容
  return {
    t,
    ttsStore,
    localTTSStore,
    inputs,
    page,
    tableData,
    currMp3Url,
    config, 
    formConfig,
    audioPlayer
  };
}

// 初始化语音列表的函数
const initVoiceList = () => {
  console.log('初始化语音列表');
  try {
    // 安全检查
    if (!globalFormConfig || !globalFormConfig.value) {
      console.warn('globalFormConfig 未定义，无法初始化语音列表');
      return;
    }

    // 获取当前选择的语言
    const currentLanguage = globalFormConfig.value?.languageSelect || 'zh-CN';
    console.log('当前语言:', currentLanguage);
    
    // 为当前语言加载语音列表
    if (optionsConfig && optionsConfig.findVoicesByLocaleName) {
      voiceSelectList.value = optionsConfig.findVoicesByLocaleName(currentLanguage);
      console.log('已加载语音列表, 数量:', voiceSelectList.value.length);
    } else {
      console.warn('optionsConfig.findVoicesByLocaleName 不可用');
      voiceSelectList.value = [];
    }
    
    // 如果没有选择语音但有语音列表，则选择第一个
    if (globalFormConfig.value && 
        (!globalFormConfig.value.voiceSelect || globalFormConfig.value.voiceSelect === '') && 
        voiceSelectList.value && voiceSelectList.value.length > 0) {
      // 设置默认语音
      console.log('设置默认语音:', voiceSelectList.value[0].ShortName);
      globalFormConfig.value.voiceSelect = voiceSelectList.value[0].ShortName;
    }
  } catch (err) {
    console.error('初始化语音列表失败:', err);
  }
};

// 使用一个变量来模拟t函数，供非组件环境使用
const t = (key) => {
  // 从i18n.global获取翻译
  return i18n.global.t(key);
};

// 声明状态变量
const docIframe = ref(null);
const iframeLoaded = ref(false);
const iframeError = ref(false);
const docUrl = ref('https://docs.tts88.top/');
const urlIndex = ref(0);
const iframeCurrentSrc = ref('');
const docUrls = [
  'https://docs.tts88.top/',
];

// 定义UI状态
const isSSMLMode = ref(false);
const isLoading = ref(false);
const convertProgress = ref(0);
const loadingTitle = ref('正在生成语音');
const loadingMessage = ref('请稍候，正在处理您的请求...');
const ssmlHelpVisible = ref(false);
const showVoiceAnchorsDialog = ref(false);
const openSettingsDrawer = ref(false);
const dialogVisible = ref(false);
const modalInput = ref('');
const dialogLoading = ref(false);
const isDownloading = ref(false);
const drawerOptions = ref(null);
const audioPlayerRef = ref(null);
const showModal = ref(false);
const uploadRef = ref();

// 添加对isSSMLMode的监听
watch(isSSMLMode, (newValue, oldValue) => {
  console.log(`输入模式切换: ${oldValue ? 'SSML' : '纯文本'} -> ${newValue ? 'SSML' : '纯文本'}`);
  
  if (newValue && !oldValue) {
    // 从纯文本切换到SSML模式
    console.log('将纯文本转换为SSML');
    const ttsStore = useTtsStore();
    if (ttsStore) {
      ttsStore.setSSMLValue(); // 使用store中的方法生成SSML
    }
  } else if (!newValue && oldValue) {
    // 从SSML切换到纯文本模式
    // 不需要处理，因为纯文本内容已经存在
    console.log('已切换到纯文本模式，保持现有纯文本内容');
  }
});

// 选项列表
const apiOptions = optionsConfig.apiSelect;
const languageOptions = optionsConfig.languageSelect;
const voiceSelectList = ref([]);
const formatOptions = [
  { label: 'MP3', value: 'mp3' },
  { label: 'WAV', value: 'wav' }
];

// 创建一个简单的响应式对象作为playerConfig
const playerConfig = reactive({
  formatType: 'mp3',
  autoplay: true
});

// iframe相关函数
const initIframe = () => {
  iframeCurrentSrc.value = '';
  
  // 在清除src后，立即设置容器和iframe样式以确保正确显示
  nextTick(() => {
    // 修改页面主容器样式，保留基本结构但减少内边距
    const mainContainer = document.querySelector('.modern-main');
    if (mainContainer instanceof HTMLElement && page?.value?.asideIndex === '4') {
      mainContainer.style.padding = '0';
      mainContainer.style.gap = '0';
      // 不设置固定高度和位置，避免覆盖左侧菜单
    }
    
    const container = document.querySelector('.doc-page-container');
    if (container instanceof HTMLElement) {
      // 设置文档容器填充可用空间，但不使用fixed定位
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.height = 'calc(100vh - 40px)'; // 只预留顶部导航栏的空间
      container.style.margin = '0';
      container.style.padding = '0';
      container.style.borderRadius = '0';
      container.style.boxShadow = 'none';
      // 不使用fixed定位，避免覆盖左侧菜单
      container.style.position = 'relative';
    }
    
    if (docIframe.value) {
      docIframe.value.style.display = 'block';
      docIframe.value.style.flex = '1';
      docIframe.value.style.width = '100%';
      docIframe.value.style.height = '100%';
      docIframe.value.style.minHeight = '700px';
      docIframe.value.style.maxHeight = 'none';
      docIframe.value.style.margin = '0';
      docIframe.value.style.padding = '0';
      docIframe.value.style.border = 'none';
      docIframe.value.style.borderRadius = '0';
    }
    
    // 设置iframe源
    iframeCurrentSrc.value = docUrl.value;
    console.log('iframe 初始化源设置为:', docUrl.value);
  });
};

// 尝试使用备用链接
const tryAlternativeUrl = () => {
  urlIndex.value = (urlIndex.value + 1) % docUrls.length;
  docUrl.value = docUrls[urlIndex.value];
  console.log(`尝试备用文档链接: ${docUrl.value}`);
  
  iframeLoaded.value = false;
  iframeError.value = false;
  
  // 清空并重新设置src以确保重新加载
  initIframe();
  
  ElMessage({
    message: `正在尝试备用链接: ${docUrl.value}`,
    type: "info",
    duration: 3000,
  });
};

// 处理来自iframe的消息
const handleIframeMessage = (event) => {
  console.log('收到消息:', event);
  
  // 确保消息来源安全，验证来源域名
  const isValidOrigin = docUrls.some(url => {
    try {
      const urlHost = new URL(url).hostname;
      return event.origin.includes(urlHost);
    } catch (e) {
      return false;
    }
  });
  
  // 如果消息来源不安全，忽略此消息
  if (!isValidOrigin) {
    console.warn('收到来自未知来源的消息，已忽略:', event.origin);
    return;
  }
  
  console.log('来自文档页面的消息:', event.data);
  
  // 处理不同类型的消息
  if (typeof event.data === 'object' && event.data !== null) {
    // 文档加载完成消息
    if (event.data.type === 'docLoaded') {
      iframeLoaded.value = true;
      iframeError.value = false;
      
      ElMessage({
        message: "文档页面已准备就绪",
        type: "success",
        duration: 2000,
      });
      
      // 对iframe内容回送确认消息
      sendMessageToIframe({
        type: 'docLoadedConfirm',
        status: 'success'
      });
    }
    
    // 调整高度消息
    if (event.data.type === 'resizeHeight' && typeof event.data.height === 'number') {
      const height = event.data.height;
      if (height > 0 && docIframe.value) {
        // 确保高度合理
        const safeHeight = Math.max(Math.min(height, 5000), 300);
        docIframe.value.style.height = `${safeHeight}px`;
        console.log(`根据iframe请求调整高度: ${safeHeight}px`);
      }
    }
    
    // 导航请求消息
    if (event.data.type === 'navigate' && typeof event.data.url === 'string') {
      // 允许在iframe内部导航到指定URL
      if (docIframe.value) {
        console.log(`iframe请求导航到: ${event.data.url}`);
        // 可选：检查URL是否安全，例如仅允许相同域名下的导航
      }
    }
  }
};

// 向iframe发送消息
const sendMessageToIframe = (message) => {
  if (docIframe.value && docIframe.value.contentWindow) {
    try {
      docIframe.value.contentWindow.postMessage(message, '*');
      console.log('向iframe发送消息:', message);
    } catch (error) {
      console.error('向iframe发送消息失败:', error);
    }
  }
};

// 在iframe加载完成后发送初始化消息
const sendInitMessageToIframe = () => {
  // 等待iframe完全加载
  setTimeout(() => {
    sendMessageToIframe({
      type: 'init',
      appInfo: {
        name: 'TTS Web Vue',
        version: '1.0',
        theme: document.body.classList.contains('dark-theme') ? 'dark' : 'light'
      }
    });
  }, 1000);
};

// 处理 iframe 加载成功
const handleIframeLoad = (event) => {
  console.log('iframe 加载事件触发');
  
  // 检查iframe是否完全加载且可访问
  try {
    const iframe = event.target;
    
    // 不是所有iframe都会触发跨域报错，但我们需要检查是否实际加载成功
    if (iframe.contentWindow && iframe.src.includes(docUrl.value)) {
      iframeLoaded.value = true;
      iframeError.value = false;
      
      console.log('iframe 加载成功:', {
        width: iframe.offsetWidth,
        height: iframe.offsetHeight
      });
      
      // 尝试调整iframe高度
      nextTick(() => {
        adjustIframeHeight();
        // 发送初始化消息到iframe
        sendInitMessageToIframe();
      });
      
      // 显示加载成功提示
      ElMessage({
        message: "文档加载成功",
        type: "success",
        duration: 2000,
      });
    } else {
      console.warn('iframe可能加载不完整或存在跨域问题');
    }
  } catch (error) {
    // 处理跨域安全限制导致的错误
    console.error('检查iframe出错 (可能是跨域问题):', error);
    // 我们不将这种情况标记为错误，因为iframe可能仍然正常加载
    iframeLoaded.value = true;
  }
};

// 添加新函数用于调整iframe高度
const adjustIframeHeight = () => {
  if (!docIframe.value) return;
  
  // 获取容器高度
  const container = document.querySelector('.doc-page-container');
  if (!container) return;
  
  // 修改页面主容器样式，减少内边距但保留基本布局
  const mainContainer = document.querySelector('.modern-main');
  if (mainContainer instanceof HTMLElement && page?.value?.asideIndex === '4') {
    mainContainer.style.padding = '0';
    mainContainer.style.gap = '0';
    // 不修改主容器的overflow和高度，保持基本布局
  }
  
  // 获取可用高度（视口高度减去顶部导航栏高度）
  const availableHeight = window.innerHeight - 40;
  
  // 设置container样式以充分利用可用空间
  if (container instanceof HTMLElement) {
    container.style.height = `${availableHeight}px`;
    container.style.maxHeight = `${availableHeight}px`;
    container.style.margin = '0';
    container.style.padding = '0';
    container.style.borderRadius = '0';
    container.style.boxShadow = 'none';
    // 使用相对定位，不覆盖左侧菜单
    container.style.position = 'relative';
  }
  
  // 设置iframe样式以充满容器
  docIframe.value.style.width = '100%';
  docIframe.value.style.height = '100%';
  docIframe.value.style.minHeight = '700px';
  docIframe.value.style.maxHeight = 'none';
  docIframe.value.style.display = 'block';
  docIframe.value.style.flex = '1';
  docIframe.value.style.margin = '0';
  docIframe.value.style.padding = '0';
  docIframe.value.style.border = 'none';
  docIframe.value.style.borderRadius = '0';
  
  // 强制iframe内容与容器大小相匹配
  try {
    if (docIframe.value.contentWindow && docIframe.value.contentWindow.document) {
      const iframeDoc = docIframe.value.contentWindow.document;
      // 尝试通过样式影响iframe内部文档的大小
      const styleEl = iframeDoc.createElement('style');
      styleEl.textContent = 'html, body { height: 100%; margin: 0; padding: 0; overflow: auto; }';
      iframeDoc.head.appendChild(styleEl);
    }
  } catch (error) {
    console.warn('无法修改iframe内部样式 (跨域限制):', error);
  }
};

// 处理 iframe 加载失败
const handleIframeError = (event) => {
  console.error('iframe 加载失败:', event);
  iframeLoaded.value = false;
  iframeError.value = true;
  
  ElMessage({
    message: "文档加载失败，请检查网络连接",
    type: "error",
    duration: 3000,
  });
};

// 重新加载 iframe
const reloadIframe = () => {
  console.log('重新加载 iframe');
  iframeLoaded.value = false;
  iframeError.value = false;
  
  // 强制 iframe 重新加载
  initIframe();
  
  ElMessage({
    message: "正在重新加载文档",
    type: "info",
    duration: 2000,
  });
};

// 定义单独的处理函数，以便可以正确地添加和删除监听器
const handleKeyDown = (e) => {
  // ESC键关闭抽屉
  if (e.key === 'Escape' && openSettingsDrawer.value) {
    openSettingsDrawer.value = false;
  }
};

// 检查免费TTS服务状态
const checkTTSServiceStatus = async () => {
  try {
    // 检查连接状态 - 这里需要在组件内调用
    console.log("准备检查TTS服务状态");
  } catch (error) {
    console.error('检查免费TTS服务状态失败:', error);
  }
};

// 更新组件
const updateComponent = () => {
  console.log('Main 组件已更新');
};

// 发送到ChatGPT
const sendToChatGPT = async () => {
  if (!modalInput.value) {
    ElMessage({
      message: "请输入提示文本",
      type: "warning",
      duration: 2000,
    });
    return;
  }
  
  dialogLoading.value = true;
  
  try {
    // 这部分需要在组件内执行
    console.log("将发送内容到ChatGPT:", modalInput.value);
    dialogVisible.value = false;
  } catch (error) {
    console.error("GPT生成失败:", error);
  } finally {
    dialogLoading.value = false;
  }
};

// 处理选项卡点击
const handleTabClick = (tab) => {
  console.log("处理选项卡点击:", tab);
};

// 处理删除
const handleDelete = (index, row) => {
  console.log("处理删除:", index, row);
  uploadRef.value?.handleRemove(row.file);
};

// 文件更改处理
const fileChange = (uploadFile, uploadFiles) => {
  console.log("文件已更改:", uploadFiles.length, "个文件");
};

// 文件移除处理
const fileRemove = (uploadFile, uploadFiles) => {
  console.log("文件已移除:", uploadFiles.length, "个剩余文件");
};

// 清除所有
const clearAll = () => {
  console.log("清除所有文件");
  uploadRef.value?.clearFiles();
};

// 播放
const playAudio = (url: string, options = { autoplay: true }) => {
  console.log('统一播放函数被调用:', url);
  
  // 增强URL有效性检查
  if (!url || url === '' || 
      url === 'null' || 
      url === 'undefined' ||
      url === window.location.href ||
      url.includes('127.0.0.1:3344') ||
      url.includes('localhost:3344')) {
    console.warn('播放失败: 无有效的音频URL');
    return Promise.reject(new Error('无效的音频URL'));
  }
  
  return new Promise((resolve, reject) => {
    try {
      // 确保audioPlayerRef存在
      if (!audioPlayerRef.value) {
        console.error('audioPlayerRef不存在');
        reject(new Error('播放器引用不可用'));
        return;
      }
      
      // 设置音频源
      audioPlayerRef.value.src = url;
      
      // 更新全局状态中的URL
      if (globalTtsStore && globalTtsStore.currMp3Url) {
        if (typeof globalTtsStore.currMp3Url === 'object' && 'value' in globalTtsStore.currMp3Url) {
          globalTtsStore.currMp3Url.value = url;
        }
      }
      
      if (globalCurrMp3Url && 'value' in globalCurrMp3Url) {
        globalCurrMp3Url.value = url;
      }
      
      // 加载音频
      audioPlayerRef.value.load();
      
      // 只在需要自动播放时播放
      if (options.autoplay) {
        // 检查是否已经在播放
        if (audioPlayerRef.value.paused) {
          let playPromise = audioPlayerRef.value.play();
          
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log('音频播放成功');
                resolve(true);
              })
              .catch(error => {
                console.error('主播放器播放失败:', error);
                // 尝试备选播放方式
                tryAlternativePlayback(url)
                  .then(resolve)
                  .catch(reject);
              });
          } else {
            console.log('播放已开始，但没有返回Promise');
            resolve(true);
          }
        } else {
          console.log('音频已经在播放中');
          resolve(true);
        }
      } else {
        console.log('不自动播放，仅设置音频源');
        resolve(false);
      }
    } catch (error) {
      console.error('播放过程发生异常:', error);
      // 尝试备选播放方式
      tryAlternativePlayback(url)
        .then(resolve)
        .catch(() => {
          reject(error);
        });
    }
  });
};

// 备选播放方式
const tryAlternativePlayback = (url: string) => {
  console.log('尝试备选播放方式:', url);
  
  return new Promise((resolve, reject) => {
    try {
      // 尝试使用全局store中的播放器
      if (globalTtsStore && globalTtsStore.audioPlayer) {
        console.log('使用store中的audioPlayer播放');
        // 检查是否为ref对象
        const audioPlayer = 'value' in globalTtsStore.audioPlayer 
          ? globalTtsStore.audioPlayer.value 
          : globalTtsStore.audioPlayer;
          
        if (audioPlayer) {
          audioPlayer.src = url;
          const playPromise = audioPlayer.play();
          
          if (playPromise) {
            playPromise
              .then(() => resolve(true))
              .catch(error => {
                console.error('store audioPlayer播放失败:', error);
                createNewAudioInstance();
              });
            return;
          }
        }
      }
      
      createNewAudioInstance();
      
      // 创建新的Audio实例的函数
      function createNewAudioInstance() {
        console.log('创建新的Audio实例播放');
        const tempAudio = new Audio(url);
        tempAudio.play()
          .then(() => {
            // 保存到store中
            if (globalTtsStore) {
              globalTtsStore.audioPlayer = tempAudio;
            }
            resolve(true);
          })
          .catch(err => {
            console.error('临时Audio实例播放失败:', err);
            reject(err);
          });
      }
    } catch (e) {
      console.error('备选播放方式异常:', e);
      reject(e);
    }
  });
};

// 在文件夹中打开
const openInFolder = (val) => {
  console.log("在文件夹中打开:", val);
};

// 修改现有的audition函数，使用新的统一播放逻辑
const audition = async (value: string) => {
  console.log("试听:", value);
  
  if (!value) {
    console.warn('试听失败: 无有效的音频URL');
    ElMessage({
      message: "试听失败: 无有效音频",
      type: "warning",
      duration: 2000,
    });
    return;
  }
  
  try {
    await playAudio(value);
  } catch (error) {
    console.error('试听失败:', error);
    ElMessage({
      message: "播放失败: " + (error instanceof Error ? error.message : String(error)),
      type: "warning",
      duration: 2000,
    });
  }
};

// API更改
const apiChange = (value) => {
  console.log("API更改为:", value);
};

// 语言选择更改
const languageSelectChange = (value) => {
  console.log("语言更改为:", value);
  voiceSelectList.value = optionsConfig.findVoicesByLocaleName(value);
};

// 语音选择更改
const voiceSelectChange = (value) => {
  console.log("声音更改为:", value);
};

// 开始按钮
const startBtn = async () => {
  console.log("开始转换");
  
  // 验证有转换内容
  if (!globalInputs.value?.inputValue && !globalInputs.value?.ssmlValue) {
    ElMessage({
      message: "请先输入要转换的文本",
      type: "warning",
      duration: 2000,
    });
    return;
  }
  
  // 针对免费TTS服务，先检查额度
  if (globalFormConfig.value?.api === 5) {
    try {
      const localTTSStore = useFreeTTSstore();
      
      // 先检查连接状态
      const isConnected = await localTTSStore.checkServerConnection();
      if (!isConnected) {
        ElMessage({
          message: "无法连接到免费TTS服务，请检查网络连接",
          type: "warning",
          duration: 3000,
        });
        return;
      }
      
      // 检查可用额度
      const quotaInfo = await localTTSStore.getFreeLimitInfo();
      
      // 检查是否有足够的额度
      if (quotaInfo) {
        const inputText = isSSMLMode.value ? globalInputs.value?.ssmlValue : globalInputs.value?.inputValue;
        const textLength = inputText?.length || 0;
        
        if (quotaInfo.remaining < textLength) {
          // 额度不足，显示提示并终止转换
          ElMessage({
            message: `免费额度不足: 剩余${quotaInfo.remaining}字符，需要${textLength}字符`,
            type: "warning",
            duration: 5000,
          });
          
          // 展示使用TTS88API的提示
          ElMessageBox.confirm(
            '您的免费额度不足以转换当前文本，可使用TTS88API解锁无限使用。是否前往获取API密钥？',
            '额度不足提示',
            {
              confirmButtonText: '获取API密钥',
              cancelButtonText: '暂不需要',
              type: 'warning',
            }
          )
            .then(() => {
              // 打开API站点
              openApiSite();
            })
            .catch(() => {
              console.log('用户取消跳转到API站点');
            });
          return;
        }
      }
    } catch (err) {
      console.error('检查免费TTS额度失败:', err);
      // 继续处理，让转换函数处理错误
    }
  }
  
  // 通过了前置检查，现在显示加载界面并开始转换
  isLoading.value = true;
  convertProgress.value = 0;
  
  // 模拟进度
  const progressInterval = setInterval(() => {
    if (convertProgress.value < 90) {
      convertProgress.value += Math.random() * 5;
    }
  }, 300);
  
  try {
    // 使用全局变量引用    
    // 构建请求参数
    const voiceData = {
      activeIndex: globalPage.value?.tabIndex || "0",
      ssmlContent: globalInputs.value?.ssmlValue || "",
      inputContent: globalInputs.value?.inputValue || "",
      retryCount: globalConfig.value?.retryCount || 3,
      retryInterval: globalConfig.value?.retryInterval || 1,
    };
    
    // 检查activeIndex是否正确
    console.log('当前activeIndex:', voiceData.activeIndex);
    console.log('是否为SSML模式:', voiceData.activeIndex === "1");
    console.log('输入内容长度:', voiceData.inputContent.length);
    console.log('SSML内容长度:', voiceData.ssmlContent.length);
    
    // 针对免费TTS服务的特殊处理
    if (globalFormConfig.value?.api === 5) {
      console.log('使用免费TTS服务，确保提供有效内容');
      // 如果没有输入文本，但有SSML文本，则强制设置为SSML模式
      if (!voiceData.inputContent && voiceData.ssmlContent) {
        voiceData.activeIndex = "1";
        console.log('强制设置为SSML模式');
      }
      // 如果没有SSML文本，但有输入文本，则强制设置为普通文本模式
      else if (!voiceData.ssmlContent && voiceData.inputContent) {
        voiceData.activeIndex = "0";
        console.log('强制设置为普通文本模式');
      }
    }
    
    // 发起TTS请求
    const result = await getTTSData({
      api: globalFormConfig.value?.api || 5, // 默认使用免费TTS
      voiceData,
      speechKey: globalConfig.value?.speechKey || "",
      region: globalConfig.value?.serviceRegion || "",
      thirdPartyApi: globalConfig.value?.thirdPartyApi || "",
      tts88Key: globalConfig.value?.tts88Key || "",
    });
    
    // 完成进度条动画
    clearInterval(progressInterval);
    convertProgress.value = 100;
    
    // 检查返回结果
    if (result.error) {
      throw new Error(result.error);
    }
    
    // 处理成功结果
    let audioUrl = '';
    
    if (result.buffer) {
      audioUrl = handleAudioBlob(result.buffer);
    } else if (result.audibleUrl) {
      // 直接使用返回的URL
      audioUrl = result.audibleUrl;
    } else if (result.audioContent) {
      // 将base64转换为Blob并创建URL
      const binaryString = atob(result.audioContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
      audioUrl = URL.createObjectURL(audioBlob);
    }
    
    if (audioUrl && globalTtsStore) {
      // 设置音频播放URL - 完全重写这部分逻辑，确保类型一致性
      try {
        // 首先检查globalTtsStore是否已定义
        if (!globalTtsStore) {
          console.error('globalTtsStore未定义');
          throw new Error('全局TTS Store未初始化');
        }
        
        // 记录当前类型，用于调试
        console.log('当前globalTtsStore.currMp3Url类型:', typeof globalTtsStore.currMp3Url);
        
        // 创建一个新的ref对象，确保类型一致性
        const newUrlRef = ref(audioUrl);
        
        // 直接替换store中的引用，不尝试修改现有对象
        globalTtsStore.currMp3Url = newUrlRef;
        
        // 同步到全局变量
        globalCurrMp3Url = newUrlRef;
        
        console.log('已创建新的currMp3Url ref并更新到store:', audioUrl);
        
        // 使用新的统一播放函数
        setTimeout(() => {
          playAudio(audioUrl).catch(error => {
            console.error('使用统一播放函数播放失败:', error);
          });
        }, 200);
      } catch (err) {
        console.error('设置currMp3Url或播放时出错:', err);
      }
      
      // 成功提示
      ElMessage({
        message: "转换成功",
        type: "success",
        duration: 2000,
      });
      
      // 添加到历史记录
      try {
        // 获取当前输入文本
        const originalText = isSSMLMode.value ? globalInputs.value.ssmlValue : globalInputs.value.inputValue;
        
        // 获取当前语音配置
        const currentVoice = globalFormConfig.value.voiceSelect;
        
        // 如果有临时blob URL，尝试获取其音频数据
        let audioData = null;
        if (audioUrl && audioUrl.startsWith('blob:')) {
          try {
            console.log('正在将blob URL转换为base64数据...');
            // 获取blob数据
            const response = await fetch(audioUrl);
            const blob = await response.blob();
            
            // 转换为base64
            const reader = new FileReader();
            audioData = await new Promise((resolve) => {
              reader.onloadend = () => {
                if (reader.result) {
                  // 获取base64数据（去掉前缀）
                  const base64Data = reader.result.toString().split(',')[1];
                  console.log('已将blob转换为base64数据，长度:', base64Data.length);
                  resolve(base64Data);
                } else {
                  resolve(null);
                }
              };
              reader.readAsDataURL(blob);
            });
          } catch (err) {
            console.error('获取音频blob数据失败:', err);
          }
        }
        
        // 调用store中的添加历史记录方法
        if (globalTtsStore && globalTtsStore.addHistoryRecord) {
          // 创建历史记录对象
          const historyRecord = {
            text: originalText.length > 100 ? originalText.substring(0, 100) + '...' : originalText,
            url: audioUrl,
            voiceName: currentVoice,
            audioData: audioData  // 添加音频数据
          };
          
          console.log('保存历史记录:', historyRecord.text.substring(0, 30) + '...');
          const success = globalTtsStore.addHistoryRecord(historyRecord);
          console.log('历史记录保存' + (success ? '成功' : '失败'));
        } else {
          console.warn('globalTtsStore.addHistoryRecord未定义，无法添加到历史记录');
        }
      } catch (err) {
        console.error('添加到历史记录失败:', err);
        // 错误不影响主流程，继续执行
      }
    } else {
      throw new Error("未获取到有效的音频数据");
    }
    
    // 延迟隐藏加载状态
    setTimeout(() => {
      isLoading.value = false;
      convertProgress.value = 0;
    }, 500);
  } catch (error) {
    // 错误处理
    clearInterval(progressInterval);
    
    // 延迟隐藏加载状态，避免闪烁
    setTimeout(() => {
      isLoading.value = false;
      convertProgress.value = 0;
    }, 400);
    
    // 检查是否为额度不足错误（HTTP 403 或包含"超出剩余配额"的消息）
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isQuotaError = errorMessage.includes('文本长度超出剩余配额') || 
                          errorMessage.includes('403') || 
                          errorMessage.includes('quota exceeded') ||
                          errorMessage.includes('免费额度');
    
    if (isQuotaError) {
      // 显示额度不足的提示
      ElMessage({
        message: "免费额度不足，转换失败",
        type: "warning",
        duration: 5000,
      });
      
      // 展示使用TTS88API的提示
      setTimeout(() => {
        ElMessageBox.confirm(
          '您的免费额度已不足，可使用TTS88API解锁无限使用。是否前往获取API密钥？',
          '额度不足提示',
          {
            confirmButtonText: '获取API密钥',
            cancelButtonText: '暂不需要',
            type: 'warning',
          }
        )
          .then(() => {
            // 打开API站点
            openApiSite();
          })
          .catch(() => {
            console.log('用户取消跳转到API站点');
          });
      }, 500); // 延迟显示对话框，先让加载状态完全消失
    } else {
      // 其他类型错误的普通提示
      ElMessage({
        message: "转换失败: " + errorMessage,
        type: "error",
        duration: 3000,
      });
    }
  }
};

// 打开设置面板
const openSettingsPanel = () => {
  console.log('打开设置抽屉');
        openSettingsDrawer.value = true;
};

// 获取抽屉选项引用
const getDrawerOptionsRef = () => drawerOptions.value || null;

// 处理抽屉打开事件
const onDrawerOpen = () => {
  console.log('抽屉已打开');
};

// 处理抽屉关闭事件
const onDrawerClose = () => {
  console.log('抽屉已关闭');
};

// 打开语音主播对话框
const openVoiceAnchors = () => {
  console.log('打开语音主播');
      showVoiceAnchorsDialog.value = true;
};

// 处理选择主播事件
const onSelectAnchor = (anchor) => {
  console.log('选择主播:', anchor?.name);
  showVoiceAnchorsDialog.value = false;
};

// 获取显示标签
const getDisplayLabel = (value) => {
  return getChineseName(value) || value;
};

// 打开SSML帮助
const openSSMLHelp = () => {
  ssmlHelpVisible.value = true;
};

// 取消转换
const cancelConversion = () => {
  isLoading.value = false;
  convertProgress.value = 0;
  ElMessage({
    message: "已取消转换",
    type: "info",
    duration: 2000,
  });
};

// 格式化XML
const formatXML = (xml) => {
  if (!xml) return '';

  let formatted = '';
  let indent = '';
  
  // 将XML字符串分割成行
  xml.split(/>\s*</).forEach(function(node) {
    if (node.match(/^\/\w/)) indent = indent.substring(2);
    formatted += indent + '<' + node + '>\n';
    if (!node.match(/^\//) && !node.match(/\/$/)) indent += '  ';
  });
  
  // 处理第一个和最后一个标签
  return formatted.substring(1, formatted.length - 2);
};

// 更新SSML内容
const updateSSML = () => {
  console.log("更新SSML内容");
};

// 调试文档
const debugDocument = () => {
  console.log('手动检查文档页面状态');
};

// 处理窗口大小变化
const handleResize = () => {
  console.log("窗口大小已改变");
  adjustContentMargins();
};

// 跳转到TTS页面
const goToTTS = () => {
  console.log('跳转到文字转语音页面');
  if (globalPage && globalPage.value) {
    globalPage.value.asideIndex = '1';
    console.log('已将页面导航更新到文字转语音 (asideIndex: 1)');
  } else {
    console.warn('globalPage未定义，无法跳转到文字转语音页面');
  }
};

// 打开API站点
const openApiSite = () => {
  window.open("https://api.tts88.top", "_blank");
  console.log('打开API购买页面');
};

// 检查是否有可用的音频
const isAudioAvailable = () => {
  let audioUrl = '';
  
  // 尝试来源1: 全局store中的currMp3Url
  if (globalTtsStore && globalTtsStore.currMp3Url) {
    // 处理ref对象或字符串
    if (typeof globalTtsStore.currMp3Url === 'object' && 'value' in globalTtsStore.currMp3Url) {
      audioUrl = globalTtsStore.currMp3Url.value;
    } else if (typeof globalTtsStore.currMp3Url === 'string') {
      audioUrl = globalTtsStore.currMp3Url;
    }
  }
  
  // 尝试来源2: 全局globalCurrMp3Url变量
  if ((!audioUrl || audioUrl === '') && globalCurrMp3Url) {
    if (typeof globalCurrMp3Url === 'object' && 'value' in globalCurrMp3Url) {
      audioUrl = globalCurrMp3Url.value;
    }
  }
  
  // 尝试来源3: audio元素的src属性
  if ((!audioUrl || audioUrl === '') && audioPlayerRef && audioPlayerRef.value) {
    const playerSrc = audioPlayerRef.value.src;
    if (playerSrc && playerSrc !== '' && playerSrc !== 'null' && playerSrc !== window.location.href) {
      // 确保不是本地服务器地址
      if (!playerSrc.includes('127.0.0.1:3344') && !playerSrc.includes('localhost:3344')) {
        audioUrl = playerSrc;
      }
    }
  }

  // 尝试来源4: 全局audioPlayer
  if ((!audioUrl || audioUrl === '') && globalTtsStore && globalTtsStore.audioPlayer) {
    const globalPlayerSrc = globalTtsStore.audioPlayer.src;
    if (globalPlayerSrc && globalPlayerSrc !== '' && globalPlayerSrc !== 'null' && globalPlayerSrc !== window.location.href) {
      // 确保不是本地服务器地址
      if (!globalPlayerSrc.includes('127.0.0.1:3344') && !globalPlayerSrc.includes('localhost:3344')) {
        audioUrl = globalPlayerSrc;
      }
    }
  }
  
  // 检查URL是否有效
  // 1. 必须存在且不为空
  // 2. 不能是默认的服务器地址 (例如http://127.0.0.1:3344/)
  // 3. 不能是空值或浏览器默认值
  if (!audioUrl || audioUrl === '') {
    return false;
  }
  
  // 过滤掉本地服务器地址
  if (audioUrl.includes('127.0.0.1:3344') || 
      audioUrl.includes('localhost:3344') ||
      audioUrl === window.location.href ||
      audioUrl === 'null' ||
      audioUrl === 'undefined') {
    return false;
  }
  
  // 如果是blob类型的URL或基于data:的URL，几乎肯定是有效的
  if (audioUrl.startsWith('blob:') || audioUrl.startsWith('data:')) {
    return true;
  }
  
  // 附加检查：确保URL至少长于8个字符（http://a）
  if (audioUrl.length < 8) {
    return false;
  }
  
  return true;
};

// 下载
const download = () => {
  console.log("下载音频");
  isDownloading.value = true;
  
  // 获取当前的音频URL - 从多个来源尝试获取
  let audioUrl = '';
  
  // 尝试来源1: 全局store中的currMp3Url
  if (globalTtsStore && globalTtsStore.currMp3Url) {
    // 处理ref对象或字符串
    if (typeof globalTtsStore.currMp3Url === 'object' && 'value' in globalTtsStore.currMp3Url) {
      audioUrl = globalTtsStore.currMp3Url.value;
      console.log("从ref对象获取到URL:", audioUrl);
    } else if (typeof globalTtsStore.currMp3Url === 'string') {
      audioUrl = globalTtsStore.currMp3Url;
      console.log("从非ref对象获取到URL:", audioUrl);
    }
  }
  
  // 尝试来源2: 全局globalCurrMp3Url变量
  if ((!audioUrl || audioUrl === '') && globalCurrMp3Url) {
    if (typeof globalCurrMp3Url === 'object' && 'value' in globalCurrMp3Url) {
      audioUrl = globalCurrMp3Url.value;
      console.log("从全局globalCurrMp3Url获取到URL:", audioUrl);
    }
  }
  
  // 尝试来源3: audio元素的src属性
  if ((!audioUrl || audioUrl === '') && audioPlayerRef && audioPlayerRef.value) {
    const playerSrc = audioPlayerRef.value.src;
    if (playerSrc && playerSrc !== '' && playerSrc !== 'null' && playerSrc !== window.location.href) {
      audioUrl = playerSrc;
      console.log("从audioPlayerRef获取到URL:", audioUrl);
    }
  }

  // 尝试来源4: 全局audioPlayer
  if ((!audioUrl || audioUrl === '') && globalTtsStore && globalTtsStore.audioPlayer) {
    const globalPlayerSrc = globalTtsStore.audioPlayer.src;
    if (globalPlayerSrc && globalPlayerSrc !== '' && globalPlayerSrc !== 'null' && globalPlayerSrc !== window.location.href) {
      audioUrl = globalPlayerSrc;
      console.log("从全局audioPlayer获取到URL:", audioUrl);
    }
  }
  
  // 确保有有效的URL
  if (audioUrl && audioUrl !== '') {
    // 过滤掉本地服务器地址和无效URL
    if (audioUrl.includes('127.0.0.1:3344') || 
        audioUrl.includes('localhost:3344') ||
        audioUrl === window.location.href ||
        audioUrl === 'null' ||
        audioUrl === 'undefined') {
      console.warn("检测到无效的音频URL:", audioUrl);
      
      ElMessage({
        message: "没有可用的音频可下载",
        type: "warning",
        duration: 2000,
      });
    } else {
      console.log("创建下载链接:", audioUrl);
      
      try {
        // 创建一个隐藏的a标签来触发下载
        const a = document.createElement('a');
        a.href = audioUrl;
        a.download = `tts-audio-${new Date().getTime()}.${playerConfig.formatType || 'mp3'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        ElMessage({
          message: "开始下载音频",
          type: "success",
          duration: 2000,
        });
      } catch (error) {
        console.error("下载过程中出错:", error);
        ElMessage({
          message: "下载失败: " + (error instanceof Error ? error.message : String(error)),
          type: "error",
          duration: 2000,
        });
      }
    }
  } else {
    console.warn("没有可用的音频URL可下载");
    
    ElMessage({
      message: "没有可用的音频可下载",
      type: "warning",
      duration: 2000,
    });
  }
  
  setTimeout(() => {
    isDownloading.value = false;
  }, 1000);
};

// 设置格式类型
const setFormatType = (value) => {
  playerConfig.formatType = value;
    console.log('设置格式类型:', value);
};

// 处理音频Blob
const handleAudioBlob = (audioBlob) => {
  try {
    if (!audioBlob) {
      console.error('handleAudioBlob: 接收到无效的audioBlob');
      return null;
    }
    
    // 安全地访问全局currMp3Url引用
    let currMp3UrlRef = globalCurrMp3Url;
    
    // 如果全局引用不可用，尝试使用局部变量或创建新的
    if (!currMp3UrlRef || typeof currMp3UrlRef !== 'object' || !('value' in currMp3UrlRef)) {
      console.warn('handleAudioBlob: 全局currMp3Url引用无效，尝试其他方式');
      
      // 尝试使用store中的currMp3Url
      if (globalTtsStore && globalTtsStore.currMp3Url && 
          typeof globalTtsStore.currMp3Url === 'object' && 'value' in globalTtsStore.currMp3Url) {
        currMp3UrlRef = globalTtsStore.currMp3Url;
        console.log('handleAudioBlob: 使用store中的currMp3Url');
      } else {
        // 创建新的ref
        currMp3UrlRef = ref('');
        console.log('handleAudioBlob: 创建新的currMp3Url ref');
        
        // 更新全局引用和store
        globalCurrMp3Url = currMp3UrlRef;
        if (globalTtsStore) {
          globalTtsStore.currMp3Url = currMp3UrlRef;
        }
      }
    }
    
    // 安全地检查并释放旧的URL
    try {
      if (currMp3UrlRef.value && typeof currMp3UrlRef.value === 'string' && currMp3UrlRef.value.startsWith('blob:')) {
        URL.revokeObjectURL(currMp3UrlRef.value);
        console.log('handleAudioBlob: 已释放旧的blob URL');
      }
    } catch (err) {
      console.error('handleAudioBlob: 释放URL时出错:', err);
      // 继续执行，不中断主流程
    }

    // 创建新的URL
    const audioUrl = URL.createObjectURL(new Blob([audioBlob], { type: `audio/${playerConfig.formatType || 'mp3'}` }));
    console.log('handleAudioBlob: 创建了新的blob URL:', audioUrl);
    
    // 更新URL到全局引用和store
    if (currMp3UrlRef) {
      currMp3UrlRef.value = audioUrl;
      console.log('handleAudioBlob: 已更新currMp3Url值为:', audioUrl);
      
      // 确保所有引用指向同一个ref对象
      globalCurrMp3Url = currMp3UrlRef;
      if (globalTtsStore) {
        globalTtsStore.currMp3Url = currMp3UrlRef;
      }
    } else {
      console.warn('handleAudioBlob: currMp3UrlRef无效，无法更新全局引用');
    }
    
    return audioUrl;
  } catch (error) {
    console.error('handleAudioBlob: 处理音频Blob时出错:', error);
    
    // 尝试恢复 - 创建一个新的ref和URL
    try {
      const audioUrl = URL.createObjectURL(new Blob([audioBlob], { type: `audio/${playerConfig.formatType || 'mp3'}` }));
      const newRef = ref(audioUrl);
      
      // 更新所有引用
      globalCurrMp3Url = newRef;
      if (globalTtsStore) {
        globalTtsStore.currMp3Url = newRef;
      }
      
      console.log('handleAudioBlob: 重新创建了currMp3Url ref');
      return audioUrl;
    } catch (fallbackError) {
      console.error('handleAudioBlob: 备用处理也失败:', fallbackError);
      return null;
    }
  }
};


// 调整内容边距
const adjustContentMargins = () => {
  nextTick(() => {
    const isMobile = window.innerWidth <= 768;
    
    // 获取当前激活的内容区域
    let activeContent;
    
    if (page.value.asideIndex === '1') {
      // 文本转语音页面
      activeContent = document.querySelector('.input-area-card');
    } else if (page.value.asideIndex === '2') {
      // 批量处理页面
      activeContent = document.querySelector('.batch-area-card');
    } else if (page.value.asideIndex === '3') {
      // 设置页面
      activeContent = document.querySelector('.config-page-container');
    } else if (page.value.asideIndex === '4') {
      // 文档页面
      activeContent = document.querySelector('.doc-page-container');
    } else if (page.value.asideIndex === '5') {
      // 在线生成字幕页面
      activeContent = document.querySelector('.content-area');
    }

    if (activeContent) {
      if (isMobile) {
        // 移动端设置 - 不再设置marginTop，由CSS处理
        activeContent.style.paddingTop = '10px';
        activeContent.style.borderRadius = '0';
        activeContent.style.width = '100%';
        activeContent.style.maxWidth = '100%';
        activeContent.style.boxShadow = 'none';
        activeContent.style.border = 'none';
      } else {
        // PC端设置
        activeContent.style.marginTop = '0px';
        activeContent.style.paddingTop = '0';
        activeContent.style.borderRadius = 'var(--border-radius-large)';
        activeContent.style.width = '100%';
        activeContent.style.maxWidth = '1000px';
        activeContent.style.boxShadow = 'var(--shadow-medium)';
        activeContent.style.border = '1px solid var(--border-color)';
      }
    }
  });
};

// 导航变化处理函数
const handleNavChange = (index: string) => {
  console.log('导航变化:', index);
  if (index === '1') {
    // 文本转语音
    router.push('/');
  } else if (index === '2') {
    // 批量处理
    router.push('/');
  } else if (index === '6') {
    // 历史记录
    router.push('/history');
  }
};

// 处理错误操作
const handleErrorAction = (errorCode) => {
  console.log("处理错误操作, 错误码:", errorCode);
};

// 刷新连接
const handleRefreshConnection = async () => {
  console.log("刷新免费TTS服务连接");
};

const trimUrl = (field) => {
  if (config.value && config.value[field]) {
    config.value[field] = config.value[field].trim();
  }
};

// 主要的事件钩子需要在组件内部调用，这里只提供函数定义
// 组件内调用useMainSetup()获取数据和store

// 添加在文件末尾导出所有需要的内容
export {
  // 组件和库
  MainOptions,
  VoiceSelector,
  ConfigPage,
  Loading,
  FixedHeader,
  FreeTTSErrorDisplay,
  ElMessage,
  ElMessageBox,
  WebStore,
  
  // 图标
  MagicStick, 
  ChatLineSquare,
  Upload, 
  DeleteFilled, 
  CaretRight, 
  FolderOpened, 
  WarningFilled, 
  RefreshRight, 
  SwitchButton,
  Connection,
  ChatDotRound,
  Microphone,
  Setting,
  Avatar,
  InfoFilled,
  QuestionFilled,
  VideoCameraFilled,
  ArrowLeft,
  DocumentChecked,
  ShoppingCart,
  Download,
  
  // 状态和引用
  t,
  useMainSetup, // 导出setup函数
  docIframe,
  iframeLoaded,
  iframeError,
  iframeCurrentSrc,
  globalCurrMp3Url, // 添加导出globalCurrMp3Url变量
  
  // 其他状态
  isSSMLMode,
  isLoading,
  loadingTitle,
  loadingMessage,
  convertProgress,
  ssmlHelpVisible,
  showVoiceAnchorsDialog,
  openSettingsDrawer,
  dialogVisible,
  modalInput,
  dialogLoading,
  playerConfig,
  apiOptions,
  languageOptions,
  voiceSelectList,
  formatOptions,
  isDownloading,
  
  // 函数
  getChineseName,
  tryAlternativeUrl,
  handleIframeLoad,
  handleIframeError,
  reloadIframe,
  checkTTSServiceStatus,
  sendToChatGPT,
  handleDelete,
  fileChange,
  fileRemove,
  clearAll,
  playAudio,
  openInFolder,
  audition,
  apiChange,
  languageSelectChange,
  voiceSelectChange,
  startBtn,
  openSettingsPanel,
  onDrawerOpen,
  onDrawerClose,
  openVoiceAnchors,
  onSelectAnchor,
  openSSMLHelp,
  cancelConversion,
  goToTTS,
  openApiSite,
  download,
  setFormatType,
  handleNavChange,
  handleErrorAction,
  handleRefreshConnection,
  formatXML,
  updateSSML,
  handleAudioBlob,
  adjustContentMargins,
  getTTSData,
  initGlobalRefs,
  audioPlayerRef, // 导出audioPlayerRef以便组件可以绑定
  trimUrl,
  isAudioAvailable
};