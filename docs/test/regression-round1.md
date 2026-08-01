# 第一轮回归测试报告

| 项目 | 内容 |
|------|------|
| 项目名称 | hdochub 个人技术博客 |
| 文档版本 | V1.0 |
| 编写日期 | 2026-07-28 |
| 编写人 | 测试工程师 |
| 测试范围 | 验证第一轮 23 个缺陷修复，编译/构建验证，新问题排查 |
| 关联文档 | bug-report.md、test-cases.md、api-design.md |

---

## 一、回归测试概况

### 1.1 测试目标

针对第一轮测试发现的 23 个缺陷（8 Critical、12 Major、3 Minor），在开发完成修复后进行回归验证：

1. 逐个验证 BUG-001 ~ BUG-025 的修复是否有效；
2. 执行后端 `npx nest build` 与前端 `npm run build` 编译/构建验证；
3. 排查修复过程中是否引入新的 API 路径不一致、遗漏导入或类型不一致问题。

### 1.2 测试方法

- **静态代码审查**：逐一比对 `/workspace/src/client/utils/api.ts` 中所有 API 路径与后端各 `controller.ts` 路由定义；
- **分页结构核验**：检查前端 `Paginated<T>` 类型定义、后端 `paginate()` 函数及各列表页消费处；
- **前端组件审查**：审查 `dashboard/posts.vue`、`dashboard/editor.vue`、`post/[slug].vue`、`login.vue`、`search.vue`、`about.vue`、`BSearchBar.vue`、`request.ts`、`middleware/*` 等关键文件；
- **编译/构建验证**：实际执行后端与前端构建命令并记录结果。

### 1.3 测试结论速览

| 维度 | 结果 |
|------|------|
| 缺陷修复验证 | 23 个缺陷中 22 个修复有效，1 个修复不完整（BUG-001） |
| 后端编译 | 通过（`npx nest build` 退出码 0，生成 dist/src/main.js） |
| 前端构建 | 通过（`npm run build` 成功，总大小 4.43 MB / 1.24 MB gzip） |
| 新发现问题 | 1 个（BUG-026，由 BUG-001 修复后暴露） |
| 回归测试结论 | **有条件通过**（需修复 BUG-026 后方可进入下一阶段） |

---

## 二、缺陷修复验证明细

> 验证结果标记：✅ 已修复 / ⚠️ 修复不完整 / ❌ 未修复

### 2.1 Critical 级别

#### BUG-001 修改密码 API 前后端路径不一致 — ⚠️ 修复不完整

| 项 | 内容 |
|----|------|
| 验证点 | 前端 `userApi.changePassword` 路径是否改为 `/auth/password` |
| 验证结果 | 路径已修复为 `PUT /auth/password`（api.ts 第 99-100 行），与后端 `auth.controller.ts` 第 64 行 `@Put('password')` 一致 |
| 遗留问题 | **调用方 `dashboard/profile.vue` 第 106-109 行 `changePassword()` 仅传 `{ oldPassword, newPassword }`，未传 `confirmPassword`**。后端 `ChangePasswordDto`（auth.dto.ts 第 71-74 行）通过 `@ValidateIf` 校验 `confirmPassword` 必须与 `newPassword` 一致；缺失该字段会触发校验错误"两次输入的密码不一致"，导致修改密码在运行时仍然失败 |
| 结论 | 路径修复有效，但调用处 payload 不完整，**功能仍不可用**。详见新发现问题 BUG-026 |

#### BUG-002 分页响应数据结构前后端不一致 — ✅ 已修复

| 项 | 内容 |
|----|------|
| 验证点 | 前端 `Paginated<T>` 类型与后端 `paginate()` 返回结构是否一致 |
| 验证结果 | 前端 `types/index.ts` 第 17-26 行已改为嵌套结构 `{ list, pagination: { page, pageSize, total, totalPages } }`；后端 `pagination.dto.ts` 第 56-71 行 `paginate()` 返回相同嵌套结构；前端所有列表页（index、search、dashboard/posts、dashboard/comments、admin/posts、admin/users、admin/comments、category/[slug]、tag/[slug]）均统一读取 `data.value?.pagination.totalPages` 等字段 |
| 结论 | 前后端分页结构完全一致，修复有效 |

#### BUG-003 搜索 API 参数名前后端不一致 — ✅ 已修复

| 项 | 内容 |
|----|------|
| 验证点 | 前端搜索是否使用 `q` 参数 |
| 验证结果 | 前端 `api.ts` 第 119-120 行 `searchApi.articles` 发送 `{ q: keyword, ...query }`；后端 `articles.controller.ts` 第 133 行 `@Query('q') q: string` 接收；`search.vue` 第 9、25 行 URL 参数也使用 `q` |
| 结论 | 参数名一致，修复有效 |

#### BUG-004 "我的文章"API 路径前后端不一致 — ✅ 已修复

| 项 | 内容 |
|----|------|
| 验证点 | 前端 `articleApi.mine` 路径是否改为 `/dashboard/articles` |
| 验证结果 | 前端 `api.ts` 第 38 行 `mine: (query) => get('/dashboard/articles', query)`；后端 `articles.controller.ts` 第 113 行 `@Get('dashboard/articles')` |
| 结论 | 路径一致，修复有效 |

#### BUG-005 文章下架/恢复 API 路径前后端不一致 — ✅ 已修复

| 项 | 内容 |
|----|------|
| 验证点 | 前端 `articleApi.offline/restore` 路径是否改为 `/admin/articles/:id/archive|restore` |
| 验证结果 | 前端 `api.ts` 第 40-41 行 `offline -> /admin/articles/:id/archive`、`restore -> /admin/articles/:id/restore`；后端 `articles.controller.ts` 第 152、159 行 `@Put('admin/articles/:id/archive')`、`@Put('admin/articles/:id/restore')` |
| 结论 | 路径一致，修复有效 |

#### BUG-006 文章状态切换逻辑错误 — ✅ 已修复

| 项 | 内容 |
|----|------|
| 验证点 | 前端 `handleToggleStatus` 是否使用专门接口且只传必要字段 |
| 验证结果 | `dashboard/posts.vue` 第 68-87 行已重写：PUBLISHED→调用 `articleApi.unpublish(id)`；DRAFT→调用 `articleApi.publish(id)`；OFFLINE 等其他状态直接拦截提示"当前状态不支持直接发布"。不再将整个 article 对象传给 update 接口 |
| 结论 | 逻辑正确，修复有效 |

#### BUG-007 分类管理 API 路径前后端不一致 — ✅ 已修复

| 项 | 内容 |
|----|------|
| 验证点 | 前端 `categoryApi.update/delete` 路径是否改为 `/admin/categories/:id` |
| 验证结果 | 前端 `api.ts` 第 57-58 行 `update -> /admin/categories/:id`、`delete -> /admin/categories/:id`；后端 `categories.controller.ts` 第 46、53 行一致 |
| 结论 | 路径一致，修复有效 |

#### BUG-008 标签管理 API 路径前后端不一致 — ✅ 已修复

| 项 | 内容 |
|----|------|
| 验证点 | 前端 `tagApi.update/merge/delete` 路径是否改为 `/admin/tags/...` |
| 验证结果 | 前端 `api.ts` 第 67-69 行 `update -> /admin/tags/:id`、`merge -> /admin/tags/merge`、`delete -> /admin/tags/:id`；后端 `tags.controller.ts` 第 36、43、50 行一致 |
| 结论 | 路径一致，修复有效 |

---

### 2.2 Major 级别

#### BUG-009 评论 API URL 参数类型不一致（articleId vs slug） — ✅ 已修复

| 项 | 内容 |
|----|------|
| 验证点 | 前端 `commentApi.list/create` 是否使用 slug |
| 验证结果 | 前端 `api.ts` 第 76-78 行 `list(slug)`、`create(slug, payload)` 均 `get/post('/articles/${slug}/comments')`；后端 `comments.controller.ts` 第 26、40 行 `@Param('slug') slug: string`；`CommentList.vue` 第 7 行接收 `articleSlug` prop，第 38、52 行调用 `commentApi.create(props.articleSlug, ...)`；`post/[slug].vue` 第 24、158 行传入 `slug` |
| 结论 | 参数类型一致（均使用 slug），修复有效 |

#### BUG-010 评论管理 API 路径前后端不一致 — ✅ 已修复

| 项 | 内容 |
|----|------|
| 验证点 | 前端 `commentApi.mine/all/approve` 路径是否修正 |
| 验证结果 | 前端 `api.ts` 第 81 行 `mine -> /dashboard/comments/mine`、第 83-84 行 `all -> /admin/comments`、第 86 行 `approve -> /admin/comments/:id/approve`；后端 `comments.controller.ts` 第 75、90、97 行一致 |
| 结论 | 路径一致，修复有效 |

#### BUG-011 重置密码 HTTP 方法和路径不一致 — ✅ 已修复

| 项 | 内容 |
|----|------|
| 验证点 | 前端 `userApi.resetPassword` 是否改为 `POST /admin/users/:id/reset-password` |
| 验证结果 | 前端 `api.ts` 第 112 行 `resetPassword: (id) => post('/admin/users/${id}/reset-password')`；后端 `admin.controller.ts` 第 62 行 `@Post('users/:id/reset-password')`（Controller 前缀 `admin`） |
| 结论 | HTTP 方法（POST）与路径一致，修复有效 |

#### BUG-012 用户管理 API 路径前后端不一致 — ✅ 已修复

| 项 | 内容 |
|----|------|
| 验证点 | 前端 `userApi.list/updateRole/ban/unban` 与 `commentApi.banUser` 路径是否加 `/admin` 前缀 |
| 验证结果 | 前端 `api.ts`：`list -> /admin/users`（第 105 行）、`updateRole -> /admin/users/:id/role`（第 107 行）、`ban -> /admin/users/:id/ban`（第 109 行）、`unban -> /admin/users/:id/unban`（第 110 行）、`commentApi.banUser -> /admin/users/:userId/ban`（第 88 行）；后端 `admin.controller.ts` 第 30、37、48、55 行一致 |
| 结论 | 路径一致，修复有效 |

#### BUG-013 用户个人资料 API 路径前后端不一致 — ✅ 已修复

| 项 | 内容 |
|----|------|
| 验证点 | 前端 `userApi.profile/updateProfile/dashboard` 路径是否修正 |
| 验证结果 | 前端 `api.ts`：`profile -> /auth/me`（第 94 行）、`updateProfile -> /dashboard/profile`（第 97 行）、`dashboard -> /dashboard/stats`（第 102 行）；后端 `auth.controller.ts` 第 57 行 `@Get('me')`、`users.controller.ts` 第 44 行 `@Put('dashboard/profile')`、第 79 行 `@Get('dashboard/stats')` |
| 结论 | 路径一致，修复有效 |

#### BUG-014 站点设置更新 API 路径前后端不一致 — ✅ 已修复

| 项 | 内容 |
|----|------|
| 验证点 | 前端 `settingsApi.update` 路径是否改为 `/admin/settings` |
| 验证结果 | 前端 `api.ts` 第 141 行 `update -> /admin/settings`；后端 `settings.controller.ts` 第 20 行 `@Put('admin/settings')` |
| 结论 | 路径一致，修复有效 |

#### BUG-015 站点设置权限不匹配 — ✅ 已修复

| 项 | 内容 |
|----|------|
| 验证点 | 前端是否限制仅 SUPER_ADMIN 访问设置页 |
| 验证结果 | 新增 `middleware/super-admin.ts`，校验 `authStore.isSuperAdmin`，非超管重定向到首页；`admin/settings.vue` 第 4 行 `middleware: ['auth', 'super-admin']`；`stores/auth.ts` 第 15 行 `isSuperAdmin` getter 判断 `role === 'SUPER_ADMIN'`。与后端 `settings.controller.ts` 第 21 行 `@Roles(Role.SUPER_ADMIN)` 一致 |
| 结论 | 权限前后端一致，修复有效 |

#### BUG-016 友链管理 API 路径前后端不一致 — ✅ 已修复

| 项 | 内容 |
|----|------|
| 验证点 | 前端 `friendLinkApi.create/update/delete` 路径是否改为 `/admin/friend-links/...` |
| 验证结果 | 前端 `api.ts` 第 132-134 行 `create -> /admin/friend-links`、`update -> /admin/friend-links/:id`、`delete -> /admin/friend-links/:id`；后端 `friend-links.controller.ts` 第 28、35、42 行一致 |
| 结论 | 路径一致，修复有效 |

#### BUG-017 文章详情页上一篇/下一篇字段不存在 — ✅ 已修复

| 项 | 内容 |
|----|------|
| 验证点 | 前端是否调用 adjacent 接口获取上下篇 |
| 验证结果 | `api.ts` 第 49 行新增 `adjacent(slug)` 方法调用 `GET /articles/:slug/adjacent`；`post/[slug].vue` 第 33-36 行 `useAsyncData` 调用 `articleApi.adjacent(slug)`；第 38-39 行 `prevArticle/nextArticle` 取自 `adjacent.value?.prev/next`；模板第 169-191 行使用 `prevArticle/nextArticle` 渲染。后端 `articles.controller.ts` 第 68 行 `@Get('articles/:slug/adjacent')`，`articles.service.ts` 第 197-229 行 `findAdjacent` 返回 `{ prev, next }` |
| 结论 | 修复有效，上下篇可正常显示 |

#### BUG-018 编辑模式下加载文章使用 ID 而非 slug — ✅ 已修复

| 项 | 内容 |
|----|------|
| 验证点 | 编辑页是否使用 slug 加载文章 |
| 验证结果 | `dashboard/editor.vue` 第 12 行 `editSlug = computed(() => route.query.slug)`；第 50 行 `articleApi.detail(editSlug.value!)`；列表页跳转改为 `?slug=${row.slug}`（dashboard/posts.vue 第 150 行、admin/posts.vue 第 151 行） |
| 结论 | 使用 slug 加载，与后端 `GET /articles/:slug` 一致，修复有效 |

#### BUG-019 "忘记密码"链接指向自身 — ✅ 已修复

| 项 | 内容 |
|----|------|
| 验证点 | "忘记密码"链接是否处理 |
| 验证结果 | `login.vue` 第 91 行 `NuxtLink to="/login" @click.prevent="errorToast('请联系管理员重置密码')"`，点击弹出提示"请联系管理员重置密码"，阻止默认跳转 |
| 结论 | 不再无效跳转，给出明确提示，修复有效（采用修复方案二） |

#### BUG-020 About 页面 API 不存在 — ✅ 已修复

| 项 | 内容 |
|----|------|
| 验证点 | About 页面是否仍调用不存在的 `/pages/about` |
| 验证结果 | `about.vue` 已改为硬编码内容（第 5-12 行 `aboutContent` 常量），不再调用 `pageApi.about()`，不再产生 404 请求 |
| 备注 | `api.ts` 第 145-147 行仍保留 `pageApi.about` 定义但已无调用方，属遗留死代码，不影响功能 |
| 结论 | 修复有效（采用修复方案二） |

#### BUG-021 搜索结果日期未格式化 — ✅ 已修复

| 项 | 内容 |
|----|------|
| 验证点 | 搜索结果是否使用 `formatDate` |
| 验证结果 | `search.vue` 第 4 行已导入 `formatDate`；第 83 行 `{{ formatDate(article.publishedAt) }}` |
| 结论 | 日期已格式化，修复有效 |

#### BUG-022 Cookie secure 属性固定为 false — ✅ 已修复

| 项 | 内容 |
|----|------|
| 验证点 | cookie secure 是否按环境判断 |
| 验证结果 | `request.ts` 第 20 行 `secure: process.env.NODE_ENV === 'production'` |
| 结论 | 生产环境 secure=true，开发环境 false，修复有效 |

---

### 2.3 Minor 级别

#### BUG-023 缺少 CSRF 防护头 — ✅ 已修复

| 项 | 内容 |
|----|------|
| 验证点 | 写操作是否携带 `X-Requested-With` 头 |
| 验证结果 | `request.ts` 第 49-52 行：对 POST/PUT/DELETE/PATCH 方法添加 `headers['X-Requested-With'] = 'XMLHttpRequest'` |
| 结论 | 符合 API 设计文档第 91 行要求，修复有效 |

#### BUG-024 前端 BSearchBar 组件缺少搜索按钮 — ✅ 已修复

| 项 | 内容 |
|----|------|
| 验证点 | 搜索按钮是否默认显示 |
| 验证结果 | `BSearchBar.vue` 第 50-57 行：按钮无条件渲染，`<slot name="action">搜索</slot>` 提供默认值"搜索"。移除了原 `v-if="$slots.action"` 条件 |
| 结论 | 搜索按钮始终显示，修复有效 |

#### BUG-025 usePagination composable 未被使用 — ✅ 已修复

| 项 | 内容 |
|----|------|
| 验证点 | `composables/usePagination.ts` 是否已处理 |
| 验证结果 | 文件已删除（`/workspace/src/client/composables/usePagination.ts` 不存在） |
| 结论 | 采用修复方案二，死代码已清理，修复有效 |

---

## 三、编译 / 构建验证

### 3.1 后端编译

| 项 | 内容 |
|----|------|
| 命令 | `cd /workspace/src/server && npx nest build` |
| 退出码 | 0 |
| 输出 | 无错误无警告，生成 `dist/src/main.js`（4257 字节） |
| 结论 | ✅ 编译通过 |

### 3.2 前端构建

| 项 | 内容 |
|----|------|
| 命令 | `cd /workspace/src/client && npm run build` |
| 退出码 | 0 |
| 输出 | 构建成功，输出 `.output/server/index.mjs`，Σ Total size: 4.43 MB (1.24 MB gzip) |
| 结论 | ✅ 构建通过 |

---

## 四、新发现问题

### BUG-026 修改密码未传 confirmPassword 导致校验失败（BUG-001 修复不完整）

| 项 | 内容 |
|----|------|
| 缺陷ID | BUG-026 |
| 模块 | 认证 / 前端-个人资料 |
| 严重程度 | Critical |
| 发现阶段 | 第一轮回归测试 |
| 描述 | BUG-001 已将前端 `userApi.changePassword` 路径修正为 `PUT /auth/password`，但调用方 `dashboard/profile.vue` 的 `changePassword()` 函数（第 106-109 行）仅传 `{ oldPassword, newPassword }`，未传 `confirmPassword`。后端 `ChangePasswordDto`（auth.dto.ts 第 71-74 行）通过 `@ValidateIf((o) => o.newPassword !== o.confirmPassword)` + `@Equals('placeholder')` 校验两次密码一致；当 `confirmPassword` 为 `undefined` 时，`newPassword !== undefined` 恒成立，触发 `@Equals('placeholder')` 校验失败，返回"两次输入的密码不一致"。导致修改密码功能在路径修复后仍无法使用 |
| 复现步骤 | 1. 登录用户访问 /dashboard/profile<br>2. 填写原密码、新密码、确认新密码并点击"修改密码"<br>3. 前端发送 `PUT /api/auth/password`，body 仅含 `{ oldPassword, newPassword }`（无 confirmPassword）<br>4. 后端 DTO 校验失败，返回"两次输入的密码不一致" |
| 涉及文件 | 前端：`/workspace/src/client/pages/dashboard/profile.vue` 第 106-109 行<br>后端：`/workspace/src/server/src/modules/auth/dto/auth.dto.ts` 第 71-74 行 |
| 修复建议 | 在 `profile.vue` 的 `changePassword()` 调用中补充 `confirmPassword: passwordForm.confirmPassword` 字段 |
| 修复状态 | 未修复 |

### 4.2 预存问题（非本轮修复引入，记录备查）

以下问题在第一轮缺陷报告中未提及，且非由本轮 23 个修复引入，但回归过程中发现，记录备查：

| 编号 | 描述 | 严重程度 | 说明 |
|------|------|----------|------|
| OBS-001 | `admin/posts.vue` 第 30 行调用 `articleApi.list`（`GET /articles`，公开接口，仅返回 PUBLISHED 文章），而非管理员文章列表接口 `GET /admin/articles`。同时传入了 `keyword/authorId/category/status` 等参数，但公开 `ArticleQueryDto` 不支持这些字段，导致管理员文章管理页无法查看草稿/下架文章，筛选也不生效 | Major | 预存设计缺陷，非本轮引入。建议新增 `articleApi.adminList` 调用 `/admin/articles` |
| OBS-002 | `api.ts` 第 59、70 行 `categoryApi.articles`、`tagApi.articles` 调用 `/categories/:slug/articles`、`/tags/:slug/articles`，后端无此路由。当前无页面调用这两个方法，不影响运行 | Minor | 预存死代码。建议删除或后端补齐路由 |
| OBS-003 | `api.ts` 第 145-147 行 `pageApi.about` 调用 `GET /pages/about`，后端无此路由。BUG-020 修复后 `about.vue` 不再调用此方法，属遗留死代码 | Minor | 不影响运行，建议删除 |

---

## 五、前后端 API 路径一致性总览

下表汇总回归后所有前端 API 调用与后端路由的对应关系：

| 前端 API | 前端路径 | 后端路由 | 后端文件 | 一致性 |
|----------|----------|----------|----------|--------|
| authApi.login | POST /auth/login | @Post('login') | auth.controller.ts:38 | ✅ |
| authApi.register | POST /auth/register | @Post('register') | auth.controller.ts:27 | ✅ |
| authApi.logout | POST /auth/logout | @Post('logout') | auth.controller.ts:48 | ✅ |
| authApi.me | GET /auth/me | @Get('me') | auth.controller.ts:57 | ✅ |
| userApi.changePassword | PUT /auth/password | @Put('password') | auth.controller.ts:64 | ✅（路径一致，payload 有问题见 BUG-026） |
| articleApi.list | GET /articles | @Get('articles') | articles.controller.ts:36 | ✅ |
| articleApi.detail | GET /articles/:slug | @Get('articles/:slug') | articles.controller.ts:50 | ✅ |
| articleApi.create | POST /articles | @Post('articles') | articles.controller.ts:74 | ✅ |
| articleApi.update | PUT /articles/:id | @Put('articles/:id') | articles.controller.ts:81 | ✅ |
| articleApi.delete | DELETE /articles/:id | @Delete('articles/:id') | articles.controller.ts:92 | ✅ |
| articleApi.mine | GET /dashboard/articles | @Get('dashboard/articles') | articles.controller.ts:113 | ✅ |
| articleApi.offline | PUT /admin/articles/:id/archive | @Put('admin/articles/:id/archive') | articles.controller.ts:152 | ✅ |
| articleApi.restore | PUT /admin/articles/:id/restore | @Put('admin/articles/:id/restore') | articles.controller.ts:159 | ✅ |
| articleApi.publish | PUT /articles/:id/publish | @Put('articles/:id/publish') | articles.controller.ts:99 | ✅ |
| articleApi.unpublish | PUT /articles/:id/unpublish | @Put('articles/:id/unpublish') | articles.controller.ts:106 | ✅ |
| articleApi.like | POST /articles/:id/like | @Post() on articles/:id/like | likes.controller.ts:21 | ✅ |
| articleApi.unlike | DELETE /articles/:id/like | @Delete() on articles/:id/like | likes.controller.ts:28 | ✅ |
| articleApi.related | GET /articles/:slug/related | @Get('articles/:slug/related') | articles.controller.ts:61 | ✅ |
| articleApi.adjacent | GET /articles/:slug/adjacent | @Get('articles/:slug/adjacent') | articles.controller.ts:68 | ✅ |
| categoryApi.list | GET /categories | @Get('categories') | categories.controller.ts:26 | ✅ |
| categoryApi.create | POST /admin/categories | @Post('admin/categories') | categories.controller.ts:39 | ✅ |
| categoryApi.update | PUT /admin/categories/:id | @Put('admin/categories/:id') | categories.controller.ts:46 | ✅ |
| categoryApi.delete | DELETE /admin/categories/:id | @Delete('admin/categories/:id') | categories.controller.ts:53 | ✅ |
| tagApi.list | GET /tags | @Get('tags') | tags.controller.ts:23 | ✅ |
| tagApi.update | PUT /admin/tags/:id | @Put('admin/tags/:id') | tags.controller.ts:36 | ✅ |
| tagApi.merge | POST /admin/tags/merge | @Post('admin/tags/merge') | tags.controller.ts:43 | ✅ |
| tagApi.delete | DELETE /admin/tags/:id | @Delete('admin/tags/:id') | tags.controller.ts:50 | ✅ |
| commentApi.list | GET /articles/:slug/comments | @Get('articles/:slug/comments') | comments.controller.ts:26 | ✅ |
| commentApi.create | POST /articles/:slug/comments | @Post('articles/:slug/comments') | comments.controller.ts:40 | ✅ |
| commentApi.delete | DELETE /comments/:id | @Delete('comments/:id') | comments.controller.ts:53 | ✅ |
| commentApi.mine | GET /dashboard/comments/mine | @Get('dashboard/comments/mine') | comments.controller.ts:75 | ✅ |
| commentApi.all | GET /admin/comments | @Get('admin/comments') | comments.controller.ts:90 | ✅ |
| commentApi.approve | PUT /admin/comments/:id/approve | @Put('admin/comments/:id/approve') | comments.controller.ts:97 | ✅ |
| commentApi.banUser | PUT /admin/users/:id/ban | @Put('users/:id/ban') on admin | admin.controller.ts:48 | ✅ |
| userApi.profile | GET /auth/me | @Get('me') | auth.controller.ts:57 | ✅ |
| userApi.updateProfile | PUT /dashboard/profile | @Put('dashboard/profile') | users.controller.ts:44 | ✅ |
| userApi.dashboard | GET /dashboard/stats | @Get('dashboard/stats') | users.controller.ts:79 | ✅ |
| userApi.list | GET /admin/users | @Get('users') on admin | admin.controller.ts:30 | ✅ |
| userApi.updateRole | PUT /admin/users/:id/role | @Put('users/:id/role') on admin | admin.controller.ts:37 | ✅ |
| userApi.ban | PUT /admin/users/:id/ban | @Put('users/:id/ban') on admin | admin.controller.ts:48 | ✅ |
| userApi.unban | PUT /admin/users/:id/unban | @Put('users/:id/unban') on admin | admin.controller.ts:55 | ✅ |
| userApi.resetPassword | POST /admin/users/:id/reset-password | @Post('users/:id/reset-password') on admin | admin.controller.ts:62 | ✅ |
| userApi.adminStats | GET /admin/stats | @Get('stats') on admin | admin.controller.ts:23 | ✅ |
| searchApi.articles | GET /search?q= | @Get('search') | articles.controller.ts:131 | ✅ |
| archiveApi.list | GET /archive | @Get('archive') | articles.controller.ts:124 | ✅ |
| friendLinkApi.list | GET /friend-links | @Get('friend-links') | friend-links.controller.ts:22 | ✅ |
| friendLinkApi.create | POST /admin/friend-links | @Post('admin/friend-links') | friend-links.controller.ts:28 | ✅ |
| friendLinkApi.update | PUT /admin/friend-links/:id | @Put('admin/friend-links/:id') | friend-links.controller.ts:35 | ✅ |
| friendLinkApi.delete | DELETE /admin/friend-links/:id | @Delete('admin/friend-links/:id') | friend-links.controller.ts:42 | ✅ |
| settingsApi.get | GET /settings | @Get('settings') | settings.controller.ts:14 | ✅ |
| settingsApi.update | PUT /admin/settings | @Put('admin/settings') | settings.controller.ts:20 | ✅ |
| uploadApi.image | POST /uploads | @Post() on uploads | uploads.controller.ts:25 | ✅ |

**结论**：除 BUG-026（payload 字段缺失，非路径问题）外，所有前端 API 路径与后端路由完全一致，未发现修复过程中引入新的路径不一致。

---

## 六、回归测试结论

### 6.1 总体结论

**回归测试结果：有条件通过**

- 23 个原缺陷中，22 个修复有效（修复有效率 95.7%）；
- 1 个缺陷（BUG-001）修复不完整，暴露出新问题 BUG-026（Critical）；
- 后端编译与前端构建均通过；
- 未发现修复过程引入新的 API 路径不一致、类型不一致或遗漏导入问题。

### 6.2 上线建议

| 项 | 建议 |
|----|------|
| 是否可上线 | **暂不可上线** |
| 阻塞项 | BUG-026（修改密码功能不可用，Critical） |
| 处理建议 | 修复 BUG-026 后进行第二轮回归验证（仅验证修改密码功能），通过后可准予上线 |
| 可选优化 | OBS-001（admin/posts 调用错误接口）建议在下一迭代修复；OBS-002、OBS-003 死代码建议清理 |

### 6.3 缺陷统计（回归后）

| 严重程度 | 原数量 | 已修复 | 未修复/新增 | 当前剩余 |
|----------|--------|--------|-------------|----------|
| Critical | 8 | 7 | 1（BUG-001 不完整 + BUG-026 新增） | 1 |
| Major | 12 | 12 | 0 | 0 |
| Minor | 3 | 3 | 0 | 0 |
| **合计** | **23** | **22** | **1** | **1** |

> 注：BUG-026 为 BUG-001 修复后暴露的关联问题，统计为 1 个剩余 Critical 缺陷。
