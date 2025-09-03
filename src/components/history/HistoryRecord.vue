<template>
  <div class="history-container">
    <div class="history-header">
      <h2>转换历史</h2>
      <p class="history-note">为确保隐私，转换记录仅存储在当前浏览器中，有效期为1天</p>
    </div>
    
    <div class="history-actions">
      <div class="action-buttons-main">
        <el-button type="primary" @click="loadHistory">
          <el-icon><RefreshRight /></el-icon>
          刷新历史记录
        </el-button>
        <el-button type="danger" @click="clearAllHistory" :disabled="historyRecords.length === 0">
          <el-icon><Close /></el-icon>
          清空历史
        </el-button>
        <el-button v-if="isDev" type="success" @click="addTestRecord">
          添加测试记录
        </el-button>
      </div>
    </div>
    
    <el-table :data="historyRecords" stripe class="history-table">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="text" label="文本内容" show-overflow-tooltip />
      <el-table-column prop="voiceName" label="使用声音" width="180" />
      <el-table-column prop="length" label="创建时间" width="120" />
      <el-table-column label="操作" width="220">
        <template #default="scope">
          <div class="action-buttons">
            <el-button 
              size="small" 
              type="primary" 
              @click="playAudio(scope.row)" 
              circle
              :disabled="!isValidAudioUrl(scope.row.url) && !scope.row.audioData"
            >
              <el-icon><CaretRight /></el-icon>
            </el-button>
            <el-button 
              size="small" 
              type="success" 
              @click="downloadAudio(scope.row)" 
              circle
              :disabled="!isValidAudioUrl(scope.row.url) && !scope.row.audioData"
            >
              <el-icon><Download /></el-icon>
            </el-button>
            <el-button size="small" type="danger" @click="deleteRecord(scope.row)" circle>
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
    
    <div v-if="historyRecords.length === 0" class="empty-history">
      <el-icon :size="48"><Collection /></el-icon>
      <p>暂无转换记录</p>
      
      <div class="empty-actions">
        <el-button type="primary" @click="loadHistory">
          <el-icon><RefreshRight /></el-icon>
          刷新
        </el-button>
        <el-button v-if="isDev" type="success" @click="addTestRecord">
          添加测试
        </el-button>
      </div>
      
      <div v-if="isDev" class="debug-section">
        <el-button type="warning" size="small" @click="showRawStorageData">
          查看原始存储数据
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck  // 暂时禁用类型检查，因为这是一个快速修复
import { ref, onMounted, onUnmounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  CaretRight, 
  Download, 
  Close, 
  Collection,
  RefreshRight
} from '@element-plus/icons-vue';
import { useTtsStore } from '@/store/store';

// 判断是否为开发环境
const isDev = ref(process.env.NODE_ENV === 'development' || import.meta.env?.DEV);

// 页面加载时加载历史记录
const store = useTtsStore();
const historyRecords = ref([]);

// 正在播放的音频ID
const currentPlayingId = ref(null);

// 页面加载时加载历史记录
onMounted(() => {
  loadHistory();
  
  // 添加历史记录更新事件监听
  window.addEventListener('tts-history-updated', loadHistory);
  
  // 监听音频播放结束事件
  document.addEventListener('audio-playback-ended', handlePlaybackEnded);
  document.addEventListener('audio-playback-error', handlePlaybackError);
});

// 组件卸载时移除事件监听
onUnmounted(() => {
  window.removeEventListener('tts-history-updated', loadHistory);
  document.removeEventListener('audio-playback-ended', handlePlaybackEnded);
  document.removeEventListener('audio-playback-error', handlePlaybackError);
});

// 从本地存储加载历史记录
const loadHistory = () => {
  try {
    console.log('开始加载历史记录');
    
    // 检查localStorage是否可用
    if (typeof localStorage === 'undefined') {
      console.error('localStorage不可用');
      ElMessage.error('无法访问本地存储');
      return;
    }
    
    // 获取原始数据
    const rawData = localStorage.getItem('tts-history');
    
    // 如果数据为null或undefined
    if (!rawData) {
      console.log('localStorage中没有历史记录数据');
      historyRecords.value = [];
      return;
    }
    
    // 解析JSON
    let history;
    try {
      history = JSON.parse(rawData);
      console.log('JSON解析成功:', typeof history);
    } catch (parseErr) {
      console.error('JSON解析失败:', parseErr);
      ElMessage.error('历史记录数据格式错误');
      historyRecords.value = [];
      return;
    }
    
    // 检查数据结构
    if (!Array.isArray(history)) {
      console.error('历史记录数据不是数组格式:', history);
      ElMessage.warning('历史记录格式不正确，重置为空');
      history = [];
    }
    
    // 清理过期记录
    const oneDayAgo = Date.now() - (1 * 24 * 60 * 60 * 1000);
    const originalLength = history.length;
    
    history = history.filter(item => {
      // 如果没有timestamp字段，为兼容旧数据，设置为当前时间
      if (!item.timestamp) {
        item.timestamp = Date.now();
      }
      return item.timestamp > oneDayAgo;
    });
    
    if (originalLength !== history.length) {
      console.log(`已清理 ${originalLength - history.length} 条过期记录`);
    }
    
    // 格式化创建时间
    history.forEach(item => {
      item.length = formatTime(item.timestamp);
    });
    
    // 更新存储
    localStorage.setItem('tts-history', JSON.stringify(history));
    
    // 更新状态
    historyRecords.value = history;
    console.log('历史记录加载完成，共', history.length, '条记录');
    
    // 显示加载结果提示
    if (history.length > 0) {
      ElMessage.success(`已加载 ${history.length} 条历史记录`);
    } else {
      ElMessage.info('暂无历史记录');
    }
  } catch (err) {
    console.error('加载历史记录失败:', err);
    ElMessage.error('加载历史记录失败: ' + err.message);
    historyRecords.value = []; // 确保即使出错也有一个空数组
  }
};

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return '未知';
  
  const now = Date.now();
  const diff = now - timestamp;
  
  // 如果是今天的记录
  if (diff < 24 * 60 * 60 * 1000) {
    // 刚刚（5分钟内）
    if (diff < 5 * 60 * 1000) {
      return '刚刚';
    }
    
    // n小时前
    const hours = Math.floor(diff / (60 * 60 * 1000));
    if (hours > 0) {
      return `${hours}小时前`;
    }
    
    // n分钟前
    const minutes = Math.floor(diff / (60 * 1000));
    return `${minutes}分钟前`;
  }
  
  // 如果是昨天的记录
  if (diff < 48 * 60 * 60 * 1000) {
    return '昨天';
  }
  
  // 如果是一周内的记录
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    return `${days}天前`;
  }
  
  // 其他情况显示日期
  const date = new Date(timestamp);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

// 检查音频URL或数据是否有效
const isValidAudioUrl = (url) => {
  return (url && typeof url === 'string' && url.length > 0);
};

// 播放音频
const playAudio = (record) => {
  try {
    console.log('尝试播放记录:', record.id);
    
    // 如果已经在播放此记录，不再重复提示
    if (currentPlayingId.value === record.id) {
      console.log('已经在播放此记录，不再重复提示');
      return;
    }
    
    // 优先检查是否有audioData
    if (record.audioData) {
      console.log('使用base64数据播放');
      
      try {
        // 创建data URL
        const dataURL = `data:audio/mpeg;base64,${record.audioData}`;
        
        // 播放并记录当前播放的ID
        const success = store.audition(dataURL);
        if (success) {
          currentPlayingId.value = record.id;
          ElMessage.success('正在播放');
        }
        return;
      } catch (err) {
        console.error('使用base64数据播放失败:', err);
        // 如果失败，尝试使用URL
      }
    }
    
    // 如果没有audioData或audioData播放失败，尝试URL
    if (isValidAudioUrl(record.url)) {
      console.log('使用URL播放:', record.url);
      const success = store.audition(record.url);
      if (success) {
        currentPlayingId.value = record.id;
        ElMessage.success('正在播放');
      }
      return;
    }
    
    // 两者都没有
    ElMessage.warning('音频链接已失效');
  } catch (err) {
    console.error('播放音频失败:', err);
    ElMessage.error('播放失败: ' + err.message);
  }
};

// 下载音频
const downloadAudio = (record) => {
  try {
    console.log('尝试下载记录:', record.id);
    
    // 优先使用audioData
    if (record.audioData) {
      console.log('使用base64数据下载');
      
      // 创建data URL
      const dataURL = `data:audio/mpeg;base64,${record.audioData}`;
      
      // 下载
      const a = document.createElement('a');
      a.href = dataURL;
      a.download = `tts-audio-${record.id}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      ElMessage.success('开始下载');
      return;
    }
    
    // 如果没有audioData，尝试URL
    if (isValidAudioUrl(record.url)) {
      console.log('使用URL下载:', record.url);
      const a = document.createElement('a');
      a.href = record.url;
      a.download = `tts-audio-${record.id}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      ElMessage.success('开始下载');
      return;
    }
    
    // 两者都没有
    ElMessage.warning('音频链接已失效');
  } catch (err) {
    console.error('下载音频失败:', err);
    ElMessage.error('下载失败: ' + err.message);
  }
};

// 删除单条记录
const deleteRecord = (record) => {
  ElMessageBox.confirm(
    '确定要删除这条记录吗？',
    '删除记录',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    let history = JSON.parse(localStorage.getItem('tts-history') || '[]');
    history = history.filter(item => item.id !== record.id);
    localStorage.setItem('tts-history', JSON.stringify(history));
    historyRecords.value = history;
    ElMessage.success('记录已删除');
  }).catch(() => {
    // 用户取消删除操作
  });
};

// 清空所有历史记录
const clearAllHistory = () => {
  if (historyRecords.value.length === 0) return;
  
  ElMessageBox.confirm(
    '确定要清空所有历史记录吗？此操作不可恢复！',
    '清空历史',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    localStorage.setItem('tts-history', '[]');
    historyRecords.value = [];
    ElMessage.success('所有历史记录已清空');
  }).catch(() => {
    // 用户取消清空操作
  });
};

// 添加测试记录（仅在开发环境可用）
const addTestRecord = () => {
  try {
    // 生成随机音频URL（测试用）
    const testUrls = [
      'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3',
      'https://file-examples.com/storage/fe7bb0e37864d6478e67a0f/2017/11/file_example_MP3_700KB.mp3'
    ];
    const randomUrl = testUrls[Math.floor(Math.random() * testUrls.length)];
    
    // 创建测试记录
    const testRecord = {
      id: Date.now(),
      text: '这是一条测试记录 ' + new Date().toLocaleTimeString(),
      url: randomUrl,
      voiceName: '测试语音-' + Math.floor(Math.random() * 100),
      timestamp: Date.now()
    };
    
    // 从localStorage获取现有历史记录
    let history = JSON.parse(localStorage.getItem('tts-history') || '[]');
    
    // 添加测试记录
    history.unshift(testRecord);
    
    // 保存回localStorage
    localStorage.setItem('tts-history', JSON.stringify(history));
    
    // 刷新显示
    loadHistory();
    
    ElMessage.success('已添加测试记录，URL: ' + randomUrl);
    console.log('已添加测试记录:', testRecord);
  } catch (err) {
    console.error('添加测试记录失败:', err);
    ElMessage.error('添加测试记录失败: ' + err.message);
  }
};

// 显示原始localStorage数据（仅开发环境使用）
const showRawStorageData = () => {
  try {
    const rawData = localStorage.getItem('tts-history');
    
    let parsedData = null;
    try {
      parsedData = JSON.parse(rawData || '[]');
      console.log('解析后的数据:', parsedData);
    } catch (parseErr) {
      console.error('无法解析JSON数据:', parseErr);
    }
    
    // 显示弹窗
    ElMessageBox.alert(
      `<pre style="max-height: 400px; overflow: auto;">${rawData}</pre>`, 
      'localStorage原始数据', 
      {
        dangerouslyUseHTMLString: true,
        confirmButtonText: '关闭'
      }
    );
  } catch (err) {
    console.error('获取原始存储数据失败:', err);
    ElMessage.error('获取原始存储数据失败: ' + err.message);
  }
};

// 处理音频播放结束事件
const handlePlaybackEnded = () => {
  console.log('音频播放结束，重置当前播放ID');
  currentPlayingId.value = null;
};

// 处理音频播放错误事件
const handlePlaybackError = () => {
  console.log('音频播放错误，重置当前播放ID');
  currentPlayingId.value = null;
};
</script>

<style scoped>
.history-container {
  padding: 20px;
  background-color: var(--card-background);
  border-radius: var(--border-radius-large);
  box-shadow: var(--shadow-medium);
  margin-bottom: 20px;
}

.history-header {
  margin-bottom: 20px;
}

.history-header h2 {
  font-size: 22px;
  margin-bottom: 8px;
  color: var(--text-primary);
}

.history-note {
  color: var(--text-secondary);
  font-size: 14px;
}

.history-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.history-table {
  width: 100%;
  margin-bottom: 20px;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.action-buttons-main {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.empty-history {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: var(--text-secondary);
}

.empty-history .el-icon {
  margin-bottom: 16px;
  color: var(--text-secondary);
}

.empty-actions {
  display: flex;
  gap: 10px;
  margin: 20px 0;
}

.debug-section {
  margin-top: 16px;
  text-align: center;
}

@media (max-width: 768px) {
  .history-container {
    padding: 16px;
  }
  
  .action-buttons {
    flex-wrap: wrap;
  }
}
</style> 