#!/bin/bash
# ============================================================
# hdochub 博客本地一键启动脚本（Mac / Linux）
# 老板专用：只需要装好 Docker，然后运行本脚本
# ============================================================

set -e

# 脚本所在目录（项目根目录）
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_step() {
    echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

print_ok() {
    echo -e "${GREEN}  [完成] $1${NC}"
}

print_warn() {
    echo -e "${YELLOW}  [注意] $1${NC}"
}

print_err() {
    echo -e "${RED}  [错误] $1${NC}"
}

# ========== 前置检查 ==========
print_step "第 0 步：环境检查"

if ! command -v docker &> /dev/null; then
    print_err "未检测到 Docker，请先安装 Docker Desktop"
    echo -e "  Mac:   https://docs.docker.com/desktop/install/mac-install/"
    echo -e "  Win:   https://docs.docker.com/desktop/install/windows-install/"
    echo -e "  Linux: https://docs.docker.com/engine/install/"
    exit 1
fi
print_ok "Docker 已安装"

if ! command -v node &> /dev/null; then
    print_err "未检测到 Node.js，请先安装 Node.js 18+"
    echo -e "  https://nodejs.org/"
    exit 1
fi
print_ok "Node.js 已安装 ($(node -v))"

# ========== 第 1 步：启动 MySQL 和 Redis ==========
print_step "第 1 步：启动 MySQL 和 Redis（Docker）"

docker compose up -d
# 等待 MySQL 就绪
echo "  等待 MySQL 启动..."
sleep 8
print_ok "MySQL 和 Redis 已启动"

# ========== 第 2 步：配置后端环境 ==========
print_step "第 2 步：配置后端环境"

cd "$PROJECT_DIR/src/server"

# 复制 .env 文件（如果不存在）
if [ ! -f .env ]; then
    cp .env.dev .env
    print_ok "已生成后端 .env 配置文件"
else
    print_warn ".env 已存在，跳过（如需重置请先删除 .env）"
fi

# 安装依赖
echo "  安装后端依赖（可能需要 1-2 分钟）..."
npm install --silent 2>/dev/null
print_ok "后端依赖安装完成"

# 生成 Prisma Client
echo "  生成 Prisma Client..."
npx prisma generate 2>/dev/null
print_ok "Prisma Client 已生成"

# 同步数据库表结构
echo "  创建数据库表结构..."
npx prisma db push --accept-data-loss 2>/dev/null
print_ok "数据库表结构已创建"

# 写入种子数据
echo "  写入初始数据（管理员账号、分类、设置）..."
npm run prisma:seed 2>/dev/null
print_ok "初始数据已写入"

# ========== 第 3 步：配置前端环境 ==========
print_step "第 3 步：配置前端环境"

cd "$PROJECT_DIR/src/client"

if [ ! -f .env ]; then
    cp .env.example .env
    print_ok "已生成前端 .env 配置文件"
else
    print_warn ".env 已存在，跳过"
fi

# 安装依赖
echo "  安装前端依赖（可能需要 1-2 分钟）..."
npm install --silent 2>/dev/null
print_ok "前端依赖安装完成"

# ========== 第 4 步：启动服务 ==========
print_step "第 4 步：启动服务"

# 启动后端（后台运行）
cd "$PROJECT_DIR/src/server"
npm run start:dev &
SERVER_PID=$!
echo "  后端启动中... (PID: $SERVER_PID)"

# 等待后端就绪
sleep 5

# 启动前端
cd "$PROJECT_DIR/src/client"
npm run dev &
CLIENT_PID=$!
echo "  前端启动中... (PID: $CLIENT_PID)"

# ========== 完成 ==========
sleep 3
print_step "启动完成！"

echo -e "${GREEN}  博客已启动，请在浏览器访问：${NC}"
echo -e ""
echo -e "  ${CYAN}博客首页：  http://localhost:3000${NC}"
echo -e "  ${CYAN}后台管理：  http://localhost:3000/admin${NC}"
echo -e ""
echo -e "  管理员账号：${YELLOW}admin${NC}"
echo -e "  管理员密码：${YELLOW}Admin@123456${NC}"
echo -e ""
echo -e "  按 ${YELLOW}Ctrl+C${NC} 停止所有服务"
echo -e ""

# 捕获退出信号，清理子进程
trap "kill $SERVER_PID $CLIENT_PID 2>/dev/null; echo '已停止'; exit 0" INT TERM EXIT

wait
