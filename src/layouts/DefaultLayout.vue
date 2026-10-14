<script setup>
import { t } from '@/i18n'
import { RouterView } from 'vue-router'
</script>

<template>
  <a class="skip-link" href="#main-content">{{ t('跳转到主要内容') }}</a>
  <RouterView />
</template>
