import 'vue';

// 扩展全局组件实例类型
declare module 'vue' {
  // 增强模板中的类型
  export interface ComponentCustomProperties {
    // 允许在模板中使用的全局属性
    [key: string]: any;
  }

  // 允许defineEmits、defineProps等API
  export function defineProps<T>(): T;
  export function defineEmits<T>(): T;
  export function defineExpose<T>(exposed?: T): void;
  export function withDefaults<T, U>(props: T, defaults: U): T & U;
} 