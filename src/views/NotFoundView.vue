<script setup>
import { t } from '@/i18n'
import { RouterLink } from 'vue-router'
</script>

<template>
  <section class="not-found">
    <h1>404</h1>
    <p>{{ t('notFound.description') }}</p>
    <RouterLink :to="{ name: 'home' }">{{ t('notFound.backHome') }}</RouterLink>
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
