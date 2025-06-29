// 扩展全局组件实例类型
declare module '@vue/runtime-core' {
  // 增强模板中的类型
  export interface ComponentCustomProperties {
    // 允许在模板中使用的全局属性
    [key: string]: any;
  }
}