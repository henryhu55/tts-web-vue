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

import { ref, watch, onMounted, nextTick, onUnmounted, reactive } from "vue";
import { useTtsStore } from "@/store/store";
import { useFreeTTSstore, FreeTTSErrorType } from "@/store/play";
import { storeToRefs } from "pinia";
// 从store/play导入getTTSData
import { getTTSData } from "@/store/play";
import Loading from "../components/main/Loading.vue";  // 添加Loading组件引用
import FixedHeader from "../components/header/FixedHeader.vue";  // 添加这一行
import FreeTTSErrorDisplay from '../components/main/FreeTTSErrorDisplay.vue'; // 导入FreeTTSErrorDisplay组件
import { getChineseName } from '@/voice-utils'; // 导入getChineseName函数

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
    
    // 确保currMp3Url是一个ref对象
    if (!ttsStore.currMp3Url) {
      console.warn('ttsStore中缺少currMp3Url属性，创建空值');
      ttsStore.currMp3Url = ref('');
    } else if (typeof ttsStore.currMp3Url === 'string') {
      const oldValue = ttsStore.currMp3Url;
      ttsStore.currMp3Url = ref(oldValue);
      console.log('将currMp3Url从字符串转换为ref对象');
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
  
  const currMp3Url = ttsStore.currMp3Url || ref("");
  
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
const audioPlayerRef = ref(null);
const drawerOptions = ref(null);
const showModal = ref(false);
const uploadRef = ref();

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
const play = (val) => {
  console.log("播放音频:", val);
};

// 在文件夹中打开
const openInFolder = (val) => {
  console.log("在文件夹中打开:", val);
};

// 试听
const audition = async (value) => {
  console.log("试听:", value);
  
  // 检查是否有有效的音频URL
  if (!value) {
    console.warn('试听失败: 无有效的音频URL');
    return;
  }
  
  // 尝试播放音频
  try {
    // 处理audioPlayerRef
    if (audioPlayerRef.value) {
      console.log('使用audioPlayerRef播放:', value);
      audioPlayerRef.value.src = value;
      audioPlayerRef.value.load();
      let playPromise = audioPlayerRef.value.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('音频播放成功');
          })
          .catch(error => {
            console.error('音频播放失败:', error);
    ElMessage({
              message: "播放失败: " + error.message,
              type: "warning",
      duration: 2000,
    });
          });
      }
    } else if (globalTtsStore && globalTtsStore.audioPlayer && globalTtsStore.audioPlayer.value) {
      // 使用全局audio元素
      console.log('使用全局audioPlayer播放:', value);
      globalTtsStore.audioPlayer.value.src = value;
      globalTtsStore.audioPlayer.value.load();
      globalTtsStore.audioPlayer.value.play().catch(error => {
        console.error('全局audio播放失败:', error);
    });
  } else {
      // 创建临时audio元素
      console.log('创建临时audio元素播放:', value);
      const audio = new Audio(value);
      audio.play().catch(error => {
        console.error('临时audio播放失败:', error);
      });
    }
  } catch (error) {
    console.error('音频播放时发生异常:', error);
    ElMessage({
      message: "播放失败: " + error.message,
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
    // 验证有转换内容
    if (!globalInputs.value?.inputValue && !globalInputs.value?.ssmlValue) {
      throw new Error("请先输入要转换的文本");
    }
    
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
      // 将Buffer转换为Blob并创建URL
      const audioBlob = new Blob([result.buffer], { type: 'audio/mpeg' });
      audioUrl = URL.createObjectURL(audioBlob);
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
      // 设置音频播放URL - 检查类型并安全赋值
      console.log('准备设置currMp3Url:', audioUrl);
      console.log('globalTtsStore.currMp3Url类型:', typeof globalTtsStore.currMp3Url);
      
      try {
        // 检查是否是ref对象
        if (globalTtsStore.currMp3Url && 
            typeof globalTtsStore.currMp3Url === 'object' && 
            'value' in globalTtsStore.currMp3Url) {
          // 是ref对象，可以安全赋值
          globalTtsStore.currMp3Url.value = audioUrl;
          console.log('成功更新currMp3Url.value:', audioUrl);
        } else {
          // 不是ref对象，可能是字符串或其他类型，直接赋值
          globalTtsStore.currMp3Url = audioUrl;
          console.log('直接设置currMp3Url:', audioUrl);
        }
      } catch (err) {
        console.error('设置currMp3Url时出错:', err);
        // 备用方案:使用已导入的ref
        globalTtsStore.currMp3Url = ref(audioUrl);
        console.log('创建了新的currMp3Url ref');
      }
      
      // 尝试播放
      try {
        console.log('尝试播放生成的音频');
        
        // 不再重复设置currMp3Url，只检查DOM状态
        
        // 稍微延迟执行播放操作，确保DOM已经更新
        setTimeout(() => {
          // 先尝试使用页面中的audio元素
          if (audioPlayerRef.value) {
            console.log('找到audioPlayerRef元素，尝试播放');
            // 不需要再次设置src，因为已经通过绑定更新了
            if (audioPlayerRef.value.paused) {
              let playPromise = audioPlayerRef.value.play();
              
              if (playPromise !== undefined) {
                playPromise.catch(error => {
                  console.error('页面audio元素播放失败:', error);
                  // 只在真正失败时尝试其他方式
                  tryAlternativePlayback();
                });
              }
            } else {
              console.log('audioPlayerRef已经在播放中');
            }
          } else {
            console.log('未找到页面audio元素，尝试其他播放方式');
            // 没有找到页面audio元素，尝试其他方式播放
            tryAlternativePlayback();
          }
        }, 100);
        
        // 辅助函数：尝试替代播放方式
        function tryAlternativePlayback() {
          if (globalTtsStore.audioPlayer) {
            console.log('使用store中的audioPlayer播放');
            globalTtsStore.audioPlayer.src = audioUrl;
            globalTtsStore.audioPlayer.play().catch(error => {
              console.error('store audioPlayer播放失败:', error);
            });
          } else {
            console.log('创建新的Audio实例播放');
            // 创建一个新的Audio实例播放
            const tempAudio = new Audio(audioUrl);
            tempAudio.play().catch(err => {
              console.error('临时Audio实例播放失败:', err);
            });
            // 保存到store中
            globalTtsStore.audioPlayer = tempAudio;
          }
        }
      } catch (e) {
        console.error('播放尝试失败:', e);
      }
      
      // 成功提示
        ElMessage({
        message: "转换成功",
          type: "success",
          duration: 2000,
        });
        
      // 自动播放音频（无论配置如何）
      console.log('准备播放转换好的音频');
      // 延迟一点执行播放，确保UI已经更新
      setTimeout(() => {
        // 直接播放音频，不依赖config.autoplay设置
        if (audioPlayerRef.value) {
          console.log('使用audioPlayerRef播放音频');
          // 确保autoplay为true
          audioPlayerRef.value.autoplay = true;
          
          // 重置src并加载以触发自动播放
          const currentSrc = audioPlayerRef.value.src;
          audioPlayerRef.value.src = "";
          setTimeout(() => {
            audioPlayerRef.value.src = audioUrl;
            audioPlayerRef.value.load();
            audioPlayerRef.value.play().catch(err => {
              console.error('播放失败，尝试替代方法:', err);
              // 如果audioPlayerRef播放失败，尝试使用audition函数
              audition(audioUrl);
            });
          }, 50);
  } else {
          // 使用audition函数播放
          console.log('使用audition函数播放音频');
          audition(audioUrl);
        }
      }, 300);

      // 添加到历史记录表
      if (globalTtsStore.tableData) {
        // 确保tableData不为空且有value属性
        if (!globalTtsStore.tableData.value) {
          globalTtsStore.tableData.value = [];
          console.log('初始化tableData.value为空数组');
        }
        
        try {
          globalTtsStore.tableData.value.unshift({
            id: Date.now(),
            text: globalInputs.value.inputValue.substring(0, 30) + (globalInputs.value.inputValue.length > 30 ? '...' : ''),
            voiceName: globalFormConfig.value.voiceSelect,
            length: '刚刚',
            url: audioUrl,
            file: null
          });
          console.log('已添加记录到历史表');
        } catch (err) {
          console.error('添加到历史表失败:', err);
          // 错误不影响主流程，继续执行
        }
      } else {
        console.warn('globalTtsStore.tableData未定义，无法添加到历史记录');
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
    isLoading.value = false;
    convertProgress.value = 0;
    
    ElMessage({
      message: "转换失败: " + (error instanceof Error ? error.message : String(error)),
      type: "error",
      duration: 3000,
    });
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

// 下载
const download = () => {
  console.log("下载音频");
  isDownloading.value = true;
  
  // 获取当前的音频URL
  let audioUrl = '';
  
  // 检查全局store中的currMp3Url
  if (globalTtsStore && globalTtsStore.currMp3Url) {
    // 处理ref对象或字符串
    if (typeof globalTtsStore.currMp3Url === 'object' && 'value' in globalTtsStore.currMp3Url) {
      audioUrl = globalTtsStore.currMp3Url.value;
    } else {
      audioUrl = globalTtsStore.currMp3Url;
    }
  }
  
  // 确保有有效的URL
  if (audioUrl) {
    console.log("创建下载链接:", audioUrl);
    
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
  console.log("处理音频Blob");
  return "";
};

// 播放音频Blob
const playAudioBlob = (audioBlob) => {
  console.log("播放音频Blob");
};

// 调整内容边距
const adjustContentMargins = () => {
  console.log("调整内容边距");
};

// 处理导航更改
const handleNavChange = (nav) => {
  console.log("导航更改为:", nav);
  // 根据顶部导航更新侧边栏选中项
  if (nav === 'tts') {
    if (globalPage && globalPage.value) {
      globalPage.value.asideIndex = '1';
      console.log('已将侧边栏导航更新为: 1 (文本转语音)');
    } else {
      console.warn('globalPage未定义，无法更新侧边栏状态');
    }
  } else if (nav === 'docs') {
    if (globalPage && globalPage.value) {
      globalPage.value.asideIndex = '4';
      console.log('已将侧边栏导航更新为: 4 (文档)');
    } else {
      console.warn('globalPage未定义，无法更新侧边栏状态');
    }
  } else if (nav === 'subtitle') {
    if (globalPage && globalPage.value) {
      globalPage.value.asideIndex = '5';
      console.log('已将侧边栏导航更新为: 5 (在线生成字幕)');
    } else {
      console.warn('globalPage未定义，无法更新侧边栏状态');
    }
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
  play,
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
  playAudioBlob,
  adjustContentMargins,
  getTTSData,
  initGlobalRefs,
  audioPlayerRef // 导出audioPlayerRef以便组件可以绑定
};