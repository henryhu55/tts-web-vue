import i18n from '@/assets/i18n/i18n';
import { voices } from './voices';
import WebStore from '@/store/web-store';

const store = new WebStore();
const { t } = i18n.global;

export default async function initStore() {
  try {
    // Web版本直接使用预定义的voices数据
    localStorage.setItem("msVoicesList", JSON.stringify(voices));
  } catch (error) {
    console.error("初始化语音列表失败:", error);
    // 如果localStorage的msVoicesList为空
    if (localStorage.getItem("msVoicesList") == null) {
      localStorage.setItem("msVoicesList", JSON.stringify(voices));
    }
  }
  const locale = i18n.global.locale.value;

  const formConfigDefault = {
    es: {
      languageSelect: "es-MX",
      voiceSelect: "es-MX-DaliaNeural",
      voiceStyleSelect: "Default",
      role: "",
      speed: 1.0,
      pitch: 1.0,
      api: 4, // 使用TTS88 API
    },
    en: {
      languageSelect: "en-US",
      voiceSelect: "en-US-JennyNeural",
      voiceStyleSelect: "Default",
      role: "",
      speed: 1.0,
      pitch: 1.0,
      api: 4, // 使用TTS88 API
    },
    zh: {
      languageSelect: "zh-CN",
      voiceSelect: "zh-CN-XiaoxiaoNeural",
      voiceStyleSelect: "Default",
      role: "",
      speed: 1.0,
      pitch: 1.0,
      api: 4, // 使用TTS88 API
    },
  };

  store.set("FormConfig.默认", formConfigDefault[locale]);
  
  if (!store.get("audition")) {
    store.set(
      "audition",
      t("initialLocalStore.audition")
    );
  }
  if (!store.get("language")) {
    store.set("language", locale);
  }
  if (!store.get("autoplay")) {
    store.set("autoplay", true);
  }
  if (!store.get("updateNotification")) {
    store.set("updateNotification", true);
  }
  if (!store.get("titleStyle")) {
    store.set("titleStyle", true);
  }
  if (!store.get("speechKey")) {
    store.set("speechKey", "");
  }
  if (!store.get("serviceRegion")) {
    store.set("serviceRegion", "");
  }
  if (!store.get("disclaimers")) {
    store.set("disclaimers", false);
  }
  if (!store.get("retryCount")) {
    store.set("retryCount", 3);
  }
  if (!store.get("retryInterval")) {
    store.set("retryInterval", 1);
  }
  if (!store.get("thirdPartyApi")) {
    store.set("thirdPartyApi", "");
  }
  if (!store.get("tts88Key")) {
    store.set("tts88Key", "");
  }
  // 初始化OpenAI相关配置
  if (!store.get("openAIKey")) {
    store.set("openAIKey", "");
  }
  if (!store.get("gptModel")) {
    store.set("gptModel", "gpt-3.5-turbo");
  }
  if (!store.get("openAIBaseUrl")) {
    store.set("openAIBaseUrl", "");
  }
}
