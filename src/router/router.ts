import { createRouter, createWebHashHistory } from 'vue-router';

// 首页组件
const MainComponent = () => import('@/components/main/Main.vue');
// 历史记录组件
const HistoryRecord = () => import('@/components/history/HistoryRecord.vue');

// 定义路由
const routes = [
  {
    path: '/',
    name: 'main',
    component: MainComponent
  },
  {
    path: '/history',
    name: 'history',
    component: HistoryRecord
  }
];

// 创建路由实例
const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export default router; 