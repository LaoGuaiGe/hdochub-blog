# hdochub 博客项目工作流

## 项目概况

| 项目 | 内容 |
|------|------|
| 项目名称 | hdochub 个人技术博客 |
| 仓库地址 | https://github.com/LaoGuaiGe/hdochub-blog |
| 技术栈 | Nuxt3 (前端) + NestJS (后端) + MySQL + Redis |
| 部署目标 | blog.hdochub.com (Ubuntu + 宝塔面板 + PM2 + Nginx) |
| 老板角色 | 甲方，负责验收和决策，不参与技术细节操作 |
| AI 团队角色 | 产品经理、架构师、开发、测试、运维全流程执行 |

---

## 一、角色分工

### 老板
- 提需求，定方向
- 验收结果，提反馈
- 提供环境信息（GitHub Token、本机环境等）
- 不参与代码操作和排故

### AI 团队（按 agent 划分）

| 角色 | 职责 | 产出物 |
|------|------|--------|
| 产品经理 | 需求分析、PRD 文档、任务拆解 | PRD.md、TASK_LIST.md |
| 架构师 | 技术选型、数据库设计、API 设计 | tech-stack.md、database-design.md、api-design.md |
| 设计师 | UI 设计系统、页面线框图 | design-system.md、wireframes.md |
| 开发 | 前后端编码、Bug 修复 | src/ 目录全部代码 |
| 测试 | 功能测试、回归测试、最终复测 | test-cases.md、bug-report.md、test-summary.md |
| 运维 | 部署脚本、环境配置、Git 推送 | start-dev.bat、docker-compose.yml、ops-manual.md |

---

## 二、核心工作流程

### 2.1 需求到上线全流程

```
老板提需求
    │
    ▼
产品经理 → PRD + 任务拆解
    │
    ▼
架构师 → 技术方案 + API 设计 + 数据库设计
    │
    ▼
设计师 → UI 设计系统 + 线框图
    │
    ▼
开发 → 前后端编码
    │
    ▼
测试 → 功能测试（发现 Bug）
    │
    ▼
开发 → 修复 Bug
    │
    ▼
测试 → 回归测试（验证修复 + 排查新问题）
    │
    ▼
测试 → 最终全面复测（老板要求最终把关）
    │
    ▼
运维 → commit + push 到 GitHub（铁律：改完必须立即推送）
    │
    ▼
老板 → git pull 拉取代码 → 本地运行验收
```

### 2.2 Bug 修复流程

```
测试发现 Bug → 记录到 bug-report.md
    │
    ▼
开发修复 → 自测
    │
    ▼
测试回归验证
    │
    ├─ 通过 → 关闭 Bug
    │
    └─ 不通过 → 打回给开发重新修复
    │
    ▼
全部 Bug 修复后 → 最终全面复测
    │
    ▼
复测通过 → 向老板汇报（汇报内容必须先经测试确认）
    │
    ▼
运维 → commit + push 到 GitHub
```

### 2.3 向老板汇报流程

```
开发/修复完成
    │
    ▼
测试全面复测
    │
    ├─ 有问题 → 回去修，不汇报
    │
    └─ 无问题 → 向老板汇报
```

**铁律：汇报给老板的内容，必须先经过测试复测确认无问题后才能提交。**

---

## 三、运维铁律

### 3.1 Git 推送规则

1. **每次修复/改代码完成后，必须立即 commit + push 到 GitHub**
2. 老板拉不到代码 = 工作没做完
3. Token 存放位置：`/workspace/.uploads/` 目录下老板上传的 txt 文件
4. 推送命令：
   ```
   git add -A
   git commit -m "描述"
   git push https://<TOKEN>@github.com/LaoGuaiGe/hdochub-blog.git main
   git remote set-url origin https://github.com/LaoGuaiGe/hdochub-blog.git
   ```
5. 推送后立即清除 Token

### 3.2 Docker Desktop 问题处理

1. Docker Desktop 路径检测策略（按优先级）：
   - 从 `where docker` 反推 Docker Desktop.exe 路径
   - 常见安装路径检查
   - 注册表查询
   - PowerShell 全局注册表搜索
2. Docker engine 不就绪时的排查方向：
   - 检查任务栏鲸鱼图标状态
   - 首次启动 WSL2 后端可能需要重启电脑
   - 不要反复改脚本，先确认 Docker Desktop 本身是否正常运行

### 3.3 端口配置

| 服务 | 端口 | 说明 |
|------|------|------|
| 前端 (Nuxt3) | 3000 | 浏览器访问 |
| 后端 (NestJS) | 4000 | API 服务 |
| MySQL | 3307 → 3306 | Docker 映射，避免本机冲突 |
| Redis | 6380 → 6379 | Docker 映射，避免本机冲突 |

---

## 四、本地启动步骤

### 4.1 首次启动

1. 确保已安装 Node.js 和 Docker Desktop
2. 运行 `start-dev.bat`（Windows）或 `start-dev.sh`（Mac/Linux）
3. 脚本自动完成：启动 Docker → MySQL/Redis → 依赖安装 → 数据库初始化 → 前后端启动

### 4.2 日常启动

直接运行 `start-dev.bat`，脚本会跳过初始化步骤，直接启动服务

### 4.3 重置环境

```
start-dev.bat --reset
```

### 4.4 访问地址

| 页面 | 地址 |
|------|------|
| 博客首页 | http://localhost:3000 |
| 管理后台 | http://localhost:3000/admin |
| 登录页 | http://localhost:3000/login |

| 账号 | 内容 |
|------|------|
| 用户名 | admin |
| 密码 | Admin@123456 |

---

## 五、测试流程

### 5.1 测试轮次

1. **第一轮功能测试**：全面测试所有模块，记录所有 Bug
2. **第一轮回归测试**：验证 Bug 修复 + 排查新问题
3. **第二轮回归测试**：验证回归 Bug 修复 + 最终确认
4. **最终全面复测**：老板要求最终把关，所有修复逐一验证

### 5.2 测试范围

- 后端 12 个模块：认证、文章、分类、标签、评论、点赞、管理员、用户、文件上传、RSS、设置、友链
- 前端 20+ 页面：首页、登录、注册、文章详情、搜索、归档、关于、友链、用户后台、管理员后台
- 构建测试：后端编译、前端构建
- 安全测试：密码加密、JWT 黑名单、SQL 注入防护、XSS 防护、CSRF 防护

### 5.3 测试产出物

| 文档 | 路径 |
|------|------|
| 测试用例 | `/docs/test/test-cases.md` |
| 缺陷报告 | `/docs/test/bug-report.md` |
| 第一轮回归报告 | `/docs/test/regression-round1.md` |
| 第二轮回归报告 | `/docs/test/regression-round2.md` |
| 测试总结报告 | `/docs/test/test-summary.md` |
| 最终全面复测报告 | `/docs/test/final-verification.md` |

---

## 六、经验教训

### 6.1 Git 推送（最大教训）

**问题**：修复完代码只留在本地，没有 push 到 GitHub，导致老板 `git pull` 拉到的是旧代码。

**教训**：改完代码必须立即 commit + push，这是铁律。老板拉不到代码 = 工作没做完。

### 6.2 汇报前必须复测

**问题**：开发修复后直接向老板汇报，结果还有问题。

**教训**：汇报给老板的所有内容，必须先经过测试全面复测确认无问题后才能提交。

### 6.3 脚本文件完整性

**问题**：start-dev.bat 文件尾部累积了 9500 多行损坏的重复内容，导致脚本执行时反复重复流程。

**教训**：每次编辑文件后要检查文件完整性，确认没有意外追加的重复内容。

### 6.4 不要盲目改脚本

**问题**：Docker engine 不就绪，反复改脚本中的路径检测和等待逻辑，但实际问题是 Docker Desktop 本身需要重启。

**教训**：先确认问题根源是脚本还是环境，再决定改不改脚本。脚本已经能找到并启动 Docker Desktop，engine 不就绪是 Docker Desktop 本身的问题。

### 6.5 Token 管理

**问题**：老板之前上传过 GitHub Token，但运维文档只记录了"使用后已清除"，没记录 Token 的存放位置。

**教训**：Token 存放位置必须记录在运维文档中，以便后续使用。但 Token 本身使用后必须清除，不能硬编码在配置文件中。
