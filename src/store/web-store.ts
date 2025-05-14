/**
 * Web版本的存储类，使用localStorage代替electron-store
 */
class WebStore {
  constructor() {
    // 初始化检查，确保必要的配置存在
    this.initDefaultConfig();
  }

  // 设置键值对
  set(key: string, value: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  // 获取键值
  get(key: string): any {
    try {
      const value = localStorage.getItem(key);
      // 处理"undefined"和null的情况
      if (value === null || value === "undefined") {
        return null;
      }
      return JSON.parse(value);
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }

  // 删除键值对
  delete(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error deleting from localStorage:', error);
    }
  }

  // 初始化默认配置
  private initDefaultConfig(): void {
    // 设置默认API - 允许用户选择其他API
    if (!this.get("api")) {
      this.set("api", 5); // 默认使用免费TTS服务
    }

    // 确保FormConfig.默认存在
    let defaultFormConfig = this.get("FormConfig.默认");
    if (!defaultFormConfig) {
      defaultFormConfig = {
        api: 5, // 默认使用免费TTS服务
        languageSelect: "zh-CN",
        voiceSelect: "zh-CN-XiaoxiaoNeural",
        voiceStyleSelect: "Default",
        role: "",
        speed: 1,
        pitch: 1
      };
      this.set("FormConfig.默认", defaultFormConfig);
    } else {
      // 修复布尔值问题
      if (defaultFormConfig.api === true || defaultFormConfig.api === 'true') {
        defaultFormConfig.api = 5; // 设为免费TTS服务
        this.set("FormConfig.默认", defaultFormConfig);
      }
    }
    
    // 设置其他默认配置
    if (!this.get("language")) this.set("language", "zh");
    if (!this.get("formatType")) this.set("formatType", "mp3");
    if (!this.get("audition")) this.set("audition", "如果你觉得这个项目还不错， 欢迎Star、Fork和PR。你的Star是对作者最好的鼓励。");
    if (!this.get("autoplay")) this.set("autoplay", true);
    if (!this.get("updateNotification")) this.set("updateNotification", true);
    if (!this.get("titleStyle")) this.set("titleStyle", "custom");
    if (!this.get("retryCount")) this.set("retryCount", 3);
    if (!this.get("retryInterval")) this.set("retryInterval", 1000);
  }
}

export default WebStore; 