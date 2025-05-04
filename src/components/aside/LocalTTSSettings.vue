<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useLocalTTSStore } from '@/store/local-tts-store';
import { ElMessage } from 'element-plus';

const localTTSStore = useLocalTTSStore();

// 表单数据
const form = reactive({
  enabled: localTTSStore.config.enabled,
  baseUrl: localTTSStore.config.baseUrl,
  defaultVoice: localTTSStore.config.defaultVoice,
  defaultLanguage: localTTSStore.config.defaultLanguage,
});

// 状态
const isConnecting = ref(false);
const isConnected = ref(false);
const freeLimit = ref(null);
const connectionError = ref('');

// 测试音频
const testText = '这是一个测试，连接到free TTS服务';
const isPlayingTest = ref(false);

// 检查连接
const checkConnection = async () => {
  isConnecting.value = true;
  connectionError.value = '';
  
  try {
    const connected = await localTTSStore.testAPIConnection(form.baseUrl);
    isConnected.value = connected;
    
    if (connected) {
      ElMessage.success('连接成功！服务器正常工作');
    } else {
      ElMessage.error('无法连接到服务器，请检查URL和服务状态');
      connectionError.value = '连接失败';
    }
  } catch (error: any) {
    isConnected.value = false;
    connectionError.value = error.message;
    ElMessage.error(`连接失败: ${error.message}`);
  } finally {
    isConnecting.value = false;
  }
};

// 保存配置
const saveConfig = () => {
  localTTSStore.config.enabled = form.enabled;
  localTTSStore.config.baseUrl = form.baseUrl;
  localTTSStore.config.defaultVoice = form.defaultVoice;
  localTTSStore.config.defaultLanguage = form.defaultLanguage;
  localTTSStore.saveConfig();
  
  ElMessage.success('设置已保存');
  
  // 保存后自动检查连接
  checkConnection();
};

// 重置配置
const resetConfig = () => {
  localTTSStore.resetConfig();
  
  // 从 store 更新本地表单值
  form.enabled = localTTSStore.config.enabled;
  form.baseUrl = localTTSStore.config.baseUrl;
  form.defaultVoice = localTTSStore.config.defaultVoice;
  form.defaultLanguage = localTTSStore.config.defaultLanguage;
  
  ElMessage.success('设置已重置为默认值');
};

// 测试播放
const testPlay = async () => {
  isPlayingTest.value = true;
  
  try {
    // 先保存配置
    saveConfig();
    
    // 然后使用新配置测试播放
    const success = await localTTSStore.getAndPlayAudio(testText);
    
    if (!success) {
      ElMessage.error('播放失败，请检查服务器配置');
    }
  } catch (error: any) {
    ElMessage.error(`播放失败: ${error.message}`);
  } finally {
    isPlayingTest.value = false;
  }
};

// 组件挂载时自动检查连接
onMounted(async () => {
  if (form.enabled) {
    await checkConnection();
    
    // 如果连接成功，获取免费额度
    if (isConnected.value) {
      await localTTSStore.getFreeLimitInfo();
      freeLimit.value = localTTSStore.serverStatus.freeLimit;
    }
  }
});
</script>

<template>
  <div class="local-tts-settings">
    <h3 class="local-tts-header">免费TTS服务</h3>
    
    <!-- 免费额度信息 -->
    <div v-if="isConnected && localTTSStore.serverStatus.freeLimit" class="free-limit-info">
      <h4>免费额度信息</h4>
      <div class="limit-progress">
        <span>已使用: {{ localTTSStore.serverStatus.freeLimit.used }} / {{ localTTSStore.serverStatus.freeLimit.free_limit }}</span>
        <el-progress 
          :percentage="localTTSStore.freeLimitUsagePercent" 
          :status="localTTSStore.freeLimitUsagePercent > 90 ? 'exception' : ''"
        />
      </div>
      <p>剩余: {{ localTTSStore.serverStatus.freeLimit.remaining }} 字符</p>
      <p>重置日期: {{ localTTSStore.serverStatus.freeLimit.reset_date }}</p>
    </div>
    
    <!-- 连接状态 -->
    <div class="connection-status">
      <p v-if="isConnected" class="connection-success">
        <el-icon><Check /></el-icon> 已连接到免费服务
      </p>
      <p v-else class="connection-error">
        <el-icon><Close /></el-icon> 未连接
        <span v-if="connectionError">: {{ connectionError }}</span>
      </p>
      
      <el-button 
        type="success" 
        @click="checkConnection"
        :loading="isConnecting"
        size="small"
      >
        检查连接
      </el-button>
      
      <el-button 
        type="warning" 
        @click="testPlay"
        :disabled="!isConnected || isPlayingTest"
        :loading="isPlayingTest"
        size="small"
      >
        测试播放
      </el-button>
    </div>
    
    <el-alert
      v-if="localTTSStore.freeLimitUsagePercent > 80"
      title="免费额度即将用完"
      type="warning"
      :closable="false"
      show-icon
    >
      <p>您的免费额度即将用完，请考虑：</p>
      <ul>
        <li>等待额度重置</li>
        <li>使用其他API选项</li>
        <li>联系我们升级套餐</li>
      </ul>
    </el-alert>
    
    <div class="advanced-section">
      <el-collapse>
        <el-collapse-item title="高级配置" name="1">
          <el-form label-position="top">
            <el-form-item label="启用免费TTS服务">
              <el-switch v-model="form.enabled" />
            </el-form-item>
            
            <el-form-item label="服务器地址">
              <el-input 
                v-model="form.baseUrl" 
                placeholder="例如: http://localhost:8080"
                :disabled="!form.enabled"
              />
            </el-form-item>
            
            <el-form-item label="默认声音">
              <el-input 
                v-model="form.defaultVoice" 
                placeholder="例如: zh-CN-XiaoxiaoNeural"
                :disabled="!form.enabled"
              />
            </el-form-item>
            
            <el-form-item label="默认语言">
              <el-input 
                v-model="form.defaultLanguage" 
                placeholder="例如: zh-CN"
                :disabled="!form.enabled"
              />
            </el-form-item>
            
            <el-form-item>
              <div class="button-group">
                <el-button 
                  type="primary" 
                  @click="saveConfig"
                  :disabled="!form.enabled"
                >
                  保存配置
                </el-button>
                <el-button 
                  @click="resetConfig"
                  :disabled="!form.enabled"
                >
                  重置默认
                </el-button>
              </div>
            </el-form-item>
          </el-form>
        </el-collapse-item>
      </el-collapse>
    </div>
  </div>
</template>

<style scoped>
.local-tts-settings {
  padding: 15px;
}

.local-tts-header {
  margin-bottom: 15px;
  color: #409EFF;
  font-weight: bold;
  font-size: 18px;
}

.button-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.connection-status {
  margin-top: 15px;
  padding: 15px;
  border-radius: 6px;
  background-color: var(--card-background);
  border: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.connection-success {
  color: var(--success-color, #67c23a);
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 0;
  flex: 1;
}

.connection-error {
  color: var(--error-color, #f56c6c);
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 0;
  flex: 1;
}

.free-limit-info {
  margin-bottom: 15px;
  padding: 15px;
  border-radius: 6px;
  background-color: #f0f9eb;
  border: 1px solid #e1f3d8;
}

.limit-progress {
  margin-top: 10px;
  margin-bottom: 10px;
}

.advanced-section {
  margin-top: 20px;
}
</style> 