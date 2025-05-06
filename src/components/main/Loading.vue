<template>
  <div class="loading-container" v-if="visible">
    <div class="loading-card">
      <div class="loading-animation">
        <div class="loading-pulse"></div>
        <div class="loading-waves">
          <div class="wave wave1"></div>
          <div class="wave wave2"></div>
          <div class="wave wave3"></div>
          <div class="wave wave4"></div>
        </div>
      </div>
      
      <div class="loading-info">
        <h3>{{ title }}</h3>
        <p>{{ message }}</p>
        
        <div v-if="showProgress" class="progress-wrapper">
          <div class="progress-status">
            <span>处理进度</span>
            <span>{{ Math.round(progress) }}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
          </div>
        </div>
      </div>
      
      <div v-if="showCancel" class="loading-actions">
        <el-button size="small" type="danger" @click="onCancel">取消</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
// 使用纯JavaScript来避免TypeScript错误
import { ref, watch } from 'vue';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '正在处理'
  },
  message: {
    type: String,
    default: '请稍候，正在生成语音...'
  },
  progress: {
    type: Number,
    default: 0
  },
  showProgress: {
    type: Boolean,
    default: true
  },
  showCancel: {
    type: Boolean,
    default: true
  },
  estimatedTime: {
    type: Number,
    default: 0 // 预计耗时，单位为秒
  }
});

const emit = defineEmits(['cancel']);

const onCancel = () => {
  emit('cancel');
};

// 添加计时功能
const elapsedTime = ref(0);
const intervalId = ref(null);

watch(() => props.visible, (isVisible) => {
  if (isVisible) {
    // 重置计时器
    elapsedTime.value = 0;
    
    // 开始计时
    intervalId.value = window.setInterval(() => {
      elapsedTime.value += 1;
    }, 1000);
  } else if (intervalId.value !== null) {
    // 清除计时器
    clearInterval(intervalId.value);
    intervalId.value = null;
  }
}, { immediate: true });
</script>

<style scoped>
.loading-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  backdrop-filter: blur(4px);
}

.loading-card {
  background-color: var(--card-background);
  border-radius: var(--border-radius-large);
  box-shadow: var(--shadow-large);
  padding: 32px;
  width: 400px;
  max-width: 90%;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.loading-animation {
  margin-bottom: 24px;
  position: relative;
  width: 100px;
  height: 100px;
}

.loading-pulse {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  background-color: var(--primary-color);
  border-radius: 50%;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 0.6;
  }
  50% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 0.6;
  }
}

.loading-waves {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100px;
  height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.wave {
  position: absolute;
  border-radius: 50%;
  border: 2px solid var(--primary-color);
  opacity: 0;
  animation: wave 2s linear infinite;
}

.wave1 {
  width: 40px;
  height: 40px;
  animation-delay: 0s;
}

.wave2 {
  width: 60px;
  height: 60px;
  animation-delay: 0.5s;
}

.wave3 {
  width: 80px;
  height: 80px;
  animation-delay: 1s;
}

.wave4 {
  width: 100px;
  height: 100px;
  animation-delay: 1.5s;
}

@keyframes wave {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  20% {
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}

.loading-info {
  margin-bottom: 24px;
  width: 100%;
}

.loading-info h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

.loading-info p {
  margin: 0 0 16px 0;
  font-size: 15px;
  color: var(--text-secondary);
}

.progress-wrapper {
  margin-top: 16px;
  width: 100%;
}

.progress-status {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 14px;
  color: var(--text-secondary);
}

.progress-bar {
  background-color: rgba(0, 0, 0, 0.05);
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
}

.dark-theme .progress-bar {
  background-color: rgba(255, 255, 255, 0.1);
}

.progress-fill {
  height: 100%;
  background: var(--primary-gradient);
  border-radius: 4px;
  width: 0;
  transition: width 0.3s ease;
}

.loading-actions {
  margin-top: 16px;
}
</style>
