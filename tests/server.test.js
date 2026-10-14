import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { startServer } from '../server/index.js'
import { resolveLanguage } from '../server/locale.js'

const server = await startServer({ port: 0 })
const base = `http://127.0.0.1:${server.address().port}/api`
after(() => server.close())

// Expectations deliberately do not come from either implementation's language resources.
const expected = {
  'zh-CN': {
    product: '复古拼色休闲运动鞋',
    category: '全部推荐',
    destination: '美国',
    route: '专线运输',
    error: '请选择目的地、商品类型，重量须大于 0 且不超过 1000000g',
  },
  'en-US': {
    product: 'Retro color-block sneakers',
    category: 'All picks',
    destination: 'United States',
    route: 'Dedicated shipping',
    error: 'Select a destination and item type. Weight must be greater than 0 and at most 1000000g',
  },
  'es-ES': {
    product: 'Zapatillas retro multicolor',
    category: 'Todos',
    destination: 'Estados Unidos',
    route: 'Envío dedicado',
    error:
      'Selecciona destino y tipo de producto. El peso debe ser mayor que 0 y no superar 1000000g',
  },
}

test('server negotiates supported languages by quality and falls back to English', () => {
  for (const [header, language] of [
    ['', 'en-US'],
    ['fr-FR', 'en-US'],
    ['ZH-cn', 'zh-CN'],
    ['es-MX', 'es-ES'],
    ['en;q=0.5, es;q=0.9', 'es-ES'],
    ['es;q=0, zh;q=0.8', 'zh-CN'],
    ['es;q=invalid', 'en-US'],
    ['fr;q=1, zh-TW;q=0.8, en;q=0.7', 'zh-CN'],
  ])
    assert.equal(resolveLanguage(header), language)
})

test('API owns three-language business content, metadata and stable identifiers', async () => {
  let identifiers
  for (const [language, text] of Object.entries(expected)) {
    const headers = { 'Accept-Language': language }
    const response = await fetch(base + '/home', { headers })
    assert.equal(response.headers.get('content-language'), language)
    assert.equal(response.headers.get('vary'), 'Accept-Language')
    const home = await response.json()
    assert.equal(home.products[0].name, text.product)
    assert.equal(home.categories[0].label, text.category)
    assert.equal(home.products[0].categoryCode, 'shoes')
    assert.equal(home.footerGroups[0].links[0].target, '#process')
    const ids = Object.fromEntries(
      Object.entries(home)
        .filter(([key]) => key !== 'assurances')
        .map(([key, rows]) => [key, rows.map((row) => row.id ?? row.code)]),
    )
    for (const rows of Object.values(ids)) assert.equal(new Set(rows).size, rows.length)
    identifiers ??= ids
    assert.deepEqual(ids, identifiers)
    const products = await (await fetch(base + '/products?category=shoes', { headers })).json()
    assert.equal(products.length, 2)
    assert.equal(products[0].name, text.product)
    const estimate = await (
      await fetch(base + '/shipping/estimate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ destination: 'US', goodsType: 'clothing', weight: 1000 }),
      })
    ).json()
    assert.equal(estimate.amount, 86)
    assert.equal(estimate.currency, 'CNY')
    assert.equal(estimate.destination, text.destination)
    assert.equal(estimate.route, text.route)
    const error = await fetch(base + '/shipping/estimate', {
      method: 'POST',
      headers,
      body: '{"weight":0}',
    })
    assert.equal(error.status, 400)
    assert.equal(error.headers.get('content-language'), language)
    assert.deepEqual(await error.json(), { code: 'INVALID_SHIPPING_INPUT', message: text.error })
  }
  for (const headers of [{}, { 'Accept-Language': 'fr-FR' }]) {
    const response = await fetch(base + '/home', { headers })
    assert.equal(response.headers.get('content-language'), 'en-US')
    assert.equal((await response.json()).products[0].name, expected['en-US'].product)
  }
})

test('all local API failures contain stable codes and localized messages', async () => {
  for (const [path, init, status, code] of [
    ['/missing', {}, 404, 'NOT_FOUND'],
    ['/home', { method: 'POST' }, 405, 'METHOD_GET_ONLY'],
    ['/shipping/estimate', {}, 405, 'METHOD_POST_ONLY'],
    [
      '/system/sysConfigCurrency/queryNew',
      { method: 'POST', body: '{"front":0}' },
      400,
      'INVALID_CURRENCY_QUERY',
    ],
    ['/shipping/estimate', { method: 'POST', body: '{' }, 400, 'INVALID_JSON'],
    ['/shipping/estimate', { method: 'POST', body: 'x'.repeat(16385) }, 413, 'PAYLOAD_TOO_LARGE'],
  ]) {
    const response = await fetch(base + path, { ...init, headers: { 'Accept-Language': 'es-ES' } })
    assert.equal(response.status, status)
    const data = await response.json()
    assert.equal(data.code, code)
    assert.equal(typeof data.message, 'string')
    assert.ok(data.message.length)
    assert.ok(!/[\u3400-\u9fff]/.test(data.message))
  }
})

test('server runs without frontend files; backend edits are immediately reflected without a frontend build', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'sugargoo-server-'))
  try {
    await cp(new URL('../server/', import.meta.url), join(directory, 'server'), { recursive: true })
    // There is no src or node_modules in this isolated service.
    await writeFile(join(directory, 'package.json'), JSON.stringify({ type: 'module' }))
    const module = pathToFileURL(join(directory, 'server/index.js')).href
    const dataFile = pathToFileURL(join(directory, 'server/data/home/es-ES.json')).href
    const script = `
      import assert from 'node:assert/strict'
      import { readFile, writeFile } from 'node:fs/promises'
      import { startServer } from ${JSON.stringify(module)}
      const server = await startServer({ port: 0 })
      const url = 'http://127.0.0.1:' + server.address().port + '/api/home'
      const headers = { 'Accept-Language': 'es-ES' }
      try {
        const before = await (await fetch(url, { headers })).json()
        assert.equal(before.products[0].name, 'Zapatillas retro multicolor')
        const file = new URL(${JSON.stringify(dataFile)})
        const data = JSON.parse(await readFile(file, 'utf8'))
        data.products[0].name = 'common.confirm {sku}'
        await writeFile(file, JSON.stringify(data))
        const after = await (await fetch(url, { headers })).json()
        assert.equal(after.products[0].name, 'common.confirm {sku}')
      } finally { server.close() }
    `
    await promisify(execFile)(process.execPath, ['--input-type=module', '--eval', script], {
      timeout: 10000,
    })
    const source = await readFile(new URL('../server/index.js', import.meta.url), 'utf8')
    assert.ok(!source.includes('src/i18n'))
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
