# hdochub 个人技术博客

面向工程师的个人技术博客系统，支持多用户注册写作、评论互动、后台管理，采用野兽派（Brutalism）设计风格。

## 技术栈

| 层面 | 技术 |
|------|------|
| 前端 | Nuxt 3 (Vue 3 + SSR) + TailwindCSS |
| 后端 | NestJS (TypeScript) + Prisma ORM |
| 数据库 | MySQL 8.0 |
| 缓存 | Redis 6+ |
| 部署 | Nginx + PM2 + 宝塔面板 |

## 项目结构

```
/workspace/
├── PROJECT_SPEC.md              # 项目规范文档
├── docs/                        # 项目文档
│   ├── agents/                  # 智能体角色定义（7个）
│   ├── PRD/                     # 产品需求文档
│   ├── architecture/            # 技术方案、数据库设计、API设计、部署架构
│   ├── design/                  # 设计规范、页面原型、视觉走查报告
│   ├── test/                    # 测试用例、缺陷报告、测试总结
│   └── ops/                     # 部署指南、运维手册
└── src/
    ├── server/                  # NestJS 后端
    │   ├── prisma/              # 数据库 schema 和种子数据
    │   ├── src/
    │   │   ├── common/          # 公共模块（guards, filters, interceptors）
    │   │   ├── config/          # 配置
    │   │   ├── infrastructure/  # 基础设施（prisma, redis, cache）
    │   │   └── modules/         # 业务模块（13个）
    │   └── ecosystem.config.js  # PM2 配置
    └── client/                  # Nuxt 3 前端
        ├── components/          # 组件（28个）
        ├── composables/         # 组合式函数
        ├── layouts/             # 布局（3个）
        ├── middleware/           # 路由中间件
        ├── pages/               # 页面（25个）
        ├── plugins/             # 插件
        ├── stores/              # 状态管理
        ├── types/               # 类型定义
        └── utils/               # 工具函数
```

## 功能清单

### P0 核心功能
- 文章浏览（分页、详情）
- 注册登录（JWT 认证）
- Markdown 编辑器（代码高亮）
- 发表/编辑/删除文章
- 文章分类和标签
- 搜索
- 评论（登录后评论）
- 用户后台（管理自己的内容）
- 管理员后台（全站管理）
- 三层权限体系（游客/注册用户/管理员）

### P1 重要功能
- 草稿箱、文章封面图、文章目录（TOC）
- 阅读量统计、点赞功能
- 评论回复（楼中楼）
- 文章归档、文章排序
- 用户头像、评论审核

### P2 增强功能
- 关于页面、友链页面
- RSS 订阅、防垃圾注册
- 创建管理员、站点设置

## 快速开始

### 后端

```bash
cd src/server
npm install
# 配置 .env 中的数据库连接
npx prisma generate
npx prisma migrate dev
npx prisma:seed    # 创建管理员账号 admin / Admin@123456
npm run start:dev  # 启动在 http://localhost:4000
```

### 前端

```bash
cd src/client
npm install
npm run dev        # 启动在 http://localhost:3000
```

## 部署

详见 [部署指南](docs/ops/deployment-guide.md)

## 文档索引

| 文档 | 路径 |
|------|------|
| 项目规范 | PROJECT_SPEC.md |
| 产品需求文档 | docs/PRD/PRD.md |
| 技术方案 | docs/architecture/tech-stack.md |
| 数据库设计 | docs/architecture/database-design.md |
| API 接口文档 | docs/architecture/api-design.md |
| 部署架构 | docs/architecture/deployment.md |
| 设计规范 | docs/design/design-system.md |
| 页面原型 | docs/design/wireframes.md |
| 测试报告 | docs/test/test-summary.md |
| 部署指南 | docs/ops/deployment-guide.md |
| 运维手册 | docs/ops/ops-manual.md |

## 默认管理员

- 用户名：admin
- 密码：Admin@123456
- **部署后请立即修改密码**
