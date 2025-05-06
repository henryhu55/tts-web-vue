<template>
  <div class="modern-main">
    <!-- 文本编辑区 -->
    <div class="input-area-card" v-show="page.asideIndex === '1'">
      <div class="card-header">
        <el-tabs @tab-click="handleTabClick" :model-value="page.tabIndex">
          <el-tab-pane name="1" :label="t('main.textTab')"></el-tab-pane>
          <el-tab-pane name="2" :label="t('main.ssmlTab')"></el-tab-pane>
        </el-tabs>
        
        <div class="header-controls">
          <!-- 免费额度提示 -->
          <div v-if="formConfig.api === 5 && localTTSStore.serverStatus.freeLimit" class="free-quota-badge">
            <el-icon color="#409eff"><InfoFilled /></el-icon>
            <span>本次最多可输入 <b>{{ localTTSStore.serverStatus.freeLimit.remaining }}</b> 剩余 <b>{{ localTTSStore.serverStatus.freeLimit.remaining }}</b> 可输入</span>
          </div>
          
          <el-button 
            @click="dialogVisible = true" 
            type="primary" 
            class="ai-button"
            v-tooltip="{
              content: '使用AI生成文本内容',
              placement: 'top',
              effect: 'light'
            }"
          >
            <el-icon><MagicStick /></el-icon>
            <span>AI 生成</span>
          </el-button>
        </div>
      </div>
      
      <div class="card-body">
        <div class="text-area-container" v-show="page.tabIndex === '1'">
          <div class="text-area-header">
            <h3>输入文本</h3>
            <span class="text-area-hint">在此处输入您想要转换为语音的文本内容</span>
          </div>
          <el-input
            v-model="inputs.inputValue"
            type="textarea"
            :placeholder="t('main.placeholder')"
            class="modern-textarea"
            resize="none"
            :rows="18"
          />
          <!-- 免费额度进度条 -->
          <div v-if="formConfig.api === 5 && localTTSStore.serverStatus.freeLimit" class="quota-progress-wrapper">
            <div class="quota-text">
              <span v-if="localTTSStore.serverStatus.freeLimit.remaining <= 0" class="quota-warning">每天限制 {{ localTTSStore.serverStatus.freeLimit.free_limit }} 个字符 (额度已用完)</span>
              <span v-else>每天限制 <b>{{ localTTSStore.serverStatus.freeLimit.free_limit }}</b> 个字符 <span class="quota-highlight">(部分声音可无限制使用)</span></span>
            </div>
            <el-progress 
              :percentage="localTTSStore.freeLimitUsagePercent" 
              :status="localTTSStore.freeLimitUsagePercent > 90 ? 'exception' : 'success'"
              :stroke-width="6"
              :show-text="true"
            />
          </div>
        </div>
        <div class="text-area-container" v-show="page.tabIndex === '2'">
          <div class="text-area-header">
            <h3>SSML 标记语言</h3>
            <span class="text-area-hint">使用SSML可以更精确地控制语音效果，包括语调、停顿和发音</span>
            <el-button 
              size="small" 
              type="info" 
              class="ssml-help-button"
              @click="openSSMLHelp"
              v-tooltip="{
                content: '查看SSML使用指南',
                placement: 'top',
                effect: 'light'
              }"
            >
              <el-icon><QuestionFilled /></el-icon>
              SSML帮助
            </el-button>
          </div>
          <el-input 
            v-model="inputs.ssmlValue" 
            type="textarea" 
            class="modern-textarea"
            resize="none"
            :rows="18"
          />
        </div>
      </div>
      
      <!-- 简洁控制栏 - 取代原来的浮动控制条 -->
      <div class="compact-controls-bar">
        <div class="compact-selects">
          <el-select
            v-model="formConfig.api"
            size="small"
            placeholder="API"
            class="compact-select"
            @change="apiChange"
            v-tooltip="{
              content: '选择语音合成服务提供商',
              placement: 'top',
              effect: 'light'
            }"
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
          
          <el-select
            v-model="formConfig.languageSelect"
            size="small"
            placeholder="语言"
            class="compact-select"
            @change="languageSelectChange"
            filterable
            v-tooltip="{
              content: '选择语音合成的语言',
              placement: 'top',
              effect: 'light'
            }"
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
          
          <el-select
            v-model="formConfig.voiceSelect"
            size="small"
            placeholder="声音"
            class="voice-select"
            @change="voiceSelectChange"
            filterable
            v-tooltip="{
              content: '选择语音角色',
              placement: 'top',
              effect: 'light'
            }"
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
                <el-button 
                  size="small" 
                  type="primary" 
                  circle
                  @click.stop="audition(item.ShortName)"
                  v-tooltip="{
                    content: '试听声音示例',
                    placement: 'top',
                    effect: 'light'
                  }"
                ><el-icon><CaretRight /></el-icon></el-button>
              </div>
            </el-option>
          </el-select>
    </div>
        
        <div class="compact-actions">
          <el-button 
            size="small" 
            @click="openVoiceAnchors"
            class="voice-anchors-button"
            v-tooltip="{
              content: '选择预设语音主播角色',
              placement: 'top',
              effect: 'light'
            }"
          >
            <el-icon><Avatar /></el-icon>
            语音主播
          </el-button>
          
          <el-button 
            size="small" 
            @click="openSettingsPanel"
            class="settings-button"
            v-tooltip="{
              content: '调整语速、音调等高级设置',
              placement: 'top',
              effect: 'light'
            }"
          >
            <el-icon><Setting /></el-icon>
            高级设置
          </el-button>
          
          <el-button 
            type="primary" 
            @click="startBtn" 
            :loading="isLoading"
            size="small"
            class="start-button"
            v-tooltip="{
              content: '开始转换文本为语音',
              placement: 'top',
              effect: 'light'
            }"
          >
            <el-icon><CaretRight /></el-icon>
            转换
          </el-button>
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
        <div class="drawer-header">
          <h3>语音高级设置</h3>
          <p class="drawer-description">调整语音的语速、音调和情感等高级参数</p>
        </div>
      </template>
      <template #default>
        <div class="settings-drawer-content">
          <MainOptions class="drawer-options" ref="drawerOptions" :in-drawer="true" />
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
            show-file-list="false"
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
            show-overflow-tooltip="true"
          />
          <el-table-column
            prop="filePath"
            :label="t('main.filePath')"
            show-overflow-tooltip="true"
          />
          <el-table-column
            prop="fileSize"
            :label="t('main.fileSize')"
            width="80"
            show-overflow-tooltip="true"
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
          <el-select
            v-model="formConfig.api"
            size="small"
            placeholder="API"
            class="compact-select"
            @change="apiChange"
            v-tooltip="{
              content: '选择语音合成服务提供商',
              placement: 'top',
              effect: 'light'
            }"
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
          
          <el-select
            v-model="formConfig.languageSelect"
            size="small"
            placeholder="语言"
            class="compact-select"
            @change="languageSelectChange"
            filterable
            v-tooltip="{
              content: '选择语音合成的语言',
              placement: 'top',
              effect: 'light'
            }"
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
          
          <el-select
            v-model="formConfig.voiceSelect"
            size="small"
            placeholder="声音"
            class="voice-select"
            @change="voiceSelectChange"
            filterable
            v-tooltip="{
              content: '选择语音角色',
              placement: 'top',
              effect: 'light'
            }"
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
                <el-button 
                  size="small" 
                  type="primary" 
                  circle
                  @click.stop="audition(item.ShortName)"
                  v-tooltip="{
                    content: '试听声音示例',
                    placement: 'top',
                    effect: 'light'
                  }"
                ><el-icon><CaretRight /></el-icon></el-button>
              </div>
            </el-option>
          </el-select>
    </div>
    
        <div class="compact-actions">
          <el-button 
            size="small" 
            @click="openVoiceAnchors"
            class="voice-anchors-button"
            v-tooltip="{
              content: '选择预设语音主播角色',
              placement: 'top',
              effect: 'light'
            }"
          >
            <el-icon><Avatar /></el-icon>
            语音主播
          </el-button>
          
          <el-button 
            size="small" 
            @click="openSettingsPanel"
            class="settings-button"
            v-tooltip="{
              content: '调整语速、音调等高级设置',
              placement: 'top',
              effect: 'light'
            }"
          >
            <el-icon><Setting /></el-icon>
            高级设置
          </el-button>
          
          <el-button 
            type="primary" 
            @click="startBtn" 
            :loading="isLoading"
            size="small"
            class="start-button"
            v-tooltip="{
              content: '开始转换文本为语音',
              placement: 'top',
              effect: 'light'
            }"
          >
            <el-icon><CaretRight /></el-icon>
            转换
          </el-button>
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
  QuestionFilled
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
</script>

<style>
/* 全局样式，确保抽屉在所有场景下都能正确显示 */
.el-drawer {
  --el-drawer-padding-primary: 0 !important;
  z-index: 2001 !important;
}

.el-drawer__header {
  margin-bottom: 0 !important;
  padding: 16px 20px !important;
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
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 8px;
  gap: 12px;
}

.text-area-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.text-area-hint {
  color: var(--text-secondary);
  font-size: 14px;
  margin-right: auto;
}

.ssml-help-button {
  margin-left: auto;
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

.dark-theme .compact-controls-bar {
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
.drawer-header h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
}

.drawer-description {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.settings-drawer-content {
  padding: 16px;
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
</style>

<style scoped>
.modern-main {
  padding: 10px; /* 减少主容器的内边距 */
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  position: relative;
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
    gap: 12px;
    padding: 12px;
  }
  
  .compact-selects {
    width: 100%;
    justify-content: space-between;
  }
  
  .compact-select, .voice-select {
    width: calc(50% - 6px);
  }
  
  .compact-actions {
    width: 100%;
    margin-left: 0;
    justify-content: space-between;
  }
  
  .free-quota-badge {
    font-size: 11px;
    padding: 2px 8px;
    margin-bottom: 5px;
    width: 100%;
    justify-content: center;
  }
}

@media screen and (min-width: 1440px) {
  .compact-select {
    width: 140px;
  }
  
  .voice-select {
    width: 200px;
  }
}

/* 语音主播按钮样式 */
.voice-anchors-button {
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: #ff9900;
  color: white;
  border-color: #e68a00;
}

.voice-anchors-button:hover {
  background-color: #ffad33;
  border-color: #ff9900;
}

.free-api-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.free-api-option .el-tag {
  margin-left: 10px;
  font-size: 10px;
  padding: 0 4px;
  height: 18px;
  line-height: 16px;
}

.voice-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 4px 0;
  min-height: 32px;
}

.voice-option span {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-right: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: calc(100% - 40px);
  line-height: 1.4;
}

/* 为中文名称添加特殊样式 */
.voice-option span .chinese-name {
  color: var(--text-secondary);
  font-weight: normal;
}

.voice-option .el-button {
  margin-left: 10px;
  transition: all 0.3s ease;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(64, 158, 255, 0.25);
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 22px;
  width: 22px;
  padding: 0;
  font-size: 12px;
}

.voice-option .el-button:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.5);
}

.voice-option .el-button :deep(.el-icon) {
  font-size: 11px;
  width: 11px;
  height: 11px;
}

:deep(.el-select-dropdown__item .el-icon) {
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

:deep(.el-select-dropdown__item) {
  padding: 6px 12px !important;
  height: auto !important;
  min-height: 38px !important;
  line-height: 1.5 !important;
  transition: background-color 0.2s ease;
  margin: 2px 0;
}

:deep(.el-select-dropdown__item:hover) {
  background-color: rgba(64, 158, 255, 0.1);
}

:deep(.el-select-dropdown__item.selected) {
  font-weight: 600;
  color: var(--primary-color);
  background-color: rgba(64, 158, 255, 0.15);
}

:deep(.el-select-dropdown__list) {
  padding: 8px 0;
}

:deep(.el-popper.is-light) {
  border-radius: 8px;
}

:deep(.el-button) {
  transition: all 0.3s ease;
}

:deep(.el-button:active) {
  transform: scale(0.95);
}

:deep(.el-input__wrapper) {
  border-radius: 6px;
  box-shadow: 0 0 0 1px var(--border-color) inset;
  transition: all 0.2s;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--primary-color) inset;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--primary-color) inset !important;
}

:deep(.el-select .el-input__suffix) {
  transition: all 0.3s;
}

:deep(.el-select.is-focus .el-input__suffix) {
  transform: rotate(180deg);
}

:deep(.el-select-dropdown) {
  border-radius: 8px !important;
  padding: 6px 0;
  max-height: 350px;
  overflow-y: auto;
  box-shadow: 0 3px 15px rgba(0, 0, 0, 0.1);
  min-width: 200px !important;
}

:deep(.el-scrollbar__thumb) {
  background-color: rgba(144, 147, 153, 0.3);
  border-radius: 10px;
}

:deep(.el-popper[role="tooltip"]) {
  z-index: 3000 !important;
}

/* 选择器样式改写，显示中文名称 */
.voice-select :deep(.el-select__wrapper) {
  display: flex;
  align-items: center;
}

.voice-select :deep(.el-select-v2__selected) {
  position: relative;
}

.voice-select :deep(.el-select-v2__placeholder) {
  position: absolute;
}

/* 自定义选中值显示 */
.voice-select-value {
  display: flex;
  align-items: center;
}
</style>
