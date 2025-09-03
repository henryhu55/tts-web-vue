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
import { useTtsStore, INPUT_MODE } from "@/store/store";
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
  
  // 简化currMp3Url的处理，确保类型一致性
  let currMp3Url;
  try {

    // 检查store中是否已有currMp3Url
    if (ttsStore.currMp3Url && typeof ttsStore.currMp3Url === 'string') {
      // 如果是字符串，创建ref包装
      currMp3Url = ref(ttsStore.currMp3Url);
    } else if (ttsStore.currMp3Url && typeof ttsStore.currMp3Url === 'object' && 'value' in ttsStore.currMp3Url) {
      // 如果已经是ref，直接使用
      currMp3Url = ttsStore.currMp3Url;
    } else {
      // 创建新的空ref
      currMp3Url = ref('');
    }

    // 更新全局引用
    globalCurrMp3Url = currMp3Url;

    // 确保store中的引用是最新的
    ttsStore.currMp3Url = currMp3Url.value; // store中保存字符串值
    console.log('useMainSetup: 已同步store.currMp3Url为:', currMp3Url.value);

  } catch (error) {
    console.error('初始化currMp3Url时出错:', error);
    currMp3Url = ref('');
    globalCurrMp3Url = currMp3Url;
  }
  
  // 获取配置对象
  const config = ref(ttsStore.config || {});
  // 获取表单配置
  const formConfig = ref(ttsStore.formConfig || {});
  
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
    uploadRef,
    audioPlayerRef,
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

  const ttsStore = useTtsStore();
  if (!ttsStore) {
    console.error('ttsStore未找到');
    return;
  }

  if (newValue && !oldValue) {
    // 从纯文本切换到SSML模式
    console.log('将纯文本转换为SSML');
    // 🔧 修复：同步更新store中的tabIndex状态
    ttsStore.page.tabIndex = INPUT_MODE.SSML;
    ttsStore.setSSMLValue("", true); // 强制更新SSML
    ttsStore.setInputValue(); // 使用store中的方法生成纯文本
    console.log('已设置tabIndex为SSML模式:', ttsStore.page.tabIndex);
  } else if (!newValue && oldValue) {
    // 从SSML切换到纯文本模式
    console.log('已切换到纯文本模式，保持现有纯文本内容');
    // 🔧 修复：同步更新store中的tabIndex状态
    ttsStore.page.tabIndex = INPUT_MODE.TEXT;
    console.log('已设置tabIndex为纯文本模式:', ttsStore.page.tabIndex);
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
      // nextTick(() => {
      //   // 发送初始化消息到iframe
      //   sendInitMessageToIframe();
      // });
      
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
  if (!row || !row.fileName) {
    console.warn("无效的行数据:", row);
    return;
  }
  
  try {
    // 获取新的store实例
    const ttsStore = useTtsStore();
    if (!ttsStore) {
      throw new Error("无法获取ttsStore实例");
    }
    
    console.log(`正在删除文件 ${row.fileName}`);
    
    // 找到文件索引
    const fileIndex = ttsStore.tableData.findIndex(item => 
      item.fileName === row.fileName);
    
    if (fileIndex === -1) {
      console.warn(`找不到文件 ${row.fileName}`);
      return;
    }
    
    // 创建新数组并删除文件
    const updatedTableData = [...ttsStore.tableData];
    updatedTableData.splice(fileIndex, 1);
    ttsStore.tableData = updatedTableData;
    
    // 如果uploadRef存在，从上传组件中移除文件
    if (uploadRef.value) {
      try {
        const uploadFiles = uploadRef.value.uploadFiles || [];
        const fileToRemove = uploadFiles.find(file => file.name === row.fileName);
        
        if (fileToRemove) {
          uploadRef.value.handleRemove(fileToRemove);
        }
      } catch (error) {
        console.warn("从上传组件移除文件失败:", error);
      }
    }
    
    console.log(`已删除文件 ${row.fileName}, 当前剩余 ${ttsStore.tableData.length} 个文件`);
    
    ElMessage({
      message: `已删除文件: ${row.fileName}`,
      type: "success",
      duration: 2000,
    });
  } catch (error) {
    console.error("删除文件时出错:", error);
    ElMessage({
      message: "删除文件时出错: " + (error instanceof Error ? error.message : String(error)),
      type: "error",
      duration: 2000,
    });
  }
};

// 文件更改处理
const fileChange = (uploadFile, uploadFiles) => {
  if (!uploadFile || !uploadFile.raw) {
    console.warn("文件无效:", uploadFile);
    ElMessage({
      message: "文件无效或格式不支持",
      type: "error",
      duration: 2000,
    });
    return;
  }
  
  console.log("处理文件:", uploadFile.name, uploadFile.size);
  
  // 读取文件内容
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      // 直接获取新的ttsStore实例，避免使用可能过期的globalTtsStore
      const ttsStore = useTtsStore();
      if (!ttsStore) {
        throw new Error("无法获取ttsStore实例");
      }
      
      // 检查ttsStore.tableData的状态
      console.log("添加文件前，检查ttsStore.tableData:");
      console.log(" - 类型:", typeof ttsStore.tableData);
      console.log(" - 是否为数组:", Array.isArray(ttsStore.tableData));
      console.log(" - 长度:", Array.isArray(ttsStore.tableData) ? ttsStore.tableData.length : "N/A");
      
      // 尝试获取完整的文件路径（如果可能）
      let filePath = uploadFile.name;
      
      // 按优先级检查不同的路径来源
      if (uploadFile.path) {
        // 首先使用显式提供的path属性
        filePath = uploadFile.path;
        console.log(`使用显式提供的路径: ${filePath}`);
      } else if (uploadFile.raw && uploadFile.raw.path) {
        // 然后检查raw文件是否有path
        filePath = uploadFile.raw.path;
        console.log(`使用raw文件的路径: ${filePath}`);
      } else if (window.electronAPI && typeof window.electronAPI.getSelectedFilePath === 'function') {
        // 最后尝试使用Electron API
        try {
          const electronPath = window.electronAPI.getSelectedFilePath(uploadFile.name);
          if (electronPath) {
            filePath = electronPath;
            console.log(`使用Electron API获取的路径: ${filePath}`);
          }
        } catch (pathError) {
          console.warn("获取Electron文件路径失败:", pathError);
        }
      }
      
      // 准备文件数据
      const newFile = {
        fileName: uploadFile.name,
        filePath: filePath,
        fileSize: (uploadFile.size / 1024).toFixed(2) + " KB",
        status: "ready",
        content: e.target.result,
        file: uploadFile.raw
      };
      
      // 确保tableData是数组
      if (!ttsStore.tableData) {
        console.log("tableData不存在，初始化为空数组");
        ttsStore.tableData = [];
      }
      
      // 为了确保是响应式更新，创建一个新数组
      const newTableData = Array.isArray(ttsStore.tableData) 
        ? [...ttsStore.tableData, newFile] 
        : [newFile];
      
      // 直接替换整个数组
      ttsStore.tableData = newTableData;
      
      console.log(`已添加文件 ${uploadFile.name}, 当前共有 ${ttsStore.tableData.length} 个文件`);
      
      // 为安全起见，尝试调用forceUpdate
      try {
        if (typeof ttsStore.forceUpdate === 'function') {
          ttsStore.forceUpdate();
          console.log("已执行forceUpdate");
          
          // 验证更新后的状态
          console.log("forceUpdate后检查tableData:");
          console.log(" - 长度:", ttsStore.tableData.length);
          console.log(" - 内容:", ttsStore.tableData[0]?.fileName);
        }
      } catch (error) {
        console.warn("调用forceUpdate失败", error);
      }
      
      ElMessage({
        message: `成功添加文件: ${uploadFile.name}`,
        type: "success",
        duration: 2000,
      });
    } catch (error) {
      console.error("处理文件时出错:", error);
      ElMessage({
        message: "处理文件时出错: " + (error instanceof Error ? error.message : String(error)),
        type: "error",
        duration: 2000,
      });
    }
  };
  
  reader.onerror = (error) => {
    console.error("读取文件内容失败:", error);
    ElMessage({
      message: "读取文件内容失败",
      type: "error",
      duration: 2000,
    });
  };
  
  // 开始读取文件内容
  reader.readAsText(uploadFile.raw);
};

// 文件移除处理
const fileRemove = (uploadFile, uploadFiles) => {
  console.log("文件已移除:", uploadFiles.length, "个剩余文件");
  
  // 如果没有提供文件名，无法继续
  if (!uploadFile || !uploadFile.name) {
    console.warn("文件移除: 没有提供文件名");
    return;
  }
  
  try {
    // 从表格数据中移除文件
    if (globalTtsStore && globalTtsStore.tableData) {
      // 检查是否为ref对象
      if (Array.isArray(globalTtsStore.tableData)) {
        const index = globalTtsStore.tableData.findIndex(item => item.fileName === uploadFile.name);
        if (index !== -1) {
          globalTtsStore.tableData.splice(index, 1);
          console.log("文件已从表格中移除:", uploadFile.name);
        }
      } else if (globalTtsStore.tableData.value) {
        const index = globalTtsStore.tableData.value.findIndex(item => item.fileName === uploadFile.name);
        if (index !== -1) {
          globalTtsStore.tableData.value.splice(index, 1);
          console.log("文件已从表格中移除:", uploadFile.name);
        }
      }
    } else {
      console.error("无法访问tableData，无法移除文件");
    }
  } catch (error) {
    console.error("移除文件时出错:", error);
  }
};

// 清除所有
const clearAll = () => {
  console.log("正在清空所有文件");
  
  try {
    // 获取新的store实例
    const ttsStore = useTtsStore();
    if (!ttsStore) {
      throw new Error("无法获取ttsStore实例");
    }
    
    // 设置为空数组（直接替换，而不是修改length）
    ttsStore.tableData = [];
    
    // 清除上传组件中的文件
    if (uploadRef.value) {
      try {
        uploadRef.value.clearFiles();
      } catch (error) {
        console.warn("清除上传组件文件失败:", error);
      }
    }
    
    console.log("已清空所有文件");
    
    ElMessage({
      message: "已清空所有文件",
      type: "success",
      duration: 2000,
    });
  } catch (error) {
    console.error("清空文件时出错:", error);
    ElMessage({
      message: "清空文件时出错: " + (error instanceof Error ? error.message : String(error)),
      type: "error",
      duration: 2000,
    });
  }
};

// 播放
const playAudio = (url: string, options = { autoplay: true }) => {
  console.log('统一播放函数被调用:', url);
  
  // 增强URL有效性检查（允许blob URL和有效的http/https URL）
  if (!url || url === '' ||
      url === 'null' ||
      url === 'undefined' ||
      (!url.startsWith('blob:') &&
       !url.startsWith('http://') &&
       !url.startsWith('https://') &&
       !url.startsWith('data:')) ||
      url === window.location.href) {
    console.warn('playAudio: 无效的音频URL:', url);
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
      
      // 更新全局ref
      if (globalCurrMp3Url && 'value' in globalCurrMp3Url) {
        const oldValue = globalCurrMp3Url.value;
        globalCurrMp3Url.value = url;
        console.log('已更新globalCurrMp3Url.value:', oldValue, '->', url);
      } else {
        console.warn('globalCurrMp3Url不可用或不是ref对象');
      }

      // 更新store中的字符串值
      if (globalTtsStore) {
        const oldValue = globalTtsStore.currMp3Url;
        globalTtsStore.currMp3Url = url;
        console.log('已更新store.currMp3Url:', oldValue, '->', url);
      } else {
        console.warn('globalTtsStore不可用');
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
const openInFolder = (file) => {
  console.log("在文件夹中打开:", file.fileName);
  
  if (!file || !file.filePath) {
    ElMessage({
      message: "找不到文件路径",
      type: "warning",
      duration: 2000,
    });
    return;
  }
  
  try {
    // 使用ElectronAPI打开文件所在的文件夹（如果在Electron环境中）
    if (window.electronAPI && typeof window.electronAPI.showItemInFolder === 'function') {
      window.electronAPI.showItemInFolder(file.filePath);
      console.log(`通过Electron打开文件夹: ${file.filePath}`);
    } 
    // 降级方案：提示用户
    else {
      ElMessage({
        message: "在网页版无法直接打开本地文件夹，请使用桌面版",
        type: "info",
        duration: 3000,
      });
    }
  } catch (error) {
    console.error("打开文件夹失败:", error);
    ElMessage({
      message: "打开文件夹失败: " + (error instanceof Error ? error.message : String(error)),
      type: "error",
      duration: 2000,
    });
  }
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
  
  // 确保value是有效值，默认为5(免费服务)
  const apiValue = value !== undefined ? value : 5;
  
  // 当切换到免费TTS服务(API=5)时，自动检查并显示免费额度
  if (apiValue === 5) {
    const localTTSStore = useFreeTTSstore();
    if (localTTSStore) {
      // 确保免费TTS服务已启用
      if (!localTTSStore.config.enabled) {
        localTTSStore.config.enabled = true;
        localTTSStore.saveConfig();
      }
      
      // 检查连接并获取免费额度信息
      localTTSStore.checkServerConnection().then(connected => {
        if (connected) {
          console.log("已连接到免费TTS服务");
          // 获取并显示免费额度信息
          localTTSStore.getFreeLimitInfo().then(freeLimit => {
            if (freeLimit) {
              console.log("获取到免费额度信息:", freeLimit);
            }
          });
        } else {
          console.error("无法连接到免费TTS服务");
        }
      });
    }
  }
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

  const ttsStore = useTtsStore();
  if (ttsStore) {
    ttsStore.setSSMLValue(); // 使用store中的方法生成SSML
    ttsStore.setInputValue(); // 使用store中的方法生成纯文本
  }
  
  // 验证有转换内容
  if (!globalInputs.value?.inputValue && !globalInputs.value?.ssmlValue) {
    ElMessage({
      message: "请先输入要转换的文本",
      type: "warning",
      duration: 2000,
    });
    return;
  }
  
  // 获取当前API类型，默认为5(免费服务)
  const currentApi = globalFormConfig.value?.api !== undefined ? globalFormConfig.value.api : 5;
  
  //额度检查放在API层面做，现在显示加载界面并开始转换
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
    if (currentApi === 5) {
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
      api: currentApi, // 使用前面定义的currentApi变量
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
        
        // 创建一个新的ref对象，确保类型一致性
        const newUrlRef = ref(audioUrl);
        
        // 直接替换store中的引用，不尝试修改现有对象
        globalTtsStore.currMp3Url = newUrlRef;
        
        // 同步到全局变量
        globalCurrMp3Url = newUrlRef;

        // 不需要手动调用playAudio，Vue的响应式系统会自动处理播放
        // updateAudioSrc会通过watch监听器自动触发
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
  try {
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
    
    // 检查URL是否有效
    // 1. 必须存在且不为空
    if (!audioUrl || audioUrl === '') {
      return false;
    }
    
    // 2. 不能是默认的服务器地址或空值
    if (audioUrl.endsWith('127.0.0.1:3344') || 
        audioUrl.endsWith('localhost:3344') ||
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
  } catch (e) {
    console.error('检查音频可用性时出错:', e);
    return false;
  }
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
    if (audioUrl.endsWith('127.0.0.1:3344') || 
        audioUrl.endsWith('localhost:3344') ||
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
  
  // 获取localTTSStore实例
  const localTTSStore = useFreeTTSstore();
  if (!localTTSStore) {
    console.error("无法获取localTTSStore实例");
    return;
  }
  
  try {
    // 重置错误状态
    localTTSStore.resetErrorState();
    
    // 检查连接
    const connected = await localTTSStore.checkServerConnection();
    
    if (connected) {
      // 连接成功，获取额度信息
      const freeLimit = await localTTSStore.getFreeLimitInfo();
      
      if (freeLimit) {
        console.log("刷新成功，获取到免费额度信息:", freeLimit);
        ElMessage({
          message: '已成功刷新免费TTS服务额度信息',
          type: 'success',
          duration: 2000
        });
      }
    } else {
      ElMessage({
        message: '无法连接到免费TTS服务，请检查网络连接',
        type: 'error',
        duration: 3000
      });
    }
  } catch (error) {
    console.error('刷新免费TTS服务连接失败:', error);
    ElMessage({
      message: '刷新免费TTS服务连接失败',
      type: 'error',
      duration: 3000
    });
  }
};

const trimUrl = (field) => {
  if (config.value && config.value[field]) {
    config.value[field] = config.value[field].trim();
  }
};

// 批量转换
const batchConvert = async () => {
  console.log("开始批量转换");
  
  try {
    // 确保获取当前的formConfig配置
    if (!globalFormConfig || !globalFormConfig.value) {
      console.error("无法获取表单配置");
      ElMessage.error("无法获取表单配置，请刷新页面重试");
      return;
    }
    
    // 获取当前formConfig的本地引用，避免后续直接使用全局变量
    const currentFormConfig = globalFormConfig.value;
    
    // 获取待处理文件列表
    const tableData = Array.isArray(globalTtsStore.tableData) 
      ? globalTtsStore.tableData 
      : (globalTtsStore.tableData.value || []);
    
    // 检查是否有文件需要处理
    const filesToProcess = tableData.filter(file => file.status === "ready");
    if (filesToProcess.length === 0) {
      ElMessage({
        message: "没有可转换的文件",
        type: "warning",
        duration: 2000,
      });
      return;
    }
    
    // 显示加载状态
    isLoading.value = true;
    loadingTitle.value = "批量转换中";
    loadingMessage.value = "正在处理文件...";
    
    // 总文件数
    const totalFiles = filesToProcess.length;
    let processedFiles = 0;
    
    // 开始处理文件
    for (const file of filesToProcess) {
      try {
        // 更新加载消息
        loadingMessage.value = `正在处理 ${file.fileName} (${processedFiles + 1}/${totalFiles})`;
        
        // 更新进度
        convertProgress.value = Math.floor((processedFiles / totalFiles) * 100);
        
        // 获取文件内容
        const content = file.content || "";
        
        if (!content) {
          console.warn(`文件 ${file.fileName} 没有内容，跳过`);
          processedFiles++;
          continue;
        }
        
        // 调用TTS API
        const result = await getTTSData({
          api: currentFormConfig.api || 5,
          voiceData: {
            activeIndex: "0", // 使用普通文本模式
            ssmlContent: "", // 批量处理不使用SSML
            inputContent: content,
            retryCount: 3,
            retryInterval: 1000
          },
          speechKey: globalConfig.value?.speechKey || "",
          region: globalConfig.value?.serviceRegion || "",
          thirdPartyApi: globalConfig.value?.thirdPartyApi || "",
          tts88Key: globalConfig.value?.tts88Key || ""
        });
        
        if (result && result.audibleUrl) {
          // 更新文件状态
          file.status = "done";
          file.audioUrl = result.audibleUrl;
          
          console.log(`文件 ${file.fileName} 转换成功`);
          
          // 添加到历史记录
          addToHistory(file, result.audibleUrl);
        } else if (result && result.buffer) {
          // 如果有buffer而没有URL，创建blob URL
          const audioBlob = new Blob([result.buffer], { type: 'audio/mpeg' });
          const audioUrl = URL.createObjectURL(audioBlob);
          
          // 更新文件状态
          file.status = "done";
          file.audioUrl = audioUrl;
          
          console.log(`文件 ${file.fileName} 转换成功，创建了本地Blob URL`);
          
          // 添加到历史记录
          addToHistory(file, audioUrl);
        } else {
          console.error(`文件 ${file.fileName} 转换失败: 没有返回音频数据`);
          // 不修改状态，保持为ready以便重试
        }
      } catch (error) {
        console.error(`文件 ${file.fileName} 转换出错:`, error);
        // 不修改状态，保持为ready以便重试
      } finally {
        // 更新已处理文件数
        processedFiles++;
      }
      
      // 添加短暂延迟，避免API请求过于频繁
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // 更新表格数据
    if (Array.isArray(globalTtsStore.tableData)) {
      // 直接修改了引用，不需要额外操作
    } else if (globalTtsStore.tableData.value) {
      // 触发响应式更新
      globalTtsStore.tableData.value = [...globalTtsStore.tableData.value];
    }
    
    // 隐藏加载状态
    isLoading.value = false;
    convertProgress.value = 0;
    
    // 显示完成消息
    const successCount = tableData.filter(file => file.status === "done").length;
    ElMessage({
      message: `批量转换完成，成功转换 ${successCount}/${totalFiles} 个文件`,
      type: successCount > 0 ? "success" : "warning",
      duration: 3000,
    });
    
  } catch (error) {
    console.error("批量转换出错:", error);
    
    // 隐藏加载状态
    isLoading.value = false;
    convertProgress.value = 0;
    
    // 显示错误消息
    ElMessage({
      message: "批量转换失败: " + (error instanceof Error ? error.message : String(error)),
      type: "error",
      duration: 3000,
    });
  }
};

// 播放已转换的文件
const play = async (file) => {
  console.log("播放文件:", file.fileName);
  
  if (!file.audioUrl) {
    ElMessage({
      message: "该文件尚未转换或转换失败",
      type: "warning",
      duration: 2000,
    });
    return;
  }
  
  try {
    // 播放音频
    await playAudio(file.audioUrl);
    
    // 更新当前播放的URL
    if (globalCurrMp3Url && 'value' in globalCurrMp3Url) {
      globalCurrMp3Url.value = file.audioUrl;
    }
  } catch (error) {
    console.error("播放失败:", error);
    ElMessage({
      message: "播放失败: " + (error instanceof Error ? error.message : String(error)),
      type: "error",
      duration: 2000,
    });
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
  handleIframeLoad,
  handleIframeError,
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
  isAudioAvailable,
  batchConvert,
  play,
  downloadFile,  // 添加下载单个文件的函数
  editLocalFile,  // 添加编辑本地文件函数
  addToHistory  // 添加到历史记录的辅助函数
};

// 编辑本地文件
const editLocalFile = (file) => {
  console.log("编辑本地文件:", file.fileName);
  
  if (!file || !file.filePath) {
    ElMessage({
      message: "找不到文件路径",
      type: "warning",
      duration: 2000,
    });
    return;
  }
  
  try {
    // 使用ElectronAPI打开文件（如果在Electron环境中）
    if (window.electronAPI && typeof window.electronAPI.openLocalFile === 'function') {
      window.electronAPI.openLocalFile(file.filePath);
      console.log(`通过Electron打开文件: ${file.filePath}`);
    } 
    // 尝试使用File System Access API（现代浏览器）
    else if (window.showOpenFilePicker) {
      ElMessage({
        message: "在网页版无法直接编辑本地文件，请使用桌面版",
        type: "info",
        duration: 3000,
      });
    } 
    // 降级方案：提示用户
    else {
      ElMessage({
        message: "您的浏览器不支持直接编辑本地文件，请使用桌面版",
        type: "warning",
        duration: 3000,
      });
    }
  } catch (error) {
    console.error("打开文件编辑器失败:", error);
    ElMessage({
      message: "打开文件编辑器失败: " + (error instanceof Error ? error.message : String(error)),
      type: "error",
      duration: 2000,
    });
  }
};

// 下载单个文件
const downloadFile = (file) => {
  console.log("下载文件:", file.fileName);
  
  if (!file.audioUrl) {
    ElMessage({
      message: "该文件尚未转换或转换失败",
      type: "warning",
      duration: 2000,
    });
    return;
  }
  
  try {
    // 获取文件名（去掉扩展名）
    const fileName = file.fileName.replace(/\.[^/.]+$/, "");
    // 创建下载链接
    const a = document.createElement('a');
    a.href = file.audioUrl;
    a.download = `${fileName}.${playerConfig.formatType || 'mp3'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    ElMessage({
      message: `开始下载文件: ${fileName}.${playerConfig.formatType || 'mp3'}`,
      type: "success",
      duration: 2000,
    });
  } catch (error) {
    console.error("下载文件失败:", error);
    ElMessage({
      message: "下载失败: " + (error instanceof Error ? error.message : String(error)),
      type: "error",
      duration: 2000,
    });
  }
};

// 添加文件到历史记录的辅助函数
const addToHistory = async (file, audioUrl) => {
  if (!globalTtsStore || !globalTtsStore.addHistoryRecord) {
    console.warn('globalTtsStore.addHistoryRecord未定义，无法添加到历史记录');
    return false;
  }
  
  try {
    // 获取文件内容（作为文本记录）
    const textContent = file.content || file.fileName;
    
    // 获取当前语音配置
    const currentVoice = globalFormConfig.value?.voiceSelect || 'zh-CN-XiaoxiaoNeural';
    
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
    
    // 创建历史记录对象
    const historyRecord = {
      text: textContent.length > 100 ? textContent.substring(0, 100) + '...' : textContent,
      url: audioUrl,
      voiceName: currentVoice,
      audioData: audioData,  // 添加音频数据
      fileName: file.fileName // 保存原始文件名
    };
    
    console.log('保存历史记录:', historyRecord.text.substring(0, 30) + '...');
    const success = globalTtsStore.addHistoryRecord(historyRecord);
    console.log('历史记录保存' + (success ? '成功' : '失败'));
    return success;
  } catch (err) {
    console.error('添加到历史记录失败:', err);
    return false;
  }
};