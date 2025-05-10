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
                :src="currMp3Url"
                :autoplay="playerConfig.autoplay"
                controls
                controlslist="nodownload"
                class="modern-audio-player"
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
                  :disabled="currMp3Url == ''"
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
          <a href="https://beian.miit.gov.cn/" target="_blank" class="beian-link">沪ICP备XXXXXXXX号-X</a>
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
          <a href="https://github.com" target="_blank" class="friendly-link">GitHub</a>
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

import { ref, watch, onMounted, nextTick, onUnmounted, reactive } from "vue";
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
  ShoppingCart,
  Download
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
  
  // 在页面切换后调整内容区域的顶部边距
  nextTick(() => {
    adjustContentMargins();
  });
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
  
  // 调整内容区域的顶部边距
  adjustContentMargins();
  
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
  
  // 设置播放器引用
  if (audioPlayerRef.value) {
    ttsStore.audioPlayer = audioPlayerRef.value;
  }
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
  // 在 web 版本中播放音频
  if (audioPlayerRef.value) {
    // 暂停当前播放
    audioPlayerRef.value.pause();
  }
  
  // 如果有音频数据
  if (val.audioData) {
    // 二进制数据
    playAudioBlob(val.audioData);
    
    ElMessage({
      message: "正在播放",
      type: "success",
      duration: 2000,
    });
  } else if (val.audioUrl) {
    // URL数据
    currMp3Url.value = val.audioUrl;
    
    if (audioPlayerRef.value) {
      audioPlayerRef.value.play().catch(err => {
        console.error('播放失败:', err);
      });
    }
    
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
    // 直接下载URL
    const a = document.createElement('a');
    a.href = val.audioUrl;
    a.download = val.fileName.split('.')[0] + '.' + playerConfig.formatType;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    ElMessage({
      message: "开始下载音频文件",
      type: "success",
      duration: 2000,
    });
  } else if (val.audioData) {
    // 下载二进制数据
    const blob = new Blob([val.audioData], { type: `audio/${playerConfig.formatType}` });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = val.fileName.split('.')[0] + '.' + playerConfig.formatType;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // 释放URL
    URL.revokeObjectURL(url);
    
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
  
  // 在窗口大小变化时调整内容区域的边距
  adjustContentMargins();
};

// 添加卸载时的清理函数
onUnmounted(() => {
  window.removeEventListener('message', handleIframeMessage);
  window.removeEventListener('resize', handleResize);
  
  // 移除键盘事件监听器
  document.removeEventListener('keydown', handleKeyDown);
  
  // 确保抽屉关闭
  openSettingsDrawer.value = false;
  
  // 清理播放器引用
  ttsStore.audioPlayer = null;
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
        // 处理二进制音频流
        playAudioBlob(res.buffer);
      } else if (res.audibleUrl) {
        // 直接使用URL
        currMp3Url.value = res.audibleUrl;
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
const startBtn = async () => {
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
  
  try {
  // 启动转换过程
    const result = await ttsStore.start();
    
    // 如果返回的是ArrayBuffer，需要处理为Blob URL
    if (result && result.buffer) {
      handleAudioBlob(result.buffer);
    } 
    // 如果直接返回了URL
    else if (result && result.audibleUrl) {
      currMp3Url.value = result.audibleUrl;
    }
    
    // 转换完成
    clearInterval(progressInterval);
    convertProgress.value = 100;
    
    // 短暂显示100%后隐藏Loading
    setTimeout(() => {
      isLoading.value = false;
      convertProgress.value = 0;
    }, 500);
  } catch (error) {
    // 转换出错
    clearInterval(progressInterval);
    isLoading.value = false;
    convertProgress.value = 0;
    
    ElMessage({
      message: "转换失败: " + (error instanceof Error ? error.message : String(error)),
      type: "error",
      duration: 3000,
    });
  }
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

// 添加audioPlayerRef引用
const audioPlayerRef = ref(null);

// 下载音频
const download = () => {
  if (!currMp3Url.value) return;
  
  isDownloading.value = true;
  
  try {
    // 创建一个下载链接
    const link = document.createElement('a');
    link.href = currMp3Url.value;
    link.download = `tts_audio_${new Date().getTime()}.${playerConfig.formatType}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('下载音频失败:', error);
  } finally {
    isDownloading.value = false;
}
};

// 设置格式类型
const setFormatType = (value: string) => {
  playerConfig.formatType = value;
  
  // 如果当前有音频链接，可以在这里转换格式
  if (currMp3Url.value) {
    // 这里可以添加转换格式的逻辑
    console.log('设置格式类型:', value);
  }
};

// 下载音频时的状态
const isDownloading = ref(false);

// 格式选项
const formatOptions = [
  { label: 'MP3', value: 'mp3' },
  { label: 'WAV', value: 'wav' }
];

// 播放器配置
const playerConfig = reactive({
  formatType: 'mp3',
  autoplay: true
});

// 监听音频URL的变化
watch(() => currMp3Url.value, (newUrl) => {
  if (newUrl && playerConfig.autoplay && audioPlayerRef.value) {
    // 确保在下一个事件循环中执行，避免DOM还未更新
    nextTick(() => {
      audioPlayerRef.value.play().catch(err => {
        console.error('自动播放失败:', err);
        // 可能是因为浏览器策略限制自动播放，这里可以添加提示
        ElMessage({
          message: "自动播放被浏览器阻止，请点击播放按钮手动播放",
          type: "info",
          duration: 3000,
        });
      });
    });
  }
});

// 处理二进制音频流，转换为可播放的URL
const handleAudioBlob = (audioBlob) => {
  // 如果已经有一个创建的URL，先释放它
  if (currMp3Url.value && currMp3Url.value.startsWith('blob:')) {
    URL.revokeObjectURL(currMp3Url.value);
}

  // 创建新的URL
  const audioUrl = URL.createObjectURL(new Blob([audioBlob], { type: `audio/${playerConfig.formatType}` }));
  
  // 更新URL
  currMp3Url.value = audioUrl;
  
  return audioUrl;
};

// 播放二进制音频
const playAudioBlob = (audioBlob) => {
  try {
    // 创建音频URL
    const audioUrl = handleAudioBlob(audioBlob);
    
    // 播放音频
    if (audioPlayerRef.value) {
      audioPlayerRef.value.src = audioUrl;
      audioPlayerRef.value.play().catch(err => {
        console.error('播放失败:', err);
        // 可能是因为浏览器策略限制自动播放
        ElMessage({
          message: "播放失败，请点击播放按钮手动播放",
          type: "info",
          duration: 3000,
        });
      });
    } else {
      console.error('找不到音频播放器元素');
    }
    
    return audioUrl;
  } catch (error) {
    console.error('播放二进制音频失败:', error);
    ElMessage({
      message: "播放失败: " + (error instanceof Error ? error.message : String(error)),
      type: "error",
      duration: 3000,
    });
    return null;
}
};

// 调整内容区域的顶部边距
const adjustContentMargins = () => {
  nextTick(() => {
    const headerHeight = 60; // 固定标题栏高度
    
    // 获取当前激活的内容区域
    let activeContent;
    
    if (page.value.asideIndex === '1') {
      // 文本转语音页面
      activeContent = document.querySelector('.input-area-card');
    } else if (page.value.asideIndex === '2') {
      // 批量处理页面
      activeContent = document.querySelector('.batch-area-card');
    } else if (page.value.asideIndex === '3') {
      // 配置页面
      activeContent = document.querySelector('.config-page-container');
    } else if (page.value.asideIndex === '4') {
      // 文档页面
      activeContent = document.querySelector('.doc-page-container');
    } else if (page.value.asideIndex === '5') {
      // 在线生成字幕页面
      activeContent = document.querySelector('.content-area');
}

    // 如果找到元素，则调整其顶部边距
    if (activeContent) {
      // 对于桌面设备，使用更大的边距
      if (window.innerWidth > 768) {
        activeContent.style.marginTop = `${headerHeight + 10}px`;
      } else {
        // 对于移动设备，使用较小的边距
        activeContent.style.marginTop = `${headerHeight + 5}px`;
}

      console.log(`已调整 ${activeContent.className} 的顶部边距`);
}
  });
};
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
  padding-top: 70px; /* 为固定标题栏留出空间 */
  width: 100%;
  min-height: 100vh;
  display: flex;
    flex-direction: column;
  align-items: center;
  background-color: var(--background-color);
  overflow-x: hidden;
}

/* 文本编辑区卡片 */
  .input-area-card {
    width: 100%;
  max-width: 1000px;
  background-color: var(--card-background);
  border-radius: var(--border-radius-large);
  box-shadow: var(--shadow-medium);
  border: 1px solid var(--border-color);
  overflow: hidden;
  margin-bottom: 20px;
  margin-top: 20px;
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
    padding: 10px;
}

  .input-area-card,
  .player-card,
  .site-footer {
    max-width: 100%;
  }
  
  .compact-controls-bar {
  flex-direction: column;
  gap: 16px;
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
</style>

