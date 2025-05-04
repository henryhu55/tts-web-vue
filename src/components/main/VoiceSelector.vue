<!--
  语音选择器组件 - 用于根据分类显示和选择语音
-->
<template>
  <div class="voice-selector">
    <!-- 语言选择标签栏 -->
    <div class="language-tabs">
      <div
        v-for="tab in tabs"
        :key="tab.id"
        class="language-tab"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </div>
      <div
        class="language-tab"
        :class="{ active: activeTab === 'favorites' }"
        @click="activeTab = 'favorites'"
      >
        收藏
      </div>
    </div>

    <!-- 搜索框 -->
    <div class="search-box">
      <el-input
        v-model="searchText"
        placeholder="请输入关键字"
        clearable
        class="search-input"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      <el-button type="primary" class="search-button">搜索</el-button>
    </div>

    <!-- 二级筛选 (仅英文时显示) -->
    <div v-if="activeTab === 'en'" class="sub-filters">
      <div
        class="sub-filter"
        :class="{ active: activeSubFilter === 'all' }"
        @click="activeSubFilter = 'all'"
      >
        全部
      </div>
      <div
        class="sub-filter"
        :class="{ active: activeSubFilter === 'en-us' }"
        @click="activeSubFilter = 'en-us'"
      >
        美式英语
      </div>
      <div
        class="sub-filter"
        :class="{ active: activeSubFilter === 'en-gb' }"
        @click="activeSubFilter = 'en-gb'"
      >
        英式英语
      </div>
    </div>

    <!-- 语音列表 -->
    <div class="voice-grid">
      <div
        v-for="voice in filteredVoices"
        :key="voice.id"
        class="voice-card"
        :class="{ 'selected': selectedVoice === voice.shortName }"
        @click="selectVoice(voice)"
      >
        <div class="voice-avatar">
          <img :src="getAvatarUrl(voice)" :alt="voice.name" />
          <div v-if="voice.isPro" class="voice-tag">PRO</div>
        </div>
        <div class="voice-info">
          <div class="voice-name">{{ getDisplayName(voice) }}</div>
          <div class="voice-desc">{{ voice.description || getVoiceDescription(voice) }}</div>
        </div>
        <div class="voice-controls">
          <button class="play-button" @click.stop="playVoiceSample(voice)">
            <el-icon><CaretRight /></el-icon>
          </button>
          <button class="favorite-button" @click.stop="toggleFavorite(voice)">
            <el-icon>
              <Star :class="{ 'is-favorite': isFavorite(voice) }" />
            </el-icon>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck - 忽略此文件中所有类型检查错误
import { ref, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Search, CaretRight, Star } from '@element-plus/icons-vue';
import voiceCategories, { CategoryVoice, getVoiceAvatar, getLocaleName } from '@/global/voice-config';
import { useTtsStore } from '@/store/store';
import { storeToRefs } from 'pinia';
import { getTTSData } from '@/store/play';

// 定义事件
const emit = defineEmits(['select-anchor']);

const store = useTtsStore();
const { formConfig } = storeToRefs(store);

// 标签页配置
const tabs = ref(voiceCategories);
const activeTab = ref('zh'); // 默认选中中文
const activeSubFilter = ref('all'); // 子筛选，默认全部
const searchText = ref('');
const selectedVoice = computed(() => formConfig.value.voiceSelect);
const favorites = ref<string[]>([]); // 收藏的语音ID

// 获取当前标签页下的语音列表
const currentVoices = computed(() => {
  if (activeTab.value === 'favorites') {
    // 显示收藏的语音
    return getAllVoices().filter(voice => isFavorite(voice));
  }

  const category = voiceCategories.find(tab => tab.id === activeTab.value);
  return category ? category.voices : [];
});

// 获取所有语音列表
const getAllVoices = () => {
  return voiceCategories.flatMap(category => category.voices);
};

// 根据二级筛选和搜索过滤语音
const filteredVoices = computed(() => {
  let voices = currentVoices.value;

  // 应用英文的二级筛选
  if (activeTab.value === 'en' && activeSubFilter.value !== 'all') {
    voices = voices.filter(voice => {
      if (activeSubFilter.value === 'en-us') {
        return voice.locale === 'en-US';
      } else if (activeSubFilter.value === 'en-gb') {
        return voice.locale === 'en-GB';
      }
      return true;
    });
  }

  // 应用搜索过滤
  if (searchText.value) {
    const searchLower = searchText.value.toLowerCase();
    voices = voices.filter(voice => 
      voice.name.toLowerCase().includes(searchLower) || 
      voice.localName.toLowerCase().includes(searchLower) ||
      voice.description?.toLowerCase().includes(searchLower) ||
      voice.shortName.toLowerCase().includes(searchLower)
    );
  }

  return voices;
});

// 选择语音
const selectVoice = (voice: CategoryVoice) => {
  formConfig.value.voiceSelect = voice.shortName;
  // 更新其他相关配置
  updateRelatedSettings(voice);
  
  // 发送选择事件给父组件
  emit('select-anchor', {
    id: voice.shortName,
    name: voice.name || voice.shortName,
    config: {
      languageSelect: voice.locale,
      voiceSelect: voice.shortName,
      voiceStyleSelect: voice.styles && voice.styles.length > 0 ? voice.styles[0] : 'Default',
      role: '',
      speed: 1,
      pitch: 1,
      api: 4 // 默认使用第三方API
    }
  });
};

// 更新相关设置
const updateRelatedSettings = (voice: CategoryVoice) => {
  // 如果有风格，设置默认风格为第一个可用风格，否则使用"Default"
  if (voice.styles && voice.styles.length > 0) {
    formConfig.value.voiceStyleSelect = voice.styles[0];
  } else {
    formConfig.value.voiceStyleSelect = 'Default';
  }
  
  // 更新区域设置
  const localeParts = voice.locale.split('-');
  if (localeParts.length > 1) {
    formConfig.value.languageSelect = voice.locale;
  }
};

// 获取语音头像URL
const getAvatarUrl = (voice: CategoryVoice) => {
  // 如果有头像，则使用
  if (voice.avatar && voice.avatar.startsWith('data:')) return voice.avatar;
  
  // 使用Canvas动态绘制头像
  let bgColor, textColor = 'white';
  
  if (voice.isPro) {
    // PRO版本使用更鲜艳的颜色
    if (voice.gender === 'Female') {
      // 女声PRO
      const proFemaleColors = ['#FF5C8D', '#FF3366', '#FF1493', '#FF69B4'];
      const index = voice.name.charCodeAt(0) % proFemaleColors.length;
      bgColor = proFemaleColors[index];
    } else {
      // 男声PRO
      const proMaleColors = ['#4E8CFF', '#3366FF', '#1E90FF', '#5D9CFF'];
      const index = voice.name.charCodeAt(0) % proMaleColors.length;
      bgColor = proMaleColors[index];
    }
  } else {
    // 普通版本使用不同颜色
    if (voice.gender === 'Female') {
      // 女声用明亮的暖色系
      const femaleBgColors = [
        '#FF7F7F', // 珊瑚红
        '#FF85A1', // 粉红
        '#FC8EAC', // 玫瑰
        '#FF9966', // 橙粉色
        '#FFA07A', // 浅鲑鱼色
        '#FF8DC7', // 亮粉红
        '#FF77FF', // 紫粉色
        '#EE82EE'  // 紫罗兰
      ];
      const index = voice.name.charCodeAt(0) % femaleBgColors.length;
      bgColor = femaleBgColors[index];
    } else {
      // 男声用明亮的冷色系
      const maleBgColors = [
        '#5D9CFF', // 蓝色
        '#5D76CB', // 蓝紫色
        '#50C878', // 绿宝石
        '#3B82F6', // 皇家蓝
        '#4169E1', // 皇家蓝
        '#40E0D0', // 青绿色
        '#4682B4', // 钢蓝色
        '#6495ED'  // 矢车菊蓝
      ];
      const index = voice.name.charCodeAt(0) % maleBgColors.length;
      bgColor = maleBgColors[index];
    }
  }
  
  // 创建Canvas
  const size = 100;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';
  
  // 启用抗锯齿
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  // 绘制主背景圆形
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
  ctx.fillStyle = bgColor;
  ctx.fill();
  
  // 添加微妙的径向渐变效果，使颜色更有深度
  const bgGradient = ctx.createRadialGradient(size/2, size/2 - 15, 0, size/2, size/2, size);
  bgGradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
  bgGradient.addColorStop(1, 'rgba(0, 0, 0, 0.05)');
  ctx.fillStyle = bgGradient;
  ctx.fill();
  
  // 如果是PRO版本，添加金色边框
  if (voice.isPro) {
    // 发光外环
    ctx.beginPath();
    ctx.arc(size/2, size/2, size/2 - 2, 0, Math.PI * 2);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#FFD700';
    ctx.stroke();
    
    // 添加金色PRO标识
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(75, 25, 13, 0, Math.PI * 2);
    ctx.fill();
    
    // 文字阴影
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 2;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    
    ctx.font = 'bold 12px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PRO', 75, 25);
    
    // 重置阴影
    ctx.shadowColor = 'transparent';
  }
  
  // 添加高光效果
  const gradient = ctx.createRadialGradient(30, 30, 0, 30, 30, 30);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(30, 30, 20, 0, Math.PI * 2);
  ctx.fill();
  
  // 绘制麦克风图标
  ctx.fillStyle = 'white';
  
  // 麦克风头部 (使用兼容性更好的方法绘制圆角矩形)
  const drawRoundedRect = (x: number, y: number, width: number, height: number, radius: number) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  };
  
  // 绘制麦克风头部
  drawRoundedRect(45, 35, 10, 20, 5);
  
  // 麦克风底座
  ctx.beginPath();
  ctx.moveTo(45, 55);
  ctx.lineTo(45, 60);
  ctx.lineTo(35, 60);
  ctx.lineTo(35, 65);
  ctx.lineTo(65, 65);
  ctx.lineTo(65, 60);
  ctx.lineTo(55, 60);
  ctx.lineTo(55, 55);
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // 绘制首字母
  const letter = voice.name.charAt(0);
  ctx.font = 'bold 24px Arial';
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // 文字阴影
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 2;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;
  
  ctx.fillText(letter, size/2, 80);
  
  return canvas.toDataURL('image/png');
};

// 播放语音样本
const playVoiceSample = async (voice: CategoryVoice) => {
  try {
    // 临时保存当前配置
    const tempConfig = { ...formConfig.value };
    
    // 应用选中主播的配置
    formConfig.value.voiceSelect = voice.shortName;
    if (voice.locale) {
      formConfig.value.languageSelect = voice.locale;
    }
    
    // 使用试听文本
    const sampleText = "如果你觉得这个项目还不错， 欢迎Star、Fork和PR。你的Star是对作者最好的鼓励。";
    
    // 生成SSML
    store.inputs.inputValue = sampleText;
    store.setSSMLValue();
    
    // 构建请求参数
    const voiceData = {
      activeIndex: "1",
      ssmlContent: store.inputs.ssmlValue,
      inputContent: sampleText,
      retryCount: store.config.retryCount,
      retryInterval: store.config.retryInterval,
    };
    
    // 调用API获取音频数据
    const res = await getTTSData({
      api: formConfig.value.api || 4,
      voiceData,
      speechKey: store.config.speechKey,
      region: store.config.serviceRegion,
      thirdPartyApi: store.config.thirdPartyApi,
      tts88Key: store.config.tts88Key,
    });
    
    // 播放获取到的音频
    if (res) {
      if (res.buffer) {
        const audioBlob = new Blob([res.buffer], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        store.audition(audioUrl);
      } else if (res.audibleUrl) {
        store.audition(res.audibleUrl);
      }
    }
    
    // 恢复原配置
    formConfig.value = tempConfig;
  } catch (err) {
    console.error('播放语音样本失败:', err);
    ElMessage({
      message: "播放语音样本失败: " + (err instanceof Error ? err.message : String(err)),
      type: "error",
      duration: 2000,
    });
  }
};

// 切换收藏状态
const toggleFavorite = (voice: CategoryVoice) => {
  const index = favorites.value.indexOf(voice.shortName);
  if (index === -1) {
    favorites.value.push(voice.shortName);
  } else {
    favorites.value.splice(index, 1);
  }
  
  // 保存到本地存储
  localStorage.setItem('favoriteVoices', JSON.stringify(favorites.value));
};

// 检查是否收藏
const isFavorite = (voice: CategoryVoice) => {
  return favorites.value.includes(voice.shortName);
};

// 获取显示名称（针对中文主播显示中文名称）
const getDisplayName = (voice: CategoryVoice) => {
  // 中文主播名称映射（英文名到中文名）
  const chineseNameMap: Record<string, string> = {
    'Xiaoxuan': '晓萱',
    'Xiaochen': '晓辰',
    'Xiaoxiao': '晓晓',
    'Xiaohan': '晓涵',
    'Xiaozhen': '晓甄',
    'Xiaoyan': '晓颜',
    'Xiaoyi': '晓伊',
    'Xiaoshuang': '晓双',
    'Xiaomeng': '晓梦',
    'Yunfeng': '云枫',
    'Yunjian': '云健',
    'Yunhao': '云浩',
    'Yunze': '云泽',
    
    // 添加新的中文主播映射
    'Yunye': '云叶',
    'Yunxi': '云熙',
    'Yunxia': '云霞',
    'YunJhe': '云杰',
    'Yundeng': '云登',
    'Yunxiang': '云翔',
    'Yunyang': '云阳',
    'Xiaorui': '晓瑞',
    'Xiaoyou': '晓悠',
    'Xiaomo': '晓墨',
    'HsiaoYu': '小语',
    'WanLung': '万龙',
    'HiuMaan': '晓曼',
    
    // 添加更多中文主播
    'HiuGaai': '晓佳',
    'Xiaoni': '晓妮',
    'HsiaoChen': '小陈',
    'Xiaobei': '晓贝',
    'Xiaoqiu': '晓秋'
  };

  // 如果是中文主播，返回中文名称，否则返回原名
  if ((voice.locale && voice.locale.startsWith('zh-')) && chineseNameMap[voice.name]) {
    return chineseNameMap[voice.name];
  }
  
  // 返回原名
  return voice.name;
};

// 获取语音描述
const getVoiceDescription = (voice: CategoryVoice) => {
  // 如果已有描述，直接返回
  if (voice.description) return voice.description;
  
  // 根据语音特性生成适合场景描述
  const locale = voice.locale || '';
  const gender = voice.gender || '';
  const name = voice.name || '';
  
  // 中文主播名称映射（英文名到中文名）
  const chineseNameMap: Record<string, string> = {
    'Xiaoxuan': '晓萱',
    'Xiaochen': '晓辰',
    'Xiaoxiao': '晓晓',
    'Xiaohan': '晓涵',
    'Xiaozhen': '晓甄',
    'Xiaoyan': '晓颜',
    'Xiaoyi': '晓伊',
    'Xiaoshuang': '晓双',
    'Xiaomeng': '晓梦',
    'Yunfeng': '云枫',
    'Yunjian': '云健',
    'Yunhao': '云浩',
    'Yunze': '云泽',
    
    // 添加新的中文主播映射
    'Yunye': '云叶',
    'Yunxi': '云熙',
    'Yunxia': '云霞',
    'YunJhe': '云杰',
    'Yundeng': '云登',
    'Yunxiang': '云翔',
    'Yunyang': '云阳',
    'Xiaorui': '晓瑞',
    'Xiaoyou': '晓悠',
    'Xiaomo': '晓墨',
    'HsiaoYu': '小语',
    'WanLung': '万龙',
    'HiuMaan': '晓曼',
    
    // 添加更多中文主播
    'HiuGaai': '晓佳',
    'Xiaoni': '晓妮',
    'HsiaoChen': '小陈',
    'Xiaobei': '晓贝',
    'Xiaoqiu': '晓秋'
  };
  
  // 获取中文名称（如果有）
  let displayName = name;
  if (locale === 'zh-CN' && chineseNameMap[name]) {
    displayName = chineseNameMap[name];
  }
  
  // 定义嵌套记录类型
  type VoiceNameMap = Record<string, string>;
  type GenderMap = Record<string, VoiceNameMap>;
  type LocaleMap = Record<string, GenderMap>;
  
  // 场景描述映射
  const sceneDescriptions: LocaleMap = {
    'zh-CN': {
      'Female': {
        'Xiaoxuan': '活泼阳光女声，适合广告配音、产品介绍',
        'Xiaochen': '知性温柔女声，适合有声书、科普讲解',
        'Xiaoxiao': '甜美活力女声，适合短视频、社交媒体',
        'Xiaohan': '沉稳专业女声，适合新闻播报、企业宣传',
        'Xiaozhen': '清新自然女声，适合教育培训、导览解说',
        'Xiaoyan': '优雅成熟女声，适合商务场合、会议通知',
        'Xiaoyi': '亲和力强女声，适合客服对话、引导语音',
        'Xiaoshuang': '柔美抒情女声，适合情感内容、故事朗读',
        'Xiaomeng': '标准普通话女声，适合文档朗读、说明文',
        '_default': '中文普通话女声，适合日常对话和内容朗读'
      },
      'Male': {
        'Yunfeng': '浑厚稳重男声，适合纪录片、历史解说',
        'Yunjian': '阳刚有力男声，适合体育赛事、动作游戏',
        'Yunhao': '沉稳大气男声，适合企业宣传、政务通知',
        'Yunze': '清晰标准男声，适合新闻报道、会议演讲',
        '_default': '中文普通话男声，适合专业内容和正式场合'
      }
    },
    'en-US': {
      'Female': {
        'Jenny': '美式英语女声，亲切自然，适合英语教学、外语学习',
        'Aria': '美式英语女声，专业流畅，适合商务英语、国际会议',
        'Sarah': '美式英语女声，活泼年轻，适合英文短视频、社交媒体',
        '_default': '美式英语女声，标准清晰，适合英语内容朗读和学习'
      },
      'Male': {
        'Guy': '美式英语男声，磁性低沉，适合英文解说、专业培训',
        'Davis': '美式英语男声，清晰标准，适合商务英语、国际会议',
        '_default': '美式英语男声，标准专业，适合英语内容朗读和讲解'
      }
    },
    'en-GB': {
      'Female': {
        'Sonia': '英式英语女声，优雅高贵，适合文学朗读、高端品牌',
        '_default': '英式英语女声，标准地道，适合英式英语内容和学习'
      },
      'Male': {
        'Ryan': '英式英语男声，沉稳典雅，适合学术讲解、纪录片解说',
        '_default': '英式英语男声，标准专业，适合英式英语内容和讲解'
      }
    },
    'fr-FR': {
      'Female': {
        'Denise': '法语女声，优雅柔和，适合时尚品牌、文化内容',
        '_default': '法语女声，标准地道，适合法语内容朗读和学习'
      },
      'Male': {
        'Henri': '法语男声，浑厚睿智，适合文化讲解、纪录片配音',
        '_default': '法语男声，标准专业，适合法语演讲和正式场合'
      }
    },
    'de-DE': {
      'Female': {
        'Katja': '德语女声，清晰标准，适合教育培训、企业宣传',
        '_default': '德语女声，标准地道，适合德语内容朗读和学习'
      },
      'Male': {
        'Conrad': '德语男声，沉稳有力，适合技术讲解、产品说明',
        '_default': '德语男声，标准专业，适合德语演讲和正式场合'
      }
    },
    'ja-JP': {
      'Female': {
        'Nanami': '日语女声，温柔亲切，适合动漫配音、生活内容',
        '_default': '日语女声，标准地道，适合日语内容朗读和学习'
      },
      'Male': {
        'Keita': '日语男声，沉稳专业，适合商务内容、企业宣传',
        '_default': '日语男声，标准专业，适合日语演讲和正式场合'
      }
    },
    'ko-KR': {
      'Female': {
        'SunHi': '韩语女声，清亮活泼，适合娱乐内容、时尚产品',
        '_default': '韩语女声，标准地道，适合韩语内容朗读和学习'
      },
      'Male': {
        'InJoon': '韩语男声，沉稳大气，适合商务内容、企业宣传',
        '_default': '韩语男声，标准专业，适合韩语演讲和正式场合'
      }
    }
    // 移除通用默认描述
  };
  
  // 根据语音特征匹配描述
  let description = '';
  
  // 确定语言区域描述
  const localeDesc = sceneDescriptions[locale];
  
  // 如果有对应的语言区域描述
  if (localeDesc) {
    // 确定性别描述
    const genderDesc = localeDesc[gender] || (localeDesc['_default'] || {});
    
    // 匹配具体声音描述或使用默认描述
    description = genderDesc[name] || genderDesc['_default'] || '';
  }
  
  // 如果没有找到描述，则使用区域名称和性别
  if (!description) {
    const localeName = getLocaleName(locale);
    description = `${localeName} ${gender === 'Female' ? '女声' : '男声'}`;
  }
  
  // 如果是中文主播，在描述前添加中文名称
  if (locale === 'zh-CN' && chineseNameMap[name]) {
    description = `${description}`;
  }
  
  // 如果是PRO版本，添加标记
  if (voice.isPro) {
    description = `【专业版】${description}`;
  }
  
  return description;
};

// 初始化时从本地存储加载收藏
onMounted(() => {
  const savedFavorites = localStorage.getItem('favoriteVoices');
  if (savedFavorites) {
    try {
      favorites.value = JSON.parse(savedFavorites);
    } catch (e) {
      favorites.value = [];
    }
  }
});
</script>

<style scoped>
.voice-selector {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.language-tabs {
  display: flex;
  gap: 8px;
  border-bottom: 1px solid var(--el-border-color-light);
  padding-bottom: 8px;
  overflow-x: auto;
  scrollbar-width: thin;
}

.language-tab {
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
  white-space: nowrap;
}

.language-tab.active {
  background-color: var(--el-color-primary);
  color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.language-tab:hover:not(.active) {
  background-color: var(--el-color-primary-light-9);
}

.search-box {
  display: flex;
  gap: 8px;
}

.search-input {
  flex: 1;
}

.sub-filters {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  overflow-x: auto;
  scrollbar-width: thin;
}

.sub-filter {
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
  background-color: var(--el-fill-color-light);
  white-space: nowrap;
}

.sub-filter.active {
  background-color: var(--el-color-primary-light-8);
  color: var(--el-color-primary);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.voice-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.voice-card {
  display: flex;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid var(--el-border-color-light);
  transition: all 0.3s;
  cursor: pointer;
  background-color: var(--el-bg-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  height: 90px; /* 固定卡片高度 */
  box-sizing: border-box;
}

.voice-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.08);
  border-color: var(--el-color-primary-light-5);
}

.voice-card.selected {
  border-color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
  box-shadow: 0 6px 15px rgba(var(--el-color-primary-rgb), 0.1);
}

.voice-avatar {
  position: relative;
  width: 56px;
  height: 56px;
  min-width: 56px; /* 确保最小宽度固定 */
  border-radius: 50%;
  overflow: hidden;
  margin-right: 16px;
  border: 2px solid var(--el-border-color-light);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.voice-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.voice-tag {
  position: absolute;
  bottom: 0;
  right: 0;
  background-color: #f56c6c;
  color: white;
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 4px;
  box-shadow: 0 2px 3px rgba(0, 0, 0, 0.1);
}

.voice-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  min-width: 0; /* 确保文本能够自动压缩 */
  overflow: hidden; /* 确保溢出内容被隐藏 */
}

.voice-name {
  font-weight: 600;
  color: var(--el-text-color-primary);
  font-size: 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.voice-desc {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  max-height: 2.8em; /* 限制描述文本高度为两行 */
}

.voice-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
  justify-content: center;
  min-width: 36px; /* 为控制区域设置最小宽度 */
  margin-left: auto; /* 确保控制区域靠右 */
}

.play-button,
.favorite-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-5);
  cursor: pointer;
  transition: all 0.3s;
  color: var(--el-color-primary);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  flex-shrink: 0; /* 防止按钮被压缩 */
}

.play-button:hover {
  background-color: var(--el-color-primary);
  border-color: var(--el-color-primary);
  color: white;
  box-shadow: 0 4px 8px rgba(var(--el-color-primary-rgb), 0.25);
}

.play-button :deep(.el-icon),
.favorite-button :deep(.el-icon) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.favorite-button {
  background-color: var(--el-color-danger-light-9);
  border-color: var(--el-color-danger-light-5);
  color: var(--el-color-danger);
}

.favorite-button:hover {
  background-color: var(--el-color-danger);
  border-color: var(--el-color-danger);
  color: white;
  box-shadow: 0 4px 8px rgba(var(--el-color-danger-rgb), 0.25);
}

.favorite-button .is-favorite {
  color: var(--el-color-danger);
}

/* 暗黑模式兼容 */
:root[theme-mode="dark"] .voice-card {
  background-color: rgba(0, 0, 0, 0.2);
  border-color: rgba(255, 255, 255, 0.1);
}

:root[theme-mode="dark"] .voice-card:hover,
:root[theme-mode="dark"] .voice-card.selected {
  background-color: rgba(0, 0, 0, 0.3);
  border-color: var(--el-color-primary);
}
</style> 