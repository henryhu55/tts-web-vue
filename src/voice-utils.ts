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
  
  // 特殊处理方言格式：zh-CN-henan-YundengNeural
  if (nameParts.length >= 4) {
    const region = nameParts[0] + '-' + nameParts[1]; // 如zh-CN
    const dialect = nameParts[2].toLowerCase(); // 如henan
    const name = nameParts[3].replace('Neural', ''); // 如Yundeng
    
    // 方言映射
    const dialectMap: {[key: string]: string} = {
      'shaanxi': '陕西方言',
      'henan': '河南方言',
      'liaoning': '东北方言',
      'shandong': '山东方言',
      'shanghai': '上海方言',
      'sichuan': '四川方言',
      'tianjin': '天津方言',
      'hebei': '河北方言',
      'shanxi': '山西方言',
      'gansu': '甘肃方言',
      'anhui': '安徽方言',
      'hubei': '湖北方言',
      'honghu': '洪湖方言',
      'yunnan': '云南方言'
    };
    
    if (dialectMap[dialect]) {
      // 中文名称映射
      const nameMap: {[key: string]: string} = {
        'Yundeng': '云登',
        'Yunfeng': '云枫',
        'Yunhao': '云皓',
        'Yunxia': '云霞',
        'Yunxi': '云熙',
        'Yunye': '云叶',
        'Yunyang': '云阳',
        'Yunxiang': '云翔',
        'Xiaoxuan': '晓萱',
        'Xiaochen': '晓辰',
        'Xiaoshuang': '晓双'
        // 其他名称可以根据需要添加
      };
      
      if (nameMap[name]) {
        return `${name}-${dialectMap[dialect]}·${nameMap[name]}`;
      } else {
        return `${name}-${dialectMap[dialect]}`;
      }
    }
  }
  
  // 提取区域和名称
  const region = nameParts[0] + '-' + nameParts[1]; // 如zh-CN, zh-TW, zh-HK, yue-CN, wuu-CN
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
    
    // 粤语 (yue-CN) - 添加粤语声音映射
    'XiaoMin': '小敏',
    'YunSong': '云松',
    'XiaoRong': '小蓉',
    'YunZa': '云扎',
    'XiaoYu': '晓瑜',
    'WanLu': '婉露',
    'XiuYin': '秀英',
    'YunJun': '云军',
    
    // 吴语 (wuu-CN) - 添加吴语声音映射
    'Xiaotong': '晓彤',
    'Yunzhe': '云哲',
    
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
    },
    'yue-CN': {
      'XiaoMin': '小敏',
      'YunSong': '云松',
      'XiaoRong': '小蓉',
      'YunZa': '云扎',
      'XiaoYu': '晓瑜',
      'WanLu': '婉露',
      'XiuYin': '秀英',
      'YunJun': '云军'
    },
    'wuu-CN': {
      'Xiaotong': '晓彤',
      'Yunzhe': '云哲'
    }
  };
  
  // 检查是否有区域特定的名称
  if (regionNames[region] && regionNames[region][name]) {
    return `${name}-${regionNames[region][name]}`;
  }
  
  // 使用通用名称映射
  if (nameMap[name]) {
    // 对于粤语区域，在中文名前添加"粤语"标识
    if (region === 'yue-CN') {
      return `${name}-粤语·${nameMap[name]}`;
    }
    
    // 对于吴语区域，在中文名前添加"吴语"标识
    if (region === 'wuu-CN') {
      return `${name}-吴语·${nameMap[name]}`;
    }
    
    // 对于方言区域，添加对应方言标识
    if (name === 'Shaanxi' || name === 'shaanxi') {
      return `${name}-陕西方言`;
    }
    if (name === 'Henan' || name === 'henan') {
      return `${name}-河南方言`;
    }
    if (name === 'Liaoning' || name === 'liaoning') {
      return `${name}-东北方言`;
    }
    if (name === 'Shandong' || name === 'shandong') {
      return `${name}-山东方言`;
    }
    if (name === 'Shanghai' || name === 'shanghai') {
      return `${name}-上海方言`;
    }
    if (name === 'Sichuan' || name === 'sichuan') {
      return `${name}-四川方言`;
    }
    if (name === 'Tianjin' || name === 'tianjin') {
      return `${name}-天津方言`;
    }
    if (name === 'Hebei' || name === 'hebei') {
      return `${name}-河北方言`;
    }
    if (name === 'Shanxi' || name === 'shanxi') {
      return `${name}-山西方言`;
    }
    if (name === 'Gansu' || name === 'gansu') {
      return `${name}-甘肃方言`;
    }
    if (name === 'Anhui' || name === 'anhui') {
      return `${name}-安徽方言`;
    }
    if (name === 'Hubei' || name === 'hubei') {
      return `${name}-湖北方言`;
    }
    if (name === 'Honghu' || name === 'honghu') {
      return `${name}-洪湖方言`;
    }
    if (name === 'Yunnan' || name === 'yunnan') {
      return `${name}-云南方言`;
    }
    
    return `${name}-${nameMap[name]}`;
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