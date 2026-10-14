import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { normalizeLanguage, translate } from '../src/i18n/index.js'

const dataFile = new URL('./data/home.json', import.meta.url)
const currenciesFile = new URL('./data/currencies.json', import.meta.url)

function localize(value, language) {
  if (typeof value === 'string') return translate(value, language)
  if (Array.isArray(value)) return value.map((item) => localize(item, language))
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, localize(item, language)]),
    )
  }
  return value
}

function json(response, status, data, language) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  response.end(JSON.stringify(language ? localize(data, language) : data))
}

async function readBody(request) {
  const chunks = []
  let bytes = 0
  for await (const chunk of request) {
    bytes += chunk.length
    if (bytes > 16384) throw Object.assign(new Error('请求体不能超过 16KB'), { status: 413 })
    chunks.push(chunk)
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw Object.assign(new Error('请求体必须为有效的 JSON'), { status: 400 })
  }
}

export async function startServer({ port = Number(process.env.API_PORT || 3001) } = {}) {
  const server = createServer(async (request, response) => {
    const language = normalizeLanguage(request.headers['accept-language']) || 'en-US'
    const reply = (status, data) => json(response, status, data, language)
    try {
      const url = new URL(request.url, 'http://localhost')
      if (url.pathname === '/api/system/sysConfigCurrency/queryNew') {
        if (request.method !== 'POST') {
          response.setHeader('Allow', 'POST')
          return reply(405, { message: '此接口仅支持 POST' })
        }
        const body = await readBody(request)
        if (body?.front !== 1) return reply(400, { message: '币种查询参数有误' })
        const data = JSON.parse(await readFile(currenciesFile, 'utf8'))
        return json(response, 200, data)
      }
      if (url.pathname === '/api/home' || url.pathname === '/api/products') {
        if (request.method !== 'GET') {
          response.setHeader('Allow', 'GET')
          return reply(405, { message: '此接口仅支持 GET' })
        }
        // 每次读取本地文件，修改数据后刷新页面即可生效。
        const data = JSON.parse(await readFile(dataFile, 'utf8'))
        if (url.pathname === '/api/home') return reply(200, data)
        const category = url.searchParams.get('category')
        const products =
          !category || category === 'all' || category === '全部推荐'
            ? data.products
            : data.products.filter(
                (product) => product.categoryCode === category || product.category === category,
              )
        return reply(200, products)
      }
      if (url.pathname === '/api/shipping/estimate') {
        if (request.method !== 'POST') {
          response.setHeader('Allow', 'POST')
          return reply(405, { message: '此接口仅支持 POST' })
        }
        const body = await readBody(request)
        const weight = Number(body?.weight)
        if (
          !body ||
          typeof body.destination !== 'string' ||
          !body.destination.trim() ||
          typeof body.goodsType !== 'string' ||
          !body.goodsType.trim() ||
          !Number.isFinite(weight) ||
          weight <= 0 ||
          weight > 1000000
        ) {
          return reply(400, {
            message: '请选择目的地、商品类型，重量须大于 0 且不超过 1000000g',
          })
        }
        const destinations = { US: '美国', GB: '英国', CA: '加拿大', AU: '澳大利亚', JP: '日本' }
        const goodsTypes = { clothing: '普通服饰', shoes: '鞋履箱包', household: '生活用品' }
        return reply(200, {
          destination: destinations[body.destination] || body.destination.trim(),
          goodsType: goodsTypes[body.goodsType] || body.goodsType.trim(),
          weight,
          route: '专线运输',
          currency: 'CNY',
          amount: 38 + Math.ceil(weight / 500) * 24,
          estimatedDays: '7–15',
          mock: true,
        })
      }
      reply(404, { message: '接口不存在' })
    } catch (error) {
      console.error('[local-api]', error.message)
      reply(error.status || 500, {
        message: error.status
          ? error.message
          : '本地服务读取数据失败，请检查 server/data/ 下的数据文件',
      })
    }
  })
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, '127.0.0.1', resolve)
  })
  console.log(`本地 API：http://127.0.0.1:${server.address().port}/api/home`)
  return server
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  startServer().catch((error) => {
    console.error(`本地 API 启动失败：${error.message}`)
    process.exitCode = 1
  })
}
