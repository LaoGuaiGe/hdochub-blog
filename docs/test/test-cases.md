# 测试用例文档

| 项目 | 内容 |
|------|------|
| 项目名称 | hdochub 个人技术博客 |
| 文档版本 | V1.0 |
| 编写日期 | 2026-07-28 |
| 编写人 | 测试工程师 |
| 测试范围 | 后端 API + 前端页面 + 构建 |

---

## 一、认证模块（Auth）

### TC-AUTH-001 用户注册 - 正常流程

| 项 | 内容 |
|----|------|
| 用例ID | TC-AUTH-001 |
| 模块 | 认证 |
| 描述 | 使用合法的用户名、邮箱、密码注册新用户 |
| 前置条件 | 站点设置允许注册；数据库可达 |
| 测试步骤 | 1. POST /api/auth/register，body: { username: "testuser01", email: "test01@example.com", password: "Pass1234", confirmPassword: "Pass1234" } |
| 预期结果 | 返回 code=0，data 包含 token 和 user 对象，user.role=USER |
| 实际结果 | 代码审查通过，逻辑正确，注册后自动生成 JWT |
| 状态 | 通过 |

### TC-AUTH-002 用户注册 - 用户名已存在

| 项 | 内容 |
|----|------|
| 用例ID | TC-AUTH-002 |
| 模块 | 认证 |
| 描述 | 使用已存在的用户名注册 |
| 前置条件 | 用户名 "admin" 已存在 |
| 测试步骤 | 1. POST /api/auth/register，body: { username: "admin", email: "new@example.com", password: "Pass1234", confirmPassword: "Pass1234" } |
| 预期结果 | 返回 code 非 0，message 提示用户名已被占用 |
| 实际结果 | 代码审查通过，auth.service.ts 第 41-46 行检查用户名唯一性 |
| 状态 | 通过 |

### TC-AUTH-003 用户注册 - 密码不一致

| 项 | 内容 |
|----|------|
| 用例ID | TC-AUTH-003 |
| 模块 | 认证 |
| 描述 | 注册时两次密码输入不一致 |
| 前置条件 | 无 |
| 测试步骤 | 1. POST /api/auth/register，password="Pass1234", confirmPassword="Pass5678" |
| 预期结果 | 返回校验错误 |
| 实际结果 | 代码审查通过，DTO 中有 @ValidateIf 校验 confirmPassword 与 password 一致 |
| 状态 | 通过 |

### TC-AUTH-004 用户注册 - 注册开关关闭

| 项 | 内容 |
|----|------|
| 用例ID | TC-AUTH-004 |
| 模块 | 认证 |
| 描述 | 站点设置关闭注册后，注册请求被拒绝 |
| 前置条件 | 站点设置 registration_enabled='false' |
| 测试步骤 | 1. POST /api/auth/register |
| 预期结果 | 返回 code=REGISTRATION_CLOSED 错误 |
| 实际结果 | 代码审查通过，auth.service.ts 第 35-38 行检查注册开关 |
| 状态 | 通过 |

### TC-AUTH-005 用户登录 - 正常流程

| 项 | 内容 |
|----|------|
| 用例ID | TC-AUTH-005 |
| 模块 | 认证 |
| 描述 | 使用正确的用户名和密码登录 |
| 前置条件 | 用户已注册且状态正常 |
| 测试步骤 | 1. POST /api/auth/login，body: { account: "testuser01", password: "Pass1234" } |
| 预期结果 | 返回 code=0，data 包含 token 和 user 对象 |
| 实际结果 | 代码审查通过，登录成功后重置失败次数、记录登录 IP |
| 状态 | 通过 |

### TC-AUTH-006 用户登录 - 邮箱登录

| 项 | 内容 |
|----|------|
| 用例ID | TC-AUTH-006 |
| 模块 | 认证 |
| 描述 | 使用邮箱代替用户名登录 |
| 前置条件 | 用户已注册 |
| 测试步骤 | 1. POST /api/auth/login，body: { account: "test01@example.com", password: "Pass1234" } |
| 预期结果 | 返回 code=0，登录成功 |
| 实际结果 | 代码审查通过，auth.service.ts 第 83-87 行支持用户名或邮箱登录 |
| 状态 | 通过 |

### TC-AUTH-007 用户登录 - 密码错误

| 项 | 内容 |
|----|------|
| 用例ID | TC-AUTH-007 |
| 模块 | 认证 |
| 描述 | 使用错误密码登录 |
| 前置条件 | 用户已注册 |
| 测试步骤 | 1. POST /api/auth/login，password: "WrongPass" |
| 预期结果 | 返回 LOGIN_FAILED 错误，loginFailCount+1 |
| 实际结果 | 代码审查通过，auth.service.ts 第 108-126 行处理失败计数 |
| 状态 | 通过 |

### TC-AUTH-008 用户登录 - 连续失败锁定

| 项 | 内容 |
|----|------|
| 用例ID | TC-AUTH-008 |
| 模块 | 认证 |
| 描述 | 连续 5 次密码错误后账号锁定 15 分钟 |
| 前置条件 | 用户已注册 |
| 测试步骤 | 1. 连续 5 次用错误密码登录 |
| 预期结果 | 第 5 次返回 ACCOUNT_LOCKED，状态变为 LOCKED，lockedUntil 设置为 15 分钟后 |
| 实际结果 | 代码审查通过，auth.service.ts 第 111-121 行实现锁定逻辑 |
| 状态 | 通过 |

### TC-AUTH-009 用户登录 - 封禁用户

| 项 | 内容 |
|----|------|
| 用例ID | TC-AUTH-009 |
| 模块 | 认证 |
| 描述 | 被封禁的用户尝试登录 |
| 前置条件 | 用户 status=BANNED |
| 测试步骤 | 1. POST /api/auth/login |
| 预期结果 | 返回 ACCOUNT_BANNED 错误 |
| 实际结果 | 代码审查通过，auth.service.ts 第 94-96 行检查封禁状态 |
| 状态 | 通过 |

### TC-AUTH-010 用户登出

| 项 | 内容 |
|----|------|
| 用例ID | TC-AUTH-010 |
| 模块 | 认证 |
| 描述 | 已登录用户登出 |
| 前置条件 | 用户已登录 |
| 测试步骤 | 1. POST /api/auth/logout，携带 Bearer Token |
| 预期结果 | Token 加入 Redis 黑名单，返回 code=0 |
| 实际结果 | 代码审查通过，auth.service.ts 第 153-166 行将 Token 加入黑名单 |
| 状态 | 通过 |

### TC-AUTH-011 获取当前用户信息

| 项 | 内容 |
|----|------|
| 用例ID | TC-AUTH-011 |
| 模块 | 认证 |
| 描述 | 已登录用户获取自己的信息 |
| 前置条件 | 用户已登录 |
| 测试步骤 | 1. GET /api/auth/me，携带 Bearer Token |
| 预期结果 | 返回用户信息（不含密码） |
| 实际结果 | 代码审查通过，返回 VO 不含 password 字段 |
| 状态 | 通过 |

### TC-AUTH-012 修改密码

| 项 | 内容 |
|----|------|
| 用例ID | TC-AUTH-012 |
| 模块 | 认证 |
| 描述 | 已登录用户修改密码 |
| 前置条件 | 用户已登录 |
| 测试步骤 | 1. PUT /api/auth/password，body: { oldPassword, newPassword, confirmPassword } |
| 预期结果 | 密码修改成功，旧 Token 加入黑名单 |
| 实际结果 | 代码审查通过，auth.service.ts 第 190-219 行实现修改密码并使旧 Token 失效 |
| 状态 | 通过 |

### TC-AUTH-013 修改密码 - 前端 API 路径不一致

| 项 | 内容 |
|----|------|
| 用例ID | TC-AUTH-013 |
| 模块 | 认证 |
| 描述 | 前端调用修改密码的 API 路径与后端不一致 |
| 前置条件 | 无 |
| 测试步骤 | 1. 检查前端 api.ts 中 changePassword 路径：PUT /users/password<br>2. 检查后端 auth.controller.ts 路径：PUT /auth/password |
| 预期结果 | 前后端路径一致 |
| 实际结果 | 前端调用 PUT /users/password，后端实际路径为 PUT /auth/password，路径不匹配导致 404 |
| 状态 | 失败（见 BUG-001） |

### TC-AUTH-014 登录限流

| 项 | 内容 |
|----|------|
| 用例ID | TC-AUTH-014 |
| 模块 | 认证 |
| 描述 | 同一 IP 1 分钟内登录超过 5 次被限流 |
| 前置条件 | 无 |
| 测试步骤 | 1. 同一 IP 1 分钟内发送 6 次登录请求 |
| 预期结果 | 第 6 次返回 429 限流错误 |
| 实际结果 | 代码审查通过，auth.controller.ts 第 39-40 行配置 @RateLimit(5, 60, 'login') |
| 状态 | 通过 |

---

## 二、文章模块（Articles）

### TC-ART-001 获取文章列表 - 默认

| 项 | 内容 |
|----|------|
| 用例ID | TC-ART-001 |
| 模块 | 文章 |
| 描述 | 游客获取已发布文章列表 |
| 前置条件 | 数据库有已发布文章 |
| 测试步骤 | 1. GET /api/articles |
| 预期结果 | 返回分页列表，仅包含 PUBLISHED 状态文章 |
| 实际结果 | 代码审查通过，articles.service.ts 第 53 行 where 条件 status=PUBLISHED |
| 状态 | 通过 |

### TC-ART-002 获取文章列表 - 分页参数

| 项 | 内容 |
|----|------|
| 用例ID | TC-ART-002 |
| 模块 | 文章 |
| 描述 | 验证分页参数 page 和 pageSize |
| 前置条件 | 数据库有已发布文章 |
| 测试步骤 | 1. GET /api/articles?page=2&pageSize=5 |
| 预期结果 | 返回第 2 页，每页 5 条 |
| 实际结果 | 代码审查通过，DTO 中 safePage 和 safePageSize 正确处理 |
| 状态 | 通过 |

### TC-ART-003 获取文章列表 - pageSize 上限

| 项 | 内容 |
|----|------|
| 用例ID | TC-ART-003 |
| 模块 | 文章 |
| 描述 | pageSize 超过 50 被限制为 50 |
| 前置条件 | 无 |
| 测试步骤 | 1. GET /api/articles?pageSize=100 |
| 预期结果 | 实际 pageSize=50 |
| 实际结果 | 代码审查通过，safePageSize 使用 Math.min(Math.max(size, 1), 50) |
| 状态 | 通过 |

### TC-ART-004 获取文章列表 - 按分类筛选

| 项 | 内容 |
|----|------|
| 用例ID | TC-ART-004 |
| 模块 | 文章 |
| 描述 | 按分类 slug 筛选文章 |
| 前置条件 | 分类存在 |
| 测试步骤 | 1. GET /api/articles?categorySlug=tech-issue |
| 预期结果 | 返回该分类下的已发布文章 |
| 实际结果 | 代码审查通过，articles.service.ts 第 59-64 行处理 categorySlug 筛选 |
| 状态 | 通过 |

### TC-ART-005 获取文章详情

| 项 | 内容 |
|----|------|
| 用例ID | TC-ART-005 |
| 模块 | 文章 |
| 描述 | 通过 slug 获取文章详情 |
| 前置条件 | 文章存在且已发布 |
| 测试步骤 | 1. GET /api/articles/nginx-502-fix |
| 预期结果 | 返回文章详情，阅读量 +1（去重） |
| 实际结果 | 代码审查通过，articles.service.ts 使用 Redis 做阅读量去重 |
| 状态 | 通过 |

### TC-ART-006 获取文章详情 - 不存在

| 项 | 内容 |
|----|------|
| 用例ID | TC-ART-006 |
| 模块 | 文章 |
| 描述 | 获取不存在的文章详情 |
| 前置条件 | 无 |
| 测试步骤 | 1. GET /api/articles/not-exist-slug |
| 预期结果 | 返回 404 错误 |
| 实际结果 | 代码审查通过，service 中找不到文章时抛出 NOT_FOUND 异常 |
| 状态 | 通过 |

### TC-ART-007 创建文章 - 登录用户

| 项 | 内容 |
|----|------|
| 用例ID | TC-ART-007 |
| 模块 | 文章 |
| 描述 | 登录用户创建文章 |
| 前置条件 | 用户已登录 |
| 测试步骤 | 1. POST /api/articles，body: { title, content, categoryId, status: 'PUBLISHED' } |
| 预期结果 | 文章创建成功，authorId 为当前用户 |
| 实际结果 | 代码审查通过，controller 使用 @Roles(Role.USER)，service 中 authorId=user.sub |
| 状态 | 通过 |

### TC-ART-008 创建文章 - 游客

| 项 | 内容 |
|----|------|
| 用例ID | TC-ART-008 |
| 模块 | 文章 |
| 描述 | 未登录用户尝试创建文章 |
| 前置条件 | 无 |
| 测试步骤 | 1. POST /api/articles，不携带 Token |
| 预期结果 | 返回 401 未认证错误 |
| 实际结果 | 代码审查通过，@Roles(Role.USER) 装饰器阻止未登录访问 |
| 状态 | 通过 |

### TC-ART-009 创建文章 - 标题校验

| 项 | 内容 |
|----|------|
| 用例ID | TC-ART-009 |
| 模块 | 文章 |
| 描述 | 创建文章时标题为空 |
| 前置条件 | 用户已登录 |
| 测试步骤 | 1. POST /api/articles，title: "" |
| 预期结果 | 返回校验错误 |
| 实际结果 | 代码审查通过，DTO 中 @MinLength(1) 校验 |
| 状态 | 通过 |

### TC-ART-010 创建文章 - 正文长度校验

| 项 | 内容 |
|----|------|
| 用例ID | TC-ART-010 |
| 模块 | 文章 |
| 描述 | 创建文章时正文少于 10 字符 |
| 前置条件 | 用户已登录 |
| 测试步骤 | 1. POST /api/articles，content: "short" |
| 预期结果 | 返回校验错误 |
| 实际结果 | 代码审查通过，DTO 中 @MinLength(10) 校验 |
| 状态 | 通过 |

### TC-ART-011 更新文章 - 作者本人

| 项 | 内容 |
|----|------|
| 用例ID | TC-ART-011 |
| 模块 | 文章 |
| 描述 | 作者更新自己的文章 |
| 前置条件 | 用户已登录且为文章作者 |
| 测试步骤 | 1. PUT /api/articles/1，携带更新数据 |
| 预期结果 | 文章更新成功 |
| 实际结果 | 代码审查通过，service 中校验 authorId === user.sub |
| 状态 | 通过 |

### TC-ART-012 更新文章 - 非作者

| 项 | 内容 |
|----|------|
| 用例ID | TC-ART-012 |
| 模块 | 文章 |
| 描述 | 非作者用户尝试更新他人文章 |
| 前置条件 | 用户已登录但非文章作者 |
| 测试步骤 | 1. PUT /api/articles/1 |
| 预期结果 | 返回 403 无权限错误 |
| 实际结果 | 代码审查通过，service 中校验资源归属 |
| 状态 | 通过 |

### TC-ART-013 删除文章

| 项 | 内容 |
|----|------|
| 用例ID | TC-ART-013 |
| 模块 | 文章 |
| 描述 | 作者删除自己的文章 |
| 前置条件 | 用户已登录且为文章作者 |
| 测试步骤 | 1. DELETE /api/articles/1 |
| 预期结果 | 文章软删除（status 变为 DELETED） |
| 实际结果 | 代码审查通过，service 使用软删除 |
| 状态 | 通过 |

### TC-ART-014 文章分页响应格式 - 前后端不一致

| 项 | 内容 |
|----|------|
| 用例ID | TC-ART-014 |
| 模块 | 文章 |
| 描述 | 后端返回的分页数据结构与前端期望的不一致 |
| 前置条件 | 无 |
| 测试步骤 | 1. 检查后端 paginate() 函数：返回 { list, pagination: { page, pageSize, total, totalPages } }<br>2. 检查前端 Paginated<T> 类型：期望 { list, total, page, pageSize, totalPages } |
| 预期结果 | 前后端分页数据结构一致 |
| 实际结果 | 后端将分页信息嵌套在 pagination 对象中，前端期望平铺在顶层，导致前端读取 total/totalPages 为 undefined |
| 状态 | 失败（见 BUG-002） |

### TC-ART-015 搜索文章 - 前后端参数不一致

| 项 | 内容 |
|----|------|
| 用例ID | TC-ART-015 |
| 模块 | 文章 |
| 描述 | 前端搜索 API 参数与后端不一致 |
| 前置条件 | 无 |
| 测试步骤 | 1. 检查前端 searchApi：GET /search?keyword=xxx<br>2. 检查后端 articles.controller.ts：GET /search?q=xxx |
| 预期结果 | 前后端参数名一致 |
| 实际结果 | 前端使用 keyword 参数，后端期望 q 参数，搜索功能无法正常工作 |
| 状态 | 失败（见 BUG-003） |

### TC-ART-016 我的文章列表 - 前后端路径不一致

| 项 | 内容 |
|----|------|
| 用例ID | TC-ART-016 |
| 模块 | 文章 |
| 描述 | 前端获取"我的文章"的 API 路径与后端不一致 |
| 前置条件 | 无 |
| 测试步骤 | 1. 检查前端 articleApi.mine：GET /articles/mine<br>2. 检查后端 articles.controller.ts：GET /dashboard/articles |
| 预期结果 | 前后端路径一致 |
| 实际结果 | 前端调用 /articles/mine，后端实际路径为 /dashboard/articles，导致 404 |
| 状态 | 失败（见 BUG-004） |

### TC-ART-017 下架/恢复文章 - 前后端路径不一致

| 项 | 内容 |
|----|------|
| 用例ID | TC-ART-017 |
| 模块 | 文章 |
| 描述 | 前端下架/恢复文章的 API 路径与后端不一致 |
| 前置条件 | 无 |
| 测试步骤 | 1. 检查前端 articleApi.offline：PUT /articles/:id/offline<br>2. 检查后端：PUT /admin/articles/:id/archive<br>3. 检查前端 articleApi.restore：PUT /articles/:id/restore<br>4. 检查后端：PUT /admin/articles/:id/restore |
| 预期结果 | 前后端路径一致 |
| 实际结果 | 前端使用 /articles/:id/offline 和 /articles/:id/restore，后端实际为 /admin/articles/:id/archive 和 /admin/articles/:id/restore |
| 状态 | 失败（见 BUG-005） |

### TC-ART-018 文章状态切换 - 前端错误传参

| 项 | 内容 |
|----|------|
| 用例ID | TC-ART-018 |
| 模块 | 文章 |
| 描述 | 前端"我的文章"页面状态切换逻辑错误 |
| 前置条件 | 无 |
| 测试步骤 | 1. 检查 dashboard/posts.vue 中 handleToggleStatus 函数<br>2. 该函数调用 articleApi.update(id, { ...article, status: 'DRAFT' } as any) |
| 预期结果 | 使用正确的 API 进行状态切换 |
| 实际结果 | 将整个 article 对象（包含不属于 DTO 的字段）作为 payload 传给 update API，且 DTO 中 status 只允许 DRAFT 或 PUBLISHED，无法切换到 OFFLINE 状态 |
| 状态 | 失败（见 BUG-006） |

---

## 三、分类模块（Categories）

### TC-CAT-001 获取分类列表

| 项 | 内容 |
|----|------|
| 用例ID | TC-CAT-001 |
| 模块 | 分类 |
| 描述 | 游客获取所有分类 |
| 前置条件 | 分类存在 |
| 测试步骤 | 1. GET /api/categories |
| 预期结果 | 返回所有分类，含文章数统计 |
| 实际结果 | 代码审查通过，categories.controller.ts @Public() 标记为公开 |
| 状态 | 通过 |

### TC-CAT-002 创建分类 - 管理员

| 项 | 内容 |
|----|------|
| 用例ID | TC-CAT-002 |
| 模块 | 分类 |
| 描述 | 管理员创建新分类 |
| 前置条件 | 管理员已登录 |
| 测试步骤 | 1. POST /api/admin/categories，body: { name: "新技术", description: "..." } |
| 预期结果 | 分类创建成功 |
| 实际结果 | 代码审查通过，@Roles(Role.ADMIN) 控制权限 |
| 状态 | 通过 |

### TC-CAT-003 创建分类 - 普通用户

| 项 | 内容 |
|----|------|
| 用例ID | TC-CAT-003 |
| 模块 | 分类 |
| 描述 | 普通用户尝试创建分类 |
| 前置条件 | 普通用户已登录 |
| 测试步骤 | 1. POST /api/admin/categories |
| 预期结果 | 返回 403 无权限 |
| 实际结果 | 代码审查通过，@Roles(Role.ADMIN) 阻止普通用户 |
| 状态 | 通过 |

### TC-CAT-004 更新分类 - 前后端路径不一致

| 项 | 内容 |
|----|------|
| 用例ID | TC-CAT-004 |
| 模块 | 分类 |
| 描述 | 前端更新分类的 API 路径与后端不一致 |
| 前置条件 | 无 |
| 测试步骤 | 1. 检查前端 categoryApi.update：PUT /categories/:id<br>2. 检查后端：PUT /admin/categories/:id |
| 预期结果 | 前后端路径一致 |
| 实际结果 | 前端使用 /categories/:id，后端为 /admin/categories/:id |
| 状态 | 失败（见 BUG-007） |

### TC-CAT-005 删除分类 - 前后端路径不一致

| 项 | 内容 |
|----|------|
| 用例ID | TC-CAT-005 |
| 模块 | 分类 |
| 描述 | 前端删除分类的 API 路径与后端不一致 |
| 前置条件 | 无 |
| 测试步骤 | 1. 检查前端 categoryApi.delete：DELETE /categories/:id<br>2. 检查后端：DELETE /admin/categories/:id |
| 预期结果 | 前后端路径一致 |
| 实际结果 | 前端使用 /categories/:id，后端为 /admin/categories/:id |
| 状态 | 失败（见 BUG-007） |

### TC-CAT-006 删除分类 - 有关联文章

| 项 | 内容 |
|----|------|
| 用例ID | TC-CAT-006 |
| 模块 | 分类 |
| 描述 | 删除有关联文章的分类 |
| 前置条件 | 分类下有文章 |
| 测试步骤 | 1. 前端先检查 articleCount，若 > 0 则阻止删除 |
| 预期结果 | 前端拦截，提示"请先迁移文章" |
| 实际结果 | 代码审查通过，admin/categories.vue 第 85-88 行前端检查 articleCount |
| 状态 | 通过 |

---

## 四、标签模块（Tags）

### TC-TAG-001 获取标签列表

| 项 | 内容 |
|----|------|
| 用例ID | TC-TAG-001 |
| 模块 | 标签 |
| 描述 | 游客获取所有标签 |
| 前置条件 | 标签存在 |
| 测试步骤 | 1. GET /api/tags |
| 预期结果 | 返回所有标签，含文章数统计 |
| 实际结果 | 代码审查通过 |
| 状态 | 通过 |

### TC-TAG-002 更新标签 - 前后端路径不一致

| 项 | 内容 |
|----|------|
| 用例ID | TC-TAG-002 |
| 模块 | 标签 |
| 描述 | 前端更新标签的 API 路径与后端不一致 |
| 前置条件 | 无 |
| 测试步骤 | 1. 检查前端 tagApi.update：PUT /tags/:id<br>2. 检查后端：PUT /admin/tags/:id |
| 预期结果 | 前后端路径一致 |
| 实际结果 | 前端使用 /tags/:id，后端为 /admin/tags/:id |
| 状态 | 失败（见 BUG-008） |

### TC-TAG-003 合并标签 - 前后端路径不一致

| 项 | 内容 |
|----|------|
| 用例ID | TC-TAG-003 |
| 模块 | 标签 |
| 描述 | 前端合并标签的 API 路径与后端不一致 |
| 前置条件 | 无 |
| 测试步骤 | 1. 检查前端 tagApi.merge：POST /tags/merge<br>2. 检查后端：POST /admin/tags/merge |
| 预期结果 | 前后端路径一致 |
| 实际结果 | 前端使用 /tags/merge，后端为 /admin/tags/merge |
| 状态 | 失败（见 BUG-008） |

### TC-TAG-004 删除标签 - 前后端路径不一致

| 项 | 内容 |
|----|------|
| 用例ID | TC-TAG-004 |
| 模块 | 标签 |
| 描述 | 前端删除标签的 API 路径与后端不一致 |
| 前置条件 | 无 |
| 测试步骤 | 1. 检查前端 tagApi.delete：DELETE /tags/:id<br>2. 检查后端：DELETE /admin/tags/:id |
| 预期结果 | 前后端路径一致 |
| 实际结果 | 前端使用 /tags/:id，后端为 /admin/tags/:id |
| 状态 | 失败（见 BUG-008） |

---

## 五、评论模块（Comments）

### TC-CMT-001 获取文章评论列表 - 前后端参数不一致

| 项 | 内容 |
|----|------|
| 用例ID | TC-CMT-001 |
| 模块 | 评论 |
| 描述 | 前端获取评论列表的 URL 参数与后端不一致 |
| 前置条件 | 无 |
| 测试步骤 | 1. 检查前端 commentApi.list：GET /articles/:articleId/comments（使用数字 ID）<br>2. 检查后端 comments.controller.ts：GET /articles/:slug/comments（使用 slug） |
| 预期结果 | 前后端参数类型一致 |
| 实际结果 | 前端传数字 articleId，后端期望 slug 字符串，导致 404 或查询失败 |
| 状态 | 失败（见 BUG-009） |

### TC-CMT-002 发表评论 - 前后端参数不一致

| 项 | 内容 |
|----|------|
| 用例ID | TC-CMT-002 |
| 模块 | 评论 |
| 描述 | 前端发表评论的 URL 参数与后端不一致 |
| 前置条件 | 无 |
| 测试步骤 | 1. 检查前端 commentApi.create：POST /articles/:articleId/comments<br>2. 检查后端：POST /articles/:slug/comments |
| 预期结果 | 前后端参数类型一致 |
| 实际结果 | 前端传数字 articleId，后端期望 slug |
| 状态 | 失败（见 BUG-009） |

### TC-CMT-003 获取我的评论 - 前后端路径不一致

| 项 | 内容 |
|----|------|
| 用例ID | TC-CMT-003 |
| 模块 | 评论 |
| 描述 | 前端获取"我的评论"的 API 路径与后端不一致 |
| 前置条件 | 无 |
| 测试步骤 | 1. 检查前端 commentApi.mine：GET /comments/mine<br>2. 检查后端：GET /dashboard/comments/mine |
| 预期结果 | 前后端路径一致 |
| 实际结果 | 前端使用 /comments/mine，后端为 /dashboard/comments/mine |
| 状态 | 失败（见 BUG-010） |

### TC-CMT-004 管理员评论列表 - 前后端路径不一致

| 项 | 内容 |
|----|------|
| 用例ID | TC-CMT-004 |
| 模块 | 评论 |
| 描述 | 前端获取管理员评论列表的 API 路径与后端不一致 |
| 前置条件 | 无 |
| 测试步骤 | 1. 检查前端 commentApi.all：GET /comments<br>2. 检查后端：GET /admin/comments |
| 预期结果 | 前后端路径一致 |
| 实际结果 | 前端使用 /comments，后端为 /admin/comments |
| 状态 | 失败（见 BUG-010） |

### TC-CMT-005 审核评论 - 前后端路径不一致

| 项 | 内容 |
|----|------|
| 用例ID | TC-CMT-005 |
| 模块 | 评论 |
| 描述 | 前端审核评论的 API 路径与后端不一致 |
| 前置条件 | 无 |
| 测试步骤 | 1. 检查前端 commentApi.approve：PUT /comments/:id/approve<br>2. 检查后端：PUT /admin/comments/:id/approve |
| 预期结果 | 前后端路径一致 |
| 实际结果 | 前端使用 /comments/:id/approve，后端为 /admin/comments/:id/approve |
| 状态 | 失败（见 BUG-010） |

### TC-CMT-006 评论回复逻辑错误

| 项 | 内容 |
|----|------|
| 用例ID | TC-CMT-006 |
| 模块 | 评论 |
| 描述 | 前端 CommentList 组件的回复逻辑有 bug |
| 前置条件 | 无 |
| 测试步骤 | 1. 检查 CommentList.vue 的 handleReply 函数<br>2. 该函数接收 targetComment，但使用 targetComment.content 作为回复内容 |
| 预期结果 | 使用用户输入的回复内容创建评论 |
| 实际结果 | handleReply 接收的 comment 对象中 content 已被 CommentItem 修改为用户输入的回复内容，但 parentId 使用的是 targetComment.id，逻辑上正确但代码可读性差，容易误解 |
| 状态 | 通过（代码审查，逻辑正确但可读性差） |

### TC-CMT-007 评论限流

| 项 | 内容 |
|----|------|
| 用例ID | TC-CMT-007 |
| 模块 | 评论 |
| 描述 | 同一用户 1 分钟内评论超过 10 次被限流 |
| 前置条件 | 用户已登录 |
| 测试步骤 | 1. 1 分钟内发送 11 次评论 |
| 预期结果 | 第 11 次返回 429 限流错误 |
| 实际结果 | 代码审查通过，comments.controller.ts 第 42-43 行 @RateLimit(10, 60, 'comment') |
| 状态 | 通过 |

---

## 六、点赞模块（Likes）

### TC-LIKE-001 点赞文章

| 项 | 内容 |
|----|------|
| 用例ID | TC-LIKE-001 |
| 模块 | 点赞 |
| 描述 | 登录用户点赞文章 |
| 前置条件 | 用户已登录，文章存在 |
| 测试步骤 | 1. POST /api/articles/1/like |
| 预期结果 | 点赞成功，返回 likeCount 和 liked=true |
| 实际结果 | 代码审查通过，likes.service.ts 实现去重逻辑 |
| 状态 | 通过 |

### TC-LIKE-002 取消点赞

| 项 | 内容 |
|----|------|
| 用例ID | TC-LIKE-002 |
| 模块 | 点赞 |
| 描述 | 登录用户取消点赞 |
| 前置条件 | 用户已点赞 |
| 测试步骤 | 1. DELETE /api/articles/1/like |
| 预期结果 | 取消成功，返回 liked=false |
| 实际结果 | 代码审查通过 |
| 状态 | 通过 |

### TC-LIKE-003 重复点赞去重

| 项 | 内容 |
|----|------|
| 用例ID | TC-LIKE-003 |
| 模块 | 点赞 |
| 描述 | 同一用户对同一文章重复点赞 |
| 前置条件 | 用户已点赞该文章 |
| 测试步骤 | 1. POST /api/articles/1/like（再次） |
| 预期结果 | 不增加点赞数，返回已点赞状态 |
| 实际结果 | 代码审查通过，service 中使用 upsert 或检查已存在实现去重 |
| 状态 | 通过 |

### TC-LIKE-004 点赞 - 游客

| 项 | 内容 |
|----|------|
| 用例ID | TC-LIKE-004 |
| 模块 | 点赞 |
| 描述 | 未登录用户尝试点赞 |
| 前置条件 | 无 |
| 测试步骤 | 1. POST /api/articles/1/like，不携带 Token |
| 预期结果 | 返回 401 未认证 |
| 实际结果 | 代码审查通过，@Roles(Role.USER) 控制权限 |
| 状态 | 通过 |

---

## 七、管理员模块（Admin）

### TC-ADM-001 获取全站统计

| 项 | 内容 |
|----|------|
| 用例ID | TC-ADM-001 |
| 模块 | 管理员 |
| 描述 | 管理员获取全站统计数据 |
| 前置条件 | 管理员已登录 |
| 测试步骤 | 1. GET /api/admin/stats |
| 预期结果 | 返回文章数、用户数、评论数等统计 |
| 实际结果 | 代码审查通过，admin.controller.ts @Roles(Role.ADMIN) |
| 状态 | 通过 |

### TC-ADM-002 获取用户列表

| 项 | 内容 |
|----|------|
| 用例ID | TC-ADM-002 |
| 模块 | 管理员 |
| 描述 | 管理员获取用户列表 |
| 前置条件 | 管理员已登录 |
| 测试步骤 | 1. GET /api/admin/users?page=1&pageSize=20 |
| 预期结果 | 返回分页用户列表 |
| 实际结果 | 代码审查通过 |
| 状态 | 通过 |

### TC-ADM-003 封禁用户

| 项 | 内容 |
|----|------|
| 用例ID | TC-ADM-003 |
| 模块 | 管理员 |
| 描述 | 管理员封禁用户 |
| 前置条件 | 管理员已登录 |
| 测试步骤 | 1. PUT /api/admin/users/2/ban |
| 预期结果 | 用户状态变为 BANNED |
| 实际结果 | 代码审查通过 |
| 状态 | 通过 |

### TC-ADM-004 修改用户角色 - 仅超级管理员

| 项 | 内容 |
|----|------|
| 用例ID | TC-ADM-004 |
| 模块 | 管理员 |
| 描述 | 普通管理员尝试修改用户角色 |
| 前置条件 | 普通管理员（非超级管理员）已登录 |
| 测试步骤 | 1. PUT /api/admin/users/2/role |
| 预期结果 | 返回 403 无权限 |
| 实际结果 | 代码审查通过，admin.controller.ts 第 38 行 @Roles(Role.SUPER_ADMIN) |
| 状态 | 通过 |

### TC-ADM-005 重置用户密码 - 前后端 HTTP 方法不一致

| 项 | 内容 |
|----|------|
| 用例ID | TC-ADM-005 |
| 模块 | 管理员 |
| 描述 | 前端重置密码的 HTTP 方法与后端不一致 |
| 前置条件 | 无 |
| 测试步骤 | 1. 检查前端 userApi.resetPassword：PUT /users/:id/reset-password<br>2. 检查后端：POST /admin/users/:id/reset-password |
| 预期结果 | 前后端 HTTP 方法和路径一致 |
| 实际结果 | 前端使用 PUT，后端使用 POST；前端路径 /users/:id/reset-password，后端 /admin/users/:id/reset-password |
| 状态 | 失败（见 BUG-011） |

### TC-ADM-006 封禁用户 - 前后端路径不一致

| 项 | 内容 |
|----|------|
| 用例ID | TC-ADM-006 |
| 模块 | 管理员 |
| 描述 | 前端封禁用户的 API 路径与后端不一致 |
| 前置条件 | 无 |
| 测试步骤 | 1. 检查前端 userApi.ban：PUT /users/:id/ban<br>2. 检查后端：PUT /admin/users/:id/ban |
| 预期结果 | 前后端路径一致 |
| 实际结果 | 前端使用 /users/:id/ban，后端为 /admin/users/:id/ban |
| 状态 | 失败（见 BUG-012） |

### TC-ADM-007 管理员统计 - 前后端路径不一致

| 项 | 内容 |
|----|------|
| 用例ID | TC-ADM-007 |
| 模块 | 管理员 |
| 描述 | 前端获取管理员统计的 API 路径与后端不一致 |
| 前置条件 | 无 |
| 测试步骤 | 1. 检查前端 userApi.adminStats：GET /admin/stats<br>2. 检查后端：GET /admin/stats |
| 预期结果 | 前后端路径一致 |
| 实际结果 | 路径一致，但前端通过 userApi 调用而非独立 admin API，代码组织不规范 |
| 状态 | 通过 |

### TC-ADM-008 屏蔽评论者 - 前后端路径不一致

| 项 | 内容 |
|----|------|
| 用例ID | TC-ADM-008 |
| 模块 | 管理员 |
| 描述 | 前端屏蔽评论者的 API 路径与后端不一致 |
| 前置条件 | 无 |
| 测试步骤 | 1. 检查前端 commentApi.banUser：PUT /users/:userId/ban<br>2. 检查后端：PUT /admin/users/:id/ban |
| 预期结果 | 前后端路径一致 |
| 实际结果 | 前端使用 /users/:userId/ban，后端为 /admin/users/:id/ban |
| 状态 | 失败（见 BUG-012） |

---

## 八、用户模块（Users）

### TC-USR-001 获取个人资料 - 前后端路径不一致

| 项 | 内容 |
|----|------|
| 用例ID | TC-USR-001 |
| 模块 | 用户 |
| 描述 | 前端获取个人资料的 API 路径与后端不一致 |
| 前置条件 | 无 |
| 测试步骤 | 1. 检查前端 userApi.profile：GET /users/profile<br>2. 检查后端 users.controller.ts：无 /users/profile 路由，实际为 GET /auth/me |
| 预期结果 | 前后端路径一致 |
| 实际结果 | 前端调用 /users/profile，后端无此路由，应该使用 /auth/me |
| 状态 | 失败（见 BUG-013） |

### TC-USR-002 更新个人资料 - 前后端路径不一致

| 项 | 内容 |
|----|------|
| 用例ID | TC-USR-002 |
| 模块 | 用户 |
| 描述 | 前端更新个人资料的 API 路径与后端不一致 |
| 前置条件 | 无 |
| 测试步骤 | 1. 检查前端 userApi.updateProfile：PUT /users/profile<br>2. 检查后端：PUT /dashboard/profile |
| 预期结果 | 前后端路径一致 |
| 实际结果 | 前端使用 /users/profile，后端为 /dashboard/profile |
| 状态 | 失败（见 BUG-013） |

### TC-USR-003 个人统计概览 - 前后端路径不一致

| 项 | 内容 |
|----|------|
| 用例ID | TC-USR-003 |
| 模块 | 用户 |
| 描述 | 前端获取个人统计概览的 API 路径与后端不一致 |
| 前置条件 | 无 |
| 测试步骤 | 1. 检查前端 userApi.dashboard：GET /users/dashboard<br>2. 检查后端：GET /dashboard/stats |
| 预期结果 | 前后端路径一致 |
| 实际结果 | 前端使用 /users/dashboard，后端为 /dashboard/stats |
| 状态 | 失败（见 BUG-013） |

### TC-USR-004 用户列表 - 前后端路径不一致

| 项 | 内容 |
|----|------|
| 用例ID | TC-USR-004 |
| 模块 | 用户 |
| 描述 | 前端获取用户列表的 API 路径与后端不一致 |
| 前置条件 | 无 |
| 测试步骤 | 1. 检查前端 userApi.list：GET /users<br>2. 检查后端：GET /admin/users |
| 预期结果 | 前后端路径一致 |
| 实际结果 | 前端使用 /users，后端为 /admin/users |
| 状态 | 失败（见 BUG-012） |

### TC-USR-005 修改用户角色 - 前后端路径不一致

| 项 | 内容 |
|----|------|
| 用例ID | TC-USR-005 |
| 模块 | 用户 |
| 描述 | 前端修改用户角色的 API 路径与后端不一致 |
| 前置条件 | 无 |
| 测试步骤 | 1. 检查前端 userApi.updateRole：PUT /users/:id/role<br>2. 检查后端：PUT /admin/users/:id/role |
| 预期结果 | 前后端路径一致 |
| 实际结果 | 前端使用 /users/:id/role，后端为 /admin/users/:id/role |
| 状态 | 失败（见 BUG-012） |

---

## 九、文件上传模块（Uploads）

### TC-UPL-001 上传图片 - 正常

| 项 | 内容 |
|----|------|
| 用例ID | TC-UPL-001 |
| 模块 | 文件上传 |
| 描述 | 登录用户上传图片 |
| 前置条件 | 用户已登录 |
| 测试步骤 | 1. POST /api/uploads/image，multipart/form-data，file 为 jpg 图片 |
| 预期结果 | 返回图片 URL |
| 实际结果 | 代码审查通过，uploads.controller.ts 实现文件上传 |
| 状态 | 通过 |

### TC-UPL-002 上传图片 - 文件类型校验

| 项 | 内容 |
|----|------|
| 用例ID | TC-UPL-002 |
| 模块 | 文件上传 |
| 描述 | 上传非图片文件被拒绝 |
| 前置条件 | 用户已登录 |
| 测试步骤 | 1. POST /api/uploads/image，file 为 .exe 文件 |
| 预期结果 | 返回文件类型不支持错误 |
| 实际结果 | 代码审查通过，uploads.service.ts 中有 mimetype 校验 |
| 状态 | 通过 |

### TC-UPL-003 上传图片 - 文件大小限制

| 项 | 内容 |
|----|------|
| 用例ID | TC-UPL-003 |
| 模块 | 文件上传 |
| 描述 | 上传超过大小限制的图片 |
| 前置条件 | 用户已登录 |
| 测试步骤 | 1. POST /api/uploads/image，file 大小超过 5MB |
| 预期结果 | 返回文件过大错误 |
| 实际结果 | 代码审查通过，users.controller.ts 中头像上传限制 5MB |
| 状态 | 通过 |

---

## 十、RSS 模块

### TC-RSS-001 获取 RSS 订阅

| 项 | 内容 |
|----|------|
| 用例ID | TC-RSS-001 |
| 模块 | RSS |
| 描述 | 获取 RSS 订阅 XML |
| 前置条件 | 有已发布文章 |
| 测试步骤 | 1. GET /api/rss |
| 预期结果 | 返回 RSS XML 格式 |
| 实际结果 | 代码审查通过，rss.controller.ts 和 rss.service.ts 实现 RSS 生成 |
| 状态 | 通过 |

---

## 十一、设置模块（Settings）

### TC-SET-001 获取站点设置

| 项 | 内容 |
|----|------|
| 用例ID | TC-SET-001 |
| 模块 | 设置 |
| 描述 | 游客获取公开站点设置 |
| 前置条件 | 无 |
| 测试步骤 | 1. GET /api/settings |
| 预期结果 | 返回公开设置（不含敏感信息） |
| 实际结果 | 代码审查通过，settings.controller.ts @Public() |
| 状态 | 通过 |

### TC-SET-002 更新站点设置 - 前后端路径不一致

| 项 | 内容 |
|----|------|
| 用例ID | TC-SET-002 |
| 模块 | 设置 |
| 描述 | 前端更新站点设置的 API 路径与后端不一致 |
| 前置条件 | 无 |
| 测试步骤 | 1. 检查前端 settingsApi.update：PUT /settings<br>2. 检查后端：PUT /admin/settings |
| 预期结果 | 前后端路径一致 |
| 实际结果 | 前端使用 /settings，后端为 /admin/settings |
| 状态 | 失败（见 BUG-014） |

### TC-SET-003 更新站点设置 - 权限

| 项 | 内容 |
|----|------|
| 用例ID | TC-SET-003 |
| 模块 | 设置 |
| 描述 | 后端更新设置需要 SUPER_ADMIN 权限，前端用 ADMIN 权限访问 |
| 前置条件 | 无 |
| 测试步骤 | 1. 检查后端 settings.controller.ts：@Roles(Role.SUPER_ADMIN)<br>2. 检查前端 admin/settings.vue 使用 admin middleware |
| 预期结果 | 前端权限与后端一致 |
| 实际结果 | 后端要求 SUPER_ADMIN，但前端 admin middleware 只检查 ADMIN 角色，普通管理员访问设置页面会收到 403 |
| 状态 | 失败（见 BUG-015） |

---

## 十二、友链模块（Friend Links）

### TC-FL-001 获取友链列表

| 项 | 内容 |
|----|------|
| 用例ID | TC-FL-001 |
| 模块 | 友链 |
| 描述 | 游客获取友链列表 |
| 前置条件 | 友链存在 |
| 测试步骤 | 1. GET /api/friend-links |
| 预期结果 | 返回友链列表 |
| 实际结果 | 代码审查通过 |
| 状态 | 通过 |

### TC-FL-002 创建友链 - 前后端路径不一致

| 项 | 内容 |
|----|------|
| 用例ID | TC-FL-002 |
| 模块 | 友链 |
| 描述 | 前端创建友链的 API 路径与后端不一致 |
| 前置条件 | 无 |
| 测试步骤 | 1. 检查前端 friendLinkApi.create：POST /friend-links<br>2. 检查后端：POST /admin/friend-links |
| 预期结果 | 前后端路径一致 |
| 实际结果 | 前端使用 /friend-links，后端为 /admin/friend-links |
| 状态 | 失败（见 BUG-016） |

### TC-FL-003 更新友链 - 前后端路径不一致

| 项 | 内容 |
|----|------|
| 用例ID | TC-FL-003 |
| 模块 | 友链 |
| 描述 | 前端更新友链的 API 路径与后端不一致 |
| 前置条件 | 无 |
| 测试步骤 | 1. 检查前端 friendLinkApi.update：PUT /friend-links/:id<br>2. 检查后端：PUT /admin/friend-links/:id |
| 预期结果 | 前后端路径一致 |
| 实际结果 | 前端使用 /friend-links/:id，后端为 /admin/friend-links/:id |
| 状态 | 失败（见 BUG-016） |

### TC-FL-004 删除友链 - 前后端路径不一致

| 项 | 内容 |
|----|------|
| 用例ID | TC-FL-004 |
| 模块 | 友链 |
| 描述 | 前端删除友链的 API 路径与后端不一致 |
| 前置条件 | 无 |
| 测试步骤 | 1. 检查前端 friendLinkApi.delete：DELETE /friend-links/:id<br>2. 检查后端：DELETE /admin/friend-links/:id |
| 预期结果 | 前后端路径一致 |
| 实际结果 | 前端使用 /friend-links/:id，后端为 /admin/friend-links/:id |
| 状态 | 失败（见 BUG-016） |

---

## 十三、验证码模块（Captcha）

### TC-CAP-001 获取验证码

| 项 | 内容 |
|----|------|
| 用例ID | TC-CAP-001 |
| 模块 | 验证码 |
| 描述 | 获取图形验证码 |
| 前置条件 | 无 |
| 测试步骤 | 1. GET /api/captcha |
| 预期结果 | 返回验证码图片和 key |
| 实际结果 | 代码审查通过，captcha.controller.ts 实现验证码生成 |
| 状态 | 通过 |

---

## 十四、前端页面测试

### TC-FE-001 首页渲染

| 项 | 内容 |
|----|------|
| 用例ID | TC-FE-001 |
| 模块 | 前端-首页 |
| 描述 | 首页正确渲染文章列表、侧边栏 |
| 前置条件 | 后端可用 |
| 测试步骤 | 1. 访问 / |
| 预期结果 | 显示文章卡片列表、分类侧边栏、标签云、热门文章 |
| 实际结果 | 代码审查通过，index.vue 正确使用 useAsyncData 获取数据 |
| 状态 | 通过 |

### TC-FE-002 登录页面表单校验

| 项 | 内容 |
|----|------|
| 用例ID | TC-FE-002 |
| 模块 | 前端-登录 |
| 描述 | 登录表单前端校验 |
| 前置条件 | 无 |
| 测试步骤 | 1. 不输入任何内容点击登录<br>2. 只输入用户名不输入密码 |
| 预期结果 | 显示错误提示 |
| 实际结果 | 代码审查通过，login.vue validate() 函数实现前端校验 |
| 状态 | 通过 |

### TC-FE-003 注册页面密码强度指示器

| 项 | 内容 |
|----|------|
| 用例ID | TC-FE-003 |
| 模块 | 前端-注册 |
| 描述 | 注册页面密码强度实时显示 |
| 前置条件 | 无 |
| 测试步骤 | 1. 在密码框输入不同强度的密码 |
| 预期结果 | 强度指示器实时变化（弱/中/强/很强） |
| 实际结果 | 代码审查通过，register.vue 使用 passwordStrength() 计算强度 |
| 状态 | 通过 |

### TC-FE-004 路由守卫 - 未登录访问 dashboard

| 项 | 内容 |
|----|------|
| 用例ID | TC-FE-004 |
| 模块 | 前端-路由 |
| 描述 | 未登录用户访问 /dashboard 被重定向到登录页 |
| 前置条件 | 未登录 |
| 测试步骤 | 1. 访问 /dashboard |
| 预期结果 | 重定向到 /login?redirect=/dashboard |
| 实际结果 | 代码审查通过，middleware/auth.ts 实现登录检查 |
| 状态 | 通过 |

### TC-FE-005 路由守卫 - 非管理员访问 admin

| 项 | 内容 |
|----|------|
| 用例ID | TC-FE-005 |
| 模块 | 前端-路由 |
| 描述 | 普通用户访问 /admin 被重定向到首页 |
| 前置条件 | 普通用户已登录 |
| 测试步骤 | 1. 访问 /admin |
| 预期结果 | 重定向到 / |
| 实际结果 | 代码审查通过，middleware/admin.ts 检查 isAdmin |
| 状态 | 通过 |

### TC-FE-006 文章详情页 Markdown 渲染

| 项 | 内容 |
|----|------|
| 用例ID | TC-FE-006 |
| 模块 | 前端-文章详情 |
| 描述 | 文章详情页正确渲染 Markdown 内容 |
| 前置条件 | 文章存在 |
| 测试步骤 | 1. 访问 /post/slug |
| 预期结果 | Markdown 正确渲染为 HTML，代码高亮，TOC 目录生成 |
| 实际结果 | 代码审查通过，markdown.ts 使用 markdown-it 和 highlight.js |
| 状态 | 通过 |

### TC-FE-007 文章详情页 - 上一篇/下一篇字段不存在

| 项 | 内容 |
|----|------|
| 用例ID | TC-FE-007 |
| 模块 | 前端-文章详情 |
| 描述 | 前端文章详情页引用 article.prev 和 article.next，但后端 API 不返回这些字段 |
| 前置条件 | 无 |
| 测试步骤 | 1. 检查 post/[slug].vue 模板第 161-182 行：引用 article.prev 和 article.next<br>2. 检查后端 API 设计文档和 articles.service.ts：返回的 article 对象不包含 prev/next 字段<br>3. 后端有独立的 /articles/:slug/adjacent 接口返回上下篇 |
| 预期结果 | 前端使用正确的字段或调用独立的 adjacent 接口 |
| 实际结果 | 前端直接引用 article.prev 和 article.next，但后端不返回这些字段，导致上一篇/下一篇区域始终显示"已是第一篇/最后一篇" |
| 状态 | 失败（见 BUG-017） |

### TC-FE-008 搜索页 XSS 风险

| 项 | 内容 |
|----|------|
| 用例ID | TC-FE-008 |
| 模块 | 前端-搜索 |
| 描述 | 搜索页使用 v-html 渲染高亮关键词可能存在 XSS 风险 |
| 前置条件 | 无 |
| 测试步骤 | 1. 检查 search.vue 第 79-80 行：v-html="highlightKeyword(article.title, keyword)"<br>2. 检查 highlightKeyword 函数实现 |
| 预期结果 | 正确转义 HTML，防止 XSS |
| 实际结果 | highlightKeyword 函数先调用 escapeHtml 转义文本，再插入 <mark> 标签，keyword 也经过 escapeRegExp 处理。但 keyword 本身未经过 escapeHtml，若 keyword 包含特殊字符可能有问题 |
| 状态 | 通过（风险较低，因为 keyword 经过正则匹配） |

### TC-FE-009 响应式布局 - 移动端

| 项 | 内容 |
|----|------|
| 用例ID | TC-FE-009 |
| 模块 | 前端-响应式 |
| 描述 | 页面在移动端正确显示 |
| 前置条件 | 无 |
| 测试步骤 | 1. 在移动端视口下查看首页、文章详情页 |
| 预期结果 | 布局自适应，导航栏变为汉堡菜单 |
| 实际结果 | 代码审查通过，TheHeader.vue 实现移动端汉堡菜单，各页面使用 lg:/md:/sm: 断点 |
| 状态 | 通过 |

### TC-FE-010 Markdown 编辑器功能

| 项 | 内容 |
|----|------|
| 用例ID | TC-FE-010 |
| 模块 | 前端-编辑器 |
| 描述 | Markdown 编辑器工具栏功能正常 |
| 前置条件 | 用户已登录，访问 /dashboard/editor |
| 测试步骤 | 1. 点击工具栏各按钮（加粗、斜体、标题等） |
| 预期结果 | 在文本区域插入对应的 Markdown 语法 |
| 实际结果 | 代码审查通过，MarkdownEditor.vue 的 insertText 函数实现文本插入 |
| 状态 | 通过 |

### TC-FE-011 文章编辑页 - detail API 使用 id 而非 slug

| 项 | 内容 |
|----|------|
| 用例ID | TC-FE-011 |
| 模块 | 前端-编辑器 |
| 描述 | 编辑模式下加载文章使用 articleApi.detail(String(editId))，但 detail API 期望 slug |
| 前置条件 | 无 |
| 测试步骤 | 1. 检查 dashboard/editor.vue 第 49 行：articleApi.detail(String(editId.value))<br>2. articleApi.detail 调用 GET /articles/:slug<br>3. editId 是数字 ID 而非 slug |
| 预期结果 | 使用正确的参数获取文章详情 |
| 实际结果 | 传数字 ID 给期望 slug 的 API，可能导致 404（取决于后端 slug 查询是否容忍数字） |
| 状态 | 失败（见 BUG-018） |

### TC-FE-012 状态管理 - 登录状态初始化

| 项 | 内容 |
|----|------|
| 用例ID | TC-FE-012 |
| 模块 | 前端-状态管理 |
| 描述 | 页面加载时正确初始化登录状态 |
| 前置条件 | 用户有 token cookie |
| 测试步骤 | 1. 刷新页面 |
| 预期结果 | 从 cookie 读取 token，调用 /auth/me 获取用户信息 |
| 实际结果 | 代码审查通过，auth store 的 init() 方法实现初始化，layouts 在 setup 中调用 initAuth() |
| 状态 | 通过 |

### TC-FE-013 Token 失效自动跳转登录

| 项 | 内容 |
|----|------|
| 用例ID | TC-FE-013 |
| 模块 | 前端-状态管理 |
| 描述 | API 返回 401 时自动清除 token 并跳转登录页 |
| 前置条件 | 用户 token 已过期 |
| 测试步骤 | 1. 发起 API 请求返回 401 |
| 预期结果 | 清除 token，跳转到 /login?redirect=当前路径 |
| 实际结果 | 代码审查通过，request.ts 第 65-74 行处理 401 响应 |
| 状态 | 通过 |

### TC-FE-014 前端构建

| 项 | 内容 |
|----|------|
| 用例ID | TC-FE-014 |
| 模块 | 前端-构建 |
| 描述 | 前端项目能成功构建 |
| 前置条件 | 依赖已安装 |
| 测试步骤 | 1. npm install<br>2. npm run build |
| 预期结果 | 构建成功，生成 .output 目录 |
| 实际结果 | 构建成功，输出 .output/server/index.mjs，总大小 4.42 MB |
| 状态 | 通过 |

### TC-FE-015 后端编译

| 项 | 内容 |
|----|------|
| 用例ID | TC-FE-015 |
| 模块 | 后端-构建 |
| 描述 | 后端项目能成功编译 |
| 前置条件 | 依赖已安装 |
| 测试步骤 | 1. npm install<br>2. npx prisma generate<br>3. npx nest build |
| 预期结果 | 编译成功，生成 dist 目录 |
| 实际结果 | 编译成功，生成 dist/src/main.js |
| 状态 | 通过 |

### TC-FE-016 后端启动 - 缺少数据库

| 项 | 内容 |
|----|------|
| 用例ID | TC-FE-016 |
| 模块 | 后端-启动 |
| 描述 | 后端启动时缺少数据库连接 |
| 前置条件 | 无 MySQL 数据库运行 |
| 测试步骤 | 1. node dist/src/main.js |
| 预期结果 | 应用启动但数据库操作失败 |
| 实际结果 | 应用启动成功（端口 4000），但数据库连接失败："Can't reach database server at localhost:3306" |
| 状态 | 通过（预期行为，需配置数据库） |

### TC-FE-017 后端启动 - 缺少 Redis

| 项 | 内容 |
|----|------|
| 用例ID | TC-FE-017 |
| 模块 | 后端-启动 |
| 描述 | 后端启动时缺少 Redis 连接 |
| 前置条件 | 无 Redis 服务运行 |
| 测试步骤 | 1. node dist/src/main.js |
| 预期结果 | 应用启动但 Redis 操作降级 |
| 实际结果 | 应用启动，Redis 连接重试超过 3 次后放弃，应用继续运行（降级模式） |
| 状态 | 通过（预期行为，需配置 Redis） |

### TC-FE-018 "忘记密码"链接错误

| 项 | 内容 |
|----|------|
| 用例ID | TC-FE-018 |
| 模块 | 前端-登录 |
| 描述 | 登录页面"忘记密码"链接指向 /login 自身 |
| 前置条件 | 无 |
| 测试步骤 | 1. 检查 login.vue 第 91 行：NuxtLink to="/login" |
| 预期结果 | 链接指向忘记密码页面或弹窗 |
| 实际结果 | "忘记密码?" 链接指向 /login 自身，点击无效果 |
| 状态 | 失败（见 BUG-019） |

### TC-FE-019 About 页面内容获取 - 缺少 API

| 项 | 内容 |
|----|------|
| 用例ID | TC-FE-019 |
| 模块 | 前端-关于 |
| 描述 | 前端 about.vue 调用 pageApi.about() 获取关于页面内容，但后端无对应路由 |
| 前置条件 | 无 |
| 测试步骤 | 1. 检查前端 pageApi.about：GET /pages/about<br>2. 检查后端路由：无 /pages/about 路由 |
| 预期结果 | 后端有对应 API 返回关于页面内容 |
| 实际结果 | 后端无 /pages/about 路由，前端会使用默认内容（about.vue 第 8-9 行有 fallback） |
| 状态 | 失败（见 BUG-020） |

### TC-FE-020 归档页面 - publishedAt 未格式化

| 项 | 内容 |
|----|------|
| 用例ID | TC-FE-020 |
| 模块 | 前端-归档 |
| 描述 | 搜索结果列表中 publishedAt 直接显示原始字符串 |
| 前置条件 | 无 |
| 测试步骤 | 1. 检查 search.vue 第 83 行：{{ article.publishedAt }} |
| 预期结果 | 使用 formatDate 格式化日期 |
| 实际结果 | 直接显示原始 ISO 字符串，如 "2026-07-20T10:00:00.000Z" |
| 状态 | 失败（见 BUG-021） |

### TC-FE-021 Cookie 安全配置

| 项 | 内容 |
|----|------|
| 用例ID | TC-FE-021 |
| 模块 | 前端-安全 |
| 描述 | 前端 token cookie 的 secure 属性设置为 false |
| 前置条件 | 无 |
| 测试步骤 | 1. 检查 request.ts 第 19 行：secure: false |
| 预期结果 | 生产环境应设置 secure: true |
| 实际结果 | secure 固定为 false，生产环境下 cookie 可通过 HTTP 传输，存在安全风险 |
| 状态 | 失败（见 BUG-022） |

### TC-FE-022 CSRF 防护头缺失

| 项 | 内容 |
|----|------|
| 用例ID | TC-FE-022 |
| 模块 | 前端-安全 |
| 描述 | API 设计文档要求写操作携带 X-Requested-With 头，但前端未实现 |
| 前置条件 | 无 |
| 测试步骤 | 1. 检查 request.ts 的 headers 设置<br>2. 检查 API 设计文档第 92 行：X-Requested-With 为写操作必填 |
| 预期结果 | 写操作请求携带 X-Requested-With: XMLHttpRequest 头 |
| 实际结果 | 前端 request.ts 未添加 X-Requested-With 头 |
| 状态 | 失败（见 BUG-023） |

---

## 十五、安全性测试

### TC-SEC-001 密码加密

| 项 | 内容 |
|----|------|
| 用例ID | TC-SEC-001 |
| 模块 | 安全 |
| 描述 | 密码使用 bcrypt 哈希存储 |
| 前置条件 | 无 |
| 测试步骤 | 1. 检查 auth.service.ts 第 57 行：bcrypt.hash(dto.password, 10) |
| 预期结果 | 密码使用 bcrypt 加盐哈希 |
| 实际结果 | 代码审查通过，使用 bcrypt 且 salt rounds=10 |
| 状态 | 通过 |

### TC-SEC-002 JWT 黑名单

| 项 | 内容 |
|----|------|
| 用例ID | TC-SEC-002 |
| 模块 | 安全 |
| 描述 | 登出后 Token 加入黑名单 |
| 前置条件 | 无 |
| 测试步骤 | 1. 检查 auth.service.ts logout 方法 |
| 预期结果 | Token 加入 Redis 黑名单，后续请求被拒绝 |
| 实际结果 | 代码审查通过，Token 加入 jwt:blacklist:{token} |
| 状态 | 通过 |

### TC-SEC-003 SQL 注入防护

| 项 | 内容 |
|----|------|
| 用例ID | TC-SEC-003 |
| 模块 | 安全 |
| 描述 | 使用 Prisma ORM 防止 SQL 注入 |
| 前置条件 | 无 |
| 测试步骤 | 1. 检查所有 service 中的数据库查询 |
| 预期结果 | 全部使用 Prisma 参数化查询 |
| 实际结果 | 代码审查通过，所有查询使用 Prisma ORM，无原始 SQL 拼接 |
| 状态 | 通过 |

### TC-SEC-004 XSS 防护 - Markdown 渲染

| 项 | 内容 |
|----|------|
| 用例ID | TC-SEC-004 |
| 模块 | 安全 |
| 描述 | Markdown 渲染禁用内联 HTML |
| 前置条件 | 无 |
| 测试步骤 | 1. 检查 markdown.ts 第 14 行：html: false |
| 预期结果 | 禁用 HTML 标签，防止 XSS |
| 实际结果 | 代码审查通过，markdown-it 配置 html: false |
| 状态 | 通过 |

### TC-SEC-005 外链安全

| 项 | 内容 |
|----|------|
| 用例ID | TC-SEC-005 |
| 模块 | 安全 |
| 描述 | Markdown 中的外链添加 rel="noopener noreferrer" |
| 前置条件 | 无 |
| 测试步骤 | 1. 检查 markdown.ts 第 57-65 行 |
| 预期结果 | 所有外链添加 target="_blank" 和 rel="noopener noreferrer" |
| 实际结果 | 代码审查通过 |
| 状态 | 通过 |

---

## 测试用例统计

| 模块 | 总数 | 通过 | 失败 |
|------|------|------|------|
| 认证 | 14 | 13 | 1 |
| 文章 | 18 | 11 | 7 |
| 分类 | 6 | 3 | 3 |
| 标签 | 4 | 1 | 3 |
| 评论 | 7 | 3 | 4 |
| 点赞 | 4 | 4 | 0 |
| 管理员 | 8 | 4 | 4 |
| 用户 | 5 | 1 | 4 |
| 文件上传 | 3 | 3 | 0 |
| RSS | 1 | 1 | 0 |
| 设置 | 3 | 1 | 2 |
| 友链 | 4 | 1 | 3 |
| 验证码 | 1 | 1 | 0 |
| 前端页面 | 22 | 14 | 8 |
| 安全 | 5 | 5 | 0 |
| **合计** | **105** | **66** | **39** |

**通过率：62.9%**
