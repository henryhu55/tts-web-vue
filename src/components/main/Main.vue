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
                <!-- 字符统计显示 -->
                <div class="char-counter" v-if="formConfig.api === 5">
                  <span class="char-count" :class="{ 'char-warning': currentCharCount > 800, 'char-error': currentCharCount > 1000 }">
                    {{ currentCharCount }}/1000
                  </span>
                  <el-tooltip content="免费用户单次请求字符数限制为1000字符" placement="top" effect="light">
                    <el-icon class="char-info-icon"><InfoFilled /></el-icon>
                  </el-tooltip>
                </div>
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
            @input="handleTextInput"
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
      <div class="controls-wrapper">
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
        
        <!-- 集成播放器到控制栏 -->
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
        <h2>批量处理</h2>
        <div class="batch-actions">
          <!-- 添加隐藏的文件输入框，用于直接触发文件选择 -->
          <input 
            type="file" 
            ref="uploadInput" 
            @change="handleFileInputChange" 
            accept=".txt" 
            multiple 
            style="display: none"
          />
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
              <el-button type="primary" class="upload-btn">
                <el-icon><Upload /></el-icon>
                选择文件
              </el-button>
            </template>
          </el-upload>
          <el-button @click="clearAll" class="clear-button" type="danger" plain>
            <el-icon><DeleteFilled /></el-icon>
            清空所有
          </el-button>
        </div>
      </div>
      
      <div class="card-body">
        <!-- 简化版表格 -->
        <div v-if="Array.isArray(ttsStore.tableData) && ttsStore.tableData.length > 0" class="simple-table">
          <div class="table-header">
            <span>文件列表</span>
            <span class="file-count">共 {{ ttsStore.tableData.length }} 个文件</span>
          </div>
          <table>
            <thead>
              <tr>
                <th width="40%">文件名</th>
                <th width="20%">文件大小</th>
                <th width="20%">状态</th>
                <th width="20%">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in ttsStore.tableData" :key="index" :class="{'table-row-hover': true}">
                <td>
                  <el-tooltip :content="item.filePath || item.fileName" placement="top" effect="light">
                    <span class="file-name-text">{{ item.fileName }}</span>
                  </el-tooltip>
                </td>
                <td>{{ item.fileSize }}</td>
                <td>
                  <span class="status-tag" :class="item.status === 'ready' ? 'status-pending' : 'status-done'">
                    {{ item.status === 'ready' ? '待转换' : '已完成' }}
                  </span>
                </td>
                <td>
                  <div class="action-buttons">
                    <template v-if="item.status === 'ready'">
                      <button class="delete-btn" @click="handleDelete(index, item)">
                        删除
                      </button>
                    </template>
                    <div v-else class="play-buttons">
                      <button class="play-btn" @click="play(item)">
                        播放
                      </button>
                      <button class="download-btn" @click="downloadFile(item)">
                        下载
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- 空状态 -->
        <div v-else class="empty-table-hint">
          <el-empty description="暂无文件，请先上传文件" :image-size="100">
            <el-button type="primary" @click="$refs.uploadInput && $refs.uploadInput.click()">
              <el-icon><Upload /></el-icon>
              选择文件
            </el-button>
          </el-empty>
        </div>
        
        <!-- 调试信息，只在开发环境显示 -->
        <div v-if="false" class="debug-info">
          <p>ttsStore.tableData 类型: {{ typeof ttsStore.tableData }}</p>
          <p>ttsStore.tableData 长度: {{ Array.isArray(ttsStore.tableData) ? ttsStore.tableData.length : '非数组' }}</p>
          <details>
            <summary>ttsStore.tableData 内容</summary>
            <pre>{{ JSON.stringify(ttsStore.tableData, null, 2) }}</pre>
          </details>
          <button @click="addTestFile">添加测试文件</button>
        </div>
      </div>
      
      <!-- 批量处理的控制条 -->
      <div class="controls-wrapper">
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
            
            <el-tooltip
              content="将所有文件批量转换为语音"
              placement="top"
              effect="light"
            >
              <el-button 
                type="primary" 
                size="small"
                @click="batchConvert"
                :loading="isLoading"
                :disabled="Array.isArray(ttsStore.tableData) ? ttsStore.tableData.length === 0 : true"
                class="batch-convert-btn"
              >
                <el-icon><CaretRight /></el-icon>
                批量转换
              </el-button>
            </el-tooltip>
          </div>
        </div>
        
        <!-- 集成播放器到批量处理控制栏 -->
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
import { ref, watch, onMounted, nextTick, reactive, computed } from "vue";
import { useI18n } from 'vue-i18n';
import i18n from '@/assets/i18n/i18n';
import { useTtsStore, INPUT_MODE } from "@/store/store";
import { useFreeTTSstore } from "@/store/play";
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
  batchConvert,
  play,
  downloadFile,  // 添加downloadFile函数
  
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

// 确保从composables/main导入uploadRef
const { uploadRef } = useMainSetup();

// 确保tableData存在且有值
if (!ttsStore.tableData) {
  ttsStore.tableData = ref([]);
  console.log('已初始化ttsStore.tableData');
} else if (typeof ttsStore.tableData === 'object' && 'value' in ttsStore.tableData && !ttsStore.tableData.value) {
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

// 用于调试表格数据
const getTableDataInfo = () => {
  console.log('表格数据类型:', typeof tableData.value);
  console.log('表格数据长度:', Array.isArray(tableData.value) ? tableData.value.length : 0);
  console.log('表格数据内容:', tableData.value);
};

// 初始化全局引用，确保在setup函数外部的函数也能访问到store数据
onMounted(() => {
  // 初始化全局引用
  initGlobalRefs();
  
  // 检查当前API是否为免费TTS服务，如果是则自动获取免费额度信息
  // 使用更安全的方式检查API类型，默认为5(免费服务)
  const currentApi = formConfig.api !== undefined ? formConfig.api : 5;
  console.log('当前API类型:', currentApi);
  
  if (currentApi === 5) {
    console.log('当前使用免费TTS服务，自动检查免费额度');
    const localTTSStore = useFreeTTSstore();
    if (localTTSStore) {
      // 确保免费TTS服务已启用
      if (!localTTSStore.config.enabled) {
        localTTSStore.config.enabled = true;
        localTTSStore.saveConfig();
      }
      
      // 检查连接并获取免费额度信息
      localTTSStore.checkServerConnection().then(connected => {
        if (connected) {
          console.log("已连接到免费TTS服务");
          // 获取并显示免费额度信息
          localTTSStore.getFreeLimitInfo().then(freeLimit => {
            if (freeLimit) {
              console.log("页面初始化时获取到免费额度信息:", freeLimit);
            }
          });
        } else {
          console.error("无法连接到免费TTS服务");
        }
      });
    }
  }

  // 添加音频播放器事件监听器（只添加一次）
  nextTick(() => {
    if (audioPlayerRef.value) {
      console.log('添加音频播放器事件监听器');

      audioPlayerRef.value.addEventListener('play', () => {
        console.log('监听到音频开始播放');
      });

      audioPlayerRef.value.addEventListener('pause', () => {
        console.log('监听到音频暂停');
      });

      audioPlayerRef.value.addEventListener('ended', () => {
        console.log('监听到音频播放结束');
      });

      audioPlayerRef.value.addEventListener('loadstart', () => {
        console.log('音频开始加载');
      });

      audioPlayerRef.value.addEventListener('loadeddata', () => {
        console.log('音频数据加载完成');
      });

      audioPlayerRef.value.addEventListener('canplay', () => {
        console.log('音频可以播放');
        if (audioPlayerRef.value && playerConfig.autoplay) {
          audioPlayerRef.value.play().catch(e => {
            console.warn('自动播放失败 (可能是浏览器限制):', e);
          });
        }
      });

      audioPlayerRef.value.addEventListener('error', (e) => {
        // 只在有有效音频源时才报告错误，避免初始化时的无意义错误
        if (audioPlayerRef.value &&
            audioPlayerRef.value.src &&
            audioPlayerRef.value.src !== '' &&
            audioPlayerRef.value.src !== window.location.href &&
            !audioPlayerRef.value.src.endsWith('/') &&
            (audioPlayerRef.value.src.startsWith('blob:') ||
             audioPlayerRef.value.src.startsWith('http://') ||
             audioPlayerRef.value.src.startsWith('https://') ||
             audioPlayerRef.value.src.startsWith('data:'))) {
          console.error('音频播放器错误:', e);
          console.error('错误的音频源:', audioPlayerRef.value.src);
        } else {
          // 初始化时的错误，不需要报告
          console.debug('忽略音频初始化错误 - 无有效音频源');
        }
      });
    }
  });

  // 防止重复调用的标志
  let isUpdatingAudioSrc = false;

  // 使用全局引用更新currMp3Url
  const updateAudioSrc = () => {
    // 防止重复调用
    if (isUpdatingAudioSrc) {
      console.log('updateAudioSrc已在执行中，跳过重复调用');
      return;
    }

    try {
      isUpdatingAudioSrc = true;

      if (audioPlayerRef.value) {
        // 尝试从全局引用和store中获取音频URL
        let audioUrl = '';

        // 尝试来源1: globalCurrMp3Url
        if (globalCurrMp3Url && typeof globalCurrMp3Url === 'object' && 'value' in globalCurrMp3Url) {
          audioUrl = globalCurrMp3Url.value;
          console.log('从globalCurrMp3Url获取到URL:', audioUrl);
        }

        // 尝试来源2: ttsStore.currMp3Url
        if ((!audioUrl || audioUrl === '') && ttsStore.currMp3Url) {
          if (typeof ttsStore.currMp3Url === 'object' && 'value' in ttsStore.currMp3Url) {
            audioUrl = ttsStore.currMp3Url.value;
            console.log('从ttsStore.currMp3Url ref获取到URL:', audioUrl);
          } else if (typeof ttsStore.currMp3Url === 'string') {
            audioUrl = ttsStore.currMp3Url;
            console.log('从ttsStore.currMp3Url字符串获取到URL:', audioUrl);
          }
        }

        // 尝试来源3: 组件内的currMp3Url
        if ((!audioUrl || audioUrl === '') && currMp3Url) {
          if (typeof currMp3Url === 'object' && 'value' in currMp3Url) {
            audioUrl = currMp3Url.value;
            console.log('从组件currMp3Url ref获取到URL:', audioUrl);
          } else if (typeof currMp3Url === 'string') {
            audioUrl = currMp3Url;
            console.log('从组件currMp3Url字符串获取到URL:', audioUrl);
          }
        }

        // 检查URL是否有效（blob URL和http/https URL都是有效的）
        if (audioUrl &&
            audioUrl !== '' &&
            audioUrl !== 'null' &&
            audioUrl !== 'undefined' &&
            (audioUrl.startsWith('blob:') ||
             audioUrl.startsWith('http://') ||
             audioUrl.startsWith('https://') ||
             audioUrl.startsWith('data:')) &&
            audioUrl !== window.location.href) {
          console.log('检测到有效的音频URL:', audioUrl);
          console.log('播放器src是否需要更新:', audioPlayerRef.value.src !== audioUrl);

          // 更新组件内的currMp3Url ref
          if (currMp3Url && typeof currMp3Url === 'object' && 'value' in currMp3Url) {
            if (currMp3Url.value !== audioUrl) {
              currMp3Url.value = audioUrl;
              // 只有在URL真正改变时才重新加载
            } else {
              console.log('组件currMp3Url.value已经是目标URL，无需更新');
            }
          }

          // 不需要手动设置src，让Vue的响应式系统处理
          // Vue会自动根据currMp3Url的变化更新:src绑定
        } else {
          console.log('没有有效的音频URL，不设置音频源');
        }
        
        // 事件监听器已在组件挂载时添加，这里不需要重复添加
      } else {
        console.warn('音频元素未找到');
      }
    } catch (err) {
      console.error('更新音频src时出错:', err);
    } finally {
      // 重置标志，允许下次调用
      isUpdatingAudioSrc = false;
    }
  };
  
  // 监听组件内的currMp3Url变化
  watch(currMp3Url, (newValue, oldValue) => {
    console.log('组件currMp3Url变化:', oldValue, '->', newValue);
    if (newValue && newValue !== oldValue) {
      nextTick(() => {
        // 更新音频源
        console.log('更新音频源URL:', newValue);
        if (audioPlayerRef.value) {
          audioPlayerRef.value.src = newValue;
          audioPlayerRef.value.load(); // 强制重新加载音频
          // 检查是否需要自动播放
          if (config.autoplay) {
            console.log('检测到autoplay开启，尝试自动播放新音频');
            const playPromise = audioPlayerRef.value.play();
            if (playPromise !== undefined) {
              playPromise.catch(error => {
                console.error('自动播放失败:', error);
              });
            }
          } else {
            console.log('autoplay已关闭，不自动播放');
          }
        } else {
          console.warn('音频元素未找到，无法更新音频源');
        }
      });
    }
  }, { immediate: true });

  // 监听全局currMp3Url变化，并同步到组件
  if (globalCurrMp3Url) {
    watch(globalCurrMp3Url, (newValue, oldValue) => {
      console.log('全局currMp3Url变化:', oldValue, '->', newValue);

      if (newValue && newValue !== oldValue) {
        // 更新组件内的URL（这会触发上面的watch）
        if (currMp3Url && typeof currMp3Url === 'object' && 'value' in currMp3Url) {
          console.log('同步全局URL到组件:', newValue);
          currMp3Url.value = newValue;
        }
      }
    });
  }
  
  // 监听 store 中的 currMp3Url 变化
  watch(() => ttsStore.currMp3Url, (newValue, oldValue) => {
    console.log('store currMp3Url变化:', oldValue, '->', newValue);
    if (newValue && newValue !== oldValue) {
      // 确保是字符串类型
      const urlStr = typeof newValue === 'object' && 'value' in newValue ? newValue.value : newValue;
      if (currMp3Url && typeof currMp3Url === 'object' && 'value' in currMp3Url) {
        console.log('从store同步URL到组件:', urlStr);
        currMp3Url.value = urlStr;
      }
    }
  });

  // 检查表格数据
  getTableDataInfo();
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

// 音频事件处理已移至onMounted中统一管理

// 统一的字符统计函数
const calculateCharCount = (inputValue: string, ssmlValue: string, currentMode: boolean) => {
  // 根据当前模式决定使用哪个内容计算字符数
  if (currentMode) {
    // SSML模式：去除标签后计算字符数
    const plainText = (ssmlValue || '').replace(/<[^>]*>/g, '');
    return plainText.length;
  } else {
    // 纯文本模式：直接计算inputValue的字符数
    return (inputValue || '').length;
  }
};

// 字符统计计算
const currentCharCount = computed(() => {
  if (!inputs.value) return 0;

  const inputValue = inputs.value.inputValue || '';
  const ssmlValue = inputs.value.ssmlValue || '';

  return calculateCharCount(inputValue, ssmlValue, isSSMLMode.value);
});

// 处理纯文本输入
const handleTextInput = (value: string) => {
  // 纯文本输入处理逻辑（如果需要的话）
};

// 使用防抖包装 SSML 输入处理函数
const handleSSMLInput = debounce(() => {
  const ttsStore = useTtsStore();
  if (ttsStore.page.tabIndex === INPUT_MODE.SSML && !ttsStore.inputs.isSSMLManuallyEdited) {
    ttsStore.inputs.isSSMLManuallyEdited = true;
  }
}, 300); // 300ms 的防抖延迟



// 监听SSML模式变化
watch(isSSMLMode, (newValue) => {
  const ttsStore = useTtsStore();
  if (!newValue) {
    // 切换到纯文本模式时，重置手动编辑状态
    ttsStore.inputs.isSSMLManuallyEdited = false;
  }
});

// 获取表格数据
const getTableData = () => {
  // 直接从 ttsStore 获取最新的表格数据
  if (!ttsStore) {
    console.warn('getTableData: ttsStore 未定义');
    return [];
  }

  try {
    // 检查 tableData 类型并返回正确的数据
    if (ttsStore.tableData === null || ttsStore.tableData === undefined) {
      console.warn('getTableData: tableData 不存在，返回空数组');
      return [];
    }
    
    if (Array.isArray(ttsStore.tableData)) {
      console.log('getTableData: tableData 是数组，长度:', ttsStore.tableData.length);
      return ttsStore.tableData;
    } 
    
    if (typeof ttsStore.tableData === 'object') {
      if ('value' in ttsStore.tableData && Array.isArray(ttsStore.tableData.value)) {
        console.log('getTableData: tableData 是 ref 对象，长度:', ttsStore.tableData.value.length);
        return ttsStore.tableData.value;
      }
    }
    
    console.warn('getTableData: tableData 类型未知，返回空数组');
    return [];
  } catch (error) {
    console.error('getTableData 错误:', error);
    return [];
  }
};

// 监听表格数据变化
watch(() => ttsStore.tableData, (newValue) => {
  console.log('监听到表格数据变化:', Array.isArray(newValue) 
    ? newValue.length + ' 个文件' 
    : (typeof newValue === 'object' && 'value' in newValue && Array.isArray(newValue.value)) 
      ? newValue.value.length + ' 个文件'
      : '无数据');
});

// 处理直接文件输入变化
const handleFileInputChange = (event) => {
  const files = event.target.files;
  if (!files || files.length === 0) {
    return;
  }
  
  console.log(`选择了 ${files.length} 个文件`);
  
  // 处理每个文件
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    // 获取文件路径（如果可能）
    let filePath = file.name;
    
    // 如果是File System Access API（现代浏览器）
    if (file.webkitRelativePath) {
      filePath = file.webkitRelativePath;
    } else if (file.path) {
      // Electron环境
      filePath = file.path;
    }
    
    // 创建一个模拟的上传文件对象，适配el-upload的fileChange接口
    const uploadFile = {
      name: file.name,
      size: file.size,
      raw: file,
      path: filePath // 添加路径属性
    };
    
    // 调用fileChange函数处理文件
    fileChange(uploadFile, [uploadFile]);
  }
  
  // 重置文件输入，允许再次选择相同的文件
  event.target.value = '';
};

// 在批量处理页面加载时检查表格数据
watch(() => page.asideIndex, (newValue) => {
  if (newValue === '2') {
    console.log('进入批量处理页面，检查表格数据:');
    console.log('tableData类型:', typeof ttsStore.tableData);
    console.log('tableData长度:', Array.isArray(ttsStore.tableData) ? ttsStore.tableData.length : '非数组');
    console.log('tableData内容:', ttsStore.tableData);
  }
});

// 添加测试文件函数
const addTestFile = () => {
  try {
    console.log('添加测试文件');
    
    // 检查ttsStore
    if (!ttsStore) {
      console.error('ttsStore不存在');
      ElMessage.error('存储实例不可用');
      return;
    }
    
    // 创建测试文件
    const testFile = {
      fileName: `测试文件_${new Date().getTime()}`,
      filePath: `测试路径_${new Date().getTime()}`,
      fileSize: '1 KB',
      status: 'ready',
      content: '这是测试内容',
      file: null
    };
    
    // 确保tableData是数组
    if (!ttsStore.tableData) {
      ttsStore.tableData = [];
    }
    
    // 添加文件
    if (Array.isArray(ttsStore.tableData)) {
      // 创建新数组
      ttsStore.tableData = [...ttsStore.tableData, testFile];
    } else {
      ttsStore.tableData = [testFile];
    }
    
    console.log('已添加测试文件', testFile.fileName);
    console.log('当前tableData:', ttsStore.tableData);
    
    // 尝试调用forceUpdate
    if (typeof ttsStore.forceUpdate === 'function') {
      ttsStore.forceUpdate();
    }
    
    ElMessage.success('已添加测试文件');
  } catch (error) {
    console.error('添加测试文件失败:', error);
    ElMessage.error('添加测试文件失败');
  }
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
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: var(--background-color);
  overflow-x: hidden;
}

/* 控制区包装器 */
.controls-wrapper {
  width: 100%;
  max-width: 1000px;
  background-color: var(--card-background);
  box-shadow: var(--shadow-medium);
  border-left: 1px solid var(--border-color);
  border-right: 1px solid var(--border-color);
  overflow: hidden;
}

/* 控制栏 */
.compact-controls-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-top: 1px solid var(--border-color);
  gap: 20px;
  border-bottom: none; /* 移除底部边框 */
}

/* 集成播放器容器样式 */
.player-container {
  width: 100%;
  padding: 0 16px 16px 16px;
  background-color: var(--card-background);
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--shadow-medium);
  border-left: 1px solid var(--border-color);
  border-right: 1px solid var(--border-color);
  max-width: 1000px;
}

/* 播放器行 */
.player-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

/* 音频播放器 */
.audio-player {
  flex-grow: 1;
}

.modern-audio-player {
  width: 100%;
  height: 40px;
  border-radius: var(--border-radius);
}

/* 页脚样式 - 应该在播放器之后显示 */
.site-footer {
  margin-top: 0; /* 移除顶部边距 */
  width: 100%;
  max-width: 1000px;
  padding: 20px;
  background-color: var(--card-background);
  border-radius: 0 0 var(--border-radius-large) var(--border-radius-large); /* 只有底部有圆角 */
  box-shadow: var(--shadow-medium);
  border: 1px solid var(--border-color);
  border-top: none; /* 移除顶部边框 */
  z-index: 1;
}

/* 响应式布局 */
@media (max-width: 1200px) {
  .input-area-card,
  .player-container,
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
  .modern-main .history-record-container,
  .modern-main .controls-wrapper,
  .modern-main .player-container {
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
    margin-top: 0;
    background-color: var(--card-background);
    border-top: 1px solid var(--border-color);
  }

  .modern-main .player-container {
    margin-top: 0;
    border-radius: 0;
    box-shadow: none;
    border-top: none;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 16px;
  }

  .modern-main .site-footer {
    margin-top: 0;
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

/* 输入区域卡片样式 */
.input-area-card, .batch-area-card {
  width: 100%;
  max-width: 1000px;
  margin-bottom: 0; /* 移除底部边距 */
  background-color: var(--card-background);
  border-radius: var(--border-radius-large) var(--border-radius-large) 0 0; /* 只有顶部有圆角 */
  box-shadow: var(--shadow-medium);
  border: 1px solid var(--border-color);
  border-bottom: none; /* 移除底部边框 */
  overflow: hidden;
  z-index: 1;
}

/* 批量处理卡片样式 */
.batch-area-card .card-body {
  padding: 16px;
  min-height: 300px;
}

/* 表格样式 */
.modern-table {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--card-background, #ffffff);
  border: 1px solid var(--border-color, #e4e7ed);
}

.modern-table .el-table__header-wrapper th {
  background-color: var(--background-color-light, #f5f7fa);
  color: var(--text-primary, #303133);
  font-weight: 600;
}

.modern-table .el-table__row {
  background-color: var(--card-background, #ffffff);
}

.modern-table .el-table__row:hover {
  background-color: var(--background-color-hover, #f5f7fa);
}

.status-tag {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  line-height: 1;
  text-align: center;
}

.status-pending {
  background-color: #e6f7ff;
  color: #1890ff;
  border: 1px solid #91d5ff;
}

.status-done {
  background-color: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.play-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.delete-btn {
  background-color: #f56c6c;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s;
}

.delete-btn:hover {
  background-color: #e64242;
}

.play-btn, .download-btn {
  padding: 6px 12px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 12px;
}

.play-btn {
  background-color: #409eff;
  color: white;
  margin-right: 8px;
}

.play-btn:hover {
  background-color: #66b1ff;
}

.download-btn {
  background-color: #909399;
  color: white;
}

.download-btn:hover {
  background-color: #a6a9ad;
}

/* 格式选择区域 */
.format-selection {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 120px;
}

.format-label {
  font-size: 14px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.format-select {
  width: 80px;
}

.format-option {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 下载按钮 */
.download-button {
  display: flex;
  align-items: center;
}

/* 批量处理卡片标题栏 */
.batch-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--border-color, #e4e7ed);
  background-color: var(--card-background, #ffffff);
}

.batch-card-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary, #303133);
  display: flex;
  align-items: center;
}

.batch-card-header h2::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 18px;
  background-color: var(--primary-color, #409eff);
  border-radius: 2px;
  margin-right: 8px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #ebeef5;
  font-size: 14px;
  color: #606266;
}

.table-header span {
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
}

.table-header span::before {
  content: '';
  display: inline-block;
  width: 3px;
  height: 14px;
  background-color: var(--primary-color, #409eff);
  border-radius: 2px;
  margin-right: 8px;
}

.batch-actions {
  display: flex;
  gap: 12px;
}

.upload-btn {
  font-weight: 500;
}

.clear-button {
  font-weight: 500;
}

/* 批量转换按钮 */
.batch-convert-btn {
  background-color: var(--primary-color, #409eff);
  border-color: var(--primary-color, #409eff);
  font-weight: 600;
  min-width: 100px;
}

.empty-table-hint {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
  background-color: #ffffff;
  border-radius: 0;
  border: 1px solid #ebeef5;
  margin: 0;
  width: 100%;
}

.card-body {
  padding: 0;
  background-color: var(--card-background, #ffffff);
  border-radius: 0;
  width: 100%;
  overflow: hidden;
  min-height: 300px;
}

.batch-area-card {
  background-color: var(--card-background, #ffffff);
  border-radius: var(--border-radius-large, 8px) var(--border-radius-large, 8px) 0 0;
  border: 1px solid var(--border-color, #e4e7ed);
  overflow: hidden;
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  box-shadow: var(--shadow-medium, 0 2px 12px rgba(0, 0, 0, 0.05));
}

.debug-info {
  margin-top: 16px;
  padding: 12px;
  background-color: #f9f9fa;
  border-radius: 8px;
  border: 1px dashed #d3d3d3;
  font-size: 12px;
  color: #666;
  white-space: pre-wrap;
}

.simple-table {
  width: 100%;
  margin: 0 0 20px 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.simple-table table {
  width: 100%;
  border-collapse: collapse;
  background-color: #ffffff;
  border: 1px solid #ebeef5;
}

.simple-table th {
  background-color: #f5f7fa;
  color: #606266;
  font-weight: 500;
  padding: 12px 16px;
  text-align: center;
  border-bottom: 1px solid #e4e7ed;
  font-size: 14px;
}

.simple-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
  color: #606266;
  font-size: 14px;
  text-align: center;
}

.simple-table td:first-child {
  text-align: left;
}

.simple-table tr:last-child td {
  border-bottom: none;
}

.simple-table tr:hover {
  background-color: #f5f7fa;
}

.simple-table button {
  background-color: #409eff;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
}

.simple-table button:hover {
  background-color: #66b1ff;
}

.simple-table button:active {
  background-color: #3a8ee6;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: #f8f9fa;
  border-bottom: 1px solid #ebeef5;
  font-size: 14px;
  color: #606266;
}

.table-header span {
  font-weight: 600;
  color: #303133;
}

.file-count {
  color: #909399;
  font-size: 12px;
  font-weight: normal;
}

.table-row-hover {
  transition: all 0.3s;
}

.table-row-hover:hover {
  background-color: #ecf5ff !important;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.edit-btn {
  background-color: #67c23a;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s;
  margin-right: 8px;
}

.edit-btn:hover {
  background-color: #85ce61;
}

.file-name-text {
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
}

/* 字符统计样式 */
.char-counter {
  display: flex;
  align-items: center;
  margin-left: 12px;
  font-size: 12px;
  color: #666;
}

.char-count {
  font-weight: 500;
  transition: color 0.3s ease;
}

.char-count.char-warning {
  color: #e6a23c;
}

.char-count.char-error {
  color: #f56c6c;
}

.char-info-icon {
  margin-left: 4px;
  font-size: 14px;
  color: #909399;
  cursor: help;
}

.char-info-icon:hover {
  color: #409eff;
}
</style>