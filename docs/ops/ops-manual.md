# hdochub 博客系统 - 运维手册

| 项目 | 内容 |
|------|------|
| 项目名称 | hdochub 个人技术博客 |
| 文档版本 | V1.0 |
| 编写日期 | 2026-07-28 |
| 编写人 | 运维工程师 |
| 适用对象 | 运维人员、甲方（服务器管理员） |
| 域名 | blog.hdochub.com |
| 关联文档 | deployment-guide.md、deployment.md、tech-stack.md |

---

## 目录

1. [日常运维](#1-日常运维)
2. [更新部署](#2-更新部署)
3. [监控告警](#3-监控告警)
4. [常见问题处理](#4-常见问题处理)
5. [附录](#5-附录)

---

## 1. 日常运维

### 1.1 服务管理命令

PM2 是 Node.js 进程管理工具，用于管理博客的前后端服务。

#### 1.1.1 查看服务状态

```bash
# 查看所有进程状态
pm2 status

# 实时监控面板（显示 CPU、内存、日志）
pm2 monit

# 查看某个进程的详细信息
pm2 show blog-server
pm2 show blog-web
```

#### 1.1.2 服务启停

```bash
# 启动所有服务
pm2 start ecosystem.config.js

# 启动单个服务
pm2 start ecosystem.config.js --only blog-server
pm2 start ecosystem.config.js --only blog-web

# 重启所有服务
pm2 restart all

# 重启单个服务
pm2 restart blog-server
pm2 restart blog-web

# 停止所有服务
pm2 stop all

# 停止单个服务
pm2 stop blog-server
pm2 stop blog-web

# 删除进程（从 PM2 进程列表中移除）
pm2 delete blog-server
pm2 delete blog-web

# 优雅重载（零停机，推荐用于更新部署）
pm2 reload blog-server
pm2 reload blog-web
```

#### 1.1.3 PM2 开机自启管理

```bash
# 保存当前进程列表
pm2 save

# 查看已保存的进程列表
pm2 save --list

# 重新配置开机自启
pm2 startup
# 执行终端输出的 sudo 命令
```

### 1.2 日志查看方法

#### 1.2.1 日志文件位置

| 日志类型 | 文件路径 | 说明 |
|----------|----------|------|
| 后端标准输出 | `/www/wwwlogs/pm2/blog-server-out.log` | NestJS 运行日志 |
| 后端错误日志 | `/www/wwwlogs/pm2/blog-server-error.log` | NestJS 错误/异常 |
| 前端标准输出 | `/www/wwwlogs/pm2/blog-web-out.log` | Nuxt 运行日志 |
| 前端错误日志 | `/www/wwwlogs/pm2/blog-web-error.log` | Nuxt 错误/异常 |
| Nginx 访问日志 | `/www/wwwlogs/blog.hdochub.com.log` | 所有 HTTP 请求记录 |
| Nginx 错误日志 | `/www/wwwlogs/blog.hdochub.com.error.log` | Nginx 错误 |
| MySQL 错误日志 | `/www/server/data/mysql.err` | MySQL 启动/运行错误 |
| Redis 日志 | `/www/server/redis/redis.log` | Redis 运行日志 |

#### 1.2.2 通过 PM2 查看日志

```bash
# 查看所有进程的实时日志（按 Ctrl+C 退出）
pm2 logs

# 查看指定进程的实时日志
pm2 logs blog-server
pm2 logs blog-web

# 查看最近 50 行日志
pm2 logs blog-server --lines 50

# 查看错误日志
pm2 logs blog-server --err
```

#### 1.2.3 通过命令行查看日志文件

```bash
# 查看最新的 Nginx 访问日志（实时跟踪）
tail -f /www/wwwlogs/blog.hdochub.com.log

# 查看最新的 Nginx 错误日志
tail -f /www/wwwlogs/blog.hdochub.com.error.log

# 查看后端最近 100 行错误日志
tail -100 /www/wwwlogs/pm2/blog-server-error.log

# 搜索错误日志中的关键词
grep -i "error" /www/wwwlogs/pm2/blog-server-error.log | tail -20

# 查看日志文件大小
ls -lh /www/wwwlogs/pm2/
```

#### 1.2.4 日志切割

通过宝塔面板管理日志切割：

1. 宝塔面板 → **计划任务** → **添加计划任务**
2. 任务类型：**日志切割**
3. 选择日志目录：`/www/wwwlogs/`
4. 执行周期：**每天**
5. 执行时间：**00:00**
6. 保留份数：**30**
7. 点击「添加」

### 1.3 数据库备份与恢复

#### 1.3.1 配置自动备份（宝塔面板）

**MySQL 数据库备份：**

1. 宝塔面板 → **计划任务** → **添加计划任务**
2. 任务类型：**备份 MySQL**
3. 选择数据库：`blog_db`
4. 执行周期：**每天**
5. 执行时间：**03:00**
6. 保留份数：**7**
7. 点击「添加」

**上传图片备份：**

1. 宝塔面板 → **计划任务** → **添加计划任务**
2. 任务类型：**备份网站**
3. 选择站点：`blog.hdochub.com`
4. 执行周期：**每天**
5. 执行时间：**03:30**
6. 保留份数：**7**
7. 点击「添加」

备份文件存储位置：

| 备份类型 | 存储路径 |
|----------|----------|
| MySQL 数据库 | `/www/backup/database/` |
| 网站文件 | `/www/backup/site/` |

#### 1.3.2 手动备份

```bash
# 备份 MySQL 数据库
mysqldump -u blog_user -p blog_db --single-transaction --routines --triggers > /www/backup/database/blog_db_$(date +%Y%m%d_%H%M).sql

# 备份上传图片目录
tar czf /www/backup/site/uploads_$(date +%Y%m%d_%H%M).tar.gz -C /www/wwwroot/blog.hdochub.com uploads/
```

#### 1.3.3 数据恢复

```bash
# 恢复 MySQL 数据库
mysql -u blog_user -p blog_db < /www/backup/database/blog_db_20260728_0300.sql

# 恢复上传图片
tar xzf /www/backup/site/uploads_20260728_0300.tar.gz -C /www/wwwroot/blog.hdochub.com/
```

> **注意**：恢复数据库前建议先备份当前数据，避免覆盖后无法回退。

### 1.4 Redis 管理

#### 1.4.1 常用操作

```bash
# 连接 Redis（需要输入密码）
redis-cli -a 你的Redis密码

# 连接后执行：
PING                    # 测试连接，应返回 PONG
DBSIZE                  # 查看当前数据库 Key 数量
INFO memory             # 查看内存使用情况
INFO stats              # 查看统计信息
FLUSHDB                 # 清空当前数据库（谨慎操作！）
EXIT                    # 退出
```

#### 1.4.2 查看 Key 列表（调试用）

```bash
redis-cli -a 你的Redis密码 KEYS "*" | head -50
```

#### 1.4.3 缓存说明

博客系统使用 Redis 进行以下缓存：

| 用途 | Key 格式 | TTL |
|------|----------|-----|
| 阅读量去重 | `view:{articleId}:{ip}` | 30 分钟 |
| 接口限流 | `rate:{api}:{ip}` | 60 秒 / 3600 秒 |
| 文章缓存 | `article:{slug}` | 5 分钟 |
| 文章列表缓存 | `articles:list:{hash}` | 5 分钟 |
| 站点设置缓存 | `settings:site` | 永久（修改时刷新） |
| JWT 黑名单 | `jwt:blacklist:{tokenJti}` | Token 剩余有效期 |

#### 1.4.4 清除全部缓存

如果遇到缓存导致的数据不一致问题，可以清除 Redis 缓存：

```bash
redis-cli -a 你的Redis密码 FLUSHDB
```

清除后，系统会在下次请求时自动重建缓存。

#### 1.4.5 Redis 服务管理

通过宝塔面板管理 Redis：

1. 宝塔面板 → **软件商店** → Redis → **设置**
2. 可以在此重启 Redis、修改配置、查看日志

---

## 2. 更新部署

### 2.1 代码更新流程

当有新版本代码需要部署时，按以下步骤操作：

#### 2.1.1 后端更新

```bash
# 1. 进入后端目录
cd /www/wwwroot/blog.hdochub.com/server

# 2. 拉取最新代码
git pull

# 3. 更新依赖
pnpm install

# 4. 更新 Prisma 客户端
npx prisma generate

# 5. 执行数据库迁移（如有新的迁移文件）
npx prisma migrate deploy

# 6. 重新编译
pnpm build

# 7. 优雅重载后端服务（零停机）
pm2 reload blog-server
```

#### 2.1.2 前端更新

```bash
# 1. 进入前端目录
cd /www/wwwroot/blog.hdochub.com/web

# 2. 拉取最新代码
git pull

# 3. 更新依赖
pnpm install

# 4. 重新构建
pnpm build

# 5. 优雅重载前端服务
pm2 reload blog-web
```

#### 2.1.3 完整更新流程（一键脚本）

可以创建以下部署脚本，保存在 `/www/wwwroot/blog.hdochub.com/deploy.sh`：

```bash
#!/bin/bash
set -e

echo "===== $(date '+%Y-%m-%d %H:%M:%S') 开始部署 ====="

PROJECT_DIR="/www/wwwroot/blog.hdochub.com"
cd "$PROJECT_DIR"

# ===== 后端更新 =====
echo ">>> 更新后端..."
cd server
git pull
pnpm install
npx prisma generate
npx prisma migrate deploy
pnpm build
pm2 reload blog-server
echo ">>> 后端更新完成"

# ===== 前端更新 =====
echo ">>> 更新前端..."
cd "$PROJECT_DIR"/web
git pull
pnpm install
pnpm build
pm2 reload blog-web
echo ">>> 前端更新完成"

# ===== 保存进程 =====
cd "$PROJECT_DIR"
pm2 save

# ===== 验证 =====
echo ">>> 验证服务状态..."
sleep 3
pm2 status
curl -s http://127.0.0.1:4000/api/health
echo ""
echo "===== $(date '+%Y-%m-%d %H:%M:%S') 部署完成 ====="
```

使用方法：

```bash
chmod +x /www/wwwroot/blog.hdochub.com/deploy.sh
/www/wwwroot/blog.hdochub.com/deploy.sh
```

### 2.2 数据库迁移流程

当 Prisma Schema 有变更时，需要执行数据库迁移：

```bash
cd /www/wwwroot/blog.hdochub.com/server

# 查看待执行的迁移
npx prisma migrate status

# 执行迁移
npx prisma migrate deploy
```

> **注意**：`prisma migrate deploy` 只执行已存在的迁移文件（生产安全），不会创建新迁移。新迁移文件由开发人员创建并提交到代码仓库。

迁移前建议备份数据库：

```bash
mysqldump -u blog_user -p blog_db --single-transaction > /www/backup/database/blog_db_pre_migrate_$(date +%Y%m%d).sql
```

### 2.3 回滚方法

#### 2.3.1 代码回滚

```bash
# 查看提交历史
cd /www/wwwroot/blog.hdochub.com/server
git log --oneline -10

# 回滚到指定版本
git checkout <commit-hash>

# 重新编译并重启
pnpm install
pnpm build
pm2 restart blog-server

# 前端同理
cd /www/wwwroot/blog.hdochub.com/web
git checkout <commit-hash>
pnpm install
pnpm build
pm2 restart blog-web
```

#### 2.3.2 数据库回滚

```bash
# 先恢复备份
mysql -u blog_user -p blog_db < /www/backup/database/blog_db_pre_migrate_20260728.sql

# 然后部署对应版本的代码
```

> **重要**：回滚前必须确认备份文件完整可用。建议先在测试环境验证回滚流程。

#### 2.3.3 紧急回滚（服务异常时）

如果更新后服务异常，立即回滚：

```bash
# 1. 先恢复之前的工作代码版本
cd /www/wwwroot/blog.hdochub.com/server
git reflog                    # 查看操作记录，找到更新前的 commit
git reset --hard <旧commit>   # 回退到旧版本
pnpm build
pm2 restart blog-server

cd /www/wwwroot/blog.hdochub.com/web
git reflog
git reset --hard <旧commit>
pnpm build
pm2 restart blog-web
```

---

## 3. 监控告警

### 3.1 宝塔面板监控配置

#### 3.1.1 资源监控

宝塔面板首页会显示服务器资源概览，包括 CPU、内存、磁盘、网络使用情况。

配置告警通知：

1. 宝塔面板 → **设置** → **监控设置**
2. 开启 **CPU 告警**：阈值 > 80%，持续 5 分钟
3. 开启 **内存告警**：阈值 > 85%
4. 开启 **磁盘告警**：阈值 > 90%
5. 配置告警通知方式（邮件 / 微信 / 钉钉）

#### 3.1.2 服务可用性监控

配置网站可用性检测：

1. 宝塔面板 → **网站** → `blog.hdochub.com` → **设置** → **监控**
2. 添加监控任务
3. 检测 URL：`https://blog.hdochub.com/api/health`
4. 检测频率：每 1 分钟
5. 预期响应：HTTP 200
6. 超时时间：10 秒
7. 连续失败次数：3 次后告警

### 3.2 关键监控指标

| 指标 | 正常范围 | 告警阈值 | 排查方向 |
|------|----------|----------|----------|
| CPU 使用率 | < 30% | > 80% 持续 5 分钟 | 是否有大流量访问、异常进程 |
| 内存使用率 | < 60% | > 85% | Node 进程内存泄漏、MySQL 缓冲池过大 |
| 磁盘使用率 | < 70% | > 90% | 日志文件过大、备份文件堆积 |
| 后端服务状态 | online | stopped / errored | 查看日志：`pm2 logs blog-server` |
| 前端服务状态 | online | stopped / errored | 查看日志：`pm2 logs blog-web` |
| MySQL 连接数 | < 20 | > 80 | 连接泄漏、慢查询 |
| Redis 内存 | < 50MB | > 200MB | Key 过多、TTL 未设置 |

### 3.3 PM2 实时监控

```bash
# 实时监控面板（推荐）
pm2 monit

# 查看进程资源占用
pm2 status

# 查看特定进程详情
pm2 show blog-server
```

### 3.4 应用健康检查

后端提供健康检查接口：

```bash
curl http://127.0.0.1:4000/api/health
```

期望返回：

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

如果 `database` 或 `redis` 显示为 `disconnected`，说明相应服务有异常。

可通过宝塔计划任务配置定时健康检查：

1. 宝塔面板 → **计划任务** → **添加计划任务**
2. 任务类型：**Shell 脚本**
3. 脚本内容：

```bash
#!/bin/bash
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:4000/api/health)
if [ "$HEALTH" != "200" ]; then
    pm2 restart blog-server
    echo "$(date) - 健康检查失败，已自动重启 blog-server" >> /www/wwwlogs/pm2/health-check.log
fi
```

4. 执行周期：**每 5 分钟**
5. 点击「添加」

---

## 4. 常见问题处理

### 4.1 服务无法启动

**现象**：PM2 状态显示 `errored` 或 `stopped`，进程反复重启。

**排查步骤**：

```bash
# 1. 查看进程状态
pm2 status

# 2. 查看错误日志
pm2 logs blog-server --err --lines 50
pm2 logs blog-web --err --lines 50

# 3. 检查端口是否被占用
ss -tlnp | grep 3000
ss -tlnp | grep 4000
```

**常见原因与解决方案**：

| 原因 | 解决方案 |
|------|----------|
| 端口被占用 | 找到占用进程并终止：`kill <PID>`，然后重启 PM2 |
| .env 配置错误 | 检查 `.env.production` 文件，确保所有环境变量正确 |
| 依赖缺失 | 重新安装依赖：`pnpm install` |
| 编译产物不存在 | 后端需要先 `pnpm build` 生成 `dist/` 目录 |
| Prisma 客户端未生成 | 执行 `npx prisma generate` |
| 内存不足 | 检查服务器内存，必要时升级或增加 swap |
| Node 版本不对 | 确认 Node.js 版本为 20 LTS：`node -v` |

**内存不足时添加 Swap（应急）**：

```bash
# 创建 2G swap 文件
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# 开机自动挂载
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### 4.2 数据库连接失败

**现象**：后端日志出现 `Can't connect to MySQL server` 或 `Access denied`。

**排查步骤**：

```bash
# 1. 检查 MySQL 是否在运行
systemctl status mysql
# 或通过宝塔面板查看 MySQL 状态

# 2. 检查 MySQL 端口
ss -tlnp | grep 3306

# 3. 测试数据库连接
mysql -u blog_user -p -h 127.0.0.1 blog_db
```

**常见原因与解决方案**：

| 原因 | 解决方案 |
|------|----------|
| MySQL 未启动 | 通过宝塔面板启动 MySQL |
| 密码错误 | 检查 `.env.production` 中的 `DATABASE_URL` 密码是否与数据库用户密码一致 |
| 用户权限不足 | 宝塔面板 → 数据库 → `blog_db` → 权限 → 确认用户有全部权限 |
| 连接数耗尽 | 宝塔面板 → MySQL → 设置 → 调大 `max_connections`（默认 100 足够） |
| MySQL 磁盘满 | 清理磁盘空间后重启 MySQL |

### 4.3 前端页面空白

**现象**：浏览器访问 `https://blog.hdochub.com` 显示空白页。

**排查步骤**：

```bash
# 1. 检查前端服务是否运行
pm2 status
# blog-web 应为 online 状态

# 2. 检查前端日志
pm2 logs blog-web --lines 30

# 3. 直接访问前端服务
curl http://127.0.0.1:3000
# 应返回 HTML 内容

# 4. 检查 Nuxt 构建产物是否存在
ls -la /www/wwwroot/blog.hdochub.com/web/.output/
# 应有 server/ 目录和 nitro.mjs 等文件
```

**常见原因与解决方案**：

| 原因 | 解决方案 |
|------|----------|
| 构建失败 | 重新构建：`cd web && pnpm build`，查看构建日志 |
| 构建产物缺失 | 确认 `.output/` 目录存在且完整 |
| API 地址配置错误 | 检查 `.env.production` 中 `NUXT_PUBLIC_API_BASE` |
| 后端未启动 | 前端 SSR 需要后端 API 数据，确认 `blog-server` 在线 |
| 端口冲突 | 检查 3000 端口是否被占用 |
| 内存不足 | 查看系统内存，SSR 渲染消耗内存较多 |

### 4.4 SSL 证书过期

**现象**：浏览器提示连接不安全，证书过期。

**排查与修复**：

1. 宝塔面板 → **网站** → `blog.hdochub.com` → **SSL**
2. 查看 Let's Encrypt 证书到期时间
3. 点击「续签」按钮手动续签
4. 如果自动续签失败，检查：
   - 域名解析是否正常（`ping blog.hdochub.com`）
   - 80 端口是否可从外网访问（Let's Encrypt 验证需要）
   - 宝塔计划任务中是否有「Let's Encrypt 证书续签」任务

**预防措施**：

- 确认宝塔面板「计划任务」中有自动续签任务
- 设置日历提醒，每 60 天检查一次证书有效期
- 考虑在到期前 30 天手动检查一次

### 4.5 磁盘空间不足

**现象**：服务变慢、写入失败、备份失败。

**排查步骤**：

```bash
# 查看磁盘使用情况
df -h

# 查看各目录占用空间
du -sh /www/wwwroot/* /www/backup/* /www/wwwlogs/* /www/server/data/*
```

**清理方法**：

| 清理项 | 命令/操作 | 说明 |
|--------|-----------|------|
| PM2 日志 | `pm2 flush` | 清空 PM2 管理的日志 |
| Nginx 日志 | 宝塔面板 → 日志切割 | 按天切割，保留 30 天 |
| 旧备份文件 | `ls /www/backup/database/` | 删除过期的备份（保留最近 7 份） |
| MySQL binlog | 宝塔面板 → MySQL → 设置 | 缩短 binlog 保留天数 |
| Node 缓存 | `pnpm store prune` | 清理 pnpm 缓存 |
| 系统日志 | `journalctl --vacuum-time=7d` | 清理 7 天前的系统日志 |

**手动清理脚本**：

```bash
#!/bin/bash
# 清理 30 天前的日志
find /www/wwwlogs -name "*.log.*" -mtime +30 -delete

# 清理 30 天前的备份
find /www/backup -name "*.sql" -mtime +30 -delete
find /www/backup -name "*.tar.gz" -mtime +30 -delete

# 清空 PM2 日志
pm2 flush

echo "清理完成"
df -h
```

### 4.6 其他常见问题

#### 4.6.1 上传图片失败

**排查步骤**：

```bash
# 检查上传目录权限
ls -la /www/wwwroot/blog.hdochub.com/uploads/

# 确保目录可写
chmod 755 /www/wwwroot/blog.hdochub.com/uploads/
chmod 755 /www/wwwroot/blog.hdochub.com/uploads/avatar/
chmod 755 /www/wwwroot/blog.hdochub.com/uploads/cover/
chmod 755 /www/wwwroot/blog.hdochub.com/uploads/article/

# 检查软链接
ls -la /www/wwwroot/blog.hdochub.com/server/uploads
# 应指向 /www/wwwroot/blog.hdochub.com/uploads
```

#### 4.6.2 页面访问速度慢

**排查步骤**：

1. 检查 CDN 是否接入（可选）
2. 检查 Nginx Gzip 是否开启（在站点配置文件中确认 `gzip on;`）
3. 检查服务器带宽使用情况
4. 清理 Redis 缓存，确认缓存是否正常工作
5. 检查 MySQL 慢查询：

```bash
# 查看慢查询日志
宝塔面板 → MySQL → 设置 → 慢查询日志
```

#### 4.6.3 后端 API 返回 502

**排查步骤**：

```bash
# 1. 确认后端服务是否在运行
pm2 status

# 2. 确认后端端口是否可访问
curl http://127.0.0.1:4000/api/health

# 3. 检查 Nginx 配置中的代理端口是否正确（应为 4000）
# 宝塔面板 → 网站 → 设置 → 配置文件
# 确认 proxy_pass http://127.0.0.1:4000;
```

#### 4.6.4 宝塔面板无法访问

1. 检查面板端口是否放行（安全组 + 宝塔防火墙）
2. 检查宝塔服务状态：`bt status`
3. 重启宝塔面板：`bt restart`
4. 修改宝塔面板端口：`bt 8`（按提示输入新端口）

---

## 5. 附录

### 5.1 重要目录一览

| 目录 | 用途 |
|------|------|
| `/www/wwwroot/blog.hdochub.com/` | 项目根目录 |
| `/www/wwwroot/blog.hdochub.com/server/` | 后端工程 |
| `/www/wwwroot/blog.hdochub.com/web/` | 前端工程 |
| `/www/wwwroot/blog.hdochub.com/uploads/` | 上传图片 |
| `/www/wwwlogs/pm2/` | PM2 日志 |
| `/www/wwwlogs/blog.hdochub.com.log` | Nginx 访问日志 |
| `/www/wwwlogs/blog.hdochub.com.error.log` | Nginx 错误日志 |
| `/www/backup/database/` | 数据库备份 |
| `/www/backup/site/` | 网站备份 |

### 5.2 端口一览

| 端口 | 服务 | 访问范围 |
|------|------|----------|
| 80 | Nginx HTTP | 公网 |
| 443 | Nginx HTTPS | 公网 |
| 3000 | Nuxt SSR | 仅本机 |
| 4000 | NestJS API | 仅本机 |
| 3306 | MySQL | 仅本机 |
| 6379 | Redis | 仅本机 |

### 5.3 环境变量速查

**后端 `.env.production`（路径：`/www/wwwroot/blog.hdochub.com/server/.env.production`）：**

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `NODE_ENV` | 运行环境 | `production` |
| `PORT` | 后端端口 | `4000` |
| `DATABASE_URL` | 数据库连接串 | `mysql://blog_user:密码@127.0.0.1:3306/blog_db` |
| `REDIS_HOST` | Redis 地址 | `127.0.0.1` |
| `REDIS_PORT` | Redis 端口 | `6379` |
| `REDIS_PASSWORD` | Redis 密码 | 你的密码 |
| `REDIS_DB` | Redis 数据库编号 | `0` |
| `JWT_SECRET` | JWT 密钥 | 长随机字符串 |
| `JWT_EXPIRES_IN` | Token 有效期 | `7d` |
| `JWT_REMEMBER_EXPIRES_IN` | 记住我有效期 | `30d` |
| `UPLOAD_DIR` | 上传目录 | `/www/wwwroot/blog.hdochub.com/uploads` |
| `UPLOAD_MAX_SIZE` | 上传大小限制 | `5242880`（5MB） |
| `SITE_URL` | 站点 URL | `https://blog.hdochub.com` |
| `CORS_ORIGIN` | CORS 允许的域名 | `https://blog.hdochub.com` |

**前端 `.env.production`（路径：`/www/wwwroot/blog.hdochub.com/web/.env.production`）：**

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `NUXT_PUBLIC_API_BASE` | 后端 API 地址 | `https://blog.hdochub.com/api` |
| `NUXT_PUBLIC_SITE_URL` | 站点地址 | `https://blog.hdochub.com` |

### 5.4 应急联系方式参考

| 场景 | 处理方案 |
|------|----------|
| 应用崩溃 | PM2 自动重启；查看日志定位原因；必要时回滚代码 |
| 数据库连接失败 | 检查 MySQL 状态、连接数、密码 |
| Redis 不可用 | 应用降级运行（限流/缓存失效），重启 Redis |
| 磁盘满 | 清理日志和备份，扩容磁盘 |
| SSL 证书过期 | 宝塔手动续签 |
| 被攻击 | 宝塔防火墙封 IP，开启限流，临时关闭注册 |
| 数据误删 | 从最近备份恢复 |

---

> 如运维过程中遇到文档未覆盖的问题，请联系开发团队协助排查。
