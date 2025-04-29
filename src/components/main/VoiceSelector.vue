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
          <div class="voice-name">{{ voice.name }}</div>
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
import { ref, computed, onMounted } from 'vue';
import { ElIcon, ElInput, ElButton, ElMessage } from 'element-plus';
import { Search, CaretRight, Star } from '@element-plus/icons-vue';
import voiceCategories, { CategoryVoice, getVoiceAvatar, getLocaleName } from '@/global/voice-config';
import { useTtsStore } from '@/store/store';
import { storeToRefs } from 'pinia';
import { getTTSData } from '@/store/play';

const store = useTtsStore();
const { formConfig } = storeToRefs(store);

// 标签页配置
const tabs = voiceCategories;
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
};

// 更新相关设置
const updateRelatedSettings = (voice: CategoryVoice) => {
  // 如果有风格，设置默认风格为General
  if (voice.styles && voice.styles.length > 0) {
    formConfig.value.voiceStyleSelect = 'General';
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
  
  // 根据性别选择不同的颜色集
  let colors;
  if (voice.gender === 'Female') {
    colors = ['#FF2D55', '#FF9500', '#AF52DE', '#FF6B6B', '#FF85A2', '#FFC0CB'];
  } else {
    colors = ['#007AFF', '#5856D6', '#34C759', '#4285F4', '#34B7F1', '#0A84FF'];
  }
  
  // 基于名称获取稳定的色彩索引
  const nameHash = Array.from(voice.name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorIndex = nameHash % colors.length;
  const bgColor = colors[colorIndex].replace('#', '%23'); // 编码#号
  
  // 获取名称的首字母作为头像显示
  const letter = voice.name.charAt(0);
  
  // 生成SVG并确保正确编码
  return `data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="${bgColor}" /><text x="50" y="60" font-size="40" text-anchor="middle" fill="white" font-family="Arial, sans-serif">${letter}</text></svg>`;
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

// 获取语音描述
const getVoiceDescription = (voice: CategoryVoice) => {
  if (voice.description) return voice.description;
  
  let desc = '';
  if (voice.gender === 'Female') {
    desc += '女声';
  } else if (voice.gender === 'Male') {
    desc += '男声';
  }
  
  if (voice.locale) {
    desc = getLocaleName(voice.locale) + ' ' + desc;
  }
  
  return desc;
};

// 初始化时从本地存储加载收藏
onMounted(() => {
  const savedFavorites = localStorage.getItem('favoriteVoices');
  if (savedFavorites) {
    favorites.value = JSON.parse(savedFavorites);
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
}

.language-tab {
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
}

.language-tab.active {
  background-color: var(--el-color-primary);
  color: white;
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
}

.sub-filter {
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
  background-color: var(--el-fill-color-light);
}

.sub-filter.active {
  background-color: var(--el-color-primary-light-8);
  color: var(--el-color-primary);
}

.voice-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.voice-card {
  display: flex;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-light);
  transition: all 0.3s;
  cursor: pointer;
  background-color: var(--el-bg-color);
}

.voice-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: var(--el-color-primary-light-5);
}

.voice-card.selected {
  border-color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
}

.voice-avatar {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 12px;
  border: 2px solid var(--el-border-color);
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
}

.voice-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.voice-name {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.voice-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.voice-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: center;
}

.play-button,
.favorite-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: transparent;
  border: 1px solid var(--el-border-color);
  cursor: pointer;
  transition: all 0.3s;
}

.play-button:hover {
  background-color: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}

.favorite-button:hover {
  background-color: var(--el-color-danger-light-9);
  border-color: var(--el-color-danger);
  color: var(--el-color-danger);
}

.favorite-button .is-favorite {
  color: var(--el-color-danger);
}
</style> 