<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <section class="not-found">
    <h1>404</h1>
    <p>页面不存在或已被移除</p>
    <RouterLink :to="{ name: 'home' }">返回首页</RouterLink>
  </section>
</template>

<style scoped>
.not-found {
  display: grid;
  min-height: 55vh;
  align-content: center;
  justify-items: center;
  gap: 16px;
}
h1 {
  font-size: 64px;
}
p {
  color: var(--color-text-secondary);
}
a {
  color: var(--color-primary);
}
</style>
