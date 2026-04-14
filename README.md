# xbl-web

`xbl-web` 是原 `blogVue` 的升级版统一前端项目，用来承接已经融合后的后端，并统一管理 PC 端与移动端/H5 端。

当前状态不是“迁移草稿”，而是已经完成一轮：

- 新工程搭建
- 统一后端适配
- 模块化领域架构改造
- 双入口保留
- 页面层逐步实迁
- 首轮性能专项优化

## 技术栈

- Vue 3.5
- Vite 8
- TypeScript 5.9
- Vue Router 5
- Pinia 3
- Element Plus 2.13
- Axios
- Sass
- `unplugin-auto-import`
- `unplugin-vue-components`

Node 要求：

- `>= 20.19.0`

## 项目结构

```text
xbl-web/
├── index.html
├── mobile/index.html
├── public/config.js
├── src/
│   ├── app/                    # 应用启动层
│   ├── shared/                 # 共享请求、运行时配置、鉴权、UI反馈
│   ├── router/                 # PC 路由
│   ├── mobile/                 # 移动端入口、路由、兼容层
│   ├── modules/
│   │   ├── blog/
│   │   ├── system/
│   │   ├── schedule/
│   │   ├── calendar/
│   │   └── timesheet/
│   ├── api/                    # 旧 PC API 兼容层
│   ├── views/                  # 旧 PC 页面兼容层
│   ├── utils/                  # 旧工具兼容层
│   └── config/                 # 旧配置兼容层
```

## 架构说明

### 1. 双入口

- PC 入口：[`index.html`](/Users/xubaolin/IdeaProjects/xbl/xbl-web/index.html)
- 移动端入口：[`mobile/index.html`](/Users/xubaolin/IdeaProjects/xbl/xbl-web/mobile/index.html)

两端共用一套基础设施，但保留各自路由与页面体验。

### 2. 共享基础设施

核心共享层已经收口到：

- [`src/shared/config/runtime.ts`](/Users/xubaolin/IdeaProjects/xbl/xbl-web/src/shared/config/runtime.ts)
- [`src/shared/http/client.ts`](/Users/xubaolin/IdeaProjects/xbl/xbl-web/src/shared/http/client.ts)
- [`src/shared/auth/session.ts`](/Users/xubaolin/IdeaProjects/xbl/xbl-web/src/shared/auth/session.ts)
- [`src/shared/ui/feedback.ts`](/Users/xubaolin/IdeaProjects/xbl/xbl-web/src/shared/ui/feedback.ts)

兼容层文件仍然存在，但主要作用是平滑承接旧代码，不再作为新代码首选入口。

### 3. 模块化领域架构

当前按业务域组织代码：

- `modules/blog`
- `modules/system`
- `modules/schedule`
- `modules/calendar`
- `modules/timesheet`

每个模块逐步具备：

- `api`
- `views`
- `components`

其中 `modules/*/views` 已经开始承接真实页面实现，而不是只做包装。

## 已完成的页面迁移

下面这些页面已经由模块层真实接管：

- 博客广场：[`src/modules/blog/views/HomeSquarePage.vue`](/Users/xubaolin/IdeaProjects/xbl/xbl-web/src/modules/blog/views/HomeSquarePage.vue)
- 文章详情：[`src/modules/blog/views/ArticleDetailPage.vue`](/Users/xubaolin/IdeaProjects/xbl/xbl-web/src/modules/blog/views/ArticleDetailPage.vue)
- 博客信息页：[`src/modules/blog/views/BlogInfoPage.vue`](/Users/xubaolin/IdeaProjects/xbl/xbl-web/src/modules/blog/views/BlogInfoPage.vue)
- DeepSeek：[`src/modules/blog/views/DeepseekPage.vue`](/Users/xubaolin/IdeaProjects/xbl/xbl-web/src/modules/blog/views/DeepseekPage.vue)
- 登录页：[`src/modules/system/views/LoginPage.vue`](/Users/xubaolin/IdeaProjects/xbl/xbl-web/src/modules/system/views/LoginPage.vue)
- 登录统计页：[`src/modules/system/views/LoginListPage.vue`](/Users/xubaolin/IdeaProjects/xbl/xbl-web/src/modules/system/views/LoginListPage.vue)
- 移动端首页：[`src/modules/mobile/system/views/HomePage.vue`](/Users/xubaolin/IdeaProjects/xbl/xbl-web/src/modules/mobile/system/views/HomePage.vue)
- 移动端登录：[`src/modules/mobile/system/views/LoginPage.vue`](/Users/xubaolin/IdeaProjects/xbl/xbl-web/src/modules/mobile/system/views/LoginPage.vue)
- 移动端注册：[`src/modules/mobile/system/views/RegisterPage.vue`](/Users/xubaolin/IdeaProjects/xbl/xbl-web/src/modules/mobile/system/views/RegisterPage.vue)
- 移动端博客编辑：[`src/modules/mobile/blog/views/BlogEditPage.vue`](/Users/xubaolin/IdeaProjects/xbl/xbl-web/src/modules/mobile/blog/views/BlogEditPage.vue)

旧的 `src/views/*`、`src/mobile/views/*` 目录仍保留兼容壳，避免一次性迁移引发回归。

## 后端适配

当前已对齐统一后的 `xbl-home` 后端：

- 单体服务默认端口：`6101`
- 保留原业务前缀：
  - `/blog`
  - `/schedule`
  - `/calendar`
  - `/timesheet`

开发代理默认全部指向 `6101`，相关配置见：

- [`vite.config.ts`](/Users/xubaolin/IdeaProjects/xbl/xbl-web/vite.config.ts)
- [`.env.example`](/Users/xubaolin/IdeaProjects/xbl/xbl-web/.env.example)
- [`public/config.js`](/Users/xubaolin/IdeaProjects/xbl/xbl-web/public/config.js)

运行时配置优先级：

1. `window.__APP_CONFIG__`
2. `import.meta.env`
3. 代码默认值

当前已删除旧兼容配置：

- `public/config.js` 中的 `API_BASE_URL`
- `src/shared/config/runtime.ts` 中对 `API_BASE_URL` / `VITE_API_BASE_URL` 的兼容回退

统一使用的新配置字段：

- `BLOG_API_URL`
- `SCHEDULE_API_URL`
- `CALENDAR_API_URL`
- `TIMESHEET_API_URL`

本地测试如果不走 Nginx，可以在 [`public/config.js`](/Users/xubaolin/IdeaProjects/xbl/xbl-web/public/config.js) 中切换为：

- `http://127.0.0.1:6101/blog`
- `http://127.0.0.1:6101/schedule`
- `http://127.0.0.1:6101/calendar`
- `http://127.0.0.1:6101/timesheet`

## 运行与校验

安装依赖：

```bash
npm install
```

启动开发环境：

```bash
npm run dev
```

类型检查：

```bash
npm run typecheck
```

生产构建：

```bash
npm run build
```

## 性能优化结果

已经完成一轮专项优化，重点包括：

- 去掉全局 `ElementPlus` 整包安装，改用根级 `ElConfigProvider`
- `Element Plus` 组件继续按需导入
- API/路由/HTTP 公共层改为统一懒加载反馈层
- `highlight.js` 改为 `core + 常用语言注册`
- `echarts` 改为按需模块注册
- 博客编辑器改成“页面壳 + 异步富文本面板”
- 编辑器生态按 chunk 继续拆分

当前主要大包大致为：

- `vendor-element` 约 `578 kB`
- `vendor-markdown` 约 `179 kB`
- `vendor-echarts` 约 `611 kB`
- `vendor-editor-core` 约 `797 kB`

和优化前相比：

- `element-plus` 明显下降
- `markdown/highlight` 从约 `1 MB` 降到约 `179 kB`
- `echarts` 从约 `1.12 MB` 降到约 `611 kB`

## 后续建议

如果继续演进，优先级建议如下：

1. 继续把剩余高频页面从兼容层迁到 `modules/*/views`
2. 评估是否替换 `wangeditor`
3. 继续压缩 `element-plus` 和图表相关依赖
4. 按统一后端最终接口文档继续清理旧 API 兼容层
