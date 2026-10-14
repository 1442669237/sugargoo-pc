import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { post } from '../utils/request.js'
import { cny, currencyKey, formatPrice, validCurrencies } from '../utils/currency.js'
import { getLanguage, readPreference, savePreference, t } from '../i18n/index.js'

export const useSettingsStore = defineStore('settings', () => {
  const language = ref(getLanguage())
  const currencies = ref([cny])
  const currencyCode = ref('CNY')
  const loading = ref(false)
  const error = ref('')
  let requested = false
  const currency = computed(
    () => currencies.value.find((item) => item.code === currencyCode.value) || cny,
  )

  async function loadCurrencies(retry = false) {
    if (loading.value || (requested && !retry)) return
    requested = true
    loading.value = true
    error.value = ''
    try {
      const result = await post('/system/sysConfigCurrency/queryNew', { front: 1 })
      const available = validCurrencies(result.data)
      if (result.code !== 200 || !available.length) throw new Error('Invalid currencies')
      currencies.value = available
      const preferred = readPreference(currencyKey) || 'USD'
      currencyCode.value = available.some((item) => item.code === preferred)
        ? preferred
        : available.some((item) => item.code === 'USD')
          ? 'USD'
          : 'CNY'
      if (!available.some((item) => item.code === currencyCode.value)) currencies.value.push(cny)
      savePreference(currencyKey, currencyCode.value)
    } catch {
      currencies.value = [cny]
      currencyCode.value = 'CNY'
      error.value = t('settings.ratesUnavailable')
    } finally {
      loading.value = false
    }
  }

  function changeCurrency(code) {
    if (!currencies.value.some((item) => item.code === code)) return
    currencyCode.value = code
    savePreference(currencyKey, code)
  }

  return {
    language,
    currencies,
    currencyCode,
    currency,
    loading,
    error,
    loadCurrencies,
    changeCurrency,
    price: (amount) => formatPrice(amount, currency.value),
  }
})
