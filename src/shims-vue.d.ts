/* eslint-disable */
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// 声明全局组件类型
declare module '@vue/runtime-core' {
  export interface GlobalComponents {
    ElButton: typeof import('element-plus')['ElButton']
    ElSelect: typeof import('element-plus')['ElSelect']
    ElOption: typeof import('element-plus')['ElOption']
    ElMessage: typeof import('element-plus')['ElMessage']
    ElIcon: typeof import('element-plus')['ElIcon']
    ElTooltip: typeof import('element-plus')['ElTooltip']
    ElProgress: typeof import('element-plus')['ElProgress']
    ElForm: typeof import('element-plus')['ElForm']
    ElFormItem: typeof import('element-plus')['ElFormItem']
    ElInput: typeof import('element-plus')['ElInput']
    ElSwitch: typeof import('element-plus')['ElSwitch']
    ElSlider: typeof import('element-plus')['ElSlider']
    ElAlert: typeof import('element-plus')['ElAlert']
    ElCollapse: typeof import('element-plus')['ElCollapse']
    ElCollapseItem: typeof import('element-plus')['ElCollapseItem']
    ElCollapseTransition: typeof import('element-plus')['ElCollapseTransition']
    ElSelectV2: typeof import('element-plus')['ElSelectV2']
  }
}

// 这些模块声明已移动到 module-shims.d.ts