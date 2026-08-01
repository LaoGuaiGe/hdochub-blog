# 缺陷报告

| 项目 | 内容 |
|------|------|
| 项目名称 | hdochub 个人技术博客 |
| 文档版本 | V1.1（回归后更新） |
| 编写日期 | 2026-07-28 |
| 编写人 | 测试工程师 |

---

## 缺陷总览

> 第一轮回归测试后更新：BUG-001 ~ BUG-025 共 23 个原缺陷中 22 个已修复，1 个修复不完整；新增 BUG-026（Critical）。

| 严重程度 | 原数量 | 已修复 | 未修复/新增 | 当前剩余 |
|----------|--------|--------|-------------|----------|
| Critical | 8 | 7 | 1（BUG-001 不完整 + BUG-026 新增） | 1 |
| Major | 12 | 12 | 0 | 0 |
| Minor | 3 | 3 | 0 | 0 |
| **合计** | **23** | **22** | **1** | **1** |

---

## Critical 级别缺陷

### BUG-001 修改密码 API 前后端路径不一致

| 项 | 内容 |
|----|------|
| 缺陷ID | BUG-001 |
| 模块 | 认证 |
| 严重程度 | Critical |
| 描述 | 前端调用修改密码的 API 路径为 `PUT /users/password`，但后端实际路径为 `PUT /auth/password`，导致修改密码功能完全不可用 |
| 复现步骤 | 1. 登录用户访问 /dashboard/profile<br>2. 填写原密码、新密码并提交<br>3. 前端发送 PUT /api/users/password<br>4. 后端无此路由，返回 404 |
| 涉及文件 | 前端：`/workspace/src/client/utils/api.ts` 第 84 行<br>后端：`/workspace/src/server/src/modules/auth/auth.controller.ts` 第 64 行 |
| 修复建议 | 将前端 `userApi.changePassword` 的路径从 `/users/password` 改为 `/auth/password` |
| 修复状态 | 部分修复（路径已改，但调用方未传 confirmPassword，见 BUG-026） |

### BUG-002 分页响应数据结构前后端不一致

| 项 | 内容 |
|----|------|
| 缺陷ID | BUG-002 |
| 模块 | 全局 |
| 严重程度 | Critical |
| 描述 | 后端返回的分页数据结构为 `{ list, pagination: { page, pageSize, total, totalPages } }`，但前端期望的结构为 `{ list, total, page, pageSize, totalPages }`（平铺）。前端读取 `data.total`、`data.totalPages` 等字段会得到 `undefined`，导致所有分页功能（文章列表、评论列表、用户列表等）的页码计算错误 |
| 复现步骤 | 1. 访问首页文章列表<br>2. 检查 API 响应：后端返回 `{ list: [...], pagination: { total: 100, totalPages: 10, ... } }`<br>3. 前端 Paginated<T> 类型期望 `total` 在顶层<br>4. 前端 `totalPages` 计算为 `undefined`，分页组件不显示页码 |
| 涉及文件 | 后端：`/workspace/src/server/src/common/dto/pagination.dto.ts` 第 56-71 行<br>前端：`/workspace/src/client/types/index.ts` 第 18-24 行 |
| 修复建议 | 方案一（推荐）：修改后端 `paginate()` 函数，将分页信息平铺到顶层<br>方案二：修改前端 `Paginated<T>` 类型和所有使用处，改为读取 `pagination` 嵌套对象 |
| 修复状态 | 已修复（第一轮回归验证通过） |

### BUG-003 搜索 API 参数名前后端不一致

| 项 | 内容 |
|----|------|
| 缺陷ID | BUG-003 |
| 模块 | 文章 |
| 严重程度 | Critical |
| 描述 | 前端搜索 API 使用 `keyword` 作为查询参数，但后端期望 `q` 参数，导致搜索功能无法传递关键词 |
| 复现步骤 | 1. 在搜索框输入关键词并搜索<br>2. 前端发送 GET /api/search?keyword=xxx<br>3. 后端读取 @Query('q')，得到 undefined<br>4. 搜索结果不正确 |
| 涉及文件 | 前端：`/workspace/src/client/utils/api.ts` 第 98 行<br>后端：`/workspace/src/server/src/modules/articles/articles.controller.ts` 第 133 行 |
| 修复建议 | 统一参数名。推荐将后端 `@Query('q')` 改为 `@Query('keyword')`，或修改前端使用 `q` |
| 修复状态 | 已修复（第一轮回归验证通过） |

### BUG-004 "我的文章"API 路径前后端不一致

| 项 | 内容 |
|----|------|
| 缺陷ID | BUG-004 |
| 模块 | 文章 |
| 严重程度 | Critical |
| 描述 | 前端 `articleApi.mine` 调用 `GET /articles/mine`，但后端实际路径为 `GET /dashboard/articles`，导致用户后台"我的文章"页面无法加载文章列表 |
| 复现步骤 | 1. 登录用户访问 /dashboard/posts<br>2. 前端发送 GET /api/articles/mine<br>3. 后端无此路由，返回 404<br>4. 页面显示空列表 |
| 涉及文件 | 前端：`/workspace/src/client/utils/api.ts` 第 38 行<br>后端：`/workspace/src/server/src/modules/articles/articles.controller.ts` 第 113 行 |
| 修复建议 | 将前端 `articleApi.mine` 路径从 `/articles/mine` 改为 `/dashboard/articles` |
| 修复状态 | 已修复（第一轮回归验证通过） |

### BUG-005 文章下架/恢复 API 路径前后端不一致

| 项 | 内容 |
|----|------|
| 缺陷ID | BUG-005 |
| 模块 | 文章 |
| 严重程度 | Critical |
| 描述 | 前端 `articleApi.offline` 调用 `PUT /articles/:id/offline`，`articleApi.restore` 调用 `PUT /articles/:id/restore`，但后端实际路径分别为 `PUT /admin/articles/:id/archive` 和 `PUT /admin/articles/:id/restore`，导致管理员下架/恢复文章功能失败 |
| 复现步骤 | 1. 管理员访问 /admin/posts<br>2. 点击"下架"按钮<br>3. 前端发送 PUT /api/articles/1/offline<br>4. 后端返回 404 |
| 涉及文件 | 前端：`/workspace/src/client/utils/api.ts` 第 39-40 行<br>后端：`/workspace/src/server/src/modules/articles/articles.controller.ts` 第 153-163 行 |
| 修复建议 | 将前端路径修改为：`offline` -> `/admin/articles/:id/archive`，`restore` -> `/admin/articles/:id/restore` |
| 修复状态 | 已修复（第一轮回归验证通过） |

### BUG-006 文章状态切换逻辑错误

| 项 | 内容 |
|----|------|
| 缺陷ID | BUG-006 |
| 模块 | 文章 |
| 严重程度 | Critical |
| 描述 | 前端 dashboard/posts.vue 的 `handleToggleStatus` 函数将整个 article 对象（包含 id、slug、authorName 等不属于 DTO 的字段）作为 update payload 传给后端，且后端 DTO 的 status 字段只允许 `DRAFT` 或 `PUBLISHED`，无法实现"已发布"和"草稿"之间的切换。另外，该函数对所有非 PUBLISHED 状态的文章都会尝试发布，包括 OFFLINE 状态的文章，但 OFFLINE 文章不能直接发布 |
| 复现步骤 | 1. 登录用户访问 /dashboard/posts<br>2. 对已发布文章点击"转草稿"<br>3. 前端发送 PUT /api/articles/1，body 包含整个 article 对象 + status: 'DRAFT'<br>4. 后端 DTO 校验可能因多余字段或类型不匹配而失败 |
| 涉及文件 | 前端：`/workspace/src/client/pages/dashboard/posts.vue` 第 68-81 行<br>后端：`/workspace/src/server/src/modules/articles/dto/article.dto.ts` 第 46-47 行 |
| 修复建议 | 1. 只传必要的更新字段：`{ status: 'DRAFT' }` 或 `{ status: 'PUBLISHED' }`<br>2. 使用专门的 publish/unpublish API（后端已有 `PUT /articles/:id/publish` 和 `PUT /articles/:id/unpublish`） |
| 修复状态 | 已修复（第一轮回归验证通过） |

### BUG-007 分类管理 API 路径前后端不一致

| 项 | 内容 |
|----|------|
| 缺陷ID | BUG-007 |
| 模块 | 分类 |
| 严重程度 | Critical |
| 描述 | 前端 `categoryApi.update` 和 `categoryApi.delete` 使用 `/categories/:id` 路径，但后端实际路径为 `/admin/categories/:id`，导致管理后台的分类更新和删除功能失败 |
| 复现步骤 | 1. 管理员访问 /admin/categories<br>2. 点击编辑或删除分类<br>3. 前端发送 PUT/DELETE /api/categories/1<br>4. 后端返回 404 |
| 涉及文件 | 前端：`/workspace/src/client/utils/api.ts` 第 50-51 行<br>后端：`/workspace/src/server/src/modules/categories/categories.controller.ts` 第 47-57 行 |
| 修复建议 | 将前端路径修改为 `/admin/categories/:id` |
| 修复状态 | 已修复（第一轮回归验证通过） |

### BUG-008 标签管理 API 路径前后端不一致

| 项 | 内容 |
|----|------|
| 缺陷ID | BUG-008 |
| 模块 | 标签 |
| 严重程度 | Critical |
| 描述 | 前端 `tagApi.update`、`tagApi.merge`、`tagApi.delete` 使用 `/tags/...` 路径，但后端实际路径为 `/admin/tags/...`，导致管理后台的标签编辑、合并、删除功能全部失败 |
| 复现步骤 | 1. 管理员访问 /admin/tags<br>2. 点击编辑、合并或删除标签<br>3. 前端发送请求到 /api/tags/...<br>4. 后端返回 404 |
| 涉及文件 | 前端：`/workspace/src/client/utils/api.ts` 第 59-61 行<br>后端：`/workspace/src/server/src/modules/tags/tags.controller.ts` 第 36-54 行 |
| 修复建议 | 将前端路径修改为：update -> `/admin/tags/:id`，merge -> `/admin/tags/merge`，delete -> `/admin/tags/:id` |
| 修复状态 | 已修复（第一轮回归验证通过） |

---

## Major 级别缺陷

### BUG-009 评论 API URL 参数类型不一致（articleId vs slug）

| 项 | 内容 |
|----|------|
| 缺陷ID | BUG-009 |
| 模块 | 评论 |
| 严重程度 | Major |
| 描述 | 前端 `commentApi.list` 和 `commentApi.create` 使用数字 `articleId` 作为 URL 参数（`/articles/:articleId/comments`），但后端期望 `slug` 字符串（`/articles/:slug/comments`）。前端传数字 ID，后端用 slug 查询文章，导致评论列表和发表评论功能失败 |
| 复现步骤 | 1. 访问文章详情页 /post/some-slug<br>2. 前端 CommentList 组件调用 commentApi.list(article.id)，发送 GET /api/articles/123/comments<br>3. 后端用 "123" 作为 slug 查询文章，找不到匹配<br>4. 评论无法加载 |
| 涉及文件 | 前端：`/workspace/src/client/utils/api.ts` 第 67-69 行<br>后端：`/workspace/src/server/src/modules/comments/comments.controller.ts` 第 26-49 行 |
| 修复建议 | 方案一：前端改为传 slug（`commentApi.list(slug)` 和 `commentApi.create(slug, payload)`）<br>方案二：后端改为接受 articleId（`@Param('id') id: string`，用 Number(id) 查询） |
| 修复状态 | 已修复（第一轮回归验证通过） |

### BUG-010 评论管理 API 路径前后端不一致

| 项 | 内容 |
|----|------|
| 缺陷ID | BUG-010 |
| 模块 | 评论 |
| 严重程度 | Major |
| 描述 | 前端评论管理相关 API 路径与后端不一致：<br>- `commentApi.mine`：前端 `/comments/mine`，后端 `/dashboard/comments/mine`<br>- `commentApi.all`：前端 `/comments`，后端 `/admin/comments`<br>- `commentApi.approve`：前端 `/comments/:id/approve`，后端 `/admin/comments/:id/approve`<br>导致"我的评论"、管理员评论列表、评论审核功能均无法使用 |
| 复现步骤 | 1. 登录用户访问 /dashboard/comments，或管理员访问 /admin/comments<br>2. 前端发送请求到错误路径<br>3. 后端返回 404 |
| 涉及文件 | 前端：`/workspace/src/client/utils/api.ts` 第 71-74 行<br>后端：`/workspace/src/server/src/modules/comments/comments.controller.ts` 第 60-108 行 |
| 修复建议 | 将前端路径修改为与后端一致 |
| 修复状态 | 已修复（第一轮回归验证通过） |

### BUG-011 重置密码 HTTP 方法和路径不一致

| 项 | 内容 |
|----|------|
| 缺陷ID | BUG-011 |
| 模块 | 管理员 |
| 严重程度 | Major |
| 描述 | 前端 `userApi.resetPassword` 使用 `PUT /users/:id/reset-password`，但后端使用 `POST /admin/users/:id/reset-password`，HTTP 方法和路径都不一致，导致管理员重置用户密码功能失败 |
| 复现步骤 | 1. 管理员访问 /admin/users<br>2. 点击"重置密码"<br>3. 前端发送 PUT /api/users/2/reset-password<br>4. 后端期望 POST /api/admin/users/2/reset-password，返回 404 |
| 涉及文件 | 前端：`/workspace/src/client/utils/api.ts` 第 91 行<br>后端：`/workspace/src/server/src/modules/admin/admin.controller.ts` 第 62-66 行 |
| 修复建议 | 将前端改为 `post(`/admin/users/${id}/reset-password`)` |
| 修复状态 | 已修复（第一轮回归验证通过） |

### BUG-012 用户管理 API 路径前后端不一致

| 项 | 内容 |
|----|------|
| 缺陷ID | BUG-012 |
| 模块 | 管理员/用户 |
| 严重程度 | Major |
| 描述 | 前端用户管理相关 API 路径与后端不一致：<br>- `userApi.list`：前端 `/users`，后端 `/admin/users`<br>- `userApi.updateRole`：前端 `/users/:id/role`，后端 `/admin/users/:id/role`<br>- `userApi.ban`：前端 `/users/:id/ban`，后端 `/admin/users/:id/ban`<br>- `userApi.unban`：前端 `/users/:id/unban`，后端 `/admin/users/:id/unban`<br>- `commentApi.banUser`：前端 `/users/:userId/ban`，后端 `/admin/users/:id/ban`<br>导致管理员用户管理功能全部失败 |
| 复现步骤 | 1. 管理员访问 /admin/users<br>2. 尝试封禁/解封/修改角色<br>3. 前端发送请求到错误路径，后端返回 404 |
| 涉及文件 | 前端：`/workspace/src/client/utils/api.ts` 第 86-91 行、第 75 行<br>后端：`/workspace/src/server/src/modules/admin/admin.controller.ts` 第 30-66 行 |
| 修复建议 | 将前端所有用户管理路径加上 `/admin` 前缀 |
| 修复状态 | 已修复（第一轮回归验证通过） |

### BUG-013 用户个人资料 API 路径前后端不一致

| 项 | 内容 |
|----|------|
| 缺陷ID | BUG-013 |
| 模块 | 用户 |
| 严重程度 | Major |
| 描述 | 前端用户个人资料相关 API 路径与后端不一致：<br>- `userApi.profile`：前端 `/users/profile`，后端无此路由（应使用 `/auth/me`）<br>- `userApi.updateProfile`：前端 `/users/profile`，后端 `/dashboard/profile`<br>- `userApi.dashboard`：前端 `/users/dashboard`，后端 `/dashboard/stats`<br>导致个人资料页面加载和保存、个人统计概览功能失败 |
| 复现步骤 | 1. 登录用户访问 /dashboard/profile 或 /dashboard<br>2. 前端发送请求到错误路径，后端返回 404 |
| 涉及文件 | 前端：`/workspace/src/client/utils/api.ts` 第 80-85 行<br>后端：`/workspace/src/server/src/modules/users/users.controller.ts` 第 44-83 行 |
| 修复建议 | 修改前端路径：profile -> `/auth/me`，updateProfile -> `/dashboard/profile`，dashboard -> `/dashboard/stats` |
| 修复状态 | 已修复（第一轮回归验证通过） |

### BUG-014 站点设置更新 API 路径前后端不一致

| 项 | 内容 |
|----|------|
| 缺陷ID | BUG-014 |
| 模块 | 设置 |
| 严重程度 | Major |
| 描述 | 前端 `settingsApi.update` 使用 `PUT /settings`，但后端实际路径为 `PUT /admin/settings`，导致管理员保存站点设置功能失败 |
| 复现步骤 | 1. 管理员访问 /admin/settings<br>2. 修改设置并保存<br>3. 前端发送 PUT /api/settings<br>4. 后端返回 404 |
| 涉及文件 | 前端：`/workspace/src/client/utils/api.ts` 第 117 行<br>后端：`/workspace/src/server/src/modules/settings/settings.controller.ts` 第 20-24 行 |
| 修复建议 | 将前端路径修改为 `/admin/settings` |
| 修复状态 | 已修复（第一轮回归验证通过） |

### BUG-015 站点设置权限不匹配

| 项 | 内容 |
|----|------|
| 缺陷ID | BUG-015 |
| 模块 | 设置 |
| 严重程度 | Major |
| 描述 | 后端更新站点设置要求 `SUPER_ADMIN` 权限（`@Roles(Role.SUPER_ADMIN)`），但前端 admin middleware 只检查 `ADMIN` 角色。普通管理员（ADMIN）可以访问设置页面，但保存时后端返回 403 无权限 |
| 复现步骤 | 1. 以普通管理员（ADMIN 角色，非 SUPER_ADMIN）登录<br>2. 访问 /admin/settings<br>3. 修改设置并保存<br>4. 后端返回 403（需要 SUPER_ADMIN 权限） |
| 涉及文件 | 前端：`/workspace/src/client/middleware/admin.ts` 第 10 行（只检查 isAdmin）<br>后端：`/workspace/src/server/src/modules/settings/settings.controller.ts` 第 21 行（@Roles(Role.SUPER_ADMIN)） |
| 修复建议 | 方案一：后端将权限改为 `@Roles(Role.ADMIN)`<br>方案二：前端 middleware 检查 SUPER_ADMIN 角色，非超级管理员不能访问设置页 |
| 修复状态 | 已修复（第一轮回归验证通过） |

### BUG-016 友链管理 API 路径前后端不一致

| 项 | 内容 |
|----|------|
| 缺陷ID | BUG-016 |
| 模块 | 友链 |
| 严重程度 | Major |
| 描述 | 前端友链管理相关 API（create/update/delete）使用 `/friend-links/...` 路径，但后端实际路径为 `/admin/friend-links/...`，导致友链管理功能失败。注意：前端当前没有友链管理页面，但 API 封装存在路径错误 |
| 复现步骤 | 1. 前端调用 friendLinkApi.create/update/delete<br>2. 后端返回 404 |
| 涉及文件 | 前端：`/workspace/src/client/utils/api.ts` 第 109-111 行<br>后端：`/workspace/src/server/src/modules/friend-links/friend-links.controller.ts` 第 28-46 行 |
| 修复建议 | 将前端路径修改为 `/admin/friend-links/...` |
| 修复状态 | 已修复（第一轮回归验证通过） |

### BUG-017 文章详情页上一篇/下一篇字段不存在

| 项 | 内容 |
|----|------|
| 缺陷ID | BUG-017 |
| 模块 | 前端-文章详情 |
| 严重程度 | Major |
| 描述 | 前端文章详情页（post/[slug].vue）模板中引用 `article.prev` 和 `article.next` 字段显示上一篇/下一篇导航，但后端文章详情 API 不返回这些字段。后端有独立的 `GET /articles/:slug/adjacent` 接口返回上下篇信息，但前端未调用 |
| 复现步骤 | 1. 访问任意文章详情页 /post/some-slug<br>2. 查看底部"上一篇/下一篇"区域<br>3. 始终显示"已是第一篇"和"已是最后一篇" |
| 涉及文件 | 前端：`/workspace/src/client/pages/post/[slug].vue` 第 161-182 行<br>后端：`/workspace/src/server/src/modules/articles/articles.controller.ts` 第 68-71 行（adjacent 接口） |
| 修复建议 | 在前端文章详情页中调用 `articleApi` 或直接请求 `/articles/:slug/adjacent` 获取上下篇信息，或在 api.ts 中添加 `adjacent` 方法 |
| 修复状态 | 已修复（第一轮回归验证通过） |

### BUG-018 编辑模式下加载文章使用 ID 而非 slug

| 项 | 内容 |
|----|------|
| 缺陷ID | BUG-018 |
| 模块 | 前端-编辑器 |
| 严重程度 | Major |
| 描述 | 前端 dashboard/editor.vue 在编辑模式下调用 `articleApi.detail(String(editId.value))` 加载文章，但 `articleApi.detail` 实际发送 `GET /articles/:slug` 请求。传入数字 ID 而非 slug，后端用 ID 作为 slug 查询文章，可能无法找到正确的文章 |
| 复现步骤 | 1. 在文章管理列表点击"编辑"<br>2. URL 变为 /dashboard/editor?id=1<br>3. 前端发送 GET /api/articles/1<br>4. 后端用 slug="1" 查询，可能找不到文章（取决于 slug 是否恰好为 "1"） |
| 涉及文件 | 前端：`/workspace/src/client/pages/dashboard/editor.vue` 第 49 行 |
| 修复建议 | 方案一：后端增加按 ID 获取文章的接口<br>方案二：前端在跳转编辑页时传 slug 而非 id<br>方案三：后端 findBySlug 方法同时支持 slug 和数字 ID 查询 |
| 修复状态 | 已修复（第一轮回归验证通过） |

### BUG-019 "忘记密码"链接指向自身

| 项 | 内容 |
|----|------|
| 缺陷ID | BUG-019 |
| 模块 | 前端-登录 |
| 严重程度 | Major |
| 描述 | 登录页面"忘记密码?"链接的 `to` 属性为 `/login`，指向登录页自身，点击后无任何效果。系统未实现忘记密码功能 |
| 复现步骤 | 1. 访问 /login<br>2. 点击"忘记密码?"链接<br>3. 页面无变化（链接指向 /login 自身） |
| 涉及文件 | 前端：`/workspace/src/client/pages/login.vue` 第 91 行 |
| 修复建议 | 方案一：实现忘记密码功能并创建对应页面<br>方案二：暂时移除"忘记密码?"链接或改为提示"请联系管理员重置密码" |
| 修复状态 | 已修复（第一轮回归验证通过） |

### BUG-020 About 页面 API 不存在

| 项 | 内容 |
|----|------|
| 缺陷ID | BUG-020 |
| 模块 | 前端-关于 |
| 严重程度 | Major |
| 描述 | 前端 about.vue 调用 `pageApi.about()` 发送 `GET /pages/about` 请求，但后端没有 `/pages/about` 路由。虽然前端有 fallback 默认内容，但每次访问关于页面都会产生一个 404 错误请求 |
| 复现步骤 | 1. 访问 /about<br>2. 浏览器开发者工具 Network 面板显示 GET /api/pages/about 返回 404<br>3. 页面显示默认内容 |
| 涉及文件 | 前端：`/workspace/src/client/utils/api.ts` 第 122 行<br>后端：无对应路由 |
| 修复建议 | 方案一：后端增加 `/pages/about` 接口，从数据库或设置中返回关于页面内容<br>方案二：将关于页面内容硬编码在前端，移除 API 调用<br>方案三：将关于页面内容放入站点设置，通过 `/settings` 接口获取 |
| 修复状态 | 已修复（第一轮回归验证通过） |

### BUG-021 搜索结果日期未格式化

| 项 | 内容 |
|----|------|
| 缺陷ID | BUG-021 |
| 模块 | 前端-搜索 |
| 严重程度 | Major |
| 描述 | 搜索结果列表中文章的发布时间 `publishedAt` 直接使用原始值显示，未调用 `formatDate()` 格式化，用户看到的是原始 ISO 字符串如 "2026-07-20T10:00:00.000Z" |
| 复现步骤 | 1. 搜索任意关键词<br>2. 查看搜索结果列表中文章的日期<br>3. 显示为 ISO 格式字符串而非 "2026-07-20" |
| 涉及文件 | 前端：`/workspace/src/client/pages/search.vue` 第 83 行 |
| 修复建议 | 将 `{{ article.publishedAt }}` 改为 `{{ formatDate(article.publishedAt) }}`，并确保已导入 `formatDate` |
| 修复状态 | 已修复（第一轮回归验证通过） |

### BUG-022 Cookie secure 属性固定为 false

| 项 | 内容 |
|----|------|
| 缺陷ID | BUG-022 |
| 模块 | 前端-安全 |
| 严重程度 | Major |
| 描述 | 前端 `setToken` 函数中 cookie 的 `secure` 属性固定为 `false`，在生产环境（HTTPS）下应该设置为 `true`。secure 为 false 时，cookie 可通过不加密的 HTTP 连接传输，存在被中间人攻击截获的风险 |
| 复现步骤 | 1. 检查 request.ts 第 19 行：`secure: false`<br>2. 生产环境部署后，token cookie 可通过 HTTP 传输 |
| 涉及文件 | 前端：`/workspace/src/client/utils/request.ts` 第 19 行 |
| 修复建议 | 改为根据环境变量判断：`secure: process.env.NODE_ENV === 'production'` |
| 修复状态 | 已修复（第一轮回归验证通过） |

---

## Minor 级别缺陷

### BUG-023 缺少 CSRF 防护头

| 项 | 内容 |
|----|------|
| 缺陷ID | BUG-023 |
| 模块 | 前端-安全 |
| 严重程度 | Minor |
| 描述 | API 设计文档要求写操作（POST/PUT/DELETE）携带 `X-Requested-With: XMLHttpRequest` 请求头用于 CSRF 防护，但前端 `request.ts` 未添加此头。若后端实现了 CSRF 校验，所有写操作将被拒绝；若后端未实现，则存在 CSRF 安全风险 |
| 复现步骤 | 1. 检查 request.ts 的 headers 设置<br>2. 检查 API 设计文档第 92 行要求 |
| 涉及文件 | 前端：`/workspace/src/client/utils/request.ts` 第 41-46 行 |
| 修复建议 | 在 POST/PUT/DELETE 请求的 headers 中添加 `X-Requested-With: XMLHttpRequest` |
| 修复状态 | 已修复（第一轮回归验证通过） |

### BUG-024 前端 BSearchBar 组件缺少搜索按钮

| 项 | 内容 |
|----|------|
| 缺陷ID | BUG-024 |
| 模块 | 前端-组件 |
| 严重程度 | Minor |
| 描述 | BSearchBar 组件中搜索按钮使用 `v-if="$slots.action"` 条件渲染，只有当使用方提供了名为 `action` 的插槽时才显示按钮。但在大部分使用场景（如 TheHeader.vue、search.vue）中未提供 action 插槽，导致搜索按钮不显示，用户只能按回车搜索 |
| 复现步骤 | 1. 查看首页头部搜索框<br>2. 搜索框右侧无搜索按钮<br>3. 只能按 Enter 键搜索 |
| 涉及文件 | 前端：`/workspace/src/client/components/common/BSearchBar.vue` 第 51 行 |
| 修复建议 | 将 `v-if="$slots.action"` 改为默认显示按钮，或始终渲染按钮，按钮文字使用 slot 默认值"搜索" |
| 修复状态 | 已修复（第一轮回归验证通过） |

### BUG-025 usePagination composable 未被使用

| 项 | 内容 |
|----|------|
| 缺陷ID | BUG-025 |
| 模块 | 前端-代码质量 |
| 严重程度 | Minor |
| 描述 | 前端 `composables/usePagination.ts` 定义了一个通用的分页组合式函数，但项目中所有列表页面都直接使用 `useAsyncData` + 手动管理分页状态，未使用此 composable。这导致代码重复，且 usePagination 中的 `watch(page, ...)` 逻辑与各页面的分页逻辑不一致 |
| 复现步骤 | 1. 搜索项目中 `usePagination` 的使用<br>2. 发现无任何页面使用此 composable |
| 涉及文件 | 前端：`/workspace/src/client/composables/usePagination.ts` |
| 修复建议 | 方案一：在各列表页面中使用 usePagination 替代手动分页逻辑<br>方案二：删除未使用的 usePagination.ts 文件 |
| 修复状态 | 已修复（第一轮回归验证通过） |

---

## 回归测试新发现缺陷

### BUG-026 修改密码未传 confirmPassword 导致校验失败

| 项 | 内容 |
|----|------|
| 缺陷ID | BUG-026 |
| 模块 | 认证 / 前端-个人资料 |
| 严重程度 | Critical |
| 发现阶段 | 第一轮回归测试 |
| 关联缺陷 | BUG-001（修复不完整暴露） |
| 描述 | BUG-001 已将前端 `userApi.changePassword` 路径修正为 `PUT /auth/password`，但调用方 `dashboard/profile.vue` 的 `changePassword()` 函数（第 106-109 行）仅传 `{ oldPassword, newPassword }`，未传 `confirmPassword`。后端 `ChangePasswordDto`（auth.dto.ts 第 71-74 行）通过 `@ValidateIf((o) => o.newPassword !== o.confirmPassword)` + `@Equals('placeholder')` 校验两次密码一致；当 `confirmPassword` 为 `undefined` 时，`newPassword !== undefined` 恒成立，触发 `@Equals('placeholder')` 校验失败，返回"两次输入的密码不一致"。导致修改密码功能在路径修复后仍无法使用 |
| 复现步骤 | 1. 登录用户访问 /dashboard/profile<br>2. 填写原密码、新密码、确认新密码并点击"修改密码"<br>3. 前端发送 `PUT /api/auth/password`，body 仅含 `{ oldPassword, newPassword }`（无 confirmPassword）<br>4. 后端 DTO 校验失败，返回"两次输入的密码不一致" |
| 涉及文件 | 前端：`/workspace/src/client/pages/dashboard/profile.vue` 第 106-109 行<br>后端：`/workspace/src/server/src/modules/auth/dto/auth.dto.ts` 第 71-74 行 |
| 修复建议 | 在 `profile.vue` 的 `changePassword()` 调用中补充 `confirmPassword: passwordForm.confirmPassword` 字段 |
| 修复状态 | 未修复 |

---

## 缺陷统计

> 第一轮回归测试后更新统计：原 23 个缺陷中 22 个已修复，BUG-001 修复不完整并新增 BUG-026（Critical）。

### 按严重程度（当前剩余）

| 严重程度 | 原数量 | 已修复 | 未修复/新增 | 当前剩余 |
|----------|--------|--------|-------------|----------|
| Critical | 8 | 7 | 1（BUG-001 不完整 + BUG-026 新增） | 1 |
| Major | 12 | 12 | 0 | 0 |
| Minor | 3 | 3 | 0 | 0 |
| **合计** | **23** | **22** | **1** | **1** |

### 按严重程度（原始分布）

### 按模块

| 模块 | Critical | Major | Minor | 合计 |
|------|----------|-------|-------|------|
| 认证 | 1 | 0 | 0 | 1 |
| 文章 | 4 | 0 | 0 | 4 |
| 分类 | 1 | 0 | 0 | 1 |
| 标签 | 1 | 0 | 0 | 1 |
| 评论 | 0 | 2 | 0 | 2 |
| 管理员 | 0 | 2 | 0 | 2 |
| 用户 | 0 | 1 | 0 | 1 |
| 设置 | 0 | 2 | 0 | 2 |
| 友链 | 0 | 1 | 0 | 1 |
| 前端-文章详情 | 0 | 1 | 0 | 1 |
| 前端-编辑器 | 0 | 1 | 0 | 1 |
| 前端-登录 | 0 | 1 | 0 | 1 |
| 前端-关于 | 0 | 1 | 0 | 1 |
| 前端-搜索 | 0 | 1 | 0 | 1 |
| 前端-安全 | 0 | 1 | 1 | 2 |
| 前端-组件 | 0 | 0 | 1 | 1 |
| 前端-代码质量 | 0 | 0 | 1 | 1 |
| **合计** | **8** | **12** | **3** | **23** |

### 按缺陷类型

| 类型 | 数量 | 说明 |
|------|------|------|
| API 路径不一致 | 14 | 前端 API 路径与后端实际路由不匹配 |
| 数据结构不一致 | 1 | 分页响应结构前后端不一致 |
| 参数类型不一致 | 2 | 前端传参类型与后端期望不一致 |
| 功能缺失 | 2 | About API 缺失、忘记密码未实现 |
| 逻辑错误 | 1 | 文章状态切换逻辑错误 |
| 安全配置 | 2 | Cookie secure、CSRF 头 |
| UI/UX | 1 | 搜索按钮不显示 |
| 代码质量 | 1 | 未使用的 composable |
