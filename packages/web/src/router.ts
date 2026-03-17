import { createRouter, createWebHistory } from 'vue-router';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: () => import('./pages/Feed.vue') },
    { path: '/settings', component: () => import('./pages/Settings.vue') },
  ],
});
