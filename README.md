# SUGARGOO PC

Vue 3 + Vite + Vue Router + Pinia + Tailwind CSS v4，使用 JavaScript 开发。

首页根据 Figma `Zo02OJe1HqK8j0UACkVbuR` 的 `3:4440` 节点实现，桌面设计尺寸为 1440 × 5481。首页展示数据由本地 Node.js API 读取 JSON 文件返回，不需要数据库。

## 启动

```bash
nvm use
npm ci
npm run dev
```

`npm run dev` 同时启动前端和本地 API：

- 前端默认 `http://localhost:5173`，端口被占用时自动使用下一个端口，以终端输出为准。
- API 默认 `http://127.0.0.1:3001`，通过 Vite 的 `/api` 代理调用，无需配置跨域。
- 按 `Ctrl+C` 同时关闭本次启动的两个服务。

如需修改站点名称，将 `.env.example` 复制为 `.env.local` 后调整 `VITE_APP_NAME`。

## 常用命令

| 命令                   | 用途               |
| ---------------------- | ------------------ |
| `npm run dev`          | 同时启动前端与 API |
| `npm run dev:web`      | 单独启动前端       |
| `npm run dev:api`      | 单独启动 API       |
| `npm run build`        | 生产构建           |
| `npm run preview`      | 预览构建结果       |
| `npm run lint`         | 检查代码规范       |
| `npm run lint:fix`     | 自动修复规范问题   |
| `npm run format`       | 格式化代码         |
| `npm run format:check` | 检查格式           |

## 目录

```text
src/
├── assets/styles/main.css   # 全局样式
├── components/home/         # 栏目标题、商品卡片、原始图标
├── layouts/DefaultLayout.vue # 路由视图容器
├── router/index.js          # 路由配置
├── api/home.js              # 首页接口调用
├── utils/assets.js          # 本地素材路径
├── utils/request.js         # Axios 实例、请求与响应拦截器
├── views/
│   ├── home/HomeView.vue    # 首页布局与本地演示交互
│   └── NotFoundView.vue     # 404 页面
├── App.vue
└── main.js                  # 注册 Vue Router 和 Pinia
```

后续页面按业务放到 `views/` 子目录；出现复用组件时再创建 `components/`，需要共享状态时再创建 `stores/`。登录权限和测试工具在实际业务需要时加入。

## 本地接口服务

服务使用 Node.js 内置 HTTP 模块，没有新增依赖、数据库或 ORM。

```text
server/
├── index.js          # HTTP 接口服务
└── data/home.json    # 首页数据，修改后刷新页面即可生效
scripts/dev.js        # 同时启动前端与 API
```

| 方法 | 接口                     | 用途                                   |
| ---- | ------------------------ | -------------------------------------- |
| GET  | `/api/home`              | 全部首页数据：商品、活动、服务、FAQ 等 |
| GET  | `/api/products`          | 商品列表，可传 `?category=服饰`        |
| POST | `/api/shipping/estimate` | mock 运费估算                          |

运费接口接收 JSON，例如：

```json
{ "destination": "美国", "goodsType": "普通服饰", "weight": 1000 }
```

前端接口集中在 `src/api/home.js`，继续复用 Axios 请求和响应拦截器。数据加载失败时首页显示提示并支持重新加载。

接口端口被占用时，可使用 `API_PORT=3002 npm run dev` 同时调整 API 和前端代理端口。生产构建仅生成前端文件；本地预览需先运行 `npm run dev:api`，再运行 `npm run preview`。此服务用于本地开发演示。

## 首页说明

- 图片与 SVG 图标保存在 `public/images/figma-home/`，使用设计稿原始素材；SVG 保留固有尺寸。
- Noto Sans SC 与 Inter 字体保存在 `public/fonts/`，无需运行时访问外部字体服务。字体采用 SIL Open Font License，许可文件同目录保存。
- 支持商品分类筛选、收藏、商品展示弹窗、FAQ 展开、搜索入口和本地 mock 运费估算。
- 登录、仓库、活动及社区等入口提供静态演示提示；语言与币种仅按设计展示，暂未加入切换逻辑。
- 保持 JavaScript 和精简组件结构；没有新增运行时依赖。小屏布局随宽度调整，桌面端以 Figma 为准。

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

在 `.env.local` 中设置 `VITE_API_BASE_URL`；默认 `/api`，开发与预览模式已配置代理到本地 API 服务。默认超时为 15 秒，可在单次请求中用 `timeout` 覆盖。

请求拦截器保留统一处理请求头的入口，Token 在真实认证接口接入后追加。响应拦截器直接返回 `response.data`，保留后端业务数据结构；HTTP 错误、超时与网络失败统一设置 `error.message` 后继续抛出，业务页面负责捕获并展示。原始 `error.response`、`error.code` 等信息仍可读取，主动取消的请求保留取消语义。
