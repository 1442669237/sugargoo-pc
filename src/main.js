import './assets/styles/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { initializeLanguage } from './i18n'
import { useSettingsStore } from './stores/settings'

async function bootstrap() {
  await initializeLanguage()
  const pinia = createPinia()
  const app = createApp(App).use(pinia).use(router)
  useSettingsStore(pinia).loadCurrencies()
  app.mount('#app')
}

bootstrap()
