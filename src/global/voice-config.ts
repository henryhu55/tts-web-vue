// 语音分类和补充配置
import { voices } from "./voices";

// 语音分类接口
export interface VoiceCategory {
  id: string;
  name: string;
  label: string;
  voices: CategoryVoice[];
}

// 分类中使用的声音接口
export interface CategoryVoice {
  id: string;
  name: string;
  localName?: string;
  shortName: string;
  locale: string;
  gender: string;
  description?: string;
  isPro: boolean;
  styles?: string[];
  supportStyles?: boolean;
  avatar?: string;
}

// 转换原始voices数据为CategoryVoice格式
const mapVoiceToCategory = (voice: any): CategoryVoice => {
  const gender = voice.properties?.Gender || "Unknown";
  return {
    id: voice.id || voice.shortName,
    name:
      voice.properties?.DisplayName ||
      voice.shortName.split("-").pop().replace("Neural", ""),
    localName:
      voice.properties?.LocalName ||
      voice.shortName.split("-").pop().replace("Neural", ""),
    shortName: voice.shortName,
    locale: voice.locale,
    gender: gender,
    description: "",
    isPro: isPremiumVoice(voice.shortName),
    styles: getVoiceStyles(voice),
    supportStyles: getVoiceStyles(voice)?.length > 0,
  };
};

// 根据shortName判断是否为高级声音
const isPremiumVoice = (shortName: string): boolean => {
  const premiumVoices = [
    "en-US-AriaNeural",
    "en-US-GuyNeural",
    "en-GB-RyanNeural",
    "en-GB-SoniaNeural",
    "zh-CN-XiaoxiaoNeural",
    "zh-CN-YunxiNeural",
    "zh-CN-YunyangNeural",
  ];

  return (
    premiumVoices.includes(shortName) ||
    shortName.includes("(Pro)") ||
    shortName.includes("(Ultra)")
  );
};

// 获取声音支持的风格列表
const getVoiceStyles = (voice: any): string[] => {
  const voiceStylesStr = voice.properties?.VoiceStyleNames || "";
  if (!voiceStylesStr) return [];
  return voiceStylesStr
    .split(",")
    .map((style: string) => style.trim())
    .filter(Boolean);
};

// 根据原始数据生成分类声音
const generateCategoryVoices = () => {
  // 过滤并分类所有声音
  const allVoices = voices.map(mapVoiceToCategory);

  // 按语言和地区分类
  const zhVoices = allVoices.filter((v) => v.locale.startsWith("zh"));
  const enVoices = allVoices.filter((v) => v.locale.startsWith("en"));
  const otherVoices = allVoices.filter(
    (v) => !v.locale.startsWith("zh") && !v.locale.startsWith("en")
  );

  // 再细分英文声音
  const enUsVoices = enVoices.filter((v) => v.locale === "en-US");
  const enGbVoices = enVoices.filter((v) => v.locale === "en-GB");
  const enOtherVoices = enVoices.filter(
    (v) => v.locale !== "en-US" && v.locale !== "en-GB"
  );

  return {
    zhVoices,
    enUsVoices,
    enGbVoices,
    enOtherVoices,
    otherVoices,
  };
};

// 获取所有分类后的声音
const { zhVoices, enUsVoices, enGbVoices, enOtherVoices, otherVoices } =
  generateCategoryVoices();

// 补充其他声音 (如果微软接口中没有的)
const additionalVoices: CategoryVoice[] = [
  // 添加在图片中看到但在原数据中没有的声音
  {
    id: "custom-beth",
    name: "Beth",
    localName: "美式英文女声",
    shortName: "en-US-AnanyaNeural", // 根据UI显示选择一个可能的声音
    locale: "en-US",
    gender: "Female",
    description: "美式英文女声、咨询/对话",
    isPro: false,
  },
  {
    id: "custom-donna",
    name: "Donna",
    localName: "美式英文女声",
    shortName: "en-US-JennyNeural",
    locale: "en-US",
    gender: "Female",
    description: "美式英文女声、教育/培训",
    isPro: false,
  },
  {
    id: "custom-bert",
    name: "Bert",
    localName: "美式英文男声",
    shortName: "en-US-GuyNeural",
    locale: "en-US",
    gender: "Male",
    description: "美式英文男声、客服/对话",
    isPro: false,
  },
  {
    id: "custom-ariana",
    name: "Ariana",
    localName: "美式发音",
    shortName: "en-US-AriaNeural",
    locale: "en-US",
    gender: "Female",
    description: "美式发音、活力女声",
    isPro: false,
  },
  {
    id: "custom-andrew",
    name: "Andrew",
    localName: "美式男声",
    shortName: "en-US-AndrewNeural",
    locale: "en-US",
    gender: "Male",
    description: "美式男声、转换速度快、不支持功能标签",
    isPro: false,
  },
  {
    id: "custom-andrew-pro",
    name: "Andrew(Pro)",
    localName: "美式男声",
    shortName: "en-US-AndrewMultilingualNeural",
    locale: "en-US",
    gender: "Male",
    description: "美式男声、多情感",
    isPro: true,
  },
  {
    id: "custom-andrew-ultra",
    name: "Andrew(Ultra)",
    localName: "美式男声",
    shortName: "en-US-AndrewMultilingualNeural",
    locale: "en-US",
    gender: "Male",
    description: "美式男声、多情感、支持70多种语言",
    isPro: true,
  },
  {
    id: "custom-ryan-pro",
    name: "Ryan(Pro)",
    localName: "英式男声",
    shortName: "en-GB-RyanNeural",
    locale: "en-GB",
    gender: "Male",
    description: "英式男声、多情感",
    isPro: true,
  },
  {
    id: "custom-ryan-ultra",
    name: "Ryan(Ultra)",
    localName: "英式男声",
    shortName: "en-GB-RyanMultilingualNeural",
    locale: "en-GB",
    gender: "Male",
    description: "英式男声、支持70多种语音",
    isPro: true,
  },
  {
    id: "custom-sonia",
    name: "Sonia",
    localName: "英式女声",
    shortName: "en-GB-SoniaNeural",
    locale: "en-GB",
    gender: "Female",
    description: "英式女声、转换速度快、不支持功能标签",
    isPro: false,
  },
  {
    id: "custom-sonia-pro",
    name: "Sonia(Pro)",
    localName: "英式女声",
    shortName: "en-GB-SoniaNeural",
    locale: "en-GB",
    gender: "Female",
    description: "英式女声、多情感",
    isPro: true,
  },
  {
    id: "custom-thomas",
    name: "Thomas",
    localName: "英式男声",
    shortName: "en-GB-ThomasNeural",
    locale: "en-GB",
    gender: "Male",
    description: "英式男声、转换速度快、不支持功能标签",
    isPro: false,
  },
  {
    id: "custom-thomas-pro",
    name: "Thomas(Pro)",
    localName: "英式男声",
    shortName: "en-GB-ThomasNeural",
    locale: "en-GB",
    gender: "Male",
    description: "英式男声",
    isPro: true,
  },
  {
    id: "custom-ana",
    name: "Ana",
    localName: "美式女声",
    shortName: "en-US-AnaNeural",
    locale: "en-US",
    gender: "Female",
    description: "美式女声、转换速度快、不支持功能标签",
    isPro: false,
  },
  {
    id: "custom-ana-pro",
    name: "Ana(Pro)",
    localName: "年轻美式女声",
    shortName: "en-US-AnaNeural",
    locale: "en-US",
    gender: "Female",
    description: "年轻美式女声",
    isPro: true,
  },
  {
    id: "custom-aria",
    name: "Aria",
    localName: "美式女声",
    shortName: "en-US-AriaNeural",
    locale: "en-US",
    gender: "Female",
    description: "美式女声、转换速度快、不支持功能标签",
    isPro: false,
  },
  {
    id: "custom-aria-pro",
    name: "Aria(Pro)",
    localName: "美式女声",
    shortName: "en-US-AriaNeural",
    locale: "en-US",
    gender: "Female",
    description: "美式女声、多情感",
    isPro: true,
  },
  {
    id: "custom-ava",
    name: "Ava",
    localName: "美式女声",
    shortName: "en-US-AvaNeural",
    locale: "en-US",
    gender: "Female",
    description: "美式女声、转换速度快、不支持功能标签",
    isPro: false,
  },
  {
    id: "custom-ava-ultra",
    name: "Ava(Ultra)",
    localName: "美式女声",
    shortName: "en-US-AvaMultilingualNeural",
    locale: "en-US",
    gender: "Female",
    description: "美式女声、支持70多种语言",
    isPro: true,
  },
];

// 生成最终的声音分类
export const voiceCategories: VoiceCategory[] = [
  {
    id: "zh",
    name: "中文",
    label: "中文",
    voices: zhVoices,
  },
  {
    id: "en",
    name: "英文",
    label: "英文",
    voices: [
      ...enUsVoices,
      ...enGbVoices,
      ...enOtherVoices,
      ...additionalVoices.filter((v) => v.locale.startsWith("en")),
    ],
  },
  {
    id: "other",
    name: "其他语言",
    label: "其他语言",
    voices: otherVoices,
  },
];

// 声音风格描述
export const styleDescriptions: {
  [key: string]: { emoji: string; word: string };
} = {
  advertisement_upbeat: { emoji: "📢", word: "广告-活泼" },
  affectionate: { emoji: "😊", word: "亲切" },
  angry: { emoji: "😠", word: "愤怒" },
  assistant: { emoji: "🤖", word: "助手" },
  calm: { emoji: "😌", word: "平静" },
  chat: { emoji: "💬", word: "聊天" },
  cheerful: { emoji: "😄", word: "欢快" },
  customerservice: { emoji: "👩‍💼", word: "客服" },
  depressed: { emoji: "😔", word: "抑郁" },
  disgruntled: { emoji: "😒", word: "不满" },
  embarrassed: { emoji: "😳", word: "尴尬" },
  empathetic: { emoji: "🤗", word: "共情" },
  envious: { emoji: "😒", word: "羡慕" },
  excited: { emoji: "🤩", word: "兴奋" },
  fearful: { emoji: "😨", word: "恐惧" },
  friendly: { emoji: "🙂", word: "友好" },
  gentle: { emoji: "🤗", word: "温柔" },
  hopeful: { emoji: "🙏", word: "希望" },
  lyrical: { emoji: "🎵", word: "抒情" },
  "narration-professional": { emoji: "📚", word: "专业旁白" },
  "narration-relaxed": { emoji: "🧘", word: "放松旁白" },
  newscast: { emoji: "📰", word: "新闻播报" },
  "newscast-casual": { emoji: "📺", word: "随意新闻" },
  "newscast-formal": { emoji: "📺", word: "正式新闻" },
  sad: { emoji: "😢", word: "悲伤" },
  serious: { emoji: "😐", word: "严肃" },
  shouting: { emoji: "📣", word: "喊叫" },
  terrified: { emoji: "😱", word: "恐惧" },
  unfriendly: { emoji: "😠", word: "不友好" },
  whispering: { emoji: "🤫", word: "低语" },
  Default: { emoji: "🔤", word: "默认" },
  General: { emoji: "🔤", word: "通用" },
};

// 获取风格描述
export const getStyleDescription = (style: string) => {
  return styleDescriptions[style] || { emoji: "🔤", word: style };
};

// 根据声音标识获取头像
export const getVoiceAvatar = (voice: CategoryVoice) => {
  // 可以根据声音名称或性别返回默认头像
  if (voice.gender === "Female") {
    return "/avatars/female.png";
  } else {
    return "/avatars/male.png";
  }
};

// 根据本地化标识获取语言名称
export const getLocaleName = (locale: string): string => {
  const localeMap: { [key: string]: string } = {
    "zh-CN": "中文(简体)",
    "zh-TW": "中文(繁体)",
    "zh-HK": "中文(香港)",
    "en-US": "英语(美国)",
    "en-GB": "英语(英国)",
    "en-AU": "英语(澳大利亚)",
    "en-CA": "英语(加拿大)",
    "en-IN": "英语(印度)",
    "ja-JP": "日语(日本)",
    "ko-KR": "韩语(韩国)",
    "fr-FR": "法语(法国)",
    "fr-CA": "法语(加拿大)",
    "de-DE": "德语(德国)",
    "es-ES": "西班牙语(西班牙)",
    "es-MX": "西班牙语(墨西哥)",
    "it-IT": "意大利语(意大利)",
    "pt-BR": "葡萄牙语(巴西)",
    "pt-PT": "葡萄牙语(葡萄牙)",
    "ru-RU": "俄语(俄罗斯)",
    "ar-SA": "阿拉伯语(沙特阿拉伯)",
    "th-TH": "泰语(泰国)",
    "vi-VN": "越南语(越南)",
  };

  return localeMap[locale] || locale;
};

// 添加语气样式配置
export const voiceStyles = {
  "zh-CN": {
    XiaoxiaoNeural: [
      "Default",
      "chat",
      "newscast",
      "customerservice",
      "narration-professional",
      "newscast-casual",
      "newscast-formal",
      "cheerful",
      "angry",
      "sad",
      "fearful",
      "disgruntled",
      "serious",
      "gentle",
      "affectionate",
      "poetry-reading",
    ],
    YunxiNeural: [
      "Default",
      "calm",
      "gentle",
      "affectionate",
      "sad",
      "disgruntled",
      "angry",
      "fearful",
      "disgusted",
      "serious",
      "poetry-reading",
    ],
    YunyangNeural: [
      "Default",
      "calm",
      "gentle",
      "affectionate",
      "sad",
      "disgruntled",
      "angry",
      "fearful",
      "disgusted",
      "serious",
      "poetry-reading",
    ],
    XiaochenNeural: [
      "Default",
      "calm",
      "fearful",
      "cheerful",
      "disgruntled",
      "serious",
      "angry",
      "sad",
      "gentle",
      "affectionate",
      "poetry-reading",
    ],
    XiaohanNeural: [
      "Default",
      "calm",
      "fearful",
      "cheerful",
      "disgruntled",
      "serious",
      "angry",
      "sad",
      "gentle",
      "affectionate",
      "poetry-reading",
    ],
    XiaomengNeural: [
      "Default",
      "calm",
      "fearful",
      "cheerful",
      "disgruntled",
      "serious",
      "angry",
      "sad",
      "gentle",
      "affectionate",
      "poetry-reading",
    ],
    XiaomoNeural: [
      "Default",
      "calm",
      "fearful",
      "cheerful",
      "disgruntled",
      "serious",
      "angry",
      "sad",
      "gentle",
      "affectionate",
      "poetry-reading",
    ],
    XiaoqiuNeural: [
      "Default",
      "calm",
      "fearful",
      "cheerful",
      "disgruntled",
      "serious",
      "angry",
      "sad",
      "gentle",
      "affectionate",
      "poetry-reading",
    ],
    XiaoruiNeural: [
      "Default",
      "calm",
      "fearful",
      "cheerful",
      "disgruntled",
      "serious",
      "angry",
      "sad",
      "gentle",
      "affectionate",
      "poetry-reading",
    ],
    XiaoshuangNeural: [
      "Default",
      "calm",
      "fearful",
      "cheerful",
      "disgruntled",
      "serious",
      "angry",
      "sad",
      "gentle",
      "affectionate",
      "poetry-reading",
    ],
    XiaoxuanNeural: [
      "Default",
      "calm",
      "fearful",
      "cheerful",
      "disgruntled",
      "serious",
      "angry",
      "sad",
      "gentle",
      "affectionate",
      "poetry-reading",
    ],
    XiaoyanNeural: [
      "Default",
      "calm",
      "fearful",
      "cheerful",
      "disgruntled",
      "serious",
      "angry",
      "sad",
      "gentle",
      "affectionate",
      "poetry-reading",
    ],
    XiaoyiNeural: [
      "Default",
      "calm",
      "fearful",
      "cheerful",
      "disgruntled",
      "serious",
      "angry",
      "sad",
      "gentle",
      "affectionate",
      "poetry-reading",
    ],
    XiaozhenNeural: [
      "Default",
      "calm",
      "fearful",
      "cheerful",
      "disgruntled",
      "serious",
      "angry",
      "sad",
      "gentle",
      "affectionate",
      "poetry-reading",
    ],
    YunfengNeural: [
      "Default",
      "calm",
      "fearful",
      "cheerful",
      "disgruntled",
      "serious",
      "angry",
      "sad",
      "gentle",
      "affectionate",
      "poetry-reading",
    ],
    YunhaoNeural: [
      "Default",
      "calm",
      "fearful",
      "cheerful",
      "disgruntled",
      "serious",
      "angry",
      "sad",
      "gentle",
      "affectionate",
      "poetry-reading",
    ],
    YunjianNeural: [
      "Default",
      "calm",
      "fearful",
      "cheerful",
      "disgruntled",
      "serious",
      "angry",
      "sad",
      "gentle",
      "affectionate",
      "poetry-reading",
    ],
    YunxiaNeural: [
      "Default",
      "calm",
      "fearful",
      "cheerful",
      "disgruntled",
      "serious",
      "angry",
      "sad",
      "gentle",
      "affectionate",
      "poetry-reading",
    ],
    YunyeNeural: [
      "Default",
      "calm",
      "fearful",
      "cheerful",
      "disgruntled",
      "serious",
      "angry",
      "sad",
      "gentle",
      "affectionate",
      "poetry-reading",
    ],
    YunzeNeural: [
      "Default",
      "calm",
      "fearful",
      "cheerful",
      "disgruntled",
      "serious",
      "angry",
      "sad",
      "gentle",
      "affectionate",
      "poetry-reading",
    ],
  },
  "en-US": {
    JennyNeural: [
      "Default",
      "assistant",
      "chat",
      "customerservice",
      "newscast",
      "cheerful",
      "empathetic",
      "angry",
      "sad",
      "excited",
      "friendly",
      "terrified",
      "shouting",
      "unfriendly",
      "whispering",
      "hopeful",
    ],
    GuyNeural: [
      "Default",
      "newscast",
      "customerservice",
      "narration-professional",
      "newscast-casual",
    ],
    AriaNeural: [
      "Default",
      "chat",
      "customerservice",
      "narration-professional",
      "newscast-casual",
      "cheerful",
      "empathetic",
      "angry",
      "sad",
      "excited",
      "friendly",
      "terrified",
      "shouting",
      "unfriendly",
      "whispering",
      "hopeful",
    ],
    DavisNeural: [
      "Default",
      "chat",
      "customerservice",
      "narration-professional",
      "newscast-casual",
    ],
    TonyNeural: [
      "Default",
      "chat",
      "customerservice",
      "narration-professional",
      "newscast-casual",
    ],
    AnaNeural: [
      "Default",
      "chat",
      "customerservice",
      "narration-professional",
      "newscast-casual",
    ],
    AvaNeural: [
      "Default",
      "chat",
      "customerservice",
      "narration-professional",
      "newscast-casual",
    ],
    EmmaNeural: [
      "Default",
      "chat",
      "customerservice",
      "narration-professional",
      "newscast-casual",
    ],
    SaraNeural: [
      "Default",
      "chat",
      "customerservice",
      "narration-professional",
      "newscast-casual",
    ],
  },
};

// 导出分类后的声音列表
export default voiceCategories;
