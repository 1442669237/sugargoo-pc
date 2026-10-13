<script setup>
import { RouterLink, RouterView } from 'vue-router'

const appName = import.meta.env.VITE_APP_NAME || 'SUGARGOO'
const year = new Date().getFullYear()
</script>

<template>
  <div class="site-layout">
    <a class="skip-link" href="#main-content">跳转到主要内容</a>
    <header class="site-header">
      <div class="page-container header-inner">
        <RouterLink class="brand" :to="{ name: 'home' }">{{ appName }}</RouterLink>
        <nav aria-label="主导航">
          <RouterLink :to="{ name: 'home' }">首页</RouterLink>
        </nav>
      </div>
    </header>
    <main id="main-content" class="page-container site-main" tabindex="-1">
      <RouterView />
    </main>
    <footer class="site-footer">
      <div class="page-container">© {{ year }} {{ appName }}</div>
    </footer>
  </div>
</template>

<style scoped>
.site-layout {
  display: flex;
  min-height: 100dvh;
  flex-direction: column;
}
.site-header {
  border-bottom: 1px solid var(--color-border);
  background: #fff;
}
.header-inner {
  display: flex;
  min-height: 72px;
  align-items: center;
  gap: 32px;
  flex-wrap: wrap;
  padding-block: 16px;
}
.brand {
  color: var(--color-primary);
  font-size: 22px;
  font-weight: 800;
  overflow-wrap: anywhere;
}
nav a.router-link-exact-active {
  color: var(--color-primary);
}
.site-main {
  flex: 1;
  padding-block: 40px;
}
.site-main:focus {
  outline: none;
}
.site-footer {
  padding-block: 24px;
  border-top: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  font-size: 12px;
}
</style>
