#!/bin/bash
# ============================================================
# hdochub 博客本地一键启动脚本（Mac / Linux）
# 首次运行：自动初始化全部环境
# 后续运行：跳过初始化，直接启动服务（约 10 秒）
# 如需重新初始化：./start-dev.sh --reset
# ============================================================

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

print_step() {
    echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}
print_ok()   { echo -e "${GREEN}  [完成] $1${NC}"; }
print_warn() { echo -e "${YELLOW}  [注意] $1${NC}"; }

# ========== 检查是否需要重新初始化 ==========
if [ "$1" == "--reset" ]; then
    rm -f .setup-done
    echo -e "${YELLOW}  [注意] 检测到 --reset，将重新初始化数据库${NC}"
fi

# ========== 前置检查 ==========
print_step "第 0 步：环境检查"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}  [错误] 未检测到 Docker${NC}"
    exit 1
fi
print_ok "Docker 已安装"

if ! command -v node &> /dev/null; then
    echo -e "${RED}  [错误] 未检测到 Node.js${NC}"
    exit 1
fi
print_ok "Node.js 已安装 ($(node -v))"

# ========== 启动 MySQL 和 Redis ==========
print_step "第 1 步：启动 MySQL 和 Redis"
docker compose up -d
print_ok "数据库服务已就绪"

# ========== 判断是否已初始化 ==========
if [ -f .setup-done ]; then
    echo ""
    print_warn "检测到已初始化过，直接启动服务"
    echo "  如需重新初始化：./start-dev.sh --reset"
    goto_start=true
else
    goto_start=false
fi

if [ "$goto_start" = false ]; then
# ========== 首次初始化 ==========
print_step "首次初始化：配置环境和数据库"

cd "$PROJECT_DIR/src/server"

if [ ! -f .env ]; then
    cp .env.dev .env
    print_ok "后端 .env 已生成"
fi

echo "  安装后端依赖（约 1-2 分钟）..."
npm install --silent 2>/dev/null
print_ok "后端依赖已安装"

echo "  生成 Prisma Client..."
npx prisma generate 2>/dev/null
print_ok "Prisma Client 已生成"

echo "  创建数据库表结构..."
npx prisma db push --accept-data-loss 2>/dev/null
print_ok "数据库表结构已创建"

echo "  写入初始数据..."
npm run prisma:seed 2>/dev/null
print_ok "初始数据已写入"

cd "$PROJECT_DIR/src/client"

if [ ! -f .env ]; then
    cp .env.example .env
    print_ok "前端 .env 已生成"
fi

echo "  安装前端依赖（约 1-2 分钟）..."
npm install --silent 2>/dev/null
print_ok "前端依赖已安装"

cd "$PROJECT_DIR"
echo "done" > .setup-done
print_ok "首次初始化完成，下次启动将跳过"

fi

# ========== 启动服务 ==========
print_step "第 2 步：启动服务"

cd "$PROJECT_DIR/src/server"
npm run start:dev &
SERVER_PID=$!

sleep 5

cd "$PROJECT_DIR/src/client"
npm run dev &
CLIENT_PID=$!

sleep 3
print_step "启动完成！"

echo -e "  ${CYAN}博客首页：http://localhost:3000${NC}"
echo -e "  ${CYAN}后台管理：http://localhost:3000/admin${NC}"
echo ""
echo -e "  管理员账号：${YELLOW}admin${NC}"
echo -e "  管理员密码：${YELLOW}Admin@123456${NC}"
echo ""
echo -e "  按 ${YELLOW}Ctrl+C${NC} 停止服务"

trap "kill $SERVER_PID $CLIENT_PID 2>/dev/null; echo '已停止'; exit 0" INT TERM EXIT
wait
