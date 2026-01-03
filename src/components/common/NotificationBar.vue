<template>
  <transition name="slide-fade">
    <div v-if="isVisible" class="notification-bar">
      <div class="notification-content">
        <span class="bell-icon">📢</span>
        <span class="message">
          开源版体验有限？试试更专业的官方托管版 <strong>小影配音</strong>，支持更多音色、任务队列，
          <a href="https://xiaoying.work" target="_blank" class="promo-link">立即前往 (每天免费 1w 字)</a>
        </span>
        <button class="close-btn" @click="closeBar" aria-label="关闭通知">
          <el-icon><Close /></el-icon>
        </button>
      </div>
    </div>
  </transition>
</template>

<script>
import { ref, onMounted } from 'vue';
import { Close } from '@element-plus/icons-vue';

export default {
  name: 'NotificationBar',
  components: {
    Close
  },
  setup() {
    const isVisible = ref(false);

    onMounted(() => {
      // 每次刷新进入页面，都会在 500ms 后显示
      setTimeout(() => {
        isVisible.value = true;
      }, 500);
    });

    const closeBar = () => {
      // 仅改变当前组件状态，不存入 localStorage
      isVisible.value = false;
    };

    return {
      isVisible,
      closeBar
    };
  }
}
</script>

<style scoped>
.notification-bar {
  position: fixed;
  top: 60px;
  left: 0;
  right: 0;
  z-index: 998;
  background: linear-gradient(90deg, #4886FF, #66A5FF);
  color: white;
  padding: 8px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: center;
  align-items: center;
}

:root[theme-mode="dark"] .notification-bar {
  background: linear-gradient(90deg, #1a3a6e, #2c4a8a);
}

.notification-content {
  max-width: 1200px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  position: relative;
}

.message {
  font-size: 14px;
  line-height: 1.4;
  text-align: center;
}

.promo-link {
  color: #ffeb3b;
  font-weight: bold;
  text-decoration: underline;
  margin-left: 4px;
  white-space: nowrap;
}

.promo-link:hover {
  color: #fff;
}

.bell-icon {
  font-size: 16px;
}

.close-btn {
  position: absolute;
  right: 0;
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.close-btn:hover {
  opacity: 1;
}

.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}
.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}

@media (max-width: 768px) {
  .notification-bar {
    top: 50px;
    padding: 6px 12px;
  }
  .message {
    font-size: 12px;
    padding-right: 20px;
  }
}
</style>