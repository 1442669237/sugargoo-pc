import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig(({ command, mode }) => ({
  plugins: [
    vue(),
    tailwindcss(),
    ...(command === 'serve' && mode === 'development' ? [vueDevTools()] : []),
  ],
  server: { proxy: { '/api': `http://127.0.0.1:${process.env.API_PORT || 3001}` } },
  preview: { proxy: { '/api': `http://127.0.0.1:${process.env.API_PORT || 3001}` } },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
}))
