<template>
  <!-- @ts-ignore -->
  <div class="version" @click="checkUpdate">
    <div class="version-badge">
      <!-- @ts-ignore -->
      <span>v{{ version }}</span>
      <!-- @ts-ignore -->
      <el-icon :class="{ 'update-available': hasUpdate }" :color="hasUpdate ? '#e6a23c' : '#67c23a'">
        <RefreshRight />
      </el-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
// @ts-nocheck
import pkg from "../../../package.json";
import { ref, h, nextTick } from "vue";
import { ElNotification, ElMessageBox } from "element-plus";
import type { Action } from "element-plus";
import { useI18n } from 'vue-i18n';
import WebStore from "@/store/web-store";
import axios from "axios";
import { RefreshRight } from '@element-plus/icons-vue';

const { t } = useI18n();  

const store = new WebStore();

// 定义您自己的仓库信息
const repoConfig = {
  github: {
    owner: "henryhu55",
    repo: "tts-web-vue",
    apiUrl: "https://api.github.com/repos/henryhu55/tts-web-vue/releases/latest",
    releaseUrl: "https://github.com/henryhu55/tts-web-vue/releases/latest",
    starsUrl: "https://github.com/henryhu55/tts-web-vue/stargazers",
    forksUrl: "https://github.com/henryhu55/tts-web-vue/network",
    issuesUrl: "https://github.com/henryhu55/tts-web-vue/issues",
  },
  gitee: {
    owner: "waycx",
    repo: "tts-web-vue",
    apiUrl: "https://gitee.com/api/v5/repos/waycx/tts-web-vue/releases/latest",
    releaseUrl: "https://gitee.com/waycx/tts-web-vue/releases/latest",
  },
  // 如果您有自己的网盘链接，请替换下面的值
  cloudDisk: {
    url: "https://wwuw.lanzoub.com/b00zxp4jqj",
    password: "4rxh"
  }
};

const updateNotification = store.get("updateNotification");
const version = pkg.version;
const getLatestVsersion = async () => {
  try {
    // 先尝试从 Gitee 获取
    let response = await axios.get(repoConfig.gitee.apiUrl);
    return {
      latestVsersion: response.data
    };
  } catch (e) {
    try {
      // 如果 Gitee 失败，尝试从 GitHub 获取
      let response = await axios.get(repoConfig.github.apiUrl);
      return {
        latestVsersion: response.data
      };
    } catch (error) {
      console.error("获取版本信息失败", error);
      // 返回当前版本作为最新版本，避免错误
      return {
        latestVsersion: { tag_name: version, body: "无法获取更新信息" }
      };
    }
  }
};
let hasUpdate = ref(false);
getLatestVsersion().then(({ latestVsersion }) => {
  if (version != latestVsersion.tag_name) {
    hasUpdate.value = true;
    if (updateNotification) {
      ElNotification({
        title: t('version.updateAvailable'),
        message: h("strong", [
          h("div", [
            t('version.updateAvailable') + ": ",
            h(
              "i",
              { style: "color: teal;margin-right: 5px;" },
              latestVsersion.tag_name
            ),
            h(
              "a",
              {
                href: repoConfig.gitee.releaseUrl,
                target: "_blank",
                style: "margin-bottom: 20px;",
              },
              t('version.goToView')
            ),
          ]),
          h("div", latestVsersion.body),
        ]),
        type: "success",
      });
    }
  }
});


const checkUpdate = async () => {
  getLatestVsersion().then(({ latestVsersion }) => {
    let versionStatus = version == latestVsersion.tag_name ? "latest" : "outdated";
    
    const htmlMsg = `
      <div class="update-dialog-content">
        <div class="update-header">
          <div class="update-title ${versionStatus}">${versionStatus === "latest" ? t('version.noUpdate') : t('version.updateAvailable')}</div>
          <div class="close-btn" id="version-close-btn">×</div>
        </div>
        
        <div class="version-info-panel">
          <div class="version-compare">
            <div class="version-item ${versionStatus === 'latest' ? 'same' : 'current'}">
              <span class="version-label">${t('version.currentVersion')}</span>
              <span class="version-number">${version}</span>
            </div>
            <div class="version-item ${versionStatus === 'latest' ? 'same' : 'latest'}">
              <span class="version-label">${t('version.latestVersion')}</span>
              <span class="version-number">${latestVsersion.tag_name}</span>
            </div>
          </div>
        </div>
        
        ${versionStatus === "outdated" && latestVsersion.body ? 
          `<div class="update-description">
            <div class="update-notes">${latestVsersion.body}</div>
          </div>` : ''
        }

        <div class="download-options">
          <div class="download-title">${t('version.downloadLinks')}</div>
          <div class="download-links">
            <a href="${repoConfig.github.releaseUrl}" target="_blank" class="download-link github">
              <svg viewBox="0 0 24 24" fill="currentColor" height="16" width="16" xmlns="http://www.w3.org/2000/svg"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path></svg>
              GitHub
            </a>
            <a href="${repoConfig.gitee.releaseUrl}" target="_blank" class="download-link gitee">
              <svg viewBox="0 0 1024 1024" fill="currentColor" height="16" width="16" xmlns="http://www.w3.org/2000/svg"><path d="M512 1024C229.222 1024 0 794.778 0 512S229.222 0 512 0s512 229.222 512 512-229.222 512-512 512z m259.149-568.883h-290.74a25.293 25.293 0 0 0-25.292 25.293l-0.026 63.206c0 13.952 11.315 25.293 25.267 25.293h177.024c13.978 0 25.293 11.315 25.293 25.267v12.646a75.853 75.853 0 0 1-75.853 75.853h-240.23a25.293 25.293 0 0 1-25.267-25.293V417.203a75.853 75.853 0 0 1 75.827-75.853h353.946a25.293 25.293 0 0 0 25.267-25.292l0.077-63.207a25.293 25.293 0 0 0-25.268-25.293H417.152a189.62 189.62 0 0 0-189.62 189.645V771.15c0 13.977 11.316 25.293 25.294 25.293h372.94a170.65 170.65 0 0 0 170.65-170.65V480.384a25.293 25.293 0 0 0-25.293-25.267z"></path></svg>
              Gitee
            </a>
            <a href="${repoConfig.cloudDisk.url}" target="_blank" class="download-link cloud">
              <svg viewBox="0 0 24 24" fill="currentColor" height="16" width="16" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"></path></svg>
              城通网盘 ${repoConfig.cloudDisk.password ? `(提取码: ${repoConfig.cloudDisk.password})` : ''}
            </a>
          </div>
        </div>
        
        <div class="repo-stats">
          <a href="${repoConfig.github.starsUrl}" target="_blank" class="stat-badge">
            <img alt="GitHub stars" src="https://img.shields.io/github/stars/${repoConfig.github.owner}/${repoConfig.github.repo}?color=success" />
          </a>
          <a href="${repoConfig.github.forksUrl}" target="_blank" class="stat-badge">
            <img alt="GitHub forks" src="https://img.shields.io/github/forks/${repoConfig.github.owner}/${repoConfig.github.repo}" />
          </a>
          <a href="${repoConfig.github.issuesUrl}" target="_blank" class="stat-badge">
            <img alt="GitHub issues" src="https://img.shields.io/github/issues/${repoConfig.github.owner}/${repoConfig.github.repo}" />
          </a>
    </div>
      </div>
    `;

    ElMessageBox.alert(htmlMsg, '', {
      confirmButtonText: t('version.confirm'),
      closeOnClickModal: true,
      dangerouslyUseHTMLString: true,
      customClass: 'modern-update-dialog',
      showClose: false,
      callback: (action: Action) => {
        console.log(`action: ${action}`);
      },
    });
    
    // 添加关闭按钮点击事件
    nextTick(() => {
      const closeBtn = document.getElementById('version-close-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          // 使用Element Plus的全局方法关闭弹窗
          ElMessageBox.close();
        });
      }
    });
  });
};
</script>

<style scoped>
.version {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 5px 0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.version-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: rgba(var(--primary-color-rgb, 64, 158, 255), 0.1);
  border-radius: 16px;
  padding: 5px 10px;
  font-size: 12px;
  color: var(--primary-color, #409eff);
  transition: all 0.3s ease;
}

.version:hover .version-badge {
  background-color: rgba(var(--primary-color-rgb, 64, 158, 255), 0.2);
  transform: translateY(-2px);
  box-shadow: 0 2px 6px rgba(var(--primary-color-rgb, 64, 158, 255), 0.2);
}

.el-icon {
  margin: 0;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.el-icon.update-available {
  animation: pulse 1.5s infinite alternate;
}

.el-icon:hover {
  animation: loading-rotate 1.5s linear infinite;
}

@keyframes pulse {
  0% {
    opacity: 0.6;
    transform: scale(0.95);
  }
  100% {
    opacity: 1;
    transform: scale(1.05);
  }
}

:root[theme-mode="dark"] .version-badge {
  background-color: rgba(var(--primary-color-rgb, 64, 158, 255), 0.15);
}

:root[theme-mode="dark"] .version:hover .version-badge {
  background-color: rgba(var(--primary-color-rgb, 64, 158, 255), 0.25);
}
</style>
<style>
.version-info {
  width: 100%;
  padding: 8px 16px;
  margin: 0;
  box-sizing: border-box;
  border-radius: 4px;
  position: relative;
  background-color: #fff;
  overflow: hidden;
  opacity: 1;
  display: flex;
  align-items: center;
  transition: opacity 0.2s;
  color: #fff;
}
.version-info-success {
  background-color: #67c23a;
}
.version-info-warning {
  background-color: #e6a23c;
}

/* 现代化更新对话框样式 */
.modern-update-dialog .el-message-box__header {
  display: none; /* 隐藏原始标题栏 */
}

.update-header {
  background: linear-gradient(135deg, #4886FF, #66A5FF);
  color: white;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  position: relative;
}

.update-title {
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.close-btn {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-50%) scale(1.1);
}

.modern-update-dialog .el-message-box__content {
  padding: 0;
  max-height: 70vh;
  overflow-y: auto;
}

.modern-update-dialog .el-message-box__container {
  padding: 0;
}

.update-dialog-content {
  padding: 0;
}

.update-status,
.update-status.latest,
.update-status.outdated,
.status-icon-container,
.status-icon-container svg,
.update-status.latest .status-icon-container,
.update-status.outdated .status-icon-container,
.version-details,
.version-status-text,
.update-status.latest .version-status-text,
.update-status.outdated .version-status-text {
  display: none; /* 隐藏旧的样式，避免冲突 */
}

.version-compare {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.version-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.03);
}

.version-item.same {
  background-color: rgba(103, 194, 58, 0.08);
}

.version-item.current {
  background-color: rgba(230, 162, 60, 0.08);
}

.version-item.latest {
  background-color: #ecf5ff;
  border-left: 3px solid #409eff;
}

.version-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.version-number {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  padding: 2px 8px;
  border-radius: 12px;
  background-color: rgba(255, 255, 255, 0.5);
}

.version-item.latest .version-number {
  color: #409eff;
}

.update-description {
  padding: 16px 24px;
  border-bottom: 1px solid #ebeef5;
}

.update-notes {
  font-size: 14px;
  line-height: 1.6;
  color: #606266;
  white-space: pre-line;
  max-height: 150px;
  overflow-y: auto;
  padding: 10px;
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 4px;
}

.download-options {
  padding: 15px 20px;
  background-color: #f5f7fa;
  border-top: 1px solid #ebeef5;
  border-bottom: 1px solid #ebeef5;
}

.download-title {
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
}

.download-links {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.download-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 4px;
  text-decoration: none;
  color: white;
  font-size: 14px;
  transition: all 0.3s ease;
}

.download-link.github {
  background-color: #24292e;
}

.download-link.gitee {
  background-color: #c71d23;
}

.download-link.cloud {
  background-color: #3b82f6;
}

.download-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.repo-stats {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 15px 20px;
  flex-wrap: wrap;
}

.stat-badge {
  text-decoration: none;
}

/* 移动设备适配 */
@media (max-width: 768px) {
  .download-links {
    flex-direction: column;
  }
  
  .download-link {
    width: 100%;
  }
  
  .update-status {
    padding: 15px;
  }
  
  .version-info-container, 
  .download-options, 
  .repo-stats {
    padding: 15px;
  }
}

/* 深色主题支持 */
:root[theme-mode="dark"] .modern-update-dialog .el-message-box__content,
:root[theme-mode="dark"] .modern-update-dialog .el-message-box__container {
  background-color: #282c3a;
  color: #e5eaf3;
}

:root[theme-mode="dark"] .version-info-container,
:root[theme-mode="dark"] .download-options,
:root[theme-mode="dark"] .repo-stats {
  border-color: #424656;
}

:root[theme-mode="dark"] .download-options {
  background-color: #323644;
}

:root[theme-mode="dark"] .version-label {
  color: #a3abd2;
}

:root[theme-mode="dark"] .version-value {
  color: #e5eaf3;
}

:root[theme-mode="dark"] .download-title {
  color: #e5eaf3;
}

:root[theme-mode="dark"] .update-notes {
  color: #a3abd2;
}

/* 深色模式支持 */
:root[theme-mode="dark"] .update-status.latest {
  background-color: rgba(103, 194, 58, 0.1);
  border-bottom-color: rgba(103, 194, 58, 0.2);
}

:root[theme-mode="dark"] .update-status.outdated {
  background-color: rgba(230, 162, 60, 0.1);
  border-bottom-color: rgba(230, 162, 60, 0.2);
}

:root[theme-mode="dark"] .version-item {
  background-color: rgba(255, 255, 255, 0.05);
}

:root[theme-mode="dark"] .version-item.same {
  background-color: rgba(103, 194, 58, 0.1);
}

:root[theme-mode="dark"] .version-item.current {
  background-color: rgba(230, 162, 60, 0.1);
}

:root[theme-mode="dark"] .version-item.latest {
  background-color: rgba(64, 158, 255, 0.1);
  border-left-color: #409eff;
}

:root[theme-mode="dark"] .version-number {
  background-color: rgba(255, 255, 255, 0.08);
}

:root[theme-mode="dark"] .update-notes {
  background-color: rgba(255, 255, 255, 0.05);
}

.version-info-panel {
  padding: 20px;
  border-bottom: 1px solid #ebeef5;
}

.version-compare {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 500px;
  margin: 0 auto;
}

.version-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-radius: 6px;
  background-color: rgba(0, 0, 0, 0.03);
}

.version-item.same {
  background-color: rgba(103, 194, 58, 0.08);
  border-left: 3px solid #67c23a;
}

.version-item.current {
  background-color: rgba(230, 162, 60, 0.08);
}

.version-item.latest {
  background-color: #ecf5ff;
  border-left: 3px solid #409eff;
}

.version-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.version-number {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  padding: 3px 10px;
  border-radius: 16px;
  background-color: rgba(255, 255, 255, 0.6);
}

.version-item.same .version-number {
  color: #67c23a;
}

.version-item.latest .version-number {
  color: #409eff;
}

.update-description {
  padding: 16px 24px;
  border-bottom: 1px solid #ebeef5;
}

.update-notes {
  font-size: 14px;
  line-height: 1.6;
  color: #606266;
  white-space: pre-line;
  max-height: 150px;
  overflow-y: auto;
  padding: 16px;
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 6px;
  margin: 0 auto;
  max-width: 500px;
}

/* 深色模式支持 */
:root[theme-mode="dark"] .version-info-panel,
:root[theme-mode="dark"] .update-description {
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

:root[theme-mode="dark"] .version-item {
  background-color: rgba(255, 255, 255, 0.05);
}

:root[theme-mode="dark"] .version-item.same {
  background-color: rgba(103, 194, 58, 0.1);
}

:root[theme-mode="dark"] .version-item.current {
  background-color: rgba(230, 162, 60, 0.1);
}

:root[theme-mode="dark"] .version-item.latest {
  background-color: rgba(64, 158, 255, 0.1);
}

:root[theme-mode="dark"] .version-number {
  background-color: rgba(255, 255, 255, 0.08);
}

:root[theme-mode="dark"] .update-notes {
  background-color: rgba(255, 255, 255, 0.05);
}

.update-title.latest::after {
  background-color: #67c23a;
  box-shadow: 0 0 0 2px rgba(103, 194, 58, 0.2);
}

.update-title.outdated::after {
  background-color: #e6a23c;
  box-shadow: 0 0 0 2px rgba(230, 162, 60, 0.2);
}
</style>
