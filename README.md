# SUGARGOO PC

Vue 3 + Vite + Vue Router + Pinia + Tailwind CSS v4，使用 JavaScript 开发。

已清理 Vue 默认示例，当前保留基础布局、空白首页和 404 页面。

## 启动

```bash
nvm use
npm ci
npm run dev
```

开发服务默认地址为 `http://localhost:5173`。如需修改站点名称，将 `.env.example` 复制为 `.env.local` 后调整 `VITE_APP_NAME`。

## 常用命令

| 命令                   | 用途             |
| ---------------------- | ---------------- |
| `npm run dev`          | 本地开发         |
| `npm run build`        | 生产构建         |
| `npm run preview`      | 预览构建结果     |
| `npm run lint`         | 检查代码规范     |
| `npm run lint:fix`     | 自动修复规范问题 |
| `npm run format`       | 格式化代码       |
| `npm run format:check` | 检查格式         |

## 目录

```text
src/
├── assets/styles/main.css   # 全局样式
├── layouts/DefaultLayout.vue # 站点公共布局
├── router/index.js          # 路由配置
├── utils/request.js         # Axios 实例、请求与响应拦截器
├── views/
│   ├── home/HomeView.vue    # 首页，业务内容从这里开始
│   └── NotFoundView.vue     # 404 页面
├── App.vue
└── main.js                  # 注册 Vue Router 和 Pinia
```

后续页面按业务放到 `views/` 子目录；出现复用组件时再创建 `components/`，需要共享状态时再创建 `stores/`。登录权限和测试工具在实际业务需要时加入。

## 接口请求

直接使用 `src/utils/request.js` 导出的常用请求方法：

```js
import { get, post, put, patch, del, head, options } from '@/utils/request'

const result = await get('/orders', { page: 1 })
await post('/orders', { productId: '1', quantity: 2 })
await put('/orders/1', { quantity: 3 })
await patch('/orders/1', { remark: '备注' })
await del('/orders/1')
await head('/orders/1')
await options('/orders')
```

`get`、`del`、`head`、`options` 的第二个参数为 URL 查询参数；`post`、`put`、`patch` 的第二个参数为请求体。第三个参数统一接收 Axios 配置，例如请求头、超时和取消信号：

```js
const controller = new AbortController()
await get('/orders', { page: 1 }, { timeout: 10000, signal: controller.signal })

const form = new FormData()
form.append('file', file)
await post('/uploads', form)
```

全部方法共用已有请求、响应拦截器，成功直接得到响应数据。默认导出的 Axios 实例也继续可用，用于自定义请求；DELETE 如果需要请求体，可通过第三个参数的 `data` 传入。

在 `.env.local` 中设置 `VITE_API_BASE_URL`；默认 `/api`，需要后端或开发代理提供对应服务。默认超时为 15 秒，可在单次请求中用 `timeout` 覆盖。

请求拦截器保留统一处理请求头的入口，Token 在真实认证接口接入后追加。响应拦截器直接返回 `response.data`，保留后端业务数据结构；HTTP 错误、超时与网络失败统一设置 `error.message` 后继续抛出，业务页面负责捕获并展示。原始 `error.response`、`error.code` 等信息仍可读取，主动取消的请求保留取消语义。
