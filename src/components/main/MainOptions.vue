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
                    <el-radio-button value="quota">额度信息</el-radio-button>
                    <el-radio-button value="settings">高级配置</el-radio-button>
                  </el-radio-group>
                </div>
              </div>
              
              <div class="free-tts-content">
                <div class="free-service-highlight">
                  <el-icon color="#67C23A"><Check /></el-icon>
                  <span>推荐使用免费TTS服务，无需配置API密钥即可开始使用</span>
                </div>

                <!-- 额度信息视图 -->
                <div v-if="currentView === 'quota'">
                  <!-- 显示错误信息 -->
                  <FreeTTSErrorDisplay 
                    :error-code="localTTSStore.currentErrorCode" 
                    :error-message="localTTSStore.currentErrorMessage"
                    @refresh="handleRefreshConnection"
                    @action="handleErrorAction"
                  />
                  
                  <!-- 未连接提示 -->
                  <div v-if="!localTTSStore.isServerConnected && localTTSStore.currentErrorCode === 0" class="connection-warning">
                    <el-alert
                      title="未连接到免费TTS服务"
                      type="warning"
                      description="请检查您的网络连接，或点击下方按钮重新连接"
                      show-icon
                      :closable="false"
                    >
                      <template #default>
                      <el-button 
                        size="small" 
                        type="primary" 
                          @click="handleRefreshConnection"
                          :loading="isConnecting"
                        >
                          <el-icon><RefreshRight /></el-icon>
                          重新连接
                        </el-button>
                      </template>
                    </el-alert>
                    </div>
                  
                  <!-- 额度信息 -->
                  <div v-if="localTTSStore.isServerConnected && localTTSStore.serverStatus.freeLimit" class="quota-info">
                    <div class="quota-title">
                      <el-icon><InfoFilled /></el-icon>
                      <span>免费额度信息</span>
                  </div>
                    
                    <div class="quota-progress">
                      <div class="progress-header">
                        <span>已使用:</span>
                        <span class="usage-text">{{ localTTSStore.serverStatus.freeLimit.used }} / {{ localTTSStore.serverStatus.freeLimit.free_limit }} 字符</span>
                    </div>
                      <el-progress 
                        :percentage="localTTSStore.freeLimitUsagePercent" 
                        :status="localTTSStore.freeLimitUsagePercent > 90 ? 'exception' : 'success'"
                        :stroke-width="10"
                        :format="percentFormat"
                      />
                    </div>
                    
                  <div class="quota-details">
                      <div class="detail-item">
                        <el-icon><DocumentChecked /></el-icon>
                        <span>剩余字符:</span>
                        <span class="detail-value">{{ localTTSStore.serverStatus.freeLimit.remaining }} 字符</span>
                    </div>
                      
                      <div class="detail-item">
                        <el-icon><Clock /></el-icon>
                        <span>重置时间:</span>
                        <span class="detail-value">{{ formatResetTime(localTTSStore.serverStatus.freeLimit.reset_at) }}</span>
                      </div>
                      
                      <div v-if="localTTSStore.serverStatus.freeLimit.days_streak" class="detail-item streak-item">
                        <el-icon><Star /></el-icon>
                        <span>连续使用:</span>
                        <span class="detail-value">{{ localTTSStore.serverStatus.freeLimit.days_streak }} 天</span>
                      </div>
                    </div>
                    
                    <div class="quota-actions">
                      <el-button 
                        size="small" 
                        type="primary" 
                        plain
                        @click="handleRefreshConnection"
                        :loading="isConnecting"
                      >
                        <el-icon><RefreshRight /></el-icon>
                        刷新额度
                      </el-button>
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
                        v-model="localTTSStore.config.baseUrl" 
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
              @input="handleVoiceSettingChange"
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
              @input="handleVoiceSettingChange"
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
                @change="handleVoiceSettingChange"
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
                @change="handleVoiceSettingChange"
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
                @change="handleVoiceSettingChange"
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
              @click="$emit('open-voice-selector')"
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
              v-model="localTTSStore.config.baseUrl" 
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
import { useMainOptions } from '@/composables/main-option';
import FreeTTSErrorDisplay from '@/components/main/FreeTTSErrorDisplay.vue';
import { 
  Check, RefreshRight, InfoFilled, DocumentChecked, Clock, Star, ChatDotRound, Microphone,
  Connection, UserFilled, Mic, Aim, Timer, Headset, TrendCharts,
  Reading, Collection, Lightning, Cloudy, CaretRight, ArrowDown, Setting,
  Search, Avatar, Document, Download, Upload, CircleCheckFilled, Close
} from '@element-plus/icons-vue';

// 定义组件的事件
const emit = defineEmits(['open-voice-selector']);

// 导入主要功能
const {
  // 核心数据与状态
  formConfig, 
  localTTSStore,
  oc,
  t,
  
  // 预设相关
  presets,
  currentPreset,
  applyPreset,
  
  // 视图模式
  currentView,

// 语音主播相关
  voiceSelectList,
  voiceStyleSelectList,
  rolePlayList,
  getChineseName,
  getStyleDes,
  getRoleDes,
  
  // 方法处理
  apiChange,
  languageSelectChange,
  voiceSelectChange,
  audition,
  handleVoiceSettingChange,
  
  // 免费TTS功能
  handleRefreshConnection,
  handleErrorAction,
  percentFormat,
  formatResetTime,
  isConnecting,
  
  // 高级设置
  showAdvancedSettings,
  saveAdvancedSettings,
  apiEdge,
  
  // 输出相关功能
  handleBatchDownload,
  handleSaveToCloud,
  
  // 辅助功能
  updateSSML,
  toggleFreeTTSInfo,
  showFreeTTSInfo
} = useMainOptions({}, emit);
</script>

<style scoped>
.modern-options {
  width: 100%;
}

/* 抽屉模式的样式 */
.drawer-mode {
  display: flex;
  flex-direction: column;
  gap: 20px; /* 从24px减小到20px */
}

.option-section {
  background-color: var(--card-background-light, #f5f7fa);
  border-radius: 8px;
  padding: 12px; /* 从16px减小到12px */
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 12px 0; /* 从16px减小到12px */
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

.option-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px; /* 从16px减小到12px */
}

.option-item {
  margin-bottom: 8px; /* 减小底部间距 */
}

.option-label {
  margin-bottom: 4px; /* 减小标签底部间距 */
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
  margin: 8px 0; /* 减小滑块上下间距 */
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
  padding: 10px;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #67c23a;
}

.quota-info {
  margin-top: 15px;
  background-color: var(--surface-color);
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.quota-title {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  color: var(--primary-color);
  font-weight: 500;
  gap: 8px;
}

.quota-progress {
  margin-bottom: 15px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  font-size: 14px;
  color: var(--text-secondary);
}

.usage-text {
  font-weight: 500;
  color: var(--text-primary);
}

.quota-details {
  margin-top: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-secondary);
}

.detail-value {
  font-weight: 500;
  color: var(--text-primary);
  margin-left: auto;
}

.streak-item {
  color: #e6a23c;
}

.quota-actions {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
}

.connection-warning {
  margin-bottom: 15px;
}

/* 免费TTS错误显示样式 */
:deep(.free-tts-error) {
  margin-bottom: 16px;
}

:deep(.el-alert) {
  border-radius: 6px;
}

:deep(.el-alert__title) {
  font-size: 15px;
  font-weight: 500;
}

:deep(.el-alert__description) {
  margin: 5px 0;
  font-size: 14px;
}
</style>
