# 部署架构文档

| 项目 | 内容 |
|------|------|
| 项目名称 | hdochub 个人技术博客 |
| 文档版本 | V1.0 |
| 编写日期 | 2026-07-28 |
| 编写人 | 架构师 |
| 交付对象 | 运维 |
| 域名 | blog.hdochub.com |
| 关联文档 | PRD.md、tech-stack.md、database-design.md、api-design.md |

---

## 1. 部署架构总览

### 1.1 架构图

```
                    Internet 用户
                         │
                         ▼ HTTPS (443)
              ┌─────────────────────┐
              │   DNS 解析           │
              │ blog.hdochub.com →  │
              │   服务器公网 IP       │
              └──────────┬──────────┘
                         ▼
         ┌───────────────────────────────┐
         │     Ubuntu 服务器 + 宝塔面板    │
         │  ┌─────────────────────────┐  │
         │  │      Nginx (80/443)     │  │
         │  │  SSL 终止 / 反向代理     │  │
         │  │  Gzip / 静态缓存        │  │
         │  └──────┬──────────┬───────┘  │
         │         │          │          │
         │   ┌─────▼────┐ ┌───▼───────┐  │
         │   │  Nuxt 3  │ │  NestJS   │  │
         │   │  SSR     │ │  API      │  │
         │   │  :3000   │ │  :4000    │  │
         │   │ (PM2)    │ │  (PM2)    │  │
         │   └─────┬────┘ └─────┬─────┘  │
         │         │            │        │
         │   ┌─────▼────────────▼─────┐  │
         │   │  MySQL 8.0  Redis 6+   │  │
         │   │  (:3306)    (:6379)    │  │
         │   └────────────────────────┘  │
         │                               │
         │   /www/wwwroot/blog.hdochub   │
         │   .com/uploads (上传图片)      │
         └───────────────────────────────┘
```

### 1.2 组件清单

| 组件 | 版本 | 端口 | 管理方式 | 说明 |
|------|------|------|----------|------|
| Ubuntu Server | 20.04/22.04 LTS | - | 系统 | 甲方已安装 |
| 宝塔面板 | 7.x+ | 8888 | Web | 管理一切 |
| Nginx | 1.22+ | 80, 443 | 宝塔 | 反向代理 + SSL |
| Node.js | 20 LTS | - | 宝塔 Node 管理器 | 运行 Nuxt/NestJS |
| PM2 | 5.x | - | 宝塔 PM2 插件 | 进程守护 |
| MySQL | 8.0 | 3306 | 宝塔 | 业务数据库 |
| Redis | 6.0+ | 6379 | 宝塔 | 缓存/限流 |
| Nuxt 3 SSR | - | 3000 | PM2 | 前端服务 |
| NestJS API | - | 4000 | PM2 | 后端服务 |

### 1.3 端口规划

| 端口 | 服务 | 暴露范围 | 说明 |
|------|------|----------|------|
| 80 | Nginx | 公网 | HTTP，301 跳转 HTTPS |
| 443 | Nginx | 公网 | HTTPS，对外服务 |
| 8888 | 宝塔面板 | 公网（建议改默认+IP白名单） | 面板管理 |
| 3000 | Nuxt SSR | 仅本机 | Nginx 反代，不直接暴露 |
| 4000 | NestJS API | 仅本机 | Nginx 反代，不直接暴露 |
| 3306 | MySQL | 仅本机 | 禁止公网访问 |
| 6379 | Redis | 仅本机 | 禁止公网访问，设密码 |

> 3000/4000/3306/6379 端口通过宝塔防火墙仅放行本机，不对外暴露，所有外部流量经 Nginx 443 进入。

---

## 2. 服务器环境要求

### 2.1 硬件要求

| 资源 | 最低配置 | 推荐配置 | 说明 |
|------|----------|----------|------|
| CPU | 2 核 | 4 核 | Nuxt SSR + NestJS + MySQL + Redis |
| 内存 | 2 GB | 4 GB | MySQL 约 512MB，Redis 约 50MB，Node 双进程约 600MB |
| 磁盘 | 20 GB | 40 GB SSD | 系统 + 数据库 + 上传图片 + 日志 + 备份 |
| 带宽 | 3 Mbps | 5 Mbps+ | 文章为主，含图片 |

### 2.2 系统要求

| 项 | 要求 |
|----|------|
| 操作系统 | Ubuntu 20.04 / 22.04 LTS |
| 宝塔面板 | 7.x+（已安装） |
| 系统用户 | root 或 sudo 用户 |
| 防火墙 | UFW / 宝塔防火墙，仅放行 80/443/8888/SSH |

### 2.3 宝塔面板需安装的软件

通过宝塔「软件商店」安装以下组件：

| 软件 | 用途 | 安装方式 |
|------|------|----------|
| Nginx | 反向代理 | 软件商店（宝塔默认推荐） |
| MySQL 8.0 | 数据库 | 软件商店 |
| Redis 6.x | 缓存 | 软件商店 |
| PM2 管理器 | Node 进程管理 | 软件商店（含 Node.js） |
| Node.js 版本管理器 | Node 20 LTS | PM2 管理器内或单独安装 |

---

## 3. 域名解析方案

### 3.1 DNS 配置

在域名 `hdochub.com` 的 DNS 管理后台（如阿里云/Cloudflare）添加解析记录：

| 记录类型 | 主机记录 | 记录值 | TTL | 说明 |
|----------|----------|--------|-----|------|
| A | blog | 服务器公网 IP | 600 | 博客主域名解析 |

解析生效后，`blog.hdochub.com` 指向服务器 IP。

### 3.2 验证解析

```bash
dig blog.hdochub.com +short
# 或
ping blog.hdochub.com
```

返回服务器公网 IP 即解析成功。

### 3.3 CDN（可选）

如需加速静态资源与防 DDoS，可在 Cloudflare 接入域名开启 CDN，但需注意：
- SSL 模式设为「Full (Strict)」（源站有证书）。
- Nuxt SSR 动态页面缓存规则需谨慎，避免登录态串号。

V1.0 可不接 CDN，直接源站服务。

---

## 4. SSL 证书方案

### 4.1 证书申请（Let's Encrypt）

通过宝塔面板一键申请 Let's Encrypt 免费证书：

1. 宝塔面板 → 网站 → 添加站点 `blog.hdochub.com`
2. 站点设置 → SSL → Let's Encrypt
3. 勾选域名 `blog.hdochub.com` → 申请
4. 申请成功后开启「强制 HTTPS」（自动配置 HTTP 301 跳转）

### 4.2 自动续签

- 宝塔面板默认开启 Let's Encrypt 自动续签（证书有效期 90 天，到期前 30 天自动续签）。
- 续签由宝塔计划任务 `Let's Encrypt 证书续签` 自动执行，无需人工干预。

### 4.3 证书配置要点

- 启用 HSTS：Nginx 添加 `Strict-Transport-Security` 响应头，强制浏览器后续访问走 HTTPS。
- SSL 协议仅保留 TLS 1.2/1.3，禁用 TLS 1.0/1.1。
- 启用 OCSP Stapling 加速证书验证。

---

## 5. Nginx 反向代理配置方案

### 5.1 站点目录结构

```
/www/wwwroot/blog.hdochub.com/
├── web/                    # Nuxt 3 前端工程（构建产物 + 源码）
├── server/                 # NestJS 后端工程
├── uploads/                # 上传图片目录
│   ├── avatar/
│   ├── cover/
│   └── article/
└── logs/                   # 站点日志（宝塔管理）
```

### 5.2 Nginx 配置

宝塔面板 → 网站 → `blog.hdochub.com` → 设置 → 配置文件，按以下方案配置（宝塔生成的基础配置上修改）：

```nginx
# /www/server/panel/vhost/nginx/blog.hdochub.com.conf

server {
    listen 80;
    server_name blog.hdochub.com;
    # HTTP 强制跳转 HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name blog.hdochub.com;

    # ===== SSL 证书 =====
    ssl_certificate     /www/server/panel/vhost/cert/blog.hdochub.com/fullchain.pem;
    ssl_certificate_key /www/server/panel/vhost/cert/blog.hdochub.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # ===== 安全响应头 =====
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # ===== Gzip 压缩 =====
    gzip on;
    gzip_min_length 1k;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;
    gzip_vary on;

    # ===== 上传文件大小限制 =====
    client_max_body_size 6m;

    # ===== 上传图片静态资源（直接由 Nginx 处理，不走 Node） =====
    location /uploads/ {
        alias /www/wwwroot/blog.hdochub.com/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        # 禁止上传目录执行脚本
        location ~* \.(php|jsp|py|sh|pl)$ {
            deny all;
        }
    }

    # ===== Nuxt 静态资源缓存 =====
    location /_nuxt/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # ===== 后端 API 反向代理 =====
    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }

    # ===== RSS / Sitemap（Nuxt 服务端路由） =====
    location ~ ^/(rss\.xml|sitemap\.xml|rss/.+\.xml)$ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # ===== robots.txt 静态文件 =====
    location = /robots.txt {
        root /www/wwwroot/blog.hdochub.com/web/public;
    }

    # ===== 前端 SSR 反向代理（默认路由） =====
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 60s;
    }

    # ===== 日志 =====
    access_log /www/wwwlogs/blog.hdochub.com.log;
    error_log  /www/wwwlogs/blog.hdochub.com.error.log;
}
```

### 5.3 配置要点说明

| 配置项 | 说明 |
|--------|------|
| HTTP 301 跳转 | 全站强制 HTTPS |
| `/uploads/` 直接 Nginx 处理 | 图片不走 Node，减轻应用压力；禁止脚本执行 |
| `/_nuxt/` 长缓存 | Nuxt 构建产物带 hash，可长期缓存 |
| `/api/` 反代后端 | 所有 API 请求转发到 NestJS:4000 |
| `/` 反代前端 | 其余请求转发到 Nuxt SSR:3000 |
| Gzip | 压缩文本类资源，减少带宽 |
| `client_max_body_size 6m` | 略大于上传限制 5MB，留余量 |
| 安全响应头 | HSTS、X-Frame-Options 等防攻击 |
| `X-Real-IP` / `X-Forwarded-For` | 透传真实客户端 IP，后端用于限流与阅读量去重 |

### 5.4 robots.txt 配置

`/www/wwwroot/blog.hdochub.com/web/public/robots.txt`：

```
User-agent: *
Allow: /
Disallow: /dashboard/
Disallow: /admin/
Disallow: /api/

Sitemap: https://blog.hdochub.com/sitemap.xml
```

---

## 6. 数据库部署方案

### 6.1 MySQL 安装与配置

1. 宝塔软件商店安装 MySQL 8.0。
2. 修改 root 密码为强密码（宝塔 → 数据库 → root 密码修改）。

### 6.2 创建数据库与用户

宝塔面板 → 数据库 → 添加数据库：

| 项 | 值 |
|----|-----|
| 数据库名 | `blog_db` |
| 用户名 | `blog_user` |
| 密码 | 强随机密码（如 `B1og#Str0ng@Pwd2026`） |
| 访问权限 | 仅本机（127.0.0.1） |
| 字符集 | utf8mb4 |

> 数据库用户仅授权本机访问，禁止远程连接，保障安全。

### 6.3 MySQL 安全配置

| 配置项 | 值 | 说明 |
|--------|-----|------|
| `bind-address` | 127.0.0.1 | 仅监听本机 |
| `max_connections` | 100 | 个人博客足够 |
| `innodb_buffer_pool_size` | 512M | 内存分配给 InnoDB |
| `character_set_server` | utf8mb4 | 字符集 |
| `collation_server` | utf8mb4_unicode_ci | 排序规则 |
| `sql_mode` | STRICT_TRANS_TABLES | 严格模式，拒绝非法数据 |
| binlog | 开启 | 增量备份恢复 |

### 6.4 数据库初始化

```bash
# 进入后端工程目录
cd /www/wwwroot/blog.hdochub.com/server

# 配置环境变量（编辑 .env.production，填入数据库连接串）
# DATABASE_URL="mysql://blog_user:密码@127.0.0.1:3306/blog_db"

# 生成并执行迁移
pnpm prisma migrate deploy

# 执行种子数据初始化（创建超管账号、默认分类、站点设置）
pnpm prisma db seed
```

> 首次初始化时，运维通过种子脚本设置超级管理员初始密码，初始化后建议立即登录修改密码。

### 6.5 数据库备份方案

通过宝塔计划任务自动备份：

| 任务 | 命令/方式 | 频率 | 保留 | 存储位置 |
|------|-----------|------|------|----------|
| MySQL 全量备份 | 宝塔计划任务 → MySQL 备份 | 每日 03:00 | 7 份 | `/www/backup/database/` |
| 上传图片备份 | 宝塔计划任务 → 打包 `/uploads/` | 每日 03:30 | 7 份 | `/www/backup/site/` |
| binlog 增量 | MySQL 自动 | 实时 | 3 天 | `/www/server/data/mysql-binlog/` |

**手动备份命令**（应急）：

```bash
mysqldump -u blog_user -p blog_db --single-transaction --routines --triggers > /www/backup/database/blog_db_$(date +%Y%m%d).sql
```

**恢复命令**：

```bash
mysql -u blog_user -p blog_db < /www/backup/database/blog_db_20260728.sql
```

---

## 7. Redis 部署方案

### 7.1 安装与配置

1. 宝塔软件商店安装 Redis 6.x。
2. 宝塔 → Redis → 修改配置：
   - `bind 127.0.0.1`（仅本机）
   - `requirepass` 设置密码（如 `R3dis#Pwd2026`）
   - `maxmemory 256mb`（限制内存）
   - `maxmemory-policy allkeys-lru`（内存满时 LRU 淘汰）

### 7.2 后端连接配置

`server/.env.production`：

```bash
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=R3dis#Pwd2026
REDIS_DB=0
```

### 7.3 Redis 用途与 Key 规划

| 用途 | Key 格式 | TTL | 说明 |
|------|----------|-----|------|
| 阅读量去重 | `view:{articleId}:{ip}` | 1800s | 30 分钟去重 |
| 接口限流 | `rate:{api}:{ip}` | 60s/3600s | 按接口与窗口 |
| 文章缓存 | `article:{slug}` | 300s | 文章详情缓存 |
| 文章列表缓存 | `articles:list:{hash}` | 300s | 列表查询缓存 |
| 站点设置缓存 | `settings:site` | 永久 | 修改时刷新 |
| JWT 黑名单 | `jwt:blacklist:{tokenJti}` | Token 剩余有效期 | 登出/改密码 |

---

## 8. Node.js 环境与进程管理方案

### 8.1 Node.js 安装

通过宝塔 PM2 管理器或 Node.js 版本管理器安装 Node.js 20 LTS：

1. 宝塔软件商店 → 安装「PM2 管理器」。
2. PM2 管理器 → Node 版本 → 安装 Node.js 20.x。
3. 验证：`node -v` 输出 `v20.x.x`。

### 8.2 pnpm 安装

```bash
npm install -g pnpm
```

### 8.3 PM2 进程管理

使用 PM2 托管 Nuxt 与 NestJS 两个 Node 进程。

#### 8.3.1 PM2 配置文件

在项目根目录创建 `ecosystem.config.js`：

```javascript
// /www/wwwroot/blog.hdochub.com/ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'blog-web',          // 前端 Nuxt SSR
      cwd: '/www/wwwroot/blog.hdochub.com/web',
      script: 'node_modules/nuxt/bin/nuxt.mjs',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        NUXT_PORT: 3000,
        NUXT_HOST: '127.0.0.1',
      },
      max_memory_restart: '500M',
      error_file: '/www/wwwlogs/pm2/blog-web-error.log',
      out_file: '/www/wwwlogs/pm2/blog-web-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      autorestart: true,
      max_restarts: 10,
    },
    {
      name: 'blog-server',       // 后端 NestJS API
      cwd: '/www/wwwroot/blog.hdochub.com/server',
      script: 'dist/main.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
        HOST: '127.0.0.1',
      },
      max_memory_restart: '500M',
      error_file: '/www/wwwlogs/pm2/blog-server-error.log',
      out_file: '/www/wwwlogs/pm2/blog-server-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      autorestart: true,
      max_restarts: 10,
    },
  ],
};
```

#### 8.3.2 启动与管理命令

```bash
# 启动所有进程
pm2 start ecosystem.config.js

# 查看进程状态
pm2 status

# 查看日志
pm2 logs blog-web
pm2 logs blog-server

# 重启单个进程
pm2 restart blog-server

# 停止
pm2 stop blog-web blog-server

# 删除
pm2 delete blog-web blog-server
```

#### 8.3.3 PM2 开机自启

```bash
pm2 save          # 保存当前进程列表
pm2 startup       # 生成开机自启脚本（按提示执行返回的命令）
```

宝塔 PM2 管理器也可在界面中设置开机自启。

### 8.3.4 进程监控要点

| 配置 | 值 | 说明 |
|------|-----|------|
| `max_memory_restart` | 500M | 内存超限自动重启，防止内存泄漏拖垮服务器 |
| `autorestart` | true | 进程崩溃自动重启 |
| `max_restarts` | 10 | 最大重启次数，避免无限重启 |
| 日志切割 | 宝塔 logrotate | 按天切割，保留 30 天 |

---

## 9. 应用部署流程

### 9.1 部署目录规划

```
/www/wwwroot/blog.hdochub.com/
├── ecosystem.config.js      # PM2 配置
├── web/                     # 前端工程
│   ├── .output/             # Nuxt 构建产物（运行目录）
│   ├── public/
│   └── .env.production
├── server/                  # 后端工程
│   ├── dist/                # NestJS 编译产物
│   ├── prisma/
│   ├── uploads -> /www/wwwroot/blog.hdochub.com/uploads  # 软链
│   └── .env.production
└── uploads/                 # 上传文件（Nginx 直接服务）
```

### 9.2 后端部署步骤

```bash
# 1. 进入后端目录
cd /www/wwwroot/blog.hdochub.com/server

# 2. 安装依赖
pnpm install --prod

# 3. 配置生产环境变量
cp .env.example .env.production
vi .env.production   # 填入数据库、Redis、JWT 等配置

# 4. 生成 Prisma 客户端
pnpm prisma generate

# 5. 执行数据库迁移
pnpm prisma migrate deploy

# 6. 初始化种子数据（仅首次）
pnpm prisma db seed

# 7. 编译 TypeScript
pnpm build

# 8. 创建上传目录软链
ln -s /www/wwwroot/blog.hdochub.com/uploads uploads

# 9. 通过 PM2 启动
pm2 start ecosystem.config.js --only blog-server

# 10. 验证
curl http://127.0.0.1:4000/api/settings
```

### 9.3 前端部署步骤

```bash
# 1. 进入前端目录
cd /www/wwwroot/blog.hdochub.com/web

# 2. 安装依赖
pnpm install

# 3. 配置生产环境变量
cp .env.example .env.production
vi .env.production   # 填入 API 地址、站点 URL

# 4. 构建生产产物（SSR）
pnpm build

# 5. 通过 PM2 启动
pm2 start ecosystem.config.js --only blog-web

# 6. 验证
curl http://127.0.0.1:3000
```

### 9.4 更新部署流程（迭代发布）

```bash
# ===== 后端更新 =====
cd /www/wwwroot/blog.hdochub.com/server
git pull                         # 拉取最新代码
pnpm install --prod              # 更新依赖
pnpm prisma generate             # 更新 Prisma 客户端
pnpm prisma migrate deploy       # 执行新迁移（如有）
pnpm build                       # 重新编译
pm2 restart blog-server          # 重启服务

# ===== 前端更新 =====
cd /www/wwwroot/blog.hdochub.com/web
git pull
pnpm install
pnpm build
pm2 restart blog-web
```

> 建议运维编写一键部署脚本 `deploy.sh` 串联上述步骤，减少人工操作失误。

---

## 10. 日志方案

### 10.1 日志分类

| 日志类型 | 位置 | 说明 |
|----------|------|------|
| Nginx 访问日志 | `/www/wwwlogs/blog.hdochub.com.log` | 宝塔管理 |
| Nginx 错误日志 | `/www/wwwlogs/blog.hdochub.com.error.log` | 宝塔管理 |
| Nuxt 应用日志 | `/www/wwwlogs/pm2/blog-web-*.log` | PM2 管理 |
| NestJS 应用日志 | `/www/wwwlogs/pm2/blog-server-*.log` | PM2 管理 |
| MySQL 日志 | `/www/server/data/*.err` | 宝塔管理 |
| Redis 日志 | `/www/server/redis/redis.log` | 宝塔管理 |

### 10.2 日志切割

通过宝塔日志切割工具（logrotate）：

- Nginx 日志：宝塔默认按天切割，保留 30 天。
- PM2 日志：配置 `logrotate` 按天切割，保留 30 天。
- 应用内日志：NestJS 使用 winston/pino，按天轮转，保留 30 天。

### 10.3 日志规范（后端）

NestJS 日志分级：

| 级别 | 用途 |
|------|------|
| ERROR | 异常、错误（含堆栈） |
| WARN | 警告（如限流触发、参数异常） |
| INFO | 关键业务操作（登录、发布文章、删除） |
| DEBUG | 调试信息（生产环境关闭） |

生产环境记录 INFO 及以上级别。敏感信息（密码、Token）禁止记录到日志。

---

## 11. 监控与告警方案

### 11.1 宝塔内置监控

宝塔面板自带资源监控，开启以下监控：

| 监控项 | 阈值 | 告警方式 |
|--------|------|----------|
| CPU 使用率 | > 80% 持续 5 分钟 | 宝塔告警（邮件/微信） |
| 内存使用率 | > 85% | 宝塔告警 |
| 磁盘使用率 | > 90% | 宝塔告警 |
| 网站可用性 | HTTP 非 200 | 宝塔监控告警 |

### 11.2 PM2 监控

```bash
pm2 monit        # 实时监控 CPU/内存/进程状态
pm2 status       # 进程状态概览
```

PM2 进程异常退出时自动重启并记录日志。

### 11.3 应用健康检查

后端提供健康检查接口（不鉴权）：

`GET /api/health`

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "status": "healthy",
    "uptime": 86400,
    "database": "connected",
    "redis": "connected"
  }
}
```

宝塔可配置定时任务每分钟请求该接口，异常时告警。

---

## 12. 安全加固清单

| 序号 | 加固项 | 操作 | 优先级 |
|------|--------|------|--------|
| 1 | SSH 端口修改 | 改默认 22 为随机端口，禁 root 密码登录，用密钥 | 高 |
| 2 | 宝塔面板安全 | 修改默认 8888 端口，绑定登录 IP，开启安全入口 | 高 |
| 3 | 防火墙 | 仅放行 80/443/SSH/宝塔端口，关闭其余 | 高 |
| 4 | MySQL 仅本机 | bind 127.0.0.1，禁止远程 root | 高 |
| 5 | Redis 设密码 | requirepass，bind 127.0.0.1 | 高 |
| 6 | 数据库密码强度 | 强随机密码，不入版本库 | 高 |
| 7 | JWT 密钥 | 生产环境使用强随机密钥，不入版本库 | 高 |
| 8 | 上传目录禁执行 | Nginx 配置 deny php/jsp 等 | 高 |
| 9 | 全站 HTTPS | 强制跳转，HSTS | 高 |
| 10 | Fail2ban | 防暴力破解 SSH（可选安装） | 中 |
| 11 | 系统自动更新 | 开启安全补丁自动更新 | 中 |
| 12 | 文件权限 | web/server 目录 755，.env 文件 600 | 中 |

---

## 13. 部署 Checklist（运维执行）

部署上线前逐项确认：

### 13.1 环境准备

- [ ] Ubuntu 服务器可访问，宝塔面板可登录
- [ ] 宝塔安装 Nginx、MySQL 8.0、Redis 6+、PM2 管理器、Node.js 20
- [ ] 防火墙仅放行 80/443/SSH/宝塔端口

### 13.2 域名与 SSL

- [ ] DNS 解析 `blog.hdochub.com` 指向服务器 IP
- [ ] 宝塔添加站点 `blog.hdochub.com`
- [ ] 申请 Let's Encrypt SSL 证书成功
- [ ] 开启强制 HTTPS

### 13.3 数据库

- [ ] 创建数据库 `blog_db` 与用户 `blog_user`（仅本机）
- [ ] 后端 `.env.production` 填入数据库连接串
- [ ] 执行 `prisma migrate deploy` 建表成功
- [ ] 执行 `prisma db seed` 初始化超管与分类
- [ ] 配置每日自动备份计划任务

### 13.4 Redis

- [ ] Redis 设密码，仅本机访问
- [ ] 后端 `.env.production` 填入 Redis 配置

### 13.5 应用部署

- [ ] 后端依赖安装、编译成功
- [ ] 后端 PM2 启动，`curl 127.0.0.1:4000/api/health` 返回 healthy
- [ ] 前端依赖安装、构建成功
- [ ] 前端 PM2 启动，`curl 127.0.0.1:3000` 返回 HTML
- [ ] PM2 开机自启已配置（`pm2 save` + `pm2 startup`）

### 13.6 Nginx

- [ ] Nginx 反向代理配置完成（/api → 4000，/ → 3000）
- [ ] `/uploads/` 静态资源 + 禁止脚本执行
- [ ] Gzip 压缩已开启
- [ ] 安全响应头已配置
- [ ] `nginx -t` 测试通过，reload 生效

### 13.7 验证

- [ ] 浏览器访问 `https://blog.hdochub.com` 正常打开首页
- [ ] 文章列表与详情页正常加载（SSR 内容可见，查看源码含文章内容）
- [ ] 注册、登录、发文、评论、点赞功能正常
- [ ] 用户后台与管理员后台可访问
- [ ] RSS（`/rss.xml`）与 sitemap（`/sitemap.xml`）可访问
- [ ] HTTPS 证书有效，HTTP 自动跳转
- [ ] 健康检查接口正常
- [ ] 通知测试进行线上回归测试

---

## 14. 应急预案

| 故障场景 | 处理步骤 |
|----------|----------|
| 应用进程崩溃 | PM2 自动重启；若反复崩溃查看 PM2 日志定位，必要时回滚上一版本 |
| 数据库连接失败 | 检查 MySQL 服务状态、连接数、密码；重启 MySQL |
| Redis 不可用 | 检查 Redis 服务；应用降级（限流与缓存降级为内存模式或直接放行） |
| 磁盘满 | 清理日志与备份；扩容磁盘 |
| SSL 证书过期 | 宝塔手动续签；检查自动续签计划任务 |
| 被攻击（CC/暴力登录） | 宝塔防火墙封 IP；开启限流；临时关闭注册 |
| 数据误删 | 从最近备份恢复：`mysql -u blog_user -p blog_db < backup.sql` |

---

## 15. 附录：一键部署脚本参考

运维可参考以下脚本结构编写完整部署脚本（保存到 `/data/user/work/deploy.sh`，实际部署脚本由运维维护）：

```bash
#!/bin/bash
set -e

PROJECT_DIR="/www/wwwroot/blog.hdochub.com"
cd "$PROJECT_DIR"

echo "===== 拉取最新代码 ====="
cd server && git pull && cd ..
cd web && git pull && cd ..

echo "===== 部署后端 ====="
cd server
pnpm install --prod
pnpm prisma generate
pnpm prisma migrate deploy
pnpm build
pm2 restart blog-server || pm2 start ecosystem.config.js --only blog-server
cd ..

echo "===== 部署前端 ====="
cd web
pnpm install
pnpm build
pm2 restart blog-web || pm2 start ecosystem.config.js --only blog-web
cd ..

echo "===== 保存 PM2 进程列表 ====="
pm2 save

echo "===== 部署完成 ====="
pm2 status
```

---

> 本文档为部署架构基线，交付运维执行。部署过程中如遇环境差异或方案需调整，由运维反馈架构师评估后更新本文档。
