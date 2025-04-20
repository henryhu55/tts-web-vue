<template>
  <div class="version" @click="checkUpdate">
    <span>Version:{{ version }}</span>
    <el-icon :color="hasUpdate ? '#e6a23c' : '#67c23a'"
      ><RefreshRight
    /></el-icon>
  </div>
</template>

<script setup lang="ts">
import pkg from "../../../package.json";
import { ref, h } from "vue";
import { ElNotification, ElMessageBox } from "element-plus";
import type { Action } from "element-plus";
import { useI18n } from 'vue-i18n';
import WebStore from "@/store/web-store";
import axios from "axios";

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
    let versionInfo = "";
    if (version == latestVsersion.tag_name) {
      versionInfo = `<p class="version-info version-info-success">${t('version.noUpdate')}</p>`;
    } else {
      versionInfo = `<p class="version-info version-info-warning">${t('version.updateAvailable')}</p>`;
    }
    const htmlMsg = `
      <div>
        ${versionInfo}
        <p>${t('version.currentVersion')}<span>${version}</span></p>
        <p>${t('version.latestVersion')}<span>${latestVsersion.tag_name}</span></p>
        <p>${t('version.downloadLinks')}:
          <ul style="margin: 0;">
            <li><a href="${repoConfig.github.releaseUrl}" target="_blank">GitHub</a></li>
            <li><a href="${repoConfig.gitee.releaseUrl}" target="_blank">Gitee</a></li>
            <li><a href="${repoConfig.cloudDisk.url}" target="_blank">网盘下载</a> ${repoConfig.cloudDisk.password ? `密码：${repoConfig.cloudDisk.password}` : ''}</li>
          </ul>
        </p>
        <p style="margin-top:5px;">
            <div>
      <a href="${repoConfig.github.starsUrl}" target="_blank"
        ><img
          alt="GitHub stars"
          src="https://img.shields.io/github/stars/${repoConfig.github.owner}/${repoConfig.github.repo}?color=success"
      /></a>
      <a href="${repoConfig.github.forksUrl}" target="_blank"
        ><img
          alt="GitHub forks"
          src="https://img.shields.io/github/forks/${repoConfig.github.owner}/${repoConfig.github.repo}"
      /></a>
      <a href="${repoConfig.github.issuesUrl}" target="_blank"
        ><img
          alt="GitHub issues"
          src="https://img.shields.io/github/issues/${repoConfig.github.owner}/${repoConfig.github.repo}"
      /></a>
    </div>
        </p>
      </div>
    `;

    ElMessageBox.alert(htmlMsg, t('version.updateInfo'), {
      confirmButtonText: t('version.confirm'),
      closeOnClickModal: true,
      dangerouslyUseHTMLString: true,
      callback: (action: Action) => {
        console.log(`action: ${action}`);
      },
    });
  });
};
</script>

<style scoped>
.version {
  color: #909399;
  font-size: 12px;
  display: flex;
  justify-content: space-around;
  margin-bottom: 1px;
  cursor: pointer;
}
.el-icon {
  margin: auto;
  cursor: pointer;
}
.el-icon:hover {
  animation: loading-rotate 2s linear infinite;
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
</style>
