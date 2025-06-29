import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import "element-plus/theme-chalk/display.css"
import * as Icons from "@element-plus/icons-vue"

export default {
  install(app: any) {
    // 全局注册Element Plus（包括所有组件和指令）
    app.use(ElementPlus, {
      // 启用所有组件
      components: true,
      // 启用所有指令
      directives: true
    })

    // 注册所有图标
    for (const name in Icons) {
      app.component(name, (Icons as any)[name])
    }
  }
}
