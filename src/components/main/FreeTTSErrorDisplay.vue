<template>
  <div class="free-tts-error" v-if="showError">
    <el-alert
      :title="errorTitle"
      :description="errorDescription"
      :type="errorType"
      :closable="closable"
      show-icon
    >
      <template #default>
        <p class="error-message">{{ errorMessage }}</p>
      </template>
      <template v-if="showAction" #action>
        <el-button type="primary" size="small" @click="handleAction">
          <el-icon>
            <Clock v-if="isQuotaExceeded" />
            <RefreshRight v-else />
          </el-icon>
          {{ actionText }}
        </el-button>
      </template>
    </el-alert>
  </div>
</template>

<script>
import { computed, defineComponent } from 'vue';
import { FreeTTSErrorType } from '@/store/play';
import { Clock, RefreshRight } from '@element-plus/icons-vue';

export default defineComponent({
  name: 'FreeTTSErrorDisplay',
  
  components: {
    Clock,
    RefreshRight
  },
  
  props: {
    errorCode: {
      type: Number,
      default: 0
    },
    errorMessage: {
      type: String,
      default: ''
    },
    closable: {
      type: Boolean,
      default: true
    }
  },
  
  emits: ['refresh', 'action'],
  
  setup(props, { emit }) {
    // 检查是否是额度不足错误
    const isQuotaExceeded = computed(() => props.errorCode === FreeTTSErrorType.QUOTA_EXCEEDED);
    
    // 根据错误码计算显示的内容
    const errorTitle = computed(() => {
      switch(props.errorCode) {
        case FreeTTSErrorType.QUOTA_EXCEEDED:
          return '免费额度已用完';
        case FreeTTSErrorType.RATE_LIMITED:
          return '请求过于频繁';
        case FreeTTSErrorType.BANNED:
          return '账户已被临时限制';
        case FreeTTSErrorType.SERVER_ERROR:
          return '服务器错误';
        case FreeTTSErrorType.CONNECTION_ERROR:
          return '连接失败';
        default:
          return '发生错误';
      }
    });
    
    // 根据错误码计算描述
    const errorDescription = computed(() => {
      switch(props.errorCode) {
        case FreeTTSErrorType.QUOTA_EXCEEDED:
          return '您今日的5000字符免费额度已经用完，将在明天重置。';
        case FreeTTSErrorType.RATE_LIMITED:
          return '您的请求过于频繁，请稍后再试。';
        case FreeTTSErrorType.BANNED:
          return '系统检测到您可能存在滥用行为，账户已被临时限制使用。';
        case FreeTTSErrorType.SERVER_ERROR:
          return '服务器处理请求时出错，请稍后再试。';
        case FreeTTSErrorType.CONNECTION_ERROR:
          return '无法连接到免费TTS服务器，请检查您的网络连接。';
        default:
          return props.errorMessage || '请稍后再试或联系客服。';
      }
    });
    
    // 根据错误码计算错误类型
    const errorType = computed(() => {
      switch(props.errorCode) {
        case FreeTTSErrorType.QUOTA_EXCEEDED:
          return 'warning';
        case FreeTTSErrorType.BANNED:
          return 'error';
        case FreeTTSErrorType.RATE_LIMITED:
          return 'warning';
        case FreeTTSErrorType.SERVER_ERROR:
        case FreeTTSErrorType.CONNECTION_ERROR:
          return 'error';
        default:
          return 'info';
      }
    });
    
    // 是否显示操作按钮
    const showAction = computed(() => {
      return [
        FreeTTSErrorType.QUOTA_EXCEEDED, 
        FreeTTSErrorType.CONNECTION_ERROR, 
        FreeTTSErrorType.SERVER_ERROR
      ].includes(props.errorCode);
    });
    
    // 是否显示错误信息
    const showError = computed(() => {
      return props.errorCode !== 0;
    });
    
    // 操作按钮文本
    const actionText = computed(() => {
      switch(props.errorCode) {
        case FreeTTSErrorType.QUOTA_EXCEEDED:
          return '查看剩余时间';
        case FreeTTSErrorType.CONNECTION_ERROR:
        case FreeTTSErrorType.SERVER_ERROR:
          return '重试连接';
        default:
          return '刷新';
      }
    });
    
    // 处理操作按钮点击
    const handleAction = () => {
      emit('action', props.errorCode);
      if (
        props.errorCode === FreeTTSErrorType.CONNECTION_ERROR || 
        props.errorCode === FreeTTSErrorType.SERVER_ERROR
      ) {
        emit('refresh');
      }
    };
    
    return {
      isQuotaExceeded,
      errorTitle,
      errorDescription,
      errorType,
      showAction,
      showError,
      actionText,
      handleAction
    };
  }
});
</script>

<style scoped>
.free-tts-error {
  margin: 10px 0;
}

.error-message {
  margin: 5px 0;
  font-size: 14px;
}

.el-alert {
  margin-bottom: 10px;
}
</style> 