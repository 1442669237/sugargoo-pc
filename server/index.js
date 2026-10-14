import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { getLocaleData, resolveLanguage } from './locale.js'

const currenciesFile = new URL('./data/currencies.json', import.meta.url)

function json(response, status, data, language) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Content-Language': language,
    Vary: 'Accept-Language',
  })
  response.end(JSON.stringify(data))
}

async function readBody(request) {
  const chunks = []
  let bytes = 0
  for await (const chunk of request) {
    bytes += chunk.length
    if (bytes > 16384)
      throw Object.assign(new Error('PAYLOAD_TOO_LARGE'), {
        status: 413,
        errorCode: 'PAYLOAD_TOO_LARGE',
      })
    chunks.push(chunk)
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    throw Object.assign(new Error('INVALID_JSON'), { status: 400, errorCode: 'INVALID_JSON' })
  }
}

export async function startServer({ port = Number(process.env.API_PORT || 3001) } = {}) {
  const server = createServer(async (request, response) => {
    const language = resolveLanguage(request.headers['accept-language'])
    const locale = getLocaleData(language)
    const reply = (status, data) => json(response, status, data, language)
    const fail = (status, code) => reply(status, { code, message: locale.errors[code] })
    try {
      const url = new URL(request.url, 'http://localhost')
      if (url.pathname === '/api/system/sysConfigCurrency/queryNew') {
        if (request.method !== 'POST') {
          response.setHeader('Allow', 'POST')
          return fail(405, 'METHOD_POST_ONLY')
        }
        const body = await readBody(request)
        if (body?.front !== 1) return fail(400, 'INVALID_CURRENCY_QUERY')
        const data = JSON.parse(await readFile(currenciesFile, 'utf8'))
        return reply(200, data)
      }
      if (url.pathname === '/api/home' || url.pathname === '/api/products') {
        if (request.method !== 'GET') {
          response.setHeader('Allow', 'GET')
          return fail(405, 'METHOD_GET_ONLY')
        }
        // 每次读取本地文件，修改数据后刷新页面即可生效。
        const dataFile = new URL(`./data/home/${language}.json`, import.meta.url)
        const data = JSON.parse(await readFile(dataFile, 'utf8'))
        if (url.pathname === '/api/home') return reply(200, data)
        const category = url.searchParams.get('category')
        const products =
          !category || category === 'all'
            ? data.products
            : data.products.filter((product) => product.categoryCode === category)
        return reply(200, products)
      }
      if (url.pathname === '/api/shipping/estimate') {
        if (request.method !== 'POST') {
          response.setHeader('Allow', 'POST')
          return fail(405, 'METHOD_POST_ONLY')
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
          return fail(400, 'INVALID_SHIPPING_INPUT')
        }
        return reply(200, {
          destination: Object.hasOwn(locale.destinations, body.destination)
            ? locale.destinations[body.destination]
            : body.destination.trim(),
          goodsType: Object.hasOwn(locale.goodsTypes, body.goodsType)
            ? locale.goodsTypes[body.goodsType]
            : body.goodsType.trim(),
          weight,
          route: locale.route,
          currency: 'CNY',
          amount: 38 + Math.ceil(weight / 500) * 24,
          estimatedDays: '7–15',
          mock: true,
        })
      }
      fail(404, 'NOT_FOUND')
    } catch (error) {
      console.error('[local-api]', error.message)
      fail(error.status || 500, error.errorCode || 'INTERNAL_ERROR')
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
