import { createRouter, createWebHistory } from 'vue-router';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'feed', component: () => import('./pages/Feed.vue') },
    { path: '/settings', component: () => import('./pages/Settings.vue') },
  ],
});
