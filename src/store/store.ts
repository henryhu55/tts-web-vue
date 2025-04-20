// @/store/firstStore.js

import { defineStore } from "pinia";
import { getTTSData, getDataGPT } from "./play";
import { ElMessage } from "element-plus";
import WebStore from "./web-store";

// 使用Web版本的Store
const store = new WebStore();

// 定义并导出容器，第一个参数是容器id，必须唯一，用来将所有的容器
// 挂载到根容器上
export const useTtsStore = defineStore("ttsStore", {
  // 定义state，用来存储状态的
  state: () => {
    // 获取默认配置
    const defaultFormConfig = store.get("FormConfig.默认");
    
    return {
      inputs: {
        inputValue: "你好啊\n今天天气怎么样?",
        ssmlValue: "你好啊\n今天天气怎么样?",
      },
      formConfig: defaultFormConfig,
      page: {
        asideIndex: "1",
        tabIndex: "1",
      },
      tableData: <any>[], // 文件列表的数据
      currConfigName: "默认", // 当前配置的名字
      config: {
        language: store.get("language"),
        formConfigJson: store.get("FormConfig"),
        formConfigList: <any>[],
        configLabel: <any>[],
        audition: store.get("audition"),
        autoplay: store.get("autoplay"),
        updateNotification: store.get("updateNotification"),
        titleStyle: store.get("titleStyle"),
        api: store.get("api"),  // 这里会读取到默认值 4
        formatType: store.get("formatType"),
        speechKey: store.get("speechKey"),
        serviceRegion: store.get("serviceRegion"),
        thirdPartyApi: store.get("thirdPartyApi"),
        disclaimers: store.get("disclaimers"),
        retryCount: store.get("retryCount"),
        retryInterval: store.get("retryInterval"),
        openAIKey: store.get("openAIKey"),
        gptModel: store.get("gptModel"),
        tts88Key: store.get("tts88Key"),
        openAIBaseUrl: store.get("openAIBaseUrl"),
      },
      isLoading: false,
      currMp3Buffer: null,
      currMp3Url: "",
      audioPlayer: null as HTMLAudioElement | null,
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
      const express = this.formConfig.voiceStyleSelect;
      const role = this.formConfig.role;
      const rate = (this.formConfig.speed - 1) * 100;
      const pitch = (this.formConfig.pitch - 1) * 50;
      
      // 准备强度和音量属性
      let intensityAttr = "";
      if (this.formConfig.intensity && this.formConfig.intensity !== "default") {
        // 将字符串强度值转换为对应的数值
        let intensityValue = "";
        if (this.formConfig.intensity === "weak") intensityValue = "0.5";
        else if (this.formConfig.intensity === "strong") intensityValue = "1.5";
        else if (this.formConfig.intensity === "extraStrong") intensityValue = "2";
        else intensityValue = this.formConfig.intensity; // 如果已经是数值则直接使用
        
        intensityAttr = ` styledegree="${intensityValue}"`;
      }
      
      // 准备音量属性
      let volumeAttr = "";
      if (this.formConfig.volume && this.formConfig.volume !== "default") {
        // 定义音量值映射
        let volumeMapping: {[key: string]: string} = {
          "extraWeak": "x-soft",
          "weak": "soft", 
          "strong": "loud",
          "extraStrong": "x-loud"
        };
        
        volumeAttr = ` volume="${volumeMapping[this.formConfig.volume] || this.formConfig.volume}"`;
      }

      this.inputs.ssmlValue = `<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xmlns:emo="http://www.w3.org/2009/10/emotionml" version="1.0" xml:lang="en-US">
        <voice name="${voice}">
            <mstts:express-as ${express != "General" ? 'style="' + express + '"' : ""}${role != "Default" ? ' role="' + role + '"' : ""}${intensityAttr}>
                <prosody rate="${rate}%" pitch="${pitch}%"${volumeAttr}>
                ${text}
                </prosody>
            </mstts:express-as>
        </voice>
    </speak>
    `;
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
      this.currMp3Url = "";
      // this.page.asideIndex == "1"单文本转换
      if (this.page.asideIndex == "1") {
        this.currMp3Url = "";
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
              this.currMp3Url = res.audibleUrl;
              // 播放音频
              if (this.config.autoplay) {
                this.audition(this.currMp3Url);
              }
            } else if (res.buffer) {
              // 如果返回了音频buffer
              const audioBlob = new Blob([res.buffer], { type: 'audio/mpeg' });
              this.currMp3Url = URL.createObjectURL(audioBlob);
              // 播放音频
              if (this.config.autoplay) {
                this.audition(this.currMp3Url);
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
      return resFlag;
    },
    async audition(val: string) {
      if (!val) {
        ElMessage({
          message: "播放失败，无有效音频源",
          type: "error",
          duration: 2000,
        });
        return;
      }
      
      // 停止当前正在播放的音频
      if (this.audioPlayer) {
        this.audioPlayer.pause();
        this.audioPlayer = null;
      }
      
      // 创建新的音频播放器
      const audioPlayer = new Audio(val);
      this.audioPlayer = audioPlayer;
      
      try {
        await audioPlayer.play();
        ElMessage({
          message: "正在播放",
          type: "success",
          duration: 2000,
        });
      } catch (err) {
        console.error('播放失败:', err);
        ElMessage({
          message: "播放失败",
          type: "error",
          duration: 2000,
        });
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
            this.currMp3Url = res.audibleUrl;
            this.audition(this.currMp3Url);
          } else if (res.buffer) {
            console.log('收到buffer数据，长度:', res.buffer.byteLength);
            const audioBlob = new Blob([res.buffer], { type: 'audio/mpeg' });
            this.currMp3Url = URL.createObjectURL(audioBlob);
            console.log('生成的音频URL:', this.currMp3Url);
            this.audition(this.currMp3Url);
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
