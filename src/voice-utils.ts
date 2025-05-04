/**
 * 语音工具函数库
 * 提供与语音处理相关的实用函数
 */

/**
 * 获取语音的中文名称，格式为"拼音-中文"
 * @param shortName 语音的短名称，例如 zh-CN-XiaoxiaoNeural
 * @returns 格式化后的名称，例如 Xiaoxiao-晓晓
 */
export const getChineseName = (shortName: string) => {
  if (!shortName) return '';
  
  // 从ShortName中提取名称部分
  const nameParts = shortName.split('-');
  
  // 处理特殊情况
  if (nameParts.length < 3) {
    // 处理特殊情况，如shandong
    if (shortName.toLowerCase() === 'shandong') {
      return 'Shandong-山东';
    }
    return shortName;
  }
  
  // 提取区域和名称
  const region = nameParts[0] + '-' + nameParts[1]; // 如zh-CN, zh-TW, zh-HK
  const name = nameParts[2].replace('Neural', '');
  
  // 中文名称映射
  const nameMap: {[key: string]: string} = {
    // 中国大陆 (zh-CN)
    'Xiaoxuan': '晓萱', 
    'Xiaochen': '晓辰',
    'Xiaoxiao': '晓晓',
    'Xiaohan': '晓涵',
    'Xiaozhen': '晓甄',
    'Yunjian': '云健',
    'Xiaoyan': '晓颜',
    'Xiaoyi': '晓伊',
    'Yunxi': '云熙',
    'Xiaomo': '晓墨',
    'Yunye': '云叶',
    'Yunxia': '云霞',
    'Xiaorui': '晓瑞',
    'Xiaoshuang': '晓双',
    'Yunfeng': '云枫',
    'Yunhan': '云翰',
    'Kangkang': '康康',
    'Zhangyu': '章宇',
    'Yunhao': '云皓',
    'Xiaomeng': '晓梦',
    'Yunze': '云泽',
    'Xiaoqiu': '晓秋',
    'Xiaoyou': '晓悠',
    'Yunyang': '云阳',
    'Yundeng': '云登',
    'Yunxiang': '云翔',
    'Xiaoni': '晓妮',
    'Xiaobei': '晓贝',
    'Yunni': '云妮',
    'Yunyi': '云怡',
    'Yunxuan': '云轩',
    'Xiaohui': '晓慧',
    
    // 方言
    'Honghu': '洪湖',
    'Liaoning': '辽宁',
    'Shaanxi': '陕西',
    'Henan': '河南',
    'Yunnan': '云南',
    'Sichuan': '四川',
    'Tianjin': '天津',
    'Shanxi': '山西',
    'Hebei': '河北',
    'Gansu': '甘肃',
    'Anhui': '安徽',
  };
  
  // 区域特定名称
  const regionNames: {[region: string]: {[key: string]: string}} = {
    'zh-CN': {
      'YunJhe': '云杰'
    },
    'zh-TW': {
      'HsiaoChen': '曉臻',
      'HsiaoYu': '曉雨',
      'YunJhe': '雲哲'
    },
    'zh-HK': {
      'HiuMaan': '曉曼',
      'HiuGaai': '曉佳',
      'WanLung': '雲龍'
    }
  };
  
  // 先从通用映射中查找
  if (nameMap[name]) {
    return `${name}-${nameMap[name]}`;
  }
  
  // 再从特定区域的映射中查找
  if (regionNames[region] && regionNames[region][name]) {
    return `${name}-${regionNames[region][name]}`;
  }
  
  return shortName;
};

/**
 * 获取语音的显示名称
 * 如果有中文名称映射，则返回中文名称，否则返回原始名称
 * @param voice 语音选项对象
 * @returns 格式化后的显示名称
 */
export const getVoiceDisplayName = (voice: any) => {
  if (!voice) return '';
  
  const shortName = voice.ShortName || voice.shortName;
  if (!shortName) return voice.DisplayName || voice.name || '';
  
  return getChineseName(shortName) || (voice.DisplayName || voice.name || shortName);
}; 