<script setup>
import { languages, changeLanguage, t } from '@/i18n'
import { useSettingsStore } from '@/stores/settings'

const settings = useSettingsStore()
</script>

<template>
  <div class="locale-settings">
    <label>
      <span class="sr-only">{{ t('settings.language') }}</span>
      <select :value="settings.language" @change="changeLanguage($event.target.value)">
        <option v-for="item in languages" :key="item.code" :value="item.code">
          {{ item.label }}
        </option>
      </select>
    </label>
    <span aria-hidden="true">/</span>
    <label>
      <span class="sr-only">{{ t('settings.currency') }}</span>
      <select
        :value="settings.currencyCode"
        :disabled="settings.loading || !!settings.error"
        @change="settings.changeCurrency($event.target.value)"
      >
        <option v-for="item in settings.currencies" :key="item.code" :value="item.code">
          {{ item.code }}
        </option>
      </select>
    </label>
    <span v-if="settings.loading" class="currency-status" role="status">{{
      t('settings.loadingRates')
    }}</span>
    <span v-else-if="settings.error" class="currency-status" role="status">
      {{ settings.error }}
      <button type="button" @click="settings.loadCurrencies(true)">{{ t('common.retry') }}</button>
    </span>
  </div>
</template>

<style scoped>
.locale-settings {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  color: var(--color-text-secondary);
  font-size: 12px;
}
select {
  max-width: 100px;
  padding: 6px 2px;
  background: transparent;
  cursor: pointer;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
.currency-status {
  flex-basis: 100%;
  max-width: 240px;
}
.currency-status button {
  color: var(--color-primary);
  text-decoration: underline;
}
</style>
