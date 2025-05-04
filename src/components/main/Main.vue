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
            <span>本次最多可输入 {{ localTTSStore.serverStatus.freeLimit.free_limit }} 剩余 {{ localTTSStore.serverStatus.freeLimit.remaining }} 可输入</span>
          </div>
          
        <el-button @click="dialogVisible = true" type="primary" class="ai-button">
          <el-icon><MagicStick /></el-icon>
          <span>AI 生成</span>
        </el-button>
        </div>
      </div>
      
      <div class="card-body">
        <div class="text-area-container" v-show="page.tabIndex === '1'">
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
              <span v-if="localTTSStore.serverStatus.freeLimit.remaining <= 0">每周限制 {{ localTTSStore.serverStatus.freeLimit.free_limit }} 个字符 (额度已用完)</span>
              <span v-else>每周限制 {{ localTTSStore.serverStatus.freeLimit.free_limit }} 个字符 (部分声音可持无限制)</span>
            </div>
            <el-progress 
              :percentage="localTTSStore.freeLimitUsagePercent" 
              :status="localTTSStore.freeLimitUsagePercent > 90 ? 'exception' : 'success'"
              :stroke-width="4"
              :show-text="false"
            />
          </div>
        </div>
        <div class="text-area-container" v-show="page.tabIndex === '2'">
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
          >
            <template #prefix>
              <el-icon><Connection /></el-icon>
            </template>
            <el-option
              v-for="item in apiOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          
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
            <el-option
              v-for="item in voiceSelectList"
              :key="item.ShortName"
              :label="item.DisplayName"
              :value="item.ShortName"
            />
          </el-select>
    </div>
        
        <div class="compact-actions">
          <el-button 
            size="small" 
            @click="openVoiceAnchors"
            class="voice-anchors-button"
          >
            <el-icon><Avatar /></el-icon>
            语音主播
          </el-button>
          
          <el-button 
            size="small" 
            @click="openSettingsPanel"
            class="settings-button"
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
          >
            <template #prefix>
              <el-icon><Connection /></el-icon>
            </template>
            <el-option
              v-for="item in apiOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          
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
            <el-option
              v-for="item in voiceSelectList"
              :key="item.ShortName"
              :label="item.DisplayName"
              :value="item.ShortName"
            />
          </el-select>
    </div>
    
        <div class="compact-actions">
          <el-button 
            size="small" 
            @click="openVoiceAnchors"
            class="voice-anchors-button"
          >
            <el-icon><Avatar /></el-icon>
            语音主播
          </el-button>
          
          <el-button 
            size="small" 
            @click="openSettingsPanel"
            class="settings-button"
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

import { ref, watch, onMounted, nextTick, onUnmounted } from "vue";
import { useTtsStore } from "@/store/store";
import { useLocalTTSStore } from "@/store/local-tts-store";
import { storeToRefs } from "pinia";

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
  Avatar
} from '@element-plus/icons-vue';

// 获取i18n实例
const { t } = useI18n();  
const store = useTtsStore();
const localTTSStore = useLocalTTSStore();
const { inputs, page, tableData, currMp3Url, config, formConfig, audioPlayer } =
  storeToRefs(store);

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
  
  // 初始化抽屉状态
  openSettingsDrawer.value = false;
  
  // 添加窗口消息监听，以便文档页面能够与主应用通信
  window.addEventListener('message', handleIframeMessage);
  
  // 添加窗口大小变化监听
  window.addEventListener('resize', handleResize);
  
  // 如果当前使用的是免费TTS服务，自动检查连接和获取额度
  if (formConfig.value.api === 5) {
    checkTTSServiceStatus();
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
    store.setSSMLValue(newValue);
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
    await store.startChatGPT(modalInput.value);
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
  formConfig.value.voiceSelect = "";
  voiceSelectList.value = optionsConfig.findVoicesByLocaleName(value);
};

// 声音变更处理
const voiceSelectChange = (value: string) => {
  // 更新声音选择
  // 在抽屉组件中完成更复杂的设置
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
  
  // 启动转换过程
  store.start();
};

const isLoading = ref(false);

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
    
    // 应用主播配置
    formConfig.value = {...anchor.config};
    
    // 更新声音选择列表
    voiceSelectList.value = optionsConfig.findVoicesByLocaleName(formConfig.value.languageSelect);
    
    // 检查是否需要更新声音样式列表并应用正确的样式
    const selectedVoice = voiceSelectList.value.find(
      (v) => v.ShortName === formConfig.value.voiceSelect
    );
    
    if (selectedVoice) {
      // 获取可用的样式列表
      const availableStyles = selectedVoice.VoiceStyleNames?.split(",") || [];
      
      // 如果之前选择的样式可用，则使用它；否则使用第一个可用样式或Default
      if (availableStyles.length > 0) {
        formConfig.value.voiceStyleSelect = availableStyles.includes(selectedStyle) ? 
          selectedStyle : availableStyles[0];
      } else {
        formConfig.value.voiceStyleSelect = 'Default';
      }
    }
    
    ElMessage({
      message: `已应用语音主播：${anchor.name}`,
      type: 'success',
      duration: 2000
    });
  }
  showVoiceAnchorsDialog.value = false;
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
  height: 28px;
}

.quota-progress-wrapper {
  margin-top: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  background-color: rgba(230, 235, 245, 0.2);
}

.quota-text {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
  margin-bottom: 5px;
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

.compact-select {
  width: 120px;
  min-width: 100px;
}

.voice-select {
  width: 160px;
  min-width: 120px;
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
</style>
