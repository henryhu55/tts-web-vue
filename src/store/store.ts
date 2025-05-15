// @/store/firstStore.js

import { defineStore } from "pinia";
import { getTTSData, getDataGPT, createBatchTask, getBatchTaskStatus } from "./play";
import { ElMessage } from "element-plus";
import WebStore from "./web-store";
import { ref } from 'vue';

// 使用Web版本的Store
const store = new WebStore();

// 定义并导出容器，第一个参数是容器id，必须唯一，用来将所有的容器
// 挂载到根容器上
export const useTtsStore = defineStore("ttsStore", {
  // 定义state，用来存储状态的
  state: () => {
    // 获取默认配置
    const defaultFormConfig = store.get("FormConfig.默认") || {
      languageSelect: "zh-CN",
      voiceSelect: "zh-CN-XiaoxiaoNeural",
      voiceStyleSelect: "Default",
      role: "",
      speed: 1,
      pitch: 1,
      api: 5  // 默认使用免费TTS服务
    };
    
    return {
      inputs: {
        inputValue: "如果你觉得这个项目还不错， 欢迎Star、Fork和PR。你的Star是对作者最好的鼓励。",
        ssmlValue: "如果你觉得这个项目还不错， 欢迎Star、Fork和PR。你的Star是对作者最好的鼓励。",
      },
      formConfig: defaultFormConfig,
      page: {
        asideIndex: "1",
        tabIndex: "1",
      },
      tableData: [], // 修改为直接初始化为空数组
      currConfigName: "默认", // 当前配置的名字
      config: {
        language: store.get("language") || "zh",
        formConfigJson: store.get("FormConfig") || {},
        formConfigList: [],
        configLabel: [],
        audition: store.get("audition") || "如果你觉得这个项目还不错， 欢迎Star、Fork和PR。你的Star是对作者最好的鼓励。",
        autoplay: store.get("autoplay") !== undefined ? store.get("autoplay") : true,
        updateNotification: store.get("updateNotification") !== undefined ? store.get("updateNotification") : true,
        titleStyle: store.get("titleStyle") || "custom",
        api: store.get("api") || 5,  // 默认值为5，免费TTS服务
        formatType: store.get("formatType") || "mp3",
        speechKey: store.get("speechKey") || "",
        serviceRegion: store.get("serviceRegion") || "",
        thirdPartyApi: store.get("thirdPartyApi") || "",
        disclaimers: store.get("disclaimers") || false,
        retryCount: store.get("retryCount") || 3,
        retryInterval: store.get("retryInterval") || 1000,
        openAIKey: store.get("openAIKey") || "",
        gptModel: store.get("gptModel") || "gpt-3.5-turbo",
        tts88Key: store.get("tts88Key") || "",
        openAIBaseUrl: store.get("openAIBaseUrl") || "",
      },
      isLoading: false,
      currMp3Buffer: null,
      currMp3Url: ref(""),
      audioPlayer: null,
      batchTaskId: "",
      batchTaskStatus: "",
      batchProgress: 0,
      audioOutput: {
        generatedFiles: [], // 已生成的音频文件列表
        cloudSaved: [], // 已保存到云端的文件列表
        currentPreview: null // 当前预览的音频文件
      },
    };
  },
  // 定义getters，类似于computed，具有缓存g功能
  getters: {},
  // 定义actions，类似于methods，用来修改state，做一些业务逻辑
  actions: {
    setDoneStatus(filePath: string) {
      for (const item of this.tableData) {
        if (item.filePath == filePath) {
          item.status = "done";
          return;
        }
      }
    },
    setSSMLValue(text = "") {
      if (text === "") text = this.inputs.inputValue;
      const voice = this.formConfig.voiceSelect;
      console.log("setSSMLValue - 当前选择的声音:", voice);
      
      if (!voice) {
        console.error("警告: 没有选择声音，将使用默认声音");
        this.formConfig.voiceSelect = "zh-CN-XiaoxiaoNeural";
        console.log("已设置默认声音:", this.formConfig.voiceSelect);
      }
      
      const express = this.formConfig.voiceStyleSelect;
      const role = this.formConfig.role;
      const rate = (this.formConfig.speed - 1) * 100;
      const pitch = (this.formConfig.pitch - 1) * 50;
      
      // 准备强度和音量属性
      let intensityAttr = "";
      if (this.formConfig.intensity && this.formConfig.intensity !== "default") {
        let intensityValue = "";
        if (this.formConfig.intensity === "weak") intensityValue = "0.5";
        else if (this.formConfig.intensity === "strong") intensityValue = "1.5";
        else if (this.formConfig.intensity === "extraStrong") intensityValue = "2";
        else intensityValue = this.formConfig.intensity;
        
        intensityAttr = ` styledegree="${intensityValue}"`;
      }
      
      // 准备音量属性
      let volumeAttr = "";
      if (this.formConfig.volume && this.formConfig.volume !== "default") {
        let volumeMapping = {
          "extraWeak": "x-soft",
          "weak": "soft", 
          "medium": "medium",
          "strong": "loud",
          "extraStrong": "x-loud"
        };
        
        volumeAttr = ` volume="${volumeMapping[this.formConfig.volume] || this.formConfig.volume}"`;
      }

      // 准备静音配置
      let silenceConfig = "";
      if (this.formConfig.silence && this.formConfig.silence !== "default") {
        silenceConfig = `<break time="${this.formConfig.silence}" />`;
      }
      
      const ssmlContent = `<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="en-US">
        <voice name="${voice}">
            <mstts:express-as ${express != "General" ? 'style="' + express + '"' : ""}${role != "Default" ? ' role="' + role + '"' : ""}${intensityAttr}>
                <prosody rate="${rate}%" pitch="${pitch}%"${volumeAttr}>
                ${silenceConfig}${text}
                </prosody>
            </mstts:express-as>
        </voice>
      </speak>`;
      
      this.inputs.ssmlValue = ssmlContent;
      console.log("生成的SSML使用声音:", voice);
    },
    setLanguage() {
      store.set("language", this.config.language);
    },
    setAuditionConfig() {
      store.set("audition", this.config.audition);
      // 保存后立即播放试听文本
      this.playAuditionText();
    },
    updateNotificationChange() {
      store.set("updateNotification", this.config.updateNotification);
    },
    updateTitleStyle() {
      store.set("titleStyle", this.config.titleStyle);
    },
    setFormatType() {
      store.set("formatType", this.config.formatType);
    },
    setAutoPlay() {
      store.set("autoplay", this.config.autoplay);
    },
    setSpeechKey() {
      store.set("speechKey", this.config.speechKey);
    },
    setOpenAIKey() {
      store.set("openAIKey", this.config.openAIKey);
    },
    setOpenAIBaseUrl() {
      store.set("openAIBaseUrl", this.config.openAIBaseUrl);
    },
    setTTS88Key() {
      store.set("tts88Key", this.config.tts88Key);
    },
    setGPTModel() {
      store.set("gptModel", this.config.gptModel);
    },
    setServiceRegion() {
      store.set("serviceRegion", this.config.serviceRegion);
    },
    setThirdPartyApi() {
      store.set("thirdPartyApi", this.config.thirdPartyApi);
    },
    setRetryCount() {
      store.set("retryCount", parseInt(this.config.retryCount as any));
    },
    setRetryInterval() {
      store.set("retryInterval", parseInt(this.config.retryInterval as any));
    },
    addFormConfig() {
      this.config.formConfigJson[this.currConfigName] = this.formConfig;
      this.genFormConfig();
    },
    genFormConfig() {
      // 确保 formConfigJson 存在
      if (!this.config.formConfigJson) {
        this.config.formConfigJson = {};
      }
      
      // 不再强制设置API类型为4
      // 以下代码已被注释移除
      // for (const key in this.config.formConfigJson) {
      //   if (this.config.formConfigJson[key]) {
      //     this.config.formConfigJson[key].api = 4;
      //   }
      // }
      
      this.config.formConfigList = Object.keys(this.config.formConfigJson).map(
        (item) => ({
          tagName: item,
          content: this.config.formConfigJson[item],
        })
      );
      this.config.configLabel = Object.keys(this.config.formConfigJson).map(
        (item) => ({
          value: item,
          label: item,
        })
      );
      
      // 保存更新后的配置
      store.set("FormConfig", this.config.formConfigJson);
    },
    async startChatGPT(promptGPT: string) {
      await getDataGPT(
        {
          promptGPT: promptGPT,
          key: this.config.openAIKey,
          model: this.config.gptModel,
          retryCount: this.config.retryCount,
          retryInterval: this.config.retryInterval,
          baseUrl: this.config.openAIBaseUrl,
        }
      )
        .then((res: any) => {
          this.inputs.inputValue = res;
          this.setSSMLValue();
          console.log(res);
          ElMessage({
            message: "Response Success!",
            type: "success",
            duration: 2000,
          });
        })
        .catch((err: any) => {
          console.error(err);
          ElMessage({
            message: "转换失败\n" + String(err),
            type: "error",
            duration: 3000,
          });
        });
    },
    async start() {
      console.log("清空缓存中");
      let resFlag = true;
      this.currMp3Buffer = null;
      this.currMp3Url = ref("");
      
      // 单文本转换
      if (this.page.asideIndex == "1") {
        this.currMp3Url = ref("");
        const value = {
          activeIndex: this.page.tabIndex,
          ssmlContent: this.inputs.ssmlValue,
          inputContent: this.inputs.inputValue,
          retryCount: this.config.retryCount,
          retryInterval: this.config.retryInterval,
        };
        this.isLoading = true;
        try {
          // 获取TTS数据
          let res = await getTTSData({
            api: this.formConfig.api,
            voiceData: value,
            speechKey: this.config.speechKey,
            region: this.config.serviceRegion,
            thirdPartyApi: this.config.thirdPartyApi,
            tts88Key: this.config.tts88Key,
          });
          
          if (res) {
            // 成功获取到数据
            if (res.audibleUrl) {
              // 如果返回了可播放的URL
              this.currMp3Url = ref(res.audibleUrl);
              // 播放音频
              if (this.config.autoplay) {
                this.audition(this.currMp3Url.value);
              }
            } else if (res.buffer) {
              // 如果返回了音频buffer
              const audioBlob = new Blob([res.buffer], { type: 'audio/mpeg' });
              this.currMp3Url = ref(URL.createObjectURL(audioBlob));
              // 播放音频
              if (this.config.autoplay) {
                this.audition(this.currMp3Url.value);
              }
            }
            ElMessage({
              message: "转换成功",
              type: "success",
              duration: 2000,
            });
          }
        } catch (err: any) {
          console.error(err);
          ElMessage({
            message: "转换失败\n" + String(err),
            type: "error",
            duration: 3000,
          });
          resFlag = false;
        } finally {
          this.isLoading = false;
        }
      } 
      // 批量转换
      else if (this.page.asideIndex == "2") {
        this.isLoading = true;
        try {
          // 检查API配置
          if (!this.config.thirdPartyApi || !this.config.tts88Key) {
            throw new Error("请先配置TTS88 API地址和密钥");
          }

          // 获取待转换的文件列表
          const pendingFiles = this.tableData.filter((item: any) => item.status !== "done");
          
          if (pendingFiles.length === 0) {
            ElMessage({
              message: "没有需要转换的文件",
              type: "warning",
              duration: 2000,
            });
            this.isLoading = false;
            return true;
          }

          // 验证并准备SSML内容
          const inputs = await Promise.all(pendingFiles.map(async (file: any) => {
            try {
              // 设置文件状态为处理中
              file.status = "processing";
              
              // 读取文件内容作为纯文本
              const plainText = file.content;
              if (!plainText || plainText.trim() === '') {
                throw new Error("文件内容为空");
              }

              // 使用当前配置生成SSML
              const voice = this.formConfig.voiceSelect;
              const express = this.formConfig.voiceStyleSelect;
              const role = this.formConfig.role;
              const rate = (this.formConfig.speed - 1) * 100;
              const pitch = (this.formConfig.pitch - 1) * 50;
              
              // 准备强度和音量属性
              let intensityAttr = "";
              if (this.formConfig.intensity && this.formConfig.intensity !== "default") {
                let intensityValue = "";
                if (this.formConfig.intensity === "weak") intensityValue = "0.5";
                else if (this.formConfig.intensity === "strong") intensityValue = "1.5";
                else if (this.formConfig.intensity === "extraStrong") intensityValue = "2";
                else intensityValue = this.formConfig.intensity;
                
                intensityAttr = ` styledegree="${intensityValue}"`;
              }
              
              // 准备音量属性
              let volumeAttr = "";
              if (this.formConfig.volume && this.formConfig.volume !== "default") {
                const volumeMapping: {[key: string]: string} = {
                  "extraWeak": "x-soft",
                  "weak": "soft", 
                  "strong": "loud",
                  "extraStrong": "x-loud"
                };
                
                volumeAttr = ` volume="${volumeMapping[this.formConfig.volume] || this.formConfig.volume}"`;
              }

              // 生成SSML
              const ssml = `<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="en-US">
                <voice name="${voice}">
                    <mstts:express-as ${express != "General" ? 'style="' + express + '"' : ""}${role != "Default" ? ' role="' + role + '"' : ""}${intensityAttr}>
                        <prosody rate="${rate}%" pitch="${pitch}%"${volumeAttr}>
                        ${plainText}
                        </prosody>
                    </mstts:express-as>
                </voice>
              </speak>`;
              
              return {
                content: ssml
              };
            } catch (err: any) {
              file.status = "error";
              file.error = `SSML生成失败: ${err.message || String(err)}`;
              throw err;
            }
          }));

          // 验证任务数据结构
          const task = {
            inputKind: "SSML",
            inputs: inputs.filter(input => input !== null),
            properties: {
              wordBoundaryEnabled: true,
              outputFormat: "audio-16khz-128kbitrate-mono-mp3",
              concatenateResult: false,
              decompressOutputFiles: false
            }
          };

          if (task.inputs.length === 0) {
            throw new Error("没有有效的SSML内容可以转换");
          }

          // 发送批量任务请求
          this.batchTaskId = await createBatchTask(
            this.config.thirdPartyApi,
            this.config.tts88Key,
            task
          );

          if (!this.batchTaskId) {
            throw new Error("创建批量任务失败：未获取到有效的任务ID");
          }

          // 定义最大重试次数和检查间隔
          const MAX_STATUS_CHECKS = 1200;  // 1小时内最多检查1200次（3秒一次）
          const CHECK_INTERVAL = 3000;     // 3秒检查一次
          let checkCount = 0;

          // 定期检查任务状态
          const checkStatus = async () => {
            if (!this.batchTaskId) {
              this.isLoading = false;
              throw new Error("无效的任务ID");
            }

            if (checkCount >= MAX_STATUS_CHECKS) {
              throw new Error("任务执行超时");
            }

            try {
              const status = await getBatchTaskStatus(
                this.config.thirdPartyApi,
                this.config.tts88Key,
                this.batchTaskId
              );

              // 更新状态
              this.batchTaskStatus = status.status;
              checkCount++;
              
              // 计算进度
              if (status.properties) {
                const total = status.properties.succeededAudioCount + status.properties.failedAudioCount;
                const completed = status.properties.succeededAudioCount;
                this.batchProgress = total > 0 ? Math.round((completed / total) * 100) : 0;

                // 更新界面显示
                if (this.batchProgress > 0) {
                  ElMessage({
                    message: `批量转换进度: ${this.batchProgress}%`,
                    type: "success",
                    duration: 2000,
                  });
                }

                // 记录失败的文件信息
                if (status.properties.failedAudioCount > 0) {
                  console.warn(`当前有 ${status.properties.failedAudioCount} 个文件转换失败`);
                }
              }

              // 处理不同的任务状态
              switch (status.status) {
                case "NotStarted":
                case "Running":
                  // 继续检查
                  setTimeout(checkStatus, CHECK_INTERVAL);
                  break;

                case "Succeeded":
                  if (status.outputs?.result) {
                    // 更新所有文件状态
                    for (const file of pendingFiles) {
                      if (file.status === "processing") {
                        file.status = "done";
                        file.audioUrl = status.outputs.result;
                      }
                    }

                    ElMessage({
                      message: `批量转换完成，成功: ${status.properties?.succeededAudioCount || 0} 个，失败: ${status.properties?.failedAudioCount || 0} 个`,
                      type: "success",
                      duration: 3000,
                    });
                  } else {
                    throw new Error("转换成功但未获取到下载链接");
                  }
                  this.isLoading = false;
                  break;

                case "Failed":
                  throw new Error(`批量转换失败: ${status.properties?.failedAudioCount || 0} 个文件失败`);

                case "Canceled":
                  throw new Error("任务已被取消");

                default:
                  throw new Error(`未知的任务状态: ${status.status}`);
              }
            } catch (err) {
              console.error("检查任务状态失败:", err);
              // 更新失败文件的状态
              for (const file of pendingFiles) {
                if (file.status === "processing") {
                  file.status = "error";
                  file.error = String(err);
                }
              }
              ElMessage({
                message: "检查任务状态失败: " + String(err),
                type: "error",
                duration: 3000,
              });
              this.isLoading = false;
            }
          };

          // 开始检查任务状态
          await checkStatus();

        } catch (err) {
          console.error("批量转换失败:", err);
          // 更新所有处理中文件的状态为错误
          for (const file of this.tableData) {
            if (file.status === "processing") {
              file.status = "error";
              file.error = String(err);
            }
          }
          ElMessage({
            message: "批量转换失败: " + String(err),
            type: "error",
            duration: 3000,
          });
          resFlag = false;
          this.isLoading = false;
        }
      }
      return resFlag;
    },
    async audition(val: string) {
      if (!val) {
        ElMessage({
          message: "播放失败，无有效音频源",
          type: "error",
          duration: 2000,
        });
        return false;
      }
      
      // 停止当前正在播放的音频
      if (this.audioPlayer) {
        this.audioPlayer.pause();
        this.audioPlayer = null;
      }
      
      // 创建新的音频播放器
      const audioPlayer = new Audio(val);
      
      // 添加事件监听
      audioPlayer.addEventListener('ended', () => {
        console.log('音频播放结束');
        document.dispatchEvent(new CustomEvent('audio-playback-ended'));
      });
      
      audioPlayer.addEventListener('error', (e) => {
        console.error('音频播放出错:', e);
        document.dispatchEvent(new CustomEvent('audio-playback-error'));
      });
      
      this.audioPlayer = audioPlayer;
      
      try {
        await audioPlayer.play();
        // 移除成功消息，由调用方自行处理
        console.log('音频播放成功');
        return true;
      } catch (err) {
        console.error('播放失败:', err);
        ElMessage({
          message: "播放失败",
          type: "error",
          duration: 2000,
        });
        // 触发错误事件
        document.dispatchEvent(new CustomEvent('audio-playback-error'));
        return false;
      }
    },
    showDisclaimers() {
      if (!this.config.disclaimers) {
        this.config.disclaimers = true;
        store.set("disclaimers", true);
        ElMessage({
          message: "感谢使用，本工具仅供个人学习研究，请勿商用。",
          type: "success",
          duration: 3000,
        });
      }
    },
    // 新增方法：播放试听文本
    async playAuditionText() {
      console.log('开始执行 playAuditionText 方法');
      console.log('试听文本:', this.config.audition);
      console.log('当前配置:', {
        api: this.formConfig.api,
        speechKey: this.config.speechKey,
        region: this.config.serviceRegion,
        thirdPartyApi: this.config.thirdPartyApi,
        tts88Key: this.config.tts88Key
      });
      
      if (!this.config.audition) {
        ElMessage({
          message: "试听文本为空，无法播放",
          type: "warning",
          duration: 2000,
        });
        return;
      }

      // 暂存当前输入内容
      const tempInput = this.inputs.inputValue;
      
      try {
        // 临时替换输入为试听文本
        this.inputs.inputValue = this.config.audition;
        // 更新SSML
        this.setSSMLValue();
        console.log('生成的SSML:', this.inputs.ssmlValue);
        
        // 开始转换并播放
        this.isLoading = true;
        const value = {
          activeIndex: this.page.tabIndex,
          ssmlContent: this.inputs.ssmlValue,
          inputContent: this.inputs.inputValue,
          retryCount: this.config.retryCount,
          retryInterval: this.config.retryInterval,
        };
        console.log('请求参数:', value);
        
        // 检查API URL是否为空
        if (!this.config.thirdPartyApi) {
          console.error('TTS88 API URL未配置!');
          ElMessage({
            message: "请先在设置中配置TTS88 API地址",
            type: "error",
            duration: 3000,
          });
          throw new Error("TTS88 API URL未配置");
        }
        
        // 获取TTS数据
        console.log('开始请求TTS数据...');
        let res = await getTTSData({
          api: this.formConfig.api,
          voiceData: value,
          speechKey: this.config.speechKey,
          region: this.config.serviceRegion,
          thirdPartyApi: this.config.thirdPartyApi,
          tts88Key: this.config.tts88Key,
        });
        
        console.log('TTS数据请求结果:', res ? '成功' : '失败');
        if (res) {
          if (res.audibleUrl) {
            console.log('收到audibleUrl:', res.audibleUrl);
            this.currMp3Url = ref(res.audibleUrl);
            this.audition(this.currMp3Url.value);
          } else if (res.buffer) {
            console.log('收到buffer数据，长度:', res.buffer.byteLength);
            const audioBlob = new Blob([res.buffer], { type: 'audio/mpeg' });
            this.currMp3Url = ref(URL.createObjectURL(audioBlob));
            console.log('生成的音频URL:', this.currMp3Url.value);
            this.audition(this.currMp3Url.value);
          } else {
            console.error('收到的响应中没有可用的音频数据');
            throw new Error('收到的响应中没有可用的音频数据');
          }
        }
      } catch (err) {
        console.error('试听文本播放失败:', err);
        ElMessage({
          message: "试听文本播放失败: " + (err instanceof Error ? err.message : String(err)),
          type: "error",
          duration: 3000,
        });
      } finally {
        // 恢复原始输入
        this.inputs.inputValue = tempInput;
        // 恢复SSML
        this.setSSMLValue();
        this.isLoading = false;
      }
    },
    async generateAudio(text = "", config = null) {
      // 实现音频生成逻辑
      const audioConfig = config || this.formConfig;
      // 根据选择的格式和质量生成音频
      // 返回生成的音频文件信息
    },
    async previewAudio(audioFile) {
      // 实现音频预览逻辑
      this.audioOutput.currentPreview = audioFile;
      // 播放音频
    },
    async batchDownload() {
      // 实现批量下载逻辑
      const files = this.audioOutput.generatedFiles;
      // 打包并下载所有文件
    },
    async saveToCloud() {
      // 实现保存到云端逻辑
      const files = this.audioOutput.generatedFiles;
      // 上传文件到云存储
      // 更新已保存文件列表
    },
    // 自动预览功能
    async autoPreview() {
      if (!this.formConfig.autoPreview) return;
      
      // 使用预设的试听文本
      const previewText = "这是一段预览文本，您可以通过它来确认当前的语音效果。";
      
      try {
        // 保存当前的输入内容
        const originalInput = this.inputs.inputValue;
        const originalSSML = this.inputs.ssmlValue;
        
        // 设置预览文本
        this.inputs.inputValue = previewText;
        this.setSSMLValue();
        
        // 生成预览音频
        const voiceData = {
          activeIndex: this.page.tabIndex,
          ssmlContent: this.inputs.ssmlValue,
          inputContent: this.inputs.inputValue,
          retryCount: this.config.retryCount,
          retryInterval: this.config.retryInterval,
        };
        
        const res = await getTTSData({
          api: this.formConfig.api,
          voiceData,
          speechKey: this.config.speechKey,
          region: this.config.serviceRegion,
          thirdPartyApi: this.config.thirdPartyApi,
          tts88Key: this.config.tts88Key,
        });
        
        if (res) {
          if (res.buffer) {
            const audioBlob = new Blob([res.buffer], { type: 'audio/mpeg' });
            const audioUrl = URL.createObjectURL(audioBlob);
            this.audition(audioUrl);
          } else if (res.audibleUrl) {
            this.audition(res.audibleUrl);
          }
        }
        
        // 恢复原始输入
        this.inputs.inputValue = originalInput;
        this.inputs.ssmlValue = originalSSML;
        
      } catch (error) {
        console.error('自动预览失败:', error);
        ElMessage({
          message: "自动预览失败，请稍后再试",
          type: "error",
          duration: 2000,
        });
      }
    },
    // 添加新的转换记录到历史
    addHistoryRecord(record) {
      try {
        console.log('开始保存历史记录:', record);
        
        // 从localStorage获取现有历史记录
        let history = JSON.parse(localStorage.getItem('tts-history') || '[]');
        console.log('获取到现有历史记录:', history.length, '条');
        
        // 确保记录有必要的字段
        if (!record || typeof record !== 'object') {
          console.error('历史记录参数无效:', record);
          return false;
        }
        
        // 创建新记录
        const newRecord = {
          id: Date.now(), // 使用时间戳作为唯一ID
          text: record.text || '',
          url: record.url || '',
          voiceName: record.voiceName || '',
          audioData: record.audioData || null, // 保存音频数据
          timestamp: Date.now()
        };
        
        console.log('创建新记录ID:', newRecord.id);
        
        // 将新记录添加到历史的开头
        history.unshift(newRecord);
        
        // 最多保留100条记录
        if (history.length > 100) {
          history = history.slice(0, 100);
        }
        
        // 保存回localStorage
        localStorage.setItem('tts-history', JSON.stringify(history));
        
        console.log('已保存历史记录，当前共', history.length, '条记录');
        
        // 检查保存是否成功
        let savedHistory = JSON.parse(localStorage.getItem('tts-history') || '[]');
        console.log('验证保存结果:', savedHistory.length, '条记录');
        
        // 触发自定义事件通知历史记录更新
        try {
          window.dispatchEvent(new CustomEvent('tts-history-updated'));
          console.log('已触发历史记录更新事件');
        } catch (e) {
          console.error('触发历史更新事件失败:', e);
        }
        
        return true;
      } catch (err) {
        console.error('保存历史记录失败:', err);
        return false;
      }
    },
  },
});

export interface Config {
  language: string;
  audition: boolean;
  autoplay: boolean;
  updateNotification: boolean;
  titleStyle: string;
  api: number;
  formatType: string;
  speechKey: string;
  region: string;
  thirdPartyApi: string;
  tts88Key: string;
  openAIKey: string;
  gptModel: string;
  openAIBaseUrl: string;
}
