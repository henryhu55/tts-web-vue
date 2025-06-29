// 为assets下的i18n模块创建声明
declare module '@/assets/i18n/i18n' {
  import type { Ref } from 'vue';
  const i18n: {
    global: {
      t: (key: string, ...args: any[]) => string;
      locale: Ref<string>;
    }
  };
  export default i18n;
}

// 为全局voices模块创建声明
declare module './../../global/voices' {
  export const voices: any[];
} 