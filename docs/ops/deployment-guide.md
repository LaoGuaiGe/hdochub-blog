# hdochub 博客系统 - 部署指南

| 项目 | 内容 |
|------|------|
| 项目名称 | hdochub 个人技术博客 |
| 文档版本 | V1.0 |
| 编写日期 | 2026-07-28 |
| 编写人 | 运维工程师 |
| 适用对象 | 甲方（服务器管理员） |
| 域名 | blog.hdochub.com |
| 关联文档 | tech-stack.md、deployment.md、ops-manual.md |

---

## 目录

1. [前置条件](#1-前置条件)
2. [环境准备](#2-环境准备)
3. [代码上传](#3-代码上传)
4. [后端部署](#4-后端部署)
5. [前端部署](#5-前端部署)
6. [Nginx 配置](#6-nginx-配置)
7. [验证检查](#7-验证检查)
8. [注意事项](#8-注意事项)

---

## 1. 前置条件

### 1.1 服务器硬件要求

| 资源 | 最低配置 | 推荐配置 | 说明 |
|------|----------|----------|------|
| CPU | 2 核 | 4 核 | 同时运行 Nuxt SSR + NestJS + MySQL + Redis |
| 内存 | 2 GB | 4 GB | MySQL 约 512MB，Redis 约 50MB，Node 双进程约 600MB |
| 磁盘 | 20 GB SSD | 40 GB SSD | 系统 + 数据库 + 上传图片 + 日志 + 备份 |
| 带宽 | 3 Mbps | 5 Mbps+ | 文章为主，含图片 |

### 1.2 系统要求

| 项 | 要求 |
|----|------|
| 操作系统 | Ubuntu 20.04 / 22.04 LTS（已安装宝塔面板） |
| 宝塔面板 | 7.x+ |
| 系统用户 | root 或 sudo 权限用户 |
| 域名 | `blog.hdochub.com`，DNS 解析已指向服务器公网 IP |

### 1.3 需要安装的软件清单

| 软件 | 版本要求 | 管理方式 | 说明 |
|------|----------|----------|------|
| Node.js | 20 LTS | 宝塔 Node 版本管理器 | 运行前后端应用 |
| PM2 | 5.x | 宝塔 PM2 管理器插件 | Node 进程守护 |
| MySQL | 8.0 | 宝塔软件商店 | 业务数据库 |
| Redis | 6.x | 宝塔软件商店 | 缓存与接口限流 |
| Nginx | 1.22+ | 宝塔软件商店（默认安装） | 反向代理 + SSL |
| pnpm | 8.x | npm 全局安装 | 前后端包管理器 |

### 1.4 宝塔面板需要安装的插件

通过宝塔面板「软件商店」安装以下组件：

1. **Nginx** - 反向代理（宝塔默认推荐安装）
2. **MySQL 8.0** - 数据库
3. **Redis** - 缓存
4. **PM2 管理器** - Node.js 进程管理（安装时会自带 Node.js 版本管理器）
5. **Node.js 版本管理器** - 如 PM2 管理器未自带，需单独安装，用于安装 Node.js 20 LTS

---

## 2. 环境准备

### 2.1 安装基础软件

登录宝塔面板（默认地址：`http://服务器IP:8888`），进入「软件商店」，依次搜索并安装：

1. **Nginx** - 点击「安装」，选择 Nginx 1.22+
2. **MySQL 8.0** - 点击「安装」，选择 MySQL 8.0
3. **Redis** - 点击「安装」，选择 Redis 6.x
4. **PM2 管理器** - 点击「安装」

安装 PM2 管理器后：

5. 进入 PM2 管理器设置，在「Node 版本」中安装 **Node.js 20.x LTS**
6. 验证安装成功：在宝塔「终端」中执行以下命令

```bash
node -v
# 应输出 v20.x.x

npm -v
# 应输出 10.x.x
```

### 2.2 安装 pnpm

```bash
npm install -g pnpm
pnpm -v
# 应输出 8.x.x
```

### 2.3 创建数据库和数据库用户

1. 宝塔面板 → **数据库** → **添加数据库**
2. 填写以下信息：

| 项 | 值 | 说明 |
|----|-----|------|
| 数据库名 | `blog_db` | 博客数据库 |
| 用户名 | `blog_user` | 数据库专用账号 |
| 密码 | 自定义强密码（如 `B1og#Str0ng@Pwd2026`） | 请记录下来，后面配置要用 |
| 访问权限 | **本地服务器（127.0.0.1）** | 禁止远程访问 |
| 字符集 | `utf8mb4` | 支持中文和 emoji |

3. 点击「提交」创建

### 2.4 配置 Redis 密码

1. 宝塔面板 → **软件商店** → 找到已安装的 Redis → **设置**
2. 在配置文件中确认以下配置：

```
bind 127.0.0.1
requirepass 你的Redis密码    # 如 R3dis#Pwd2026，请设置一个强密码
maxmemory 256mb
maxmemory-policy allkeys-lru
```

3. 保存后重启 Redis

### 2.5 配置防火墙规则

宝塔面板 → **安全**，放行以下端口：

| 端口 | 用途 | 说明 |
|------|------|------|
| 80 | HTTP | 网站访问（自动跳转 HTTPS） |
| 443 | HTTPS | 网站访问 |
| 8888（或自定义） | 宝塔面板 | 建议绑定 IP 白名单 |

**以下端口不要放行（仅本机访问）：**

| 端口 | 用途 |
|------|------|
| 3000 | Nuxt SSR 前端（通过 Nginx 反代访问） |
| 4000 | NestJS API 后端（通过 Nginx 反代访问） |
| 3306 | MySQL 数据库（仅本机） |
| 6379 | Redis 缓存（仅本机） |

### 2.6 配置域名解析

在域名注册商（如阿里云、Cloudflare）的 DNS 管理后台添加 A 记录：

| 记录类型 | 主机记录 | 记录值 |
|----------|----------|--------|
| A | blog | 服务器公网 IP |

等待 DNS 生效后验证：

```bash
ping blog.hdochub.com
# 应解析到服务器公网 IP
```

---

## 3. 代码上传

### 3.1 目录结构

在服务器上创建项目目录：

```bash
mkdir -p /www/wwwroot/blog.hdochub.com
mkdir -p /www/wwwroot/blog.hdochub.com/uploads
mkdir -p /www/wwwroot/blog.hdochub.com/uploads/avatar
mkdir -p /www/wwwroot/blog.hdochub.com/uploads/cover
mkdir -p /www/wwwroot/blog.hdochub.com/uploads/article
mkdir -p /www/wwwlogs/pm2
```

### 3.2 上传方式

将本地项目代码上传到服务器。有两种方式：

**方式一：通过 Git 拉取（推荐）**

```bash
cd /www/wwwroot/blog.hdochub.com
git clone 你的仓库地址 .
```

**方式二：通过宝塔面板上传**

1. 将本地 `src/server` 目录打包为 `server.zip`
2. 将本地 `src/client` 目录打包为 `web.zip`
3. 宝塔面板 → **文件** → 进入 `/www/wwwroot/blog.hdochub.com/`
4. 上传 `server.zip` 和 `web.zip`，解压
5. 将 `client` 目录重命名为 `web`

### 3.3 最终目录结构

上传完成后，目录结构应为：

```
/www/wwwroot/blog.hdochub.com/
├── ecosystem.config.js      # PM2 配置文件（从 server/ 复制到此）
├── server/                  # 后端工程（NestJS）
│   ├── src/
│   ├── prisma/
│   ├── package.json
│   ├── nest-cli.json
│   └── .env.production
├── web/                     # 前端工程（Nuxt 3）
│   ├── pages/
│   ├── components/
│   ├── package.json
│   ├── nuxt.config.ts
│   └── .env.production
└── uploads/                 # 上传图片目录
    ├── avatar/
    ├── cover/
    └── article/
```

将 PM2 配置文件复制到项目根目录：

```bash
cp /www/wwwroot/blog.hdochub.com/server/ecosystem.config.js /www/wwwroot/blog.hdochub.com/
```

---

## 4. 后端部署

### 4.1 安装依赖

```bash
cd /www/wwwroot/blog.hdochub.com/server
pnpm install --prod
```

> `--prod` 参数跳过 devDependencies，减少安装体积。如果安装报错，可以尝试 `pnpm install` 安装全部依赖（包含 ts-node 等开发依赖，种子数据脚本需要）。

### 4.2 配置 .env 文件

后端使用 `.env.production` 文件存储环境变量。编辑该文件：

```bash
cd /www/wwwroot/blog.hdochub.com/server
vi .env.production
```

完整配置及说明如下（请根据实际情况填写）：

```bash
# ===== 运行环境 =====
NODE_ENV=production
PORT=4000

# ===== 数据库连接 =====
# 格式：mysql://用户名:密码@主机:端口/数据库名
# 请将 strong_password 替换为 2.3 步创建数据库时设置的密码
DATABASE_URL="mysql://blog_user:你的数据库密码@127.0.0.1:3306/blog_db"

# ===== Redis 配置 =====
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
# 请将下方密码替换为 2.4 步设置的 Redis 密码
REDIS_PASSWORD=你的Redis密码
REDIS_DB=0

# ===== JWT 密钥 =====
# 重要：请替换为一个长随机字符串（建议 32 字符以上）
# 生成方法：openssl rand -base64 32
JWT_SECRET=替换为一个长随机字符串
JWT_EXPIRES_IN=7d
JWT_REMEMBER_EXPIRES_IN=30d

# ===== 文件上传 =====
UPLOAD_DIR=/www/wwwroot/blog.hdochub.com/uploads
UPLOAD_MAX_SIZE=5242880

# ===== 站点 URL =====
SITE_URL=https://blog.hdochub.com

# ===== CORS 跨域配置 =====
CORS_ORIGIN=https://blog.hdochub.com
```

> **安全提示**：`.env.production` 文件包含数据库密码和 JWT 密钥等敏感信息，绝不能上传到 Git 仓库。

### 4.3 Prisma 数据库迁移

```bash
cd /www/wwwroot/blog.hdochub.com/server

# 生成 Prisma 客户端
npx prisma generate

# 执行数据库迁移（创建所有表结构）
npx prisma migrate deploy
```

如果提示 `prisma` 命令不存在，使用：

```bash
./node_modules/.bin/prisma generate
./node_modules/.bin/prisma migrate deploy
```

成功后会看到类似输出：

```
Running migration 20260728_xxxxxx_init
...
All migrations applied successfully.
```

### 4.4 初始化种子数据

> **仅首次部署时执行**，已有数据时不要重复执行。

```bash
cd /www/wwwroot/blog.hdochub.com/server
npx prisma:seed
```

或使用 ts-node 直接运行：

```bash
npx ts-node prisma/seed.ts
```

种子数据会初始化以下内容：

| 内容 | 详情 |
|------|------|
| 超级管理员账号 | 用户名：`admin`，密码：`Admin@123456` |
| 默认分类 | 技术问题、教程、观点、随笔 |
| 站点设置 | 站点标题、副标题、描述、注册开关等 |

> **重要**：首次登录后请立即修改管理员密码！

### 4.5 编译项目

```bash
cd /www/wwwroot/blog.hdochub.com/server
pnpm build
```

成功后会在 `dist/` 目录生成编译产物。验证入口文件存在：

```bash
ls dist/main.js
# 应输出: dist/main.js
```

### 4.6 创建上传目录软链接

```bash
cd /www/wwwroot/blog.hdochub.com/server
ln -s /www/wwwroot/blog.hdochub.com/uploads uploads
```

### 4.7 使用 PM2 启动后端

```bash
# 从项目根目录启动
cd /www/wwwroot/blog.hdochub.com
pm2 start ecosystem.config.js --only blog-server

# 查看启动状态
pm2 status
```

确认 `blog-server` 状态为 **online**。

### 4.8 验证后端服务

```bash
curl http://127.0.0.1:4000/api/settings
```

应返回 JSON 响应，包含站点设置数据（code 为 0 表示成功）。

```bash
curl http://127.0.0.1:4000/api/health
```

应返回健康检查响应，`status` 为 `healthy`，`database` 和 `redis` 为 `connected`。

---

## 5. 前端部署

### 5.1 安装依赖

```bash
cd /www/wwwroot/blog.hdochub.com/web
pnpm install
```

### 5.2 配置 .env.production

编辑生产环境配置文件：

```bash
cd /www/wwwroot/blog.hdochub.com/web
vi .env.production
```

内容如下：

```bash
# 生产环境后端 API 地址
# 前端 SSR 和浏览器端都会使用此地址调用后端接口
# 注意：这里使用域名而不是 localhost，因为 SSR 服务端也需要请求 API
NUXT_PUBLIC_API_BASE=https://blog.hdochub.com/api

# 站点地址
NUXT_PUBLIC_SITE_URL=https://blog.hdochub.com
```

> **关键说明**：`NUXT_PUBLIC_API_BASE` 必须使用 `https://blog.hdochub.com/api` 而非 `http://localhost:4000/api`。Nuxt SSR 在服务端渲染时需要通过域名请求 API，使用 localhost 会导致 SSR 请求失败。

### 5.3 构建生产产物

```bash
cd /www/wwwroot/blog.hdochub.com/web
pnpm build
```

构建成功后会在 `.output/` 目录生成 SSR 产物。

### 5.4 使用 PM2 启动前端

```bash
# 从项目根目录启动
cd /www/wwwroot/blog.hdochub.com
pm2 start ecosystem.config.js --only blog-web

# 查看启动状态
pm2 status
```

确认 `blog-web` 状态为 **online**。

### 5.5 验证前端服务

```bash
curl -I http://127.0.0.1:3000
```

应返回 `HTTP/1.1 200 OK`，内容类型为 `text/html`。

```bash
curl http://127.0.0.1:3000 | head -20
```

应返回 HTML 内容，包含 `<html>`、`<head>` 等标签。

---

## 5.5 PM2 保存与开机自启

### 5.5.1 保存当前进程列表

```bash
pm2 save
```

### 5.5.2 配置开机自启

```bash
pm2 startup
```

执行后，终端会输出一条以 `sudo` 开头的命令，**复制并执行该命令**：

```bash
# 示例输出（实际命令以终端提示为准）：
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root
```

执行后，PM2 会在系统 systemd 中注册开机自启服务。

### 5.5.3 验证 PM2 状态

```bash
pm2 status
```

输出应类似：

```
┌────┬─────────────┬─────────────┬─────────┬─────────┬──────────┐
│ id │ name        │ namespace   │ version │ mode    │ pid      │
├────┼─────────────┼─────────────┼─────────┼─────────┼──────────┤
│ 0  │ blog-web    │ default     │ 1.0.0   │ fork    │ 12345    │
│ 1  │ blog-server │ default     │ 1.0.0   │ fork    │ 12346    │
└────┴─────────────┴─────────────┴─────────┴─────────┴──────────┘
```

两个服务都应该是 **online** 状态。

---

## 6. Nginx 配置

### 6.1 添加站点

1. 宝塔面板 → **网站** → **添加站点**
2. 填写以下信息：

| 项 | 值 |
|----|-----|
| 域名 | `blog.hdochub.com` |
| 根目录 | `/www/wwwroot/blog.hdochub.com/web`（可先随意填，后面不用） |
| PHP 版本 | 纯静态（不需要 PHP） |
| 数据库 | 不创建 |

3. 点击「提交」

### 6.2 申请 SSL 证书

1. 宝塔面板 → **网站** → 点击 `blog.hdochub.com` 的「设置」
2. 进入 **SSL** 选项卡
3. 选择 **Let's Encrypt**
4. 勾选域名 `blog.hdochub.com`
5. 点击「申请」
6. 申请成功后，开启 **强制 HTTPS**

> Let's Encrypt 证书有效期为 90 天，宝塔面板会自动续签，无需手动操作。

### 6.3 配置 Nginx 反向代理

1. 宝塔面板 → **网站** → 点击 `blog.hdochub.com` 的「设置」
2. 进入 **配置文件** 选项卡
3. **清空**原有内容，粘贴以下完整配置：

```nginx
# /www/server/panel/vhost/nginx/blog.hdochub.com.conf

# ===== HTTP 强制跳转 HTTPS =====
server {
    listen 80;
    server_name blog.hdochub.com;
    return 301 https://$host$request_uri;
}

# ===== HTTPS 主配置 =====
server {
    listen 443 ssl http2;
    server_name blog.hdochub.com;

    # ===== SSL 证书（宝塔自动填写路径，请确认路径正确） =====
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

    # ===== 上传图片静态资源（Nginx 直接处理，不走 Node） =====
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

### 6.4 验证并重载 Nginx

```bash
# 测试配置是否正确
nginx -t

# 重载配置
nginx -s reload
```

`nginx -t` 应输出 `syntax is ok` 和 `test is successful`。

---

## 7. 验证检查

按照以下步骤逐步验证，确保每个环节正常。

### 7.1 检查后端服务

```bash
curl http://127.0.0.1:4000/api/settings
```

期望结果：返回 JSON 数据，包含站点设置。

```bash
curl http://127.0.0.1:4000/api/health
```

期望结果：返回 `{"code":0,"data":{"status":"healthy","database":"connected","redis":"connected"}}`。

### 7.2 检查前端服务

```bash
curl -I http://127.0.0.1:3000
```

期望结果：`HTTP/1.1 200 OK`，Content-Type 为 `text/html`。

```bash
curl -s http://127.0.0.1:3000 | head -5
```

期望结果：返回 HTML 内容，包含 `<!DOCTYPE html>` 或 `<html`。

### 7.3 检查域名访问

在浏览器中打开以下地址：

1. `https://blog.hdochub.com` - 应正常显示博客首页
2. `https://blog.hdochub.com/api/settings` - 应返回站点设置的 JSON 数据
3. `https://blog.hdochub.com/sitemap.xml` - 应返回 sitemap XML

### 7.4 检查 SSL 证书

1. 浏览器地址栏应显示锁形图标
2. 证书详情中，颁发者应为 Let's Encrypt
3. 有效期应在 90 天以内

### 7.5 检查 HTTP 跳转

在浏览器中访问 `http://blog.hdochub.com`，应自动跳转到 `https://blog.hdochub.com`。

### 7.6 检查 PM2 进程

```bash
pm2 status
```

确认 `blog-web` 和 `blog-server` 两个进程都是 **online** 状态。

### 7.7 功能冒烟测试

1. 打开 `https://blog.hdochub.com`，确认首页正常显示
2. 使用管理员账号登录：用户名 `admin`，密码 `Admin@123456`
3. 进入管理员后台（`/admin`），确认能正常访问
4. 尝试创建一篇测试文章，发布后确认前台能正常显示
5. 测试评论、点赞功能
6. 测试用户注册和登录

---

## 8. 注意事项

### 8.1 默认管理员账号

| 项 | 值 |
|----|-----|
| 用户名 | `admin` |
| 密码 | `Admin@123456` |
| 角色 | SUPER_ADMIN |

> **首次登录后请立即修改密码！** 通过管理员后台或用户后台的「个人资料」页面修改。

### 8.2 安全加固建议

部署完成后，建议执行以下安全加固措施：

| 序号 | 加固项 | 操作方法 |
|------|--------|----------|
| 1 | 修改 SSH 端口 | 将默认 22 端口改为随机高端口，在 `/etc/ssh/sshd_config` 中修改 |
| 2 | 禁用 root 密码登录 | 使用 SSH 密钥登录，禁用密码认证 |
| 3 | 修改宝塔面板端口 | 将默认 8888 改为随机端口，绑定 IP 白名单 |
| 4 | 确认数据库仅本机访问 | MySQL 配置 `bind-address = 127.0.0.1` |
| 5 | 确认 Redis 有密码 | Redis 配置 `requirepass` 已设置 |
| 6 | 修改 JWT 密钥 | `.env.production` 中的 `JWT_SECRET` 必须替换为强随机字符串 |
| 7 | 设置文件权限 | `.env.production` 文件权限设为 600：`chmod 600 .env.production` |
| 8 | 配置数据库自动备份 | 见运维手册「数据库备份与恢复」章节 |

### 8.3 常见问题排查

| 问题 | 排查方法 |
|------|----------|
| PM2 进程一直 restart | 查看 PM2 日志：`pm2 logs blog-server` 或 `pm2 logs blog-web` |
| 后端 API 返回 500 | 检查 `.env.production` 中数据库密码和 Redis 密码是否正确 |
| 前端页面空白 | 检查 Nuxt 构建是否成功：确认 `web/.output/` 目录存在 |
| 域名无法访问 | 检查 DNS 解析是否生效：`ping blog.hdochub.com` |
| SSL 证书申请失败 | 确认域名已正确解析到服务器 IP，且 80 端口可访问 |
| 图片上传失败 | 检查 `uploads/` 目录权限：`chmod 755 /www/wwwroot/blog.hdochub.com/uploads` |
| 数据库迁移失败 | 确认 `DATABASE_URL` 连接串格式正确，数据库用户有建表权限 |

### 8.4 宝塔面板配置数据库自动备份

1. 宝塔面板 → **计划任务** → **添加计划任务**
2. 任务类型：**备份 MySQL**
3. 选择数据库 `blog_db`
4. 执行周期：**每天**
5. 执行时间：**03:00**
6. 备份保留：**7 份**
7. 点击「添加」

---

## 附录：快速部署命令汇总

以下命令按顺序执行，可用于快速部署（假设代码已上传到服务器）：

```bash
# ===== 1. 后端部署 =====
cd /www/wwwroot/blog.hdochub.com/server

# 安装依赖
pnpm install

# 生成 Prisma 客户端
npx prisma generate

# 执行数据库迁移
npx prisma migrate deploy

# 初始化种子数据（仅首次）
npx prisma:seed

# 编译
pnpm build

# 创建上传目录软链接
ln -s /www/wwwroot/blog.hdochub.com/uploads uploads

# ===== 2. 前端部署 =====
cd /www/wwwroot/blog.hdochub.com/web

# 安装依赖
pnpm install

# 构建
pnpm build

# ===== 3. PM2 启动 =====
cd /www/wwwroot/blog.hdochub.com
pm2 start ecosystem.config.js

# 保存进程列表
pm2 save

# 配置开机自启（按终端提示执行 sudo 命令）
pm2 startup

# ===== 4. 验证 =====
pm2 status
curl http://127.0.0.1:4000/api/health
curl -I http://127.0.0.1:3000
```

---

> 如部署过程中遇到问题，请参考运维手册 `/workspace/docs/ops/ops-manual.md` 中的「常见问题处理」章节。
