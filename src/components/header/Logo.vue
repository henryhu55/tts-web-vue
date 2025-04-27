<template>
  <div class="api-logo">
    <span class="tts-text">TTS</span>
    <span class="num-text">88</span>
    <span class="api-text">API</span>
  </div>
</template>

<script setup lang="ts">
const { winStyle } = defineProps(["winStyle"]);
</script>

<style scoped>
.api-logo {
  display: flex;
  align-items: center;
  background-color: #4886FF;
  border-radius: 4px;
  padding: 2px 5px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.tts-text {
  font-weight: 700;
  font-size: 12px;
  color: white;
  letter-spacing: 0.3px;
}

.num-text {
  font-weight: 700;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 0.3px;
}

.api-text {
  background-color: white;
  color: #4886FF;
  font-size: 9px;
  font-weight: 700;
  padding: 0px 2px;
  border-radius: 2px;
  margin-left: 2px;
}
</style>
