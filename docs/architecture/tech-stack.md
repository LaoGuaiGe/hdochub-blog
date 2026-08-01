# 技术方案文档（TDD）

| 项目 | 内容 |
|------|------|
| 项目名称 | hdochub 个人技术博客 |
| 文档版本 | V1.0 |
| 编写日期 | 2026-07-28 |
| 编写人 | 架构师 |
| 文档状态 | 评审通过 |
| 关联文档 | PRD.md、database-design.md、api-design.md、deployment.md |

---

## 1. 文档概述

本文档是个人技术博客系统的总体技术方案，面向开发与运维人员。文档基于 PRD 的全部功能需求（P0/P1/P2）与非功能需求（性能、安全、兼容、SEO、部署）制定技术选型、系统分层架构、目录结构规范与环境要求，确保开发人员阅读后可直接进入编码阶段。

设计原则：

- **务实不过度设计**：个人博客规模（并发 ≤ 100、文章 ≤ 1000 篇），采用单体应用 + 单实例部署，不引入微服务、消息队列等复杂中间件。
- **安全是底线**：密码 bcrypt 哈希、JWT 鉴权、ORM 参数化查询防注入、XSS 过滤、HTTPS 全站。
- **SEO 友好**：前端采用 SSR（服务端渲染），保证搜索引擎可抓取文章正文。
- **宝塔兼容**：所有组件（Nginx、MySQL、Redis、Node.js）均可在宝塔面板内安装与管理。

---

## 2. 技术栈选型

### 2.1 选型总览

| 层级 | 技术选型 | 版本要求 |
|------|----------|----------|
| 前端框架 | Nuxt 3（Vue 3 + SSR） | 3.x |
| 前端语言 | TypeScript | 5.x |
| 样式方案 | TailwindCSS | 3.x |
| 状态管理 | Pinia | 2.x |
| Markdown 渲染 | markdown-it + highlight.js | - |
| Markdown 编辑器 | md-editor-v3 | 4.x |
| 后端框架 | NestJS（Node.js） | 10.x |
| 后端语言 | TypeScript | 5.x |
| ORM | Prisma | 5.x |
| 数据库 | MySQL | 8.0+ |
| 缓存 | Redis | 6.0+ |
| 进程管理 | PM2 | 5.x |
| Web 服务器 | Nginx | 1.22+ |
| 运行时 | Node.js | 20 LTS |
| 包管理器 | pnpm | 8.x |
| SSL 证书 | Let's Encrypt | - |

### 2.2 前端选型理由

#### 2.2.1 Nuxt 3（Vue 3 + SSR）

| 候选方案 | 优点 | 劣势 | 结论 |
|----------|------|------|------|
| **Nuxt 3（SSR）** | 服务端渲染，SEO 友好；Vue 3 生态成熟；内置路由、中间件、数据获取；对工程师友好 | 需 Node 运行时，部署比纯静态复杂 | **采用** |
| Vue 3 SPA（Vite） | 开发简单，构建纯静态 | 纯客户端渲染，SEO 差，文章正文不被搜索引擎抓取 | 否决（不满足 SEO 需求） |
| Next.js（React SSR） | SSR 优秀 | React 生态，团队学习成本；与后端 Vue 体系不统一 | 否决 |
| Hexo（SSG） | 静态部署零成本 | 无法支撑评论、点赞等动态交互（PRD 核心诉求） | 否决 |

**核心理由**：PRD 明确要求 SEO（语义化 HTML、sitemap、meta 标签、文章 URL slug）且需要动态交互（评论、点赞、登录）。SSR 是同时满足两者的唯一方案。Nuxt 3 基于 Vue 3，组件化开发高效，内置 SSR 能力，且与后端同属 Node/TS 生态，技术栈统一。

#### 2.2.2 TailwindCSS

野兽派（Brutalism）设计风格要求：无圆角、无阴影、无渐变、硬边框、黑白高对比。TailwindCSS 是原子化 CSS，可直接用 `border-2 border-black rounded-none` 等类实现硬边框无圆角，无需编写大量自定义 CSS，且可全局关闭圆角/阴影默认值。相比 Sass/Less 手写样式，开发效率更高，产物体积可控（PurgeCSS 按需生成）。

#### 2.2.3 Markdown 渲染与代码高亮

- **markdown-it**：符合 GFM（GitHub Flavored Markdown）规范，支持表格、任务列表、删除线、自动链接，插件生态丰富，满足 PRD 兼容性需求。
- **highlight.js**：支持 190+ 语言，轻松覆盖 PRD 要求的 20+ 主流语言（JS/TS/Python/Java/Go/Rust/C++/Shell/SQL/JSON/YAML/HTML/CSS/PHP/Ruby/Kotlin/Swift 等），性能优秀，SSR 友好。
- **md-editor-v3**：Vue 3 原生 Markdown 编辑器，内置工具栏（加粗/斜体/标题/列表/代码块/引用/链接/图片/表格）、分屏预览、全屏切换，基于 markdown-it + highlight.js，与渲染端一致，避免编辑预览与线上渲染不一致。

#### 2.2.4 Pinia

Vue 3 官方推荐状态管理库，API 简洁（无 mutations），TypeScript 支持优秀，用于管理用户登录态、用户信息、站点配置等全局状态。

### 2.3 后端选型理由

#### 2.3.1 NestJS

| 候选方案 | 优点 | 劣势 | 结论 |
|----------|------|------|------|
| **NestJS** | 模块化架构、依赖注入、TypeScript 优先、装饰器风格、内置 Guard/Interceptor/Pipe 便于实现鉴权/校验/限流；生态成熟 | 学习曲线略高 | **采用** |
| Express | 极简轻量 | 无结构约束，中大型项目易混乱；需手动组织分层 | 否决（28 项功能需结构化） |
| Koa | 轻量、中间件优雅 | 同 Express，缺乏开箱即用的工程结构 | 否决 |
| Spring Boot（Java） | 企业级成熟 | 与前端 Node/TS 生态割裂；JVM 内存占用高，个人服务器资源吃紧 | 否决 |

**核心理由**：PRD 共 28 项功能（P0+P1+P2），涉及用户/文章/分类/标签/评论/点赞/友链/设置等多个资源域，需要清晰的模块化结构。NestJS 的 Module/Controller/Service 分层天然契合，Guard（鉴权）、Pipe（参数校验）、Interceptor（日志/缓存）、Decorator（自定义装饰器）可优雅实现权限矩阵与安全需求。TypeScript 全栈统一类型，降低前后端联调成本。

#### 2.3.2 Prisma ORM

| 候选方案 | 优点 | 劣势 | 结论 |
|----------|------|------|------|
| **Prisma** | 类型安全（根据 schema 自动生成类型）；声明式 schema 即文档；自动迁移；查询 API 直观防注入；与 NestJS 集成良好 | 复杂查询需 raw query | **采用** |
| TypeORM | NestJS 官方集成，装饰器风格 | 类型推断弱，API 繁琐，活跃度下降 | 否决 |
| Sequelize | 老牌成熟 | TypeScript 支持弱，Promise 链式风格陈旧 | 否决 |

**核心理由**：Prisma 的 `schema.prisma` 既是数据库定义又是类型来源，开发人员改 schema 即可生成迁移与类型，杜绝手写类型与表结构不一致。所有查询默认参数化，满足 PRD「禁止拼接 SQL」的安全底线。

### 2.4 数据库与缓存选型理由

#### 2.4.1 MySQL 8.0

- PRD 明确要求兼容 MySQL 5.7+ / MariaDB 10.3+，宝塔面板原生支持 MySQL 一键安装与管理。
- 关系型数据库契合博客的数据结构（文章-分类-标签-评论多对多/一对多关系）。
- MySQL 8.0 支持 JSON 字段、窗口函数、CTE，便于复杂统计查询（如归档、热门文章）。
- 选用 InnoDB 引擎，支持事务与行级锁，保障评论、点赞等并发写操作的数据一致性。

#### 2.4.2 Redis 6.0+

| 用途 | 说明 |
|------|------|
| 接口限流 | 登录 5 次/分、注册 3 次/时、评论 10 次/分，按 IP 限流，基于 Redis 计数器实现 |
| 阅读量去重 | 同一 IP 短时间内多次访问同一文章计一次，用 Redis Key + TTL（30 分钟）实现 |
| 文章缓存 | 文章列表与详情页缓存 5 分钟，发布/编辑时主动失效，降低数据库压力 |
| JWT 黑名单 | 用户登出、改密码、封禁时将 Token 加入黑名单，强制失效 |

**核心理由**：宝塔面板支持一键安装 Redis。Redis 解决限流与缓存的持久化/跨重启问题，比内存方案更可靠。个人博客单实例下 Redis 资源占用低（< 50MB），不构成负担。

### 2.5 部署运维工具选型理由

| 工具 | 用途 | 选型理由 |
|------|------|----------|
| **PM2** | Node.js 进程管理 | 宝塔内置 PM2 管理器插件；支持进程守护、自动重启、日志管理、集群模式；Nuxt 与 NestJS 均为 Node 应用，统一用 PM2 托管 |
| **Nginx** | 反向代理 + 静态资源 | 宝塔原生管理；反向代理前端 SSR 与后端 API；配置 Gzip、缓存、HTTPS、HTTP 跳转 |
| **Let's Encrypt** | SSL 证书 | 免费、宝塔一键申请与自动续签；满足全站 HTTPS 要求 |

---

## 3. 系统分层架构设计

### 3.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                       用户浏览器                              │
│            (游客 / 注册用户 / 管理员)                          │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS (443)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Nginx (宝塔管理)                           │
│   - SSL 终止 / HTTP→HTTPS 跳转                              │
│   - 反向代理：/ → Nuxt SSR (3000)  /api → NestJS (4000)      │
│   - 静态资源 Gzip 压缩与缓存                                 │
└──────────────┬───────────────────────┬──────────────────────┘
               │                       │
       ┌───────▼───────┐       ┌───────▼───────┐
       │   Nuxt 3 SSR  │       │   NestJS API  │
       │   (前端 :3000) │       │   (后端 :4000) │
       │               │       │               │
       │ - 页面 SSR     │──────▶│ - RESTful API │
       │ - 路由/中间件  │ HTTP  │ - JWT 鉴权    │
       │ - Pinia 状态   │ 调用  │ - 权限 Guard  │
       │ - 组件渲染     │       │ - 业务 Service│
       └───────────────┘       └───────┬───────┘
                                       │
                       ┌───────────────┼───────────────┐
                       │               │               │
                ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
                │  MySQL 8.0  │ │  Redis 6+   │ │  文件系统    │
                │  (业务数据)  │ │ (缓存/限流)  │ │ (上传图片)   │
                └─────────────┘ └─────────────┘ └─────────────┘
```

### 3.2 前端分层架构（Nuxt 3）

```
┌─────────────────────────────────────────────┐
│                  页面层 (pages/)              │
│   前台页面 / 用户后台 / 管理员后台             │
├─────────────────────────────────────────────┤
│                布局层 (layouts/)              │
│   default 前台布局 / dashboard 用户后台布局   │
│   / admin 管理员后台布局                      │
├─────────────────────────────────────────────┤
│                组件层 (components/)           │
│   公共组件 / 文章卡片 / 评论 / 编辑器 / 分页   │
├─────────────────────────────────────────────┤
│              状态层 (stores/ Pinia)          │
│   useAuthStore / useSiteStore                │
├─────────────────────────────────────────────┤
│             服务层 (composables/ api/)       │
│   封装 HTTP 请求 / 业务逻辑组合               │
├─────────────────────────────────────────────┤
│              中间件层 (middleware/)           │
│   路由鉴权 / 角色校验 / SSR 注入用户信息       │
├─────────────────────────────────────────────┤
│              插件层 (plugins/)               │
│   axios/$api 注入 / 全局指令                  │
└─────────────────────────────────────────────┘
```

**职责说明**：

- **页面层**：对应路由，负责页面级数据获取（`useAsyncData`/`useFetch`）与组件编排，不含业务逻辑。
- **布局层**：三类布局分别包裹前台、用户后台、管理员后台，复用导航与页脚。
- **组件层**：纯展示与交互，通过 props 接收数据、emit 触发事件，不直接调 API。
- **状态层**：管理跨页面共享状态（登录态、用户信息、站点配置），组件按需订阅。
- **服务层**：封装所有后端 API 调用，统一处理 baseURL、Token 注入、错误处理。
- **中间件层**：路由级守卫，校验登录与角色，未授权重定向；SSR 时从 Cookie 读取 Token 并请求用户信息注入 store。
- **插件层**：初始化 HTTP 客户端，注入全局上下文。

### 3.3 后端分层架构（NestJS）

```
┌──────────────────────────────────────────────────┐
│              Controller 层 (控制器)               │
│   接收 HTTP 请求 / 参数校验(Pipe) / 返回响应       │
│   鉴权装饰器(@Public/@Roles) / 路由定义            │
├──────────────────────────────────────────────────┤
│              Service 层 (业务服务)                │
│   核心业务逻辑 / 事务编排 / 数据组装               │
│   调用 Repository / 调用缓存 / 触发副作用          │
├──────────────────────────────────────────────────┤
│            Repository 层 (数据访问)               │
│   Prisma Service 封装 / 数据库 CRUD               │
│   仅数据操作，不含业务规则                         │
├──────────────────────────────────────────────────┤
│              Infrastructure 层 (基础设施)         │
│   Prisma 客户端 / Redis 客户端 / 文件存储          │
│   JWT 工具 / 加密工具 / 日志 / 邮件(预留)          │
├──────────────────────────────────────────────────┤
│              Cross-cutting (横切关注点)           │
│   Guard(鉴权) / Interceptor(日志/响应格式/缓存)   │
│   Pipe(校验) / Filter(异常处理) / Decorator(自定义)│
└──────────────────────────────────────────────────┘
```

**职责说明**：

- **Controller 层**：仅做请求接收、参数校验、响应返回。通过装饰器声明权限（`@Public()` 公开、`@Roles('ADMIN')` 角色限制），不写业务逻辑。
- **Service 层**：业务核心。处理文章发布状态流转、评论嵌套、点赞去重、阅读量统计等业务规则。负责事务编排（如发布文章时更新计数、清缓存）。
- **Repository 层**：封装 Prisma 数据访问，隔离 ORM 细节，便于单元测试 Mock。
- **Infrastructure 层**：基础设施客户端，由 NestJS 依赖注入管理单例。
- **横切关注点**：
  - `JwtAuthGuard`：全局默认开启，校验 Token 并注入 `req.user`；`@Public()` 装饰的接口跳过。
  - `RolesGuard`：校验角色权限矩阵。
  - `TransformInterceptor`：统一响应格式 `{ code, message, data }`。
  - `HttpExceptionFilter`：统一异常处理与错误码映射。
  - `ValidationPipe`：DTO 参数校验（class-validator）。

### 3.4 请求流转示例（游客浏览文章详情）

```
1. 浏览器请求 GET /post/docker-502-fix
2. Nginx 接收，反向代理到 Nuxt SSR (:3000)
3. Nuxt SSR 执行页面组件，调用 useFetch 请求后端
4. 后端 GET /api/articles/docker-502-fix (公开接口)
5. NestJS Controller 接收 → ArticleService.findBySlug()
6. ArticleService 查 Redis 缓存 → 未命中 → 查 Prisma/MySQL
7. 返回文章数据 → Nuxt SSR 渲染 HTML
8. 同时触发阅读量统计：Redis SET view:{id}:{ip} EX 1800（不存在时 view_count+1）
9. Nginx 返回 HTML 给浏览器，搜索引擎可抓取完整内容
```

---

## 4. 目录结构规范

项目采用 Monorepo 结构，前端与后端在同一个仓库内独立目录管理，便于版本统一与协作。

### 4.1 仓库根目录

```
/workspace/
├── PROJECT_SPEC.md              # 项目规范（项目宪法）
├── README.md                    # 项目说明
├── .gitignore
├── .editorconfig
├── pnpm-workspace.yaml          # pnpm 工作区配置
├── docs/                        # 项目文档
│   ├── PRD/                     # 需求文档
│   ├── architecture/            # 技术架构文档（本系列）
│   ├── design/                  # 设计稿与设计规范
│   ├── test/                    # 测试文档
│   └── ops/                     # 部署与运维文档
├── web/                         # 前端工程（Nuxt 3）
├── server/                      # 后端工程（NestJS）
└── deploy/                      # 部署配置文件
    ├── nginx/                   # Nginx 配置
    ├── pm2/                     # PM2 配置
    └── sql/                     # 数据库初始化脚本
```

### 4.2 前端目录结构（web/）

```
web/
├── nuxt.config.ts               # Nuxt 配置（SSR、模块、构建）
├── package.json
├── tsconfig.json
├── tailwind.config.ts           # TailwindCSS 配置（关闭圆角/阴影）
├── .env                         # 前端环境变量
├── .env.production
├── app.vue                      # 根组件
├── assets/                      # 静态资源（需构建处理）
│   ├── css/
│   │   └── main.css             # 全局样式（野兽派基础样式）
│   └── images/
├── public/                      # 静态资源（原样输出）
│   ├── favicon.ico
│   └── robots.txt
├── pages/                       # 页面（文件路由）
│   ├── index.vue                # 首页
│   ├── post/
│   │   └── [slug].vue           # 文章详情页
│   ├── category/
│   │   ├── index.vue            # 分类页
│   │   └── [slug].vue           # 分类下文章列表
│   ├── tag/
│   │   ├── index.vue            # 标签云
│   │   └── [slug].vue           # 标签下文章列表
│   ├── archive.vue              # 归档页
│   ├── search.vue               # 搜索结果页
│   ├── about.vue                # 关于页面
│   ├── links.vue                # 友链页面
│   ├── login.vue                # 登录页
│   ├── register.vue             # 注册页
│   ├── dashboard/               # 用户后台
│   │   ├── index.vue            # 概览
│   │   ├── posts/               # 文章管理
│   │   ├── editor/              # 写文章/编辑
│   │   ├── comments.vue         # 评论管理
│   │   └── profile.vue          # 个人资料
│   └── admin/                   # 管理员后台
│       ├── index.vue            # 管理概览
│       ├── posts.vue            # 文章管理
│       ├── categories.vue       # 分类管理
│       ├── tags.vue             # 标签管理
│       ├── comments.vue         # 评论管理
│       ├── users.vue            # 用户管理
│       └── settings.vue         # 站点设置
├── layouts/                     # 布局
│   ├── default.vue              # 前台布局（导航+页脚）
│   ├── dashboard.vue            # 用户后台布局
│   └── admin.vue                # 管理员后台布局
├── components/                  # 组件
│   ├── common/                  # 通用组件（分页、空状态、加载）
│   ├── article/                 # 文章相关（卡片、详情、TOC）
│   ├── comment/                 # 评论相关（列表、输入框、楼中楼）
│   ├── editor/                  # Markdown 编辑器封装
│   └── layout/                  # 布局组件（导航、页脚、侧边栏）
├── composables/                 # 组合式函数
│   ├── useAuth.ts               # 认证逻辑
│   ├── useArticle.ts            # 文章逻辑
│   └── usePagination.ts         # 分页逻辑
├── stores/                      # Pinia 状态
│   ├── auth.ts                  # 登录态与用户信息
│   └── site.ts                  # 站点配置缓存
├── middleware/                  # 路由中间件
│   ├── auth.ts                  # 登录校验
│   └── admin.ts                 # 管理员校验
├── plugins/                     # 插件
│   └── api.ts                   # 注入 HTTP 客户端
├── utils/                       # 工具函数
│   ├── request.ts               # HTTP 请求封装
│   ├── format.ts                # 格式化（时间、字数、阅读时长）
│   └── markdown.ts              # Markdown 渲染配置
├── types/                       # 类型定义
│   └── index.ts
└── server/                      # Nuxt 服务端路由（RSS、sitemap）
    ├── routes/
    │   ├── rss.xml.ts           # RSS feed
    │   └── sitemap.xml.ts       # sitemap
    └── api/
```

**命名规范**：

- 页面与组件文件：`PascalCase` 组件名，文件用 `kebab-case` 或 `PascalCase.vue`（统一用 `kebab-case.vue`，组件内 name 用 PascalCase）。
- 目录：`kebab-case`。
- composable / store：`useXxx.ts` / `xxx.ts`（camelCase）。
- 类型：`PascalCase`（接口与类型别名）。

### 4.3 后端目录结构（server/）

```
server/
├── package.json
├── tsconfig.json
├── nest-cli.json
├── .env                         # 后端环境变量
├── .env.production
├── prisma/
│   ├── schema.prisma            # Prisma 模型定义（数据库设计源头）
│   ├── migrations/              # 数据库迁移文件
│   └── seed.ts                  # 初始化种子数据（超管账号、默认分类）
├── src/
│   ├── main.ts                  # 应用入口（启动、全局管道/过滤器/静态资源）
│   ├── app.module.ts            # 根模块
│   ├── common/                  # 公共模块
│   │   ├── decorators/          # 自定义装饰器
│   │   │   ├── public.decorator.ts      # @Public() 公开接口
│   │   │   ├── roles.decorator.ts       # @Roles() 角色声明
│   │   │   └── current-user.decorator.ts # @CurrentUser() 获取当前用户
│   │   ├── guards/              # 守卫
│   │   │   ├── jwt-auth.guard.ts        # JWT 鉴权
│   │   │   └── roles.guard.ts           # 角色权限
│   │   ├── interceptors/        # 拦截器
│   │   │   ├── transform.interceptor.ts # 统一响应格式
│   │   │   └── logging.interceptor.ts   # 请求日志
│   │   ├── filters/             # 异常过滤器
│   │   │   └── http-exception.filter.ts # 统一异常处理
│   │   ├── pipes/               # 管道
│   │   │   └── validation.pipe.ts
│   │   ├── dto/                 # 公共 DTO（分页、响应）
│   │   │   ├── pagination.dto.ts
│   │   │   └── response.dto.ts
│   │   └── enum/                # 枚举（角色、状态、错误码）
│   │       ├── role.enum.ts
│   │       ├── article-status.enum.ts
│   │       ├── comment-status.enum.ts
│   │       └── error-code.enum.ts
│   ├── config/                  # 配置
│   │   ├── configuration.ts     # 环境变量读取
│   │   └── env.validation.ts    # 环境变量校验
│   ├── modules/                 # 业务模块（每个资源域一个模块）
│   │   ├── auth/                # 认证模块
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── jwt.strategy.ts
│   │   │   └── dto/
│   │   ├── users/               # 用户模块
│   │   ├── articles/            # 文章模块
│   │   ├── categories/          # 分类模块
│   │   ├── tags/                # 标签模块
│   │   ├── comments/            # 评论模块
│   │   ├── likes/               # 点赞模块
│   │   ├── uploads/             # 文件上传模块
│   │   ├── friend-links/        # 友链模块
│   │   ├── settings/            # 站点设置模块
│   │   ├── stats/               # 统计模块
│   │   └── search/              # 搜索模块
│   └── infrastructure/          # 基础设施
│       ├── prisma/              # Prisma 客户端封装
│       │   ├── prisma.module.ts
│       │   └── prisma.service.ts
│       ├── redis/               # Redis 客户端封装
│       │   ├── redis.module.ts
│       │   └── redis.service.ts
│       └── cache/               # 缓存工具
│           └── cache.service.ts
├── test/                        # 测试
│   ├── unit/
│   └── e2e/
└── uploads/                     # 上传文件存储目录（生产环境软链到宝塔目录）
```

**模块规范**：每个业务模块包含 `module.ts`、`controller.ts`、`service.ts`、`dto/`，职责内聚。模块间通过 NestJS 依赖注入相互导入，禁止循环依赖。

---

## 5. 环境要求

### 5.1 开发环境

| 项 | 要求 |
|----|------|
| 操作系统 | macOS / Windows / Linux 均可 |
| Node.js | 20 LTS（统一版本，建议用 nvm 管理） |
| 包管理器 | pnpm 8.x |
| 数据库 | 本地 MySQL 8.0（或 Docker 运行） |
| Redis | 本地 Redis 6+（或 Docker 运行） |
| 编辑器 | VS Code（推荐插件：Volar、ESLint、Prettier、Prisma） |
| Git | 2.x+ |
| 浏览器 | Chrome 90+ 用于开发调试 |

### 5.2 生产环境（服务器）

| 项 | 要求 | 说明 |
|----|------|------|
| 操作系统 | Ubuntu 20.04 / 22.04 LTS | 甲方已安装宝塔面板 |
| 管理面板 | 宝塔面板 7.x+ | 管理 Nginx、MySQL、Redis、SSL |
| CPU | 2 核+ | 个人博客最低配置 |
| 内存 | 2GB+（推荐 4GB） | MySQL + Redis + Node(Nuxt+NestJS) |
| 磁盘 | 20GB+ | 系统 + 数据库 + 上传图片 + 日志 |
| Node.js | 20 LTS | 宝塔 Node.js 管理器安装 |
| MySQL | 8.0 | 宝塔软件商店安装 |
| Redis | 6.0+ | 宝塔软件商店安装 |
| Nginx | 1.22+ | 宝塔自带 |
| PM2 | 5.x | 宝塔 PM2 管理器插件 |
| 域名 | blog.hdochub.com | 已解析到服务器 IP |

### 5.3 环境变量规范

所有敏感配置（数据库密码、JWT 密钥、Redis 密码）通过环境变量注入，`.env` 文件不入版本库（已加入 `.gitignore`）。开发与生产环境分别使用 `.env` 与 `.env.production`。

#### 5.3.1 后端环境变量（server/.env）

```bash
# 运行环境
NODE_ENV=development
PORT=4000

# 数据库
DATABASE_URL="mysql://blog_user:strong_password@localhost:3306/blog_db"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d
JWT_REMEMBER_EXPIRES_IN=30d

# 文件上传
UPLOAD_DIR=/www/wwwroot/blog.hdochub.com/uploads
UPLOAD_MAX_SIZE=5242880

# 站点
SITE_URL=https://blog.hdochub.com
```

#### 5.3.2 前端环境变量（web/.env）

```bash
# 后端 API 地址（SSR 与客户端均使用）
NUXT_PUBLIC_API_BASE=http://localhost:4000/api
# 生产环境
# NUXT_PUBLIC_API_BASE=https://blog.hdochub.com/api

# 站点地址
NUXT_PUBLIC_SITE_URL=https://blog.hdochub.com
```

#### 5.3.3 环境变量校验

后端启动时通过 `@nestjs/config` + Joi schema 校验环境变量完整性与合法性，缺失或非法时直接启动失败并报错，避免线上配置遗漏。

---

## 6. 安全方案概要

详细安全实现散落在各文档，此处汇总原则（安全性是底线）：

| 安全维度 | 实现方案 | 落地位置 |
|----------|----------|----------|
| 密码存储 | bcrypt 加盐哈希（cost factor = 10） | auth.service / users.service |
| 会话鉴权 | JWT（Access Token），7 天有效期；记住我 30 天 | auth 模块 / JwtAuthGuard |
| Token 失效 | 登出/改密码/封禁时 Redis 加入黑名单 | auth.service |
| SQL 注入 | Prisma ORM 全参数化查询，禁止 raw 拼接 | 全局 |
| XSS 防护 | Markdown 渲染过滤 script/iframe 等危险标签；用户输入 HTML 转义 | markdown.ts / 评论渲染 |
| CSRF 防护 | JWT 存于 HttpOnly Cookie + SameSite=Lax；写操作校验自定义 Header | api-design.md |
| 接口限流 | 基于 Redis + IP 限流（登录 5/分、注册 3/时、评论 10/分） | ThrottlerGuard |
| 文件上传 | MIME + 文件头双重校验；白名单格式；5MB 限制；目录禁执行权限 | uploads 模块 |
| HTTPS | Let's Encrypt 全站强制 HTTPS，HTTP 301 跳转 | deployment.md |
| 敏感信息 | 环境变量注入，.env 不入库 | .gitignore |
| 后台路径 | /admin 路径可在站点设置自定义修改 | settings 模块 |
| 安全响应头 | helmet 中间件（X-Frame-Options、CSP、HSTS 等） | main.ts |

---

## 7. 技术风险与应对

| 风险 | 影响 | 应对措施 |
|------|------|----------|
| SSR 内存占用偏高 | 服务器 2GB 内存吃紧 | Nuxt 与 NestJS 分进程，PM2 限制 `max_memory_restart`；必要时升级 4GB |
| Markdown 渲染 XSS | 文章/评论被注入恶意脚本 | markdown-it 默认 HTML 转义 + 白名单插件；评论仅允许加粗/代码/链接 |
| 高亮语言多导致包体积大 | 首屏加载慢 | highlight.js 按需引入 20+ 语言子集；SSR 预渲染高亮 |
| 搜索性能 | 全文 LIKE 搜索 1000 篇时偏慢 | 标题+摘要建索引；正文搜索用 MySQL FULLTEXT 索引；后续可接 MeiliSearch |
| 单点故障 | 单实例无高可用 | 个人博客可接受；PM2 守护自动重启；数据库每日备份 |

---

## 8. 版本规划与功能映射

| 版本 | 功能范围 | 对应 PRD 优先级 |
|------|----------|-----------------|
| V1.0 | 文章浏览/注册登录/编辑器/发文/分类/标签/搜索/评论/用户后台/管理员后台/权限 + P1 草稿/封面/TOC/阅读量/点赞/评论回复/归档/排序/头像/评论审核 | P0 全部 + P1 主力 |
| V1.1 | 关于页/友链/RSS/防垃圾注册/创建管理员/站点设置/标签合并 | P2 全部 + P1 收尾 |
| V2.0+ | 邮件通知、文章修订历史、MeiliSearch 全文搜索、邮件激活 | 扩展 |

---

## 9. 附录：关键技术约定

1. **统一响应格式**：所有 API 返回 `{ code: number, message: string, data: T }`，`code = 0` 表示成功，非 0 为错误码（详见 api-design.md）。
2. **时间存储**：数据库统一存 UTC 时间（`DATETIME`），接口返回 ISO 8601 字符串，前端按用户时区格式化。
3. **ID 策略**：主键用自增 `BIGINT`；对外暴露的资源标识用 `slug`（文章、分类、标签）或 `id`（用户、评论），URL 语义化。
4. **软删除**：文章、评论采用状态标记（已下架/已删除）而非物理删除，便于数据恢复与审计；用户封禁用状态字段。
5. **分页规范**：统一 `page`（页码，从 1 开始）+ `pageSize`（每页条数），响应含 `total`、`page`、`pageSize`、`totalPages`。
6. **命名约定**：数据库表名 `snake_case` 复数；字段名 `snake_case`；后端 TypeScript `camelCase`；Prisma 自动映射转换。

---

> 本文档为架构设计基线，开发过程中如遇技术方案需调整，须由架构师评估并同步通知设计师与开发，更新本文档版本记录。
