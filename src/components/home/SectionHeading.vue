<script setup>
import DesignIcon from './DesignIcon.vue'

defineProps({
  eyebrow: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  action: { type: String, required: true },
  dark: Boolean,
})
defineEmits(['action'])
</script>

<template>
  <div class="section-heading" :class="{ 'heading-dark': dark }">
    <div class="heading-copy">
      <p class="eyebrow">{{ eyebrow }}</p>
      <h2>{{ title }}</h2>
      <p v-if="description" class="section-description">{{ description }}</p>
    </div>
    <button class="section-action" type="button" @click="$emit('action')">
      {{ action }}
      <DesignIcon :name="dark ? 'ee15a.svg' : '03c0d.svg'" />
    </button>
  </div>
</template>

<style scoped>
.section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
}
.heading-copy {
  display: flex;
  flex-direction: column;
  align-items: start;
  gap: 10px;
}
h2 {
  font-size: 34px;
  font-weight: 700;
  line-height: 44px;
}
.section-description {
  color: var(--color-text-secondary);
  font-size: 15px;
  line-height: 1.6;
}
.section-action {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 6px;
  font-size: 14px;
  white-space: nowrap;
}
.heading-dark {
  color: white;
}
.heading-dark .eyebrow,
.heading-dark .section-description {
  color: #c8cbc2;
}
@media (max-width: 900px) {
  .section-heading {
    align-items: start;
    flex-wrap: wrap;
    gap: 18px;
  }
  h2 {
    font-size: 28px;
  }
}
</style>
