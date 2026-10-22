# Vue3 + Vite + JavaScript 项目开发规范

> 版本：1.0 ｜ 适用：PC Web / H5 Web ｜ 技术栈：Vue 3、Vite、JavaScript
>
> 本文档是项目代码的约束依据。AI 编码时必须先读取本文件，再修改代码。

## 1. 核心原则

1. 新增 Vue 组件统一采用 **Composition API + `<script setup>`**，使用 JavaScript，不擅自改成 TypeScript。
2. **先遵循项目现状，再渐进优化**。已有技术方案（路由、请求库、UI 组件库、目录）优先复用，不为了完成小需求重建架构。
3. 页面负责组合和交互；API 负责接口声明；组件负责展示与可复用交互；Composables 负责可复用状态逻辑；Store 负责真正的跨页面共享状态。
4. 需求明确时做**最小范围修改**，不擅自变更既有功能、文案、样式、接口协议或依赖版本。
5. 每个异步业务流程必须考虑 Loading、成功、空数据、失败、重复操作。

## 2. 推荐目录结构

> 以下为新模块建议，旧项目不强制整体迁移；如果已有同等含义的目录，沿用项目现状。

```text
src/
├── api/                  # 按业务领域拆分接口（user.js / order.js）
├── assets/               # 由构建系统处理的静态资源
├── components/
│   ├── base/             # 通用基础组件 BaseButton.vue 等
│   └── business/         # 业务复用组件 OrderCard.vue 等
├── composables/          # usePagination.js / useOrderList.js
├── constants/            # 常量、状态映射
├── layouts/              # 页面布局（按需）
├── router/               # Vue Router、守卫
├── stores/               # Pinia
├── styles/               # variables.scss / global.scss 等
├── utils/                # request.js / format.js 等
├── views/                # 路由页面，按业务拆分
├── App.vue
└── main.js
```

**职责边界：**
- `api/order.js` 只声明订单相关请求，不包含页面提示、导航和弹窗操作。
- `utils/request.js` 统一处理 URL、鉴权、超时、HTTP 错误；根据**真实接口协议**处理业务错误。
- `views/order/` 处理订单页面数据与交互，不在页面中重复封装 HTTP 客户端。
- `composables/` 用于可复用逻辑；只在一个页面使用的简单状态优先留在页面内。
- `stores/` 不存单个按钮、单个弹窗的局部状态。

## 3. 命名规范

| 目标 | 规则 | 示例 |
| --- | --- | --- |
| Vue 组件 | PascalCase，多单词 | `OrderCard.vue`, `BaseDialog.vue` |
| 业务目录 | kebab-case | `order-center/` |
| 工具 / API 文件 | kebab-case | `date-utils.js`, `order-api.js` |
| 变量、函数 | camelCase | `orderList`, `fetchOrders()` |
| 布尔状态 | is / has / can 前缀 | `isLoading`, `hasMore` |
| 常量 | UPPER_SNAKE_CASE | `PAGE_SIZE` |
| 组合式逻辑 | use 前缀 | `useOrderList()` |
| Pinia Store | useXxxStore | `useUserStore()` |
| 事件回调 | handle 前缀 | `handleSubmit()` |
| CSS 类 | kebab-case，可选 BEM | `order-card__title` |

不使用 `data1`、`temp2`、`testFn` 等无业务含义的命名。命名表达业务，不因个人喜好批量重命名旧文件。

## 4. JavaScript 编码风格

- 两空格缩进、单引号、无分号、建议单行不超过 100 字符；与仓库现有 Prettier 配置冲突时以已配置的项目风格为准。
- 优先 `const`，重新赋值才用 `let`；禁止 `var`；使用 `===` / `!==`。
- 简单值用 `ref()`，对象/表单可用 `ref()` 或 `reactive()`，根据是否整体替换选择；使用 `computed()` 表示派生状态。
- 避免用 `watch()` 维护可以计算得到的状态；`watch()` 用于需要副作用的情况。
- 复杂条件使用提前返回；避免深层 `if` 嵌套和超长函数。
- 不滥用可选链掩盖必填字段缺失；不在业务代码中静默吞掉异常。
- 重要公共方法推荐写 JSDoc，注明参数、返回结果及业务边界。

```js
/** @param {{ id: string, name?: string }} user */
export const getDisplayName = (user) => user?.name || '未命名用户'
```

## 5. Vue 单文件组件规范

文件顺序统一：`<template>` → `<script setup>` → `<style scoped>`。

`<script setup>` 内建议按以下顺序：import → props/emits → store/composables → ref/reactive → computed → 方法 → watch → 生命周期。

```vue
<template>
  <article class="order-card">
    <h3 class="order-card__title">{{ title }}</h3>
    <button type="button" @click="handleView">查看详情</button>
  </article>
</template>

<script setup>
const props = defineProps({
  id: { type: [String, Number], required: true },
  title: { type: String, default: '' }
})

const emit = defineEmits(['view'])

const handleView = () => emit('view', props.id)
</script>

<style scoped>
.order-card { padding: 16px; }
.order-card__title { margin-bottom: 8px; }
</style>
```

必须：
- `props` 声明类型、必填项或默认值；禁止直接修改 props。
- 自定义事件用 `defineEmits` 声明；跨层共享优先按业务选择 props/emits、provide/inject 或 Pinia。
- `v-for` 使用稳定业务标识作为 `:key`；会插入、删除、排序的列表不得用 index 作为 key。
- 不在同一元素上混合 `v-if`、`v-for`；复杂展示逻辑提取到 `computed`。
- 禁止把未经安全处理的外部内容直接赋给 `v-html`。
- DOM 事件监听、定时器、观察器等在卸载时清理。
- 单组件责任过重时按职责拆分，不以固定行数作为强制指标。

## 6. API 请求与接口契约

1. 使用项目已有请求客户端（如 Axios），必须从统一封装入口请求；不在页面重复设置 Base URL、Token、超时。
2. API 以业务拆分，并使用语义化函数名，例如 `getOrderList`、`getOrderDetail`、`createOrder`。
3. **不得自行假定**后端返回 `{ code, message, data }`、分页字段名、成功码或鉴权方案。先查项目现有实现和真实接口契约。
4. 网络层负责标准化网络/HTTP 异常；业务层决定是否弹 Toast、跳转或展示空状态。避免双重弹错。
5. 可取消的请求要在页面离开或参数改变时考虑过期响应问题；提交类操作防重复提交。

```js
// src/api/order-api.js
import request from '@/utils/request'

export const getOrderList = (params) => {
  return request({ url: '/orders', method: 'get', params })
}
```

上例只示意调用结构；实际路径、参数、`request` 导出方式必须匹配项目现有实现。

## 7. Vue Router

- 路由集中维护在 `router/`，命名清晰；业务页面优先懒加载。
- 必要的登录校验放在统一路由守卫，禁止每个页面复制相同校验逻辑。
- `meta` 仅用于页面标题、展示权限等前端配置；服务端仍应校验真实访问权限。
- URL 参数先校验再使用；History 模式的服务器回退属于部署条件，不在本规范中要求接入 CI/CD。

```js
{
  path: '/orders/:id',
  name: 'OrderDetail',
  component: () => import('@/views/order/OrderDetail.vue'),
  meta: { requiresAuth: true, title: '订单详情' }
}
```

## 8. Pinia

- 仅存跨组件/跨页面需要的共享响应式数据：用户信息、全局配置、购物车等。
- Store 按领域划分，使用 `useXxxStore` 命名；解构响应式属性时使用 `storeToRefs()`。
- 不把每个列表的 Loading、单页输入框状态都放到全局。
- 缓存和持久化必须确定有效期、清除时机及敏感信息范围。

## 9. 样式与性能

- 遵循现有 UI 库、设计 Tokens 和响应式方案；未经要求不改变视觉风格。
- 共享颜色、边距、字体、圆角从统一变量读取；组件样式优先局部隔离。
- 禁止全局滥用 `!important`，避免过深选择器和样式污染。
- Web 页面应有基础响应式与键盘可访问性：按钮使用 `button`、输入有 label、交互可获取焦点。
- 列表需有 Empty、Loading、Error 状态；图像按需压缩及懒加载；大依赖按需引入。
- 不做没有证据的“性能优化”；先确认瓶颈再改动。

## 10. 配置与安全

- Vite 客户端环境变量使用 `VITE_` 前缀；前端环境变量一律视为可公开，禁止存储服务端密钥。
- 不把 Token、密码、手机号等敏感字段打印到日志；避免把用户隐私写入 URL。
- 不能用前端展示权限替代接口鉴权；外部 HTML 必须经可信净化流程后使用。
- 未经要求不引入第三方库、不改变依赖版本、不改动生产环境配置。

## 11. 交付与自测

每个功能提交前检查：

- [ ] 需求明确，现有页面行为未被意外改变
- [ ] `script setup`、目录、命名、组件职责符合规范
- [ ] 对应接口字段、状态码来自真实契约
- [ ] Loading / Empty / Error / 防重复提交已按场景处理
- [ ] 无调试输出、明文敏感信息、无关重构
- [ ] 按项目可用命令运行检查或构建；未执行的检查明确说明
- [ ] 修改文件清单与影响范围说明清晰

**AI 使用说明：**项目根目录同时放置 `AGENTS.md`，并要求 AI 在每次任务开始时阅读本文件。`AGENTS.md` 的通用约束与本文共同生效。

**参考：**https://vuejs.org/api/sfc-script-setup ｜ https://vuejs.org/guide/components/props
