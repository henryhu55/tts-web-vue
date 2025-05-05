import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import "element-plus/theme-chalk/display.css"
import * as Icons from "@element-plus/icons-vue"

export default function (app: any) {
  // 全局注册Element Plus
  app.use(ElementPlus)
  
  // 注册所有图标
  for (const name in Icons) {
    app.component(name, (Icons as any)[name])
  }
}
