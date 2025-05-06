<template>
  <div class="modern-options">
    <!-- 抽屉模式的完整选项 -->
    <div class="drawer-mode">
      <div class="option-section">
        <h3 class="section-title">基本选项</h3>
        <div class="option-grid">
          <!-- API选择 -->
          <div class="option-item">
            <div class="option-label">
              <span>API服务</span>
              <el-icon><Connection /></el-icon>
            </div>
            <el-select
              v-model="formConfig.api"
              size="default"
              class="full-width-select"
              @change="apiChange"
            >
              <el-option
                v-for="item in oc.apiSelect"
                :key="item.value"
                :label="item.value === 5 ? `${item.label} (推荐免费)` : item.value === 4 ? `${item.label} (无限制使用)` : item.label"
                :value="item.value"
              >
                <template v-if="item.value === 5">
                  <div class="free-api-option">
                    <span>{{ item.label }}</span>
                    <el-tag size="small" type="success" effect="dark">推荐免费</el-tag>
                  </div>
                </template>
                <template v-else-if="item.value === 4">
                  <div class="free-api-option">
                    <span>{{ item.label }}</span>
                    <el-tag size="small" type="info" effect="plain">无限制使用</el-tag>
                  </div>
                </template>
                <template v-else>
                  <span>{{ item.label }}</span>
                </template>
              </el-option>
            </el-select>

            <!-- 免费TTS服务信息卡片 -->
            <div v-if="formConfig.api === 5" class="free-tts-card">
              <div class="free-tts-header">
                <div class="header-left">
                  <el-tag size="small" type="success" effect="plain">无需API密钥</el-tag>
                  <span class="free-tts-title">免费TTS服务</span>
                </div>
                <div class="header-actions">
                  <el-radio-group v-model="currentView" size="small">
                    <el-radio-button label="quota">额度信息</el-radio-button>
                    <el-radio-button label="settings">高级配置</el-radio-button>
                  </el-radio-group>
                </div>
              </div>
              
              <div class="free-tts-content">
                <div class="free-service-highlight">
                  <el-icon color="#67C23A"><Check /></el-icon>
                  <span>推荐使用免费TTS服务，无需配置API密钥即可开始使用</span>
                </div>

                <!-- 额度信息视图 -->
                <div v-if="currentView === 'quota'" class="quota-info">
                  <div class="quota-header">
                    <h4>免费额度信息</h4>
                    <div class="quota-actions">
                      <el-button 
                        type="success" 
                        size="small" 
                        plain 
                        :loading="checkingConnection"
                        @click="handleCheckConnection"
                      >检查连接</el-button>
                      <el-button 
                        type="primary" 
                        size="small" 
                        plain 
                        @click="handleTestPlay"
                        :loading="isTestPlaying"
                      >测试播放</el-button>
                    </div>
                  </div>
                  <div class="quota-progress-wrapper">
                    <div class="quota-text-row">
                      <span class="quota-label">已使用: {{ localTTSStore.serverStatus.freeLimit?.used || 0 }} / {{ localTTSStore.serverStatus.freeLimit?.free_limit || 50000 }}</span>
                    </div>
                    <div class="progress-and-percentage">
                      <el-progress 
                        :percentage="((localTTSStore.serverStatus.freeLimit?.used || 0) / (localTTSStore.serverStatus.freeLimit?.free_limit || 50000) * 100)"
                        :format="(percentage) => ''"
                        :stroke-width="10"
                        :show-text="false"
                        :color="quotaProgressColor"
                        class="quota-progress"
                      />
                      <span class="quota-percentage">{{ ((localTTSStore.serverStatus.freeLimit?.used || 0) / (localTTSStore.serverStatus.freeLimit?.free_limit || 50000) * 100).toFixed(1) }}%</span>
                    </div>
                  </div>
                  <div class="quota-details">
                    <div class="quota-item">
                      <span class="label">剩余额度:</span>
                      <span class="value">{{ localTTSStore.serverStatus.freeLimit?.remaining || 0 }} 字符</span>
                    </div>
                    <div class="quota-item">
                      <span class="label">重置时间:</span>
                      <span class="value">{{ localTTSStore.serverStatus.freeLimit?.reset_date || '-' }}</span>
                    </div>
                  </div>
                </div>

                <!-- 高级配置视图 -->
                <div v-else class="settings-info">
                  <div class="settings-section">
                    <h4>服务配置</h4>
                    <div class="settings-item">
                      <span class="settings-label">服务地址</span>
                      <el-input 
                        v-model="localTTSStore.config.serverUrl" 
                        placeholder="请输入服务地址"
                        size="default"
                      />
                    </div>
                    <div class="settings-item">
                      <span class="settings-label">重试次数</span>
                      <el-input-number
                        v-model="localTTSStore.config.retryCount"
                        :min="0"
                        :max="5"
                        size="default"
                      />
                    </div>
                    <div class="settings-item">
                      <span class="settings-label">重试间隔(ms)</span>
                      <el-input-number
                        v-model="localTTSStore.config.retryInterval"
                        :min="1000"
                        :max="5000"
                        :step="500"
                        size="default"
                      />
                    </div>
                  </div>
                  
                  <div class="settings-section">
                    <h4>音频设置</h4>
                    <div class="settings-item">
                      <span class="settings-label">默认音频格式</span>
                      <el-select
                        v-model="localTTSStore.config.defaultAudioFormat"
                        size="default"
                      >
                        <el-option label="MP3" value="mp3" />
                        <el-option label="WAV" value="wav" />
                        <el-option label="OGG" value="ogg" />
                      </el-select>
                    </div>
                    <div class="settings-item">
                      <span class="settings-label">自动播放</span>
                      <el-switch
                        v-model="localTTSStore.config.autoPlay"
                      />
                    </div>
                  </div>

                  <div class="settings-actions">
                    <el-button type="primary" @click="saveAdvancedSettings">
                      保存设置
                    </el-button>
                  </div>
                </div>

                <div class="connection-status">
                  <el-tag v-if="localTTSStore.isConnected" size="small" type="success">
                    <el-icon><Check /></el-icon>
                    已连接到免费服务
                  </el-tag>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 语言选择 -->
          <div class="option-item">
            <div class="option-label">
              <span>语言</span>
              <el-icon><ChatDotRound /></el-icon>
            </div>
            <el-select
              v-model="formConfig.languageSelect"
              size="default"
              class="full-width-select"
              @change="languageSelectChange"
              filterable
            >
              <el-option
                v-for="item in oc.languageSelect"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>
          
          <!-- 声音选择 -->
          <div class="option-item full-width-item">
            <div class="option-label">
              <span>声音</span>
              <el-icon><Microphone /></el-icon>
            </div>
            <el-select
              v-model="formConfig.voiceSelect"
              size="default"
              class="full-width-select"
              @change="voiceSelectChange"
              filterable
            >
              <template v-if="formConfig.voiceSelect" #trigger>
                <div class="el-select__selection">
                  {{ getChineseName(formConfig.voiceSelect) || formConfig.voiceSelect }}
                </div>
              </template>
              <el-option
                v-for="item in voiceSelectList"
                :key="item.ShortName"
                :label="getChineseName(item.ShortName) || item.DisplayName"
                :value="item.ShortName"
              >
                <div class="voice-option">
                  <span>{{ getChineseName(item.ShortName) || item.DisplayName }}</span>
                  <el-button
                    size="small"
                    type="primary"
                    circle
                    @click.stop="audition(item.ShortName)"
                  ><el-icon><CaretRight /></el-icon></el-button>
                </div>
              </el-option>
            </el-select>
          </div>
        </div>
      </div>
      
      <div class="option-section">
        <h3 class="section-title">语音调整</h3>
        <div class="option-grid">
          <!-- 语速调节 -->
          <div class="option-item">
            <div class="option-label">
              <span>语速</span>
              <span class="value-display">{{ formConfig.speed }}x</span>
            </div>
            <el-slider 
              v-model="formConfig.speed" 
              :min="0.5" 
              :max="2" 
              :step="0.1" 
              class="option-slider"
            />
          </div>
          
          <!-- 音调调节 -->
          <div class="option-item">
            <div class="option-label">
              <span>音调</span>
              <span class="value-display">{{ formConfig.pitch }}x</span>
            </div>
            <el-slider 
              v-model="formConfig.pitch" 
              :min="0.5" 
              :max="2" 
              :step="0.1"
              class="option-slider"
            />
          </div>

          <!-- 音量调节 -->
          <div class="option-item">
            <div class="option-label">
              <span>音量设置</span>
              <el-select
                v-model="formConfig.volume"
                size="default"
                :placeholder="t('options.selectVolume')"
                class="full-width-select"
              >
                <el-option
                  v-for="item in ['default', 'extraWeak', 'weak', 'medium', 'strong', 'extraStrong']"
                  :key="item"
                  :label="t(`options.${item}`)"
                  :value="item"
                >
                  <div class="style-option">
                    <span>{{ t(`options.${item}`) }}</span>
                  </div>
                </el-option>
              </el-select>
            </div>
          </div>

          <!-- 情感强度调节 -->
          <div class="option-item">
            <div class="option-label">
              <span>情感强度</span>
              <el-select
                v-model="formConfig.intensity"
                size="default"
                :placeholder="t('options.selectIntensity')"
                class="full-width-select"
              >
                <el-option
                  v-for="item in ['default', 'weak', 'normal', 'strong', 'extraStrong']"
                  :key="item"
                  :label="t(`options.${item}`)"
                  :value="item"
                >
                  <div class="style-option">
                    <span>{{ t(`options.${item}`) }}</span>
                  </div>
                </el-option>
              </el-select>
            </div>
          </div>

          <!-- 静音时长 -->
          <div class="option-item">
            <div class="option-label">
              <span>静音时长</span>
              <el-select
                v-model="formConfig.silence"
                size="default"
                :placeholder="t('options.selectSilence')"
                class="full-width-select"
              >
                <el-option
                  v-for="item in ['default', '100ms', '200ms', '300ms', '500ms', '1s']"
                  :key="item"
                  :label="item === 'default' ? t('options.defaultSilence') : item"
                  :value="item"
                >
                  <div class="style-option">
                    <span>{{ item === 'default' ? t('options.defaultSilence') : item }}</span>
                  </div>
                </el-option>
              </el-select>
            </div>
          </div>
        </div>
      </div>
      
      <div class="option-section">
        <h3 class="section-title">高级语音设置</h3>
        <div class="option-grid">
          <!-- 风格选择 -->
          <div class="option-item">
            <div class="option-label">
              <span>{{ t('options.speakingStyle') }}</span>
              <el-icon><Mic /></el-icon>
            </div>
            <el-select
              v-model="formConfig.voiceStyleSelect"
              size="default"
              :placeholder="t('options.selectSpeakingStyle')"
              :disabled="apiEdge"
              class="full-width-select"
            >
              <el-option
                v-for="item in voiceStyleSelectList"
                :key="item"
                :label="getStyleDes(item)?.word || item"
                :value="item"
              >
                <div class="style-option">
                  <span class="style-emoji">{{ getStyleDes(item)?.emoji }}</span>
                  <span>{{ getStyleDes(item)?.word || item }}</span>
                </div>
              </el-option>
            </el-select>
          </div>
          
          <!-- 角色选择 -->
          <div class="option-item">
            <div class="option-label">
              <span>{{ t('options.rolePlaying') }}</span>
              <el-icon><UserFilled /></el-icon>
            </div>
            <template v-if="rolePlayList.length > 0 && rolePlayList[0] !== ''">
              <el-select 
                v-model="formConfig.role" 
                size="default"
                :placeholder="t('options.selectRole')" 
                :disabled="apiEdge"
                class="full-width-select"
              >
                <el-option
                  v-for="item in rolePlayList"
                  :key="item"
                  :label="getRoleDes(item)?.word || item"
                  :value="item"
                >
                  <div class="style-option">
                    <span class="style-emoji">{{ getRoleDes(item)?.emoji }}</span>
                    <span>{{ getRoleDes(item)?.word || item }}</span>
                  </div>
                </el-option>
              </el-select>
              <div class="role-support-hint">
                <el-icon color="#67C23A"><CircleCheckFilled /></el-icon>
                <span>当前主播支持{{ rolePlayList.length }}种角色切换</span>
              </div>
            </template>
            <template v-else>
              <el-select 
                disabled
                size="default"
                placeholder="当前主播不支持角色切换" 
                class="full-width-select"
              >
                <el-option
                  :value="''"
                  :label="'无可用角色'"
                />
              </el-select>
              <div class="role-support-hint unsupported">
                <el-icon color="#909399"><InfoFilled /></el-icon>
                <span>选择其他主播以使用角色切换功能</span>
              </div>
            </template>
          </div>
          
          <!-- 预设按钮 -->
          <div class="option-item">
            <div class="option-label">
              <span>快速预设</span>
              <el-icon><Star /></el-icon>
            </div>
            <el-select
              v-model="currentPreset"
              size="default"
              placeholder="选择预设"
              @change="applyPreset"
              class="full-width-select"
            >
              <el-option
                v-for="preset in presets"
                :key="preset.id"
                :label="preset.name"
                :value="preset.id"
              >
                <div class="preset-option">
                  <el-icon><component :is="preset.icon" /></el-icon>
                  <span>{{ preset.name }}</span>
                </div>
              </el-option>
            </el-select>
          </div>
          
          <!-- 添加语音主播按钮 -->
          <div class="option-item">
            <div class="option-label">
              <span>语音主播</span>
              <el-icon><Microphone /></el-icon>
            </div>
            <el-button 
              type="primary" 
              size="default" 
              class="full-width-button"
              @click="showVoiceAnchors = true"
            >
              <div class="button-content">
                <el-icon class="button-icon"><Avatar /></el-icon>
                <span class="button-text">选择语音主播</span>
              </div>
            </el-button>
          </div>
        </div>
      </div>
      
      <div class="option-section">
        <h3 class="section-title">音频输出设置</h3>
        <div class="option-grid">
          <!-- 音频格式选择 -->
          <div class="option-item">
            <div class="option-label">
              <span>{{ t('options.audioFormat') }}</span>
              <el-icon><Document /></el-icon>
            </div>
            <el-select
              v-model="formConfig.audioFormat"
              size="default"
              :placeholder="t('options.selectAudioFormat')"
              class="full-width-select"
            >
              <el-option
                v-for="format in ['mp3', 'wav', 'ogg', 'flac']"
                :key="format"
                :label="t(`options.format${format.toUpperCase()}`)"
                :value="format"
              >
                <div class="style-option">
                  <span>{{ t(`options.format${format.toUpperCase()}`) }}</span>
                </div>
              </el-option>
            </el-select>
          </div>

          <!-- 音频质量选择 -->
          <div class="option-item">
            <div class="option-label">
              <span>{{ t('options.audioQuality') }}</span>
              <el-icon><Star /></el-icon>
            </div>
            <el-select
              v-model="formConfig.audioQuality"
              size="default"
              :placeholder="t('options.selectAudioQuality')"
              class="full-width-select"
            >
              <el-option
                v-for="quality in ['standard', 'high', 'ultra']"
                :key="quality"
                :label="t(`options.${quality}Quality`)"
                :value="quality"
              >
                <div class="style-option">
                  <span>{{ t(`options.${quality}Quality`) }}</span>
                </div>
              </el-option>
            </el-select>
          </div>
        </div>

        <!-- 自动预览开关 -->
        <div class="option-switch">
          <span class="switch-label">{{ t('options.autoPreview') }}</span>
          <el-switch
            v-model="formConfig.autoPreview"
            :active-text="t('options.autoPreviewDesc')"
          />
        </div>

        <!-- 批量下载和云端保存 -->
        <div class="option-buttons">
          <el-button
            type="primary"
            plain
            @click="handleBatchDownload"
          >
            <el-icon><Download /></el-icon>
            {{ t('options.batchDownload') }}
          </el-button>
          
          <el-button
            type="success"
            plain
            @click="handleSaveToCloud"
          >
            <el-icon><Upload /></el-icon>
            {{ t('options.saveToCloud') }}
          </el-button>
        </div>
      </div>
    </div>
    
    <!-- 语音主播对话框 -->
    <el-dialog
      v-model="showVoiceAnchors"
      title="选择语音主播"
      width="80%"
      :close-on-click-modal="false"
      :append-to-body="true"
      destroy-on-close
    >
      <div class="voice-anchor-dialog">
        <!-- 语音主播内容 -->
        <div class="anchor-filters">
          <div class="category-tabs">
            <span 
              v-for="category in voiceCategories" 
              :key="category.value"
              :class="['category-tab', selectedCategory === category.value ? 'active' : '']"
              @click="selectedCategory = category.value"
            >
              {{ category.label }}
            </span>
          </div>
          
          <div class="anchor-search">
            <el-input 
              v-model="searchText" 
              placeholder="搜索语音主播" 
              prefix-icon="Search"
              clearable
              size="small"
            />
          </div>
        </div>
        
        <!-- 主播卡片列表 -->
        <div class="anchor-grid">
          <div 
            v-for="anchor in filteredAnchors" 
            :key="anchor.id"
            :class="['anchor-card', selectedAnchor === anchor.id ? 'selected' : '']"
            @click="selectAnchor(anchor)"
          >
            <div class="anchor-avatar">
              <img :src="anchor.avatar || getDefaultAvatar(anchor)" alt="主播头像">
              <span v-if="anchor.isPro" class="anchor-tag">专业版</span>
            </div>
            <div class="anchor-info">
              <h4 class="anchor-name">{{ anchor.name }}</h4>
              <p class="anchor-desc">{{ anchor.description }}</p>
              <div v-if="hasRoleSupport(anchor)" class="anchor-features">
                <el-tag size="small" type="success" effect="plain">支持{{ getRoleSupportCount(anchor) }}种角色切换</el-tag>
              </div>
            </div>
            <div class="anchor-actions">
              <el-button 
                size="small" 
                type="primary" 
                circle
                class="anchor-play-button"
                @click.stop="previewVoice(anchor)"
              >
                <el-icon><CaretRight /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
        
        <div class="dialog-footer">
          <el-button @click="showVoiceAnchors = false">取消</el-button>
          <el-button type="primary" @click="applySelectedAnchor">应用选择</el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 高级设置对话框 -->
    <el-dialog
      v-model="showAdvancedSettings"
      title="高级设置"
      width="500px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div class="advanced-settings-content">
        <div class="settings-section">
          <h4>服务配置</h4>
          <div class="settings-item">
            <span class="settings-label">服务地址</span>
            <el-input 
              v-model="localTTSStore.config.serverUrl" 
              placeholder="请输入服务地址"
              size="default"
            />
          </div>
          <div class="settings-item">
            <span class="settings-label">重试次数</span>
            <el-input-number
              v-model="localTTSStore.config.retryCount"
              :min="0"
              :max="5"
              size="default"
            />
          </div>
          <div class="settings-item">
            <span class="settings-label">重试间隔(ms)</span>
            <el-input-number
              v-model="localTTSStore.config.retryInterval"
              :min="1000"
              :max="5000"
              :step="500"
              size="default"
            />
          </div>
        </div>
        
        <div class="settings-section">
          <h4>音频设置</h4>
          <div class="settings-item">
            <span class="settings-label">默认音频格式</span>
            <el-select
              v-model="localTTSStore.config.defaultAudioFormat"
              size="default"
            >
              <el-option label="MP3" value="mp3" />
              <el-option label="WAV" value="wav" />
              <el-option label="OGG" value="ogg" />
            </el-select>
          </div>
          <div class="settings-item">
            <span class="settings-label">自动播放</span>
            <el-switch
              v-model="localTTSStore.config.autoPlay"
            />
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showAdvancedSettings = false">取消</el-button>
          <el-button type="primary" @click="saveAdvancedSettings">
            保存设置
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { ref, reactive, watch, onMounted, computed, defineProps } from "vue";
import { optionsConfig as oc } from "./options-config";
import { getStyleDes, getRoleDes } from "./emoji-config";
import Loading from "./Loading.vue";
import VoiceSelector from "./VoiceSelector.vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useTtsStore } from "@/store/store";
import { useLocalTTSStore } from "@/store/local-tts-store";
import { storeToRefs } from "pinia";
import { useI18n } from 'vue-i18n';
import WebStore from "@/store/web-store";
import { getTTSData } from "@/store/play";
import { 
  Connection, ChatDotRound, Microphone, UserFilled, Mic, 
  Aim, Timer, Headset, TrendCharts, Star,
  DocumentChecked, Reading, Collection, Lightning, Cloudy,
  Clock, RefreshRight, CaretRight, ArrowDown, Setting,
  Search, Avatar, Check, Close, Document, Download, Upload,
  CircleCheckFilled, InfoFilled
} from '@element-plus/icons-vue';
import LocalTTSSettings from '../aside/LocalTTSSettings.vue';
import { getChineseName } from "@/voice-utils"; // 导入声音工具函数

// 定义props
const props = defineProps({
  inDrawer: {
    type: Boolean,
    default: false
  }
});

const { t } = useI18n();
const ttsStore = useTtsStore();
const localTTSStore = useLocalTTSStore();
const { page, inputs, tableData, isLoading } = storeToRefs(ttsStore);
const { formConfig, config } = storeToRefs(ttsStore);
const webstore = new WebStore();

// 控制弹出框显示
const showAdvancedSettings = ref(false);
const showVoiceAnchors = ref(false);

// 添加展开/收起状态控制
const showFreeTTSInfo = ref(true);

// 切换显示/隐藏免费TTS信息
const toggleFreeTTSInfo = () => {
  showFreeTTSInfo.value = !showFreeTTSInfo.value;
};

// 保存高级设置
const saveAdvancedSettings = () => {
  try {
    // 保存配置到本地存储
    localTTSStore.saveConfig();
    
    // 关闭对话框
    showAdvancedSettings.value = false;
    
    // 显示成功提示
    ElMessage({
      message: '设置已保存',
      type: 'success',
      duration: 2000
    });
    
    // 重新检查连接
    handleCheckConnection();
  } catch (error) {
    ElMessage({
      message: '保存设置失败: ' + (error instanceof Error ? error.message : String(error)),
      type: 'error',
      duration: 3000
    });
  }
};

// 应用选中的主播
const applySelectedAnchor = () => {
  showVoiceAnchors.value = false;
  if (selectedAnchor.value) {
    const anchor = voiceAnchors.find(a => a.id === selectedAnchor.value);
    if (anchor) {
      // 保存当前选择的样式，以便可能需要重用
      const selectedStyle = formConfig.value.voiceStyleSelect || 'Default';
      
      // 应用主播配置
      formConfig.value = {...anchor.config};
      
      // 确保更新SSML
      updateSSML();
      
      // 更新可用的风格和角色列表
      const voice = voiceSelectList.value.find(
        (item: any) => item.ShortName === formConfig.value.voiceSelect
      );
      
      if (voice) {
        // 获取可用的样式
        const availableStyles = voice.VoiceStyleNames?.split(",") || [];
        voiceStyleSelectList.value = availableStyles;
        
        // 获取可用的角色
        rolePlayList.value = voice.VoiceRoleNames?.split(",") || [];
        
        // 检查所选样式是否可用
        if (availableStyles.length > 0) {
          if (!availableStyles.includes(selectedStyle)) {
            // 如果不可用，使用第一个可用样式
            formConfig.value.voiceStyleSelect = availableStyles[0];
          } else {
            // 否则保持选择的样式
            formConfig.value.voiceStyleSelect = selectedStyle;
          }
        } else {
          formConfig.value.voiceStyleSelect = 'Default';
        }
        
        // 更新角色
        if (rolePlayList.value.length > 0) {
          formConfig.value.role = rolePlayList.value[0];
        } else {
          formConfig.value.role = '';
        }
      }
      
      ElMessage({
        message: `已应用语音主播：${anchor.name}`,
        type: 'success',
        duration: 2000
      });
    }
  }
};

// 预设风格配置
const presets = [
  {
    id: 'default',
    name: t('options.presetDefault'),
    icon: 'DocumentChecked',
    config: {
      voiceStyleSelect: 'Default',
      role: '',
      intensity: 'default',
      volume: 'default',
      silence: 'default',
      speed: 1,
      pitch: 1
    }
  },
  {
    id: 'news',
    name: t('options.presetNews'),
    icon: 'Mic',
    config: {
      voiceStyleSelect: 'newscast',
      role: '',
      intensity: '1.5',
      volume: 'strong',
      silence: 'default',
      speed: 1.1,
      pitch: 1.05
    }
  },
  {
    id: 'story',
    name: t('options.presetStory'),
    icon: 'Collection',
    config: {
      voiceStyleSelect: 'narration-relaxed',
      role: '',
      intensity: '1.5',
      volume: 'default',
      silence: '200ms',
      speed: 0.9,
      pitch: 1
    }
  },
  {
    id: 'poetry',
    name: t('options.presetPoetry'),
    icon: 'Reading',
    config: {
      voiceStyleSelect: 'poetry-reading',
      role: '',
      intensity: '1.5',
      volume: 'default',
      silence: '500ms',
      speed: 0.85,
      pitch: 1
    }
  },
  {
    id: 'excited',
    name: t('options.presetExcited'),
    icon: 'Lightning',
    config: {
      voiceStyleSelect: 'excited',
      role: '',
      intensity: '2',
      volume: 'strong',
      silence: 'default',
      speed: 1.2,
      pitch: 1.2
    }
  },
  {
    id: 'sad',
    name: t('options.presetSad'),
    icon: 'Cloudy',
    config: {
      voiceStyleSelect: 'sad',
      role: '',
      intensity: '1.5',
      volume: 'weak',
      silence: '200ms',
      speed: 0.8,
      pitch: 0.9
    }
  },
  // 新增预设
  {
    id: 'business',
    name: t('options.presetBusiness'),
    icon: 'Briefcase',
    config: {
      voiceStyleSelect: 'narration-professional',
      role: '',
      intensity: 'strong',
      volume: 'medium',
      silence: '100ms',
      speed: 1.1,
      pitch: 1
    }
  },
  {
    id: 'friendly',
    name: t('options.presetFriendly'),
    icon: 'ChatDotRound',
    config: {
      voiceStyleSelect: 'friendly',
      role: '',
      intensity: 'normal',
      volume: 'medium',
      silence: '200ms',
      speed: 1,
      pitch: 1.05
    }
  },
  {
    id: 'customer-service',
    name: t('options.presetCustomerService'),
    icon: 'Service',
    config: {
      voiceStyleSelect: 'customerservice',
      role: '',
      intensity: 'normal',
      volume: 'medium',
      silence: '100ms',
      speed: 1,
      pitch: 1
    }
  },
  {
    id: 'advertisement',
    name: t('options.presetAdvertisement'),
    icon: 'Promotion',
    config: {
      voiceStyleSelect: 'advertisement_upbeat',
      role: '',
      intensity: 'strong',
      volume: 'strong',
      silence: '100ms',
      speed: 1.2,
      pitch: 1.1
    }
  }
];

// 当前选中的预设
const currentPreset = ref('');

// 应用预设配置
const applyPreset = (presetId: string) => {
  const preset = presets.find(p => p.id === presetId);
  if (!preset) return;
  
  // 保留原有语音和语言设置
  const voice = formConfig.value.voiceSelect;
  const language = formConfig.value.languageSelect;
  const api = formConfig.value.api;
  
  // 应用预设配置
  Object.entries(preset.config).forEach(([key, value]) => {
    // 使用类型断言
    (formConfig.value as any)[key] = value;
  });
  
  // 恢复语音和语言设置
  formConfig.value.voiceSelect = voice;
  formConfig.value.languageSelect = language;
  formConfig.value.api = api;
  
  ElMessage({
    message: t('options.presetApplied'),
    type: 'success',
    duration: 2000,
  });
};

const apiEdge = ref(false);

// 当前视图（额度信息/高级配置）
const currentView = ref('quota'); // 默认显示额度信息

// 设置默认配置值
onMounted(() => {
  // 如果配置为空，设置默认值
  if (!localTTSStore.config) {
    localTTSStore.config = {
      serverUrl: 'https://free.tts88.top',  // 使用local-tts.ts中的默认地址
      retryCount: 3,
      retryInterval: 2000,
      defaultAudioFormat: 'mp3',
      autoPlay: true,
      enabled: true,
      defaultVoice: 'zh-CN-XiaoxiaoNeural',
      defaultLanguage: 'zh-CN'
    };
  }
  
  // 确保所有必要的配置项都有默认值
  localTTSStore.config = {
    ...{
      serverUrl: 'https://free.tts88.top',  // 使用local-tts.ts中的默认地址
      retryCount: 3,
      retryInterval: 2000,
      defaultAudioFormat: 'mp3',
      autoPlay: true,
      enabled: true,
      defaultVoice: 'zh-CN-XiaoxiaoNeural',
      defaultLanguage: 'zh-CN'
    },
    ...localTTSStore.config
  };
  
  // 保存默认配置
  localTTSStore.saveConfig();
});

onMounted(() => {
  // 初始化新增配置项的默认值
  if (!formConfig.value.intensity) {
    formConfig.value.intensity = "default";
  }
  if (!formConfig.value.silence) {
    formConfig.value.silence = "default";
  }
  if (!formConfig.value.volume) {
    formConfig.value.volume = "default";
  }
  
  // 设置默认API为免费TTS服务
  formConfig.value.api = 5;
  
  // 如果当前使用的是免费TTS服务，自动检查连接和获取额度
  if (formConfig.value.api === 5) {
    localTTSStore.checkServerConnection().then(connected => {
      if (connected) {
        // 获取免费额度信息
        localTTSStore.getFreeLimitInfo();
        
        // 提示用户正在使用免费服务
        ElMessage({
          message: "您正在使用免费TTS服务，无需API密钥即可开始使用",
          type: "success",
          duration: 3000,
        });
      }
    });
  }
  
  // 手动触发一次SSML更新
  updateSSML();

  // 初始化语音主播相关设置
  showVoiceAnchors.value = false;
  selectedCategory.value = 'all';
  searchText.value = '';
  
  // 如果已有选择的主播，记录ID
  const currentVoice = formConfig.value.voiceSelect;
  const matchingAnchor = voiceAnchors.find(anchor => 
    anchor.config.voiceSelect === currentVoice
  );
  if (matchingAnchor) {
    selectedAnchor.value = matchingAnchor.id;
  }
  
  // 默认显示主播模式
  currentViewMode.value = 'anchors';
});

const apiChange = (res: number) => {
  if (res === 1 && config.value.speechKey === "") {
    ElMessage({
      message: "请先在设置中配置 Microsoft Speech API Key，或者推荐使用免费TTS服务",
      type: "warning",
      duration: 4000,
    });
    // 如果没有配置 key，自动切换回免费TTS服务
    formConfig.value.api = 5;
    return;
  } else if (res === 2) {
    apiEdge.value = true;
    ElMessage({
      message: t('options.edgeApiWarning'),
      type: "warning",
      duration: 4000,
    });
  } else if (res === 3 && (config.value.speechKey === "" || config.value.serviceRegion === "")) {
    ElMessage({
      message: "请先在设置中配置 Azure Speech API Key 和区域",
      type: "warning",
      duration: 4000,
    });
    // 如果没有配置 key，自动切换回免费TTS服务
    formConfig.value.api = 5;
    return;
  } else if (res === 4 && config.value.thirdPartyApi === "") {
    ElMessage({
      message: "请先在设置中配置TTS88 API地址",
      type: "warning",
      duration: 4000,
    });
    // 如果没有配置 API 地址，自动切换回免费TTS服务
    formConfig.value.api = 5;
    return;
  } else if (res === 4 && config.value.thirdPartyApi !== "") {
    // TTS88 API提示
    ElMessage({
      message: "您已选择TTS88 API，可以无限制使用",
      type: "success",
      duration: 3000,
    });
  } else if (res === 5) {
    // 免费TTS服务
    if (!localTTSStore.config.enabled) {
      // 自动启用
      localTTSStore.config.enabled = true;
      localTTSStore.saveConfig();
    }
    
    // 检查免费TTS服务连接状态
    localTTSStore.checkServerConnection().then(connected => {
      if (connected) {
        ElMessage({
          message: "已连接到免费TTS服务",
          type: "success",
          duration: 2000,
        });
        
        // 获取免费额度信息
        localTTSStore.getFreeLimitInfo().then(freeLimit => {
          if (freeLimit && freeLimit.remaining <= 0) {
            ElMessage({
              message: "您的免费额度已用完，请等待下次重置或者使用其他API",
              type: "warning",
              duration: 4000,
            });
          }
        });
      } else {
        ElMessage({
          message: "无法连接到免费TTS服务，请检查网络连接",
          type: "error",
          duration: 4000,
        });
      }
    });
  }
  apiEdge.value = false;
};

const audition = async (value: string) => {
  // 创建临时的SSML用于试听
  const tempInput = inputs.value.inputValue;
  const tempSSML = inputs.value.ssmlValue;
  
  try {
    // 使用试听文本生成SSML
    inputs.value.inputValue = webstore.get("audition") || "你好，这是一段试听文本。";
    formConfig.value.voiceSelect = value;
    ttsStore.setSSMLValue();
    
    // 开始转换并播放
    const voiceData = {
      activeIndex: page.value.tabIndex,
      ssmlContent: inputs.value.ssmlValue,
      inputContent: inputs.value.inputValue,
      retryCount: config.value.retryCount,
      retryInterval: config.value.retryInterval,
    };
    
    // 检查API URL是否为空
    if (!config.value.thirdPartyApi) {
      ElMessage({
        message: "请先在设置中配置TTS88 API地址",
        type: "error",
        duration: 3000,
      });
      return;
    }
    
    // 获取TTS数据
    const res = await getTTSData({
      api: formConfig.value.api,
      voiceData,
      speechKey: config.value.speechKey,
      region: config.value.serviceRegion,
      thirdPartyApi: config.value.thirdPartyApi,
      tts88Key: config.value.tts88Key,
    });
    
    if (res) {
      if (res.buffer) {
        const audioBlob = new Blob([res.buffer], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        ttsStore.audition(audioUrl);
      } else if (res.audibleUrl) {
        ttsStore.audition(res.audibleUrl);
      }
    }
  } catch (err) {
    console.error('试听失败:', err);
    ElMessage({
      message: "试听失败: " + (err instanceof Error ? err.message : String(err)),
      type: "error",
      duration: 2000,
    });
  } finally {
    // 恢复原始输入
    inputs.value.inputValue = tempInput;
    inputs.value.ssmlValue = tempSSML;
  }
};

// 更新SSML内容的函数
function updateSSML() {
  if (!formConfig.value || !formConfig.value.voiceSelect) {
    return;
  }
  
  // 提取所需的值
  const config = formConfig.value;
  
  // 准备样式属性
  let styleAttr = "";
  if (config.voiceStyleSelect) {
    styleAttr = 'style="' + config.voiceStyleSelect + '"';
  }
  
  // 准备角色属性
  let roleAttr = "";
  if (config.role) {
    roleAttr = 'role="' + config.role + '"';
  }
  
  // 准备强度属性
  let intensityAttr = "";
  if (config.intensity && config.intensity !== "default") {
    // 将字符串强度值转换为对应的数值
    let intensityValue = "";
    if (config.intensity === "weak") intensityValue = "0.5";
    else if (config.intensity === "strong") intensityValue = "1.5";
    else if (config.intensity === "extraStrong") intensityValue = "2";
    else intensityValue = config.intensity; // 如果已经是数值则直接使用
    
    intensityAttr = 'styledegree="' + intensityValue + '"';
  }
  
  // 准备音量属性 - 移至 prosody 元素
  let volumeAttr = "";
  if (config.volume && config.volume !== "default") {
    // 定义音量值映射
    let volumeMapping: {[key: string]: string} = {
      "extraWeak": "x-soft",
      "weak": "soft", 
      "strong": "loud",
      "extraStrong": "x-loud"
    };
    
    volumeAttr = 'volume="' + (volumeMapping[config.volume] || config.volume) + '"';
  }
  
  // 准备静音配置
  let silenceConfig = "";
  if (config.silence && config.silence !== "default") {
    silenceConfig = '<break time="' + config.silence + '" />';
  }
  
  // 计算速率和音调
  const rateValue = ((config.speed - 1) * 100).toFixed();
  const pitchValue = ((config.pitch - 1) * 50).toFixed();
  
  // 生成完整的SSML - 修改命名空间为https
  const ssml = '<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="en-US">' +
    '<voice name="' + config.voiceSelect + '">' +
    '<mstts:express-as ' + styleAttr + ' ' + roleAttr + ' ' + intensityAttr + '>' +
    '<prosody rate="' + rateValue + '%" pitch="' + pitchValue + '%" ' + volumeAttr + '>' +
    silenceConfig + inputs.value.inputValue +
    '</prosody>' +
    '</mstts:express-as>' +
    '</voice>' +
    '</speak>';
  
  inputs.value.ssmlValue = ssml;
}

// 监听表单配置的变化，并更新SSML
watch(formConfig, (newVal, oldVal) => {
  updateSSML();
  
  // 检查是否是语音相关设置发生变化
  const voiceSettings = ['speed', 'pitch', 'volume', 'intensity', 'silence', 'voiceStyleSelect', 'role'];
  const hasVoiceSettingChanged = voiceSettings.some(key => newVal[key] !== oldVal[key]);
  
  // 如果语音设置发生变化且启用了自动预览，则触发预览
  if (hasVoiceSettingChanged && newVal.autoPreview) {
    // 使用防抖，避免频繁触发预览
    if (previewDebounceTimer) {
      clearTimeout(previewDebounceTimer);
    }
    previewDebounceTimer = setTimeout(() => {
      ttsStore.autoPreview();
    }, 1000); // 1秒后触发预览
  }
}, { deep: true });

// 添加防抖定时器
let previewDebounceTimer: any = null;

// 自动预览开关处理
const handleAutoPreview = () => {
  if (formConfig.value.autoPreview) {
    // 开启自动预览时，立即触发一次预览
    ttsStore.autoPreview();
  }
};

// 批量下载
const handleBatchDownload = () => {
  // 实现批量下载逻辑
};

// 保存到云端
const handleSaveToCloud = () => {
  // 实现保存到云端逻辑
};

const voiceSelectList = ref(
  oc.findVoicesByLocaleName(formConfig.value.languageSelect)
);

const languageSelectChange = (value: string) => {
  formConfig.value.voiceSelect = "";
  formConfig.value.voiceStyleSelect = "";
  formConfig.value.role = "";
  voiceSelectList.value = oc.findVoicesByLocaleName(value);
};

const defaultVoice = voiceSelectList.value.find(
  (item: any) => item.ShortName == formConfig.value.voiceSelect
);

const voiceStyleSelectListInit = defaultVoice?.VoiceStyleNames?.split(",") || [];
const voiceStyleSelectList: any = ref(voiceStyleSelectListInit);

const rolePlayListInit = defaultVoice?.VoiceRoleNames?.split(",") || [];
const rolePlayList: any = ref(rolePlayListInit);

const voiceSelectChange = (value: string) => {
  const voice = voiceSelectList.value.find(
    (item: any) => item.ShortName == formConfig.value.voiceSelect
  );
  
  // 获取可用的语音样式列表
  const availableStyles = voice?.VoiceStyleNames?.split(",") || [];
  voiceStyleSelectList.value = availableStyles;
  
  // 获取可用的角色列表
  rolePlayList.value = voice?.VoiceRoleNames?.split(",") || [];
  
  // 保存当前选择的样式
  const currentStyle = formConfig.value.voiceStyleSelect;
  
  // 检查当前选择的样式是否在可用列表中
  if (availableStyles.length > 0) {
    if (!availableStyles.includes(currentStyle) || !currentStyle) {
      // 如果当前样式不可用或未设置，则选择第一个可用样式
      formConfig.value.voiceStyleSelect = availableStyles[0];
    }
    // 如果当前样式可用，保持不变
  } else {
    // 如果没有可用样式，使用Default
    formConfig.value.voiceStyleSelect = 'Default';
  }
  
  // 如果角色不在可用列表中，选择第一个可用角色或清空
  const currentRole = formConfig.value.role;
  if (rolePlayList.value.length > 0) {
    if (!rolePlayList.value.includes(currentRole)) {
      formConfig.value.role = rolePlayList.value[0];
    }
  } else {
    formConfig.value.role = '';
  }
};

const configChange = (val: string) => {
  formConfig.value = config.value.formConfigJson[val];
};

const startBtn = () => {
  if (page.value.asideIndex == "1" && inputs.value.inputValue == "") {
    ElMessage({
      message: t('messages.inputWarning'),
      type: "warning",
      duration: 2000,
    });
    return;
  }
  if (page.value.asideIndex == "2" && tableData.value.length == 0) {
    ElMessage({
      message: t('messages.emptyListWarning'),
      type: "warning",
      duration: 2000,
    });
    return;
  }
  if (isLoading.value) {
    ElMessage({
      message: "请稍候。。。",
      type: "warning",
      duration: 2000,
    });
    return;
  }
  isLoading.value = true;

  ttsStore.start();
};

// 视图模式切换
const currentViewMode = ref('anchors'); // 'anchors' 或 'custom'

// 切换到自定义模式
const switchToCustom = () => {
  currentViewMode.value = 'custom';
};

// 切换到主播模式
const switchToAnchors = () => {
  currentViewMode.value = 'anchors';
};

// 语音主播相关
const selectedCategory = ref('all');
const searchText = ref('');
const selectedAnchor = ref('');

// 定义语音主播分类
const voiceCategories = [
  { value: 'all', label: '全部' },
  { value: 'hot', label: '超热门' },
  { value: 'emotion', label: '超情感' },
  { value: 'realistic', label: '超逼真' },
  { value: 'broadcast', label: '大规模' },
  { value: 'games', label: '金牌主播' },
  { value: 'movie', label: '影视解说' },
  { value: 'cute', label: '小说推文/朗读' },
  { value: 'drama', label: '娱乐模仿' },
  { value: 'ad', label: '广告宣传' },
  { value: 'radio', label: '声音' },
  { value: 'female', label: '女声' },
  { value: 'male', label: '特色/方言' },
];

// 定义语音主播列表
const voiceAnchors = reactive([
  {
    id: 'xiaoxiao',
    name: '晓晓',
    isPro: false,
    description: '热门女声，配音魅力/有声对话',
    category: ['hot', 'female'],
    avatar: '',
    config: {
      languageSelect: 'zh-CN',
      voiceSelect: 'zh-CN-XiaoxiaoNeural',
      voiceStyleSelect: 'Default',
      role: '',
      speed: 1,
      pitch: 1,
      api: 4
    }
  },
  {
    id: 'xiaoxiaoPro',
    name: '晓晓Pro',
    isPro: true,
    description: '热门女声，支持多情感，适配场景',
    category: ['hot', 'emotion', 'female'],
    avatar: '',
    config: {
      languageSelect: 'zh-CN',
      voiceSelect: 'zh-CN-XiaoxiaoNeural',
      voiceStyleSelect: 'chat',
      role: '',
      speed: 1.1,
      pitch: 1.05,
      api: 4
    }
  },
  {
    id: 'xiaoxiaoUltra',
    name: '晓晓Ultra',
    isPro: true,
    description: '热门女声，炫酷语音效果，支持70多种语音',
    category: ['hot', 'emotion', 'realistic', 'female'],
    avatar: '',
    config: {
      languageSelect: 'zh-CN',
      voiceSelect: 'zh-CN-XiaoxiaoNeural',
      voiceStyleSelect: 'newscast-formal',
      role: '',
      speed: 1.1,
      pitch: 1.1,
      api: 4
    }
  },
  {
    id: 'yunxi',
    name: '云熙',
    isPro: false,
    description: '热门女声，火爆全网，方言版',
    category: ['hot', 'female'],
    avatar: '',
    config: {
      languageSelect: 'zh-CN',
      voiceSelect: 'zh-CN-YunxiNeural',
      voiceStyleSelect: 'Default',
      role: '',
      speed: 1,
      pitch: 1,
      api: 4
    }
  },
  {
    id: 'xiaomo',
    name: '晓墨',
    isPro: false,
    description: '热门知性女声，休闲轻松，解说/宣传',
    category: ['female', 'ad'],
    avatar: '',
    config: {
      languageSelect: 'zh-CN',
      voiceSelect: 'zh-CN-XiaomoNeural',
      voiceStyleSelect: 'Default',
      role: '',
      speed: 1,
      pitch: 1,
      api: 4
    }
  },
  {
    id: 'xiaomoPro',
    name: '晓墨Pro',
    isPro: true,
    description: '热门知性女声，解说/宣传，高品质，更好听',
    category: ['female', 'ad', 'realistic'],
    avatar: '',
    config: {
      languageSelect: 'zh-CN',
      voiceSelect: 'zh-CN-XiaomoNeural',
      voiceStyleSelect: 'newscast',
      role: '',
      speed: 1.05,
      pitch: 1.02,
      api: 4
    }
  },
  {
    id: 'yunye',
    name: '云叶',
    isPro: false,
    description: '情感女声',
    category: ['emotion', 'female'],
    avatar: '',
    config: {
      languageSelect: 'zh-CN',
      voiceSelect: 'zh-CN-YunyeNeural',
      voiceStyleSelect: 'Default',
      role: '',
      speed: 1,
      pitch: 1,
      api: 4
    }
  },
  {
    id: 'yungang',
    name: '云钢',
    isPro: false,
    description: '优雅知性姐姐，优雅从容',
    category: ['female'],
    avatar: '',
    config: {
      languageSelect: 'zh-CN',
      voiceSelect: 'zh-CN-YunxiaNeural', 
      voiceStyleSelect: 'Default',
      role: '',
      speed: 1,
      pitch: 1,
      api: 4
    }
  },
  {
    id: 'yungang-pro',
    name: '云钢Pro',
    isPro: true,
    description: '优雅知性姐姐，优雅从容',
    category: ['female', 'realistic'],
    avatar: '',
    config: {
      languageSelect: 'zh-CN',
      voiceSelect: 'zh-CN-YunxiaNeural',
      voiceStyleSelect: 'lyrical',
      role: '',
      speed: 0.95,
      pitch: 1.05,
      api: 4
    }
  },
  {
    id: 'xiaorui',
    name: '晓瑞',
    isPro: false,
    description: '通用女声',
    category: ['female'],
    avatar: '',
    config: {
      languageSelect: 'zh-CN',
      voiceSelect: 'zh-CN-XiaoruiNeural',
      voiceStyleSelect: 'Default',
      role: '',
      speed: 1,
      pitch: 1,
      api: 4
    }
  },
  {
    id: 'xiaoshuang',
    name: '晓双',
    isPro: false, 
    description: '亲切女声，柔媚迷人，娇俏可爱',
    category: ['female', 'cute'],
    avatar: '',
    config: {
      languageSelect: 'zh-CN',
      voiceSelect: 'zh-CN-XiaoshuangNeural',
      voiceStyleSelect: 'Default',
      role: '',
      speed: 1,
      pitch: 1.1,
      api: 4
    }
  },
  {
    id: 'yunfeng',
    name: '云枫',
    isPro: false,
    description: '亲切大方姐姐，亲和女声',
    category: ['female'],
    avatar: '',
    config: {
      languageSelect: 'zh-CN',
      voiceSelect: 'zh-CN-YunfengNeural',
      voiceStyleSelect: 'Default',
      role: '',
      speed: 1,
      pitch: 1,
      api: 4
    }
  },
  {
    id: 'yunhan',
    name: '云翰',
    isPro: false,
    description: '客服女声',
    category: ['female', 'ad'],
    avatar: '',
    config: {
      languageSelect: 'zh-CN',
      voiceSelect: 'zh-CN-YunhanNeural',
      voiceStyleSelect: 'Default',
      role: '',
      speed: 1,
      pitch: 1,
      api: 4
    }
  },
  {
    id: 'kangkang',
    name: '康康',
    isPro: false,
    description: '男生通用声音',
    category: ['male'],
    avatar: '',
    config: {
      languageSelect: 'zh-CN',
      voiceSelect: 'zh-CN-KangkangNeural',
      voiceStyleSelect: 'Default',
      role: '',
      speed: 1,
      pitch: 1,
      api: 4
    }
  },
  {
    id: 'zhangyu',
    name: '章宇',
    isPro: false,
    description: '沉稳男声，深情女声',
    category: ['male'],
    avatar: '',
    config: {
      languageSelect: 'zh-CN',
      voiceSelect: 'zh-CN-ZhangyuNeural',
      voiceStyleSelect: 'Default',
      role: '',
      speed: 0.95,
      pitch: 0.95,
      api: 4
    }
  }
]);

// 根据分类和搜索过滤主播
const filteredAnchors = computed(() => {
  let result = voiceAnchors;
  
  // 分类过滤
  if (selectedCategory.value !== 'all') {
    result = result.filter(anchor => 
      anchor.category.includes(selectedCategory.value)
    );
  }
  
  // 搜索过滤
  if (searchText.value) {
    const search = searchText.value.toLowerCase();
    result = result.filter(anchor => 
      anchor.name.toLowerCase().includes(search) || 
      anchor.description.toLowerCase().includes(search)
    );
  }
  
  return result;
});

// 获取默认头像
const getDefaultAvatar = (anchor: any) => {
  // 根据主播ID生成不同颜色的默认头像
  const colors = ['#FF9500', '#FF2D55', '#5856D6', '#007AFF', '#34C759', '#AF52DE'];
  const colorIndex = anchor.id.charCodeAt(0) % colors.length;
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='${colors[colorIndex].replace('#', '%23')}' /%3E%3Ctext x='50' y='60' font-size='40' text-anchor='middle' fill='white'%3E${anchor.name[0]}%3C/text%3E%3C/svg%3E`;
};

// 选择主播
const selectAnchor = async (anchor: any) => {
  selectedAnchor.value = anchor.id;
  
  // 保存当前选择的样式，以便可能需要重用
  const selectedStyle = formConfig.value.voiceStyleSelect || 'Default';
  
  // 应用主播配置
  formConfig.value = {...anchor.config};
  
  // 确保更新SSML
  updateSSML();
  
  // 触发语音选择变更以更新可用的风格和角色列表，注意不要覆盖已选择的样式
  const voice = voiceSelectList.value.find(
    (item: any) => item.ShortName === formConfig.value.voiceSelect
  );
  
  if (voice) {
    // 获取可用的样式
    const availableStyles = voice.VoiceStyleNames?.split(",") || [];
    voiceStyleSelectList.value = availableStyles;
    
    // 获取可用的角色
    rolePlayList.value = voice.VoiceRoleNames?.split(",") || [];
    
    // 检查所选样式是否可用
    if (availableStyles.length > 0) {
      if (!availableStyles.includes(selectedStyle)) {
        // 如果不可用，使用第一个可用样式
        formConfig.value.voiceStyleSelect = availableStyles[0];
      } else {
        // 否则保持选择的样式
        formConfig.value.voiceStyleSelect = selectedStyle;
      }
    } else {
      formConfig.value.voiceStyleSelect = 'Default';
    }
    
    // 更新角色
    if (rolePlayList.value.length > 0) {
      formConfig.value.role = rolePlayList.value[0];
    } else {
      formConfig.value.role = '';
    }
  }
  
  // 提示用户已选择
  ElMessage({
    message: `已选择语音主播：${anchor.name}`,
    type: 'success',
    duration: 2000
  });
};

// 预览主播声音
const previewVoice = async (anchor: any) => {
  // 临时保存当前配置
  const tempConfig = { ...formConfig.value };
  const tempInput = inputs.value.inputValue;
  const tempSSML = inputs.value.ssmlValue;
  
  try {
    // 应用选中主播的配置
    formConfig.value = {...anchor.config};
    
    // 使用试听文本生成SSML
    inputs.value.inputValue = webstore.get("audition") || "你好，这是一段试听文本。";
    ttsStore.setSSMLValue();
    
    // 开始转换并播放
    const voiceData = {
      activeIndex: page.value.tabIndex,
      ssmlContent: inputs.value.ssmlValue,
      inputContent: inputs.value.inputValue,
      retryCount: config.value.retryCount,
      retryInterval: config.value.retryInterval,
    };
    
    // 检查API URL是否为空
    if (!config.value.thirdPartyApi) {
      ElMessage({
        message: "请先在设置中配置TTS88 API地址",
        type: "error",
        duration: 3000,
      });
      return;
    }
    
    // 获取TTS数据
    isLoading.value = true;
    const res = await getTTSData({
      api: formConfig.value.api,
      voiceData,
      speechKey: config.value.speechKey,
      region: config.value.serviceRegion,
      thirdPartyApi: config.value.thirdPartyApi,
      tts88Key: config.value.tts88Key,
    });
    
    if (res) {
      if (res.buffer) {
        const audioBlob = new Blob([res.buffer], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        ttsStore.audition(audioUrl);
      } else if (res.audibleUrl) {
        ttsStore.audition(res.audibleUrl);
      } else {
        throw new Error("没有收到有效的音频数据");
      }
    }
    
    // 如果已选中该主播，保留配置
    if (selectedAnchor.value === anchor.id) {
      // 显示成功提示
      ElMessage({
        message: `正在播放${anchor.name}的声音`,
        type: "success",
        duration: 2000
      });
    }
  } catch (err) {
    console.error('主播声音预览失败:', err);
    ElMessage({
      message: "主播声音预览失败: " + (err instanceof Error ? err.message : String(err)),
      type: "error",
      duration: 2000,
    });
    // 恢复原配置
    formConfig.value = tempConfig;
  } finally {
    // 如果未选中该主播，恢复原配置
    if (selectedAnchor.value !== anchor.id) {
      formConfig.value = tempConfig;
    }
    // 恢复原始输入
    inputs.value.inputValue = tempInput;
    inputs.value.ssmlValue = tempSSML;
    isLoading.value = false;
  }
};

// 检查主播是否支持角色切换
const hasRoleSupport = (anchor: any) => {
  const voice = voiceSelectList.value.find(
    (item: any) => item.ShortName === anchor.config.voiceSelect
  );
  const roles = voice?.VoiceRoleNames?.split(",") || [];
  return roles.length > 0 && roles[0] !== '';
};

// 获取主播支持的角色数量
const getRoleSupportCount = (anchor: any) => {
  const voice = voiceSelectList.value.find(
    (item: any) => item.ShortName === anchor.config.voiceSelect
  );
  const roles = voice?.VoiceRoleNames?.split(",") || [];
  return roles.length > 0 && roles[0] !== '' ? roles.length : 0;
};

// 添加加载状态
const checkingConnection = ref(false);
const refreshingQuota = ref(false);

// 处理检查连接
const handleCheckConnection = async () => {
  checkingConnection.value = true;
  try {
    const connected = await localTTSStore.checkServerConnection();
    if (connected) {
      ElMessage({
        message: "已成功连接到免费TTS服务",
        type: "success",
        duration: 2000
      });
    } else {
      ElMessage({
        message: "无法连接到免费TTS服务，请检查网络连接",
        type: "error",
        duration: 3000
      });
    }
  } catch (error) {
    ElMessage({
      message: "检查连接失败: " + (error instanceof Error ? error.message : String(error)),
      type: "error",
      duration: 3000
    });
  } finally {
    checkingConnection.value = false;
  }
};

// 处理刷新额度
const handleRefreshQuota = async () => {
  refreshingQuota.value = true;
  try {
    const quota = await localTTSStore.getFreeLimitInfo();
    if (quota) {
      ElMessage({
        message: `额度信息已更新，剩余${quota.remaining}字符`,
        type: "success",
        duration: 2000
      });
    } else {
      ElMessage({
        message: "获取额度信息失败",
        type: "error",
        duration: 3000
      });
    }
  } catch (error) {
    ElMessage({
      message: "刷新额度失败: " + (error instanceof Error ? error.message : String(error)),
      type: "error",
      duration: 3000
    });
  } finally {
    refreshingQuota.value = false;
  }
};

const quotaProgressColor = computed(() => {
  const percentage = ((localTTSStore.serverStatus.freeLimit?.used || 0) / (localTTSStore.serverStatus.freeLimit?.free_limit || 50000) * 100);
  if (percentage >= 90) return '#F56C6C';
  if (percentage >= 70) return '#E6A23C';
  return '#67C23A';
});

const isTestPlaying = ref(false);

// 测试播放功能
const handleTestPlay = async () => {
  if (isTestPlaying.value) return;
  
  isTestPlaying.value = true;
  try {
    const testText = "这是一段测试语音，用于测试免费TTS服务的效果。";
    
    // 使用本地TTS服务的getAudioStream方法
    const audioUrl = await localTTSStore.getAudioStream(
      testText,
      undefined, // 使用默认voice
      undefined, // 使用默认language
      "mp3",
      false
    );
    
    if (!audioUrl) {
      throw new Error("获取测试音频失败");
    }
    
    // 播放音频
    ttsStore.audition(audioUrl);
    
    ElMessage({
      message: "正在播放测试音频",
      type: "success",
      duration: 2000
    });
  } catch (error: any) {
    ElMessage({
      message: `测试播放失败: ${error.message}`,
      type: "error",
      duration: 3000
    });
  } finally {
    isTestPlaying.value = false;
  }
};
</script>

<style scoped>
.modern-options {
  width: 100%;
}

/* 抽屉模式的样式 */
.drawer-mode {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.option-section {
  background-color: var(--card-background-light, #f5f7fa);
  border-radius: 8px;
  padding: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

.option-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.option-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.full-width-item {
  grid-column: 1 / -1;
}

.option-label {
  display: grid;
  grid-template-columns: 80px minmax(0, 1fr); /* 固定标签宽度为80px */
  align-items: center;
  font-size: 14px;
  color: var(--text-secondary);
  min-height: 22px;
  column-gap: 12px; /* 添加标签和控件之间的间距 */
}

.option-label span:first-child {
  white-space: nowrap; /* 防止标签文字换行 */
  padding-right: 4px; /* 给标签文字右侧添加一点内边距 */
}

.value-display {
  text-align: right;
  font-weight: 500;
  color: var(--primary-color);
}

.full-width-select {
  width: 100%;
}

.full-width-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.full-width-button :deep(.el-icon) {
  vertical-align: middle;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: 4px;
}

.full-width-button span {
  vertical-align: middle;
  line-height: normal;
}

.button-content {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.button-icon {
  margin-right: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.button-text {
  line-height: 1;
}

.option-slider {
  width: 100%;
  margin: 0;
}

.preset-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
}

.free-service-info {
  padding: 0;
}

.free-service-highlight {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding: 12px;
  background-color: rgba(103, 194, 58, 0.1);
  border-radius: 6px;
  color: #67C23A;
  font-weight: 500;
}

.free-tag {
  margin-left: 10px;
  vertical-align: middle;
}

/* 主播对话框样式 */
.voice-anchor-dialog {
  height: 500px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-height: 70vh;
}

.anchor-filters {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 0 16px 0;
  border-bottom: 1px solid var(--border-color);
  flex-wrap: wrap;
}

.category-tabs {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 8px;
  flex-wrap: wrap;
  max-width: calc(100% - 220px);
}

.category-tab {
  white-space: nowrap;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 14px;
  cursor: pointer;
  background-color: var(--card-background-light);
  color: var(--text-secondary);
  transition: all 0.2s;
  margin-bottom: 4px;
}

.category-tab.active {
  background-color: var(--primary-color);
  color: white;
}

.anchor-search {
  width: 200px;
}

.anchor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  padding: 16px 0;
  overflow-y: auto;
  height: 100%;
}

.anchor-card {
  display: flex;
  background-color: var(--card-background-light);
  border-radius: 8px;
  padding: 12px;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
  height: auto;
  min-height: 84px;
  box-sizing: border-box;
}

.anchor-card:hover {
  transform: translateY(-3px);
}

.anchor-card.selected {
  border-color: var(--primary-color);
}

.anchor-avatar {
  width: 60px;
  height: 60px;
  min-width: 60px; /* 确保最小宽度固定 */
  position: relative;
  overflow: hidden;
  border-radius: 6px;
}

.anchor-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.anchor-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0; /* 确保文本能够自动压缩 */
  overflow: hidden; /* 确保溢出内容被隐藏 */
}

.anchor-name {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.anchor-desc {
  margin: 0;
  font-size: 12px;
  color: var(--text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  max-height: 2.4em; /* 限制描述文本高度为两行 */
}

.anchor-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px; /* 为控制区域设置最小宽度 */
  margin-left: auto; /* 确保控制区域靠右 */
}

.anchor-play-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  min-width: 32px; /* 确保最小宽度固定 */
  flex-shrink: 0; /* 防止按钮被压缩 */
}

.anchor-play-button :deep(.el-icon) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.dialog-footer {
  padding: 16px 0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  border-top: 1px solid var(--border-color);
  margin-top: auto;
}

.style-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
}

.style-emoji {
  font-size: 16px;
}

.voice-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.free-api-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.free-api-option .el-tag {
  margin-left: 10px;
  font-size: 11px;
  padding: 0 6px;
  height: 20px;
  line-height: 18px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .option-grid {
    grid-template-columns: 1fr;
  }
  
  .anchor-grid {
    grid-template-columns: 1fr;
  }
}

.option-switch {
  margin: 16px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.switch-label {
  color: var(--text-secondary);
  font-size: 14px;
}

.option-buttons {
  margin-top: 16px;
  display: flex;
  gap: 12px;
}

.option-buttons .el-button {
  flex: 1;
}

.option-buttons .el-icon {
  margin-right: 4px;
}

/* 添加新的样式 */
.option-item .el-select {
  width: 100%; /* 确保select占满容器宽度 */
}

/* 确保下拉框内容对齐 */
.option-item :deep(.el-input__wrapper) {
  width: 100%;
}

/* 调整标签和值的布局 */
.option-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: var(--text-secondary);
  min-height: 22px; /* 确保标签高度一致 */
}

/* 确保选择器内容区域宽度一致 */
:deep(.el-select .el-input__wrapper) {
  box-sizing: border-box;
  width: 100%;
}

:deep(.el-select .el-input__inner) {
  width: 100%;
  text-align: left;
}

/* 调整语音调整部分的特定布局 */
.option-section:nth-child(2) .option-grid {
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); /* 稍微减小最小宽度 */
}

.option-section:nth-child(2) .option-item {
  min-width: 0; /* 允许内容收缩 */
}

/* 角色支持提示样式 */
.role-support-hint {
  margin-top: 4px;
  font-size: 12px;
  color: #67C23A;
  display: flex;
  align-items: center;
  gap: 4px;
}

.role-support-hint.unsupported {
  color: #909399;
}

.role-support-hint .el-icon {
  font-size: 14px;
}

/* 禁用状态的下拉框样式优化 */
:deep(.el-select.is-disabled .el-input__wrapper) {
  background-color: var(--el-fill-color-light);
}

:deep(.el-select.is-disabled .el-input__wrapper:hover) {
  border-color: var(--el-border-color);
}

.anchor-features {
  margin-top: 4px;
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.anchor-features .el-tag {
  font-size: 10px;
  padding: 0 4px;
  height: 18px;
  line-height: 16px;
  background-color: rgba(103, 194, 58, 0.1);
  border-color: rgba(103, 194, 58, 0.2);
  color: #67C23A;
}

.anchor-tag {
  position: absolute;
  right: 0;
  top: 0;
  background-color: #ff9800;
  color: white;
  font-size: 10px;
  padding: 2px 4px;
  border-radius: 0 0 0 4px;
}

.free-tts-card {
  margin-top: 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--card-background);
}

.free-tts-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: var(--card-background-light);
  border-bottom: 1px solid var(--border-color-light);
}

.free-tts-header:hover {
  background-color: var(--hover-color);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.free-tts-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.header-actions {
  display: flex;
  align-items: center;
}

.free-tts-content {
  padding: 16px;
  background-color: var(--card-background);
}

.settings-info {
  background-color: rgba(103, 194, 58, 0.05);
  border-radius: 8px;
  padding: 16px;
}

.settings-section {
  margin-bottom: 20px;
}

.settings-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: var(--text-primary);
}

.settings-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  gap: 12px;
}

.settings-label {
  min-width: 100px;
  color: var(--text-secondary);
}

.settings-actions {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 进度条与百分比的布局样式 */
.progress-and-percentage {
  display: flex;
  align-items: center;
  gap: 10px;
}

.quota-progress {
  flex: 1;
}

.quota-percentage {
  font-weight: bold;
  color: var(--primary-color);
  min-width: 50px;
  text-align: right;
}

.quota-text-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.quota-label {
  color: var(--text-secondary);
  font-size: 14px;
}

.connection-status {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}
</style>
