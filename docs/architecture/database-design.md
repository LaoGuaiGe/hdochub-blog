# 数据库设计文档

| 项目 | 内容 |
|------|------|
| 项目名称 | hdochub 个人技术博客 |
| 文档版本 | V1.0 |
| 编写日期 | 2026-07-28 |
| 编写人 | 架构师 |
| 数据库 | MySQL 8.0（InnoDB 引擎，utf8mb4 字符集） |
| 关联文档 | PRD.md、tech-stack.md、api-design.md |

---

## 1. 文档概述

本文档定义博客系统的全部数据库表结构、字段定义、表间关系与索引策略，作为 Prisma schema 与建表 SQL 的设计源头。开发人员依据本文档在 `server/prisma/schema.prisma` 中建模，并使用 `prisma migrate` 生成迁移。

### 1.1 设计约定

| 约定 | 规范 |
|------|------|
| 存储引擎 | 统一 InnoDB（支持事务、行级锁、外键） |
| 字符集 | `utf8mb4`，排序规则 `utf8mb4_unicode_ci`（支持 Emoji 与多语言） |
| 表名 | `snake_case` 复数形式（如 `articles`、`article_tags`） |
| 字段名 | `snake_case`（如 `created_at`、`author_id`） |
| 主键 | 统一 `id BIGINT UNSIGNED AUTO_INCREMENT`，Prisma 映射 `BigInt` |
| 时间字段 | `created_at`、`updated_at`，`DATETIME` 存储 UTC 时间，默认 `CURRENT_TIMESTAMP` |
| 软删除 | 文章/评论用状态字段标记，不做物理删除；用户用 `status` 封禁 |
| 外键 | 物理外键约束（保证引用完整性），删除策略按业务设定 |
| 布尔 | 用 `TINYINT(1)`，0/1 表示 |
| 枚举 | 用 `VARCHAR` + 应用层枚举校验，避免 ENUM 修改困难 |

### 1.2 表清单

| 序号 | 表名 | 说明 | 对应 PRD 功能 |
|------|------|------|--------------|
| 1 | `users` | 用户表 | F-P0-02 注册登录、权限体系 |
| 2 | `categories` | 分类表 | F-P0-06 文章分类 |
| 3 | `tags` | 标签表 | F-P0-07 文章标签 |
| 4 | `articles` | 文章表 | F-P0-01/03/04/05 文章浏览/编辑器/发表/编辑 |
| 5 | `article_tags` | 文章-标签关联表 | F-P0-07 文章标签（多对多） |
| 6 | `comments` | 评论表 | F-P0-09 评论、F-P1-06 评论回复 |
| 7 | `likes` | 点赞表 | F-P1-05 点赞功能 |
| 8 | `friend_links` | 友链表 | F-P2-02 友链页面 |
| 9 | `settings` | 站点设置表 | F-P2-06 站点设置 |
| 10 | `article_revisions` | 文章修订历史表 | 文章版本历史（扩展） |
| 11 | `upload_files` | 上传文件记录表 | F-P1-02 封面图、F-P1-09 头像 |

---

## 2. ER 设计总览

### 2.1 关系图

```
┌──────────┐       ┌──────────────┐       ┌──────────┐
│  users   │       │  categories  │       │   tags   │
│──────────│       │──────────────│       │──────────│
│ id (PK)  │       │ id (PK)      │       │ id (PK)  │
│ username │       │ name         │       │ name     │
│ email    │       │ slug         │       │ slug     │
│ password │       │ ...          │       │ ...      │
│ role     │       └──────┬───────┘       └────┬─────┘
│ status   │              │ 1:N                 │ M:N
└────┬─────┘              │                     │
     │ 1:N                ▼                     │
     │            ┌──────────────┐              │
     │            │   articles   │              │
     │            │──────────────│              │
     │     ┌──────│ id (PK)      │──────┐       │
     │     │      │ author_id(FK)│      │       │
     │     │      │ category_id  │      │       │
     │     │      │ title        │      │       │
     └─────┼──────│ slug         │      │       │
           │      │ status       │      │       │
           │      │ view_count   │      │       │
           │      │ like_count   │      │       │
           │      └──────┬───────┘      │       │
           │             │ 1:N          │       │
           │             ▼              │ 1:N   │
           │      ┌──────────────┐      │       │
           │      │ article_tags │◀─────┘       │
           │      │──────────────│              │
           │      │ article_id   │──────────────┘
           │      │ tag_id       │
           │      └──────────────┘
           │
           │ 1:N  ┌──────────────┐       ┌──────────┐
           └─────▶│   comments   │       │  likes   │
                  │──────────────│       │──────────│
                  │ id (PK)      │       │ id (PK)  │
                  │ article_id   │       │article_id│
                  │ user_id      │       │ user_id  │
                  │ parent_id    │       └──────────┘
                  │ status       │
                  └──────────────┘
```

### 2.2 表关系说明

| 关系 | 类型 | 说明 |
|------|------|------|
| users → articles | 一对多 | 一个用户可发布多篇文章（`articles.author_id`） |
| categories → articles | 一对多 | 一个分类下有多篇文章（`articles.category_id`），文章仅属一个分类 |
| articles ↔ tags | 多对多 | 通过 `article_tags` 关联表实现，一篇文章多个标签，一个标签多篇文章 |
| users → comments | 一对多 | 一个用户可发表多条评论（`comments.user_id`） |
| articles → comments | 一对多 | 一篇文章下有多条评论（`comments.article_id`） |
| comments → comments | 自引用一对多 | 评论的楼中楼回复（`comments.parent_id` 指向父评论） |
| users → likes | 一对多 | 一个用户可点赞多篇文章（`likes.user_id`） |
| articles → likes | 一对多 | 一篇文章被多个用户点赞（`likes.article_id`） |
| articles → article_revisions | 一对多 | 一篇文章多次修订产生多条历史记录 |
| users → upload_files | 一对多 | 用户上传的文件记录（`upload_files.user_id`） |

---

## 3. 表字段定义

### 3.1 users（用户表）

存储所有注册用户信息，含游客无法注册的超级管理员。

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | - | 用户 ID |
| `username` | VARCHAR(20) | NOT NULL, UNIQUE | - | 用户名，3-20 字符，字母数字下划线 |
| `email` | VARCHAR(100) | NOT NULL, UNIQUE | - | 邮箱，登录用 |
| `password` | VARCHAR(100) | NOT NULL | - | bcrypt 哈希后的密码（不存明文） |
| `nickname` | VARCHAR(20) | NULL | NULL | 昵称，显示在评论与作者位；为空时显示 username |
| `avatar` | VARCHAR(255) | NULL | NULL | 头像 URL（外链或本站上传路径） |
| `bio` | VARCHAR(200) | NULL | NULL | 个人简介 |
| `role` | VARCHAR(20) | NOT NULL | 'USER' | 角色：`SUPER_ADMIN`/`ADMIN`/`USER` |
| `status` | VARCHAR(20) | NOT NULL | 'ACTIVE' | 状态：`ACTIVE`/`BANNED`/`LOCKED` |
| `article_count` | INT UNSIGNED | NOT NULL | 0 | 文章数（冗余计数，避免 COUNT 查询） |
| `comment_count` | INT UNSIGNED | NOT NULL | 0 | 评论数（冗余计数） |
| `login_fail_count` | INT UNSIGNED | NOT NULL | 0 | 连续登录失败次数 |
| `locked_until` | DATETIME | NULL | NULL | 账号锁定截止时间（登录失败 5 次锁定 15 分钟） |
| `last_login_at` | DATETIME | NULL | NULL | 最后登录时间 |
| `last_login_ip` | VARCHAR(45) | NULL | NULL | 最后登录 IP（支持 IPv6） |
| `created_at` | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 注册时间 |
| `updated_at` | DATETIME | NOT NULL | CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**索引**：
- `uk_username`：UNIQUE(`username`) —— 登录查询、唯一性校验
- `uk_email`：UNIQUE(`email`) —— 邮箱登录查询、唯一性校验
- `idx_role_status`：INDEX(`role`, `status`) —— 后台按角色/状态筛选用户
- `idx_created_at`：INDEX(`created_at`) —— 新注册用户统计

**说明**：
- `role` 取值 `SUPER_ADMIN`（超级管理员，系统初始化一位，不可降级/封禁）、`ADMIN`（普通管理员，P2）、`USER`（注册用户）。三者继承关系：SUPER_ADMIN ⊃ ADMIN ⊃ USER。
- `status` 取值 `ACTIVE`（正常）、`BANNED`（封禁，无法登录/发言）、`LOCKED`（登录失败锁定，由 `locked_until` 控制时效）。
- 冗余计数字段（`article_count`/`comment_count`）在发表/删除时由 Service 层事务维护，避免列表页 COUNT 全表扫描。

### 3.2 categories（分类表）

分类由管理员维护，文章归属且仅归属一个分类。

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | - | 分类 ID |
| `name` | VARCHAR(20) | NOT NULL, UNIQUE | - | 分类名称，2-4 字为佳 |
| `slug` | VARCHAR(50) | NOT NULL, UNIQUE | - | URL slug，如 `tech-issue`，用于语义化 URL |
| `description` | VARCHAR(200) | NULL | NULL | 分类描述 |
| `sort` | INT | NOT NULL | 0 | 排序权重，越小越靠前 |
| `article_count` | INT UNSIGNED | NOT NULL | 0 | 该分类下文章数（冗余计数） |
| `created_at` | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| `updated_at` | DATETIME | NOT NULL | CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**索引**：
- `uk_name`：UNIQUE(`name`)
- `uk_slug`：UNIQUE(`slug`) —— `/category/[slug]` 路由查询
- `idx_sort`：INDEX(`sort`) —— 按排序展示

### 3.3 tags（标签表）

标签由用户发布文章时自由创建或选用，管理员可合并/删除。

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | - | 标签 ID |
| `name` | VARCHAR(20) | NOT NULL, UNIQUE | - | 标签名称，2-20 字符 |
| `slug` | VARCHAR(50) | NOT NULL, UNIQUE | - | URL slug |
| `article_count` | INT UNSIGNED | NOT NULL | 0 | 关联文章数（冗余计数，用于标签云热度） |
| `created_at` | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| `updated_at` | DATETIME | NOT NULL | CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**索引**：
- `uk_name`：UNIQUE(`name`)
- `uk_slug`：UNIQUE(`slug`) —— `/tag/[slug]` 路由查询

### 3.4 articles（文章表）

博客核心表，存储文章内容与元数据。

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | - | 文章 ID |
| `title` | VARCHAR(100) | NOT NULL | - | 标题，1-100 字符 |
| `slug` | VARCHAR(150) | NOT NULL, UNIQUE | - | URL slug，如 `docker-502-fix`，语义化 URL |
| `content` | LONGTEXT | NOT NULL | - | 正文 Markdown 原文 |
| `content_html` | LONGTEXT | NULL | NULL | 预渲染 HTML（缓存，减少服务端重复渲染） |
| `summary` | VARCHAR(500) | NULL | NULL | 摘要，为空时取正文前 200 字 |
| `cover_image` | VARCHAR(255) | NULL | NULL | 封面图 URL |
| `author_id` | BIGINT UNSIGNED | NOT NULL, FK | - | 作者 user_id |
| `category_id` | BIGINT UNSIGNED | NOT NULL, FK | - | 分类 category_id |
| `status` | VARCHAR(20) | NOT NULL | 'DRAFT' | 状态：`DRAFT`/`PUBLISHED`/`ARCHIVED` |
| `view_count` | INT UNSIGNED | NOT NULL | 0 | 阅读量 |
| `like_count` | INT UNSIGNED | NOT NULL | 0 | 点赞数 |
| `comment_count` | INT UNSIGNED | NOT NULL | 0 | 评论数（仅计已发布评论） |
| `word_count` | INT UNSIGNED | NOT NULL | 0 | 字数（保存时计算） |
| `is_top` | TINYINT(1) | NOT NULL | 0 | 是否置顶（扩展） |
| `published_at` | DATETIME | NULL | NULL | 发布时间（首次发布时设置，编辑不更新） |
| `created_at` | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| `updated_at` | DATETIME | NOT NULL | CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**索引**：
- `uk_slug`：UNIQUE(`slug`) —— `/post/[slug]` 详情页查询
- `idx_status_published`：INDEX(`status`, `published_at`) —— 前台文章列表（已发布按时间倒序），核心查询索引
- `idx_author_status`：INDEX(`author_id`, `status`) —— 用户后台「我的文章」按状态筛选
- `idx_category_status`：INDEX(`category_id`, `status`, `published_at`) —— 分类下文章列表
- `idx_view_count`：INDEX(`view_count`) —— 按阅读量排序、热门文章 Top N
- `idx_published_at`：INDEX(`published_at`) —— 归档页按时间分组
- `FULLTEXT`：`ft_title_content`(`title`, `content`) —— 全文搜索（MySQL 8.0 ngram 分词支持中文）

**说明**：
- `status` 取值 `DRAFT`（草稿，不公开）、`PUBLISHED`（已发布，前台可见）、`ARCHIVED`（已下架，前台不可见，作者后台标注）。
- `content_html` 为预渲染缓存字段，文章保存时由后端用 markdown-it 渲染并存储，读取时直接返回，避免每次请求重新渲染。渲染逻辑与前端保持一致。
- `published_at` 仅在首次由草稿转为已发布时设置；后续编辑已发布文章不更新该时间。
- 删除文章为物理删除（PRD 要求硬删除），删除前二次确认；删除时联动清理 `article_tags`、`comments`、`likes`、`article_revisions`。
- `word_count` 用于详情页展示字数与预计阅读时长（字数/300 字每分钟向上取整）。

### 3.5 article_tags（文章-标签关联表）

文章与标签的多对多关联。

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | - | 关联 ID |
| `article_id` | BIGINT UNSIGNED | NOT NULL, FK | - | 文章 ID |
| `tag_id` | BIGINT UNSIGNED | NOT NULL, FK | - | 标签 ID |
| `created_at` | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 关联时间 |

**约束**：
- `uk_article_tag`：UNIQUE(`article_id`, `tag_id`) —— 防止同一文章重复关联同一标签

**索引**：
- `uk_article_tag`：UNIQUE(`article_id`, `tag_id`) —— 复合唯一索引
- `idx_tag_id`：INDEX(`tag_id`) —— 标签下文章列表反向查询

**外键策略**：
- `article_id` → `articles.id`，`ON DELETE CASCADE`（删文章时自动清理关联）
- `tag_id` → `tags.id`，`ON DELETE CASCADE`（删标签时自动清理关联）

### 3.6 comments（评论表）

支持楼中楼嵌套回复，最多 3 层。

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | - | 评论 ID |
| `article_id` | BIGINT UNSIGNED | NOT NULL, FK | - | 所属文章 ID |
| `user_id` | BIGINT UNSIGNED | NOT NULL, FK | - | 评论者 user_id |
| `parent_id` | BIGINT UNSIGNED | NULL, FK | NULL | 父评论 ID（顶级评论为 NULL） |
| `reply_to_user_id` | BIGINT UNSIGNED | NULL, FK | NULL | 被回复用户 ID（用于"@某人"展示） |
| `content` | VARCHAR(500) | NOT NULL | - | 评论内容（Markdown 原文，1-500 字符） |
| `content_html` | TEXT | NULL | NULL | 预渲染 HTML（过滤危险标签后） |
| `floor` | INT UNSIGNED | NOT NULL | 0 | 楼层号（顶级评论按文章内顺序递增） |
| `depth` | TINYINT UNSIGNED | NOT NULL | 0 | 嵌套深度：0=顶级，1/2/3=回复层级，超过 3 平铺 |
| `status` | VARCHAR(20) | NOT NULL | 'PUBLISHED' | 状态：`PENDING`/`PUBLISHED`/`DELETED` |
| `like_count` | INT UNSIGNED | NOT NULL | 0 | 评论点赞数（扩展，预留） |
| `created_at` | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 评论时间 |
| `updated_at` | DATETIME | NOT NULL | CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**索引**：
- `idx_article_status_created`：INDEX(`article_id`, `status`, `created_at`) —— 文章详情页评论列表（按时间正序，仅已发布）
- `idx_user_id`：INDEX(`user_id`) —— 用户「我的评论」查询
- `idx_parent_id`：INDEX(`parent_id`) —— 楼中楼按父评论查回复
- `idx_status_created`：INDEX(`status`, `created_at`) —— 管理员后台待审核评论列表

**外键策略**：
- `article_id` → `articles.id`，`ON DELETE CASCADE`
- `user_id` → `users.id`，`ON DELETE CASCADE`
- `parent_id` → `comments.id`，`ON DELETE SET NULL`（父评论删除时子评论的 parent_id 置空，子评论保留但显示「该评论已删除」）
- `reply_to_user_id` → `users.id`，`ON DELETE SET NULL`

**说明**：
- `status` 取值 `PENDING`（待审核，开启审核开关时）、`PUBLISHED`（已发布，默认直接可见）、`DELETED`（已删除，不展示，子回复保留显示删除占位）。
- `depth` 由 Service 层在写入时根据父评论 depth+1 计算，超过 3 时固定为 3 并平铺（不继续嵌套）。
- `floor` 仅对顶级评论（depth=0）有意义，按文章内发布顺序递增。

### 3.7 likes（点赞表）

记录用户对文章的点赞关系，保证每用户每篇仅一次。

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | - | 点赞 ID |
| `article_id` | BIGINT UNSIGNED | NOT NULL, FK | - | 文章 ID |
| `user_id` | BIGINT UNSIGNED | NOT NULL, FK | - | 点赞用户 ID |
| `created_at` | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 点赞时间 |

**约束**：
- `uk_article_user`：UNIQUE(`article_id`, `user_id`) —— 核心约束，保证每用户每篇仅赞一次

**索引**：
- `uk_article_user`：UNIQUE(`article_id`, `user_id`) —— 唯一约束 + 查询用户是否已赞
- `idx_user_id`：INDEX(`user_id`) —— 用户「我的点赞」查询

**外键策略**：
- `article_id` → `articles.id`，`ON DELETE CASCADE`
- `user_id` → `users.id`，`ON DELETE CASCADE`

**说明**：
- 点赞时 INSERT，取消点赞时 DELETE，通过唯一约束防止重复。
- `articles.like_count` 在点赞/取消时由 Service 层事务同步增减，保证计数一致性。

### 3.8 friend_links（友链表）

管理员维护的友情链接。

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | - | 友链 ID |
| `name` | VARCHAR(50) | NOT NULL | - | 站点名称 |
| `url` | VARCHAR(255) | NOT NULL | - | 站点 URL |
| `description` | VARCHAR(200) | NULL | NULL | 简介 |
| `logo` | VARCHAR(255) | NULL | NULL | Logo URL（可选） |
| `sort` | INT | NOT NULL | 0 | 排序权重 |
| `status` | VARCHAR(20) | NOT NULL | 'VISIBLE' | 状态：`VISIBLE`/`HIDDEN` |
| `created_at` | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 创建时间 |
| `updated_at` | DATETIME | NOT NULL | CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**索引**：
- `idx_status_sort`：INDEX(`status`, `sort`) —— 前台展示可见友链按排序

### 3.9 settings（站点设置表）

采用 key-value 结构存储站点配置，便于灵活扩展。

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | - | 设置 ID |
| `key` | VARCHAR(50) | NOT NULL, UNIQUE | - | 配置键名 |
| `value` | TEXT | NULL | NULL | 配置值（字符串或 JSON） |
| `description` | VARCHAR(200) | NULL | NULL | 配置说明 |
| `updated_at` | DATETIME | NOT NULL | CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

**索引**：
- `uk_key`：UNIQUE(`key`)

**预置配置项**：

| key | value 示例 | 说明 |
|-----|-----------|------|
| `site_title` | hdochub 个人技术博客 | 站点标题 |
| `site_subtitle` | 记录技术问题与思考 | 副标题 |
| `site_description` | 面向工程师的个人技术博客 | SEO meta description |
| `site_icp` | 京ICP备XXXXXXXX号 | 备案号 |
| `comment_review_enabled` | false | 评论审核开关 |
| `registration_enabled` | true | 注册开关 |
| `page_size` | 10 | 每页文章数 |
| `admin_path` | admin | 管理员后台路径（可自定义，防扫描） |
| `about_content` | # 关于博主... | 关于页面内容（Markdown） |
| `site_url` | https://blog.hdochub.com | 站点 URL |

**说明**：站点配置在应用启动时加载到内存/Redis 缓存，修改后刷新缓存，避免每次请求查库。

### 3.10 article_revisions（文章修订历史表）

记录已发布文章的编辑历史，支持版本回溯（扩展功能）。

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | - | 修订 ID |
| `article_id` | BIGINT UNSIGNED | NOT NULL, FK | - | 文章 ID |
| `title` | VARCHAR(100) | NOT NULL | - | 修订时标题快照 |
| `content` | LONGTEXT | NOT NULL | - | 修订时正文快照 |
| `revision_number` | INT UNSIGNED | NOT NULL | - | 版本号，递增 |
| `editor_id` | BIGINT UNSIGNED | NOT NULL, FK | - | 编辑者 user_id |
| `created_at` | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 修订时间 |

**索引**：
- `idx_article_revision`：INDEX(`article_id`, `revision_number`) —— 按文章查版本历史

**外键策略**：
- `article_id` → `articles.id`，`ON DELETE CASCADE`
- `editor_id` → `users.id`，`ON DELETE SET NULL`

**说明**：每次发布或编辑已发布文章时，先将当前内容快照写入此表，再更新 articles。V1.0 可选实现，V1.1 启用。

### 3.11 upload_files（上传文件记录表）

记录用户上传的图片文件，便于管理与清理。

| 字段名 | 类型 | 约束 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `id` | BIGINT UNSIGNED | PK, AUTO_INCREMENT | - | 文件 ID |
| `user_id` | BIGINT UNSIGNED | NOT NULL, FK | - | 上传者 user_id |
| `original_name` | VARCHAR(255) | NOT NULL | - | 原始文件名 |
| `stored_name` | VARCHAR(255) | NOT NULL | - | 存储文件名（重命名防冲突） |
| `file_path` | VARCHAR(500) | NOT NULL | - | 存储相对路径 |
| `file_url` | VARCHAR(500) | NOT NULL | - | 访问 URL |
| `file_size` | INT UNSIGNED | NOT NULL | - | 文件大小（字节） |
| `mime_type` | VARCHAR(50) | NOT NULL | - | MIME 类型 |
| `width` | INT UNSIGNED | NULL | NULL | 图片宽度（px） |
| `height` | INT UNSIGNED | NULL | NULL | 图片高度（px） |
| `purpose` | VARCHAR(20) | NULL | NULL | 用途：`AVATAR`/`COVER`/`ARTICLE` |
| `created_at` | DATETIME | NOT NULL | CURRENT_TIMESTAMP | 上传时间 |

**索引**：
- `idx_user_id`：INDEX(`user_id`) —— 用户上传文件列表
- `idx_purpose`：INDEX(`purpose`) —— 按用途筛选

**外键策略**：
- `user_id` → `users.id`，`ON DELETE CASCADE`

---

## 4. 索引策略汇总

### 4.1 索引设计原则

1. **查询驱动建索引**：针对高频查询条件与排序字段建索引，避免全表扫描。
2. **覆盖索引优先**：列表查询尽量通过复合索引覆盖，避免回表。
3. **避免过度索引**：每个索引增加写入开销，仅对查询频率高的字段建索引。
4. **前缀匹配**：复合索引遵循最左前缀原则，字段顺序按等值→范围→排序排列。

### 4.2 核心查询与索引匹配

| 查询场景 | SQL 条件 | 使用的索引 | 说明 |
|----------|----------|------------|------|
| 首页文章列表 | `WHERE status='PUBLISHED' ORDER BY published_at DESC` | `idx_status_published` | 核心查询，覆盖状态过滤与时间排序 |
| 分类下文章 | `WHERE category_id=? AND status='PUBLISHED' ORDER BY published_at DESC` | `idx_category_status` | 三字段复合索引覆盖 |
| 标签下文章 | `WHERE tag_id=? JOIN articles WHERE status='PUBLISHED'` | `idx_tag_id` + `idx_status_published` | 通过关联表反查 |
| 文章详情 | `WHERE slug=?` | `uk_slug` | 唯一索引，详情页核心查询 |
| 我的文章 | `WHERE author_id=? AND status=?` | `idx_author_status` | 用户后台筛选 |
| 按阅读量排序 | `WHERE status='PUBLISHED' ORDER BY view_count DESC` | `idx_view_count` | 热门文章 |
| 文章评论 | `WHERE article_id=? AND status='PUBLISHED' ORDER BY created_at` | `idx_article_status_created` | 详情页评论列表 |
| 待审核评论 | `WHERE status='PENDING' ORDER BY created_at` | `idx_status_created` | 管理员审核 |
| 搜索文章 | `WHERE MATCH(title,content) AGAINST(?)` | `ft_title_content` | 全文搜索 |
| 归档 | `WHERE status='PUBLISHED' ORDER BY published_at` | `idx_published_at` | 时间线归档 |
| 点赞去重 | `WHERE article_id=? AND user_id=?` | `uk_article_user` | 唯一约束防重复 |
| 用户登录 | `WHERE username=? OR email=?` | `uk_username`/`uk_email` | 登录查询 |

### 4.3 全文搜索方案

文章搜索采用 MySQL 8.0 FULLTEXT 索引 + ngram 分词器（支持中文分词）：

```sql
-- 创建全文索引（ngram 分词，token_size=2 适合中文）
ALTER TABLE articles
  ADD FULLTEXT INDEX ft_title_content (title, content)
  WITH PARSER ngram;
```

查询：

```sql
SELECT * FROM articles
WHERE status = 'PUBLISHED'
  AND MATCH(title, content) AGAINST(:keyword IN BOOLEAN MODE)
ORDER BY published_at DESC;
```

**说明**：
- V1.0 文章量 ≤ 1000 篇，FULLTEXT 性能足够（搜索响应 ≤ 1s）。
- V1.0+ 若搜索体验不佳（如分词不准、无高亮），可引入 MeiliSearch 作为独立搜索引擎，数据库仅作主存储。

### 4.4 冗余计数维护策略

为避免列表页频繁 COUNT 聚合查询，以下字段采用冗余计数，由 Service 层在事务中维护：

| 冗余字段 | 所在表 | 维护时机 |
|----------|--------|----------|
| `users.article_count` | users | 发表文章 +1，删除文章 -1 |
| `users.comment_count` | users | 发表评论 +1，删除评论 -1 |
| `categories.article_count` | categories | 文章发布 +1，下架/删除 -1 |
| `tags.article_count` | tags | 文章关联标签 +1，取消关联/删除 -1 |
| `articles.view_count` | articles | 阅读去重后 +1（Redis 辅助） |
| `articles.like_count` | articles | 点赞 +1，取消 -1 |
| `articles.comment_count` | articles | 评论发布 +1，删除 -1 |

**一致性保障**：所有计数更新与业务操作在同一个数据库事务中执行，保证原子性。

---

## 5. 阅读量去重方案

阅读量去重不落库（避免写入高频），采用 Redis 实现：

```
# 文章被访问时
key = "view:{article_id}:{client_ip}"
IF NOT EXISTS(key):
    SET key 1 EX 1800          # 30 分钟 TTL
    INCREMENT articles.view_count WHERE id = article_id
# 已存在则忽略，不计数
```

**优势**：
- 无需额外的浏览记录表，减少写入压力。
- 30 分钟窗口内同一 IP 重复访问仅计一次，满足 PRD 去重要求。
- Redis 内存占用可控（key 30 分钟自动过期）。

---

## 6. 数据初始化（种子数据）

系统首次部署时通过 `prisma seed` 初始化以下数据：

| 数据 | 内容 |
|------|------|
| 超级管理员账号 | username: `admin`，email: `admin@hdochub.com`，密码：部署时由运维设置（bcrypt 哈希），role: `SUPER_ADMIN` |
| 默认分类 | 技术问题（`tech-issue`）、教程（`tutorial`）、观点（`opinion`）、随笔（`essay`），按 PRD 7.1 建议 |
| 站点设置 | 9.3 节预置配置项默认值 |

种子脚本位于 `server/prisma/seed.ts`，运维执行 `pnpm prisma db seed` 初始化。

---

## 7. 数据备份策略

| 备份对象 | 方式 | 频率 | 保留 | 位置 |
|----------|------|------|------|------|
| MySQL 数据库 | 宝塔计划任务 + `mysqldump` | 每日 03:00 | 7 天 | `/www/backup/database/` |
| 上传图片目录 | 宝塔计划任务打包 | 每日 03:30 | 7 天 | `/www/backup/site/` |
| 数据库 binlog | MySQL 开启 binlog | 实时 | 3 天 | 用于增量恢复 |

详细备份配置见部署架构文档 `deployment.md`。

---

## 8. Prisma Schema 示例（核心表）

以下为 `articles` 与 `article_tags` 的 Prisma 模型示例，完整 schema 由开发依据本文档编写：

```prisma
// 文章模型
model Article {
  id            BigInt    @id @default(autoincrement())
  title         String    @db.VarChar(100)
  slug          String    @unique @db.VarChar(150)
  content       String    @db.LongText
  contentHtml   String?   @db.LongText @map("content_html")
  summary       String?   @db.VarChar(500)
  coverImage    String?   @db.VarChar(255) @map("cover_image")
  authorId      BigInt    @map("author_id")
  categoryId    BigInt    @map("category_id")
  status        String    @default("DRAFT") @db.VarChar(20)
  viewCount     Int       @default(0) @map("view_count")
  likeCount     Int       @default(0) @map("like_count")
  commentCount  Int       @default(0) @map("comment_count")
  wordCount     Int       @default(0) @map("word_count")
  isTop         Int       @default(0) @map("is_top") @db.TinyInt
  publishedAt   DateTime? @map("published_at")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  author        User      @relation(fields: [authorId], references: [id], onDelete: Cascade)
  category      Category  @relation(fields: [categoryId], references: [id])
  tags          ArticleTag[]
  comments      Comment[]
  likes         Like[]
  revisions     ArticleRevision[]

  @@index([status, publishedAt], map: "idx_status_published")
  @@index([authorId, status], map: "idx_author_status")
  @@index([categoryId, status, publishedAt], map: "idx_category_status")
  @@index([viewCount], map: "idx_view_count")
  @@index([publishedAt], map: "idx_published_at")
  @@map("articles")
}
```

> 完整 Prisma schema 由开发人员依据本文件全部表定义编写，字段类型映射遵循 `@db.*` 注解保持与 MySQL 类型一致。

---

> 本文档为数据库设计基线。表结构变更须先更新本文档，再生成 Prisma 迁移，禁止直接操作生产库表结构。
