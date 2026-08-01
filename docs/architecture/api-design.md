# API 接口文档

| 项目 | 内容 |
|------|------|
| 项目名称 | hdochub 个人技术博客 |
| 文档版本 | V1.0 |
| 编写日期 | 2026-07-28 |
| 编写人 | 架构师 |
| Base URL | `https://blog.hdochub.com/api` |
| 关联文档 | PRD.md、tech-stack.md、database-design.md |

---

## 1. 接口规范

### 1.1 RESTful 设计原则

| 原则 | 说明 |
|------|------|
| 资源导向 | URL 表示资源名词（复数），如 `/articles`、`/comments` |
| HTTP 语义 | GET 查询、POST 创建、PUT 更新（整体）、PATCH 更新（局部）、DELETE 删除 |
| 层级表达 | 嵌套关系用路径层级，如 `/articles/:slug/comments`（文章下的评论） |
| 语义化标识 | 文章/分类/标签用 `slug` 作为 URL 标识，用户/评论用 `id` |
| 状态码 | 2xx 成功、4xx 客户端错误、5xx 服务端错误 |
| 无状态 | JWT 鉴权，服务端不存 Session（Token 黑名单除外） |

### 1.2 统一响应格式

所有接口统一返回 JSON，结构如下：

**成功响应**：

```json
{
  "code": 0,
  "message": "success",
  "data": { }
}
```

**分页响应**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [ ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

**错误响应**：

```json
{
  "code": 40001,
  "message": "用户名或密码错误",
  "data": null
}
```

HTTP 状态码与业务 code 的关系：

- HTTP 200：业务成功（code=0）或可预期的业务错误（code 非 0）
- HTTP 401：未认证 / Token 失效
- HTTP 403：无权限
- HTTP 404：资源不存在
- HTTP 429：请求过于频繁（限流）
- HTTP 500：服务端异常

### 1.3 请求格式

- `Content-Type: application/json`（除文件上传外）
- 文件上传：`Content-Type: multipart/form-data`
- 分页参数：`?page=1&pageSize=10`（page 从 1 开始，pageSize 默认 10，最大 50）
- 排序参数：`?sort=-published_at`（`-` 前缀表示倒序，无前缀正序）
- 筛选参数：`?status=PUBLISHED&categoryId=1`

### 1.4 通用请求头

| Header | 说明 | 是否必填 |
|--------|------|----------|
| `Authorization` | `Bearer <JWT Token>`，登录后携带 | 受保护接口必填 |
| `X-Requested-With` | `XMLHttpRequest`，写操作 CSRF 防护校验 | 写操作必填 |
| `Content-Type` | `application/json` | POST/PUT/PATCH 必填 |

---

## 2. 认证机制设计（JWT）

### 2.1 认证流程

```
1. 用户登录 POST /api/auth/login
   → 校验账号密码 → 生成 JWT → 设置 HttpOnly Cookie + 返回 Token

2. 后续请求携带 Authorization: Bearer <token>
   → JwtAuthGuard 解析 Token → 校验黑名单 → 注入 req.user

3. 登出 POST /api/auth/logout
   → 将 Token 加入 Redis 黑名单（TTL = Token 剩余有效期）
```

### 2.2 JWT 结构

JWT Payload（负载）：

```json
{
  "sub": "1",              // 用户 ID
  "username": "admin",     // 用户名
  "role": "SUPER_ADMIN",   // 角色
  "iat": 1785256000,       // 签发时间
  "exp": 1785860800        // 过期时间（7 天后）
}
```

### 2.3 Token 有效期

| 场景 | 有效期 |
|------|--------|
| 默认登录 | 7 天 |
| 勾选「记住我」 | 30 天 |
| Token 黑名单 | 登出/改密码/封禁时加入，TTL = Token 剩余有效期 |

### 2.4 Token 存储与 CSRF 防护

- Token 通过 `HttpOnly + Secure + SameSite=Lax` 的 Cookie 下发，前端 JS 无法读取，防 XSS 窃取。
- 前端同时将 Token 存入内存（Pinia），用于 SSR 请求时从 Cookie 读取并转发。
- CSRF 防护：写操作接口校验请求头 `X-Requested-With: XMLHttpRequest`，该头无法被跨域表单伪造。

### 2.5 鉴权层级

| 层级 | 机制 | 说明 |
|------|------|------|
| 接口级鉴权 | `JwtAuthGuard`（全局默认开启） | 校验 Token 有效性，注入 `req.user` |
| 角色级鉴权 | `@Roles('ADMIN')` + `RolesGuard` | 校验角色权限矩阵 |
| 资源级鉴权 | Service 层校验资源归属 | 编辑文章时校验 `author_id === req.user.id` 或管理员身份 |

**装饰器约定**：

- `@Public()`：标记公开接口，跳过 JWT 校验（如登录、注册、文章列表）。
- `@Roles('USER')`：需登录用户（默认，登录即可）。
- `@Roles('ADMIN')`：需管理员（含 SUPER_ADMIN 与 ADMIN）。
- `@Roles('SUPER_ADMIN')`：仅超级管理员（创建管理员、站点设置）。
- `@CurrentUser()`：获取当前登录用户对象。

### 2.6 限流策略

| 接口 | 限流规则 | 实现 |
|------|----------|------|
| `POST /auth/login` | 5 次/分钟/IP | Redis 计数器 |
| `POST /auth/register` | 3 次/小时/IP | Redis 计数器 |
| `POST /comments` | 10 次/分钟/用户 | Redis 计数器 |
| 其余接口 | 60 次/分钟/IP | Redis 计数器 |

超限返回 HTTP 429：

```json
{
  "code": 42901,
  "message": "请求过于频繁，请稍后再试",
  "data": null
}
```

---

## 3. 接口列表

### 3.1 接口总览

| 模块 | 接口数 | 权限 |
|------|--------|------|
| 认证（auth） | 6 | 公开/登录 |
| 文章（articles） | 13 | 公开/登录/管理员 |
| 分类（categories） | 6 | 公开/管理员 |
| 标签（tags） | 5 | 公开/管理员 |
| 评论（comments） | 5 | 公开/登录/管理员 |
| 点赞（likes） | 3 | 公开/登录 |
| 用户资料（users） | 4 | 公开/登录 |
| 用户后台（dashboard） | 3 | 登录 |
| 管理员-用户（admin/users） | 5 | 管理员 |
| 管理员-文章（admin/articles） | 4 | 管理员 |
| 管理员-评论（admin/comments） | 3 | 管理员 |
| 站点设置（settings） | 2 | 公开/超管 |
| 友链（friend-links） | 4 | 公开/管理员 |
| 搜索（search） | 1 | 公开 |
| 归档（archive） | 1 | 公开 |
| 统计（stats） | 2 | 登录/管理员 |
| 文件上传（uploads） | 1 | 登录 |

---

### 3.2 认证模块（auth）

#### 3.2.1 注册

`POST /api/auth/register` `@Public`

限流：3 次/小时/IP

**请求体**：

```json
{
  "username": "engineer01",
  "email": "user@example.com",
  "password": "Pass1234",
  "confirmPassword": "Pass1234",
  "captcha": "ab3d"
}
```

| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|----------|
| username | string | 是 | 3-20 字符，字母数字下划线，唯一 |
| email | string | 是 | 合法邮箱格式，唯一 |
| password | string | 是 | 8-32 字符，含字母与数字 |
| confirmPassword | string | 是 | 与 password 一致 |
| captcha | string | 否 | P2 图形验证码，不区分大小写 |

**成功响应**（自动登录）：

```json
{
  "code": 0,
  "message": "注册成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 10,
      "username": "engineer01",
      "nickname": null,
      "avatar": null,
      "role": "USER",
      "email": "user@example.com"
    }
  }
}
```

#### 3.2.2 登录

`POST /api/auth/login` `@Public`

限流：5 次/分钟/IP

**请求体**：

```json
{
  "account": "engineer01",
  "password": "Pass1234",
  "remember": true
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| account | string | 是 | 用户名或邮箱 |
| password | string | 是 | 密码 |
| remember | boolean | 否 | 记住我，true 时 Token 有效期 30 天 |

**成功响应**：

```json
{
  "code": 0,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 10,
      "username": "engineer01",
      "nickname": "工程师小明",
      "avatar": "https://blog.hdochub.com/uploads/avatar/10.png",
      "role": "USER",
      "email": "user@example.com"
    }
  }
}
```

同时通过 `Set-Cookie` 下发 HttpOnly Cookie。

**错误**：账号锁定返回 code=40003，连续失败 5 次后锁定 15 分钟。

#### 3.2.3 登出

`POST /api/auth/logout` `@Roles('USER')`

将当前 Token 加入 Redis 黑名单。

**成功响应**：

```json
{ "code": 0, "message": "登出成功", "data": null }
```

#### 3.2.4 获取当前用户信息

`GET /api/auth/me` `@Roles('USER')`

**成功响应**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 10,
    "username": "engineer01",
    "nickname": "工程师小明",
    "email": "user@example.com",
    "avatar": "https://...",
    "bio": "后端工程师",
    "role": "USER",
    "articleCount": 12,
    "commentCount": 45
  }
}
```

#### 3.2.5 修改密码

`PUT /api/auth/password` `@Roles('USER')`

需重新验证原密码（敏感操作）。

**请求体**：

```json
{
  "oldPassword": "Pass1234",
  "newPassword": "NewPass5678",
  "confirmPassword": "NewPass5678"
}
```

**成功响应**：

```json
{ "code": 0, "message": "密码修改成功，请重新登录", "data": null }
```

修改成功后旧 Token 全部失效（加入黑名单），前端跳转登录页。

#### 3.2.6 刷新 Token（可选）

`POST /api/auth/refresh` `@Roles('USER')`

用有效 Token 换取新 Token（续期），前端在 Token 即将过期前调用。

**成功响应**：

```json
{
  "code": 0,
  "message": "success",
  "data": { "token": "eyJhbGciOiJIUzI1NiIs..." }
}
```

---

### 3.3 文章模块（articles）

#### 3.3.1 文章列表（公开）

`GET /api/articles` `@Public`

**查询参数**：

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| page | number | 1 | 页码 |
| pageSize | number | 10 | 每页条数（受站点设置控制） |
| sort | string | -published_at | 排序：`-published_at`（时间倒序）、`-view_count`（阅读量） |
| categoryId | number | - | 按分类筛选 |
| tagId | number | - | 按标签筛选 |
| categorySlug | string | - | 按分类 slug 筛选 |
| tagSlug | string | - | 按标签 slug 筛选 |

**成功响应**（仅返回已发布文章）：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "title": "Nginx 502 排查记录",
        "slug": "nginx-502-fix",
        "summary": "本文记录一次线上 Nginx 502...",
        "coverImage": "https://...",
        "category": { "id": 1, "name": "技术问题", "slug": "tech-issue" },
        "tags": [
          { "id": 2, "name": "Nginx", "slug": "nginx" },
          { "id": 3, "name": "网络", "slug": "network" }
        ],
        "author": { "id": 1, "username": "admin", "nickname": "博主", "avatar": "https://..." },
        "viewCount": 1234,
        "likeCount": 56,
        "commentCount": 8,
        "publishedAt": "2026-07-20T10:00:00.000Z"
      }
    ],
    "pagination": { "page": 1, "pageSize": 10, "total": 100, "totalPages": 10 }
  }
}
```

#### 3.3.2 文章详情（公开）

`GET /api/articles/:slug` `@Public`

访问时触发阅读量去重统计（Redis）。

**成功响应**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "title": "Nginx 502 排查记录",
    "slug": "nginx-502-fix",
    "content": "## 背景\n\n线上服务突然返回 502...",
    "contentHtml": "<h2>背景</h2><p>线上服务突然返回 502...</p>",
    "summary": "本文记录一次线上 Nginx 502...",
    "coverImage": "https://...",
    "category": { "id": 1, "name": "技术问题", "slug": "tech-issue" },
    "tags": [ { "id": 2, "name": "Nginx", "slug": "nginx" } ],
    "author": { "id": 1, "username": "admin", "nickname": "博主", "avatar": "https://..." },
    "status": "PUBLISHED",
    "viewCount": 1235,
    "likeCount": 56,
    "commentCount": 8,
    "wordCount": 1500,
    "readTime": 5,
    "isLiked": false,
    "publishedAt": "2026-07-20T10:00:00.000Z",
    "createdAt": "2026-07-19T08:00:00.000Z",
    "updatedAt": "2026-07-20T10:00:00.000Z"
  }
}
```

- `isLiked`：当前登录用户是否已点赞（未登录为 false）。
- `readTime`：预计阅读时长（分钟）。
- `contentHtml` 为预渲染 HTML，前端可直接展示（代码高亮已渲染）。

#### 3.3.3 相关文章推荐

`GET /api/articles/:slug/related` `@Public`

返回同分类或同标签的文章（最多 5 篇）。

**成功响应**：

```json
{
  "code": 0,
  "message": "success",
  "data": [
    { "id": 5, "title": "...", "slug": "...", "summary": "...", "coverImage": "..." }
  ]
}
```

#### 3.3.4 上一页/下一页

`GET /api/articles/:slug/adjacent` `@Public`

**成功响应**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "prev": { "id": 2, "title": "...", "slug": "..." },
    "next": { "id": 4, "title": "...", "slug": "..." }
  }
}
```

#### 3.3.5 创建文章

`POST /api/articles` `@Roles('USER')`

**请求体**：

```json
{
  "title": "Docker 容器无法启动的解决过程",
  "content": "## 问题\n\n容器启动后立即退出...",
  "summary": "记录 Docker 容器启动失败排查",
  "categoryId": 1,
  "tags": ["Docker", "Linux"],
  "coverImage": "https://...",
  "status": "PUBLISHED"
}
```

| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|----------|
| title | string | 是 | 1-100 字符 |
| content | string | 是 | 最少 10 字符 |
| summary | string | 否 | 为空取正文前 200 字 |
| categoryId | number | 是 | 必须为已存在分类 |
| tags | string[] | 否 | 每篇最多 10 个，每个 2-20 字符；不存在则自动创建 |
| coverImage | string | 否 | 封面图 URL |
| status | string | 是 | `DRAFT` 或 `PUBLISHED` |

**成功响应**：

```json
{
  "code": 0,
  "message": "文章发布成功",
  "data": {
    "id": 101,
    "slug": "docker-container-start-fix",
    "status": "PUBLISHED",
    "publishedAt": "2026-07-28T12:00:00.000Z"
  }
}
```

#### 3.3.6 更新文章

`PUT /api/articles/:id` `@Roles('USER')`

资源级鉴权：仅作者本人或管理员可编辑。

**请求体**：同 3.3.5，所有字段可选。

**成功响应**：返回更新后的文章对象。

#### 3.3.7 删除文章

`DELETE /api/articles/:id` `@Roles('USER')`

资源级鉴权：仅作者本人或管理员。硬删除，删除前前端二次确认。

**成功响应**：

```json
{ "code": 0, "message": "文章已删除", "data": null }
```

#### 3.3.8 发布草稿

`PUT /api/articles/:id/publish` `@Roles('USER')`

将草稿转为已发布。首次发布设置 `published_at`。

**请求体**：无

**成功响应**：

```json
{ "code": 0, "message": "文章已发布", "data": { "id": 101, "status": "PUBLISHED", "publishedAt": "2026-07-28T12:00:00.000Z" } }
```

#### 3.3.9 转为草稿

`PUT /api/articles/:id/unpublish` `@Roles('USER')`

将已发布文章转为草稿（撤回）。

**成功响应**：

```json
{ "code": 0, "message": "文章已转为草稿", "data": { "id": 101, "status": "DRAFT" } }
```

#### 3.3.10 我的文章列表

`GET /api/dashboard/articles` `@Roles('USER')`

仅返回当前用户的文章（含草稿、已下架）。

**查询参数**：

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| page | number | 1 | 页码 |
| pageSize | number | 20 | 每页条数 |
| status | string | - | 筛选：`DRAFT`/`PUBLISHED`/`ARCHIVED` |

**成功响应**：同 3.3.1 列表格式，但含全部状态文章。

#### 3.3.11 热门文章 Top N

`GET /api/articles/hot` `@Public`

按阅读量排序的热门文章（默认 5 篇，用于侧边栏）。

**查询参数**：`limit`（默认 5，最大 20）

**成功响应**：

```json
{
  "code": 0,
  "message": "success",
  "data": [
    { "id": 1, "title": "...", "slug": "...", "viewCount": 5000 }
  ]
}
```

#### 3.3.12 归档列表

`GET /api/archive` `@Public`

按年月分组返回已发布文章。

**成功响应**：

```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "year": 2026,
      "months": [
        {
          "month": 7,
          "articles": [
            { "id": 1, "title": "...", "slug": "...", "publishedAt": "2026-07-20T10:00:00.000Z" }
          ]
        }
      ]
    }
  ]
}
```

#### 3.3.13 搜索文章

`GET /api/search` `@Public`

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| q | string | 是 | 关键词 |
| page | number | 否 | 默认 1 |
| pageSize | number | 否 | 默认 10 |

**成功响应**：同文章列表，额外返回高亮字段：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "title": "Nginx <em>502</em> 排查记录",
        "summary": "...返回 <em>502</em> 错误...",
        "slug": "nginx-502-fix"
      }
    ],
    "pagination": { "page": 1, "pageSize": 10, "total": 5, "totalPages": 1 }
  }
}
```

---

### 3.4 分类模块（categories）

#### 3.4.1 分类列表（公开）

`GET /api/categories` `@Public`

返回所有分类及文章数，按 sort 排序。

**成功响应**：

```json
{
  "code": 0,
  "message": "success",
  "data": [
    { "id": 1, "name": "技术问题", "slug": "tech-issue", "description": "...", "articleCount": 30, "sort": 1 }
  ]
}
```

#### 3.4.2 创建分类

`POST /api/admin/categories` `@Roles('ADMIN')`

**请求体**：

```json
{ "name": "技术问题", "slug": "tech-issue", "description": "技术问题与解决方案", "sort": 1 }
```

#### 3.4.3 更新分类

`PUT /api/admin/categories/:id` `@Roles('ADMIN')`

**请求体**：`name`、`slug`、`description`、`sort` 均可选。

#### 3.4.4 删除分类

`DELETE /api/admin/categories/:id` `@Roles('ADMIN')`

分类下有文章时返回错误（需先迁移文章）：

```json
{ "code": 40009, "message": "该分类下还有 30 篇文章，无法删除，请先迁移", "data": null }
```

#### 3.4.5 调整分类排序

`PUT /api/admin/categories/sort` `@Roles('ADMIN')`

**请求体**：

```json
{ "items": [ { "id": 1, "sort": 1 }, { "id": 2, "sort": 2 } ] }
```

#### 3.4.6 分类详情（公开）

`GET /api/categories/:slug` `@Public`

---

### 3.5 标签模块（tags）

#### 3.5.1 标签列表（公开）

`GET /api/tags` `@Public`

返回所有标签及文章数，用于标签云。

**查询参数**：`keyword`（模糊搜索，用于发布时自动补全）

**成功响应**：

```json
{
  "code": 0,
  "message": "success",
  "data": [
    { "id": 2, "name": "Nginx", "slug": "nginx", "articleCount": 15 }
  ]
}
```

#### 3.5.2 更新标签名

`PUT /api/admin/tags/:id` `@Roles('ADMIN')`

**请求体**：`{ "name": "Docker" }`

#### 3.5.3 合并标签

`POST /api/admin/tags/merge` `@Roles('ADMIN')`

将源标签合并到目标标签，源标签删除，关联文章转移到目标标签。

**请求体**：

```json
{ "sourceId": 5, "targetId": 2 }
```

#### 3.5.4 删除标签

`DELETE /api/admin/tags/:id` `@Roles('ADMIN')`

删除后从关联文章移除该标签，文章不删除。

#### 3.5.5 标签详情（公开）

`GET /api/tags/:slug` `@Public`

---

### 3.6 评论模块（comments）

#### 3.6.1 文章评论列表（公开）

`GET /api/articles/:slug/comments` `@Public`

返回该文章下所有已发布评论，按时间正序，含楼中楼嵌套结构。

**查询参数**：`page`、`pageSize`

**成功响应**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "content": "这篇文章很有帮助！",
        "contentHtml": "<p>这篇文章很有帮助！</p>",
        "floor": 1,
        "depth": 0,
        "user": { "id": 10, "username": "engineer01", "nickname": "工程师小明", "avatar": "https://..." },
        "createdAt": "2026-07-21T09:00:00.000Z",
        "replies": [
          {
            "id": 2,
            "content": "感谢支持！",
            "depth": 1,
            "user": { "id": 1, "username": "admin", "nickname": "博主", "avatar": "..." },
            "replyToUser": { "id": 10, "nickname": "工程师小明" },
            "createdAt": "2026-07-21T10:00:00.000Z",
            "replies": []
          }
        ]
      }
    ],
    "pagination": { "page": 1, "pageSize": 20, "total": 8, "totalPages": 1 }
  }
}
```

#### 3.6.2 发表评论

`POST /api/articles/:slug/comments` `@Roles('USER')`

限流：10 次/分钟/用户

**请求体**：

```json
{
  "content": "代码示例很清晰，收藏了",
  "parentId": 1,
  "replyToUserId": 10
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| content | string | 是 | 1-500 字符，支持基础 Markdown |
| parentId | number | 否 | 回复的父评论 ID，为空为顶级评论 |
| replyToUserId | number | 否 | 被回复用户 ID（楼中楼 @某人） |

**成功响应**：

```json
{
  "code": 0,
  "message": "评论成功",
  "data": {
    "id": 3,
    "content": "代码示例很清晰，收藏了",
    "contentHtml": "<p>代码示例很清晰，收藏了</p>",
    "depth": 1,
    "status": "PUBLISHED",
    "createdAt": "2026-07-21T11:00:00.000Z"
  }
}
```

若开启评论审核，`status` 返回 `PENDING`，提示「评论待审核」。

#### 3.6.3 删除评论

`DELETE /api/comments/:id` `@Roles('USER')`

资源级鉴权：仅评论者本人或管理员可删。软删除（status=DELETED），子回复保留。

#### 3.6.4 我收到的评论

`GET /api/dashboard/comments` `@Roles('USER')`

返回他人对当前用户文章的评论与回复。

**成功响应**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 5,
        "content": "写得好！",
        "article": { "id": 1, "title": "Nginx 502 排查", "slug": "nginx-502-fix" },
        "user": { "id": 10, "nickname": "工程师小明", "avatar": "..." },
        "createdAt": "2026-07-21T09:00:00.000Z"
      }
    ],
    "pagination": { ... }
  }
}
```

#### 3.6.5 我发表的评论

`GET /api/dashboard/comments/mine` `@Roles('USER')`

返回当前用户在他人文章下发表的评论。

---

### 3.7 点赞模块（likes）

#### 3.7.1 点赞文章

`POST /api/articles/:id/like` `@Roles('USER')`

每用户每篇仅可赞一次（唯一约束），重复点赞返回已点赞提示。

**成功响应**：

```json
{ "code": 0, "message": "点赞成功", "data": { "likeCount": 57, "isLiked": true } }
```

#### 3.7.2 取消点赞

`DELETE /api/articles/:id/like` `@Roles('USER')`

**成功响应**：

```json
{ "code": 0, "message": "已取消点赞", "data": { "likeCount": 55, "isLiked": false } }
```

#### 3.7.3 查询点赞状态

`GET /api/articles/:id/like` `@Roles('USER')`

**成功响应**：

```json
{ "code": 0, "message": "success", "data": { "isLiked": true } }
```

---

### 3.8 用户资料模块（users）

#### 3.8.1 用户主页（公开）

`GET /api/users/:username` `@Public`

展示用户公开信息与已发布文章。

**成功响应**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 10,
    "username": "engineer01",
    "nickname": "工程师小明",
    "avatar": "https://...",
    "bio": "后端工程师",
    "articleCount": 12,
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
}
```

#### 3.8.2 更新个人资料

`PUT /api/dashboard/profile` `@Roles('USER')`

**请求体**：

```json
{ "nickname": "工程师小明", "bio": "后端工程师，热爱开源" }
```

| 字段 | 类型 | 校验 |
|------|------|------|
| nickname | string | 1-20 字符 |
| bio | string | 最多 200 字符 |

#### 3.8.3 上传头像

`POST /api/dashboard/avatar` `@Roles('USER')`

`multipart/form-data`，字段 `file`。

**成功响应**：

```json
{ "code": 0, "message": "头像上传成功", "data": { "avatar": "https://.../avatar/10.png" } }
```

#### 3.8.4 用户主页文章

`GET /api/users/:username/articles` `@Public`

返回该用户已发布文章列表，同文章列表格式。

---

### 3.9 用户后台模块（dashboard）

#### 3.9.1 个人统计概览

`GET /api/dashboard/stats` `@Roles('USER')`

**成功响应**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "articleCount": 12,
    "totalViewCount": 12340,
    "totalLikeCount": 234,
    "commentCount": 45
  }
}
```

> 文章管理（3.3.10）、评论管理（3.6.4/3.6.5）、资料（3.8.2/3.8.3）见对应模块。

---

### 3.10 管理员-用户模块（admin/users）

#### 3.10.1 用户列表

`GET /api/admin/users` `@Roles('ADMIN')`

**查询参数**：`page`、`pageSize`、`role`、`status`

**成功响应**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 10,
        "username": "engineer01",
        "email": "user@example.com",
        "nickname": "工程师小明",
        "role": "USER",
        "status": "ACTIVE",
        "articleCount": 12,
        "commentCount": 45,
        "createdAt": "2026-01-01T00:00:00.000Z"
      }
    ],
    "pagination": { ... }
  }
}
```

#### 3.10.2 修改用户角色

`PUT /api/admin/users/:id/role` `@Roles('SUPER_ADMIN')`

**请求体**：`{ "role": "ADMIN" }`

仅超级管理员可操作。不可降级或封禁超级管理员。

#### 3.10.3 封禁用户

`PUT /api/admin/users/:id/ban` `@Roles('ADMIN')`

封禁后用户无法登录、无法发言，历史文章保留。

**成功响应**：

```json
{ "code": 0, "message": "用户已封禁", "data": { "id": 10, "status": "BANNED" } }
```

#### 3.10.4 解封用户

`PUT /api/admin/users/:id/unban` `@Roles('ADMIN')`

#### 3.10.5 重置用户密码

`POST /api/admin/users/:id/reset-password` `@Roles('ADMIN')`

**成功响应**：返回临时密码（用户需登录后修改）。

```json
{ "code": 0, "message": "密码已重置", "data": { "tempPassword": "Temp1234" } }
```

#### 3.10.6 创建管理员（P2）

`POST /api/admin/users` `@Roles('SUPER_ADMIN')`

**请求体**：

```json
{ "username": "moderator", "email": "mod@example.com", "password": "Pass1234", "role": "ADMIN" }
```

---

### 3.11 管理员-文章模块（admin/articles）

#### 3.11.1 全站文章列表

`GET /api/admin/articles` `@Roles('ADMIN')`

**查询参数**：`page`、`pageSize`、`title`（搜索）、`authorId`、`categoryId`、`status`、`startDate`、`endDate`

**成功响应**：文章列表含作者、分类、状态、各项计数。

#### 3.11.2 下架文章

`PUT /api/admin/articles/:id/archive` `@Roles('ADMIN')`

```json
{ "code": 0, "message": "文章已下架", "data": { "id": 1, "status": "ARCHIVED" } }
```

#### 3.11.3 恢复上架

`PUT /api/admin/articles/:id/restore` `@Roles('ADMIN')`

```json
{ "code": 0, "message": "文章已恢复上架", "data": { "id": 1, "status": "PUBLISHED" } }
```

#### 3.11.4 批量操作

`POST /api/admin/articles/batch` `@Roles('ADMIN')`

**请求体**：

```json
{ "ids": [1, 2, 3], "action": "archive" }
```

`action` 取值：`archive`（下架）、`restore`（恢复）、`delete`（删除）。

---

### 3.12 管理员-评论模块（admin/comments）

#### 3.12.1 全站评论列表

`GET /api/admin/comments` `@Roles('ADMIN')`

**查询参数**：`page`、`pageSize`、`status`（PENDING/PUBLISHED/DELETED）、`articleId`、`startDate`、`endDate`

**成功响应**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 5,
        "content": "...",
        "article": { "id": 1, "title": "..." },
        "user": { "id": 10, "nickname": "..." },
        "replyToUser": { "id": 1, "nickname": "..." },
        "status": "PENDING",
        "createdAt": "2026-07-21T09:00:00.000Z"
      }
    ],
    "pagination": { ... }
  }
}
```

#### 3.12.2 审核通过评论

`PUT /api/admin/comments/:id/approve` `@Roles('ADMIN')`

```json
{ "code": 0, "message": "评论已通过审核", "data": { "id": 5, "status": "PUBLISHED" } }
```

#### 3.12.3 删除评论

`DELETE /api/admin/comments/:id` `@Roles('ADMIN')`

---

### 3.13 站点设置模块（settings）

#### 3.13.1 获取站点设置（公开）

`GET /api/settings` `@Public`

返回前台可见的站点配置（不含敏感项）。

**成功响应**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "siteTitle": "hdochub 个人技术博客",
    "siteSubtitle": "记录技术问题与思考",
    "siteDescription": "面向工程师的个人技术博客",
    "siteIcp": "京ICP备XXXXXXXX号",
    "siteUrl": "https://blog.hdochub.com",
    "pageSize": 10,
    "registrationEnabled": true
  }
}
```

#### 3.13.2 更新站点设置

`PUT /api/admin/settings` `@Roles('SUPER_ADMIN')`

**请求体**：

```json
{
  "siteTitle": "hdochub 个人技术博客",
  "siteSubtitle": "...",
  "siteDescription": "...",
  "siteIcp": "...",
  "commentReviewEnabled": false,
  "registrationEnabled": true,
  "pageSize": 10,
  "adminPath": "admin",
  "aboutContent": "# 关于博主\n\n..."
}
```

更新后刷新缓存。修改 `adminPath` 后管理员后台路径变更，前端同步更新路由。

---

### 3.14 友链模块（friend-links）

#### 3.14.1 友链列表（公开）

`GET /api/friend-links` `@Public`

返回可见友链，按 sort 排序。

**成功响应**：

```json
{
  "code": 0,
  "message": "success",
  "data": [
    { "id": 1, "name": "友站A", "url": "https://a.com", "description": "...", "logo": "https://..." }
  ]
}
```

#### 3.14.2 创建友链

`POST /api/admin/friend-links` `@Roles('ADMIN')`

**请求体**：`{ "name": "友站A", "url": "https://a.com", "description": "...", "logo": "...", "sort": 1 }`

#### 3.14.3 更新友链

`PUT /api/admin/friend-links/:id` `@Roles('ADMIN')`

#### 3.14.4 删除友链

`DELETE /api/admin/friend-links/:id` `@Roles('ADMIN')`

---

### 3.15 统计模块（stats）

#### 3.15.1 管理员概览统计

`GET /api/admin/stats` `@Roles('ADMIN')`

**成功响应**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "articleCount": 100,
    "userCount": 50,
    "commentCount": 300,
    "todayViewCount": 1200,
    "todayNewUsers": 3,
    "pendingCommentCount": 5
  }
}
```

#### 3.15.2 用户个人统计

见 3.9.1。

---

### 3.16 文件上传模块（uploads）

#### 3.16.1 上传图片

`POST /api/uploads` `@Roles('USER')`

`multipart/form-data`，字段 `file`，可选 `purpose`（AVATAR/COVER/ARTICLE）。

**安全校验**：
- MIME 白名单：`image/jpeg`、`image/png`、`image/gif`、`image/webp`
- 文件头校验（防伪造 MIME）
- 单文件 ≤ 5MB
- 上传目录禁止执行权限
- 文件名重命名（UUID + 原扩展名）

**成功响应**：

```json
{
  "code": 0,
  "message": "上传成功",
  "data": {
    "url": "https://blog.hdochub.com/uploads/2026/07/abc123.png",
    "fileName": "abc123.png",
    "size": 204800,
    "width": 800,
    "height": 600
  }
}
```

---

## 4. 错误码定义

### 4.1 错误码规则

错误码为 5 位数字，前两位表示错误类别：

| 前缀 | 类别 | HTTP 状态 |
|------|------|-----------|
| `00` | 成功 | 200 |
| `40` | 客户端通用错误（参数/校验） | 400 |
| `401` | 认证错误 | 401 |
| `403` | 权限错误 | 403 |
| `404` | 资源不存在 | 404 |
| `409` | 冲突（重复操作） | 409 |
| `429` | 限流 | 429 |
| `50` | 服务端错误 | 500 |

### 4.2 错误码列表

| code | message | 说明 | HTTP |
|------|---------|------|------|
| 0 | success | 成功 | 200 |
| 40000 | 请求参数错误 | 参数缺失/类型错误 | 400 |
| 40001 | {字段}格式不正确 | 字段校验失败（动态填充字段名） | 400 |
| 40002 | 标题长度需在 1-100 字符之间 | 文章标题校验 | 400 |
| 40003 | 账号已锁定，请 15 分钟后重试 | 登录失败 5 次锁定 | 400 |
| 40004 | 用户名或密码错误 | 登录失败（统一提示，不暴露具体） | 400 |
| 40005 | 原密码不正确 | 修改密码时原密码错误 | 400 |
| 40006 | 用户名已被占用 | 注册时用户名重复 | 400 |
| 40007 | 邮箱已被注册 | 注册时邮箱重复 | 400 |
| 40008 | 验证码错误 | P2 图形验证码错误 | 400 |
| 40009 | 该分类下还有文章，无法删除 | 删除非空分类 | 400 |
| 40010 | 每篇文章最多 10 个标签 | 标签数量超限 | 400 |
| 40011 | 注册已关闭 | 站点关闭注册 | 400 |
| 40101 | 未登录或登录已过期 | 缺少/无效 Token | 401 |
| 40102 | Token 已失效，请重新登录 | Token 在黑名单 | 401 |
| 40301 | 无权操作此资源 | 资源归属校验失败 | 403 |
| 40302 | 需要管理员权限 | 非管理员访问管理接口 | 403 |
| 40303 | 需要超级管理员权限 | 非超管访问超管接口 | 403 |
| 40304 | 账号已被封禁 | 封禁用户尝试操作 | 403 |
| 40305 | 不可操作超级管理员 | 对超管执行封禁/降级 | 403 |
| 40401 | 文章不存在 | 文章 slug/id 无效 | 404 |
| 40402 | 分类不存在 | - | 404 |
| 40403 | 标签不存在 | - | 404 |
| 40404 | 评论不存在 | - | 404 |
| 40405 | 用户不存在 | - | 404 |
| 40901 | 已点赞，请勿重复操作 | 重复点赞 | 409 |
| 40902 | 评论内容重复 | 短时间重复评论 | 409 |
| 41301 | 文件大小超过限制（最大 5MB） | 上传文件过大 | 413 |
| 41501 | 不支持的文件类型 | 上传格式不在白名单 | 415 |
| 42901 | 请求过于频繁，请稍后再试 | 接口限流 | 429 |
| 50000 | 服务器内部错误 | 未捕获异常 | 500 |
| 50001 | 数据库操作失败 | DB 异常 | 500 |
| 50002 | 文件上传失败 | 存储异常 | 500 |
| 50003 | Markdown 渲染失败 | 渲染异常 | 500 |

### 4.3 错误处理规范

- 后端通过 `HttpExceptionFilter` 统一捕获异常，将业务异常映射为上述 code + message。
- 参数校验错误（class-validator）统一映射为 code=40001，message 动态拼接字段名与校验规则。
- 未捕获异常返回 code=50000，记录完整堆栈到日志，对外仅返回通用提示。
- 前端根据 code 做差异化处理：401xx 跳转登录、403xx 提示无权限、429xx 提示稍后重试。

---

## 5. 接口权限矩阵汇总

| 接口 | 游客 | 注册用户 | 管理员 | 超管 |
|------|------|----------|--------|------|
| 文章列表/详情/搜索/归档/热门 | ✓ | ✓ | ✓ | ✓ |
| 分类/标签/友链列表 | ✓ | ✓ | ✓ | ✓ |
| RSS/Sitemap | ✓ | ✓ | ✓ | ✓ |
| 注册/登录 | ✓ | - | - | - |
| 发表/编辑/删除文章 | - | ✓（自己） | ✓（全部） | ✓ |
| 评论列表 | ✓ | ✓ | ✓ | ✓ |
| 发表/删除评论 | - | ✓（自己） | ✓（全部） | ✓ |
| 点赞/取消 | - | ✓ | ✓ | ✓ |
| 个人后台 | - | ✓（自己） | ✓ | ✓ |
| 分类/标签管理 | - | - | ✓ | ✓ |
| 文章下架/恢复/批量 | - | - | ✓ | ✓ |
| 评论审核/删除 | - | - | ✓ | ✓ |
| 用户封禁/解封/重置密码 | - | - | ✓ | ✓ |
| 创建管理员 | - | - | - | ✓ |
| 修改用户角色 | - | - | - | ✓ |
| 站点设置 | - | - | - | ✓ |
| 文件上传 | - | ✓ | ✓ | ✓ |

---

## 6. 补充说明

### 6.1 RSS 与 Sitemap

RSS feed 与 sitemap.xml 由 Nuxt 服务端路由生成（非 REST API），路径：

- `GET /rss.xml`：全站 RSS 2.0 feed，输出最新 20 篇已发布文章
- `GET /sitemap.xml`：站点地图，包含所有公开页面与文章 URL
- `GET /rss/:categorySlug.xml`：按分类订阅（P2）

这些路由在后端调用文章列表接口获取数据，按 RSS 2.0 / sitemap 规范输出 XML。

### 6.2 幂等性

- `POST` 接口（点赞、评论）通过唯一约束或限流防止重复提交。
- 前端对写操作按钮做防抖与 loading 禁用，避免重复请求。
- 删除接口天然幂等（删除不存在的资源返回成功）。

### 6.3 版本兼容

- API 路径暂不加版本前缀（个人博客，迭代可控）。
- 如后续存在不兼容变更，引入 `/api/v2/` 前缀，v1 保留过渡期。

---

> 本文档为 API 设计基线。接口变更须先更新本文档并通知前端，保持前后端契约一致。
