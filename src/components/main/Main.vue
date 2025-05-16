<template>
  <div class="modern-main">
    <!-- 固定标题栏 -->
    <FixedHeader 
      v-model:isSSMLMode="isSSMLMode"
      :title="page.asideIndex === '1' ? '文本转语音' : '批量处理'"
      :subtitle="page.asideIndex === '1' ? '将文字转换为自然的语音' : '批量处理文本转语音任务'"
      :asideIndex="page.asideIndex"
      @nav-change="handleNavChange"
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
          
          <!-- 免费TTS服务错误显示 -->
          <FreeTTSErrorDisplay 
            v-if="formConfig.api === 5"
            :error-code="localTTSStore.currentErrorCode" 
            :error-message="localTTSStore.currentErrorMessage"
            @refresh="handleRefreshConnection"
            @action="handleErrorAction"
          />
          
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
            @input="handleSSMLInput"
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

      <!-- 集成播放器卡片到主界面 -->
      <div class="player-card">
        <div class="player-container">
          <div class="player-row">
            <!-- 格式选择区域 -->
            <div class="format-selection">
              <span class="format-label">{{ t('footer.format') || '格式' }}:</span>
              <el-select
                v-model="playerConfig.formatType"
                class="format-select"
                @change="setFormatType"
                size="small"
              >
                <el-option
                  v-for="format in formatOptions"
                  :key="format.value"
                  :label="format.label"
                  :value="format.value"
                >
                  <div class="format-option">
                    <el-icon><DocumentChecked /></el-icon>
                    <span>{{ format.label }}</span>
                  </div>
                </el-option>
              </el-select>
            </div>
            
            <!-- 音频播放器 -->
            <div class="audio-player">
              <audio
                ref="audioPlayerRef"
                :src="isAudioAvailable() ? (typeof currMp3Url === 'object' ? currMp3Url.value : currMp3Url) : null"
                :autoplay="playerConfig.autoplay"
                controls
                controlslist="nodownload"
                class="modern-audio-player"
                @error="handleAudioError"
                @play="handleAudioPlay"
                @canplay="handleAudioCanPlay"
              ></audio>
            </div>
            
            <!-- 下载按钮 -->
            <div class="download-button">
              <el-tooltip 
                :content="t('footer.downloadAudio') || '下载音频'" 
                placement="top"
                effect="light"
              >
                <el-button
                  type="primary"
                  circle
                  @click="download"
                  :disabled="!isAudioAvailable()"
                  :loading="isDownloading"
                >
                  <el-icon><Download /></el-icon>
                </el-button>
              </el-tooltip>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加页脚信息 - 移动到组件底部 -->
    <div class="site-footer" v-show="page.asideIndex === '1'">
      <div class="footer-info">
        <div class="copyright">
          © 2023-{{ new Date().getFullYear() }} TTS语音合成 | 
          <a href="https://beian.miit.gov.cn/" target="_blank" class="beian-link">沪ICP备15001572号-1</a>
        </div>
        <div class="footer-links">
          <a href="/about" class="footer-link">关于我们</a>
          <a href="/privacy" class="footer-link">隐私政策</a>
          <a href="/terms" class="footer-link">使用条款</a>
          <a href="/contact" class="footer-link">联系我们</a>
        </div>
        <div class="friendly-links">
          <span class="links-label">友情链接：</span>
          <a href="https://api.tts88.top" target="_blank" class="friendly-link">TTS API</a>
          <a href="https://docs.tts88.top" target="_blank" class="friendly-link">开发文档</a>
          <a href="https://github.com/henryhu55/tts-web-vue" target="_blank" class="friendly-link">GitHub</a>
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
            <MainOptions 
              v-if="openSettingsDrawer" 
              class="drawer-options" 
              ref="drawerOptions" 
              :in-drawer="true" 
              @open-voice-selector="openVoiceAnchors" 
            />
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
      <div class="card-header batch-card-header">
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
        src="https://docs.tts88.top"
        @load="handleIframeLoad"
        @error="handleIframeError"
        allow="fullscreen"
        referrerpolicy="origin"
        crossorigin="anonymous"
        :class="{'iframe-visible': iframeLoaded}"
      >
      </iframe>
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

    <!-- 添加历史记录页面 -->
    <div class="history-record-container" v-show="page.asideIndex === '6'">
      <HistoryRecord></HistoryRecord>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck  // 暂时忽略类型检查
import { ref, watch, onMounted, nextTick, reactive } from "vue";
import { useI18n } from 'vue-i18n';
import i18n from '@/assets/i18n/i18n';
import { useTtsStore, INPUT_MODE } from "@/store/store";
import { useLocalTTSStore } from "@/store/local-tts-store";
import { storeToRefs } from "pinia";
import { optionsConfig } from "@/components/main/options-config"; // 导入optionsConfig
import { debounce } from 'lodash-es'; // 添加 lodash-es 的 debounce 导入

// 导入从main.ts提取的所有变量、函数和响应式状态
import { 
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
  useMainSetup,
  docIframe,
  iframeLoaded,
  iframeError,
  iframeCurrentSrc,
  
  // 函数
  handleIframeLoad,
  handleIframeError,
  checkTTSServiceStatus,
  sendToChatGPT,
  handleDelete,
  fileChange,
  fileRemove,
  clearAll,
  openInFolder,
  getChineseName,
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
  initGlobalRefs,
  playAudio,
  audioPlayerRef,
  globalCurrMp3Url,
  trimUrl,
  isAudioAvailable
} from '@/composables/main';

// 添加HistoryRecord组件导入
import HistoryRecord from "@/components/history/HistoryRecord.vue";

// 在组件setup中初始化i18n和store
const { t, ttsStore, localTTSStore, inputs, page, tableData, currMp3Url, config, formConfig, audioPlayer } = useMainSetup();

// 确保tableData存在且有值
if (!ttsStore.tableData) {
  ttsStore.tableData = ref([]);
  console.log('已初始化ttsStore.tableData');
} else if (!ttsStore.tableData.value) {
  ttsStore.tableData.value = [];
  console.log('已初始化ttsStore.tableData.value');
}

// 确保currMp3Url存在
if (!ttsStore.currMp3Url) {
  console.log('初始化ttsStore.currMp3Url为空值');
  ttsStore.currMp3Url = ref('');
} else if (typeof ttsStore.currMp3Url === 'string') {
  // 如果是字符串，转换为ref对象
  const oldValue = ttsStore.currMp3Url;
  ttsStore.currMp3Url = ref(oldValue);
  console.log('将ttsStore.currMp3Url从字符串转换为ref对象');
}

// 初始化全局引用，确保在setup函数外部的函数也能访问到store数据
onMounted(() => {
  console.log('Main.vue组件已挂载');
  
  // 初始化全局引用
  initGlobalRefs();
  
  // 使用全局引用更新currMp3Url
  const updateAudioSrc = () => {
    try {
      if (audioPlayerRef.value) {
        console.log('音频元素已挂载，准备检查音频源');
        
        // 尝试从全局引用和store中获取音频URL
        let audioUrl = '';
        
        // 尝试来源1: globalCurrMp3Url
        if (globalCurrMp3Url && typeof globalCurrMp3Url === 'object' && 'value' in globalCurrMp3Url) {
          audioUrl = globalCurrMp3Url.value;
        }
        
        // 尝试来源2: ttsStore.currMp3Url
        if ((!audioUrl || audioUrl === '') && ttsStore.currMp3Url) {
          if (typeof ttsStore.currMp3Url === 'object' && 'value' in ttsStore.currMp3Url) {
            audioUrl = ttsStore.currMp3Url.value;
            console.log('从ttsStore.currMp3Url获取到URL:', audioUrl);
          } else if (typeof ttsStore.currMp3Url === 'string') {
            audioUrl = ttsStore.currMp3Url;
            console.log('从ttsStore.currMp3Url字符串获取到URL:', audioUrl);
          }
        }
        
        // 检查URL是否有效
        if (audioUrl && 
            audioUrl !== '' && 
            !audioUrl.includes('127.0.0.1:3344') && 
            !audioUrl.includes('localhost:3344') && 
            audioUrl !== window.location.href) {
          console.log('检测到有效的音频URL:', audioUrl);
          
          // 使用统一的播放函数
          if (playerConfig.autoplay) {
            console.log('配置为自动播放，调用统一播放函数');
            // 导入的playAudio函数
            playAudio(audioUrl, { autoplay: true }).catch(err => {
              console.warn('自动播放失败:', err);
            });
          } else {
            console.log('不自动播放，仅设置音频源');
            // 仍然设置src，但不播放
            playAudio(audioUrl, { autoplay: false });
          }
        } else {
          console.log('没有有效的音频URL，不设置音频源');
          // 不设置src避免错误
        }
        
        // 添加事件监听
        audioPlayerRef.value.addEventListener('play', () => {
          console.log('监听到音频开始播放');
        });
        
        audioPlayerRef.value.addEventListener('error', (e) => {
          // 增强检查条件，避免初始化和空src时的错误日志
          if (audioPlayerRef.value && 
              audioPlayerRef.value.src && 
              audioPlayerRef.value.src !== '' && 
              audioPlayerRef.value.src !== 'null' && 
              audioPlayerRef.value.src !== 'undefined' &&
              audioPlayerRef.value.src !== window.location.href &&
              !audioPlayerRef.value.src.includes('127.0.0.1:3344') &&
              !audioPlayerRef.value.src.includes('localhost:3344')) {
            console.error('音频加载出错:', e);
          } else {
            // 可选：记录调试日志
            // console.debug('忽略音频初始化错误');
          }
        });
      } else {
        console.warn('音频元素未找到');
      }
    } catch (err) {
      console.error('更新音频src时出错:', err);
    }
  };
  
  // 确保audioPlayerRef已经挂载
  nextTick(updateAudioSrc);
});

// 当语言选择变化时，更新语音列表
watch(() => formConfig.languageSelect, (newValue, oldValue) => {
  if (newValue && newValue !== oldValue) {
    console.log('语言选择变化, 更新语音列表:', newValue);
    voiceSelectList.value = optionsConfig.findVoicesByLocaleName(newValue);
  }
});

// 确保页面加载时有语音列表
nextTick(() => {
  // 检查语音列表是否为空
  if (!voiceSelectList.value || voiceSelectList.value.length === 0) {
    const currentLang = formConfig.languageSelect || 'zh-CN';
    console.log('组件挂载后检查语音列表 - 当前语言:', currentLang);
    voiceSelectList.value = optionsConfig.findVoicesByLocaleName(currentLang);
    console.log('已加载语音列表, 数量:', voiceSelectList.value.length);
    
    // 如果没有选择语音但有语音列表，选择第一个
    if ((!formConfig.voiceSelect || formConfig.voiceSelect === '') && 
        voiceSelectList.value && voiceSelectList.value.length > 0) {
      console.log('设置默认语音:', voiceSelectList.value[0].ShortName);
      formConfig.voiceSelect = voiceSelectList.value[0].ShortName;
    }
  }
});

// 音频事件处理
const handleAudioError = (e) => {
  // 增强检查条件，避免初始化和空src时的错误日志
  if (audioPlayerRef.value && 
      audioPlayerRef.value.src && 
      audioPlayerRef.value.src !== '' && 
      audioPlayerRef.value.src !== 'null' && 
      audioPlayerRef.value.src !== 'undefined' &&
      audioPlayerRef.value.src !== window.location.href &&
      !audioPlayerRef.value.src.includes('127.0.0.1:3344') &&
      !audioPlayerRef.value.src.includes('localhost:3344')) {
    console.error('音频加载出错:', e);
  } else {
    // 可选：记录调试日志
    // console.debug('忽略音频初始化错误');
  }
};

const handleAudioPlay = () => {
  console.log('音频开始播放');
};

const handleAudioCanPlay = () => {
  console.log('音频可以播放');
  if (audioPlayerRef.value && playerConfig.autoplay) {
    audioPlayerRef.value.play().catch(e => {
      console.warn('自动播放失败 (可能是浏览器限制):', e);
    });
  }
};

// 使用防抖包装 SSML 输入处理函数
const handleSSMLInput = debounce(() => {
  const ttsStore = useTtsStore();
  if (ttsStore.page.tabIndex === INPUT_MODE.SSML && !ttsStore.inputs.isSSMLManuallyEdited) {
    ttsStore.inputs.isSSMLManuallyEdited = true;
    console.log('SSML已被手动编辑，当前tabIndex:', ttsStore.page.tabIndex);
  }
}, 300); // 300ms 的防抖延迟

// 监听SSML模式变化
watch(isSSMLMode, (newValue) => {
  const ttsStore = useTtsStore();
  if (!newValue) {
    // 切换到纯文本模式时，重置手动编辑状态
    ttsStore.inputs.isSSMLManuallyEdited = false;
    console.log('切换到纯文本模式，重置SSML编辑状态');
  }
});
</script>

<style>
/* 全局样式导入 */
@import './MainStyles.css';
</style>

<style scoped>
/* 组件作用域样式导入 */
@import './MainScopedStyles.css';

/* 主界面容器 */
.modern-main {
  padding: 20px;
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: var(--background-color);
  overflow-x: hidden;
}

/* 控制栏 */
.compact-controls-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-top: 1px solid var(--border-color);
  gap: 20px;
}

/* 确保播放器卡片与侧边栏不冲突 */
.player-card {
  margin-top: 20px;
  width: 100%;
  max-width: 1000px;
  background-color: var(--card-background);
  border-radius: var(--border-radius-large);
  box-shadow: var(--shadow-medium);
  border: 1px solid var(--border-color);
  overflow: hidden;
  z-index: 1;
}

/* 确保页脚与侧边栏不冲突 */
.site-footer {
  margin-top: 20px;
  width: 100%;
  max-width: 1000px;
  padding: 20px;
  background-color: var(--card-background);
  border-radius: var(--border-radius-large);
  box-shadow: var(--shadow-medium);
  border: 1px solid var(--border-color);
  z-index: 1;
}

/* 响应式布局 */
@media (max-width: 1200px) {
  .input-area-card,
  .player-card,
  .site-footer {
    max-width: 95%;
}
}

@media (max-width: 768px) {
  .modern-main {
    padding: 0;
  }

  /* 使用更高优先级的选择器 */
  .modern-main .input-area-card,
  .modern-main .batch-area-card,
  .modern-main .config-page-container,
  .modern-main .doc-page-container,
  .modern-main .content-area,
  .modern-main .history-record-container {
    padding: 10px;
    width: 100%;
    border-radius: 0;
    box-shadow: none;
    border: none;
  }

  /* 在线生成字幕页面的空状态样式 */
  .modern-main .content-area .empty-state {
    padding: 20px;
    text-align: center;
  }

  .modern-main .compact-controls-bar {
    padding: 16px;
    margin-top: 10px;
    background-color: var(--card-background);
    border-top: 1px solid var(--border-color);
  }

  .modern-main .player-card {
    margin-top: 10px;
    border-radius: 0;
    box-shadow: none;
    border-top: 1px solid var(--border-color);
    border-bottom: 1px solid var(--border-color);
  }

  .modern-main .site-footer {
    margin-top: 10px;
    border-radius: 0;
    box-shadow: none;
  }
  
  .compact-selects {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  
  .voice-select {
    grid-column: span 2;
  }
  
  .compact-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .player-row {
    flex-direction: column;
    gap: 10px;
  }
  
  .format-selection {
    width: 100%;
    justify-content: space-between;
  }
  
  .download-button {
    align-self: flex-end;
    margin-top: 8px;
  }
  
  .audio-player {
    width: 100%;
  }
}

/* 在线生成字幕页面的空状态样式 */
.content-area {
  width: 100%;
  max-width: 1000px;
  margin: 20px auto;
  background-color: var(--card-background);
  border-radius: var(--border-radius-large);
  box-shadow: var(--shadow-medium);
  border: 1px solid var(--border-color);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.empty-icon {
  color: var(--primary-color);
  margin-bottom: 20px;
}

.empty-state h2 {
  margin: 0 0 10px;
  color: var(--text-primary);
}

.empty-state p {
  margin: 0 0 20px;
  color: var(--text-secondary);
}

.audio-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 50px;
  color: #909399;
  background-color: #f5f7fa;
  border-radius: 4px;
  font-size: 14px;
}

/* 历史记录页面样式 */
.history-record-container {
  width: 100%;
  max-width: 1000px;
  margin: 20px auto;
  background-color: var(--card-background);
  border-radius: var(--border-radius-large);
  box-shadow: var(--shadow-medium);
  border: 1px solid var(--border-color);
  overflow: hidden;
}
</style>