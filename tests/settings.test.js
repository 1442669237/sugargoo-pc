import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { readFile } from 'node:fs/promises'
import { createPinia } from 'pinia'
import axios from 'axios'
import { startServer } from '../server/index.js'
import {
  changeLanguage,
  getLanguage,
  initializeLanguage,
  languageForCountry,
  languageKey,
  i18n,
  t,
} from '../src/i18n/index.js'
import { cny, currencyKey, formatPrice, validCurrencies } from '../src/utils/currency.js'
import request from '../src/utils/request.js'
import { useSettingsStore } from '../src/stores/settings.js'

const values = new Map()
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  },
})
Object.defineProperty(globalThis, 'sessionStorage', {
  configurable: true,
  value: globalThis.localStorage,
})
const server = await startServer({ port: 0 })
const base = `http://127.0.0.1:${server.address().port}/api`
request.defaults.baseURL = base
after(() => server.close())
const fixture = JSON.parse(
  await readFile(new URL('../server/data/currencies.json', import.meta.url)),
)
const countryResponse = (country) => ({ ok: true, json: async () => ({ country }) })

test('first visit maps IP countries, falls back to browser language and caches the result', async () => {
  for (const country of ['CN', 'HK', 'MO', 'TW']) assert.equal(languageForCountry(country), 'zh-CN')
  for (const country of ['ES', 'MX', 'AR']) assert.equal(languageForCountry(country), 'es-ES')
  assert.equal(languageForCountry('JP'), 'en-US')
  assert.equal(
    await initializeLanguage({ cached: null, lookup: async () => countryResponse('ES') }),
    'es-ES',
  )
  assert.equal(values.get(languageKey), 'es-ES')
  const lookup = async () => {
    throw new DOMException('Timed out', 'TimeoutError')
  }
  assert.equal(
    await initializeLanguage({ cached: 'invalid', browserLanguages: ['fr-FR', 'zh-TW'], lookup }),
    'zh-CN',
  )
  assert.equal(
    await initializeLanguage({ cached: null, browserLanguages: ['fr'], lookup }),
    'en-US',
  )
  assert.equal(
    await initializeLanguage({
      cached: null,
      browserLanguages: ['es-MX'],
      lookup: async () => countryResponse(null),
    }),
    'es-ES',
  )
})

test('cached language skips lookup; changing language saves before a single reload and retains currency', async () => {
  await initializeLanguage({
    cached: 'en-US',
    lookup: () => assert.fail('cached visits must skip IP lookup'),
  })
  values.set(currencyKey, 'EUR')
  let reloads = 0
  const reload = () => {
    assert.equal(values.get(languageKey), 'zh-CN')
    reloads++
  }
  changeLanguage('en-US', reload)
  changeLanguage('invalid', reload)
  changeLanguage('zh-CN', reload)
  changeLanguage('zh-CN', reload)
  assert.equal(reloads, 1)
  assert.equal(values.get(currencyKey), 'EUR')
})

test('local currencies retain the supplied envelope and reject invalid calls', async () => {
  const response = await fetch(base + '/system/sysConfigCurrency/queryNew', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"front":1}',
  })
  assert.deepEqual(await response.json(), fixture)
  assert.equal(fixture.data.length, 26)
  assert.equal((await fetch(base + '/system/sysConfigCurrency/queryNew')).status, 405)
  assert.equal(
    (
      await fetch(base + '/system/sysConfigCurrency/queryNew', {
        method: 'POST',
        body: '{"front":0}',
      })
    ).status,
    400,
  )
  assert.equal(
    (await fetch(base + '/system/sysConfigCurrency/queryNew', { method: 'POST', body: '{' }))
      .status,
    400,
  )
})

test('frontend locale resources have identical semantic keys and interpolation parameters', async () => {
  function flatten(value, prefix = '') {
    return Object.fromEntries(
      Object.entries(value).flatMap(([key, item]) => {
        const path = prefix ? `${prefix}.${key}` : key
        return typeof item === 'string' ? [[path, item]] : Object.entries(flatten(item, path))
      }),
    )
  }
  const resources = await Promise.all(
    ['zh-CN', 'en-US', 'es-ES'].map(async (language) =>
      flatten(
        JSON.parse(
          await readFile(new URL(`../src/i18n/locales/${language}.json`, import.meta.url)),
        ),
      ),
    ),
  )
  const keys = Object.keys(resources[0]).sort()
  for (const resource of resources) {
    assert.deepEqual(Object.keys(resource).sort(), keys)
    for (const key of keys) {
      assert.match(key, /^[a-zA-Z]+\.[a-zA-Z]+$/)
      assert.deepEqual(
        [...resource[key].matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort(),
        [...resources[0][key].matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort(),
        key,
      )
    }
  }
  await initializeLanguage({ cached: 'es-ES' })
  assert.equal(t('common.confirm'), 'Entendido')
  assert.equal(
    t('products.demoDescription', { description: 'Producto {sku} @ tienda' }),
    'Producto {sku} @ tienda. Este producto es de demostración y aún no se puede comprar.',
  )
  const spanish = i18n.global.getLocaleMessage('es-ES')
  try {
    i18n.global.setLocaleMessage('es-ES', {
      ...spanish,
      common: { ...spanish.common, confirm: undefined },
    })
    assert.equal(t('common.confirm'), 'Got it')
  } finally {
    i18n.global.setLocaleMessage('es-ES', spanish)
  }
})

test('server business error messages pass through unchanged; client network errors are localized', async () => {
  await initializeLanguage({ cached: 'es-ES' })
  const adapter = request.defaults.adapter
  try {
    request.defaults.adapter = async (config) => {
      throw new axios.AxiosError(
        'Request failed',
        'ERR_BAD_REQUEST',
        config,
        {},
        { status: 400, data: { code: 'TEST_ERROR', message: 'common.confirm {sku}' } },
      )
    }
    await assert.rejects(
      request.get('/test'),
      (error) =>
        error.message === 'common.confirm {sku}' && error.response.data.code === 'TEST_ERROR',
    )
    request.defaults.adapter = async (config) => {
      throw new axios.AxiosError('Network error', 'ERR_NETWORK', config, {})
    }
    await assert.rejects(request.get('/test'), { message: 'Error de conexión. Comprueba tu red' })
  } finally {
    request.defaults.adapter = adapter
  }
})

test('prices use rate, preserve the original yuan amount, and handle missing or invalid values', () => {
  const usd = fixture.data.find((item) => item.code === 'USD')
  const eur = fixture.data.find((item) => item.code === 'EUR')
  const amount = 100
  assert.equal(formatPrice(amount, usd), '$14.95')
  assert.equal(formatPrice(amount, eur), '€13.04')
  assert.equal(formatPrice(amount, cny), '￥100.00')
  assert.equal(amount, 100)
  assert.equal(formatPrice(0, usd), '$0.00')
  assert.equal(formatPrice('100', usd), '$14.95')
  for (const value of [null, undefined, '', 'invalid', NaN, Infinity, {}, true])
    assert.equal(formatPrice(value, usd), '—')
  assert.equal(formatPrice(100, { ...usd, rate: '0' }), '—')
  assert.deepEqual(
    validCurrencies([
      null,
      { ...usd, rate: '-1' },
      { ...usd, status: 0 },
      { ...usd, front: 0 },
      usd,
    ]),
    [usd],
  )
})

test('currency initialization sends the selected language; currency switching performs no requests', async () => {
  values.delete(currencyKey)
  await initializeLanguage({ cached: 'es-ES' })
  let calls = 0
  const originalAdapter = request.defaults.adapter
  const adapter = axios.getAdapter(originalAdapter)
  request.defaults.adapter = (config) => {
    calls++
    assert.equal(config.headers['Accept-Language'], 'es-ES')
    return adapter(config)
  }
  try {
    const store = useSettingsStore(createPinia())
    await store.loadCurrencies()
    assert.equal(store.currencyCode, 'USD')
    assert.equal(store.price(100), '$14.95')
    store.changeCurrency('EUR')
    assert.equal(store.price(100), '€13.04')
    assert.equal(values.get(currencyKey), 'EUR')
    store.changeCurrency('CNY')
    assert.equal(store.price(100), '￥100.00')
    store.changeCurrency('invalid')
    await store.loadCurrencies()
    assert.equal(calls, 1)
    const restored = useSettingsStore(createPinia())
    await restored.loadCurrencies()
    assert.equal(restored.currencyCode, 'CNY')
    values.set(currencyKey, 'invalid')
    const invalidCache = useSettingsStore(createPinia())
    await invalidCache.loadCurrencies()
    assert.equal(invalidCache.currencyCode, 'USD')
  } finally {
    request.defaults.adapter = originalAdapter
  }
})

test('failed exchange rates display CNY, keep the preference and allow an explicit retry', async () => {
  values.set(currencyKey, 'EUR')
  const adapter = request.defaults.adapter
  request.defaults.adapter = async () => {
    throw new Error('Offline')
  }
  const store = useSettingsStore(createPinia())
  try {
    await store.loadCurrencies()
    assert.equal(store.currencyCode, 'CNY')
    assert.equal(store.price(100), '￥100.00')
    assert.ok(store.error)
    assert.equal(values.get(currencyKey), 'EUR')
  } finally {
    request.defaults.adapter = adapter
  }
  await store.loadCurrencies(true)
  assert.equal(store.error, '')
  assert.equal(store.currencyCode, 'EUR')
  assert.equal(getLanguage(), 'es-ES')
})
