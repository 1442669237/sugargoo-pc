import { createRouter, createWebHistory } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { t } from '@/i18n'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: DefaultLayout,
      children: [
        {
          path: '',
          name: 'home',
          component: () => import('@/views/home/HomeView.vue'),
          meta: { title: 'nav.home' },
        },
        {
          path: ':pathMatch(.*)*',
          name: 'not-found',
          component: () => import('@/views/NotFoundView.vue'),
          meta: { title: 'notFound.title' },
        },
      ],
    },
  ],
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { top: 0 }
  },
})

router.afterEach((to, from, failure) => {
  if (failure) return
  const appName = import.meta.env.VITE_APP_NAME || 'SUGARGOO'
  document.title = to.meta.title ? t(to.meta.title) + ' · ' + appName : appName
})

export default router
