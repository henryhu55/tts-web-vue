# TTS-Vue Web版本

🎤 微软语音合成工具，Web版本，使用 `Vue` + `ElementPlus` + `Vite` 构建。

## 功能特点

- 🌐 完全Web化，无需安装桌面应用
- 🔊 支持微软多种语音合成
- 🚀 支持TTS88 API集成
- 🧠 支持OpenAI的文本生成
- 🌍 支持多语言：中文、英文、西班牙语

## 开发计划

> **📢 重要通知：桌面版本正在开发中！**  
> 我们正在开发跨平台桌面应用版本，将支持更多功能和更好的用户体验。  
> 敬请期待后续更新，请关注项目动态获取最新信息。

## 快速开始

### 开发环境

```bash
# 克隆仓库
git clone https://github.com/henryhu55/tts-web-vue.git

# 安装依赖
yarn install

# 启动开发服务器
yarn dev
```

### 生产构建

```bash
# 构建生产版本
yarn build

# 预览生产版本
yarn preview
```

## 部署

构建完成后，将 `dist`目录的内容部署到任何静态Web服务器上即可。

## API配置

本Web版本目前支持TTS88 API和OpenAI API:

### TTS88 API配置

1. 在设置页面中找到"第三方API URL"设置选项
2. 输入您的TTS88 API地址
3. 如果有API密钥，请输入到"TTS88 API密钥"字段

### OpenAI API配置

1. 在设置页面中找到OpenAI设置选项
2. 输入您的OpenAI API密钥
3. 选择要使用的模型（默认为gpt-3.5-turbo）
4. 如果使用自托管或代理，可以设置自定义的API Base URL

## 注意事项

- 数据仅存储在浏览器本地存储中，刷新或清除缓存不会影响到其他用户
- 转换后的音频文件可以直接在浏览器中播放或下载到本地

## 技术栈

- Vue 3.2
- Pinia
- ElementPlus
- Vite

## 许可证

MIT License

## 开始使用

- [项目简介](https://docs.tts88.top//guide/intro.html)
- [安装运行](https://docs.tts88.top//guide/install.html)
- [功能介绍](https://docs.tts88.top/guide/features.html)
- [常见问题](https://docs.tts88.top//guide/qa.html)
- [更新日志](https://docs.tts88.top//guide/update.html)

## 注意

该软件以及代码仅为个人学习测试使用，请在下载后24小时内删除，不得用于商业用途，否则后果自负。任何违规使用造成的法律后果与本人无关。该软件也永远不会收费，如果您使用该软件前支付了额外费用，或付费获得源码或成品软件，那么你一定被骗了！

**搬运请注明出处。禁止诱导他人以加群、私信等方式获取软件的仓库、下载地址和安装包。**

### 意见问题反馈，版本发布企鹅群：

`【tts-web-vue问题反馈群1】279895662`