<script setup>
import { image } from '@/utils/assets'

defineProps({ name: { type: String, required: true } })
</script>

<template>
  <!-- 保留 Figma 原始 SVG 的固有宽高。 -->
  <img class="design-icon" :src="image(name)" alt="" aria-hidden="true" />
</template>

<style scoped>
.design-icon {
  display: block;
  flex: none;
  max-width: none;
}
</style>
