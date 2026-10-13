# sugargooPc

基于 **Vue 3** + **Vite** + **Tailwind CSS v4** 构建的现代化前端工程。1

---

## 🛠️ 技术栈

- **前端框架**：[Vue 3](https://cn.vuejs.org/) (Composition API + `<script setup>`)
- **构建工具**：[Vite](https://cn.vite.dev/)
- **CSS 框架**：[Tailwind CSS v4](https://tailwindcss.com/)（搭配 `@tailwindcss/vite` 原生插件）
- **路由管理**：[Vue Router](https://router.vuejs.org/zh/)
- **状态管理**：[Pinia](https://pinia.vuejs.org/zh/)
- **代码规范**：[ESLint](https://eslint.org/) + [Prettier](https://prettier.io/) + [Oxlint](https://oxc.rs/)

---

## 💻 推荐开发环境

### IDE 与插件

- **编辑器**：[VS Code](https://code.visualstudio.com/)
- **插件推荐**：
  - [Vue - Official](https://marketplace.visualstudio.com/items?itemName=Vue.volar)（Vue 语言支持，需禁用 Vetur）
  - [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)（Tailwind 类名自动补全）
  - [Prettier - Code formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)（代码格式化）
  - [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)（代码规范检查）

### 浏览器插件

- **Vue Devtools**：
  - [Chrome / Edge 扩展商店](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Firefox 扩展商店](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)

---

## 🚀 常用命令

### 1. 安装依赖

```bash
npm install
```

### 2. 启动本地开发服务

```bash
npm run dev
```

### 3. 构建生产环境打包产物

```bash
npm run build
```

### 4. 本地预览生产构建产物

```bash
npm run preview
```

### 5. 代码规范检查与自动修复

```bash
npm run lint
```

### 6. 代码格式化

```bash
npm run format
```

---

## 📁 目录结构

```text
sugargooPc/
├── public/                 # 静态资源（不经过 Vite 编译）
├── src/
│   ├── assets/             # 资源文件（样式、图片、SVG 等）
│   │   ├── base.css        # 基础样式重置
│   │   └── main.css        # 全局样式入口（引入 Tailwind CSS）
│   ├── components/         # 公共业务组件
│   ├── router/             # 路由配置
│   ├── stores/             # Pinia 状态管理
│   ├── views/              # 页面视图组件
│   ├── App.vue             # 应用根组件
│   └── main.js             # 应用入口文件
├── index.html              # HTML 模板入口
├── vite.config.js          # Vite 构建配置
├── package.json            # 依赖与脚本定义
├── eslint.config.js        # ESLint 规范配置
└── .prettierrc.json        # Prettier 格式化配置
```
