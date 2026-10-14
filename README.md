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

| 命令                   | 用途                     |
| ---------------------- | ------------------------ |
| `npm run dev`          | 同时启动前端与 API       |
| `npm run dev:web`      | 单独启动前端             |
| `npm run dev:api`      | 单独启动 API             |
| `npm run build`        | 生产构建                 |
| `npm test`             | 语言、币种及本地接口测试 |
| `npm run preview`      | 预览构建结果             |
| `npm run lint`         | 检查代码规范             |
| `npm run lint:fix`     | 自动修复规范问题         |
| `npm run format`       | 格式化代码               |
| `npm run format:check` | 检查格式                 |

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
├── locale.js         # 独立的服务端语言解析
└── data/
    ├── locales.json    # 运费字段和错误消息
    ├── home/           # zh-CN、en-US、es-ES 三语业务数据
    └── currencies.json # 币种与汇率快照
scripts/dev.js        # 同时启动前端与 API
```

| 方法 | 接口                                     | 用途                                   |
| ---- | ---------------------------------------- | -------------------------------------- |
| GET  | `/api/home`                              | 全部首页数据：商品、活动、服务、FAQ 等 |
| GET  | `/api/products`                          | 商品列表，可传 `?category=clothing`    |
| POST | `/api/shipping/estimate`                 | mock 运费估算                          |
| POST | `/api/system/sysConfigCurrency/queryNew` | 币种与汇率，接收 `{"front":1}`         |

运费接口接收 JSON，例如：

```json
{ "destination": "US", "goodsType": "clothing", "weight": 1000 }
```

前端接口集中在 `src/api/home.js`，继续复用 Axios 请求和响应拦截器。数据加载失败时首页显示提示并支持重新加载。

接口端口被占用时，可使用 `API_PORT=3002 npm run dev` 同时调整 API 和前端代理端口。生产构建仅生成前端文件；本地预览需先运行 `npm run dev:api`，再运行 `npm run preview`。此服务用于本地开发演示。

## 首页说明

- 图片与 SVG 图标保存在 `public/images/figma-home/`，使用设计稿原始素材；SVG 保留固有尺寸。
- Noto Sans SC 与 Inter 字体保存在 `public/fonts/`，无需运行时访问外部字体服务。字体采用 SIL Open Font License，许可文件同目录保存。
- 支持商品分类筛选、收藏、商品展示弹窗、FAQ 展开、搜索入口和本地 mock 运费估算。
- 登录、仓库、活动及社区等入口提供演示提示；页头、页脚支持切换语言和币种。
- 使用 JavaScript；前端国际化使用 Vue I18n。小屏布局随宽度调整，桌面端以 Figma 为准。

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

请求拦截器统一设置当前语言的 `Accept-Language`；Token 在真实认证接口接入后追加。响应拦截器直接返回 `response.data`，保留后端业务数据结构；HTTP 错误、超时与网络失败统一设置 `error.message` 后继续抛出，业务页面负责捕获并展示。原始 `error.response`、`error.code` 等信息仍可读取，主动取消的请求保留取消语义。

## 多语言与多币种

支持 `zh-CN`、`en-US`、`es-ES`。前端使用 Vue I18n，三个语言资源独立放在 `src/i18n/locales/`，使用 `common.confirm`、`shipping.weightLabel` 等语义 key。资源只包含前端管理的界面文案。商品、活动、FAQ、分类、线路等业务文本由后端维护在 `server/data/home/{language}.json`，前端直接展示接口字段，不传入 `t()`。首次访问由浏览器请求 `https://api.country.is/` 识别访问者 IP 国家：`CN/HK/MO/TW` 使用中文，西语国家和地区使用西班牙语，其余使用英语。查询超时为 3 秒，失败时按浏览器语言兜底，再回退英语。语言初始化完成后才发送业务请求。

语言保存在 `sugargoo.language`。手动选择不同语言先缓存，再刷新整页；再次选择当前语言不刷新。请求头、页面标题、HTML `lang`、表单及错误提示均使用当前语言。本地首页与商品接口的分类使用稳定的 `code/categoryCode`，页脚链接使用 `label/target`，避免翻译影响筛选和跳转；运费表单提交国家和商品类型代码，接口返回对应语言文本。

币种默认 USD，选择保存在 `sugargoo.currency`，与语言独立。每次页面启动调用一次本地币种接口，支持的币种和汇率以 `server/data/currencies.json` 为准。该文件是提供的接口响应快照，更新汇率需要更新此 JSON；运行时不依赖 `src/utils/data.json`，也不调用线上币种接口。`isAutoUpdate` 是快照字段，不代表本地服务会自动更新汇率。

所有原始金额按人民币“元”保存。显示金额为人民币金额乘 `rate`，使用响应的 `symbol`，统一保留两位小数；`conversionRate` 和 `decimalPlaces` 不参与金额展示。切换币种只更新响应式展示，不刷新、不请求接口，也不清空表单。运费查询结果在弹窗和表单下方展示，可直接验证切换币种后的金额变化。商品数据尚无价格字段，因此没有添加虚构价格。

无效缓存币种优先回退 USD；汇率加载失败时显示人民币并提供重试按钮，同时保留用户的币种偏好，以便重试成功后恢复。语言和币种优先保存在 localStorage，受限时尝试 sessionStorage；两者均不可用时只能保持当前页面的选择。

`npm test` 使用 Node 原生测试，验证语言识别和缓存、请求头、本地三语响应、币种接口、换算、无效数据及失败重试。浏览器联调还应检查手动切换语言的刷新次数、币种切换期间的请求数量，以及桌面和小屏的布局与交互。

### 前后端多语言职责

本地服务独立读取 `Accept-Language`，支持带地区的语言标签和 `q` 权重；缺省或不支持的语言回退 `en-US`。响应携带 `Content-Language` 和 `Vary: Accept-Language`。服务端没有对 `src/`、Vue I18n 或前端语言资源的依赖，运行仅需要 `server/` 下的文件和 Node.js。

修改 `server/data/home/es-ES.json` 的商品名称后，刷新页面即可获得新内容，无需构建前端。各语言版本通过产品 ID、分类代码及内容 ID 对齐，不通过中文文案查找翻译。业务字段包含花括号、类似 `common.confirm` 的文本时，前端按原文展示，使用 Vue 文本插值转义 HTML。

运费结果中的国家、商品类型、线路名称和服务端错误文案维护在 `server/data/locales.json`，以国家代码、商品类型代码和稳定错误代码索引。错误响应为 `{ code, message }`，前端保留服务端的 `message`；无服务端消息的 HTTP 错误、网络错误和超时使用前端本地化兜底。ID、代码、金额及请求参数不参与文本翻译。

前端语言缺失时由 Vue I18n 回退英语。新增界面文案时应给三个语言文件添加同一个语义 key，并保持插值参数一致；测试检查资源一致性。接口测试用独立预期值验证三语数据，同时在不含前端目录的临时环境中验证服务可独立运行及业务数据修改即时生效。
