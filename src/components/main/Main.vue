<template>
  <div class="modern-main">
    <!-- 固定标题栏 -->
    <FixedHeader 
      v-model:isSSMLMode="isSSMLMode"
      :title="page.asideIndex === '1' ? '文本转语音' : '批量处理'"
      :subtitle="page.asideIndex === '1' ? '将文字转换为自然的语音' : '批量处理文本转语音任务'"
    />
    
    <!-- 文本编辑区 -->
    <div class="input-area-card" v-show="page.asideIndex === '1'">
      <div class="card-body">
        <div class="text-area-container">
          <!-- 文本区域头部，添加模式切换按钮 -->
          <div class="text-area-header">
            <div class="text-area-header-left">
              <h3>{{ isSSMLMode ? 'SSML 标记语言' : '输入文本' }}</h3>
              <span class="text-area-hint">{{ isSSMLMode ? '使用SSML可以更精确地控制语音效果，包括语调、停顿和发音' : '在此处输入您想要转换为语音的文本内容' }}</span>
            </div>
            <div class="text-area-header-right">
              <div class="input-mode-toggle">
                <span class="mode-label">输入模式：</span>
                <el-switch
                  v-model="isSSMLMode"
                  active-text="SSML"
                  inactive-text="纯文本"
                  inline-prompt
                  class="mode-switch"
                />
                <el-tooltip
                  v-if="isSSMLMode"
                  content="查看SSML使用指南"
                  placement="top"
                  effect="light"
                >
                  <el-button 
                    size="small" 
                    type="info" 
                    class="ssml-help-button"
                    @click="openSSMLHelp"
                  >
                    <el-icon><QuestionFilled /></el-icon>
                    SSML帮助
                  </el-button>
                </el-tooltip>
              </div>
            </div>
          </div>
          <el-input
            v-if="!isSSMLMode"
            v-model="inputs.inputValue"
            type="textarea"
            :placeholder="t('main.placeholder')"
            class="modern-textarea"
            resize="none"
            :rows="18"
          />
          <el-input 
            v-else
            v-model="inputs.ssmlValue" 
            type="textarea" 
            class="modern-textarea"
            resize="none"
            :rows="18"
          />
          <!-- 文本下方控制区域：简化为文字显示和购买按钮 -->
          <div class="text-footer-controls">
            <!-- 字数限制简化显示 -->
            <div v-if="formConfig.api === 5 && localTTSStore.serverStatus.freeLimit" class="simple-limit-info">
              <el-icon><DocumentChecked /></el-icon>
              <span>每天限制 <b>{{ localTTSStore.serverStatus.freeLimit.free_limit }}</b> 个字符，剩余 <b>{{ localTTSStore.serverStatus.freeLimit.remaining }}</b></span>
              <span v-if="localTTSStore.freeLimitUsagePercent > 90" class="quota-warning">(额度即将用完)</span>
            </div>
            
            <!-- 修改购买按钮文字 -->
            <el-tooltip
              content="使用API解锁无限制使用"
              placement="top"
              effect="light"
            >
              <el-button 
                @click="openApiSite" 
                type="success" 
                size="small"
                class="purchase-button"
              >
                <el-icon><ShoppingCart /></el-icon>
                使用API解锁无限制
              </el-button>
            </el-tooltip>
          </div>
          
          <!-- 移除原有进度条，改为简单文字提示 -->
          <!-- 删除这个div，因为已经和上方合并了 -->
          
        </div>
      </div>
      
      <!-- 简洁控制栏 - 取代原来的浮动控制条 -->
      <div class="compact-controls-bar">
        <div class="compact-selects">
          <el-tooltip
            content="选择语音合成服务提供商"
            placement="top"
            effect="light"
          >
            <el-select
              v-model="formConfig.api"
              size="small"
              placeholder="API"
              class="compact-select"
              @change="apiChange"
            >
              <template #prefix>
                <el-icon><Connection /></el-icon>
              </template>
              <el-option
                v-for="item in apiOptions"
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
          </el-tooltip>
          
          <el-tooltip
            content="选择语音合成的语言"
            placement="top"
            effect="light"
          >
            <el-select
              v-model="formConfig.languageSelect"
              size="small"
              placeholder="语言"
              class="compact-select"
              @change="languageSelectChange"
              filterable
            >
              <template #prefix>
                <el-icon><ChatDotRound /></el-icon>
              </template>
              <el-option
                v-for="item in languageOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-tooltip>
          
          <el-tooltip
            content="选择语音角色"
            placement="top"
            effect="light"
          >
            <el-select
              v-model="formConfig.voiceSelect"
              size="small"
              placeholder="声音"
              class="voice-select"
              @change="voiceSelectChange"
              filterable
            >
              <template #prefix>
                <el-icon><Microphone /></el-icon>
              </template>
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
                  <el-tooltip
                    content="试听声音示例"
                    placement="top"
                    effect="light"
                  >
                    <el-button 
                      size="small" 
                      type="primary" 
                      circle
                      @click.stop="audition(item.ShortName)"
                    >
                      <el-icon><CaretRight /></el-icon>
                    </el-button>
                  </el-tooltip>
                </div>
              </el-option>
            </el-select>
          </el-tooltip>
        </div>
        
        <div class="compact-actions">
          <el-tooltip
            content="选择预设语音主播角色"
            placement="top"
            effect="light"
          >
            <el-button 
              size="small" 
              @click="openVoiceAnchors"
              class="voice-anchors-button"
            >
              <el-icon><Avatar /></el-icon>
              语音主播
            </el-button>
          </el-tooltip>
          
          <el-tooltip
            content="调整语速、音调等高级设置"
            placement="top"
            effect="light"
          >
            <el-button 
              size="small" 
              @click="openSettingsPanel"
              class="settings-button"
            >
              <el-icon><Setting /></el-icon>
              高级设置
            </el-button>
          </el-tooltip>
          
          <div class="action-buttons-group">
            <el-tooltip
              content="使用AI生成文本内容"
              placement="top"
              effect="light"
            >
              <el-button 
                @click="dialogVisible = true" 
                type="info" 
                size="small"
                class="ai-button"
              >
                <el-icon><MagicStick /></el-icon>
                AI生成
              </el-button>
            </el-tooltip>
            
            <el-tooltip
              content="开始转换文本为语音"
              placement="top"
              effect="light"
            >
              <el-button 
                type="primary" 
                @click="startBtn" 
                :loading="isLoading"
                size="small"
                class="start-button"
              >
                <el-icon><CaretRight /></el-icon>
                转换
              </el-button>
            </el-tooltip>
          </div>
        </div>
      </div>
    </div>

    <!-- 设置抽屉 -->
    <el-drawer
      v-model="openSettingsDrawer"
      title="语音高级设置"
      size="450px"
      direction="rtl"
      :append-to-body="true"
      :destroy-on-close="false"
      :with-header="true"
      :show-close="true"
      :modal="true"
      :close-on-click-modal="false"
      :close-on-press-escape="true"
      @open="onDrawerOpen"
      @close="onDrawerClose"
    >
      <template #header>
        <div class="drawer-header" style="padding: 20px;">
          <h3 style="display: flex; align-items: center; gap: 8px; margin: 0 0 8px 0;">
            <el-icon style="font-size: 20px; color: var(--primary-color);"><Setting /></el-icon>
            <span>语音高级设置</span>
          </h3>
          <p style="margin: 0; color: var(--text-secondary); font-size: 14px; line-height: 1.5;">
            在这里可以调整语音的语速、音调和情感等高级参数,让语音更符合您的需求
          </p>
        </div>
      </template>
      <template #default>
        <div class="settings-drawer-content">
          <div class="settings-section">
            <!-- 标题区域 -->
            <div class="section-header">
              <div class="title-row">
                <el-icon style="font-size: 20px; color: var(--primary-color);"><Microphone /></el-icon>
                <span style="font-size: 16px; font-weight: 600; color: var(--text-primary);">语音参数调整</span>
              </div>
              <p style="color: var(--text-secondary); font-size: 14px; margin: 4px 0 0 0;">调整这些参数可以改变语音的表现效果</p>
            </div>
            <MainOptions class="drawer-options" ref="drawerOptions" :in-drawer="true" />
          </div>
          
          <div class="settings-tips">
            <el-alert
              title="使用技巧"
              type="info"
              :closable="false"
              show-icon
            >
              <template #default>
                <p>1. 语速建议保持在0.8-1.2之间,过快或过慢可能影响效果</p>
                <p>2. 音调调整范围建议在0.8-1.2之间,过高或过低可能不自然</p>
                <p>3. 可以使用预设方案快速应用常用场景的参数组合</p>
              </template>
            </el-alert>
          </div>
        </div>
      </template>
    </el-drawer>

    <!-- AI 生成对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="t('main.titleGenerateTextGPT')" 
      width="500px" 
      draggable 
      class="modern-dialog"
    >
      <p class="dialog-description">{{ t('main.descriptionGenerateTextGPT') }}</p>
      <div class="dialog-input">
        <el-input 
          v-model="modalInput" 
          :placeholder="t('main.placeholderGPT')" 
          :disabled="dialogLoading"
          class="dialog-prompt-input"
        ></el-input>
        <el-button 
          type="primary" 
          @click="sendToChatGPT" 
          :loading="dialogLoading"
          class="dialog-submit-button"
        >
          <el-icon><ChatLineSquare /></el-icon>
          <span>生成</span>
        </el-button>
      </div>
    </el-dialog>

    <!-- 批量处理区域 -->
    <div class="batch-area-card" v-show="page.asideIndex === '2'">
      <div class="card-header">
        <h2>{{ t('aside.batch') }}</h2>
        <div class="batch-actions">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :on-change="fileChange"
            :on-remove="fileRemove"
            :show-file-list="false"
            accept=".txt"
            multiple
          >
            <template #trigger>
              <el-button type="primary">
                <el-icon><Upload /></el-icon>
                {{ t('main.selectFiles') }}
              </el-button>
            </template>
          </el-upload>
          <el-button @click="clearAll" class="clear-button">
            <el-icon><DeleteFilled /></el-icon>
            {{ t('main.clearAll') }}
          </el-button>
        </div>
      </div>
      
      <div class="card-body">
        <el-table
          :data="tableData"
          style="width: 100%"
          class="modern-table"
          height="calc(100vh - 300px)"
        >
          <el-table-column
            prop="fileName"
            :label="t('main.fileName')"
            :show-overflow-tooltip="true"
          />
          <el-table-column
            prop="filePath"
            :label="t('main.filePath')"
            :show-overflow-tooltip="true"
          />
          <el-table-column
            prop="fileSize"
            :label="t('main.fileSize')"
            width="80"
            :show-overflow-tooltip="true"
          />
          <el-table-column prop="status" :label="t('main.status')"
          width="100">
            <template #default="scope">
              <div>
                <el-tag
                  class="status-tag"
                  :type="scope.row.status == 'ready' ? 'info' : 'success'"
                  >{{ scope.row.status }}</el-tag
                >
              </div>
            </template>
          </el-table-column>
          <el-table-column :label="t('main.action')" width="120">
            <template #default="scope">
              <template v-if="scope.row.status == 'ready'">
                <el-button
                  size="small"
                  type="danger"
                  @click="handleDelete(scope.$index, scope.row)"
                  >{{t('main.remove')}}</el-button
                >
              </template>
              <template v-else>
                <div class="action-buttons">
                  <el-button
                    size="small"
                    type="primary"
                    @click="play(scope.row)"
                    circle
                    ><el-icon><CaretRight /></el-icon
                  ></el-button>
                  <el-button size="small" @click="openInFolder(scope.row)" circle
                    ><el-icon><FolderOpened /></el-icon
                  ></el-button>
                </div>
              </template>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <!-- 批量处理的控制条 -->
      <div class="compact-controls-bar">
        <div class="compact-selects">
          <el-tooltip
            content="选择语音合成服务提供商"
            placement="top"
            effect="light"
          >
            <el-select
              v-model="formConfig.api"
              size="small"
              placeholder="API"
              class="compact-select"
              @change="apiChange"
            >
              <template #prefix>
                <el-icon><Connection /></el-icon>
              </template>
              <el-option
                v-for="item in apiOptions"
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
          </el-tooltip>
          
          <el-tooltip
            content="选择语音合成的语言"
            placement="top"
            effect="light"
          >
            <el-select
              v-model="formConfig.languageSelect"
              size="small"
              placeholder="语言"
              class="compact-select"
              @change="languageSelectChange"
              filterable
            >
              <template #prefix>
                <el-icon><ChatDotRound /></el-icon>
              </template>
              <el-option
                v-for="item in languageOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-tooltip>
          
          <el-tooltip
            content="选择语音角色"
            placement="top"
            effect="light"
          >
            <el-select
              v-model="formConfig.voiceSelect"
              size="small"
              placeholder="声音"
              class="voice-select"
              @change="voiceSelectChange"
              filterable
            >
              <template #prefix>
                <el-icon><Microphone /></el-icon>
              </template>
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
                  <el-tooltip
                    content="试听声音示例"
                    placement="top"
                    effect="light"
                  >
                    <el-button 
                      size="small" 
                      type="primary" 
                      circle
                      @click.stop="audition(item.ShortName)"
                    >
                      <el-icon><CaretRight /></el-icon>
                    </el-button>
                  </el-tooltip>
                </div>
              </el-option>
            </el-select>
          </el-tooltip>
        </div>
        
        <div class="compact-actions">
          <el-tooltip
            content="选择预设语音主播角色"
            placement="top"
            effect="light"
          >
            <el-button 
              size="small" 
              @click="openVoiceAnchors"
              class="voice-anchors-button"
            >
              <el-icon><Avatar /></el-icon>
              语音主播
            </el-button>
          </el-tooltip>
          
          <el-tooltip
            content="调整语速、音调等高级设置"
            placement="top"
            effect="light"
          >
            <el-button 
              size="small" 
              @click="openSettingsPanel"
              class="settings-button"
            >
              <el-icon><Setting /></el-icon>
              高级设置
            </el-button>
          </el-tooltip>
          
          <div class="action-buttons-group">
            <el-tooltip
              content="使用AI生成文本内容"
              placement="top"
              effect="light"
            >
              <el-button 
                @click="dialogVisible = true" 
                type="info" 
                size="small"
                class="ai-button"
              >
                <el-icon><MagicStick /></el-icon>
                AI生成
              </el-button>
            </el-tooltip>
            
            <el-tooltip
              content="开始转换文本为语音"
              placement="top"
              effect="light"
            >
              <el-button 
                type="primary" 
                @click="startBtn" 
                :loading="isLoading"
                size="small"
                class="start-button"
              >
                <el-icon><CaretRight /></el-icon>
                转换
              </el-button>
            </el-tooltip>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 配置页显示 -->
    <div v-if="page.asideIndex === '3'" class="config-page-container" :key="'config-page'">
      <ConfigPage></ConfigPage>
    </div>
    
    <div v-if="page.asideIndex === '4'" class="doc-page-container" :key="'doc-page'">
      <div v-if="!iframeLoaded && !iframeError" class="iframe-loading">
        <div class="loading-spinner"></div>
        <p>正在加载文档<span class="loading-dots"></span></p>
      </div>
      <iframe 
        ref="docIframe"
        class="doc-frame" 
        :src="iframeCurrentSrc" 
        @load="handleIframeLoad"
        @error="handleIframeError"
        allow="fullscreen"
        referrerpolicy="no-referrer"
        :class="{'iframe-visible': iframeLoaded}"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
      >
      </iframe>
      <div v-if="iframeError" class="iframe-error">
        <el-icon class="error-icon"><WarningFilled /></el-icon>
        <p>加载文档失败，请检查网络连接或尝试备用链接。</p>
        <div class="error-actions">
          <el-button type="primary" @click="reloadIframe">
            <el-icon><RefreshRight /></el-icon> 重新加载
          </el-button>
          <el-button @click="tryAlternativeUrl">
            <el-icon><SwitchButton /></el-icon> 尝试备用链接
          </el-button>
        </div>
      </div>
    </div>

    <!-- 语音主播对话框 -->
    <el-dialog
      v-model="showVoiceAnchorsDialog"
      title="选择语音主播"
      width="80%"
      :close-on-click-modal="false"
      :append-to-body="true"
      destroy-on-close
    >
      <VoiceSelector @select-anchor="onSelectAnchor" />
    </el-dialog>

    <!-- SSML帮助对话框 -->
    <el-dialog
      v-model="ssmlHelpVisible"
      title="SSML 标记语言使用指南"
      width="600px"
      draggable
      class="modern-dialog ssml-help-dialog"
    >
      <div class="ssml-help-content">
        <h3>什么是SSML？</h3>
        <p>语音合成标记语言(SSML)是一种用于控制语音合成的标准化标记语言，可以精确控制语音的语调、停顿、重音等。</p>
        
        <div class="ssml-examples">
          <h3>常用SSML标签</h3>
          
          <div class="ssml-example-item">
            <h4>调整语速</h4>
            <pre>&lt;prosody rate="slow"&gt;这段文字会以较慢的速度播放&lt;/prosody&gt;</pre>
            <p>rate属性可以为: x-slow, slow, medium, fast, x-fast，或者是相对值如 +10% 或 -20%</p>
          </div>
          
          <div class="ssml-example-item">
            <h4>调整音调</h4>
            <pre>&lt;prosody pitch="high"&gt;这段文字会以较高的音调播放&lt;/prosody&gt;</pre>
            <p>pitch属性可以为: x-low, low, medium, high, x-high，或者是相对值如 +10% 或 -20%</p>
          </div>
          
          <div class="ssml-example-item">
            <h4>添加停顿</h4>
            <pre>&lt;break time="2s"/&gt;</pre>
            <p>time属性可以使用具体时间如 1s, 500ms，或者使用预定义值如 none, x-weak, weak, medium, strong, x-strong</p>
          </div>
          
          <div class="ssml-example-item">
            <h4>强调某个词</h4>
            <pre>&lt;emphasis level="strong"&gt;特别强调&lt;/emphasis&gt;这个词</pre>
            <p>level属性可以为: strong, moderate, none</p>
          </div>
        </div>
        
        <div class="ssml-template">
          <h3>完整SSML示例</h3>
          <pre>&lt;speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN"&gt;
今天天气&lt;emphasis level="strong"&gt;非常好&lt;/emphasis&gt;，
&lt;break time="300ms"/&gt;
我们可以&lt;prosody rate="+20%"&gt;一起出去玩&lt;/prosody&gt;。
&lt;/speak&gt;</pre>
        </div>
      </div>
    </el-dialog>

    <!-- Loading组件 -->
    <Loading 
      :visible="isLoading" 
      :progress="convertProgress" 
      :title="loadingTitle"
      :message="loadingMessage"
      @cancel="cancelConversion"
    />

    <!-- 添加在线生成字幕页面 -->
    <div class="content-area" v-show="page.asideIndex === '5'">
      <div class="empty-state">
        <div class="empty-icon">
          <el-icon :size="64"><VideoCameraFilled /></el-icon>
        </div>
        <h2>在线生成字幕</h2>
        <p>该功能正在开发中，敬请期待！</p>
        <el-button type="primary" @click="goToTTS">
          <el-icon><ArrowLeft /></el-icon>
          返回文字转语音
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import { useI18n } from 'vue-i18n';
import i18n from '@/assets/i18n/i18n';
import MainOptions from "./MainOptions.vue";
import VoiceSelector from "./VoiceSelector.vue";
import ConfigPage from "../configpage/ConfigPage.vue";
import { ElMessage } from 'element-plus';
import WebStore from "@/store/web-store";

import { ref, watch, onMounted, nextTick, onUnmounted } from "vue";
import { useTtsStore } from "@/store/store";
import { useLocalTTSStore } from "@/store/local-tts-store";
import { storeToRefs } from "pinia";
import { getTTSData } from "@/store/play";
import Loading from "./Loading.vue";  // 添加Loading组件引用
import FixedHeader from "../header/FixedHeader.vue";  // 添加这一行

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
  ShoppingCart
} from '@element-plus/icons-vue';

// 获取i18n实例
const { t } = useI18n();  
const ttsStore = useTtsStore();
const localTTSStore = useLocalTTSStore();
const { inputs, page, tableData, currMp3Url, config, formConfig, audioPlayer } =
  storeToRefs(ttsStore);

// iframe refs 和加载状态
const docIframe = ref(null);
const iframeLoaded = ref(false);
const iframeError = ref(false);
const docUrl = ref('https://docs.tts88.top/');
const urlIndex = ref(0);
const iframeCurrentSrc = ref('');
const docUrls = [
  'https://docs.tts88.top/',
  'https://henryhu55.github.io/tts-docs',
  'https://tts88.top/docs'
];

// 初始化iframe源
const initIframe = () => {
  iframeCurrentSrc.value = '';
  
  // 在清除src后，立即设置容器和iframe样式以确保正确显示
  nextTick(() => {
    // 修改页面主容器样式，保留基本结构但减少内边距
    const mainContainer = document.querySelector('.modern-main');
    if (mainContainer instanceof HTMLElement && page.value.asideIndex === '4') {
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
const handleIframeMessage = (event: MessageEvent) => {
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
const sendMessageToIframe = (message: any) => {
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
const handleIframeLoad = (event: Event) => {
  console.log('iframe 加载事件触发');
  
  // 检查iframe是否完全加载且可访问
  try {
    const iframe = event.target as HTMLIFrameElement;
    
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
  if (mainContainer instanceof HTMLElement && page.value.asideIndex === '4') {
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
const handleIframeError = (event: Event) => {
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

// 监听页面索引变化
watch(() => page.value.asideIndex, (newIndex, oldIndex) => {
  console.log(`页面索引从 ${oldIndex} 变更为 ${newIndex}`);
  
  if (newIndex === '4') {
    console.log('进入文档页面');
    // 进入文档页面时重置状态
    iframeLoaded.value = false;
    iframeError.value = false;
    
    // 确保iframe加载正确的URL
    initIframe();
    
    // 300ms后尝试调整高度，以确保DOM已完全渲染
    setTimeout(() => {
      adjustIframeHeight();
    }, 300);
  }
}, { immediate: true });

// 监听主题变化，通知iframe
watch(() => document.body.classList.contains('dark-theme'), (isDarkTheme) => {
  // 向iframe发送主题变更消息
  if (page.value.asideIndex === '4' && iframeLoaded.value) {
    sendMessageToIframe({
      type: 'themeChange',
      theme: isDarkTheme ? 'dark' : 'light'
    });
  }
});

// 定义单独的处理函数，以便可以正确地添加和删除监听器
const handleKeyDown = (e) => {
  // ESC键关闭抽屉
  if (e.key === 'Escape' && openSettingsDrawer.value) {
    openSettingsDrawer.value = false;
  }
};

// 组件挂载时
onMounted(() => {
  console.log('Main 组件已挂载, 当前页面索引:', page.value.asideIndex);
  
  // 设置默认API为免费TTS服务
  formConfig.value.api = 5;
  
  // 初始化抽屉状态
  openSettingsDrawer.value = false;
  
  // 添加窗口消息监听，以便文档页面能够与主应用通信
  window.addEventListener('message', handleIframeMessage);
  
  // 添加窗口大小变化监听
  window.addEventListener('resize', handleResize);
  
  // 如果当前使用的是免费TTS服务，自动检查连接和获取额度
  if (formConfig.value.api === 5) {
    checkTTSServiceStatus();
    // 提示用户正在使用免费服务
    ElMessage({
      message: "您正在使用免费TTS服务，无需API密钥即可开始使用",
      type: "success",
      duration: 3000,
    });
  }
  
  // 初始化状态
  if (page.value.asideIndex === '4') {
    console.log('组件初始化时，页面索引已经是文档页');
    initIframe();
    
    // 延迟调整高度
    setTimeout(() => {
      adjustIframeHeight();
    }, 500);
  }
  
  // 添加全局快捷键事件监听，用于抽屉控制
  document.addEventListener('keydown', handleKeyDown);
});

// 检查免费TTS服务状态
const checkTTSServiceStatus = async () => {
  try {
    // 检查连接状态
    const connected = await localTTSStore.checkServerConnection();
    if (connected) {
      // 获取免费额度信息
      await localTTSStore.getFreeLimitInfo();
    }
  } catch (error) {
    console.error('检查免费TTS服务状态失败:', error);
  }
};

// 按需加载组件，仅当需要时才进行渲染
const updateComponent = () => {
  console.log('Main 组件已更新, 当前页面索引:', page.value.asideIndex);
  
  if (page.value.asideIndex === '4') {
    const docPageContainer = document.querySelector('.doc-page-container');
    console.log('文档页面渲染状态:', {
      iframeLoaded: iframeLoaded.value,
      iframeError: iframeError.value,
      docPageVisible: docPageContainer ? docPageContainer.getBoundingClientRect().height > 0 : false,
      docIframeRef: docIframe.value ? '已获取' : '未获取',
      containerHeight: docPageContainer?.clientHeight
    });
    
    // 组件更新时也尝试调整高度
    if (iframeLoaded.value && !iframeError.value) {
      nextTick(() => {
        adjustIframeHeight();
      });
    }
  }
};

// SSML内容和文本框内容同步
watch(
  () => inputs.value.inputValue,
  (newValue) => {
    ttsStore.setSSMLValue(newValue);
  }
);

const showModal = ref(false);
const modalInput = ref('');
const dialogLoading = ref(false);
const dialogVisible = ref(false);

const sendToChatGPT = async () => {
  if (!modalInput.value) {
    ElMessage({
      message: "请输入提示文本",
      type: "warning",
      duration: 2000,
    });
    return;
  }
  
  // 检查是否配置了openAIKey
  if (!config.value.openAIKey) {
    ElMessage({
      message: "请先在设置页面配置OpenAI Key",
      type: "error",
      duration: 3000,
    });
    return;
  }
  
  dialogLoading.value = true;
  try {
    await ttsStore.startChatGPT(modalInput.value);
    dialogVisible.value = false;
  } catch (error) {
    console.error("GPT生成失败:", error);
  } finally {
    dialogLoading.value = false;
  }
};

const handleTabClick = (tab: any) => {
  page.value.tabIndex = tab.props.name;
};

const uploadRef = ref();

const handleDelete = (index: number, row: any) => {
  uploadRef.value?.handleRemove(row.file);
};

const fileChange = (uploadFile: any, uploadFiles: any) => {
  // 处理每个上传的文件
  Promise.all(uploadFiles.map(async (item: any) => {
    // 读取文件内容
    const reader = new FileReader();
    return new Promise((resolve) => {
      reader.onload = (e) => {
        resolve({
          fileName: item.name,
          filePath: item.raw.path,
          fileSize: item.size,
          status: "ready",
          file: item,
          content: e.target?.result as string
        });
      };
      reader.readAsText(item.raw);
    });
  })).then((results) => {
    tableData.value = results;
  });
};

const fileRemove = (uploadFile: any, uploadFiles: any) => {
  // 处理每个剩余的文件
  Promise.all(uploadFiles.map(async (item: any) => {
    // 如果文件已经有内容，直接使用
    if (item.content) {
      return {
        fileName: item.name,
        filePath: item.raw.path,
        fileSize: item.size,
        status: "ready",
        file: item,
        content: item.content
      };
    }
    // 否则重新读取文件内容
    const reader = new FileReader();
    return new Promise((resolve) => {
      reader.onload = (e) => {
        resolve({
          fileName: item.name,
          filePath: item.raw.path,
          fileSize: item.size,
          status: "ready",
          file: item,
          content: e.target?.result as string
        });
      };
      reader.readAsText(item.raw);
    });
  })).then((results) => {
    tableData.value = results;
  });
};

const clearAll = () => {
  tableData.value = [];
  uploadRef.value?.clearFiles();
};

const play = (val: any) => {
  // 在 web 版本中直接使用保存的音频 URL 播放
  if (audioPlayer.value) {
    (audioPlayer.value as HTMLAudioElement).pause();
  }
  
  if (val.audioUrl) {
    const audioElement = new Audio(val.audioUrl);
    audioPlayer.value = audioElement;
    audioElement.play();
    ElMessage({
      message: "正在播放",
      type: "success",
      duration: 2000,
    });
  } else {
    ElMessage({
      message: "没有可播放的音频",
      type: "warning",
      duration: 2000,
    });
  }
};

const openInFolder = (val: any) => {
  // Web版本不支持打开文件夹，改为下载功能
  if (val.audioUrl) {
    const a = document.createElement('a');
    a.href = val.audioUrl;
    a.download = val.fileName.split('.')[0] + '.mp3';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    ElMessage({
      message: "开始下载音频文件",
      type: "success",
      duration: 2000,
    });
  } else {
    ElMessage({
      message: "没有可下载的音频",
      type: "warning",
      duration: 2000,
    });
  }
};

// 调试文档页面
const debugDocument = () => {
  console.log('手动检查文档页面状态');
  
  // 强制将页面索引设置为文档页
  if (page.value.asideIndex !== '4') {
    console.log('强制切换到文档页面');
    page.value.asideIndex = '4';
  } else {
    // 如果已经在文档页面，则重新加载iframe
    reloadIframe();
  }
};

// 单独定义resize处理函数以便于移除
const handleResize = () => {
  if (page.value.asideIndex === '4') {
    nextTick(() => {
      adjustIframeHeight();
    });
  }
};

// 添加卸载时的清理函数
onUnmounted(() => {
  window.removeEventListener('message', handleIframeMessage);
  window.removeEventListener('resize', handleResize);
  
  // 移除键盘事件监听器
  document.removeEventListener('keydown', handleKeyDown);
  
  // 确保抽屉关闭
  openSettingsDrawer.value = false;
});

const openSettingsDrawer = ref(false);
const drawerOptions = ref(null);

// 从MainOptions.vue导入的options-config
import { optionsConfig } from "./options-config";

// 选项列表
const apiOptions = optionsConfig.apiSelect;
const languageOptions = optionsConfig.languageSelect;

// 当前可用的声音列表
const voiceSelectList = ref(
  optionsConfig.findVoicesByLocaleName(formConfig.value.languageSelect)
);

// 移除原来的 getChineseName 函数
const getChineseName = (shortName: string) => {
  if (!shortName) return '';
  
  // 从ShortName中提取名称部分
  const nameParts = shortName.split('-');
  
  // 处理特殊情况
  if (nameParts.length < 3) {
    // 处理特殊情况，如shandong
    if (shortName.toLowerCase() === 'shandong') {
      return 'Shandong-山东';
    }
    return shortName;
  }
  
  // 特殊处理方言格式：zh-CN-henan-YundengNeural
  if (nameParts.length >= 4) {
    const region = nameParts[0] + '-' + nameParts[1]; // 如zh-CN
    const dialect = nameParts[2].toLowerCase(); // 如henan
    const name = nameParts[3].replace('Neural', ''); // 如Yundeng
    
    // 方言映射
    const dialectMap: {[key: string]: string} = {
      'shaanxi': '陕西方言',
      'henan': '河南方言',
      'liaoning': '东北方言',
      'shandong': '山东方言',
      'shanghai': '上海方言',
      'sichuan': '四川方言',
      'tianjin': '天津方言',
      'hebei': '河北方言',
      'shanxi': '山西方言',
      'gansu': '甘肃方言',
      'anhui': '安徽方言',
      'hubei': '湖北方言',
      'honghu': '洪湖方言',
      'yunnan': '云南方言'
    };
    
    if (dialectMap[dialect]) {
      // 中文名称映射
      const nameMap: {[key: string]: string} = {
        'Yundeng': '云登',
        'Yunfeng': '云枫',
        'Yunhao': '云皓',
        'Yunxia': '云霞',
        'Yunxi': '云熙',
        'Yunye': '云叶',
        'Yunyang': '云阳',
        'Yunxiang': '云翔',
        'Xiaoxuan': '晓萱',
        'Xiaochen': '晓辰',
        'Xiaoshuang': '晓双'
        // 其他名称可以根据需要添加
      };
      
      if (nameMap[name]) {
        return `${name}-${dialectMap[dialect]}·${nameMap[name]}`;
      } else {
        return `${name}-${dialectMap[dialect]}`;
      }
    }
  }
  
  // 提取区域和名称
  const region = nameParts[0] + '-' + nameParts[1]; // 如zh-CN, zh-TW, zh-HK, yue-CN, wuu-CN
  const name = nameParts[2].replace('Neural', '');
  
  // 中文名称映射
  const nameMap: {[key: string]: string} = {
    // 中国大陆 (zh-CN)
    'Xiaoxuan': '晓萱', 
    'Xiaochen': '晓辰',
    'Xiaoxiao': '晓晓',
    'Xiaohan': '晓涵',
    'Xiaozhen': '晓甄',
    'Yunjian': '云健',
    'Xiaoyan': '晓颜',
    'Xiaoyi': '晓伊',
    'Yunxi': '云熙',
    'Xiaomo': '晓墨',
    'Yunye': '云叶',
    'Yunxia': '云霞',
    'Xiaorui': '晓瑞',
    'Xiaoshuang': '晓双',
    'Yunfeng': '云枫',
    'Yunhan': '云翰',
    'Kangkang': '康康',
    'Zhangyu': '章宇',
    'Yunhao': '云皓',
    'Xiaomeng': '晓梦',
    'Yunze': '云泽',
    'Xiaoqiu': '晓秋',
    'Xiaoyou': '晓悠',
    'Yunyang': '云阳',
    'Yundeng': '云登',
    'YunJhe': '云杰',
    'Yunxiang': '云翔',
    'HsiaoYu': '小语',
    'WanLung': '万龙',
    'HiuMaan': '晓曼',
    'HiuGaai': '晓佳',
    'Xiaoni': '晓妮',
    'HsiaoChen': '小陈',
    'Xiaobei': '晓贝',
    'Yunni': '云妮',
    'Yunyi': '云怡',
    'Yunxuan': '云轩',
    'Xiaohui': '晓慧',
    
    // 粤语 (yue-CN)
    'XiaoMin': '小敏',
    'YunSong': '云松',
    'XiaoRong': '小蓉',
    'YunZa': '云扎',
    'XiaoYu': '晓瑜',
    'WanLu': '婉露',
    'XiuYin': '秀英',
    'YunJun': '云军',
    
    // 吴语 (wuu-CN)
    'Xiaotong': '晓彤',
    'Yunzhe': '云哲',
    
    // 方言
    'Honghu': '洪湖',
    'Liaoning': '辽宁',
    'Shaanxi': '陕西',
    'Henan': '河南',
    'Yunnan': '云南',
    'Sichuan': '四川',
    'Tianjin': '天津',
    'Shanxi': '山西',
    'Hebei': '河北',
    'Gansu': '甘肃',
    'Anhui': '安徽',
    
    // 台湾地区 (zh-TW) - 使用繁体中文名称
    'HsiaoChen': '曉臻',
    'HsiaoYu': '曉雨',
    'YunJhe': '雲哲',
    
    // 香港地区 (zh-HK) - 使用繁体中文名称
    'HiuMaan': '曉曼',
    'HiuGaai': '曉佳',
    'WanLung': '雲龍'
  };
  
  // 区域特定名称
  const regionNames: {[region: string]: {[key: string]: string}} = {
    'zh-CN': {
      'YunJhe': '云杰'
    },
    'zh-TW': {
      'HsiaoChen': '曉臻',
      'HsiaoYu': '曉雨',
      'YunJhe': '雲哲'
    },
    'zh-HK': {
      'HiuMaan': '曉曼',
      'HiuGaai': '曉佳',
      'WanLung': '雲龍'
    },
    'yue-CN': {
      'XiaoMin': '小敏',
      'YunSong': '云松',
      'XiaoRong': '小蓉',
      'YunZa': '云扎',
      'XiaoYu': '晓瑜',
      'WanLu': '婉露',
      'XiuYin': '秀英',
      'YunJun': '云军'
    },
    'wuu-CN': {
      'Xiaotong': '晓彤',
      'Yunzhe': '云哲'
    }
  };
  
  // 检查是否有区域特定的名称
  if (regionNames[region] && regionNames[region][name]) {
    return `${name}-${regionNames[region][name]}`;
  }
  
  // 使用通用名称映射
  if (nameMap[name]) {
    // 对于粤语区域，在中文名前添加"粤语"标识
    if (region === 'yue-CN') {
      return `${name}-粤语·${nameMap[name]}`;
    }
    
    // 对于吴语区域，在中文名前添加"吴语"标识
    if (region === 'wuu-CN') {
      return `${name}-吴语·${nameMap[name]}`;
    }
    
    // 对于方言区域，添加对应方言标识
    if (name === 'Shaanxi' || name === 'shaanxi') {
      return `${name}-陕西方言`;
    }
    if (name === 'Henan' || name === 'henan') {
      return `${name}-河南方言`;
    }
    if (name === 'Liaoning' || name === 'liaoning') {
      return `${name}-东北方言`;
    }
    if (name === 'Shandong' || name === 'shandong') {
      return `${name}-山东方言`;
    }
    if (name === 'Shanghai' || name === 'shanghai') {
      return `${name}-上海方言`;
    }
    if (name === 'Sichuan' || name === 'sichuan') {
      return `${name}-四川方言`;
    }
    if (name === 'Tianjin' || name === 'tianjin') {
      return `${name}-天津方言`;
    }
    if (name === 'Hebei' || name === 'hebei') {
      return `${name}-河北方言`;
    }
    if (name === 'Shanxi' || name === 'shanxi') {
      return `${name}-山西方言`;
    }
    if (name === 'Gansu' || name === 'gansu') {
      return `${name}-甘肃方言`;
    }
    if (name === 'Anhui' || name === 'anhui') {
      return `${name}-安徽方言`;
    }
    if (name === 'Hubei' || name === 'hubei') {
      return `${name}-湖北方言`;
    }
    if (name === 'Honghu' || name === 'honghu') {
      return `${name}-洪湖方言`;
    }
    if (name === 'Yunnan' || name === 'yunnan') {
      return `${name}-云南方言`;
    }
    
    return `${name}-${nameMap[name]}`;
  }
  
  return shortName;
};

// 调用试听函数
const audition = async (value: string) => {
  // 如果有抽屉打开，则关闭
  openSettingsDrawer.value = false;
  
  // 打印开始试听的声音
  console.log("开始试听声音:", value);
  
  // 创建临时的SSML用于试听
  const tempInput = inputs.value.inputValue;
  const tempSSML = inputs.value.ssmlValue;
  const tempVoice = formConfig.value.voiceSelect; // 保存当前的声音设置
  
  try {
    // 临时设置声音
    formConfig.value.voiceSelect = value;
    console.log("试听设置声音为:", formConfig.value.voiceSelect);
    
    // 使用试听文本生成SSML
    inputs.value.inputValue = "你好，这是一段试听文本。";
    ttsStore.setSSMLValue();
    console.log("试听生成的SSML:", inputs.value.ssmlValue);
    
    // 开始转换并播放
    const voiceData = {
      activeIndex: page.value.tabIndex,
      ssmlContent: inputs.value.ssmlValue,
      inputContent: inputs.value.inputValue,
      retryCount: config.value.retryCount,
      retryInterval: config.value.retryInterval,
    };
    
    // 检查API URL是否为空
    if (!config.value.thirdPartyApi && formConfig.value.api === 4) {
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
    formConfig.value.voiceSelect = tempVoice; // 恢复原始声音设置
    console.log("试听结束，恢复声音设置为:", formConfig.value.voiceSelect);
    isLoading.value = false;
  }
};

// API变更处理
const apiChange = (value: number) => {
  // 检查API密钥是否已配置
  if (value === 1 && config.value.speechKey === "") {
    ElMessage({
      message: "请先在设置中配置 Microsoft Speech API Key，或者推荐使用免费TTS服务",
      type: "warning",
      duration: 4000,
    });
    // 如果没有配置key，自动切换回免费TTS服务
    formConfig.value.api = 5;
    return;
  } else if (value === 3 && (config.value.speechKey === "" || config.value.serviceRegion === "")) {
    ElMessage({
      message: "请先在设置中配置 Azure Speech API Key 和区域",
      type: "warning",
      duration: 4000,
    });
    // 如果没有配置key，自动切换回免费TTS服务
    formConfig.value.api = 5;
    return;
  } else if (value === 4 && config.value.thirdPartyApi === "") {
    ElMessage({
      message: "请先在设置中配置TTS88 API地址",
      type: "warning",
      duration: 4000,
    });
    // 如果没有配置API地址，自动切换回免费TTS服务
    formConfig.value.api = 5;
    return;
  } else if (value === 4 && config.value.thirdPartyApi !== "") {
    // TTS88 API提示
    ElMessage({
      message: "您已选择TTS88 API，可以无限制使用",
      type: "success",
      duration: 3000,
    });
  } else if (value === 5) {
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
        localTTSStore.getFreeLimitInfo();
      }
    });
  }
};

// 语言变更处理
const languageSelectChange = (value: string) => {
  console.log("语言变更为:", value);
  
  // 清除当前选择的声音
  formConfig.value.voiceSelect = "";
  
  // 获取新语言下的声音列表
  voiceSelectList.value = optionsConfig.findVoicesByLocaleName(value);
  console.log(`找到${value}的声音列表:`, voiceSelectList.value.length, "个声音");
  
  // 如果有声音，选择第一个作为默认值
  if (voiceSelectList.value.length > 0) {
    const firstVoice = voiceSelectList.value[0].ShortName;
    console.log("自动选择第一个声音:", firstVoice);
    formConfig.value.voiceSelect = firstVoice;
    
    // 更新SSML内容
    ttsStore.setSSMLValue();
  } else {
    console.warn(`语言${value}没有可用的声音`);
  }
  
  // 确保更新配置到本地存储
  ttsStore.addFormConfig();
};

// 声音变更处理
const voiceSelectChange = (value: string) => {
  // 更新声音选择
  console.log("声音变更为:", value);
  
  // 保存选择的声音到formConfig
  formConfig.value.voiceSelect = value;
  
  // 显式地打印当前formConfig中的声音值
  console.log("formConfig中的声音值:", formConfig.value.voiceSelect);
  
  // 当声音变更时，更新SSML内容
  ttsStore.setSSMLValue();
  
  // 在选择新声音后，更新声音样式列表
  const selectedVoice = voiceSelectList.value.find(
    (v) => v.ShortName === value
  );
  
  if (selectedVoice && selectedVoice.VoiceStyleNames) {
    console.log("可用样式:", selectedVoice.VoiceStyleNames);
  }
  
  // 保存声音选择到本地存储，确保持久化
  const store = new WebStore();
  if (formConfig.value.voiceSelect !== value) {
    console.error("声音值未正确保存到formConfig!");
  }
  
  // 确保更新配置
  ttsStore.addFormConfig();
};

// 开始转换按钮
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
  
  // 在启动转换前检查并打印当前声音设置
  console.log("转换前检查 - 当前选择的声音:", formConfig.value.voiceSelect);
  
  // 确保SSML中使用的是当前选择的声音
  ttsStore.setSSMLValue();
  
  // 确保更新配置到本地存储
  ttsStore.addFormConfig();
  
  // 显示Loading组件
  isLoading.value = true;
  convertProgress.value = 0;
  loadingTitle.value = '正在生成语音';
  loadingMessage.value = '请稍候，正在处理您的请求...';
  
  // 模拟进度更新
  const progressInterval = setInterval(() => {
    if (convertProgress.value < 90) {
      convertProgress.value += Math.random() * 5;
    }
  }, 300);
  
  // 启动转换过程
  ttsStore.start().then(() => {
    // 转换完成
    clearInterval(progressInterval);
    convertProgress.value = 100;
    
    // 短暂显示100%后隐藏Loading
    setTimeout(() => {
      isLoading.value = false;
      convertProgress.value = 0;
    }, 500);
  }).catch(error => {
    // 转换出错
    clearInterval(progressInterval);
    isLoading.value = false;
    convertProgress.value = 0;
    
    ElMessage({
      message: "转换失败: " + (error instanceof Error ? error.message : String(error)),
      type: "error",
      duration: 3000,
    });
  });
};

// 添加函数用于打开设置抽屉
const openSettingsPanel = () => {
  console.log('打开设置抽屉');
  
  // 首先尝试关闭再打开，以解决可能的状态问题
  openSettingsDrawer.value = false;
  
  // 使用setTimeout确保DOM已更新
  setTimeout(() => {
    openSettingsDrawer.value = true;
    
    // 重新格式化SSML
    if (inputs.value.ssmlValue) {
      inputs.value.ssmlValue = formatXML(inputs.value.ssmlValue);
    }
    
    // 添加调试信息
    console.log('抽屉状态:', openSettingsDrawer.value);
    
    // 检查抽屉元素是否存在
    nextTick(() => {
      const drawerElement = document.querySelector('.el-drawer');
      if (drawerElement) {
        console.log('抽屉元素存在，样式:', {
          display: window.getComputedStyle(drawerElement).display,
          zIndex: window.getComputedStyle(drawerElement).zIndex,
          position: window.getComputedStyle(drawerElement).position
        });
      } else {
        console.warn('抽屉元素不存在，可能是DOM未更新或选择器错误');
        
        // 尝试使用更通用的选择器
        const anyDrawer = document.querySelector('[role="dialog"]');
        if (anyDrawer) {
          console.log('找到对话框元素:', anyDrawer);
        }
      }
    });
  }, 50);
};

// 处理抽屉打开事件
const onDrawerOpen = () => {
  console.log('抽屉已打开');
  // 抽屉打开时确保DOM已更新
  nextTick(() => {
    const drawerElement = document.querySelector('.el-drawer');
    if (drawerElement) {
      drawerElement.style.zIndex = '2001';
      // 确保子组件已加载
      if (drawerOptions.value) {
        console.log('抽屉内组件已加载');
      }
    }
  });
};

// 处理抽屉关闭事件
const onDrawerClose = () => {
  console.log('抽屉已关闭');
};

// 添加变量和函数，用于处理语音主播
const showVoiceAnchorsDialog = ref(false);

// 打开语音主播对话框
const openVoiceAnchors = () => {
  console.log('打开语音主播');
  showVoiceAnchorsDialog.value = true;
};

// 处理选择主播事件
const onSelectAnchor = (anchor) => {
  console.log('选择主播:', anchor);
  if (anchor && anchor.config) {
    // 保存当前选择的语音样式，稍后可能需要重用
    const selectedStyle = anchor.config.voiceStyleSelect || 'Default';
    
    // 应用主播配置前先记录声音
    console.log('应用主播配置，选择声音从:', formConfig.value.voiceSelect, '变更为:', anchor.config.voiceSelect);
    
    // 应用主播配置
    formConfig.value = {...anchor.config};
    
    // 记录语言和声音
    console.log('选择主播后的语言和声音:', {
      language: formConfig.value.languageSelect,
      voice: formConfig.value.voiceSelect
    });
    
    // 更新声音选择列表
    voiceSelectList.value = optionsConfig.findVoicesByLocaleName(formConfig.value.languageSelect);
    
    // 检查是否需要更新声音样式列表并应用正确的样式
    const selectedVoice = voiceSelectList.value.find(
      (v) => v.ShortName === formConfig.value.voiceSelect
    );
    
    if (selectedVoice) {
      console.log('找到选择的声音:', selectedVoice.ShortName);
      
      // 获取可用的样式列表
      const availableStyles = selectedVoice.VoiceStyleNames?.split(",") || [];
      
      // 如果之前选择的样式可用，则使用它；否则使用第一个可用样式或Default
      if (availableStyles.length > 0) {
        formConfig.value.voiceStyleSelect = availableStyles.includes(selectedStyle) ? 
          selectedStyle : availableStyles[0];
      } else {
        formConfig.value.voiceStyleSelect = 'Default';
      }
    } else {
      console.error('无法找到选择的声音:', formConfig.value.voiceSelect);
    }
    
    // 更新SSML内容以使用新声音
    ttsStore.setSSMLValue();
    
    // 保存更新后的配置
    ttsStore.addFormConfig();
    
    ElMessage({
      message: `已应用语音主播：${anchor.name}，声音设置为：${formConfig.value.voiceSelect}`,
      type: 'success',
      duration: 2000
    });
  }
  showVoiceAnchorsDialog.value = false;
};

// 获取显示名称
const getDisplayLabel = (value: string) => {
  return getChineseName(value) || value;
};

// 添加SSML帮助对话框
const ssmlHelpVisible = ref(false);

// 打开SSML帮助
const openSSMLHelp = () => {
  ssmlHelpVisible.value = true;
};

// 添加相关的变量和方法
const isLoading = ref(false);
const convertProgress = ref(0);
const loadingTitle = ref('正在生成语音');
const loadingMessage = ref('请稍候，正在处理您的请求...');

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

const isSSMLMode = ref(false);

// 添加XML格式化函数
const formatXML = (xml: string) => {
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
  const rateValue = (config.speed * 100).toFixed(); // 直接使用速度值乘以100
  const pitchValue = (config.pitch * 100 - 100).toFixed(); // 将音调值转换为百分比变化
  
  // 生成完整的SSML - 修改命名空间为https
  const ssml = '<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="en-US">\n' +
    '  <voice name="' + config.voiceSelect + '">\n' +
    '    <mstts:express-as ' + styleAttr + ' ' + roleAttr + ' ' + intensityAttr + '>\n' +
    '      <prosody rate="' + rateValue + '%" pitch="' + pitchValue + '%" ' + volumeAttr + '>\n' +
    '        ' + silenceConfig + inputs.value.inputValue + '\n' +
    '      </prosody>\n' +
    '    </mstts:express-as>\n' +
    '  </voice>\n' +
    '</speak>';
  
  // 格式化并设置SSML
  inputs.value.ssmlValue = formatXML(ssml);
}

// 监听SSML值的变化
watch(() => inputs.value.ssmlValue, (newValue) => {
  if (newValue && !newValue.includes('\n')) {  // 只在非格式化的情况下进行格式化
    inputs.value.ssmlValue = formatXML(newValue);
  }
});

// 监听抽屉打开状态
watch(() => openSettingsDrawer.value, (newValue) => {
  if (newValue && inputs.value.ssmlValue) {
    // 当抽屉打开时，确保SSML是格式化的
    nextTick(() => {
      inputs.value.ssmlValue = formatXML(inputs.value.ssmlValue);
    });
  }
});

// 添加在线生成字幕页面
const goToTTS = () => {
  // 跳转到文字转语音页面
  console.log('跳转到文字转语音页面');
  page.value.asideIndex = '1';
};

// 打开API购买页面
const openApiSite = () => {
  window.open("https://api.tts88.top", "_blank");
  console.log('打开API购买页面');
};
</script>

<style>
/* 全局样式，确保抽屉在所有场景下都能正确显示 */

/* 购买按钮样式 */
.purchase-button {
  height: 32px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 6px !important;
  background: linear-gradient(135deg, #67c23a, #85ce61) !important;
  border: none !important;
  box-shadow: 0 2px 6px rgba(103, 194, 58, 0.3) !important;
  transition: all 0.3s ease !important;
}

.purchase-button:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 4px 8px rgba(103, 194, 58, 0.4) !important;
}

.purchase-button .el-icon {
  font-size: 14px !important;
}

/* 简化样式，减少占用空间 */
.text-footer-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 10px 0 5px 0;
  gap: 10px;
}

/* 合并后的字数限制信息样式 */
.simple-limit-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-secondary);
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.1), rgba(100, 180, 255, 0.15));
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid rgba(64, 158, 255, 0.2);
  min-height: 32px;
}

.simple-limit-info .el-icon {
  color: var(--primary-color);
  font-size: 16px;
}

.simple-limit-info b {
  color: var(--primary-color);
  font-weight: 600;
}

/* 当配额接近用完时的警告样式 */
.quota-warning {
  color: var(--error-color);
  font-weight: 500;
}

/* 添加分组样式，让AI生成按钮和转换按钮放在一起 */
.action-buttons-group {
  display: flex;
  gap: 10px;
  margin-left: 5px;
}

/* 调整AI生成按钮样式，与其他按钮保持一致 */
.ai-button {
  height: 32px !important;
  line-height: 32px !important;
  font-size: 13px !important;
  padding: 0 12px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 4px !important;
}

.ai-button .el-icon {
  font-size: 14px !important;
}

.option-section {
  background-color: var(--card-background-light, #f5f7fa);
  border-radius: 8px;
  padding: 20px;
}


.option-section {
  background-color: var(--card-background-light, #f5f7fa);
  border-radius: 8px;
  padding: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 16px 0;
  padding: 0 0 8px 0; /* 移除左侧padding */
  border-bottom: 1px solid var(--border-color);
}

.section-header {
  padding: 0; /* 移除左侧padding */
  margin-bottom: 16px;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.title-row .el-icon {
  font-size: 20px;
  color: var(--primary-color);
}

.title-row span {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.section-desc {
  color: var(--text-secondary);
  font-size: 14px;
  margin: 0;
}

/* 响应式调整 */
@media screen and (max-width: 768px) {
  .section-title,
  .section-header {
    padding-left: 0; /* 移除左侧padding */
  }
}

.el-drawer {
  --el-drawer-padding-primary: 0 !important;
  z-index: 2001 !important;
}

.el-drawer__header {
  margin-bottom: 0 !important;
  padding: 2px 20px !important;
  border-bottom: 1px solid var(--el-border-color-lighter) !important;
  font-size: 18px !important;
  font-weight: 600 !important;
}

.el-drawer__body {
  padding: 0 !important;
  overflow-y: auto !important;
  height: calc(100% - 60px) !important;
}

.el-drawer__content {
  overflow: hidden !important;
}

.el-overlay {
  z-index: 2000 !important;
}

/* 文本区域样式增强 */
.text-area-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.text-area-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.text-area-header-left {
  flex: 1;
}

.text-area-header-right {
  display: flex;
  align-items: center;
}

.input-mode-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(var(--card-background-rgb), 0.8);
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.mode-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.mode-switch {
  margin: 0 4px;
}

.ssml-help-button {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 6px;
}

.modern-textarea {
  border-radius: var(--border-radius-medium) !important;
  transition: all var(--transition-normal);
  border: 1px solid var(--border-color);
  background-color: var(--card-background);
  box-shadow: var(--shadow-light);
}

.modern-textarea:focus-within {
  box-shadow: 0 0 0 3px rgba(74, 108, 247, 0.15);
  border-color: var(--primary-color);
}

.modern-textarea .el-textarea__inner {
  font-family: 'Inter', 'Helvetica Neue', Helvetica, 'PingFang SC', sans-serif;
  font-size: 15px;
  line-height: 1.6;
  color: var(--text-primary);
  background-color: transparent;
}

/* 控制栏样式增强 */
.compact-controls-bar {
  background-color: rgba(0, 0, 0, 0.03);
  padding: 16px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

:root[theme-mode="dark"] .compact-controls-bar {
  background-color: rgba(255, 255, 255, 0.03);
}

.compact-selects {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.compact-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.voice-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.start-button {
  font-weight: 600;
  min-width: 90px;
}

/* 抽屉样式增强 */
.drawer-header {
  background-color: var(--card-background);
  border-bottom: 1px solid var(--border-color);
  padding: 20px;  /* 修改padding与内容区域一致 */
  margin-bottom: 0;
}

.drawer-header h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

.drawer-header .el-icon {
  font-size: 20px;
  color: var(--primary-color);
}

.drawer-description {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.5;
}

.settings-drawer-content {
  padding: 20px;  /* 保持与header一致的padding */
  height: 100%;
  overflow-y: auto;
  background-color: var(--background-color);
}

/* 抽屉动画优化 */
:deep(.el-drawer) {
  --el-drawer-padding-primary: 0;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.el-drawer__body) {
  padding: 0;
  overflow-y: auto;
  height: calc(100% - 80px); /* 考虑到header高度 */
}

:deep(.el-drawer__header) {
  margin: 0;
  padding: 0;
}

:deep(.el-drawer.rtl) {
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
}

/* 深色模式适配 */
.dark-theme :deep(.el-drawer) {
  background-color: var(--card-background);
  border-left: 1px solid var(--border-color);
}

.dark-theme :deep(.el-drawer.rtl) {
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.25);
}

/* 响应式调整 */
@media screen and (max-width: 768px) {
  :deep(.el-drawer) {
    width: 90% !important;
  }
  
  .drawer-header,
  .settings-drawer-content {
    padding: 16px;  /* 移动端统一使用更小的padding */
  }
  
  .drawer-header h3 {
    font-size: 20px;
  }
  
  .settings-drawer-content {
    padding: 16px;
  }
}

/* SSML帮助对话框样式 */
.ssml-help-content {
  padding: 0 16px;
}

.ssml-help-content h3 {
  margin: 0 0 12px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--primary-color);
}

.ssml-examples {
  margin: 24px 0;
}

.ssml-example-item {
  margin-bottom: 20px;
  padding: 12px;
  border-radius: var(--border-radius-medium);
  background-color: rgba(0, 0, 0, 0.02);
  border: 1px solid var(--border-color);
}

.dark-theme .ssml-example-item {
  background-color: rgba(255, 255, 255, 0.02);
}

.ssml-example-item h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 500;
}

.ssml-example-item pre {
  margin: 0 0 8px 0;
  padding: 12px;
  background-color: var(--card-background);
  border-radius: var(--border-radius-small);
  overflow-x: auto;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
  color: var(--accent-color);
  border: 1px solid var(--border-color);
}

.ssml-example-item p {
  margin: 8px 0 0 0;
  font-size: 14px;
  color: var(--text-secondary);
}

.ssml-template {
  padding: 16px;
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: var(--border-radius-medium);
  border: 1px solid var(--border-color);
}

.dark-theme .ssml-template {
  background-color: rgba(255, 255, 255, 0.02);
}

.ssml-template pre {
  margin: 0;
  padding: 16px;
  background-color: var(--card-background);
  border-radius: var(--border-radius-small);
  overflow-x: auto;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
  color: var(--accent-color);
  border: 1px solid var(--border-color);
}

/* 配额进度条样式增强 */
.quota-progress-wrapper {
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: var(--border-radius-medium);
  padding: 12px 16px;
  margin-top: 12px;
  border: 1px solid var(--border-color);
}

.dark-theme .quota-progress-wrapper {
  background-color: rgba(255, 255, 255, 0.02);
}

.quota-text {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 14px;
  color: var(--text-secondary);
}

.quota-highlight {
  color: var(--accent-color);
  font-weight: 500;
}

.quota-warning {
  color: var(--error-color);
  font-weight: 500;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .compact-controls-bar {
    flex-direction: column;
  }
  
  .compact-selects, .compact-actions {
    width: 100%;
  }
  
  .text-area-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .ssml-help-button {
    margin-left: 0;
  }
}

/* 新界面样式 */
.input-area-card {
  background-color: var(--card-background);
  border-radius: var(--border-radius-large);
  box-shadow: var(--shadow-medium);
  overflow: hidden;
  margin-top: 0;
  border: 1px solid var(--border-color);
  position: sticky;
  top: 0;  /* 改为0，让它紧贴顶部 */
  z-index: 10;
}

.card-header {
  padding: 12px 16px;  /* 减少内边距 */
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--card-background);
}

.card-body {
  padding: 16px;  /* 减少内边距 */
  background-color: var(--background-color);
}

.text-area-container {
  background-color: var(--card-background);
  border-radius: var(--border-radius-medium);
  padding: 16px;  /* 减少内边距 */
  box-shadow: var(--shadow-light);
  border: 1px solid var(--border-color);
}

.compact-controls-bar {
  position: sticky;
  bottom: 0;
  background-color: var(--card-background);
  border-top: 1px solid var(--border-color);
  padding: 12px 16px;  /* 减少内边距 */
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 11;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.05);
}

/* 按钮样式优化 */
.voice-anchors-button,
.settings-button,
.start-button {
  height: 32px !important;
  line-height: 32px !important;
  font-size: 13px !important;
  padding: 0 12px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 4px !important;
}

.voice-anchors-button .el-icon,
.settings-button .el-icon,
.start-button .el-icon {
  font-size: 14px !important;
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .input-area-card {
    margin-top: 0;
    top: 0;  /* 移动端也紧贴顶部 */
  }

  .card-header,
  .card-body,
  .text-area-container,
  .compact-controls-bar {
    padding: 10px;  /* 移动端进一步减少内边距 */
  }

  .compact-controls-bar {
    flex-direction: column;
    gap: 8px;
  }

  .compact-selects {
    width: 100%;
    flex-direction: column;
    gap: 6px;
  }

  .compact-select, .voice-select {
    width: 100% !important;
  }

  .compact-actions {
    width: 100%;
    margin-left: 0;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }

  .start-button {
    grid-column: 1 / -1;
  }
}

/* 主容器样式优化 */
.modern-main {
  padding: 0 !important;  /* 移除内边距 */
  padding-top: 0 !important;  /* 移除顶部内边距 */
  margin: 0 !important;
  overflow: auto;
  width: 100%;
  box-sizing: border-box;
  background-color: var(--background-color);
}

/* 内容区域样式 */
.main-content {
  padding: 20px;  /* 内容区域保持内边距 */
  box-sizing: border-box;
  width: 100%;
}

/* 确保内容区域不会被压缩 */
.card-body {
  min-height: 200px;
}

/* 移除不必要的悬浮效果 */
.input-area-card:hover {
  transform: none;
  box-shadow: var(--shadow-medium);
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.card-title h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.card-title .el-icon {
  font-size: 20px;
  color: var(--primary-color);
}

.card-description {
  color: var(--text-secondary);
  font-size: 14px;
  margin: 0;
}

.input-mode-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  background-color: rgba(var(--primary-color-rgb), 0.05);
  padding: 6px 10px;
  border-radius: var(--border-radius-medium);
}

.mode-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.mode-switch {
  margin: 0 5px;
}

.ssml-help-button {
  margin-left: 5px;
  padding: 5px 12px;
  font-size: 12px;
  height: 28px;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.free-quota-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: var(--border-radius-small);
  background-color: rgba(64, 158, 255, 0.1);
  font-size: 13px;
  color: #409eff;
}

.compact-selects {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.compact-select,
.voice-select {
  width: auto;
  min-width: 120px;
}

.voice-select {
  min-width: 180px;
}

.compact-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

/* 配色增强 */
:root[theme-mode="dark"] .input-area-card {
  box-shadow: var(--shadow-medium);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

:root[theme-mode="dark"] .text-area-container {
  border: 1px solid rgba(255, 255, 255, 0.05);
}

:root[theme-mode="dark"] .input-mode-toggle {
  background-color: rgba(255, 255, 255, 0.05);
}

:root[theme-mode="dark"] .free-quota-badge {
  background-color: rgba(64, 158, 255, 0.15);
}

@media screen and (max-width: 768px) {
  .card-title {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    width: 100%;
  }
  
  .input-mode-toggle {
    width: 100%;
    justify-content: space-between;
    padding: 8px 12px;
  }
}

/* 按钮样式增强 */
.start-button {
  height: 44px !important;
  padding: 0 24px !important;
  font-size: 16px !important;
  font-weight: 600 !important;
  background: var(--primary-gradient) !important;
  border: none !important;
  box-shadow: 0 4px 12px rgba(var(--primary-color-rgb), 0.25) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
}

.start-button:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 6px 16px rgba(var(--primary-color-rgb), 0.35) !important;
}

.start-button:active {
  transform: translateY(0) !important;
  box-shadow: 0 2px 8px rgba(var(--primary-color-rgb), 0.2) !important;
}

.start-button .el-icon {
  font-size: 20px !important;
}

.start-button.is-loading {
  background: var(--primary-color) !important;
  opacity: 0.8 !important;
}

/* 功能按钮样式 */
.settings-button,
.voice-anchors-button {
  height: 44px !important;
  padding: 0 16px !important;
  font-size: 14px !important;
  background: var(--card-background) !important;
  border: 1px solid var(--border-color) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  display: flex !important;
  align-items: center !important;
  gap: 6px !important;
}

.settings-button:hover,
.voice-anchors-button:hover {
  background: var(--hover-color) !important;
  border-color: var(--primary-color) !important;
  color: var(--primary-color) !important;
}

.settings-button .el-icon,
.voice-anchors-button .el-icon {
  font-size: 18px !important;
}

/* 按钮组布局优化 */
.compact-actions {
  display: flex !important;
  align-items: center !important;
  gap: 12px !important;
}

/* 深色模式适配 */
:root[theme-mode="dark"] .start-button {
  box-shadow: 0 4px 12px rgba(var(--primary-color-rgb), 0.4) !important;
}

:root[theme-mode="dark"] .settings-button,
:root[theme-mode="dark"] .voice-anchors-button {
  background: rgba(255, 255, 255, 0.05) !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
}

:root[theme-mode="dark"] .settings-button:hover,
:root[theme-mode="dark"] .voice-anchors-button:hover {
  background: rgba(255, 255, 255, 0.1) !important;
  border-color: var(--primary-color) !important;
}

/* 响应式调整 */
@media screen and (max-width: 768px) {
  .start-button {
    width: 100% !important;
    justify-content: center !important;
  }
  
  .settings-button,
  .voice-anchors-button {
    flex: 1 !important;
    justify-content: center !important;
  }
  
  .compact-actions {
    flex-wrap: wrap !important;
    gap: 8px !important;
  }
}

/* 交互反馈样式 */
.feedback-tooltip {
  --el-tooltip-padding: 8px 12px;
  --el-tooltip-font-size: 13px;
  --el-tooltip-border-radius: 6px;
  --el-tooltip-box-shadow: 0 3px 6px -4px rgba(0, 0, 0, 0.12),
    0 6px 16px 0 rgba(0, 0, 0, 0.08),
    0 9px 28px 8px rgba(0, 0, 0, 0.05);
}

/* 加载动画优化 */
.loading-animation {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(var(--primary-color-rgb), 0.2);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  font-size: 16px;
  color: var(--text-primary);
  font-weight: 500;
}

.loading-progress {
  width: 100%;
  max-width: 300px;
  margin-top: 8px;
}

/* 转换进度条样式 */
.progress-bar {
  width: 100%;
  height: 6px;
  background-color: rgba(var(--primary-color-rgb), 0.1);
  border-radius: 3px;
  overflow: hidden;
  position: relative;
}

.progress-bar-inner {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background-color: var(--primary-color);
  border-radius: 3px;
  transition: width 0.3s ease;
}

/* 操作反馈动画 */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

/* 深色模式适配 */
.dark-theme .loading-spinner {
  border-color: rgba(255, 255, 255, 0.1);
  border-top-color: var(--primary-color);
}

.dark-theme .progress-bar {
  background-color: rgba(255, 255, 255, 0.1);
}

/* 响应式调整 */
@media screen and (max-width: 768px) {
  .loading-animation {
    gap: 12px;
  }
  
  .loading-spinner {
    width: 32px;
    height: 32px;
  }
  
  .loading-text {
    font-size: 14px;
  }
  
  .loading-progress {
    max-width: 250px;
  }
}

/* 标题区域样式 */
.section-header {
  margin-bottom: 16px;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.title-row .el-icon {
  font-size: 20px;
  color: var(--primary-color);
}

.title-row span {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.section-desc {
  color: var(--text-secondary);
  font-size: 14px;
  margin: 0;
}

/* 文本下方控制区域样式 */
.text-footer-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 12px 0;
  gap: 10px;
}

.free-quota-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: var(--border-radius-small);
  background-color: rgba(64, 158, 255, 0.1);
  font-size: 13px;
  color: #409eff;
  flex: 1;
}

.ai-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 15px;
  font-size: 14px;
}

/* 确保卡片体没有多余边距 */
.card-body {
  padding: 16px;
  padding-top: 10px;
  position: relative;
}

/* 移除卡片顶部边距 */
.input-area-card {
  margin-top: 0;
}

/* 文本区域头部样式调整 */
.text-area-header {
  margin-bottom: 10px;
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .text-footer-controls {
    flex-direction: column-reverse;
    align-items: stretch;
  }
  
  .free-quota-badge {
    width: 100%;
    justify-content: flex-start;
  }
  
  .ai-button {
    width: 100%;
    justify-content: center;
  }
}

/* 其他已有样式保持不变 */
</style>

<style scoped>
.modern-main {
  padding: 20px;
}

/* 选项区域样式 */
.option-section {
  background-color: var(--card-background-light, #f5f7fa);
  border-radius: 8px;
  padding: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 16px 0;
  padding: 0 0 8px 20px; /* 增加左侧padding */
  border-bottom: 1px solid var(--border-color);
}

.section-header {
  padding: 0 0 0 20px; /* 增加左侧padding */
  margin-bottom: 16px;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.title-row .el-icon {
  font-size: 20px;
  color: var(--primary-color);
}

.title-row span {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.section-desc {
  color: var(--text-secondary);
  font-size: 14px;
  margin: 0;
}

/* 响应式调整 */
@media screen and (max-width: 768px) {
  .section-title,
  .section-header {
    padding-left: 16px; /* 移动端减小padding */
  }
  
  .modern-main {
    padding: 10px;
  }
}

.input-area-card, .batch-area-card {
  background-color: var(--card-background);
  border-radius: var(--border-radius-large);
  box-shadow: var(--shadow-medium);
  overflow: hidden;
  transition: transform var(--transition-normal), box-shadow var(--transition-normal);
  position: relative;
}

.input-area-card:hover, .batch-area-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-large);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  position: relative;
  z-index: 2;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.card-body {
  padding: 20px;
  position: relative;
}

.text-area-container {
  height: 100%;
  position: relative;
}

.modern-textarea {
  border: none;
  height: 100%;
}

:deep(.el-textarea__inner) {
  height: 100%;
  resize: none;
  border: none;
  background-color: var(--card-background);
  color: var(--text-primary);
  font-size: 16px;
  padding: 16px;
  line-height: 1.6;
}

.ai-button {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 免费额度提示样式 */
.free-quota-badge {
  background-color: #f0f8ff;
  border: 1px solid #b3d8ff;
  color: #409eff;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 13px;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;
  height: 32px;
}

.quota-progress-wrapper {
  margin-top: 12px;
  padding: 8px 12px;
  border-radius: 6px;
  background-color: rgba(64, 158, 255, 0.1);
  border: 1px dashed #b3d8ff;
}

.quota-text {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
}

.quota-warning {
  color: #f56c6c;
  font-weight: 500;
}

.quota-highlight {
  color: #67c23a;
  font-weight: 500;
}

/* 简洁控制栏样式 */
.compact-controls-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-top: 1px solid var(--border-color);
  background-color: var(--card-background);
  z-index: 10;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.compact-selects {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  flex: 1;
}

.compact-select, .voice-select {
  width: 120px;
  min-width: 100px;
  border-radius: 6px;
}

.voice-select {
  width: 200px;
  min-width: 180px;
}

.compact-actions {
  display: flex;
  gap: 10px;
  margin-left: 12px;
}

.settings-button {
  display: flex;
  align-items: center;
  gap: 6px;
}

.start-button {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 设置抽屉样式 */
:deep(.el-drawer__header) {
  margin-bottom: 0;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
  font-size: 18px;
  font-weight: 600;
}

:deep(.el-drawer__body) {
  padding: 0;
  overflow-y: auto;
  height: calc(100% - 60px);
}

:deep(.el-drawer__content) {
  overflow: hidden;
}

:deep(.el-drawer) {
  z-index: 2001 !important; /* 确保抽屉在最上层 */
}

:deep(.el-drawer__container) {
  position: fixed !important;
  z-index: 2000 !important;
}

.settings-drawer-content {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
}

.drawer-options {
  width: 100%;
}

.modern-dialog {
  border-radius: var(--border-radius-large);
}

.dialog-description {
  margin-top: 0;
  margin-bottom: 20px;
  color: var(--text-secondary);
}

.dialog-input {
  display: flex;
  gap: 10px;
}

.dialog-prompt-input {
  flex: 1;
}

.dialog-submit-button {
  display: flex;
  align-items: center;
  gap: 6px;
}

.batch-actions {
  display: flex;
  gap: 10px;
}

.modern-table {
  border-radius: var(--border-radius-medium);
  overflow: hidden;
}

:deep(.el-table) {
  --el-table-border-color: var(--border-color);
  --el-table-header-bg-color: rgba(74, 108, 247, 0.05);
  --el-table-row-hover-bg-color: rgba(74, 108, 247, 0.03);
}

:deep(.el-table th) {
  background-color: var(--el-table-header-bg-color);
  font-weight: 600;
}

.status-tag {
  border-radius: 12px;
  padding: 0 10px;
}

.action-buttons {
  display: flex;
  gap: 6px;
}

.clear-button {
  display: flex;
  align-items: center;
  gap: 6px;
}

.config-page-container, .doc-page-container {
  flex: 1;
  background-color: var(--card-background);
  border-radius: var(--border-radius-large);
  box-shadow: var(--shadow-medium);
  overflow: hidden;
  height: calc(100vh - 180px); /* 确保有足够的高度 */
  width: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
}

/* 特别强调文档容器样式 */
.doc-page-container {
  position: relative;
  z-index: 5;
  height: calc(100vh - 40px); /* 只预留顶部导航栏的空间 */
  transform: translateZ(0); /* 启用硬件加速 */
  will-change: transform; /* 优化渲染性能 */
  margin: 0; /* 重置外边距 */
  padding: 0; /* 重置内边距 */
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 防止内容溢出 */
  box-sizing: border-box; /* 确保padding不增加总尺寸 */
  border-radius: 0;
  box-shadow: none;
}

.doc-frame {
  width: 100%;
  height: 100%;
  min-height: 700px;
  border: none;
  display: block;
  overflow: auto;
  border-radius: 0;
  opacity: 0;
  transition: opacity 0.3s ease;
  flex: 1; /* 让iframe自动填充容器 */
  max-height: none !important; /* 覆盖可能的最大高度限制 */
  margin: 0;
  padding: 0;
}

.iframe-visible {
  opacity: 1;
}

.options-container {
  background-color: var(--card-background);
  border-radius: var(--border-radius-large);
  box-shadow: var(--shadow-medium);
  padding: 20px;
  margin-top: 20px;
}

:deep(.el-tabs__item) {
  font-size: 16px;
  padding: 0 20px;
}

:deep(.el-tabs__active-bar) {
  background-color: var(--primary-color);
}

:deep(.el-tabs__item.is-active) {
  color: var(--primary-color);
  font-weight: 600;
}

:deep(.el-tabs__nav-wrap::after) {
  background-color: var(--border-color);
}

.iframe-loading, .iframe-error {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: var(--card-background);
  z-index: 1000;
  text-align: center;
}

.iframe-loading {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(74, 108, 247, 0.2);
  border-radius: 50%;
  border-top-color: var(--primary-color);
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.iframe-error {
  padding: 30px;
  background-color: var(--card-background);
}

.iframe-error p {
  margin: 16px 0;
  font-size: 16px;
  color: var(--text-secondary);
}

.error-icon {
  font-size: 48px;
  color: #ff4757;
  margin-bottom: 16px;
}

.error-actions {
  display: flex;
  gap: 16px;
  margin-top: 16px;
}

.loading-dots {
  display: inline-block;
  width: 30px;
  text-align: left;
}

.loading-dots:after {
  content: '.';
  animation: dots 1.5s steps(5, end) infinite;
}

@keyframes dots {
  0%, 20% {
    content: '.';
  }
  40% {
    content: '..';
  }
  60% {
    content: '...';
  }
  80%, 100% {
    content: '';
  }
}

/* 媒体查询以处理不同屏幕尺寸 */
@media screen and (max-width: 768px) {
  .compact-controls-bar {
    flex-direction: column;
    gap: 10px;
    padding: 12px;
  }
  
  .compact-selects {
    width: 100%;
    flex-direction: column;
    gap: 8px;
  }
  
  .compact-select, .voice-select {
    width: 100% !important;
    max-width: none !important;
  }
  
  .compact-actions {
    width: 100%;
    margin-left: 0;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  
  .start-button {
    grid-column: 1 / -1;  /* 让开始按钮占据整行 */
  }
  
  .text-area-container {
    margin: 8px 0;
  }
  
  .text-area-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .text-area-hint {
    font-size: 13px;
  }
  
  .modern-textarea {
    min-height: 150px;
  }
  
  .card-header {
    padding: 12px;
    flex-wrap: wrap;
    gap: 10px;
  }
  
  .header-controls {
    width: 100%;
    justify-content: space-between;
  }
  
  .ai-button {
    width: 100%;
  }
  
  .free-quota-badge {
    width: 100%;
    justify-content: center;
    font-size: 12px;
    height: auto;
    padding: 6px;
  }
}

@media screen and (min-width: 769px) and (max-width: 1024px) {
  .modern-main {
    padding: 15px !important;
  }

  .control-panel {
    gap: 15px;
  }

  .settings-panel {
    padding: 20px;
  }

  .el-dialog {
    width: 80% !important;
  }

  .el-drawer {
    width: 70% !important;
  }
}

/* 触摸设备交互优化 */
@media (hover: none) {
  .el-button:active {
    transform: scale(0.98);
  }

  .voice-card:active {
    transform: scale(0.98);
  }

  .settings-item:active {
    background-color: var(--hover-color);
  }
}

/* 深色模式移动端优化 */
:root[theme-mode="dark"] .mobile-view {
  .text-area {
    background-color: var(--card-background);
    border-color: var(--border-color);
  }

  .settings-panel {
    background-color: var(--card-background);
  }

  .upload-area {
    background-color: var(--card-background);
    border-color: var(--border-color);
  }
}

/* 优化加载动画在移动端的显示 */
@media (max-width: 768px) {
  .loading-animation {
    transform: scale(0.8);
  }

  .loading-text {
    font-size: 14px;
  }

  .progress-bar {
    height: 8px;
  }
}

.voice-anchors-button,
.settings-button,
.start-button {
  height: 32px !important; /* 减小按钮高度 */
  line-height: 32px !important;
  font-size: 13px !important; /* 稍微减小字体大小 */
  padding: 0 12px !important; /* 减小内边距 */
}

.voice-anchors-button .el-icon,
.settings-button .el-icon,
.start-button .el-icon {
  font-size: 14px !important; /* 减小图标大小 */
}

/* 确保图标垂直居中 */
.voice-anchors-button,
.settings-button,
.start-button {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 4px !important; /* 减小图标和文字的间距 */
}

/* 保持开始按钮的主要样式 */
.start-button {
  min-width: 80px !important; /* 稍微减小最小宽度 */
  font-weight: 500 !important; /* 稍微调整字重 */
}

/* 添加顶部内边距，为固定标题栏留出空间 */
.modern-main {
  padding-top: 0 !important;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .modern-main {
    padding-top: 0 !important;
  }
}

.text-area-header-left h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.text-area-header-left .text-area-hint {
  color: var(--text-secondary);
  font-size: 14px;
}

/* 添加在线生成字幕页面样式 */
.content-area {
  padding: 20px;
  background-color: var(--card-background);
  border-radius: var(--border-radius-large);
  box-shadow: var(--shadow-medium);
  margin-top: 20px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  color: #909399;
  margin-bottom: 16px;
}

.empty-state h2 {
  font-size: 24px;
  color: #303133;
  margin-bottom: 8px;
}

.empty-state p {
  font-size: 16px;
  color: #606266;
}

.empty-state .el-button {
  margin-top: 20px;
}

/* 字数限制提示样式优化 */
.character-limit-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: var(--border-radius-small);
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.1), rgba(64, 158, 255, 0.2));
  font-size: 13px;
  color: #409eff;
  border-left: 3px solid #409eff;
  transition: all 0.3s ease;
  flex: 1;
  box-shadow: 0 2px 5px rgba(64, 158, 255, 0.1);
}

.character-limit-badge .el-icon {
  font-size: 18px;
  color: #409eff;
}

.limit-info {
  display: flex;
  flex-direction: column;
}

.limit-text {
  font-weight: 500;
}

.limit-subtext {
  font-size: 11px;
  opacity: 0.8;
}

/* 警告状态 */
.character-limit-badge.warning {
  background: linear-gradient(135deg, rgba(230, 162, 60, 0.1), rgba(230, 162, 60, 0.2));
  color: #e6a23c;
  border-left-color: #e6a23c;
  box-shadow: 0 2px 5px rgba(230, 162, 60, 0.1);
}

.character-limit-badge.warning .el-icon {
  color: #e6a23c;
}

/* 危险状态 */
.character-limit-badge.danger {
  background: linear-gradient(135deg, rgba(245, 108, 108, 0.1), rgba(245, 108, 108, 0.2));
  color: #f56c6c;
  border-left-color: #f56c6c;
  box-shadow: 0 2px 5px rgba(245, 108, 108, 0.1);
  animation: pulse 1.5s infinite alternate;
}

.character-limit-badge.danger .el-icon {
  color: #f56c6c;
}

/* 额度进度条样式优化 */
.quota-progress-wrapper {
  background: linear-gradient(135deg, rgba(103, 194, 58, 0.05), rgba(103, 194, 58, 0.1));
  border-radius: var(--border-radius-medium);
  padding: 10px 14px;
  margin-top: 10px;
  border: 1px solid rgba(103, 194, 58, 0.2);
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.03);
}

.quota-progress-wrapper.warning {
  background: linear-gradient(135deg, rgba(230, 162, 60, 0.05), rgba(230, 162, 60, 0.1));
  border-color: rgba(230, 162, 60, 0.2);
}

.quota-progress-wrapper.danger {
  background: linear-gradient(135deg, rgba(245, 108, 108, 0.05), rgba(245, 108, 108, 0.1));
  border-color: rgba(245, 108, 108, 0.2);
}

@keyframes pulse {
  0% {
    opacity: 0.9;
    transform: scale(0.98);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* 简单文字提示样式 */
.simple-limit-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: var(--border-radius-small);
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.1), rgba(64, 158, 255, 0.2));
  font-size: 13px;
  color: #409eff;
  border-left: 3px solid #409eff;
  transition: all 0.3s ease;
  flex: 1;
  box-shadow: 0 2px 5px rgba(64, 158, 255, 0.1);
}

.simple-limit-info .el-icon {
  font-size: 18px;
  color: #409eff;
}

.limit-hint {
  font-size: 11px;
  opacity: 0.8;
}
.el-icon {
  font-size: 18px;
  color: #409eff;
}

.quota-warning {
  font-size: 11px;
  opacity: 0.8;
}
</style>

