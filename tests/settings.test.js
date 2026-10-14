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
  translate,
} from '../src/i18n/index.js'
import { messages } from '../src/i18n/messages.js'
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

test('three-language responses translate every demo text without changing identifiers or amounts', async () => {
  function collect(value) {
    if (typeof value === 'string') return /[\u3400-\u9fff]/.test(value) ? [value] : []
    return value && typeof value === 'object' ? Object.values(value).flatMap(collect) : []
  }
  const chinese = await (
    await fetch(base + '/home', { headers: { 'Accept-Language': 'zh-CN' } })
  ).json()
  for (const text of collect(chinese)) assert.ok(messages[text], 'Missing translation: ' + text)
  for (const language of ['zh-CN', 'en-US', 'es-ES']) {
    const headers = { 'Accept-Language': language }
    const home = await (await fetch(base + '/home', { headers })).json()
    assert.equal(home.categories[0].code, 'all')
    assert.equal(home.products[0].categoryCode, 'shoes')
    assert.equal(home.footerGroups[0].links[0].target, '#process')
    assert.equal(home.products[0].name, translate(chinese.products[0].name, language))
    if (language !== 'zh-CN') assert.deepEqual(collect(home), [])
    const products = await (await fetch(base + '/products?category=shoes', { headers })).json()
    assert.equal(products.length, 2)
    const estimate = await (
      await fetch(base + '/shipping/estimate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ destination: 'US', goodsType: 'clothing', weight: 1000 }),
      })
    ).json()
    assert.equal(estimate.currency, 'CNY')
    assert.equal(estimate.amount, 86)
    assert.equal(estimate.destination, translate('美国', language))
    assert.equal(estimate.route, translate('专线运输', language))
    const invalid = await fetch(base + '/shipping/estimate', {
      method: 'POST',
      headers,
      body: '{"weight":0}',
    })
    assert.equal(invalid.status, 400)
    if (language !== 'zh-CN') assert.deepEqual(collect(await invalid.json()), [])
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
